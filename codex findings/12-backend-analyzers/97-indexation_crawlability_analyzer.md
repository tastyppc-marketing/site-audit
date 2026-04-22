# Script Audit: `platform/src/audit_platform/analyzers/indexation_crawlability.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/indexation_crawlability.py](/root/site-audit/platform/src/audit_platform/analyzers/indexation_crawlability.py:1)

## Purpose

`indexation_crawlability.py` analyzes crawl-budget and indexability problems.

It audits URL parameters, pagination, soft 404 patterns, Search Console orphan
pages, and then compresses those signals into a crawl-budget health score.

## Inputs

Primary dependencies:

- `structlog`
- crawl-page dictionaries
- optional sitemap URL list
- optional Search Console page rows
- optional inbound-link maps

## Outputs

The main `analyze(...)` method returns:

- `parameterAudit`
- `paginationAudit`
- `soft404s`
- `indexOrphans`
- `crawlBudgetHealth`

## How It Works

### 1. Audits parameterized URLs

The analyzer classifies query parameters into a taxonomy and raises issues such
as:

- faceted navigation traps
- session IDs in URLs
- tracking parameters without clean canonicals
- parameter explosion on the same base path

### 2. Audits pagination

It checks for:

- noindexed paginated pages
- broken `rel=next`
- non-self canonicals on paginated pages

### 3. Detects soft 404s

For HTTP 200 pages, it looks for error-page language in titles and H1s and
combines that with near-empty content heuristics.

### 4. Detects Search Console orphan pages

It compares Search Console pages against inbound-link evidence from both:

- the passed inbound-link map
- contextual link targets present in crawl data

### 5. Computes crawl-budget health

The final score weights waste from:

- parameterized URLs
- orphan pages
- redirect chains
- soft 404s
- deep URLs

## Interactions With Other Scripts

This file depends on:

- crawl data
- Search Console style page outputs
- internal-link analysis outputs

It also feeds the final crawl-budget score and several issue groups that later
reporting layers can consume.

## Strengths

- good coverage of several real crawl-budget problem types
- useful Search Console cross-referencing for orphan detection
- schema is fairly readable and report-friendly

## Weaknesses

### `sitemap_urls` is accepted by `analyze(...)` but never used

The main analyzer signature takes `sitemap_urls`, but none of the called
subroutines use it.

That is a contract bug and a practical gap, because sitemap context is
important in crawlability work and the method currently ignores it entirely.

### Soft-404 findings are not shaped like the rest of the issue outputs

`detect_soft_404s(...)` returns `pages`, not `issues`.

That matters because downstream synthesis logic expects issue arrays from this
family of analyzers. The result is a contract mismatch that can quietly drop
soft-404 findings from later prioritization layers.

### Index-orphan output is also structurally separate

`detect_index_orphans(...)` returns `orphans`, not `issues`.

That may be fine for display, but it makes cross-analyzer aggregation harder and
continues the pattern of inconsistent output shapes inside one analyzer module.

### Soft-404 detection is vulnerable to false positives

Any HTTP 200 page with fewer than 50 words gets a soft-404 reason, even if it is
a valid short page.

That is a pragmatic heuristic, but it can overflag thin yet legitimate content.

### Crawl-budget "deep pages" are based on URL path depth, not actual click depth

The score uses path segment count greater than three as a deep-page proxy.

That is easy to compute, but it is not the same as true crawl depth or link
depth from the homepage.

## Failure Modes

- sitemap-derived context never affects the analysis even when supplied
- downstream reporting can omit soft-404 or orphan findings because the output
  contract is inconsistent
- short valid pages can be mislabeled as soft 404s
- crawl-budget score can over-interpret URL shape as crawl depth

## Improvement Targets

### High priority

- wire `sitemap_urls` into real analysis or remove it from the public signature
- normalize all issue-bearing sub-results to a common shape with explicit
  `issues`
- separate "thin short page" from true soft-404 evidence

### Medium priority

- incorporate actual internal-link depth if available into crawl-budget scoring
- expand parameter taxonomy matching beyond exact parameter-name equality

## Bottom Line

`indexation_crawlability.py` covers several valuable signals, but it is carrying
some contract drift right in the main API surface.

The biggest problem is not the heuristics themselves. It is that some of the
most important outputs are shaped differently enough that later layers can miss
them.
