# Site Audit Platform — Claude Code Instructions

## Required Reading
Before running any SEO or PPC audit, read and follow:
- **`docs/SEO-AUDIT-SYSTEM.md`** — Definitive reference for the entire audit workflow: every step, every script, every API call, every expected output. **Read this first whenever starting an audit.**
- **`AUDIT-SOP.md`** — Mandatory standards for every audit (data collection, report quality, deliverables)
- **`HANDOFF.md`** — Current system state, data normalization pipeline, verification checklist, and troubleshooting guide

## Project Structure
- `platform/` — Python audit platform (analyzers, connectors, models)
- `template/` — Reusable starter template (scripts, reports, package.json)
- `clients/` — Client-specific audit projects
- `commands/` — Claude skill definitions (/seo-audit, /ppc-audit, etc.)

## Key Rules
1. **Always use DataForSEO for real numbers** — never qualitative volume estimates
2. **Always extract real page text** for readability scoring — never estimate from metadata
3. **Every report section must be populated** — no "data not available" unless we truly lack access
4. **Log every process** to `seo/audit-log.md` with timestamps and status
5. **Verify location accuracy** — service area maps must point to the correct city
6. **Canadian clients use Canadian English** — CMHC, RRSP, neighbourhood, etc.

## Data Integrity Rules (learned the hard way)
7. **Never hardcode client-specific data in templates** — no coordinates, no competitor names, no domain lists. Everything must come from `audit-data.json` or sibling research files. If you see hardcoded data from a previous client in a template file, that's a bug.
8. **Cross-reference audit-data.json against research files before finalizing** — the audit agents sometimes hallucinate numbers (wrong platforms, inflated page counts, made-up review numbers). Always verify `competitorComparison`, `siteComparison`, and `client.platform` against `seo/research/competitor-analysis.md`.
9. **Detect stale/copy-pasted data** — when all competitors show identical scores for a metric (e.g., everyone has the same PageSpeed), that's stale data copied from the client entry, not real measurements. Check and fix before generating.
10. **Research files are the source of truth, audit-data.json is the shaped view** — the generate script auto-populates many fields from research files. Don't manually duplicate data that the normalizer handles (see HANDOFF.md for the full list).

## Report & Template Rules
11. **After ANY template change, regenerate the client report** — the HTML has inlined data, so editing `audit-data.json` or template JS/CSS alone doesn't update what the client sees. Always run `generate-multipage-report.js`.
12. **Use `<table>` for tabular data, not CSS grid or flexbox** — grid/flexbox fight with mixed-width columns, badges, and wrapping text. Native tables handle this correctly.
13. **Use log scale when comparing a new site vs established competitors** — linear charts make the smaller site invisible when gaps are 10x-100x+.
14. **CSS `max-height` on chart containers will silently cap Chart.js canvases** — use the `chart-tall` class to override when a chart needs more than 350px.
15. **IntersectionObserver scrollspy must use topmost-visible-section, not last-intersecting** — the naive approach breaks during fast scrolling and anchor-link clicks. Both `nav.js` and `explainer.js` use this pattern.

## Save Points
- `a986ae3` — Full system + Calgary Castles client data (pre-optimize-page)
- `ffff44e` — Template + workflow only (before client data commit)
- `4b970c6` — Same as a986ae3 + HANDOFF.md
