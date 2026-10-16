"use client";
import { useActionState } from "react";
import { retryOrderAlertAction } from "./order-actions";
export function RetryNotification({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(retryOrderAlertAction.bind(null, orderId), { message: "" });
  return <form action={action}><button className="button button-dark" disabled={pending}>Retry failed owner alert</button><p role="status">{state.message}</p></form>;
}
