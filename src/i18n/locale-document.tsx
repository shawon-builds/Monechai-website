"use client";
import { useEffect } from "react";
import type { Locale } from "./dictionary";

// Root layouts persist during client navigation. Keep assistive language in sync
// with the locale segment without relying on a reload or stale preference cookie.
export function LocaleDocument({ locale }: { locale: Locale }) {
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return null;
}
