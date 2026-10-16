import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";
import sharp from "sharp";

const raw = process.env.TEST_DATABASE_URL;
if (!raw) throw new Error("Set isolated TEST_DATABASE_URL");
const url = new URL(raw);
if (!['127.0.0.1','localhost'].includes(url.hostname) || url.pathname !== '/monechai_test') throw new Error("Only isolated local monechai_test is permitted");
const root = await mkdtemp(join(tmpdir(), "monechai-ops-drill-"));
const client = postgres(raw, { ssl: false, max: 2 });
const restoredUrl = new URL(raw); restoredUrl.pathname = "/monechai_restore_test";
let categoryId, productId, created = false, server;
async function run(file, env, args = [], expected = 0) {
  const child = spawn(process.execPath, [file, ...args], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  let output = ""; child.stdout.on("data", chunk => { output += chunk; }); child.stderr.on("data", chunk => { output += chunk; });
  const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", resolve); });
  assert.equal(code, expected, output); return output;
}
try {
  if ((await client`select datname from pg_database where datname='monechai_restore_test'`).length) throw new Error("Existing restore DB found; refuse to overwrite it");
  await client.unsafe("CREATE DATABASE monechai_restore_test"); created = true;
  const slug = `backup-${randomUUID()}`;
  [{ id: categoryId }] = await client`insert into categories(slug,name_en) values(${slug},'Backup fixture') returning id`;
  [{ id: productId }] = await client`insert into products(slug,sku,category_id,name_en,price_minor) values(${slug},${slug},${categoryId},'Backup fixture product',12000) returning id`;
  const key = `${productId}/${randomUUID()}.webp`;
  const bytes = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#c9a36c" } }).webp().toBuffer();
  await client`insert into product_images(product_id,storage_key,alt_en,is_primary,verified_at,content_hash) values(${productId},${key},'Fixture pixels',true,now(),${createHash('sha256').update(bytes).digest('hex')})`;
  server = createServer((request, response) => {
    if (request.url !== `/storage/v1/object/public/products/${key}`) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { "Content-Type": "image/webp" }); response.end(bytes);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const env = { DATABASE_SSL: "disable", BACKUP_DATABASE_URL: raw, BACKUP_OUTPUT_DIR: join(root, "snapshots"), BACKUP_SUPABASE_URL: `http://127.0.0.1:${server.address().port}`, BACKUP_ENCRYPTION_PASSWORD: "test-only backup encryption phrase 2026" };
  console.log("Exporting encrypted app database and actual decoded fixture photo…");
  await run("scripts/backup.mjs", env, ["--local"]);
  const [snapshot] = await readdir(env.BACKUP_OUTPUT_DIR);
  const restore = { ...env, RESTORE_TEST_DATABASE_URL: restoredUrl.toString(), RESTORE_SNAPSHOT_DIR: join(env.BACKUP_OUTPUT_DIR, snapshot), RESTORE_PHOTO_DIR: join(root, "restored-photos") };
  const output = await run("scripts/restore-drill.mjs", restore); console.log(output.trim());
  assert.deepEqual(await readFile(join(restore.RESTORE_PHOTO_DIR, key)), bytes);
  const restored = postgres(restoredUrl.toString(), { ssl: false, max: 1 });
  try { assert.equal((await restored`select name_en from products where id=${productId}`)[0].name_en, "Backup fixture product"); }
  finally { await restored.end(); }
  await run("scripts/restore-drill.mjs", restore, [], 1); // nonempty target is refused
  await run("scripts/restore-drill.mjs", { ...restore, RESTORE_TEST_DATABASE_URL: raw }, [], 1); // original DB is refused
  console.log("PASS: app DB/photo roundtrip, byte integrity, nonempty/original-target refusal. No production or off-site provider used.");
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (productId) await client`delete from products where id=${productId}`;
  if (categoryId) await client`delete from categories where id=${categoryId}`;
  if (created) await client.unsafe("DROP DATABASE monechai_restore_test");
  await client.end(); await rm(root, { recursive: true, force: true });
}
