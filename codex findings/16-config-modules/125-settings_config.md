# Script Audit: `platform/src/audit_platform/config/settings.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/config/settings.py](/root/site-audit/platform/src/audit_platform/config/settings.py:1)

## Purpose

`settings.py` defines the environment-backed configuration object for the
backend.

It centralizes:

- Google OAuth credentials
- Google Ads identifiers
- GA4 property selection
- Search Console property selection
- API keys
- DataForSEO credentials
- Business Profile IDs
- logging and HTTP timeout settings

## Inputs

Primary dependencies:

- `pydantic-settings`
- `Path`

Primary runtime consumers:

- nearly every connector
- `build_audit.py`
- standalone test scripts

## Outputs

This file provides the `Settings` model used throughout the backend.

## How It Works

### 1. Loads environment values via `BaseSettings`

The model is configured to read `.env`, decode as UTF-8, and ignore unknown
environment variables.

### 2. Stores both credentials and runtime selectors

The class mixes secrets, API keys, property/account IDs, log level, and timeout
values in one mutable settings object.

## Strengths

- simple and easy to use
- one central place for connector configuration
- typed fields are better than reading environment variables ad hoc across the
  codebase

## Weaknesses

### Validation is very light

There is no meaningful validation for:

- URL-like values
- numeric IDs
- timeout ranges
- required field combinations

So configuration problems tend to surface only when connectors try to use the
values.

### Unknown env vars are ignored silently

`extra="ignore"` is convenient, but it also means misspelled environment
variables can fail silently.

### The `.env` file path is launch-directory sensitive

The config points to `.env` without anchoring it to the project root. That
means behavior can vary depending on the working directory used to start the
process.

### `Settings` is used as a mutable runtime bag, not just env config

`build_audit.py` mutates fields like `SEARCH_CONSOLE_SITE_URL`,
`GA4_PROPERTY_ID`, `GBP_ACCOUNT_ID`, and `GBP_LOCATION_ID` at runtime from a
client config file.

That is practical, but it means `Settings` is not just a snapshot of env state.
It is also being used as a mutable per-run configuration container.

## Failure Modes

- invalid configuration values fail late at connector runtime
- misspelled env vars can be silently ignored
- launching from different directories can change which `.env` file is loaded
- runtime mutation can blur the distinction between static config and per-run
  overrides

## Improvement Targets

### High priority

- add validation for the fields most likely to fail operationally
- make the `.env` resolution strategy explicit so process working directory does
  not become a hidden variable
- decide whether runtime overrides belong on `Settings` or on a separate
  per-run config object

### Medium priority

- consider tightening unknown-env handling in environments where operational
  correctness matters more than convenience

## Bottom Line

`settings.py` is a necessary and useful central config file, but it is looser
than the rest of the architecture would benefit from.

The biggest issue is not missing fields. The issue is that the file combines
static env config and mutable runtime overrides without making that boundary
explicit.
