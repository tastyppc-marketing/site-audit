# Deep Dive #53 — `platform/src/audit_platform/analyzers/technical_seo.py`

**File:** [`technical_seo.py`](/root/site-audit/platform/src/audit_platform/analyzers/technical_seo.py) (987 lines)
**Layer:** 10 — Python analyzer (technical SEO scoring — meta tags, schema, canonical, CWV, crawl issues)
**Date:** 2026-04-20

---

## 1. Purpose

Analyzes technical SEO health. Single public method `analyze(pages, homepage)` (line 38). Consumes `crawl-data.json.pages[]` (subject to finding #5 + #21 agent-overwrite) + PSI data. Produces `audit-data.json.technicalSeo.{metaTagAudit, schemaSummary, crawlIssues, siteStructure, cwvScore, ...}`.

Largest analyzer besides content_quality. 987 lines indicates substantial scoring logic.

## 2. Key architecture

**`TechnicalSeoAnalyzer.analyze` (line 38).** Walks pages list, aggregates per-page technical issues into categories.

**Expected per-page fields (from crawl-data.json):**
- `title, description, h1[], canonical, robotsMeta, hasSchema, schemaTypes, ogTitle, responseHeaders, redirectChain, statusCode, issues[]`.

Each field maps to a section of the Technical page report.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Entirely downstream of finding #5 bug #1** (response-header listener overwrite). `responseHeaders.statusCode`, `.server`, `.strictTransportSecurity` corrupted by subresource responses. MISSING_HSTS flag is false-positive-heavy. |
| 2 | **H** | — | **Downstream of finding #5 bug #8** (array-wrapped schema → 'unknown' type). Schema audit has false "no schema" conclusions. |
| 3 | **H** | — | **Downstream of finding #5 bug #21 + #11** (page cap from agent-overwrite + limit=50 from extract-text). Analyzer sees 11 pages for Matt, not 40. Full-site signal weak. |
| 4 | **M** | — | **Relies on `page.error` check** for sparse error-shape pages (finding #5 bug #7). If error handling isn't consistent across all 987 lines, TypeError on sparse pages. |

## 4. Integration map

**Called by:** `build_audit.py::_run_technical_seo` (line 223-235).
**Input:** `crawl_data.pages[]`.
**Output:** `audit-data.json.technicalSeo.*` — consumed by `pages/technical.js` (#25).

## 5. Fix / improve suggestions

1. **All fixes are upstream** — finding #5 bugs #1, #8, #21 need to land first. This analyzer will then produce reliable scores.
2. **Defensive guard on sparse-page shape** — add `if page.get('error'): skip` at entry.
