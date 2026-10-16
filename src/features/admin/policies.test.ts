import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { categories, deliveryAreas, orders, products, productVariants, shippingZones, storePolicies } from "@/db/schema";
import { fixturePolicies } from "../../../tests/fixtures/policies";
import { getActivePolicies, policyInput, publishPolicies } from "./policies";
import { CheckoutError, placeCodOrder } from "../checkout/orders";
import { previewCart } from "../checkout/preview";

const approved = policyInput.parse({ ...fixturePolicies, shippingBn: "", returnsBn: "", privacyBn: "", termsBn: "" });
test("publishing policies requires complete owner content, bounded plain text and no invented defaults", () => {
  assert.equal(policyInput.safeParse({}).success, false);
  assert.equal(policyInput.safeParse({ ...approved, shippingEn: "" }).success, false);
  assert.equal(policyInput.safeParse({ ...approved, termsEn: "a".repeat(20001) }).success, false);
  assert.equal(approved.shippingBn, null);
});
test("changed policies require new consent; historical policy and consent cannot be rewritten", { skip: !process.env.DATABASE_URL }, async () => {
  const client = postgres(process.env.DATABASE_URL!, { ssl: false, max: 1 }), db = drizzle({ client });
  try {
    await assert.rejects(db.transaction(async tx => {
      const [category] = await tx.insert(categories).values({ slug: `policy-${crypto.randomUUID()}`, nameEn: "Policy fixture" }).returning();
      const [product] = await tx.insert(products).values({ slug: `policy-${crypto.randomUUID()}`, sku: crypto.randomUUID(), categoryId: category.id, nameEn: "Policy item", priceMinor: 1000, isPublished: true }).returning();
      const [variant] = await tx.insert(productVariants).values({ productId: product.id, sku: crypto.randomUUID(), stockQuantity: 2 }).returning();
      await tx.insert(shippingZones).values({ code: "inside-dhaka", name: "Policy fixture", feeMinor: 100 });
      await tx.insert(deliveryAreas).values({ code: "policy-fixture", nameEn: "Policy area", district: "Test", shippingZoneCode: "inside-dhaka" });
      const items = [{ variantId: variant.id, quantity: 1 }];
      const input = { idempotencyKey: crypto.randomUUID(), quoteHash: (await previewCart(items, "policy-fixture", tx)).quoteHash, items, customerName: "Private Customer", phone: "01712345678", address: "Private address 123", area: "Test", deliveryAreaCode: "policy-fixture", paymentMethod: "cod", acceptPolicies: true, policyVersion: crypto.randomUUID() };
      await assert.rejects(placeCodOrder(input, tx), e => e instanceof CheckoutError && e.code === "POLICIES_NOT_CONFIGURED");
      const first = await publishPolicies(tx, approved);
      const second = await publishPolicies(tx, { ...approved, shippingEn: `${approved.shippingEn} Updated owner wording.` });
      assert.equal((await getActivePolicies(tx))?.id, second.id);
      await assert.rejects(placeCodOrder({ ...input, policyVersion: first.id }, tx), e => e instanceof CheckoutError && e.code === "POLICY_CHANGED");
      assert.equal((await tx.select().from(orders)).length, 0);
      assert.equal((await tx.select().from(productVariants).where(eq(productVariants.id, variant.id)))[0].stockQuantity, 2);
      await assert.rejects(placeCodOrder({ ...input, policyVersion: second.id, acceptPolicies: false }, tx));
      const saved = await placeCodOrder({ ...input, policyVersion: second.id }, tx);
      const [order] = await tx.select().from(orders).where(eq(orders.publicToken, saved.publicToken));
      assert.equal(order.policyVersionId, second.id); assert.ok(order.policyAcceptedAt);
      const third = await publishPolicies(tx, approved);
      assert.equal((await getActivePolicies(tx))?.id, third.id);
      assert.deepEqual(await placeCodOrder({ ...input, policyVersion: second.id }, tx), saved); // committed retry survives new policies
      await assert.rejects(tx.transaction(async sp => { await sp.update(storePolicies).set({ termsEn: "Rewrite history" }).where(eq(storePolicies.id, second.id)); }), e => /immutable/.test((e as { cause?: Error }).cause?.message ?? ""));
      await assert.rejects(tx.transaction(async sp => { await sp.update(orders).set({ policyVersionId: third.id }).where(eq(orders.id, order.id)); }), e => /immutable/.test((e as { cause?: Error }).cause?.message ?? ""));
      throw new Error("rollback policy fixture");
    }), /rollback policy fixture/);
  } finally { await client.end(); }
});
