import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const raw = process.env.TEST_DATABASE_URL;
test("preflight separates restricted runtime readiness from operator migration history", { skip: !raw }, async (t) => {
  const url = new URL(raw);
  assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname));
  assert.equal(url.pathname, "/monechai_test", "Never create permission fixtures on a shared database");
  const suffix = randomUUID().replaceAll("-", "");
  const runtimeRole = `runtime_${suffix}`, operatorRole = `history_${suffix}`;
  const client = postgres(raw, { ssl: false, max: 1, onnotice: () => {} });
  const roleUrl = (role) => { const copy = new URL(raw); copy.username = role; copy.password = "fixture-only"; return copy.toString(); };
  const runtimeUrl = roleUrl(runtimeRole), operatorUrl = roleUrl(operatorRole);
  const runtime = postgres(runtimeUrl, { ssl: false, max: 1 });
  const operator = postgres(operatorUrl, { ssl: false, max: 1 });
  const root = await mkdtemp(join(tmpdir(), "monechai-preflight-"));
  const createdSchemas = [];
  const before = await client`select id,hash,created_at from drizzle.__drizzle_migrations order by id`;
  function run(args = [], overrides = {}, expected = 0) {
    const env = { DATABASE_SSL: "disable", DATABASE_URL: runtimeUrl, DIRECT_URL: operatorUrl, ...overrides };
    for (const name of Object.keys(env)) if (env[name] === undefined) delete env[name];
    const result = spawnSync(process.execPath, [join(root, "scripts/preflight.mjs"), "--local", ...args], { env, encoding: "utf8", timeout: 15000 });
    assert.ifError(result.error);
    const output = result.stdout + result.stderr;
    assert.equal(result.status, expected, output);
    assert.ok(!output.includes("fixture-only"), "No credentials in output");
    if (expected !== 0) assert.ok(!output.includes("PASS: full release preflight"));
    return output;
  }
  try {
    // Artifact stubs isolate CLI permission tests; the actual build is verified separately.
    for (const path of ["scripts", "src/lib/supabase", "src/db/migrations/meta", ".next/standalone/public", ".next/standalone/.next/static"]) await mkdir(join(root, path), { recursive: true });
    for (const path of ["scripts/preflight.mjs", "src/lib/supabase/public-key.mjs", ".nvmrc", "src/db/migrations/meta/_journal.json"]) await writeFile(join(root, path), await readFile(path));
    for (const path of [".next/standalone/server.js", ".next/standalone/public/monechai-logo.svg"]) await writeFile(join(root, path), "permission-test artifact stub");
    await symlink(join(process.cwd(), "node_modules"), join(root, "node_modules"));
    for (const schema of ["auth", "storage"]) {
      if (!(await client`select 1 from pg_namespace where nspname=${schema}`).length) {
        await client.unsafe(`create schema ${schema}`); createdSchemas.push(schema);
      }
    }
    await client.unsafe(`create role ${runtimeRole} login password 'fixture-only' nosuperuser nocreatedb nocreaterole noinherit nobypassrls`);
    await client.unsafe(`create role ${operatorRole} login password 'fixture-only' nosuperuser nocreatedb nocreaterole noinherit nobypassrls`);
    // Apply the reviewed production runtime artifact, adapting only role/database names.
    await client.unsafe((await readFile("ops/supabase-runtime.sql", "utf8")).replaceAll("monechai_runtime", runtimeRole).replace("GRANT CONNECT ON DATABASE postgres", "GRANT CONNECT ON DATABASE monechai_test"));
    await client.unsafe(`grant connect on database monechai_test to ${operatorRole}; grant usage on schema drizzle to ${operatorRole}; grant select on drizzle.__drizzle_migrations to ${operatorRole}`);

    await t.test("intended runtime privileges allow application reads but deny protected access and writes", async () => {
      const [role] = await client`select rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolbypassrls from pg_roles where rolname=${runtimeRole}`;
      assert.deepEqual({ ...role }, { rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolinherit: false, rolbypassrls: false });
      assert.equal((await runtime`select current_user as role`)[0].role, runtimeRole);
      assert.equal((await runtime`select id from site_settings where id=1`).length, 1);
      assert.ok(await runtime`select user_id from admin_members limit 0`);
      for (const schema of ["auth", "storage", "drizzle"]) assert.equal((await client`select has_schema_privilege(${runtimeRole},${schema},'USAGE') as allowed`)[0].allowed, false);
      for (const query of ["select * from drizzle.__drizzle_migrations", "delete from drizzle.__drizzle_migrations where false", "create table auth.mon002_denied(id int)", "create table storage.mon002_denied(id int)", "update admin_members set user_id=user_id where false", "create table public.mon002_denied(id int)"]) {
        await assert.rejects(runtime.unsafe(query), (error) => error.code === "42501", query);
      }
    });
    await t.test("runtime-only succeeds without history credentials and ignores an invalid operator URL", () => {
      for (const direct of [undefined, "not-a-database-url"]) {
        const output = run(["--runtime-only"], { DIRECT_URL: direct });
        assert.match(output, /runtime config\/artifact\/schema readiness/);
        assert.match(output, /Migration history NOT VERIFIED/);
        assert.ok(!output.includes("operator migration history"));
      }
    });
    await t.test("operator-only succeeds with metadata SELECT and no runtime credential", async () => {
      assert.equal((await operator`select count(*)::int as n from drizzle.__drizzle_migrations`)[0].n, before.length);
      await assert.rejects(operator`delete from drizzle.__drizzle_migrations where false`, (error) => error.code === "42501");
      await assert.rejects(operator`select id from site_settings`, (error) => error.code === "42501");
      const output = run(["--migrations-only"], { DATABASE_URL: undefined });
      assert.match(output, /PASS: operator migration history/);
      assert.ok(!output.includes("runtime config/artifact/schema readiness"));
      assert.match(run(), /PASS: full release preflight/);
    });
    await t.test("runtime preflight rejects privileged public-key fixtures without logging them", () => {
      const serviceRole = [Buffer.from('{"alg":"HS256"}').toString("base64url"), Buffer.from('{"role":"service_role"}').toString("base64url"), "dummy_signature"].join(".");
      for (const [name, key] of [["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_dummy_preflight_marker"], ["NEXT_PUBLIC_SUPABASE_ANON_KEY", serviceRole]]) {
        const output = run(["--runtime-only"], { [name]: key }, 1);
        assert.match(output, /Expected a Supabase publishable or legacy anon key/);
        assert.ok(!output.includes(key));
      }
      assert.match(run(["--runtime-only"], { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_dummy_fixture" }), /runtime config\/artifact\/schema readiness/);
    });
    await t.test("missing, denied, invalid and unreachable operator credentials fail full preflight", () => {
      for (const direct of [undefined, runtimeUrl, "not-a-database-url", "postgresql://fixture-only@127.0.0.1:1/monechai_test"]) run([], { DIRECT_URL: direct }, 1);
      run(["--migrations-only"], { DIRECT_URL: undefined }, 1);
    });
    await t.test("missing or denied runtime credentials never fall back to the operator", () => {
      for (const database of [undefined, operatorUrl]) {
        run([], { DATABASE_URL: database }, 1);
        run(["--runtime-only"], { DATABASE_URL: database }, 1);
      }
    });
    await t.test("operator detects journal mismatch without altering database history", async () => {
      const journal = JSON.parse(await readFile("src/db/migrations/meta/_journal.json", "utf8"));
      journal.entries.pop();
      await writeFile(join(root, "src/db/migrations/meta/_journal.json"), JSON.stringify(journal));
      assert.match(run(["--migrations-only"], {}, 1), /Migration count differs from reviewed journal/);
      assert.match(run([], {}, 1), /Migration count differs from reviewed journal/);
      assert.deepEqual(await client`select id,hash,created_at from drizzle.__drizzle_migrations order by id`, before);
    });
    await t.test("local guards apply to both credentials and ambiguous modes fail", () => {
      run(["--migrations-only"], { DIRECT_URL: "postgresql://fixture-only@production.invalid/monechai_test" }, 1);
      run(["--migrations-only"], { DIRECT_URL: "postgresql://fixture-only@127.0.0.1/postgres" }, 1);
      run(["--runtime-only"], { DATABASE_URL: "postgresql://fixture-only@production.invalid/monechai_test" }, 1);
      run(["--runtime-only", "--migrations-only"], {}, 1);
      run(["--runtime-onl"], {}, 1);
    });
    await t.test("production runtime gate refuses unconfigured trusted ingress before any live connection", () => {
      const result = spawnSync(process.execPath, [join(root, "scripts/preflight.mjs"), "--runtime-only"], { env: { DATABASE_SSL: "require" }, encoding: "utf8", timeout: 15000 });
      assert.ifError(result.error);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Production checkout requires CHECKOUT_TRUST_PROXY_IP_HEADER=true/);
      assert.ok(!result.stdout.includes("PASS:"));
    });
  } finally {
    await runtime.end(); await operator.end();
    for (const role of [runtimeRole, operatorRole]) {
      await client.unsafe(`drop owned by ${role}`);
      await client.unsafe(`drop role ${role}`);
    }
    for (const schema of createdSchemas) await client.unsafe(`drop schema ${schema}`);
    await client.end(); await rm(root, { recursive: true, force: true });
  }
});
