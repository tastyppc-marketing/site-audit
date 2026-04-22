# Script Audit: `template/scripts/gather-organic-metrics.js`

Last updated: 2026-04-17

File: [template/scripts/gather-organic-metrics.js](/root/site-audit/template/scripts/gather-organic-metrics.js:1)

## Purpose

`gather-organic-metrics.js` collects organic keyword portfolio data from
DataForSEO Labs for the client and competitors and writes
`organic-metrics.json`.

Its focus is:

- estimated organic keyword count
- estimated organic traffic
- top keywords by estimated traffic

## Inputs

### CLI inputs

- client domain
- zero or more competitor domains

### Runtime dependencies

- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`
- DataForSEO Labs endpoint

## Outputs

- `seo/research/organic-metrics.json`

Output includes:

- `data`
- `errors`
- `status`
- `gatheredAt`

## How It Works

### 1. Iterates domains sequentially

The first domain is treated as the client.

### 2. Calls ranked keywords API

For each domain it posts to:

- `/dataforseo_labs/google/ranked_keywords/live`

with:

- `location_code: 2840`
- `language_code: 'en'`
- `limit: 100`

### 3. Aggregates keyword rows

It computes:

- `organicKeywords`
- `organicTraffic`
- `topKeywords`

using estimated traffic (`etv`) from returned ranked keyword items.

## Strengths

- narrow and understandable purpose
- explicit null-entry fallback behavior
- gives a stronger organic comparison dimension than backlink summary alone

## Weaknesses

### Hardcoded locale assumptions

`location_code: 2840` and `language_code: 'en'` are fixed in the script.
That makes the output US-English specific even when the client may not be.

### Limit bias

The script only requests 100 ranked keywords per domain. That may be enough for
top-level comparison, but it constrains how representative the resulting
traffic and keyword summaries are.

### Sequential execution

Like `gather-domain-metrics.js`, this script processes domains one at a time.

## Failure Modes

- missing DFS credentials
- no ranked keywords returned
- API or network failure
- locale mismatch leading to misleading results for non-US audits

## Improvement Targets

### High priority

- Make location and language configurable from CLI
- Clarify in output that counts and traffic estimates are derived from the
  returned Labs query, not independent analytics data

### Medium priority

- Support larger or configurable keyword limits
- Consider safe concurrency for domain loops

### Low priority

- Add per-domain provenance metadata

## Bottom Line

`gather-organic-metrics.js` is useful for comparative SEO context, but its
hardcoded locale and shallow limit make it more of a directional comparison tool
than a definitive organic performance dataset.
