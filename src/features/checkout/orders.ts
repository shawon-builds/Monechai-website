import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { deliveryAreas, orderNotifications, orderItems, orderStatusHistory, orders, products, productVariants, shippingZones, siteSettings } from "@/db/schema";
import { createQuoteHash } from "./quote";
import { checkoutSchema, calculateTotals } from "./domain";
import { storePolicies } from "@/db/schema/policies";

export class CheckoutError extends Error {
  constructor(public code: "UNAVAILABLE" | "OUT_OF_STOCK" | "SHIPPING_NOT_CONFIGURED" | "KEY_REUSED" | "PRICE_CHANGED" | "POLICIES_NOT_CONFIGURED" | "POLICY_CHANGED", message: string) {
    super(message);
  }
}

// The UUID is a retry handle, not a browser-supplied order identifier. A DB unique constraint
// backs up this transaction-scoped lock; a changed request cannot reuse an existing key.
export async function placeCodOrder(raw: unknown, db: Pick<ReturnType<typeof getDb>, "transaction"> = getDb()) {
  const input = checkoutSchema.parse(raw);
  const sorted = [...input.items].sort((a, b) => a.variantId.localeCompare(b.variantId));
  const requestHash = createHash("sha256").update(JSON.stringify({ ...input, items: sorted, idempotencyKey: undefined, website: undefined })).digest("hex");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${input.idempotencyKey}, 0))`);
    const [existing] = await tx.select({ publicToken: orders.publicToken, orderNumber: orders.orderNumber, requestHash: orders.requestHash })
      .from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existing) {
      if (existing.requestHash !== requestHash) throw new CheckoutError("KEY_REUSED", "Start a new checkout for changed details");
      return { publicToken: existing.publicToken, orderNumber: existing.orderNumber };
    }
    const [settings] = await tx.select({ codEnabled: siteSettings.codEnabled }).from(siteSettings).where(eq(siteSettings.id, 1)).for("share");
    if (!settings?.codEnabled) throw new CheckoutError("UNAVAILABLE", "Cash on Delivery is currently unavailable");
    const [policies] = await tx.select({ id: storePolicies.id }).from(storePolicies).where(eq(storePolicies.isActive, true)).limit(1).for("share");
    if (!policies) throw new CheckoutError("POLICIES_NOT_CONFIGURED", "Approved store policies are not configured yet");
    if (policies.id !== input.policyVersion) throw new CheckoutError("POLICY_CHANGED", "Store policies changed. Read the updated policies and confirm again.");

    // FOR UPDATE locks products and variants while resolving prices/availability. Sorted IDs
    // and conditional stock updates prevent oversells, even across concurrent checkouts.
    const rows = await tx.select({
      variantId: productVariants.id, sku: productVariants.sku, label: productVariants.label,
      attributes: productVariants.attributes, variantPrice: productVariants.priceMinor,
      trackInventory: productVariants.trackInventory, stock: productVariants.stockQuantity,
      active: productVariants.isActive, productId: products.id, productName: products.nameEn,
      productSku: products.sku, price: products.priceMinor, published: products.isPublished, demo: products.isDemo,
    }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(productVariants.id, sorted.map((item) => item.variantId)))
      .orderBy(productVariants.id).for("update");
    const byId = new Map(rows.map((row) => [row.variantId, row]));
    const lines = sorted.map(({ variantId, quantity }) => {
      const row = byId.get(variantId);
      if (!row || !row.active || !row.published || row.demo) throw new CheckoutError("UNAVAILABLE", "An item is no longer available. Refresh your cart.");
      if (row.trackInventory && (row.stock ?? 0) < quantity) throw new CheckoutError("OUT_OF_STOCK", "An item has insufficient stock. Refresh your cart.");
      return { ...row, quantity, unitPriceMinor: row.variantPrice ?? row.price };
    });
    const [area] = await tx.select().from(deliveryAreas).where(and(eq(deliveryAreas.code, input.deliveryAreaCode), eq(deliveryAreas.isActive, true))).limit(1).for("share");
    if (!area) throw new CheckoutError("SHIPPING_NOT_CONFIGURED", "Choose an approved delivery area");
    const [zone] = await tx.select().from(shippingZones).where(eq(shippingZones.code, area.shippingZoneCode)).limit(1).for("share");
    if (!zone) throw new CheckoutError("SHIPPING_NOT_CONFIGURED", "Delivery to this zone is not configured yet");
    const totals = calculateTotals(lines, zone);
    if (input.quoteHash !== createQuoteHash(lines, totals, area.code)) throw new CheckoutError("PRICE_CHANGED", "Prices or delivery fees changed. Review the refreshed total.");
    const publicToken = randomBytes(32).toString("hex");
    const orderNumber = `MC-${publicToken.slice(0, 16).toUpperCase()}`;
    const [order] = await tx.insert(orders).values({
      publicToken, orderNumber, idempotencyKey: input.idempotencyKey, requestHash,
      customerName: input.customerName, phone: input.phone, address: input.address, area: input.area, note: input.note,
      policyVersionId: policies.id, policyAcceptedAt: new Date(),
      shippingZoneCode: zone.code, shippingZoneName: zone.name, deliveryAreaCode: area.code, deliveryAreaName: area.nameEn, ...totals,
    }).returning({ id: orders.id });
    await tx.insert(orderNotifications).values({ orderId: order.id });
    await tx.insert(orderStatusHistory).values({ orderId: order.id, toStatus: "pending_confirmation" });
    await tx.insert(orderItems).values(lines.map((line) => ({
      orderId: order.id, productId: line.productId, variantId: line.variantId,
      productName: line.productName, productSku: line.productSku, variantSku: line.sku,
      variantLabel: line.label, attributes: line.attributes, quantity: line.quantity, inventoryReserved: line.trackInventory,
      unitPriceMinor: line.unitPriceMinor, lineTotalMinor: line.unitPriceMinor * line.quantity,
    })));
    for (const line of lines) {
      if (!line.trackInventory) continue;
      const [updated] = await tx.update(productVariants)
        .set({ stockQuantity: sql`${productVariants.stockQuantity} - ${line.quantity}`, updatedAt: new Date() })
        .where(and(eq(productVariants.id, line.variantId), gte(productVariants.stockQuantity, line.quantity)))
        .returning({ id: productVariants.id });
      if (!updated) throw new CheckoutError("OUT_OF_STOCK", "An item has insufficient stock. Refresh your cart.");
    }
    return { publicToken, orderNumber };
  });
}
