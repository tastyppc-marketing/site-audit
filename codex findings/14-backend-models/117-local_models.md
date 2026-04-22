# Script Audit: `platform/src/audit_platform/models/local.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/models/local.py](/root/site-audit/platform/src/audit_platform/models/local.py:1)

## Purpose

`local.py` defines the normalized model layer for Google Business Profile and
local performance data.

It is the schema target for the Business Profile connector and the cleanest
typed representation of local business records in the backend.

## Inputs

Primary dependencies:

- `pydantic`
- `datetime`
- `date`
- `typing`

Primary runtime producers:

- `BusinessProfileConnector`

## Outputs

This file provides:

- `BusinessProfileRecord`
- `LocalPerformanceRecord`

## How It Works

### 1. Normalizes location/profile metadata

`BusinessProfileRecord` captures business identity, address, contact,
categories, verification state, coordinates, review summary, and attributes.

### 2. Normalizes daily local-performance metrics

`LocalPerformanceRecord` stores per-day performance numbers across search/maps
surfaces and actions like calls, website clicks, and direction requests.

## Strengths

- the local business domain is represented cleanly and readably
- the split between profile metadata and performance metrics is correct
- these models are more structured than the local SEO heuristic outputs

## Weaknesses

### Category fields overlap semantically

`BusinessProfileRecord` includes both `primary_category` and `category`.

That may be intentional for source compatibility, but it creates ambiguity about
which field callers should trust as the canonical one.

### Backward-compatibility aliases preserve drift

`LocalPerformanceRecord` keeps legacy fields like
`business_queries_search` and `business_queries_maps`.

That is pragmatic, but it also lets old and new naming schemes coexist longer
than ideal.

### Timestamp handling is again naive UTC

Both models use `datetime.utcnow` for `fetched_at`.

## Failure Modes

- callers can diverge on whether `category` or `primary_category` is canonical
- legacy aliases can keep downstream naming drift alive
- timestamp ambiguity remains a cross-cutting integration issue

## Improvement Targets

### Medium priority

- document or enforce which category field should be treated as canonical
- phase out legacy aliases once downstream consumers are updated
- standardize timezone-aware timestamp handling

## Bottom Line

`local.py` is a good model file. The problems here are mostly contract-clarity
issues, not major schema-design flaws.

Notably, these models are cleaner than some of the surrounding local SEO
heuristic layers, which means local-data problems are more likely upstream or
downstream than inside this file itself.
