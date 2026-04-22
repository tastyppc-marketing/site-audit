# Script Audit: `platform/scripts/build_audit.py`

Last updated: 2026-04-17

File: [platform/scripts/build_audit.py](/root/site-audit/platform/scripts/build_audit.py:1)

## Purpose

`build_audit.py` is the central Python orchestrator for the analyzer pipeline.
Its job is to read already-collected research data, run the Python analyzers in
a fixed order, merge those outputs into a single `audit-data.json` payload, and
prepare summary fields used by the report.

This is an orchestration script, not a raw data collection script.

## CLI Surface

Declared arguments:

- `--type` (`seo` or `ppc`)
- `--domain`
- `--competitors`
- `--output`
- `--research-dir`
- `--report`
- `--skip-api`
- `--target-cpa`
- `--verbose`
- `--client-config`

The file advertises itself as a full audit builder, but in practice it only
works if the expected research JSON files already exist in `--research-dir`.

## Step Registry

The SEO pipeline is statically declared in `SEO_STEPS`:

1. `content_quality`
2. `internal_linking`
3. `technical_seo`
4. `backlinks`
5. `competitor`
6. `local_seo`
7. `indexation`
8. `eeat`
9. `content_gap`
10. `reporting`

That order matters because later steps read fields produced by earlier ones.

## Inputs

### Direct runtime inputs

- CLI args
- environment-backed `Settings()`
- optional `client-config.json`

### Research JSON inputs from `--research-dir`

Loaded directly or indirectly:

- `crawl-data.json`
- `link-graph.json`
- `page-text-analysis.json`
- `local-seo.json`
- `reviews.json`
- `search-console-pages.json`
- `brand-mentions.json`
- PPC JSON files such as `campaigns.json`, `ad-groups.json`, `keywords.json`,
  `search-terms.json`

## Output

Primary output is a single `audit_data` object later written to the requested
`--output` path.

Important top-level keys it can populate:

- `client`
- `contentQuality`
- `internalLinking`
- `technicalSeo`
- `backlinks`
- `domainMetrics`
- `backlinkOpportunities`
- `competitorAnalysis`
- `localSeo`
- `indexationCrawlability`
- `eeatSignals`
- `contentGap`
- `topicalAuthority`
- `unlinkedMentions`
- `reportingIntelligence`
- `topIssues`
- `actionPlan`
- `quickWins`

## How It Works

### 1. Bootstraps minimal client metadata

At startup it initializes:

- `client.website`
- `client.websiteUrl`
- `client.auditDate`

This is only a partial client object. Many renderer-facing client fields are
still expected to be filled elsewhere.

### 2. Merges optional access settings from `client-config.json`

If `client-config.json` is supplied, it copies Search Console, GA4, and GBP
identifiers into runtime settings when `hasAccess` is true.

That means API access is partly controlled by `.env` and partly overridden at
run time by client config.

### 3. Executes each step sequentially

Each step is looked up by method name and executed through `_run_step()`.
Failures are recorded, but the overall process continues instead of aborting.

This is useful for partial audits, but it also means a run can "complete" with
major missing sections and no hard stop.

### 4. Performs per-step schema adaptation

The strongest example is `_build_content_quality_payload()`, which transforms
analyzer-native output into the camelCase shape the HTML renderers expect.

This is good in principle, but only done for some sections. Other sections are
still normalized later by the Node report generator.

## Step-by-Step Behavior

### `_run_content_quality`

- Reads `crawl-data.json`
- Merges in `page-text-analysis.json` by URL
- Runs `ContentQualityAnalyzer.analyze_batch()`
- Optionally builds cannibalization data from
  `search-console-query-pages.json`
- Converts output into renderer-facing `contentQuality`

This is one of the cleaner integrations in the repo.

### `_run_internal_linking`

- Reads `link-graph.json` and `crawl-data.json`
- Computes sitemap URL list
- Builds homepage URL from `--domain`
- Runs `InternalLinkAnalyzer.analyze()`

Potential issue: if `link-graph.json` is absent, it passes `{}` as edges and
still tries to produce a result. That can mask upstream collection failures.

### `_run_technical_seo`

- Reads `crawl-data.json`
- Runs `TechnicalSeoAnalyzer.analyze(pages, homepage)`

This step depends entirely on crawl quality. If the crawl omits headers,
canonicals, schema details, or redirects, the analyzer can only score what it
was given.

### `_run_backlinks`

- Requires DataForSEO credentials
- Parses competitors from CLI
- Runs `BacklinkAnalyzer.analyze()`
- Runs `find_link_opportunities()` when competitors are present

This step is API-backed and relatively self-contained.

### `_run_competitor`

- Requires DataForSEO credentials
- Parses competitors from CLI
- Pulls tracked keywords from `self.audit_data["keywords"]`
- Runs `CompetitorAnalyzer.analyze()`

Structural weakness: `keywords` may still be empty here because no earlier step
guarantees that `self.audit_data["keywords"]` has been populated before the
competitor step runs.

### `_run_local_seo`

- Reads `crawl-data.json`
- Reads `local-seo.json`
- Reads `reviews.json`
- Derives location keywords from `client.location`
- Runs `LocalSeoAnalyzer.analyze()`

Structural weakness: `client.location` is not actually established by this
script unless upstream data already inserted it. So location-based local SEO
logic can quietly degrade to no-op behavior.

### `_run_indexation`

- Reads `crawl-data.json`
- Reads optional `search-console-pages.json`
- Runs `IndexCrawlabilityAnalyzer.analyze()`

This is a good example of an analyzer designed to work both with and without
Google data.

### `_run_eeat`

- Reads `crawl-data.json`
- Runs `EEATSignalAnalyzer.analyze()`

Straightforward dependency chain.

### `_run_content_gap`

- Requires DataForSEO credentials
- Uses CLI competitors, or falls back to discovered competitors from
  `competitorAnalysis`
- Pulls client and competitor organic keywords from DataForSEO
- Reads `brand-mentions.json`
- Reads existing backlink domains from `self.audit_data["backlinks"]`
- Produces `contentGap`, `topicalAuthority`, and `unlinkedMentions`

This step assumes the backlink step ran first and succeeded. That dependency is
implicit, not enforced.

### `_run_reporting`

- Runs `ReportingIntelligenceAnalyzer.analyze(self.audit_data, domain=...)`
- Copies final grade into `client.overallGrade`
- Copies executive summary into `client.gradeSummary`
- Derives `topIssues`
- Derives `actionPlan`
- Derives summary `quickWins`

This is the only step that actively fills report-summary fields expected by the
front-end pages.

## Dependencies

### Internal Python dependencies

- `audit_platform.config.settings.Settings`
- all analyzers under `platform/src/audit_platform/analyzers`
- selected connectors under `platform/src/audit_platform/connectors`

### External/API dependencies

- DataForSEO for backlinks, competitor analysis, content gap
- optional Google Ads for PPC
- optional local research JSON for local SEO and indexation enrichments

## What Calls It

From what is currently checked in, `build_audit.py` is a standalone entrypoint.
It is documented as a primary pipeline script, but I have not yet found a
higher-level checked-in runner that reliably invokes it as part of the Node
template workflow.

That matters: the Python pipeline exists, but the main client report workflow
does not appear to be cleanly wired to it.

## Failure Modes

### Silent partial success

If a dependency is missing, many steps return `{}` rather than failing hard.
That keeps the run alive but makes incomplete audits look healthy at a glance.

### Upstream JSON contract mismatch

Every analyzer depends on the shape of research JSON. If the collection scripts
change field names or omit fields, this script usually does not validate those
contracts aggressively.

### Duplicate normalization layers

This script partially shapes renderer-facing data, but the report generator
later performs another large normalization pass. That creates two sources of
truth for final schema adaptation.

### Incomplete client metadata

Only minimal client fields are initialized here. Many report-facing fields are
expected to come from somewhere else, which increases drift risk.

## Architectural Assessment

This file is valuable, but it is not the real single source of truth for the
system.

Current role in practice:

- Python analyzer orchestrator
- partial contract adapter
- partial report summary generator

What it is not yet:

- full audit orchestrator
- research collector
- definitive schema owner

## Improvement Targets

### High priority

- Make this script the authoritative schema assembler, or remove that role from
  the Node report generator. Right now both layers normalize data.
- Add hard validation for required research files per step.
- Emit a machine-readable completeness report, not just console summaries.
- Promote implicit dependencies to explicit ones, especially keywords before
  competitor analysis and backlinks before content-gap mention checks.

### Medium priority

- Define and validate JSON contracts for each research artifact before analyzer
  execution.
- Require `client.location` and similar report-critical metadata at startup if
  downstream steps depend on them.
- Add a strict mode that fails the run if core sections are missing.

### Low priority

- Split SEO and PPC orchestration into clearer modules once the contracts are
  stable.
- Reduce mutation of shared `audit_data` state by using step result objects and
  a final assembler phase.

## Bottom Line

`build_audit.py` is the Python-side orchestration backbone, but it is only one
half of the real system. It assumes upstream research JSON exists, and it does
not own the final report contract by itself. The report generator still performs
substantial auto-population and normalization afterward, which is a core reason
the data flow is hard to reason about and hard to trust.
