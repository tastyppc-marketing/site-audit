# Deep Dive #51 — `platform/src/audit_platform/analyzers/content_quality.py`

**File:** [`content_quality.py`](/root/site-audit/platform/src/audit_platform/analyzers/content_quality.py) (973 lines)
**Layer:** 10 — Python analyzer (content quality scoring + thin-content + duplicates + cannibalization)
**Date:** 2026-04-20

---

## 1. Purpose

The most complex content analyzer. Consumes crawl data + page-text-analysis + readability metrics to produce `audit-data.json.contentQuality.{pages[], summary, thinContent[], duplicateGroups[], cannibalization[], structureIssues[]}`.

Methods:
- `analyze_page` (line 110) — per-page scoring.
- `analyze_batch` (line 410) — orchestrates page-level analysis across all crawl pages.
- `_extract_text_from_html` (line 906) — custom HTMLParser for text extraction.

Also contains `_TextExtractor(HTMLParser)` class (line 47) — a pure-Python HTML text stripper. Duplicates logic with JS `extract-text.js` (finding #6).

## 2. Key architecture

**`ContentQualityAnalyzer.analyze_page` (line 110).** Per-page scoring: readability score, word count classification, thin-content flag, duplicate detection via hashing, keyword cannibalization detection.

**`analyze_batch` (line 410).** Walks all pages from crawl-data.json (the shape finding #5 + #21 documented). Calls `analyze_page` for each. Aggregates into summary stats.

**Inputs consumed:**
- `crawl_data['pages']` — from `crawl-sitemap.js` → `crawl-data.json` (but subject to finding #5 #21 agent-overwrite cap).
- Possibly page-text-analysis.json (via build_audit.py's `_merge_page_text_analysis`, finding #21 #2c line 197).

**Outputs:** `contentQuality` structured object, consumed by `pages/content.js` (finding #24).

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Downstream of finding #5 + #21** — agent-overwrite of crawl-data.json means this analyzer operates on 11 pages for Matt instead of 40+. Content quality analysis is partial. |
| 2 | **H** | — | **Downstream of finding #5 #4** — crawl wordCount includes boilerplate. Thin-content flag and readability score both biased. |
| 3 | **H** | 906 | **Duplicate HTMLParser logic** with JS `extract-text.js`. Two text extractors; two opportunities for drift. |
| 4 | **M** | 410+ | **`analyze_batch` iterates sequentially.** For 500-page site this is slow. Python has no concurrency here. Could use `multiprocessing` for CPU-bound scoring. |
| 5 | **M** | — | **Cannibalization detection** — likely compares titles/H1s for overlap. False positives on legitimate category pages. |
| 6 | **M** | — | **Duplicate detection** — likely shingle-based or MinHash. Threshold-configurable? Not verified. |

## 4. Integration map

**Called by:** `build_audit.py::_run_content_quality` (deep-dive #63). Uses `_merge_page_text_analysis` to enrich crawl pages with extract-text data before analysis.

**Writes to:** `audit-data.json.contentQuality.*` — consumed by `pages/content.js`.

## 5. Fix / improve suggestions

1. **Consolidate text extraction** — either JS or Python. Pick one. Share output.
2. **Fix upstream crawl word count** (finding #5 #4) → thin-content reliability.
3. **Parallelize analyze_batch** for large sites.
4. **Configurable thresholds** — thin-content word count, duplicate similarity cutoff.
