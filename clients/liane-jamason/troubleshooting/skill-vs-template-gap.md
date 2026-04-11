# Research Brief: /seo-audit Skill vs. Template Contract — Data Flow & Gap Analysis

**Date:** 2026-04-08
**Client context:** Liane Jamason (liane-jamason) — used as reference point for what's present vs. missing
**Purpose:** Map every data source, every field the skill claims to populate, and every field the template expects. Identify gaps and what can be gathered without Google connectors.

---

## 1. Data Sources That Do NOT Require Google Connectors

These sources are available for any client without GA4, GSC, or GBP access:

| Source | What It Provides | How Accessed |
|--------|-----------------|--------------|
| **Playwright / crawl-sitemap.js** | Total page count, URL categories, sitemap structure, robots.txt | `node scripts/crawl-sitemap.js {domain} --analyze` |
| **Playwright / browse.js** | Per-page: title, meta description, H1s, H2 count, word count, image alt coverage, internal links, canonical, schema presence, OG tags | `node scripts/browse.js {url} --extract-meta --extract-headings --extract-text --extract-links` |
| **Playwright / check-technical.js** | JSON-LD schema blocks, social meta, DOM stats, hreflang, viewport | `node scripts/check-technical.js` |
| **Playwright / ddg-search.js** | SERP rank positions via DuckDuckGo (CAPTCHA-free fallback) | `node scripts/ddg-search.js "<keyword>"` |
| **scripts/extract-text.js** (post-crawl) | Real body text for Flesch-Kincaid scoring — syllable counts, sentence lengths | Run after site-crawler agent completes |
| **DataForSEO — keyword volumes** | Real monthly search volume numbers (not qualitative) | `keywords_data/google_ads/search_volume/live` — requires DFS API key, no Google OAuth |
| **DataForSEO — SERP** | Actual top-5 organic results per keyword, People Also Ask | `serp/google/organic/live/advanced` — DFS API key only |
| **DataForSEO — backlinks/summary** | Domain Rating, referring domains count, total backlinks for client + competitors | `backlinks/summary/live` — DFS API key only |
| **DataForSEO — backlinks/backlinks** | Individual backlink records (top 500) | `backlinks/backlinks/live` — DFS API key only |
| **DataForSEO — referring_domains** | Top 200 referring domain records | `backlinks/referring_domains/live` — DFS API key only |
| **DataForSEO — ranked_keywords** | Organic keyword portfolio for client + competitors | `dataforseo_labs/google/ranked_keywords/live` — DFS API key only |
| **Google PageSpeed Insights API** | LCP, FCP, CLS, TBT, Speed Index, mobile/desktop scores — for client AND competitors | Public API — no OAuth. `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...` |
| **WebSearch tool** | SERP results, rank positions, competitor discovery, local citations, backlink signals | Built-in — no auth |
| **WebFetch / free backlink checkers** | Supplemental backlink discovery | Moz Link Explorer free tier, OpenLinkProfiler, WebFetch to backlink check pages |
| **DuckDuckGo (direct)** | SERP fallback when WebSearch insufficient | Via ddg-search.js |

**Summary:** Lighthouse scores, referring domains, internal link analysis, content readability, competitor PageSpeed, local citation discovery, and rank tracking via DataForSEO are ALL available without any Google connector (GA4, GSC, GBP).

---

## 2. Step 8a — Every Field the Skill Says to Populate

Source: `seo-audit.md` lines 994–1040.

### Fields Claude Manually Populates from Research Files

| Field | Source File(s) | Notes |
|-------|---------------|-------|
| `client.website` | FINAL-AUDIT-REPORT.md | Domain only |
| `client.websiteUrl` | FINAL-AUDIT-REPORT.md | Full URL with https:// |
| `client.name` | Step 0 input | Client's name |
| `client.company` | Step 0 input | Brokerage/company |
| `client.platform` | client-site-structure.md | MUST match actual crawl findings |
| `client.auditDate` | Current date | |
| `client.overallGrade` | FINAL-AUDIT-REPORT.md | A-F with +/- |
| `client.gradeSummary` | FINAL-AUDIT-REPORT.md | One-line summary |
| `client.serviceType` | Step 0 input | |
| `client.location` | Step 0 input | City, State/Province |
| `competitor.primary` | competitor-analysis.md | Domain of primary competitor |
| `competitor.primaryLabel` | competitor-analysis.md | Display name |
| `competitor.all[]` | competitor-analysis.md | Array of {name, domain} for all competitors |
| `topIssues[]` | FINAL-AUDIT-REPORT.md | Top 5: {issue, detail, impact, effort} |
| `siteComparison[]` | client-site-structure.md + competitor-analysis.md | Use comp1..compN keys, NOT a single "competitor" key |
| `keyStats[]` | FINAL-AUDIT-REPORT.md | 6 stats: {value, label, severity} |
| `keywords[]` | keyword-research.md | All 25: {keyword, volume, clientRank, competitorRank, topResult} |
| `competitorComparison[]` | competitor-analysis.md | Side-by-side metrics |
| `competitorStrategies[]` | competitor-analysis.md | {strategy, detail} |
| `quickWins[]` | FINAL-AUDIT-REPORT.md | {action, impact} — week 1-2 only |
| `actionPlan.quickWins[]` | FINAL-AUDIT-REPORT.md | {action, why, effort, impact} |
| `actionPlan.shortTerm[]` | FINAL-AUDIT-REPORT.md | Same structure |
| `actionPlan.mediumTerm[]` | FINAL-AUDIT-REPORT.md | Same structure |
| `actionPlan.longTerm[]` | FINAL-AUDIT-REPORT.md | Same structure |
| `contentCalendar.month1Label` | FINAL-AUDIT-REPORT.md | Month label string |
| `contentCalendar.month1[]` | FINAL-AUDIT-REPORT.md | {week, topic, keyword, type} |
| `contentCalendar.month2Label` | FINAL-AUDIT-REPORT.md | |
| `contentCalendar.month2[]` | FINAL-AUDIT-REPORT.md | |
| `contentCalendar.month3Label` | FINAL-AUDIT-REPORT.md | |
| `contentCalendar.month3[]` | FINAL-AUDIT-REPORT.md | |
| `deliverables[]` | REVIEW.md | {name, scope, score, status} |
| `keyPagesCreated[]` | community-pages.md | List of page titles |
| `blogPostsCreated[]` | blog-posts.md | List of post titles |
| `advantages[]` | FINAL-AUDIT-REPORT.md | {title, detail} |
| `nextSteps[]` | FINAL-AUDIT-REPORT.md | {text, sub} |
| `pillars[]` | FINAL-AUDIT-REPORT.md | {title, desc, time} |
| `mediumTermRoadmap[]` | FINAL-AUDIT-REPORT.md | {title, detail} |
| `longTermColumns[]` | FINAL-AUDIT-REPORT.md | {title, items[]} |
| `localSeo.businessProfile` | Physical address geocoded | REQUIRED: latitude, longitude, name, address, phone. GBP extras (rating, reviewCount) only if access available |
| `localSeo.competitorLocations[]` | competitor-analysis.md | {name, domain, lat, lng} — approximate city-center coords |
| `localSeo.searchDemandZones[]` | keyword-research.md + local knowledge | {lat, lng, radius, label, volume, color, opacity} |
| `localSeo.serviceAreaMap` | Geocoding from client address | GeoJSON FeatureCollection: Point (center) + Polygon (service area boundary) |
| `localSeo.accessNotes` | Step 0 inputs | {gbpAccess, gaAccess, searchConsoleAccess, note} |

### Fields Auto-Populated by generate-multipage-report.js (DO NOT Manually Populate)

| Field | Source Research File | Normalizer Action |
|-------|---------------------|-------------------|
| `technicalSeo.pageAudits[]` | `research/crawl-data.json` | Direct read |
| `technicalSeo.lighthouseResults[]` | `research/pagespeed-data.json` | Reshape dict → array |
| `coreWebVitals` | `technicalSeo.coreWebVitals` in audit-data | Hoist to top level; alias `performanceScore` → `score` |
| `pageSpeedComparison[]` | Prefers `competitorAnalysis.pageSpeedComparison`; falls back if stale | Converts {domain, mobileScore, desktopScore} → {name, score} |
| `internalLinking` stats | `research/link-graph.json` | Derives total_pages, total_internal_links, avg_inbound/outbound, orphan_count, orphan_rate, orphans[] |
| `internalLinking.hubClusters[]` | `research/link-graph.json` | Top 12 hubs by spoke count |
| `contentQuality.pages[].readability.syllablesPerWord` | `research/page-text-analysis.json` | Enriches readability table |
| `backlinks.topBacklinks[]` | `research/client-backlinks.json` | Replaces limited subset; full inventory grouped by domain |
| `backlinks.topReferringDomains[]` | `research/client-backlinks.json` | Reads referring_domains array |
| `domainMetrics` | `backlinks.competitorDomainMetrics` OR `competitorAnalysis.domainMetricsComparison` OR `research/domain-metrics.json` | Normalizes field names (domain_rating → domainRating etc.) |
| `competitorComparison[]` column mapping | audit-data.json | Maps named domain keys → comp1..compN |
| `competitor.all[]` labels | audit-data.json | Auto-populates missing labels |

---

## 3. Template audit-data.json — Full Top-Level Schema

Source: `/mnt/c/dev/site audit/template/seo/audit-data.json`

| Top-Level Key | Type | Description |
|---------------|------|-------------|
| `client` | Object | website, websiteUrl, name, company, platform, auditDate, overallGrade, gradeSummary, serviceType, location |
| `competitor` | Object | primary (domain), primaryLabel, all[] ({name, domain}) |
| `topIssues` | Array | [{issue, detail, impact, effort}] — 5 items |
| `siteComparison` | Array | [{metric, client, competitor, gap}] — NOTE: template uses single "competitor" key, skill says use comp1..compN |
| `keyStats` | Array | [{value, label, severity}] — 6 items |
| `keywords` | Array | [{keyword, volume, clientRank, competitorRank, topResult}] — 25 items |
| `competitorComparison` | Array | [{metric, client, comp1, comp2, gap}] |
| `competitorStrategies` | Array | [{strategy, detail}] |
| `quickWins` | Array | [{action, impact}] — SIMPLIFIED version (no why/effort) |
| `actionPlan` | Object | quickWins[], shortTerm[], mediumTerm[], longTerm[] — each item {action, why, effort, impact} |
| `contentCalendar` | Object | month1Label, month1[], month2Label, month2[], month3Label, month3[] |
| `deliverables` | Array | [{name, scope, score, status}] |
| `keyPagesCreated` | Array | Strings (page titles) |
| `blogPostsCreated` | Array | Strings (post titles) |
| `advantages` | Array | [{title, detail}] |
| `nextSteps` | Array | [{text, sub}] |
| `pillars` | Array | [{title, desc, time}] |
| `mediumTermRoadmap` | Array | [{title, detail}] |
| `longTermColumns` | Array | [{title, items[]}] |

**Notably ABSENT from the template's top-level keys (exist only as auto-populated fields):**
- `localSeo` — not in template default but required by skill Step 8a
- `technicalSeo` — not in template default but required as source for normalizer
- `backlinks` — not in template default but normalizer reads `backlinks.competitorDomainMetrics`
- `contentQuality` — not in template default but normalizer reads `contentQuality.pages[]`
- `competitorAnalysis` — not in template default but normalizer reads `competitorAnalysis.pageSpeedComparison`
- `coreWebVitals` — not in template default but hoisted by normalizer from `technicalSeo.coreWebVitals`
- `internalLinking` — not in template default but derived by normalizer from link-graph.json

These fields live in the CLIENT'S audit-data.json after the audit populates them, but are absent from the starter template. This is intentional — the normalizer adds them at generate time. However, it creates a documentation gap: the template doesn't show what structure they need to be in.

---

## 4. Gaps: What the Skill Claims vs. What the Template Expects

### Gap A — `siteComparison` Column Structure Mismatch

**Template default:** `{ "metric": "...", "client": ..., "competitor": ..., "gap": "..." }` — single "competitor" key

**Skill Step 8a says:** "Use comp1..compN keys matching competitor.all order, NOT a single 'competitor' key"

**Liane Jamason's actual audit-data.json:** Uses single "competitor" key (matches old template format, not the new multi-competitor spec)

**Risk:** The HTML report's competitor comparison table expects comp1..compN. If populated with single "competitor" key, the normalizer tries to auto-map it, but success is not guaranteed for all table renderers.

### Gap B — `localSeo` Block Has No Template Scaffold

**Template:** No `localSeo` key at all.

**Skill Step 8a says:** Populate `localSeo.businessProfile`, `localSeo.competitorLocations[]`, `localSeo.searchDemandZones[]`, `localSeo.serviceAreaMap` (GeoJSON), `localSeo.accessNotes`.

**Consequence:** The implementer has no reference for the exact field names and structure. The skill text IS the reference. The HANDOFF.md local page notes confirm: "latitude and longitude are mandatory — the normalizer does NOT geocode addresses."

**For no-Google-connector audits:** `localSeo.accessNotes` should be populated with `{ gbpAccess: false, gaAccess: false, searchConsoleAccess: false, note: "Access not available — sections 1, 2, 3, and 5 show data access callouts" }`. The local page still renders the map and competitor pins from manually geocoded coordinates.

### Gap C — `technicalSeo`, `backlinks`, `contentQuality`, `competitorAnalysis` Have No Template Scaffold

**Template:** None of these top-level keys exist in the default JSON.

**Skill Step 8a says (for auto-populated fields):** "Just make sure the research files exist." But the skill does NOT say Claude should populate the `technicalSeo`, `backlinks`, or `contentQuality` objects in audit-data.json manually.

**However:** The normalizer reads `backlinks.competitorDomainMetrics` and `competitorAnalysis.pageSpeedComparison` FROM audit-data.json (not just from research files). These must exist in audit-data.json for the normalizer to use them.

**The hidden contract:** When agent outputs are compiled into audit-data.json, these additional top-level keys must be added by Claude during Step 8a — but the template provides no schema for them, and the skill only mentions them indirectly (in the "auto-populated by generator" note).

### Gap D — `keywords[]` Volume Field Is Qualitative in Template, Skill Requires Real Numbers

**Template default:** `"volume": "Very High"` — qualitative labels

**AUDIT-SOP.md Section 1.1:** "Never use qualitative labels (High/Medium/Low) for search volume — always fetch real monthly numbers."

**Skill Step 8a:** `keywords[]` — all 25 keywords with volume, client rank, competitor rank, top result.

**Gap:** The template uses qualitative labels as placeholders, but the SOP mandates real DFS numbers. The HTML report renders volume as-is, so qualitative labels will show as text, not in a sortable numeric column. If the DFS script fails or wasn't run, the implementer may not notice this is wrong.

### Gap E — `contentQuality` Structure Not in Template

**Template:** No `contentQuality` key.

**AUDIT-SOP.md Section 4.5:** "Verify contentQuality has proper structure (summary + pages[] + duplicateGroups[] + cannibalization[])"

**Skill:** Does not explicitly walk through populating contentQuality in Step 8a — it mentions it only as a verification checklist item.

**The actual structure needed** (from normalizer behavior and HANDOFF.md): `contentQuality.pages[]` with per-page readability data that the normalizer enriches from `page-text-analysis.json`.

### Gap F — `quickWins` Exists Twice with Different Schemas

**Template `quickWins` (top-level):** `{ "action": "...", "impact": "..." }` — 2 fields only

**Template `actionPlan.quickWins`:** `{ "action": "...", "why": "...", "effort": "...", "impact": "..." }` — 4 fields

**These are two separate arrays rendering on two different report sections.** The top-level `quickWins[]` feeds the index page summary. The `actionPlan.quickWins[]` feeds the full action plan table. An implementer who only populates one will leave the other blank.

### Gap G — `backlink-opportunities.json` Exists in Skill Output Inventory but Not in Normalizer List

**Skill Step 4 (Agent 6):** Writes `seo/research/backlink-opportunities.json` — full structured opportunity set for the backlinks page.

**HANDOFF.md normalizer table:** Does NOT list `backlink-opportunities.json` as one of the 6 files the normalizer reads.

**Recent commit history:** The backlinks opportunities page was added in commit `8e8793b`. It's a 9th report page. The normalizer may or may not read this file yet — needs verification against the actual generator script.

### Gap H — `pagespeed-data.json` Not Produced by Any Named Agent

**HANDOFF.md:** Lists `research/pagespeed-data.json` as a required normalizer input for CWV gauges and per-page Lighthouse scores.

**Skill output inventory (line 1108-1140):** Does NOT include `pagespeed-data.json` in the listed research files. The skill mentions `dfs-data-fetcher` as a 7th agent conceptually (AUDIT-SOP.md line 137) but Step 4 of the skill only defines 6 agents (keyword-researcher, site-crawler, content-auditor, competitor-analyzer, best-practices-researcher, backlink-researcher).

**The gap:** No agent is explicitly instructed to write `pagespeed-data.json`. The PageSpeed data exists (AUDIT-SOP.md says "PageSpeed Insights: Google PSI API") but there's no agent step that says "write the output to `research/pagespeed-data.json` in this exact format." An implementer following the skill strictly will have PSI data in a research .md file but not in the JSON the normalizer expects.

### Gap I — `domain-metrics.json` Not Produced by Any Named Agent

Same issue as Gap H. HANDOFF.md lists `research/domain-metrics.json` as a normalizer input for competitor domain metrics. The backlink-researcher agent writes `client-backlinks.json` and `backlink-analysis.md`, but the skill does not instruct any agent to write `domain-metrics.json` as a standalone file.

The normalizer falls back to `backlinks.competitorDomainMetrics` in audit-data.json — but that field has no template scaffold (see Gap C).

---

## 5. What CAN Be Gathered Without Any Google Connectors

This addresses the core question: what runs when GBP, GA4, and GSC are all absent.

### Fully Autonomous (No Auth Needed)

| Data Point | Collection Method | Output File |
|------------ |-------------------|-------------|
| All page URLs + categories | Playwright crawl-sitemap.js | crawl-data.json |
| Per-page meta tags (title, desc, canonical) | browse.js --extract-meta | crawl-data.json |
| Per-page heading structure (H1, H2, H3 count) | browse.js --extract-headings | crawl-data.json |
| Per-page word count | browse.js --extract-text | crawl-data.json |
| Per-page image alt text coverage | crawl-sitemap.js --analyze | crawl-data.json |
| Per-page schema markup types | check-technical.js | crawl-data.json |
| Per-page canonical tag presence | browse.js | crawl-data.json |
| Internal link graph (contextual links, not nav) | browse.js --extract-links per page | link-graph.json |
| Real Flesch-Kincaid readability scores | extract-text.js post-crawl | page-text-analysis.json |
| Competitor site structure + page count | crawl-sitemap.js on each competitor | competitor-analysis.md |
| Competitor meta tags + heading structure | browse.js on competitor pages | competitor-analysis.md |
| Competitor schema markup inventory | check-technical.js variant | competitor-analysis.md |
| Keyword rank positions | WebSearch tool | keyword-research.md |
| Keyword rank positions (backup) | ddg-search.js | keyword-research.md |
| Real search volume numbers | DataForSEO search_volume/live | keyword-data.json |
| SERP top-5 organic results | DataForSEO serp/organic/live | keyword-research.md |
| People Also Ask questions | DataForSEO SERP response | keyword-research.md |
| Client + competitor Domain Rating | DataForSEO backlinks/summary/live | domain-metrics.json |
| Client + competitor referring domain count | DataForSEO backlinks/summary/live | domain-metrics.json |
| Client backlink inventory (top 500) | DataForSEO backlinks/backlinks/live | client-backlinks.json |
| Client referring domains (top 200) | DataForSEO referring_domains/live | client-backlinks.json |
| Client + competitor organic keyword count | DataForSEO ranked_keywords/live | keyword-research.md |
| Client Lighthouse / Core Web Vitals | Google PSI API (public, no OAuth) | pagespeed-data.json |
| Competitor homepage PageSpeed scores | Google PSI API (public, no OAuth) | pagespeed-data.json |
| Local citation presence | WebSearch: brand name + city + directories | backlink-analysis.md |
| Competitor backlink strategies | WebSearch + WebFetch | backlink-analysis.md |
| Backlink opportunities | DFS + WebSearch intersection analysis | backlink-opportunities.json |

### Requires Google Connectors (Will Show Access Callout)

| Data Point | Connector | What's Missing |
|------------ |-----------|---------------|
| Organic traffic volume | GA4 | Sessions, users, organic channel data |
| Click-through rates by page | GSC | Impressions, clicks, CTR, position from Google |
| Exact keyword impressions | GSC | Which queries drive impressions (not just ranking position) |
| GBP rating + review count | GBP | Stars, review text, response rate, photo count |
| GBP map pack position | GBP | Whether client appears in the 3-pack |
| GBP photo count + quality | GBP | Profile completeness score |
| GBP Q&A section | GBP | Customer questions answered or unanswered |
| GA4 page-level engagement | GA4 | Bounce rate, time on page, conversion events |

---

## 6. Research Files Required by Normalizer — Current Status for Liane Jamason

| Required File | Present? | Notes |
|---------------|----------|-------|
| `research/crawl-data.json` | YES | Present |
| `research/link-graph.json` | YES | Present |
| `research/pagespeed-data.json` | NO | Missing — CWV gauges and Lighthouse per-page scores will show "No data" |
| `research/domain-metrics.json` | NO | Missing — will fall back to `backlinks.competitorDomainMetrics` in audit-data.json |
| `research/client-backlinks.json` | NO | Missing — backlink inventory table will be empty or use only what's in audit-data.json |
| `research/page-text-analysis.json` | NO | Missing — syllables/word column in readability table will be empty |
| `research/backlink-opportunities.json` | PRESENT (in research/) | Need to verify normalizer reads this for page 9 |

**Result:** 4 of 6 normalizer research files are missing for Liane Jamason. The technical page CWV section, backlink inventory, domain metrics table, and readability syllables column will all be empty or broken without these files being produced.

---

## 7. Implementation Recommendations

For running a complete audit without Google connectors:

1. **The 4 missing research files must be produced** — pagespeed-data.json (PSI API, public), client-backlinks.json (DFS), domain-metrics.json (DFS), page-text-analysis.json (extract-text.js). None require Google OAuth.

2. **pagespeed-data.json format** — the normalizer expects a specific shape. Either run the DFS PageSpeed endpoint or write PSI API results in the format the normalizer can reshape from. The HANDOFF.md says the normalizer "reshapes dict to array, or populate from pagespeed-data.json." The exact dict-vs-array shape needs verification against the generator script before assuming.

3. **Populate `localSeo` with manually geocoded coordinates** — get lat/lng from Google Maps search (no API key needed for manual lookup). The map will render correctly without GBP access. Fill `accessNotes` to explain what's unavailable.

4. **`siteComparison` should use comp1..compN keys** — the template default uses a single "competitor" key but the skill and normalizer both expect `comp1`, `comp2`, etc. The Liane Jamason audit-data.json currently uses the old single-key format.

5. **Populate both `quickWins` arrays** — top-level `quickWins[]` (2-field) AND `actionPlan.quickWins[]` (4-field) are different arrays rendering in different locations.

6. **Keywords must use real DFS numbers** — the `volume` field should be an integer (e.g., 1900), not a string label. This is required by AUDIT-SOP.md and makes the volume column sortable in the report.

---

## 8. File References

| File | Purpose |
|------|---------|
| `/mnt/c/dev/site audit/commands/seo-audit.md` | Full skill definition (Step 8a = lines 981–1040) |
| `/mnt/c/dev/site audit/template/seo/audit-data.json` | Template default schema |
| `/mnt/c/dev/site audit/HANDOFF.md` | Normalizer pipeline, 13 auto-fixes, 6 required research files |
| `/mnt/c/dev/site audit/AUDIT-SOP.md` | Mandatory standards: DFS required, real readability, no empty sections |
| `/mnt/c/dev/site audit/clients/liane-jamason/seo/audit-data.json` | Client-specific populated version |
| `/mnt/c/dev/site audit/clients/liane-jamason/seo/research/` | Research files present: crawl-data.json, link-graph.json, keyword-research.md, backlink-analysis.md, client-site-structure.md, competitor-analysis.md, content-audit.md, seo-best-practices-2026.md |
