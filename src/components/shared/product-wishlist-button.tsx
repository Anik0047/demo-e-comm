"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { toggleWishlistProduct } from "@/services/demo-wishlist";
import { demoStateStore, selectActiveAccount, selectHydrationReady } from "@/services/demo-state-store";
import { showToast } from "@/services/toast";

interface ProductWishlistButtonProps {
  productId: string;
  productName: string;
  className?: string;
  showAccountGuidance?: boolean;
  compact?: boolean;
  showText?: boolean;
}

export function ProductWishlistButton({ productId, productName, className, showAccountGuidance = false, compact = false, showText = false }: ProductWishlistButtonProps) {
  const account = useDemoState(selectActiveAccount);
  const ready = useDemoState(selectHydrationReady);
  const isCustomer = account?.role === "customer" && account.customerId !== null;
  const isWishlisted = useDemoState((state) => state.hydrationStatus === "ready"
    && isCustomer
    && state.snapshot.data.wishlists.find(({ customerId }) => customerId === account.customerId)?.productIds.includes(productId) === true);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleToggle() {
    if (!ready || isUpdating) return;
    if (!isCustomer) {
      showToast("info", "Switch to a customer demo account to save products to your wishlist.");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await toggleWishlistProduct(demoStateStore, productId);
      if (!result.ok) {
        showToast("error", "Your wishlist is not ready. Please try again.");
      } else if (!result.result.ok) {
        showToast("error", result.result.reason === "product_unavailable" || result.result.reason === "product_not_found"
          ? "This product is unavailable and can’t be added to your wishlist."
          : "Switch to a customer demo account to save products to your wishlist.");
      } else if (!result.persisted) {
        showToast("error", "Your wishlist could not be saved. Please try again.");
      } else {
        showToast("success", result.result.changed
          ? `${productName} ${isWishlisted ? "removed from" : "added to"} your wishlist.`
          : `${productName} is already in your wishlist.`);
      }
    } catch {
      showToast("error", "Your wishlist could not be updated. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  const guidanceId = `wishlist-guidance-${productId}`;
  return (
    <div className={`group ${compact && !className ? "relative" : ""} ${className ?? ""}`}>
      <button
        type="button"
        className={`relative after:absolute after:-inset-1 ${showText ? "flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-bold" : "grid size-11 place-items-center rounded-full"} border border-line bg-white text-ink transition-colors hover:border-sale hover:text-sale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:text-mute ${isWishlisted ? "border-sale bg-blush text-sale-strong" : ""}`}
        aria-label={`${isWishlisted ? "Remove" : "Add"} ${productName} ${isWishlisted ? "from" : "to"} wishlist`}
        aria-pressed={isWishlisted}
        title={`${isWishlisted ? "Remove from" : "Add to"} wishlist`}
        aria-describedby={showAccountGuidance && ready && !isCustomer ? guidanceId : undefined}
        disabled={!ready || isUpdating}
        onClick={() => void handleToggle()}
      >
        <Heart aria-hidden="true" className="size-5" fill={isWishlisted ? "currentColor" : "none"} />
        {!showText && <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium text-ink shadow-lg group-hover:block group-focus-within:block">{isWishlisted ? "Remove from wishlist" : "Add to wishlist"}</span>}
        {showText && <span>{isWishlisted ? "Remove from wishlist" : "Add to wishlist"}</span>}
        <span className="sr-only">{isWishlisted ? "Wishlisted" : "Not wishlisted"}</span>
      </button>
      {showAccountGuidance && ready && !isCustomer && (
        <p id={guidanceId} className={compact ? "absolute left-0 top-full z-20 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-white p-3 text-sm text-mute shadow-lg" : "mt-2 text-sm text-mute"}>Switch to a customer demo account to save products to your wishlist.</p>
      )}
    </div>
  );
}
