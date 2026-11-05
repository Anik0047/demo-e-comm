import { ListingSkeleton } from "@/components/products/listing-states";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <ListingSkeleton />
    </div>
  );
}
