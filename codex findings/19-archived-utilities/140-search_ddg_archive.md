# Script Audit: `archive/search-ddg.js`

Last updated: 2026-04-18

File: [archive/search-ddg.js](/root/site-audit/archive/search-ddg.js:1)

## Purpose

Archived DuckDuckGo search scraper for quick keyword checks.

## How It Works

It opens DuckDuckGo HTML search in Playwright, parses result cards, then checks
whether two hardcoded domains appear in the results.

## Weaknesses

- hardcoded targets
- console-only output
- partially overlaps with later DDG tooling
- historical standalone utility rather than a reusable module

## Bottom Line

Precursor to later DDG-based research utilities. Architecturally minor, but
useful lineage.
