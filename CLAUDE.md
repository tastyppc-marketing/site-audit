# Site Audit Platform — Claude Code Instructions

## Required Reading
Before running any SEO or PPC audit, read and follow:
- **`/mnt/c/dev/site audit/AUDIT-SOP.md`** — Mandatory standards for every audit (data collection, report quality, deliverables)

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
