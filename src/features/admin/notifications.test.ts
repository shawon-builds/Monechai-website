import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { orders, orderNotifications, shippingZones } from "@/db/schema";
import { dispatchOrderAlert, retryFailedAlert } from "./notifications";
import { smtpConfig } from "./order-mail";

test("SMTP configuration refuses missing credentials, plaintext ports and header injection", () => {
  assert.equal(smtpConfig.safeParse({}).success, false);
  const base = { SMTP_HOST: "smtp.example.test", SMTP_PORT: "587", SMTP_USER: "owner", SMTP_PASSWORD: "fixture", EMAIL_FROM: "store@example.test", ORDER_ALERT_EMAIL: "owner@example.test" };
  assert.equal(smtpConfig.safeParse(base).success, true);
  assert.equal(smtpConfig.safeParse({ ...base, SMTP_PORT: "25" }).success, false);
  assert.equal(smtpConfig.safeParse({ ...base, EMAIL_FROM: "store@example.test\r\nBcc: outsider@example.test" }).success, false);
});
test("owner alert leases prevent concurrent sends; failures retain orders, redact errors, back off and permit guarded retry", { skip: !process.env.DATABASE_URL }, async () => {
  const client = postgres(process.env.DATABASE_URL!, { ssl: false, max: 4 }), db = drizzle({ client });
  let id = "";
  try {
    await db.insert(shippingZones).values({ code: "inside-dhaka", name: "Alert fixture", feeMinor: 100 });
    const [order] = await db.insert(orders).values({ publicToken: randomBytes(32).toString("hex"), orderNumber: `MC-${randomUUID()}`, idempotencyKey: randomUUID(), requestHash: "fixture", customerName: "Private fixture buyer", phone: "+8801712345678", address: "Private fixture address", area: "Private area", shippingZoneCode: "inside-dhaka", shippingZoneName: "Alert fixture", subtotalMinor: 1000, shippingMinor: 100, totalMinor: 1100 }).returning(); id = order.id;
    // Explicitly eligible: DB microsecond NOW() can exceed JS millisecond Date.now().
    await db.insert(orderNotifications).values({ orderId: id, nextAttemptAt: new Date(0) });
    let sends = 0;
    const send = async (value: { id: string }) => { sends++; assert.deepEqual(Object.keys(value).sort(), ["id", "orderNumber", "totalMinor"]); await new Promise(resolve => setTimeout(resolve, 20)); };
    const outcomes = await Promise.all([dispatchOrderAlert(db, send), dispatchOrderAlert(db, send)]);
    assert.equal(sends, 1); assert.equal(outcomes.filter(result => result === "sent").length, 1); assert.equal(outcomes.filter(result => result === "idle").length, 1);
    assert.equal((await retryFailedAlert(db, id)).length, 0); // sent alerts cannot be casually replayed
    await db.update(orderNotifications).set({ status: "pending", attempts: 0, sentAt: null }).where(eq(orderNotifications.orderId, id));
    for (let attempt = 1; attempt <= 5; attempt++) {
      const now = new Date(Date.now() + attempt * 10000000);
      assert.equal(await dispatchOrderAlert(db, async () => { throw new Error("PRIVATE TOKEN/password/provider error"); }, now), "retry");
      const [row] = await db.select().from(orderNotifications).where(eq(orderNotifications.orderId, id));
      assert.equal(row.attempts, attempt); assert.equal(row.lastError, "DELIVERY_FAILED"); assert.ok(row.nextAttemptAt > now);
      assert.equal(row.status, attempt === 5 ? "failed" : "pending");
    }
    assert.equal((await db.select().from(orders).where(eq(orders.id, id))).length, 1);
    assert.equal((await retryFailedAlert(db, id)).length, 1);
    assert.equal(await dispatchOrderAlert(db, send), "sent");
    assert.equal((await db.select().from(orderNotifications).where(eq(orderNotifications.orderId, id)))[0].attempts, 1);
    await db.update(orderNotifications).set({ status: "pending", attempts: 0, sentAt: null }).where(eq(orderNotifications.orderId, id));
    let started!: () => void, release!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; }), waiting = new Promise<void>(resolve => { release = resolve; });
    const stalled = dispatchOrderAlert(db, async () => { started(); await waiting; });
    await ready;
    assert.equal(await dispatchOrderAlert(db, send, new Date(Date.now() + 100000)), "sent");
    release(); assert.equal(await stalled, "lease_lost");
    assert.equal((await db.select().from(orderNotifications).where(eq(orderNotifications.orderId, id)))[0].status, "sent"); // stale completion cannot overwrite the newer worker
  } finally { if (id) await db.delete(orders).where(eq(orders.id, id)); await client`delete from shipping_zones where code='inside-dhaka' and name='Alert fixture'`; await client.end(); }
});
