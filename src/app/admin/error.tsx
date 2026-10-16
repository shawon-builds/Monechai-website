"use client";

import Link from "next/link";

export default function AdminError({ reset }: { reset: () => void }) {
  return <section className="admin-surface admin-error"><h1>Unable to load this page</h1><p>Your workspace could not be loaded. Try again, or return to the overview.</p><div className="admin-actions"><button className="button button-dark" onClick={reset}>Try again</button><Link className="button admin-button-secondary" href="/admin">Back to overview</Link></div></section>;
}
