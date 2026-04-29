# Final Synthesis — Site Audit Deep-Dive

**Purpose:** Convert 67 per-file findings into actionable architecture. This document delivers the 5 synthesis artifacts promised in [`INDEX.md`](./INDEX.md) §Final synthesis:
1. End-to-end data flow diagram
2. Cross-script contract matrix
3. Consolidated bug queue ranked by blast radius × effort
4. Live-client remediation plan
5. Priority-ordered fix queue

**Source material:** 67 deep-dives (#1-#67) + [`MAJOR-FINDINGS.md`](./MAJOR-FINDINGS.md) + INDEX addendum.
**Date:** 2026-04-20
**Last finding covered:** #67 (`commands/seo-audit.md`).

---

## 1. End-to-End Data Flow

The audit pipeline has 6 stages. Each stage consumes specific inputs and produces specific outputs. This diagram traces every script and which field it writes into `audit-data.json`.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 0 — OPERATOR INPUT                                                   │
│   client-config.json  (name, domain, competitors, location, access creds)  │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1 — RESEARCH AGENTS (6 parallel, prompts in seo-audit.md:294-672)    │
│                                                                            │
│   keyword-researcher       →  keyword-research.md                          │
│   site-crawler ⚠ OVERWRITE →  crawl-data.json + link-graph.json (CURATED)  │
│                           +→  client-site-structure.md                     │
│   content-auditor          →  content-audit.md                             │
│   competitor-analyzer      →  competitor-analysis.md + backlinks-*.json?   │
│   best-practices-researcher→  best-practices-notes.md                      │
│   backlink-researcher      →  backlink-analysis.md + opportunities.json    │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2 — DATA GATHERING SCRIPTS (seo-audit.md Step 5.5)                   │
│                                                                            │
│   crawl-sitemap.js --analyze   →  crawl-data.json + link-graph.json        │
│                                    ⚠ OVERWRITTEN by stage 1 site-crawler   │
│   extract-text.js --limit 50   →  page-text-analysis.json (capped 50)      │
│   gather-pagespeed.js          →  pagespeed-data.json                      │
│   gather-domain-metrics.js     →  domain-metrics.json (null traffic)       │
│   gather-organic-metrics.js    →  organic-metrics.json (US+EN only)        │
│   gather-backlinks.js --limit  →  client-backlinks.json + backlinks-*.json │
│       200                          ⚠ CRASHES (missing Semaphore import)    │
│   gather-keyword-volumes.js    →  keyword-volumes.json                     │
│       --from-audit                +→ mutates audit-data.json keywords[]    │
│   gather-local-pack.js         →  local-pack-data.json (loc 2840 = US)     │
│       --location 2840              ⚠ 0 hits for Matt due to country code   │
│   gather-local-seo.js          →  local-seo.json (UA-blocked scraping)     │
│                                                                            │
│   NOT INVOKED BY SKILL:                                                    │
│   analyze-backlink-quality.js  →  enriches backlinks files (ORPHAN)        │
│   parse-google-ads.js          →  ppc-raw-data.json (ORPHAN, PPC)          │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3 — PYTHON AUDIT PIPELINE (build_audit.py — 10 analyzers)            │
│                                                                            │
│   Inputs:                                                                  │
│     crawl-data.json         ⚠ 11 pages (curated by stage 1)                │
│     link-graph.json         ⚠ wrong level passed to analyzer (line 216)    │
│     pagespeed-data.json                                                    │
│     page-text-analysis.json ⚠ 11 pages                                     │
│     domain-metrics.json, organic-metrics.json, local-seo.json              │
│     client-backlinks.json, backlinks-*.json                                │
│                                                                            │
│   Analyzers (each writes to audit-data.json):                              │
│     ContentQualityAnalyzer    →  contentQuality.*                          │
│     InternalLinkAnalyzer      →  internalLinking.* ⚠ 0 edges for Matt      │
│     TechnicalSeoAnalyzer      →  technicalSeo.*                            │
│     BacklinkAnalyzer          →  backlinks.* (dual path with JS)           │
│     CompetitorAnalyzer        →  competitorAnalysis.*                      │
│     LocalSEOAnalyzer          →  localSeo.*  ← source "audit-synthesis"    │
│     IndexCrawlabilityAnalyzer →  indexation.*                              │
│     EEATSignalsAnalyzer       →  eeat.*                                    │
│     ContentGapAnalyzer        →  contentGap.*                              │
│     ReportingIntelligenceAnlzr→  topIssues, actionPlan, keyStats,          │
│                                   pillars, advantages, nextSteps,           │
│                                   overallGrade, gradeSummary,              │
│                                   mediumTermRoadmap, longTermColumns       │
│                                                                            │
│   PPC (orphan): PPCAnalyzer   →  ppc.*                                     │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4 — MD→JSON BRIDGE (populate-audit-data.js)                          │
│                                                                            │
│   Reads:                                                                   │
│     keyword-research.md       → keywords[]                                 │
│     competitor-analysis.md    → competitorComparison[],                    │
│                                 competitorStrategies[],                    │
│                                 siteComparison[] (derived)                 │
│     FINAL-AUDIT-REPORT.md     → contentCalendar, advantages[]              │
│                                                                            │
│   ⚠ Rewrites audit-data.json in-place with no backup.                      │
│   ⚠ Brittle heading-literal matching. Missed sections silently drop.       │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 5 — REPORT GENERATION                                                │
│                                                                            │
│   generate-multipage-report.js (3160 lines)                                │
│     1. normalizeAuditData()                                                │
│        - Re-reads all research JSONs                                       │
│        - Applies 13 HANDOFF auto-fixes (hoist CWV, reshape lighthouse,     │
│          derive hubClusters, detect stale-PSI, auto-populate backlinks,    │
│          map competitor comp1..compN, etc.)                                │
│     2. validateAuditData()  ⚠ Warns but doesn't block output              │
│     3. Inject audit-data + searchIndex into 9 HTML templates               │
│     4. Inline CSS (if --inline) + always inline JS                         │
│     5. Write 9 HTML pages + copy shared/pages/assets dirs                  │
│                                                                            │
│   generate-spreadsheet.js   →  SEO-Audit-GamePlan.xlsx                     │
│   generate-presentation.js  →  SEO-Audit-Presentation.pptx                 │
│                                ⚠ Both cap competitor columns at 2         │
│   generate-ppc-*.js         →  PPC-Audit-*.xlsx/pptx (ORPHAN)              │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 6 — REPORT CONSUMPTION (what client sees)                            │
│                                                                            │
│   9 HTML pages, each rendered by pages/<name>.js:                          │
│     index.js (Executive Summary)    - reads 6 top-level fields             │
│     keywords.js                     - reads keywords[], domainMetrics      │
│     content.js                      - reads contentQuality.*               │
│     technical.js                    - reads technicalSeo.*, coreWebVitals  │
│     links.js                        - reads internalLinking.*, backlinks   │
│     competitors.js ✓ DYNAMIC cols    - reads competitorComparison[]        │
│     local.js                        - reads localSeo.*                     │
│     action-plan.js                  - reads actionPlan.*, contentCalendar  │
│     backlink-opportunities.js       - reads backlinkOpportunities          │
│                                                                            │
│   Shared infra:                                                            │
│     data-loader.js  - namespace + boot                                     │
│     utils.js        - esc/gradeClass/rankClass/apiErrorBanner              │
│     nav.js          - top nav + side nav + scrollspy                       │
│     search.js       - modal search over searchIndex                        │
│     explainer.js    - "What does this mean?" floating card                 │
│     charts.js       - Chart.js factory                                     │
│     table-filters.js, table-pagination.js, print.js                        │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key takeaway:** data corruption bugs at Stage 1 (agent overwrite) and Stage 2 (script defaults + template crashes) cascade through every downstream stage. A single crawl-data.json undercount affects ~10 downstream fields. Stage 5's normalizer has partial repair (13 auto-fixes) but can't conjure data that was never captured.

---

## 2. Cross-Script Contract Matrix

Who writes each `audit-data.json` field and who reads it. Entries are ordered by consumer page. "Writer" is the canonical producer; "Also writes" is any secondary path (which is where inconsistency risk lives). "Consumers" are the page renderers + deliverables.

| Field | Primary Writer | Also writes | Consumers | Known risk |
|---|---|---|---|---|
| `client.{name, website, company, ...}` | populate-audit-data.js / agent | build_audit.py | all pages | Matt has `client.name: null` (F#13 #8) |
| `keywords[]` | populate-audit-data.js | gather-keyword-volumes.js (volume/cpc) | keywords.js, index.js (search), XLSX, PPTX | F#15 brittle heading parse |
| `keyStats[]` | reporting_intelligence.py (F#60) | — | index.js, PPTX | Ghost field until F#60 confirmed |
| `topIssues[]` | reporting_intelligence.py | — | index.js, PPTX, XLSX | Affected by all upstream bugs |
| `coreWebVitals.{mobile, desktop}` | normalizer (hoist from pagespeed-data.json) | — | technical.js | F#7 bugs propagate |
| `pageSpeedComparison[]` | normalizer (HANDOFF #3 stale-detect) | — | technical.js, competitors.js | Two-path fallback chain |
| `technicalSeo.*` | TechnicalSeoAnalyzer (#53) | — | technical.js | Downstream of F#5 #1, #8, #21 |
| `contentQuality.*` | ContentQualityAnalyzer (#51) | — | content.js | Downstream of crawl cap |
| `internalLinking.*` | InternalLinkAnalyzer (#52) | normalizer fallback | links.js, technical.js | **CRITICAL: build_audit.py:216** |
| `topBacklinks[]` | normalizer (HANDOFF #8) | — | links.js | OK for Matt |
| `topReferringDomains[]` | normalizer (HANDOFF #9) | — | links.js | OK for Matt |
| `backlinks.qualitySummary` | analyze-backlink-quality.js (ORPHAN) | backlinks.py (line 122) | backlink-opportunities.js | Two classifiers disagree (F#54 #1) |
| `domainMetrics.{client, competitors}` | normalizer (HANDOFF #10) | gather-domain-metrics.js → JSON | keywords.js, competitors.js | F#8 DFS-rank scale |
| `domainMetrics.*.organicKeywords/Traffic` | normalizer merge from organic-metrics.json | gather-organic-metrics.js | keywords.js, competitors.js | **F#10 #2: top-100 labeled total** |
| `competitorComparison[]` | populate-audit-data.js | CompetitorAnalyzer | competitors.js, index.js, XLSX, PPTX | Two writers; last wins |
| `competitorStrategies[]` | populate-audit-data.js | — | competitors.js | F#15 heading regex |
| `siteComparison[]` | populate-audit-data.js (derived) | — | index.js, XLSX | Derived from competitorComparison |
| `localSeo.businessProfile` | LocalSEOAnalyzer (F#56) | gather-local-seo.js → JSON | local.js | "audit-synthesis" source label |
| `localSeo.mapPackKeywords[]` | normalizer from local-pack-data.json | — | local.js | F#12 0 hits for Matt |
| `contentCalendar.{monthN}` | populate-audit-data.js | — | action-plan.js, XLSX, PPTX | F#15 Section-8 heading match |
| `actionPlan.{quickWins, shortTerm, mediumTerm, longTerm}` | reporting_intelligence.py | populate-audit-data.js? | action-plan.js, XLSX, PPTX | — |
| `quickWins` (top-level, separate from actionPlan.quickWins) | agent? | — | index.js, PPTX | F#18, #22, #29 inconsistency |
| `pillars[]` | reporting_intelligence.py | — | action-plan.js, PPTX | Ghost field |
| `mediumTermRoadmap[]` | reporting_intelligence.py | — | action-plan.js, PPTX | Ghost field |
| `longTermColumns[]` | reporting_intelligence.py | — | action-plan.js, PPTX | Ghost field |
| `nextSteps[]` | reporting_intelligence.py | — | index.js, PPTX | Ghost field |
| `advantages[]` | populate-audit-data.js (parseAdvantages) | — | action-plan.js, index.js, PPTX | F#15 brittle regex |
| `overallGrade, gradeSummary` | reporting_intelligence.py | — | index.js, PPTX | — |
| `deliverables[]`, `keyPagesCreated[]`, `blogPostsCreated[]` | agent (Phase 5) | — | action-plan.js, XLSX, PPTX | — |
| `rankHistory.*` | rank_tracker.py (F#61, standalone invocation) | — | keywords.js | Only populated if rank tracker run separately |
| `searchConsole.*` | SearchConsoleConnector / analyzer | — | keywords.js | Requires OAuth — most clients lack |
| `traffic.*` | GA4 / agent | — | keywords.js | Requires OAuth — most clients lack |
| `apiErrors[]` | normalizer propagateApiErrors() | — | utils.renderApiErrorBanner (all pages) | Source-name matching brittle (F#34 #2) |
| `backlinkOpportunities.*` | backlinks.py::find_link_opportunities (F#54) | — | backlink-opportunities.js | — |
| `ppc.*` | ppc_analyzer.py (ORPHAN) | — | generate-ppc-*.js (ORPHAN) | Not wired |

**Dual-path producer risks** (most dangerous):
1. `competitorComparison[]` — Python `competitor.py` AND `populate-audit-data.js`. Last write wins, no merge strategy.
2. `backlinks.qualitySummary` — Python `backlinks.py` AND JS `analyze-backlink-quality.js`. Different classifiers.
3. `domainMetrics` — Python `backlinks.py::_fetch_domain_metrics` AND JS `gather-domain-metrics.js`. Same API, separate calls.
4. `pageSpeedComparison[]` — normalizer has a 3-layer fallback chain (HANDOFF #3).

---

## 3. Consolidated Bug Queue — Ranked by Blast Radius × Effort

Bugs ranked by **Blast radius** (how many clients / pages / features affected) × **Effort** (code lines to fix). Top 30 shown; H-severity only; lower-severity bugs deferred to per-finding detail.

Blast radius: 🌑 (1 client/field) → 🌓 (multiple) → 🌕 (systemic, all clients).
Effort: S = ≤5 lines, M = 5-50 lines, L = 50+ lines or architectural.

| Rank | Bug | Source | Blast | Effort | ROI |
|---:|---|---|---|---|---|
| 1 | **build_audit.py:216 passes raw link_graph dict instead of `edges` key** | INDEX addendum, F#52, #63 | 🌕 all clients — every internalLinking field zeroed | S (1 line) | **TOP** |
| 2 | **gather-backlinks.js template crashes at runtime (Semaphore undefined)** | F#9 | 🌕 every new template-copy fails to produce backlinks | S (1 line import) | **TOP** |
| 3 | **seo-audit.md:391-397 Agent 2 overwrites crawl-data.json + link-graph.json** | INDEX addendum, F#5, #67 | 🌕 Matt blog undercount + all future audits | M (delete prompt lines) | **TOP** |
| 4 | **gather-local-pack.js --location 2840 (US country)** | F#12 | 🌕 all clients see 0-pack false signal | M (skill + parameterization) | **TOP** |
| 5 | **populate-audit-data.js + gather-keyword-volumes.js rewrite audit-data.json in-place with no backup** | F#11, #15 | 🌕 every audit at risk of corruption | S (`.bak + .tmp + rename`) | **HIGH** |
| 6 | **Three-client cohort drift (chris-nevada, laura-willis, liane-jamason) across 6 gather scripts** | F#7, #8, #10, #11, #12, #13 | 🌓 3 clients × 6 scripts | M (bulk cp) | **HIGH** |
| 7 | **Normalizer client-local copies (matt-wallmow 2180, laura/liane 1797 vs template 3160)** | F#21 | 🌓 3 clients missing HANDOFF auto-fixes | S (delete + enforce template) | **HIGH** |
| 8 | **analyze-backlink-quality.js orphan — not invoked by skill** | F#14 | 🌕 all clients lack quality enrichment | S (add 1 line to skill) | **HIGH** |
| 9 | **generate-spreadsheet.js + generate-presentation.js competitor-column cap at 2** | F#17, #18 | 🌕 every client with ≥3 competitors | S (iterate d.competitor.all) | **HIGH** |
| 10 | **gather-local-seo.js SiteAuditBot UA blocks directory scraping** | F#13 #1 | 🌕 all clients — Yelp/BBB/GMaps blocked | S (1 line UA change) | **HIGH** |
| 11 | **gather-local-seo.js first-name-only directory match** | F#13 #2 | 🌕 high FP rate across every citation check | M (replace fuzzyMatch) | **HIGH** |
| 12 | **gather-organic-metrics.js hardcoded US + English** | F#10 #1 | 🌕 any non-US or non-English client | M (client-config param + code map) | **HIGH** |
| 13 | **gather-organic-metrics.js organicTraffic is top-100-sum labeled as total** | F#10 #2 | 🌕 every competitor analysis misrepresents traffic | M (add summary API call + rename field) | **HIGH** |
| 14 | **extract-text.js --limit 50 silent cap (skill passes 50)** | F#6 #1 | 🌓 any 51+ page site | S (default Infinity + warn) | **HIGH** |
| 15 | **4 clients missing multiple scripts (calgary, mammoth, murray, p3realtync)** | F#7, #9, #10, #11, #12 | 🌓 4 clients × ~6 missing scripts | M (bulk template-copy) | **HIGH** |
| 16 | **populate-audit-data.js brittle hardcoded heading literals** | F#15 #1 | 🌕 every audit risks silent section-skips | M (multi-regex fallback + enforce in skill) | **HIGH** |
| 17 | **base.py retry only covers network errors not 5xx** | F#40 #1 | 🌕 all DFS/PSI analyzer calls vulnerable | M (add status-code retry) | **HIGH** |
| 18 | **base.py _request_sync has no retry decorator** | F#40 #2 | 🌕 every sync connector call | S (add decorator) | **HIGH** |
| 19 | **build_audit.py:217 sitemap_urls capped at analyzed pages** | F#52, #63 #2 | 🌕 orphan detection vs incomplete URL set | M (pass full sitemap) | **HIGH** |
| 20 | **build_audit.py:218 hardcoded https://www. prefix** | F#63 #3 | 🌓 any non-www canonical site (likely ≥1 client) | S (derive from crawl-data.domain) | **MED** |
| 21 | **gather-local-seo.js Zillow URL malformed (keeps %2C + ZIP)** | F#13 #5 | 🌕 every real-estate client's Zillow check | S (URL build fix) | **MED** |
| 22 | **PPC workflow orphaned (parse-google-ads, generate-ppc-*, ppc_analyzer) — no skill** | F#16, #19, #20, #62 | 🌓 every PPC audit | L (new skill + transformer) | **MED** |
| 23 | **ppc-raw-data.json vs ppc-data.json filename gap** | F#16 #2 | 🌓 PPC workflow blocker | M (transformer or rename) | **MED** |
| 24 | **generate-multipage-report.js validateAuditData doesn't exit 1** | F#21 #2 | 🌕 silent empty pages in every audit | S (exit with criticals) | **MED** |
| 25 | **backlinks.py vs analyze-backlink-quality.js: two spam classifiers** | F#54 #1 | 🌕 same client can get different verdicts | L (pick one, deprecate other) | **MED** |
| 26 | **`competitorComparison` dual producer (Python + populate-audit-data)** | F#55 | 🌕 every client — merge strategy unclear | L (pick one path) | **MED** |
| 27 | **DFS `rank` (0-1000) conflated with Ahrefs `DR` (0-100)** | F#8 #3, #41 #5, #54 #3 | 🌕 every Competitors page, every report | M (normalize at connector) | **MED** |
| 28 | **crawl-sitemap.js word count includes nav/footer (inflates THIN_CONTENT)** | F#5 #4 | 🌕 every content audit false-flags thin | M (strip boilerplate) | **MED** |
| 29 | **crawl-sitemap.js response-header listener overwrites main-doc headers** | F#5 #1 | 🌕 every technical audit — false MISSING_HSTS | M (filter listener to main URL) | **MED** |
| 30 | **Skill-inline crawl-sitemap.js is 59-line stub** | F#5 #5 | 🌓 any client whose script fell back to stub (e.g., murray-gardner) | S (replace with "see template" note) | **MED** |

---

## 4. Live-Client Remediation Plan

For each of the 8 active clients, what needs to happen. Ordered by client audit complexity.

### **matt-wallmow** (reference client throughout this audit)

**Status:** 40 content pages on sitemap, but audit data reflects only 11.

**Actions:**
1. Fix `build_audit.py:216` first (fix #1 in §3).
2. Remove Agent 2 overwrite (fix #3).
3. Re-run `scripts/crawl-sitemap.js --analyze` to regenerate real crawl-data.json + link-graph.json.
4. Re-run `gather-backlinks.js` after Semaphore fix.
5. Re-run `gather-local-pack.js` with correct Rhinelander location code (not 2840). Find DFS code for "Rhinelander, WI" (likely 9030069 or similar).
6. Re-run `analyze-backlink-quality.js` (newly wired per fix #8).
7. Re-run `build_audit.py` → regenerate audit-data.json.
8. Regenerate report.

**Expected outcomes after fixes:**
- Links page shows real internal link structure (not zeros).
- Keywords page shows representative organic traffic for competitors (not top-100 cap).
- Local page shows at least some local pack presence.
- Content page's thin-content list is ≤ 1/3 of current after boilerplate fix.
- Backlink opportunities page shows spam classification.

**Open mystery:** his "audit-synthesis" source label in local-seo.json needs provenance trace (likely `analyzers/local_seo.py` per F#56).

### **liane-jamason**

**Status:** Ran `analyze-backlink-quality.js` at some point (she has the `qualitySummary` + `.bak` files). Normalizer is 1797 lines — 43% behind template.

**Actions:**
1. Replace client-local `generate-multipage-report.js` with template OR delete it entirely and rely on template.
2. Re-template all 6 old-cohort gather scripts.
3. Re-run full audit after upstream fixes land.

### **laura-willis**

**Status:** Normalizer + 3 page renderers (content, backlink-opportunities) are stale. `client-backlinks.json` is **673 bytes** — suspiciously small, likely failure stub.

**Actions:**
1. Investigate 673-byte `client-backlinks.json` — open it, check for errors. Re-run if stub.
2. Re-template old cohort gather scripts.
3. Re-template stale page renderers (content.js, backlink-opportunities.js).
4. Re-template stale generate-multipage-report.js.
5. Re-run full audit.

### **chris-nevada**

**Status:** Same drift cohort as laura-willis for gather scripts. Page renderers not diff-verified.

**Actions:**
1. Re-template old cohort gather scripts.
2. Verify page renderer drift (diff vs template).
3. Re-run full audit after fixes.

### **calgary-castles**

**Status:** Original reference client (per HANDOFF save points). MISSING: `gather-pagespeed.js`, `gather-backlinks.js`, `gather-organic-metrics.js`, `gather-keyword-volumes.js`, `gather-local-pack.js`. Has the data JSONs for these from some prior process. Also has a 275-line `extract-text.js` fork with Calgary-specific community slugs hardcoded.

**Actions:**
1. Audit what her existing data JSONs look like (schema drift risk — they may predate current shapes).
2. Template-copy all 5 missing scripts.
3. Decide what to do with her extract-text.js fork — upstream the non-Calgary improvements (richer syllable algo, main/article extraction), delete the Calgary-specific slugs.
4. Re-run full audit.

### **mammoth-lakes**

**Status:** 4-client missing-script cohort. `crawl-sitemap.js` is a 411-line pre-P7 template (F#5 bug #6). NO gather-pagespeed/backlinks/keyword-volumes/organic/local-pack/local-seo.

**Actions:**
1. Template-copy crawl-sitemap.js (and all 5-6 missing scripts).
2. Re-run initial research (gather-*) + build_audit.
3. Generate report.

### **murray-gardner**

**Status:** Worst-off. `crawl-sitemap.js` is the 153-line **skill-inline stub** (F#5 #5) — never produces crawl-data.json. Her audit-data.json has 7+ empty sections (per F#5 §6).

**Actions:**
1. Template-copy crawl-sitemap.js + all other missing scripts.
2. Full research + audit re-run.
3. Regenerate report.

**Expected:** previously-empty contentQuality, backlinks, internalLinking, technicalSeo, localSeo, indexation, eeat, rankHistory sections will populate.

### **p3realtync**

**Status:** 4-client missing-script cohort. No `client-backlinks.json`, no keyword-volumes, etc.

**Actions:**
1. Same as mammoth-lakes — template-copy, re-research, re-audit.

---

## 5. Priority-Ordered Fix Queue

The 15 fixes, in order. For each: title, source, rationale, ordering logic, effort, risk.

### Tier 1 — Must ship first (ordering: these unblock everything else)

**Fix 1: `build_audit.py:216` — pass `link_graph.get("edges", {})` instead of raw dict**
- Source: INDEX addendum; F#52, #63 bug #1.
- Rationale: Single-line fix. Restores non-zero internalLinking data for every client. Required before any orphan/depth/hub analysis is meaningful.
- Effort: S. Risk: low (analyzer was written to expect `edges` shape).

**Fix 2: `gather-backlinks.js` — add `Semaphore` to import**
- Source: F#9 bug #1.
- Rationale: Template CRASHES without this. Until fixed, every new template-copy client cannot gather backlinks. Blocks Matt, Liane, and any future audit.
- Effort: S. Risk: low.

**Fix 3: `commands/seo-audit.md` Agent 2 — delete lines 391-397 (overwrite instruction)**
- Source: INDEX addendum; F#5 addendum; F#67 #1.
- Rationale: Root cause of Matt's 11-page cap. All downstream analyzers inherit this cap.
- Effort: M (delete prompt lines, verify agent prompt still coherent).
- Risk: medium — need to test agent still produces client-site-structure.md.

### Tier 2 — Fixes that unlock categorical data reliability

**Fix 4: `gather-local-pack.js` + skill — parameterize `--location` from client-config**
- Source: F#12 bug #1; F#67 #8.
- Rationale: Current `--location 2840` (US) produces 0-hit results for every client regardless of their actual market. Requires (a) DFS location-code lookup table, (b) client-config addition of `locationCode` field.
- Effort: M. Risk: low.

**Fix 5: Atomic + backed-up `audit-data.json` rewrite for `populate-audit-data.js` + `gather-keyword-volumes.js`**
- Source: F#11 bug #1; F#15 bug #2.
- Rationale: Single riskiest write operation in the pipeline. A crash mid-write corrupts the core data file. Add `.bak` copy + `.tmp → rename` pattern.
- Effort: S (3 lines per script). Risk: none.

**Fix 6: `base.py` retry — cover HTTP 5xx + add `@retry` to `_request_sync`**
- Source: F#40 bugs #1, #2.
- Rationale: Every Python connector (analyzer call) currently fails on first 5xx. 10 connectors × hundreds of calls during audit = high failure surface.
- Effort: M. Risk: low.

### Tier 3 — Wiring fixes that restore promised features

**Fix 7: Wire `analyze-backlink-quality.js` into skill Step 5**
- Source: F#14 bug #1; F#67 #10.
- Rationale: Adds quality classification for every client's backlinks. Currently only liane-jamason has it (via manual one-off run). One-line skill addition.
- Effort: S. Risk: low (script is read-only to gather-backlinks files; `.bak` backup already exists in script).

**Fix 8: Extract `generate-spreadsheet.js` + `generate-presentation.js` competitor-column logic to match `pages/competitors.js`**
- Source: F#17 bug #1; F#18 bug #1; F#27 (reference impl).
- Rationale: `pages/competitors.js:155-190` correctly iterates `compN` keys dynamically. Port that pattern to the XLSX + PPTX generators.
- Effort: M. Risk: low.

**Fix 9: `gather-local-seo.js` — real Chrome UA + full-name fuzzy match + Zillow URL fix**
- Source: F#13 bugs #1, #2, #5.
- Rationale: Three bugs combined make the Citations section of Local page effectively noise. Chrome UA alone may triple Matt's citation hit rate.
- Effort: M. Risk: low.

**Fix 10: `gather-organic-metrics.js` — parameterize location + language + add second DFS call for true organic traffic**
- Source: F#10 bugs #1, #2.
- Rationale: Currently hardcoded US+English misrepresents non-US clients. `organicTraffic` field is top-100 cap labeled as total — misleads clients about competitor scale.
- Effort: M. Risk: low.

### Tier 4 — Bulk re-template operations

**Fix 11: Re-template the 3-client old cohort across 6 gather scripts**
- Source: F#7, #8, #9, #10, #11, #12, #13 (§Drift sections).
- Rationale: chris-nevada, laura-willis, liane-jamason all behind on all 6 gather scripts. Single coordinated operation. Must land AFTER fixes 1-2-3 (else they'd re-inherit bugs).
- Effort: M (mechanical `cp` across ~18 files). Risk: low — preserved via git.

**Fix 12: Restore missing scripts for 4 clients (calgary, mammoth, murray, p3realtync)**
- Source: F#7, #8, #9, #10, #11, #12 (§Missing sections).
- Rationale: These clients currently fail to audit at all because source scripts don't exist in their folders.
- Effort: M. Risk: low.

**Fix 13: Delete client-local `generate-multipage-report.js` copies (matt, laura, liane)**
- Source: F#21 §6.
- Rationale: All 3 clients run stale normalizers (30-43% behind template). Risk of anyone invoking the local copy. Enforce template-only execution per HANDOFF.md:72-76.
- Effort: S. Risk: low — nothing currently invokes the local copies per skill.

### Tier 5 — Architectural cleanup (do after stability)

**Fix 14: PPC workflow — create `commands/ppc-audit.md` + write raw→data transformer**
- Source: F#16, #19, #20, #62.
- Rationale: Entire PPC cluster is orphaned. No formal workflow. Before fixing ppc_analyzer bugs, establish the skill.
- Effort: L. Risk: medium — new workflow, needs end-to-end testing.

**Fix 15: Dual-path decisions — pick Python OR JS for backlinks, local, PPC, DFS**
- Source: F#41, #54, #8, #9, #16.
- Rationale: Redundant API billing + inconsistent output shapes + divergent classifiers. A strategic architectural decision: own the data stream in one language per source.
- Effort: L. Risk: high — requires decision across multiple features.

### Supplementary recommendations (not ordered; bundle with their domain's Tier)

- **Fix**: `generate-multipage-report.js::validateAuditData` — exit 1 on critical issues (F#21 #2). Bundle with fix 1.
- **Fix**: DR scale normalization at connector layer (F#8 #3, #54 #3). Bundle with fix 10 or fix 15.
- **Fix**: `base.py` rate-limit shared across connector instances (F#40 #3). Bundle with fix 6.
- **Fix**: `populate-audit-data.js` multi-regex heading fallback + skill-level heading enforcement (F#15 #1). Bundle with fix 5.
- **Fix**: `extract-text.js` default `--limit Infinity` + warn on cap (F#6 #1). Bundle with fix 3 (skill update).

---

## Closing notes

**Total H-severity bugs catalogued:** ~60 across the 67 findings.
**Fixes that unlock real client value from just Tier 1 (fixes 1-3):** Matt's entire audit becomes reliable, every future audit stops dropping to 11 pages, every new template-copy stops crashing.
**After Tier 1+2 (fixes 1-6):** Every active client's report reflects real data, not 11-page-capped garbage. Client-facing report quality jumps significantly.
**After Tier 3 (fixes 7-10):** Features that were silently broken (Local page citations, keywords page traffic, competitor columns in deliverables) start telling the truth.
**Tiers 4-5 are maintenance + architecture — important but not blocking.**

**Reference client matt-wallmow** should be the end-to-end validator. After each tier of fixes, re-run his audit, open each of 9 report pages, confirm the affected section shows real data.

**What's NOT in this synthesis:**
- The per-section deep-dives of `generate-multipage-report.js` (13 HANDOFF auto-fixes × ~50 lines each) — tracked as "#21b-#21n" in finding #21.
- The script-level fix DIFFS — each fix needs its own code change; this doc is the queue, not the PRs.
- The test strategy for each fix — next session's concern.

Ready for implementation.

---

## Additional Information

### Tier 3 — SHIPPED (2026-04-23)

5 planned fixes shipped, plus 2 prep commits surfaced during verification:

| # | Subject | Commit |
|---|---|---|
| 7  | Wire `analyze-backlink-quality.js` into Step 5.5 | `543cfc2` |
| 8a | Pre-existing PPTX null-safe kwTable cells (prep) | `d98fc43` |
| 8  | XLSX + PPTX dynamic competitor-column iteration | `257ee52` |
| 9a | Pre-existing local-seo response unwrap (prep) | `ef94747` |
| 9  | Local-SEO Chrome UA + full-name match + RE detection | `8c9b716` |
| 10 | Parameterize organic-metrics + add `organicTrafficTotal` | `3a1aea3` |
| 11 | `build_audit.py` atomic write (promoted from §5d) | `6e4af6c` |

**Branch:** `site-audit-fixes`. All 7 commits queued for push.

#### Recon discoveries surfaced during Tier 3

- **`analyze-backlink-quality.js` was never committed** (now `920807a`).
  The script existed in `/root/site-audit/template/scripts/` but had no git
  history in either repo. Re-imported from parent before wiring; otherwise
  Fix 7 would have wired a missing file.
- **Renderer reads from research/, not audit-data/.** The multipage
  renderer's `qualitySummary` consumer (`generate-multipage-report.js:2230-2260`)
  reads from `seo/research/client-backlinks.json` — exactly the JS classifier's
  output path. Python `qualitySummary` writer is dead in render. F#54's
  "dual-classifier conflict" downgraded from blocking to architectural.
- **`audit-synthesis` literal does not exist anywhere.** F#13 §8 + F#56
  bug #1 both predicted this string was emitted by some code path. Repo-wide
  grep returns zero matches. Both items resolved-as-spurious.
- **`get_competitors_domain` is dead code.** No callers anywhere. Fix 10's
  organic-metrics work is JS-only by design.
- **Pre-existing PPTX null-safety bug** (kwTable with null volumes / empty
  rank strings → crash). Discovered while verifying Fix 8. Shipped as
  separate commit `d98fc43` so Fix 8 stays narrowly scoped.
- **Pre-existing local-seo response-unwrap bug** (`requestText` returns just
  `res.body` not `{statusCode, body}` — every directory check returned
  `note=HTTP undefined` regardless of actual outcome). Discovered while
  verifying Fix 9. Shipped as separate commit `ef94747`.
- **Zillow URL gate failed.** Live `curl -I` against both URL form variants
  for `rhinelander` returns CloudFront 403 even with full Chrome UA +
  browser-like headers. Per plan rule, did NOT commit speculative URL
  templating. Zillow restoration deferred — needs a different transport
  (headless browser or proxy), not config tweaks.
- **Fix 10 summary-endpoint gate is operator-side.** No DataForSEO
  credentials in this environment per the project's 1Password-only secrets
  policy. `domain_rank_overview/live` parser is wrapped in try/catch — if
  the endpoint returns no `organic.etv`, `organicTrafficTotal` is omitted
  from the entry rather than null. Existing top-100-sum behavior preserved
  unchanged on gate failure. Operator must verify on next `/seo-audit` run
  that the field populates and is numerically > `organicTraffic`.

#### What Tier 3 did NOT touch (intentional, deferred)

- **Yelp + Realtor.com transport-layer blocks** (HTTP 403 with JS challenge,
  HTTP 429 throttling). Both need a different fetcher than HTTPS-with-headers.
  Tracked as a follow-up.
- **Spam-classifier calibration** (3.5% legit rate on Liane's data — likely
  over-aggressive). Decision C in the plan: ship the wiring, defer the
  calibration. Stays at Fix 15 in §5e.
- **Python `qualitySummary` writer reconciliation.** Confirmed dead in
  render path. Retire decision deferred to Fix 15.
- **Fix 11 SIGKILL stress test.** Unit test simulates the crash path via
  `monkeypatch`; real-world signal handling under the new code path was
  not validated. Owed follow-up.

#### Verification surface

What was independently verified locally on matt-wallmow (no DFS / GBP
credentials needed):

1. Backlink quality classification: 706 referring domains classified
   across 6 files (1 legit / 35 spam for client; 219 legit / 194 spam
   totals).
2. XLSX + PPTX competitor tables: all 6 comp columns populated end-to-end
   (header has `Comp 6` fallback for the metadata-less slot,
   `skagenteam.firstweber.com` populated under that column).
3. Local-page citations: BBB + Google Maps return HTTP 200 (were 403);
   matt found in both via full-name substring match. Yelp/Facebook/Realtor/
   Zillow surface real HTTP statuses (403/400/429/403) as `note` fields.
   Realtor.com + Zillow now checked (RE detection triggered by `clientCompany`).
4. `audit-data.json.bak`: appears next to `audit-data.json` after
   `write_json_atomic` round-trip; content-equal to the original target.
5. Atomic-write tests: 4/4 passed in 0.17s.

The full `/seo-audit` end-to-end run on matt with all 5 Tier 3 fixes
landed (per §5d step "Open all 9 HTML report pages") was NOT executed in
this session — it requires DFS + GBP credentials that live in 1Password.
The unit-level verifications above cover everything that's runnable
without secrets.

### Tier 3 advisor catches — disposition (2026-04-23)

After Tier 3 shipped, advisor flagged 6 follow-up catches. Disposition:

| # | Catch | Disposition |
|---|---|---|
| 1 | `organicTrafficTotal` silent-failure FYI (try/catch omits the field) | Operator verification checklist appended to F#10 `## Additional Information`. Code is correct by design — no change. |
| 2 | Audit runtime grows (Fix 10 doubles DFS calls; Fix 9 surfaces Realtor.com 429 retry-storm ~70s) | **Band-aid shipped:** `gather-local-seo.js` directory fetches now cap at 1 retry. Reclaims ~60s per audit on matt. Proper fix is transport-layer — tracked with the Zillow deferral. |
| 3 | UI card reordering: "Total organic traffic" placed before "Est. top-100 traffic" in `keywords.js` + `competitors.js` | Intentional. Total (domain-level, uncapped) is the primary metric; top-100 sum is the back-compat secondary. No change. |
| 4 | Zillow URL change deferred (CloudFront 403 either form) | Already documented in this file (Tier 3 SHIPPED block above) + F#13 `## Additional Information`. No additional action. |
| 5 | `utils/__init__.py` doesn't export `write_json_atomic` | **Shipped** — one-line export added alongside `setup_logging` / `retry`. |
| 6 | 11 pre-existing pytest failures (`test_internal_linking.py` graph density / `test_local_seo.py` sentiment) | Confirmed pre-existing at `304ae6a`. Not a Tier 3 regression; owned by whoever owns the internal-linking / local-seo analyzers. No action this tier. |

Catches #1, #5, and a band-aid for #2 each shipped as their own commit on
`site-audit-fixes`. Catches #3, #4, and #6 are status-quo / already-tracked
elsewhere.

### Tier 4 — SHIPPED (2026-04-29)

3 planned bulk-op fixes shipped across 7 client cohorts (8 commits), plus 1 prep commit surfaced during execution:

| # | Subject | Commit |
|---|---|---|
| 14         | Remove stale client-local `generate-multipage-report.js` (matt + laura + liane, batched per cohort exemption) | `6bb4dc3` |
| 13-prep    | Pre-existing orphan gitlink for `clients/chris-nevada` (`git rm --cached`) | `34f0801` |
| 13.chris   | Restore template scripts to empty client (21 NEW) | `6358bbe` |
| 13.calgary | Restore + re-sync (11 NEW + 3 UPD) — `extract-text.js` fork preserved via sha256 round-trip | `b592fd1` |
| 13.mammoth | Restore + re-sync (12 NEW + 3 UPD) | `c455656` |
| 13.murray  | Restore + re-sync (12 NEW + 3 UPD) | `9ed246e` |
| 13.p3      | Restore + re-sync (12 NEW + 3 UPD) | `0041cad` |
| 12.laura   | Re-sync drifted scripts (3 NEW + 11 UPD; ~1256 diff lines) | `c1da62f` |
| 12.liane   | Re-sync drifted scripts (3 NEW + 11 UPD; ~1069 diff lines) | `690ed71` |

**Branch:** `site-audit-fixes-tier-4`. 9 new commits queued for push (+ 2 pre-existing docs/infra commits — `e65bea4` TANDEM doc + `a98562f` bd init — already on branch).

#### Recon discoveries surfaced during Tier 4

- **Phantom gitlink in `clients/chris-nevada`.** Registered as 160000 gitlink pointing at commit `8832cc2c18149536872e8dbdade48026277b34fc` which does NOT exist in the local git db (`git cat-file -t 8832cc2c` → "Not a valid object name"). No `.gitmodules` ever existed in the repo. Introduced by abandoned v4-branch experiment `a139db9` ("feat: v4 — multi-LLM collab audit"). Cleaned up via prep commit `34f0801` (`git rm --cached`); files on disk untouched. Filed as bd `site-audit-fix-work-0au` for v4-branch follow-up investigation.
- **Pre-flight `git status` does not catch phantom gitlinks.** `git status` compares the gitlink hash, not the working tree; an `ls clients/chris-nevada` showed an empty dir, masking the `160000` index entry. Future pre-flight should `git ls-tree HEAD clients/` looking for unexpected `160000` mode entries.
- **Calgary fork sha256 round-trip is the strong fingerprint.** The plan upgraded the prior `wc -l + grep` heuristic to capture-then-compare sha256 (`b2e89f0f5e097af1758f3d41b199520a81b56c3aa05696cbeb78502484cdc291`). Caught nothing this run (fork preserved cleanly), but is the right pattern for any future cp+checkout sequence touching forked client files.
- **`codex_worker.sh` produced no manifest artifacts in this environment.** Each CX-Executor dispatch fell back to direct bash. Smart-team Step 7 evidence check #2 not satisfied at manifest level, but per-task git verification is independent. Worth investigating worker setup separately before relying on smart-team routing for evidence trails.

#### What Tier 4 did NOT touch (intentional, deferred)

- **Calgary `extract-text.js` upstream-then-replace.** Preserved as-is. Owner needed to extract universally-useful improvements (richer syllable algo, main/article extraction) into template before retiring the fork. Filed as bd `site-audit-fix-work-ar9`.
- **`scripts/_backup/*` cleanup across clients.** Disk hygiene only; not blocking.
- **9 Python connectors bypassing `_request_sync` retry coverage.** Filed as bd `site-audit-fix-work-acf` (carry-forward from §5a).
- **`networkx` + `vaderSentiment` missing from `pyproject.toml`.** Filed as bd `site-audit-fix-work-aj1` (carry-forward from §5b — 11 pre-existing pytest failures still pre-existing).

#### Verification surface

What was independently verified locally (no DFS / GBP credentials needed):

1. All 7 synced clients in template parity per `diff -rq` (calgary excepted: `extract-text.js` fork differs + `update-readability.py` orphan, both documented).
2. Calgary fork sha256 round-trip: pre-cp `b2e89f0f5e097af1758f3d41b199520a81b56c3aa05696cbeb78502484cdc291` == post-cp.
3. `node --check` zero errors across every synced `.js` file (all 7 clients).
4. `lib/atomic-write.js` + `lib/fetch-with-retry.js` present on all 7 synced clients (was missing on 6 pre-Tier-4; only matt had `lib/`).
5. Fix 14 deletions: all 3 client-local `generate-multipage-report.js` files absent on disk; zero code callers grep-confirmed across `*.md`, `*.js`, `*.py`, `*.json`.
6. Regression suite (atomic_write + connectors_base subset): 8/8 passing (matches pre-Tier-4 baseline). Full pytest still has 11 unrelated pre-existing failures (networkx + vaderSentiment).

The full `/seo-audit` end-to-end run on each newly-synced client was NOT executed this session — requires DFS + GBP credentials. **Step 1.5's auto-sync architectural guarantee now holds end-to-end across the entire fleet;** the next live audit per client should produce zero `template/scripts/ → clients/<c>/scripts/` deltas.

#### Plan delta vs TIER-4-PLAN.md

- Planned 8 commits, shipped 9 (added C2-prep for the gitlink fix). Following Tier 3 prep-commit precedent (`d98fc43`, `ef94747`).
- All 4 hardened seed concerns from `/root/.claude/plans/okay-awesome-can-we-zazzy-hopcroft.md` addressed: file-count parity, `test -f` lib/ assertions, sha256 fork guard, exact-SHA push-disclosure block.
- bd issues filed: 4 (3 from spill register §5 + 1 NEW v4-branch investigation from execution-time discovery).

### Tier 4 Followups — SHIPPED (2026-04-29)

12-commit pass on `site-audit-fixes-tier-4-followups` (forked from `site-audit-fixes-tier-4` at `f761fea`, pushed to origin `e6033ec`) resolving the 4 bd issues filed during Tier 4 wrap (aj1, 0au, acf, ar9), surfacing 2 NEW Tier 5 candidates from forensic, and restoring fleet parity after the template upgrade.

| # | Subject | Commit |
|---|---|---|
| docs    | Tier 4 Overflow Plan committed (max-effort revision; D1–D6 + 14-risk register) | `cdb8153` |
| aj1     | networkx + vaderSentiment as required deps in `platform/pyproject.toml` (eliminates silent prod zero-data risk) | `5950198` |
| acf 1/5 | `pagespeed.py` GET routed through `_request_sync` (preserves API-key delay logic) | `f59998d` |
| acf 2/5 | `business_profile.py` OAuth GET + POST routed through `_request_sync` | `4534d37` |
| acf 3/5 | `crux.py` POST routed through `_request_sync` with 404-as-no-data preserved via `httpx.HTTPStatusError` catch | `50ae087` |
| acf 4/5 | `brand_mentions.py` `_safe_get` wraps `_request_sync`; preserved `Retry-After` header parsing + bare-Exception "never raises" contract; removed redundant `_rate_limit_sync()` (base does it) | `32b6149` |
| acf 5/5 | `social_audit.py` `_safe_head`/`_safe_get` wrap `_request_sync`; `_safe_head` returns `int \| None` (status code) preserved via `exc.response.status_code` from HTTPStatusError catch | `27ac230` |
| bd hook | Auto-commit from `bd close site-audit-fix-work-acf` | `86e4ae6` |
| ar9 1/3 | Upstreamed Calgary's `countSyllables` (regex suffix-stripping) + `<main>`/`<article>` extraction (22-selector boilerplate strip) + `getReadabilityLevel(score)` helper to `template/scripts/extract-text.js` | `7836e23` |
| ar9 2/3 | Removed Calgary's hardcoded community-slug regex from `extract-text.js` fork | `ac9220b` |
| ar9 3/3 | Synced calgary's `extract-text.js` to template via `cp` (sha256 verified). **Calgary fork retired — Tier 4 sha256-fingerprint guard no longer needed.** | `1b22d64` |
| ar9 4/3 | Surfaced during post-flight: 4a's template upgrade had not propagated to the 6 non-calgary clients, breaking Tier 4 fleet-parity. Cohort cp + 1 commit. **Restored fleet-parity guarantee explicitly.** | `e6033ec` |

**Branch:** `site-audit-fixes-tier-4-followups` at `e6033ec`. Pushed to origin.

#### Recon discoveries surfaced during Followups

- **PEP 668 externally-managed Python.** Pre-flight `pip install --dry-run` failed on the system Python. Resolved via `--break-system-packages` flag (matches pytest precedent at `/usr/local/lib/python3.12/dist-packages`). The platform package is PYTHONPATH-imported (no pip install needed); only external deps require the install.
- **`scoreExplanation` IS consumed by code (Explore C correction).** Repo-wide grep at planning time proved `scoreExplanation` has 4 distinct consumers (renderer with `buildReadabilityExplanation()` fallback at `generate-multipage-report.js:1432,1483-1484,2796`; HTML renderer at `pages/content.js:293`; Python pipeline at `build_audit.py:692`; SOP requirement at `AUDIT-SOP.md:26`). Calgary's slug deletion was still safe (renderer fallback handles missing values), but commit-message accuracy required correcting Explore C's "no consumers" framing.
- **ar9 1/3 broke fleet parity until propagated.** The plan's 3-subtask ar9 didn't account for the 6 OTHER clients also needing the template update. Surfaced during Task 5 post-flight `diff -rq` check; resolved via commit `e6033ec`.
- **Subtle behaviors preserved during connector refactors.** brand_mentions: `Retry-After` header parsing (`min(int(headers.get("Retry-After", "5")), 30)`), removal of redundant `_rate_limit_sync()` (base does it), bare `except Exception` for "never raises" docstring contract. social_audit: `_safe_head` returns status code as `int` not `Response`, preserved via `exc.response.status_code` in HTTPStatusError catch.

#### What Tier 4 Followups did NOT touch (intentional, deferred)

- **try/except-import guard cleanup.** aj1 left the `_NETWORKX_AVAILABLE` / `HAS_VADER` guards in `internal_linking.py` + `local_seo.py` as defense-in-depth. Now that deps are required, the guards are dead code. Bundle with whoever next touches those analyzers.
- **PageSpeed `requests_per_second` override.** acf 1/5 preserved the manual `_request_delay()` per D3. Future cleanup: override `requests_per_second` in `__init__` based on whether API key is set; retire the manual delay logic.
- **`codex_worker.sh` reliability investigation.** Worker produced 1 valid + 1 wrong-file artifact across 9 dispatches. Smart-team Step 7 evidence check #2 partial. Bundle with whoever next touches llm-router tooling.

#### Verification surface

What was independently verified locally:

1. pytest full suite: **414/414 passing** (was 403 + 11 fail pre-aj1).
2. Fleet `diff -rq template/scripts/ clients/<c>/scripts/`: **all 7 clients in template parity** (calgary excepted on `update-readability.py` orphan only — `extract-text.js` fork RETIRED).
3. `node --check` zero errors fleet-wide across all template + client `.js` files.
4. networkx 3.6.1 + vaderSentiment 3.3.2 importable from system Python.
5. `_NETWORKX_AVAILABLE = True` and `HAS_VADER = True` post-aj1; previously-failing 11 tests all pass.
6. Calgary `extract-text.js` sha256 matches template post-sync (fork retirement verified).
7. 6 in-scope Python connectors (dataforseo + 5 from this pass) route through `base._request_sync` for retry coverage. 3 Google-SDK connectors confirmed out of scope; `local_seo` composes others (transitive coverage).

Live `/seo-audit` end-to-end run NOT executed (requires DFS/GBP credentials). Step 1.5's auto-sync guarantee continues to hold; next live run per client produces zero deltas.

#### NEW issues filed during 0au forensic (Tier 5 candidates)

| bd ID | Pri | Title |
|---|---|---|
| `site-audit-fix-work-c6r` | P3 | Remove committed `.bak` files for `generate-multipage-report.js` (4 locations) + add `*.js.bak` to `.gitignore` |
| `site-audit-fix-work-8d2` | P3 | Remove committed `.collab/` directory (10 files incl 104KB `collab.db` binary) from tracking + add `.collab/` to `.gitignore` |

Both surfaced during the v4-branch forensic investigation (0au). Filed for Tier 5 consideration; not addressed in this pass to keep scope disciplined.

#### Plan delta vs TIER-4-OVERFLOW-PLAN.md

- Planned 9-10 commits, shipped 12. Deltas:
  - +1 plan doc commit (`cdb8153`) per Tier 4 pattern.
  - +1 bd auto-hook commit (`86e4ae6`) when acf closed.
  - +1 ar9 propagation commit (`e6033ec`, "ar9 4/3") surfaced during post-flight when fleet-parity check failed.
- All 6 plan decisions (D1–D6) honored as written. All 14 plan risks (R1–R14) had their mitigations exercised.
- Critical mid-execution correction: D5's `scoreExplanation` consumer-audit. Plan's `ar9 2/3` commit message body accurately describes the renderer's `buildReadabilityExplanation()` fallback path rather than falsely claiming "no consumers" (Explore C error caught at planning time, codified into the plan, executed correctly).
- Smart-team subagent-driven execution: 9 CX-Executor dispatches, 0 blocking-question escalations. 2 dispatches caught and preserved subtle behaviors that blind template-application would have broken (acf 4/5 brand_mentions, acf 5/5 social_audit). The pattern works.
