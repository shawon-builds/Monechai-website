import Link from "next/link";
import Image from "next/image";
import { AdminIcon } from "@/components/admin/admin-icon";
import { productImageUrl } from "@/features/catalog/images";
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
    <div className="admin-page-heading"><div><p className="admin-kicker">Your catalog</p><h1>Products</h1><p>Manage your products, photos, prices, and stock.</p></div><Link className="button button-dark" href="/admin/products/new"><AdminIcon name="plus" />Add product</Link></div>
    <form method="get" className="shop-filters">
      <label>Search name or SKU<input name="q" maxLength={100} defaultValue={filters.q} /></label>
      <label>Status<select name="status" defaultValue={filters.status}><option value="">All</option><option value="published">Published</option><option value="draft">Draft</option><option value="demo">Demo</option></select></label>
      <label>Category<select name="categoryId" defaultValue={filters.categoryId}><option value="">All categories</option>{categoryRows.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}</select></label>
      <button className="button button-dark">Filter products</button>
    </form><div className="admin-list-caption"><span>{total} matching {total === 1 ? "product" : "products"}</span><Link href="/admin/categories">Manage categories <AdminIcon name="arrow" /></Link></div>
    {!!items.length && <ul className="admin-product-list admin-catalog-list">{items.map(p => {
      const photo = productImageUrl(p.primaryStorageKey);
      return <li key={p.id} className="admin-product-row"><Link href={`/admin/products/${p.id}`} className="admin-product-identity"><div className="admin-product-thumb">{photo ? <Image src={photo} alt="" width={64} height={64} /> : <AdminIcon name="photo" width="26" height="26" />}</div><div><strong>{p.nameEn}</strong><span>{p.sku} · {p.categoryName}</span></div></Link><span className={`admin-status${p.isPublished ? " is-published" : ""}`}>{p.isDemo ? "Demo" : p.isPublished ? "Published" : "Draft"}</span><div className="admin-product-price"><strong>{formatBdt(p.priceMinor)}</strong><span>Stock: {p.stock ?? "Untracked"}</span></div><Link className="admin-row-edit" href={`/admin/products/${p.id}#photos`}>Edit & photos <AdminIcon name="arrow" /></Link></li>;
    })}</ul>}
    {!items.length && <div className="admin-surface admin-empty-catalog"><span className="admin-empty-icon"><AdminIcon name="products" width="36" height="36" /></span><h2>{filters.q || filters.status || filters.categoryId || page > 1 ? "No products found" : "Your catalog starts here"}</h2><p>{filters.q || filters.status || filters.categoryId || page > 1 ? "Try a different search, status, category, or page." : "Create a category, add your first product, and bring it to life with your own photos."}</p><div className="admin-actions"><Link className="button button-dark" href={categoryRows.length ? "/admin/products/new" : "/admin/categories"}><AdminIcon name="plus" />{categoryRows.length ? "Add your first product" : "Create your first category"}</Link>{(filters.q || filters.status || filters.categoryId || page > 1) && <Link className="button admin-button-secondary" href="/admin/products">Clear filters</Link>}</div></div>}
    <nav aria-label="Product pages" className="pagination">{page>1 && <Link href={href(page-1)}>Previous</Link>}<span>Page {page}</span>{page*30<total && <Link href={href(page+1)}>Next</Link>}</nav>
    <section className="admin-surface admin-photo-instructions" id="photos-guide"><div className="admin-surface-heading"><h2><AdminIcon name="photo" />How to add product photos</h2><span>From your device to your store</span></div><ol><li><strong>01 · Save a draft</strong><p>Add the name, price, category, and initial stock.</p></li><li><strong>02 · Upload your photos</strong><p>Open the product’s Photos section. Choose JPEG, PNG, or WebP files up to 5 MB each.</p></li><li><strong>03 · Choose a cover & publish</strong><p>Set the primary photo, arrange the gallery, and publish when the product is ready.</p></li></ol><p className="admin-muted">Up to 10 photos per product. Existing photo upload, cover selection, ordering, and removal are all on the product edit page.</p></section>
  </section>;
}
