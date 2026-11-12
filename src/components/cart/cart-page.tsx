"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useDemoState } from "@/hooks/use-demo-state";
import { selectActiveAccount, selectActiveAccountId, selectDemoSnapshot, demoStateStore } from "@/services/demo-state-store";
import { clearCart, removeCartItem, selectCartSummary, updateCartItemQuantity } from "@/services/demo-cart";
import { showToast } from "@/services/toast";

const issueMessages = {
  product_unavailable: "This product is no longer available.",
  vendor_unavailable: "This seller is no longer active.",
  variant_unavailable: "This option is no longer available.",
  invalid_quantity: "This quantity cannot be ordered.",
  below_minimum: "This quantity is below the minimum order.",
  above_maximum: "This quantity is above the order limit.",
  insufficient_stock: "There isn’t enough stock for this quantity.",
} as const;

export function CartPage() {
  const snapshot = useDemoState(selectDemoSnapshot);
  const activeAccountId = useDemoState(selectActiveAccountId);
  const account = useDemoState(selectActiveAccount);
  const [busy, setBusy] = useState(false);
  const summary = useMemo(() => snapshot && activeAccountId ? selectCartSummary(snapshot, activeAccountId) : null, [snapshot, activeAccountId]);
  const isCustomer = account?.role === "customer" && account.customerId !== null;

  async function run(action: () => ReturnType<typeof clearCart>, success: string) {
    setBusy(true);
    try {
      const result = await action();
      if (!result.ok || !result.result.ok) {
        showToast("error", "Your cart could not be updated. Please try again.");
      } else {
        showToast("success", success);
      }
    } catch {
      showToast("error", "Your cart could not be updated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="cart-title" className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="cart-title">Your cart</h1>
          {summary && isCustomer && <p className="mt-1 text-sm text-mute">{summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}</p>}
        </div>
        {summary && isCustomer && summary.lines.length > 0 && <button className="btn btn-ghost btn-sm text-sale-strong" disabled={busy} onClick={() => void run(() => clearCart(demoStateStore), "Cart cleared.")}>Clear cart</button>}
      </div>

      {!snapshot || !account ? (
        <div role="status" aria-label="Loading cart" className="card space-y-4 p-5">
          <div className="skeleton h-6 w-40" /><div className="skeleton h-24 w-full" /><p className="text-sm text-mute">Loading your cart…</p>
        </div>
      ) : !isCustomer ? (
        <div className="card p-6 text-center">
          <ShoppingBag aria-hidden="true" className="mx-auto size-8 text-mute" />
          <h2 className="mt-3 text-xl">Your cart is private</h2>
          <p className="mt-2 text-sm text-mute">Switch to a customer demo account to view a cart.</p>
        </div>
      ) : !summary || summary.lines.length === 0 ? (
        <div className="card p-8 text-center">
          <ShoppingBag aria-hidden="true" className="mx-auto size-9 text-mute" />
          <h2 className="mt-3 text-xl">Your cart is empty</h2>
          <p className="mt-2 text-sm text-mute">Find something you love and add it to your cart.</p>
          <Link href="/products" className="btn btn-primary btn-md mt-5">Browse products</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ul aria-label="Cart items" className="card divide-y divide-line">
              {summary.lines.map(({ item, product, variant, unitPrice, lineTotal, maximumQuantity, available, issue }, index) => {
                const image = variant?.image ?? product?.mainImage;
                const options = product && variant ? product.options.map(({ name }) => variant.optionValues[name] ? `${name}: ${variant.optionValues[name]}` : null).filter((value): value is string => value !== null).join(" · ") : null;
                const identity = { productId: item.productId, variantId: item.variantId };
                return <li key={item.id} className={`flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center ${!available ? "bg-soft/60" : ""}`}>
                  {image?.url ? <Image src={image.url} alt={image.alt} width={96} height={96} loading={index === 0 ? "eager" : "lazy"} className="size-24 shrink-0 rounded-lg bg-soft object-cover" /> : <div aria-hidden="true" className="grid size-24 shrink-0 place-items-center rounded-lg bg-soft text-mute"><ShoppingBag className="size-7" /></div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{product?.name ?? "Product unavailable"}</p>
                    {options && <p className="mt-1 text-sm text-mute">{options}</p>}
                    {item.variantId && !variant && <p className="mt-1 text-sm text-mute">Selected option unavailable</p>}
                    {!available && issue && <p className="mt-2 text-sm font-medium text-sale-strong">Unavailable: {issueMessages[issue]}</p>}
                    {available && <p className="mt-1 text-sm text-mute">{formatPrice(unitPrice ?? 0)} each</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {available && <div role="group" aria-label={`Quantity for ${product?.name ?? "product"}`} className="flex h-11 items-center rounded-lg border border-line">
                        <button type="button" aria-label="Decrease quantity" className="grid size-10 place-items-center rounded-l-lg hover:bg-soft disabled:opacity-50" disabled={busy || item.quantity <= 1} onClick={() => void run(() => updateCartItemQuantity(demoStateStore, identity, item.quantity - 1), `${product?.name ?? "Item"} quantity updated to ${item.quantity - 1}.`)}><Minus className="size-4" /></button>
                        <span className="min-w-9 text-center text-sm font-bold">{item.quantity}</span>
                        <button type="button" aria-label="Increase quantity" aria-describedby={maximumQuantity !== null && item.quantity >= maximumQuantity ? `quantity-limit-${item.id}` : undefined} className="grid size-10 place-items-center rounded-r-lg hover:bg-soft disabled:opacity-50" disabled={busy || maximumQuantity === null || item.quantity >= maximumQuantity} onClick={() => void run(() => updateCartItemQuantity(demoStateStore, identity, item.quantity + 1), `${product?.name ?? "Item"} quantity updated to ${item.quantity + 1}.`)}><Plus className="size-4" /></button>
                      </div>}
                      {available && maximumQuantity !== null && item.quantity >= maximumQuantity && <p id={`quantity-limit-${item.id}`} role="status" className="text-xs text-mute">Maximum available quantity: {maximumQuantity}.</p>}
                      <button type="button" aria-label={`Remove ${product?.name ?? "item"} from your cart`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-sale-strong hover:bg-blush" disabled={busy} onClick={() => void run(() => removeCartItem(demoStateStore, identity), `${product?.name ?? "Item"} removed from your cart.`)}><Trash2 aria-hidden="true" className="size-4" />Remove</button>
                    </div>
                  </div>
                  <p className="shrink-0 text-right font-head font-bold">{lineTotal !== null ? formatPrice(lineTotal) : "Unavailable"}</p>
                </li>;
              })}
            </ul>
            <aside aria-label="Order summary" className="card h-fit p-5">
              <h2 className="text-xl">Order summary</h2>
              <div className="mt-4 flex justify-between gap-3 text-sm"><span className="text-mute">Subtotal ({summary.itemCount} {summary.itemCount === 1 ? "item" : "items"})</span><strong>{formatPrice(summary.subtotal)}</strong></div>
              {summary.lines.some((line) => !line.available) && <p className="mt-3 text-sm text-sale-strong">Unavailable items aren’t included in your subtotal.</p>}
              <div className="mt-4 border-t border-line pt-4">
                {summary.lines.every((line) => line.available)
                  ? <Link href="/checkout" className="btn btn-primary btn-md w-full">Continue to checkout</Link>
                  : <><p role="status" className="text-sm text-sale-strong">Update unavailable items before continuing to checkout.</p><Link href="/checkout" className="btn btn-outline btn-md mt-3 w-full">Review checkout issues</Link></>}
              </div>
              <Link href="/products" className="mt-3 flex min-h-11 items-center justify-center text-sm font-bold text-brand-strong hover:underline">Continue shopping</Link>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
