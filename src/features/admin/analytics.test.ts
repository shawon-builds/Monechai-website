import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { orders, orderItems, orderPaymentHistory, shippingZones } from "@/db/schema";
import { analyticsWindow, getAdminAnalytics } from "./analytics";

test("analytics periods use Bangladesh midnight and bounded reporting windows", () => {
  const before = analyticsWindow("7", new Date("2026-10-15T17:59:59Z"));
  const after = analyticsWindow("7", new Date("2026-10-15T18:00:00Z"));
  assert.equal(before.dates.at(-1), "2026-10-15");
  assert.equal(after.dates.at(-1), "2026-10-16");
  assert.equal(after.start.toISOString(), "2026-10-09T18:00:00.000Z");
  assert.equal(after.dates.length, 7);
  assert.equal(analyticsWindow("9999").days, 30);
  assert.equal(analyticsWindow("90").dates.length, 90);
});

test("analytics separates order cohorts from COD collection/refund events and excludes cancelled stock demand", { skip: !process.env.DATABASE_URL && "DATABASE_URL not set" }, async () => {
  const client = postgres(process.env.DATABASE_URL!, { ssl: false, max: 1 });
  const db = drizzle({ client });
  const now = new Date("2035-06-20T06:00:00Z");
  const recent = new Date("2035-06-19T20:00:00Z"), older = new Date("2035-01-01T06:00:00Z");
  try {
    await assert.rejects(db.transaction(async tx => {
      await tx.insert(shippingZones).values({ code: "inside-dhaka", name: "Fixture", feeMinor: 100 });
      const create = async (createdAt: Date, status: string, name: string) => {
        const [row] = await tx.insert(orders).values({ orderNumber: `MC-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`, publicToken: crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""), idempotencyKey: crypto.randomUUID(), requestHash: "fixture", customerName: "Fixture only", phone: "+8801712345678", address: "Fixture address", area: "Fixture area", shippingZoneCode: "inside-dhaka", shippingZoneName: "Fixture", subtotalMinor: 1000, shippingMinor: 100, totalMinor: 1100, status, createdAt }).returning();
        await tx.insert(orderItems).values({ orderId: row.id, productName: name, productSku: name, variantSku: name, variantLabel: "Default", attributes: {}, quantity: 1, unitPriceMinor: 1000, lineTotalMinor: 1000 });
        return row;
      };
      await create(recent, "pending_confirmation", "Pending fixture");
      await create(recent, "cancelled", "Cancelled fixture");
      const oldPaid = await create(older, "delivered", "Old collected fixture");
      const refunded = await create(older, "returned", "Old refunded fixture");
      const actorUserId = crypto.randomUUID();
      await tx.insert(orderPaymentHistory).values([
        { orderId: oldPaid.id, fromStatus: "pending", toStatus: "paid", actorUserId, createdAt: recent },
        { orderId: refunded.id, fromStatus: "pending", toStatus: "paid", actorUserId, createdAt: older },
        { orderId: refunded.id, fromStatus: "paid", toStatus: "refunded", actorUserId, createdAt: recent },
      ]);
      const report = await getAdminAnalytics(tx, "7", now);
      assert.equal(report.totalOrders, 2);
      assert.equal(report.cancelled, 1);
      assert.equal(report.orderValue, 1100, "pending value is not collected cash; cancelled value excluded");
      assert.equal(report.collected, 1100, "old order collected within report period counts");
      assert.equal(report.refunded, 1100);
      assert.equal(report.netCollected, 0);
      assert.deepEqual(report.topProducts.map(row => row.name), ["Pending fixture"]);
      assert.equal(report.daily.reduce((sum, row) => sum + row.count, 0), 2);
      assert.equal(report.daily.at(-1)?.count, 2);
      assert.equal(report.daily.length, 7);
      throw new Error("fixture rollback");
    }), /fixture rollback/);
  } finally { await client.end(); }
});
