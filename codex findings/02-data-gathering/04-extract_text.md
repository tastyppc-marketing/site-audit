# Script Audit: `template/scripts/extract-text.js`

Last updated: 2026-04-17

File: [template/scripts/extract-text.js](/root/site-audit/template/scripts/extract-text.js:1)

## Purpose

`extract-text.js` is the readability enrichment script. It reads URLs from
`crawl-data.json`, revisits those pages in Playwright, strips out obvious
boilerplate elements, computes text statistics, and writes
`page-text-analysis.json`.

Its role is narrow but important: it provides normalized readability metrics
that later scripts use to improve `contentQuality`.

## Inputs

### CLI inputs

- `--input`
- `--limit`

Default input is:

- `seo/research/crawl-data.json`

### Runtime dependencies

- Playwright Chromium
- reachable target URLs

## Outputs

- `seo/research/page-text-analysis.json`

Output contains:

- per-page readability metrics
- summary metrics
- errors
- status
- `gatheredAt`

The script explicitly includes both:

- `avgWordsPerSentence`
- `avgSentenceLength`

because downstream normalizers expect `avgSentenceLength`.

## How It Works

### 1. Reads crawl inventory

It extracts URLs from:

- `crawlData.pages[].url`
- or fallback shapes such as `crawlData.urls`

### 2. Revisits pages

For each page it loads the page in Playwright, clones `document.body`, removes
common non-content selectors, and computes:

- word count
- sentence count
- syllable count
- Flesch Reading Ease
- Flesch-Kincaid Grade
- average words per sentence
- average syllables per word

### 3. Writes structured results

It emits both page-level and aggregate summary metrics, plus partial/failure
status.

## What Other Scripts Depend On

- `build_audit.py` merges this data into content quality inputs
- `generate-multipage-report.js` uses it for readability enrichment and
  `contentQuality` fallback generation

## Strengths

- Output contract is clearly documented in the header comment
- Includes aliases specifically to satisfy downstream expectations
- Emits partial/failure status instead of pretending everything succeeded

## Weaknesses

### Heuristic syllable counting

The syllable algorithm is intentionally simple. That is fine for broad scoring
but not linguistically robust.

### Boilerplate stripping is shallow

Removing `nav`, `footer`, `header`, `aside`, and some class names helps, but it
is still a crude approximation of main content extraction.

### Sequential processing

Unlike the crawler, this script processes pages serially with a fixed 500ms
delay. That is simpler but slower on large sites.

### Duplicate fetch cost

It re-fetches pages already visited during crawl analysis instead of reusing
captured HTML or extracted text from the crawl step.

## Failure Modes

- Playwright missing
- input file absent or malformed
- no URLs found in crawl data
- page fetch timeout or network failure
- low-quality content extraction leading to misleading readability values

## Improvement Targets

### High priority

- Consider reusing crawl HTML/text to avoid a second fetch pass
- Formalize the relation between this script’s output and the content-quality
  analyzer contract

### Medium priority

- Improve content extraction beyond simple selector removal
- Add optional batching/concurrency

### Low priority

- Add language-awareness guardrails before applying English readability formulas

## Bottom Line

`extract-text.js` is a focused enrichment script. It is not a major
orchestrator, but it fills a real contract gap: it turns crawl URLs into
readability metrics the rest of the system can consume. Its biggest weakness is
not correctness of the math, but that it duplicates fetch work and uses a
shallow notion of "content."
