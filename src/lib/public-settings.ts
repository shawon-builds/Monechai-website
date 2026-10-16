import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { logEvent } from "./logger";

export const getPublicSettings = cache(async () => {
  if (!process.env.DATABASE_URL) return null;
  try {
    const [row] = await getDb().select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
    return row ?? null;
  } catch {
    logEvent("error", "public_settings_unavailable");
    return null;
  }
});
