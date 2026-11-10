import { Suspense } from "react";
import { VendorDashboardContent } from "@/components/vendor/vendor-dashboard-content";

interface VendorDashboardPageProps {
  params: Promise<{ slug: string }>;
}

async function VendorDashboardRoute({ params }: VendorDashboardPageProps) {
  const { slug } = await params;
  return <VendorDashboardContent slug={slug} />;
}

export default function VendorDashboardPage({ params }: VendorDashboardPageProps) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-soft px-4 py-10" aria-busy="true" />}>
      <VendorDashboardRoute params={params} />
    </Suspense>
  );
}
