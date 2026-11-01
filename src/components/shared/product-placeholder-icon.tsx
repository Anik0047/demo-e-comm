import { Backpack, BatteryCharging, Coffee, Dumbbell, Footprints, Headphones, Lamp, Mouse, Puzzle, Shirt, Smartphone, Sparkles, Speaker, Utensils, Wheat } from "lucide-react";
import type { PlaceholderIcon } from "@/types/product";

const icons = {
  headphones: Headphones, shirt: Shirt, utensils: Utensils, speaker: Speaker,
  smartphone: Smartphone, footprints: Footprints, backpack: Backpack, mouse: Mouse,
  "battery-charging": BatteryCharging, coffee: Coffee, lamp: Lamp,
  sparkles: Sparkles, wheat: Wheat, puzzle: Puzzle, dumbbell: Dumbbell,
};

interface ProductPlaceholderIconProps {
  icon: PlaceholderIcon;
  className?: string;
}

export function ProductPlaceholderIcon({ icon, className = "w-14 h-14 sm:w-16 sm:h-16" }: ProductPlaceholderIconProps) {
  if (icon === "watch") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="6" />
        <path d="M12 10v2l1 1" />
        <path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05" />
        <path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.64h2.72a2 2 0 0 0 2-1.64l.8-4" />
      </svg>
    );
  }
  const Icon = icons[icon];
  return <Icon className={className} strokeWidth={1.25} aria-hidden="true" />;
}
