import type { Category } from "@/types/category";
import type { Product, ProductStatus } from "@/types/product";
import type { Vendor, VendorStatus } from "@/types/vendor";

export type DemoId = string;
export type ISODateTime = string;

export type DemoAccountRole = "customer" | "vendor" | "admin";
export interface DemoAccount {
  id: DemoId;
  email: string;
  displayName: string;
  role: DemoAccountRole;
  customerId: DemoId | null;
  vendorId: DemoId | null;
  createdAt: ISODateTime;
}

export interface DemoCustomer {
  id: DemoId;
  accountId: DemoId;
  fullName: string;
  phone: string;
  addresses: DemoAddress[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
export interface DemoAddress {
  id: DemoId;
  label: string;
  recipientName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  streetAddress: string;
  postalCode: string | null;
  isDefault: boolean;
}

export interface DemoCart {
  id: DemoId;
  customerId: DemoId;
  items: DemoCartItem[];
  updatedAt: ISODateTime;
}
export interface DemoCartItem {
  id: DemoId;
  productId: Product["id"];
  variantId: string | null;
  quantity: number;
  addedAt: ISODateTime;
}
export interface DemoWishlist {
  id: DemoId;
  customerId: DemoId;
  productIds: Product["id"][];
  updatedAt: ISODateTime;
}

export type DemoOrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
export type DemoPaymentMethod = "cash_on_delivery" | "bkash" | "nagad" | "card";
export type DemoPaymentStatus = "pending" | "paid" | "failed" | "refunded";
export interface DemoOrder {
  id: DemoId;
  orderNumber: string;
  customerId: DemoId;
  fulfillmentGroupIds: DemoId[];
  shippingAddress: DemoAddress;
  paymentMethod: DemoPaymentMethod;
  paymentStatus: DemoPaymentStatus;
  status: DemoOrderStatus;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  placedAt: ISODateTime;
  updatedAt: ISODateTime;
}
export type DemoFulfillmentStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
export interface DemoVendorFulfillmentGroup {
  id: DemoId;
  orderId: DemoOrder["id"];
  vendorId: Vendor["id"];
  itemIds: DemoOrderItem["id"][];
  status: DemoFulfillmentStatus;
  trackingNumber: string | null;
  updatedAt: ISODateTime;
}
export interface DemoOrderItem {
  id: DemoId;
  fulfillmentGroupId: DemoVendorFulfillmentGroup["id"];
  productId: Product["id"];
  variantId: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type DemoNotificationKind = "order" | "account" | "promotion" | "vendor" | "system";
export interface DemoNotification {
  id: DemoId;
  recipientAccountId: DemoAccount["id"];
  kind: DemoNotificationKind;
  title: string;
  message: string;
  href: string | null;
  readAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export type ManagedBannerPlacement = "home_hero" | "home_promo" | "category";
export interface ManagedBanner {
  id: DemoId;
  placement: ManagedBannerPlacement;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string;
  href: string;
  startsAt: ISODateTime | null;
  endsAt: ISODateTime | null;
  enabled: boolean;
  sortOrder: number;
  updatedAt: ISODateTime;
}

/** Product approval: draft -> pending_review -> active or rejected; rejected/inactive can be resubmitted. */
export type ProductApprovalTransition = Readonly<Record<ProductStatus, readonly ProductStatus[]>>;
export const PRODUCT_APPROVAL_TRANSITIONS: ProductApprovalTransition = {
  draft: ["pending_review"],
  pending_review: ["active", "rejected", "draft"],
  active: ["inactive", "pending_review"],
  rejected: ["draft", "pending_review"],
  inactive: ["pending_review", "draft"],
};

/** Registration creates a pending vendor; admin approval/rejection follows VendorStatus. */
export type VendorRegistrationStatus = Extract<VendorStatus, "pending" | "approved" | "rejected">;
export const VENDOR_REGISTRATION_TRANSITIONS: Readonly<Record<VendorRegistrationStatus, readonly VendorRegistrationStatus[]>> = {
  pending: ["approved", "rejected"],
  approved: [],
  rejected: ["pending"],
};

/** A placed order snapshots address and money, splits by vendor, then reserves tracked stock. */
export interface OrderPlacementRule {
  customerMustExist: true;
  onlyActiveProducts: true;
  onlyApprovedVendors: true;
  enforceMinimumAndMaximumQuantity: true;
  rejectInsufficientTrackedInventory: true;
  snapshotPriceNameSkuAndAddress: true;
  createOneFulfillmentGroupPerVendor: true;
}
export const ORDER_PLACEMENT_RULE: OrderPlacementRule = {
  customerMustExist: true,
  onlyActiveProducts: true,
  onlyApprovedVendors: true,
  enforceMinimumAndMaximumQuantity: true,
  rejectInsufficientTrackedInventory: true,
  snapshotPriceNameSkuAndAddress: true,
  createOneFulfillmentGroupPerVendor: true,
};

/** Tracked stock decrements atomically at placement; cancellation/return restores it once. */
export type InventoryTransition =
  | { event: "order_placed"; productId: Product["id"]; quantity: number; trackInventory: true; delta: number }
  | { event: "order_cancelled" | "order_returned"; productId: Product["id"]; quantity: number; trackInventory: true; delta: number }
  | { event: "untracked_product_ordered"; productId: Product["id"]; quantity: number; trackInventory: false; delta: 0 };

/** Canonical catalog records are referenced here only; they remain owned by catalog services. */
export interface DemoCatalogReferences {
  products: readonly Product[];
  vendors: readonly Vendor[];
  categories: readonly Category[];
}

export interface DemoStateData {
  accounts: DemoAccount[];
  customers: DemoCustomer[];
  carts: DemoCart[];
  wishlists: DemoWishlist[];
  orders: DemoOrder[];
  orderItems: DemoOrderItem[];
  fulfillmentGroups: DemoVendorFulfillmentGroup[];
  notifications: DemoNotification[];
  managedBanners: ManagedBanner[];
}

export const DEMO_STATE_SCHEMA_VERSION = 1;
export const DEMO_SEED_VERSION = 1;
export interface DemoStateSnapshot {
  schemaVersion: number;
  seedVersion: number;
  savedAt: ISODateTime;
  data: DemoStateData;
}

/** Persistence boundary only. Implementations may later use browser storage or a remote API. */
export interface DemoStatePersistenceAdapter {
  read(): Promise<DemoStateSnapshot | null>;
  write(snapshot: DemoStateSnapshot): Promise<void>;
  clear(): Promise<void>;
}

/** Reset discards every mutable demo record and recreates the current seed, clearing persisted data. */
export type DemoResetMode = "restore_current_seed";
export interface DemoResetRule {
  mode: DemoResetMode;
  clearPersistedSnapshot: true;
  restoreSeedVersion: typeof DEMO_SEED_VERSION;
}
export const DEMO_RESET_RULE: DemoResetRule = {
  mode: "restore_current_seed",
  clearPersistedSnapshot: true,
  restoreSeedVersion: DEMO_SEED_VERSION,
};

/** Exact versions load normally; older schemas require migration; unknown/future seeds reset to current seed. */
export type DemoSnapshotCompatibility =
  | { kind: "compatible"; snapshot: DemoStateSnapshot }
  | { kind: "migrate_schema"; fromSchemaVersion: number; toSchemaVersion: typeof DEMO_STATE_SCHEMA_VERSION }
  | { kind: "reset_seed"; reason: "older_seed" | "future_seed" | "future_schema" | "invalid_version" };

export function classifyDemoSnapshot(snapshot: Pick<DemoStateSnapshot, "schemaVersion" | "seedVersion">): DemoSnapshotCompatibility {
  if (!Number.isSafeInteger(snapshot.schemaVersion) || !Number.isSafeInteger(snapshot.seedVersion) || snapshot.schemaVersion < 1 || snapshot.seedVersion < 1) {
    return { kind: "reset_seed", reason: "invalid_version" };
  }
  if (snapshot.schemaVersion > DEMO_STATE_SCHEMA_VERSION) return { kind: "reset_seed", reason: "future_schema" };
  if (snapshot.seedVersion !== DEMO_SEED_VERSION) {
    return { kind: "reset_seed", reason: snapshot.seedVersion < DEMO_SEED_VERSION ? "older_seed" : "future_seed" };
  }
  if (snapshot.schemaVersion < DEMO_STATE_SCHEMA_VERSION) {
    return { kind: "migrate_schema", fromSchemaVersion: snapshot.schemaVersion, toSchemaVersion: DEMO_STATE_SCHEMA_VERSION };
  }
  return { kind: "compatible", snapshot: snapshot as DemoStateSnapshot };
}

export interface DemoStateValidationIssue {
  code: "duplicate_id" | "missing_reference" | "invalid_quantity";
  entity: string;
  id: string;
  reference?: string;
}
export interface DemoStateValidation { valid: boolean; issues: DemoStateValidationIssue[] }

/** Focused referential-integrity checks for normalized demo records. */
export function validateDemoState(data: DemoStateData): DemoStateValidation {
  const issues: DemoStateValidationIssue[] = [];
  const ids = new Map<string, Set<string>>();
  const unique = (entity: string, values: readonly { id: string }[]) => {
    const found = new Set<string>();
    ids.set(entity, found);
    for (const value of values) {
      if (found.has(value.id)) issues.push({ code: "duplicate_id", entity, id: value.id });
      found.add(value.id);
    }
  };
  unique("account", data.accounts); unique("customer", data.customers); unique("cart", data.carts);
  unique("wishlist", data.wishlists); unique("order", data.orders); unique("orderItem", data.orderItems);
  unique("fulfillmentGroup", data.fulfillmentGroups); unique("notification", data.notifications); unique("banner", data.managedBanners);
  const has = (entity: string, id: string) => ids.get(entity)?.has(id) ?? false;
  const ref = (entity: string, id: string, target: string) => { if (!has(target, id)) issues.push({ code: "missing_reference", entity, id, reference: `${target}:${id}` }); };
  for (const customer of data.customers) ref("customer", customer.accountId, "account");
  for (const account of data.accounts) {
    if (account.customerId) ref("account", account.customerId, "customer");
  }
  for (const cart of data.carts) {
    ref("cart", cart.customerId, "customer");
    for (const item of cart.items) if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) issues.push({ code: "invalid_quantity", entity: "cartItem", id: item.id });
  }
  for (const wishlist of data.wishlists) ref("wishlist", wishlist.customerId, "customer");
  for (const order of data.orders) {
    ref("order", order.customerId, "customer");
    for (const groupId of order.fulfillmentGroupIds) ref("order", groupId, "fulfillmentGroup");
  }
  for (const group of data.fulfillmentGroups) {
    ref("fulfillmentGroup", group.orderId, "order");
    for (const itemId of group.itemIds) ref("fulfillmentGroup", itemId, "orderItem");
  }
  for (const item of data.orderItems) ref("orderItem", item.fulfillmentGroupId, "fulfillmentGroup");
  for (const notification of data.notifications) ref("notification", notification.recipientAccountId, "account");
  return { valid: issues.length === 0, issues };
}
