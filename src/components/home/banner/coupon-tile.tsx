"use client";

import { useState } from "react";

export function CouponTile() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("WELCOME200");
    } catch {
      // Clipboard write failed (e.g. permission/unsupported)
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <div className="rounded-2xl bg-info text-info-ink p-5 flex flex-col justify-between">
      <div>
        <p className="text-xs font-bold">New here?</p>
        <p className="font-head font-extrabold text-xl leading-snug mt-1">
          Get ৳200 off your first order
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 bg-white rounded-xl border border-dashed border-info-ink pl-4 pr-1.5 py-1.5">
        <span id="code" className="font-head font-extrabold tracking-wider text-sm">
          WELCOME200
        </span>
        <button
          id="copy"
          type="button"
          onClick={handleCopy}
          className="bg-info-ink text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-info-strong"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

