# Script Audit: `template/reports/multipage/shared/utils.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/utils.js](/root/site-audit/template/reports/multipage/shared/utils.js:1)

## Purpose

`utils.js` is the shared helper library for the multipage report runtime.

It provides:

- HTML escaping
- CSS class mapping helpers
- formatting helpers
- collapsible setup
- responsive table enhancement
- API error banner rendering

## Inputs

Runtime dependencies:

- the browser DOM
- report tables and collapsible markup conventions
- `apiErrors` entries inside the active audit data payload

## Outputs

- exposes `window.TPPC.utils`
- exposes `window.TPPC.esc`
- mutates the DOM when initializing collapsibles or responsive tables

## How It Works

### 1. Defines formatting and class helpers

Examples include:

- `esc`
- `gradeClass`
- `severityClass`
- `pillClass`
- `rankClass`
- `formatNumber`
- `formatPercent`

### 2. Provides DOM utility helpers

It exposes shorthand selectors and a collapsible-section HTML builder.

### 3. Enhances rendered report tables

`makeTablesResponsive()` reads table headers and applies `data-label`
attributes to table cells for mobile rendering.

### 4. Surfaces API failure information

It includes helper functions to extract API error entries from report data and
render a visible warning banner.

## Strengths

- genuinely useful central utility layer
- `esc()` is an important safety primitive for page renderers
- responsive table enhancement is a practical post-render step
- API error banner support is one of the clearer signs that partial-failure
  reporting was considered in the architecture

## Weaknesses

### Mixed concerns

This file bundles:

- string escaping
- style classification
- DOM helpers
- formatting
- API error rendering

That is common in legacy browser runtimes, but broad for a single file.

### Global exposure pattern

Everything is attached to `window.TPPC`, which makes this easy to consume but
also increases coupling and load-order sensitivity.

### API error handling depends on a hidden upstream contract

The helper assumes `data.apiErrors` exists and follows a specific shape, but
that contract has to be generated correctly elsewhere.

## Failure Modes

- page renderers bypass `esc()` and insert unsafe HTML directly
- tables without proper `thead` structure do not become responsive correctly
- inconsistent `apiErrors` structure prevents banners from rendering

## Improvement Targets

### High priority

- Keep `esc()` usage mandatory in page renderers that build HTML strings
- Document the `apiErrors` schema as part of the report contract
- Split DOM helpers from formatting helpers if this runtime keeps growing

### Medium priority

- Add test coverage around class-mapping and formatting helpers
- Consolidate repeated badge and rank semantics used elsewhere in the runtime

### Low priority

- Consider more structured template rendering to reduce manual string assembly

## Bottom Line

`utils.js` is one of the healthier shared runtime files.
Its main issue is not poor design, but that too many responsibilities are
accumulating in one global helper layer.
