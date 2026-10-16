import { test, expect } from "@playwright/test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { createPolicyFixture } from "../fixtures/policies";
import AxeBuilder from "@axe-core/playwright";

test("explicit locale/brand metadata and private guest receipts stay separate without buyer accounts", async ({ page, browser }, testInfo) => {
  const sql = postgres(process.env.TEST_DATABASE_URL!, { ssl: false, max: 2 });
  const slug = `privacy-${crypto.randomUUID()}`;
  let categoryId = "", policyId = "";
  const old = (await sql`select store_name from site_settings where id=1`)[0].store_name;
  const other = await browser.newContext();
  const tokens: string[] = [];
  try {
    policyId = (await createPolicyFixture(drizzle({ client: sql }))).id;
    await sql`update site_settings set store_name='Owner Fixture Store' where id=1`;
    [{ id: categoryId }] = await sql`insert into categories(slug,name_en,name_bn) values(${slug},'Guest fixtures','পরীক্ষার পণ্য') returning id`;
    await sql`insert into shipping_zones(code,name,fee_minor) values('inside-dhaka','Privacy fixture',100)`;
    await sql`insert into delivery_areas(code,name_en,district,shipping_zone_code) values('privacy-area','Fixture area','Test district','inside-dhaka')`;
    const variants: string[] = [];
    for (let index = 0; index < 2; index++) {
      const [{ id }] = await sql`insert into products(slug,sku,category_id,name_en,name_bn,price_minor,is_published) values(${`${slug}-${index}`},${`${slug}-${index}`},${categoryId},${`Private item ${index}`},${`ব্যক্তিগত পণ্য ${index}`},1000,true) returning id`;
      const [{ id: variantId }] = await sql`insert into product_variants(product_id,sku,label,label_bn,stock_quantity) values(${id},${`${slug}-${index}`},'White','সাদা',2) returning id`;
      variants.push(variantId);
      const context = index === 0 ? page.context() : other;
      const headers = { origin: "http://127.0.0.1:3104" };
      const items = [{ variantId, quantity: 1 }];
      const quote = await context.request.post("http://127.0.0.1:3104/api/checkout/preview", { headers, data: { items, deliveryAreaCode: "privacy-area" } });
      const saved = await context.request.post("http://127.0.0.1:3104/api/checkout", { headers, data: { items, quoteHash: (await quote.json()).quoteHash, policyVersion: policyId, acceptPolicies: true, idempotencyKey: crypto.randomUUID(), customerName: `Secret Buyer ${index}`, phone: "01712345678", address: `Secret address ${index} test`, area: "Private area", note: "Private delivery note", deliveryAreaCode: "privacy-area", paymentMethod: "cod" } });
      expect(saved.status()).toBe(201); tokens.push((await saved.json()).publicToken);
    }
    await page.context().addCookies([{ name: "monechai-locale", value: "en", domain: "127.0.0.1", path: "/" }]);
    await page.goto(`/bn/products/${slug}-0`);
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    await expect(page).toHaveTitle(/ব্যক্তিগত পণ্য 0.*Owner Fixture Store/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://store.example/bn/products/${slug}-0`);
    await expect(page.locator('link[hreflang="en-BD"]')).toHaveAttribute("href", `https://store.example/en/products/${slug}-0`);
    await expect(page.getByLabel("বিকল্প বাছুন")).toContainText("সাদা");
    await expect(page.locator(".brand")).toContainText("Owner Fixture Store");
    await page.getByRole("button", { name: "কার্টে যোগ করুন", exact: true }).click();
    const otherPage = await other.newPage(); await otherPage.goto("http://127.0.0.1:3104/en");
    expect(await otherPage.evaluate(() => localStorage.getItem("monechai:cart:v1"))).toBeNull();
    await page.goto(`/bn/shop?category=${slug}&sort=price-asc`);
    await page.getByRole("combobox", { name: "Language / ভাষা" }).selectOption("en");
    await expect(page).toHaveURL(new RegExp(`/en/shop\\?category=${slug}&sort=price-asc`));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Shop", exact: true })).toBeVisible();
    const forced = await page.request.get("/en", { headers: { "x-monechai-locale": "bn" } });
    expect(await forced.text()).toContain('lang="en"');
    for (const locale of ["en", "bn"]) for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/shop?category=${slug}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`shop-${locale}-${width}.png`), fullPage: true });
      await page.getByRole("button", { name: locale === "en" ? "Cart" : "কার্ট", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
      await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible();
      await expect(page.getByRole("button", { name: locale === "en" ? "Cart" : "কার্ট", exact: true })).toBeFocused();
    }
    // Zoom-equivalent viewport/DPR simulation; native browser UI zoom and manual
    // screen-reader acceptance remain separate owner checks.
    for (const locale of ["en", "bn"]) for (const scale of [2, 4]) {
      const zoomContext=await browser.newContext({viewport:{width:1280/scale,height:Math.floor(900/scale)},deviceScaleFactor:scale});
      try {
        const zoomPage=await zoomContext.newPage(); await zoomPage.goto(`http://127.0.0.1:3104/${locale}/shop?category=${slug}`);
        expect(await zoomPage.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280/scale+1);
        await zoomPage.keyboard.press("Tab"); await expect(zoomPage.locator(":focus")).toHaveClass(/skip-link/);
        await zoomPage.screenshot({path:testInfo.outputPath(`shop-${locale}-reflow-${scale}.png`),fullPage:false});
      } finally {await zoomContext.close();}
    }
    for (let index = 0; index < 2; index++) {
      const receipt = await page.request.get(`/en/order/${tokens[index]}/success`);
      expect(receipt.status()).toBe(200);
      // Next dev overwrites page Cache-Control. The production suite checks the deployed artifact.
      expect(receipt.headers()["cache-control"]).toContain(process.env.E2E_PRODUCTION === "1" ? "no-store" : "no-cache");
      expect(receipt.headers()["referrer-policy"]).toBe("no-referrer");
      expect(receipt.headers()["x-robots-tag"]).toContain("noindex");
      const body = await receipt.text();
      expect(body).toContain(`Private item ${index}`); expect(body).not.toContain(`Private item ${1 - index}`);
      for (const privateText of ["Secret Buyer", "01712345678", "Secret address", "Private area", "Private delivery note"]) expect(body).not.toContain(privateText);
    }
    expect((await page.request.get(`/en/order/${"f".repeat(64)}/success`)).status()).toBe(404);
    expect((await page.request.get("/en/order/123/success")).status()).toBe(404);
    const admin = await page.request.get("/admin/orders"); expect(admin.url()).toContain("/admin/login");
    const sitemap = await page.request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain(`/bn/products/${slug}-0`); expect(await sitemap.text()).toContain(`/en/products/${slug}-0`);
    expect(await (await page.request.get("/robots.txt")).text()).toContain("/bn/order/");
    const policy = await page.request.get("/bn/policies/privacy"); expect(await policy.text()).toContain("TEST FIXTURE ONLY");
    for (const path of ["/en", "/bn", `/en/products/${slug}-0`, "/en/checkout", "/en/policies/terms", "/admin/login", "/admin/recovery"]) {
      await page.goto(path);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations, path).toEqual([]);
    }
  } finally {
    for (const token of tokens) {
      const [{ id }] = await sql`select id from orders where public_token=${token}`;
      await sql`delete from order_items where order_id=${id}`; await sql`delete from order_status_history where order_id=${id}`; await sql`delete from orders where id=${id}`;
    }
    if (categoryId) { await sql`delete from products where category_id=${categoryId}`; await sql`delete from categories where id=${categoryId}`; }
    await sql`delete from delivery_areas where code='privacy-area'`; await sql`delete from shipping_zones where code='inside-dhaka' and name='Privacy fixture'`;
    if (policyId) await sql`delete from store_policies where id=${policyId}`;
    await sql`update site_settings set store_name=${old} where id=1`;
    await other.close(); await sql.end();
  }
});
