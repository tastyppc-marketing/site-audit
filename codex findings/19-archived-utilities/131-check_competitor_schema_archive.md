# Script Audit: `archive/check-competitor-schema.js`

Last updated: 2026-04-18

File: [archive/check-competitor-schema.js](/root/site-audit/archive/check-competitor-schema.js:1)

## Purpose

One-off Playwright probe for `laurawillisrealestate.com` that inspects:

- homepage schema
- image alt coverage
- social meta
- basic technical counts
- one specific blog post's schema

## How It Works

The script launches Chromium, visits hardcoded URLs, runs a few DOM queries in
`page.evaluate(...)`, and prints JSON blocks to stdout.

## Weaknesses

- fully hardcoded to one competitor and one blog URL
- no CLI, no output persistence, no reusable library structure
- effectively a manual inspection script rather than part of the toolchain

## Bottom Line

Historical exploratory script. Useful for understanding how competitor research
was done manually, but not part of the current architecture.
