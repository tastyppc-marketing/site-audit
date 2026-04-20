# Deep Dive #36 — `template/reports/multipage/shared/table-pagination.js`

**File:** [`template/reports/multipage/shared/table-pagination.js`](/root/site-audit/template/reports/multipage/shared/table-pagination.js) (170 lines)
**Layer:** 08 — shared renderer (declarative table pagination)
**Date:** 2026-04-20

---

## 1. Purpose

Pagination utility. Wrap any `.report-table` in `<div data-paginate>` to enable.

Features:
- Page size selector (with "All" option).
- Previous/Next navigation.
- "Page X of Y" indicator.
- Auto-detects wrappers on init.

Default page size configurable via constants (`DEFAULT_PAGE_SIZE`, `PAGE_SIZES`). HANDOFF.md:22 noted "25/page with grouped by referring domain" — this is the backlink table's usage.

## 2. Key logic

**`buildPagination(wrapper)` (line 20).** Calculates total rows, current page, `start`/`end` indices (lines 58-59). Iterates rows and sets `display: none/""` based on current page.

**Size selector (line 85-139).** Renders dropdown with PAGE_SIZES options. On change (line 139): `pageSize = (val === 'All') ? 'All' : parseInt(val, 10)`. Resets current page.

**`data-paginated` guard (line 164).** Idempotent — marks already-paginated wrappers to avoid double-init.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | — | **No interaction with `table-filters.js`.** If a table is BOTH `data-paginate` AND `data-filterable`, filtering hides rows but pagination counts ALL rows (hidden + visible). Page count may say "Page 1 of 5" while visible rows are on page 3's scope. Known cross-cutting concern — worth verifying. |
| 2 | **M** | 20-80 | **Row visibility uses inline style** — fights with other scripts that may set style on rows. |
| 3 | **L** | — | **No keyboard navigation** — prev/next buttons only, no arrow keys. |
| 4 | **L** | 162-165 | **Re-init not supported** — once paginated, can't re-run with different config without removing `data-paginated` attribute manually. |

## 4. Integration map

**Called by:** data-loader.js boot → `TPPC.pagination.init()`.

**Target:** `[data-paginate]` wrappers (mainly backlinks table, maybe top wasted queries, etc.).

## 5. Fix / improve suggestions

1. **Coordinate with table-filters.js** (bug #1) — filter should trigger pagination recount.
2. **Keyboard nav** (bug #3).
3. **Support re-init** if page re-renders the table (bug #4).
