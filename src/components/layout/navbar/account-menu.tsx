"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import { selectActiveAccount } from "@/services/demo-state-store";

export function AccountMenu() {
  const activeAccount = useDemoState(selectActiveAccount);
  const isActive = activeAccount !== null;
  const isCustomer = activeAccount?.role === "customer" && activeAccount.customerId !== null;

  return (
    <Link
      href={isCustomer ? "/account" : "/login"}
      aria-label={isCustomer ? `My account: ${activeAccount.displayName}` : isActive ? `Account: ${activeAccount.displayName}. Switch demo account` : "Login"}
      className="flex items-center gap-2 h-11 min-w-11 px-2 sm:px-3 lg:px-4 rounded-full border border-line hover:border-brand text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <User className="size-5" aria-hidden="true" />
      <span className="hidden lg:inline">{isCustomer ? "My account" : isActive ? "Account" : "Login"}</span>
    </Link>
  );
}
