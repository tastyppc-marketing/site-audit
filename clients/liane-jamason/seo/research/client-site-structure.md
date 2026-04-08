# Client Site Structure Audit — lianejamason.com

**Audit Date:** 2026-04-08
**Site:** https://www.lianejamason.com/
**Platform:** WordPress (Genesis Framework / AgentPress theme)
**SEO Plugin:** Rank Math
**IDX Provider:** iHomefinder (idx.lianejamason.com)

---

## 1. Sitemap Overview

### Sitemap Index Structure
The site uses a Rank Math-generated sitemap index at `https://www.lianejamason.com/sitemap_index.xml` containing **13 child sitemaps**:

| Sitemap | Type | Approx. URLs | Notes |
|---------|------|-------------|-------|
| `post-sitemap.xml` | Blog posts | ~169 | Core content — articles from 2016–2026 |
| `page-sitemap.xml` | Static pages | ~192 | Neighborhood, condo, service, and area pages |
| `attachment-sitemap1–7.xml` | Attachments | Many hundreds | **Issue: attachment pages indexed** |
| `idx-wrapper-sitemap.xml` | IDX wrapper | 1 | Property search page |
| `idx_page-sitemap.xml` | IDX pages | 404 error | **Broken sitemap** |
| `listing-sitemap.xml` | Past listings | ~27 | Old sold/active listing pages |
| `local-sitemap.xml` | KML | 1 | Points to locations.kml file |

### Total Indexed Content Pages
- **Blog posts:** ~169 URLs
- **Static/area pages:** ~192 URLs
- **Listing pages:** ~27 URLs
- **Total content pages:** ~388
- **Attachment pages:** Hundreds (should be noindexed or removed from sitemap)

### URL Category Breakdown (Page Sitemap)

| Category | Count | Example Path |
|----------|-------|-------------|
| Neighborhood/area pages | ~80+ | `/st-petersburg/shore-acres/`, `/clearwater/belleair/` |
| Condo building pages | ~30+ | `/st-petersburg/st-petersburg-condos/one-st-petersburg/` |
| Service pages | ~10 | `/sell/`, `/buy-a-home-with-liane-jamason/`, `/contact/` |
| Search/IDX wrapper pages | ~15 | `/search-luxury/`, `/search-waterfront/`, `/search-foreclosures/` |
| New construction area pages | ~8 | `/new-construction-homes/`, `/wesley-chapel-new-construction-homes/` |
| Development project pages | ~15 | `/waldorf-astoria-residences-st-petersburg/`, `/saltaire/` |
| Off-topic pages | 2 | `/travel-draft/`, `/lianes-credit-card-points-and-miles-hacking-tips/` |
| Utility/legacy pages | ~10 | `/thank-you/`, `/thank-you-for-contacting-us/`, `/fcg-1/` |
| Job opening pages | 3 | `/work-with-jamason-realty-group/`, `/buyers-specialist-job-opening/` |

### Blog Post Categories
Articles are organized into ~25+ categories:
- Featured (most common)
- Buying, Selling, Condos
- Tampa Bay Area Statistics (market updates)
- Ask a Realtor
- Just Listed/Sold
- Real Estate News, Celebrity Real Estate
- St. Petersburg Restaurants, St. Pete News
- New Construction, Remodeling Trends
- Adventures in Real Estate, Videos

---

## 2. Navigation & Internal Linking Assessment

### Main Navigation Structure
The site uses a dual navigation system:
1. **Top bar:** Home | About | In the Press | Blog | Contact | Selling | Buying (with dropdowns for Waterfront, Luxury, Short Sales, Foreclosures) | St. Petersburg | Clearwater | Tampa | New Construction Homes | Market Analysis
2. **Mobile/secondary nav:** Buy | Sell | Clearwater | St. Petersburg | Tampa

### Internal Linking Observations
- **Homepage:** 91 internal links, 16 external links — reasonable for a content-heavy homepage
- **Sidebar widgets present on most pages:** Recent Posts, Blog Categories, Brand New Listings — good for internal linking
- **Neighborhood pages link to IDX search results** on the subdomain (idx.lianejamason.com) — these are effectively external links for SEO purposes
- **Footer links:** Consistent across all pages with service links and area links
- **Blog posts include "Related" posts** at the bottom with 3 related articles — good for topic clustering
- **No breadcrumb navigation visible** despite Rank Math supporting it — missed opportunity
- **Many older blog posts (2016–2018) may have broken internal links** to properties/projects no longer active

### Issues
- IDX search pages on subdomain (idx.lianejamason.com) break the internal link equity flow
- No breadcrumbs implemented
- Blog pagination goes to 94 pages — crawl depth issue for older posts
- Some navigation items lead to IDX wrapper pages with thin content

---

## 3. Page-by-Page Meta Tag Audit

### Core Pages

| Page | Title (chars) | Meta Description (chars) | Issues |
|------|---------------|-------------------------|--------|
| Homepage | "Home - Liane Jamason - Corcoran Dwellings" (43) | **MISSING** | No meta description; title is generic ("Home") — should target primary keywords |
| About | "About - Liane Jamason - Corcoran Dwellings" (44) | "Meet Liane Jamason – Broker/Owner & Top St. Petersburg Realtor" (62) | Title generic; description too short |
| Contact | "Contact - Liane Jamason - Corcoran Dwellings" (46) | "Phone: 727-755-3325" (20) | Description is just a phone number — should describe services/CTA |
| Sell | "Sell - Liane Jamason - Corcoran Dwellings" (42) | Not detected (page timeout/heavy IDX) | Title generic; page times out on load (performance issue) |
| Buy | "Buy A Home With Jamason Group - Liane Jamason - Corcoran Dwellings" (66) | "1. We will save you money. From the start, an experienced agent knows how to price a home correctly..." (155) | Title references old brand name "Jamason Group" instead of Corcoran Dwellings |
| Blog | "Blog - Liane Jamason - Corcoran Dwellings" (43) | **MISSING** | Generic title; no description |
| Reviews | "Reviews - Liane Jamason - Corcoran Dwellings" (46) | **MISSING** | No description — huge missed opportunity for social proof in SERPs |
| My Active Listings | "My Active Listings - Liane Jamason - Corcoran Dwellings" (55) | "View My Sold Listings" (21) | Description references the wrong page |

### Neighborhood/Area Pages

| Page | Title (chars) | Meta Description (chars) | Issues |
|------|---------------|-------------------------|--------|
| St. Petersburg | "St Petersburg Real Estate" (26) | **MISSING** | Very short title, no branding, no description |
| Shore Acres | "Shore Acres - Liane Jamason - Corcoran Dwellings" (50) | "The beautiful community of Shore Acres in St. Petersburg, Florida is a peninsular..." (155) | Good description; title could include "Homes for Sale" |

### Blog Posts (Recent)

| Page | Title (chars) | Meta Description (chars) | Issues |
|------|---------------|-------------------------|--------|
| Market Update 2026 | "Pinellas vs Hillsborough Real Estate Market Update \| St Petersburg FL real estate market update 2026" (100) | "Get the latest insights on home prices and inventory..." (130) | Title exceeds 60-char recommendation; good description |
| Best Neighborhoods | "Liane Jamason - Best Neighborhoods in St. Petersburg FL for Buyers" (67) | "Discover the best neighborhoods in St. Petersburg FL for buyers in 2026..." (155) | Title starts with brand name instead of keywords; description has keyword stuffing at the end |
| Waldorf Astoria | "Waldorf Astoria Residences St. Petersburg \| Luxury Condos Downtown" (67) | "Waldorf Astoria Residences in St. Petersburg, FL — ultra-luxury condos..." (100) | Good title and description |

### Off-Topic Pages

| Page | Title (chars) | Meta Description (chars) | Issues |
|------|---------------|-------------------------|--------|
| Travel Draft | "Travel Draft - Liane Jamason - Corcoran Dwellings" (50) | "Travel Hacking Guide" (21) | **Completely off-topic** — travel/credit card content on a real estate site dilutes topical authority |
| Credit Card Points | "Liane's Credit Card Points and Miles Hacking Tips..." (52) | "Unlock the secrets to maximizing your rewards..." (100) | **Off-topic** — should be noindexed or removed |

---

## 4. H1 Tag Audit

| Page | H1 Count | H1 Content | Issue |
|------|----------|-----------|-------|
| Homepage | 1 | "Sell Your Tampa Bay Home with Liane Jamason" | OK — seller-focused only; consider testing broader keyword |
| About | 1 | "About" | **CRITICAL:** Generic H1 — should be "About Liane Jamason \| St. Petersburg Luxury Realtor" or similar |
| Contact | **2** | "Contact" + "Address:" | **Duplicate H1s** — "Address:" should not be H1 |
| Buy | 1 | "Buy A Home With Jamason Group" | **Wrong brand name** — references "Jamason Group" not Corcoran Dwellings |
| Blog | **0** | None | **Missing H1** — blog index page has no H1 tag |
| Reviews | 1 | "Reviews" | Generic — should be "Client Reviews \| Liane Jamason Real Estate" |
| My Active Listings | 1 | "My Active Listings" | Generic |
| St. Petersburg | **2** | "Property Search" + "St. Petersburg, Florida Homes for Sale" | **Duplicate H1s** — "Property Search" is IDX widget H1 conflict |
| Shore Acres | 1 | "Shore Acres" | OK but could include "Homes for Sale" |
| Market Update Blog | **9** | Multiple section headers all tagged as H1 | **CRITICAL:** 9 H1 tags on one page — subheaders should be H2/H3 |
| Best Neighborhoods Blog | **2** | Two variations of same question | **Duplicate H1s** — likely intro + body repeat |
| Waldorf Astoria | 1 | "Waldorf Astoria Residences St. Petersburg" | Good |
| Sell | 1 | "Sell" | **CRITICAL:** Single word H1 — should be keyword-rich |

### H1 Issues Summary
- **3 pages with multiple H1 tags** (Contact: 2, St. Pete: 2, Market Update: 9, Best Neighborhoods: 2)
- **1 page missing H1** (Blog index)
- **5+ pages with generic single-word H1s** (About, Contact, Sell, Reviews, My Active Listings)
- **1 page with outdated branding** (Buy page — "Jamason Group")

---

## 5. Image Alt Text Analysis

| Page | Total Images | Missing Alt | % Missing | Notes |
|------|-------------|------------|-----------|-------|
| Homepage | 13 | 7 | 54% | Missing on hero image, tracking pixels, logo, corcoran branding |
| About | 12 | 10 | 83% | Main headshot missing alt, all press logos missing alt |
| Best Neighborhoods | 17 | 14 | 82% | Neighborhood photos, screenshot images all missing alt |

### Overall Assessment
- **Average alt text missing rate: ~70-83%** across analyzed pages
- Tracking pixel images (AdRoll, wp.com) account for some missing alts but are expected
- **Key content images consistently missing alt text:**
  - Hero/banner images
  - Property photos
  - Press logo images (Bay News 9, Tampa Bay Times, Huffington Post)
  - Blog post featured images
  - Corcoran Dwellings logo
- Images that DO have alt text tend to have decent descriptive text
- The OG image alt tags are mostly generic (e.g., "Home", "About", "best neighborhoods in St. Petersburg FL for buyers")

---

## 6. Schema Markup Inventory

### Global Schema (present on all pages via Rank Math)
- `Organization` (type: RealEstateAgent) — includes name, address, phone, email, logo, opening hours, description
- `Place` — office address
- `WebSite` — with SearchAction for site search
- `WebPage` — page-specific with datePublished/dateModified
- `Person` — author data (two authors: "varick" for older content, "Liane Jamason" for newer)

### Page-Specific Schema
| Page Type | Schema Type | Notes |
|-----------|------------|-------|
| Homepage | Article | Should be WebPage, not Article |
| About | Article | Should be AboutPage or ProfilePage |
| Blog posts | BlogPosting | Correct implementation |
| Static pages | Article | Should be WebPage |
| Neighborhood pages | Article | Should be RealEstateListing or WebPage |

### Schema Issues
1. **Homepage uses Article schema** — should use WebPage since it's not an article
2. **About page uses Article** — should use AboutPage or ProfilePage
3. **No FAQPage schema** on pages with FAQ sections (Market Update, Best Neighborhoods)
4. **No Review/AggregateRating schema** on the Reviews page — huge missed opportunity for star ratings in SERPs
5. **No LocalBusiness schema with reviews** — would enable review stars in local search
6. **Author "varick" exposed** on older content — looks like a developer name, not a real estate professional
7. **No BreadcrumbList schema** implemented
8. **No RealEstateListing schema** on listing pages

---

## 7. Canonical Tag Analysis

| Page | Canonical Present | Canonical URL | Issue |
|------|------------------|---------------|-------|
| Homepage | Yes | `https://www.lianejamason.com/` | Correct |
| About | Yes | `https://www.lianejamason.com/about-tampa-real-estate-liane-jamason/` | Correct |
| Contact | Yes | `https://www.lianejamason.com/contact/` | Correct |
| Buy | Yes | `https://www.lianejamason.com/buy-a-home-with-liane-jamason/` | Correct |
| Blog | Yes | `https://www.lianejamason.com/blog/` | Correct |
| Reviews | Yes | `https://www.lianejamason.com/reviews/` | Correct |
| Shore Acres | Yes | `https://www.lianejamason.com/st-petersburg/shore-acres/` | Correct |
| Market Update | Yes | Self-referencing | Correct |
| Best Neighborhoods | Yes | Self-referencing | Correct |
| Waldorf Astoria | Yes | Self-referencing | Correct |
| My Active Listings | Yes | Self-referencing | Correct |
| St. Petersburg | **Not detected** | — | **Missing canonical** on main St. Pete IDX page |

### Assessment
Canonical tags are well-implemented across most of the site (Rank Math handles this automatically). The St. Petersburg community page may have a canonical issue due to IDX widget interference. No conflicting or cross-domain canonical issues detected.

---

## 8. Open Graph / Social Meta Analysis

| Page | og:title | og:description | og:image | twitter:card | Issues |
|------|----------|---------------|----------|-------------|--------|
| Homepage | Yes | **Missing** | Generic logo (512x512) | summary_large_image | No description; image is small logo, not hero |
| About | Yes | Yes | Professional headshot (1500x1500) | summary_large_image | Good |
| Contact | Yes | "Phone: 727-755-3325" | Professional headshot | summary_large_image | Description is just phone number |
| Blog | Yes | Yes (first post excerpt) | Generic logo | summary_large_image | Logo instead of featured image |
| Reviews | Yes | **Missing** | Generic logo | summary_large_image | No description; logo image |
| Shore Acres | Yes | Yes | Neighborhood photo | summary_large_image | Good |
| Market Update | Yes | Yes | Property photo | summary_large_image | Good |
| Best Neighborhoods | Yes | Yes | Screenshot image | summary_large_image | Good; og:image:alt includes target keyword |
| Waldorf Astoria | Yes | Yes | Building rendering | summary_large_image | Good |
| My Active Listings | Yes | "View My Sold Listings" | Generic logo | summary_large_image | Description references wrong page |

### Issues
1. **Missing og:description** on Homepage, Reviews — sharing these pages on social media shows no preview text
2. **Generic logo used as og:image** on Homepage, Blog, Reviews, Active Listings — should use professional photos or hero images
3. **No twitter:description** on Homepage
4. **Contact page og:description** is just a phone number
5. **Active Listings og:description** points users to the wrong page
6. **No og:video** tags on any pages despite having YouTube content

---

## 9. Robots.txt Review

```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Crawl-delay: 10

Sitemap: https://www.lianejamason.com/sitemap_index.xml
```

### Assessment
- **Basic but functional** — blocks wp-admin while allowing AJAX
- **Crawl-delay: 10** is unnecessarily high for Google (Google ignores this directive, but Bing respects it) — 10-second delay means Bing crawls very slowly
- **No disallow for:**
  - `/wp-content/uploads/` attachment pages (these are being indexed via attachment sitemaps)
  - `/author/varick/` and `/author/lianemj/` author archive pages
  - `/tag/` pages (if thin)
  - Thank-you pages (`/thank-you/`, `/thank-you-for-contacting-us/`)
  - Job posting pages (if outdated)
  - Off-topic travel/credit card pages
- **Missing:** No rules for specific bot management (e.g., AI crawlers like GPTBot, CCBot)

---

## 10. Additional Technical Findings

### Performance Concerns
- **Sell page fails to load** within 30 seconds (Playwright timeout) — likely heavy IDX widget blocking networkidle
- **Homepage loads 36 scripts and 11 stylesheets** — significant script bloat
- **About page loads 61 scripts and 17 stylesheets** — even worse
- **Blog post pages load 63 scripts, 17 stylesheets, and 5 iframes** — heavy resource load
- **AdRoll retargeting pixels** present on all pages — adding 3+ tracking images per page

### Site Structure Issues
- **7 attachment sitemaps** indexed — WordPress media attachment pages create thin content
- **idx_page-sitemap.xml returns 404** — broken sitemap in the index
- **Travel/credit card pages** dilute topical authority for a real estate site
- **Old branding references** ("Jamason Group", "Jamason Realty Group", "Dwell Real Estate") scattered across older pages
- **Two different phone numbers** used across the site: 727-755-3325 (primary) and 727-240-3636 (on IDX pages) and 727-888-HOME (on about page)
- **Two different addresses**: "1405 Dr MLK Jr St N" vs "1405 9th St N" (Contact page) — likely the same location with different descriptions
- **Old job posting pages** still indexed (buyers specialist, executive assistant — from 2015)
- **Blog has 94 pages of pagination** — massive crawl depth for older content

### WordPress/Theme Details
- **CMS:** WordPress with Jetpack
- **Theme:** Custom "Liane Jamason Theme" on Genesis Framework
- **Language:** en-US
- **Charset:** UTF-8
- **Viewport:** Properly set (`width=device-width, initial-scale=1`)
- **Favicon:** Present (Corcoran logo in multiple sizes)

---

## 11. Twenty Prioritized Technical SEO Recommendations

| # | Recommendation | Effort | Impact | Priority |
|---|---------------|--------|--------|----------|
| 1 | **Write unique meta descriptions for Homepage, Blog, Reviews, and Contact pages** — these are the highest-traffic pages with no/poor descriptions. Homepage should target "St. Petersburg luxury real estate" keywords. | Low | High | Critical |
| 2 | **Fix H1 tag issues across the site** — remove duplicate H1s (Contact, St. Pete, Market Update blog), add H1 to Blog index, replace generic H1s (About, Sell, Reviews) with keyword-rich headings. Market Update post has 9 H1 tags that should be H2/H3. | Low | High | Critical |
| 3 | **Remove attachment sitemaps (1–7) from sitemap index** — in Rank Math settings, disable attachment page indexing. These create hundreds of thin content pages. | Low | High | Critical |
| 4 | **Add FAQ schema** to blog posts with FAQ sections (Market Update, Best Neighborhoods, Flood Zones) to earn rich results in SERPs. | Low | High | High |
| 5 | **Add AggregateRating/Review schema to Reviews page** — with 90+ reviews visible, this is a major opportunity for star ratings in search results. | Medium | High | High |
| 6 | **Fix homepage title tag** — change from "Home - Liane Jamason - Corcoran Dwellings" to something like "St. Petersburg Luxury & Waterfront Real Estate \| Liane Jamason - Corcoran Dwellings". | Low | High | High |
| 7 | **Update og:image on Homepage, Blog, Reviews, Active Listings** from generic 512x512 logo to professional hero images (1200x630 recommended). | Low | Medium | High |
| 8 | **Noindex or remove off-topic pages** — `/travel-draft/` and `/lianes-credit-card-points-and-miles-hacking-tips/` dilute topical authority. Either noindex them or move to a personal blog. | Low | Medium | High |
| 9 | **Fix the broken idx_page-sitemap.xml** (returns 404) — either generate the sitemap or remove the reference from the sitemap index. | Low | Medium | High |
| 10 | **Update old branding references** — the Buy page still says "Jamason Group" and "Jamason Realty Group". Update all references to current "Corcoran Dwellings" branding. | Low | Medium | Medium |
| 11 | **Add alt text to all content images** — currently 70-83% of images across key pages are missing alt text. Focus on hero images, headshot photos, press logos, and blog featured images. | Medium | Medium | Medium |
| 12 | **Implement breadcrumb navigation** — Rank Math supports this. Breadcrumbs improve both UX and provide BreadcrumbList schema for rich results. Especially valuable for deeply nested pages like `/st-petersburg/st-petersburg-condos/one-st-petersburg/`. | Medium | Medium | Medium |
| 13 | **Consolidate phone numbers** — use one consistent phone number across all pages. Currently showing 727-755-3325, 727-240-3636, and 727-888-HOME. NAP consistency matters for local SEO. | Low | Medium | Medium |
| 14 | **Fix the St. Petersburg area page** — has competing H1 from IDX widget ("Property Search") overriding the content H1, missing canonical tag, and title lacks branding. This is a high-value landing page. | Medium | Medium | Medium |
| 15 | **Reduce script/stylesheet bloat** — pages load 36-63 scripts and 11-17 stylesheets. Audit for unused plugins, defer non-critical scripts, and combine/minify assets. | High | Medium | Medium |
| 16 | **Fix Sell page load performance** — page fails to load within 30 seconds. Likely caused by heavy IDX widget. Consider lazy-loading the IDX component or using server-side rendering. | High | High | Medium |
| 17 | **Noindex/remove outdated pages** — old job postings (2015), expired condo projects, "thank you" confirmation pages, and legacy search pages should be noindexed. | Low | Low | Medium |
| 18 | **Fix schema types** — Homepage and About page incorrectly use Article schema. Change to WebPage and AboutPage/ProfilePage respectively. Service pages should use WebPage. | Low | Low | Low |
| 19 | **Reduce blog pagination depth** — 94 pages of blog archives means older posts are 94 clicks from the homepage. Consider increasing posts-per-page, adding topic hub pages, or implementing load-more pagination. | Medium | Low | Low |
| 20 | **Add AI crawler rules to robots.txt** — add directives for GPTBot, CCBot, anthropic-ai, etc. Also reduce Crawl-delay from 10 to 2-5 seconds (or remove entirely). | Low | Low | Low |

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total sitemap URLs (content) | ~388 |
| Blog posts | ~169 |
| Static pages | ~192 |
| Listing pages | ~27 |
| Pages missing meta description | 5+ of core pages |
| Pages with H1 issues | 8+ pages audited |
| Image alt text missing rate | 70-83% |
| Schema types present | Organization, WebSite, WebPage, Article, BlogPosting, Person, Place |
| Schema types missing | FAQPage, Review, AggregateRating, BreadcrumbList, AboutPage |
| Canonical tags | Present on most pages (Rank Math auto-generated) |
| Broken sitemaps | 1 (idx_page-sitemap.xml → 404) |
| Off-topic indexed pages | 2 (travel/credit card content) |
| Average scripts per page | 36-63 |
| Average stylesheets per page | 11-17 |
