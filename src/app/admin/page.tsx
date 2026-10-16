import Link from "next/link";
import { and, desc, eq, lte, sql } from "drizzle-orm";
import { AdminIcon } from "@/components/admin/admin-icon";
import { requireAdmin } from "@/features/admin/auth";
import { getDb } from "@/db/client";
import { categories, orders, products, productVariants } from "@/db/schema";
import { alertQueueSummary } from "@/features/admin/notifications";
import { getSettings } from "@/features/admin/settings";
import { getActivePolicies } from "@/features/admin/policies";
import { formatBdt } from "@/lib/money";

export default async function AdminPage() {
  await requireAdmin();
  const db = getDb();
  const [[catalog], [orderCounts], [categoryCount], [stock], recent, alerts, configuration, policies] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int`, published: sql<number>`count(*) filter (where ${products.isPublished} and not ${products.isDemo})::int`, drafts: sql<number>`count(*) filter (where not ${products.isPublished} and not ${products.isDemo})::int` }).from(products),
    db.select({ pending: sql<number>`count(*) filter (where ${orders.status} = 'pending_confirmation')::int` }).from(orders),
    db.select({ total: sql<number>`count(*)::int` }).from(categories),
    db.select({ total: sql<number>`count(*)::int` }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(and(eq(productVariants.isActive, true), eq(productVariants.trackInventory, true), lte(productVariants.stockQuantity, 5), eq(products.isDemo, false))),
    db.select({ id: orders.id, number: orders.orderNumber, status: orders.status, total: orders.totalMinor, createdAt: orders.createdAt }).from(orders).orderBy(desc(orders.createdAt), desc(orders.id)).limit(5),
    alertQueueSummary(db), getSettings(db), getActivePolicies(db),
  ]);
  const setup = [
    { title: "Create a category", detail: "Organize what you sell before adding products.", href: "/admin/categories", complete: categoryCount.total > 0 },
    { title: "Add your first product & photos", detail: "Save a draft, upload your photos, then publish.", href: "/admin/products/new", complete: catalog.published > 0 },
    { title: "Set delivery fees & coverage", detail: "Enter your courier's rates and delivery areas.", href: "/admin/settings#delivery", complete: configuration.zones.length >= 2 && configuration.areas.some(area => area.isActive) },
    { title: "Add contact details & store policies", detail: "Give customers a way to reach you and clear terms.", href: "/admin/settings", complete: Boolean(policies && (configuration.settings?.supportEmail || configuration.settings?.hotline || configuration.settings?.whatsappNumber)) },
  ];
  const completed = setup.filter(item => item.complete).length;
  const metrics = [
    { label: "Orders to review", value: orderCounts.pending, detail: "Waiting for your confirmation", href: "/admin/orders?status=pending_confirmation" },
    { label: "Published products", value: catalog.published, detail: "Visible on your storefront", href: "/admin/products?status=published" },
    { label: "Draft products", value: catalog.drafts, detail: "Saved, waiting to be published", href: "/admin/products?status=draft" },
    { label: "Low-stock variants", value: stock.total, detail: "5 units or fewer, including drafts", href: "/admin/inventory?stock=low" },
  ];
  return <section aria-label="Admin dashboard" className="admin-overview">
    <div className="admin-page-heading"><div><p className="admin-kicker">Store overview</p><h1>Your store, at a glance.</h1><p>Products, orders, and the next thing to take care of.</p></div><Link href="/admin/products/new" className="button button-dark"><AdminIcon name="plus" />Add product</Link></div>
    <div className="admin-metrics">{metrics.map(metric => <Link href={metric.href} className="admin-metric" key={metric.label}><span>{metric.label}<AdminIcon name="arrow" /></span><strong>{metric.value}</strong><small>{metric.detail}</small></Link>)}</div>
    <div className="admin-overview-grid">
      <section className="admin-surface admin-start"><div className="admin-surface-heading"><div><p className="admin-kicker">Your next steps</p><h2>{completed === setup.length ? "Store essentials" : "Let’s get your store ready."}</h2></div><span className="admin-count">{completed} / {setup.length}</span></div><p className="admin-muted">These essentials help you prepare for your first order.</p>
        <ol className="admin-setup-list">{setup.map((item, index) => <li key={item.title}><span className={`admin-step-number${item.complete ? " is-complete" : ""}`}>{item.complete ? <><AdminIcon name="check" /><span className="sr-only">Complete</span></> : String(index + 1).padStart(2, "0")}</span><div><Link href={item.href}>{item.title}</Link><p>{item.detail}</p></div><Link href={item.href} className="admin-step-link" aria-label={`Open: ${item.title}`}><AdminIcon name="arrow" /></Link></li>)}</ol>
      </section>
      <section className="admin-photo-guide admin-surface"><div className="admin-photo-illustration" aria-hidden="true"><div><AdminIcon name="photo" width="44" height="44" /></div><span><AdminIcon name="plus" /></span></div><p className="admin-kicker">Bring your products to life</p><h2>Your photos belong<br />on your product page.</h2><p>Upload photos from your device, choose the cover image, and arrange your gallery. No code or separate image service needed.</p><Link href="/admin/products#photos-guide" className="admin-text-link">Manage product photos <AdminIcon name="arrow" /></Link><small>JPEG, PNG or WebP · Up to 5 MB each</small></section>
    </div>
    <div className="admin-overview-grid admin-overview-bottom"><section className="admin-surface"><div className="admin-surface-heading"><h2>Recent orders</h2><Link className="admin-text-link" href="/admin/orders">View all <AdminIcon name="arrow" /></Link></div>
      {recent.length ? <ul className="admin-recent-orders">{recent.map(order => <li key={order.id}><Link href={`/admin/orders/${order.id}`}><strong>{order.number}</strong><span>{order.status.replaceAll("_", " ")}</span></Link><div><strong>{formatBdt(order.total)}</strong><time dateTime={order.createdAt.toISOString()}>{order.createdAt.toLocaleDateString("en-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short" })}</time></div></li>)}</ul> : <div className="admin-empty-inline"><AdminIcon name="orders" width="32" height="32" /><h3>Your first order will appear here</h3><p>When a customer checks out, review the order here and manage its delivery.</p></div>}
    </section><section className="admin-surface"><div className="admin-surface-heading"><h2>Owner order alerts</h2><AdminIcon name="orders" /></div>{alerts.length ? <ul className="admin-alert-summary">{alerts.map(row => <li key={row.status}><span>{row.status}</span><strong>{row.count}</strong></li>)}</ul> : <p className="admin-muted">No queued alerts.</p>}<p className="admin-muted">Email alerts need SMTP setup and a scheduled worker. Until delivery is verified, check your order list regularly.</p><Link href="/admin/orders" className="admin-text-link">Open order list <AdminIcon name="arrow" /></Link></section></div>
  </section>;
}
