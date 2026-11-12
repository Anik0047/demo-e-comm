"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { CustomerOrderActions } from "@/components/customer/customer-order-actions";
import { formatPrice } from "@/lib/utils";
import { getCustomerOrderHistory, getOrderStatusLabel, getPaymentMethodLabel } from "@/services/customer-order-history";
import { selectActiveCustomerId, selectDemoSnapshot, selectHydrationReady } from "@/services/demo-state-store";
import type { DemoOrderStatus } from "@/types/demo-state";

const statusClasses: Record<DemoOrderStatus, string> = {
  placed: "badge badge-warning",
  processing: "badge badge-info",
  shipped: "badge badge-info",
  delivered: "badge badge-brand",
  cancelled: "badge badge-danger",
  returned: "badge badge-danger",
};

function formatPlacedDate(value: unknown): string {
  if (typeof value !== "string") return "Date unavailable";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Date unavailable";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(timestamp);
}

export default function CustomerOrdersPage() {
  const ready = useDemoState(selectHydrationReady);
  const snapshot = useDemoState(selectDemoSnapshot);
  const customerId = useDemoState(selectActiveCustomerId);
  const orders = useMemo(
    () => snapshot && customerId ? getCustomerOrderHistory(snapshot, customerId) : [],
    [snapshot, customerId],
  );

  if (!ready) {
    return (
      <section className="card space-y-4 p-5 sm:p-7" role="status" aria-label="Loading your orders">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-32 w-full rounded-xl" />
        <p className="text-sm text-mute">Loading your orders…</p>
      </section>
    );
  }

  if (!snapshot || !customerId) {
    return (
      <section className="card p-6 sm:p-7" aria-labelledby="orders-error-title">
        <h2 id="orders-error-title" className="font-head text-xl font-bold">Orders aren’t available</h2>
        <p role="alert" className="mt-2 text-sm text-mute">Switch to a valid customer demo account, then try again.</p>
        <Link href="/login" className="btn btn-outline btn-md mt-5">Switch demo account</Link>
      </section>
    );
  }

  return (
    <section className="min-w-0" aria-labelledby="orders-title">
      <header className="mb-4 flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="orders-title" className="font-head text-xl font-bold sm:text-2xl">My Orders</h2>
          <p className="mt-1 text-sm text-mute">Your saved demo orders and their current status.</p>
        </div>
        {orders.length > 0 && <span className="text-sm text-mute">{orders.length} {orders.length === 1 ? "order" : "orders"}</span>}
      </header>

      {orders.length === 0 ? (
        <div className="card p-7 text-center sm:p-10">
          <PackageSearch aria-hidden="true" className="mx-auto size-10 text-mute" />
          <h3 className="mt-3 font-head text-lg font-bold">Your order history is empty</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-mute">Orders you place with this customer account will appear here.</p>
          <Link href="/products" className="btn btn-primary btn-md mt-5">Browse products <ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Your orders">
          {orders.map(({ order, itemCount, vendorCount }) => {
            const status = getOrderStatusLabel(order.status);
            const statusClass = typeof order.status === "string" && Object.hasOwn(statusClasses, order.status)
              ? statusClasses[order.status as DemoOrderStatus]
              : "badge badge-neutral";
            const total = typeof order.grandTotal === "number" && Number.isFinite(order.grandTotal) && order.grandTotal >= 0
              ? formatPrice(order.grandTotal)
              : "Total unavailable";

            return (
              <li key={order.id} className="card min-w-0 p-4 sm:p-5">
                <article className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-mute">Order ID</p>
                      <p className="mt-1 break-all font-mono text-sm font-bold text-ink">{order.id}</p>
                      <p className="mt-1 text-sm text-mute">Placed {formatPlacedDate(order.placedAt)}</p>
                    </div>
                    <span className={statusClass}>{status}</span>
                  </div>

                  <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 border-t border-line pt-4 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="min-w-0">
                      <dt className="text-xs font-bold text-mute">Items</dt>
                      <dd className="mt-1 text-sm font-bold text-ink">{itemCount}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-bold text-mute">Vendors</dt>
                      <dd className="mt-1 text-sm font-bold text-ink">{vendorCount}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-bold text-mute">Payment</dt>
                      <dd className="mt-1 break-words text-sm font-bold text-ink">{getPaymentMethodLabel(order.paymentMethod)}</dd>
                    </div>
                    <div className="min-w-0 col-span-2 sm:col-span-1">
                      <dt className="text-xs font-bold text-mute">Final demo total</dt>
                      <dd className="mt-1 font-head text-base font-bold text-ink">{total}</dd>
                      {order.discountTotal > 0 && <dd className="mt-1 text-xs text-sale-strong">{order.couponCode ?? "Discount"} · −{formatPrice(order.discountTotal)}</dd>}
                    </div>
                    <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                      <Link href={`/account/orders/${encodeURIComponent(order.id)}`} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-brand-strong hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                        View details <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                      <div className="mt-2"><CustomerOrderActions order={order} allowCancel /></div>
                    </div>
                  </dl>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
