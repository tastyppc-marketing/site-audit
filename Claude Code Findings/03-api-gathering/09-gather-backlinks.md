# Deep Dive #9 — `template/scripts/gather-backlinks.js`

**File:** [`template/scripts/gather-backlinks.js`](/root/site-audit/template/scripts/gather-backlinks.js) (255 lines)
**Layer:** 03 — API / data gathering (DataForSEO `/backlinks/backlinks/live` + `/backlinks/referring_domains/live`)
**Cross-reference:** [`codex findings/02-data-gathering/09-gather_backlinks.md`](/root/site-audit/codex findings/02-data-gathering/09-gather_backlinks.md)
**Template-vs-client drift:** **YES — three-way divergence (see §6). Template is CURRENTLY BROKEN — see bug #1.**
**Template-vs-skill drift:** No inline stub. Invoked at `seo-audit.md:712` with `--limit 200`.
**Date:** 2026-04-20

---

## 1. Purpose

The backlink inventory gatherer. For one client domain + N competitor domains, calls DataForSEO's two backlink endpoints (backlink list + referring domains), caps each at a `--limit` (default 200), writes one JSON per domain:

- `seo/research/client-backlinks.json` — the client's backlinks
- `seo/research/backlinks-<competitor-domain>.json` — one per competitor

Downstream, this is the primary feed for:

- The **Backlink Inventory** grouped-by-referring-domain table on the Links page (normalizer at `generate-multipage-report.js:1571` reads `client-backlinks.json`, normalizer at `:1622` globs all `backlinks-*.json` files for competitor data — per HANDOFF.md auto-fix #8).
- **`analyze-backlink-quality.js`** (deep-dive #14) reads the client file (line 228) and all competitor files (line 243) to enrich with quality scoring. Evidence: Matt's and Liane's `client-backlinks.json` both have an extra `qualitySummary` key that is NOT written by this script.
- `pages/backlink-opportunities.js:2085` reads `client-backlinks.json` for API-error propagation.
- **Python is NOT in this path.** `backlinks.py` takes its own DFS route via `connectors/dataforseo.py` and does not read these JSONs.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<client-domain>` | positional #1 | — required (unless `--from-audit-data`) | First positional is flagged `isClient`. |
| `[competitor-domain ...]` | positional #2+ | — | Each gets its own output file. |
| `--limit N` | flag+value | 200 | **Caps BOTH backlinks AND referring domains per domain.** |
| `--from-audit-data` | bool | false | Auto-reads `seo/audit-data.json` for client + competitors. |
| `--competitors-only` | bool | false | Skips client domain if `client-backlinks.json` already exists. |

**Env vars:**
- `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` — required.

**Files read:**
- `seo/audit-data.json` (only under `--from-audit-data`).
- `seo/research/client-backlinks.json` (only under `--competitors-only` — for existence check).

**Network:**
- `https://api.dataforseo.com/v3/backlinks/backlinks/live` (line 62)
- `https://api.dataforseo.com/v3/backlinks/referring_domains/live` (line 98)

**Cost:** ~$0.06 per domain (2 calls × $0.03). 6 domains ≈ $0.36. Script prints estimate on stderr (lines 228-229).

## 3. Outputs

One file per domain. Per-file shape (lines 139-148):

```
{
  domain: string,
  totalBacklinks: number | null,    // ⚠ Fetched-count, NOT true total (see bug #4)
  referringDomains: number | null,  // ⚠ Same
  backlinks: [{
    source_url, target_url, anchor_text, domain_rating,
    is_dofollow, first_seen
  }] | null,
  referring_domains: [{
    domain, rank, backlinks, first_seen, dofollow, referring_pages
  }] | null,
  errors: [{ endpoint, code?, reason }],
  status: "success" | "partial" | "failed",
  gatheredAt: ISO timestamp
}
```

**Cap behavior:** If DFS has 10,000 backlinks for a domain and `--limit 200`, the `backlinks` array has 200 items and `totalBacklinks` is `200` — NOT `10000`. True total is not fetched.

## 4. Annotated walk

**Lines 36-43 — setup.**
- **Line 38: `const { postJson } = require('./lib/fetch-with-retry');`** — imports `postJson` only. **Does NOT import `Semaphore`.** This is the critical bug — see §5 #1.
- Lines 41-42: `DEFAULT_LIMIT = 200`, `REFERRING_DOMAINS_LIMIT = 200`. Fixed.
- Line 43: `DFS_CALL_COST = 0.03` — cost estimate constant.

**Lines 45-53 — `dfsPost`.** Same auth+post wrapper as gather-domain-metrics. `timeout: 120000` — 120 seconds, double the domain-metrics timeout because the backlinks endpoint returns larger payloads.

**Lines 55-151 — `fetchDomainBacklinks(domain, limit, auth)`.** Two-phase DFS fetch per domain.

- **Phase 1 (lines 58-92) — backlink list.**
  - Line 62-67: Payload `{target, limit, mode: 'as_is', order_by: ['rank,desc']}`. `mode: 'as_is'` tells DFS to return the raw link set without deduplication or filtering. `order_by: rank desc` means we get the HIGHEST-authority backlinks first. **This is a key design decision.** When `limit=200` truncates a 10K-link profile, we keep the top 200 by authority — which is exactly what the Links page needs for display, but NOT what a full-graph analysis would need.
  - Line 78-85: Per-item mapping. **Fields captured:** `source_url`, `target_url`, `anchor_text`, `domain_rating`, `is_dofollow`, `first_seen`. **Missing:** `url_from_domain` — the source domain as a standalone field. The normalizer derives this from `source_url` for "group by referring domain" aggregation (HANDOFF.md:22, Links-page "280 backlinks grouped by domain" feature). URL parsing on thousands of items is redundant work.
  - Line 83: `is_dofollow: item.dofollow !== false` — defensive mapping. DFS returns `dofollow: true/false/null` as a 3-state flag. `!== false` means: null (unknown) is treated as dofollow. Bias: slight overcount of dofollow links when the state is ambiguous.
  - Line 88-92: catch block. `backlinks = null` on error, pushed to errors.

- **Phase 2 (lines 94-127) — referring domains.**
  - Line 98-102: Payload `{target, limit: REFERRING_DOMAINS_LIMIT, order_by: ['rank,desc']}`. `REFERRING_DOMAINS_LIMIT` is a separate constant but also 200. Why have two? Could be intentional so the two caps can diverge later.
  - Line 113-120: Per-item mapping. `domain, rank, backlinks, first_seen, dofollow, referring_pages`. `dofollow: item.dofollow || 0` — note this is INTEGER in the RD endpoint (count of dofollow links from that domain) vs BOOLEAN in backlinks endpoint. Different semantics under same key name — a consumer reading `backlinks[i].dofollow` expects boolean; reading `referring_domains[i].dofollow` expects integer. Worth noting; consumers must know which side they're on.

- **Lines 129-137 — status.**
  - `errors.length === 0` → `"success"`.
  - Both null → `"failed"`.
  - Else → `"partial"`.

- **Lines 139-150 — output assembly.** `totalBacklinks: backlinks ? backlinks.length : null` — this is the field codex flagged (§5 #4).

**Lines 153-205 — `main()`. CLI + env parsing.**

- Line 154-166: Two-pass arg walk. First pass detects `--from-audit-data` and `--competitors-only`; second pass parses `--limit N` and collects positional domains.
- Line 163: `limit = parseInt(args[i + 1], 10)` — standard `--limit N`. Line 163 does `i += 1` to skip the value. Then `continue` to avoid the `.startsWith('--')` branch that would drop "200" too.
- **Lines 164-165: `if (arg.startsWith('--')) continue;` then `domains.push(arg);`** — the flag-stripping pattern.
- Lines 169-194: `--from-audit-data` auto-load:
  - Reads `seo/audit-data.json`.
  - Extracts `auditData.client.website || client.websiteUrl` as client domain.
  - Strips scheme, www, trailing slash (line 177).
  - **Lines 182-183: redundant branch.** `if (!competitorsOnly) domains.unshift(cleanDomain); else domains.unshift(cleanDomain);` — **both branches do the same thing.** Copy-paste error. The `--competitors-only` flag documentation says the client domain is skipped in that mode, so the comment at line 183 "still need client as first for isClient flag" reveals the intent: keep client at index 0 so `isClient = (i === 0)` still works downstream, then let the `skip` filter at line 223 remove it. The two branches are equivalent by accident; the code is confusing and invites a reader to "fix" one branch thinking it's a bug. Cosmetic; low-harm but smells.
  - Line 185-190: Appends competitors from `auditData.competitor.all`, dedup via `indexOf === -1`.

- Lines 196-205: Guard rails. Empty domains → usage+exit. `limit` must be positive integer. Credentials required.

**Lines 207-225 — task construction.**
- Line 218-225: `tasks = domains.map((domain, i) => {...})`. Each task has `domain, isClient, outputFilename, outputPath, skip`. Skip is `isClient && competitorsOnly && fs.existsSync(outputPath)`.
- Line 227: filter skipped tasks.
- Lines 228-229: cost estimate message. `$estCost = activeTasks.length * DFS_CALL_COST * 2` — 2 calls per domain.

**Lines 234-249 — the parallel block. THE BUG.**
- **Line 236: `const sem = new Semaphore(2);`** — `Semaphore` is NOT in scope. Line 38's import statement takes only `postJson`. Running this file throws:
  ```
  ReferenceError: Semaphore is not defined
  ```
  **Every template-copied client who tries to run this script today crashes here** UNLESS the client's copy has already been forked. Liane-jamason has the identical template (she crashes). Matt Wallmow's 208-line fork removed the parallel block entirely (plain `for` loop). Chris-nevada and laura-willis forked similarly (sequential). The fix is a single-line import: `const { postJson, Semaphore } = require('./lib/fetch-with-retry');` (fetch-with-retry exports it at line 294 of that file).
- Lines 238-249: The per-task `sem.run()` block — would have parallelized 2 domains at a time, each writing its own output file inside the semaphore-protected async body. Clean design; just crashes due to the import.

**Line 252 — cost summary.**

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **CRITICAL (H+)** | 38, 236 | **Template crashes at runtime.** `new Semaphore(2)` called with no import. Every `/seo-audit` invocation on the template script ends in `ReferenceError: Semaphore is not defined` before the first API call. Liane-jamason's copy is identical to template → she crashes too. Historical data in her `client-backlinks.json` was written by an earlier, working version; her current script cannot re-produce it. **Fix: change line 38 to `const { postJson, Semaphore } = require('./lib/fetch-with-retry');`** — one line, unblocks every template-copied client. |
| 2 | **H** | 41, 63, 100 | **`--limit 200` caps truncate silently AND mislabel fields.** `totalBacklinks` and `referringDomains` output fields report the COUNT OF FETCHED ITEMS, not the TRUE totals. Matt's competitors eliasonrealty, redmanrealtygroup, shorewest all have exactly 200 backlinks in their files — classic cap signature. Their real totals are probably 1,000-10,000+. The Links page shows "280 backlinks" for Matt's client (66 + competitors aggregated) but the ratio is skewed by the cap. **True totals are separately gatherable** via `/backlinks/summary/live` (the same endpoint `gather-domain-metrics.js` uses, which DOES return `backlinks` and `referring_domains` totals). Worth merging: use summary endpoint for true-totals, backlinks endpoint for item-list. |
| 3 | **H** | — | **Four-way divergence.** (a) Template (255 lines, broken import). (b) liane-jamason (255 lines, identical to template, equally broken). (c) chris-nevada + laura-willis (232 lines each, identical forks — sequential loop, no Semaphore, raw `https.request()`, no `--from-audit-data`). (d) matt-wallmow (208 lines, keeps `fetch-with-retry`, strips Semaphore block + `--from-audit-data`). (e) calgary-castles — **script MISSING**, but calgary has a 22KB `client-backlinks.json` from some prior run. Five clients, four code versions, one total absence. |
| 4 | **M** | 139-143 | **Field-name vs semantic mismatch.** `totalBacklinks` sounds like "total number of backlinks this domain has." Value is actually "number of top-ranked items we fetched within --limit." Same for `referringDomains`. Codex called this out. Fix: rename to `fetchedBacklinks` / `fetchedReferringDomains`, or add a separate `totalBacklinksReported` from the DFS summary endpoint. |
| 5 | **M** | 182-183 | **Dead-code branch.** Both sides of the `if (!competitorsOnly) {} else {}` do `domains.unshift(cleanDomain)` with the same value. Either drop the `else` branch (keeps behavior, loses the explanatory comment) or fix the logic if the comment's intent was to handle two different cases. Currently the code is confusing enough that a future reader may "fix" it incorrectly. |
| 6 | **M** | 83, 118 | **`dofollow` field has different type across the two outputs.** `backlinks[i].is_dofollow` is BOOLEAN. `referring_domains[i].dofollow` is INTEGER (count of dofollow links from that domain). Same concept, different types, different field names. Consumers reading `.dofollow` must check which array they're in. Documented here; downstream is on-notice. |
| 7 | **M** | 78, 113 | **No `url_from_domain` in backlinks map.** The normalizer's "group by referring domain" logic (HANDOFF.md:22) must derive the source domain from `source_url`. Capturing it at ingest is cheaper and avoids URL-parse edge cases (e.g., mixed-case hostnames, punycode). |
| 8 | **M** | — | **No pagination; no way to actually get all backlinks.** DFS's endpoint supports offset/limit pagination up to 100k per domain. Script loops exactly once with the user-supplied `--limit`. A domain with 5,000 backlinks can never be fully captured without raising `--limit 5000` (which blows cost). |
| 9 | **M** | — | **Matt Wallmow's 208-line fork drops `--competitors-only`.** No way to re-fetch only competitors without re-fetching client. For a single-domain re-audit that's wasteful; not a correctness issue. |
| 10 | **L** | 83 | **`is_dofollow: item.dofollow !== false`** — null-ambiguous DFS rows get marked dofollow. DFS rarely returns null for this, but worth noting. |
| 11 | **L** | 43, 229, 252 | **Cost estimate hardcoded at $0.03/call.** DFS changes pricing; estimate can drift. Cosmetic. |
| 12 | **L** | 148 | **Non-atomic write.** Crash mid-write corrupts a single domain file, not all. Cross-cutting. |
| 13 | **L** | 234 | **Semaphore(2) is modest.** When fixed, 6 domains parallelize into 3 waves of 2. Could be 3 or 4 without quota risk. Minor. |
| 14 | **L** | — | **Post-hoc enrichment by `analyze-backlink-quality.js`** adds a `qualitySummary` field. **Correction after deep-dive #14:** only `liane-jamason` actually has this enrichment (script is orphan, not invoked by the skill). Matt does NOT have `qualitySummary` — earlier claim in this finding was wrong. See finding #14 for details. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill, Step 5 at `seo-audit.md:712`:
  ```
  node scripts/gather-backlinks.js {CLIENT_DOMAIN} {COMPETITOR_DOMAINS_SPACE_SEPARATED} --limit 200
  ```
  Single invocation — all domains in one call. No fan-out loop.
- Matt Wallmow: logged at `[04:17]` as `client-backlinks.json ✓ (66 BL, 42 RD)`. His data came from his own 208-line fork (template crashes).

**Consumers of `client-backlinks.json` and `backlinks-*.json`:**

| Consumer | File:lines | Reads |
|---|---|---|
| `generate-multipage-report.js` normalizer | `:1571` | `client-backlinks.json` → populates `topBacklinks` and `topReferringDomains` on audit-data.json (HANDOFF auto-fixes #8, #9). |
| `generate-multipage-report.js` normalizer | `:1622` | Globs all files matching `/^backlinks-.+\.json$/` → aggregates competitor backlink inventories. |
| `pages/backlink-opportunities.js` | `:2085` | Reads `client-backlinks.json` for API error propagation into the report. |
| `analyze-backlink-quality.js` | `:228, :243` | Reads `client-backlinks.json` + all `backlinks-*.json` as input; writes `qualitySummary` back into same files (deep-dive #14). |

**Contract imposed on consumers:**
- **`backlinks[i]` array shape** is stable: `{source_url, target_url, anchor_text, domain_rating, is_dofollow, first_seen}`. Any consumer expects every field, though `domain_rating` can be `null`.
- **`referring_domains[i]`**: `{domain, rank, backlinks, first_seen, dofollow, referring_pages}`.
- **`totalBacklinks` and `referringDomains` mean "fetched count,"** per bug #4.
- **`qualitySummary`** may or may not be present (written by analyze-backlink-quality.js downstream).
- **File existence signals "data was collected"** — `--competitors-only` checks `fs.existsSync(client-backlinks.json)`. Stale/empty files look like real data. A partial-status file (e.g., 0 backlinks because of 429) looks the same as "real data with 0 backlinks."

**Drift table:**

| Version | Lines | Semaphore | `--from-audit-data` | Transport | Status |
|---|---|---|---|---|---|
| Template | 255 | CALLED (crashes, missing import) | ✅ | `postJson` | **BROKEN** |
| liane-jamason | 255 | CALLED (crashes) | ✅ | `postJson` | **BROKEN** — historical data from prior version |
| chris-nevada | 232 | removed | ❌ | raw `https.request()` | Works, sequential |
| laura-willis | 232 | removed | ❌ | raw `https.request()` | Works, sequential. Identical byte-for-byte to chris-nevada's. |
| matt-wallmow | 208 | removed | ❌ | `postJson` (via fetch-with-retry) | Works, sequential |
| **calgary-castles** | — | — | — | — | **MISSING SCRIPT** (but has 22KB `client-backlinks.json`) |

**Data inventory at time of audit:**

| Client | `client-backlinks.json` | Competitor files | Provenance |
|---|---|---|---|
| matt-wallmow | 29KB (66 BL) | 5 × 200 BL each (3 at cap) | fork, working |
| liane-jamason | 156KB (200 BL) | 5 files | pre-breakage, cannot re-run today |
| chris-nevada | 100KB | (present) | fork, working |
| laura-willis | 673B (empty-ish) | ? | fork; file size suggests failure |
| calgary-castles | 22KB | ? | orphan (no script) |
| mammoth-lakes | missing | — | never gathered |
| murray-gardner | missing | — | never gathered (matches finding #5 #5 pattern) |
| p3realtync | missing | — | never gathered |

**laura-willis's 673-byte file** is a standout — likely a status-failed stub (all errors). Worth checking whether her DFS credentials fired or if something else went wrong.

## 7. Fix / improve suggestions (ranked by ROI)

1. **THE ONE-LINE FIX — add `Semaphore` to the import.** Change line 38 to:
   ```js
   const { postJson, Semaphore } = require('./lib/fetch-with-retry');
   ```
   Single commit. Unblocks template + liane. Re-running `/seo-audit` on any template-copied client will now succeed instead of `ReferenceError`.
2. **Re-template chris-nevada, laura-willis** AFTER the one-line fix. They've drifted from a broken template to a sequential-working fork; once template works, their forks are redundant. Liane re-templates too (she's already identical, but after the fix she'll work).
3. **Rename fields to honest names** (bug #4): `totalBacklinks` → `fetchedBacklinksCount`; `referringDomains` → `fetchedReferringDomainsCount`. Add new `trueBacklinksTotal` and `trueReferringDomainsTotal` populated from a separate `/backlinks/summary/live` call (1 extra API call per domain = $0.01). Normalizer + renderers need coordinated update.
4. **Add `url_from_domain` to the backlinks map** (bug #7). Single line in `.map`: `url_from_domain: item.url_from_domain || ''`. DFS already returns this field.
5. **Restore calgary-castles's script** — template-copy after fix. His existing data stays; future re-runs work.
6. **Investigate laura-willis's 673-byte file.** Open it, check `status` + `errors` fields, determine whether credentials expired, quota hit, or domain unreachable. Fix or mark as needs-re-run.
7. **Pagination support** — add `--offset N` so users can iterate past 200. Requires cost-gate warnings.
8. **Clean up the dead-branch** (bug #5). Single-line simplification.
9. **Harmonize `dofollow` field semantics** (bug #6) — either rename `dofollow` → `dofollow_count` on referring_domains, or mark the difference in the JSON header comment. Renderers currently know both; documenting is cheap insurance.
10. **Atomic write** — cross-cutting.
11. **Increase `Semaphore(2)` to `Semaphore(3)` or `(4)`** after import fix — DFS tolerates it and audit time drops from ~60s to ~30s for 6 domains.

## 8. What to verify before we touch this file

- **Try a template-version dry-run** to CONFIRM the crash. `cd template/ && node scripts/gather-backlinks.js example.com` — expect `ReferenceError: Semaphore is not defined`. Belt-and-braces verification before shipping the one-line fix.
- **Open `laura-willis/seo/research/client-backlinks.json`** (673 bytes) and determine why it's empty. Credentials? Quota? Domain down?
- **Spot-check liane-jamason's existing data** for `qualitySummary` key. Confirm that key came from `analyze-backlink-quality.js`, not from this script.
- **Inventory each client's `backlinks-*.json` vs their `competitor.all[]` list** for consistency. Matt has 5 files for 5 competitors — clean. Others may have fewer (truncation) or more (stale domains).
- **Check if any other script imports `Semaphore` from fetch-with-retry** to confirm the fix pattern. `gather-pagespeed.js:29` does; verify one more reference so we know the pattern is already established in the repo, not new.
- **Verify `analyze-backlink-quality.js`'s write path** before anything — if it rewrites the file in place (not append), a re-run of gather-backlinks that crashes partway through would nuke the qualitySummary data. Deep-dive #14 is the authoritative check.
