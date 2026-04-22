# Script Audit: `template/scripts/generate-spreadsheet.js`

Last updated: 2026-04-17

File: [template/scripts/generate-spreadsheet.js](/root/site-audit/template/scripts/generate-spreadsheet.js:1)

## Purpose

`generate-spreadsheet.js` is a terminal report-export script.
It reads `seo/audit-data.json` and renders a multi-sheet Excel workbook at:

- `seo/reports/SEO-Audit-GamePlan.xlsx`

This script does not gather or normalize data.
It assumes the audit JSON already matches the expected presentation contract.

## Inputs

### CLI inputs

- optional `--data path/to/audit-data.json`

### File inputs

- `seo/audit-data.json` by default

## Outputs

- writes `seo/reports/SEO-Audit-GamePlan.xlsx`

Generated sheets:

- `Executive Summary`
- `Keyword Research`
- `Competitor Comparison`
- `Action Plan`
- `Content Calendar`
- `Deliverables`

## How It Works

### 1. Loads the audit JSON

It resolves the JSON path from `--data` or falls back to the standard client
audit file.

If the file is missing, it exits immediately.

### 2. Builds each worksheet as raw arrays

Each sheet is defined as an `aoa` structure, meaning a plain array of row
arrays.

There is no intermediate view model or schema validation layer.

### 3. Writes workbook tabs with fixed column widths

A helper called `addSheet()` turns each array into an XLSX worksheet and
appends it to the workbook.

### 4. Exports directly to the reports folder

The workbook is written in one step to the standard report filename.

## Upstream Dependencies

This script depends heavily on upstream scripts having already populated the
right fields.

Primary dependencies include:

- `template/scripts/populate-audit-data.js`
- `template/scripts/generate-multipage-report.js`
- any manual editing or AI population that fills `audit-data.json`

In practice, this exporter is downstream of the entire audit pipeline.

## Data Contract Assumptions

The script assumes all of the following are present and structurally valid:

- `d.client`
- `d.topIssues`
- `d.siteComparison`
- `d.keywords`
- `d.competitor.primary`
- `d.competitor.primaryLabel`
- `d.competitor.all`
- `d.competitorComparison`
- `d.actionPlan.quickWins`
- `d.actionPlan.shortTerm`
- `d.actionPlan.mediumTerm`
- `d.actionPlan.longTerm`
- `d.contentCalendar.month1/month2/month3`
- `d.deliverables`
- `d.keyPagesCreated`
- `d.blogPostsCreated`

There are effectively no guards around those assumptions.

## Strengths

- very easy to understand and trace
- produces a useful implementation handoff artifact without needing a browser
- sheet layout is explicit, so editing presentation order is straightforward
- output is deterministic if the input JSON is stable

## Weaknesses

### Extremely brittle direct property access

The script reads deeply nested properties everywhere without defaults.
If one required field is absent, malformed, or renamed, the whole export can
fail.

### No schema or validation step

There is no preflight check saying which required sections are missing.
That means failures happen at render time instead of being surfaced earlier.

### Competitor column mismatch risk

The header row is built from `d.competitor.all`, but each data row only uses:

- `row.comp1`
- `row.comp2`
- `row.gap`

So the workbook implies dynamic competitor support while the row mapping is
still effectively hard-coded for two competitors.

### Presentation logic is mixed with data access

The script combines:

- data extraction
- naming
- ordering
- spreadsheet layout

This makes it harder to test or reuse the export contract independently.

### Output directory assumptions

It writes directly into `seo/reports`, but does not explicitly ensure the
directory exists first.

## Failure Modes

- missing `audit-data.json`
- missing nested fields causing runtime exceptions
- inconsistent competitor structures between header and row data
- partially populated data producing misleading spreadsheets rather than obvious
  hard failures

## Improvement Targets

### High priority

- Add a validation pass that lists missing required fields before export
- Introduce safe defaults for optional sections so partial audits can still
  export
- Align competitor table generation so headers and row values follow the same
  structure

### Medium priority

- Separate workbook view-model creation from XLSX writing
- Emit a structured validation report alongside the export
- Ensure `seo/reports` exists before writing

### Low priority

- Add lightweight formatting such as frozen headers, filters, and bold section
  styling

## Bottom Line

`generate-spreadsheet.js` is a thin exporter, not a business-logic layer.
That is good for clarity, but right now it is too trusting of upstream data.
If data quality is one of the repo's active problems, this script will expose
those problems late and sometimes unclearly.
