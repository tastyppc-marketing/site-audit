# SEO Audit System — Definitive Reference

This document describes EVERYTHING the SEO audit tool does: the complete workflow, every API call, every script, every expected output, and every gap. Any session can read this and understand the full system.

Last updated: 2026-04-11

---

## What Uses AI vs What Uses APIs/Scripts

### AI-Powered Steps (Claude/Codex agents generate content)

| Step | What AI does | Output | Could be replaced by script? |
|------|-------------|--------|------------------------------|
| **keyword-researcher** | Uses WebSearch to find keywords, interprets SERP results, categorizes by intent | `keyword-research.md` | Partially — DFS keyword suggestions API exists, but intent classification needs AI |
| **content-auditor** | Reads page content via browse.js, grades quality, identifies gaps | `content-audit.md` | No — content quality judgment requires AI |
| **competitor-analyzer** | Reads competitor sites, compares strategies, identifies differentiators | `competitor-analysis.md` | No — strategic comparison requires AI |
| **best-practices-researcher** | Uses WebSearch to find current SEO best practices | `seo-best-practices-{YEAR}.md` | No — synthesizing best practices from multiple sources needs AI |
| **backlink-researcher** (research portion) | Uses WebSearch to find link opportunities, classifies backlink types | `backlink-analysis.md`, `backlink-opportunities.json` | Partially — DFS intersection API can find shared domains, but opportunity scoring needs AI |
| **report-compiler** | Reads all 6 research files, synthesizes into graded audit report with 45 action items | `FINAL-AUDIT-REPORT.md` | No — this is the core AI value: synthesizing disparate research into a coherent, actionable report |
| **meta-tags-writer** | Reads audit report + crawl data, writes optimized meta titles/descriptions for every page | `seo/content/meta-tags.md` | No — writing compelling, keyword-optimized copy is AI work |
| **schema-writer** | Reads audit report + best practices, writes production-ready JSON-LD schema for all page types | `seo/content/schema-markup.md` | Partially — schema templates could be scripted, but customization per client needs AI |
| **community-writer** | Reads audit + competitor analysis, writes 4 full community/area pages (1,000-1,500 words each) | `seo/content/community-pages.md` | No — long-form local content creation is AI work |
| **blog-writer** | Reads audit + keyword research, writes 4 SEO-optimized blog posts (900-1,200 words each) | `seo/content/blog-posts.md` | No — blog content creation is AI work |
| **reviewer** | Reviews all deliverables for quality, accuracy, consistency | `seo/content/REVIEW.md` | No — quality judgment requires AI |
| **verifier** | Validates data integrity, checks for completeness | verification report | Partially — some checks could be scripted |

### API/Script-Only Steps (No AI involved)

| Step | What it does | Output |
|------|-------------|--------|
| `crawl-sitemap.js` | Fetches robots.txt + sitemap, categorizes URLs | `crawl-data.json` (page meta, headings, links, schema) |
| `browse.js` | Playwright page browser — extracts DOM content | stdout (used by agents) |
| `check-technical.js` | Checks JSON-LD, image alt, social meta | stdout (used by agents) |
| `gather-pagespeed.js` | Calls Google PSI API | `pagespeed-data.json` |
| `gather-domain-metrics.js` | Calls DFS backlinks/summary API | `domain-metrics.json` |
| `gather-backlinks.js` | Calls DFS backlinks + referring_domains APIs | `client-backlinks.json` |
| `extract-text.js` | Playwright text extraction + Flesch-Kincaid scoring | `page-text-analysis.json` |
| `build_audit.py` | Runs 10 Python analyzers on research data | `audit-data.json` |
| `generate-multipage-report.js` | Normalizes data + injects into 9 HTML templates | 9 HTML report pages |

### Python Analyzers (No AI — algorithmic analysis)

| Analyzer | What it computes | AI-free? |
|----------|-----------------|----------|
| `ContentQualityAnalyzer` | Word counts, readability scores, content grading | Yes — pure NLP/stats |
| `InternalLinkAnalyzer` | Link graph metrics, orphan detection, hub clusters | Yes — graph algorithms |
| `TechnicalSeoAnalyzer` | Meta tag audit, schema validation, crawl issues | Yes — rule-based checks |
| `BacklinkAnalyzer` | Backlink metrics, competitor comparison, opportunity scoring | Yes — API data + scoring formulas |
| `CompetitorAnalyzer` | Domain comparison, keyword overlap | Yes — API data + comparison logic |
| `LocalSeoAnalyzer` | NAP consistency, GBP completeness, review sentiment | Yes — rule-based + sentiment scoring |
| `IndexCrawlabilityAnalyzer` | Robots.txt, sitemap, indexability | Yes — rule-based checks |
| `EEATSignalAnalyzer` | E-E-A-T signal detection from page content | Yes — heuristic pattern matching |
| `ContentGapAnalyzer` | Keyword gaps, topical authority mapping | Yes — set operations on keyword data |
| `ReportingIntelligenceAnalyzer` | Auto-generates topIssues, quickWins, actionPlan, overall grade | Yes — scoring formulas on all prior data |

### Summary: Where AI Adds Value vs Where It Doesn't

**AI is essential for:** Content creation (meta tags, schema, community pages, blog posts), strategic synthesis (report compilation, competitor strategy analysis), and quality judgment (content auditing, review).

**AI is NOT needed for:** Data gathering (APIs/scripts), technical analysis (Python analyzers), report rendering (HTML generator), and data normalization (normalizer).

**The workflow should never use AI to fabricate data.** All numbers must come from APIs or scripts. AI synthesizes, analyzes, and writes — it doesn't invent metrics.

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
**This is the step that's often incomplete.** `audit-data.json` must contain 29+ top-level keys. Some are auto-populated by the normalizer from research files. Others must come from the Python pipeline or manual population.

**Legend:**
- `EXISTS *Integrated` — Script/analyzer exists AND is called in the workflow
- `EXISTS *Not Integrated` — Script/analyzer exists but is NOT called in the standard workflow
- `NO SCRIPT *Needed` — No script exists; needs to be built or the data must be entered manually

| Data key | Auto-pop? | Integration Status |
|----------|-----------|-------------------|
| `client` | No | `ReportingIntelligenceAnalyzer` EXISTS *Not Integrated — produces grade/summary; name/domain/location still manual |
| `competitor` | No | NO SCRIPT *Needed — primary + all[] must be manual input at Step 0 |
| `topIssues` | No | `ReportingIntelligenceAnalyzer` EXISTS *Not Integrated — auto-generates from all prior step data |
| `keyStats` | Partial | Normalizer auto-derives 4; first 6-8 from `ReportingIntelligenceAnalyzer` EXISTS *Not Integrated |
| `siteComparison` | No | NO SCRIPT *Needed — must be populated from competitor-analysis.md (manual or new auto-populator) |
| `keywords` | No | NO SCRIPT *Needed [auto-populator from keyword-research.md] — currently manual JSON entry |
| `competitorComparison` | No | NO SCRIPT *Needed [auto-populator from competitor-analysis.md] — currently manual JSON entry |
| `competitorStrategies` | No | NO SCRIPT *Needed [auto-populator from competitor-analysis.md] — currently manual JSON entry |
| `contentQuality` | No | `ContentQualityAnalyzer` EXISTS *Not Integrated — reads crawl-data.json pages |
| `technicalSeo.coreWebVitals` | Yes | `gather-pagespeed.js` EXISTS *Integrated — normalizer auto-populates from pagespeed-data.json |
| `technicalSeo.lighthouseResults` | Yes | `gather-pagespeed.js` EXISTS *Integrated — normalizer auto-populates from pagespeed-data.json |
| `technicalSeo.pageAudits` | Yes | `crawl-sitemap.js` EXISTS *Integrated — normalizer auto-populates from crawl-data.json |
| `technicalSeo.pageSpeedComparison` | Yes | `gather-pagespeed.js` EXISTS *Integrated — normalizer auto-populates from pagespeed-data.json |
| `technicalSeo.metaTagSummary` | No | `TechnicalSeoAnalyzer` EXISTS *Not Integrated — produces full meta tag analysis from crawl-data.json |
| `technicalSeo.metaTagIssues` | No | `TechnicalSeoAnalyzer` EXISTS *Not Integrated — same analyzer |
| `technicalSeo.schemaSummary` | No | `TechnicalSeoAnalyzer` EXISTS *Not Integrated — same analyzer |
| `technicalSeo.crawlIssues` | No | `TechnicalSeoAnalyzer` EXISTS *Not Integrated — same analyzer |
| `internalLinking` | Mostly | `InternalLinkAnalyzer` EXISTS *Not Integrated (Python); Normalizer EXISTS *Integrated (link-graph.json BFS) |
| `backlinks.topBacklinks` | Yes | `gather-backlinks.js` EXISTS *Integrated — normalizer auto-populates from client-backlinks.json |
| `backlinks.topReferringDomains` | Yes | `gather-backlinks.js` EXISTS *Integrated — normalizer auto-populates from client-backlinks.json |
| `backlinks.domainMetrics` | Yes | `gather-domain-metrics.js` EXISTS *Integrated — normalizer compat bridge |
| `domainMetrics` | Yes | `gather-domain-metrics.js` EXISTS *Integrated — normalizer auto-populates from domain-metrics.json |
| `backlinkOpportunities` | Partial | `BacklinkAnalyzer.find_link_opportunities()` EXISTS *Not Integrated (Python); normalizer builds skeleton from available data |
| `localSeo` | No | `LocalSeoAnalyzer` EXISTS *Not Integrated — needs local-seo.json + reviews.json inputs that nothing produces |
| `localSeo.businessProfile` | No | `BusinessProfileConnector` EXISTS *Not Integrated — needs GBP_ACCOUNT_ID/LOCATION_ID per client |
| `localSeo.reviewSentiment` | No | `BusinessProfileConnector.get_reviews()` EXISTS *Not Integrated — same GBP access requirement |
| `actionPlan` | No | `ReportingIntelligenceAnalyzer` EXISTS *Not Integrated — auto-generates quickWins/shortTerm/mediumTerm/longTerm |
| `contentCalendar` | No | NO SCRIPT *Needed — must be populated from FINAL-AUDIT-REPORT.md (manual or new auto-populator) |
| `quickWins` | No | `ReportingIntelligenceAnalyzer` EXISTS *Not Integrated — auto-generates from all prior data |
| `advantages` | No | NO SCRIPT *Needed — manual competitive advantage analysis |
| `nextSteps` | No | NO SCRIPT *Needed — manual recommended next steps |
| `searchConsoleData` | No | `SearchConsoleConnector` EXISTS *Not Integrated — needs per-client SEARCH_CONSOLE_SITE_URL |
| `trafficData` | No | `GA4Connector` EXISTS *Not Integrated — needs per-client GA4_PROPERTY_ID |
| `rankHistory` | No | `run_rank_tracker.py` + `RankTracker` EXISTS *Not Integrated — standalone script, not in workflow |
| `indexationCrawlability` | No | `IndexCrawlabilityAnalyzer` EXISTS *Not Integrated — reads crawl-data.json + optional SC data |
| `eeatSignals` | No | `EEATSignalAnalyzer` EXISTS *Not Integrated — reads crawl-data.json pages |
| `contentGap` | No | `ContentGapAnalyzer` EXISTS *Not Integrated — needs DFS organic keywords API |
| `competitorAnalysis` | No | `CompetitorAnalyzer` EXISTS *Not Integrated — needs DFS + competitor domains |

**Summary:**
- **Integrated (auto-populate via normalizer):** 10 fields — CWV, lighthouse, pageAudits, pageSpeedComparison, internalLinking (partial), backlinks, referringDomains, domainMetrics, keyStats (partial), backlinkOpportunities (skeleton)
- **EXISTS but Not Integrated:** 15 fields — all Python analyzers exist but `build_audit.py` is not called in the `/seo-audit` skill workflow
- **No Script Needed:** 6 fields — siteComparison, keywords, competitorComparison, competitorStrategies, contentCalendar, advantages/nextSteps (these need auto-populators from research .md files)

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
| DFS backlinks/summary | `api.dataforseo.com/v3/backlinks/summary/live` | $0.02/call flat | DR, referring domains, backlink count per domain | `DATAFORSEO_LOGIN/PASSWORD` |
| DFS backlinks/backlinks | `api.dataforseo.com/v3/backlinks/backlinks/live` | $0.02 + $0.00003/row | Individual backlink details (source, anchor, dofollow). 200 rows = $0.026 | Same |
| DFS backlinks/referring_domains | `api.dataforseo.com/v3/backlinks/referring_domains/live` | $0.02 + $0.00003/row | Referring domain list with metrics. 200 rows = $0.026 | Same |
| DFS domain_intersection | `api.dataforseo.com/v3/backlinks/domain_intersection/live` | ~$0.02 + rows | Up to 20 domains per request. Finds shared referring domains | Same |
| DFS keyword volume | `api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live` | $0.075/task (up to 1,000 keywords!) | Monthly search volume, CPC, competition, trends | Same |
| DFS SERP organic | `api.dataforseo.com/v3/serp/google/organic/live` | $0.002/SERP (10 results) | Live ranking check for a keyword | Same |
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

### Gap 1: Numeric keyword volumes
- **Current:** keyword-researcher records "High/Medium/Low" from web search
- **Script:** `DataForSEOConnector.get_keyword_data()` EXISTS *Not Integrated
- **Needed:** Add DFS keyword volume lookup step after keyword list is built (Step 3.5)
- **Cost:** ~$0.01-0.02 per keyword × 25 keywords = ~$0.25-0.50 per audit
- **Impact:** Keywords page Section 2 (volume chart) is always empty
- **Status:** CLOSEABLE — connector method exists, just needs workflow step

### Gap 2: Competitor backlink scraping
- **Current:** `gather-backlinks.js` only runs for client domain
- **Script:** `gather-backlinks.js` EXISTS *Integrated (client only)
- **Needed:** Run for each competitor too, capped at 200 backlinks per competitor
- **Cost:** ~$0.02 per backlinks/live call + ~$0.02 per referring_domains/live call = ~$0.04/competitor × 5 competitors = ~$0.20 per audit
- **Impact:** Backlink opportunity summary shows zeros, do-follow ratio is 0% for competitors
- **Workflow:** Should prompt user "Scrape competitor backlinks? (costs ~$0.20 in API credits)"
- **Status:** CLOSEABLE — same script, just needs loop + user prompt

### Gap 3: backlink-opportunities.json
- **Current:** backlink-researcher agent is supposed to produce this, but often doesn't
- **Script:** `BacklinkAnalyzer.find_link_opportunities()` EXISTS *Not Integrated (Python)
- **Also:** `DataForSEOConnector.get_backlink_intersection()` EXISTS *Not Integrated
- **Needed:** After competitor backlinks are scraped (Gap 2), run intersection analysis
- **Cost:** ~$0.02 per intersection call × 5 competitors = ~$0.10 per audit
- **Impact:** Entire backlink opportunities page is nearly empty
- **Status:** CLOSEABLE — Python method exists, needs workflow integration or Node.js equivalent

### Gap 4: Local SEO data
- **Current:** No Node.js script gathers local SEO data. Python `LocalSeoAnalyzer` exists but needs `local-seo.json` and `reviews.json` inputs
- **Script:** `LocalSeoAnalyzer` EXISTS *Not Integrated; `BusinessProfileConnector` EXISTS *Not Integrated; `LocalSEOConnector` EXISTS *Not Integrated
- **Needed:** Either (a) GBP API gathering script (requires per-client GBP access) or (b) web-research based local SEO agent that produces local-seo.json
- **Impact:** Local page shows "data not collected"
- **Status:** PARTIALLY CLOSEABLE — Python analyzers exist but need GBP credentials per client; web-research fallback needs a new agent

### Gap 5: GSC/GA4 integration
- **Current:** Env vars point to one client (Murray Gardner). No per-client switching
- **Script:** `SearchConsoleConnector` EXISTS *Not Integrated; `GA4Connector` EXISTS *Not Integrated
- **Needed:** Per-client credentials stored in client config, not global .env
- **Impact:** Keywords sections 4-5 (Search Console, Traffic) are empty for all clients without access
- **Status:** CLOSEABLE for clients who grant access — connectors work, need per-client credential management

### Gap 6: Rank tracking
- **Current:** `run_rank_tracker.py` + `RankTracker` class EXISTS *Not Integrated
- **Needed:** Optional step after keyword list is built; inject into audit-data.json
- **Impact:** Keywords section 6 (Rank History) is always empty on first audit
- **Status:** CLOSEABLE — script exists with check/compare/inject modes, needs workflow step

### Gap 7: audit-data.json manual population (THE BIG GAP)
- **Current:** 6 fields have NO SCRIPT and require manual population from Markdown research files: `siteComparison`, `keywords[]`, `competitorComparison[]`, `competitorStrategies[]`, `contentCalendar`, `advantages/nextSteps`
- **Script:** NO SCRIPT *Needed [md-to-json auto-populator]
- **Needed:** A new script or normalizer step that reads the Markdown research files and extracts structured data into JSON keys
- **Impact:** Report has empty sections unless someone manually fills in the JSON
- **Status:** NEEDS NEW SCRIPT — this is the biggest integration gap

### Gap 8: Python pipeline not called in /seo-audit workflow
- **Current:** `build_audit.py` orchestrates 10 Python analyzers that produce 15 data fields. But the `/seo-audit` skill never calls it.
- **Script:** `build_audit.py` EXISTS *Not Integrated
- **Needed:** Add `python platform/scripts/build_audit.py --type seo --domain {CLIENT_DOMAIN} --research-dir seo/research --output seo/audit-data.json` as a step after data gathering
- **Impact:** 15 data fields (contentQuality, technicalSeo details, localSeo, eeat, indexation, reporting) are missing unless manually populated
- **Status:** CLOSEABLE — script exists and works, just needs to be called in the workflow

### Gap 9: DFS "rank" mislabeled as "Domain Rating"
- **Current:** DFS API returns `rank` (0-1000 proprietary scale). Python connector (`dataforseo.py:511`) maps it to `domain_rating`. Node.js script (`gather-domain-metrics.js:113`) maps it to `domainRating`. Renderers display as "DR: 173" — misleading because "DR" implies Ahrefs 0-100 scale.
- **Fix:** Renderer-only change — relabel from "DR" / "Domain Rating" to "Authority Score" or "DFS Rank" in all display contexts. No data pipeline changes. No Ahrefs needed.
- **Impact:** Labels become accurate; users see "Authority Score: 173/1000" instead of "DR: 173"
- **Status:** CLOSEABLE — display label change only

### Gap 10: SEO Best Practices file duplication
- **Current:** Each client gets its own copy of `seo-best-practices-{YEAR}.md` in their research folder. Also exists as a stale Calgary-specific copy in the template: `template/reports/multipage/seo-best-practices-2026-calgary-castles.md`
- **Needed:** Single source of truth at project root (e.g., `docs/seo-best-practices-2026.md`). Agents read and update this file. Clients don't get copies — they reference the shared one.
- **Impact:** Best practices drift between clients; Calgary-specific content pollutes template
- **Status:** CLOSEABLE — move file, update agent prompt to reference shared location

---

## Closing the Gaps — Priority Order

### Per-Audit API Cost Estimate (all gaps closed)

| API call | Count | Cost |
|----------|-------|------|
| DFS keyword volume (25 keywords in 1 task) | 1 | $0.075 |
| DFS backlinks/summary (client + 5 comps) | 6 | $0.12 |
| DFS backlinks/backlinks 200 rows (client + 5 comps) | 6 | $0.156 |
| DFS backlinks/referring_domains 200 rows (client + 5 comps) | 6 | $0.156 |
| DFS domain_intersection (1 call, all 6 domains) | 1 | ~$0.05 |
| DFS SERP checks (25 keywords) | 25 | $0.05 |
| Google PSI (6 domains × 2 strategies) | 12 | Free |
| **Total DFS per audit** | | **~$0.61** |

Note: DFS Backlinks API requires $100/month minimum commitment (credits, not a fee — spent across all DFS APIs).

### Gap Closure Priority

| Priority | Gap | Effort | Cost/audit | Impact |
|----------|-----|--------|-----------|--------|
| 1 | Gap 8: Call build_audit.py in workflow | Low | $0 | Unlocks 15 data fields |
| 2 | Gap 2: Competitor backlink scraping (200/comp) | Low | ~$0.36 | Unlocks backlink comparison |
| 3 | Gap 1: DFS numeric keyword volumes | Low | $0.075 | Unlocks volume chart |
| 4 | Gap 3: Backlink intersection/opportunities | Medium | ~$0.05 | Fills opportunities page |
| 5 | Gap 7: Markdown → JSON auto-populator | High | $0 | Eliminates manual data entry |
| 6 | Gap 9: Real Domain Rating via Ahrefs MCP | Low | $0 (included in Ahrefs plan) | Fixes wrong DR values |
| 7 | Gap 10: Best practices single source | Low | $0 | Stops file duplication |
| 8 | Gap 6: Rank tracking in workflow | Low | $0.05 (25 SERP checks) | Adds rank history chart |
| 9 | Gap 5: Per-client GSC/GA4 | Medium | $0 | Unlocks SC + traffic sections |
| 10 | Gap 4: Local SEO data gathering | High | $0-varies | Fills local SEO page |
