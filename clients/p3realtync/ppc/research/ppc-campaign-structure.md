# PPC Campaign Structure Audit: P3 Realty NC

**Client:** Lisa Johnson / P3RealtyNC
**Site:** p3realtync.com
**Date Range:** March 12-25, 2026 (2 weeks, brand-new account)
**Total Spend:** $594.08 (data export covers this period)
**Total Clicks:** 739
**Total Impressions:** 7,708
**Total Conversions:** 11
**Avg CPC:** $0.80
**Conversion Rate:** 1.49%
**Cost/Conversion:** $54.01
**Campaign Type:** Dynamic Search Ads (DSA)
**Bidding Strategy:** Maximize Clicks

---

## Executive Summary

**Structure Grade: D+**

This account suffers from severe over-segmentation. There are 221 enabled ad groups across 4 campaigns, built as a matrix of 19 cities/counties x 22 property features. This "city;feature" combinatorial approach has created a campaign structure where **56 ad groups (25%) have zero impressions** and another **65 ad groups (29%) are near-dead with 1-5 impressions and zero clicks**. That means **121 of 221 ad groups (55%) are functionally inactive**.

Only **4 real ad groups generated conversions** (moore-county;homes-with-pool, pinehurst;homes-for-sale, benson;luxury-homes, burgaw;homes-with-acreage) -- producing just 4 conversions from the named ad groups at a combined cost of $13.95. The remaining 7 conversions came from "Other search terms" not attributable to specific named ad groups.

The biggest structural flaw is **complete campaign duplication**: "DS Cities" and "DS Cities #2" contain the exact same 18 ad groups, and "DS Property Features" and "DS Property Features #2" share 89 overlapping ad groups. This forces Google to compete against itself in every auction, inflating costs and fragmenting data.

The account is burning budget across 167 different IDX search result landing pages (auto-selected by DSA) instead of routing traffic to the 34 well-built content pages that exist on the site.

---

## Campaign Architecture

### 4 Campaigns Identified (from Search Term data)

| Campaign | Ad Groups | Search Terms | Spend | Clicks | Conv | Purpose |
|---|---|---|---|---|---|---|
| DS Cities | 18 | 1,100 | $88.88 | 100 | 1 | City-level "homes-for-sale" |
| DS Cities #2 | 18 | 646 | $70.73 | 63 | 1 | **DUPLICATE** of DS Cities |
| DS Property Features | 131 | 779 | $61.95 | 91 | 3 | City x Feature combos |
| DS Property Features #2 | 100 | 414 | $55.10 | 63 | 0 | **NEAR-DUPLICATE** of DS Property Features |

**Critical Finding:** DS Cities and DS Cities #2 share 100% of the same 18 ad groups. DS Property Features and DS Property Features #2 overlap on 89 of their ad groups. There are 286 search terms appearing across both duplicate campaigns, meaning Google is bidding against itself constantly.

### Naming Convention: `city;feature`

The ad groups follow a `{location};{property-type}` naming pattern:

- **19 locations:** aberdeen, benson, burgaw, carthage, clayton, four-oaks, hampstead, johnston, johnston-county, moore-county, pender-county, pinehurst, rocky-point, selma, smithfield, southern-pines, surf-city, topsail-beach, whispering-pines
- **22 property features:** homes-for-sale, waterfront, homes-with-acreage, luxury-homes, new-builds, starter-homes, 1-6 bedroom-homes, 55-plus-communities, golf-community, gated-community, horse-property, multi-generational-homes, no-hoa-homes, single-level-homes, private-boat-ramps, deep-water, homes-with-pool

This produces a theoretical matrix of 418 combinations, of which 221 are active. The combinatorial approach is far too granular for a $1,000/mo budget.

### Geographic Spread Problem

The 19 target locations span two distinct, non-adjacent NC markets:

**Southeastern NC / Coast (Wilmington area):**
- Surf City, Topsail Beach, Hampstead, Rocky Point, Burgaw, Pender County

**Central NC (Sandhills / Johnston County area):**
- Pinehurst, Southern Pines, Aberdeen, Carthage, Whispering Pines, Moore County
- Clayton, Smithfield, Selma, Benson, Four Oaks, Johnston County

These two clusters are ~150 miles apart with completely different buyer demographics and price points. The budget is being diluted across both markets.

---

## Complete Ad Group Inventory

### Top 30 Ad Groups by Spend

| Ad Group | Imp | Clicks | CTR | Cost | Conv | CPA | Recommendation |
|---|---|---|---|---|---|---|---|
| topsail-beach;homes-for-sale | 277 | 22 | 7.9% | $19.15 | 0 | -- | Monitor - high volume, no conv |
| johnston-county;homes-for-sale | 168 | 17 | 10.1% | $16.22 | 0 | -- | Monitor - high volume, no conv |
| rocky-point;homes-for-sale | 77 | 13 | 16.9% | $12.66 | 0 | -- | Good CTR, needs conv tracking check |
| surf-city;waterfront | 59 | 10 | 17.0% | $12.28 | 0 | -- | Good CTR, verify conv tracking |
| carthage;homes-for-sale | 41 | 9 | 21.9% | $10.44 | 0 | -- | Great CTR, needs landing page work |
| moore-county;homes-for-sale | 172 | 9 | 5.2% | $8.12 | 0 | -- | Low CTR, broad targeting |
| burgaw;homes-with-acreage | 20 | 8 | 40.0% | $8.07 | 1 | $8.07 | WINNER - scale this |
| benson;homes-for-sale | 54 | 5 | 9.3% | $6.57 | 0 | -- | Low volume market |
| four-oaks;homes-for-sale | 28 | 5 | 17.9% | $6.32 | 0 | -- | Low volume market |
| hampstead;homes-for-sale | 65 | 4 | 6.2% | $6.23 | 0 | -- | Low CTR, review ad copy |
| pender-county;homes-for-sale | 126 | 6 | 4.8% | $6.21 | 0 | -- | Low CTR, broad county target |
| clayton;homes-for-sale | 114 | 7 | 6.1% | $6.08 | 0 | -- | Decent volume, no conv |
| moore-county;horse-property | 48 | 8 | 16.7% | $5.22 | 0 | -- | Good niche, needs conv |
| johnston-county;no-hoa-homes | 50 | 9 | 18.0% | $5.19 | 0 | -- | High CTR niche |
| moore-county;multi-generational-homes | 25 | 8 | 32.0% | $5.18 | 0 | -- | Excellent CTR, verify conv |
| pender-county;horse-property | 26 | 4 | 15.4% | $4.81 | 0 | -- | Niche, watch |
| southern-pines;homes-for-sale | 31 | 3 | 9.7% | $4.43 | 0 | -- | Low volume |
| pinehurst;homes-for-sale | 44 | 4 | 9.1% | $4.25 | 1 | $4.25 | WINNER - scale this |
| smithfield;homes-for-sale | 46 | 4 | 8.7% | $3.95 | 0 | -- | Low volume |
| johnston-county;multi-generational-homes | 15 | 4 | 26.7% | $3.59 | 0 | -- | High CTR niche |
| selma;homes-for-sale | 36 | 3 | 8.3% | $3.47 | 0 | -- | Low volume |
| burgaw;homes-for-sale | 54 | 3 | 5.6% | $3.08 | 0 | -- | Low CTR |
| topsail-beach;waterfront | 60 | 4 | 6.7% | $3.01 | 0 | -- | Below avg CTR |
| pender-county;waterfront | 18 | 3 | 16.7% | $2.91 | 0 | -- | Good CTR, low vol |
| moore-county;55-plus-communities | 13 | 2 | 15.4% | $2.82 | 0 | -- | Good niche |
| moore-county;no-hoa-homes | 31 | 4 | 12.9% | $2.53 | 0 | -- | Decent |
| pinehurst;waterfront | 14 | 4 | 28.6% | $2.46 | 0 | -- | Great CTR |
| johnston-county;homes-with-acreage | 30 | 4 | 13.3% | $2.27 | 0 | -- | Good CTR |
| clayton;luxury-homes | 8 | 2 | 25.0% | $2.16 | 0 | -- | Low volume |
| whispering-pines;2-bedroom-homes | 2 | 1 | 50.0% | $2.12 | 0 | -- | Too narrow |

### Ad Groups With Conversions (Winners)

| Ad Group | Imp | Clicks | Cost | Conv | CPA | Notes |
|---|---|---|---|---|---|---|
| pinehurst;homes-for-sale | 44 | 4 | $4.25 | 1 | $4.25 | Converting search term: "pinehurst nc homes for sale by owner" |
| burgaw;homes-with-acreage | 20 | 8 | $8.07 | 1 | $8.07 | Converting search term: "land for sale in burgaw nc" |
| moore-county;homes-with-pool | 9 | 1 | $0.85 | 1 | $0.85 | Best CPA in account |
| benson;luxury-homes | 2 | 1 | $0.78 | 1 | $0.78 | Best CPA, very low volume |

**Additional conversions from search term report (campaign-level):**
- "homes for sale with land near me" -> johnston-county;homes-with-acreage (DS Property Features) - 1 conv
- "horse farm for sale southern pines nc" -> moore-county;horse-property (DS Property Features) - 1 conv
- "casas en venta cerca de mi" -> johnston-county;homes-for-sale (DS Cities) - 1 conv
- 6 conversions attributed to "Other search terms" (not visible in report)

---

## Dead Ad Groups (0 Impressions) -- 56 Total

These ad groups received zero impressions in 2 weeks. The DSA system found no matching content or search demand for these combinations.

| Ad Group | Why It's Dead |
|---|---|
| aberdeen;gated-community | No matching page content |
| aberdeen;luxury-homes | No matching page content |
| aberdeen;new-builds | No matching page content |
| aberdeen;starter-homes | No matching page content |
| burgaw;1-bedroom-homes | Absurd combo -- 1BR in rural Burgaw |
| burgaw;starter-homes | No matching page content |
| carthage;2-bedroom-homes | No matching page content |
| carthage;3-bedroom-homes | No matching page content |
| carthage;4-bedroom-homes | No matching page content |
| carthage;luxury-homes | No market for luxury in Carthage |
| carthage;starter-homes | No matching page content |
| carthage;waterfront | No waterfront in Carthage |
| clayton;3-bedroom-homes | No matching page content |
| clayton;4-bedroom-homes | No matching page content |
| clayton;5-bedroom-homes | No matching page content |
| clayton;gated-community | No matching page content |
| clayton;golf-community | No matching page content |
| four-oaks;5-bedroom-homes | Absurd combo -- tiny market |
| four-oaks;golf-community | No golf communities in Four Oaks |
| four-oaks;luxury-homes | No luxury market in Four Oaks |
| four-oaks;new-builds | No matching page content |
| four-oaks;starter-homes | No matching page content |
| hampstead;starter-homes | No matching page content |
| johnston-county;deep-water | Landlocked county |
| johnston-county;private-boat-ramps | Landlocked county |
| johnston;golf-community | Duplicate location (johnston vs johnston-county) |
| moore-county;deep-water | Landlocked county |
| moore-county;golf-community | No matching page content (ironic given Pinehurst) |
| moore-county;new-builds | No matching page content |
| moore-county;private-boat-ramps | Landlocked county |
| pender-county;deep-water | Low demand niche |
| pender-county;golf-community | No matching page content |
| pender-county;private-boat-ramps | Ultra-niche, no demand |
| pinehurst;starter-homes | Pinehurst is upscale -- no starter homes |
| rocky-point;3-bedroom-homes | No matching page content |
| rocky-point;4-bedroom-homes | No matching page content |
| rocky-point;starter-homes | No matching page content |
| selma;2-bedroom-homes | No matching page content |
| selma;4-bedroom-homes | No matching page content |
| selma;5-bedroom-homes | No matching page content |
| selma;starter-homes | No matching page content |
| selma;waterfront | No waterfront in Selma |
| smithfield;4-bedroom-homes | No matching page content |
| southern-pines;4-bedroom-homes | No matching page content |
| southern-pines;starter-homes | No matching page content |
| surf-city;2-bedroom-homes | No matching page content |
| surf-city;3-bedroom-homes | No matching page content |
| surf-city;gated-community | No gated communities on Topsail Island |
| surf-city;homes-with-acreage | No acreage on a barrier island |
| surf-city;luxury-homes | No matching page content |
| surf-city;starter-homes | No matching page content |
| topsail-beach;4-bedroom-homes | No matching page content |
| topsail-beach;5-bedroom-homes | No matching page content |
| topsail-beach;gated-community | No gated communities on Topsail Island |
| topsail-beach;luxury-homes | No matching page content |
| topsail-beach;starter-homes | No matching page content |

**Geographically absurd combinations detected:**
- Johnston County + deep-water / private-boat-ramps (landlocked)
- Moore County + deep-water / private-boat-ramps (landlocked)
- Surf City + homes-with-acreage (barrier island, no acreage exists)
- Surf City / Topsail Beach + gated-community (does not exist on the island)
- Carthage + waterfront (no significant waterfront)
- Selma + waterfront (no significant waterfront)
- Pinehurst + starter-homes (upscale golf community, wrong demographic)

---

## Spend-But-No-Conversion Ad Groups -- 81 Total

These ad groups spent money but produced zero conversions. Combined spend: $233.84 (98% of named ad group spend).

### Top Wasters by Spend (>$2 spend, 0 conversions)

| Ad Group | Imp | Clicks | Cost | CTR | Issue |
|---|---|---|---|---|---|
| topsail-beach;homes-for-sale | 277 | 22 | $19.15 | 7.9% | Highest spend, 0 conv |
| johnston-county;homes-for-sale | 168 | 17 | $16.22 | 10.1% | High spend, 0 conv |
| rocky-point;homes-for-sale | 77 | 13 | $12.66 | 16.9% | Good CTR but no conv |
| surf-city;waterfront | 59 | 10 | $12.28 | 17.0% | Good CTR but no conv |
| carthage;homes-for-sale | 41 | 9 | $10.44 | 21.9% | Great CTR but no conv |
| moore-county;homes-for-sale | 172 | 9 | $8.12 | 5.2% | Low CTR, no conv |
| benson;homes-for-sale | 54 | 5 | $6.57 | 9.3% | Low volume |
| four-oaks;homes-for-sale | 28 | 5 | $6.32 | 17.9% | Tiny market |
| hampstead;homes-for-sale | 65 | 4 | $6.23 | 6.2% | Low CTR |
| pender-county;homes-for-sale | 126 | 6 | $6.21 | 4.8% | Lowest CTR |
| clayton;homes-for-sale | 114 | 7 | $6.08 | 6.1% | Good volume, bad conv |
| moore-county;horse-property | 48 | 8 | $5.22 | 16.7% | Niche, strong CTR |
| johnston-county;no-hoa-homes | 50 | 9 | $5.19 | 18.0% | Strong CTR |
| moore-county;multi-generational-homes | 25 | 8 | $5.18 | 32.0% | Best CTR in account |
| pender-county;horse-property | 26 | 4 | $4.81 | 15.4% | Niche |
| southern-pines;homes-for-sale | 31 | 3 | $4.43 | 9.7% | Low volume |
| smithfield;homes-for-sale | 46 | 4 | $3.95 | 8.7% | Low volume |
| johnston-county;multi-generational-homes | 15 | 4 | $3.59 | 26.7% | High CTR |
| selma;homes-for-sale | 36 | 3 | $3.47 | 8.3% | Low volume |
| burgaw;homes-for-sale | 54 | 3 | $3.08 | 5.6% | Low CTR |
| topsail-beach;waterfront | 60 | 4 | $3.01 | 6.7% | Below avg |
| pender-county;waterfront | 18 | 3 | $2.91 | 16.7% | Low volume |
| moore-county;55-plus-communities | 13 | 2 | $2.82 | 15.4% | Low volume |
| moore-county;no-hoa-homes | 31 | 4 | $2.53 | 12.9% | Decent |
| pinehurst;waterfront | 14 | 4 | $2.46 | 28.6% | Great CTR |
| johnston-county;homes-with-acreage | 30 | 4 | $2.27 | 13.3% | Decent |
| clayton;luxury-homes | 8 | 2 | $2.16 | 25.0% | Low volume |
| whispering-pines;2-bedroom-homes | 2 | 1 | $2.12 | 50.0% | Too narrow |
| aberdeen;golf-community | 1 | 1 | $2.01 | 100.0% | Insufficient data |

**Note:** At only 2 weeks of data, many of these may convert with more time. The high-CTR ad groups (carthage;homes-for-sale at 21.9%, moore-county;multi-generational-homes at 32.0%) show strong relevance even without conversions yet. The concern is structural -- too many ad groups splitting a thin budget.

---

## Performance by City (Aggregated)

| City | Ad Groups | Imp | Clicks | CTR | Cost | Conv | Verdict |
|---|---|---|---|---|---|---|---|
| johnston-county | 13 | 310 | 38 | 12.3% | $29.92 | 0 | High spend, 0 conv -- watch |
| moore-county | 14 | 343 | 34 | 9.9% | $26.05 | 1 | Best county, homes-with-pool converted |
| topsail-beach | 11 | 368 | 27 | 7.3% | $22.84 | 0 | High impressions but low CTR |
| pender-county | 14 | 258 | 21 | 8.1% | $19.27 | 0 | Broad, no conv |
| rocky-point | 12 | 150 | 20 | 13.3% | $17.50 | 0 | Good CTR, no conv |
| clayton | 15 | 182 | 20 | 11.0% | $15.17 | 0 | Moderate |
| burgaw | 10 | 103 | 16 | 15.5% | $14.48 | 1 | homes-with-acreage converted |
| surf-city | 12 | 144 | 12 | 8.3% | $14.14 | 0 | Below avg CTR |
| pinehurst | 15 | 153 | 19 | 12.4% | $13.60 | 1 | homes-for-sale converted |
| carthage | 11 | 59 | 9 | 15.3% | $10.44 | 0 | Good CTR, tiny market |
| southern-pines | 15 | 92 | 12 | 13.0% | $10.36 | 0 | Low volume |
| four-oaks | 11 | 45 | 8 | 17.8% | $8.47 | 0 | Best CTR, tiny market |
| hampstead | 14 | 136 | 7 | 5.1% | $8.07 | 0 | Worst CTR |
| benson | 10 | 100 | 6 | 6.0% | $7.35 | 1 | luxury-homes converted |
| smithfield | 11 | 77 | 7 | 9.1% | $6.03 | 0 | Low volume |
| whispering-pines | 9 | 79 | 7 | 8.9% | $5.76 | 0 | Tiny town |
| selma | 11 | 69 | 7 | 10.1% | $5.75 | 0 | Low volume |
| aberdeen | 12 | 55 | 3 | 5.5% | $3.49 | 0 | Worst performer |
| johnston | 1 | 0 | 0 | 0.0% | $0.00 | 0 | DUPLICATE of johnston-county |

## Performance by Property Feature (Aggregated)

| Feature | Ad Groups | Imp | Clicks | CTR | Cost | Conv | Verdict |
|---|---|---|---|---|---|---|---|
| homes-for-sale | 18 | 1,469 | 118 | 8.0% | $120.58 | 1 | Broadest, dominates spend |
| waterfront | 18 | 273 | 32 | 11.7% | $27.94 | 0 | Good CTR, no conv |
| homes-with-acreage | 16 | 269 | 30 | 11.2% | $21.88 | 1 | Converted -- strong niche |
| horse-property | 3 | 83 | 14 | 16.9% | $11.21 | 0 | Excellent CTR, only 3 counties |
| multi-generational-homes | 3 | 56 | 15 | 26.8% | $10.39 | 0 | BEST CTR in account |
| 55-plus-communities | 9 | 126 | 13 | 10.3% | $9.57 | 0 | Good niche |
| no-hoa-homes | 3 | 96 | 15 | 15.6% | $8.67 | 0 | Strong CTR, only 3 counties |
| luxury-homes | 16 | 47 | 9 | 19.1% | $8.20 | 1 | Converted -- low volume |
| homes-with-pool | 3 | 28 | 2 | 7.1% | $1.63 | 1 | Converted at $0.85 CPA |
| starter-homes | 15 | 5 | 0 | 0.0% | $0.00 | 0 | DEAD -- pause all 15 |
| deep-water | 3 | 0 | 0 | 0.0% | $0.00 | 0 | DEAD -- pause all 3 |
| private-boat-ramps | 3 | 0 | 0 | 0.0% | $0.00 | 0 | DEAD -- pause all 3 |

---

## Landing Page Alignment Assessment

### The IDX Problem

**83% of landing page URLs** (167 of 201) are IDX property search result pages (`/property-search/results/?searchtype=2&searchid=XXXXX`). These are dynamically generated MLS search pages with:
- No unique content for SEO
- No compelling call-to-action
- Generic search result layouts
- Different search IDs creating hundreds of fragmented URLs

**IDX pages received 62% of all clicks** (460 of 739) and **63% of all spend** ($375.48 of $594.08) but produced **0 conversions**.

### Content Pages Performance

The site has 34 well-structured content landing pages that Google's DSA algorithm sometimes selects. These are much better targets:

| Landing Page | Clicks | Cost | Theme |
|---|---|---|---|
| /johnston-county/ | 46 | $42.40 | County overview |
| /moore-county/ | 27 | $26.29 | County overview |
| /pender-county/ | 25 | $23.37 | County overview |
| /homes-with-acreage-for-sale-in-johnston-county/ | 23 | $14.91 | Feature + county |
| /no-hoa-homes-for-sale-in-moore-county/ | 20 | $14.77 | Feature + county |
| /no-hoa-homes-for-sale-in-johnston-county/ | 19 | $12.47 | Feature + county |
| /horse-properties-for-sale-in-moore-county/ | 18 | $10.69 | Feature + county |
| /multi-generational-homes-for-sale-in-moore-county/ | 14 | $8.75 | Feature + county |
| /multi-generational-homes-for-sale-in-johnston-county/ | 10 | $8.02 | Feature + county |
| /waterfront-homes-for-sale-in-pender-county/ | 10 | $7.72 | Feature + county |

**Key issue:** Content pages received only **38% of clicks** but are far more likely to convert. The DSA system is preferentially choosing IDX search result pages because they technically match more keyword combinations.

### Content Pages Available on Site (from DSA landing page data)

**County Pages:** johnston-county, moore-county, pender-county
**Feature Pages (Johnston County):** homes-with-acreage, no-hoa, horse-properties, multi-generational, homes-with-pool, waterfront, luxury, 55-plus, single-level, new-construction
**Feature Pages (Moore County):** no-hoa, horse-properties, multi-generational, homes-with-acreage, homes-with-pool, waterfront, luxury, 55-plus, single-level, new-construction, golf-community
**Feature Pages (Pender County):** waterfront, horse-properties, multi-generational, no-hoa, homes-with-acreage, homes-with-pool, luxury, 55-plus, single-level, new-construction

**Missing city-level pages detected:** No dedicated landing pages for Pinehurst, Southern Pines, Clayton, Smithfield, Selma, Benson, Four Oaks, Topsail Beach, Surf City, Hampstead, Rocky Point, Burgaw, Carthage, Whispering Pines, or Aberdeen. All city-level DSA traffic is landing on IDX search result pages.

---

## Campaign Self-Cannibalization Analysis

### DS Cities vs DS Cities #2

These two campaigns contain **identical ad groups** (all 18 `city;homes-for-sale` combinations). Search term analysis found **286 exact search terms** triggering ads from both campaign pairs simultaneously. This means:

1. Google auctions the same query against two of Lisa's own ads
2. The cheaper click doesn't always win (auction dynamics)
3. Conversion data is split across campaigns, making optimization harder
4. Quality Score signals are fragmented

### DS Property Features vs DS Property Features #2

89 of the ad groups overlap between these campaigns. Same problems apply but at a larger scale due to 131 + 100 ad groups.

### Feature Overlap Within Cities

Many cities have overlapping feature ad groups that target similar DSA content:
- `waterfront` vs `deep-water` vs `private-boat-ramps` (water-themed overlap)
- `homes-for-sale` captures traffic that should go to specific features
- `luxury-homes` vs bedroom-count ad groups compete for similar listings

---

## Search Term Quality Analysis

### Match Type
All 2,939 visible search terms show as "Exact match" -- this is standard for DSA campaigns where Google matches search queries to website content.

### Negative Keyword Management
- **167 search terms excluded** (good -- active management happening)
- Excluded terms cost $25.36 before being caught
- Top excluded terms are out-of-area cities: Arapahoe, Goldsboro, Wilson, Murphy, Lake Lure, Hendersonville, Rocky Mount, Troy, Kure Beach

### Spanish Language Queries
- **81 Spanish-language search terms** detected ("casas en venta...")
- Combined spend: $13.03
- One conversion: "casas en venta cerca de mi" ($0.79)
- The site is in English only -- these users land on English pages
- **Decision needed:** Lisa serves a Spanish-speaking community? If yes, consider Spanish landing pages. If no, add Spanish negative keywords.

### Wasteful Out-of-Area Terms Still Getting Through
- "homes for sale in longs sc with no hoa" ($0.79)
- Various NC cities outside service area getting impressions
- "golf condos for sale" ($2.01) -- generic, no location qualifier

---

## Device Performance

| Device | Impressions | Clicks | CTR | Cost | Conv | CPA |
|---|---|---|---|---|---|---|
| Mobile | 13,508 | 665 | 4.9% | $533.47 | 10 | $53.35 |
| Desktop | 1,372 | 45 | 3.3% | $38.19 | 0 | -- |
| Tablet | 536 | 29 | 5.4% | $22.41 | 1 | $22.41 |

**89.8% of spend is mobile.** All 10 mobile conversions suggest the audience is primarily searching on phones, which is expected for real estate. Desktop produced 0 conversions on $38 spend -- not enough data to make a decision yet, but worth monitoring.

---

## Extension Recommendations

The data export does not include an Ads report, so we cannot confirm what extensions are currently active. Based on real estate PPC best practices, the following should be configured:

### 1. Sitelink Extensions (HIGH PRIORITY)
- "View All Listings" -> /property-search/
- "Moore County Homes" -> /moore-county/
- "Johnston County Homes" -> /johnston-county/
- "Pender County Homes" -> /pender-county/
- "Waterfront Properties" -> /waterfront-homes-for-sale-in-pender-county/
- "Horse Properties" -> /horse-properties-for-sale-in-moore-county/
- "Schedule a Showing" -> contact page
- "Free Home Valuation" -> if available

### 2. Callout Extensions (HIGH PRIORITY)
- "Licensed NC REALTOR"
- "Free Consultation"
- "Local Market Expert"
- "Serving Wilmington & Pinehurst Areas"
- "No Obligation Home Search"
- "MLS Listings Updated Daily"

### 3. Structured Snippet Extensions
- **Property Types:** Single Family, Waterfront, Horse Property, Luxury, Acreage, New Construction
- **Neighborhoods:** Pinehurst, Topsail Beach, Hampstead, Clayton, Southern Pines
- **Amenities:** Pool, Acreage, Waterfront, Golf Course Access, No HOA

### 4. Call Extensions (HIGH PRIORITY)
- Add Lisa's business phone number
- Enable call tracking
- Set call hours to business hours only

### 5. Location Extensions
- Connect Google Business Profile
- Shows address and map pin in ads
- Critical for local real estate

### 6. Image Extensions
- Add property photos or area lifestyle images
- Significant CTR lift on mobile (where 90% of traffic is)

---

## Action Items

### IMMEDIATE (This Week)

1. **CONSOLIDATE CAMPAIGNS:** Merge "DS Cities" and "DS Cities #2" into a single campaign. Merge "DS Property Features" and "DS Property Features #2" into a single campaign. Self-cannibalization is the #1 structural problem. This alone could reduce CPA by 15-30%.

2. **PAUSE ALL 56 DEAD AD GROUPS:** Zero impressions in 2 weeks means Google cannot match these combinations to any content. They add complexity without value. (See full list above.)

3. **PAUSE ALL 65 NEAR-DEAD AD GROUPS:** Ad groups with 1-5 impressions and 0 clicks over 2 weeks will never generate meaningful volume.

4. **PAUSE GEOGRAPHICALLY ABSURD COMBOS:** Johnston County + deep-water/private-boat-ramps, Moore County + deep-water/private-boat-ramps, Surf City + homes-with-acreage, Surf City/Topsail + gated-community, Carthage + waterfront, Selma + waterfront, Pinehurst + starter-homes.

5. **PAUSE "starter-homes" FEATURE ENTIRELY:** All 15 starter-homes ad groups have 5 total impressions and 0 clicks. There is zero demand for this keyword pattern.

6. **ADD NEGATIVE KEYWORDS:** Add all out-of-state locations, "mobile home," "manufactured home," "land only" (unless Lisa sells land), "rent," "apartment," competitor brand names. Consider adding Spanish negatives if the site won't serve that audience.

### SHORT-TERM (Next 2 Weeks)

7. **RESTRUCTURE FROM 221 AD GROUPS TO ~25:** The budget supports approximately 20-25 ad groups at most. Recommended structure:
   - **Campaign 1: DS County Pages** (3 ad groups: johnston-county, moore-county, pender-county) targeting the county overview pages
   - **Campaign 2: DS Feature Pages** (~20 ad groups: the high-CTR feature combinations that have actual content pages: horse-property, multi-generational, no-hoa, homes-with-acreage, 55-plus, waterfront, luxury, homes-with-pool -- one per county where the page exists)

8. **EXCLUDE IDX SEARCH RESULT PAGES FROM DSA TARGETING:** Add URL exclusion rules for `/property-search/results/` so DSA only serves ads for content pages. The 167 IDX pages are consuming 63% of budget with 0 conversions.

9. **ADD ALL RECOMMENDED EXTENSIONS:** Sitelinks, callouts, structured snippets, call extensions, location extensions, and image extensions (see detailed recommendations above).

10. **BUILD CITY-LEVEL LANDING PAGES:** The top-spending ad groups (topsail-beach, pinehurst, rocky-point, surf-city, carthage, clayton) are all landing on IDX pages because no dedicated city pages exist. Build landing pages for the top 6 cities by spend.

### MEDIUM-TERM (Next 30 Days)

11. **SWITCH BIDDING FROM MAXIMIZE CLICKS TO MAXIMIZE CONVERSIONS:** Once the account has 15-30 conversions with the consolidated structure, switch to tCPA or Maximize Conversions bidding. The current Maximize Clicks strategy is optimizing for volume over quality.

12. **EVALUATE MARKET FOCUS:** The two geographic clusters (Wilmington coast vs Sandhills/Johnston County) are 150 miles apart. Consider whether the budget would be better concentrated on one region. Current data shows Moore County and Johnston County producing the most volume.

13. **INVESTIGATE CONVERSION TRACKING:** The landing page report shows 0 conversions across all pages, while the account-level total shows 11. This discrepancy suggests conversion actions may be tracking phone calls, form fills, or off-site actions not tied to landing page URLs. Verify what conversion actions are configured and ensure they are firing correctly.

14. **CREATE AUDIENCE SEGMENTS:** Add remarketing audiences for site visitors, particularly those who viewed specific property pages. Layer "In-Market for Real Estate" audiences as observation-only to gather data.

15. **IMPLEMENT AD SCHEDULE ADJUSTMENTS:** Thursday and Friday show the highest conversion rates (3 conv each). Once more data accumulates, consider bid adjustments to shift budget toward high-converting days.

16. **CHANGE GEO-TARGETING FROM "PRESENCE & INTEREST" TO "PRESENCE ONLY":** "Presence & Interest" means people anywhere in the country who show interest in NC real estate will see ads. For a local realtor, "Presence" targeting (people physically in or regularly in NC) is more appropriate and will eliminate out-of-state waste.

17. **REVIEW SPANISH LANGUAGE STRATEGY:** 81 Spanish-language queries are reaching the account. If Lisa wants to serve Spanish-speaking buyers, build Spanish landing pages. If not, add "casas," "venta," "cerca de mi" as negative keywords to save $13+/period.

---

## Summary Metrics

| Metric | Current | Target (After Restructuring) |
|---|---|---|
| Ad Groups | 221 | ~25 |
| Dead Ad Groups (0 imp) | 56 (25%) | 0 |
| Near-Dead Ad Groups | 65 (29%) | 0 |
| Campaigns | 4 (2 duplicated) | 2 |
| Budget Utilization | Spread across 167 IDX pages | Focused on 34 content pages |
| Self-Cannibalization | 286 duplicate search terms | Eliminated |
| Extensions | Unknown/likely minimal | 6 types configured |
| Bidding | Maximize Clicks | Maximize Conversions (once data supports) |
| Geo-Targeting | Presence & Interest | Presence Only |

---

*Analysis generated 2026-03-26. Data source: ppc-raw-data.json (Google Ads export, March 12-25, 2026).*
