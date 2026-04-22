# Script Audit: `archive/debug-google.js`

Last updated: 2026-04-18

File: [archive/debug-google.js](/root/site-audit/archive/debug-google.js:1)

## Purpose

Google SERP debugging script used to inspect whether Playwright-based Google
search scraping was being blocked.

## How It Works

It loads one hardcoded Google query, checks for markers like:

- `captcha`
- `consent`
- `unusual traffic`

then prints selector counts and saves a screenshot to a hardcoded Windows path.

## Weaknesses

- hardcoded query and output path
- no CLI
- tightly coupled to one developer workstation path
- diagnostic only, not a reusable search primitive

## Bottom Line

Historical troubleshooting script for Google scraping reliability.
