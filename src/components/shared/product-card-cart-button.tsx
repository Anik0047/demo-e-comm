"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDemoState } from "@/hooks/use-demo-state";
import { addCartItem } from "@/services/demo-cart";
import { demoStateStore, selectActiveAccount, selectHydrationReady } from "@/services/demo-state-store";
import { cn } from "@/lib/utils";

interface ProductCardCartButtonProps {
  productId: string;
  productName: string;
  productSlug: string;
  className?: string;
}

export function ProductCardCartButton({ productId, productName, productSlug, className }: ProductCardCartButtonProps) {
  const router = useRouter();
  const account = useDemoState(selectActiveAccount);
  const ready = useDemoState(selectHydrationReady);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "status" | "error"; message: string } | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  function showFeedback(kind: "status" | "error", message: string) {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setFeedback({ kind, message });
    dismissTimer.current = setTimeout(() => setFeedback(null), 3000);
  }

  async function handleAdd() {
    if (!ready || busy) return;
    if (account?.role !== "customer" || !account.customerId) {
      showFeedback("error", "Switch to a customer demo account before adding items to your cart.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const result = await addCartItem(demoStateStore, { productId, quantity: 1 });
      if (result.ok && result.result.ok) {
        showFeedback("status", `${productName} added to your cart.`);
      } else if (result.ok && !result.result.ok && result.result.reason === "variant_required") {
        router.push(`/products/${productSlug}`);
      } else if (result.ok && !result.result.ok) {
        const message = result.result.reason === "customer_required"
          ? "Switch to a customer demo account before adding items to your cart."
          : result.result.reason === "above_maximum" || result.result.reason === "below_minimum" || result.result.reason === "invalid_quantity"
            ? "This product’s order quantity does not allow a single-item addition. View the product for order options."
            : "This product is currently unavailable for purchase.";
        showFeedback("error", message);
      } else {
        showFeedback("error", result.ok ? "Your cart could not be updated. Please try again." : "Your cart is not ready. Please try again.");
      }
    } catch {
      showFeedback("error", "Your cart could not be updated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative w-full">
      <button type="button" className={cn(className)} aria-label={`Add ${productName} to cart`} disabled={!ready || busy || account?.role !== "customer" || !account.customerId} onClick={() => void handleAdd()}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        <span className="hidden sm:inline">{busy ? "Adding…" : "Add to cart"}</span>
      </button>
      {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className={cn("absolute bottom-full left-0 z-20 mb-2 w-56 rounded-lg border border-line bg-white p-2 text-sm shadow-lg", feedback.kind === "error" ? "text-sale-strong" : "text-brand-strong")}>{feedback.message}</p>}
    </div>
  );
}
