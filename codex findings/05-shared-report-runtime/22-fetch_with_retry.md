# Script Audit: `template/scripts/lib/fetch-with-retry.js`

Last updated: 2026-04-17

File: [template/scripts/lib/fetch-with-retry.js](/root/site-audit/template/scripts/lib/fetch-with-retry.js:1)

## Purpose

`fetch-with-retry.js` is a shared network utility for the Node-based gather
scripts.

It provides:

- raw HTTP(S) requests
- JSON fetch helpers
- POST helpers
- retry and backoff behavior
- process-wide request statistics
- a semaphore for concurrency control

This is one of the central runtime dependencies in the repo.

## Inputs

This file is not a CLI script.
It is imported by other scripts.

## Outputs

- returns HTTP responses or parsed JSON to callers
- logs per-request activity to stdout
- logs a process summary on `beforeExit`

## How It Works

### 1. Tracks process-wide request metrics

It stores counters for:

- total requests
- successes
- failures
- retries
- bytes received
- status-code counts

### 2. Implements a lightweight semaphore

The `Semaphore` class lets callers limit concurrent in-flight requests.

### 3. Executes raw HTTP(S) requests

`rawRequest()` uses Node's `http` and `https` modules directly rather than
`fetch`.

### 4. Wraps requests with retry logic

`fetchWithRetry()` retries on:

- `429`
- `5xx`
- thrown request errors

using exponential backoff with a cap.

### 5. Provides convenience wrappers

The module exposes higher-level helpers for JSON parsing and POST requests.

## Strengths

- clear reusable retry implementation
- useful central place for network instrumentation
- semaphore is simple and easy for callers to use
- avoids copy-pasted retry logic across gather scripts

## Weaknesses

### Shared utility appears inconsistently imported

At least one previously reviewed script, `gather-backlinks.js`, appears to use
`new Semaphore(2)` while only importing `postJson`.
That suggests usage drift between this shared module and its consumers.

### Global summary on `beforeExit`

The automatic summary is convenient, but because it is process-wide and
implicit, it can create noisy logs or confusing multi-script behavior in more
complex orchestrations.

### No circuit-breaking or per-endpoint policy

All callers share the same basic retry behavior.
That is fine for a first pass, but different APIs may require different retry
limits, timeouts, or logging levels.

### Uses raw Node request primitives

That keeps dependencies low, but it also means more manual maintenance around
headers, timeouts, and body handling than a higher-level client would require.

## Failure Modes

- callers misuse exports or import only part of the required module
- retries hide repeated upstream failures until long timeouts accumulate
- noisy shared logging makes debugging harder in orchestrated runs

## Improvement Targets

### High priority

- Audit all gather scripts for correct import and usage of `Semaphore`,
  `fetchJSON`, and `postJson`
- Add tests around retry behavior and export shape
- Make summary logging configurable so orchestrators can opt in or out

### Medium priority

- Support per-call retry policy overrides more explicitly
- Add structured logs or machine-readable request summaries

### Low priority

- Consider migration to a higher-level HTTP client only if it reduces code
  complexity without sacrificing control

## Bottom Line

`fetch-with-retry.js` is an important shared runtime building block.
It is one of the better pieces of infrastructure in the repo, but the real risk
is not inside the utility itself.
The risk is that downstream scripts may not use it consistently or correctly.
