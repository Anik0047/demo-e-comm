import { useId } from "react";
import type { ListingFilters, ListingOptions } from "@/types/catalog";

interface FilterFieldsProps {
  values: ListingFilters;
  options: ListingOptions;
  minPrice: string;
  maxPrice: string;
  onChange: (values: ListingFilters) => void;
  onPriceChange: (key: "minPrice" | "maxPrice", value: string) => void;
  onApplyPrice?: () => void;
  categoryLabel?: string;
  subcategoryScope?: string;
  showVendorFilter?: boolean;
}

export function FilterFields({ values, options, minPrice, maxPrice, onChange, onPriceChange, onApplyPrice, categoryLabel = "Category", subcategoryScope, showVendorFilter = true }: FilterFieldsProps) {
  const id = useId();
  const categories = options.subcategories ?? [];
  const children = options.children ?? [];
  const selectedSubcategory = values.subcategory ?? subcategoryScope;
  const hasHierarchy = options.subcategories !== undefined;
  const showMainCategory = hasHierarchy && !subcategoryScope && categoryLabel !== "Subcategory" && options.categories.length > 0;
  const showSubcategory = hasHierarchy && (categoryLabel === "Subcategory" || (!subcategoryScope && !!values.category));
  const filterKeys = [
    ...(showMainCategory || (!hasHierarchy && options.categories.length > 0) ? (["category"] as const) : []),
    ...(showSubcategory ? (["subcategory"] as const) : []),
    ...(children.some((option) => option.parentSlug === selectedSubcategory) ? (["child"] as const) : []),
    ...(showVendorFilter ? (["vendor"] as const) : []),
  ];
  return (
    <fieldset className="min-w-0 space-y-5">
      <legend className="sr-only">Filter products</legend>
      {filterKeys.map((key) => (
        <label key={key} className="block text-sm font-bold">
          {key === "subcategory" ? "Subcategory" : key === "child" ? "Child category" : key === "category" ? categoryLabel : "Vendor"}
          <select className="input mt-2 w-full min-w-0 font-normal" value={key === "subcategory" ? selectedSubcategory ?? "" : values[key] ?? ""} onChange={(event) => onChange(key === "subcategory" ? { subcategory: event.target.value || undefined, child: undefined } : key === "child" ? { subcategory: selectedSubcategory, child: event.target.value || undefined } : key === "category" ? { category: event.target.value || undefined, subcategory: undefined, child: undefined } : { [key]: event.target.value || undefined })}>
            <option value="">{key === "subcategory" ? "All subcategories" : key === "child" ? "All child categories" : key === "category" ? categoryLabel === "Subcategory" ? "All subcategories" : "All categories" : "All vendors"}</option>
            {(key === "subcategory" ? categories.filter((option) => !values.category || option.parentSlug === values.category) : key === "child" ? children.filter((option) => !!selectedSubcategory && option.parentSlug === selectedSubcategory) : key === "category" ? options.categories : options.vendors).map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}
          </select>
        </label>
      ))}
      <label className="block text-sm font-bold">Availability
        <select className="input mt-2 w-full font-normal" value={values.availability ?? ""} onChange={(event) => onChange({ availability: event.target.value as ListingFilters["availability"] || undefined })}>
          <option value="">All products</option><option value="in-stock">In stock</option><option value="out-of-stock">Out of stock</option>
        </select>
      </label>
      <fieldset className="space-y-2 border-t border-line pt-4">
        <legend className="sr-only">Offers and delivery</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5 accent-brand" checked={!!values.promotion} onChange={(event) => onChange({ promotion: event.target.checked ? "flash-deals" : undefined })} />Flash deals</label>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5 accent-brand" checked={!!values.freeShipping} onChange={(event) => onChange({ freeShipping: event.target.checked ? true : undefined })} />Free shipping</label>
      </fieldset>
      <fieldset className="min-w-0 border-t border-line pt-4">
        <legend className="text-sm font-bold">Price (৳)</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["minPrice", "maxPrice"] as const).map((key) => (
            <label key={key} htmlFor={`${id}-${key}`} className="min-w-0 text-xs text-mute">{key === "minPrice" ? "Minimum price" : "Maximum price"}
              <input id={`${id}-${key}`} type="number" min="0" step="1" inputMode="numeric" className="input mt-2 w-full min-w-0 text-ink" value={key === "minPrice" ? minPrice : maxPrice} onChange={(event) => onPriceChange(key, event.target.value)} />
            </label>
          ))}
        </div>
        {onApplyPrice && <button type="button" className="btn btn-outline btn-md mt-3 w-full" onClick={onApplyPrice}>Apply price</button>}
      </fieldset>
    </fieldset>
  );
}
