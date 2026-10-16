import assert from "node:assert/strict";
import { test } from "node:test";
import postgres from "postgres";
import { indexableSiteOrigin, storefrontRobots, publicSiteOrigin } from "./site-url";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getDb } from "@/db/client";

function config(values: Record<string, string | undefined>) {
  const saved = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  return () => { for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } };
}
const approved = { NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://store.example", SITE_INDEXING_APPROVED_ORIGIN: "https://store.example", VERCEL_ENV: undefined };

test("HTTPS without explicit approval denies metadata, crawlers and sitemap", async () => {
  const restore = config({ ...approved, SITE_INDEXING_APPROVED_ORIGIN: undefined });
  try {
    assert.equal(indexableSiteOrigin(), null);
    assert.deepEqual(storefrontRobots(), { index: false, follow: false });
    assert.deepEqual(robots(), { rules: { userAgent: "*", disallow: "/" } });
    assert.deepEqual(await sitemap(), []);
    assert.equal(publicSiteOrigin(), "https://store.example", "mail origin remains independent of search approval");
  } finally { restore(); }
});

test("HTTPS staging cannot borrow production-origin approval", async () => {
  const restore = config({ ...approved, NEXT_PUBLIC_SITE_URL: "https://staging.example" });
  try { assert.equal(indexableSiteOrigin(), null); assert.equal(storefrontRobots().index, false); assert.deepEqual(await sitemap(), []); }
  finally { restore(); }
});

test("approved production allows public indexing while robots retains private exclusions", () => {
  const restore = config(approved);
  try {
    assert.equal(indexableSiteOrigin(), "https://store.example");
    assert.deepEqual(storefrontRobots(), { index: true, follow: true });
    assert.deepEqual(storefrontRobots(false), { index: false, follow: true });
    const rules = robots();
    assert.equal(rules.sitemap, "https://store.example/sitemap.xml");
    for (const path of ["/admin", "/api/", "/en/checkout", "/bn/checkout", "/en/order/", "/bn/order/"]) {
      assert.ok(!Array.isArray(rules.rules) && Array.isArray(rules.rules.disallow) && rules.rules.disallow.includes(path));
    }
  } finally { restore(); }
});

test("development, test and preview environments deny even copied approval", () => {
  for (const values of [{ NODE_ENV: "development" }, { NODE_ENV: "test" }, { VERCEL_ENV: "preview" }, { VERCEL_ENV: "development" }, { VERCEL_ENV: "" }]) {
    const restore = config({ ...approved, ...values });
    try { assert.equal(indexableSiteOrigin(), null); } finally { restore(); }
  }
});

test("malformed, credentialed, local and inappropriate origins fail closed", () => {
  for (const origin of ["broken", "http://store.example", "https://user:pass@store.example", "https://store.example/path", "https://store.example?x=1", "https://store.example#x", "https://localhost", "https://127.0.0.1", "https://[::1]", "https://store.local", "https://store.internal", "https://store.test", "https://store.example:8443"]) {
    const restore = config({ ...approved, NEXT_PUBLIC_SITE_URL: origin, SITE_INDEXING_APPROVED_ORIGIN: origin });
    try { assert.equal(indexableSiteOrigin(), null, origin); } finally { restore(); }
  }
});

test("approval requires exact canonical origin rather than boolean, wildcard or URL path", () => {
  for (const approval of ["true", "*", "https://store.example/", " https://store.example", "https://store.example/path", "https://other.example"]) {
    const restore = config({ ...approved, SITE_INDEXING_APPROVED_ORIGIN: approval });
    try { assert.equal(indexableSiteOrigin(), null); } finally { restore(); }
  }
});

test("approved sitemap uses canonical origin and paired EN/BN published non-demo URLs", { skip: !process.env.DATABASE_URL && "DATABASE_URL not set" }, async () => {
  const restore = config(approved);
  const sql = postgres(process.env.DATABASE_URL!, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 1 });
  const slug = `seo-${crypto.randomUUID()}`; let categoryId = "";
  try {
    [{ id: categoryId }] = await sql`insert into categories(slug,name_en) values(${slug},'SEO test') returning id`;
    await sql`insert into products(slug,sku,category_id,name_en,price_minor,is_published) values(${slug},${slug},${categoryId},'SEO test',100,true),(${`${slug}-draft`},${`${slug}-draft`},${categoryId},'Draft',100,false)`;
    const entries = await sitemap();
    assert.ok(entries.length >= 6);
    for (const entry of entries) {
      assert.ok(entry.url.startsWith("https://store.example/"));
      assert.ok(entry.alternates?.languages?.["en-BD"]?.startsWith("https://store.example/en"));
      assert.ok(entry.alternates?.languages?.["bn-BD"]?.startsWith("https://store.example/bn"));
    }
    for (const locale of ["en", "bn"]) assert.ok(entries.some(entry => entry.url === `https://store.example/${locale}/products/${slug}`));
    assert.ok(entries.every(entry => !entry.url.includes(`${slug}-draft`)));
  } finally {
    if (categoryId) { await sql`delete from products where category_id=${categoryId}`; await sql`delete from categories where id=${categoryId}`; }
    await sql.end(); await getDb().$client.end(); restore();
  }
});
