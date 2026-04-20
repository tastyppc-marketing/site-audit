# Deep Dive #7 — `template/scripts/gather-pagespeed.js`

**File:** [`template/scripts/gather-pagespeed.js`](/root/site-audit/template/scripts/gather-pagespeed.js) (191 lines)
**Layer:** 03 — API / data gathering (Google PageSpeed Insights)
**Cross-reference:** [`codex findings/02-data-gathering/05-gather_pagespeed.md`](/root/site-audit/codex findings/02-data-gathering/05-gather_pagespeed.md) (148 lines). Related: `codex findings/11-connector-test-scripts/49-test_pagespeed.md`, `codex findings/13-backend-connectors/112-pagespeed_connector.md` (the Python sibling, separate file).
**Template-vs-client drift:** **YES — two distinct versions in the field, plus one client missing the script entirely.** See §6.
**Template-vs-skill drift:** No inline stub in the skill — invoked at `seo-audit.md:692`. Clean on that axis.
**Date:** 2026-04-20

---

## 1. Purpose

The sole producer of Core Web Vitals + PageSpeed-comparison data for the report. Calls Google's public PSI v5 API for the client URL + every competitor URL at mobile and desktop strategies, extracts the performance category subset (LCP, FCP, CLS, INP, TTFB, SpeedIndex, opportunities), and writes `seo/research/pagespeed-data.json`.

That JSON is one of the most-read research files downstream:

- `generate-multipage-report.js` normalizer (lines **593-626**): builds `coreWebVitals`, `pageSpeedComparison`, and `technicalSeo.lighthouseResults`.
- The normalizer also has an explicit **stale-data detector** (`HANDOFF.md:19, 34`) for when `technicalSeo.pageSpeedComparison` has all-identical competitor scores copied from the client — it falls back to this file's `pageSpeedComparison` when it detects the stale pattern.
- **No Python analyzer** consumes it directly. The pagespeed data path is pure JS: script → normalizer → report.

The skill invokes it at `seo-audit.md:692` with the signature `node scripts/gather-pagespeed.js {CLIENT_SITE_URL} {COMPETITOR_URLS_SPACE_SEPARATED}`.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<client-url>` | positional #1 | — **required** | **Defines homepage-Core-Web-Vitals.** First positional is treated as "the client's headline page." |
| `[competitor-url ...]` | positional #2+ | — | Each is re-treated as a competitor, mobile + desktop. |
| `--urls urls.txt` | advertised in header | **not implemented** | Documented at line 10 but line 107 strips all `--` args. Dead feature. |

**Env vars:**
- `PAGESPEED_API_KEY` or `GOOGLE_API_KEY` (line 33) — either accepted. If missing, PSI runs without a key and is limited to ~25 requests / 100 seconds per origin IP.

**Files read:** None.
**Network:** `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` (line 32).

## 3. Outputs

Written to `seo/research/pagespeed-data.json` (line 122, CWD-relative).

```
{
  data: {
    client: [{ url, domain, mobile: {...} | null, desktop: {...} | null }, ...],
    competitors: [{ url, domain, mobile, desktop }, ...]
  },
  pageSpeedComparison: [{ domain, mobileScore, desktopScore, isClient }, ...],
  coreWebVitals: {
    mobile: { performanceScore, lcp, fcp, cls, inp, ttfb, speedIndex, opportunities[] } | {},
    desktop: { ...same shape... } | {}
  },
  errors: [{ domain, strategy, code?, reason }],
  status: "success" | "partial" | "failed",
  gatheredAt: ISO timestamp
}
```

Per-strategy metrics shape (from `extractMetrics` lines 52-70):
- `performanceScore` — 0.0-1.0 (line 59).
- `lcp, fcp, ttfb, speedIndex` — `numericValue` in **milliseconds**.
- `cls` — unitless, typically 0.0-0.5.
- `inp` — milliseconds (newer metric — many sites return `null` here).
- `opportunities[]` — only entries where `details.type === 'opportunity' && overallSavingsMs > 0`. Each is `{ title, id, savings }` rounded to ms. No description, no target URLs.

**Exit codes:** 0 on success/partial, 1 on fatal (no args, or main-catch error). Per-URL errors go to `errors[]`; script does NOT exit on individual PSI failures.

## 4. Annotated walk

**Lines 27-33 — setup.**
- Line 29: imports the shared `fetch-with-retry` utility (finding #1). Uses `Semaphore(2)` at line 30 — max 2 concurrent PSI calls across the entire script. Good — PSI's public burst tolerance is ~25 / 100s, and each URL triggers 2 calls (mobile + desktop).
- Line 33: Reads API key from either `PAGESPEED_API_KEY` or `GOOGLE_API_KEY`. Second is a legacy alias.

**Line 35 — `const errors = []`.** Module-level mutable array. Collects all per-URL errors across the run. Fine for single-process CLI; would be unsafe if this module were imported and run multiple times in the same process (e.g., tests), but it's not currently.

**Lines 37-41 — `mapPsiStatusCode`.** Handles 429 and 403 specifically with helpful messages; falls through to generic `PSI API error (HTTP X)` for everything else. 5xx gets the generic message — could be more specific ("PSI API server error — retry later"). Low stakes.

**Lines 43-50 — `fetchPSIJSON`.** Thin wrapper on the retry utility.
- `timeout: 90000` — 90 seconds. PSI mobile runs regularly take 30-60s for heavy sites; 90s is appropriate.
- `allowNon2xx: true` — the retry helper will NOT throw on 4xx/5xx, returning the body instead. Caller then inspects `body.error`. This pattern works here because PSI embeds errors in the JSON body at 200 AND non-200. But see §5 bug #8 — relies on retry utility returning body on non-2xx.

**Lines 52-70 — `extractMetrics(psiResponse)`.** Translates the bloated Lighthouse blob into a compact per-strategy object.
- Line 53-54: Short-circuits to `null` if `lighthouseResult` missing. `fetchPSI` already caught that case (line 91-94), but belt-and-braces here.
- Line 55: `perf = lhr.categories && lhr.categories.performance` — robust to missing categories object.
- Line 59: `perf ? perf.score : null` — score is 0-1. Note: script does NOT multiply by 100 or round; downstream (normalizer) does the display formatting.
- Lines 60-65: Direct lookups into `audits['<audit-id>']` with optional-chaining via `&&`. Matches Lighthouse v10+ audit ids.
- Lines 66-68: Opportunities filter. Only `details.type === 'opportunity'` AND `overallSavingsMs > 0`. Note: does NOT include `details.type === 'table'` audits (like render-blocking resources), which are a separate category. Several real optimization wins (e.g., "Eliminate render-blocking resources") ARE opportunity-typed, so this works. But "Reduce unused CSS" comes through as an opportunity, while "Minimize main-thread work" is a `debugdata`-typed diagnostic and gets dropped.

**Lines 72-75 — `domainFromUrl`.** `new URL().hostname.replace(/^www\./, '')`. On parse failure returns the raw URL string. Consequence: a malformed URL like `mattwallmow.com` (no scheme) yields `mattwallmow.com` as "domain" and is passed to PSI which will then 400. The error row will contain raw URL string as `domain` — visually identical to a real domain, may confuse the report.

**Lines 77-104 — `fetchPSI(url, strategy, domain)`.** The per-request orchestrator.
- Line 78-79: API URL construction. `&category=performance` is hardcoded — see §5 bug #3.
- Line 79: `encodeURIComponent(url)` is applied — safe.
- Line 81-103: Under semaphore's `run()`. Good hygiene — semaphore guarantees concurrency cap even under exceptions.
- Lines 84-95: Three failure branches.
  - 84-90: PSI returned a JSON body with `error` key. Extracts `code`, maps to message via `mapPsiStatusCode`, pushes to errors, returns null.
  - 91-95: PSI returned 200 but no `lighthouseResult`. Shouldn't happen often but possible for very slow cold-start origins.
  - 97-101: Network/retry-exhausted failure. `err.message === 'timeout'` check is a string match — brittle (depends on retry utility's exact error wording). Cross-reference finding #1 to confirm the utility emits `new Error('timeout')` specifically.
- Line 89-94 — per-error `console.error` warning. Good operator UX.

**Lines 106-111 — arg parsing.**
- Line 107: `args.filter(a => !a.startsWith('--'))` — drops every flag-like token, including the advertised `--urls urls.txt`. The `urls.txt` positional AFTER the flag would still survive but would be treated as a regular URL (and likely 400). Documentation/implementation mismatch (codex bug).
- Line 108-110: Exits 1 if no URLs. Reasonable.

**Lines 113-115 — partition.** First arg = client. Rest = competitors. `allUrls = [clientUrl, ...competitorUrls]`. Positional contract — no way to express "run these 3 as client pages, these 4 as competitors" — client is ALWAYS exactly one URL.

**Lines 118-122 — output path.** CWD-relative (same inconsistency as `extract-text.js`). `mkdir -p` with recursive flag.

**Lines 128-155 — the serialized loop.**
- Line 128-155: `for` loop with `await` — **sequential across URLs.** The semaphore caps concurrency at 2 INSIDE each URL (mobile + desktop run concurrently for ONE URL), but URLs themselves process one at a time. For 5 URLs × 2 strategies × ~45s/call = ~7.5 minutes best case. Could parallelize to ~2 minutes with a URL-level pool.
- Line 130: `isClient = (i === 0)` — positional contract solidified here.
- Lines 133-137: Double-fetch per URL.
- Lines 139-152: Push into the appropriate bucket + build comparison row.
- Line 148-151: **`pageSpeedComparison` row** — just the two scores + isClient flag. Does NOT include LCP, FCP, CLS, INP, etc. The report's per-competitor CWV details come from `data.competitors[i].mobile/desktop` which has full metrics; `pageSpeedComparison` is just the headline-score table.

**Lines 157-166 — status computation.**
- Line 162: `allEntries.every(e => e.mobile === null && e.desktop === null)` → `"failed"`. Reasonable: if literally no PSI call succeeded, it's a total failure.
- Line 165: Otherwise if there are any errors, `"partial"`. Even a single 429 on one competitor's mobile run flips status to `"partial"` — correct.
- **Missing case:** `allUrls` is populated but the loop didn't iterate (can't happen unless `allUrls` is empty, which would have exited at line 108). So every possible path is covered.

**Lines 168-179 — `coreWebVitals` aggregation.**
- Line 169: `const clientHome = clientPages[0] || {}`. Hard-wires to the first positional URL. **Any page beyond index 0 is invisible to `coreWebVitals`.** Scripts calling this with inner pages need to know the first arg = headline page. The skill's invocation at `seo-audit.md:692` (`{CLIENT_SITE_URL} {COMPETITOR_URLS_SPACE_SEPARATED}`) implicitly assumes `CLIENT_SITE_URL` is a single homepage URL — not guaranteed by the script.
- Line 177-178: `clientHome.mobile || {}` — empty object fallback. Downstream normalizer has to handle `coreWebVitals.mobile = {}` as "no data" (distinct from `{performanceScore: 0, lcp: 1200, ...}`).

**Lines 185-188 — write + summary.** Same non-atomic write pattern as other diagnostics.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 107, 10 | **Documented `--urls urls.txt` flag is NOT implemented.** Line 107 `args.filter(a => !a.startsWith('--'))` silently drops the flag. Operators following the header comment will pass a filename that gets stripped, then hit "Usage:" exit because no positional URLs remain. Silent UX failure. Either implement the flag or delete it from the header. |
| 2 | **H** | 113, 169 | **Positional-first-arg assumed to be homepage; binds the entire CWV headline.** `coreWebVitals.mobile`/`desktop` is unconditionally `clientPages[0]`. Running with e.g. `gather-pagespeed.js https://site.com/inner-page https://site.com/` makes the inner-page PSI run the "client CWV" in the report. No `--homepage` flag, no URL-path hint. Operator error invisible to the audit pipeline. |
| 3 | **M** | 79 | **Only `performance` category fetched.** `&category=performance` hardcoded. Lighthouse also produces `accessibility`, `best-practices`, `seo` categories — all useful for a holistic audit. The report already has an Accessibility section that currently has no data. Each additional category ~doubles PSI latency per request, so opt-in via `--categories=a11y,seo` is the right tradeoff. |
| 4 | **H** | — | **Old-version client drift.** `chris-nevada`, `laura-willis`, `liane-jamason` run a 198-line pre-retry-utility version (`https.get` directly, `sleep(3000)` between URLs, no semaphore, no exponential backoff, no per-request retry). On a 429, they record an error and move on — the subsequent URL gets NO retry even though PSI would have served it 70 seconds later. **Practical impact:** if an audit hits quota mid-run on the old version, every URL after the quota boundary fails silently; the new version retries through it. These three clients need their scripts re-copied from template. |
| 5 | **H** | — | **`calgary-castles` has NO `gather-pagespeed.js` at all.** Neither `clients/calgary-castles/scripts/` nor `Backup/calgary-castles/scripts/` contains the file. Yet `clients/calgary-castles/seo/research/pagespeed-data.json` exists — so his data came from somewhere (an earlier template version, a one-off run from a different directory, or manual hand-edit). Re-running his audit today would either error out or use one of the divergent paths. Needs template-copy + re-run. |
| 6 | **M** | 128-155 | **URL-level serialization.** The in-URL semaphore parallelizes mobile+desktop (2 calls per URL), but URLs themselves run one at a time. A 5-URL audit = ~7 minutes best case. A URL-level pool of 2 would cut it in half with no quota risk (2 URLs × 2 strategies = 4 concurrent = still under PSI's 25/100s ceiling). |
| 7 | **M** | 66-68 | **Opportunity filter misses valuable diagnostics.** Only `details.type === 'opportunity' && overallSavingsMs > 0`. Misses `details.type === 'table'` diagnostics like "render-blocking-resources" that ARE opportunities in practice. Also misses `details.type === 'debugdata'` where "main-thread work" appears. Expanding to include diagnostic types ≈ 3-5 more actionable recommendations per report. |
| 8 | **M** | 43-50, 98 | **String-match error detection.** `err.message === 'timeout'` (line 98) depends on the retry utility emitting that exact string. If the utility ever changes to `'Request timed out after 90000ms'`, this branch silently reports generic message. Cross-reference finding #1 to confirm current behavior. |
| 9 | **M** | 169 | **`coreWebVitals` is not sibling-aware.** If multiple client URLs are passed (currently impossible via skill, but possible via direct CLI), only `clientPages[0]` becomes CWV. The rest sit in `data.client[]` with no prominence. A site with a heavy marketing page and a lean product page will show only one — the one the operator happened to pass first. |
| 10 | **M** | 72-75 | **`domainFromUrl` swallows malformed URLs.** `new URL()` throws on unscheme'd strings → catch returns raw string. That raw string then fills `domain` in the output and in error rows. Example: passing `mattwallmow.com` instead of `https://mattwallmow.com/` yields `domain: "mattwallmow.com"` but PSI call fails; error row is present but looks like a real domain name. Partial mitigation: early-reject URLs that don't parse. |
| 11 | **M** | — | **Matt Wallmow spot-check anomaly.** Matt's `client-config.json` lists 5 competitors (redmanrealtygroup, eliasonrealty, pinepointrealty, **northwoodshomefinder**, shorewest). His `pagespeed-data.json` has 4 competitor entries — `northwoodshomefinder.com` is **absent with no error row**. Suggests the invocation command built by the skill dropped one competitor. Either the skill's variable-substitution for `{COMPETITOR_URLS_SPACE_SEPARATED}` truncates, or the competitor list was hand-edited down. Worth tracing the skill-level substitution (deep-dive #67 for `commands/seo-audit.md`). |
| 12 | **L** | 37-41 | **`mapPsiStatusCode` is coarse.** 429 and 403 get specific messages; everything else (500, 502, 503, 504, 408) falls through to generic. Codex flagged this too. |
| 13 | **L** | 185 | **Non-atomic write.** Crash mid-write → corrupt JSON. Cross-cutting pattern across all diagnostic scripts. |
| 14 | **L** | 64 | **`ttfb` audit naming misleading.** Uses `server-response-time` Lighthouse audit. In Lighthouse terms this IS server response time, which APPROXIMATES TTFB but is measured differently (no redirect/DNS time included). Documenting the mapping in the JSON's metrics glossary would help normalizer authors. |
| 15 | **L** | 63 | **INP often null in PSI output.** PSI sometimes omits `interaction-to-next-paint` for low-traffic URLs (field data unavailable). Output correctly records `null`; worth noting in normalizer so the report doesn't render "INP: null" — handoff/HANDOFF doesn't currently flag this. |
| 16 | **L** | 35 | **Module-level mutable state.** `const errors = []` is fine for CLI but would break if this module were imported multiple times. Style-level; not a current issue. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill, Step 5 at `seo-audit.md:692`:
  ```
  node scripts/gather-pagespeed.js {CLIENT_SITE_URL} {COMPETITOR_URLS_SPACE_SEPARATED}
  ```
- Matt Wallmow's audit-log shows it was run twice: first at `04:16` hit a 429 quota error, second at `04:22` succeeded with API key. Final output has 4 competitors instead of 5 — anomaly #11 above.
- No test harness invocation. No Python caller.

**Consumers of `pagespeed-data.json`:**

| Consumer | File:lines | Reads |
|---|---|---|
| `generate-multipage-report.js` normalizer | `template/reports/multipage/generate-multipage-report.js:593-626` | Hoists `coreWebVitals` to top-level, reshapes `lighthouseResults` from this file, normalizes `pageSpeedComparison` with `{domain, mobileScore, desktopScore}` → `{name, score}` mapping, stale-data detection, sets `lighthouseResults[]` fallback. |
| Normalizer stale-detector | `generate-multipage-report.js` (logic referenced in `HANDOFF.md:19, 34`) | When `technicalSeo.pageSpeedComparison` has all-identical competitor scores (stale copied-from-client pattern), falls back to THIS file's comparison. The mechanism is in HANDOFF but exact line deserves its own deep-dive (#21). |
| `technicalSeo.lighthouseResults` | `seo-audit.md:1216, 1231` | Mentioned as "auto-populated from `seo/research/pagespeed-data.json`". |
| `competitorAnalysis` block | `seo-audit.md:1196` | "from competitor-analysis.md + domain-metrics.json + pagespeed-data.json" — normalizer uses our PSI data for competitor score fallback. |

**Contract imposed on consumers:**
- `data.client[i].mobile.performanceScore` is 0-1 float. Normalizer must multiply by 100 for display.
- `pageSpeedComparison[i]` has `domain, mobileScore, desktopScore, isClient`. Normalizer renames `mobileScore` → `score` and uses `isClient` to mark the client row. **Exactly one** row should have `isClient: true`.
- `coreWebVitals.mobile | desktop` can be an empty object `{}` — downstream must guard. Matt's data has the full shape so this is tested; Calgary's data (from a missing-script run) may not.
- `errors[]` row shape is `{ domain, strategy, code?, reason }`. The normalizer's `propagateApiErrors` hook (finding #6 §6) processes this.

**Drift table:**

| Version | Lines | Retry | Semaphore | Delay | API key env | `--urls` flag |
|---|---|---|---|---|---|---|
| Template | 191 | ✅ (via fetch-with-retry) | ✅ (2) | N/A (retry handles) | ✅ | ❌ (documented, not implemented) |
| matt-wallmow | 191 | = template | = template | = template | = template | = template |
| chris-nevada | 198 | ❌ (raw https) | ❌ | ✅ 3000ms hardcoded | ✅ | = template |
| laura-willis | 198 | ❌ | ❌ | 3000ms | ✅ | = template |
| liane-jamason | 198 | ❌ | ❌ | 3000ms | ✅ | = template |
| **calgary-castles** | **—** | — | — | — | — | — (script absent) |
| Backup/calgary-castles | — | — | — | — | — | — (script absent) |

**Skill-inline:** no inline stub.

**Direct impact on live clients:**
- **matt-wallmow**: ran with template; PSI final data is clean (4 competitors + 1 client, no errors). ONE competitor (northwoodshomefinder.com) missing from output with no error row — §5 bug #11.
- **chris-nevada, laura-willis, liane-jamason**: running the old pre-retry version. If any of their next re-runs hit a 429, all subsequent URLs in the batch fail silently. Should be re-templated before re-auditing.
- **calgary-castles**: has PSI data from some prior run but no script to re-produce it. Re-audit would fail. Script needs restoration from template.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Re-template chris-nevada, laura-willis, liane-jamason.** Drop the old 198-line version; copy in the template. Purely mechanical, prevents silent quota-failure cascades on re-run.
2. **Restore `gather-pagespeed.js` in `clients/calgary-castles/`.** Either copy template or, if his last PSI data was from the older template variant, upgrade him too.
3. **Delete the phantom `--urls urls.txt` from the header comment** (or implement it). Header promises a feature that doesn't exist. Fastest dead-feature fix in the script.
4. **Add `--homepage <url>` flag** to make the CWV-headline page explicit instead of positional. Keep positional-first as default fallback. Solves bug #2 without breaking existing skills.
5. **Add `--categories=performance,accessibility,best-practices,seo`** (default: performance only, preserving behavior). Lets the Accessibility section of the report get real data without breaking current audits. Each extra category ~doubles request latency, so it must be opt-in.
6. **URL-level concurrency (pool size 2).** Halves audit time without risking quota (2 URLs × 2 strategies = 4 concurrent, still well under 25/100s). Cheap parallelism win.
7. **Trace bug #11 (missing northwoodshomefinder on Matt's output).** Likely a skill-level variable substitution bug in `commands/seo-audit.md` — when the site-crawler or orchestrator interpolates `{COMPETITOR_URLS_SPACE_SEPARATED}`, it may truncate at some count. Verify with a 5-competitor dry run.
8. **Expand opportunity filter to include table/debugdata diagnostics.** ~3-5 more actionable recommendations per page. Minor code change (~5 lines in `extractMetrics`).
9. **Reject malformed URLs early.** Pre-validate with `try { new URL(u) }` at the top of `main()`. Exit 1 with a specific message rather than passing the raw string to PSI and spending a request cycle on a certain 400.
10. **Pre-validate API key presence and warn.** If no `PAGESPEED_API_KEY` and no `GOOGLE_API_KEY`, stderr a "running without key — rate-limited" warning. Currently silent; operators don't know they're about to hit 429 until it happens.
11. **Atomic write** (shared fix across diagnostics).
12. **Map more HTTP codes in `mapPsiStatusCode`** — 500, 503, 504 deserve "PSI server error — retry later" message.

## 8. What to verify before we touch this file

- **Trace the skill-level competitor-list substitution** — find where `{COMPETITOR_URLS_SPACE_SEPARATED}` gets filled in (likely the orchestrator agent prompt around `seo-audit.md:400-500`). A truncation bug there would explain Matt's missing northwoodshomefinder.
- **Verify `fetch-with-retry` timeout error message** (finding #1) — bug #8 in this finding assumes `err.message === 'timeout'` exactly. If the util emits a different string, our error mapping is silently generic.
- **Check whether the old-version clients have ever been re-audited since template changed** — if not, their existing `pagespeed-data.json` may have shape/key differences that could confuse the normalizer. Spot-check `chris-nevada/seo/research/pagespeed-data.json` schema against Matt's.
- **Calgary data provenance** — her `pagespeed-data.json` exists without a script. Before upgrading, open the file and check for any field shape that doesn't match current template output — may reveal an even older variant that the normalizer's backward-compat paths currently accommodate.
- **Confirm normalizer behavior when `coreWebVitals.mobile === {}`** (empty object, not null, not shape). Test coverage for "no PSI data at all" is important before touching this script.
- **Before adding `--categories`, check normalizer code paths** — `technicalSeo.accessibilityResults` may or may not have a reserved field. If the normalizer has a "no a11y data yet" branch, we need to integrate cleanly.
