# Handoff: SEO Audit Report System

**Last updated:** 2026-04-02
**Save point:** `a986ae3` (git reset --hard a986ae3 to restore)
**Previous save point:** `ffff44e` (template-only, before client data commit)

---

## What Was Done This Session

Fixed and templatized the entire multipage HTML report system so it works reliably for any client, not just the one it was originally built for.

### Problems Found & Fixed

| Problem | Root Cause | Fix |
|---|---|---|
| Technical page: CWV, PageSpeed, Site Structure all empty | Data was nested under `technicalSeo.*` but renderers read from top-level or expected different field names | `generate-multipage-report.js` normalizer hoists, aliases, and reshapes data automatically |
| Links page: all zeros, 35 orphans, no hub clusters | `internalLinking` had stale v1 data; link graph never parsed | Normalizer derives stats + hub clusters from `research/link-graph.json` |
| Competitors page: domain metrics missing, PageSpeed all identical, wrong platform | `domainMetrics` not at expected path; `technicalSeo.pageSpeedComparison` had copy-pasted client scores; `client.platform` said "RealtyPress" instead of "Sierra Interactive" | Normalizer populates domainMetrics from multiple sources; detects stale PageSpeed (all-identical scores) and uses `competitorAnalysis` version; fixed client data |
| Competitors page: radar chart useless (client dot invisible) | Client so far behind that normalized percentages collapsed to ~0% | Replaced with multi-competitor log-scale grouped bar chart + gap breakdown table |
| Competitors page: comparison table used domain names as column keys | Renderer expected `comp1`, `comp2`, etc. | Normalizer auto-maps named keys to comp1..compN |
| Links page: backlinks table had no title, only showed 10 of 280 | Only 10 backlinks populated in audit-data.json; DFS had more | Normalizer auto-populates ALL backlinks from `research/client-backlinks.json`; table grouped by referring domain with expand/collapse + 25/page pagination |
| Local page: map showed Mammoth Lakes | Hardcoded coordinates and competitor data from previous client | Rebuilt as fully data-driven — reads from `localSeo.businessProfile`, `competitorLocations`, `searchDemandZones`, `serviceAreaMap` GeoJSON |
| Action plan: content calendar badges overflowing | CSS grid columns too narrow for badge text | Rebuilt as proper `<table>` with auto-sizing columns |
| Content page: duplicate columns (Readability Score = Flesch Reading Ease) | Same number displayed twice | Replaced Flesch column with Syllables/Word, enriched from `page-text-analysis.json` |
| Explainer widget and nav: unreliable section tracking | Naive "last intersecting entry wins" broke during fast scroll and nav clicks | Both now use topmost-visible-section algorithm with throttled scroll listener |
| No table filters anywhere | N/A | New `table-filters.js` — text search, badge/unique/range dropdowns, row counts on all tables |

### Data Normalization (13 auto-fixes in generate-multipage-report.js)

The generator runs these before injecting data into HTML. No manual data shaping needed:

1. `coreWebVitals` — hoist to top level, alias `performanceScore` to `score`
2. `lighthouseResults` — reshape dict to array, or populate from `pagespeed-data.json`
3. `pageSpeedComparison` — hoist, convert `{domain, mobileScore, desktopScore}` to `{name, score}`, detect stale data
4. `pageAudits` — populate from `crawl-data.json`
5. `internalLinking` stats — derive from `link-graph.json` (total pages, links, orphans, averages)
6. `hubClusters` — derive from `link-graph.json` (top 12 hubs by spoke count)
7. `readability.syllablesPerWord` — enrich from `page-text-analysis.json`
8. `topBacklinks` — populate ALL from `client-backlinks.json`
9. `topReferringDomains` — populate from `client-backlinks.json`
10. `domainMetrics` — populate from `backlinks.competitorDomainMetrics`, `competitorAnalysis`, or `domain-metrics.json`
11. `competitorComparison` columns — map named keys to comp1..compN
12. `competitor.all` — auto-populate labels if missing

### Research Files the Normalizer Reads

These must exist alongside `audit-data.json` in `seo/`:

| File | What it feeds |
|---|---|
| `research/crawl-data.json` | Site structure table (pageAudits) |
| `research/link-graph.json` | Link overview stats, hub clusters, orphan detection |
| `research/pagespeed-data.json` | CWV gauges, PageSpeed lighthouse runs |
| `research/domain-metrics.json` | Domain metrics comparison table |
| `research/client-backlinks.json` | Full backlink inventory table |
| `research/page-text-analysis.json` | Syllables/word in readability table |

---

## Running an Audit for a New Client

```bash
# 1. From the project root, invoke the SEO audit skill
/seo-audit <client-website> [competitor-website]

# 2. The skill handles everything: project setup, 6 parallel research agents,
#    report compilation, deliverables, data population, and report generation.

# 3. If you need to regenerate the HTML report manually:
cd clients/<client-slug>
node ../../template/reports/multipage/generate-multipage-report.js \
  --data seo/audit-data.json \
  --output seo/reports/multipage \
  --inline
```

### What to Verify After a New Audit

Open each page in the browser and check:

| Page | Check |
|---|---|
| **Index** | Grade badge, key stats, top issues, quick wins all populated |
| **Keywords** | Rankings table with filters, volume chart |
| **Content** | Readability table shows scores + syllables/word (not duplicate columns), thin content flagged |
| **Technical** | CWV gauges render (not "No data"), PageSpeed shows per-page scores, site structure table has all pages |
| **Links** | Link overview has real numbers (not zeros), hub clusters populated, backlink inventory shows grouped domains with pagination |
| **Competitors** | Gap analysis chart shows all competitors (not just one), comparison table has correct platforms, domain metrics table populated, PageSpeed bars show different scores per domain |
| **Local** | Map centered on correct city (not Mammoth Lakes), blue pin on client, red pins on competitors, heat zones on service areas |
| **Action Plan** | Action items in tabs, content calendar table with badges that fit, deliverables listed |

### Common Issues & Fixes

**"No data" on a section:** The normalizer couldn't find the research file. Check that the file exists in `seo/research/` with the expected name. Run the generator again — it logs what it auto-populated.

**Map shows wrong location:** `localSeo.businessProfile` is missing `latitude`/`longitude`. The normalizer does NOT geocode addresses — you must provide coordinates.

**PageSpeed shows identical scores for all competitors:** The normalizer detected this and should have fallen back to `competitorAnalysis.pageSpeedComparison`. If that's also missing, the DFS pagespeed script needs to be run for competitor domains.

**Competitor comparison has wrong data:** Cross-reference against `seo/research/competitor-analysis.md`. The audit agent sometimes hallucinates numbers in `competitorComparison` rows — verify against the research tables.

**Filters not showing on a table:** The table's `report-table-wrap` must be inside a `<div data-filterable>` wrapper. Check that `filters.init()` is called after the page renders.

---

## Running the Optimize Page Tool

The Optimize Page skill (`/optimize-page`) modifies template HTML/JS/CSS files directly. Before running:

1. **Verify save point:** `git log --oneline -1` should show `a986ae3`
2. **Run the tool** on the target page
3. **Regenerate:** Run the generate script to rebuild with changes
4. **Test:** Open the page and verify nothing broke
5. **If broken:** `git reset --hard a986ae3` to restore

### Files the Optimize Tool May Touch

```
template/reports/multipage/
  *.html                    — page structure
  pages/*.js                — page renderers
  shared/report-styles.css  — all styles
  shared/charts.js          — chart factories
  shared/nav.js             — navigation + scrollspy
  shared/explainer.js       — "What does this mean?" widget
  shared/table-filters.js   — table filter system
  shared/utils.js           — shared utilities
  shared/data-loader.js     — data injection + boot
```

After any template change, regenerate the client report:
```bash
node template/reports/multipage/generate-multipage-report.js \
  --data clients/<client-slug>/seo/audit-data.json \
  --output clients/<client-slug>/seo/reports/multipage \
  --inline
```

---

## Key Architecture Decisions

- **Data normalization happens at generate time**, not in page JS. This means the page renderers can stay simple — they just read from predictable paths.
- **No hardcoded client data in templates.** Everything comes from `audit-data.json` and sibling research files.
- **Filters are declarative.** Add `data-filterable` with optional `data-filters` JSON to any table wrapper. The shared `table-filters.js` handles the rest.
- **Scrollspy uses topmost-visible-section**, not last-intersecting. Both nav and explainer share this algorithm for consistency.
- **Competitor charts use log scale** because the gap between a new site and an established competitor can be 100x+. Linear scale makes the smaller site invisible.
