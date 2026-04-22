# Script Audit: `platform/src/audit_platform/utils/logging.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/utils/logging.py](/root/site-audit/platform/src/audit_platform/utils/logging.py:1)

## Purpose

`logging.py` configures the repo's structured logging behavior.

It sets up stdlib logging plus `structlog` so scripts and connectors can emit
JSON logs with timestamps and contextual fields.

## Inputs

Primary dependencies:

- `logging`
- `sys`
- `structlog`

Primary runtime consumers:

- connector test scripts
- any caller that explicitly invokes `setup_logging(...)`

## Outputs

This file provides `setup_logging(...)`.

## How It Works

### 1. Configures stdlib logging

`logging.basicConfig(...)` points logging at stdout, uses a simple message
format, and applies the requested level.

### 2. Configures `structlog`

The file sets up a JSON-rendering processor chain with timestamps, exception
formatting, logger names, and log levels.

## Strengths

- consistent structured logging output
- easy to adopt in scripts
- `structlog` configuration is straightforward and production-friendly

## Weaknesses

### `force=True` is intrusive

`logging.basicConfig(..., force=True)` resets existing logging configuration.
That is convenient for standalone scripts, but it can be disruptive when this
package is embedded inside a larger application.

### Output mode is fixed

The configuration always ends in `JSONRenderer()`. There is no dev-mode pretty
renderer or environment-based switch.

### Logging setup is opt-in

This helper exists, but library callers have to remember to invoke it. The repo
does not appear to enforce one central application bootstrap path.

## Failure Modes

- embedding this code into a larger process can unexpectedly clobber existing
  logging config
- different entrypoints can produce inconsistent logging if some call
  `setup_logging(...)` and others do not

## Improvement Targets

### Medium priority

- consider making `force=True` optional
- consider supporting a human-readable renderer for local development
- define a more explicit bootstrap path if the backend is expected to run as a
  unified application rather than only as scripts

## Bottom Line

`logging.py` is a solid script-oriented logging helper. Its main issue is that
it is opinionated in a way that works best for standalone execution, not for
embedding in larger runtimes.
