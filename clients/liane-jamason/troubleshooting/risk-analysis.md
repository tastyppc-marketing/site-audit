# Risk Analysis — Multipage Report Pipeline Fix

Generated: 2026-04-08
Analyst: Research agent (pre-implementation scan)
Scope: All risks discovered during read-only inspection before the Liane Jamason data pipeline fix.

Files inspected:
- `/mnt/c/dev/site audit/template/reports/multipage/generate-multipage-report.js`
- `/mnt/c/dev/site audit/template/reports/multipage/shared/data-loader.js`
- `/mnt/c/dev/site audit/template/reports/multipage/shared/charts.js`
- `/mnt/c/dev/site audit/template/reports/multipage/shared/utils.js`
- `/mnt/c/dev/site audit/template/reports/multipage/pages/backlink-opportunities.js`
- `/mnt/c/dev/site audit/template/reports/multipage/pages/local.js`
- `/mnt/c/dev/site audit/template/reports/multipage/pages/competitors.js`
- `/mnt/c/dev/site audit/template/reports/multipage/pages/keywords.js`
- `/mnt/c/dev/site audit/template/reports/multipage/pages/technical.js`
- `/mnt/c/dev/site audit/platform/src/audit_platform/connectors/dataforseo.py`
- `/mnt/c/dev/site audit/platform/src/audit_platform/connectors/base.py`
- `/mnt/c/dev/site audit/platform/src/audit_platform/analyzers/backlinks.py`
- `/mnt/c/dev/site audit/clients/liane-jamason/troubleshooting/data-contract-map.md`
- `/mnt/c/dev/site audit/clients/liane-jamason/troubleshooting/calgary-vs-liane-diff.md`

---

## A. Chart.js Crash Risks

### A1. Division by zero: `backlink-opportunities.js` — `avgCompetitorRD`

**Location:** `pages/backlink-opportunities.js` lines 318 and 541

The expression `COMPETITORS.reduce(...) / COMPETITORS.length` executes unconditionally when `renderInsights()` and `renderSummary()` are called. `COMPETITORS` is built from `_bo.competitors || []` at module-evaluation time (line 132). If `_bo.competitors` is empty (which it will be for Liane until the backlink script runs), `COMPETITORS.length` is `0` and both `renderInsights` and `renderSummary` will compute `NaN` from `0 / 0`. This propagates into the headline string and all stat cards as "NaN referring domains behind." It will not throw a JS error, but every number in Sections 1 and 3 of the backlink-opportunities page will display as `NaN`.

**Fix needed:** Guard both calls with `if (!COMPETITORS.length) { /* show empty state */ return; }` before the division.

### A2. `backlink-opportunities.js` module-level evaluation at load time

**Location:** `pages/backlink-opportunities.js` lines 121–168

Unlike all other page renderers, `backlink-opportunities.js` evaluates its data (`_bo`, `CLIENT`, `COMPETITORS`, `MOCK_OPPORTUNITIES`, and all derived filter arrays) at module load time, outside any function, using `window.AUDIT_DATA` directly. Every other renderer reads data inside an `init(data)` function called by `data-loader.js` after boot. This means:

1. If `window.AUDIT_DATA` is not yet defined when this script executes, all module-level vars will be empty/zero. The `data-loader.js` async fallback path (debug-data.js injection) will not re-run the module-level code — it only calls `init()`, which this page does not have in the same way. Result: the page renders with all-zero data even after debug-data.js loads.

2. If `_bo.competitors` is populated on next regeneration, a browser that cached the old page will still show stale module-level state.

### A3. `renderRDChart` — `Chart` constructor called without null check on data values

**Location:** `pages/backlink-opportunities.js` lines 581–635

The `values` array is built from `CLIENT.referringDomains` and `COMPETITORS[i].referringDomains`. Both default to `0` if absent (line 137, 143), so Chart.js will receive all-zero data rather than crashing. However, the chart height calculation at line 570 uses `(COMPETITORS.length + 1) * 48 + 40`. When `COMPETITORS.length` is 0 this produces `88px` — a valid non-zero height — so no crash, but the rendered chart will be a single zero-height bar.

### A4. Volume chart — non-numeric string volume causes silent empty state

**Location:** `pages/keywords.js` lines 113–134

Liane's `keywords` array uses string labels for volume (e.g., `"High"`, `"Medium"`) rather than numbers. `parseNumber(keyword.volume)` will fail the `isNaN` guard, so `chartData` will be empty and the entire volume bar chart section will show an empty-state message. This is a graceful degradation rather than a crash, but it means the volume chart will not render until real DFS volume numbers are populated.

### A5. Competitor gap chart — `Math.log10(0)` produces `-Infinity`

**Location:** `pages/competitors.js` lines 279–298

The log-scale gap chart calls `Math.log10(m.clientValue)` for each metric. If `m.clientValue` is exactly `0`, `Math.log10(0)` returns `-Infinity`. The code guards `> 0` (line 280: `m.clientValue > 0 ? Math.log10(...) : 0`) so it substitutes `0` correctly. However, for competitor values the same guard is applied. If a competitor's value is `0` for every metric, that competitor's dataset becomes all-zeros, which Chart.js will render as empty bars — not a crash, but misleading.

### A6. Radar chart — falls back to bar chart, but requires at least 2 numeric rows

**Location:** `pages/competitors.js` lines 231–236

The renderer explicitly guards `if (metrics.length < 2)` and shows an empty state. Liane has `siteComparison` populated with string values like `"Yes/No"` that `parseNumericValue` will attempt to extract numbers from via regex. The regex on line 102 (`matches.map(...)`) will find any embedded integers in strings like `"3/5"` or `"Good"`. The risk is that non-intended numbers inside qualitative strings get silently extracted and fed to the chart, producing misleading data. Verify all `siteComparison[].client` values are intentionally numeric before relying on this chart.

---

## B. Leaflet Map Crash Risks

### B1. Missing lat/lng — handled gracefully, no crash

**Location:** `pages/local.js` lines 263–283

If both `businessProfile.latitude/longitude` and any GeoJSON `Point` feature in `serviceAreaMap` are absent, the renderer sets `mapEl.innerHTML` to an empty-state message and returns. No crash. For Liane, since `localSeo` is entirely absent, `getLocalSeo(data)` returns `{}`, all downstream picks return `null`, and the map container shows the empty-state message. Safe.

### B2. Malformed GeoJSON — swallowed by try/catch

**Location:** `pages/local.js` lines 306–319

The `L.geoJSON(serviceAreaMap, ...)` call is wrapped in `try { } catch (e) { /* ignore GeoJSON parse errors */ }`. If the GeoJSON is malformed (e.g., coordinates out of range, missing `type` field), the overlay simply will not appear. The business marker and competitor pins still render if coordinates are present. Safe from crashing, but silent — implementer will not know the GeoJSON was rejected. Add a `console.warn` in the catch if debugging map render issues.

### B3. Competitor locations with missing lat/lng — conditionally skipped

**Location:** `pages/local.js` line 336

`if (comp.lat && comp.lng)` gates each `L.marker()` call. A competitor entry with `lat: 0` or `lng: 0` will be silently skipped because `0` is falsy. In Florida (Liane's area), all longitudes are negative and all latitudes are positive, so this is not a practical issue for St. Petersburg coordinates. It would be a risk for a client near the equator or prime meridian. Document the falsy-zero behavior as a known edge case.

### B4. Empty `competitorLocations` — no crash, just no red pins

Confirmed safe: `toArray()` converts missing/null to `[]`, `competitors.forEach(...)` over empty array does nothing.

### B5. `leafletMap` reuse across navigation — `this.leafletMap.remove()` guard

**Location:** `pages/local.js` line 286

`if (this.leafletMap) { this.leafletMap.remove(); }` prevents double-initialization. Safe, but the `_booted` guard in `data-loader.js` (line 38) means `init()` only fires once anyway.

---

## C. Silent Data Loss

### C1. Six normalizer try/catch blocks swallow all parse errors without logging

**Location:** `generate-multipage-report.js` lines 624, 710, 733, 885, 929, 958

All six auto-population blocks (pagespeed-data.json, crawl-data.json, link-graph.json, page-text-analysis.json, client-backlinks.json, domain-metrics.json) catch errors with `catch (_) { /* ignore */ }` or `catch (_) { /* ignore parse errors */ }`. If any of these research JSON files is malformed or has unexpected structure, the normalizer silently skips the auto-population and moves on. The `fixes` counter is not incremented, so the logInfo at line 1099 may show fewer fixes than expected without indicating which file failed. The only exception is `backlink-opportunities.json` at line 1031, which uses `logWarning` — the only file that surfaces an error message.

**Risk for Liane:** When the new data scripts write their output files, if a JSON encoding issue occurs (e.g., a non-serializable value produces truncated JSON), the normalizer will silently skip that entire section. The report page will show an empty state with no indication of what happened.

**Mitigation:** After each data script runs, manually validate the JSON with `python -m json.tool` before regenerating.

### C2. `internalLinking.orphans` replacement guard has an off-by-one logic flaw

**Location:** `generate-multipage-report.js` lines 796–799

```js
const currentOrphans = Array.isArray(linking.orphans) ? linking.orphans : [];
if (!currentOrphans.length || currentOrphans.length === Number(linking.orphan_count)) {
  linking.orphans = orphans;
}
```

The condition replaces the existing orphans list only if it's empty OR if its length exactly equals the freshly computed `linking.orphan_count`. If the existing list has 35 orphans and the recomputed `orphan_count` is also 35 (both derived from the same stale data), the replacement happens and may overwrite a manually curated list with the auto-generated one. Conversely, if an existing list has 34 entries and the new count is 35, the replacement is skipped and the stale list survives. This is a logic inversion risk when the data is partially stale.

### C3. `data-loader.js` async debug-data.js fallback has timing gap

**Location:** `shared/data-loader.js` lines 15–28

If `window.AUDIT_DATA` is absent, a `<script>` tag loading `shared/debug-data.js` is dynamically injected. The `onload` callback calls `_setup()`, which sets `window.TPPC.boot`. The auto-boot at line 75 checks `document.readyState !== 'loading'` and fires `TPPC.boot()` via `setTimeout(..., 50)`. However, if the page's `DOMContentLoaded` event already fired before `debug-data.js` loaded (which is likely since it's a dynamic injection), the per-page JS (e.g., `pages/keywords.js`) will have called `TPPC.boot()` in its own `DOMContentLoaded` listener before `_setup()` ran, meaning `_booted` was already `true` when the auto-boot fires 50ms later. For generated reports (which always have `AUDIT_DATA` inline), this path never executes. For the backlink-opportunities page specifically (which does not use the standard `init(data)` pattern), the fallback path is irrelevant anyway.

### C4. `replacePlaceholder` calls `exitWithError` if placeholder not found

**Location:** `generate-multipage-report.js` lines 445–453

If a new HTML page template is added to `PAGE_FILES` but lacks the `/* __AUDIT_DATA_PLACEHOLDER__ */null` marker, the generator will call `exitWithError` and terminate without writing any output files. All 9 current templates have been confirmed to have placeholders (18 matches = 9 files × 2 placeholders each). When adding the new research data scripts, this is not a risk unless a new template page is added. However, if the `backlink-opportunities.html` template is edited and the placeholder comment is accidentally deleted (e.g., a text editor auto-reformats the inline script), the generator will silently fail.

---

## D. Template Contamination Risks

### D1. Calgary-specific document in the template directory

**Location:** `/mnt/c/dev/site audit/template/reports/multipage/seo-best-practices-2026-calgary-castles.md`

A markdown file explicitly named for and containing content about Neil Rowlandson / CalgaryCastles.com lives in the shared template directory. The generator does not copy `.md` files (it only copies `shared/`, `pages/`, and `assets/` directories), so this file will NOT be included in any generated report bundle. However, it is a data hygiene risk: it could mislead a future agent into thinking the template directory contains client-specific data intentionally, and it may cause confusion if the template directory is shared or audited.

### D2. Calgary-specific strings in `shared/explainer.js`

**Location:** `/mnt/c/dev/site audit/template/reports/multipage/shared/explainer.js` lines 164, 202

Two explainer entries contain Calgary-specific example text:
- `"like 'Calgary Communities'"` in the Hub & Spoke explanation
- `"when someone in Calgary searches..."` in the local performance explanation

The generator copies the entire `shared/` directory into the output bundle. This means every generated report (including Liane's) will ship with explainer tooltips that reference Calgary as an example. This is not a functional bug — the text is used as illustrative phrasing, not as data — but it is a professional presentation issue. A client in St. Petersburg, Florida will see Calgary referenced in hover tooltips.

### D3. `shared/debug-data.js` is harmless but gets copied to output

**Location:** `shared/debug-data.js` (3 lines: `window.AUDIT_DATA = null;`)

The generator copies the entire `shared/` directory verbatim. `debug-data.js` contains `window.AUDIT_DATA = null`, which is loaded as a fallback only if `AUDIT_DATA` is already absent. Since the generated HTML has inline data, the browser never fetches `debug-data.js` from the output bundle at runtime. No contamination risk, but the file is vestigial in the output.

### D4. `generate-multipage-report.js.bak` in template root

**Location:** `/mnt/c/dev/site audit/template/reports/multipage/generate-multipage-report.js.bak`

A backup file exists alongside the main generator script. It is not in any copied directory and does not affect report generation. Risk: a future agent might read this file, find stale logic, and apply it. Label clearly or remove after the pipeline fix is confirmed stable.

### D5. `test-output/` directory in template root has no `backlink-opportunities.html`

**Location:** `/mnt/c/dev/site audit/template/reports/multipage/test-output/`

The test-output snapshot contains 10 HTML files but is missing `backlink-opportunities.html`. This suggests it was built before the backlink opportunities page was added. If this directory is used for QA reference, comparisons against it will produce false failures for the new page.

---

## E. Cross-Client Interference

### E1. Generator output path is deterministic and can overwrite previous runs

**Location:** `generate-multipage-report.js` lines 93–101

When `--output` is omitted, the output directory name is derived from `client.name` + today's date: `multipage-report-liane-jamason-2026-04-08/`. If the generator is run twice on the same day, the second run overwrites the first with no warning (`fs.mkdirSync` with `{ recursive: true }` creates or reuses the directory, then `fs.writeFileSync` overwrites each file). This is not cross-client interference, but it could silently destroy a partially correct report if the generator crashes mid-run on the second execution.

### E2. Research files are read from `path.dirname(dataPath)/research/`

**Location:** `generate-multipage-report.js` line 1119

`dataDir` is set to the directory containing `audit-data.json`. All 6 auto-population file reads resolve relative to this directory (e.g., `path.join(dataDir, 'research', 'crawl-data.json')`). The generator cannot accidentally read another client's files as long as `--data` points to the correct client directory. No cross-client interference is possible through this path.

### E3. No shared cache or temp files detected

The normalizer reads from disk and writes into the in-memory `auditData` object. No temp files are created. The `copyDirectory` function only writes to the `--output` directory. No shared state between runs.

### E4. `run_backlink_analysis.py` merges into existing audit-data.json

**Location:** `platform/scripts/run_backlink_analysis.py` lines 82–95

When `--output` is specified, the script reads the existing `audit-data.json`, merges three keys (`backlinks`, `domainMetrics`, and optionally `backlinkIntersection`/`linkOpportunities`), and writes back. This is a read-modify-write operation. If a second data script runs concurrently and both try to write to `audit-data.json` simultaneously, one will overwrite the other's changes. All data scripts must be run sequentially, not in parallel.

---

## F. DataForSEO API Risks

### F1. `DataForSEOError` is raised and uncaught in `run_backlink_analysis.py`

**Location:** `platform/scripts/run_backlink_analysis.py` — no try/except around `analyzer.analyze()`

The `with DataForSEOConnector(settings) as connector:` block calls `analyzer.analyze()`, which internally calls `_post()` and `_unwrap()`. If the DFS API returns a non-20000 status (e.g., insufficient balance, API key suspended, endpoint not available for the subscription tier), `DataForSEOError` is raised and propagates as an unhandled exception with a Python traceback. The script exits with code 1, but if `--output` was specified, the existing `audit-data.json` is not modified (the write happens after the `with` block). Safe — no partial write. However, the stderr output will show a raw Python traceback rather than a clean error message.

### F2. Task-level errors in batch SERP calls are logged and skipped, not raised

**Location:** `platform/src/audit_platform/connectors/dataforseo.py` lines 282–290

In `get_serp_batch()`, per-task errors (rate limit, quota, single-keyword failure) log a warning and `continue` — they do not raise `DataForSEOError`. The caller receives an empty list for that keyword with no indication that data is missing. If a rank tracker script calls `get_serp_batch()` for 25 keywords and 5 keywords hit per-task quota errors, the output JSON will silently have 5 missing keyword entries. These will appear as "Not ranking" in the report.

### F3. `_post()` in `dataforseo.py` does NOT call `_rate_limit_sync()`

**Location:** `platform/src/audit_platform/connectors/dataforseo.py` lines 80–93

The `_post()` method calls `self.sync_client.post(...)` directly. It does not call `self._rate_limit_sync()` before making the request. The `BaseConnector._rate_limit_sync()` method is defined at `base.py` line 68, but `DataForSEOConnector._post()` bypasses it. This means rapid consecutive calls (e.g., from `BacklinkAnalyzer` fetching metrics for 4-5 competitors back-to-back) are not rate-throttled at the application level. DataForSEO will apply server-side rate limiting and may return 429 or task-level errors. The retry logic in `BaseConnector._request()` (tenacity, lines 77–82) applies only to the async path; the sync `_post()` path has no retry.

### F4. Backlinks API requires a separate subscription tier

**Location:** `platform/src/audit_platform/connectors/dataforseo.py` lines 11–14 (TODO comment)

The code has a TODO noting that the Backlinks API requires a `$100/month minimum commitment` beyond the standard subscription. If the account does not have Backlinks enabled, `_post('/backlinks/...')` will return a task-level error (20015 or similar "product not activated" code), which `_unwrap()` will raise as `DataForSEOError`. This will stop `run_backlink_analysis.py` before any data is written.

### F5. Estimated API cost for the 4 planned new scripts

Estimates based on DFS published pricing. Verify current rates at https://dataforseo.com/pricing before running.

| Script | Endpoint | Calls | Estimated Cost |
|---|---|---|---|
| Backlink analysis (client) | `backlinks/summary` + `backlinks/backlinks` + `backlinks/referring_domains` | ~3 calls | ~$0.03–0.10 |
| Competitor domain metrics (4-5 domains) | `backlinks/domain_pages_summary` × 5 | ~5 calls | ~$0.05–0.20 |
| Rank tracking (25 keywords × 2 dates) | `serp/google/organic/live/advanced` × 50 | ~50 calls | ~$0.25–1.00 |
| PageSpeed comparison (5 domains × 2 strategies) | Google PageSpeed API (free) | 0 DFS cost | $0 |

Total estimated DFS cost for full Liane data run: approximately $0.33–$1.30. Costs are low but non-zero. Confirm the DFS balance covers this before running.

### F6. `find_link_opportunities()` output key mismatch with generator expectations

**Location:** `platform/scripts/run_backlink_analysis.py` line 74

The script writes results to `existing["linkOpportunities"]`, not `existing["backlinkOpportunities"]`. The generator at line 994 reads `data.backlinkOpportunities` (camelCase, no "link" prefix). The `run_backlink_analysis.py` output key (`linkOpportunities`) does not match the key the generator and renderer expect (`backlinkOpportunities`). This means running the script with `--opportunities` will populate a key that the report system ignores entirely. The opportunities section will remain empty even after the script runs successfully.

**Fix needed:** Either rename the output key in `run_backlink_analysis.py` to `backlinkOpportunities`, or add a mapping step in the generator's normalizer.

---

## Summary: Top 5 Must-Fix Before Running the Pipeline

| Priority | Risk | Location | Consequence if ignored |
|---|---|---|---|
| 1 | `linkOpportunities` vs `backlinkOpportunities` key mismatch | `run_backlink_analysis.py` line 74 | Opportunities section always empty |
| 2 | Division by zero in `renderInsights` / `renderSummary` when competitors empty | `backlink-opportunities.js` lines 318, 541 | NaN displayed in every stat card |
| 3 | `_post()` bypasses rate limiter on sync path | `dataforseo.py` line 80 | 429s mid-run when fetching 5+ competitors |
| 4 | Batch SERP task-level errors silently skipped | `dataforseo.py` lines 282–290 | Missing keywords show as "Not ranking" |
| 5 | Six normalizer try/catch blocks swallow all parse errors | `generate-multipage-report.js` lines 624–958 | Malformed research JSON fails silently |

---

## Items Confirmed Safe (Not Risks)

- `replacePlaceholder` — exits loudly if placeholder missing, does not silently corrupt output
- Leaflet — all three crash scenarios (no coords, malformed GeoJSON, empty competitors) are handled gracefully with empty-state messages
- `debug-data.js` — harmless in output bundle; browser never fetches it when inline data is present
- Cross-client file interference — impossible given relative path resolution from `dataDir`
- `Chart.js` with null data — all chart factories check for canvas existence and guard null datasets; Chart.js itself handles empty arrays without throwing
- `makeTablesResponsive()` — safe when no tables exist; `querySelectorAll` returns empty NodeList
