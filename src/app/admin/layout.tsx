export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell locale={await getLocale()}><div className="container admin-area">{children}</div></StoreShell>;
}
import { StoreShell } from "@/components/layout/store-shell";
import { getLocale } from "@/i18n/server";
