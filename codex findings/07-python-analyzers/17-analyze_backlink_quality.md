# Script Audit: `template/scripts/analyze-backlink-quality.js`

Last updated: 2026-04-17

File: [template/scripts/analyze-backlink-quality.js](/root/site-audit/template/scripts/analyze-backlink-quality.js:1)

## Purpose

`analyze-backlink-quality.js` classifies referring domains as:

- `legitimate`
- `suspicious`
- `spam`

It enriches backlink research JSON files with quality fields and a summary
block.

Despite the folder name in this findings phase, this script is Node-based, not
Python-based.
It fits here because it is an analyzer rather than a raw data fetcher or final
report renderer.

## Inputs

### CLI inputs

- optional `--client-only`

### File inputs

- `seo/research/client-backlinks.json`
- optional competitor files matching `seo/research/backlinks-*.json`

## Outputs

It mutates backlink JSON files in place and writes backup copies:

- original file rewritten with `domainQuality`, `qualityScore`,
  `qualitySignals`, `qualityReason`, and `qualitySummary`
- backup created as `*.json.bak`

## How It Works

### 1. Loads backlink research files

For each eligible JSON file, it reads:

- `backlinks`
- `referring_domains`

It supports either top-level fields or nested `raw.data.*` style shapes.

### 2. Aggregates backlink-level signals per domain

It derives per-domain context from backlink rows, including:

- anchor text collection
- whether the domain has at least one dofollow link
- approximate link count

### 3. Applies a rule-based classifier

The classification logic uses:

- spammy TLD patterns
- spam keyword patterns
- Telegram / darkside-style anchor patterns
- generic anchor patterns
- SEO-spam naming patterns
- DR-based heuristics
- known legitimate domain patterns

### 4. Copies domain classification back onto backlinks

If a backlink's source domain matches a classified referring domain, the
backlink gets the domain quality fields too.

### 5. Writes summary and overwrites source files

It appends a `qualitySummary` block, saves a `.bak`, and rewrites the original
JSON file.

## Strengths

- useful intermediate enrichment layer for backlink cleanup and reporting
- runs locally with no API requirement
- preserves a backup before overwriting
- easy to trace because the scoring model is explicit

## Weaknesses

### In-place mutation of research artifacts

This script rewrites primary research files rather than producing a separate
derived artifact.
That makes provenance and re-runs harder to reason about.

### Heuristics are opinionated and narrow

The classifier is built around a particular spam worldview:

- low DR is suspicious
- certain TLDs are suspicious
- certain anchor patterns are suspicious

That can work well in many audits, but it can also misclassify niche or foreign
legitimate sites.

### Header promises more than the current implementation

The file header references an optional AI-assisted phase, but the checked-in
implementation is fully rule-based and only prints a suggestion for manual
follow-up.

### Potential structure mismatch assumptions

The script supports a couple of source shapes, but still assumes the backlink
files are broadly Ahrefs-like in naming and semantics.

### Phase naming drift in the repo

This is one more example of architecture spread across mixed script types
without a strict pipeline taxonomy.

## Failure Modes

- backlink file missing or empty
- malformed source URLs preventing domain extraction
- false positives for legitimate low-authority or foreign domains
- research files overwritten with imperfect classifications

## Improvement Targets

### High priority

- Write enriched output to a sibling derived file instead of mutating the
  original research source
- Add a confidence flag so low-confidence classifications can be reviewed
- Log exact reasons for skipped rows and URL parse failures

### Medium priority

- Separate domain parsing, scoring, and file IO into testable modules
- Add configuration so per-vertical spam heuristics can vary by client type
- Make the optional AI-review phase real or remove it from the header comments

### Low priority

- Emit CSV or markdown QA summaries for backlink review workflows

## Bottom Line

`analyze-backlink-quality.js` is a practical enrichment tool that sits between
raw backlink data and final reporting.
Its core weakness is not the idea of rule-based scoring.
The bigger issue is that it rewrites source research files in place and relies
on heuristics that are useful but not universally reliable.
