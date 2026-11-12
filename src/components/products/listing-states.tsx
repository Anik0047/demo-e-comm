import Link from "next/link";
import { SearchX } from "lucide-react";
import { buildProductsHref, serializeListingState } from "@/lib/catalog-query";
import type { ListingState, ListingUnavailable } from "@/types/catalog";

const actionClass = "inline-flex min-h-11 items-center justify-center rounded-full border border-brand px-5 text-sm font-bold text-brand-strong hover:bg-brand-tint";

export function ListingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <p role="status" className="sr-only">Loading products…</p>
      <div aria-hidden="true">
        <div className="mb-3 h-10 w-48 max-w-full rounded-lg bg-soft" />
        <div className="mb-6 h-5 w-40 max-w-full rounded-lg bg-soft" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="min-w-0 overflow-hidden rounded-2xl border border-line">
              <div className="aspect-square bg-soft" />
              <div className="space-y-3 p-2 md:p-3">
                <div className="h-4 w-2/3 rounded bg-soft" />
                <div className="h-10 rounded bg-soft" />
                <div className="h-4 w-1/2 rounded bg-soft" />
                <div className="h-6 w-2/3 rounded bg-soft" />
                <div className="h-9 rounded-full bg-soft" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListingEmpty({ state, basePath = "/products", emptyStore = false }: { state: ListingState; basePath?: string; emptyStore?: boolean }) {
  const retained = new URLSearchParams(serializeListingState({ ...state, search: undefined, page: 1 }));
  return (
    <div className="rounded-2xl border border-line bg-canvas p-6 sm:p-8">
      <SearchX className="mb-4 size-6 text-mute" aria-hidden="true" />
      <h2 className="text-xl font-bold">{emptyStore ? "No products in this store yet" : "No products found"}</h2>
      <p className="mt-2 text-sm text-mute">{emptyStore ? "Browse the marketplace while this store adds to its catalog." : "Try another search or clear your filters to browse more products."}</p>
      {emptyStore && <Link href="/products" className={`${actionClass} mt-4`}>Browse all products</Link>}
      <form action={basePath} method="get" className="mt-6 max-w-lg">
        {Array.from(retained.entries()).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
        <label htmlFor="empty-search" className="mb-2 block text-sm font-bold">Edit search</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="empty-search" type="search" name="search" defaultValue={state.search ?? ""} className="min-h-11 min-w-0 flex-1 rounded-full border border-line px-4 text-base" />
          <button type="submit" className={actionClass}>Search</button>
        </div>
      </form>
      <Link href={buildProductsHref({ sort: state.sort, page: 1 }, basePath)} className={`${actionClass} mt-4`}>Clear filters</Link>
    </div>
  );
}

export function ListingUnavailableState({ result }: { result: ListingUnavailable }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-6 sm:p-8">
      <h2 className="text-xl font-bold">Products are unavailable</h2>
      <p role="status" className="mt-2 text-sm text-mute">We couldn’t load products. Your selections are saved. Please try again.</p>
      {/* A full navigation retries the current selection without cached result reuse. */}
      <a href={result.href} className={`${actionClass} mt-4`}>Try again</a>
    </div>
  );
}
