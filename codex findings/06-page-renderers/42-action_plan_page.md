# Script Audit: `template/reports/multipage/pages/action-plan.js`

Last updated: 2026-04-18

File: [template/reports/multipage/pages/action-plan.js](/root/site-audit/template/reports/multipage/pages/action-plan.js:1)

## Purpose

`pages/action-plan.js` renders the action-plan page of the multipage report.

It covers:

- prioritized action-plan tabs
- content calendar
- strategy pillars
- medium-term roadmap
- long-term strategy
- advantages
- deliverables

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.filters`
- DOM containers for the action-plan page

Primary data dependencies:

- `data.actionPlan`
- `data.quickWins`
- `data.contentCalendar`
- `data.pillars`
- `data.mediumTermRoadmap`
- `data.longTermColumns`
- `data.advantages`
- `data.deliverables`
- `data.keyPagesCreated`
- `data.blogPostsCreated`

## Outputs

- defines `window.TPPC.pages['action-plan']`
- renders the strategy/action-plan page
- binds accessible tab behavior for plan stages
- renumbers visible sections dynamically

## How It Works

### 1. Resolves the action-plan data

It combines:

- `data.actionPlan.quickWins`
- top-level `data.quickWins`

to decide what should appear in the tabbed action-plan interface.

### 2. Renders tabbed execution phases

The tab system supports:

- quick wins
- short term
- medium term
- long term

with keyboard navigation and default-tab selection based on the first populated
group.

### 3. Renders strategy and deliverable sections

Additional sections are conditionally shown or hidden based on available data.

### 4. Renumbers visible sections

After hiding empty sections, it recalculates the visible section numbers so the
page remains visually coherent.

## Strengths

- one of the clearer page renderers structurally
- conditional section hiding is sensible here
- tab behavior includes keyboard accessibility
- renumbering visible sections is a thoughtful UX detail

## Weaknesses

### Still dependent on multiple source locations

The quick-win logic falls back between top-level and nested action-plan data.
That is practical, but it continues the repo-wide normalization-through-fallback
pattern.

### Deliverables filter config looks suspicious

The deliverables table declares `data-filters` columns that reference "Impact"
and "Effort", but the actual table columns are:

- Deliverable
- Scope
- Score
- Status

That suggests the filter metadata may be stale or incorrect.

### Mostly presentation, but still compensating for contract drift

This page is lighter than the keyword or technical pages, but it still absorbs
data-shape inconsistency rather than relying on one normalized contract.

## Failure Modes

- stale filter config causing confusing or ineffective deliverable filters
- hidden empty sections masking missing data instead of surfacing it
- tabs rendering but some plan phases being sourced from mixed contracts

## Improvement Targets

### High priority

- Fix or remove the stale deliverables filter metadata
- Standardize the action-plan contract so quick wins do not need dual-source
  fallback logic
- Add a page-level QA note when major strategy sections are absent

### Medium priority

- Keep this page as close to a pure renderer as possible by pushing more data
  shaping upstream

## Bottom Line

`pages/action-plan.js` is one of the more maintainable renderers in the
multipage system.
Its main issues are stale configuration and the same cross-cutting data-contract
drift seen throughout the rest of the report layer.
