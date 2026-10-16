"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/auth";
import { getImageStorage } from "@/features/catalog/storage/supabase";
import { MediaError, normalizeProductImage } from "@/features/catalog/storage/image-file";
import { changeProductImage, imageAltInput, uploadProductImage } from "./images";
import { logEvent } from "@/lib/logger";

export type ImageState = { message: string };
function refresh(productId: string) {
  revalidatePath(`/admin/products/${productId}`); revalidatePath("/admin/products");
  revalidatePath("/", "layout"); revalidatePath("/[locale]/products/[slug]", "page");
}
function message(error: unknown) {
  if (error instanceof MediaError) return error.message;
  logEvent("error", "product_media_operation_failed");
  return "Unable to save the photo. Check Storage configuration and retry.";
}
export async function uploadImageAction(productId: string, _state: ImageState, form: FormData): Promise<ImageState> {
  void _state;
  const admin = await requireAdmin();
  if (!z.uuid().safeParse(productId).success) return { message: "Invalid product." };
  const alt = imageAltInput.safeParse({ altEn: form.get("altEn"), altBn: form.get("altBn") });
  if (!alt.success) return { message: "Add English alt text (up to 200 characters). Bangla is optional." };
  const file = form.get("file");
  if (!(file instanceof File)) return { message: "Choose a JPEG, PNG or WebP photo." };
  try {
    const bytes = await normalizeProductImage(file);
    await uploadProductImage(getDb(), await getImageStorage(), productId, bytes, alt.data, admin.id);
    refresh(productId); return { message: "Photo uploaded and verified." };
  } catch (error) { return { message: message(error) }; }
}
export async function changeImageAction(productId: string, imageId: string, _state: ImageState, form: FormData): Promise<ImageState> {
  void _state;
  const admin = await requireAdmin();
  if (!z.uuid().safeParse(productId).success || !z.uuid().safeParse(imageId).success) return { message: "Invalid image." };
  const operation = z.enum(["primary", "remove", "up", "down"]).safeParse(form.get("operation"));
  if (!operation.success) return { message: "Choose a valid image operation." };
  try {
    await changeProductImage(getDb(), await getImageStorage(), productId, imageId, operation.data, admin.id);
    refresh(productId); return { message: operation.data === "remove" ? "Photo removed. Removing a published primary photo unpublishes the product." : "Photo updated." };
  } catch (error) { return { message: message(error) }; }
}
