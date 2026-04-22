# Script Audit: `platform/src/audit_platform/connectors/base.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/base.py](/root/site-audit/platform/src/audit_platform/connectors/base.py:1)

## Purpose

`base.py` provides shared HTTP-client, retry, logging, and rate-limit behavior
for backend connectors.

This file is supposed to be the reliability and transport foundation for the
whole connector layer.

## Inputs

Primary dependencies:

- `httpx`
- `tenacity`
- `structlog`
- `Settings`

## Outputs

This file does not expose business data. It exposes shared behavior:

- lazy sync and async HTTP clients
- async and sync request helpers
- async and sync rate limiting
- context-manager cleanup hooks

## How It Works

### 1. Creates lazy HTTP clients

The connector owns both:

- `async_client`
- `sync_client`

and initializes them only when needed.

### 2. Applies rate limiting

Async and sync request paths both have minimum-interval throttling logic derived
from `requests_per_second`.

### 3. Provides one retry-enabled async request helper

`_request(...)` is decorated with `tenacity` and retries transport and timeout
errors.

### 4. Provides one sync request helper

`_request_sync(...)` performs sync requests with logging and status checking.

## Interactions With Other Scripts

Every concrete connector inherits from this class, so any mismatch between the
base contract and actual connector usage becomes a repo-wide problem.

## Strengths

- clear intent: centralize transport concerns
- rate limiting is explicit and configurable
- async request helper includes a reasonable retry policy

## Weaknesses

### Retry behavior is inconsistent between async and sync paths

The async `_request(...)` method has `tenacity` retry logic, but the sync
`_request_sync(...)` method does not.

That matters because the current connector layer is predominantly sync.

### Many concrete connectors bypass the helper methods entirely

Several connectors call `self.sync_client` directly instead of using
`_request_sync(...)`.

So even the limited sync logging and status-handling path in `BaseConnector` is
often skipped, which means the base class is not actually enforcing the common
behavior it appears to define.

### Sync rate limiting is not guarded by a lock

`_rate_limit_sync(...)` updates `_last_request_time` without synchronization.

That is probably acceptable in single-threaded CLI usage, but it is not a safe
shared primitive if connector calls ever become concurrent.

### Cleanup semantics are slightly uneven

The async `close(...)` method closes both clients, while the sync path only
closes the sync client unless subclasses override behavior.

That is workable, but not perfectly symmetrical.

## Failure Modes

- sync connectors can fail more often than expected because retries are not
  consistently applied
- direct `sync_client` usage in subclasses can bypass common logging and control
- future concurrent sync usage can race the shared rate-limit clock

## Improvement Targets

### High priority

- add retry behavior to the sync request path
- make concrete connectors use base request helpers instead of raw `sync_client`
  calls
- decide whether sync connectors are expected to be single-threaded and document
  that explicitly if yes

### Medium priority

- unify cleanup semantics across sync and async paths
- centralize auth/header injection patterns where practical

## Bottom Line

`base.py` has the right architectural intent, but the connector layer is not
consistently using it the way it was designed.

That makes this file one of the key places where data-pull reliability can drift
from what the code structure implies.
