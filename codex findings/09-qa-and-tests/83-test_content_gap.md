# Script Audit: `platform/tests/test_content_gap.py`

Last updated: 2026-04-18

File: [platform/tests/test_content_gap.py](/root/site-audit/platform/tests/test_content_gap.py:1)

## Purpose

`test_content_gap.py` validates `ContentGapAnalyzer`, which appears to cover:

- content-gap discovery against competitors
- topical-authority clustering
- unlinked-mention identification
- query-intent classification

## Inputs

Test dependencies:

- `pytest`
- `ContentGapAnalyzer`

Primary synthetic fixtures:

- `client_keywords`
- `competitor_keywords`

## Outputs

No runtime artifacts. The file asserts analyzer behavior.

## How It Works

### 1. Tests competitive content-gap analysis

The suite verifies that the analyzer:

- finds gaps from competitor-only keywords
- excludes keywords the client already ranks for
- sorts by priority
- respects minimum-volume filtering
- returns intent-bucket summaries

### 2. Tests topical-authority clustering

It checks that related keywords cluster into topics and produce usable depth
scores.

### 3. Tests unlinked-mention filtering

The analyzer is expected to deduplicate mention domains and exclude sites that
already link to the client.

### 4. Tests intent classification heuristics

The suite directly verifies informational, commercial, and transactional intent
classification for example queries.

## Strengths

- focused and readable
- directly tests the business semantics of content-gap analysis
- useful intent-classification checks make implicit heuristics explicit

## Weaknesses

### Small synthetic keyword universe

The fixtures are intentionally small, which keeps the tests clear but limits
confidence about behavior on larger keyword sets.

### Clustering realism is limited

Topical-authority tests prove clustering exists, but not necessarily that the
clusters are useful on messy real keyword corpora.

## Failure Modes

- gap prioritization may behave differently on large or noisy keyword exports
- intent heuristics can misclassify borderline queries while these tests still
  pass
- topical clustering could overgroup on shared tokens in real data

## Improvement Targets

### High priority

- add larger and noisier keyword fixtures
- add more ambiguous intent examples
- add regression fixtures from real content-gap audits once known problem cases
  are identified

## Bottom Line

`test_content_gap.py` is a concise but useful suite.

It gives confidence in the analyzer’s basic content-gap semantics, though not
yet in how well those heuristics scale to real keyword datasets.
