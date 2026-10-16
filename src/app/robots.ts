import type { MetadataRoute } from "next";
import { indexableSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const origin = indexableSiteOrigin();
  if (!origin) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/checkout", "/order/", "/en/checkout", "/bn/checkout", "/en/order/", "/bn/order/"] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
