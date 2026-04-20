# Deep Dive #11 — `template/scripts/gather-keyword-volumes.js`

**File:** [`template/scripts/gather-keyword-volumes.js`](/root/site-audit/template/scripts/gather-keyword-volumes.js) (302 lines)
**Layer:** 03 — API / data gathering (DataForSEO Google Ads `/keywords_data/google_ads/search_volume/live`)
**Cross-reference:** [`codex findings/02-data-gathering/11-gather_keyword_volumes.md`](/root/site-audit/codex findings/02-data-gathering/11-gather_keyword_volumes.md)
**Template-vs-client drift:** **YES — same old-pattern cohort at 327 lines (laura-willis, liane-jamason, chris-nevada — identical byte-for-byte). matt-wallmow matches template. 4 clients MISSING the script (calgary-castles, mammoth-lakes, murray-gardner, p3realtync).** See §6.
**Template-vs-skill drift:** No inline stub. Invoked at `seo-audit.md:718` with `--from-audit`.
**Date:** 2026-04-20

---

## 1. Purpose

Gets real monthly search volume, CPC, and competition data from DataForSEO's Google Ads endpoint for a list of keywords. Also computes a 12-month trend array. **Uniquely, this script mutates `audit-data.json` in-place when `--from-audit` is used** — it both gathers data AND writes volume/cpc/competition back into `auditData.keywords[].volume|cpc|competition`. It's the only `gather-*.js` script with that dual role.

Two invocation modes:
1. **Positional keywords**: `gather-keyword-volumes.js "mortgage broker" "real estate agent" ...` — writes `keyword-volumes.json` only.
2. **Audit-integrated** (`--from-audit`): reads keywords from `auditData.keywords[].keyword`, writes `keyword-volumes.json`, **then rewrites `audit-data.json`** with merged volumes.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<keyword1> <keyword2> ...` | positional | — | Raw keywords to look up |
| `--from-audit <path>` | flag+value | — | Load keywords from `audit-data.json`; enables in-place mutation |
| `--location <code>` | flag+value | **2840** (US) | DFS location code |
| `--language <code>` | flag+value | **en** | DFS language code |

**Env vars:** `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`.
**Files read:** `audit-data.json` (when `--from-audit`).
**Files written:**
- `seo/research/keyword-volumes.json` — always.
- `seo/audit-data.json` — ONLY when `--from-audit` AND `auditData` was loaded.

**Constants:**
- `MAX_KEYWORDS_PER_BATCH = 1000` (line 34) — batches by 1000.
- `COST_PER_BATCH = 0.075` (line 35) — $0.075 per DFS task regardless of size 1-1000.

**Skill-level invocation:** `node scripts/gather-keyword-volumes.js --from-audit seo/audit-data.json` (line 718).

## 3. Outputs

Written to `seo/research/keyword-volumes.json` (line 277).

```
{
  data: [{
    keyword, volume, cpc, competition,
    trend: [search_volume_month_1, ..., search_volume_month_N]
  }],
  errors: [{ batch?, code?, reason }],
  status: "success" | "partial" | "failed",
  locationCode: 2840,      // ✓ provenance recorded
  languageCode: "en",       // ✓ provenance recorded
  gatheredAt: ISO
}
```

**`trend` is flattened** — DFS returns `monthly_searches: [{year, month, search_volume}, ...]`, script reduces to just `[search_volume, ...]`. Year/month labels dropped. Consumer can't render a labeled time-series.

**Side-effect on `audit-data.json`** (lines 156-176, 295-298):
- Iterates `auditData.keywords[]`, normalizes each `.keyword` to lowercase-trimmed, looks up in the results map.
- For each matched keyword, writes `.volume`, `.cpc`, `.competition` directly onto the entry.
- Writes the entire audit-data.json back with `JSON.stringify(auditData, null, 2)`.
- **No backup. No atomic write. No "would-have-updated" dry-run mode.**

## 4. Annotated walk

**Lines 27-35 — setup.**
- Line 29: `postJson` from fetch-with-retry. No Semaphore (sequential batches, no concurrency needed — codex flagged no runtime bugs here, template is clean).
- Line 34-35: `MAX_KEYWORDS_PER_BATCH = 1000`, `COST_PER_BATCH = 0.075`. DFS bills per task regardless of keyword count, so chunking at 1000 is cost-optimal.

**Lines 37-45 — `dfsPost`.** Standard `postJson` wrapper, 60s timeout.

**Lines 47-51 — `usage()`.** Prints both invocation modes.

**Lines 53-55 — `normalizeKeyword`.** Lowercase + trim. Used for dedup/lookup.

**Lines 57-65 — `nullEntry`.** Placeholder for failed lookups. `trend: []` not null — consumer iterates safely.

**Lines 67-122 — `parseArgs`.** Clean manual parser.
- `--from-audit <path>` at 78-87.
- `--location <code>` at 89-99 (validates positive integer).
- `--language <code>` at 101-110 (no format validation — accepts any non-empty string).
- Line 112-116: any unknown `--flag` → exit. Good strictness.
- Line 118: bare arg → added to `keywords[]`.

**Lines 124-130 — `chunk`.** Trivial array batcher. Matt's 25 keywords → 1 batch of 25.

**Lines 132-142 — `loadKeywordsFromAudit`.**
- Reads `audit-data.json`, parses JSON.
- Extracts `auditData.keywords[i].keyword` strings if `auditData.keywords` is an array.
- Maps, trims, filters empty.
- Returns `{auditData, keywords}` — both the raw audit object AND the extracted keyword list.

**Lines 144-154 — `mapKeywordResult(item)`.** Per-DFS-item extractor.
- Line 147: `volume: item.search_volume ?? null` — **`??`** (nullish coalescing), NOT `||`. Preserves `search_volume: 0` as `0` instead of converting to null. Better than `|| 0` pattern in sibling scripts.
- Line 148: `cpc: item.cpc ?? null`.
- Line 149: `competition: item.competition ?? null`. **DFS returns `competition` as float 0.0-1.0.** Downstream renderers expecting "Low/Medium/High" string (common in GSC/Google Ads UIs) must translate. See §5 bug #5.
- Line 150-152: **trend flattening.** `monthly_searches` is array of `{year, month, search_volume}`. Map reduces to `[search_volume1, ..., search_volumeN]`. Loss of year/month context.

**Lines 156-176 — `updateAuditKeywordVolumes(auditData, keywordResults)`.** The mutation function.
- Line 157: early-return if `auditData.keywords` isn't an array.
- Lines 159-162: build `Map<normalized-keyword, result>`. Same normalization as lookup → safe.
- Lines 164-173: walk the audit keywords, match via normalized lookup, assign `.volume`, `.cpc`, `.competition`.
- **Does NOT assign `.trend` back onto audit-data.json** — the trend array stays only in the research file. Consumers wanting trend data must read the research file. Not documented anywhere.

**Lines 178-207 — main init.**
- Creds check (same pattern).
- `--from-audit` path: reads the audit file, extracts keywords, warns if positional keywords were also provided (line 200-201).
- Line 203-206: if no keywords found in audit, warn + `return` (NOT exit 1 — silent "no-op" behavior, doesn't crash).
- Line 209-212: if no keywords at all, print usage + exit 1.

**Lines 214-264 — the batch loop.**
- Line 220: for each batch — chunk of up to 1000 keywords.
- Lines 224-229: DFS POST. Payload `{keywords: [...], location_code, language_code}`.
- Lines 231-238: failure path — push `nullEntry` for every keyword in the batch, add error row.
- Lines 239-258: success path.
  - Build a `Map<normalizeKeyword, mapped-result>` from DFS response items.
  - Iterate the batch, look up each keyword. Match found → push mapped result. No match → push `nullEntry`.
  - **Matt's experience (25 keywords, 9 with volume, 16 null):** DFS returned only 9 keywords in its result; the other 16 had no match and got `nullEntry`. Not an error — DFS legitimately reports "no data" for obscure or typo'd keywords.
- Lines 259-263: catch block — same null-push pattern.

**Lines 266-273 — status computation.** Same pattern as siblings.

**Lines 275-290 — write `keyword-volumes.json`.** Includes `locationCode` + `languageCode` in output. Trailing newline at line 288. Cost estimate echoed at 292-293.

**Lines 295-299 — the in-place mutation.**
```js
if (auditPath && auditData) {
  const updatedCount = updateAuditKeywordVolumes(auditData, results);
  fs.writeFileSync(auditPath, `${JSON.stringify(auditData, null, 2)}\n`);
  console.error(`Updated ${updatedCount} keywords in audit-data.json with real volumes`);
}
```
- No conditional on `updatedCount > 0` — **always writes** if `auditData` was loaded, even if nothing was updated.
- No backup (e.g., `audit-data.json.bak`).
- No atomic write.
- A crash between line 297 start and completion = corrupted JSON.
- A concurrent edit to audit-data.json (rare but possible — operator opens it in an editor) = lost changes silently.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 295-299 | **In-place `audit-data.json` rewrite with no backup and no atomic write.** Any crash, signal, or concurrent edit during the write corrupts or overwrites the core audit data file. This is the single riskiest write operation in the gather-layer. Codex flagged dual-responsibility (gather + mutate) as an architectural problem — this concrete fragility is the safety concern. Fix: write to `.tmp` and `fs.renameSync`, and emit a `.bak` copy before mutating. |
| 2 | **H** | — | **Four clients are MISSING this script entirely.** `calgary-castles`, `mammoth-lakes`, `murray-gardner`, `p3realtync` have no `gather-keyword-volumes.js`. None of them have `keyword-volumes.json` research data either. Their keyword `volume`/`cpc`/`competition` fields in `audit-data.json` are likely null or never populated. Report's Keywords page may show volume-less rows for these clients. Same pattern as missing gather-pagespeed, gather-organic-metrics, gather-backlinks for some of these clients — consistent "older audit generation" signature. |
| 3 | **H** | — | **Three-client old-pattern cohort at 327 lines** (chris-nevada, laura-willis, liane-jamason — byte-identical to each other). Raw `https.request()`, hardcoded `sleep(1000)` between batches, no retry logic. Now confirmed as a systemic drift across **5 consecutive scripts** (gather-pagespeed, gather-domain-metrics, gather-organic-metrics, ~partial at gather-backlinks, and now gather-keyword-volumes). These three clients' 03-api-gathering layer is one consolidated generation behind. |
| 4 | **M** | 149 | **`competition` is a 0.0-1.0 float; downstream renderers may expect categorical.** DFS documentation: `competition` is a decimal index. Google Ads UI (the audience this report emulates) shows "Low/Medium/High." Consumer code in `pages/keywords.js` (deep-dive #23) needs to translate or the report shows opaque "0.78" values. Not a bug in this script per se — but this is where the translation should happen (or be deferred with a documented assumption). |
| 5 | **M** | 150-152 | **Trend flattening loses year/month labels.** Downstream consumers can't render a labeled seasonality chart. DFS returns `[{year:2025, month:4, search_volume:1200}, {year:2025, month:5, search_volume:1500}, ...]`; we reduce to `[1200, 1500, ...]`. Also: no length guarantee — DFS returns 12 months if available, fewer for new keywords. An index-based chart assumes 12. Codex flagged this. |
| 6 | **M** | 159-162 | **Duplicate keywords (case/whitespace variants) collapse in the result map.** If operator passes `"Home Buying"` and `"home buying"`, normalizeKeyword makes them the same key — the map has one entry; iteration over the batch pushes the same result for both. Not incorrect (same keyword, same volume) but wastes a DFS billable entry (DFS charges by task, not by keyword within the task, so zero cost impact; but the result file has 2 identical rows with different casing). |
| 7 | **M** | 203-206 | **Silent no-op on empty audit keywords.** `--from-audit` with empty keywords → prints warning and `return` (not exit 1). If a pipeline expects `keyword-volumes.json` to exist after this call, it won't. Operator has no signal beyond stderr warning. |
| 8 | **M** | 156-173 | **`updateAuditKeywordVolumes` does not write `trend` back to `audit-data.json`.** Only `volume`, `cpc`, `competition` flow into the audit file. Any downstream consumer that reads `auditData.keywords[i].trend` (if any exists) gets nothing from this script. Documented here; consumers expected to read `research/keyword-volumes.json` for trend. |
| 9 | **L** | 288 | **Trailing newline on write**, but no atomic rename. Cosmetic — same family of bug as other gather scripts. |
| 10 | **L** | 232 | **`task.status_code !== 20000` check only.** Fine for live endpoint (expected code is 20000). No 2xxxx tolerance commentary; a future maintainer might incorrectly loosen. |
| 11 | **L** | 108 | **`--language` accepts any string.** No validation — operator could pass `--language blargh` and DFS would 400, caught in catch block but error message is generic. Cheap pre-validation with a small allowlist would improve DX. |
| 12 | **L** | 216, 220 | **Batches processed sequentially even when `batches.length > 1`.** For clients with 2000+ keywords (3+ batches), parallelizing with Semaphore(2) would save time. No current clients hit this; low priority. |
| 13 | **L** | 292-293 | **Cost echo uses `COST_PER_BATCH` constant.** DFS pricing may drift. Cosmetic. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill, Step 5 at `seo-audit.md:718`:
  ```
  node scripts/gather-keyword-volumes.js --from-audit seo/audit-data.json
  ```
  Always run with `--from-audit` — the in-place mutation is intentional. Single invocation per audit.
- Matt Wallmow: `[04:22] keyword-volumes.json ✓ (25 keywords, 9 with real volume data)` in audit-log. Clean execution; the 16 null-volume keywords were DFS misses (rare or typo'd terms), not failures.

**Consumers of `keyword-volumes.json`:**

| Consumer | File:lines | Reads |
|---|---|---|
| `generate-multipage-report.js` normalizer | `:744` | Merges `.volume` into audit keywords (primary path). |
| `generate-multipage-report.js` | `:2499` | Fallback read of `keyword-volumes.json` if `keyword-data.json` (different file) absent. |
| `populate-audit-data.js` | `:137` | **Comment only** — "populated later by gather-keyword-volumes.js". Does NOT read. |
| **NOT** `build_audit.py` | — | Python doesn't read this file. |
| **NOT** any Python analyzer | — | No consumer. |

**Consumers of the in-place `audit-data.json` mutation:**
- The entire report pipeline. `audit-data.json` is the single source of truth. Any script/analyzer that reads `keywords[i].volume` gets the value populated here.

**Contract:**
- `data[i]` array elements always exist, one per input keyword (even on total DFS failure → null entries).
- `data[i].volume` is number or null. `cpc` is number or null. `competition` is float 0.0-1.0 or null.
- `data[i].trend` is an array of numbers OR empty array. Length not guaranteed (DFS varies).
- `locationCode` / `languageCode` fields REFLECT the `--location` / `--language` used at call time. Provenance.
- **`audit-data.json.keywords[i].trend` is NEVER populated** by this script. Consumers needing trend must read the research file.

**Drift table:**

| Version | Lines | Retry | Delay | Transport | Status |
|---|---|---|---|---|---|
| Template | 302 | ✅ (fetch-with-retry) | N/A | `postJson` | current |
| matt-wallmow | 302 | = template | = template | = template | Matches exactly |
| chris-nevada | 327 | ❌ | 1000ms | raw `https.request()` | Old cohort |
| laura-willis | 327 | ❌ | 1000ms | Raw | Old cohort (byte-identical to chris-nevada) |
| liane-jamason | 327 | ❌ | 1000ms | Raw | Old cohort (byte-identical) |
| **calgary-castles** | — | — | — | — | **MISSING SCRIPT** |
| **mammoth-lakes** | — | — | — | — | **MISSING SCRIPT** |
| **murray-gardner** | — | — | — | — | **MISSING SCRIPT** |
| **p3realtync** | — | — | — | — | **MISSING SCRIPT** |

**Data inventory:**

| Client | `keyword-volumes.json` | Notes |
|---|---|---|
| matt-wallmow | ✅ 25 kw, 9 with volume | clean |
| chris-nevada | ? | old cohort — runs |
| laura-willis | ? | old cohort |
| liane-jamason | ? | old cohort |
| calgary, mammoth, murray, p3realtync | ❌ | no data file, no script |

## 7. Fix / improve suggestions (ranked by ROI)

1. **Atomic + backed-up audit-data.json rewrite (bug #1).** Change the mutation path to:
   ```js
   fs.copyFileSync(auditPath, `${auditPath}.bak`);
   fs.writeFileSync(`${auditPath}.tmp`, `${JSON.stringify(auditData, null, 2)}\n`);
   fs.renameSync(`${auditPath}.tmp`, auditPath);
   ```
   3 extra lines; eliminates the single riskiest write in the whole gather-layer.
2. **Template-copy the script into the 4 missing clients** (bug #2). Cheap and mechanical. Unblocks real keyword-volume data for those reports. Gate behind "after bulk re-template of old cohort" so it's one coordinated PR.
3. **Bulk re-template the three old-cohort clients** (bug #3) — do this once across all 5 drifted gather scripts. One PR, ~15 file replacements, ends the entire cohort-drift saga.
4. **Map `competition` 0.0-1.0 → categorical string in the renderer** (bug #4). Not here — in `pages/keywords.js`. Deep-dive #23 should flag it.
5. **Preserve `{year, month, search_volume}` structure in `trend`** (bug #5). One-line fix: `trend: result.monthly_searches || []`. Consumers can then render labeled charts. Requires coordinated update in consumers.
6. **Exit 1 on `--from-audit` with empty keywords** (bug #7). Promotes silent no-op to explicit failure.
7. **Write `trend` back to `audit-data.json.keywords[i].trend`** (bug #8). Otherwise this field is invisible to the main data file. One-line addition in `updateAuditKeywordVolumes`.
8. **Add `--dry-run` flag** that skips both writes and echoes the plan. Useful for cost-sensitive dev.
9. **Pre-validate `--language` against a small allowlist** (bug #11).
10. **Parallelize batches with Semaphore(2)** (bug #12) — only benefits high-keyword audits.

## 8. What to verify before we touch this file

- **Check how `pages/keywords.js` handles `competition` field.** If it already translates to categorical, no coordinated change needed for fix #4. If it displays raw float, user-facing impact.
- **Inventory all current audit-data.json files for `keywords[].trend` field presence.** If NO current audit has trend populated (because the script never writes it to audit-data), adding it (fix #7) won't break any downstream assumption — it just newly enables a feature.
- **Confirm the 4 missing-script clients have a `keywords[]` array in their audit-data.json at all.** If they have no keyword research data, copying the script doesn't help — they need upstream research agents to run first. Deep-dive #67 (seo-audit.md skill) may reveal the order-of-operations.
- **Check git for any recent changes to `audit-data.json`** that might have been overwritten by this script during a re-run. Can we reconstruct what was lost from `seo/FINAL-AUDIT-REPORT.md`? Relevant for any client where a manual edit may have been rewritten.
- **Verify `updateAuditKeywordVolumes` handles deeply-nested `keywords` structures.** Current code assumes `auditData.keywords` is a flat array of `{keyword, volume, ...}` objects. If any client's schema has `keywords.primary[]` + `keywords.long_tail[]` sub-groupings (some older audits did), the update is a no-op silently.
