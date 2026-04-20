# Deep Dive #24 — `template/reports/multipage/pages/content.js`

**File:** [`template/reports/multipage/pages/content.js`](/root/site-audit/template/reports/multipage/pages/content.js) (724 lines)
**Layer:** 07 — page renderer (Content page — readability + thin content + duplicates + cannibalization + structure)
**Cross-reference:** [`codex findings/06-page-renderers/38-content_page.md`](/root/site-audit/codex findings/06-page-renderers/38-content_page.md)
**Template-vs-client drift:** **laura-willis's copy is 689 lines (35 lines behind template).** Missing: the expand/collapse "+N more" interactive toggle + 2 readability helper functions. Matt + Liane not verified but same cohort expected.
**Date:** 2026-04-20

---

## 1. Purpose

Renders the Content page — 6 sections:
1. **Content Overview** — content quality summary stats.
2. **Readability Table** — per-page Flesch scores, syllables/word, word count.
3. **Thin Content** — pages below word-count threshold.
4. **Duplicate Groups** — near-duplicate page clusters.
5. **Cannibalization** — keyword-cannibalization analysis.
6. **Structure Audit** — H1/H2/H3 hierarchy + heading issues.

## 2. Inputs

Reads `data.contentQuality` extensively (from Python `ContentQualityAnalyzer` or normalizer fallback — finding #6 §6).

Key sub-fields:
- `contentQuality.pages[].{url, title, wordCount, readabilityScore, readability.{fleschReadingEase, fleschKincaidGrade, wordCount, avgSentenceLength, avgSyllablesPerWord, sentenceCount, readingLevel}, isThin, issues[]}`
- `contentQuality.thinContent[]`
- `contentQuality.duplicateGroups[]`
- `contentQuality.cannibalization[]`
- `contentQuality.structureIssues[]`
- `contentQuality.summary.{avgReadability, avgWordCount, thinPageCount, ...}`

## 3. Key sections

**`renderReadabilityTable` (lines 250-348).** The table finding #6 enriches. Per-row reads:
- `readability.fleschReadingEase` (from pta via normalizer).
- `readability.avgSyllablesPerWord` (from pta).
- `readability.wordCount` (from pta).
- Renders hover popover with full explanation (`readability.scoreExplanation` — exists in calgary fork but NOT template's extract-text.js output).

**`renderThinContent` (lines 349-415).** Lists thin pages. Threshold from `contentQuality.thinContentThreshold` or default. **Thin flag** depends on crawl-sitemap.js wordCount which is inflated by nav/header/footer (finding #5 bug #4) — so thin-content list may have false positives.

**`renderDuplicateGroups` (lines 416-475).** Lists clusters of near-duplicate pages. Each group shows a primary + duplicates.

**`renderCannibalization` (lines 476-564).** Lists keywords where multiple pages compete.

**`renderStructureAudit` (lines 565-654).** H1/H2 issues. **Reads `page.h1[]` array** from crawl-data.json — note finding #5 flagged that crawl-data.json has `"phantom H1"` issues from the "Insert/edit link" WordPress bug. Matt's audit-log line 26 confirmed: "All blog posts have a phantom second H1" on his site. Page would render those as legit H1s.

**`renderTextList` (lines 139-175).** Helper for "+N more" toggle list rendering. **This is the 35-line laura-willis drift.** Her copy has a simplified non-interactive fallback (just shows "+N more" as text, no click-to-expand). Functional degradation.

## 4. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Upstream bug #4 (finding #5) propagates to thin-content.** Crawl-sitemap.js's inflated wordCount (includes nav/footer text) means thin-content classification is unreliable. Pages displayed as "thin content" may have 200 words of real content with 80 words of nav/footer. |
| 2 | **H** | — | **Upstream bug #8 (finding #5) propagates to schema structure audit.** Array-wrapped JSON-LD gets `schemaTypes: ['unknown']` — structure audit page can't flag properly. |
| 3 | **M** | 565-654 | **H1 phantom-duplicate bug surfaced from crawl-data.** Matt's audit-log documented "phantom H1" from WordPress editor dialog. The structure audit flags it as a multi-H1 issue. Upstream fix (crawl script) needed. |
| 4 | **M** | — | **laura-willis drift:** missing the interactive "+N more" expander (line 146-163 in template). Her reports show a static "+N more" label with no expansion. Functional regression. |
| 5 | **M** | 176-193 | **Template has 2 helper functions missing from laura's fork** (`getReadabilityScore`, `getReadabilityWordCount`). Laura's page reads fields directly, missing the fallback logic. |
| 6 | **M** | — | **`readability.scoreExplanation`** is read by the hover popover but not produced by template's extract-text.js (finding #6 — only calgary-castles fork emits it). All non-calgary clients see an empty popover. |
| 7 | **L** | — | **Content overview doesn't surface when contentQuality is null entirely** — page renders mostly empty without a clear "run build_audit.py" callout. |

## 5. Integration map

**Data chain:**
- `crawl-sitemap.js` → `crawl-data.json` → normalizer (finding #21 section 4b, lines 1110-1160) → `auditData.contentQuality.pages` fallback path.
- `extract-text.js` → `page-text-analysis.json` → normalizer (lines 1349-1565) → per-page readability enrichment.
- `build_audit.py` → `audit_platform.analyzers.content_quality` → `auditData.contentQuality` primary.
- `populate-audit-data.js` is NOT involved — no content MD parsing.

**Contract:** `contentQuality.pages[i]` must have `url` + either `readabilityScore` or `readability.fleschReadingEase`.

## 6. Fix / improve suggestions

1. **Coordinate with finding #5 #4 fix** (crawl-sitemap wordCount excluding boilerplate) → thin-content list becomes reliable.
2. **Re-template laura-willis's content.js** to restore the expand/collapse interaction.
3. **Strip phantom H1 ("Insert/edit link") at crawl time** (finding #5 addition) so structure audit is clean.
4. **Audit every page's use of `scoreExplanation`** — either upstream the calgary extract-text improvement (finding #6 #7.2) or remove the popover.

## 7. What to verify before we touch this file

- **Open Matt's Content page** — are thin-content false positives visible? His blog posts were flagged with phantom H1s — does the Structure Audit show those?
- **Check Laura's local copy** line-by-line vs template — 35 lines of drift documented; fully diff before re-templating.
- **Confirm `data.contentQuality.summary` has all fields** the overview renders.
