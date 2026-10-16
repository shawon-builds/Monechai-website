import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

export async function createSupabaseServerClient() {
  const { url, key } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    global: { fetch: (input, init) => {
      const signals = [AbortSignal.timeout(15000)];
      if (init?.signal) signals.push(init.signal);
      if (input instanceof Request) signals.push(input.signal);
      return fetch(input, { ...init, cache: "no-store", signal: AbortSignal.any(signals) });
    } },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        // Server Components cannot set cookies; proxy refreshes before render.
        try {
          for (const { name, value, options } of items) cookieStore.set(name, value, options);
        } catch { /* Read-only Server Component context. */ }
      },
    },
  });
}
