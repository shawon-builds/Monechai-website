"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/features/admin/actions";
import { AdminIcon, type AdminIconName } from "./admin-icon";

const destinations: { href: string; label: string; icon: AdminIconName }[] = [
  { href: "/admin", label: "Overview", icon: "overview" },
  { href: "/admin/products", label: "Products", icon: "products" },
  { href: "/admin/categories", label: "Categories", icon: "categories" },
  { href: "/admin/inventory", label: "Inventory", icon: "inventory" },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
  { href: "/admin/settings", label: "Store settings", icon: "settings" },
];
const accessRoutes = ["/admin/login", "/admin/recovery", "/admin/security", "/admin/unauthorized"];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAccess = accessRoutes.includes(pathname);
  const current = destinations.find(item => item.href !== "/admin" && pathname.startsWith(item.href)) ?? destinations[0];
  const brand = <Image src="/monechai-logo.svg" alt="Monechai" width={177} height={42} priority />;

  if (isAccess) return <div className="admin-workspace admin-access" lang="en">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="admin-access-header"><Link href="/en" aria-label="Monechai home">{brand}</Link><Link href="/en">Back to store <AdminIcon name="arrow" /></Link></header>
    <main id="main" className="admin-access-content">{children}</main>
    <p className="admin-access-footer">Monechai · Owner access</p>
  </div>;

  return <div className="admin-workspace" lang="en">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="admin-sidebar" aria-label="Store workspace">
      <Link className="admin-brand" href="/admin" aria-label="Monechai admin overview">{brand}<span>Store administration</span></Link>
      <div className="admin-nav-label">Workspace</div>
      <nav aria-label="Admin navigation">{destinations.map(item => {
        const active = current.href === item.href;
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}><AdminIcon name={item.icon} /><span>{item.label}</span>{active && <span className="admin-nav-dot" />}</Link>;
      })}</nav>
      <div className="admin-sidebar-help"><AdminIcon name="photo" /><strong>Adding product photos?</strong><p>Save a draft, then add photos on its product page.</p><Link href="/admin/products#photos-guide">See how it works <AdminIcon name="arrow" /></Link></div>
      <form action={logoutAdmin} className="admin-signout"><button type="submit"><AdminIcon name="logout" />Sign out</button></form>
    </aside>
    <div className="admin-workspace-body">
      <header className="admin-topbar"><div><span className="admin-topbar-context">Workspace</span><span className="admin-topbar-separator">/</span><strong>{current.label}</strong></div><Link href="/en" className="admin-store-link">View store <AdminIcon name="external" /></Link></header>
      <main id="main" className="admin-content">{children}</main>
      <footer className="admin-workspace-footer"><span>Monechai administration</span><span>Prices in BDT · Times in Bangladesh</span></footer>
    </div>
  </div>;
}
