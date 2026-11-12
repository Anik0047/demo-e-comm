import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getTrustPoints } from "@/services/trust-points";

export const metadata: Metadata = {
  title: "Checkout | Kenakata",
  description: "Review your Kenakata cart before checkout.",
};

export default async function CheckoutRoute() {
  const trustPoints = await getTrustPoints();
  return <CheckoutPage trustPoints={trustPoints} />;
}
