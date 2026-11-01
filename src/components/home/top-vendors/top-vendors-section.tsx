import Link from "next/link";
import { VendorCard } from "@/components/shared/vendor-card";
import type { Vendor } from "@/types/vendor";

interface TopVendorsSectionProps {
  vendors: Vendor[];
}

export function TopVendorsSection({ vendors }: TopVendorsSectionProps) {
  return (
    <section aria-labelledby="vendors-title" className="max-w-[1280px] mx-auto px-4 py-6 md:py-8 font-body">
      <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
        <div className="min-w-0">
          <h2 id="vendors-title" className="font-head font-bold text-xl sm:text-2xl">Top vendors</h2>
          <p className="hidden sm:block text-sm text-mute mt-1">Trusted sellers with great ratings</p>
        </div>
        <Link href="#" className="inline-flex min-h-11 items-end shrink-0 text-sm font-bold text-brand-strong hover:underline">View all →</Link>
      </div>
      {vendors.length ? (
        <ul data-scroll-row className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 -mx-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:mx-0 md:px-0 md:pb-0 xl:grid-cols-6">
          {vendors.map((vendor, index) => (
            <li key={vendor.id} className="shrink-0 snap-start w-[72%] min-[480px]:w-[45%] md:w-auto min-w-0">
              <VendorCard vendor={vendor} index={index} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="card p-6 text-sm text-mute">Discover more sellers with the View all link above.</p>
      )}
    </section>
  );
}
