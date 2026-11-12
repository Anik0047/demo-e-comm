"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CustomerAccountNavigation() {
  const pathname = usePathname();
  const links = [
    { href: "/account", label: "Overview" },
    { href: "/account/orders", label: "My Orders" },
    { href: "/account/recently-viewed", label: "Recently viewed" },
    { href: "/account/profile", label: "Profile" },
    { href: "/account/addresses", label: "Saved addresses" },
    { href: "/account/preferences", label: "Preferences" },
  ];

  return (
    <nav aria-label="Customer account" className="card flex gap-2 overflow-x-auto p-2 lg:block lg:overflow-visible">
      {links.map(({ href, label }) => {
        const isActive = pathname === href || (href === "/account/orders" && pathname.startsWith("/account/orders/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-bold transition-colors ${isActive ? "bg-brand-tint text-brand-strong" : "text-ink hover:bg-soft"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
