# Script Audit: `template/scripts/populate-audit-data.js`

Last updated: 2026-04-17

File: [template/scripts/populate-audit-data.js](/root/site-audit/template/scripts/populate-audit-data.js:1)

## Purpose

`populate-audit-data.js` is the explicit markdown-to-JSON bridge in the repo.
It parses AI-written research markdown and writes selected fields into
`seo/audit-data.json`.

This is important because much of the repo otherwise relies on late-stage
normalizer fallbacks instead of a dedicated translation layer.

## Inputs

### CLI inputs

- optional `--force`

### File inputs

- `seo/audit-data.json`
- `seo/research/keyword-research.md`
- `seo/research/competitor-analysis.md`
- `seo/reports/FINAL-AUDIT-REPORT.md`

## Outputs

- mutates `seo/audit-data.json`

Populated fields:

- `keywords`
- `competitorComparison`
- `competitorStrategies`
- `siteComparison`
- `contentCalendar`
- `advantages`

## How It Works

### 1. Loads source markdown files

It reads the three markdown artifacts and exits with warnings if they are
missing.

### 2. Parses markdown tables and sections

It includes custom parsers for:

- pipe tables
- table-after-heading extraction
- keyword table extraction
- competitor comparison extraction
- competitor strategy extraction
- content calendar extraction
- advantages extraction

### 3. Writes only selected missing fields

Unless `--force` is used, it skips fields already present in `audit-data.json`.

### 4. Derives `siteComparison`

Unlike the other fields, `siteComparison` is derived from the parsed
`competitorComparison` structure rather than being read directly as a distinct
source.

## Strengths

- this is the clearest checked-in bridge from AI-authored markdown into the
  structured report contract
- writes only a bounded set of fields
- supports non-destructive default behavior via skip-unless-force

## Weaknesses

### Narrow field coverage

It only populates six field groups. Many other report fields still depend on
manual entry, Python analyzers, or normalizer fallback logic.

### Format fragility

Every parser assumes relatively specific markdown heading and table formats.
If the AI-written files drift even slightly, extraction can fail.

### Positional parsing

Several table parsers rely on column position rather than resilient named-field
parsing. That makes them sensitive to markdown format changes.

### Direct mutation of `audit-data.json`

The script rewrites the core audit file in place without staging or diff output.

## Failure Modes

- source markdown file missing
- headings not matching expected phrasing
- tables present but slightly reformatted
- silent semantic degradation when extracted text is technically parsed but not
  truly correct

## Improvement Targets

### High priority

- Expand this script or a successor so more markdown-authored fields are
  translated here instead of in late-stage report normalization
- Add validation summaries showing which fields are still unresolved after
  population

### Medium priority

- Make parsers more robust to heading and table format variation
- Add preview/dry-run mode before rewriting `audit-data.json`

### Low priority

- Emit a machine-readable population report for downstream QA

## Bottom Line

`populate-audit-data.js` is one of the most important alignment scripts in the
repo because it explicitly translates AI research into structured report data.
Its core issue is not bad design direction, but limited coverage and fragility.
If this layer were expanded and hardened, the repo could rely less on the
report generator’s late-stage repair logic.
