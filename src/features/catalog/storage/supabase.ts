import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createHash } from "node:crypto";
import { maxImageBytes, MediaError } from "./image-file";

export interface ImageStorage {
  upload(key: string, bytes: Uint8Array): Promise<void>;
  exists(key: string, contentHash?: string | null): Promise<boolean>;
  remove(key: string): Promise<void>;
}
export async function getImageStorage(): Promise<ImageStorage> {
  const client = await createSupabaseServerClient();
  const bucket = client.storage.from("products");
  return {
    async upload(key, bytes) {
      const { error } = await bucket.upload(key, bytes, { contentType: "image/webp", upsert: false, cacheControl: "3600" });
      if (error) throw new MediaError("Photo upload failed. Check the products bucket and admin Storage policy.");
    },
    async exists(key, contentHash) {
      const { data, error } = await bucket.info(key);
      if (error || data?.contentType !== "image/webp" || typeof data.size !== "number" || data.size < 1 || data.size > maxImageBytes) return false;
      if (!contentHash) return true;
      const downloaded = await bucket.download(key, {}, { cache: "no-store" });
      if (downloaded.error || downloaded.data.size !== data.size) return false;
      return createHash("sha256").update(Buffer.from(await downloaded.data.arrayBuffer())).digest("hex") === contentHash;
    },
    async remove(key) {
      const { error } = await bucket.remove([key]);
      if (error) throw new MediaError("Photo removal failed. Retry after checking Storage access.");
    },
  };
}
