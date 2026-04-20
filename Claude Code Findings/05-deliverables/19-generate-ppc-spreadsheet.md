# Deep Dive #19 — `template/scripts/generate-ppc-spreadsheet.js`

**File:** [`template/scripts/generate-ppc-spreadsheet.js`](/root/site-audit/template/scripts/generate-ppc-spreadsheet.js) (194 lines)
**Layer:** 05 — deliverables (PPC XLSX)
**Cross-reference:** [`codex findings/04-report-generators/20-generate_ppc_spreadsheet.md`](/root/site-audit/codex findings/04-report-generators/20-generate_ppc_spreadsheet.md)
**Template-vs-client drift:** **None — all 9 clients + Backup identical at 194 lines.** Fifth consecutive zero-drift finding.
**Template-vs-skill drift:** **Not invoked by any skill** — orphan, same as `parse-google-ads.js` (finding #16).
**Date:** 2026-04-20

---

## 1. Purpose

The **PPC audit XLSX deliverable.** Reads `ppc/ppc-data.json` and generates a 6-sheet workbook at `ppc/reports/PPC-Audit-GamePlan.xlsx`:

1. **Executive Summary** — client metadata, campaign settings, health dashboard, "The Core Problem," top issues.
2. **Ad Group Performance** — top 5 / bottom 5 performers, budget breakdown.
3. **Keyword Analysis** — dead keywords, missing extensions, ad-copy improvements.
4. **Search Term Audit** — wasted queries + negative keyword recommendations across 5 categories.
5. **Optimization Plan** — 4-phase action plan (immediate, week 2-3, month 1-2, month 2-3).
6. **Budget Reallocation** — spend shifts + projected impact.

Pure generator. Dependency: `xlsx`.

## 2. Inputs

| Arg | Default | Purpose |
|---|---|---|
| `--data <path>` | `__dirname/../ppc/ppc-data.json` | Source JSON |

**Feeder gap:** `parse-google-ads.js` (finding #16) writes `ppc-raw-data.json`, but THIS script reads `ppc-data.json`. **Finding #16's bug #2 confirmed here** — no code in the repo transforms raw → ppc-data.json. Either manual curation or a missing middleware.

## 3. Outputs

`path.join(__dirname, '..', 'ppc', 'reports', 'PPC-Audit-GamePlan.xlsx')` (line 190-192). **Auto-creates `ppc/reports/`** (line 191) — `fs.mkdirSync({recursive: true})`. **This is better than `generate-spreadsheet.js`** (finding #17 #3) which does NOT create its output dir.

## 4. Annotated walk

**Lines 7-17 — CLI + load.** Standard pattern. Exit 1 if `ppc-data.json` missing.

**Sheet 1 — Executive Summary (lines 19-50).** 24 field reads on `d.client.*` (9), `d.campaignHealth`, `d.theProblem.*` (6), `d.topIssues`. Line 37: `h.status.toUpperCase()` assumes string — null throws TypeError.

**Sheet 2 — Ad Group Performance (lines 52-68).**
- Line 55: `d.topPerformers.length + d.bottomPerformers.length + (d.budgetBreakdown.length || 0)` — confusing: "All N ad groups" sums three arrays that likely overlap. Top 5 + bottom 5 + full breakdown is probably double-counting.
- Line 59, 63, 67: `$${p.cost.toFixed(2)}` — if `p.cost` is null, TypeError. Schema expects number; no guard.
- `p.costPerConv.toFixed(2)` same pattern.

**Sheet 3 — Keyword Analysis (lines 70-87).**
- `d.keywordIssues.{broadMatchProblem, deadKeywords, missingExtensions}` — nested structure; any missing subfield throws.
- `d.adCopyImprovements` separate top-level array. Inconsistent nesting with `keywordIssues`.

**Sheet 4 — Search Term Audit (lines 89-117).**
- `d.budgetWaste.{totalWasted, percentWasted, topWastedQueries}`.
- `d.negativeKeywords.{geographic, price, competitor, brand, unrelated}` — 5 categorized lists. If any category is `undefined`, `.map` throws.
- Line 99: `$${q.cost.toFixed(2)}` — same pattern.

**Sheet 5 — Optimization Plan (lines 119-138).** Same nested-offset counter pattern as `generate-spreadsheet.js` Sheet 4.

**Sheet 6 — Budget Reallocation (lines 140-155).**
- `d.budgetReallocation[].{adGroup, currentSpend, recommendedPct, change, reason}` — line 146.
- `d.projectedImpact.{currentCostPerLead, projectedCostPerLead, currentLeadQuality, projectedLeadQuality, estimatedMonthlySavings, explanation}` (6 fields) — line 150-154.
- Line 146: `$${b.currentSpend.toFixed(2)}` — TypeError risk.

**Lines 157-194 — workbook assembly.** Same `addSheet` helper as #17. Line 191 auto-creates output dir.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Not invoked by any skill** (same as parse-google-ads.js). PPC workflow is tribal knowledge. Needs `commands/ppc-audit.md` to orchestrate the full PPC flow. |
| 2 | **H** | — | **Upstream gap (finding #16 #2).** Expects `ppc-data.json` which nothing produces. `parse-google-ads.js` writes `ppc-raw-data.json`. Transformation layer is missing from the codebase. Without it, THIS script cannot run on a fresh client. Matt has `ppc-data.json` but empty `ppc/exports/` — provenance unclear. |
| 3 | **H** | — | **No schema validation.** 30+ required fields across 6 sheets. Partially populated ppc-data.json crashes at the missing field. Same pattern as #17 #2 + #18 #2. |
| 4 | **M** | 37, 59, 63, 67, 99, 146 | **`.toFixed(2)` / `.toUpperCase()` without null guards.** Any null numeric/string field throws TypeError. Failure mode: script crashes at slide-boundary with "Cannot read properties of null (reading 'toFixed')" — no helpful context. |
| 5 | **M** | 55 | **Potentially double-counted ad-group count.** `d.topPerformers.length + d.bottomPerformers.length + d.budgetBreakdown.length`. Top/bottom are likely subsets of budgetBreakdown; sum is 2× actual. Display value `"All N ad groups ranked..."` overstates count. |
| 6 | **M** | 75, 79, 82 | **Inconsistent keyword-issue nesting.** `d.keywordIssues.broadMatchProblem` (string), `d.keywordIssues.deadKeywords[]`, `d.keywordIssues.missingExtensions[]`, then `d.adCopyImprovements[]` at top level (not nested). Mixed structure; easy to mis-author. |
| 7 | **M** | 104, 107, 110, 113, 116 | **5 fixed negative-keyword categories.** If a 6th category is added to the data, silently dropped. If a category is missing, `.map` throws. Consider dynamic iteration over categories. |
| 8 | **L** | 193 | **Non-atomic XLSX write.** Cross-cutting. |
| 9 | **L** | 55 | **"All ${N} ad groups" literal** — presumptive number of ad groups; no guard if fields missing. |
| 10 | **L** | 125, 129, 133, 137 | **Action-plan offset-chain counter** — same pattern as `generate-spreadsheet.js` #9. Refactor candidate across both. |

## 6. Integration map

**Invoked by:** Nothing. Not in skill. `npm run ppc-spreadsheet` may exist in package.json — worth confirming during #20.

**Reads:** `ppc/ppc-data.json` (schema-heavy; 30+ expected fields).

**Writes:** `ppc/reports/PPC-Audit-GamePlan.xlsx`.

**Consumers:** None (deliverable).

**Contract:** Full schema for the 6 sheets listed in §4 walk. Missing ANY field crashes.

**Drift table:** 194 lines identical across template + 9 clients + Backup. Zero drift.

**Skill-inline:** no stub; not invoked.

**Matt Wallmow PPC state:**
- `ppc/ppc-data.json` exists (was generated somehow).
- `ppc/reports/` empty — this script has NEVER run for Matt.
- `ppc/exports/` empty — no Google Ads source data staged.
- Implies: someone hand-authored `ppc-data.json` but never ran the deliverable generators.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Create `commands/ppc-audit.md` skill** (bug #1). Orchestrate: stage exports → run `parse-google-ads.js` → transform raw → `ppc-data.json` → run this script + presentation. Coordinated with finding #16 #2.
2. **Build the raw→ppc-data.json transformer** (bug #2). Highest blocking item. Without it, no PPC audit is reproducible. Likely a normalizer script that augments raw parsed data with agent-authored analysis (top/bottom performers, negative keyword recommendations, action plans).
3. **Schema validator shared with generate-spreadsheet.js / generate-presentation.js** (bug #3). Single `lib/validate-data.js` — each generator calls it with its own required-fields list before running.
4. **Null-guard numeric fields** (bug #4). Wrap `.toFixed(2)` with `(x ?? 0).toFixed(2)`. Prevents cryptic crashes.
5. **Fix the count sum** (bug #5). Display the count from the source-of-truth array rather than summing three overlapping sets.
6. **Harmonize keyword-issue nesting** (bug #6). Move `adCopyImprovements` under `keywordIssues` OR flatten all PPC-audit data fields.
7. **Dynamic negative-keyword categories** (bug #7). Iterate `Object.entries(d.negativeKeywords)` with labels from a mapping.

## 8. What to verify before we touch this file

- **Open Matt's `ppc/ppc-data.json`** — inspect which fields are present. Determines whether ANY generator could run today, or the file is a stub.
- **Grep `package.json` for `ppc-spreadsheet`** — confirm `npm run` alias exists or not.
- **Find the `ppc-data.json` schema authority** — is it documented anywhere? A JSON Schema or agent prompt would reveal the intended shape. Current evidence: implicit, script-by-script.
- **Before wiring the skill (fix #1), confirm a PPC audit playbook exists** — stakeholders need to know the inputs (CSV exports), analysis step (agent or script), and outputs. Wiring without a playbook just formalizes chaos.
- **Check if `generate-ppc-presentation.js` reads the same `ppc-data.json`** — likely yes; schema fix must cover both.
