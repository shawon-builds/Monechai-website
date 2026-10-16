import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { localePath, pathLocale } from "@/i18n/routing";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const explicitLocale = pathLocale(pathname);
  const locale = explicitLocale ?? (request.cookies.get("monechai-locale")?.value === "bn" ? "bn" : "en");
  if (/^\/(?:$|shop(?:\/|$)|products(?:\/|$)|checkout(?:\/|$)|order(?:\/|$)|policies(?:\/|$))/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = localePath(locale, pathname);
    const response = NextResponse.redirect(url, 307);
    response.headers.set("Cache-Control", "private, no-store");
    if (pathname.startsWith("/order/")) response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  const stored = request.cookies.get("monechai-visitor")?.value;
  const visitor = stored && /^[0-9a-f-]{36}$/i.test(stored) ? stored : randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-monechai-visitor", visitor);
  headers.set("x-monechai-locale", locale);
  request.cookies.set("monechai-visitor", visitor);
  const next = () => {
    headers.set("cookie", request.headers.get("cookie") ?? "");
    const result = NextResponse.next({ request: { headers } });
    if (visitor !== stored) result.cookies.set("monechai-visitor", visitor, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: 86400, path: "/" });
    // Background prefetches for the other language must not overwrite preference.
    // The switch sets its cookie explicitly; only a real document visit updates it here.
    if (explicitLocale && request.headers.get("sec-fetch-dest") === "document" && request.method === "GET" && explicitLocale !== request.cookies.get("monechai-locale")?.value) result.cookies.set("monechai-locale", explicitLocale, { sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: 31536000, path: "/" });
    return result;
  };
  if (!request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/api/admin")) return next();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return next();
  const { url, key } = getSupabaseConfig();
  let response = next();
  const supabase = createServerClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.any([AbortSignal.timeout(15000), ...(init?.signal ? [init.signal] : [])]) }) },
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items, headers) => {
        for (const { name, value } of items) request.cookies.set(name, value);
        response = next();
        for (const { name, value, options } of items) response.cookies.set(name, value, options);
        for (const header of ["cache-control", "expires", "pragma"]) {
          const value = headers?.[header];
          if (value) response.headers.set(header, value);
        }
      },
    },
  });
  // Refresh only; authorization belongs at each protected data access.
  try { await supabase.auth.getClaims(); } catch { /* Refresh failure grants no access; each privileged operation verifies the user. */ }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|icon.svg|monechai-.*\\.svg|api/health).*)"] };
