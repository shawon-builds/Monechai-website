import { localePath } from "@/i18n/routing";
import Image from "next/image";
import { connection } from "next/server";
import Link from "next/link";
import { CartDrawer } from "@/features/cart/cart-drawer";
import { getPublicSettings } from "@/lib/public-settings";
import { getDictionary, type Locale } from "@/i18n/dictionary";
import { LocaleSwitch } from "@/i18n/locale-switch";
import { whatsappHref, supportEmailHref } from "@/lib/contact-links";

export async function StoreShell({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const t = getDictionary(locale);
  // A configured DB is read only at request time, not while prerendering/building.
  // Login can render before DB provisioning; never invent a public contact number.
  if (process.env.DATABASE_URL) await connection();
  const settings = await getPublicSettings();
  const storeName = settings?.storeName ?? "Monechai";
  const whatsapp = whatsappHref(settings?.whatsappNumber);
  const email = supportEmailHref(settings?.supportEmail);
  return <>
    <a className="skip-link" href="#main">{t.skip}</a>
    <header className="site-header">
      <div className="container header-inner">
        <Link href={localePath(locale, "/")} className="brand" aria-label={`${storeName} · ${t.home}`}>
          {storeName === "Monechai" ? <Image src="/monechai-logo.svg" alt="" width={243} height={43} unoptimized loading="eager" /> : <span className="brand-name">{storeName}</span>}
        </Link>
        <form className="header-search" action={localePath(locale, "/shop")} role="search">
          <label className="sr-only" htmlFor="header-q">{t.searchProducts}</label>
          <input id="header-q" name="q" type="search" maxLength={100} placeholder={t.searchProducts} />
          <button type="submit">{t.search}</button>
        </form>
        <nav className="header-nav" aria-label={locale === "bn" ? "মূল নেভিগেশন" : "Main navigation"}>
          <Link href={localePath(locale, "/")}>{t.home}</Link><Link href={localePath(locale, "/shop")}>{t.shop}</Link><CartDrawer locale={locale} /><LocaleSwitch locale={locale} />
        </nav>
      </div>
    </header>
    <main id="main">{children}</main>
    <footer className="site-footer" id="contact">
      <div className="container footer-inner"><div>{storeName === "Monechai" ? <Image className="footer-logo" src="/monechai-logo-light.svg" alt={storeName} width={216} height={38} unoptimized /> : <span className="brand-name">{storeName}</span>}<p>{t.tagline}</p></div>
        <nav aria-label={locale === "bn" ? "ফুটার নেভিগেশন" : "Footer navigation"}><Link href={localePath(locale, "/")}>{t.home}</Link><Link href={localePath(locale, "/shop")}>{t.browseProducts}</Link>{whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>}{email && <a href={email}>{t.emailSupport}</a>}</nav>
        <nav aria-label={locale === "bn" ? "দোকানের নীতিমালা" : "Store policies"}>{(["shipping", "returns", "privacy", "terms"] as const).map(kind => <Link key={kind} href={localePath(locale, `/policies/${kind}`)}>{t[kind]}</Link>)}</nav>
        <p>{settings?.storeName ?? "Monechai"}{settings?.hotline ? ` · Hotline: ${settings.hotline}` : ""}{settings?.contactAddress ? ` · ${settings.contactAddress}` : ""}</p>
        <p>{settings?.codEnabled === false ? t.codOff : t.codConditional} {t.noOnlinePayment}</p>
      </div>
    </footer>
  </>;
}
