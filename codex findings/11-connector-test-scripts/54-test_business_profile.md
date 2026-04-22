# Script Audit: `platform/scripts/test_business_profile.py`

Last updated: 2026-04-18

File: [platform/scripts/test_business_profile.py](/root/site-audit/platform/scripts/test_business_profile.py:1)

## Purpose

`test_business_profile.py` is an interactive connector test script for the
Google Business Profile connector.

It supports:

- listing locations
- performance retrieval
- keyword retrieval
- review retrieval

## Inputs

### CLI inputs

- required `--method`
- optional `--account-id`
- optional `--location-id`
- optional `--log-level`

### Runtime dependencies

- `BusinessProfileConnector`
- valid GBP access

## Outputs

- prints serialized connector results
- exits non-zero on failure

## Strengths

- clear method-specific validation
- good fallback behavior from CLI args to `.env` values
- operator-friendly output trimming for large result sets

## Weaknesses

### Live-service, manual validation only

As with the other connector test scripts, it proves access and basic behavior,
not end-to-end report correctness.

### Minimal error typing

All failures are logged through a broad exception path rather than being
classified into configuration vs API vs empty-data states.

## Bottom Line

`test_business_profile.py` is a practical manual connector check. It is useful
for verifying access to GBP accounts and locations, but it remains an operator
tool rather than a robust automated test.
