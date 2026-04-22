# Script Audit: `template/reports/multipage/shared/charts.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/charts.js](/root/site-audit/template/reports/multipage/shared/charts.js:1)

## Purpose

`charts.js` provides browser-side chart helpers for the multipage report
runtime.

It wraps Chart.js and also includes non-canvas helpers for Core Web Vitals
gauges and ranking-position deltas.

## Inputs

Runtime dependencies:

- `window.TPPC`
- global `Chart`
- DOM canvas or container elements referenced by ID

## Outputs

- exposes `window.TPPC.charts`
- creates bar, doughnut, radar, and rank line charts
- renders inline CWV gauge markup
- renders ranking delta HTML snippets

## How It Works

### 1. Defines a shared color and font system

It sets a fixed palette and shared Chart.js defaults.

### 2. Provides chart factory helpers

Available factories include:

- `createBarChart`
- `createDoughnutChart`
- `createRadarChart`
- `createRankLineChart`

### 3. Provides HTML-based metric renderers

Not everything is a chart instance.
The file also renders:

- CWV gauge markup
- keyword position delta labels

## Strengths

- centralizes report chart styling in one file
- offers consistent wrappers around common chart types
- includes useful non-canvas visual helpers for SEO metrics

## Weaknesses

### Mixed concerns

This file combines:

- chart factories
- styling constants
- HTML string generation
- ranking delta formatting

Those are related, but not identical responsibilities.

### Tight dependency on global Chart.js

If Chart.js is missing or loaded late, parts of this file silently return `null`
instead of giving a stronger diagnostics signal.

### Namespace mismatch persists

Like the rest of the runtime, it uses `TPPC` even for helpers clearly relevant
to SEO visualizations such as CWV and ranking deltas.

### Potential XSS / escaping concern surface

The HTML render helpers build strings directly.
The current content seems metric-oriented, but string-based HTML generation
always deserves attention if any fields become user-originated.

## Failure Modes

- chart canvas element missing
- Chart.js unavailable
- rendered data too large or semantically inconsistent for the chosen chart type
- CWV data partially missing and resulting visuals appear incomplete

## Improvement Targets

### High priority

- Separate Chart.js wrappers from HTML metric renderers
- Add stronger warnings when required chart dependencies are absent
- Standardize namespace naming across SEO and PPC report runtimes

### Medium priority

- Add destroy / re-render support if pages ever become dynamic
- Centralize number formatting and labels used in chart tooltips

### Low priority

- Add snapshot tests or fixture-driven rendering checks where feasible

## Bottom Line

`charts.js` is a useful shared visualization layer.
Its main issue is not weak functionality.
The issue is that it sits inside a runtime with mixed branding, global
dependencies, and only light diagnostics when visual rendering fails.
