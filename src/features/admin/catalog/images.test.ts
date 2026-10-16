import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { categories, productImages, products } from "@/db/schema";
import { normalizeProductImage } from "@/features/catalog/storage/image-file";
import type { ImageStorage } from "@/features/catalog/storage/supabase";
import { changeProductImage, uploadProductImage } from "./images";
import { getAdminProduct, productInput, saveProduct, saveVariant, variantInput } from "./products";

const hash = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");
async function sample(color: string) { return sharp({ create: { width: 32, height: 32, channels: 3, background: color } }).png().toBuffer(); }
test("image decoder checks real formats, pixel limits and re-encodes stripped WebP", async () => {
  const source = await sample("red");
  const normalized = await normalizeProductImage(new File([new Uint8Array(source)], "owner.png", { type: "image/png" }));
  assert.equal((await sharp(normalized).metadata()).format, "webp");
  await assert.rejects(normalizeProductImage(new File(["<svg></svg>"], "fake.png", { type: "image/png" })), /real JPEG/);
  await assert.rejects(normalizeProductImage(new File([new Uint8Array(source)], "fake.jpg", { type: "image/jpeg" })), /real JPEG/);
  await assert.rejects(normalizeProductImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })), /5 MB/);
});
const url = process.env.DATABASE_URL;
test("owner draft → actual decoded photo → primary/reorder/publish; missing/tampered/foreign images fail", { skip: !url }, async () => {
  const client = postgres(url!, { ssl: false, max: 1 }); const db = drizzle({ client });
  const files = new Map<string, Uint8Array>();
  const storage: ImageStorage = {
    async upload(key, bytes) { files.set(key, bytes); },
    async exists(key, expected) { const bytes = files.get(key); return Boolean(bytes && (!expected || hash(bytes) === expected)); },
    async remove(key) { files.delete(key); },
  };
  try {
    await assert.rejects(db.transaction(async tx => {
      const [category] = await tx.insert(categories).values({ slug: `media-${crypto.randomUUID()}`, nameEn: "Media fixture" }).returning();
      const base = productInput.parse({ slug: `media-${crypto.randomUUID()}`, sku: crypto.randomUUID(), categoryId: category.id, nameEn: "Real photo product", nameBn: "", descriptionEn: "", descriptionBn: "", priceMinor: "10", compareAtMinor: "", isFeatured: true, isPublished: false });
      const variant = variantInput.parse({ sku: crypto.randomUUID(), label: "Default", attributes: {}, priceMinor: "", trackInventory: true, stockQuantity: 1, isActive: true });
      const created = await saveProduct(tx, base, undefined, variant); assert.ok("id" in created); const id = created.id!;
      const bytes = await normalizeProductImage(new File([new Uint8Array(await sample("red"))], "photo.png", { type: "image/png" }));
      const first = await uploadProductImage(tx, storage, id, bytes, { altEn: "Red sample", altBn: null });
      const second = await uploadProductImage(tx, storage, id, await normalizeProductImage(new File([new Uint8Array(await sample("blue"))], "photo.png", { type: "image/png" })), { altEn: "Blue sample", altBn: null });
      assert.ok(first.isPrimary); assert.equal(second.isPrimary, false);
      assert.ok("id" in await saveProduct(tx, { ...base, isPublished: true }, id, undefined, storage.exists));
      files.set(first.storageKey!, new Uint8Array([1, 2, 3]));
      assert.ok("error" in await saveProduct(tx, { ...base, isPublished: true }, id, undefined, storage.exists));
      files.set(first.storageKey!, bytes);
      await changeProductImage(tx, storage, id, second.id, "primary");
      await changeProductImage(tx, storage, id, second.id, "up");
      assert.equal((await getAdminProduct(tx, id))?.images[0].id, second.id);
      await assert.rejects(changeProductImage(tx, storage, crypto.randomUUID(), second.id, "remove"), /Product no longer/);
      await changeProductImage(tx, storage, id, second.id, "remove");
      assert.equal((await tx.select().from(products).where(eq(products.id, id)))[0].isPublished, false);
      assert.equal(files.has(second.storageKey!), false);
      const variantId = (await getAdminProduct(tx, id))!.variants[0].id;
      await saveVariant(tx, id, { ...variant, isActive: false }, variantId);
      assert.ok("error" in await saveProduct(tx, { ...base, isPublished: true }, id, undefined, storage.exists));
      await tx.update(productImages).set({ storageKey: "invalid.txt" }).where(eq(productImages.id, first.id));
      assert.ok("error" in await saveProduct(tx, { ...base, isPublished: true }, id, undefined, storage.exists));
      const before = files.size;
      await assert.rejects(uploadProductImage(tx, storage, crypto.randomUUID(), bytes, { altEn: "x", altBn: null }), /real draft/);
      assert.equal(files.size, before);
      throw new Error("rollback media fixture");
    }), /rollback media fixture/);
  } finally { await client.end(); }
});
