# Project Directory — Site Audit Platform

**Start here.** This file maps the project structure, tells you what to read and in what order, and indexes every section of every instruction file so you can jump directly to what you need.

---

## File Map

### Root Config & Docs
- `DIRECTORY.md` — **This file.** Project map, reading order, section index.
- `CLAUDE.md` — Project-level rules and constraints for all work.
- `AUDIT-SOP.md` — Mandatory quality standards for every audit (data, reports, deliverables).
- `HANDOFF.md` — Current system state, recent changes, rollback points, troubleshooting.

### Platform (Python)
- `platform/src/audit_platform/connectors/dataforseo.py` — DataForSEO API connector (keywords, backlinks, SERP, domain metrics).
- `platform/src/audit_platform/analyzers/backlinks.py` — Backlink analysis (500 backlink / 200 referring domain defaults).
- `platform/scripts/run_backlink_analysis.py` — CLI to run backlink analysis.

### Templates (reusable for every client)
- `template/reports/multipage/generate-multipage-report.js` — **Report generator.** Reads `audit-data.json`, auto-normalizes data, injects into HTML. This is the most important file in the report system.
- `template/reports/multipage/*.html` — 8 HTML page templates (index, keywords, content, technical, links, competitors, local, action-plan).
- `template/reports/multipage/pages/*.js` — Per-page renderers (one JS file per HTML page).
- `template/reports/multipage/shared/report-styles.css` — All report CSS.
- `template/reports/multipage/shared/charts.js` — Chart.js factory functions.
- `template/reports/multipage/shared/nav.js` — Top/side navigation + scrollspy.
- `template/reports/multipage/shared/explainer.js` — "What does this mean?" floating widget.
- `template/reports/multipage/shared/table-filters.js` — Table filter system (search, dropdowns, pagination).
- `template/reports/multipage/shared/data-loader.js` — Data injection + boot orchestrator.
- `template/reports/multipage/shared/utils.js` — Shared utility functions.

### Skills (workflow definitions)
- `commands/seo-audit.md` — Full SEO audit workflow (10 steps, 6 agents, deliverables, report generation).
- `commands/optimize-page/SKILL.md` — Page optimization skill.
- `commands/optimize-plan/SKILL.md` — Optimization planning skill.

### Client Data (one folder per client)
- `clients/<slug>/seo/audit-data.json` — Shaped data for the report (the generator reads this).
- `clients/<slug>/seo/research/` — Raw research files (the generator auto-populates from these).
- `clients/<slug>/seo/reports/multipage/` — Generated HTML report (output of generator).
- `clients/<slug>/seo/reports/` — Excel + PowerPoint deliverables.
- `clients/<slug>/seo/content/` — Written deliverables (meta tags, schema, blog posts, community pages).
- `clients/<slug>/scripts/` — Client-specific Playwright scripts.

---

## Reading Order

1. **`DIRECTORY.md`** (this file) — Orient yourself. Find what you need.
2. **`CLAUDE.md`** — Project rules. What to always/never do.
3. **`HANDOFF.md`** — What was done recently, what's broken/fixed, rollback points.
4. **`AUDIT-SOP.md`** — Quality standards (read before running any audit).
5. **`commands/seo-audit.md`** — Only if running/modifying an SEO audit.
6. **`template/reports/multipage/generate-multipage-report.js`** — Only if debugging report data issues.

---

## Section Index

### CLAUDE.md (Project Rules)

| Line | Section | What's There |
|------|---------|-------------|
| 3 | Required Reading | Which files to read before any audit |
| 8 | Project Structure | Folder layout: platform/, template/, clients/, commands/ |
| 14 | Key Rules | 6 mandatory standards (DFS data, real text, no empty sections, audit log, location accuracy, Canadian English) |
| 22 | Data Integrity Rules | Cross-reference agents against research, detect stale data, research files are source of truth |
| 28 | Report & Template Rules | Always regenerate, use tables not grid, log scale for gaps, CSS max-height caps, scrollspy algorithm |
| 35 | Save Points | Git commit hashes for rollback |

### HANDOFF.md (Current State)

| Line | Section | What's There |
|------|---------|-------------|
| 9 | What Was Done This Session | Summary of all fixes in the April 2026 session |
| 13 | Problems Found & Fixed | Table: problem → root cause → fix for every issue |
| 29 | Data Normalization | All 13 auto-fixes in generate-multipage-report.js |
| 46 | Research Files the Normalizer Reads | Table: which research file feeds which report section |
| 61 | Running an Audit for a New Client | Step-by-step commands to run and verify |
| 78 | What to Verify After a New Audit | Per-page checklist (what to look for on each report page) |
| 93 | Common Issues & Fixes | Troubleshooting: "No data" sections, wrong map, stale PageSpeed, hallucinated numbers |
| 107 | Running the Optimize Page Tool | How to use it safely, which files it touches, how to rollback |
| 142 | Key Architecture Decisions | Why normalization is at generate time, why log scale, why topmost-visible scrollspy |

### AUDIT-SOP.md (Quality Standards)

| Line | Section | What's There |
|------|---------|-------------|
| 8 | Data Collection Requirements | What DFS API calls are mandatory, real text extraction rules |
| 39 | All Report Sections Must Be Populated | No empty sections policy, what counts as "truly lack access" |
| 69 | Report Template Requirements | Explainer widget, score popovers, location accuracy rules |
| 92 | Content Deliverables Requirements | Keyword density, Canadian/local accuracy, meta tag and schema specs |
| 127 | Audit Pipeline Execution Order | Research phase → text extraction → report → deliverables → data population |

### commands/seo-audit.md (SEO Audit Workflow)

| Line | Section | What's There |
|------|---------|-------------|
| 17 | Step 0: Gather Client Info | What to collect from the user before starting |
| 39 | Step 1: Project Setup | Copy template, install deps |
| 74 | Step 2: Create Playwright Scripts | browse.js, crawl-sitemap.js, ddg-search.js, check-technical.js |
| 278 | Step 3: Build Keyword List | 25 target keywords from client info + competitors |
| 290 | Step 4: Spawn 6 Parallel Research Agents | Agent configs for keyword, crawler, content, competitor, best practices, backlink |
| 337 | Agent 2: site-crawler | Outputs crawl-data.json + link-graph.json (schemas documented) |
| 551 | Agent 6: backlink-researcher | DFS backlink API (500 backlinks, 200 referring domains) + WebSearch |
| 620 | Step 5: Monitor Research Agents | How to check agent progress |
| 630 | Step 6: Compile Final Report | Report compilation agent prompt |
| 717 | Step 7: Generate Implementation Deliverables | Meta tags, schema, community pages, blog posts, review + verify |
| 932 | Step 8: Populate audit-data.json | Fields to populate manually vs auto-populated by generator |
| 988 | Step 8b: Generate Client Deliverables | Excel, PowerPoint, HTML report commands |
| 1027 | Step 9: Final Delivery | What to present to the user |

### generate-multipage-report.js (Report Generator)

Not indexed by line (code file), but key functions:

| Function | What It Does |
|----------|-------------|
| `normalizeAuditData()` | 13-step data normalization: CWV, PageSpeed, pageAudits, links, backlinks, domainMetrics, competitors, readability |
| `buildSearchIndex()` | Builds cross-page search index (160+ entries) |
| `main()` | Reads data → normalizes → injects into HTML → copies shared assets |

---

## How to Update This File

When you add, remove, or rename an important file:
1. Update the **File Map** section.
2. If it's an instruction file, add it to **Reading Order** and create a **Section Index** entry.
3. When you edit an instruction file and sections move, update the line numbers in the index.
4. Keep descriptions to one line. If you need more, the reader should go to the actual file.
