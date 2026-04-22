# Script Audit: `platform/src/audit_platform/analyzers/content_gap.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/content_gap.py](/root/site-audit/platform/src/audit_platform/analyzers/content_gap.py:1)

## Purpose

`content_gap.py` handles three related jobs:

- finding competitor keywords the client does not rank for
- clustering ranked keywords into topic buckets for topical-authority scoring
- turning brand mentions without links into backlink opportunities

Unlike many of the other backend analyzers, this file is more of a utility
bundle than a single end-to-end pipeline. It does not expose one master
`analyze(...)` method.

## Inputs

Primary dependencies:

- `structlog`
- optional `DataForSEOConnector` in the constructor

Primary runtime inputs:

- client keyword lists
- competitor keyword lists keyed by competitor domain
- optional crawled pages
- brand-mention records
- existing backlink domains

## Outputs

Main public outputs:

- `analyze_content_gaps(...)` returns `summary`, `gaps`, and intent buckets
- `analyze_topical_authority(...)` returns topic-cluster scoring and URL-topic
  mapping
- `find_unlinked_mentions(...)` returns backlink-outreach opportunities

The file says it feeds `contentGap` and `topicalAuthority` sections in the main
audit payload.

## How It Works

### 1. Finds keyword gaps

The analyzer builds a set of client keywords, walks competitor keyword lists,
filters out already-covered terms and low-volume terms, then assigns each
surviving keyword a priority score based on:

- volume
- difficulty
- competitor ranking position

It also classifies keywords into informational, commercial, or transactional
intent buckets.

### 2. Builds topical-authority clusters

For the client's ranked keywords, it extracts topic tokens, counts repeated
tokens, and converts those into simple topic clusters scored by:

- keyword count
- average ranking position
- aggregate search volume

If page URLs are supplied, it also tries to map URLs to topic clusters using URL
path tokens.

### 3. Surfaces unlinked mention opportunities

The analyzer cross-references brand-mention sources against existing backlink
domains and returns deduplicated domains that mention the brand without linking.

## Interactions With Other Scripts

This file sits between:

- organic keyword / competitor data collection
- backlink and brand-mention workflows
- content and authority sections of the report

It also conceptually overlaps with:

- competitor analysis
- backlink opportunity analysis
- content-planning outputs

## Strengths

- practical keyword-gap prioritization instead of raw list dumping
- combines content planning and authority mapping in one backend module
- includes a useful unlinked-mention flow for link building

## Weaknesses

### The optional connector is not actually used

The constructor accepts a `DataForSEOConnector`, but none of the public methods
in this file use it.

That suggests either:

- the file was designed to own more of the data-fetching layer and never got
  there
- the constructor contract is drifting from the real implementation

### Gap deduplication hides multi-competitor evidence

`analyze_content_gaps(...)` uses `seen_keywords` and keeps only the first
competitor that surfaced each keyword.

That means if three competitors rank for the same missing keyword, the output
records only one competitor source. The keyword survives, but the strength of
the competitive signal is understated.

### Topical authority is token-frequency clustering, not real topic modeling

`analyze_topical_authority(...)` uses repeated single tokens as topics.

That is fast and explainable, but it is not a semantic topic model. Generic
tokens can become "topics," and nuanced multi-word concepts are flattened.

### Intent classification is highly heuristic

`_classify_intent(...)` is useful as a first-pass bucketizer, but it relies on a
small phrase list and defaults many ambiguous keywords to informational intent.

### Unlinked mention deduplication loses context

`find_unlinked_mentions(...)` deduplicates by domain only, so multiple valuable
mention contexts from the same domain are collapsed into one opportunity.

## Failure Modes

- content gaps can look smaller or weaker than they really are because
  multi-competitor support is dropped
- topical authority can overfit to noisy tokens
- intent buckets can misclassify mixed-intent keywords
- downstream consumers must orchestrate multiple methods manually because there
  is no single analyzer entrypoint

## Improvement Targets

### High priority

- decide whether this file should remain a utility bundle or gain a single
  package-level `analyze(...)` entrypoint
- preserve multi-competitor evidence for the same keyword gap
- either use the injected connector or remove it from the constructor contract

### Medium priority

- strengthen topical clustering beyond single-token frequency
- keep multiple mention examples per domain where they add outreach value

## Bottom Line

`content_gap.py` is useful, but lighter-weight than some of the other backend
analyzers.

It produces actionable outputs, yet its internal models are intentionally simple
and some of its strongest signals get compressed too early.
