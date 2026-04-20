# Deep Dive #47 — `platform/src/audit_platform/connectors/crux.py`

**File:** [`crux.py`](/root/site-audit/platform/src/audit_platform/connectors/crux.py) (195 lines)
**Layer:** 09 — Python connector (Chrome UX Report — real user CWV)
**Date:** 2026-04-20

---

## 1. Purpose

Wraps Google's Chrome UX Report (CrUX) API. Returns real-user Core Web Vitals for a URL or origin — the field-data counterpart to PageSpeed's lab-data CWV. Where PSI (finding #42) runs a single Lighthouse test, CrUX reports aggregated user experience over the past 28 days.

## 2. Key architecture

**`_parse_response` (line 30).** Maps CrUX's metric keys (e.g., `largest_contentful_paint`) to `CrUXRecord` (Pydantic model from `models/performance.py`). Metric mapping is explicit — line 18 comment.

**`_post` (line 80).** Returns `None` for missing data (new domain, insufficient traffic). Critical distinction: not an error, just no-data.

**`CrUXRecord`** contains p75 values for LCP, FCP, CLS, INP, TTFB. P75 = 75th percentile.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | — | **Small/new sites have no CrUX data.** Matt's `mattwallmow.com` is low-traffic — CrUX likely returns no-data. Absent CWV field data; report must fall back to PSI lab data. Connector returns `None` — caller must handle. |
| 2 | **M** | — | **CrUX API requires an API key** (Google Cloud). Not all operators have it configured. |
| 3 | **L** | 47-56 | **Only top-level metrics parsed.** CrUX also provides histogram distributions — not captured. |

## 4. Integration map

**Consumed by:** likely `TechnicalSeoAnalyzer` alongside `pagespeed.py`.

## 5. Fix / improve suggestions

1. **Document CrUX data availability** — for small clients, return meaningful "no-data" state in report.
2. **Capture histograms** if the report ever wants to visualize performance distribution.
