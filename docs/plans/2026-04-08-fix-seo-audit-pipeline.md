# Fix SEO Audit Data Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SEO audit pipeline reliably populate every section of the multipage HTML report for any new client, with or without Google connectors (GA4, GSC, GBP).

**Architecture:** The pipeline has 4 stages: (1) data-gathering scripts produce JSON research files, (2) the /seo-audit skill orchestrates agents that run those scripts, (3) a data-populator step fills audit-data.json from research files, (4) generate-multipage-report.js normalizes and injects data into HTML. The fix addresses gaps at every stage.

**Tech Stack:** Node.js (scripts), Playwright (crawling), DataForSEO API, Google PSI API (public), Leaflet (maps), Chart.js, Tailwind CSS.

**Root Cause:** 10 top-level sections and 4 research JSON files that the generator's normalizer expects are never produced by the /seo-audit skill. The skill was written before many report pages existed, so its agent prompts and Step 8a field list are incomplete.

**Research files informing this plan:**
- `clients/liane-jamason/troubleshooting/data-contract-map.md` (884 lines — full generator contract)
- `clients/liane-jamason/troubleshooting/calgary-vs-liane-diff.md` (Calgary vs Liane field diff)
- `clients/liane-jamason/troubleshooting/skill-vs-template-gap.md` (skill vs template gaps)

---

## Pass 1: Fix the Template & Pipeline

### Task 1: Create `scripts/gather-pagespeed.js`

**Files:**
- Create: `template/scripts/gather-pagespeed.js`

This script calls the public Google PSI API for the client domain + all competitor domains, producing the JSON the normalizer needs for Core Web Vitals gauges, Lighthouse scores, and PageSpeed comparison charts.

- [ ] **Step 1: Write the script**

```javascript
// Usage: node scripts/gather-pagespeed.js <client-url> [competitor-url ...] [--output path]
// Calls Google PageSpeed Insights API (public, no auth) for each URL
// Outputs: research/pagespeed-data.json
//
// Shape: {
//   clientPages: [{ url, mobile: { score, lcp, fcp, cls, tbt, si, inp, ttfb }, desktop: { ... } }],
//   competitorPages: [{ url, domain, mobile: {...}, desktop: {...} }],
//   pageSpeedComparison: [{ domain, mobileScore, desktopScore, isClient }],
//   coreWebVitals: { mobile: { performanceScore, lcp, cls, fcp, inp, ttfb, speedIndex }, desktop: {...} },
//   gatheredAt: ISO timestamp
// }
```

The script must:
- Accept client URL as first arg, competitor URLs as remaining args
- Call `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy={mobile|desktop}&category=performance`
- Parse the JSON response for: `lighthouseResult.categories.performance.score`, `lighthouseResult.audits['largest-contentful-paint'].numericValue`, etc.
- Run mobile AND desktop for each URL (2 calls per URL)
- Write output to `seo/research/pagespeed-data.json`
- Include error handling for rate limits (PSI allows ~25 req/100s free)

- [ ] **Step 2: Test with Liane's domain**

Run: `node scripts/gather-pagespeed.js https://www.lianejamason.com https://avalongrouptampabay.com https://eaganluxury.com https://smithandassociates.com https://stpete.pro`
Expected: `seo/research/pagespeed-data.json` created with real scores for all 5 domains.

- [ ] **Step 3: Commit**

```bash
git add template/scripts/gather-pagespeed.js
git commit -m "feat: add gather-pagespeed.js — PSI API for CWV + Lighthouse scores"
```

---

### Task 2: Create `scripts/gather-domain-metrics.js`

**Files:**
- Create: `template/scripts/gather-domain-metrics.js`

This script calls DataForSEO backlinks/summary endpoint for client + competitors, producing domain-metrics.json for the DR comparison chart and backlinks overview.

- [ ] **Step 1: Write the script**

```javascript
// Usage: node scripts/gather-domain-metrics.js <client-domain> [competitor-domain ...] [--output path]
// Calls DataForSEO backlinks/summary/live for each domain
// Outputs: research/domain-metrics.json
//
// Shape: {
//   domains: [{ domain, domainRating, referringDomains, totalBacklinks, organicTraffic, isClient }],
//   gatheredAt: ISO timestamp
// }
```

The script must:
- Read DFS API credentials from env vars `DFS_LOGIN` and `DFS_PASSWORD`
- Call `https://api.dataforseo.com/v3/backlinks/summary/live` with `[{"target": domain}]`
- Extract: `rank`, `backlinks`, `referring_domains`, `broken_backlinks`
- Map DFS `rank` to approximate Domain Rating (DFS uses its own rank metric)
- Write to `seo/research/domain-metrics.json`

- [ ] **Step 2: Test with Liane's domains**

Run: `node scripts/gather-domain-metrics.js lianejamason.com avalongrouptampabay.com eaganluxury.com smithandassociates.com stpete.pro`
Expected: `seo/research/domain-metrics.json` with real metrics.

- [ ] **Step 3: Commit**

```bash
git add template/scripts/gather-domain-metrics.js
git commit -m "feat: add gather-domain-metrics.js — DFS backlink summary for DR comparison"
```

---

### Task 3: Create `scripts/gather-backlinks.js`

**Files:**
- Create: `template/scripts/gather-backlinks.js`

This script calls DataForSEO backlinks/backlinks endpoint for the client domain, producing client-backlinks.json for the backlink inventory table.

- [ ] **Step 1: Write the script**

```javascript
// Usage: node scripts/gather-backlinks.js <client-domain> [--limit 500] [--output path]
// Calls DataForSEO backlinks/backlinks/live for the client domain
// Outputs: research/client-backlinks.json
//
// Shape: {
//   domain: string,
//   totalBacklinks: number,
//   referringDomains: number,
//   backlinks: [{ sourceUrl, targetUrl, anchorText, domainRating, isDofollow, firstSeen, lastSeen }],
//   referring_domains: [{ domain, backlinks, firstSeen, brokenBacklinks }],
//   gatheredAt: ISO timestamp
// }
```

The script must:
- Call `https://api.dataforseo.com/v3/backlinks/backlinks/live` with `[{"target": domain, "limit": 500, "mode": "as_is"}]`
- Also call `https://api.dataforseo.com/v3/backlinks/referring_domains/live` with `[{"target": domain, "limit": 200}]`
- Write to `seo/research/client-backlinks.json`

- [ ] **Step 2: Test with Liane's domain**

Run: `node scripts/gather-backlinks.js lianejamason.com`
Expected: `seo/research/client-backlinks.json` with backlink records.

- [ ] **Step 3: Commit**

```bash
git add template/scripts/gather-backlinks.js
git commit -m "feat: add gather-backlinks.js — DFS backlink inventory for client"
```

---

### Task 4: Create `scripts/extract-text.js`

**Files:**
- Create: `template/scripts/extract-text.js`

This script uses Playwright to extract real page text from each URL in crawl-data.json, computing Flesch-Kincaid readability scores. Produces page-text-analysis.json.

- [ ] **Step 1: Write the script**

```javascript
// Usage: node scripts/extract-text.js [--input research/crawl-data.json] [--limit 50] [--output path]
// Opens each URL via Playwright, strips nav/footer/script, counts words/sentences/syllables
// Outputs: research/page-text-analysis.json
//
// Shape: {
//   pages: [{
//     url, title, wordCount, sentenceCount, syllableCount,
//     fleschReadingEase, fleschKincaidGrade, avgWordsPerSentence, avgSyllablesPerWord
//   }],
//   summary: { totalPages, avgFleschReadingEase, avgFleschKincaidGrade, avgWordCount },
//   gatheredAt: ISO timestamp
// }
```

The script must:
- Read URLs from `seo/research/crawl-data.json` (the `urls` array)
- Navigate to each URL, wait for networkidle
- Extract body text (strip script, style, noscript, nav, footer, header tags)
- Count words, sentences (split on `.!?`), syllables (vowel-group heuristic)
- Compute Flesch Reading Ease: `206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)`
- Compute Flesch-Kincaid Grade: `0.39*(words/sentences) + 11.8*(syllables/words) - 15.59`
- Rate-limit to avoid hammering the client's server (500ms between pages)
- Write to `seo/research/page-text-analysis.json`

- [ ] **Step 2: Test with Liane's crawl data**

Run: `node scripts/extract-text.js --limit 20`
Expected: `seo/research/page-text-analysis.json` with readability scores for 20 pages.

- [ ] **Step 3: Commit**

```bash
git add template/scripts/extract-text.js
git commit -m "feat: add extract-text.js — Flesch-Kincaid readability from real page text"
```

---

### Task 5: Update template `audit-data.json` with full schema scaffold

**Files:**
- Modify: `template/seo/audit-data.json`

The template must include empty scaffolds for ALL 10 missing top-level sections so the generator doesn't encounter undefined keys, and so the data-populator has a clear target.

- [ ] **Step 1: Add missing section scaffolds**

Add these top-level keys with their minimum required structure (empty arrays/objects with comments):

```json
{
  "contentQuality": {
    "summary": { "totalPagesAnalyzed": 0, "avgQualityScore": 0, "thinPageCount": 0, "thinThreshold": 300, "avgReadabilityScore": 0, "duplicateGroupCount": 0, "cannibalizationCount": 0 },
    "pages": []
  },
  "backlinks": {
    "domainMetrics": { "domainRating": 0, "referringDomains": 0, "totalBacklinks": 0, "source": "DataForSEO" },
    "topBacklinks": [],
    "competitorDomainMetrics": []
  },
  "internalLinking": {
    "domain": "", "total_pages": 0, "total_internal_links": 0, "orphan_count": 0, "orphans": []
  },
  "technicalSeo": {
    "metaTagSummary": {}, "metaTagIssues": [], "imageAudit": { "summary": {}, "worstPages": [] },
    "schemaSummary": {}, "canonicalAudit": {}, "redirectChains": {},
    "securityHeaders": { "summary": {}, "issues": [] },
    "coreWebVitals": { "mobile": {}, "desktop": {} },
    "lighthouseResults": { "clientPages": [] },
    "pageSpeedComparison": [], "pageSpeedOpportunities": []
  },
  "localSeo": {
    "businessProfile": { "name": "", "address": "", "phone": "", "latitude": 0, "longitude": 0 },
    "competitorLocations": [], "searchDemandZones": [],
    "reviewSentiment": { "summary": {} },
    "serviceAreaMap": { "type": "FeatureCollection", "features": [] },
    "accessNotes": { "gbpAccess": false, "gaAccess": false, "searchConsoleAccess": false, "note": "" }
  },
  "eeatSignals": {
    "summary": {}, "eeatScore": {}
  },
  "reportingIntelligence": {
    "siteHealthGrade": "", "categoryScores": {}, "prioritizedFindings": []
  },
  "competitorAnalysis": {
    "domainMetricsComparison": [], "pageSpeedComparison": []
  },
  "indexationCrawlability": {
    "crawlBudgetHealth": { "score": 0, "grade": "", "factors": {} },
    "soft404s": { "summary": {} }, "parameterAudit": { "summary": {} }
  },
  "rankHistory": {
    "keywords": {}
  }
}
```

- [ ] **Step 2: Verify the template parses**

Run: `node -e "const d = require('./template/seo/audit-data.json'); console.log(Object.keys(d).length, 'top-level keys')"`
Expected: ~29 top-level keys (19 existing + 10 new).

- [ ] **Step 3: Commit**

```bash
git add template/seo/audit-data.json
git commit -m "feat: add full schema scaffold to template audit-data.json (10 missing sections)"
```

---

### Task 6: Clean template of stale client data

**Files:**
- Modify: `template/reports/multipage/shared/debug-data.js` (already cleared, verify)
- Delete stale HTML from: `template/reports/multipage/*.html` that contain baked client data

- [ ] **Step 1: Verify debug-data.js is clean**

Read `template/reports/multipage/shared/debug-data.js` and confirm it contains only `window.AUDIT_DATA = null;`

- [ ] **Step 2: Check if template HTML files have baked data**

```bash
grep -l "AUDIT_DATA" template/reports/multipage/*.html | head -5
```

If any HTML files have `window.AUDIT_DATA = {` with real client data, either strip the data injection or delete the pre-built HTML files (keeping only the generator + page JS + shared assets).

- [ ] **Step 3: Commit**

```bash
git add template/reports/multipage/
git commit -m "fix: clean stale client data from template HTML and debug-data.js"
```

---

### Task 7: Pre-build Tailwind CSS to eliminate blank-page-on-first-load

**Files:**
- Create: `template/reports/multipage/shared/tailwind-prebuild.js` (one-time build script)
- Create: `template/reports/multipage/shared/tailwind.css` (output)
- Modify: `template/reports/multipage/generate-multipage-report.js` (swap CDN script tag for CSS link)

- [ ] **Step 1: Create the Tailwind pre-build script**

This script scans all HTML template files + page JS files for Tailwind class names and produces a minimal CSS file.

Approach: Use the Tailwind CLI standalone binary or the `tailwindcss` npm package.

```bash
# Install as devDependency in template
cd template && npm install --save-dev tailwindcss
```

Create `template/reports/multipage/tailwind.config.js`:
```javascript
module.exports = {
  content: [
    './reports/multipage/**/*.html',
    './reports/multipage/pages/**/*.js',
    './reports/multipage/shared/**/*.js'
  ],
  theme: { extend: {} },
  plugins: []
};
```

- [ ] **Step 2: Generate the pre-built CSS**

```bash
cd template && npx tailwindcss -o reports/multipage/shared/tailwind.css --minify
```

Expected: `shared/tailwind.css` file ~15-30KB containing only the classes actually used.

- [ ] **Step 3: Update the generator to emit CSS link instead of CDN script**

In `generate-multipage-report.js`, find where it writes the `<head>` section and replace:
```html
<script src="https://cdn.tailwindcss.com"></script>
```
with:
```html
<link rel="stylesheet" href="shared/tailwind.css">
```

- [ ] **Step 4: Regenerate Liane's report and test**

```bash
cd clients/liane-jamason/reports/multipage && node generate-multipage-report.js
```

Open the generated report in an incognito/private window. Confirm pages render instantly without blank flash.

- [ ] **Step 5: Commit**

```bash
git add template/reports/multipage/shared/tailwind.css template/reports/multipage/tailwind.config.js template/reports/multipage/generate-multipage-report.js template/package.json
git commit -m "perf: pre-build Tailwind CSS — eliminates blank-page-on-first-load"
```

---

### Task 8: Update `/seo-audit` skill with missing data-gathering steps

**Files:**
- Modify: `commands/seo-audit.md`

The skill needs 3 additions:

- [ ] **Step 1: Add a new Step 4.5 — "Run Data-Gathering Scripts"**

After the 6 research agents complete (Step 5) but before the report compiler (Step 6), add:

```markdown
## Step 5.5: Run Data-Gathering Scripts

After all 6 research agents are complete, run these scripts to produce the JSON files
the report generator needs. These do NOT require Google connectors.

### PageSpeed data (public PSI API, no auth):
\`\`\`bash
node scripts/gather-pagespeed.js {CLIENT_SITE} {COMPETITOR_URLS_SPACE_SEPARATED}
\`\`\`
Output: `seo/research/pagespeed-data.json`

### Domain metrics (DataForSEO, API key only):
\`\`\`bash
node scripts/gather-domain-metrics.js {CLIENT_DOMAIN} {COMPETITOR_DOMAINS_SPACE_SEPARATED}
\`\`\`
Output: `seo/research/domain-metrics.json`

### Backlink inventory (DataForSEO, API key only):
\`\`\`bash
node scripts/gather-backlinks.js {CLIENT_DOMAIN}
\`\`\`
Output: `seo/research/client-backlinks.json`

### Page text analysis (Playwright, no auth):
\`\`\`bash
node scripts/extract-text.js --limit 50
\`\`\`
Output: `seo/research/page-text-analysis.json`
```

- [ ] **Step 2: Expand Step 8a field list**

Add the 10 missing sections to the "Fields to populate in audit-data.json" list:

- `contentQuality` — populated from content-audit.md + page-text-analysis.json
- `backlinks` — populated from backlink-analysis.md + domain-metrics.json + client-backlinks.json
- `internalLinking` — auto-populated from link-graph.json by normalizer
- `technicalSeo` — populated from client-site-structure.md + pagespeed-data.json
- `localSeo` — populated from client info (geocoded address) + competitor locations
- `eeatSignals` — populated from content-audit.md + best-practices assessment
- `reportingIntelligence` — derived from all other sections (populate last)
- `competitorAnalysis` — populated from competitor-analysis.md + domain-metrics.json + pagespeed-data.json
- `indexationCrawlability` — populated from client-site-structure.md crawl findings
- `rankHistory` — populated from keyword-research.md (current snapshot) + DataForSEO rank tracker if available

- [ ] **Step 3: Add "run generate-multipage-report.js" to Step 8b**

After `npm run generate` (which produces XLSX + PPTX), add:

```markdown
### Generate multipage HTML report:
\`\`\`bash
cd reports/multipage && node generate-multipage-report.js
\`\`\`
Output: `seo/multipage-report-{CLIENT_SLUG}-{DATE}/` — 9 HTML pages + assets
```

- [ ] **Step 4: Commit**

```bash
git add commands/seo-audit.md
git commit -m "fix: update /seo-audit skill with missing data steps and full field list"
```

---

## Pass 2: Verify with Liane Jamason

### Task 9: Run missing scripts for Liane

**Files:**
- Working directory: `clients/liane-jamason/`

- [ ] **Step 1: Copy new scripts from template**

```bash
cp template/scripts/gather-pagespeed.js clients/liane-jamason/scripts/
cp template/scripts/gather-domain-metrics.js clients/liane-jamason/scripts/
cp template/scripts/gather-backlinks.js clients/liane-jamason/scripts/
cp template/scripts/extract-text.js clients/liane-jamason/scripts/
```

- [ ] **Step 2: Run all 4 scripts**

```bash
cd clients/liane-jamason
node scripts/gather-pagespeed.js https://www.lianejamason.com https://avalongrouptampabay.com https://eaganluxury.com https://smithandassociates.com https://stpete.pro
node scripts/gather-domain-metrics.js lianejamason.com avalongrouptampabay.com eaganluxury.com smithandassociates.com stpete.pro
node scripts/gather-backlinks.js lianejamason.com
node scripts/extract-text.js --limit 50
```

- [ ] **Step 3: Verify all 4 JSON files exist**

```bash
ls -lh seo/research/{pagespeed-data,domain-metrics,client-backlinks,page-text-analysis}.json
```

Expected: 4 files with non-zero sizes.

---

### Task 10: Re-populate audit-data.json with all 10 missing sections

**Files:**
- Modify: `clients/liane-jamason/seo/audit-data.json`

Using the research files + the 4 new JSON files, populate the 10 missing sections. This can be done by a data-populator agent reading the data-contract-map.md as its guide.

- [ ] **Step 1: Populate `technicalSeo` from client-site-structure.md + pagespeed-data.json**

Key sub-sections: metaTagSummary, metaTagIssues, imageAudit, schemaSummary, coreWebVitals, lighthouseResults, pageSpeedComparison.

- [ ] **Step 2: Populate `contentQuality` from content-audit.md + page-text-analysis.json**

Key fields: summary (avgQualityScore, avgReadabilityScore, thinPageCount), pages[] with per-page readability/quality/structure.

- [ ] **Step 3: Populate `backlinks` from backlink-analysis.md + domain-metrics.json + client-backlinks.json**

Key fields: domainMetrics, topBacklinks[], competitorDomainMetrics[].

- [ ] **Step 4: Populate `localSeo` with geocoded client address + competitor locations**

Client coordinates: ~27.7861, -82.6638 (1405 Dr. MLK Jr St N, St Petersburg FL 33704).
Competitor locations: approximate city-center coords for each competitor.
Service area: GeoJSON polygon covering St. Petersburg / Tampa Bay.
accessNotes: { gbpAccess: false, gaAccess: false, searchConsoleAccess: false }.

- [ ] **Step 5: Populate `competitorAnalysis` from competitor-analysis.md + domain-metrics.json + pagespeed-data.json**

Key fields: domainMetricsComparison[], pageSpeedComparison[].

- [ ] **Step 6: Populate `eeatSignals` from content-audit.md + best-practices findings**

- [ ] **Step 7: Populate `indexationCrawlability` from client-site-structure.md crawl data**

- [ ] **Step 8: Populate `reportingIntelligence` (derived from all other sections — do last)**

- [ ] **Step 9: Populate `rankHistory` from keyword-research.md (current snapshot)**

- [ ] **Step 10: Verify JSON is valid**

```bash
node -e "const d = require('./seo/audit-data.json'); console.log(Object.keys(d).length, 'keys'); console.log(d.technicalSeo ? 'technicalSeo OK' : 'MISSING'); console.log(d.contentQuality ? 'contentQuality OK' : 'MISSING'); console.log(d.backlinks ? 'backlinks OK' : 'MISSING'); console.log(d.localSeo ? 'localSeo OK' : 'MISSING')"
```

Expected: 29 keys, all sections present.

---

### Task 11: Regenerate report and visual verification

**Files:**
- Working directory: `clients/liane-jamason/`

- [ ] **Step 1: Regenerate Excel + PowerPoint**

```bash
node scripts/generate-spreadsheet.js
node scripts/generate-presentation.js
```

- [ ] **Step 2: Regenerate multipage HTML report**

```bash
cd reports/multipage && node generate-multipage-report.js
```

- [ ] **Step 3: Launch localhost and screenshot all 9 pages**

```bash
cd seo/multipage-report-liane-jamason-*/ && python3 -m http.server 8080
```

Use Playwright to screenshot each page and verify:
- Summary: 6 key stats tiles, top issues, site comparison table, quick wins
- Keywords: rankings table, search visibility chart, rank tracking history
- Content: readability analysis, thin content, duplicate content
- Technical: meta audit, image audit, CWV gauges, Lighthouse scores, PageSpeed comparison
- Links: internal linking stats, orphan pages, hub clusters
- Backlink Opportunities: competitor backlink comparison (if data available)
- Competitors: domain metrics comparison, PageSpeed comparison, competitor strategies
- Local: GBP card, Leaflet map with pins + heatmap, service area polygon
- Action Plan: all 4 phases with items

- [ ] **Step 4: Create save point**

```bash
git add clients/liane-jamason/
git commit -m "Save point: Liane Jamason full pipeline fix — all report sections populated"
```

---

## Execution Tooling Recommendations

| Phase | Tool | Why |
|-------|------|-----|
| Tasks 1-4 (scripts) | /subagent-driven-development | 4 independent scripts, can be written in parallel |
| Task 5 (schema) | Inline edit | Small, focused JSON change |
| Task 6 (cleanup) | Inline edit | Quick verification + delete |
| Task 7 (Tailwind) | /subagent-driven-development | Install + config + generator change |
| Task 8 (skill update) | Inline edit | Text changes to seo-audit.md |
| Tasks 9-10 (Liane data) | /dispatching-parallel-agents | Run 4 scripts in parallel, then populate |
| Task 11 (verify) | /verify or Codex vision agent | Visual confirmation of all 9 pages |

**Total estimated tasks:** 11 tasks, ~45 steps
**Passes needed:** 2 (fix pipeline, then verify with Liane)
