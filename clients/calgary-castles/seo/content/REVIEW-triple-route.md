# Triple-Route LLM Review: Claude vs. Codex/GPT vs. Gemini

**Client:** Neil Rowlandson / Calgary Castles Team / CIR Realty
**Reviewed:** 2026-04-01
**Deliverables Reviewed:** 12 (4 categories x 3 LLMs)
**Reviewer:** Senior SEO Quality Review (automated)
**Reference Files:** FINAL-AUDIT-REPORT.md, seo-best-practices-2026.md, keyword-data.json

---

## Scoring Key

Each LLM is scored 1-10 on four dimensions per deliverable:

1. **SEO Optimization** -- keyword targeting, character compliance, technical correctness
2. **Content Quality** -- accuracy, depth, brand voice, uniqueness, Canadian/Calgary specificity
3. **Actionability** -- ease of deployment, clear instructions, minimal editing needed
4. **2026 Compliance** -- E-E-A-T signals, AI Overview optimization, no deprecated patterns, March 2026 update alignment

Confidence threshold: issues flagged only at 80%+ confidence.

---

## DELIVERABLE 1: META TAGS

### Claude (meta-tags.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 9 | Front-loads primary keywords. Includes DataForSEO volume table mapping keywords to pages. Character counts verified in parentheses for every entry. Every title 44-55 chars, every description 119-153 chars. "Calgary" in every title and description. |
| Content Quality | 9 | Canadian English ("neighbourhoods", "favourite"). Replaced PMI with CMHC, escrow with Alberta land titles. Detailed US-to-Canadian terminology mapping table. Specific community amenities in every community description (private beach, ravine views, High Street). |
| Actionability | 10 | Current vs. New side-by-side tables for every page. Priority implementation order (P1-P4). Sierra Interactive platform-specific instructions. OG tag templates. Character count summary table. Ready to copy-paste. |
| 2026 Compliance | 8 | Brand pattern with Neil Rowlandson / CIR Realty. No deprecated patterns. Lacks explicit AI Overview optimization signals but solid foundation. |

**Total: 36/40**

**Strengths:**
- Most thorough documentation of any meta tags deliverable (character counts, volume data, priority matrix)
- Current-vs-new comparison makes client review trivial
- US terminology fixes documented with before/after table
- Sierra Interactive deployment instructions included

**Weaknesses:**
- Some titles on the short side (44 chars for some buyer pages)
- Brand alternates between "Neil Rowlandson" and "CIR Realty" -- could be more consistent

---

### Codex/GPT (codex-meta-tags.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Every title includes "Calgary Castles" branding. Good keyword placement. Character counts within range (50-60 titles, 120-155 descriptions). Claims all 36 titles in 50-60 range and all 36 descriptions in 120-155 range. |
| Content Quality | 8 | Canadian terminology fixes applied (CMHC, trust account, land titles). Uses "neighbourhoods" in some places. Replaced escrow with "trust account" -- excellent Alberta-specific choice. Each community page gets unique amenity description. |
| Actionability | 7 | Clean table format but lacks current-vs-new comparison. No priority order. No Sierra Interactive instructions. No OG tag recommendations. Requires more manual work to implement. |
| 2026 Compliance | 7 | Consistent "Calgary Castles" branding throughout. No E-E-A-T-specific signals beyond branding. No implementation notes for schema or structured data alignment. |

**Total: 30/40**

**Strengths:**
- Consistent "Calgary Castles" brand presence in every title (strong brand building)
- Clean, uniform formatting
- Good Canadian terminology ("trust account" for escrow is a precise Alberta choice)
- Addressed the broken /contact/thank-you/ page with a recommended tag for post-fix deployment

**Weaknesses:**
- No current-vs-new comparison (harder for client to see the change)
- No priority implementation order
- No deployment instructions for Sierra Interactive
- No OG tag or social sharing recommendations
- Missing DataForSEO volume data alignment

---

### Gemini (gemini-meta-tags.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 7 | Titles all include "Calgary Castles". Character compliance claimed (50-60 titles, 120-155 descriptions). Keywords present but not as precisely front-loaded as Claude. |
| Content Quality | 6 | Claims to remove US-centric terms but uses "neighborhoods" (US spelling) in community hub title and description instead of "neighbourhoods". Uses "Favorite" in property tracker description -- US spelling, not Canadian. Community descriptions are unique but less specific about amenities. |
| Actionability | 6 | Table format but no current-vs-new comparison. No priority order. No deployment instructions. No OG recommendations. Summary section is thin. |
| 2026 Compliance | 6 | "Calgary Castles" branding present. Exclamation marks in CTAs ("View now!", "Start now!") feel salesy and may reduce perceived E-E-A-T authority. No structured implementation guidance. |

**Total: 25/40**

**Strengths:**
- Organized by page group (Core, Property Search, Communities, etc.)
- Every description has a CTA

**Weaknesses:**
- **FLAGGED: US spelling errors** -- "neighborhoods" and "Favorite" used instead of Canadian "neighbourhoods" and "favourite". This directly contradicts the stated goal of removing US-centric content and is factually wrong for a Calgary audience. (90%+ confidence)
- Exclamation marks throughout descriptions ("View now!", "See your new home today!") are not ideal for E-E-A-T and feel like template copy
- Less specific community amenities compared to Claude and Codex
- No volume data, no priority matrix, no deployment instructions
- **FLAGGED: Property tracker description says "Save Favorite" -- should be "Save Favourite"** (95% confidence)

---

### META TAGS WINNER: Claude

**Reasoning:** Claude delivers the most complete, deployment-ready meta tags package. The current-vs-new format, DataForSEO volume mapping, priority matrix, Sierra Interactive instructions, OG tag templates, Canadian English consistency, and US-terminology replacement table collectively make this the clear winner. Codex is solid but lacks deployment tooling. Gemini has factual Canadian English errors that undermine its credibility for a Calgary real estate client.

---

## DELIVERABLE 2: SCHEMA MARKUP

### Claude (schema-markup.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 9 | Covers all essential schema types: Organization, RealEstateAgent, Person, WebSite, SearchAction, LocalBusiness, Article, BlogPosting, BreadcrumbList, FAQPage, AggregateRating. Proper @graph structure with consistent @id references. |
| Content Quality | 10 | FAQ answers contain specific CREB market data (benchmark $560,500, detached $734,300, etc.). Down payment rules cite current Canadian thresholds ($500K/$1.5M tiers). Closing costs cite Alberta-specific fees. Explicitly warns about fabricated review risks. Notes Sunday hours need client confirmation. |
| Actionability | 9 | Page-by-page injection instructions. Notes about Sierra Interactive Custom Code Injection. Validation tool links (Rich Results Test, Schema.org Validator). Warns about FAQ rich result limitations. Notes about dateModified freshness. Implementation notes comprehensive. |
| 2026 Compliance | 9 | FAQ schema included with detailed Alberta-specific content. E-E-A-T signals via hasCredential, knowsAbout, author bylines. AggregateRating with explicit warning about spam risk. Proper dateModified handling. |

**Total: 37/40**

**Strengths:**
- Most comprehensive FAQ content of any schema deliverable -- buyer FAQ has 6 detailed questions with specific dollar figures, program details, and timelines
- Seller FAQ includes Calgary-specific days-on-market data and commission guidance
- Explicitly warns about AggregateRating spam risk and self-serving review limitation
- Sunday hours flagged as needing client confirmation -- good attention to detail
- FAQ answers are substantial enough to serve as both schema and on-page content

**Weaknesses:**
- No Speakable schema (recommended by best-practices research for AI Overview optimization)
- Only 2 community examples (Auburn Bay, Cranston) -- could provide more

**FLAGGED (low confidence, ~70%):** The geo coordinates 51.0447, -114.0719 appear to be generic downtown Calgary coordinates rather than the actual CIR Realty office at 703-64th Ave SE. The actual office coordinates should be approximately 50.998, -114.063. This affects all three LLMs identically (likely from shared reference data).

---

### Codex/GPT (codex-schema-markup.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Same core schema types covered: Organization, RealEstateAgent, WebSite, SearchAction, LocalBusiness, Person, Article, BlogPosting, BreadcrumbList, FAQPage, AggregateRating. Template provided for community and blog pages. |
| Content Quality | 7 | FAQ content is present but less detailed than Claude. Average home price cited as "approximately CAD 641,000" (reasonable). Closing costs FAQ has formatting issue -- dollar signs missing from "$1,000-$1,000" (appears as ",000-,000"). Community template includes inLanguage: "en-CA" -- good detail. |
| Actionability | 7 | Includes template with placeholders ({PAGE_URL}, {COMMUNITY_NAME}, etc.) -- useful for scaling. Validation link provided. But wraps JSON in `<script>` tags inside the markdown code blocks, which could confuse implementers about what goes where. |
| 2026 Compliance | 7 | Person schema includes REALTOR trademark symbol in jobTitle. Template includes inLanguage and wordCount fields. FAQ schema present. AggregateRating includes sample Review block -- risky since the sample review appears fabricated. |

**Total: 29/40**

**Strengths:**
- Reusable templates with clear placeholders for community and blog pages
- `inLanguage: "en-CA"` included in templates -- good for internationalization signals
- `wordCount` field in BlogPosting template -- nice detail
- parentOrganization relationship to CIR Realty properly modeled

**Weaknesses:**
- **FLAGGED: Logo URL wrong** -- uses "tasty-ppc-logo.svg" which appears to be the agency's logo, not Calgary Castles' logo. The correct logo should be "site-logo-1708132305286.png" as identified by Claude. (90%+ confidence)
- **FLAGGED: AggregateRating includes a sample fabricated review** ("Sample Client", "Neil was incredible...") with a specific date. Google explicitly warns against fabricated review markup. This should be removed. (95% confidence)
- **FLAGGED: Closing costs FAQ text shows ",000-,000" instead of "$1,000-$1,000"** -- formatting/escape error in the JSON string. (95% confidence)
- FAQ content is thinner and less Calgary-specific than Claude's
- `image` field in RealEstateAgent points to "about/#person" which is a fragment URI, not an image URL

---

### Gemini (gemini-schema-markup.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Same structure as Codex (likely shared base prompt). All core types present. Added hasOccupation with skills array -- unique detail. Added CREB membership in memberOf. Uses additionalType for LocalBusiness. |
| Content Quality | 8 | Person schema is the most detailed of all three -- includes givenName, familyName, birthPlace (Lakeview, Calgary), homeLocation, hasOccupation with skills array. LocalBusiness has full description. Community template includes Place > containedInPlace nesting. |
| Actionability | 7 | Good implementation notes about verifying CREB membership before deploying. Notes about license number placeholder. Clear injection instructions per page. Template with placeholders provided. |
| 2026 Compliance | 8 | hasCredential references RECA licensing. Person schema extremely detailed for E-E-A-T. BreadcrumbList on About page. Community schema uses Place > containedInPlace for geographic nesting. |

**Total: 31/40**

**Strengths:**
- Most detailed Person schema -- includes birthPlace, homeLocation, hasOccupation, explicit RECA licensing
- CREB membership modeled (with proper caveat about verifying status)
- additionalType approach for LocalBusiness is technically valid
- Implementation notes include license number placeholder -- thoughtful for E-E-A-T

**Weaknesses:**
- **FLAGGED: Same wrong logo URL as Codex** -- "tasty-ppc-logo.svg" instead of actual site logo. (90%+ confidence)
- **FLAGGED: birthPlace listed as "Lakeview, Calgary"** -- this cannot be verified from audit materials. The audit report does not confirm where Neil was born. This should be verified with the client before deploying. (85% confidence)
- **FLAGGED: Uses "neighborhoods" (US spelling) in knowsAbout array** instead of "Neighbourhoods". (90% confidence)
- Wraps JSON in `<script>` tags inside markdown code blocks (same issue as Codex)
- No FAQ schema content provided inline (refers to templates only, unlike Claude which provides full FAQ answers)
- Fewer concrete examples than Claude

---

### SCHEMA MARKUP WINNER: Claude

**Reasoning:** Claude wins decisively on FAQ content quality (specific CREB data, Canadian program details, realistic dollar figures), the correct logo URL, no fabricated reviews, proper warnings about AggregateRating risks, and the most deployment-ready implementation notes. Gemini's Person schema is the most detailed and should be merged into the final version. Codex has formatting errors and a fabricated sample review that would need cleanup.

---

## DELIVERABLE 3: COMMUNITY PAGES

### Claude (community-pages.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 9 | Keyword optimization guide with primary/secondary/LSI targets and density ranges per page. H1 tags include "[Community] Homes for Sale" pattern. Price tables, FAQ sections, internal link suggestions. Each page 1,000-1,500 words. |
| Content Quality | 9 | Specific Calgary data throughout: avg $641K, median $572.5K. Developer names (Brookfield Residential). School names (Auburn Bay School K-4, Dr. George Stanley 5-9, Holy Family K-9). Specific distances (22 km to downtown). Property tax estimates ($3,800-$4,600). Residents' Association details. |
| Actionability | 9 | Complete pages ready for deployment. URL slugs defined. Meta titles/descriptions with char counts. Keyword density guides. Internal link suggestions with URL paths. CTA with phone number. |
| 2026 Compliance | 8 | Author byline with credentials. FAQ sections for AI Overview extraction. Data tables for structured parsing. First-person experience signals ("over 20 years of Calgary real estate experience and a background in banking"). |

**Total: 35/40**

**Strengths:**
- Most data-rich community pages: specific price ranges by property type, school names by school board, property tax estimates
- Auburn Bay page includes builder names (Brookfield, Cardel, Morrison, Jayman Built)
- FAQ answers directly address real buyer concerns (lake access, property taxes, growth status)
- Each page has internal link suggestions mapped to actual URL paths
- Keyword density guides with danger-zone warnings

**Weaknesses:**
- Only 4 communities covered (Auburn Bay, Cranston, Mahogany, McKenzie Towne) -- same as the other LLMs
- Voice is expert and authoritative but slightly clinical compared to Gemini's warmer tone
- Could use more first-person "I've sold homes here" style language for E-E-A-T

---

### Codex/GPT (codex-community-pages.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Keywords naturally woven into body content. FAQ sections present. Primary/secondary/LSI keyword guidance tables. Each page is substantial (1,200+ words). H1 includes "[Community] Real Estate: Homes for Sale in [Community], Calgary". |
| Content Quality | 8 | Strong local detail: Auburn Bay population ~15,000, development started ~2006. Mentions Seton, South Health Campus, YMCA. McKenzie Towne: development started ~1995, "new urbanist" terminology. Uses "centrepiece" (Canadian spelling). Good comparative references between communities. |
| Actionability | 7 | Complete page copy ready for deployment. Meta titles/descriptions included. Internal link suggestions but not mapped to specific URLs (uses bracket placeholders like [Mahogany Community Page]). Keyword density guides present. CTA section at bottom. |
| 2026 Compliance | 7 | Author credential mentions (20 years real estate, 10 years banking). FAQ sections for AI extraction. But lacks data tables, price breakdowns, and structured content blocks that AI Overviews favor. Content is more narrative/conversational than data-structured. |

**Total: 30/40**

**Strengths:**
- Most naturally written prose of the three -- reads like a knowledgeable local agent wrote it
- Good comparative context between communities (e.g., "Auburn Bay real estate attracts young families, move-up buyers, and professionals")
- Honest tone about limitations ("detached homes are not limited to one budget level")
- Strong FAQ sections that feel like real questions a buyer would ask

**Weaknesses:**
- No specific price data or property tax estimates (says ranges but vaguely)
- Internal links use bracket placeholders instead of actual URL paths
- No data tables or structured content blocks for AI extraction
- No school board attribution (just school names without CBE/CCSD designation)
- Development start dates are approximate ("around 2006") rather than specific

---

### Gemini (gemini-community-pages.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Good keyword targeting. H1 uses "Homes for Sale in [Community], Calgary". Meta titles 52-54 chars. Community-specific keyword density guides. Internal links included. |
| Content Quality | 9 | Richest narrative content: developer names (Brookfield, Hopewell), specific amenity details (7,000 sq ft Auburn House, 22,000 sq ft Century Hall, 74-acre wetlands), architectural styles ("Cottage Chic", Victorian, Craftsman, Tudor). Named local businesses (Kilt & Caber Ale House, Berwick Public House, Chairman's Steakhouse, Analog Coffee). Direct agent quotes from Neil. |
| Actionability | 7 | Complete page copy. Meta titles/descriptions. Internal links mapped to URL paths. But no keyword density guide in structured format (uses HTML comments instead). No URL slugs defined. |
| 2026 Compliance | 8 | Strong E-E-A-T: direct agent quotes ("Auburn Bay isn't just a place to live; it's a lifestyle asset," Neil often tells clients). "Why Buy" sections frame Neil's expertise explicitly. FAQ sections present. Named local businesses add information gain. |

**Total: 32/40**

**Strengths:**
- Most vivid, engaging writing -- reads like a premium magazine feature
- Named local businesses add genuine information gain (Chairman's Steakhouse, Analog Coffee, Berwick Public House, Good Earth Coffeehouse)
- Direct agent quotes personalize the content and boost E-E-A-T
- Specific architectural style references (Cottage Chic, Victorian, Craftsman, Tudor) add real depth
- Facility sizes mentioned (7,000 sq ft Auburn House, 22,000 sq ft Century Hall)
- Named developers add authority
- Sub-neighbourhood breakdown for McKenzie Towne (Inverness, Prestwick, Elgin, Highwood)

**Weaknesses:**
- **FLAGGED: Bank of Canada rate stated as "3.25%" in blog post 1** -- the Codex deliverable cites the Bank of Canada policy rate at 2.25% as of March 18, 2026 announcement. These numbers conflict across LLMs. Neither can be verified from the provided reference files, but only one can be correct. (85% confidence this is a factual discrepancy requiring verification)
- **FLAGGED: States "world's largest YMCA"** for Seton YMCA -- this claim requires verification and may be an exaggeration. (80% confidence)
- **FLAGGED: HOA fees stated as "$350 to $500 per year"** for Auburn Bay -- this seems low for a lake community association. Other sources suggest $600-$900+ annual. Should be verified with the client. (80% confidence)
- **FLAGGED: Mentions "private docks" available in Mahogany** -- needs verification, as not all lake access properties include dock rights. (80% confidence)
- Meta descriptions for Auburn Bay and Mahogany at 158 and 152 chars -- the 158-char description exceeds the 155-char guideline
- Keyword density guides buried in HTML comments rather than visible tables

---

### COMMUNITY PAGES WINNER: Claude (narrowly over Gemini)

**Reasoning:** Claude wins on data accuracy, structured content (price tables, school board attribution, property tax estimates), deployment readiness, and keyword optimization documentation. However, Gemini's writing is more engaging, has better information gain (named businesses, architectural details, agent quotes), and stronger E-E-A-T through first-person voice. The ideal final version merges Claude's data structure with Gemini's narrative richness and agent quotes. Codex is the most naturally written but lacks the data depth and structured elements that 2026 SEO demands.

---

## DELIVERABLE 4: BLOG POSTS

### Claude (blog-posts.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 9 | 4 posts targeting high-value keywords: "Calgary real estate market" (1,600 vol), "best neighborhoods Calgary" (1,000 vol), "Calgary investment property" (70 vol), "Calgary first time home buyer" (140 vol). Keyword density guides per post. URL slugs. Meta titles/descriptions within character limits. |
| Content Quality | 9 | Specific data throughout: avg $641K, median $572.5K, 5,500+ listings, 2-3% YoY growth, 28-35 days on market (detached), 40-50 days (condos). Price breakdown table by property type. Investment post includes 3 detailed cash flow scenarios with actual monthly cost breakdowns (mortgage, taxes, insurance, condo fees). Canadian programs: FHSA ($8K/yr, $40K lifetime), HBP ($60K), stress test rules. |
| Actionability | 9 | Complete posts ready for deployment. Internal link suggestions with URL paths. CTA blocks with phone number. Keyword density guides with danger zones. Each post 900-1,200 words as specified. |
| 2026 Compliance | 9 | Strong E-E-A-T: "Before I became a Calgary real estate agent, I spent 10 years in banking." First-person authority throughout. FAQ sections in every post for AI Overview extraction. Data tables for structured parsing. Answer-first formatting on key questions. |

**Total: 36/40**

**Strengths:**
- Investment analysis post is outstanding -- three specific scenarios (condo, townhouse, detached) with monthly cost breakdowns, cap rates, and ROI projections
- First-time buyer guide includes exact Alberta closing cost fee formulas ($50 + $5 per $5,000)
- Market report includes price breakdown table by property type
- Neighbourhoods guide covers all 4 quadrants plus inner city, with price ranges and "best for" labels
- FHSA and HBP details are current (HBP $60,000 limit, not the outdated $35,000)
- Banker persona woven naturally into content

**Weaknesses:**
- Some posts could benefit from more visual formatting (more tables, comparison charts)
- Neighbourhoods guide uses "neighborhoods" in the H1 (US spelling) -- though this may be intentional to match the search query "best neighborhoods Calgary"
- Could include more link-worthy original data points

**FLAGGED: HBP withdrawal limit cited as $60,000** -- The Home Buyers' Plan limit was increased to $60,000 effective April 16, 2024. This is correct. Gemini's blog cites the old $35,000 limit, which is outdated. (95% confidence that Claude is correct and Gemini is wrong)

---

### Codex/GPT (codex-blog-posts.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Same 4 post topics. Keyword guidance tables present. Canadian spelling in URLs ("neighbourhoods"). Meta titles 49-57 chars. Descriptions 133-142 chars. |
| Content Quality | 8 | Market report uses same base data ($641K avg, $572.5K median, 5,500+ listings). More conversational, less data-dense than Claude. Investment post covers CMHC vacancy data (5.0% purpose-built, 2.2% condo apartment). First-time buyer guide includes Alberta Land Titles fee formula ($50 + $5 per $5,000). Uses Canadian English consistently ("neighbourhoods", "centre"). |
| Actionability | 7 | Complete posts. Internal link suggestions use bracket placeholders (not URL paths). Keyword density guides. CTA sections. But longer-form narrative means more editing may be needed to hit word count targets. |
| 2026 Compliance | 8 | Strong first-person voice throughout: "My view after 20 years in Calgary real estate and 10 years in banking is simple." FAQ sections in every post. Good answer-first formatting. References Bank of Canada March 18, 2026 announcement specifically. OSFI stress test details current (contract rate + 2% or 5.25%). |

**Total: 31/40**

**Strengths:**
- Most current policy rate reference: cites Bank of Canada March 18, 2026 announcement with rate at 2.25% and next announcement date (April 29, 2026)
- CMHC rental market data cited (vacancy rates, average rents) with source attribution
- First-time buyer guide has the most granular Alberta closing cost breakdown
- Uses OSFI stress test formula correctly (contract rate + 2% or 5.25%)
- Naturally conversational tone that feels like Neil talking to a client
- Investment post is honest about risks ("waiting only makes sense if you are financially unprepared")

**Weaknesses:**
- Less data-structured than Claude (fewer tables, no cash flow scenarios)
- Internal links use bracket placeholders
- Some posts feel longer than needed -- could be tighter
- No price breakdown tables by property type
- No specific community price ranges in neighbourhoods guide

---

### Gemini (gemini-blog-posts.md)

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Same 4 topics. Meta titles 53-57 chars. Descriptions 148-154 chars. Keyword density guides in HTML comments. Internal links use actual URL paths with markdown formatting. |
| Content Quality | 7 | Engaging writing with strong opening hooks. Agent quotes woven in. Named specific businesses. But has factual issues: Bank of Canada rate cited as 3.25% (conflicts with Codex's 2.25%), HBP limit cited as $35,000 (outdated -- should be $60,000), and claims 4-6% annual appreciation (more aggressive than the 2-3% cited by Claude and Codex). |
| Actionability | 7 | Complete posts with inline links to community pages. HTML comment keyword guides. But factual errors would need correction before deployment. |
| 2026 Compliance | 7 | Good E-E-A-T with agent voice and quotes. FAQ sections present. But factual errors undermine trust -- the core E-E-A-T dimension. Outdated HBP figure is a significant compliance issue for a 2026 guide. |

**Total: 29/40**

**Strengths:**
- Most engaging opening paragraphs ("it's driven by fundamental economic growth and a genuine desire for the quality of life that Calgary offers")
- Inline links to community pages within body text (good for internal linking)
- Proprietary ranking framework for neighbourhoods guide adds perceived authority
- Named local businesses and specific amenity details (consistent with community pages)
- Investment post names specific restaurants and amenities

**Weaknesses:**
- **FLAGGED: HBP limit stated as $35,000** -- this is the old limit. The current limit (effective April 16, 2024) is $60,000. This is factually incorrect for a 2026 guide. (95% confidence)
- **FLAGGED: Bank of Canada rate stated as 3.25%** -- this conflicts with Codex's citation of 2.25% from the March 18, 2026 announcement. One of these is wrong. Since the reference files do not confirm either, both should be verified before publication. (85% confidence)
- **FLAGGED: Claims "4-6% annual appreciation"** -- Claude and Codex both cite 2-3%. The more aggressive figure needs sourcing or should be toned down. (80% confidence)
- **FLAGGED: Average condo price stated as $330,000** and average townhome as $490,000 -- Claude's data (based on the same reference figures) shows condos at $295,000 avg and townhouses at $380,000 avg. Gemini's figures are noticeably higher. (80% confidence)
- **FLAGGED: First-Time Buyer guide mentions "First-Time Home Buyer Incentive" shared equity program** -- this program was suspended/cancelled. Including it as current is misleading. (80% confidence)
- **FLAGGED: States properties selling in "22 days" average and detached in "10 days"** -- Claude cites 28-35 days (detached), Codex cites 42 days city-wide. Gemini's figures are more aggressive and not supported by the reference data. (85% confidence)

---

### BLOG POSTS WINNER: Claude

**Reasoning:** Claude delivers the most data-accurate, deployment-ready blog content. The investment analysis with three specific cash flow scenarios is the standout piece across all 12 deliverables. Claude's HBP figure ($60,000) is current; Gemini's ($35,000) is outdated. Claude's market data aligns with the reference keyword-data.json and audit report. Codex is a strong second with the most current Bank of Canada policy detail, but Claude's structured data presentation (tables, scenarios, formulas) gives it the edge for both SEO and reader utility.

---

## OVERALL LLM RANKING

| Rank | LLM | Meta Tags | Schema | Community | Blog | Total | Avg |
|------|-----|-----------|--------|-----------|------|-------|-----|
| **1** | **Claude** | **36** | **37** | **35** | **36** | **144** | **9.0** |
| **2** | **Codex/GPT** | 30 | 29 | 30 | 31 | 120 | 7.5 |
| **3** | **Gemini** | 25 | 31 | 32 | 29 | 117 | 7.3 |

### Summary

**Claude** wins overall and wins all 4 individual deliverables. Its core advantages are data accuracy, deployment readiness, structured content formatting, and Canadian/Alberta specificity.

**Codex/GPT** takes a consistent second place across meta tags, community pages, and blog posts. Its strengths are natural conversational tone, honest/practical advice style, and current Bank of Canada policy details. Its main weakness is lower deployment readiness (bracket-placeholder links, no Sierra Interactive instructions, no OG templates).

**Gemini** shows the strongest creative writing and most vivid community narratives but is undermined by factual errors (outdated HBP limit, questionable market stats, US spelling in a Canadian-focused deliverable). Its schema markup is second-best thanks to the detailed Person entity. Its blog posts have the most factual issues of any LLM.

---

## BEST HYBRID STRATEGY

The optimal final deliverables should merge the best elements from each LLM:

### Meta Tags: Use Claude as base
- Merge Codex's consistent "Calgary Castles" branding approach where titles have room
- No elements needed from Gemini (US spelling issues disqualify it)

### Schema Markup: Use Claude as base
- **Merge from Gemini:** The detailed Person schema (givenName, familyName, hasOccupation with skills, RECA credential, CREB memberOf) -- after verifying CREB membership and removing unverified birthPlace
- **Merge from Codex:** inLanguage: "en-CA" and wordCount fields in blog templates
- **Remove from Codex:** The fabricated sample review, wrong logo URL
- **Remove from Gemini:** Wrong logo URL, "neighborhoods" US spelling in knowsAbout
- **Add to final:** Speakable schema (missing from all three, recommended by best-practices research)

### Community Pages: Use Claude as base
- **Merge from Gemini:** Named local businesses (Chairman's Steakhouse, Analog Coffee, Berwick Public House, Kilt & Caber Ale House, Good Earth Coffeehouse), architectural style details (Cottage Chic, Victorian, Craftsman, Tudor), facility sizes (7,000 sq ft Auburn House, 22,000 sq ft Century Hall), developer names, sub-neighbourhood breakdowns, and direct agent quotes
- **Merge from Codex:** The naturally conversational FAQ tone and honest comparative analysis style
- **Verify before merging from Gemini:** HOA fee ranges, private dock claims, "world's largest YMCA" claim

### Blog Posts: Use Claude as base
- **Merge from Codex:** Bank of Canada March 18, 2026 specific announcement reference (after verifying rate), CMHC rental market vacancy data with source attribution, OSFI stress test formula
- **Merge from Gemini:** Engaging opening paragraph style, inline community page links within body text, proprietary ranking framework concept for neighbourhoods guide
- **Do NOT merge from Gemini:** HBP $35,000 figure (outdated), 4-6% appreciation claim (unsourced), 3.25% Bank of Canada rate (unverified), 22-day/10-day DOM claims (not supported by reference data), First-Time Home Buyer Incentive reference (program suspended)

---

## SPECIFIC ITEMS TO MERGE INTO FINAL VERSIONS

### From Claude (base for all):
- All structured data tables (price breakdowns, keyword volumes, character counts)
- Investment cash flow scenarios (Post 3)
- Alberta closing cost fee formulas
- Sierra Interactive deployment instructions
- OG tag templates
- Priority implementation matrix (P1-P4)
- US-to-Canadian terminology mapping table

### From Codex/GPT:
- Bank of Canada March 18, 2026 announcement citation (verify rate first)
- CMHC 2025 Rental Market Report data (vacancy 5.0% purpose-built, 2.2% condo; avg 2BR rent $1,914/$2,030)
- "Trust account" terminology for escrow replacement (Alberta-specific and precise)
- OSFI stress test formula with current thresholds
- Next Bank of Canada announcement date (April 29, 2026)
- Conversational FAQ tone

### From Gemini:
- Named local restaurants/businesses for community pages (verify each exists)
- Architectural style descriptions per community
- Facility sizes (Auburn House 7,000 sq ft, Century Hall 22,000 sq ft)
- Developer names per community (Brookfield, Hopewell)
- Sub-neighbourhood breakdowns (McKenzie Towne: Inverness, Prestwick, Elgin, Highwood)
- Direct Neil Rowlandson quotes for E-E-A-T
- School names with specific programs (Joane Cardinal-Schubert High School in Seton)
- Detailed Person schema structure for Neil

---

## ALL FLAGGED ISSUES (80%+ confidence)

| # | LLM | Deliverable | Issue | Confidence | Action Required |
|---|-----|-------------|-------|------------|-----------------|
| 1 | Gemini | Meta Tags | US spelling "neighborhoods" and "Favorite" used instead of Canadian English | 95% | Replace with "neighbourhoods" and "favourite" |
| 2 | Codex | Schema | Logo URL points to "tasty-ppc-logo.svg" (agency logo, not client) | 90% | Replace with "site-logo-1708132305286.png" |
| 3 | Gemini | Schema | Same wrong logo URL as Codex | 90% | Replace with correct logo |
| 4 | Codex | Schema | Fabricated sample review in AggregateRating block | 95% | Remove entirely -- Google spam risk |
| 5 | Codex | Schema | Closing costs FAQ shows ",000-,000" (missing dollar signs) | 95% | Fix JSON string escaping |
| 6 | Gemini | Schema | "neighborhoods" (US spelling) in knowsAbout array | 90% | Replace with "Neighbourhoods" |
| 7 | Gemini | Schema | Unverified birthPlace "Lakeview, Calgary" | 85% | Verify with client or remove |
| 8 | Gemini | Blog | HBP limit stated as $35,000 (outdated; current is $60,000) | 95% | Update to $60,000 |
| 9 | Gemini | Blog | Bank of Canada rate stated as 3.25% (conflicts with Codex's 2.25%) | 85% | Verify current rate before publishing |
| 10 | Gemini | Blog | Claims "4-6% annual appreciation" (unsupported by reference data) | 80% | Tone down to 2-3% or provide sourcing |
| 11 | Gemini | Blog | Average condo price $330K and townhome $490K (higher than reference data) | 80% | Reconcile with CREB data |
| 12 | Gemini | Blog | First-Time Home Buyer Incentive referenced as current (program suspended) | 80% | Remove or note as historical |
| 13 | Gemini | Blog | Claims 22-day avg DOM and 10-day for detached (not supported) | 85% | Reconcile with CREB data |
| 14 | Gemini | Community | Meta description for Auburn Bay at 158 chars (exceeds 155 guideline) | 90% | Trim by 3 characters |
| 15 | Gemini | Community | HOA fees "$350-$500/year" may be too low for lake community | 80% | Verify with Auburn Bay Residents Association |
| 16 | All | Schema | Geo coordinates (51.0447, -114.0719) appear to be generic Calgary downtown, not actual office location | 70% | Verify actual coordinates for 703-64th Ave SE |

---

## FINAL VERDICT

| Category | Winner | Runner-Up | Key Differentiator |
|----------|--------|-----------|-------------------|
| Meta Tags | **Claude** | Codex | Deployment readiness, current-vs-new format |
| Schema Markup | **Claude** | Gemini | FAQ data quality, no fabricated reviews |
| Community Pages | **Claude** | Gemini | Data accuracy, structured pricing |
| Blog Posts | **Claude** | Codex | Cash flow scenarios, correct HBP figure |
| **Overall** | **Claude** | Codex | Data accuracy + deployment readiness |

**Recommended approach:** Use Claude as the production base for all 4 deliverables. Surgically merge the specific items listed above from Codex and Gemini. Verify all flagged items with client before publication.
