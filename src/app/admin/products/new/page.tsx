import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { ProductForm } from "@/features/admin/catalog/product-forms";
import { AdminIcon } from "@/components/admin/admin-icon";
import { CategoryForm } from "@/features/admin/catalog/category-forms";

export default async function NewProductPage() {
  await requireAdmin();
  const rows = await getDb().select({ id: categories.id, nameEn: categories.nameEn }).from(categories).orderBy(asc(categories.nameEn));
  return <section aria-label="Admin" className="admin-catalog"><nav className="admin-breadcrumb"><Link href="/admin/products">Products</Link><span>/</span>New product</nav>
    <div className="admin-page-heading"><div><p className="admin-kicker">Build your catalog</p><h1>New product</h1><p>Start with the details. Add photos after saving your draft.</p></div></div>
    <ol className="admin-product-steps" aria-label="Product setup"><li aria-current="step"><span>01</span>Product details</li><li><span>02</span>Upload photos</li><li><span>03</span>Review & publish</li></ol>
    <details className="admin-inline-category admin-surface" open={!rows.length}><summary><span><AdminIcon name="categories" />{rows.length ? "Need another category? Create one here" : "First, create a category for this product"}</span><AdminIcon name="plus" /></summary><p className="admin-muted">Save the category here. It will appear in the product form below, so you can keep working on this page.</p><CategoryForm /></details>
    <ProductForm categories={rows} />
  </section>;
}
