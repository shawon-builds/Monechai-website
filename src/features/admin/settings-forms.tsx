"use client";

import { useActionState } from "react";
import { saveDeliveryAreaAction, saveSettingsAction, saveZoneAction } from "./settings-actions";
import type { deliveryAreas, siteSettings, shippingZones } from "@/db/schema";

type Settings = typeof siteSettings.$inferSelect;
type Zone = typeof shippingZones.$inferSelect;
export function SiteSettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, { message: "" });
  return <form action={action} className="admin-card checkout-form">
    <h2>Store and contact</h2>
    <label>Store name<input name="storeName" defaultValue={settings.storeName} required maxLength={120} /></label>
    <label>WhatsApp (international digits without +)<input name="whatsappNumber" defaultValue={settings.whatsappNumber ?? ""} pattern="[1-9][0-9]{7,14}" placeholder="8801…" /></label>
    <label>Hotline (optional)<input name="hotline" defaultValue={settings.hotline ?? ""} maxLength={40} /></label>
    <label>Support email (optional)<input type="email" name="supportEmail" defaultValue={settings.supportEmail ?? ""} /></label>
    <label>Contact address (optional)<textarea name="contactAddress" defaultValue={settings.contactAddress ?? ""} maxLength={500} /></label>
    <label><input type="checkbox" name="codEnabled" defaultChecked={settings.codEnabled} /> Accept Cash on Delivery orders</label>
    <p>Only COD is implemented. Disabling it stops new orders; retries of successful orders remain retrievable.</p>
    <button className="button button-dark" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button><p role="status" aria-live="polite">{state.message}</p>
  </form>;
}
export function ZoneForm({ code, zone }: { code: "inside-dhaka" | "outside-dhaka"; zone?: Zone }) {
  const [state, action, pending] = useActionState(saveZoneAction, { message: "" });
  return <form action={action} className="admin-card checkout-form">
    <h3>{code === "inside-dhaka" ? "Inside Dhaka" : "Outside Dhaka"}</h3>
    <input type="hidden" name="code" value={code} />
    <p>{zone ? "Configured" : "Not configured — checkout unavailable for this area"}. Enter only owner-approved amounts.</p>
    <label>Shipping fee (BDT)<input name="feeMinor" type="text" inputMode="decimal" defaultValue={zone ? (zone.feeMinor / 100).toFixed(2) : ""} required /></label>
    <label>Free shipping above (BDT, optional)<input name="freeAboveMinor" type="text" inputMode="decimal" defaultValue={zone?.freeAboveMinor ? (zone.freeAboveMinor / 100).toFixed(2) : ""} /></label>
    <button className="button button-dark" disabled={pending}>{pending ? "Saving…" : "Save fee"}</button><p role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function DeliveryAreaForm({ area }: { area?: typeof deliveryAreas.$inferSelect }) {
  const [state, action, pending] = useActionState(saveDeliveryAreaAction, { message: "" });
  return <form action={action} className="admin-card admin-form">
    <h3>{area ? `Edit ${area.nameEn}` : "Add approved delivery area"}</h3>
    <label>Area code<input name="code" required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" readOnly={Boolean(area)} defaultValue={area?.code} /></label>
    <label>District/coverage<input name="district" required maxLength={100} defaultValue={area?.district} /></label>
    <label>English area name<input name="nameEn" required maxLength={150} defaultValue={area?.nameEn} /></label>
    <label>Bangla area name<input name="nameBn" maxLength={150} defaultValue={area?.nameBn ?? ""} /></label>
    <label>Approved fee zone<select name="shippingZoneCode" defaultValue={area?.shippingZoneCode ?? "outside-dhaka"}><option value="inside-dhaka">Inside Dhaka</option><option value="outside-dhaka">Outside Dhaka / nationwide</option></select></label>
    <label className="admin-check"><input type="checkbox" name="isActive" defaultChecked={area?.isActive ?? true} /> Accept delivery here</label>
    <button className="button button-dark" disabled={pending}>Save area</button><p role="status">{state.message}</p>
  </form>;
}
