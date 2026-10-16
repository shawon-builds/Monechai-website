import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Committed admin changes only. Text is fingerprinted/redacted by the DB trigger. */
export const adminMutationHistory = pgTable("admin_mutation_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  changes: jsonb("changes").$type<Record<string, { previous: unknown; next: unknown }>>().notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [
  check("admin_history_action", sql`${t.action} IN ('insert','update','delete')`),
  check("admin_history_resource", sql`${t.resourceType} IN ('categories','products','product_variants','product_images','orders','shipping_zones','delivery_areas','site_settings','store_policies')`),
  check("admin_history_resource_id", sql`length(${t.resourceId}) BETWEEN 1 AND 150`),
  check("admin_history_changes", sql`jsonb_typeof(${t.changes}) = 'object' AND ${t.changes} <> '{}'::jsonb AND octet_length(${t.changes}::text) <= 16000`),
  index("admin_history_resource_time_idx").on(t.resourceType, t.resourceId, t.occurredAt, t.id),
  index("admin_history_time_idx").on(t.occurredAt, t.id),
]).enableRLS();
