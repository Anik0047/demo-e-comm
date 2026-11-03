# Repository Audit: Product Catalog and Discovery

**Date**: 2026-11-03
**Specification**: [spec.md](spec.md)
**Method**: Read repository source, types, services, constitution, project instructions, and build-ui guidance. Findings describe the checkout, not runtime certification. Paths below are repository-relative.

## Governance and routes

- `AGENTS.md` and `.specify/memory/constitution.md` v1.0.0 require approved UI preservation, typed service access, flat category hierarchy, separate deals, active-product visibility, static frontend scope, and pnpm. Application changes require installed Next.js documentation, lint/build, and visual checks. Documentation changes require consistency/diff review.
- `.agents/skills/build-ui/SKILL.md` defines the shared card and responsive patterns. Its six-deal/sold-bar prose differs from source: five deals are enabled and sold progress is commented out. Source is the preservation baseline; do not “fix” those differences during consolidation.
- `src/app/(storefront)/page.tsx` is the only discovered page route. It renders Banner → Categories → FlashDealsSection → TrendingSection → PromoBannersSection → TopVendorsSection → TrustStrip.
- `src/app/(storefront)/layout.tsx` obtains `getNavbarData()` and renders Navbar, main, Footer. Root `src/app/layout.tsx` and `src/app/globals.css` own the shared fonts/metadata/tokens. No implemented `/products`, `/category`, `/vendors`, `/vouchers`, or `/gift-cards` route was found.
- `.specify/init-options.json` selects sequential feature numbering. No existing `specs/` directory or `.specify/extensions.yml` was found at audit start. No before/after hooks apply; branch `setup/spec-kit` remains unchanged.

## Product sources and consumers

| Source | Exports/model | Imports and consumption |
| --- | --- | --- |
| `src/types/product.ts` | `Product`, `ProductStatus`, `ProductVariant`, `FlashDeal`, `ProductCardData`, `FlashDealItem`, placeholders | Shared contracts for fixtures/services/cards |
| `src/data/products.ts` | `createProduct()`, `products`, `trendingProductIds`, `trendingPlaceholders` | Canonical products imported by both product-section services; curated IDs/artwork imported by Trending |
| `src/data/flash-deals.ts` | `flashDeals`, `flashDealPlaceholders` | Promotion references and presentation metadata imported by Flash Deals service; no `Product` definitions |
| `src/services/trending.ts` | `TrendingTab`, `getTrendingProducts()` | Imports canonical products, curated IDs/placeholders, and vendors; filters curated active products and produces four card arrays |
| `src/services/flash-deals.ts` | `getFlashDeals()` | Imports canonical products, vendors, deals/placeholders; joins by `productId` and `vendorId`, skips missing/inactive products, throws for missing vendor |
| `src/components/home/trending/trending-section.tsx` | `TrendingSection` | Calls typed Trending service and passes arrays to client tabs |
| `src/components/home/trending/trending-tabs.tsx` | `TrendingTabs` | Imports service tab type and `ProductCardData`; local state chooses array; renders shared `ProductCard` |
| `src/app/(storefront)/page.tsx` | Home page | Calls typed Flash Deals service; passes items/seconds to FlashDealsSection |
| `src/components/home/flash-deals/flash-deals-section.tsx` | `FlashDealsSection` | Receives `FlashDealItem[]`; renders shared `ProductCard` with quota/sold props and `FlashCountdown` |
| `src/components/shared/product-card.tsx` | `ProductCard` | Uses public `ProductCardData`, placeholder icon, `formatPrice`, `calcDiscountPercent`, `cn`; no raw fixture import |

No raw `@/data` imports were found in the inspected components. There is no general catalog listing service yet. Two services independently assemble overlapping card projections; that is duplicated mapping logic, not evidence of duplicated products.

## Exact catalog and deal relationships

The canonical export contains **16 unique product IDs**. The first six products have default stock 100, active status, soldCount 0, and publication/creation/update dates `2026-10-01T00:00:00.000Z`. The ten later products override publication/creation dates and sales counts. Every current product has an explicit rating average/count. All have empty main-image URLs and placeholder presentation metadata in one of the two maps.

| Canonical product ID | Name | Regular price (BDT) | Enabled deal / price | Trending selection |
| --- | --- | --- | --- | --- |
| `prod-wireless-earbuds-pro` | Wireless Earbuds Pro | 3770 | deal-1 / 2450 | No |
| `prod-smart-watch-series-5` | Smart Watch Series 5 | 6650 | deal-2 / 3990 | No |
| `prod-cotton-panjabi` | Cotton Panjabi | 1600 | deal-3 / 1200 | No |
| `prod-nonstick-cookware-set` | Non-stick Cookware Set | 4750 | deal-4 / 2850 | No |
| `prod-bluetooth-speaker` | Bluetooth Speaker | 2999 | deal-5 / 1799 | No |
| `prod-android-smartphone-128gb` | Android Smartphone 128GB | 18990 | None; deal-6 commented out | No |
| `prod-running-shoes` | Running Shoes | 2490 | None | 1 |
| `prod-laptop-backpack` | Laptop Backpack | 1450 | None | 2 |
| `prod-wireless-gaming-mouse` | Wireless Gaming Mouse | 1290 | None | 3 |
| `prod-power-bank-10000` | 10000mAh Power Bank | 1590 | None | 4 |
| `prod-ceramic-coffee-mug-set` | Ceramic Coffee Mug Set | 890 | None | 5 |
| `prod-led-desk-lamp` | LED Desk Lamp | 1250 | None | 6 |
| `prod-organic-face-serum` | Organic Face Serum | 1150 | None | 7 |
| `prod-basmati-rice-5kg` | Premium Basmati Rice 5kg | 780 | None | 8 |
| `prod-kids-building-blocks` | Kids Building Blocks Set | 1350 | None | 9 |
| `prod-yoga-mat` | Yoga Mat | 990 | None | 10 |

All five enabled deal product references resolve to the shared catalog. The commented smartphone reference also resolves. No duplicate product IDs, no Flash Deals-only canonical records, and no missing displayed deal products were found. The two homepage selections are disjoint subsets of the same catalog; disjoint selections do not imply separate catalogs.

Enabled deal quota/sold pairs in order are 100/72, 60/45, 200/160, 50/28, and 100/88. All deal windows are stored as November 1, 2026 00:00:00 UTC through November 30, 2026 23:59:59 UTC. There is no campaign entity, campaign ID, percentage rule, or voucher association. The stored fixed deal price is the discount rule; percentages are calculated at display time.

`getFlashDeals()` does not check dates or canonical stock. Its card `inStock` checks deal sold count against quota. It returns a constant `endsInSeconds = 4 * 3600 + 32 * 60 + 10` (16,330). `src/components/home/flash-deals/flash-countdown.tsx` and `src/hooks/use-countdown.ts` count down locally and clamp at zero; there is no membership refresh at zero. `getTrendingProducts()` uses `!trackInventory || stock > 0` for availability.

## Trending ordering and presentation

- All: the ten curated IDs, in the order above.
- New arrivals (`new`): publication date descending, null treated as empty string.
- Best sellers (`best-sellers`): canonical `soldCount` descending.
- Top rated (`top-rated`): average descending, then rating count descending.
- Sort ties retain curated input order; no explicit ID tie-break exists today.
- All four tab arrays contain the same ten active records; they are not separately defined datasets.
- Both homepage grids use two columns below 768px, four from 768px, five from 1280px. Trending hides entries 9–10 below 1280px; Flash Deals maps all five records.
- Tabs use local state and roving focus, ArrowLeft/Right/Home/End, and a shared tab panel. Both View all controls currently link to `#`.
- Shared card renders vendor/name/rating/prices, placeholder artwork, discount badge, and static wishlist/cart buttons. Product/image/vendor destinations are `#`. Deal props alter bottom spacing; sold bar/text is commented out. `inStock` and `freeShipping` exist in card data but are not currently rendered. The card has no nonempty-image rendering branch in this checkout; no real-image work is implicitly authorized by the PLP specification.

## Categories, vendors, and navigation models

- `src/types/category.ts`: flat `Category` with ID, name, unique slug, parentId, and level 1/2/3; `MainCategory` adds icon/tone and fixes root semantics.
- `src/data/categories.ts`: eight roots only. Products use existing root IDs; there are no level-2/3 records. `src/services/categories.ts:getMainCategories()` returns roots to category tiles through the home page. Books & stationery has no assigned product.
- `src/types/navigation.ts`: separate `CategoryGroup` with name and string subcategories, and `CartItem` with display ID/name/qty/price. `src/data/navbar.ts` contains eight presentation groups with six subcategory labels each and two miniature-cart display records (Earbuds and Panjabi). Those cart records repeat display values but are not full canonical `Product` definitions and lack product references; cart architecture is outside the requested Flash/Trending consolidation.
- `src/services/navbar.ts:getNavbarData()` passes this presentation model through the storefront layout to Navbar. `category-nav.tsx`, `mega-menu.tsx`, and `mobile-drawer.tsx` use placeholder links. All categories is a menu button, not a route. Mobile has category links and Flash deals/Vouchers/Top vendors/Track order/Become a vendor; it does not currently contain all desktop quick links.
- `src/components/layout/navbar/search-form.tsx`: desktop hardcodes All plus five category labels; mobile has no category selector. Both prevent submit; neither performs catalog search. Search fields need accessible names when activated.
- `src/types/vendor.ts`, `src/data/vendors.ts`, and `src/services/vendors.ts`: eight full approved vendors. Product services join these by vendorId; `getTopVendors(limit=6)` ranks approved vendors by vendor rating/count. Vendor `productCount` is marketing mock data, not the 16-product catalog count. Vendor ratings must not become product ratings.
- `src/types/banner.ts` has a separate decorative `Vendor` type (ID, initials, color classes), used by `src/data/banner.ts` and `src/services/banner.ts:getTopVendors()`. It is not the canonical vendor model despite the same function/type names. Banner obtains these through its own service.

## Other homepage discovery sources

- `src/data/banner.ts`: four `HeroSlide` records with labels but no destination field; `src/components/home/banner/hero-slider.tsx` hardcodes `href="#"`. Flash sale countdown is presentation behavior, not a product campaign join.
- `src/components/home/banner/promo-tiles.tsx`: decorative vendor avatars and View all placeholder; `coupon-tile.tsx` offers local copy feedback for WELCOME200, not a voucher data model.
- `src/types/promo.ts`, `src/data/promo-banners.ts`, `src/services/promo-banners.ts`, and `src/components/home/promo/*`: three typed marketing banners (home, groceries, beauty), each with `cta.href="#"`; no product assignments or executable discount rules.
- `src/components/home/top-vendors/top-vendors-section.tsx` receives six vendors from the canonical vendor service. Shared `vendor-card.tsx` displays vendor metadata and placeholder store links.
- `src/data/footer.ts` and `src/services/footer.ts` provide typed footer navigation including Flash deals, New arrivals, Best sellers, Top vendors, and Gift cards; all currently `#`. Product links should follow the same proposed mapping as navbar links.
- Trust points (`src/types/trust.ts`, `src/data/trust-points.ts`, `src/services/trust-points.ts`, shared TrustStrip) are informational; they do not query products or establish free-shipping/payment policy.

## Supported data versus missing capabilities

| Capability | Actual evidence | Specification consequence |
| --- | --- | --- |
| Price/discount | Whole-taka price, nullable compareAtPrice; separate fixed deal price | Context-specific price filtering/sorting; reuse calculated percentage |
| New arrivals | Published/created timestamps exist; six use shared defaults | Sort by publication; disclose mock defaults; no invented recency |
| Best sellers | Ten explicit sales counts, six default zeros | Sort real stored counts; no weekly/time-window claims |
| Top rated | All 16 have average/count | Sort product rating then review count, not vendor rating |
| Availability | Inventory tracking/stock; separate deal quotas | Supported, with explicitly documented listing combination rule |
| Free shipping | Boolean present, five Trending products true | Supported boolean filter; unrelated to banner order-threshold marketing |
| Brand/tags/variants/specifications | Fields exist but initial values are empty/null | Search populated future brand/tags only; no empty attribute filters |
| Subcategories | Navbar strings only; flat model supports descendants | Defer actual subcategory options pending canonical data |
| Campaign/time eligibility | Deal timestamps stored but never evaluated; no campaign entity | Preserve mock membership; don't claim real-time eligibility |
| Trending popularity | Curated IDs and generic marketing caption | No “this week” ranking or popularity metric invented |

## Minimum safe consolidation and acceptance evidence

1. Keep `src/data/products.ts` as canonical, retaining all 16 identities and values. Keep all ten curated IDs and all five enabled deals. No canonical record migration/deletion is presently needed.
2. Retain promotion records and separate placeholder maps. Presentation metadata is not a duplicate product catalog. Later planning may share product-to-card resolution to prevent mapper drift while preserving section-specific overrides.
3. Reuse typed services for the future PLP and keep raw fixture imports outside components. Do not expose the full Product model as public card data.
4. Verify ID/slug/SKU uniqueness, category/vendor joins, deal references, curated membership/order, display price overrides, placeholders, and active-only behavior. Demonstrate a single canonical edit reaches all consuming projections. Do not add a product to Trending solely to prove reuse.
5. Capture before/after homepage visuals and interactions in the implementation phase, including commented sold UI staying hidden and five (not six) deals.
6. If drift introduces missing deal products, propose a one-record-per-missing-ID addition preserving existing content; resolve collisions before modifying source. Current audit requires no such addition.
7. Keep work reviewable and reversible through the existing version history; retain baseline IDs/values and compare service outputs before/after. A failed preservation check blocks accepting the increment rather than authorizing a redesign.
