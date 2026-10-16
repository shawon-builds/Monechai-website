import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postgres from "postgres";
const url = process.env.DATABASE_URL;
test("Storage SQL policies require owner membership and AAL2, reject outsiders and revoke writes on membership deletion", { skip: !url }, async () => {
  const client = postgres(url!, { ssl: false, max: 1 });
  const owner = crypto.randomUUID(), outsider = crypto.randomUUID(), product = crypto.randomUUID();
  try {
    await assert.rejects(client.begin(async tx => {
      await tx.unsafe("create role anon nologin; create role authenticated nologin");
      await tx.unsafe("create schema auth; create schema storage; create table auth.users(id uuid primary key); create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text); alter table storage.objects enable row level security; grant usage on schema storage to anon,authenticated; grant select,insert,update,delete on storage.objects to anon,authenticated");
      await tx.unsafe("create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$");
      await tx.unsafe("create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$");
      await tx`insert into auth.users(id) values(${owner}),(${outsider})`;
      await tx`insert into admin_members(user_id) values(${owner})`;
      const [category] = await tx`insert into categories(slug,name_en) values(${`policy-${crypto.randomUUID()}`},'Fixture') returning id`;
      await tx`insert into products(id,slug,sku,category_id,name_en,price_minor) values(${product},${`policy-${crypto.randomUUID()}`},${crypto.randomUUID()},${category.id},'Fixture',1000)`;
      await tx.unsafe(readFileSync('ops/supabase-storage.sql','utf8'));
      await tx.unsafe("create policy legacy_overbroad on storage.objects for all to public using(bucket_id='products') with check(bucket_id='products')");
      const key = `${product}/${crypto.randomUUID()}.webp`;
      await tx.unsafe("set local role anon");
      await assert.rejects(tx.savepoint(sp => sp`insert into storage.objects(bucket_id,name) values('products',${key})`), /row-level security/);
      await tx.unsafe("set local role authenticated");
      await tx`select set_config('request.jwt.claims','{"aal":"aal2"}',true)`;
      await tx`select set_config('request.jwt.claim.sub',${outsider},true)`;
      await assert.rejects(tx.savepoint(sp => sp`insert into storage.objects(bucket_id,name) values('products',${key})`), /row-level security/);
      await tx`select set_config('request.jwt.claim.sub',${owner},true)`;
      await tx`select set_config('request.jwt.claims','{"aal":"aal1"}',true)`;
      await assert.rejects(tx.savepoint(sp => sp`insert into storage.objects(bucket_id,name) values('products',${key})`), /row-level security/);
      await tx`select set_config('request.jwt.claims','{"aal":"aal2"}',true)`;
      await tx`insert into storage.objects(bucket_id,name) values('products',${key})`;
      assert.equal((await tx`update storage.objects set name=name where name=${key} returning *`).length,0); // immutable keys, even with legacy allow-all
      await tx.unsafe("set local role anon");
      assert.equal((await tx`select * from storage.objects where name=${key}`).length,1); // public photos still work
      assert.equal((await tx`delete from storage.objects where name=${key} returning *`).length,0);
      await tx.unsafe("set local role authenticated");
      await tx`select set_config('request.jwt.claims','{"aal":"aal1"}',true)`;
      assert.equal((await tx`delete from storage.objects where name=${key} returning *`).length,0);
      await tx`select set_config('request.jwt.claims','{"aal":"aal2"}',true)`;
      await assert.rejects(tx.savepoint(sp => sp`insert into storage.objects(bucket_id,name) values('products',${`${crypto.randomUUID()}/${crypto.randomUUID()}.webp`})`), /row-level security/);
      await tx.unsafe("reset role"); await tx`delete from admin_members where user_id=${owner}`;
      await tx.unsafe("set local role authenticated");
      assert.equal((await tx`delete from storage.objects where name=${key} returning *`).length,0);
      throw new Error("rollback policy fixture");
    }), /rollback policy fixture/);
  } finally { await client.end(); }
});
