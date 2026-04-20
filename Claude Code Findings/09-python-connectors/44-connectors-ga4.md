# Deep Dive #44 — `platform/src/audit_platform/connectors/ga4.py`

**File:** [`ga4.py`](/root/site-audit/platform/src/audit_platform/connectors/ga4.py) (338 lines)
**Layer:** 09 — Python connector (Google Analytics 4 Data API v1beta)
**Date:** 2026-04-20

---

## 1. Purpose

Wraps GA4 Data API for session/traffic/conversion analytics. Requires service-account or OAuth credentials + GA4 property ID. Sister to `search_console.py` (#43) but covers different metrics (behavior, conversions) vs GSC's search metrics.

## 2. Key architecture

**`BetaAnalyticsDataClient` (line 12, 62, 83).** Official Google client library.

**`_default_property_id` (line 88).** Pulls from `Settings.GA4_PROPERTY_ID`. Raises if unset AND no override — prevents silent wrong-account queries.

**`run_report` (line 136).** Generic report-runner. Accepts `dimensions`, `metrics`, `date_range`. Callers compose the request.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Requires property ID + creds per client.** Same as #43 — most clients don't have configured GA4 access. Matt's config: `analytics.hasAccess: false`. GA4 section of report is empty for most. |
| 2 | **M** | 45-85 | **Dual credential paths** (service-account via env vs OAuth). Credential resolution logic in lazy init. If both partially configured, precedence unclear from this excerpt. Worth verifying. |
| 3 | **M** | — | **GA4 API v1beta** — beta API. Could change. Lock to stable version when GA. |
| 4 | **L** | — | **No caching** of report results within a session. If multiple analyzers call same report, each query is billed/rate-limited separately. |

## 4. Integration map

**Consumed by:** likely `content_quality.py`, `traffic_overview` analysis.
**Orchestrator:** `build_audit.py`.

## 5. Fix / improve suggestions

1. **Document GA4 setup** in operator docs — what env vars, what service-account permissions.
2. **In-session cache** for repeated report queries (bug #4).
