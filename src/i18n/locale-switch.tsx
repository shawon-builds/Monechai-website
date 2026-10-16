"use client";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "./dictionary";
import { localePath, pathLocale } from "./routing";

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  return <label className="locale-switch"><span className="sr-only">Language / ভাষা</span>
    <select aria-label="Language / ভাষা" value={locale} onChange={(event) => {
      document.cookie = `monechai-locale=${event.target.value === "bn" ? "bn" : "en"}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      window.dispatchEvent(new Event("monechai:locale-change"));
      if (pathLocale(pathname)) router.push(localePath(event.target.value === "bn" ? "bn" : "en", pathname) + location.search + location.hash);
      else router.refresh();
    }}><option value="en">English</option><option value="bn">বাংলা</option></select>
  </label>;
}
