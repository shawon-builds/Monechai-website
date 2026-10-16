"use client";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { AdminIcon } from "@/components/admin/admin-icon";
import { changeImageAction, uploadImageAction } from "./image-actions";
import { productImageUrl } from "@/features/catalog/images";

type Row = { id: string; storageKey: string | null; altEn: string; isPrimary: boolean };
export function ImageUploadForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(uploadImageAction.bind(null, productId), { message: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <form action={action} onReset={() => { setPreview(null); setFileError(""); }} className="admin-card admin-form admin-photo-upload">
    <div className="admin-upload-choice"><div className="admin-upload-preview">{preview ? <Image src={preview} alt="Selected photo preview" width={180} height={180} unoptimized /> : <AdminIcon name="photo" width="42" height="42" />}</div><div><h3>Upload product photo</h3><p>Choose a photo from your device. JPEG, PNG or WebP, up to 5 MB each. Up to 10 photos per product.</p>
    <label>Photo<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required aria-describedby="photo-file-help" onChange={event => {
      const file = event.currentTarget.files?.[0];
      setPreview(null); setFileError("");
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
        event.currentTarget.value = ""; setFileError("Choose a JPEG, PNG or WebP file no larger than 5 MB."); return;
      }
      setPreview(URL.createObjectURL(file));
    }} /></label><small id="photo-file-help">Photos are checked and optimized before saving.</small></div></div>
    {fileError && <p role="alert" className="checkout-error">{fileError}</p>}
    <div className="admin-form-grid">
    <label>English description of the photo<input name="altEn" required maxLength={200} /></label>
    <label>Bangla description (optional)<input name="altBn" maxLength={200} /></label>
    </div><small>Describe what is in the photo so customers using a screen reader can understand it.</small>
    <div className="admin-form-footer"><button className="button button-dark" disabled={pending || Boolean(fileError)}><AdminIcon name="plus" />{pending ? "Uploading…" : "Upload photo"}</button><p role="status" aria-live="polite">{state.message}</p></div>
  </form>;
}
export function ImageControls({ productId, image }: { productId: string; image: Row }) {
  const [state, action, pending] = useActionState(changeImageAction.bind(null, productId, image.id), { message: "" });
  const src = productImageUrl(image.storageKey);
  return <form action={action} className="admin-card admin-form admin-photo-item">
    {src && <Image src={src} alt={image.altEn} width={160} height={160} />}
    <p>{image.altEn}</p>{image.isPrimary && <span className="admin-status is-published">Cover photo</span>}
    <div className="admin-image-buttons"><button name="operation" value="primary" disabled={pending || image.isPrimary}>Set primary</button>
      <button name="operation" value="up" disabled={pending}>Move earlier</button><button name="operation" value="down" disabled={pending}>Move later</button>
      <button name="operation" value="remove" disabled={pending}>Remove photo</button></div>
    <p role="status">{state.message}</p>
  </form>;
}
