"use client";
import Image from "next/image";
import { useActionState } from "react";
import { changeImageAction, uploadImageAction } from "./image-actions";
import { productImageUrl } from "@/features/catalog/images";

type Row = { id: string; storageKey: string | null; altEn: string; isPrimary: boolean };
export function ImageUploadForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(uploadImageAction.bind(null, productId), { message: "" });
  return <form action={action} className="admin-card admin-form">
    <h3>Upload product photo</h3><p>JPEG, PNG or WebP up to 5 MB. Photos are verified and optimized before saving; up to ten photos per product.</p>
    <label>Photo<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
    <label>English description of the photo<input name="altEn" required maxLength={200} /></label>
    <label>Bangla description (optional)<input name="altBn" maxLength={200} /></label>
    <button className="button button-dark" disabled={pending}>{pending ? "Uploading…" : "Upload photo"}</button><p role="status">{state.message}</p>
  </form>;
}
export function ImageControls({ productId, image }: { productId: string; image: Row }) {
  const [state, action, pending] = useActionState(changeImageAction.bind(null, productId, image.id), { message: "" });
  const src = productImageUrl(image.storageKey);
  return <form action={action} className="admin-card admin-form">
    {src && <Image src={src} alt={image.altEn} width={160} height={160} />}
    <p>{image.altEn}{image.isPrimary ? " · Primary photo" : ""}</p>
    <div className="admin-image-buttons"><button name="operation" value="primary" disabled={pending || image.isPrimary}>Set primary</button>
      <button name="operation" value="up" disabled={pending}>Move earlier</button><button name="operation" value="down" disabled={pending}>Move later</button>
      <button name="operation" value="remove" disabled={pending}>Remove photo</button></div>
    <p role="status">{state.message}</p>
  </form>;
}
