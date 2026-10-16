import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { getSupabaseConfig } from "./supabase/config";
import { isPublicSupabaseKey, validatePublicSupabaseKeys } from "./supabase/public-key.mjs";

const jwt = (role: string, alg = "HS256") => [Buffer.from(JSON.stringify({ alg, typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ role, ref: "dummy-project" })).toString("base64url"), "dummy_signature"].join(".");
const publicKeys = ["sb_publishable_dummy_fixture", jwt("anon")];
const rejected = ["sb_secret_dummy_fixture", jwt("service_role"), jwt("authenticated"), jwt("anon", "none"), "opaque-unclassified-fixture", "a.b.c", "sb_publishable_", `${jwt("anon")}\n`];

test("public Supabase classification accepts publishable and legacy anon and rejects privileged/malformed fixtures", () => {
  for (const key of publicKeys) assert.equal(isPublicSupabaseKey(key), true);
  for (const key of [...rejected, undefined, null]) assert.equal(isPublicSupabaseKey(key), false);
});

test("normal Supabase config enforces the same key classes without exposing rejected values", () => {
  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, savedKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://dummy.supabase.co";
    for (const key of [...publicKeys, ...rejected]) {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = key;
      if (publicKeys.includes(key)) assert.deepEqual(getSupabaseConfig(), { url: "https://dummy.supabase.co", key });
      else assert.throws(getSupabaseConfig, error => error instanceof Error && !error.message.includes(key) && /Expected a Supabase/.test(error.message));
    }
  } finally {
    if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
    if (savedKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = savedKey;
  }
});

test("build validation rejects privileged keys in canonical and alternate NEXT_PUBLIC Supabase key names", () => {
  validatePublicSupabaseKeys({});
  validatePublicSupabaseKeys({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_dummy_fixture" });
  for (const key of publicKeys) validatePublicSupabaseKeys({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, NEXT_PUBLIC_SUPABASE_ANON_KEY: key });
  for (const name of ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"]) {
    for (const key of rejected) assert.throws(() => validatePublicSupabaseKeys({ [name]: key }));
  }
});

test("direct Next build refuses privileged public fixtures before compilation and never logs their values", () => {
  for (const [name, key] of [["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_dummy_build_marker"], ["NEXT_PUBLIC_SUPABASE_ANON_KEY", jwt("service_role")]]) {
    const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
      env: { NODE_ENV: "production", PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR, NEXT_TELEMETRY_DISABLED: "1", [name]: key }, encoding: "utf8", timeout: 15000,
    });
    assert.ifError(result.error);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /Expected a Supabase publishable or legacy anon key/);
    assert.ok(!(result.stdout + result.stderr).includes(key));
    assert.ok(!(result.stdout + result.stderr).includes("Creating an optimized production build"));
  }
});

test("Next dotenv loading cannot bypass public-key rejection at the build boundary", async () => {
  const { mkdtemp, mkdir, copyFile, writeFile, symlink, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join, resolve } = await import("node:path");
  const root = await mkdtemp(join(tmpdir(), "supabase-build-config-"));
  const marker = "sb_secret_dummy_dotenv_marker";
  try {
    await mkdir(join(root, "src/lib/supabase"), { recursive: true });
    await mkdir(join(root, "app"));
    await copyFile("next.config.ts", join(root, "next.config.ts"));
    await copyFile("src/lib/supabase/public-key.mjs", join(root, "src/lib/supabase/public-key.mjs"));
    await symlink(resolve("node_modules"), join(root, "node_modules"));
    await writeFile(join(root, ".env.production"), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${marker}\n`);
    const result = spawnSync(process.execPath, [resolve("node_modules/next/dist/bin/next"), "build", root], {
      env: { NODE_ENV: "production", PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR, NEXT_TELEMETRY_DISABLED: "1" }, encoding: "utf8", timeout: 15000,
    });
    assert.ifError(result.error);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /Expected a Supabase publishable or legacy anon key/);
    assert.ok(!(result.stdout + result.stderr).includes(marker));
  } finally { await rm(root, { recursive: true, force: true }); }
});
