import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/routing";
import { StoreShell } from "@/components/layout/store-shell";
import { LocaleDocument } from "@/i18n/locale-document";

export default async function LocaleLayout({ params, children }: { params: Promise<{ locale: string }>; children: React.ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <><LocaleDocument locale={locale} /><StoreShell locale={locale}>{children}</StoreShell></>;
}
