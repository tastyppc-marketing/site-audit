# Script Audit: `platform/tests/test_content_quality.py`

Last updated: 2026-04-18

File: [platform/tests/test_content_quality.py](/root/site-audit/platform/tests/test_content_quality.py:1)

## Purpose

`test_content_quality.py` is the comprehensive backend test suite for
`ContentQualityAnalyzer`.

It covers a very large surface area, including:

- readability scoring
- thin-content detection
- keyword usage and density
- SimHash duplicate detection
- structure scoring
- freshness / stale-content logic
- audit-mode vs review-mode consistency
- batch analysis
- cannibalization detection
- edge cases
- Pydantic serialization of content models

## Inputs

Test dependencies:

- `pytest`
- `datetime`
- `ContentQualityAnalyzer`
- content-related model classes such as:
  - `ContentQualityRecord`
  - `ReadabilityMetrics`
  - `KeywordUsage`
  - `ContentStructure`
  - `DuplicateGroup`
  - `CannibalizationRecord`

## Outputs

No runtime artifacts. The file asserts analyzer and model behavior.

## How It Works

### 1. Tests scoring formulas directly

The suite validates concrete formula behavior around:

- Flesch reading ease
- reading-level buckets
- word and sentence counts
- structure scoring
- freshness thresholds

### 2. Tests page analysis in two modes

It distinguishes between:

- `analyze_page(...)` for audit-mode page data
- `review_content(...)` for HTML / content-review mode

and checks that core outcomes stay consistent where they should.

### 3. Tests duplicate and cannibalization logic

It exercises:

- SimHash generation
- Hamming distance
- duplicate grouping
- duplicate flags
- cannibalization severity thresholds

### 4. Tests batch and serialization behavior

The suite verifies both analyzer batch outputs and downstream model
serialization contracts.

## Strengths

- one of the deepest test suites in the backend
- excellent boundary-condition coverage
- validates both algorithmic behavior and model serialization
- dual-mode consistency checks are especially valuable in this repo

## Weaknesses

### Huge multi-concern file

Like `test_technical_seo.py`, this is really several suites in one file. It is
well sectioned, but still very large.

### Strongly coupled to current formulas

Many assertions pin exact thresholds or exact numeric outcomes. That is good for
regression safety, but it also means formula tuning will generate a lot of test
maintenance.

### Real-world HTML diversity is still limited

The suite is broad, but most inputs are still handcrafted and English-language.
It does not strongly stress noisy markup, localization, or malformed content.

## Failure Modes

- formula refinements can break many tests at once
- noisy real-world content may behave differently from the synthetic fixtures
- the sheer size of the file makes failures harder to triage quickly

## Improvement Targets

### High priority

- keep the breadth, but consider splitting by concern:
  - readability
  - structure
  - duplication
  - cannibalization
  - serialization
- keep boundary tests for thresholds because they are clearly valuable
- add a few messier HTML fixtures closer to real crawl output

### Medium priority

- add international / multilingual cases if the analyzer is expected to support
  them

## Bottom Line

`test_content_quality.py` is one of the strongest verification assets in the
repo.

It shows that the content-quality analyzer is expected to own a lot of real
interpretive logic upstream, which is important context when judging report
renderers that later try to reconstruct or simplify those outputs.
