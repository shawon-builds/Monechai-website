/** Only a verified absolute origin can be used in canonical URLs and structured data. */
export function siteOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return null;
    return url.origin;
  } catch { return null; }
}

export function publicSiteOrigin(): string | null {
  const origin = siteOrigin();
  return origin?.startsWith("https://") ? origin : null;
}

/** Owner approval is origin-specific and server-only; HTTPS alone never enables indexing. */
export function indexableSiteOrigin(): string | null {
  const origin = publicSiteOrigin();
  if (!origin || process.env.NODE_ENV !== "production" ||
    (process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== "production") ||
    process.env.SITE_INDEXING_APPROVED_ORIGIN !== origin) return null;
  const url = new URL(origin);
  if (url.port || !url.hostname.includes(".") ||
    /(^localhost$|\.localhost$|\.local$|\.internal$|\.test$|^[\d.]+$|:)/.test(url.hostname)) return null;
  return origin;
}

export function storefrontRobots(eligible = true) {
  return { index: eligible && indexableSiteOrigin() !== null, follow: indexableSiteOrigin() !== null };
}
