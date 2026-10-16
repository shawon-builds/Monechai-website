"use client";
import { localePath } from "@/i18n/routing";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCart, readCart, saveCart, type CartItem } from "@/features/cart/storage";
import { checkoutSchema } from "./domain";
import { formatBdt } from "@/lib/money";
import { getDictionary, localizedText, type Locale } from "@/i18n/dictionary";

type Preview = { policyVersion: string | null; quoteHash: string | null; lines: { variantId: string; name: string; label: string; quantity: number; unitPriceMinor: number | null; available: boolean }[];
  zoneConfigured: boolean; zoneName: string | null; paymentAvailable: boolean; totals: { subtotalMinor: number; shippingMinor: number; totalMinor: number } | null };
type Area = { code: string; nameEn: string; nameBn: string | null; district: string };
type SavedOrder = { publicToken: string; orderNumber: string };
type Session = { idempotencyKey: string; order: SavedOrder | null };

async function requestJson(path: string, data?: unknown) {
  const response = await fetch(path, { method: data === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data), cache: "no-store", signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  if (!response.ok) throw Object.assign(new Error(body.error ?? "Service unavailable"), { code: body.code });
  return body;
}
function checkoutMessage(error: unknown, locale: Locale) {
  const t = getDictionary(locale);
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "OUT_OF_STOCK") return t.insufficientStock;
  if (code === "UNAVAILABLE") return t.itemUnavailable;
  if (code === "SHIPPING_NOT_CONFIGURED") return t.shippingUnavailable;
  if (code === "PRICE_CHANGED") return t.priceChanged;
  if (code === "POLICY_CHANGED") return t.policyChanged;
  if (code === "POLICIES_NOT_CONFIGURED") return t.policiesUnavailable;
  if (code === "KEY_REUSED") return t.retryCheckout;
  return locale === "en" && error instanceof Error ? error.message : t.checkoutError;
}

export function CheckoutClient({ locale = "en", areas }: { locale?: Locale; areas: Area[] }) {
  const t = getDictionary(locale);
  const currencyLocale = locale === "bn" ? "bn-BD" : "en-BD";
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [areaCode, setAreaCode] = useState(areas[0]?.code ?? "");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [placing, setPlacing] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState<string | null>(null);
  const accepted = !!preview?.policyVersion && acceptedPolicy === preview.policyVersion;
  function setAccepted(value: boolean) { setAcceptedPolicy(value ? preview?.policyVersion ?? null : null); }
  const [recovering, setRecovering] = useState(true);
  const finish = useCallback(async (order: SavedOrder) => {
    setRecovering(true);
    clearCart(); // Storage failure must never hide a successfully persisted order.
    // Acknowledge only after receiving the saved reference. Lost responses keep
    // the HttpOnly recovery cookie, so reloads cannot create another purchase.
    try { await fetch("/api/checkout/session", { method: "DELETE", signal: AbortSignal.timeout(5000) }); } catch { /* Next visit recovers the same saved order. */ }
    router.replace(localePath(locale, `/order/${order.publicToken}/success`));
  }, [router, locale]);
  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener("monechai:cart-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("monechai:cart-change", sync); window.removeEventListener("storage", sync); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    requestJson("/api/checkout/session").then((session: Session) => {
      if (cancelled) return;
      if (session.order) void finish(session.order);
      else setRecovering(false);
    }).catch(() => { if (!cancelled) { setRecovering(false); setMessage(t.checkoutError); } });
    return () => { cancelled = true; };
  }, [finish, t.checkoutError]);
  useEffect(() => {
    if (!items?.length) return;
    let cancelled = false;
    requestJson("/api/checkout/preview", { items, ...(areaCode ? { deliveryAreaCode: areaCode } : {}) })
      .then((data: Preview) => { if (!cancelled) setPreview(data); })
      .catch((error) => { if (!cancelled) { setPreview(null); setMessage(checkoutMessage(error, locale)); } });
    return () => { cancelled = true; };
  }, [items, areaCode, locale]);
  useEffect(() => {
    const first = Object.keys(errors)[0];
    const name = first === "customerName" ? "name" : first;
    if (name) (form.current?.elements.namedItem(name) as HTMLElement | null)?.focus();
  }, [errors]);
  function update(next: CartItem[]) {
    const result = saveCart(next);
    if (!result.ok) { setMessage(t.cartLimit); return; }
    setPreview(null); setMessage(result.persisted ? "" : t.cartTabOnly);
  }
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items?.length || !preview?.totals || !preview.policyVersion || !accepted || placing || recovering) return;
    setPlacing(true); setMessage(""); setErrors({});
    try {
      const fields = new FormData(event.currentTarget);
      const session: Session = await requestJson("/api/checkout/session");
      if (session.order) { await finish(session.order); return; }
      const input = checkoutSchema.safeParse({ idempotencyKey: session.idempotencyKey, quoteHash: preview.quoteHash, policyVersion: preview.policyVersion, acceptPolicies: fields.get("acceptPolicies") === "on", items, deliveryAreaCode: areaCode, paymentMethod: "cod", website: fields.get("website"),
        customerName: fields.get("name"), phone: fields.get("phone"), address: fields.get("address"), area: fields.get("area"), note: fields.get("note") });
      if (!input.success) {
        const errors = input.error.flatten().fieldErrors;
        setErrors(errors); setMessage(t.fieldError);
        setPlacing(false); return;
      }
      const result: SavedOrder = await requestJson("/api/checkout", input.data);
      await finish(result);
    } catch (error) {
      // Always resolve an uncertain commit before permitting another submission.
      try {
        const session: Session = await requestJson("/api/checkout/session");
        if (session.order) { await finish(session.order); return; }
      } catch { /* Same server-issued retry cookie will be used after recovery. */ }
      if (error && typeof error === "object" && "code" in error && (error.code === "PRICE_CHANGED" || error.code === "POLICY_CHANGED")) {
        setPreview(null); setAccepted(false);
        try { setPreview(await requestJson("/api/checkout/preview", { items, deliveryAreaCode: areaCode })); } catch { /* Retry refresh without creating an order. */ }
      }
      setMessage(checkoutMessage(error, locale)); setPlacing(false);
    }
  }
  if (recovering || !items) return <p role="status">{t.recovering}</p>;
  if (!items.length) return <div className="empty-state"><h2>{t.emptyCart}</h2><Link className="button button-dark" href={localePath(locale, "/shop")}>{t.browseProducts}</Link></div>;
  const invalid = (key: string) => ({ "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `error-${key}` : undefined });
  const error = (key: string) => errors[key] && <p id={`error-${key}`} className="checkout-error">{locale === "bn" ? t.fieldError : errors[key].join(", ")}</p>;
  return <div className="checkout-grid">
    <section aria-label={t.yourItems}><h2>{t.yourItems}</h2>
      {items.map((item) => {
        const line = preview?.lines.find((l) => l.variantId === item.variantId);
        return <div className="cart-line" key={item.variantId}>
          <div><strong>{line?.name ?? t.checkingItem}</strong><p>{line?.label}</p>{line && (!line.available ? <p role="alert">{t.removeOrReduce}</p> : <p>{formatBdt(line.unitPriceMinor!, currencyLocale)} {t.each}</p>)}</div>
          <label>{t.quantity} <input disabled={placing} type="number" min="1" max="20" value={item.quantity} onChange={(e) => { const value = Number(e.target.value); if (Number.isInteger(value) && value >= 1 && value <= 20) update(items.map((l) => l.variantId === item.variantId ? { ...l, quantity: value } : l)); }} /></label>
          <button disabled={placing} type="button" onClick={() => update(items.filter((l) => l.variantId !== item.variantId))}>{t.remove}</button>
        </div>;
      })}
      <label htmlFor="delivery-area">{t.deliveryArea}</label>
      <select id="delivery-area" disabled={placing} value={areaCode} onChange={(e) => { setPreview(null); setAreaCode(e.target.value); }}>
        {!areas.length && <option value="">{t.chooseArea}</option>}{areas.map((a) => <option key={a.code} value={a.code}>{a.district} — {localizedText(locale, a.nameEn, a.nameBn)}</option>)}
      </select>
      {preview?.totals ? <div className="order-summary"><p>{t.subtotal}: {formatBdt(preview.totals.subtotalMinor, currencyLocale)}</p><p>{t.delivery}: {formatBdt(preview.totals.shippingMinor, currencyLocale)}</p><strong>{t.estimatedTotal}: {formatBdt(preview.totals.totalMinor, currencyLocale)}</strong></div> : <p>{preview && !preview.paymentAvailable ? t.codOff : preview && !preview.zoneConfigured ? t.areaFeesMissing : t.reviewItems}</p>}
    </section>
    <form ref={form} onSubmit={submit} className="checkout-form"><h2>{t.deliveryDetails}</h2>
      <fieldset disabled={placing} className="checkout-fields">
        <div className="checkout-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label>{t.fullName}<input name="name" required minLength={2} maxLength={120} autoComplete="name" {...invalid("customerName")} /></label>{error("customerName")}
        <label>{t.mobile}<input name="phone" required type="tel" maxLength={40} autoComplete="tel" placeholder="01712345678" {...invalid("phone")} /></label>{error("phone")}
        <label>{t.street}<input name="address" required minLength={10} maxLength={500} autoComplete="street-address" {...invalid("address")} /></label>{error("address")}
        <label>{t.area}<input name="area" required minLength={2} maxLength={120} {...invalid("area")} /></label>{error("area")}
        <label>{t.note}<textarea name="note" maxLength={500} /></label>
      </fieldset>
      <p>{t.paymentCod}</p>
      {!preview?.policyVersion ? <p role="status">{t.policiesUnavailable}</p> : <>
        <div className="policy-links">{(["shipping", "returns", "privacy", "terms"] as const).map(kind => <Link key={kind} href={localePath(locale, `/policies/${kind}`)} target="_blank" rel="noopener noreferrer">{t[kind]}</Link>)}</div>
        <label className="policy-consent"><input type="checkbox" name="acceptPolicies" required checked={accepted} disabled={placing} onChange={event => setAccepted(event.target.checked)} {...invalid("acceptPolicies")} />{t.acceptPolicies}</label>{error("acceptPolicies")}
      </>}
      {message && <p role="alert" className="checkout-error">{message}</p>}
      <button type="submit" className="button button-dark" disabled={!preview?.totals || !preview.policyVersion || !accepted || placing}>{placing ? t.placing : t.placeOrder}</button>
    </form>
  </div>;
}
