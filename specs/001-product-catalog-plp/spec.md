# Feature Specification: Shared Product Catalog and Product Listing

**Feature Branch**: Existing `setup/spec-kit` (unchanged; no branch hook configured)

**Created**: 2026-11-03

**Status**: Draft — specification only; plan approval required before implementation

**Input**: Audit Kenakata's existing product architecture, preserve the homepage, specify the minimum safe catalog consolidation and a shareable Product Listing Page (PLP).

## Clarifications

### Session 2026-11-03

- Q: When should changes to PLP filters update the results and browser history? → A: Apply selection filters immediately on desktop and use an Apply filters button on mobile; submit price bounds together and search explicitly. Sort and pagination apply immediately. Each applied action creates one history entry.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See consistent products across the marketplace (Priority: P1)

As a shopper, I want the same product identity and information wherever I encounter it, with clearly distinguished promotional prices, without losing the existing homepage experience.

**Why this priority**: Catalog integrity underpins every listing and must not remove current deals.

**Independent Test**: Compare both homepage sections before and after the approved catalog work; change one shared product field in a temporary validation fixture and verify every consuming projection reflects it.

**Acceptance Scenarios**:

1. **Given** the current catalog, **when** both sections load, **then** the same five Flash Deals and ten curated Trending products retain their IDs, ordering, vendor information, ratings, prices, placeholder artwork, and responsive visibility.
2. **Given** a shared product name or regular price is updated, **when** its projections are read again, **then** all occurrences use the new canonical value; an explicit deal price remains a separate promotion override and the deal comparison price follows the updated regular price.
3. **Given** a product is not active, **when** a storefront list is requested, **then** it is absent from homepage lists, listing results, counts, and filter options derived from visible products.
4. **Given** this repository already has shared product records, **when** consolidation is scoped, **then** no records are deleted, recreated, or renamed merely to simulate a migration.

### User Story 2 - Discover products from existing navigation (Priority: P1)

As a shopper, I want product navigation and search to open a relevant listing that I can share or revisit.

**Why this priority**: Existing product discovery links are placeholders.

**Independent Test**: Follow each in-scope navigation entry in the mapping below and compare the URL, visible controls, heading/context, and results.

**Acceptance Scenarios**:

1. **Given** Flash Deals navigation on desktop, mobile, or the section header, **when** followed, **then** the PLP shows the configured mock deals and their deal prices.
2. **Given** a selected Trending tab, **when** either Trending View all control is followed, **then** the full catalog opens using that tab's sort; tabs themselves continue switching in place.
3. **Given** desktop search with a selected category, **when** a shopper submits text, **then** the search and category are represented in the URL and combined in the results. Mobile search searches all categories.
4. **Given** a top-level category tile or navbar category, **when** followed, **then** only products in that category or its supported descendants appear.

### User Story 3 - Narrow and compare the shared catalog (Priority: P1)

As a shopper, I want to filter products across vendors and order them by supported price, arrival, sales, or rating information.

**Why this priority**: The listing must help shoppers find relevant products without invented attributes.

**Independent Test**: Use the initial 16-product catalog and temporary edge-case fixtures to compare exact result IDs against the rules below.

**Acceptance Scenarios**:

1. **Given** no filters, **when** the PLP opens, **then** all 16 current active products are available across two pages of at most 12, with no duplicate IDs.
2. **Given** category `electronics`, vendor `tech-haven`, and promotion `flash-deals`, **when** combined, **then** Wireless Earbuds Pro and Smart Watch Series 5 are the only results.
3. **Given** promotion `flash-deals` and inclusive price range 1200–2450, **when** applied, **then** Cotton Panjabi, Bluetooth Speaker, and Wireless Earbuds Pro match using their displayed deal prices.
4. **Given** no filters, **when** newest, best-selling, or top-rated is selected, **then** Kids Building Blocks Set, Premium Basmati Rice 5kg, or Kids Building Blocks Set respectively appears first.
5. **Given** no matching products, **when** filters are applied, **then** an empty state preserves the filters and offers clear filters and an editable search, rather than claiming a load failure.

### User Story 4 - Restore a listing on every device (Priority: P2)

As a shopper, I want shared URLs and browser history to restore my selected filters, ordering, and page with accessible controls.

**Why this priority**: Navigation state must remain understandable across sessions and devices.

**Independent Test**: Open a filtered URL in another browser context, change its sort and page, then use back/forward and keyboard-only controls.

**Acceptance Scenarios**:

1. **Given** valid filters, sort, and page in a shared URL, **when** opened, **then** the same result IDs, order, page, and selected controls appear.
2. **Given** page 2, **when** any filter, committed search, or sort changes, **then** page resets to 1 and unrelated selections remain.
3. **Given** malformed URL values, **when** opened, **then** the normalization rules below apply without a crash and any ignored filter is disclosed.
4. **Given** a keyboard or small-screen user, **when** using the PLP, **then** all filtering, sorting, pagination, and reset controls are operable with visible focus and no page-level horizontal overflow.
5. **Given** desktop filters, **when** a selection changes, **then** results and URL update immediately with one history entry; editing price bounds alone changes neither until the bounds are submitted together.
6. **Given** mobile filters, **when** several filters or price bounds are edited, **then** results and URL remain unchanged until Apply filters commits them together with one history entry and resets page to 1.
7. **Given** either layout, **when** search is submitted or sort or page is selected, **then** that action updates the applied listing with one history entry; Back restores the preceding applied state without replaying draft edits.

### Edge Cases

- Zero results: show count zero, no pagination, and a clear-filters action. A valid empty category such as Books & stationery remains selected.
- Missing product referenced by a deal or curated list: never substitute another product; omit the unresolved reference at runtime and fail fixture-integrity verification before release.
- Missing vendor/category reference, duplicate product ID/slug/SKU, invalid deal price or stock limit, duplicate deal for a product: fail fixture-integrity verification; a runtime invalid catalog returns an accessible unavailable state instead of misleading cards or duplicate results.
- Inactive products remain hidden even when explicitly targeted by search or a deal. Current visibility is based on product status; do not silently add vendor moderation rules absent from the existing product services.
- Null publication dates sort after dated products; equal primary values use deterministic ties. Zero sales is zero, not unknown popularity. Unrated products have no invented rating and sort after rated products.
- Missing optional brand, tags, specifications, variants, or imagery must not create fictional filters or values. Preserve current placeholders for all 16 products; repair new media rendering only when actual media is introduced under an approved scope.
- Deal quota exhausted: retain configured deal membership, mark it unavailable in the PLP, and exclude it from an in-stock filtered listing. Canonical stock depletion also makes a PLP result unavailable. Homepage stock calculation is documented separately and must not be silently changed in preservation work.
- Current mock deal dates are metadata, not an enforced clock. Crossing the stored date boundaries or reaching countdown zero must not silently erase the five displayed products. A real-time promotion lifecycle requires a separately approved behavior change.
- Empty/whitespace search means no search filter. Very long input, invalid encodings, unsupported keys, repeated keys, contradictory price bounds, and unavailable category descendants follow URL rules below.
- A listing failure is distinct from no matches; retry retains the URL and selections. No artificial network requests, delay, or random failures are introduced for static data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 — Shared identity**: Retain the existing canonical catalog used by Trending as the sole source of product records for Flash Deals, Trending, and the PLP. Enforce unique IDs, slugs, and SKUs and valid category/vendor relationships. Acceptance: all initial 16 records survive, with zero duplicated canonical definitions in the Flash Deals fixture.
- **FR-002 — Minimal migration**: Reconfirm the audit against the implementation baseline before changing data. Because no redundant records or missing deal products were found, the initial migration is a no-op for canonical identities/content. If later drift introduces a missing deal product, report its full identity and source values and propose adding that exact record once to the shared catalog; resolve conflicting same-ID details with the owner before implementation. Never substitute a Trending item or reduce the catalog to its ten-item curated selection.
- **FR-003 — Separate promotions**: Keep deal identity, product reference, price override, start/end dates, quota, and deal sold count separate from canonical records. Do not store calculated discount percentages or copy canonical name/vendor/rating into promotions. Preserve campaign associations if introduced; none currently exist. Do not invent campaign membership from marketing copy.
- **FR-004 — Homepage preservation**: Preserve current section order, spacing, colors, typography, cards, placeholders, five configured deals, simulated countdown starting at 04:32:10, and hidden sold-progress markup. Preserve all Trending tab data and existing stable tie order, ten curated IDs, keyboard behavior, and 8 visible cards below 1280px/10 at and above 1280px. Both grids remain 2/4/5 columns at existing breakpoints. Only explicitly mapped links/search gain the scoped discovery behavior.
- **FR-005 — Complete listing**: List all active canonical products across vendors, not just the Trending subset. Expose only public card information, not moderation, approval, or other full-record internals. Display product name, vendor name, rating/count, BDT prices, applicable discounts, and existing placeholders using the shared card presentation.
- **FR-006 — Search**: Search product name, populated brand/tags, and associated vendor name. Trim, collapse whitespace, compare case-insensitively, split into whitespace tokens, and require each token to be a substring of at least one supported field. No fuzzy matching, synonym inference, SKU, description, or hidden-field search. Display the retained query; empty input clears it. Existing empty brand/tags contribute no matches.
- **FR-007 — Categories**: Allow one category slug selecting a canonical node and all descendants through parent relationships. Initial options are the eight top-level categories. Subcategory/child selection is supported only when real canonical nodes and product assignments exist; navbar strings are not such nodes. Do not add fabricated subcategory fixtures. Keep unsupported subcategory entries non-navigating as today and disclose this deferred capability in review.
- **FR-008 — Filters**: Support one category, one vendor, inclusive whole-taka minimum/maximum displayed price, in-stock/out-of-stock availability, configured Flash Deal membership, and free shipping. Combine dimensions with AND. Vendor options represent vendors of active canonical products, independent of current filters; never use vendor marketing product counts as listing totals. Category options include empty canonical categories. Omitted selections mean all. No brand, size, color, variant, or specification filter is required for empty fixture fields.
- **FR-009 — Availability**: For ordinary listings, available means untracked inventory or canonical stock greater than zero. In the promotion view it additionally requires remaining deal quota. Out-of-stock products stay browsable unless excluded by the filter and have explicit text status in the PLP without changing homepage layout. Availability is mock discovery information, not an inventory reservation or checkout guarantee.
- **FR-010 — Pricing**: Ordinary PLP views use canonical regular price and optional compare-at price. The Flash Deal view uses deal price and canonical regular price as its comparison, matching current Flash Deals cards. The price filter and price sorting always use the price shown in that view. Show promotion context so the price difference is understandable. Continue shared BDT formatting and derived discount rounding. No stacked discounts or voucher calculations.
- **FR-011 — Sorts**: Offer catalog order (default), price low to high, price high to low, New arrivals, Best sellers, and Top rated, exactly as defined below. Do not infer popularity from vendor statistics, review count alone, or a “this week” caption.
- **FR-012 — Navigation**: Activate in-scope product destinations in the mapping below consistently on existing desktop/mobile entries. Preserve the All categories menu trigger and Trending tab interactions. Non-product destinations remain separate dependencies, not PLP filters.
- **FR-013 — URL state**: Treat the normalized URL as the shareable source of applied filter, search, sort, and page state. Opening/reloading a link and browser back/forward restores those states. On desktop, selection filters apply immediately; price bounds are submitted together explicitly. On mobile, filter edits (including price bounds) remain unapplied until Apply filters is activated. Search requires explicit submission on both layouts. Sort and pagination apply immediately on both layouts. Each applied action that changes listing state creates one browser history entry; draft edits and keystrokes create none. URL normalization replaces the current entry as specified below. Reset page on filter/sort changes; pagination preserves all other valid parameters. Clear filters removes search/filter/page parameters and preserves the chosen sort.
- **FR-014 — Pagination**: Use 12 products per page, total result count, current page, previous/next, and numbered page links with accessible current-page state. Filter, then sort, then paginate. Clamp a valid excessive page to the last available page; zero results resolve to page 1 with pagination hidden. Never repeat or skip IDs across pages of an unchanged listing.
- **FR-015 — States**: Provide clear no-match and catalog-unavailable states, with reset/edit and retry actions respectively. During an actual pending transition show reserved-space, solid-color loading feedback and an accessible busy state; do not add fake waits. Preserve applied controls through errors.
- **FR-016 — Accessible responsive discovery**: Reuse the established design language and responsive grid, with mobile-accessible filters and sort controls. Use one page heading, semantic landmarks, labeled controls, visible selected states/focus, 44px interactive hit areas, keyboard-operable controls, polite result-count announcements, and reduced-motion behavior. Any filter drawer must support Escape, contained focus while open, and focus restoration. Preserve homepage tab arrow/Home/End behavior. Validate the full build-ui viewport matrix and no overflow from 320–1920px, including landscape.
- **FR-017 — Boundaries**: Follow Constitution v1.0.0 and existing typed data/service/component boundaries. Remain static frontend-only. No backend, API calls, database, authentication, payments, new component library, or unapproved dependency. Keep cart/wishlist and product-detail/storefront features outside this change.
- **FR-018 — Validation and discovery**: Validate catalog integrity, membership, filter intersections, price context, sorting ties/nulls, URL normalization/history, and pagination with meaningful automated checks during implementation using approved tooling. Validate homepage before/after visuals and discovery journeys. Provide PLP title, description, contextual heading, and server-visible content; do not introduce a fictional production domain or product structured data. Run required lint/build for later application changes, not this documentation-only invocation.

### Sorting Rules

| URL value | Primary ordering | Tie-breakers |
| --- | --- | --- |
| omitted or `catalog` | Existing canonical catalog order | Unique product ID ascending if needed |
| `price-asc` | Displayed price ascending | Product ID ascending |
| `price-desc` | Displayed price descending | Product ID ascending |
| `newest` | Publication date descending, null last | Product ID ascending |
| `best-selling` | Canonical product sold count descending | Product ID ascending |
| `top-rated` | Rated products first, average descending | Rating count descending, then product ID ascending |

New arrivals means publication date, matching the existing Trending service; do not substitute creation date. Homepage ties continue retaining curated input order; PLP uses ID ties across the entire catalog, so its result order need not be identical to the homepage subset. Product ID comparisons use consistent ascending string order, not locale-dependent browser settings. Catalog order in a promotion view is canonical product order restricted to configured deals; currently this matches the five-deal order.

### URL and Navigation Mapping

Proposed public route: `/products`, within the existing storefront shell. There is currently no PLP or category route. The skill's `/category/...` paths are future conventions, not implemented routes; this feature proposes a single listing URL and defers category aliases to avoid two competing contracts.

| Existing entry and source | Current behavior | Proposed destination/behavior |
| --- | --- | --- |
| All categories, `category-nav.tsx` | Opens mega menu | Keep trigger; canonical top-level links use `/products?category=<slug>` |
| Mega menu and mobile category names | `#` links from navbar labels | Map existing top-level names explicitly to canonical IDs/slugs; no slug guessing |
| Mega menu subcategory strings | `#`, no canonical nodes | Deferred until canonical assignments exist; do not mislabel a text search as category browsing |
| Category tiles / Categories View all | `#` | `/products?category=<slug>` / `/products` |
| Navbar, drawer, footer Flash deals; Flash Deals View all | `#` | `/products?promotion=flash-deals` |
| Navbar/footer New arrivals | `#` | `/products?sort=newest` |
| Navbar/footer Best sellers | `#` | `/products?sort=best-selling` |
| Trending All tab → either View all | Tabs local; links `#` | `/products` |
| Trending New arrivals tab → either View all | Tabs local; links `#` | `/products?sort=newest` |
| Trending Best sellers tab → either View all | Tabs local; links `#` | `/products?sort=best-selling` |
| Trending Top rated tab → either View all | Tabs local; links `#` | `/products?sort=top-rated` |
| Desktop/mobile product search, `search-form.tsx` | Submission prevented | `/products?search=<encoded query>`; desktop also uses selected canonical category slug; blank search still honors category |
| Hero Shop flash deals | `#` | `/products?promotion=flash-deals&category=electronics` to match its electronics context |
| Hero Explore fashion / Start shopping | `#` | `/products?category=fashion` / `/products` |
| Promo Shop home / Order now / Explore beauty | `#` | `/products?category=home-living`, `groceries`, `beauty-health` respectively; these are category views, not invented campaigns |
| Top vendors navbar/drawer/footer, section and banner View all | `#` | Future `/vendors` directory; requires separate vendor-discovery feature, leave placeholder for this scope |
| Vouchers | `#` | Future `/vouchers`; requires a voucher model and dedicated page, outside scope |
| Gift cards, including navbar subcategory label | `#` | Future `/gift-cards`; requires gift-card model/page, outside scope |
| ProductCard product/image and vendor links; VendorCard store links | `#` | Future product details and `/stores/<vendor-slug>`; outside scope, retain placeholders. PLP vendor filtering uses its own controls |
| Hero Start selling / Become a vendor | `#` | Separate seller onboarding dependency; outside scope |

Both Trending View all controls must follow the currently selected tab without changing their placement or turning tab selection into route navigation. A PLP reached from Trending explicitly presents the full catalog, not an undocumented “trending” membership filter. Existing promotional copy is mock marketing, not evidence of actual campaign discounts or delivery capability; these link changes must not create unsupported filter predicates from it.

Supported parameters are single-valued: `category` (canonical slug), `vendor` (canonical vendor slug), `search`, `minPrice`, `maxPrice`, `availability` (`in-stock` or `out-of-stock`), `promotion` (`flash-deals`), `freeShipping` (`true`), `sort` (table above), and `page` (positive integer).

Normalization rules:

- Omit defaults (`sort=catalog`, page 1), empty filters, and unrecognized keys from the normalized URL. Use stable key order: category, vendor, search, minPrice, maxPrice, availability, promotion, freeShipping, sort, page; encode values safely.
- For repeated keys, use the first occurrence and discard the rest. Validate after decoding; never treat URL input as executable content.
- Unknown category/vendor or unsupported enum values are removed with a visible, accessible “Some filters were unavailable and were cleared” notice. Invalid sort becomes catalog order. Unknown keys alone need no warning.
- Prices accept only nonnegative, finite whole-taka integers within the safe integer range. Remove an invalid bound; if minimum exceeds maximum, remove both and notify. Values beyond the catalog's prices are valid and may yield zero results; do not silently clamp prices.
- Search is normalized as above and limited to 200 characters; truncate excess with an accessible notice and normalize the URL. No search suggestions or external service is required.
- Invalid, zero, negative, fractional, nonnumeric, or unsafe-integer page becomes 1. A valid page exceeding the result page count clamps to the last page; normalization replaces the current history entry rather than creating a back-button loop.
- Retain all unrelated valid selections when normalizing. A change made through the UI resets page to 1. Direct URL normalization first computes the filtered total, then applies page bounds.
- Back/forward and reload restore applied listing state. Exact scroll restoration beyond normal browser behavior is not a new requirement; returning from a future detail page is deferred with that feature.

### Key Entities *(include if feature involves data)*

- **Canonical product**: One stable identity, category/vendor references, name/media, regular and comparison prices, inventory/visibility, rating/count, sales count, and publication date. Used across all product surfaces.
- **Category**: Unique identity/slug, parent relationship, and level; current dataset contains only roots. A product points to the deepest actual assigned node.
- **Vendor**: Public identity/name/slug associated with products. Vendor-level counts and ratings are distinct from product sales and ratings.
- **Flash Deal**: A separate promotion record referring to one canonical product, with deal price, dates, quota, and deal-specific sold count. This version preserves configured mock membership rather than claiming a live campaign lifecycle.
- **Curated Trending selection**: Ordered product IDs, not a second catalog. Its four tabs reorder the same active selection.
- **Card projection**: Public display fields resolved from a canonical product/vendor, with contextual promotional overrides and placeholder presentation metadata.
- **Listing state**: Validated search, category/vendor/filter selections, sort, page, total results, and public result cards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 16 initial products remain discoverable, each exactly once in an unfiltered traversal; all five current Flash Deals and ten Trending selections retain their identities.
- **SC-002**: Every scoped product navigation entry reaches the mapped listing state; none points to an unimplemented destination or silently changes its intended category/sort.
- **SC-003**: Every defined filter/sort/URL test yields the expected IDs, order, and count, including ties, empty results, inactive products, and invalid pages; sharing/reloading/back/forward restores the same applied state in all validation scenarios.
- **SC-004**: Homepage visual comparison shows no unexplained change to layout, typography, colors, card content, or responsive visibility at the required viewport matrix. The only intentional interaction differences are mapped links/search.
- **SC-005**: Keyboard-only users can complete search, combined filtering, sorting, pagination, and reset without inaccessible controls or focus traps; there is zero page-level horizontal overflow at the required widths.
- **SC-006**: With the initial catalog in a production build on a documented desktop and mobile test profile, committed listing changes present their resulting cards/count within one second after the local application is ready, measured over five repeated interactions per profile. Record actual results and device details rather than claiming a benchmark from source inspection.
- **SC-007**: A temporary shared name/price edit propagates to every applicable product appearance while preserving the separate deal-price override; there are zero duplicate canonical Flash Deals product definitions and zero backend or unrelated feature additions.

## Assumptions

- This invocation produces specifications/checklists and the Spec Kit active-feature pointer only. It does not invoke clarify, plan, tasks, or implementation automatically. Owner approval of the later plan is required before application changes.
- The initial shared catalog is the entire `products` export used by Trending, not `trendingProductIds`. This is confirmed repository behavior, not an inferred migration target.
- To preserve the existing mock experience, Flash Deal membership remains the configured five records, independent of wall-clock dates. PLP copy identifies the mock promotion context; a real-time date-based eligibility policy is deferred. Stored dates and countdown behavior remain intact.
- All current products are active, tracked, stocked at 100 by defaults, and have existing approved vendors. Edge-case behavior must be validated with temporary fixtures rather than silently altering shipped data.
- Initial subcategory browsing is unavailable because no canonical children or assignments exist. Support is conditional on approved future data; navbar labels do not authorize making up product classifications.
- Default page size is 12 and default PLP order is canonical catalog order. Trending View all expands to the whole catalog using the active tab's sort.
- No existing test runner is declared; planning must identify an approved way to run meaningful business-rule checks without adding a dependency without permission.

## Repository Findings and Duplication Audit

Audit is source-based on 2026-11-03. No application runtime, screenshot comparison, lint, or build was performed in this specification-only phase. Detailed evidence is in [repository-audit.md](repository-audit.md).

**Confirmed finding**: there are not separate canonical Flash Deals and Trending product datasets in the current checkout. Both services import `products` from `src/data/products.ts`. The Flash Deals fixture already stores references and promotion metadata separately. There is duplicated projection logic, not duplicated canonical product records. The requested consolidation therefore requires validation/preservation and reuse for the PLP, not product deletion.

## Dependencies, Open Questions, and Migration Risks

The following are explicit proposals/defaults for review, not blocking clarification markers:

1. **Promotion lifecycle**: Keep configured mock membership and 04:32:10 countdown for preservation. If the owner wants actual start/end enforcement, clarify that separately before planning dependent changes; enforcing current dates would remove products after November 2026 and change the homepage.
2. **Category expansion**: Actual subcategory IDs/slugs, parent relationships, and product assignments require approved data. No implementation can truthfully offer the navbar's subcategory taxonomy as catalog filters yet. Confirm whether a later feature should curate it.
3. **Trending destinations**: Proposed View all expands to the full catalog sorted like the selected tab. A curated-only PLP would require a separate explicit collection contract; it is not the default here.
4. **Promotion prices**: The proposed context-specific price rule preserves the existing regular-versus-deal distinction. Applying deal prices globally would be a separate pricing behavior change.
5. **Deferred destinations**: Vendor directory/store pages, vouchers, gift cards, product details, seller onboarding, checkout, cart/wishlist behavior, authentication, payment, and backend integration remain out of scope. Their proposed URLs do not authorize building pages or activating broken links.
6. **Discovery policy**: Production domain, canonical indexing rules for arbitrary filter combinations, sitemap strategy, and structured data remain Constitution D7 decisions. Provide page metadata without inventing production infrastructure.
7. **Migration risk**: Replacing the catalog with only ten Trending IDs would drop all five current deals and the smartphone. Enabling the commented sixth deal would change the homepage. Restoring the commented sold display would also violate the approved source baseline.
8. **Planning gates**: Re-read installed Next.js guides before application work, resolve rendering/search-parameter constraints in the actual installed version, choose validation tooling, and obtain plan approval. Then implement one reviewable section/increment at a time under project rules. Do not amend the constitution or design skills in this phase.
