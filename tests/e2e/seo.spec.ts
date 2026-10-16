import { test, expect } from "@playwright/test";
import postgres from "postgres";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";

const sql = postgres(process.env.TEST_DATABASE_URL!, { ssl: false, max: 1 });
const slug = `seo-${crypto.randomUUID()}`;
let categoryId = "";
const origin = "https://store.example";

test.beforeAll(async () => {
  [{ id: categoryId }] = await sql`insert into categories(slug,name_en,name_bn) values(${slug},'SEO fixture','SEO পরীক্ষা') returning id`;
  for (let index = 0; index < 30; index++) {
    const [{ id }] = await sql`insert into products(slug,sku,category_id,name_en,name_bn,price_minor,is_published,created_at) values(${`${slug}-${index}`},${`${slug}-${index}`},${categoryId},${`SEO fixture ${index}`},${`SEO পরীক্ষা ${index}`},${10000 + index * 100},true,${new Date(1700000000000 + index * 1000)}) returning id`;
    await sql`insert into product_variants(product_id,sku,stock_quantity) values(${id},${`${slug}-${index}`},2)`;
  }
});
test.afterAll(async () => {
  if (categoryId) { await sql`delete from products where category_id=${categoryId}`; await sql`delete from categories where id=${categoryId}`; }
  await sql.end();
});

for (const number of [1, 2, 3]) test(`shop page ${number} has distinct rendered canonical and EN/BN alternates`, async ({ page, request }) => {
  const suffix = number === 1 ? "" : `?page=${number}`;
  for (const locale of ["en", "bn"]) {
    const response = await page.goto(`/${locale}/shop?page=${number}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}/${locale}/shop${suffix}`);
    await expect(page.locator('link[hreflang="en-BD"]')).toHaveAttribute("href", `${origin}/en/shop${suffix}`);
    await expect(page.locator('link[hreflang="bn-BD"]')).toHaveAttribute("href", `${origin}/bn/shop${suffix}`);
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute("href", `${origin}/en/shop${suffix}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
    await expect(page.locator(".product-card")).toHaveCount(number === 3 ? 6 : 12);
    const html = await request.get(`/${locale}/shop?page=${number}`, { headers: { "user-agent": "Googlebot" } });
    expect(html.status()).toBe(200);
    expect(await html.text()).toContain(`href="${origin}/${locale}/shop${suffix}"`);
  }
});

test("shop invalid, duplicate, unknown and empty query parameters have deliberate SEO", async ({ page }) => {
  for (const [query, canonical, indexing] of [
    ["page=1", "", true], ["q=++&category=&sort=newest&page=1", "", true],
    ["page=0", "", false], ["page=-1", "", false], ["page=01", "", false], ["page=2.5", "", false], ["page=abc", "", false], ["page=10000", "", false],
    ["page=2&page=3", "", false], ["q=one&q=two", "", false], ["sort=unknown", "", false], ["category=..%2Fbad", "", false],
    ["page=9999", "?page=9999", false], ["utm_source=test&page=2", "?page=2", false],
  ] as const) {
    expect((await page.goto(`/en/shop?${query}`))?.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}/en/shop${canonical}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", `${indexing ? "index" : "noindex"}, follow`);
  }
});

test("search, category and sort retain functionality and normalized noindex URLs", async ({ page }) => {
  for (const locale of ["en", "bn"]) {
    for (const query of [`category=${slug}&q=SEO+fixture&sort=price-asc&page=2`, `page=2&sort=price-asc&q=SEO+fixture&category=${slug}`]) {
      await page.goto(`/${locale}/shop?${query}`);
      const normalized = `?q=SEO+fixture&category=${slug}&sort=price-asc&page=2`;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}/${locale}/shop${normalized}`);
      await expect(page.locator('link[hreflang="en-BD"]')).toHaveAttribute("href", `${origin}/en/shop${normalized}`);
      await expect(page.locator('link[hreflang="bn-BD"]')).toHaveAttribute("href", `${origin}/bn/shop${normalized}`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
      await expect(page.locator(".product-card")).toHaveCount(12);
      await expect(page.locator(".product-card").first()).toContainText(locale === "en" ? "SEO fixture 12" : "SEO পরীক্ষা 12");
      await expect(page.locator('.pagination a[rel="next"]')).toHaveAttribute("href", `/${locale}/shop?q=SEO+fixture&category=${slug}&sort=price-asc&page=3`);
    }
    await page.goto(`/${locale}/shop?category=${slug}&sort=price-desc`);
    await expect(page.locator(".product-card").first()).toContainText(locale === "en" ? "SEO fixture 29" : "SEO পরীক্ষা 29");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    await page.goto(`/${locale}/shop?q=no-match-${slug}`);
    await expect(page.locator(".product-card")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  }
});

test("approved production robots/sitemap agree with public and private rendered metadata", async ({ page, request }) => {
  const rules = await request.get("/robots.txt");
  expect(await rules.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  for (const path of ["/admin", "/en/checkout", "/bn/checkout", "/en/order/", "/bn/order/"]) expect(await rules.text()).toContain(`Disallow: ${path}`);
  const xml = await request.get("/sitemap.xml");
  expect(xml.status()).toBe(200);
  const body = await xml.text();
  for (const locale of ["en", "bn"]) {
    expect(body).toContain(`<loc>${origin}/${locale}/products/${slug}-0</loc>`);
    await page.goto(`/${locale}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
    await page.goto(`/${locale}/products/${slug}-0`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
    await page.goto(`/${locale}/checkout`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  }
  expect(body).not.toMatch(/\/admin|\/checkout|\/order\//);
  await page.goto("/admin/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("production artifact denies indexing without approval, mismatched approval and preview", async ({ playwright }) => {
  for (const overrides of [{}, { SITE_INDEXING_APPROVED_ORIGIN: "https://staging.example" }, { SITE_INDEXING_APPROVED_ORIGIN: "true" }, { SITE_INDEXING_APPROVED_ORIGIN: origin, VERCEL_ENV: "preview" }]) {
    const child = spawn(process.execPath, [resolve(".next/standalone/server.js")], {
      env: { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR, NODE_ENV: "production", PORT: "3106", HOSTNAME: "127.0.0.1", DATABASE_URL: process.env.TEST_DATABASE_URL, DATABASE_SSL: "disable", NEXT_TELEMETRY_DISABLED: "1", ...overrides }, stdio: "ignore",
    });
    const closed = once(child, "exit");
    const request = await playwright.request.newContext({ baseURL: "http://127.0.0.1:3106", extraHTTPHeaders: { "user-agent": "Googlebot" } });
    try {
      await expect.poll(async () => { try { return (await request.get("/api/health")).status(); } catch { return 0; } }, { timeout: 15000 }).toBe(200);
      expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
      expect(await (await request.get("/robots.txt")).text()).not.toContain("Sitemap:");
      expect(await (await request.get("/sitemap.xml")).text()).not.toContain("<loc>");
      for (const locale of ["en", "bn"]) for (const path of ["", "/shop?page=2", `/products/${slug}-0`, "/policies/privacy"]) {
        const response = await request.get(`/${locale}${path}`);
        expect(response.status()).toBe(200);
        expect(await response.text()).toContain('name="robots" content="noindex, nofollow"');
      }
    } finally {
      await request.dispose(); child.kill("SIGTERM");
      await Promise.race([closed, new Promise(resolve => setTimeout(resolve, 5000))]);
      if (child.exitCode === null) child.kill("SIGKILL");
    }
  }
});
