# Script Audit: `template/reports/multipage-ppc/pages/quality-score.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/pages/quality-score.js](/root/site-audit/template/reports/multipage-ppc/pages/quality-score.js:1)

## Purpose

`pages/quality-score.js` renders the PPC Quality Score page.

It covers:

- account-level QS gauge
- QS distribution chart
- QS component checks
- top-spender keyword rows

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.charts`
- DOM containers for the QS page

Primary data dependencies:

- `data.ppcAudit.qualityScore.summary`
- `data.ppcAudit.qualityScore.distribution`
- `data.ppcAudit.qualityScore.checks`
- raw `keywords`
- top-level `data.qualityScore`

## Outputs

- defines `window.TPPC.pages['quality-score']`
- renders the PPC Quality Score page

## How It Works

### 1. Renders the account QS gauge

The page uses `qualityScore.summary.accountQS` and related totals to build the
main score panel.

### 2. Builds the QS distribution section

If a distribution map exists, the page creates a bar chart and matching stat
cards. If not, it renders empty states.

### 3. Filters sub-component checks by ID

The sub-component section looks for check IDs matching `QS-03` through `QS-05`
to represent:

- expected CTR
- ad relevance
- landing page experience

### 4. Builds a top-spenders table from raw rows

The page falls back to raw keyword-like rows and sorts them by spend to build
its final table.

## Strengths

- good visual summary for a concept clients often struggle with
- handles missing distribution data gracefully
- combines summary, checks, and keyword-level evidence effectively

## Weaknesses

### Contract depends on ID conventions

Sub-component detection is based on exact check-ID patterns. That is a report
implementation detail leaking into analyzer semantics.

### Raw-row fallback weakens consistency

The page accepts both:

- raw `keywords`
- top-level `qualityScore` rows

That makes the section resilient, but it also means its tables can be driven by
different source contracts from one report to the next.

### Presentation and interpretation are mixed

The page is still deciding which checks "count" as QS components instead of
receiving an already typed breakdown.

## Failure Modes

- check-ID changes break sub-component rendering without obvious errors
- top-spender table can disagree with summary if raw rows and analyzed summary
  are out of sync
- a report may show a QS page that looks complete while still being driven by
  fallback, not canonical analyzer output

## Improvement Targets

### High priority

- have the analyzer emit explicit:
  - account summary
  - distribution
  - component checks
  - top-spender rows
- stop relying on regex / ID parsing in the page

### Medium priority

- isolate chart preparation from DOM rendering
- add fixtures for no-distribution, summary-only, and full-QS scenarios

## Bottom Line

`pages/quality-score.js` is one of the clearer PPC pages, but it still depends
on fallback data shapes and check-ID conventions that should be formalized
upstream.
