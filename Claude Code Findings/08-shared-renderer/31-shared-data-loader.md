# Deep Dive #31 — `template/reports/multipage/shared/data-loader.js`

**File:** [`template/reports/multipage/shared/data-loader.js`](/root/site-audit/template/reports/multipage/shared/data-loader.js) (120 lines)
**Layer:** 08 — shared renderer (namespace + boot orchestrator)
**Date:** 2026-04-20

---

## 1. Purpose

The **boot orchestrator** for every page. Three responsibilities:

1. **Initialize `window.TPPC` namespace** (lines 10-11).
2. **Validate `window.AUDIT_DATA`** (line 14-28) — if missing, attempt to load `shared/debug-data.js` fallback; else render error page.
3. **Expose `window.TPPC.boot()`** (lines 39-81) — the function each page's renderer calls to initialize shared components (nav, search, print, explainer) and the page-specific renderer.

Also registers a delegated click handler for `[data-expand]` elements (lines 109-118) — the "+N more" expand/collapse affordance used across content/backlinks tables.

## 2. Key logic

**Boot sequence (line 39-81):** on each page, the page-specific JS file (e.g., `pages/index.js`) polls for `window.TPPC.boot` availability (finding #22 `_bootWhenReady`). When found, the page calls `boot()` which:
1. Initializes `nav`, `search`, `print`, `explainer` shared components (if each has an `init` function).
2. Calls the page-specific renderer's `init(window.TPPC.data)`.
3. Initializes collapsibles + responsive tables + table pagination.

**Fallback dev mode (line 14-28):** if run from `file://` without injected data, tries to load `shared/debug-data.js`. The error message at line 100-104 is user-friendly.

**_booted flag (line 40-41):** prevents double-boot if the page polls and finds `boot` available just as the auto-boot timer fires (line 85-88).

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | 85-88 | **Auto-boot setTimeout(50ms)** after async debug-data.js load + page's own poll (finding #22 `_bootWhenReady` at 25ms interval) → race condition potential. `_booted` guard prevents double-init but the timing feels fragile. Worth consolidating: let pages register themselves via a callback, and boot calls them once ready. |
| 2 | **M** | 42 | **`window.TPPC.currentPage`** is set by each page's IIFE at load time. If a new page is added without setting currentPage, boot silently skips page init. No validation that currentPage refers to a known page. |
| 3 | **L** | 60-64 | **Page renderer error is caught and console.error'd** — but the user sees an empty page. A visible fallback banner ("Renderer error — check console") would improve UX. |
| 4 | **L** | 109-118 | **Event delegation** uses `closest('[data-expand]')` — good. But no validation that `target` (line 112) exists — a `[data-expand]` button without a next sibling no-ops silently. |
| 5 | **L** | 17 | **`fallback.src = 'shared/debug-data.js'`** — CWD-relative. Works when the report bundle is served, but is brittle across path variations. |
| 6 | **L** | 35 | **`window.SEARCH_INDEX || []`** fallback — good. But a missing search index silently produces empty search results with no warning to dev. |

## 4. Integration map

**Consumed by:** every page via `window.TPPC.boot` lookup. Each `pages/<name>.js` polls for it.

**Reads:**
- `window.AUDIT_DATA` (from generator placeholder replacement).
- `window.SEARCH_INDEX` (ditto).
- `window.TPPC.currentPage` (set by each page).
- `window.TPPC.{nav, search, print, explainer, utils, pagination, pages}` — shared modules.

**Invokes:** 7 shared init methods + 1 page init method.

## 5. Fix / improve suggestions

1. **Consolidate race conditions** — have pages register via `TPPC.registerPage(name, init)` instead of polling.
2. **Validate `currentPage`** is one of the known pages; warn if mismatch.
3. **Add visible error state** when page renderer throws (bug #3).

## 6. Drift

Not diff-verified across clients, but presumably all copies match template given small size.
