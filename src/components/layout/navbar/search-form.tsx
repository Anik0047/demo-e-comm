import { ChevronDown, Search } from "lucide-react";

interface SearchFormProps {
  mobile?: boolean;
}

export function SearchForm({ mobile = false }: SearchFormProps) {
  if (mobile) {
    return (
      <form className="md:hidden px-4 pb-3" onSubmit={(e) => e.preventDefault()}>
        <div className="flex items-center h-11 rounded-full bg-soft focus-within:bg-white border border-transparent focus-within:border-brand pl-4 pr-1.5">
          <input
            type="search"
            placeholder="Search Kenakata"
            className="flex-1 bg-transparent text-sm outline-hidden placeholder:text-mute min-w-0"
          />
          <button
            className="w-8 h-8 rounded-full bg-brand text-white grid place-items-center"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="hidden md:flex flex-1 min-w-0 items-center h-12 rounded-full bg-soft border border-transparent focus-within:bg-white focus-within:border-brand pl-2 pr-1.5 transition-colors"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="relative shrink-0">
        <select
          className="appearance-none bg-transparent text-sm font-medium w-[84px] lg:w-auto pl-3 pr-7 py-2 outline-hidden cursor-pointer"
          aria-label="Search category"
          defaultValue="All"
        >
          <option>All</option>
          <option>Electronics</option>
          <option>Fashion</option>
          <option>Home &amp; living</option>
          <option>Beauty &amp; health</option>
          <option>Groceries</option>
        </select>
        <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-mute" />
      </div>
      <span className="w-px h-5 bg-line mx-2" />
      <input
        type="search"
        placeholder="Search for products, brands, and vendors"
        className="flex-1 bg-transparent text-sm outline-hidden placeholder:text-mute min-w-0"
      />
      <button
        className="w-9 h-9 rounded-full bg-brand hover:bg-brand-strong text-white grid place-items-center"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
}

