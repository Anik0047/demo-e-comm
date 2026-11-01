import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { CartItem } from "@/types/navigation";
import { formatPrice } from "@/lib/utils";

interface MiniCartProps {
  items: CartItem[];
}

export function MiniCart({ items }: MiniCartProps) {
  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <div className="relative group">
      <Link
        href="#"
        className="flex items-center gap-2 h-11 pl-3 pr-4 rounded-full bg-brand hover:bg-brand-strong text-white text-sm font-bold"
        aria-label="Cart"
      >
        <span className="relative mr-1">
          <ShoppingCart className="w-5 h-5" />
          <span className="absolute -top-2 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-white text-brand-strong text-[11px] font-bold grid place-items-center">
            {totalCount}
          </span>
        </span>
        <span className="hidden sm:inline">{formatPrice(subtotal)}</span>
      </Link>
      <div className="hidden group-hover:block group-focus-within:block absolute right-0 top-full pt-2 w-80">
        <div className="bg-white border border-line rounded-xl p-4 shadow-lg">
          <ul className="divide-y divide-line">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={index === 0 ? "flex gap-3 pb-3" : "flex gap-3 pt-3"}
              >
                <div className="w-12 h-12 rounded-lg bg-soft shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-mute">Qty {item.qty}</p>
                </div>
                <p className="text-sm font-bold">
                  {formatPrice(item.qty * item.price)}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm font-bold border-t border-line mt-3 pt-3">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link
              href="#"
              className="text-center border border-line hover:border-brand text-sm font-medium rounded-lg py-2"
            >
              View cart
            </Link>
            <Link
              href="#"
              className="text-center bg-brand hover:bg-brand-strong text-white text-sm font-medium rounded-lg py-2"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

