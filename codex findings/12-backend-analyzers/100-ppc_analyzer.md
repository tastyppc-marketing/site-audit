# Script Audit: `platform/src/audit_platform/analyzers/ppc_analyzer.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/ppc_analyzer.py](/root/site-audit/platform/src/audit_platform/analyzers/ppc_analyzer.py:1)

## Purpose

`ppc_analyzer.py` is the backend PPC audit engine.

It reviews account structure, Quality Score, wasted spend, search-term n-grams,
budget and bidding setup, and turns those checks into an account score plus
prioritized recommendations.

This is the backend source behind much of the PPC report stack already audited
on the frontend side.

## Inputs

Primary dependencies:

- `structlog`

Primary runtime inputs:

- campaign records
- ad group records
- keyword records
- search-term records
- optional target CPA

## Outputs

The main `analyze(...)` method returns:

- `accountScore`
- `structure`
- `qualityScore`
- `wastedSpend`
- `ngramAnalysis`
- `budgetBidding`
- `recommendations`

## How It Works

### 1. Computes a target CPA

If the caller does not provide one, the analyzer derives account-level CPA from
keyword cost and conversion data.

### 2. Audits structure

Structure analysis checks:

- brand vs non-brand separation
- oversized ad groups
- duplicate keywords
- match-type mix
- dead keywords

### 3. Audits Quality Score

The file calculates impression-weighted account QS, low-QS prevalence, below-
average subcomponents, and low-QS top spenders.

### 4. Estimates wasted spend

Wasted-spend logic currently focuses on:

- zero-conversion keywords with high clicks
- CPA outliers
- broad match without smart bidding
- zero-conversion spend percentage

### 5. Mines search-term n-grams

Search terms are aggregated into 1-, 2-, and 3-gram performance slices and used
to suggest negative keywords.

### 6. Scores the account

Checks are weighted by severity and category, then converted into a final score
and grade.

## Interactions With Other Scripts

This module is tightly related to:

- Google Ads connector outputs
- PPC report generators
- PPC page renderers and shared runtime already audited
- `platform/tests/test_ppc_analyzer.py`

## Strengths

- coherent backend source for the PPC audit model
- clear check IDs and categories
- n-gram logic explicitly avoids the common aggregation-rate mistake
- recommendations are generated from the same checks used in scoring

## Weaknesses

### `search_terms` is passed into wasted-spend analysis but not used there

`_analyze_wasted_spend(...)` accepts `search_terms`, yet all of its logic is
keyword-based.

That means search-term-specific wasted-spend opportunities are not part of the
actual wasted-spend section even though the function signature suggests they are.

### `ad_groups` are barely used

The structure section takes `ad_groups`, but the analysis logic mostly derives
structure from keyword records and only uses `ad_groups` for the total count in
summary output.

That suggests the contract is broader than the current implementation.

### Broad-match smart-bidding detection uses keyword-level strategy fields

The analyzer builds campaign strategy state from keyword rows, not the campaign
records passed in separately.

If keyword rows are incomplete or inconsistent, this check can misclassify
campaign strategy.

### Some scoring categories are conceptual rather than implemented

The category-weight table includes categories like:

- `conversion_tracking`
- `ads_assets`

but this file does not generate checks for those areas.

The score is still computed correctly across present checks, but the conceptual
coverage is broader than the actual implemented audit surface.

### Budget / impression-share logic is labeled as a Quality Score check

The average search impression share check uses ID `QS-09` and category
`quality_score`, even though it belongs to budget and bidding analysis.

That category drift matches the report-layer drift already seen elsewhere in the
PPC stack.

## Failure Modes

- search-term waste can be underrepresented because it lives only in n-gram
  recommendations, not the core wasted-spend analysis
- incomplete keyword fields can distort campaign strategy checks
- account scoring can appear comprehensive while skipping major categories like
  conversion tracking and ad assets

## Improvement Targets

### High priority

- decide whether wasted spend should analyze search terms directly and implement
  that if yes
- use campaign records as the source of truth for bidding-strategy checks
- either implement the missing score categories or remove them from the stated
  model

### Medium priority

- make fuller use of `ad_groups` in structure analysis
- clean up check IDs and categories so budgeting logic is not mislabeled as
  Quality Score logic

## Bottom Line

`ppc_analyzer.py` is a solid backend source module and notably cleaner than some
of the PPC report-layer duplication around it.

Its biggest issue is coverage honesty: the structure is good, but some parts of
the public contract imply a broader PPC audit than the implementation currently
delivers.
