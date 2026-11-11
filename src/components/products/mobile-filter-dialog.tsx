"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { FilterFields } from "@/components/products/filter-fields";
import { transitionListingState } from "@/lib/catalog-query";
import type { ListingFilters, ListingOptions, ListingState } from "@/types/catalog";

interface MobileFilterDialogProps { state: ListingState; options: ListingOptions; onClose: () => void; onApply: (values: ListingFilters) => void; categoryLabel?: string; subcategoryScope?: string; showVendorFilter?: boolean }
export function MobileFilterDialog({ state, options, onClose, onApply, categoryLabel, subcategoryScope, showVendorFilter = true }: MobileFilterDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [filters, setFilters] = useState<ListingFilters>(state);
  const [prices, setPrices] = useState({ minPrice: String(state.minPrice ?? ""), maxPrice: String(state.maxPrice ?? "") });
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    const previous = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    const breakpoint = window.matchMedia("(min-width: 1024px)");
    const resize = () => { if (breakpoint.matches) onClose(); };
    breakpoint.addEventListener("change", resize);
    return () => {
      breakpoint.removeEventListener("change", resize);
      element?.close();
      document.body.style.overflow = previous;
    };
  }, [onClose]);
  return <dialog ref={dialog} aria-labelledby="filter-dialog-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-canvas p-0 text-ink backdrop:bg-black/40" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <form className="p-5" onSubmit={(event) => {
      event.preventDefault();
      const parsed = transitionListingState(state, { type: "price", ...prices });
      if (parsed.notices.length) { setError("Enter a valid whole-taka price range."); return; }
      onApply({ category: filters.category, subcategory: filters.subcategory, child: filters.child, vendor: filters.vendor, availability: filters.availability, promotion: filters.promotion, freeShipping: filters.freeShipping, minPrice: parsed.state.minPrice, maxPrice: parsed.state.maxPrice });
    }}>
      <div className="mb-5 flex items-center justify-between gap-3"><h2 id="filter-dialog-title" className="text-xl font-bold">Filters</h2><button type="button" aria-label="Close filters" className="grid size-11 place-items-center rounded-full hover:bg-soft" onClick={onClose}><X aria-hidden="true" className="size-5" /></button></div>
      <FilterFields values={filters} options={options} {...prices} categoryLabel={categoryLabel} subcategoryScope={subcategoryScope} showVendorFilter={showVendorFilter} onChange={(values) => setFilters((current) => ({ ...current, ...values }))} onPriceChange={(key, value) => setPrices((current) => ({ ...current, [key]: value }))} />
      {error && <p role="alert" className="mt-3 text-sm text-sale">{error}</p>}
      <div className="mt-6 flex gap-3"><button type="button" className="btn btn-outline btn-md flex-1" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary btn-md flex-1">Apply filters</button></div>
    </form>
  </dialog>;
}
