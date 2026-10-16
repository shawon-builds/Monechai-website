import type { MetadataRoute } from "next";
import { asc, eq, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import { indexableSiteOrigin } from "@/lib/site-url";
import { locales, localePath } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = indexableSiteOrigin();
  if (!origin) return [];
  const rows = await getDb().select({ slug: products.slug, updatedAt: products.updatedAt }).from(products)
    .where(and(eq(products.isPublished, true), eq(products.isDemo, false))).orderBy(asc(products.slug));
  return locales.flatMap(locale => [
    { url: `${origin}${localePath(locale)}`, changeFrequency: "weekly" as const, priority: 1, alternates: { languages: { "en-BD": `${origin}/en`, "bn-BD": `${origin}/bn` } } },
    { url: `${origin}${localePath(locale, "/shop")}`, changeFrequency: "daily" as const, priority: 0.8, alternates: { languages: { "en-BD": `${origin}/en/shop`, "bn-BD": `${origin}/bn/shop` } } },
    ...rows.map(row => ({ url: `${origin}${localePath(locale, `/products/${row.slug}`)}`, lastModified: row.updatedAt, changeFrequency: "weekly" as const, priority: 0.7, alternates: { languages: { "en-BD": `${origin}/en/products/${row.slug}`, "bn-BD": `${origin}/bn/products/${row.slug}` } } })),
  ]);
}
