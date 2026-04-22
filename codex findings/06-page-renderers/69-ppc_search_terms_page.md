# Script Audit: `template/reports/multipage-ppc/pages/search-terms.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/pages/search-terms.js](/root/site-audit/template/reports/multipage-ppc/pages/search-terms.js:1)

## Purpose

`pages/search-terms.js` renders the PPC search-terms page.

It covers:

- n-gram analysis table
- negative-keyword candidate table
- top search-term table

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- DOM containers for the search-terms page

Primary data dependencies:

- `data.ppcAudit.ngramAnalysis.topNgrams`
- `data.ppcAudit.ngramAnalysis.negativeCandidates`
- `data.ppcAudit.ngramAnalysis.searchTerms`
- raw `searchTerms`

## Outputs

- defines `window.TPPC.pages['search-terms']`
- renders the search-terms page
- binds the sort button for n-gram cost sorting

## How It Works

### 1. Stores local page state

The page keeps:

- `_ngramRows`
- `_sortDir`

as module-level state for client-side sorting.

### 2. Renders n-gram analysis

It reads `topNgrams`, sorts them by cost, and lets the user toggle between
high-to-low and low-to-high ordering.

### 3. Renders negative keyword candidates

Negative candidates are displayed directly from the PPC analyzer output when
available.

### 4. Derives top search terms from raw rows

If raw search-term rows exist, the page sorts them by cost and computes CPA
locally for the top-terms table.

## Strengths

- the three sections fit together well conceptually
- n-gram sorting is simple and useful
- negative-candidate rendering is straightforward

## Weaknesses

### Top-terms section depends on raw fallback

The page can render an n-gram summary even when the underlying raw search-term
rows are missing. That means the page is really presenting two different data
contracts side by side.

### Local UI state is page-owned

That is fine for one page, but this report family keeps accumulating tiny
one-off state machines rather than a shared component model.

### Another late-stage metric derivation

CPA is computed in-browser from raw term rows instead of being part of a
canonical analyzed payload.

## Failure Modes

- repeated init calls can double-bind sort behavior
- top-terms table silently disappears when raw rows are absent even if the rest
  of the page looks complete
- search-term and n-gram sections may reflect different scopes / filters

## Improvement Targets

### High priority

- make the analyzer emit one canonical search-terms payload for:
  - top n-grams
  - negative candidates
  - top search terms
- keep the page focused on rendering and lightweight client-side sorting

### Medium priority

- isolate sorting and table rendering into reusable page helpers
- add fixtures for:
  - n-grams only
  - raw search terms only
  - full combined output

## Bottom Line

`pages/search-terms.js` is relatively clean, but it still shows the larger PPC
pattern: analyzer output and raw fallback data are both treated as first-class
inputs to the renderer.
