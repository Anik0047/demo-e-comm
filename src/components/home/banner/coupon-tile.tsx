import Link from "next/link";

export function CouponTile() {
  return (
    <div className="rounded-2xl bg-info text-info-ink p-5 flex flex-col justify-between">
      <div>
        <p className="text-xs font-bold">New here?</p>
        <p className="font-head font-extrabold text-xl leading-snug mt-1">
          Find something you’ll love
        </p>
      </div>
      <p className="mt-2 text-sm">Explore products from independent sellers across Bangladesh.</p>
      <Link href="/products" className="mt-4 inline-flex h-11 w-fit items-center rounded-full bg-info-ink px-5 text-sm font-bold text-white hover:bg-info-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info-ink">
        Browse products
      </Link>
    </div>
  );
}

