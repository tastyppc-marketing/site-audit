# Script Audit: `platform/src/audit_platform/connectors/dataforseo.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/dataforseo.py](/root/site-audit/platform/src/audit_platform/connectors/dataforseo.py:1)

## Purpose

`dataforseo.py` is the main external SEO-data connector in the backend.

It wraps DataForSEO endpoints for:

- live SERPs
- keyword volume and suggestions
- backlink summaries and rows
- referring domains
- backlink competitors and intersections
- organic keywords and organic competitors
- keyword-overlap data

This is one of the highest-risk files in the whole repo when the user is seeing
bad pulled data, because many analyzers depend on its normalized output.

## Inputs

Primary dependencies:

- `BaseConnector`
- `Settings`
- `BacklinkRecord`
- `DomainMetrics`
- `KeywordRecord`

Primary runtime inputs:

- keywords
- domains / targets
- location codes
- language codes
- device types
- endpoint-specific limits and filters

## Outputs

This file returns a mixture of:

- typed models like `BacklinkRecord`, `DomainMetrics`, and `KeywordRecord`
- normalized dicts
- raw-ish dict payloads for some endpoints

That mixed output style is itself important context.

## How It Works

### 1. Posts DataForSEO task arrays

The connector uses DataForSEO's task-array POST pattern and unwraps the standard
top-level and per-task envelopes with `_unwrap(...)`.

### 2. Normalizes core SEO data

It reshapes endpoint-specific responses into backend-friendly records for:

- SERPs
- keywords
- backlinks
- domains
- overlap data

### 3. Exposes both direct and convenience methods

Some methods are endpoint wrappers, while `get_domain_metrics(...)` is a
convenience layer over backlink summary data.

## Strengths

- broad DataForSEO surface coverage in one connector
- `_unwrap(...)` centralizes response-envelope validation
- downstream analyzers get simpler, normalized records instead of raw API blobs

## Weaknesses

### The connector bypasses `BaseConnector` request helpers

`_post(...)` uses `self.sync_client.post(...)` directly instead of the base sync
request helper.

That means retry and transport consistency are weaker than the base-class design
suggests.

### `organic_traffic` is mapped from paid traffic in backlink summary

`get_backlinks_summary(...)` sets:

- `organic_traffic = data.get("estimated_paid_traffic")`

That is a serious semantic mismatch. It can feed the backend a paid-traffic
value under an organic-traffic field.

### Competitor metric mapping is suspect in two places

`get_competitors(...)` maps `domain_rating` from `avg_position`.

`get_organic_competitors(...)` maps `intersections` from `avg_position` with a
comment calling it keyword overlap count.

Those are high-risk normalization issues because they can make downstream
competitive analysis look internally consistent while being numerically wrong.

### Referring-domain dofollow logic is oversimplified

`get_referring_domains(...)` maps:

- `dofollow = backlinks_nofollow == 0`

That collapses a domain-level follow/nofollow mix into a single boolean and can
misrepresent partial follow value.

### Output style is inconsistent across methods

Some methods return typed models, some return normalized dicts, and
`get_local_pack(...)` returns filtered raw local-pack items.

That inconsistency makes downstream contract assumptions brittle.

## Failure Modes

- traffic metrics can be mislabeled and contaminate later summaries
- competitor overlap and authority signals can be mis-mapped before analyzers
  ever run
- inconsistent output shapes make it easier for downstream code to drift
- sync transport failures are not as resilient as the architecture suggests

## Improvement Targets

### High priority

- fix the `organic_traffic` mapping in backlink summary normalization
- validate the competitor-field mappings against the actual DataForSEO response
  schema
- route sync HTTP calls through a retry-aware base helper

### Medium priority

- standardize return-shape conventions across the connector
- model referring-domain follow data more explicitly instead of reducing it to a
  single boolean

## Bottom Line

`dataforseo.py` is one of the most important files in the repo and one of the
most likely places for upstream data-quality bugs to originate.

The core structure is good, but several field mappings are important enough that
they should be treated as potential root causes for wrong downstream audit data.
