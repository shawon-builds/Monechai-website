import Link from "next/link";
import { requireAdmin } from "@/features/admin/auth";
import { getDb } from "@/db/client";
import { listAdminCategories } from "@/features/admin/catalog/categories";
import { CategoryForm, DeleteCategory } from "@/features/admin/catalog/category-forms";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const rows = await listAdminCategories(getDb());
  return <section aria-label="Admin" className="admin-catalog">
    <div className="admin-page-heading"><div><p className="admin-kicker">Organize your catalog</p><h1>Categories</h1><p>Group your products so customers can find what they need.</p></div><Link className="button admin-button-secondary" href="/admin/products">View products</Link></div>
    {!rows.length && <p className="order-notice">Start with one category, such as the type of product you sell. You can add more as your store grows.</p>}
    <CategoryForm />
    <div className="admin-category-grid">{rows.map((category) => <section className="admin-category-row" key={category.id}>
      <CategoryForm category={category} />
      <p>{category.productCount} product(s), including drafts.</p>
      <DeleteCategory category={category} />
    </section>)}</div>
  </section>;
}
