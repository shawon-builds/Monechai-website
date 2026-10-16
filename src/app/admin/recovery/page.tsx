import Link from "next/link";
import { RecoveryForms } from "@/features/admin/account-forms";
export default function RecoveryPage() {
  return <section className="admin-panel"><h1>Recover owner access</h1><p>Use your owner email recovery code and existing authenticator. This does not create a customer account.</p>
    <RecoveryForms /><Link href="/admin/login">Back to sign in</Link>
  </section>;
}
