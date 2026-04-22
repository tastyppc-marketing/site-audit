# Script Audit: `template/scripts/crawl-sitemap.js`

Last updated: 2026-04-17

File: [template/scripts/crawl-sitemap.js](/root/site-audit/template/scripts/crawl-sitemap.js:1)

## Purpose

`crawl-sitemap.js` is the primary crawl and structure collection script for the
SEO side of the system.

It:

- discovers the sitemap
- expands sitemap indexes
- filters out likely IDX/filter noise
- optionally analyzes content pages in depth with Playwright
- writes `crawl-data.json`
- writes `link-graph.json`

This script is foundational. Several later analyzers and normalizers depend on
its output shape.

## Inputs

### CLI inputs

- positional `domain`
- `--analyze`
- `--headed`
- `--max N`

### Runtime dependencies

- Playwright Chromium
- reachable `robots.txt`
- reachable sitemap endpoints

## Outputs

When `--analyze` is used, it writes:

- `seo/research/crawl-data.json`
- `seo/research/link-graph.json`

Without `--analyze`, it mostly prints discovery information to stdout and does
not produce the full structured research artifacts.

## How It Works

### 1. Sitemap discovery

It checks:

- `/sitemap.xml`
- `/sitemap_index.xml`
- `/sitemap`

If it finds a sitemap index, it recursively visits child sitemaps and collects
all `<loc>` URLs.

### 2. Content-vs-IDX filtering

It applies a hardcoded set of regexes in `idxPatterns` to exclude real-estate
style filter pages, listing pages, and deep faceted paths from detailed page
analysis.

This is a domain-specific heuristic layer, not a generic crawler.

### 3. Page analysis

For each analyzed page it collects:

- URL
- title and title length
- description and description length
- H1, H2, H3 counts
- word count
- image counts and missing alt counts
- total internal links
- contextual internal links
- external link count
- canonical values
- robots directives
- viewport meta
- schema presence, types, and raw JSON-LD
- OG/Twitter metadata
- response headers
- redirect chain
- HTTP canonical from `Link` header
- derived issue flags

This is much richer than a simple sitemap crawler. It is effectively a page
audit harvester.

### 4. Link graph generation

It writes `link-graph.json` using only contextual internal links, not nav or
footer links.

That is an important design choice because it affects orphan and hub analysis
later.

## What Other Scripts Depend On

Direct or indirect downstream consumers:

- `build_audit.py` content, technical, internal linking, indexation, and E-E-A-T
  steps
- `generate-multipage-report.js` for:
  - `technicalSeo.pageAudits`
  - `contentQuality` fallback
  - internal linking fallback data
- Python `TechnicalSeoAnalyzer`
- Python `InternalLinkAnalyzer`
- Python `ContentQualityAnalyzer` as a page source

This is one of the highest-dependency scripts in the repo.

## Strengths

- Collects unusually rich page-level data for a single script
- Produces both page audit data and graph data
- Includes response headers and redirect-chain data needed for stronger
  technical SEO checks
- Excludes known IDX noise instead of blindly auditing everything in the
  sitemap

## Weaknesses

### Hardcoded real-estate assumptions

The IDX exclusion logic is highly specific. That is useful for some clients but
risky if this repo is expected to support broader verticals.

### Event listener accumulation risk

`analyzePage()` attaches a `response` listener to each page object. Because each
batch creates a fresh page and closes it, this is mostly contained, but the
pattern is still fragile and should be watched.

### Word count quality

`document.body.textContent` is used directly. That is a blunt content measure
and may overcount boilerplate.

### Output shape is doing double duty

`crawl-data.json` is simultaneously:

- crawl inventory
- technical audit source
- content quality source
- indexation source

That makes any shape change here dangerous.

### Console-driven workflow bias

A lot of useful context is printed but not persisted in machine-readable form
unless `--analyze` is used.

## Failure Modes

- no sitemap found
- page-level Playwright failures producing `CRAWL_ERROR`
- partial crawl silently continuing with sparse data
- false positives/negatives in IDX page filtering
- contextual link extraction missing meaningful links in atypical layouts

## Improvement Targets

### High priority

- Version the output contract for `crawl-data.json` and `link-graph.json`
- Separate crawl inventory fields from technical-audit-only fields
- Make vertical-specific filters configurable instead of hardcoded

### Medium priority

- Record crawl warnings in JSON, not just stdout
- Persist robots.txt and sitemap metadata in structured form
- Distinguish main-document response headers from subresource responses more
  explicitly

### Low priority

- Add optional extraction of breadcrumb trails, main content containers, and
  template fingerprints

## Bottom Line

`crawl-sitemap.js` is one of the most important scripts in the system. It is not
just a crawler; it is the base research harvester that feeds multiple analysis
layers. Because so much depends on it, any data quality issue here propagates
widely across the rest of the pipeline.
