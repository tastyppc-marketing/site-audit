# Deep Dive #40 — `platform/src/audit_platform/connectors/base.py`

**File:** [`base.py`](/root/site-audit/platform/src/audit_platform/connectors/base.py) (139 lines)
**Layer:** 09 — Python connectors (abstract base class for all API connectors)
**Date:** 2026-04-20

---

## 1. Purpose

Abstract base for 10 API connectors (`dataforseo`, `pagespeed`, `search_console`, `ga4`, `business_profile`, `local_seo`, `crux`, `brand_mentions`, `social_audit`, `google_ads`). Provides:

1. **Async + sync HTTP clients** via `httpx` with configurable timeouts.
2. **Configurable rate limiting** (requests per second).
3. **Retry logic** via `tenacity` — 3 attempts, exponential backoff 1-30s, retries on `httpx.TransportError` / `TimeoutException`.
4. **Structured logging** via `structlog`.
5. **Context manager** support (both sync and async).

## 2. Key architecture

**`_rate_limit` (line 58-66, async) and `_rate_limit_sync` (line 68-75).** Token-bucket-ish: calculates time since last request, sleeps if under the minimum interval. `_lock` guards async access.

**`@retry` decorator on `_request` (line 77-99).**
- 3 attempts max.
- Exponential backoff (1s, then up to 30s).
- **Only retries on `TransportError` + `TimeoutException`.** 5xx responses via `response.raise_for_status()` → `HTTPStatusError` → NOT retried.
- **Sync variant `_request_sync` has NO retry decorator** (lines 101-117). **Inconsistency.**

**Client lifecycle:** Lazy-initialized (`@property`). Closes cleanly on context-manager exit.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 77-80 | **Retry only on network errors, not 5xx.** `response.raise_for_status()` at line 98 throws `HTTPStatusError` which isn't in the retry whitelist. A 503 from DFS/PSI terminates after the first attempt. Common failure mode — worth adding 5xx to retryable. |
| 2 | **H** | 101-117 | **Sync `_request_sync` has NO retry logic.** Any connector using the sync client (look at which do in deep-dives #41+) gets zero retries on transport/timeout errors. Inconsistent with async path. |
| 3 | **M** | 38 | **Rate limit uses a single shared `_last_request_time`** per instance. Fine for single-instance per connector, but if multiple instances of same connector are created, they don't share rate-limit state → combined throughput exceeds the per-account limit. |
| 4 | **M** | 98 | **`raise_for_status` always raised**, never inspected. Connectors can't introspect failed status codes without wrapping. Limits connector-specific behavior (e.g., DFS's 40100 auth code inside a 200 body — see finding #8). |
| 5 | **L** | 79 | **`max=30` seconds** on backoff — 3 attempts × up to 30s = potentially 60+ seconds blocked. For interactive dev, this is a long hang. |
| 6 | **L** | 40 | **`asyncio.Lock()` in `__init__`** — means a BaseConnector instance is tied to the event loop where it was created. Instantiating at import time before event loop exists causes subtle issues. |

## 4. Integration map

**Inherited by:** 10 connector classes (finding #41-50). Each subclass calls `self._request` (or sync variant) for API calls.

**Consumed by:** `platform/scripts/build_audit.py` orchestrator → each analyzer → its connector.

**Read from:** `audit_platform.config.Settings` — env var loader for creds + HTTP_TIMEOUT.

## 5. Fix / improve suggestions

1. **Add `httpx.HTTPStatusError` for 5xx to retry whitelist** (bug #1). Parameterized: `retry_on_status=[500, 502, 503, 504]`. Significant reliability improvement.
2. **Apply retry decorator to `_request_sync`** (bug #2). Symmetry across sync/async.
3. **Connector-specific response inspection hook** — allow subclass to check body for embedded error codes before `raise_for_status`.
4. **Tune retry backoff** for fast-dev mode via env var.
