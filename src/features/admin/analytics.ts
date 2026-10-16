import "server-only";
import { and, desc, eq, gte, lt, notInArray, sql } from "drizzle-orm";
import type { getDb } from "@/db/client";
import { orderItems, orderPaymentHistory, orders } from "@/db/schema";

export function analyticsWindow(raw: string | undefined, now = new Date()) {
  const days = raw === "7" ? 7 : raw === "90" ? 90 : 30;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const startOfToday = new Date(`${today}T00:00:00+06:00`);
  const end = new Date(startOfToday.getTime() + 86400000);
  const start = new Date(end.getTime() - days * 86400000);
  const dates = Array.from({ length: days }, (_, index) => new Date(start.getTime() + index * 86400000 + 21600000).toISOString().slice(0, 10));
  return { days, start, end, dates };
}

function safeAmount(value: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error("Report total exceeds the supported money range.");
  return number;
}

// Caller must requireAdmin() before reading reports, just like the order list.
export async function getAdminAnalytics(db: Pick<ReturnType<typeof getDb>, "select">, rawDays?: string, now = new Date()) {
  const window = analyticsWindow(rawDays, now);
  const placedWithin = and(gte(orders.createdAt, window.start), lt(orders.createdAt, window.end));
  const eligible = notInArray(orders.status, ["cancelled", "delivery_failed", "returned"]);
  const day = sql<string>`to_char(${orders.createdAt} at time zone 'Asia/Dhaka', 'YYYY-MM-DD')`;
  const [[summary], cash, daily, statuses, topProducts] = await Promise.all([
    db.select({ totalOrders: sql<number>`count(*)::int`, delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`, cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`, orderValue: sql<string>`coalesce(sum(case when ${eligible} then ${orders.totalMinor} else 0 end), 0)::text` }).from(orders).where(placedWithin),
    db.select({ status: orderPaymentHistory.toStatus, total: sql<string>`sum(${orders.totalMinor})::text`, count: sql<number>`count(*)::int` }).from(orderPaymentHistory).innerJoin(orders, eq(orders.id, orderPaymentHistory.orderId)).where(and(gte(orderPaymentHistory.createdAt, window.start), lt(orderPaymentHistory.createdAt, window.end))).groupBy(orderPaymentHistory.toStatus),
    db.select({ day, count: sql<number>`count(*)::int` }).from(orders).where(placedWithin).groupBy(day).orderBy(day),
    db.select({ status: orders.status, count: sql<number>`count(*)::int` }).from(orders).where(placedWithin).groupBy(orders.status).orderBy(desc(sql`count(*)`)),
    db.select({ sku: orderItems.productSku, name: orderItems.productName, quantity: sql<number>`sum(${orderItems.quantity})::int`, total: sql<string>`sum(${orderItems.lineTotalMinor})::text` }).from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).where(and(placedWithin, eligible)).groupBy(orderItems.productSku, orderItems.productName).orderBy(desc(sql`sum(${orderItems.quantity})`), orderItems.productSku, orderItems.productName).limit(8),
  ]);
  const collected = safeAmount(cash.find(row => row.status === "paid")?.total ?? "0");
  const refunded = safeAmount(cash.find(row => row.status === "refunded")?.total ?? "0");
  const counts = new Map(daily.map(row => [row.day, row.count]));
  return { window, ...summary, orderValue: safeAmount(summary.orderValue), collected, refunded, netCollected: safeAmount(String(collected - refunded)), statuses,
    daily: window.dates.map(date => ({ date, count: counts.get(date) ?? 0 })),
    topProducts: topProducts.map(row => ({ ...row, total: safeAmount(row.total) })),
  };
}
