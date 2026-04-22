# Script Audit: `archive/generate-spreadsheet-v2.js`

Last updated: 2026-04-18

File: [archive/generate-spreadsheet-v2.js](/root/site-audit/archive/generate-spreadsheet-v2.js:1)

## Purpose

Large historical spreadsheet generator for one specific SEO audit engagement.

It writes a workbook containing:

- executive summary
- keyword research
- competitor comparison
- action plan
- content calendar
- deliverables summary
- competitor deep dives

## How It Works

The script stores all sheet data as hardcoded arrays, builds a workbook with
`xlsx`, and writes the file to a hardcoded Windows path.

## Weaknesses

- fully hardcoded client deliverable
- no dynamic data ingestion
- no schema validation because the content is authored inline
- not reusable across clients without manual editing

## Bottom Line

Historical manual-deliverable generator. Valuable for lineage, but superseded by
the later reusable reporting scripts.
