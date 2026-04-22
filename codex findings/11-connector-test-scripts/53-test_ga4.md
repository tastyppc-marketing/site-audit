# Script Audit: `platform/scripts/test_ga4.py`

Last updated: 2026-04-18

File: [platform/scripts/test_ga4.py](/root/site-audit/platform/scripts/test_ga4.py:1)

## Purpose

`test_ga4.py` is an interactive CLI for the GA4 connector.

It supports built-in reports such as:

- landing pages
- acquisition
- page performance
- devices

and a custom-report mode.

## Inputs

### CLI inputs

- optional `--method`
- optional `--property-id`
- optional `--date-start`
- optional `--date-end`
- optional `--dimensions`
- optional `--metrics`

### Runtime dependencies

- `GA4Connector`
- GA4 credentials through service account or OAuth

## Outputs

- prints formatted report data to stdout
- surfaces config and API errors explicitly

## Strengths

- better pre-flight credential messaging than many one-off test scripts
- supports both built-in reports and custom queries
- useful for exploratory connector work

## Weaknesses

### Manual inspection oriented

This is still primarily an operator tool for checking returned data, not an
assertion-driven automated test.

### Run-all mode omits custom

Reasonable, but it means “all” is still only a subset of the connector
surface.

## Bottom Line

`test_ga4.py` is a solid interactive test harness for GA4 connector methods.
Its main limitation is scope: it validates method calls, not the full GA4 data
flow into the audit pipeline.
