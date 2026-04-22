# Script Audit: `template/reports/generate-report.js`

Last updated: 2026-04-17

File: [template/reports/generate-report.js](/root/site-audit/template/reports/generate-report.js:1)

## Purpose

`generate-report.js` is a separate HTML report generator that predates or sits
alongside the multipage report system.

It reads `audit-data.json`, injects the JSON into a single HTML template as
`window.AUDIT_DATA`, inlines CSS, and optionally renders a PDF via Playwright.

This means the repo has at least two final SEO report delivery paths:

- the multipage report system
- this self-contained single-file HTML report system

## Inputs

### CLI inputs

- optional `--data`
- optional `--output`
- optional `--pdf`

### File inputs

- audit JSON
- `template/reports/seo-audit-report.html`
- `template/reports/report-styles.css`

## Outputs

- writes a self-contained HTML file
- optionally writes a PDF

Output filenames are derived from client identity plus the current date.

## How It Works

### 1. Parses CLI args

It resolves the data file, output directory, and optional PDF mode.

### 2. Reads the data and template files

It loads the audit JSON, HTML template, and optional stylesheet.

### 3. Injects runtime data into the HTML

It inserts:

- `<script>window.AUDIT_DATA = ...</script>`

directly into the `<head>`.

### 4. Inlines CSS for a self-contained artifact

It replaces the external stylesheet link with an inline `<style>` block.

### 5. Optionally renders a PDF

If `--pdf` is present, it uses Playwright to open the generated local HTML,
wait for the report to render, expand UI elements, and print to PDF.

## Strengths

- produces a portable self-contained HTML artifact
- optional PDF generation is useful for client delivery
- output directory creation is handled correctly
- clearly separates template HTML from generation logic

## Weaknesses

### Parallel report architecture

This file confirms the repo has a second SEO reporting path outside the
multipage report system.
That increases maintenance cost and makes it unclear which path is canonical.

### Blind data injection

It injects raw JSON into the page without validating whether the template
actually supports the provided shape.

### PDF render assumptions

The Playwright step assumes:

- the generated HTML uses specific DOM selectors
- the report reveals itself by removing `.hidden`
- collapsibles and tab panels can be opened generically

Those assumptions make the PDF path tightly coupled to the template runtime.

### Runtime data embedded directly in HTML

This makes the output self-contained, which is convenient, but it can create
very large HTML files and makes debugging data issues harder if the payload is
huge.

## Failure Modes

- template file missing
- audit JSON incomplete for the HTML template's expectations
- Playwright not installed when `--pdf` is requested
- PDF render timing issues if charts or UI state load slower than expected

## Improvement Targets

### High priority

- Decide whether this generator or the multipage report system is the canonical
  SEO delivery path
- Add schema validation before injecting data into the HTML
- Document the DOM contract required for PDF rendering

### Medium priority

- Externalize PDF-specific open-all logic so template changes do not silently
  break printing
- Add a validation summary for missing sections before output generation

### Low priority

- Add report metadata and generation manifest files for QA

## Bottom Line

`generate-report.js` is not just another output script.
It is evidence of architectural duplication in the final report layer.
If the team is trying to stabilize data quality and rendering behavior, the
first question is whether both HTML report systems should continue to exist.
