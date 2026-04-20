# Deep Dive #41 — `platform/src/audit_platform/connectors/dataforseo.py`

**File:** [`dataforseo.py`](/root/site-audit/platform/src/audit_platform/connectors/dataforseo.py) (919 lines — largest connector)
**Layer:** 09 — Python connector (DataForSEO API v3)
**Date:** 2026-04-20

---

## 1. Purpose

The central DataForSEO client. Wraps ~10 DFS endpoints:

- `/serp/google/organic/live/advanced` → `get_serp`, `get_serp_batch`, `get_local_pack`
- `/keywords_data/google_ads/search_volume/live` → `get_keyword_data`
- `/keywords_data/google_ads/keywords_for_keywords/live` → `get_keyword_suggestions`
- `/backlinks/summary/live` → `get_backlinks_summary`
- `/backlinks/backlinks/live` → `get_backlinks`
- `/backlinks/referring_domains/live` → `get_referring_domains`

Plus likely rank-tracker, domain-rank-overview, and other endpoints (line count suggests more than I surveyed).

## 2. Key architecture

**`_post` (line 80-95).** Shared POST wrapper. Calls base `_request_sync` with basic-auth.

**`_unwrap` (line 96+).** DFS response-shape normalization. Handles the nested `raw → tasks[0] → result[0] → items[]` unwrap with error propagation. Checks both `top_code` (line 138) and `task_code` (line 153) to raise `DataForSEOError` with specific code + message. **This is the correct way to handle DFS errors — unlike the JS-side scripts which treat `status_code !== 20000` as single-layer.**

**`DataForSEOError` (line 35).** Custom exception with `status_code`, `status_message`, `data` attributes — lets callers react to specific DFS codes.

**Connector sits in front of JS `gather-*.js` scripts that also talk to DFS directly.** Finding #8 §6 noted this: "`backlinks.py:81-92` calls DFS via `connectors/dataforseo.py:904-916`" — so both JS and Python paths hit DFS. Risk of duplicate calls / inconsistent results.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Dual-path risk.** JS `gather-*.js` scripts AND Python connector both hit same DFS endpoints. Same account credentials; same DFS quota. Risk of unnecessary duplicate calls → billing × 2. A single source of truth (pick one) would save cost + simplify. |
| 2 | **H** | — | **Uses `_request_sync`** (via `_post` line 80). Per finding #40 #2, sync variant has NO retry. Transient DFS outage terminates the task. |
| 3 | **M** | 353-405 | **`get_keyword_data`** likely shares the hardcoded US+English defaults with JS `gather-keyword-volumes.js` (finding #11). Worth verifying parameterization. |
| 4 | **M** | 311-345 | **`get_local_pack`** — the Python sibling of JS `gather-local-pack.js` (finding #12). If it has the same hardcoded `location_code: 2840` bug, it propagates the same 0-hit issue. Not verified. |
| 5 | **M** | 479-518 | **`get_backlinks_summary`** returns `DomainMetrics` with the same DFS-rank (0-1000) vs Ahrefs-DR (0-100) scale issue (finding #8 #3). Bug surface depends on whether the model normalizes. |
| 6 | **M** | 32 | **`_BASE_URL` is module-level constant.** Not configurable via env var. Fine for now but limits multi-region or proxy setups. |
| 7 | **L** | 77 | **`_auth()` returns tuple from settings.** Good separation. |

## 4. Integration map

**Consumed by:** Python analyzers. `backlinks.py:81-92` (finding #8 §6), likely `keyword_research.py`, `local_seo.py`, `content_quality.py`, `technical_seo.py`.

**Orchestrator:** `build_audit.py`.

**NOT consumed by:** JS scripts. They have their own `gather-*.js` DFS code.

## 5. Fix / improve suggestions

1. **Pick one DFS path** (JS OR Python) for each data stream. Retire the other. Reduces cost and inconsistency.
2. **Wire retry into `_request_sync`** (finding #40 #2).
3. **Verify + parameterize `get_local_pack` location_code** (bug #4).
4. **Model-level scale normalization** for `rank` field (bug #5) — divide by 10 at the connector boundary to normalize to 0-100.
