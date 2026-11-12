import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { products } from "@/data/products";
import { addComparisonProduct, normalizeComparisonIds, removeComparisonProduct } from "@/lib/product-comparison-state";
import { getComparableProductCatalog, getComparableProductIds, getComparableProducts } from "@/services/product-comparison";

const validIds = getComparableProductIds();

test("comparison selection deduplicates, keeps canonical products, and enforces three products", () => {
  const first = addComparisonProduct([], "prod-wireless-earbuds-pro", validIds);
  assert.deepEqual(first, { ok: true, ids: ["prod-wireless-earbuds-pro"] });
  assert.deepEqual(addComparisonProduct(first.ok ? first.ids : [], "prod-wireless-earbuds-pro", validIds), first);
  const second = addComparisonProduct(first.ok ? first.ids : [], "prod-smart-watch-series-5", validIds);
  const third = addComparisonProduct(second.ok ? second.ids : [], "prod-cotton-panjabi", validIds);
  assert.equal(third.ok, true);
  assert.deepEqual(addComparisonProduct(third.ok ? third.ids : [], "prod-nonstick-cookware-set", validIds), { ok: false, reason: "limit" });
  assert.deepEqual(addComparisonProduct([], "not-canonical", validIds), { ok: false, reason: "unavailable" });
});

test("stored IDs normalize against active canonical products and support removal", () => {
  const normalized = normalizeComparisonIds(["prod-wireless-earbuds-pro", "inactive", "prod-wireless-earbuds-pro", 3, "prod-smart-watch-series-5"], validIds);
  assert.deepEqual(normalized, ["prod-wireless-earbuds-pro", "prod-smart-watch-series-5"]);
  assert.deepEqual(removeComparisonProduct(normalized, "prod-wireless-earbuds-pro"), ["prod-smart-watch-series-5"]);
  assert.deepEqual(normalizeComparisonIds("bad storage", validIds), []);
});

test("comparison resolves current canonical prices, orderable stock, category, vendor, and specifications", () => {
  const canonicalIds = [...getComparableProductIds()];
  for (let index = 0; index < canonicalIds.length; index += 3) {
    const selection = canonicalIds.slice(index, index + 3);
    assert.deepEqual(getComparableProducts(selection).map(({ id }) => id), selection);
  }
  const items = getComparableProducts(["prod-wireless-earbuds-pro", "prod-cotton-panjabi"], Date.parse("2026-11-10T12:00:00.000Z"));
  assert.equal(items[0]?.price, 2450);
  assert.equal(items[0]?.vendorName, "TechHaven");
  assert.equal(items[0]?.inStock, true);
  assert.equal(items[0]?.categoryName, "Wireless earbuds");
  assert.ok(items[1]?.specifications.some(({ label }) => label === "Material"));

  assert.ok(products.some(({ id }) => id === "prod-double-door-refrigerator"));
  assert.equal(getComparableProducts(["prod-double-door-refrigerator"])[0]?.inStock, false);
});

test("the comparison page catalog resolves products beyond the three-selection limit", () => {
  const catalog = getComparableProductCatalog();
  assert.ok(catalog.length > 3);
  assert.deepEqual(catalog.slice(0, 3).map(({ id }) => id), [
    "prod-wireless-earbuds-pro",
    "prod-smart-watch-series-5",
    "prod-cotton-panjabi",
  ]);
  assert.equal(catalog.find(({ id }) => id === "prod-bluetooth-speaker")?.name, "Bluetooth Speaker");
});
