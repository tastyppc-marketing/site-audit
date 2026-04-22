# Script Audit: `template/reports/multipage-ppc/pages/structure.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/pages/structure.js](/root/site-audit/template/reports/multipage-ppc/pages/structure.js:1)

## Purpose

`pages/structure.js` renders the PPC campaign-structure page.

It covers:

- campaign summary cards
- campaign table
- ad-group theming checks
- largest ad groups
- duplicate keyword detection

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- DOM containers for the structure page

Primary data dependencies:

- `data.ppcAudit.structure.summary`
- `data.ppcAudit.structure.checks`
- `data.ppcAudit.structure.campaigns`
- `data.ppcAudit.structure.adGroups`
- `data.ppcAudit.structure.keywords`
- raw `campaigns`
- raw `adGroups`
- raw `keywords`

## Outputs

- defines `window.TPPC.pages.structure`
- renders the PPC structure page and its tables/cards

## How It Works

### 1. Chooses between analyzed and raw structure data

For campaigns, ad groups, and keywords, the page prefers `ppcAudit.structure.*`
arrays but falls back to raw top-level arrays if the analyzed ones are missing.

### 2. Computes duplicate-keyword groups in-browser

`_buildDuplicateKeywords()` groups keywords by:

- normalized keyword text
- match type

and then identifies duplicates across ad groups.

### 3. Computes ad-group keyword counts in-browser

`_buildAdGroupCounts()` merges ad-group metadata and keyword rows to estimate
how large each ad group is.

### 4. Renders structure checks and supporting tables

The page combines analyzer checks with locally derived tables to tell the
campaign-structure story.

## Strengths

- useful structure-focused presentation
- duplicate-keyword detection is practical
- oversized ad-group view helps explain why structure matters

## Weaknesses

### More late-stage normalization

This page is not only rendering `ppcAudit.structure`; it is rebuilding structure
signals from raw keywords and ad groups when needed.

### Derived counts can disagree with summary cards

If `structure.summary` comes from one source and the raw arrays come from
another or are incomplete, the page can show inconsistent numbers across its own
sections.

### Check filtering is ID-coupled

The theming section selects checks by explicit ID conventions like `ST-*` and
`QS-08`. That is brittle and couples page logic to analyzer naming.

## Failure Modes

- duplicate-keyword results change depending on whether analyzed or raw rows are
  present
- ad-group counts can be wrong if raw arrays are partial
- summary totals and table totals can drift apart silently

## Improvement Targets

### High priority

- move duplicate-keyword and oversized-group calculations into the analyzer
- deliver one canonical `structure` payload to the report
- replace page-side ID filtering with explicit typed sections in analyzer output

### Medium priority

- add fixtures covering:
  - analyzer-only data
  - raw-data fallback
  - mixed / partial structures

## Bottom Line

`pages/structure.js` is useful, but it is still part renderer and part
structure-analysis fallback layer.

The underlying calculations belong upstream so the page can become predictable
and testable.
