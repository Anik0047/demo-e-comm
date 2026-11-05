import { SlidersHorizontal } from "lucide-react";
import { CATALOG_SORTS } from "@/types/catalog";
import type { CatalogSort } from "@/types/catalog";

const labels: Record<CatalogSort, string> = { catalog: "Recommended", "price-asc": "Price: low to high", "price-desc": "Price: high to low", newest: "New arrivals", "best-selling": "Best sellers", "top-rated": "Top rated" };
interface ListingToolbarProps { sort: CatalogSort; count: string; onSort: (sort: CatalogSort) => void; onOpenFilters: () => void }
export function ListingToolbar({ sort, count, onSort, onOpenFilters }: ListingToolbarProps) {
  return <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3">
    <button type="button" className="btn btn-outline btn-md lg:hidden" onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); onOpenFilters(); }}><SlidersHorizontal className="size-4" aria-hidden="true" />Filters</button>
    <p className="order-last w-full text-sm text-mute lg:order-first lg:w-auto lg:mr-auto">{count}</p>
    <label className="flex min-w-0 flex-1 items-center gap-2 text-sm lg:flex-none"><span className="sr-only sm:not-sr-only">Sort by</span>
      <select className="input w-full min-w-0 lg:w-auto" value={sort} onChange={(event) => onSort(event.target.value as CatalogSort)}>{CATALOG_SORTS.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select>
    </label>
  </div>;
}
