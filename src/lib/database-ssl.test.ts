import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { getDatabaseEnv } from "./env";

test("actual database client uses configured CA with certificate verification and preserves local TLS modes", () => {
  const saved = Object.fromEntries(["DATABASE_URL", "DATABASE_SSL", "DATABASE_SSL_CA"].map(name => [name, process.env[name]]));
  const source = ts.transpileModule(readFileSync("src/db/client.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const ca = "-----BEGIN CERTIFICATE-----\nlocal-fixture-only\n-----END CERTIFICATE-----";
  try {
    process.env.DATABASE_URL = "postgresql://fixture-only@127.0.0.1/monechai_test";
    for (const mode of ["ca", "require", "disable"] as const) {
      process.env.DATABASE_SSL = mode === "disable" ? "disable" : "require";
      if (mode === "ca") process.env.DATABASE_SSL_CA = ca; else delete process.env.DATABASE_SSL_CA;
      let options: { ssl?: unknown; prepare?: boolean } | undefined;
      const exports: { getDb?: () => unknown } = {};
      const modules: Record<string, unknown> = {
        "server-only": {}, "@/lib/env": { getDatabaseEnv },
        "postgres": (_url: string, value: typeof options) => { options = value; return {}; },
        "drizzle-orm/postgres-js": { drizzle: () => ({ localFixture: true }) },
      };
      new Function("require", "exports", source)((name: string) => {
        assert.ok(Object.hasOwn(modules, name), name); return modules[name];
      }, exports);
      exports.getDb!();
      assert.deepEqual(options?.ssl, mode === "ca" ? { ca, rejectUnauthorized: true } : mode === "disable" ? false : "require");
      assert.equal(options?.prepare, false);
    }
    process.env.DATABASE_SSL_CA = "";
    assert.throws(getDatabaseEnv, /Invalid database environment: DATABASE_SSL_CA/);
  } finally {
    for (const [name,value] of Object.entries(saved)) if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
});
