# Deep Dive #37 — `template/reports/multipage/shared/explainer.js`

**File:** [`template/reports/multipage/shared/explainer.js`](/root/site-audit/template/reports/multipage/shared/explainer.js) (421 lines)
**Layer:** 08 — shared renderer (floating "What does this mean?" context widget)
**Date:** 2026-04-20

---

## 1. Purpose

Renders a floating explainer card that updates based on the user's current scroll section. Each section has an associated explainer (title + text) that the widget displays; as the user scrolls, the widget's content changes to match the section in view.

**HANDOFF.md:147, 25** — "Explainer widget and nav: unreliable section tracking" was a previous bug, fixed by switching to topmost-visible-section algorithm. Per HANDOFF.md: "Both `nav.js` and `explainer.js` use this pattern."

## 2. Key architecture

**Per-section explainer content.** Likely hardcoded in a config object (not verified to line 265) — 40+ sections × title + text pairs.

**Widget rendering (`_createWidget`, line 273).** Builds floating card with toggle button + body. Shows "What does this mean?" label.

**Scrollspy integration (around lines 100-260).** Shares the topmost-visible-section pattern with nav.js (#32). Listens to scroll + IntersectionObserver to determine which section is active, updates widget content accordingly.

**Minimize/expand state.** User can collapse to just the label.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | — | **Duplicated scrollspy logic with nav.js.** Both files implement topmost-visible-section independently (HANDOFF says "both use this pattern"). Two places to get out of sync. Should share a common scrollspy helper. |
| 2 | **M** | — | **Explainer content is hardcoded.** Changes require editing this file. Not config-driven or data-driven. For a ~400-line file, this is the bulk. |
| 3 | **M** | — | **No content for sections added by a new page renderer.** If a page renderer adds `#section-new-thing`, explainer has no content → empty card shown when scrolled there. |
| 4 | **L** | — | **Widget floating position** — likely fixed bottom-right. Mobile layout not verified. |

## 4. Integration map

**Consumed by:** data-loader.js boot → `TPPC.explainer.init()`.

**Reads:** Section IDs from DOM; internal hardcoded explainer content map.

## 5. Fix / improve suggestions

1. **Share scrollspy with nav.js** (bug #1) — extract common helper.
2. **Externalize explainer content** to a JSON file loaded at init, or inline into page HTML via data attributes. Makes editing easier for content authors.
3. **Fallback content** for unknown sections (bug #3) — "Learn more about this section on our knowledge base."
