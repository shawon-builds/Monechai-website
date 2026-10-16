import { test, expect } from "@playwright/test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { createPolicyFixture } from "../fixtures/policies";
test("displayed variant prices match offers and price changes require an explicit second confirmation", async ({ page }) => {
  const sql = postgres(process.env.TEST_DATABASE_URL!,{ ssl:false,max:2 });
  const slug=`price-${crypto.randomUUID()}`; let categoryId="",productId="",variantId="";
  let policyId = "";
  try {
    policyId = (await createPolicyFixture(drizzle({ client: sql }))).id;
    [{id:categoryId}]=await sql`insert into categories(slug,name_en) values(${slug},'Price fixture') returning id`;
    [{id:productId}]=await sql`insert into products(slug,sku,category_id,name_en,price_minor,is_published) values(${slug},${slug},${categoryId},'Price fixture',10000,true) returning id`;
    [{id:variantId}]=await sql`insert into product_variants(product_id,sku,price_minor,stock_quantity) values(${productId},${slug},12500,2) returning id`;
    await sql`insert into product_variants(product_id,sku,price_minor,stock_quantity) values(${productId},${`${slug}-second`},20000,2)`;
    await sql`insert into shipping_zones(code,name,fee_minor) values('inside-dhaka','Price test zone',100)`;
    await sql`insert into delivery_areas(code,name_en,district,shipping_zone_code) values('price-area','Price area','Test district','inside-dhaka')`;
    await page.goto(`/shop?category=${slug}`);
    await expect(page.getByRole("link",{name:"View details: Price fixture"}).locator(".price")).toContainText("From");
    await expect(page.getByRole("link",{name:"View details: Price fixture"}).locator(".price")).toContainText("125.00");
    await page.goto(`/products/${slug}`); await page.getByRole("button",{name:"Add to cart",exact:true}).click();
    await page.goto("/checkout"); await expect(page.locator(".order-summary")).toContainText("126.00");
    await page.getByLabel("Full name",{exact:true}).fill("Price Customer");
    await page.getByLabel("Bangladesh mobile number").fill("01712345678");
    await page.getByLabel("Street address").fill("Test price street"); await page.getByLabel("Area",{exact:true}).fill("Test area");
    await sql`update product_variants set price_minor=15000 where id=${variantId}`;
    await page.getByRole("checkbox", { name: "I have read and accept the store policies linked below." }).check();
    await page.getByRole("button",{name:"Place COD order"}).click();
    await expect(page.locator('.checkout-error[role="alert"]')).toContainText("Prices or delivery fees changed");
    await expect(page.locator(".order-summary")).toContainText("151.00");
    expect((await sql`select count(*)::int as n from orders`)[0].n).toBe(0);
    await page.getByRole("checkbox", { name: "I have read and accept the store policies linked below." }).check();
    await page.getByRole("button",{name:"Place COD order"}).click();
    await expect(page).toHaveURL(/\/order\/[0-9a-f]{64}\/success/);
    expect((await sql`select unit_price_minor from order_items where variant_id=${variantId}`)[0].unit_price_minor).toBe(15000);
  } finally {
    if(variantId){const ids=await sql`select distinct order_id from order_items where variant_id=${variantId}`;for(const {order_id:id}of ids){await sql`delete from order_items where order_id=${id}`;await sql`delete from order_status_history where order_id=${id}`;await sql`delete from order_payment_history where order_id=${id}`;await sql`delete from orders where id=${id}`;}}
    if(productId)await sql`delete from products where id=${productId}`;
    if(categoryId)await sql`delete from categories where id=${categoryId}`;
    await sql`delete from delivery_areas where code='price-area'`;await sql`delete from shipping_zones where code='inside-dhaka' and name='Price test zone'`;
    if (policyId) await sql`delete from store_policies where id=${policyId}`;
    await sql.end();
  }
});
