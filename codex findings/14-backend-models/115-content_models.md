# Script Audit: `platform/src/audit_platform/models/content.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/models/content.py](/root/site-audit/platform/src/audit_platform/models/content.py:1)

## Purpose

`content.py` defines the backend data contracts for content-quality analysis.

It covers:

- readability metrics
- keyword usage
- structural analysis
- per-page content quality records
- duplicate-content groups
- keyword cannibalization records

This is one of the richer model files in the repo and it closely matches the
ambition of the corresponding analyzer.

## Inputs

Primary dependencies:

- `pydantic`
- `datetime`
- `typing`

Primary runtime producers:

- `ContentQualityAnalyzer`
- any future content-review workflows

## Outputs

This file provides the following typed models:

- `ReadabilityMetrics`
- `KeywordUsage`
- `ContentStructure`
- `ContentQualityRecord`
- `DuplicateGroup`
- `CannibalizationRecord`

## How It Works

### 1. Breaks the domain into nested submodels

The file models readability, keyword usage, and structure separately, then
embeds them into `ContentQualityRecord`.

### 2. Supports both site-audit and review workflows

`ContentQualityRecord` includes a `mode` field and comment-level guidance for
both crawled-page analysis and pre-publication content review.

### 3. Models both single-page and multi-page findings

`ContentQualityRecord` handles per-page quality, while `DuplicateGroup` and
`CannibalizationRecord` represent cross-page relationships.

## Strengths

- strong overall decomposition into reusable submodels
- good alignment with the analyzer's responsibilities
- the content domain is modeled more thoughtfully here than in many other parts
  of the repo
- defaults make the models easy to construct incrementally

## Weaknesses

### Some fields fall back to loose strings and dicts

`issues` and `recommendations` are plain string lists. `CannibalizationRecord`
stores `pages` as `list[dict[str, Any]]`.

That keeps construction simple, but it means severity, category, and row-shape
consistency are enforced only by caller discipline, not by the model layer.

### `mode` is not constrained

`ContentQualityRecord.mode` is documented as `"audit"` or `"review"`, but the
field is a plain string rather than a `Literal` or enum-backed type.

### Timestamps are timezone-naive

`analyzed_at` uses `datetime.utcnow`, which creates naive UTC timestamps. That
pattern appears elsewhere in the repo and can create ambiguity at integration
boundaries.

## Failure Modes

- issue and recommendation semantics can drift because they are unstructured
  strings
- cannibalization page rows can vary by caller because they are loosely typed
- mode-specific assumptions can drift because the field is not validated

## Improvement Targets

### High priority

- introduce structured issue/recommendation models if the reporting layer needs
  consistent severity and categorization
- type the cannibalization page entries more explicitly

### Medium priority

- constrain `mode` to the supported values
- standardize timestamp handling across the model layer

## Bottom Line

`content.py` is one of the better-designed schema modules in the repo.

Its main weakness is not lack of thought. The weakness is that some important
payloads still collapse back into untyped dicts and string lists right where the
rest of the architecture would benefit most from stronger contracts.
