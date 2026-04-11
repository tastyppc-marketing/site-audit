# Session Handoff - 2026-04-08

## Context
Ran a full SEO audit for Liane Jamason (lianejamason.com, Corcoran Dwellings, St. Petersburg FL) which exposed systemic pipeline failures: 10 missing data sections, 4 missing research JSON files, stale template data, and several bugs causing blank/broken report pages. The session pivoted from client audit delivery to diagnosing and planning a comprehensive pipeline fix. 7 deep research files (4,367 lines total) have been produced mapping the full data contract, but no code changes have been made yet.

## Completed

### Liane Jamason SEO Audit (content is correct, report rendering is broken)
- All 6 research agents ran successfully (keyword, site structure, content, competitor, backlinks, best practices)
- FINAL-AUDIT-REPORT.md written (824 lines, grade D+)
- 8 implementation deliverables produced (4 Claude + 4 Codex: meta tags, schema, community pages, blog posts)
- Claude vs Codex review done (Claude wins 141/160 vs 120/160)
- Verification report done
- audit-data.json populated with 19 of 29 required sections
- Excel + PowerPoint generated
- Multipage HTML regenerated (data is correct but many pages blank due to missing sections)
- Save points: `fb9b977` (pre-population), `bcf558f` (final audit state)

### Pipeline Diagnosis (7 research files complete)
1. `clients/liane-jamason/troubleshooting/data-contract-map.md` (884 lines) — Every field every page renderer needs
2. `clients/liane-jamason/troubleshooting/calgary-vs-liane-diff.md` (~200 lines) — 10 missing top-level sections, 4 missing JSON files
3. `clients/liane-jamason/troubleshooting/skill-vs-template-gap.md` (323 lines) — 9 contract gaps between skill/template/generator
4. `clients/liane-jamason/troubleshooting/normalizer-trace.md` (439 lines) — Line-by-line generator normalization logic trace
5. `clients/liane-jamason/troubleshooting/renderer-field-manifest.md` (1,202 lines) — Exhaustive field access for all 9 page renderers
6. `clients/liane-jamason/troubleshooting/calgary-golden-schema.md` (1,045 lines) — Complete 29-key ~400-field golden reference schema
7. `clients/liane-jamason/troubleshooting/risk-analysis.md` (274 lines) — Chart.js crashes, silent failures, API risks, critical bugs

### Draft Plan
- `docs/plans/2026-04-08-fix-seo-audit-pipeline.md` — 11-task plan (needs refinement with ultraplan findings)
- `docs/plans/PIPELINE-FIX-CONTEXT.md` — Context brief summarizing the problem

## In Progress
- **Ultraplan Phase 2 (synthesis)** — All 4 ultraplan research agents completed. Phase 1 (research) is done. Phase 2 (synthesis by the lead, not delegated) has not started. Phase 3 (write the definitive plan) has not started. Phase 4 (user approval) has not started.

## Next Steps

1. **Read all 7 research files and synthesize findings** — The lead must read the key sections of all 7 troubleshooting files to build a mental model of the complete data flow. Do NOT delegate this. Key files to read first: `normalizer-trace.md` (how data flows), `calgary-golden-schema.md` (what the target looks like), `risk-analysis.md` (what will break).

2. **Write the definitive ultraplan** — Incorporate all findings into a foolproof implementation plan. Must address:
   - 4 missing data-gathering scripts (gather-pagespeed.js, gather-domain-metrics.js, gather-backlinks.js, extract-text.js)
   - 10 missing audit-data.json sections (contentQuality, backlinks, internalLinking, technicalSeo, localSeo, indexationCrawlability, eeatSignals, reportingIntelligence, competitorAnalysis, rankHistory)
   - Critical bugs: `run_backlink_analysis.py` wrong key (`linkOpportunities` vs `backlinkOpportunities`), `backlink-opportunities.js` divide-by-zero, 6 silent try/catch blocks, Calgary strings in explainer.js
   - Template cleanup: stale debug-data.js (already fixed), stale HTML, Tailwind CDN → pre-built CSS
   - /seo-audit skill update (add missing Steps 5.5 and expanded Step 8a)
   - Template audit-data.json full schema scaffold (29 keys)

3. **Get user approval on the plan** — MJ wants to review before execution begins.

4. **Execute with /smart-team + Codex vision QA loop:**
   - Fix → Generate → Codex screenshots all 9 pages → Code review → If any page fails → loop back to fix agent → repeat
   - Use /systematic-debugging for any failures found during QA

5. **Final test on a brand new client** — This is the success criterion. NOT Liane, NOT Calgary. A fresh client with only a domain name. If all 9 pages populate correctly, the pipeline is fixed. If not, loop back to ultraplan.

## Key Files

### Pipeline Components (what needs fixing)
- `/mnt/c/dev/site audit/commands/seo-audit.md` — The /seo-audit skill definition
- `/mnt/c/dev/site audit/template/seo/audit-data.json` — Schema scaffold template
- `/mnt/c/dev/site audit/template/reports/multipage/generate-multipage-report.js` — Report generator + normalizer
- `/mnt/c/dev/site audit/template/reports/multipage/pages/*.js` — 9 page renderers
- `/mnt/c/dev/site audit/template/reports/multipage/shared/data-loader.js` — Client-side boot sequence
- `/mnt/c/dev/site audit/template/reports/multipage/shared/explainer.js` — Has Calgary-specific strings (lines 164, 202)
- `/mnt/c/dev/site audit/template/scripts/` — Data-gathering scripts (4 new ones needed)
- `/mnt/c/dev/site audit/platform/connectors/dataforseo.py` — DFS API connector (no rate limiting on `_post()`)
- `/mnt/c/dev/site audit/platform/analyzers/run_backlink_analysis.py` — Wrong key bug (line 74: `linkOpportunities` should be `backlinkOpportunities`)

### Research Files (read these first)
- `/mnt/c/dev/site audit/clients/liane-jamason/troubleshooting/normalizer-trace.md`
- `/mnt/c/dev/site audit/clients/liane-jamason/troubleshooting/calgary-golden-schema.md`
- `/mnt/c/dev/site audit/clients/liane-jamason/troubleshooting/renderer-field-manifest.md`
- `/mnt/c/dev/site audit/clients/liane-jamason/troubleshooting/risk-analysis.md`
- `/mnt/c/dev/site audit/clients/liane-jamason/troubleshooting/data-contract-map.md`
- `/mnt/c/dev/site audit/clients/liane-jamason/troubleshooting/calgary-vs-liane-diff.md`
- `/mnt/c/dev/site audit/clients/liane-jamason/troubleshooting/skill-vs-template-gap.md`

### Plans
- `/mnt/c/dev/site audit/docs/plans/PIPELINE-FIX-CONTEXT.md` — Problem summary
- `/mnt/c/dev/site audit/docs/plans/2026-04-08-fix-seo-audit-pipeline.md` — Draft plan (needs ultraplan refinement)

### Liane Jamason Audit (for reference/testing)
- `/mnt/c/dev/site audit/clients/liane-jamason/seo/audit-data.json` — Partially populated (19 of 29 sections)
- `/mnt/c/dev/site audit/clients/liane-jamason/seo/reports/FINAL-AUDIT-REPORT.md`
- `/mnt/c/dev/site audit/clients/liane-jamason/seo/research/` — All 6 research .md files + crawl-data.json + link-graph.json
- `/mnt/c/dev/site audit/clients/liane-jamason/seo/content/` — All deliverables + review + verification

## Blockers / Notes

- **MJ's preferred workflow for systemic fixes:** ultraplan-local → systematic-debugging → writing-plans → smart-team with Codex vision QA → loop until pass → new client final test. Saved to memory at `feedback_pipeline_fix_workflow.md`.
- **No tmux available** — smart-team pane verification won't work. Use direct agent spawning with Codex vision instead.
- **DataForSEO API key required** for gather-domain-metrics.js and gather-backlinks.js. Check env vars `DFS_LOGIN` and `DFS_PASSWORD`.
- **Google PSI API is public** — no auth needed for gather-pagespeed.js, but rate limit is ~25 requests per 100 seconds.
- **The Tailwind CDN → pre-built CSS fix requires `npm install tailwindcss`** in the template directory.
- **Calgary's `technicalSeo.pageSpeedComparison` has confirmed stale data** — all competitors show identical 0.79/0.95 scores (copied from client). New implementation must use real measured values.
- **`backlink-opportunities.js` evaluates data at module-load time** (not through `init(data)`), unlike all other renderers. This architectural difference means fixes to it are more complex.
- **`competitorComparison` column keys** in Calgary use hardcoded domain slugs (`justinhavre`, `calgaryhousefinder`). The normalizer renames them to `comp1`, `comp2`, etc. — verify this works for Liane's competitor set.
