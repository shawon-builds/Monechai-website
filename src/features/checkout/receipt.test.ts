import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { orderItems, orders, shippingZones } from "@/db/schema";
import { changeOrderStatus, recordCodPayment, recordCodRefund } from "@/features/admin/orders";
import { getDictionary, orderStatusLabel, paymentStatusLabel } from "@/i18n/dictionary";
import { getPublicReceipt } from "./receipt";

test("malformed receipt tokens never query the database", async () => {
  const db = { select() { throw new Error("invalid token reached database"); } };
  for (const token of ["123", "F".repeat(64), "a".repeat(63), "a".repeat(65), "../admin/orders"]) {
    assert.equal(await getPublicReceipt(db, token), null);
  }
});

const url = process.env.DATABASE_URL;
test("limited receipts follow actual COD payment transitions independently of fulfillment in both locales", { skip: !url && "DATABASE_URL not set" }, async () => {
  const client = postgres(url!, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 2 });
  const db = drizzle({ client });
  try {
    await assert.rejects(db.transaction(async tx => {
      await tx.insert(shippingZones).values({ code: "inside-dhaka", name: "Receipt fixture", feeMinor: 100 });
      const make = async () => {
        const [order] = await tx.insert(orders).values({ publicToken: crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""), orderNumber: `MC-${crypto.randomUUID()}`,
          idempotencyKey: crypto.randomUUID(), requestHash: "private-request-hash", customerName: "Private receipt buyer", phone: "+8801712345678", address: "Private receipt address", area: "Private receipt area", note: "Private receipt note",
          shippingZoneCode: "inside-dhaka", shippingZoneName: "Receipt fixture", subtotalMinor: 1000, shippingMinor: 100, totalMinor: 1100, courierName: "Receipt courier", trackingReference: "RECEIPT-TRACK" }).returning();
        await tx.insert(orderItems).values({ orderId: order.id, productName: "Receipt item", productSku: "RECEIPT", variantSku: "RECEIPT-1", variantLabel: "Default", attributes: {}, quantity: 1, unitPriceMinor: 1000, lineTotalMinor: 1000, inventoryReserved: false });
        return order;
      };
      const actor = crypto.randomUUID();
      const order = await make();
      const verify = async (token: string, payment: string, fulfillment: string) => {
        const receipt = await getPublicReceipt(tx, token);
        assert.ok(receipt);
        assert.equal(receipt.order.paymentStatus, payment);
        assert.equal(receipt.order.status, fulfillment);
        assert.equal(receipt.order.totalMinor, 1100);
        assert.equal(receipt.order.shippingMinor, 100);
        assert.equal(receipt.order.courierName, "Receipt courier");
        assert.equal(receipt.order.trackingReference, "RECEIPT-TRACK");
        assert.deepEqual(receipt.items, [{ productName: "Receipt item", variantLabel: "Default", quantity: 1, unitPriceMinor: 1000, lineTotalMinor: 1000 }]);
        for (const field of ["customerName", "phone", "address", "area", "note", "publicToken", "requestHash", "idempotencyKey", "policyVersionId", "paymentHistory", "history"]) assert.equal(field in receipt.order, false, field);
        for (const locale of ["en", "bn"] as const) {
          assert.notEqual(getDictionary(locale).paymentStatus, getDictionary(locale).fulfillmentStatus);
          assert.notEqual(paymentStatusLabel(locale, receipt.order.paymentStatus), payment);
          assert.notEqual(orderStatusLabel(locale, receipt.order.status), fulfillment);
        }
      };
      await verify(order.publicToken, "pending", "pending_confirmation");
      assert.ok("error" in await recordCodPayment(tx, order.id, actor));
      for (const status of ["confirmed", "packed", "shipped", "delivered"] as const) assert.deepEqual(await changeOrderStatus(tx, order.id, status, actor), { status });
      await verify(order.publicToken, "pending", "delivered"); // Delivery alone never implies collected cash.
      assert.deepEqual(await recordCodPayment(tx, order.id, actor), { paymentStatus: "paid" });
      await verify(order.publicToken, "paid", "delivered");
      for (const status of ["return_requested", "returned"] as const) assert.deepEqual(await changeOrderStatus(tx, order.id, status, actor), { status });
      await verify(order.publicToken, "paid", "returned"); // A received return alone never implies a refund.
      assert.deepEqual(await recordCodRefund(tx, order.id, actor), { ok: true });
      await verify(order.publicToken, "refunded", "returned");
      const cancelled = await make();
      assert.deepEqual(await changeOrderStatus(tx, cancelled.id, "cancelled", actor), { status: "cancelled" });
      await verify(cancelled.publicToken, "failed", "cancelled");
      assert.equal(await getPublicReceipt(tx, "f".repeat(64)), null);
      throw new Error("rollback receipt fixture");
    }), /rollback receipt fixture/);
  } finally { await client.end(); }
});
