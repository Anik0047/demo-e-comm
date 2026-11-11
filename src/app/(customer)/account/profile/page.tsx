"use client";

import { useState, type FormEvent } from "react";
import { Check, Save } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { updateCustomerProfile, validateCustomerProfile, type CustomerProfileInput } from "@/services/customer-profile";
import { demoStateStore, selectActiveAccount, selectDemoSnapshot, selectHydrationReady } from "@/services/demo-state-store";

export default function CustomerProfilePage() {
  const account = useDemoState(selectActiveAccount);
  const snapshot = useDemoState(selectDemoSnapshot);
  const ready = useDemoState(selectHydrationReady);
  const customer = account?.role === "customer" && account.customerId
    ? snapshot?.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id) ?? null
    : null;
  const [values, setValues] = useState<CustomerProfileInput>(() => ({ fullName: customer?.fullName ?? "", phone: customer?.phone ?? "" }));
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerProfileInput, string>>>({});
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(field: keyof CustomerProfileInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFeedback("");
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateField(field: keyof CustomerProfileInput) {
    const result = validateCustomerProfile(values);
    setErrors((current) => ({ ...current, [field]: result.ok ? undefined : result.errors[field] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    const validation = validateCustomerProfile(values);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    if (!customer) return;
    setBusy(true);
    const result = await updateCustomerProfile(demoStateStore, customer.id, validation.value);
    setBusy(false);
    if (!result.ok) {
      setFeedback(result.reason === "customer_required"
        ? "Switch to a customer demo account before saving profile details."
        : "Your profile couldn’t be saved. Check your details and try again.");
      if (result.errors) setErrors(result.errors);
      return;
    }
    setValues({ fullName: result.customer.fullName, phone: result.customer.phone });
    setFeedback(result.persisted
      ? "Profile updated."
      : "Profile updated for this session, but browser storage is unavailable.");
  }

  if (!ready) return <section className="card p-5 sm:p-7" role="status">Loading your profile…</section>;
  if (!customer || !account) return null;

  return (
    <section className="card p-5 sm:p-7" aria-labelledby="profile-title">
      <h2 id="profile-title" className="font-head text-xl font-bold sm:text-2xl">Edit profile</h2>
      <p className="mt-1 text-sm text-mute">Update the name and phone number on your customer account.</p>
      <form className="mt-6 max-w-xl space-y-5" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <label htmlFor="profile-name" className="mb-1.5 block text-sm font-bold">Full name</label>
          <input id="profile-name" name="fullName" className="input" autoComplete="name" maxLength={100} value={values.fullName} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "profile-name-error" : undefined} onChange={(event) => updateField("fullName", event.target.value)} onBlur={() => validateField("fullName")} />
          {errors.fullName && <p id="profile-name-error" role="alert" className="mt-1 text-sm text-sale">{errors.fullName}</p>}
        </div>
        <div>
          <label htmlFor="profile-email" className="mb-1.5 block text-sm font-bold">Email address</label>
          <input id="profile-email" className="input bg-soft text-mute" type="email" autoComplete="email" value={account.email} readOnly aria-describedby="profile-email-help" />
          <p id="profile-email-help" className="mt-1 text-sm text-mute">Email is read-only in the frontend demo.</p>
        </div>
        <div>
          <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-bold">Phone number</label>
          <input id="profile-phone" name="phone" className="input" type="tel" autoComplete="tel" inputMode="tel" maxLength={14} placeholder="01712345678" value={values.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "profile-phone-error" : "profile-phone-help"} onChange={(event) => updateField("phone", event.target.value)} onBlur={() => validateField("phone")} />
          {errors.phone ? <p id="profile-phone-error" role="alert" className="mt-1 text-sm text-sale">{errors.phone}</p> : <p id="profile-phone-help" className="mt-1 text-sm text-mute">Use a Bangladesh mobile number, such as 01712345678.</p>}
        </div>
        {feedback && <p role={feedback.startsWith("Profile updated") ? "status" : "alert"} aria-live="polite" className={`text-sm font-medium ${feedback.startsWith("Profile updated") ? "text-brand-strong" : "text-sale-strong"}`}>{feedback}</p>}
        <button type="submit" className="btn btn-primary btn-md" disabled={busy}>{busy ? "Saving…" : feedback.startsWith("Profile updated") ? <><Check className="size-4" aria-hidden="true" /> Save changes</> : <><Save className="size-4" aria-hidden="true" /> Save changes</>}</button>
      </form>
    </section>
  );
}
