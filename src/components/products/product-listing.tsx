import { ListingEmpty, ListingUnavailableState } from "@/components/products/listing-states";
import { io } from "next/cache";
import { ListingControls } from "@/components/products/listing-controls";
import { Pagination } from "@/components/products/pagination";
import { ProductGrid } from "@/components/products/product-grid";
import { getProductListing } from "@/services/catalog";
import { getPricingTime } from "@/services/effective-price";
import type { CatalogSort, ListingResult, RawListingQuery } from "@/types/catalog";

const sortHeadings: Record<CatalogSort, string> = {
  catalog: "All products",
  "price-asc": "All products",
  "price-desc": "All products",
  newest: "New arrivals",
  "best-selling": "Best sellers",
  "top-rated": "Top rated",
};

function headingFor({ state, options }: ListingResult) {
  const category = options.categories.find((option) => option.slug === state.category)?.name ?? state.category;
  const vendor = options.vendors.find((option) => option.slug === state.vendor)?.name ?? state.vendor;
  const context = [category, vendor].filter(Boolean).join(" · ");
  const title = state.promotion ? "Flash deals" : state.search ? `Search results for “${state.search}”` : sortHeadings[state.sort];
  return context ? `${title} · ${context}` : title;
}

interface ProductListingProps {
  searchParams: Promise<RawListingQuery>;
  categoryScope?: string;
  filterCategoryScope?: string;
  subcategoryScope?: string;
  basePath?: string;
  showHeading?: boolean;
  categoryLabel?: string;
}

export async function ProductListing({ searchParams, categoryScope, filterCategoryScope = categoryScope, subcategoryScope, basePath = "/products", showHeading = true, categoryLabel }: ProductListingProps) {
  const raw = await searchParams;
  await io();
  const pricingTime = getPricingTime();
  const result = await getProductListing(raw, {
    now: pricingTime,
    categoryScope,
    basePath,
    filterCategoryScope,
  });
  const query = new URLSearchParams();
  if (raw instanceof URLSearchParams) raw.forEach((value, key) => query.append(key, value));
  else for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.append(key, value);
  }
  const count = result.status === "unavailable" ? "Products are unavailable" : result.totalResults === 0 ? "0 products" : `Showing ${(result.state.page - 1) * result.pageSize + 1}–${(result.state.page - 1) * result.pageSize + result.items.length} of ${result.totalResults} products`;
  return (
    <>
      {showHeading && <header className="mb-6 min-w-0">
        <h1 className="font-head text-3xl font-extrabold break-words sm:text-4xl">{headingFor(result)}</h1>
        {result.state.promotion && <p className="mt-3 text-sm text-mute">Flash deal prices are shown below, alongside regular prices.</p>}
        {result.state.promotion && result.state.search && <p className="mt-2 text-sm text-mute break-words">Search results for “{result.state.search}”</p>}
      </header>}
      <ListingControls state={result.state} options={result.options} href={result.href} rawQuery={query.toString()} notices={result.notices} count={count} basePath={basePath} categoryLabel={categoryLabel} subcategoryScope={subcategoryScope}>
        {result.status === "unavailable" ? <ListingUnavailableState result={result} /> : <>
          {result.items.length > 0 ? <ProductGrid items={result.items} /> : <ListingEmpty state={result.state} basePath={basePath} />}
          <Pagination state={result.state} totalPages={result.totalPages} basePath={basePath} />
        </>}
      </ListingControls>
    </>
  );
}
