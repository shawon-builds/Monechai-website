import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/auth";
import { getOrderDetail, nextStatuses } from "@/features/admin/orders";
import { CodPaymentForm, OrderStatusForm, ReturnOperations, TrackingForm } from "@/features/admin/order-status-form";
import { formatBdt } from "@/lib/money";
import { eq } from "drizzle-orm";
import { orderNotifications } from "@/db/schema";
import { RetryNotification } from "@/features/admin/notification-form";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const detail = await getOrderDetail(getDb(), id);
  if (!detail) notFound();
  const { order: o, items, history, paymentHistory, inventoryHistory } = detail;
  const [alert] = await getDb().select().from(orderNotifications).where(eq(orderNotifications.orderId, id));
  return <section aria-label="Admin" className="admin-catalog">
    <nav aria-label="Admin"><Link href="/admin/orders">Orders</Link> / {o.orderNumber}</nav>
    <h1>Order {o.orderNumber}</h1>
    <p>Placed <time dateTime={o.createdAt.toISOString()}>{o.createdAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time> · Updated <time dateTime={o.updatedAt.toISOString()}>{o.updatedAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time></p>
    <p>Status: <strong>{o.status.replaceAll("_", " ")}</strong> · Payment: {o.paymentMethod.toUpperCase()} / {o.paymentStatus}</p>
    <OrderStatusForm id={id} next={nextStatuses(o.status)} />
    {o.status === "delivered" && o.paymentMethod === "cod" && o.paymentStatus === "pending" && <CodPaymentForm id={id} />}
    {o.status === "returned" && <ReturnOperations id={id} released={o.inventoryReleased} paid={o.paymentStatus === "paid"} />}
    <TrackingForm id={id} courierName={o.courierName} trackingReference={o.trackingReference} />
    <h2>Owner notification</h2><p>{alert ? `${alert.status} · Attempts: ${alert.attempts}` : "Legacy order — no queued alert"}</p>
    {alert?.status === "failed" && <RetryNotification orderId={id} />}
    <h2>Customer and delivery</h2>
    <p>{o.customerName} · <a href={`tel:${o.phone}`}>{o.phone}</a></p>
    <p>{o.address} · {o.area} · {o.deliveryAreaName ?? o.shippingZoneName}</p>
    {o.note && <p>Customer note: {o.note}</p>}
    <h2>Purchased items (immutable snapshots)</h2>
    <ul className="admin-product-list">{items.map((item) => <li className="admin-card" key={item.id}>
      <strong>{item.productName}</strong> ({item.productSku}) · {item.variantLabel} ({item.variantSku})
      {Object.keys(item.attributes).length > 0 && <div>{Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}</div>}
      <div>{item.quantity} × {formatBdt(item.unitPriceMinor)} = {formatBdt(item.lineTotalMinor)}</div>
    </li>)}</ul>
    <h2>Totals</h2><p>Subtotal: {formatBdt(o.subtotalMinor)} · Shipping: {formatBdt(o.shippingMinor)} · Discount: {formatBdt(o.discountMinor)}</p>
    <p><strong>Total: {formatBdt(o.totalMinor)}</strong></p>
    <h2>Status history</h2>
    <ol>{history.map((h) => <li key={h.id}><time dateTime={h.createdAt.toISOString()}>{h.createdAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time>: {h.fromStatus ? `${h.fromStatus.replaceAll("_", " ")} → ` : ""}{h.toStatus.replaceAll("_", " ")}{h.actorUserId ? ` (admin ${h.actorUserId})` : " (checkout or migration)"}</li>)}</ol>
    <h2>Inventory history</h2><ol>{inventoryHistory.map((h) => <li key={h.id}>{h.reason}: +{h.quantity} (admin {h.actorUserId})</li>)}</ol>
    <p>Policy consent: {o.policyVersionId ? `${o.policyVersionId} · ${o.policyAcceptedAt?.toISOString()}` : "Legacy order — no recorded policy consent"}</p>
    <h2>Payment history</h2><ol>{paymentHistory.map((h) => <li key={h.id}><time dateTime={h.createdAt.toISOString()}>{h.createdAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time>: {h.fromStatus} → {h.toStatus} (admin {h.actorUserId})</li>)}</ol>
  </section>;
}
