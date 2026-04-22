# Script Audit: `platform/tests/test_local_seo.py`

Last updated: 2026-04-18

File: [platform/tests/test_local_seo.py](/root/site-audit/platform/tests/test_local_seo.py:1)

## Purpose

`test_local_seo.py` validates `LocalSeoAnalyzer`, which appears to combine:

- review sentiment analysis
- competitor GBP comparison
- local landing-page scoring
- service-area map generation
- local rank-grid point generation
- full local SEO analysis output

## Inputs

Test dependencies:

- `pytest`
- `LocalSeoAnalyzer`

Primary synthetic fixtures:

- `sample_reviews`
- `sample_profile`
- `sample_crawl_pages`

## Outputs

No runtime artifacts. The file asserts analyzer behavior.

## How It Works

### 1. Tests review-sentiment analysis

The suite checks:

- positive / negative mix
- mean compound sentiment
- reply rate
- total review counting
- keyword extraction
- short/empty review handling

### 2. Tests GBP comparison

It verifies that the client business profile and competitor profiles are merged
into a comparison-friendly structure.

### 3. Tests landing-page scoring

The suite ensures local landing pages are scored from crawl data plus location
keywords and that expected checks are returned.

### 4. Tests mapping and local-grid helpers

It validates:

- service-area GeoJSON generation
- competitor point inclusion
- empty-coordinate behavior
- local grid-point generation at multiple sizes and spacings

### 5. Tests full analyze flow

The top-level analyzer output is checked for the major local SEO sections.

## Strengths

- covers several different local-SEO surfaces in one place
- useful mix of sentiment, profile, page, and map/grid behavior
- fixtures are practical and easy to understand

## Weaknesses

### Several different concerns in one suite

This file is really testing a small local SEO toolkit, not just one simple
algorithm.

### Heuristic sentiment tests are light

The suite proves basic sentiment behavior, but not necessarily the quality of
the sentiment model on messy or domain-specific review text.

### Geo and landing-page logic remain synthetic

The map and landing-page tests are useful, but still far simpler than real local
SEO deployments.

## Failure Modes

- review sentiment can behave differently on real sparse or ironic review text
- landing-page scoring may not generalize cleanly across industries
- mapping/grid logic can still have geospatial edge cases not covered here

## Improvement Targets

### High priority

- add more real-world local-business review examples
- add more varied landing-page fixtures across multiple location patterns
- keep the GeoJSON and grid tests because they provide good deterministic
  coverage

## Bottom Line

`test_local_seo.py` is a useful multi-surface suite for the local SEO analyzer.

It shows the analyzer is expected to do much more than just score local pages,
which matters when tracing how local SEO data should flow into the final report.
