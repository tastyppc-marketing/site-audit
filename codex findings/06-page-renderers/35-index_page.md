# Script Audit: `template/reports/multipage/pages/index.js`

Last updated: 2026-04-17

File: [template/reports/multipage/pages/index.js](/root/site-audit/template/reports/multipage/pages/index.js:1)

## Purpose

`pages/index.js` renders the executive summary page of the multipage report.

It populates:

- hero section
- key stats
- top issues
- site comparison
- quick wins
- next steps

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.boot`
- DOM containers for each summary section
- summary-oriented fields inside `window.AUDIT_DATA`

Primary data dependencies:

- `data.client`
- `data.keyStats`
- `data.topIssues`
- `data.competitorComparison`
- `data.siteComparison`
- `data.competitor`
- `data.quickWins`
- `data.nextSteps`

## Outputs

- defines `window.TPPC.pages.index`
- mutates the executive summary page DOM
- hides sections when upstream data is missing

## How It Works

### 1. Declares the current page

It sets `window.TPPC.currentPage = 'index'`.

### 2. Registers a page renderer object

Its `init()` method calls section-specific renderers in order.

### 3. Renders sections from audit data

Each section either:

- fills DOM containers with generated HTML
- or hides the section entirely if the needed data is absent

### 4. Boots once the shared runtime is ready

It polls for `window.TPPC.boot()` and triggers it after DOM readiness.

## Strengths

- simple page renderer structure
- section-specific methods are easy to review
- missing sections degrade by hiding instead of always hard-failing
- supports both `competitorComparison` and `siteComparison` shapes

## Weaknesses

### Page scripts bootstrap themselves independently

This file uses its own boot-wait loop rather than participating only through a
single centralized startup path.
That works, but it contributes to runtime boot fragmentation.

### Data-contract fallback logic hides upstream inconsistency

The comparison renderer supports multiple shapes:

- multi-competitor `competitorComparison`
- single-competitor `siteComparison`

That is useful pragmatically, but it also shows the data contract is not fully
stabilized.

### Heavy string-built HTML

Most UI is built with concatenated HTML strings, which is manageable here but
still increases maintenance risk.

## Failure Modes

- expected DOM hooks missing from the page template
- upstream data present in unexpected shapes
- summary sections silently hidden, making missing data look intentional

## Improvement Targets

### High priority

- Standardize one summary comparison schema instead of supporting multiple
  shapes indefinitely
- Unify page boot behavior with the shared runtime model
- Add optional visible QA markers when sections are hidden due to missing data

### Medium priority

- Reduce manual HTML string assembly where repeated patterns exist
- Add a page-level validation summary for the most important required fields

## Bottom Line

`pages/index.js` is a pragmatic and readable renderer.
Its main architectural value is that it shows how much of the report system now
depends on tolerant fallback rendering instead of a single stable data contract.
