# Script Audit: `archive/generate-presentation-v2.js`

Last updated: 2026-04-18

File: [archive/generate-presentation-v2.js](/root/site-audit/archive/generate-presentation-v2.js:1)

## Purpose

Large historical PowerPoint generator for one specific SEO audit deliverable.

It assembles a presentation with:

- fixed branding
- hardcoded metrics
- hardcoded competitor analysis
- hardcoded strategy recommendations

## How It Works

The script builds slides directly with `pptxgenjs`, defining all content in code
and writing the final `.pptx` to a hardcoded Windows path.

## Weaknesses

- completely client-specific and data-specific
- no external data loading
- no templating or normalization layer
- hardcoded output path
- maintenance burden is high because the content itself is embedded in code

## Bottom Line

Important historical context: this shows an earlier, hand-authored deliverable
workflow before the repo moved toward reusable generators. It is not current
architecture.
