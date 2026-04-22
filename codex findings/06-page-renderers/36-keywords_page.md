# Script Audit: `template/reports/multipage/pages/keywords.js`

Last updated: 2026-04-17

File: [template/reports/multipage/pages/keywords.js](/root/site-audit/template/reports/multipage/pages/keywords.js:1)

## Purpose

`pages/keywords.js` renders the keyword visibility page of the multipage
report.

It covers:

- keyword rankings
- volume visualization
- organic visibility
- Search Console data
- traffic overview
- rank history

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.charts`
- `window.TPPC.filters`
- DOM containers for keyword page sections

Primary data dependencies:

- `data.keywords`
- `data.backlinks.domainMetrics` or `data.domainMetrics.client`
- `data.searchConsoleData`
- `data.trafficData`
- rank-history-related fields further down the file
- `data.apiErrors` for some fallback messaging

## Outputs

- defines `window.TPPC.pages.keywords`
- renders multiple table and chart sections
- calls `window.TPPC.filters.init()` after rendering

## How It Works

### 1. Renders the rankings table

It computes counts such as:

- tracked keywords
- page-1 rankings
- top-30 rankings
- missed keywords

and then builds a filterable keyword table.

### 2. Renders a volume chart

It extracts numeric search-volume rows and uses the shared bar-chart helper for
visualization.

### 3. Renders organic visibility context

It attempts to derive organic metrics from multiple possible data locations and
falls back to API error banners or empty states.

### 4. Renders Search Console and traffic sections

These sections use structured tables and charts when data exists, otherwise
they present explanatory empty states.

## Strengths

- strong example of graceful degradation with useful empty states
- integrates shared filters and charts well
- includes upstream API error surfacing instead of only blank output
- handles multiple data-source patterns where the repo contract is inconsistent

## Weaknesses

### The page is carrying normalization responsibility

It does not just render.
It also decides where organic metrics might live and how to interpret missing
or partial data.

### Multiple possible source shapes

Fields are read from alternate locations, for example:

- `data.backlinks.domainMetrics`
- `data.domainMetrics.client`

That is useful defensively, but it is another sign of contract drift.

### Runtime page code is doing a lot

This page is one of the heavier renderers and likely serves as a de facto data
adapter as well as a UI renderer.

## Failure Modes

- malformed keyword rows leading to bad counts or charts
- non-numeric volume fields leaving the chart empty
- partial Google integrations creating uneven section quality
- hidden upstream data issues masked by fallback logic

## Improvement Targets

### High priority

- Move cross-shape normalization into a pre-render data layer instead of inside
  the page renderer
- Define one canonical location for organic visibility and traffic metrics
- Add page-level diagnostics showing which keyword subsystems were sourced from
  which inputs

### Medium priority

- Split this page into smaller rendering modules by section
- Add tests around rank parsing and source-shape fallback behavior

## Bottom Line

`pages/keywords.js` is one of the most revealing files in the repo.
It shows how the report layer is compensating for upstream inconsistency by
normalizing on the fly, which is useful in production but dangerous for long-
term maintainability.
