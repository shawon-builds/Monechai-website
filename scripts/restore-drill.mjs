// Destructive restoration is confined to a new, empty, explicitly named local drill DB.
import postgres from "postgres";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { backupPassword, decryptFile, hashFile, pgTool, readManifest } from "./backup-tools.mjs";
let temp;
try {
  const password = backupPassword(), raw = process.env.RESTORE_TEST_DATABASE_URL, input = process.env.RESTORE_SNAPSHOT_DIR, output = process.env.RESTORE_PHOTO_DIR;
  if (!raw || !input || !output) throw new Error("Configure isolated restore drill values");
  const target = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(target.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || target.pathname !== "/monechai_restore_test") throw new Error("Only local /monechai_restore_test is permitted");
  const sql = postgres(raw, { ssl: false, max: 1, connect_timeout: 5 });
  try {
    if ((await sql`select tablename from pg_tables where schemaname in ('public','drizzle')`).length) throw new Error("Restore target must be empty; never overwrite an existing database");
    temp = await mkdtemp(join(tmpdir(), "monechai-restore-"));
    await decryptFile(resolve(input, "manifest.enc"), join(temp, "manifest.json"), password);
    const manifest = await readManifest(join(temp, "manifest.json"));
    if (manifest.version !== 1) throw new Error("Unsupported snapshot");
    await decryptFile(resolve(input, "database.enc"), join(temp, "database.dump"), password);
    if (await hashFile(join(temp, "database.dump")) !== manifest.databaseHash) throw new Error("Database snapshot integrity failure");
    // Authenticate all files before writing either restored DB or owner-controlled photo directory.
    for (const [index, image] of manifest.files.entries()) {
      if (!/^photo-\d+\.enc$/.test(image.file) || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/i.test(image.key)) throw new Error("Invalid photo manifest path");
      await decryptFile(resolve(input, image.file), join(temp, `photo-${index}.webp`), password);
      if (await hashFile(join(temp, `photo-${index}.webp`)) !== image.hash) throw new Error("Photo snapshot integrity failure");
    }
    await mkdir(output, { recursive: false, mode: 0o700 }); // Refuse a previously existing photo target.
    await pgTool("pg_restore", ["--exit-on-error", "--single-transaction", "--clean", "--if-exists", "--no-owner", "--no-privileges", `--dbname=${target.pathname.slice(1)}`, "/backup/database.dump"], temp, raw);
    for (const [table, expected] of Object.entries(manifest.counts)) {
      if (!/^[a-z_][a-z0-9_]*$/.test(table)) throw new Error("Invalid table manifest");
      if (Number((await sql`select count(*) as n from public.${sql(table)}`)[0].n) !== expected) throw new Error("Restored table count mismatch");
    }
    const { copyFile } = await import("node:fs/promises");
    for (const [index, image] of manifest.files.entries()) {
      const destination = resolve(output, image.key); await mkdir(resolve(destination, ".."), { recursive: true, mode: 0o700 });
      await copyFile(join(temp, `photo-${index}.webp`), destination);
    }
    console.log(`Restore drill passed: ${Object.keys(manifest.counts).length} application tables and ${manifest.files.length} verified product photos.`);
    console.log("Isolated app-data drill only; actual Supabase identity/bucket policies, off-site transfer, RPO/RTO and cutover still require provider acceptance.");
  } finally { await sql.end(); }
} catch { console.error("Restore drill failed; production was not touched. Inspect the isolated target before retrying."); process.exitCode = 1; }
finally { if (temp) await rm(temp, { recursive: true, force: true }); }
