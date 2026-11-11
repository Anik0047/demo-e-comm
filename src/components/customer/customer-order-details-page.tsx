"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, PackageCheck } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { CustomerOrderActions } from "@/components/customer/customer-order-actions";
import { formatPrice } from "@/lib/utils";
import { getCustomerOrderDetails } from "@/services/customer-order-details";
import { getOrderStatusLabel, getPaymentMethodLabel } from "@/services/customer-order-history";
import { selectActiveCustomerId, selectDemoSnapshot, selectHydrationReady } from "@/services/demo-state-store";
import type { DemoOrderStatus } from "@/types/demo-state";

interface CustomerOrderDetailsPageProps {
  orderId: string;
}

const statusClasses: Record<DemoOrderStatus, string> = {
  placed: "badge badge-warning",
  processing: "badge badge-info",
  shipped: "badge badge-info",
  delivered: "badge badge-brand",
  cancelled: "badge badge-danger",
  returned: "badge badge-danger",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "Date unavailable";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Date unavailable";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(timestamp);
}

function formatAmount(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? formatPrice(value)
    : "Amount unavailable";
}

function displayText(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : "Unavailable";
}

function formatVariant(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const optionValues = isRecord(value.optionValues)
    ? Object.entries(value.optionValues).filter((entry): entry is [string, string] => typeof entry[1] === "string")
    : [];
  const options = optionValues.map(([name, option]) => `${name}: ${option}`);
  return options.length ? options.join(" · ") : typeof value.id === "string" ? `Option ${value.id}` : null;
}

function AddressSnapshot({ value }: { value: unknown }) {
  if (!isRecord(value)) return <p className="mt-3 text-sm text-mute">The saved shipping address is unavailable.</p>;
  const addressLines = [value.streetAddress, value.area, value.district, value.division]
    .filter((line): line is string => typeof line === "string" && line.trim().length > 0);
  const postalCode = typeof value.postalCode === "string" && value.postalCode.trim() ? ` ${value.postalCode}` : "";

  return (
    <address className="mt-4 break-words not-italic">
      <p className="font-bold text-ink">{displayText(value.recipientName)}</p>
      <p className="mt-1 text-sm text-mute">{displayText(value.phone)}</p>
      <p className="mt-2 text-sm text-mute">{addressLines.length ? `${addressLines.join(", ")}${postalCode}` : "Address details unavailable"}</p>
    </address>
  );
}

export function CustomerOrderDetailsPage({ orderId }: CustomerOrderDetailsPageProps) {
  const ready = useDemoState(selectHydrationReady);
  const snapshot = useDemoState(selectDemoSnapshot);
  const customerId = useDemoState(selectActiveCustomerId);
  const details = useMemo(() => {
    if (!snapshot || !customerId) return null;
    let resolvedOrderId = orderId;
    try {
      resolvedOrderId = decodeURIComponent(orderId);
    } catch {
      resolvedOrderId = orderId;
    }
    return getCustomerOrderDetails(snapshot, customerId, resolvedOrderId);
  }, [snapshot, customerId, orderId]);

  if (!ready) {
    return (
      <section className="card space-y-4 p-5 sm:p-7" role="status" aria-label="Loading order details">
        <div className="skeleton h-7 w-48" />
        <div className="skeleton h-28 w-full rounded-xl" />
        <p className="text-sm text-mute">Loading order details…</p>
      </section>
    );
  }

  if (!details) {
    return (
      <section className="card p-6 text-center sm:p-8" aria-labelledby="order-unavailable-title">
        <PackageCheck aria-hidden="true" className="mx-auto size-10 text-mute" />
        <h2 id="order-unavailable-title" className="mt-3 font-head text-xl font-bold">Order unavailable</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-mute">This order isn’t available to the current customer account.</p>
        <Link href="/account/orders" className="btn btn-primary btn-md mt-5">Back to My Orders</Link>
      </section>
    );
  }

  const { order, groups, subtotalCheck } = details;
  const statusClass = typeof order.status === "string" && Object.hasOwn(statusClasses, order.status)
    ? statusClasses[order.status as DemoOrderStatus]
    : "badge badge-neutral";

  return (
    <article className="min-w-0 space-y-4" aria-labelledby="order-details-title">
      <Link href="/account/orders" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-brand-strong hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to My Orders
      </Link>

      <header className="card min-w-0 p-5 sm:p-7">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-strong">Order details</p>
            <h2 id="order-details-title" className="mt-1 font-head text-xl font-bold sm:text-2xl">Order summary</h2>
            <p className="mt-2 break-all font-mono text-sm font-bold text-ink">Order ID: {displayText(order.id)}</p>
            <p className="mt-1 text-sm text-mute">Placed {formatDate(order.placedAt)}</p>
          </div>
          <span className={statusClass}>{getOrderStatusLabel(order.status)}</span>
        </div>
        <dl className="mt-5 grid min-w-0 grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-xs font-bold text-mute">Payment method</dt>
            <dd className="mt-1 break-words text-sm font-bold text-ink">{getPaymentMethodLabel(order.paymentMethod)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-bold text-mute">Items subtotal</dt>
            <dd className="mt-1 font-head text-base font-bold text-ink">{formatAmount(order.subtotal)}</dd>
          </div>
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <dt className="text-xs font-bold text-mute">Captured total</dt>
            <dd className="mt-1 font-head text-base font-bold text-ink">{formatAmount(order.grandTotal)}</dd>
          </div>
        </dl>
      </header>

      <section className="card min-w-0 p-4 sm:p-5" aria-label="Order actions">
        <CustomerOrderActions order={order} allowCancel />
        <p className="mt-3 rounded-lg border border-info bg-info px-3 py-2 text-sm text-info-ink">Order notices are local demo notifications only. No email, SMS, payment, refund, or delivery updates are sent.</p>
      </section>

      <section className="card min-w-0 p-4 sm:p-6" aria-labelledby="vendor-breakdown-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="vendor-breakdown-title" className="font-head text-lg font-bold sm:text-xl">Vendor breakdown</h3>
          <span className="text-sm text-mute">{groups.length} {groups.length === 1 ? "vendor" : "vendors"}</span>
        </div>

        {groups.length === 0 ? (
          <p role="status" className="mt-4 rounded-lg bg-soft p-4 text-sm text-mute">Saved vendor and item details are unavailable for this order.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {groups.map(({ group, vendorId, vendorName, items, capturedSubtotal }) => (
              <section key={group.id} className="min-w-0 overflow-hidden rounded-xl border border-line" aria-label={`${vendorName} order items`}>
                <header className="flex min-w-0 flex-wrap items-center justify-between gap-2 bg-soft px-4 py-3">
                  <div className="min-w-0">
                    <h4 className="break-words font-bold text-ink">{vendorName}</h4>
                    <p className="mt-1 break-all font-mono text-xs text-mute">Vendor ID: {vendorId}</p>
                  </div>
                  <p className="text-sm text-mute">Group subtotal <strong className="font-head text-base text-ink">{formatAmount(capturedSubtotal)}</strong></p>
                </header>
                {items.length > 0 ? (
                  <ul className="divide-y divide-line">
                    {items.map((item) => (
                      <li key={item.id} className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                        <div className="min-w-0">
                          <p className="break-words font-bold text-ink">{displayText(item.productName)}</p>
                          {item.selectedVariant && <p className="mt-1 break-words text-sm text-mute">{formatVariant(item.selectedVariant) ?? "Variant details unavailable"}</p>}
                          <p className="mt-1 text-sm text-mute">Quantity: {typeof item.quantity === "number" && Number.isSafeInteger(item.quantity) && item.quantity > 0 ? item.quantity : "Unavailable"}</p>
                          <p className="mt-1 text-sm text-mute">Captured unit price: {formatAmount(item.unitPrice)}</p>
                        </div>
                        <p className="shrink-0 font-head font-bold text-ink">Line total {formatAmount(item.lineTotal)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p role="status" className="p-4 text-sm text-mute">Saved items are unavailable for this vendor group.</p>
                )}
              </section>
            ))}
          </div>
        )}

        {subtotalCheck.status === "verified" ? (
          <p role="status" className="mt-4 rounded-lg border border-brand-border bg-brand-tint p-3 text-sm text-brand-deep">Vendor group subtotals match the stored items subtotal.</p>
        ) : subtotalCheck.status === "mismatch" ? (
          <p role="alert" className="mt-4 rounded-lg border border-blush bg-blush p-3 text-sm text-blush-ink">Saved vendor subtotals total {formatAmount(subtotalCheck.groupSubtotalTotal)}, while the stored items subtotal is {formatAmount(subtotalCheck.parentItemsSubtotal)}. The saved values are shown as recorded.</p>
        ) : (
          <p role="status" className="mt-4 rounded-lg border border-info bg-info p-3 text-sm text-info-ink">Subtotal reconciliation is unavailable because some saved group or subtotal details are missing.</p>
        )}
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        <section className="card min-w-0 p-4 sm:p-5" aria-labelledby="shipping-snapshot-title">
          <h3 id="shipping-snapshot-title" className="flex items-center gap-2 font-head text-lg font-bold"><MapPin aria-hidden="true" className="size-5 text-brand-strong" />Shipping address at order time</h3>
          <AddressSnapshot value={order.shippingAddress} />
        </section>

        <aside className="card min-w-0 p-4 sm:p-5" aria-label="Captured order totals">
          <h3 className="font-head text-lg font-bold">Captured totals</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-mute">Items subtotal</dt><dd className="font-bold text-ink">{formatAmount(order.subtotal)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-mute">Shipping</dt><dd className="font-bold text-ink">{formatAmount(order.shippingTotal)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-mute">Discount</dt><dd className="font-bold text-ink">{formatAmount(order.discountTotal)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-line pt-3 text-base"><dt className="font-bold text-ink">Order total</dt><dd className="font-head font-bold text-ink">{formatAmount(order.grandTotal)}</dd></div>
          </dl>
        </aside>
      </div>
    </article>
  );
}
