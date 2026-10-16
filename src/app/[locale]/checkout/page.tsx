import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { deliveryAreas } from "@/db/schema";
import { CheckoutClient } from "@/features/checkout/checkout-client";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionary";
export async function generateMetadata() { return { title: getDictionary(await getLocale()).checkoutTitle, robots: { index: false, follow: false }, referrer: "no-referrer" as const }; }
export default async function CheckoutPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const areas = await getDb().select().from(deliveryAreas).where(and(eq(deliveryAreas.isActive, true))).orderBy(asc(deliveryAreas.district), asc(deliveryAreas.nameEn));
  return <div className="container checkout-page"><h1>{t.checkoutTitle}</h1><p>{t.checkoutIntro}</p><CheckoutClient locale={locale} areas={areas} /></div>;
}
