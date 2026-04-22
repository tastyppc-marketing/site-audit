# Script Audit: `template/scripts/gather-pagespeed.js`

Last updated: 2026-04-17

File: [template/scripts/gather-pagespeed.js](/root/site-audit/template/scripts/gather-pagespeed.js:1)

## Purpose

`gather-pagespeed.js` collects Google PageSpeed Insights data for the client and
competitor URLs and writes `pagespeed-data.json`.

This file is one of the main sources for:

- `technicalSeo.lighthouseResults`
- `coreWebVitals`
- `pageSpeedComparison`

in the report pipeline.

## Inputs

### CLI inputs

- client URL
- zero or more competitor URLs

The header also mentions `--urls`, but the currently loaded implementation
parses only positional URLs and ignores flags beginning with `--`.

That is an implementation/documentation mismatch.

### Runtime dependencies

- public PSI API
- optional `PAGESPEED_API_KEY` or `GOOGLE_API_KEY`
- shared retry utility in `scripts/lib/fetch-with-retry.js`

## Outputs

- `seo/research/pagespeed-data.json`

Output sections:

- `data.client`
- `data.competitors`
- `pageSpeedComparison`
- `coreWebVitals`
- `errors`
- `status`
- `gatheredAt`

## How It Works

### 1. Builds PSI requests

For each URL it calls PSI twice:

- mobile
- desktop

### 2. Applies concurrency and retry control

It uses a shared semaphore capped at 2 concurrent requests and fetches through
`fetch-with-retry`.

That is one of the more disciplined API scripts in the repo.

### 3. Extracts performance metrics

It maps Lighthouse audits into a compact structure:

- `performanceScore`
- `lcp`
- `fcp`
- `cls`
- `inp`
- `ttfb`
- `speedIndex`
- `opportunities`

### 4. Builds report-facing aggregates

It constructs:

- client/competitor arrays
- comparison table entries
- top-level client `coreWebVitals`

## What Other Scripts Depend On

- `generate-multipage-report.js` reads this file heavily for multiple fallbacks
- report technical page rendering depends on its normalized derivatives

## Strengths

- explicit error tracking
- explicit status (`success` / `partial` / `failed`)
- rate-limit aware design
- compact output shape aligned with downstream needs

## Weaknesses

### Documentation drift

The comment advertises `--urls urls.txt`, but the implementation currently does
not support that mode.

### Homepage bias

`coreWebVitals` is built from the first client entry, effectively assuming the
first supplied client URL is the homepage or the canonical representative page.

### Narrow category collection

It requests only the `performance` category. That is fine for speed metrics but
means other Lighthouse categories are not available.

## Failure Modes

- PSI quota or permission errors
- timeouts
- no `lighthouseResult`
- partial client/competitor success creating uneven comparison quality

## Improvement Targets

### High priority

- Either implement `--urls` or remove it from the script documentation
- Make the representative client page for `coreWebVitals` explicit instead of
  positional

### Medium priority

- Add provenance markers for which pages were used in comparison vs deep results
- Consider optional batching for more than homepage-level benchmarking

### Low priority

- Allow richer category collection when needed

## Bottom Line

`gather-pagespeed.js` is one of the cleaner collection scripts in the repo. Its
main risks are not unstable code, but documentation drift and an implicit
assumption that the first client URL is the one that should define headline Core
Web Vitals for the report.
