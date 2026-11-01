import Link from "next/link";
import { ProductCard } from "@/components/shared/product-card";
import { FlashCountdown } from "@/components/home/flash-deals/flash-countdown";
import type { FlashDealItem } from "@/types/product";

interface FlashDealsSectionProps {
  items: FlashDealItem[];
  endsInSeconds: number;
}
export function FlashDealsSection({
  items,
  endsInSeconds,
}: FlashDealsSectionProps) {
  return (
    <section
      aria-labelledby="fd-title"
      className="max-w-[1280px] mx-auto px-4 py-6 md:py-8 font-body"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-5 md:mb-6">
        <div className="flex items-center gap-2 mr-auto sm:mr-0">
          <span className="w-9 h-9 rounded-full bg-sale text-white grid place-items-center">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <h2 id="fd-title" className="font-head font-bold text-xl sm:text-2xl">
            Flash deals
          </h2>
        </div>
        <Link
          href="#"
          className="order-2 sm:order-3 sm:ml-auto shrink-0 text-sm font-bold text-brand-strong hover:underline"
        >
          View all →
        </Link>
        <FlashCountdown initialSeconds={endsInSeconds} />
      </div>
      <ul className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {items.map((product) => (
          <li className="min-w-0" key={product.id}>
            <ProductCard
              product={product}
              deal={{
                soldCount: product.soldCount,
                stockLimit: product.stockLimit,
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
