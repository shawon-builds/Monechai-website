import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { allowRequest } from "../checkout/abuse";

const url = process.env.DATABASE_URL;
test("every app table denies client roles, even if accidentally granted later", { skip: !url }, async () => {
  const client = postgres(url!, { ssl: false, max: 1 });
  const role = `test_api_${crypto.randomUUID().replaceAll("-", "")}`;
  try {
    await assert.rejects(client.begin(async (tx) => {
      await tx.unsafe(`create role ${role} nologin`);
      await tx.unsafe(`grant usage on schema public to ${role}`);
      const tables = await tx`select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'`;
      assert.ok(tables.length >= 12);
      for (const table of tables) assert.equal(table.relrowsecurity, true, table.relname);
      await tx.unsafe(`grant select, insert, update, delete on all tables in schema public to ${role}`);
      await tx.unsafe(`set local role ${role}`);
      for (const table of tables) {
        assert.equal((await tx.unsafe(`select * from ${table.relname}`)).length, 0);
        assert.equal((await tx.unsafe(`update ${table.relname} set ${table.relname === "admin_members" ? "user_id=user_id" : table.relname === "request_limits" ? "key=key" : (table.relname === "shipping_zones" || table.relname === "delivery_areas") ? "code=code" : "id=id"} returning *`)).length, 0);
        assert.equal((await tx.unsafe(`delete from ${table.relname} returning *`)).length, 0);
      }
      await assert.rejects(tx.savepoint(async (sp) => sp`insert into site_settings(id,store_name) values(1,'Attack')`), /row-level security/);
      throw new Error("rollback permission fixture");
    }), /rollback permission fixture/);
  } finally { await client.end(); }
});

test("durable request limits isolate customers and count concurrent workers atomically", { skip: !url }, async () => {
  const client = postgres(url!, { ssl: false, max: 8 });
  const db = drizzle({ client });
  const scope = `test-${crypto.randomUUID()}`;
  try {
    const results = await Promise.all(Array.from({ length: 12 }, () => allowRequest(scope, "customer-a", 5, 60000, db, 1000)));
    assert.equal(results.filter(Boolean).length, 5);
    assert.equal(await allowRequest(scope, "customer-b", 5, 60000, db, 1000), true);
    assert.equal(await allowRequest(scope, "customer-a", 5, 60000, db, 62000), true);
  } finally { await client`delete from request_limits`; await client.end(); }
});
