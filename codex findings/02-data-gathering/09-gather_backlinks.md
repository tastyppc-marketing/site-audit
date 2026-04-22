# Script Audit: `template/scripts/gather-backlinks.js`

Last updated: 2026-04-17

File: [template/scripts/gather-backlinks.js](/root/site-audit/template/scripts/gather-backlinks.js:1)

## Purpose

`gather-backlinks.js` collects detailed backlink and referring-domain data from
DataForSEO for the client domain and optionally for competitor domains.

It writes:

- `seo/research/client-backlinks.json`
- `seo/research/backlinks-{domain}.json` for competitor domains

This is one of the main sources for the links and backlink sections of the
audit.

## Inputs

### CLI inputs

- client domain plus optional competitors
- `--from-audit-data`
- `--competitors-only`
- `--limit N`

### Runtime dependencies

- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`
- `scripts/lib/fetch-with-retry.js`

## Outputs

Per-domain JSON including:

- `domain`
- `totalBacklinks`
- `referringDomains`
- `backlinks`
- `referring_domains`
- `errors`
- `status`
- `gatheredAt`

## How It Works

### 1. Resolves target domains

It can either:

- take domains directly from CLI
- or load client + competitors from `seo/audit-data.json`

### 2. Fetches two DFS datasets per domain

For each domain it requests:

- `/backlinks/backlinks/live`
- `/backlinks/referring_domains/live`

### 3. Writes one JSON artifact per domain

The client gets a canonical file name:

- `client-backlinks.json`

Competitors get one file each:

- `backlinks-{domain}.json`

## Strengths

- useful `--from-audit-data` mode
- structured error reporting per endpoint
- cost awareness printed in console
- output contract matches the report normalizer’s expectations reasonably well

## Weaknesses

### Confirmed implementation bug

The file imports:

- `postJson`

from `fetch-with-retry`, but later uses:

- `new Semaphore(2)`

without importing `Semaphore`.

That means the current implementation should throw at runtime when it reaches
the parallel execution block, unless `Semaphore` is somehow leaked globally.

This is a real script-level defect, not just a possible improvement.

### Mixed file strategy

Client output is canonicalized to `client-backlinks.json`, while competitors get
domain-specific file names. That is workable, but it adds special-case behavior
to downstream consumers.

### Summary values are local counts, not full-domain totals

`totalBacklinks` is set to the length of the fetched backlink array, not the
true global backlink total for the domain. Same issue for referring domains if
only a capped subset is fetched.

That makes the field names potentially misleading.

## Failure Modes

- missing DFS credentials
- missing `Semaphore` import causing runtime failure
- DFS partial failure for one of the two endpoints
- misleading totals due to capped result sets

## Improvement Targets

### High priority

- Fix the missing `Semaphore` import
- Rename or annotate `totalBacklinks` / `referringDomains` to clarify when they
  are fetched-subset counts instead of authoritative totals

### Medium priority

- Consider splitting fetch logic from write logic for easier testing
- Emit per-domain request provenance in output

### Low priority

- Add optional batching strategy for large competitor sets

## Bottom Line

`gather-backlinks.js` is strategically important and mostly well-shaped, but the
current checked-in version appears to contain a concrete runtime bug around
`Semaphore`, and some of its summary field names overstate what the script
actually collects.
