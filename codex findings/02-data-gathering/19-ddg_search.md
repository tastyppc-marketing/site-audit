# Script Audit: `template/scripts/ddg-search.js`

Last updated: 2026-04-17

File: [template/scripts/ddg-search.js](/root/site-audit/template/scripts/ddg-search.js:1)

## Purpose

`ddg-search.js` is a browser-driven search helper that queries DuckDuckGo via
Playwright and prints visible search results to stdout.

It is not a core report generator.
It is a tactical acquisition utility used to inspect rankings or target-domain
visibility without relying on Google scraping.

## Inputs

### CLI inputs

- required search query
- optional `--headed`
- optional `--target domain1,domain2`

## Outputs

- no files written
- prints search results to stdout
- optionally prints target-domain positions

## How It Works

### 1. Launches a Chromium browser

It uses Playwright with:

- a desktop Chrome-like user agent
- US English locale
- standard desktop viewport

### 2. Opens a DuckDuckGo search URL

It navigates directly to:

- `https://duckduckgo.com/?q=...&kl=us-en`

### 3. Scrapes visible result cards

It queries DOM elements from the rendered results page and extracts:

- position
- title
- URL
- domain
- snippet

### 4. Optionally checks target domains

If `--target` is provided, it compares extracted result domains against the
requested targets and prints whether they were found.

## Strengths

- simple and easy to reason about
- avoids some of the anti-bot friction common with Google search scraping
- useful for quick manual ranking checks during an audit

## Weaknesses

### Terminal-only output

This helper does not produce structured JSON output for downstream scripts.
That makes it useful for investigation, but weak as a reusable pipeline step.

### Selector fragility

It depends on DuckDuckGo DOM selectors that may change without notice.

### No pagination or retry logic

It only checks the first visible results page and has no retry strategy around
browser or network issues.

### Loose domain matching

The target matching uses `includes()` against hostnames, which is convenient
but can create false positives for partial matches.

## Failure Modes

- DuckDuckGo changes page structure or selectors
- Playwright missing or browser install missing
- slow network causing navigation timeout
- target matching reporting imprecise hits

## Improvement Targets

### High priority

- Add a machine-readable output mode such as `--json`
- Add stronger target-domain normalization and exact host matching options
- Add optional page-depth support beyond the first results page

### Medium priority

- Add retry logic around navigation
- Reuse the repo's shared fetch / logging conventions where appropriate

### Low priority

- Capture search metadata such as timestamp and locale in output

## Bottom Line

`ddg-search.js` is a useful operator tool, not a core pipeline primitive.
It helps gather visibility context quickly, but its lack of structured output
means it currently sits closer to manual research than durable automation.
