# Script Audit: `archive/google-search-v2.js`

Last updated: 2026-04-18

File: [archive/google-search-v2.js](/root/site-audit/archive/google-search-v2.js:1)

## Purpose

Second-generation Google search scraper using Playwright with basic anti-
detection measures.

It extracts:

- organic results
- People Also Ask prompts
- local-pack names
- positions for two hardcoded target domains

## How It Works

The script opens Google, simulates a more human workflow, hides some automation
signals, then parses SERP DOM selectors.

## Weaknesses

- brittle against Google markup and anti-bot changes
- hardcoded target domains
- mixes search execution, extraction, and reporting in one script
- not safe to treat as a stable long-term connector

## Bottom Line

Historical experiment in Google scraping. Architecturally important because it
shows why the repo moved toward less brittle search approaches.
