# Script Audit: `archive/check-remaining.js`

Last updated: 2026-04-18

File: [archive/check-remaining.js](/root/site-audit/archive/check-remaining.js:1)

## Purpose

One-off page sampler for a hardcoded list of `livingparkcityutah.com` URLs.

It reports title, description, headings, word count, image counts, canonical,
schema presence, and internal/external link counts.

## How It Works

The script iterates a fixed URL list in Playwright, extracts page-level metrics
with DOM queries, and logs a console summary per page.

## Weaknesses

- hardcoded page inventory
- no export format beyond console output
- no schema/model contract
- clearly tied to a specific audit moment and client

## Bottom Line

Historical manual-survey tool. Good context for earlier auditing workflows, but
not reusable production infrastructure.
