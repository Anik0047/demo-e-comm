"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import {
  addCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  updateCustomerAddress,
  validateCustomerAddress,
  type CustomerAddressFieldErrors,
  type CustomerAddressInput,
} from "@/services/customer-addresses";
import { demoStateStore, selectActiveAccount, selectDemoSnapshot, selectHydrationReady } from "@/services/demo-state-store";
import { showToast } from "@/services/toast";

const emptyAddress: CustomerAddressInput = {
  label: "Home",
  recipientName: "",
  phone: "",
  division: "",
  district: "",
  area: "",
  streetAddress: "",
  postalCode: null,
  isDefault: false,
};

export default function CustomerAddressesPage() {
  const router = useRouter();
  const account = useDemoState(selectActiveAccount);
  const snapshot = useDemoState(selectDemoSnapshot);
  const ready = useDemoState(selectHydrationReady);
  const customer = account?.role === "customer" && account.customerId
    ? snapshot?.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id) ?? null
    : null;
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [values, setValues] = useState<CustomerAddressInput>(emptyAddress);
  const [errors, setErrors] = useState<CustomerAddressFieldErrors>({});
  const [busy, setBusy] = useState(false);

  if (!ready) return <section className="card min-w-0 p-5 sm:p-7" role="status">Loading your saved addresses…</section>;
  if (!customer) return null;
  const activeCustomer = customer;

  function openAddForm() {
    setEditingAddressId(null);
    setValues({ ...emptyAddress, recipientName: activeCustomer.fullName, phone: activeCustomer.phone });
    setErrors({});
    setFormOpen(true);
  }

  function openEditForm(addressId: string) {
    const address = activeCustomer.addresses.find(({ id }) => id === addressId);
    if (!address) return;
    setEditingAddressId(address.id);
    setValues({ ...address });
    setErrors({});
    setFormOpen(true);
  }

  function changeField(field: keyof CustomerAddressInput, value: string | boolean | null) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateField(field: keyof CustomerAddressInput) {
    const validation = validateCustomerAddress(values);
    setErrors((current) => ({ ...current, [field]: validation.ok ? undefined : validation.errors[field] }));
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateCustomerAddress(values);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    setBusy(true);
    const result = editingAddressId
      ? await updateCustomerAddress(demoStateStore, activeCustomer.id, editingAddressId, validation.value)
      : await addCustomerAddress(demoStateStore, activeCustomer.id, validation.value);
    setBusy(false);
    if (!result.ok) {
      const message = result.reason === "customer_required"
        ? "Switch to a customer demo account before saving addresses."
        : result.reason === "address_missing"
          ? "That address is no longer available. Refresh the list and try again."
          : "The address couldn’t be saved. Check the fields and try again.";
      showToast("error", message);
      if (result.errors) setErrors(result.errors);
      return;
    }
    setFormOpen(false);
    setEditingAddressId(null);
    setValues(emptyAddress);
    setErrors({});
    const message = result.persisted
      ? editingAddressId ? "Address updated." : "Address saved."
      : "Address updated for this session, but browser storage is unavailable.";
    showToast(result.persisted ? "success" : "info", message);
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    if (returnTo === "/checkout") router.push("/checkout");
  }

  async function runAddressAction(action: () => ReturnType<typeof deleteCustomerAddress>, successMessage: string) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    const message = result.ok
      ? result.persisted ? successMessage : `${successMessage} Browser storage is unavailable, so it won’t remain after this session.`
      : result.reason === "customer_required" ? "Switch to a customer demo account before changing addresses." : "That address is no longer available.";
    showToast(result.ok ? result.persisted ? "success" : "info" : "error", message);
  }

  return (
    <section className="card min-w-0 p-5 sm:p-7" aria-labelledby="addresses-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="addresses-title" className="font-head text-xl font-bold sm:text-2xl">Saved addresses</h2>
          <p className="mt-1 text-sm text-mute">Manage delivery addresses saved to this customer account.</p>
        </div>
        {!formOpen && <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={openAddForm}><Plus className="size-4" aria-hidden="true" /> Add address</button>}
      </div>


      {formOpen && <form className="mt-6 rounded-xl border border-line bg-soft p-4 sm:p-5" noValidate onSubmit={(event) => void submitAddress(event)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-head text-lg font-bold">{editingAddressId ? "Edit address" : "Add an address"}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFormOpen(false); setErrors({}); }}>Cancel</button>
        </div>
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="address-label" className="mb-1.5 block text-sm font-bold">Address label</label>
            <select id="address-label" className="input bg-white" value={values.label} aria-invalid={Boolean(errors.label)} aria-describedby={errors.label ? "address-label-error" : undefined} onChange={(event) => changeField("label", event.target.value)} onBlur={() => validateField("label")}>
              <option>Home</option><option>Work</option><option>Other</option>
            </select>
            {errors.label && <p id="address-label-error" role="alert" className="mt-1 text-sm text-sale">{errors.label}</p>}
          </div>
          <AddressField id="recipient-name" label="Recipient name" value={values.recipientName} error={errors.recipientName} autoComplete="name" onChange={(value) => changeField("recipientName", value)} onBlur={() => validateField("recipientName")} />
          <AddressField id="recipient-phone" label="Mobile number" value={values.phone} error={errors.phone} type="tel" autoComplete="tel" placeholder="01712345678" onChange={(value) => changeField("phone", value)} onBlur={() => validateField("phone")} />
          <AddressField id="address-division" label="Division" value={values.division} error={errors.division} placeholder="Dhaka" autoComplete="address-level1" onChange={(value) => changeField("division", value)} onBlur={() => validateField("division")} />
          <AddressField id="address-district" label="District / city" value={values.district} error={errors.district} placeholder="Dhaka" autoComplete="address-level2" onChange={(value) => changeField("district", value)} onBlur={() => validateField("district")} />
          <AddressField id="address-area" label="Area / upazila" value={values.area} error={errors.area} placeholder="Gulshan" onChange={(value) => changeField("area", value)} onBlur={() => validateField("area")} />
          <AddressField id="address-postal-code" label="Postal code (optional)" value={values.postalCode ?? ""} error={errors.postalCode} inputMode="numeric" maxLength={4} placeholder="1212" onChange={(value) => changeField("postalCode", value || null)} onBlur={() => validateField("postalCode")} />
          <div className="sm:col-span-2">
            <AddressField id="address-line" label="House, road, and street address" value={values.streetAddress} error={errors.streetAddress} autoComplete="street-address" placeholder="House 12, Road 5" onChange={(value) => changeField("streetAddress", value)} onBlur={() => validateField("streetAddress")} />
          </div>
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
          <input type="checkbox" className="size-5 accent-brand" checked={values.isDefault} onChange={(event) => changeField("isDefault", event.target.checked)} />
          Set as default delivery address
        </label>
        <button type="submit" className="btn btn-primary btn-md mt-4" disabled={busy}>{busy ? "Saving…" : editingAddressId ? "Save address" : "Add address"}</button>
      </form>}

      {activeCustomer.addresses.length === 0 && !formOpen ? (
        <div className="mt-6 rounded-xl border border-dashed border-line p-6 text-center sm:p-8">
          <MapPin className="mx-auto size-8 text-mute" aria-hidden="true" />
          <h3 className="mt-3 font-head text-lg font-bold">Add your first delivery address</h3>
          <p className="mt-1 text-sm text-mute">Your saved addresses will be available here for future shopping.</p>
          <button type="button" className="btn btn-primary btn-md mt-4" onClick={openAddForm}><Plus className="size-4" aria-hidden="true" /> Add an address</button>
        </div>
      ) : <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        {activeCustomer.addresses.map((address) => <article key={address.id} aria-label={`${address.label} address`} className="min-w-0 rounded-xl border border-line p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="break-words font-head text-lg font-bold">{address.label}</h3>
              {address.isDefault && <span className="badge badge-brand mt-2"><Star className="size-3" aria-hidden="true" /> Default address</span>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" aria-label={`Edit ${address.label} address`} className="grid size-11 place-items-center rounded-lg text-ink hover:bg-soft" disabled={busy} onClick={() => openEditForm(address.id)}><Pencil className="size-4" aria-hidden="true" /></button>
              <button type="button" aria-label={`Delete ${address.label} address`} className="grid size-11 place-items-center rounded-lg text-sale-strong hover:bg-blush" disabled={busy} onClick={() => void runAddressAction(() => deleteCustomerAddress(demoStateStore, activeCustomer.id, address.id), address.isDefault && activeCustomer.addresses.length > 1 ? "Address removed. The next saved address is now the default." : "Address removed.")}><Trash2 className="size-4" aria-hidden="true" /></button>
            </div>
          </div>
          <div className="mt-3 min-w-0 space-y-1 text-sm">
            <p className="break-words font-bold text-ink">{address.recipientName}</p>
            <p className="break-words text-mute">{address.phone}</p>
            <p className="break-words text-mute">{address.streetAddress}</p>
            <p className="break-words text-mute">{[address.area, address.district, address.division, address.postalCode].filter(Boolean).join(", ")}</p>
          </div>
          {!address.isDefault && <button type="button" className="btn btn-outline btn-sm mt-4" disabled={busy} onClick={() => void runAddressAction(() => setDefaultCustomerAddress(demoStateStore, activeCustomer.id, address.id), "Default delivery address updated.")}>Make default</button>}
        </article>)}
      </div>}
    </section>
  );
}

interface AddressFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  type?: "text" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function AddressField({ id, label, value, error, type = "text", autoComplete, inputMode, maxLength, placeholder, onChange, onBlur }: AddressFieldProps) {
  const errorId = `${id}-error`;
  return <div className="min-w-0">
    <label htmlFor={id} className="mb-1.5 block text-sm font-bold">{label}</label>
    <input id={id} className="input bg-white" type={type} autoComplete={autoComplete} inputMode={inputMode} maxLength={maxLength} placeholder={placeholder} value={value} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
    {error && <p id={errorId} role="alert" className="mt-1 text-sm text-sale">{error}</p>}
  </div>;
}
