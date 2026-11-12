import type { PromoBanner } from "@/types/promo";

export const promoBanners: PromoBanner[] = [
  {
    id: "promo-home",
    eyebrow: "Home & living",
    title: "Make room for comfort",
    text: "Furnish your space with practical picks for every room.",
    cta: { label: "Shop home", href: "/category/home-living" },
    tone: "mint",
    icon: "house",
  },
  {
    id: "promo-grocery",
    eyebrow: "Groceries",
    title: "Everyday pantry picks",
    text: "Browse pantry staples and everyday household essentials.",
    cta: { label: "Shop groceries", href: "/category/groceries" },
    tone: "amber",
    icon: "basket",
  },
  {
    id: "promo-beauty",
    eyebrow: "Beauty & health",
    title: "Your daily care routine",
    text: "Explore skincare, makeup, and personal care essentials.",
    cta: { label: "Explore beauty", href: "/category/beauty-health" },
    tone: "blush",
    icon: "sparkles",
  },
];
