# Script Audit: `template/reports/multipage-ppc/shared/charts.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/shared/charts.js](/root/site-audit/template/reports/multipage-ppc/shared/charts.js:1)

## Purpose

`shared/charts.js` provides Chart.js helpers for the PPC report runtime.

It exposes:

- bar chart creation
- doughnut chart creation
- radar chart creation
- CWV gauge rendering

## Inputs

Runtime dependencies:

- global `Chart`
- DOM canvas/container elements

## Outputs

- `window.TPPC.charts`

## How It Works

The file wraps repetitive Chart.js configuration in small factories and exposes
a shared color palette and default font config.

## Strengths

- gives pages a simpler chart API
- centralizes chart colors and defaults
- avoids repeating Chart.js boilerplate in every page renderer

## Weaknesses

### Includes leftover SEO-specific concepts

The PPC charts helper still contains Core Web Vitals gauge logic. That is a
strong signal the file was copied from the SEO runtime with minimal cleanup.

There is no obvious PPC page that should need CWV gauges.

### Another duplicated runtime module

The actual chart helpers are generic enough that they should probably live in a
single shared runtime instead of two separate stacks.

### Fixed design assumptions

Default fonts, legend behavior, and palette are hardcoded globally. That makes
styling changes broad and potentially hard to coordinate.

## Failure Modes

- irrelevant leftover features increase maintenance surface
- chart behavior drifts between SEO and PPC copies
- future chart changes need to be ported manually across both stacks

## Improvement Targets

### High priority

- Extract one common chart helper library for SEO and PPC
- Remove PPC-unused CWV gauge logic unless PPC truly needs it
- Keep report-specific chart composition in pages, not in copied runtime files

### Medium priority

- Add small fixture-based rendering checks for each chart helper

## Bottom Line

`shared/charts.js` is useful infrastructure, but it also exposes the copy-first
architecture of the report runtime.

The leftover CWV helper is the clearest sign that PPC is carrying SEO baggage
inside its shared layer.
