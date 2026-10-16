import { test } from "node:test";
import assert from "node:assert/strict";
import braces from "braces";
test("tooling rejects hostile brace/parenthesis nesting before recursive compilation without breaking ordinary glob expansion", () => {
  assert.deepEqual(braces.expand("src/{app,features}/**/*.ts"), ["src/app/**/*.ts", "src/features/**/*.ts"]);
  for (const [open, close] of [["{", "}"], ["(", ")"]]) {
    const hostile = open.repeat(3000) + "x" + close.repeat(3000);
    for (const method of [braces.compile, braces.expand]) assert.throws(() => method(hostile), /Pattern nesting exceeds reviewed limit/);
  }
  assert.doesNotThrow(() => braces.compile("{".repeat(32) + "x" + "}".repeat(32)));
});

test("toolchain consumers preserve ordinary brace, range, extglob and array patterns", async () => {
  const { default: micromatch } = await import("micromatch");
  assert.deepEqual(braces.expand("file{1..3}.{ts,tsx}"), ["file1.ts", "file1.tsx", "file2.ts", "file2.tsx", "file3.ts", "file3.tsx"]);
  assert.deepEqual(micromatch(["src/app/page.tsx", "src/features/cart.ts", "src/lib/test.mjs"], ["src/{app,features}/**/*.{ts,tsx}"]), ["src/app/page.tsx", "src/features/cart.ts"]);
  assert.ok(micromatch.isMatch("src/page.tsx", "src/*.@(ts|tsx)"));
});

test("all string-pattern braces entrypoints reject excessive nesting including array input", () => {
  const hostile = "{".repeat(3000) + "x" + "}".repeat(3000);
  for (const method of [braces, braces.parse, braces.stringify, braces.create]) assert.throws(() => method(hostile), /Pattern nesting exceeds reviewed limit/);
  assert.throws(() => braces(["{a,b}", hostile]), /Pattern nesting exceeds reviewed limit/);
});

test("reviewed mitigation is idempotent and refuses altered vendor source, version or lock layout", async () => {
  const { mkdtemp, mkdir, readFile, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join, resolve } = await import("node:path");
  const { spawnSync } = await import("node:child_process");
  const root = await mkdtemp(join(tmpdir(), "braces-integrity-"));
  const script = resolve("scripts/patch-braces.mjs");
  try {
    await mkdir(join(root, "node_modules/braces/lib"), { recursive: true });
    const lock = { packages: { "node_modules/braces": { version: "3.0.3" } } };
    const source = await readFile("node_modules/braces/lib/parse.js", "utf8");
    await writeFile(join(root, "node_modules/braces/lib/parse.js"), source);
    await writeFile(join(root, "node_modules/braces/package.json"), JSON.stringify({ version: "3.0.3" }));
    await writeFile(join(root, "package-lock.json"), JSON.stringify(lock));
    const run = () => spawnSync(process.execPath, [script], { cwd: root, env: {}, encoding: "utf8", timeout: 5000 });
    for (let i = 0; i < 2; i++) { const result = run(); assert.ifError(result.error); assert.equal(result.status, 0, result.stderr); }
    assert.equal(await readFile(join(root, "node_modules/braces/lib/parse.js"), "utf8"), source);
    await writeFile(join(root, "node_modules/braces/lib/parse.js"), source + "\n// altered vendor\n");
    assert.match(run().stderr, /Unexpected braces vendor source/);
    await writeFile(join(root, "node_modules/braces/lib/parse.js"), source);
    await writeFile(join(root, "node_modules/braces/package.json"), JSON.stringify({ version: "3.0.4" }));
    assert.match(run().stderr, /changed vendor version/);
    lock.packages["node_modules/other/node_modules/braces"] = { version: "3.0.3" };
    await writeFile(join(root, "package-lock.json"), JSON.stringify(lock));
    assert.match(run().stderr, /dependency layout/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
