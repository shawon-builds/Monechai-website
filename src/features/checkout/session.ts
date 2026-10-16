import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema";

// A random UUID in an HttpOnly cookie is a private recovery capability, never PII.
// Lock the same key as order placement before checking a possibly in-flight commit.
export async function recoverCheckout(key: string, db = getDb()) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key},0))`);
    const [row] = await tx.select({ publicToken: orders.publicToken, orderNumber: orders.orderNumber })
      .from(orders).where(eq(orders.idempotencyKey, key)).limit(1);
    return row ?? null;
  });
}
