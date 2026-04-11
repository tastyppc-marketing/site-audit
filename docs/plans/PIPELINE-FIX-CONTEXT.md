# SEO Audit Pipeline Fix — Context Brief

## The Problem

The SEO audit workflow (/seo-audit skill) produces incomplete multipage HTML reports. Many dashboard pages render blank or with missing sections because the data pipeline has gaps at every stage.

## What We Already Know (from 3 research agents)

### Research File 1: Generator Data Contract
**Location:** `clients/liane-jamason/troubleshooting/data-contract-map.md` (884 lines)
- Maps every field every page renderer (pages/*.js) reads from `window.TPPC.data`
- Documents what renders empty when each field is missing
- Documents the normalizer's auto-population behavior (what it derives from sibling JSON files)

### Research File 2: Calgary (working) vs Liane (broken) Diff
**Location:** `clients/liane-jamason/troubleshooting/calgary-vs-liane-diff.md`
- **10 entire top-level sections missing from Liane:** contentQuality, backlinks, internalLinking, technicalSeo, localSeo, indexationCrawlability, eeatSignals, reportingIntelligence, competitorAnalysis, rankHistory
- **4 JSON research files missing:** pagespeed-data.json, domain-metrics.json, client-backlinks.json, page-text-analysis.json
- These 4 files feed the generator's normalizer; without them, auto-population fails silently

### Research File 3: Skill vs Template Gap Analysis
**Location:** `clients/liane-jamason/troubleshooting/skill-vs-template-gap.md` (323 lines)
- **9 contract gaps** between what the skill says to do, what the template expects, and what the generator needs
- All 4 missing JSON files can be produced WITHOUT Google connectors (PSI API + DataForSEO + Playwright)
- The skill's Step 8a field list is incomplete — only covers ~35 fields, generator needs ~200+

## Draft Plan (needs ultraplan-level refinement)
**Location:** `docs/plans/2026-04-08-fix-seo-audit-pipeline.md`
- 11 tasks across 2 passes
- Pass 1: Create 4 missing scripts, update template schema, clean stale data, fix Tailwind, update skill
- Pass 2: Re-run for Liane and verify

## Key Files in the Pipeline

| File | Role |
|------|------|
| `commands/seo-audit.md` | The /seo-audit skill definition (orchestrates the whole workflow) |
| `template/seo/audit-data.json` | Schema scaffold — copied to each new client |
| `template/reports/multipage/generate-multipage-report.js` | Reads audit-data.json, normalizes, injects into HTML |
| `template/reports/multipage/pages/*.js` | Per-page renderers (9 files) |
| `template/scripts/*.js` | Data-gathering scripts (browse, crawl, DDG search, check-technical) |
| `AUDIT-SOP.md` | Mandatory standards for every audit |
| `HANDOFF.md` | Current system state and normalization pipeline docs |

## Success Criterion
Run the full workflow on a **brand new client** (not Liane, not Calgary). If all 9 HTML report pages render fully populated with correct data, we have succeeded. If not, loop back to debugging.

## Workflow Pattern (per MJ)
ultraplan-local → systematic-debugging → writing-plans → smart-team execution with Codex vision QA → loop until all pages pass → final test on new client
