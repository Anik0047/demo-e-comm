"use client";

import Link from "next/link";
import { CheckCircle2, MapPin, ShoppingBag } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { formatPrice } from "@/lib/utils";
import { getCustomerOrderConfirmation } from "@/services/checkout";
import { selectActiveCustomerId, selectDemoSnapshot, selectPersistenceStatus } from "@/services/demo-state-store";

interface OrderConfirmationPageProps {
  orderId: string;
}

function formatPlacementDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

export function OrderConfirmationPage({ orderId }: OrderConfirmationPageProps) {
  const snapshot = useDemoState(selectDemoSnapshot);
  const customerId = useDemoState(selectActiveCustomerId);
  const persistenceStatus = useDemoState(selectPersistenceStatus);
  let resolvedOrderId = orderId;
  try {
    resolvedOrderId = decodeURIComponent(orderId);
  } catch {
    resolvedOrderId = orderId;
  }
  const confirmation = snapshot && customerId
    ? getCustomerOrderConfirmation(snapshot, customerId, resolvedOrderId)
    : null;
  const order = confirmation?.order;

  return (
    <section aria-labelledby="confirmation-title" className="mx-auto max-w-[900px] px-4 py-6 font-body md:py-10">
      {!snapshot ? (
        <div role="status" aria-label="Loading order confirmation" className="card space-y-4 p-6">
          <div className="skeleton mx-auto size-12 rounded-full" />
          <div className="skeleton mx-auto h-6 w-48" />
          <p className="text-center text-sm text-mute">Loading your order…</p>
        </div>
      ) : !confirmation || !order ? (
        <div className="card p-8 text-center sm:p-10">
          <ShoppingBag aria-hidden="true" className="mx-auto size-9 text-mute" />
          <h1 id="confirmation-title" className="mt-3">Order not available</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-mute">This order isn’t available for the current demo account.</p>
          <Link href="/" className="btn btn-primary btn-md mt-5">Continue shopping</Link>
        </div>
      ) : (
        <div className="space-y-5">
          <header className="card p-5 text-center sm:p-8">
            <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-brand-strong" />
            <h1 id="confirmation-title" className="mt-3">Demo order placed</h1>
            <p className="mt-2 text-sm text-mute">Order number {order.orderNumber}</p>
            <dl className="mx-auto mt-5 grid max-w-xl grid-cols-1 gap-3 rounded-xl bg-soft p-4 text-left sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs font-bold text-mute">Order ID</dt>
                <dd className="mt-1 break-all font-mono text-sm text-ink">{order.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-mute">Placed on</dt>
                <dd className="mt-1 text-sm text-ink">{formatPlacementDate(order.placedAt)}</dd>
              </div>
            </dl>
          </header>

          <p role="status" className="rounded-xl border border-info bg-info p-4 text-sm text-info-ink">A local demo order notification was saved to this customer account. No email, SMS, payment, or delivery service was contacted.</p>

          <section aria-labelledby="order-items-title" className="card min-w-0 p-4 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="order-items-title" className="text-xl">Items in your order</h2>
              <span className="text-sm text-mute">{confirmation.groups.reduce((count, group) => count + group.items.length, 0)} items</span>
            </div>
            {confirmation.groups.length === 0 ? (
              <p role="status" className="mt-4 text-sm text-mute">Saved item details are unavailable for this order.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {confirmation.groups.map(({ group, vendorName, items }) => (
                  <section key={group.id} aria-label={`Items from ${vendorName}`} className="overflow-hidden rounded-xl border border-line">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-soft px-4 py-3">
                      <h3 className="text-base font-bold">{vendorName}</h3>
                      <p className="text-sm text-mute">Group subtotal <strong className="text-ink">{formatPrice(group.subtotal)}</strong></p>
                    </div>
                    {items.length > 0 ? (
                      <ul className="divide-y divide-line">
                        {items.map((item) => (
                          <li key={item.id} className="flex min-w-0 flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="font-bold text-ink">{item.productName}</p>
                              {item.selectedVariant && (
                                <p className="mt-1 break-words text-sm text-mute">
                                  {Object.entries(item.selectedVariant.optionValues).map(([name, value]) => `${name}: ${value}`).join(" · ") || `Option ${item.selectedVariant.id}`}
                                </p>
                              )}
                              <p className="mt-1 text-sm text-mute">Quantity: {item.quantity} · {formatPrice(item.unitPrice)} each</p>
                            </div>
                            <p className="shrink-0 font-head font-bold text-ink">{formatPrice(item.lineTotal)}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="p-4 text-sm text-mute">Saved item details are unavailable for this seller group.</p>
                    )}
                  </section>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <section aria-labelledby="delivery-address-title" className="card min-w-0 p-4 sm:p-5">
              <h2 id="delivery-address-title" className="flex items-center gap-2 text-xl"><MapPin aria-hidden="true" className="size-5 text-brand-strong" />Delivery address</h2>
              <address className="mt-4 break-words not-italic">
                <p className="font-bold text-ink">{order.shippingAddress.recipientName}</p>
                <p className="mt-1 text-sm text-mute">{order.shippingAddress.phone}</p>
                <p className="mt-2 text-sm text-mute">{order.shippingAddress.streetAddress}, {order.shippingAddress.area}, {order.shippingAddress.district}, {order.shippingAddress.division}{order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}</p>
              </address>
            </section>

            <aside aria-label="Order total" className="card h-fit p-4 sm:p-5">
              <h2 className="text-xl">Payment and total</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-mute">Payment method</dt><dd className="font-bold text-ink">Cash on delivery</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mute">Items subtotal</dt><dd className="font-bold text-ink">{formatPrice(order.subtotal)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mute">Shipping</dt><dd className="font-bold text-ink">{order.shippingTotal === 0 ? "Not calculated" : formatPrice(order.shippingTotal)}</dd></div>
                {order.discountTotal > 0 && <div className="flex justify-between gap-3"><dt className="text-mute">Discount</dt><dd className="font-bold text-ink">−{formatPrice(order.discountTotal)}</dd></div>}
                <div className="flex justify-between gap-3 border-t border-line pt-3 text-base"><dt className="font-bold text-ink">Order total</dt><dd className="font-head font-bold text-ink">{formatPrice(order.grandTotal)}</dd></div>
              </dl>
            </aside>
          </div>

          <div className="rounded-xl border border-info bg-info p-4 text-center">
            <p className="font-bold text-info-ink">Local demo order</p>
            <p className="mt-1 text-sm text-info-ink">This order is saved in this browser only. No real payment, courier booking, or shipment is processed.</p>
          </div>
          {persistenceStatus === "unavailable" && <p role="status" className="text-center text-sm text-mute">Browser storage is unavailable, so this order may not remain after this session.</p>}
          <Link href="/products" className="btn btn-primary btn-md w-full sm:mx-auto sm:w-auto">Continue shopping</Link>
        </div>
      )}
    </section>
  );
}
