import { connection } from "next/server";
import { CategoryGrid, Hero, HowToOrder, ProductSection } from "@/components/blocks/home";
import { getCatalogCategories, getCatalogProducts } from "@/features/catalog/server";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { languageAlternates } from "@/i18n/routing";
import { getPublicSettings } from "@/lib/public-settings";
import { getDictionary } from "@/i18n/dictionary";
import { storefrontSharing } from "@/lib/storefront-metadata";
import { publicSiteOrigin } from "@/lib/site-url";
import { safeJsonLd, storeStructuredData } from "@/features/catalog/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const storeName = (await getPublicSettings())?.storeName ?? "Monechai";
  const description = getDictionary(locale).heroText;
  return { description, alternates: languageAlternates(locale), ...storefrontSharing(locale, "/", storeName, description) };
}

export default async function Home() {
  await connection(); // Never bake the catalog into the production build.
  const locale = await getLocale();
  const t = getDictionary(locale);
  const origin = publicSiteOrigin();
  const storeName = (await getPublicSettings())?.storeName ?? "Monechai";
  const [categories, featured, latest] = await Promise.all([
    getCatalogCategories(), getCatalogProducts({ featured: true, pageSize: 4 }), getCatalogProducts({ pageSize: 8 }),
  ]);
  return <>
    {origin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(storeStructuredData(storeName, origin)) }} />}
    <Hero locale={locale} storeName={(await getPublicSettings())?.storeName ?? "Monechai"} />
    <HowToOrder locale={locale} storeName={(await getPublicSettings())?.storeName ?? "Monechai"} />
    <CategoryGrid categories={categories} locale={locale} />
    <ProductSection id="featured-title" title={t.featured} products={featured.items} locale={locale} />
    <ProductSection id="latest-title" title={t.exploreProducts} products={latest.items} locale={locale} />
    {!latest.total && <section className="section container empty-state"><h2>{t.comingSoon}</h2><p>{t.comingSoonText}</p></section>}
  </>;
}
