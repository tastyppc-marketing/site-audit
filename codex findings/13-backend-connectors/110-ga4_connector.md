# Script Audit: `platform/src/audit_platform/connectors/ga4.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/ga4.py](/root/site-audit/platform/src/audit_platform/connectors/ga4.py:1)

## Purpose

`ga4.py` wraps the Google Analytics 4 Data API and exposes a generic
`run_report(...)` method plus a few convenience report helpers.

Architecturally, this file looks more like an integration scaffold than a fully
landed audit component. It is present in the connector package, used in
`run_all.py`, and covered by a standalone test script, but the repo docs
already note that GA4 is not fully integrated into the current audit system.

## Inputs

Primary dependencies:

- `BaseConnector`
- `Settings`
- OAuth auth helpers
- service-account auth helpers
- `google-analytics-data` client library

Primary runtime inputs:

- GA4 property ID
- dimensions
- metrics
- date ranges

## Outputs

This connector returns flat `list[dict[str, Any]]` rows keyed by GA4 API field
names.

That output is usable, but it is not normalized into repo-specific models.

## How It Works

### 1. Lazily initializes the Google client

`_get_client(...)` prefers service-account credentials when configured and
falls back to OAuth credentials otherwise.

### 2. Uses a generic report builder

`run_report(...)` constructs a `RunReportRequest` with caller-supplied
dimensions and metrics, sends it, and parses the response rows.

### 3. Adds four convenience reports

The file exposes helpers for:

- landing pages
- acquisition
- page performance
- device breakdown

Each one is just a thin wrapper over `run_report(...)`.

## Strengths

- clear auth fallback strategy between service-account and OAuth flows
- `run_report(...)` is a good reusable core primitive
- response parsing is clean and easy to follow
- numeric metric coercion is practical for downstream use

## Weaknesses

### The connector is only lightly integrated into the real audit flow

The code is present and functional, but most of the current architecture still
treats GA4 as optional or not fully integrated. That makes this file easy to
assume is production-critical when it is still mostly a connector scaffold.

### Pagination and large-result handling are missing

`run_report(...)` does not expose limit/offset or loop through pages. Large
datasets can therefore truncate at API-side limits without the caller getting a
complete dataset.

### Output normalization stops at "flat API rows"

The connector returns GA4's own dimension and metric names directly. That keeps
the connector simple, but it pushes schema normalization responsibility onto the
next layer.

### Configuration is singleton-style, not clearly multi-client

The default property ID comes from one environment-backed setting. That is fine
for testing, but it is awkward for a multi-client audit system unless every
caller consistently passes explicit property IDs.

## Failure Modes

- reports can silently return only the first page of a larger dataset
- downstream code has to know GA4 field names directly, which increases schema
  coupling
- tenant/client scoping can be brittle if property IDs are not passed
  explicitly

## Improvement Targets

### High priority

- add explicit paging / offset support for larger reports
- decide whether this connector should return raw GA4 names or normalized repo
  names, then make that contract consistent
- make per-client property selection part of the main audit orchestration
  instead of relying on a single default setting

### Medium priority

- add richer convenience methods only after the integration contract is settled
- document clearly which reports are actually used in production vs testing

## Bottom Line

`ga4.py` is a clean connector implementation, but right now it is more complete
as a transport wrapper than as a fully integrated audit data source.

The biggest risk is not obviously wrong math inside this file. The bigger risk
is partial data and contract drift because GA4 is only loosely wired into the
rest of the system.
