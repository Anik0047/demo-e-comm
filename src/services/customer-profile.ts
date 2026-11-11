import type { DemoStateStoreApi } from "@/services/demo-state-store";
import { isBangladeshMobileNumber } from "@/services/customer-validation";
import type { DemoCustomer } from "@/types/demo-state";

export interface CustomerProfileInput {
  fullName: string;
  phone: string;
}

export type CustomerProfileValidation = {
  ok: true;
  value: CustomerProfileInput;
} | {
  ok: false;
  errors: Partial<Record<keyof CustomerProfileInput, string>>;
};

export type CustomerProfileUpdateResult =
  | { ok: true; persisted: boolean; customer: DemoCustomer }
  | { ok: false; reason: "not_hydrated" | "invalid_snapshot" | "customer_required" | "customer_missing" | "invalid_input"; errors?: Partial<Record<keyof CustomerProfileInput, string>> };

type ProfileTransactionResult =
  | { ok: false; reason: "customer_required" | "customer_missing" }
  | { ok: true; customer: DemoCustomer };

export function validateCustomerProfile(input: CustomerProfileInput): CustomerProfileValidation {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const errors: Partial<Record<keyof CustomerProfileInput, string>> = {};

  if (fullName.length < 2) errors.fullName = "Enter a name with at least 2 characters.";
  else if (fullName.length > 100) errors.fullName = "Name must be 100 characters or fewer.";

  if (!isBangladeshMobileNumber(phone)) {
    errors.phone = "Enter a valid Bangladesh mobile number, such as 01712345678.";
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { fullName, phone } };
}

/** Updates only the active customer's canonical record and its linked demo account label. */
export async function updateCustomerProfile(
  store: DemoStateStoreApi,
  expectedCustomerId: string,
  input: CustomerProfileInput,
): Promise<CustomerProfileUpdateResult> {
  const validation = validateCustomerProfile(input);
  if (!validation.ok) return { ok: false, reason: "invalid_input", errors: validation.errors };

  const result = await store.getState().transactSnapshot<ProfileTransactionResult>((snapshot) => {
    const account = snapshot.data.accounts.find(({ id }) => id === store.getState().activeAccountId);
    if (account?.role !== "customer" || !account.customerId || account.customerId !== expectedCustomerId) {
      return { snapshot: null, result: { ok: false as const, reason: "customer_required" as const } };
    }

    const customer = snapshot.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id);
    if (!customer) return { snapshot: null, result: { ok: false as const, reason: "customer_missing" as const } };

    const updatedAt = new Date().toISOString();
    const nextCustomer = { ...customer, ...validation.value, updatedAt };
    snapshot.data.customers = snapshot.data.customers.map((entry) => entry.id === customer.id ? nextCustomer : entry);
    snapshot.data.accounts = snapshot.data.accounts.map((entry) => entry.id === account.id
      ? { ...entry, displayName: validation.value.fullName }
      : entry);
    return { snapshot, result: { ok: true as const, customer: nextCustomer } };
  });

  if (!result.ok) return result;
  if (!result.result.ok) return result.result;
  return { ok: true, persisted: result.persisted, customer: result.result.customer };
}
