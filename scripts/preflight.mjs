// Read-only deployment readiness check. Does not migrate, send email or create orders.
import postgres from "postgres";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertPublicSupabaseKey, validatePublicSupabaseKeys } from "../src/lib/supabase/public-key.mjs";

const local = process.argv.includes("--local");
const runtimeOnly = process.argv.includes("--runtime-only");
const migrationsOnly = process.argv.includes("--migrations-only");
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
function required(name) { if (!process.env[name]) throw new Error(`Configure ${name}`); return process.env[name]; }
function origin(name) {
  const url = new URL(required(name));
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error(`${name} must be an origin`);
  if (!local && (url.protocol !== "https:" || /(^|\.)(localhost|example|test)$/.test(url.hostname) || url.hostname.endsWith(".example") || url.hostname.includes("replace-me"))) throw new Error(`${name} must be a real HTTPS origin`);
  return url;
}
function database(name) {
  const url = new URL(required(name));
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error(`Invalid ${name} protocol`);
  if (local && (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.pathname !== "/monechai_test")) throw new Error(`Local ${name} only permits isolated /monechai_test`);
  return postgres(url.toString(), { ssl: process.env.DATABASE_SSL === "disable" ? false : process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true } : "require", max: 1, connect_timeout: 5, connection: { statement_timeout: 5000, default_transaction_read_only: "on" } });
}
try {
  if (process.argv.slice(2).some(arg => !["--local", "--runtime-only", "--migrations-only"].includes(arg)) || (runtimeOnly && migrationsOnly)) throw new Error("Use --runtime-only or --migrations-only, or neither for full release preflight; --local is optional");
  const runtime = readFileSync(resolve(root, ".nvmrc"), "utf8").trim();
  if (process.versions.node !== runtime) throw new Error(`Use pinned Node ${runtime}`);
  if (!local && process.env.DATABASE_SSL !== "require") throw new Error("Production preflight requires TLS database transport; review private self-hosted topology separately");
  if (!migrationsOnly) {
    validatePublicSupabaseKeys(process.env);
    for (const path of [".next/standalone/server.js", ".next/standalone/public/monechai-logo.svg", ".next/standalone/.next/static"]) if (!existsSync(resolve(root, path))) throw new Error(`Build artifact missing: ${path}`);
    if (!local) {
      if (process.env.CHECKOUT_TRUST_PROXY_IP_HEADER !== "true") throw new Error("Production checkout requires CHECKOUT_TRUST_PROXY_IP_HEADER=true after verifying ingress overwrite and private Node access");
      origin("NEXT_PUBLIC_SITE_URL"); origin("NEXT_PUBLIC_SUPABASE_URL");
      assertPublicSupabaseKey(required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"));
    }
    const sql = database("DATABASE_URL");
    try {
      const [{ current_user: role }] = await sql`select current_user`;
      const [permissions] = await sql`select rolsuper from pg_roles where rolname=${role}`;
      if (!local && permissions.rolsuper) throw new Error("Production app must not run as a superuser");
      const tables = await sql`select relname,relrowsecurity from pg_class join pg_namespace on pg_namespace.oid=relnamespace where nspname='public' and relkind='r'`;
      if (tables.some(table => !table.relrowsecurity)) throw new Error("App tables missing RLS");
      await sql`select policy_version_id,policy_accepted_at from orders limit 0`;
      const [{ policy }] = await sql`select count(*)::int as policy from store_policies where is_active`;
      const [{ areas }] = await sql`select count(*)::int as areas from delivery_areas join shipping_zones on shipping_zones.code=delivery_areas.shipping_zone_code where delivery_areas.is_active`;
      const [settings] = await sql`select store_name,hotline,support_email,whatsapp_number from site_settings where id=1`;
      if (!settings) throw new Error("Missing store settings");
      if (!local && (policy !== 1 || areas < 1 || ![settings.hotline, settings.support_email, settings.whatsapp_number].some(Boolean))) throw new Error("Publish approved policies, delivery rates/coverage and a support contact before launch");
      console.log(`PASS: ${local ? "local" : "production"} runtime config/artifact/schema readiness (${tables.length} RLS tables; DATABASE_URL).`);
    } finally { await sql.end(); }
  }
  if (!runtimeOnly) {
    // Operator-only credential. Never use it for application readiness or fall back to DATABASE_URL.
    const sql = database("DIRECT_URL");
    try {
      const journal = JSON.parse(readFileSync(resolve(root, "src/db/migrations/meta/_journal.json"), "utf8"));
      const [{ n }] = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
      if (n !== journal.entries.length) throw new Error("Migration count differs from reviewed journal");
      console.log(`PASS: operator migration history (${n} migrations; DIRECT_URL).`);
    } finally { await sql.end(); }
  }
  if (runtimeOnly) console.log("Migration history NOT VERIFIED; runtime-only success is not full release preflight.");
  else if (!migrationsOnly) console.log("PASS: full release preflight (runtime readiness and operator migration history).");
  console.log("Still requires trusted ingress overwrite/private Node access, owner Auth/Storage/MFA/SMTP, customer/admin acceptance, off-site restore and alert delivery checks. This check does not establish those.");
} catch (error) {
  // Never print a DB/provider error which may contain a connection URL or PII.
  console.error(error instanceof Error && !error.cause && !error.name.includes("Postgres") ? error.message : "Preflight database/provider check failed; review configuration privately.");
  process.exitCode = 1;
}
