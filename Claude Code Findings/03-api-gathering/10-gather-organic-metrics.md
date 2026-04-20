# Deep Dive #10 — `template/scripts/gather-organic-metrics.js`

**File:** [`template/scripts/gather-organic-metrics.js`](/root/site-audit/template/scripts/gather-organic-metrics.js) (173 lines)
**Layer:** 03 — API / data gathering (DataForSEO Labs `/dataforseo_labs/google/ranked_keywords/live`)
**Cross-reference:** [`codex findings/02-data-gathering/10-gather_organic_metrics.md`](/root/site-audit/codex findings/02-data-gathering/10-gather_organic_metrics.md)
**Template-vs-client drift:** **YES — same three-client old cohort (laura-willis, liane-jamason, chris-nevada) at 198 lines; matt-wallmow matches template; calgary-castles missing entirely (no script, no data JSON).** See §6.
**Template-vs-skill drift:** No inline stub. Invoked at `seo-audit.md:704`.
**Date:** 2026-04-20

---

## 1. Purpose

Fetches ranked-keywords summary from DataForSEO Labs for client + competitors. For each domain, queries the top 100 keywords the domain ranks for, captures each keyword's estimated traffic (`etv`), search volume, position, and landing URL, sums per-domain traffic, and emits `seo/research/organic-metrics.json`.

Critically, this script is the **fill-path for the permanent-null fields in `gather-domain-metrics.js`** (finding #8 bug #2). The normalizer at `generate-multipage-report.js:1799-1881` reads this file's `organicKeywords` and `organicTraffic` and merges them into `domainMetrics.client` / `domainMetrics.competitors` when those fields are null. Without this script, the Competitors page has no organic keyword/traffic numbers.

Data contract flows:
1. `gather-domain-metrics.js` → `domain-metrics.json` (with organicTraffic/Keywords = null)
2. `gather-organic-metrics.js` → `organic-metrics.json` (with real values)
3. Normalizer merges 2 → 1 via URL match at render time

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<client-domain>` | positional #1 | — required | `isClient = true` |
| `[competitor-domain ...]` | positional #2+ | — | Each gets a row |

**Env vars:** `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`.

**Hardcoded DFS params (payload line 80-82):**
- `location_code: 2840` — **United States**. Not parameterizable.
- `language_code: 'en'` — **English**. Not parameterizable.
- `limit: 100` — top 100 ranked keywords per domain.

**Network:** `https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live` (line 27 + 84).

## 3. Outputs

Written to `seo/research/organic-metrics.json` (line 157, CWD-relative).

```
{
  data: [{
    domain,
    organicKeywords,    // ← TRUE TOTAL (from result.total_count; fallback to items.length)
    organicTraffic,     // ← CAPPED TOTAL (sum of top-100 items only)
    topKeywords: [{ keyword, volume, position, traffic }],  // top 10 by traffic
    isClient
  }],
  errors: [{ domain, code?, reason }],
  status: "success" | "partial" | "failed",
  gatheredAt: ISO
}
```

**Crucial inconsistency:** `organicKeywords` is the domain's ACTUAL ranked-keyword count (pulled from DFS's `total_count` at line 100-101). `organicTraffic` is the SUM OF `etv` ACROSS TOP 100 ONLY (lines 102, 108-109). A domain ranking for 61,000 keywords has `organicKeywords: 61000` but `organicTraffic` reflecting only the top 100 — significantly under-represents a long-tail-heavy site. Example from Matt's data: shorewest.com shows 61,333 keywords with 22,733 traffic; the full-site traffic is almost certainly higher.

**Exit codes:** 0 on success/partial, 1 on missing creds or empty args.

## 4. Annotated walk

**Lines 22-27 — setup.**
- Line 24: `postJson` only — **no Semaphore import and doesn't need one** (sequential loop, line 72).
- Line 27: `/dataforseo_labs/google/ranked_keywords/live` — fixed endpoint.

**Lines 28-36 — `dfsPost`.** Same wrapper pattern as gather-domain-metrics / gather-backlinks. `timeout: 60000` (60s).

**Lines 38-42 — `toNumberOrNull(value)`.** Utility: null/empty/NaN → `null`, else number. Good defensive pattern; used at lines 100, 108, 113, 114.

**Lines 44-52 — `nullEntry(domain, isClient)`.** Null-fields skeleton. Same pattern as gather-domain-metrics (line 38-48). **Note: `topKeywords: []` (empty array, not null)** — consumer expects an array, not null, so iterators don't blow up on failed domains.

**Lines 54-67 — credential + arg guards.** Standard.

**Lines 72-144 — main domain loop. Sequential, no concurrency.**

- **Line 78-83 — the DFS payload.**
  - `location_code: 2840` — US.
  - `language_code: 'en'`.
  - `limit: 100`.
  - **All three hardcoded.** No CLI flag, no config file read, no env var. For a Canadian client, we ask DFS what keywords they rank for IN THE US MARKET. That is often useful (spill-over), but not what the audit promises when the client is in Calgary or Toronto. Codex flagged this as weakness #1.
- Line 85-87: standard task extraction. `resp.tasks[0].result[0]` unwrap.
- Lines 90-98: error path. One branch for every way DFS can fail. `reason` composition is defensive: no-task vs status!=20000 vs empty-items each gets a specific message.
- **Line 100-101: `organicKeywords` computation.**
  ```js
  const totalCount = toNumberOrNull(result.total_count);
  const organicKeywords = totalCount != null ? totalCount : items.length;
  ```
  **This is honest.** `total_count` is DFS's reported full count. Falls back to `items.length` (≤100) only if DFS doesn't report totals. Unlike gather-backlinks.js where `totalBacklinks` is always fetched-count, this field is true-total.
- **Lines 102-118: per-item extraction + traffic summation.**
  - Line 108: `traffic = toNumberOrNull(serpItem.etv) || 0` — null/negative `etv` → 0. Contributes 0 to `organicTraffic`. Slight deflation bias: DFS sometimes returns null `etv` on low-data keywords; those keywords contribute 0 here. More accurate would be to skip (keep the row, don't add to traffic). Edge case.
  - **Line 109: `organicTraffic += traffic`** — cumulative sum ONLY of the items in the response (max 100). `organicTraffic` is capped.
  - Lines 111-117: per-keyword row build. `volume` from `keyword_info.search_volume`, `position` from `rank_group`.
- Lines 120-129: `topKeywords` = top 10 by traffic. Drops the `url` field from the top-10 subset (only keyword, volume, position, traffic). Full URL is only available inside the loop, not in output. Potential loss of info — a downstream "which page ranks for which keyword" mapping cannot be derived from this file alone.
- Line 131-137: push the full record.

- **Lines 139-143 — catch block.** Clean: push `nullEntry`, add error row.

**Lines 146-153 — status.**
- `errors.length === 0` → success.
- Every `organicKeywords === null` → failed.
- Else → partial.
- Consistent with siblings.

**Lines 155-167 — write.** Same CWD-relative, non-atomic pattern.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 80, 81 | **Hardcoded `location_code: 2840` (US) and `language_code: 'en'`.** Canadian / UK / non-English clients get US-English keyword data. Codex #1. Matt (Rhinelander WI), Liane (Tampa FL), Laura, Chris Nevada — all US-based, so this script returns sensible data for them. Calgary Castles is in Canada; that client currently has no organic-metrics.json (script + data both missing), so the bug hasn't manifested yet, but any new Canadian / British / French audit would silently get US-English data. Should be pulled from `client-config.json` — that file already has `location` and could add `locationCode` + `languageCode`. |
| 2 | **H** | 102, 108-109 | **`organicTraffic` is capped at top-100 items; labeled as if it were the true total.** Sums `etv` only across the returned items (≤100 per DFS request). Shorewest's 61,333 keywords returns 22,733 traffic — but that's the traffic of the top 100 keywords, not total organic traffic. Under-reports long-tail-heavy sites by 2-10x. **`organicKeywords` IS true total (line 100-101), so the two fields have inconsistent completeness.** Downstream normalizer fills `domainMetrics.organicTraffic` with this capped value. |
| 3 | **M** | — | **Three-client cohort drift — same old-pattern as #7, #8.** `chris-nevada`, `laura-willis`, `liane-jamason` run 198-line forks: raw `https.request()`, hardcoded `REQUEST_DELAY_MS = 2000`, manual `sleep()`. No retry on 429/5xx. **Pattern now confirmed across gather-pagespeed, gather-domain-metrics, gather-organic-metrics.** These three clients are a full generation behind on ALL DFS/PSI gathering scripts. Bulk re-template needed. |
| 4 | **M** | — | **Calgary-castles missing both the script AND the data file.** No `gather-organic-metrics.js` in her scripts dir, no `organic-metrics.json` in her research dir. She has no organic keyword data at all. Third script-missing for this client (also gather-pagespeed.js, gather-backlinks.js). Consistent pattern: calgary was audited on an older template that didn't include these scripts. |
| 5 | **M** | 82 | **Hardcoded `limit: 100`.** No `--limit` flag. High-volume clients (e.g., national retailers) lose deep long-tail visibility. Cheap fix: accept `--limit N` (DFS allows up to 1,000 per call). |
| 6 | **M** | 73-74 | **Positional-first-arg client.** Same pattern as siblings — operator error silent. |
| 7 | **M** | 115, 124-128 | **`url` field captured per-item but dropped from `topKeywords`.** The top-10 output excludes `url`, so "which landing page ranks for this traffic keyword" is ONLY known inside the full `items` iteration, and `items` isn't in the output. The renderer on Keywords page can show top keywords but cannot link each to a landing page without re-fetching. Minor product gap; one-line fix in the `.map` on line 124. |
| 8 | **M** | 72-144 | **Sequential loop, no concurrency.** 6 domains × ~3-10s per DFS call = 20-60s. Could parallelize with Semaphore(2 or 3) at minimal quota risk (DFS quota is per-account, not rate-per-second heavy). Codex #3. |
| 9 | **L** | 108 | **Null `etv` treated as 0.** `toNumberOrNull(...) || 0` — if DFS returns null etv, contributes 0 to traffic and a 0-traffic row in `topKeywords`. The row then competes with real-traffic rows in the top-10 sort, but sort is stable so it falls to the bottom naturally. Minor bias. |
| 10 | **L** | — | **No provenance in output.** Doesn't record which `location_code` / `language_code` / `limit` were used. If defaults change later, old data is ambiguous. Add an `options` sidecar object to the output. |
| 11 | **L** | 159-164 | **Non-atomic write.** Cross-cutting. |
| 12 | **L** | 62 | **`args.filter(a => !a.startsWith('--'))`** — drops all flags, no `--limit` or `--location` supported. Same pattern as siblings. |
| 13 | **L** | 108 | **Potentially duplicate keyword rows not deduplicated.** DFS can return a keyword-by-URL breakdown where the same keyword appears multiple times (one per ranking URL). Script adds them all. In practice DFS's `ranked_keywords` returns one row per keyword-SERP-position, so this is rare but possible. Code doesn't guard. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill, Step 5 at `seo-audit.md:704`:
  ```
  node scripts/gather-organic-metrics.js {CLIENT_DOMAIN} {COMPETITOR_DOMAINS_SPACE_SEPARATED}
  ```
  Single invocation, all domains in one call.
- Matt Wallmow: `[04:19]` audit-log line `organic-metrics.json ✓ (client: 81 keywords, 66 traffic)`. Clean run.

**Consumers of `organic-metrics.json`:**

| Consumer | File:lines | Reads |
|---|---|---|
| `generate-multipage-report.js` normalizer | `:1799-1881` | Merges `organicKeywords` + `organicTraffic` into `data.domainMetrics.client` + `data.domainMetrics.competitors` if those fields are null (fills gather-domain-metrics's permanent-null fields). |
| `pages/keywords.js` | `:174` | Error-message path only — references this script name for operator error text. Does NOT read data. |
| `pages/competitors.js` | (indirect via normalizer merge) | Reads the merged `domainMetrics` fields for competitor profile cards. |
| **NOT** `build_audit.py` | — | No Python consumer. |
| **NOT** `populate-audit-data.js` | — | Doesn't reference organic-metrics. |

**Contract:**
- `data[i].organicKeywords` is a numeric total (true) or null.
- `data[i].organicTraffic` is a numeric capped-sum (top-100) or null. **Name implies true total but value is capped** — the normalizer presents it as if total, per bug #2.
- `topKeywords[0..9]` sorted by traffic desc. Each is `{keyword, volume, position, traffic}` — no `url`.
- `isClient` — one row true.

**Drift table:**

| Version | Lines | Retry | Delay | Transport | Status |
|---|---|---|---|---|---|
| Template | 173 | ✅ (fetch-with-retry) | N/A | `postJson` | current |
| matt-wallmow | 173 | = template | = template | = template | Matches exactly |
| chris-nevada | 198 | ❌ | 2000ms hardcoded | raw `https.request()` | Old cohort |
| laura-willis | 198 | ❌ | 2000ms | Raw | Old cohort |
| liane-jamason | 198 | ❌ | 2000ms | Raw | Old cohort |
| **calgary-castles** | — | — | — | — | **MISSING SCRIPT + MISSING DATA** |

**Skill-inline:** no stub.

**Direct impact on live clients:**
- **matt-wallmow**: clean data. 6 rows, all with `organicKeywords` true-total and `organicTraffic` top-100-sum. Shorewest's 61,333 kw / 22,733 traffic is capped in traffic; renderer treats it as total.
- **chris-nevada, laura-willis, liane-jamason**: old cohort. Their organic data exists but any retry hit would fail silently (no retry logic).
- **calgary-castles**: has NO organic-keyword data. Her Competitors page cannot show keyword/traffic columns populated from this source — whether those columns are blank or filled from an alternate path (e.g., competitorAnalysis markdown parsed by populate-audit-data.js) needs verification.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Parameterize location/language from client-config.json.** Read `client-config.json` if present; add `locationCode` + `languageCode` fields (default 2840/`en`); fallback to hardcoded if config missing. This single change unblocks ALL non-US clients without breaking existing US flows. Biggest blast-radius fix.
2. **Fix `organicTraffic` completeness** (bug #2). Three options:
   - (a) Rename `organicTraffic` → `top100Traffic`, add new `organicTrafficTotal` from a separate DFS call to `domain_rank_overview/live` (the endpoint that returns site-level totals). +1 DFS call per domain = ~$0.01 each.
   - (b) Accept `--limit 1000` and re-sum (partial — still capped at 1000).
   - (c) Fetch `total_count` metadata and extrapolate (imprecise).
   - Option (a) is the most honest and aligns with the fix path for gather-backlinks #4.
3. **Re-template the three-client old cohort** — chris-nevada, laura-willis, liane-jamason. Same bulk operation as outlined in gather-pagespeed.js #7 and gather-domain-metrics.js #7.1. Do all `gather-*.js` scripts in one PR.
4. **Restore calgary-castles's script** (template-copy after fix #1). Runs her first organic audit — unlocks Competitors page's organic data for her.
5. **Add `url` to `topKeywords`** (bug #7). One field in the `.map` on line 124. Opens up "top ranking landing pages" analysis on Keywords page.
6. **Expose `--limit N`** (bug #5). Default 100, max 1000 per DFS quota. Cost-gate warning for high limits.
7. **Add `options` provenance sidecar** to output (bug #10). `{locationCode, languageCode, limit}`. Helps future data validation.
8. **Parallelize with Semaphore(3)** once template is healthy (bug #8). Minor speed win.
9. **Atomic write.**
10. **Dedupe by `(keyword, url)` before summing traffic** (bug #13). Defensive; low-probability but harmless guard.

## 8. What to verify before we touch this file

- **Check `client-config.json` schema** on all existing clients. Does anyone already have a `locationCode` field? If so, we want to reuse their naming. Also verify calgary-castles's config has a location we can map — her file has "Calgary, AB, Canada" in `location` field.
- **Verify DFS `location_code` mapping** — fix #1 requires a lookup for `"Calgary, AB, Canada"` → DFS code 2124, etc. DFS publishes this list; a small constant map would serve the current client base.
- **Check the normalizer's merge logic at `gen-multipage:1799-1881`** BEFORE renaming `organicTraffic` (fix #2a). The normalizer reads `organicTraffic` directly; renaming breaks the merge silently unless both sides update.
- **Confirm calgary-castles's Competitors page currently renders** — if `organicKeywords`/`organicTraffic` are blank on her report today, we need to know before "adding" the script to her folder will look like regression or improvement.
- **Spot-check the three old-cohort clients' existing organic-metrics.json** for completeness/sanity. If any looks truncated or wrong, bulk re-run is the right call regardless.
- **Confirm `limit: 100` is the DFS default or a deliberate cap** — if we can raise it cheaply (no proportional cost increase), that changes the cost math for fix #6.
