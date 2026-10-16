"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminIdentity } from "./auth";
import { isAdminMember } from "./membership";
import { authenticatorCode, recoveryEmail, recoveryInput } from "./account-domain";
import { allowRequest, checkoutRateKey } from "../checkout/abuse";
import { completeOwnerRecovery } from "./account-service";
import { siteOrigin } from "@/lib/site-url";

export type AccountState = { message: string; factorId?: string; qrCode?: string };
async function allowAccountRequest(scope: string, max: number) {
  const request = new Request("http://localhost", { headers: await headers() });
  return allowRequest(scope, checkoutRateKey(request), max, 600000);
}
export async function requestRecovery(_state: AccountState, form: FormData): Promise<AccountState> {
  const generic = "If recovery is available for that address, a recovery code will be sent. Use it with your authenticator code if MFA is enrolled.";
  const email = recoveryEmail.safeParse(form.get("email"));
  if (!email.success) return { message: "Enter a valid email address." };
  try {
    if (!await allowAccountRequest("admin-recovery", 5)) return { message: "Too many requests. Try again later." };
    if (siteOrigin()) await (await createSupabaseServerClient()).auth.resetPasswordForEmail(email.data);
  } catch { /* Same response prevents account/provider enumeration; never log email/codes. */ }
  return { message: generic };
}
export async function finishRecovery(_state: AccountState, form: FormData): Promise<AccountState> {
  const input = recoveryInput.safeParse(Object.fromEntries(["email", "token", "password", "confirm", "mfaCode"].map(key => [key, form.get(key) ?? ""])));
  if (!input.success) return { message: "Enter the email, six-digit recovery code, matching passwords of at least 12 characters and your MFA code if enrolled." };
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null;
  try {
    if (!await allowAccountRequest("admin-recovery-verify", 10)) return { message: "Too many attempts. Try again later." };
    supabase = await createSupabaseServerClient();
    const result = await completeOwnerRecovery(supabase.auth, input.data, isAdminMember);
    if (!result.revoked) return { message: "Password changed, but session revocation needs owner review before continuing." };
    return { message: "Password changed and sessions revoked. Sign in again, then verify your authenticator." };
  } catch {
    if (supabase) await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return { message: "Recovery could not be completed. Request a fresh email code and use your authenticator code if enrolled. Lost authenticators require owner-controlled Supabase recovery." };
  }
}
export async function enrollAuthenticator(_state: AccountState): Promise<AccountState> {
  void _state;
  const { supabase } = await requireAdminIdentity();
  if (!await allowAccountRequest("admin-mfa-enroll", 5)) return { message: "Too many attempts. Try again later." };
  const factors = await supabase.auth.mfa.listFactors();
  if (factors.error) return { message: "Authenticator setup unavailable." };
  if (factors.data.all.some(factor => factor.status === "verified")) return { message: "An authenticator is already enrolled. Verify it below." };
  // Clean abandoned unverified enrollments before retry; never remove a verified factor.
  for (const factor of factors.data.all.filter(factor => factor.factor_type === "totp" && factor.status !== "verified")) {
    if ((await supabase.auth.mfa.unenroll({ factorId: factor.id })).error) return { message: "Review abandoned authenticator setup in Supabase." };
  }
  const result = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Monechai owner" });
  if (result.error) return { message: "Authenticator setup unavailable." };
  return { message: "Scan this private QR code with your authenticator, then enter its six-digit code.", factorId: result.data.id, qrCode: result.data.totp.qr_code };
}
export async function verifyAuthenticator(_state: AccountState, form: FormData): Promise<AccountState> {
  const { supabase } = await requireAdminIdentity();
  const code = authenticatorCode.safeParse(form.get("code"));
  if (!code.success) return { message: "Enter the six-digit authenticator code." };
  if (!await allowAccountRequest("admin-mfa-verify", 10)) return { message: "Too many attempts. Try again later." };
  const factors = await supabase.auth.mfa.listFactors();
  if (factors.error) return { message: "Verification unavailable." };
  const factor = factors.data.all.find(candidate => candidate.factor_type === "totp" && candidate.id === form.get("factorId"));
  if (!factor) return { message: "Choose your own enrolled authenticator." };
  if ((await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.data })).error) return { message: "Code was not accepted. Try a current code." };
  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error || assurance.data?.currentLevel !== "aal2") return { message: "Second-factor verification has not completed." };
  redirect("/admin");
}
