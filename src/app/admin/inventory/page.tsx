import Link from "next/link";
import { and, asc, count, eq, ilike, lte, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { productVariants, products } from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { singleParam } from "@/lib/params";
import { AdminIcon } from "@/components/admin/admin-icon";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = singleParam(params.q).trim().slice(0, 100);
  const stock = singleParam(params.stock);
  const rawPage = singleParam(params.page);
  const page = /^[1-9]\d{0,4}$/.test(rawPage) ? Number(rawPage) : 1;
  const escaped = q.replace(/[\\%_]/g, "\\$&");
  const where = and(eq(products.isDemo, false), eq(productVariants.isActive, true), q ? or(ilike(products.nameEn, `%${escaped}%`), ilike(productVariants.sku, `%${escaped}%`)) : undefined,
    stock === "low" ? and(eq(productVariants.trackInventory, true), lte(productVariants.stockQuantity, 5)) : stock === "out" ? and(eq(productVariants.trackInventory, true), eq(productVariants.stockQuantity, 0)) : stock === "untracked" ? eq(productVariants.trackInventory, false) : undefined);
  const db = getDb();
  const [rows, [summary]] = await Promise.all([
    db.select({ id: productVariants.id, productId: products.id, name: products.nameEn, sku: productVariants.sku, label: productVariants.label, stock: productVariants.stockQuantity, tracked: productVariants.trackInventory, published: products.isPublished }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(where).orderBy(asc(products.nameEn), asc(productVariants.sku), asc(productVariants.id)).limit(50).offset((page - 1) * 50),
    db.select({ count: count() }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(where),
  ]);
  const href = (next: number) => `/admin/inventory?${new URLSearchParams({ q, stock, page: String(next) })}`;
  return <section className="admin-catalog" aria-label="Inventory management"><div className="admin-page-heading"><div><p className="admin-kicker">Keep stock in view</p><h1>Inventory</h1><p>Active variants across your catalog. Open a product to adjust its stock.</p></div><Link href="/admin/products" className="button admin-button-secondary">View products <AdminIcon name="arrow" /></Link></div>
    <form className="shop-filters" method="get"><label>Search product or variant SKU<input name="q" maxLength={100} defaultValue={q} /></label><label>Stock level<select name="stock" defaultValue={stock}><option value="">All active variants</option><option value="low">Low stock · 5 or fewer</option><option value="out">Out of stock</option><option value="untracked">Not tracked</option></select></label><button className="button button-dark">Filter inventory</button></form>
    <p className="admin-muted">{summary.count} matching variants. Includes draft products; demo products and inactive variants are excluded.</p>
    {rows.length ? <ul className="admin-product-list admin-catalog-list">{rows.map(row => <li key={row.id} className="admin-product-row admin-inventory-row"><div><Link href={`/admin/products/${row.productId}#inventory`}><strong>{row.name}</strong></Link><small>{row.sku} · {row.label}</small></div><span className={`admin-status${row.published ? " is-published" : ""}`}>{row.published ? "Published" : "Draft"}</span><div className="admin-product-price"><strong>{row.tracked ? `${row.stock} units` : "Untracked"}</strong><span>{row.tracked && row.stock === 0 ? "Out of stock" : row.tracked && row.stock !== null && row.stock <= 5 ? "Low stock" : ""}</span></div><Link href={`/admin/products/${row.productId}#inventory`} className="admin-row-edit">Adjust stock <AdminIcon name="arrow" /></Link></li>)}</ul> : <div className="admin-surface admin-empty-catalog"><span className="admin-empty-icon"><AdminIcon name="inventory" width="36" height="36" /></span><h2>No matching inventory</h2><p>Add a product and its variants, or try another stock filter.</p><Link href="/admin/products/new" className="button button-dark"><AdminIcon name="plus" />Add product</Link></div>}
    <nav aria-label="Inventory pages" className="pagination">{page > 1 && <Link href={href(page - 1)}>Previous</Link>}<span>Page {page}</span>{page * 50 < summary.count && <Link href={href(page + 1)}>Next</Link>}</nav>
  </section>;
}
