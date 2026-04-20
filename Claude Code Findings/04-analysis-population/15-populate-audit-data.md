# Deep Dive #15 — `template/scripts/populate-audit-data.js`

**File:** [`template/scripts/populate-audit-data.js`](/root/site-audit/template/scripts/populate-audit-data.js) (472 lines)
**Layer:** 04 — analysis / population (Markdown→JSON bridge)
**Cross-reference:** [`codex findings/03-data-population-and-normalization/14-populate_audit_data.md`](/root/site-audit/codex findings/03-data-population-and-normalization/14-populate_audit_data.md)
**Template-vs-client drift:** **None — all 4 active clients identical to template at 472 lines.** 4 clients still missing (calgary-castles, mammoth-lakes, murray-gardner, p3realtync). See §6.
**Template-vs-skill drift:** Invoked at `seo-audit.md:753-754` with `--force`. No inline stub.
**Date:** 2026-04-20

---

## 1. Purpose

The **explicit Markdown→JSON bridge.** Parses three AI-written research Markdown files and merges 6 structured fields into `seo/audit-data.json`:

| Field | Source Markdown | Method |
|---|---|---|
| `keywords[]` | `seo/research/keyword-research.md` | "Full Rankings Table" (heading match) |
| `competitorComparison[]` | `seo/research/competitor-analysis.md` | "Executive Comparison Table" |
| `competitorStrategies[]` | `seo/research/competitor-analysis.md` | `## Competitor N:` section split + "Standout approach" bullet extraction |
| `siteComparison[]` | **derived** from `competitorComparison[]` | Aggregates competitor columns into a single range string |
| `contentCalendar` | `seo/reports/FINAL-AUDIT-REPORT.md` | `## Section 8: Content Calendar` heading |
| `advantages[]` | `seo/reports/FINAL-AUDIT-REPORT.md` | `### What [Client] Does Better` heading |

All other audit-data.json fields come from elsewhere (Python analyzers, normalizer fallback, client-config.json, agent-written directly). This script is a bounded populator, not a full-coverage ingest.

**Critically, this is the ONLY explicit Markdown→JSON translation layer.** Everything else relies on normalizer fallback at report-gen time — a late-stage, error-tolerant, but ad-hoc path. Codex strength #1 calls this out as the cleanest bridge in the repo.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `--force` | bool | false | Overwrite fields already populated; default skips |

**Files read (absolute paths, CWD-relative):**
- `seo/audit-data.json` — required; exits 1 if missing.
- `seo/research/keyword-research.md` — for `keywords[]`.
- `seo/research/competitor-analysis.md` — for `competitorComparison[]` + `competitorStrategies[]`.
- `seo/reports/FINAL-AUDIT-REPORT.md` — for `contentCalendar` + `advantages[]`.

Missing MD files → specific field added to `errors[]` (warning only, script continues).

## 3. Outputs

**Writes `seo/audit-data.json` in-place** (line 461). Object.assign merges `updates` onto `data`, then full rewrite. No backup. No atomic rename.

**Field shapes:**
- `keywords[i]`: `{keyword, volume, clientRank, competitorRank: '', topResult}`. `competitorRank` always empty — placeholder for later `gather-keyword-volumes.js` merge.
- `competitorComparison[i]`: `{metric, client, comp1, comp2, comp3, comp4, comp5, gap}`. Padded to comp5 with empty strings.
- `competitorStrategies[i]`: `{competitor, strategy: 'Content Strategy', detail}`.
- `siteComparison[i]`: `{metric, client, competitor, gap}` — `competitor` is `comp1 / comp2 / ... / comp5` joined.
- `contentCalendar`: `{month1Label, month1: [{week, topic, keyword, type}], month2Label, month2: [...], month3Label, month3: [...]}`.
- `advantages[i]`: `{title, detail}`.

**Exit code:** 0 on success (even with warnings). 1 only if `audit-data.json` missing.

## 4. Annotated walk

**Lines 27-33 — paths.** Three MD sources + one JSON target. All `path.resolve`'d from CWD.

**Lines 46-69 — `parseMarkdownTable(text)`.** Pipe-table parser.
- Line 53: filters to lines starting with `|`.
- Line 55: splits on `|`, trims, drops first/last empty cells.
- Line 57: first table row = headers; strips `**` bolding.
- Line 61: skips separator row (`---|---|`).
- Lines 62-66: maps remaining rows to objects `{headerName: cell}`.
- **Edge cases not handled:** tables with escaped `|` inside cells; tables where the separator row is missing entirely; tables nested in blockquotes; tables where headers span multiple rows.

**Lines 75-99 — `extractTableAfterHeading(text, headingRegex)`.**
- Walks lines. Once `headingRegex` matches, starts looking for a `|`-prefixed block.
- Line 91-93: allows ONE blank line inside the table (some MD formatters insert).
- Line 94-95: break on non-table-non-blank line after entering table.
- Returns joined table text.

**Lines 104-106 — `stripMarkdown(str)`.** Removes `**` bolding, leading `#` heading markers, trims. Minimal — doesn't handle `_italic_`, `*italic*`, `[link](url)`, or escaped chars.

**Lines 115-140 — `parseKeywords(md)`.** 
- Line 116-117: tries "Full Rankings Table" heading first; fallback to `/keyword.*table/i`. **Brittle heading dependency.**
- Lines 126-131: **positional column access.** `headers[1]=keyword, headers[2]=volume, headers[3]=clientRank, headers[4]=topResult`. If the MD table has "#" as column 1, "Keyword" as 2, etc. — works. If an agent puts a "Status" column first, shifts break silently.
- Line 137: `competitorRank: ''` — placeholder, never filled by this script. gather-keyword-volumes.js (finding #11) DOES populate `volume`/`cpc`/`competition` fields on the same `keywords[]`, but NOT `competitorRank`. That field remains empty everywhere — confirmed dead slot.

**Lines 148-181 — `parseCompetitorComparison(md)`.**
- Line 149: heading lookup for "Executive Comparison Table" — exact phrase, case-insensitive.
- Lines 159-160: inspects last column — if named "Gap", treats as special last col; else no-gap.
- Lines 162-180: for each row, takes metric (col 0), client (col 1), then iterates remaining columns as `comp1..compN`.
- Line 170: `compCols = hasGap ? headers.slice(2, headers.length - 1) : headers.slice(2)`.
- Line 174-177: pads missing `compN` slots up to `comp5` with empty strings. Always emits a fixed-5-competitor shape regardless of actual competitor count. **Drawback:** a client with 3 competitors gets `comp4` and `comp5` as empty strings, which downstream renderers must handle.

**Lines 189-216 — `parseCompetitorStrategies(md)`.**
- Line 192-193: splits MD on `^## Competitor \d+:/m` — **exact heading format required.** A slight variation (`## Competitor 1 — Name`, `### Competitor 1:`, `## Comp 1:`) breaks the split entirely.
- Line 197-200: regex to re-extract names.
- Line 205: matches bold `**Standout approach:**` or `**Standout approach**:` followed by content. Stops at next bullet/paragraph. Brittle to phrasing.
- Returns `null` if no strategies found, not empty array — upstream checks `parsed.length`, treats null same as empty.

**Lines 223-238 — `parseSiteComparison(compComparison)`.** DERIVED, not parsed from MD.
- Takes `competitorComparison` as input (either freshly parsed or existing from `data`).
- Joins `comp1..comp5` into a single `competitor` string via ` / `.
- Preserves `metric, client, gap`.
- **A parse failure upstream in `parseCompetitorComparison` cascades here** — siteComparison can't be derived from nothing.

**Lines 250-317 — `parseContentCalendar(md)`.**
- Line 252: **hardcoded literal `'## Section 8: Content Calendar'`.** Any variation breaks. If a future audit has "Content Calendar" as Section 7 or uses `###` — no match.
- Line 253-260: uses `indexOf` (not regex) to avoid lazy truncation (good awareness of regex pitfalls).
- Lines 263-314: per month (1, 2, 3) iterates:
  - Matches `**Month N:**` or `**Month N: Label**`.
  - Finds the next `|`-prefixed block and parses as table.
  - Columns: positional `week, topic, keyword, type`.
- Line 309: `parseInt(weekCol)` — if week is "Week 1" or "1a" → `parseInt` returns 1. If "TBD" → NaN → `|| 0` coerces to 0. Silent loss.

**Lines 324-342 — `parseAdvantages(md)`.**
- Line 326: regex `/### What .+? Does Better\n([\s\S]*?)(?=\n---|\n## |\n### |$)/`. Requires EXACT heading `### What X Does Better`. Variations like `## What X Does Better` or `### X's Competitive Advantages` break.
- Line 333: regex for numbered items `/^\d+\.\s+\*\*(.+?)\*\*[.:]?\s*[-—–]?\s*(.+?)$/gm`. Requires: digit + dot + space + `**Title**` + optional punctuation + optional em-dash + detail. If the MD uses `1) Title` or `* **Title**`, no match.

**Lines 346-470 — main.**
- Lines 348-352: load `audit-data.json` or exit.
- Lines 355-357: load the 3 MD files (null-safe).
- Each field section: 3-way branch — source missing → error; already populated + no `--force` → skipped; else parse+populate.
- Line 413: siteComparison source = `updates.competitorComparison || data.competitorComparison` — uses freshly parsed OR existing.
- Line 455-464: **conditional write.** If NO updates, prints "nothing to write." Otherwise `Object.assign(data, updates)` + full-file rewrite.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 116, 149, 192, 252, 326 | **Hardcoded heading literals / exact phrase matches.** Every parser depends on a specific heading phrase: "Full Rankings Table", "Executive Comparison Table", "`## Competitor N:`", "`## Section 8: Content Calendar`", "`### What X Does Better`". Research agents (LLMs) generate these MD files — phrasing variation is expected. A single word shift silently causes a null parse → field not populated → normalizer fallback at report-gen kicks in. Result: intermittent missing data that LOOKS like gather-script failure but is MD-parse failure. Codex #2. Fix: either (a) enforce heading conventions in the agent prompts (seo-audit.md), or (b) accept heading patterns more liberally (multiple regex fallbacks). |
| 2 | **H** | 461 | **No backup, no atomic write of `audit-data.json`.** `Object.assign(data, updates)` then `fs.writeFileSync`. Any crash mid-write corrupts. Any concurrent editor edit (operator opens the file) is silently overwritten. Same bug family as `gather-keyword-volumes.js` #1. Fix: `.bak` copy + `.tmp + rename`. |
| 3 | **H** | 366, 381, 409, 426, 442 | **Skip-if-populated logic causes state dependency.** If a prior run partially populated a field with wrong data (e.g., first 3 rows of 25 keywords due to MD parse glitch), subsequent non-`--force` runs see "25 entries already present" and skip. Bad data persists silently. Fix: record a provenance marker (e.g., `_populatedAt` per field) so re-runs know when to refresh. |
| 4 | **H** | — | **4 clients missing script** (calgary, mammoth, murray, p3realtync) — same pattern. Their audit-data.json has whatever `build_audit.py` wrote but no MD-derived enrichment. |
| 5 | **M** | 126-131, 303-306 | **Positional column access with no name validation.** Columns accessed by index. Any MD-table reordering silently reshuffles which cell goes where. E.g., if an agent writes the keywords table as `| # | Keyword | Top Organic | Client Rank | Est. Volume |` (swapped cols 3-4), the script maps `clientRank <- "Top Organic Result URL"` and `topResult <- "5"`. Data-type violations visible only if downstream renders catch the mis-shape. |
| 6 | **M** | 170, 174-177 | **Fixed 5-competitor padding.** Client with 3 competitors gets `comp4: '', comp5: ''`. Renderers must null-guard every column. For a client with 6 competitors → comp6 silently dropped. Matching the normalizer's auto-mapping (HANDOFF auto-fix #11) — but still limits to 5. |
| 7 | **M** | 192-193 | **`## Competitor N:` split is rigid.** Any variation breaks. Given that research agents are free-form, this is high-risk. Matt's audit has 5 competitors — if all 5 sections use consistent headings this works; one deviation nukes all 5. |
| 8 | **M** | 205 | **"Standout approach" bullet regex.** If the MD uses "`**Key differentiator:**`" or "`**Unique angle:**`", no match. The field's existence relies on EXACT phrasing. |
| 9 | **M** | 326, 333 | **`advantages[]` parser requires EXACT heading + list format.** `### What X Does Better` + numbered items with `**Title**` format. Any variation → zero advantages. |
| 10 | **M** | 469 | **Warnings don't fail the run.** Script exits 0 even if 0 fields were successfully populated. Silent empty-population possible. Codex improvement #2 ("add validation summaries") addresses. |
| 11 | **M** | 309 | **`week` parses via `parseInt \|\| 0`.** Values like "TBD", "Week 2A", "Bi-weekly" all become 0. Downstream may treat 0-week as "week 0" (legitimate) or "unassigned" — ambiguous. |
| 12 | **M** | 137 | **`competitorRank: ''` placeholder never filled.** `gather-keyword-volumes.js` populates `volume`/`cpc`/`competition` on the same `keywords[]` rows but NOT `competitorRank`. Field stays empty everywhere. Either drop from schema or wire a producer. |
| 13 | **L** | 104-106 | **`stripMarkdown` is partial.** Doesn't handle italics, links, escaped chars. Rare but possible contamination. |
| 14 | **L** | 46-69 | **No escape handling in pipe-table parser.** `|` inside a cell breaks the column count. MD spec uses `\|`; parser doesn't resolve. |
| 15 | **L** | 258-260 | **`parseContentCalendar` boundary-detection uses `indexOf('\n## ')`.** If the NEXT section-level heading uses `##` with different spacing (e.g., `##Section 9`), finds wrong boundary. |
| 16 | **L** | 455-458 | **"Nothing to write" path exits 0.** Correct, but no exit code signals "everything was skipped." |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill, Step 5.6 at `seo-audit.md:753-754`:
  ```
  cd "{CLIENT_DIR}"
  node scripts/populate-audit-data.js
  ```
  Single invocation per audit. **Does NOT pass `--force`** per the skill — relies on the skip-if-populated default to avoid clobbering partial data.
- Matt Wallmow: `[04:23] populate-audit-data.js --force ✓ (keywords, competitorComparison, siteComparison)` in audit-log. Ran with `--force` (contradicting skill prescription — operator intervention). 3 fields populated; `competitorStrategies, contentCalendar, advantages` NOT mentioned = likely failed to parse and went silently warning-only.

**Sources (read):**

| File | Produced by |
|---|---|
| `seo/audit-data.json` | build_audit.py + manually / by agent |
| `seo/research/keyword-research.md` | `keyword-researcher` agent (skill Phase 1) |
| `seo/research/competitor-analysis.md` | `competitor-analyzer` agent (skill Phase 1) |
| `seo/reports/FINAL-AUDIT-REPORT.md` | Report-compilation step (skill Phase 4) |

**Writes:**
- `seo/audit-data.json` — in-place.

**Consumers of the 6 populated fields:**

All 6 fields flow downstream into `generate-multipage-report.js` and individual page renderers:
- `keywords` → `pages/keywords.js`
- `competitorComparison` → `pages/competitors.js` comparison table
- `competitorStrategies` → `pages/competitors.js` strategies section
- `siteComparison` → `pages/competitors.js` executive-summary row
- `contentCalendar` → `pages/action-plan.js` calendar tab
- `advantages` → `pages/index.js` advantages callout + `pages/competitors.js`

**Contract:**
- `keywords[i]` always has `competitorRank: ''` placeholder.
- `competitorComparison[i]` always has `comp1..comp5`, some possibly empty.
- `contentCalendar.month1..month3` always present as arrays, possibly empty.
- Missing fields → null (downstream normalizer's job to handle).

**Drift table:**

| Version | Lines | Status |
|---|---|---|
| Template | 472 | current |
| matt-wallmow | 472 | Identical |
| chris-nevada | 472 | Identical |
| laura-willis | 472 | Identical |
| liane-jamason | 472 | Identical |
| calgary-castles | — | MISSING |
| mammoth-lakes | — | MISSING |
| murray-gardner | — | MISSING |
| p3realtync | — | MISSING |

**Zero drift across the 5 clients that have the script** — first clean-slate finding of the session.

**Skill-inline:** no stub.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Enforce heading conventions in the research-agent prompts** (bug #1). In `commands/seo-audit.md` agent definitions (keyword-researcher, competitor-analyzer), include explicit "YOU MUST use this exact heading: `### What {Client} Does Better`" instructions. One-sided fix that doesn't touch this script but dramatically improves reliability. Already partially done — e.g., the skill specifies "Executive Comparison Table" — but enforcement language could be strengthened and extended to all 5 magic-string headings.
2. **Atomic + backed-up write of audit-data.json** (bug #2). `.bak` copy + `.tmp + rename`. Same fix as gather-keyword-volumes.js. Coordinated PR across both scripts.
3. **Add `_populatedAt` per-field provenance marker** (bug #3). Each field gets `{value: ..., _populatedAt: iso, _populatedBy: 'populate-audit-data.js@v1'}` — or a top-level `_populatedFields: {keywords: iso, ...}`. Re-runs can detect staleness and refresh even without `--force`.
4. **Multiple-pattern heading lookup.** For each parser, try 2-3 heading patterns before giving up. E.g., `parseAdvantages` could accept `### What X Does Better`, `### Competitive Advantages`, `### Client Strengths`. Keeps skill prompts strict while tolerating minor deviation.
5. **Named-column access with positional fallback** (bug #5). Try `row.Keyword || row.Term || row[1]` — match by header first, fall back to position. Degrades gracefully.
6. **Validation summary at end** (codex improvement #2). List which fields are still unpopulated after the run — operator sees exactly what failed. Exit 2 (not 0) if >50% fields failed → CI can detect.
7. **`--dry-run` mode** (codex improvement #2). Print what WOULD be written without touching the file. Essential for debugging regex breakage.
8. **Template-copy into the 4 missing clients.**
9. **Wire `competitorRank` producer or drop the field** (bug #12). Dead slot.
10. **Handle escaped `|` in tables** (bug #14). Cheap cosmetic fix.

## 8. What to verify before we touch this file

- **Confirm which clients' `audit-data.json` is the freshest.** If Matt's file was populated 5 days ago and the research MDs have been edited since, re-running populates fresh; if populated at the same time, no change. Timestamps on files give a read.
- **Open Matt's `keyword-research.md` and `competitor-analysis.md`** — confirm the headings match the magic strings. If not, bug #1 is LIVE for him.
- **Check `competitorStrategies` presence in Matt's audit-data.json.** Audit-log says 3 fields populated with `--force`; strategies NOT listed, meaning parseCompetitorStrategies probably failed silently. Open the MD, find `## Competitor N:` — is the format right?
- **Test the "`audit-synthesis`" source origin** (finding #13 bug #8 open trail). Grep for `'audit-synthesis'` literal. It's NOT in populate-audit-data.js (I just read the whole file). So the mystery continues — likely a research agent's output or a normalizer path. Deep-dive #21 (normalizer) may reveal. Track as cross-finding concern.
- **Verify no normalizer path ALSO populates these 6 fields.** If `generate-multipage-report.js` has fallback parsers for the same MDs, the two paths could collide silently. HANDOFF.md auto-fixes don't list these fields by name — but a grep is due.
