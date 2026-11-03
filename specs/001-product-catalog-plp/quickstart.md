# Validation Guide: Product Listing Page

This is a future implementation validation guide. The PLP and test harness do not yet exist. Commands below are not claims of executed application tests.

## Prerequisites and approval

Use pnpm. The owner approved the dependency-free Node/TypeScript harness and development-only Playwright tooling on 2026-11-03 for implementation. Add only necessary dependencies in that phase; do not install anything during approval recording. Follow environment permission requirements for any installation/network access; existing owner approval need not be requested again. Record Node/pnpm versions; planning observed Node v24.19.0 and TypeScript 5.9.3.

Capture homepage baseline before changing services or links: all four Trending tab arrays and markup, five Flash Deal projections/countdown, visible counts, section order, menus, search and placeholder actions. Keep test fixture changes isolated from shipped data. Record current lint/build failures separately from regressions.

## Commands after implementation

From repository root:

```sh
pnpm lint
pnpm exec tsc --noEmit
node scripts/test-catalog.mjs
pnpm build
pnpm start
```

The Node harness strategy is approved; the command becomes available after its implementation. The script compiles only its test dependency graph with the installed compiler, resolves aliases in temporary emitted artifacts, runs Node's test runner, and exits nonzero on compile/test failure. It must not modify source imports or persist generated JS in `src`. Typecheck tests independently because production Next build is not a substitute for meaningful business-rule checks. Use `pnpm dev` for development inspection; measure performance with the production build.

No browser automation runner is currently installed. Run the browser scenarios manually and record results; the owner approved `@playwright/test` (development dependency and necessary browser tooling) for the required automated critical journeys during implementation. Do not install it in this documentation phase. Do not describe manual checks as automated coverage. Keep missing automated coverage explicit against Constitution VIII.

After authorized implementation and tooling setup, run `pnpm exec playwright test tests/e2e/product-listing.spec.ts`. Configure a production server or use the running production build; cover desktop and mobile hybrid controls, direct URL/reload/Back/Forward, pagination, recovery, and mapped navigation. Pin the approved compatible package version at installation, record browser versions, and do not install tools during planning. Without this tooling or an equivalent approved runner, automated critical-journey validation remains blocked; manual review is supplemental.

## Automated rule/service scenarios

| Area | Required assertions |
| --- | --- |
| Integrity/preservation | 16 unique product IDs/slugs/SKUs; 10 exact Trending IDs; 5 exact deal records; all references valid; all 16 have existing placeholder projections; no fixture mutation. Compare homepage DTOs before/after helper extraction. |
| Canonical propagation | In isolated injected copies, change an existing shared name/regular price and verify ordinary/deal projections update correctly; explicit deal price stays fixed and compare price follows canonical price. Test a curated product in both Trending and PLP. |
| Visibility | Each non-active status excluded from lists, counts, derived vendor options and promotion results; empty canonical categories remain options. No added vendor-status exclusion. |
| Query parsing | Defaults, unknown keys, first repeated value, whitespace/case, truncation, Unicode, malformed encodings, valid/invalid slugs, invalid enums, negative/fractional/unsafe prices, reversed bounds, page zero/unsafe/huge; encode safely; normalized round-trip is idempotent. |
| Search | Every token required across supported fields; populated test brands/tags work; empty fields add no matches; SKU/description/vendor metrics do not match. |
| Categories | Current eight roots and empty books category; temporary true descendants match parent; sibling excluded; cycles/dangling references fail safely. No inferred navbar children. |
| Intersections | Electronics + tech-haven + flash-deals → Earbuds and Smart Watch; deal range 1200–2450 → Earbuds, Panjabi, Speaker. All filter dimensions combine with AND. |
| Prices | Same product has ordinary and promotion contextual prices; price filter/sort uses displayed values; discount helper rounding unchanged. |
| Availability | Tracked zero, untracked zero and exhausted quota; ordinary vs promotion behavior differs as specified; exhausted deals remain listed unless availability filter excludes them. |
| Time | Deal membership identical before/inside/after stored windows; homepage returns 16,330 seconds; countdown reaches zero without membership refresh. Test timer behavior in browser without adding a live eligibility rule. |
| Sorting | Exact complete order for six sorts; newest/top-rated first blocks, sales first rice; default zero sales and date values unchanged; null dates last; unrated last; deterministic ID ties; unchanged curated homepage tie order. |
| Pagination | Unfiltered 12+4, unique union of 16; no skips; out-of-range clamp; zero total page1/no controls; reset page on commits and retain filters on page changes. |
| State transitions | Hybrid action model, no history-worthy action for unchanged drafts, clear retains sort, page reset rules, no unrelated draft submissions. |
| Failures | Duplicate IDs, invalid relations, malformed prices/quotas return unavailable; missing selection refs omitted but integrity suite fails; no substitution or fake zero count. |
| Navigation contract | Every typed destination matches contract, top-level category targets resolve, both Trending links follow each tab, unrelated destinations remain placeholders. |

## Browser journeys

1. Open `/products`: verify 16 total, 12 cards then 4 on page 2, correct placeholder artwork and ordinary pricing. Follow direct page links, reload, and open a copied URL in another context.
2. On desktop (1280px), change category/vendor immediately; submit price bounds together; submit search; change sort; inspect one history entry per changed action and page reset. Back/Forward must restore controls, result IDs/order/count/page.
3. At 390px and 820px, open filters, edit several values and confirm URL/results do not change. Cancel/Escape must discard edits. Reopen and Apply: one URL transition, dialog closes, focus returns to trigger, page resets. Include price bounds in the same submission.
4. With unsubmitted desktop price/search drafts, change sort or use pagination: drafts must not accidentally apply. Resize with an open mobile dialog, then use Back. Confirm no invisible commit or stale draft restoration.
5. Open malformed/repeated/out-of-range query examples from the URL contract. Confirm safe normalization, retained valid selections, visible correction notice after replacement and no Back loop. Interrupt a transition with Back and repeat quickly to check stale replacements cannot win.
6. Verify zero results versus catalog unavailable in temporary test-only fixtures; clear/edit vs retry actions; recover without losing the URL. Verify unexpected result errors leave the applied controls mounted; last-resort route errors reconstruct usable applied controls from the URL without clearing selected slugs when facet options are unavailable. Verify installed retry behavior. Do not add a production debug/error URL.
7. Follow all mapped navbar, drawer, category, footer, hero, promo and homepage View All links. For each Trending tab, verify both links and full-catalog listing context; tab changes remain local. Test header mobile search across all categories, desktop search category selection, and PLP search retaining other applied filters.
8. Keyboard through fields, chips, sort, page controls and dialog. Check semantic labels/landmarks, visible focus, 44px targets, dialog containment/Escape/return focus, polite result announcements and reduced motion. Existing homepage tabs retain arrow/Home/End behavior.
9. Compare homepage screenshots and interactions against baseline: same five deals, ten curated items with eight visible below 1280px, 2/4/5 grids, hidden sold markup, card actions still placeholders, section order/styles unchanged. Countdown starts at 04:32:10 and has no membership effect at zero.
10. Inspect server response/rendered document for actual listing content and metadata; inspect client payload/import graph for accidental full Product/vendor records or raw fixture imports. No new API routes, fetch calls or unrelated dependencies.

## Responsive matrix and performance

Validate widths **320, 360, 390, 414, 480, 560, 640, 768, 820, 900, 1024, 1100, 1280, 1440, 1920**, plus **667×375 landscape**. Include exactly-below/at desktop breakpoint (1023/1024) and 1279/1280 for card layout. Confirm no page horizontal overflow; labels/chips wrap, controls fit, cards align, focus is not covered by sticky header or modal footer. Explicitly validate and capture screenshots at 360/768/1024/1280 as approved by the owner, plus every discovered failure width. Test 1023/1024/1025 for filter-mode boundary behavior and overflow.

In a production build, record device/browser versions, viewport, CPU/network profile and readiness condition. Measure five committed changes each on desktop/mobile; capture time from commit to final cards/count. Every measured change must meet SC-006's one-second target; report actual samples, failures and reproducible conditions. Do not claim a source inspection establishes performance.

## Review evidence and completion gate

Record commands and exit codes, exact test cases, screenshots, browser/device profiles, manual versus automated journeys, accessibility findings and unexecuted checks. Stop for review after each planned UI increment. Lint/build, meaningful business-rule tests and visual/interaction evidence are mandatory for application changes. Unavailable or unexecuted browser automation remains a disclosed validation gap until the approved tooling is implemented and its checks pass; do not silently waive constitution requirements.
