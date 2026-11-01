import { Banknote, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import type { TrustPoint } from "@/types/trust";

interface TrustStripProps {
  points: TrustPoint[];
}

const icons = {
  truck: Truck,
  banknote: Banknote,
  rotate: RotateCcw,
  shield: ShieldCheck,
};

export function TrustStrip({ points }: TrustStripProps) {
  if (points.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brand-border bg-brand-border lg:grid-cols-4">
      {points.map((point) => {
        const Icon = icons[point.icon];

        return (
          <li
            key={point.id}
            className="flex min-w-0 flex-col items-center gap-2 bg-brand-tint p-4 text-center sm:flex-row sm:gap-3 sm:p-5 sm:text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-canvas text-brand-strong">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-head text-sm font-bold text-ink sm:text-base">
                {point.title}
              </p>
              <p className="text-xs text-mute sm:text-sm">{point.text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
