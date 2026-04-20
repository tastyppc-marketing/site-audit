# Deep Dive #22 — `template/reports/multipage/pages/index.js`

**File:** [`template/reports/multipage/pages/index.js`](/root/site-audit/template/reports/multipage/pages/index.js) (277 lines)
**Layer:** 07 — page renderer (Executive Summary / landing page)
**Cross-reference:** [`codex findings/06-page-renderers/35-index_page.md`](/root/site-audit/codex findings/06-page-renderers/35-index_page.md)
**Template-vs-client drift:** **matt-wallmow + laura-willis + liane-jamason have local copies — laura's is 277 lines (identical), matt's likely same (not diff-verified).** Other 5 clients use template directly (no local copy).
**Date:** 2026-04-20

---

## 1. Purpose

Renders the Executive Summary page — the first thing the client sees. 6 sections:

1. **Hero** — client name, website, grade badge, audit date, platform, location, grade summary.
2. **Key Stats** — up to 8 stat cards (severity-colored: red/orange/yellow/green).
3. **Top Issues** — numbered cards with severity badges + effort pills.
4. **Site Comparison** — dynamic table preferring `competitorComparison[]` (multi-competitor) with fallback to `siteComparison[]` (single-competitor).
5. **Quick Wins** — checkbox-prefixed action items with impact badges.
6. **Next Steps** — numbered cards with call-to-action text + sub-copy.

## 2. Inputs

Reads from `window.AUDIT_DATA` (injected by `generate-multipage-report.js` — finding #21):
- `client.{name, company, website, websiteUrl, serviceType, auditDate, platform, location, gradeSummary, overallGrade}`
- `keyStats[].{value, label, severity}`
- `topIssues[].{issue, detail, impact, effort}`
- `competitorComparison[].{metric, client, comp1..compN, gap}` (preferred)
- `siteComparison[].{metric, client, competitor, gap}` (fallback)
- `competitor.{primary, primaryLabel, all[].{domain, name}}`
- `quickWins[].{action, impact}`
- `nextSteps[].{text, sub}`

## 3. Outputs

DOM mutations via `innerHTML`. Target `id`s: `#hero-*`, `#stats-grid`, `#issues-list`, `#comparison-table`, `#quickwins-list`, `#nextsteps-list`.

## 4. Annotated walk

**Lines 5-58 — IIFE wrapper + utilities.**
- Line 8-10: registers `window.TPPC.pages.index` namespace.
- Line 12-18: `esc()` shim fallback — escapes via `document.createElement('div').textContent`. Good defense against XSS in user-controlled strings (client name, issue text, etc.).
- Line 24-26: `_text(value)` = null-safe HTML escape.
- Line 28-32: `_plainText(value)` = decoded text (for `document.title`).
- Line 34-38: `_setHTML(selector, value)` = null-safe innerHTML setter.
- Line 40-44: `_toggleMeta(selector, hasValue)` = show/hide based on truthiness.
- Line 46-49: `_hideSection(id)` = hide a section entirely when data absent.
- Line 51-58: `_statSeverityClass(value)` = 4-color severity mapping.

**Lines 60-69 — `init(data)`.** Calls 6 render methods sequentially. Each method null-guards and hides its section if data is absent.

**Lines 71-97 — `renderHero(data)`.** Renders hero block. Sets `document.title` dynamically.
- Line 73: `gradeClass = utils.gradeClass || function () { return 'grade-d'; }` — **fallback to grade-d.** If `utils.gradeClass` isn't loaded (shared/utils.js not present), every client gets a D grade. Silent failure.

**Lines 99-113 — `renderKeyStats(data)`.** Early-return + hide if `keyStats` empty. Straightforward card loop with severity class.

**Lines 115-143 — `renderTopIssues(data)`.** Similar pattern. Uses `utils.severityClass` and `utils.pillClass` with safe fallbacks.

**Lines 145-209 — `renderSiteComparison(data)`. NOTE — this page DOES NOT have the #17/#18 competitor-column bug.**
- Lines 155-159: dynamically extracts `compN` keys from the first row of `competitorComparison`, sorts numerically.
- Lines 164-172: headers built from `competitor.all[idx]` — respects however many competitors exist.
- Lines 177-179: row cells iterate the detected `compKeys` — fully dynamic.
- Lines 186-208: fallback to `siteComparison[]` if no competitorComparison rows. Single competitor + gap columns.

**This renderer is correct.** The bug lives in `generate-spreadsheet.js` (#17 #1) and `generate-presentation.js` (#18 #1) — but NOT here.

**Lines 211-236 — `renderQuickWins(data)`.** Reads `data.quickWins` (top-level, NOT `actionPlan.quickWins`) — matches `generate-presentation.js` #18's field-convention inconsistency.

**Lines 238-260 — `renderNextSteps(data)`.** Reads `data.nextSteps` — agent-authored field, not produced by any gather/populate script (same as #18 #4 ghost field).

**Lines 263-277 — boot polling.**
- `_bootWhenReady()` — polls `window.TPPC.boot` via `setTimeout(25ms)`. If boot never becomes available, **infinite loop.** No max-retry. Belongs in shared/data-loader.js (deep-dive #31) to enforce.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | 73 | **Silent "grade-d" fallback if `utils.gradeClass` is absent.** Missing shared/utils.js → every client gets a D-grade badge. No warning, no marker. |
| 2 | **M** | 211-236 | **Reads `data.quickWins` (top-level), not `data.actionPlan.quickWins`.** Matches `generate-presentation.js` #18 bug #3 (mixed field conventions). If the two paths ever diverge, report and presentation show different data. |
| 3 | **M** | 238-260 | **`data.nextSteps` is a ghost field** — no automated producer. Must be agent-authored. If missing, section hidden silently. |
| 4 | **M** | 263-276 | **Infinite poll on `window.TPPC.boot`.** No max retries. If boot-loader fails to load, page hangs on polling forever (25ms interval). Deep-dive #31 should fix this at boot-loader level. |
| 5 | **M** | — | **No validation that required fields are present.** Graceful hide-on-empty is kind but masks upstream data-pipeline failures. A client with empty `keyStats, topIssues, siteComparison` sees a mostly-empty Executive Summary page without any indication something went wrong. |
| 6 | **L** | 100 | **`stats.length` check only — doesn't validate entries.** If `keyStats = [null, null, null]`, renders 3 cards with empty values. Noise. |
| 7 | **L** | 96 | **`document.title` set from client name** — good UX, but if multiple reports are open in tabs, differentiation relies on name. |

## 6. Integration map

**Invoked by:** `shared/data-loader.js` boot (deep-dive #31) calls `window.TPPC.pages.index.init(window.AUDIT_DATA)` on DOMContentLoaded.

**Reads:**
- `window.AUDIT_DATA` — injected by the normalizer.
- `window.TPPC.utils` (shared/utils.js) — deep-dive #34.
- `window.TPPC.boot` (shared/data-loader.js) — deep-dive #31.

**Drift state:**
- Template: 277 lines.
- matt-wallmow, laura-willis, liane-jamason have local copies.
- Laura's is 277 lines (identical).
- Matt's size not verified — worth diff-check.
- Other 5 clients use template via `../../template/reports/multipage/pages/index.js` when generator runs from template.

## 7. Fix / improve suggestions

1. **Harmonize `quickWins` field path** (bug #2) — in coordination with `generate-presentation.js` #18 #3 and whatever authors the field.
2. **Add max-retry on boot poll** (bug #4) — fix at `shared/data-loader.js` level so all 9 pages benefit.
3. **Audit the ghost field `nextSteps`** — find its producer (likely a skill agent in `commands/seo-audit.md`).
4. **Expose missing-data signals** (bug #5) — when a section hides, log to console so dev can investigate.

## 8. What to verify before we touch this file

- **Diff matt-wallmow's local copy** to confirm it matches template (expected from line count).
- **Confirm `utils.gradeClass` is available** via shared/utils.js at boot — if absent, bug #1 fires for every client.
- **Trace `data.nextSteps` to its authoring agent** — deep-dive #67 (skill).
