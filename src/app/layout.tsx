import type { Metadata } from "next";
import "./globals.css";
import { siteOrigin, storefrontRobots } from "@/lib/site-url";
import { getPublicSettings } from "@/lib/public-settings";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const storeName = (await getPublicSettings())?.storeName ?? "Monechai";
  const locale = await getLocale();
  const description = locale === "bn" ? `${storeName}-এর পণ্য দেখুন এবং চেকআউটে ক্যাশ অন ডেলিভারি যাচাই করুন।` : `Browse ${storeName} products and check Cash on Delivery availability at checkout.`;
  return {
  metadataBase: new URL(siteOrigin() ?? "http://localhost:3000"),
  title: { default: storeName, template: `%s | ${storeName}` },
  description,
  openGraph: { type: "website", siteName: storeName, title: storeName, description, locale: locale === "bn" ? "bn_BD" : "en_BD", alternateLocale: locale === "bn" ? "en_BD" : "bn_BD" },
  robots: storefrontRobots(),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
