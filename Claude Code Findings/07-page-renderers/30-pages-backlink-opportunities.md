# Deep Dive #30 — `template/reports/multipage/pages/backlink-opportunities.js`

**File:** [`template/reports/multipage/pages/backlink-opportunities.js`](/root/site-audit/template/reports/multipage/pages/backlink-opportunities.js) (**2189 lines — largest renderer by far**)
**Layer:** 07 — page renderer (Backlink Opportunities page — gap analysis + link-building targets)
**Cross-reference:** [`codex findings/06-page-renderers/58-backlink_opportunities_page.md`](/root/site-audit/codex findings/06-page-renderers/58-backlink_opportunities_page.md)
**Template-vs-client drift:** **laura-willis 2045 lines (144 behind — missing spam-analysis integration).** Matt + Liane not diff-verified.
**Date:** 2026-04-20

---

## 1. Purpose

The most complex report page — link-building opportunities analysis. 15+ render sections covering:
1. **Backlink Profile** — client's existing backlinks grouped by domain.
2. **Spam Analysis** — legit vs spam domain breakdown (from `analyze-backlink-quality.js`).
3. **Insights** — narrative analysis of link-building gaps.
4. **Summary** — opportunity counts.
5. **RD Chart** — referring-domains distribution.
6. **Top Opportunities** — top 10 gap domains.
7. **Pair Detail** — compare 2 competitors' backlink overlap.
8. **Intelligence** — sorted opportunity pairs.
9. **Local Opportunities** — location-specific link targets.
10. **Dofollow Card** — dofollow/nofollow ratio per domain.
11. **Type Chart** — link type distribution.
12. **DR Distribution Chart** — domain rating histogram.
13. **Velocity Chart** — link growth over time.
14. **Details** — per-opportunity drill-down.
15. **Filter Bar** — multi-facet filtering.
16. **Opportunities View / Competitor View / Matrix View** — 3 alternate display modes.

## 2. Inputs

- `data.backlinkOpportunities.*` or similar (line 151: `_bo.opportunities`).
- `data.backlinks.{clientBacklinks, qualitySummary, spam}` — from `gather-backlinks.js` + `analyze-backlink-quality.js` enrichment (finding #14).
- Competitor data across all `backlinks-*.json` files.
- Per-opportunity fields: `{domain, score, clientHas, overlap, localRelevance, dr, etc.}`.

## 3. Key sections / bugs

**`MOCK_OPPORTUNITIES` variable name (line 151).** Misnamed — it's real data mapped from `_bo.opportunities`. "MOCK_" prefix suggests development placeholder that was never renamed. Cosmetic confusion risk.

**`renderSpamAnalysis` (line 351).** Reads `data.backlinks.qualitySummary` + nested spam/legit domain lists. **Downstream of finding #14 orphan-script bug** — only Liane has this data. For Matt + 7 other clients, this section renders empty or with "no quality analysis available."

**`renderTopOpportunities` (line 801-805).** `top10 = MOCK_OPPORTUNITIES.slice().sort(by score).slice(0, 10)` — hardcoded 10 opportunities shown. No "show more."

**`renderPairDetail` (line 935+).** Compares 2 competitors. `shared.slice(0, 5)` (line 1007) caps shared-opportunity display at 5.

**`renderIntelligence` (line 1032).** `top3 = sortedPairs.slice(0, 3)` (line 1126) — only top 3 competitor-pairs shown.

**`renderLocalOppsPage` (line 1282).** Local-specific opportunities. Filters by `localRelevance === 'local'` (line 168).

**`renderDRDistributionChart` (line 1424).** DR histogram. Uses `entry.dr` — **subject to finding #8 bug #3** (DFS rank 0-1000 vs Ahrefs DR 0-100). Histogram buckets may be wrong scale.

**Three view modes (lines 1767, 1824, 1897):** Opportunities / Competitor / Matrix. Matrix view enables interactive cell selection. Adds significant UX surface.

## 4. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 351-458 | **Spam Analysis downstream of finding #14** (orphan script). Matt + 6 other clients have no `qualitySummary` data. This entire section renders empty for them. Wiring #14 into skill (finding #14 #7.1) unblocks the section. |
| 2 | **H** | — | **laura-willis 144-line drift** — missing spam-analysis integration (lines 236-251+). Her report's Backlink Opportunities page lacks features template has. Pattern consistent with other drifted renderers. |
| 3 | **H** | 1424-1468 | **DR Distribution uses DFS rank scale** (finding #8 #3). Histogram buckets likely wrong for DFS-sourced data — "100" means different things on different scales. |
| 4 | **M** | 151 | **`MOCK_OPPORTUNITIES` variable name** misleads maintainers — looks like placeholder data. Real data under a dev name. Cosmetic bug. |
| 5 | **M** | 805, 1007, 1126 | **Multiple hardcoded slice limits** (top 10 / 5 shared / top 3 pairs). No pagination or "show more." For large backlink profiles, significant data hidden. |
| 6 | **M** | 168 | **Local filter is binary `localRelevance === 'local'`.** No scoring — a domain that's tangentially local vs strongly local gets the same treatment. |
| 7 | **M** | 1767-1949 | **3 view modes increase maintenance cost.** Each has its own render + filter logic. Refactoring risk. |
| 8 | **L** | 328 | **"N backlinks shown (of M total)"** messaging — good. But "M" uses `CLIENT.backlinks` which per finding #9 bug #2 is fetched-count, not true total. |
| 9 | **L** | — | **No opportunity-exports** — can't dump top opportunities to CSV for outreach. Workflow gap for the client's implementation team. |

## 5. Integration map

**Data chain:**
- `gather-backlinks.js` → `client-backlinks.json` + `backlinks-*.json` → normalizer section 1571-1720 → `data.backlinks`.
- `analyze-backlink-quality.js` (ORPHAN — finding #14) → in-place enrichment → `data.backlinks.qualitySummary` (only Liane).
- **No separate `data.backlinkOpportunities` producer script** — this field is populated by the normalizer or agent during Phase 3. Worth tracing in deep-dive #21's per-section pass.

## 6. Fix / improve suggestions

1. **Wire `analyze-backlink-quality.js` into the skill** (finding #14 #1) — unblocks spam analysis section for 7 clients.
2. **Re-template laura's copy** to restore spam-analysis integration.
3. **Scale-normalize `dr` everywhere** (#8 #3) — DR Distribution Chart depends on this.
4. **Rename `MOCK_OPPORTUNITIES`** — cosmetic but maintainability.
5. **Add "show more" pagination** to the capped slices.
6. **CSV export** of top N opportunities.

## 7. What to verify before we touch this file

- **Open Matt's Backlink Opportunities page** — are top opportunities showing? Is spam analysis empty? Is DR distribution plotting on a sensible x-axis?
- **Diff Laura's copy vs template** to identify exactly which features she's missing (144 lines is significant).
- **Trace `data.backlinkOpportunities`** producer — agent or normalizer?

---

## Cluster wrap — Page Renderers (findings #22-#30)

**Pattern summary:**
- 9 pages, mostly consistent IIFE + `window.TPPC.pages.<name>.init(data)` pattern.
- Shared utilities: `window.TPPC.utils` (esc, rankClass, severityClass, gradeClass, renderApiErrorBanner, getApiErrors).
- Shared chart lib: `window.TPPC.charts`.
- Boot: `shared/data-loader.js`.
- Filters: `shared/table-filters.js`.

**Drift cohort on pages:**
- `matt-wallmow, laura-willis, liane-jamason` have local pages/ copies.
- Other 5 clients use template directly.
- Laura's pages total 7196 (template 7375) — 179 lines behind, mainly in `content.js` (-35) and `backlink-opportunities.js` (-144).

**Fix priorities emerging from page cluster:**
1. Most page bugs are DOWNSTREAM of gather/normalizer bugs. Fix those first.
2. #27 competitors.js is the reference implementation for dynamic competitor columns.
3. Laura's 3-client cohort pages should be re-templated in the same PR as gather scripts.
4. Shared renderers (#31-#39) are next — they drive many of the UI behaviors referenced here.
