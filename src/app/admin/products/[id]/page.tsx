import Link from "next/link";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { getAdminProduct } from "@/features/admin/catalog/products";
import { ImageControls, ImageUploadForm } from "@/features/admin/catalog/image-forms";
import { ArchiveProduct, ProductForm, VariantForm, VariantInventoryForm } from "@/features/admin/catalog/product-forms";
import { AdminIcon } from "@/components/admin/admin-icon";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const db = getDb();
  const product = await getAdminProduct(db, id);
  if (!product) notFound();
  const rows = await db.select({ id: categories.id, nameEn: categories.nameEn }).from(categories).orderBy(asc(categories.nameEn));
  return <section aria-label="Admin" className="admin-catalog">
    <nav aria-label="Admin" className="admin-breadcrumb"><Link href="/admin/products">Products</Link><span>/</span>Edit product</nav>
    <div className="admin-page-heading"><div><p className="admin-kicker">Product workspace</p><h1>{product.nameEn}</h1><p>{product.sku} <span className={`admin-status${product.isPublished ? " is-published" : ""}`}>{product.isPublished ? "Published" : "Draft"}</span></p></div><a className="button admin-button-secondary" href="#photos"><AdminIcon name="photo" />Upload photos</a></div>
    <nav className="admin-section-tabs" aria-label="Product sections"><a href="#details">Product details</a><a href="#photos">Photos ({product.images.filter(image => image.storageKey).length})</a><a href="#inventory">Variants & stock</a></nav>
    {product.isDemo && <p className="order-notice">Unverified demo data. Create a new product with verified content/photos rather than publishing this record.</p>}
    <section id="photos" className="admin-photo-section"><div className="admin-section-heading"><div><h2>Product photos</h2><p>Upload from your device. Choose a cover image and arrange your gallery.</p></div><span className="admin-count">{product.images.filter(image => image.storageKey).length} / 10 photos</span></div>
    {!product.isDemo && <ImageUploadForm productId={id} />}
    <div className="admin-image-grid">{product.images.filter(image => image.storageKey).map(image => <ImageControls key={image.id} productId={id} image={image} />)}</div></section>
    <section id="details"><ProductForm product={product} categories={rows} /></section>
    <section id="inventory"><div className="admin-section-heading"><div><h2>Variants and stock</h2>
    <p>Editing stock affects new purchases only; completed order snapshots remain unchanged.</p>
    </div></div>
    {product.variants.map((v) => <div key={v.id}>
      <VariantForm productId={id} variant={v} />
      <VariantInventoryForm productId={id} variant={v} />
    </div>)}
    <VariantForm productId={id} />
    </section>
    <ArchiveProduct id={id} />
  </section>;
}
