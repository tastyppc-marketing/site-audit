# Script Audit: `template/scripts/gather-keyword-volumes.js`

Last updated: 2026-04-17

File: [template/scripts/gather-keyword-volumes.js](/root/site-audit/template/scripts/gather-keyword-volumes.js:1)

## Purpose

`gather-keyword-volumes.js` collects real keyword search volume data from
DataForSEO Google Ads search volume API and writes `keyword-volumes.json`.

It also has a second role: when run with `--from-audit`, it can update
`audit-data.json` in place with real keyword volume, CPC, and competition data.

That makes it both a collector and a mutator.

## Inputs

### CLI inputs

- positional keyword list
- `--from-audit <path>`
- `--location <code>`
- `--language <code>`

### Runtime dependencies

- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`

## Outputs

- `seo/research/keyword-volumes.json`
- optionally mutates the provided `audit-data.json`

Output includes:

- `data`
- `errors`
- `status`
- `locationCode`
- `languageCode`
- `gatheredAt`

## How It Works

### 1. Resolves keyword source

It can either:

- take keywords directly from CLI
- or load them from `audit-data.json`

### 2. Chunks keyword batches

It batches requests up to:

- `MAX_KEYWORDS_PER_BATCH = 1000`

### 3. Calls DFS Google Ads search volume API

For each batch it posts to:

- `/keywords_data/google_ads/search_volume/live`

### 4. Writes both research output and optional audit-data updates

It writes `keyword-volumes.json` and, if `--from-audit` was used, updates each
matching keyword entry in `audit-data.json` with:

- `volume`
- `cpc`
- `competition`

## Strengths

- clear CLI parsing
- useful `--from-audit` workflow
- cost awareness
- supports large batches efficiently

## Weaknesses

### Dual responsibility

This script both gathers research data and mutates the core audit payload.
That is convenient, but it also blurs responsibility and can create hidden state
changes.

### In-place mutation risk

When run against `audit-data.json`, it rewrites that file directly. That is a
meaningful behavior and should be treated carefully in operational workflows.

### Trend shape is compressed

Monthly searches are flattened into a bare `trend` array of volumes, which may
drop some contextual information from the DFS response.

## Failure Modes

- missing DFS credentials
- invalid CLI flags
- no keywords found in audit file
- partial batch failure
- silent business-logic confusion if users forget the script mutates
  `audit-data.json`

## Improvement Targets

### High priority

- Make the mutation behavior explicit in file output and console messaging
- Consider a `--write-audit` opt-in flag instead of mutating automatically when
  `--from-audit` is used

### Medium priority

- Persist richer monthly trend structure if downstream reporting may need it
- Add dry-run mode for audit updates

### Low priority

- Add summary reporting of how many keywords were unmatched and left unchanged

## Bottom Line

`gather-keyword-volumes.js` is one of the more useful scripts in the collection
layer because it can convert placeholder or qualitative keyword data into real
numbers. Its main architectural issue is that it mixes collection and direct
mutation of `audit-data.json` in one step.
