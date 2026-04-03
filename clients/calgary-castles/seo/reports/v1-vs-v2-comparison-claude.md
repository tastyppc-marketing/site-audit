# V1 vs V2 Audit Comparison: sellingcalgarycastles.com

**V1 Date:** March 23, 2026
**V2 Date:** March 31, 2026
**Client:** Neil Rowlandson / Calgary Castles Team / CIR Realty
**Domain:** sellingcalgarycastles.com
**Prepared By:** Claude Opus 4.6 (SEO Audit Quality Analysis)
**Comparison Date:** March 31, 2026

---

## Executive Summary

The v2 audit represents a **massive upgrade in data quality, depth, and actionability** compared to v1. While both audits arrive at the same overall grade (D+) and agree that the client has zero organic visibility, v2 transforms a largely qualitative assessment into a data-driven diagnostic backed by real API data from DataForSEO, Google PageSpeed Insights, and live SERP analysis.

### Key Differences at a Glance

| Dimension | V1 (March 23) | V2 (March 31) | Change |
|-----------|---------------|---------------|--------|
| Overall Grade | D+ | D+ | Same -- but now backed by data |
| Search Volume Data | Qualitative (High/Med/Low) | Real DFS numbers (10-60,500/mo) | Major upgrade |
| Keywords Tracked | 25 | 25 | Same |
| Client Ranking | 0/25 keywords | 0/25 keywords | Confirmed |
| Content Quality | Empty (`contentQuality: {}`) | Grade D+ with 25-page audit | New finding |
| Competitors Analyzed | 6 | 16 + 5 auto-discovered | 3.5x more |
| Backlink Data | None | Real DFS metrics (DR, backlinks, referring domains) | New data layer |
| PageSpeed Data | None | Real PSI scores for 4 client + 5 competitor pages | New data layer |
| Domain Metrics | None | DR, referring domains, backlinks for 8 domains | New data layer |
| US-Centric Content Issue | Not identified | Critical finding (6+ pages with US content) | New finding |
| Hreflang Gap | Not identified | Identified (11 languages, no hreflang) | New finding |
| Avanan Proxy URLs | Not identified | Identified (3 social links through email proxy) | New finding |
| Action Plan Items | General strategic recommendations | 47 specific, prioritized actions with timelines | 4x more actionable |
| Content Calendar | None | 12 blog topics with keyword density targets | New deliverable |
| Citation Checklist | None | 70+ directories in 4 tiers with NAP template | New deliverable |

---

## 1. Keyword Rankings Comparison

### Client Rankings

Both v1 and v2 agree: **sellingcalgarycastles.com ranks for 0 of 25 target keywords.** This finding is fully confirmed.

### Competitor Rankings (v1 WebSearch vs v2 DFS SERP)

The v1 audit used manual WebSearch to identify competitors in SERPs. The v2 audit used DataForSEO live SERP API. There are notable differences in the SERP compositions detected, likely due to:
- Different search methodologies (browser-based web search vs. API-based SERP pull)
- 8-day time gap between audits
- Geographic/personalization differences

| Keyword | V1 Top Result | V2 Top Result (DFS) | V1 Best Competitor | V2 Best Competitor |
|---------|---------------|---------------------|--------------------|--------------------|
| Calgary homes for sale | zillow.com | realtor.ca | calgaryhousefinder.ca (#3) | calgaryhomes.ca (#2) |
| Calgary real estate | realtor.ca | realtor.ca | calgaryhomes.ca (#5) | calgaryhousefinder.ca (#2) |
| Calgary real estate agent | zillow.com | realtor.ca | justinhavre.com (#3) | justinhavre.com (#3) |
| homes for sale Calgary AB | zillow.com | realtor.ca | justinhavre.com (#10) | calgaryhomes.ca (#3) |
| Calgary condos for sale | zillow.com | realtor.ca | justinhavre.com (#3) | calgaryhomes.ca (#2) |
| Calgary houses for sale | zillow.com | realtor.ca | justinhavre.com (#3) | calgaryhousefinder.ca (#4) |
| luxury homes Calgary | zillow.com | kirbycox.com (DFS) | justinhavre.com (#9) | kirbycox.com (#1) |
| Calgary real estate market | wowa.ca | creb.com | justinhavre.com (#7) | justinhavre.com (#7) |
| buy home Calgary | zillow.com | realtor.ca | calgaryhomes.ca (#2) | calgaryhomes.ca (#2) |
| sell home Calgary | bridgedalehomebuyers.ca | justinhavre.com | justinhavre.com (#3) | justinhavre.com (#1) |

**Key Observation:** V1 showed zillow.com dominating as the #1 result for 6 of 25 keywords. V2 DFS SERP data shows realtor.ca dominating instead. This suggests v1's WebSearch may have been returning US-biased results (Zillow is a US portal) while the DFS API with location_code 2124 (Canada) returned more accurate Canadian SERPs. This is a significant methodological improvement.

### V1 Rank History Data (DFS-Sourced)

The v1 backup also included a `rank-history.json` file that DID use DFS data. This file tracked competitor positions more granularly:

| Keyword | justinhavre.com (v1 DFS) | calgaryhousefinder.ca (v1 DFS) | kirbycox.com (v1 DFS) |
|---------|--------------------------|--------------------------------|----------------------|
| Calgary homes for sale | 8 | 5 | 9 |
| Calgary real estate | 11 | 6 | 37 |
| Calgary real estate agent | 1 | null | 4 |
| luxury homes Calgary | 4 | 45 | 1 |
| Calgary condos for sale | 3 | 32 | 5 |
| Calgary houses for sale | 10 | 6 | 12 |

The v1 DFS rank data was collected but never surfaced in the qualitative WebSearch analysis, creating a disconnect. V2 presents both WebSearch findings and DFS SERP data in a unified view.

---

## 2. Search Volume Data: Qualitative vs Quantitative

This is one of the most significant upgrades between v1 and v2. V1 used qualitative estimates (High/Medium/Low). V2 has real DataForSEO monthly search volumes.

| Keyword | V1 Estimate | V2 DFS Volume | V1 Accuracy |
|---------|-------------|---------------|-------------|
| Calgary homes for sale | High | 60,500 | CORRECT -- truly high |
| Calgary real estate | High | 18,100 | CORRECT -- high volume |
| Calgary real estate agent | High | 880 | WRONG -- 880 is medium, not high |
| homes for sale Calgary AB | High | 30 | VERY WRONG -- only 30 searches/mo |
| Calgary condos for sale | High | 3,600 | OVERESTIMATED -- medium, not high |
| Calgary houses for sale | High | 60,500 | CORRECT -- truly high |
| luxury homes Calgary | Medium | 720 | CORRECT -- medium range |
| Calgary real estate market | High | 1,600 | OVERESTIMATED -- medium, not high |
| buy home Calgary | Medium | 9,900 | UNDERESTIMATED -- actually high |
| sell home Calgary | Medium | 70 | OVERESTIMATED -- very low volume |
| Calgary MLS listings | High | 22,200 | CORRECT -- high volume |
| Calgary property for sale | Medium | 2,400 | CORRECT -- medium range |
| Calgary townhouses for sale | Medium | 8,100 | UNDERESTIMATED -- actually high |
| new homes Calgary | Medium | 1,300 | CORRECT -- medium range |
| Calgary real estate market report | Medium | 20 | VERY WRONG -- only 20 searches/mo |
| best neighborhoods Calgary | Medium | 1,000 | CORRECT -- medium range |
| Calgary investment property | Medium | 70 | OVERESTIMATED -- very low volume |
| Cochrane homes for sale | Low | 12,100 | VERY WRONG -- actually very high! |
| Chestermere real estate | Low | 880 | UNDERESTIMATED -- medium volume |
| Lakeview Calgary homes | Low | 20 | CORRECT -- low volume |
| Calgary luxury real estate agent | Low | 10 | CORRECT -- very low |
| Calgary first time home buyer | Medium | 140 | OVERESTIMATED -- low, not medium |
| Calgary home prices 2026 | Medium | N/A (too new) | CANNOT VERIFY |
| Calgary real estate forecast | Medium | 170 | OVERESTIMATED -- low, not medium |
| sell my house Calgary fast | Low | N/A | CANNOT VERIFY |

### Volume Accuracy Scorecard

| Assessment | Count | % |
|-----------|-------|---|
| Correct (within reasonable range) | 10 | 40% |
| Overestimated (rated too high) | 8 | 32% |
| Underestimated (rated too low) | 3 | 12% |
| Very Wrong (off by 2+ categories) | 3 | 12% |
| Cannot Verify | 2 | 8% |

**Biggest Misses:**
- **"Cochrane homes for sale"** was rated Low but gets 12,100 searches/month -- one of the highest-volume keywords in the set. This was a critical undervaluation.
- **"homes for sale Calgary AB"** was rated High but gets only 30 searches/month -- essentially zero traffic opportunity.
- **"Calgary real estate market report"** was rated Medium but gets only 20 searches/month.

**Strategic Impact:** V1's volume estimates would have led to misguided prioritization. Cochrane content should be a top priority (12,100/mo) but was deprioritized as "Low." Conversely, "homes for sale Calgary AB" would have been pursued as a high-value term when it has almost no search demand.

---

## 3. Technical Issues: What V2 Found That V1 Missed

V1's technical analysis was thorough on traditional on-page SEO (titles, metas, H1s, schema, canonicals, alt text, robots.txt). V2 confirmed all v1 findings and added three critical new discoveries:

### 3a. US-Centric Content (CRITICAL -- V1 MISSED)

V2 identified that **6+ buyer/seller pages contain US-specific content that is factually wrong for Calgary/Alberta**:

| Page | US Content | Canadian Equivalent |
|------|-----------|---------------------|
| /buyers/mortgage-calculator/ | PMI (Private Mortgage Insurance) | CMHC mortgage insurance |
| /buyers/what-are-closing-costs/ | Escrow, settlement accounts, "most states" | Alberta Land Titles, property tax adjustments |
| /buyers/making-an-offer/ | "most states" | Canada has provinces |
| /buyers/financial-terms-glossary/ | VA loans, FHA, Fannie Mae, Freddie Mac, HUD | CMHC, GDS/TDS ratios, mortgage stress test |
| /buyers/first-time-buyers/ | No Canadian programs mentioned | FHSA, HBP (RRSP), CMHC incentives |

V1 noted the platform was "RealtyPress / IDX Broker" and identified generic content issues in the site structure analysis, but did not flag the US-centric content as a distinct critical finding. V2 elevated this to the #2 most critical issue because it directly undermines trust with Calgary homebuyers.

### 3b. Hreflang Gap (HIGH -- V1 MISSED)

V2 discovered the site offers **11 language options** in a language switcher but has **zero hreflang tags** implemented. This creates confusion for search engines and could cause indexing issues. V1 did not examine multilingual features.

### 3c. Avanan Proxy URLs (MEDIUM -- V1 MISSED)

V2 found that 3 social media links (Instagram, YouTube, LinkedIn) in the site's sidebar route through `url.avanan.click` -- an email security proxy service -- instead of linking directly. This creates unnecessary redirects and passes link equity to a security proxy domain. V1 did not examine outbound link destinations.

### V1 Findings Confirmed by V2

| Issue | V1 Found | V2 Confirmed |
|-------|----------|-------------|
| Broken /contact/thank-you/ (403 error) | Yes | Yes |
| No schema markup on 31/36 pages | Yes (86%) | Yes (91.7% -- counted differently) |
| Missing HSTS header on all pages | Yes | Yes |
| OG tags missing on 89% of pages | Yes | Yes |
| 6 title tags too short | Yes | Yes |
| 4 blog meta descriptions too long (300-524 chars) | Yes | Yes |
| 11 meta descriptions under 70 chars | Yes | Yes |
| Homepage has 2 H1 tags | Yes | Yes |
| 23 images missing alt text | Yes | Yes |
| Blog index not in sitemap | Yes | Yes |
| 3 pages missing canonical tags | Yes | Yes |
| No sitemap directive in robots.txt | Yes | Yes |

**All 12 core technical findings from v1 were confirmed by v2.** The v1 crawl was accurate.

---

## 4. Content Quality: From Empty to Detailed

### V1 Content Assessment

The v1 `audit-data-v1-backup.json` contained:
```json
"contentQuality": {}
```
This was an empty object -- **no content quality analysis was performed in v1**. The v1 site structure analysis noted content gaps (only 4 blog posts, community pages lack detail) but did not perform a page-by-page content audit.

### V2 Content Assessment

V2 produced a comprehensive 25-page content audit (`content-audit.md`) with:

| Metric | V2 Finding |
|--------|-----------|
| Overall Content Grade | D+ |
| Average Content Quality Score | 2.6 / 10 |
| Pages with Calgary-specific content | 2 of 25 |
| Pages with US-centric content | 6+ |
| Blog posts (total) | 4 (all same day, all "Sierra System") |
| About page word count | ~40 words (2 sentences) |
| "Calgary" keyword density on most pages | Under 0.5%; 0.0% on many |
| "Alberta" mentions across buyer/seller pages | 0 |
| "Neil Rowlandson" mentions in body content | 0 (outside About page) |

V2's page-by-page analysis revealed:
- **Homepage**: Only ~150 words of unique content, dual H1, no agent expertise signals
- **About page**: Only 40 words -- the #1 trust page on any agent site has essentially nothing
- **Buyer/seller pages**: 100% template boilerplate with zero localization
- **Community pages**: Zero descriptive content -- just listing feeds with template intros
- **Blog posts**: All published the same day, all authored by "Sierra System", all generic

This entire dimension was invisible in v1.

---

## 5. Competitor Landscape: From 6 to 21

### V1 Competitor Coverage

V1 analyzed **6 competitors** (all user-provided):
1. justinhavre.com
2. karenfawcett.ca
3. reevesrealty.ca
4. calgaryhousefinder.ca
5. kirbycox.com
6. jdrealestatecalgary.ca

### V2 Competitor Coverage

V2 analyzed **16 user-provided + 5 auto-discovered competitors** (21 total):

**User-Provided (16):**
1. justinhavre.com
2. calgaryhomes.ca (Justin Havre's second domain)
3. calgary.com (Justin Havre's third domain)
4. calgary-homes.com
5. bestcalgaryhomes.com (Cody Battershill / RE/MAX)
6. thinkcalgaryhomes.com
7. karenfawcett.ca
8. reevesrealty.ca
9. calgaryhousefinder.ca
10. kirbycox.com
11. jdrealestatecalgary.ca
12-16. Additional competitors from expanded list

**Auto-Discovered from SERPs (5):**
1. popowichrealestate.com (278 Google reviews, 5.0 rating)
2. calgary-real-estate.com (11,691 sitemap URLs, 3,247 content pages)
3. sellhomes.ca (1,249 blog posts)
4. donwong.ca (82 Google reviews, 2% Realty model)
5. makeyourmovecalgary.ca (CIR Realty -- same brokerage as client!)

### New Intelligence from V2

| Finding | V1 | V2 |
|---------|----|----|
| Justin Havre's multi-domain empire | Mentioned calgaryhomes.ca | Fully mapped: justinhavre.com + calgaryhomes.ca + calgary.com (all three analyzed) |
| Calgary.com uses Sierra Interactive | Not known | Discovered -- same platform as client, with 419 blog posts vs client's 4 |
| bestcalgaryhomes.com / Calgaryism brand | Not analyzed | Identified: 75,000+ social followers, HuffPost contributor, Feedspot listed |
| popowichrealestate.com | Not known | Auto-discovered: 278 Google reviews at 5.0, ranks for "Calgary real estate agent" |
| calgary-real-estate.com | Not known | Auto-discovered: 11,691 URLs, 3,247 content pages on REW platform |
| sellhomes.ca | Not known | Auto-discovered: 1,249 blog posts -- massive content play |
| makeyourmovecalgary.ca | Not known | Auto-discovered: CIR Realty agent (same brokerage as Neil!) |
| Platform comparison | "100% use REW" | Corrected: mix of REW, Sierra Interactive, WordPress, myRealPage, custom CMS |
| Content volume benchmarks | Estimated page counts | Actual sitemap URL counts for all competitors |
| Review landscape | Havre 2,600+, Reeves 180+ | Expanded: Havre 3,000+, Popowich 278, Reeves 180+, JD 86, Don Wong 82, Kirby Cox 39 |

The discovery that **calgary.com runs Sierra Interactive** (the same platform as the client) with **419 blog posts vs. the client's 4** is particularly valuable -- it proves the platform is not the limitation, execution is.

---

## 6. Backlinks: From Nothing to Real Data

### V1 Backlink Data

V1 had **zero backlink data**. The `audit-data-v1-backup.json` contained no backlink fields, and the `link-graph.json` covered only internal linking.

### V2 Backlink Data (DataForSEO)

V2 produced comprehensive backlink intelligence:

**Client Backlink Profile:**
| Metric | Value |
|--------|-------|
| Domain Rating | 45 |
| Total Referring Domains | 209 |
| Total Backlinks | 280 |
| Dofollow Backlinks | Majority |
| Quality Assessment | Mostly low-quality web directories |

**Top Legitimate Backlinks:**
| Source | DR | Type |
|--------|-----|------|
| odp.org (DMOZ successor) | 291 | Directory (legitimate) |
| newhomelistingservice.com | 229 | Agent directory (relevant) |
| bobbimorrison.ca | 37 | Co-listing (relevant) |

**Backlink Quality Problem:** V2 revealed that the vast majority of the client's 280 backlinks come from a single spam directory network (backlinkboostdirectory.com, powerlinkdirectory.com, ahrefsdirectory.com, seotechdirectory.com, etc.) -- all using the same URL pattern (`/directory-website-list-1339/`). Only 2-3 backlinks are from legitimate, relevant sources.

### V2 Backlink Analysis Findings

V2 additionally produced:
- A **citation gap analysis** identifying 70+ directories where the client is NOT listed but competitors ARE
- A **30-action link building roadmap** with timeline and effort estimates
- A **local citation checklist** with 4 tiers (must-have, important, nice-to-have, strategic)
- A **competitor backlink comparison table** showing strategy differences
- **Estimated DR comparison** across all competitors (later confirmed with real DFS data)

The v2 backlink analysis document (`backlink-analysis.md`) estimated the client's DR at 5-10 with 5-15 referring domains. The actual DFS data showed DR 45 with 209 referring domains -- higher than estimated, but the quality assessment (mostly spam directories) was correct.

---

## 7. PageSpeed: From Nothing to Real Scores

### V1 PageSpeed Data

V1 had **zero PageSpeed or Core Web Vitals data**. No PSI tests were run.

### V2 PageSpeed Data (Google PSI API)

V2 tested 4 client pages and 5 competitor homepages:

**Client Performance:**

| Page | Mobile | Desktop | Mobile LCP | Desktop LCP |
|------|--------|---------|-----------|-------------|
| Homepage | 79 | 95 | 4,577ms | 1,378ms |
| About | 85 | 91 | 3,753ms | 802ms |
| Auburn Bay | 82 | 78 | 4,053ms | 1,262ms |
| Buyers | 92 | 87 | 3,154ms | 1,002ms |
| **Average** | **84.5** | **87.8** | **3,884ms** | **1,111ms** |

**Competitor Comparison:**

| Domain | Mobile | Desktop | Assessment |
|--------|--------|---------|------------|
| calgaryhomes.ca | 91 | 99 | Best overall |
| **sellingcalgarycastles.com** | **84.5** | **87.8** | **2nd place mobile** |
| reevesrealty.ca | 83 | 86 | Similar to client |
| kirbycox.com | 73 | 55 | Weakest desktop |
| justinhavre.com | 64 | 89 | Weak mobile |
| calgaryhousefinder.ca | 52 | 91 | Very weak mobile |

**Positive Finding:** PageSpeed is one area where the client performs well relative to competitors. This was entirely unknown in v1.

**Issue Identified:** All client pages exceed the 2.5-second LCP "good" threshold on mobile. Main opportunities: reduce unused CSS (~49 KiB) and unused JavaScript (~116 KiB).

---

## 8. Domain Metrics: Real Data Across Competitors

### V1 Domain Metrics

V1 had **no domain metric data** for any domain. No DR, no backlink counts, no referring domain counts.

### V2 Domain Metrics (DataForSEO)

| Domain | Domain Rating | Referring Domains | Total Backlinks |
|--------|--------------|-------------------|-----------------|
| **sellingcalgarycastles.com (CLIENT)** | **45** | **209** | **280** |
| justinhavre.com | 392 | 1,162 | 47,564 |
| calgaryhomes.ca | 316 | 1,016 | 5,792 |
| kirbycox.com | 271 | 443 | 3,375 |
| calgaryhousefinder.ca | 257 | 433 | 1,473 |
| bestcalgaryhomes.com | 218 | 581 | 1,842 |
| reevesrealty.ca | 204 | 61 | 523 |
| thinkcalgaryhomes.com | 129 | 107 | 497 |

**Key Insight:** The client's DR of 45 is the lowest of all analyzed competitors. justinhavre.com has 8.7x the DR, 5.6x the referring domains, and 170x the backlinks. Even the smallest competitor (thinkcalgaryhomes.com) has nearly 3x the DR.

**Note on DFS DR Scale:** DataForSEO Domain Rank uses a 0-1000 scale (not 0-100 like Ahrefs). The v2 backlink analysis estimated the client at DR 5-10 on a 0-100 scale, which roughly corresponds to the DFS score of 45 on their 0-1000 scale. The relative positioning (client is weakest) is correct regardless of scale.

---

## 9. Action Plan Evolution

### V1 Recommendations

V1 provided two layers of recommendations:

**From keyword-research.json (strategic recommendations):**
- Immediate: Target long-tail/low-competition keywords + informational content
- Medium-term: Property type pages + seller-focused content
- Long-term: Head terms (requires authority building)

**From client-site-structure.md (20 prioritized recommendations):**
1. Fix broken /contact/thank-you/ page
2. Add RealEstateAgent + LocalBusiness schema
3. Enable HSTS
4. Add OG tags
5. Rewrite short title tags
... through 20 items

**V1 Limitations:**
- No content rewrite recommendations (content quality was not assessed)
- No backlink/citation building recommendations (no backlink data existed)
- No PageSpeed recommendations (no PSI data existed)
- No review acquisition strategy
- No content calendar with specific topics and keyword density targets
- No competitor-informed strategy (only 6 competitors analyzed)

### V2 Recommendations

V2 provides **47 specific action items** organized into 4 phases:

**Quick Wins (Week 1-2): 12 items**
- Fix blog meta descriptions, add "Calgary" to titles, fix Avanan proxy links, remove broken page from sitemap, fix dual H1, claim GBP, submit to 6 high-authority directories

**Short-Term (Month 1-2): 10 items**
- Rewrite About page (40 words to 800+), rewrite ALL buyer/seller pages with Calgary/Alberta content, add schema, add OG tags, complete 14 Tier 1 citations, add community page content, launch review acquisition campaign

**Medium-Term (Month 2-4): 13 items**
- Publish 4+ blog posts (with specific topics, keywords, word counts, and density targets), build 15 Tier 2 citations, create Instagram + YouTube, submit Calgary Herald op-ed, build partner cross-links, add hreflang or remove language switcher

**Long-Term (Month 4+): 12 items**
- Tier 3 citations, Chamber of Commerce, community association sponsorships, Feedspot submission, market report PDFs, .edu scholarship backlinks, property type landing pages, FAQPage schema

### V2 New Deliverables (Not in V1)

| Deliverable | Description |
|-------------|-------------|
| 12-month content calendar | Specific blog topics with target keywords, word counts, and density targets |
| Citation checklist (70+ directories) | 4-tier checklist with consistent NAP template |
| 30 link building actions | Prioritized with effort, timeline, and estimated DR value |
| NeuronWriter-style keyword counts | Per-article keyword frequency targets for content writers |
| Competitor SERP presence matrix | Which competitor appears for which keywords |
| Backlink quality assessment | Identified spam directory network in client's existing profile |

---

## 10. Overall Grade

### V1 Grade: D+

From `audit-data-v1-backup.json`:
> "overallGrade": "D+",
> "gradeSummary": "sellingcalgarycastles.com has zero organic visibility -- not ranking for any of 25 target keywords in a market with 5,500+ active listings and $641K average prices. However, Neil's 20-year real estate track record, banking background, and CIR Realty backing represent significant untapped authority that competitors are not leveraging at this level."

### V2 Grade: D+

From `FINAL-AUDIT-REPORT.md`:
> "Overall Site Health Grade: D+"
> "sellingcalgarycastles.com is a 36-page real estate website built on Sierra Interactive that currently has zero organic search visibility across all 25 target keywords researched."

### Why the Grade Stayed the Same

The grade didn't change because the fundamental problems are the same:
1. Zero organic visibility (confirmed by both)
2. Near-zero original content (confirmed by v2's content audit)
3. Minimal domain authority (quantified by v2 at DR 45, lowest of all competitors)
4. No Google reviews (confirmed by both)
5. No local SEO presence (confirmed by both)

However, **v2 provides significantly more evidence for the grade**. V1 arrived at D+ based primarily on keyword invisibility and on-page technical issues. V2 arrives at D+ based on:
- Quantified backlink weakness (DR 45 vs competitors at 129-392)
- Content quality scoring (2.6/10 average across 25 pages)
- US-centric content problem (trust-destroying for a Calgary agent)
- PageSpeed data (acceptable but mobile LCP needs work)
- Competitive gap analysis (38 pages vs 2,863-10,450 for competitors on the same platform)
- Citation gap analysis (nearly absent from all major directories)

---

## Data Quality Assessment

### Which Audit Is More Reliable?

**V2 is substantially more reliable** for the following reasons:

| Factor | V1 | V2 | Winner |
|--------|----|----|--------|
| Search volume data | Qualitative guesses (40% accurate) | DataForSEO API (actual search data) | V2 |
| SERP data | WebSearch (possibly US-biased) | DFS API with Canadian location code | V2 |
| Backlink data | None | DataForSEO API (real metrics) | V2 |
| PageSpeed data | None | Google PSI API (real scores) | V2 |
| Domain metrics | None | DataForSEO API (real DR/backlinks) | V2 |
| Content analysis | Empty (not performed) | 25-page audit with scoring | V2 |
| Competitor coverage | 6 competitors | 21 competitors (5 auto-discovered) | V2 |
| On-page technical audit | Thorough, accurate | Confirmed all v1 findings + 3 new ones | Both (v1 was solid here) |
| Actionability | General recommendations | 47 specific actions with timelines | V2 |

### V1 Strengths (What V1 Got Right)

1. **Accurate technical crawl**: Every on-page issue identified in v1 was confirmed by v2.
2. **Correct overall assessment**: D+ grade and "zero organic visibility" finding were correct.
3. **Solid competitor qualitative analysis**: The v1 competitor-analysis.json provided useful strategic insights about each competitor's strengths and weaknesses.
4. **Good strategic framing**: V1's recommendations about targeting long-tail keywords first, then building to head terms, remain sound.
5. **Justin Havre identification**: V1 correctly identified justinhavre.com as the dominant competitor.

### V1 Weaknesses (Where V1 Fell Short)

1. **Qualitative volume estimates were 40% accurate** -- and the 3 "very wrong" estimates would have caused strategic misallocation.
2. **US-biased SERP results**: V1's WebSearch likely returned US-centric results (Zillow #1 for many queries) while Canadian DFS data tells a different story.
3. **Zero content quality analysis**: The most damaging finding (US-centric template content) was entirely missed.
4. **Zero backlink intelligence**: Could not quantify the competitive gap or identify the spam directory problem.
5. **Zero PageSpeed data**: Could not identify mobile LCP issues or benchmark against competitors.
6. **Limited competitor set**: 6 competitors vs 21 missed critical intelligence (bestcalgaryhomes.com's Calgaryism brand, calgary-real-estate.com's massive content volume, makeyourmovecalgary.ca being at the same brokerage).
7. **Internal linking analysis was broken**: V1's `internalLinking` data showed `total_pages: 0`, `total_internal_links: 0`, and flagged all 35 pages as orphans with `avg_inbound_links: 0.0`. V1's crawl-based `client-site-structure.md` contradicted this, showing pages with 100+ internal links. The v1 JSON data was clearly from a failed analysis.

---

## Summary of Changes by Dimension

### Confirmed (V1 = V2)
- Client has 0/25 keyword rankings
- Overall grade: D+
- 38 total sitemap URLs, 36 content pages, 4 blog posts
- All 12 on-page technical issues
- justinhavre.com is the dominant competitor
- Platform is Sierra Interactive (v1 said "RealtyPress / IDX Broker" but v2 correctly identifies Sierra Interactive)

### Corrected (V1 was inaccurate)
- Search volume estimates (40% accurate; 3 very wrong)
- SERP compositions (US-biased in v1)
- Platform identification: V1 said "RealtyPress / IDX Broker" -- V2 correctly identifies Sierra Interactive
- Competitor platform: V1 said "100% use REW" -- V2 found mix of REW, Sierra Interactive, WordPress, myRealPage
- Internal linking analysis: V1 JSON data was broken (all zeros)

### New in V2 (V1 had zero data)
- DataForSEO search volumes for all 25 keywords
- Real SERP top 5 from DFS API for all 25 keywords
- Domain Rating and backlink metrics for 8 domains
- Client backlink profile (50 backlinks + 20 referring domains analyzed)
- PageSpeed Insights for 4 client pages + 5 competitor pages
- Content quality audit with page-by-page scoring
- US-centric content problem identification
- Hreflang gap identification
- Avanan proxy URL identification
- Organic keyword profile (client: 0, justinhavre.com: 100+)
- 10 additional competitors analyzed
- 5 auto-discovered competitors from SERPs
- 70+ citation gap analysis
- 47-item prioritized action plan
- 12-topic content calendar with keyword density targets
- 30-action link building roadmap with 4 implementation phases

---

## Final Assessment

The v2 audit is a fundamentally different product from v1. Where v1 was a competent on-page technical audit with qualitative competitive intelligence, v2 is a comprehensive, data-driven SEO diagnostic with quantified competitive gaps, real search volume data, backlink intelligence, PageSpeed benchmarking, and a detailed implementation roadmap.

The most important new findings that should influence strategy are:

1. **"Cochrane homes for sale" has 12,100 monthly searches** -- not "Low" as v1 estimated. This should be a top-5 content priority.
2. **The US-centric content problem** is actively damaging trust. Rewriting buyer/seller pages is urgent.
3. **The client's backlink profile is almost entirely spam directories.** Legitimate link building must start from near-zero.
4. **calgary.com (Havre-owned) runs the same Sierra Interactive platform** with 419 blog posts vs the client's 4. The platform is not the bottleneck.
5. **PageSpeed is actually a competitive advantage** -- one of the few areas where the client outperforms most competitors.
6. **The review gap (0 vs 3,000+)** is the most visible trust deficit in local search.

---

*Comparison completed 2026-03-31. Data sources: v1 backup files (March 23), v2 research files and FINAL-AUDIT-REPORT.md (March 31). All data cross-referenced between sources.*
