import Link from "next/link";
import { buildProductsHref } from "@/lib/catalog-query";
import type { ListingState } from "@/types/catalog";
interface PaginationProps { state: ListingState; totalPages: number }
export function Pagination({ state, totalPages }: PaginationProps) {
  if (totalPages < 2) return null;
  const linkClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line px-3 text-sm hover:bg-brand-tint";
  return <nav aria-label="Pagination" className="mt-6 flex flex-wrap justify-center gap-2">
    {state.page > 1 && <Link className={linkClass} href={buildProductsHref({ ...state, page: state.page - 1 })}>Previous</Link>}
    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <Link key={page} className={`${linkClass} ${page === state.page ? "bg-brand-strong text-white" : ""}`} href={buildProductsHref({ ...state, page })} aria-label={`Page ${page}`} aria-current={page === state.page ? "page" : undefined}>{page}</Link>)}
    {state.page < totalPages && <Link className={linkClass} href={buildProductsHref({ ...state, page: state.page + 1 })}>Next</Link>}
  </nav>;
}
