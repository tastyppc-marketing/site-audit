# Laura Willis Real Estate - Technical SEO Site Structure Audit

**Site:** https://www.laurawillisrealestate.com/  
**Crawl Date:** April 11, 2026  
**Platform:** Sierra Interactive (SierraStatic CDN)  
**Total Sitemap URLs:** 376 | **Content Pages Analyzed:** 374 (306 successful, 62 rate-limited, 6 timed out)

---

## 1. Sitemap Overview

The site uses a single `sitemap.xml` referenced in `robots.txt`. It contains 376 URLs total, of which 374 are content pages and 2 are IDX/filter pages (property search results).

### URL Categories (by count)

| Category | Total | Notes |
|----------|------:|-------|
| Blog posts (`/blog/`) | 99 | Market reports, neighborhood guides, lifestyle content |
| Neighborhood/community pages (root-level) | ~210 | Individual pages for each community, condo complex, development |
| Ski property pages (`/ski/`) | 20 | Ski area and property type pages |
| Buyer resources (`/buyers/`) | 13 | Buyer guides, financing, pre-approval |
| Golf community pages (`/golf/`) | 11 | Individual golf community pages |
| Seller resources (`/sellers/`) | 6 | Seller guides, marketing, pricing |
| Property search (`/property-search/`) | 4 | Search, site map, property tracker (2 IDX filtered) |
| About pages (`/about/`) | 3 | Bio, testimonials, Who's Who |
| Contact pages (`/contact/`) | 2 | Contact form, thank you |
| New developments (`/new-developments/`) | 2 | New construction landing pages |
| Other (communities hub, neighborhoods, featured listings) | 4 | Aggregation/hub pages |

### Structure Analysis

The site has a flat URL architecture. Over 200 neighborhood/community/condo pages sit at root level (e.g., `/deer-valley/`, `/promontory/`, `/canyons-village/`) rather than being grouped under a `/communities/` or `/neighborhoods/` parent path. This creates a sprawling sitemap but is common for real estate sites optimizing for location-specific searches.

There is one `/dev/` page in the sitemap that appears to be a development/staging page and should be removed.

---

## 2. Robots.txt Review

The `robots.txt` file is present and well-configured:

- **Blocked bots:** Amazonbot, PetalBot, Barkrowler (fully disallowed)
- **Crawl-delayed bots:** AhrefsSiteAudit (85s), AhrefsBot (85s), SemrushBot (85s)
- **Default crawl delay:** 5 seconds for all other bots
- **Disallowed paths:** `/res/includes/`, `/sist/`, `/property-search/sist_ajax/`, market update paths
- **Allowed:** JS and CSS files under `/res/includes/`
- **Sitemap declared:** Yes, at `https://www.laurawillisrealestate.com/sitemap.xml`

**Issues:** The aggressive 85-second crawl delays for Ahrefs and Semrush will significantly limit third-party SEO tool analysis. The `Crawl-delay` directive is not universally respected by all bots.

---

## 3. Navigation and Internal Linking Assessment

### Navigation Structure
The site uses a mega-menu navigation with the following top-level sections:
- **Search** (Advanced Search, Map, Property Tracker, Luxury, Featured, Calendar, Global)
- **Areas** (Communities, Neighborhoods with ~30 named neighborhoods)
- **Ski** (All Ski, Condos, Homes, Land, plus 15+ ski area subsections)
- **Golf** (Golf Communities hub plus 10 individual communities)
- **New** (New Construction, New Developments)
- **Buyers** (12 sub-pages covering full buyer journey)
- **Sellers** (5 sub-pages covering seller services)
- **Social** (social media)
- **About** (Bio, Testimonials, Who's Who)
- **Contact**
- **Blog**

### Internal Link Metrics
- **Average internal links per page:** ~275 (heavily influenced by mega-menu navigation)
- **Contextual internal links (not in nav/header/footer):** Varies widely, many pages rely almost entirely on navigation links
- **63 pages have zero contextual internal links** -- a significant issue for link equity distribution

### Orphaned Pages (25 identified)
Pages in the sitemap that receive no contextual internal links from other analyzed pages:
- `/property-search/site-map/`
- `/bald-eagle-club/`
- `/bear-hollow/`
- `/blackhawk-station/`
- `/dev/` (should not be in sitemap)
- `/just-listed/`
- `/laura-willis-featured-listings/`
- `/leave-me-a-review/`
- `/park-city-communities/`
- `/park-city-homes-under-2m/`
- `/park-city-vacation-homes/`
- `/promontory-ranches/`
- `/schedule-apt/`
- And 12 others (primarily niche neighborhood/development pages)

---

## 4. Page-by-Page Meta Tag Audit

### Key Pages

| Page | Title (chars) | Meta Description (chars) | Issues |
|------|:---:|:---:|--------|
| **Homepage** `/` | 65 | 151 | Title 5 chars over limit |
| **About** `/about/about-laura-willis-realtor/` | 131 | 137 | Title grossly over limit (131 chars); includes phone number |
| **Contact** `/contact/` | 70 | 321 | Both over limits |
| **Buyers** `/buyers/` | 65 | 211 | Description over limit |
| **Sellers** `/sellers/` | 65 | 193 | Description over limit |
| **Communities** `/communities/` | 73 | 265 | Both over limits |
| **Neighborhoods** `/park-city-neighborhoods/` | 61 | 149 | Title slightly over |
| **Deer Valley** `/deer-valley/` | 55 | 145 | Good range |
| **All Ski** `/ski/all-ski-properties-for-sale-park-city-deer-valley/` | 18 | 231 | Title too short ("All Ski Properties"), desc over |
| **Golf Communities** `/golf/golf-communities/` | 65 | 268 | Both over limits |
| **Buyer Representation** `/buyers/buyer-representation/` | 69 | 348 | Both over limits, missing H1 |
| **Free Market Analysis** `/sellers/free-market-analysis/` | 110 | 61 | Title grossly over |
| **New Developments** `/new-developments/featured-new-developments-park-city-real-estate/` | 25 | 407 | Desc massively over; using default boilerplate |
| **Canyons Village** `/canyons-village/` | 63 | 126 | Title slightly over |
| **Empire Pass** `/empire-pass/` | 55 | 122 | Good range |

### Sitewide Title Tag Analysis
- **Too long (>60 chars):** 73 pages (19.5%)
- **Too short (<20 chars):** 111 pages (29.7%) -- many neighborhood pages use just the neighborhood name (e.g., "Glenwild", "Aerie")
- **Missing:** 0 pages
- **Total with issues:** ~49% of pages have suboptimal title tags

### Sitewide Meta Description Analysis
- **Too long (>160 chars):** 228 pages (61.0%) -- the most pervasive issue
- **Missing:** 74 pages (19.8%)
- **Good length:** Only ~72 pages (19.3%) have descriptions in the 50-160 char sweet spot
- **Boilerplate detected:** Many neighborhood pages use identical generic text: "Discover premier Park City, UT real estate for sale at Laura Willis Real Estate..." (407 chars)

---

## 5. H1 Tag Audit

| Issue | Count | Percentage |
|-------|------:|:---:|
| Single H1 (correct) | 286 | 77.7% |
| Multiple H1 tags | 74 | 20.1% |
| No H1 tag | 8 | 2.2% |
| Empty H1 tag | 2 | included above |

### Flagged Issues

**Homepage:** 7 H1 tags -- each section of the homepage uses an H1 instead of H2. The first H1 is "Park City Real Estate | Luxury Homes & Ski Properties for Sale" which is appropriate, but the remaining 6 should be H2s.

**About page:** 3 H1 tags ("Meet Laura Willis...", "Awards & Recognitions", "Why Choose Laura Willis"). Only the first should be H1.

**Contact page:** 2 H1 tags, one is empty.

**Many neighborhood pages** have 2 H1 tags -- typically the neighborhood name plus a longer descriptive heading. Example: `/deer-valley/` has "Luxury Homes for Sale in Deer Valley" and "Deer Valley UT Homes & Real Estate".

**Blog posts with dual H1:** Several blog posts use two H1 tags for title and subtitle.

**Missing H1 pages:** `/buyers/buyer-representation/`, `/buyers/escrow-now-what/`, and several others jump straight from header to H2.

---

## 6. Image Alt Text Analysis

| Metric | Value |
|--------|------:|
| Total images crawled | 4,330 |
| Missing alt text | 483 |
| **% Missing** | **11.2%** |
| Pages with alt text issues | 156 (41.8%) |

### Key Findings:
- **Homepage:** 54 images, 38 missing alt text (70.4%) -- the worst offender
- **Communities page:** 23 images, 19 missing alt (82.6%)
- **New Developments page:** 70 images, 66 missing alt (94.3%)
- **Neighborhoods page:** 27 images, 23 missing alt (85.2%)
- Many missing alt images are 1x1 pixel base64 tracking/placeholder images from the Sierra Interactive platform
- Some genuine content images (property photos, headshots) also lack alt text
- Pages using the IDX listing widgets tend to have good alt text on property images

---

## 7. Schema Markup Inventory

The site implements extensive JSON-LD structured data. Each page typically contains 4-5 JSON-LD blocks:

### Schema Types Present

| Type | Occurrences | Notes |
|------|:---:|-------|
| `@graph` (composite blocks) | 915 | Multiple per page; contain nested types |
| `Event` | 267 | Calendar events on many community pages |
| `invalid` (parse errors) | 331 | **Critical issue** -- ~1/3 of schema blocks have JSON parse errors |
| `unknown` (missing @type) | 305 | Schema blocks without identifiable type |

### Homepage Schema (Detailed)
The homepage contains 5 JSON-LD blocks with the following types:
1. **RealEstateAgent** + Service + Place (multiple) + FAQPage + WebSite -- well-structured
2. **RealEstateAgent** + LocalBusiness + Organization -- duplicate/redundant entity declarations
3. **LocalBusiness** + WebSite (from platform) -- platform-generated
4. **RealEstateAgent** + FAQPage + WebPage -- another duplicate block
5. **RealEstateAgent** + RealEstateListing + ItemList -- has JSON syntax error (raw string, not parsed)

### Issues:
- **Duplicate RealEstateAgent entities:** The homepage declares 4 separate RealEstateAgent entities with inconsistent data (different phone numbers: +1-435-640-5980 vs. +14357315148, different review counts: 45 vs. 25, different rating values: 5.0 vs. 4.9)
- **331 invalid schema blocks:** JSON parse errors across the site, likely from malformed or escaped content
- **Redundant declarations:** Multiple Organization, LocalBusiness, and RealEstateAgent blocks on the same page
- **FAQ schema on homepage** is well-structured and targets relevant queries
- **Missing schema on 63 pages:** These are the rate-limited pages from the crawl, so actual count may be lower

---

## 8. Canonical Tag Analysis

| Metric | Count | % |
|--------|------:|:---:|
| Has canonical tag | 303 | 82.3% |
| Missing canonical | 65 | 17.7% |
| Multiple canonicals | 0 | 0% |

- The 65 pages missing canonical tags include the 62 rate-limited pages; the true missing count is likely very low (approximately 3 pages)
- Self-referencing canonicals are correctly implemented on all inspected pages
- No HTTP-header canonicals detected
- No canonical conflicts between HTTP and HTML canonical tags

---

## 9. Open Graph / Social Meta Analysis

| Metric | Count | % |
|--------|------:|:---:|
| Has OG tags | 235 | 63.9% |
| Missing OG tags | 133 | 36.1% |

### Observed Patterns:
- **Homepage OG tags:** Present and well-formed
  - `og:title`: "Park City Real Estate & Homes For Sale | Laura Willis Real Estate"
  - `og:description`: "Find your dream home in Park City, Utah..."
  - `og:image`: Points to a valid CDN image
  - `og:url`: Correctly set to homepage URL
- **Buyers page:** Missing `og:title` and `og:description` despite having regular meta tags
- **Twitter Card tags:** Only `twitter:card` is present on some pages; no `twitter:site` or `twitter:creator` found
- **Many neighborhood pages** are missing OG tags entirely, relying only on fallback behavior
- **Blog posts** generally have OG tags present

---

## 10. Additional Technical Findings

### Viewport Meta Tag
- **Missing on 63 pages** (the rate-limited pages; actual count likely ~0-1)
- Standard viewport: `width=device-width, initial-scale=1.0, minimum-scale=1.0`

### HSTS (HTTP Strict Transport Security)
- **Missing on 268 pages** (71.8%) -- this is a server-level configuration issue, not page-level

### Language
- `lang="en"` correctly set on the `<html>` element
- No hreflang tags (appropriate for a single-language US-focused site)
- Multi-language options visible in navigation (Chinese, French, Korean, etc.) but these appear to be Google Translate widgets, not separate hreflang pages

### Page Performance Indicators (Homepage)
- **DOM Elements:** 2,960 (elevated; target is under 1,500)
- **Scripts:** 61 (high; significant JavaScript payload)
- **Stylesheets:** 11
- **Iframes:** 3
- **Charset:** UTF-8
- **Favicons:** Present (multiple sizes)

### Redirect Chains
- 7 pages have redirect chains (more than one hop)
- Homepage and Contact page are among those with redirect chains

### Word Count Distribution
- **Minimum:** 6 words (rate-limited pages)
- **Maximum:** 7,471 words
- **Median:** 3,837 words (strong content depth)
- **Under 300 words (thin content):** 63 pages (largely rate-limited pages)
- **Over 1,000 words:** 305 pages (81.6% of good pages)

---

## 11. Twenty Prioritized Technical Recommendations

| # | Recommendation | Effort | Impact | Priority |
|---|---------------|:------:|:------:|:--------:|
| 1 | **Fix duplicate/conflicting schema markup on homepage.** Consolidate the 4 RealEstateAgent blocks into one authoritative entity with consistent NAP data (phone, review count, rating). | Medium | High | P1 |
| 2 | **Fix 331 invalid JSON-LD blocks sitewide.** Audit and repair all malformed structured data. Invalid schema wastes crawl budget and provides no ranking benefit. | Medium | High | P1 |
| 3 | **Reduce homepage H1 tags from 7 to 1.** Keep the primary "Park City Real Estate..." H1 and change the remaining 6 to H2 tags. | Low | High | P1 |
| 4 | **Fix all pages with multiple H1 tags (74 pages).** Demote secondary H1s to H2. Prioritize homepage, about page, contact page, and high-traffic neighborhood pages. | Low | High | P1 |
| 5 | **Rewrite meta descriptions to under 160 characters (228 pages).** Start with the top 50 pages by traffic. Replace the boilerplate 407-character description used across dozens of neighborhood pages. | High | High | P1 |
| 6 | **Optimize title tags: fix too-short titles (111 pages).** Neighborhood pages like "Glenwild" (8 chars) should become "Glenwild Homes for Sale -- Park City Golf Community" to capture search intent. | High | High | P1 |
| 7 | **Optimize title tags: fix too-long titles (73 pages).** The About page title is 131 characters. Trim all titles to 50-60 characters while preserving primary keywords. | Medium | High | P1 |
| 8 | **Add alt text to 483 images missing it.** Focus first on real content images (not tracking pixels). The homepage alone has 38 images missing alt text. | Medium | Medium | P2 |
| 9 | **Add OG tags to 133 pages missing them.** Prioritize the Buyers section, neighborhood pages, and any page likely to be shared on social media. | Medium | Medium | P2 |
| 10 | **Add contextual internal links to 63 orphaned/link-starved pages.** Add in-content links from related blog posts and community pages to distribute link equity beyond the navigation. | High | High | P2 |
| 11 | **Enable HSTS at the server level.** Add `Strict-Transport-Security` header to the nginx/CDN configuration. This is a single config change that fixes 268+ pages. | Low | Medium | P2 |
| 12 | **Remove `/dev/` page from sitemap and add noindex.** This appears to be a staging/development page that should not be indexed. | Low | Low | P2 |
| 13 | **Resolve redirect chains (7 pages).** The homepage and contact page both have multi-hop redirects. Each hop adds latency and dilutes link equity. | Low | Medium | P2 |
| 14 | **Add missing H1 tags to 8 pages.** Pages like `/buyers/buyer-representation/` jump straight to H2, missing the H1 signal. | Low | Medium | P2 |
| 15 | **Remove empty H1 tags on contact and sellers pages.** Empty H1s are worse than missing ones as they signal broken markup. | Low | Low | P2 |
| 16 | **Reduce homepage DOM size (2,960 elements) and script count (61).** Defer non-critical scripts, lazy-load below-fold content, and audit third-party tags. | High | Medium | P3 |
| 17 | **Add `twitter:site` and `twitter:creator` meta tags.** Currently only `twitter:card` is present on some pages. Add consistent Twitter Card markup sitewide. | Low | Low | P3 |
| 18 | **Add meta descriptions to 74 pages missing them.** Particularly important for blog posts and buyer/seller resource pages. | Medium | Medium | P3 |
| 19 | **Audit and consolidate duplicate neighborhood pages.** The site has both `/brookeside/` and `/brookside/` (likely the same community). Check for other duplicates. | Low | Medium | P3 |
| 20 | **Consider restructuring flat URL hierarchy.** 200+ root-level neighborhood pages could be grouped under `/neighborhoods/` or `/communities/` for clearer site architecture and better crawl efficiency. Evaluate carefully as this requires 301 redirects. | High | Medium | P3 |

---

## Data Files

- **Full crawl data:** `seo/research/crawl-data.json` (per-page analysis for all 374 pages)
- **Link graph:** `seo/research/link-graph.json` (internal linking edge data)
- **This report:** `seo/research/client-site-structure.md`
