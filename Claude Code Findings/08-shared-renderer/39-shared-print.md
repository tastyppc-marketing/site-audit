# Deep Dive #39 — `template/reports/multipage/shared/print.js`

**File:** [`template/reports/multipage/shared/print.js`](/root/site-audit/template/reports/multipage/shared/print.js) (59 lines)
**Layer:** 08 — shared renderer (print/PDF preparation)
**Date:** 2026-04-20

---

## 1. Purpose

Expands collapsibles, shows all tab panels, un-hides paginated rows, and hides filter/pagination UI before the user invokes browser print → so the PDF captures ALL content instead of just the visible-on-screen subset.

Registered via `window.addEventListener('beforeprint', preparePDF)` (line 11).

## 2. Key logic

**`preparePDF` (line 18-52).** Four DOM mutation passes:
1. Open all collapsibles.
2. Show all tab panels.
3. Show all paginated/filtered table rows.
4. Hide filter bars + pagination controls.

**Selectors used:** `.collapsible-header`, `[role="tabpanel"]`, `[role="tab"]`, `tbody tr`, `#opp-pagination`, `#opp-filter-bar`, `.comp-page-btn`, `.matrix-page-btn`.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | 49 | **Hardcoded element IDs/classes** (`#opp-pagination`, `#opp-filter-bar`, etc.). If a new page adds its own pagination control, it won't be hidden during print. Not elegant. Consider a generic class like `.no-print-ui`. |
| 2 | **M** | — | **No `afterprint` restore.** The script mutates DOM state and never reverts — after print, collapsibles remain open, tabs all visible. For users who then return to browsing, UI is in an altered state. |
| 3 | **L** | 44-46 | **Inline `row.style.display = ''`** blindly un-hides ALL rows — including rows that were legitimately hidden by other logic (e.g., "duplicate of" collapse). Overbroad. |
| 4 | **L** | — | **Browsers differ** on `beforeprint` timing — Safari vs Chrome may render differently. No polyfill. |

## 4. Integration map

**Consumed by:** data-loader.js boot → `TPPC.print.init()`.

**Event:** `beforeprint` window event.

## 5. Fix / improve suggestions

1. **Add `afterprint` restore** (bug #2). Save state before mutation, restore after.
2. **Use a generic `.no-print-ui` class** instead of hardcoded IDs (bug #1).
3. **Respect legitimately hidden rows** (bug #3) — track which rows `preparePDF` itself hid vs which were pre-hidden.
