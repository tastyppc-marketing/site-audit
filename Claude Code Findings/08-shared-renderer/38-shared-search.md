# Deep Dive #38 — `template/reports/multipage/shared/search.js`

**File:** [`template/reports/multipage/shared/search.js`](/root/site-audit/template/reports/multipage/shared/search.js) (197 lines)
**Layer:** 08 — shared renderer (modal search across report)
**Date:** 2026-04-20

---

## 1. Purpose

In-report modal search. Keyboard-activatable (likely `/` or `Ctrl+K`), searches across the pre-built `window.TPPC.searchIndex` — which is populated by `generate-multipage-report.js`'s `buildSearchIndex` (finding #21 lines 195-469).

Features:
- Modal overlay with search input.
- Live-search results.
- Keyboard navigation (arrow keys + enter).
- Result items link to the specific page + section anchor.

## 2. Key architecture

**`_handleInput(query)` (line 96).** Reads `window.TPPC.searchIndex` (array of `{page, section, title, snippet, terms}` objects built by the generator). Filters by substring match across all fields.

**`_renderResults` (line 129).** Renders matched entries with page + section metadata. HTML-escape is applied via the `esc` utility from utils.js.

**`_moveFocus` / `_selectFocused` (line 164, 183).** Keyboard navigation.

**Global key binding (line 71).** Likely registers the activation shortcut globally.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | 98 | **Linear search** — iterates `searchIndex` array on every keystroke. For 5000+ entry indices (not typical today, but possible), UI lag. Fine at current scale; flag for later. |
| 2 | **M** | — | **No fuzzy matching** — substring only. User typing "keyword" misses "keywrod" typos in data. Not critical for this use case. |
| 3 | **L** | — | **No search result ranking by relevance** — first-match-wins. A term in a section title should outrank a term in snippet. |
| 4 | **L** | — | **Search results cross-page** but require navigating to the destination page, losing search context. No "preview in modal" feature. |

## 4. Integration map

**Consumed by:** data-loader.js boot → `TPPC.search.init()`.

**Reads:** `window.TPPC.searchIndex` (built by generator).

## 5. Fix / improve suggestions

1. **Rank results by relevance** (bug #3) — title matches > snippet matches > term matches.
2. **Debounce input** for very large indices.
3. **Fuzzy matching** via Fuse.js or similar (bug #2) — adds a dep but significant UX win.
