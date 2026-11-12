import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import { calculateDemoCoupon, createShippingAddressSnapshot, getCheckoutEligibility, resolveCheckoutShippingSelection } from "@/services/checkout";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { flashDeals } from "@/data/flash-deals";

const NOW = Date.parse("2026-11-10T12:00:00.000Z");
const catalog = { products, vendors, deals: flashDeals };
const accountId = "account-customer-demo";

function snapshotWithCart(productLines: Array<{ productId: string; variantId?: string | null; quantity?: number }>) {
  const snapshot = createDemoSeedSnapshot();
  const cart = snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo");
  assert.ok(cart);
  cart.items = productLines.map(({ productId, variantId = null, quantity = 1 }, index) => ({
    id: `cart-line-${index}`,
    productId,
    variantId,
    quantity,
    addedAt: "2026-11-10T12:00:00.000Z",
  }));
  return snapshot;
}

test("checkout uses canonical variant and flash deal prices and splits item snapshots by product vendor", () => {
  const result = getCheckoutEligibility(snapshotWithCart([
    { productId: "prod-cotton-panjabi", variantId: "var-panjabi-m", quantity: 2 },
    { productId: "prod-wireless-earbuds-pro" },
  ]), accountId, catalog, NOW);
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.summary.lines[0]?.unitPrice, 1200);
  assert.equal(result.summary.lines[0]?.lineTotal, 2400);
  assert.equal(result.summary.lines[1]?.unitPrice, 2450);
  assert.equal(result.summary.subtotal, 4850);
  assert.equal(result.groups.length, 2);
  const panjabiVendorId = products.find(({ id }) => id === "prod-cotton-panjabi")?.vendorId;
  assert.ok(panjabiVendorId);
  const panjabiItems = result.groups.find(({ vendorId }) => vendorId === panjabiVendorId)?.items ?? [];
  assert.equal(panjabiItems.length, 1);
  assert.equal(panjabiItems[0]?.vendorId, panjabiVendorId);
  assert.equal(panjabiItems[0]?.productName, "Cotton Panjabi");
  assert.deepEqual(panjabiItems[0]?.selectedVariant, { id: "var-panjabi-m", optionValues: { Size: "M" } });
});

test("checkout safely rejects non-customer, empty, invalid variant, inactive product, and unavailable vendor carts", () => {
  assert.equal(getCheckoutEligibility(createDemoSeedSnapshot(), "account-admin-demo", catalog, NOW).status, "customer_required");
  assert.equal(getCheckoutEligibility(snapshotWithCart([]), accountId, catalog, NOW).status, "empty");
  assert.equal(getCheckoutEligibility(snapshotWithCart([{ productId: "prod-cotton-panjabi", variantId: "missing-variant" }]), accountId, catalog, NOW).status, "unavailable");

  const inactive = products.find(({ id }) => id === "prod-cotton-panjabi");
  assert.ok(inactive);
  const inactiveCatalog = { ...catalog, products: products.map((product) => product.id === inactive.id ? { ...product, status: "inactive" as const } : product) };
  assert.equal(getCheckoutEligibility(snapshotWithCart([{ productId: inactive.id, variantId: "var-panjabi-m" }]), accountId, inactiveCatalog, NOW).status, "unavailable");

  const unavailableVendorCatalog = { ...catalog, vendors: vendors.map((vendor) => vendor.id === inactive.vendorId ? { ...vendor, status: "suspended" as const } : vendor) };
  assert.equal(getCheckoutEligibility(snapshotWithCart([{ productId: inactive.id, variantId: "var-panjabi-m" }]), accountId, unavailableVendorCatalog, NOW).status, "unavailable");
});

test("checkout rejects a cart quantity that no longer fits inventory", () => {
  const result = getCheckoutEligibility(snapshotWithCart([{ productId: "prod-cotton-panjabi", variantId: "var-panjabi-m", quantity: 21 }]), accountId, catalog, NOW);
  assert.equal(result.status, "unavailable");
});

test("WELCOME200 applies a fixed discount to canonical eligible subtotal and rejects invalid, low, and redeemed uses", () => {
  const eligible = snapshotWithCart([{ productId: "prod-cotton-panjabi", variantId: "var-panjabi-m" }]);
  assert.deepEqual(calculateDemoCoupon(eligible, accountId, " welcome200 ", catalog, NOW), {
    ok: true,
    code: "WELCOME200",
    discount: 200,
    subtotal: 1200,
    cartKey: JSON.stringify([{ itemId: "cart-line-0", productId: "prod-cotton-panjabi", vendorId: "vendor-urban-fit", variantId: "var-panjabi-m", quantity: 1, unitPrice: 1200, lineTotal: 1200 }]),
    customerId: "customer-demo",
  });
  assert.deepEqual(calculateDemoCoupon(eligible, accountId, "NOTREAL", catalog, NOW), { ok: false, reason: "invalid_code" });
  const belowMinimum = snapshotWithCart([{ productId: "prod-wireless-earbuds-pro" }]);
  const lowPriceCatalog = {
    ...catalog,
    deals: [],
    products: products.map((product) => product.id === "prod-wireless-earbuds-pro" ? { ...product, price: 800 } : product),
  };
  assert.deepEqual(calculateDemoCoupon(belowMinimum, accountId, "WELCOME200", lowPriceCatalog, NOW), { ok: false, reason: "minimum_not_met" });
  eligible.data.orders.push({
    id: "used-coupon-order", orderNumber: "KN-USED", customerId: "customer-demo", fulfillmentGroupIds: [],
    shippingAddress: { id: "address", label: "Home", recipientName: "Demo", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Area", streetAddress: "Road", postalCode: null, isDefault: true },
    paymentMethod: "cash_on_delivery", paymentStatus: "pending", status: "placed", subtotal: 1200, shippingTotal: 0,
    discountTotal: 200, grandTotal: 1000, couponCode: "WELCOME200", placedAt: eligible.savedAt, updatedAt: eligible.savedAt,
  });
  assert.deepEqual(calculateDemoCoupon(eligible, accountId, "WELCOME200", catalog, NOW), { ok: false, reason: "already_redeemed" });
  assert.deepEqual(calculateDemoCoupon(eligible, "account-admin-demo", "WELCOME200", catalog, NOW), { ok: false, reason: "customer_required" });
});

test("shipping selection defaults to this customer's valid default and rejects stale or foreign addresses", () => {
  const snapshot = createDemoSeedSnapshot();
  const customer = snapshot.data.customers.find(({ id }) => id === "customer-demo");
  assert.ok(customer);
  const address = {
    id: "address-home", label: "Home" as const, recipientName: "Demo Customer", phone: "01712345678",
    division: "Dhaka", district: "Dhaka", area: "Dhanmondi", streetAddress: "House 1, Road 2",
    postalCode: "1205", isDefault: true,
  };
  customer.addresses = [address];
  const foreign = { ...address, id: "foreign-address", isDefault: true };
  snapshot.data.accounts.push({ id: "account-other-customer", email: "other@example.test", displayName: "Other Customer", role: "customer", customerId: "customer-other", vendorId: null, createdAt: "2026-01-01T00:00:00.000Z" });
  snapshot.data.customers.push({ ...customer, id: "customer-other", accountId: "account-other-customer", addresses: [foreign] });

  assert.equal(resolveCheckoutShippingSelection(snapshot, accountId, null).address?.id, address.id);
  assert.equal(resolveCheckoutShippingSelection(snapshot, accountId, "stale-address").address?.id, address.id);
  assert.equal(resolveCheckoutShippingSelection(snapshot, accountId, foreign.id).address?.id, address.id);
  assert.equal(resolveCheckoutShippingSelection(snapshot, "account-admin-demo", address.id).address, null);
});

test("order-time shipping snapshot copies and freezes the selected address values", () => {
  const address = {
    id: "address-home", label: "Home" as const, recipientName: "Demo Customer", phone: "01712345678",
    division: "Dhaka", district: "Dhaka", area: "Dhanmondi", streetAddress: "House 1, Road 2",
    postalCode: "1205", isDefault: true,
  };
  const snapshot = createShippingAddressSnapshot(address);
  address.streetAddress = "Edited later";
  assert.notEqual(snapshot, address);
  assert.equal(snapshot.streetAddress, "House 1, Road 2");
  assert.equal(Object.isFrozen(snapshot), true);
});
