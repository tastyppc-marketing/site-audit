# Script Audit: `archive/google-search.js`

Last updated: 2026-04-18

File: [archive/google-search.js](/root/site-audit/archive/google-search.js:1)

## Purpose

Earlier Google search scraper that predates `google-search-v2.js`.

## How It Works

It loads a direct Google search URL, optionally runs headed mode, applies a
Park City geolocation context, scrapes result selectors, and reports positions
for two hardcoded domains.

## Weaknesses

- simpler and more brittle than the v2 version
- hardcoded target domains and geolocation
- tied to Google DOM structure
- historical exploratory utility, not reusable platform code

## Bottom Line

First-generation Google scraping probe. Useful for codebase history, not for
current production use.
