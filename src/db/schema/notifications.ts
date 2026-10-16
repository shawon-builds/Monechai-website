import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "./orders";
export const orderNotifications = pgTable("order_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
  attempts: integer("attempts").notNull().default(0),
  status: text("status").notNull().default("pending"),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  leaseToken: uuid("lease_token"), leaseUntil: timestamp("lease_until", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  check("notification_status", sql`${t.status} IN ('pending','processing','sent','failed')`),
  check("notification_attempts", sql`${t.attempts} >= 0`),
  check("notification_error_safe", sql`${t.lastError} IS NULL OR ${t.lastError} = 'DELIVERY_FAILED'`),
  index("notification_queue_idx").on(t.status, t.nextAttemptAt),
]).enableRLS();
