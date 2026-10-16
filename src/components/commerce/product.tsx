import { localePath } from "@/i18n/routing";
import Image from "next/image";
import Link from "next/link";
import { productImageUrl } from "@/features/catalog/images";
import { formatBdt } from "@/lib/money";
import { getDictionary, localizedText, type Locale } from "@/i18n/dictionary";
import { productCardSizes } from "./product-image-sizes";

type ProductItem = {
  id: string; slug: string; nameEn: string; nameBn?: string | null; priceMinor: number; compareAtMinor: number | null;
  maxPriceMinor?: number; primaryStorageKey: string | null; primaryAlt: string | null; primaryAltBn?: string | null; available: boolean;
};

export function ProductImage({ storageKey, alt, sizes = productCardSizes, priority = false, locale = "en" }: { storageKey: string | null; alt: string; sizes?: string; priority?: boolean; locale?: Locale }) {
  const t = getDictionary(locale);
  const src = productImageUrl(storageKey);
  return <div className="product-image">{src
    ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
    : <div className="image-placeholder" role="img" aria-label={`${t.imageUnavailable} ${alt}`}><Image src="/monechai-mark.svg" alt="" width={90} height={90} unoptimized /> <span>{t.imageSoon}</span></div>}
  </div>;
}

export function Price({ price, compareAt, maxPrice, locale = "en" }: { price: number; compareAt?: number | null; maxPrice?: number; locale?: Locale }) {
  const currencyLocale = locale === "bn" ? "bn-BD" : "en-BD";
  return <div className="price">{maxPrice !== undefined && maxPrice > price && <span>{getDictionary(locale).fromPrice}</span>}<strong>{formatBdt(price, currencyLocale)}</strong>{compareAt != null && compareAt > price && <del aria-label={`${getDictionary(locale).previously} ${formatBdt(compareAt, currencyLocale)}`}>{formatBdt(compareAt, currencyLocale)}</del>}</div>;
}

export function ProductCard({ product, locale = "en" }: { product: ProductItem; locale?: Locale }) {
  const t = getDictionary(locale);
  const name = localizedText(locale, product.nameEn, product.nameBn);
  return <article className="product-card">
    <Link href={localePath(locale, `/products/${product.slug}`)} className="card-link" aria-label={`${t.details}: ${name}`}>
      <ProductImage storageKey={product.primaryStorageKey} alt={localizedText(locale, product.primaryAlt || name, product.primaryAltBn)} locale={locale} />
      <div className="card-body">
        {!product.available && <span className="stock-badge">{t.unavailable}</span>}
        <h3>{name}</h3>
        <Price price={product.priceMinor} maxPrice={product.maxPriceMinor} compareAt={product.compareAtMinor} locale={locale} />
        <span className="card-action">{t.details} <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  </article>;
}

export function ProductGrid({ products, locale = "en" }: { products: ProductItem[]; locale?: Locale }) {
  return <div className="product-grid">{products.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}</div>;
}
