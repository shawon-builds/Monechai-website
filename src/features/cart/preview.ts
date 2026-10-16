import type { CartItem } from "./storage";

export type CartLine = { variantId: string; name: string; label: string; available: boolean; unitPriceMinor: number | null };
export const CART_PREVIEW_TIMEOUT_MS = 15_000;

// One active preview per drawer. The identity fence also covers a response body
// that finishes after cancellation, even if the transport ignores AbortSignal.
export function createCartPreview() {
  let active: { controller: AbortController; timer: ReturnType<typeof setTimeout> } | undefined;
  function cancel() {
    const previous = active;
    active = undefined;
    if (previous) { clearTimeout(previous.timer); previous.controller.abort(); }
  }
  async function refresh(items: CartItem[], success: (lines: CartLine[]) => void, error: () => void) {
    cancel();
    if (!items.length) return;
    const controller = new AbortController();
    const request = { controller, timer: setTimeout(() => { if (active === request) { cancel(); error(); } }, CART_PREVIEW_TIMEOUT_MS) };
    active = request;
    try {
      const response = await fetch("/api/checkout/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }), cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Cart preview unavailable");
      const data = await response.json();
      if (active === request) { clearTimeout(request.timer); active = undefined; success(data.lines); }
    } catch {
      if (active === request) { cancel(); error(); }
    }
  }
  return { refresh, cancel };
}
