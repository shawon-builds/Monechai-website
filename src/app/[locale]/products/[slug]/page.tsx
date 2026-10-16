import { languageAlternates, localePath } from "@/i18n/routing";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Price, ProductImage } from "@/components/commerce/product";
import { productDetailSizes, productThumbnailSizes } from "@/components/commerce/product-image-sizes";
import { getCatalogProduct } from "@/features/catalog/server";
import { ProductOptions } from "@/features/cart/product-options";
import type { Metadata } from "next";
import { productImageUrl } from "@/features/catalog/images";
import { breadcrumbStructuredData, productStructuredData, safeJsonLd } from "@/features/catalog/structured-data";
import { publicSiteOrigin, storefrontRobots } from "@/lib/site-url";
import { getPublicSettings } from "@/lib/public-settings";
import { getLocale } from "@/i18n/server";
import { getDictionary, localizedText } from "@/i18n/dictionary";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) return { title: getDictionary(locale).currentlyUnavailable, robots: { index: false, follow: false } };
  const path = `/products/${product.slug}`;
  const image = productImageUrl(product.images[0]?.storageKey);
  const name = localizedText(locale, product.nameEn, product.nameBn);
  const storeName = (await getPublicSettings())?.storeName ?? "Monechai";
  const description = (localizedText(locale, product.descriptionEn || "", product.descriptionBn) || (locale === "bn" ? `${storeName}-এ ${name} দেখুন।` : `View ${name} at ${storeName}.`)).slice(0, 160);
  return {
    title: name, description, robots: storefrontRobots(), alternates: languageAlternates(locale, path),
    openGraph: { type: "website", title: name, description, url: localePath(locale, path), images: image ? [{ url: image, alt: localizedText(locale, product.images[0]?.altEn || name, product.images[0]?.altBn) }] : undefined },
    twitter: { card: "summary_large_image", title: name, description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();
  const available = product.variants.some((variant) => variant.available);
  const name = localizedText(locale, product.nameEn, product.nameBn);
  const categoryName = localizedText(locale, product.categoryNameEn, product.categoryNameBn);
  const origin = publicSiteOrigin();
  return <div className="container detail-page">
    {origin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productStructuredData(product, origin, locale)) }} />}
    {origin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbStructuredData([
      { name: t.home, path: localePath(locale) }, { name: t.shop, path: localePath(locale, "/shop") },
      { name: categoryName, path: localePath(locale, `/shop?category=${encodeURIComponent(product.categorySlug)}`) },
    ], origin)) }} />}
    <nav className="breadcrumbs" aria-label={locale === "bn" ? "নেভিগেশন পথ" : "Breadcrumb"}><Link href={localePath(locale, "/")}>{t.home}</Link> / <Link href={localePath(locale, "/shop")}>{t.shop}</Link> / <Link href={localePath(locale, `/shop?category=${encodeURIComponent(product.categorySlug)}`)}>{categoryName}</Link></nav>
    <div className="detail-grid">
      <div className="detail-gallery" aria-label={locale === "bn" ? `${name} ছবি` : `${name} images`}>
        <ProductImage storageKey={product.images[0]?.storageKey || null} alt={localizedText(locale, product.images[0]?.altEn || name, product.images[0]?.altBn)} sizes={productDetailSizes} priority locale={locale} />
        {product.images.length > 1 && <div className="gallery-thumbs">{product.images.slice(1).map((image, index) => <ProductImage key={`${image.storageKey}-${index}`} storageKey={image.storageKey} alt={localizedText(locale, image.altEn || name, image.altBn)} sizes={productThumbnailSizes} locale={locale} />)}</div>}
      </div>
      <div className="detail-info"><p className="eyebrow">{categoryName}</p><h1>{name}</h1>
        <Price price={product.priceMinor} maxPrice={product.maxPriceMinor} compareAt={product.compareAtMinor} locale={locale} />
        <p className={available ? "availability available" : "availability"}>{available ? t.available : t.currentlyUnavailable}</p>
        {(product.descriptionEn || product.descriptionBn) && <div className="description"><h2>{t.about}</h2><p lang={locale === "bn" && !product.descriptionBn ? "en" : undefined}>{localizedText(locale, product.descriptionEn || "", product.descriptionBn)}</p></div>}
        {product.variants.length > 1 && <div className="variant-list"><h2>{t.options}</h2><ul>{product.variants.map((variant) => <li key={variant.id}>{localizedText(locale, variant.label, variant.labelBn)} — {variant.available ? t.available : t.unavailable}{variant.priceMinor != null && <Price price={variant.priceMinor} locale={locale} />}</li>)}</ul></div>}
        <ProductOptions variants={product.variants} basePrice={product.basePriceMinor} locale={locale} />
        <p className="order-notice">{t.deliveryNotice}</p>
        <Link className="button button-dark" href={localePath(locale, "/shop")}>{t.continueBrowsing}</Link>
      </div>
    </div>
  </div>;
}
