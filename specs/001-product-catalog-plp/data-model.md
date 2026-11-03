# Data Model: Shared Catalog and Listing

No persisted schema, migration or replacement fixture is introduced. Existing types remain the domain authority. Types below describe proposed listing contracts rather than implementation bodies.

## Existing entities and relationships

| Entity/source | Fields relevant to listing | Rules |
| --- | --- | --- |
| Product, `src/types/product.ts` / `src/data/products.ts` | id, slug, sku, name, categoryId, vendorId, price, compareAtPrice, mainImage, brand, tags, status, stock, trackInventory, freeShipping, ratingAverage, ratingCount, soldCount, publishedAt | Preserve 16 unique records. id/slug/SKU unique. category/vendor references must resolve. Only status `active` is public. Prices are whole BDT taka; optional compare-at is independent of promotion price. |
| Category, `src/types/category.ts` / `src/data/categories.ts` | id, name, slug, parentId, level | Eight roots today. Unique id/slug; parent null for roots; no cycles or dangling parents; levels 1–3 follow actual ancestry. Products reference deepest assigned actual node. |
| Vendor, `src/types/vendor.ts` / `src/data/vendors.ts` | id, name, slug | Valid product relation; public projection only name/slug and option label/value. Do not expose private/moderation fields or use vendor productCount/rating as product metrics. |
| FlashDeal, `src/types/product.ts` / `src/data/flash-deals.ts` | id, productId, dealPrice, startsAt, endsAt, stockLimit, soldCount | Five enabled records; unique deal id and one enabled deal per product. Positive whole-taka deal price below regular price; positive integer quota; nonnegative integer deal sold count. Exhausted quota is a valid unavailable state, not a reason to erase membership. Dates are retained metadata and do not enforce eligibility. |
| Trending selection, `src/data/products.ts` | trendingProductIds | Ten ordered references; not ten canonical records or a second catalog. Resolve active products and retain current stable order/ties per tab. |
| Placeholder maps | product ID → icon/tone | Preserve both maps. They are presentation metadata, not canonical duplicates. Include smartphone art even though deal-6 is disabled. |
| ProductCardData / FlashDealItem | public fields already declared | No rating/date/sales inventions. Explicit projection context controls price and inStock. Homepage deal item retains quota/sold props. |

Canonical stock, sales and review counts are nonnegative integers. Stored publication date must be null or a valid timestamp; dated products sort before null. Product rating is finite in 0–5; a zero ratingCount means unrated for PLP ordering and explanatory text. Zero sales is a valid zero. Do not infer values from other entities or adjust current records to satisfy an aesthetic preference.

An invalid duplicate identity, missing category/vendor, malformed numeric business value, invalid promotion price/quota or category cycle is fatal to PLP fixture validity. An unresolved curated/deal product reference is omitted at runtime without substitution but fails fixture-integrity verification before release. Inactive referenced products are simply hidden. Validate all fixture relationships before exposing public cards; diagnostic detail belongs in test failures, not shopper-visible errors.

## Proposed listing types (`src/types/catalog.ts`)

| Contract | Shape and meaning |
| --- | --- |
| CatalogSort | `catalog`, `price-asc`, `price-desc`, `newest`, `best-selling`, `top-rated` |
| ListingState | Optional category/vendor slugs, search, minPrice/maxPrice, availability (`in-stock`/`out-of-stock`), promotion (`flash-deals`), freeShipping (`true`); required normalized sort and positive page. Page size is fixed at 12 and is not URL-controlled. |
| ListingOptions | Category `{slug,name}` options including empty canonical roots; vendor `{slug,name}` options from active products independent of current filters. Only actual canonical children may be added in a later approved fixture scope. |
| ListingNotice | Typed reason such as unavailable-filter, invalid-price, truncated-search; safe user-facing message. No raw decoded HTML or error stack. |
| ListingItem | Existing ProductCardData plus PLP-only availability/no-review presentation metadata; no full Product serialized. Contextual promotion is listing-level information. |
| ListingSuccess | Discriminator `status: ready`, normalized state/href, notices, options, totalResults, totalPages, pageSize 12, visible items. Empty results are successful. |
| ListingUnavailable | Discriminator `status: unavailable`, syntactically normalized retained state, notices and independently valid options where available. No invented zero total or fake cards. Preserve unresolved selected labels as text where catalog options cannot safely resolve them. Do not clear selections merely because the fixture failed. |
| ListingDraft | Client-only search/price text and modal filter edits initialized from applied state; never persisted, sent as a domain record or placed in URL before commit. |

## Derived data, never stored

- Regular availability: `!trackInventory || stock > 0`.
- PLP promotion availability: regular availability AND `deal.soldCount < deal.stockLimit`.
- Homepage Flash Deal availability remains quota-only to preserve source behavior.
- Display price: canonical price normally, dealPrice with `promotion=flash-deals`.
- Display comparison: canonical compareAtPrice normally, canonical price in the promotion view.
- Discount: existing `calcDiscountPercent` and rounding, formatted through existing `formatPrice`.
- Category closure: selected canonical node plus reachable descendants; cycle-safe traversal. No category matching against navbar text.
- Counts and pagination: active → contextual membership/price/availability → AND filters → deterministic sort → total → page clamp → slice.

## State transitions

Applied state lives in the URL. Desktop selection, explicit price/search submit, mobile Apply, chip removal, clear, and sort commit reset page to 1. Pagination changes only page. Clear removes all search/filter/page keys while retaining sort. Changed commits push one history entry; normalization replaces; unchanged actions do nothing. Draft editing never creates history. Back/Forward/reload replace local draft state with the normalized applied state; cancelling a modal or switching to desktop discards unapplied modal edits.

There are no product, inventory, payment or promotion lifecycle mutations. Temporary edge-case test fixtures are isolated copies; no persistence or mock transaction state is introduced.
