# Script Audit: `platform/tests/test_models.py`

Last updated: 2026-04-18

File: [platform/tests/test_models.py](/root/site-audit/platform/tests/test_models.py:1)

## Purpose

`test_models.py` validates the Pydantic model layer across several domains:

- SEO
- PPC
- performance
- local / business profile

It focuses mainly on:

- model creation
- defaults
- serialization roundtrips

## Inputs

Test dependencies:

- `pytest`
- model classes from:
  - `audit_platform.models.seo`
  - `audit_platform.models.ppc`
  - `audit_platform.models.performance`
  - `audit_platform.models.local`

## Outputs

No runtime artifacts. The file asserts model behavior.

## How It Works

### 1. Tests representative models by domain

The suite includes targeted tests for:

- `KeywordRecord`
- `BacklinkRecord`
- `OrganicKeywordRecord`
- `PageAuditRecord`
- `DomainMetrics`
- `CampaignRecord`
- `AdGroupRecord`
- `SearchTermRecord`
- `KeywordPPCRecord`
- `PageSpeedRecord`
- `CrUXRecord`
- `CoreWebVitals`
- `BusinessProfileRecord`
- `LocalPerformanceRecord`

### 2. Verifies defaults and roundtrips

Most tests follow one of two patterns:

- construct with minimal required fields and check defaults
- `model_dump()` and reconstruct to verify roundtrip stability

### 3. Adds a cross-cutting parametric roundtrip suite

At the end, `TestAllModelsSerialization` runs a common roundtrip check across
all major model classes.

## Strengths

- broad surface-area coverage across the data model layer
- serialization roundtrip testing is valuable in this repo because so much data
  moves through JSON files
- model-default expectations are documented clearly by the tests themselves

## Weaknesses

### Mostly shallow validation

The suite confirms that models can be created and roundtrip cleanly, but it does
not deeply test:

- invalid inputs
- boundary conditions
- field aliasing
- normalization rules
- business invariants between fields

### Equality-heavy strategy

Many tests rely on full object equality after reconstruction. That is useful,
but it mainly proves schema stability, not semantic correctness.

### Limited negative testing

There is very little coverage for what should be rejected.

## Failure Modes

- models can accept semantically bad data while these tests still pass
- alias or coercion regressions could slip through if the model still roundtrips
- contract drift at the semantic level may not be caught because defaults are
  the main thing being asserted

## Improvement Targets

### High priority

- add negative tests for invalid field types and impossible values
- add alias / normalization tests where model inputs may arrive in mixed naming
  styles
- test more cross-field invariants for PPC and SEO records

### Medium priority

- keep the roundtrip suite, but pair it with richer validation-focused cases

## Bottom Line

`test_models.py` is a useful baseline contract suite for the model layer.

It tells us the repo cares about model stability and JSON roundtrips, but it is
not yet a deep validator of semantic data quality.
