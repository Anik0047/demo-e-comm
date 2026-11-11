import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { categories } from "@/data/categories";
import { flashDeals } from "@/data/flash-deals";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { getProductListing, getPublicVendorListing } from "@/services/catalog";
import { validateCatalog } from "@/services/catalog-integrity";
import { queryCatalog } from "@/services/catalog-rules";
import { getProductDetails } from "@/services/product-details";
import { getRelatedProducts, RELATED_PRODUCTS_LIMIT } from "@/services/related-products";
import { getFlashDeals } from "@/services/flash-deals";
import { getTrendingProducts } from "@/services/trending";
import { getCategoryNavigation, getMainCategories } from "@/services/categories";
import { transitionListingState } from "@/lib/catalog-query";
import { getPublicVendorBySlug } from "@/services/vendors";
import type { CatalogDataset, ListingResult } from "@/types/catalog";

const NOW = Date.parse("2026-11-10T12:00:00.000Z");
const data: CatalogDataset = { products, categories, vendors, deals: flashDeals };

async function listing(query: Record<string, string> = {}): Promise<Extract<ListingResult, { status: "ready" }>> {
  const result = await getProductListing(query, { now: NOW, data });
  assert.equal(result.status, "ready");
  return result;
}

const ids = (result: Awaited<ReturnType<typeof listing>>) => result.items.map(({ id }) => id);

test("public vendor resolution admits approved canonical vendors only", () => {
  assert.equal(getPublicVendorBySlug("tech-haven")?.id, "vendor-tech-haven");
  assert.equal(getPublicVendorBySlug("not-a-vendor"), null);
  const pending = { ...vendors[0]!, slug: "pending-store", status: "pending" as const };
  const suspended = { ...vendors[0]!, slug: "suspended-store", status: "suspended" as const };
  assert.equal(getPublicVendorBySlug(pending.slug, [pending]), null);
  assert.equal(getPublicVendorBySlug(suspended.slug, [suspended]), null);
});

test("public vendor listings enforce route ownership, active products, and ignore vendor query overrides", async () => {
  const vendor = getPublicVendorBySlug("tech-haven");
  const other = vendors.find(({ slug }) => slug === "urban-fit");
  assert.ok(vendor && other);
  const ownProduct = products.find(({ vendorId, status }) => vendorId === vendor.id && status === "active");
  const otherProduct = products.find(({ vendorId, status }) => vendorId === other.id && status === "active");
  assert.ok(ownProduct && otherProduct);
  const fixture = { ...data, products: [ownProduct, otherProduct, { ...ownProduct, id: "inactive-own", slug: "inactive-own", sku: "INACTIVE-OWN-SKU", status: "inactive" as const }] };
  const result = await getPublicVendorListing(vendor, { vendor: other.slug }, { now: NOW, data: fixture });
  assert.ok(result && result.status === "ready");
  assert.deepEqual(ids(result), [ownProduct.id]);
  assert.ok(result.items.every(({ vendor: itemVendor }) => itemVendor.slug === vendor.slug));
  assert.equal(result.state.vendor, undefined);
  assert.equal(result.href, `/vendor/${vendor.slug}`);
  assert.equal(await getPublicVendorListing({ ...vendor, status: "suspended" }, {}, { now: NOW, data }), null);
});

test("public vendor search, category, price, stock, and sort filters intersect within the store", async () => {
  const vendor = getPublicVendorBySlug("tech-haven");
  assert.ok(vendor);
  const earbuds = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  assert.ok(earbuds);
  const filtered = await getPublicVendorListing(vendor, {
    search: "earbuds", category: "electronics", minPrice: "2450", maxPrice: "2450", availability: "in-stock", sort: "price-asc",
  }, { now: NOW, data });
  assert.ok(filtered && filtered.status === "ready");
  assert.deepEqual(ids(filtered), [earbuds.id]);
  assert.equal(filtered.items[0]?.price, 2450);
  assert.equal(filtered.href, `/vendor/${vendor.slug}?category=electronics&search=earbuds&minPrice=2450&maxPrice=2450&availability=in-stock&sort=price-asc`);

  const noMatch = await getPublicVendorListing(vendor, { search: "urban fit only" }, { now: NOW, data });
  assert.ok(noMatch && noMatch.status === "ready");
  assert.equal(noMatch.totalResults, 0);
  assert.deepEqual(noMatch.items, []);
});

test("public vendor listings normalize malformed query values on the vendor base path", async () => {
  const vendor = getPublicVendorBySlug("tech-haven");
  assert.ok(vendor);
  const result = await getPublicVendorListing(vendor, { sort: "unknown", page: "0", minPrice: "1.5" }, { now: NOW, data });
  assert.ok(result && result.status === "ready");
  assert.equal(result.state.sort, "catalog");
  assert.equal(result.state.page, 1);
  assert.equal(result.state.minPrice, undefined);
  assert.equal(result.href, `/vendor/${vendor.slug}`);
  assert.deepEqual(result.notices.map(({ reason }) => reason), ["invalid-price", "invalid-sort", "invalid-page"]);
});

test("public vendor listings preserve effective flash deal prices and out-of-stock visibility", async () => {
  const vendor = getPublicVendorBySlug("tech-haven");
  assert.ok(vendor);
  const deal = await getPublicVendorListing(vendor, { promotion: "flash-deals", sort: "price-asc" }, { now: NOW, data });
  assert.ok(deal && deal.status === "ready");
  const earbuds = deal.items.find(({ id }) => id === "prod-wireless-earbuds-pro");
  assert.equal(earbuds?.price, 2450);
  assert.equal(earbuds?.compareAtPrice, 3770);

  const refrigeratorVendor = getPublicVendorBySlug("dhaka-bazaar");
  assert.ok(refrigeratorVendor);
  const outOfStock = await getPublicVendorListing(refrigeratorVendor, { availability: "out-of-stock" }, { now: NOW, data });
  assert.ok(outOfStock && outOfStock.status === "ready");
  assert.ok(outOfStock.items.every(({ availability }) => availability === "out-of-stock"));
  assert.ok(outOfStock.totalResults > 0);
});

test("public vendor listing pagination and ordering stay deterministic and empty stores stay empty", async () => {
  const vendor = getPublicVendorBySlug("tech-haven");
  const source = products.find(({ vendorId, status }) => vendorId === vendor?.id && status === "active");
  assert.ok(vendor && source);
  const synthetic = Array.from({ length: 14 }, (_, index) => ({ ...source, id: `synthetic-${index}`, slug: `synthetic-${index}`, sku: `SYNTHETIC-${index}`, name: `Synthetic item ${index}`, price: 1000 + index }));
  const fixture = { ...data, products: synthetic };
  const pageOne = await getPublicVendorListing(vendor, { sort: "price-asc" }, { now: NOW, data: fixture });
  const pageTwo = await getPublicVendorListing(vendor, { sort: "price-asc", page: "2" }, { now: NOW, data: fixture });
  assert.ok(pageOne && pageOne.status === "ready" && pageTwo && pageTwo.status === "ready");
  assert.equal(pageOne.totalResults, 14);
  assert.equal(pageOne.items.length, 12);
  assert.equal(pageTwo.items.length, 2);
  const repeated = await getPublicVendorListing(vendor, { sort: "price-asc" }, { now: NOW, data: fixture });
  assert.ok(repeated && repeated.status === "ready");
  assert.deepEqual(pageOne.items.map(({ id }) => id), repeated.items.map(({ id }) => id));
  assert.equal(pageOne.items[0]?.price, 1000);
  assert.equal(pageTwo.items[0]?.price, 1012);

  const empty = await getPublicVendorListing(vendor, {}, { now: NOW, data: { ...data, products: [] } });
  assert.ok(empty && empty.status === "ready");
  assert.equal(empty.totalResults, 0);
  assert.deepEqual(empty.items, []);
});

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

test("homepage categories link only to canonical categories with active approved-vendor products", async () => {
  const visible = await getMainCategories();
  const visibleSlugs = visible.map(({ slug }) => slug);
  assert.ok(visibleSlugs.includes("electronics"));
  assert.ok(visibleSlugs.includes("fashion"));
  assert.ok(visible.every(({ level, slug }) => level === 1 && categories.some((category) => category.slug === slug)));
  for (const category of visible) {
    const result = await getProductListing({ category: category.slug }, { now: NOW, data });
    assert.equal(result.status, "ready");
    assert.ok(result.totalResults > 0, `${category.slug} has eligible products`);
  }
});

test("category navigation emits deterministic eligible paths from the canonical hierarchy", async () => {
  const navigation = await getCategoryNavigation();
  const byId = new Map(categories.map((category) => [category.id, category]));
  assert.deepEqual(await getCategoryNavigation(), navigation);
  const visibleIds = new Set(navigation.map(({ id }) => id));
  assert.deepEqual(navigation.map(({ id }) => id), categories.filter(({ id }) => visibleIds.has(id)).map(({ id }) => id));

  for (const category of navigation) {
    const parent = category.parentId ? byId.get(category.parentId) : undefined;
    const path: typeof category[] = [];
    let node: typeof category | undefined = category;
    while (node) {
      path.unshift(node);
      node = node.parentId ? byId.get(node.parentId) : undefined;
    }
    assert.equal(path.length, category.level, `${category.id} has a complete canonical path`);
    assert.equal(`/category/${path.map(({ slug }) => slug).join("/")}`, category.level === 1
      ? `/category/${category.slug}`
      : category.level === 2
        ? `/category/${path[0]?.slug}/${category.slug}`
        : `/category/${path[0]?.slug}/${path[1]?.slug}/${category.slug}`);
    if (category.level === 1) {
      assert.equal(category.parentId, null);
      assert.ok(await getProductListing({ category: category.slug }, { now: NOW, data }).then((result) => result.status === "ready" && result.totalResults > 0));
    } else if (category.level === 2) {
      assert.equal(parent?.level, 1);
      assert.ok(navigation.some((item) => item.id === parent?.id), `${category.id} has a visible root`);
    } else {
      assert.equal(parent?.level, 2);
      assert.ok(navigation.some((item) => item.id === parent?.id), `${category.id} has a visible subcategory`);
    }
  }

  const watch = navigation.find(({ slug }) => slug === "smart-watches");
  const powerBanks = navigation.find(({ slug }) => slug === "power-banks");
  assert.equal(byId.get(watch?.parentId ?? "")?.slug, "wearables");
  assert.equal(byId.get(powerBanks?.parentId ?? "")?.slug, "mobile-accessories");
});

test("homepage trending products preserve curated order and exclude duplicate, inactive, invalid, or unapproved items", async () => {
  const first = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  const second = products.find(({ id }) => id === "prod-smart-watch-series-5");
  const vendor = vendors.find(({ id }) => id === "vendor-tech-haven");
  assert.ok(first && second && vendor);
  const unapprovedVendor = { ...vendor, id: "vendor-pending", status: "pending" as const };
  const fixture = {
    products: [first, second, { ...second, id: "duplicate-product" }, { ...second, id: "inactive-product", status: "inactive" as const }, { ...second, id: "unapproved-product", vendorId: unapprovedVendor.id }, { ...second, id: "invalid-category-product", categoryId: "missing-category" }],
    vendors: [vendor, unapprovedVendor],
    categories,
    ids: [first.id, second.id, second.id, "inactive-product", "unapproved-product", "invalid-category-product"],
  };
  const result = await getTrendingProducts(NOW, fixture);
  assert.deepEqual(result.all.map(({ id }) => id), [first.id, second.id]);
  assert.deepEqual(result.all.map(({ slug }) => `/products/${slug}`), ["/products/wireless-earbuds-pro", "/products/smart-watch-series-5"]);
  assert.deepEqual(result.all.map(({ price }) => price), [2450, 3990]);
  assert.deepEqual((await getTrendingProducts(NOW, { ...fixture, ids: [] })).all, []);
});

test("homepage flash deals honor time windows, approved vendors, active products, sale pricing, and deterministic end time", async () => {
  const baseDeal = flashDeals.find(({ productId }) => productId === "prod-wireless-earbuds-pro");
  const activeProduct = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  const inactiveProduct = products.find(({ id }) => id === "prod-smart-watch-series-5");
  const soundVendor = vendors.find(({ id }) => id === "vendor-sound-wave");
  const approvedVendor = vendors.find(({ id }) => id === activeProduct?.vendorId);
  assert.ok(baseDeal && activeProduct && inactiveProduct && soundVendor && approvedVendor);
  const inactiveVendor = { ...soundVendor, status: "suspended" as const };
  const fixture = {
    products: [activeProduct, { ...inactiveProduct, status: "inactive" as const }, { ...activeProduct, id: "unapproved-product", vendorId: inactiveVendor.id }],
    vendors: [approvedVendor, { ...inactiveVendor, status: "suspended" as const }],
    deals: [
      { ...baseDeal, startsAt: "2026-11-10T12:00:00.000Z", endsAt: "2026-11-10T12:05:00.000Z" },
      { ...baseDeal, id: "expired", startsAt: "2026-11-10T11:00:00.000Z", endsAt: "2026-11-10T11:59:59.000Z" },
      { ...baseDeal, id: "future", startsAt: "2026-11-10T12:00:01.000Z", endsAt: "2026-11-10T12:05:00.000Z" },
      { ...baseDeal, id: "inactive", productId: inactiveProduct.id },
      { ...baseDeal, id: "unapproved", productId: "unapproved-product" },
      { ...baseDeal, id: "invalid-price", dealPrice: activeProduct.price + 10 },
    ],
  };
  const result = await getFlashDeals(NOW, fixture);
  assert.deepEqual(result.items.map(({ id }) => id), [activeProduct.id]);
  assert.equal(result.items[0]?.price, 2450);
  assert.equal(result.items[0]?.compareAtPrice, activeProduct.price);
  assert.equal(result.endsInSeconds, 300);
  assert.deepEqual(await getFlashDeals(NOW + 6 * 60 * 1000, fixture), { endsInSeconds: 0, items: [] });
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
