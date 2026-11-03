# Kenakata Constitution

## Core Principles

### I. Preserve the Existing Experience

Changes MUST preserve approved UI, responsive layouts, section ordering, and working
interactions unless the user explicitly requests their alteration. The current implementation
is the visual baseline. UI work MUST follow `.agents/skills/build-ui/SKILL.md`, including
light-only styling, solid colors, shared tokens, typography, and mobile behavior. Existing
placeholder controls MUST NOT silently acquire unrelated behavior. Review MUST cover nearby
sections and shared-component consumers to prevent regressions.

### II. Respect the Established Stack

Development MUST use the existing Next.js App Router, strict TypeScript, React, Tailwind CSS v4,
Lucide React, React Icons, and pnpm conventions. CSS tokens belong in `src/app/globals.css`;
components MUST use those tokens rather than introduce competing design systems. Use the
`@/*` source alias and existing naming and module patterns. New dependencies require prior
user approval. Before application changes, read the relevant installed Next.js documentation
in `node_modules/next/dist/docs/`; framework upgrades and configuration changes require
explicit scope and compatibility validation.

### III. Maintain Typed, Reusable Boundaries

Components MUST obtain typed mock data through `src/services`, never import raw `src/data`
fixtures directly. Shared contracts belong in `src/types`, reusable presentation in
`src/components/shared`, and common utilities in `src/lib`. Reuse existing ProductCard,
VendorCard, TrustStrip, price formatting, and discount helpers before adding alternatives.
Keep components focused; avoid unjustified abstractions and unsafe type escapes. Server
Components are the default; client boundaries MUST be limited to necessary interactivity,
with serializable, minimal props. Future external inputs MUST receive runtime validation;
TypeScript alone does not validate untrusted input.

### IV. Enforce Authorization

Before any real private data or privileged operation is introduced, every server entry point
and underlying data operation MUST enforce authenticated identity, explicit permissions, and
resource ownership. Deny access by default. Customers may access only their own private
resources; vendors only their authorized store resources; administrators only explicitly
granted administrative capabilities. UI hiding, route groups, client role flags, and supplied
resource IDs MUST NOT be treated as authorization. Administrative privilege changes and
sensitive actions MUST be auditable. Session revocation and permission changes MUST take
effect without trusting stale client state. Mock interfaces MUST NOT claim production security.

### V. Isolate Vendor Data

Every vendor-owned private resource MUST have an unambiguous vendor association. Future
reads, writes, searches, aggregates, exports, files, background jobs, and caches MUST enforce
that association using trusted identity and membership checks. Client-supplied vendor IDs
MUST NOT establish access. Nested resources and bulk operations MUST enforce ownership too.
Shared orders MUST expose to each vendor only its own fulfillment and financial portion and
necessary customer details. Public catalog projections may expose approved public fields;
private cross-vendor access requires explicit administrative permission and an audit trail.
Tests MUST prove vendor A cannot read or modify vendor B's private resources.

### VI. Preserve Commerce Integrity

Product, category, vendor, variant, inventory, order, payment, refund, and commission records
MUST use consistent identities and documented relationships. Preserve the current flat
category hierarchy, deepest-category references, separate flash-deal records, active-product
filtering, and small card projections. Display BDT using `formatPrice()` and derive discounts
with the shared helper. Current mock prices are whole taka; a future financial model MUST
specify units and rounding and MUST NOT rely on floating-point money arithmetic.

Before transactional features ship, define allowed state transitions and authoritative
calculations. Orders MUST retain purchase-time item, vendor, price, discount, and commission
snapshots. Inventory changes MUST prevent overselling under concurrency; retries and duplicate
payment events MUST NOT duplicate charges, refunds, stock changes, or vendor credits. Refunds
MUST be bounded by refundable captured amounts, and commissions and vendor balances MUST
reconcile with payments, refunds, and payouts. Use atomic operations or documented recoverable
coordination appropriate to the selected architecture. Browser totals and payment redirects
MUST NOT establish payment success; verified server-side evidence is required.

### VII. Build for Security, Accessibility, Performance, and Discovery

New functionality MUST validate untrusted input, minimize data exposure, and address applicable
injection, request forgery, abuse, and unsafe upload risks. Interactive UI MUST provide semantic
structure, keyboard operation, visible focus, accessible names, adequate contrast, 44px touch
targets, and reduced-motion behavior. Dynamic feedback MUST be accessible. Validate loading,
empty, and error states where applicable.

Preserve server rendering, optimized fonts, and limited client JavaScript. New images MUST use
the project's Next.js image conventions with reserved dimensions. Features MUST identify and
check relevant rendering, asset, and interaction performance risks. Public routes MUST have
appropriate titles, descriptions, semantic headings, and indexable content; canonical URLs and
structured data MUST reflect real content when introduced. Private dashboards MUST be excluded
from indexing, while authorization remains mandatory regardless of crawler directives.

### VIII. Validate According to Risk

Application changes MUST pass `pnpm lint` and `pnpm build`. UI changes MUST receive visual and
interaction checks at the build-ui skill's viewport matrix, including 360, 768, and 1280px and
overflow checks across 320–1920px. Reports MUST distinguish executed checks from expectations.
New business rules require meaningful automated tests; integrations require contract and
failure-path coverage; critical journeys require end-to-end coverage when introduced.
Authorization, cross-vendor access, concurrent stock updates, duplicate events, refund limits,
and financial reconciliation MUST have automated regression coverage before real operations
are enabled. Test tooling additions require approval. Documentation-only changes require
consistency and diff checks, not application builds. Unavailable checks MUST be disclosed;
unverified security or money-handling gates block release of the affected capability.

### IX. Protect Secrets and Private Data

Secrets MUST NOT be hardcoded or committed in source, fixtures, documentation, or tests.
Future credentials MUST use approved server-side environment or secret storage. Public
environment variables, client bundles, serialized props, rendered HTML, errors, analytics,
and logs MUST NOT expose credentials or sensitive server-side records. Return explicit public
or role-authorized projections instead of entire private entities. Fixtures MUST use synthetic
data. Sensitive logs MUST be redacted; compromised credentials MUST be revoked and rotated.

### X. Deliver Incrementally

Work MUST remain within the requested scope, using small, reviewable changes and existing
patterns. Build one UI section at a time and stop for user review before another unless the
user explicitly authorizes a broader scope. Rewrites, speculative infrastructure, stack
replacement, and unrelated cleanup MUST NOT accompany feature work. Necessary structural
changes MUST document the concrete problem, compatibility impact, validation, and migration
or rollback approach. Backend requirements in this constitution do not authorize backend work.

## Project Baseline and Architectural Decisions

The repository review for initial adoption establishes this baseline:

- `package.json` declares Next.js 16.4.3, React 19.3.0, TypeScript 5, Tailwind CSS 4,
  pnpm 10.30.3, ESLint 9, Lucide React, React Icons, clsx, and tailwind-merge.
  TypeScript strict mode and Next.js ESLint rules are enabled. `next.config.ts` enables
  cache components, partial prefetching, and the Tailwind Turbopack loader.
- `src/app/(storefront)/page.tsx` is the implemented home route. Its layout provides Navbar,
  main content, and Footer. Auth, customer account, vendor, and admin directories contain
  placeholders, not implemented secure dashboards. No backend, database, authentication
  provider, or payment gateway is implemented or selected by this constitution.
- Home content is Banner, Categories, Flash deals, Trending products, Promo banners,
  Top vendors, and Trust strip. Shared cards support multiple sections. Client interaction
  includes navigation state, carousel controls, copy feedback, countdowns, trending tabs,
  and local newsletter validation. Cart/wishlist controls and many links remain placeholders.
- Typed asynchronous services read local fixtures. Product and vendor contracts include
  moderation and inventory fields, but these are not transaction or authorization systems.
  Flash-deal countdowns are simulated. Navbar categories and banner vendor summaries have
  separate presentation models that MUST NOT be mistaken for canonical future domain models.
- Styling uses CSS-first tokens, Plus Jakarta Sans headings, DM Sans body text, mobile-first
  Tailwind classes, global focus and reduced-motion rules, and a 1280px container convention.
  Root metadata defines the marketplace title and description.
- Root `AGENTS.md` is the discovered project instruction file. The README remains starter
  documentation and does not override pnpm or the implemented fonts. The build-ui skill
  describes six flash deals, but fixtures enable five and comment out the sixth. This
  discrepancy does not authorize a UI or data change; resolve it when that section is scoped.
- No test runner or test script is declared. Lint and build scripts exist; their presence
  does not establish that the current application passes them. This review is source-based,
  not a runtime accessibility, security, or performance certification.

Current scope MUST remain frontend UI with static/mock data: no backend, database, external
API calls, or axios/fetch integration until the user explicitly changes that scope. Marketing
copy mentioning bKash, Nagad, cards, cash on delivery, returns, or delivery promises is mock
content, not an integration selection or validated operating policy.

The following decisions remain open. Record the selected option, alternatives, rationale,
security implications, owner approval, and validation plan in the relevant future feature
plan or architectural decision record before dependent implementation:

- **D1 — Persistence and backend:** database, access layer/ORM if any, transaction and
  concurrency strategy, migrations, backups, and deployment/runtime boundaries.
- **D2 — Identity and permissions:** authentication provider or implementation, sessions,
  recovery, verification, administrative MFA, role capabilities, vendor staff membership,
  and revocation rules.
- **D3 — Tenancy:** ownership schema, enforcement layers, private cache partitioning,
  file access, background-job scoping, and audited administrative access.
- **D4 — Payments and accounting:** gateway(s), cash-on-delivery lifecycle, event verification,
  idempotency, money units/rounding, ledger and reconciliation, refunds, commission basis,
  settlement timing, withdrawals, and chargebacks.
- **D5 — Commerce policies:** order splitting, inventory reservations and expiry, variant stock,
  discount allocation, shipping/tax treatment, cancellations, returns, and moderation rules.
- **D6 — Operations and data protection:** hosting, secrets management, media storage,
  monitoring, audit retention, privacy/retention rules, recovery objectives, and abuse controls.
- **D7 — Quality and discovery:** approved test tools and CI gates, performance budgets,
  production domain/canonicals, sitemap policy, and future Bangla/localization scope.

## Development Workflow and Quality Gates

1. Read `AGENTS.md`, applicable skills, the relevant installed Next.js guides, and affected
   implementations. Identify reusable components, current behavior, and baseline limitations.
2. In the feature specification and plan, state scope, acceptance criteria, affected interfaces,
   relevant principles, and unresolved decisions. Resolve decisions that block the requested
   implementation; do not invent providers or infrastructure.
3. Implement only the authorized increment. Preserve service/type boundaries and approved UI.
   Future backend plans MUST define authorization, tenancy, state transitions, and failure
   handling before exposing real data or financial operations.
4. Review the diff and validate according to Principle VIII. Check shared consumers, accessibility,
   responsive behavior, data exposure, and relevant security and commerce invariants.
5. Report changed files, observed validation results, remaining limitations, and any release
   blockers. Obtain the required section review before proceeding to another UI section.

## Governance

This constitution governs project specifications, plans, implementation, and review. `AGENTS.md`
provides operational instructions and the build-ui skill owns detailed UI rules; avoid duplicating
those evolving rules here. Explicit user instructions take precedence over project defaults.
Unresolved conflicts MUST be raised before affected changes; a one-off request MUST NOT silently
redefine permanent governance or imply that production safeguards are already implemented.

Amendments MUST identify the reason, affected principles, compatibility impact, and migration or
validation needs, and receive project-owner approval. Every feature plan and change review MUST
record compliance with applicable principles or an explicitly approved, bounded exception with
rationale and follow-up. Exceptions MUST NOT enable real private-data or financial operations
without the mandatory authorization, isolation, and integrity protections.

Use semantic versioning: MAJOR for incompatible principle removals or redefinitions, MINOR for
new principles or materially expanded requirements, and PATCH for non-semantic clarifications.
Update the amendment date and sync impact report on changes; preserve the original ratification
date. This initial adoption replaces an unratified generic scaffold with version 1.0.0.
Dependent templates and commands consume this constitution at runtime and are not modified by
this constitution workflow. Remove the temporary sync impact report before committing.

**Version**: 1.0.0 | **Ratified**: 2026-11-03 | **Last Amended**: 2026-11-03
