"use client";

import { useState, type FormEvent } from "react";
import { Check, Save } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { saveCustomerPreferences, type CustomerPreferencesErrors } from "@/services/customer-preferences";
import { demoStateStore, selectActiveAccount, selectDemoSnapshot, selectHydrationReady } from "@/services/demo-state-store";
import { DEFAULT_DEMO_CUSTOMER_PREFERENCES, type DemoCustomerPreferences } from "@/types/demo-state";

export default function CustomerPreferencesPage() {
  const account = useDemoState(selectActiveAccount);
  const snapshot = useDemoState(selectDemoSnapshot);
  const ready = useDemoState(selectHydrationReady);
  const customer = account?.role === "customer" && account.customerId
    ? snapshot?.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id) ?? null
    : null;
  const [values, setValues] = useState<DemoCustomerPreferences>(() => customer?.preferences ?? { ...DEFAULT_DEMO_CUSTOMER_PREFERENCES });
  const [errors, setErrors] = useState<CustomerPreferencesErrors>({});
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return <section className="card min-w-0 p-5 sm:p-7" role="status">Loading your account preferences…</section>;
  if (!customer) return null;
  const activeCustomer = customer;

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setBusy(true);
    const result = await saveCustomerPreferences(demoStateStore, activeCustomer.id, values);
    setBusy(false);
    if (!result.ok) {
      setErrors(result.errors ?? {});
      setFeedback(result.reason === "customer_required"
        ? "Switch to a customer demo account before saving preferences."
        : "Preferences couldn’t be saved. Review the selections and try again.");
      return;
    }
    setValues(result.customer.preferences);
    setErrors({});
    setFeedback(result.persisted
      ? "Preferences saved in this browser."
      : "Preferences saved for this session, but browser storage is unavailable.");
  }

  return (
    <section className="card min-w-0 p-5 sm:p-7" aria-labelledby="preferences-title">
      <h2 id="preferences-title" className="font-head text-xl font-bold sm:text-2xl">Account preferences</h2>
      <p className="mt-1 text-sm text-mute">Choose how your customer account appears while you shop.</p>
      <p className="mt-4 rounded-lg border border-info bg-info px-3 py-2 text-sm text-info-ink">These are local demo settings for this customer account. No emails, texts, or push notifications are sent.</p>

      <form className="mt-6 max-w-2xl space-y-6" onSubmit={(event) => void savePreferences(event)}>
        <fieldset className="rounded-xl border border-line p-4 sm:p-5">
          <legend className="px-1 font-head text-lg font-bold">Promotional updates</legend>
          <label htmlFor="promotional-updates" className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
            <input id="promotional-updates" type="checkbox" className="size-5 accent-brand" checked={values.promotionalUpdates} aria-invalid={Boolean(errors.promotionalUpdates)} aria-describedby={errors.promotionalUpdates ? "promotional-updates-error" : "promotional-updates-help"} onChange={(event) => { setValues((current) => ({ ...current, promotionalUpdates: event.target.checked })); setErrors((current) => ({ ...current, promotionalUpdates: undefined })); setFeedback(""); }} />
            Save my opt-in choice for offers and promotions
          </label>
          {errors.promotionalUpdates ? <p id="promotional-updates-error" role="alert" className="mt-1 text-sm text-sale">{errors.promotionalUpdates}</p> : <p id="promotional-updates-help" className="mt-1 text-sm text-mute">This records your preference only. It does not subscribe you to a messaging service.</p>}
        </fieldset>

        <fieldset className="rounded-xl border border-line p-4 sm:p-5" aria-describedby={errors.productGridDensity ? "grid-density-error" : "grid-density-help"}>
          <legend className="px-1 font-head text-lg font-bold">Product grid density</legend>
          <p id="grid-density-help" className="mt-1 text-sm text-mute">Choose how many products appear across wide catalog pages.</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-soft">
              <input type="radio" name="product-grid-density" value="standard" className="size-5 accent-brand" checked={values.productGridDensity === "standard"} onChange={() => { setValues((current) => ({ ...current, productGridDensity: "standard" })); setErrors((current) => ({ ...current, productGridDensity: undefined })); setFeedback(""); }} />
              Standard grid
            </label>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-soft">
              <input type="radio" name="product-grid-density" value="compact" className="size-5 accent-brand" checked={values.productGridDensity === "compact"} onChange={() => { setValues((current) => ({ ...current, productGridDensity: "compact" })); setErrors((current) => ({ ...current, productGridDensity: undefined })); setFeedback(""); }} />
              Compact grid
            </label>
          </div>
          {errors.productGridDensity && <p id="grid-density-error" role="alert" className="mt-2 text-sm text-sale">{errors.productGridDensity}</p>}
        </fieldset>

        {feedback && <p role={feedback.includes("couldn’t") || feedback.startsWith("Switch") ? "alert" : "status"} aria-live="polite" className={`text-sm font-medium ${feedback.includes("couldn’t") || feedback.startsWith("Switch") ? "text-sale-strong" : "text-brand-strong"}`}>{feedback}</p>}
        <button type="submit" className="btn btn-primary btn-md" disabled={busy}>{busy ? "Saving…" : feedback.startsWith("Preferences saved") ? <><Check className="size-4" aria-hidden="true" /> Save preferences</> : <><Save className="size-4" aria-hidden="true" /> Save preferences</>}</button>
      </form>
    </section>
  );
}
