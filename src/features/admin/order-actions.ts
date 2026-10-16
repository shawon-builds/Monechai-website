"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { withAdminMutation } from "./mutation-history";
import { requireAdmin } from "./auth";
import { changeOrderStatus, orderStatus, recordCodPayment, recordCodRefund, restockReturnedOrder, saveOrderTracking, trackingInput } from "./orders";
import { retryFailedAlert } from "./notifications";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function refreshOrder(id: string) { revalidatePath("/admin"); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); }

export type OrderActionState = { message: string };
export async function retryOrderAlertAction(id: string, _state: OrderActionState): Promise<OrderActionState> {
  void _state;
  await requireAdmin();
  if (!uuid.test(id)) return { message: "Invalid order ID." };
  const rows = await retryFailedAlert(getDb(), id);
  refreshOrder(id);
  return { message: rows.length ? "Failed owner alert queued for retry." : "Only failed alerts can be retried." };
}
export async function recordCodPaymentAction(id: string, _state: OrderActionState, form: FormData): Promise<OrderActionState> {
  void _state;
  const admin = await requireAdmin();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { message: "Invalid order ID." };
  if (form.get("cashReceived") !== "yes") return { message: "Confirm that cash was received from the courier/customer." };
  const result = await recordCodPayment(getDb(), id, admin.id);
  if ("error" in result) return { message: result.error ?? "Unable to record payment." };
  revalidatePath("/admin"); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`);
  return { message: "COD cash receipt recorded." };
}

export async function changeOrderStatusAction(id: string, _state: OrderActionState, form: FormData): Promise<OrderActionState> {
  void _state;
  const admin = await requireAdmin();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { message: "Invalid order ID." };
  const to = orderStatus.safeParse(form.get("status"));
  if (!to.success) return { message: "Invalid order status." };
  const result = await changeOrderStatus(getDb(), id, to.data, admin.id);
  if ("error" in result) return { message: result.error ?? "Unable to update order." };
  revalidatePath("/admin"); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`);
  return { message: `Order moved to ${result.status.replaceAll("_", " ")}.` };
}

export async function restockReturnedOrderAction(id: string, _state: OrderActionState, form: FormData): Promise<OrderActionState> {
  void _state;
  const admin = await requireAdmin();
  if (!uuid.test(id)) return { message: "Invalid order ID." };
  if (form.get("sellable") !== "yes") return { message: "Confirm every returned item is received and sellable as new." };
  const result = await restockReturnedOrder(getDb(), id, admin.id);
  if ("error" in result) return { message: result.error ?? "Unable to restock." };
  refreshOrder(id); return { message: "Returned inventory restored once and recorded." };
}
export async function refundCodOrderAction(id: string, _state: OrderActionState, form: FormData): Promise<OrderActionState> {
  void _state;
  const admin = await requireAdmin();
  if (!uuid.test(id)) return { message: "Invalid order ID." };
  if (form.get("refunded") !== "yes") return { message: "Confirm the full COD amount was actually returned to the customer." };
  const result = await recordCodRefund(getDb(), id, admin.id);
  if ("error" in result) return { message: result.error ?? "Unable to record refund." };
  refreshOrder(id); return { message: "Full COD refund recorded. This action does not send money." };
}
export async function saveTrackingAction(id: string, _state: OrderActionState, form: FormData): Promise<OrderActionState> {
  void _state;
  const admin = await requireAdmin();
  if (!uuid.test(id)) return { message: "Invalid order ID." };
  const parsed = trackingInput.safeParse({ courierName: form.get("courierName"), trackingReference: form.get("trackingReference") });
  if (!parsed.success) return { message: "Check courier and tracking reference." };
  if (!await withAdminMutation(getDb(), admin.id, tx => saveOrderTracking(tx, id, parsed.data))) return { message: "Order not found." };
  refreshOrder(id);
  return { message: "Courier reference saved." };
}
