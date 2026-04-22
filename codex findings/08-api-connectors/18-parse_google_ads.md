# Script Audit: `template/scripts/parse-google-ads.js`

Last updated: 2026-04-17

File: [template/scripts/parse-google-ads.js](/root/site-audit/template/scripts/parse-google-ads.js:1)

## Purpose

`parse-google-ads.js` is an ingestion and normalization script for exported
Google Ads reports.

It reads one or more CSV/TSV export files, identifies report types, parses each
row into a normalized structure, and writes:

- `ppc/ppc-raw-data.json`

This script is one of the clearest examples in the repo of a real
data-normalization layer rather than a pure fetcher or pure renderer.

## Inputs

### CLI inputs

- one or more file paths to Google Ads export files

### File inputs

- Google Ads CSV or TSV exports from the local filesystem

Supported report families include:

- keywords
- search terms
- ad groups
- ads
- audiences
- devices
- geographic
- landing pages
- quality score
- ad schedule
- change history

## Outputs

- creates `ppc/ppc-raw-data.json`
- prints parse counts and summary metrics to stdout

Output sections include:

- `adGroups`
- `keywords`
- `ads`
- `searchTerms`
- `audiences`
- `geographic`
- `devices`
- `adSchedule`
- `landingPages`
- `qualityScore`
- `changeHistory`

## How It Works

### 1. Reads raw exports with encoding detection

The script detects common Google export encodings, including:

- UTF-16LE
- UTF-8 with BOM
- plain UTF-8

### 2. Detects delimiter and parses manually

It infers comma or tab delimiters and includes its own parser for quoted CSV
content and multi-line fields.

### 3. Identifies report type heuristically

It uses filename and header signals to decide which parser should handle each
file.

### 4. Normalizes report-specific rows

Each report family has a dedicated parser that maps raw rows into a normalized
object shape with typed numeric fields where possible.

### 5. Aggregates all parsed sections into one PPC artifact

After all files are processed, it computes quick summary stats such as:

- spend
- impressions
- clicks
- conversions
- CPC
- CTR
- cost per conversion

Then it writes `ppc/ppc-raw-data.json`.

## Strengths

- materially more robust than a naive CSV import
- handles real export variability in encoding and delimiter choice
- keeps separate report parsers instead of one giant row-mapper
- produces a normalized PPC handoff artifact for downstream analysis
- summary output gives a quick sanity check after import

## Weaknesses

### Heuristic report identification

Report detection appears to rely on filename and header pattern matching.
That is practical, but fragile if users rename exports or Google changes column
labels.

### Large single-file implementation

Even though report parsers are conceptually separate, they all live in one
large script.
That raises maintenance cost and makes targeted testing harder.

### Implicit output location

The script writes into `ppc/ppc-raw-data.json` relative to the current working
directory.
That can be correct when run from the intended client folder, but it is easy to
misuse from the wrong directory.

### No explicit schema validation report

It prints counts and top-level metrics, but it does not emit a structured list
of:

- skipped files
- unknown report types
- missing required columns
- partial parse failures

### Downstream contract is hidden

The script produces a normalized PPC JSON object, but the repo does not yet
make the downstream consumers of that contract obvious.

## Failure Modes

- report type not recognized
- header names drifting from expected patterns
- parser succeeds structurally but maps semantics incorrectly
- running from the wrong directory writes output to the wrong `ppc/` folder
- files parse but leave major sections empty without strong warning signals

## Improvement Targets

### High priority

- Split report-family parsers into separate modules
- Add explicit validation output for unknown files and missing required columns
- Make the output path explicit or configurable

### Medium priority

- Add fixture-based tests using representative Google Ads exports
- Emit a machine-readable parse manifest alongside `ppc-raw-data.json`
- Document which downstream scripts consume the PPC artifact

### Low priority

- Add richer summary diagnostics such as spend by campaign or date coverage

## Bottom Line

`parse-google-ads.js` is one of the stronger data-engineering scripts in the
repo.
It solves a real ingestion problem and already contains useful normalization
logic.
Its main weakness is not the parsing approach itself, but that the logic is
packed into one large, heuristic-heavy script without a clearly documented
downstream contract.
