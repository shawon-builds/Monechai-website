import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { orderInventoryHistory, orderItems, orderPaymentHistory, orders, orderStatusHistory, productVariants } from "@/db/schema";

export const orderStatus = z.enum(["pending_confirmation", "confirmed", "packed", "shipped", "delivered", "cancelled", "delivery_failed", "return_requested", "returned"]);
export type OrderStatus = z.infer<typeof orderStatus>;
const allowed: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_confirmation: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "delivery_failed"],
  delivery_failed: ["shipped", "returned"],
  delivered: ["return_requested"],
  return_requested: ["returned", "delivered"],
  returned: [],
  cancelled: [],
};
export function nextStatuses(status: string): readonly OrderStatus[] {
  const parsed = orderStatus.safeParse(status);
  return parsed.success ? allowed[parsed.data] : [];
}

// Call requireAdmin in every caller BEFORE invoking these queries (no public API export).
type Db = Pick<ReturnType<typeof getDb>, "select" | "insert" | "update" | "transaction">;

export async function listOrders(db: Db, page: number, status?: OrderStatus, number?: string) {
  const safePage = Number.isSafeInteger(page) && page >= 1 && page <= 100000 ? page : 1;
  const where = and(status ? eq(orders.status, status) : undefined, number ? eq(orders.orderNumber, number) : undefined);
  const [count] = await db.select({ total: sql<number>`count(*)::int` }).from(orders).where(where);
  const items = await db.select({ id: orders.id, orderNumber: orders.orderNumber, createdAt: orders.createdAt,
    customerName: orders.customerName, phone: orders.phone, area: orders.area,
    totalMinor: orders.totalMinor, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus, status: orders.status,
  }).from(orders).where(where).orderBy(desc(orders.createdAt), desc(orders.id)).limit(30).offset((safePage - 1) * 30);
  return { items, total: count.total, page: safePage };
}

export async function getOrderDetail(db: Db, id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const [items, history, paymentHistory, inventoryHistory] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(asc(orderStatusHistory.createdAt), asc(orderStatusHistory.id)),
    db.select().from(orderPaymentHistory).where(eq(orderPaymentHistory.orderId, id)).orderBy(asc(orderPaymentHistory.createdAt), asc(orderPaymentHistory.id)),
    db.select().from(orderInventoryHistory).where(eq(orderInventoryHistory.orderId, id)).orderBy(asc(orderInventoryHistory.createdAt)),
  ]);
  return { order, items, history, paymentHistory, inventoryHistory };
}

// No browser payment field is accepted. Only the authenticated admin may record cash
// physically received after delivery; refunded/failed require a real reconciliation flow.
export async function recordCodPayment(db: Db, id: string, actorUserId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus })
      .from(orders).where(eq(orders.id, id)).for("update");
    if (!order) return { error: "Order not found." } as const;
    if (order.status !== "delivered" || order.paymentMethod !== "cod" || order.paymentStatus !== "pending")
      return { error: "Cash can be recorded only once, after COD delivery." } as const;
    await tx.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, id));
    await tx.insert(orderPaymentHistory).values({ orderId: id, fromStatus: "pending", toStatus: "paid", actorUserId });
    return { paymentStatus: "paid" } as const;
  });
}

export async function changeOrderStatus(db: Db, id: string, to: OrderStatus, actorUserId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).for("update");
    if (!order) return { error: "Order not found." } as const;
    if (!nextStatuses(order.status).includes(to)) return { error: "This status change is not allowed. Refresh the order." } as const;
    if (to === "cancelled") {
      const released = await releaseInventory(tx, id, actorUserId, "cancellation");
      if (released) return { error: released } as const;
    }
    if (to === "cancelled" || to === "returned") {
      const [payment] = await tx.select({ paymentStatus: orders.paymentStatus }).from(orders).where(eq(orders.id, id));
      if (payment.paymentStatus === "pending") {
        await tx.update(orders).set({ paymentStatus: "failed" }).where(eq(orders.id, id));
        await tx.insert(orderPaymentHistory).values({ orderId: id, fromStatus: "pending", toStatus: "failed", actorUserId });
      }
    }
    await tx.update(orders).set({ status: to, updatedAt: new Date() }).where(eq(orders.id, id));
    await tx.insert(orderStatusHistory).values({ orderId: id, fromStatus: order.status, toStatus: to, actorUserId });
    return { status: to } as const;
  });
}


// Validate every stock row before writing any: error returns cannot commit a partial release.
async function releaseInventory(tx: Parameters<Parameters<Db["transaction"]>[0]>[0], id: string, actor: string, reason: "cancellation" | "return") {
  const [order] = await tx.select({ inventoryReleased: orders.inventoryReleased }).from(orders).where(eq(orders.id, id)).for("update");
  if (order.inventoryReleased) return "Inventory was already released.";
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
  if (items.some((i) => i.variantId && i.inventoryReserved === null)) return "Legacy reservation is unknown. Review inventory before releasing this order.";
  const reserved = items.filter((i) => i.inventoryReserved === true);
  if (reserved.some((i) => !i.variantId)) return "An inventory variant is missing. Review before releasing stock.";
  const rows = reserved.length ? await tx.select().from(productVariants).where(inArray(productVariants.id, reserved.map((i) => i.variantId!))).orderBy(asc(productVariants.id)).for("update") : [];
  for (const item of reserved) {
    const row = rows.find((v) => v.id === item.variantId);
    if (!row?.trackInventory || row.stockQuantity === null || row.stockQuantity + item.quantity > 2147483647) return "Inventory tracking changed or stock would overflow. Review before releasing stock.";
  }
  for (const item of reserved) {
    await tx.update(productVariants).set({ stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}`, updatedAt: new Date() }).where(eq(productVariants.id, item.variantId!));
    await tx.insert(orderInventoryHistory).values({ orderId: id, variantId: item.variantId, quantity: item.quantity, reason, actorUserId: actor });
  }
  await tx.update(orders).set({ inventoryReleased: true, updatedAt: new Date() }).where(eq(orders.id, id));
  return null;
}

export async function restockReturnedOrder(db: Db, id: string, actorUserId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).for("update");
    if (!order || order.status !== "returned") return { error: "Only received returns can be restocked." };
    const error = await releaseInventory(tx, id, actorUserId, "return");
    return error ? { error } : { ok: true };
  });
}
export async function recordCodRefund(db: Db, id: string, actorUserId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status, paymentStatus: orders.paymentStatus }).from(orders).where(eq(orders.id, id)).for("update");
    if (!order || order.status !== "returned" || order.paymentStatus !== "paid") return { error: "Refund can be recorded once, after a paid COD order is returned." };
    await tx.update(orders).set({ paymentStatus: "refunded", updatedAt: new Date() }).where(eq(orders.id, id));
    await tx.insert(orderPaymentHistory).values({ orderId: id, fromStatus: "paid", toStatus: "refunded", actorUserId });
    return { ok: true };
  });
}
export const trackingInput = z.object({ courierName: z.string().trim().max(100), trackingReference: z.string().trim().max(150) });
export async function saveOrderTracking(db: Db, id: string, input: z.output<typeof trackingInput>) {
  const rows = await db.update(orders).set({ courierName: input.courierName || null, trackingReference: input.trackingReference || null, updatedAt: new Date() }).where(eq(orders.id, id)).returning({ id: orders.id });
  return rows.length > 0;
}
