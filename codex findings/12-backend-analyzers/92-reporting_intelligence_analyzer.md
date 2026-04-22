# Script Audit: `platform/src/audit_platform/analyzers/reporting_intelligence.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/reporting_intelligence.py](/root/site-audit/platform/src/audit_platform/analyzers/reporting_intelligence.py:1)

## Purpose

`reporting_intelligence.py` is the backend synthesis and prioritization layer.

It takes the outputs from the rest of the audit pipeline and turns them into:

- category scores
- a composite health grade
- prioritized findings
- an action plan
- benchmark comparisons
- an executive summary
- historical trend data

This is one of the highest-leverage modules in the backend because it is where
raw analysis becomes client-facing narrative and prioritization.

## Inputs

Primary dependencies:

- `structlog`
- `json`
- `datetime`
- `pathlib.Path`
- optional `anthropic` import at runtime

Primary runtime inputs:

- `audit_data`
- `domain`

Important upstream data sections it expects:

- `technicalSeo`
- `coreWebVitals` or `performance`
- `contentQuality`
- `backlinks`
- `indexationCrawlability`
- `localSeo`

## Outputs

The main `analyze(...)` method returns:

- `siteHealthGrade`
- `prioritizedFindings`
- `actionPlan`
- `benchmarkComparisons`
- `executiveSummary`
- `trendData`
- `categoryScores`

This is effectively the backend output that explains what the audit means.

## How It Works

### 1. Extracts category-level scores

`_extract_category_scores(...)` derives 0-100 style scores from upstream
analyzer outputs for:

- technical
- performance
- content
- backlinks
- indexability
- local

The logic is heuristic and schema-aware rather than model-driven.

### 2. Computes the overall health grade

`_compute_health_grade(...)` renormalizes weights across only the categories
that are present, computes a weighted composite, then applies a floor penalty if
any category is severely weak.

This is a meaningful design decision. It avoids a good average masking a deeply
broken area.

### 3. Flattens findings from multiple analyzers

`_extract_all_findings(...)` walks several upstream sections and emits a flat
finding list with categories attached.

It also synthesizes thin-content and duplicate-content findings from summary
counts instead of waiting for every analyzer to expose fully normalized issue
records.

### 4. Prioritizes findings by ROI-style scoring

`_prioritize_findings(...)` groups findings by issue code, estimates reach and
impact, divides by effort, and sorts by resulting ROI score.

This is the file's central prioritization engine.

### 5. Buckets findings into an action plan

`_build_action_plan(...)` converts prioritized findings into:

- `quickWins`
- `shortTerm`
- `mediumTerm`
- `longTerm`

This is the bridge from analysis to implementation planning.

### 6. Adds benchmark framing and summary text

`_compare_benchmarks(...)` compares available client metrics against internal
benchmark tables.

`_generate_executive_summary(...)` then produces a summary either by:

- calling Claude if `anthropic` and `ANTHROPIC_API_KEY` are available
- falling back to template-generated prose

### 7. Persists trend snapshots

`_load_and_save_trend(...)` stores per-domain health snapshots under a history
directory and returns time-series data for the report layer.

## Interactions With Other Scripts

This module depends on nearly the entire backend analyzer contract. It is only
as good as the shape and quality of the upstream analyzer outputs.

It also feeds directly into:

- HTML report rendering
- presentation layers
- any client-facing grading or action-plan views
- trend-history storage on disk

This is the module where schema inconsistencies elsewhere become product-level
problems.

## Strengths

- coherent synthesis pipeline in one place
- explicit weighting, impact, effort, and benchmark tables
- graceful fallback when AI summary generation is unavailable
- trend tracking gives audits longitudinal value, not just one-off snapshots

## Weaknesses

### Finding extraction is narrower than the analyzer surface

`_extract_all_findings(...)` only reads a subset of available analyzer outputs.

Large parts of the backend are not represented here, including much of:

- backlink issue detail
- competitor analysis
- local SEO nuance
- other analyzer-specific risk signals

This means the final prioritization layer can present a clean summary while
quietly omitting meaningful upstream findings.

### Summary-count findings are underweighted during prioritization

Thin-content and duplicate-content findings are created with an `affectedCount`,
but `_prioritize_findings(...)` ignores that field and increments count based on
the number of grouped records.

So a synthesized finding representing 40 affected pages is still counted like
one grouped issue.

That is a real prioritization bug because it understates the reach of
summary-based issues.

### Benchmark table and extraction logic are out of sync

The benchmark table includes entries like:

- `content_word_count`
- `cwv_pass_rate`

But `_compare_benchmarks(...)` never populates client values for those keys.

So parts of the benchmark configuration are effectively dead.

### Trend snapshots can duplicate the current date in returned history

`_load_and_save_trend(...)` loads existing snapshots, then writes today's
snapshot, then appends today's date and score to the returned arrays again.

If today's snapshot already existed, the returned `auditDates` and
`compositeScores` can include duplicate entries for the same day.

### Returned category trends lag the current run

The function appends today's composite score to the returned arrays, but it does
not append today's category scores to `categoryTrends` before returning.

That makes the trend payload internally inconsistent on the current run.

### Optional Anthropic dependency lives inside the core analyzer

The Claude summary path is pragmatically implemented, but it introduces an
external AI dependency inside the main reporting analyzer rather than isolating
that concern behind a separate summarization service or adapter.

That is an architectural coupling point.

## Failure Modes

- incomplete upstream schema causes silent omission of findings
- summary-based issues get ranked lower than they should
- benchmark output can appear sparse or inconsistent because the config is ahead
  of the extractor
- trend data can become confusing when same-day reruns happen
- executive-summary behavior changes depending on environment configuration

## Improvement Targets

### High priority

- make `_prioritize_findings(...)` honor `affectedCount` when present
- expand `_extract_all_findings(...)` to cover more of the analyzer surface
- fix same-day trend duplication and append current category scores consistently
- either wire all benchmark definitions to actual extraction or remove dead
  benchmark entries

### Medium priority

- move AI summary generation behind a clearer abstraction boundary
- define a more explicit contract for the issue schema all analyzers should
  produce

## Bottom Line

`reporting_intelligence.py` is one of the most important files in the backend.

It is where the platform turns many technical signals into a story the report
can actually use. The design is directionally strong, but several weighting,
coverage, and history-tracking details are currently capable of distorting the
final message the user sees.
