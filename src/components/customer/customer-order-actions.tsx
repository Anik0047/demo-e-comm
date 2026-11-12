"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelCustomerDemoOrder, hideCustomerOrderFromHistory } from "@/services/customer-order-actions";
import type { DemoOrder } from "@/types/demo-state";

interface CustomerOrderActionsProps {
  order: DemoOrder;
  allowCancel?: boolean;
}

type Confirmation = "cancel" | "hide" | null;

export function CustomerOrderActions({ order, allowCancel = false }: CustomerOrderActionsProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const canCancel = allowCancel && order.status === "placed" && order.paymentMethod === "cash_on_delivery" && order.paymentStatus === "pending";

  async function confirmAction() {
    if (!confirmation || busy) return;
    setBusy(true);
    setFeedback("");
    const result = confirmation === "cancel"
      ? await cancelCustomerDemoOrder(order.id)
      : await hideCustomerOrderFromHistory(order.id);
    setBusy(false);
    setConfirmation(null);
    if (!result.ok) {
      setFeedback(result.reason === "invalid_status"
        ? "This order can no longer be cancelled."
        : result.reason === "order_unavailable"
          ? "This order is no longer available to this customer account."
        : result.reason === "already_hidden"
          ? "This order is already hidden from history."
          : "The order couldn’t be updated. Refresh the page and try again.");
      return;
    }
    if (confirmation === "cancel") {
      setFeedback("Demo order cancelled. This is a local notice only; no payment, refund, email, SMS, or delivery service was contacted.");
    } else {
      setFeedback("Order hidden from your history. Its saved order record is preserved.");
      router.replace("/account/orders");
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {canCancel && order.status !== "cancelled" && (
        <button type="button" className="btn btn-sale btn-sm" onClick={() => { setFeedback(""); setConfirmation("cancel"); }}>
          Cancel order
        </button>
      )}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setFeedback(""); setConfirmation("hide"); }}>
        Hide from history
      </button>
      {feedback && <p className="basis-full text-sm text-mute" role="status">{feedback}</p>}
      {confirmation && (
        <section className="basis-full rounded-xl border border-line bg-soft p-4" role="alertdialog" aria-labelledby={`order-${confirmation}-title`} aria-describedby={`order-${confirmation}-description`}>
          <h3 id={`order-${confirmation}-title`} className="font-head font-bold text-ink">{confirmation === "cancel" ? "Cancel this demo order?" : "Hide this order from history?"}</h3>
          <p id={`order-${confirmation}-description`} className="mt-1 text-sm text-mute">
            {confirmation === "cancel"
              ? "The order’s saved items, address, vendor groups, and totals will stay on record. This demo won’t contact a payment or delivery service."
              : "The order will disappear from your history and direct details access. Its saved order record remains available for future vendor and admin features."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sale btn-sm" onClick={confirmAction} disabled={busy}>{busy ? "Saving…" : confirmation === "cancel" ? "Confirm cancellation" : "Hide order"}</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmation(null)} disabled={busy}>Keep order</button>
          </div>
        </section>
      )}
    </div>
  );
}
