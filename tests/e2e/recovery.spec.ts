import { test, expect } from "@playwright/test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { createPolicyFixture } from "../fixtures/policies";

test("lost committed response survives reload and never places a second order", async ({ page }) => {
  const sql = postgres(process.env.TEST_DATABASE_URL!, { ssl: false, max: 2 });
  const slug = `recovery-${crypto.randomUUID()}`;
  let categoryId = "", productId = "", variantId = "";
  let policyId = "";
  try {
    policyId = (await createPolicyFixture(drizzle({ client: sql }))).id;
    [{ id: categoryId }] = await sql`insert into categories(slug,name_en) values(${slug},'Recovery fixture') returning id`;
    [{ id: productId }] = await sql`insert into products(slug,sku,category_id,name_en,price_minor,is_published) values(${slug},${slug},${categoryId},'Recovery product',12500,true) returning id`;
    [{ id: variantId }] = await sql`insert into product_variants(product_id,sku,stock_quantity) values(${productId},${slug},2) returning id`;
    await sql`insert into shipping_zones(code,name,fee_minor) values('inside-dhaka','Recovery test zone',100)`;
    await sql`insert into delivery_areas(code,name_en,district,shipping_zone_code) values('recovery-area','Recovery area','Test district','inside-dhaka')`;
    await page.goto(`/products/${slug}`);
    await page.getByRole("button", { name: "Add to cart", exact: true }).click();
    await expect(page.getByRole("button", { name: "Added to cart", exact: true })).toBeDisabled();
    await page.goto("/checkout");
    await page.getByLabel("Full name", { exact: true }).fill("Recovery Customer");
    await page.getByLabel("Bangladesh mobile number", { exact: true }).fill("০১৭১২৩৪৫৬৭৮");
    await page.getByLabel("Street address", { exact: true }).fill("Test recovery street");
    await page.getByLabel("Area", { exact: true }).fill("Test area");
    let responseLost = false;
    await page.route("**/api/checkout/session", async (route) => {
      if (responseLost && route.request().method() === "GET") await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"Test-only recovery outage"}' });
      else await route.continue();
    });
    await page.route("**/api/checkout", async (route) => {
      const result = await route.fetch();
      expect(result.status()).toBe(201);
      responseLost = true;
      await route.abort("failed");
    });
    await page.getByRole("checkbox", { name: "I have read and accept the store policies linked below." }).check();
    await page.getByRole("button", { name: "Place COD order" }).click();
    await expect(page.locator(".checkout-error")).toBeVisible();
    expect((await sql`select count(*)::int as n from order_items where variant_id=${variantId}`)[0].n).toBe(1);
    const stored = await page.evaluate(() => Object.entries(localStorage));
    expect(JSON.stringify(stored)).not.toContain("Recovery Customer");
    expect(JSON.stringify(stored)).not.toContain("01712345678");
    expect((await page.context().cookies()).find((cookie) => cookie.name === "monechai-checkout")?.httpOnly).toBe(true);
    await page.unroute("**/api/checkout/session");
    await page.reload();
    await expect(page).toHaveURL(/\/order\/[0-9a-f]{64}\/success/);
    expect((await sql`select count(*)::int as n from order_items where variant_id=${variantId}`)[0].n).toBe(1);
    expect((await sql`select stock_quantity from product_variants where id=${variantId}`)[0].stock_quantity).toBe(1);
  } finally {
    if (variantId) {
      const ids = await sql`select distinct order_id from order_items where variant_id=${variantId}`;
      for (const { order_id: id } of ids) {
        await sql`delete from order_items where order_id=${id}`;
        await sql`delete from order_status_history where order_id=${id}`;
        await sql`delete from order_payment_history where order_id=${id}`;
        await sql`delete from orders where id=${id}`;
      }
    }
    if (productId) await sql`delete from products where id=${productId}`;
    if (categoryId) await sql`delete from categories where id=${categoryId}`;
    await sql`delete from delivery_areas where code='recovery-area'`;
    await sql`delete from shipping_zones where code='inside-dhaka' and name='Recovery test zone'`;
    if (policyId) await sql`delete from store_policies where id=${policyId}`;
    await sql.end();
  }
});
