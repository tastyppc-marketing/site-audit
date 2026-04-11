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
