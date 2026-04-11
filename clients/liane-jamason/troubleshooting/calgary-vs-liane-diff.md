# Calgary vs Liane JSON Structure Diff

**Purpose:** Identify every field present in the working Calgary Castles report that is missing or empty in Liane Jamason's audit-data.json, so the data-populator can fill the gaps.

**Sources:**
- Working client: `/mnt/c/dev/site audit/clients/calgary-castles/seo/audit-data.json`
- Broken client: `/mnt/c/dev/site audit/clients/liane-jamason/seo/audit-data.json`

**Calgary top-level sections (line numbers):**
```
client (2), contentQuality (17), backlinks (1267), internalLinking (1419),
technicalSeo (1666), localSeo (2354), indexationCrawlability (2463),
eeatSignals (2535), topIssues (3012), actionPlan (3062), quickWins (3228),
reportingIntelligence (3278), competitorAnalysis (3573), competitor (3684),
keyStats (3738), siteComparison (3800), keywords (3890),
competitorComparison (4142), competitorStrategies (4224),
contentCalendar (4256), advantages (4339), nextSteps (4361),
pillars (4387), mediumTermRoadmap (4409), longTermColumns (4443),
deliverables (4489), keyPagesCreated (4515), blogPostsCreated (4521),
rankHistory (4527)
```

**Liane top-level sections (all present):**
```
client, competitor, topIssues, siteComparison, keyStats, keywords,
competitorComparison, competitorStrategies, quickWins, actionPlan,
contentCalendar, deliverables, keyPagesCreated, blogPostsCreated,
advantages, nextSteps, pillars, mediumTermRoadmap, longTermColumns
```

---

## Category A: Fields Present in Calgary but MISSING ENTIRELY in Liane

These top-level keys do not exist anywhere in Liane's audit-data.json.

### A1. `contentQuality`
- **Calgary path:** `contentQuality`
- **Calgary contents:** Object with two sub-keys:
  - `summary` — aggregate stats: `totalPagesAnalyzed` (36), `avgQualityScore` (68.8), `thinPageCount`, `thinThreshold`, `avgReadabilityScore` (55.3), `avgSeoScore`, `avgStructureScore`, `duplicateGroupCount`, `cannibalizationCount`
  - `pages` — array of per-page objects, each with: `url`, `title`, `readabilityScore`, `qualityScore`, `isThin`, `readability` (sub-object with `fleschReadingEase`, `fleschKincaidGrade`, `wordCount`, `scoreExplanation`), `structure` (sub-object with `headingCount`, `h2Count`, `h3Count`, `headingHierarchyValid`, `imageCount`, `imagesWithAlt`, `internalLinks`, `hasFaqSchema`), `issues` (array), `recommendations` (array)
- **Report section it feeds:** Content Quality page — readability chart, thin-page count, per-page quality table, duplication warnings

### A2. `backlinks`
- **Calgary path:** `backlinks`
- **Calgary contents:** Object with three sub-keys:
  - `domainMetrics` — `domainRating` (45), `referringDomains` (209), `totalBacklinks` (280), `organicTraffic`, `source`
  - `topBacklinks` — array of 10 objects each with `sourceUrl`, `targetUrl`, `anchorText`, `domainRating`, `isDofollow`, `firstSeen`
  - `competitorDomainMetrics` — array of objects with `domain`, `domainRating`, `referringDomains`, `backlinks`, `isClient`
- **Report section it feeds:** Backlinks page — domain rating card, top backlinks table, competitor domain authority chart

### A3. `internalLinking`
- **Calgary path:** `internalLinking`
- **Calgary contents:** Object with: `domain`, `analyzed_at`, `total_pages` (0), `total_internal_links` (0), `orphan_count` (35), `orphan_rate`, `avg_inbound_links`, `avg_outbound_links`, `unreachable_count`, `nodes` (array), `orphans` (array of objects with `url`, `outbound_links`, `is_in_sitemap`, `recommendation`)
- **Report section it feeds:** Internal Linking page — orphan page count, link graph, orphan list table

### A4. `technicalSeo`
- **Calgary path:** `technicalSeo`
- **Calgary contents:** Large object with 11 sub-sections:
  - `metaTagSummary` — counts of pages with/without titles, descriptions, canonicals; duplicates; length issues
  - `metaTagIssues` — array of per-URL meta issues (`url`, `issue`, `detail`, `value`)
  - `templateDetection` — `templates`, `totalTemplatedTitles`, `totalTemplatedDescriptions`
  - `imageAudit` — `summary` (totals, coverage %) + `worstPages` array
  - `urlStructure` — `summary` (depth, length, consistency stats) + `depthDistribution` + `issues`
  - `crawlIssues` — array of `{url, statusCode, issue}`
  - `schemaSummary` — counts + `schemaTypesFound` array + `recommendedSchemas` array
  - `canonicalAudit` — summary counts + `issues` array
  - `redirectChains` — summary counts + `chains` array + `issues` array
  - `securityHeaders` — `summary` (coverage % per header, totalIssues) + `issues` array (per URL, per header type)
  - `indexability` — summary counts + `noindexUrls` + `nofollowUrls` + `issues`
  - `mobileUsability` — summary counts + `issues` array
  - `structuredDataValidation` — summary counts + `issues` array
  - `coreWebVitals` — `mobile` and `desktop` sub-objects each with `performanceScore`, `lcp`, `cls`, `fcp`, `inp`, `ttfb`, `speedIndex`, `note`
  - `lighthouseResults` — `clientPages` array (per-URL mobile/desktop scores + LCP) + `avgClientMobile` + `avgClientDesktop`
  - `pageSpeedComparison` — array of `{domain, mobileScore, desktopScore, isClient}`
  - `pageSpeedOpportunities` — array of `{issue, savingsKb, savingsMs, affectsAllPages}`
- **Report section it feeds:** Technical SEO page — meta audit table, image audit, schema coverage, security headers, Core Web Vitals panel, Lighthouse scores, redirect chains, canonical issues

### A5. `localSeo`
- **Calgary path:** `localSeo`
- **Calgary contents:** Object with six sub-keys:
  - `businessProfile` — `name`, `title`, `address`, `phone`, `website`, `latitude`, `longitude`, `category`, `brokerage`, `rating`, `reviewCount`, `gbpVerified`, `note`
  - `competitorLocations` — array of `{name, domain, lat, lng}` for map pins
  - `searchDemandZones` — array of `{lat, lng, radius, label, volume, color, opacity}` for heatmap overlays
  - `reviewSentiment` — `summary` (totalReviews, analyzedReviews, meanCompound, pctPositive, pctNegative, pctNeutral, replyRate, topPositiveKeywords, topNegativeKeywords) + `reviews` array
  - `competitorGbp` — array (empty in Calgary, but key is present)
  - `landingPageScores` — array (empty in Calgary, but key is present)
  - `serviceAreaMap` — GeoJSON FeatureCollection with Point and Polygon features (drives the Leaflet map)
  - `accessNotes` — `{gbpAccess, gaAccess, searchConsoleAccess, note}`
- **Report section it feeds:** Local SEO page — GBP card, Leaflet map (service area + competitor pins + heatmap zones), review sentiment, landing page scores

### A6. `indexationCrawlability`
- **Calgary path:** `indexationCrawlability`
- **Calgary contents:** Object with five sub-keys:
  - `parameterAudit` — `summary` (totalParameterizedUrls, parameterCategories, etc.) + `pages` array + `issues` array
  - `paginationAudit` — `summary` + `pages` array + `issues` array
  - `soft404s` — `summary` (totalSoft404s, byReason) + `pages` array
  - `indexOrphans` — `summary` (totalOrphans) + `orphans` array
  - `crawlBudgetHealth` — `score`, `grade`, `factors` (object with keys: parameterizedUrls, orphanPages, redirectChains, soft404s, deepPages — each with count/ratio/waste)
- **Report section it feeds:** Technical SEO / Crawlability sub-section — crawl budget score, soft 404 list, pagination issues, parameterization table

### A7. `eeatSignals`
- **Calgary path:** `eeatSignals`
- **Calgary contents:** Object with four sub-keys:
  - `summary` — `eeatScore` (20), `eeatGrade`, `trustScore`, `expertiseScore`, `authorityScore`, `experienceScore`, `ymylPages`, `pagesWithAuthor`, `pagesWithDate`, `pagesWithExpertiseSchema`, `totalPages`
  - `siteTrust` — boolean flags: `hasAboutPage`, `hasContactPage`, `hasPrivacyPolicy`, `hasTermsOfService`, `hasPhysicalAddress`, `hasPhoneNumber`, `hasSecureConnection`, `hasOrganizationSchema`, `hasLocalBusinessSchema` + `trustSignalCount`, `trustSignalTotal`, `trustSignalPct`
  - `pageSignals` — array of per-page objects: `url`, `isYmyl`, `ymylCategory`, `hasAuthor`, `hasPublicationDate`, `hasExpertiseSchema`, `effortScore`, `expertiseScore`, `schemaTypes`
  - `eeatScore` — duplicate of summary scores (top-level score object)
  - `issues` — array of `{issue, detail, severity, reference}`
- **Report section it feeds:** E-E-A-T page — trust gauge, YMYL page count, per-page signal table, issue list with Search Quality Rater references

### A8. `reportingIntelligence`
- **Calgary path:** `reportingIntelligence`
- **Calgary contents:** Object with six sub-keys:
  - `siteHealthGrade` — `{compositeScore, letterGrade, floorPenaltyApplied}`
  - `prioritizedFindings` — array of prioritized issues: `{issue, issueCode, detail, impact, effort, roiScore, affectedCount, category, sampleUrls}`
  - `actionPlan` — nested action plan with `quickWins`, `shortTerm`, `mediumTerm`, `longTerm` arrays (each item has `action`, `why`, `effort`, `impact`, `roiScore`, `affectedCount`)
  - `benchmarkComparisons` — array of `{metric, clientValue, benchmark, industryAvg, unit, status}`
  - `executiveSummary` — string narrative
  - `trendData` — `{auditDates, compositeScores, categoryTrends, delta}`
  - `categoryScores` — `{technical, performance, content, backlinks, indexability, local}` — numeric scores per category
- **Report section it feeds:** Executive Summary / Overview page — site health grade dial, prioritized findings list, category score cards, trend chart, benchmark comparison bars

### A9. `competitorAnalysis`
- **Calgary path:** `competitorAnalysis`
- **Calgary contents:** Object with four sub-keys:
  - `domainMetricsComparison` — array of `{domain, dr, referringDomains, backlinks, isClient}` for all competitors + client
  - `pageSpeedComparison` — array of `{domain, mobileScore, desktopScore, isClient}`
  - `organicKeywordsComparison` — object keyed by domain with keyword count values + `note`
  - `keyInsights` — array of insight strings
- **Report section it feeds:** Competitor Analysis page — domain authority comparison chart, PageSpeed comparison chart, organic keyword gap chart, insight callouts

### A10. `rankHistory`
- **Calgary path:** `rankHistory`
- **Calgary contents:** Object with five sub-keys:
  - `snapshots` — array of date strings
  - `chartLabels` — array of label strings
  - `milestoneLabels` — object mapping date → label string
  - `domains` — `{client: string, competitors: [array of domain strings]}`
  - `keywords` — object keyed by keyword string, each value is `{volume, difficulty, history: {domain: {date: rank_or_null}}}` — covers 25 keywords with historical rank positions per domain per snapshot date
- **Report section it feeds:** Keyword Rankings page — rank history line charts, keyword tracking table with volume/difficulty/ranks

---

## Category B: Fields Present in Both but EMPTY or Underpopulated in Liane

### B1. `client` — missing sub-fields
- **Calgary path:** `client.brokerage`, `client.phone`, `client.email`
- **Calgary value:** `"CIR Realty"`, `"403-271-0600"`, `"calgarycastles@live.com"`
- **Liane value:** These keys do not exist in `client` object
- **Report section:** Client header / contact card

### B2. `competitor.all[*]` — missing sub-fields
- **Calgary path:** `competitor.all[*].brokerage`, `competitor.all[*].pages`, `competitor.all[*].reviews`, `competitor.all[*].rating`
- **Calgary value:** Each competitor entry has brokerage, page count, review count, and star rating
- **Liane value:** Each entry has only `name` and `domain` — the extra fields are absent
- **Report section:** Competitor cards / comparison table

### B3. `keywords[*]` — different field shape
- **Calgary path:** `rankHistory.keywords` (rich structure with volume, difficulty, history per domain/date)
- **Liane path:** `keywords` array (flat list: `keyword`, `volume`, `clientRank`, `competitorRank`, `topResult`)
- **Note:** Liane uses a simplified keyword table schema. Calgary's `rankHistory.keywords` is what drives the interactive rank-history chart. Liane has no equivalent — the chart section will be blank or broken.
- **Report section:** Keyword Rankings page — chart panel specifically

---

## Category C: Fields Present in Liane but NOT in Calgary

These are newer fields added for Liane that Calgary did not have. They may or may not be fully wired into the renderer.

### C1. `quickWins` (top-level)
- **Liane path:** `quickWins` — top-level array of `{action, impact}` objects (10 items)
- **Calgary:** Has `quickWins` only nested inside `actionPlan.quickWins`, not as a top-level key
- **Note:** Calgary's equivalent is `actionPlan.quickWins` with richer shape `{action, why, effort, impact}`. Liane has both a simplified top-level version AND the full `actionPlan` structure. Check which one the renderer consumes.

### C2. `actionPlan.quickWins` has different shape than Calgary
- **Liane shape:** `{action, why, effort, impact}` — strings only
- **Calgary `reportingIntelligence.actionPlan.quickWins` shape:** adds `roiScore` and `affectedCount` numeric fields
- **Note:** The renderer may use Calgary's extended shape for sorting/prioritization; Liane's entries will be missing those sort keys.

---

## Summary Table

| Section | In Calgary | In Liane | Status |
|---|---|---|---|
| `client` | Yes (with brokerage, phone, email) | Yes (missing 3 sub-fields) | Cat B |
| `contentQuality` | Yes (36 pages, rich sub-objects) | **NO** | Cat A |
| `backlinks` | Yes (DR, top 10, competitor metrics) | **NO** | Cat A |
| `internalLinking` | Yes (orphan list, link graph data) | **NO** | Cat A |
| `technicalSeo` | Yes (11 sub-sections, CWV, Lighthouse) | **NO** | Cat A |
| `localSeo` | Yes (GBP, map, heatmap zones, reviews) | **NO** | Cat A |
| `indexationCrawlability` | Yes (5 sub-sections) | **NO** | Cat A |
| `eeatSignals` | Yes (4 sub-sections, per-page signals) | **NO** | Cat A |
| `reportingIntelligence` | Yes (grades, ROI scores, trend data) | **NO** | Cat A |
| `competitorAnalysis` | Yes (DR chart, PageSpeed, organic KW) | **NO** | Cat A |
| `rankHistory` | Yes (25 KWs, history per domain/date) | **NO** | Cat A |
| `competitor` | Yes (with brokerage/pages/reviews/rating) | Yes (name+domain only) | Cat B |
| `topIssues` | Yes | Yes | OK |
| `siteComparison` | Yes | Yes | OK |
| `keyStats` | Yes | Yes | OK |
| `keywords` | Yes (flat table) | Yes (flat table) | OK — but no `rankHistory` equivalent |
| `competitorComparison` | Yes | Yes | OK |
| `competitorStrategies` | Yes | Yes | OK |
| `quickWins` (top-level) | **NO** | Yes | Cat C |
| `actionPlan` | Yes | Yes | OK (shape compatible) |
| `contentCalendar` | Yes | Yes | OK |
| `advantages` | Yes | Yes | OK |
| `nextSteps` | Yes | Yes | OK |
| `pillars` | Yes | Yes | OK |
| `mediumTermRoadmap` | Yes | Yes | OK |
| `longTermColumns` | Yes | Yes | OK |
| `deliverables` | Yes | Yes | OK |
| `keyPagesCreated` | Yes | Yes | OK |
| `blogPostsCreated` | Yes | Yes | OK |

---

## Priority Order for Data Population

Based on what breaks the most visible report sections:

1. **`technicalSeo`** — drives the entire Technical SEO page (meta audit, image audit, schema, CWV, Lighthouse, security headers). Highest renderer dependency.
2. **`localSeo`** — drives the Local SEO page including the Leaflet map, which requires `serviceAreaMap` GeoJSON, `competitorLocations`, and `searchDemandZones` with lat/lng coordinates.
3. **`eeatSignals`** — drives the E-E-A-T page. Self-contained; can be partially filled with research data.
4. **`backlinks`** — drives Backlinks page. Requires DataForSEO domain metrics call.
5. **`contentQuality`** — drives Content Quality page. Requires crawling Liane's pages and running readability scoring.
6. **`rankHistory`** — drives the rank history chart. Requires DataForSEO SERP API calls for 25 keywords across 6 domains.
7. **`internalLinking`** — drives Internal Linking page. Requires site crawl.
8. **`indexationCrawlability`** — drives crawlability sub-section. Requires site crawl + sitemap analysis.
9. **`reportingIntelligence`** — composite scores derived from other sections. Should be populated last, after other sections exist.
10. **`competitorAnalysis`** — partially derivable from `backlinks.competitorDomainMetrics` + DataForSEO PageSpeed calls.

---

## Key Structural Notes for the Implementer

- The `localSeo.serviceAreaMap` must be a valid GeoJSON FeatureCollection. For Liane (St. Petersburg, FL), the Point coordinates should be approximately `[-82.6401, 27.7676]` and the Polygon should cover the Pinellas County/Tampa Bay service area. Without this, the Leaflet map renders blank.
- `technicalSeo.coreWebVitals` and `technicalSeo.lighthouseResults` require PageSpeed Insights API calls against Liane's actual URLs. Calgary has 4 URLs tested; Liane should test homepage + 2-3 key pages.
- `technicalSeo.pageSpeedComparison` in Calgary has a known stale-data issue (all competitors show identical 0.79/0.95 scores). Liane's version should use real per-domain measurements from DataForSEO or PageSpeed API.
- `rankHistory.keywords` uses a nested domain → date → rank structure. The flat `keywords` array already in Liane's file is a different schema — it feeds the keyword table, not the rank history chart. Both are needed independently.
- `eeatSignals` has a duplicate score object: both `eeatSignals.summary` and `eeatSignals.eeatScore` contain the same score fields. This appears intentional — the renderer likely reads from both paths.
- `reportingIntelligence.categoryScores` has null values for `performance`, `content`, `backlinks`, and `local` in Calgary, confirming those scores are placeholders that are not yet calculated.
