# Script Audit: `platform/src/audit_platform/models/seo.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/models/seo.py](/root/site-audit/platform/src/audit_platform/models/seo.py:1)

## Purpose

`seo.py` defines the base models for keyword, backlink, page-audit, and domain
metric data across the SEO pipeline.

This is one of the most foundational schema files in the repo because multiple
connectors and analyzers depend on these records.

## Inputs

Primary dependencies:

- `pydantic`
- `datetime`
- `typing`

Primary runtime producers:

- `DataForSEOConnector`
- backlink analyzer
- competitor analyzer
- other SEO data pipelines

## Outputs

This file provides:

- `KeywordRecord`
- `BacklinkRecord`
- `OrganicKeywordRecord`
- `PageAuditRecord`
- `DomainMetrics`

## How It Works

The file defines a compact model set for the main SEO entity types and leaves
some richer interpretation work to analyzers.

## Strengths

- broad reuse across the SEO pipeline
- compact and easy to understand
- `KeywordRecord` includes provenance via `source` and `fetched_at`

## Weaknesses

### Some defaults can hide uncertainty

`BacklinkRecord.is_dofollow` defaults to `True`. If a producer omits the field
or lacks precise follow-state data, the model silently turns unknown into a
positive assertion.

### The domain models are uneven in provenance

`KeywordRecord` includes `source` and `fetched_at`, but `DomainMetrics` does not
carry a timestamp. That inconsistency matters when debugging stale or mismapped
SEO data.

### Important payloads still rely on generic structures

`PageAuditRecord.og_tags` is a plain dict and `issues` is a string list.
That may be sufficient, but it limits consistency once reporting wants richer
issue typing.

## Failure Modes

- unknown backlink follow state can be overstated as dofollow
- freshness debugging is harder for domain-level metrics than for keyword rows
- issue semantics can drift because page issues are just free-form strings

## Improvement Targets

### High priority

- revisit whether `BacklinkRecord.is_dofollow` should default to `True` or be
  nullable / more explicit about unknown state

### Medium priority

- align provenance fields across the SEO model set
- introduce structured issue payloads if page-audit reporting needs consistent
  severity and categories

## Bottom Line

`seo.py` is a central schema file and mostly does its job well, but it contains
some contract shortcuts that can matter in real data-quality debugging.

The most important one is the default dofollow assumption, because it can make
incomplete source data look more certain than it really is.
