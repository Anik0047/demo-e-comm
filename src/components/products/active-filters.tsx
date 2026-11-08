import { X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ListingFilterKey, ListingOptions, ListingState } from "@/types/catalog";
interface ActiveFiltersProps { state: ListingState; options: ListingOptions; onRemove: (key: ListingFilterKey) => void; onClear: () => void }
export function ActiveFilters({ state, options, onRemove, onClear }: ActiveFiltersProps) {
  const labels: Partial<Record<ListingFilterKey, string>> = {
    category: options.categories.find((option) => option.slug === state.category)?.name ?? state.category,
    subcategory: options.subcategories?.find((option) => option.slug === state.subcategory)?.name ?? state.subcategory,
    child: options.children?.find((option) => option.slug === state.child)?.name ?? state.child,
    vendor: options.vendors.find((option) => option.slug === state.vendor)?.name ?? state.vendor,
    search: state.search ? `Search: ${state.search}` : undefined,
    minPrice: state.minPrice === undefined ? undefined : `From ${formatPrice(state.minPrice)}`,
    maxPrice: state.maxPrice === undefined ? undefined : `Up to ${formatPrice(state.maxPrice)}`,
    availability: state.availability ? state.availability === "in-stock" ? "In stock" : "Out of stock" : undefined,
    promotion: state.promotion ? "Flash deals" : undefined,
    freeShipping: state.freeShipping ? "Free shipping" : undefined,
  };
  const keys = (Object.keys(labels) as ListingFilterKey[]).filter((key) => labels[key]);
  if (!keys.length) return null;
  return <div className="mb-4 flex flex-wrap gap-2" aria-label="Active filters">{keys.map((key) => <button key={key} type="button" aria-label={`Remove ${key} filter`} onClick={() => onRemove(key)} className="flex min-h-11 max-w-full items-center gap-2 rounded-full border border-brand-border bg-brand-tint px-3 text-left text-sm text-brand-deep"><span className="min-w-0 break-words">{labels[key]}</span><X className="size-4 shrink-0" aria-hidden="true" /></button>)}<button type="button" className="min-h-11 px-3 text-sm font-bold text-brand-strong hover:underline" onClick={onClear}>Clear filters</button></div>;
}
