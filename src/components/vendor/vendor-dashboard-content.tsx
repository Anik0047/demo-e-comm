"use client";

import { useDemoState } from "@/hooks/use-demo-state";
import { selectActiveAccount } from "@/services/demo-state-store";
import { DemoDashboardPlaceholder } from "@/components/shared/demo-dashboard-placeholder";

interface VendorDashboardContentProps {
  slug: string;
}

export function VendorDashboardContent({ slug }: VendorDashboardContentProps) {
  const account = useDemoState(selectActiveAccount);

  return <DemoDashboardPlaceholder role="Vendor" accountName={account?.displayName ?? slug} />;
}
