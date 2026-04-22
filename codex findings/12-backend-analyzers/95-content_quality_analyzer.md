# Script Audit: `platform/src/audit_platform/analyzers/content_quality.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/content_quality.py](/root/site-audit/platform/src/audit_platform/analyzers/content_quality.py:1)

## Purpose

`content_quality.py` is the backend content-analysis engine.

It scores individual pages, supports pre-publication content review, detects
duplicate and near-duplicate content with SimHash, and finds keyword
cannibalization from Search Console style query/page data.

This is one of the deeper and more complete backend analyzers in the repo.

## Inputs

Primary dependencies:

- `structlog`
- backend content models in `audit_platform.models.content`
- optional `textstat` at runtime for richer readability analysis

Primary public entrypoints:

- `analyze_page(...)`
- `review_content(...)`
- `analyze_batch(...)`
- `detect_cannibalization(...)`

Main runtime inputs:

- crawl-page dictionaries
- optional raw HTML
- optional target keyword mappings
- Search Console query/page rows

## Outputs

This file returns strongly modeled records rather than loose dicts:

- `ContentQualityRecord`
- `DuplicateGroup`
- `CannibalizationRecord`

It is one of the clearest examples in the backend of the platform layer using
real typed models.

## How It Works

### 1. Scores single pages in two modes

`analyze_page(...)` works from crawl data, optionally enriched with raw HTML.

`review_content(...)` works directly from raw HTML or text and is meant for
pre-publication review.

Both routes calculate:

- thin-content status
- freshness
- heading integrity
- image / alt-text coverage
- internal-link presence
- keyword placement
- readability
- structural quality
- composite quality score

### 2. Performs batch duplicate detection

`analyze_batch(...)` runs `analyze_page(...)` across a page set, builds SimHash
fingerprints, compares pages by Hamming distance, groups duplicates, and then
annotates records with duplicate or near-duplicate flags.

### 3. Detects keyword cannibalization

`detect_cannibalization(...)` groups Search Console style rows by query, finds
queries served by multiple pages, and produces severity-ranked
cannibalization records with remediation guidance.

## Interactions With Other Scripts

This analyzer feeds several later layers:

- reporting intelligence
- content-oriented report pages
- duplicate-content findings
- keyword cannibalization reporting

It also depends heavily on the data quality of crawl outputs and any optional
raw HTML enrichment.

## Strengths

- one of the more mature backend analyzers in the repo
- supports both audit-time and editorial review workflows
- strong use of typed models
- readability logic degrades gracefully when `textstat` is unavailable
- duplicate and cannibalization logic are meaningfully more sophisticated than
  basic threshold checks

## Weaknesses

### Duplicate detection does not actually use body text in the main batch path

`_simhash(...)` supports full body text, but `analyze_page(...)` calls it as:

- `_simhash(title, h1_list, h2_list, description)`

and `analyze_batch(...)` calls `analyze_page(...)` without raw HTML.

So the main duplicate-detection flow fingerprints metadata and headings, not
full page content. That is a major gap between the file's stated capability and
its default runtime behavior.

### Thin-content issue state can become stale after raw HTML enrichment

In `analyze_page(...)`, `THIN_CONTENT` can be added before raw HTML is parsed.
If HTML-derived readability later updates `word_count`, `is_thin` is recomputed,
but the pre-added issue is not removed.

That can leave the output internally inconsistent.

### Near-duplicate detection degrades sharply above 1,000 pages

For larger batches, the analyzer stops doing pairwise near-duplicate comparison
and only groups exact SimHash matches.

That is a reasonable performance concession, but it materially changes what the
analyzer means on larger sites.

### Readability in audit mode is often incomplete

Without raw HTML, `analyze_page(...)` emits `READABILITY_NOT_ANALYZED` and works
from crawl summary fields only.

That keeps the pipeline moving, but it means one of the file's major scoring
dimensions is frequently absent unless the caller explicitly enriches inputs.

## Failure Modes

- duplicate-content output can be misleading because it is based on metadata
  rather than body copy in the common path
- large-site duplicate analysis silently becomes much weaker
- crawl-only mode can produce lower-fidelity content scores than the file name
  suggests
- issue lists can drift from recomputed state when enrichment changes derived
  values

## Improvement Targets

### High priority

- pass full text into `_simhash(...)` in the main batch path whenever HTML or
  extracted body text is available
- reconcile issue lists after recalculating `is_thin`
- make large-site degradation explicit in the returned output, not just logs

### Medium priority

- clarify when callers should use audit mode versus review mode
- consider a cheaper body-text fingerprint path for large sites instead of
  falling back to exact matches only

## Bottom Line

`content_quality.py` is one of the strongest backend modules in the repo and has
real analytical depth.

Its biggest problem is not that it lacks capability, but that its default batch
path underuses the richer logic it already contains.
