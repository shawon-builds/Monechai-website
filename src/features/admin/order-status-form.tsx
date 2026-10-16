"use client";

import { useActionState } from "react";
import { changeOrderStatusAction, recordCodPaymentAction, refundCodOrderAction, restockReturnedOrderAction, saveTrackingAction } from "./order-actions";
import type { OrderStatus } from "./orders";

export function CodPaymentForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(recordCodPaymentAction.bind(null, id), { message: "" });
  return <form action={action} className="admin-card admin-form">
    <label className="admin-check"><input type="checkbox" name="cashReceived" value="yes" required /> I confirm cash was actually received for this delivered COD order.</label>{" "}
    <button className="button button-dark" disabled={pending}>{pending ? "Recording…" : "Record COD paid"}</button>
    <p aria-live="polite">{state.message}</p>
  </form>;
}

export function OrderStatusForm({ id, next }: { id: string; next: readonly OrderStatus[] }) {
  const [state, action, pending] = useActionState(changeOrderStatusAction.bind(null, id), { message: "" });
  if (!next.length) return <p>No further status changes are available.</p>;
  return <form action={action} className="admin-form admin-card">
    <label htmlFor="next-order-status">Change order status</label>
    <select id="next-order-status" name="status" required>{next.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select>{" "}
    <button className="button button-dark" type="submit" disabled={pending}>{pending ? "Saving…" : "Save status"}</button>
    <p aria-live="polite">{state.message}</p>
  </form>;
}

export function ReturnOperations({ id, released, paid }: { id: string; released: boolean; paid: boolean }) {
  const [stockState, stockAction, stockPending] = useActionState(restockReturnedOrderAction.bind(null, id), { message: "" });
  const [refundState, refundAction, refundPending] = useActionState(refundCodOrderAction.bind(null, id), { message: "" });
  return <section className="admin-card"><h2>Received return</h2>
    {!released && <form action={stockAction}><label><input type="checkbox" name="sellable" value="yes" required /> Every returned item is received and sellable as new. Restore the reserved quantities.</label><button className="button button-dark" disabled={stockPending}>Restock received return</button><p role="status">{stockState.message}</p></form>}
    {released && <p>Inventory already released; cannot restore twice.</p>}
    {paid && <form action={refundAction}><label><input type="checkbox" name="refunded" value="yes" required /> The full COD amount has actually been returned to the customer.</label><button className="button button-dark" disabled={refundPending}>Record full COD refund</button><p role="status">{refundState.message}</p></form>}
  </section>;
}
export function TrackingForm({ id, courierName, trackingReference }: { id: string; courierName: string | null; trackingReference: string | null }) {
  const [state, action, pending] = useActionState(saveTrackingAction.bind(null, id), { message: "" });
  return <form action={action} className="admin-card admin-form"><h2>Courier reference</h2>
    <label>Courier<input name="courierName" maxLength={100} defaultValue={courierName ?? ""} /></label>
    <label>Tracking reference<input name="trackingReference" maxLength={150} defaultValue={trackingReference ?? ""} /></label>
    <button className="button button-dark" disabled={pending}>Save courier reference</button><p role="status">{state.message}</p>
  </form>;
}
