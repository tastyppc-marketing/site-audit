# Site Structure & Technical SEO Audit: livingparkcityutah.com

**Audit Date:** March 1, 2026
**Site:** https://www.livingparkcityutah.com
**Platform:** Sierra Interactive (Real Estate CMS)
**Total Pages in Sitemap:** 62

---

## 1. Site Architecture Overview

The site follows a flat-to-shallow hierarchy typical of real estate agent websites built on Sierra Interactive. The URL structure is clean and uses a maximum depth of 2 levels.

### URL Structure Patterns

| Section | URL Pattern | Page Count |
|---------|-------------|------------|
| Homepage | `/` | 1 |
| Community Pages | `/community-name/` | 28 |
| Buyer Resources | `/buyers/sub-page/` | 10 |
| Seller Resources | `/sellers/sub-page/` | 6 |
| Property Search | `/property-search/sub-page/` | 4 |
| Blog | `/blog/post-slug/` | 5 |
| About | `/about/` | 1 |
| Contact | `/contact/` | 2 |
| Featured Listings | `/featured-listings/` | 1 |
| Communities Hub | `/communities/` | 1 |

### Site Architecture Map

```
Homepage (/)
|
|-- Property Search
|   |-- /property-search/results/
|   |-- /property-search/results/?searchtype=3 (Map Search)
|   |-- /property-search/site-map/
|   |-- /property-search/property-tracker/
|   |-- /featured-listings/
|
|-- Buyers (/buyers/)
|   |-- /buyers/mortgage-calculator/
|   |-- /buyers/mortgage-pre-approval/
|   |-- /buyers/first-time-buyers/
|   |-- /buyers/making-an-offer/
|   |-- /buyers/what-are-closing-costs/
|   |-- /buyers/escrow-now-what/
|   |-- /buyers/financial-terms-glossary/
|   |-- /buyers/personalized-home-search/
|   |-- /buyers/park-city-ski-in-ski-out-homes/
|
|-- Sellers (/sellers/)
|   |-- /sellers/free-market-analysis/
|   |-- /sellers/pricing-your-home/
|   |-- /sellers/marketing-your-home/
|   |-- /sellers/showing-your-home/
|   |-- /sellers/adding-value/
|
|-- Communities (/communities/)
|   |-- /aerie/
|   |-- /canyons-villagethe-colony/
|   |-- /deer-crest/
|   |-- /deer-mountain/
|   |-- /empire-pass/
|   |-- /extended-summit-county/
|   |-- /extended-wasatch-county/
|   |-- /glenwild/
|   |-- /heber/
|   |-- /hideout-canyon/
|   |-- /jeremy-ranch/
|   |-- /jordanelle/
|   |-- /kimball-junction/
|   |-- /lower-deer-valley-resort/
|   |-- /midway/
|   |-- /old-ranch-road/
|   |-- /old-town/
|   |-- /park-meadows/
|   |-- /pinebrooksummit-park/
|   |-- /promontory/
|   |-- /prospector/
|   |-- /red-ledges/
|   |-- /salt-lake-county/
|   |-- /silver-creek-estatessilver-creek-village/
|   |-- /silver-springs/
|   |-- /sun-peakbear-hollow/
|   |-- /sundance-provo-canyon/
|   |-- /thaynes-canyon/
|   |-- /trailside-park-area/
|   |-- /tuhaye/
|   |-- /upper-deer-valley-resort/
|
|-- Blog (/blog/)
|   |-- /blog/paying-for/
|   |-- /blog/will-increasing-mortgage-rates-impact-home-prices/
|   |-- /blog/common-things-to-look-out-for-before-buying-your-dream-home/
|   |-- /blog/why-you-should-consider-selling-in-the-winter/
|   |-- /blog/is-getting-a-home-mortgage-still-too-difficult/
|
|-- About (/about/)
|-- Contact (/contact/)
```

---

## 2. Navigation Structure

### Primary Navigation Menu
The site uses a standard top-level navigation with dropdown menus:

1. **Search** - Advanced Search, Search by Map, Property Tracker, Featured Listings
2. **Communities** - Links to community hub page
3. **Buyers** - 8 sub-pages (Mortgage Calculator, Pre-Approval, First Time Buyers, Making an Offer, Closing Costs, Escrow, Financial Glossary, Personalized Search)
4. **Sellers** - 5 sub-pages (Pricing, Marketing, Showing, Adding Value, Free Market Analysis)
5. **About**
6. **Blog**
7. **Contact**

### Footer Navigation
The footer contains:
- All 28 community page links under "Featured Communities"
- Quick links to Search, Buyers, Sellers sections
- Social media links (Facebook, Instagram, LinkedIn, YouTube, Zillow)
- Legal pages (Terms of Service, Privacy Policy, Accessibility, DMCA Notice, Sitemap)

### Navigation Assessment
- **Strength:** Consistent navigation across all pages (~33-35 internal links per page from nav/footer)
- **Issue:** Community pages are at root level (e.g., `/aerie/`) rather than nested under `/communities/aerie/`, which creates a flat URL structure that does not clearly communicate hierarchy to search engines
- **Issue:** The `/blog/` page is linked in nav but NOT included in the sitemap.xml
- **Issue:** The `/property-search/search-form/` page (Advanced Search) is linked in nav but NOT in the sitemap

---

## 3. Internal Linking Analysis

### Link Distribution
| Page Type | Avg Internal Links | Assessment |
|-----------|-------------------|------------|
| Homepage | 150 | Well-linked hub page |
| Community Pages | 33 | Standard (mostly navigation) |
| Buyer Sub-pages | 33-35 | Standard (mostly navigation) |
| Seller Sub-pages | 33-35 | Standard (mostly navigation) |
| Blog Posts | 156 | Good (includes related posts) |
| Featured Listings | 162 | Good (listing links + nav) |

### Internal Linking Issues

**Under-linked pages (rely only on navigation links):**
- Most buyer/seller resource pages have only navigation-based internal links (33 links) with no contextual cross-linking between related content
- Community pages do not link to each other or to relevant blog posts
- Blog posts rarely link to community pages or buyer/seller resources

**Missing cross-linking opportunities:**
- Blog posts about selling should link to seller resource pages and vice versa
- Community pages should cross-link to nearby communities
- Buyer resources should link to relevant community pages
- The ski-in/ski-out page should link to relevant community pages (Deer Valley, Empire Pass, Canyons Village, etc.)

**Pages linked in navigation but NOT in sitemap.xml:**
- `/blog/` (blog index)
- `/property-search/search-form/` (Advanced Search)
- `/terms-of-service/`
- `/privacy-policy/`
- `/accessibility/`
- `/dmca-notice/`
- `/site-map/`

---

## 4. Meta Data Audit

### Title Tags

| Issue | Pages Affected | Details |
|-------|---------------|---------|
| Generic titles missing location keywords | Multiple | Buyer/seller pages use generic titles like "Making an Offer", "Marketing Your Home" without "Park City" |
| Title too long (>60 chars) | Community pages | Some like "Silver Creek Estates/Silver Creek Village Homes for Sale - Silver Creek Estates/Silver Creek Village Real Estate" are excessively long |
| Blog post with stuffed title | `/blog/paying-for/` | Title contains 3 separate meta titles concatenated together (see below) |

**Critical Blog Title Issue:**
The blog post at `/blog/paying-for/` has a title tag containing what appears to be 3 separate meta titles jammed together:
> "Meta Title: Park City Luxury Homes for Sale | Tisha Digman & Cam Schiedel Sell Your Park City Home Fast: Expert Tips and Market Insights Luxury Real Estate Park City: Expert Agents, Stunning Homes"

This is a significant SEO problem. The actual page content is about home repairs before selling.

### Meta Descriptions

| Status | Count | Pages |
|--------|-------|-------|
| Has meta description | 60 | Most pages |
| Missing meta description | 2 | `/contact/thank-you/` (403 error), homepage duplicate search results |
| Generic/template descriptions | ~15 | Buyer/seller sub-pages use very short, generic descriptions |

**Weak Meta Descriptions (too short/generic):**
- "Guide to selling a home." (sellers page)
- "Your guide to buying a home." (buyers page)
- "Tips on making an offer when buying a home." (making an offer)
- "Tips on marketing your home." (marketing your home)
- "Tips on showing your home to a prospective buyer." (showing your home)
- "Get pre-approved for a home mortgage." (mortgage pre-approval)

**Blog meta description stuffing:**
The `/blog/paying-for/` page has 3 different meta descriptions concatenated into one giant meta description, mirroring the title issue.

### Community Page Meta Descriptions
All 28 community pages use an identical template: "Search homes & real estate for sale in [Community Name]. Listings include large photos, local school info, tours, maps, street view and more." These are acceptable but not optimized for local SEO. They should mention Park City, Utah, and include unique selling points per community.

---

## 5. Heading Tag Audit (H1s)

### H1 Tag Issues

| Issue | Pages Affected |
|-------|---------------|
| Multiple H1 tags | Homepage (3 H1s: "REAL / HONEST / RESULTS", "REAL/HONEST/RESULTS", "Park City Utah Real Estate") |
| Missing H1 | `/property-search/results/` |
| Missing H1 | `/property-search/results/?searchtype=3` |
| Missing H1 | `/buyers/park-city-ski-in-ski-out-homes/` |

### H1 Assessment by Section

**Community Pages:** All 28 community pages have proper, unique H1 tags following the pattern "[Community Name] Homes & Real Estate" -- good.

**Buyer Pages:** All have H1s except the ski-in/ski-out page.

**Seller Pages:** All have appropriate H1s.

**Blog Posts:** All have appropriate H1s matching the article title.

**Property Search Pages:** Two key search pages are missing H1 tags entirely.

---

## 6. Image Alt Text Audit

### Overall Statistics

| Metric | Value |
|--------|-------|
| Total images across site | ~800+ |
| Images missing alt text | Estimated 60-70% |

### Per-Page Breakdown

| Page Type | Typical Images | Missing Alt |
|-----------|---------------|-------------|
| Homepage | 35 | 27 (77%) |
| Property Search Results | 560 | 545 (97%) |
| Community Pages (with listings) | 18 | 3 (17%) |
| Community Pages (fewer listings) | 8-12 | 2-4 |
| Buyer/Seller Pages | 5 | 2 (40%) |
| Financial Terms Glossary | 25 | 22 (88%) |
| Blog Posts | 5 | 2 (40%) |

### Key Alt Text Issues
- **Property search results pages** have the worst alt text coverage -- nearly all listing thumbnail images lack alt text (545 of 560 images)
- **Homepage** has 27 of 35 images without alt text, including hero images, background images, and section decorative images
- **Financial Terms Glossary** page has 22 of 25 images without alt text (appears to be alphabet letter navigation images)
- Every page has at least 2-3 images missing alt text (appears to be template/structural images consistent across the site)

---

## 7. Schema / Structured Data

### Schema Presence

| Has Schema | Pages |
|------------|-------|
| YES | Aerie, Deer Crest, Deer Mountain, Empire Pass, Extended Summit County, Extended Wasatch County, Heber, Jordanelle, Lower Deer Valley Resort, Trailside Park Area, Tuhaye, Upper Deer Valley Resort |
| NO | All other pages (50 of 62) |

### Schema Type Used
The only schema type found is **Event** schema for Open House events. This is automatically generated by the Sierra Interactive platform when a listing in that community has an upcoming open house.

### Missing Schema Opportunities

| Schema Type | Where to Implement | Priority |
|-------------|-------------------|----------|
| RealEstateAgent | Homepage, About page | HIGH |
| LocalBusiness | Homepage, Contact page | HIGH |
| BreadcrumbList | All pages | MEDIUM |
| FAQPage | Buyer resource pages | MEDIUM |
| BlogPosting | Blog posts | MEDIUM |
| WebSite (with SearchAction) | Homepage | MEDIUM |
| Review/AggregateRating | Homepage (Google Reviews section) | HIGH |

---

## 8. Canonical Tag Implementation

### Status

| Status | Count | Pages |
|--------|-------|-------|
| Proper canonical | 56 | Most pages self-reference correctly |
| Missing canonical | 5 | Property search pages (all 4), contact/thank-you (403 error) |
| Self-referencing | Yes | All canonicals that exist are self-referencing (correct) |

### Issues
- **All 4 property search pages lack canonical tags.** This is a problem because `/property-search/results/` and `/property-search/results/?searchtype=3` could be seen as duplicate content.
- Canonical tags use the full URL with trailing slash -- consistent and correct.

---

## 9. Open Graph / Social Meta Tags

### Homepage
- `og:image` is set (hero image)
- `og:title` is **missing**
- `og:description` is **missing**
- `og:url` is **missing**
- No Twitter Card meta tags on any page

### Community Pages (with OG tags)
Some community pages (like Old Town, Promontory) have full OG tag sets including `og:title`, `og:url`, `og:image`, `og:description`. Others lack OG tags entirely. This is inconsistent.

### Blog Posts
Blog posts have `og:title`, `og:description`, and `og:image` -- good coverage.

### Buyer/Seller/Contact Pages
These pages only have `og:image` but are missing `og:title`, `og:description`, and `og:url`.

---

## 10. Robots.txt Analysis

### Configuration
```
Sitemap: https://www.livingparkcityutah.com/sitemap.xml
Crawl-delay: 5 (for all bots)
Crawl-delay: 85 (for AhrefsBot, AhrefsSiteAudit, SemrushBot)

Blocked bots: Amazonbot, PetalBot, Barkrowler (complete disallow)

Disallowed paths:
- /res/includes/ (except .js and .css)
- /sist/
- /property-search/sist_ajax/
- /property-search/market-update/
- /idx/market-update/
- /search/market-update/
```

### Assessment
- Sitemap is declared -- good
- Market update pages are blocked from crawling -- intentional (likely dynamic MLS data)
- Very high crawl delay (85 seconds) for Ahrefs and SEMrush may limit their ability to fully crawl the site
- Crawl delay of 5 seconds for all other bots is standard

---

## 11. Technical Issues Found

### Critical Issues

1. **Contact Thank You page returns 403 Forbidden error**
   - URL: `/contact/thank-you/`
   - Title shows "403 - Forbidden: Access is denied"
   - This is included in the sitemap, sending search engines to an error page

2. **Blog post with stuffed/corrupted meta tags** (`/blog/paying-for/`)
   - Title tag contains 3 concatenated titles
   - Meta description contains 3 concatenated descriptions
   - This looks like it was accidentally configured with multiple SEO titles/descriptions

3. **Homepage has 3 H1 tags**
   - "REAL / HONEST / RESULTS" and "REAL/HONEST/RESULTS" (duplicate with different formatting)
   - "Park City Utah Real Estate"
   - Should be consolidated to a single, keyword-rich H1

4. **No structured data (schema.org) on key pages**
   - Homepage, About, Contact pages have zero schema markup
   - No RealEstateAgent or LocalBusiness schema anywhere on the site

### High Priority Issues

5. **Property search results pages missing H1 tags and canonical tags**
   - These are high-traffic pages that need proper on-page SEO

6. **Massive image alt text problems**
   - Property search results: 545 of 560 images missing alt text
   - Homepage: 27 of 35 images missing alt
   - This is a significant accessibility and SEO issue

7. **Weak/generic meta descriptions on buyer and seller pages**
   - Descriptions like "Tips on making an offer" provide no competitive advantage
   - Should include Park City-specific language and value propositions

8. **Missing Open Graph tags on homepage**
   - `og:title` and `og:description` are absent -- critical for social sharing

9. **Community pages at root URL level instead of under /communities/**
   - `/aerie/` instead of `/communities/aerie/`
   - Reduces URL hierarchy clarity for search engines
   - Note: Changing this would require redirects and may not be worth the disruption

### Medium Priority Issues

10. **Only 5 blog posts** (all from February and July 2024)
    - Very thin blog content for a real estate site
    - No posts in 2025 or 2026 -- blog appears abandoned

11. **Pages in navigation but missing from sitemap.xml**
    - `/blog/`, `/property-search/search-form/`, `/terms-of-service/`, `/privacy-policy/`, `/accessibility/`, `/dmca-notice/`, `/site-map/`

12. **Template meta descriptions on community pages**
    - All 28 use identical template text with only the community name swapped
    - Should be unique descriptions highlighting each community's features

13. **No Twitter Card meta tags anywhere on the site**

14. **Slow homepage load** (timed out at 15 seconds with networkidle wait)
    - 887 DOM elements, 29 scripts, 5 iframes on homepage
    - Multiple embedded widgets may be slowing performance

15. **No hreflang tags** despite the site offering language selection (Chinese, French, Korean, Italian, Japanese, German, Portuguese, Russian, Spanish, Vietnamese)

### Low Priority Issues

16. **Inconsistent OG tag implementation** across community pages
17. **No BreadcrumbList schema** for improved SERP display
18. **External links to social profiles lack descriptive anchor text** (showing "no text")

---

## 12. Page Performance Metrics

### Homepage Technical Stats
| Metric | Value | Assessment |
|--------|-------|------------|
| DOM Elements | 887 | Moderate (could be lighter) |
| Scripts | 29 | High |
| Stylesheets | 4 | Good |
| Iframes | 5 | High (likely embeds/widgets) |
| Viewport meta | Set correctly | Good |
| Charset | UTF-8 | Good |
| Lang attribute | en | Good |
| Favicon | Present (3 sizes) | Good |

---

## 13. Content Volume by Section

| Section | Pages | Avg Word Count | Assessment |
|---------|-------|---------------|------------|
| Community Pages | 28 | ~3,000 | Good content depth |
| Buyer Resources | 10 | ~2,500 | Adequate |
| Seller Resources | 6 | ~2,400 | Adequate |
| Blog Posts | 5 | ~2,500 (est) | Very few posts |
| Property Search | 4 | ~2,100 | Mostly MLS content |
| Homepage | 1 | ~8,974 chars | Good |

---

## 14. Summary of Recommendations (Priority Order)

### Immediate Fixes
1. Fix or remove the `/contact/thank-you/` page from sitemap (returns 403)
2. Fix the corrupted meta tags on `/blog/paying-for/`
3. Consolidate homepage to a single H1 tag
4. Add H1 tags to property search results pages and ski-in/ski-out page
5. Add canonical tags to all property search pages

### Short-Term Improvements
6. Add RealEstateAgent + LocalBusiness schema to homepage and about page
7. Add AggregateRating schema for Google Reviews section on homepage
8. Rewrite meta descriptions for all buyer/seller pages to include "Park City" and unique value props
9. Add `og:title`, `og:description`, `og:url` to homepage
10. Fix image alt text site-wide, prioritizing homepage and community pages

### Medium-Term Strategy
11. Create unique meta descriptions for each community page highlighting specific features
12. Add BreadcrumbList schema across the site
13. Add BlogPosting schema to blog posts
14. Implement cross-linking between related content (blog to communities, buyer resources to communities, etc.)
15. Add missing pages to sitemap.xml (blog index, advanced search, legal pages)
16. Restart blog content production with locally-focused articles

### Long-Term Considerations
17. Consider adding FAQ schema to buyer resource pages
18. Implement hreflang tags if the multilingual feature is actively used
19. Audit and reduce homepage script/iframe count for performance
20. Add Twitter Card meta tags across the site
