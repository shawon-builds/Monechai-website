"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { withAdminMutation } from "@/features/admin/mutation-history";
import { requireAdmin } from "./auth";
import { policyInput, publishPolicies } from "./policies";

export async function publishPoliciesAction(_state: { message: string }, form: FormData) {
  const admin = await requireAdmin();
  const parsed = policyInput.safeParse(Object.fromEntries(["shipping", "returns", "privacy", "terms"].flatMap(kind => ["En", "Bn"].map(lang => [`${kind}${lang}`, form.get(`${kind}${lang}`)]))));
  if (!parsed.success) return { message: parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ") };
  await withAdminMutation(getDb(), admin.id, tx => publishPolicies(tx, parsed.data));
  revalidatePath("/", "layout");
  return { message: "Approved policies published as a new revision. Existing orders retain their accepted revision." };
}
