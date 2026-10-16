import type { Metadata } from "next";
import type { Locale } from "@/i18n/dictionary";
import { localePath } from "@/i18n/routing";
import { siteOrigin } from "./site-url";

/** Existing approved logo, rasterized for sharing services that do not support SVG. */
export function storefrontSharing(locale: Locale, path: string, title: string, description: string): Pick<Metadata, "openGraph" | "twitter"> {
  const origin = siteOrigin();
  const images = origin ? [{ url: `${origin}/social-logo.png`, width: 1200, height: 630, alt: "Monechai" }] : undefined;
  return {
    openGraph: { type: "website", title, description, url: origin ? `${origin}${localePath(locale, path)}` : undefined,
      locale: locale === "bn" ? "bn_BD" : "en_BD", alternateLocale: locale === "bn" ? "en_BD" : "bn_BD", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
