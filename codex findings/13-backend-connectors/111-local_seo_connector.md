# Script Audit: `platform/src/audit_platform/connectors/local_seo.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/local_seo.py](/root/site-audit/platform/src/audit_platform/connectors/local_seo.py:1)

## Purpose

`local_seo.py` is presented as a local SEO connector, but in practice it is a
small orchestration and scoring layer built on top of other sources and static
heuristics.

It provides four main features:

- NAP consistency checking
- local-pack checking
- Google Business Profile completeness scoring
- citation opportunity lists

This distinction matters because the file name sounds like a live data
connector, while much of the implementation is advisory logic rather than true
data acquisition.

## Inputs

Primary dependencies:

- `BaseConnector`
- `Settings`
- `BrandMentionsConnector`
- `DataForSEOConnector`

Primary runtime inputs:

- business name
- address
- phone number
- domain
- keywords
- location
- industry
- a pre-fetched GBP profile dict

## Outputs

This file returns plain dict/list structures representing:

- NAP-check rows
- local-pack rows
- completeness scores
- citation opportunities

The outputs are human-readable, but several names imply a stronger confidence
level than the underlying logic really supports.

## How It Works

### 1. Delegates NAP checking to directory heuristics

`check_nap_consistency(...)` creates a `BrandMentionsConnector`, derives a
location from the address, and asks the brand-mentions layer to check whether
the business appears in major directories.

### 2. Delegates local-pack retrieval to DataForSEO when available

`check_local_pack(...)` calls `_check_local_pack_via_dataforseo(...)` if
credentials exist, otherwise it returns placeholder rows.

### 3. Scores GBP completeness from a provided dict

`analyze_gbp_completeness(...)` is a weighted checklist over a profile dict. It
does not fetch the profile itself.

### 4. Returns static citation lists

`find_citation_opportunities(...)` combines a general citation list with a few
industry-specific entries and adds a simple location-specific chamber-of-
commerce suggestion.

## Strengths

- easy to read and reason about
- composes other connectors instead of duplicating their transport logic
- useful as a starter heuristic layer for local SEO recommendations

## Weaknesses

### `check_nap_consistency(...)` does not actually verify most of NAP consistency

The method computes canonical normalized name, address, and phone values, but
it does not use them meaningfully. Address and phone verification remain
unknown, and helper methods like `_text_similarity(...)` are effectively unused
in the real flow.

So the function is much closer to "directory presence check" than real NAP
consistency validation.

### `in_local_pack` is semantically wrong

In `_check_local_pack_via_dataforseo(...)`, `entry["in_local_pack"]` becomes
`True` whenever the keyword returns any local-pack items.

The code does not verify that the target business is actually in the pack.
Right now the field really means "a local pack existed for this query," not
"this business appeared in the local pack."

That is a real data-contract problem.

### GBP completeness is scoring-only, not connector-driven

`analyze_gbp_completeness(...)` accepts a provided dict and scores it. It is a
useful helper, but it is not a live connector path.

### Citation opportunities are curated suggestions, not discovered opportunities

`find_citation_opportunities(...)` returns a mostly static recommendation list.
That is fine for advisory use, but it should not be mistaken for discovered,
site-specific opportunity intelligence.

## Failure Modes

- local-pack visibility can be overstated because presence of any pack is
  treated like presence of the business
- NAP consistency can be overstated because the function does not truly compare
  address and phone values
- consumers can assume these are evidence-backed findings when several are
  recommendation heuristics

## Improvement Targets

### High priority

- change the `in_local_pack` contract so it only becomes `True` when the target
  business is explicitly matched in the pack
- either implement real NAP comparison or rename the method/output so it does
  not overpromise
- separate connector outputs from advisory scoring outputs

### Medium priority

- remove or wire up unused normalization/similarity helpers
- let citation-opportunity logic consume real business/category/location data
  more explicitly

## Bottom Line

`local_seo.py` is useful as a heuristic support layer, but it is one of the
clearest examples in the repo of names that imply stronger evidence than the
code actually gathers.

If the current problem is "bad local data is being pulled in," this file should
be examined closely because one of its flagship fields, `in_local_pack`, is
currently mislabeled by behavior.
