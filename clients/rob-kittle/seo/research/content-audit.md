# Content Audit — Kittle Real Estate (kittlerealestate.com)

**Client:** Rob Kittle / Kittle Real Estate
**Site:** https://www.kittlerealestate.com
**Market:** Fort Collins / Northern Colorado (Larimer + Weld counties, plus Boulder/Adams/Jefferson)
**Specialty Programs (per client brief):** "Buy Before You Sell," Cash Offer (close in 59 days), Remodel-on-our-Dime, Sell-and-Stay
**Goal:** Lead generation
**Audit Date:** May 2026
**Methodology:** Sitemap.xml extraction (16,280 URLs total — 88 blog posts + ~150 unique editorial pages, the rest are MLS / IDX filter pages); HTML capture and parse of 57 representative pages including all top-level navigation pages, the 7 major Northern Colorado community pages, the buyers/sellers funnels, the contact funnel, the 5 "Featured Search" pages (luxury, horse, new-construction, golf-course, condos), 4 "Top Realtor in {city}" pages, the reviews page, the financing-options funnel, Rob Kittle's bio page, and 14 representative blog posts (longest-first sample of 88 total).

---

## 1. Executive Summary

### Overall Content Grade: **D+**

Kittle has a strong brand voice on the **homepage**, **reviews page**, and a handful of **2026-vintage blog posts** authored by Rob — that material is sharp, locally specific, and converts. The rest of the site is a 2010-era IDX-template skeleton with **template variables literally rendering as text on the page**, **near-empty conversion pages**, **duplicate boilerplate meta descriptions**, and **zero dedicated landing pages for the four specialty programs** (Buy-Before-You-Sell, Cash Offer / 59-day close, Remodel-on-our-Dime, Sell-and-Stay) — the very offers that should be Kittle's primary lead magnets.

### Top 10 findings (impact-ranked)

| # | Finding | Impact |
|---|---|---|
| 1 | **Unrendered template variable** `$COUNT$ Listing$S$">Search Listings` appears as literal text in the **server-rendered HTML** (and as an H2 in the heading tree) on **29 of 57 sampled pages**, including `/buyers/`, `/sellers/`, `/contact/`, `/communities/`, `/sellers/free-market-analysis/`, `/agents/rob-kittle/`, and most blog posts. This is exactly what Google's crawler sees; user-visibility depends on whether a JS widget rewrites the node post-load (likely visible on slow connections or pre-hydration). Hard SEO bug regardless. | CRITICAL |
| 2 | **No dedicated landing page exists** for "Buy Before You Sell," "Cash Offer (59 days)," "Remodel-on-our-Dime," or "Sell-and-Stay." These programs are the homepage's lead headlines but have no `/buy-before-you-sell/`, `/cash-offer/`, `/remodel/`, `/sell-and-stay/` (or equivalent) URLs in the sitemap. Of 57 pages audited, **only the homepage and 4 blog posts** mention any specialty program at all. | CRITICAL |
| 3 | **Homepage `<title>` is 220 characters** (Google truncates at ~60), keyword-stuffed, includes "Real Estate Agents Fort Collin" (typo, missing "s"), and ends with "Best Real Estate Agents in Colorado Springs" — Kittle does not serve Colorado Springs. | CRITICAL |
| 4 | **Primary seller lead-capture page `/sellers/home-value/` has 4 words of unique content.** Same name as Zillow's #1 conversion product. Wasted real estate. | CRITICAL |
| 5 | **`/sellers/the-40-ds-of-moving/` (38 words), `/condominiums-townhomes/` (29 words), `/agents/rob-kittle/` (Rob's own bio: 136 words)** — shell pages on the team leader's own bio page and primary featured-search hub. | HIGH |
| 6 | **14 pages have 0 H1 tags**, including the entire `/about/` page (1,330 words) and 4 of 7 community geo-pages (Fort Collins, Greeley, Windsor, Old Town Fort Collins). Missing H1 = missing primary on-page ranking signal. | HIGH |
| 7 | **`/buyers/relocation/` has 5 H1 tags** ("RELOCATION", "FORT COLLINS", "LOVELAND", "GREELEY", "WINDSOR"). Multiple H1s cannibalize the on-page topic signal. | HIGH |
| 8 | **5 "Featured Search" pages share an identical 224-character meta description** ("Kittle Real Estate is a high-performing, top-ranking team of real estate professionals…") with a missing space ("professionalsthat"). Pages: `/luxury-homes/`, `/horse-properties/`, `/new-construction/`, `/golf-course-homes/`, `/condominiums-townhomes/`. Identical meta on five different intent pages = SEO penalty. | HIGH |
| 9 | **13 pages share the boilerplate description** "Search homes for sale in Northern Colorado. Listings include large photos, school info, detailed maps, and more." — including `/sellers/home-value/`, `/sellers/decide-to-sell/`, `/buyers/relocation/`, `/buyers/foreclosures/`, `/financing-options/`, `/seller-tips/fort-collins-co/`. | HIGH |
| 10 | **The 7 community geo-pages are the strongest content asset** (Fort Collins 4,392 words; Loveland 2,664; Wellington 2,406; Timnath 1,853 — all locally relevant) but **none of them mention the specialty programs** and several have no H1. Adding program CTAs and fixing structure here is the highest-ROI fix on the site. | HIGH |

### Strategic content posture

- **Brand strength** outpaces **content depth**. Every keyword study points to the same gap (see `keyword-research.md` §1) — Kittle ranks #1–#3 for branded queries and a handful of generic "best realtor" / "Northern Colorado real estate" terms, but is **invisible on every transactional and informational long-tail keyword** (homes for sale by city, sell my house Fort Collins, cash offer for home, BBYS, first-time-buyer, market 2026).
- **The Group, Inc.** (the primary local competitor) wins on `/forecast/`, `/loan-programs/`, NoCo Voice blog, and relocation hub content. **Kennarealestate.com** (a Denver-metro brokerage) out-ranks Kittle on Fort Collins long-tail because they actually have BBYS + first-time-buyer + new construction + lots/acreage *guide* pages.
- **Mullenberg Team** owns #1 for "sell my house Fort Collins" — Kittle has no competing landing page.
- The opening: program-specific landing pages, 2026-vintage market reports per city, and re-templating the existing community pages to lead with conversion not chrome.

---

## 2. Sitewide Content Issues

### 2.1 The unrendered template variable (sitewide bug)

**Status: critical. Present in the server-rendered HTML of roughly half the sampled pages.**

`$COUNT$ Listing$S$">Search Listings` appears as raw text in the SSR HTML of **29 of 57 sampled pages**. This is what Google's crawler indexes. A client-side JS widget may rewrite the node after page load — confirm with a `--wait 8000` Playwright pass on `/sellers/` before user-impact estimates — but the SEO impact (Google indexing literal `$COUNT$` text inside H2 tags) is unconditional. It is meant to be a dynamic listing count ("154 Listings — Search Listings") but the placeholder isn't being substituted. Confirmed pages include:

- `/buyers/`, `/sellers/`, `/contact/`, `/communities/`
- `/sellers/free-market-analysis/`, `/sellers/marketing-your-home/`, `/sellers/select-an-agent-and-price/`, `/sellers/pricing-your-home/`
- `/buyers/first-time-buyers/`, `/buyers/personalized-home-search/`, `/buyers/mortgage-pre-approval/`
- `/contact/cost-of-waiting/`, `/contact/are-you-ready-to-buy-or-sell-a-home/`
- `/financing-options/`
- `/agents/rob-kittle/`
- Most of the blog posts sampled (12 of 14)

This is a sitewide IDX-theme template bug, almost certainly a single template file. **Fix priority: immediate.** It is on Rob Kittle's own bio page.

Additionally, an orphaned related-post block titled **"Who Can Help Sell My Home in Windsor, CO?"** appears as an H3 on most non-blog pages (it's a related-blog-post widget that isn't being context-aware), reducing topical clarity on completely unrelated pages like `/buyers/`, `/sellers/`, `/contact/`, `/communities/`.

### 2.2 Meta data quality

**Title issues:**
- **Homepage:** 220-character keyword stuffed title with typo ("Real Estate Agents Fort Collin") and out-of-market reference ("Colorado Springs"). Google truncates at ~60 chars, so the visible SERP title is "Northern Colorado Real Estate Agents - Fort Collins Realtors® - Top Re…". Drop everything after the first dash.
- **15 pages have titles > 70 characters** (several over 100). The 5 "Top Realtor in {city}" pages all run 96–98 chars with the redundant "Realtors Near You - Realtor {City}" filler.
- **8 pages have titles < 30 chars** including `/buyers/foreclosures/` ("FORECLOSURES"), `/buyers/relocation/` ("Relocation"), `/sellers/home-value/` ("Home Value"), `/contact/` ("Contact Kittle Real Estate"). All are missing the geo modifier ("Fort Collins / Northern Colorado") — wasted ranking opportunity.

**Description issues:**
- **Homepage description: 312 characters** (Google truncates at ~155), runs on into a sentence fragment ("Whether you").
- **5 pages share an identical 224-char description** with a typo ("professionalsthat" — missing space): luxury-homes, horse-properties, new-construction, golf-course-homes, condominiums-townhomes.
- **13 pages share** the IDX boilerplate description (`Search homes for sale in Northern Colorado…`) — including `/sellers/home-value/` (the lead-capture page) and `/buyers/relocation/`.
- **7 pages have descriptions > 200 chars** (the three "Top Realtor" pages run 369–371 chars, Timnath 358).

### 2.3 Heading structure

- **14 pages have zero H1 tags.** Most consequential: `/about/` (1,330 words), `/agents/rob-kittle/` (Rob's bio), `/communities/move-to-fort-collins-co/` (4,392-word community guide), `/communities/move-to-greeley-co/` (2,788), `/communities/move-to-windsor-co/` (2,092), all 5 featured-search pages.
- **`/buyers/relocation/` has 5 H1 tags** — "RELOCATION", "FORT COLLINS", "LOVELAND", "GREELEY", "WINDSOR" — should be one H1 with H2 sub-sections.
- **`/blog/may-2026-cant-miss-events-in-northern-colorado/` has 2 H1s.**
- **Community pages mix H2 and unstyled `<strong>` text** as section dividers; the "Why You Need a Top Realtor in {City}, CO" sub-block is sometimes H2, sometimes inline.

### 2.4 Content depth

| Word-count tier | Page count (in sample) | Examples |
|---|---|---|
| < 100 main words | 6 | `/sellers/home-value/`, `/condominiums-townhomes/`, `/sellers/the-40-ds-of-moving/`, `/agents/rob-kittle/` |
| 100–300 main words | 8 | `/buyers/`, `/contact/`, `/communities/`, `/financing-options/`, `/sellers/free-market-analysis/`, `/sellers/marketing-your-home/` |
| 300–600 main words | 13 | `/sellers/`, `/about/the-kittle-team/`, `/buyers/first-time-buyers/`, `/sellers/pricing-your-home/`, `/luxury-homes/`, `/new-construction/`, `/horse-properties/` |
| 600–1,000 main words | 14 | `/about/`, `/golf-course-homes/`, `/about/kittle-cares/`, `/buyers/buyers-guide/`, `/buyers/relocation/`, several blog posts |
| 1,000–2,000 main words | 8 | Homepage, 7 of 14 sampled blog posts, `/seller-tips/fort-collins-co/`, `/realtors/top-realtors-in-greeley-co/` |
| 2,000+ main words | 6 | `/communities/move-to-fort-collins-co/` (4,392), Greeley (2,788), Loveland (2,664), Wellington (2,406), `/reviews/` (2,199), Windsor (2,092) |

Median across non-blog non-community pages ≈ 480 words. The mid-funnel pages a buyer or seller actually clicks through to (`/sellers/home-value/`, `/contact/`, `/financing-options/`, `/buyers/first-time-buyers/`) are all under 600 words and most under 400.

### 2.5 Local & industry relevance

- The **community pages** are well localized — Fort Collins page mentions "Fort Collins" 98 times, Wellington page mentions "Wellington" 116 times, Timnath 105, Loveland 85, Windsor 96, Greeley 92, Old Town Fort Collins 40. Solid foundation.
- **Most other pages cluster at the chrome baseline** (Fort Collins ≈ 4, Loveland ≈ 3, Greeley ≈ 3, Windsor ≈ 4, Wellington ≈ 1, Timnath ≈ 1) — meaning the only mentions of those cities come from the navigation menu / footer, not the page body. This is true even on pages where you'd expect heavy local mention — `/buyers/`, `/sellers/`, `/contact/`, `/buyers/first-time-buyers/`, `/financing-options/`, `/sellers/pricing-your-home/`.

### 2.6 Specialty-program coverage

Of 57 pages sampled, only **5 pages** mention any of the four specialty programs:

| Page | BBYS | Cash Offer | 59 days | Remodel-on-our-Dime | Sell-and-Stay |
|---|---|---|---|---|---|
| Homepage | yes | yes | yes | mentioned ("Remodel your home on our dime") | no |
| `/blog/how-can-i-buy-a-home-before-selling-my-current-one/` | yes | no | no | no | no |
| `/blog/who-can-help-sell-my-home-fast-in-fort-collins-co/` | yes | yes | no | no | no |
| `/blog/who-can-help-sell-my-home-in-windsor-co/` | yes | yes | no | no | no |
| `/blog/who-can-help-sell-my-home-in-loveland-co/` | yes | yes | no | no | no |
| **Every other page (52)** | no | no | no | no | no |

**No page mentions Sell-and-Stay** anywhere on the site. **No dedicated landing page exists** for any program — they are mentioned on the homepage and a few blogs, but the homepage CTA buttons "Cash Offer On My Home", "Sell Your Home", "Get a Cash Offer" all point at off-site or generic seller URLs, not a dedicated converting landing page.

This is the single biggest content gap. Kittle's competitive moat is these programs; the site doesn't sell them.

---

## 3. Page-by-Page Analysis

> **Page-by-page format:** issue table for each page. Pages with the same template defects are grouped (e.g., the 5 Featured-Search shells share one section). Issues use **C / H / M / L** for Critical / High / Medium / Low.

### 3.1 Homepage — `/`

- **Title:** 220 chars, keyword stuffed. *"Northern Colorado Real Estate Agents - Fort Collins Realtors® - Top Realtors in Colorado - Houses for Sale Fort Collins - Real Estate Agents Fort Collin - Real Estate Near Me - Best Real Estate Agents in Colorado Springs"* (typo "Fort Collin", out-of-market "Colorado Springs").
- **Description:** 312 chars, runs on ("…Whether you").
- **H1:** "The Best of Northern Colorado Real Estate" — fine.
- **H2/H3:** mix of valuable ("We Specialize, You Benefit", "GUARANTEED SOLD", "Get a Cash Offer", "Designed to Sell", "Your Dream Address Without the Stress") and noise ("$277K", H2 with `&nbsp;` separators).
- **Content (1,525 main words):** strongest single piece of content on the site. Real coverage of GUARANTEED SOLD (cash offer, 59-day close), Designed to Sell (remodel-on-our-dime), Your Dream Address Without the Stress (BBYS / sell-and-stay variants). Reviews, awards, past sales summary, Zillow Showcase explainer.
- **CTAs:** "What's My Home Worth?" / "Cash Offer On My Home" / "Find a Home" — visible. "Schedule an Appointment" widget.
- **Programs:** **all four signaled** (only page on site).
- **Phone:** present.

| Severity | Issue | Fix |
|---|---|---|
| C | Title 220 chars w/ typo "Fort Collin" + out-of-market "Colorado Springs" | Rewrite to ~60 chars: e.g. "Kittle Real Estate \| Top Realtors in Fort Collins & Northern Colorado" |
| C | Meta description 312 chars, runs on | Rewrite to 150–155 chars, lead with BBYS / cash offer / 59 days |
| H | "Cash Offer On My Home" CTA points to a generic page, not a dedicated cash-offer landing | Build `/cash-offer/` with form |
| H | "What's My Home Worth?" CTA → `/sellers/home-value/` which is a 4-word shell page | Build out home-value page with iframe valuation tool + form |
| M | "$277K" as an H3 (a stat block masquerading as a heading) | Change to `<div class="stat">` |
| M | H2 has `&nbsp;` separators, hurts readability | Clean markup |

### 3.2 About — `/about/`

- **Title:** 87 chars (long, but readable): *"BEST Real Estate Agency in Northern Colorado | 400+ Reviews on Google | The Kittle Team"*.
- **Description:** 125 chars. Fine length but plain.
- **H1:** **none** on a 1,330-word about page.
- **Content:** decent narrative on team, "unified team approach," "20+ years," "1,000s of homes." Mentions "Northern Colorado" 17 times. Decent.
- **CTAs:** "Schedule an Appointment", "Find Out For Free", form (11 inputs).
- **Programs:** none mentioned.
- **Phone:** present.

| Severity | Issue | Fix |
|---|---|---|
| H | 0 H1 — entire 1,330-word about page lacks an H1 tag | Add `<h1>About The Kittle Team</h1>` or `<h1>Northern Colorado's #1 Real Estate Team</h1>` |
| H | No mention of specialty programs on About page | Add a "What We're Known For" H2 covering BBYS / Cash Offer / Remodel-on-our-Dime / Sell-and-Stay with links to (to-be-built) program pages |
| M | Generic title; no specialty-program differentiator | Title: "About Kittle Real Estate \| Fort Collins Top Team \| Buy-Before-You-Sell, Cash Offer, Sell-and-Stay" |
| M | Description doesn't mention awards, programs, or the team count | Rewrite to mention "20+ years", "7,500+ families served", award-winning, programs |
| L | Generic CTA copy "Find Out For Free" | Make program-specific |

### 3.3 The Kittle Team — `/about/the-kittle-team/`

- **Title:** 84 chars, fine.
- **Description:** 100 chars, generic.
- **H1:** "The Kittle Team" — fine.
- **Content (430 main words):** essentially a roster listing with phone numbers. No team history, no philosophy, no team-level stats.
- **Programs:** none.

| Severity | Issue | Fix |
|---|---|---|
| H | Almost no narrative content — just a roster | Add 200–400 words of team philosophy + stat block (years in business, families served, awards, average sale price, etc.) |
| M | Description is filler | Rewrite mentioning team count + years served |
| M | No CTA other than agent profiles | Add "Work with The Kittle Team" CTA → contact form |

### 3.4 Buyers Hub — `/buyers/`

- **Title:** 63 chars, OK.
- **Description:** 144 chars, OK.
- **H1:** "Buy a Home in Northern Colorado" — fine.
- **Content (355 main words):** thin. Standard "we help you find a home" copy with a "My Home Tracker" sign-up.
- **CTAs:** form, "Schedule an Appointment", "Search All Properties".
- **Programs:** none mentioned despite this being the buyer hub.

| Severity | Issue | Fix |
|---|---|---|
| C | **`$COUNT$ Listing$S$">Search Listings` H2** rendered as literal text | Fix template |
| C | **Buyers hub doesn't mention BBYS or Sell-and-Stay** even though they're buyer-side programs | Add prominent BBYS section + CTA, link to dedicated BBYS page |
| H | 355 main words is too thin for the primary buyer hub | Expand to 800–1,000 words: BBYS, financing options, relocation, first-time buyer, neighborhoods, the buying process |
| M | "Who Can Help Sell My Home in Windsor, CO?" H3 (related-post widget) is wildly off-topic for `/buyers/` | Show buyer-relevant related posts |

### 3.5 Sellers Hub — `/sellers/`

- **Title:** 71 chars.
- **Description:** 139 chars.
- **H1:** "Sell My Home in Northern Colorado" — fine.
- **Content (447 main words):** "We Know the Market" + "We Have the Creative Talent…" — generic seller copy. A 21-input contact form is present.
- **Programs:** none mentioned despite this being where seller programs should live.

| Severity | Issue | Fix |
|---|---|---|
| C | **`$COUNT$ Listing$S$">Search Listings` H2** rendered as literal text | Fix template |
| C | **Seller hub doesn't mention Cash Offer, Remodel-on-our-Dime, BBYS** — the four offers that distinguish Kittle from every other agent | Add a "Choose Your Selling Path" section featuring all four programs, each with a button → dedicated landing page |
| H | 447 main words is too thin for the primary seller hub | Expand to 800–1,000 words. Include the Kittle Home Selling System overview, GUARANTEED SOLD, Designed to Sell |
| M | 21-input form is too long for primary lead capture; should be 4–6 fields | Shorten the contact form, move advanced fields to a multi-step or post-submission page |

### 3.6 Contact — `/contact/`

- **Title:** 26 chars ("Contact Kittle Real Estate") — too short, missing geo.
- **Description:** 59 chars.
- **H1:** "Contact Kittle Real Estate" — fine.
- **Content (325 main words):** OK conversational copy. 17-input form.
- **Programs:** none.

| Severity | Issue | Fix |
|---|---|---|
| C | **`$COUNT$ Listing$S$">Search Listings` H2** rendered as text | Fix template |
| H | Title and description too short and generic | Title: "Contact Kittle Real Estate \| Fort Collins, CO \| 970-460-4444" |
| M | 17-input contact form | Reduce to 5–7 fields; add a "What are you most interested in?" dropdown that triggers BBYS / Cash Offer / Sell / Buy / Other |
| M | No address / map embed visible in extracted text | Confirm and add NAP block + Google Map iframe |

### 3.7 Sellers — Free Market Analysis — `/sellers/free-market-analysis/`

- **Title:** 126 chars, double-mention of "Northern Colorado Area".
- **Description:** 69 chars.
- **H1:** "What's Your Northern Colorado Area Property Worth?" — fine.
- **Content (340 main words):** mostly form. Short blurb and a state dropdown.
- **Programs:** none.

| Severity | Issue | Fix |
|---|---|---|
| C | **`$COUNT$ Listing$S$">Search Listings` H2** rendered as text | Fix template |
| H | Critical conversion page is light on content; no instant valuation, no expected-turnaround time, no "what happens next" | Add 200–300 words: how the analysis is done, turnaround time, sample report screenshot, testimonials |
| H | Title 126 chars, redundant phrasing | Shorten to ~60 chars: "Free Home Valuation in Northern Colorado \| Kittle Real Estate" |
| H | No mention of Cash Offer / BBYS — natural cross-sell from the seller-considering-options funnel | Add "Already know you want to sell? Compare your selling options:" with three cards: Traditional Listing / Cash Offer / Remodel-on-our-Dime |

### 3.8 Sellers — Home Value — `/sellers/home-value/`

- **Title:** 10 chars ("Home Value").
- **Description:** boilerplate IDX ("Search homes for sale in Northern Colorado…").
- **H1:** **none.**
- **Content: 4 main words.**
- **Programs:** none.

| Severity | Issue | Fix |
|---|---|---|
| C | **Single most important seller lead-capture URL is a 4-word shell.** | Rebuild from scratch: H1 "What's My Home Worth?", instant-valuation widget (RealScout, Cloud CMA, or HouseValues), 200–400 words of educational copy, "Choose Your Path" cards (Cash Offer / Traditional / Remodel) |
| C | 0 H1, boilerplate description, 10-char title | Full meta rewrite |
| H | No CTA | Add primary form |

### 3.9 Sellers — Decide to Sell / Marketing Your Home / Pricing Your Home / Select an Agent

These four `/sellers/` sub-pages share template defects:

- Boilerplate "Search homes for sale…" descriptions on `/sellers/decide-to-sell/`, `/sellers/select-an-agent-and-price/`.
- Each page in the 215–717 word range — lightly written, generic-real-estate copy ("you should consider X, Y, Z").
- All have the **`$COUNT$ Listing$S$"` template bug** as an H2.
- None mention the specialty programs.
- No local examples (Fort Collins-specific pricing data, Northern Colorado seasonality, etc.).

| Severity | Issue | Fix |
|---|---|---|
| C | Template bug across all four pages | Fix once at template level |
| H | All four pages read as generic real-estate-101, no local signal | Inject Northern Colorado specifics: median DOM, list-to-sale ratios, Fort Collins / Greeley / Windsor / Loveland comparison, season-of-sale data |
| H | No specialty-program CTAs | Each page should have a sidebar with "Or skip the prep — get a Cash Offer" / "Want to upgrade first? Remodel-on-our-Dime" |
| M | Boilerplate descriptions | Rewrite per-page |

### 3.10 Buyers — First-Time Buyers — `/buyers/first-time-buyers/`

- **Title:** 63 chars, fine.
- **Description:** 119 chars, fine.
- **H1:** "First-Time Home Buyers" — fine.
- **Content (548 main words):** standard pre-qual / pre-approval explainer.
- **Programs:** none.

| Severity | Issue | Fix |
|---|---|---|
| C | **`$COUNT$ Listing$S$">Search Listings` H2** rendered as text | Fix template |
| H | Generic real-estate-101 content, not Northern-Colorado-specific | Add CHFA, Fort Collins Down Payment Assistance, Larimer County first-time programs, Greeley UNC employee programs, etc. |
| H | thegroupinc.com ranks #6 for "first time home buyer Fort Collins" on its `/loan-programs/` page (per `keyword-research.md`) — Kittle has no equivalent | Add 800-word First-Time Buyer Guide with Northern Colorado-specific programs |
| M | No mention of Buy-Before-You-Sell as a future-state path | Add "First time today, BBYS later — here's how" |

### 3.11 Buyers — Relocation — `/buyers/relocation/`

- **Title:** 10 chars ("Relocation").
- **Description:** boilerplate.
- **H1:** **5 H1 tags** ("RELOCATION", "FORT COLLINS", "LOVELAND", "GREELEY", "WINDSOR").
- **Content (940 main words):** decent — covers all four major NoCO cities with relocation perks.
- **Note:** kittlerealestate.com ranks **#5** for "relocation real estate Fort Collins" per `keyword-research.md` — this page is one of the few content wins, but its on-page SEO is broken.

| Severity | Issue | Fix |
|---|---|---|
| C | **5 H1 tags** | Reduce to 1: `<h1>Relocation to Northern Colorado</h1>`. Demote city sections to H2. |
| H | 10-char title and boilerplate description waste a top-5-ranking page | Title: "Relocate to Northern Colorado \| Fort Collins, Loveland, Greeley & Windsor Relocation Guide". Custom description. |
| H | Page is the relocation hub but doesn't mention Buy-Before-You-Sell (the natural relocation tool) | Add a "Relocating? Use Buy Before You Sell" section |
| M | Add city-specific relocation packets / PDFs (lead magnet) | Build downloadable per-city guides |

### 3.12 Community Pages (Geo Hubs)

These are the strongest content asset on the site. Detailed per-page review:

#### 3.12.1 `/communities/move-to-fort-collins-co/`

- **Title:** 68 chars, OK.
- **Description:** 145 chars, OK.
- **H1:** **none.**
- **Content (4,392 main words):** strongest single page on the site for content depth. Real history (CSU, Old Town, military origins), demographics, schools, attractions.
- **Local relevance:** "Fort Collins" mentioned 98 times.
- **Programs:** none.

| Severity | Issue | Fix |
|---|---|---|
| H | **0 H1** on a 4,392-word flagship community page | Add `<h1>Fort Collins, CO Real Estate \| Homes for Sale & Living Guide</h1>` |
| H | No specialty-program CTAs on the highest-traffic geo page | Add "Selling in Fort Collins? Compare Your Options" cards: Cash Offer / Traditional / Remodel-on-our-Dime |
| H | No 2026 market data (median price, DOM, inventory) — the gjsentinel.com forecast page outranks Kittle on "Fort Collins real estate market 2026" per `keyword-research.md` | Add a market-data H2 with current numbers, refreshed quarterly |
| M | No internal links to neighborhood-specific pages (Old Town, Harmony, Horsetooth, Foothills, Campus West) | Add neighborhood guide section |

#### 3.12.2 `/communities/move-to-loveland-co/`

- **Title:** 64 chars.
- **Description:** 146 chars.
- **H1:** "Loveland, CO Real Estate" — fine.
- **Content (2,664 main words):** solid Loveland-specific copy.
- **Local relevance:** "Loveland" 85 times.
- **Programs:** none.

| Severity | Issue | Fix |
|---|---|---|
| H | No specialty-program CTAs | Add three program cards |
| H | No 2026 market data | Add quarterly-refreshed market block |
| M | "Larimer County Golf / Horse / Luxury / Waterfront Properties" cross-sell H2s feel like SEO link blocks rather than user-relevant content | Either remove or convert to a single "Loveland Specialty Properties" H2 with 1–2 sentences each |

#### 3.12.3 `/communities/move-to-greeley-co/`

- **Title:** 63 chars.
- **Description:** 144 chars.
- **H1:** **none** (page uses an H2 "Greeley, CO Real Estate" as the de facto heading).
- **Content (2,788 main words):** good Greeley-specific copy (UNC, agriculture, growth, schools).
- **Local relevance:** "Greeley" 92 times.

| Severity | Issue | Fix |
|---|---|---|
| H | **0 H1** | Add `<h1>Greeley, CO Real Estate \| Homes for Sale</h1>` |
| H | No specialty-program CTAs | Add program cards |
| H | No 2026 market data | Add market block |

#### 3.12.4 `/communities/move-to-windsor-co/`

- **Title:** 63 chars.
- **Description:** 141 chars.
- **H1:** **none**.
- **Content (2,092 main words):** Windsor-specific (small-town charm, Larimer/Weld county border).
- **Local relevance:** "Windsor" 96 times.

| Severity | Issue | Fix |
|---|---|---|
| H | **0 H1** | Add H1 |
| H | No specialty-program CTAs | Add program cards |
| H | No 2026 market data | Add market block |

#### 3.12.5 `/communities/move-to-wellington-co/`

- **Title:** 75 chars, OK.
- **Description:** 223 chars (over the 160 cap), starts strong: "We are the top producing team in Wellington for eight straight years…"
- **H1:** "Wellington, CO Real Estate" — fine.
- **Content (2,406 main words):** solid Wellington-specific (history, schools, demographics, "Northern Gateway").
- **Local relevance:** "Wellington" 116 times — highest of any page.

| Severity | Issue | Fix |
|---|---|---|
| H | Description 223 chars w/ embedded brag ("guarantee three offers in 72 hours") — runs over 160 | Trim description to 150–155 chars |
| H | No specialty-program CTAs | Add program cards |
| M | "Top producing team in Wellington for eight straight years" claim isn't sourced anywhere on the site | Add a credentials sidebar with award badges and source links |

#### 3.12.6 `/communities/move-to-timnath-co/`

- **Title:** 69 chars.
- **Description:** **358 chars** — far over cap, sentence fragment ("Looking for a home for sale in Timnath CO? Our realtors in Colorado will help…").
- **H1:** "Timnath, CO Real Estate" — fine.
- **Content (1,853 main words):** decent Timnath copy.

| Severity | Issue | Fix |
|---|---|---|
| C | Description 358 chars — 2.3× over the limit | Rewrite to ~150 chars |
| H | Same program-CTA, market-data gaps as other community pages | Add cards + market block |

#### 3.12.7 `/communities/old-town-fort-collins/`

- **Title:** 86 chars.
- **Description:** 234 chars (over cap).
- **H1:** "OLD TOWN FORT COLLINS" — present but ALL CAPS hurts readability.
- **Content (843 main words):** strong Old Town narrative (Disneyland Main Street model, historic district).
- **Note:** kittlerealestate.com ranks **#8** for "Old Town Fort Collins homes" per `keyword-research.md`. fortcollinsrealestatebyjoyce.com (Joyce Giard) is the dominant competitor for this term.

| Severity | Issue | Fix |
|---|---|---|
| H | Description 234 chars | Rewrite to 150 chars |
| H | Single 843-word page targeting Old Town competes with a Joyce-Giard hub of 2k+ words | Expand to 2,000+ words with neighborhood map, walkability score, restaurants, condos vs single-family breakdown |
| H | No program CTAs | Add cards |
| M | ALL CAPS H1 | Sentence case |

### 3.13 Featured-Search Hub Pages (5 pages, shared template defects)

Pages: `/luxury-homes/`, `/horse-properties/`, `/new-construction/`, `/golf-course-homes/`, `/condominiums-townhomes/`.

These are "Featured Search" pages with an IDX listings widget and minimal editorial copy.

| Page | mainWords | H1 | Title | Desc |
|---|---|---|---|---|
| `/luxury-homes/` | 624 | **0** | "Luxury Homes - Kittle Real Estate" | shared boilerplate |
| `/horse-properties/` | 590 | **0** | "Horse Properties - Kittle Real Estate" | shared boilerplate |
| `/new-construction/` | 568 | **0** | "New Construction - Kittle Real Estate" | shared boilerplate |
| `/golf-course-homes/` | 825 | **0** | "Golf Course Homes - Kittle Real Estate" | shared boilerplate |
| `/condominiums-townhomes/` | 29 | **0** | "Condominiums/Townhomes - Kittle Real Estate" | shared boilerplate (mainWords actually 29 — page is empty besides "No Matching Listings") |

**Shared issues:**
| Severity | Issue | Fix |
|---|---|---|
| C | All 5 pages share an **identical 224-char meta description** with typo "professionalsthat" — Google de-indexes duplicate-meta pages | Write 5 unique descriptions |
| C | All 5 pages have **0 H1** | Add per-page H1 ("Luxury Homes for Sale in Northern Colorado", etc.) |
| C | `/condominiums-townhomes/` has 29 main words (essentially empty) — this should be a tens-of-thousands-search-volume page | Build out with editorial: types, popular complexes (Old Town lofts, Foothills, etc.), price points, HOA notes |
| H | None mention specialty programs (most relevant for luxury — sell-and-stay, BBYS) | Add at least one program block per page |
| H | "Luxury Homes" page is keyword #20 in the rankings table per `keyword-research.md`, currently not in top 10 | Re-template with a 1,500-word luxury hub: market segments ($1M–$2M, $2M–$5M, $5M+), view properties, acreage, neighborhoods |
| M | Titles are all 33–43 chars but lack geo modifier | Title: "Luxury Homes for Sale in Fort Collins & Northern Colorado \| Kittle" |

### 3.14 "Top Realtor in {city}" Pages (4 sampled of 12)

Pages: `/realtors/top-realtor-in-windsor-co/`, `/realtors/top-realtor-in-loveland-co/`, `/realtors/top-realtors-in-greeley-co/`, plus 9 others I didn't sample (Berthoud, Eaton, Evans, Johnstown, Livermore, Masonville, Severance, Timnath, Wellington).

- **Titles:** all 96–98 chars with redundant filler ("- Realtors Near You - Realtor {City} - Kittle Real Estate").
- **Descriptions:** all 369–371 chars.
- **H1s:** present, formatted correctly.
- **Content:** ranges from 632 (Loveland) to 1,242 (Greeley) main words. Decently localized; Greeley page in particular is solid with H3 sub-sections.
- **Programs:** none mentioned.

| Severity | Issue | Fix |
|---|---|---|
| H | Titles 96–98 chars all share same boilerplate filler | Trim to "Top Realtors in {City}, CO \| Kittle Real Estate" (~50 chars) |
| H | Descriptions 369–371 chars across all 12 pages | Rewrite each to ~150 chars, unique to the city |
| H | URL inconsistency: `/realtors/top-realtor-in-windsor-co/` (singular) vs `/realtors/top-realtors-in-greeley-co/` (plural) | Standardize on plural |
| H | None mention specialty programs | Add a "What sets Kittle apart in {City}" section featuring the 4 programs |
| M | Loveland page (632 words) much thinner than Greeley page (1,242 words) | Bring all 12 pages up to ≥1,000 words |

### 3.15 Seller-Tips Pages — `/seller-tips/fort-collins-co/`, `/seller-tips/steps-for-selling-a-house-in-greeley-co/`

- Sampled `/seller-tips/fort-collins-co/`:
  - Title 36 chars ("STEPS FOR SELLING IN FORT COLLINS CO") — ALL CAPS, missing brand.
  - Description: boilerplate IDX.
  - H1: "STEPS FOR SELLING IN FORT COLLINS CO" — ALL CAPS.
  - 1,142 main words. Good outline (Choose Agent / Disclosure / Outdoor Checklist / Indoor Checklist / Best Time to Sell / Pricing).
- Only 2 pages exist in the seller-tips silo (Fort Collins, Greeley). No Loveland, Windsor, Wellington, Timnath equivalents.

| Severity | Issue | Fix |
|---|---|---|
| H | Title and H1 in ALL CAPS, no brand | "How to Sell Your Home in Fort Collins, CO \| Kittle Real Estate" |
| H | Boilerplate description | Rewrite |
| H | Silo has only 2 of 7 NoCO cities | Build seller-tips pages for Loveland, Windsor, Wellington, Timnath, Old Town, Berthoud |
| M | No mention of Cash Offer / Remodel as an alternative | Add "Or skip the prep — Cash Offer or Remodel-on-our-Dime" sidebar |

### 3.16 Reviews — `/reviews/`

- **Title:** "Kittle Real Estate Testimonials" (31 chars).
- **Description:** 68 chars.
- **H1:** "Reviews" — short.
- **Content (2,199 main words):** strong — pulls Zillow, Facebook, Google reviews. Includes a **negative review** ("Six months on the market - no sale… butterflygirlinco4") which is unusual to leave on the page; possibly intentional for trust, but unaddressed.
- **CTAs:** Facebook Reviews, etc.

| Severity | Issue | Fix |
|---|---|---|
| H | Negative review left without response | Either remove (defensible if it was filtered through), or add a brief response from Rob ("We're sorry your experience didn't meet expectations…") |
| M | H1 just "Reviews" | "Read 400+ Reviews of Kittle Real Estate" |
| M | No schema.org Review markup visible | Add Review/AggregateRating JSON-LD |
| M | No "Leave us a review" CTA | Add link out to Google review form |
| L | Title could be sharper | "400+ 5-Star Reviews \| Kittle Real Estate Fort Collins" |

### 3.17 Financing-Options Hub — `/financing-options/`

- **Title:** 57 chars.
- **Description:** boilerplate IDX.
- **H1:** present.
- **Content (300 main words):** thin.
- **5 sub-pages exist:** `applications-processing`, `funding`, `get-pre-approved`, `know-the-numbers`, `shop-for-a-loan`. Did not deep-sample these.

| Severity | Issue | Fix |
|---|---|---|
| C | **`$COUNT$ Listing$S$">Search Listings` H2** | Fix template |
| H | Boilerplate description | Rewrite |
| H | 300 words for the financing hub is too light | Expand with NoCO-specific content: CHFA programs, VA loans (Cheyenne / FE Warren proximity), CSU faculty home-loan programs |
| H | thegroupinc.com's `/loan-programs/` page ranks #6 for "first time home buyer Fort Collins" — Kittle has no equivalent ranking | Build a "Northern Colorado Loan Programs" guide |

### 3.18 Rob Kittle's Bio — `/agents/rob-kittle/`

- **Title:** 33 chars.
- **Description:** 81 chars (generic).
- **H1:** **none.**
- **Content (136 main words):** essentially "Rob began his career in 1999. He's helped 7,500 families…" — and that's it. No story, no philosophy, no list of awards, no quote, no media features.
- The team leader's bio is the second-thinnest page on the site.

| Severity | Issue | Fix |
|---|---|---|
| C | 0 H1 on the team leader's bio | Add "Rob Kittle \| Founder, Kittle Real Estate" |
| C | 136 words for the founder's bio | Expand to 600–1,000 words: full story, philosophy, specialty programs (he invented them), awards, media (Wall Street Journal #1 ranking), community involvement, family |
| H | **`$COUNT$ Listing$S$">Search Listings` H2** rendered as text on the founder's own page | Fix template |
| H | No professional photo, video, podcast embeds visible | Add headshot, video intro |
| M | Generic title and description | Rewrite |

### 3.19 Kittle Cares — `/about/kittle-cares/`

- **Title:** 12 chars ("Kittle Cares").
- **Description:** boilerplate IDX.
- **H1:** **none.**
- **Content (830 main words):** decent — covers community involvement.

| Severity | Issue | Fix |
|---|---|---|
| H | 0 H1, 12-char title, boilerplate description | Full meta rewrite |
| M | No images of Kittle Cares events visible in extraction | Confirm and add gallery |

### 3.20 Blog Posts (14 sampled of 88)

The blog is the only content silo on the site that is **actively being written to a high standard in 2026**. Rob's voice carries through; structure is good. Findings are pattern-level rather than per-post.

**Patterns observed:**

- All sampled posts have a single H1 (good) except `may-2026-cant-miss-events` (2 H1s) — minor.
- 6 posts have titles > 70 chars.
- 3 posts have **empty meta descriptions** (`who-can-help-sell-my-home-fast-in-fort-collins-co`, `who-can-help-sell-my-home-in-windsor-co`, `who-can-help-sell-my-home-in-loveland-co`) — search engines will auto-truncate body text.
- **`$COUNT$ Listing$S$">Search Listings` H2** appears on 12 of 14 sampled posts (sidebar component).
- The "Who Can Help Sell My Home in Windsor, CO?" related-post block recurs as an H2 across many unrelated posts — same widget bug as elsewhere.
- **Specialty-program coverage:**
  - `/blog/how-can-i-buy-a-home-before-selling-my-current-one/` → BBYS strategies (bridge loans, HELOCs, rent-back) — solid post but doesn't link to a Kittle BBYS landing page (because none exists). It cross-promotes generic strategies a buyer could use anywhere.
  - `/blog/who-can-help-sell-my-home-fast-in-fort-collins-co/`, `…in-loveland-co/`, `…in-windsor-co/` — all three mention BBYS and Cash Offer. Good.
- **Blog navigation:** the right sidebar has a "Blog Navigation" widget but no taxonomy / category pages were found in sitemap (need to verify).

**Strongest posts (sampled):**

| Post | Words | Note |
|---|---|---|
| `/blog/3-must-dos-for-first-time-home-buyers/` | 1,114 | Decent first-time-buyer content, no NoCO specifics |
| `/blog/moving-to-and-living-in-estes-park-co-2026-edition/` | 1,079 | Strong locale guide — should be in `/communities/` not `/blog/` |
| `/blog/moving-to-and-living-in-longmont-co-2026-edition/` | 1,020 | Same — should be in `/communities/` |
| `/blog/the-northern-colorado-housing-market-just-got-more-negotiable/` | 1,013 | Real market commentary, Rob's voice |
| `/blog/the-hidden-opportunity-in-northern-colorado-real-estate-most-people-are-missing/` | 1,006 | Sharp opinion piece |
| `/blog/luxury-homes-in-northern-colorado-what-it-actually-takes-to-sell-at-the-highest-level/` | 982 | Very good luxury thought-leadership |

**Weakest posts (sampled):**
- `/blog/who-can-help-sell-my-home-in-windsor-co/`, `…in-loveland-co/`, `…in-fast-in-fort-collins-co/`: three near-identical 460–500 word posts that read as boilerplate spun for SEO. Empty meta descriptions. These add little.

| Severity | Issue | Fix |
|---|---|---|
| C | **`$COUNT$ Listing$S$">Search Listings` H2** rendered as text on most posts | Fix template |
| H | 3 posts have empty meta descriptions | Backfill |
| H | The 3 "Who can help sell my home in {city}" posts read as duplicate spun content | Rewrite each with unique 1,000-word content per city, or consolidate to one cornerstone "Sell My Home Fast in Northern Colorado" page |
| H | Estes Park & Longmont 2026 "Moving to and Living In" posts are 1,000+ word community guides misfiled in `/blog/` | Promote to `/communities/move-to-estes-park-co/` and `/communities/move-to-longmont-co/` (currently /blog/-only) |
| M | No category / tag taxonomy URLs found in sitemap (`/blog/category/sellers/` would help) | Confirm and build taxonomy pages |
| M | Blog has 88 posts but no apparent pillar→cluster structure | Pick 5 pillar topics (BBYS, Cash Offer, NoCO Market, First-Time Buyer, Luxury) and re-link existing posts as clusters |

### 3.21 Buyer / Seller Funnel Sub-Pages (one-line per page)

Pages I sampled but did not deep-dive (they share the same template-bug + thin-content + no-program-CTA pattern as the rest):

| Path | Words | Severity Note |
|---|---|---|
| `/buyers/buyers-guide/` | 801 | Decent guide; no NoCO specifics; template bug present |
| `/buyers/foreclosures/` | 1,139 | Good word count; H1 just "FORECLOSURES" — needs sentence case + brand |
| `/buyers/mortgage-pre-approval/` | 427 | Thin |
| `/buyers/personalized-home-search/` | 351 | Thin; missed opportunity to feature My Home Tracker |
| `/sellers/decide-to-sell/` | 717 | Boilerplate description, no programs |
| `/sellers/marketing-your-home/` | 215 | Too thin for a seller funnel page; no programs |
| `/sellers/select-an-agent-and-price/` | 443 | Thin, generic |
| `/sellers/pricing-your-home/` | 596 | OK content, no NoCO data |
| `/sellers/the-40-ds-of-moving/` | 38 | **Shell page; remove or rebuild as "How to Move with Less Stress"** |
| `/contact/cost-of-waiting/` | 338 | Sales-pitchy; no clear CTA |
| `/contact/are-you-ready-to-buy-or-sell-a-home/` | 213 | Shell-ish; should be a quiz/wizard not a paragraph |
| `/about/kittle-careers/` | 635 | OK careers copy; missing application form |

---

## 4. Keyword Density Analysis

For each significant page, the following table shows raw mention counts (whole-word matches) of major local terms and category terms in the page body. Pages where a count is "= 4 / 3 / 3 / 4" are at the **chrome baseline** — i.e., the menu/footer mentions the city in the navigation but the page body does not.

> Full per-page counts are in `/tmp/krpages/all.json` if a more granular view is needed; this table summarizes the highlights.

### 4.1 Local geographic terms

| Page | Fort Collins | Loveland | Greeley | Windsor | Wellington | Timnath | Northern Colorado |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/communities/move-to-fort-collins-co/` | **98** | 9 | 4 | 12 | 5 | 7 | 1 |
| `/communities/move-to-greeley-co/` | 5 | 3 | **92** | 7 | 1 | 1 | 2 |
| `/communities/move-to-loveland-co/` | 11 | **85** | 3 | 10 | 4 | 5 | 2 |
| `/communities/move-to-wellington-co/` | 12 | 4 | 4 | 3 | **116** | 1 | 3 |
| `/communities/move-to-timnath-co/` | 6 | 4 | 4 | 3 | 1 | **105** | 3 |
| `/communities/move-to-windsor-co/` | 11 | 9 | 4 | **96** | 4 | 5 | 0 |
| `/communities/old-town-fort-collins/` | **40** | 3 | 3 | 3 | 1 | 1 | 0 |
| Homepage | 14 | 4 | 4 | 4 | 2 | 2 | **35** |
| `/about/` | 5 | 4 | 4 | 4 | 2 | 2 | **17** |
| `/buyers/relocation/` | 17 | 13 | 11 | 12 | 1 | 1 | 5 |
| `/seller-tips/fort-collins-co/` | **35** | 3 | 3 | 3 | 1 | 1 | 0 |
| `/realtors/top-realtors-in-greeley-co/` | 5 | 3 | **45** | 3 | 1 | 1 | 5 |
| `/realtors/top-realtor-in-windsor-co/` | 5 | 3 | 3 | **18** | 1 | 1 | 2 |
| `/realtors/top-realtor-in-loveland-co/` | 5 | **17** | 3 | 3 | 1 | 1 | 1 |
| `/buyers/`, `/sellers/`, `/contact/`, `/communities/` | 4–5 | 3 | 3 | 4–5 | 1–2 | 1–2 | 4 (chrome only) |
| All 5 Featured Search hub pages | 4–10 | 3–5 | 3–8 | 3–9 | 1 | 1–2 | 0 |
| All `/sellers/` sub-pages, `/buyers/` sub-pages, `/financing-options/` | 4 | 3 | 3 | 4 | 1 | 1 | 1–4 (chrome only) |

**Read:** the community pages do their job — they're appropriately keyword-dense for the city they target. **Every other page is chrome-baseline for local terms** — meaning a user (or Google) reading the body wouldn't know the page is for Northern Colorado without checking the menu. Massive missed opportunity on every funnel page (`/buyers/`, `/sellers/`, `/contact/`, `/financing-options/`, `/sellers/home-value/`, etc.) to weave in city names.

### 4.2 Industry / category terms (sampled)

Top-level pages (chrome baseline ≈ 35–60 mentions of "real estate", 30–50 of "home", 15–30 of "agent", 5–15 of "buyer / seller", 3–8 of "Realtor"):

- **Homepage:** "real estate" 78×, "agent" 45×, "Northern Colorado" 35×, "home" 90+×, "Cash Offer" 6×, "59 days" 1×, "BBYS" mentioned descriptively.
- **`/sellers/`:** "real estate" 18×, "seller" 12×, "Northern Colorado" 4× — much lower than expected for the seller hub.
- **`/buyers/`:** "real estate" 16×, "buyer" 14×, "Northern Colorado" 4× — same pattern.
- **`/communities/move-to-fort-collins-co/`:** "real estate" 28×, "Fort Collins" 98× — strong.
- **`/sellers/home-value/`:** essentially zero — page is empty.

**Supporting-keyword / semantic-richness gaps:** Pages do not consistently use semantic synonyms expected for their topic. For example:
- `/sellers/` rarely uses "list," "listing," "home valuation," "comparative market analysis," "CMA," "DOM," "list-to-sale ratio."
- `/buyers/` rarely uses "pre-approved," "earnest money," "due diligence," "inspection contingency," "appraisal gap."
- `/buyers/first-time-buyers/` mentions "FHA" 1×, "VA" 0×, "CHFA" 0× — all should be present.
- `/financing-options/` does not mention "Northern Colorado" beyond the chrome and does not mention "CHFA," "Larimer County," "Loveland Habitat," "USDA Rural Development" (relevant for Wellington / Ault / outlying NoCO buyers).

---

## 5. Content Gaps Analysis (Kittle vs. Competitors)

This section synthesizes content gaps observable from the audit against what `keyword-research.md`, `backlink-analysis.md`, and `competitor-analysis.md` already document about The Group, C3 Real Estate Solutions, Mullenberg Team, Ambassador Colorado, and NoCo Home Team — and against the visible long-tail-content patterns of kennarealestate.com (the top non-local content competitor).

### 5.1 Specialty-program content (the biggest gap, by far)

| Program | Kittle has dedicated landing page? | Mentioned anywhere? | Competitor coverage |
|---|---|---|---|
| Buy Before You Sell | **No** | Homepage + 1 blog post + 3 spun-content blogs | Kennarealestate.com has a dedicated BBYS hub that ranks #1 for "buy before you sell program Colorado" |
| Cash Offer (59-day close) | **No** | Homepage + 3 spun-content blogs | Mullenberg Team owns #1 for "sell my house Fort Collins" with cash-offer angle. webuyhouses.com owns the cash-offer category in NoCO. |
| Remodel-on-our-Dime | **No** | Homepage only ("Designed to Sell" section) | Unique to Kittle — no competitor has a true equivalent. **This is a moat being wasted.** |
| Sell-and-Stay | **No** | **Not mentioned anywhere on the site** | Several iBuyer / institutional-buyer competitors have sell-leaseback offerings; no local team owns it. |

### 5.2 Market-data content

- **The Group, Inc.** ranks #9 for "Fort Collins real estate market 2026" with its `/forecast/` subfolder — quarterly market-forecast pages.
- **gjsentinel.com** (a newspaper) ranks #1 for the same term.
- **Kittle has no `/market-report/`, `/forecast/`, or city-specific market-data pages.** Community pages don't include market data.

### 5.3 Long-tail informational content

- **Kennarealestate.com** ranks for relocation, first-time buyer, lots/acreage, new construction long-tail queries — all with deep guide pages.
- **The Group's NoCo Voice** blog ranks for acreage long-tails.
- **Kittle's blog is rich in voice** but lacks pillar→cluster structure; long-tail is not systematically pursued.

### 5.4 Neighborhood / sub-market guides

- The community pages cover 7 cities. The site has **none of these neighborhood-level pages** that a competitor like fortcollinsrealestatebyjoyce.com leverages: Old Town, Harmony, Horsetooth, Mountain Range Shadows, Foothills, Campus West, Centerre Stadium-area, Rigden Farm, etc. (Old Town is the only sub-Fort-Collins page that exists.)

### 5.5 Educational / lead-magnet content

- **Buyer guide PDFs** — none visible.
- **Seller guide PDFs** — none visible.
- **Relocation packets** per city — none.
- **Market reports** delivered via email — `/contact/` mentions "Free Market Report" but the funnel ends at a generic contact form.
- **Cost of waiting calculator / mortgage calculator** — `/contact/cost-of-waiting/` is an article, not an interactive calculator.

### 5.6 Trust / credentials content

- **No `/awards/` page** — homepage mentions "many top awards" with no detail.
- **No `/in-the-press/` or `/media/` page** — Wall Street Journal #1-ranking claim is text-only on the homepage and `/agents/rob-kittle/`, not a citable list.
- **No `/case-studies/` or `/sold/$X-over-asking/` pages** — featured-listings section exists but no narrative case studies.

---

## 6. Lead Generation / Conversion Assessment

### 6.1 Lead-capture inventory

| Asset | Present? | Notes |
|---|---|---|
| Homepage hero CTA | Yes | "What's My Home Worth?", "Cash Offer On My Home", "Find a Home" — strong |
| Phone number sitewide | Yes | 970-460-4444 (main), 970-218-9200 (buyer 24/7) |
| Contact form | Yes | But 17–21 inputs is too long for primary capture |
| Free market analysis form | Yes | `/sellers/free-market-analysis/` |
| Home valuation tool / iframe | **No** | `/sellers/home-value/` is a 4-word shell page |
| Schedule appointment widget (Calendly) | Yes | Visible sitewide; `/calendly-test/` exists in sitemap (test page leak — should not be public) |
| My Home Tracker (saved-search email) | Yes | `/buyers/personalized-home-search/` |
| Newsletter / email signup | Partial | "sign up for email alerts of new listings" on `/communities/` — not a true newsletter |
| Lead magnets (PDF guides) | **No** | None visible |
| Live chat | **Not visible in extracted HTML** | Confirm |
| Specialty-program landing pages with dedicated forms | **No** | The single most important lead-gen gap |
| Seller's guide download | **No** | |
| Buyer's guide download | **No** | (`/buyers/buyers-guide/` is an article, not a downloadable) |
| Relocation packets | **No** | |
| Quiz / wizard ("Should I sell with cash offer or traditional?") | **No** | Major missed opportunity |
| Webinar registration | Hint | Blog post `/blog/free-webinar-how-to-sell-your-home-faster-for-top-dollar/` exists — confirm if registration is wired up |
| Reviews / social proof on conversion pages | Partial | Reviews page is rich; conversion pages don't pull testimonials |

### 6.2 Conversion-path observations

- **Homepage → `/sellers/home-value/`**: a 4-word page. The single most visited seller conversion path is broken at the destination.
- **Homepage "Cash Offer" → ?**: confirm exact destination — currently appears to be a generic seller URL, not a dedicated cash-offer landing.
- **Homepage "Find a Home" → MLS search**: works, but has no nurture (saved search, registration prompt, Cash Offer cross-sell for trade-in users).
- **Community page → conversion**: community pages currently end with a "Larimer County Golf / Horse / Luxury / Waterfront" cross-sell block, not a targeted CTA. A sales conversion sequence on a community page should be: "View homes" → "Get neighborhood-specific market report" → "Schedule a tour" → "Get your home valued (BBYS prep)".
- **`/contact/` form is 17 inputs**: too long. Conversion-rate research consistently shows >40% drop in submissions when going from 5 to 10+ fields. Reduce to 5 fields with a clear "What are you most interested in?" router.

### 6.3 Specialty-program conversion gap (rebuild needed)

The four specialty programs need dedicated landing pages, each with:
- Clear H1 with the program name
- 90-second video explainer or short copy
- "How it works" (3–5 step process)
- Eligibility / qualifying criteria
- Recent case study
- FAQs (8–12)
- Dedicated form (5 fields max) tied to a CRM tag for that program
- Schema.org Service markup

These do not currently exist. **Building them is the single highest-ROI content investment Kittle can make.**

---

## 7. Prioritized Content Recommendations

### 7.1 Immediate fixes (Week 1–2, high-impact, mostly engineering)

1. **Fix the unrendered template variable** `$COUNT$ Listing$S$">Search Listings` sitewide. Almost certainly a single template file. *(C / sitewide / ~50% of pages affected)*
2. **Rewrite the homepage `<title>`** — drop "Colorado Springs", fix the typo ("Fort Collin"), trim to ≤60 chars. *(C)*
3. **Rewrite the homepage meta description** to ≤155 chars, leading with BBYS / Cash Offer. *(C)*
4. **Rebuild `/sellers/home-value/`** — currently a 4-word shell page on the primary seller conversion path. Add H1, 200-word intro, instant-valuation widget, and form. *(C)*
5. **Add H1 tags** to the 14 pages missing one — including `/about/`, `/agents/rob-kittle/`, `/communities/move-to-fort-collins-co/`, all 5 featured-search pages. *(H)*
6. **Reduce `/buyers/relocation/` to a single H1**, demote the 4 city H1s to H2s. Rewrite the 10-char title. *(H)*
7. **Rewrite the 5 duplicate "Featured Search" meta descriptions** to be unique per page. Fix the "professionalsthat" typo. *(H)*
8. **Rewrite the 13 pages using the boilerplate "Search homes for sale in Northern Colorado…" description.** *(H)*
9. **Trim the contact form** from 17 to 5 inputs with a "What are you most interested in?" router (Sell / Cash Offer / BBYS / Buy / Other). *(H)*
10. **Remove `/calendly-test/`, `/test/`, `/test1/`** from the sitemap (they're public). *(H)*
11. **Add an answer or remove the negative review** ("Six months on the market - no sale… butterflygirlinco4") on `/reviews/`. *(M)*

### 7.2 Short-term (Month 1, content authoring)

12. **Build the four specialty-program landing pages**: `/cash-offer/`, `/buy-before-you-sell/`, `/remodel-on-our-dime/`, `/sell-and-stay/`. Each: 1,000+ words, video, 3-step process, FAQ, dedicated form, schema. *(C — top-priority content investment)*
13. **Rewrite Rob Kittle's bio** at `/agents/rob-kittle/` from 136 words to 800+ words: full origin story, the founding of the four programs, awards, WSJ #1 ranking citation, community work, family, podcast/video embed. *(H)*
14. **Add a "Choose Your Selling Path" block** to `/sellers/`, `/sellers/home-value/`, `/sellers/free-market-analysis/`, and all 7 community pages — three cards: Traditional Listing / Cash Offer / Remodel-on-our-Dime, with links to the new program pages. *(H)*
15. **Add a "Buy Before You Sell" call-out** to `/buyers/`, `/buyers/relocation/`, `/buyers/first-time-buyers/`. *(H)*
16. **Create per-city seller-tips pages** for Loveland, Windsor, Wellington, Timnath, Old Town, Berthoud (currently only Fort Collins and Greeley exist). 1,200 words each. *(H)*
17. **Promote `/blog/moving-to-and-living-in-estes-park-co-2026-edition/` and `/blog/moving-to-and-living-in-longmont-co-2026-edition/`** to `/communities/move-to-estes-park-co/` and `/communities/move-to-longmont-co/`. They're community guides misfiled. *(M)*
18. **Build a Northern Colorado Loan Programs guide** at `/financing-options/loan-programs-northern-colorado/` covering CHFA, FHA, VA, USDA Rural (for Wellington/Ault/Carr), CSU faculty programs, Larimer County DPA. *(H)*
19. **Rewrite all 12 "Top Realtor in {city}" titles and descriptions** to ≤60 / ≤155 chars; remove "- Realtors Near You - Realtor {city}" boilerplate. Add a "What sets Kittle apart" section featuring the 4 programs. *(H)*

### 7.3 Medium-term (Month 2–3)

20. **Build a quarterly Market Report system** — `/market-report/fort-collins/`, `/loveland/`, `/greeley/`, `/windsor/`, `/wellington/`, `/timnath/` with median price, DOM, list-to-sale ratio, inventory, refreshed quarterly. Embed on each community page. *(H)*
21. **Build neighborhood-level pages under Fort Collins**: Old Town (exists), Harmony, Horsetooth, Foothills, Campus West, Mountain Range Shadows, Rigden Farm, Centerre. 800–1,500 words each. *(M)*
22. **Build downloadable lead magnets**: Seller's Guide PDF, Buyer's Guide PDF, Relocation Packet (per city). Gate each with email capture. *(H)*
23. **Build interactive calculators**: Cost of Waiting (currently an article — make interactive), BBYS Bridge-Loan calculator, Net Proceeds calculator. *(M)*
24. **Build a "Sell with Confidence" wizard / quiz** that routes leads to the right program (BBYS / Cash Offer / Remodel-on-our-Dime / Traditional). *(M)*
25. **Pillar-cluster the blog**: 5 pillars (BBYS, Cash Offer, NoCO Market, First-Time Buyer, Luxury). Re-link the 88 existing posts as clusters. *(M)*
26. **Add Review schema and FAQ schema** on relevant pages. *(M)*
27. **Build an `/awards/` page** with Wall Street Journal #1, top-team rankings, sources. *(M)*

### 7.4 Long-term (Month 4–6)

28. **Build an `/in-the-press/` page** with Rob's media appearances, podcast features, broker quotes. Pitch new media. *(L)*
29. **Build `/case-studies/` or `/sold/`**: 6–12 narrative case studies showing each program in action ($X over asking, X-day close, BBYS success, Remodel ROI, etc.). *(M)*
30. **Translation / Spanish pages**: the team page lists Spanish and Chinese language capability — consider Spanish-language landing pages for Greeley (large Hispanic population). *(L)*
31. **Video content per city + per program**: 90-second explainers embedded on each community page and program page. *(L)*
32. **Email-nurture sequences tied to each program form** (separate from this audit but the content underpins it). *(M — handoff to email/CRM)*
33. **Schema markup audit + JSON-LD rollout** for RealEstateAgent, Service (per program), LocalBusiness, BreadcrumbList. *(M)*

---

## 8. Competitive Content Gaps Table

> "Client has it?" reflects the audit findings, not whether a thin/shell page exists at the URL. A 4-word page is treated as "no."

| Content Type | Kittle Has It? | Priority | Competitor Reference |
|---|---|---|---|
| Buy-Before-You-Sell dedicated landing page | **No** | **CRITICAL** | kennarealestate.com #1 for "buy before you sell program Colorado" |
| Cash Offer / instant-offer landing page | **No** | **CRITICAL** | mullenbergteam.com #1 "sell my house Fort Collins"; webuyhouses.com category leader |
| Remodel-on-our-Dime landing page | **No** | **CRITICAL** | Unique to Kittle — no competitor; biggest moat being wasted |
| Sell-and-Stay landing page | **No** | **CRITICAL** | No local competitor; iBuyers do it nationally |
| Quarterly NoCO market forecast | **No** | HIGH | thegroupinc.com `/forecast/` ranks #9 for "Fort Collins real estate market 2026" |
| First-time-buyer guide with NoCO programs | Thin | HIGH | thegroupinc.com `/loan-programs/` ranks #6 for "first time home buyer Fort Collins" |
| Relocation hub (multi-city) | Partial (broken H1s) | HIGH | thegroupinc.com #3, kennarealestate.com #1 for "relocation real estate Fort Collins" |
| Acreage / large-lot hub | Thin | HIGH | thegroupinc.com NoCo Voice ranks #8, #9 for "acreage homes Northern Colorado" |
| Old Town Fort Collins hub | Yes (843 words) | MEDIUM (expand) | fortcollinsrealestatebyjoyce.com is the dominant competitor |
| Per-city community pages (7) | Yes | MEDIUM (add programs + market data) | Most competitors have similar; differentiator is depth + freshness |
| Per-city seller-tips pages (7 needed) | 2 of 7 | HIGH | None of the named competitors have a full set; opportunity |
| Per-city "Top Realtor in {city}" pages (12) | Yes | MEDIUM (rewrite metadata) | These are the strongest geo SEO asset Kittle owns |
| Per-neighborhood pages (sub-Fort Collins) | 1 of ~10 | MEDIUM | fortcollinsrealestatebyjoyce.com leads this format |
| Buyer's Guide PDF lead magnet | **No** | HIGH | Industry standard; most competitors offer one |
| Seller's Guide PDF lead magnet | **No** | HIGH | Industry standard |
| Relocation Packet (per city) | **No** | MEDIUM | Industry standard |
| Cost of Waiting calculator (interactive) | Article only | MEDIUM | Industry-standard widget |
| Net Proceeds / Net Sheet calculator | **No** | MEDIUM | Industry-standard widget |
| BBYS bridge-loan calculator | **No** | MEDIUM | Differentiated — would own the niche |
| Mortgage calculator | Yes (`/buyers/mortgage-calculator/`) | LOW | Standard |
| Awards / press page | **No** | MEDIUM | thegroupinc.com, c3realestatesolutions.com both have one |
| Case studies / "Sold for $X over asking" | **No** | MEDIUM | Several competitors run social-proof case studies |
| Video on key pages | Unclear | LOW | thegroupinc.com leads with video |
| FAQ schema on key pages | Unclear (not visible in extraction) | LOW | Industry standard |
| Review / AggregateRating schema | Unclear | MEDIUM | Industry standard |
| Spanish-language pages (Greeley) | **No** | LOW (long-term) | None of the named competitors do this |
| Quarterly blog cadence | Yes (active 2026) | — | Strong |
| Pillar-cluster blog architecture | **No** (88 posts, no taxonomy URLs found) | MEDIUM | thegroupinc.com NoCo Voice has clearer taxonomy |
| Webinar / event registration system | Hint (1 blog post) | LOW | Differentiator opportunity |

---

## 9. Sample size and methodology notes

- **57 unique editorial pages were captured and extracted** (HTML downloaded with curl, parsed with regex-based extractor; full data in `/tmp/krpages/all.json` if the extracted dump is needed for further analysis).
- **88 blog posts exist on the site;** 14 were sampled (the longest by body size, plus the three most recent and the four "who can help sell my home in {city}" posts).
- The site has roughly **150 unique editorial URLs** plus another **~16,100 IDX/MLS filter URLs** (homes-for-sale-by-section, condos-for-sale-by-area, etc.) which were not part of this content audit (they are programmatic and out of scope for editorial review, though they create an indexation-bloat problem worth flagging in the technical SEO audit).
- The extraction pipeline used `curl` rather than `node scripts/browse.js` for community pages whose Playwright navigation timed out at networkidle. This produces fully accurate HTML extraction; only client-side-rendered widgets (e.g., MLS listings) would be missed, which is acceptable for content audit purposes.
- Cross-references: this audit relies on `keyword-research.md` and `backlink-analysis.md` (also in `seo/research/`) for competitor content patterns; details are not duplicated here.

---

*End of content audit.*
