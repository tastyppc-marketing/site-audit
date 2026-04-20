# Deep Dive #57 — `platform/src/audit_platform/analyzers/indexation_crawlability.py`

**File:** [`indexation_crawlability.py`](/root/site-audit/platform/src/audit_platform/analyzers/indexation_crawlability.py) (539 lines)
**Layer:** 10 — Python analyzer (indexability + crawl flags + robots.txt + sitemap coverage)
**Date:** 2026-04-20

---

## 1. Purpose

Analyzes which pages are indexable vs blocked, robots.txt rules, sitemap coverage (are sitemap URLs actually reachable?), canonical integrity, and redirect chains. Produces `audit-data.json.indexation.*`.

## 2. Key architecture

Consumes `crawl-data.json.pages[]` (subject to finding #5 + #21 cap). Checks each page's:
- `robotsMeta` → noindex detection
- `canonical` → canonical pointing to different URL
- `redirectChain` → length > 1 flag
- `statusCode` → non-200 flag
- `xRobotsTag` → x-robots-tag HTTP header noindex

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Downstream of finding #5 bug #1** (response-header listener overwrite). `xRobotsTag` + `statusCode` + `strictTransportSecurity` corrupted by subresource responses. False positives on noindex/redirect flags. |
| 2 | **H** | — | **Downstream of finding #5 bug #21** (agent overwrite + curated 11 pages). Indexation analysis is based on 11 pages, not full sitemap. Sitemap-coverage section severely under-reports. |
| 3 | **M** | — | **Robots.txt parsing** — likely done here. Worth checking if it respects `Crawl-delay`, `Disallow:` patterns accurately. |

## 4. Integration map

**Called by:** `build_audit.py::_run_indexation_crawlability`.
**Output:** `audit-data.json.indexation.*` — likely rendered on `pages/technical.js` (#25).

## 5. Fix / improve suggestions

1. **Fix upstream** (findings #5 #1, #21).
2. **Sitemap-coverage reconciliation** — compare sitemap URLs vs analyzed URLs; the delta IS the under-reporting gap.
