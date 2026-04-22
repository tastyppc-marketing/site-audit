# Script Audit: `platform/scripts/test_local_seo.py`

Last updated: 2026-04-18

File: [platform/scripts/test_local_seo.py](/root/site-audit/platform/scripts/test_local_seo.py:1)

## Purpose

`test_local_seo.py` is an interactive CLI for the LocalSEO connector.

It supports:

- NAP consistency checks
- local pack checks
- GBP completeness scoring
- citation opportunity discovery
- a combined `all` mode

## Inputs

### CLI inputs

- required `--method`
- optional `--business`
- optional `--address`
- optional `--phone`
- optional `--domain`
- optional `--location`
- optional `--industry`
- optional `--keywords`
- optional `--log-level`

### Runtime dependencies

- `LocalSEOConnector`
- optional DataForSEO credentials for richer local-pack behavior

## Outputs

- prints serialized results for manual inspection
- logs start/completion or failure

## Strengths

- broad local-SEO operational coverage from one script
- method-level argument validation is clear
- useful combined mode for quick exploratory audits

## Weaknesses

### Mixed real and sample data behavior

The GBP completeness mode explicitly uses sample profile data, which is useful
for demonstration but means not every mode is validating live connector input.

### Wide functional surface in one script

This is effectively a local-SEO toolbox rather than a narrowly scoped test
harness.

### Manual result inspection

As with the other connector test scripts, output is designed for operator review
more than automated assertion.

## Bottom Line

`test_local_seo.py` is a practical local-SEO operator tool. It is especially
useful for ad hoc exploration, but its mixed use of real and sample data means
it should not be mistaken for a strict end-to-end validation script.
