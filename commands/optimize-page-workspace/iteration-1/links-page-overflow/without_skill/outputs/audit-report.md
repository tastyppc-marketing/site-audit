# Links Page Mobile Audit Report

## Primary Issue: URL Breaking Out of Card Container

**Root cause:** The orphan pages table in `renderOrphanPages()` rendered full, untruncated URLs inside `<td>` elements. Unlike the backlinks table (which used `_shortUrl()` to truncate), the orphan table displayed raw URLs with only a CSS `break-all` class on a child `<div>`. Combined with the table's default `table-layout: auto` and no column width constraints, long URLs (e.g. `sellingcalgarycastles.com/community/calgary-real-estate-market-report-2025`) pushed the table wider than its container, which then pushed wider than the viewport on mobile.

A secondary contributor: the `<main>` flex child lacked `min-width: 0`, so it refused to shrink below the intrinsic width of its content -- a well-known flexbox overflow bug.

## All Issues Found and Fixed

### 1. Orphan Table URL Overflow (Critical -- the reported bug)
- **Before:** Full URLs rendered with `break-all` but no `_shortUrl()` truncation and no `max-width` on the cell.
- **After:** URLs are truncated via `_shortUrl(item.url, 60)`, cells get the `.url-cell` class with `max-width` and `text-overflow: ellipsis`, and `<colgroup>` assigns proportional column widths. On mobile (<640px), the table is hidden entirely and replaced with stacked cards.

### 2. Flex Container Missing `min-width: 0` (High)
- **Before:** `<main id="page-content" class="flex-1 min-h-screen">` -- as a flex child, it would not shrink below content width.
- **After:** Added `min-w-0` class to `<main>`. Also added `min-width: 0` to `#page-content` in CSS.

### 3. `body` Missing `overflow-x: hidden` (Medium)
- **Before:** Nothing prevented horizontal scrollbar on body when content overflowed.
- **After:** Added `overflow-x: hidden` to `body` in CSS.

### 4. Table `table-layout` Not Constrained (Medium)
- **Before:** `report-table` used default `table-layout: auto`, letting content dictate column widths.
- **After:** Added `table-layout: fixed` to `.report-table` so columns respect assigned widths. Reverts to `auto` on mobile and print where fixed layout is less useful.

### 5. Backlinks Table Has No Mobile Layout (Medium)
- **Before:** The 6-column backlinks table relied solely on `overflow-x: auto` on its wrapper, requiring horizontal scrolling on mobile.
- **After:** On mobile (<640px), the table is hidden and replaced with stacked cards showing source URL, target URL, anchor text, DR, follow status, and date in a vertical layout.

### 6. Stat Card Grids Not 2-Column on Mobile (Low)
- **Before:** Grids used `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`, stacking into a single column on mobile which wastes space for small metric cards.
- **After:** Changed to `grid-cols-2 xl:grid-cols-4` so stat cards always show 2 per row minimum, which is appropriate for their compact size.

### 7. Hub Cluster Cards: Hub URL Not Truncated (Medium)
- **Before:** Hub URLs used `break-all` but could still be very long. The spoke URL truncation was 48 chars.
- **After:** Hub URLs are now truncated to 64 chars via `_shortUrl()`. Spoke badge text reduced to 40 chars. Added `min-w-0` and `max-w-full` to prevent spoke badges from overflowing.

### 8. Chart Label Truncation Too Generous (Low)
- **Before:** Chart labels in hub-spoke chart used `_shortUrl(url, 42)` and backlink comparison used `_shortUrl(domain, 28)`.
- **After:** Reduced hub-spoke labels to 32 chars and backlink comparison to 24 chars to prevent label overlap on narrow charts.

### 9. Unreachable URL Badges Missing `max-w-full` (Low)
- **Before:** Badges for unreachable URLs could overflow their flex container.
- **After:** Added `max-w-full` to badge spans and reduced truncation to 44 chars.

### 10. Detail Card Font Size Not Responsive (Low)
- **Before:** Detail card values used fixed `text-2xl` regardless of screen size.
- **After:** Changed to `text-xl sm:text-2xl` for better scaling.

### 11. Missing `<colgroup>` on Tables (Low)
- **Before:** No explicit column width allocation.
- **After:** Both orphan and backlinks tables now have `<colgroup>` elements that assign proportional widths.

### 12. Inconsistent Padding Across Breakpoints (Low)
- **Before:** Many cards and containers had fixed padding that was too generous on small screens.
- **After:** Added responsive padding (`p-4 sm:p-5`, `p-4 sm:p-6`, etc.) throughout.

### 13. `_shortUrl` Ellipsis Character (Cosmetic)
- **Before:** Used `'...'` (three dots) for truncation.
- **After:** Changed to unicode ellipsis character `\u2026` for cleaner presentation.

### 14. Score Popover Not Width-Constrained on Mobile (Low)
- **Before:** `.score-popover` had `max-width: 360px` with no mobile override, risking overflow.
- **After:** Added `max-width: calc(100vw - 32px)` at the 768px breakpoint.

### 15. Global Box-Sizing and Media Max-Width (Defensive)
- Added `box-sizing: border-box` on all elements and `max-width: 100%` on embedded media (img, svg, video, canvas, etc.) as a safety net against future overflow issues.

## Files Modified

| File | Nature of Changes |
|------|-------------------|
| `links.html` | Added `min-w-0` to `<main>` flex child to fix flex overflow |
| `report-styles.css` | Added `overflow-x: hidden` on body, `table-layout: fixed`, `.url-cell` class, responsive table/chart/popover rules, box-sizing reset, media max-width |
| `links.js` | URL truncation on orphan/backlinks tables, mobile card layouts for tables, responsive grid classes, responsive padding, responsive font sizes, `min-w-0`/`max-w-full` on badges, shorter chart labels |
| `data-loader.js` | No changes needed (copied as-is) |
