import { createHash, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

export function checkoutRateKey(request: Request): string | null {
  if (process.env.CHECKOUT_TRUST_PROXY_IP_HEADER === "true") {
    const value = request.headers.get("x-real-ip")?.trim();
    // Only a verified ingress may overwrite this single header. Never interpret
    // forwarded chains or silently downgrade a broken ingress to visitor cookies.
    if (!value || value.includes("%") || !isIP(value)) return null;
    if (isIP(value) === 4) return `ip:${value}`;
    const canonical = new URL(`http://[${value}]/`).hostname.slice(1, -1);
    const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(canonical);
    if (mapped) {
      const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
      return `ip:${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
    }
    return `ip:${canonical}`;
  }
  // Convenience isolation only: clients can rotate this cookie. Not launch protection.
  const visitor = request.headers.get("x-monechai-visitor");
  return `visitor:${visitor && /^[0-9a-f-]{36}$/i.test(visitor) ? visitor : randomUUID()}`;
}

export async function allowRequest(scope: string, key: string | null, max: number, windowMs: number, db = getDb(), now = Date.now()) {
  if (key === null) return false;
  if (!scope || scope.length > 100 || !key || key.length > 200 || !Number.isSafeInteger(max) || max < 1 || max > 2147483647 || !Number.isSafeInteger(windowMs) || windowMs < 1 || windowMs > 86400000 || !Number.isSafeInteger(now) || now < 0 || now > 8640000000000000 - windowMs) throw new Error("Invalid request limit configuration");
  const digest = createHash("sha256").update(`${scope}:${key}`).digest("hex");
  const timestamp = new Date(now).toISOString();
  const expiry = new Date(now + windowMs).toISOString();
  // Conditional UPSERT is atomic across Node workers; no per-process/shared fallback bucket.
  const rows = await db.execute(sql`
    insert into request_limits (key,count,expires_at) values (${digest},1,${expiry})
    on conflict (key) do update set
      count = case when request_limits.expires_at <= ${timestamp} then 1 else request_limits.count + 1 end,
      expires_at = case when request_limits.expires_at <= ${timestamp} then ${expiry} else request_limits.expires_at end
    where request_limits.expires_at <= ${timestamp} or request_limits.count < ${max}
    returning count
  `);
  // Indexed, bounded expiry cleanup avoids growing permanent browser/IP history.
  await db.execute(sql`delete from request_limits where key in (select key from request_limits where expires_at <= ${timestamp} limit 100)`);
  return rows.length > 0;
}

export class BodyTimeoutError extends Error {}

export async function readLimitedBody(request: Request, maxBytes: number, timeoutMs = 5000): Promise<string | null> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) return null;
  if (request.headers.get("content-encoding") && request.headers.get("content-encoding") !== "identity") return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reject(new BodyTimeoutError("Request body timed out")); void reader.cancel().catch(() => {}); }, timeoutMs);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { void reader.cancel().catch(() => {}); return null; }
      chunks.push(value);
    }
    const all = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
    try { return new TextDecoder("utf-8", { fatal: true }).decode(all); }
    catch { return null; }
  } finally { clearTimeout(timer); reader.releaseLock(); }
}
