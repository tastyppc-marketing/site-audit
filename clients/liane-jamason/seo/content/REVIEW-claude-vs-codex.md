# Claude vs. Codex — Deliverable Review
**Client:** Liane Jamason, Corcoran Dwellings  
**Reviewer:** Senior Code Reviewer (Claude Sonnet 4.6)  
**Review Date:** 2026-04-08  
**Reference Files:** FINAL-AUDIT-REPORT.md, seo-best-practices-2026.md, keyword-research.md

---

## Scoring Framework

Each deliverable is scored 1–10 on four dimensions:

| Dimension | What It Measures |
|-----------|-----------------|
| **SEO Optimization** | Keyword targeting, character compliance, technical correctness |
| **Content Quality** | Accuracy, depth, brand voice, uniqueness, specificity |
| **Actionability** | Deployment-readiness, clarity of instructions, minimal editing needed |
| **2026 Compliance** | E-E-A-T signals, AI Overview optimization, no deprecated patterns |

Confidence threshold for flagged issues: 80%+.

---

## Deliverable 1: Meta Tags

### claude-meta-tags.md

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 9 | Titles and descriptions target the right keywords and stay within limits throughout. Character counts are explicit and accurate. Catches the 100-char blog title, the "you home" typo, the wrong-page description on active listings. Neighborhood pages include descriptive differentiators. |
| Content Quality | 9 | Each description reads as a distinct sales pitch, not a template fill. Press credentials (Forbes, WSJ, USA Today) appear appropriately. Phone number consistently 727-755-3325. Correctly flags off-topic pages for noindex. |
| Actionability | 9 | Grouped by page type with a numbered priority order. Rank Math implementation steps are explicit. Character count verification tool is linked. |
| 2026 Compliance | 8 | E-E-A-T signals surface naturally ("Broker/Owner," "Featured in Forbes/WSJ/USA Today," "287+ articles"). FAQ and AI Overview optimization not in scope for meta tags but the descriptions are structured for extractability. |
| **Total** | **35/40** | |

**Issues:**

[CONFIDENCE: 82] IMPORTANT  
File: claude-meta-tags.md — Neighborhood pages section  
Issue: The `/old-northeast/` title is 53 chars ("Old Northeast Homes for Sale | St. Pete Real Estate") but Codex's audit separately confirmed the live title is 74 chars ("Historic Old Northeast Homes for Sale - Liane Jamason - Corcoran Dwellings"). Claude's replacement correctly drops the old branding, but it omits the keyword "Historic" which is both a brand differentiator and appears in keyword research as a MEDIUM gap ("historic homes St Petersburg FL"). The word "Historic" appears in Codex's version for this neighborhood.  
Fix: Revise to "Historic Old Northeast Homes for Sale | St. Pete" (50 chars) — keeps the keyword, stays under limit.

### codex-meta-tags.md

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Covers more URLs than Claude (14 more pages including Pinellas County hub, Wesley Chapel, Downtown Tampa, The Salvador, Vinoy Place). Catches all the same priority issues. Character counts are accurate. However, two titles exceed 60 chars (Clearwater: 57 chars, Tampa: 56 chars — borderline). "Jamason Group" removal is explicitly called out. |
| Content Quality | 8 | Descriptions are solid but slightly more templated. The about page title "St. Pete Broker Bio, Media & Credentials | Liane Jamason" (56 chars) is unusual phrasing — reads awkwardly as a search snippet. The off-topic page titles ("Travel Draft Noindex Recommendation | Liane Jamason") are odd — those pages should just be noindexed, not given optimized titles. |
| Actionability | 8 | Implementation notes are clear. URL mismatch warnings are valuable and precise (notes /sold-listings/ vs /my-sold-listings/, /400-central/ vs /the-residences-at-400-central/, The Salvador blog URL issue). Phone number standard (727-755-3325) is explicitly stated. |
| 2026 Compliance | 8 | Same E-E-A-T surface as Claude. Correctly removes legacy "Jamason Group" branding from titles. |
| **Total** | **32/40** | |

**Issues:**

[CONFIDENCE: 85] IMPORTANT  
File: codex-meta-tags.md, Group 7 Blog Posts  
Issue: The blog title for the market update post is 59 chars: "Pinellas vs Hillsborough Market Update 2026 | Liane Jamason". This is within the 60-char limit but has no period after "Hillsborough," and the actual live URL path is `/featured/pinellas-vs-hillsborough-real-estate-market-update-february-2026/`. The blog breadcrumb path in the schema file shows a different URL (`/pinellas-vs-hillsborough-real-estate-market-update/`). This URL mismatch will cause implementation errors if someone cross-references the meta tags doc with the schema doc.  
Fix: Add URL verification note pointing to the live `/featured/` path.

[CONFIDENCE: 80] IMPORTANT  
File: codex-meta-tags.md, Group 8 Off-Topic / Noindex Candidates  
Issue: Writing optimized title tags for pages that should be noindexed is contradictory and waste of implementation time. The titles themselves ("Travel Draft Noindex Recommendation | Liane Jamason") are not real titles — they are instructions embedded into the title field. If someone pastes these into Rank Math without reading the note, the page gets an ugly title.  
Fix: Remove title/description entries for noindex pages. Just include the noindex instruction. Claude handles this correctly — provides placeholder text and notes that actual title/description don't matter once noindex is set.

### Head-to-Head: Meta Tags

**Winner: Claude**

Claude wins on three counts: (1) the priority-ordered implementation list makes it immediately actionable in the correct sequence; (2) the description copy is more distinctive and benefit-focused per page; (3) the noindex treatment is cleaner and less confusing. Codex wins on breadth — it covers more URLs including several Claude missed (The Salvador, Vinoy Place, Wesley Chapel, Downtown Tampa, Pinellas County hub, the flood zones blog post). For the final merged version, use Claude's copy and priority order as the base, and supplement with Codex's additional URL entries for pages Claude did not cover.

**Merge recommendation:**
- Use Claude's title/description copy for all pages both files cover
- Add Codex's Group 5 entries for: The Salvador, Vinoy Place
- Add Codex's Group 6 entries for: Pinellas County hub, Wesley Chapel, Downtown Tampa
- Add Codex's Group 7 flood zones and new-construction-condo blog titles (those are real existing posts)
- Fix the "Historic" omission in Claude's Old Northeast title (see issue above)
- Use Claude's noindex treatment for off-topic pages

---

## Deliverable 2: Schema Markup

### claude-schema-markup.md

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 9 | 9 blocks covering all high-value schema types: Organization + RealEstateAgent, Person, About page, Contact/LocalBusiness, Neighborhood template + 2 examples, Blog template + 1 example, Buyer FAQ, Seller FAQ, AggregateRating. The @graph pattern is correct for the homepage. sameAs URLs are pre-populated with best-guess values and flagged for verification. |
| Content Quality | 9 | FAQ answers in Blocks 7 and 8 are substantive and specific: flood zone designations (AE/VE/X), NFIP premium ranges ($700–$10,000+), Florida SB 4D condo law explanation, Florida Statute §689.261 flood disclosure requirement. These are the kinds of specifics that make FAQ schema genuinely useful for AI citations. |
| Actionability | 9 | Priority checklist with effort and impact ratings. Validation table per block. Clear before-going-live notes. 9 distinct blocks all deployable with placeholder replacements. |
| 2026 Compliance | 9 | hasCredential field for broker license (structurally immune to AI fabrication). knowsAbout arrays. AggregateRating on reviews page. FAQPage schema for buyer and seller queries. Author @id pattern consistent across all blocks. Warns about Rank Math conflict explicitly. |
| **Total** | **36/40** | |

**Issues:**

[CONFIDENCE: 83] IMPORTANT  
File: claude-schema-markup.md, Block 1 (Homepage @graph)  
Issue: The Organization entity type is set to `["RealEstateAgent", "LocalBusiness"]` on the homepage but the RealEstateAgent type is then used again as a standalone entity on the contact page (Block 4) with a different `@id` (`#localbusiness` vs `#org`). These two entities represent the same business but have different identifiers. This will create duplicate entity signals that can confuse Google's entity graph.  
Fix: Normalize to a single canonical `@id` for the business entity (`#org`) across all pages. On the contact page, reference `@id: "https://www.lianejamason.com/#org"` rather than introducing `#localbusiness`.

[CONFIDENCE: 81] IMPORTANT  
File: claude-schema-markup.md, Block 6 (Blog Post Filled Example)  
Issue: The filled example uses `datePublished: "2026-01-01"` and `dateModified: "2026-01-01"` as hardcoded placeholders with a note saying "verify the actual published URL and date." However, having identical publish and modified dates on a market update post signals the content was never updated, which is a negative E-E-A-T signal for time-sensitive content in 2026. The `wordCount: 2500` is also a guess.  
Fix: Ensure the note in the filled example explicitly says not to copy the placeholder dates verbatim. Add a reminder that dateModified should reflect the most recent edit, not the original publish date.

### codex-schema-markup.md

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Same 9 blocks covered. Codex separates Organization and RealEstateAgent into distinct entities on the homepage — technically more granular but also introduces entity multiplicity that could confuse resolution. The `areaServed` arrays use plain strings ("St. Petersburg FL") instead of structured Place objects, which is less rich but more compatible with some validators. |
| Content Quality | 7 | The FAQ answers are noticeably weaker. The Buyer FAQ answers are meta-commentary about the audit rather than actual buyer guidance: "The audit identified Snell Isle, Downtown St. Pete condos, Old Northeast, and St. Pete waterfront condos as some of the best local opportunity areas where focused neighborhood guidance can help buyers move beyond the most portal-heavy search results." This is an answer about the audit, not an answer to the question a buyer is asking. These FAQ answers will not earn AI Overview citations. |
| Actionability | 8 | The implementation checklist is slightly better organized (CRITICAL / HIGH / MEDIUM tiers) and the final QA checklist at the end is thorough. Codex explicitly notes removing the incorrect Article schema from the homepage and About page — a specific and correct observation. |
| 2026 Compliance | 7 | The `reviewCount: ">90"` placeholder (Block 9) is syntactically invalid — it is a string, not a number. Schema.org requires a numeric value. This will fail validation. Codex's own note acknowledges it, but using ">90" as the default value in the JSON block itself is a deployment risk. |
| **Total** | **30/40** | |

**Issues:**

[CONFIDENCE: 90] CRITICAL  
File: codex-schema-markup.md, Block 9 (AggregateRating)  
Issue: `"reviewCount": ">90"` is a string, not a valid schema.org Number type. The schema.org specification and Google's Rich Results Test require `reviewCount` to be an integer. This block will fail validation and will not produce star-rating rich results.  
Fix: Replace with the actual count as a number (e.g., `"reviewCount": 92`). Claude's version correctly uses `"reviewCount": 92`.

[CONFIDENCE: 88] IMPORTANT  
File: codex-schema-markup.md, Block 7 (Buyer FAQ)  
Issue: All six FAQ answers in the Buyer FAQ are written from the perspective of describing the audit or the site, not answering buyer questions. Example: "The site uses iHomefinder IDX on idx.lianejamason.com for property search." This is an implementation note disguised as an FAQ answer. A user searching "how do I find waterfront homes in St Petersburg" who encounters this in an AI Overview would receive a non-answer. Google requires FAQ schema content to match the on-page content, and this content would not appear naturally on a buyer resource page.  
Fix: Replace all six answers with substantive buyer guidance matching the depth and specificity in Claude's Buyer FAQ (flood zone designations, NFIP costs, condo law requirements, etc.).

[CONFIDENCE: 85] IMPORTANT  
File: codex-schema-markup.md, Block 1 (Homepage)  
Issue: The Organization entity has `"name": "Corcoran Dwellings (Liane Jamason, LLC d/b/a Jamason Group)"` — this embeds the legacy "Jamason Group" name in the structured data entity. Codex's own meta-tags file and the audit both specify that "Jamason Group" should be removed from search-facing content. Including it in the legal name may persist it in Google's Knowledge Graph.  
Fix: Use `"name": "Corcoran Dwellings"` for the display name. If needed for legal accuracy, use `"legalName"` as a separate field but omit "Jamason Group" from the primary name.

### Head-to-Head: Schema Markup

**Winner: Claude** — and by a larger margin than the meta tags comparison.

Claude's substantive FAQ answers (Blocks 7 and 8) are deployable as written. Codex's FAQ answers are essentially useless for AI Overview citation and require a full rewrite. Claude's AggregateRating block has a valid numeric reviewCount. Claude's @id consistency is cleaner. The only area where Codex shows superior judgment is in the implementation checklist's priority ordering (reviews first, then FAQ, then homepage entity — which correctly matches impact tier) and in the specific note about removing the incorrect Article schema from the About page.

**Merge recommendation:**
- Use Claude's JSON blocks 1–9 as the production base
- Adopt Codex's priority ordering in the implementation checklist (CRITICAL/HIGH/MEDIUM tiers)
- Adopt Codex's specific note: "Replace the incorrect homepage and About page Article schema with WebPage/AboutPage"
- Adopt Codex's `"legalName"` field in Block 1 if legal entity name accuracy is needed
- Fix Claude's Block 4 @id conflict (#localbusiness vs #org) as described above

---

## Deliverable 3: Community Pages

### claude-community-pages.md

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 9 | Meta titles hit keyword targets ("Downtown St Pete Condos for Sale," "Tierra Verde Homes for Sale," "Venetian Isles St Petersburg Homes"). Descriptions include neighborhood-specific differentiators. H1 tags are distinctive and descriptive. FAQ sections target exact PAA questions from keyword research. Internal link suggestions cover all the right pages. |
| Content Quality | 9 | Exceptional depth and specificity. Real restaurant names (Pia's Trattoria, Sea Critters Cafe, Stella's at the Casino). Real building names (Saltaire, ONE St. Petersburg, 400 Central, The Salvador, Art House). Real school names confirmed against known data. Real price ranges that are internally consistent across pages. Fort DeSoto context is accurate. Tierra Verde's six subdivisions (Entrada, Monte Cristo, Pinellas Bayway, Sandpoint, East Shore, West Shore) are named correctly. The voice is distinctive and reads as local expertise, not AI filler. |
| Actionability | 8 | Pages are fully written and ready to paste into WordPress. Internal link slugs are relative and match the site's URL structure. CTAs are present at the bottom of each page. The only gap is that character counts are not shown for meta titles/descriptions. |
| 2026 Compliance | 9 | Each page includes a "Why Buy" section with first-person-adjacent local expertise signals ("Liane Jamason has guided numerous buyers..."). FAQ sections match the PAA questions from keyword research. E-E-A-T signals throughout: specific local knowledge about flood zones, canal depth, dock permits, seawall conditions, school zones. Content that only someone with real waterfront expertise could write. |
| **Total** | **35/40** | |

**Issues:**

[CONFIDENCE: 80] IMPORTANT  
File: claude-community-pages.md, Downtown St. Pete page  
Issue: The market update section states "A wave of new construction over the past decade — Saltaire, ONE St. Petersburg, The Salvador, Art House — has added hundreds of luxury units" and then the FAQ answer states "the median sale price for downtown St. Petersburg condos falls between $450,000 and $550,000." However, the blog posts file (same author) references "studios and smaller residences can still begin around the low-to-mid $400,000s" and the Codex community page references studios starting "around $280,000." The $450K–$550K median is higher than what either the blog posts or Codex present for the same market, and without a sourced data citation, this conflicts with the site's other content.  
Fix: Soften to "recent median sale prices for downtown St. Pete condos have generally ranged from the mid-$400,000s into the $600,000s" or add a source qualifier. Alternatively, use the same framing as the blog posts ("from studios around the low-to-mid $400,000s to luxury penthouses exceeding $2M") to maintain consistency.

### codex-community-pages.md

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 7 | Meta titles are keyword-targeted and mostly within limits (Venetian Isles title is 56 chars — at the limit). H1 tags use "in 33701's Premier Towers" and similar constructs that are unusual for conversational search. The FAQ headings use H3 rather than H2, which reduces their value as semantic triggers for AI Overviews. Does not include separate internal link suggestions with anchor text — just a bulleted list of URLs. |
| Content Quality | 7 | Writing is competent but notably more generic. No specific restaurant names in the Gulfport page. No specific building names in the Downtown page beyond a list. No specific subdivision names in the Tierra Verde overview (just references "15 interconnected islands" — the keyword research file confirms Tierra Verde has six specific named subdivisions, not 15 islands). The Tierra Verde page says the Pinellas Bayway toll amount "can change over time" and declines to provide a figure, which weakens the E-E-A-T signal. |
| Actionability | 8 | Pages are fully written with CTA sections and internal links. CTAs include the phone number (727-755-3325) and press credentials, which is a positive E-E-A-T move. The "Why Buy" sections use bullet lists instead of prose, which is less distinctive but more skimmable. |
| 2026 Compliance | 7 | Less first-person expertise signaling than Claude. CTAs are stronger (include phone, press mentions) but the body content lacks the specific local knowledge markers that 2026 E-E-A-T requires. The flood zone FAQ answer for Tierra Verde ("Flood risk is one of the biggest practical considerations") is accurate but thin — it doesn't give the specific zone designations or guidance that would make it citation-worthy for AI Overviews. |
| **Total** | **29/40** | |

**Issues:**

[CONFIDENCE: 82] IMPORTANT  
File: codex-community-pages.md, Tierra Verde page  
Issue: "15 interconnected islands" is stated as a fact. The keyword research file and the audit both confirm that Tierra Verde has six distinct named subdivisions. The number "15" appears to reference an unverified claim. This factual discrepancy could undermine trust if a buyer researches Tierra Verde.  
Fix: Replace "15 interconnected islands" with the accurate description: an island community with six subdivisions (Entrada, Monte Cristo, Pinellas Bayway, Sandpoint, East Shore, West Shore).

[CONFIDENCE: 80] IMPORTANT  
File: codex-community-pages.md, Downtown St. Pete page  
Issue: The H1 "Downtown St. Pete Condos for Sale in 33701's Premier Towers" uses an unusual phrasing that limits the page's relevance for queries like "downtown St Pete condos for sale" where searchers aren't thinking about ZIP codes. The phrase "33701's Premier Towers" is awkward and would not appear naturally in a user's search or in the way a local would describe the area.  
Fix: Use a cleaner H1 that leads with the primary keyword: "Downtown St. Pete Condos for Sale — Luxury High-Rise Living in St. Petersburg" or similar.

### Head-to-Head: Community Pages

**Winner: Claude** — by a significant margin.

Claude's community pages are production-grade long-form content with real local specificity that signals genuine expertise. Codex's pages are well-structured but generic enough that a reader could not easily distinguish them from content about any Florida coastal market. The Tierra Verde subdivision error in Codex is a concrete factual issue that could hurt credibility. Claude's FAQ sections directly target the PAA questions from the keyword research file; Codex's do not.

**Merge recommendation:**
- Use Claude's community page content as the primary source for all four pages
- Adopt Codex's CTA format (includes phone number + press credentials inline) as an improvement to Claude's generic CTA
- Fix Claude's Downtown condo median price inconsistency (see issue above) before publishing
- Claude's internal link suggestions use relative paths (/st-petersburg/snell-isle/) — verify these match the actual site slug structure shown in the audit before implementing

---

## Deliverable 4: Blog Posts

### claude-blog-posts.md

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 9 | Four posts targeting four distinct keyword clusters from the research: market report (captures "Is it a good time to buy in St Petersburg"), neighborhoods guide (captures "best neighborhoods St Petersburg FL"), investment guide (captures "St Petersburg FL investment property"), waterfront guide (captures "waterfront homes St Petersburg FL buyer guide"). FAQ sections in each post directly target the PAA questions from the keyword research file. Internal links throughout each post. |
| Content Quality | 9 | First-person byline ("By Liane Jamason, Broker/Owner, Corcoran Dwellings") establishes authorship from the first line. Real specifics: Tierra Verde's six named subdivisions, Shore Acres Civic Association (SACA), the "dueling Publixes" local detail, Florida SB 4D condo law, Florida Statute §689.261 flood disclosure requirement, NFIP flood insurance premium ranges. Investment post correctly addresses STR zoning requirements. Price ranges are internally consistent across posts. |
| Actionability | 8 | Posts are fully written and ready for WordPress. Meta titles and descriptions are provided and within limits. Internal links use relative paths. Minor gap: dates are hardcoded ("Spring 2026" framing) and will need updating if posts are published outside the spring window or used as templates later. |
| 2026 Compliance | 9 | Byline on every post. First-person perspective throughout neighborhoods guide ("After nearly a decade of helping buyers..."). Specific local data. FAQ sections structured as direct answers to real search queries. Market update post includes the explicit caveat that "overpriced listings are sitting" — this kind of nuanced take cannot be generated without market knowledge, which is exactly the experience signal Google's March 2026 update rewards. |
| **Total** | **35/40** | |

**Issues:**

[CONFIDENCE: 81] IMPORTANT  
File: claude-blog-posts.md, Post 3 (Investment Guide)  
Issue: "Cap rates for residential investment properties in St. Pete generally fall in the 4%–7% range" is presented as a factual data point with no source citation. The keyword research file notes that cap rate data should be validated with DataForSEO. The best-practices file states that "pages that rephrase existing top results without adding original data lose ground" in the March 2026 update. A range this wide (4%–7%) could be accurate but is not sourced, and it doesn't differentiate the content from generic real estate content.  
Fix: Either source this from a real data provider (DataForSEO, CBRE local market data, or Liane's own transaction history) or reframe as Liane's observation from practice: "Based on the transactions I've handled in St. Pete, residential investment properties have been trading at roughly 4%–7% cap rates depending on location and property type." This preserves the experience signal.

### codex-blog-posts.md

| Dimension | Score | Notes |
|-----------|-------|-------|
| SEO Optimization | 8 | Same four post topics covered. FAQ sections are present in each post and target the same PAA questions. Internal links are relative. Meta titles are slightly keyword-heavier (e.g., "Best Neighborhoods in St Petersburg FL for 2026 Buyers" is a better keyword-target title than Claude's "Best Neighborhoods in St. Petersburg FL – 2026 Guide"). |
| Content Quality | 7 | Writing quality is competent but noticeably more hedged and generic than Claude's. The investment post explicitly avoids giving specific cap rates ("Cap rates in St. Petersburg vary by property type, location, financing structure, and insurance burden") — which is more defensible than Claude's unsourced range, but also less useful to a reader. The waterfront post frames the Pinellas Bayway toll question by saying to "confirm the current SunPass or toll-by-plate rate" rather than providing the actual amount — accurate but thin. The neighborhood guide does not name the Shore Acres "dueling Publixes" detail or any other genuinely local color. |
| Actionability | 7 | Posts are fully written but the bylines are formatted as "By Liane Jamason | Corcoran Dwellings | April 8, 2026" with literal future dates (April 8, 15, 22, 29, 2026) suggesting this was written as a content calendar. This is fine if the dates align with actual publication, but will cause E-E-A-T issues if posts go live simultaneously with different dates. |
| 2026 Compliance | 7 | First-person bylines are present. FAQ sections are well structured. However, the content is intentionally more hedged and avoids specific data points — which is the safer choice for accuracy but makes the content less citation-worthy for AI Overviews (which need extractable facts, not qualifications). The neighborhoods guide links to `/snell-isle/` and `/old-northeast/` rather than the full `/st-petersburg/snell-isle/` path — these would need to be verified against the site's actual slug structure. |
| **Total** | **29/40** | |

**Issues:**

[CONFIDENCE: 83] IMPORTANT  
File: codex-blog-posts.md, All posts  
Issue: Internal links use shortened slugs (`/snell-isle/`, `/venetian-isles/`, `/waterfront-homes/`, `/downtown-st-pete-condos/`) that do not match the URL structure confirmed in the audit. The audit and meta tags documents show the correct paths are `/st-petersburg/snell-isle/`, `/st-petersburg/venetian-isles/`, `/search-waterfront/`, `/downtown-st-petersburg/`. These shortened links will produce 404 errors or redirect chains.  
Fix: Replace all shortened slug internal links with the correct full-path URLs as documented in the audit and meta tags deliverable.

[CONFIDENCE: 80] IMPORTANT  
File: codex-blog-posts.md, Post 1 (Market Report)  
Issue: The market report references `/my-active-listings/` is not linked to anywhere in the posts, but the `/buy/` and `/sell/` CTAs link to `/buy/` and `/sell/` respectively — these URL slugs may not be the canonical paths. The audit shows the actual buy page is at `/buy-a-home-with-liane-jamason/` and the sell page may have a different slug. Claude's posts correctly use the longer canonical paths shown in the audit.  
Fix: Verify all CTA link targets against the confirmed slug list in the meta tags and audit documents before publishing.

### Head-to-Head: Blog Posts

**Winner: Claude** — though by a smaller margin than the other deliverables.

Claude's posts win on content specificity and first-person authority signaling. The local color ("dueling Publixes"), specific legal citations (Florida SB 4D, §689.261), and specific price ranges anchored to named neighborhoods are exactly the experience signals that the March 2026 core update rewards. Codex's posts are more defensible in terms of avoiding unsourced claims but are less useful to readers and less likely to earn AI Overview citations. Codex's broken internal link slugs are a deployment-blocking issue.

**Merge recommendation:**
- Use Claude's post content as the primary source
- Adopt Codex's Post 2 title: "Best Neighborhoods in St Petersburg FL for 2026 Buyers" (54 chars) is a slightly better keyword target than Claude's title (52 chars)
- Adopt Codex's Post 4 title: "Waterfront Homes in St Petersburg FL: Spring 2026 Guide" (55 chars) adds temporal relevance
- Fix Claude's cap rate sourcing issue in Post 3 (see issue above)
- Verify all internal link paths before publishing using the confirmed slug structure from the audit

---

## Overall Scores Summary

| Deliverable | Claude Total | Codex Total | Winner |
|-------------|-------------|-------------|--------|
| Meta Tags | 35/40 | 32/40 | Claude |
| Schema Markup | 36/40 | 30/40 | Claude |
| Community Pages | 35/40 | 29/40 | Claude |
| Blog Posts | 35/40 | 29/40 | Claude |
| **Grand Total** | **141/160** | **120/160** | **Claude** |

---

## High-Confidence Issues Summary

| Confidence | Severity | File | Issue |
|------------|----------|------|-------|
| 90 | Critical | codex-schema-markup.md, Block 9 | `reviewCount: ">90"` is a string, not a number — will fail validation |
| 88 | Important | codex-schema-markup.md, Block 7 | Buyer FAQ answers describe the audit, not buyer questions — not citation-worthy |
| 85 | Important | codex-schema-markup.md, Block 1 | "Jamason Group" embedded in the Organization name field will persist in Knowledge Graph |
| 85 | Important | codex-meta-tags.md, Group 7 | Blog URL mismatch between meta tags doc and schema doc (/featured/ path vs. without) |
| 83 | Important | codex-blog-posts.md, All posts | Internal links use shortened slugs that don't match confirmed URL structure — 404 risk |
| 83 | Important | claude-schema-markup.md, Block 1 vs Block 4 | `@id` inconsistency (#org vs #localbusiness) for same business entity |
| 82 | Important | codex-community-pages.md, Tierra Verde | "15 interconnected islands" — Tierra Verde has six named subdivisions, not 15 islands |
| 82 | Important | claude-meta-tags.md, Old Northeast | Missing "Historic" keyword in replacement title; present in competitive landscape |
| 81 | Important | claude-schema-markup.md, Block 6 | Filled example uses identical publish/modified dates — negative E-E-A-T for market content |
| 81 | Important | claude-blog-posts.md, Post 3 | Cap rate 4%-7% presented as fact without source; needs attribution or reframing |
| 80 | Important | codex-meta-tags.md, Group 8 | Optimized titles on noindex candidates is contradictory and a deployment risk |
| 80 | Important | codex-community-pages.md, Downtown | H1 "in 33701's Premier Towers" is awkward phrasing that limits keyword relevance |
| 80 | Important | claude-community-pages.md, Downtown | Median condo price ($450K–$550K) inconsistent with blog post and Codex price references |
| 80 | Important | codex-blog-posts.md, Post 1 | CTA links (/buy/ and /sell/) may not be canonical slugs per the audit |

---

## Final Merged Version Recommendations

### Meta Tags
Use Claude as the base. Add Codex's additional URL entries (The Salvador, Vinoy Place, Pinellas County, Wesley Chapel, Downtown Tampa, flood zones blog, new-construction-condo blog). Fix Old Northeast title to include "Historic." Use Claude's noindex approach for off-topic pages.

### Schema Markup
Use Claude as the production base for all 9 blocks. Fix the #org vs #localbusiness @id conflict in Block 4. Add Codex's "remove incorrect Article schema from homepage/About page" note to the implementation checklist. Adopt Codex's priority ordering (CRITICAL/HIGH/MEDIUM). Do not use Codex's Buyer FAQ answers — rewrite from scratch using Claude's answers as the model.

### Community Pages
Use Claude's pages as written. Adopt Codex's CTA format (phone + press credentials). Fix the Downtown median price inconsistency. Verify internal link slugs match the live site structure before publishing all four pages.

### Blog Posts
Use Claude's posts as written. Adopt Codex's slightly better titles for Posts 2 and 4. Fix the cap rate sourcing issue in Post 3 by reframing as Liane's experience-based observation. Verify all internal link paths from both files against the confirmed URL structure before any post goes live.

---

*Review written 2026-04-08. All file paths are absolute references within /mnt/c/dev/site audit/clients/liane-jamason/seo/content/.*
