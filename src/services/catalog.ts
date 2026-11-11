import { categories } from "@/data/categories";
import { flashDeals, flashDealPlaceholders } from "@/data/flash-deals";
import { products, trendingPlaceholders, trendingProductIds } from "@/data/products";
import { vendors } from "@/data/vendors";
import { buildProductsHref, parseListingQuery } from "@/lib/catalog-query";
import { validateCatalog } from "@/services/catalog-integrity";
import { queryCatalog } from "@/services/catalog-rules";
import { projectProductCard } from "@/services/product-card";
import type { CatalogDataset, CatalogValidation, ListingOptions, ListingResult, RawListingQuery } from "@/types/catalog";
import type { Vendor } from "@/types/vendor";

const catalog: CatalogDataset = { products, categories, vendors, deals: flashDeals, trendingProductIds };

function optionsFrom(data: CatalogDataset, validation: CatalogValidation): ListingOptions {
  const invalid = (source: "categories" | "products" | "vendors") => validation.issues.some((issue) => issue.source === source && issue.severity === "fatal");
  const activeVendors = new Set(data.products.filter((product) => product.status === "active").map((product) => product.vendorId));
  return {
    categories: invalid("categories") ? [] : data.categories.filter(({ level }) => level === 1).map(({ slug, name }) => ({ slug, name })),
    subcategories: invalid("categories") ? [] : data.categories.filter(({ level }) => level === 2).map((category) => ({ slug: category.slug, name: category.name, parentSlug: data.categories.find((parent) => parent.id === category.parentId)?.slug })),
    children: invalid("categories") ? [] : data.categories.filter(({ level }) => level === 3).map((category) => ({ slug: category.slug, name: category.name, parentSlug: data.categories.find((parent) => parent.id === category.parentId)?.slug })),
    vendors: invalid("vendors") || invalid("products") ? [] : data.vendors.filter((vendor) => activeVendors.has(vendor.id)).map(({ slug, name }) => ({ slug, name })),
  };
}

export function getCatalogOptions(data: CatalogDataset = catalog): ListingOptions {
  return optionsFrom(data, validateCatalog(data));
}

export function getGlobalSearchData(data: CatalogDataset = catalog) {
  const categoryById = new Map(data.categories.map((category) => [category.id, category]));
  const mainCategoryFor = (categoryId: string) => {
    let category = categoryById.get(categoryId);
    while (category?.parentId) category = categoryById.get(category.parentId);
    return category;
  };
  const activeProducts = data.products.filter((product) => product.status === "active");
  const vendorsById = new Map(data.vendors.map((vendor) => [vendor.id, vendor]));
  return {
    searchProducts: activeProducts.flatMap((product) => {
      const category = categoryById.get(product.categoryId);
      const mainCategory = mainCategoryFor(product.categoryId);
      const vendor = vendorsById.get(product.vendorId);
      return category && mainCategory && vendor ? [{
        id: product.id,
        slug: product.slug,
        name: product.name,
        categoryName: category.name,
        categorySlug: mainCategory.slug,
        searchFields: [product.name, product.brand ?? "", ...product.tags, vendor.name],
      }] : [];
    }),
    popularSearches: [...activeProducts]
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5)
      .map((product) => product.name),
  };
}

interface ProductListingOptions {
  now: number;
  data?: CatalogDataset;
  categoryScope?: string;
  basePath?: string;
  filterCategoryScope?: string;
}

export async function getProductListing(raw: RawListingQuery, { now, data = catalog, categoryScope, basePath = "/products", filterCategoryScope = categoryScope }: ProductListingOptions): Promise<ListingResult> {
  const { state, notices } = parseListingQuery(raw);
  const validation = validateCatalog(data);
  const options = optionsFrom(data, validation);
  if (filterCategoryScope) {
    const scope = data.categories.find((category) => category.slug === filterCategoryScope);
    const activeSubcategory = scope?.level === 3 ? data.categories.find((category) => category.id === scope.parentId) : scope?.level === 2 ? scope : undefined;
    const activeParent = scope?.level === 2 ? data.categories.find((category) => category.id === scope.parentId) : scope?.level === 1 ? scope : undefined;
    const subs = activeSubcategory ? [activeSubcategory] : activeParent ? data.categories.filter((category) => category.level === 2 && category.parentId === activeParent.id) : [];
    if (scope?.level === 3) {
      options.categories = [];
      delete options.subcategories;
      delete options.children;
    } else {
      options.categories = subs.map(({ slug, name }) => ({ slug, name }));
      options.subcategories = subs.map(({ slug, name }) => ({ slug, name, parentSlug: activeParent?.slug }));
      options.children = data.categories.filter((category) => category.level === 3 && subs.some((sub) => sub.id === category.parentId)).map((category) => ({ slug: category.slug, name: category.name, parentSlug: subs.find((sub) => sub.id === category.parentId)?.slug }));
    }
  }
  if (!validation.available) {
    return { status: "unavailable", state, href: buildProductsHref(state, basePath), notices, options };
  }
  for (const [key, values] of [["category", options.categories], ["subcategory", options.subcategories ?? []], ["child", options.children ?? []], ["vendor", options.vendors]] as const) {
    if (state[key] && !values.some((option) => option.slug === state[key])) {
      delete state[key];
      if (!notices.some((notice) => notice.reason === "unavailable-filter")) {
        notices.push({ reason: "unavailable-filter", message: "An unavailable filter was removed." });
      }
    }
  }
  if (state.category && state.subcategory) {
    const category = data.categories.find((item) => item.slug === state.category);
    const subcategory = data.categories.find((item) => item.slug === state.subcategory);
    if (category && subcategory?.parentId !== category.id) {
      delete state.subcategory;
      delete state.child;
      if (!notices.some((notice) => notice.reason === "unavailable-filter")) notices.push({ reason: "unavailable-filter", message: "An unavailable filter was removed." });
    }
  }
  if (state.child && !data.categories.some((category) => category.slug === state.child && category.parentId === data.categories.find((item) => item.slug === state.subcategory)?.id)) {
    delete state.child;
    notices.push({ reason: "unavailable-filter", message: "An unavailable filter was removed." });
  }
  const result = queryCatalog(data, state, now, categoryScope);
  return {
    status: "ready", state: result.state, href: buildProductsHref(result.state, basePath), notices, options,
    totalResults: result.totalResults, totalPages: result.totalPages, pageSize: result.pageSize,
    items: result.rows.map(({ product, vendor, price, compareAtPrice, inStock }) => ({
      ...projectProductCard(product, vendor, {
        price, compareAtPrice, inStock,
        placeholder: state.promotion ? flashDealPlaceholders[product.id] : trendingPlaceholders[product.id] ?? flashDealPlaceholders[product.id],
      }, now),
      availability: inStock ? "in-stock" : "out-of-stock",
      hasReviews: product.ratingCount > 0,
    })),
  };
}

export async function getPublicVendorListing(
  vendor: Vendor,
  raw: RawListingQuery,
  { now, data = catalog, basePath = `/vendor/${vendor.slug}` }: Omit<ProductListingOptions, "categoryScope" | "filterCategoryScope">,
): Promise<ListingResult | null> {
  if (vendor.status !== "approved") return null;
  const scopedData: CatalogDataset = {
    ...data,
    products: data.products.filter((product) => product.vendorId === vendor.id),
    vendors: data.vendors.filter((item) => item.id === vendor.id),
  };
  const withoutVendorQuery = raw instanceof URLSearchParams
    ? new URLSearchParams([...raw.entries()].filter(([key]) => key !== "vendor"))
    : Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "vendor"));
  return getProductListing(withoutVendorQuery, { now, data: scopedData, basePath });
}
