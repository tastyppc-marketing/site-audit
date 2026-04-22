# Script Audit: `template/reports/multipage/pages/competitors.js`

Last updated: 2026-04-18

File: [template/reports/multipage/pages/competitors.js](/root/site-audit/template/reports/multipage/pages/competitors.js:1)

## Purpose

`pages/competitors.js` renders the competitor analysis page of the multipage
report.

It covers:

- competitor comparison table
- comparative charting
- strategy notes
- domain metrics
- PageSpeed comparison

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.filters`
- `window.TPPC.charts`
- DOM containers for competitor sections

Primary data dependencies:

- `data.competitorComparison`
- `data.siteComparison`
- `data.competitor`
- `data.competitorStrategies`
- `data.domainMetrics`
- `data.pageSpeedComparison`
- `data.apiErrors`

## Outputs

- defines `window.TPPC.pages.competitors`
- renders tables and charts into the competitor page
- manages local chart instances for the comparison and PageSpeed visuals

## How It Works

### 1. Renders a competitor comparison table

It builds dynamic competitor columns by inspecting `comp1`, `comp2`, and other
similar keys in `competitorComparison`.

### 2. Builds a comparative chart from `siteComparison`

Despite the helper name `renderRadarChart`, the current implementation builds a
horizontal bar-chart style competitive-gap visualization.

### 3. Parses heterogeneous numeric values

The file includes substantial parsing logic to coerce values like:

- ranges
- fractions
- currency
- shorthand suffixes such as `k`, `m`, and `b`

into comparable numeric forms.

### 4. Renders competitor notes and benchmark sections

It then fills out domain metrics and PageSpeed comparisons with additional
tables and charts.

## Strengths

- strong attempt to compare messy heterogeneous competitor metrics
- useful dynamic competitor-column handling
- practical fallback messaging for missing domain and PageSpeed data

## Weaknesses

### Significant normalization logic embedded in the page

The numeric parsing logic is non-trivial and belongs conceptually in an
upstream normalization layer, not the browser renderer.

### Misleading helper naming

`renderRadarChart()` no longer renders a radar chart.
That is a small naming issue, but it indicates drift between the intended and
actual implementation.

### Multiple source contracts still coexist

This page depends on both:

- `competitorComparison`
- `siteComparison`

with different structural expectations, which continues the contract
duplication seen elsewhere.

## Failure Modes

- numeric parsing gives misleading comparisons for oddly formatted values
- competitor label resolution drifts from actual competitor data
- browser output disagrees with spreadsheet or presentation outputs because the
  browser performs extra normalization locally

## Improvement Targets

### High priority

- Move competitor metric parsing and coercion into a dedicated normalization
  layer before rendering
- Rename helpers to reflect actual chart types and behavior
- Standardize one canonical competitor-comparison contract used across all
  outputs

### Medium priority

- Add fixtures covering edge-case metric strings and multi-competitor shapes
- Separate chart prep from page rendering logic

## Bottom Line

`pages/competitors.js` is one of the clearest examples of the browser layer
doing serious data cleanup.
That keeps the page functional, but it also means the competitor page is harder
to trust as a pure view of already-clean data.
