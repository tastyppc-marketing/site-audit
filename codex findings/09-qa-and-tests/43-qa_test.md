# Script Audit: `template/reports/multipage/qa-test.js`

Last updated: 2026-04-18

File: [template/reports/multipage/qa-test.js](/root/site-audit/template/reports/multipage/qa-test.js:1)

## Purpose

`qa-test.js` is a Playwright-based smoke-test harness for the multipage report
output.

It opens each generated HTML page from `test-output/` using `file://` and runs
basic browser-level checks.

## Inputs

Runtime dependencies:

- Playwright
- generated multipage report files in `template/reports/multipage/test-output`

Target pages:

- `index.html`
- `keywords.html`
- `content.html`
- `technical.html`
- `links.html`
- `competitors.html`
- `local.html`
- `action-plan.html`

## Outputs

- prints test progress to stdout
- exits non-zero if any non-skipped check fails

## How It Works

### 1. Launches a headless Chromium browser

It loads each page directly from the generated output directory over `file://`.

### 2. Captures runtime errors

It listens for:

- `pageerror`
- browser console errors

and filters out some known benign categories.

### 3. Runs a basic smoke suite per page

Checks include:

- no critical JS errors
- top navigation present
- page content container present
- client data appears in the text
- at least one visible section exists
- navigation links exist
- search trigger or modal exists
- charts exist on expected pages
- loading spinner is gone

## Strengths

- useful end-to-end browser smoke test
- explicitly designed for `file://` mode, which matches the report-delivery
  model
- catches high-level rendering failures quickly

## Weaknesses

### Hard-coded client-data expectations

The data-binding check looks for specific client strings such as:

- `Jamie Kelly`
- `Mammoth Lakes`
- `mammothlakesproperties`

That makes the test harness environment-specific rather than reusable across
arbitrary fixtures.

### Error filtering is broad

It suppresses classes of errors that may sometimes be benign, but broad
filtering can also hide real regressions.

### Smoke coverage only

This verifies basic page viability, not correctness of rendered metrics,
filters, or charts.

## Failure Modes

- wrong test fixture content causing false failures
- file-output paths changing
- real regressions being filtered as benign console/network noise

## Improvement Targets

### High priority

- Replace hard-coded client-text checks with fixture-driven assertions
- Separate expected-benign errors from truly ignored errors more precisely
- Add a small number of section-specific assertions for each page

### Medium priority

- Emit a machine-readable test report in JSON
- Add screenshot capture on failure

## Bottom Line

`qa-test.js` is a practical browser smoke suite, but it is tied too closely to
one output fixture.
It is valuable for catching broken pages quickly, not for proving report
correctness comprehensively.
