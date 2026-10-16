import Link from "next/link";
import { requireAdmin } from "@/features/admin/auth";
import { logoutAdmin } from "@/features/admin/actions";
import { getDb } from "@/db/client";
import { alertQueueSummary } from "@/features/admin/notifications";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const alerts = await alertQueueSummary(getDb());
  return <section aria-label="Admin" className="admin-panel">
    <h1>Admin dashboard</h1>
    <p>Signed in as {admin.email ?? "admin"}.</p>
    <p><Link href="/admin/orders">Manage orders</Link> · <Link href="/admin/categories">Manage categories</Link> · <Link href="/admin/products">Manage products</Link> · <Link href="/admin/settings">Store settings</Link></p>
    <p>Create drafts, upload verified photos, then publish products. Configure verified contact details and shipping fees before live checkout.</p>
    <h2>Owner order alerts</h2><p>{alerts.length ? alerts.map(row => `${row.status}: ${row.count}`).join(" · ") : "No queued alerts."} Configure and schedule the SMTP worker; failed alerts remain visible on order detail.</p>
    <form action={logoutAdmin}><button className="button button-dark" type="submit">Sign out</button></form>
  </section>;
}
