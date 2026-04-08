# SEO Audit Comparison: V1 (March 23) vs V2 (March 31, 2026)

**Client:** Neil Rowlandson / Calgary Castles Team / CIR Realty  
**Website:** sellingcalgarycastles.com  
**Prepared:** March 31, 2026

---

## Executive Summary
The transition from the V1 audit (March 23) to the V2 audit (March 31) represents a shift from qualitative estimation to quantitative precision. While the overall grade remains a **D+**, the V2 audit provides a significantly deeper diagnostic layer by utilizing real-time DataForSEO API data and PageSpeed Insights. This has revealed critical technical issues—such as mobile performance bottlenecks and US-centric content inaccuracies—that were previously undetected, providing a much clearer roadmap for recovery in the competitive Calgary real estate market.

---

## Data Quality Assessment

| Feature | V1 Audit (March 23) | V2 Audit (March 31) | Upgrade Type |
| :--- | :--- | :--- | :--- |
| **Data Source** | Manual scraping & qualitative observation | DataForSEO API & Google PageSpeed API | Qualitative to Quantitative |
| **Keyword Data** | "High/Medium/Low" estimates | Exact volumes, CPC, & Competition Index | Precise Metrics |
| **Backlink Data** | 7 manually identified links | 50+ API-verified links & 209 RD | Comprehensive Crawl |
| **Platform ID** | RealtyPress (Incorrect) | Sierra Interactive (Corrected) | Error Correction |
| **PageSpeed** | No data collected | Full Lighthouse mobile/desktop metrics | New Data Layer |

---

## 1. Overall Grade

| Metric | V1 Audit | V2 Audit | Change |
| :--- | :--- | :--- | :--- |
| **Overall Grade** | **D+** | **D+** | **No Change** |
| **Rationale** | Zero organic visibility; not ranking for any of 25 target keywords. | Confirmed zero visibility; site does not rank in top 10 for any target term. | Increased confidence in "Poor" status. |

---

## 2. Keyword Rankings

Both audits confirmed **0/25** keywords ranking in the top 100. However, V2 revealed the true scale of the missed opportunity.

| Keyword | V2 Volume/mo | V2 CPC ($) | V2 Comp. Index | Client Rank |
| :--- | :--- | :--- | :--- | :--- |
| Calgary homes for sale | 60,500 | 0.94 | 36 | NR |
| Calgary houses for sale | 60,500 | 0.94 | 36 | NR |
| Calgary MLS listings | 22,200 | 0.53 | 17 | NR |
| Calgary real estate | 18,100 | 0.64 | 21 | NR |
| Cochrane homes for sale | 12,100 | 1.33 | 28 | NR |
| buy home Calgary | 9,900 | 0.88 | 27 | NR |
| Calgary townhouses for sale | 8,100 | 1.63 | 53 | NR |
| Calgary condos for sale | 3,600 | 0.87 | 35 | NR |
| Calgary property for sale | 2,400 | 0.45 | 56 | NR |
| Calgary real estate market | 1,600 | 1.19 | 26 | NR |

**V2 Key Discovery:** The keyword "Calgary real estate agent" carries a **$11.72 CPC**, indicating extremely high commercial intent that V1's qualitative "Medium" estimate failed to highlight. Total addressable volume is now confirmed at **204,000+ searches/month**.

---

## 3. Search Volumes: Qualitative vs Real Data

V1 relied on subjective estimates, whereas V2 provides the factual baseline required for ROI projections.

| Keyword | V1 Estimate | V2 Actual Volume | Gap Analysis |
| :--- | :--- | :--- | :--- |
| Calgary homes for sale | High | 60,500 | Accurate Estimate |
| buy home Calgary | Medium | 9,900 | Underestimated |
| sell home Calgary | Low | 70 | Accurate Estimate |
| best neighborhoods Calgary| Medium | 1,000 | Low Comp Opportunity (6) |

---

## 4. Technical Issues: What V2 Found That V1 Missed

| Issue | V1 Found? | V2 Found? | Impact |
| :--- | :--- | :--- | :--- |
| **Dual H1 Tags** | No | **Yes** | Confuses search engines on homepage topic. |
| **Open Graph Tags** | No | **Yes** | 32 pages missing; poor social sharing display. |
| **Platform ID** | No (Wrong) | **Yes** (Sierra) | Critical for knowing CMS-specific SEO limits. |
| **Mobile LCP** | No | **Yes** (4,577ms) | Borderline "Poor" performance; UX/Ranking hit. |
| **Thin Content Flag** | No | **Yes** | Specifically flagged page-level thin content. |

---

## 5. Technical Issues: Confirmed by Both Audits

The following issues were validated by both crawlers, confirming their persistence:
* **0/25** target keywords ranking.
* **6** pages with short title tags.
* **1** page missing meta description.
* **4** meta descriptions exceeding length limits.
* **100%** of pages missing HSTS security headers.
* **1** mobile viewport issue on `/contact/thank-you/`.

---

## 6. Content Quality

While V1 lacked stored content analysis, V2 performed a granular audit of 25 pages.

*   **Overall Content Grade:** D+
*   **Critical Discovery:** The site relies on **US-centric boilerplate content**. References to "PMI," "Escrow," and "FHA/Fannie Mae" are factually incorrect for the Calgary/Alberta market.
*   **Template Reliance:** Nearly 100% of community pages (Auburn Bay, Cranston, Mahogany, etc.) contain zero descriptive content, only automated listing feeds.
*   **EEAT Score:** **20/100 (Poor)**. The "About" page is only two sentences long, providing zero proof of expertise or experience.

---

## 7. Competitors: Depth of Analysis

V1 tracked 6 competitors qualitatively. V2 used the same 6 for direct comparison but identified **45 unique domains** competing in the actual SERPs.

| Domain | V1 Est. DR (0-100) | V2 Real Rank (0-1000) | RD (V2) | Backlinks (V2) |
| :--- | :--- | :--- | :--- | :--- |
| sellingcalgarycastles.com | 5-10 | **45** | 209 | 280 |
| justinhavre.com | 55-65 | **392** | 1,162 | 47,564 |
| calgaryhomes.ca | N/A | **316** | 1,016 | 5,792 |
| calgaryhousefinder.ca | N/A | **257** | 433 | 1,473 |

**SERP Dominance:** V2 confirmed that `justinhavre.com` and `calgaryhomes.ca` appear in **21 of 25** target keyword SERPs, establishing a clear benchmark for success.

---

## 8. Backlinks

| Metric | V1 (Manual) | V2 (API) |
| :--- | :--- | :--- |
| **Total Backlinks** | 7 | **280** |
| **Referring Domains** | 5-15 (Est) | **209** |
| **Domain Rating** | 5-10 (Est) | **45** (DFS Scale) |

**V2 Insight:** While the count is higher than estimated, the quality is low. Many links come from link shorteners (`urls-shortener.eu`) and automated syndication, which provides little "link juice."

---

## 9. PageSpeed Performance (V2 Only)

V1 provided no performance data. V2 revealed significant mobile bottlenecks.

| Page Type | Mobile Score | Desktop Score | LCP (Mobile) | TTFB |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | 79/100 | 95/100 | **4,577ms** | 54ms |

**Impact:** The Mobile LCP of 4.577s is above the 4.0s "Poor" threshold, making this a high-priority technical fix.

---

## 10. Domain Authority Metrics

| Domain | V1 Estimated (0-100) | V2 DataForSEO (0-1000) |
| :--- | :--- | :--- |
| sellingcalgarycastles.com | 5-10 | 45 |
| justinhavre.com | 55-65 | 392 |

*Note: The jump in scores reflects a scale change, not a site improvement.*

---

## 11. Local SEO

Both audits confirmed a massive "Trust Gap."
*   **Google Reviews:** 0 (Client) vs. 2,600+ (Justin Havre).
*   **Schema:** 91.7% of pages miss `LocalBusiness` or `RealEstateAgent` markup.
*   **V2 Confirmation:** No GBP optimization or local structured data found.

---

## 12. Action Plan: What Changed Between V1 and V2

| Action Item | In V1? | In V2? | Priority Change |
| :--- | :--- | :--- | :--- |
| **HSTS & Security Headers** | Yes | Yes | High (Confirmed) |
| **Schema Markup** | Yes | Yes | High (Confirmed) |
| **Mobile LCP Fix** | No | **Yes** | **New - High** |
| **Remove US-Centric Content** | No | **Yes** | **New - High** |
| **Open Graph Tags** | No | **Yes** | Medium |
| **Sierra Interactive Tuning** | No | **Yes** | **New - Platform Specific** |

---

## 13. New Findings (V2 Only)
*   **Mobile LCP Issue:** Homepage mobile performance is borderline failing.
*   **Content Errors:** Found US-specific terminology (PMI, FHA) in Alberta real estate content.
*   **Dual H1s:** Homepage has two H1 tags, diluting keyword focus.
*   **OG Tags:** 32 pages are missing Open Graph tags for social media.
*   **Platform Correction:** Confirmed site runs on Sierra Interactive, not RealtyPress.

---

## 14. Confirmed Findings (Both Audits)
*   **Visibility:** 0 rankings for all 25 core keywords.
*   **Security:** 100% missing HSTS and security headers.
*   **Structure:** Title and meta description lengths need adjustment on ~10 pages.
*   **Schema:** Massive lack of structured data across the site.

---

## Summary Scorecard

| Dimension | V1 (Qualitative) | V2 (Quantitative) | Verdict |
| :--- | :--- | :--- | :--- |
| **Overall Grade** | D+ | D+ | Unchanged |
| **Data Confidence** | Low | High | Major Upgrade |
| **Technical Depth** | Basic | Advanced | Major Upgrade |
| **Content Insight** | General | Specific (US-centric issue) | Major Upgrade |
| **Performance** | Unknown | 79/100 (Mobile) | New Priority |

**NOTE ON DATA SCALE:** The domain rating figures between V1 and V2 are not directly comparable. V1 used estimated Ahrefs-style ratings (0-100 scale). V2 uses DataForSEO's rank metric which uses a 0-1000 scale. The improvement from "DR 5-10" to "DR 45" reflects a methodology change, not a site improvement or authority gain.
