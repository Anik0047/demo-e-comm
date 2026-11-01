import { formatPrice } from "@/lib/utils";
import type { PromoBanner } from "@/types/promo";

export const promoBanners: PromoBanner[] = [
  {
    id: "promo-home",
    eyebrow: "Home & living",
    title: "Mega home sale",
    text: "Up to 50% off furniture, décor, and kitchen essentials.",
    cta: { label: "Shop home", href: "#" },
    tone: "mint",
    icon: "house",
  },
  {
    id: "promo-grocery",
    eyebrow: "Groceries",
    title: "Fresh and fast",
    text: "Order before 2 pm for same-day delivery in Dhaka.",
    cta: { label: "Order now", href: "#" },
    tone: "amber",
    icon: "basket",
  },
  {
    id: "promo-beauty",
    eyebrow: "Beauty week",
    title: "Glow for less",
    text: `Skincare and makeup from top-rated vendors, from ${formatPrice(299)}.`,
    cta: { label: "Explore beauty", href: "#" },
    tone: "blush",
    icon: "sparkles",
  },
];
