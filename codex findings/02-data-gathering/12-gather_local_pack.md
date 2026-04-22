# Script Audit: `template/scripts/gather-local-pack.js`

Last updated: 2026-04-17

File: [template/scripts/gather-local-pack.js](/root/site-audit/template/scripts/gather-local-pack.js:1)

## Purpose

`gather-local-pack.js` checks whether the client business appears in Google’s
local pack for tracked keywords using DataForSEO SERP data.

It produces:

- `seo/research/local-pack-data.json`

This script is specifically about map-pack presence, not broader local SEO.

## Inputs

### CLI inputs

- `--keywords "kw1,kw2,kw3"`
- `--location <code>`
- `--business "Business Name"`
- `--from-audit <audit-data.json>`

### Runtime dependencies

- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`

## Outputs

- `seo/research/local-pack-data.json`

Output includes:

- `businessName`
- `locationCode`
- `keywords`
- `summary`
- `errors`
- `status`
- `gatheredAt`

## How It Works

### 1. Resolves keywords and business name

It can either:

- read keywords and client name from `audit-data.json`
- or take both directly from CLI flags

### 2. Calls DataForSEO SERP API per keyword

For each keyword it posts to:

- `/serp/google/organic/live/advanced`

with:

- location code
- English language
- desktop device
- depth 100

### 3. Extracts local pack entries

It looks for an item of type:

- `local_pack`

and then inspects the first three entries.

### 4. Uses fuzzy title matching against business name

It decides whether the client is in the pack via simple substring matching
between the pack listing title and the business name.

## Strengths

- direct and focused purpose
- useful `--from-audit` mode
- outputs clear per-keyword presence data

## Weaknesses

### Matching logic is weak

The `fuzzyMatch()` function is only a simple inclusion test. It will fail on:

- abbreviated brand names
- alternate DBA names
- brokerage vs agent naming differences
- titles that include neighborhood modifiers or franchise branding

### Hardcoded search context

The script hardcodes:

- `language_code: 'en'`
- `device: 'desktop'`

Those choices may not match the business’s actual search context.

### One-query-per-keyword cost model

This is straightforward, but can become expensive or slow if the keyword list
grows.

## Failure Modes

- missing DFS credentials
- no local pack present in SERP
- fuzzy matching false negatives or false positives
- locale mismatch

## Improvement Targets

### High priority

- Improve entity matching beyond simple substring checks
- Make device and language configurable

### Medium priority

- Record the raw matched evidence that caused a listing to be considered the
  client business
- Add optional business-domain matching when available

### Low priority

- Support batch summarization by location or keyword category

## Bottom Line

`gather-local-pack.js` fills a real gap in the local SEO story, but its current
matching logic is brittle. It is useful directional evidence, not something that
should be treated as authoritative local-pack truth without verification.
