# Script Audit: `platform/tests/test_reporting_intelligence.py`

Last updated: 2026-04-18

File: [platform/tests/test_reporting_intelligence.py](/root/site-audit/platform/tests/test_reporting_intelligence.py:1)

## Purpose

`test_reporting_intelligence.py` validates the
`ReportingIntelligenceAnalyzer`, which appears to be a synthesis / executive
reporting layer that turns analyzer output into:

- category scores
- composite site-health grading
- prioritized findings
- action plans
- benchmark comparisons
- executive summaries
- trend history

This is one of the highest-level analyzer test files in the backend suite.

## Inputs

Test dependencies:

- `pytest`
- `tmp_path`
- `ReportingIntelligenceAnalyzer`

Primary synthetic fixture:

- `full_audit_data()`

That fixture simulates a broad, multi-analyzer audit containing:

- technical SEO
- Core Web Vitals
- content quality
- backlinks
- indexation / crawlability
- local SEO

## Outputs

This file does not produce runtime artifacts. It asserts behavior across:

- private helper methods
- trend-history persistence
- full `analyze(...)` output

## How It Works

### 1. Builds one representative multi-domain audit fixture

`full_audit_data()` acts like a composite audit snapshot and is reused across
most tests.

### 2. Tests category-score extraction

The suite verifies that the analyzer can pull scores from different analyzer
outputs and normalize them into a category score map.

### 3. Tests composite grading logic

It covers:

- perfect scores
- empty scores
- grade boundaries
- floor-penalty behavior
- missing-category renormalization

### 4. Tests prioritization and action-plan generation

The suite validates:

- ROI ordering
- deduplication
- effort / impact labeling
- action-plan bucket creation
- quick-win caps

### 5. Tests downstream synthesis layers

It also covers:

- benchmark comparisons
- executive summary generation
- trend-history loading and saving
- full end-to-end `analyze(...)`

## Strengths

- one of the most comprehensive backend test files in the repo
- covers both helper-level logic and full analyzer output
- exercises persistence behavior with temporary history directories
- validates business semantics, not just object existence

## Weaknesses

### Very white-box oriented

The suite directly tests many private methods:

- `_extract_category_scores`
- `_compute_health_grade`
- `_extract_all_findings`
- `_prioritize_findings`
- `_build_action_plan`
- `_compare_benchmarks`
- `_generate_executive_summary`
- `_load_and_save_trend`

That gives strong local coverage, but it also couples the tests tightly to
implementation shape.

### Heavy reliance on one synthetic fixture

`full_audit_data()` is useful, but it is also a monolithic happy-path fixture.
It does not fully represent the kinds of partial, malformed, or conflicting
payloads that real audit pipelines often generate.

### Focuses more on analyzer semantics than contract stability

The file checks a lot of scoring behavior, but less of the final structured
schema returned to downstream consumers.

## Failure Modes

- benign refactors of private methods can break the test suite even when public
  behavior remains correct
- the analyzer may still fail on odd real-world data combinations that the main
  fixture does not simulate
- summary text generation can remain technically tested while still being weak
  or repetitive from a product perspective

## Improvement Targets

### High priority

- keep the end-to-end `analyze(...)` coverage
- reduce dependence on private method names where possible
- add more realistic partial-data fixtures and contradictory-data fixtures

### Medium priority

- assert more of the returned schema contract, not just broad presence checks
- add explicit regression fixtures for the kinds of data quality issues the user
  is currently seeing

## Bottom Line

`test_reporting_intelligence.py` is one of the strongest tests in the backend
suite.

It shows that the repo does care about synthesis quality at the analyzer layer,
but it also reveals heavy dependence on white-box testing and a relatively small
set of synthetic data shapes.
