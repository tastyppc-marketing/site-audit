# Script Audit: `platform/src/audit_platform/connectors/pagespeed.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/pagespeed.py](/root/site-audit/platform/src/audit_platform/connectors/pagespeed.py:1)

## Purpose

`pagespeed.py` wraps the Google PageSpeed Insights API and normalizes the
response into `PageSpeedRecord` and `CoreWebVitals` models.

This is one of the cleaner performance-data connectors in the repo and it is
lightly exercised in `run_all.py` and the standalone connector test script.

## Inputs

Primary dependencies:

- `BaseConnector`
- `Settings`
- `httpx`
- `PageSpeedRecord`
- `CoreWebVitals`

Primary runtime inputs:

- URL
- strategy (`mobile` or `desktop`)
- optional category list
- optional API key from settings

## Outputs

This file returns:

- `PageSpeedRecord` from `analyze(...)`
- `list[PageSpeedRecord]` from `analyze_batch(...)`
- `CoreWebVitals` from `get_core_web_vitals(...)`

The output typing is good, but the naming around `CoreWebVitals` needs to be
read carefully.

## How It Works

### 1. Builds PSI query parameters

`_build_params(...)` constructs the request parameters including repeated
`category` entries and the optional API key.

### 2. Parses Lighthouse output into a typed record

`_parse_response(...)` extracts the performance score, key lab metrics, and
two additional audit groups:

- opportunities
- diagnostics

### 3. Supports batch mode with manual pacing

`analyze_batch(...)` runs `analyze(...)` sequentially and inserts sleeps based
on whether an API key is configured.

### 4. Builds a combined performance object

`get_core_web_vitals(...)` runs both mobile and desktop PSI analyses and stores
them in a `CoreWebVitals` model.

## Strengths

- typed outputs are clear and useful
- opportunity and diagnostic extraction is practical for reports
- the code is compact and easy to follow
- batch mode degrades gracefully by skipping failed URLs instead of aborting the
  entire run

## Weaknesses

### It bypasses the base request helper

Like several other connectors, this file talks to `self.sync_client` directly
instead of using a shared retry-aware base request path.

### `get_core_web_vitals(...)` is easy to misread

The returned `CoreWebVitals` model has fields for CrUX field data
(`mobile` / `desktop`) and Lighthouse lab data (`lighthouse_mobile` /
`lighthouse_desktop`).

This connector only populates the Lighthouse fields. So the method name sounds
broader than the actual data it returns.

### Rate limiting is partly duplicated locally

The batch implementation manually sleeps between requests rather than relying on
a centralized request helper and policy.

### There is some dead or misleading internal structure

`_METRIC_AUDIT_IDS` is defined but not actually used anywhere in the parsing
path. That is small, but it is a sign the file has some leftover structure that
is no longer pulling its weight.

## Failure Modes

- transient PSI failures are not retried through a common base policy
- callers can assume `get_core_web_vitals(...)` includes field data when it
  really contains Lighthouse lab data only
- batch runs can be slower and harder to tune because pacing logic is embedded
  here instead of centralized

## Improvement Targets

### High priority

- move request execution onto a shared retry-aware helper
- make the `get_core_web_vitals(...)` contract more explicit, either in naming
  or documentation, so consumers do not confuse PSI lab data with CrUX field
  data

### Medium priority

- remove or use `_METRIC_AUDIT_IDS`
- centralize sync pacing / retry policy instead of open-coding sleeps in the
  batch method

## Bottom Line

`pagespeed.py` is a solid connector overall and lower risk than the weaker
scraper-based sources.

The biggest concern here is not obviously bad metric extraction. The main risk
is contract confusion between Lighthouse lab data and true field CWV data, plus
the recurring architectural issue of bypassing shared request helpers.
