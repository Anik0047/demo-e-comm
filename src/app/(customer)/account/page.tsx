"use client";

import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone, Settings2, UserRound } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { selectActiveAccount, selectDemoSnapshot, selectHydrationReady } from "@/services/demo-state-store";

export default function CustomerAccountPage() {
  const account = useDemoState(selectActiveAccount);
  const snapshot = useDemoState(selectDemoSnapshot);
  const ready = useDemoState(selectHydrationReady);
  const customer = account?.role === "customer" && account.customerId
    ? snapshot?.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id) ?? null
    : null;

  if (!ready) return <section className="card p-5 sm:p-7" role="status">Loading your account overview…</section>;
  if (!customer || !account) return null;

  return (
    <section className="card p-5 sm:p-7" aria-labelledby="account-overview-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="account-overview-title" className="font-head text-xl font-bold sm:text-2xl">Account overview</h2>
          <p className="mt-1 text-sm text-mute">Your customer profile details are saved in this browser.</p>
        </div>
        <Link href="/account/profile" className="btn btn-outline btn-sm shrink-0">Edit profile <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>

      <dl className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-line p-4">
          <dt className="flex items-center gap-2 text-xs font-bold text-mute"><UserRound className="size-4" aria-hidden="true" /> Full name</dt>
          <dd className="mt-2 break-words font-bold text-ink">{customer.fullName}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-line p-4">
          <dt className="flex items-center gap-2 text-xs font-bold text-mute"><Mail className="size-4" aria-hidden="true" /> Email address</dt>
          <dd className="mt-2 break-all font-bold text-ink">{account.email}</dd>
          <p className="mt-1 text-xs text-mute">Email can’t be changed in this demo.</p>
        </div>
        <div className="min-w-0 rounded-xl border border-line p-4">
          <dt className="flex items-center gap-2 text-xs font-bold text-mute"><Phone className="size-4" aria-hidden="true" /> Phone number</dt>
          <dd className="mt-2 break-words font-bold text-ink">{customer.phone}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-line p-4">
          <dt className="flex items-center gap-2 text-xs font-bold text-mute"><MapPin className="size-4" aria-hidden="true" /> Saved addresses</dt>
          <dd className="mt-2 font-bold text-ink">{customer.addresses.length} {customer.addresses.length === 1 ? "address" : "addresses"}</dd>
          <Link href="/account/addresses" className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-brand-strong hover:bg-brand-tint">Manage addresses <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <div className="min-w-0 rounded-xl border border-line p-4">
          <dt className="flex items-center gap-2 text-xs font-bold text-mute"><Settings2 className="size-4" aria-hidden="true" /> Preferences</dt>
          <dd className="mt-2 font-bold text-ink">Local shopping settings</dd>
          <Link href="/account/preferences" className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-brand-strong hover:bg-brand-tint">Manage preferences <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
      </dl>
    </section>
  );
}
