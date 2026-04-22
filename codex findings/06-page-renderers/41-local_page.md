# Script Audit: `template/reports/multipage/pages/local.js`

Last updated: 2026-04-18

File: [template/reports/multipage/pages/local.js](/root/site-audit/template/reports/multipage/pages/local.js:1)

## Purpose

`pages/local.js` renders the local SEO page of the multipage report.

It covers:

- business profile details
- local performance trends
- citation audit
- service area map
- map pack results

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.charts`
- global `Chart`
- global Leaflet `L`
- DOM containers for local SEO sections

Primary data dependencies:

- `data.localSeo` or `data.local_seo`
- business profile data
- performance records
- citation data
- service-area map data
- map-pack keyword data
- optional competitor and demand-zone map overlays

## Outputs

- defines `window.TPPC.pages.local`
- renders several local-SEO sections
- manages local chart instances and a Leaflet map instance

## How It Works

### 1. Normalizes a mixed local-SEO payload

The file handles multiple naming conventions and data shapes for:

- business profile
- performance records
- citations
- map pack
- service area map inputs

### 2. Renders the business profile summary

It creates a profile overview card with rating, review, and verification state
when meaningful profile data exists.

### 3. Renders charts and map-based sections

It builds:

- a local-performance trend chart
- a citation breakdown doughnut chart
- a Leaflet map with business, competitor, and hotspot overlays

### 4. Handles missing external libraries

For mapping, it explicitly checks whether Leaflet is available and shows a
message if it is not.

## Strengths

- broad local-SEO coverage in one page
- explicit handling of map-library dependency presence
- stronger lifecycle management for map/chart instances than some simpler pages
- useful normalization of local data source variants

## Weaknesses

### Very dependency-heavy page

This renderer depends on both charting and mapping libraries plus a large local
SEO payload surface area.

### Another heavy normalization layer in the browser

The page is doing a lot of coercion and fallback handling that would be more
reliable upstream.

### Local SEO data contract is broad and loosely typed

The page accepts many optional structures, which helps resilience but also
shows the local-SEO contract is not tightly governed.

## Failure Modes

- Leaflet or Chart missing
- partial local SEO payload leading to uneven section quality
- service area map missing coordinates even when some local data exists
- browser rendering becoming the only place where certain local data is
  correctly interpreted

## Improvement Targets

### High priority

- Define a canonical local-SEO normalized payload before report rendering
- Separate map data prep from map rendering logic
- Document the required vs optional local SEO fields explicitly

### Medium priority

- Add fixtures for public-web-research mode vs full API-access mode
- Surface a visible section provenance summary so reviewers know which local
  sections came from which data source

## Bottom Line

`pages/local.js` is one of the most feature-rich page renderers in the report.
Its main weakness is not lack of capability.
The weakness is that it depends on a wide, flexible, partly normalized browser
contract that is difficult to keep stable over time.
