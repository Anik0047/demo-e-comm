# Typed Service and Navigation Contracts

These are local TypeScript/UI interfaces, not HTTP APIs. No route handler, network service, database or Server Action is proposed.

## Service responsibilities

| Proposed operation | Input | Output/invariants |
| --- | --- | --- |
| `parseListingQuery` in `src/lib/catalog-query.ts` | Raw first-value-capable search record | Syntactically validated draft state + notice codes; no fixture import. |
| `serializeListingState` / `buildProductsHref` | Typed normalized state or explicit discovery selection | Whitelisted encoded `/products` URL, stable key order and omitted defaults. |
| `transitionListingState` | Applied state and a typed committed action | Preserve unrelated fields; reset page except pagination; clear retains sort. |
| `getProductListing` in `src/services/catalog.ts` | Raw page search record | Promise of ListingSuccess or ListingUnavailable; reads existing fixtures, validates references, resolves facets, filters/sorts/clamps/projects. |
| `getCatalogOptions` in catalog service | Validated canonical products/categories/vendors | Public category/vendor options; no current-filter-dependent disappearance. |
| `queryCatalog` in `src/services/catalog-rules.ts` | Readonly injected products/categories/vendors/deals + validated state | Deterministic selected IDs/context/count/page; no source mutations or UI dependencies. |
| `projectProductCard` in `src/services/product-card.ts` | Canonical product, resolved vendor summary, explicit price/stock/art overrides | Existing ProductCardData only. Does not choose membership or return full records. |
| `validateCatalog` in integrity service | Readonly fixture collections and selection refs | Typed fatal/nonfatal issues; unresolved selection refs omitted at runtime but fail release integrity checks. |

Fixture imports stay in services. Pure lib functions use types only. Canonical internal product data never becomes a client control prop. Existing homepage services continue returning their current signatures, including `getFlashDeals(): {endsInSeconds, items}` and four Trending tab arrays. Tests inject copies into pure rules rather than editing shipped fixtures.

Options are based on active canonical products, not vendor moderation or marketing totals. Preserve valid category options with zero products. Failure handling must not turn a bad dataset into an apparently valid empty store.

## Discovery destinations

The spec mapping is authoritative. The builder produces normalized key order even where a hand-written spec example lists promotion before category.

| Entry | Destination | Proposed source changes |
| --- | --- | --- |
| All products / Categories View all / general shopping CTA | `/products` | Existing category header and hero CTA destinations; PLP heading/reset context. |
| Flash Deals navbar/drawer/footer and section View all | `/products?promotion=flash-deals` | `category-nav.tsx`, `mobile-drawer.tsx`, `flash-deals-section.tsx`, `src/data/footer.ts`. |
| New arrivals navbar/footer | `/products?sort=newest` | `category-nav.tsx`, `src/data/footer.ts`. |
| Best sellers navbar/footer | `/products?sort=best-selling` | Same files. |
| Top rated | `/products?sort=top-rated` | Existing Trending View all in Top rated state and PLP sort control. |
| Canonical category tiles / menu root names | `/products?category=<slug>` | `category-tile.tsx`, `mega-menu.tsx`, `mobile-drawer.tsx`; enrich `src/types/navigation.ts` and `src/services/navbar.ts` with explicit canonical mappings. |
| Trending All / New arrivals / Best sellers / Top rated → either View all | `/products`, or newest/best-selling/top-rated URLs | `trending-section.tsx`, `trending-tabs.tsx`: same local active state controls both links. Tab click stays on homepage. |
| Desktop header search | `/products?category=<selected-slug>&search=<query>` with empty values omitted | `search-form.tsx`; typed option props through `navbar.tsx` / `main-header.tsx` from navbar service. Preserve existing All + five category labels and order; assign exact canonical slug values. |
| Mobile header search | `/products?search=<query>` | Same form; no category selector or implicit retained category. |
| Hero Shop flash deals | `/products?category=electronics&promotion=flash-deals` | Add CTA destination field in `src/types/banner.ts` / `src/data/banner.ts`; render in `hero-slider.tsx`. |
| Hero Explore fashion / Start shopping | `/products?category=fashion` / `/products` | Same hero files; seller slide stays placeholder. |
| Promo home / groceries / beauty | `/products?category=home-living`, `groceries`, `beauty-health` | `src/data/promo-banners.ts` href fields only; existing typed service/card already renders them. |

Component names above are under existing `src/components/layout/navbar` or `src/components/home` section directories. Exact category top-level mapping in the navbar service is: Electronics→electronics, Fashion→fashion, Home & living→home-living, Beauty & health→beauty-health, Groceries→groceries, Mother & baby→mother-baby, Sports & outdoor→sports-outdoor, Books & stationery→books-stationery. Validate mapping targets, never derive slugs mechanically from labels. Unsupported subcategory strings retain existing placeholder behavior and gain no invented filter semantics.

The All categories button remains a menu trigger. There is no current All Products or Top Rated navbar item; support their destination semantics through existing affordances without adding new navbar items or moving approved UI. Add no new logo behavior under this scope. Top Vendors, Vouchers, Gift Cards, seller onboarding, track order, card product/vendor links and cart/wishlist controls remain separate placeholders/dependencies; do not activate future broken URLs.

Header search starts a fresh discovery context using its query and selected desktop category. PLP-local search preserves unrelated applied listing filters, including promotion/vendor. This distinction avoids silently retaining a hidden promotion filter when users start a new search from the global navbar.

Trending implementation must place the existing header markup and both links under one local active-tab owner while keeping the server section responsible for loading the four public arrays. Preserve DOM placement, classes, subtitle, counts, arrow/Home/End handling and hidden last two cards below 1280px. Neither tab selection nor keyboard movement adds a history entry; View all expands to the complete active catalog sorted by that tab.

## Consumer boundaries and regression contracts

- Components import types/services, never raw fixtures. Header/category options are public projections from services.
- Hero/promo/footer modifications are destination metadata changes only; decorative vendor models and mini-cart fixtures are not canonical catalog migrations.
- Maintain five configured homepage deals, same regular/deal prices, derived badge rounding and 16,330 initial countdown seconds. Reaching zero/date expiry never removes membership.
- ProductCard markup and placeholder controls remain unchanged. PLP wrappers may show availability/no-review text; do not enable sold progress, wishlist/cart mutations, or future image behavior.
- No full canonical product/vendor objects in client serialization. Server result slots retain server rendering even when placed inside a client control coordinator.
