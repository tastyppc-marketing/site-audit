# Deep Dive #33 — `template/reports/multipage/shared/charts.js`

**File:** [`template/reports/multipage/shared/charts.js`](/root/site-audit/template/reports/multipage/shared/charts.js) (305 lines)
**Layer:** 08 — shared renderer (Chart.js factory)
**Date:** 2026-04-20

---

## 1. Purpose

Thin wrapper over Chart.js. Exposes:
- `createBarChart(canvasId, config)` — generic bar (horizontal/vertical).
- `createDoughnutChart(canvasId, config)` — pie/donut.
- `createRadarChart(canvasId, config)` — multi-axis comparison.
- `createRankLineChart(canvasId, config)` — time-series for rank history.
- `renderCWVGauges(containerId, cwvData)` — SVG-rendered gauges for Core Web Vitals.

Also exposes a shared `COLORS` palette (line 14) used across all pages.

## 2. Key observations

**Chart.js dependency** (line 4 comment): must be loaded BEFORE this file. If missing, every `new Chart(...)` call at lines 59, 90, 129, 223 throws `ReferenceError: Chart is not defined`. No guard.

**COLORS.set** (line 14+): default palette. Iterates `[i % COLORS.set.length]` to cycle.

**CSS `max-height` chart-fight** (HANDOFF.md:146): "CSS `max-height` on chart containers will silently cap Chart.js canvases — use the `chart-tall` class to override." This is a documented cross-file concern between this factory and `report-styles.css`.

**Log scale for competitor comparisons** (HANDOFF.md:20, 148): "Competitor charts use log scale because the gap between a new site and an established competitor can be 100x+. Linear scale makes the smaller site invisible." Worth verifying that `createBarChart` callers pass log-scale option where appropriate.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | — | **No Chart.js existence guard.** If the inlined JS or CDN fails, page crashes. `if (typeof Chart === 'undefined') return` at each factory start would degrade gracefully. |
| 2 | **M** | 176-216 | **`renderCWVGauges` mixes SVG string building.** Not using Chart.js — custom SVG. If dev expects "all charts use Chart.js" — surprise. |
| 3 | **L** | 14 | **COLORS palette is hardcoded.** Client brand colors can't override without editing this file. |
| 4 | **L** | 59-76 | **`createBarChart` defaults don't apply log-scale** — callers must explicitly opt in. `pages/competitors.js` may forget. |

## 4. Integration map

**Consumed by:** pages/keywords.js, pages/technical.js, pages/competitors.js, pages/links.js, pages/local.js — anywhere a chart appears.

**Requires:** Chart.js global (inlined at generate-multipage-report.js time).

## 5. Fix / improve suggestions

1. **Add Chart.js existence guard** in each factory (bug #1).
2. **Document log-scale option usage** in code comments — callers need explicit awareness.
3. **Extract COLORS to a theme config** that can be overridden per client.
