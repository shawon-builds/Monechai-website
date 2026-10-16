import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orderItems, orders } from "@/db/schema";

// Bearer receipts deliberately exclude customer details and administrative history.
export async function getPublicReceipt(db: Pick<ReturnType<typeof getDb>, "select">, publicToken: string) {
  if (!/^[0-9a-f]{64}$/.test(publicToken)) return null;
  const [order] = await db.select({ id: orders.id, orderNumber: orders.orderNumber, totalMinor: orders.totalMinor, status: orders.status, paymentStatus: orders.paymentStatus, shippingMinor: orders.shippingMinor, courierName: orders.courierName, trackingReference: orders.trackingReference })
    .from(orders).where(eq(orders.publicToken, publicToken)).limit(1);
  if (!order) return null;
  const items = await db.select({ productName: orderItems.productName, variantLabel: orderItems.variantLabel, quantity: orderItems.quantity, unitPriceMinor: orderItems.unitPriceMinor, lineTotalMinor: orderItems.lineTotalMinor }).from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}
