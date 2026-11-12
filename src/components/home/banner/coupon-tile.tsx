import { CouponCopyButton } from "@/components/home/banner/coupon-copy-button";

export function CouponTile() {
  return (
    <div className="rounded-2xl bg-info text-info-ink p-5 flex flex-col justify-between">
      <div>
        <p className="text-xs font-bold">Demo welcome coupon</p>
        <p className="font-head font-extrabold text-xl leading-snug mt-1">৳200 off with WELCOME200</p>
      </div>
      <p className="mt-2 text-sm">One use per customer account on demo orders of ৳1,000 or more. No voucher is purchased.</p>
      <CouponCopyButton />
    </div>
  );
}

