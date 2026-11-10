import Link from "next/link";

interface DemoDashboardPlaceholderProps {
  role: "Admin" | "Vendor";
  accountName?: string;
}

export function DemoDashboardPlaceholder({ role, accountName }: DemoDashboardPlaceholderProps) {
  return (
    <main className="min-h-dvh bg-soft px-4 py-10">
      <section className="card mx-auto max-w-2xl p-6 sm:p-10">
        <span className="badge badge-warning">Demo dashboard placeholder</span>
        <h1 className="mt-4">{role} dashboard</h1>
        <p className="mt-3 text-mute">{accountName ? `Signed in as ${accountName}. ` : ""}The {role.toLowerCase()} dashboard isn’t implemented yet. This page is a navigation placeholder for the demo account.</p>
        <Link href="/login" className="btn btn-primary btn-md mt-6">Switch demo account</Link>
      </section>
    </main>
  );
}
