import { cartSchema } from "@/features/checkout/domain";

export type CartItem = { variantId: string; quantity: number };
const key = "monechai:cart:v1";
let memory: CartItem[] = [];
let storageFailed = false;
export type CartResult = { ok: boolean; reason?: "limit" | "invalid"; persisted: boolean };

export function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const result: CartItem[] = [];
  for (const entry of raw.slice(0, 100)) {
    if (!entry || typeof entry !== "object" || typeof entry.variantId !== "string" || !Number.isInteger(entry.quantity) || entry.quantity < 1) continue;
    const line = { variantId: entry.variantId.toLowerCase(), quantity: Math.min(20, entry.quantity) };
    if (!cartSchema.safeParse([line]).success) continue;
    const existing = result.find((item) => item.variantId === line.variantId);
    const sum = result.reduce((n, item) => n + item.quantity, 0);
    const quantity = Math.min(line.quantity, 100 - sum, existing ? 20 - existing.quantity : 20);
    if (quantity <= 0 || !existing && result.length >= 30) continue;
    if (existing) existing.quantity += quantity;
    else result.push({ ...line, quantity });
  }
  return result;
}
export function readCart(): CartItem[] {
  if (!storageFailed) {
    try { memory = sanitizeCart(JSON.parse(localStorage.getItem(key) ?? "[]")); }
    catch { storageFailed = true; }
  }
  return memory.map((item) => ({ ...item }));
}
export function saveCart(items: CartItem[]): CartResult {
  if (items.length && !cartSchema.safeParse(items).success) return { ok: false, reason: "limit", persisted: !storageFailed };
  memory = items.map(({ variantId, quantity }) => ({ variantId, quantity }));
  try { if (items.length) localStorage.setItem(key, JSON.stringify(memory)); else localStorage.removeItem(key); }
  catch { storageFailed = true; }
  window.dispatchEvent(new Event("monechai:cart-change"));
  return { ok: true, persisted: !storageFailed };
}
export function clearCart() { return saveCart([]); }
export function addToCart(variantId: string): CartResult {
  const cart = readCart();
  const item = cart.find((line) => line.variantId === variantId);
  if (cart.reduce((sum, line) => sum + line.quantity, 0) >= 100 || item && item.quantity >= 20 || !item && cart.length >= 30) return { ok: false, reason: "limit", persisted: !storageFailed };
  if (item) item.quantity++;
  else cart.push({ variantId, quantity: 1 });
  return saveCart(cart);
}
