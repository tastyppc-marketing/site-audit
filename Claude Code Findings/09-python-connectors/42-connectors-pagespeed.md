# Deep Dive #42 — `platform/src/audit_platform/connectors/pagespeed.py`

**File:** [`pagespeed.py`](/root/site-audit/platform/src/audit_platform/connectors/pagespeed.py) (287 lines)
**Layer:** 09 — Python connector (Google PageSpeed Insights)
**Date:** 2026-04-20

---

## 1. Purpose

Python sibling to JS `gather-pagespeed.js` (finding #7). Same PSI API v5, same per-URL mobile+desktop pattern. Exposes:
- `analyze(url, strategy)` → `PageSpeedRecord`
- `analyze_batch([urls])` → per-URL records
- `get_core_web_vitals(url)` → `CoreWebVitals` typed object

## 2. Key architecture

**`_api_key` (line 95).** From `settings.PAGESPEED_API_KEY`. Without it, public rate limit applies.

**`_build_params` (line 105).** Constructs URL params. Category parameter, strategy (mobile/desktop), locale.

**`_parse_response` (line 122).** Extracts performance score, LCP/FCP/CLS/INP/TTFB from Lighthouse result. Typed Pydantic models (likely in `models/*.py`).

**`analyze_batch` (line 199).** Iterates URLs, collects records.

**`get_core_web_vitals` (line 249).** Higher-level: returns typed CWV object with both mobile + desktop metrics.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Dual-path with JS `gather-pagespeed.js`** (finding #7). Both hit PSI. If both run during a single audit, billing is doubled (except PSI is free up to quota, so cost is quota wastage). |
| 2 | **M** | 101 | **`_request_delay` custom implementation?** May override base rate-limiter. Worth verifying it doesn't skip base-class rate limit. |
| 3 | **M** | 199-247 | **`analyze_batch` sequential (expected).** No concurrency. Same tradeoff as JS version — finding #7 #6. |
| 4 | **M** | — | **Only `performance` category likely** (inferred from JS finding #7 #3). If a11y/best-practices/SEO are added JS-side, Python path should match. |

## 4. Integration map

**Consumed by:** `TechnicalSeoAnalyzer` (finding #53 — upcoming) for CWV + PSI scoring.
**Orchestrator:** `build_audit.py`.
**NOT called by:** JS scripts.

## 5. Fix / improve suggestions

1. **Pick JS or Python path for PSI** (same as finding #41 #1). Not both.
2. **Parameterize categories** if/when technical_seo analyzer needs them.
3. **Verify rate-limit isn't double-applied** (bug #2).
