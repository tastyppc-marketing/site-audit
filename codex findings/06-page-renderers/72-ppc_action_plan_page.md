# Script Audit: `template/reports/multipage-ppc/pages/action-plan.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/pages/action-plan.js](/root/site-audit/template/reports/multipage-ppc/pages/action-plan.js:1)

## Purpose

`pages/action-plan.js` renders the PPC action-plan page.

It covers:

- recommendations grouped by severity
- negative keywords to add

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- DOM containers for the PPC action-plan page

Primary data dependencies:

- `data.ppcAudit.recommendations`
- `data.ppcAudit.ngramAnalysis.negativeCandidates`

## Outputs

- defines `window.TPPC.pages['action-plan']`
- renders the PPC action-plan page

## How It Works

### 1. Sorts recommendations by priority

Recommendations are sorted descending by `priority`.

### 2. Buckets recommendations by severity

The page reduces recommendation severity into three buckets:

- critical
- high
- medium

Anything not classified as critical or high is treated as medium.

### 3. Renders negative keyword additions

The negative-adds table is built directly from `ngramAnalysis.negativeCandidates`.

## Strengths

- simpler than the SEO action-plan page
- recommendation grouping is easy to understand
- negative-keyword additions are a sensible action-plan artifact

## Weaknesses

### Severity bucketing is lossy

Low, info, unknown, or future custom severities all collapse into the medium
bucket. That may be fine visually, but it hides nuance.

### Duplicates data already used on the search-terms page

Negative candidates appear here and on `search-terms.js`. That is reasonable
from a UX standpoint, but it means the same data contract drives multiple pages
and needs to stay consistent everywhere.

### Still assumes priority and severity semantics are stable

The page is simple, but it is still tightly tied to the analyzer’s current
recommendation schema.

## Failure Modes

- low-severity or info-only actions get presented as medium-priority work
- negative-candidate rows can drift from the search-terms page if one page
  evolves faster than the other

## Improvement Targets

### High priority

- preserve original severity semantics explicitly instead of collapsing them
- define one shared recommendation-card renderer for PPC pages
- keep negative-keyword action items centralized in the analyzer contract

### Medium priority

- if action plans grow, introduce stage / owner / impact metadata upstream

## Bottom Line

`pages/action-plan.js` is one of the cleaner PPC page renderers.

Its main risks are not complexity, but data-contract reuse and the loss of
severity detail during grouping.
