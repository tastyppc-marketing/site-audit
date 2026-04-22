# Script Audit: `platform/scripts/test_brand_mentions.py`

Last updated: 2026-04-18

File: [platform/scripts/test_brand_mentions.py](/root/site-audit/platform/scripts/test_brand_mentions.py:1)

## Purpose

`test_brand_mentions.py` is an interactive CLI for the BrandMentions connector.

It supports:

- Reddit mention search
- web mention search
- YouTube search
- directory listing checks
- review summaries
- an `all` mode combining those checks

## Inputs

### CLI inputs

- required `--method`
- optional `--brand`
- optional `--domain`
- optional `--location`
- optional `--log-level`

### Runtime dependencies

- `BrandMentionsConnector`

## Outputs

- prints serialized results for manual review
- logs start/completion or failure

## Strengths

- broad exploratory surface for a connector that likely aggregates diverse
  public-source checks
- sensible argument validation per method
- useful `all` mode for ad hoc audits

## Weaknesses

### Aggregates heterogeneous checks in one operator script

That is convenient, but it also means the script mixes very different external
data sources and reliability profiles.

### No API keys required does not mean no fragility

Public-source checks can still be unstable, rate-limited, or structurally
fragile.

### Mostly manual review

This script is designed for exploration, not repeatable assertion-based tests.

## Bottom Line

`test_brand_mentions.py` is a useful exploratory console for a loosely
structured connector domain. Its value is in fast operator feedback, not strict
automated validation.
