"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useDemoState } from "@/hooks/use-demo-state";
import { demoStateStore, selectActiveAccount, selectActiveAccountId, selectDemoSnapshot } from "@/services/demo-state-store";
import { removeWishlistProduct, selectWishlistSummary } from "@/services/demo-wishlist";

type WishlistFeedback = { kind: "success" | "error"; message: string } | null;

export function WishlistPage() {
  const snapshot = useDemoState(selectDemoSnapshot);
  const accountId = useDemoState(selectActiveAccountId);
  const account = useDemoState(selectActiveAccount);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<WishlistFeedback>(null);
  const isCustomer = account?.role === "customer" && account.customerId !== null;
  const summary = snapshot && accountId && isCustomer ? selectWishlistSummary(snapshot, accountId) : null;

  async function handleRemove(productId: string, productName: string) {
    if (!isCustomer || busyProductId) return;
    setBusyProductId(productId);
    setFeedback(null);
    try {
      const result = await removeWishlistProduct(demoStateStore, productId);
      if (!result.ok || !result.result.ok) {
        setFeedback({ kind: "error", message: `${productName} could not be removed. Please try again.` });
      } else if (!result.persisted) {
        setFeedback({ kind: "error", message: "Your wishlist change could not be saved. Please try again." });
      } else {
        setFeedback({ kind: "success", message: `${productName} removed from your wishlist.` });
      }
    } catch {
      setFeedback({ kind: "error", message: "Your wishlist could not be updated. Please try again." });
    } finally {
      setBusyProductId(null);
    }
  }

  return (
    <section aria-labelledby="wishlist-title" className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <div className="mb-6">
        <h1 id="wishlist-title">Your wishlist</h1>
        {summary && <p className="mt-1 text-sm text-mute">{summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}</p>}
      </div>

      {!snapshot || !account ? (
        <div role="status" aria-label="Loading wishlist" aria-busy="true" className="card space-y-4 p-5">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-28 w-full" />
          <p className="text-sm text-mute">Loading your wishlist…</p>
        </div>
      ) : !isCustomer ? (
        <div className="card p-6 text-center">
          <Heart aria-hidden="true" className="mx-auto size-9 text-mute" />
          <h2 className="mt-3 text-xl">Your wishlist is private</h2>
          <p className="mt-2 text-sm text-mute">Switch to a customer demo account to view a wishlist.</p>
        </div>
      ) : !summary ? (
        <p role="alert" className="card p-5 text-sm text-sale-strong">Your wishlist could not be loaded. Refresh the page and try again.</p>
      ) : summary.items.length === 0 ? (
        <div className="card p-8 text-center">
          <Heart aria-hidden="true" className="mx-auto size-9 text-mute" />
          <h2 className="mt-3 text-xl">Your wishlist is empty</h2>
          <p className="mt-2 text-sm text-mute">Save products you love and find them here later.</p>
          {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className={`mt-3 text-sm font-medium ${feedback.kind === "error" ? "text-sale-strong" : "text-brand-strong"}`}>{feedback.message}</p>}
          <Link href="/products" className="btn btn-primary btn-md mt-5">Browse products</Link>
        </div>
      ) : (
        <>
          {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className={`mb-4 text-sm font-medium ${feedback.kind === "error" ? "text-sale-strong" : "text-brand-strong"}`}>{feedback.message}</p>}
          <ul aria-label="Wishlist items" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {summary.items.map(({ productId, product, availability }) => {
              const productName = product?.name ?? "Product unavailable";
              const price = product
                ? product.hasVariants && product.variants.length > 0
                  ? Math.min(...product.variants.map(({ price: variantPrice }) => variantPrice))
                  : product.price
                : null;
              const availabilityLabel = availability === "available" ? "Available" : availability === "out_of_stock" ? "Out of stock" : "No longer available";
              return (
                <li key={productId} className="card flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  {product?.mainImage.url ? (
                    <Image src={product.mainImage.url} alt={product.mainImage.alt} width={144} height={144} className="aspect-[4/3] w-full shrink-0 rounded-lg bg-soft object-cover sm:size-32 sm:aspect-square" />
                  ) : (
                    <div aria-hidden="true" className="grid aspect-[4/3] w-full shrink-0 place-items-center rounded-lg bg-soft text-mute sm:size-32 sm:aspect-square">
                      <ShoppingBag className="size-8" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{productName}</p>
                    {price !== null && <p className="mt-2 font-head text-lg font-extrabold text-ink">{formatPrice(price)}</p>}
                    <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${availability === "available" ? "bg-brand-tint text-brand-strong" : "bg-blush text-sale-strong"}`}>
                      {availabilityLabel}{availability === "out_of_stock" ? " for purchase" : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {product && <Link href={`/products/${product.slug}`} className="btn btn-outline btn-sm">View product details</Link>}
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-sale-strong hover:bg-blush focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
                        aria-label={`Remove ${productName} from wishlist`}
                        disabled={busyProductId !== null}
                        onClick={() => void handleRemove(productId, productName)}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        {busyProductId === productId ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
