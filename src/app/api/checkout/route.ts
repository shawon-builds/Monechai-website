import { ZodError } from "zod";
import { CheckoutError, placeCodOrder } from "@/features/checkout/orders";
import { previewCart } from "@/features/checkout/preview";
import { allowRequest, BodyTimeoutError, checkoutRateKey, readLimitedBody } from "@/features/checkout/abuse";
import { getLocale } from "@/i18n/server";

export const runtime = "nodejs";

export async function handle(request: Request, submit: boolean) {
  // Basic cross-origin guard. Broader abuse prevention is owned by goal 08.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.slice(0, -1);
  // Next may normalize request.url to localhost in standalone mode; compare the
  // browser's Origin to the actual Host (and trusted proxy protocol) instead.
  if (!origin || !host || origin !== `${protocol}://${host}`) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return Response.json({ error: "JSON required" }, { status: 415 });
  try {
    const key = checkoutRateKey(request);
    if (key === null) return Response.json({ error: "Checkout is temporarily unavailable. Please retry.", code: "UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    if (!await allowRequest(submit ? "checkout" : "preview", key, submit ? 60 : 180, 600_000)) return Response.json({ error: "Too many requests. Please try later.", code: "RATE_LIMITED" }, { status: 429, headers: { "Retry-After": "600", "Cache-Control": "no-store" } });
    const body = await readLimitedBody(request, 8192);
    if (body === null) return Response.json({ error: "Request too large or unsupported encoding" }, { status: 413 });
    const data: unknown = JSON.parse(body);
    if (submit) return Response.json(await placeCodOrder(data), { status: 201, headers: { "Cache-Control": "no-store" } });
    const input = data as { items?: unknown; deliveryAreaCode?: unknown };
    if (input?.deliveryAreaCode !== undefined && (typeof input.deliveryAreaCode !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.deliveryAreaCode) || input.deliveryAreaCode.length > 100)) return Response.json({ error: "Invalid delivery area" }, { status: 400 });
    return Response.json(await previewCart(input.items, input.deliveryAreaCode as string | undefined, undefined, await getLocale()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BodyTimeoutError) return Response.json({ error: "Request timed out", code: "TIMEOUT" }, { status: 408, headers: { "Cache-Control": "no-store" } });
    if (error instanceof ZodError || error instanceof SyntaxError) return Response.json({ error: "Invalid checkout details. Review your cart and address." }, { status: 400 });
    if (error instanceof CheckoutError) return Response.json({ error: error.message, code: error.code }, { status: (error.code === "SHIPPING_NOT_CONFIGURED" || error.code === "POLICIES_NOT_CONFIGURED") ? 503 : 409 });
    // Do not serialize database or customer data into an error response.
    return Response.json({ error: "Checkout is temporarily unavailable. Please retry." }, { status: 503 });
  }
}

export async function POST(request: Request) { return handle(request, true); }
