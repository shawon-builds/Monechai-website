import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, lte, or, sql } from "drizzle-orm";
import type { getDb } from "@/db/client";
import { orderNotifications, orders } from "@/db/schema";

type Db = Pick<ReturnType<typeof getDb>, "transaction" | "select" | "update">;
export type OrderAlert = { id: string; orderNumber: string; totalMinor: number };
export async function dispatchOrderAlert(db: Db, send: (order: OrderAlert) => Promise<void>, now = new Date()) {
  const lease = randomUUID();
  const claimed = await db.transaction(async tx => {
    const [row] = await tx.select().from(orderNotifications).where(and(
      lte(orderNotifications.nextAttemptAt, now), or(eq(orderNotifications.status, "pending"), and(eq(orderNotifications.status, "processing"), lte(orderNotifications.leaseUntil, now))),
    )).orderBy(orderNotifications.createdAt, orderNotifications.id).limit(1).for("update", { skipLocked: true });
    if (!row) return null;
    await tx.update(orderNotifications).set({ status: "processing", attempts: row.attempts + 1, leaseToken: lease, leaseUntil: new Date(now.getTime() + 90000) }).where(eq(orderNotifications.id, row.id));
    return { ...row, attempts: row.attempts + 1 };
  });
  if (!claimed) return "idle" as const;
  const owned = and(eq(orderNotifications.id, claimed.id), eq(orderNotifications.leaseToken, lease));
  try {
    const [order] = await db.select({ id: orders.id, orderNumber: orders.orderNumber, totalMinor: orders.totalMinor }).from(orders).where(eq(orders.id, claimed.orderId));
    if (!order) throw new Error("Order unavailable");
    await send(order);
    const [saved] = await db.update(orderNotifications).set({ status: "sent", sentAt: new Date(), leaseToken: null, leaseUntil: null, lastError: null }).where(owned).returning({ id: orderNotifications.id });
    return saved ? "sent" as const : "lease_lost" as const;
  } catch {
    await db.update(orderNotifications).set({ status: claimed.attempts >= 5 ? "failed" : "pending", nextAttemptAt: new Date(now.getTime() + Math.min(3600000, 60000 * 2 ** claimed.attempts)), leaseToken: null, leaseUntil: null, lastError: "DELIVERY_FAILED" }).where(owned);
    return "retry" as const;
  }
}
export async function retryFailedAlert(db: Db, orderId: string) {
  return db.update(orderNotifications).set({ status: "pending", attempts: 0, nextAttemptAt: new Date(), lastError: null, leaseToken: null, leaseUntil: null }).where(and(eq(orderNotifications.orderId, orderId), eq(orderNotifications.status, "failed"))).returning({ id: orderNotifications.id });
}
export async function alertQueueSummary(db: Pick<Db, "select">) {
  return db.select({ status: orderNotifications.status, count: sql<number>`count(*)::int` }).from(orderNotifications).groupBy(orderNotifications.status);
}
