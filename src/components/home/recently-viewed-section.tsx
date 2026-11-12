"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/shared/product-card";
import { useDemoState } from "@/hooks/use-demo-state";
import {
  clearRecentlyViewedProducts,
  RECENTLY_VIEWED_LIMIT,
  removeRecentlyViewedProduct,
  resolveRecentlyViewedProducts,
  selectRecentlyViewedProductIds,
} from "@/services/recently-viewed";
import {
  demoStateStore,
  selectActiveAccount,
  selectDemoSnapshot,
  selectHydrationReady,
} from "@/services/demo-state-store";
import type { ProductCardData } from "@/types/product";
import { showToast } from "@/services/toast";

interface RecentlyViewedSectionProps {
  accountPage?: boolean;
}

type Feedback = { kind: "success" | "error"; message: string } | null;

export function RecentlyViewedSection({
  accountPage = false,
}: RecentlyViewedSectionProps) {
  const account = useDemoState(selectActiveAccount);
  const hydrationReady = useDemoState(selectHydrationReady);
  const snapshot = useDemoState(selectDemoSnapshot);
  const isCustomer =
    account?.role === "customer" && Boolean(account.customerId);
  const ids =
    hydrationReady && isCustomer && snapshot
      ? selectRecentlyViewedProductIds(snapshot, account.id).slice(
          0,
          RECENTLY_VIEWED_LIMIT,
        )
      : [];
  const idsKey = ids.join("|");
  const ownerKey = `${account?.id ?? ""}:${account?.customerId ?? ""}`;
  const [resolved, setResolved] = useState<{
    key: string;
    items: ProductCardData[];
    status: "ready" | "error";
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  function setFeedback(next: Feedback) {
    if (next) showToast(next.kind, next.message);
  }

  useEffect(() => {
    let current = true;
    if (!hydrationReady || !isCustomer || !account?.customerId || !snapshot)
      return () => {
        current = false;
      };
    const key = `${ownerKey}:${idsKey}`;
    const productIds = idsKey ? idsKey.split("|") : [];
    resolveRecentlyViewedProducts(productIds)
      .then((items) => {
        if (current)
          setResolved({
            key,
            items: items.slice(0, accountPage ? RECENTLY_VIEWED_LIMIT : 5),
            status: "ready",
          });
      })
      .catch(() => {
        if (current) setResolved({ key, items: [], status: "error" });
      });
    return () => {
      current = false;
    };
  }, [
    account?.customerId,
    account?.id,
    account?.role,
    accountPage,
    hydrationReady,
    idsKey,
    isCustomer,
    ownerKey,
    snapshot,
  ]);

  const resolvedKey = `${ownerKey}:${idsKey}`;
  const result = resolved?.key === resolvedKey ? resolved : null;

  async function remove(product: ProductCardData) {
    if (!account?.customerId || account.role !== "customer" || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const action = await removeRecentlyViewedProduct(
        demoStateStore,
        product.id,
        account.id,
        account.customerId,
      );
      if (!action.ok || !action.result.ok) {
        setFeedback({
          kind: "error",
          message: `${product.name} couldn’t be removed. Check the active customer account and try again.`,
        });
      } else if (!action.persisted) {
        setFeedback({
          kind: "error",
          message:
            "Your history change couldn’t be saved. Check browser storage and try again.",
        });
      } else {
        setFeedback({
          kind: "success",
          message: `${product.name} removed from recently viewed.`,
        });
      }
    } catch {
      setFeedback({
        kind: "error",
        message: "Your history couldn’t be updated. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function clearHistory() {
    if (!account?.customerId || account.role !== "customer" || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const action = await clearRecentlyViewedProducts(
        demoStateStore,
        account.id,
        account.customerId,
      );
      setConfirmClear(false);
      if (!action.ok || !action.result.ok) {
        setFeedback({
          kind: "error",
          message:
            "Your history couldn’t be cleared. Check the active customer account and try again.",
        });
      } else if (!action.persisted && action.result.changed) {
        setFeedback({
          kind: "error",
          message:
            "Your history couldn’t be saved. Check browser storage and try again.",
        });
      } else {
        setFeedback({
          kind: "success",
          message: "Your recently viewed history has been cleared.",
        });
      }
    } catch {
      setConfirmClear(false);
      setFeedback({
        kind: "error",
        message: "Your history couldn’t be cleared. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!accountPage) {
    if (
      !hydrationReady ||
      !isCustomer ||
      !result ||
      result.status !== "ready" ||
      result.items.length === 0
    )
      return null;
    return (
      <section
        aria-labelledby="recently-viewed-title"
        className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8"
      >
        <div className="mb-4 flex min-w-0 items-end justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="recently-viewed-title"
              className="font-head text-2xl font-bold text-ink sm:text-3xl"
            >
              Recently viewed
            </h2>
            <p className="mt-1 text-sm text-mute">
              Pick up where you left off.
            </p>
          </div>
          <Link
            href="/account/recently-viewed"
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-brand-strong hover:underline"
          >
            View all{" "}
            <span aria-hidden="true" className="ml-1">
              →
            </span>
          </Link>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-5">
          {result.items.slice(0, 5).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    );
  }

  if (!hydrationReady)
    return (
      <section
        aria-label="Loading recently viewed products"
        aria-busy="true"
        className="card p-5"
        role="status"
      >
        Loading your recently viewed products…
      </section>
    );
  if (!isCustomer || !account?.customerId) {
    return (
      <section className="card p-6" role="alert">
        <h2 className="font-head text-xl font-bold">
          Customer account required
        </h2>
        <p className="mt-2 text-sm text-mute">
          Switch to a customer demo account to view this history.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="recently-viewed-title" className="min-w-0">
      <header className="mb-4 flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="recently-viewed-title"
            className="font-head text-xl font-bold sm:text-2xl"
          >
            Recently viewed
          </h2>
          <p className="mt-1 text-sm text-mute">
            Your latest {RECENTLY_VIEWED_LIMIT} viewed products.
          </p>
        </div>
        {result?.items.length ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm text-sale-strong"
            disabled={busy}
            onClick={() => {
              setFeedback(null);
              setConfirmClear(true);
            }}
          >
            Clear history
          </button>
        ) : null}
      </header>
      {confirmClear && (
        <section
          className="mb-4 rounded-xl border border-line bg-soft p-4"
          role="alertdialog"
          aria-labelledby="clear-history-title"
          aria-describedby="clear-history-description"
        >
          <h3 id="clear-history-title" className="font-head font-bold text-ink">
            Clear your recently viewed history?
          </h3>
          <p id="clear-history-description" className="mt-1 text-sm text-mute">
            This removes all recently viewed products from this customer
            account.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sale btn-sm"
              disabled={busy}
              onClick={() => void clearHistory()}
            >
              {busy ? "Clearing…" : "Clear history"}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={busy}
              onClick={() => setConfirmClear(false)}
            >
              Keep history
            </button>
          </div>
        </section>
      )}
      {!result ? (
        <div className="card p-5" role="status" aria-busy="true">
          Loading your recently viewed products…
        </div>
      ) : result.status === "error" ? (
        <p className="card p-5 text-sm text-sale-strong" role="alert">
          Your recently viewed products couldn’t be loaded. Refresh the page to
          try again.
        </p>
      ) : result.items.length === 0 ? (
        <div className="card p-7 text-center sm:p-10">
          <h3 className="font-head text-lg font-bold">Your history is empty</h3>
          <p className="mt-2 text-sm text-mute">
            Products you view will appear here for an easy return.
          </p>
          <Link href="/products" className="btn btn-primary btn-md mt-5">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {result.items.slice(0, RECENTLY_VIEWED_LIMIT).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="recently-viewed"
              removeDisabled={busy}
              onRemove={() => void remove(product)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
