"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/shared/product-card";
import { useDemoState } from "@/hooks/use-demo-state";
import { resolveRecentlyViewedProducts, selectRecentlyViewedProductIds } from "@/services/recently-viewed";
import { selectActiveAccount, selectHydrationReady } from "@/services/demo-state-store";
import type { ProductCardData } from "@/types/product";

export function RecentlyViewedSection() {
  const account = useDemoState(selectActiveAccount);
  const hydrationReady = useDemoState(selectHydrationReady);
  const snapshot = useDemoState((state) => state.snapshot);
  const ids = account?.role === "customer" && account.customerId
    ? selectRecentlyViewedProductIds(snapshot, account.id)
    : [];
  const [resolved, setResolved] = useState<{ key: string; status: "ready" | "error"; items: ProductCardData[] } | null>(null);
  const idsKey = ids.join("|");

  useEffect(() => {
    let current = true;
    if (!hydrationReady || account?.role !== "customer" || !account.customerId) return () => { current = false; };
    const productIds = idsKey ? idsKey.split("|") : [];
    resolveRecentlyViewedProducts(productIds).then((products) => {
      if (!current) return;
      setResolved({ key: idsKey, items: products, status: "ready" });
    }).catch(() => {
      if (current) setResolved({ key: idsKey, items: [], status: "error" });
    });
    return () => { current = false; };
  }, [account?.customerId, account?.id, account?.role, hydrationReady, idsKey]);

  if (!hydrationReady || account?.role !== "customer" || !account.customerId) return null;
  const isLoading = !resolved || resolved.key !== idsKey;
  const items = resolved?.key === idsKey ? resolved.items : [];
  const status = isLoading ? "loading" : resolved.status;

  return (
    <section aria-labelledby="recently-viewed-title" className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="recently-viewed-title" className="font-head text-2xl font-bold text-ink sm:text-3xl">Recently viewed</h2>
          <p className="mt-1 text-sm text-mute">Pick up where you left off.</p>
        </div>
        {items.length > 0 && <Link href="/products" className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-brand-strong hover:underline">Browse products <span aria-hidden="true" className="ml-1">→</span></Link>}
      </div>
      {status === "loading" ? (
        <div aria-label="Loading recently viewed products" aria-busy="true" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-5">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton aspect-[4/5] rounded-2xl" />)}
        </div>
      ) : status === "error" ? (
        <p className="card p-5 text-sm text-mute" role="status">Recently viewed products couldn’t be loaded. Refresh the page to try again.</p>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-5">
          {items.map((product) => <ProductCard key={product.id} product={product} showAvailability />)}
        </div>
      ) : (
        <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-mute">Products you view will appear here for an easy return.</p>
          <Link href="/products" className="btn btn-outline btn-sm">Browse products</Link>
        </div>
      )}
    </section>
  );
}
