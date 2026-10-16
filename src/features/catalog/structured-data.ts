import { localePath } from "@/i18n/routing";
import { localizedText, type Locale } from "@/i18n/dictionary";
import { productImageUrl } from "./images";

type ProductData = {
  slug: string; nameEn: string; nameBn?: string | null; descriptionEn: string | null; descriptionBn?: string | null; sku?: string;
  priceMinor: number; variants: { available: boolean }[];
  images: { storageKey: string | null }[];
};

export function productStructuredData(product: ProductData, origin: string, locale: Locale = "en") {
  const image = productImageUrl(product.images[0]?.storageKey);
  return {
    "@context": "https://schema.org", "@type": "Product", name: localizedText(locale, product.nameEn, product.nameBn),
    description: localizedText(locale, product.descriptionEn || "", product.descriptionBn) || undefined,
    image: image ? [image] : undefined,
    sku: product.sku || undefined,
    offers: {
      "@type": "Offer", url: `${origin}${localePath(locale, `/products/${product.slug}`)}`,
      priceCurrency: "BDT", price: (product.priceMinor / 100).toFixed(2),
      availability: product.variants.some((variant) => variant.available) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

/** JSON in a script element must not let catalog text close the element. */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

/** Only store name, canonical origin and approved logo are accepted entity data. */
export function storeStructuredData(name: string, origin: string) {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": `${origin}/#organization`, name, url: origin, logo: `${origin}/social-logo.png` },
    { "@type": "WebSite", "@id": `${origin}/#website`, name, url: origin,
      inLanguage: ["en-BD", "bn-BD"], publisher: { "@id": `${origin}/#organization` } },
  ] };
}

export function breadcrumbStructuredData(items: { name: string; path: string }[], origin: string) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `${origin}${item.path}` })) };
}
