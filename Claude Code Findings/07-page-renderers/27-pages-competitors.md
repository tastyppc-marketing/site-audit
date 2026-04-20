# Deep Dive #27 — `template/reports/multipage/pages/competitors.js`

**File:** [`template/reports/multipage/pages/competitors.js`](/root/site-audit/template/reports/multipage/pages/competitors.js) (612 lines)
**Layer:** 07 — page renderer (Competitors page — gap analysis + strategies)
**Cross-reference:** [`codex findings/06-page-renderers/40-competitors_page.md`](/root/site-audit/codex findings/06-page-renderers/40-competitors_page.md)
**Template-vs-client drift:** laura-willis 612 lines (identical).
**Date:** 2026-04-20

---

## 1. Purpose

Renders the Competitors page. Main sections:
1. **Comparison Table** (line 157) — metric × competitor grid, dynamic columns.
2. **Radar Chart** (line 200) — multi-competitor metric visualization.
3. **Competitor Strategies** (line 423) — "standout approach" detail per competitor.
4. **Domain Metrics** (line 447) — DR/RD/backlinks comparison.
5. **PageSpeed Comparison** (line 524) — per-domain mobile/desktop scores.

## 2. Inputs

- `data.competitorComparison[].{metric, client, comp1..compN, gap}` — populated by `populate-audit-data.js` (finding #15).
- `data.siteComparison[]` — derived from competitorComparison (finding #15 parseSiteComparison).
- `data.competitor.{primary, primaryLabel, all[].{name, domain}}`.
- `data.competitorStrategies[]` — finding #15 parseCompetitorStrategies.
- `data.domainMetrics.{client, competitors[]}` — finding #8's gather-domain-metrics output.
- `data.pageSpeedComparison[]` — finding #7 gather-pagespeed output.

## 3. Key sections

**`renderComparisonTable` (line 157). DYNAMIC — does NOT have #17/#18 competitor-column bug.**
- Line 167: `getCompetitorColumnKeys(rows)` detects `compN` keys dynamically from first row.
- Line 169-172: headers iterate those keys using `getCompetitorLabel(data, index)` to map index → actual competitor name.
- Line 188-190: row cells iterate `competitorKeys` — renders as many columns as the data has.

**This renderer correctly scales to 3, 5, or 10 competitors — unlike `generate-spreadsheet.js` (#17) and `generate-presentation.js` (#18) which hardcode comp1/comp2.** Fix for the XLSX/PPTX bugs should LOOK at this implementation as the reference.

**`renderRadarChart` (line 200).** Reads `data.siteComparison` (the derived aggregate). HANDOFF.md:20 noted a previous radar-chart bug — "client dot invisible" — fixed by switching to multi-competitor log-scale bar chart for the Competitors page. Worth checking whether radar is still used or replaced.

**`renderStrategies` (line 423).** Reads `data.competitorStrategies[].{competitor, strategy, detail}`. Finding #15's parseCompetitorStrategies is the upstream. **Matt has NO competitorStrategies** (audit-log showed 3 fields populated — strategies NOT mentioned → likely failed to parse from `## Competitor N:` MD heading pattern — finding #15 bug #7).

**`renderDomainMetrics` (line 447).** Reads `data.domainMetrics.{client, competitors}`. **Downstream of finding #8 #3 (DFS rank vs Ahrefs DR scale mismatch).** DR values displayed on scale 0-1000 but labeled as "Domain Rating."

**`renderPageSpeedComparison` (line 524).** Reads `data.pageSpeedComparison`. HANDOFF auto-fix #3 (stale-data detection). **For Matt, the stale-detector should have prevented copy-pasted scores, but verify one row per competitor.**

## 4. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Matt's competitor strategies section is likely empty.** Finding #15 bug #7 predicts that his `competitor-analysis.md` headings don't match the `## Competitor N:` regex exactly. Visible as empty section on Matt's report. |
| 2 | **H** | 447-523 | **Domain Metrics shows DFS rank on 0-1000 scale labeled as "Domain Rating"** (finding #8 #3). Shorewest 356, Matt 37 — client can't interpret without scale context. |
| 3 | **M** | 200-422 | **Radar chart may still be present** despite HANDOFF.md noting a fix. Need to verify line-by-line whether renderRadarChart is disabled OR supplanted by a bar chart (HANDOFF #20). |
| 4 | **M** | 188 | **Fallback value on missing comp data is `''`** (empty string) via `row[key]`. A missing cell renders blank. A "—" placeholder would signal "no data" more clearly. |
| 5 | **M** | — | **Competitor-column order** is determined by `compN` numeric sort — which is whatever order populate-audit-data.js put them in (finding #15). If that order doesn't match the order client expects (e.g., alphabetical or by market share), no way to reorder in the report. |
| 6 | **L** | — | **No per-competitor deep-dive** — each competitor is just a column. A clickable drill-down per competitor would reveal more. Product gap, not bug. |

## 5. Integration map

**Data chain:** 4 upstream producers converge here:
- `populate-audit-data.js` → `competitorComparison[]`, `competitorStrategies[]`, `siteComparison[]`.
- `gather-domain-metrics.js` → `domain-metrics.json` → normalizer → `domainMetrics`.
- `gather-pagespeed.js` → `pagespeed-data.json` → normalizer → `pageSpeedComparison`.
- `gather-organic-metrics.js` → `organic-metrics.json` → normalizer fills domainMetrics.organic* fields.

This page is the single-best test case for "did populate-audit-data run cleanly?" — if competitorComparison has 5 rows with proper comp1-comp5 data, the parsing worked.

## 6. Fix / improve suggestions

1. **Use this renderer's comp-key pattern as the reference for #17/#18 fix.** One-for-one port.
2. **Verify Matt's competitorStrategies** — if empty, fix #15 bug #7 (heading tolerance).
3. **Scale-normalize DR** (finding #8 #3) or add tooltip with scale context.
4. **Replace empty strings with "—"** for missing comp cells.

## 7. What to verify before we touch this file

- **Open Matt's Competitors page** — does the comparison table show 5 competitor columns (redman, eliason, pinepoint, northwoods, shorewest)? Do any cells contain empty values?
- **Verify competitor strategies section** has entries for each of his 5 competitors or is empty.
- **Check radar chart presence/absence** vs HANDOFF.md's note that it was replaced.
