# Script Audit: `platform/src/audit_platform/connectors/brand_mentions.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/brand_mentions.py](/root/site-audit/platform/src/audit_platform/connectors/brand_mentions.py:1)

## Purpose

`brand_mentions.py` is a lightweight mention-discovery connector built mostly
from public scraping patterns rather than official APIs.

It attempts to gather:

- Reddit mentions
- DuckDuckGo web mentions
- YouTube mentions
- directory-listing presence
- a coarse review summary derived from directory checks

This file matters because it feeds or supports local SEO and off-site brand
visibility work, but its outputs are much more heuristic than the connector
name suggests.

## Inputs

Primary dependencies:

- `BaseConnector`
- `Settings`
- `httpx`
- `json`, `re`, and `urllib.parse`

Primary runtime inputs:

- brand names
- domains
- locations
- subreddit lists
- free-form search queries

## Outputs

This connector returns plain dict and list structures for:

- Reddit posts
- web mention rows
- YouTube video rows
- directory-check rows
- review summary aggregates

There are no typed backend models here, so downstream code is relying on
informal dict contracts.

## How It Works

### 1. Uses a defensive GET helper

`_safe_get(...)` wraps `self.sync_client.get(...)`, applies browser-like
headers, rate-limits requests, retries once on `429`, and converts failures
into `None` instead of raising.

### 2. Pulls Reddit mentions from the public JSON endpoint

`search_reddit(...)` hits Reddit's public search JSON, then flattens each post
into a small dict.

### 3. Scrapes DuckDuckGo HTML search results

`search_web_mentions(...)` runs quoted brand/domain queries against
DuckDuckGo's HTML interface and parses the markup with regexes.

### 4. Scrapes YouTube search HTML

`search_youtube(...)` pulls the search page HTML and tries to extract the
embedded `ytInitialData` JSON blob.

### 5. Uses search-result heuristics for directory presence

`check_directory_listings(...)` hits directory search pages and marks a listing
as found if the business name appears anywhere in the returned HTML.

### 6. Builds a review summary from directory heuristics

`get_review_summary(...)` aggregates ratings and review counts from the
directory-check results.

## Strengths

- useful for cheap exploratory mention gathering without paid APIs
- resilient in the sense that most failures degrade to partial results instead
  of crashing the caller
- the file is easy to understand because each source has a small dedicated path

## Weaknesses

### This is a scraper-heavy heuristic connector, not a strong source-of-truth layer

Reddit aside, most of the file works by scraping public HTML and inferring
meaning from page content. That can be useful, but it is much less reliable
than a connector backed by a stable API contract.

### Directory detection is especially weak

`check_directory_listings(...)` marks a business as found when the business name
string appears anywhere in the search page HTML. It does not confirm an actual
listing match, and it sets `listing_url` to the search URL rather than the real
profile URL.

That means downstream code can treat search-page evidence like verified listing
evidence.

### The directory set is not business-type aware

The default directory list includes real-estate-specific sources like
`Realtor.com` and `Zillow` for every business. That creates noisy false
negatives and makes the directory scan look broader than it really is.

### Review aggregation is coarse and can mislead

`get_review_summary(...)` averages ratings across platforms without weighting by
review count. A platform with 2 reviews influences the final average as much as
a platform with 200 reviews.

### HTML parsing is brittle

DuckDuckGo and YouTube parsing both depend on markup/embedded-JSON structures
that can change at any time. The code handles failure gracefully, but result
quality can silently degrade.

### The connector does not consistently use the base transport abstraction

This file uses `self.sync_client` directly rather than a shared retry-aware base
request helper. It has some local handling, but transport behavior is still
connector-specific.

## Failure Modes

- false positives in directory presence because search pages are treated as
  listing confirmation
- false negatives when public HTML layouts change or anti-bot behavior kicks in
- misleading review summaries because ratings are aggregated from weak evidence
- downstream consumers can over-trust outputs that are really best-effort
  heuristics

## Improvement Targets

### High priority

- split "search-result evidence" from "verified listing evidence" in the output
  schema
- make directory checking industry-aware instead of using a single hardcoded
  directory list
- stop treating the search URL as the listing URL
- weight aggregate ratings by review count when enough data exists

### Medium priority

- move sync HTTP calls onto a shared retry-aware base helper
- replace regex-heavy parsers with source-specific parsers where practical
- document the confidence level of each source explicitly in the returned data

## Bottom Line

`brand_mentions.py` is useful as a low-cost discovery layer, but it should not
be treated as a high-confidence data connector.

If bad pulled data is showing up in off-site mention or directory-related
outputs, this file is a realistic root-cause candidate because several fields
look stronger than the underlying evidence really is.
