# SEO Audit Standard Operating Procedure (SOP)

> This file is read at the start of every audit to ensure consistency.
> Every requirement below is **mandatory** unless explicitly overridden by the user for a specific client.

---

## 1. Data Collection Requirements

### 1.1 DataForSEO API Calls (Mandatory)
Every audit MUST include real API data from DataForSEO. Never use qualitative labels (High/Medium/Low) for search volume — always fetch real monthly numbers.

**Required DFS endpoints:**
- **Keyword Search Volumes**: `keywords_data/google_ads/search_volume/live` for all target keywords. Use the correct location_code for the client's country (Canada=2124, US=2840, etc.)
- **SERP Top 5**: `serp/google/organic/live/advanced` for each keyword — get the actual top 5 organic results with domain, URL, title, description
- **Domain Metrics**: `backlinks/summary/live` for client + all competitors — get DR, referring domains, total backlinks
- **Client Backlinks**: `backlinks/backlinks/live` (top 50) + `backlinks/referring_domains/live` (top 20) for the client domain
- **Organic Keywords**: `dataforseo_labs/google/ranked_keywords/live` for client + primary competitor
- **PageSpeed Insights**: Google PSI API for client homepage + 3-4 key pages (mobile AND desktop), plus competitor homepages

### 1.2 Content Quality — Real Text Extraction (Mandatory)
Never estimate readability scores from metadata. Always:
1. Crawl every page with Playwright using `--extract-text`
2. Strip boilerplate (nav, footer, sidebar, scripts) to get body content only
3. Compute REAL Flesch-Kincaid scores using syllable counting and sentence parsing
4. Include `scoreExplanation` for every page explaining WHY it scored what it did
5. Reference actual metrics in explanations (avg sentence length, syllables per word, content type)

**Flesch Reading Ease formula:**
```
FRE = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
```

**Flesch-Kincaid Grade formula:**
```
FKG = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
```

### 1.3 All Report Sections Must Be Populated
Every section in the HTML report must have real data. NEVER leave sections showing "data not available" or "analysis has not been run yet" unless we genuinely cannot access the data source (e.g., no GA access). If a section is empty, that's a bug — fix it before delivering.

**Sections that require API data:**
- Keywords: search volumes (DFS), SERP top 5 (DFS), organic visibility (DFS)
- Technical: Core Web Vitals (PSI API), PageSpeed scores (PSI API)
- Links: Backlink profile (DFS), domain metrics (DFS)
- Competitors: Domain metrics comparison (DFS), PageSpeed comparison (PSI API)

**Sections that require crawl data:**
- Content: readability (real text extraction), thin content, duplicates, cannibalization, structure
- Technical: meta tags, schema, crawl issues, site structure
- Links: internal link graph, orphan pages, hub & spoke, link depth

**Sections that require client access (note when missing):**
- Keywords: Search Console data — requires GSC access
- Keywords: Traffic data — requires GA access
- Local: GBP data — requires GBP access
- Local: Review sentiment — requires GBP or manual review collection

### 1.4 Data Availability Notes
When we don't have access to a client's GA, Search Console, or GBP, show a clear callout (not a generic "data not available") explaining:
- What specific tool we need access to
- What data it would unlock
- How to grant access (invite email, property sharing steps)

Use the `.data-access-callout` CSS class for these notices.

---

## 2. Report Template Requirements

### 2.1 Layman's Explainer Widget (Mandatory)
Every report page MUST include the floating explainer widget (`shared/explainer.js`). This:
- Shows on all 8 report pages
- Changes content as the user scrolls between sections
- Explains each section in plain English (no jargon)
- Includes a "Tip" with actionable takeaway
- Can be minimized by the user
- Is hidden on print

If adding new sections to any report page, add corresponding explanations to the `EXPLANATIONS` object in `explainer.js`.

### 2.2 Score Explanation Popovers (Mandatory)
Any table showing scores (readability, quality, PageSpeed, etc.) MUST include hover popovers that explain WHY each item got that score. Users should never see a number without being able to understand what drove it.

Implementation: Add `data-popover="explanation text"` to table rows and use the `initPopovers()` function from content.js.

### 2.3 Location Accuracy
Always verify the service area map points to the correct location. The GeoJSON center point and polygon must match the client's actual city, not a previous client's location.

---

## 3. Content Deliverables Requirements

### 3.1 Keyword Density Guidance (NeuronWriter-style)
Every content deliverable (community pages, blog posts) MUST include a keyword optimization guide showing:
- **Primary keyword**: target density 1.0-1.5% (e.g., 12-18 uses in 1,200 words)
- **Secondary keywords** (5-8): with specific target count per article
- **LSI/Supporting keywords** (8-10): with target count
- **Too much**: >2.5% = keyword stuffing warning
- **Too little**: <0.5% = undertargeted warning

### 3.2 Canadian/Local Accuracy
For Canadian clients:
- Use Canadian English spelling (neighbourhood, favourite, colour, etc.)
- Reference Canadian institutions (CMHC, not PMI; RRSP/FHSA, not 401K; land titles, not escrow)
- Use CAD currency
- Reference local programs (Alberta has no provincial land transfer tax, etc.)
- Flag and fix any US-centric template content

For all clients: verify all content references the correct city, province/state, and local data.

### 3.3 Meta Tags
- Title: 50-60 characters with primary keyword + location + brand
- Description: 120-155 characters with location + CTA + unique value
- Show character count in parentheses for every entry
- Every community/service page gets a UNIQUE description (no templates)

### 3.4 Schema Markup
- Use consistent @id URIs across all schemas
- Include all required types: Organization, LocalBusiness/RealEstateAgent, Person, WebSite, Article, BlogPosting, FAQPage, BreadcrumbList
- Use correct currency and local data
- Include implementation priority order
- Add AggregateRating template only with warning not to deploy until real reviews exist

---

## 4. Audit Pipeline Execution Order

### 4.1 Research Phase (Parallel Agents)
Launch these agents simultaneously:
1. **keyword-researcher** — WebSearch for all target keywords
2. **site-crawler** — Playwright crawl of client sitemap + page analysis
3. **content-auditor** — Deep content analysis of every page with text extraction
4. **competitor-analyzer** — Crawl all known competitors + auto-discover 5-8 new ones from SERP/map packs
5. **best-practices-researcher** — Current year SEO best practices (10 topics)
6. **backlink-researcher** — Backlink profiles via free tools + WebSearch
7. **dfs-data-fetcher** — All DataForSEO and PageSpeed API calls

### 4.2 Content Text Extraction (After Crawl)
After site-crawler completes, run `scripts/extract-text.js` to:
- Extract body text from every page (strip boilerplate)
- Compute real Flesch-Kincaid readability scores
- Generate per-page score explanations
- Save to `research/page-text-analysis.json`

### 4.3 Report Compilation
After all research agents complete:
- Compile FINAL-AUDIT-REPORT.md from all research files
- Include real DFS search volumes in all keyword tables
- Include real PageSpeed scores in technical section
- Include real domain metrics in competitor comparison
- Include NeuronWriter-style keyword density targets in content calendar

### 4.4 Implementation Deliverables
After report compilation:
- Meta tags (all pages)
- Schema markup (all page types)
- Community/service area pages (top 4)
- Blog posts (4 SEO-optimized)
- All with keyword density guides

### 4.5 Data Population
After deliverables:
- Populate audit-data.json with ALL real data
- Verify contentQuality has proper structure (summary + pages[] + duplicateGroups[] + cannibalization[])
- Verify backlinks section has domainMetrics + topBacklinks + competitorDomainMetrics
- Verify technicalSeo has coreWebVitals + lighthouseResults + pageSpeedComparison
- Verify localSeo.serviceAreaMap points to correct location
- Regenerate HTML report
- Generate Excel + PowerPoint

### 4.6 Quality Checks Before Delivery
- [ ] All 8 HTML report pages render without "data not available" messages (except GA/SC/GBP access notes)
- [ ] Readability scores are real (not bucketed), with unique values per page
- [ ] Search volumes are real numbers from DFS (not qualitative labels)
- [ ] PageSpeed scores are real from PSI API
- [ ] Domain metrics are real from DFS
- [ ] Service area map points to correct city
- [ ] Explainer widget loads and changes per section
- [ ] Score popovers show on hover in content/readability tables
- [ ] All content deliverables use correct local terminology
- [ ] Meta tag character counts are accurate
- [ ] JSON in audit-data.json is valid

---

## 5. Logging Requirements

Every agent/process MUST log to `seo/audit-log.md`:
- START entry with timestamp, process name, and what it's doing
- COMPLETE entry with timestamp, status (SUCCESS/FAIL), and summary of results
- If FAIL: include error details

Format:
```
| {timestamp} | {PROCESS_NAME} | {STATUS} | {details} |
```

---

## 6. Triple-Route Comparison (When Requested)

When user requests dual or triple route:
- Run Claude, Codex, and Gemini on same deliverables
- Output files named: `{deliverable}.md` (Claude), `codex-{deliverable}.md`, `gemini-{deliverable}.md`
- Spawn a triple-reviewer agent that scores all on 4 dimensions (SEO, Content Quality, Actionability, 2026 Compliance)
- Declare winner per deliverable + overall ranking
- Document hybrid merge strategy

---

## 7. v1 vs v2 Comparison (When Re-running)

When re-running an audit:
- Backup existing data to `research-v1-backup/` and `audit-data-v1-backup.json`
- After v2 completes, spawn comparison agents that analyze all 10 dimensions
- Document: what changed, what v1 missed, what v1 got right, data quality assessment
- If triple-route: run comparison through all 3 LLMs for independent perspectives

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-31 | Initial SOP created from Calgary Castles v2 audit learnings |
| 2026-03-31 | Added: real readability scoring requirement (no fixed buckets) |
| 2026-03-31 | Added: score explanation popovers on all score tables |
| 2026-03-31 | Added: layman's explainer widget requirement |
| 2026-03-31 | Added: DFS API data mandatory for all audits |
| 2026-03-31 | Added: content text extraction for real Flesch-Kincaid |
| 2026-03-31 | Added: NeuronWriter-style keyword density in all content deliverables |
| 2026-03-31 | Added: Canadian/local accuracy checks |
| 2026-03-31 | Added: quality checklist before delivery |
