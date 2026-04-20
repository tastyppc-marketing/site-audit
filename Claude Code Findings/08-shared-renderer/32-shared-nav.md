# Deep Dive #32 — `template/reports/multipage/shared/nav.js`

**File:** [`template/reports/multipage/shared/nav.js`](/root/site-audit/template/reports/multipage/shared/nav.js) (348 lines)
**Layer:** 08 — shared renderer (top nav + side nav + scrollspy)
**Date:** 2026-04-20

---

## 1. Purpose

Renders the top navigation bar, side navigation (TOC-style per page), mobile drawer, and manages the scrollspy that highlights the current section as the user scrolls.

## 2. Key architecture

**`NAV_CONFIG` (lines 20+).** Per-page section list hardcoded. 9 pages × ~6-8 sections each = ~60 section IDs. Each entry `{id: "section-X", title: "Label"}`. Links page scrollspy + TOC anchor to these IDs.

**Scrollspy (lines 283-348).** Uses `IntersectionObserver` + a throttled scroll listener. **HANDOFF.md:147 explicitly notes:** "Scrollspy uses topmost-visible-section, not last-intersecting" — this is the non-obvious algorithm that prevents the last-in-view element from winning during fast scroll or anchor-link clicks.

- `activateTopmost()` (line 299) determines which section is at the top of the viewport — NOT the last-intersecting — more reliable during programmatic scroll/anchor navigation.
- Observer iterates entries but uses its own `activateTopmost()` logic rather than trusting which section fired the callback.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 20+ | **`NAV_CONFIG` is hardcoded.** If a page adds/removes a section ID, nav won't link to it. Maintenance burden when page renderers change. Consider reading from a per-page data-attribute or config JSON. |
| 2 | **M** | 284 | **Missing IntersectionObserver polyfill fallback.** `if (!('IntersectionObserver' in window)) return` — silent no-op on IE11 / old browsers. Modern browsers fine. |
| 3 | **M** | 223 | **Section-label mismatch risk.** `pageConfig.sections.forEach` renders nav using `NAV_CONFIG`, not what's actually in the DOM. If a page renderer hid a section via `_hideSection(id)` (e.g., empty data), the nav still shows the link — user clicks, scrolls to empty/hidden section. |
| 4 | **L** | 333+ | **Throttled scroll listener** — coordination with IntersectionObserver. Good belt-and-braces. |
| 5 | **L** | — | **No active-page highlight on top nav** for current page — (not fully verified, but standard UX expectation). |

## 4. Integration map

**Consumed by:** data-loader.js `boot()` calls `window.TPPC.nav.init()`.

**Reads:** `window.TPPC.currentPage`, NAV_CONFIG (hardcoded).

**Modifies:** Injects nav HTML into `#top-nav`, `#side-nav`, `#mobile-drawer` elements.

## 5. Fix / improve suggestions

1. **Read nav config from per-page data-attributes** (bug #1) — pages declare their sections, nav assembles dynamically.
2. **Coordinate with page renderers on hidden sections** (bug #3) — nav should hide the link when the section is hidden.
3. **Document the topmost-visible-section algorithm** in code comments — it's referenced by HANDOFF but not explained inline.
