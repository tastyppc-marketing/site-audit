# Script Audit: `template/reports/multipage-ppc/shared/search.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/shared/search.js](/root/site-audit/template/reports/multipage-ppc/shared/search.js:1)

## Purpose

`shared/search.js` implements the PPC report’s `Ctrl+K` search modal.

It:

- creates the modal
- binds keyboard shortcuts
- filters `window.TPPC.searchIndex`
- groups results by page
- navigates to selected result anchors

## Inputs

Runtime dependencies:

- `window.TPPC.searchIndex`
- `window.TPPC.utils.esc`
- DOM and keyboard events

## Outputs

- `window.TPPC.search.init()`
- `window.TPPC.search.openModal()`
- `window.TPPC.search.closeModal()`

## How It Works

### 1. Creates a modal on demand

The modal DOM is injected once and then reused.

### 2. Binds `Ctrl+K` / `Cmd+K`

The file listens globally for the shortcut and opens the modal.

### 3. Performs client-side substring matching

For each search query, it scans:

- entry title
- entry snippet
- entry terms

and keeps the first 20 matches.

### 4. Supports keyboard navigation

Arrow keys move focus, `Enter` opens the highlighted result, and `Escape`
closes the modal.

## Strengths

- simple and fast enough for typical report sizes
- easy to reason about
- grouped results make cross-page report search more useful

## Weaknesses

### Very simple matching

Search is plain substring matching with no ranking model beyond original index
order. That is fine for smaller reports, but not especially smart.

### Another duplicated runtime file

This is another PPC copy of a generic runtime behavior that should likely be
shared with the SEO report.

### Accessibility is only partial

The modal supports keyboard movement, but the current implementation does not
look like a full focus-trap or screen-reader-optimized command palette.

## Failure Modes

- large search indexes can degrade UX because matching is linear and unscored
- poor index quality upstream leads directly to poor search quality here
- divergence between SEO and PPC search behavior grows over time

## Improvement Targets

### High priority

- Share one command-palette runtime across SEO and PPC
- Add lightweight result scoring rather than pure first-match ordering
- Make modal accessibility more explicit:
  - focus trap
  - active descendant semantics
  - better empty/loading states

### Medium priority

- consider indexing structured metadata like severity, category, and metric
  type more intentionally

## Bottom Line

`shared/search.js` is clean and usable, but it is another case where generic
runtime functionality has been duplicated instead of centralized.
