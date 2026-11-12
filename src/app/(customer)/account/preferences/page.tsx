"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, Check, RotateCcw, Save, X } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { saveCustomerPreferences, type CustomerPreferencesErrors } from "@/services/customer-preferences";
import { resetActiveCustomerDemoData } from "@/services/customer-demo-reset";
import { demoStateStore, selectActiveAccount, selectDemoSnapshot, selectHydrationReady } from "@/services/demo-state-store";
import { DEFAULT_DEMO_CUSTOMER_PREFERENCES, type DemoCustomerPreferences } from "@/types/demo-state";
import { showToast } from "@/services/toast";
import Link from "next/link";

export default function CustomerPreferencesPage() {
  const account = useDemoState(selectActiveAccount);
  const snapshot = useDemoState(selectDemoSnapshot);
  const ready = useDemoState(selectHydrationReady);
  const customer = account?.role === "customer" && account.customerId
    ? snapshot?.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id) ?? null
    : null;
  const [draft, setDraft] = useState<{ customerId: string; values: DemoCustomerPreferences }>(() => ({ customerId: customer?.id ?? "", values: customer?.preferences ?? { ...DEFAULT_DEMO_CUSTOMER_PREFERENCES } }));
  const [errors, setErrors] = useState<CustomerPreferencesErrors>({});
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const cancelResetRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!resetDialogOpen) return;
    cancelResetRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setResetDialogOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [resetDialogOpen]);

  if (!ready) return <section className="card min-w-0 p-5 sm:p-7" role="status">Loading your account preferences…</section>;
  if (!customer) return null;
  const activeCustomer = customer;
  const values = draft.customerId === activeCustomer.id ? draft.values : activeCustomer.preferences;
  function setValues(next: DemoCustomerPreferences) {
    setDraft({ customerId: activeCustomer.id, values: next });
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setBusy(true);
    const result = await saveCustomerPreferences(demoStateStore, activeCustomer.id, values);
    setBusy(false);
    if (!result.ok) {
      setErrors(result.errors ?? {});
      const message = result.reason === "customer_required"
        ? "Switch to a customer demo account before saving preferences."
        : result.reason === "persistence_unavailable"
          ? "Preferences couldn’t be saved because browser storage is unavailable. Your saved choices are unchanged."
          : "Preferences couldn’t be saved. Review the selections and try again.";
      setFeedback(message);
      showToast("error", message);
      return;
    }
    setValues(result.customer.preferences);
    setErrors({});
    setFeedback("Preferences saved in this browser.");
    showToast("success", "Preferences saved in this browser.");
  }

  async function confirmReset() {
    setBusy(true);
    setFeedback("");
    const result = await resetActiveCustomerDemoData(demoStateStore);
    setBusy(false);
    setResetDialogOpen(false);
    if (!result.ok) {
      const message = result.reason === "persistence_unavailable"
        ? "Reset couldn’t be saved because browser storage is unavailable. No reset was applied; try again when storage is available."
        : "Your demo data couldn’t be reset. No changes were applied; try again.";
      setFeedback(message);
      showToast("error", message);
      return;
    }
    setValues({ ...DEFAULT_DEMO_CUSTOMER_PREFERENCES });
    setErrors({});
    setFeedback("Your customer demo data has been reset in this browser.");
    showToast("success", "Your customer demo data has been reset in this browser.");
  }

  return (
    <section className="card min-w-0 p-5 sm:p-7" aria-labelledby="preferences-title">
      <h2 id="preferences-title" className="font-head text-xl font-bold sm:text-2xl">Account preferences</h2>
      <p className="mt-1 text-sm text-mute">Choose how your customer account appears while you shop.</p>
      <p className="mt-4 rounded-lg border border-info bg-info px-3 py-2 text-sm text-info-ink">These are local demo settings for this customer account. Promotional updates are a saved preference only; this demo never sends email, SMS, or push messages.</p>

      <form className="mt-6 max-w-2xl space-y-6" onSubmit={(event) => void savePreferences(event)}>
        <fieldset className="rounded-xl border border-line p-4 sm:p-5">
          <legend className="px-1 font-head text-lg font-bold">Promotional updates</legend>
          <label htmlFor="promotional-updates" className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
            <input id="promotional-updates" type="checkbox" className="size-5 accent-brand" checked={values.promotionalUpdates} aria-invalid={Boolean(errors.promotionalUpdates)} aria-describedby={errors.promotionalUpdates ? "promotional-updates-error" : "promotional-updates-help"} onChange={(event) => { setValues({ ...values, promotionalUpdates: event.target.checked }); setErrors((current) => ({ ...current, promotionalUpdates: undefined })); setFeedback(""); }} />
            Opt in to promotional updates in this demo
          </label>
          <p className="mt-1 text-sm text-mute">Saved state: <span className="font-bold text-ink">{activeCustomer.preferences.promotionalUpdates ? "Opted in" : "Opted out"}</span>. This checkbox stores your choice in this browser; it does not sign you up for messages.</p>
          {errors.promotionalUpdates && <p id="promotional-updates-error" role="alert" className="mt-1 text-sm text-sale">{errors.promotionalUpdates}</p>}
          <p id="promotional-updates-help" className="mt-1 text-sm text-mute">Only the saved choice appears above. No real offers or notifications will be delivered.</p>
        </fieldset>

        <fieldset className="rounded-xl border border-line p-4 sm:p-5" aria-describedby={errors.productGridDensity ? "grid-density-error" : "grid-density-help"}>
          <legend className="px-1 font-head text-lg font-bold">Product grid density</legend>
          <p id="grid-density-help" className="mt-1 text-sm text-mute">Choose how many products appear across catalog, category, and search listings. Both modes keep two readable columns on phones.</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm font-medium hover:bg-soft ${values.productGridDensity === "standard" ? "border-brand bg-brand-tint" : "border-line"}`}>
              <input type="radio" name="product-grid-density" value="standard" className="size-5 accent-brand" checked={values.productGridDensity === "standard"} onChange={() => { setValues({ ...values, productGridDensity: "standard" }); setErrors((current) => ({ ...current, productGridDensity: undefined })); setFeedback(""); }} />
              <span className="min-w-0"><span className="block font-bold">Standard grid</span><span className="mt-1 block text-xs font-normal text-mute">Larger cards · up to 4 columns</span><span aria-hidden="true" className="mt-3 grid max-w-40 grid-cols-2 gap-1"><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /></span></span>
            </label>
            <label className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm font-medium hover:bg-soft ${values.productGridDensity === "compact" ? "border-brand bg-brand-tint" : "border-line"}`}>
              <input type="radio" name="product-grid-density" value="compact" className="size-5 accent-brand" checked={values.productGridDensity === "compact"} onChange={() => { setValues({ ...values, productGridDensity: "compact" }); setErrors((current) => ({ ...current, productGridDensity: undefined })); setFeedback(""); }} />
              <span className="min-w-0"><span className="block font-bold">Compact grid</span><span className="mt-1 block text-xs font-normal text-mute">More cards · up to 5 columns</span><span aria-hidden="true" className="mt-3 grid max-w-40 grid-cols-4 gap-1"><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /><i className="aspect-square rounded border border-brand-border bg-white" /></span></span>
            </label>
          </div>
          {errors.productGridDensity && <p id="grid-density-error" role="alert" className="mt-2 text-sm text-sale">{errors.productGridDensity}</p>}
        </fieldset>

        <button type="submit" className="btn btn-primary btn-md" disabled={busy}>{busy ? "Saving…" : feedback.startsWith("Preferences saved") ? <><Check className="size-4" aria-hidden="true" /> Save preferences</> : <><Save className="size-4" aria-hidden="true" /> Save preferences</>}</button>
      </form>

      <Link href="/products" className="mt-4 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-bold text-brand-strong hover:bg-brand-tint">View products</Link>

      <section className="mt-8 max-w-2xl border-t border-line pt-6" aria-labelledby="demo-reset-title">
        <h3 id="demo-reset-title" className="font-head text-lg font-bold">Customer demo data</h3>
        <p className="mt-1 text-sm text-mute">Clear the local shopping activity and restore this customer’s demo profile and preferences.</p>
        <button type="button" className="btn btn-sale btn-md mt-4" disabled={busy} onClick={() => setResetDialogOpen(true)}>
          <RotateCcw className="size-4" aria-hidden="true" /> Reset my demo data
        </button>
      </section>

      {resetDialogOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setResetDialogOpen(false); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description" className="w-full max-w-lg rounded-2xl border border-line bg-canvas p-5 shadow-lg sm:p-6" onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blush text-sale-strong"><AlertTriangle className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <h3 id="reset-dialog-title" className="font-head text-lg font-bold">Reset your customer demo data?</h3>
              <p id="reset-dialog-description" className="mt-2 text-sm text-mute">This permanently erases these records from this browser for {activeCustomer.fullName}:</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm shrink-0" aria-label="Close reset dialog" disabled={busy} onClick={() => setResetDialogOpen(false)}><X className="size-4" aria-hidden="true" /></button>
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink">
            <li>Cart and wishlist items</li>
            <li>Recently viewed products</li>
            <li>Profile edits, saved addresses, and account preferences</li>
            <li>Customer demo orders and their vendor fulfillment groups and item snapshots</li>
            <li>Customer notifications and hidden-order settings</li>
          </ul>
          <p className="mt-3 rounded-lg border border-info bg-info px-3 py-2 text-sm text-info-ink">This is a local demo reset. Other customers, the catalog, and vendor/admin demo data are preserved.</p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button ref={cancelResetRef} type="button" className="btn btn-outline btn-md" disabled={busy} onClick={() => setResetDialogOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-sale btn-md" disabled={busy} onClick={() => void confirmReset()}>{busy ? "Resetting…" : "Permanently reset my data"}</button>
          </div>
        </section>
      </div>}
    </section>
  );
}
