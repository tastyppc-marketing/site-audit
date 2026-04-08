# SEO Audit Log — SellingCalgaryCastles.com (v2 Fresh Run)

**Started:** 2026-03-31
**Client:** Neil Rowlandson / Calgary Castles Team / CIR Realty
**Domain:** sellingcalgarycastles.com
**Location:** Calgary, Alberta, Canada

---

## Process Log

| Timestamp | Process | Status | Details |
|-----------|---------|--------|---------|
| 2026-03-31 00:30 | PROJECT_SETUP | SUCCESS | Backed up v1 data to research-v1-backup/. Copied scripts. Installed Playwright + deps. |
| 2026-04-01 00:55 | KEYWORD_RESEARCHER | STARTED | Searching 25 keywords via WebSearch |
| 2026-03-31 12:00 | SITE_CRAWLER | STARTED | Crawling sitemap + analyzing pages |
| 2026-04-01 00:55:44 | CONTENT_AUDITOR | STARTED | Auditing all pages for content quality |
| 2026-04-01 00:55 | COMPETITOR_ANALYZER | STARTED | Analyzing 11+ competitors + auto-discovering new ones |
| 2026-04-01 00:56:15 | BEST_PRACTICES | STARTED | Researching 10 SEO topics for 2026 |
| 2026-04-01 00:56 | BACKLINK_RESEARCHER | STARTED | Researching backlink profiles via free tools and Ahrefs MCP |

| 2026-03-31T$(date +%H:%M:%S) | DFS_DATA_FETCHER | STARTED | Running 6 API data collection scripts |
| 2026-04-01 00:59 | KEYWORD_RESEARCHER | SUCCESS | Searched all 25 keywords. Client ranks for 0/25 keywords. justinhavre.com appeared in 15/25, calgaryhomes.ca in 14/25. Full report written to research/keyword-research.md |
| 2026-04-01 01:00 | DFS_DATA_FETCHER | SCRIPT_1 | Keyword volumes fetched for 25 keywords → keyword-data.json |
| 2026-04-01 01:00 | DFS_DATA_FETCHER | SCRIPT_2 | SERP top 5 fetched for 25 keywords → serp-data.json |
| 2026-04-01 01:00 | DFS_DATA_FETCHER | SCRIPT_3 | Domain metrics for 8 domains → domain-metrics.json |
| 2026-04-01 01:00 | DFS_DATA_FETCHER | SCRIPT_4 | Client backlinks (top 50 + 20 referring domains) → client-backlinks.json |
| 2026-04-01 01:00 | SITE_CRAWLER | PARTIAL | Updated crawl-data.json (36 pages) and link-graph.json |
| 2026-04-01 01:02 | TEMPLATE_UPDATE | SUCCESS | Added layman's explainer widget to all 8 report pages + CSS + data-loader init |
| 2026-03-31 12:45 | SITE_CRAWLER | SUCCESS | 36 pages analyzed. 33 missing schema, 32 missing OG tags, 6 title too short, 4 meta desc too long, 1 broken page (403), 3 missing canonical, 23 images missing alt. Full report: seo/research/client-site-structure.md |
| 2026-04-01 01:15 | BACKLINK_RESEARCHER | SUCCESS | Completed backlink analysis: client has 5-15 est. referring domains vs 500-1000+ for top competitor (justinhavre.com). Identified 50+ citation gaps, 30 prioritized link-building actions, 4-phase implementation roadmap. Report at seo/research/backlink-analysis.md |
| 2026-04-01 01:05:29 | CONTENT_AUDITOR | SUCCESS | 25 pages audited, grade D+ — nearly 100% template content, zero local/Calgary customization, US-centric content on Canadian site, critical about page deficiency |
| 2026-03-31T21:00:28 | DFS_DATA_FETCHER | SCRIPT_1 | SUCCESS: keyword-data.json — 25/25 keywords returned (vol, CPC, competition). 1 API call. |
| 2026-03-31T21:01:41 | DFS_DATA_FETCHER | SCRIPT_2 | SUCCESS: serp-data.json — 25/25 keywords with top-5 organic SERP results. 25 API calls (live SERP, 1 per keyword). |
| 2026-03-31T21:02:06 | DFS_DATA_FETCHER | SCRIPT_3 | SUCCESS: domain-metrics.json — 8/8 domains with DR, referring domains, backlinks. 8 API calls. |
| 2026-03-31T21:02:22 | DFS_DATA_FETCHER | SCRIPT_4 | SUCCESS: client-backlinks.json — 50 backlinks + 20 referring domains for sellingcalgarycastles.com. 2 API calls. |
| 2026-03-31T21:06:44 | DFS_DATA_FETCHER | SCRIPT_5 | SUCCESS: pagespeed-data.json — 18/18 PSI tests (4 client URLs x2 + 5 competitor URLs x2). 0 errors. 18 API calls. |
| 2026-03-31T21:06:19 | DFS_DATA_FETCHER | SCRIPT_6 | SUCCESS: organic-keywords.json — Client: 0 organic keywords (not in DFS database). justinhavre.com: 100 organic keywords. 3 API calls. |
| 2026-03-31T21:06:50 | DFS_DATA_FETCHER | SUCCESS | Total: 57 API calls (36 DFS + 3 DFS retry + 18 PSI). 6 data files written. All scripts completed. |
| 2026-04-01 01:07:55 | BEST_PRACTICES | SUCCESS | All 10 topics covered: (1) Algorithm updates/March 2026 core update, (2) AI Overviews/GEO optimization, (3) E-E-A-T signals, (4) Schema markup for real estate, (5) Content quality standards, (6) Local SEO/GBP, (7) Core Web Vitals/page speed, (8) Link building strategies, (9) Mobile-first indexing, (10) Real estate-specific SEO trends |
| 2026-04-01 01:09 | COMPETITOR_ANALYZER | SUCCESS | 16 competitors analyzed (11 provided + 5 auto-discovered: popowichrealestate.com, calgary-real-estate.com, sellhomes.ca, donwong.ca, makeyourmovecalgary.ca). Full report at seo/research/competitor-analysis.md |
| 2026-04-01 01:11:24 | REPORT_COMPILER | STARTED | Compiling final report from 13 research files |
| 2026-04-01 01:12:09 | CLAUDE_SCHEMA | STARTED | Creating JSON-LD schema for all page types |
| 2026-04-01 01:12:23 | CLAUDE_META_TAGS | STARTED | Writing optimized meta tags for 36 pages |
| 2026-04-01 08:12 | CLAUDE_CONTENT | STARTED | Writing 4 community pages + 4 blog posts with keyword density guides |
| 2026-04-01 08:21 | CLAUDE_CONTENT | SUCCESS | 8 pieces written (15,270 words total): 4 community pages (Auburn Bay, Cranston, Mahogany, McKenzie Towne @ ~1,300-1,500 words each) + 4 blog posts (Market Report, Best Neighborhoods, Investment Analysis, First-Time Buyer Guide @ ~1,000-1,200 words each). All include: keyword density guides, meta titles/descriptions with char counts, H1/H2/H3 structure, FAQ sections (4 Q&As each), internal link suggestions (4-6 per page), CTAs to /contact/, Canadian/Alberta terminology throughout (CMHC, RRSP, FHSA, no PMI/escrow). Spring 2026 market data ($641K avg, $572.5K median) embedded in all content. |
| 2026-04-01 01:14:30 | CLAUDE_META_TAGS | SUCCESS | Wrote optimized meta tags for 36 pages (35 live + 1 broken). All titles 42-58 chars with Calgary keyword. All descriptions 119-149 chars with Calgary/AB location. Fixed US-centric terms (PMI->CMHC, escrow->land titles). 10 community pages now have unique descriptions. 4 blog descriptions reduced from 305-524 chars to 131-141 chars. |
| 2026-04-01 01:16:08 | CLAUDE_SCHEMA | SUCCESS | v2 complete: 9 schema sections -- homepage @graph (Org+Agent+WebSite+SearchAction+Person), about Person, contact LocalBusiness+ContactPoint+Geo+Hours, community template+2 filled (Auburn Bay, Cranston), blog template+1 filled (mortgage rates), buyer FAQ (6 Q&A), seller FAQ (5 Q&A), AggregateRating template w/ warning, breadcrumb reference. Consistent @id URIs, CAD/Canadian data, www-prefix, sameAs links for 5 social profiles + CIR Realty. Implementation checklist with P1/P2/P3 priority order. |
| 2026-04-01 01:18:14 | REPORT_COMPILER | SUCCESS | Compiled 895-line final audit report from 13 research files. Sections: Exec Summary, Search Visibility (25 keywords), Technical SEO (20 issues), Content Assessment (D+ grade, US-centric problem), Competitor Benchmarking (16 competitors), Backlink Analysis (DR 45 vs 392), Local SEO, 47-item Action Plan, 12-article Content Calendar, 4 Appendices, Data Availability Notes. |
| 2026-04-01 01:29:21 | CLAUDE_COMPARISON | STARTED | Comparing v1 vs v2 audit data |
| 2026-04-01 01:30:22 | DATA_POPULATOR | STARTED | Populating audit-data.json with v2 research data |
| 2026-04-01 08:30 | TRIPLE_REVIEWER | STARTED | Reviewing 12 deliverables across Claude/Codex/Gemini |
| 2026-04-01 01:33:40 | CLAUDE_COMPARISON | SUCCESS | v1-vs-v2 comparison complete: 10 dimensions analyzed, grade unchanged (D+), v2 adds real DFS volumes/backlinks/PageSpeed/content audit, 3 new critical findings (US content, hreflang, Avanan proxy), competitor set expanded from 6 to 21, v1 volume estimates 40% accurate with 3 very wrong, all 12 v1 technical findings confirmed |
| 2026-04-01 08:45 | TRIPLE_REVIEWER | SUCCESS | Winners: Claude 4/4 deliverables. Overall ranking: Claude (144/160) > Codex (120/160) > Gemini (117/160). 16 issues flagged. Hybrid merge strategy documented. |
| 2026-04-01 01:35:23 | DATA_POPULATOR | SUCCESS | Populated 9 sections: client (auditDate), keywords (25 volumeNumeric+cpc+competitionIndex), backlinks (domainMetrics+10 topBacklinks+8 competitorDomainMetrics), technicalSeo (coreWebVitals+lighthouseResults+6 pageSpeedComparison), contentQuality (grade+issues+pageScores), localSeo (Calgary GeoJSON+accessNotes), competitorAnalysis (8 domainMetrics+6 pageSpeed+organicKeywords), keyStats (12 real metrics), rankHistory (25 keywords volume+difficulty) |
| 2026-04-01 01:36 | HTML_REPORT | SUCCESS | Regenerated 8-page multipage HTML report with explainer widget, v2 data, search index (124 entries) |
| 2026-04-01 01:36 | EXCEL_PPT | SUCCESS | Generated SEO-Audit-GamePlan.xlsx (54KB) + SEO-Audit-Presentation.pptx (599KB) |
| 2026-04-01 01:39 | CODEX_COMPARISON | SUCCESS | v1-vs-v2 comparison from Codex/GPT perspective (31KB) |
| 2026-04-01 01:40 | GEMINI_COMPARISON | SUCCESS | v1-vs-v2 comparison from Gemini perspective (9KB) |
| 2026-04-01 01:41 | AUDIT_COMPLETE | SUCCESS | Full v2 audit complete. 24 agents total. 57 DFS API calls. 18 research files. 12 triple-route deliverables. 3 v1-vs-v2 comparisons. 1 triple-route review. 8-page HTML report. Excel + PPT. |
| 2026-04-01 09:00 | READABILITY_EXTRACT | STARTED | Crawling all 36 pages with Playwright to extract body text and compute real Flesch readability scores |
| 2026-04-01 09:02 | READABILITY_EXTRACT | SUCCESS | Extracted body text from all 36 pages. Stripped nav/footer/header/sidebar boilerplate. Computed Flesch Reading Ease, Flesch-Kincaid Grade, syllable counts, sentence counts, word counts. Output: seo/research/page-text-analysis.json. Script: scripts/extract-text.js |
| 2026-04-01 09:03 | READABILITY_UPDATE | SUCCESS | Replaced estimated readability scores in audit-data.json with real Flesch scores. Average readability dropped from 68.3 (estimated) to 55.3 (real) -- "Fairly Difficult" level. Added scoreExplanation field to each page's readability object. Site-map page capped at FRE=0/FK=30 (listing page, not prose). Script: scripts/update-readability.py |
| 2026-04-01 09:04 | HTML_REPORT | SUCCESS | Regenerated 8-page multipage HTML report with real readability scores. search index (160 entries) |
