import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { recoverCheckout } from "@/features/checkout/session";
import { allowRequest, checkoutRateKey } from "@/features/checkout/abuse";

export const runtime = "nodejs";
const name = "monechai-checkout";
const headers = { "Cache-Control": "private, no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  try {
    if (!await allowRequest("checkout-recovery", checkoutRateKey(request), 180, 600000)) return Response.json({ error: "Too many requests" }, { status: 429, headers });
    const jar = await cookies();
    const stored = jar.get(name)?.value;
    const key = stored && uuid.test(stored) ? stored : randomUUID();
    const order = stored && uuid.test(stored) ? await recoverCheckout(key) : null;
    // Never clear on this response: a dropped response must remain recoverable.
    jar.set(name, key, { httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https", path: "/", maxAge: 86400 });
    return Response.json({ idempotencyKey: key, order }, { headers });
  } catch { return Response.json({ error: "Checkout recovery temporarily unavailable" }, { status: 503, headers }); }
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.slice(0, -1);
  if (!origin || origin !== `${protocol}://${request.headers.get("host")}`) return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  (await cookies()).delete(name);
  return new Response(null, { status: 204, headers });
}
