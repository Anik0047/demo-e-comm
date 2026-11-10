"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { toggleWishlistProduct } from "@/services/demo-wishlist";
import { demoStateStore, selectActiveAccount, selectHydrationReady } from "@/services/demo-state-store";

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
  const [feedback, setFeedback] = useState<{ kind: "status" | "error"; message: string } | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackVersion = useRef(0);

  function showFeedback(next: { kind: "status" | "error"; message: string }) {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    const version = ++feedbackVersion.current;
    setFeedback(next);
    dismissTimer.current = setTimeout(() => {
      if (feedbackVersion.current === version) setFeedback(null);
      dismissTimer.current = null;
    }, 3000);
  }

  useEffect(() => () => {
    feedbackVersion.current += 1;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  async function handleToggle() {
    if (!ready || isUpdating) return;
    if (!isCustomer) {
      showFeedback({ kind: "status", message: "Switch to a customer demo account to save products to your wishlist." });
      return;
    }

    setIsUpdating(true);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = null;
    setFeedback(null);
    try {
      const result = await toggleWishlistProduct(demoStateStore, productId);
      if (!result.ok) {
        showFeedback({ kind: "error", message: "Your wishlist is not ready. Please try again." });
      } else if (!result.result.ok) {
        showFeedback({ kind: "error", message: result.result.reason === "product_unavailable" || result.result.reason === "product_not_found"
          ? "This product is unavailable and can’t be added to your wishlist."
          : "Switch to a customer demo account to save products to your wishlist." });
      } else if (!result.persisted) {
        showFeedback({ kind: "error", message: "Your wishlist could not be saved. Please try again." });
      } else {
        showFeedback({ kind: "status", message: result.result.changed
          ? `${productName} ${isWishlisted ? "removed from" : "added to"} your wishlist.`
          : `${productName} is already in your wishlist.` });
      }
    } catch {
      showFeedback({ kind: "error", message: "Your wishlist could not be updated. Please try again." });
    } finally {
      setIsUpdating(false);
    }
  }

  const guidanceId = `wishlist-guidance-${productId}`;
  return (
    <div className={className}>
      <button
        type="button"
        className={`relative after:absolute after:-inset-1 ${showText ? "flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-bold" : "grid size-10 place-items-center rounded-full"} border border-line bg-white text-ink transition-colors hover:border-sale hover:text-sale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:text-mute ${isWishlisted ? "border-sale text-sale" : ""}`}
        aria-label={`${isWishlisted ? "Remove" : "Add"} ${productName} ${isWishlisted ? "from" : "to"} wishlist`}
        aria-pressed={isWishlisted}
        aria-describedby={showAccountGuidance && ready && !isCustomer ? guidanceId : undefined}
        disabled={!ready || isUpdating || !isCustomer}
        onClick={() => void handleToggle()}
      >
        <Heart aria-hidden="true" className="size-5" fill={isWishlisted ? "currentColor" : "none"} />
        {showText && <span>{isWishlisted ? "Remove from wishlist" : "Add to wishlist"}</span>}
        <span className="sr-only">{isWishlisted ? "Wishlisted" : "Not wishlisted"}</span>
      </button>
      {showAccountGuidance && ready && !isCustomer && !compact && !feedback && (
        <p id={guidanceId} className={compact ? "absolute right-0 top-full mt-2 w-52 rounded-lg border border-line bg-white p-2 text-sm text-mute shadow-lg" : "mt-2 text-sm text-mute"}>Switch to a customer demo account to save products to your wishlist.</p>
      )}
      {feedback && (
        <p role={feedback.kind === "error" ? "alert" : "status"} className={`${compact ? "absolute right-0 top-full mt-2 w-52 rounded-lg border border-line bg-white p-2 shadow-lg" : "mt-2"} text-sm ${feedback.kind === "error" ? "text-sale-strong" : "text-brand-strong"}`}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}
