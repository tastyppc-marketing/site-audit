# Site Structure Analysis: sellingcalgarycastles.com

**Crawl Date:** March 31, 2026 (v2 Fresh Crawl)
**Agent:** Neil Rowlandson / Calgary Castles Team / CIR Realty
**Platform:** Sierra Interactive IDX on Cloudflare
**Domain:** https://www.sellingcalgarycastles.com

---

## 1. Sitemap Overview

**Sitemap URL:** https://www.sellingcalgarycastles.com/sitemap.xml
**Total URLs in sitemap:** 38
**Content pages analyzed:** 36
**IDX/filter pages skipped:** 2

### URL Categories

| Category | Total | Content | IDX/Filter |
|----------|-------|---------|------------|
| buyers | 8 | 8 | 0 |
| sellers | 6 | 6 | 0 |
| blog | 4 | 4 | 0 |
| property-search | 4 | 2 | 2 |
| contact | 2 | 2 | 0 |
| homepage | 1 | 1 | 0 |
| communities | 1 | 1 | 0 |
| about | 1 | 1 | 0 |
| featured-listings | 1 | 1 | 0 |
| Community pages (10) | 10 | 10 | 0 |

**Community pages:** Auburn Bay, Bridlewood, Chaparral, Cranston, Evergreen, Legacy, Mahogany, Mckenzie Towne, New Brighton, Walden

**Notable:** The sitemap is very small (38 URLs). No blog index page is in the sitemap. The /blog/ page exists but is not listed in sitemap.xml. Only 4 blog posts exist on the entire site.

---

## 2. Robots.txt Review

The robots.txt is Cloudflare-managed with additional custom rules:

- **User-agent: * -> Allow: /** (all pages crawlable)
- **Content-Signal: search=yes, ai-train=no** (modern content signal compliance)
- **Blocked bots:** Amazonbot, Applebot-Extended, Bytespider, CCBot, ClaudeBot, Google-Extended, GPTBot, meta-externalagent, PetalBot, Barkrowler
- **No Sitemap directive in robots.txt** -- ISSUE: should include `Sitemap: https://www.sellingcalgarycastles.com/sitemap.xml`
- **No disallow rules for standard crawlers** -- all pages are crawlable
- Googlebot and Bingbot are NOT blocked (correct)

---

## 3. Navigation and Internal Linking Assessment

### Primary Navigation Structure
The site uses a consistent mega-menu across all pages:
- **Search** (Advanced Search, Search by Map, Property Tracker)
- **Featured Listings**
- **Communities** (dropdown with 10 community pages)
- **Buyers** (7 sub-pages: Mortgage Calculator, Mortgage Pre-Approval, First Time Buyers, Making an Offer, What Are Closing Costs, Financial Terms Glossary, Personalized Home Search)
- **Sellers** (5 sub-pages: Pricing Your Home, Marketing Your Home, Showing Your Home, Adding Value, Free Market Analysis)
- **About**
- **Contact**
- **Blog** (in secondary nav only)

### Internal Link Counts (per page)
- Most pages: ~99-101 total internal links (~52-54 contextual)
- Homepage: 115 total (68 contextual) -- highest contextual linking
- Community pages with listings: ~127-131 total (80-84 contextual)
- Featured listings: 130 total (83 contextual)
- Financial terms glossary: 139 total (92 contextual) -- most contextual links

### Footer Links
Present on all pages: Search, Communities, Buyers, Sellers, About, Contact, Featured Listings, Newest Listings, Single Family Homes, Condos & Townhomes, New Construction, Accessibility, Terms of Service, Privacy Policy, DMCA Notice, Property Listings, Sitemap

### Issues
- **Duplicate sidebar/footer:** The "We're Here to Help" contact section appears 2-3 times on each page (duplicated in sidebar and slide-out panel)
- **Orphaned pages (2):** /property-search/site-map/ and /contact/thank-you/ receive zero contextual internal links from other analyzed pages
- **No cross-linking between buyer and seller content** (e.g., "Making an Offer" doesn't link to related seller pages)
- **Blog posts only link to other blog posts,** not to service pages
- **Community pages don't cross-link** to each other in body content
- **Social media links go through url.avanan.click redirects** for Instagram, YouTube, and LinkedIn (email security proxy -- bad for SEO link equity and user trust)

---

## 4. Page-by-Page Meta Tag Audit

### Title Tags

| Page | Title | Chars | Issues |
|------|-------|-------|--------|
| / | Calgary Real Estate - Homes for Sale in Calgary | 47 | MULTIPLE_H1 |
| /about/ | About Neil Rowlandson | 21 | OK |
| /buyers/ | Information on Buying a Home | 28 | Generic, no location |
| /buyers/first-time-buyers/ | First Time Buyers - Buying Your First Home | 42 | OK |
| /buyers/financial-terms-glossary/ | Financial Terms Glossary | 24 | Generic |
| /buyers/making-an-offer/ | Making an Offer | 15 | TOO SHORT |
| /buyers/mortgage-calculator/ | Mortgage Calculator - Estimate Mortgage Payments | 48 | OK |
| /buyers/mortgage-pre-approval/ | Get Pre-Approved for a Home Mortgage - Financing | 48 | OK |
| /buyers/personalized-home-search/ | Personalized Home Search | 24 | Generic |
| /buyers/what-are-closing-costs/ | What Are Closing Costs? | 23 | Generic |
| /sellers/ | Selling a Home | 14 | TOO SHORT, no location |
| /sellers/adding-value/ | Adding Value to Your Home | 25 | Generic |
| /sellers/free-market-analysis/ | What's Your Property Worth? - Find Out the Estimated Value | 58 | OK |
| /sellers/marketing-your-home/ | Marketing Your Home | 19 | TOO SHORT |
| /sellers/pricing-your-home/ | Pricing Your Home | 17 | TOO SHORT |
| /sellers/showing-your-home/ | Showing Your Home | 17 | TOO SHORT |
| /communities/ | Community Guide - Local Real Estate by Community | 48 | No location keyword |
| /auburn-bay/ | Auburn Bay Homes for Sale - Auburn Bay Real Estate | 50 | OK (template) |
| /bridlewood/ | Bridlewood Homes for Sale - Bridlewood Real Estate | 50 | OK (template) |
| /chaparral/ | Chaparral Homes for Sale - Chaparral Real Estate | 48 | OK (template) |
| /cranston/ | Cranston Homes for Sale - Cranston Real Estate | 46 | OK (template) |
| /evergreen/ | Evergreen Homes for Sale - Evergreen Real Estate | 48 | OK (template) |
| /legacy/ | Legacy Homes for Sale - Legacy Real Estate | 42 | OK (template) |
| /mahogany/ | Mahogany Homes for Sale - Mahogany Real Estate | 46 | OK (template) |
| /mckenzie-towne/ | Mckenzie Towne Homes for Sale - Mckenzie Towne Real Estate | 58 | OK (template) |
| /new-brighton/ | New Brighton Homes for Sale - New Brighton Real Estate | 54 | OK (template) |
| /walden/ | Walden Homes for Sale - Walden Real Estate | 42 | OK (template) |
| /featured-listings/ | Featured Listings | 17 | TOO SHORT |
| /contact/ | Contact Neil Rowlandson | 23 | OK |
| /contact/thank-you/ | 403 - Forbidden: Access is denied. | 34 | BROKEN PAGE (403 error) |
| /blog/will-increasing-mortgage-rates.../ | Will Increasing Mortgage Rates Impact Home Prices? | 50 | OK |
| /blog/common-things-to-look-out.../ | Common Things to Look Out for Before Buying Your Dream Home | 59 | OK |
| /blog/why-you-should-consider-selling.../ | Why You Should Consider Selling in the Winter | 45 | OK |
| /blog/is-getting-a-home-mortgage.../ | Is Getting a Home Mortgage Still Too Difficult? | 47 | OK |
| /property-search/site-map/ | Calgary MLS Listings | 20 | OK |
| /property-search/property-tracker/ | Account Home - Calgary AB Homes for Sale and Real Estate | 56 | OK |

**Summary:** 6 pages with titles under 20 chars (too short). Most titles lack "Calgary" location keyword. Community page titles are well-optimized with the "[Community] Homes for Sale - [Community] Real Estate" template.

### Meta Descriptions

| Page | Description | Chars | Issues |
|------|-------------|-------|--------|
| / | Search homes for sale in Calgary... | 134 | OK |
| /about/ | Neil Rowlandson represents the region's finest... | 140 | OK |
| /buyers/ | Your guide to buying a home. | 28 | TOO SHORT, too generic |
| /buyers/first-time-buyers/ | A guide to buying your first home... | 100 | OK |
| /buyers/financial-terms-glossary/ | An explanation of commonly used terms... | 79 | OK |
| /buyers/making-an-offer/ | Tips on making an offer when buying a home. | 43 | Short |
| /sellers/ | Guide to selling a home. | 24 | TOO SHORT, too generic |
| /sellers/marketing-your-home/ | Tips on marketing your home. | 28 | TOO SHORT |
| /sellers/free-market-analysis/ | Find out the estimated value of your property. | 46 | Short |
| /communities/ | A guide to homes for sale in our featured communities. | 54 | Short, no location |
| /featured-listings/ | Browse our featured listings, updated from the MLS. | 52 | Short |
| /contact/ | Contact Neil Rowlandson using the following information. | 56 | OK |
| /contact/thank-you/ | MISSING | 0 | MISSING (403 error page) |
| /blog/will-increasing-mortgage-rates.../ | There has been some discussion recently... | 305 | FAR TOO LONG |
| /blog/common-things-to-look-out.../ | It is easy to become overwhelmed... | 316 | FAR TOO LONG |
| /blog/why-you-should-consider-selling.../ | The season you sell your home... | 524 | FAR TOO LONG |
| /blog/is-getting-a-home-mortgage.../ | Potential homebuyers are always cautioned... | 426 | FAR TOO LONG |
| Community pages (10) | Template: "Search homes & real estate for sale in [Community]..." | 131-139 | OK |

**Summary:** All 4 blog posts have meta descriptions exceeding 160 chars (up to 524 chars). Several buyer/seller pages have very short, generic descriptions under 50 chars. No descriptions include calls to action.

---

## 5. H1 Tag Audit

| Page | H1 Tag | Issues |
|------|--------|--------|
| / | "Find Your Calgary Area Home" + "Calgary Real Estate" | MULTIPLE H1 (2) |
| /property-search/property-tracker/ | MISSING | NO H1 |
| /about/ | Neil Rowlandson | OK |
| /buyers/ | Buying a Home in Calgary | OK |
| /sellers/ | Selling a Home in Calgary | OK |
| /communities/ | Community Guide | Generic, no location |
| /contact/ | Contact Neil Rowlandson | OK |
| /contact/thank-you/ | Server Error | BROKEN PAGE |
| /featured-listings/ | Featured Listings | Generic |
| /blog/* | Matches title tag text | OK |
| Community pages | "[Community] Homes & Real Estate" | OK (template) |
| Buyer sub-pages | Matches page topic | OK |
| Seller sub-pages | Matches page topic | OK |

**Issues found:**
- Homepage has 2 H1 tags (should be 1)
- Property Tracker page missing H1 entirely
- /contact/thank-you/ returns a 403 error with "Server Error" as H1

---

## 6. Heading Structure Analysis

Most pages follow a very flat heading structure:
- **H1:** 1 per page (mostly correct)
- **H2:** 4-6 per page -- mostly generated by the sidebar/footer template ("We're Here to Help", "Have a Question or Want a Free Market Report?"), not by unique page content
- **H3:** 2 per page -- both are "Connect" (from the sidebar)
- **H4-H6:** Not used on most pages

**Blog posts are the exception** -- they use H2/H3 tags for content structure (e.g., "Bottom Line", "Post a Comment", "Related Posts")

**Community pages** have no content H2/H3 -- the body is just listing cards with no heading hierarchy for the community description.

**Key Issue:** The heading structure is template-driven, not content-driven. Most H2/H3 tags come from the sidebar/footer CTA sections, not from meaningful content headings.

---

## 7. Image Alt Text Analysis

**Total images across all 36 pages:** 339
**Images missing alt text:** 23 (6.8%)

| Page | Total Images | Missing Alt | Notes |
|------|-------------|-------------|-------|
| / (homepage) | 14 (tech check) / 11 (crawl) | 3-4 | Missing on: UserWay widget image, community background image, content background image |
| /buyers/financial-terms-glossary/ | 25 | 20 | Most missing -- likely ad/widget images |
| All other pages | 5-17 | 0 | Clean |

**Images with alt text examples:**
- Logo: "Neil Rowlandson" (acceptable, could be "Neil Rowlandson - Calgary Real Estate Agent")
- Blog images: Descriptive alt text matching post titles (good)
- UserWay accessibility widget: "Spinner: White decorative" (not critical)

**Key issue:** /buyers/financial-terms-glossary/ has 20 images without alt text -- these appear to be ad/widget images but still should have empty alt="" attributes explicitly rather than missing entirely.

---

## 8. Schema Markup Inventory

**Pages with schema:** 3 out of 36 (8.3%)
**Pages without schema:** 33 (91.7%)

| Page | Schema Type | Details |
|------|-------------|---------|
| /chaparral/ | Event | Open House for 58 Chapala Crescent SE (Apr 3, 2026, 2-4 PM) |
| /legacy/ | Event | Open House for 24 Legacy Landing (Apr 4, 2026, 1-3 PM) |
| /mckenzie-towne/ | Event | Open House for 6 Elgin Meadows Gardens SE (Apr 5, 2026, 2-4 PM) |

**Missing schema types that should be present:**
- **RealEstateAgent** on /about/ page -- Neil Rowlandson, CIR Realty
- **Organization** on homepage -- Calgary Castles Team
- **LocalBusiness** -- address, phone, hours
- **BreadcrumbList** on all pages -- breadcrumb navigation exists visually
- **WebSite** with SearchAction -- site has a search box
- **BlogPosting** on blog posts -- currently none present
- **FAQPage** on buyer/seller informational pages
- **RealEstateListing** on community pages with active listings

The only schema present is auto-generated Event markup from the Sierra Interactive platform for open houses on some community pages.

---

## 9. Canonical Tag Analysis

| Status | Count | Pages |
|--------|-------|-------|
| Self-referencing canonical (correct) | 33 | Most pages |
| Missing canonical | 3 | /property-search/site-map/, /property-search/property-tracker/, /contact/thank-you/ |
| HTTP canonical (Link header) | 0 | None detected |
| Multiple canonicals | 0 | None |

**Issues:**
- 3 pages missing canonical tags entirely
- /contact/thank-you/ is a 403 error page and should be removed from sitemap
- No HTTP-header-level canonical detected on any page

---

## 10. Open Graph / Social Meta Analysis

| Status | Count | Details |
|--------|-------|---------|
| Full OG tags (title + description + image) | 4 | Blog posts only |
| Partial OG (image only, no title/description) | 31 | All non-blog pages |
| No OG at all | 1 | /contact/thank-you/ (403 error) |

**Blog posts have proper OG:**
- og:title matching page title
- og:description matching meta description
- og:image with blog-specific images

**All other pages have only og:image** -- the same hero image across the entire site:
`https://cdn.sitephotos.sierrastatic.com/6546_hero_scc-hero2-20260227022224.jpg`

**Missing on all non-blog pages:**
- og:title
- og:description
- og:url
- og:type
- twitter:card
- twitter:title
- twitter:description

---

## 11. Technical Details (Homepage)

| Signal | Value |
|--------|-------|
| DOM Elements | 790 |
| Scripts | 21 |
| Stylesheets | 4 |
| Iframes | 3 |
| Viewport | width=device-width, initial-scale=1.0, minimum-scale=1.0 |
| Charset | utf-8 |
| Language | en |
| Favicons | 4 (32x32, 16x16, favicon.ico, root favicon.ico) |
| Hreflang | None (despite having 11 language options in nav) |
| HSTS Header | Missing on ALL 36 pages |
| Server | Cloudflare |

**Key issues:**
- **No hreflang tags** despite the site offering 11 language translations (ENGLISH, Chinese, French, Korean, Italian, Japanese, German, Portuguese, Russian, Spanish, Vietnamese)
- **HSTS header missing** on all pages (security concern)
- **3 iframes** on homepage (potential performance impact)

---

## 12. Social Media Link Issues

External links from the site route through **url.avanan.click** (Avanan email security proxy) for:
- Instagram: `url.avanan.click/v2/r01/___https://www.instagram.com/calgary_castles_real_estate/...`
- YouTube: `url.avanan.click/v2/r01/___https://www.youtube.com/@CalgaryCastlesTV/videos...`
- LinkedIn: `url.avanan.click/v2/r01/___https://ca.linkedin.com/in/calgarycastles...`

Only Facebook and X (Twitter) link directly.

This is likely caused by the social links being added via email (Avanan proxied them) and then pasted into the CMS. These redirect URLs look unprofessional and could break if the Avanan service changes.

---

## 13. Content Assessment

### Word Count Summary
- **Lowest:** /contact/thank-you/ (25 words -- broken 403 error page)
- **Highest:** /buyers/financial-terms-glossary/ (6,711 words)
- **Most pages:** 2,000-3,000 words (includes nav/footer boilerplate)
- **Estimated unique body content per page:** ~200-800 words (after subtracting ~1,900 words of navigation/sidebar/footer boilerplate)

### Blog
- Only 4 blog posts exist, all posted on February 2, 2026 by "Sierra System" (auto-generated)
- All posts are in the "Buying a Home" category
- Only 1 post in "Selling Your Home" category
- No blog index page in sitemap
- Blog content appears to be generic/syndicated, not original

---

## 14. Broken Page Alert

**https://www.sellingcalgarycastles.com/contact/thank-you/** returns:
- HTTP 403 Forbidden (title: "403 - Forbidden: Access is denied.")
- H1: "Server Error"
- 25 words total, no navigation, no styling
- Missing: meta description, canonical, OG tags, viewport, schema
- This page IS in the sitemap.xml -- it should be removed

---

## 15. 20 Prioritized Technical SEO Recommendations

| # | Recommendation | Effort | Impact | Priority |
|---|---------------|--------|--------|----------|
| 1 | **Add RealEstateAgent + LocalBusiness schema** to homepage and about page with NAP data, service areas, and agent info | Medium | High | P1 |
| 2 | **Fix all 4 blog meta descriptions** -- currently 305-524 chars, truncate to 150-160 chars with compelling CTAs | Low | High | P1 |
| 3 | **Add OG tags (title, description, url, type)** to all 32 non-blog pages. Currently only og:image exists | Medium | High | P1 |
| 4 | **Remove /contact/thank-you/ from sitemap** -- returns 403 error. Fix or redirect the URL | Low | High | P1 |
| 5 | **Fix social media links** -- replace Avanan proxy URLs (url.avanan.click) for Instagram, YouTube, LinkedIn with direct URLs | Low | Medium | P1 |
| 6 | **Add "Calgary" to all title tags** on buyer/seller pages. "Selling a Home" -> "Selling a Home in Calgary - Neil Rowlandson" | Low | High | P1 |
| 7 | **Fix homepage dual H1** -- consolidate to single H1 like "Calgary Homes for Sale - Find Your Dream Home" | Low | Medium | P2 |
| 8 | **Add H1 to /property-search/property-tracker/** -- currently missing | Low | Medium | P2 |
| 9 | **Lengthen 6 too-short title tags** (under 20 chars) to include location + branding: e.g., "Pricing Your Home" -> "Pricing Your Home for Sale in Calgary - Expert Tips" | Low | High | P2 |
| 10 | **Add BreadcrumbList schema** to all pages -- breadcrumb navigation exists visually (Home > Buyers > First Time Buyers) | Medium | Medium | P2 |
| 11 | **Add BlogPosting schema** to all 4 blog posts with author, datePublished, image, publisher | Medium | Medium | P2 |
| 12 | **Add Sitemap directive to robots.txt** -- currently missing `Sitemap: https://www.sellingcalgarycastles.com/sitemap.xml` | Low | Medium | P2 |
| 13 | **Fix missing canonical tags** on /property-search/site-map/ and /property-search/property-tracker/ | Low | Medium | P2 |
| 14 | **Add hreflang tags** if multi-language pages exist (nav shows 11 languages) -- or remove non-functional language switcher | Medium | Medium | P2 |
| 15 | **Improve meta descriptions** on thin pages (/buyers/ = 28 chars, /sellers/ = 24 chars) to 120-160 chars with value props and CTAs | Low | Medium | P2 |
| 16 | **Fix alt text** on homepage images (3-4 missing) and financial-terms-glossary (20 missing) | Low | Medium | P3 |
| 17 | **Add cross-links** between related content: buyer pages <-> seller pages, community pages <-> each other, blog posts <-> service pages | Medium | Medium | P3 |
| 18 | **Enable HSTS header** via Cloudflare -- missing on all 36 pages (security + minor ranking signal) | Low | Low | P3 |
| 19 | **Expand blog content** -- only 4 syndicated posts exist. Need original Calgary-specific content targeting local keywords (community guides, market updates, etc.) | High | High | P3 |
| 20 | **Add unique content H2/H3 headings** to service pages -- currently all H2s come from the sidebar template, not meaningful content structure | Medium | Medium | P3 |

---

## Summary of Key Findings

| Metric | Value |
|--------|-------|
| Total pages in sitemap | 38 |
| Pages analyzed | 36 |
| Pages with schema markup | 3 (8.3%) -- all auto-generated Event |
| Pages with full OG tags | 4 (11.1%) -- blog posts only |
| Pages missing canonical | 3 |
| Pages with title too short | 6 |
| Pages with meta desc too long | 4 |
| Broken pages (403/error) | 1 (/contact/thank-you/) |
| Images missing alt text | 23 of 339 (6.8%) |
| Missing H1 | 1 page |
| Multiple H1 | 1 page (homepage) |
| HSTS missing | All 36 pages |
| Hreflang present | None (despite 11 languages offered) |
| Orphaned pages | 2 |
| Social links through proxy | 3 of 5 platforms |

**Platform:** Sierra Interactive (IDX provider). Many SEO issues are template-level and would need to be fixed in the Sierra Interactive CMS or via custom code injection. Schema, OG tags, and meta tags may be limited by the platform's capabilities.
