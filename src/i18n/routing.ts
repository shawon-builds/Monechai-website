import type { Locale } from "./dictionary";

export const locales = ["en", "bn"] as const;
export function isLocale(value: string): value is Locale { return value === "en" || value === "bn"; }
export function pathLocale(pathname: string): Locale | null {
  const first = pathname.split("/")[1];
  return isLocale(first) ? first : null;
}
export function localePath(locale: Locale, path = "/"): string {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Expected a local absolute path");
  const unprefixed = path.replace(/^\/(en|bn)(?=\/|\?|#|$)/, "");
  return `/${locale}${unprefixed === "/" ? "" : unprefixed}`;
}
export function languageAlternates(locale: Locale, path = "/") {
  return { canonical: localePath(locale, path), languages: {
    "en-BD": localePath("en", path), "bn-BD": localePath("bn", path), "x-default": localePath("en", path),
  } };
}
