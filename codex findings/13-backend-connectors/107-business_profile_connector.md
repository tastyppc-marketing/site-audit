# Script Audit: `platform/src/audit_platform/connectors/business_profile.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/business_profile.py](/root/site-audit/platform/src/audit_platform/connectors/business_profile.py:1)

## Purpose

`business_profile.py` is the backend connector for Google Business Profile
location, performance, keyword, and review data.

This file is particularly important because local SEO analysis is highly
sensitive to account selection and field normalization.

## Inputs

Primary dependencies:

- OAuth credentials from the auth layer
- `BaseConnector`
- local models from `audit_platform.models.local`

Primary runtime inputs:

- optional GBP account ID
- location resource names
- date ranges

## Outputs

The connector returns:

- `BusinessProfileRecord`
- `LocalPerformanceRecord`
- plain dicts for search keywords
- plain dicts for reviews

## How It Works

### 1. Refreshes OAuth tokens lazily

Authenticated requests use `_get_auth_headers(...)`, which refreshes the access
token when needed.

### 2. Resolves an account

If no GBP account ID is supplied, `_resolve_account_id(...)` can:

- use a configured setting
- list available accounts and pick the first one

### 3. Normalizes locations

`get_locations(...)` lists locations and converts them into
`BusinessProfileRecord` instances.

### 4. Normalizes performance time series

`get_performance(...)` aggregates per-metric daily series into one
`LocalPerformanceRecord` per day.

### 5. Fetches optional keyword and review data

The connector also exposes search-keyword and review retrieval with graceful
fallback behavior for partially available APIs.

## Strengths

- broad GBP surface coverage in one place
- daily performance normalization is reasonably clean
- review and keyword retrieval handle some availability failures gracefully

## Weaknesses

### Account auto-selection can pull data from the wrong account

If no GBP account ID is configured, `_resolve_account_id(...)` lists accounts
and picks the first one.

That is convenient, but it is risky in a multi-account environment and can
silently produce the wrong business's data.

### The connector bypasses base request helpers

Like other sync connectors, it uses `self.sync_client` directly instead of a
retry-aware shared request helper.

### Review rating field does not match downstream local-analyzer expectations

`get_reviews(...)` emits:

- `star_rating`

but `LocalSeoAnalyzer.analyze_review_sentiment(...)` looks for:

- `rating`
- `starRating`

That is a cross-layer contract bug. It can cause rating-based fallback logic in
the local analyzer to miss review ratings entirely.

### Review API path is knowingly legacy / unstable

The file itself notes that the reviews endpoint is on the deprecated v4
`mybusiness` surface and flags migration risk in the docstring.

That makes review retrieval an explicit maintenance hotspot.

### Verification status is inferred from a metadata field

`_parse_location(...)` maps `is_verified` from `hasVoiceOfMerchant`.

That may be a useful proxy, but it is still an inferred business meaning rather
than an obviously canonical verification field.

## Failure Modes

- the wrong GBP account can be selected automatically
- review-derived sentiment can underperform because rating fields do not line up
  with downstream expectations
- review retrieval can break or degrade as the older endpoint changes
- sync HTTP reliability depends on direct client calls rather than a shared
  retry path

## Improvement Targets

### High priority

- stop auto-selecting the first account silently in multi-account contexts
- align review field names with `LocalSeoAnalyzer` expectations
- plan migration away from the legacy reviews endpoint

### Medium priority

- route sync HTTP calls through a consistent base helper
- verify whether `hasVoiceOfMerchant` is the right long-term signal for
  `is_verified`

## Bottom Line

`business_profile.py` is valuable, but it has two concrete data-quality risks:

- it can choose the wrong source account
- it emits review fields that do not line up cleanly with the local analyzer

Both are the kind of connector-layer problems that can make downstream local SEO
outputs look wrong even when the analyzers themselves are behaving as written.
