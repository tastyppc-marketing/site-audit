# Deep Dive #8 — `template/scripts/gather-domain-metrics.js`

**File:** [`template/scripts/gather-domain-metrics.js`](/root/site-audit/template/scripts/gather-domain-metrics.js) (126 lines)
**Layer:** 03 — API / data gathering (DataForSEO `/backlinks/summary/live`)
**Cross-reference:** [`codex findings/02-data-gathering/08-gather_domain_metrics.md`](/root/site-audit/codex findings/02-data-gathering/08-gather_domain_metrics.md) (pre-stager summarized)
**Template-vs-client drift:** **YES — same three-client cohort (`chris-nevada`, `laura-willis`, `liane-jamason`) runs an older 149-line raw-https version.** See §6. Matching the cohort from finding #7 confirms a systemic drift generation — these three clients predate the fetch-with-retry migration across *all* DFS/PSI scripts.
**Template-vs-skill drift:** No inline stub — invoked at `seo-audit.md:698`.
**Date:** 2026-04-20

---

## 1. Purpose

The backlink authority data gatherer. Calls DataForSEO's `/backlinks/summary/live` endpoint for one client domain + N competitor domains, normalizes the response into a flat per-domain record, writes to `seo/research/domain-metrics.json`. Downstream, this is the primary feed for:

- The **competitor profile cards** on the Competitors page (`data.domainMetrics`, consumed at `pages/competitors.js:449-451`).
- The **domain-metrics comparison table** on the Competitors page (normalized at `generate-multipage-report.js:1721-1750`).
- Keyword/traffic context on the **Keywords page** (`pages/keywords.js:160`).
- Backlink-opportunity flagging — if `domainRating` is missing, the opportunity renderer flags missing DFS data (`pages/backlink-opportunities.js:2101`).
- Python `backlinks.py:81-92` analyzer's `_fetch_domain_metrics` also pulls DFS directly via the connector (`connectors/dataforseo.py:904-916`) — so the Python path does NOT use this JSON file.

**Two paths populate `domainMetrics`:** (a) this script → `domain-metrics.json` → normalizer; (b) Python `backlinks.py` → audit-data.json `backlinks.competitorDomainMetrics` directly. The normalizer prefers the JSON file (with `gatheredAt`) and falls back through `backlinks.competitorDomainMetrics` → `competitorAnalysis.domainMetricsComparison` → file-without-timestamp (HANDOFF.md auto-fix #10).

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<client-domain>` | positional #1 | — **required** | **Defines "isClient"** — first arg is marked client, rest are competitors. |
| `[competitor-domain ...]` | positional #2+ | — | Each gets a separate DFS call. |

**Env vars:**
- `DATAFORSEO_LOGIN` (line 51) — **required**.
- `DATAFORSEO_PASSWORD` (line 52) — **required**. Script exits 1 if either missing.

**Files read:** None.
**Network:** `https://api.dataforseo.com/v3/backlinks/summary/live` (line 26 + 75).
**Cost per call:** ~$0.01 USD (DFS live backlinks summary). 6 domains ≈ $0.06.

## 3. Outputs

Written to `seo/research/domain-metrics.json` (line 119, CWD-relative).

```
{
  data: [
    { domain, domainRating, referringDomains, backlinks,
      organicTraffic, organicKeywords, trafficValue,
      brokenBacklinks, isClient }
  ],
  errors: [{ domain, code?, reason }],
  status: "success" | "partial" | "failed",
  gatheredAt: ISO timestamp
}
```

**Three fields are always `null`** by design (lines 93-95): `organicTraffic`, `organicKeywords`, `trafficValue`. The `/backlinks/summary` endpoint doesn't return traffic data — that's a different DFS endpoint (`/dataforseo_labs/amazon/domain_rank_overview` or similar). Script promises the fields in schema, can't fill them. See §5 bug #2.

**Exit codes:** 0 on success/partial, 1 on missing credentials or empty args.

## 4. Annotated walk

**Lines 22-36 — setup.**
- Line 24: imports the shared `postJson` from `./lib/fetch-with-retry` (finding #1). Consistent with gather-pagespeed.js and gather-backlinks.js (template version).
- Line 26: DFS v3 base URL hardcoded. Fine.
- Lines 28-36: Auth wrapper. Basic auth via Buffer → base64. `timeout: 60000` (60s, reasonable for DFS live endpoints). The `.then(response => response.body)` unwraps the retry utility's wrapper and throws away `statusCode`/`headers` — info-loss but matches how DFS communicates success through JSON body `status_code` field anyway (see below).

**Lines 38-48 — `NULL_ENTRY`.** Factory for a skeleton record with all fields `null` except `domain` and `isClient`. Good defensive design: every entry in `results[]` has the same shape whether the DFS call succeeded or failed. Normalizers downstream can `data.forEach` safely.

**Lines 50-56 — credential guard.** Good: fails fast with a specific error message.

**Line 58 — arg parsing.** `args.filter(a => !a.startsWith('--'))` — strips all flags (same pattern as gather-pagespeed). No flags to implement here.

**Lines 64-67 — partition.** Flat arrays for results + errors.

**Lines 69-105 — the loop.** Sequential across domains.

- Line 71: `isClient = (i === 0)` — positional contract.
- Line 75: DFS call. Payload is `[{ target: domain }]` — DFS uses array wrapper for batch submission (here always 1-entry batch). Could be fanned-out to batch all domains in one request — DFS supports it; current script doesn't leverage it. See §5 bug #6.
- Lines 76-85: **Three-layer response validation.**
  - `resp.tasks` present and non-empty.
  - `task.status_code === 20000` (DFS success code; all other codes are failures).
  - `task.result && task.result[0]` — at least one result row.
  - If any layer fails, `errors.push({domain, code, reason})`, push `NULL_ENTRY`, continue to next domain.
- Line 79: `reason = task ? task.status_message : 'No task returned'`. If DFS returns a `task` with non-20000 code, `status_message` is their human-readable message like `"Login failed"`. Good error surfacing.
- Line 87-98: **Success extraction.**
  - `r.rank || 0` → `domainRating`. **Scale issue:** DFS `rank` is integer 0-1000 (per DFS API docs: "rank of the target domain 0-1000, based on the quantity and quality of backlinks"). Ahrefs-style DR is 0-100. The field is named `domainRating` — a brand-agnostic term — but in Matt's data, `shorewest.com` has rank 356 vs `mattwallmow.com` rank 37 (the `37` looks like Ahrefs DR but is actually DFS rank in 0-1000). The `37`/`356` scale mismatch is invisible on the Competitors table if all rows use DFS rank consistently, but any comparison against "industry-standard DR" in explanatory copy is apples-to-oranges. See §5 bug #3.
  - `r.referring_domains || 0` → `referringDomains` — straight map.
  - `r.backlinks || 0` → `backlinks` — straight map.
  - `r.broken_backlinks || 0` → `brokenBacklinks` — Matt's data: shorewest 11051, eliasonrealty 492, others 0. Useful.
  - Lines 93-95: `organicTraffic`, `organicKeywords`, `trafficValue` forced `null`. Endpoint doesn't provide them. See §5 bug #2.
- Line 99: `console.error` summary — operator UX.
- Lines 100-104: catch block — uniform `NULL_ENTRY` push + error row. Consistent with the no-task path.

**Lines 107-115 — status.**
- `errors.length === 0` → `"success"`.
- Every row has `domainRating === null` → `"failed"`.
- Else → `"partial"`.
- Note: `results.every(r => r.domainRating === null)` works even when `r.domainRating === 0` — `0 === null` is false. Correct.

**Lines 117-123 — write.** Same CWD-relative, non-atomic, `mkdir -p` pattern.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Three-client cohort drift: `chris-nevada`, `laura-willis`, `liane-jamason` run a 149-line pre-retry-utility version.** They use raw `https.request()` + manual `Content-Length` serialization + hardcoded `await sleep(1500)` between domains. No retry on 429/5xx, no structured timeout handling. A single transient DFS 5xx drops that competitor's data and proceeds. **Same cohort as gather-pagespeed.js bug #4.** These three clients' entire 03-api-gathering layer is a generation behind — re-templating needed sitewide, not just one script. |
| 2 | **H** | 93-95 | **Three output fields are permanently null by endpoint choice.** `organicTraffic`, `organicKeywords`, `trafficValue` are in the schema but the endpoint can't fill them. The fields get consumed downstream (`pages/keywords.js:160` reads `data.backlinks.domainMetrics` which flows from here). **False completeness illusion:** a downstream test of "do we have organic traffic data?" checking field presence will return yes, even though the value is always null. Fixes: (a) remove the fields entirely (requires schema negotiation with normalizer + renderers), OR (b) add a second DFS call to `/dataforseo_labs/google/domain_rank_overview/live` or similar endpoint that returns organic traffic. Codex called this out. |
| 3 | **H** | 90 | **`domainRating` field name misleading — value is DFS `rank` (0-1000), not Ahrefs-style DR (0-100).** Matt's data shows `mattwallmow.com: 37` next to `shorewest.com: 356`, visible in the Competitors comparison table. If the report's copy or tooltip describes "domain rating" as if 0-100 (industry convention), the 356 value is confusing. If the copy/tooltip uses the raw value with no scale callout, users don't know whether their competitor's 356 is good or bad. Fix: either scale-normalize (0-1000 → 0-100), or rename the field `dfsRank` and add explicit scale context in the renderer. |
| 4 | **M** | 65, 71 | **Positional-first-arg client.** Same pattern as gather-pagespeed. `isClient = (i === 0)` hard-wires the contract. If the operator reorders CLI args (client passed second), the report treats the competitor as client silently. No `--client` flag. |
| 5 | **M** | 75 | **Single endpoint coverage.** Only calls `/backlinks/summary/live`. DFS also offers `/backlinks/history/live` (90-day RD/backlink trend), `/backlinks/referring_networks/live` (network concentration — C-class IP distribution), `/backlinks/pages_summary/live` (per-page breakdown). Current script produces enough for the comparison table but not enough for "competitor is stockpiling links in network X" or "client's RD growth is flat." |
| 6 | **M** | 69-75 | **Sequential domain loop; DFS supports batch.** The endpoint accepts an array payload — `[{target: d1}, {target: d2}, ...]` — returning a `tasks[]` array. Submitting one batched request for all domains would be 1 API call and ~1 unit of timeout budget, vs N calls today. Would dramatically accelerate 10+ competitor audits. |
| 7 | **M** | 66-67, 35 | **Module-level mutable `errors` was avoided here** (line 67 is function-local — good, different from gather-pagespeed.js). **But** — the single-shot Promise chain in `dfsPost` (line 28-36) discards response headers. If DFS ever returns rate-limit headers (`X-Dfs-Quota-Remaining` or similar), we're blind. Not a current bug, but would prevent proactive quota monitoring later. |
| 8 | **M** | 28-36 | **Auth is passed as a plaintext string through the call stack.** `auth` = `"${login}:${password}"` on line 64, then base64'd inside `dfsPost` on line 31. If a crash dumps `args`/`auth` to a log, the creds leak in plaintext. Not currently logged, but should be scrubbed in any future error-telemetry hookup. |
| 9 | **L** | 78 | **`task.status_code !== 20000` is the only success check.** DFS success codes include 20100 ("Task created") for async endpoints, though this IS the live endpoint so 20000 is correct. Worth commenting in the code so maintainers don't "fix" it by accepting 2xxxx wildly. |
| 10 | **L** | 90-92 | **`|| 0` on rank/referring_domains/backlinks.** A legit 0 rank (brand-new domain) becomes `0`, indistinguishable from "DFS returned null." Cosmetic, low impact. |
| 11 | **L** | 121 | **Non-atomic write.** Cross-cutting pattern. |
| 12 | **L** | 11 | **Header advertises env vars in a comment only.** No runtime hint to operator about where to set them. A one-line `console.error` suggesting `export DATAFORSEO_LOGIN=... DATAFORSEO_PASSWORD=...` on the creds-missing path would help. |
| 13 | **L** | — | **No dry-run mode.** Every invocation costs money. A `--dry-run` that prints the payloads without calling DFS would help during skill development. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill, Step 5 at `seo-audit.md:698`:
  ```
  node scripts/gather-domain-metrics.js {CLIENT_DOMAIN} {COMPETITOR_DOMAINS_SPACE_SEPARATED}
  ```
- Matt Wallmow: run at `[04:17]` then refreshed at `[04:19]` with 6 domains (1 client + 5 competitors). Second run success (per audit-log).
- No test harness.

**Consumers of `domain-metrics.json`:**

| Consumer | File:lines | Reads |
|---|---|---|
| `generate-multipage-report.js` normalizer | `template/reports/multipage/generate-multipage-report.js:1721-1750` | Preferred source when `gatheredAt` present. Fallback chain → `backlinks.competitorDomainMetrics` → `competitorAnalysis.domainMetricsComparison` → file-without-timestamp. Logs "Using domain-metrics.json (API data)". |
| `pages/competitors.js` | `template/reports/multipage/pages/competitors.js:449-451` | Reads `data.domainMetrics` (client + competitors) for profile cards: DR, RD, backlinks. |
| `pages/keywords.js` | `template/reports/multipage/pages/keywords.js:160` | Reads `data.backlinks.domainMetrics` OR `data.domainMetrics.client` for organic-context panels. |
| `pages/backlink-opportunities.js` | `template/reports/multipage/pages/backlink-opportunities.js:2101` | Guards missing-DFS-data flag on `data.backlinks.domainMetrics.domainRating`. |
| **NOT** `build_audit.py` (directly) | — | Python takes a different path: `backlinks.py:81-92` calls DFS via `connectors/dataforseo.py:904-916` → populates `audit-data.json` directly. Two data paths converge in the normalizer. |

**Contract imposed on consumers:**
- `data[i].isClient` must have exactly one `true`, rest `false`. Normalizer does not check (would silently accept 2 client rows).
- `data[i].domainRating` is a number OR null. Renderers must handle both. Scale is **DFS rank (0-1000)**, not Ahrefs DR — see bug #3.
- `data[i].organicTraffic/Keywords/trafficValue` are null-by-endpoint. Any consumer expecting values needs a different data source.
- `errors[]` shape: `{ domain, code?, reason }` — consistent with other gather scripts.

**Drift table:**

| Version | Lines | Transport | Retry | Delay | Cohort note |
|---|---|---|---|---|---|
| Template | 126 | `postJson` (fetch-with-retry) | ✅ | N/A | current |
| matt-wallmow | 126 | = template | = template | = template | Matches template exactly |
| chris-nevada | 149 | Raw `https.request()` | ❌ | 1500ms hardcoded | "old cohort" — same pattern as their gather-pagespeed.js |
| laura-willis | 149 | Raw | ❌ | 1500ms | old cohort |
| liane-jamason | 149 | Raw | ❌ | 1500ms | old cohort |
| **calgary-castles** | — | — | — | — | Script present? To verify if needed — but calgary was missing gather-pagespeed.js entirely — check before next bulk re-template. |
| Backup | (matches respective clients) | | | | |

**Skill-inline:** no stub.

**Direct impact on live clients:**
- **matt-wallmow**: template version, clean run. `domain-metrics.json` has 6 domains, `status: "success"`, no errors. Values look right within the DFS-rank scale.
- **chris-nevada, laura-willis, liane-jamason**: old-cohort version. Practical risk = silent per-domain failures if DFS sneezes during their next audit. Plus they have no way to incorporate the eventual `/backlinks/history/live` enhancement without drifting further.
- **No client has data-corruption risk from this script's bugs TODAY**, but the null-traffic-field illusion (#2) and the DR-scale confusion (#3) affect every current report's Competitors page interpretation.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Re-template chris-nevada, laura-willis, liane-jamason for the ENTIRE gather-*.js script set.** This cohort drift spans gather-pagespeed, gather-domain-metrics, gather-backlinks (probably), gather-organic-metrics, gather-keyword-volumes. Drop-replace all old-cohort scripts with current template in one pass. Single operation, eliminates a whole class of latent bugs.
2. **Scale-normalize `domainRating` (bug #3).** Two options:
   - (a) Rename to `dfsRank` internally; update normalizer + competitors.js + keywords.js + backlink-opportunities.js to use the new name; renderer shows "DFS Rank" with "0-1000 scale" tooltip. Honest, minimal change.
   - (b) Multiply/divide to remap to 0-100; keep name `domainRating`. Deceives users who know it's DFS but looks familiar. I'd pick (a).
3. **Remove or backfill the three permanent-null fields (bug #2).**
   - If backfilling: add one more DFS call per domain to `/dataforseo_labs/google/domain_rank_overview/live` (cheap) to populate organic metrics. Gate behind `--include-organic` to avoid cost surprises.
   - If removing: delete the fields from `NULL_ENTRY` and the success path; coordinate with `pages/keywords.js:160` which reads `data.backlinks.domainMetrics` — that read may need a fallback.
4. **Batch the DFS call (bug #6).** Collapse the per-domain loop into a single `[{target:d1},{target:d2},...]` payload. Reduces 6 sequential API calls to 1. Saves ~15-30s per audit. Behavior identical to consumers.
5. **Add `--history` flag** to fetch `/backlinks/history/live` trend data for each domain. Output new sibling `domain-metrics-history.json`. Unlocks "are competitors actively acquiring links?" analysis on the Backlinks page.
6. **Add `--client` flag** to make client-domain explicit (bug #4). Fallback to positional for backward compat.
7. **Credential-missing message should include `export` hints (bug #12).** One-line fix, better operator DX.
8. **Atomic write** — cross-cutting.
9. **Consider sibling script for referring-networks data** (`/backlinks/referring_networks/live`) — separate script, not a modification here. Gives us "is client's link profile diverse across C-class IPs?" for the Backlinks page.

## 8. What to verify before we touch this file

- **Confirm the three-client cohort runs identical old-version scripts across the entire `gather-*.js` family** — spot-check chris-nevada/scripts/gather-organic-metrics.js, gather-keyword-volumes.js. If the pattern holds, bug #1 gets a bulk fix.
- **Check `pages/competitors.js:449-451` and `pages/keywords.js:160` before changing the `organicTraffic` fields** — currently null; readers may have null-guards or may crash when fields disappear from the output.
- **Verify DFS's `rank` field semantics** — DFS docs claim 0-1000, but in practice some responses have fractional values. Scale normalization (bug #3 fix) should inspect real data across all clients to catch edge cases.
- **Decide on `backlinks` Python path vs. JS path** — `backlinks.py:81-92` and this script both populate `domainMetrics`. The normalizer resolves via a fallback chain but the two paths can disagree (same DFS endpoint, same day, different results if DFS cache state changes between calls). Long-term: pick one authoritative source, retire the other.
- **Check calgary-castles for this script** — finding #7 found gather-pagespeed.js missing. If calgary is also missing this one, the re-template operation has to handle file-absence, not just file-replace.
