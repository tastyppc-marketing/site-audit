# Script Audit: `template/reports/multipage-ppc/shared/print.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/shared/print.js](/root/site-audit/template/reports/multipage-ppc/shared/print.js:1)

## Purpose

`shared/print.js` prepares the PPC report for printing or PDF export.

It:

- listens for `beforeprint`
- expands collapsibles
- reveals tab panels
- forces tabs into a selected state

## Inputs

Runtime dependencies:

- browser print lifecycle
- collapsible markup
- tab markup

## Outputs

- `window.TPPC.print.init()`
- `window.TPPC.print.preparePDF()`

## How It Works

The file is intentionally small: it mutates the current DOM just before print
so hidden content becomes visible in the printed output.

## Strengths

- straightforward and low-complexity
- useful for turning interactive report pages into printable documents

## Weaknesses

### State is one-way

The file prepares the DOM for print, but it does not restore previous state
after printing. That can leave the live page visually changed after a PDF /
print action.

### Simpler than the SEO print helper

This copy appears narrower than the SEO print runtime. That may be fine, but it
also means the two print behaviors can drift.

## Failure Modes

- print preparation permanently changes UI state until reload
- future interactive widgets will not be handled unless added manually here
- duplication means print regressions can differ between SEO and PPC

## Improvement Targets

### High priority

- add `afterprint` restoration where practical
- share one print-preparation runtime across report families

### Medium priority

- keep a small registry of print adapters for future interactive components

## Bottom Line

`shared/print.js` is a simple helper with one main gap: it mutates the live UI
for printing but does not restore it afterward.
