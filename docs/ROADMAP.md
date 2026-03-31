# Site-Audit Tool — Roadmap & Planning

**Created:** March 22, 2026
**Last Updated:** March 22, 2026 (Content Quality Analyzer + Internal Link Graph complete)
**Purpose:** Track what's built, what's planned, cost implications, and implementation status.

---

## Table of Contents

1. [Current Inventory](#current-inventory)
2. [Roadmap — Planned Features](#roadmap--planned-features)
3. [Deep Competitor Analysis Vision](#deep-competitor-analysis-vision)
4. [Cost Analysis](#cost-analysis)
5. [Implementation Log](#implementation-log)

---

## Current Inventory

Everything currently built and functional in the site-audit tool.

### API Connectors (12 total)

| # | Connector | File | What It Does |
|---|-----------|------|-------------|
| 1 | **Search Console** | `connectors/search_console.py` | Queries, pages, devices, countries, indexing status. 90-day default window. |
| 2 | **GA4** | `connectors/ga4.py` | Landing pages, acquisition channels, page performance, device segmentation. |
| 3 | **Google Ads** | `connectors/google_ads.py` | Campaigns, ad groups, keywords (w/ quality score), search terms, recommendations. |
| 4 | **DataForSEO** | `connectors/dataforseo.py` | SERP, keyword data, suggestions, local pack, backlinks (summary, individual, referring domains, competitors, intersection), domain metrics. Largest connector. |
| 5 | **PageSpeed Insights** | `connectors/pagespeed.py` | Lab metrics (LCP, CLS, FCP, Speed Index, TTFB, INP), performance score, opportunities, diagnostics. Single + batch. |
| 6 | **CrUX** | `connectors/crux.py` | Real-user Core Web Vitals (p75). Phone, desktop, tablet. URL + origin level. |
| 7 | **Google Business Profile** | `connectors/business_profile.py` | Locations, daily performance (search/maps impressions, calls, visits, directions), search keywords, reviews + replies, verification status. |
| 8 | **Local SEO** | `connectors/local_seo.py` | NAP consistency checking, local pack detection, GBP completeness scoring (0-100), citation opportunity finder by industry. |
| 9 | **Brand Mentions** | `connectors/brand_mentions.py` | Reddit (public JSON API), web mentions (DuckDuckGo), YouTube (ytInitialData), directory listings (Yelp, BBB, Realtor, Zillow, Facebook), review aggregation. |
| 10 | **Social Audit** | `connectors/social_audit.py` | Profile discovery (URL patterns + website scraping) across 7 platforms (FB, IG, YouTube, LinkedIn, X, TikTok, Pinterest). Social presence scoring 0-100. |
| 11 | **Auth (OAuth)** | `auth/oauth.py` | Google OAuth2 refresh token flow. |
| 12 | **Auth (Service Account)** | `auth/service_account.py` | Google service account JSON key auth. |

### Data Models (4 categories, Pydantic)

| Category | Models |
|----------|--------|
| **SEO** | KeywordRecord, BacklinkRecord, OrganicKeywordRecord, PageAuditRecord, DomainMetrics |
| **PPC** | CampaignRecord, AdGroupRecord, SearchTermRecord, KeywordPPCRecord |
| **Performance** | PageSpeedRecord, CrUXRecord, CoreWebVitals |
| **Local** | BusinessProfileRecord, LocalPerformanceRecord |

### Node.js Template Scripts

| Script | Purpose |
|--------|---------|
| `browse.js` | Navigate URL, extract meta/links/headings, screenshots |
| `crawl-sitemap.js` | Parse robots.txt + sitemap.xml, categorize URLs, analyze pages |
| `ddg-search.js` | DuckDuckGo SERP scraping with target domain position tracking |
| `check-technical.js` | Schema markup, alt text, social meta, heading structure, tech signals |
| `generate-spreadsheet.js` | 6-sheet Excel workbook from audit-data.json |
| `generate-presentation.js` | 15-slide PowerPoint from audit-data.json |
| `parse-google-ads.js` | Google Ads CSV export parser |
| `generate-ppc-spreadsheet.js` | PPC-specific Excel workbook |
| `generate-ppc-presentation.js` | PPC-specific PowerPoint |

### Report Outputs

- **Excel** (.xlsx) — 6-sheet formatted workbook
- **PowerPoint** (.pptx) — 15-slide client presentation
- **HTML Report (single-page)** — Tailwind + Chart.js interactive dashboard, print-optimized
- **HTML Report (multi-page)** — 8-page modular report: top nav, side nav, search, Leaflet maps, Chart.js visualizations. Per-page renderers with empty states for missing data. `template/reports/multipage/`
- **PDF** — Generated from HTML via print API

### Infrastructure

- **Rate limiting** on all connectors (configurable req/s)
- **Retry logic** (tenacity, exponential backoff)
- **Structured logging** (structlog)
- **Async + sync** HTTP client support (httpx)
- **Environment config** via pydantic-settings + .env files

---

## Roadmap — Planned Features

### Status Key

- `[x]` — Done, implemented and working
- `[>]` — In progress
- `[ ]` — Not started, definitely doing this
- `[?]` — Idea stage, needs evaluation

---

### P1 — Content Quality & Optimization (No API Cost)

These are pure Python analysis on data the crawl already collects.

- `[x]` **Thin content detection** — Flag pages under configurable word threshold (default 300), detect near-duplicate content via SimHash fingerprinting
- `[x]` **Keyword cannibalization detector** — Cross-reference Search Console query+page data, severity classification (high/medium/low), consolidation recommendations
- `[x]` **Content freshness scoring** — Last-modified staleness detection (default 365 days), age tracking
- `[x]` **Readability scoring** — Flesch-Kincaid, Flesch Reading Ease, Gunning Fog (review mode; audit mode flags READABILITY_NOT_ANALYZED)
- `[x]` **Content quality scoring (0-100)** — Composite score: SEO (35%) + readability (30%) + structure (25%) + substance (10%). Dual-mode: audit existing sites + review content drafts
- `[x]` **Keyword density & prominence analysis** — Keyword placement scoring (title, H1, meta, URL, first 100 words, headings)
- `[x]` **Near-duplicate detection** — SimHash with configurable Hamming distance thresholds, batch cross-comparison, DuplicateGroup clustering
- `[ ]` **Content gap analysis** — Keywords competitors rank for that we don't (uses DataForSEO organic keywords, costs per-call — see Cost Analysis)
- `[ ]` **Topical authority mapping** — Cluster keywords by topic, score how deeply each topic is covered

### P2 — Internal Linking Graph (No API Cost)

The crawl already captures all internal links. This just adds analysis.

- `[x]` **Link graph builder** — Forward + reverse adjacency lists from crawl edge data, URL normalization, self-link filtering
- `[x]` **Orphan page detection** — Pages in sitemap with zero inbound links, actionable recommendations per orphan
- `[x]` **Link depth analysis** — BFS from homepage, unreachable page detection, depth distribution stats
- `[x]` **Hub/spoke identification** — Percentile-based hub detection (75th percentile threshold), spoke clustering with primary referrer logic
- `[x]` **Internal PageRank approximation** — Power method with dangling node teleportation, configurable damping (0.85) and convergence tolerance
- `[x]` **Crawl link-graph.json output** — Modified crawl-sitemap.js to write separate link-graph.json with edge data (keeps crawl-data.json lean)
- `[x]` **Betweenness centrality** — Identifies "bridge" pages critical to graph connectivity. NetworkX-powered. Flags pages with high betweenness but low PageRank.
- `[x]` **HITS algorithm** — Separates hub scores (quality of outbound links) from authority scores (quality of inbound links). Per-node hub/authority values.
- `[x]` **Louvain community detection** — Identifies natural topic clusters/silos. Deterministic (seed=42). Community IDs assigned per node. Research-backed: Briggsby, ImportSEM.
- `[x]` **Graph-level structural metrics** — Density, average clustering coefficient. Standard NetworkX calls.
- `[x]` **Link suggestion engine** — URL path token overlap to suggest specific source→target link additions for orphan pages. No LLM required.

### P3 — Per-Page SEO Scoring (No API Cost)

Convert raw data into actionable scores.

- `[x]` **SEO score per page (0-100)** — Keyword placement scoring (title 25, H1 20, meta 15, first-100-words 15, URL 15, headings 10). Part of ContentQualityAnalyzer
- `[x]` **Title/meta template detection** — Detects boilerplate patterns, duplicate titles/descriptions, missing/too-long/too-short meta tags. Part of TechnicalSeoAnalyzer.
- `[x]` **Image optimization audit** — Alt text coverage per page, worst offenders sorted by missing count, overall site coverage percentage. Part of TechnicalSeoAnalyzer.
- `[x]` **URL structure analysis** — Depth distribution, length checks, parameter detection, uppercase/underscore/double-slash issues, trailing slash consistency. Part of TechnicalSeoAnalyzer.

### P4 — Backlink Analysis (DataForSEO — See Cost Analysis)

Connector exists, needs to be wired into the audit workflow + add analysis layer.

- `[x]` **Wire backlink data into audit flow** — BacklinkAnalyzer class pulls summary, backlinks, referring domains, competitor metrics into audit-data.json schema. 17/17 tests pass.
- `[x]` **Anchor text distribution analysis** — Categorizes anchors (branded, exact-match, partial, generic, URL, empty) with percentage distribution. Part of BacklinkAnalyzer.
- `[x]` **Link quality scoring** — Quality summary with high/medium/low buckets by DR, dofollow/nofollow split, avg DR. Part of BacklinkAnalyzer.
- `[ ]` **Lost/new backlink tracking** — Compare snapshots over time to detect gains/losses
- `[ ]` **Toxic link identification** — Flag PBN patterns (same IP range, thin content, link farm signals)
- `[ ]` **Unlinked brand mentions → link opportunities** — Cross-reference brand mentions connector with backlink data to find sites that mention the brand but don't link

### P5 — Deep Competitor Analysis (Mixed Cost — See Cost Analysis)

*See dedicated section below for the full vision.*

- `[x]` **Auto-discover competitors** — Merges organic keyword overlap (new Labs endpoint) + backlink competitors + manual list. Deduplicates, scores by combined overlap. Part of CompetitorAnalyzer.
- `[ ]` **Competitor full audit** — Run the same SEO audit on each competitor (crawl, technical, content, keywords) — gated behind explicit flag due to cost/courtesy
- `[x]` **Keyword overlap matrix** — Jaccard similarity matrix across all domains. Identifies shared, client-only, and gap keywords. Uses DataForSEO ranked_keywords endpoint.
- `[x]` **Content gap finder** — Keywords competitors rank for but client doesn't, extracted from keyword overlap analysis with volume filtering.
- `[x]` **Backlink gap finder** — Link Opportunity Finder in BacklinkAnalyzer (built in P4). Pulls competitor backlinks, filters spam, categorizes, scores 0-100.
- `[x]` **SERP feature ownership** — Per-keyword × per-domain feature tracking (featured snippets, PAA, local pack, image pack, video, knowledge graph). Capped at 25 keywords to control API cost.
- `[x]` **Competitor tech stack detection** — HTTP header + HTML pattern matching for CMS, CDN, analytics, frameworks, IDX platforms. No external dependency (pure httpx + regex). Detects WordPress, Next.js, React, GA4, GTM, Cloudflare, Sierra Interactive, kvCORE, etc.
- `[x]` **Strategy theft report** — Auto-generates prioritized recommendations from keyword gaps, SERP feature deficits, competitor strengths. Priority-scored 0-100.

### P6 — Local SEO Deep Dive (Low/No Cost)

Building on existing GBP + local connectors.

- `[x]` **Review sentiment analysis** — VADER-based (5K stars, lexicon, no model download). Per-review compound scoring, positive/negative/neutral classification, keyword extraction from review text, reply rate, sentiment trend. Part of LocalSeoAnalyzer.
- `[x]` **Competitor GBP comparison** — Side-by-side normalized comparison: rating, review count, categories, verification, website presence. Part of LocalSeoAnalyzer.
- `[ ]` **Local keyword rank tracking** — Track "[service] + [city]" combos over time (uses existing get_serp() with city location_code)
- `[x]` **Google Maps grid ranking (coordinate prep)** — Grid point generation with haversine math (geopy, 4.8K stars). Generates NxN grid of lat/lng coordinates with configurable spacing. Ready for DataForSEO Maps endpoint wiring.
- `[ ]` **GBP Q&A audit** — Questions & answers section completeness (requires GBP Q&A API, limited availability)
- `[ ]` **GBP photo/post analysis** — Media count + post frequency vs. competitors (requires GBP media/posts API)
- `[x]` **Local landing page quality check** — 8-check scoring system (0-100): LocalBusiness schema, city in title/H1/meta, NAP consistency, embedded map, internal links, content depth. Part of LocalSeoAnalyzer.
- `[x]` **Service area coverage mapping** — GeoJSON FeatureCollection output: business point, service area circle polygon, competitor points. Renders directly in existing Leaflet.js map. Part of LocalSeoAnalyzer.

### P7 — Technical SEO Enhancements (No API Cost)

Additions to the existing crawl and technical checks.

- `[x]` **Redirect chain detection** — Captures redirect hops during Playwright crawl, detects loops, long chains (>3 hops), chains to errors. Part of TechnicalSeoAnalyzer + crawl-sitemap.js.
- `[x]` **Canonical tag audit** — 8 cross-page checks: relative canonicals, header mismatch, protocol mismatch, canonical-to-noindex/redirect/error, canonical chains, multiple tags. Inspired by SEOnaut's multipage/canonical.go.
- `[ ]` **Hreflang validation** — For multi-language/region sites
- `[x]` **HTTP header analysis** — 6 security headers (HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) + HSTS max-age validation + server version exposure. Headers captured via Playwright response events.
- `[ ]` **JavaScript rendering comparison** — Compare raw HTML vs. Playwright-rendered DOM (crawl-sitemap.js captures rendered; need httpx pass for raw)
- `[ ]` **Crawl budget analysis** — Page depth distribution, parameter-based crawl traps, faceted navigation issues (partial: URL structure audit covers parameters + depth)
- `[x]` **Sitemap vs. crawl mismatch** — Cross-references sitemap URLs with crawl status codes. Detects: 404s in sitemap, noindex in sitemap, crawled-not-in-sitemap, 50K URL limit exceeded.
- `[x]` **Noindex/nofollow audit** — Parses meta robots + X-Robots-Tag header directives. Detects noindex, nofollow, nosnippet. Flags schema on noindex pages. Cross-page summary.
- `[x]` **Mobile usability scoring** — Viewport meta validation: missing, blocks zoom (user-scalable=no), limits zoom (maximum-scale=1), missing width=device-width, missing initial-scale.
- `[x]` **Structured data validation** — Validates JSON-LD against Google's required fields per schema type (14 types). Detects parse errors, missing @type, missing required fields, invalid @context, @graph unwrapping. Collected via crawl-sitemap.js full JSON-LD capture.

### P8 — Indexation & Crawlability (Low Cost)

- `[ ]` **Index coverage estimation** — Use `site:domain.com` via DataForSEO SERP to estimate indexed page count (connector method ready, needs orchestrator wiring)
- `[x]` **URL parameter audit** — 7-category taxonomy (filter/sort/pagination/tracking/session/search/display), faceted navigation detection, session ID flagging, parameter explosion detection, tracking-without-canonical check. Part of IndexCrawlabilityAnalyzer.
- `[x]` **Pagination audit** — Detects paginated pages via rel=next/prev, flags noindex on paginated pages, broken next links, canonical strategy issues. Part of IndexCrawlabilityAnalyzer.
- `[x]` **Orphan pages (from indexing perspective)** — Cross-references Search Console page data with crawl link graph. Strips tracking params for URL normalization. Priority-ranks by impressions. Part of IndexCrawlabilityAnalyzer.
- `[x]` **Soft 404 detection** — Pattern matching on title/H1 for error strings + near-empty page detection. No additional HTTP calls needed. Part of IndexCrawlabilityAnalyzer.
- `[x]` **Crawl budget health score** — 0-100 composite score from 5 factors: parameterized URLs (30%), orphan pages (20%), redirect chains (15%), soft 404s (20%), deep pages (15%). Grades: good/needs-improvement/poor.

### P9 — Reporting Intelligence (No API Cost)

Making reports smarter and more actionable.

- `[x]` **Automated issue prioritization** — Modified RICE scoring: (TrafficImpact × IssueCount × 100) / EffortPoints. 30+ issue types with impact weights (0-3) and effort tiers (1/2/4). Deduplicates by issue code, aggregates affected counts. Part of ReportingIntelligenceAnalyzer.
- `[x]` **Action item generator** — Buckets prioritized findings into quickWins/shortTerm/mediumTerm/longTerm by ROI score + effort. Capped at 10 items per bucket. Compatible with existing actionPlan schema.
- `[x]` **Executive summary auto-generation** — Template-based fallback (always works) + optional Claude API (claude-sonnet-4-6) for narrative prose. Graceful degradation: missing API key → template, API timeout → template. Anthropic SDK imported only at call time.
- `[x]` **Industry benchmark comparison** — 8 hard-coded benchmarks from Google CWV thresholds, Ahrefs backlink studies, Web Almanac 2025. Compares client values → above/at/below classification.
- `[x]` **Overall site health grade (A-F)** — Lighthouse-inspired weighted composite across 6 categories (technical 25%, performance 25%, content 20%, backlinks 15%, indexability 10%, local 5%). Floor penalty: catastrophic category (<20) caps grade at D+, weak (<40) caps at C+. 12-tier grading (A through F).
- `[x]` **Trend tracking** — JSON file storage at ~/.site-audit/history/{domain}/. Saves per-audit snapshots, loads history, computes deltas (improving/declining/stable). Last 12 audits retained.

### P10 — Monitoring & Alerting (Future State)

Long-term vision. Requires scheduled execution.

- `[?]` **Rank tracking over time** — Periodic keyword position checks with alerting on drops
- `[?]` **Site health monitoring** — Scheduled crawls, detect new 404s, broken links, content changes
- `[?]` **Competitor movement alerts** — New content published, ranking changes, backlink gains
- `[?]` **Core Web Vitals monitoring** — Track CWV after deployments, alert on regressions
- `[?]` **Uptime / availability checks** — Basic ping monitoring with response time tracking

### P11 — PPC Audit Tool (Separate HTML Report)

Full PPC audit system, separate from SEO but sharing connectors and infrastructure. Lives in its own HTML report directory (`template/reports/multipage-ppc/`) with the same architecture pattern as the SEO report (shared nav, search, modular pages, data injection).

**Data Sources:** Google Ads connector (already built), Google Analytics 4 (already built), manual CSV imports (parse-google-ads.js exists).

- `[ ]` **PPC report template** — Multi-page HTML report (separate from SEO, same architecture) mirroring SEO template architecture: top nav, side nav, search, Chart.js, Tailwind. Separate `ppc-audit-data.json` schema. Pages: dashboard, campaigns, ad groups, keywords, search terms, audiences, landing pages, budget/bidding, recommendations
- `[x]` **Campaign structure analysis** — Brand/non-brand separation, ad group theming (keyword count checks), duplicate keyword detection, match type distribution, dead keyword flagging. Part of PPCAnalyzer.
- `[x]` **Search term analysis** — N-gram mining (BrainlabsDigital method: 1/2/3-grams, raw count aggregation). Auto-identifies negative keyword candidates from zero-conversion high-cost n-grams. Part of PPCAnalyzer.
- `[x]` **Quality Score audit** — Impression-weighted account QS (Brad Geddes methodology), low-QS detection (≤3 threshold), sub-component analysis (expected CTR, ad relevance, landing page experience), top-spender QS check. Part of PPCAnalyzer.
- `[ ]` **Ad copy analysis** — RSA asset performance, ad strength distribution, headline/description effectiveness, CTR by ad variation, pinning analysis (needs get_ads() connector method)
- `[ ]` **Landing page audit** — Match landing page to keyword intent, page speed per landing page, conversion rate by landing page, bounce rate analysis, message match scoring
- `[x]` **Budget & bidding analysis** — Smart bidding adoption check, impression share analysis, strategy distribution. Part of PPCAnalyzer.
- `[ ]` **Audience analysis** — Audience segment performance, demographic breakdown, device/location performance, in-market/affinity insights
- `[ ]` **Competitor auction insights** — Auction insights integration (impression share, overlap rate, outranking share, top of page rate), competitor ad copy collection
- `[ ]` **Conversion tracking audit** — Verify conversion actions, attribution model review, conversion lag analysis, assisted conversions, cross-device tracking
- `[x]` **Wasted spend report** — Zero-conversion keyword detection (≥100 clicks threshold), CPA overspending (3x target), broad match without smart bidding, wasted spend percentage. Part of PPCAnalyzer.
- `[x]` **Recommendations engine** — Auto-prioritized by severity × category weight. Includes negative keyword suggestions from n-gram analysis. Capped at 30 items. Part of PPCAnalyzer.
- `[x]` **Account health scoring** — Weighted scoring formula: Σ(pass × severity_weight × category_weight) / Σ(total × ...) × 100. 6 category weights (conversion tracking 25%, wasted spend 20%, structure 15%, QS 15%, ads 15%, settings 10%). A/B/C/D/F grading. Inspired by claude-ads (1,200 stars).
- `[ ]` **PPC report generator** — `generate-ppc-report.js` mirroring SEO generator: data injection, search index, output bundle. Reuses shared/ components where possible (nav patterns, chart helpers, print styles)
- `[ ]` **PPC data models** — Extend existing `models/ppc.py` with audit-specific models: QualityScoreBreakdown, SearchTermAnalysis, WastedSpendRecord, AuctionInsightRecord, PPCAuditSummary
- `[ ]` **PPC orchestrator integration** — When `build_audit.py` orchestrator is built, PPC audit is a separate run mode (`--type ppc` vs `--type seo`) sharing the same connector infrastructure

---

## Deep Competitor Analysis Vision

This is the big-picture plan for turning competitor intel into a strategic advantage.

### The Concept

Don't just audit *our* site — run the same audit against every competitor, then diff the results. The output is a strategy document: "here's exactly what they do that works, here's where they're weak, and here's the playbook to beat them."

### How It Works

```
1. DISCOVER COMPETITORS
   ├── DataForSEO organic competitors (keyword overlap)
   ├── DataForSEO backlink competitors (link profile similarity)
   ├── SERP competitors (who ranks for our target keywords)
   └── Manual input (client-provided competitor list)

2. AUDIT EACH COMPETITOR (same pipeline as our site)
   ├── Crawl their sitemap → page inventory, URL structure
   ├── Technical check → schema, meta, headings, page speed
   ├── DataForSEO → their organic keywords, traffic estimates
   ├── DataForSEO → their backlink profile, referring domains
   ├── Social audit → their social presence
   ├── Content analysis → word counts, freshness, topics covered
   └── Local SEO → their GBP, citations, reviews (if applicable)

3. COMPARE & DIFF
   ├── Keyword overlap matrix (us vs. each competitor)
   ├── Content coverage gaps (topics they cover, we don't)
   ├── Backlink gaps (domains linking to them, not us)
   ├── Technical advantages (their speed, schema, mobile experience)
   ├── SERP feature ownership (who has the snippets, PAA, etc.)
   └── Local dominance (review count, rating, GBP completeness)

4. GENERATE STRATEGY
   ├── "Steal these strategies" — things they do well we should copy
   ├── "Fill these gaps" — weaknesses in their coverage we can own
   ├── "Quick wins" — low-effort high-impact moves
   ├── "Long plays" — backlink/content strategies that compound
   └── Priority-ranked action plan with effort estimates
```

### Key Principle

We already have all the building blocks. The competitor audit reuses the same connectors and analysis modules — it just runs them against competitor domains and adds a comparison layer on top.

### Cost Consideration

Running a full audit on 3-5 competitors multiplies DataForSEO API calls. See Cost Analysis section for per-competitor estimates and how to keep this affordable.

---

## Cost Analysis

### Free (Google APIs + Pure Python)

These features cost nothing beyond what we already have. They should be prioritized.

| Feature | Why It's Free |
|---------|--------------|
| Content quality analysis (thin, duplicate, readability, freshness) | Pure Python on crawled data |
| Internal linking graph | Pure Python on crawled data |
| Per-page SEO scoring | Pure Python on crawled data |
| Keyword cannibalization | Search Console data (already free) |
| Technical SEO enhancements (redirects, canonicals, headers, JS rendering) | Crawl-time checks + Playwright (installed) |
| Review sentiment analysis | Python NLP on GBP review data |
| Reporting intelligence (scoring, prioritization, action items) | Python logic on existing data |
| Competitor tech stack detection | HTTP headers + HTML parsing |

**Recommendation:** Do all of these first. They add massive value with zero marginal cost.

### DataForSEO — Per-Call Pricing

DataForSEO is pay-as-you-go. Here's what matters for budgeting:

| API Endpoint | Cost per Call | Typical Usage per Audit | Est. Cost per Audit |
|-------------|--------------|------------------------|-------------------|
| **SERP (Live)** | ~$0.002/keyword | 50-100 keywords | $0.10 - $0.20 |
| **Keyword Data** | ~$0.0005/keyword | 100-500 keywords | $0.05 - $0.25 |
| **Keyword Suggestions** | ~$0.001/seed | 10-20 seeds | $0.01 - $0.02 |
| **Organic Keywords (for a domain)** | ~$0.02/request (1000 results) | 1-5 pages per competitor | $0.02 - $0.10 |
| **Backlinks Summary** | ~$0.02/request | 1 per domain | $0.02 |
| **Backlinks (individual)** | ~$0.04/request (1000 results) | 1-5 pages | $0.04 - $0.20 |
| **Referring Domains** | ~$0.04/request (1000 results) | 1-3 pages | $0.04 - $0.12 |
| **Backlink Intersection** | ~$0.04/request | 1 per competitor pair | $0.04 |
| **Domain Metrics** | ~$0.02/request | 1 per domain | $0.02 |

**Note:** Check current DataForSEO pricing at their dashboard — these are approximate. Prices may have changed.

### Cost Per Audit Type

| Audit Type | Estimated Cost | Notes |
|-----------|---------------|-------|
| **Basic SEO audit (our site only)** | $0.30 - $0.80 | Keywords + SERP + backlink summary |
| **With backlink deep dive** | $0.50 - $1.50 | Add individual backlinks + referring domains |
| **Single competitor analysis** | $0.30 - $0.80 | Same as basic audit, run on their domain |
| **Full competitor analysis (3 competitors)** | $1.50 - $4.00 | 3x competitor audits + intersection queries |
| **Full competitor analysis (5 competitors)** | $2.50 - $6.50 | 5x competitor audits + intersection queries |
| **Kitchen sink (our site + 5 competitors, full depth)** | $3.00 - $8.00 | Everything above combined |

### How to Keep Costs Down

1. **Cache aggressively** — Backlink and keyword data doesn't change daily. Cache results for 7-14 days and reuse across analyses.
2. **Limit result depth** — Don't pull 10,000 backlinks when 1,000 tells the same story. Use `limit` parameters.
3. **Batch keyword lookups** — DataForSEO's batch endpoints are cheaper per-keyword than individual calls.
4. **Tiered analysis** — Quick audit (summary only, ~$0.30) vs. deep audit (full backlinks + competitors, ~$5-8). Let client need dictate depth.
5. **Skip what you already have** — If Search Console gives you keyword data, don't also pull it from DataForSEO. Use DataForSEO only for competitor keywords and data Google doesn't provide.
6. **Run competitor audits selectively** — Not every client needs 5 competitors analyzed. Start with 2-3 that actually matter.

### Monthly Budget Estimates

| Workload | Est. Monthly Cost |
|----------|------------------|
| 2-3 client audits/month (basic) | $1 - $3 |
| 2-3 client audits/month (with competitors) | $5 - $15 |
| 5-8 client audits/month (full depth) | $15 - $50 |
| Heavy usage with monitoring/tracking | $50 - $100 |

**Bottom line:** Even aggressive usage stays under $50/month. This is 10-50x cheaper than Ahrefs/SEMrush subscriptions.

### Google Maps Grid Ranking (Special Note)

DataForSEO's Google Maps endpoint for grid-based local ranking is one of the pricier calls (~$0.01-0.03 per GPS point). A 5x5 grid (25 points) for one keyword costs ~$0.25-0.75. For 10 keywords, that's $2.50-$7.50 per audit. Use sparingly — only for local clients where Maps ranking directly drives revenue.

---

## Implementation Log

Track what gets built and when. Move items here from the roadmap as they're completed.

### Completed

| Date | Feature | Notes |
|------|---------|-------|
| Pre-March 2026 | All 12 API connectors | See Current Inventory above |
| Pre-March 2026 | Node.js crawl + technical checks | browse, crawl-sitemap, check-technical, ddg-search |
| Pre-March 2026 | Excel + PowerPoint generation | 6-sheet workbook, 15-slide deck |
| Pre-March 2026 | HTML report system | Tailwind + Chart.js interactive dashboard |
| Pre-March 2026 | Pydantic data models (4 categories) | SEO, PPC, Performance, Local |
| Pre-March 2026 | Rate limiting, retry, logging infra | All connectors |
| March 22, 2026 | **Content Quality Analyzer** | `analyzers/content_quality.py` (914 lines). Readability (Flesch-Kincaid, Gunning Fog), thin content, keyword density/prominence, per-page SEO + structure + quality scores (0-100), SimHash duplicate detection, cannibalization detection, dual-mode (audit + review). 11/11 tests pass. Benchmark-auditor verified production-ready. |
| March 22, 2026 | Content quality Pydantic models | `models/content.py` — ContentQualityRecord, ReadabilityMetrics, KeywordUsage, ContentStructure, DuplicateGroup, CannibalizationRecord |
| March 22, 2026 | Analyzers package | New `analyzers/` package parallel to `connectors/` for non-HTTP analysis modules |
| March 22, 2026 | **Internal Link Graph Analyzer** | `analyzers/internal_linking.py` (405 lines). Graph builder, orphan detection, BFS link depth, hub/spoke clustering, PageRank approximation. 10/10 tests pass. Benchmark-auditor verified production-ready. |
| March 22, 2026 | Internal linking Pydantic models | `models/linking.py` — LinkGraphNode, OrphanPage, HubSpokeCluster, LinkDepthResult, LinkGraphResult |
| March 22, 2026 | Crawl link-graph.json output | Modified `crawl-sitemap.js` to write separate `link-graph.json` with edge data alongside `crawl-data.json` |

| March 23, 2026 | **Multi-page HTML Report System** | `template/reports/multipage/` — 8 HTML pages (index, technical, content, keywords, links, competitors, local, action-plan), shared nav/search/charts, Leaflet.js service area map, report generator with data injection + search index. 26 files, ~7,500 lines. ARCHITECTURE.md defines full data contract. |
| March 23, 2026 | Multi-page report data schema | 6 new top-level JSON keys (contentQuality, internalLinking, technicalSeo, backlinks, localSeo, domainMetrics) mapped from Python Pydantic models to audit-data.json. Empty states for all roadmap items P4-P10. |

| March 23, 2026 | **Backlink Analyzer** | `analyzers/backlinks.py` (305 lines). Wires DataForSEO connector into audit-data.json schema. Domain metrics, top backlinks, referring domains, anchor text distribution, quality scoring, competitor comparison. Convenience script `scripts/run_backlink_analysis.py`. 17/17 tests pass (149/149 total). |

| March 23, 2026 | **Technical SEO Analyzer (P3)** | `analyzers/technical_seo.py` (350 lines). Meta tag audit (duplicate/missing/length), template detection (boilerplate patterns), image optimization audit (alt text coverage), URL structure analysis (depth/length/params/case). 19/19 tests pass (174/174 total). |
| March 23, 2026 | **Backlink Link Opportunity Finder** | Extension to BacklinkAnalyzer. Pulls competitor backlinks, filters spam/low-DR, categorizes (directory/local-org/press/resource/partnership), priority scores 0-100. 23/23 backlink tests pass. |

| March 23, 2026 | **P7 Technical SEO Enhancements** | Extended `TechnicalSeoAnalyzer` + `crawl-sitemap.js`. 7 new analysis methods: canonical audit (8 cross-page checks), redirect chains, security headers (6 headers), indexability (noindex/nofollow), mobile usability (viewport), structured data validation (14 schema types), sitemap validation. Crawl script now captures response headers, redirect chain hops, robots meta, viewport, full JSON-LD, HTTP canonical. Research-backed: patterns from SEOnaut (663 stars), seo-audit-skill (251 rules). 44/44 tests pass (199/199 total). |

| March 23, 2026 | **P5 Deep Competitor Analysis** | `analyzers/competitor.py` (~400 lines) + 3 new DataForSEO Labs endpoints (`get_organic_keywords`, `get_organic_competitors`, `get_keyword_overlap`). CompetitorAnalyzer: auto-discovery, Jaccard keyword overlap matrix, SERP feature ownership, tech stack detection, strategy report generator. Research-backed: search-solved-public-seo (384 stars, Jaccard), advertools (1,400 stars, n-grams), wappalyzer-next (330 stars, tech detection). 24/24 tests pass (223/223 total). |

| March 23, 2026 | **P8 Indexation & Crawlability** | `analyzers/indexation_crawlability.py` (~380 lines). URL parameter taxonomy (7 categories), faceted nav detection, pagination audit, soft 404 detection, SC orphan cross-reference, crawl budget health score (0-100). Research-backed: benhoyt/soft404 (probe algorithm), seo-audit-skill (pagination rules), advertools (1,400 stars, crawl analysis). 27/27 tests pass (250/250 total). |

| March 23, 2026 | **P6 Local SEO Deep Dive** | `analyzers/local_seo.py` (~400 lines). Review sentiment (VADER), competitor GBP comparison, local landing page scoring (8-check/100-point), service area GeoJSON, grid coordinate generation. Research-backed: VADER (5K stars), geopy (4.8K stars), gosom/google-maps-scraper (3.5K stars, reference). 23/23 tests pass (273/273 total). |

| March 23, 2026 | **P9 Reporting Intelligence** | `analyzers/reporting_intelligence.py` (~450 lines). Site health grade (A-F with floor penalty), RICE-based issue prioritization (30+ types), auto action plan builder, industry benchmarks (8 metrics from Google/Ahrefs/Web Almanac), executive summary (template + Claude API), trend tracking (JSON history). Research-backed: seo-audits-toolkit (776 stars), seo-audit-skill score history, Lighthouse scoring, DataForSEO formula, RICE framework. 40/40 tests pass (313/313 total). |

| March 23, 2026 | **P11 PPC Audit Analyzer** | `analyzers/ppc_analyzer.py` (~550 lines). Campaign structure (brand separation, dupes, match types), QS audit (impression-weighted, sub-components), wasted spend (zero-conv, CPA-multiple, broad+manual), n-gram mining (BrainlabsDigital method), budget/bidding, weighted account scoring, auto-recommendations. Research-backed: claude-ads (1,200 stars, 190+ checks), BrainlabsDigital n-gram mining, Brad Geddes QS methodology. 31/31 tests pass (344/344 total). |

| March 23, 2026 | **Orchestrator (build_audit.py)** | `scripts/build_audit.py` (~400 lines). Registry-pattern pipeline: 8 SEO steps + 1 PPC step. Loads crawl data + research files, runs all analyzers in sequence, merges output, generates HTML report. Supports --skip-api, --competitors, --report flags. Tested end-to-end with mammoth-lakes (2,602 pages → B grade in 2.7s). |

| March 23, 2026 | **P1/P2/P4 Research-backed audit & improvements** | Content Quality: textstat integration (6 readability formulas, CMU dictionary), SimHash body-text scope, keyword over-optimization, E-E-A-T fields. Internal Linking: NetworkX betweenness centrality, HITS hub/authority, Louvain community detection, graph density/clustering, link suggestion engine. Backlinks: brand-aware anchor classification, over-optimization thresholds, TLD toxicity scoring, broken backlink reclamation. Research sources: textstat (1.4K), seomoz/simhash-py (424), Briggsby internal link analysis, ContextBridge semantic linking. 353/353 tests pass. |

### In Progress

*Nothing currently in progress.*

### Not Started Yet

*Items move here from the roadmap when we commit to building them next.*

---

## Notes

- All cost estimates are approximate and based on DataForSEO pricing as of early 2026. Verify at [DataForSEO pricing page](https://dataforseo.com/pricing).
- The priority order (P1-P10) reflects a balance of client value, implementation effort, and cost. Free features first, then cost-effective features, then monitoring (which requires infrastructure).
- This document should be updated as features are built. Move completed items to the Implementation Log.
