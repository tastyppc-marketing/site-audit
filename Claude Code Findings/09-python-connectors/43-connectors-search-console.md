# Deep Dive #43 — `platform/src/audit_platform/connectors/search_console.py`

**File:** [`search_console.py`](/root/site-audit/platform/src/audit_platform/connectors/search_console.py) (323 lines)
**Layer:** 09 — Python connector (Google Search Console API)
**Date:** 2026-04-20

---

## 1. Purpose

Wraps Google Search Console (GSC) API for organic-search-performance data. Requires OAuth2 credentials. Exposes:
- `get_query_data`, `get_page_data`, `get_device_data`, `get_country_data` — per-dimension analytics
- `get_query_page_data` — joined query + landing page
- `get_indexing_status` — URL inspection API
- `_resolve_site_url` — handles domain-property vs URL-prefix property selection

## 2. Key architecture

**`_get_service` (line 70).** Uses `google-api-python-client` (`Resource`). Returns an authorized GSC service instance. OAuth2 flow handled externally.

**`_resolve_site_url` (line 91).** Handles GSC's two site verification formats: `sc-domain:example.com` (domain property) OR `https://example.com/` (URL prefix). Tries both.

**`_query` (line 104).** Core POST to `searchanalytics.query`.

**`close` (line 318).** Non-standard close — GSC service doesn't need explicit close.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **GSC requires OAuth2 per client.** Most clients don't have verified property access. Matt's config (`hasAccess: false`) — GSC data never populated. This is the pattern for most clients. |
| 2 | **M** | 91-102 | **Site URL resolution is heuristic.** If client has both domain property AND URL-prefix property, picks whichever returned non-404. Order-dependent. |
| 3 | **M** | — | **GSC has data-delay (2-3 days)** — recent activity not reflected. Worth documenting in the analyzer so report doesn't claim "current" rankings. |
| 4 | **L** | — | **Query limits:** GSC caps to 50k rows per query. Connector doesn't paginate. Very-high-traffic sites get capped. |

## 4. Integration map

**Consumed by:** likely `keyword_research.py` + `content_quality.py`. Provides real client-side rank + clicks + impressions data (vs DFS's estimated data).

**NOT called by:** JS scripts.

## 5. Fix / improve suggestions

1. **Onboard more clients with GSC access** — Matt, Liane, others currently set `hasAccess: false`. This is data quality blockage, not code.
2. **Paginate queries** (bug #4) for large sites.
3. **Document data delay** (bug #3).
