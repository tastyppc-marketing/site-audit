# SEO Audit System — Definitive Reference

This document describes EVERYTHING the SEO audit tool does: the complete workflow, every API call, every script, every expected output, and every gap. Any session can read this and understand the full system.

Last updated: 2026-04-11

---

## What This Tool Does

Produces a 9-page interactive HTML report analyzing a client's SEO against their competitors. The report covers: overview/grade, keyword rankings, content quality, technical SEO, internal links, backlink opportunities, competitor comparison, local SEO, and an action plan with deliverables.

## The Two Pipelines

There are TWO separate data pipelines that feed the report. Understanding this is critical:

### Pipeline A: `/seo-audit` Skill (Node.js + Claude agents)
- **Entry point:** `commands/seo-audit.md`
- **Produces:** Markdown research files + JSON data files
- **Used for:** Quick audits, agent-driven research, data gathering

### Pipeline B: `build_audit.py` (Python analyzers)
- **Entry point:** `platform/scripts/build_audit.py`
- **Produces:** `audit-data.json` (the structured data the report needs)
- **Used for:** Deep analysis with Python NLP, link graph analysis, local SEO scoring

### The Gap Between Them
Pipeline A produces rich Markdown files but does NOT automatically translate them into `audit-data.json`. Pipeline B reads research files and produces JSON, but only works with specific file formats. **Currently, a human must bridge these** — either by running `build_audit.py` after the agents finish, or by manually populating `audit-data.json` from the Markdown research.

---

## Complete Workflow (End to End)

### Phase 1: Setup
| Step | What happens | Output |
|------|-------------|--------|
| 1.1 | User provides: domain, name, company, competitors, location, service type | Variables for all subsequent steps |
| 1.2 | Copy `template/` to `clients/{slug}/` | Client project directory |
| 1.3 | Install npm deps (playwright, xlsx, pptxgenjs) | `node_modules/` |

### Phase 2: Research (6 Parallel Agents)
| Agent | What it does | Scripts called | Output files |
|-------|-------------|---------------|-------------|
| keyword-researcher | Finds 25 keywords across 5 categories, checks rankings | WebSearch, ddg-search.js | `seo/research/keyword-research.md` |
| site-crawler | Crawls sitemap, browses pages, builds link graph | crawl-sitemap.js, browse.js | `seo/research/crawl-data.json`, `seo/research/link-graph.json`, `seo/research/client-site-structure.md` |
| content-auditor | Grades content quality per page | browse.js | `seo/research/content-audit.md` |
| competitor-analyzer | Compares competitors on all dimensions | crawl-sitemap.js, browse.js, WebSearch | `seo/research/competitor-analysis.md` |
| best-practices-researcher | Researches current SEO best practices | WebSearch | `seo/research/seo-best-practices-{YEAR}.md` |
| backlink-researcher | Analyzes backlink profile, finds opportunities | run_backlink_analysis.py, WebSearch | `seo/research/backlink-analysis.md`, `seo/research/client-backlinks.json`, `seo/research/backlink-opportunities.json` |

### Phase 3: Data Gathering (4 Sequential Scripts)
| Script | API | Auth needed | Output |
|--------|-----|------------|--------|
| `gather-pagespeed.js` | Google PSI v5 | `PAGESPEED_API_KEY` (optional) | `seo/research/pagespeed-data.json` |
| `gather-domain-metrics.js` | DFS backlinks/summary | `DATAFORSEO_LOGIN/PASSWORD` | `seo/research/domain-metrics.json` |
| `gather-backlinks.js` | DFS backlinks + referring_domains | `DATAFORSEO_LOGIN/PASSWORD` | `seo/research/client-backlinks.json` |
| `extract-text.js` | Playwright (local) | None | `seo/research/page-text-analysis.json` |

### Phase 4: Data Population
**This is the step that's often incomplete.** `audit-data.json` must contain 29 top-level keys. Some are auto-populated by the normalizer from research files. Others must come from the Python pipeline or manual population.

| Data key | Auto-populated by normalizer? | Source if not auto |
|----------|------------------------------|-------------------|
| `client` | No | Manual — name, domain, grade, summary |
| `competitor` | No | Manual — primary + all competitors list |
| `topIssues` | No | Manual or Python `reporting` step |
| `keyStats` | Partially (4 auto-derived) | Manual for first 6-8, normalizer adds 4 more |
| `siteComparison` | No | Manual from competitor-analysis.md |
| `keywords` | No | Manual from keyword-research.md |
| `competitorComparison` | No | Manual from competitor-analysis.md |
| `competitorStrategies` | No | Manual from competitor-analysis.md |
| `contentQuality` | No | Python `content_quality` step, or manual |
| `technicalSeo.coreWebVitals` | Yes | From `pagespeed-data.json` |
| `technicalSeo.lighthouseResults` | Yes | From `pagespeed-data.json` |
| `technicalSeo.pageAudits` | Yes | From `crawl-data.json` |
| `technicalSeo.pageSpeedComparison` | Yes | From `pagespeed-data.json` |
| `technicalSeo.metaTagSummary` | No | Manual or Python `technical_seo` step |
| `technicalSeo.metaTagIssues` | No | Manual or Python `technical_seo` step |
| `technicalSeo.schemaSummary` | No | Manual from site-structure.md |
| `technicalSeo.crawlIssues` | No | Manual from crawl data |
| `internalLinking` | Mostly yes | From `link-graph.json` (orphans, hubs, depth via BFS) |
| `backlinks.topBacklinks` | Yes | From `client-backlinks.json` |
| `backlinks.topReferringDomains` | Yes | From `client-backlinks.json` |
| `backlinks.domainMetrics` | Yes (via compat bridge) | From `domain-metrics.json` |
| `domainMetrics` | Yes | From `domain-metrics.json` |
| `backlinkOpportunities` | Partially | From `backlink-opportunities.json` (if it exists) |
| `localSeo` | No | Python `local_seo` step, or manual |
| `actionPlan` | No | Manual from FINAL-AUDIT-REPORT.md |
| `contentCalendar` | No | Manual from FINAL-AUDIT-REPORT.md |
| `quickWins` | No | Manual or Python `reporting` step |
| `advantages` | No | Manual |
| `nextSteps` | No | Manual |
| `searchConsoleData` | No | GSC API (requires access per client) |
| `trafficData` | No | GA4 API (requires access per client) |
| `rankHistory` | No | `run_rank_tracker.py` (optional) |

### Phase 5: Report Compilation
A `report-compiler` agent reads all 6 Markdown research files and writes `seo/reports/FINAL-AUDIT-REPORT.md` (8 sections, 45 action items, content calendar).

### Phase 6: Implementation (4 Parallel Agents)
| Agent | Output |
|-------|--------|
| meta-tags-writer | `seo/content/meta-tags.md` |
| schema-writer | `seo/content/schema-markup.md` |
| community-writer | `seo/content/community-pages.md` |
| blog-writer | `seo/content/blog-posts.md` |

### Phase 7: Report Generation
```bash
cd clients/{slug}/reports/multipage
node generate-multipage-report.js
```
- Reads `seo/audit-data.json`
- Auto-populates from `seo/research/*.json` (17 normalizer fixes)
- Injects data into 9 HTML templates
- Copies shared/, pages/, assets/ to output directory

### Phase 8: Review & Verification
- Reviewer agent checks report
- Verifier agent validates data integrity

---

## API Inventory

| API | Endpoint | Cost | What it provides | Env vars |
|-----|---------|------|-----------------|----------|
| Google PSI v5 | `googleapis.com/pagespeedonline/v5/runPagespeed` | Free (25K/day with key) | Performance scores, CWV, Lighthouse results, speed opportunities | `PAGESPEED_API_KEY` |
| Google Custom Search | `googleapis.com/customsearch/v1` | Free (100/day), $5/1K paid | Keyword ranking checks, SERP data | `GOOGLE_API_KEY`, `GOOGLE_CSE_CX` |
| DFS backlinks/summary | `api.dataforseo.com/v3/backlinks/summary/live` | ~$0.02/call | DR, referring domains, backlink count per domain | `DATAFORSEO_LOGIN/PASSWORD` |
| DFS backlinks/backlinks | `api.dataforseo.com/v3/backlinks/backlinks/live` | ~$0.02/call | Individual backlink details (source, anchor, dofollow) | Same |
| DFS backlinks/referring_domains | `api.dataforseo.com/v3/backlinks/referring_domains/live` | ~$0.02/call | Referring domain list with metrics | Same |
| DFS SERP/keyword | Various keyword endpoints | Varies | Numeric search volumes, keyword difficulty, CPC | Same |
| Google Analytics 4 | GA4 Data API | Free | Session data, traffic channels, conversions | `GA4_PROPERTY_ID`, OAuth tokens |
| Google Search Console | SC API | Free | Clicks, impressions, CTR, position, top queries/pages | `SEARCH_CONSOLE_SITE_URL`, service account |
| Google Business Profile | GBP API | Free | Reviews, ratings, business info | `GBP_ACCOUNT_ID/LOCATION_ID` |
| Playwright (local) | N/A | Free | Page content, screenshots, DOM analysis | None |

---

## Expected Output Formats

### pagespeed-data.json
```json
{
  "data": {
    "client": [{ "url": "...", "domain": "...", "mobile": { "performanceScore": 0.64, "lcp": 10914, "fcp": 3151, "cls": 0.001, "inp": null, "ttfb": 4, "speedIndex": 5497, "opportunities": [{"title": "...", "savings": 300}] }, "desktop": {...} }],
    "competitors": [...]
  },
  "coreWebVitals": { "mobile": {...}, "desktop": {...} },
  "pageSpeedComparison": [{ "domain": "...", "mobileScore": 0.64, "desktopScore": 0.94, "isClient": true }, ...],
  "errors": [], "status": "success", "gatheredAt": "ISO"
}
```

### domain-metrics.json
```json
{
  "data": [{ "domain": "...", "domainRating": 174, "referringDomains": 259, "backlinks": 384, "organicTraffic": null, "organicKeywords": null, "trafficValue": null, "isClient": true }, ...],
  "errors": [], "status": "success", "gatheredAt": "ISO"
}
```
**Note:** `organicTraffic`, `organicKeywords`, `trafficValue` are ALWAYS null from this endpoint. They require DFS organic keywords endpoint or GSC data.

### client-backlinks.json
```json
{
  "domain": "...", "totalBacklinks": 376, "referringDomains": 200,
  "backlinks": [{ "source_url": "...", "target_url": "...", "anchor_text": "...", "domain_rating": 45, "is_dofollow": true, "first_seen": "2024-..." }],
  "referring_domains": [{ "domain": "...", "rank": 245, "backlinks": 3, "first_seen": "...", "dofollow": 2, "referring_pages": 3 }],
  "errors": [], "status": "success", "gatheredAt": "ISO"
}
```

### page-text-analysis.json
```json
{
  "pages": [{ "url": "...", "title": "...", "wordCount": 850, "sentenceCount": 42, "syllableCount": 1280, "fleschReadingEase": 46.2, "fleschKincaidGrade": 12.1, "avgWordsPerSentence": 20.2, "avgSentenceLength": 20.2, "avgSyllablesPerWord": 1.5 }],
  "summary": { "totalPages": 50, "avgFleschReadingEase": 46.2, "avgFleschKincaidGrade": 12.1, "avgWordCount": 850 },
  "errors": [], "status": "success", "gatheredAt": "ISO"
}
```

### crawl-data.json (from site-crawler agent)
```json
{
  "domain": "...", "crawlDate": "...", "totalUrls": 7291, "contentPages": 1664,
  "pages": [{ "url": "...", "title": "...", "metaDescription": "...", "h1": "...", "h2s": [...], "wordCount": 850, "imgCount": 12, "imgsMissingAlt": 8, "hasSchema": false, "schemaTypes": [], "canonicalUrl": "...", "issues": ["missing_meta_description", "missing_h1"] }]
}
```

### link-graph.json (from site-crawler agent)
```json
{
  "domain": "...", "crawlDate": "...",
  "edges": { "https://example.com/page-a": ["https://example.com/page-b", "https://example.com/page-c"], ... }
}
```

---

## Reference: What a Complete Report Looks Like

Based on Calgary Castles (most complete client):

### audit-data.json — 29 top-level keys:
```
client{13}                    — name, domain, grade, summary, service type, location
competitor{3}                 — primary domain + all[] array
topIssues[8]                  — issue, detail, impact, effort
keyStats[12]                  — value, label, severity (red/orange/green)
siteComparison[8]             — metric, client, competitor (or comp1..compN), gap
keywords[25]                  — keyword, volume, clientRank, competitorRank, topResult
competitorComparison[8]       — metric, client, comp1..comp5, gap
competitorStrategies[6]       — competitor, strategy name, detail
contentQuality{7}             — pages[], readability, quality scores
technicalSeo{17}              — CWV, lighthouse, pageAudits, meta tags, schema, crawl issues
internalLinking{20}           — orphans, hubs, depth, link stats
backlinks{6}                  — domainMetrics, topBacklinks, competitorDomainMetrics, dofollow
localSeo{8}                   — businessProfile, competitors, reviews, searchDemandZones
indexationCrawlability{5}     — robots, sitemap, indexability stats
eeatSignals{5}                — experience, expertise, authority, trust indicators
actionPlan{4}                 — quickWins[], shortTerm[], mediumTerm[], longTerm[]
quickWins[12]                 — action, impact, effort
contentCalendar{6}            — month1..month3 with week-by-week topics
advantages[5]                 — title, detail
nextSteps[6]                  — text, sub-text
pillars[4]                    — title, desc, time
mediumTermRoadmap[8]          — title, detail
longTermColumns[4]            — title, items[]
deliverables[4]               — title, status, description
keyPagesCreated[4]            — title, url, description
blogPostsCreated[4]           — title, url, description
reportingIntelligence{7}      — KPIs, tracking setup
rankHistory{5}                — snapshots[], chartLabels[], keywords{}
```

### P3 Realty has additional keys (when GSC/GA4 are connected):
```
searchConsoleData{7}          — totalClicks, totalImpressions, avgCtr, avgPosition, topQueries[25], topPages[25]
trafficData{4}                — totalSessions, acquisitionChannels[], topLandingPages[], bounceRate
coreWebVitals{2}              — mobile{}, desktop{} (top-level, separate from technicalSeo)
domainMetrics{2}              — client{}, competitors[]
linkOpportunities{2}          — opportunities[], summary{}
```

---

## Known Gaps and Workflow Issues

### 1. Numeric keyword volumes
- **Current:** keyword-researcher records "High/Medium/Low" from web search
- **Needed:** DataForSEO keyword data API call for monthly search volume numbers
- **Impact:** Keywords page Section 2 (volume chart) is always empty

### 2. Competitor backlink scraping
- **Current:** `gather-backlinks.js` only runs for client domain
- **Needed:** Run for each competitor too (costs ~$0.04/competitor)
- **Impact:** Backlink opportunity summary shows zeros, do-follow ratio is 0% for competitors
- **Workflow:** Should prompt user "Scrape competitor backlinks? (costs API credits)"

### 3. backlink-opportunities.json
- **Current:** backlink-researcher agent is supposed to produce this, but often doesn't
- **Needed:** Reliable generation from client + competitor backlink intersection
- **Impact:** Entire backlink opportunities page is nearly empty

### 4. Local SEO data
- **Current:** No Node.js script gathers this. Python `local_seo` step exists but needs `local-seo.json` and `reviews.json` which nothing produces
- **Needed:** Either a GBP API gathering script or web-research based local SEO data
- **Impact:** Local page shows "data not collected"

### 5. GSC/GA4 integration
- **Current:** Env vars point to one client (Murray Gardner). No per-client switching
- **Needed:** Per-client GSC/GA4 credentials or service account with multi-property access
- **Impact:** Keywords sections 4-5 (Search Console, Traffic) are empty for all clients except Murray

### 6. Rank tracking
- **Current:** `run_rank_tracker.py` exists but isn't called in standard workflow
- **Needed:** Optional step after keyword list is built
- **Impact:** Keywords section 6 (Rank History) is always empty on first audit

### 7. audit-data.json manual population
- **Current:** Many fields (client, topIssues, keyStats, actionPlan, contentCalendar, etc.) require manual population from Markdown research files
- **Needed:** An automated step that reads research .md files and writes the JSON keys
- **Impact:** Report has empty sections unless someone manually fills in the JSON

### 8. DFS "rank" vs real Domain Rating
- **Current:** `gather-domain-metrics.js` reads DFS `rank` field (0-1000 proprietary scale) and labels it `domainRating`
- **Needed:** Map to a 0-100 scale or use Ahrefs DR (via Ahrefs MCP)
- **Impact:** DR values like 174, 245, 320 look wrong in the report (real DR is 0-100)
