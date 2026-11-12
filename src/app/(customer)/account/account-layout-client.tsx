"use client";

import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ArrowLeft, CircleUserRound } from "lucide-react";
import { CustomerAccountNavigation } from "@/components/customer/customer-account-navigation";
import { useDemoState } from "@/hooks/use-demo-state";
import {
  selectActiveAccount,
  selectDemoSnapshot,
  selectHydrationReady,
} from "@/services/demo-state-store";

export default function CustomerAccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ready = useDemoState(selectHydrationReady);
  const account = useDemoState(selectActiveAccount);
  const snapshot = useDemoState(selectDemoSnapshot);
  const customer =
    account?.role === "customer" && account.customerId
      ? (snapshot?.data.customers.find(
          ({ id, accountId }) =>
            id === account.customerId && accountId === account.id,
        ) ?? null)
      : null;

  if (!ready) {
    return (
      <main className="min-h-[50vh] bg-soft px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    );
  }

  if (!customer || !account) {
    return (
      <main className="min-h-[50vh] bg-soft px-4 py-8 sm:py-12">
        <section className="card mx-auto max-w-xl p-6 text-center sm:p-8">
          <CircleUserRound
            className="mx-auto size-10 text-mute"
            aria-hidden="true"
          />
          <h1 className="mt-4 font-head text-2xl font-extrabold">
            Customer account required
          </h1>
          <p className="mt-2 text-sm text-mute">
            This page is available with a customer demo account. Switch demo
            accounts to continue.
          </p>
          <Link href="/login" className="btn btn-primary btn-md mt-5">
            Switch demo account
          </Link>
          <Link
            href="/"
            className="mx-auto mt-3 flex min-h-11 w-fit items-center gap-2 rounded-lg px-3 text-sm font-bold text-brand-strong hover:bg-brand-tint"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh] bg-soft px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-brand-strong hover:bg-brand-tint"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to shopping
        </Link>
        <header className="mt-3 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-white p-5 sm:p-7">
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-strong">
              Customer account
            </p>
            <h1 className="mt-1 font-head text-2xl font-extrabold sm:text-3xl">
              Hello, {customer.fullName}
            </h1>
            <p className="mt-2 text-sm text-mute">
              Review your account details and keep your contact information up
              to date.
            </p>
          </div>
          <Link href="/login" className="btn btn-outline btn-sm shrink-0">
            Switch demo account
          </Link>
        </header>
        <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Suspense
            fallback={
              <nav
                aria-label="Customer account"
                className="card min-h-14 p-2"
                aria-busy="true"
              >
                Loading account navigation…
              </nav>
            }
          >
            <CustomerAccountNavigation />
          </Suspense>
          <div key={customer.id} className="min-w-0">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
