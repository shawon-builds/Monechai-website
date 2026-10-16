import { singleParam } from "@/lib/params";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/auth";
import { listOrders, orderStatus } from "@/features/admin/orders";
import { formatBdt } from "@/lib/money";
import { AdminIcon } from "@/components/admin/admin-icon";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; number?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = params.page && /^[1-9]\d{0,4}$/.test(params.page) ? Number(params.page) : 1;
  const status = orderStatus.safeParse(params.status).data;
  const number = singleParam(params.number).trim().toUpperCase();
  const search = number && /^MC-[A-F0-9]{16}$/.test(number) ? number : undefined;
  const { items, total } = await listOrders(getDb(), page, status, search);
  const href = (p: number) => `/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), ...(search ? { number: search } : {}), page: String(p) })}`;
  return <section aria-label="Admin" className="admin-catalog">
    <div className="admin-page-heading"><div><p className="admin-kicker">From checkout to delivery</p><h1>Orders</h1><p>Review new orders, manage delivery, and record COD collections.</p></div><Link href="/admin/analytics" className="button admin-button-secondary">View analytics <AdminIcon name="arrow" /></Link></div>
    <form method="get" className="shop-filters"><label>Order number<input id="order-number" name="number" defaultValue={search ?? ""} placeholder="MC-…" /></label>
      <label>Status<select id="order-status-filter" name="status" defaultValue={status ?? ""}>
        <option value="">All</option>{orderStatus.options.map((s) => <option value={s} key={s}>{s.replaceAll("_", " ")}</option>)}
      </select></label><button type="submit" className="button button-dark">Filter</button></form>
    <p>{total} orders. Customer information is for fulfillment only.</p>
    <ul className="admin-product-list">{items.map((o) => <li className="admin-card" key={o.id}>
      <Link href={`/admin/orders/${o.id}`}><strong>{o.orderNumber}</strong></Link> · <time dateTime={o.createdAt.toISOString()}>{o.createdAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time>
      <div>{o.customerName} · {o.phone} · {o.area}</div>
      <div>{formatBdt(o.totalMinor)} · {o.paymentMethod.toUpperCase()} / {o.paymentStatus} · {o.status.replaceAll("_", " ")}</div>
    </li>)}</ul>
    {!items.length && <div className="admin-surface admin-empty-catalog"><span className="admin-empty-icon"><AdminIcon name="orders" width="36" height="36" /></span><h2>{status || search || page > 1 ? "No matching orders" : "Ready for your first order"}</h2><p>{status || search || page > 1 ? "Try another order number, status, or page." : "Customer orders appear here after checkout. Open an order to confirm it, add courier details, update delivery, and record payment."}</p>{(status || search || page > 1) && <Link className="button admin-button-secondary" href="/admin/orders">Clear filters</Link>}</div>}
    <nav aria-label="Order pages" className="pagination">{page > 1 && <Link href={href(page - 1)}>Previous</Link>} <span>Page {page}</span> {page * 30 < total && <Link href={href(page + 1)}>Next</Link>}</nav>
  </section>;
}
