import type { CatalogDataset, CatalogIssue, CatalogValidation } from "@/types/catalog";

const nonnegativeInteger = (value: number) => Number.isSafeInteger(value) && value >= 0;
function validTimestamp(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  return date.toISOString().slice(0, 10) === value.slice(0, 10);
}

export function validateCatalog(data: CatalogDataset): CatalogValidation {
  const issues: CatalogIssue[] = [];
  const issue = (source: CatalogIssue["source"], code: CatalogIssue["code"], detail: string, severity: CatalogIssue["severity"] = "fatal") => {
    issues.push({ source, code, detail, severity });
  };
  function unique<T>(items: readonly T[], key: keyof T, source: CatalogIssue["source"]) {
    const seen = new Set<unknown>();
    for (const item of items) {
      const value = item[key];
      if (typeof value !== "string" || !value.trim()) issue(source, "scalar", `Invalid ${String(key)}`);
      if (seen.has(value)) issue(source, "duplicate", `Duplicate ${String(key)}: ${String(value)}`);
      seen.add(value);
    }
  }
  for (const key of ["id", "slug", "sku"] as const) unique(data.products, key, "products");
  for (const key of ["id", "slug"] as const) {
    unique(data.categories, key, "categories");
    unique(data.vendors, key, "vendors");
  }
  unique(data.deals, "id", "deals");
  unique(data.deals, "productId", "deals");
  const categories = new Map(data.categories.map((category) => [category.id, category]));
  const vendors = new Set(data.vendors.map((vendor) => vendor.id));
  const products = new Map(data.products.map((product) => [product.id, product]));
  for (const category of data.categories) {
    const parent = category.parentId === null ? undefined : categories.get(category.parentId);
    if (category.parentId !== null && !parent) issue("categories", "reference", `Missing parent: ${category.id}`);
    if (![1, 2, 3].includes(category.level) || (category.parentId === null ? category.level !== 1 : !parent || category.level !== parent.level + 1)) {
      issue("categories", "hierarchy", `Invalid level: ${category.id}`);
    }
    const visited = new Set<string>();
    let node: typeof category | undefined = category;
    while (node) {
      if (visited.has(node.id)) { issue("categories", "hierarchy", `Cycle: ${category.id}`); break; }
      visited.add(node.id);
      node = node.parentId === null ? undefined : categories.get(node.parentId);
    }
  }
  for (const product of data.products) {
    if (!categories.has(product.categoryId)) issue("products", "reference", `Missing category: ${product.id}`);
    if (!vendors.has(product.vendorId)) issue("products", "reference", `Missing vendor: ${product.id}`);
    for (const key of ["price", "stock", "soldCount", "ratingCount"] as const) {
      if (!nonnegativeInteger(product[key])) issue("products", "scalar", `Invalid ${key}: ${product.id}`);
    }
    if (product.compareAtPrice !== null && !nonnegativeInteger(product.compareAtPrice)) issue("products", "scalar", `Invalid compareAtPrice: ${product.id}`);
    if (!Number.isFinite(product.ratingAverage) || product.ratingAverage < 0 || product.ratingAverage > 5) issue("products", "scalar", `Invalid rating: ${product.id}`);
    if (product.publishedAt !== null && !validTimestamp(product.publishedAt)) issue("products", "scalar", `Invalid publication: ${product.id}`);
  }
  for (const deal of data.deals) {
    const product = products.get(deal.productId);
    if (!product) issue("deals", "reference", `Missing product: ${deal.id}`, "omission");
    if (!nonnegativeInteger(deal.dealPrice) || deal.dealPrice === 0 || (product && deal.dealPrice >= product.price)) issue("deals", "scalar", `Invalid price: ${deal.id}`);
    if (!nonnegativeInteger(deal.stockLimit) || deal.stockLimit === 0 || !nonnegativeInteger(deal.soldCount)) issue("deals", "scalar", `Invalid quota: ${deal.id}`);
  }
  for (const id of data.trendingProductIds ?? []) {
    if (!products.has(id)) issue("selections", "reference", `Missing curated product: ${id}`, "omission");
  }
  return { available: !issues.some((item) => item.severity === "fatal"), releaseValid: issues.length === 0, issues };
}
