"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { withAdminMutation } from "@/features/admin/mutation-history";
import { requireAdmin } from "@/features/admin/auth";
import { logEvent } from "@/lib/logger";
import { getImageStorage } from "@/features/catalog/storage/supabase";
import { adjustVariantInventory, archiveProduct, CatalogMutationError, inventoryInput, productInput, saveProduct, saveVariant, variantInput, variantMetadataInput } from "./products";
import type { VariantInput } from "./products";

export type ProductState = { message: string; errors?: Record<string, string[]> };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const errorState = (message: string): ProductState => ({ message });
function pgCode(error: unknown) {
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i++) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? current.cause : null;
  }
}
function refresh(slugs: (string | null)[]) {
  revalidatePath("/admin/products"); revalidatePath("/", "layout");
  for (const slug of slugs) if (slug) for (const locale of ["en", "bn"]) revalidatePath(`/${locale}/products/${slug}`);
}

export async function saveProductAction(id: string | null, _state: ProductState, form: FormData): Promise<ProductState> {
  void _state;
  const admin = await requireAdmin();
  if (id && !uuid.test(id)) return errorState("Invalid product ID.");
  const parsed = productInput.safeParse({
    slug: form.get("slug"), sku: form.get("sku"), categoryId: form.get("categoryId"),
    nameEn: form.get("nameEn"), nameBn: form.get("nameBn"), descriptionEn: form.get("descriptionEn"),
    descriptionBn: form.get("descriptionBn"), priceMinor: form.get("priceMinor"), compareAtMinor: form.get("compareAtMinor"),
    isFeatured: form.has("isFeatured"), isPublished: form.has("isPublished"),
  });
  if (!parsed.success) return { message: "Check the product fields.", errors: parsed.error.flatten().fieldErrors };
  let initial: VariantInput | undefined;
  if (!id) {
    const result = variantInput.safeParse({ sku: form.get("variantSku"), label: form.get("variantLabel"),
      attributes: {}, priceMinor: "", trackInventory: true, stockQuantity: Number(form.get("stockQuantity")), isActive: true });
    if (!result.success || !/^(0|[1-9]\d*)$/.test(String(form.get("stockQuantity") ?? "")))
      return errorState("Enter a first variant SKU, label and nonnegative whole stock quantity.");
    initial = result.data;
  }
  try {
    const storage = parsed.data.isPublished ? await getImageStorage() : null;
    const result = await withAdminMutation(getDb(), admin.id, tx => saveProduct(tx, parsed.data, id ?? undefined, initial, storage ? (key, hash) => storage.exists(key, hash) : undefined));
    if ("error" in result) return errorState(result.error ?? "Unable to save product.");
    refresh([result.oldSlug, parsed.data.slug]);
    if (id) revalidatePath(`/admin/products/${id}`);
    if (!id) redirect(`/admin/products/${result.id}`);
    return { message: "Product saved." };
  } catch (error) {
    // redirect() throws a special exception and must not be swallowed by a generic DB handler.
    if (pgCode(error) === "23505") return errorState("Product slug or SKU is already in use.");
    throw error;
  }
}

export async function saveVariantAction(productId: string, variantId: string | null, _state: ProductState, form: FormData): Promise<ProductState> {
  void _state;
  const admin = await requireAdmin();
  if (!uuid.test(productId) || (variantId && !uuid.test(variantId))) return errorState("Invalid variant ID.");
  const keys = form.getAll("attributeKey").map(String), values = form.getAll("attributeValue").map(String);
  const attributes: Record<string,string> = Object.create(null);
  if (keys.length > 10 || keys.length !== values.length) return errorState("Use up to ten named text attributes.");
  for (let index=0; index<keys.length; index++) {
    const key = keys[index].trim(), value = values[index].trim();
    if (!key && !value) continue;
    if (!key || !value || Object.hasOwn(attributes,key) || ["__proto__","constructor","prototype"].includes(key)) return errorState("Attribute names must be unique with a value.");
    attributes[key] = value;
  }
  const stock = String(form.get("stockQuantity") ?? "");
  const tracked = form.has("trackInventory");
  const result = (variantId ? variantMetadataInput : variantInput).safeParse({ sku: form.get("sku"), label: form.get("label"), labelBn: form.get("labelBn") ?? "", attributes,
    priceMinor: form.get("priceMinor"), trackInventory: tracked,
    stockQuantity: tracked && /^(0|[1-9]\d*)$/.test(stock) ? Number(stock) : null,
    isActive: form.has("isActive") });
  if (!result.success) return { message: "Check the variant fields (stock is required when tracked).", errors: result.error.flatten().fieldErrors };
  try {
    const row = await withAdminMutation(getDb(), admin.id, tx => saveVariant(tx, productId, result.data, variantId ?? undefined));
    if (!row) return errorState("Product or variant no longer exists.");
    refresh([]);
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/[locale]/products/[slug]", "page");
    return { message: "Variant saved." };
  } catch (error) {
    if (error instanceof CatalogMutationError) return errorState(error.message);
    if (pgCode(error) === "23505") return errorState("Variant SKU is already in use.");
    throw error;
  }
}

export async function adjustVariantInventoryAction(productId: string, variantId: string, _state: ProductState, form: FormData): Promise<ProductState> {
  const admin = await requireAdmin();
  if (!uuid.test(productId) || !uuid.test(variantId)) return errorState("Invalid variant ID.");
  if (!form.has("confirmInventory")) return errorState("Confirm this intentional inventory adjustment.");
  const expected = form.get("expectedStockQuantity"), stock = form.get("stockQuantity");
  const tracked = form.has("trackInventory");
  const whole = (value: FormDataEntryValue | null) => typeof value === "string" && /^(0|[1-9]\d*)$/.test(value);
  if ((expected !== "untracked" && !whole(expected)) || (tracked && !whole(stock)))
    return errorState("Enter nonnegative whole stock quantities.");
  const parsed = inventoryInput.safeParse({ expectedStockQuantity: expected === "untracked" ? null : Number(expected),
    trackInventory: tracked, stockQuantity: tracked ? Number(stock) : null });
  if (!parsed.success) return errorState("Check the inventory fields.");
  try {
    const result = await withAdminMutation(getDb(), admin.id, tx => adjustVariantInventory(tx, productId, variantId, parsed.data));
    if (!result) return errorState("Product or variant no longer exists.");
    logEvent("info", "variant_inventory_adjusted", { actorUserId: admin.id, productId, variantId,
      previousStockQuantity: result.previousStockQuantity ?? "untracked", stockQuantity: result.stockQuantity ?? "untracked", trackInventory: result.trackInventory });
    refresh([]);
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/[locale]/products/[slug]", "page");
    return { message: "Inventory adjusted." };
  } catch (error) {
    if (error instanceof CatalogMutationError) return errorState(error.message);
    if (["55P03", "40P01", "40001"].includes(pgCode(error) ?? ""))
      return errorState("Inventory is busy. Reload the page and review stock before trying again.");
    throw error;
  }
}

export async function archiveProductAction(id: string, _state: ProductState, _form: FormData): Promise<ProductState> {
  void _state; void _form;
  const admin = await requireAdmin();
  if (!uuid.test(id)) return errorState("Invalid product ID.");
  const result = await withAdminMutation(getDb(), admin.id, tx => archiveProduct(tx, id));
  if (!result) return errorState("Product no longer exists.");
  refresh([result.slug]); revalidatePath(`/admin/products/${id}`);
  return { message: "Product unpublished and removed from featured listings. Existing order snapshots are unchanged." };
}
