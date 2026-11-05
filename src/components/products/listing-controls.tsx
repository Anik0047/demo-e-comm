"use client";

import { useCallback, useEffect, useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActiveFilters } from "@/components/products/active-filters";
import { FilterFields } from "@/components/products/filter-fields";
import { ListingToolbar } from "@/components/products/listing-toolbar";
import { MobileFilterDialog } from "@/components/products/mobile-filter-dialog";
import { transitionListingState } from "@/lib/catalog-query";
import type { ListingCommittedAction, ListingNotice, ListingOptions, ListingState } from "@/types/catalog";

const subscribeToHydration = () => () => {};

interface ListingControlsProps {
  state: ListingState; options: ListingOptions; href: string; rawQuery: string;
  notices: ListingNotice[]; count: string; children: ReactNode;
}
export function ListingControls({ state, options, href, rawQuery, notices, count, children }: ListingControlsProps) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [selection, setSelection] = useOptimistic(state);
  const [accepted, setAccepted] = useState(href);
  const [search, setSearch] = useState(state.search ?? "");
  const [prices, setPrices] = useState({ minPrice: String(state.minPrice ?? ""), maxPrice: String(state.maxPrice ?? "") });
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(notices);
  const [priceError, setPriceError] = useState("");
  const close = useCallback(() => setOpen(false), []);
  // Reset drafts on accepted server state, including Back/Forward restoration.
  if (accepted !== href) {
    setAccepted(href);
    setSearch(state.search ?? "");
    setPrices({ minPrice: String(state.minPrice ?? ""), maxPrice: String(state.maxPrice ?? "") });
    setOpen(false);
    setMessages(notices);
    setPriceError("");
  }
  useEffect(() => {
    const current = params.toString();
    const expected = href.split("?")[1] ?? "";
    // Only normalize the exact query that produced these server props.
    if (!pending && window.location.pathname === "/products" && new URLSearchParams(window.location.search).toString() === current && current === rawQuery && current !== expected) router.replace(href, { scroll: false });
  }, [href, rawQuery, params, pending, router]);
  function commit(action: ListingCommittedAction) {
    if (pending) return;
    const next = transitionListingState(state, action);
    if (action.type === "price" && next.notices.length) { setPriceError("Enter a valid whole-taka price range."); return; }
    setPriceError("");
    setMessages([]);
    if (!next.changed) return;
    startTransition(() => {
      setSelection(next.state);
      router.push(next.href, { scroll: false });
    });
  }
  return <>
    {messages.length > 0 && <div className="mb-4 rounded-2xl border border-line bg-soft p-4 text-sm"><ul aria-label="Listing notices">{messages.map((notice) => <li key={notice.reason}>{notice.message}</li>)}</ul><button className="mt-2 min-h-11 font-bold text-brand-strong" onClick={() => setMessages([])}>Dismiss notices</button></div>}
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[224px_minmax(0,1fr)]">
      <aside aria-label="Product filters" className="hidden min-w-0 self-start rounded-2xl border border-line bg-canvas p-4 lg:block">
        <h2 className="mb-5 text-lg font-bold">Filters</h2>
        <fieldset disabled={!hydrated || pending} className="min-w-0"><FilterFields values={selection} options={options} {...prices} onChange={(values) => commit({ type: "filters", values })} onPriceChange={(key, value) => setPrices((current) => ({ ...current, [key]: value }))} onApplyPrice={() => commit({ type: "price", ...prices })} /></fieldset>
        {priceError && <p role="alert" className="mt-3 text-sm text-sale">{priceError}</p>}
      </aside>
      <div className="min-w-0">
        <fieldset disabled={!hydrated || pending} className="min-w-0">
          <form role="search" className="mb-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); commit({ type: "search", value: search }); }}>
            <label htmlFor="listing-search" className="sr-only">Search products</label><input id="listing-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" className="input min-w-0 flex-1 basis-40 rounded-full" /><button className="btn btn-primary btn-md" type="submit">Search</button>
          </form>
          <ListingToolbar sort={selection.sort} count={count} onSort={(value) => commit({ type: "sort", value })} onOpenFilters={() => setOpen(true)} />
          <ActiveFilters state={state} options={options} onRemove={(key) => commit({ type: "remove", key })} onClear={() => commit({ type: "clear" })} />
        </fieldset>
        <p role="status" aria-live="polite" className={pending ? "mb-3 text-sm text-mute" : "sr-only"}>{pending ? "Updating products…" : `Results updated: ${count}`}</p>
        <div aria-busy={pending} inert={pending}>{children}</div>
      </div>
    </div>
    {open && <MobileFilterDialog state={state} options={options} onClose={close} onApply={(values) => { close(); commit({ type: "filters", values }); }} />}
  </>;
}
