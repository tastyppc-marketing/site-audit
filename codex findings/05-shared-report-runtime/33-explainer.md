# Script Audit: `template/reports/multipage/shared/explainer.js`

Last updated: 2026-04-17

File: [template/reports/multipage/shared/explainer.js](/root/site-audit/template/reports/multipage/shared/explainer.js:1)

## Purpose

`explainer.js` powers the floating "What does this mean?" widget in the
multipage report.

It provides plain-English explanations for report sections and updates the
widget as the user scrolls.

## Inputs

Runtime dependencies:

- report section IDs such as `section-hero`, `section-rankings`, etc.
- the live document body
- `IntersectionObserver`

## Outputs

- injects the floating explainer widget into the DOM
- exposes `window.TPPC.explainer`
- updates widget content based on visible sections

## How It Works

### 1. Stores a large hard-coded explanation map

The file defines a dictionary of section IDs to:

- title
- explanation
- optional tip

### 2. Creates the floating widget

On init, it appends the explainer card to the page if it does not already
exist.

### 3. Tracks visible sections

Using `IntersectionObserver` and a throttled scroll listener, it picks the
section nearest the top of the viewport and updates the explainer content.

### 4. Supports runtime extension

Pages can register more explanations through `registerExplanations()`.

## Strengths

- improves report readability for non-technical clients
- explanation content is centralized
- runtime extension hook is a useful escape hatch for page-specific sections

## Weaknesses

### Very large content blob inside a runtime script

This file mixes UI logic with a large corpus of explanatory copy.
That increases maintenance cost and makes content changes require code changes.

### Strong dependence on section IDs

If section IDs change in page templates or renderers, the widget can silently
lose contextual explanations.

### Another hard-coded knowledge layer

This is effectively embedded product documentation inside the runtime.
That is convenient, but it adds one more place where the report structure is
defined manually.

## Failure Modes

- new or renamed sections lack matching explanations
- widget content falls out of sync with actual section intent
- scrollspy picks a nearby section that is not the one the user considers
  primary

## Improvement Targets

### High priority

- Move explanation content into a dedicated manifest or content file
- Validate that all configured page sections have explanations where required
- Decide whether explanations should be generated from the same metadata as nav
  sections

### Medium priority

- Add per-page control over whether the widget appears
- Improve synchronization with the nav scrollspy so both systems share one
  active-section source of truth

### Low priority

- Add analytics or QA tools for which sections lack useful explanations

## Bottom Line

`explainer.js` is valuable for usability, but it is another sign that the
report runtime contains a lot of hard-coded information architecture and copy.
If the report structure keeps evolving, this file will become costly to keep in
sync unless the metadata is centralized.
