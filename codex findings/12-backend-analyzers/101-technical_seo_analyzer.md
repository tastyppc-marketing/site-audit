# Script Audit: `platform/src/audit_platform/analyzers/technical_seo.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/analyzers/technical_seo.py](/root/site-audit/platform/src/audit_platform/analyzers/technical_seo.py:1)

## Purpose

`technical_seo.py` is the backend technical-audit aggregator for crawl data.

It covers:

- titles and meta descriptions
- template detection
- image alt coverage
- URL structure
- canonical analysis
- redirect chains
- security headers
- indexability
- mobile usability
- structured-data validation

This is one of the core analyzers feeding the final site audit.

## Inputs

Primary dependencies:

- `structlog`
- crawl-page dictionaries
- optional homepage URL

Important note:

- the file also contains `audit_sitemap(...)`, but the main `analyze(...)`
  method does not call it

## Outputs

The main `analyze(...)` method returns:

- `metaTagSummary`
- `metaTagIssues`
- `templateDetection`
- `imageAudit`
- `urlStructure`
- `crawlIssues`
- `schemaSummary`
- `canonicalAudit`
- `redirectChains`
- `securityHeaders`
- `indexability`
- `mobileUsability`
- `structuredDataValidation`

## How It Works

### 1. Runs a sequence of sub-audits over crawl data

The analyzer is mostly a coordinator around specialized methods such as:

- `audit_meta_tags(...)`
- `detect_templates(...)`
- `audit_images(...)`
- `audit_url_structure(...)`
- `audit_canonicals(...)`
- `audit_redirect_chains(...)`
- `audit_security_headers(...)`
- `audit_indexability(...)`
- `audit_mobile_usability(...)`
- `validate_structured_data(...)`

### 2. Normalizes outputs into a single `technicalSeo` structure

Each sub-audit produces a report-friendly dict, and the top-level `analyze(...)`
method merges those into the backend technical SEO payload.

### 3. Also contains sitemap validation

The file includes `audit_sitemap(...)`, which cross-references sitemap URLs with
crawl results, but that logic currently sits outside the main analysis flow.

## Interactions With Other Scripts

This file is upstream of:

- technical SEO report sections
- reporting-intelligence category scoring
- several platform tests

Because it is such a central upstream producer, any contract mismatch here
propagates widely.

## Strengths

- broad coverage of technical SEO topics in one backend module
- generally readable separation by audit area
- many outputs are already shaped for direct report consumption

## Weaknesses

### Missing canonical tags are counted but not emitted as issues

`audit_meta_tags(...)` tracks `pagesWithoutCanonical`, but it does not append a
corresponding issue record.

`audit_canonicals(...)` then skips pages with no canonical entirely.

So the analyzer knows missing canonicals exist, but the issue layer does not
surface them. That is a real data-loss bug.

### Short meta descriptions are counted but not emitted as issues

`audit_meta_tags(...)` increments `descriptionTooShort`, but unlike the long-
description path, it does not append a `DESCRIPTION_TOO_SHORT` issue.

That creates another summary-versus-issue mismatch.

### Structured-data validity counts are overstated

`validate_structured_data(...)` increments `validSchemas` for every non-parse-
error item even if `_validate_single_schema(...)` just added required-field
issues for it.

So the summary can claim schemas are valid while also recording missing required
fields on those same items.

### Sitemap validation exists but is not part of the main analyzer pipeline

`audit_sitemap(...)` is defined, useful, and clearly in-scope for technical SEO,
but `analyze(...)` never calls it.

That means sitemap issues are excluded from the main `technicalSeo` payload.

### Header parsing depends on a very specific response-header shape

`audit_security_headers(...)` looks for camelCase keys like
`strictTransportSecurity`.

If the crawl pipeline stores literal HTTP header names instead, coverage can be
underreported and missing-header issues can be false positives.

### Some issue vocabularies do not line up cleanly with downstream consumers

For example, canonical analysis emits `CANONICAL_CHAIN`, while later
prioritization logic focuses on a different canonical issue vocabulary.

That is a cross-layer contract-drift risk.

## Failure Modes

- summaries and issue lists can disagree on what is actually wrong
- sitemap problems are invisible unless callers invoke a separate method
- structured-data summaries can overstate validity
- downstream prioritization can miss or underweight issues due to naming drift

## Improvement Targets

### High priority

- emit explicit issue records for missing canonicals and short meta descriptions
- fix structured-data validity counting so summary numbers reflect actual
  validation status
- decide whether sitemap validation belongs in the main `analyze(...)` output
  and wire it in if yes
- standardize issue codes against downstream reporting-intelligence mappings

### Medium priority

- make header extraction more tolerant of header-name casing and storage shape
- remove unused constants or finish the logic they were meant to support

## Bottom Line

`technical_seo.py` is a central and valuable backend module, but it has several
important summary-to-issue contract gaps.

That matters because this file is not just another analyzer. It is one of the
main producers the rest of the audit architecture trusts.
