# Tasks: Shared Product Catalog and Product Listing

**Input:** Approved design artifacts in `specs/001-product-catalog-plp/`.
**Prerequisites reviewed:** `spec.md` and 2026-11-03 clarification; `plan.md` and owner decisions; `research.md`; `data-model.md`; `contracts/listing-state.md`; `contracts/services-and-navigation.md`; `quickstart.md`; `repository-audit.md`; `checklists/requirements.md`; root `AGENTS.md`; Constitution v1.0.0; relevant build-ui/UI skill guidance already reviewed during planning.
**Created:** 2026-11-03. **Status:** Task documentation only; no implementation or dependency installation performed.
**Tests:** Required by the feature specification, user and constitution. Node rule harness and development-only Playwright are approved for implementation; no other dependency is implied.

## Format and execution rules

- Each task is `- [ ] Tnnn [P?] [USn?] Description` with concrete repository-relative file paths and explicit dependencies. IDs follow the intended execution order.
- `[P]` marks independent test-authoring work within the same phase once listed predecessors and phase entry gates are complete. It does not permit concurrent edits to shared files or bypass review. UI increments are deliberately sequential.
- Setup/foundation/final tasks have no story label; story tasks retain the specification's original US numbers even where dependencies reorder equal-priority stories.
- Tests are authored before corresponding implementation. New behavior should fail for the expected reason first, then pass at the phase gate; existing preservation baselines should pass before and after changes. Do not accept failures caused only by a broken runner as meaningful red tests.
- Every review checkpoint means stop for the user's section review before the next UI increment, as required by AGENTS.md/Constitution X. A task with both implementation and review is complete only after validation and review are recorded. Capture review evidence in `specs/001-product-catalog-plp/validation.md` during implementation, not now.
- Preserve all 16 canonical products, ten curated Trending IDs, five enabled Flash Deals, both placeholder maps, 04:32:10 simulated countdown and homepage design. No canonical fixture migration or duplicate runtime catalog; test snapshots/copies are isolated validation artifacts only.
- Keep frontend-only static/mock scope. Top Vendors, Vouchers, Gift Cards, product details, seller onboarding, cart/wishlist functionality and other unrelated destinations remain separate features.
- Existing 2026-11-03 approvals persist: use the 1024px filter breakpoint, approved testing tools and accepted two checklist exceptions without requesting the same decisions again. Keep checklist markers/rationale honest. This task file does not itself authorize implementation, installations or automatic `$speckit-implement`.

## Path conventions

One existing Next.js app: `src/app/(storefront)/products/`, `src/components/products/`, `src/services/`, `src/types/`, `src/lib/`; tests in `tests/catalog/` and `tests/e2e/`. All paths below are relative to repository root. No backend directory or API schema is introduced.

## Phase 1: Setup — Approved validation infrastructure

**Purpose:** Prepare only the existing application and approved test tooling for later work; do not initialize another project. These are future implementation tasks, not commands executed during task generation.

**Entry gate:** Implementation must be explicitly requested. The 2026-11-03 approvals already cover the 1024px breakpoint, Node harness, necessary development-only Playwright tooling and two checklist exceptions. Do not ask for those decisions again. Environment network/install permissions still apply.

- [ ] T001 Reconfirm `AGENTS.md`, `.specify/memory/constitution.md`, `.agents/skills/build-ui/SKILL.md`, relevant UI skill guidance and the approved documents; re-read installed Next.js `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`, `error.md`, `loading.md` and `01-app/02-guides/migrating-to-cache-components.md`; record baseline git state, versions, approvals and existing lint/build failures in `specs/001-product-catalog-plp/validation.md` without altering checklist markers or canonical data. **Depends on:** none; implementation authorization required.
- [ ] T002 Create `scripts/test-catalog.mjs` and `tsconfig.catalog-tests.json` using Node test/assert and installed TypeScript: compile test dependency closure to a unique temporary CommonJS directory, rewrite emitted `@/` imports to relative emitted paths, run emitted tests, propagate compile/test failures and clean only that temporary directory; add `tests/catalog/harness.test.ts` proving alias resolution and execution of an existing service without source rewrites or a new rule-test package. **Depends on:** T001.
- [ ] T003 Add only the approved development dependency `@playwright/test` with pnpm in `package.json` and `pnpm-lock.yaml`, install necessary browser binaries for selected Chromium/WebKit profiles, and create `playwright.config.ts` with isolated production-build server lifecycle, desktop/mobile projects and screenshots/traces on failure; scope test/report ignores in `.gitignore` as needed without replacing existing rules. **Depends on:** T002.
- [ ] T004 Capture unchanged homepage service outputs/identity manifests in `tests/catalog/fixtures/homepage-baseline.json` and create/run `tests/e2e/homepage-regression.spec.ts` before refactoring: record five deals, ten curated products, all tab orders, existing cards/placeholders, section order, hidden sold markup, static actions and deterministic countdown screenshots at 360/768/1024/1280; record evidence in `specs/001-product-catalog-plp/validation.md`. Baselines are test oracles, never a second runtime catalog. **Depends on:** T003.

## Phase 2: Foundational — Listing contracts, query rules and typed services

**Purpose:** Complete the shared nonvisual infrastructure before any user-story UI work. Reuse existing Product/Category/Vendor/FlashDeal types and fixtures; do not migrate or duplicate them.

**Tests first:** Add meaningful expected-output tests before the corresponding behavior. Verify the harness itself works; expected red tests must reflect missing behavior, not a broken runner. All foundational tests must pass at the foundation checkpoint.

- [ ] T005 Define shared contracts in `src/types/catalog.ts` without duplicating `Product`: quote/enforce CatalogSort values “`catalog`, `price-asc`, `price-desc`, `newest`, `best-selling`, `top-rated`”; ListingState “Optional category/vendor slugs, search, minPrice/maxPrice, availability (`in-stock`/`out-of-stock`), promotion (`flash-deals`), freeShipping (`true`); required normalized sort and positive page. Page size is fixed at 12 and is not URL-controlled.” Define public options with “Category `{slug,name}` options including empty canonical roots; vendor `{slug,name}` options from active products independent of current filters.”; notices with “Typed reason such as unavailable-filter, invalid-price, truncated-search; safe user-facing message. No raw decoded HTML or error stack.”; items with “Existing ProductCardData plus PLP-only availability/no-review presentation metadata; no full Product serialized. Contextual promotion is listing-level information.”; drafts with “Client-only search/price text and modal filter edits initialized from applied state; never persisted, sent as a domain record or placed in URL before commit.”; and typed committed-action plus ready/unavailable unions from `data-model.md`. **Depends on:** T004.
- [ ] T006 [P] Write query/transition tests in `tests/catalog/catalog-query.test.ts` for first repeated values, one-time decoding/malformed encodings, whitespace/case, 200-code-point truncation, unsafe/negative/fractional/exponent integers, reversed bounds, enums/default omission, stable key order, safe fixed-path encoding, round-trip idempotence, same-state no-op, page reset, clear retaining sort and draft non-commit. **Depends on:** T005.
- [ ] T007 [P] Write integrity tests in `tests/catalog/catalog-integrity.test.ts` using copied fixtures for duplicate identity/SKU/slug, missing vendor/category, category cycle/dangling parent/level mismatch, invalid money/stock/rating/date/quota, duplicate enabled deal, inactive refs and unresolved selection refs; assert fatal unavailable versus runtime omission with release-check failure, without changing `src/data/products.ts` or `src/data/flash-deals.ts`. **Depends on:** T005.
- [ ] T008 [P] Write exact-ID filter/search/availability tests in `tests/catalog/catalog-filters.test.ts`: all 16 active records, supported field token-AND matching and excluded hidden fields, real category descendant closure, empty books category, active-product vendor options independent of filters, all filter AND intersections, canonical versus deal prices, free shipping and tracked/untracked/depleted inventory/quota. Assert no input mutation. **Depends on:** T005.
- [ ] T009 [P] Write ordering/page tests in `tests/catalog/catalog-sorting.test.ts`: exact ID sequences for six sorts, publication rather than creation dates, stored zero sales, rating averages/count ties, ordinal ID ties, null dates and unrated last, no locale dependence, filter→sort→count→clamp→slice, 12+4 unique traversal, empty page1/no pagination and excessive-page clamping. **Depends on:** T005.
- [ ] T010 Implement `parseListingQuery`, `serializeListingState`, `buildProductsHref` and `transitionListingState` in `src/lib/catalog-query.ts` without fixture imports; enforce “Trimmed, collapsed-whitespace query, max 200 characters”, “Decimal digits representing nonnegative safe integers in whole taka”, and “Positive safe integer represented by decimal digits”; first occurrence wins, unknown keys/defaults omitted, invalid enums/slugs produce typed notices at their appropriate validation stage, reversed prices removed, Unicode truncation safe, fixed `/products` path, contract key order and explicit action/page rules. **Depends on:** T006.
- [ ] T011 Implement `src/services/catalog-integrity.ts` enforcing “Preserve 16 unique records.” and “id/slug/SKU unique. category/vendor references must resolve. Only status `active` is public.”; “Eight roots today.” and “Unique id/slug; parent null for roots; no cycles or dangling parents; levels 1–3 follow actual ancestry.”; “Five enabled records; unique deal id and one enabled deal per product. Positive whole-taka deal price below regular price; positive integer quota; nonnegative integer deal sold count.” Preserve exhausted quota as valid unavailable membership and distinguish missing selection refs from fatal catalog errors. **Depends on:** T007.
- [ ] T012 Complete scalar validation in `src/services/catalog-integrity.ts`: “Prices are whole BDT taka; optional compare-at is independent of promotion price.”; “Canonical stock, sales and review counts are nonnegative integers. Stored publication date must be null or a valid timestamp; dated products sort before null. Product rating is finite in 0–5; a zero ratingCount means unrated for PLP ordering and explanatory text. Zero sales is a valid zero.” Keep detailed diagnostics in tests rather than shopper output. **Depends on:** T011.
- [ ] T013 Extend `src/services/categories.ts` with typed canonical category lookup from existing roots, preserving `getMainCategories()` and all eight records; respect “Products reference deepest assigned actual node.” and “Only actual canonical children may be added in a later approved fixture scope.” Provide no invented navbar subcategory fixtures. **Depends on:** T012.
- [ ] T014 Implement pure dataset-injected selection/filter/sort/pagination functions in `src/services/catalog-rules.ts`, satisfying `tests/catalog/catalog-filters.test.ts` and `tests/catalog/catalog-sorting.test.ts`: active-only, truthful facets, safe descendant traversal, token-AND search, inclusive displayed-price bounds, six deterministic sorts, regular inventory versus promotion inventory-plus-quota, configured deals independent of dates, fixed 12/page and immutable inputs. **Depends on:** T008, T009, T010, T013.
- [ ] T015 Write public service/projector tests in `tests/catalog/catalog-service.test.ts` and `tests/catalog/product-card.test.ts` for minimized DTOs, all 16 existing placeholder projections including smartphone, context-specific price/stock overrides, canonical propagation using isolated copies, missing-ref omission, unavailable state preserving selections, and options unaffected by current filters. **Depends on:** T014.
- [ ] T016 Implement pure `projectProductCard` in `src/services/product-card.ts` with canonical Product/resolved public vendor inputs and explicit price/stock/art overrides; preserve “No rating/date/sales inventions. Explicit projection context controls price and inStock. Homepage deal item retains quota/sold props.” Do not select collections inside the projector or change `src/components/shared/product-card.tsx`. **Depends on:** T015.
- [ ] T017 Implement `getProductListing` and `getCatalogOptions` in `src/services/catalog.ts` composing existing fixtures, integrity/query/rule functions and projector; return “Discriminator `status: ready`, normalized state/href, notices, options, totalResults, totalPages, pageSize 12, visible items. Empty results are successful.” or “Discriminator `status: unavailable`, syntactically normalized retained state, notices and independently valid options where available.” Enforce “No invented zero total or fake cards.” and “Do not clear selections merely because the fixture failed.” Preserve both placeholder maps and all selections/records. **Depends on:** T016.
- [ ] T018 Run the Node harness, TypeScript check, `pnpm lint` and `pnpm build` for foundation changes; verify `src/data/products.ts`, `src/data/flash-deals.ts`, `src/data/categories.ts` and `src/data/vendors.ts` remain unchanged and components have no raw fixture imports; record commands/results in `specs/001-product-catalog-plp/validation.md` and resolve scoped failures before story work. **Depends on:** T017.

## Phase 3: User Story 1 — Consistent products without homepage regression (P1)

**Goal:** Prove shared identity and presentation reuse without any data migration or visible homepage change.

**Independent test:** Existing homepage services/cards retain their exact baseline output; changing a canonical field in an isolated test fixture updates every applicable projection while deal price remains a separate override.

**MVP increment:** Preservation and reusable catalog services; this is the safe first increment, not a complete shopper-facing PLP.

- [ ] T019 [P] [US1] Write `tests/catalog/homepage-preservation.test.ts` against `tests/catalog/fixtures/homepage-baseline.json` for 16 identities, ten ordered curated references, five promotion records, four stable Trending sorts, regular/deal values, canonical propagation, missing/inactive refs and 16,330 initial countdown seconds; explicitly assert no date-based eligibility and different homepage quota-only versus PLP inventory-plus-quota semantics. **Depends on:** T018.
- [ ] T020 [P] [US1] Extend `tests/e2e/homepage-regression.spec.ts` with controlled-clock checks for 04:32:10 initialization, decrement, zero clamp with five deals still present, remount behavior, Trending arrow/Home/End focus, 8/10 visible cards, unchanged 2/4/5 grids and placeholder cart/wishlist actions. Do not alter countdown source or auto-refresh memberships. **Depends on:** T018.
- [ ] T021 [US1] Refactor only common projection in `src/services/trending.ts` to use `src/services/product-card.ts`, retaining “Ten ordered references; not ten canonical records or a second catalog.” and “Resolve active products and retain current stable order/ties per tab.” with active filtering, existing stable ties, public return signature, stock behavior and original placeholder map; no fixture/content edits. **Depends on:** T019.
- [ ] T022 [US1] Refactor only common projection in `src/services/flash-deals.ts` to use `src/services/product-card.ts`, retaining all five records/order, fixed deal price, canonical comparison price, quota-only homepage stock, sold/quota props and 16,330-second return; do not enforce dates, enable deal-6 or expose sold markup. **Depends on:** T021.
- [ ] T023 [US1] Run preservation/rule tests and homepage browser regressions, `pnpm lint` and `pnpm build`; compare baseline DTOs and visuals and record US1 acceptance in `specs/001-product-catalog-plp/validation.md`. Block further work on unexplained card/layout/countdown/data drift. **Depends on:** T022, T020.

## Phase 4: User Story 3 — Browse, filter and compare the full catalog (P1)

**Goal:** Deliver a usable `/products` with truthful filtering/sorting, both responsive filter modes and accessible states before activating entry links.

**Independent test:** Direct URLs and controls yield exact result IDs/count/order; unfiltered traversal is 12+4 across all 16, Electronics + Tech Haven + Flash Deals yields two products, and deal price 1200–2450 yields Earbuds/Panjabi/Speaker. Empty books category remains selected.

**Ordering rationale:** US3 precedes US2 because discovery links need a functioning destination. Both have P1 priority. US4 later stress-tests and completes restoration/recovery cases; baseline URL correctness is required here.

- [ ] T024 [P] [US3] Write `tests/e2e/product-listing.spec.ts` for server-visible cards/metadata and one inherited main, 16 results/12+4 pages, exact intersections/context prices, all six sorts, counts, empty books state and direct query URLs; assert newest/top-rated start with Kids Building Blocks and best-selling starts with Basmati Rice. Record expected failures before route implementation. **Depends on:** T023.
- [ ] T025 [P] [US3] Write `tests/e2e/listing-filters.spec.ts` for immediate desktop selections, explicit price/search submission, below-1024 modal batch Apply including price, sort/page immediacy, chip/reset semantics, no draft changes to URL/results, 1023/1024/1025 boundaries and unchanged-state no-op. Use exact result/URL assertions rather than sleeps. **Depends on:** T023.
- [ ] T026 [US3] Create solid reserved-space skeleton, zero-match and typed unavailable presentations in `src/components/products/listing-states.tsx`; preserve filters and clear/edit/retry actions, no fake latency or zero totals on failure, no gradients/shimmer, meaningful busy/status semantics and no implementation detail in visible copy. **Depends on:** T024.
- [ ] T027 [US3] Create server `src/components/products/product-grid.tsx` using unchanged shared ProductCard and existing BDT/discount behavior, PLP-only unavailable/no-review explanatory text, min-width-safe items and 2/3/4 columns at base/768/1280; retain all current art and card actions, no hide-last-items rule or new real-image rendering. **Depends on:** T026.
- [ ] T028 [US3] Create `src/app/(storefront)/products/page.tsx`, `loading.tsx` and `src/components/products/product-listing.tsx`: static title/description, server shell passing promised searchParams into an async child under Suspense, typed service call, contextual h1, counts/grid/states and existing storefront layout. Do not nest main, expose full records, add APIs or disable cacheComponents/partialPrefetching; avoid legacy force-dynamic config. **Depends on:** T027.
- [ ] T029 [US3] Run route/service tests, lint/build and visual checks on the listing shell at 360/768/1024/1280 and overflow boundaries; record results and obtain the listing-shell review in `specs/001-product-catalog-plp/validation.md` before building the next UI increment. **Depends on:** T028.
- [ ] T030 [US3] Create `src/components/products/listing-controls.tsx` as a small client wrapper around server-rendered children: applied state from normalized props, local draft fields only, fixed safe URLs via transition helpers, router push for changed commits, guarded replace for normalization, one history entry per action, page resets and pending-commit serialization. Synchronize on accepted URL changes; never import catalog fixtures/services into the client. **Depends on:** T029, T025.
- [ ] T031 [US3] Create labeled reusable `src/components/products/filter-fields.tsx` for one category/vendor, availability, configured Flash Deals, free shipping and paired whole-taka price inputs; values/events supplied by controller, native fieldsets/legends, 44px targets, no unsupported brand/size/subcategory controls, preserve empty categories and independent vendor options. **Depends on:** T030.
- [ ] T032 [US3] Create `src/components/products/listing-toolbar.tsx` and integrate PLP-local explicit search in `src/components/products/listing-controls.tsx`; display true counts and immediate six-sort selector, preserve unrelated applied filters on search, keep all drafts separate, and announce only final applied result changes politely. **Depends on:** T031.
- [ ] T033 [US3] Create `src/components/products/active-filters.tsx` with wrapping applied-state chips, descriptive removal labels and immediate clear preserving sort; wire to `src/components/products/listing-controls.tsx` without committing any unrelated draft. **Depends on:** T032.
- [ ] T034 [US3] Create `src/components/products/pagination.tsx` with generated Link destinations, named nav, current-page semantics, previous/next and numbered pages; preserve valid filters/sort, omit unusable controls for zero results and avoid repeated/skipped IDs; integrate it with the result slot in `src/components/products/product-listing.tsx`. **Depends on:** T033.
- [ ] T035 [US3] Integrate desktop filter sidebar ≥1024px and results composition in `src/components/products/product-listing.tsx` and `listing-controls.tsx`; use 1280px container/16px padding, approximately 224px sidebar, immediate selectors, paired Apply price and explicit search, retained results during pending transitions, visible focus and existing tokens/fonts. **Depends on:** T034.
- [ ] T036 [US3] Run desktop portions of `tests/e2e/listing-filters.spec.ts` and `tests/e2e/product-listing.spec.ts`, Node tests and lint/build; validate 1024/1280 plus 1023/1025 layout boundary, focus and overflow; record and obtain desktop-controls review in `specs/001-product-catalog-plp/validation.md` before mobile UI work. **Depends on:** T035.
- [ ] T037 [US3] Create `src/components/products/mobile-filter-dialog.tsx` using native dialog/showModal, accessible heading, Close/Cancel/Apply filters, focus containment and return, Escape/backdrop cancellation, scroll locking and visible 44px actions; reuse fields and submit selected filters plus price bounds together, with no application on edit or dismissal. **Depends on:** T036.
- [ ] T038 [US3] Integrate below-1024 mobile/tablet trigger and modal drafts in `src/components/products/listing-controls.tsx` and `listing-toolbar.tsx`; Apply pushes one page1 URL, Enter matches Apply, sort/page/search stay immediate or explicitly submitted as specified, and crossing to desktop closes/discards unapplied modal edits without history side effects. Avoid hidden duplicate focusable forms. **Depends on:** T037.
- [ ] T039 [US3] Run full hybrid/PLP suites, Node tests and lint/build; verify keyboard dialog lifecycle, 360/768/1024/1280, 1023/1024/1025, no page overflow and unchanged homepage; record US3 evidence and obtain mobile-filter review in `specs/001-product-catalog-plp/validation.md` before navigation work. **Depends on:** T038.

## Phase 5: User Story 2 — Existing discovery links reach the correct listing (P1)

**Goal:** Activate only mapped product discovery links and search while preserving every existing homepage section and unrelated destination.

**Independent test:** Follow every contract destination from desktop/mobile/header/footer/homepage and compare URL, heading and actual result set. Both Trending View All links follow the local tab and expand to the full catalog; tabs themselves never navigate.

**Review rule:** Complete and review each named section before beginning another. Multiple files within one section form a single reviewable increment.

- [ ] T040 [P] [US2] Write `tests/catalog/navigation-contract.test.ts` for exact canonical root mappings, hero/promo/footer destinations, search category values, tab→sort mappings and safe encoding; assert All categories remains a trigger and non-product placeholders remain outside listing filters. **Depends on:** T039.
- [ ] T041 [P] [US2] Write `tests/e2e/listing-navigation.spec.ts` exercising every row of `contracts/services-and-navigation.md` including both View All controls for each Trending tab, desktop/mobile search scope, drawer dismissal, independent vendor/voucher/gift-card placeholders and existing keyboard menu/tab behavior. **Depends on:** T039.
- [ ] T042 [US2] Extend `src/types/navigation.ts` and `src/services/navbar.ts` with service-resolved public root-category destinations and typed search options, validating exact name→slug mappings from the contract; preserve desktop All + five search-category labels/order, mobile no-selector behavior and presentation-only subcategory strings. **Depends on:** T040.
- [ ] T043 [US2] Wire Flash Deals/New Arrivals/Best Sellers and root category links in `src/components/layout/navbar/category-nav.tsx`, `mega-menu.tsx` and `mobile-drawer.tsx`; activate explicit accessible search in `search-form.tsx` and pass typed props through `navbar.tsx` and `main-header.tsx`. Header search starts a fresh context; mobile searches all categories. Keep All categories trigger, unsupported child links, existing logo and unrelated destinations unchanged; add no All Products/Top Rated navbar items. **Depends on:** T042.
- [ ] T044 [US2] Run navbar/navigation assertions and lint/build, compare desktop/mobile header/menu/search visuals and focus to baseline, and record/obtain navbar-section review in `specs/001-product-catalog-plp/validation.md` before changing another homepage section. **Depends on:** T043, T041.
- [ ] T045 [US2] Wire root destinations and All Products View All in `src/components/home/categories/category-tile.tsx` and `categories-section.tsx`; run relevant navigation tests and lint/build, compare tile visuals, and record/obtain category-section review in `specs/001-product-catalog-plp/validation.md`. **Depends on:** T044.
- [ ] T046 [US2] Wire only View All to `/products?promotion=flash-deals` in `src/components/home/flash-deals/flash-deals-section.tsx`; run relevant navigation/countdown tests and lint/build, preserve layout/five cards/sold markup/timer, and record/obtain Flash Deals-section review in `specs/001-product-catalog-plp/validation.md`. **Depends on:** T045.
- [ ] T047 [US2] Move existing header markup/link ownership into the client tab owner across `src/components/home/trending/trending-section.tsx` and `trending-tabs.tsx` while retaining server data loading; bind both View All hrefs to active tab with all→catalog, new→newest, best-sellers→best-selling and top-rated→top-rated; preserve DOM/classes/subtitle/local roving focus, 8/10 visibility and all ten curated records. **Depends on:** T046.
- [ ] T048 [US2] Run all tab/link assertions in `tests/e2e/listing-navigation.spec.ts` and `tests/e2e/homepage-regression.spec.ts`, lint/build, compare Trending visuals and record/obtain Trending-section review in `specs/001-product-catalog-plp/validation.md` before hero changes. **Depends on:** T047.
- [ ] T049 [US2] Add typed CTA hrefs in `src/types/banner.ts` and `src/data/banner.ts` and consume them in `src/components/home/banner/hero-slider.tsx`: electronics+Flash Deals, fashion, general shopping; leave seller onboarding placeholder and countdown/carousel behavior unchanged. Run relevant tests and lint/build and record/obtain hero-section review in `specs/001-product-catalog-plp/validation.md`. **Depends on:** T048.
- [ ] T050 [US2] Update only home/groceries/beauty category CTA hrefs in `src/data/promo-banners.ts`; reuse existing service/component, infer no campaign/discount predicates, run navigation assertions and lint/build, and record/obtain promo-section review in `specs/001-product-catalog-plp/validation.md`. **Depends on:** T049.
- [ ] T051 [US2] Update only Flash Deals/New Arrivals/Best Sellers hrefs in `src/data/footer.ts`, preserving Top Vendors/Gift Cards and all unrelated footer behavior; run navigation assertions and lint/build and record/obtain footer-section review in `specs/001-product-catalog-plp/validation.md`. **Depends on:** T050.
- [ ] T052 [US2] Execute complete navigation suite and homepage regressions, compare each mapped destination to `specs/001-product-catalog-plp/contracts/services-and-navigation.md`, and record US2 acceptance in `specs/001-product-catalog-plp/validation.md`; no broken future routes or unsupported subcategory classifications may be activated. **Depends on:** T051.

## Phase 6: User Story 4 — Restore state and recover accessibly across devices (P2)

**Goal:** Complete robust URL restoration, error recovery and accessible browser navigation over the already working listing.

**Independent test:** Copy/reload filtered URLs, move between pages/sorts, Back/Forward, interrupt transitions, resize with drafts, and retry expected/unexpected failures; controls, result IDs/order/count/page remain consistent. Keyboard users can complete every action on desktop/mobile.

**Dependencies:** Existing US3 interaction behavior is not postponed to this phase; this phase adds adversarial regression coverage and the complete failure-recovery boundaries.

- [ ] T053 [P] [US4] Write `tests/e2e/listing-history.spec.ts` for direct URL/new context/reload/Back/Forward, first repeated values, malformed enums/slugs/prices/encodings, Unicode truncation notice persistence, excessive-page clamping, no replace loops, unchanged-state submit, one entry per commit, draft discard on restored state, rapid commits and Back during pending normalization. **Depends on:** T052.
- [ ] T054 [P] [US4] Write `tests/e2e/listing-recovery.spec.ts` and test-only `tests/e2e/support/catalog-failure-fixture.ts` for empty versus invalid-catalog versus result-render/route failures and retry; use an isolated temporary test workspace with injected fixture/render faults, never production debug query parameters or edits to shipped fixtures. Assert applied controls/URL retained, safe errors, selected-only options when necessary and restoration on recovery. **Depends on:** T052.
- [ ] T055 [P] [US4] Write `tests/e2e/listing-accessibility.spec.ts` with Playwright role/name/keyboard assertions for fieldsets/labels, single main/h1, pagination current page, 44px hit areas, visible unobscured focus, reduced motion, dialog containment/Escape/return, non-focus-stealing updates and polite committed count announcements. No extra accessibility dependency is implicitly approved. **Depends on:** T052.
- [ ] T056 [US4] Complete and harden restoration in `src/components/products/listing-controls.tsx`: Activity-preserved drafts resync on accepted applied URL changes; notices survive only their guarded normalization replacement until dismissal/next action; ignore stale effects, serialize commits without losing browser Back state, retain search/filter/page correctly and prevent unrelated draft submission. Satisfy history suite without native history-only result updates or new global stores. **Depends on:** T053.
- [ ] T057 [US4] Implement `src/components/products/listing-results-boundary.tsx`, `src/app/(storefront)/products/error.tsx` and required `listing-states.tsx`/`product-listing.tsx` integration: keep applied controls outside result failure boundary, refresh expected/result errors, use installed route `error: unknown` and `retry: () => void`, reconstruct fallback controls from URL under Suspense, retain selected category/vendor plus All when options unavailable, and never normalize away selections because catalog failed. **Depends on:** T056, T054.
- [ ] T058 [US4] Complete accessibility/focus lifecycle in `src/components/products/listing-controls.tsx`, `filter-fields.tsx`, `mobile-filter-dialog.tsx`, `listing-toolbar.tsx`, `active-filters.tsx` and `pagination.tsx` based on `tests/e2e/listing-accessibility.spec.ts`; fix only reproducible scoped issues and preserve tokens, reduced-motion rules, homepage behavior and nonvisual status semantics. **Depends on:** T057, T055.
- [ ] T059 [US4] Execute history/recovery/accessibility suites, Node tests and lint/build; manually verify screen-reader result announcements and focus at approved widths, record US4 results and obtain recovery/accessibility-increment review in `specs/001-product-catalog-plp/validation.md` before final acceptance. **Depends on:** T058.

## Phase 7: Final validation and cross-cutting acceptance

**Purpose:** Prove the integrated feature meets every observable requirement and preserve honest evidence. All story checkpoints must pass; approval of tooling does not count as test execution.

- [ ] T060 Create/run `tests/e2e/listing-responsive.spec.ts` for 320,360,390,414,480,560,640,768,820,900,1024,1100,1280,1440,1920 widths and 667×375 landscape; include 1023/1024/1025 and 1279/1280 boundaries, no document overflow, correct 2/3/4 PLP grids and sidebar/modal switching; capture 360/768/1024/1280 screenshots and failures, compare homepage baseline, and record evidence in `specs/001-product-catalog-plp/validation.md`. **Depends on:** T059.
- [ ] T061 Add/run `tests/e2e/listing-performance.spec.ts` against production build with documented desktop/mobile device/browser/CPU/network profiles: measure five commits per profile from action to final cards/count, require each ≤1 second after readiness, inspect server-rendered listing/title/description, and record real samples and any failures in `specs/001-product-catalog-plp/validation.md`. **Depends on:** T060.
- [ ] T062 Audit `src/app/(storefront)/products/page.tsx`, `src/components/products/`, `src/services/catalog.ts`, `src/types/catalog.ts`, `package.json` and `pnpm-lock.yaml` for minimal client props, no raw fixture/component imports, no full product/vendor data serialization, safe encoded URLs, no new APIs/fetch/auth/payment/framework or unapproved runtime dependency; confirm canonical fixture/countdown/ProductCard diffs remain unchanged and record results in `specs/001-product-catalog-plp/validation.md`. **Depends on:** T061.
- [ ] T063 Run `node scripts/test-catalog.mjs`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` and the complete approved Playwright suite in `tests/e2e/`; run browser scenarios from `specs/001-product-catalog-plp/quickstart.md`, resolve scoped failures, and record exact commands/exits, automated versus manual evidence and unexecuted checks in `specs/001-product-catalog-plp/validation.md`. **Depends on:** T062.
- [ ] T064 Reconcile FR-001–FR-018 and SC-001–SC-007 with passing tests/review evidence in `specs/001-product-catalog-plp/validation.md`, update `quickstart.md` only for actual implemented command/setup details, preserve the 14/16 checklist with two accepted exceptions, and present final scoped diff and remaining limitations for review. Mark `specs/001-product-catalog-plp/tasks.md` entries complete only when their own acceptance conditions are met; do not deploy or implement deferred features. **Depends on:** T063.

## Dependencies and execution order

```text
Setup → Foundation → US1 (P1 preservation)
                         ↓
                 US3 (P1 working listing)
                         ↓
                 US2 (P1 discovery links)
                         ↓
                 US4 (P2 restoration/recovery)
                         ↓
                    Final validation
```

The P1 order US1 → US3 → US2 is intentional: preserve shared data first, provide usable listing destinations next, and activate navigation last. US4 completes adversarial recovery/history/accessibility coverage after the ordinary URL behaviors delivered by US3. No story depends on a later-numbered task. All phases require the previous phase's final gate, even where individual tasks list only their immediate prerequisites.

### Independent acceptance by story

| Story | Independent acceptance |
| --- | --- |
| US1 | Unchanged homepage service/card output and membership, correct canonical field propagation and promotion override, countdown/tab regression tests. |
| US3 | Direct listing URL and both filter modes yield exact IDs/count/order, deterministic sorts, all 16 across 12+4 pages, correct empty state and displayed pricing. |
| US2 | Every mapped discovery entry reaches the specified URL/results; both Trending links follow tab state without tab navigation; unrelated destinations unchanged. |
| US4 | URL sharing/reload/Back/Forward and failure retry preserve applied state/controls, no stale drafts/normalization loops, keyboard completion across devices. |

### Parallel opportunities

Parallelism is scoped to independent test files after the common prerequisites finish; application/UI work remains sequential to respect review and shared-file ownership.

- **Foundation example:** author T006, T007, T008, T009 concurrently, then integrate and run their suites at the applicable gate.
- **US1 example:** author T019, T020 concurrently, then integrate and run their suites at the applicable gate.
- **US3 example:** author T024, T025 concurrently, then integrate and run their suites at the applicable gate.
- **US2 example:** author T040, T041 concurrently, then integrate and run their suites at the applicable gate.
- **US4 example:** author T053, T054, T055 concurrently, then integrate and run their suites at the applicable gate.

Do not run fault-injection suites against the same server/worktree as ordinary browser tests; recovery fixtures use a separate temporary workspace/port. Do not run performance measurements concurrently with other suites. Do not update screenshot baselines just to hide a regression. Keep runner configuration, shared application modules and validation evidence updates serialized.

## Requirement coverage

| Requirement group | Primary tasks |
| --- | --- |
| FR-001–005: identity, no-op migration, promotions, homepage, complete catalog | T011, T016, T017, T019, T021, T022, T027 |
| FR-006–011: search, real categories, filters, availability, price, sorts | T006, T008, T009, T010, T014, T031, T032 |
| FR-012: scoped navigation | T040, T041, T043, T045, T046, T047, T049, T050, T051 |
| FR-013–014: URL/history/pagination | T010, T030, T034, T038, T053, T056 |
| FR-015: pending/empty/errors | T026, T030, T054, T057 |
| FR-016: accessibility/responsiveness | T035, T037, T038, T055, T058, T060 |
| FR-017–018: boundaries/testing/metadata | T001, T002, T003, T028, T062, T063 |
| SC-001–003, SC-007: exact data/results/URLs and propagation | T018, T023, T039, T052, T059 |
| SC-004–005: visuals/keyboard/overflow | T004, T020, T058, T060 |
| SC-006: measured production performance | T061 |

## Implementation strategy

1. **Safe MVP increment:** Setup + foundation + US1. Demonstrate consistent shared catalog/promotion projections and zero homepage regression. This is independently reviewable but does not claim delivery of the PLP.
2. **First usable listing:** US3 shell → desktop controls → mobile controls, with explicit section reviews between increments. Do not enable discovery links before the destination works.
3. **Discovery integration:** US2 navbar → categories → Flash Deals → Trending → hero → promo → footer, validating/reviewing each section in order.
4. **Resilience and acceptance:** US4 then final automated/manual matrix, production performance and requirement reconciliation. Fix only scoped failures; explain environmental blockers honestly.

No unresolved owner decision blocks starting implementation once the user requests it. Package/network/browser access may require environment permission when executing approved setup. Tests, builds, runtime checks and section reviews remain future completion gates; none is reported as passed by generating this file. No tasks-generation extension hooks were configured at generation time.

## Task counts

| Phase | Tasks |
| --- | --- |
| Phase 1: Setup | 4 |
| Phase 2: Foundational | 14 |
| Phase 3: User Story 1 | 5 |
| Phase 4: User Story 3 | 16 |
| Phase 5: User Story 2 | 13 |
| Phase 6: User Story 4 | 7 |
| Phase 7: Final validation and cross-cutting acceptance | 5 |
| **Total** | **64** |

All 64 tasks begin unchecked. 13 tasks are marked `[P]`; their independent execution groups are listed above.
