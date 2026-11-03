# Research: Product Listing Page

**Date**: 2026-11-03. Research is repository/documentation based; no application execution certification.

## Evidence reviewed

- Root `AGENTS.md`; Constitution v1.0.0; feature spec, clarified hybrid policy, repository audit and requirements checklist.
- build-ui, frontend-design and ui-ux-pro-max skills. Existing design takes precedence over generic visual suggestions. Focused local UX search `keyboard focus modal` returned visible-focus and unobscured-focus guidance; no design-system replacement is needed.
- `package.json`, `tsconfig.json`, `next.config.ts`, storefront layout/page; product/category/vendor/navigation/banner types and fixtures; typed product/navbar/category/vendor services; shared ProductCard, Trending section/tabs, Flash Deals/countdown and navigation/search components.
- Installed Next.js documentation under `node_modules/next/dist/docs/`: `01-app/03-api-reference/03-file-conventions/page.md`, `error.md`, `loading.md`; `01-app/03-api-reference/04-functions/use-router.md`, `use-search-params.md`; `01-app/02-guides/migrating-to-cache-components.md`; `01-app/01-getting-started/04-linking-and-navigating.md`.
- Planning research agents independently checked installed rendering contracts and catalog/navigation preservation. No external website or package install was needed.

## Decisions

### R1 — Preserve the canonical dataset

**Decision:** Keep `src/data/products.ts` unchanged; reuse its 16 records. Preserve ten curated IDs, five deal references, and both presentation maps. Consolidate common projection logic only.

**Rationale:** Both current services already share the product export. Migration would introduce identity and content risk without solving a real duplication problem.

**Alternatives considered:** Merge/recreate records or use the Trending subset as the PLP catalog; rejected because they would lose identities/products. A new copied PLP fixture would drift.

### R2 — Request-bound listing inside the static storefront

**Decision:** Server page with a Suspense-wrapped async child that awaits promised searchParams; server-render cards and share only public control metadata with client components.

**Rationale:** Installed Cache Components migration docs explicitly show passing searchParams through the boundary. Existing layout already supplies main/navbar/footer. Installed `error.tsx` API is `retry` with an unknown error, not historical `reset`.

**Alternatives considered:** Entire client-side catalog, disabling cacheComponents, old force-dynamic config or request APIs at page root; rejected for larger client payloads, stale assumptions or needless config changes. No query cache is justified for 16 fixtures.

### R3 — URL is applied state; drafts are local

**Decision:** Router push for each changed applied action; replace for normalization; Link for pagination/navigation. Mobile edits and price/search drafts stay local. Resync on URL changes and discard cancelled drafts.

**Rationale:** Matches clarified policy and restores Back/Forward correctly even when React Activity preserves component state. Server results require actual route navigation; native history-only updates are insufficient for this design.

**Alternatives considered:** Global store/localStorage or debounced search; rejected because they compete with shared URLs or contradict explicit submission. Keying all controls on every query was rejected because it loses focus/notices and disrupts drafts unnecessarily.

### R4 — Deterministic rules use existing data

**Decision:** Publication date for newest, canonical soldCount for sales, product average/count for ratings; explicit string-ID ties in PLP only. ratingCount zero denotes unrated even though the existing average field is numeric. Category closure uses actual parent relationships only.

**Rationale:** Fixture fields already support these sorts, including six default publication dates and zero sales. Navbar subcategory text is presentation data, not catalog classification.

**Alternatives considered:** Create dates, sales estimates, weekly trends, vendor metrics, inferred subcategory keywords; rejected as unsupported. Do not enrich fixtures to make filters look populated.

### R5 — Contextual promotions

**Decision:** Deal price only in promotion view, fixed configured membership independent of dates; canonical stock AND remaining deal quota determine PLP deal availability. Keep homepage quota-only availability and 04:32:10 simulation unchanged.

**Rationale:** Preserve existing homepage while meeting explicit PLP stock requirements. No campaign entity or live promotion lifecycle exists.

**Alternatives considered:** Deal prices everywhere, wall-clock eligibility or synchronizing timers with stored dates; rejected as unrequested behavior changes.

### R6 — Reuse the card without a homepage redesign

**Decision:** Shared pure projector with explicit context overrides; unchanged ProductCard; PLP wrapper supplies unavailable/no-review explanatory text. Reuse existing placeholders for all products, including smartphone.

**Rationale:** Current card does not display stock, and sold progress is commented out. A wrapper adds listing status without altering every existing consumer.

**Alternatives considered:** A second ProductCard implementation or broad optional-prop redesign; rejected for drift and excess scope. Real image rendering remains deferred because no current product has a URL.

### R7 — Sidebar and modal filter interface

**Decision:** Desktop sidebar at 1024px, native modal dialog below; PLP grid 2/3/4 at base/768/1280. Keep homepage 2/4/5 unchanged.

**Rationale:** Sidebar reduces available card width; four desktop columns retain the existing card's comfortable proportions. A native dialog provides a platform focus model without adding a UI dependency, with lifecycle tests still required.

**Alternatives considered:** Five columns beside a sidebar or a new component library; rejected for narrow cards or unnecessary dependencies. Existing homepage desktop header breakpoint is not a mandate to make tablet PLP filters immediate.

### R8 — Test tooling without package additions

**Decision:** Propose Node built-in `node:test`/`node:assert/strict` plus the already-installed TypeScript compiler. A narrow `scripts/test-catalog.mjs` compiles test/service dependency closure to a temporary CommonJS directory using `tsconfig.catalog-tests.json`, rewrites emitted `@/` module specifiers to relative emitted paths, runs `node --test` on the emitted tests, propagates failures and removes only its temporary directory. Test fixtures are copies; never mutate shipped data. Owner approved this harness on 2026-11-03 for the implementation phase; no files or tooling are added during approval recording.

**Rationale:** No test runner is declared. Node v24.19.0 and TypeScript 5.9.3 were observed locally. Compiler-based execution keeps aliases in source and avoids assuming Node's type stripping understands tsconfig paths. No Node runtime upgrade or package addition is necessary.

**Alternatives considered:** adding Vitest or tsx for rule tests, or treating lint as a rule test; rejected as unnecessary dependencies or insufficient evidence. Alias rewriting is limited to emitted test artifacts and must have a smoke check for imported service modules. The owner approved development-only `@playwright/test` and necessary browser tooling on 2026-11-03 for automated browser journeys during implementation, using pnpm and only necessary dependencies. Manual browser journeys do not count as automated E2E coverage. Actual automated execution remains required; approval alone is not validation.

### R9 — Navigation ownership

**Decision:** Central pure typed URL builder and explicit category mappings, passed through services to components. Trending's active state must own both View All hrefs; move its header markup into the existing client tabs boundary (server section still loads projections) without changing rendered arrangement.

**Rationale:** Current header link is in a server parent while active tab is local in a child. An isolated link cannot know the selection without moving ownership or adding shared state.

**Alternatives considered:** Turn tabs into routes, link every tab to one fixed destination, or add a cross-page store; rejected as behavior drift or excess machinery.

## Resolved unknowns and recorded approvals

No blocking technical unknown or outstanding decision remains for task generation. The owner approved the 1024px filter breakpoint, Node rule-test harness, development-only Playwright testing and two feature-scoped checklist exceptions on 2026-11-03; see the decision record in [plan.md](plan.md). Preserve 16 canonical products, 10 curated Trending items, five Flash Deals, countdown behavior and homepage design. Tool installation and application changes remain deferred until implementation is requested. Production SEO infrastructure remains outside scope. Checklist rationale and unchecked exception markers remain visible; approval does not imply tests have passed.
