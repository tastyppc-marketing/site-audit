# Script Audit: `platform/src/audit_platform/models/linking.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/models/linking.py](/root/site-audit/platform/src/audit_platform/models/linking.py:1)

## Purpose

`linking.py` defines the internal-link graph result models used by the backend
link-analysis pipeline.

It covers:

- page-level graph nodes
- orphan pages
- hub-and-spoke clusters
- homepage depth results
- site-level graph summaries

## Inputs

Primary dependencies:

- `pydantic`
- `datetime`
- `typing`

Primary runtime producer:

- `InternalLinkingAnalyzer`

## Outputs

This file provides:

- `LinkGraphNode`
- `OrphanPage`
- `HubSpokeCluster`
- `LinkDepthResult`
- `LinkGraphResult`

## How It Works

### 1. Models page-level graph attributes

`LinkGraphNode` stores direct counts plus higher-order metrics like PageRank,
betweenness, HITS scores, and community membership.

### 2. Models special page subsets

Separate models exist for orphan pages and hub/spoke clusters so those result
types are not flattened into generic dicts.

### 3. Wraps everything in a site-level result

`LinkGraphResult` acts as the top-level analysis object for a domain.

## Strengths

- good match between model structure and graph-analysis responsibilities
- page-level and site-level concerns are clearly separated
- more of the result surface is typed here than in several other domains

## Weaknesses

### Some fields still fall back to generic dicts

`link_suggestions` is `list[dict[str, Any]]`, which means one of the most
action-oriented outputs in the model is not strongly typed.

### There is a visible workaround in the schema design

`LinkDepthResult.homepage` has a default specifically so
`LinkGraphResult` can use `Field(default_factory=LinkDepthResult)`.

That is not a bug, but it is a sign that the schema is partly shaped around
construction mechanics rather than pure domain meaning.

### Timestamps are again timezone-naive

`LinkGraphResult.analyzed_at` uses `datetime.utcnow`.

## Failure Modes

- suggestion payloads can drift because they are not modeled explicitly
- blank/default homepage values can leak into partially populated results
- timestamp ambiguity persists across integrations

## Improvement Targets

### Medium priority

- introduce a typed model for `link_suggestions`
- standardize timestamp policy across model modules
- decide whether construction convenience defaults are masking required fields

## Bottom Line

`linking.py` is a solid schema module and a good example of where the backend is
already fairly disciplined.

Its main gap is not the core graph structure. The gap is around the more
actionable outputs that still remain loosely typed.
