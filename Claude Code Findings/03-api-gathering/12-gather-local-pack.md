# Deep Dive #12 — `template/scripts/gather-local-pack.js`

**File:** [`template/scripts/gather-local-pack.js`](/root/site-audit/template/scripts/gather-local-pack.js) (216 lines)
**Layer:** 03 — API / data gathering (DataForSEO SERP `/serp/google/organic/live/advanced`)
**Cross-reference:** [`codex findings/02-data-gathering/12-gather_local_pack.md`](/root/site-audit/codex findings/02-data-gathering/12-gather_local_pack.md)
**Template-vs-client drift:** **Same three-client cohort (241 lines) + same 4 clients missing script.** See §6.
**Template-vs-skill drift:** No inline stub. Invoked at `seo-audit.md:738`.
**Date:** 2026-04-20

---

## 1. Purpose

Checks whether the client's business appears in Google's Local Pack (the 3-entry map results at the top of a SERP) for each tracked keyword. Calls DFS `/serp/google/organic/live/advanced`, finds the `local_pack` item in the SERP response, fuzzy-matches the top-3 pack entries against the client's business name, records presence + position.

Feeds the **Local page** "Map Pack Keywords" section on the report (`pages/local.js:261`, `:694`). This is the ONLY source of data for whether the client appears in Google's local pack — no alternative path.

## 2. Inputs

Two invocation modes (mutually exclusive):

**Mode 1 — explicit flags:**
```
--keywords "kw1,kw2,kw3"  --location 2840  --business "Business Name"
```

**Mode 2 — audit-integrated:**
```
--from-audit seo/audit-data.json  --location 2840
```
Reads `keywords[]` and `client.name` from `audit-data.json` (line 75-82).

**Env vars:** `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`.
**Network:** DFS `/serp/google/organic/live/advanced` (line 116).
**Cost:** ~$0.002 per keyword (line 105). 25 keywords ≈ $0.05.

**Hardcoded DFS params:**
- `language_code: 'en'` (line 119) — not parameterizable.
- `device: 'desktop'` (line 120) — not parameterizable.
- `depth: 100` (line 121) — top 100 SERP results fetched.
- `locationCode` default `2840` (line 63) — **United States country-level.**

## 3. Outputs

Written to `seo/research/local-pack-data.json` (line 198).

```
{
  businessName: string,
  locationCode: number,
  keywords: [{
    keyword, foundInPack, position, packItems: [{title, rating, reviews, position}]
  }],
  summary: { totalKeywords, foundInPack, notInPack, avgPosition },
  errors: [{ keyword, code?, reason }],
  status: "success" | "partial" | "failed",
  gatheredAt: ISO
}
```

`packItems` is ALWAYS top-3 (Local Pack is always ≤3 entries). If a keyword has no local pack, `packItems: []`.

## 4. Annotated walk

**Lines 26-39 — setup.** `postJson` wrapper, 60s timeout. Clean.

**Lines 41-47 — CLI helpers.** `getArg(flag, default)` and `hasFlag(flag)`. Simpler than the `parseArgs` pattern in gather-keyword-volumes but works for the 4-flag surface.

**Lines 49-53 — `fuzzyMatch(title, businessName)`.** Case-insensitive bidirectional substring match.
- `"Matt Wallmow Realtor" includes "Matt Wallmow"` → match.
- `"Matt Wallmow" includes "Matt Wallmow Realtor"` → reverse direction, false → falls back to first check.
- `"MW Realty"` vs `"Matt Wallmow"` → neither includes the other → no match.
- `"Wallmow Realty, Inc / Lakeland Realty"` (client's clientCompany) vs Google's listing `"Lakeland Realty"` → reverse direction catches. Forward doesn't.

Codex called this out as weakness #1. Real local pack titles often differ from registered business names — abbreviated, reshuffled ("Lakeland Realty - Rhinelander Office"), different DBAs, parent/subsidiary splits. Substring match underreports matches.

**Lines 55-62 — main init + creds.** Standard.

**Line 63 — `locationCode = parseInt(getArg('--location', '2840'), 10)`.** Default `2840` = DFS code for "United States" (country-level). **This is critical — see §5 bug #1.**

**Lines 67-82 — `--from-audit` mode.**
- Line 75-77: reads keyword list. Tolerates both `auditData.keywords[]` and `auditData.data.keywords[]` shapes.
- Line 78: `businessName = ((auditData.data || auditData).client || {}).name || ''`. Reads `client.name`. **Matt Wallmow's `audit-data.json` has `client.name: null` — so this fallback returns `''` and should trigger line 79-81 exit.** But his `local-pack-data.json` shows `businessName: "Matt Wallmow"`. Provenance mismatch — see §5 bug #7.

**Lines 83-97 — explicit-flags mode.** `--keywords "kw1,kw2"` comma-split. `--business` required. Standard.

**Lines 99-102 — empty keywords guard.**

**Lines 104-105 — cost estimate echo.**

**Lines 111-170 — the main loop.** Sequential.

- Lines 116-122: DFS SERP payload. `keyword, location_code, language_code, device, depth`. All five locked except location (CLI-configurable).
- Lines 124-132: failure path — null pack result, error row.
- **Line 137: `const localPackItem = items.find(item => item.type === 'local_pack');`** — this is where suspicious behavior originates. DFS returns SERP items as a typed heterogeneous array: `organic, featured_snippet, people_also_ask, local_pack, map, local_services, ...`. **If DFS ever renames `local_pack` (e.g., to `map_pack`, `local_results`, or different-for-mobile-vs-desktop), this lookup silently returns undefined → zero-pack for every keyword.** Matt's result: 25/25 empty packItems, zero errors, "success" status. Classic signature of upstream API shape change.
- Lines 139-143: no local_pack in SERP → `foundInPack: false`. Note the script CAN legitimately report this when a keyword genuinely has no local pack (informational queries, very specific long-tail, or the keyword simply doesn't trigger a map pack). But 25/25 being empty for a REAL-ESTATE-IN-RHINELANDER keyword set is suspicious.
- Lines 145-151: slice top-3 from `localPackItem.items`. Map to `{title, rating, reviews, position}`.
  - Line 148: `rating: entry.rating ? (entry.rating.value || entry.rating) : null` — handles two shapes (rating object with `.value` OR rating as primitive). Belt-and-braces.
  - Line 149: `reviews: entry.rating ? (entry.rating.votes_count || null) : null` — review count from `rating.votes_count`. NOT `entry.votes_count` — inside the rating sub-object.
- Line 154: `packItems.findIndex(p => fuzzyMatch(p.title, businessName))` — finds first substring-match in top-3.
- Lines 158-162: log either "FOUND at position N" or "Not in pack (pack: [comma-list])" — useful debug output for operators.
- Line 164: push result.
- Lines 165-169: catch block — empty pack, error row.

**Lines 173-184 — summary.**
- `inPackResults.length` = count of foundInPack=true.
- `avgPosition` = average over non-null positions (1, 2, or 3). Rounded to 1 decimal.

**Lines 186-194 — status derivation.** 
- `errors.length === 0` → `"success"`.
- **Line 190: `if (results.every(r => !r.foundInPack) && errors.length === results.length) → "failed"`.** This is a **very narrow** failed condition: EVERY result must be !foundInPack AND errors must equal results (i.e., every single keyword errored). Matt's case: all 25 not in pack, 0 errors → 0 !== 25 → `"partial"` not chosen → falls to `else` → `"success"`. **Bug #8.** A zero-information result gets success status.
- Else → `"partial"`.

**Lines 196-213 — write.** Same CWD-relative, non-atomic pattern.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 63 + `seo-audit.md:738` | **`--location 2840` = "United States" country-level; not client-local.** The skill passes `2840` unconditionally. DFS code `2840` is the US as a whole; city-level codes are much more specific (e.g., `9030069` for Rhinelander, WI). Country-level location means Google SERP simulation is from no specific city — geo-specific queries ("real estate Rhinelander WI") may still return some local pack due to keyword geo-modifiers, but the pack DFS returns is whoever Google thinks is top for that keyword anywhere in the US, not who shows up on a Rhinelander-local search. Matt's case: 25 keywords, ALL contain "Rhinelander" or WI cities, and 0 hits — suspicious. Should either derive location code from `client-config.json` (requires a lookup map) or accept a city-level override. |
| 2 | **H** | 137 | **Zero local_pack items across all 25 keywords with no errors is a classic API-shape-drift signature.** Either (a) DFS renamed the item type, (b) device: 'desktop' suppresses local pack for this SERP class (local pack is more mobile-first), or (c) `location_code: 2840` at country level truly yields no local pack even for geo queries. Before shipping any fix, we need a live test with curl/Postman to see the raw DFS response for one of Matt's keywords. Could be a one-line type rename; could be a deeper architectural retarget. |
| 3 | **H** | 120 | **Device hardcoded `desktop`.** Local Pack behavior differs between mobile and desktop. Mobile is where local queries predominate (users searching near-me). Desktop-only measurement under-represents. Needs `--device` flag. |
| 4 | **H** | 49-53 | **Weak fuzzy match.** Bidirectional substring only. Fails on: DBA variants, brokerage-vs-agent naming ("Matt Wallmow" vs "EXP Realty - Matt Wallmow"), abbreviations ("MW Realty"), parent/subsidiary splits. Codex weakness #1. Replacement options: token-set ratio, Jaro-Winkler, or DFS's own domain/place-id match. |
| 5 | **H** | — | **Three-client cohort drift** (chris-nevada, laura-willis, liane-jamason at 241 lines, byte-identical to each other, all three with raw `https.request()`, `DELAY_MS = 3000`, sleep between keywords). Same cohort pattern as findings #7, #8, #10, #11. Confirmed systemic. |
| 6 | **H** | — | **4 clients missing script** (calgary-castles, mammoth-lakes, murray-gardner, p3realtync). None have `local-pack-data.json`. Their Local page has NO map-pack data. |
| 7 | **M** | 78-82 | **`client.name` provenance mismatch for Matt.** `audit-data.json` has `client.name: null`, but `local-pack-data.json` has `businessName: "Matt Wallmow"`. The `||` chain at line 78 cannot produce that name from null. Either: (a) `client.name` WAS set at run time and a later normalizer nulled it, or (b) the script was actually run with `--business "Matt Wallmow"` not `--from-audit`, contrary to skill prescription. Either way, the data file's `businessName` field doesn't match the current state of `audit-data.json`. If a future re-run uses `--from-audit`, it'll exit at line 79-81. |
| 8 | **M** | 186-194 | **`status: "success"` for 0-info case.** If every keyword returns empty packItems with no errors, status is still "success." Technically true (the SCRIPT succeeded), but the DATA is zero-information. Consumer seeing "success" can't distinguish "we checked and the client isn't anywhere" from "the upstream shape is wrong so we found nothing." Introduce `"empty"` status for this case. |
| 9 | **M** | 119 | **`language_code: 'en'` hardcoded.** Consistent with other scripts; impacts non-English clients the same way. |
| 10 | **M** | 111-170 | **Sequential loop.** 25 keywords × ~3s each = ~75s. Could parallelize with Semaphore(3). DFS SERP endpoint tolerates it. |
| 11 | **M** | 154 | **Only top-3 pack entries checked.** DFS's local_pack sometimes returns 4-5+ entries ("expanded pack" or "local finder" results). Hardcoded slice at line 145 (`.slice(0, 3)`) drops them. If client is in position 4, script reports not-in-pack. Cosmetic but measurable under-report. |
| 12 | **L** | 148-149 | **Nested ternary for rating/reviews.** Defensive but readable. Low-stakes. |
| 13 | **L** | 200-208 | **Non-atomic write.** Cross-cutting. |
| 14 | **L** | 78 | **`auditData.data || auditData` fallback** accommodates two schema shapes. If the audit-data ever has BOTH (nested `data.client` AND top-level `client`), nested wins — possibly wrong. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill, Step 5 at `seo-audit.md:738`:
  ```
  node scripts/gather-local-pack.js --from-audit seo/audit-data.json --location 2840
  ```
  Single invocation. `--location 2840` is unconditional — see bug #1.
- Matt Wallmow: `[04:23] local-pack-data.json ✓ (0/25 keywords in local pack)` in audit-log. Zero hits; audit-log flagged nothing.

**Consumers of `local-pack-data.json`:**

| Consumer | File:lines | Reads |
|---|---|---|
| `generate-multipage-report.js` normalizer | `:2931` | Auto-populates `audit-data.json` field `localSeo.mapPackKeywords` from this file (line 2945 log: "from local-pack-data.json"). |
| `pages/local.js` | `:261` | Displays `localSeo.mapPackKeywords` (populated by normalizer). |
| `pages/local.js` | `:694` | Normalizes mapPackKeywords for table rendering. |
| **NOT** `populate-audit-data.js` | — | No read. |
| **NOT** `build_audit.py` | — | No Python consumer. |

**Contract:**
- `keywords[i].foundInPack`: boolean.
- `keywords[i].position`: 1-3 or null.
- `keywords[i].packItems`: array of ≤3 entries. Empty array if no local pack.
- `summary.avgPosition`: null if zero hits, else positive float.
- `businessName`: string used for fuzzy matching — must match client's actual GBP listing name for positive results.

**Drift table:**

| Version | Lines | Retry | Delay | Status |
|---|---|---|---|---|
| Template | 216 | ✅ | N/A | current |
| matt-wallmow | 216 | = template | = template | Matches exactly |
| chris-nevada | 241 | ❌ | 3000ms | Old cohort |
| laura-willis | 241 | ❌ | 3000ms | Old cohort (byte-identical) |
| liane-jamason | 241 | ❌ | 3000ms | Old cohort (byte-identical) |
| **calgary-castles** | — | — | — | MISSING |
| **mammoth-lakes** | — | — | — | MISSING |
| **murray-gardner** | — | — | — | MISSING |
| **p3realtync** | — | — | — | MISSING |

**Skill-inline:** no stub.

**Direct impact on live clients:**
- **matt-wallmow**: 0/25 hits. Bug #1 + #2 almost certainly causing false-negatives. Actual Matt-in-local-pack coverage likely >0; we're not seeing it.
- **chris-nevada, laura-willis, liane-jamason**: old-cohort drift; same suspected false-negative issue from bugs #1-2.
- **calgary, mammoth, murray, p3realtync**: no data at all. Local page's Map Pack section is presumably empty.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Investigate bugs #1 and #2 in a single live test.** Curl DFS `/serp/google/organic/live/advanced` for "real estate Rhinelander WI" with `location_code: 2840` (country) vs `location_code: 9030069` (or actual Rhinelander code) vs `device: mobile` vs `device: desktop`. Compare raw responses for `type: 'local_pack'` presence. One test answers: (a) is it location code? (b) is it device? (c) did DFS rename the type? The fix cascades from the result.
2. **Derive location code from client-config.json.** Add a `locationCode` field to client-config, or build a small city-name → DFS code lookup. Default fallback to 2840.
3. **Replace fuzzyMatch with a token-set or Jaro-Winkler match.** Small dependency (`fuzzball` or similar) unlocks significantly better match quality.
4. **Add `--device mobile` flag.** Run both mobile and desktop; merge results (client may appear in mobile pack but not desktop). Double-cost but double-accurate.
5. **Re-template the three-client cohort.** Coordinated PR per the systemic-drift plan.
6. **Template-copy script into the 4 missing clients.** After #1-2 verified.
7. **Introduce `"empty"` status** (bug #8). Distinguish zero-hits from actual-failure.
8. **Expand pack-size check beyond 3** (bug #11). Even if Local Pack is canonically 3, DFS may return more; worth showing all.
9. **Atomic write.** Cross-cutting.
10. **`--language` flag + config integration** (bug #9).

## 8. What to verify before we touch this file

- **Live DFS test for bugs #1-2** — the highest-leverage verification. Without this, any location/device fix is speculative.
- **DFS location code reference** — compile a list of US metro codes for the existing client base (Rhinelander WI, Tampa FL, Calgary AB, Mammoth Lakes CA, wherever laura/chris/murray are). Each client's fix #2 needs the right code.
- **Check `pages/local.js:261, 694`** — understand the consumer's expected shape before introducing any schema changes (e.g., mobile+desktop merge).
- **Verify current `client.name` across all clients' audit-data.json.** If multiple clients have `client.name: null`, Mode 1 (`--from-audit`) would fail at line 79-81 across the board. Determines whether the skill prescription is even working.
- **Check `business_profile.py` Python connector** — some clients may have GBP API access that provides ground-truth local-pack-presence data. If any client has GBP configured, that's the alternative path; this script's output is a fallback.
- **Audit the normalizer at `gen-multipage:2931`** for how `localSeo.mapPackKeywords` is populated when local-pack-data.json is missing entirely (the 4 clients without this script). Is it null? empty array? omitted?
