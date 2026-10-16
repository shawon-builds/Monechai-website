// Classification only; Supabase verifies authenticity. Safe in Node and browsers.
export function isPublicSupabaseKey(key) {
  if (typeof key !== "string") return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  const parts = key.split(".");
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const decode = part => JSON.parse(atob(part.replaceAll("-", "+").replaceAll("_", "/")));
    const header = decode(parts[0]), payload = decode(parts[1]);
    return header.alg === "HS256" && payload.role === "anon";
  } catch { return false; }
}

export function assertPublicSupabaseKey(key) {
  if (!isPublicSupabaseKey(key)) throw new Error("Expected a Supabase publishable or legacy anon key. Privileged keys must never use NEXT_PUBLIC configuration.");
}

export function validatePublicSupabaseKeys(env) {
  for (const [name, key] of Object.entries(env)) {
    if (/^NEXT_PUBLIC_SUPABASE_.*KEY$/.test(name) && key !== undefined && key !== "") assertPublicSupabaseKey(key);
  }
}
