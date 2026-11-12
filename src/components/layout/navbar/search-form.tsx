"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Clock3, Search } from "lucide-react";
import type { Category } from "@/types/category";
import type { SearchProduct } from "@/types/navigation";
import { matchesCatalogSearchFields } from "@/services/catalog-rules";

interface SearchFormProps {
  mobile?: boolean;
  categories: Category[];
  searchProducts: SearchProduct[];
  popularSearches: string[];
}

type ActiveItem =
  | { type: "popular"; value: string }
  | { type: "product"; value: SearchProduct }
  | { type: "category"; value: Category }
  | { type: "all"; value: string }
  | { type: "all-categories"; value: string };

export function SearchForm({ mobile = false, categories, searchProducts, popularSearches }: SearchFormProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const mainCategories = categories.filter((category) => category.level === 1);
  const normalizedQuery = query.trim().replace(/\s+/gu, " ");

  const scopedProducts = useMemo(() => selectedCategory
    ? searchProducts.filter((product) => product.categorySlug === selectedCategory)
    : searchProducts, [searchProducts, selectedCategory]);
  const productMatches = useMemo(() => normalizedQuery
    ? scopedProducts.filter((product) => matchesCatalogSearchFields(product.searchFields, normalizedQuery)).slice(0, 5)
    : [], [normalizedQuery, scopedProducts]);
  const categoryMatches = useMemo(() => normalizedQuery
    ? mainCategories.filter((category) => (!selectedCategory || category.slug === selectedCategory) && matchesCatalogSearchFields([category.name], normalizedQuery)).slice(0, 3)
    : [], [normalizedQuery, mainCategories, selectedCategory]);
  const scopedPopularSearches = useMemo(() => popularSearches.filter((term) =>
    !selectedCategory || searchProducts.some((product) => product.name === term && product.categorySlug === selectedCategory),
  ).slice(0, 6), [popularSearches, searchProducts, selectedCategory]);
  const items: ActiveItem[] = normalizedQuery
    ? [
      ...productMatches.map((value) => ({ type: "product" as const, value })),
      ...categoryMatches.map((value) => ({ type: "category" as const, value })),
      ...(selectedCategory && productMatches.length === 0 ? [{ type: "all-categories" as const, value: normalizedQuery }] : [{ type: "all" as const, value: normalizedQuery }]),
    ]
    : scopedPopularSearches.map((value) => ({ type: "popular" as const, value }));

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, []);

  function navigate(search: string, category?: string) {
    const params = new URLSearchParams();
    const cleanSearch = search.trim().replace(/\s+/gu, " ");
    if (cleanSearch) params.set("search", cleanSearch);
    if (category) params.set("category", category);
    const queryString = params.toString();
    setOpen(false);
    router.push(queryString ? `/products?${queryString}` : "/products");
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(normalizedQuery, selectedCategory || undefined);
  }

  function choose(item: ActiveItem) {
    if (item.type === "popular") navigate(item.value, selectedCategory || undefined);
    else if (item.type === "product") {
      setOpen(false);
      router.push(`/products/${encodeURIComponent(item.value.slug)}`);
    }
    else if (item.type === "category") navigate("", item.value.slug);
    else if (item.type === "all-categories") navigate(item.value);
    else navigate(item.value, selectedCategory || undefined);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === "ArrowDown" && open && items.length) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp" && open && items.length) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === "Enter" && open && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      choose(items[activeIndex]);
    }
  }

  function renderSuggestions() {
    if (!open) return null;
    let optionIndex = 0;
    const option = (item: ActiveItem, label: React.ReactNode, key: string) => {
      const index = optionIndex++;
      return (
        <button
          key={key}
          id={`${listId}-option-${index}`}
          type="button"
          role="option"
          aria-selected={activeIndex === index}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(item)}
          className={`flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-soft ${activeIndex === index ? "bg-soft" : ""}`}
        >
          {label}
        </button>
      );
    };

    return (
      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-line bg-white py-2 shadow-lg">
        {!normalizedQuery && <p role="presentation" className="px-4 pb-1 pt-2 text-xs font-bold text-mute">Popular searches</p>}
        {normalizedQuery && !productMatches.length && (!categoryMatches.length || selectedCategory) && <p role="status" aria-live="polite" className="px-4 py-3 text-sm text-mute">{selectedCategory ? `No matching products in ${mainCategories.find((category) => category.slug === selectedCategory)?.name ?? "this category"} for “${normalizedQuery}”.` : `No matching suggestions for “${normalizedQuery}”.`}</p>}
        <div id={listId} role="listbox" aria-label={normalizedQuery ? "Search suggestions" : "Popular searches"}>
          {!normalizedQuery ? items.map((item, index) => option(item, <><Clock3 aria-hidden="true" className="size-4 shrink-0 text-mute" /><span className="min-w-0 flex-1 truncate">{item.value as string}</span><ArrowRight aria-hidden="true" className="size-4 text-mute" /></>, `popular-${index}`)) : <>
            {productMatches.length > 0 && <div role="group" aria-label="Products">
              <p role="presentation" className="px-4 pb-1 pt-2 text-xs font-bold text-mute">Products</p>
              {productMatches.map((product) => option(
                { type: "product", value: product },
                <><Search aria-hidden="true" className="size-4 shrink-0 text-mute" /><span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink">{product.name}</span><span className="block truncate text-xs text-mute">{product.categoryName}</span></span></>,
                `product-${product.id}`,
              ))}
            </div>}
            {categoryMatches.length > 0 && <div role="group" aria-label="Categories">
              <p role="presentation" className="px-4 pb-1 pt-2 text-xs font-bold text-mute">Categories</p>
              {categoryMatches.map((category) => option(
                { type: "category", value: category },
                <><Search aria-hidden="true" className="size-4 shrink-0 text-mute" /><span className="min-w-0 flex-1 truncate">{category.name}</span><span className="text-xs text-mute">Category</span></>,
                `category-${category.id}`,
              ))}
            </div>}
            {selectedCategory && !productMatches.length
              ? option({ type: "all-categories", value: normalizedQuery }, <><span className="min-w-0 flex-1 truncate font-bold text-brand-strong">Search all categories for “{normalizedQuery}”</span><ArrowRight aria-hidden="true" className="size-4 text-brand-strong" /></>, "all-categories")
              : option({ type: "all", value: normalizedQuery }, <><span className="min-w-0 flex-1 truncate font-bold text-brand-strong">View all results for “{normalizedQuery}”</span><ArrowRight aria-hidden="true" className="size-4 text-brand-strong" /></>, "view-all")}
          </>}
        </div>
      </div>
    );
  }

  const wrapperClass = mobile
    ? "md:hidden relative px-4 pb-3"
    : "relative hidden min-w-0 flex-1 items-center md:flex";
  const formClass = mobile
    ? "flex h-11 items-center rounded-full border border-transparent bg-soft pl-4 pr-1.5 focus-within:border-brand focus-within:bg-white"
    : "flex h-12 w-full min-w-0 items-center rounded-full border border-transparent bg-soft pl-2 pr-1.5 transition-colors focus-within:border-brand focus-within:bg-white";

  return (
    <div ref={wrapperRef} className={wrapperClass}>
      <form className={formClass} onSubmit={submitSearch} role="search">
        {!mobile && <div className="relative shrink-0">
          <select
            name="category"
            className="w-[84px] cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-7 text-sm font-medium outline-hidden lg:w-auto"
            aria-label="Search category"
            value={selectedCategory}
            onChange={(event) => { setSelectedCategory(event.target.value); setActiveIndex(-1); }}
          >
            <option value="">All</option>
            {mainCategories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-mute" />
        </div>}
        {!mobile && <span aria-hidden="true" className="mx-2 h-5 w-px bg-line" />}
        <input
          ref={inputRef}
          type="search"
          name="search"
          value={query}
          role="combobox"
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          placeholder={mobile ? "Search Kenakata" : "Search for products, brands, and vendors"}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          className="min-w-0 flex-1 bg-transparent text-sm outline-hidden placeholder:text-mute"
        />
        <button
          type="submit"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white hover:bg-brand-strong"
          aria-label="Search"
        >
          <Search className={mobile ? "size-4" : "size-5"} />
        </button>
      </form>
      {renderSuggestions()}
    </div>
  );
}
