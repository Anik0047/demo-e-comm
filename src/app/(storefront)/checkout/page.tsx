import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getTrustPoints } from "@/services/trust-points";

export const metadata: Metadata = {
  title: "Demo checkout",
  description: "Review the sample delivery details in this frontend demonstration.",
  robots: { index: false, follow: true },
};

export default async function CheckoutRoute() {
  const trustPoints = await getTrustPoints();
  return <CheckoutPage trustPoints={trustPoints} />;
}
