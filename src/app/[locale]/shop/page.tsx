import { languageAlternates, localePath } from "@/i18n/routing";
import Link from "next/link";
import { cache } from "react";
import { ProductGrid } from "@/components/commerce/product";
import { getCatalogCategories, getCatalogProducts } from "@/features/catalog/server";
import { parseShopParams, shopHref, shopSeo, type ShopParams, type ShopState } from "@/features/catalog/shop-params";
import { getLocale } from "@/i18n/server";
import { getDictionary, localizedText } from "@/i18n/dictionary";
import { publicSiteOrigin, storefrontRobots } from "@/lib/site-url";
import { storefrontSharing } from "@/lib/storefront-metadata";
import { breadcrumbStructuredData, safeJsonLd } from "@/features/catalog/structured-data";

const listing = cache((q: string, category: string, sort: ShopState["sort"], page: number) =>
  getCatalogProducts({ search: q || undefined, category: category || undefined, sort, page }));

export async function generateMetadata({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const raw = await searchParams, state = parseShopParams(raw);
  const result = await listing(state.q, state.category, state.sort, state.page);
  const seo = shopSeo(raw, result.total, result.pageSize);
  return { title: t.shop, description: t.shopIntro, robots: storefrontRobots(seo.index), alternates: languageAlternates(locale, seo.path), ...storefrontSharing(locale, seo.path, t.shop, t.shopIntro) };
}

export default async function Shop({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const state = parseShopParams(await searchParams);
  const [categories, result] = await Promise.all([
    getCatalogCategories(), listing(state.q, state.category, state.sort, state.page),
  ]);
  const pages = Math.ceil(result.total / result.pageSize);
  const origin = publicSiteOrigin();
  const seo = shopSeo(await searchParams, result.total, result.pageSize);
  return <div className="container shop-page">
    {origin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbStructuredData([
      { name: t.home, path: localePath(locale) }, { name: t.shop, path: localePath(locale, seo.path) },
    ], origin)) }} />}
    <nav className="breadcrumbs" aria-label={locale === "bn" ? "নেভিগেশন পথ" : "Breadcrumb"}><Link href={localePath(locale, "/")}>{t.home}</Link><span aria-hidden="true"> / </span>{t.shop}</nav>
    <h1>{t.shopTitle}</h1>
    <p>{t.shopIntro}</p>
    <form className="shop-filters" action={localePath(locale, "/shop")} method="get" role="search">
      <div><label htmlFor="shop-q">{t.searchProducts}</label><input id="shop-q" type="search" name="q" defaultValue={state.q} maxLength={100} placeholder={t.searchProducts} /></div>
      <div><label htmlFor="shop-category">{t.category}</label><select id="shop-category" name="category" defaultValue={state.category}>
        <option value="">{t.allCategories}</option>{categories.map((category) => <option key={category.id} value={category.slug}>{localizedText(locale, category.nameEn, category.nameBn)}</option>)}
        {state.category && !categories.some((c) => c.slug === state.category) && <option value={state.category}>{t.unknownCategory}</option>}
      </select></div>
      <div><label htmlFor="shop-sort">{t.sort}</label><select id="shop-sort" name="sort" defaultValue={state.sort}>
        <option value="newest">{t.newest}</option><option value="price-asc">{t.lowHigh}</option><option value="price-desc">{t.highLow}</option>
      </select></div>
      <button className="button button-gold" type="submit">{t.filters}</button>
    </form>
    <div className="shop-count" role="status">{new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD").format(result.total)} {t.found}</div>
    {result.items.length ? <ProductGrid products={result.items} locale={locale} /> : <div className="empty-state"><h2>{result.total ? t.noPage : t.noResults}</h2><p>{state.q || state.category ? t.tryAnother : t.publishedHere}</p><Link className="button button-dark" href={localePath(locale, "/shop")}>{t.browseAll}</Link></div>}
    {pages > 1 && <nav className="pagination" aria-label={locale === "bn" ? "পণ্যের পৃষ্ঠা" : "Product pages"}>
      {state.page > 1 && <Link href={localePath(locale, shopHref(state, state.page - 1))} rel="prev">← {t.previous}</Link>}
      <span>{t.page} {state.page} {t.of} {pages}</span>
      {state.page < pages && <Link href={localePath(locale, shopHref(state, state.page + 1))} rel="next">{t.next} →</Link>}
    </nav>}
  </div>;
}
