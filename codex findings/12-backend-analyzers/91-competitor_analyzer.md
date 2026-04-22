# Script Audit: `platform/src/audit_platform/analyzers/competitor.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/competitor.py](/root/site-audit/platform/src/audit_platform/analyzers/competitor.py:1)

## Purpose

`competitor.py` is the backend competitor-intelligence analyzer.

It discovers competitors, measures keyword overlap, inspects SERP feature
ownership, detects tech-stack signals, and turns those results into strategic
recommendations.

This file is the backend equivalent of a competitive-research layer that
combines search visibility data with lightweight market interpretation.

## Inputs

Primary dependencies:

- `DataForSEOConnector`
- `structlog`
- direct `httpx` usage inside tech detection

Primary public entrypoints:

- `discover_competitors(...)`
- `analyze_keyword_overlap(...)`
- `analyze_serp_features(...)`
- `detect_tech_stack(...)`
- `generate_strategy_report(...)`
- `analyze(...)`

Key runtime inputs include:

- client target domain
- optional manual competitor domains
- keyword list for SERP feature analysis
- flags controlling tech-stack and SERP-feature analysis

## Outputs

The main `analyze(...)` method returns:

- `discoveredCompetitors`
- `keywordOverlap`
- `serpFeatures`
- `techStack`
- `strategy`

Those outputs appear intended for the `competitorAnalysis` section of the audit
data consumed by the report stack.

## How It Works

### 1. Discovers competitors from multiple sources

`discover_competitors(...)` merges three sources:

- organic competitors from DataForSEO
- backlink competitors from DataForSEO
- manual competitor inputs

It deduplicates by normalized domain and assigns a weighted score based on
organic overlap, backlink overlap, and manual inclusion.

### 2. Builds keyword overlap and gap analysis

`analyze_keyword_overlap(...)` fetches ranking keyword sets for the client and
competitors, computes a Jaccard-style overlap matrix, and identifies:

- competitor-only gap keywords
- client-only keywords
- shared keyword counts

### 3. Tracks SERP feature ownership

`analyze_serp_features(...)` fetches live SERP data for up to 25 keywords and
records which analyzed domain owns which non-organic feature types.

It then collapses that into a per-domain feature summary.

### 4. Detects tech-stack signals

`detect_tech_stack(...)` performs lightweight HTTP and HTML pattern matching to
infer:

- web server
- framework or CMS
- analytics tools
- structured-data presence
- CDN presence
- IDX / real-estate platform signals

### 5. Generates strategic recommendations

`generate_strategy_report(...)` interprets the overlap and SERP-feature data
into prioritized suggestions such as:

- target competitor gap keywords
- improve positioning if overlap is weak
- pursue SERP-feature capture
- attack competitor featured-snippet ownership

## Interactions With Other Scripts

This analyzer interacts with:

- `platform/src/audit_platform/connectors/dataforseo.py`
- report pages that display competitors and strategy
- test coverage in `platform/tests/test_competitor.py`
- later synthesis in `reporting_intelligence.py`

It also crosses a boundary that other analyzers do not: it performs direct web
requests itself for technology detection instead of staying fully inside the
connector layer.

## Strengths

- covers multiple dimensions of competitive research in one place
- merges discovery, overlap analysis, SERP visibility, and strategy generation
- uses normalized domains consistently in the main comparison logic
- caps SERP feature keyword checks to control API cost and latency

## Weaknesses

### Tech detection bypasses the connector layer

`_detect_from_headers(...)` imports and uses `httpx` directly instead of going
through a shared connector or HTTP utility.

That creates architectural drift:

- HTTP behavior is now split across connectors and analyzers
- retries, headers, TLS policy, and observability are inconsistent
- tech detection becomes harder to stub or standardize

### TLS verification is explicitly disabled

The direct `httpx.Client(...)` call uses `verify=False`.

That may make brittle sites easier to crawl, but it weakens trust in the
response path and normalizes insecure transport handling inside the analyzer
layer.

### Competitor scoring compresses signal aggressively

Both organic overlap and backlink overlap are capped at `100` before scoring.

That means domains with very large competitive overlap can collapse into the
same score band as domains barely above the threshold. The ranking is easy to
calculate, but it throws away magnitude quickly.

### Manual-competitor outputs are structurally thinner

If the caller supplies manual competitors, `analyze(...)` sets
`discoveredCompetitors` to `{"domain": d, "manual": True}` stubs rather than
the richer scored records returned by `discover_competitors(...)`.

That makes downstream handling less uniform.

### SERP feature analysis is only partially contextualized

`analyze_serp_features(...)` calls `get_serp(keyword)` without passing location
or device parameters.

That may be acceptable for a default path, but it means a high-sensitivity
competitive feature analysis is using connector defaults rather than explicit
audit context.

### The `DomainMetrics` import is unused

This is minor, but it is a sign the file has drifted over time and could use a
cleanup pass.

## Failure Modes

- competitor discovery can degrade to partial lists if one source fails
- tech detection can silently under-detect when headers or HTML patterns change
- manual competitors can bypass richer discovery metadata
- SERP feature ownership can vary significantly by device and geography, but
  those dimensions are not explicit here

## Improvement Targets

### High priority

- move tech detection HTTP access behind a shared connector or utility
- stop using `verify=False` unless there is a narrowly documented exception path
- make manual competitor records match the same schema as discovered competitors
- thread explicit location and device context into SERP feature analysis

### Medium priority

- revisit competitor scoring so overlap magnitude is not flattened so early
- expand strategy generation beyond a few heuristic checks
- either remove unused imports or complete the data model the file was designed
  for

## Bottom Line

`competitor.py` is a genuinely useful backend analysis module with a broad view
of competitive SEO context.

Its main weakness is architectural discipline. The competitive logic is solid
enough for a first pass, but tech detection and some scoring choices show clear
signs of "pragmatic implementation now, cleanup later."
