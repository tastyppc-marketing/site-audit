# Script Audit: `platform/src/audit_platform/connectors/crux.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/crux.py](/root/site-audit/platform/src/audit_platform/connectors/crux.py:1)

## Purpose

`crux.py` is the backend connector for the Chrome UX Report API.

It is responsible for pulling field-data performance metrics and normalizing
them into `CrUXRecord` objects. In the current repo, it is lightly integrated:
it is exposed through the connector package and exercised in `run_all.py` and
the standalone test script, but it is not a major orchestration hub.

## Inputs

Primary dependencies:

- `BaseConnector`
- `Settings`
- `httpx`
- `CrUXRecord`

Primary runtime inputs:

- a URL or origin
- optional form factor (`PHONE`, `DESKTOP`, `TABLET`)
- optional API key from settings

## Outputs

This file returns:

- `CrUXRecord | None` from `query_url(...)`
- `CrUXRecord | None` from `query_origin(...)`
- a dict of segment keys to `CrUXRecord | None` from `get_full_vitals(...)`

The normalization target is clean and typed, which is one of the better parts
of the file.

## How It Works

### 1. Builds the endpoint URL

`_endpoint_url(...)` appends the API key when one is configured.

### 2. Posts a simple CrUX query body

`_post(...)` sends either a `{"url": ...}` or `{"origin": ...}` payload to the
CrUX API and parses the returned JSON.

### 3. Normalizes p75 metrics

`_parse_crux_response(...)` maps the CrUX metric keys into internal
`CrUXRecord` field names like `lcp_p75`, `inp_p75`, and `cls_p75`.

### 4. Provides a convenience multi-segment method

`get_full_vitals(...)` runs three queries for the same target:

- `PHONE`
- `DESKTOP`
- combined / all form factors

## Strengths

- small and easy to reason about
- typed output model is clean and consistent
- the normalization map is straightforward and readable
- `404` is handled as "no data" instead of a hard failure

## Weaknesses

### It bypasses the base request helper

`_post(...)` uses `self.sync_client.post(...)` directly. That means retry,
backoff, and request-policy behavior are not centralized at the base-connector
layer.

### URL-vs-origin detection is brittle

`get_full_vitals(...)` decides whether the target is an origin by counting `/`
characters after trimming trailing slashes.

That is a weak heuristic. Query-string URLs or unusual target strings can be
misclassified, which means the connector can ask CrUX the wrong question.

### `get_full_vitals(...)` fans out into three serial network calls

There is no batching, caching, or reuse. For a large audit run this would be a
small but real cost multiplier.

### The connector is intentionally narrow

It only returns p75 metrics, not histogram buckets or pass-rate style fields.
That is fine if the architecture wants only p75s, but it limits flexibility for
future reporting.

## Failure Modes

- a target can be treated as an origin when it is really a URL, producing empty
  or misleading results
- quota or transient transport failures are not retried in a standardized way
- repeated multi-segment calls can amplify API cost and latency

## Improvement Targets

### High priority

- replace slash counting with robust `urlparse(...)`-based target
  classification
- route sync POST requests through a shared retry-aware base helper
- consider exposing a clearer API that makes callers choose `query_url(...)` vs
  `query_origin(...)` explicitly in the places where ambiguity matters

### Medium priority

- add optional caching for repeated targets in the same run
- expand the normalized response if future reporting needs more than p75 values

## Bottom Line

`crux.py` is structurally clean and lower-risk than several other connectors,
but it still has one important contract flaw: the URL/origin mode heuristic is
too loose for a data connector.

This is not the first place I would look for bad data, but it is a plausible
source of missing or mis-scoped field-performance data.
