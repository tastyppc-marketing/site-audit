# Script Audit: `template/reports/multipage-ppc/pages/budget.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/pages/budget.js](/root/site-audit/template/reports/multipage-ppc/pages/budget.js:1)

## Purpose

`pages/budget.js` renders the PPC budget and bidding page.

It covers:

- bidding-strategy distribution
- smart vs manual bidding summary
- impression-share section
- budget / pacing checks

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.charts`
- DOM containers for the budget page

Primary data dependencies:

- `data.ppcAudit.budgetBidding.summary`
- `data.ppcAudit.budgetBidding.checks`
- `data.ppcAudit.budgetBidding.campaigns`
- raw `campaigns`

## Outputs

- defines `window.TPPC.pages.budget`
- renders the budget / bidding page

## How It Works

### 1. Renders bidding strategy distribution

The page reads strategy counts from `budgetBidding.summary.biddingStrategies`
and renders a doughnut chart plus summary cards.

### 2. Renders impression-share analysis

If campaign rows contain search-impression-share metrics, the page renders a
campaign table and summary cards.

### 3. Falls back to a single check card when campaign rows are missing

When campaign-level rows are absent, it tries to use a single analyzer check as
the impression-share explanation.

### 4. Renders pacing and bidding checks

The page shows smart/manual counts and the analyzer-emitted budget checks.

## Strengths

- covers a useful PPC story with relatively compact code
- chart plus table combination works well here
- empty states are clearer than many report files in the repo

## Weaknesses

### Identifier drift in impression-share logic

The impression-share section looks for check ID `QS-09`, even though this is the
budget / bidding page and the rest of the data comes from `budgetBidding`.

That suggests cross-category ID drift or copy-paste coupling.

### Campaign-row fallback remains important

The page can only fully render impression-share analysis when raw campaign rows
are present. Otherwise it collapses to a much thinner experience.

### Strategy semantics are hardcoded

The page assumes summary fields like `smartBiddingCount` and `manualCount`
already reflect the right policy decisions. If those definitions change, the
page has no explicit schema protection.

## Failure Modes

- impression-share messaging can break if the analyzer renames or moves `QS-09`
- chart and summary sections can disagree if summary counts and raw campaigns
  are out of sync
- different reports can have very different page completeness depending on
  whether raw campaign rows survive into final data

## Improvement Targets

### High priority

- replace check-ID lookups like `QS-09` with explicit typed output fields
- standardize one canonical budget / bidding payload for:
  - strategy distribution
  - impression-share summary
  - campaign rows
  - pacing checks

### Medium priority

- share chart and summary composition patterns with the rest of the PPC pages

## Bottom Line

`pages/budget.js` is relatively maintainable, but it still shows schema and ID
drift. The `QS-09` dependency is the clearest sign that analyzer/page contracts
are not cleanly separated yet.
