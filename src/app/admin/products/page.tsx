import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { listAdminProducts } from "@/features/admin/catalog/products";
import { formatBdt } from "@/lib/money";
import { singleParam } from "@/lib/params";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = /^[1-9]\d{0,4}$/.test(singleParam(params.page)) ? Number(params.page) : 1;
  const filters = { q: singleParam(params.q).trim().slice(0,100), status: singleParam(params.status), categoryId: singleParam(params.categoryId) };
  const db = getDb();
  const { items, total } = await listAdminProducts(db, page, filters);
  const categoryRows = await db.select().from(categories).orderBy(asc(categories.nameEn));
  const href = (p: number) => `/admin/products?${new URLSearchParams({ ...filters, page:String(p) })}`;
  return <section aria-label="Admin products" className="admin-catalog">
    <nav aria-label="Admin"><Link href="/admin">Dashboard</Link> / Products</nav><h1>Products</h1>
    <p><Link className="button button-gold" href="/admin/products/new">Add product</Link> · <Link href="/admin/categories">Manage categories</Link></p>
    <form method="get" className="shop-filters">
      <label>Search name or SKU<input name="q" maxLength={100} defaultValue={filters.q} /></label>
      <label>Status<select name="status" defaultValue={filters.status}><option value="">All</option><option value="published">Published</option><option value="draft">Draft</option><option value="demo">Demo</option></select></label>
      <label>Category<select name="categoryId" defaultValue={filters.categoryId}><option value="">All categories</option>{categoryRows.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}</select></label>
      <button className="button button-dark">Filter products</button>
    </form><p>{total} matching products.</p>
    <ul className="admin-product-list">{items.map(p => <li key={p.id} className="admin-card">
      <Link href={`/admin/products/${p.id}`}><strong>{p.nameEn}</strong></Link> · {p.sku} · {p.categoryName} · {formatBdt(p.priceMinor)}
      <div>{p.isDemo ? "Demo — cannot publish" : p.isPublished ? "Published" : "Draft"} · Tracked stock: {p.stock ?? "Not tracked / no active variants"}</div>
    </li>)}</ul>
    {!items.length && <p>No products match this page.</p>}
    <nav aria-label="Product pages" className="pagination">{page>1 && <Link href={href(page-1)}>Previous</Link>}<span>Page {page}</span>{page*30<total && <Link href={href(page+1)}>Next</Link>}</nav>
  </section>;
}
