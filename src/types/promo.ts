export type PromoTone = "mint" | "amber" | "blush";
export type PromoIcon = "house" | "basket" | "sparkles";

export interface PromoBanner {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  tone: PromoTone;
  icon: PromoIcon;
}
