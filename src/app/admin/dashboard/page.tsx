"use client";

import { useDemoState } from "@/hooks/use-demo-state";
import { selectActiveAccount } from "@/services/demo-state-store";
import { DemoDashboardPlaceholder } from "@/components/shared/demo-dashboard-placeholder";

export default function AdminDashboardPage() {
  const account = useDemoState(selectActiveAccount);
  return <DemoDashboardPlaceholder role="Admin" accountName={account?.displayName} />;
}
