import { Suspense } from "react";
import { CustomerOrderDetailsPage } from "@/components/customer/customer-order-details-page";

export default function CustomerOrderDetailsRoute({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense fallback={<section className="card p-5 sm:p-7" role="status">Loading order details…</section>}>
      <CustomerOrderDetailsRouteContent params={params} />
    </Suspense>
  );
}

async function CustomerOrderDetailsRouteContent({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <CustomerOrderDetailsPage orderId={orderId} />;
}
