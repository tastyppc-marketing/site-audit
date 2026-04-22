# Script Audit: `template/scripts/gather-domain-metrics.js`

Last updated: 2026-04-17

File: [template/scripts/gather-domain-metrics.js](/root/site-audit/template/scripts/gather-domain-metrics.js:1)

## Purpose

`gather-domain-metrics.js` collects domain-level backlink summary metrics from
DataForSEO for the client and competitors and writes `domain-metrics.json`.

Its main job is to provide comparative authority metrics such as:

- domain rating
- referring domains
- total backlinks
- broken backlinks

## Inputs

### CLI inputs

- client domain
- zero or more competitor domains

### Runtime dependencies

- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`
- `scripts/lib/fetch-with-retry.js`

## Outputs

- `seo/research/domain-metrics.json`

Output structure includes:

- `data`
- `errors`
- `status`
- `gatheredAt`

## How It Works

### 1. Iterates over all requested domains

The first domain is treated as the client, and all others are treated as
competitors.

### 2. Calls DataForSEO Backlinks Summary

For each domain it hits:

- `/backlinks/summary/live`

### 3. Maps the response into a simplified contract

It writes:

- `domain`
- `domainRating`
- `referringDomains`
- `backlinks`
- `organicTraffic`
- `organicKeywords`
- `trafficValue`
- `brokenBacklinks`
- `isClient`

Notably, the organic fields are always written as `null` because they are not
available from this endpoint.

## What Other Scripts Depend On

- `generate-multipage-report.js` can use this file as a fallback source for
  domain comparison data
- competitor and links reporting can display these numbers when present

## Strengths

- simple, narrow purpose
- explicit null placeholders for unavailable fields
- partial/failure aware output

## Weaknesses

### Mixed semantic payload

The script writes organic fields that it does not actually collect. This can be
useful for schema consistency, but it also makes the file look more complete
than it is.

### Sequential execution

Every domain is processed in order. For a small domain set that is fine, but
the script is slower than necessary.

### Limited utility by itself

On its own, this file does not give enough context for backlink quality or
competitive strategy. It is only a summary source.

## Failure Modes

- missing DFS credentials
- DFS task failure or empty task result
- network error
- partial results across domains

## Improvement Targets

### High priority

- Add provenance notes or comments in output indicating organic fields are not
  sourced from this endpoint
- Consider merging with organic metrics at a later assembly stage instead of
  writing placeholder nulls here

### Medium priority

- Add safe concurrency for multiple domains
- Normalize domain input more aggressively

### Low priority

- Include endpoint metadata or request cost tracking in output

## Bottom Line

`gather-domain-metrics.js` is a clean but limited summary collector. It is
useful as a comparison input, but it should not be mistaken for a full domain
performance data source.
