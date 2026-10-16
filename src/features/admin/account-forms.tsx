"use client";
import { useActionState } from "react";
import Image from "next/image";
import { enrollAuthenticator, finishRecovery, requestRecovery, verifyAuthenticator, type AccountState } from "./account-actions";
const initial: AccountState = { message: "" };

export function RecoveryForms() {
  const [requestState, requestAction, requesting] = useActionState(requestRecovery, initial);
  const [state, action, pending] = useActionState(finishRecovery, initial);
  return <><form action={requestAction} className="admin-form admin-card"><h2>Request a recovery code</h2>
    <label>Owner email<input name="email" type="email" required autoComplete="email" maxLength={254} /></label>
    <button className="button button-dark" disabled={requesting}>Send recovery code</button><p role="status">{requestState.message}</p>
  </form><form action={action} className="admin-form admin-card"><h2>Set a new password</h2>
    <label>Owner email<input name="email" type="email" required autoComplete="email" maxLength={254} /></label>
    <label>Email recovery code<input name="token" required pattern="[0-9]{6}" inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></label>
    <label>Authenticator code (required if enrolled)<input name="mfaCode" pattern="[0-9]{6}" inputMode="numeric" autoComplete="off" maxLength={6} /></label>
    <label>New password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
    <label>Confirm new password<input name="confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
    <button className="button button-dark" disabled={pending}>Reset password</button><p role="status">{state.message}</p>
  </form></>;
}
export function AuthenticatorForms({ factors }: { factors: { id: string; friendly_name?: string }[] }) {
  const [enrollment, enroll, enrolling] = useActionState(enrollAuthenticator, initial);
  const [state, verify, pending] = useActionState(verifyAuthenticator, initial);
  const available = enrollment.factorId ? [...factors, { id: enrollment.factorId, friendly_name: "New authenticator" }] : factors;
  return <>{!factors.length && <form action={enroll} className="admin-form admin-card"><h2>Set up your authenticator</h2>
    <button className="button button-dark" disabled={enrolling}>Create authenticator setup</button><p role="status">{enrollment.message}</p>
    {enrollment.qrCode && <Image src={enrollment.qrCode} alt="Private authenticator enrollment QR code" width={240} height={240} unoptimized />}
  </form>}{!available.length ? <div className="admin-card admin-auth-help"><h2>Next: verify your authenticator</h2><p>Create your authenticator setup above and scan its QR code. The verification form will appear here when setup is ready.</p></div> : <form action={verify} className="admin-form admin-card"><h2>Verify authenticator</h2>
    <label>Authenticator<select name="factorId" required>{available.map(factor => <option key={factor.id} value={factor.id}>{factor.friendly_name || "Owner authenticator"}</option>)}</select></label>
    <label>Six-digit code<input name="code" required pattern="[0-9]{6}" maxLength={6} inputMode="numeric" autoComplete="one-time-code" /></label>
    <button className="button button-dark" disabled={pending || !available.length}>Verify and continue</button><p role="status">{state.message}</p>
  </form>}</>;
}
