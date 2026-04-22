# Script Audit: `platform/tests/test_indexation_crawlability.py`

Last updated: 2026-04-18

File: [platform/tests/test_indexation_crawlability.py](/root/site-audit/platform/tests/test_indexation_crawlability.py:1)

## Purpose

`test_indexation_crawlability.py` validates `IndexCrawlabilityAnalyzer`, which
appears to own the P8 crawl-health and indexability analysis layer.

It covers:

- URL parameter auditing
- pagination auditing
- soft-404 detection
- index-orphan detection
- crawl-budget health scoring
- full analyzer output
- Search Console URL normalization

## Inputs

Test dependencies:

- `pytest`
- `IndexCrawlabilityAnalyzer`

Primary synthetic fixture:

- `sample_pages`

That fixture intentionally mixes:

- normal pages
- parameterized URLs
- pagination
- tracking params
- session IDs
- soft-404-like pages
- deep paths
- noindex pagination

## Outputs

No runtime artifacts. The file asserts analyzer behavior.

## How It Works

### 1. Tests parameter classification and parameter audit logic

The suite verifies classification of parameters such as:

- tracking
- filter
- sort
- pagination
- session
- search

It also tests higher-level issues like faceted navigation and parameter
explosion.

### 2. Tests pagination and soft-404 logic

It checks:

- paginated-page detection
- noindex pagination
- broken next links
- title/H1/near-empty soft-404 heuristics

### 3. Tests index-orphan detection

The suite combines crawl pages, Search Console-style page data, and inbound-link
signals to identify indexed orphan pages and prioritize them.

### 4. Tests crawl-budget scoring and full analyze flow

It validates both the crawl-budget health formula and the top-level analyzer
output structure.

## Strengths

- broad coverage for a complex crawl-health analyzer
- fixtures are practical and intentionally messy
- URL-normalization tests are especially valuable here
- crawl-budget health gets both perfect-score and terrible-score coverage

## Weaknesses

### Another large heuristic suite

This analyzer combines several audit families, so the test file ends up
verifying a lot of heuristic rules in one place.

### Search Console and crawl data are still synthetic

The suite proves logic well, but not necessarily against the noisier URLs and
canonicalization quirks seen in production exports.

## Failure Modes

- normalization rules can fail on more complex tracking / canonical patterns
- soft-404 heuristics may overflag or underflag on real thin/templated pages
- crawl-budget health can look numerically stable while still being based on
  simplistic weights

## Improvement Targets

### High priority

- add real-world URL normalization fixtures from observed audit issues
- keep the current threshold cases, since they act as useful guardrails
- add more contradictory crawl-vs-Search Console scenarios

## Bottom Line

`test_indexation_crawlability.py` is a strong suite for one of the messier
technical-analysis domains.

It provides good heuristic coverage, especially around parameters and soft 404s,
but it would benefit from more production-like URL and crawl-data fixtures.
