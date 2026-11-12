import type { DemoStateStoreApi } from "@/services/demo-state-store";
import type { DemoCustomer, DemoCustomerPreferences } from "@/types/demo-state";

export type CustomerPreferencesInput = DemoCustomerPreferences;
export type CustomerPreferencesErrors = Partial<Record<keyof CustomerPreferencesInput, string>>;

export type CustomerPreferencesValidation =
  | { ok: true; value: CustomerPreferencesInput }
  | { ok: false; errors: CustomerPreferencesErrors };

export type CustomerPreferencesSaveResult =
  | { ok: true; persisted: boolean; customer: DemoCustomer }
  | { ok: false; reason: "not_hydrated" | "invalid_snapshot" | "persistence_unavailable" | "customer_required" | "customer_missing" | "invalid_input"; errors?: CustomerPreferencesErrors };

type PreferencesTransactionResult =
  | { ok: false; reason: "customer_required" | "customer_missing" }
  | { ok: true; customer: DemoCustomer };

export function validateCustomerPreferences(input: unknown): CustomerPreferencesValidation {
  const values = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const errors: CustomerPreferencesErrors = {};
  if (typeof values.promotionalUpdates !== "boolean") errors.promotionalUpdates = "Choose whether promotional updates are enabled.";
  if (values.productGridDensity !== "standard" && values.productGridDensity !== "compact") {
    errors.productGridDensity = "Choose a supported product grid density.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      promotionalUpdates: values.promotionalUpdates as boolean,
      productGridDensity: values.productGridDensity as CustomerPreferencesInput["productGridDensity"],
    },
  };
}

/** Stores customer choices locally; it does not send messages or change the active account. */
export async function saveCustomerPreferences(
  store: DemoStateStoreApi,
  expectedCustomerId: string,
  input: unknown,
): Promise<CustomerPreferencesSaveResult> {
  const validation = validateCustomerPreferences(input);
  if (!validation.ok) return { ok: false, reason: "invalid_input", errors: validation.errors };

  const result = await store.getState().transactSnapshot<PreferencesTransactionResult>((snapshot) => {
    const account = snapshot.data.accounts.find(({ id }) => id === store.getState().activeAccountId);
    if (account?.role !== "customer" || account.customerId !== expectedCustomerId) {
      return { snapshot: null, result: { ok: false, reason: "customer_required" } };
    }
    const customer = snapshot.data.customers.find(({ id, accountId }) => id === expectedCustomerId && accountId === account.id);
    if (!customer) return { snapshot: null, result: { ok: false, reason: "customer_missing" } };

    const updatedCustomer = {
      ...customer,
      preferences: validation.value,
      updatedAt: new Date().toISOString(),
    };
    snapshot.data.customers = snapshot.data.customers.map((entry) => entry.id === customer.id ? updatedCustomer : entry);
    return { snapshot, result: { ok: true, customer: updatedCustomer } };
  }, { requirePersistence: true });

  if (!result.ok) return result;
  if (!result.result.ok) return result.result;
  return { ok: true, persisted: result.persisted, customer: result.result.customer };
}
