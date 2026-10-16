import { getActivePolicies } from "@/features/admin/policies";
import { PolicyForm } from "@/features/admin/policy-form";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/auth";
import { getSettings } from "@/features/admin/settings";
import { DeliveryAreaForm, SiteSettingsForm, ZoneForm } from "@/features/admin/settings-forms";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const { settings, zones, areas } = await getSettings(getDb());
  if (!settings) throw new Error("Missing site settings row; run database migrations.");
  return <section aria-label="Admin" className="admin-catalog">
    <div className="admin-page-heading"><div><p className="admin-kicker">How your store runs</p><h1>Store settings</h1><p>Manage contact details, store policies, and delivery.</p></div></div>
    <nav className="admin-section-tabs" aria-label="Settings sections"><a href="#contact">Contact details</a><a href="#policies">Store policies</a><a href="#delivery">Delivery fees</a><a href="#coverage">Delivery coverage</a></nav>
    <section id="contact">
    <SiteSettingsForm settings={settings} />
    </section><section id="policies">
    <PolicyForm policies={await getActivePolicies(getDb())} />
    </section><section id="delivery">
    <h2>Delivery fees</h2><p>Changes apply to new checkouts only. Never replace verified rates with guesses; past orders retain their snapshots.</p>
    <ZoneForm code="inside-dhaka" zone={zones.find((z) => z.code === "inside-dhaka")} />
    <ZoneForm code="outside-dhaka" zone={zones.find((z) => z.code === "outside-dhaka")} />
    </section><section id="coverage">
    <h2>Bangladesh delivery coverage</h2><p>Map approved areas/districts to your actual delivery fees. Add nationwide coverage or district-specific areas as appropriate for your courier; no rates or boundaries are assumed.</p>
    <DeliveryAreaForm />{areas.map((area) => <DeliveryAreaForm key={area.code} area={area} />)}
    </section>
  </section>;
}
