# Script Audit: `platform/src/audit_platform/models/ppc.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/models/ppc.py](/root/site-audit/platform/src/audit_platform/models/ppc.py:1)

## Purpose

`ppc.py` defines the normalized records used for Google Ads campaign, ad group,
keyword, and search-term data.

These models are the typed backbone for the Google Ads connector and PPC
analysis flows.

## Inputs

Primary dependencies:

- `pydantic`
- `typing`

Primary runtime producers:

- `GoogleAdsConnector`
- PPC analyzer logic

## Outputs

This file provides:

- `CampaignRecord`
- `AdGroupRecord`
- `SearchTermRecord`
- `KeywordPPCRecord`

## How It Works

The file keeps each PPC entity in its own model and uses simple numeric/string
fields for the common reporting metrics.

## Strengths

- simple and readable
- covers the four main PPC entity types cleanly
- good fit for connector normalization

## Weaknesses

### The schema is quite thin relative to analyzer ambitions

The PPC analyzer and reporting layers talk about structure quality, wasted
spend, budget efficiency, impression share, and quality signals. These models
only capture a subset of that surface.

That means some PPC logic will inevitably reach for loose dicts or connector-
specific fields outside the model layer.

### There is little validation of categorical fields

Fields like `status`, `match_type`, and `bidding_strategy` are plain strings.
That keeps the models flexible, but also allows inconsistent naming to leak
through.

### Records do not carry source timestamps

Unlike some SEO models, these PPC records do not include `fetched_at` or a
source marker.

## Failure Modes

- PPC-specific schema drift can happen outside the model layer because the
  models do not cover all needed metrics
- categorical values can vary by connector behavior or API formatting
- provenance/timing can be harder to track in downstream debugging

## Improvement Targets

### Medium priority

- decide whether the PPC model layer should grow to cover the analyzer's real
  metric needs
- standardize categorical values where practical
- add source/provenance metadata if debugging freshness matters

## Bottom Line

`ppc.py` is clean, but minimal.

Its biggest limitation is not bad design. The limitation is that the models may
be too small for the level of PPC analysis the rest of the repo is trying to
perform.
