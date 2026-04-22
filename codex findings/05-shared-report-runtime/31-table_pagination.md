# Script Audit: `template/reports/multipage/shared/table-pagination.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/table-pagination.js](/root/site-audit/template/reports/multipage/shared/table-pagination.js:1)

## Purpose

`table-pagination.js` provides reusable client-side pagination for report
tables.

It is designed to work with the shared table filtering system and uses DOM
re-rendering rather than CSS-only hiding.

## Inputs

Runtime dependencies:

- table wrappers marked with `[data-paginate]`
- tables with a `tbody`
- optional filter events dispatched as `tppc:filterchange`

## Outputs

- exposes `window.TPPC.pagination`
- inserts top and bottom pagination controls into the DOM
- removes and re-inserts table rows during pagination

## How It Works

### 1. Captures all table rows in memory

It copies all original `<tr>` rows into an array, then clears the live `tbody`.

### 2. Renders only the current page rows

Pagination is implemented by reattaching only the rows for the active page.

### 3. Builds controls above and below the table

It injects:

- previous / next buttons
- page buttons
- page-size selector
- result count display

### 4. Reacts to filter changes

When the associated table dispatches `tppc:filterchange`, it rebuilds the list
of rows eligible for pagination.

## Strengths

- more robust than CSS-only pagination because hidden rows are removed from the
  live DOM
- integrates intentionally with the filter system
- easy to follow despite handling a non-trivial UI concern

## Weaknesses

### Strong DOM ownership

Because it removes and re-inserts rows, it assumes nothing else depends on row
identity or external event bindings in a fragile way.

### Styling embedded inline

A large amount of control styling is built into the generated HTML, which makes
the component less themeable.

### Hard-coded thresholds and page sizes

Defaults such as page sizes and the visibility threshold for controls are
embedded in code.

## Failure Modes

- other scripts attach state to rows and lose assumptions during re-rendering
- filtering and pagination drift if rows are marked inconsistently
- control selectors or wrapper structures change

## Improvement Targets

### High priority

- Document the expected interaction model between filters and pagination
- Audit whether page-specific renderers attach events to rows that pagination
  may disrupt
- Move control styling into shared CSS

### Medium priority

- Allow configurable page sizes per table
- Add diagnostics for malformed or empty paginated wrappers

### Low priority

- Support preserving scroll position or focus more explicitly during page flips

## Bottom Line

`table-pagination.js` is a sensible implementation for static report tables.
Its main tradeoff is that it takes strong ownership of the table DOM, which is
fine as long as the surrounding runtime remains simple and predictable.
