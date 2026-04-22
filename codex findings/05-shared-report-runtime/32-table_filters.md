# Script Audit: `template/reports/multipage/shared/table-filters.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/table-filters.js](/root/site-audit/template/reports/multipage/shared/table-filters.js:1)

## Purpose

`table-filters.js` provides reusable search and dropdown filtering for report
tables.

It is meant to work alongside the pagination system and can auto-discover
filter options from table content.

## Inputs

Runtime dependencies:

- wrappers marked with `[data-filterable]`
- a `.report-table` inside each wrapper
- optional `data-filters` JSON metadata on the wrapper

## Outputs

- injects a filter bar above eligible tables
- filters rows by search text and optional dropdown logic
- dispatches `tppc:filterchange` events for pagination integration

## How It Works

### 1. Injects its own scoped CSS

The script creates a `<style>` tag once and inserts component styles directly
into the document head.

### 2. Discovers table options

Depending on configuration, it can derive filter options from:

- badge content
- unique column values
- explicit option lists
- numeric ranges

### 3. Builds the filter UI

Each table can receive:

- a text search box
- one or more dropdown filters
- a clear-all button
- a live row count

### 4. Applies row visibility rules

It evaluates text search plus dropdown filters using AND logic and toggles row
display directly.

### 5. Signals other components

After filtering, it dispatches a custom event so pagination can update.

## Strengths

- flexible enough to support multiple filter types
- event-based integration with pagination is a good design choice
- auto-discovery reduces manual configuration burden

## Weaknesses

### DOM and data conventions are tightly coupled

The script depends on specific table structures, badge classes, and wrapper
attributes.

### Self-initializing behavior can complicate boot order

It initializes on `DOMContentLoaded` automatically, but the broader runtime
also has an explicit boot system.
That creates two startup models in the same app.

### Row-visibility logic differs from pagination strategy

This script hides rows with `display:none`, while pagination stores rows in JS
and re-renders them.
The integration works, but it also means two separate DOM-state approaches are
in play.

## Failure Modes

- malformed `data-filters` JSON
- nested table structures causing incorrect row discovery
- pagination and filtering disagreeing about which rows are active
- auto-init running before dynamically rendered tables are present

## Improvement Targets

### High priority

- Standardize initialization so shared runtime components use one boot model
- Document the wrapper and `data-filters` contract for page authors
- Consider a shared row-state model between filters and pagination

### Medium priority

- Move inline injected CSS into shared stylesheet infrastructure
- Add diagnostics when filter config JSON fails to parse

### Low priority

- Add richer filter types such as multi-selects or saved presets if needed

## Bottom Line

`table-filters.js` is a capable report-table utility.
The main risk is not the feature set itself.
The risk is that it participates in a runtime where initialization order and
DOM ownership are already somewhat fragmented.
