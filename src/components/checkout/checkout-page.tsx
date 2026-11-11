"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ShoppingBag } from "lucide-react";
import { getCheckoutEligibility, readCheckoutAddressId, resolveCheckoutShippingSelection, subscribeCheckoutAddressSelection, writeCheckoutAddressId } from "@/services/checkout";
import { getPricingTime } from "@/services/effective-price";
import { placeDemoOrder } from "@/services/demo-order-placement";
import { selectActiveAccountId, selectDemoSnapshot } from "@/services/demo-state-store";
import { useDemoState } from "@/hooks/use-demo-state";
import { formatPrice } from "@/lib/utils";
import { TrustStrip } from "@/components/shared/trust-strip";
import type { TrustPoint } from "@/types/trust";

interface CheckoutPageProps {
  trustPoints: TrustPoint[];
}

const issueMessages = {
  product_unavailable: "This product is no longer available.",
  vendor_unavailable: "This seller is no longer active.",
  variant_unavailable: "This option is no longer available.",
  invalid_quantity: "This quantity cannot be ordered.",
  below_minimum: "This quantity is below the minimum order.",
  above_maximum: "This quantity is above the order limit.",
  insufficient_stock: "There isn’t enough stock for this quantity.",
} as const;

export function CheckoutPage({ trustPoints }: CheckoutPageProps) {
  const router = useRouter();
  const placementInFlight = useRef(false);
  const [placing, setPlacing] = useState(false);
  const [placementMessage, setPlacementMessage] = useState<{ kind: "error" | "status"; text: string } | null>(null);
  const snapshot = useDemoState(selectDemoSnapshot);
  const activeAccountId = useDemoState(selectActiveAccountId);
  const eligibility = useMemo(
    () => snapshot && activeAccountId ? getCheckoutEligibility(snapshot, activeAccountId, undefined, getPricingTime()) : null,
    [snapshot, activeAccountId],
  );
  const checkoutCustomer = useMemo(
    () => snapshot && activeAccountId ? resolveCheckoutShippingSelection(snapshot, activeAccountId, null).customer : null,
    [snapshot, activeAccountId],
  );
  const selectedAddressId = useSyncExternalStore(
    subscribeCheckoutAddressSelection,
    () => checkoutCustomer ? readCheckoutAddressId(checkoutCustomer.id) : null,
    () => null,
  );
  const shipping = useMemo(
    () => snapshot && activeAccountId
      ? resolveCheckoutShippingSelection(snapshot, activeAccountId, selectedAddressId)
      : { customer: null, addresses: [], address: null },
    [snapshot, activeAccountId, selectedAddressId],
  );

  function selectAddress(customerId: string, addressId: string) {
    writeCheckoutAddressId(customerId, addressId);
    setPlacementMessage(null);
  }

  async function submitOrder() {
    if (placementInFlight.current || !shipping.address) return;
    placementInFlight.current = true;
    setPlacing(true);
    setPlacementMessage(null);
    try {
      const result = await placeDemoOrder(shipping.address.id);
      if (!result.ok) {
        const messages = {
          customer_required: "Switch to a customer account before placing this order.",
          cart_empty: "Your cart is empty. Add products before placing an order.",
          cart_unavailable: "Your cart has changed or contains unavailable items. Review it and try again.",
          address_required: "Choose a valid saved shipping address before placing an order.",
          address_unavailable: "That shipping address changed. Choose a current saved address and try again.",
          id_generation_failed: "An order number couldn’t be prepared. Your cart is unchanged; please try again.",
          not_hydrated: "Checkout is still loading. Please try again in a moment.",
          invalid_snapshot: "The order couldn’t be saved. Your cart is unchanged; check browser storage and try again.",
        } as const;
        setPlacementMessage({ kind: "error", text: messages[result.reason] });
        return;
      }
      router.push(`/order-confirmation/${encodeURIComponent(result.order.id)}`);
    } catch {
      setPlacementMessage({ kind: "error", text: "The order couldn’t be placed. Your cart is unchanged; please try again." });
    } finally {
      placementInFlight.current = false;
      setPlacing(false);
    }
  }

  return (
    <section aria-labelledby="checkout-title" className="mx-auto max-w-[1280px] space-y-8 px-4 py-6 font-body md:py-8">
      <div>
        <h1 id="checkout-title">Checkout</h1>
        <p className="mt-1 text-sm text-mute">Review your items before the next checkout step.</p>
      </div>

      {!eligibility ? (
        <div role="status" aria-label="Loading checkout" className="card space-y-4 p-5">
          <div className="skeleton h-6 w-40" /><div className="skeleton h-20 w-full" /><p className="text-sm text-mute">Loading your checkout…</p>
        </div>
      ) : eligibility.status === "customer_required" ? (
        <div className="card p-6 text-center">
          <ShoppingBag aria-hidden="true" className="mx-auto size-8 text-mute" />
          <h2 className="mt-3 text-xl">Checkout is for customers</h2>
          <p className="mt-2 text-sm text-mute">Switch to a customer demo account to review a cart.</p>
          <Link href="/login" className="btn btn-primary btn-md mt-5">Switch demo account</Link>
        </div>
      ) : eligibility.status === "empty" ? (
        <div className="card p-8 text-center">
          <ShoppingBag aria-hidden="true" className="mx-auto size-9 text-mute" />
          <h2 className="mt-3 text-xl">Your cart is empty</h2>
          <p className="mt-2 text-sm text-mute">Add products to your cart to review them here.</p>
          <Link href="/products" className="btn btn-primary btn-md mt-5">Browse products</Link>
        </div>
      ) : eligibility.status === "unavailable" ? (
        <div className="card p-6">
          <h2 className="text-xl">Update your cart to continue</h2>
          <p className="mt-2 text-sm text-mute">Some items are no longer eligible for checkout. Remove or update them in your cart.</p>
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
            {eligibility.summary.lines.filter(({ available }) => !available).map(({ item, product, issue }) => (
              <li key={item.id} className="p-3">
                <p className="font-medium">{product?.name ?? "Product unavailable"}</p>
                {issue && <p className="text-sm text-sale-strong">{issueMessages[issue]}</p>}
              </li>
            ))}
          </ul>
          <Link href="/cart" className="btn btn-primary btn-md mt-5">Review your cart</Link>
        </div>
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="delivery-option-title" className="card p-4 sm:p-5">
            <h2 id="delivery-option-title" className="text-xl">Delivery option</h2>
            <label className="mt-4 flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border border-line p-4">
              <input type="radio" name="delivery-option" checked readOnly className="mt-1 size-5 shrink-0 accent-brand" aria-label="Demo delivery option" />
              <span className="min-w-0"><span className="font-bold">Demo delivery</span><span className="mt-1 block text-sm text-mute">No courier, delivery date, or shipping fee is assigned in this phase. Delivery details will be set in a later step.</span></span>
            </label>
          </section>

          <section aria-labelledby="shipping-address-title" className="card min-w-0 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="shipping-address-title" className="text-xl">Shipping address</h2>
                <p className="mt-1 text-sm text-mute">Choose where your order should be delivered.</p>
              </div>
              {shipping.customer && shipping.addresses.length > 0 && <Link href="/account/addresses?returnTo=%2Fcheckout" className="inline-flex min-h-11 items-center text-sm font-bold text-brand-strong hover:underline">Manage addresses</Link>}
            </div>
            {!shipping.customer ? (
              <p role="status" className="mt-4 text-sm text-sale-strong">Your customer account is unavailable. Switch to a customer demo account to choose a shipping address.</p>
            ) : shipping.addresses.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line p-5 text-center sm:p-6">
                <p className="font-medium">Add a saved address to continue.</p>
                <p className="mt-1 text-sm text-mute">Your checkout items will be here when you return.</p>
                <Link href="/account/addresses?returnTo=%2Fcheckout" className="btn btn-primary btn-md mt-4">Add shipping address</Link>
              </div>
            ) : (
              <fieldset className="mt-4 space-y-3">
                <legend className="sr-only">Choose a shipping address</legend>
                {shipping.addresses.map((address) => (
                  <label key={address.id} className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${shipping.address?.id === address.id ? "border-brand bg-brand-tint" : "border-line hover:bg-soft"}`}>
                    <input type="radio" name="shipping-address" value={address.id} checked={shipping.address?.id === address.id} onChange={() => { if (shipping.customer) selectAddress(shipping.customer.id, address.id); }} className="mt-1 size-5 shrink-0 accent-brand" aria-label={`Deliver to ${address.label}${address.isDefault ? ", default address" : ""}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 font-bold text-ink">{address.label}{address.isDefault && <span className="badge badge-brand">Default address</span>}</span>
                      <span className="mt-1 block break-words text-sm text-ink">{address.recipientName} · {address.phone}</span>
                      <span className="mt-1 block break-words text-sm text-mute">{address.streetAddress}, {address.area}, {address.district}, {address.division}{address.postalCode ? ` ${address.postalCode}` : ""}</span>
                    </span>
                  </label>
                ))}
                {!shipping.address && <p role="status" className="text-sm text-sale-strong">Choose a valid saved address to continue.</p>}
              </fieldset>
            )}
          </section>

          <section aria-labelledby="payment-method-title" className="card p-4 sm:p-5">
            <h2 id="payment-method-title" className="text-xl">Payment method</h2>
            <label className="mt-4 flex min-h-16 items-start gap-3 rounded-xl border border-line p-4">
              <input type="radio" name="payment-method" checked readOnly className="mt-1 size-5 shrink-0 accent-brand" aria-label="Cash on delivery" />
              <span className="min-w-0"><span className="font-bold">Cash on delivery</span><span className="mt-1 block text-sm text-mute">This demo records your choice only. No real payment or shipment is processed.</span></span>
            </label>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ul aria-label="Checkout items" className="card divide-y divide-line">
              {eligibility.summary.lines.map(({ item, product, variant, unitPrice, lineTotal }, index) => {
                const image = variant?.image ?? product?.mainImage;
                const variantSummary = product && variant
                  ? product.options.map(({ name }) => variant.optionValues[name] ? `${name}: ${variant.optionValues[name]}` : null).filter((value): value is string => value !== null).join(" · ")
                  : null;
                return (
                  <li key={item.id} className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    {image?.url ? <Image src={image.url} alt={image.alt} width={80} height={80} loading={index === 0 ? "eager" : "lazy"} className="size-20 shrink-0 rounded-lg bg-soft object-cover" /> : <div aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-lg bg-soft text-mute"><ShoppingBag className="size-6" /></div>}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink">{product?.name}</p>
                      {variantSummary && <p className="mt-1 text-sm text-mute">{variantSummary}</p>}
                      <p className="mt-1 text-sm text-mute">Quantity: {item.quantity}</p>
                      <p className="mt-1 text-sm text-mute">{formatPrice(unitPrice ?? 0)} each</p>
                    </div>
                    <p className="shrink-0 text-right font-head font-bold">{formatPrice(lineTotal ?? 0)}</p>
                  </li>
                );
              })}
            </ul>
            <aside aria-label="Order summary" className="card h-fit p-5">
              <h2 className="text-xl">Order summary</h2>
              <div className="mt-4 flex justify-between gap-3 text-sm"><span className="text-mute">Subtotal</span><strong>{formatPrice(eligibility.summary.subtotal)}</strong></div>
              <p className="mt-3 text-xs text-mute">Shipping charges, if any, aren’t calculated in this phase.</p>
              {placementMessage && <p role={placementMessage.kind === "error" ? "alert" : "status"} className={`mt-4 text-sm ${placementMessage.kind === "error" ? "text-sale-strong" : "text-brand-strong"}`}>{placementMessage.text}</p>}
              {shipping.address
                ? <button type="button" className="btn btn-primary btn-md mt-4 w-full" disabled={placing} onClick={() => void submitOrder()}>{placing ? "Placing demo order…" : "Place demo order"}</button>
                : <p role="status" className="mt-4 text-sm text-mute">Choose a valid shipping address to place your order.</p>}
              <p className="mt-2 text-center text-xs text-mute">Demo only · no real payment or shipment</p>
              <Link href="/cart" className="mt-4 flex min-h-11 items-center justify-center text-sm font-bold text-brand-strong hover:underline">Back to cart</Link>
            </aside>
          </div>
        </div>
      )}

      <section aria-labelledby="checkout-trust-title">
        <h2 id="checkout-trust-title" className="mb-4 text-xl">Shop with confidence</h2>
        <TrustStrip points={trustPoints} />
      </section>
    </section>
  );
}
