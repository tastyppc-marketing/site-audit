# Script Audit: `template/scripts/generate-ppc-presentation.js`

Last updated: 2026-04-17

File: [template/scripts/generate-ppc-presentation.js](/root/site-audit/template/scripts/generate-ppc-presentation.js:1)

## Purpose

`generate-ppc-presentation.js` converts `ppc/ppc-data.json` into a client-ready
PowerPoint deck:

- `ppc/reports/PPC-Audit-Presentation.pptx`

It is the PPC companion to the SEO PowerPoint generator.

## Inputs

### CLI inputs

- optional `--data path/to/ppc-data.json`

### File inputs

- `ppc/ppc-data.json` by default

## Outputs

- writes `ppc/reports/PPC-Audit-Presentation.pptx`

The deck includes slides for:

- title
- campaign health
- the core problem
- budget allocation
- budget waste
- top performers
- bottom performers
- keyword issues
- ad copy improvements
- negative keywords
- quick wins
- 30-day plan
- 90-day plan
- projected impact
- next steps

## How It Works

### 1. Loads the PPC audit JSON

It resolves `--data` or falls back to the default PPC audit path.

### 2. Defines presentation styling inline

It sets fixed colors, layout, metadata, and a shared title-bar helper.

### 3. Renders slides imperatively

Each slide is built directly through `pptxgenjs` calls with no abstraction
beyond the title bar helper.

### 4. Writes the deck to the PPC reports folder

This script does ensure the output directory exists before writing.

## Strengths

- creates a consistent client-facing PPC delivery format
- visually mirrors the SEO presentation workflow
- explicit imperative slide logic is straightforward to trace

## Weaknesses

### Duplicated architecture with the SEO presenter

This is effectively a second presentation engine that repeats many patterns
from the SEO version instead of sharing validation and layout primitives.

### Contract-heavy and brittle

It assumes a fully shaped PPC narrative with many deeply nested structures and
typed numeric fields.

### Mixed field naming conventions

Like the SEO presenter, it mixes top-level shortcut arrays such as `quickWins`
with nested structures like `actionPlan.week2to3` and `actionPlan.month1to2`.

### Layout risk for long arrays and long copy

Many slides slice arrays to fit visually, which is practical, but that also
means some underlying data may be omitted from the presentation without a
formal warning.

## Failure Modes

- missing or malformed `ppc-data.json`
- numeric formatting assumptions breaking on strings or nulls
- overflow or silent truncation when sections are longer than expected
- presentation generated successfully while hiding underlying data quality
  issues

## Improvement Targets

### High priority

- Add a preflight required-fields validation step
- Define a normalized presentation view model before slide rendering
- Extract shared presentation helpers used by both SEO and PPC generators

### Medium priority

- Add slide-overflow warnings when arrays are truncated
- Centralize theme constants and reusable table builders

### Low priority

- Support optional slide omission with explicit logging

## Bottom Line

`generate-ppc-presentation.js` is another strong signal that the repo has two
parallel report systems with similar assumptions and duplicated fragility.
If PPC data is incorrect, this script will present the problem cleanly, but it
is not where the underlying correction should happen.
