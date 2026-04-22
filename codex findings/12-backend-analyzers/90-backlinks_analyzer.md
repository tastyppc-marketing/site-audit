# Script Audit: `platform/src/audit_platform/analyzers/backlinks.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/backlinks.py](/root/site-audit/platform/src/audit_platform/analyzers/backlinks.py:1)

## Purpose

`backlinks.py` is the backend backlink-analysis implementation.

This file does more than proxy DataForSEO. It pulls backlink data, normalizes
it into report schema, computes anchor-text distribution, detects backlink
quality patterns, surfaces broken-link reclamation opportunities, and generates
competitor-derived link opportunities.

This is one of the more important backend analyzers because it sits at the
boundary between raw backlink APIs and the report-ready structures consumed by
the audit output.

## Inputs

Primary dependencies:

- `DataForSEOConnector`
- `BacklinkRecord`
- `DomainMetrics`
- `structlog`

Primary runtime inputs to `analyze(...)`:

- `target`
- `competitor_domains`
- `backlink_limit`
- `referring_domain_limit`
- `brand_name`
- `target_keywords`
- `known_404_urls`

Primary runtime inputs to `find_link_opportunities(...)`:

- `target`
- `competitor_domains`
- `min_domain_rating`
- `max_results_per_competitor`

## Outputs

`analyze(...)` returns two top-level sections:

- `backlinks`
- `domainMetrics`

Within `backlinks`, the analyzer emits:

- `domainMetrics`
- `topBacklinks`
- `referringDomains`
- `anchorDistribution`
- `qualitySummary`
- `anchorIssues`
- `brokenBacklinkOpportunities`
- `competitorDomainMetrics`

`find_link_opportunities(...)` returns:

- `opportunities`
- `summary`

`analyze_intersection(...)` returns raw backlink-intersection records from the
connector layer.

## How It Works

### 1. Pulls core backlink data for the client

The analyzer fetches:

- domain-level backlink summary
- top backlinks
- referring domains

This gives it both summary-level and row-level data to work from.

### 2. Pulls comparable domain metrics for competitors

For each competitor domain, it requests domain-level metrics and stores them in
parallel structures so the report can compare the client against competitors.

### 3. Infers brand context for anchor analysis

If `brand_name` is missing, it derives one from the first label of the target
domain. That brand hint is then used to classify anchors as branded,
exact-match, partial-match, generic, URL, or empty.

### 4. Computes quality and optimization signals

The analyzer then derives:

- aggregate backlink quality summary
- anchor-text distribution
- anchor over-optimization issues

This is where the file starts behaving like a real analysis layer rather than a
connector wrapper.

### 5. Surfaces broken-link reclamation opportunities

If the caller supplies known 404 URLs, the analyzer cross-checks backlink
targets against those URLs and emits redirect recommendations for reclaiming
link equity.

### 6. Builds competitor link-gap opportunities

`find_link_opportunities(...)` mines competitor backlinks, filters out domains
already linking to the client, removes weak or spammy domains, categorizes the
survivors, and assigns a priority score.

## Key Internal Logic

### Spam filtering is heuristic-based

`_is_spammy_domain(...)` relies on:

- hardcoded domain-pattern checks
- hardcoded toxic TLDs
- low domain-rating thresholds

This is simple and understandable, but it is not data-driven.

### Opportunity categorization is business-specific

`_categorize_opportunity(...)` buckets domains into:

- `local-organization`
- `directory`
- `press-media`
- `resource-page`
- `partnership`
- `general`

That logic is tuned for outreach workflows, especially local-business and
real-estate style audits.

### Opportunity scoring is deterministic

`_score_opportunity(...)` combines:

- domain rating
- dofollow bonus
- category bonus

This makes prioritization easy to reason about and easy to change.

## Interactions With Other Scripts

This file works closely with:

- `platform/src/audit_platform/connectors/dataforseo.py`
- report generators that consume `audit-data.json`
- report pages that render backlink sections and link opportunities
- the reporting-intelligence layer, which later reads backlink metrics for
  overall grading

It also overlaps conceptually with earlier standalone backlink scripts in the
repo, which means this backend analyzer is part of a broader architecture that
has both older script-style flows and newer platform-style flows.

## Strengths

- real analysis logic, not just API passthrough
- clear separation between connector calls and schema formatting
- useful business outputs like link opportunities and broken backlink
  reclamation
- resilient error handling that returns partial data instead of failing hard

## Weaknesses

### Toxic-TLD filtering is called incorrectly in link opportunity analysis

`find_link_opportunities(...)` calculates `dr`, but then calls
`_is_spammy_domain(source_lower)` without passing that DR value.

Because `_is_spammy_domain(...)` defaults `domain_rating` to `0`, every domain
on a toxic TLD is evaluated as if it had low authority. That means the
high-risk-TLD rule is stricter than intended and can reject domains that should
survive the filter.

This is a real implementation bug, not just a style issue.

### Anchor classification overstates partial-match anchors

In `_compute_anchor_distribution(...)`, any anchor that is not empty, URL,
generic, branded, or exact-match falls through to `partial-match`.

That means many anchors that are simply "other" or semantically unrelated will
still be counted as partial-match. The output looks richer than the underlying
signal really is.

### Zero branded anchors do not trigger the low-brand warning

`_check_anchor_optimization(...)` only flags low branded-anchor ratio when
`branded_pct < 30 and branded_pct > 0`.

If branded anchors are exactly `0%`, the warning does not fire. That suppresses
one of the clearest "unnatural profile" cases.

### Intersection output is raw, not normalized

`analyze_intersection(...)` returns connector output directly.

That breaks the otherwise consistent pattern in this file, where external data
is transformed into stable audit schema before being exposed downstream.

### Domain metrics are duplicated across sections

The client metric block is emitted both inside `backlinks.domainMetrics` and in
the top-level `domainMetrics.client` structure.

That may be deliberate for report compatibility, but it is a duplication point
that can create drift if the schema changes.

## Failure Modes

- connector failures degrade outputs to partial or empty structures
- heuristics can over-filter valid opportunities
- anchor analysis can mislead if brand names or target keywords are weak inputs
- report consumers remain tightly coupled to this exact JSON shape

## Improvement Targets

### High priority

- fix the `_is_spammy_domain(...)` call so the actual domain rating is passed
  through
- separate `other` anchors from `partial-match` anchors
- flag `0%` branded anchors as an optimization issue
- normalize backlink-intersection output before exposing it downstream

### Medium priority

- move spam heuristics and opportunity scoring into configurable policy tables
- reduce duplicated metric structures if the report stack can tolerate a schema
  cleanup

## Bottom Line

`backlinks.py` is a substantive backend analysis module and one of the better
examples of the platform layer doing real interpretation work.

It is already useful and structurally important, but it also contains a few
high-impact heuristic bugs and contract inconsistencies that can distort the
data the report stack sees.
