# Script Audit: `archive/check-schema-detail.js`

Last updated: 2026-04-18

File: [archive/check-schema-detail.js](/root/site-audit/archive/check-schema-detail.js:1)

## Purpose

Tiny Playwright probe for one competitor page (`/aerie/`) to inspect:

- JSON-LD schema
- Open Graph tags

## How It Works

It opens one hardcoded URL, extracts matching DOM nodes, and prints the results.

## Weaknesses

- single-page, single-purpose, hardcoded
- no error handling beyond default Playwright failure
- no reuse path

## Bottom Line

Pure debug artifact. Useful only as historical evidence of ad hoc competitor
inspection.
