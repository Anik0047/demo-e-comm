"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import { useDemoState } from "@/hooks/use-demo-state";
import {
  selectActiveAccount,
  selectActiveAccountId,
  selectDemoSnapshot,
} from "@/services/demo-state-store";
import { selectCartSummary } from "@/services/demo-cart";
import type { DemoCartIssue } from "@/services/demo-cart";

const issueMessages: Record<Exclude<DemoCartIssue, "customer_required" | "cart_line_not_found">, string> = {
  product_unavailable: "This product is no longer available.",
  vendor_unavailable: "This seller is no longer active.",
  variant_required: "Choose an option before ordering.",
  variant_unavailable: "This option is no longer available.",
  invalid_quantity: "This quantity cannot be ordered.",
  below_minimum: "This quantity is below the minimum order.",
  above_maximum: "This quantity is above the order limit.",
  insufficient_stock: "There isn’t enough stock for this quantity.",
};

export function MiniCart() {
  const snapshot = useDemoState(selectDemoSnapshot);
  const activeAccountId = useDemoState(selectActiveAccountId);
  const activeAccount = useDemoState(selectActiveAccount);
  const summary = useMemo(
    () => snapshot && activeAccountId ? selectCartSummary(snapshot, activeAccountId) : null,
    [snapshot, activeAccountId],
  );
  const subtotal = summary?.subtotal ?? 0;
  const itemCount = summary?.itemCount ?? 0;
  const isReady = snapshot !== null && activeAccount !== null;
  const isCustomer = activeAccount?.role === "customer" && activeAccount.customerId !== null;

  return (
    <div className="relative group">
      <Link
        href="/cart"
        className="flex items-center gap-2 h-11 pl-3 pr-4 max-[389px]:pr-3 max-[359px]:pl-2.5 rounded-full bg-brand hover:bg-brand-strong text-white text-sm font-bold"
        aria-label={`Cart, ${itemCount} items, subtotal ${formatPrice(subtotal)}`}
        aria-controls="mini-cart-menu"
      >
        <span className="relative mr-1">
          <ShoppingCart aria-hidden="true" className="w-5 h-5" />
          <span className="absolute -top-2 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-white text-brand-strong text-[11px] font-bold grid place-items-center" aria-live="polite" aria-atomic="true">
            {itemCount}
          </span>
        </span>
        <span className="hidden lg:inline">{formatPrice(subtotal)}</span>
      </Link>
      <div id="mini-cart-menu" className="hidden md:group-hover:block md:group-focus-within:block absolute right-0 top-full pt-2 w-80 max-w-[calc(100vw-2rem)]">
        <section aria-label="Mini cart" className="bg-white border border-line rounded-xl p-4 shadow-lg">
          {!isReady ? (
            <p role="status" className="text-sm text-mute">Loading your cart…</p>
          ) : !isCustomer ? (
            <p className="text-sm text-mute">Switch to a customer demo account to view a cart.</p>
          ) : summary?.lines.length ? (
            <ul className="divide-y divide-line">
              {summary.lines.map(({ item, product, variant, unitPrice, lineTotal, issue }, index) => {
                const image = variant?.image ?? product?.mainImage;
                const optionSummary = product && variant
                  ? product.options
                    .map(({ name }) => variant.optionValues[name] ? `${name}: ${variant.optionValues[name]}` : null)
                    .filter((value): value is string => value !== null)
                    .join(" · ")
                  : null;

                return (
                  <li key={item.id} className={`flex min-w-0 gap-3 ${index === 0 ? "pb-3" : "py-3"}`}>
                    {image?.url ? (
                      <Image src={image.url} alt={image.alt} width={48} height={48} className="size-12 rounded-lg object-cover" />
                    ) : (
                      <div aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-lg bg-soft text-mute">
                        <ShoppingCart className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product?.name ?? "Product unavailable"}</p>
                      {optionSummary && <p className="mt-0.5 text-xs text-mute">{optionSummary}</p>}
                      <p className="mt-0.5 text-xs text-mute">Qty {item.quantity}</p>
                      {issue && <p className="mt-1 text-xs font-medium text-sale-strong">{issueMessages[issue]}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold">{lineTotal !== null ? formatPrice(lineTotal) : "Unavailable"}</p>
                      {unitPrice !== null && <p className="text-xs text-mute">{formatPrice(unitPrice)} each</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div>
              <p className="text-sm font-medium text-ink">Your cart is empty.</p>
              <Link href="/products" className="mt-1 inline-flex min-h-11 items-center text-sm font-bold text-brand-strong hover:underline">
                Browse products
              </Link>
            </div>
          )}
          {isReady && isCustomer && summary && summary.lines.length > 0 && (
            <div className="flex justify-between border-t border-line mt-3 pt-3 text-sm font-bold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          )}
          {isReady && isCustomer && summary && summary.lines.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link href="/cart" className="text-center border border-line hover:border-brand text-sm font-medium rounded-lg py-2">View cart</Link>
              <span aria-disabled="true" className="cursor-not-allowed rounded-lg bg-soft py-2 text-center text-sm font-medium text-mute">Checkout unavailable</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
