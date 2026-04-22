# Script Audit: `platform/tests/test_competitor.py`

Last updated: 2026-04-18

File: [platform/tests/test_competitor.py](/root/site-audit/platform/tests/test_competitor.py:1)

## Purpose

`test_competitor.py` validates `CompetitorAnalyzer`, which appears to own a
large chunk of competitive-research logic for SEO reporting.

The suite covers:

- competitor discovery
- keyword overlap analysis
- SERP feature ownership
- tech-stack detection
- strategy report generation
- full analyze pipeline
- domain normalization

## Inputs

Test dependencies:

- `pytest`
- `MagicMock`
- `patch`
- `CompetitorAnalyzer`
- `DomainMetrics`

Primary synthetic dependency:

- `mock_connector()`

That mock connector provides:

- organic competitors
- backlink competitors
- organic keyword lists
- SERP results

## Outputs

No runtime artifacts. The file asserts analyzer behavior.

## How It Works

### 1. Builds a multi-surface competitor mock

The test fixture simulates discovery from both:

- organic competitors
- backlink competitors

and intentionally includes self-domain data so filtering can be verified.

### 2. Tests competitor discovery and scoring

The suite checks that discovery:

- merges sources
- includes manual competitors
- deduplicates domains
- filters self
- survives connector failure

### 3. Tests keyword overlap math

It verifies:

- overlap matrix creation
- Jaccard similarity
- keyword-gap extraction
- client-only keywords
- summary counts

### 4. Tests SERP and tech-stack analysis

The file covers:

- per-domain SERP feature ownership
- keyword cap behavior for SERP analysis
- tech-stack fingerprint detection from headers and HTML

### 5. Tests strategic synthesis and end-to-end flow

It validates that `generate_strategy_report()` and `analyze()` return the
expected high-level structures.

## Strengths

- broad coverage across a multi-purpose analyzer
- good use of synthetic data to prove merging and deduplication logic
- overlap and normalization checks are concrete and useful
- full-pipeline test gives confidence that the analyzer can coordinate its
  substeps

## Weaknesses

### Heavily mock-shaped

The entire suite depends on one tightly controlled connector fixture. That makes
the tests fast and readable, but it also means they are very dependent on the
assumed API shapes in the mocks.

### Tech-stack test uses special mocking path

The tech-stack tests patch `httpx.Client` directly with a context-manager setup
instead of reusing the shared HTTP fixture. That is practical, but it creates
another testing idiom inside the same suite.

### Full analyzer is still tested mostly through happy-path toy data

The suite proves the logic, but not necessarily its behavior against noisy or
ambiguous real competitor data.

## Failure Modes

- API response-shape drift in the connector can invalidate assumptions while the
  analyzer logic still looks correct in tests
- ranking and scoring behavior may overfit the toy fixture
- tech-stack detection can appear more reliable in tests than it is on real,
  modern sites with edge/CDN/script-heavy responses

## Improvement Targets

### High priority

- keep the broad workflow coverage
- add messier connector fixtures:
  - empty domains
  - duplicate URLs
  - partial keyword payloads
  - conflicting SERP domains
- unify HTTP mocking style with the shared fixture strategy

### Medium priority

- add stronger schema assertions for final `analyze()` output
- add more normalization edge cases for domains beyond `www` stripping

## Bottom Line

`test_competitor.py` is a strong functional suite for one of the more complex
research analyzers.

Its main limitation is realism: it proves the intended algorithmic behavior
clearly, but mostly against very controlled synthetic inputs.
