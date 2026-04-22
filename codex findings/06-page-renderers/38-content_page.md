# Script Audit: `template/reports/multipage/pages/content.js`

Last updated: 2026-04-18

File: [template/reports/multipage/pages/content.js](/root/site-audit/template/reports/multipage/pages/content.js:1)

## Purpose

`pages/content.js` renders the content quality page of the multipage report.

It covers:

- content overview
- readability
- thin content
- duplicate groups
- keyword cannibalization
- page-structure analysis

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.filters`
- DOM containers for the content page sections

Primary data dependencies:

- `data.contentQuality.summary`
- `data.contentQuality.pages`
- `data.contentQuality.duplicateGroups`
- `data.contentQuality.cannibalization`
- `data.apiErrors` for content-analysis fallback states

## Outputs

- defines `window.TPPC.pages.content`
- renders multiple content-analysis sections into the DOM
- creates a hover popover system for readability rows
- initializes shared table filters after rendering

## How It Works

### 1. Reads and normalizes content-quality input

The script treats `data.contentQuality` as the main payload and then derives
section-specific values from:

- summary stats
- page-level audits
- duplicate groups
- cannibalization records

### 2. Builds multiple tables and card grids

Each section renders a different perspective on content health, often using
its own sorting and threshold logic.

### 3. Adds page-local UI behavior

It creates:

- expandable text lists
- row-level popovers for readability explanations
- filterable tables

### 4. Boots itself once the shared runtime is ready

Like several other page scripts, it uses its own boot polling loop instead of a
single centralized startup contract.

## Strengths

- broad coverage of content-health concerns in one place
- good empty-state handling
- useful operator-friendly sorting for readability, duplicate, and structure
  sections
- exposes content-analysis detail rather than only summary metrics

## Weaknesses

### Heavy renderer with lots of embedded heuristics

This page decides:

- readability severity bands
- thin-content thresholds
- duplicate-group ordering
- cannibalization severity ordering

That means the browser is making interpretation decisions, not just rendering
prepared conclusions.

### Inline event logic inside generated HTML

The expandable text list helper uses inline `onclick` logic generated into HTML.
That works, but it is brittle and harder to test or maintain.

### Popover system is page-specific and imperative

The popover implementation appends a singleton tooltip to the body and binds
mouse events directly. That is fine technically, but it is another local UI
subsystem in an already heavy page file.

### Another example of fallback-driven rendering

This page often hides or empties sections cleanly, which is good for UX, but it
also makes incomplete data look less obviously incomplete.

## Failure Modes

- content-quality payload missing or partially shaped
- page-level fields drifting from expected names
- inline expand/collapse links becoming hard to maintain or style consistently
- multiple re-renders creating duplicate popovers if lifecycle assumptions ever
  change

## Improvement Targets

### High priority

- Move content-analysis thresholds and severity rules into an upstream
  normalization layer
- Replace inline `onclick` expansion with delegated event handling
- Add a visible page-level QA summary when major content sub-sections are
  missing

### Medium priority

- Split the page into smaller section renderers or helper modules
- Reuse shared UI primitives for popovers and expandable lists

## Bottom Line

`pages/content.js` is a capable renderer, but it is also doing too much
interpretation locally.
If content data quality is inconsistent, this page can still render something
useful, but the cost is a thicker, more opinionated browser layer.
