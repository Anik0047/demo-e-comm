# Public Listing URL and Interaction Contract

**Route:** `/products` in the storefront shell. No category alias route or API endpoint. The URL is the source of applied state.

## Query grammar and normalization

All parameters are optional and single-valued. Repeated keys use their first decoded occurrence; discard later values. Decode using the platform URL parser once; do not double-decode `%` sequences. Invalid encodings must not throw: replacement characters are handled as normal input and validated by the field rules.

| Parameter | Accepted value | Invalid/default handling |
| --- | --- | --- |
| category | Exact canonical slug | Unknown removed with accessible notice; valid empty Books & stationery retained. |
| vendor | Slug among vendors of active canonical products | Unknown/unavailable removed with notice. |
| search | Trimmed, collapsed-whitespace query, max 200 characters | Empty omitted; truncate excess with notice. Preserve retained text for display; matching is case-insensitive. |
| minPrice / maxPrice | Decimal digits representing nonnegative safe integers in whole taka | Invalid bound removed with notice; min > max removes both with notice. Never clamp to fixture price range. |
| availability | `in-stock` or `out-of-stock` | Omit for all; invalid removed with notice. |
| promotion | `flash-deals` | Omit for ordinary pricing; invalid removed with notice. |
| freeShipping | `true` | Omit for all; unsupported values removed with notice. |
| sort | catalog, price-asc, price-desc, newest, best-selling, top-rated | Default catalog omitted; invalid becomes catalog with notice. |
| page | Positive safe integer represented by decimal digits | Invalid, zero, negative, fractional or unsafe values → 1. Omit page 1. Valid excessive page → last available page. |

Leading zeros normalize to integer text. Negative signs, exponent notation and fractional notation are not the decimal-integer input grammar. Search truncation uses Unicode code points to avoid splitting surrogate pairs. These parsing choices apply equally to direct URLs and committed form values.

Serialize keys in this order: category, vendor, search, minPrice, maxPrice, availability, promotion, freeShipping, sort, page. Omit unknown keys without a notice, empty selections and defaults. Construct URLs only from fixed `/products` and URLSearchParams-encoded values; never pass user-controlled paths to router methods. React renders query text as text.

Compute count before page normalization. Zero results means page 1, totalPages 0 and no pagination. Normalization uses replace and cannot create a Back loop. Preserve any ignored-filter/truncation notice through the normalizing navigation until dismissal or next applied action; do not add notice parameters to the URL. Repeated keys and default/unknown-key cleanup alone need no warning.

## Matching and ordering

Search tokens split on normalized whitespace; every token must be a substring of at least one of product name, populated brand, a tag or vendor name. Tokens may match different fields. Do not match description, SKU, vendor statistics or hidden attributes. No fuzzy search or synonyms. All filter dimensions combine with AND; one category and one vendor maximum.

| sort | Primary | Ties |
| --- | --- | --- |
| catalog | canonical array order, restricted by filters | unique ID ascending if ever needed |
| price-asc / price-desc | displayed contextual price ascending / descending | ID ascending |
| newest | publishedAt descending, null last | ID ascending |
| best-selling | canonical soldCount descending | ID ascending |
| top-rated | ratingCount > 0 first, ratingAverage descending among rated | ratingCount descending, ID ascending; unrated ordered by ID |

Use consistent ordinal string comparison for IDs, not locale collation. Never mutate fixture arrays when sorting. Homepage Trending keeps its existing curated stable ties. Pagination slices 12 results only after ordering, with no duplicates or omissions.

## Hybrid control contract

| Action | Desktop ≥1024px | Below 1024px | History/page |
| --- | --- | --- | --- |
| Category/vendor/availability/promotion/shipping selection | Immediate | Modal draft until Apply filters | One push on changed commit; page 1 |
| Price edit | Draft until Apply price submits both bounds | Draft included in Apply filters | No history while typing; one push on commit; page 1 |
| PLP search | Explicit Enter/submit | Explicit Enter/submit outside modal | Preserve other applied filters; one push; page 1 |
| Sort | Immediate | Immediate | One push; page 1 |
| Pagination | Link navigation | Link navigation | One push; preserve other values |
| Remove chip / Clear filters | Immediate | Immediate outside modal | One push; page 1; Clear retains sort |
| Close/cancel/Escape modal | Not applicable | Discard unapplied edits | No navigation |
| Back/Forward/reload | Restore URL state | Restore URL state; discard stale drafts | No compensating push |

The applied mobile price bounds require no second Apply price button: Apply filters is their explicit submission. Enter in the dialog form invokes that same action. On desktop Enter in price inputs submits only price bounds. Search/sort/pagination never commit an unrelated draft. A resize across the desktop threshold closes the dialog and discards modal drafts, with no filtering or history side effect.

During a pending navigation serialize additional commits and mark results busy; keep displayed applied controls/results together until the response arrives. Discard stale normalization effects if the URL has since changed. Each completed state-changing action creates one entry, not one per keystroke or one per mobile selection. A same-state submit is a no-op. Do not implement custom scroll restoration; use scroll:false for filter/sort changes and normal Link behavior for pagination, checking that focus stays visible.

## State presentation

- Contextual h1 reflects category/search/promotion; result count is actual filtered total. Promotion context explains the configured mock deal view without suggesting live inventory enforcement.
- Applied chips reflect URL state only, wrap on small screens, and expose named removal buttons.
- Empty: count zero, no pagination, keep controls, clear/edit actions.
- Pending: reserved solid loading shapes or retained cards with busy status; no fabricated latency.
- Expected unavailable: distinct from zero matches; retain URL/controls, provide retry.
- Unexpected result error: keep applied controls outside the result-slot error boundary and render a safe retry state inside it. Last-resort route fallback reuses applied controls from the current URL; if options cannot be loaded, category/vendor selectors retain the selected value plus All and disclose unavailable alternatives. Do not clear selections on a catalog failure. Installed route retry callback re-renders without clearing URL; complete options return on recovery.
- Accessible result announcements are polite and occur for final committed results, not each draft keystroke. One h1 and one inherited main; pagination has current-page semantics.

## Examples

- `/products`: 16 products, page 1 has 12 and page 2 has 4.
- `/products?category=electronics&vendor=tech-haven&promotion=flash-deals`: Earbuds Pro and Smart Watch Series 5.
- `/products?minPrice=1200&maxPrice=2450&promotion=flash-deals`: Earbuds Pro, Cotton Panjabi, Bluetooth Speaker in canonical order (three matches).
- `/products?category=books-stationery&page=9`: normalize to category only, zero results, selected category retained.
- `/products?sort=newest`: Kids Building Blocks Set first; best-selling: Premium Basmati Rice 5kg first; top-rated: Kids Building Blocks Set first.
- `/products?category=electronics&category=fashion&page=999`: first category wins; clamp to last electronics page.
