# Script Audit: `template/scripts/check-technical.js`

Last updated: 2026-04-17

File: [template/scripts/check-technical.js](/root/site-audit/template/scripts/check-technical.js:1)

## Purpose

`check-technical.js` is a one-page technical inspection script. It opens a page
in Playwright and prints several technical SEO-related blocks to stdout:

- schema / structured data
- image alt text coverage
- social metadata
- page technical signals
- hreflang tags
- canonical tag
- heading structure

It is closer to a manual triage tool than a core batch pipeline component.

## Inputs

### CLI inputs

- positional `url`
- `--headed`

### Runtime dependencies

- Playwright Chromium
- reachable target page

## Outputs

This script does not write a JSON research artifact by default.

It prints structured sections to stdout only.

## How It Works

### 1. Opens a single page

It normalizes the input URL to `https://` when needed, launches Chromium, and
waits for:

- `domcontentloaded`
- then 5 additional seconds

That makes it more tolerant of slow client-side rendering than a pure DOM-ready
snapshot.

### 2. Extracts technical blocks

It prints:

- full JSON-LD blocks, parsed where possible
- image alt coverage summary with examples
- Open Graph and Twitter meta tags
- DOM-level counts such as scripts, stylesheets, iframes, viewport, charset,
  language, favicons
- hreflang tags
- canonical tag
- heading counts and samples

### 3. Stops at presentation

Unlike the crawler, it does not convert findings into issue codes or a stable
JSON output contract.

## What Other Scripts Depend On

No checked-in pipeline script directly consumes `check-technical.js`.

Its role is manual:

- page triage
- verifying technical issues
- quickly checking schema and metadata

## Strengths

- focused technical snapshot for a single page
- exposes raw schema blocks rather than only presence/absence
- useful for debugging specific page-level issues quickly

## Weaknesses

### No structured artifact output

Like `browse.js`, this script ends at stdout. That limits reuse in automated
pipelines.

### Overlap with crawler functionality

A meaningful subset of the checks here also exists in `crawl-sitemap.js`.
That duplication increases maintenance overhead.

### Fixed wait strategy

It always waits 5 seconds after load. That is simple but not adaptive.

### No issue model

The script prints data but does not label or score issues the way the crawl
script does.

## Failure Modes

- Playwright missing
- dynamic content not ready after 5 seconds
- malformed JSON-LD printed as raw strings without stronger diagnostics

## Improvement Targets

### High priority

- Add `--json` output mode
- Reduce duplication with `crawl-sitemap.js` by sharing extraction helpers or
  explicitly separating their responsibilities

### Medium priority

- Add issue flagging for missing canonical, missing viewport, bad schema parse,
  and similar problems
- Make the wait strategy configurable

### Low priority

- Add selective checks so operators can run only schema, only social meta, and
  so on

## Bottom Line

`check-technical.js` is a practical one-page technical triage script. It is
useful, but it currently lives in an awkward middle ground: richer than a quick
utility, but not yet formal enough to be a reusable pipeline component.
