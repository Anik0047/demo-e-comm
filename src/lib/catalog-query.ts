import { CATALOG_SORTS } from "@/types/catalog";
import type { ListingState, ListingCommittedAction, ListingTransition, ListingNotice, ParsedListingQuery, RawListingQuery } from "@/types/catalog";

const keys = ["category", "subcategory", "child", "vendor", "search", "minPrice", "maxPrice", "availability", "promotion", "freeShipping", "sort", "page"] as const;
const messages: Record<ListingNotice["reason"], string> = {
  "unavailable-filter": "An unavailable filter was removed.",
  "invalid-price": "Enter a valid whole-taka price range.",
  "truncated-search": "Your search was shortened to 200 characters.",
  "invalid-sort": "The default product order was restored.",
  "invalid-page": "The first page was selected.",
};
function integer(value: string): number | undefined {
  if (!/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

export function parseListingQuery(raw: RawListingQuery): ParsedListingQuery {
  const state: ListingState = { sort: "catalog", page: 1 };
  const notices: ListingNotice[] = [];
  const notice = (reason: ListingNotice["reason"]) => {
    if (!notices.some((item) => item.reason === reason)) notices.push({ reason, message: messages[reason] });
  };
  const first = (key: string) => {
    const value = raw instanceof URLSearchParams ? raw.get(key) : raw[key];
    return Array.isArray(value) ? value[0] : value ?? undefined;
  };
  for (const key of ["category", "subcategory", "child", "vendor"] as const) {
    const value = first(key);
    if (!value) continue;
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) state[key] = value;
    else notice("unavailable-filter");
  }
  const search = first("search")?.trim().replace(/\s+/gu, " ");
  if (search) {
    const points = Array.from(search);
    state.search = points.slice(0, 200).join("");
    if (points.length > 200) notice("truncated-search");
  }
  for (const key of ["minPrice", "maxPrice"] as const) {
    const value = first(key);
    if (value === undefined || value === "") continue;
    const number = integer(value);
    if (number === undefined) notice("invalid-price");
    else state[key] = number;
  }
  if (state.minPrice !== undefined && state.maxPrice !== undefined && state.minPrice > state.maxPrice) {
    delete state.minPrice;
    delete state.maxPrice;
    notice("invalid-price");
  }
  const availability = first("availability");
  if (availability === "in-stock" || availability === "out-of-stock") state.availability = availability;
  else if (availability) notice("unavailable-filter");
  const promotion = first("promotion");
  if (promotion === "flash-deals") state.promotion = promotion;
  else if (promotion) notice("unavailable-filter");
  const shipping = first("freeShipping");
  if (shipping === "true") state.freeShipping = true;
  else if (shipping) notice("unavailable-filter");
  const sort = first("sort");
  const validSort = CATALOG_SORTS.find((value) => value === sort);
  if (validSort) state.sort = validSort;
  else if (sort) notice("invalid-sort");
  const page = first("page");
  if (page) {
    const number = integer(page);
    if (number !== undefined && number > 0) state.page = number;
    else notice("invalid-page");
  }
  return { state, notices };
}

export function serializeListingState(state: ListingState): string {
  const query = new URLSearchParams();
  for (const key of keys) {
    const value = state[key];
    if (value === undefined || value === "" || (key === "sort" && value === "catalog") || (key === "page" && value === 1)) continue;
    query.set(key, String(value));
  }
  return query.toString();
}
export function buildProductsHref(state: ListingState = { sort: "catalog", page: 1 }, basePath = "/products"): string {
  const query = serializeListingState(state);
  return `${basePath}${query ? `?${query}` : ""}`;
}
export function transitionListingState(applied: ListingState, action: ListingCommittedAction, basePath = "/products"): ListingTransition {
  let candidate = { ...applied };
  let priceText: { minPrice: string; maxPrice: string } | undefined;
  switch (action.type) {
    case "filters": {
      const previousSubcategory = candidate.subcategory;
      candidate = { ...candidate, ...action.values };
      if (candidate.subcategory !== previousSubcategory) delete candidate.child;
      break;
    }
    case "search": candidate.search = action.value; break;
    case "price": priceText = action; break;
    case "sort": candidate.sort = action.value; break;
    case "page": candidate.page = action.value; break;
    case "remove": delete candidate[action.key]; break;
    case "clear": candidate = { sort: applied.sort, page: applied.page }; break;
  }
  const raw = new URLSearchParams(serializeListingState(candidate));
  if (priceText) {
    raw.set("minPrice", priceText.minPrice);
    raw.set("maxPrice", priceText.maxPrice);
  }
  const parsed = parseListingQuery(raw);
  let changed = serializeListingState(parsed.state) !== serializeListingState(applied);
  if (action.type === "clear" && applied.page !== 1) changed = true;
  if (changed && action.type !== "page") parsed.state.page = 1;
  return { ...parsed, changed, href: buildProductsHref(parsed.state, basePath) };
}
