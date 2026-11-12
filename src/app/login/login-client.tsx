"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, LockKeyhole, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useDemoState } from "@/hooks/use-demo-state";
import { demoStateStore, selectDemoSnapshot, selectHydrationReady } from "@/services/demo-state-store";
import { getDemoAccountDestination } from "@/services/demo-accounts";
import type { DemoAccountRole } from "@/types/demo-state";

const roleLabels: Record<DemoAccountRole, string> = { customer: "Customer", admin: "Admin", vendor: "Vendor" };

export default function LoginPage() {
  const router = useRouter();
  const snapshot = useDemoState(selectDemoSnapshot);
  const ready = useDemoState(selectHydrationReady);
  const [message, setMessage] = useState("");

  function chooseAccount(accountId: string) {
    const account = snapshot?.data.accounts.find(({ id }) => id === accountId);
    if (!account || !demoStateStore.getState().setActiveAccount(account.id)) return;
    router.push(getDemoAccountDestination(account.role, account.vendorId));
  }

  return (
    <main className="min-h-dvh bg-soft px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-brand-strong hover:bg-brand-tint">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to shopping
        </Link>
        <section className="card mt-4 p-5 sm:p-8">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-brand text-white">
            <ShoppingBag className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-center font-head text-2xl font-extrabold sm:text-3xl">Welcome to Kenakata</h1>
          <p className="mt-2 text-center text-sm text-mute">Sign in or choose a seeded account to explore the demo.</p>

          <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); setMessage("Email and password sign-in isn’t available in this frontend demo. Choose a Quick Demo Login below."); }}>
            <label className="block text-sm font-bold" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
            <label className="block text-sm font-bold" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" />
            <button className="btn btn-primary btn-md w-full" type="submit"><LockKeyhole className="size-4" aria-hidden="true" /> Login</button>
          </form>
          <p className="mt-3 rounded-lg border border-info bg-info px-3 py-2 text-sm text-info-ink">Real email and password authentication is unavailable. This form does not sign you in.</p>
          {message && <p role="status" className="mt-3 text-sm text-info-ink">{message}</p>}

          <div className="my-6 border-t border-line" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold">Quick Demo Login</h2>
              <p className="mt-1 text-sm text-mute">Choose an account to explore its available view.</p>
            </div>
            <span className="badge badge-brand shrink-0">Demo mode</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {snapshot?.data.accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                disabled={!ready}
                onClick={() => chooseAccount(account.id)}
                className="min-h-16 rounded-xl border border-line bg-white px-4 py-3 text-left transition-colors hover:border-brand hover:bg-brand-tint disabled:cursor-wait disabled:opacity-60"
              >
                <span className="block font-bold text-ink">{account.displayName}</span>
                <span className="block text-sm text-mute">{roleLabels[account.role]} demo account</span>
              </button>
            ))}
            {!snapshot && <p role="status" className="col-span-full rounded-lg bg-soft p-4 text-sm text-mute">Loading demo accounts…</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
