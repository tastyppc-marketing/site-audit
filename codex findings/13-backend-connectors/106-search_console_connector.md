# Script Audit: `platform/src/audit_platform/connectors/search_console.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/search_console.py](/root/site-audit/platform/src/audit_platform/connectors/search_console.py:1)

## Purpose

`search_console.py` wraps the Google Search Console API for performance and
basic sitemap / indexing data.

It is one of the cleaner connectors in the backend and a key source for:

- query performance
- page performance
- device and country segmentation
- query-page combinations
- sitemap status

## Inputs

Primary dependencies:

- `googleapiclient`
- OAuth credentials from the auth layer
- `Settings`

Primary runtime inputs:

- site URL
- date range
- dimensions
- row limit

## Outputs

This connector returns normalized dict rows for Search Analytics queries and a
plain dict for indexing / sitemap status.

## How It Works

### 1. Builds the discovery service lazily

`_get_service(...)` initializes the Search Console API client from OAuth-backed
credentials only when first needed.

### 2. Normalizes search-analytics rows

`_query(...)` runs `searchAnalytics.query`, caps the row limit at 25,000, and
flattens the API's `keys` array into dimension-named fields.

### 3. Exposes narrow public wrappers

The public methods are thin wrappers over `_query(...)` for:

- query
- page
- device
- country
- query+page

### 4. Provides basic sitemap status

`get_indexing_status(...)` lists sitemaps and returns aggregate status metadata.

## Strengths

- cleaner and more disciplined than many of the other connectors
- normalized row shape is straightforward and useful
- default date-range handling explicitly accounts for Search Console data lag

## Weaknesses

### The docstring overpromises URL Inspection support

`get_indexing_status(...)` says it attempts URL Inspection first and falls back
to the Sitemaps API.

The implementation does not do that. It only calls the Sitemaps API.

### Pagination is not implemented for Search Analytics

`_query(...)` supports `startRow`, but the public methods do not page through
results.

So large datasets are capped by a single request even when the API could return
more via pagination.

### `close(...)` calls the wrong base method

`SearchConsoleConnector.close(...)` calls `super().close()`, but in
`BaseConnector` that is the async close method.

In this sync method, the coroutine is not awaited. That is a real cleanup bug.

## Failure Modes

- indexing-status behavior can be assumed broader than it really is because the
  docstring is ahead of the implementation
- large query sets can silently truncate at the first page
- connector cleanup can be incomplete due to the sync/async close mismatch

## Improvement Targets

### High priority

- fix the sync `close(...)` implementation so it uses the correct base cleanup
  path
- either implement real pagination in the public query methods or document the
  first-page limit explicitly
- align the `get_indexing_status(...)` docstring with the actual implementation
  or implement the missing inspection path

## Bottom Line

`search_console.py` is one of the better backend connectors, but it still has a
few important contract and lifecycle bugs.

The main concerns here are not normalization quality so much as silent scope
limits and a real cleanup mismatch.
