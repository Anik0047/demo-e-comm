import { expect, test } from "@playwright/test";
import { products } from "@/data/products";
import { flashDeals } from "@/data/flash-deals";
import { vendors } from "@/data/vendors";
import { resolveEffectivePrice } from "@/services/effective-price";
import {
  addCartItem,
  clearCart,
  selectCartSummary,
  updateCartItemQuantity,
  removeCartItem,
} from "@/services/demo-cart";
import { createDemoStateStore } from "@/services/demo-state-store";
import { createLocalStorageDemoStateAdapter } from "@/services/demo-state-persistence";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import type { DemoStatePersistenceAdapter } from "@/types/demo-state";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

async function customerStore(adapter?: DemoStatePersistenceAdapter) {
  const store = createDemoStateStore(adapter ?? {
    read: async () => null,
    write: async () => undefined,
    clear: async () => undefined,
  });
  await store.getState().hydrate();
  const customerAccount = store.getState().snapshot.data.accounts.find(({ role }) => role === "customer");
  if (!customerAccount) throw new Error("Expected a seeded customer account");
  store.getState().setActiveAccount(customerAccount.id);
  return store;
}

function cartLines(store: Awaited<ReturnType<typeof customerStore>>) {
  const state = store.getState();
  return selectCartSummary(state.snapshot, state.activeAccountId);
}

test("adds, safely merges, updates, removes, and clears cart lines by product and variant", async () => {
  const store = await customerStore();
  const first = await addCartItem(store, { productId: "prod-cotton-panjabi", variantId: "var-panjabi-m", quantity: 2 });
  expect(first.ok).toBe(true);
  const merged = await addCartItem(store, { productId: "prod-cotton-panjabi", variantId: "var-panjabi-m", quantity: 1 });
  expect(merged.ok).toBe(true);
  expect(cartLines(store).lines).toHaveLength(1);
  expect(cartLines(store).lines[0]?.item.quantity).toBe(3);

  const separateVariant = await addCartItem(store, { productId: "prod-cotton-panjabi", variantId: "var-panjabi-l", quantity: 1 });
  expect(separateVariant.ok).toBe(true);
  expect(cartLines(store).lineCount).toBe(2);
  expect(cartLines(store).itemCount).toBe(4);
  expect(cartLines(store).subtotal).toBe(4800);

  const update = await updateCartItemQuantity(store, { productId: "prod-cotton-panjabi", variantId: "var-panjabi-m" }, 4);
  expect(update.ok).toBe(true);
  expect(cartLines(store).subtotal).toBe(6000);
  expect((await removeCartItem(store, { productId: "prod-cotton-panjabi", variantId: "var-panjabi-l" })).ok).toBe(true);
  expect(cartLines(store).lineCount).toBe(1);
  expect((await clearCart(store)).ok).toBe(true);
  expect(cartLines(store)).toMatchObject({ itemCount: 0, lineCount: 0, subtotal: 0 });
});

test("rejects unavailable products, unapproved vendors, missing variants, invalid quantities, and stock overflow", async () => {
  const store = await customerStore();
  const baseProduct = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  const baseVendor = vendors.find(({ id }) => id === "vendor-tech-haven");
  const variantProduct = products.find(({ id }) => id === "prod-cotton-panjabi");
  if (!baseProduct || !baseVendor || !variantProduct) throw new Error("Expected canonical catalog records");
  const inactiveProduct = { ...baseProduct, status: "inactive" as const };
  const suspendedVendor = { ...baseVendor, status: "suspended" as const };
  const lowStockProduct = { ...baseProduct, stock: 3 };

  expect(await addCartItem(store, { productId: inactiveProduct.id, quantity: 1 }, { products: [inactiveProduct], vendors: [baseVendor] })).toMatchObject({ ok: true, result: { ok: false, reason: "product_unavailable" } });
  expect(await addCartItem(store, { productId: baseProduct.id, quantity: 1 }, { products: [baseProduct], vendors: [suspendedVendor] })).toMatchObject({ ok: true, result: { ok: false, reason: "vendor_unavailable" } });
  expect(await addCartItem(store, { productId: "prod-cotton-panjabi", quantity: 1 })).toMatchObject({ ok: true, result: { ok: false, reason: "variant_required" } });
  expect(await addCartItem(store, { productId: baseProduct.id, quantity: 0 })).toMatchObject({ ok: true, result: { ok: false, reason: "invalid_quantity" } });
  const minimumTwoProduct = { ...baseProduct, minOrderQty: 2 };
  expect(await addCartItem(store, { productId: baseProduct.id, quantity: 1 }, { products: [minimumTwoProduct], vendors: [baseVendor] })).toMatchObject({ ok: true, result: { ok: false, reason: "below_minimum" } });
  expect(await addCartItem(store, { productId: baseProduct.id, quantity: 11 })).toMatchObject({ ok: true, result: { ok: false, reason: "above_maximum" } });
  expect(await addCartItem(store, { productId: baseProduct.id, quantity: 4 }, { products: [lowStockProduct], vendors: [baseVendor] })).toMatchObject({ ok: true, result: { ok: false, reason: "insufficient_stock" } });
  const lowStockVariantProduct = { ...variantProduct, variants: variantProduct.variants.map((variant) => variant.id === "var-panjabi-m" ? { ...variant, stock: 0 } : variant) };
  expect(await addCartItem(store, { productId: lowStockVariantProduct.id, variantId: "var-panjabi-m", quantity: 1 }, { products: [lowStockVariantProduct], vendors })).toMatchObject({ ok: true, result: { ok: false, reason: "insufficient_stock" } });
  expect(await addCartItem(store, { productId: "prod-cotton-panjabi", variantId: "missing", quantity: 1 })).toMatchObject({ ok: true, result: { ok: false, reason: "variant_unavailable" } });
  expect(cartLines(store).lineCount).toBe(0);
});

test("duplicate additions cannot push a line over the product maximum", async () => {
  const store = await customerStore();
  await addCartItem(store, { productId: "prod-wireless-earbuds-pro", quantity: 8 });
  const result = await addCartItem(store, { productId: "prod-wireless-earbuds-pro", quantity: 3 });
  expect(result).toMatchObject({ ok: true, result: { ok: false, reason: "above_maximum" } });
  expect(cartLines(store).lines[0]?.item.quantity).toBe(8);
});

test("derives current prices and presents changed products or variants as unavailable", async () => {
  const store = await customerStore();
  await addCartItem(store, { productId: "prod-cotton-panjabi", variantId: "var-panjabi-m", quantity: 2 });
  const state = store.getState();
  const activeProduct = products.find(({ id }) => id === "prod-cotton-panjabi");
  if (!activeProduct) throw new Error("Expected the canonical variant product");
  const repriced = { ...activeProduct, variants: activeProduct.variants.map((variant) => ({ ...variant, price: variant.price + 100 })) };
  expect(selectCartSummary(state.snapshot, state.activeAccountId, { products: [repriced], vendors }).subtotal).toBe(3400);

  const inactive = { ...repriced, status: "inactive" as const };
  expect(selectCartSummary(state.snapshot, state.activeAccountId, { products: [inactive], vendors }).lines[0]).toMatchObject({ available: false, issue: "product_unavailable", lineTotal: null });
  const variantRemoved = { ...activeProduct, variants: [] };
  expect(selectCartSummary(state.snapshot, state.activeAccountId, { products: [variantRemoved], vendors }).lines[0]).toMatchObject({ available: false, issue: "variant_unavailable" });
  const changedLimit = { ...activeProduct, maxOrderQty: 1 };
  expect(selectCartSummary(state.snapshot, state.activeAccountId, { products: [changedLimit], vendors }).lines[0]).toMatchObject({ available: false, issue: "above_maximum", lineTotal: null });
});

test("applies active flash prices consistently to cart lines, variants, and subtotals", async () => {
  const store = await customerStore();
  await addCartItem(store, { productId: "prod-wireless-earbuds-pro", quantity: 2 });
  await addCartItem(store, { productId: "prod-cotton-panjabi", variantId: "var-panjabi-m", quantity: 3 });
  const summary = cartLines(store);
  expect(summary.lines.map(({ unitPrice, lineTotal }) => ({ unitPrice, lineTotal }))).toEqual([
    { unitPrice: 2450, lineTotal: 4900 },
    { unitPrice: 1200, lineTotal: 3600 },
  ]);
  expect(summary.subtotal).toBe(8500);
});

test("flash deal pricing follows its start and expiration timestamps", () => {
  const product = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  if (!product) throw new Error("Expected the canonical earbuds product");
  const beforeStart = resolveEffectivePrice(product, null, flashDeals, true, Date.parse("2026-10-31T23:59:59.999Z"));
  const duringDeal = resolveEffectivePrice(product, null, flashDeals, true, Date.parse("2026-11-15T12:00:00.000Z"));
  const afterExpiration = resolveEffectivePrice(product, null, flashDeals, true, Date.parse("2026-12-01T00:00:00.000Z"));
  expect(beforeStart.price).toBe(3770);
  expect(duringDeal.price).toBe(2450);
  expect(afterExpiration.price).toBe(3770);
});

test("cart persists through store recreation and remains isolated by customer identity", async () => {
  const storage = memoryStorage();
  const firstStore = await customerStore(createLocalStorageDemoStateAdapter(storage));
  await addCartItem(firstStore, { productId: "prod-wireless-earbuds-pro", quantity: 2 });
  const restored = await customerStore(createLocalStorageDemoStateAdapter(storage));
  expect(cartLines(restored)).toMatchObject({ itemCount: 2, subtotal: 4900 });

  const snapshot = createDemoSeedSnapshot();
  snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
  snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
  snapshot.data.carts.push({ id: "cart-customer-second", customerId: "customer-second", items: [], updatedAt: snapshot.savedAt });
  const isolatedStore = createDemoStateStore({ read: async () => snapshot, write: async () => undefined, clear: async () => undefined });
  await isolatedStore.getState().hydrate();
  const originalCustomer = isolatedStore.getState().snapshot.data.accounts.find(({ role }) => role === "customer");
  if (!originalCustomer) throw new Error("Expected the seeded customer account");
  isolatedStore.getState().setActiveAccount(originalCustomer.id);
  await addCartItem(isolatedStore, { productId: "prod-wireless-earbuds-pro", quantity: 1 });
  isolatedStore.getState().setActiveAccount("account-customer-second");
  expect(cartLines(isolatedStore)).toMatchObject({ itemCount: 0, lineCount: 0 });
  await addCartItem(isolatedStore, { productId: "prod-wireless-earbuds-pro", quantity: 3 });
  expect(cartLines(isolatedStore).itemCount).toBe(3);
  isolatedStore.getState().setActiveAccount(originalCustomer.id);
  expect(cartLines(isolatedStore).itemCount).toBe(1);
  isolatedStore.getState().setActiveAccount("account-admin-demo");
  expect(await addCartItem(isolatedStore, { productId: "prod-wireless-earbuds-pro", quantity: 1 })).toMatchObject({ ok: true, result: { ok: false, reason: "customer_required" } });
});

test("cart operations are serialized so parallel additions still enforce limits", async () => {
  const store = await customerStore();
  const results = await Promise.all([
    addCartItem(store, { productId: "prod-wireless-earbuds-pro", quantity: 6 }),
    addCartItem(store, { productId: "prod-wireless-earbuds-pro", quantity: 6 }),
  ]);
  expect(results.filter((result) => result.ok && result.result.ok)).toHaveLength(1);
  expect(cartLines(store).lines[0]?.item.quantity).toBe(6);
});
