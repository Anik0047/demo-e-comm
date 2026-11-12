import { Suspense } from "react";
import type { Metadata } from "next";
import { OrderConfirmationPage } from "@/components/checkout/order-confirmation-page";

export const metadata: Metadata = {
  title: "Demo order confirmation",
  description: "View a sample order confirmation from this frontend demonstration.",
  robots: { index: false, follow: false },
};

export default function OrderConfirmationRoute({ params }: { params: Promise<{ orderId: string }> }) {
  return <Suspense fallback={<p role="status" className="mx-auto max-w-[760px] px-4 py-8 text-sm text-mute">Loading your order…</p>}><OrderConfirmationRouteContent params={params} /></Suspense>;
}

async function OrderConfirmationRouteContent({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderConfirmationPage orderId={orderId} />;
}
