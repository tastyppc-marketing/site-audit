# Deep Dive #25 — `template/reports/multipage/pages/technical.js`

**File:** [`template/reports/multipage/pages/technical.js`](/root/site-audit/template/reports/multipage/pages/technical.js) (981 lines — largest page renderer)
**Layer:** 07 — page renderer (Technical SEO page)
**Cross-reference:** [`codex findings/06-page-renderers/37-technical_page.md`](/root/site-audit/codex findings/06-page-renderers/37-technical_page.md)
**Template-vs-client drift:** laura-willis 981 lines (identical). Matt + Liane same expected.
**Date:** 2026-04-20

---

## 1. Purpose

Renders the Technical SEO page — the most data-dense report page. 7 sections:
1. **Core Web Vitals** — LCP / CLS / INP gauges.
2. **PageSpeed Comparison** — client + competitors' scores.
3. **Schema Audit** — JSON-LD coverage.
4. **Meta Tag Audit** — title/description/OG/canonical/viewport per page.
5. **Crawl Issues** — redirect chains, noindex, broken canonicals.
6. **Site Structure** — hub pages, orphans, depth distribution.
7. **Duplicate URLs** (helper `renderDupUrls`).

## 2. Inputs

Reads from `data.technicalSeo.*` (primary — populated by `build_audit.py`'s `TechnicalSeoAnalyzer`) + `data.coreWebVitals` + `data.pageSpeedComparison`:
- `technicalSeo.{cwvScore, pageSpeedComparison, lighthouseResults, pageAudits, robots, sitemap, schemaSummary, metaTagAudit, crawlIssues, siteStructure}` 
- `coreWebVitals.{mobile, desktop}` — hoisted by normalizer (finding #21 HANDOFF auto-fix #1).
- `pageSpeedComparison[]` — normalizer reshapes `{domain, mobileScore, desktopScore}` → `{name, score}`.

## 3. Key sections

**`renderCoreWebVitals` (lines 343-403).** CWV gauges. Reads `data.coreWebVitals.{mobile, desktop}` with `.{performanceScore, lcp, fcp, cls, inp, ttfb, speedIndex}`.

**`renderPageSpeed` (lines 404-579).** Per-page PSI scores. Uses `normalizeComparisonScores()` (internal helper) to handle dual-shape: `{domain, mobileScore, desktopScore}` OR `{name, score}`. This is where the HANDOFF auto-fix #3 (stale-data detection) manifests — if all competitor scores are identical to client, normalizer fell back to `competitorAnalysis` version; this page reads whatever survived normalization.

**`renderSchemaAudit` (lines 580-702).** Reads `technicalSeo.schemaSummary` + per-page schema types. **Downstream of finding #5 bug #8** — array-wrapped JSON-LD returns `schemaTypes: ['unknown']`, so this audit shows false "no schema" for sites using grouped schema patterns.

**`renderMetaTagAudit` (lines 703-802).** Per-page meta check. **Downstream of Matt's client-site-structure.md "5 of 11 analyzed pages have NO meta description" finding** — the 11-page cap from agent-overwrite (finding #5 bug #21) means only 11 of Matt's 40 content pages are audited.

**`renderCrawlIssues` (lines 803-865).** Redirect chains + noindex + canonical issues. **Downstream of finding #5 bug #1** — `MISSING_HSTS` and `statusCode` are corrupted by the response-header listener overwrite, so this section has false signals.

**`renderSiteStructure` (lines 866-981).** Hub clusters + orphans + link depth distribution. **Heavily downstream of finding #5 bug #21 + build_audit.py #3 bug #3** — orphan list is polluted (all analyzed pages appear as orphans for Matt), depth stats are broken (max_depth: 0).

## 4. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Downstream of finding #5 bug #1** (response-header overwrite). MISSING_HSTS section flags false positives; statusCode may be wrong page. |
| 2 | **H** | — | **Downstream of finding #5 bug #21** (agent-overwrite). Meta-tag audit, crawl issues, site structure all operate on the 11-page curated set instead of full 40-page content inventory. Matt's audit log: "5 of 11 analyzed pages have NO meta description" — the real count is likely 5 of 40. |
| 3 | **H** | — | **Downstream of build_audit.py:216 bug** (INDEX addendum). Orphan list shows ALL analyzed pages (11 for Matt) as orphans because `total_internal_links` is 0 from wrong payload shape. Site Structure section displays garbage for affected clients. |
| 4 | **H** | — | **Downstream of finding #5 bug #8** (array-wrapped schema detection). Schema Audit section has false "no schema" for sites emitting grouped JSON-LD. |
| 5 | **M** | 404-579 | **Page is largely dependent on normalizer's stale-data-detection correctness** (HANDOFF auto-fix #3). If the detector misfires, wrong PageSpeed scores displayed. Recommendation: add a "source" indicator to the PSI rows showing which path populated them. |
| 6 | **M** | 580-702 | **No JSON-LD validation** — Schema Audit shows types but doesn't validate schema content. A malformed JSON-LD gets listed as "has schema" without error callouts. |
| 7 | **M** | — | **Meta-tag audit shows per-URL rows** — with the 11-page cap from #5 #21, report looks like "site only has 11 pages to audit." No count discrepancy with sitemap. |
| 8 | **L** | — | **CWV gauges show raw numbers without benchmarks.** "LCP: 2.8s" without "good/needs improvement/poor" threshold is harder to interpret. Could enrich with threshold classification client-side. |

## 5. Integration map

**Data chain (5 scripts → normalizer → this page):**
- `gather-pagespeed.js` → `pagespeed-data.json` → normalizer section 868-1109 → `coreWebVitals` + `lighthouseResults` + `pageSpeedComparison`.
- `crawl-sitemap.js` → `crawl-data.json` → normalizer section 1110-1160 → `pageAudits` fallback.
- `build_audit.py` → `TechnicalSeoAnalyzer` → `technicalSeo.{schemaSummary, metaTagAudit, crawlIssues, siteStructure}`.
- `build_audit.py` → `IndexCrawlabilityAnalyzer` → crawl issues.
- `build_audit.py` → `InternalLinkAnalyzer` → `siteStructure.{hubClusters, orphans, depthDistribution}`.

**This page is the highest-leverage place to verify the upstream bugs we've documented.** A single glance at Matt's Technical page would immediately show bugs #1, #2, #3, #4 all at once.

## 6. Fix / improve suggestions

1. **Prioritize upstream fixes** (findings #5, #8, #21) — this page's reliability is entirely downstream.
2. **Add "source" markers** to CWV + PSI panels (like `"source": "pagespeed-data.json"` vs `"audit-synthesis"`). Helps debugging.
3. **Wire CWV thresholds** client-side for good/fair/poor coloring.
4. **JSON-LD validation pass** — run schema through a validator to flag malformed blocks.

## 7. What to verify before we touch this file

- **Open Matt's Technical page** and compare displayed data against expected data:
  - CWV: should show real PSI values (his audit-log says mobile 0.54 / desktop 0.93).
  - PageSpeed comparison: should show 5 competitors with distinct scores. Watch for "all-identical" pattern which indicates stale-data detection failed.
  - Meta-tag audit: 11 rows currently; should be 40 after finding #5 #21 fix.
  - Site structure: orphan count (should be small, not 11).
- **Test one client from each drift cohort** to confirm laura/liane's page renders vs matt's — identical expected.
