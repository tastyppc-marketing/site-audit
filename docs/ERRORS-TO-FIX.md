# Errors to Fix — Liane Jamason Report Visual QA

Date: 2026-04-09
Report: `clients/liane-jamason/seo/multipage-report-liane-jamason-2026-04-09/`

---

## 1. Overview Page (`index.html`)

### 1.1 Key Stats at a Glance — Missing Cards
- **Issue:** Only 6 cards displayed. Originally had 12+ cards.
- **Expected:** All key stat cards should render. Investigate what cards existed before and why they were dropped.

### 1.2 Badge Alignment on Cards
- **Issue:** Badges on cards are not consistently aligned. They should be aligned to the right or left depending on their position.
- **Expected:** Consistent badge alignment across all cards.

### 1.3 Site vs Competitor Comparison — Confusing Ranges
- **Issue:** Competitor column shows aggregated ranges like "287-1,100+" for Total Pages, "10-235" for Blog Posts, "7-50+" for Neighborhood Pages. This is confusing — it's rolling all competitors into a min-max range instead of showing individual values.
- **Expected:** Either show each competitor individually in the table, or make the presentation clearly understandable. A range across all competitors is not useful.

---

## 2. Keywords Page (`keywords.html`)

### 2.1 Sections 2-5 Completely Empty
- **Issue:** Sections 2, 3, 4, and 5 have no data at all. No explanation given — no "API not available" message, no "data not collected" message, nothing.
- **Expected:** Either populate the data or show a clear explanation of WHY the data is missing (which API failed, which step was skipped, what the user needs to do).

---

## 3. Technical Page (`technical.html`)

### 3.1 Core Web Vitals Section Empty
- **Issue:** Section 1 says "No Core Web Vitals" but doesn't explain why. We DO have CWV data from PSI (mobile perf 0.64, LCP 10.9s, CLS 0.001) — the normalizer was just fixed to populate it, but the renderer may not be displaying it.
- **Expected:** CWV gauges populated with real data. If data is missing for a legitimate reason, explain WHY.

### 3.2 No Pagination on Large Tables
- **Issue:** Multiple sections have hundreds or thousands of entries with no pagination:
  - Meta Tag Audit table
  - Crawl Issues table
  - Site Structure Overview
- **Expected:** All tables with more than ~25-50 rows should have pagination controls (previous/next, page numbers, rows per page selector).

---

## 4. Links Page (`links.html`)

### 4.1 Orphan Pages — No Pagination
- **Issue:** Orphan pages table (Section 2) has 915 entries with no pagination.
- **Expected:** Pagination controls.

### 4.2 Link Depth Analysis — No Data, No Explanation
- **Issue:** Section 4 says "No depth distribution available. Populate internalLinking.depth.results.depth to chart how many pages sit at each click depth." This is a developer-facing message, not a user-facing message. It doesn't explain WHY the data isn't there.
- **Expected:** Either populate the depth analysis data (it should be derivable from the crawl/link graph data we already have), or show a clear user-facing explanation.

### 4.3 Unreachable URLs — No Explanation
- **Issue:** Says "no unreachable URLs were supplied in the depth analysis result" — again developer-facing, not user-facing.
- **Expected:** User-friendly message or populated data.

---

## 5. Backlinks Page (`backlink-opportunities.html`)

### 5.1 Your Backlinks — No Pagination
- **Issue:** 376 backlinks listed with no pagination.
- **Expected:** Pagination controls.

### 5.2 Backlink Opportunity Summary — Zeros
- **Issue:** Says "No high priority gaps" and "0 Total Referring Domains Analyzed." We have 376 backlinks and 200 referring domains from DFS — this data exists but isn't being used.
- **Expected:** Actual referring domain analysis with real gap identification.

### 5.3 Top Opportunities — Completely Empty
- **Issue:** Section 4 has nothing.
- **Expected:** Populated from backlink gap analysis.

### 5.4 Backlink Intelligence — No Data
- **Issue:** Says "Link type breakdown data not yet available. Run the backlink researcher agent to classify referring domains by type."
- **Root cause:** The backlink researcher agent was never run as part of the workflow. This is a WORKFLOW GAP.
- **Expected:** Either the workflow must include this step, or the gather scripts must collect this data.

### 5.5 Link Type Gaps — Empty
- **Issue:** No data. Depends on backlink intelligence data.

### 5.6 Locally Relevant Opportunities — Empty
- **Issue:** No data.

### 5.7 Domain Rating Distribution — Empty
- **Issue:** No data. We DO have DR data from DFS for all 5 domains — this should be populatable.

### 5.8 Do-Follow Ratio — Competitors All 0%
- **Issue:** Client shows 45% do-follow ratio, but ALL competitors show 0%. This is obviously wrong — competitors have backlinks too.
- **Root cause:** The gather scripts only collected do-follow data for the client domain, not competitors.

### 5.9 Link Velocity — Empty
- **Issue:** Says "Link Velocity Data Not Yet Available."
- **Expected:** Either populate from DFS historical data or explain clearly.

### 5.10 Backlink Profile Similarity — Empty
- **Issue:** Says "Profile Similarity Data Not Yet Available. Run the backlink researcher agent with competitor intersection analysis."
- **Root cause:** Same as 5.4 — workflow gap.

### 5.11 Detailed Analysis — Completely Empty
- **Issue:** No data whatsoever.

---

## 6. Competitors Page (`competitors.html`)

### 6.1 Competitive Gap Analysis Chart — Missing Competitors
- **Issue:** Chart only shows Liane Jamason and Avalon Group. Other competitors (Eagan Luxury, Smith & Associates, Salamone Group) are missing from Total Pages, Blog Posts, and Neighborhood Pages bars.
- **Expected:** All competitors shown for all metrics.

### 6.2 Competitive Gap Table — Negative Values
- **Issue:** Shows negative numbers:
  - Avalon Group: -406.5 total pages, -112.5 blog posts, -21.5 neighborhood pages
- **Expected:** Gap values should make sense. If Liane has 365 pages and Avalon has 1,100+, the gap should be positive (Avalon ahead) not negative.

### 6.3 Metrics Comparison — Em Dashes for Missing Data
- **Issue:** Organic traffic, organic keywords, and traffic value show em dashes (—) with no explanation.
- **Expected:** Instead of "—", show "GSC not linked" or "Google Search Console not available" or similar clear explanation. User needs to know WHY the data is missing, not just that it's missing.

---

## 7. Local Page (`local.html`)

### 7.1 Local SEO Data Missing — No Why
- **Issue:** Sections 2 and 4 say "Local SEO data has not been collected yet" but don't explain WHY.
- **Expected:** Explain what needs to happen to collect this data (e.g., "Google Business Profile not linked" or "Local SEO crawl not run — run X script").

### 7.2 Map Pack Visibility — Same Issue
- **Issue:** Says data not collected, no explanation.

### 7.3 Sidebar Navigation — Map Pack Not Selectable
- **Issue:** When scrolling to Map Pack Visibility, the sidebar navigation doesn't highlight it. The "What does this mean?" explainer also doesn't show for this section.
- **Root cause:** Likely the IntersectionObserver isn't tracking this section, or the section ID doesn't match the nav link.

---

## 8. Action Plan Page (`action-plan.html`)

### 8.1 AI References in Deliverables — MUST REMOVE
- **Issue:** Section 7 Deliverables, Meta Titles & Descriptions status says "Ready M-2 versions created (Claude plus Codex)".
- **RULE:** NO AI REFERENCES IN THE REPORT. EVER. This is client-facing. References to Claude, Codex, GPT, AI, or any AI tool must be stripped from all report output.
- **Expected:** Status should say something like "Ready — 2 versions created" with no mention of how they were created.

---

## 9. Cross-Cutting Issues

### 9.1 Pagination Missing Everywhere
Tables that need pagination:
- Technical: Meta Tag Audit, Crawl Issues, Site Structure Overview
- Links: Orphan Pages (915 entries)
- Backlinks: Your Backlinks (376 entries)
- Any table with >50 rows

### 9.2 Empty Sections Don't Explain Why
Every empty section should show:
1. WHAT data is missing
2. WHY it's missing (API not enabled, script not run, GSC not linked, etc.)
3. HOW to fix it (which script to run, which API to enable)

Never show developer-facing messages like "Populate internalLinking.depth.results.depth" to the user.

### 9.3 Workflow Gaps
The backlink researcher agent is referenced in multiple empty-state messages but was never part of the audit workflow. This needs to be added to the /seo-audit skill.

### 9.4 No AI References
Zero tolerance. Scan ALL report output for: Claude, Codex, GPT, OpenAI, Anthropic, AI-generated, AI-assisted, or any similar references. Strip them all.

---

## 10. Round 2 Visual QA (2026-04-11)

### Status of Round 1 Fixes
- [x] Key Stats: 10 cards (was 6) — FIXED
- [x] Site comparison: now uses per-competitor columns — FIXED
- [x] CWV: now populated (mobile 0.64, desktop 0.94) — FIXED
- [x] AI references: sanitizer + manual fix — FIXED
- [x] Depth analysis: BFS computed (13 levels, 1042 unreachable) — FIXED
- [x] Empty state messages: user-facing for most sections — FIXED
- [x] tailwind.css: was missing from output dir — FIXED
- [ ] Pagination: JS code present but NOT WORKING at runtime — SEE 10.1

### 10.1 Pagination Not Firing at Runtime
- **Issue:** `data-paginate` attributes exist in the JS renderer code, `table-pagination.js` is loaded in all 9 HTML pages, `pagination.init()` is called in boot() — but pagination controls do NOT appear in the browser.
- **Affected tables:** Meta Tag Audit, Schema Markup, Crawl Issues, Site Structure, Orphan Pages, Your Backlinks
- **Root cause:** NEEDS INVESTIGATION — scripts load in correct order, init is called, but controls aren't rendering. Could be a timing issue, CSS visibility issue (now that tailwind.css is restored), or a bug in the pagination init logic.

### 10.2 Duplicate Meta Content — Links Are a Mess
- **Issue:** In Technical > Meta Tag Audit > Duplicate Meta Content, pages sharing the same meta value show their URLs separated by commas with no formatting. The list is massive and unreadable.
- **Expected:** 
  1. Organize links vertically (one per line), not comma-separated
  2. Hide most links behind a "Show more" button
  3. Only show first 3-5 links by default, expand on click

### 10.3 Hub & Spoke Clusters — Static "+N more" Badges
- **Issue:** Hub URL cards show badges like "+29 more" and "+28 more" but they are static text, not clickable.
- **Expected:** Clicking the badge should expand to show all spoke URLs.

### 10.4 Unreachable URLs — Static "+34 more" Badge
- **Issue:** Same as 10.3 — the "+34 more" badge in the unreachable URLs section is not expandable.
- **Expected:** Click to expand and see all URLs.

### 10.5 Keywords Section 2 — Qualitative Volumes
- **Issue:** "Search volumes are qualitative only" — this is because the keyword-researcher agent records volumes as labels (High/Medium/Low) instead of numbers.
- **Root cause:** WORKFLOW GAP — need to add a DataForSEO keyword lookup step that fetches numeric monthly search volumes.
- **Expected:** Numeric volumes so the chart can render.

### 10.6 Keywords Sections 3-6 — Empty, Partially Explained
- **Section 3 (Organic Visibility):** Empty. Message now says "requires DataForSEO API connection or Google Search Console access" — FIXED from dev message.
- **Section 4 (Search Console):** Empty. Says "Google Search Console is not linked" — GOOD.
- **Section 5 (Traffic Overview):** Empty. Says "requires Google Analytics or Search Console access" — GOOD.
- **Section 6 (Rank Tracking History):** Empty. Says "not yet available, future audits will show" — GOOD.

### 10.7 Backlink Opportunity Summary — Zero Tiles
- **Issue:** All tiles show zero because competitor backlinks were never scraped.
- **Root cause:** WORKFLOW GAP — the /seo-audit workflow needs a step that asks "Do you want to scrape competitor backlinks? (costs API credits)" and then runs gather-backlinks.js for each competitor domain.
- **Expected:** After competitor backlink scraping, the opportunity summary should show real gap data.

### 10.8 Domain Rating Distribution — Empty
- **Issue:** No chart shown. We have DR data for all 5 domains from domain-metrics.json.
- **Expected:** Bar chart showing DR for client + all competitors.

### 10.9 Empty State Messages — Need Source-Specific Language
- **Rule:** Each empty panel must name the SPECIFIC data source it needs:
  - If it needs GBP: "Requires Google Business Profile access"
  - If it needs GA4: "Requires Google Analytics 4 access"
  - If it needs GSC: "Requires Google Search Console access"
  - If it needs DFS Backlinks: "Requires DataForSEO Backlinks API"
  - If it needs a workflow step: "Requires [specific step] — run [command]"
- **Rule:** If a panel says "all data from web research" but shows NO data, that's confusing. Clarify what "web research" means or what it couldn't find.

### 10.10 Workflow Must Match Report Expectations
- Every section that says "Run X to populate this" MUST have that step in the /seo-audit skill workflow.
- Current gaps:
  1. Numeric keyword volumes (DataForSEO keyword lookup)
  2. Competitor backlink scraping (gather-backlinks.js for each competitor)
  3. Backlink type classification (link type breakdown)
  4. Link velocity analysis
  5. Competitor backlink intersection/overlap analysis

### 10.11 Visual Verification Requirement
- After every report regeneration, use Claude/Codex vision to visually inspect all 9 pages.
- Check: layout renders correctly, pagination visible, charts populated, no broken sections.
