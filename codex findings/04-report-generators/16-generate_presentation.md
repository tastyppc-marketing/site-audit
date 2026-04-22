# Script Audit: `template/scripts/generate-presentation.js`

Last updated: 2026-04-17

File: [template/scripts/generate-presentation.js](/root/site-audit/template/scripts/generate-presentation.js:1)

## Purpose

`generate-presentation.js` converts `seo/audit-data.json` into a PowerPoint
deck for client delivery.

Output:

- `seo/reports/SEO-Audit-Presentation.pptx`

This script is a final-format renderer.
It does not gather data or normalize data safely.
It assumes upstream layers have already shaped a complete presentation-ready
contract.

## Inputs

### CLI inputs

- optional `--data path/to/audit-data.json`

### File inputs

- `seo/audit-data.json` by default

## Outputs

- writes `seo/reports/SEO-Audit-Presentation.pptx`

The deck contains slides for:

- title / client identity
- overall grade and key stats
- top issues
- keyword visibility
- competitor gap
- competitor strategies
- four-pillar strategy
- quick wins
- short-term content strategy
- content calendar
- deliverables
- medium-term roadmap
- long-term roadmap
- expected outcomes
- next steps / close

## How It Works

### 1. Reads the audit JSON

Like the spreadsheet exporter, it accepts `--data` or falls back to the
standard audit file.

### 2. Initializes a PowerPoint theme inline

It defines:

- fixed wide layout
- author and subject metadata
- hard-coded color palette
- a shared `addTitleBar()` helper

### 3. Builds slides imperatively

Each slide is rendered directly with `pptxgenjs` calls.
The script does not define reusable slide schemas or abstractions beyond the
title bar helper.

### 4. Writes the deck to the reports folder

The script writes directly to the standard report location after assembling all
slides.

## Upstream Dependencies

This file depends on a large amount of completed audit structure.

Notable required sections include:

- `d.client`
- `d.keyStats`
- `d.topIssues`
- `d.keywords`
- `d.competitor`
- `d.competitorComparison`
- `d.competitorStrategies`
- `d.pillars`
- `d.quickWins`
- `d.actionPlan.shortTerm`
- `d.contentCalendar`
- `d.deliverables`
- `d.keyPagesCreated`
- `d.blogPostsCreated`
- `d.mediumTermRoadmap`
- `d.longTermColumns`
- `d.expectedOutcomes`
- `d.nextSteps`

This is one of the most contract-heavy scripts in the repo.

## Strengths

- easy to inspect visually because each slide is explicitly described
- deterministic output if the audit JSON is stable
- useful for turning the audit into a client-facing artifact without manual
  slide work
- layout logic is transparent enough to debug with line-by-line review

## Weaknesses

### Hard-coded and brittle content contract

The deck assumes a very specific final narrative structure.
If the audit JSON is missing one conceptual section, the export can fail or the
presentation can become incomplete.

### No validation or fallback strategy

There is no preflight summary of missing slide sections.
This means data problems are discovered only when slide generation hits them.

### Mixed field conventions

Some sections read from `d.actionPlan.shortTerm`, while others read from
top-level structures such as `d.quickWins`, `d.mediumTermRoadmap`, and
`d.longTermColumns`.

That suggests the data contract is not fully normalized around a single schema.

### Partial competitor scalability

The competitor gap slide uses `d.competitor.all` for labels, but row rendering
still assumes `comp1` and `comp2`.
That is the same architectural mismatch seen in the spreadsheet exporter.

### Presentation design is frozen into code

Typography, colors, spacing, and content composition are all embedded here.
That makes style changes expensive and encourages client-specific forks.

### Output directory assumptions

Like the spreadsheet generator, it assumes the destination folder is present.

## Failure Modes

- missing `audit-data.json`
- absent nested fields causing runtime errors
- arrays longer than expected causing slide overcrowding
- inconsistent schema between normalized report data and presentation sections
- valid JSON but weak data quality yielding misleading polished output

## Improvement Targets

### High priority

- Add a required-fields validation pass before slide rendering
- Define a single presentation view model so slides read normalized data, not
  raw `audit-data.json`
- Unify competitor table structures across report outputs

### Medium priority

- Move palette and slide constants into a separate theme module
- Add layout guards for oversized arrays and long text
- Ensure output directories exist before write

### Low priority

- Support optional slide omission when a section is intentionally unavailable
- Add speaker notes or export metadata for QA

## Bottom Line

`generate-presentation.js` is a high-leverage final-mile script.
It makes the repo's data contract visible because it depends on so many fields.
That also means it is a good place to measure data integrity, but a bad place
to repair it.
If data is coming through incorrectly, the real fix likely belongs upstream.
