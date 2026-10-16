import { createHash } from "node:crypto";

// A stale-view fingerprint, never an authoritative browser price or payment token.
export function createQuoteHash(lines: { variantId: string; quantity: number; unitPriceMinor: number }[], totals: { subtotalMinor: number; shippingMinor: number; totalMinor: number }, deliveryAreaCode: string) {
  return createHash("sha256").update(JSON.stringify({ deliveryAreaCode,
    items: lines.map(({variantId,quantity,unitPriceMinor}) => ({variantId,quantity,unitPriceMinor})).sort((a,b) => a.variantId.localeCompare(b.variantId)),
    totals: { subtotalMinor: totals.subtotalMinor, shippingMinor: totals.shippingMinor, totalMinor: totals.totalMinor },
  })).digest("hex");
}
