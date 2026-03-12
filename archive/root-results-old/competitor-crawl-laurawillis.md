# Competitor Crawl Report: laurawillisrealestate.com

**Crawl Date:** March 1, 2026
**Competitor Site:** https://www.laurawillisrealestate.com
**Client Site:** https://www.livingparkcityutah.com
**Platform:** Both sites run on Sierra Interactive

---

## 1. Site Scale Comparison

| Metric | Laura Willis (Competitor) | Tisha & Cam (Client) | Gap |
|--------|--------------------------|---------------------|-----|
| **Total Sitemap URLs** | 372 | 62 | **6x more pages** |
| Blog Posts | 96 | 5 | **19x more blog content** |
| Community/Neighborhood Pages | ~200 | 28 | **7x more** |
| Ski-Specific Pages | 20 | 1 | **20x more** |
| Golf-Specific Pages | 11 | 0 | **Completely absent** |
| New Development Pages | 2+ (plus ~30 individual development pages) | 0 | **Completely absent** |
| Buyer Resource Pages | 14 | 10 | Slightly more |
| Seller Resource Pages | 6 | 6 | Equal |
| About/Social Pages | 4 | 1 | More depth |
| Homepage Internal Links | 360 | 150 | 2.4x more |

**Key Takeaway:** Laura Willis has 6x the content footprint. The most significant gaps are in blog content (19x), lifestyle-specific pages (ski/golf), and granular community/neighborhood pages.

---

## 2. Site Architecture Comparison

### Laura Willis - Superior Content Silos

Laura Willis organizes content into well-defined lifestyle silos:

```
/ski/                          (20 pages)
  /ski/ski-communities/
  /ski/all-ski-properties-for-sale-park-city-deer-valley/
  /ski/park-city-ski-condos/
  /ski/park-city-ski-homes/
  /ski/ski-in-ski-out-land/
  /ski/canyons-village-ski-properties/
  /ski/deer-valley-ski-in-ski-out-real-estate/
  /ski/deer-valley-ski-homes/
  /ski/deer-valley-ski-condos/
  ... and 11 more

/golf/                         (11 pages)
  /golf/golf-communities/
  /golf/glenwild/
  /golf/promontory/
  /golf/red-ledges/
  /golf/tuhaye/
  /golf/victory-ranch/
  ... and 5 more

/new-developments/             (2 hub pages + ~30 individual development pages)
  /new-developments/featured-new-developments-park-city-real-estate/
  /new-developments/new-construction-park-city-real-estate/
  Individual: /empire-residences/, /goldener-hirsch-deer-valley-luxury-real-estate/, etc.
```

### Tisha & Cam - Flat Structure

```
/buyers/park-city-ski-in-ski-out-homes/    (single page, buried under buyers)
(No golf section)
(No new developments section)
Community pages at root level: /aerie/, /deer-crest/, etc.
```

### What Laura Willis Does Better: Content Silos

1. **Lifestyle-based organization** - Ski, Golf, and New Developments each have their own section with a hub page and multiple sub-pages. This creates topical authority for search engines.

2. **Granular neighborhood coverage** - Instead of just "Canyons Village/The Colony" as one page, Laura Willis has individual pages for specific developments within each community: Blackstone Residences, Frostwood Villas, Red Pine, Silverado Lodge, The Pendry, Waldorf Astoria, etc. (~200 individual community/neighborhood/development pages vs. 28).

3. **Property type segmentation** - Separate pages for luxury homes, luxury condos, farm & ranch, lots & land, vacation homes. Client has none of these.

4. **City-level pages** - Individual pages for Charleston, Coalville, Cottonwood Heights, Emigration Canyon, Holladay, Kamas, Millcreek, Murray, Oakley, Peoa, Sandy, Woodland. Client only has broad county-level pages.

---

## 3. Meta Optimization Comparison

### Title Tags

| Aspect | Laura Willis | Tisha & Cam |
|--------|-------------|-------------|
| Homepage title | "Park City Real Estate & Homes For Sale \| Laura Willis Real Estate" | "Park City Utah Real Estate - Homes for Sale in Park City Utah" |
| Keyword targeting | Includes "Park City Real Estate" and brand name | Includes location but slightly redundant |
| Community page titles | Custom: "Aerie Real Estate - Homes for Sale in Aerie" | Template: "Aerie Homes for Sale - Aerie Real Estate" |
| Blog post titles | Descriptive, keyword-rich | N/A (only 5 posts, one has corrupted title) |

**Laura Willis advantage:** More keyword-rich titles on buyer/seller pages. Example: "First Steps to Buying" vs. client's generic "First Time Buyers - Buying Your First Home".

### Meta Descriptions

| Aspect | Laura Willis | Tisha & Cam |
|--------|-------------|-------------|
| Homepage | Unique, compelling (155 chars) | Unique but template-feeling |
| Community pages | Template with some customized | All use identical template |
| Buyer/Seller pages | **Also generic/template** (same weakness) | Very short and generic |
| Blog posts | Custom, keyword-rich | One is corrupted, others adequate |
| Property search | Very long, keyword-stuffed (265+ chars) | Short template |

**Notable:** Laura Willis has a site-wide default meta description that appears on many pages: "Discover premier Park City, UT real estate for sale at Laura Willis Real Estate..." This template is overused but is better than the client's very short generic descriptions.

### Open Graph Tags

| Aspect | Laura Willis | Tisha & Cam |
|--------|-------------|-------------|
| Homepage og:title | Present | **MISSING** |
| Homepage og:description | Present | **MISSING** |
| Homepage og:url | Present | **MISSING** |
| Homepage og:image | Present | Present |
| Community pages | Full OG set | Inconsistent (some have, some don't) |
| Blog posts | Full OG set | Present |

**Laura Willis wins clearly on social meta tag implementation.**

---

## 4. Schema / Structured Data Comparison

This is the single biggest gap between the two sites.

### Laura Willis Schema (Homepage)

Laura Willis implements **5 distinct schema types** on the homepage alone:

1. **RealEstateAgent** - Name, URL, logo, image, description, address, geo coordinates, telephone, price range, opening hours, social profiles
2. **LocalBusiness** (detailed) - Includes `aggregateRating` (4.9/5 from 25 reviews), `areaServed`, `openingHoursSpecification`, `email`, `hasMap`, `knowsAbout` (31 keyword-rich topics), `makesOffer`
3. **LocalBusiness** (simplified) - Brand-level with social links
4. **Organization** - With contact point
5. **WebSite** with **SearchAction** - Enables sitelinks search box in Google

Additionally, Laura Willis's schema includes:
- **knowsAbout** array with 31 real estate keywords (e.g., "Park City luxury real estate", "Ski-in/ski-out properties", "Best Realtor Park City")
- **AggregateRating** with 4.9/5 stars from 25 reviews

### Tisha & Cam Schema (Homepage)

**None.** Zero structured data on the homepage, about page, or contact page. Only schema found site-wide is auto-generated `Event` schema for open house listings on some community pages.

### Schema Gap Summary

| Schema Type | Laura Willis | Tisha & Cam |
|-------------|-------------|-------------|
| RealEstateAgent | YES | **NO** |
| LocalBusiness | YES (with AggregateRating) | **NO** |
| Organization | YES | **NO** |
| WebSite + SearchAction | YES | **NO** |
| AggregateRating | YES (4.9/5, 25 reviews) | **NO** |
| knowsAbout keywords | YES (31 keywords) | **NO** |
| Event (Open Houses) | YES | YES (auto-generated) |

**This is a critical competitive disadvantage.** Laura Willis's rich schema helps her appear in Google's Knowledge Panel, display star ratings in SERPs, and appear for rich snippet opportunities.

---

## 5. Blog Content Comparison

### Volume and Frequency

| Metric | Laura Willis | Tisha & Cam |
|--------|-------------|-------------|
| Total blog posts | 96 | 5 |
| Most recent post | October 2025 | July 2024 |
| Posting frequency | Regular (multiple per month) | Appears abandoned |
| Blog categories | Multiple (Selling Tips, Park City RE, Deer Valley RE, Why List with Laura) | 2 categories (Buying a Home, Selling Your Home) |

### Content Quality

Laura Willis blog posts are:
- **Timely and locally relevant** (e.g., "Deer Valley Expansion: Luxury Real Estate & East Village" from Oct 2025 references current resort developments)
- **Keyword-targeted** with locally specific meta descriptions
- **Long-form content** (~1,500-2,500+ words with subheadings)
- **Topically diverse** - market updates, lifestyle content, property guides, area guides
- **Personally branded** - "Beyond Zillow: Your Park City Real Estate Advantage with Laura Willis"

Tisha & Cam blog posts are:
- **Generic real estate content** not specific to Park City
- **Outdated** (most from February 2024)
- **Not locally branded** - could be on any real estate agent's site

### Blog Categories (Laura Willis)

The blog uses categories that map to topic clusters:
- Park City Real Estate
- Deer Valley Real Estate
- Selling Your Home Tips
- Why List with Laura Willis
- (likely more based on 96 posts)

---

## 6. Internal Linking Comparison

### Navigation Depth

Laura Willis has significantly deeper navigation menus:
- **Areas** dropdown: 27 communities + 2 hub pages (Communities, Neighborhoods)
- **Ski** dropdown: 20 pages including sub-categories (All Properties, Condos, Homes, Land) and individual resort pages
- **Golf** dropdown: 11 pages including hub and individual communities
- **New** dropdown: New Construction + New Developments
- **Buyers** dropdown: 14 pages (vs. client's 10)
- **About** dropdown: 3 pages (About, Testimonials, Who's Who)

### Homepage Link Count

| Metric | Laura Willis | Tisha & Cam |
|--------|-------------|-------------|
| Total links on homepage | 395 | 173 |
| Internal links | 360 | 150 |
| External links | 21 | 14 |
| Unique internal link destinations | ~150 | ~80 |

Laura Willis's homepage serves as a much more effective link hub, distributing PageRank to a wider set of pages.

### Cross-linking

Laura Willis cross-links extensively:
- Community pages link to related ski/golf/development sub-pages
- Blog posts link to relevant community and property pages
- Lifestyle pages (ski, golf) link to individual community pages within each category

---

## 7. Technical Comparison

### Page Performance

| Metric | Laura Willis | Tisha & Cam |
|--------|-------------|-------------|
| Homepage DOM elements | 3,008 | 887 |
| Homepage scripts | 50 | 29 |
| Homepage iframes | 5 | 5 |
| Homepage images | 57 (39 missing alt) | 35 (27 missing alt) |

Laura Willis's homepage is significantly heavier (3x DOM elements, nearly 2x scripts). This could impact Core Web Vitals performance. Both sites have poor image alt text coverage.

### Shared Weaknesses (Both Sites)

Both sites share these issues due to the Sierra Interactive platform:
- Same robots.txt structure and crawl delays
- Same disallowed paths
- Image alt text problems on listing thumbnails
- Multiple H1 tags on homepage (Laura Willis has 7 H1s)
- Property search pages missing canonical tags
- Property search results pages missing H1 tags

### H1 Tag Comparison

| Page | Laura Willis | Tisha & Cam |
|------|-------------|-------------|
| Homepage H1 count | **7** (worse) | 3 (bad) |
| Property search H1 | Missing | Missing |
| Community pages | Multiple H1s on many | Single H1 (better) |
| About page | 3 H1s | 1 H1 (better) |

Interestingly, **Tisha & Cam actually has better H1 discipline** on inner pages. Laura Willis overuses H1 tags throughout the site.

---

## 8. Unique Features Laura Willis Has That Client Lacks

1. **Lifestyle Search Silos** (Ski / Golf / New Developments) - Massive topical authority play
2. **Individual Development Pages** (~100+ pages for specific condo buildings, resort residences, subdivisions)
3. **RealEstateAgent + LocalBusiness + Organization + WebSite schema with AggregateRating**
4. **"Globally Connected" / "Who's Who in Luxury Real Estate"** pages - Authority/credibility signals
5. **Dedicated Testimonials page** (though it's missing H1 and has template meta)
6. **Social Media page** (Instagram integration)
7. **Calendar of Events page** - Local authority signal
8. **"Park City Neighborhoods" page** - Separate from communities, providing additional local content
9. **Market data widgets** on homepage ("Park City Market at a Glance" with median price, avg price/sqft)
10. **Multiple search entry points** - Newest Listings, Single Family, Condos & Townhomes, Luxury Homes, New Today, Price Reduced, Lots & Land

---

## 9. Areas Where Client Is Competitive or Better

1. **Cleaner H1 tag usage** on inner pages (single H1 per page on most pages vs. Laura Willis's frequent multiple H1s)
2. **Lighter homepage** (887 DOM elements vs. 3,008) - potentially better performance
3. **Ski-in/ski-out dedicated page** exists (though needs expansion)
4. **Consistent canonical tags** on community pages (Laura Willis is also good here)

---

## 10. Priority Recommendations Based on Competitor Analysis

### Highest Impact (Close the Biggest Gaps)

1. **Implement comprehensive schema markup** - Add RealEstateAgent, LocalBusiness (with AggregateRating), Organization, and WebSite with SearchAction schemas to the homepage. This is the #1 actionable gap.

2. **Create lifestyle content silos:**
   - `/ski/` section with sub-pages for each ski community, ski condos, ski homes, ski land
   - `/golf/` section with sub-pages for each golf community
   - `/new-developments/` section with individual development pages

3. **Dramatically expand blog content** - Go from 5 posts to 50+ with locally relevant, timely content. Target 2-4 posts per month covering:
   - Deer Valley expansion and its real estate impact
   - Individual community spotlights
   - Market updates with Park City data
   - Seasonal buying/selling advice specific to Park City

4. **Add granular neighborhood/development pages** - Create individual pages for specific developments within communities (e.g., The Colony, Stein Eriksen Residences, Montage, etc.)

### High Impact

5. **Complete OG tag implementation** across all pages (og:title, og:description, og:url)

6. **Add more buyer resource pages:**
   - Park City Utility Companies
   - Preferred Lenders
   - Buyer Representation guide
   - "First Steps to Buying" (currently have "First Time Buyers" but not step-by-step guide)

7. **Create a dedicated testimonials page** with embedded Google reviews

8. **Add market data widgets** to homepage (median price, price trends)

### Medium Impact

9. **Create city-level pages** for areas beyond Park City (Heber City, Coalville, Kamas, Oakley, Midway are already partially covered but could be expanded)

10. **Add a Park City events/calendar page** for local authority signals

11. **Create a dedicated luxury real estate page** (client doesn't have one; Laura Willis does at `/park-city-luxury-real-estate-deer-valley-homes-condos-estates/`)

12. **Implement blog categories** matching target keyword clusters

---

## 11. Competitor Weaknesses to Exploit

Despite Laura Willis's larger footprint, she has exploitable weaknesses:

1. **Multiple H1 tags everywhere** - Her site has worse heading structure than the client's inner pages
2. **Heavy page weight** (3,008 DOM elements on homepage) - She may lose on Core Web Vitals
3. **Template meta descriptions** on many pages - Same "Discover premier Park City, UT real estate..." appears on dozens of pages
4. **Testimonials page has no H1 and template meta description** - Under-optimized
5. **Some duplicate/overlapping pages** - e.g., `/golf/golf-communites/` (typo) and `/golf/golf-communities/`
6. **Image alt text just as bad** - 68% missing on homepage (39 of 57)
7. **Her schema has duplicates** - Multiple overlapping LocalBusiness/RealEstateAgent schemas that could confuse search engines
8. **Typos in URLs** - `/tuhaye-hideout-new-constriction-kamas-real-estate/` ("constriction" instead of "construction"), `/mayflower-resport-real-estate/` ("resport" instead of "resort")
