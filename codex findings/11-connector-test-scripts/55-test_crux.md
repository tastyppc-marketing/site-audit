# Script Audit: `platform/scripts/test_crux.py`

Last updated: 2026-04-18

File: [platform/scripts/test_crux.py](/root/site-audit/platform/scripts/test_crux.py:1)

## Purpose

`test_crux.py` is a standalone CLI for validating the CrUX connector against
either a URL or an origin.

It can also request a fuller segmented view across form factors.

## Inputs

### CLI inputs

- required `--url` or `--origin`
- optional `--form-factor`
- optional `--full`
- optional `--log-level`

### Runtime dependencies

- `CrUXConnector`

## Outputs

- prints a compact vitals summary
- prints raw JSON output for the query

## Strengths

- small and focused
- supports both URL- and origin-level queries
- exposes a useful compact summary before raw JSON

## Weaknesses

### Manual connector check only

It validates connector response shape and access, but not how CrUX data flows
through the broader audit platform.

### Limited diagnostics layering

Errors are shown, but the script does not differentiate common “no data”
conditions from connector or request problems beyond basic messaging.

## Bottom Line

`test_crux.py` is a clean operator tool for checking CrUX access and output. It
is intentionally narrow and useful, but not a substitute for broader workflow
testing.
