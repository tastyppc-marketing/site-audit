# Script Audit: `platform/scripts/run_all.py`

Last updated: 2026-04-18

File: [platform/scripts/run_all.py](/root/site-audit/platform/scripts/run_all.py:1)

## Purpose

`run_all.py` is a connector smoke-test script for the Python audit platform.

It loads settings from `.env`, tries to initialize each connector, runs one
lightweight probe per configured service, and prints a summary.

## Inputs

Runtime dependencies:

- `audit_platform.config.Settings`
- configured credentials in `.env`
- installed connector dependencies

Connectors probed:

- Google Ads
- GA4
- Search Console
- PageSpeed
- CrUX
- Business Profile
- DataForSEO

## Outputs

- prints connector probe results to stdout
- exits non-zero if any configured connector fails

## How It Works

### 1. Loads platform settings

It fails fast if the platform package or settings cannot be imported.

### 2. Runs one probe per connector

Each probe:

- checks whether required credentials are present
- instantiates the connector
- executes a small validation call

### 3. Aggregates and prints results

It tracks:

- `OK`
- `FAIL`
- `SKIP`

status per connector and summarizes them at the end.

## Strengths

- good operational sanity-check script
- clearly distinguishes missing credentials from actual failures
- easy to run when validating a new environment

## Weaknesses

### Uses live services and potentially real quota

Even “lightweight” validation calls can consume quota, trigger logs, or cost
money depending on the connector.

### Mixed connector semantics

Different connectors are validated with different levels of depth, so "OK" does
not mean the same thing for every service.

### Broad success criterion

A successful probe only proves a minimal slice of access, not that the
connector is robust for the full audit workflow.

## Failure Modes

- temporary third-party outages causing false red alarms
- quota or rate limits causing smoke failures
- credentials configured enough for a basic call but insufficient for the full
  audit flow

## Improvement Targets

### High priority

- Document probe cost/quota implications for each connector
- Distinguish “credential valid” from “full workflow validated”
- Add optional dry-run/cheap mode where available

### Medium priority

- Emit machine-readable output for CI or environment diagnostics
- Add per-connector timing and response summaries

## Bottom Line

`run_all.py` is a useful environment-validation script, not a full system test.
It tells you whether core connectors can talk to their services, but not
whether the entire audit pipeline is healthy.
