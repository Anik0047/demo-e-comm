"use client";

import { useCountdown } from "@/hooks/use-countdown";

interface FlashCountdownProps { initialSeconds: number }
export function FlashCountdown({ initialSeconds }: FlashCountdownProps) {
  const { h, m, s } = useCountdown(initialSeconds);
  return (
<div className="order-3 sm:order-2 w-full sm:w-auto flex items-center gap-1.5" role="timer" aria-label="Time left">
      <span className="text-sm text-mute mr-0.5">Ends in</span>
      <span id="fd-h" className="min-w-8 h-8 px-1.5 rounded-lg bg-sale-strong text-white font-head font-extrabold text-sm grid place-items-center">{h}</span><span className="text-sale-strong font-bold">:</span>
      <span id="fd-m" className="min-w-8 h-8 px-1.5 rounded-lg bg-sale-strong text-white font-head font-extrabold text-sm grid place-items-center">{m}</span><span className="text-sale-strong font-bold">:</span>
      <span id="fd-s" className="min-w-8 h-8 px-1.5 rounded-lg bg-sale-strong text-white font-head font-extrabold text-sm grid place-items-center">{s}</span>
    </div>);
}
