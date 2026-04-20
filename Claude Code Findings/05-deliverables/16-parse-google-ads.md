# Deep Dive #16 — `template/scripts/parse-google-ads.js`

**File:** [`template/scripts/parse-google-ads.js`](/root/site-audit/template/scripts/parse-google-ads.js) (454 lines)
**Layer:** 05 — deliverables (PPC ingest — CSV/TSV → JSON)
**Cross-reference:** [`codex findings/08-api-connectors/18-parse_google_ads.md`](/root/site-audit/codex findings/08-api-connectors/18-parse_google_ads.md)
**Template-vs-client drift:** **None — all 9 active clients + Backup identical at 454 lines.** First script with zero drift across every client.
**Template-vs-skill drift:** **NOT invoked by any skill.** `commands/seo-audit.md` has zero references. `commands/ppc-audit.md` does not exist. Manual-only.
**Date:** 2026-04-20

---

## 1. Purpose

The **Google Ads CSV/TSV ingester.** Reads a folder of Google Ads Editor exports (typically 10+ CSV files per campaign audit), detects each export's report type via filename + header heuristics, parses into typed JSON rows, and writes a single `ppc-raw-data.json`.

Supports 11 report types (line 110-136):
- `searchTerms, qualityScore, keywords, adGroups, ads, audiences, landingPages, devices, geographic, adSchedule, changeHistory`

**Critical architectural gap:** script writes `ppc-raw-data.json`. Downstream consumers (`generate-ppc-report.js`, `generate-ppc-spreadsheet.js`, `generate-ppc-presentation.js`) read `ppc-data.json`. **Nothing in the tree transforms `ppc-raw-data.json` → `ppc-data.json`.** Either (a) the transformation happens manually (operator edits), (b) a missing script, or (c) downstream scripts actually accept either filename and fall through. Worth tracing in deep-dive #17/18.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<folder-path>` | positional #1 | — required | Folder containing Google Ads CSV/TSV exports |

**Env vars:** None.
**Files read:** All files in `<folder-path>`. Encoding auto-detected (UTF-16LE BOM, UTF-8 BOM, UTF-8 fallback) at `readFileAutoEncoding()` lines 22-34.

## 3. Outputs

Written to `ppc-raw-data.json` **in CWD** (line 4 comment, exact path not shown in read-excerpt).

Shape: one top-level key per report type (`keywords: [...], searchTerms: [...], adGroups: [...], ads: [...], audiences: [...], geographic: [...], devices: [...], adSchedule: [...], landingPages: [...], qualityScore: [...], changeHistory: [...]`). Each array is a list of typed row objects.

Per-row cleaners:
- `cleanNum` (line 88-94): strips `$`, `,`, `"`; `parseFloat`; returns `0` if NaN.
- `cleanPct` (line 96-102): strips `%`, `,`, `"`; `parseFloat`; divides by 100; returns 0 if NaN.
- `cleanStr` (line 104-107): strips leading/trailing `"`; trims.

## 4. Annotated walk

**Lines 22-34 — encoding detection.** Reads file as buffer; checks UTF-16LE BOM (FF FE), UTF-8 BOM (EF BB BF), falls through to UTF-8. **Missing:** UTF-16BE, Windows-1252 (common for older Excel exports), ISO-8859-1. Google Ads Editor exports are typically UTF-16LE with tab delimiter — handled.

**Lines 37-41 — delimiter detection.** `tabs > commas ? '\t' : ','`. Works for unambiguous files; fails for TSVs with commas in content (e.g., ad descriptions containing commas in a comma-delimited file count as extra column boundaries).

**Lines 43-85 — `parseCSV(text, delimiter)`.** Hand-rolled CSV parser with quote-escape handling.
- Line 52-58: doubled quote `""` inside a quoted field → literal `"`.
- Line 68: `\r` skipped silently (CRLF handling).
- Line 72: empty rows dropped via `row.some(f => f !== '')`.
- Correct for standard RFC 4180 CSV. May mis-handle exotic Excel quoting edge cases.

**Lines 88-107 — cleaners.**
- `cleanNum` returns 0 on empty, ` --`, non-number. **Ambiguity:** can't distinguish "0 impressions" from "unparsed value." All reports treat 0 as legit. Downstream can't flag truly-missing-data.
- `cleanPct` divides by 100. Expects input like `"3.45%"` → 0.0345. If Google changes export to raw decimal (`"0.0345"`), this re-divides → 0.000345. Silent 100x under-report.
- `cleanStr` strips wrapping quotes — leaves internal quotes unchanged.

**Lines 110-136 — `identifyReportType(reportName, headers)`.** Two-pass heuristic.
- First pass (lines 114-124): filename substring match. "Search term" → `searchTerms`. "Quality score" → `qualityScore`. "Keyword report" OR "Search keyword" → `keywords`. Etc. **Fragile:** Google Ads Editor's export naming conventions have changed at least twice in the last 5 years (e.g., "Keywords" → "Search keywords" → "Search keyword"). A rename = `unknown` category.
- Second pass (lines 127-134): header-based fallback for "untitled" exports. Checks for specific headers like "Quality score", "Device", "Hour of the day". If NEITHER pass matches → `return 'unknown'`. **Silent drop** — unknown rows get parsed but never added to output.

**Lines 139-153 — column mapping.** `buildColMap` lowercases + normalizes whitespace in headers. `col(row, map, ...keys)` looks up first matching key. Allows alias lookup (`'impr.', 'impressions'`) — tolerates Google's on/off abbreviation. Good.

**Lines 156+ — per-report parsers.** One function per report type. Each extracts specific columns via `col(row, m, ...keys)`. Common columns: `impressions, ctr, cost, clicks, convRate, conversions, avgCpc, costPerConv`. Consistent naming across parsers.

Lines 212-246 — `parseAds` handles responsive search ads with up to 15 headlines + 4 descriptions. Captures as arrays after filtering empty/`--`. Good pattern.

**Main loop (not fully read, lines 300+):** iterates files in folder, detects type, parses with appropriate function, accumulates into output object, writes JSON. Output path is implicit CWD-relative.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Not invoked by any skill.** No `ppc-audit.md` exists; `seo-audit.md` doesn't reference it. Script is manual-only. Discoverable only by operators with tribal knowledge. Either wire it into a PPC skill or promote to explicit "manual step" in docs. |
| 2 | **H** | — | **Output filename mismatch with downstream.** Writes `ppc-raw-data.json`. Consumers (`generate-ppc-*`) read `ppc-data.json`. Implicit transformation gap — either missing script or downstream silently falls through. Matt has `ppc/ppc-data.json` but empty `exports/` — suggesting his file was produced OUTSIDE this script's output path. Needs resolution before any PPC audit can be consistently reproduced. |
| 3 | **H** | 110-136 | **Report-type identification via filename/header heuristics is fragile.** Google Ads Editor rename → `unknown` → silent skip. No catchall "unknown" bucket; unknown reports are effectively dropped. Fix: add `unknown: [{reportName, headers, rows}]` bucket so at minimum the raw rows are preserved for manual reassignment. |
| 4 | **M** | 88-102 | **`cleanNum` / `cleanPct` coerce unparseable values to 0.** Can't distinguish legit-zero from garbage-zero. Downstream averages/ratios treat both identically. Low-severity for typical reports (all values are either real numbers or explicit "--") but bites during Google export format changes. |
| 5 | **M** | 96-101 | **`cleanPct` divides by 100 unconditionally.** If Google ever exports raw decimals (0.0345) without `%`, result is 0.000345 — 100× under-report. Defensible for current format but worth a format-detection shim. |
| 6 | **M** | — | **454 lines monolithic.** 11 report parsers + shared helpers in one file. Each parser is ~20-40 lines of column-mapping boilerplate. Codex #2. A per-report-type file structure would make new Google Ads report types easier to add (plug-in pattern). |
| 7 | **M** | 4 | **CWD-relative output (`ppc-raw-data.json`).** Running from wrong directory writes orphan file elsewhere. Inconsistent with gather-*.js family which at least resolves `seo/research/`. Codex #3. |
| 8 | **M** | 22-34 | **Encoding detection covers UTF-16LE + UTF-8 BOM only.** Legacy Excel exports sometimes use Windows-1252 or ISO-8859-1; rare but encountered. Add charset detection library (`chardet`) for robustness. |
| 9 | **M** | 37-41 | **Delimiter detection by raw frequency.** A TSV with many tabs in content AND commas in ad text = edge case. Rare but silent. |
| 10 | **L** | — | **No atomic write** — consistent with pattern across scripts. |
| 11 | **L** | 165 | **`'impr.', 'impressions'` alias lookup** — good; consistently applied. Worth noting Google also uses `impr. (abs. top)` and variants for specific reports not aliased here. |

## 6. Integration map

**Invoked by:** Nothing. Manual CLI.

**Files read:** All files in user-supplied folder (typically `clients/<slug>/ppc/exports/`).

**Files written:** `ppc-raw-data.json` in CWD.

**Consumers of output:** None directly. The gap (`ppc-raw-data.json` vs `ppc-data.json`) means downstream PPC scripts don't read this script's output at all. Either:
- An implicit rename is expected (operator manually renames).
- A transformation layer exists but isn't in the scripts dir.
- Historic: the file used to be `ppc-data.json` and was renamed upstream without coordinating downstream.

**Drift table:**

| Version | Lines | Status |
|---|---|---|
| Template | 454 | current |
| All 8 active clients | 454 | Identical |
| Backup/calgary-castles | 454 | Identical |

**Zero drift** across all copies. Likely because (a) script is manual-only and never gets hand-edited per-client, and (b) it's a mature, single-purpose ingester that hasn't needed version bumps.

**Skill-inline:** no stub; not invoked anywhere.

**Matt Wallmow data state:**
- `clients/matt-wallmow/ppc/` exists with `ppc-data.json`, empty `exports/`, empty `reports/`, empty `research/` (each with only `.gitkeep`).
- The `ppc-data.json` exists without visible source data in `exports/` — provenance unclear. Either seeded manually, or from an external Google Ads export folder outside the repo.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Resolve the `ppc-raw-data.json` vs `ppc-data.json` gap** (bug #2). Either rename the output, add a transformer script, or update downstream consumers to read this file. Highest ROI because it's blocking any reproducible PPC audit today.
2. **Create `commands/ppc-audit.md` skill** (bug #1). Orchestrate: (1) confirm exports folder, (2) run this parser, (3) run downstream spreadsheet/presentation generators. Gets PPC audits out of tribal-knowledge territory.
3. **Add `unknown:[]` catchall bucket** (bug #3). Preserves raw rows for report types the heuristic misses. Operator can inspect and manually reassign.
4. **Make output path explicit** (bug #7). Default to `<folder-path>/../ppc-raw-data.json` or accept `--output <path>`.
5. **Add more encoding fallbacks** (bug #8). `chardet` library or UTF-16BE + Windows-1252 BOMs.
6. **Distinguish "0" from "unparsed" in cleaners** (bug #4). Return `null` for unparseable, `0` only for literal zero. Requires downstream null-handling but eliminates silent garbage.
7. **Consider splitting into per-report-type modules** (bug #6). Not urgent; current structure works. Nice-to-have for adding new report types.

## 8. What to verify before we touch this file

- **Read `generate-ppc-spreadsheet.js` and `generate-ppc-presentation.js`** (deep-dives #19, #20) to determine what shape of `ppc-data.json` they actually expect. If they accept the raw shape from this script (just under a different filename), bug #2 is a rename; if they need transformation, bug #2 requires a new script.
- **Check if Matt's `ppc/ppc-data.json` was hand-crafted or tool-produced.** Open it and look at structure vs this script's output.
- **Verify Google Ads Editor current export filenames** for 2026 — confirm the heuristics still fire on recent exports.
- **Check for `commands/ppc-audit.md`** in git history — maybe it existed once and was deleted.
