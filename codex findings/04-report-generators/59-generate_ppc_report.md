# Script Audit: `template/reports/multipage-ppc/generate-ppc-report.js`

Last updated: 2026-04-18

File: [template/reports/multipage-ppc/generate-ppc-report.js](/root/site-audit/template/reports/multipage-ppc/generate-ppc-report.js:1)

## Purpose

`generate-ppc-report.js` is the PPC multipage report generator.

It:

- reads `ppc-data.json`
- builds a PPC report search index
- injects `window.AUDIT_DATA` and `window.SEARCH_INDEX` into every page
- copies the PPC runtime folders into the output bundle
- optionally inlines local CSS

Architecturally, this is the PPC sibling to the SEO multipage generator.

## Inputs

### CLI inputs

- `--data`
- `--output`
- `--inline`

### Primary file inputs

- one PPC audit JSON file
- HTML templates:
  - `index.html`
  - `structure.html`
  - `quality-score.html`
  - `wasted-spend.html`
  - `search-terms.html`
  - `budget.html`
  - `action-plan.html`
- copied runtime folders:
  - `shared`
  - `pages`
  - `assets`

### Data sections it expects

The search index builder expects some mix of:

- `data.ppcAudit.recommendations`
- `data.ppcAudit.ngramAnalysis`
- `data.ppcAudit.wastedSpend`
- `data.ppcAudit.structure`
- `data.ppcAudit.qualityScore`
- `data.ppcAudit.budgetBidding`
- raw `keywords`
- raw `searchTerms`

## Outputs

- a generated PPC multipage report bundle
- injected `window.AUDIT_DATA`
- injected `window.SEARCH_INDEX`
- copied shared/page/assets directories

If no explicit output directory is provided, it creates a dated folder beside
the input JSON using the client name and current date.

## How It Works

### 1. Reads PPC audit JSON

The file loads the PPC JSON payload, infers the audit root via `getAuditRoot`,
and prepares the output directory.

Unlike the SEO multipage generator, this script does not appear to run a large
normalization pass first.

### 2. Builds a PPC-specific search index

`buildSearchIndex()` walks the PPC data model and indexes:

- recommendations
- checks from structure / quality score / wasted spend / budget
- n-gram rows
- negative keyword candidates
- wasted-spend rows
- campaign structure rows
- quality-score rows
- budget / strategy data

This gives the PPC report its own `Ctrl+K` navigation layer.

### 3. Injects report data into all HTML pages

For each HTML template, the script injects:

- serialized audit data
- serialized search index

It can also inline the local CSS files when `--inline` is used.

### 4. Copies runtime assets

It copies the full `shared`, `pages`, and `assets` folders into the output
bundle so the generated report is self-contained.

## Strengths

- clear and self-contained build responsibility
- predictable set of PPC output pages
- search indexing is useful and intentionally PPC-specific
- simpler than the SEO multipage generator, which reduces surprise

## Weaknesses

### Duplicated report stack

This file confirms that the repo maintains two parallel multipage systems:

- SEO multipage generator/runtime/pages
- PPC multipage generator/runtime/pages

That duplication is a major long-term maintenance cost.

### Lighter validation than the SEO generator

The PPC generator builds the report but does not do the kind of heavy schema
validation / recovery the SEO generator does. That is simpler, but it also
means PPC correctness depends more directly on upstream data consistency.

### Search-index coupling

The generator hardcodes many PPC search-index extraction rules. Any PPC schema
changes require updating both page renderers and the generator’s indexing logic.

## Failure Modes

### Report pages depend on mixed raw and analyzed data

The generator accepts both:

- analyzed `ppcAudit.*` data
- raw arrays like `keywords`, `searchTerms`, and `campaigns`

That flexibility matches the page layer, but it weakens the final contract.

### Shared duplication drifts over time

Because this is a parallel copy of the SEO generator concept, fixes made to one
stack are easy to forget in the other.

## Improvement Targets

### High priority

- Extract a shared multipage generator core used by both SEO and PPC
- Introduce explicit schema validation for PPC data before page injection
- Standardize one canonical PPC report contract so page renderers stop relying
  on raw fallback sources

### Medium priority

- Keep search-index extraction centralized and test it with fixture data
- Reduce copy-paste between SEO and PPC generator implementations

## Bottom Line

`generate-ppc-report.js` is the entrypoint for a completely separate PPC report
subsystem.

It is cleaner than the SEO generator in some ways, but it also confirms a
larger architectural issue: the repo is maintaining two near-parallel report
platforms instead of one configurable one.
