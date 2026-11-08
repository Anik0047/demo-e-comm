import { categories } from "@/data/categories";
import { flashDeals, flashDealPlaceholders } from "@/data/flash-deals";
import { products, trendingPlaceholders, trendingProductIds } from "@/data/products";
import { vendors } from "@/data/vendors";
import { buildProductsHref, parseListingQuery } from "@/lib/catalog-query";
import { validateCatalog } from "@/services/catalog-integrity";
import { queryCatalog } from "@/services/catalog-rules";
import { projectProductCard } from "@/services/product-card";
import type { CatalogDataset, CatalogValidation, ListingOptions, ListingResult, RawListingQuery } from "@/types/catalog";

const catalog: CatalogDataset = { products, categories, vendors, deals: flashDeals, trendingProductIds };

function optionsFrom(data: CatalogDataset, validation: CatalogValidation): ListingOptions {
  const invalid = (source: "categories" | "products" | "vendors") => validation.issues.some((issue) => issue.source === source && issue.severity === "fatal");
  const activeVendors = new Set(data.products.filter((product) => product.status === "active").map((product) => product.vendorId));
  return {
    categories: invalid("categories") ? [] : data.categories.map(({ slug, name }) => ({ slug, name })),
    vendors: invalid("vendors") || invalid("products") ? [] : data.vendors.filter((vendor) => activeVendors.has(vendor.id)).map(({ slug, name }) => ({ slug, name })),
  };
}

export function getCatalogOptions(data: CatalogDataset = catalog): ListingOptions {
  return optionsFrom(data, validateCatalog(data));
}

export async function getProductListing(raw: RawListingQuery, data: CatalogDataset = catalog, categoryScope?: string, basePath = "/products"): Promise<ListingResult> {
  const { state, notices } = parseListingQuery(raw);
  const validation = validateCatalog(data);
  const options = optionsFrom(data, validation);
  if (categoryScope) {
    const scope = data.categories.find((category) => category.slug === categoryScope && category.level === 1);
    options.categories = scope
      ? data.categories.filter((category) => category.level === 2 && category.parentId === scope.id).map(({ slug, name }) => ({ slug, name }))
      : [];
  }
  if (!validation.available) {
    return { status: "unavailable", state, href: buildProductsHref(state, basePath), notices, options };
  }
  for (const [key, values] of [["category", options.categories], ["vendor", options.vendors]] as const) {
    if (state[key] && !values.some((option) => option.slug === state[key])) {
      delete state[key];
      if (!notices.some((notice) => notice.reason === "unavailable-filter")) {
        notices.push({ reason: "unavailable-filter", message: "An unavailable filter was removed." });
      }
    }
  }
  const result = queryCatalog(data, state, categoryScope);
  return {
    status: "ready", state: result.state, href: buildProductsHref(result.state, basePath), notices, options,
    totalResults: result.totalResults, totalPages: result.totalPages, pageSize: result.pageSize,
    items: result.rows.map(({ product, vendor, price, compareAtPrice, inStock }) => ({
      ...projectProductCard(product, vendor, {
        price, compareAtPrice, inStock,
        placeholder: state.promotion ? flashDealPlaceholders[product.id] : trendingPlaceholders[product.id] ?? flashDealPlaceholders[product.id],
      }),
      availability: inStock ? "in-stock" : "out-of-stock",
      hasReviews: product.ratingCount > 0,
    })),
  };
}
