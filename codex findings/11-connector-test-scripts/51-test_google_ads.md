# Script Audit: `platform/scripts/test_google_ads.py`

Last updated: 2026-04-18

File: [platform/scripts/test_google_ads.py](/root/site-audit/platform/scripts/test_google_ads.py:1)

## Purpose

`test_google_ads.py` is an interactive test CLI for the Google Ads connector.

It lets an operator run selected connector methods or all supported methods in
sequence and inspect the resulting JSON.

## Inputs

### CLI inputs

- optional `--method`
- optional `--campaign-id`
- optional `--date-range`
- optional `--customer-id`

### Runtime dependencies

- `GoogleAdsConnector`
- configured Google Ads credentials

## Outputs

- prints formatted JSON results per method
- prints explicit configuration or API errors

## How It Works

### 1. Loads and validates required settings

It performs a clear pre-flight check for required Google Ads credentials.

### 2. Initializes the connector

It constructs the connector once and then runs one or more methods against it.

### 3. Handles method-specific requirements

For example, `campaign_performance` requires a `--campaign-id`, and the script
skips it in run-all mode if one is not provided.

## Strengths

- operator-friendly credential validation
- useful method dispatch and output formatting
- clearer than many one-off connector probes because it explains missing config
  early

## Weaknesses

### Mostly a manual inspection tool

Like the other connector test scripts, it checks “does this method return” more
than “does this workflow behave correctly.”

### Live Google Ads calls can be expensive or noisy

These checks still depend on real API behavior and may consume quota.

### Run-all mode is uneven

Some methods are skipped conditionally, so “run all” is not a uniform test of
the full connector surface.

## Bottom Line

`test_google_ads.py` is a useful operator console for the Google Ads connector.
It is best treated as an exploratory/manual validation script rather than a
full automated test suite.
