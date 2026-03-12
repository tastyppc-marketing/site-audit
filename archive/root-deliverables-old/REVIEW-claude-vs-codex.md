# Review: Claude vs Codex SEO Outputs — livingparkcityutah.com
**Reviewer:** Code Reviewer Agent
**Date:** March 1, 2026
**Reference standards:** /mnt/c/Dev/site audit/results/seo-best-practices-2026.md, /mnt/c/Dev/site audit/results/keyword-research.md

---

## Scoring Rubric

Each pair is scored 1–10 on four dimensions:
- **SEO Optimization** — keyword targeting, character compliance, technical correctness, schema standards
- **Content Quality** — accuracy, depth, brand voice, uniqueness, actionability for the reader
- **Actionability** — ease of deployment, clear instructions, self-contained, minimal editing needed
- **2026 Compliance** — E-E-A-T signals, AI Overview optimization, structured data currency, no deprecated patterns

Scores of 80+ confidence only; findings below 80 confidence are omitted per policy.

---

## PAIR 1: Meta Tags
**Files:** claude-meta-tags.md vs codex-meta-tags.md

### Side-by-Side Summary

| Dimension | Claude | Codex |
|-----------|--------|-------|
| Character counts shown in file | Yes — every title and description includes explicit character count in parentheses | No — "validated" noted in footer only, no per-row counts |
| Title format | Em dash separator, lowercase "Utah" style, brand voice integrated | Hyphen separator, consistent action-verb tone |
| Coverage | 61 pages (missing /contact/thank-you/, /upper-deer-valley-resort/) | 62 pages (includes both missing pages) |
| Brand metrics in titles/descriptions | Yes — "$70M+ sold," "97% of asking price" (unverified claims, see issue below) | No brand performance claims in meta text |
| Title length compliance | Several titles fall 44–47 chars — within acceptable range but on short side | Titles appear within 50–60 range per implementation note |
| Blog /paying-for/ fix | Yes — acknowledged and fixed with a clean, intent-matched version | Yes — acknowledged and fixed |
| Uniqueness of community descriptions | 28 unique community descriptions confirmed | 28 unique community descriptions confirmed |
| Implementation notes | Yes — 4 concrete critical fixes listed, og:title guidance included | Yes — 4 implementation notes listed |

### Scores

| Dimension | Claude | Codex |
|-----------|--------|-------|
| SEO Optimization | 9 | 8 |
| Content Quality | 8 | 8 |
| Actionability | 9 | 8 |
| 2026 Compliance | 9 | 8 |
| **Average** | **8.75** | **8.00** |

### Reasoning

**Claude advantages:**
- Explicit character counts per row make QA trivial and eliminate ambiguity. Codex states "character counts validated" globally but provides no per-row evidence, meaning the implementer must re-verify.
- Implementation notes are more specific: Claude explicitly calls for og:title/og:description on the homepage, flags the single-H1 issue, and explicitly names the template text that needs replacing.
- Title separator (em dash) is more visually distinct in SERPs than hyphen.

**Codex advantages:**
- 62-page coverage is complete; Claude's 61-page set omits two pages (/contact/thank-you/ and /upper-deer-valley-resort/) that exist in the sitemap.
- Action-oriented CTA language in descriptions is marginally stronger ("Schedule a private tour," "Book a showing today") for click-through rate.

### Errors / Issues to Flag

**[CONFIDENCE: 88] IMPORTANT**
File: /mnt/c/Dev/site audit/deliverables/claude-meta-tags.md — Multiple entries
Issue: Claude's descriptions include unverified brand performance claims: "$70M+ sold" (about page, free market analysis page) and "97% of asking price" (sellers page). Google's content guidelines require that all claims matching schema or on-page content be accurate and verifiable. These figures should be confirmed against actual transaction records before publication. If inaccurate, they create both an E-E-A-T risk (misleading claims) and a potential AggregateRating/Review consistency issue.
Fix: Verify both figures with the client before using in live meta descriptions.

**[CONFIDENCE: 83] IMPORTANT**
File: /mnt/c/Dev/site audit/deliverables/claude-meta-tags.md — Line 64
Issue: `/property-search/site-map/` title is only 35 characters ("Park City Property Search Site Map"), well below the 50-character floor stated in the file's own requirements. This under-utilizes available SERP real estate.
Fix: Expand to something like "Park City Property Search Sitemap — All Pages" (48 chars).

### Winner: CLAUDE
Reason: Explicit per-row character count validation, more complete implementation guidance, and stronger E-E-A-T framing outweigh Codex's two-page coverage advantage. The two missing Codex pages can be added trivially using the established Claude format. The missing pages from Claude's set are a gap but a minor one given the implementation note approach.

---

## PAIR 2: Schema Markup
**Files:** claude-schema-markup.md vs codex-schema-markup.md

### Side-by-Side Summary

| Dimension | Claude | Codex |
|-----------|--------|-------|
| Homepage schema types | Organization + RealEstateAgent + WebSite + SearchAction (in one @graph) | Organization + RealEstateAgent + WebSite + SearchAction (split into two separate script blocks) |
| Person schema on homepage | Yes — Tisha and Cam as separate Person nodes linked from RealEstateAgent via sameAs/member | Yes — Tisha and Cam as Person nodes in 1a block |
| AggregateRating | Separate section (#8), explicit warning to update to real data | Embedded in homepage 1a block, uses placeholder values (4.9 / 127) |
| About page | Person x2 + RealEstateAgent with member links | Person x2 + Organization; @id consistency issue (see error below) |
| Contact page | Full ContactPoint, GeoCoordinates, hasMap, hours | Hours present; missing ContactPoint, GeoCoordinates, hasMap |
| Community template | Article + BreadcrumbList, filled examples for Old Town and Promontory | Article + BreadcrumbList, correct breadcrumb path |
| Blog template | BlogPosting + BreadcrumbList, ImageObject with dimensions, keywords field, filled example | BlogPosting + BreadcrumbList; no ImageObject dimensions, no keywords field |
| FAQPage — buyers | 5 Q&A pairs with specific data (median price $1.8M, closing cost dollar example) | 4 Q&A pairs; one answer has encoding corruption (see critical error below) |
| FAQPage — sellers | 4 Q&A pairs with specific data (6–8% cost, days-on-market range) | 3 Q&A pairs; less specific |
| Ski-in ski-out FAQPage | Yes — separate dedicated FAQPage for /buyers/park-city-ski-in-ski-out-homes/ | No — not included |
| Deprecated patterns | None | "priceRange": "4165841658" — critical error (see below) |
| Implementation checklist | Yes — prioritized table with validation URL | No checklist |
| URL consistency | Uses www.livingparkcityutah.com consistently | Uses livingparkcityutah.com (no www) consistently — inconsistency risk if site redirects to www |

### Scores

| Dimension | Claude | Codex |
|-----------|--------|-------|
| SEO Optimization | 9 | 6 |
| Content Quality | 9 | 7 |
| Actionability | 9 | 7 |
| 2026 Compliance | 9 | 6 |
| **Average** | **9.00** | **6.50** |

### Errors / Issues to Flag

**[CONFIDENCE: 97] CRITICAL**
File: /mnt/c/Dev/site audit/deliverables/codex-schema-markup.md — Line 310
Issue: `"priceRange": "4165841658"` on the Contact page RealEstateAgent schema. This is clearly a data corruption artifact — a phone number or random numeric string has been injected into the priceRange field, which expects a string like "$$$" or "$100–$500". This will cause schema validation errors in Google Rich Results Test and will not represent the business correctly to Google or AI crawlers.
Fix: Replace with `"priceRange": "$$$"` to match the value used on the homepage schema.

**[CONFIDENCE: 92] CRITICAL**
File: /mnt/c/Dev/site audit/deliverables/codex-schema-markup.md — Lines 513–516
Issue: The FAQPage for /buyers/ contains corrupted answer text: "range from approximately 00,000 in areas like Kimball Junction to over million in Deer Valley." The dollar signs and numbers have been stripped from the answer, leaving nonsensical text. This schema will not correctly inform AI systems about Park City pricing and could embarrass the client if served in AI Overviews.
Fix: Rewrite to: "range from approximately $600,000 in areas like Kimball Junction to over $5 million in Deer Valley and Empire Pass communities."

**[CONFIDENCE: 91] CRITICAL**
File: /mnt/c/Dev/site audit/deliverables/codex-schema-markup.md — Lines 537–541
Issue: Second corrupted answer in the ski-in ski-out FAQ: "prices typically starting above million." Again, dollar amount was stripped. This renders the FAQ answer meaningless for AI comprehension purposes.
Fix: Rewrite to: "prices typically starting above $2 million."

**[CONFIDENCE: 85] IMPORTANT**
File: /mnt/c/Dev/site audit/deliverables/codex-schema-markup.md — About page schema
Issue: Person @id URIs differ between the homepage (e.g., `#tisha-digman`) and the about page (e.g., `/about/#tisha-digman`). In JSON-LD, @id values are treated as entity identifiers — using two different URIs for the same person prevents search engines and AI systems from recognizing them as the same entity. This breaks the linked-data graph that enables E-E-A-T signals to be aggregated across pages.
Fix: Standardize all Person @id values to use the homepage-anchored URI: `https://livingparkcityutah.com/#tisha-digman` and `https://livingparkcityutah.com/#cam-schiedel` across every page.

**[CONFIDENCE: 82] IMPORTANT**
File: /mnt/c/Dev/site audit/deliverables/claude-schema-markup.md — Lines 37-40
Issue: Claude's Organization schema includes social profile URLs (Facebook, Instagram, LinkedIn, YouTube, Zillow) using placeholder slugs like `tishaandcam` and `TishaDigman` that have not been confirmed as real URLs. If any of these are wrong, sameAs links pointing to non-existent profiles will not provide the intended authority signal and could generate crawl errors.
Fix: Confirm all sameAs URLs are live and correct before publishing.

### Winner: CLAUDE (by a wide margin)
Reason: Codex schema has three critical correctness errors — a corrupted priceRange value, two corrupted FAQ answers with stripped dollar amounts, and broken @id consistency across pages. These are not stylistic issues; they are technical defects that will cause validation failures and degrade AI comprehension of the site. Claude's schema is production-ready with clear implementation instructions and richer FAQ coverage. The only actionable gap in Claude's schema is to verify the social profile placeholder URLs before publishing.

---

## PAIR 3: Community Pages
**Files:** claude-community-pages.md vs codex-community-pages.md

### Side-by-Side Summary

| Dimension | Claude | Codex |
|-----------|--------|-------|
| Pages covered | 4: Deer Valley (combined Lower + Upper), Old Town, Park Meadows, Promontory | 4: Deer Valley, Old Town, Park Meadows, Promontory |
| Approximate word count per page | 1,000–1,400 words | 1,000–1,300 words |
| Structure | Meta title/description at top, prose H2s, price range tables, market snapshot, lifestyle, schools, CTAs | H1, Overview, Location, Property Types & Price Ranges, Lifestyle, Schools, Dining, Why Buy with T&C, FAQ, Internal Links, CTA |
| Price range presentation | Prose + structured table format | Prose embedded in sections |
| FAQ section | No dedicated FAQ block | Yes — 4 Q&As per page, written for AI Overview citation |
| Internal links | Yes — at end of each page | Yes — dedicated "Internal Link Suggestions" section per page |
| Keyword integration | Moderate — natural flow, target keywords noted at the top | Strong — primary keywords bolded in body text throughout |
| School district details | Yes | Yes |
| East Village expansion mentioned | Yes — on Deer Valley page | Yes — on Deer Valley page |
| Promontory golf course accuracy | Describes "two Jack Nicklaus courses" in description but post body notes Jack Nicklaus Signature + Pete Dye Canyon (minor inconsistency) | Correctly describes Jack Nicklaus Signature + Pete Dye 9-hole + Short Course |
| CTAs | Included, linking to /contact/ | Included, linking to /contact/ |
| Brand voice | Luxury, polished, Sotheby's-aligned | Conversational, locally grounded, advisory |

### Scores

| Dimension | Claude | Codex |
|-----------|--------|-------|
| SEO Optimization | 8 | 9 |
| Content Quality | 9 | 8 |
| Actionability | 8 | 9 |
| 2026 Compliance | 8 | 9 |
| **Average** | **8.25** | **8.75** |

### Reasoning

**Codex advantages:**
- Dedicated FAQ sections per page are aligned with 2026 best practices: structured Q&A content improves AI Overview citation probability (per seo-best-practices-2026.md: "semantic completeness 8.5/10+ = 4.2x more likely AI citation"). Claude's pages lack this.
- Keyword bolding in body text helps on-page semantic signals for both traditional search and AI parsing.
- Promontory golf course attribution is accurate (Pete Dye 9-hole + Jack Nicklaus Signature + Short Course). Claude's Promontory description inconsistency could mislead buyers.
- Structure is more consistent and predictable across all 4 pages, making it easier for a developer to template.

**Claude advantages:**
- Price range tables are cleaner and easier to scan for buyers and for schema-adjacent structured data.
- Market snapshot sections are stronger and more specific (includes supply/demand context, price-per-segment breakdowns).
- Brand voice is more strongly aligned with Sotheby's luxury positioning.

### Errors / Issues to Flag

**[CONFIDENCE: 85] IMPORTANT**
File: /mnt/c/Dev/site audit/deliverables/claude-community-pages.md — Promontory page
Issue: The Promontory meta description states "two Jack Nicklaus golf courses" but the page body correctly identifies the courses as a Jack Nicklaus Signature 18-hole and a Pete Dye Canyon Course 9-hole. The meta description misattributes both courses to Nicklaus, which is factually incorrect and could mislead buyers doing golf-focused research.
Fix: Update Promontory meta description to: "Promontory is Park City's largest private community with a Jack Nicklaus Signature course, Pete Dye 9-hole, ski access, and mountain estates starting in the millions."

### Winner: CODEX (narrow)
Reason: The dedicated FAQ blocks per page are a meaningful 2026 SEO differentiator that Claude's pages lack. Given that livingparkcityutah.com has zero organic visibility (per keyword research), AI Overview citation is a realistic near-term traffic source, and structured Q&A content is the strongest lever to improve AI comprehension and citation probability. Codex's FAQ sections deliver this; Claude's do not. The gap in brand voice polish is real but secondary. The Promontory factual error in Claude is a material concern.

---

## PAIR 4: Blog Posts
**Files:** claude-blog-posts.md vs codex-blog-posts.md

### Side-by-Side Summary

| Dimension | Claude | Codex |
|-----------|--------|-------|
| Posts | 4: Market Update Spring 2026, Best Neighborhoods, Is Park City RE a Good Investment, Ski-In Ski-Out Guide | 4: Market Update Spring 2026, Best Neighborhoods, Is Park City RE a Good Investment, Ski-In Ski-Out Guide |
| Average word count | ~950–1,150 words per post | ~850–1,050 words per post |
| Meta description compliance | 3 of 4 descriptions include "(trim to 155)" notes indicating they are over-length in the deliverable itself | All 4 descriptions appear within length range |
| FAQ/Q&A blocks in posts | No — posts end at CTA without a Q&A block | Yes — every post includes a dedicated Q&A section (3–4 questions) |
| Internal links | Yes — 3–4 per post, community-level | Yes — 4–6 per post, more varied (buyers, sellers, community pages) |
| Author attribution | Tisha Digman (byline in post body) | Tisha Digman and Cam Schiedel (both credited) |
| E-E-A-T signals | Strong — "300 transactions," "$70M+," first-person agent perspective, "I" voice | Strong — "we" voice throughout, current market data, price ranges by neighborhood |
| Market data specificity | High — mentions specific price segments ($1M–$3M, $3M+), seasonal patterns, specific HOA cost ranges | High — provides specific price ranges by neighborhood in the market update post |
| Ski-in ski-out post accuracy | Correctly identifies key communities; price table is well-structured | Provides three-tier access framework (true SIO, premium access, proximity); more operationally useful for buyer decision-making |
| Tone | First-person advisory, "I tell every buyer..." style | First-person plural, "we routinely advise..." style, slightly more professional |
| Original angle | Investment post addresses "honest risks" section — nuanced and trustworthy | Investment post addresses STR regulatory uncertainty with specific rate bands ($400–$3,000+/night) |
| 2026 content gaps addressed | Market update directly addresses Deer Valley East Village, spring 2026 timing | Same — all four posts target keyword research gaps confirmed in the audit |

### Scores

| Dimension | Claude | Codex |
|-----------|--------|-------|
| SEO Optimization | 8 | 9 |
| Content Quality | 9 | 9 |
| Actionability | 8 | 9 |
| 2026 Compliance | 8 | 9 |
| **Average** | **8.25** | **9.00** |

### Reasoning

**Codex advantages:**
- FAQ/Q&A blocks in every post match the "People Also Ask" format targeted in keyword research and align with 2026 AI Overview optimization strategy. This is the most important structural differentiator.
- All 4 meta descriptions appear to be within the 120–155 character range. Claude's file acknowledges three descriptions exceed the limit and requires the implementer to trim them before use — creating deployment friction.
- Author credits both agents (Tisha and Cam), which is more accurate to the team's positioning.
- Investment post includes specific STR rate bands ($400–$3,000+/night) and regulatory-layer breakdown (city vs county vs HOA) that is directly actionable for buyer decision-making.
- Ski-in ski-out post's three-tier access framework (true SIO / premium access / proximity) is a cleaner analytical structure for buyers evaluating marketing claims.

**Claude advantages:**
- Slightly higher average word count providing more semantic completeness for search and AI.
- "Honest risks" section in the investment post (HOA carrying costs, STR regulatory uncertainty, concentration risk) is highly trust-building and consistent with E-E-A-T principles — buyers reading this will trust the advice.
- First-person "I" voice is more distinctive and personal, which supports the individual agent brand voice.

### Errors / Issues to Flag

**[CONFIDENCE: 88] IMPORTANT**
File: /mnt/c/Dev/site audit/deliverables/claude-blog-posts.md — Posts 1, 3, 4
Issue: Three of four meta descriptions are explicitly marked as over the 155-character limit with manual trim instructions ("trim to 155"), e.g., Post 1: "(158 chars — trim to 155)", Post 3: "(169 chars — trim to 155)", Post 4: "(166 chars — trim to 155)". The deliverable was supposed to provide ready-to-implement content; requiring the implementer to manually trim character counts adds an error-prone step and indicates the character count validation step was incomplete.
Fix: The already-trimmed versions are provided inline in parentheses for Posts 2, 3, and 4 — use those. For Post 1, trim: "Where is the Park City housing market in spring 2026? Tisha & Cam break down inventory, pricing trends, and what buyers and sellers need to know." (147 chars).

### Winner: CODEX
Reason: The FAQ/Q&A blocks in every post are a decisive structural advantage aligned with the site's most pressing need: zero organic visibility means AI Overview citation and "People Also Ask" capture are the fastest path to initial traffic. Codex delivers this pattern across all four posts; Claude does not. The meta description over-length errors in Claude's file represent a quality control failure on a deliverable that should be publish-ready. Content quality is effectively tied — both sets of posts are well-researched and credible.

---

## OVERALL SUMMARY

| Category | Winner | Claude Avg | Codex Avg |
|----------|--------|-----------|-----------|
| Meta Tags | Claude | 8.75 | 8.00 |
| Schema Markup | Claude | 9.00 | 6.50 |
| Community Pages | Codex | 8.25 | 8.75 |
| Blog Posts | Codex | 8.25 | 9.00 |
| **Overall** | **Tie: 2–2** | **8.56** | **8.06** |

---

## FINAL RECOMMENDATION

**Neither output should be deployed as-is without targeted fixes.**

**Recommended approach: Claude base + Codex enhancements**

1. **Meta Tags**: Use Claude's output as the base (explicit character counts, superior implementation notes). Add Codex's two missing pages (/contact/thank-you/, /upper-deer-valley-resort/) by following Claude's format. Verify the "$70M+" and "97% of asking price" claims before deploying.

2. **Schema Markup**: Use Claude's output. It is production-ready. Do NOT use Codex schema until the three critical errors (corrupted priceRange, two corrupted FAQ answer strings, @id inconsistency) are fixed. Verify Claude's social profile sameAs URLs are live before publishing.

3. **Community Pages**: Use Codex's structural template (Location, Property Types, Lifestyle, Schools, Dining, FAQ, Internal Links, CTA) but incorporate Claude's price range tables and market snapshot sections. Fix the Promontory golf course attribution error in Claude's meta description before using it.

4. **Blog Posts**: Use Codex's posts as the base — all four meta descriptions are within range, FAQ blocks are included, and both agents are credited. Optionally, incorporate Claude's "Honest Risks" section from the investment post and the ski-in ski-out price table for additional depth.

---

## CRITICAL ERRORS REQUIRING IMMEDIATE FIX (Codex Schema)

These three errors in codex-schema-markup.md must be fixed before any schema deployment:

1. **Line 310** — `"priceRange": "4165841658"` → Replace with `"priceRange": "$$$"`
2. **Lines 513–516** — FAQ answer missing dollar amounts: "range from approximately 00,000... to over million" → Fix to use actual dollar values
3. **Lines 537–541** — FAQ answer missing dollar: "starting above million" → Fix to "starting above $2 million"
4. **About page Person @id** — Standardize all Person @id values to `https://livingparkcityutah.com/#tisha-digman` / `#cam-schiedel` across all pages

