# Deep Dive #34 — `template/reports/multipage/shared/utils.js`

**File:** [`template/reports/multipage/shared/utils.js`](/root/site-audit/template/reports/multipage/shared/utils.js) (190 lines)
**Layer:** 08 — shared renderer (shared utilities)
**Date:** 2026-04-20

---

## 1. Purpose

Shared utility library. Key exports (line 170+):
- `esc(str)` — HTML escape (used by every renderer).
- `gradeClass(grade)` — letter grade → CSS class (grade-a/b/c/d/f).
- `severityClass(sev)` — severity label → CSS class.
- `pillClass(prefix, val)` — generic pill-badge class builder.
- `rankClass(rank)` — rank number → color class.
- `formatNumber(n)`, `formatPercent(n, decimals)`.
- `initCollapsibles(scope)`, `makeTablesResponsive()`.
- `getApiErrors(data, sourceFile)`, `renderApiErrorBanner(entry)` — API error surfacing.

## 2. Key observations

**`getApiErrors` (line 149).** Reads `data.apiErrors[]` — the array where the normalizer accumulates errors from gather-script outputs (via `propagateApiErrors`, finding #21 line 714). Renderers call this to check if their data source had errors, then show a banner.

**`renderApiErrorBanner` (line 155).** Converts an error entry into display HTML. Every page renderer uses this for graceful degradation (e.g., `pages/keywords.js` line 168).

**`esc(str)` (line 13).** Standard HTML escape via `document.createElement('div').textContent`. The safe pattern used by every renderer.

**`makeTablesResponsive` (line 124).** Injects `data-label` attributes on `<td>` elements so mobile CSS can re-layout tables as cards. Called by `data-loader.js` boot.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | 21-29 | **`gradeClass` fallback.** If `grade` doesn't match A-F, returns `'grade-d'` (finding #22 #1 — referenced the default). Silent D grade for any non-standard input. Should log warning. |
| 2 | **M** | 149-153 | **`getApiErrors` searches by exact filename match.** `sourceFile === 'domain-metrics.json'` — if normalizer ever renames the source string (e.g., `research/domain-metrics.json`), getter returns null. Brittle. |
| 3 | **L** | 32-44 | **`severityClass` string literals.** If normalizer writes severity as `"HIGH"` (uppercase) instead of `"high"`, no match. Worth `.toLowerCase()` defensively. |
| 4 | **L** | 58-68 | **`rankClass` bucketing** — hardcoded thresholds (1-3 green, 4-10 orange, etc.). Not parameterized. |
| 5 | **L** | 124-148 | **`makeTablesResponsive` operates on `<td>` once** — if a renderer re-renders a table after boot, responsive labels are missing on new rows. |

## 4. Integration map

**Consumed by:** every page renderer. Every call to `esc(...)`, `gradeClass(...)`, `severityClass(...)`, `rankClass(...)`, `getApiErrors(...)` flows through here.

**Called by boot** (data-loader.js): `initCollapsibles()`, `makeTablesResponsive()`.

## 5. Fix / improve suggestions

1. **Add warning log on `gradeClass` fallback** (bug #1).
2. **Defensive `.toLowerCase()` on severity match** (bug #3).
3. **Namespace `data.apiErrors` source names** to avoid brittleness (bug #2).
