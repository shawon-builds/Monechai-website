"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { withAdminMutation } from "@/features/admin/mutation-history";
import { requireAdmin } from "./auth";
import { deliveryAreaInput, saveDeliveryArea, saveSettings, saveZone, settingsInput, zoneInput } from "./settings";

export type SettingsState = { message: string };
export async function saveSettingsAction(_state: SettingsState, form: FormData): Promise<SettingsState> {
  void _state;
  const admin = await requireAdmin();
  const parsed = settingsInput.safeParse({ storeName: form.get("storeName"), whatsappNumber: form.get("whatsappNumber"),
    hotline: form.get("hotline"), supportEmail: form.get("supportEmail"), contactAddress: form.get("contactAddress"), codEnabled: form.has("codEnabled") });
  if (!parsed.success) return { message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  await withAdminMutation(getDb(), admin.id, tx => saveSettings(tx, parsed.data));
  revalidatePath("/admin/settings"); revalidatePath("/", "layout");
  return { message: "Store settings saved." };
}
export async function saveZoneAction(_state: SettingsState, form: FormData): Promise<SettingsState> {
  void _state;
  const admin = await requireAdmin();
  const parsed = zoneInput.safeParse({ code: form.get("code"), feeMinor: form.get("feeMinor"), freeAboveMinor: form.get("freeAboveMinor") });
  if (!parsed.success) return { message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  await withAdminMutation(getDb(), admin.id, tx => saveZone(tx, parsed.data));
  revalidatePath("/admin/settings"); revalidatePath("/", "layout");
  return { message: "Delivery fee saved. New checkouts use the new rate; existing order totals stay unchanged." };
}

export async function saveDeliveryAreaAction(_state: SettingsState, form: FormData): Promise<SettingsState> {
  void _state;
  const admin = await requireAdmin();
  const parsed = deliveryAreaInput.safeParse({ code: form.get("code"), nameEn: form.get("nameEn"), nameBn: form.get("nameBn"), district: form.get("district"), shippingZoneCode: form.get("shippingZoneCode"), isActive: form.has("isActive") });
  if (!parsed.success) return { message: "Check the delivery area code, district and names." };
  const result = await withAdminMutation(getDb(), admin.id, tx => saveDeliveryArea(tx, parsed.data));
  if ("error" in result) return { message: result.error ?? "Unable to save delivery area." };
  revalidatePath("/admin/settings"); revalidatePath("/", "layout");
  return { message: "Delivery area saved. The server chooses its configured fee; existing orders keep their snapshot." };
}
