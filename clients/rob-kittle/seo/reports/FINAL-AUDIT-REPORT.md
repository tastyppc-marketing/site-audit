# Kittle Real Estate — Master SEO Audit Report

**Client:** Rob Kittle / Kittle Real Estate
**Site:** https://www.kittlerealestate.com
**Market:** Fort Collins / Northern Colorado (Larimer + Weld counties; light Boulder / Adams / Jefferson coverage)
**Address:** 300 S Howes St, Fort Collins, CO 80521  ·  **Phone:** 970-460-4444
**Audit Date:** May 9, 2026
**Goal:** Lead generation
**Specialty Programs:** Buy-Before-You-Sell, Cash Offer (close in 59 days), Remodel-on-our-Dime, Sell-and-Stay
**Competitors Benchmarked:** thegroupinc.com, c3realestatesolutions.com, mullenbergteam.com, ambassadorcolorado.com, nocohometeam.com

---

## Executive Summary

### Overall Site Health Grade: **F (37 / 100)**

Cited from `audit-data.json → reportingIntelligence.siteHealthGrade.letterGrade = "F"`, composite score 37/100, with the floor-penalty applied because of the count of critical issues. Category breakdown:

| Category | Score | Read |
|---|---|---|
| Technical SEO | 0 / 100 | Critical — template bug, schema breakage, security headers missing |
| Content quality | 13.4 / 100 | Critical — 38 pages flagged thin / soft-404; specialty-program pages don't exist |
| Indexability | 82 / 100 | OK — but masks the real problem (96.8% of indexed URLs are auto-generated IDX filter pages) |
| Backlinks | 100 / 100 | Score is high but **misleading** — DataForSEO file wasn't loaded at run time; qualitative score puts Kittle 3rd of 6 sites researched |
| E-E-A-T | 18 / 100 (Poor) | Author/date attribution is 0 / 60 pages; Organization schema has empty name; no LocalBusiness schema |

### Top 5 Most Critical Issues

1. **Unrendered template variable `$COUNT$ Listing$S$">Search Listings` is rendering as raw text (and as an H2 in the heading tree) on roughly half the site** — 29 of 57 sampled pages, including `/buyers/`, `/sellers/`, `/contact/`, `/communities/`, `/sellers/free-market-analysis/`, **`/agents/rob-kittle/` (Rob's own bio)** and 12 of 14 sampled blog posts. This is what Google's crawler indexes; user-impact depends on whether a JS widget rewrites the node post-load. SEO impact is unconditional. Single template file fix.

2. **No dedicated landing pages exist for the four specialty programs** — Buy-Before-You-Sell, Cash Offer (59 days), Remodel-on-our-Dime, Sell-and-Stay. Of 57 pages audited, only the homepage + 4 blog posts mention any program at all; **Sell-and-Stay is not mentioned anywhere on the site.** These are Kittle's competitive moat — the moat is invisible to Google.

3. **Homepage `<title>` is 220 characters, keyword-stuffed, with a typo ("Real Estate Agents Fort Collin" — missing "s") and references "Colorado Springs"** — a market Kittle does not serve. Google truncates at ~60 chars, so the visible SERP title is "Northern Colorado Real Estate Agents - Fort Collins Realtors® - Top Re…". Meta description is 312 characters and runs into a sentence fragment ("Whether you").

4. **Site-wide IDX index bloat: 15,664 of 16,280 indexed URLs (96.8%) are auto-generated `/<city>-homes-for-sale/<filter>/` filter pages** that all self-canonical to themselves. Each tells Google "I'm canonical." This is the prime cause of suppressed quality signals across the whole domain (Panda-style demotion risk).

5. **Foundational on-page tags are broken on the highest-equity pages.** `/about/`, `/luxury-homes/`, `/agents/rob-kittle/`, `/communities/move-to-fort-collins-co/`, `/communities/move-to-windsor-co/`, `/communities/move-to-greeley-co/`, all 5 Featured-Search hub pages (luxury, horse, golf, condos, new-construction), and 6 other key pages have **zero H1 tags** (14 total of 57 sampled). The homepage `Organization` JSON-LD has `name = ""`. There is no `RealEstateAgent` or `LocalBusiness` schema anywhere. `/buyers/relocation/` has **5 H1 tags** on a page that ranks #5 for "relocation real estate Fort Collins."

### Site State Overview

Kittle Real Estate is the highest-profile *brand* in Northern Colorado real estate — 5x #1 NoCo team in the Wall Street Journal / RealTrends, 400+ Google reviews, 2024 Best of Fort Collins Community Choice winner, 7,500+ families served, BBB Torch Award 2022. The homepage, reviews page, and a handful of 2026-vintage Rob-authored blog posts are sharp, locally specific, and converting. Everything between those bright spots is a 2010-era IDX-template skeleton: a sitewide template bug rendering placeholder variables as text, four specialty-program landing pages that simply do not exist, missing H1 tags on the team leader's own bio, a 4-word `/sellers/home-value/` page on the primary seller conversion path, and a 220-character keyword-stuffed homepage title pointing at a market the team doesn't even serve. The brand authority is doing all the heavy lifting; the site is leaking rankings, leaking trust signals, and (most importantly) leaking conversions on the four programs that distinguish Kittle from every other agent in the market. The work to fix is well-scoped — most of the highest-impact items are template-level fixes, not strategy questions — and the fix-list is sequenced below.

---

## Section 1: Search Visibility Assessment

### 1.1 Current Keyword Rankings (top-10 visibility on 25 strategic terms researched)

Kittle appears in the top 10 for **6 of 25 keywords researched** — and dominates only on its branded queries. The primary local competitor (thegroupinc.com) appears in the top 10 for 5 keywords.

| # | Keyword | Est. Volume | Kittle | The Group | Top Result |
|---|---|---|---|---|---|
| 1 | Kittle Real Estate Fort Collins | Medium | **#1** | — | kittlerealestate.com |
| 2 | Rob Kittle realtor | Medium | #6 | — | zillow.com |
| 3 | Northern Colorado real estate | High | **#4** | #10 | coloproperty.com |
| 4 | best realtor in Fort Collins | High | **#3** | — | realestate.usnews.com |
| 5 | relocation real estate Fort Collins | Low-Med | **#5** | #3 | kennarealestate.com |
| 6 | Old Town Fort Collins homes | Medium | **#8** | — | fortcollinsrealestatebyjoyce.com |
| 7 | trade in your house Northern Colorado | Low | #10 (sellers page) | — | houzeo.com |
| 8 | Fort Collins homes for sale | Very High | Not in top 10 | — | zillow.com |
| 9 | homes for sale in Fort Collins CO | Very High | Not in top 10 | — | zillow.com |
| 10 | Loveland CO homes for sale | High | Not in top 10 | — | zillow.com |
| 11 | Greeley homes for sale | High | Not in top 10 | — | zillow.com |
| 12 | Windsor / Wellington / Timnath / Larimer County (homes for sale) | High–Med | Not in top 10 | — | zillow.com |
| 13 | buy a home in Fort Collins | High | Not in top 10 | #6 | zillow.com |
| 14 | sell my house Fort Collins | High | Not in top 10 | — | mullenbergteam.com |
| 15 | Fort Collins real estate market 2026 | High | Not in top 10 | #9 (Forecast) | gjsentinel.com |
| 16 | cash offer for home Fort Collins | Medium | Not in top 10 | — | webuyhouses.com |
| 17 | buy before you sell program Colorado | Low-Med | Not in top 10 | — | kennarealestate.com |
| 18 | luxury homes Fort Collins | Medium | Not in top 10 | — | zillow.com |
| 19 | first time home buyer Fort Collins | Medium | Not in top 10 | #6 (Loan Programs) | impactdf.org |
| 20 | Fort Collins new construction homes | High | Not in top 10 | — | zillow.com |
| 21 | acreage homes for sale Northern Colorado | Medium | Not in top 10 | #8, #9 (NoCo Voice) | homes.com |
| 22 | Fort Collins real estate agent reviews | Medium | Not in top 10 | — | zillow.com |

**Read:** Brand authority is intact. **Transactional and informational long-tail are entirely missing from the top 10** — the categories that drive new buyers/sellers. Every "Not in top 10" row above is a content / on-page / schema gap that the rest of this report addresses.

### 1.2 High-Value Keyword Opportunities

**Critical (rebuild missing pages):**
- "buy before you sell program Colorado" — kennarealestate.com #1, Kittle has no landing page
- "cash offer for home Fort Collins" — webuyhouses.com #1, no Kittle equivalent
- "sell my house Fort Collins" — mullenbergteam.com #1, no Kittle equivalent
- "first time home buyer Fort Collins" — thegroupinc.com #6, no Kittle equivalent
- "Fort Collins real estate market 2026" — gjsentinel.com #1, The Group #9, Kittle has no `/forecast/` or `/market-report/`

**Strategic (optimize existing pages):**
- "Fort Collins homes for sale" — homepage + IDX hub need title/H1/schema work
- City-level "homes for sale" terms (Loveland / Greeley / Windsor / Wellington / Timnath / Larimer County) — build per-city pages mirroring the Old Town page that already ranks #8
- "luxury homes Fort Collins" — Kittle has a `/luxury-homes/` page, but it has 0 H1, the og:title carries trailing newlines, and it's mis-tagged with Event schema
- "Old Town Fort Collins homes" — already #8; expand the 843-word page to 2,000+ words to dethrone Joyce Giard
- "Rob Kittle realtor" — currently #6; with review schema and a real bio (currently 136 words), this should be #1

**Long-tail content cluster (build the editorial hub):**
- Market & pricing: "median home price Fort Collins right now," "are home prices Fort Collins going down 2026," "is now a good time to buy in Fort Collins," "how long are homes staying on the market in Fort Collins," "what is the forecast for Northern Colorado real estate in 2026 / 2027"
- Process & programs: "what is buy-before-you-sell," "what does a cash offer for my home actually mean," "how fast can I sell my house in Fort Collins," "what down-payment assistance is available in Larimer County," "Knock Home Swap NoCo"
- Neighborhood / geography: "what's it like to live in Old Town Fort Collins," "is Timnath a good place to live," "best schools in Windsor CO," "how does Wellington compare to Fort Collins for families"
- Trust / agent: "best real estate agents in Fort Collins," "questions to ask a realtor before hiring," "Fort Collins realtor commission"

### 1.3 Competitive Landscape (appearance count across the 25 keywords)

**Tier 1 — National portals (saturate every geo query):**

| Domain | Approx. appearances | Note |
|---|---|---|
| zillow.com | 24 / 25 | #1 on 12+ keywords |
| redfin.com | 18 / 25 | Always top 5 on geo + market queries |
| trulia.com | 14 / 25 | Strong on city geo terms |
| homes.com | 14 / 25 | Aggressive on long-tail (acreage, neighborhood) |
| movoto.com | 8 / 25 | Inflated listing counts |
| remax.com / coldwellbanker.com | 7 / 25 | Franchise corporate pages |
| realtor.com | 5 / 25 | Less visible than Zillow/Redfin in this market |

**Tier 2 — Local aggregators / MLS / luxury portals:**

| Domain | Appearances | Notes |
|---|---|---|
| coloproperty.com | 8 / 25 | **Local IRES MLS-aligned aggregator. Owns #1 for "Northern Colorado real estate."** |
| listwithclever.com | 4 / 25 | Editorial — ranks on "best agent" + cash buyer terms |
| houzeo.com | 4 / 25 | FSBO/discount aggregator — ranks on trade-in + cash buyer terms |
| homelight.com | 3 / 25 | Editorial + agent matching |

**Tier 3 — Local independents (the actual peer group for Kittle):**

| Domain | Appearances | Type |
|---|---|---|
| **thegroupinc.com** | 5–6 / 25 | Primary local competitor; dominant local-independent. Ranks via Forecast, Loan Programs, Relocation, NoCo Voice |
| **kennarealestate.com** | ~10 / 25 | **Major *content* competitor.** Denver-metro brokerage out-ranking locals on FoCo long-tail with deep guide pages (BBYS, FTHB, relocation, luxury, lots/acreage) |
| **kittlerealestate.com** | 6 / 25 | Brand-strong, content-thin |
| fortcollinsrealestatebyjoyce.com | 4 / 25 | RE/MAX agent — Old Town authority |
| **mullenbergteam.com** | 2 / 25 | **#1 for "sell my house Fort Collins"** with focused selling-process page |
| The Levi Group / Brandon Rearick | 3 / 25 | Market-report blog content |

---

## Section 2: Technical SEO Issues

### 2.1 Critical (fix immediately)

**1. Sitewide template bug — `$COUNT$ Listing$S$">Search Listings` rendering as raw text.**
What it is: a Sierra Interactive IDX widget placeholder is appearing inside server-rendered HTML as an H2 on 29 of 57 sampled pages, including Rob Kittle's own bio at `/agents/rob-kittle/`. Why it matters: Google indexes server-rendered text, so this places literal `$COUNT$` and `$S$` strings in the heading tree of the team-leader page and most blog posts. How to fix: trace the single template file in Sierra Interactive that emits the listings-count widget, populate the dynamic count server-side, and validate with a `--wait 8000` Playwright pass. Single fix; sitewide impact.

**2. Homepage title: 220 characters, with typo and out-of-market reference.**
What it is: `"Northern Colorado Real Estate Agents - Fort Collins Realtors® - Top Realtors in Colorado - Houses for Sale Fort Collins - Real Estate Agents Fort Collin - Real Estate Near Me - Best Real Estate Agents in Colorado Springs"`. Typo "Fort Collin" (missing "s"); "Colorado Springs" is not a market Kittle serves. Why it matters: Google truncates at ~60 chars; the SERP title is keyword-stuffed past the cutoff and the typo is one of the visible characters before the truncation. How to fix: rewrite to ~60 chars: `"Kittle Real Estate | Fort Collins & Northern Colorado Realtors"` or `"Northern Colorado Real Estate | Fort Collins Realtors | Kittle"`.

**3. Homepage meta description: 312 characters, runs into a sentence fragment ("Whether you").**
How to fix: rewrite to ≤155 chars; lead with the unique proof point ("more 5-star reviews than any other NoCo agent" or "5x #1 Northern Colorado team in WSJ / RealTrends") plus a soft CTA.

**4. IDX index bloat — 96.8% of indexed URLs are auto-generated filter pages.**
What it is: 15,664 of 16,280 sitemap URLs are `/<city>-homes-for-sale/<filter>/` Sierra Interactive bedroom/bathroom/MLS-ID filter combos, every one of them self-canonicaling to itself. Why it matters: Panda-style sitewide quality demotion risk; thousands of near-duplicate pages dilute the domain's overall quality signal. How to fix: option A (recommended) — Sierra-template-level canonical from filter pages to their parent city hub. Option B — `<meta name="robots" content="noindex, follow">` on the filter template. Option C — robots.txt `Disallow: /*-homes-for-sale/*/` (loses link-equity flow; least preferred).

**5. Broken `Organization` schema — homepage JSON-LD has `name = ""`.**
How to fix: in the Sierra Interactive Organization-schema config, set `name: "Kittle Real Estate"`. While editing, replace with `RealEstateAgent` + `LocalBusiness` types (see High-Priority below).

**6. 14 of 57 audited pages have zero H1 tags** — including `/about/` (1,330 words), `/agents/rob-kittle/`, `/communities/move-to-fort-collins-co/`, `/communities/move-to-greeley-co/`, `/communities/move-to-windsor-co/`, all 5 Featured-Search hub pages (`/luxury-homes/`, `/horse-properties/`, `/new-construction/`, `/golf-course-homes/`, `/condominiums-townhomes/`), and 4 others. This is a templating-level bug, not 14 one-off omissions.

**7. `/buyers/relocation/` has 5 H1 tags** — "RELOCATION", "FORT COLLINS", "LOVELAND", "GREELEY", "WINDSOR." Page currently ranks #5 for "relocation real estate Fort Collins." Reduce to one H1 ("Relocation to Northern Colorado"); demote the city H1s to H2.

**8. Test pages publicly indexable** — `/test/`, `/test1/`, `/calendly-test/` are all live and in the sitemap. Remove or noindex.

### 2.2 High Priority

**9. Featured-Search hub pages share an identical 224-character meta description with a typo ("professionalsthat" — missing space).** Pages: `/luxury-homes/`, `/horse-properties/`, `/new-construction/`, `/golf-course-homes/`, `/condominiums-townhomes/`. Identical meta on five different intent pages = Google de-indexes / consolidates. Rewrite five unique descriptions.

**10. 13 pages share the boilerplate description** "Search homes for sale in Northern Colorado. Listings include large photos, school info, detailed maps, and more." Includes `/sellers/home-value/`, `/sellers/decide-to-sell/`, `/buyers/relocation/`, `/buyers/foreclosures/`, `/financing-options/`, `/seller-tips/fort-collins-co/`. Rewrite each.

**11. Permanent typo URL `/buyers/neigborhood-report/`** is referenced from homepage body copy and internal links. 301 to `/buyers/neighborhood-report/`; update internal links.

**12. Open Graph + Twitter Card meta missing on 11 of 13 sampled pages** (everything except the blog post and `/luxury-homes/`). All shared links render with the same generic hero image, no headline. Twitter Card meta is absent entirely sitewide. Single template fix.

**13. og:title and og:description on `/luxury-homes/` carry literal trailing newlines** (`\n`) — a Sierra Interactive content-entry artifact that breaks display in some social previews.

**14. Image alt-coverage at 62% sitewide** (1,162 images / 441 missing alt across 22 audited pages). Homepage is the outlier at 84% missing alt (mostly repeating "tick" bullet icon image used 8+ times — should be CSS). Worst pages by missing-alt count: `/golf-course-community/move-to-broomfield-greenway-park-golf-course-community-co/` (68/101), `/communities/move-to-briggsdale-co/` (62/121), `/communities/move-to-denver-co/` (62/127). Establish the rule: hero & decorative = `alt=""`; logo / award / photo = descriptive alt.

**15. Two parallel community URL systems cannibalize each other.** `/communities/move-to-<city>-co/` (77 entries) and `/<city>-co-listings/` (12 entries) cover the same intent. Consolidate, 301 the loser.

**16. Top-level `/selling-your-home-*` pages live outside `/sellers/`** — should be `/sellers/disclosure/`, `/sellers/negotiating/` etc. 301 the old URLs.

**17. `/buyers/`, `/sellers/`, `/contact/`, `/communities/` have `lastmod` of 2024-07-26.** IDX pages get refreshed daily; editorial pages do not. Update the lastmod or split sitemaps.

### 2.3 Medium Priority

**18. Security headers missing site-wide** — `Strict-Transport-Security` (HSTS), `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. All add at Cloudflare. Modest ranking factor + Lighthouse Best Practices win.

**19. No BreadcrumbList JSON-LD or visible breadcrumbs anywhere.** Adds rich-result eligibility and improves internal-link signaling.

**20. No FAQ schema** despite 8-question Q&A blog posts ("8 questions Northern Colorado sellers are asking…").

**21. No Review / AggregateRating schema** despite the homepage prominently advertising "400+ reviews / more 5-star reviews than any other Northern Colorado agent." Massive missed opportunity for rich-result eligibility on "Fort Collins real estate agent reviews" (currently not in top 10).

**22. `/luxury-homes/` is tagged with `Event` schema** (×3 entries with `Place` / `PostalAddress` / `GeoCoordinates`). Wrong intent — confuses Google about page purpose. Replace with the correct commercial-property page type.

**23. Homepage loads 85 scripts and 16 stylesheets.** Most are Sierra-template defaults. Defer third-party (Calendly, hifello.com landing pages, YouTube embeds) and bundle where possible. CWV (LCP/TBT) impact.

**24. Featured-Searches section uses anchors with no link text** (Condominiums, New Construction, Single Family Homes, Virtual Tours all link without anchor text). Internal anchor-text strength is wasted on commercial-intent pages.

**25. Internal-link density is below baseline.** Per `audit-data.json → internalLinking`: 2,540 pages analyzed, 3,304 contextual internal links, average 1.3 inbound links per page (target ≥ 2.0), 42 orphans, 2,539 pages "unreachable from homepage via contextual links" (the analyzer counts only contextual links, not nav/footer — but the gap is still meaningful for hub→spoke equity flow).

**26. Two redirect chains:** 22 chains site-wide (per `crawlBudgetHealth`), one with 4 hops (Google's max is 5; recommend ≤ 1). Fix the longest first.

### 2.4 Lower Priority (defensible but worth fixing)

**27. Homepage `lastmod` is stale (2024-07-26).** Sierra regenerates IDX pages daily; editorial pages do not. No `sitemap_index.xml` (single 16k-URL file is within the 50k limit, but split would let GSC report indexing per content type).

**28. Aggressive bot blocks (Amazonbot, PetalBot, Barkrowler) in robots.txt** are intentional but worth a client conversation — Amazon's bot is increasingly used to feed Alexa/Bedrock training data. Decide explicitly whether to opt in or out.

**29. Crawl-delay: 5 in robots.txt for `User-agent: *`** is restrictive; Bing respects it (5s × 16,280 URLs ≈ 22.6 hours per full Bing crawl). Reduce to 1 or remove.

---

## Section 3: Content Assessment

### 3.1 Headline finding — the `$COUNT$` template bug (CRITICAL)

`$COUNT$ Listing$S$">Search Listings` is rendering as **literal H2 text in server-rendered HTML** on 29 of 57 sampled pages. Confirmed pages include `/buyers/`, `/sellers/`, `/contact/`, `/communities/`, all 4 sampled `/sellers/*` sub-pages, all 3 sampled `/buyers/*` sub-pages, `/financing-options/`, `/agents/rob-kittle/`, and 12 of 14 sampled blog posts. This is what Google's crawler indexes; user-visibility depends on a JS widget rewriting the node post-load. SEO impact is unconditional — Google sees `$COUNT$` and `$S$` placeholder text in the heading tree of the team-leader's bio. Single template-level fix.

A second related-post widget bug surfaces an orphan H3 — **"Who Can Help Sell My Home in Windsor, CO?"** — on most non-blog pages. The widget isn't context-aware; it's broadcasting a single Windsor seller blog post as the related-post on `/buyers/`, `/contact/`, `/communities/`, etc. Reduces topical clarity on 20+ pages.

### 3.2 Content depth analysis — word counts vs. competitor benchmark

Median word count across non-blog, non-community pages is ~480. The mid-funnel pages a buyer or seller actually clicks through to are universally thin:

| Page | Words | Severity |
|---|---:|---|
| `/sellers/home-value/` (primary seller lead-capture path) | **4** | CRITICAL |
| `/condominiums-townhomes/` (Featured Search hub) | **29** | CRITICAL |
| `/sellers/the-40-ds-of-moving/` | 38 | HIGH |
| `/agents/rob-kittle/` (Rob's own bio) | **136** | CRITICAL |
| `/sellers/marketing-your-home/` | 215 | HIGH |
| `/contact/are-you-ready-to-buy-or-sell/` | 213 | HIGH |
| `/financing-options/` | 300 | HIGH |
| `/sellers/free-market-analysis/` | 340 | HIGH |
| `/buyers/personalized-home-search/` | 351 | HIGH |
| `/buyers/` (primary buyer hub) | 355 | HIGH |
| `/sellers/` (primary seller hub) | 447 | HIGH |
| `/buyers/first-time-buyers/` | 548 | HIGH |
| `/luxury-homes/` | 624 | MEDIUM |
| `/buyers/relocation/` | 940 | MED (page ranks #5 — but has 5 H1s) |
| Homepage | 1,525 | OK (strongest non-community page) |
| `/communities/move-to-fort-collins-co/` | **4,392** | OK (strongest single page; 0 H1) |
| `/communities/move-to-greeley-co/` | 2,788 | OK (0 H1) |
| `/communities/move-to-loveland-co/` | 2,664 | OK |
| `/communities/move-to-wellington-co/` | 2,406 | OK |
| `/communities/move-to-timnath-co/` | 1,853 | OK (description 358 chars) |
| `/communities/move-to-windsor-co/` | 2,092 | OK (0 H1) |

**Read:** the community pages do their job; nothing else does. The team leader's bio has fewer words than a Yelp review.

For comparison, kennarealestate.com (the dominant non-local content competitor) ranks #1 for "buy before you sell program Colorado" with a 2,000+ word guide page. Mullenberg Team owns #1 for "sell my house Fort Collins" with a focused selling-process page. The Group's `/forecast/` ranks #9 for "Fort Collins real estate market 2026" — Kittle has no equivalent page at all.

The Python analyzer flags **38 pages as soft-404 (near-empty)** with content quality score 13.4 / 100 — directly downstream of these word-count gaps and the template bug.

### 3.3 Content quality — unique vs. generic / template

| Type | Count | Note |
|---|---|---|
| Pages with unique, well-localized content | 7 community pages + homepage + reviews + ~6 strong 2026 blog posts | The bright spots. Rob's voice in 2026 blog work is sharp. |
| Pages with template/boilerplate content | 30+ (`/sellers/*`, `/buyers/*`, `/financing-options/*`, all 5 Featured-Search hubs, all 4 sampled `/sellers/*` funnel pages) | "We help you buy/sell a home" generic copy with no NoCo specifics |
| Pages with the `$COUNT$` template bug | 29 of 57 sampled | See §3.1 |
| Pages with shared meta descriptions | 18+ pages share two boilerplate strings | See Technical SEO §2.2 |
| 2026 community guides misfiled in `/blog/` | 2 (Estes Park, Longmont) | Should promote to `/communities/move-to-{city}-co/` |
| Spun / duplicate blog posts | 3 (`/blog/who-can-help-sell-my-home-in-{loveland,windsor,fast-in-fort-collins}-co/`) | 460–500 words each, near-identical, **empty meta descriptions** |

### 3.4 Blog assessment

The blog is the **only** content silo on the site actively being written to a high standard in 2026. 88 posts total; sampled the 14 longest plus the 3 most recent and the 4 "who-can-help-sell-my-home-in-{city}" posts.

**Strongest posts:**

| Post | Words | Note |
|---|---:|---|
| `/blog/3-must-dos-for-first-time-home-buyers/` | 1,114 | Decent FTB content; no NoCo specifics |
| `/blog/moving-to-and-living-in-estes-park-co-2026-edition/` | 1,079 | **Misfiled — should be in `/communities/`** |
| `/blog/moving-to-and-living-in-longmont-co-2026-edition/` | 1,020 | **Misfiled — should be in `/communities/`** |
| `/blog/the-northern-colorado-housing-market-just-got-more-negotiable/` | 1,013 | Real market commentary, Rob's voice |
| `/blog/the-hidden-opportunity-in-northern-colorado-real-estate.../` | 1,006 | Sharp opinion |
| `/blog/luxury-homes-in-northern-colorado-what-it-actually-takes-to-sell.../` | 982 | Strong luxury thought-leadership |

**Weakest:** the 3 "Who can help sell my home in {city}" posts read as duplicate spun content with empty meta descriptions.

**Patterns:** 88 posts, no apparent pillar→cluster structure; no `/blog/category/sellers/` taxonomy URLs in the sitemap; 6 posts have titles > 70 chars; 3 posts have empty meta descriptions; the `$COUNT$` template bug appears on 12 of 14 sampled posts.

### 3.5 Specific Content Gaps

#### 3.5.1 The four specialty programs lack landing pages — the biggest single gap on the site

This is Kittle's competitive moat — and Google can't see it. Of 57 pages audited, **only the homepage and 4 blog posts** mention any specialty program. **Sell-and-Stay is not mentioned anywhere on the site.**

| Program | Dedicated landing page? | Mentioned on site? | Direct competitor reference |
|---|---|---|---|
| Buy-Before-You-Sell | **No** | Homepage + 1 blog post + 3 spun-content blogs | kennarealestate.com — dedicated BBYS hub ranks #1 for "buy before you sell program Colorado". mullenbergteam.com — "Mully Move-Up Method" |
| Cash Offer (close in 59 days) | **No** | Homepage + 3 spun-content blogs | mullenbergteam.com #1 for "sell my house Fort Collins" with cash-offer angle. webuyhouses.com category leader. |
| Remodel-on-our-Dime | **No** | Homepage only ("Designed to Sell" section) | mullenbergteam.com — "Clean Up to Closing" is the closest equivalent. **No direct competitor with the same offer; biggest moat being wasted.** |
| Sell-and-Stay | **No** | **Not mentioned anywhere on the site** | iBuyer / institutional buyers offer sell-leaseback nationally; no local team owns it. Wide-open SERP. |

The homepage's primary CTAs ("Cash Offer On My Home", "Sell Your Home", "Get a Cash Offer") all point at off-site or generic seller URLs, not dedicated converting landing pages.

**Recommended URLs to build:** `/buy-before-you-sell/`, `/cash-offer/`, `/remodel-on-our-dime/`, `/sell-and-stay/`. Each should ship with: H1 = program name, 90-second video explainer, "How it works" 3–5 step process, eligibility criteria, recent case study, FAQ (8–12 questions), dedicated 5-field form CRM-tagged for that program, and `Service` JSON-LD.

#### 3.5.2 Other specific content gaps

- **No `/market-report/` or `/forecast/` system.** thegroupinc.com `/forecast/` ranks #9 for "Fort Collins real estate market 2026"; gjsentinel.com (a newspaper) ranks #1. Kittle's community pages don't include market data either.
- **First-Time-Buyer guide with NoCo programs** (CHFA, Larimer County DPA, City of Fort Collins HBA, FirstBank DPA, USDA Rural for Wellington/Ault). thegroupinc.com `/loan-programs/` ranks #6.
- **Per-city seller-tips pages** — only Fort Collins and Greeley exist; missing Loveland, Windsor, Wellington, Timnath, Old Town, Berthoud.
- **Per-neighborhood pages under Fort Collins** — only Old Town exists. fortcollinsrealestatebyjoyce.com leads this format. Missing: Harmony, Horsetooth, Foothills, Campus West, Mountain Range Shadows, Rigden Farm, Centerre.
- **Awards page** (`/awards/`) — homepage mentions "many top awards" with no detail.
- **In-the-press page** (`/in-the-press/`) — WSJ #1 ranking is text-only, not a citable list.
- **Case-studies / `/sold/$X-over-asking/`** — featured-listings exist; narrative case studies do not.
- **Lead-magnet PDFs** — no Buyer's Guide, no Seller's Guide, no Relocation Packet (per city).
- **Interactive calculators** — Cost of Waiting is an article (`/contact/cost-of-waiting/`), not a calculator. No BBYS bridge-loan calculator. No Net Proceeds calculator.
- **Spanish-language Greeley page** — c3realestatesolutions.com holds this term largely uncontested; Greeley has a large Hispanic population.
- **Acreage / Ranch / Equestrian hub** — thegroupinc.com NoCo Voice ranks #8 / #9 for "acreage homes Northern Colorado"; Kittle has `/horse-properties/` but it's 0 H1, generic boilerplate description, 590 words.

---

## Section 4: Competitor Benchmarking

### 4.1 Side-by-side comparison

| Dimension | Kittle | The Group | C3 | Mullenberg | Ambassador | NoCo Home Team |
|---|---|---|---|---|---|---|
| Brokerage type | Independent team / EXIT-affiliated | Independent regional brokerage | Independent regional brokerage | eXp Realty team | Independent boutique + property mgmt | Brokerage team (eXp / Berkshire) |
| Office footprint | Fort Collins | 8+ offices, ~⅓ of NoCo MLS share | Multi-office NoCo + Denver metro | Single team, Fort Collins | Fort Collins (downtown) | Fort Collins |
| Sitemap URLs | 16,280 (96.8% IDX bloat) | (Cloudflare-blocked) | ~106,000 (mostly IDX listings) + 1,470 blog posts | ~155 (compact) | No public sitemap | ~1,520 (880 blog posts, 515 tag pages) |
| Specialty seller programs | Cash Offer, Guaranteed Sold, Designed-to-Sell, Kittle Selling System (4 named programs) — **but no landing pages** | Maximum Exposure, Seller Concession Reports — no instant-cash equivalent | None branded | **Maximum Net, Instant Cash Offer, Clean Up to Closing, Guaranteed Net, Mully Move-Up, Buyers-In-Waiting (6 named programs)** | None visible | Sell-It-Fast system, Buyers-In-Waiting equivalent |
| Schema markup | Organization + WebSite + SearchAction (Org name = empty) | **Full Yoast graph** (WebPage, WebSite, Org, BreadcrumbList) | **None on homepage** | Yoast graph (WebPage, BreadcrumbList, Org) | n/a (blocked) | RealEstateAgent + Org + Yoast — but RealEstateAgent address is empty |
| Title-tag style | **Keyword-stuffed mega-title (220 chars, 12+ keywords)** | Brand-led, ~75 chars | Brand + value prop, ~65 chars | Brand + location, ~55 chars | n/a | Brand + service + location, ~65 chars |
| Meta description on homepage | Long, keyword-stuffed (312 chars) | **Missing** | Generic tagline | Concise, value-prop | n/a | Tight, names agents |
| H1 hygiene on homepage | 1 clean H1 | 1 H1 | 1 long H1 with keywords | 2 H1s (mission section misuses H1) | n/a | **7 H1s (all-caps nav labels — major SEO problem)** |
| Visible specialties | Luxury, waterfront, horse, golf | New construction, commercial, market data, relocation | Communities (10+ pages), relocation, Spanish-speaking | Investing, communities (4), FAQs | Property management, residential | Community knowledge, "Best of FoCo" curated content |
| Blog cadence | Active 2026, no pillar-cluster structure | **Weekly, current 2026 ("NoCo Voice")** | Daily-ish but mostly auto-listings | Slowed since 2023 | None | Sporadic, much from 2010–2022 |
| Community pages | 7 named NoCo cities + Old Town | **14** | **11** | 4 | n/a | Hyperlocal neighborhood tag pages |
| In-house mortgage | No | **Yes** | No | No | No | No |
| Proprietary data product | No | **Yes** (Seller Concession Reports, Forecast, Quarterly Stats) | No | No | No | Stale market reports |

### 4.2 What competitors do better than Kittle (numbered)

1. **Mullenberg Team has a complete six-program seller suite** — Maximum Net, Instant Cash Offer, Clean Up to Closing, Guaranteed Net, **Mully Move-Up Method (buy-before-you-sell)**, **Buyers-In-Waiting (off-market)**. Each program has its own landing page with own URL — strong topical authority. **The Mully Move-Up and Buyers-In-Waiting are direct, named gaps in Kittle's lineup.** Kittle has BBYS as a service; Mullenberg has it as a productized landing page that ranks.
2. **The Group's blog ("NoCo Voice") publishes weekly with seasonally-timed content** — checklists, "what to do this weekend in NoCo" lifestyle posts, neighborhood guides. Captures hyperlocal long-tail (e.g., "Memorial Day weekend NoCo," "outdoor concerts NoCo 2026") that Kittle does not pursue.
3. **The Group's market-data products** — `/forecast/` (ranks #9 for "Fort Collins real estate market 2026"), Quarterly Statistics, Seller Concession Reports — proprietary data plays Kittle has no equivalent for.
4. **The Group has in-house mortgage**, expanding their `/loan-programs/` page authority (#6 for "first time home buyer Fort Collins").
5. **C3 has 11 community pages** (Fort Collins, Loveland, Windsor, Timnath, Greeley, Johnstown, Berthoud, Longmont, Wellington, Severance, Eaton). The Group has 14. Kittle has 7 + Old Town. Geo coverage gap.
6. **C3 has a Spanish-speaking-agents page and an Overseas-Property page** — niche audiences Kittle has not addressed. Greeley's large Hispanic population is the obvious play.
7. **NoCo Home Team has an 880-post blog archive going back over a decade** with hyperlocal neighborhood tag pages (Waterleaf, Wintergreen Village, Windsor Water Valley South, etc.). Risky strategy — but it captures neighborhood-level long-tail Kittle misses.
8. **NoCo Home Team has a "Connections Page" vendor directory** (home inspectors, movers, insurance, cleaning) that captures auxiliary keywords and creates outbound-link assets that earn inbound reciprocity.
9. **Mullenberg's "Here's Why NoCo" video series** — local-business spotlights (Bistro Nautile, Persimmon, etc.) earn reciprocal links and social shares Kittle is leaving on the table.
10. **The Group's full Yoast schema graph** (WebPage, WebSite, Organization, BreadcrumbList, ReadAction) is the cleanest implementation in the set; Kittle's `Organization.name` is empty.
11. **The Group, Mullenberg, NoCo Home Team all lead with brand in the title tag**; Kittle's homepage title leads with descriptive keywords, which dilutes brand-search CTR.
12. **Mullenberg uses concise, human-readable meta descriptions and tight ~55-char titles** — Kittle's homepage title is 220 chars and description 312 chars.

### 4.3 What Kittle does better (be fair)

- **Brand authority by a wide margin.** 5x WSJ / RealTrends #1 NoCo team, 400+ Google reviews, 7,500+ families served, BBB Torch, Best of FoCo Community Choice. None of the five competitors carry comparable third-party national press credibility.
- **Most modern conversion-program suite in the market** (when measured by what Kittle *offers*, not what it has landing pages for): Cash Offer with 59-day close + Guaranteed Sold + Remodel-on-our-Dime + Buy-Before-You-Sell + Sell-and-Stay. The Group competes on data/authority products, not transaction-friction programs. Once these are productized into landing pages, this is Kittle's moat.
- **Larger overall site** with luxury / waterfront / horse / golf vertical pages — Mullenberg has 4 community pages; Kittle has 7 + Old Town + 5 vertical hubs. The vertical hubs are *thin*, but the structure is in place.
- **Stronger 5-star review prominence on homepage.** The reviews page itself is 2,199 words and rich with social proof.
- **Heading hygiene better than NoCo Home Team** (Kittle has 1 clean homepage H1 vs. NoCo Home Team's 7 all-caps nav-label H1s).
- **Modern URL structure** (clean slugs); C3 still runs legacy `.php` URLs.
- **JSON-LD with SearchAction on homepage** — present, even if `Organization.name` is empty. Still ahead of C3 (no JSON-LD on homepage).

### 4.4 The Mullenberg gap — explicit call-out

Mullenberg matches or exceeds Kittle on every modern conversion program **and adds two Kittle does not have a public landing page for**:

- **Mully Move-Up Method** = Mullenberg's buy-before-you-sell program. Kittle offers BBYS; Mullenberg owns the URL.
- **Buyers-In-Waiting** = Mullenberg's off-market match program ("market value without being listed"). Kittle has the database — they do not have the page.

**Single highest-leverage competitive move for Kittle, by far:** ship `/buy-before-you-sell/` and `/off-market-listings/` (or `/buyers-in-waiting/`) within 60 days. This closes the most exposed gap versus the strongest direct competitor while preserving Kittle's existing advantages (luxury verticals, schema, 5-star review prominence).

---

## Section 5: Backlink & Link Profile Analysis

### 5.1 Client Backlink Profile

> **Methodology note:** the DataForSEO `client-backlinks.json` and per-competitor backlink files were not loaded at audit-data run time, so the audit-data.json `backlinks.qualitySummary` is all zeros and `backlinks.referringDomains` is unscored. The qualitative backlink picture below is from manual web research (`backlink-analysis.md`); raw DFS top-line: domainRating reported as 243 (data error — DR is 0–100), 425 referring domains, 1,366 total backlinks. Numbers below are qualitative ranking — re-score `backlink-opportunities.json` once DFS data lands.

**Ranking among the six sites researched (best link authority to worst):** The Group > C3 > **Kittle (3rd)** > Mullenberg > NoCo Home Team > Ambassador.

**Strengths:** every major review/portal aggregator is claimed (Zillow, Realtor.com, Homes.com, Trulia, Yelp, BBB, Facebook, LinkedIn, Instagram, YouTube, FastExpert, RateMyAgent, NiceJob, FCBR, LBAR, ColoProperty). National-press credibility (WSJ, RealTrends) for Top Team rankings. About.me profile, BBB A+ with 2022 Torch Award. BizWest 2022 "Notable Women in Residential Real Estate" feature.

**Weaknesses:**
- **No Fort Collins Chamber of Commerce membership** — The Group and C3 both have one
- No Downtown Fort Collins, VisitFtCollins, or Colorado.com directory listings — The Group has all three
- Single BizWest mention vs. multiple for The Group / C3
- No .gov or .edu links
- No LeadingRE / LuxuryPortfolio brokerage memberships (The Group has both)
- No regional chamber memberships (Loveland, Greeley, Windsor, Berthoud, Estes Park) — Kittle services all of those markets
- No Coloradoan editorial features (The Group has them)
- No Inman, Houzz, Crunchbase, ZoomInfo, LoopNet profiles

### 5.2 Competitor Backlink Comparison

| Property | Kittle | The Group | C3 | Mullenberg | Ambassador | NoCo Home Team |
|---|---|---|---|---|---|---|
| Zillow / Realtor / Homes / Trulia | Y | Y | Y | Y | Y | Y |
| Yelp | Y | Y | Y | partial | partial | partial |
| BBB | Y | Y | Y | — | — | — |
| Facebook / Instagram / LinkedIn | Y | Y | Y | Y | Y | Y |
| YouTube | Y | Y | Y | Y | — | — |
| FCBR (members.fcbr.org) | Y | Y | Y | Y | Y | Y |
| ColoProperty | Y | Y | Y | — | — | Y |
| **Fort Collins Chamber** | — | **Y** | **Y** | — | — | — |
| **Downtown Fort Collins** | — | **Y** | **Y** | — | — | — |
| **VisitFtCollins** | — | **Y** | — | — | — | — |
| **Loveland Chamber** | — | — | **Y** | — | — | — |
| **Colorado.com** | — | **Y** | — | — | — | — |
| **LeadingRE** | — | **Y** | — | — | — | — |
| **LuxuryPortfolio** | — | **Y** | — | — | — | — |
| **LoopNet** | — | **Y** | — | — | — | — |
| **ZoomInfo** | — | **Y** | **Y** | — | — | — |
| **Crunchbase** | — | — | **Y** | — | — | — |
| BizWest editorial | 1 | many | many | 1 | — | — |
| Coloradoan editorial | — | Y | partial | — | — | — |
| WSJ / RealTrends national | **Y** | Y | partial | — | — | — |

### 5.3 Citation Gap Analysis (Fort Collins / NoCo specifics)

Local citations Kittle is missing but where competitors hold ground (or which are easy free wins):

| # | Citation | Currently held by | Effort |
|---|---|---|---|
| 1 | fortcollinschamber.com (Fort Collins Area Chamber, 1,100+ businesses) | The Group, C3 | Easy (paid membership) |
| 2 | downtownfortcollins.com | The Group, C3 | Easy (DDA listing) |
| 3 | visitftcollins.com (local tourism) | The Group | Easy |
| 4 | colorado.com (state tourism / business directory) | The Group | Easy |
| 5 | loveland.org (Loveland Chamber) | C3 | Easy (paid) |
| 6 | business.greeleychamber.com (Greeley Chamber) | none of named comps | Easy (paid) |
| 7 | windsorchamber.net | none | Easy |
| 8 | berthoudchamber.com | none | Easy |
| 9 | estesparkchamber.com | none | Easy |
| 10 | nocochamber.com (Northern Colorado Hispanic Chamber) | none | Easy |
| 11 | colorealtor.org (Colorado Association of Realtors) | none | Easy |
| 12 | nar.realtor public find-a-realtor | none | Easy |
| 13 | crunchbase.com, zoominfo.com, loopnet.com | C3 (Crunchbase, ZoomInfo); The Group (LoopNet, ZoomInfo) | Easy (claim) |
| 14 | apple maps, bing places, foursquare, manta, yellowpages, mapquest | mixed | Easy (Big-7 citation set completion) |
| 15 | nextdoor.com (hyperlocal social), activerain.com (realtor blog network) | none | Easy |
| 16 | redfin.com partner-agent program | partial | Easy (apply) |
| 17 | inman.com contributor profile | none | Hard (apply) |
| 18 | leadingre.com / luxuryportfolio.com | The Group | Hard ($$ brokerage membership) |
| 19 | coloradoan.com editorial / housing-trends column | The Group, partial C3 | Medium (pitch) |

### 5.4 Link-Building Opportunity Roadmap

**Quick Wins (0–30 days, self-serve free or low-cost):** Fort Collins Area Chamber + directory listing, Downtown Fort Collins DDA, VisitFtCollins, Colorado.com, Loveland / Greeley / Windsor / Berthoud / Estes Park / Hispanic chambers, ColoradoREALTOR.org, NAR find-a-realtor, Alignable, Manta, YellowPages, Foursquare, MapQuest, Apple Maps, Bing Places, Nextdoor, ActiveRain, Crunchbase, ZoomInfo, LoopNet, Pinterest + TikTok business accounts. Round out the citation set.

**Medium-Term (30–90 days, outreach):** BizWest "Notable Leaders" pitch for Rob Kittle (already-featured agents Andrea Rusch + Lindsay Gagner — submit annually), Coloradoan housing-trends monthly column pitch, BizWest "Mover & Shakers" for new agent hires, North Forty News market commentary, NoCo Style / Style Media homes feature, Inman contributor application, RealTrends "The Thousand" annual submission, Side.com profile.

**Long-Term (90+ days, earned PR / community):** CSU Real Estate Capital Markets program guest lecture / scholarship / Foundation partnership (.edu link), City of Fort Collins (fcgov.com) homebuyer-education sponsorship (.gov link), larimer.gov / lovgov.org / windsorgov.com / greeleygov.com civic sponsorships, KUNC / Rocky Mountain PBS / 9News sponsorship + earned segments, annual "State of NoCo Housing" gated report (link-bait), Habitat for Humanity Loveland-Fort Collins / United Way of Larimer County / Realities for Children sponsorships (.org links), Colorado Eagles or CSU Athletics partnership, LeadingRE or LuxuryPortfolio brokerage-level membership.

---

## Section 6: Lead Capture & Conversion Analysis

### 6.1 Current Lead Capture Inventory by Page Type

| Page Type | Asset | Status | Note |
|---|---|---|---|
| Homepage | Hero CTAs ("What's My Home Worth?", "Cash Offer On My Home", "Find a Home") | Present | CTA copy is strong; destinations are weak (see §6.2) |
| Sitewide | Phone numbers (970-460-4444 main, 970-218-9200 buyer 24/7) | Present | OK |
| Sitewide | Calendly schedule-appointment widget | Present | But `/calendly-test/` test page is publicly indexable |
| `/contact/` | Contact form | Present | **17–21 inputs** — too long, conversion-rate killer |
| `/sellers/` | Contact form | Present | 21-input form, no specialty-program router |
| `/sellers/free-market-analysis/` | Free market analysis form | Present | 340 words; no instant valuation, no expected turnaround time |
| `/sellers/home-value/` | Home valuation tool / iframe | **Missing** | **4-word shell page on the primary seller conversion path** |
| `/buyers/personalized-home-search/` | My Home Tracker (saved-search email) | Present | OK |
| `/communities/` | "sign up for email alerts of new listings" | Present | Listing-alert only, not a true newsletter |
| Sitewide | Lead-magnet PDFs | **Missing** | No Buyer's Guide PDF, Seller's Guide PDF, or Relocation Packet |
| Sitewide | Live chat | Not visible in extracted HTML | Confirm |
| Specialty programs | Dedicated landing pages with own forms | **Missing** | **Single biggest lead-gen gap on the site** |
| `/reviews/` | Social proof on conversion pages | Partial | Reviews page is rich (2,199 words); conversion pages do not pull testimonials |
| Sitewide | Quiz / wizard ("Should I sell with cash offer or traditional?") | **Missing** | Major missed opportunity |
| Sitewide | Webinar / event registration | Hint | One blog post (`/blog/free-webinar-how-to-sell-your-home-faster.../`) — confirm if registration is wired |
| Sitewide | Cost-of-Waiting calculator | Article only | `/contact/cost-of-waiting/` is a 338-word article, not an interactive calc |
| Sitewide | Net Proceeds / Net Sheet calculator | **Missing** | Industry-standard widget |
| Sitewide | BBYS bridge-loan calculator | **Missing** | Differentiated — would own the niche |
| Sitewide | Mortgage calculator | Present | `/buyers/mortgage-calculator/` |

### 6.2 Missing Conversion Elements

- **The single most-visited seller conversion path is broken at the destination.** Homepage → `/sellers/home-value/` is a 4-word shell page with no H1 and a boilerplate IDX description.
- **Homepage "Cash Offer" CTA → ?** Currently appears to point at a generic seller URL or hifello.com landing page, not a dedicated `/cash-offer/` landing page tied to a CRM tag.
- **Community-page → conversion sequence is broken.** Community pages currently end with a "Larimer County Golf / Horse / Luxury / Waterfront" cross-sell block, not a targeted CTA. Should be: View homes → Get neighborhood-specific market report → Schedule a tour → Get your home valued (BBYS prep).
- **`/contact/` form is 17 inputs.** Conversion-rate research consistently shows >40% drop in submissions when going from 5 to 10+ fields. Reduce to 5 fields with a "What are you most interested in?" router (Sell / Cash Offer / BBYS / Buy / Other).
- **Funnel pages (`/buyers/`, `/sellers/`, `/financing-options/`, `/buyers/first-time-buyers/`) all use chrome-baseline NoCo references** — meaning the only mentions of Fort Collins / NoCo come from nav/footer, not the body. A user (or Google) reading the body wouldn't know the page targets Northern Colorado.

### 6.3 Recommendations — especially around specialty-program forms

Build the four specialty-program landing pages with the following standardized template (see §3.5.1 for URL list):

- **H1:** program name (e.g., "Cash Offer for Your Northern Colorado Home")
- **Above-the-fold answer:** 50–70 word answer to "what is this program and how does it work?" — citation-ready for AI Overviews
- **90-second video explainer** (Rob, founder voice)
- **"How it works" 3–5 step process** with timeline (Cash Offer = 59 days from accept-to-close)
- **Eligibility / qualifying criteria** (price band, geographic area, condition)
- **Recent case study** with $X net / X-day timeline / location / quote
- **FAQ block** (8–12 questions, FAQPage schema applied)
- **Dedicated 5-field form** (Name / Address / Phone / Email / Timeline) tied to a CRM tag for that program
- **Testimonials block** — pull 3 program-specific Google reviews
- **`Service` JSON-LD** with provider, areaServed, name, description, offers
- **Cross-sell block** — "Not the right fit? Compare your selling options" → other 3 programs
- **Trust strip** — WSJ / RealTrends / BBB / 400+ reviews

Add a "Choose Your Selling Path" three-card block to `/sellers/`, `/sellers/home-value/`, `/sellers/free-market-analysis/`, and all 7 community pages: Traditional Listing / Cash Offer / Remodel-on-our-Dime, with links to the new program pages. Add a "Buy-Before-You-Sell" call-out to `/buyers/`, `/buyers/relocation/`, `/buyers/first-time-buyers/`.

Build a "Sell with Confidence" wizard / quiz that routes leads to the right program based on 4–6 questions (timeline, condition, current home equity, BBYS interest, etc.). This is differentiated and converts visitors stuck in research mode.

---

## Section 7: Prioritized Action Plan (45 items)

Items are deduplicated across the union of all 5 research files + `audit-data.json → reportingIntelligence.actionPlan` + the analyzer's `topIssues`. Effort: S = ≤2h, M = half-day, L = 1+ day, XL = multi-week. Impact reflects traffic / ranking / lead-flow estimate.

### 7.1 Quick Wins (Week 1–2) — 10 items

| # | Action | Why | Effort | Impact |
|---|---|---|---|---|
| 1 | **Fix the sitewide `$COUNT$ Listing$S$">Search Listings` template bug.** Trace the single Sierra Interactive template file and populate the dynamic listings count server-side. Validate with `--wait 8000` Playwright pass. | Renders as raw H2 text on 29 of 57 sampled pages including `/agents/rob-kittle/` and 12 of 14 blog posts. Google indexes literal placeholder text in heading tree. | S | Critical |
| 2 | **Rewrite homepage `<title>` to ≤60 chars.** Drop "Colorado Springs" (out-of-market) and the typo "Fort Collin" (missing s). Suggested: `"Kittle Real Estate \| Fort Collins & Northern Colorado Realtors"` or `"Northern Colorado Real Estate \| Fort Collins Realtors \| Kittle"`. | Current 220-char keyword-stuffed title with typo and wrong market is the highest-equity title on the site. | S | High |
| 3 | **Rewrite homepage meta description to ≤155 chars.** Lead with "5x #1 Northern Colorado team in the Wall Street Journal / RealTrends" + soft CTA. | Current 312-char description runs into a sentence fragment ("Whether you"). Direct CTR lift in SERPs. | S | Medium |
| 4 | **Fix the empty-name `Organization` JSON-LD on the homepage.** Set `name: "Kittle Real Estate"` in Sierra Interactive Org-schema config. | Current JSON-LD has `name = ""` — Google's parser silently breaks. Schema validation pass. | S | Medium |
| 5 | **Add H1 tags to the 14 pages missing one.** Including `/about/`, `/agents/rob-kittle/`, `/luxury-homes/`, `/communities/move-to-fort-collins-co/`, `/communities/move-to-greeley-co/`, `/communities/move-to-windsor-co/`, all 5 Featured-Search hub pages. Templating-level fix. | Foundational on-page ranking signal missing on a high-value commercial page (`/luxury-homes/`) and the team-leader's bio. | M | High |
| 6 | **Reduce `/buyers/relocation/` from 5 H1 tags to 1.** Demote "FORT COLLINS / LOVELAND / GREELEY / WINDSOR" to H2. Rewrite the 10-char "Relocation" title → `"Relocate to Northern Colorado \| Fort Collins, Loveland, Greeley & Windsor Guide"`. | Page ranks #5 for "relocation real estate Fort Collins" with 5 H1s. Cleaning the structure unlocks more. | S | Medium |
| 7 | **Rewrite the 5 duplicate Featured-Search meta descriptions.** Fix the "professionalsthat" typo. Add unique 150-char description per page. | Identical 224-char description on `/luxury-homes/`, `/horse-properties/`, `/new-construction/`, `/golf-course-homes/`, `/condominiums-townhomes/` — Google de-indexes / consolidates duplicate-meta pages. | S | Medium |
| 8 | **Rewrite the 13 boilerplate "Search homes for sale in Northern Colorado…" descriptions.** Includes `/sellers/home-value/`, `/sellers/decide-to-sell/`, `/buyers/relocation/`, `/buyers/foreclosures/`, `/financing-options/`, `/seller-tips/fort-collins-co/`. | Boilerplate description on the seller's primary lead-capture page is wasted SERP real estate. | S | Medium |
| 9 | **Remove `/test/`, `/test1/`, `/calendly-test/` from sitemap; noindex.** | Public, indexable test pages — embarrassing public surface area. | S | Low |
| 10 | **Fix the typo URL `/buyers/neigborhood-report/`.** 301 to `/buyers/neighborhood-report/`; update internal links and homepage body copy. | Permanent typo in a navigation target hurts trust + breaks shareability. | S | Low |

### 7.2 Short-Term (Month 1–2) — 10 items

| # | Action | Why | Effort | Impact |
|---|---|---|---|---|
| 11 | **Build the four specialty-program landing pages.** `/cash-offer/`, `/buy-before-you-sell/`, `/remodel-on-our-dime/`, `/sell-and-stay/`. Each: 1,000+ words, 90s video, 3-step process, eligibility, case study, FAQ schema, dedicated 5-field form, `Service` JSON-LD. | The single biggest content gap on the site. Mullenberg owns "sell my house Fort Collins" (#1) with this approach; Kenna owns "buy before you sell program Colorado" (#1). Sell-and-Stay SERP is wide open. | XL | Critical |
| 12 | **Rebuild `/sellers/home-value/`.** Replace the 4-word shell with H1 ("What's My Home Worth?"), 200-word intro, instant-valuation widget (RealScout / Cloud CMA / HouseValues), "Choose Your Path" three-card block (Cash Offer / Traditional / Remodel), 5-field form. | Single most important seller lead-capture URL. Currently 4 words, no H1, boilerplate description. | L | Critical |
| 13 | **Rewrite Rob Kittle's bio at `/agents/rob-kittle/` from 136 words to 800–1,000 words.** Full origin story (since 1999), founding of the four programs, awards, WSJ #1 ranking citation, podcast/video embed, headshot, community work. Add H1. | Team leader's bio is the second-thinnest page on the site. Currently #6 for "Rob Kittle realtor" — should be #1 with this rebuild. | L | High |
| 14 | **Resolve IDX index bloat.** Sierra-template-level canonical from the 15,664 `/<city>-homes-for-sale/<filter>/` filter pages to their parent city hub (recommended), or `<meta name="robots" content="noindex, follow">` on the filter template. | 96.8% of indexed URLs are auto-generated near-duplicates — Panda-style sitewide quality demotion risk. | L | Critical |
| 15 | **Add `RealEstateAgent` + `LocalBusiness` JSON-LD to the homepage and `/contact/`.** Include populated NAP (300 S Howes St, Fort Collins, CO 80521 / 970-460-4444), geo, openingHours, sameAs (social profiles), aggregateRating sourced from Google reviews, areaServed, makesOffer for the four programs. | Eligibility for rich results; correctness fix (current Org schema has empty `name`). 9 of 60 pages have any schema; only `Event` schema type is found. | M | High |
| 16 | **Add og:title, og:description, og:type, og:url, og:site_name, twitter:card sitewide.** | 11 of 13 sampled pages have no Open Graph; Twitter Card meta absent everywhere. All shares render with the same generic hero, no headline. | M | Medium |
| 17 | **Strip trailing newlines from `/luxury-homes/` og:title and og:description.** | Sierra Interactive content-entry artifact breaks display in some social previews. | S | Low |
| 18 | **Trim the contact form from 17–21 inputs to 5 fields.** Add a "What are you most interested in?" router dropdown that routes Sell / Cash Offer / BBYS / Buy / Other to the right CRM tag. | Conversion-rate research: >40% drop in submissions when going from 5 to 10+ fields. | M | High |
| 19 | **Join Fort Collins Area Chamber + claim member-directory listing.** Then add Loveland Chamber, Greeley Chamber. | The Group and C3 both have FC Chamber. Headline missing local citation. | S | Medium |
| 20 | **Claim the missing free citation set:** Crunchbase, ZoomInfo, LoopNet, Apple Maps, Bing Places, Foursquare, Manta, YellowPages, MapQuest, Nextdoor business, ActiveRain author, ColoradoREALTOR.org, NAR find-a-realtor, Alignable, Houzz pro. | Each is a 10-minute claim; collectively closes the local-citation gap vs. The Group / C3. | S | Medium |

### 7.3 Medium-Term (Month 2–4) — 13 items

| # | Action | Why | Effort | Impact |
|---|---|---|---|---|
| 21 | **Build a quarterly Market Report system.** `/market-report/fort-collins/`, `/loveland/`, `/greeley/`, `/windsor/`, `/wellington/`, `/timnath/`. Each with median price, DOM, list-to-sale ratio, inventory, refreshed quarterly. Embed on the matching community page. | thegroupinc.com `/forecast/` ranks #9 for "Fort Collins real estate market 2026"; Kittle has nothing. AI Overviews-citable original data. | XL | High |
| 22 | **Add H1 + 2026 market data + specialty-program CTA cards to the 7 community pages.** Each ends with "Choose Your Selling Path" cards. `/communities/move-to-fort-collins-co/` (4,392 words, 0 H1) is the highest-leverage. | Strongest content asset on the site is missing the lead funnel. Highest-traffic geo pages currently end with cross-sell to other vertical hubs, not conversion. | L | High |
| 23 | **Build per-city seller-tips pages for Loveland, Windsor, Wellington, Timnath, Old Town, Berthoud.** ~1,200 words each. Currently only Fort Collins and Greeley exist. | None of the named competitors have a full set; opportunity to own this space. | XL | Medium |
| 24 | **Build a "Northern Colorado First-Time Buyer Guide" at `/financing-options/loan-programs-northern-colorado/`.** CHFA, FHA, VA (Cheyenne / FE Warren proximity), USDA Rural (Wellington / Ault / Carr), CSU faculty, Larimer County DPA, City of Fort Collins HBA, Impact Development Fund. | thegroupinc.com `/loan-programs/` ranks #6 for "first time home buyer Fort Collins"; Kittle has no equivalent. | L | High |
| 25 | **Build neighborhood-level pages under Fort Collins.** Old Town (expand 843 → 2,000+), plus 8 new: Harmony, Horsetooth, Foothills, Campus West, Mountain Range Shadows, Rigden Farm, Centerre, Fossil Creek. 800–1,500 words each. | fortcollinsrealestatebyjoyce.com leads this format and is the dominant competitor for Old Town queries. | XL | Medium |
| 26 | **Build downloadable lead magnets** (gated PDFs): Buyer's Guide, Seller's Guide, Relocation Packet (per city). Each gated by a 5-field form. | None visible on the site; industry standard. C3 already publishes a Buyer's Guide on Issuu. | L | High |
| 27 | **Build interactive calculators.** Cost of Waiting (currently a 338-word article — make interactive), BBYS Bridge-Loan calculator (differentiated), Net Proceeds / Net Sheet calculator. | Industry-standard widgets; BBYS calculator would own the niche. | L | Medium |
| 28 | **Build a "Sell with Confidence" wizard / quiz** that routes visitors to BBYS / Cash Offer / Remodel-on-our-Dime / Traditional via 4–6 questions. | Differentiated conversion tool; routes ambiguous leads. | L | Medium |
| 29 | **Pillar-cluster the blog.** Pick 5 pillars (BBYS, Cash Offer, NoCo Market, First-Time Buyer, Luxury). Re-link the 88 existing posts as clusters. Build `/blog/category/` taxonomy URLs. | 88 posts with no pillar→cluster structure or taxonomy URLs in sitemap. | M | Medium |
| 30 | **Promote `/blog/moving-to-and-living-in-estes-park-co-2026-edition/` and `/blog/moving-to-and-living-in-longmont-co-2026-edition/`** to `/communities/move-to-estes-park-co/` and `/communities/move-to-longmont-co/`. | 1,000+ word community guides misfiled in `/blog/`. | M | Medium |
| 31 | **Rewrite all 12 "Top Realtor in {city}" titles and descriptions to ≤60 / ≤155 chars** and standardize URL slugs (`top-realtors-` plural). Add a "What Sets Kittle Apart in {City}" section featuring the 4 programs. Bring all 12 pages to ≥1,000 words. | Currently 96–98 char titles with "Realtors Near You — Realtor {City}" filler; 369–371 char descriptions; URL inconsistency (singular vs plural). | L | Medium |
| 32 | **Add Review / AggregateRating + FAQ + BreadcrumbList JSON-LD** site-wide (homepage, agent pages, blog Q&A posts, community pages). Add visible breadcrumbs. | Currently no Review / AggregateRating despite 400+ reviews; no BreadcrumbList; no FAQPage. Rich-result eligibility on "Fort Collins real estate agent reviews." | M | Medium |
| 33 | **Improve image alt coverage from 62% → 90%+ site-wide.** Replace the repeating tick-icon image (loaded 8+ times per homepage) with a CSS `::before`. Establish "hero & decorative = `alt=""`; logo / award / photo = descriptive alt." | 1,162 images / 441 missing alt; homepage 84% missing. Accessibility + image-search visibility. | L | Medium |

### 7.4 Long-Term (Month 4+) — 12 items

| # | Action | Why | Effort | Impact |
|---|---|---|---|---|
| 34 | **Launch a NoCo Voice-style weekly editorial blog hub** — 4–8 posts/month covering market data, neighborhood spotlights, programs, process explainers, "what to do this weekend in NoCo" lifestyle. | thegroupinc.com captures hyperlocal long-tail with this exact pattern; Kittle's blog is active in 2026 but lacks cadence and lifestyle coverage. | XL | High |
| 35 | **Expand the relocation hub into a multi-page system.** "Relocating from California / Texas / Denver / Out-of-State" + neighborhood-matching tool. Rewrite the 5-H1 problem first (item #6 above). | kennarealestate.com #1, thegroupinc.com #3 for "relocation real estate Fort Collins"; Kittle is #5. | XL | Medium |
| 36 | **Build an `/awards/` page** with WSJ #1 (5x), RealTrends, BBB Torch 2022, Best of Fort Collins 2024. Build an `/in-the-press/` page with Rob's media appearances. | Trust / E-E-A-T signal; provides citation targets for AI Overviews. Currently the "many top awards" claim on the homepage has no detail anywhere. | M | Medium |
| 37 | **Build `/case-studies/` or `/sold/`.** 6–12 narrative case studies showing each program in action ($X over asking, X-day close, BBYS success, Remodel ROI). | Several competitors run social-proof case studies; powerful conversion content. | L | Medium |
| 38 | **Pitch BizWest "Notable Leaders" + Coloradoan housing-trends column + RealTrends Thousand annual + Inman contributor profile.** Set a quarterly editorial submission cadence. | Earned-link sources of choice for The Group / C3; Kittle has 1 BizWest mention to The Group's many. | XL | Medium |
| 39 | **Sponsor or partner with civic organizations for .gov / .org links.** City of Fort Collins (fcgov.com) homebuyer-education program, larimer.gov, Habitat for Humanity Loveland-Fort Collins, Realities for Children, United Way of Larimer County, Colorado Eagles or CSU Athletics co-branded community pages. | No .gov or .edu links currently; defensible link sources earned over 12+ months. | XL | Medium |
| 40 | **CSU Real Estate Capital Markets program partnership** — guest lecture + scholarship sponsorship + Foundation partnership for a .edu link. | Highest-DA defensible link in the market; nobody in the comp set has a CSU partnership beyond standard recruiting. | XL | Medium |
| 41 | **Apply for LeadingRE or LuxuryPortfolio brokerage-level membership.** | The Group has both; high-DR industry links. Significant cost — discuss strategic value with Rob. | XL | Medium |
| 42 | **Add HSTS + Content-Security-Policy + X-Content-Type-Options + X-Frame-Options + Referrer-Policy + Permissions-Policy security headers** at Cloudflare. | All 6 security headers missing; modest ranking + Lighthouse Best Practices win. | S | Low |
| 43 | **Build a Spanish-language landing page targeted at Greeley.** | c3realestatesolutions.com holds this term largely uncontested in NoCo; Greeley has a large Hispanic population. | L | Medium |
| 44 | **Consolidate Sierra Interactive scripts / stylesheets** — defer 3rd-party (Calendly, hifello.com, YouTube), bundle. Currently homepage loads 85 scripts and 16 stylesheets. | LCP / TBT improvement; CWV ranks. | XL | Medium |
| 45 | **Migrate the orphan `/<city>-co-listings/` URL system into `/communities/move-to-<city>-co/`** with 301s. Move top-level `/selling-your-home-*` pages under `/sellers/`. Strengthen internal linking density (avg 1.3 inbound → ≥ 2.0). | Two parallel URL systems represent the same intent (12 vs 77 cities); content cannibalization. Reachability: 2,539 pages currently unreachable from homepage via contextual links. | XL | Medium |

---

## Appendix A — Source files cross-referenced

- `seo/research/keyword-research.md` (25 keywords; rankings; long-tail clusters; tier-1/2/3 competitor frequency analysis)
- `seo/research/client-site-structure.md` (sitemap; meta-tag audit on 13 pages; H1 audit; image alt; schema; canonical; robots.txt; 20 prioritized technical recs)
- `seo/research/content-audit.md` (57 pages extracted; the `$COUNT$` template-bug headline finding; specialty-program coverage matrix; per-page issue tables; competitive content gaps)
- `seo/research/competitor-analysis.md` (5-competitor deep dives; specialty-program comparison matrix; community-page coverage; conversion-program gap analysis)
- `seo/research/backlink-analysis.md` (qualitative link-authority ranking; citation gap; 30 link-building actions; methodology note that DataForSEO files were unavailable at run time)
- `seo/audit-data.json` (`reportingIntelligence.siteHealthGrade.letterGrade = "F"`, `compositeScore = 37`; `categoryScores`: technical 0, content 13.4, indexability 82; `eeatSignals.summary.eeatScore = 18`; `internalLinking`: 42 orphans / 2,539 unreachable / avg inbound 1.3; `imageAudit`: 1,162 images / 441 missing alt; `schemaSummary`: 9 of 60 pages have schema, only `Event` type; 38 soft-404s flagged near-empty)
- `docs/seo-best-practices-2026.md` (E-E-A-T, AI Overviews / SGE, schema, content quality, local SEO, CWV, link building, mobile-first, real-estate-specific 2026 trends)

---

*End of audit report.*
