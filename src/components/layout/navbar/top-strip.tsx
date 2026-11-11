import Link from "next/link";

interface TopStripProps {
  message: string;
}

export function TopStrip({ message }: TopStripProps) {
  return (
    <div className="bg-brand-tint text-brand-strong text-xs font-body">
      <div className="max-w-[1280px] mx-auto px-4 h-9 flex items-center justify-between">
        <p className="font-medium">{message}</p>
        <ul className="hidden md:flex items-center gap-5">
          <li>
            <Link href="/login" className="hover:underline">
              Track order
            </Link>
          </li>
          <li>
            <Link href="/login" className="hover:underline">
              Help center
            </Link>
          </li>
          <li>
            EN / বাং
          </li>
          <li>৳ BDT</li>
        </ul>
      </div>
    </div>
  );
}

