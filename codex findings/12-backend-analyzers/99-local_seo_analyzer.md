# Script Audit: `platform/src/audit_platform/analyzers/local_seo.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/local_seo.py](/root/site-audit/platform/src/audit_platform/analyzers/local_seo.py:1)

## Purpose

`local_seo.py` is the backend local-search analysis module.

It covers:

- review sentiment
- GBP competitor comparison
- local landing-page scoring
- service-area GeoJSON generation
- map-grid coordinate generation

## Inputs

Primary dependencies:

- `structlog`
- optional `vaderSentiment`
- optional `geopy`

Primary runtime inputs:

- review records
- business profile
- competitor profiles
- crawled pages
- location keywords

## Outputs

The main `analyze(...)` method returns:

- `reviewSentiment`
- `competitorGbp`
- `landingPageScores`
- `serviceAreaMap`

## How It Works

### 1. Analyzes review sentiment

If VADER is installed, the analyzer classifies longer reviews as positive,
negative, or neutral and extracts common positive and negative keyword themes.

Short reviews fall back to rating-based sentiment heuristics.

### 2. Normalizes GBP comparisons

It builds a side-by-side table for the client profile and competitor profiles
using a normalized comparison shape.

### 3. Scores local landing pages

Pages are scored against a fixed weighted checklist including:

- local schema
- location in title and H1
- NAP presence
- location in description
- internal links
- basic content depth

### 4. Generates local map geometry

The analyzer can produce:

- a GeoJSON feature collection for service area visualization
- an N x N local ranking grid of latitude/longitude points

## Interactions With Other Scripts

This module sits between:

- GBP / local connector outputs
- crawl outputs
- local-report rendering

It also overlaps with prior standalone local SEO scripts and connector test
paths already documented elsewhere in the repo.

## Strengths

- useful combination of GBP, content, review, and location geometry signals
- graceful dependency fallback when optional libraries are missing
- report-friendly outputs for local presentation layers

## Weaknesses

### Competitor locations are not passed into the service-area map in the main flow

`generate_service_area_geojson(...)` supports `competitor_locations`, but the
main `analyze(...)` method calls it with only the business profile.

So the report-facing service-area map does not include competitor points even
though the helper clearly supports them.

### `geopy` is imported but not used

The file advertises `geopy` usage, but the active geometry helpers use simple
degree-per-kilometer approximations instead.

That is not necessarily wrong, but it is a contract and implementation mismatch.

### Local landing-page scoring has known blind spots

The page score includes an "Embedded map" check, but that check is hardcoded to
`False`.

That means the scoring model contains a criterion the implementation cannot
currently satisfy.

### NAP detection is very shallow

The NAP check only inspects title, H1, and meta description text, not full page
content.

That will miss many legitimate local landing pages where NAP details live in the
body or footer.

### Missing VADER means no degraded sentiment output

If `vaderSentiment` is unavailable, the analyzer returns an empty sentiment
summary rather than a partial rating-based analysis.

That is resilient, but it drops usable signal unnecessarily.

## Failure Modes

- competitor map context disappears from the main output even when competitor
  profiles are available
- local landing-page scores understate pages that have body-level NAP or map
  embeds
- optional dependency absence can zero out whole sections instead of degrading
  gracefully

## Improvement Targets

### High priority

- pass competitor profile coordinates through to `generate_service_area_geojson`
  from the main `analyze(...)` path
- either use `geopy` for distance work or stop advertising it as part of the
  implementation
- make the embedded-map check observable if page HTML is available

### Medium priority

- improve NAP detection with full-page text or extracted body content
- preserve some rating-based sentiment output even when VADER is unavailable

## Bottom Line

`local_seo.py` is directionally useful and report-friendly, but it is more
"local SEO scaffolding" than a fully closed-loop analyzer.

The main quality issue here is that several promising helper capabilities are
not fully wired into the main analysis path.
