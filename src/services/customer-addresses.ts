import type { DemoStateStoreApi } from "@/services/demo-state-store";
import { isBangladeshMobileNumber } from "@/services/customer-validation";
import type { DemoAddress, DemoCustomer } from "@/types/demo-state";

export type CustomerAddressInput = Omit<DemoAddress, "id" | "isDefault"> & { isDefault: boolean };
export type CustomerAddressFieldErrors = Partial<Record<keyof CustomerAddressInput, string>>;

export type CustomerAddressValidation =
  | { ok: true; value: CustomerAddressInput }
  | { ok: false; errors: CustomerAddressFieldErrors };

export type CustomerAddressMutationResult =
  | { ok: true; persisted: boolean; customer: DemoCustomer; address?: DemoAddress }
  | { ok: false; reason: "not_hydrated" | "invalid_snapshot" | "customer_required" | "customer_missing" | "address_missing" | "invalid_input"; errors?: CustomerAddressFieldErrors };

type AddressTransactionResult =
  | { ok: false; reason: "customer_required" | "customer_missing" | "address_missing" }
  | { ok: true; customer: DemoCustomer; address?: DemoAddress };

const requiredText = (value: string) => value.trim();

export function validateCustomerAddress(input: CustomerAddressInput): CustomerAddressValidation {
  const value: CustomerAddressInput = {
    label: requiredText(input.label),
    recipientName: requiredText(input.recipientName),
    phone: requiredText(input.phone),
    division: requiredText(input.division),
    district: requiredText(input.district),
    area: requiredText(input.area),
    streetAddress: requiredText(input.streetAddress),
    postalCode: input.postalCode?.trim() || null,
    isDefault: input.isDefault,
  };
  const errors: CustomerAddressFieldErrors = {};

  if (!["Home", "Work", "Other"].includes(value.label)) errors.label = "Choose a label for this address.";
  if (value.recipientName.length < 2) errors.recipientName = "Enter a recipient name with at least 2 characters.";
  else if (value.recipientName.length > 100) errors.recipientName = "Recipient name must be 100 characters or fewer.";
  if (!isBangladeshMobileNumber(value.phone)) errors.phone = "Enter a valid Bangladesh mobile number, such as 01712345678.";
  if (value.division.length < 2) errors.division = "Enter a division.";
  else if (value.division.length > 60) errors.division = "Division must be 60 characters or fewer.";
  if (value.district.length < 2) errors.district = "Enter a district or city.";
  else if (value.district.length > 80) errors.district = "District or city must be 80 characters or fewer.";
  if (value.area.length < 2) errors.area = "Enter an area or upazila.";
  else if (value.area.length > 100) errors.area = "Area or upazila must be 100 characters or fewer.";
  if (value.streetAddress.length < 5) errors.streetAddress = "Enter a house, road, or street address.";
  else if (value.streetAddress.length > 200) errors.streetAddress = "Address line must be 200 characters or fewer.";
  if (value.postalCode && !/^\d{4}$/.test(value.postalCode)) errors.postalCode = "Postal code must contain 4 digits.";

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}

function addressId(): string {
  return `address-${globalThis.crypto.randomUUID()}`;
}

function normalizedDefaults(addresses: DemoAddress[], defaultId: string): DemoAddress[] {
  return addresses.map((address) => ({ ...address, isDefault: address.id === defaultId }));
}

async function transactAddress(
  store: DemoStateStoreApi,
  expectedCustomerId: string,
  transaction: (customer: DemoCustomer) => { customer: DemoCustomer | null; address?: DemoAddress },
): Promise<CustomerAddressMutationResult> {
  const result = await store.getState().transactSnapshot<AddressTransactionResult>((snapshot) => {
    const account = snapshot.data.accounts.find(({ id }) => id === store.getState().activeAccountId);
    if (account?.role !== "customer" || account.customerId !== expectedCustomerId) {
      return { snapshot: null, result: { ok: false, reason: "customer_required" } };
    }
    const customer = snapshot.data.customers.find(({ id, accountId }) => id === expectedCustomerId && accountId === account.id);
    if (!customer) return { snapshot: null, result: { ok: false, reason: "customer_missing" } };

    const update = transaction(customer);
    if (!update.customer) return { snapshot: null, result: { ok: false, reason: "address_missing" } };
    const updatedCustomer = update.customer;
    snapshot.data.customers = snapshot.data.customers.map((entry) => entry.id === customer.id ? updatedCustomer : entry);
    return { snapshot, result: { ok: true, customer: updatedCustomer, ...(update.address ? { address: update.address } : {}) } };
  });

  if (!result.ok) return result;
  if (!result.result.ok) return result.result;
  const { customer, address } = result.result;
  return { ok: true, persisted: result.persisted, customer, ...(address ? { address } : {}) };
}

export async function addCustomerAddress(
  store: DemoStateStoreApi,
  expectedCustomerId: string,
  input: CustomerAddressInput,
): Promise<CustomerAddressMutationResult> {
  const validation = validateCustomerAddress(input);
  if (!validation.ok) return { ok: false, reason: "invalid_input", errors: validation.errors };
  const id = addressId();
  return transactAddress(store, expectedCustomerId, (customer) => {
    const shouldDefault = validation.value.isDefault || customer.addresses.length === 0;
    const address: DemoAddress = { ...validation.value, id, isDefault: shouldDefault };
    const addresses = normalizedDefaults([...customer.addresses, address], shouldDefault ? id : customer.addresses.find(({ isDefault }) => isDefault)?.id ?? id);
    return { customer: { ...customer, addresses, updatedAt: new Date().toISOString() }, address };
  });
}

export async function updateCustomerAddress(
  store: DemoStateStoreApi,
  expectedCustomerId: string,
  addressIdToUpdate: string,
  input: CustomerAddressInput,
): Promise<CustomerAddressMutationResult> {
  const validation = validateCustomerAddress(input);
  if (!validation.ok) return { ok: false, reason: "invalid_input", errors: validation.errors };
  return transactAddress(store, expectedCustomerId, (customer) => {
    const current = customer.addresses.find(({ id }) => id === addressIdToUpdate);
    if (!current) return { customer: null };
    const address: DemoAddress = { ...validation.value, id: current.id, isDefault: false };
    const addresses = customer.addresses.map((entry) => entry.id === current.id ? address : entry);
    const currentDefault = customer.addresses.find(({ isDefault }) => isDefault);
    const defaultId = validation.value.isDefault
      ? address.id
      : currentDefault?.id === address.id
        ? addresses.find(({ id }) => id !== address.id)?.id ?? address.id
        : currentDefault?.id ?? address.id;
    const normalized = normalizedDefaults(addresses, defaultId);
    return { customer: { ...customer, addresses: normalized, updatedAt: new Date().toISOString() }, address: normalized.find(({ id }) => id === address.id) };
  });
}

export async function setDefaultCustomerAddress(
  store: DemoStateStoreApi,
  expectedCustomerId: string,
  addressIdToSet: string,
): Promise<CustomerAddressMutationResult> {
  return transactAddress(store, expectedCustomerId, (customer) => {
    if (!customer.addresses.some(({ id }) => id === addressIdToSet)) return { customer: null };
    const addresses = normalizedDefaults(customer.addresses, addressIdToSet);
    return { customer: { ...customer, addresses, updatedAt: new Date().toISOString() }, address: addresses.find(({ id }) => id === addressIdToSet) };
  });
}

export async function deleteCustomerAddress(
  store: DemoStateStoreApi,
  expectedCustomerId: string,
  addressIdToDelete: string,
): Promise<CustomerAddressMutationResult> {
  return transactAddress(store, expectedCustomerId, (customer) => {
    const address = customer.addresses.find(({ id }) => id === addressIdToDelete);
    if (!address) return { customer: null };
    const remaining = customer.addresses.filter(({ id }) => id !== addressIdToDelete);
    const currentDefault = customer.addresses.find(({ isDefault }) => isDefault);
    const defaultId = currentDefault?.id === address.id
      ? remaining[0]?.id
      : currentDefault?.id ?? remaining[0]?.id;
    const addresses = defaultId ? normalizedDefaults(remaining, defaultId) : remaining;
    return { customer: { ...customer, addresses, updatedAt: new Date().toISOString() } };
  });
}
