# Script Audit: `platform/tests/test_ppc_analyzer.py`

Last updated: 2026-04-18

File: [platform/tests/test_ppc_analyzer.py](/root/site-audit/platform/tests/test_ppc_analyzer.py:1)

## Purpose

`test_ppc_analyzer.py` validates `PPCAnalyzer`, the backend analyzer that
produces the PPC audit data consumed by the PPC report stack.

It covers:

- full PPC analysis output
- structure analysis
- quality-score analysis
- wasted-spend analysis
- n-gram analysis
- budget / bidding analysis
- account-score computation
- recommendation generation
- helper calculations

## Inputs

Test dependencies:

- `pytest`
- `PPCAnalyzer`

Primary synthetic fixtures:

- `sample_keywords`
- `sample_campaigns`
- `sample_search_terms`

The fixtures intentionally model:

- branded vs non-branded campaigns
- low- and high-quality-score keywords
- broad-match manual CPC waste
- zero-conversion search terms
- negative-keyword candidates

## Outputs

No runtime artifacts. The file asserts analyzer behavior.

## How It Works

### 1. Validates the end-to-end PPC analyzer contract

The full-analyze tests confirm the analyzer emits the major sections used by the
PPC report:

- `accountScore`
- `structure`
- `qualityScore`
- `wastedSpend`
- `ngramAnalysis`
- `budgetBidding`
- `recommendations`

### 2. Tests each audit category independently

The suite includes focused checks around:

- structure IDs like `ST-04` and `ST-09`
- quality-score IDs like `QS-03` through `QS-08`
- wasted-spend IDs like `WS-05`
- budget / bidding IDs like `SE-07`

### 3. Tests scoring and recommendation logic

It validates:

- impression-weighted account QS
- zero-conversion thresholds
- broad-match waste detection
- n-gram aggregation
- smart-bidding evaluation
- account-score grade behavior
- recommendation priority sorting and caps

## Strengths

- directly tied to the PPC report contract, which makes it highly relevant to
  current data-quality problems
- fixture scenarios are practical and easy to understand
- good coverage of the named check-ID system the PPC pages already depend on
- tests both full output and important helper logic

## Weaknesses

### Strong coupling to check IDs and status labels

The suite assumes a lot about specific IDs like `ST-04`, `QS-08`, `WS-05`, and
`SE-07`. That reflects the current analyzer design, but it also locks tests to
internal naming decisions.

### Small synthetic datasets

The sample datasets are good for clarity, but limited for exploring:

- partial PPC exports
- noisy Google Ads data
- missing campaign metadata
- mixed schema versions

### Analyzer/report mismatch is still possible

Even with good analyzer tests, the PPC pages still perform fallback logic of
their own. So analyzer correctness does not automatically guarantee report
correctness.

## Failure Modes

- analyzer output can remain correct while the report layer still rewrites or
  re-derives parts of it
- check-ID renames will break both tests and page-renderer assumptions together
- real PPC data with sparse fields may behave differently from the fixture set

## Improvement Targets

### High priority

- keep this suite as the reference contract for the PPC analyzer
- add partial / malformed PPC-data fixtures that mirror the real issues being
  seen in current audits
- reduce report-layer fallback logic so this analyzer contract matters more

### Medium priority

- if IDs stay important, document them centrally so analyzer and report stacks
  are not coupled by hidden conventions

## Bottom Line

`test_ppc_analyzer.py` is one of the most important backend files for the PPC
side of the system.

If PPC report data is wrong, this suite helps determine whether the issue is in
the analyzer itself or in the later report-layer normalization and rendering
steps.
