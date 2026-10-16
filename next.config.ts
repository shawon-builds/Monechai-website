import type { NextConfig } from "next";
import { validatePublicSupabaseKeys } from "./src/lib/supabase/public-key.mjs";

// Runs after Next loads .env, before any public value is bundled (also direct next build).
validatePublicSupabaseKeys(process.env);

const nextConfig: NextConfig = {
  // A portable Node artifact for the VPS/Docker deployment goal.
  output: "standalone",
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL ? [{
      protocol: "https",
      hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
      pathname: "/storage/v1/object/public/products/**",
      search: "",
    }] : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
      ...(process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
    ] }, ...["/order/:path*", "/:locale(en|bn)/order/:path*", "/api/checkout/:path*", "/admin/:path*", "/:locale(en|bn)/checkout"].map(source => ({ source, headers: [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ] }))];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/shop.html", destination: "/shop", permanent: true },
      { source: "/checkout.html", destination: "/checkout", permanent: true },
      { source: "/order-success.html", destination: "/checkout", permanent: true },
    ];
  },
};

export default nextConfig;
