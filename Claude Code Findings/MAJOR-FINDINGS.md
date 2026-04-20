# Major Findings — Site Audit Deep-Dive

**Purpose:** Running summary of the highest-severity bugs, systemic patterns, and architectural gaps surfaced by the per-script deep-dive audit. Not a replacement for individual findings — a curated cross-finding reference for prioritization.

**Last updated:** 2026-04-20
**Coverage:** Findings #1–#67
**Index:** [`INDEX.md`](./INDEX.md)

Entries below are ordered by category. Each links to its source finding(s). When multiple findings converge on the same issue, entries cross-reference.

---

## 1. CRITICAL — Runtime Crashes & Data Corruption

### gather-backlinks.js template crashes at runtime (Semaphore undefined)
**Severity:** CRITICAL (H+)
**Affected:** Template + liane-jamason (byte-identical); every future `/seo-audit` run on template-copied clients
**Source:** Finding #9 (`09-gather-backlinks.md`) — bug #1
**Evidence:** `template/scripts/gather-backlinks.js:38` imports only `postJson` from `./lib/fetch-with-retry`; `:236` calls `new Semaphore(2)` — `ReferenceError: Semaphore is not defined` before first API call
**Fix direction:** Change line 38 to `const { postJson, Semaphore } = require('./lib/fetch-with-retry');` — one-line unblock

### Agent 2 overwrites crawl-data.json and link-graph.json (root cause of Matt's blog undercount)
**Severity:** HIGH
**Affected:** Every client run through `/seo-audit` skill; confirmed on matt-wallmow (40 sitemap pages → 11 in `crawl-data.json`)
**Source:** `INDEX.md` addendum to finding #5; finding #5 (`05-crawl-sitemap.md`) bug #5
**Evidence:** `commands/seo-audit.md:341-410` instructs the site-crawler agent to write `seo/research/crawl-data.json` and `link-graph.json` AFTER Step 1's `crawl-sitemap.js --analyze` has already produced them; matt-wallmow's files are missing template-emitted fields (`analyzedCount`, `idxFilterPages`, `elapsedSeconds`, `issuesSummary`) and contain an extra `notes` field the template doesn't write
**Fix direction:** Delete the "Write seo/research/crawl-data.json" and "Write seo/research/link-graph.json" steps from Agent 2's prompt in `commands/seo-audit.md`

### build_audit.py:216 passes raw link-graph dict (not `.edges`) to InternalLinkAnalyzer
**Severity:** HIGH
**Affected:** Every client whose `audit-data.json` is built by the Python platform (observed live on matt-wallmow)
**Source:** `INDEX.md` addendum to finding #5
**Evidence:** matt-wallmow's `audit-data.json` shows `total_pages: 0, total_internal_links: 0, nodes: [], max_depth: 0`, all pages flagged as orphans — analyzer iterates top-level keys (`domain, crawlDate, notes, edges`), sees none are lists, processes ZERO edges
**Fix direction:** Change `platform/scripts/build_audit.py:216` to pass `link_graph.get("edges", {})` instead of the raw dict

### populate-audit-data.js + gather-keyword-volumes.js rewrite audit-data.json in-place with no backup
**Severity:** HIGH
**Affected:** All clients that run `/seo-audit` Step 5+; the core audit-data.json file
**Source:** Finding #15 (`15-populate-audit-data.md`) bug #2; Finding #11 (`11-gather-keyword-volumes.md`) bug #1
**Evidence:** `template/scripts/populate-audit-data.js:461` does `Object.assign(data, updates)` + `fs.writeFileSync(auditPath)`; `template/scripts/gather-keyword-volumes.js:295-299` same pattern — no `.bak` copy, no `.tmp + rename`, any crash or concurrent edit corrupts or silently overwrites the core data file
**Fix direction:** Both scripts should `copyFileSync → .bak`, write to `.tmp`, then `renameSync` atomically

### generate-multipage-report.js `validateAuditData()` logs CRITICAL but never exits non-zero
**Severity:** HIGH
**Affected:** Every client; any audit with a partial/broken `audit-data.json` silently produces an HTML report with guaranteed-empty pages
**Source:** Finding #21 bug #2
**Evidence:** `generate-multipage-report.js:3055` calls `validateAuditData()` at generate-time; the helper emits `CRITICAL:` messages to stderr but the script continues to `generate()` and writes HTML regardless — no `process.exit(1)` when required fields are missing or empty
**Fix direction:** After `validateAuditData()` returns a non-empty error list, `console.error` them and `process.exit(1)` to block deliverable generation; add an explicit `--force` opt-in flag for emergencies

### build_audit.py:217 — `sitemap_urls` derived from `crawl_data.pages` (capped), not full sitemap
**Severity:** HIGH
**Affected:** Every client whose crawl was truncated (Matt: 40 sitemap pages → 11 pages in `crawl-data.json` → orphan detection against 11-URL set)
**Source:** Finding #63 bug #2; Finding #52 bug #2
**Evidence:** `platform/scripts/build_audit.py:217` constructs the `sitemap_urls` list by iterating `crawl_data["pages"]` — but `crawl-data.json` is the crawl output (already capped / limited), not the raw `sitemap.xml` URL set. Orphan detection therefore compares edges against whatever crawl retained, not what the sitemap advertises, producing inflated false-orphan counts and missing genuinely-orphaned URLs that weren't crawled
**Fix direction:** Load `sitemap.xml` (or `sitemap-urls.json` if the crawler emits one separately) directly; pass that URL set to `InternalLinkAnalyzer` alongside `crawl_data.pages`

### build_audit.py:218 — hardcoded `https://www.{domain}` prefix breaks non-www clients
**Severity:** MEDIUM-HIGH
**Affected:** Any client whose canonical is apex (no www) or `http://` only; BFS depth from home will be computed against a home URL nothing links to
**Source:** Finding #63 bug #3
**Evidence:** `platform/scripts/build_audit.py:218` hardcodes `f"https://www.{domain}"` as the root node for depth-from-home BFS; clients on apex (e.g., `example.com` without www) or http-only staging domains get an unreachable root, so `max_depth=0` and all pages are flagged as orphans
**Fix direction:** Read the canonical home URL from `client-config.json.url` (or sniff from the first sitemap entry) rather than fabricating the scheme+subdomain

### base.py async retry covers network errors only, not HTTP 5xx
**Severity:** HIGH
**Affected:** Every Python connector consumer — DFS, PSI, CrUX 503/504 responses terminate after the first attempt
**Source:** Finding #40 bug #1
**Evidence:** `platform/src/audit_platform/connectors/base.py` async `_request` retry decorator retries on `httpx.NetworkError` / connection exceptions; a 503 from DataForSEO/PageSpeed Insights returns a valid HTTP response (not an exception) and bypasses the retry, so a single upstream hiccup drops the whole call silently
**Fix direction:** Expand retry predicate to include `response.status_code in {429, 500, 502, 503, 504}`; honor `Retry-After` header where present

### base.py::_request_sync has ZERO retry decorator (async has 3)
**Severity:** HIGH
**Affected:** Any Python connector code path that hits the sync wrapper — silent one-shot failures
**Source:** Finding #40 bug #2
**Evidence:** `platform/src/audit_platform/connectors/base.py` — the async `_request` method is wrapped with a 3-attempt retry decorator; `_request_sync` (used by synchronous connectors and tests) has no such decorator. Same endpoint, same error class, different reliability depending on which wrapper you happened to import
**Fix direction:** Extract retry logic to a shared helper and apply identically to both async and sync request paths; OR delete the sync path and make all connectors async

---

## 2. SYSTEMIC PATTERNS — Drift & Missing-Script Cohorts

### Three-client cohort drift: chris-nevada, laura-willis, liane-jamason are a generation behind on the entire gather-*.js layer
**Severity:** HIGH
**Affected:** chris-nevada, laura-willis, liane-jamason — byte-identical old forks across 5+ scripts
**Source:** Findings #7 bug #4, #8 bug #1, #10 bug #3, #11 bug #3, #12 bug #5, #13 bug #6
**Evidence:** Old forks at 198/232/241/327/372 lines respectively in `gather-pagespeed.js`, `gather-domain-metrics.js`, `gather-organic-metrics.js`, `gather-backlinks.js`, `gather-local-pack.js`, `gather-keyword-volumes.js`, `gather-local-seo.js` — all use raw `https.request()` + hardcoded `sleep()`, no retry utility, no Semaphore; silent 429/5xx failure cascades on their next re-audit
**Fix direction:** Bulk re-template all three clients across the full `gather-*.js` family in one coordinated PR

### Four-client missing-script pattern: calgary-castles, mammoth-lakes, murray-gardner, p3realtync
**Severity:** HIGH
**Affected:** calgary-castles, mammoth-lakes, murray-gardner, p3realtync — none have gather-keyword-volumes.js, gather-local-pack.js, gather-local-seo.js, gather-organic-metrics.js, populate-audit-data.js; subsets missing gather-pagespeed.js, gather-backlinks.js
**Source:** Findings #7 bug #5, #10 bug #4, #11 bug #2, #12 bug #6, #13 bug #7, #15 bug #4
**Evidence:** Directory listings of `clients/{slug}/scripts/` across the four show the scripts absent; murray-gardner's empty `audit-data.json` fields (contentQuality, backlinks, internalLinking, technicalSeo, localSeo, indexation, eeat, rankHistory) confirmed as downstream impact in finding #5 §6
**Fix direction:** After template is healthy, template-copy the missing scripts into these clients' `scripts/` dirs and re-run `/seo-audit` Step 5

### Normalizer drift — clients running stale versions of `generate-multipage-report.js`
**Severity:** HIGH
**Affected:** 3 clients (matt-wallmow, laura-willis, liane-jamason) + architectural pattern
**Source:** Finding #21 (in progress) — discovered during size survey
**Evidence:** Template `template/reports/multipage/generate-multipage-report.js` = 3160 lines; matt-wallmow/reports/multipage/generate-multipage-report.js = 2180 lines (**980 lines / ~30% behind**); laura-willis = 1797 lines (**1363 lines / ~43% behind**); liane-jamason = 1797 lines (byte-identical to laura's — same era); 5 other clients (calgary-castles, chris-nevada, mammoth-lakes, murray-gardner, p3realtync) have NO client-local copy. HANDOFF.md:72-76 prescribes running the TEMPLATE normalizer (`../../template/reports/multipage/generate-multipage-report.js`), not the client-local copy. Current skill workflow should be unaffected IF it follows HANDOFF. But: anyone running the client-local copy gets a stale version missing recent auto-fixes; HANDOFF.md documents 13 normalizer auto-fixes (hoisting CWV, reshaping lighthouseResults, deriving hubClusters, stale-data detection, etc.) — matt/laura/liane copies predate some of these. The fact that clients have local copies AT ALL suggests a historical workflow where they were run client-local. Risk: any script/Makefile/alias pointing at the local copy falls behind silently.
**Fix direction:** Either (a) delete client-local copies, enforce template-only execution, or (b) implement a sync check that verifies client copy matches template before run

---

## 3. SILENT DATA LOSS — Caps, Defaults, and Filters That Hide Information

### gather-local-pack.js `--location 2840` (country-level US) suspected root cause of 0-hit results for Matt
**Severity:** HIGH
**Affected:** matt-wallmow (0/25 keywords in local pack, status "success"); three-client cohort; all US clients
**Source:** Finding #12 (`12-gather-local-pack.md`) bug #1 (+ bug #2 shape-drift hypothesis)
**Evidence:** `commands/seo-audit.md:738` passes `--location 2840` unconditionally; DFS code 2840 = "United States" country-level, not city-level (e.g., Rhinelander WI = ~9030069); Matt's 25 Rhinelander-geo keywords return 0 local_pack items with 0 errors — classic upstream-shape or location-scope signature
**Fix direction:** Derive `locationCode` from `client-config.json` city/metro; add `--device mobile` test; live-curl DFS with city-level code vs 2840 to isolate between location vs `items.find(type==='local_pack')` rename

### gather-local-seo.js "SiteAuditBot" UA + first-name-only directory match
**Severity:** HIGH
**Affected:** All clients; matt-wallmow has only 1/4 directories "found" (Facebook; Yelp/BBB/Google Maps all false)
**Source:** Finding #13 (`13-gather-local-seo.md`) bugs #1, #2
**Evidence:** `template/scripts/gather-local-seo.js:97` sends UA `Mozilla/5.0 (compatible; SiteAuditBot/1.0)` — Cloudflare/WAFs 403 this outright on Yelp/BBB/Google Maps; `:202` matches `name.split(' ')[0]` lowercased (first name only), so "Matt Wallmow" becomes substring `"matt"` against every directory search page
**Fix direction:** Switch UA to real Chrome string (matches `browse.js`/`crawl-sitemap.js`); require full-name match with domain-match AND-gate, or emit a confidence score

### gather-local-seo.js Zillow URL malformed
**Severity:** HIGH
**Affected:** Any real-estate client whose `name`+`location` triggers the Zillow branch
**Source:** Finding #13 (`13-gather-local-seo.md`) bug #5
**Evidence:** `template/scripts/gather-local-seo.js:295` does `encodedLocation.replace(/%20/g, '-').toLowerCase()` — leaves `%2C` (comma) intact; "Rhinelander, WI 54501" yields URL path `rhinelander%2c-wi-54501/` (404); Zillow's real pattern is `/rhinelander-wi/`
**Fix direction:** URL-decode the comma, drop the ZIP, match Zillow's actual `/professionals/real-estate-agent-reviews/{city}-{state}/` pattern

### gather-organic-metrics.js hardcoded US location and English language
**Severity:** HIGH
**Affected:** Any non-US / non-English client audited today (calgary-castles currently has no data, would be first impact); no override path
**Source:** Finding #10 (`10-gather-organic-metrics.md`) bug #1
**Evidence:** `template/scripts/gather-organic-metrics.js:80-81` payload hardcodes `location_code: 2840, language_code: 'en'`; no CLI flag, no config read; Canadian / UK / French clients would silently get US-English DFS Labs data
**Fix direction:** Read `locationCode` and `languageCode` from `client-config.json` with fallback to 2840/`en`; add DFS location-code lookup table for existing client cities

### gather-organic-metrics.js `organicTraffic` is top-100 sum, labeled as if it were total
**Severity:** HIGH
**Affected:** Every client; especially long-tail-heavy sites (Matt's competitor shorewest.com: 61,333 keywords → reported 22,733 traffic = top-100 only)
**Source:** Finding #10 (`10-gather-organic-metrics.md`) bug #2
**Evidence:** `template/scripts/gather-organic-metrics.js:102,108-109` sums `etv` only across DFS's returned items (max 100 per call); `organicKeywords` correctly uses `result.total_count` (true total) — the two fields have inconsistent completeness under same object; normalizer merges the capped traffic into `domainMetrics` as if authoritative
**Fix direction:** Rename `organicTraffic` → `top100Traffic`; add separate DFS call to `/dataforseo_labs/google/domain_rank_overview/live` for site-level organic total

### extract-text.js silent `--limit 50` cap
**Severity:** HIGH
**Affected:** Any client with >50 content pages (none today; first client with 51+ pages will hit silently); skill-level lock at seo-audit.md:724
**Source:** Finding #6 (`06-extract-text.md`) bug #1
**Evidence:** `template/scripts/extract-text.js:89,116` — default `limit = 50`, `urls.slice(0, 50)` with only informational stderr "Processing N of M URLs"; no warning, no errors[] row, no skipped[] array; `/seo-audit` skill locks this at `commands/seo-audit.md:724` with explicit `--limit 50`
**Fix direction:** Default to unlimited; accept `--limit 0` to opt in to cap; drop `--limit 50` from the skill invocation; stderr-warn when cap truncates

### populate-audit-data.js brittle hardcoded heading literals
**Severity:** HIGH
**Affected:** Every audit's keyword/competitor/calendar/advantages population; silent null-fields on phrasing drift from research agents
**Source:** Finding #15 (`15-populate-audit-data.md`) bug #1
**Evidence:** `template/scripts/populate-audit-data.js:116,149,192,252,326` depend on exact phrases: "Full Rankings Table", "Executive Comparison Table", `## Competitor N:`, `## Section 8: Content Calendar`, `### What X Does Better`; research agents (LLMs) generate these MD files with unpredictable phrasing; Matt's audit-log shows `populate-audit-data.js --force` populated only 3 of 6 fields (strategies/calendar/advantages silently failed)
**Fix direction:** Enforce heading conventions in the skill's agent prompts (`commands/seo-audit.md`) AND accept multiple heading-pattern fallbacks per parser

### pages/local.js map center depends on `businessProfile.latitude/longitude` — no auto-geocode path
**Severity:** MEDIUM-HIGH
**Affected:** Every client without a manual lat/long entry in `audit-data.json.businessProfile` — the Local SEO page renders an empty or default-centered map
**Source:** Finding #28 bug #4
**Evidence:** `pages/local.js` reads `businessProfile.latitude` + `businessProfile.longitude` to center the Leaflet/Mapbox component; nothing in the Python analyzer pipeline or JS gather chain geocodes `client-config.json.city/state` into lat/long and writes it back. Clients who skipped manual entry see a blank or global-center map with no warning
**Fix direction:** Add a geocoding step (Nominatim or Google Geocoding) in `gather-local-seo.js` or as a dedicated step; fall back to city-centroid from a static lookup when the API is unavailable

### pages/keywords.js surfaces `organicTraffic` as authoritative — but it's top-100-capped
**Severity:** HIGH
**Affected:** Every client; client-facing misleading number on the Keywords page
**Source:** Finding #10 bug #2; Finding #23 bug #1 (cross-referenced to finding #10)
**Evidence:** `gather-organic-metrics.js` sums DFS `etv` across at most 100 returned items (documented in Section 3 entry above); `pages/keywords.js` displays `audit-data.json.domainMetrics.organicTraffic` as "Organic Traffic" without caveat. On long-tail-heavy competitors (Matt's shorewest.com: 61k keywords → top-100 ~22k, real total far higher) the reported number is dramatically understated — and the client sees it as THE number
**Fix direction:** Rename the field to `top100Traffic` and relabel the UI card; OR fetch `/dataforseo_labs/google/domain_rank_overview/live` for a true domain-wide total and display both

---

## 4. ARCHITECTURAL GAPS — Orphan Scripts, Missing Transformation Layers

### analyze-backlink-quality.js is an orphan — not wired into the skill
**Severity:** HIGH
**Affected:** All clients except liane-jamason (only client with `qualitySummary` enrichment); renderer + Python analyzer + test all expect enrichment that almost no client has
**Source:** Finding #14 (`14-analyze-backlink-quality.md`) bug #1
**Evidence:** Grep of `commands/seo-audit.md` returns zero matches for `analyze-backlink-quality`; `generate-multipage-report.js:2232,2241-2254` reads `qualitySummary`, `platform/src/audit_platform/analyzers/backlinks.py:122` includes it when present, `platform/tests/test_backlinks.py` asserts it; only liane-jamason has it
**Fix direction:** Add `node scripts/analyze-backlink-quality.js` after `gather-backlinks.js` in Step 5 of `commands/seo-audit.md` — after a calibration pass (Liane's 3.5% legit rate is suspiciously low)

### parse-google-ads.js writes ppc-raw-data.json; downstream PPC scripts read ppc-data.json
**Severity:** HIGH
**Affected:** Entire PPC audit path — no skill invokes `parse-google-ads.js`, and its output filename doesn't match what `generate-ppc-*.js` consume
**Source:** Finding #16 (`16-parse-google-ads.md`) bugs #1, #2
**Evidence:** `template/scripts/parse-google-ads.js:4` writes `ppc-raw-data.json` in CWD; `generate-ppc-spreadsheet.js`/`generate-ppc-presentation.js` read `ppc-data.json`; matt-wallmow has `ppc/ppc-data.json` + empty `exports/` — data provenance unclear; no `commands/ppc-audit.md` skill exists
**Fix direction:** Either rename output to `ppc-data.json`, add a transformer script, or update downstream scripts to accept `ppc-raw-data.json`; create a `commands/ppc-audit.md` skill to orchestrate

### generate-spreadsheet.js + generate-presentation.js cap competitor columns at 2
**Severity:** HIGH
**Affected:** Every client with 3+ competitors (matt-wallmow has 5 competitors → spreadsheet Sheet 3 shows 5 headers but only 2 columns of data; presentation Slide 5 same)
**Source:** Findings #17 (`17-generate-spreadsheet.md`) bug #1; #18 (`18-generate-presentation.md`) bug #1
**Evidence:** `template/scripts/generate-spreadsheet.js:56-57` hardcoded `row.comp1 || '', row.comp2 || ''`; `template/scripts/generate-presentation.js:116-117,122-123` same hardcoded 2-comp limit; headers built dynamically from `d.competitor.all` (line 51 / 116) but data rows never match
**Fix direction:** Replace with `d.competitor.all.map((_, i) => row[`comp${i+1}`] || '')` in both scripts — coordinated PR

### Dual Python + JS implementations for 4+ data streams (backlinks, local_seo, PPC, DFS, PSI)
**Severity:** HIGH — architectural
**Affected:** Every client; divergent output shapes, double DFS billing where both paths call the same endpoint, spam classifiers that disagree on the same domains
**Source:** Findings #41 bug #1, #42 bug #1, #54 bug #1, #62 bug #2
**Evidence:** Backlinks have both `platform/src/audit_platform/connectors/backlinks.py` + `analyzers/backlinks.py` AND `template/scripts/gather-backlinks.js` + `analyze-backlink-quality.js`; Local SEO has `connectors/business_profile.py` + `analyzers/local_seo.py` AND `gather-local-seo.js`; PPC has `connectors/google_ads.py` + `analyzers/ppc_analyzer.py` AND `parse-google-ads.js` + `generate-ppc-*.js`; DFS/PSI similarly split. Same upstream, two codepaths, two output schemas, two sets of bugs, and the report normalizer doesn't reconcile them
**Fix direction:** Pick ONE authoritative pipeline per data stream (Python where OAuth-gated, JS where credential-free); delete or clearly-deprecate the other; document in HANDOFF.md which path each stream uses

### backlinks.py:122 writes `qualitySummary` via its OWN classifier — different from analyze-backlink-quality.js's rule-based-v1
**Severity:** HIGH
**Affected:** Any client whose `audit-data.json` is built by the Python platform AND ALSO has `analyze-backlink-quality.js` output — the two classifiers disagree on the same domain list
**Source:** Finding #54 bug #1
**Evidence:** `platform/src/audit_platform/analyzers/backlinks.py:122` constructs `qualitySummary` (legit/spam/toxic counts) using its own internal classification logic; `template/scripts/analyze-backlink-quality.js` applies a "rule-based-v1" scheme with an entirely different threshold/tag set. Running both produces two `qualitySummary` objects on the same `backlinks.json` with different legit/spam splits — whichever ran last wins, and neither is documented as authoritative
**Fix direction:** Remove the classifier from `backlinks.py` and require `analyze-backlink-quality.js` to run first (and be wired into the skill — see finding #14 / entry N below); OR unify both on a shared `classify_backlink()` function imported from a single source

### 5 Python connectors require OAuth creds that most clients don't have — authoritative paths effectively dormant
**Severity:** HIGH — architectural
**Affected:** Every client without OAuth setup (majority of the roster); the Python paths report "unavailable" and JS gather fallbacks — with their own bugs — become the real data paths
**Source:** Findings #43, #44, #45, #47, #50
**Evidence:** `connectors/search_console.py` (#43), `connectors/ga4.py` (#44), `connectors/business_profile.py` (#45), `connectors/google_ads.py` (#50), `connectors/crux.py` (#47) all require OAuth2 tokens. No client in the current roster has these credentials provisioned. The "platform" analyzers depending on them never receive real data; the JS gather scripts (`gather-*.js`) are effectively the only functional path — yet they carry their own bugs (finding #9 crash, finding #12 location-code, finding #13 UA, etc.)
**Fix direction:** Either (a) provision OAuth for all clients as part of onboarding, or (b) document the JS paths as authoritative and delete the Python connectors to reduce surface area; in either case update HANDOFF.md to state which path is canonical per data stream

### No `commands/ppc-audit.md` skill exists — entire PPC cluster is orphaned
**Severity:** HIGH — architectural
**Affected:** All clients; `parse-google-ads.js`, `generate-ppc-spreadsheet.js`, `generate-ppc-presentation.js`, `platform/.../ppc_analyzer.py` have no orchestrator invoking them
**Source:** Findings #16, #19, #20, #62
**Evidence:** `commands/` directory has `seo-audit.md` but no `ppc-audit.md`; the PPC scripts are wired to each other by convention (`ppc-raw-data.json` / `ppc-data.json`) but nothing orchestrates the sequence or ensures the filename mismatch (finding #16) is reconciled. matt-wallmow has `ppc/ppc-data.json` + empty `exports/` with unclear provenance
**Fix direction:** Create `commands/ppc-audit.md` modeled on `seo-audit.md`; specify the sequence (`parse-google-ads → analyze → generate-spreadsheet → generate-presentation`); resolve the filename mismatch en route

### commands/seo-audit.md has NO reference to `analyze-backlink-quality.js` — orphan visible at skill level
**Severity:** HIGH — architectural gap
**Affected:** Every client running `/seo-audit` — backlink quality enrichment is never invoked by the skill, only liane-jamason has `qualitySummary` populated (by some manual/prior path)
**Source:** Finding #67 bug #10; cross-references finding #14
**Evidence:** `grep -n analyze-backlink-quality commands/seo-audit.md` returns zero matches; the skill's Step 5 invokes `gather-backlinks.js` and moves on. Downstream renderers (`generate-multipage-report.js:2232`), the Python analyzer (`backlinks.py:122`), and the test suite all expect `qualitySummary` that the skill never produces
**Fix direction:** Add an explicit `node scripts/analyze-backlink-quality.js` step in `commands/seo-audit.md` immediately after `gather-backlinks.js`; tune thresholds first (see finding #14 calibration note)

### Schema-validator pattern missing across 5 deliverable generators
**Severity:** HIGH — cross-cutting architectural
**Affected:** Every deliverable — spreadsheet, presentation, PPC spreadsheet, PPC presentation, multipage report — generates silently from a bad `audit-data.json`
**Source:** Findings #17, #18, #19, #20, #21 (entry A above)
**Evidence:** None of `generate-spreadsheet.js`, `generate-presentation.js`, `generate-ppc-spreadsheet.js`, `generate-ppc-presentation.js`, `generate-multipage-report.js` hard-fail on a missing/empty required field. `validateAuditData()` exists in the multipage generator but doesn't `exit(1)` (entry A). No shared schema-validator library
**Fix direction:** Extract a shared `lib/validate-audit-data.js` (or use Ajv + a JSON Schema) that every generator imports; require `--force` to bypass; make failures block deliverable emission by default

---

## 5. OPEN MYSTERIES — Unexplained Provenance to Investigate

### Matt's `local-seo.json` has `source: "audit-synthesis"` — script never writes that literal
**Severity:** HIGH (provenance unknown)
**Affected:** matt-wallmow; likely other clients — scope unknown until traced
**Source:** Finding #13 (`13-gather-local-seo.md`) bug #8
**Evidence:** `template/scripts/gather-local-seo.js:321` emits `source: "web-research"`; matt-wallmow's `local-seo.json` has `source: "audit-synthesis"` AND `rating: 5.0, reviewCount: 182` (fields this script never produces); literal `audit-synthesis` is NOT in `populate-audit-data.js` (full file read in finding #15)
**Fix direction:** Grep all JS + agent prompts + normalizer for `'audit-synthesis'` literal; establish which process rewrites `local-seo.json` before trusting any of Matt's local data

### matt-wallmow's 5th competitor (northwoodshomefinder.com) missing from pagespeed-data.json
**Severity:** HIGH (silent competitor drop)
**Affected:** matt-wallmow specifically; points to a potential skill-level substitution bug
**Source:** Finding #7 (`07-gather-pagespeed.md`) bug #11
**Evidence:** matt-wallmow's `client-config.json` lists 5 competitors (redmanrealtygroup, eliasonrealty, pinepointrealty, northwoodshomefinder, shorewest); `pagespeed-data.json` has 4 competitor entries with northwoodshomefinder.com absent AND no error row for it
**Fix direction:** Trace `{COMPETITOR_URLS_SPACE_SEPARATED}` variable substitution in `commands/seo-audit.md:400-500` with a 5-competitor dry run to confirm whether the orchestrator truncates

### calgary-castles has pagespeed-data.json + client-backlinks.json but no scripts to produce them
**Severity:** HIGH (data provenance unknown)
**Affected:** calgary-castles specifically; re-audits would fail or drift
**Source:** Finding #7 bug #5; Finding #9 §6
**Evidence:** `clients/calgary-castles/scripts/` has no `gather-pagespeed.js`, no `gather-backlinks.js`, no `gather-keyword-volumes.js`, no `gather-local-pack.js`, no `gather-local-seo.js`, no `gather-organic-metrics.js`; but `seo/research/pagespeed-data.json` and a 22KB `client-backlinks.json` both exist
**Fix direction:** Open the existing files, identify shape anomalies vs current template output, determine which prior template version produced them before re-templating

### laura-willis's 673-byte client-backlinks.json is a suspected failure stub
**Severity:** HIGH (data integrity unknown)
**Affected:** laura-willis; her Backlinks page may render from an effectively empty source
**Source:** Finding #9 (`09-gather-backlinks.md`) §6 data inventory
**Evidence:** `clients/laura-willis/seo/research/client-backlinks.json` is 673 bytes — dramatically smaller than liane's 156KB, matt's 29KB, or chris-nevada's 100KB; consistent with a status-failed stub (all `errors[]`, empty arrays)
**Fix direction:** Open the file, inspect `status`/`errors` fields, determine whether DFS credentials expired, quota hit, or domain was unreachable; flag for re-run after template crash (finding #1) is fixed

### "audit-synthesis" provenance label likely originates in `analyzers/local_seo.py` (partial resolution)
**Severity:** HIGH (provenance)
**Affected:** matt-wallmow's `local-seo.json`, likely others — mystery partially narrowed
**Source:** Finding #56 bug #1 (prediction); cross-refs finding #13 bug #8
**Evidence:** Finding #13 bug #8 surfaced the literal `"audit-synthesis"` in Matt's `local-seo.json` with no JS script writing it. Finding #56 bug #1 predicts the string originates in `platform/src/audit_platform/analyzers/local_seo.py` — consistent with the Python analyzer rewriting gather output after the fact. Not yet confirmed by direct grep of the Python source
**Fix direction:** `grep -rn 'audit-synthesis' platform/` to confirm; if found, document the rewrite path in HANDOFF.md; decide whether the analyzer should preserve the original `source: "web-research"` field or explicitly overwrite it

### Ghost fields (`pillars, keyStats, longTermColumns, nextSteps, mediumTermRoadmap, advantages, gradeSummary`) likely produced by the Reporting Intelligence analyzer (partial resolution)
**Severity:** HIGH (provenance)
**Affected:** Every client's `audit-data.json`; previously no known producer
**Source:** Finding #60 bug #1 (prediction); cross-refs findings #18, #22, #29
**Evidence:** Findings #18, #22, #29 flagged these top-level fields as "consumed by renderers but no gather script or analyzer produces them." Finding #60 bug #1 identifies a `reporting_intelligence` analyzer (or similar) in the Python platform as the likely producer, synthesizing these fields from primary research + analyzer outputs. Not yet confirmed by direct read of the analyzer source
**Fix direction:** Locate the analyzer (`grep -rn 'pillars\|keyStats\|longTermColumns' platform/`), document its inputs/outputs, and add explicit schema contracts so deliverable generators can validate presence before rendering
