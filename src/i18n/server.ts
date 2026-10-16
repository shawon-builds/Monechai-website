import "server-only";
import { cookies, headers } from "next/headers";
import type { Locale } from "./dictionary";
import { isLocale } from "./routing";

export async function getLocale(): Promise<Locale> {
  // Proxy overwrites this header; a URL locale wins over browser preference.
  const locale = (await headers()).get("x-monechai-locale");
  if (locale && isLocale(locale)) return locale;
  return (await cookies()).get("monechai-locale")?.value === "bn" ? "bn" : "en";
}
