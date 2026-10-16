import { test } from "node:test";
import assert from "node:assert/strict";
import { addToCart, clearCart, readCart, sanitizeCart, saveCart } from "./storage";
const storage = new Map<string, string>();
Object.assign(globalThis, { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) }, window: { dispatchEvent: () => true } });
test("poisoned cart recovery keeps valid items, merges duplicates and respects all limits", () => {
  const id = crypto.randomUUID();
  const rows = sanitizeCart([{ variantId: id, quantity: 19 }, { variantId: id, quantity: 5 }, { variantId: "bad", quantity: 1 }, ...Array.from({ length: 35 }, () => ({ variantId: crypto.randomUUID(), quantity: 20 }))]);
  assert.equal(rows[0].quantity, 20);
  assert.equal(rows.reduce((sum, item) => sum + item.quantity, 0), 100);
  assert.ok(rows.length <= 30);
});
test("invalid quantity edits preserve the previous cart and add reports real limits", () => {
  clearCart(); const id = crypto.randomUUID();
  assert.equal(saveCart([{ variantId: id, quantity: 20 }]).ok, true);
  assert.equal(addToCart(id).ok, false);
  assert.equal(saveCart([{ variantId: id, quantity: 21 }]).ok, false);
  assert.equal(readCart()[0].quantity, 20);
});
test("unavailable browser storage preserves a usable tab cart and cannot prevent clearing", () => {
  Object.assign(globalThis, { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } } });
  const id = crypto.randomUUID();
  assert.deepEqual(saveCart([{ variantId: id, quantity: 1 }]), { ok: true, persisted: false });
  assert.equal(readCart()[0].variantId, id);
  assert.doesNotThrow(clearCart);
  assert.deepEqual(readCart(), []);
});
