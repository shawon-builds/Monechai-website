import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/db/client";
import { dispatchOrderAlert } from "@/features/admin/notifications";
import { ownerOrderMailer } from "@/features/admin/order-mail";
export const runtime = "nodejs";
const responseHeaders = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  const secret = process.env.ORDER_WORKER_SECRET;
  if (!secret || secret.length < 32) return Response.json({ error: "Worker not configured" }, { status: 503, headers: responseHeaders });
  const supplied = request.headers.get("authorization") ?? "", expected = `Bearer ${secret}`;
  if (Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return Response.json({ error: "Unauthorized" }, { status: 401, headers: responseHeaders });
  try {
    const result = await dispatchOrderAlert(getDb(), ownerOrderMailer());
    return Response.json({ status: result }, { status: result === "retry" || result === "lease_lost" ? 503 : 200, headers: responseHeaders });
  } catch { return Response.json({ error: "Worker unavailable" }, { status: 503, headers: responseHeaders }); }
}
