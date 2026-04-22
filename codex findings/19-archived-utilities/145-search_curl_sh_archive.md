# Script Audit: `archive/search-curl.sh`

Last updated: 2026-04-18

File: [archive/search-curl.sh](/root/site-audit/archive/search-curl.sh:1)

## Purpose

Minimal shell-based DuckDuckGo query helper.

## How It Works

It URL-encodes a query with inline Python, fetches DuckDuckGo HTML with `curl`,
then pipes the response into another inline Python parser that prints results
and target-domain positions.

## Weaknesses

- hardcoded target domains
- fragile HTML regex parsing
- query handling is shell-fragile because the query is embedded directly into an
  inline Python snippet
- console-only output

## Bottom Line

Tiny archived convenience script. Good example of early exploratory tooling, but
not a maintainable search component.
