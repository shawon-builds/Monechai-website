import { redirect } from "next/navigation";
import { requireAdminIdentity } from "@/features/admin/auth";
import { AuthenticatorForms } from "@/features/admin/account-forms";
import { logoutAdmin } from "@/features/admin/actions";
export default async function SecurityPage() {
  const { supabase } = await requireAdminIdentity();
  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!assurance.error && assurance.data?.currentLevel === "aal2") redirect("/admin");
  const factors = await supabase.auth.mfa.listFactors();
  return <section className="admin-panel"><h1>Owner two-step verification</h1><p>Admin data and changes require an authenticator code after password sign in. Keep the enrollment QR private.</p>
    {factors.error ? <p role="alert">Authenticator verification is unavailable. Try again later.</p> : <AuthenticatorForms factors={factors.data.totp.filter(factor => factor.status === "verified")} />}
    <form action={logoutAdmin}><button className="button button-dark">Sign out</button></form>
  </section>;
}
