import { test, expect } from "@playwright/test";
import postgres from "postgres";

const states = [
  { payment: "pending", fulfillment: "delivered", en: "Pending — cash not yet recorded", bn: "অপেক্ষমাণ — টাকা পাওয়া এখনো নথিভুক্ত হয়নি" },
  { payment: "paid", fulfillment: "delivered", en: "Paid — cash received", bn: "পরিশোধিত — টাকা পাওয়া গেছে" },
  { payment: "failed", fulfillment: "cancelled", en: "Failed — payment not collected", bn: "ব্যর্থ — টাকা নেওয়া হয়নি" },
  { payment: "refunded", fulfillment: "returned", en: "Refunded — cash returned", bn: "ফেরত দেওয়া হয়েছে — টাকা ফেরত দেওয়া হয়েছে" },
] as const;

for (const state of states) test(`limited COD receipt renders ${state.payment} independently in English and Bangla`, async ({ page }, testInfo) => {
  const sql = postgres(process.env.TEST_DATABASE_URL!, { ssl: false, max: 2 });
  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const reference = `MC-${crypto.randomUUID()}`;
  let orderId = "";
  try {
    await sql`insert into shipping_zones(code,name,fee_minor) values('inside-dhaka','Receipt payment fixture',100)`;
    // Fixtures are valid snapshots; strict DB regression separately drives actual admin transitions.
    [{ id: orderId }] = await sql`insert into orders(public_token,order_number,idempotency_key,request_hash,customer_name,phone,address,area,note,shipping_zone_code,shipping_zone_name,subtotal_minor,shipping_minor,total_minor,payment_status,status,courier_name,tracking_reference)
      values(${token},${reference},${crypto.randomUUID()},'receipt-private-hash','Receipt Secret Buyer','+8801712345678','Receipt Secret Address','Receipt Secret Area','Receipt Secret Note','inside-dhaka','Receipt payment fixture',1000,100,1100,${state.payment},${state.fulfillment},'Receipt courier','RECEIPT-TRACK') returning id`;
    await sql`insert into order_items(order_id,product_name,product_sku,variant_sku,variant_label,attributes,quantity,unit_price_minor,line_total_minor) values(${orderId},'Receipt payment item','RECEIPT','RECEIPT-1','White','{}',1,1000,1000)`;
    for (const locale of ["en", "bn"] as const) {
      const response = await page.goto(`/${locale}/order/${token}/success`);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["cache-control"]).toContain(process.env.E2E_PRODUCTION === "1" ? "no-store" : "no-cache");
      expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
      expect(response?.headers()["x-robots-tag"]).toContain("noindex");
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const receipt = page.locator(".success-page");
      await expect(receipt.getByText(`${locale === "en" ? "COD payment status" : "ক্যাশ অন ডেলিভারি পেমেন্টের অবস্থা"}: ${state[locale]}`, { exact: true })).toBeVisible();
      const fulfillment = state.fulfillment === "delivered" ? { en: "Delivered", bn: "ডেলিভারি হয়েছে" } : state.fulfillment === "cancelled" ? { en: "Cancelled", bn: "বাতিল হয়েছে" } : { en: "Returned", bn: "ফেরত এসেছে" };
      await expect(receipt.getByText(`${locale === "en" ? "Fulfillment status" : "ডেলিভারির অবস্থা"}: ${fulfillment[locale]}`, { exact: true })).toBeVisible();
      await expect(receipt).toContainText(reference);
      await expect(receipt).toContainText("Receipt payment item");
      await expect(receipt).toContainText("Receipt courier");
      await expect(receipt).toContainText("RECEIPT-TRACK");
      await expect(receipt).toContainText(new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", { style: "currency", currency: "BDT" }).format(11));
      const html = await response!.text();
      for (const privateText of ["Receipt Secret Buyer", "+8801712345678", "Receipt Secret Address", "Receipt Secret Area", "Receipt Secret Note", "receipt-private-hash", orderId]) expect(html).not.toContain(privateText);
      expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
      if (state.payment === "pending") await page.screenshot({ path: testInfo.outputPath(`receipt-pending-${locale}.png`), fullPage: true });
    }
  } finally {
    if (orderId) { await sql`delete from order_items where order_id=${orderId}`; await sql`delete from orders where id=${orderId}`; }
    await sql`delete from shipping_zones where code='inside-dhaka' and name='Receipt payment fixture'`;
    await sql.end();
  }
});
