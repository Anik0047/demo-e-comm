"use client";

import { showToast } from "@/services/toast";

export function CouponCopyButton() {
  async function copyCoupon() {
    try {
      await navigator.clipboard.writeText("WELCOME200");
      showToast("success", "WELCOME200 copied.");
    } catch {
      showToast("error", "Copy isn’t available here. Select WELCOME200 and copy it manually.");
    }
  }

  return <div className="mt-3">
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-lg border border-info-ink/20 bg-canvas px-3 py-2 font-mono text-sm font-bold tracking-wide">WELCOME200</code>
      <button type="button" onClick={() => void copyCoupon()} className="btn btn-outline btn-sm border-info-ink/30 bg-canvas text-info-ink hover:bg-info" aria-label="Copy WELCOME200 coupon code">Copy code</button>
    </div>
  </div>;
}
