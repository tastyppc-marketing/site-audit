# Script Audit: `platform/tests/test_backlinks.py`

Last updated: 2026-04-18

File: [platform/tests/test_backlinks.py](/root/site-audit/platform/tests/test_backlinks.py:1)

## Purpose

`test_backlinks.py` validates `BacklinkAnalyzer`, one of the most relevant
backend analyzers for the current audit because backlink data is a major input
to multiple downstream report sections.

The suite covers:

- top-level backlink analysis output
- client and competitor domain metrics
- top backlinks
- referring domains
- anchor distribution
- quality summary
- backlink intersection
- error handling
- link-opportunity discovery

## Inputs

Test dependencies:

- `pytest`
- `MagicMock`
- `BacklinkAnalyzer`
- `BacklinkRecord`
- `DomainMetrics`

Primary synthetic dependency:

- `mock_connector`

That fixture simulates DataForSEO-like responses for:

- backlink summary
- backlink rows
- referring domains
- backlink intersection

## Outputs

No runtime artifacts. The file asserts analyzer behavior.

## How It Works

### 1. Tests standard backlink analysis output

The suite verifies that `analyze(...)` returns the expected nested sections and
maps connector model objects into report-friendly dicts.

### 2. Tests quality and anchor interpretation

It checks:

- dofollow vs nofollow counts
- high / medium / low-quality counts
- average domain rating
- branded / generic / URL / empty anchor distribution

### 3. Tests competitor and intersection behavior

The file verifies:

- competitor-domain metrics
- top-level `domainMetrics` structure
- backlink intersection handling

### 4. Tests link-opportunity discovery

The analyzer is expected to:

- compare client backlinks vs competitor backlinks
- filter existing links
- filter spam / low-DR opportunities
- categorize opportunities
- assign priority scores
- summarize results

## Strengths

- highly relevant to the actual backlink-reporting pipeline
- good connector-mocking coverage for both happy path and failure path
- link-opportunity tests are business-relevant and practical
- quality-summary assertions are explicit and readable

## Weaknesses

### Connector-shape dependence is high

The suite is strongly tied to the assumed DataForSEO-style response and model
shape. That is natural, but it means connector/schema drift could become a major
risk.

### Real backlink weirdness is underrepresented

The test data is clean compared with real backlink exports, which often include:

- malformed URLs
- repeated domains
- strange anchors
- partial dates
- noisy low-quality clusters

### Backend correctness does not guarantee report correctness

This suite can pass while report pages still misrepresent backlink data, because
the report layer performs its own grouping and fallback logic.

## Failure Modes

- connector response drift can silently invalidate analyzer assumptions
- opportunity scoring may behave differently on real backlink corpora
- report-side grouping and spam logic can diverge from analyzer output even when
  this suite stays green

## Improvement Targets

### High priority

- keep expanding this suite with real problematic backlink samples
- add fixtures covering malformed anchors and duplicate domain patterns
- use this analyzer suite as the reference contract when debugging backlink
  report errors

## Bottom Line

`test_backlinks.py` is one of the most important backend suites for the current
audit effort.

If backlink data is wrong in the reports, this test file is central to deciding
whether the problem starts in the analyzer or later in report-layer
transformation.
