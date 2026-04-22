# Script Audit: `archive/search-bing.js`

Last updated: 2026-04-18

File: [archive/search-bing.js](/root/site-audit/archive/search-bing.js:1)

## Purpose

Archived Bing search scraper for keyword/competitor inspection.

## How It Works

It runs one query in Playwright, extracts organic results, related searches,
local-pack-like results, and checks two hardcoded target domains.

## Weaknesses

- hardcoded target domains
- DOM-selector scraping is brittle
- console-only output
- not integrated with the later audit pipeline

## Bottom Line

Historical search probe that helped compare visibility across engines, but it is
not part of the active architecture.
