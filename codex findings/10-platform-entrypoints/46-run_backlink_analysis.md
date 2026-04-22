# Script Audit: `platform/scripts/run_backlink_analysis.py`

Last updated: 2026-04-18

File: [platform/scripts/run_backlink_analysis.py](/root/site-audit/platform/scripts/run_backlink_analysis.py:1)

## Purpose

`run_backlink_analysis.py` is a Python CLI wrapper around the platform's
backlink analysis workflow.

It can:

- analyze a target domain
- include competitor backlink analysis
- run backlink intersection
- generate backlink opportunities
- merge results into an `audit-data.json` file

## Inputs

### CLI inputs

- `--domain`
- optional `--competitors`
- optional `--output`
- optional `--backlink-limit`
- optional `--intersection`
- optional `--opportunities` / `--no-opportunities`
- optional `--min-dr`

### Runtime dependencies

- `audit_platform.analyzers.backlinks.BacklinkAnalyzer`
- `audit_platform.connectors.dataforseo.DataForSEOConnector`
- configured DataForSEO credentials

## Outputs

- prints analysis status to stderr
- prints JSON to stdout when `--output` is omitted
- or merges results into an existing JSON file when `--output` is provided

## How It Works

### 1. Parses CLI arguments

It builds the target and competitor domain list from command-line inputs.

### 2. Validates DataForSEO credentials

It exits early if the necessary login is missing.

### 3. Runs backlink analysis via the platform analyzer

It executes the base backlink analysis, then optionally:

- intersection analysis
- opportunity discovery

### 4. Writes or merges results

If an output file is provided, it shallow-merges selected top-level keys into
that JSON object.

## Strengths

- useful operational wrapper around the Python analyzer
- supports several backlink-analysis modes from one entrypoint
- can output either standalone JSON or merge into report data

## Weaknesses

### Shallow merge risk into `audit-data.json`

The script writes top-level keys like:

- `backlinks`
- `domainMetrics`
- `backlinkIntersection`
- `backlinkOpportunities`

That is convenient, but `domainMetrics` in particular can collide with other
report uses of domain-level metrics and overwrite unrelated structures.

### Output contract is implicit

The script assumes consumers know what each top-level merged field means and
how it fits the broader report contract.

### Tight coupling to DataForSEO

This wrapper is effectively a DataForSEO entrypoint, not a provider-agnostic
backlink runner.

## Failure Modes

- shallow merge overwriting unrelated report fields
- partial output creating mixed or stale report state
- opportunity/intersection modes silently changing the final JSON contract

## Improvement Targets

### High priority

- Namescape merged output more explicitly to avoid `domainMetrics` collisions
- Emit a merge summary describing exactly which top-level fields were modified
- Clarify whether this script is canonical for backlink population into
  `audit-data.json`

### Medium priority

- Add a `--dry-run` mode for merge previews
- Write a companion manifest showing analyzer version and parameters used

## Bottom Line

`run_backlink_analysis.py` is operationally useful, but it has one important
architectural risk: it merges backlink-derived data into shared report JSON
using broad top-level keys that can conflict with other parts of the audit
contract.
