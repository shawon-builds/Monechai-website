import { storePolicies } from "../../src/db/schema/policies";
import type { getDb } from "../../src/db/client";

export const fixturePolicies = {
  shippingEn: "TEST FIXTURE ONLY. Delivery coverage and charges are configured for this isolated test.",
  returnsEn: "TEST FIXTURE ONLY. Returns and refunds are reviewed by the fixture store owner.",
  privacyEn: "TEST FIXTURE ONLY. Contact information is used to fulfill this isolated test purchase.",
  termsEn: "TEST FIXTURE ONLY. Review prices and delivery charges before confirming the order.",
};
export async function createPolicyFixture(db: Pick<ReturnType<typeof getDb>, "insert">) {
  const [row] = await db.insert(storePolicies).values(fixturePolicies).returning();
  return row;
}
