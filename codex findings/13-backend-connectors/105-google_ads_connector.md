# Script Audit: `platform/src/audit_platform/connectors/google_ads.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/google_ads.py](/root/site-audit/platform/src/audit_platform/connectors/google_ads.py:1)

## Purpose

`google_ads.py` is the backend connector for Google Ads account data.

It fetches:

- campaigns
- ad groups
- keywords
- search terms
- campaign time series
- account recommendations

and normalizes those into PPC models or plain dicts for the PPC analyzer and
report stack.

## Inputs

Primary dependencies:

- `GoogleAdsClient`
- OAuth credentials from the auth layer
- PPC models from `audit_platform.models.ppc`

Primary runtime inputs:

- customer ID
- optional campaign ID
- GAQL date-range literal

## Outputs

This connector returns:

- `CampaignRecord`
- `AdGroupRecord`
- `KeywordPPCRecord`
- `SearchTermRecord`
- plain dicts for campaign performance and recommendations

## How It Works

### 1. Builds a Google Ads client lazily

The client is initialized from settings-backed OAuth and developer-token data.

### 2. Runs GAQL queries through one helper

`_search(...)` centralizes GAQL execution and exception logging.

### 3. Normalizes common PPC entities

Each public method issues a specific GAQL query and translates rows into model
records or report-friendly dicts.

## Strengths

- clearer than a lot of ad-hoc PPC extraction codebases
- one GAQL helper keeps query execution consistent
- uses typed PPC models for the main entity-level outputs

## Weaknesses

### Campaign budget normalization is incomplete

`get_campaigns(...)` selects `campaign.campaign_budget`, which is a resource
name, not the budget amount itself.

The connector then tries to convert that field to dollars, catches the failure,
and stores `0.0`.

So `budget_amount` is effectively a placeholder, not real budget data, unless a
future hydration path is added. That is a meaningful data-quality issue.

### The connector collects OAuth credentials it never uses directly

`_get_client(...)` calls `get_oauth_credentials(...)` and stores the result in a
local variable that is never used.

That is not a functional bug by itself, but it is a sign of setup drift.

### Keyword output omits fields the PPC analyzer would benefit from

The backend PPC analyzer later looks for values like:

- QS subcomponent statuses
- bidding strategy on keyword rows

This connector does not return those fields in `KeywordPPCRecord`, which means
some PPC checks can only partially execute or silently become less informative.

### Query execution is eager and fully materialized

`_search(...)` converts the entire Google Ads response iterator into a list.

That is simple, but it can be expensive for larger accounts and larger date
ranges.

## Failure Modes

- campaign budget data can look present while actually being zero-filled
- PPC analyzer checks can underfire because the connector does not surface all
  the fields they conceptually depend on
- large-account queries can become memory-heavy due to eager list materialization

## Improvement Targets

### High priority

- fetch real campaign budget amounts instead of storing `0.0` placeholders
- align keyword output fields with the PPC analyzer's actual downstream needs

### Medium priority

- remove unused credential setup or wire it through cleanly
- consider streaming or paged handling for large queries where appropriate

## Bottom Line

`google_ads.py` is structurally sound, but one of its most important campaign
fields is not actually populated correctly today.

If the user is seeing PPC budget or configuration anomalies in downstream
reports, this connector is a credible upstream source of that drift.
