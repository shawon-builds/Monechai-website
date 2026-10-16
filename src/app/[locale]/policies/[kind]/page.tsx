import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getActivePolicies, policyKinds, type PolicyKind } from "@/features/admin/policies";
import { getLocale } from "@/i18n/server";
import { getDictionary, localizedText } from "@/i18n/dictionary";
import { languageAlternates, localePath } from "@/i18n/routing";
import { storefrontRobots } from "@/lib/site-url";
import { storefrontSharing } from "@/lib/storefront-metadata";

type Props = { params: Promise<{ kind: string }> };
function policyKind(value: string): PolicyKind { if (!policyKinds.includes(value as PolicyKind)) notFound(); return value as PolicyKind; }
export async function generateMetadata({ params }: Props) {
  const kind = policyKind((await params).kind), locale = await getLocale();
  const policies = await getActivePolicies(getDb());
  const title = getDictionary(locale)[kind];
  const descriptions = {
    en: { shipping: "Read the store's published shipping policy before placing an order.", returns: "Read the store's published returns and refunds policy before purchasing.", privacy: "Read how the store handles personal information in its published privacy policy.", terms: "Read the store's published terms before placing an order." },
    bn: { shipping: "অর্ডার দেওয়ার আগে দোকানের প্রকাশিত ডেলিভারি নীতি পড়ুন।", returns: "কেনাকাটার আগে দোকানের প্রকাশিত ফেরত ও রিফান্ড নীতি পড়ুন।", privacy: "দোকানের প্রকাশিত গোপনীয়তা নীতিতে ব্যক্তিগত তথ্য ব্যবহারের নিয়ম পড়ুন।", terms: "অর্ডার দেওয়ার আগে দোকানের প্রকাশিত শর্তাবলি পড়ুন।" },
  };
  const description = policies ? descriptions[locale][kind] : getDictionary(locale).policiesUnavailable;
  return { title, description, alternates: languageAlternates(locale, `/policies/${kind}`), robots: policies ? storefrontRobots() : { index: false, follow: false }, ...storefrontSharing(locale, `/policies/${kind}`, title, description) };
}
export default async function PolicyPage({ params }: Props) {
  const kind = policyKind((await params).kind), locale = await getLocale(), t = getDictionary(locale);
  const policies = await getActivePolicies(getDb());
  return <article className="container policy-page"><h1>{t[kind]}</h1>
    {policies ? <><p>{t.policyPublished}: {policies.createdAt.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-BD", { timeZone: "Asia/Dhaka" })}</p>
      {locale === "bn" && !policies[`${kind}Bn`] && <p>{t.policyEnglishFallback}</p>}
      <div className="policy-copy" lang={locale === "bn" && !policies[`${kind}Bn`] ? "en" : undefined}>{localizedText(locale, policies[`${kind}En`], policies[`${kind}Bn`])}</div></> : <p role="status">{t.policiesUnavailable}</p>}
    <Link href={localePath(locale, "/shop")}>{t.continueShopping}</Link>
  </article>;
}
