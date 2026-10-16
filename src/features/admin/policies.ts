import "server-only";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { getDb } from "@/db/client";
import { storePolicies } from "@/db/schema/policies";

export const policyKinds = ["shipping", "returns", "privacy", "terms"] as const;
export type PolicyKind = typeof policyKinds[number];
const required = z.string().trim().min(20, "Enter the owner's complete approved policy").max(20000);
const optional = z.string().trim().max(20000).transform(value => value || null);
export const policyInput = z.object({
  shippingEn: required, shippingBn: optional, returnsEn: required, returnsBn: optional,
  privacyEn: required, privacyBn: optional, termsEn: required, termsBn: optional,
});

type Db = Pick<ReturnType<typeof getDb>, "select" | "transaction">;
export async function getActivePolicies(db: Pick<Db, "select">) {
  const [row] = await db.select().from(storePolicies).where(eq(storePolicies.isActive, true)).limit(1);
  return row ?? null;
}
export async function publishPolicies(db: Db, input: z.output<typeof policyInput>) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('monechai-policy-publish',0))`);
    const current = await getActivePolicies(tx);
    if (current && Object.entries(input).every(([key, value]) => current[key as keyof typeof input] === value)) return current;
    await tx.update(storePolicies).set({ isActive: false }).where(eq(storePolicies.isActive, true));
    const [row] = await tx.insert(storePolicies).values(input).returning();
    return row;
  });
}
