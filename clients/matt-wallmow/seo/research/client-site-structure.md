# Site Structure Audit: mattwallmow.com

**Crawl Date:** 2026-04-15
**Platform:** WordPress (AgentFire theme)
**Domain:** mattwallmow.com

---

## 1. Sitemap Overview

### Sitemap Index
The site uses a WordPress Yoast-style sitemap index at `/sitemap_index.xml` containing 5 sub-sitemaps:

| Sitemap | URL Count |
|---------|-----------|
| page-sitemap.xml | 40 |
| post-sitemap.xml | 10 |
| category-sitemap.xml | 5 |
| post_tag-sitemap.xml | 28 |
| author-sitemap.xml | 1 |
| **Total** | **84** |

### URL Categories
- **Core service pages:** / (homepage), /buyers/, /sellers/, /about/, /contact/, /communities/, /testimonials/, /blog/, /home-valuation/, /vip-home-search/, /mortgage-calculator/, /properties/, /recently-sold/, /office-exclusive-listings/
- **Community/county pages (7):** /forest-county/, /iron-county/, /langlade-county/, /lincoln-county/, /oneida-county/, /price-county/, /vilas-county/
- **South Florida community pages (7):** /lauderdale-beach/, /davie/, /boca-raton/, /aventura/, /sunny-isles-beach/, /bal-harbour/, /miami/
- **Blog posts (10):** Mix of evergreen buying/selling guides and localized Minocqua SEO content
- **Individual property/listing pages (6):** /4109-cth-g/, /9362-badger-rd/, /4744-bayview-dr/, /8718-lorann-dr/, /1753-meta-lake-rd/, /2185-krystal-kove-rd/
- **Utility pages:** /sitemap/, /accessibility/, /privacy-policy/, /404-page/, /thank-you/, /nosey/, /coming-soon/, /open-house/, /deals-of-the-week/, /matt-wallmow/, /101banana-ave/
- **Tag archive pages (28):** Heavy concentration on "Minocqua, WI" keywords
- **Category archive pages (5):** buying, selling, renting, real-estate, minocqua-wi-real-estate

### Structure Analysis
The site has a reasonably flat architecture with most content 1-2 clicks from the homepage. However, there are several concerns:
- South Florida community pages exist on a Northwoods-focused site, creating geographic confusion for search engines
- 28 tag archive pages create potential thin-content/duplication issues
- Several utility pages in the sitemap (/nosey/, /101banana-ave/, /coming-soon/) appear to be test/placeholder pages that should be noindexed or removed

---

## 2. Navigation and Internal Linking Assessment

### Primary Navigation
The main nav includes: Buyers | Sellers | About | Communities | Home Valuation

### Hamburger/Mobile Menu
Expanded menu adds: Search | VIP Home Search | Recently Sold | Exclusive Listings | Contact | Testimonials | Blog | Mortgage Calculator

### Internal Linking Patterns
- **Homepage** is the strongest hub with ~55 contextual internal links to listings, county pages, Florida pages, and CTAs
- **Blog posts** interlink well via sidebar "Recent Posts" widgets and "Check out this article next" sections
- **Community pages** link to individual county pages but county pages themselves appear thin
- **Buyers and Sellers pages** link primarily to contact and VIP search CTAs, with listing widgets
- **Testimonials page** has zero contextual internal links (only nav/footer boilerplate)
- **Contact page** has zero contextual internal links

### Orphan/Weak Pages
- Individual property pages (/4109-cth-g/, etc.) may not be linked from anywhere except the sitemap
- South Florida pages are linked from the homepage but have no deeper integration
- /matt-wallmow/ page purpose unclear vs. /about/
- /deals-of-the-week/, /open-house/, /coming-soon/ appear to be unused feature pages

---

## 3. Page-by-Page Meta Tag Audit

| Page | Title | Chars | Meta Description | Chars | Issues |
|------|-------|-------|-----------------|-------|--------|
| Homepage | Your Northwoods Real Estate Professional \| Lakeland Realty | 57 | Experience trusted Northwoods real estate... | 233 | Description too long (233 chars > 160) |
| About | About Meet The Team - Lakeland Realty | 37 | Real estate Realty Group has many great agents... | 111 | Generic title & description; wrong brand name in description |
| Contact | contact - Lakeland Realty | 25 | *MISSING* | 0 | Lowercase title; no description at all |
| Buyers | Buying - Lakeland Realty | 24 | This is how we help buyers | 26 | Placeholder description (26 chars!) |
| Sellers | Selling - Lakeland Realty | 25 | This is how we sell properties | 30 | Placeholder description (30 chars!) |
| Communities | communities - Lakeland Realty | 29 | *MISSING* | 0 | Lowercase title; no description |
| Testimonials | testimonials - Lakeland Realty | 30 | *MISSING* | 0 | Lowercase title; no description |
| Blog | Blog - Lakeland Realty | 22 | *MISSING* | 0 | No description |
| Waterfront Blog | 10 Pros and Cons of Waterfront Living in Minocqua, WI?... | 99 | *MISSING* (has og:description) | 0 | Title 99 chars (truncated in SERPs); no meta desc |
| Spring Market Blog | 2026 Spring Real Estate Market in Northern Wisconsin... | 69 | *MISSING* (has og:description) | 0 | Title slightly long; no meta desc |
| Luxury Agent Blog | Find the Best Luxury Real Estate Agent Near Me in Minocqua, WI... | 80 | *MISSING* (has og:description) | 0 | Title 80 chars (truncated); no meta desc |

### Summary
- **5 of 11 analyzed pages have NO meta description at all**
- **2 pages have placeholder descriptions (26-30 chars)**
- **1 page has an excessively long description (233 chars)**
- **Blog posts have og:description set but no actual meta description tag** -- this is an SEO plugin configuration issue
- **Multiple title tags use lowercase** (contact, communities, testimonials)

---

## 4. H1 Tag Audit

| Page | H1 Content | Assessment |
|------|-----------|------------|
| Homepage | "Real Estate Professional" | Generic -- missing "Northwoods", "Minocqua", or agent name |
| About | "Northwoods Guide" | Vague -- should reference Matt Wallmow or About Us |
| Contact | "Real Estate" | Completely generic -- two words with zero context |
| Buyers | "Dream Home" | Abstract -- no geographic or service qualifier |
| Sellers | "Confidence" | Single abstract word -- no SEO value whatsoever |
| Communities | "Communities" | One word -- should be "Northwoods Communities" minimum |
| Testimonials | "Success stories" | Acceptable but could include brand name |
| Blog | "Northwoods" | One word -- not descriptive enough |
| Waterfront Blog | "10 Pros and Cons of Waterfront Living in Minocqua, WI?..." + "Insert/edit link" | Good primary H1 but has DUPLICATE H1 from WordPress editor artifact |
| Spring Market Blog | "2026 Spring Real Estate Market..." + "Insert/edit link" | Good primary H1 but has DUPLICATE H1 |
| Luxury Agent Blog | "Find the Best Luxury Real Estate Agent..." + "Insert/edit link" | Good primary H1 but has DUPLICATE H1 |

### Critical Issues
- **All service pages (buyers, sellers, contact) have vague, one-or-two-word H1s with zero SEO value**
- **All blog posts have a phantom second H1 ("Insert/edit link")** -- this is a WordPress editor link dialog that's rendering in production HTML
- **No H1 on the site mentions the agent's name "Matt Wallmow"**

---

## 5. Image Alt Text Analysis

| Page | Total Images | Missing Alt Text | Rate |
|------|-------------|-----------------|------|
| Homepage | ~30 | ~15 | 50% |
| About | ~8 | ~4 | 50% |
| Contact | ~3 | ~2 | 67% |
| Buyers | ~15 | ~8 | 53% |
| Sellers | ~10 | ~5 | 50% |
| Communities | ~10 | ~5 | 50% |
| Testimonials | ~12 | ~10 | 83% |
| Blog | ~12 | ~10 | 83% |
| Blog Posts | ~5 each | ~3 each | 60% |

### Summary
- **Across all analyzed pages, approximately 50-83% of images are missing alt text**
- Social media icons universally lack descriptive alt text
- Property listing images rely on the listing data feed and lack descriptive alt text
- Testimonials page reviewer photos have no alt text
- Blog featured images are missing alt text
- Logo images have alt="logo" (acceptable but could be "Lakeland Realty logo")

---

## 6. Schema Markup Inventory

| Page | JSON-LD Schema | Status |
|------|---------------|--------|
| Homepage | None | MISSING -- should have RealEstateAgent + LocalBusiness |
| About | None | MISSING -- should have Person schema |
| Contact | None | MISSING -- should have LocalBusiness with address/phone |
| Buyers | None | MISSING -- should have Service schema |
| Sellers | None | MISSING -- should have Service schema |
| Communities | None | MISSING |
| Testimonials | None | MISSING -- should have AggregateRating / Review schema |
| Blog | None | MISSING |
| Blog Posts | None | MISSING -- should have Article/BlogPosting schema |

### Assessment
**Zero schema markup found across the entire site.** This is a significant missed opportunity for:
- Local business rich results (name, address, phone, hours, reviews)
- Real estate agent rich results
- Article/BlogPosting rich results for blog content
- Review/testimonial rich results
- FAQ schema on relevant blog posts
- BreadcrumbList for navigation context

---

## 7. Canonical Tag Analysis

| Page | Canonical Present | Canonical URL | Self-Referencing |
|------|------------------|---------------|------------------|
| Homepage | Yes | https://mattwallmow.com/ | Yes |
| About | Yes | https://mattwallmow.com/about/ | Yes |
| Contact | Yes | https://mattwallmow.com/contact/ | Yes |
| Buyers | Yes | https://mattwallmow.com/buyers/ | Yes |
| Sellers | Yes | https://mattwallmow.com/sellers/ | Yes |
| Communities | Yes | https://mattwallmow.com/communities/ | Yes |
| Testimonials | Yes | https://mattwallmow.com/testimonials/ | Yes |
| Blog | Yes | https://mattwallmow.com/blog/ | Yes |
| Blog Posts | Yes | Self-referencing | Yes |

### Assessment
Canonical tags are properly implemented as self-referencing on all pages analyzed. This is correct behavior. No cross-domain canonical issues detected.

---

## 8. Open Graph / Social Meta Analysis

| Page | og:title | og:description | og:image |
|------|----------|---------------|----------|
| Homepage | Set | Set | **MISSING** |
| About | Set | Set | **MISSING** |
| Contact | Set | **MISSING** | **MISSING** |
| Buyers | Set | Set (placeholder) | **MISSING** |
| Sellers | Set | Set (placeholder) | **MISSING** |
| Communities | Set | **MISSING** | **MISSING** |
| Testimonials | Set | **MISSING** | **MISSING** |
| Blog | Set | **MISSING** | **MISSING** |
| Waterfront Blog Post | Set | Set | Set (1.jpg) |
| Spring Market Blog Post | Set | Set | Set (thumbnail.png) |
| Luxury Agent Blog Post | Set | Set | Set (2.jpg) |

### Assessment
- **og:image is missing on ALL service/core pages** -- shared links will show no preview image on Facebook, LinkedIn, Twitter
- **Blog posts are the only pages with og:image set** (via featured images)
- **No Twitter Card meta tags detected** on any page
- The og:descriptions on service pages mirror the (often poor) meta descriptions

---

## 9. Robots.txt Review

```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

User-agent: *
Disallow: /wp-json/agentfire/v1/core/cron/

User-agent: DotBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: ZoominfoBot
Disallow: /

User-agent: SeznamBot
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: Huckabot
Disallow: /

Sitemap: https://mattwallmow.com/sitemap_index.xml
```

### Assessment
- Standard WordPress admin exclusions are in place
- AgentFire cron endpoint is correctly blocked
- **Blocking AhrefsBot and SemrushBot** prevents these tools from crawling the site -- this is intentional but limits the site owner's ability to use Ahrefs/SEMrush for competitive analysis of their own site
- Sitemap reference is correctly included
- No disallow rules for tag/category archives (which could help with thin content)

---

## 10. Twenty Prioritized Technical SEO Recommendations

### Critical (Fix Immediately)

1. **Add meta descriptions to all pages.** Five core pages have no meta description. Blog posts have og:description but no meta description. Configure the SEO plugin (likely Yoast or RankMath) to populate meta descriptions for all page types.

2. **Rewrite H1 tags on all service pages.** The current H1s ("Confidence", "Dream Home", "Real Estate", "Northwoods Guide") have zero SEO value. Each should include the primary keyword and location, e.g., "Buy a Home in Northern Wisconsin's Northwoods" for the buyers page.

3. **Remove the phantom "Insert/edit link" H1 from all blog posts.** This WordPress TinyMCE editor artifact is rendering as a second H1 on every blog post. Likely caused by a theme template issue or plugin conflict -- check the post template for stray dialog HTML.

4. **Implement JSON-LD schema markup sitewide.** At minimum: RealEstateAgent + LocalBusiness on the homepage, Person on the about page, Article/BlogPosting on blog posts, AggregateRating on the testimonials page, and BreadcrumbList across all pages.

5. **Fix placeholder meta descriptions.** Buyers ("This is how we help buyers") and Sellers ("This is how we sell properties") have obviously placeholder text. Replace with compelling, keyword-rich descriptions under 160 characters.

### High Priority

6. **Add og:image to all core pages.** Every page shared on social media currently shows no preview image. Upload branded social sharing images for the homepage, about, buyers, sellers, communities, contact, and testimonials pages.

7. **Fix title tag capitalization.** "contact", "communities", "testimonials" titles use lowercase -- capitalize properly and add location/keyword context: e.g., "Contact Matt Wallmow | Northwoods Real Estate | Lakeland Realty".

8. **Add descriptive alt text to all images.** Across the site, 50-83% of images lack alt text. Prioritize property images, agent photos, and community images. Use descriptive, keyword-relevant alt text.

9. **Audit and potentially remove South Florida community pages.** The site serves Northwoods Wisconsin but has 7 South Florida community pages (Fort Lauderdale, Boca Raton, Miami, etc.). If Matt does not actively serve South Florida, these pages create geographic confusion for Google and dilute topical authority. If he does serve both areas, they need separate local landing strategies.

10. **Shorten the homepage meta description** from 233 characters to under 160 to prevent truncation in search results.

### Medium Priority

11. **Noindex or remove thin/test pages.** Pages like /nosey/, /101banana-ave/, /coming-soon/, /open-house/, /deals-of-the-week/ appear to be placeholder or test content. Either populate them with real content or add noindex tags and remove from sitemap.

12. **Populate missing community page data.** The communities page shows blank stats for Lincoln County, Oneida County, Price County, and Vilas County (population, avg selling price, recent sales all empty). Either populate this data or hide incomplete entries.

13. **Reduce tag archive bloat.** 28 tag archive pages in the sitemap creates thin content risk. Consider noindexing tag archives or consolidating tags. Many are near-duplicates (e.g., "minocqua-wi-realtor", "minocqua-wi-top-realtor", "minocqua-wi-best-realtor", "top-realtor-in-minocqua-wi").

14. **Add Twitter Card meta tags.** No Twitter/X Card markup detected. Add twitter:card, twitter:site, twitter:title, twitter:description, and twitter:image tags.

15. **Add internal links to thin pages.** The contact page and testimonials page have zero contextual internal links. Add relevant cross-links to buyers/sellers pages, blog content, and community pages.

### Lower Priority

16. **Fix blog post title tag lengths.** Several blog posts have titles exceeding 60 characters (up to 99 chars). Shorten to prevent SERP truncation while keeping core keywords. Move " - Lakeland Realty" suffix to after the truncation point or remove it from blog post titles.

17. **Reduce keyword over-optimization in blog post headings.** The luxury real estate blog post repeats "luxury real estate agent in Minocqua, WI" in 7 out of 7 H2 tags. Vary the phrasing to avoid appearing spammy to search engines.

18. **Consolidate duplicate about pages.** Both /about/ and /matt-wallmow/ exist in the sitemap. Determine which is the canonical about page and redirect the other.

19. **Consider unblocking AhrefsBot and SemrushBot** in robots.txt if the site owner uses these tools for monitoring their own site's backlinks and rankings.

20. **Add FAQ schema to relevant blog posts.** Blog posts like "10 Pros and Cons of Waterfront Living" and "Should I Rent or Buy a Home?" naturally contain FAQ-style content that could trigger rich results with FAQ schema markup.

---

## Appendix: Key Findings Summary

| Metric | Value |
|--------|-------|
| Total sitemap URLs | 84 |
| Content pages (page-sitemap) | 40 |
| Blog posts | 10 |
| Pages with missing meta descriptions | 5 of 11 analyzed |
| Pages with placeholder meta descriptions | 2 of 11 analyzed |
| Pages with schema markup | 0 of 11 analyzed |
| Pages with og:image | 3 of 11 analyzed (blog posts only) |
| Blog posts with duplicate H1 | All (3/3 analyzed) |
| Average image alt text compliance | ~40% |
| Self-referencing canonical tags | 100% (correct) |
