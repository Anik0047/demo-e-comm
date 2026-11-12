import Link from "next/link";
import { ArrowRight, House, ShoppingBasket, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromoBanner, PromoTone } from "@/types/promo";

const tones = {
  mint: {
    card: "bg-brand-soft text-brand-deep",
    pill: "bg-brand-strong text-white",
    art: "before:bg-brand-light text-brand-deep",
    cta: "bg-brand-strong text-white hover:bg-brand-deep group-hover:bg-brand-deep",
  },
  amber: {
    card: "bg-accent text-ink",
    pill: "bg-ink text-white",
    art: "before:bg-canvas text-ink",
    cta: "bg-ink text-white hover:bg-brand-strong group-hover:bg-brand-strong",
  },
  blush: {
    card: "bg-blush text-blush-ink",
    pill: "bg-sale-strong text-white",
    art: "before:bg-canvas text-blush-ink",
    cta: "bg-sale-strong text-white hover:bg-sale-strong group-hover:bg-sale-strong",
  },
} satisfies Record<PromoTone, { card: string; pill: string; art: string; cta: string }>;

const icons = { house: House, basket: ShoppingBasket, sparkles: Sparkles };

interface PromoBannerCardProps {
  banner: PromoBanner;
}

export function PromoBannerCard({ banner }: PromoBannerCardProps) {
  const tone = tones[banner.tone];
  const Icon = icons[banner.icon];

  return (
    <article className={cn("group relative flex h-full min-h-[200px] min-w-0 flex-col overflow-hidden rounded-2xl p-5 sm:p-6 md:min-h-[240px] lg:min-h-[220px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink", tone.card)}>
      <div className="relative z-10 max-w-[68%] sm:max-w-[60%] md:max-w-[78%] lg:max-w-[70%]">
        <span className={cn("mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold", tone.pill)}>{banner.eyebrow}</span>
        <h3 className="font-head text-2xl leading-tight font-extrabold">{banner.title}</h3>
        <p className="mt-2 text-sm">{banner.text}</p>
      </div>
      <div className="z-10 mt-auto pt-5">
        <Link href={banner.cta.href} className={cn("inline-flex h-11 items-center rounded-full px-5 text-sm font-bold transition-colors duration-150 ease-out after:absolute after:inset-0 after:z-20 after:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2", tone.cta)}>
          {banner.cta.label}
          <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4 shrink-0" />
        </Link>
      </div>
      <div aria-hidden="true" className={cn("pointer-events-none absolute right-0 bottom-0 h-30 w-30 md:hidden lg:block before:absolute before:-right-6 before:-bottom-6 before:h-36 before:w-36 before:rounded-full", tone.art)}>
        <Icon className="absolute top-9 left-12 h-12 w-12" />
      </div>
    </article>
  );
}
