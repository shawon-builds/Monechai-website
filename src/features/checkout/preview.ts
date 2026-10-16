import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { deliveryAreas, products, productVariants, shippingZones, siteSettings } from "@/db/schema";
import { createQuoteHash } from "./quote";
import { calculateTotals, cartSchema } from "./domain";
import { localizedText, type Locale } from "@/i18n/dictionary";
import { storePolicies } from "@/db/schema/policies";

export async function previewCart(raw: unknown, areaCode: string | undefined, db: Pick<ReturnType<typeof getDb>, "select"> = getDb(), locale: Locale = "en") {
  const items = cartSchema.parse(raw);
  const rows = await db.select({ variantId: productVariants.id, productId: products.id, name: products.nameEn, nameBn: products.nameBn,
    label: productVariants.label, labelBn: productVariants.labelBn, priceMinor: productVariants.priceMinor, basePriceMinor: products.priceMinor,
    active: productVariants.isActive, published: products.isPublished, demo: products.isDemo,
    stock: productVariants.stockQuantity, trackInventory: productVariants.trackInventory,
  }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, items.map((item) => item.variantId)));
  const byId = new Map(rows.map((row) => [row.variantId, row]));
  const lines = items.map(({ variantId, quantity }) => {
    const row = byId.get(variantId);
    const available = !!row && row.active && row.published && !row.demo && (!row.trackInventory || (row.stock ?? 0) >= quantity);
    return { variantId, quantity, name: row ? localizedText(locale, row.name, row.nameBn) : locale === "bn" ? "সরানো পণ্য" : "Removed item", label: row ? localizedText(locale, row.label, row.labelBn) : "", unitPriceMinor: available ? (row.priceMinor ?? row.basePriceMinor) : null, available };
  });
  const [area] = areaCode ? await db.select().from(deliveryAreas).where(and(eq(deliveryAreas.code, areaCode), eq(deliveryAreas.isActive, true))).limit(1) : [];
  const [[zone], [settings]] = await Promise.all([
    area ? db.select().from(shippingZones).where(eq(shippingZones.code, area.shippingZoneCode)).limit(1) : Promise.resolve([]),
    db.select({ codEnabled: siteSettings.codEnabled }).from(siteSettings).where(eq(siteSettings.id, 1)).limit(1),
  ]);
  const paymentAvailable = !!settings?.codEnabled;
  const [policies] = await db.select({ id: storePolicies.id }).from(storePolicies).where(eq(storePolicies.isActive, true)).limit(1);
  const totals = zone && paymentAvailable && lines.every((line) => line.available && line.unitPriceMinor !== null)
    ? calculateTotals(lines.map((line) => ({ quantity: line.quantity, unitPriceMinor: line.unitPriceMinor! })), zone) : null;
  const quoteHash = totals && area ? createQuoteHash(lines.map(line => ({ variantId: line.variantId, quantity: line.quantity, unitPriceMinor: line.unitPriceMinor! })), totals, area.code) : null;
  return { lines, quoteHash, policyVersion: policies?.id ?? null, zoneConfigured: !!zone, zoneName: zone?.name ?? null, paymentAvailable, totals };
}
