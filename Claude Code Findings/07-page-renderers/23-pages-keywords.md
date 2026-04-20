# Deep Dive #23 — `template/reports/multipage/pages/keywords.js`

**File:** [`template/reports/multipage/pages/keywords.js`](/root/site-audit/template/reports/multipage/pages/keywords.js) (722 lines)
**Layer:** 07 — page renderer (Keywords page — the 2nd most consulted page by clients)
**Cross-reference:** [`codex findings/06-page-renderers/36-keywords_page.md`](/root/site-audit/codex findings/06-page-renderers/36-keywords_page.md)
**Template-vs-client drift:** laura-willis is 722 lines (identical to template). Matt + Liane not diff-verified but same line count pattern as finding #22.
**Date:** 2026-04-20

---

## 1. Purpose

Renders the Keywords page — the client's search visibility snapshot. 6 sections:
1. **Keyword Rankings Table** — tracked keywords + client rank + competitor rank + top organic result, with row-level filters.
2. **Volume Chart** — bar chart of top 15 keywords by volume, colored by rank class.
3. **Organic Overview** — DR/RD/backlinks card (from domainMetrics).
4. **Search Console** — GSC clicks/impressions/CTR/position (if available).
5. **Traffic Overview** — traffic source breakdown.
6. **Rank History** — time-series ranks for top 6 keywords (if available).

## 2. Inputs

Reads from `window.AUDIT_DATA`:
- `keywords[].{keyword, volume, clientRank, competitorRank, topResult, difficulty, cpc}` — gather-keyword-volumes.js (finding #11) + populate-audit-data.js (finding #15).
- `backlinks.domainMetrics` OR `domainMetrics.client` — finding #8's dual-path.
- `searchConsole.*` — GSC integration (not covered by any gather script).
- `traffic.*` — traffic source breakdown (likely agent-authored).
- `rankHistory.*` — time-series data (ghost field — no producer).

Imports shared utilities: `window.TPPC.utils.{esc, rankClass, getApiErrors, renderApiErrorBanner}`, `window.TPPC.charts.{createBarChart}`, `window.TPPC.filters.init()`.

## 3. Key sections

**`renderKeywordTable` (lines 30-101).** 
- Count stats: `top10`, `top30`, `missed` computed by parsing `clientRank` (line 47-59).
- Uses `data-filterable` + `data-filters` JSON for row filtering — column filters for "Your Rank" (Not found / Top 3 / Top 10 / 11-20 / 21+) and "Intent" (badge-typed).
- Per-row inline metadata shows `difficulty (D: ...)` and `cpc ($...)` if present.

**`renderVolumeChart` (lines 103-156).**
- **Line 124: `chartData = chartData.slice(0, 15)` — hardcoded 15-keyword cap.** 25-keyword audit shows 15; 100-keyword audit shows 15. Silent truncation. Codex consistent.
- `parseNumber(volume)` filters zero/negative volumes — qualitative volumes ("High", "Medium") skipped silently. **If all 25 keywords are qualitative, empty chart with the "no numeric search volume data" message** — which is what Matt would see if his `volume` strings include textual.
- Bar colors: green (good rank) / orange (mid) / red (bad).

**`renderOrganicOverview` (lines 158-206).**
- **Line 160: dual-path fallback** — prefers `data.backlinks.domainMetrics`, falls back to `data.domainMetrics.client`. Matches finding #8 contract.
- Lines 180-191: 4 stat cards (organicKeywords, organicTraffic, trafficValue, referringDomains).
- **`metrics.organicTraffic` presented as authoritative** — but per finding #10 bug #2, it's actually top-100-sum, not total. Client sees "Estimated organic traffic: 22,733" for shorewest.com and interprets as total — it's actually top 100.
- Lines 167-170: API error banner path via `window.TPPC.utils.renderApiErrorBanner` if `domain-metrics.json` had errors.

**`renderSearchConsole` (lines 210-288).** GSC integration. Not verified (didn't read full range). Likely reads `data.searchConsole.*`.

**`renderTrafficOverview` (lines 289-395).** Traffic source breakdown. Likely reads `data.traffic.*`.

**`renderRankHistory` (lines 519-670).**
- Line 523: `data.rankHistory` — ghost field.
- Lines 616, 623, 664: `sorted.slice(0, 6)` — top 6 keywords shown with rank history chart. Hardcoded count.

## 4. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 160, 181-191 | **Displays `organicTraffic` as total but it's top-100-capped (finding #10 #2).** This page is where clients SEE the misleading number. The fix (finding #10 #7.2) is at the gather level; this page would need coordinated update if the field is renamed. |
| 2 | **M** | 124 | **Volume chart hardcoded `slice(0, 15)`.** Cuts 25-keyword audits to 15. Codex flagged similar. |
| 3 | **M** | 115 | **`parseNumber` silently drops qualitative volumes.** Keywords with "High"/"Medium"/"Low" volume are omitted. The empty-state message notes this ("Search volumes are qualitative only") — reasonable UX, but means the chart is silent on real data gaps. |
| 4 | **M** | 523, 616, 623, 664 | **`rankHistory` ghost field + hardcoded "top 6" slice.** No gather script produces `rankHistory` — it's agent or manual data. If missing, section hidden. If present, only first 6 keywords shown. |
| 5 | **M** | 160 | **Dual-path fallback masks data-source confusion.** `backlinks.domainMetrics` vs `domainMetrics.client` — two possible sources. Downstream doesn't know which was used. Worth adding a `source` marker. |
| 6 | **L** | — | **No TPPC.filters fallback** (line 27). If filters.js not loaded, the filter panel silently doesn't initialize; users see unstyled data-filterable attributes. |
| 7 | **L** | 68 | **`data-filters` embedded JSON** — a single typo here breaks filtering on the whole table. Hard to validate. |

## 5. Integration map

**Data feed chain:**
- `gather-keyword-volumes.js` → `keyword-volumes.json` → normalizer merges `volume/cpc/competition` into `auditData.keywords[i]` → this page reads.
- `gather-domain-metrics.js` → `domain-metrics.json` → normalizer merges into `auditData.domainMetrics.client` → this page reads (fallback).
- `gather-organic-metrics.js` → `organic-metrics.json` → normalizer merges `organicKeywords/organicTraffic` into domainMetrics → this page displays.
- `populate-audit-data.js` → `auditData.keywords[]` from `keyword-research.md` parsing → this page reads.

**Consumer of API error banners** — `window.TPPC.utils.renderApiErrorBanner` (deep-dive #34).

## 6. Fix / improve suggestions

1. **When finding #10 #7 renames `organicTraffic`, update this page's reads** in coordination.
2. **Make volume-chart top-N and rank-history top-N configurable** (bugs #2, #4).
3. **Add source marker to the dual-path merge** (bug #5) — know which path populated the data.
4. **Audit `rankHistory` producer** (deep-dive #67 — skill).

## 7. What to verify before we touch this file

- **Confirm `data.rankHistory` producer** — is it in the skill or hand-authored? Which clients have it?
- **Diff matt-wallmow's local copy** — expected identical.
- **Test what happens when volumes are mixed numeric + qualitative** (partial data) — chart may show subset or all.
