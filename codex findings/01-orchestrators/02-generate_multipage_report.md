# Script Audit: `template/reports/multipage/generate-multipage-report.js`

Last updated: 2026-04-17

File: [template/reports/multipage/generate-multipage-report.js](/root/site-audit/template/reports/multipage/generate-multipage-report.js:1)

## Purpose

`generate-multipage-report.js` is nominally a report build script, but in
practice it does far more than render HTML.

It:

- reads `audit-data.json`
- performs a large in-place normalization pass
- auto-populates missing fields from sibling research files
- validates completeness against page requirements
- builds a search index
- injects the final data into 9 HTML pages
- inlines JS and optionally CSS
- writes the final report bundle

This means it is not just a renderer. It is the second major orchestrator in
the repo and the de facto contract repair layer for the report.

## Inputs

### CLI inputs

- `--data`
- `--output`
- `--inline`
- `--help`

### Primary file inputs

- one `audit-data.json`
- nine HTML templates in the multipage directory
- shared runtime directories: `shared`, `pages`, `assets`

### Sibling research files used by normalization

The normalization pass reads a large number of optional sibling files from
`<seo-dir>/research/`, including:

- `pagespeed-data.json`
- `crawl-data.json`
- `link-graph.json`
- `page-text-analysis.json`
- `client-backlinks.json`
- `domain-metrics.json`
- `keyword-volumes.json`
- `keyword-data.json`
- `keyword-research.json`
- `rank-history.json`
- `search-console.json`
- `ga4-data.json`

This is a major architectural fact: the report generator is not just consuming
finished audit JSON. It is still assembling the final data model from multiple
research artifacts at render time.

## Outputs

- a multipage HTML bundle
- inlined `window.AUDIT_DATA`
- inlined `window.SEARCH_INDEX`
- copied runtime folders (`shared`, `pages`, `assets`)

If no explicit `--output` is given, it creates a dated folder beside the input
`audit-data.json`.

## What It Really Does

### 1. Reads and mutates `audit-data.json`

After loading the JSON, it immediately calls:

- `normalizeAuditData(auditData, dataDir)`

That function mutates the object in place before anything is rendered.

This is the most important behavior in the file. It means the "final" report
data is not actually the raw `audit-data.json` on disk. It is the post-normalize
version that only exists inside this script unless written elsewhere.

### 2. Performs schema repair

The normalizer does all of the following kinds of work:

- snake_case to camelCase conversion
- URL matching and canonicalization helpers
- API error propagation into `data.apiErrors`
- field aliasing
- fallbacks between top-level and nested sections
- rebuilding missing sections from sibling research files

This is far beyond presentation logic.

### 3. Reconstructs missing sections from research JSON

Examples traced directly in the code:

- `technicalSeo.lighthouseResults` from `pagespeed-data.json`
- `coreWebVitals` from `pagespeed-data.json`
- `pageSpeedComparison` from `pagespeed-data.json`
- `technicalSeo.pageAudits` from `crawl-data.json`
- `internalLinking` summary stats and hub clusters from `link-graph.json`
- readability enrichment from `page-text-analysis.json`
- backlink lists from `client-backlinks.json`
- domain metrics from `domain-metrics.json`
- `keywords` from `keyword-data.json`, `keyword-volumes.json`, and
  `keyword-research.json`
- `rankHistory` from `rank-history.json`
- `searchConsoleData` from `search-console.json`
- `trafficData` from `ga4-data.json`
- `contentQuality` from `crawl-data.json` and `page-text-analysis.json`

This makes the file highly powerful, but also highly risky. It is compensating
for missing upstream integration by performing late binding at report-build
time.

### 4. Validates page completeness

`validateAuditData()` checks whether each page has enough data to render key
sections. It emits criticals and warnings, but it does not generally stop the
build unless something throws.

That means the script favors "build whatever you can" over "fail on bad data."

### 5. Injects data into templates

It replaces two placeholders in every HTML page:

- `__AUDIT_DATA_PLACEHOLDER__`
- `__SEARCH_INDEX_PLACEHOLDER__`

It then always inlines JS for `file://` compatibility and optionally inlines
CSS.

## Search Index Behavior

The file also builds the report search index itself.

Current indexed sources include:

- `keywords`
- `topIssues`
- `competitorStrategies`
- `quickWins`
- `actionPlan`

That means search relevance is coupled to normalization and render data shape.

## Dependencies

### Internal dependencies

- page template files
- shared runtime files under `shared/`
- page runtime files under `pages/`
- sibling research JSON in `seo/research/`

### External dependencies

No network or API calls happen here directly. It is a pure file-system build
script.

## What Calls It

This is the active SEO report build script for the multipage report.

It appears in:

- `template/reports/multipage/`
- client-copied versions under at least:
  - `clients/liane-jamason/reports/multipage/`
  - `clients/laura-willis/reports/multipage/`
  - `clients/matt-wallmow/reports/multipage/`

Important finding: client copies exist and at least some differ from the
template version. That means fixes to this script can drift unless the repo is
recentralized or all copies are patched intentionally.

## Failure Modes

### Hidden data assembly

Because this script fills missing sections late, bad upstream pipelines can go
undetected. A report may render "successfully" even when `audit-data.json` was
never fully populated correctly.

### Two sources of truth

`build_audit.py` already performs part of the schema assembly. This file does a
second large normalization pass. That duplication is one of the core structural
problems in the repo.

### Partial field semantics

Some fields are rebuilt from best-effort approximations rather than authoritative
analyzer outputs. For example:

- keyword ranks can collapse into `Found` / `Not found`
- content quality can be inferred from crawl and readability data when richer
  analyzer output is absent
- page comparisons can be derived from fallback sources rather than canonical
  analysis objects

That can produce valid-looking but semantically weaker report data.

### Silent fallback behavior

Most research file parsing failures are logged as warnings, not hard failures.
This is good for resilience, but bad for audit trust when the goal is precise
data quality.

### Drift across duplicated copies

Because this file is copied into client folders, the system can end up with
different normalization logic per client. That is a serious maintenance risk.

## Architectural Assessment

This file is currently doing three jobs:

1. report builder
2. schema normalizer
3. missing-data auto-populator

That is too much responsibility for one late-stage script.

As implemented today, this file is effectively the final arbiter of what the
report "means," even though its name suggests it should only assemble HTML.

## Improvement Targets

### High priority

- Move schema ownership into one upstream assembly layer and reduce this file to
  pure report building.
- Define which fields are allowed to be auto-populated here and which must be
  required before report generation starts.
- Add an option to fail hard on critical missing data instead of merely warning.
- Eliminate or centrally manage client-specific copies of this file.

### Medium priority

- Split normalization into a separate tested module with explicit input/output
  contracts.
- Emit a machine-readable normalization report listing every fix and fallback
  used during generation.
- Distinguish authoritative values from inferred fallback values in the output.

### Low priority

- Reduce mutation-heavy style in `normalizeAuditData()` by decomposing it into
  named sub-normalizers with explicit return values.
- Add provenance tags so each output section can say which source file actually
  supplied it.

## Bottom Line

`generate-multipage-report.js` is the hidden center of gravity of the current
SEO report system. Even though it appears to be a renderer, it is actually the
final data assembler, fallback engine, validator, and HTML builder. That makes
it one of the highest-leverage scripts in the repo and one of the first places
that should be simplified if the goal is trustworthy, maintainable data flow.
