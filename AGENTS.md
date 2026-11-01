# Kenakata: project instructions

Read this file before changing code. Follow the installed Next.js documentation required below; this version may differ from familiar Next.js APIs.

## Project overview

- **Product:** Kenakata, a multi-vendor e-commerce marketplace for Bangladesh (many independent vendors sell on one platform).
- **Scope right now:** frontend UI only. All data is static/mock. **No backend, no API calls, no database, no axios/fetch to external services.**
- **Four interfaces in one Next.js app:**
  1. Main website (customer-facing storefront: home, categories, products, cart, wishlist, checkout)
  2. Customer dashboard (profile, orders, addresses, wishlist, reviews, returns, notifications)
  3. Vendor panel (store profile, products, variations, inventory, orders, earnings, wallet, withdrawals)
  4. Admin panel (customers, vendor and product approval, categories, orders, payments, commissions, refunds, coupons, support)
- **Stack:** Next.js (App Router), TypeScript (strict), Tailwind CSS v4 (CSS-first, tokens live in `src/app/globals.css`, no `tailwind.config.js`), Lucide React, React Icons, pnpm.
- **Package manager:** pnpm only. Never use npm or yarn. Do not add a dependency without asking first.

## UI work

Before creating or changing UI, read and follow [the build-ui skill](.agents/skills/build-ui/SKILL.md). It owns the design system, component patterns, coding conventions, responsive rules, category/product data models, and UI verification checklist. Also consult it for non-visual changes to those components or data models.

- Use the existing implementation as the design baseline. New HTML references are not required.
- Leave approved sections untouched unless the user explicitly requests changes.
- Build one section at a time, then stop for review before starting another.
- Keep detailed UI rules in the skill rather than duplicating them here.

## Project-wide constraints

- Keep work within the requested scope. Explicit user instructions override project defaults; clarify unresolved conflicts.
- Use typed static/mock data through `src/services`; components must not import raw data directly.
- Run `pnpm lint` and `pnpm build` for application code changes. Report verification limitations honestly.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
