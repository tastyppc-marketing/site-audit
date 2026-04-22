# Script Audit: `platform/src/audit_platform/analyzers/internal_linking.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/internal_linking.py](/root/site-audit/platform/src/audit_platform/analyzers/internal_linking.py:1)

## Purpose

`internal_linking.py` is the backend graph-analysis engine for internal links.

It builds a directed graph from crawl edges, computes PageRank and link depth,
finds orphans and hub-and-spoke structures, optionally runs deeper NetworkX
graph metrics, and generates link-addition suggestions.

This is one of the more technically ambitious analyzers in the repo.

## Inputs

Primary dependencies:

- `structlog`
- optional `networkx`
- linking models from `audit_platform.models.linking`

Primary runtime inputs:

- contextual-link edge map
- sitemap URLs
- homepage URL

## Outputs

The main `analyze(...)` method returns a `LinkGraphResult` containing:

- node list
- orphan pages
- hub clusters
- depth results
- PageRank-derived metrics
- optional community and centrality metrics
- link suggestions
- site-level issues and recommendations

## How It Works

### 1. Builds outbound and inbound adjacency maps

`build_graph(...)` normalizes URLs and converts raw edge lists into adjacency
sets.

### 2. Finds orphans from sitemap membership

`find_orphans(...)` compares sitemap URLs against inbound contextual-link data
and flags pages with zero inbound contextual links.

### 3. Computes core graph metrics

The analyzer then derives:

- BFS link depth from the homepage
- PageRank
- hub-and-spoke clusters

### 4. Optionally computes advanced graph metrics

If `networkx` is available, it also calculates:

- betweenness centrality
- HITS hub/authority scores
- Louvain communities
- density
- clustering coefficient

### 5. Suggests new links

Link suggestions are built by matching orphan or weak pages against strong hub
pages using URL token overlap.

## Interactions With Other Scripts

This file feeds:

- internal-link reporting
- crawlability / orphan analysis
- any page or synthesis layer that wants site-structure metrics

It is also one of the clearer places where typed backend models are doing real
work.

## Strengths

- graph-centric design is much stronger than simple count-based link audits
- layered approach from basic metrics to optional advanced metrics
- sane fallback behavior when `networkx` is unavailable
- recommendations are tied to observed graph state, not generic SEO advice

## Weaknesses

### Sitemap-only pages can disappear from the main node universe

`find_orphans(...)` checks all sitemap URLs, but later `analyze(...)` builds
`all_urls` only from the graph adjacency maps.

So a sitemap URL with no inbound edges and no outbound edges can appear in the
orphan list while being absent from:

- `nodes`
- `total_pages`
- depth metrics
- other graph-wide calculations

That is a significant architectural bug because sitemap completeness and graph
completeness are not merged before final metrics are computed.

### Orphan metadata is partially populated

`find_orphans(...)` hardcodes `outbound_links=0` on every orphan record instead
of measuring actual outbound links for that page.

That makes the orphan objects less informative than they could be.

### Link suggestions rely on URL-token overlap only

The suggestion engine is pragmatic, but it uses path-token overlap rather than
content similarity, topical clustering, or anchor context.

That keeps it cheap and deterministic, but it can be shallow.

### Large-graph extended metrics may still be expensive

The file does include approximation paths, but NetworkX-based analysis on large
graphs is still an operational cost and a dependency boundary worth watching.

## Failure Modes

- sitewide graph metrics can be distorted when sitemap-only pages are excluded
- orphan counts and node totals can describe slightly different universes
- suggestions can look plausible while remaining semantically weak

## Improvement Targets

### High priority

- merge sitemap URLs into the final graph universe before computing totals and
  node lists
- preserve real outbound counts on orphan records
- make it explicit in the result when advanced metrics were skipped or
  approximated

### Medium priority

- improve link suggestions with page-topic or content-similarity inputs
- consider separating graph construction from report-focused recommendation logic

## Bottom Line

`internal_linking.py` is one of the more impressive backend analyzers in the
repo.

Its main weakness is not ambition, but consistency of graph scope. Right now,
the sitemap universe and the graph universe can diverge in a way that affects
the headline numbers.
