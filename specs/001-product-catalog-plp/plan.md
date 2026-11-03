# Implementation Plan: Shared Product Catalog and Product Listing

**Branch**: `001-product-catalog-plp` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

**Status**: Technical design complete; owner decisions recorded below; ready for `$speckit-tasks`. This approval-recording invocation does not authorize starting implementation or installing dependencies.

## Summary

Add `/products` to the existing storefront, reading the existing canonical 16-product catalog through typed services. Keep all ten curated Trending IDs, five enabled Flash Deal records, placeholders, prices, homepage ordering, and simulated countdown intact. There is no dataset migration. URL-driven server results provide deterministic discovery while small client controls implement immediate desktop selections, explicitly submitted price/search inputs, and mobile Apply filters.

The current branch is confirmed by setup-plan. The spec and audit's `setup/spec-kit` branch references describe their earlier creation context; they are not instructions to switch branches. This plan does not rewrite those historical artifacts.

## Technical Context

**Language/Version**: strict TypeScript 5.9.3 installed; React 19.3.0; Next.js 16.4.3.

**Primary Dependencies**: existing Next.js App Router, Tailwind CSS v4 CSS-first tokens, Lucide React, React Icons, clsx and tailwind-merge; pnpm 10.30.3 convention. No new dependency proposed for application code.

**Storage**: existing typed local fixtures only; no persistence, database, API handlers, Server Actions, authentication, or external data calls. Framework page navigation is normal Next.js rendering, not a new backend integration.

**Testing**: existing lint/build; approved Node built-in test/assert harness for pure rules and services, using installed TypeScript to compile a temporary test target. Development-only `@playwright/test` and necessary browser tooling are approved for automated critical journeys during implementation. Browser journeys and screenshots remain required. Add only necessary dependencies with pnpm once implementation is authorized; nothing is installed now.

**Target Platform**: storefront web, keyboard/touch, 320–1920px including landscape; current modern browser targets inherited from Next.js. Validate a documented desktop Chromium and mobile browser/device profile; cross-browser checks include Safari where available.

**Project Type**: single frontend Next.js application, new public listing route.

**Performance Goals**: initial 16-product fixture, applied change to final cards/count within one second after readiness on each recorded production desktop/mobile profile, five interactions per profile (SC-006). Avoid shipping canonical products or a client-side catalog engine; no new media, animation, or data dependency.

**Constraints**: `cacheComponents: true` and `partialPrefetching: true` remain enabled; await query data under Suspense. Use aliases in application imports, typed services, current ProductCard and price helpers. No gradients, new fonts, component library, or homepage redesign.

**Scale/Scope**: 16 canonical products, 10 curated Trending items, 5 deals, 8 root categories, 8 vendors, 12 results/page. One PLP plus explicitly mapped discovery links. No search suggestions, invented taxonomy, transactional actions, or production SEO infrastructure.

## Constitution Check

Pre-research and post-design checks both pass for the proposed scope. These are design checks, not claims that implementation or runtime validation has passed.

| Principle | Design evidence / implementation gate |
| --- | --- |
| I Preserve experience | No fixture replacement; homepage baseline snapshots and interactions; keep five deals and hidden sold markup. Changes to homepage limited to mapped links/search and state ownership needed for both Trending links. |
| II Established stack | Installed Next.js guidance reviewed; preserve config, tokens and package manager. No dependency installations. |
| III Typed boundaries | Fixtures consumed by services; public DTOs only cross client boundaries; shared card remains baseline. |
| IV Authorization | No private data or privileged operations; no claim of real security in mocks. |
| V Vendor isolation | Public vendor name/slug only; private vendor records not serialized. Vendor filters use product associations, not marketing counts. |
| VI Commerce integrity | Separate promotions, stable identities, whole-taka prices, existing discount helper, active visibility, no live timing rules. |
| VII Quality/discovery | Accessible controls/drawer, URL validation, server results, static metadata, reduced motion, documented performance checks. |
| VIII Validation | Business-rule automation proposed; lint/build and visual/journey gates required during implementation. No tooling added without approval. |
| IX Secrets/privacy | Synthetic fixtures only; no credentials, logging service, raw errors, or full-record client payloads. |
| X Incremental delivery | Review checkpoints below; one UI increment at a time, no tasks or implementation invoked. |

Requirements checklist remains **14/16**. The two unchecked implementation-detail exclusions are documented template exceptions in the existing checklist; the user expressly requests technical source/interface detail. The owner accepted these two feature-scoped exceptions on 2026-11-03, conditional on retaining their rationale and keeping the specification focused on observable requirements. Keep the markers unchecked because the exclusions are exceptions, not satisfied criteria. Carry this recorded acceptance into the implementation checklist gate; do not request the same approval again.

## Project Structure

### Documentation (this feature)

```text
specs/001-product-catalog-plp/
├── spec.md                         # existing, unchanged by planning
├── repository-audit.md             # existing evidence
├── checklists/requirements.md      # existing markers unchanged
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── listing-state.md
│   └── services-and-navigation.md
└── quickstart.md
```

`tasks.md` is intentionally not generated.

### Proposed source files

| Path | Planned responsibility |
| --- | --- |
| `src/app/(storefront)/products/page.tsx` | Static metadata, synchronous server shell, Suspense boundary passing promised searchParams. |
| `src/app/(storefront)/products/loading.tsx` | Route loading fallback reusing reserved-space listing skeleton. |
| `src/app/(storefront)/products/error.tsx` | Unexpected error fallback using installed `retry()` API and URL-preserving retry. |
| `src/types/catalog.ts` | Sort/filter/state/result/options/notice contracts; no duplicate Product entity. |
| `src/lib/catalog-query.ts` | Pure query parsing, first-value handling, safe serializer, state transitions and navigation URL helpers; no fixture imports. |
| `src/services/catalog.ts` | Fixture composition, validation, public options, listing query, expected unavailable result. |
| `src/services/catalog-rules.ts` | Pure dataset-injected filtering, sorting, availability and pagination functions; no UI imports. |
| `src/services/product-card.ts` | Shared pure canonical-to-public projection with explicit price/stock/placeholder overrides. |
| `src/services/catalog-integrity.ts` | Fixture validation with fatal issues vs unresolved selection-reference omissions. |
| `src/components/products/product-listing.tsx` | Async server child: await query, call service, render contextual heading and server result slot. |
| `src/components/products/listing-controls.tsx` | Client coordinator for applied state, draft search/price/mobile filters, pending navigation, normalization notice retention. |
| `src/components/products/filter-fields.tsx` | Labeled reusable fields; values/events supplied by desktop or mobile controller. |
| `src/components/products/mobile-filter-dialog.tsx` | Native modal dialog wrapper, apply/cancel, focus and scroll lifecycle. |
| `src/components/products/listing-toolbar.tsx` | Sort, result count, mobile trigger; small client interaction surface. |
| `src/components/products/active-filters.tsx` | Applied chips and clear action; never show unapplied drafts as active. |
| `src/components/products/product-grid.tsx` | Server list of ProductCard instances with PLP-only unavailable/not-yet-rated status where needed. |
| `src/components/products/pagination.tsx` | Semantic numbered Link navigation, previous/next and current page. |
| `src/components/products/listing-states.tsx` | Skeleton, empty, expected unavailable and retry presentation. |
| `src/components/products/listing-results-boundary.tsx` | Client error boundary around the results slot only; outer applied controls survive result-rendering failures. |
| `src/services/trending.ts`, `src/services/flash-deals.ts` | Replace only duplicated common projection with helper; retain existing membership, ordering, stock semantics and countdown return. |
| `src/services/categories.ts` | Expose typed canonical category lookup/options from current roots without inventing children. |
| Navigation files listed in contract | Destination integration only, retaining DOM/layout whenever possible. |
| `tests/catalog/*.test.ts`, `tsconfig.catalog-tests.json`, `scripts/test-catalog.mjs` | Proposed approved-only Node/TypeScript test harness and meaningful rule/service tests. |

During authorized implementation, add `playwright.config.ts` and `tests/e2e/product-listing.spec.ts` for the critical journeys in quickstart. Necessary development dependency/lockfile changes and browser tooling are covered by the recorded testing approval. Installation is deferred until implementation; automated E2E must still execute and pass under Constitution VIII.

**Structure Decision**: extend existing `src/types`, `src/services`, `src/lib`, and `src/components` boundaries; no second app or repository abstraction. Keep `src/data/products.ts`, `src/data/flash-deals.ts`, `src/data/categories.ts`, `src/data/vendors.ts`, countdown hooks, global CSS and framework config unchanged. Only navigation presentation fixtures/types may gain destination fields.

## Rendering and state architecture

1. The existing storefront layout supplies Navbar, `<main>`, and Footer; the PLP does not create another main landmark.
2. Page exports static title `Products | Kenakata` and an accurate description. Pass `searchParams: Promise<Record<string, string | string[] | undefined>>` directly to `ProductListing` inside Suspense; await only inside that child. This follows installed Cache Components guidance. No legacy `dynamic = force-dynamic`, query caching, or configuration workaround.
3. Service validates fixture relationships, parses the URL, selects active products, applies contextual price/availability, filters, sorts, counts, clamps page and projects only the visible cards. Public facet options are independent of current result filters.
4. Render results on the server. A client control wrapper receives normalized applied state, safe options, count/page metadata, notice codes, and server-rendered children. It does not import the catalog service or full fixtures. Do not turn ProductCard or the entire storefront into a client component.
5. Applied actions navigate with a generated `/products` URL via `router.push` inside a transition. Pagination/discovery use Link. A guarded normalizer replaces the current URL only if its raw query differs from the normalized query; it retains correction notices across the replacement. Never use native pushState alone to change server-driven results.
6. Keep applied controls and old results visible while navigating, mark results busy, and show restrained pending feedback. Serialize commits while pending to prevent rapid actions from composing against stale props; retain edits as drafts and expose completion feedback. Test consecutive actions and Back during transitions. No artificial delay.
7. React Activity may preserve component state. Resynchronize drafts on accepted applied URL changes, including Back/Forward, not just initial mount. Cancelled mobile dialog edits are discarded. Breakpoint change closes the dialog and discards unapplied mobile drafts without committing anything. Search/sort/page commits do not implicitly submit another control's drafts.
8. Known catalog invalidity returns a typed unavailable outcome with controls and URL retained; retry refreshes the route. Place a small client error boundary around the server-rendered result slot, inside the control shell, so result-rendering failures retain applied controls and allow retry via refresh. A last-resort route `error.tsx` handles failures outside that slot using `error: unknown` and `retry: () => void` in this installed Next.js version. It reuses the control shell seeded from the current URL under Suspense, retaining all selected values; when facet data is unavailable, offer the selected category/vendor values and All, with an explicit options-unavailable message rather than inventing alternatives. Search, price, sort, selected-value removal and reset remain operable. Do not normalize away unknown selections until catalog validation succeeds. The successful response restores complete options. No stack traces or internal records in UI.

## Catalog and promotion design

Preserve canonical data exactly. Extract common card projection only after baseline outputs are captured. The helper accepts a Product and resolved public vendor plus explicit presentation overrides; it must not decide whether a product belongs to Trending or a promotion. Homepage Trending retains its curated stable ties; Flash Deals retains quota-only homepage stock semantics. PLP deal availability combines canonical inventory and remaining quota as specified.

PLP regular views show regular/compare-at price even for deal products. Promotion view shows deal/regular price and a clear configured mock promotion context, without adding a second countdown or enforcing stored date windows. Retain the home countdown starting at 16,330 seconds, locally clamping at zero and resetting only under its existing mount behavior. Never uncomment deal-6 or sold-progress markup.

Use existing placeholder maps via the service: Trending map then Flash Deal map for the current disjoint catalog; in promotion context use Flash Deal presentation. Smartphone artwork exists in the Flash Deal placeholder map despite its disabled promotion. Test all 16 projections. Keep ProductCard unchanged for this phase; render PLP-only availability and unrated explanatory text adjacent to it. A future redesign of its rating/media behavior is not authorized here; current numeric zero for unrated fixtures must be identified as no reviews, not fabricated ratings.

## UI layout and interaction design

Use existing white/canvas, ink, mute, line, brand/brand-strong tokens, Plus Jakarta Sans headings and DM Sans labels. Reuse button/input styles, rounded controls and compact card proportions. No new visual system, fonts, gradients, hero, or banner.

Approved PLP breakpoint: desktop sidebar from **1024px** (`lg`); below it use the modal filter interface, including tablets. This is independent of the navbar's existing search breakpoint. Keep a 1280px container with 16px padding. Sidebar approximately 224px at desktop with 16px gap; results column uses `min-w-0`. Grid: two columns below 768px, three from 768px through 1279px, four from 1280px. This adapts the build-ui product grid to the sidebar while preserving the homepage's unchanged 2/4/5 grids.

```text
Desktop: heading/context
         sidebar | search + count + sort
                 | applied filter chips
                 | product grid
                 | pagination
Mobile:  heading/context
         search
         filter button + sort + count
         applied chips (wrap)
         two-column grid
         pagination
         filter dialog only when opened
```

Desktop selectors apply immediately; price inputs share an explicit Apply price action. Mobile dialog commits selection filters and price bounds in one Apply filters action. Search has its own submit control in the PLP; navbar search starts a fresh discovery context as defined in the navigation contract. Sorting and pagination are immediate on both layouts. Drafts never alter counts or URLs. Remove-chip and Clear filters actions apply immediately; clear retains sort. Mobile Cancel/Escape/backdrop dismissal retains the applied URL and restores trigger focus.

Use native `<dialog>` with `showModal()`, visible heading/close button, focus containment, Escape cancellation, focus restoration and scroll locking while open. Verify browser behavior rather than assuming native semantics solve every focus case. Fieldsets/legends group filters, explicit labels identify inputs, active chips have descriptive removal labels, sort has an accessible name, pagination has a named nav and `aria-current=page`. Maintain 44px targets, visible focus not hidden under header/dialog footer, polite final result announcements, and no focus stealing on normal updates. Dialog applies close and restore focus before result announcement. Skeletons use solid fills and reserved card dimensions, no shimmer.

Empty state retains active controls and offers clear filters/edit search; Books & stationery stays selected. Expected unavailable state differs from zero matches. Add no fake network errors, delay, random data, or spinner minimum duration.

## Delivery sequence and review checkpoints

1. Capture source outputs, membership assertions, homepage screenshots and keyboard behavior; use the approved test harness strategy when implementation begins. Validate no canonical migration is necessary.
2. Implement pure query/rule/projection/service boundaries with meaningful tests; verify homepage service outputs unchanged after extraction. This is a nonvisual increment.
3. Build PLP results shell, existing cards, contextual heading and states. Run required checks and stop for review before the next UI increment.
4. Build desktop controls, URL transitions, chips and pagination; review desktop behavior and regressions.
5. Build mobile dialog and draft lifecycle; review full viewport/keyboard matrix and hybrid behavior.
6. Integrate navigation in small reviewed groups: navbar/search/categories, Trending/Flash Deals links, then mapped hero/promo/footer links. Preserve each section's visuals and interaction baseline.
7. Complete production build, automated rules, browser navigation, screenshots, accessibility and performance evidence. Report any unavailable checks; do not claim completion of unexecuted gates.

This is sequencing guidance, not an automatically executable tasks file. Each UI checkpoint follows the constitution's review requirement.

## Risks, dependencies and approval decisions

| Risk/dependency | Mitigation / decision |
| --- | --- |
| Shared projection changes homepage | Capture exact pre-change DTOs and card visuals; compare after extraction; rollback only scoped mapper changes if outputs drift. |
| Query boundary fails prerender | Installed docs require Suspense; validate production build before link rollout; do not disable cacheComponents. |
| Normalization loses warnings or loops | Guard replacement by current raw URL, preserve notice codes through its single replacement, clear on next user navigation/dismissal. |
| Mobile draft applies accidentally | Explicit Apply/Cancel lifecycle, discard on applied URL changes/desktop resize, test Escape and Back. |
| Global search differs from local search | Header starts fresh discovery; PLP search retains unrelated applied filters. Document both contracts. |
| Future category cycles or orphan refs | Cycle-safe descendant traversal and integrity tests; no child fixtures added now. |
| Stock/time semantics drift | Separate homepage vs PLP availability; no date eligibility; verify before/after November and countdown zero in test fixtures. |
| No test runner/browser automation yet | Node harness and development-only Playwright are approved for implementation. Install only necessary tooling with pnpm in that phase; execute automated critical journeys. Manual checks supplement, rather than satisfy, that gate. |
| Generic checklist exceptions | Keep 14/16 markers honest; retain rationale and carry the owner’s recorded acceptance into the implementation gate. |

## Owner decisions — 2026-11-03

The owner reviewed the planning summary and approved:

1. **Responsive filtering:** desktop sidebar at 1024px and mobile-style Apply filters below it. Validate 360px, 768px, 1024px and 1280px explicitly, including breakpoint boundaries and overflow; retain the full constitution/build-ui matrix.
2. **Testing:** dependency-free Node.js rule-test harness and development-only Playwright tooling for automated browser testing. Add only necessary dependencies during implementation using pnpm; no installation is authorized in this documentation update.
3. **Checklist exceptions:** accept the two documented implementation-detail exclusions for this feature, with rationale retained and the specification focused on observable requirements. This is a bounded acceptance, not a constitution amendment or permission to skip other quality gates.

**Preservation conditions:** retain all 16 canonical products, 10 curated Trending products, five Flash Deal records, existing countdown behavior and homepage design. No dataset migration or unrelated refactoring is authorized.

**Readiness:** no outstanding decision blocks `$speckit-tasks`. This update records decisions only; do not generate tasks, modify application source or install dependencies automatically. Implementation starts only when separately requested. Production domain/indexing policies, true promotion lifecycle and subcategory enrichment remain separate future features.

## Complexity Tracking

No constitution violation, migration, new state library, API layer, caching abstraction or framework change is proposed. The small test build harness exists only because Node cannot directly execute this repository's alias-based TypeScript services without adaptation; see research and quickstart for the bounded approach.
