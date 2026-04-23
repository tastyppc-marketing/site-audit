# Deep Dive #17 — `template/scripts/generate-spreadsheet.js`

**File:** [`template/scripts/generate-spreadsheet.js`](/root/site-audit/template/scripts/generate-spreadsheet.js) (150 lines)
**Layer:** 05 — deliverables (XLSX export from audit-data.json)
**Cross-reference:** [`codex findings/04-report-generators/15-generate_spreadsheet.md`](/root/site-audit/codex findings/04-report-generators/15-generate_spreadsheet.md)
**Template-vs-client drift:** **None — all 8 active clients + Backup identical at 150 lines.** Second consecutive zero-drift finding. An archived fork at `archive/.../root-scripts-old` (259 lines) is a pre-parameterized v1 with hardcoded client data (Tisha Digman / Summit Sotheby's) — deprecated.
**Template-vs-skill drift:** Invoked at `seo-audit.md:1255` as Step 8b. No inline stub.
**Date:** 2026-04-20

---

## 1. Purpose

The **XLSX deliverable generator.** Reads `seo/audit-data.json` and produces a 6-sheet workbook at `seo/reports/SEO-Audit-GamePlan.xlsx`:

1. **Executive Summary** — client metadata, top 5 issues, site-comparison snapshot.
2. **Keyword Research** — full keyword table with client + primary-competitor ranks.
3. **Competitor Comparison** — metric-by-metric table across competitors.
4. **Action Plan** — quick wins, short-term, medium-term, long-term actions.
5. **Content Calendar** — 3 months of topics/keywords/types.
6. **Deliverables** — ready-to-deploy items + pages + blog posts created.

Uses the `xlsx` npm library. Pure generator — no API calls, no mutation of source data.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `--data <path>` | flag+value | `../seo/audit-data.json` | Source JSON (`__dirname`-relative fallback) |

**Env vars:** None.
**Dependencies:** `xlsx` (npm).

## 3. Outputs

Written to `path.join(__dirname, '..', 'seo', 'reports', 'SEO-Audit-GamePlan.xlsx')` (line 148). `__dirname`-resolved — running from any CWD writes to the same location (unlike the CWD-relative pattern in `gather-*.js`).

Binary XLSX, 6 sheets, fixed column widths (lines 124-146).

## 4. Annotated walk

**Lines 7-17 — CLI + load.** Tolerates `--data`; otherwise `__dirname/../seo/audit-data.json`.

**Lines 19-36 — Sheet 1 (Executive Summary).** Direct field access:
- `d.client.website, d.client.name, d.client.company, d.client.websiteUrl, d.client.platform, d.client.auditDate, d.client.overallGrade` — 7 client fields required.
- `d.topIssues` — array, mapped with `{issue, detail, impact, effort}`.
- `d.siteComparison` — array from `populate-audit-data.js` (finding #15).
- **No null guards.** If any of these fields is missing or null, the script throws at that line. `d.client` could be `null` (`TypeError: Cannot read properties of null (reading 'website')`).

**Lines 38-47 — Sheet 2 (Keywords).** Uses `d.keywords` extensively. Count calc at line 39 `d.keywords.length > 0 ? d.keywords.length : 25` — if array is empty, shows 25. **Misleading:** 25 is a fallback display value, not a true count.

**Lines 49-60 — Sheet 3 (Competitor Comparison). THE BUG.**
- Line 51: `d.competitor.all.forEach(c => compHeaders.push(c.name))` — **dynamically builds headers** from all competitors.
- Line 56-58: **rows hardcoded to `row.comp1 || '', row.comp2 || ''`** — only 2 competitors written. `comp3, comp4, comp5` DROPPED. Headers show up to N competitor names, rows show 2 columns of data. Mismatch produces a table with real data in first 2 competitor columns and empty in the rest. Matt has 5 competitors — his spreadsheet shows Shorewest, Eliasonrealty, Pinepointrealty, Northwoodshomefinder, Redman as column headers but only 2 of them have data per row. Codex weakness #2.

**Lines 62-81 — Sheet 4 (Action Plan).** Reads `d.actionPlan.{quickWins, shortTerm, mediumTerm, longTerm}`. If any of these arrays are missing → `TypeError: Cannot read properties of undefined (reading 'map')`.

**Lines 83-98 — Sheet 5 (Content Calendar).** Reads `d.contentCalendar.{month1Label, month1, month2Label, month2, month3Label, month3}`. Populate-audit-data.js populates these (finding #15). If it failed to parse the MD (very likely per #15 bug #1), calendar is empty or missing keys.

**Lines 100-113 — Sheet 6 (Deliverables).** Reads `d.deliverables, d.keyPagesCreated, d.blogPostsCreated`. Three separate arrays.

**Lines 116-150 — workbook assembly.**
- Line 118-122: `addSheet(wb, data, name, colWidths)` helper.
- Fixed column widths per sheet.
- Line 148: output path.
- Line 149: `XLSX.writeFile` — **non-atomic.** If the write fails mid-way, output file is corrupt.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 56-57 | **Competitor column data mismatch.** Headers dynamically built from `d.competitor.all` (line 51) — can have 5+ competitor names. Rows hardcoded to `comp1, comp2` only (line 57). Clients with 3+ competitors get empty columns. Matt's report likely shows 5 headers but data only in first 2. Silent — no warning. Fix: iterate `d.competitor.all` length and map `comp${i+1}` dynamically. |
| 2 | **H** | 17-35, 38-47, etc. | **No schema validation.** Direct access to deeply nested fields. Any missing top-level field (`d.client`, `d.keywords`, `d.actionPlan`, `d.contentCalendar`, etc.) throws TypeError. No pre-flight check, no defaults. A partially populated audit-data.json breaks the entire generation. Codex #1. Fix: validator pass at the top that reports which fields are missing before attempting generation. |
| 3 | **M** | 148 | **Output dir may not exist.** `XLSX.writeFile` doesn't create parent dirs. If `seo/reports/` missing, write fails. Codex #3. Fix: `fs.mkdirSync(outDir, {recursive: true})` before write. |
| 4 | **M** | 39-40 | **`kwHeader` fallback to literal 25.** If `d.keywords` is empty, header shows "25 Keywords" — wrong count. If array is missing entirely, `d.keywords.length` throws. Fix: `const kwCount = Array.isArray(d.keywords) ? d.keywords.length : 0`. |
| 5 | **M** | 34 | **Hardcoded competitor-primary label assumption.** `` `#1 Competitor (${d.competitor.primaryLabel})` `` — depends on `d.competitor.primaryLabel` field. If populate-audit-data hadn't run, this is undefined → shows "undefined" literally. |
| 6 | **M** | — | **Doesn't read `client-config.json`.** All client metadata must come from `audit-data.json`. If audit-data is stale or incomplete, client info is wrong/empty. Compare to sibling `generate-presentation.js` which may or may not. |
| 7 | **L** | 149 | **Non-atomic write.** Cross-cutting. |
| 8 | **L** | 119 | **No styling.** Bare `aoa_to_sheet` — no fonts, no bold, no freeze panes. Headers look like data rows. For a client-facing deliverable, this is a UX gap. |
| 9 | **L** | 67, 71, 75, 79 | **Action-plan row numbering continues across sections** (line 72: `i + 1 + d.actionPlan.quickWins.length`). Correct by design but easy to mis-edit — a maintainer adding a new section would have to manually update the offset chain. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill, Step 8b at `seo-audit.md:1255`: `node scripts/generate-spreadsheet.js`. Single invocation.
- `npm run spreadsheet` alias in template + every client's `package.json`.
- Matt Wallmow: `seo/reports/SEO-Audit-GamePlan.xlsx` (44.4 KB, Apr 15 11:54) — generated successfully.

**Files read:**
- `seo/audit-data.json`.

**Files written:**
- `seo/reports/SEO-Audit-GamePlan.xlsx`.

**Consumers of the XLSX:** Not consumed by any code — this is a deliverable for the client.

**Contract (implicit):** `audit-data.json` must have:
- `client.{website, name, company, websiteUrl, platform, auditDate, overallGrade}`
- `topIssues[].{issue, detail, impact, effort}`
- `siteComparison[].{metric, client, competitor, gap}`
- `keywords[].{keyword, volume, clientRank, competitorRank, topResult}`
- `competitor.{primary, primaryLabel, all[].name}`
- `competitorComparison[].{metric, client, comp1, comp2, gap}` ← only uses comp1/comp2
- `actionPlan.{quickWins, shortTerm, mediumTerm, longTerm}[].{action, why, effort, impact}`
- `contentCalendar.{monthNLabel, monthN[].{week, topic, keyword, type}}`
- `deliverables[].{name, scope, score, status}`
- `keyPagesCreated[]`, `blogPostsCreated[]`

**Drift table:** All 150-line copies identical. Zero drift.

**Skill-inline:** no stub.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Fix competitor column dynamic mapping (bug #1).** Replace `row.comp1 || '', row.comp2 || ''` with `d.competitor.all.map((_, i) => row[`comp${i+1}`] || '')`. One-line fix; huge correctness win for any client with 3+ competitors.
2. **Add schema validator at top (bug #2).** Check required fields; report all missing at once; exit 1 with a list. Turns a crashing run into a pre-flight error message.
3. **Auto-create `seo/reports/` dir (bug #3).** `fs.mkdirSync({recursive: true})` before write. One line.
4. **Add styling pass** (bug #8). Bold headers, freeze first row, wider wrapping. `xlsx` supports all of these. Meaningful UX improvement for deliverable quality.
5. **Default/empty-guard the length-fallback** (bug #4). Cosmetic.
6. **Atomic write** — cross-cutting.

## 8. What to verify before we touch this file

- **Open Matt's spreadsheet and confirm bug #1 manifests.** His 5 competitor headers + only 2 populated columns = visible in Sheet 3. If confirmed, prioritizes fix #1.
- **Check `audit-data.json` for all 8 required sections** across all clients. If any client is missing `actionPlan.quickWins` (or similar), this script currently crashes silently or produces an empty sheet.
- **Confirm `d.competitor.all[i].name` is a string** — not nested object. If nested, headers show `[object Object]`.
- **Check `generate-ppc-spreadsheet.js`** (deep-dive #19) — likely has identical bugs given the pattern consistency. Fixes should cascade across both.

---

## Additional Information

### Tier 3 Fix 8 — dynamic competitor-column iteration (commit `257ee52`, 2026-04-23)

`generate-spreadsheet.js:50-66` (Sheet 3 "Competitor Comparison") had two
related bugs in the same block:
- Header iterated `d.competitor.all.forEach(...)` dynamically, but body row
  builder hardcoded `[row.metric, row.client, row.comp1 || '', row.comp2 || '', row.gap || '']` — only 5 cells.
- Header had **no Gap column** at all — so even when body produced a gap
  value, it landed in the wrong column visually.

Fix mirrors the canonical pattern from `template/reports/multipage/pages/competitors.js:64-71`
(`getCompetitorColumnKeys`): derive column count from the comparison row's
`compN` keys, NOT from `d.competitor.all`. Discovered during matt-wallmow
verification that the two can diverge — his `competitor.all` has 5 entries
but his `competitorComparison` rows have `comp1..comp6` keys (extra `comp6`
without metadata). Iterating `competitor.all` would have silently dropped
the comp6 data. Fallback header label is `'Comp ' + (i + 1)` when metadata
is missing (matches `getCompetitorName`'s fallback in pages/competitors.js:61).

Also adds the missing `'Gap'` header.

### Verification on matt-wallmow

- Pre: header row 8 cells (no Gap), body row 5 cells. Gap value silently
  landed under "comp3 name" header. comp3-comp6 cells empty under labeled
  headers.
- Post: header `[Metric, ClientWebsite, comp1Name..comp6Name (Comp 6 fallback for comp6), Gap]`
  = 9 cells. Body row 9 cells matching, with `skagenteam.firstweber.com`
  populated under "Comp 6".

Decision: pattern is inlined per-generator rather than extracted to a shared
helper. Two call sites, ~10 lines each — premature abstraction would obscure
the fix. `pages/competitors.js` stays as the canonical reference.

### Slide-overflow eyeball

XLSX is a tabular format — column widths flex automatically based on content.
No overflow concerns at any practical comp count. The Excel file opens
cleanly on matt with all 9 cols visible. PPTX has tighter geometric
constraints — see addendum on `18-generate-presentation.md`.
