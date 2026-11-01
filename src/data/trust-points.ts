import { formatPrice } from "@/lib/utils";
import type { TrustPoint } from "@/types/trust";

export const trustPoints: TrustPoint[] = [
  {
    id: "free-delivery",
    icon: "truck",
    title: "Free delivery",
    text: `On orders over ${formatPrice(2000)}`,
  },
  {
    id: "cash-on-delivery",
    icon: "banknote",
    title: "Cash on delivery",
    text: "Pay when you receive",
  },
  {
    id: "easy-returns",
    icon: "rotate",
    title: "Easy returns",
    text: "7-day return policy",
  },
  {
    id: "secure-payment",
    icon: "shield",
    title: "Secure payment",
    text: "bKash, Nagad, and cards",
  },
];
