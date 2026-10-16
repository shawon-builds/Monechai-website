import { randomBytes, scryptSync, createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, readFile, rm, stat, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

const magic = Buffer.from("MCHBKP01");
export function backupPassword() {
  const password = process.env.BACKUP_ENCRYPTION_PASSWORD;
  if (!password || password.length < 20) throw new Error("Configure BACKUP_ENCRYPTION_PASSWORD (at least 20 characters)");
  return password;
}
function derive(password, salt) { return scryptSync(password, salt, 32, { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }); }
export async function encryptFile(source, destination, password) {
  const salt = randomBytes(16), iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", derive(password, salt), iv);
  const header = Buffer.concat([magic, salt, iv]); cipher.setAAD(header);
  await writeFile(destination, header, { flag: "wx", mode: 0o600 });
  await pipeline(createReadStream(source), cipher, createWriteStream(destination, { flags: "a", mode: 0o600 }));
  await appendFile(destination, cipher.getAuthTag());
}
export async function decryptFile(source, destination, password) {
  const size = (await stat(source)).size;
  if (size < 52) throw new Error("Invalid encrypted backup");
  // Only the header/tag are retained; read the ciphertext as a stream.
  const { open } = await import("node:fs/promises");
  const handle = await open(source, "r");
  const header = Buffer.alloc(36), tag = Buffer.alloc(16);
  try { await handle.read(header, 0, 36, 0); await handle.read(tag, 0, 16, size - 16); } finally { await handle.close(); }
  if (!header.subarray(0, 8).equals(magic)) throw new Error("Invalid encrypted backup");
  const cipher = createDecipheriv("aes-256-gcm", derive(password, header.subarray(8, 24)), header.subarray(24, 36));
  cipher.setAAD(header); cipher.setAuthTag(tag);
  let opened = false;
  const output = createWriteStream(destination, { flags: "wx", mode: 0o600 });
  output.once("open", () => { opened = true; });
  try { await pipeline(createReadStream(source, { start: 36, end: size - 17 }), cipher, output); }
  catch (error) { if (opened) await rm(destination, { force: true }); throw error; }
}
export async function hashFile(path) {
  const hash = createHash("sha256"); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest("hex");
}
export function postgresEnvironment(raw) {
  const url = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Expected PostgreSQL URL");
  return { ...process.env, PGHOST: url.hostname, PGPORT: url.port || "5432", PGDATABASE: url.pathname.slice(1), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: process.env.DATABASE_SSL === "disable" ? "disable" : "require" };
}
export async function pgTool(tool, args, directory, raw) {
  const image = process.env.BACKUP_PG_IMAGE || "postgres:17.10";
  if (!/^postgres:\d+(\.\d+)?(-bookworm)?$/.test(image)) throw new Error("Use an official version-matched postgres image");
  const child = spawn("docker", ["run", "--rm", "--network=host", ...["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD", "PGSSLMODE"].flatMap(key => ["--env", key]), "--volume", `${directory}:/backup`, image, tool, ...args], { env: postgresEnvironment(raw), stdio: ["ignore", "ignore", "ignore"] });
  await new Promise((resolve, reject) => { child.once("error", () => reject(new Error("PostgreSQL backup tool unavailable"))); child.once("exit", code => code === 0 ? resolve() : reject(new Error("PostgreSQL backup/restore failed; verify image version and scoped permissions privately"))); });
}
export async function readManifest(path) { return JSON.parse(await readFile(path, "utf8")); }
