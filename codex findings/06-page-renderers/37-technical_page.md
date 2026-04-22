# Script Audit: `template/reports/multipage/pages/technical.js`

Last updated: 2026-04-17

File: [template/reports/multipage/pages/technical.js](/root/site-audit/template/reports/multipage/pages/technical.js:1)

## Purpose

`pages/technical.js` renders the technical SEO and performance page of the
multipage report.

It appears to cover:

- Core Web Vitals
- PageSpeed / Lighthouse results
- schema markup coverage
- meta tag analysis
- crawl / status issues
- site structure summaries

## Inputs

Runtime dependencies:

- `window.TPPC.utils`
- `window.TPPC.charts`
- collapsible UI conventions
- multiple technical data sections inside `window.AUDIT_DATA`

Primary data dependencies include various technical audit payloads such as:

- Core Web Vitals
- Lighthouse / PageSpeed results
- per-page audits
- schema summaries
- meta summaries
- crawl issue collections

## Outputs

- defines `window.TPPC.pages.technical`
- normalizes several technical data shapes in-browser
- renders technical diagnostics into the page DOM

## How It Works

### 1. Defines many normalization helpers locally

This page contains utility logic for:

- numeric coercion
- score normalization
- text normalization
- duplicate-group collection
- schema summary derivation
- meta summary derivation

### 2. Derives summaries from raw audit details

Where summary structures are missing, it attempts to compute them from page
audit arrays.

### 3. Renders technical sections with badges and cards

It uses helper functions to produce status badges, score pills, empty states,
and collapsible content.

## Strengths

- robust handling of varied technical data
- useful defensive derivation when upstream summaries are incomplete
- more resilient than a naive renderer that only accepts one exact shape

## Weaknesses

### This page is doing too much normalization

Like the keyword page, this file is clearly more than a renderer.
It is also computing and repairing technical summaries in the browser.

### Large and complex

This renderer is much heavier than a typical page view layer, which increases
maintenance cost and makes bugs harder to isolate.

### Hidden business logic in the browser

When schema or meta summaries are derived here, the browser output can diverge
from other report outputs that read the raw data differently.

## Failure Modes

- technical source data changes shape and local normalization falls behind
- different outputs disagree because browser-side derived summaries are not
  reflected elsewhere
- page becomes difficult to test because rendering and normalization are tightly
  interwoven

## Improvement Targets

### High priority

- Move technical summary derivation into a shared normalization phase before
  report generation
- Split this page into smaller section renderers or helper modules
- Define canonical technical summary structures used across all outputs

### Medium priority

- Add fixtures for partial technical payloads and edge cases
- Surface when a section is derived versus sourced directly

## Bottom Line

`pages/technical.js` is powerful, but it confirms a recurring architecture
pattern in this repo: page renderers are compensating for incomplete upstream
normalization.
That keeps reports working, but it also makes the page layer harder to trust as
a pure presentation layer.
