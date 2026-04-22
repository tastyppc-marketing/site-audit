# Script Audit: `platform/src/audit_platform/utils/retry.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/utils/retry.py](/root/site-audit/platform/src/audit_platform/utils/retry.py:1)

## Purpose

`retry.py` provides a small wrapper around Tenacity so the repo can declare
retry behavior with a shared decorator.

## Inputs

Primary dependencies:

- `tenacity`
- `structlog`

## Outputs

This file provides:

- `_log_retry(...)`
- `retry(...)`

## How It Works

`retry(...)` returns a decorator that wraps a function with Tenacity retry
behavior using:

- exponential backoff
- attempt limits
- exception-type filtering
- a before-sleep retry log hook

## Strengths

- simple reusable wrapper
- exposes the most important retry knobs
- logging hook gives at least minimal retry visibility

## Weaknesses

### The utility is effectively unused

In the current codebase, the connector base class imports Tenacity directly
instead of using this shared wrapper.

So this file exists as a retry abstraction, but it is not acting as the
project's real retry standard.

### The default retry scope is broad

`retry_on` defaults to `(Exception,)`, which is too broad as a safe default for
most production code. That can accidentally turn programming errors into retry
loops if callers are not careful.

### Retry logging is minimal

The log hook records attempt number and function name, but not the triggering
exception or next wait duration.

## Failure Modes

- callers can believe retry policy is centralized when actual retry behavior is
  still fragmented
- overly broad retry defaults can hide the difference between transient faults
  and real code bugs

## Improvement Targets

### High priority

- decide whether this file should become the real shared retry abstraction or be
  removed

### Medium priority

- narrow the default retry exception policy
- enrich retry logs with exception and delay details

## Bottom Line

`retry.py` is a reasonable helper, but right now it is more of an unrealized
abstraction than an active project standard.
