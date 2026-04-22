# Script Audit: `template/reports/multipage/shared/search.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/search.js](/root/site-audit/template/reports/multipage/shared/search.js:1)

## Purpose

`search.js` adds a client-side Ctrl+K search modal to the multipage report.

It searches a prebuilt in-memory index and links users to matching report pages
and sections.

## Inputs

Runtime dependencies:

- `window.TPPC.searchIndex`
- `window.TPPC.utils.esc`
- DOM `document.body`

## Outputs

- injects a search modal into the page
- binds global keyboard shortcuts
- filters and renders search results client-side

## How It Works

### 1. Creates the modal UI on init

It builds and appends the full modal DOM structure if it does not already
exist.

### 2. Binds global keyboard access

Ctrl+K or Cmd+K opens the search UI.

### 3. Filters the in-memory search index

For queries of at least two characters, it matches against:

- title
- snippet
- extra terms

and returns up to 20 results.

### 4. Groups results by page

Results are grouped visually by target page, then linked to section anchors.

## Strengths

- practical usability improvement for large multipage reports
- fully client-side and fast for modest index sizes
- includes keyboard navigation and accessible dialog attributes

## Weaknesses

### Entirely dependent on the quality of `SEARCH_INDEX`

If the generated search index is weak, incomplete, or stale, the modal will
feel broken even though this script is behaving correctly.

### No fuzzy ranking or scoring

Search is simple substring matching.
That is easy to understand, but not especially smart.

### Modal lifecycle is global and singleton-based

That is fine for this app shape, but it makes the script tightly tied to the
single-report runtime model.

### Minimum diagnostics

If the search index is empty, the modal still works technically, but the user
gets little explanation about why search quality is poor.

## Failure Modes

- missing or empty search index
- malformed entries lacking page or section fields
- broken anchor links landing users in the wrong place

## Improvement Targets

### High priority

- Document and validate the `SEARCH_INDEX` contract during report generation
- Add better ranking or weighted matching
- Add empty-state guidance when no search index is present

### Medium priority

- Highlight matched terms in the UI
- Support recent searches or page-local search shortcuts

### Low priority

- Add analytics hooks for which report sections users search most

## Bottom Line

`search.js` is a solid convenience layer.
Its effectiveness depends far more on upstream search-index generation than on
the modal logic itself.
