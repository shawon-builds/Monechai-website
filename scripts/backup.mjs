// Encrypted app-schema + referenced product-byte export. Auth/bucket policy recovery
// and independent off-site upload/scheduling require the chosen backend/host runbook.
import postgres from "postgres";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { backupPassword, encryptFile, hashFile, pgTool } from "./backup-tools.mjs";
import { createHash } from "node:crypto";

let temp, output, succeeded = false;
try {
  const password = backupPassword(), raw = process.env.BACKUP_DATABASE_URL;
  if (!raw || !process.env.BACKUP_OUTPUT_DIR) throw new Error("Configure BACKUP_DATABASE_URL and BACKUP_OUTPUT_DIR");
  const target = new URL(raw), local = process.argv.includes("--local");
  if (local && (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || target.pathname !== "/monechai_test")) throw new Error("Local backup only permits /monechai_test");
  temp = await mkdtemp(join(tmpdir(), "monechai-backup-"));
  output = resolve(process.env.BACKUP_OUTPUT_DIR, `snapshot-${Date.now()}-${crypto.randomUUID()}`);
  await mkdir(output, { recursive: true, mode: 0o700 });
  const sql = postgres(raw, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 1, connect_timeout: 10 });
  try {
    await sql.begin("isolation level repeatable read read only", async tx => {
      const [{ snapshot }] = await tx`select pg_export_snapshot() as snapshot`;
      const images = await tx`select storage_key,content_hash from product_images where storage_key is not null order by storage_key`;
      const tables = await tx`select tablename from pg_tables where schemaname='public' order by tablename`;
      const counts = {};
      for (const { tablename } of tables) counts[tablename] = Number((await tx`select count(*) as n from public.${tx(tablename)}`)[0].n);
      await pgTool("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--schema=public", "--schema=drizzle", `--snapshot=${snapshot}`, "--file=/backup/database.dump"], temp, raw);
      const databaseHash = await hashFile(join(temp, "database.dump"));
      await encryptFile(join(temp, "database.dump"), join(output, "database.enc"), password);
      const files = [];
      for (const [index, image] of images.entries()) {
        if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/i.test(image.storage_key) || !/^[0-9a-f]{64}$/i.test(image.content_hash || "")) throw new Error("Unverified referenced photo prevents a complete backup");
        const origin = new URL(process.env.BACKUP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "");
        if (origin.pathname !== "/" || origin.username || origin.password || origin.search || origin.hash || (!local && origin.protocol !== "https:")) throw new Error("Configure the approved Supabase HTTPS origin");
        const response = await fetch(new URL(`/storage/v1/object/public/products/${image.storage_key}`, origin), { signal: AbortSignal.timeout(15000), redirect: "error" });
        if (!response.ok || !response.body) throw new Error("Referenced photo unavailable; backup incomplete");
        const chunks = []; let size = 0;
        for await (const chunk of response.body) { size += chunk.length; if (size > 5 * 1024 * 1024) throw new Error("Photo exceeds bounded export size"); chunks.push(chunk); }
        const bytes = Buffer.concat(chunks);
        if (createHash("sha256").update(bytes).digest("hex") !== image.content_hash) throw new Error("Referenced photo hash mismatch; backup incomplete");
        const file = `photo-${index}.enc`, plain = join(temp, "photo.webp");
        await writeFile(plain, bytes, { mode: 0o600 }); await encryptFile(plain, join(output, file), password);
        files.push({ key: image.storage_key, hash: image.content_hash, file });
      }
      await writeFile(join(temp, "manifest.json"), JSON.stringify({ version: 1, createdAt: new Date().toISOString(), scope: "public+drizzle application schemas and referenced product bytes; excludes Supabase Auth/bucket policies", counts, databaseHash, files }), { mode: 0o600 });
      await encryptFile(join(temp, "manifest.json"), join(output, "manifest.enc"), password);
    });
  } finally { await sql.end(); }
  succeeded = true;
  console.log(`Encrypted application snapshot complete: ${output}`);
  console.log("Copy to the independent destination, verify transfer and retention, and test restore. Auth/bucket policy/provider recovery is separate.");
} catch { console.error("Backup failed; no completed snapshot. Check configuration, referenced photo integrity and scoped permissions privately."); process.exitCode = 1; }
finally { if (temp) await rm(temp, { recursive: true, force: true }); if (output && !succeeded) await rm(output, { recursive: true, force: true }); }
