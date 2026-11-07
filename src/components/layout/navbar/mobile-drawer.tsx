import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import type { CategoryGroup } from "@/types/navigation";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryGroup[];
}

export function MobileDrawer({ isOpen, onClose, categories }: MobileDrawerProps) {
  return (
    <aside
      id="drawer"
      className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85%] bg-white transition-transform duration-200 overflow-y-auto font-body ${
        isOpen ? "" : "-translate-x-full"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex items-center justify-between p-4 border-b border-line">
        <span className="font-head font-extrabold text-xl">
          Kena<span className="text-brand">kata</span>
        </span>
        <button
          id="close-drawer"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-soft"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2 border-b border-line">
        <Link
          href="#"
          className="text-center bg-brand text-white text-sm font-medium rounded-lg py-2"
        >
          Login
        </Link>
        <Link
          href="#"
          className="text-center border border-brand text-brand-strong text-sm font-medium rounded-lg py-2"
        >
          Register
        </Link>
      </div>
      <ul id="drawer-cats" className="p-2">
        {categories.map((cat) => (
          <li key={cat.name}>
            <Link href="#" className="menu-link flex items-center justify-between">
              {cat.name}
              <ChevronRight className="w-4 h-4 text-mute" />
            </Link>
          </li>
        ))}
      </ul>
      <ul className="p-2 border-t border-line">
        <li>
          <Link href="/products?promotion=flash-deals" onClick={onClose} className="menu-link text-sale font-bold">
            Flash deals
          </Link>
        </li>
        <li>
          <Link href="#" className="menu-link">
            Vouchers
          </Link>
        </li>
        <li>
          <Link href="#" className="menu-link">
            Top vendors
          </Link>
        </li>
        <li>
          <Link href="#" className="menu-link">
            Track order
          </Link>
        </li>
        <li>
          <Link href="#" className="menu-link text-brand-strong font-bold">
            Become a vendor
          </Link>
        </li>
      </ul>
    </aside>
  );
}

