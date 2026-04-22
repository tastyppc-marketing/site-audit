# Tandem Map — How the Site-Audit Tools Work Together
**Date:** 2026-04-19
**Branch / HEAD:** master @ `01a1bf4`
**Purpose:** This document is the reference for the "fix tools one-by-one" remediation campaign. Before planning a fix for any single script, read the relevant failure theme, cascade index entry, and drift row here — they tell you the *blast radius* of the script and what else will move when you touch it.

**Sources (pre-reconciled; do not re-read unless extending):**
- `docs/SEO-AUDIT-SYSTEM.md` — authoritative pipeline spec
- `HANDOFF.md` — normalizer auto-fix list + verification checklist
- `Claude Code Findings/` (5 deep dives) + `codex findings/` (150+ per-script audits)
- `.synthesis/drift-matrix.md`, `.synthesis/cascade-map.md`, `.synthesis/gap-verification.md`

**Scope delta from `SEO-AUDIT-SYSTEM.md`:** All 10 integration gaps that doc claimed CLOSED **are in fact wired at HEAD** (verified 2026-04-19). Only two are PARTIALLY closed — both cosmetic (Gap 9's table headers, Gap 10's stale Calgary file). The core data pipeline works for new clients generated today; remediation is about (a) fixing specific bugs in individual scripts, (b) propagating fixes to clients whose local copies drifted, and (c) remediating 4 clients who pre-date Gap 8 closure.

---

## Meta-principle (read before touching the normalizer)

**Prefer fixing upstream over extending `generate-multipage-report.js`.** The normalizer was built as a late-binding repair layer — it reads ~12 research files and silently papers over missing or wrong upstream data so the report still renders. Every normalizer auto-fix is a symptom of an upstream bug that made it to the render stage. Adding a new auto-fix entry makes the next bug harder to see. When you hit "data is wrong on page X," trace it to the upstream script that produced the shape, fix it there, and simplify the normalizer instead of expanding it.

The one exception: fallback chains that protect against missing *optional* research files (e.g., Search Console when the client didn't grant access). Those are correct. Fallbacks that hide *broken* upstream pipelines are not.

---

## 1. System flow — what actually runs today

`SEO-AUDIT-SYSTEM.md` describes the full 8-phase workflow. The *delta* worth recording:

### Currently-wired invocation path (`/seo-audit` skill)

```
Phase 2 — Research (6 parallel agents) .......... commands/seo-audit.md:340-600
Phase 3 — Data gathering .......................  Step 5.5 (many scripts)
   └── gather-pagespeed.js
   └── gather-domain-metrics.js
   └── gather-backlinks.js  <multi-domain: client + competitors>
   └── gather-organic-metrics.js
   └── gather-local-pack.js
   └── gather-keyword-volumes.js     ← Gap 1 (CLOSED)
   └── gather-local-seo.js           ← Gap 4 (CLOSED)
   └── extract-text.js
Phase 4 — Data population
   ├── Step 5.6: populate-audit-data.js  ← Gap 7 (CLOSED)
   ├── Step 5.7: build_audit.py --client-config   ← Gap 8 (CLOSED) + Gap 5 (CLOSED)
   └── Step 5.8: run_rank_tracker.py (OPTIONAL, user-gated)   ← Gap 6 (CLOSED, opt-in)
Phase 7 — Report generation
   └── generate-multipage-report.js   ← normalizer + HTML renderer
```

### Where data lands

| Pipeline stage | Output | Read by |
|---|---|---|
| Research agents | `seo/research/*.md` + `seo/research/*.json` | `build_audit.py`, `populate-audit-data.js` |
| Gather scripts | `seo/research/*.json` (pagespeed, domain-metrics, backlinks, keyword-volumes, local-pack, local-seo, organic-metrics, page-text-analysis) | `build_audit.py`, `generate-multipage-report.js` normalizer |
| `populate-audit-data.js` | 6 fields written into `seo/audit-data.json` (keywords, competitorComparison, competitorStrategies, siteComparison, contentCalendar, advantages) | `generate-multipage-report.js` |
| `build_audit.py` | 15+ fields written into `seo/audit-data.json` (contentQuality, technicalSeo, localSeo, indexationCrawlability, eeatSignals, reportingIntelligence, backlinkOpportunities, contentGap, competitorAnalysis, rankHistory) | `generate-multipage-report.js` |
| `generate-multipage-report.js` | 9 HTML pages (inlined data) | Browser (end user) |

### What's NOT wired on a default new-client audit

- **Gap 5 — GSC/GA4:** present *only if* operator filled `client-config.json` with `hasAccess: true` and service-account credentials. Default is `false` → those sections render empty-state. This is intentional: most clients don't grant access.
- **Gap 6 — Rank tracking:** Step 5.8 prompts the user (`--check` + `--compare` + `--inject`). On first audit there's no baseline, so most users skip — Keywords page Section 6 stays empty until a second audit weeks later.

### Client fleet — workflow generation at audit time

| Client | Layout | Generated from | Status |
|---|---|---|---|
| matt-wallmow | post-P7 | Current template | Cleanest reference audit |
| laura-willis | post-P7 | Early-P7 template | Missing retry on 6 gather scripts |
| liane-jamason | post-P7 | Early-P7 template | Missing retry on 6 gather scripts; has upgraded `crawl-sitemap.js` (fetchXmlRaw) |
| chris-nevada | post-P7 | Early-P7 template | Missing retry on 6 gather scripts |
| murray-gardner | pre-P7 | Skill inline-stub | **Broken — 8+ empty audit-data fields** |
| mammoth-lakes | pre-P7 | Pre-P7 template | Older `crawl-sitemap.js`; missing post-P7 scripts |
| p3realtync | pre-P7 | Pre-P7 template | Old `seo/reports/multipage/` layout; missing generator |
| calgary-castles | pre-P7 | Pre-P7 template | Old `seo/reports/multipage/` layout; own forked `extract-text.js`; missing generator |

---

## 2. Failure themes

Eight recurring patterns explain every non-trivial bug in the audits to date. When diagnosing a new issue, match it to one of these first; the fix for most new problems turns out to be an instance of one of these.

### Theme 1 — Version drift (skill inline ↔ template ↔ client)
**Severity:** H. **Status:** Open (multiple active instances).
**Symptom:** New audit produces a report with 7+ empty pages; or a client's regenerated report looks different from a fresh one from the same `audit-data.json`.
**Root cause:** The same script exists in 3–5 versions across (a) template canonical, (b) per-client overrides copied at audit time, (c) inline code blocks inside `commands/seo-audit.md`. Fixes to template don't propagate to existing clients; fixes a client makes (e.g., liane's `fetchXmlRaw`) never merge upstream. The skill-inline stubs are shorter, older, sometimes stdout-only — and when an audit agent copy-pastes one into a client folder, the client gets a non-functional version.
**Upstream sources:**
- `commands/seo-audit.md:84-278` — 4 inline code blocks (browse.js ~67 lines, crawl-sitemap.js ~59 lines, ddg-search.js ~36 lines, check-technical.js ~23 lines). All are stripped versions of their `template/scripts/` counterparts.
- `template/scripts/*.js` — canonical, but no sync mechanism.
- `clients/*/scripts/*.js` — divergent copies (see Drift Matrix §5).
- `template/reports/multipage/generate-multipage-report.js` — 4 versions: template (3160 lines), matt-wallmow (2180), laura-willis + liane-jamason (1797), 3 `.bak` files (1084).
**Downstream artifacts affected:** Any audit generated from a divergent script; murray-gardner's entire audit-data.json.
**Number of known instances:** 17 of 41 scripts show drift; 6 of 8 clients are affected.
**Rep finding:** `Claude Code Findings/02-diagnostic/05-crawl-sitemap.md` §6 (4 versions of crawl-sitemap documented); `.synthesis/drift-matrix.md`.
**Action pattern:** "Replace skill-inline stubs with `# See template/scripts/<name>.js`" + "Re-sync divergent client copies from template."

### Theme 2 — Boilerplate pollution in word count
**Severity:** H. **Status:** Open.
**Symptom:** THIN_CONTENT issue fires on pages with real content; word counts inflated by 50–200 words; Content page lists legitimate pages as "thin."
**Root cause:** `template/scripts/crawl-sitemap.js:159` uses `document.body.textContent` — the entire DOM including `nav`, `header`, `footer`, `aside`. Threshold at line 212 (`wordCount < 300 → THIN_CONTENT`) fires on 150-word pages with 100-word header + 50-word footer. Inconsistent with `extract-text.js`, which strips boilerplate correctly.
**Upstream sources:** `template/scripts/crawl-sitemap.js:159, 212`.
**Downstream artifacts affected:** `crawl-data.json.pages[].wordCount`, `issues[]` → `ContentQualityAnalyzer` → `audit-data.json.contentQuality.pages[].issues` + `.summary.thinContentPages` → Content page thin-content table.
**Number of known instances:** Every crawled page on every client.
**Rep finding:** `Claude Code Findings/02-diagnostic/05-crawl-sitemap.md` bug #4.

### Theme 3 — API data contract mismatch (DFS field mis-mapping)
**Severity:** H. **Status:** Open (5 mis-mappings in one file).
**Symptom:** Competitor comparison shows wrong "domain rating." Organic traffic column on competitors shows paid-traffic values. PPC budgets show 0 for all campaigns. Metrics look internally consistent but are semantically wrong.
**Root cause:** `platform/src/audit_platform/connectors/dataforseo.py` maps DFS API response fields to the wrong names:
- `organic_traffic` ← `estimated_paid_traffic` (paid, not organic)
- `domain_rating` ← `avg_position` in `get_competitors()` (SERP metric → authority metric)
- `intersections` ← `avg_position` in `get_organic_competitors()` (SERP metric → overlap count)
- Dofollow flag uses `backlinks_nofollow == 0` (loses mixed-follow nuance)
`platform/src/audit_platform/connectors/google_ads_connector.py` hardcodes `budget_amount = 0.0`. `template/scripts/gather-domain-metrics.js` writes `organicTraffic/organicKeywords/trafficValue` as always-null but the field names imply real values.
**Upstream sources:** `platform/src/audit_platform/connectors/dataforseo.py`, `google_ads_connector.py`, `template/scripts/gather-domain-metrics.js`.
**Downstream artifacts affected:** `BacklinkAnalyzer`, `CompetitorAnalyzer`, `ContentGapAnalyzer` all read these → `audit-data.json.competitorAnalysis`, `.backlinks.competitorDomainMetrics`, `.domainMetrics` → Competitors page (gap chart, comparison table), Links page.
**Rep finding:** `codex findings/13-backend-connectors/104-dataforseo_connector.md:93-108`.

### Theme 4 — Per-client analyzer-output incompleteness (pre-Gap-8 clients)
**Severity:** H. **Status:** Closed going forward, but 4 legacy clients still affected.
**Symptom:** A client's `audit-data.json` is missing 6–15 fields that a freshly-audited client has: `contentQuality`, `technicalSeo.*`, `localSeo`, `indexationCrawlability`, `eeatSignals`, `reportingIntelligence`, `backlinkOpportunities`, `contentGap`, `rankHistory`.
**Root cause:** These fields are populated only by `build_audit.py` (which runs the 10 Python analyzers). Gap 8 wired `build_audit.py` into the `/seo-audit` workflow at commit `307201b` (Step 5.7). Clients audited *before* that commit never had the analyzers run. Matt Wallmow (audited post-closure) has all six Python-analyzer sections populated in his audit-data.json; murray-gardner (pre-closure + broken crawl-sitemap.js) has none.
**Upstream sources:** `platform/scripts/build_audit.py` (correct), pre-closure invocations of `commands/seo-audit.md`.
**Downstream artifacts affected:** 15 `audit-data.json` fields empty for the 4 pre-P7 clients (calgary-castles, mammoth-lakes, murray-gardner, p3realtync).
**Number of known instances:** 4 clients.
**Rep finding:** `.synthesis/gap-verification.md` (Gap 8 section) + matt-wallmow evidence (audit-data.json lines 887, 1881, 2205, 2227, 2299, 2485).
**Action pattern:** Re-run `build_audit.py --client-config client-config.json` for each affected client, regenerate report. Requires research JSON files to exist — which in murray-gardner's case means Theme 1 must be fixed first.

### Theme 5 — Normalizer fragility (late-binding repair layer)
**Severity:** H. **Status:** Open (architectural).
**Symptom:** A section renders correctly for one client but not another from identical `audit-data.json`. Changing a research file doesn't visibly affect the report — because the normalizer silently fell back. A developer can't tell if a section is authoritative data or a fallback approximation.
**Root cause:** `template/reports/multipage/generate-multipage-report.js` performs a 13-step in-place `normalizeAuditData()` pass that hoists, aliases, reshapes, detects-stale, and BFS-computes from sibling research JSON files at render time. It prefers "build whatever you can" — which means upstream bugs produce valid-looking but semantically weaker reports. Combined with Theme 1's per-client copies (4 versions), a normalizer fix only applies to the version it touches.
**Upstream sources:** `template/reports/multipage/generate-multipage-report.js`, per-client `generate-multipage-report.js` copies, `template/scripts/populate-audit-data.js` (narrower upstream bridge with fragile positional markdown parsers).
**Downstream artifacts affected:** All 9 report pages.
**Number of known instances:** 13 auto-fix blocks documented in `HANDOFF.md:29-44`; at least 3 client-local copies diverged from template.
**Rep finding:** `codex findings/01-orchestrators/02-generate_multipage_report.md:119-134` ("compensating for missing upstream integration by performing late binding at report-build time").
**Action pattern:** Every time you're tempted to add a normalizer auto-fix, first check whether the upstream gather/analyzer script should produce the shape the renderer expects. If yes, fix upstream; remove or simplify the auto-fix. Also consolidate per-client copies so template is the single source of truth (see Tier 2 of fix-order).

### Theme 6 — Crawl response-header listener overwrite bug
**Severity:** H. **Status:** Open (one-line fix).
**Symptom:** `MISSING_HSTS` issue fires on sites that *do* have HSTS; `X_ROBOTS_NOINDEX` fires on pages not noindexed; `statusCode` shows the status of a favicon or CDN image instead of the page itself.
**Root cause:** `template/scripts/crawl-sitemap.js:109-122` attaches a response listener with `if (status < 300 || status >= 400)` — which matches every non-redirect response, including subresources (CSS, JS, images, fonts, analytics beacons). Each one *overwrites* `responseHeaders.server`, `.statusCode`, `.strictTransportSecurity`, `.cacheControl`. Final captured state reflects whichever subresource completed last, not the page.
**Upstream sources:** `template/scripts/crawl-sitemap.js:109-122`.
**Downstream artifacts affected:** `crawl-data.json.pages[].responseHeaders` + two issue flags (`MISSING_HSTS`, `X_ROBOTS_NOINDEX`) → `TechnicalSeoAnalyzer.audit_security_headers()` → `audit-data.json.technicalSeo.crawlIssues` → Technical page security-header section.
**Number of known instances:** Every multi-resource page (virtually all). Two issue flags directly corrupted.
**Rep finding:** `Claude Code Findings/02-diagnostic/05-crawl-sitemap.md` bug #1.
**Fix:** Filter listener to `response.url() === page.url()` or use `page.goto()`'s return value.

### Theme 7 — Real-estate hardcoding leaking to general clients
**Severity:** M (would escalate to H if client base diversified). **Status:** Open.
**Symptom:** Non-real-estate clients (hypothetical: SaaS, services, news, e-commerce) would have large sections of their site silently excluded from crawl analysis. Blog posts at `/blog/category/post` (4 path segments) would be excluded. Every client gets the same IDX regex battery regardless of site type.
**Root cause:** `template/scripts/crawl-sitemap.js:7-25` — hardcoded array of real-estate IDX patterns (MLS, listing/, homes-for-sale/, 3-bedroom-, etc.). Line 36: `segments.length > 3` excludes deep URLs unconditionally. No `--idx-config` flag. `platform/src/audit_platform/connectors/local_seo_connector.py` auto-selects first GBP account in a multi-account environment, which could silently pull the wrong business for agency-managed accounts.
**Upstream sources:** `template/scripts/crawl-sitemap.js:7-36`, `platform/src/audit_platform/connectors/local_seo_connector.py`.
**Downstream artifacts affected:** `crawl-data.json.pages[]` — reduced page set → all downstream analyzers operate on incomplete page universe → entire audit underreports for non-RE clients.
**Number of known instances:** Applied to all clients; no non-RE client in the current fleet, so latent.
**Rep finding:** `Claude Code Findings/02-diagnostic/05-crawl-sitemap.md` bug #3.

### Theme 8 — Reliability fragility (silent truncation, missing retry, runtime crashes)
**Severity:** H (Semaphore crash); M (silent truncations). **Status:** Open.
**Symptom:** Backlinks section is empty or partial with no visible error (gather-backlinks throws before writing output); Search Console query list caps at first page (pagination never requested); GA4 traffic summary caps at first result page; PSI 429s become null data on stale clients.
**Root cause:**
- `template/scripts/gather-backlinks.js` — imports only `postJson` from `fetch-with-retry` but uses `new Semaphore(2)` which is never imported → `ReferenceError` at runtime. Confirmed bug.
- `platform/src/audit_platform/connectors/search_console_connector.py` — `get_queries()` has no pagination loop; silently truncates at first page.
- `platform/src/audit_platform/connectors/ga4_connector.py` — `run_report()` returns only first result page.
- `template/scripts/lib/fetch-with-retry.js` — `postJson` does not throw on non-2xx; callers must check `res.statusCode` manually; several don't.
- Three clients (chris, laura, liane) still run pre-retry versions of 6 `gather-*` scripts → no 429 backoff → null data on transient rate limits. Contradicts MEMORY rule on retry requirement.
- `platform/src/audit_platform/connectors/business_profile_connector.py` — no retry path.
**Upstream sources:** see bullets above.
**Downstream artifacts affected:** `client-backlinks.json` (empty on Semaphore crash); SC queries truncated → Keywords page; GA4 truncated → Index page traffic stats; DFS 429s → null CWV/domain-metrics/keyword-volumes on stale clients.
**Rep finding:** `codex findings/02-data-gathering/09-gather_backlinks.md:83-98` (Semaphore); `codex findings/13-backend-connectors/106-search_console_connector.md:100`; `.synthesis/drift-matrix.md` §gather-pagespeed.

---

## 3. Canonical fix-order (reconciled)

Ordering principle: clean upstream *data sources* before downstream *consumers*, because downstream bugs can't be diagnosed until inputs are trustworthy. Within each tier, prefer one-line high-blast-radius fixes first. **Each fix is meant to stand alone as an "ultra-plan" target** — pick any single item, design its plan, execute, then return for the next.

Every fix lists what you need to plan it:
- **Theme:** which failure theme in §2
- **Files:** paths that change
- **Change:** the essence of the edit
- **Effort:** S (one-line, <30 min), M (multi-file, 1–3 hr), L (multi-client or multi-script, ½ day+)
- **Client propagation:** which clients must also receive the fix
- **Re-runs:** what to re-execute in each affected client after the change
- **Verification:** how to confirm the fix actually closed the symptom

### Tier 1 — Hot fixes, single script, high blast radius

**Fix 1.1 — `gather-backlinks.js` Semaphore import crash**
- **Theme:** 8 (Reliability)
- **Files:** `template/scripts/gather-backlinks.js` (import line near top)
- **Change:** Add `Semaphore` to the destructuring import from `./lib/fetch-with-retry`.
- **Effort:** S
- **Client propagation:** Only `liane-jamason` currently has the 255-line template version; chris/laura have 232-line version without `--from-audit-data`; matt has 208-line version. After fixing the import, decide if chris/laura/matt are re-synced to template (see Fix 2.2) — the Semaphore bug is in the template version, so all copies that inherit from it need the fix simultaneously.
- **Re-runs:** Any client running the backlinks step — re-run `node scripts/gather-backlinks.js {DOMAIN} {COMPETITORS}` after the fix.
- **Verification:** `client-backlinks.json` is written and non-empty; no ReferenceError in stderr.

**Fix 1.2 — `crawl-sitemap.js` response-header listener scope**
- **Theme:** 6 (Header overwrite)
- **Files:** `template/scripts/crawl-sitemap.js:109-122`
- **Change:** Filter the `page.on('response', ...)` callback to only capture the main document response — either via `response.url() === page.url()` OR by replacing the listener with the return value of `await page.goto()`.
- **Effort:** S
- **Client propagation:** All clients except murray-gardner (whose stub doesn't have this listener), liane-jamason (504-line upgrade), mammoth-lakes (411-line older variant). Verify whether liane's 504-line version needs the same patch — it likely does since only the XML fetching was changed.
- **Re-runs:** Re-run `node scripts/crawl-sitemap.js {DOMAIN} --analyze` to regenerate `crawl-data.json` with corrected headers, then re-run `build_audit.py` to propagate into `technicalSeo.crawlIssues`.
- **Verification:** `MISSING_HSTS` and `X_ROBOTS_NOINDEX` issue flags no longer fire on pages that genuinely have HSTS / aren't noindexed (spot-check via `curl -I` on one page).

**Fix 1.3 — `crawl-sitemap.js` word count boilerplate**
- **Theme:** 2 (Boilerplate)
- **Files:** `template/scripts/crawl-sitemap.js:159` (inside the `page.evaluate()` block).
- **Change:** Clone `document.body`, remove `nav, header, footer, aside` descendants, then count words from the remaining text. Matches `extract-text.js` behavior.
- **Effort:** S
- **Client propagation:** Same as Fix 1.2.
- **Re-runs:** Re-run `crawl-sitemap.js --analyze` and `build_audit.py`.
- **Verification:** `wordCount` drops 50–200 words on a page with a large header/footer; THIN_CONTENT stops firing on pages whose main content is >300 words.

**Fix 1.4 — Upstream `fetchXmlRaw` from liane-jamason into template**
- **Theme:** 1 (Drift — resolving by upstreaming)
- **Files:** Copy the `fetchXmlRaw()` helper from `clients/liane-jamason/scripts/crawl-sitemap.js` (504 lines) into `template/scripts/crawl-sitemap.js` (493 lines); replace the Playwright-based `fetchText` calls for `robots.txt` and sitemap XML with `fetchXmlRaw`.
- **Effort:** M (diff + port + test that template now reaches 504 lines with only this addition)
- **Client propagation:** After template is updated, overwrite all client copies except liane's (which already has it). Alternatively, re-sync everyone to template.
- **Re-runs:** Re-run `crawl-sitemap.js --analyze` on any client whose sitemap was previously failing silently.
- **Verification:** Diff sitemap URL counts before/after — sites with XSLT-styled sitemaps will now produce URL lists where they previously returned empty.

**Fix 1.5 — `dataforseo.py` field mis-mappings**
- **Theme:** 3 (API contract)
- **Files:** `platform/src/audit_platform/connectors/dataforseo.py` — 3 confirmed mis-mapping lines (verified at HEAD 2026-04-19):
  - Line 514 — `organic_traffic=data.get("estimated_paid_traffic")` in `get_domain_metrics()`. Field name says organic; value comes from paid-traffic estimate.
  - Line 664 — `domain_rating=item.get("avg_position")` in `get_competitors()`. `avg_position` is a SERP position metric (1–100 scale), not an authority rating. Should map from `rank` (matching line 511's correct `get_domain_metrics()` mapping).
  - Line 824 — `intersections=item.get("avg_position")` with comment "keyword overlap count" — same SERP-metric-as-overlap-count conflation.
  - (Optional) Line 625 — `dofollow = item.get("backlinks_nofollow", 0) == 0` collapses mixed-follow referring domains to "dofollow=false"; consider `backlinks_dofollow > 0` semantics.
- **Note on line 511:** `domain_rating=data.get("rank")` in `get_domain_metrics()` is **correct** (rank IS the primary DFS authority metric on its 0–1000 scale). Gap 9 handled the display relabel; this line is not a bug.
- **Change:** Fix the three lines above. For line 664, read the DFS `get_competitors` response schema to confirm whether the correct authority field is `rank`, `domain_rank`, or a separate competitor-specific field.
- **Effort:** M (verify each against DFS docs before patching)
- **Client propagation:** None (single Python file; all clients share it).
- **Re-runs:** Re-run `build_audit.py` for any client whose competitorAnalysis/backlinks data was generated post-closure. Matt is the only relevant client; others are pre-P7.
- **Verification:** Matt's `audit-data.json.competitorAnalysis.competitors[].domainRating` should land on the DFS 0–1000 rank scale (not 0–100 avg-position range). `organicTraffic` should be plausibly different from paid-traffic estimates.

### Tier 2 — Drift propagation, touches multiple files per fix

**Fix 2.1 — Eliminate skill-inline script stubs in `commands/seo-audit.md`**
- **Theme:** 1 (Drift)
- **Files:** `commands/seo-audit.md:84-151` (browse), `153-212` (crawl-sitemap), `217-252` (ddg-search), `256-278` (check-technical).
- **Change:** Delete each inline JS block; replace with a one-line reference: "See `template/scripts/<name>.js`. Invoke via `node scripts/<name>.js {args}` — do NOT paste the code into client folders."
- **Effort:** M (edit one file, re-read the skill to confirm nothing else references the inline code).
- **Client propagation:** This fix prevents future drift; it doesn't fix existing drift. Pair with Fix 3.1 to repair murray-gardner whose inline-stub was copied into their folder.
- **Re-runs:** None (skill documentation change; takes effect on next new audit).
- **Verification:** `grep -n "^\`\`\`javascript" commands/seo-audit.md` returns zero JS code blocks.

**Fix 2.2 — Re-sync chris/laura/liane `gather-*.js` to retry-enabled template versions**
- **Theme:** 1 (Drift) + 8 (Reliability — retry)
- **Files:** 6 scripts per client × 3 clients = 18 files: `gather-domain-metrics.js`, `gather-keyword-volumes.js`, `gather-local-pack.js`, `gather-local-seo.js`, `gather-organic-metrics.js`, `gather-pagespeed.js`. Template versions all `require('./lib/fetch-with-retry')`.
- **Change:**
  1. **Verify `lib/fetch-with-retry.js` exists** in each client's `scripts/lib/` directory *before* copying any gather scripts. If missing, copy from `template/scripts/lib/fetch-with-retry.js` first — otherwise every copied script will throw a `Cannot find module` error on execution.
  2. `cp template/scripts/gather-*.js clients/{chris-nevada,laura-willis,liane-jamason}/scripts/` (6 scripts × 3 clients).
- **Effort:** M (mechanical copy + verify client's `lib/` dir).
- **Client propagation:** Self-scoped (this fix IS propagation).
- **Re-runs:** Re-run whichever gather step you think is currently producing null data on each client. Check `audit-log.md` for 429 errors first.
- **Verification:** Spot-check `require('./lib/fetch-with-retry')` is at the top of each copied file; run one gather command and confirm no `fetch-with-retry` undefined error.

**Fix 2.3 — Consolidate per-client `generate-multipage-report.js` copies**
- **Theme:** 5 (Normalizer fragility) + 1 (Drift)
- **Files:** 4 divergent versions today — template (3160), matt (2180), laura+liane (1797), 3 md5-identical `.bak` files (1084).
- **Change:** Two-step: (a) overwrite each client's generator with the current template version (`cp template/reports/multipage/generate-multipage-report.js clients/*/reports/multipage/`). (b) `git rm` the 4 `.bak` files (they're pre-normalizer relics, not rollback-useful).
- **Effort:** M
- **Client propagation:** matt/laura/liane — note calgary, chris, p3 don't have a `reports/multipage/` dir at all (they use `seo/reports/multipage/`; addressed in Fix 3.2).
- **Re-runs:** `node template/reports/multipage/generate-multipage-report.js --data clients/<slug>/seo/audit-data.json --output clients/<slug>/seo/reports/multipage --inline` for each affected client.
- **Verification:** `diff -rq template/reports/multipage/generate-multipage-report.js clients/*/reports/multipage/generate-multipage-report.js` returns no differences except whitespace.

**Fix 2.4 — Decide on `.bak` hygiene for generator**
- **Theme:** 1 (Drift housekeeping)
- **Files:** 4 `.bak` files, all md5-identical 1084-line pre-normalizer snapshot.
- **Change:** Either `git rm` all 4 (keeping a single `generate-multipage-report.js.bak` in `template/` only), or delete them entirely since git history is the real rollback path.
- **Effort:** S
- **Verification:** `git ls-files` shows no `.bak` copies under `clients/*/reports/multipage/`.

### Tier 3 — Client remediation

**Fix 3.1 — murray-gardner full re-audit**
- **Theme:** 1 + 2 + 4 (catastrophic confluence)
- **Prereq:** Tier 1 fixes 1.1–1.4 must be landed on template first. This fix copies template scripts into the client, so broken template scripts propagate broken scripts. Do not start 3.1 until template is clean.
- **Files touched per client:** replace `clients/murray-gardner/scripts/crawl-sitemap.js` (currently 153-line inline stub) with template version; ensure other missing scripts (`extract-text.js`, gather suite, `populate-audit-data.js`) are present.
- **Change (sequence):**
  1. `cp template/scripts/*.js clients/murray-gardner/scripts/` (and `lib/`)
  2. Copy `template/client-config.json` to `clients/murray-gardner/` (if not present)
  3. Re-run research agents if Markdown research files are stale/empty.
  4. Re-run Phase 3 gather scripts (pagespeed, backlinks, domain-metrics, keyword-volumes, local-pack, local-seo, organic-metrics, extract-text).
  5. Re-run `crawl-sitemap.js --analyze` to produce `crawl-data.json` and `link-graph.json`.
  6. Run Step 5.6 `populate-audit-data.js`.
  7. Run Step 5.7 `python platform/scripts/build_audit.py --type seo --domain {DOMAIN} --client-config client-config.json`.
  8. Regenerate the report.
- **Effort:** L (full audit re-run, hours)
- **Client propagation:** Self-scoped.
- **Verification:** `murray-gardner/seo/audit-data.json` now has `contentQuality`, `technicalSeo`, `localSeo`, `indexationCrawlability`, `eeatSignals`, `reportingIntelligence` populated (match shape of matt-wallmow's audit-data.json).

**Fix 3.2 — p3realtync + calgary-castles: decide migrate vs deprecate**
- **Theme:** 1 (pre-P7 layout drift)
- **Files:** Both use `seo/reports/multipage/` instead of `reports/multipage/`; both have diverged `shared/*.js` (6–7 of 10 files); both lack `generate-multipage-report.js`.
- **Change options:**
  - **Migrate:** Copy `template/reports/multipage/` into each client's new `reports/multipage/`, regenerate report, leave old `seo/reports/multipage/` as an archive.
  - **Deprecate:** Mark these two clients as "locked, historical" and do not re-audit them.
- **Effort:** L per client if migrating; 0 if deprecating.
- **Decision factor:** Are these still-active clients? If yes, migrate. If no (they appear to be older references), deprecate.
- **Verification (if migrating):** New report renders; old `seo/reports/multipage/` preserved for archive purposes.

**Fix 3.3 — mammoth-lakes re-audit**
- **Theme:** 1 + 4
- **Files:** Pre-P7 `crawl-sitemap.js` (411 lines); missing `extract-text.js`, missing gather suite, missing `populate-audit-data.js`.
- **Change:** Same 8-step sequence as Fix 3.1, adapted.
- **Effort:** L
- **Verification:** audit-data.json now has Python-analyzer sections populated.

**Fix 3.4 — Re-run `build_audit.py` on chris-nevada + laura-willis after Fix 2.2**
- **Theme:** 4 (Analyzer-output incompleteness can also affect post-P7 clients if they were generated before retry fixes landed)
- **Files:** None (re-execution only).
- **Change:** `python platform/scripts/build_audit.py --type seo --domain {DOMAIN} --client-config client-config.json` per client; regenerate report.
- **Effort:** M
- **Verification:** `grep -c '"reportingIntelligence"' clients/*/seo/audit-data.json` shows 1 per file; report's index grade badge populates.

### Tier 4 — Polish

**Fix 4.1 — `crawl-sitemap.js` IDX patterns configurable**
- **Theme:** 7 (Real-estate hardcoding)
- **Files:** `template/scripts/crawl-sitemap.js:7-36`
- **Change:** Accept `--idx-config <path>` flag; default to real-estate patterns for backward compat; add empty-default for non-RE clients via `client-config.json.siteType`.
- **Effort:** M
- **Verification:** A non-RE test site crawls without excluding legitimate `/blog/category/post`-style URLs.

**Fix 4.2 — SC + GA4 pagination**
- **Theme:** 8 (Silent truncation)
- **Files:** `platform/src/audit_platform/connectors/search_console_connector.py`, `platform/src/audit_platform/connectors/ga4_connector.py`.
- **Change:** Add pagination loops to `get_queries()` and `run_report()` respectively; cap total rows at a sensible ceiling (e.g., 10,000) to prevent unbounded API spend.
- **Effort:** M
- **Verification:** Client with >1000 queries shows >1000 queries in `audit-data.json.searchConsoleData.topQueries`.

**Fix 4.3 — `indexation_crawlability_analyzer.py` output contract**
- **Theme:** 4 + 5 (analyzer output → synthesis consumer)
- **Files:** `platform/src/audit_platform/analyzers/indexation_crawlability.py` — `detect_soft_404s()` method.
- **Change:** Return `issues` array (not `pages`) to match ReportingIntelligence consumer expectation.
- **Effort:** S
- **Verification:** `reporting_intelligence_analyzer` picks up soft-404 findings in `topIssues`.

**Fix 4.4 — Gap 9 residual: "DR" column headers → "Authority Score"**
- **Theme:** N/A (cosmetic closure polish)
- **Files:** `template/reports/multipage/pages/backlink-opportunities.js` lines 281, 318, 410, 439, 882, 1307, 1805, 1875, 1967.
- **Change:** Replace "DR" with "AS" or "Authority" in table headers for visual consistency with the "Authority Score" prose.
- **Effort:** S
- **Client propagation:** Bundles with Fix 2.3 (template → clients regeneration).
- **Verification:** `grep -c '>DR<' template/reports/multipage/pages/backlink-opportunities.js` returns 0.

**Fix 4.5 — Gap 10 residual: delete stale Calgary best-practices file**
- **Theme:** 1 (Drift housekeeping)
- **Files:** `template/reports/multipage/seo-best-practices-2026-calgary-castles.md` (30KB pollution).
- **Change:** `git rm`.
- **Effort:** S
- **Verification:** File no longer present; no workflow references it.

---

## 4. Per-script cascade index (alphabetical)

Each entry: which failure theme(s) the script participates in, what it reads, what consumes it. Use this when picking a fix target — find the script, understand blast radius, then open §3 for the fix plan and §5 for client propagation.

| Script | Theme(s) | Upstream deps | Downstream consumers |
|---|---|---|---|
| `analyze-backlink-quality.js` | 8 | `gather-backlinks.js`, `client-backlinks.json` | `audit-data.json.backlinks` quality tier (not yet wired into workflow) |
| `backlinks.py` (analyzer) | 3, 4 | `dataforseo.py`, gather-backlinks output | `audit-data.json.backlinks`, `.backlinkOpportunities` → Links, Backlink-opportunities pages |
| `brand_mentions_connector.py` | 8 | DuckDuckGo DOM, YouTube embedded JSON | `ContentGapAnalyzer` → `audit-data.json.unlinkedMentions` |
| `browse.js` | 1, 2, 7 | Playwright, target URL | content-auditor + competitor-analyzer agents (stdout only — no structured output is a contract weakness) |
| `build_audit.py` | 4, 5 | all `seo/research/*.json` | `audit-data.json` (15+ keys) → all 9 report pages |
| `business_profile_connector.py` | 7, 8 | GBP API, OAuth | `LocalSeoAnalyzer` → `audit-data.json.localSeo` → Local page |
| `check-technical.js` | 1, 7 | Playwright, target URL | agents (stdout only); duplicates logic from `crawl-sitemap.js` |
| `competitor.py` (analyzer) | 3, 4 | `dataforseo.py` mis-mapped fields | `audit-data.json.competitorAnalysis` → Competitors page |
| `content_gap.py` (analyzer) | 4 | `dataforseo.py`, backlinks step (implicit order) | `audit-data.json.contentGap`, `.topicalAuthority`, `.unlinkedMentions` |
| `content_quality.py` (analyzer) | 2, 4 | `crawl-data.json` wordCount (inflated), `page-text-analysis.json` | `audit-data.json.contentQuality` → Content page |
| `crawl-sitemap.js` | **1, 2, 3, 6, 7** | Playwright, sitemap/robots.txt | **Highest blast-radius script in the repo.** `crawl-data.json` + `link-graph.json` → every Python analyzer → every report page |
| `dataforseo.py` (connector) | **3** | DFS REST API | `BacklinkAnalyzer`, `CompetitorAnalyzer`, `ContentGapAnalyzer`, `LocalSeoAnalyzer` |
| `ddg-search.js` | 1, 7 | DuckDuckGo DOM, hardcoded `kl=us-en` | `keyword-researcher` agent (non-US clients get US SERP) |
| `extract-text.js` | 5 | Playwright, URLs from `crawl-data.json` | `page-text-analysis.json` → normalizer readability enrichment |
| `fetch-with-retry.js` (lib) | 8 | Node `http` module | all gather-*.js; `postJson` does NOT throw on non-2xx |
| `ga4_connector.py` | 8 | GA4 Data API, OAuth | `audit-data.json.trafficData`; truncates at first result page |
| `gather-backlinks.js` | **4, 8** | `fetch-with-retry.js`, DFS API; **Semaphore import crash** | `client-backlinks.json` → normalizer `topBacklinks`, `topReferringDomains` → Links page |
| `gather-domain-metrics.js` | 3, 8 | DFS backlinks/summary | `domain-metrics.json` → normalizer → Competitors, Links pages |
| `gather-keyword-volumes.js` | 5, 8 | DFS keyword volume, `audit-data.json.keywords` (in-place mutation side effect) | `keyword-volumes.json` → Keywords page volume chart |
| `gather-local-pack.js` | 8 | DFS SERP local pack | `local-pack-data.json` → Local page |
| `gather-local-seo.js` | 8 | DFS + other local data | `local-seo.json` → normalizer step 8 → Local page |
| `gather-organic-metrics.js` | 4, 8 | DFS Labs ranked_keywords | `organic-metrics.json` → Keywords page |
| `gather-pagespeed.js` | 5, 8 | Google PSI API | `pagespeed-data.json` → normalizer CWV/lighthouse/pageSpeedComparison → Technical page |
| `generate-multipage-report.js` | **1, 5** | `audit-data.json` + 12 sibling research files | **Final data assembler + fallback engine + HTML renderer.** Per-client copies diverge silently. |
| `google_ads_connector.py` | 3 | Google Ads API, OAuth | PPC analyzer → PPC report; `budget_amount` hardcoded 0 |
| `indexation_crawlability.py` | 4 | `crawl-data.json`, optional SC | `audit-data.json.indexationCrawlability`; `detect_soft_404s()` key mismatch |
| `internal_linking.py` | 4 | `link-graph.json`, `crawl-data.json` | `audit-data.json.internalLinking`; normalizer has BFS fallback |
| `links.js` (page renderer) | 4, 5 | `data.internalLinking`, `data.apiErrors` | Links HTML page; accepts camelCase + snake_case (masks normalizer misses) |
| `local_seo_connector.py` | 7, 8 | GBP API | `LocalSeoAnalyzer` → `audit-data.json.localSeo` |
| `populate-audit-data.js` | 5 | 3 MD research files | `audit-data.json` 6 fields; parsers brittle to AI format variation |
| `reporting_intelligence.py` | 4 | entire `audit-data` after all prior steps | `topIssues`, `actionPlan`, `quickWins`, `overallGrade` |
| `search_console_connector.py` | 8 | SC API, service account | `audit-data.json.searchConsoleData`; truncates at first page |
| `technical_seo.py` (analyzer) | 4, 6 | `crawl-data.json` headers (corrupted by Theme 6) | `audit-data.json.technicalSeo.*` → Technical page |

---

## 5. Drift matrix — script × client

**Scoring:** H = divergence breaks downstream data; M = feature drift; L = cosmetic.

### `template/scripts/` (19 scripts)

| Script | Versions | Worst-drift client(s) | Severity |
|---|---|---|---|
| `analyze-backlink-quality.js` | 1 + 7 missing | liane only has it; 7 clients lack copy | L |
| `browse.js` | 2 | skill inline (67 lines, stripped) | L |
| `check-technical.js` | 2 | skill inline (23 lines, stdout-only) | M |
| `crawl-sitemap.js` | **5** | **murray-gardner (153-line stub) / skill inline (59)** | **H** |
| `ddg-search.js` | 2 | skill inline (36 lines) | L |
| `extract-text.js` | 2 + 3 missing | calgary (275-line fork) + missing in mammoth/murray/p3 | **H** |
| `gather-backlinks.js` | 3 + 4 missing | matt-wallmow (208 lines, no `--from-audit-data`) | M |
| `gather-domain-metrics.js` | 2 + 4 missing | chris/laura/liane pre-retry | **H** |
| `gather-keyword-volumes.js` | 2 + 4 missing | chris/laura/liane pre-retry | **H** |
| `gather-local-pack.js` | 2 + 4 missing | chris/laura/liane pre-retry | **H** |
| `gather-local-seo.js` | 2 + 4 missing | chris/laura/liane pre-retry | **H** |
| `gather-organic-metrics.js` | 2 + 4 missing | chris/laura/liane pre-retry | **H** |
| `gather-pagespeed.js` | 2 + 4 missing | chris/laura/liane pre-retry | **H** (MEMORY rule violation) |
| `generate-ppc-presentation.js` | 1 | — | — |
| `generate-ppc-spreadsheet.js` | 1 | — | — |
| `generate-presentation.js` | 1 | — | — |
| `generate-spreadsheet.js` | 1 | — | — |
| `parse-google-ads.js` | 1 | — | — |
| `populate-audit-data.js` | 1 + 4 missing | 4 pre-P7 clients lack copy | M |

### `template/reports/multipage/` (22 scripts)

| Script | Versions | Worst-drift client | Severity |
|---|---|---|---|
| `generate-multipage-report.js` | **4** | matt/laura/liane all behind template; 3 clients lack copy | **H** |
| `pages/index.js` | 3 | p3/calgary | M |
| `pages/content.js` | **5** | p3realtync | **H** |
| `pages/technical.js` | 3 | p3/calgary | M |
| `pages/links.js` | 3 | p3/calgary | M |
| `pages/local.js` | 3 | p3/calgary | M |
| `pages/keywords.js` | 3 | p3/calgary | M |
| `pages/competitors.js` | 3 | p3/calgary | M |
| `pages/action-plan.js` | 3 | p3/calgary | M |
| `pages/backlink-opportunities.js` | 5 + 1 missing | **p3realtync (missing entirely)** | **H** |
| `shared/charts.js` | 2 | p3 | M |
| `shared/data-loader.js` | 3 | p3/calgary | M |
| `shared/debug-data.js` | 3 | p3/calgary | L |
| `shared/explainer.js` | 2 + 1 missing | calgary | M |
| `shared/nav.js` | 3 | p3/calgary | M |
| `shared/print.js` | 2 | p3 | L |
| `shared/search.js` | 1 | — | — |
| `shared/table-filters.js` | 2 + 1 missing | calgary | M |
| `shared/table-pagination.js` | 1 + 2 missing | calgary/p3 | L |
| `shared/utils.js` | 3 | p3/calgary | M |
| `qa-test.js` | 1 | not in calgary/chris/p3 (L) | L |
| `normalizer.test.js` | 1 (template only) | — | — |

### Python scripts (`platform/src/audit_platform/`)

Single source, no client overrides. Two client-only one-offs (`clients/calgary-castles/scripts/update-readability.py`, `clients/calgary-castles/seo/reset-test-data.py`) — not in workflow.

---

## 6. Client remediation priority

Ranked by remediation effort (low → high) and by which tier of fixes each client unlocks.

| # | Client | Layout | Remediation scope | Depends on |
|---|---|---|---|---|
| 1 | **matt-wallmow** | post-P7 | **Leave alone — this is the reference audit.** Only touch after Tier 1 fixes land template-side, then regenerate report. | — |
| 2 | **liane-jamason** | post-P7 | Re-sync 6 `gather-*` scripts (Fix 2.2) + regenerate report after Fix 2.3. `fetchXmlRaw` upgrade goes *from* her *to* template (Fix 1.4). | Fix 2.2, 2.3, 1.4 |
| 3 | **laura-willis** | post-P7 | Same as liane: Fix 2.2 + 2.3. Re-run `build_audit.py` after (Fix 3.4). | Fix 2.2, 2.3, 3.4 |
| 4 | **chris-nevada** | post-P7 | Same as laura: Fix 2.2 + 2.3 + 3.4. | Fix 2.2, 2.3, 3.4 |
| 5 | **mammoth-lakes** | pre-P7 | Full re-audit if still active (Fix 3.3). Otherwise deprecate. | Decision: active? |
| 6 | **calgary-castles** | pre-P7 (old `seo/reports/multipage/`) | Migrate layout (Fix 3.2) + full re-audit — OR deprecate. Has forked `extract-text.js` that may have worth-keeping helpers; consider upstreaming before overwriting. | Decision + Fix 3.2 |
| 7 | **p3realtync** | pre-P7 (old `seo/reports/multipage/`) | Same as calgary. `pages/backlink-opportunities.js` is literally missing — can't render that page at all. | Decision + Fix 3.2 |
| 8 | **murray-gardner** | pre-P7 + broken crawl | **Full re-audit required** (Fix 3.1). Single largest remediation effort. Confirmed broken: 8 empty audit-data fields traced to skill-inline crawl stub. | Fix 1.2, 1.3, 1.4, 2.1, 3.1 (sequence) |

**Sequencing rationale:** Land Tier 1 fixes on template first. Then Tier 2 drift propagation rolls fixes to matt/liane/laura/chris automatically. Then regenerate reports for all 4 post-P7 clients. Only then tackle murray-gardner (because his re-audit *uses* those same fixed scripts). P3realtync + calgary-castles + mammoth-lakes are separate-track decisions: migrate or deprecate.

**Verification post-remediation:** Each client's `audit-data.json` should have the 6 Python-analyzer sections (`contentQuality`, `technicalSeo`, `localSeo`, `indexationCrawlability`, `eeatSignals`, `reportingIntelligence`) — matt-wallmow is the reference shape.

---

## Using this document for individual fix plans

When you're ready to plan a fix:

1. Open **§3 Canonical fix-order** — find the item (e.g., Fix 1.2).
2. Cross-reference **§2 Failure themes** for why it matters and what specifically goes wrong.
3. Cross-reference **§4 Per-script cascade index** to understand blast radius and consumers.
4. Cross-reference **§5 Drift matrix** for which clients' local copies also need the fix.
5. Cross-reference **§6 Client remediation priority** for the order clients get the fix.
6. If the fix is in a script with an existing deep-dive finding, open it:
   - `Claude Code Findings/<layer>/<nn>-<script>.md`
   - `codex findings/<layer>/<nn>-<script>.md`
7. Now enter "ultra plan mode" with a plan structured around: spec the change → identify test coverage → identify re-runs → verification procedure → rollback strategy.

After each fix, return to this document and mark the item in §3 complete. When a Tier's items are all complete, move to the next.
