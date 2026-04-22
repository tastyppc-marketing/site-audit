# Script Audit: `platform/scripts/test_search_console.py`

Last updated: 2026-04-18

File: [platform/scripts/test_search_console.py](/root/site-audit/platform/scripts/test_search_console.py:1)

## Purpose

`test_search_console.py` is a standalone connector test CLI for Search
Console.

It can query:

- queries
- pages
- devices
- countries
- query-page combinations
- indexing status

## Inputs

### CLI inputs

- optional `--method`
- optional `--site-url`
- optional `--days`
- optional `--row-limit`
- optional `--log-level`

### Runtime dependencies

- `SearchConsoleConnector`
- Search Console credentials and site access

## Outputs

- prints JSON results to stdout
- prints row counts for list responses

## Strengths

- simple and focused
- useful date-window parameters for connector validation
- covers several common Search Console query shapes

## Weaknesses

### Purely live and manual

Like the other connector test scripts, it is a live operator tool rather than a
repeatable assertion-based test.

### Broad exception handling

Errors are surfaced clearly, but the script does not distinguish between auth,
quota, empty data, or schema issues in any structured way.

## Bottom Line

`test_search_console.py` is a practical manual connector check. It is good for
verifying property access and basic query behavior, but it is not a workflow
test for downstream report population.
