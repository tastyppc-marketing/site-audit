# Deep Dive #35 — `template/reports/multipage/shared/table-filters.js`

**File:** [`template/reports/multipage/shared/table-filters.js`](/root/site-audit/template/reports/multipage/shared/table-filters.js) (374 lines)
**Layer:** 08 — shared renderer (declarative table filtering)
**Date:** 2026-04-20

---

## 1. Purpose

Declarative row-filter library. Usage: wrap any `.report-table` in `<div data-filterable>`, optionally add `data-filters='[{col, label, type, options}]'` JSON for per-column dropdowns.

Provides:
- Text search across all cells.
- Per-column dropdown filters (badge-type, unique-value, or explicit options).
- Numeric range filters.
- Row count display.

## 2. Key architecture

**Declarative contract (line 6-15 comment).** HTML opts in via `data-filterable` attribute — no JS code required in page renderers. This is why the HANDOFF.md auto-fix #12 is "New `table-filters.js` — text search, badge/unique/range dropdowns."

**Filter parsing (line 167).** Reads `data-filters` as JSON. If malformed JSON → silent `try/catch` likely (not verified); one typo breaks filtering for that table.

**Three filter discovery modes:**
- `discoverBadgeOptions` (line 72) — scans column for span-like badge values.
- `discoverUniqueValues` (line 92) — scans for distinct cell texts.
- Explicit `options: [...]` in data-filters JSON.

**`applyFilters` (line 252).** Reruns every filter (search + dropdowns + range) in combination. Updates row visibility via CSS.

**Public `init()` (line 354).** Called by data-loader.js boot. Walks `[data-filterable]` elements and attaches filter UI.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | 167 | **`data-filters` JSON parse** — if malformed, filtering silently disabled. HANDOFF warned: embedded JSON attribute is fragile. Worth parsing with fallback + console.warn. |
| 2 | **M** | — | **Per-page filter definitions** are inline JSON in renderer output. Changing filter options requires editing the renderer file. Not config-driven. |
| 3 | **L** | 125 | **`getFilterableRows` excludes certain rows** (likely header + separator). Not fully verified without reading lines 125-140. |
| 4 | **L** | 333-336 | **Event listener `input` + `change`** — re-applies filters on every keystroke. For 200-row tables, could noticeably lag. Debounce would help. |
| 5 | **L** | 72-107 | **Discovery modes operate on the initial DOM.** If page renderer re-renders the table dynamically (e.g., expand "+N more"), badge/unique options are stale. |

## 4. Integration map

**Consumed by:** pages that use `data-filterable` attribute. Notable: `pages/keywords.js:68` has an inline `data-filters='[...]'` for the rankings table.

**Called by:** data-loader.js boot → `TPPC.filters.init()`.

## 5. Fix / improve suggestions

1. **JSON parse error surface** (bug #1) — log warning, fall back to search-only.
2. **Debounce input handlers** (bug #4).
3. **MutationObserver for dynamic tables** (bug #5) to refresh discovery.
