import { localePath } from "@/i18n/routing";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getPublicReceipt } from "@/features/checkout/receipt";
import { formatBdt } from "@/lib/money";
import { getLocale } from "@/i18n/server";
import { getDictionary, orderStatusLabel, paymentStatusLabel } from "@/i18n/dictionary";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDictionary(await getLocale()).orderReceived, robots: { index: false, follow: false }, referrer: "no-referrer" as const }; }
export default async function OrderSuccess({ params }: { params: Promise<{ publicToken: string }> }) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { publicToken } = await params;
  if (!/^[0-9a-f]{64}$/.test(publicToken)) notFound();
  const receipt = await getPublicReceipt(getDb(), publicToken);
  if (!receipt) notFound();
  const { order, items } = receipt;
  return <div className="container success-page"><h1>{t.orderReceived}</h1><p>{t.orderSaved}</p>
    <p>{t.reference}: <strong>{order.orderNumber}</strong></p><p>{t.totalDelivery}: <strong>{formatBdt(order.totalMinor, locale === "bn" ? "bn-BD" : "en-BD")}</strong></p>
    <p>{t.fulfillmentStatus}: {orderStatusLabel(locale, order.status)}</p>
    <p>{t.paymentStatus}: {paymentStatusLabel(locale, order.paymentStatus)}</p><p>{t.privateLink}</p>
    <section aria-label={locale === "bn" ? "অর্ডারের রসিদ" : "Order receipt"}><h2>{locale === "bn" ? "আপনার পণ্য" : "Your items"}</h2>
      <ul>{items.map((item, index) => <li key={index}>{item.productName} · {item.variantLabel} · {item.quantity} × {formatBdt(item.unitPriceMinor, locale === "bn" ? "bn-BD" : "en-BD")} = {formatBdt(item.lineTotalMinor, locale === "bn" ? "bn-BD" : "en-BD")}</li>)}</ul>
      <p>{t.delivery}: {formatBdt(order.shippingMinor, locale === "bn" ? "bn-BD" : "en-BD")}</p>
      {order.courierName && <p>{locale === "bn" ? "কুরিয়ার" : "Courier"}: {order.courierName}</p>}
      {order.trackingReference && <p>{locale === "bn" ? "ট্র্যাকিং নম্বর" : "Tracking reference"}: {order.trackingReference}</p>}
    </section>
    <Link className="button button-dark" href={localePath(locale, "/shop")}>{t.continueShopping}</Link>
  </div>;
}
