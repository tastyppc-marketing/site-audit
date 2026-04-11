# User Visual QA Input — 2026-04-09

## Source
Direct user feedback after visually inspecting the Liane Jamason report at:
`clients/liane-jamason/seo/multipage-report-liane-jamason-2026-04-09/`

This is the verbatim feedback organized by page. All fixes must apply at the TEMPLATE level (`template/reports/multipage/`) so every future client benefits.

---

## Index Page (index.html)

### Key Stats at a Glance
- Only 6 cards displayed. Originally had 12 or more. Need to restore the full set.

### Badge Alignment
- All badges on cards should be consistently aligned (right or left depending on position). Currently misaligned.

### Site vs Competitor Comparison (#3)
- Shows confusing ranges instead of individual competitor values:
  - Total Pages: client "365+", competitor "287-1,100+"
  - Blog Posts: client "287", competitor "10-235"
  - Neighborhood Pages: client "15+", competitor "7-50+"
- This is incredibly confusing. A min-max range across all competitors is not useful.

---

## Keywords Page (keywords.html)

### Sections 2, 3, 4, 5 — Completely Empty
- No data at all in these sections.
- No explanation given — no "API not available", no "data not collected", nothing.
- This is unacceptable. If data is missing, the report MUST explain why.

---

## Technical Page (technical.html)

### Core Web Vitals (#1) — Empty
- Says "No Core Web Vitals" but doesn't explain why.
- We DO have CWV data from PSI. Something is wrong in the pipeline.

### No Pagination on Large Tables
- Meta Tag Audit: needs pagination — too many entries.
- Crawl Issues: needs pagination.
- Site Structure Overview: needs pagination — "so much here, it's ridiculous."

---

## Links Page (links.html)

### Orphan Pages (#2) — No Pagination
- All entries dumped into one massive table. Needs pagination.

### Link Depth Analysis (#4) — No Data
- Says "No depth distribution available. Populate internalLinking.depth results.depth to chart: how many pages sit at each click depth?"
- This is a developer-facing message, NOT a user-facing message.
- Doesn't explain WHY there's no data.

### Unreachable Status
- Says "no unreachable URLs were supplied in the depth analysis result."
- Not clear if this is a genuine result or if the analysis just didn't run.

---

## Backlinks Page (backlink-opportunities.html)

### Your Backlinks (#1) — No Pagination
- 376 entries with no pagination.

### Backlink Opportunity Summary (#3) — Shows Zeros
- Says "No high priority gaps"
- Says "0 Total Referring Domains Analyzed" — this can't be right
- "zero shared" — not sure if true or just not analyzed

### Top Opportunities (#4) — Completely Empty
- Nothing entered at all.

### Backlink Intelligence (#5) — No Data
- Says "Link type breakdown data not yet available. Run the backlink researcher agent to classify referring domains by type."
- This means the backlink researcher agent was never run. This is a WORKFLOW GAP — it needs to be added to the workflow.

### Link Type Gaps — Empty
### Locally Relevant Opportunities — Empty
### Domain Rating Distribution — Empty

### Do-Follow Ratio Comparison
- Client shows 45%, but ALL competitors show 0%.
- This is obviously wrong. Competitors have backlinks too.

### Link Velocity — Empty
- Says "Link Velocity Data Not Yet Available"

### Backlink Profile Similarity — Empty
- Says "Profile Similarity Data Not Yet Available. Run the backlink researcher agent with competitor intersection analysis."

### Detailed Analysis — Completely Empty

---

## Competitors Page (competitors.html)

### Competitive Gap Analysis Chart (#2)
- Only shows Liane Jamason and Avalon Group.
- Other competitors (Eagan Luxury, Smith & Associates, Salamone Group) are MISSING from the Total Pages, Blog Posts, and Neighborhood Pages bars.

### Competitive Gap Table — Negative Values
- Avalon Group shows:
  - -406.5 total pages
  - -112.5 blog posts
  - -21.5 neighborhood pages
  - 12 keyword ranking (this one seems fine)
- Negative page counts are impossible. Something is broken in the gap calculation.

### Metrics Comparison (#4) — Em Dashes
- Organic traffic, organic keywords, and traffic value show em dashes (—).
- This does NOT explain why. Should say "GSC not available" or "Google Search Console not linked" — something that tells the user WHY.

---

## Local Page (local.html)

### Local SEO Data (#2, #4) — No Why
- Says "Local SEO data has not been collected yet" but doesn't explain WHY.
- Needs to say what the user needs to do (link GBP, run a script, etc.)

### Map Pack Visibility
- Same "data not collected" issue with no explanation.
- Sidebar navigation doesn't highlight Map Pack Visibility when scrolled to it.
- "What does this mean?" tooltip doesn't show for this section.

---

## Action Plan Page (action-plan.html)

### AI References — MUST REMOVE
- Section 7 Deliverables: "Ready M-2 versions created (Claude plus Codex)"
- **NO AI REFERENCES IN THE REPORT. EVER.**
- This is client-facing. Zero tolerance for Claude, Codex, GPT, AI, Anthropic references.

---

## Cross-Cutting Requirements

### 1. Pagination
- Every table with more than ~50 rows MUST have pagination.
- Affected: Technical (meta tags, crawl issues, site structure), Links (orphan pages), Backlinks (your backlinks).

### 2. Empty Sections Must Explain WHY
- Every empty section should show:
  1. WHAT data is missing
  2. WHY it's missing (API not enabled, script not run, GSC not linked, etc.)
  3. HOW to fix it (which script to run, which API to enable)
- Never show developer-facing messages like "Populate internalLinking.depth..."

### 3. No AI References
- Scan ALL report output for: Claude, Codex, GPT, OpenAI, Anthropic, AI-generated, AI-assisted.
- Strip them all. Add a sanitizer to prevent future occurrences.

### 4. All Fixes at Template Level
- Every fix must be in `template/reports/multipage/` (source of truth).
- Client copies get the same fixes.
- Future clients created from template automatically inherit all fixes.

---

## Process Requirements (from user)

1. **Systematic debugging** — no fixes without root cause investigation first.
2. **Silent failure hunter** — must scan every fix for hidden errors.
3. **Fix loop:** fix → QA → silent-failure-hunter → code-reviewer → loop until all pass.
4. **After fixes:** regenerate report → Claude visual inspection → Codex code inspection → loop if issues found.
5. **Use agents:** smart-team with CC-Diagnostician, CX-Executor, qa-tester, silent-failure-hunter, code-reviewer.
6. **Save everything:** plans and input into documents so any session can continue.
