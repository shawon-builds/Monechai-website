import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { z } from "zod";
import type { recoveryInput } from "./account-domain";

type Auth = Awaited<ReturnType<typeof createSupabaseServerClient>>["auth"];
export async function completeOwnerRecovery(auth: Pick<Auth, "verifyOtp" | "mfa" | "updateUser" | "signOut">, input: z.output<typeof recoveryInput>, isMember: (id: string) => Promise<boolean>) {
  const verified = await auth.verifyOtp({ email: input.email, token: input.token, type: "recovery" });
  if (verified.error || !verified.data.user || !await isMember(verified.data.user.id)) throw new Error("Denied recovery");
  const factors = await auth.mfa.listFactors();
  if (factors.error) throw new Error("Unavailable factors");
  const enrolled = factors.data.all.filter(factor => factor.status === "verified");
  const totp = enrolled.find(factor => factor.factor_type === "totp");
  if (enrolled.length) {
    if (!totp || !input.mfaCode) throw new Error("Second factor required");
    if ((await auth.mfa.challengeAndVerify({ factorId: totp.id, code: input.mfaCode })).error) throw new Error("Denied second factor");
    const assurance = await auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error || assurance.data?.currentLevel !== "aal2") throw new Error("Second factor incomplete");
  }
  if ((await auth.updateUser({ password: input.password })).error) throw new Error("Password update failed");
  try { return { revoked: !(await auth.signOut({ scope: "global" })).error }; }
  catch { return { revoked: false }; } // Password already changed; never claim that it failed.
}
