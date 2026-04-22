# Script Audit: `template/scripts/generate-ppc-spreadsheet.js`

Last updated: 2026-04-17

File: [template/scripts/generate-ppc-spreadsheet.js](/root/site-audit/template/scripts/generate-ppc-spreadsheet.js:1)

## Purpose

`generate-ppc-spreadsheet.js` exports `ppc/ppc-data.json` into a multi-sheet
Excel workbook:

- `ppc/reports/PPC-Audit-GamePlan.xlsx`

It is the PPC counterpart to the SEO spreadsheet exporter.

## Inputs

### CLI inputs

- optional `--data path/to/ppc-data.json`

### File inputs

- `ppc/ppc-data.json` by default

## Outputs

- writes `ppc/reports/PPC-Audit-GamePlan.xlsx`

Generated sheets:

- `Executive Summary`
- `Ad Group Performance`
- `Keyword Analysis`
- `Search Term Audit`
- `Optimization Plan`
- `Budget Reallocation`

## How It Works

### 1. Reads PPC audit JSON

It loads the JSON file directly and exits if the file is missing.

### 2. Builds worksheets as raw row arrays

Each workbook tab is constructed as an `aoa` structure with no intermediate
schema validation.

### 3. Writes workbook output

Unlike the SEO spreadsheet exporter, this file does ensure the destination
reports directory exists before writing.

## Strengths

- clear PPC-specific implementation handoff artifact
- explicit sheet composition makes the output easy to inspect and modify
- creates the reports directory if needed

## Weaknesses

### Same brittleness as the SEO exporter

The script assumes a fully populated PPC contract with direct nested property
access almost everywhere.

### Heavy dependence on a manual final contract

It expects conceptual sections like:

- `campaignHealth`
- `theProblem`
- `topPerformers`
- `bottomPerformers`
- `budgetWaste`
- `negativeKeywords`
- `actionPlan`
- `projectedImpact`

That means the real data-shaping complexity has to happen somewhere else.

### Mixed numeric formatting assumptions

Many fields are treated as numbers and formatted with `.toFixed()`.
If upstream JSON stores them as strings, export will break.

## Failure Modes

- missing `ppc-data.json`
- malformed numeric fields causing `.toFixed()` errors
- missing nested sections causing runtime exceptions
- polished workbook generated from semantically weak or manually inconsistent
  data

## Improvement Targets

### High priority

- Add a PPC export validation pass before workbook generation
- Separate view-model shaping from XLSX writing
- Define which fields are numeric and coerce or validate them centrally

### Medium priority

- Add QA output listing unresolved PPC sections
- Reuse a shared exporter pattern with the SEO spreadsheet generator

### Low priority

- Add filters, freeze panes, and stronger workbook formatting

## Bottom Line

`generate-ppc-spreadsheet.js` is operationally useful but contract-heavy.
It is one more indication that the repo has a final-output layer which assumes
complete upstream normalization, but does not yet verify it explicitly.
