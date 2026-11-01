import Link from "next/link";
import { User } from "lucide-react";

export function AccountMenu() {
  return (
    <div className="relative group hidden sm:block">
      <Link
        href="#"
        className="flex items-center gap-2 h-11 px-3 lg:px-4 rounded-full border border-line hover:border-brand text-sm font-medium"
        aria-label="Sign in"
      >
        <User className="w-5 h-5" />
        <span className="hidden lg:inline">Sign in</span>
      </Link>
      <div className="hidden group-hover:block group-focus-within:block absolute right-0 top-full pt-2 w-56">
        <div className="bg-white border border-line rounded-xl p-2 shadow-lg">
          <Link
            href="#"
            className="block text-center bg-brand hover:bg-brand-strong text-white text-sm font-medium rounded-lg py-2 mb-2"
          >
            Login
          </Link>
          <Link
            href="#"
            className="block text-center border border-brand text-brand-strong text-sm font-medium rounded-lg py-2 mb-2"
          >
            Create account
          </Link>
          <Link href="#" className="menu-link">
            My orders
          </Link>
          <Link href="#" className="menu-link">
            Wishlist
          </Link>
        </div>
      </div>
    </div>
  );
}

