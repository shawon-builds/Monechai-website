import "server-only";
import sharp from "sharp";

export class MediaError extends Error {}
export const maxImageBytes = 5 * 1024 * 1024;
export function ownedImageKey(productId: string, key: string) {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return false;
  return new RegExp(`^${productId}/[0-9a-f-]{36}\\.webp$`, "i").test(key);
}
export async function normalizeProductImage(file: File) {
  if (!file.size || file.size > maxImageBytes) throw new MediaError("Use an image up to 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (!(png && file.type === "image/png" || jpeg && file.type === "image/jpeg" || webp && file.type === "image/webp")) throw new MediaError("Upload a real JPEG, PNG or WebP image.");
  try {
    const image = sharp(bytes, { limitInputPixels: 16_000_000, failOn: "error" });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || (meta.pages ?? 1) !== 1 || !["png", "jpeg", "webp"].includes(meta.format ?? "")) throw new MediaError("Invalid image");
    const normalized = await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    if (normalized.length > maxImageBytes) throw new MediaError("Image is too large");
    return normalized; // Decoder/re-encoder strips original metadata and filenames.
  } catch { throw new MediaError("This image cannot be decoded safely. Use a smaller JPEG, PNG or WebP."); }
}
