import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Hashed, short-lived abuse counters; raw IPs/customer details never stored.
export const requestLimits = pgTable("request_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (t) => [index("request_limits_expiry_idx").on(t.expiresAt)]).enableRLS();
