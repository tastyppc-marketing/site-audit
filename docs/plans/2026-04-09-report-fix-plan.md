# Plan: SEO Report Comprehensive Fix

## Context

The Liane Jamason 9-page SEO audit report has 31 distinct issues found during visual QA. Phases 0-3 of the pipeline fix are complete (bug fixes, gather scripts, normalizer, API integration), but the report output has significant gaps: empty sections without explanations, missing pagination on large tables, broken chart data parsing, workflow gaps where agents were never run, and AI tool references in client-facing output. This plan addresses every issue systematically.

## Research Findings

### Architecture (from research agents)
- **Generator:** `generate-multipage-report.js` runs 13 normalizations on `audit-data.json`, auto-populating from `research/*.json` files, then injects `window.AUDIT_DATA` into 9 HTML templates
- **Renderers:** 9 page-specific JS files in `pages/` each read specific data keys from AUDIT_DATA
- **Shared utils:** `utils.js` (escaping, badges, API error banners), `table-filters.js` (filtering only, NO pagination), `charts.js` (Chart.js factories), `nav.js` (scrollspy), `explainer.js` (tooltips)
- **No pagination exists anywhere** — all tables render every row into the DOM

### Root Causes (every issue traced)

| # | Issue | Root Cause | Fix Type |
|---|-------|-----------|----------|
| 1 | Key Stats only 6 cards | `audit-data.json:keyStats[]` has only 6 entries | DATA + NORMALIZER |
| 2 | Badge alignment | CSS positioning on stat-card severity indicators | CSS |
| 3 | Site comparison ranges ("287-1,100+") | `siteComparison` aggregates all competitors into min-max range; `competitorComparison` has per-competitor data but isn't used here | RENDERER |
| 4 | Keywords sections 2-5 empty | Volume is qualitative ("High"), organic reads `backlinks.domainMetrics` (old path), no GSC/traffic data | RENDERER + NORMALIZER |
| 5 | CWV not rendering | **Order of operations bug:** CWV copy (normalizer step 1, line 528) runs BEFORE PSI auto-population (step 2b, line ~625). By the time PSI data sets `tech.coreWebVitals`, the copy to `data.coreWebVitals` already passed | NORMALIZER |
| 6 | No pagination anywhere | Zero pagination in codebase. `table-filters.js` only hides/shows rows | NEW FEATURE |
| 7 | Link Depth empty | `depth_result.depths={}`, `max_depth=0` — BFS depth from homepage never computed from link-graph.json | NORMALIZER |
| 8 | Backlink Opportunities empty (0 RD analyzed) | `backlinkOpportunities` is undefined — no `backlink-opportunities.json` file, backlink-researcher agent never ran | NORMALIZER + NEW SCRIPT |
| 9 | Do-follow 0% for competitors | `gather-backlinks.js` only collects client backlinks, not competitors | RENDERER (show "Not analyzed") |
| 10 | Gap chart missing competitors | `parseNumericValue()` fails on "1,000s", "1,100+", "~100", "43+" — non-numeric characters | RENDERER |
| 11 | Negative gap values | Same parsing issue as #10 — malformed numbers produce wrong math | RENDERER |
| 12 | Em dashes for null data | `val != null ? formatNumber(val) : '&mdash;'` — no check for WHY data is missing | RENDERER |
| 13 | Local SEO no explanation | `localSeo.accessNotes` has explanation but renderers don't use it | RENDERER |
| 14 | Map Pack sidebar not selecting | Section ID / nav config mismatch or missing IntersectionObserver target | RENDERER |
| 15 | AI references ("Claude + Codex") | `audit-data.json:837` has "Claude + Codex" in deliverable status | DATA + SANITIZER |

---

## Implementation Steps

### Step 1: Normalizer Fixes (generate-multipage-report.js) — SEQUENTIAL, template + client copies

**1a. Fix CWV order-of-operations bug**
- File: `template/reports/multipage/generate-multipage-report.js` (and client copy)
- After the PSI auto-population block (~line 670 in current file), add a SECOND CWV copy:
  ```
  // Re-run CWV hoisting after PSI auto-population
  if (!data.coreWebVitals && tech.coreWebVitals) {
    data.coreWebVitals = tech.coreWebVitals;
    fixes++;
  }
  ```
- Also add `score` alias from `performanceScore` (same as original step 1 logic)

**1b. Auto-derive keyStats from available data**
- After all normalizations complete, if `data.keyStats` has fewer than 10 entries, auto-append derived stats:
  - CWV mobile performance score (from `data.coreWebVitals.mobile.performanceScore`)
  - Total backlinks count (from `data.backlinks.topBacklinks.length`)
  - Referring domains (from `data.domainMetrics.client.referringDomains`)
  - Domain Rating (from `data.domainMetrics.client.domainRating`)
  - Orphan pages count (from `data.internalLinking.orphan_count`)
  - Total pages crawled (from `data.internalLinking.total_pages`)
- Only append if the stat doesn't duplicate an existing keyStats entry

**1c. Compute link depth from link-graph.json**
- After hub cluster auto-population, if `depth_result.depths` is empty and link-graph.json exists:
  - BFS from homepage URL through link graph
  - Compute depth distribution: `{0: 1, 1: N, 2: N, ...}`
  - Compute max_depth, avg_depth
  - Find unreachable pages (in crawl but not reachable from homepage)
  - Write into `data.internalLinking.depth_result`

**1d. Auto-compute backlink opportunities from existing data**
- If `backlinkOpportunities` is missing/empty but we have `client-backlinks.json` and `domain-metrics.json`:
  - Build `backlinkOpportunities.client` from domainMetrics client entry + backlink count
  - Build `backlinkOpportunities.competitors` from domainMetrics competitor entries
  - Compute `backlinkOpportunities.opportunities` by finding referring domains that link to competitors but not client (requires competitor backlinks — may be limited)
  - Set `referring_domains_analyzed` count from client backlinks

**1e. AI reference sanitizer**
- After all normalizations, before data injection:
  - Deep-walk the entire data object
  - For any string value, regex-replace references to: Claude, Codex, GPT, OpenAI, Anthropic, "AI-generated", "AI-assisted", "AI tool"
  - Replace with neutral alternatives: "Claude + Codex" → "", "(AI)" → "", etc.
  - Log a warning when found so we can fix the source data too

**1f. Populate organic metrics into backlinks.domainMetrics**
- The keywords renderer reads `data.backlinks.domainMetrics.organicKeywords` but we populate `data.domainMetrics.client` (top-level). After domainMetrics normalization, copy relevant fields into `backlinks.domainMetrics` for backward compatibility.

---

### Step 2: Pagination Component (shared/table-pagination.js) — NEW FILE

Create a reusable client-side pagination system:

- **API:** `window.TPPC.pagination.init(tableWrapper, options)`
  - `options.pageSize` — default 50
  - `options.pageSizes` — [25, 50, 100, "All"]
- **Behavior:**
  - Counts `<tbody> <tr>` rows
  - If count > pageSize, adds pagination bar below table
  - Pagination bar: "Showing X-Y of Z" | prev/next buttons | page numbers | page size selector
  - Hides rows outside current page via `display:none`
  - Works WITH existing table-filters.js (respects already-hidden filtered rows)
- **Integration:** Called from `data-loader.js` boot sequence after `filters.init()`
- **Auto-detect:** Any `[data-paginate]` wrapper auto-paginates; or call manually

Files to modify:
- `shared/table-pagination.js` — NEW
- All 9 HTML pages — add `<script src="shared/table-pagination.js"></script>`
- `data-loader.js` — call `pagination.init()` in boot sequence
- Tables that need it: add `data-paginate` attribute to their wrapper divs

Tables needing pagination:
- `technical.html` — meta tag audit, crawl issues, site structure
- `links.html` — orphan pages (915 rows)
- `backlink-opportunities.html` — your backlinks (376 rows)
- Any table with >50 rows

---

### Step 3: Renderer Fixes (pages/*.js) — PARALLEL per file

**3a. `index.js` — Site comparison table**
- Replace `siteComparison` data source with `competitorComparison` (which has per-competitor columns)
- Or: reformat siteComparison to be clearer (show "Range across 5 competitors" as column header)
- Preferred: use `competitorComparison` data since it has individual comp1-comp5 values

**3b. `keywords.js` — Empty section explanations**
- `renderVolumeChart`: when volumes are qualitative, show "Search volumes are qualitative (High/Medium/Low). Numeric volume data from DataForSEO would enable this chart."
- `renderOrganicOverview`: check BOTH `data.backlinks.domainMetrics` AND `data.domainMetrics.client`
- `renderSearchConsole`: reference `localSeo.accessNotes` — show "Google Search Console is not linked for this client."
- `renderTrafficOverview` / `renderRankHistory`: same pattern — check accessNotes, explain what's needed

**3c. `technical.js` — CWV rendering**
- After normalizer fix 1a, CWV data should flow through. Verify the renderer reads `data.coreWebVitals.mobile.score` (or `performanceScore`).
- Add empty-state explanation if still null: "PageSpeed Insights API key not configured" or similar.

**3d. `links.js` — Depth analysis explanation**
- When `depth.depths` is empty: show user-facing message "Link depth analysis requires a crawl from the homepage. The current crawl data doesn't include depth information." instead of developer message "Populate internalLinking.depthResult..."
- Same for unreachable URLs — clean up developer-facing text

**3e. `competitors.js` — Fix parseNumericValue**
- Update `parseNumericValue()` to handle: "365+", "1,000s", "~100", "43+", "1,100+"
  - Strip: commas, "+", "~", "s" suffix
  - Parse remaining number
- Fix gap calculation to handle edge cases (avoid negative values for gap display)
- Replace em dash for null organic/traffic values with "GSC not linked" or "Data not available — [reason]"

**3f. `backlink-opportunities.js` — Competitor do-follow + empty states**
- Where competitor dofollowRatio is 0 and no competitor backlink data was gathered: show "Not analyzed" instead of "0%"
- For empty intelligence/velocity/similarity sections: show user-facing explanation referencing what data collection is needed, not "run the backlink researcher agent"
- For domain rating distribution: compute from available domainMetrics data (we have DR for all 5 domains)

**3g. `local.js` — Access notes explanation**
- Read `data.localSeo.accessNotes` 
- When sections are empty, include the reason: "No access to Google Business Profile for this client. All data from web research."
- Fix Map Pack Visibility sidebar selection (verify section ID matches nav config entry)

**3h. `action-plan.js` — AI reference cleanup**
- Double-check renderer doesn't inject AI references itself
- The normalizer sanitizer (step 1e) should catch data-level references

---

### Step 4: Data Fix (audit-data.json) — ONE-TIME

- Remove "Claude + Codex" from line 837 in `clients/liane-jamason/seo/audit-data.json`
- Verify no other AI references exist in the data file

---

### Step 5: CSS Fix (report-styles.css)

- Check badge alignment on stat cards and issue cards
- Ensure severity badges are consistently positioned (right-aligned within card headers)

---

## Execution Order

```
Step 1a (CWV order fix)          ─┐
Step 1e (AI sanitizer)           ─┤
Step 1f (organic metrics copy)   ─┤── Normalizer fixes (sequential)
Step 1b (auto-derive keyStats)   ─┤
Step 1c (link depth from graph)  ─┤
Step 1d (backlink opportunities) ─┘
                                  │
Step 2 (pagination component)    ─── New shared component (parallel with renderers)
                                  │
Step 3a-3h (renderer fixes)      ─── 8 renderer fixes (parallel with each other)
                                  │
Step 4 (data fix)                ─── One-time data cleanup
Step 5 (CSS fix)                 ─── Badge alignment
                                  │
                      ┌───────────┘
                      ▼
              REGENERATE REPORT
                      │
                      ▼
         VISUAL VERIFICATION (Claude)
                      │
                      ▼
          CODE VERIFICATION (Codex)
                      │
              ┌───────┴───────┐
              │  Issues found? │
              └───┬───────┬───┘
                YES       NO
                  │         │
                  ▼         ▼
            FIX LOOP    COMMIT
```

## Smart-Team Deployment

**Team:** `seo-report-fix`

**Agents:**
1. **CC-Diagnostician** — normalizer fixes (steps 1a-1f), complex data flow tracing, user-facing message wording
2. **CX-Executor** — renderer fixes (steps 3a-3h), pagination component (step 2), CSS fix (step 5)
3. **qa-tester** — after each fix batch: regenerate report, verify sections render
4. **silent-failure-hunter** — scan all modified error handling, catch blocks, empty states
5. **code-reviewer** — review all diffs for quality, XSS safety, convention compliance
6. **product-verifier** — visual verification of final report against ERRORS-TO-FIX.md checklist

**Loop:**
- CC/CX implement fixes → QA runs report generation + checks → silent-failure-hunter scans → code-reviewer reviews
- If ANY checker finds issues → back to CC/CX with specific findings
- Loop until all three pass clean

## Testing Strategy

1. **After each normalizer fix:** Run `node generate-multipage-report.js` and extract specific data from HTML to verify
2. **After pagination:** Open report in browser, verify pagination controls appear on large tables
3. **After renderer fixes:** Visual check of each affected section
4. **Final verification:**
   - All 9 pages generate without errors
   - `grep -ri "claude\|codex\|gpt\|anthropic" *.html` returns zero matches in visible text
   - `grep -ri "NaN\|undefined\|null" *.html` — only in JS code, not in visible content
   - No developer-facing messages visible
   - All empty sections explain WHY
   - Pagination on tables with >50 rows

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Normalizer changes break working sections | Save point commit before fixes. Verify ALL 9 pages after each normalizer change, not just the target section |
| Pagination conflicts with table-filters.js | Pagination must check filter state — only paginate visible (non-filtered) rows |
| parseNumericValue fixes cause unexpected parsing | Test with all existing competitorComparison values before deploying |
| BFS depth computation too slow for 1664 pages | Link graph is adjacency list, BFS is O(V+E) — should complete in <1s |
| AI sanitizer too aggressive | Regex should be specific: word-boundary matches only, not partial words |

## Files Affected

### Modified (template + client copies — 18 files total):
- `generate-multipage-report.js` — normalizer fixes (steps 1a-1f)
- `pages/index.js` — site comparison table (step 3a)
- `pages/keywords.js` — empty state messages (step 3b)
- `pages/technical.js` — CWV display verification (step 3c)
- `pages/links.js` — depth analysis messages (step 3d)
- `pages/competitors.js` — parseNumericValue, gap calc, em dash replacement (step 3e)
- `pages/backlink-opportunities.js` — do-follow, empty states, DR distribution (step 3f)
- `pages/local.js` — accessNotes integration, map pack nav fix (step 3g)
- `shared/data-loader.js` — pagination boot call (step 2)
- All 9 `*.html` pages — pagination script tag (step 2)

### New:
- `shared/table-pagination.js` — pagination component (step 2)

### Data:
- `clients/liane-jamason/seo/audit-data.json` — AI reference removal (step 4)

## Estimated Scope

- **Normalizer:** ~150 lines of new code across 6 sub-steps
- **Pagination:** ~200 lines new component + ~20 lines integration
- **Renderer fixes:** ~300 lines across 8 files (mostly replacing empty-state messages and fixing parsers)
- **Total:** ~670 lines of code changes across ~20 files
- **Complexity:** Medium-High (many files, but each fix is isolated and testable)
