# Script Audit: `platform/scripts/test_dataforseo.py`

Last updated: 2026-04-18

File: [platform/scripts/test_dataforseo.py](/root/site-audit/platform/scripts/test_dataforseo.py:1)

## Purpose

`test_dataforseo.py` is an interactive test CLI for the DataForSEO connector.

It supports multiple API methods from one script, including:

- SERP lookups
- keyword data
- keyword suggestions
- backlinks and referring domains
- competitors
- domain metrics
- intersection
- local pack

## Inputs

### CLI inputs

- required `--method`
- optional `--keyword`
- optional `--domain`
- optional `--log-level`

### Runtime dependencies

- `DataForSEOConnector`
- DataForSEO credentials
- `structlog`

## Outputs

- prints formatted results to stdout
- logs start/completion or errors
- exits non-zero on API or runtime failure

## Strengths

- broad connector surface area exposed through one operator-friendly script
- clear method dispatch structure
- validates argument requirements per method

## Weaknesses

### One script covering many unrelated workflows

This is convenient, but it also means the script is serving as a Swiss-army
knife rather than a narrowly scoped test harness.

### Mostly manual output

Results are printed for human inspection; there is little assertion logic beyond
whether the call failed.

### Live-service and quota implications

Different methods may vary significantly in cost, latency, and quota usage.

## Bottom Line

`test_dataforseo.py` is a practical interactive connector console. It is very
useful for exploration and credential validation, but it is not a substitute
for structured workflow tests around the repo’s actual DataForSEO usage.
