import { test, expect, type Page } from "@playwright/test";
import postgres from "postgres";
import sharp from "sharp";
import AxeBuilder from "@axe-core/playwright";
import { z } from "zod";
import { fixturePolicies } from "../fixtures/policies";
import { getDictionary } from "../../src/i18n/dictionary";

const sql = postgres(process.env.TEST_DATABASE_URL!, { ssl: false, max: 1 });
const slug = `schema-${crypto.randomUUID()}`;
const origin = "https://store.example";
let categoryId = "", policyId = "";
const errors: string[] = [];

// Offline shape/range validation for emitted Schema.org types. Sources:
// https://schema.org/{Organization,WebSite,BreadcrumbList,ListItem,Product,Offer}
// Strict allowlists also reject invented merchant/review/contact claims.
const url = z.url();
const organization = z.object({ "@type": z.literal("Organization"), "@id": url, name: z.string().min(1), url, logo: url }).strict();
const website = z.object({ "@type": z.literal("WebSite"), "@id": url, name: z.string().min(1), url, inLanguage: z.array(z.enum(["en-BD", "bn-BD"])), publisher: z.object({ "@id": url }).strict() }).strict();
const entities = z.object({ "@context": z.literal("https://schema.org"), "@graph": z.tuple([organization, website]) }).strict();
const breadcrumbs = z.object({ "@context": z.literal("https://schema.org"), "@type": z.literal("BreadcrumbList"), itemListElement: z.array(z.object({ "@type": z.literal("ListItem"), position: z.number().int().positive(), name: z.string().min(1), item: url }).strict()).min(2) }).strict();
const productSchema = z.object({ "@context": z.literal("https://schema.org"), "@type": z.literal("Product"), name: z.string().min(1), description: z.string().optional(), image: z.array(url).optional(), sku: z.string().optional(),
  offers: z.object({ "@type": z.literal("Offer"), url, priceCurrency: z.literal("BDT"), price: z.string().regex(/^\d+\.\d{2}$/), availability: z.enum(["https://schema.org/InStock", "https://schema.org/OutOfStock"]), itemCondition: z.literal("https://schema.org/NewCondition") }).strict() }).strict();
async function schemas(page: Page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent!)));
}
async function checkBreadcrumbs(page: Page, count: number) {
  const data = (await schemas(page)).find(value => value["@type"] === "BreadcrumbList");
  const parsed = breadcrumbs.parse(data); expect(parsed.itemListElement).toHaveLength(count);
  for (const [index, item] of parsed.itemListElement.entries()) expect(item.position).toBe(index + 1);
  const visibleLinks = await page.locator(".breadcrumbs a").evaluateAll(links => links.map(link => ({ name: link.textContent, path: new URL((link as HTMLAnchorElement).href).pathname + new URL((link as HTMLAnchorElement).href).search })));
  for (const link of visibleLinks) expect(parsed.itemListElement).toContainEqual({ "@type": "ListItem", position: visibleLinks.indexOf(link) + 1, name: link.name, item: `${origin}${link.path}` });
  for (const link of visibleLinks) expect((await page.request.get(link.path)).status()).toBe(200);
}

test.beforeAll(async () => {
  [{ id: categoryId }] = await sql`insert into categories(slug,name_en,name_bn) values(${slug},'Schema fixtures','স্কিমা পরীক্ষা') returning id`;
  for (const index of [0,1]) {
    const [{ id }] = await sql`insert into products(slug,sku,category_id,name_en,name_bn,description_en,description_bn,price_minor,is_published) values(${`${slug}-${index}`},${`${slug}-${index}`},${categoryId},'Fixture Brand', 'Fixture Brand', 'Substantive English product description. Test fixture only.',${index ? 'সম্পূর্ণ অনূদিত পণ্যের বিবরণ। এটি কেবল পরীক্ষা।' : null},9999,true) returning id`;
    await sql`insert into product_variants(product_id,sku,label,label_bn,price_minor,stock_quantity) values(${id},${`${slug}-${index}`},'Default','সাধারণ',12005,${index ? 0 : 2})`;
    await sql`insert into product_images(product_id,storage_key,alt_en,alt_bn,is_primary,verified_at) values(${id},'fixtures/schema.png','Fixture photo','পরীক্ষার ছবি',true,now())`;
  }
  [{ id: policyId }] = await sql`insert into store_policies(shipping_en,shipping_bn,returns_en,privacy_en,privacy_bn,terms_en) values(${fixturePolicies.shippingEn},'সম্পূর্ণ অনূদিত ডেলিভারি নীতি। এটি কেবল পরীক্ষা।',${fixturePolicies.returnsEn},${fixturePolicies.privacyEn},'সম্পূর্ণ অনূদিত গোপনীয়তা নীতি। এটি কেবল পরীক্ষা।',${fixturePolicies.termsEn}) returning id`;
});
test.afterAll(async () => {
  await sql`delete from products where category_id=${categoryId}`; await sql`delete from categories where id=${categoryId}`;
  await sql`delete from store_policies where id=${policyId}`; await sql.end();
});
test.beforeEach(async ({ page }) => {
  page.on("pageerror", error => errors.push(error.message));
  const image = await sharp({ create: { width: 64, height: 64, channels: 3, background: "#ccaa77" } }).png().toBuffer();
  await page.route("**/_next/image?*", route => route.fulfill({ contentType: "image/png", body: image }));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:3104(?:\/|$))/, route => route.abort());
});

for (const locale of ["en", "bn"] as const) {
  test(`${locale} homepage/shop schema and absolute non-product sharing metadata`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const data = await schemas(page); expect(data).toHaveLength(1);
    const parsed = entities.parse(data[0]);
    expect(parsed["@graph"][1].publisher["@id"]).toBe(parsed["@graph"][0]["@id"]);
    expect(parsed["@graph"][0].url).toBe(origin);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${origin}/${locale}`);
    for (const path of [`/${locale}`, `/${locale}/shop?category=${slug}`, ...["shipping", "returns", "privacy", "terms"].map(kind => `/${locale}/policies/${kind}`)]) {
      await page.goto(path);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${origin}/social-logo.png`);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", `${origin}/social-logo.png`);
      const description = await page.locator('meta[name="description"]').getAttribute("content"); expect(description!.length).toBeGreaterThan(20);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description!);
      await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute("content", description!);
    }
    await page.goto(`/${locale}/shop?category=${slug}`); await checkBreadcrumbs(page, 2);
    expect((await schemas(page)).some(value => value["@graph"]), "entity schema belongs to homepage only").toBe(false);
    const asset = await page.request.get("/social-logo.png"); expect(asset.status()).toBe(200);
    const metadata = await sharp(await asset.body()).metadata(); expect([metadata.width,metadata.height,metadata.format]).toEqual([1200,630,"png"]);
  });

  test(`${locale} Product/Offer matches effective price, stock, condition and visible breadcrumb links`, async ({ page }) => {
    for (const index of [0,1]) {
      await page.goto(`/${locale}/products/${slug}-${index}`);
      const data = await schemas(page); expect(data).toHaveLength(2);
      const product = productSchema.parse(data.find(value => value["@type"] === "Product"));
      expect(product.offers.price).toBe("120.05"); expect(product.offers.availability).toBe(`https://schema.org/${index ? "OutOfStock" : "InStock"}`);
      expect(product.offers.url).toBe(`${origin}/${locale}/products/${slug}-${index}`);
      expect(product.description).toContain(locale === "bn" && index ? "সম্পূর্ণ" : "Substantive English");
      await expect(page.locator(".detail-info > .price")).toContainText(locale === "en" ? "120.05" : "১২০.০৫");
      await expect(page.locator(".availability")).toContainText(index ? getDictionary(locale).currentlyUnavailable : getDictionary(locale).available);
      await checkBreadcrumbs(page, 3);
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /https:\/\/media.example\//);
      expect(JSON.stringify(data)).not.toMatch(/AggregateRating|review|MerchantReturnPolicy|shippingDetails|telephone|address/);
    }
  });

  test(`${locale} substantive fallback language, mixed pages and Axe checks`, async ({ page }, testInfo) => {
    for (const index of [0,1]) {
      await page.goto(`/${locale}/products/${slug}-${index}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const paragraph = page.locator(".description p");
      expect(await paragraph.evaluate(node => node.closest("[lang]")!.getAttribute("lang"))).toBe(locale === "bn" && !index ? "en" : locale);
      expect(await page.locator(".description h2").evaluate(node => node.closest("[lang]")!.getAttribute("lang"))).toBe(locale);
      expect(await page.locator("h1").getAttribute("lang")).toBeNull();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    }
    for (const kind of ["shipping", "returns", "privacy", "terms"]) {
      await page.goto(`/${locale}/policies/${kind}`);
      const expected = locale === "bn" && ["returns", "terms"].includes(kind) ? "en" : locale;
      expect(await page.locator(".policy-copy").evaluate(node => node.closest("[lang]")!.getAttribute("lang"))).toBe(expected);
      expect(await page.locator("h1").evaluate(node => node.closest("[lang]")!.getAttribute("lang"))).toBe(locale);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    }
    await page.screenshot({ path: testInfo.outputPath(`policy-fallback-${locale}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("missing approved policies produce honest metadata/noindex; private routes contain no schema", async ({ page }) => {
  await sql`update store_policies set is_active=false where id=${policyId}`;
  try {
    for (const locale of ["en", "bn"]) {
      await page.goto(`/${locale}/policies/shipping`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
      await expect(page.locator(".policy-copy")).toHaveCount(0);
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description).toContain(locale === "en" ? "not configured" : "নীতিমালা");
      expect(await schemas(page)).toEqual([]);
      await page.goto(`/${locale}/checkout`); expect(await schemas(page)).toEqual([]);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    }
    await page.goto("/admin/login"); expect(await schemas(page)).toEqual([]);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  } finally { await sql`update store_policies set is_active=true where id=${policyId}`; }
});
