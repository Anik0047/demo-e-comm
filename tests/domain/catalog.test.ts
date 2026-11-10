import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { categories } from "@/data/categories";
import { flashDeals } from "@/data/flash-deals";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { getProductListing } from "@/services/catalog";
import { validateCatalog } from "@/services/catalog-integrity";
import { queryCatalog } from "@/services/catalog-rules";
import { getProductDetails } from "@/services/product-details";
import { getRelatedProducts, RELATED_PRODUCTS_LIMIT } from "@/services/related-products";
import { transitionListingState } from "@/lib/catalog-query";
import type { CatalogDataset, ListingResult } from "@/types/catalog";

const NOW = Date.parse("2026-11-10T12:00:00.000Z");
const data: CatalogDataset = { products, categories, vendors, deals: flashDeals };

async function listing(query: Record<string, string> = {}): Promise<Extract<ListingResult, { status: "ready" }>> {
  const result = await getProductListing(query, { now: NOW, data });
  assert.equal(result.status, "ready");
  return result;
}

const ids = (result: Awaited<ReturnType<typeof listing>>) => result.items.map(({ id }) => id);

test("category, subcategory, and child filters include descendants", async () => {
  const category = await listing({ category: "electronics" });
  assert.ok(category.totalResults > 0);
  assert.ok(ids(category).includes("prod-wireless-earbuds-pro"));
  assert.ok(ids(category).includes("prod-android-smartphone-128gb"));
  assert.ok(ids(category).includes("prod-smart-watch-series-5"));
  assert.ok(ids(category).includes("prod-power-bank-10000"));

  const subcategory = await listing({ subcategory: "audio-headphones" });
  assert.deepEqual(ids(subcategory), ["prod-wireless-earbuds-pro", "prod-bluetooth-speaker", "prod-over-ear-headphones"]);

  const child = await listing({ subcategory: "audio-headphones", child: "wireless-earbuds" });
  assert.deepEqual(ids(child), ["prod-wireless-earbuds-pro"]);
  assert.equal(child.totalResults, 1);
});

test("taxonomy references resolve and corrected products match their canonical descendants", async () => {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  assert.equal(validateCatalog(data).available, true);
  for (const category of categories) {
    if (category.parentId !== null) {
      const parent = categoryById.get(category.parentId);
      assert.ok(parent, `${category.id} has a parent`);
      assert.equal(category.level, parent.level + 1, `${category.id} follows its parent level`);
    }
  }
  for (const product of products) {
    assert.ok(categoryById.has(product.categoryId), `${product.id} resolves to a category`);
  }

  const mobilePhones = await getProductListing({}, { now: NOW, data, categoryScope: "mobile-phones" });
  assert.equal(mobilePhones.status, "ready");
  assert.ok(!ids(mobilePhones).includes("prod-smart-watch-series-5"));
  assert.ok(!ids(mobilePhones).includes("prod-power-bank-10000"));

  for (const [productId, childSlug, expectedCategoryId, expectedRegularPrice, expectedListingPrice, expectedCompareAtPrice] of [
    ["prod-smart-watch-series-5", "smart-watches", "child-wearables-smart-watches", 6650, 3990, 6650],
    ["prod-power-bank-10000", "power-banks", "child-mobile-accessories-power-banks", 1590, 1590, null],
  ] as const) {
    const product = products.find(({ id }) => id === productId);
    assert.ok(product);
    const childListing = await getProductListing({ search: product.name, vendor: "tech-haven", sort: "price-asc", page: "1" }, { now: NOW, data, categoryScope: childSlug });
    assert.equal(childListing.status, "ready");
    assert.deepEqual(ids(childListing), [productId]);
    assert.equal(childListing.totalResults, 1);
    assert.equal(childListing.items[0]?.price, expectedListingPrice);
    assert.equal(childListing.items[0]?.compareAtPrice, expectedCompareAtPrice);

    assert.equal(product.categoryId, expectedCategoryId);
    assert.equal(product.price, expectedRegularPrice);
    const detail = await getProductDetails(product.slug, { products, categories, vendors });
    assert.equal(detail?.product.id, productId);
    assert.equal(detail?.product.slug, product.slug);
    assert.equal(detail?.product.vendorId, product.vendorId);
    assert.deepEqual(detail?.categoryPath.map(({ id }) => id), ["cat-electronics", expectedCategoryId.startsWith("child-wearables") ? "sub-electronics-wearables" : "sub-electronics-mobile-accessories", expectedCategoryId]);
  }
});

test("related products rank canonical same-category and sibling-category items ahead of broader branches", () => {
  const current = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  const exact = products.find(({ id }) => id === "prod-bluetooth-speaker");
  const sibling = products.find(({ id }) => id === "prod-over-ear-headphones");
  assert.ok(current && exact && sibling);
  const fixture = {
    products: [current, { ...exact, id: "prod-exact-audio-category", categoryId: current.categoryId }, sibling, exact],
    categories,
    vendors,
    deals: [],
  };
  const related = getRelatedProducts(current.id, { data: fixture, now: NOW });
  const relatedIds = related.map(({ id }) => id);
  assert.deepEqual(relatedIds, ["prod-exact-audio-category", "prod-over-ear-headphones", "prod-bluetooth-speaker"]);
  assert.equal(new Set(relatedIds).size, relatedIds.length);
});

test("related-product taxonomy follows the corrected canonical category IDs", () => {
  const watch = products.find(({ id }) => id === "prod-smart-watch-series-5");
  const powerBank = products.find(({ id }) => id === "prod-power-bank-10000");
  const watchVendor = vendors.find(({ id }) => id === watch?.vendorId);
  const powerBankVendor = vendors.find(({ id }) => id === powerBank?.vendorId);
  assert.ok(watch && powerBank && watchVendor && powerBankVendor);
  const fixture = { products: [watch, powerBank], categories, vendors: [watchVendor, powerBankVendor], deals: [] };
  assert.deepEqual(getRelatedProducts(watch.id, { data: fixture }).map(({ id }) => id), [powerBank.id]);
});

test("related products use approved-vendor fallback and stable bounded ordering", () => {
  const product = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  const vendor = vendors.find(({ id }) => id === "vendor-tech-haven");
  assert.ok(product && vendor);
  const unrelatedProducts = ["related-z", "related-b", "related-a", "related-c", "related-d", "related-e"].map((id) => ({
    ...product, id, slug: id, categoryId: "child-fashion-men-shirts",
  }));
  const fixture = { products: [product, ...unrelatedProducts], categories, vendors: [vendor], deals: [] };
  const first = getRelatedProducts(product.id, { data: fixture });
  const second = getRelatedProducts(product.id, { data: fixture });
  assert.deepEqual(first.map(({ id }) => id), ["related-a", "related-b", "related-c", "related-d"]);
  assert.deepEqual(second.map(({ id }) => id), first.map(({ id }) => id));
  assert.equal(getRelatedProducts(product.id, { data: fixture, limit: 1 }).length, 1);
  assert.equal(first.length, RELATED_PRODUCTS_LIMIT);
});

test("related products exclude inactive items, unapproved vendors, duplicates, and the current product", () => {
  const current = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  const exact = products.find(({ id }) => id === "prod-over-ear-headphones");
  const draft = products.find(({ id }) => id === "prod-bluetooth-speaker");
  const vendor = vendors.find(({ id }) => id === "vendor-sound-wave");
  assert.ok(current && exact && draft && vendor);
  const preferred = { ...exact, vendorId: current.vendorId };
  const ineligible = { ...draft, status: "inactive" as const };
  const unapproved = { ...exact, id: "prod-unapproved-related", vendorId: vendor.id };
  const currentVendor = vendors.find(({ id }) => id === current.vendorId);
  assert.ok(currentVendor);
  const fixture = {
    products: [current, preferred, { ...preferred }, ineligible, unapproved],
    categories,
    vendors: [currentVendor, { ...vendor, status: "suspended" as const }],
    deals: [],
  };
  assert.deepEqual(getRelatedProducts(current.id, { data: fixture }).map(({ id }) => id), [preferred.id]);
});

test("related products preserve out-of-stock visibility and established effective listing pricing", () => {
  const related = getRelatedProducts("prod-wireless-earbuds-pro", { now: NOW });
  const dealProduct = related.find(({ id }) => id === "prod-over-ear-headphones");
  assert.equal(dealProduct?.price, 2790);
  assert.equal(dealProduct?.compareAtPrice, 3250);

  const refrigerator = products.find(({ id }) => id === "prod-double-door-refrigerator");
  const refrigeratorVendor = vendors.find(({ id }) => id === refrigerator?.vendorId);
  assert.ok(refrigerator && refrigeratorVendor);
  const outOfStockCandidate = { ...refrigerator, id: "prod-related-out-of-stock", slug: "related-out-of-stock" };
  const sameVendorFixture = {
    products: [refrigerator, outOfStockCandidate],
    categories,
    vendors: [refrigeratorVendor],
    deals: [],
  };
  const outOfStock = getRelatedProducts(refrigerator.id, { data: sameVendorFixture });
  assert.equal(outOfStock[0]?.id, outOfStockCandidate.id);
  assert.equal(outOfStock[0]?.inStock, false);
});

test("related products return empty for unknown products or catalogs without a relevant match", () => {
  const current = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  assert.ok(current);
  const emptyFixture = { products: [current], categories, vendors, deals: [] };
  assert.deepEqual(getRelatedProducts(current.id, { data: emptyFixture }), []);
  assert.deepEqual(getRelatedProducts("missing-product"), []);
});

test("vendor filter returns only that vendor and invalid slugs are removed", async () => {
  const result = await listing({ vendor: "sound-wave" });
  assert.deepEqual(ids(result), ["prod-bluetooth-speaker", "prod-over-ear-headphones"]);
  assert.equal(result.totalResults, 2);

  const invalid = await listing({ vendor: "not-a-vendor" });
  assert.equal(invalid.state.vendor, undefined);
  assert.ok(invalid.notices.some(({ reason }) => reason === "unavailable-filter"));
});

test("inclusive price bounds use the effective listing price and invalid ranges are discarded", async () => {
  const exact = await listing({ minPrice: "2450", maxPrice: "2450" });
  assert.deepEqual(ids(exact), ["prod-wireless-earbuds-pro"]);
  assert.equal(exact.items[0]?.price, 2450);

  const invalid = await listing({ minPrice: "4000", maxPrice: "1000" });
  assert.equal(invalid.state.minPrice, undefined);
  assert.equal(invalid.state.maxPrice, undefined);
  assert.ok(invalid.notices.some(({ reason }) => reason === "invalid-price"));

  const malformed = await listing({ minPrice: "1.5", maxPrice: "5000" });
  assert.equal(malformed.state.minPrice, undefined);
  assert.ok(malformed.notices.some(({ reason }) => reason === "invalid-price"));
});

test("active flash deals replace regular prices for promotion and range filtering", async () => {
  const promo = await listing({ promotion: "flash-deals", sort: "price-asc" });
  assert.deepEqual(ids(promo), ["prod-womens-cotton-kurti", "prod-cotton-panjabi", "prod-bluetooth-speaker", "prod-wireless-earbuds-pro", "prod-over-ear-headphones", "prod-nonstick-cookware-set", "prod-smart-watch-series-5"]);
  const earbuds = promo.items.find(({ id }) => id === "prod-wireless-earbuds-pro");
  assert.equal(earbuds?.price, 2450);
  assert.equal(earbuds?.compareAtPrice, 3770);
  const boundary = await listing({ promotion: "flash-deals", minPrice: "2450", maxPrice: "2450" });
  assert.deepEqual(ids(boundary), ["prod-wireless-earbuds-pro"]);
});

test("listing availability is product-level even when products have variants", async () => {
  const panjabi = products.find(({ id }) => id === "prod-cotton-panjabi");
  assert.ok(panjabi?.hasVariants);
  assert.ok(panjabi.variants.length > 0);
  const available = await listing({ subcategory: "mens-clothing", child: "mens-panjabi", availability: "in-stock" });
  assert.ok(ids(available).includes("prod-cotton-panjabi"));
  assert.equal(available.items.find(({ id }) => id === "prod-cotton-panjabi")?.availability, "in-stock");

  const unavailable = await listing({ subcategory: "home-appliances", child: "refrigerators", availability: "out-of-stock" });
  assert.deepEqual(ids(unavailable), ["prod-double-door-refrigerator"]);
  const excluded = await listing({ subcategory: "home-appliances", child: "refrigerators", availability: "in-stock" });
  assert.equal(excluded.totalResults, 0);

  // Listings use product.price/product.stock until a shopper selects a variant.
  const variantOnlyChange = {
    ...panjabi,
    variants: panjabi.variants.map((variant, index) => index === 0 ? { ...variant, price: 99, stock: 0 } : variant),
  };
  const productLevel = queryCatalog({ products: [variantOnlyChange], categories, vendors, deals: [] }, {
    minPrice: 1500, availability: "in-stock", sort: "catalog", page: 1,
  }, NOW);
  assert.equal(productLevel.totalResults, 1);
  assert.equal(productLevel.rows[0]?.price, 1600);
  assert.equal(productLevel.rows[0]?.inStock, true);
});

test("all supported sorts return deterministic product ordering", async () => {
  const expected: Record<string, string[]> = {
    catalog: ["prod-wireless-earbuds-pro", "prod-smart-watch-series-5", "prod-cotton-panjabi", "prod-nonstick-cookware-set", "prod-bluetooth-speaker"],
    "price-asc": ["prod-hardcover-notebook-pack", "prod-butter-cookies-tin", "prod-bengali-short-story-collection", "prod-watercolor-paint-set", "prod-herbal-shampoo"],
    "price-desc": ["prod-gaming-laptop-15", "prod-double-door-refrigerator", "prod-android-smartphone-128gb", "prod-camping-dome-tent", "prod-smart-watch-series-5"],
    newest: ["prod-hardcover-notebook-pack", "prod-womens-cotton-kurti", "prod-butter-cookies-tin", "prod-over-ear-headphones", "prod-hydrating-face-moisturizer"],
    "best-selling": ["prod-basmati-rice-5kg", "prod-miniket-rice-5kg", "prod-power-bank-10000", "prod-running-shoes", "prod-organic-face-serum"],
    "top-rated": ["prod-bengali-short-story-collection", "prod-kids-building-blocks", "prod-jamdani-cotton-saree", "prod-baby-cotton-clothing-set", "prod-organic-face-serum"],
  };
  const observed = Object.fromEntries(await Promise.all(Object.keys(expected).map(async (sort) => [sort, ids(await listing({ sort }))] as const)));
  for (const [sort, expectedIds] of Object.entries(expected)) {
    const actualIds = observed[sort] ?? [];
    assert.deepEqual(actualIds.slice(0, expectedIds.length), expectedIds, sort);
  }
});

test("equal sort values break ties by product id", async () => {
  const pair = products.filter(({ id }) => ["prod-primary-school-textbook-set", "prod-hardcover-notebook-pack"].includes(id)).map((product) => ({ ...product, price: 500 }));
  const result = queryCatalog({ products: pair, categories, vendors, deals: [] }, { sort: "price-asc", page: 1 }, NOW);
  assert.deepEqual(result.rows.map(({ product }) => product.id), ["prod-hardcover-notebook-pack", "prod-primary-school-textbook-set"]);
});

test("pagination clamps first, last, and out-of-range requests", async () => {
  const first = await listing({ search: "a", page: "1" });
  assert.equal(first.state.page, 1);
  assert.equal(first.items.length, first.pageSize);
  assert.equal(first.totalPages, Math.ceil(first.totalResults / first.pageSize));
  const lastPageNumber = first.totalPages;
  const last = await listing({ search: "a", page: String(lastPageNumber) });
  assert.equal(last.state.page, lastPageNumber);
  assert.ok(last.items.length <= last.pageSize);
  const beyond = await listing({ search: "a", page: String(lastPageNumber + 10) });
  assert.equal(beyond.state.page, lastPageNumber);
  assert.deepEqual(ids(beyond), ids(last));
  const malformed = await listing({ page: "0" });
  assert.equal(malformed.state.page, 1);
  assert.ok(malformed.notices.some(({ reason }) => reason === "invalid-page"));
});

test("combined search, category, vendor, price, stock, and sort filters intersect", async () => {
  const result = await listing({ search: "cotton", category: "fashion", vendor: "urban-fit", minPrice: "1000", maxPrice: "2000", availability: "in-stock", sort: "price-asc" });
  assert.deepEqual(ids(result), ["prod-womens-cotton-kurti", "prod-cotton-panjabi"]);
  assert.equal(result.totalResults, 2);
  assert.deepEqual(result.items.map(({ price }) => price), [1190, 1200]);
});

test("URL transitions preserve unrelated search state when clearing filters", () => {
  const transition = transitionListingState({ search: "cotton", vendor: "home-nest", sort: "price-asc", page: 2 }, { type: "clear" });
  assert.deepEqual(transition.state, { search: "cotton", sort: "price-asc", page: 1 });
  assert.equal(transition.href, "/products?search=cotton&sort=price-asc");
});
