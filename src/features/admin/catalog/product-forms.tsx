"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { adjustVariantInventoryAction, archiveProductAction, saveProductAction, saveVariantAction, type ProductState } from "./product-actions";

const initial: ProductState = { message: "" };
const amount = (minor: number | null | undefined) => minor == null ? "" : (minor / 100).toFixed(2);
type Product = { id: string; slug: string; sku: string; categoryId: string; nameEn: string; nameBn: string | null;
  descriptionEn: string | null; descriptionBn: string | null; priceMinor: number; compareAtMinor: number | null;
  isPublished: boolean; isFeatured: boolean; isDemo: boolean };
type Variant = { id: string; sku: string; label: string; labelBn?: string | null; attributes: Record<string, string>; priceMinor: number | null;
  trackInventory: boolean; stockQuantity: number | null; isActive: boolean };

export function ProductForm({ product, categories }: { product?: Product; categories: { id: string; nameEn: string }[] }) {
  const [state, action, pending] = useActionState(saveProductAction.bind(null, product?.id ?? null), initial);
  return <form action={action} className="admin-form admin-card">
    <h2>Product details</h2>
    <p>Drafts stay private until you add a photo and publish. Enter prices in taka (BDT).</p>
    <div className="admin-form-grid">
    <label>English name <input name="nameEn" required maxLength={200} defaultValue={product?.nameEn} placeholder="e.g. Cotton everyday tote" /></label>
    <label>Bangla name (optional) <input name="nameBn" maxLength={200} defaultValue={product?.nameBn ?? ""} /></label>
    <label>Slug <input name="slug" required maxLength={150} defaultValue={product?.slug} placeholder="e.g. cotton-everyday-tote" /><small>The product’s URL name. Use lowercase letters, numbers, and hyphens.</small></label>
    <label>Product SKU <input name="sku" required maxLength={100} defaultValue={product?.sku} placeholder="e.g. TOTE-001" /><small>Your unique reference for this product.</small></label>
    <label>Category <select name="categoryId" required disabled={!categories.length} defaultValue={product?.categoryId ?? ""}>
      <option value="" disabled>{categories.length ? "Select a category" : "Create a category above first"}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
    </select></label>
    </div>
    <label>English description <textarea name="descriptionEn" maxLength={10000} rows={4} defaultValue={product?.descriptionEn ?? ""} /></label>
    <label>Bangla description <textarea name="descriptionBn" maxLength={10000} rows={4} defaultValue={product?.descriptionBn ?? ""} /></label>
    <div className="admin-form-grid"><label>Price (BDT) <input name="priceMinor" inputMode="decimal" required defaultValue={amount(product?.priceMinor)} placeholder="0.00" /></label>
    <label>Compare-at price (BDT, optional) <input name="compareAtMinor" inputMode="decimal" defaultValue={amount(product?.compareAtMinor)} /></label>
    </div>
    {!product && <fieldset><legend>First variant (inventory)</legend>
      <label>Variant SKU <input name="variantSku" required maxLength={100} /></label>
      <label>Variant label <input name="variantLabel" required maxLength={150} defaultValue="Default" /></label>
      <label>Stock quantity <input name="stockQuantity" required type="number" min="0" step="1" defaultValue="0" /></label>
    </fieldset>}
    <label className="admin-check"><input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} /> Featured</label>
    {product && <label className="admin-check"><input type="checkbox" name="isPublished" defaultChecked={product.isPublished} /> Published (requires an uploaded primary photo; demos cannot publish)</label>}
    <button type="submit" className="button button-dark" disabled={pending || !categories.length}>{pending ? "Saving…" : product ? "Save product" : "Save draft & add photos"}</button>
    <p role="status" aria-live="polite" className={state.message && state.message !== "Product saved." ? "checkout-error" : ""}>{state.message}</p>
    {state.errors && <ul className="checkout-error">{Object.entries(state.errors).map(([field, errors]) => <li key={field}>{field}: {errors.join(", ")}</li>)}</ul>}
  </form>;
}

export function VariantForm({ productId, variant }: { productId: string; variant?: Variant }) {
  const [state, action, pending] = useActionState(saveVariantAction.bind(null, productId, variant?.id ?? null), initial);
  return <form action={action} className="admin-form admin-card">
    <h3>{variant ? `Edit ${variant.label}` : "Add variant"}</h3>
    <label>SKU <input name="sku" required maxLength={100} defaultValue={variant?.sku} /></label>
    <label>Label <input name="label" required maxLength={150} defaultValue={variant?.label} /></label>
    <label>Bangla label (optional)<input name="labelBn" maxLength={150} defaultValue={variant?.labelBn ?? ""} /></label>
    <AttributeFields initial={variant?.attributes ?? {}} />
    <label>Override price (BDT, optional) <input name="priceMinor" inputMode="decimal" defaultValue={amount(variant?.priceMinor)} /></label>
    {!variant && <>
      <label className="admin-check"><input name="trackInventory" type="checkbox" defaultChecked /> Track inventory</label>
      <label>Initial stock (required if tracking; ignored otherwise) <input name="stockQuantity" type="number" min="0" max="2147483647" step="1" defaultValue={0} /></label>
    </>}
    {variant && <p>Saving variant details leaves stock and inventory tracking unchanged.</p>}
    <label className="admin-check"><input name="isActive" type="checkbox" defaultChecked={variant?.isActive ?? true} /> Active</label>
    <button type="submit" className="button button-dark" disabled={pending}>Save variant</button>
    <p role="status" aria-live="polite">{state.message}</p>
    {state.errors && <ul className="checkout-error">{Object.entries(state.errors).map(([field, errors]) => <li key={field}>{field}: {errors.join(", ")}</li>)}</ul>}
  </form>;
}

export function VariantInventoryForm({ productId, variant }: { productId: string; variant: Variant }) {
  const [state, action, pending] = useActionState(adjustVariantInventoryAction.bind(null, productId, variant.id), initial);
  const inventoryVersion = `${variant.trackInventory}:${variant.stockQuantity}`;
  const submit = useRef<HTMLButtonElement>(null), restoreFocus = useRef(false);
  useEffect(() => {
    if (!pending && restoreFocus.current) {
      restoreFocus.current = false;
      if (document.activeElement === document.body) submit.current?.focus();
    }
  }, [pending]);
  return <form action={action} onSubmit={() => { restoreFocus.current = document.activeElement === submit.current; }} className="admin-form admin-card">
    <h3>Inventory: {variant.label}</h3>
    <p>Stock when loaded: {variant.stockQuantity ?? "untracked"}. Reload before adjusting if another save, purchase or restock changed inventory.</p>
    <input type="hidden" name="expectedStockQuantity" value={variant.stockQuantity ?? "untracked"} />
    <label className="admin-check"><input key={inventoryVersion} name="trackInventory" type="checkbox" defaultChecked={variant.trackInventory} /> Track inventory</label>
    <label>New stock quantity (required if tracking; ignored otherwise) <input key={inventoryVersion} name="stockQuantity" type="number" min="0" max="2147483647" step="1" defaultValue={variant.stockQuantity ?? 0} /></label>
    <label className="admin-check"><input key={inventoryVersion} name="confirmInventory" type="checkbox" required /> I intend to adjust inventory to these values</label>
    <button ref={submit} type="submit" className="button button-dark" disabled={pending}>{pending ? "Adjusting…" : "Adjust inventory"}</button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function ArchiveProduct({ id }: { id: string }) {
  const [state, action, pending] = useActionState(archiveProductAction.bind(null, id), initial);
  return <form action={action} className="admin-card"><button className="button button-dark" disabled={pending}>Unpublish / archive</button>
    <p role="status" aria-live="polite">{state.message}</p></form>;
}

function AttributeFields({ initial }: { initial: Record<string,string> }) {
  const [rows,setRows] = useState(() => Object.entries(initial).map(([key,value],id) => ({ id,key,value })));
  const nextId = useRef(rows.length);
  return <fieldset><legend>Option attributes</legend>
    {rows.map(row => <div className="attribute-row" key={row.id}><label>Name<input name="attributeKey" maxLength={80} value={row.key} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r,key:e.target.value } : r))} /></label>
      <label>Value<input name="attributeValue" maxLength={150} value={row.value} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r,value:e.target.value } : r))} /></label>
      <button type="button" onClick={() => setRows(rows.filter(r => r.id !== row.id))}>Remove attribute</button></div>)}
    <button type="button" disabled={rows.length>=10} onClick={() => setRows([...rows,{ id:nextId.current++,key:"",value:"" }])}>Add attribute</button>
  </fieldset>;
}
