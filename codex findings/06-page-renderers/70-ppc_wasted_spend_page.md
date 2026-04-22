# Script Audit: `template/reports/multipage-ppc/pages/wasted-spend.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/pages/wasted-spend.js](/root/site-audit/template/reports/multipage-ppc/pages/wasted-spend.js:1)

## Purpose

`pages/wasted-spend.js` renders the PPC wasted-spend page.

It covers:

- wasted-spend summary cards
- wasted-spend checks
- zero-conversion keywords
- overspending keywords
- broad-match issues

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- DOM containers for the wasted-spend page

Primary data dependencies:

- `data.ppcAudit.wastedSpend.summary`
- `data.ppcAudit.wastedSpend.checks`
- `data.ppcAudit.wastedSpend.wastedItems`
- `data.ppcAudit.wastedSpend.overspendingKeywords`
- `data.ppcAudit.wastedSpend.broadMatchIssues`
- `data.ppcAudit.wastedSpend.keywords`
- raw `keywords`
- raw `campaigns`

## Outputs

- defines `window.TPPC.pages['wasted-spend']`
- renders the wasted-spend page and supporting tables

## How It Works

### 1. Renders summary cards and checks

The summary section uses `wastedSpend.summary` and `wastedSpend.checks`.

### 2. Derives zero-conversion rows when needed

If the analyzer did not provide explicit zero-conversion items, the page scans
keyword rows and uses a hardcoded threshold of 100 clicks with zero conversions.

### 3. Derives overspending rows when needed

If `overspendingKeywords` is absent, the page calculates overspending from raw
keyword CPA versus `targetCpa`, using a `3x target CPA` heuristic.

### 4. Derives broad-match issues when needed

If no explicit broad-match issue list exists, it combines raw keywords and
campaign bidding strategies to flag broad-match terms that are not using a
recognized smart-bidding strategy.

## Strengths

- good practical section coverage for PPC waste analysis
- survives partial data better than a strict renderer would
- local heuristics are understandable and domain-reasonable

## Weaknesses

### This page is doing real analysis

The fallback logic is not trivial formatting. It is real business logic:

- threshold-based zero-conversion detection
- CPA-based overspending detection
- strategy-aware broad-match flagging

That belongs upstream in the analyzer layer.

### Percent formatting is contract-sensitive

This page’s `_percent()` helper does not normalize fractions the way some other
PPC pages do. If `wastedPct` is stored as `0.15` instead of `15`, this page
would display `0.2%` instead of `15.0%`.

That is a concrete data-contract risk.

### Hardcoded heuristics can drift from the analyzer

The browser fallback may not match the analyzer’s intended logic if thresholds
or strategy rules change.

## Failure Modes

- zero-conversion thresholds differ between analyzer and page fallback
- overspending logic differs between reports depending on available data
- `wastedPct` can be misrendered if percent representation is inconsistent
- broad-match logic depends on a hardcoded smart-bidding map in the browser

## Improvement Targets

### High priority

- move zero-conversion / overspending / broad-match derivation fully into the
  PPC analyzer
- standardize percent representation in the PPC contract
- keep the page strictly presentational once the analyzer payload exists

### Medium priority

- add parity tests between analyzer output and page fallback behavior while the
  fallback still exists

## Bottom Line

`pages/wasted-spend.js` is useful, but it is one of the clearest examples of
the PPC page layer performing analyzer work.

If the PPC data is currently wrong, this page is a prime place to inspect,
because it can materially change the meaning of the report from the browser.
