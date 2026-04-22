# Script Audit: `template/reports/multipage-ppc/pages/index.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/pages/index.js](/root/site-audit/template/reports/multipage-ppc/pages/index.js:1)

## Purpose

`pages/index.js` renders the PPC dashboard page.

It is the overview page for:

- account score
- key PPC metrics
- top failed / warning checks
- prioritized recommendations

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- DOM containers for the PPC dashboard

Primary data dependencies:

- `data.ppcAudit.accountScore`
- `data.ppcAudit.wastedSpend.summary`
- `data.ppcAudit.recommendations`
- `data.ppcAudit.structure.checks`
- `data.ppcAudit.qualityScore.checks`
- `data.ppcAudit.wastedSpend.checks`
- `data.ppcAudit.budgetBidding.checks`
- raw `keywords`
- raw `searchTerms`
- legacy `campaignHealth`

## Outputs

- defines `window.TPPC.pages.index`
- renders the PPC overview / score / findings / recommendations sections

## How It Works

### 1. Reads the PPC audit root

The page resolves `data.ppcAudit` when present, otherwise it falls back to the
top-level object.

### 2. Re-derives high-level account metrics

`_deriveMetrics()` attempts to assemble dashboard KPIs from several possible
sources, in this order:

- `wastedSpend.summary`
- raw `keywords`
- raw `searchTerms`
- legacy `campaignHealth`

It derives or backfills:

- total cost
- conversions
- CPA
- ROAS

### 3. Merges checks across multiple PPC categories

`_allChecks()` concatenates checks from:

- structure
- quality score
- wasted spend
- budget / bidding

and uses them to build the dashboard findings list.

### 4. Renders a narrative dashboard

The page outputs:

- score gauge
- account summary card
- key-metric stat cards
- top findings
- top recommendations

## Strengths

- gives the PPC report a meaningful top-level dashboard
- score / findings / recommendations are good entry points for a client-facing
  report
- attempts to survive partial data instead of rendering an empty overview

## Weaknesses

### The page is also a data normalizer

The dashboard is doing late-stage metric reconstruction from raw keywords,
search terms, and legacy campaign metrics. That is useful tactically, but it
means one of the most visible pages is also compensating for upstream contract
drift.

### Mixed-source metrics can change meaning

For example, total cost may come from:

- analyzed summary output
- summed raw keyword costs
- summed raw search-term costs
- legacy campaign metrics

Those are not necessarily identical in scope or time window.

### Dashboard logic is tightly coupled to specific check categories

The findings list assumes the important top-level checks live in four specific
audit buckets. Any future PPC analyzer expansion has to remember to feed this
page explicitly.

## Failure Modes

### Same KPI can mean different things from report to report

If one report derives CPA from raw rows and another reads it from a precomputed
summary, both may render cleanly while representing different scopes.

### Silent fallback hides upstream gaps

The dashboard can look healthy even when upstream analyzers failed to produce a
canonical summary block, because the page fills gaps itself.

## Improvement Targets

### High priority

- Move KPI derivation into the PPC analyzer or generator layer
- Treat the dashboard as a pure renderer of one finalized PPC summary contract
- Surface source provenance separately if fallback logic must remain

### Medium priority

- Add fixture tests for the metric-derivation logic if it stays in the browser
- Separate summary computation from DOM rendering for maintainability

## Bottom Line

`pages/index.js` is an effective client-facing dashboard, but it is doing too
much contract repair for a top-level page renderer.

The page should render finalized PPC summary data, not decide what total cost,
CPA, or ROAS means at runtime.
