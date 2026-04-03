# Site Structure Analysis: sellingcalgarycastles.com

**Crawl Date:** March 23, 2026
**Agent:** Neil Rowlandson, Calgary Real Estate
**Platform:** RealtyPress / IDX Broker on Cloudflare

---

## 1. Sitemap Analysis

### Overview
- **Sitemap location:** `https://sellingcalgarycastles.com/sitemap.xml` (standard XML urlset)
- **Total URLs in sitemap:** 38
- **Content pages analyzed:** 36
- **IDX/filter pages skipped:** 2 (property-search/results)

### URL Categories

| Category | Total | Content | IDX/Filter | Notes |
|----------|-------|---------|------------|-------|
| Buyers (guides) | 8 | 8 | 0 | Financial glossary, first-time buyers, mortgage calculator, etc. |
| Sellers (guides) | 6 | 6 | 0 | Pricing, marketing, showing, adding value, etc. |
| Blog posts | 4 | 4 | 0 | All mortgage/buying themed; outdated content |
| Property Search | 4 | 2 | 2 | Site map, property tracker; 2 results pages skipped |
| Community pages | 10 | 10 | 0 | Auburn Bay, Bridlewood, Chaparral, Cranston, Evergreen, Legacy, Mahogany, McKenzie Towne, New Brighton, Walden |
| Communities hub | 1 | 1 | 0 | Index page linking to community pages |
| Contact | 2 | 2 | 0 | Contact form + thank-you page (thank-you returns 403) |
| About | 1 | 1 | 0 | Agent bio page |
| Featured Listings | 1 | 1 | 0 | MLS-powered listings display |
| Homepage | 1 | 1 | 0 | Main landing page |

### Key Observations
- **Very small site** with only 38 URLs total -- limited content footprint
- **Only 4 blog posts** -- severely underutilized content marketing
- **10 community pages** -- good local SEO foundation but needs expansion
- **No dedicated service pages** (e.g., "Calgary REALTOR," "Luxury Homes," "Condos for Sale")
- **Missing pages:** No privacy policy, terms of service, or accessibility page in sitemap

---

## 2. Navigation and Internal Linking

### Navigation Structure
All analyzed pages share a consistent header/footer navigation. The navigation includes links to:
- Property Search, Communities, Buyers, Sellers, Contact, About
- Footer includes social links, contact info, and additional navigation

### Internal Linking Statistics

| Metric | Average | Min | Max |
|--------|---------|-----|-----|
| Total internal links per page | 110 | 0 | 180 |
| Contextual internal links per page | 64 | 0 | 133 |
| External links per page | 16 | 0 | 18 |

### Link Graph Analysis (Contextual Links Only)

**Most linked-to pages (from contextual links across all crawled pages):**

| Page | Inbound Contextual Links |
|------|-------------------------|
| /contact/ | 107 |
| /blog/ (index -- not in sitemap) | 78 |
| /blog/will-increasing-mortgage-rates-impact-home-prices/ | 69 |
| / (homepage) | 69 |
| /communities/ | 48 |
| /property-search/property-tracker/ | 48 |
| /buyers/ | 43 |
| /sellers/ | 41 |
| /sellers/free-market-analysis/ | 36 |
| /featured-listings/ | 36 |

**Orphaned pages** (no contextual inbound links from other crawled pages):
1. `/property-search/site-map/` -- MLS listing directory, no internal links pointing to it
2. `/contact/thank-you/` -- Returns 403 error; completely broken

### Internal Linking Issues
- **Blog index page (`/blog/`) is NOT in the sitemap** but receives 78 contextual links -- should be added
- **Community pages get zero cross-links** between each other; only linked from the hub page
- **Buyer/seller guide pages** share a flat link structure -- no progressive "next step" linking
- **No contextual CTAs** linking to contact or market analysis from buyer/seller content

---

## 3. Meta Tag Audit

### Title Tags

**Issues found:**
- **6 titles under 20 characters (too short):**
  - "Selling a Home" (14 chars) -- `/sellers/`
  - "Making an Offer" (15 chars) -- `/buyers/making-an-offer/`
  - "Featured Listings" (17 chars) -- `/featured-listings/`
  - "Pricing Your Home" (17 chars) -- `/sellers/pricing-your-home/`
  - "Showing Your Home" (17 chars) -- `/sellers/showing-your-home/`
  - "Marketing Your Home" (19 chars) -- `/sellers/marketing-your-home/`

- **0 titles over 60 characters** -- no truncation issues

**Pattern issues:**
- Titles lack geographic targeting (no "Calgary" in most buyer/seller page titles)
- Titles are generic and miss keyword opportunities (e.g., "Making an Offer" vs "Making an Offer on a Calgary Home | Neil Rowlandson")
- No brand name (agent name or site name) appended to any titles
- Community page titles follow a good pattern: "[Community] Homes for Sale - [Community] Real Estate"

### Meta Descriptions

**Issues found:**
- **1 missing entirely:** `/contact/thank-you/` (broken 403 page)
- **11 descriptions under 70 characters (too short/thin):**
  - "Guide to selling a home." (24 chars) -- `/sellers/`
  - "Your guide to buying a home." (28 chars) -- `/buyers/`
  - "Tips on marketing your home." (28 chars) -- `/sellers/marketing-your-home/`
  - And 8 more under 70 characters
- **4 descriptions over 160 characters (too long/will be truncated):**
  - `/blog/why-you-should-consider-selling-in-the-winter/` -- 524 chars (over by 364)
  - `/blog/is-getting-a-home-mortgage-still-too-difficult/` -- 426 chars (over by 266)
  - `/blog/common-things-to-look-out-for-before-buying-your-dream-home/` -- 316 chars (over by 156)
  - `/blog/will-increasing-mortgage-rates-impact-home-prices/` -- 305 chars (over by 145)

**Pattern issues:**
- Blog meta descriptions appear to be auto-generated from the first paragraph of post content
- Buyer/seller guide descriptions are generic and lack persuasive calls-to-action
- No descriptions mention Neil Rowlandson or Calgary specifically

### Open Graph Tags

- **Only 4 of 36 pages have OG tags** (11%) -- all 4 are blog posts
- **32 pages completely missing OG tags** -- sharing on social media will show generic/unpredictable previews
- No Twitter Card meta tags on any page except blogs

---

## 4. H1 Tag Audit

### Overview
- **35 of 36 pages have exactly 1 H1** (good)
- **1 page has multiple H1 tags:** Homepage has 2 H1s ("Find Your Calgary Area Home" and "Calgary Real Estate")
- **1 page has a generic/error H1:** `/contact/thank-you/` shows "Server Error" (403 page)

### H1 Quality Assessment

| Page Type | H1 Pattern | Quality |
|-----------|-----------|---------|
| Homepage | "Find Your Calgary Area Home" + "Calgary Real Estate" | Fix: merge to single, keyword-rich H1 |
| Community pages | "[Community] Homes & Real Estate" | Good pattern; consistent |
| Buyer guides | Varies ("Buying a Home in Calgary", "Mortgage Calculator", etc.) | Acceptable but could be more keyword-targeted |
| Seller guides | Varies ("Selling a Home in Calgary", "Pricing Your Home", etc.) | Generic; should include "Calgary" |
| Blog posts | Full article title | Good practice |
| About | "Neil Rowlandson" | Should include "Calgary REALTOR" or similar |
| Contact | "Contact Neil Rowlandson" | Acceptable |

---

## 5. Image Alt Text Analysis

### Overview
- **Total images across all pages:** ~280
- **Images missing alt text:** 23 total (on 2 pages)

### Pages with Missing Alt Text

| Page | Total Images | Missing Alt | Severity |
|------|-------------|-------------|----------|
| `/` (homepage) | 11 | 3 | Medium -- hero/showcase images lack alt |
| `/buyers/financial-terms-glossary/` | 25 | 20 | Critical -- 80% of images have no alt text |

### Notes
- Community pages all have 17 images each with proper alt text (good)
- Blog posts (7 images each) all have proper alt text
- Standard buyer/seller guide pages (5 images each) all have proper alt text
- The glossary page appears to use icon/badge images without alt attributes

---

## 6. Schema Markup Presence

### Current State
- **Only 5 of 36 pages have any schema markup** (14%)
- **All 5 use "Event" schema only** (for Open House listings)
- **Pages with Event schema:** Cranston, Featured Listings, Legacy, McKenzie Towne, New Brighton

### Missing Schema Types
The following schema types should be implemented:

| Schema Type | Where | Priority |
|-------------|-------|----------|
| `RealEstateAgent` | Homepage, About page | Critical |
| `LocalBusiness` | All pages (in site-wide JSON-LD) | Critical |
| `WebSite` + `SearchAction` | Homepage | High |
| `BreadcrumbList` | All pages | High |
| `FAQPage` | Buyer/seller guides, community pages | Medium |
| `Article` / `BlogPosting` | Blog posts | Medium |
| `RealEstateListing` | Featured listings, community pages | Medium |
| `WebPage` | All content pages | Low |

---

## 7. Canonical Tag Analysis

### Overview
- **33 of 36 pages have self-referencing canonical tags** (good)
- **3 pages missing canonical tags:**
  1. `/property-search/site-map/` -- MLS listing directory
  2. `/property-search/property-tracker/` -- Account/login page
  3. `/contact/thank-you/` -- Broken 403 page

### Canonical Observations
- All canonical URLs correctly use `https://www.sellingcalgarycastles.com/` (www subdomain with trailing slash)
- No HTTP-header canonicals detected (Link header)
- No canonical conflicts or mismatches found
- The sitemap uses `https://www.sellingcalgarycastles.com/` consistently (good)

---

## 8. Technical Issues Found

### Critical Issues

1. **Broken page: `/contact/thank-you/`** -- Returns 403 Forbidden with IIS error page. Title is "403 - Forbidden: Access is denied." No meta tags, no viewport, no content. This page is in the sitemap and should be fixed or removed.

2. **Missing HSTS header** -- All 36 pages lack `Strict-Transport-Security` header. Site runs through Cloudflare but HSTS is not enabled.

3. **No structured data (schema)** for core business identity -- No `RealEstateAgent`, `LocalBusiness`, or `WebSite` schema on any page.

### High-Priority Issues

4. **OG tags missing on 89% of pages** -- Only blog posts have Open Graph meta. Social sharing of community pages, buyer/seller guides, and homepage will show poor previews.

5. **6 title tags too short** -- Generic titles like "Selling a Home" waste keyword opportunities and look thin in SERPs.

6. **4 blog meta descriptions exceeding 500+ characters** -- Auto-generated from content; will be heavily truncated in search results.

7. **11 meta descriptions under 70 characters** -- Thin descriptions that fail to differentiate pages in SERPs.

### Medium-Priority Issues

8. **Homepage has 2 H1 tags** -- Confuses heading hierarchy and dilutes primary keyword signal.

9. **Missing viewport meta on `/contact/thank-you/`** -- This is the broken 403 page, but if fixed it needs viewport meta for mobile usability.

10. **20 images missing alt text on Financial Terms Glossary** -- Accessibility and image SEO issue.

11. **3 images missing alt text on homepage** -- Homepage images should have descriptive alt text.

12. **Blog index (`/blog/`) not in sitemap** -- Receives 78 contextual inbound links but is not submitted to search engines via sitemap.

### Low-Priority Issues

13. **No `Content-Security-Policy` header** -- Security best practice.
14. **No `Permissions-Policy` header** -- Security best practice.
15. **`Referrer-Policy` set to `no-referrer-when-downgrade`** -- Consider switching to `strict-origin-when-cross-origin` for better privacy.
16. **Server identifies as Cloudflare** -- Not an issue, but server header could be minimized.

### Security Headers Present (Positive)

| Header | Value | Status |
|--------|-------|--------|
| X-Content-Type-Options | nosniff | Good |
| X-Frame-Options | SAMEORIGIN | Good |
| Referrer-Policy | no-referrer-when-downgrade | Acceptable |
| Cache-Control | public, max-age=2678400 (~31 days) | Good |

---

## 9. Content Quality Assessment

### Word Count Distribution

| Page Type | Avg Word Count | Range | Assessment |
|-----------|---------------|-------|------------|
| Community pages (10) | ~2,975 | 2,943 - 3,018 | Good depth |
| Blog posts (4) | ~2,484 | 2,355 - 2,638 | Adequate |
| Buyer guides (8) | ~2,822 | 2,147 - 6,711 | Variable; glossary is strong |
| Seller guides (6) | ~2,439 | 2,180 - 2,993 | Adequate |
| Homepage | 2,379 | -- | Good |

### Content Gaps
- **Only 4 blog posts** -- All focus on mortgages/buying; none about Calgary neighborhoods, market trends, or selling tips specific to Calgary
- **No service-specific landing pages** -- Missing pages for "Calgary luxury homes," "Calgary condos," "Calgary investment properties," etc.
- **No market report or statistics pages** -- Major missed opportunity for local SEO
- **Community pages are templated** -- Similar structure and word count suggests boilerplate content with minimal unique local detail

---

## 10. Robots.txt Analysis

### Key Findings
- **Cloudflare Managed robots.txt** with Content-Signal directives
- `User-agent: * / Allow: /` -- All pages accessible to standard crawlers
- **AI bots explicitly blocked:** ClaudeBot, GPTBot, Bytespider, CCBot, Google-Extended, meta-externalagent, Applebot-Extended, Amazonbot
- **No Disallow rules for standard search bots** -- Good
- **No sitemap directive** in robots.txt -- Should include `Sitemap: https://www.sellingcalgarycastles.com/sitemap.xml`

---

## 11. Prioritized Recommendations (Top 20)

### Critical Priority (Immediate)

1. **Fix broken `/contact/thank-you/` page** -- Currently returns 403 error. Either fix the page or remove it from the sitemap and implement a proper redirect.

2. **Add `RealEstateAgent` + `LocalBusiness` schema markup** to all pages -- This is essential for Google's real estate knowledge panels and local search visibility.

3. **Enable HSTS header via Cloudflare** -- Simple toggle in Cloudflare dashboard; protects all users and is a minor ranking signal.

4. **Add Open Graph tags to all 32 non-blog pages** -- Include `og:title`, `og:description`, `og:image`, `og:url`, and `og:type` on every page.

5. **Rewrite all 6 too-short title tags** -- Include Calgary geographic targeting and agent branding. Example: "Selling a Home" should become "Sell Your Calgary Home | Neil Rowlandson, REALTOR".

### High Priority (Within 2 Weeks)

6. **Rewrite 11 thin meta descriptions** -- Every meta description should be 120-155 characters, include a CTA and geographic/brand keywords.

7. **Truncate 4 blog meta descriptions** to under 160 characters -- Write compelling, concise descriptions that entice clicks.

8. **Add `BreadcrumbList` schema** to all pages -- Improves SERP display with breadcrumb rich results.

9. **Fix homepage dual H1** -- Consolidate to a single H1 like "Calgary Homes for Sale | Your Local Real Estate Expert".

10. **Add `Sitemap:` directive to robots.txt** -- Ensures all crawlers can discover the sitemap.

### Medium Priority (Within 1 Month)

11. **Add alt text to 23 images** missing it (3 on homepage, 20 on financial glossary page).

12. **Add `/blog/` index page to sitemap** -- It receives 78 inbound links but is not in the XML sitemap.

13. **Add canonical tags** to the 2 property-search pages missing them.

14. **Implement `FAQPage` schema** on buyer/seller guide pages -- These pages answer common questions and can generate FAQ rich results.

15. **Add `BlogPosting` schema** to all 4 blog posts with author, datePublished, and image metadata.

### Growth Priority (Ongoing Content Strategy)

16. **Create 4+ new blog posts per month** focusing on Calgary-specific topics -- Market updates, neighborhood spotlights, seasonal selling tips, investment guidance.

17. **Build service landing pages** for key search intents -- "Calgary Luxury Homes for Sale," "Calgary Condos," "Calgary New Construction," "SE Calgary Real Estate."

18. **Add cross-links between community pages** -- Each community page should link to 2-3 nearby communities. Currently they are isolated from each other.

19. **Add progressive internal links in buyer/seller guides** -- Create a logical flow: "First-Time Buyers" links to "Mortgage Pre-Approval" links to "Making an Offer" links to "Closing Costs."

20. **Create a quarterly Calgary market report page** -- Evergreen URL updated monthly with market statistics; excellent for earning backlinks and establishing authority.

---

## Appendix: Full Page Inventory

| # | URL | Title | Title Len | Desc Len | H1 Count | Schema | Canonical | OG Tags | Issues |
|---|-----|-------|-----------|----------|----------|--------|-----------|---------|--------|
| 1 | / | Calgary Real Estate - Homes for Sale in Calgary | 47 | 134 | 2 | No | Yes | No | MULTIPLE_H1, NO_SCHEMA, NO_OG_TAGS, MISSING_ALT_TEXT, MISSING_HSTS |
| 2 | /about/ | About Neil Rowlandson | 21 | 140 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 3 | /auburn-bay/ | Auburn Bay Homes for Sale | 50 | 135 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 4 | /bridlewood/ | Bridlewood Homes for Sale | 50 | 135 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 5 | /buyers/ | Information on Buying a Home | 28 | 28 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 6 | /buyers/financial-terms-glossary/ | Financial Terms Glossary | 24 | 79 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_ALT_TEXT, MISSING_HSTS |
| 7 | /buyers/first-time-buyers/ | First Time Buyers | 42 | 100 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 8 | /buyers/making-an-offer/ | Making an Offer | 15 | 43 | 1 | No | Yes | No | TITLE_TOO_SHORT, NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 9 | /buyers/mortgage-calculator/ | Mortgage Calculator | 48 | 127 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 10 | /buyers/mortgage-pre-approval/ | Get Pre-Approved | 48 | 37 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 11 | /buyers/personalized-home-search/ | Personalized Home Search | 24 | 75 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 12 | /buyers/what-are-closing-costs/ | What Are Closing Costs? | 23 | 95 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 13 | /chaparral/ | Chaparral Homes for Sale | 48 | 134 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 14 | /communities/ | Community Guide | 48 | 54 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 15 | /contact/ | Contact Neil Rowlandson | 23 | 56 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 16 | /contact/thank-you/ | 403 - Forbidden | 34 | 0 | 1 | No | No | No | MISSING_META_DESCRIPTION, THIN_CONTENT, NO_SCHEMA, NO_CANONICAL, NO_OG_TAGS, NO_CONTEXTUAL_INTERNAL_LINKS, MISSING_VIEWPORT, MISSING_HSTS |
| 17 | /cranston/ | Cranston Homes for Sale | 46 | 133 | 1 | Event | Yes | No | NO_OG_TAGS, MISSING_HSTS |
| 18 | /evergreen/ | Evergreen Homes for Sale | 48 | 134 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 19 | /featured-listings/ | Featured Listings | 17 | 52 | 1 | Event | Yes | No | TITLE_TOO_SHORT, NO_OG_TAGS, MISSING_HSTS |
| 20 | /legacy/ | Legacy Homes for Sale | 42 | 131 | 1 | Event | Yes | No | NO_OG_TAGS, MISSING_HSTS |
| 21 | /mahogany/ | Mahogany Homes for Sale | 46 | 133 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 22 | /mckenzie-towne/ | Mckenzie Towne Homes for Sale | 58 | 139 | 1 | Event | Yes | No | NO_OG_TAGS, MISSING_HSTS |
| 23 | /new-brighton/ | New Brighton Homes for Sale | 54 | 137 | 1 | Event | Yes | No | NO_OG_TAGS, MISSING_HSTS |
| 24 | /property-search/property-tracker/ | Account Home | 56 | 105 | 1 | No | No | No | NO_SCHEMA, NO_CANONICAL, NO_OG_TAGS, MISSING_HSTS |
| 25 | /property-search/site-map/ | Calgary MLS Listings | 20 | 99 | 1 | No | No | No | NO_SCHEMA, NO_CANONICAL, NO_OG_TAGS, MISSING_HSTS |
| 26 | /sellers/ | Selling a Home | 14 | 24 | 1 | No | Yes | No | TITLE_TOO_SHORT, NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 27 | /sellers/adding-value/ | Adding Value to Your Home | 25 | 88 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 28 | /sellers/free-market-analysis/ | What's Your Property Worth? | 58 | 46 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 29 | /sellers/marketing-your-home/ | Marketing Your Home | 19 | 28 | 1 | No | Yes | No | TITLE_TOO_SHORT, NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 30 | /sellers/pricing-your-home/ | Pricing Your Home | 17 | 58 | 1 | No | Yes | No | TITLE_TOO_SHORT, NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 31 | /sellers/showing-your-home/ | Showing Your Home | 17 | 49 | 1 | No | Yes | No | TITLE_TOO_SHORT, NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 32 | /walden/ | Walden Homes for Sale | 42 | 131 | 1 | No | Yes | No | NO_SCHEMA, NO_OG_TAGS, MISSING_HSTS |
| 33 | /blog/will-increasing-mortgage-rates-impact-home-prices/ | Will Increasing Mortgage Rates Impact Home Prices? | 50 | 305 | 1 | No | Yes | Yes | META_DESCRIPTION_TOO_LONG, NO_SCHEMA, MISSING_HSTS |
| 34 | /blog/common-things-to-look-out-for-before-buying-your-dream-home/ | Common Things to Look Out for Before Buying Your Dream Home | 59 | 316 | 1 | No | Yes | Yes | META_DESCRIPTION_TOO_LONG, NO_SCHEMA, MISSING_HSTS |
| 35 | /blog/why-you-should-consider-selling-in-the-winter/ | Why You Should Consider Selling in the Winter | 45 | 524 | 1 | No | Yes | Yes | META_DESCRIPTION_TOO_LONG, NO_SCHEMA, MISSING_HSTS |
| 36 | /blog/is-getting-a-home-mortgage-still-too-difficult/ | Is Getting a Home Mortgage Still Too Difficult? | 47 | 426 | 1 | No | Yes | Yes | META_DESCRIPTION_TOO_LONG, NO_SCHEMA, MISSING_HSTS |

---

## Issue Summary Counts

| Issue | Pages Affected | Severity |
|-------|---------------|----------|
| MISSING_HSTS | 36 (100%) | High |
| NO_OG_TAGS | 32 (89%) | High |
| NO_SCHEMA | 31 (86%) | Critical |
| TITLE_TOO_SHORT | 6 (17%) | High |
| META_DESCRIPTION_TOO_LONG | 4 (11%) | Medium |
| NO_CANONICAL | 3 (8%) | Medium |
| MISSING_ALT_TEXT | 2 (6%) | Medium |
| MULTIPLE_H1 | 1 (3%) | Medium |
| MISSING_META_DESCRIPTION | 1 (3%) | High (broken page) |
| THIN_CONTENT | 1 (3%) | High (broken page) |
| NO_CONTEXTUAL_INTERNAL_LINKS | 1 (3%) | Medium |
| MISSING_VIEWPORT | 1 (3%) | Medium (broken page) |

---

*Generated by automated crawl + analysis pipeline. Data sourced from crawl-data.json and link-graph.json.*
