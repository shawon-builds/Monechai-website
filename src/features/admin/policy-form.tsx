"use client";
import { useActionState } from "react";
import type { storePolicies } from "@/db/schema/policies";
import { publishPoliciesAction } from "./policy-actions";

export function PolicyForm({ policies }: { policies: typeof storePolicies.$inferSelect | null }) {
  const [state, action, pending] = useActionState(publishPoliciesAction, { message: "" });
  return <form action={action} className="admin-card admin-form"><h2>Approved store policies</h2>
    <p>Enter your actual shipping fees/coverage/estimated times, returns/refund rules, privacy and terms. All four English policies are required before accepting new orders. Optional Bangla text falls back to English. Saving publishes a new retained revision.</p>
    {(["shipping", "returns", "privacy", "terms"] as const).map(kind => <fieldset key={kind}><legend>{kind === "returns" ? "Returns and refunds" : kind[0].toUpperCase() + kind.slice(1)}</legend>
      <label>English policy<textarea name={`${kind}En`} required minLength={20} maxLength={20000} rows={6} defaultValue={policies?.[`${kind}En`] ?? ""} /></label>
      <label>Bangla policy (optional)<textarea name={`${kind}Bn`} maxLength={20000} rows={6} defaultValue={policies?.[`${kind}Bn`] ?? ""} /></label>
    </fieldset>)}
    <button className="button button-dark" disabled={pending}>{pending ? "Publishing…" : "Publish approved policies"}</button><p role="status">{state.message}</p>
  </form>;
}
