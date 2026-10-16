import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// Published revisions are retained for historical purchase consent; no guessed policy defaults.
export const storePolicies = pgTable("store_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  shippingEn: text("shipping_en").notNull(), shippingBn: text("shipping_bn"),
  returnsEn: text("returns_en").notNull(), returnsBn: text("returns_bn"),
  privacyEn: text("privacy_en").notNull(), privacyBn: text("privacy_bn"),
  termsEn: text("terms_en").notNull(), termsBn: text("terms_bn"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("one_active_store_policy").on(t.isActive).where(sql`${t.isActive} = true`),
  check("store_policy_content", sql`length(trim(${t.shippingEn})) > 0 AND length(trim(${t.returnsEn})) > 0 AND length(trim(${t.privacyEn})) > 0 AND length(trim(${t.termsEn})) > 0`),
]).enableRLS();
