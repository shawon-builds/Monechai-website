"use client";
import { localePath } from "@/i18n/routing";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readCart, saveCart, type CartItem } from "./storage";
import { formatBdt } from "@/lib/money";
import { getDictionary, type Locale } from "@/i18n/dictionary";
import { createCartPreview, type CartLine } from "./preview";

export function CartDrawer({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const currencyLocale = locale === "bn" ? "bn-BD" : "en-BD";
  const dialog = useRef<HTMLDialogElement>(null);
  const [preview] = useState(createCartPreview);
  useEffect(() => () => preview.cancel(), [preview]);
  const [items, setItems] = useState<CartItem[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [error, setError] = useState("");
  function refresh(next: CartItem[]) {
    setItems(next); setLines([]); setError("");
    void preview.refresh(next, setLines, () => setError(t.cartError));
  }
  function close() {
    preview.cancel();
    dialog.current?.close();
  }
  function update(next: CartItem[]) {
    const result = saveCart(next);
    if (!result.ok) { setError(t.cartLimit); return; }
    refresh(next);
  }
  return <>
    <button type="button" className="cart-trigger" onClick={() => { dialog.current?.showModal(); refresh(readCart()); }}>{t.cart}</button>
    <dialog ref={dialog} className="cart-drawer" aria-label={t.yourCart} onClose={() => { if (!dialog.current?.open) preview.cancel(); }} onCancel={() => preview.cancel()} onClick={(e) => { if (e.target === dialog.current) close(); }}>
      <div className="drawer-header"><h2>{t.yourCart}</h2><button type="button" onClick={close} aria-label={t.closeCart}>✕</button></div>
      {!items.length ? <p>{t.emptyCart}</p> : <>
        {items.map((item) => {
          const line = lines.find((entry) => entry.variantId === item.variantId);
          return <div className="cart-line" key={item.variantId}>
            <div><strong>{line?.name ?? (error ? t.unavailable : t.checkingItem)}</strong><p>{line?.label}</p>{line && <p>{line.available ? formatBdt(line.unitPriceMinor!, currencyLocale) : t.unavailable}</p>}</div>
            <label>{t.quantity} <input type="number" min="1" max="20" value={item.quantity} onChange={(e) => { const quantity = Number(e.target.value); if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 20 && quantity !== item.quantity) update(items.map((entry) => entry.variantId === item.variantId ? { ...entry, quantity } : entry)); }} /></label>
            <button type="button" onClick={() => update(items.filter((entry) => entry.variantId !== item.variantId))}>{t.remove}</button>
          </div>;
        })}
        {error && <div><p role="alert">{error}</p><button type="button" onClick={() => refresh(items)}>{t.tryAgain}</button></div>}
        <p>{t.finalCheck}</p>
        <Link href={localePath(locale, "/checkout")} className="button button-dark" onClick={close}>{t.proceed}</Link>
      </>}
    </dialog>
  </>;
}
