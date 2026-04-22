# Script Audit: `template/reports/generate-report.js`

Last updated: 2026-04-18

File: [template/reports/generate-report.js](/root/site-audit/template/reports/generate-report.js:1)

## Purpose

`generate-report.js` is the legacy single-page HTML report generator for the
template layer.

It:

- reads `audit-data.json`
- injects the payload into `seo-audit-report.html`
- inlines CSS from `report-styles.css`
- writes a self-contained HTML report
- optionally renders that report to PDF with Playwright

This script is no longer the center of the newer multi-page architecture, but
it is still active through `template/package.json` and remains part of the repo's
report-generation surface.

## Inputs

Primary dependencies:

- `fs`
- `path`
- optional `playwright`

Primary runtime inputs:

- `--data`
- `--output`
- `--pdf`
- `seo-audit-report.html`
- `report-styles.css`
- `audit-data.json`

## Outputs

This script writes:

- a self-contained HTML report
- an optional PDF version of that report

## How It Works

### 1. Parses a minimal CLI

The script manually parses flags from `process.argv` with `getArg(...)`.

### 2. Loads the data and template files

It reads the audit JSON, the HTML template, and the CSS file.

### 3. Injects the data into the page

It builds an inline script:

- `window.AUDIT_DATA = ...`

and inserts it immediately after the `<head>` tag.

### 4. Inlines the CSS

It replaces the external stylesheet link with a `<style>` block so the output
HTML is self-contained.

### 5. Writes HTML and optionally renders PDF

If `--pdf` is set, it launches Playwright, opens the generated HTML file,
expands collapsibles/tabs, and prints the page to PDF.

## Strengths

- easy to run and understand
- produces a portable self-contained HTML artifact
- PDF output is useful for client deliverables

## Weaknesses

### Data injection is not safely escaped for inline-script context

The script injects raw `JSON.stringify(auditData)` directly into a `<script>`
tag.

If the data contains `</script>` or certain problematic Unicode separators, the
HTML can break or the payload can terminate the script block early.

That is a real robustness issue in a report generator that embeds arbitrary
client/content data.

### HTML mutation is brittle

The script assumes:

- there is exactly one `<head>` tag written in a matching format
- the stylesheet link matches a specific regex

If the template changes structure, injection and CSS inlining can silently stop
working.

### There is no schema validation for the input JSON

The script trusts `audit-data.json` entirely. If the data shape drifts, failure
shows up later inside the template's client-side code rather than at generation
time.

### The PDF path is tightly coupled to the legacy DOM contract

PDF rendering assumes the template contains:

- `#report`
- `.collapsible-header`
- `.tab-panel`

That makes the generator highly coupled to one specific report implementation.

### Browser cleanup is not guaranteed on mid-function failure

The browser is closed on the happy path, but there is no `finally` block inside
`renderPDF()`.

## Failure Modes

- embedded data can break the inline script block
- template markup changes can break data/CSS injection
- report JSON contract drift fails late and opaquely
- PDF generation can fail because the expected DOM contract is missing

## Improvement Targets

### High priority

- escape serialized JSON safely for inline-script embedding
- validate the input data shape before generating the report
- make HTML/CSS injection more deliberate than simple string replacement

### Medium priority

- add safer browser cleanup in the PDF path
- decide whether this legacy path should remain first-class or be explicitly
  deprecated in favor of the multi-page generator

## Bottom Line

`generate-report.js` is functional, but it is a fragile legacy path.

If the repo still relies on this generator, the unsafe inline JSON injection is
the most important issue in the file.
