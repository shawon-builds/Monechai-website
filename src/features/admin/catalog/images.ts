import { createHash, randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { getDb } from "@/db/client";
import { productImages, products } from "@/db/schema";
import { MediaError, ownedImageKey } from "@/features/catalog/storage/image-file";
import type { ImageStorage } from "@/features/catalog/storage/supabase";
import { logEvent } from "@/lib/logger";
import { setAdminMutationActor } from "../mutation-history";

type Db = Pick<ReturnType<typeof getDb>, "select" | "insert" | "update" | "delete" | "transaction">;
export const imageAltInput = z.object({ altEn: z.string().trim().min(1).max(200), altBn: z.string().trim().max(200).transform((s) => s || null) });

export async function uploadProductImage(db: Db, storage: ImageStorage, productId: string, bytes: Uint8Array, input: z.output<typeof imageAltInput>, actorUserId?: string) {
  const [draft] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!draft || draft.isDemo) throw new MediaError("Create a real draft product before uploading photos.");
  const key = `${productId}/${randomUUID()}.webp`;
  const contentHash = createHash("sha256").update(bytes).digest("hex");
  await storage.upload(key, bytes);
  try {
    if (!await storage.exists(key, contentHash)) throw new MediaError("Uploaded image could not be verified.");
    return await db.transaction(async tx => {
      if (actorUserId) await setAdminMutationActor(tx, actorUserId);
      const [product] = await tx.select().from(products).where(eq(products.id, productId)).for("update");
      if (!product || product.isDemo) throw new MediaError("Create a real draft product before uploading photos.");
      const current = await tx.select().from(productImages).where(eq(productImages.productId, productId));
      if (current.length >= 10) throw new MediaError("A product supports up to 10 photos.");
      const [image] = await tx.insert(productImages).values({ productId, storageKey: key, ...input, isPrimary: !current.some((i) => i.isPrimary), sortOrder: current.length, verifiedAt: new Date(), contentHash }).returning();
      return image;
    });
  } catch (error) {
    try { await storage.remove(key); } catch { logEvent("error", "orphan_product_image_cleanup_failed"); }
    throw error;
  }
}
export async function changeProductImage(db: Db, storage: ImageStorage, productId: string, imageId: string, operation: "primary" | "remove" | "up" | "down", actorUserId?: string) {
  return db.transaction(async tx => {
    if (actorUserId) await setAdminMutationActor(tx, actorUserId);
    const [product] = await tx.select().from(products).where(eq(products.id, productId)).for("update");
    if (!product) throw new MediaError("Product no longer exists.");
    const images = await tx.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder), asc(productImages.id)).for("update");
    const selected = images.find((i) => i.id === imageId);
    if (!selected?.storageKey || !ownedImageKey(productId, selected.storageKey)) throw new MediaError("Image does not belong to this product.");
    if (operation === "primary") {
      if (!selected.verifiedAt || !await storage.exists(selected.storageKey, selected.contentHash)) throw new MediaError("The image file is missing or unverified.");
      if (!selected.isPrimary) {
        await tx.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, productId));
        await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, imageId));
      }
    } else if (operation === "remove") {
      // Unpublish atomically before removing a primary file. External deletion is
      // best-effort after DB metadata removal; a failure never leaves it for sale.
      if (selected.isPrimary && product.isPublished) await tx.update(products).set({ isPublished: false, isFeatured: false, updatedAt: new Date() }).where(eq(products.id, productId));
      await tx.delete(productImages).where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));
      if (selected.isPrimary) {
        const next = images.find((i) => i.id !== imageId && i.verifiedAt && i.storageKey && ownedImageKey(productId, i.storageKey));
        if (next) await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, next.id));
      }
    } else {
      const index = images.indexOf(selected); const target = operation === "up" ? index - 1 : index + 1;
      if (target >= 0 && target < images.length) [images[index], images[target]] = [images[target], images[index]];
      for (let i = 0; i < images.length; i++) await tx.update(productImages).set({ sortOrder: i }).where(eq(productImages.id, images[i].id));
    }
    return { slug: product.slug, removedKey: operation === "remove" ? selected.storageKey : null };
  }).then(async result => {
    if (result.removedKey) {
      try { await storage.remove(result.removedKey); } catch { logEvent("error", "orphan_product_image_cleanup_failed"); }
    }
    return result;
  });
}

