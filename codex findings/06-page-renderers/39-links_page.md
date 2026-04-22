# Script Audit: `template/reports/multipage/pages/links.js`

Last updated: 2026-04-18

File: [template/reports/multipage/pages/links.js](/root/site-audit/template/reports/multipage/pages/links.js:1)

## Purpose

`pages/links.js` renders the internal-linking page of the multipage report.

It covers:

- link overview
- orphan pages
- hub-and-spoke clusters
- link depth

The file is named "links", but in the current implementation it is focused on
internal linking rather than backlink analysis.

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.filters`
- `window.TPPC.charts`
- DOM containers for the links page sections

Primary data dependencies:

- `data.internalLinking`
- `data.internalLinking.summary`
- `data.internalLinking.orphans`
- `data.internalLinking.hubClusters`
- `data.internalLinking.depthResult`
- `data.apiErrors` for link-graph fallback messaging

## Outputs

- defines `window.TPPC.pages.links`
- renders several cards, tables, and charts
- manages page-local chart lifecycle through `_chartInstances`

## How It Works

### 1. Pulls multiple link-analysis structures from `internalLinking`

It extracts:

- sitewide summary metrics
- orphan-page rows
- hub-cluster structures
- click-depth results

### 2. Normalizes multiple naming variations

Helper functions accept alternative field names such as:

- camelCase
- snake_case

throughout the internal-linking payload.

### 3. Renders visual and tabular summaries

The page includes:

- stat cards
- detailed issue/recommendation cards
- filterable orphan tables
- a hub/spoke bar chart
- a depth distribution chart

### 4. Tracks and destroys chart instances

Unlike some simpler page renderers, this one explicitly manages chart cleanup.

## Strengths

- useful normalization of snake_case and camelCase variants
- chart lifecycle handling is cleaner than in some other page scripts
- empty states are actionable rather than generic
- the page surfaces internal-linking structure, not just counts

## Weaknesses

### The file name now understates what it does

The report architecture doc suggested this page might also cover backlinks, but
the current renderer is really an internal-linking page.
That mismatch is worth documenting.

### More in-browser normalization

Like other pages, it accepts multiple possible source shapes instead of relying
on one canonical pre-normalized contract.

### DOM/UI logic still mixed with data interpretation

This file handles:

- data-shape normalization
- severity logic
- copy defaults
- chart rendering

all in one place.

## Failure Modes

- internal-linking payload missing or inconsistently shaped
- architecture assumptions drifting between documentation and implementation
- chart rendering failing silently if required chart helpers are absent

## Improvement Targets

### High priority

- Decide whether this page is strictly internal linking or should also include
  backlinks, then align naming and docs
- Move field-name normalization upstream
- Add a visible note when the page is rendering fallback-derived values rather
  than canonical normalized data

### Medium priority

- Split chart prep and data extraction into helper modules
- Add test fixtures for multiple internal-linking payload variants

## Bottom Line

`pages/links.js` is one of the better structured page renderers, especially in
its chart cleanup and practical empty states.
Its main issue is that it still absorbs normalization concerns that should
eventually live upstream.
