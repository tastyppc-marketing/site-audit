# Script Audit: `platform/tests/test_internal_linking.py`

Last updated: 2026-04-18

File: [platform/tests/test_internal_linking.py](/root/site-audit/platform/tests/test_internal_linking.py:1)

## Purpose

`test_internal_linking.py` validates `InternalLinkAnalyzer`, especially its
graph-building and graph-analysis behavior.

The suite covers:

- graph construction
- orphan detection
- BFS link depth
- hub / spoke detection
- PageRank
- full analyzer orchestration
- circular-link handling
- model serialization
- extended metrics such as betweenness and community detection

## Inputs

Test dependencies:

- `pytest`
- `InternalLinkAnalyzer`
- `LinkGraphResult`

Primary data shape:

- small synthetic directed graphs represented as URL adjacency maps

## Outputs

No runtime artifacts. The file asserts graph-analysis behavior.

## How It Works

### 1. Tests low-level graph construction

The suite verifies forward and reverse adjacency from a small link map.

### 2. Tests graph analytics directly

It covers:

- orphan detection against sitemap URLs
- BFS-based link depth
- PageRank convergence and score distribution
- hub-and-spoke identification

### 3. Tests orchestrator output

The full `analyze(...)` path is expected to return a populated `LinkGraphResult`
with summary sections and computed metrics.

### 4. Tests advanced graph metrics

Later tests verify:

- betweenness centrality
- community detection

which suggests the analyzer uses richer graph tooling, likely including
NetworkX-based computations.

## Strengths

- strong algorithm-oriented coverage
- good use of tiny deterministic graphs
- tests both basic and advanced link-graph concepts
- circular-link and empty-graph cases are handled explicitly

## Weaknesses

### Mostly toy graph fixtures

The tests are mathematically clear, but the graphs are tiny. They do not tell us
much about performance or stability on real site-scale link graphs.

### Threshold assumptions are implicit

Rules like "10+ outbound links" for hubs are encoded through tests, but not
necessarily documented elsewhere as a public contract.

## Failure Modes

- analyzer behavior on large, sparse, or noisy graphs may differ from these
  tiny fixtures
- URL-normalization edge cases beyond the homepage slash convention are lightly
  exercised
- advanced metrics may become expensive or unstable at scale without tests
  catching it

## Improvement Targets

### High priority

- add medium-size graph fixtures that resemble real crawls more closely
- keep the small deterministic graph tests because they are excellent for core
  algorithm regression safety
- document important graph thresholds centrally if downstream logic depends on
  them

## Bottom Line

`test_internal_linking.py` is a strong algorithmic suite.

It gives good confidence in the internal-link graph math, but it is more of a
correctness suite than a real-world scale / data-noise suite.
