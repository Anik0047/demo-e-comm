import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" aria-label="Kenakata home" className="inline-flex min-h-11 items-center gap-2 rounded-lg hover:opacity-80 transition-opacity duration-150">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white">
        <ShoppingBag className="size-5" aria-hidden="true" />
      </span>
      <span className="font-head text-2xl font-extrabold tracking-tight text-ink">
        Kena<span className="text-brand">kata</span>
      </span>
    </Link>
  );
}
