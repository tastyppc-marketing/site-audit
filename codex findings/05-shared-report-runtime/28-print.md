# Script Audit: `template/reports/multipage/shared/print.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/print.js](/root/site-audit/template/reports/multipage/shared/print.js:1)

## Purpose

`print.js` prepares the live multipage report DOM for browser print and PDF
export.

It expands hidden UI, reveals all tab content, disables pagination controls,
and tries to make the printed output complete rather than interactive.

## Inputs

Runtime dependencies:

- the live report DOM
- collapsible sections
- tab panels
- paginated or filtered tables

## Outputs

- registers a `beforeprint` handler
- mutates the DOM in place before printing

## How It Works

### 1. Binds a print preparation hook

On init, it registers `preparePDF()` against the browser's `beforeprint` event.

### 2. Expands interactive sections

It opens:

- collapsibles
- tab panels

so hidden content is printable.

### 3. Reveals paginated or filtered rows

It clears inline display rules on table bodies and rows.

### 4. Hides interactive controls

It hides some known pagination and filter elements before print.

## Strengths

- practical solution for converting an interactive report into a printable one
- small and easy to reason about
- makes print completeness an explicit runtime concern

## Weaknesses

### Direct DOM mutation with limited restoration logic

The script prepares the page for printing, but it does not restore the prior UI
state afterward.
That may be fine for one-way export flows, but it is still a notable runtime
behavior.

### Selector-specific logic

It hides only certain known control selectors.
If the report UI grows, print prep can silently become incomplete.

### Conflates print and PDF

The function is named `preparePDF()`, but it is triggered by print behavior in
general.

## Failure Modes

- interactive UI changes but selectors are not updated here
- print output still omits data because some components use different hiding
  mechanisms
- live page state remains altered after print

## Improvement Targets

### High priority

- Add a reversible print-state strategy or `afterprint` cleanup
- Centralize print-relevant selectors so they do not drift across the runtime
- Audit whether filtered tables need data restoration beyond display toggling

### Medium priority

- Add print diagnostics for hidden content that could not be expanded

### Low priority

- Rename `preparePDF()` if the intent is broader than PDF generation

## Bottom Line

`print.js` is a small but important bridge between interactive HTML reporting
and exportable deliverables.
Its current approach is pragmatic, but fragile if the surrounding runtime keeps
evolving without a shared print contract.
