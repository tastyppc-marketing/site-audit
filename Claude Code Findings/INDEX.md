# Claude Code Findings — Site Audit Deep-Dive Tracker

**Started:** 2026-04-17
**Purpose:** One deep-dive per script in the site-audit tool — inputs, outputs, annotated code walk, bugs with line numbers, integration map, fix ideas. Cross-referenced with existing `codex findings/` where available.

**Methodology:** Each file is read line-by-line in its entirety. Every finding includes file:line references. Bugs are rated **H** / **M** / **L** severity. Integration section confirms who calls the script and who consumes its output. Fragility section surfaces assumptions, contracts, and places the code will silently misbehave.

---

## Status

| # | Layer | File | Status |
|---|---|---|---|
| 1 | 01-shared-util | `lib/fetch-with-retry.js` | ✅ Done |
| 2 | 02-diagnostic | `browse.js` | ✅ Done |
| 3 | 02-diagnostic | `ddg-search.js` | ✅ Done |
| 4 | 02-diagnostic | `check-technical.js` | ✅ Done |
| 5 | 02-diagnostic | `crawl-sitemap.js` | ✅ Done |
| 6 | 03-api-gathering | `extract-text.js` | ✅ Done |
| 7 | 03-api-gathering | `gather-pagespeed.js` | ✅ Done |
| 8 | 03-api-gathering | `gather-domain-metrics.js` | ✅ Done |
| 9 | 03-api-gathering | `gather-backlinks.js` | ✅ Done **— CRITICAL BUG: template crashes at runtime (see finding)** |
| 10 | 03-api-gathering | `gather-organic-metrics.js` | ✅ Done |
| 11 | 03-api-gathering | `gather-keyword-volumes.js` | ✅ Done **— writes to audit-data.json in-place (see finding)** |
| 12 | 03-api-gathering | `gather-local-pack.js` | ✅ Done **— `--location 2840` (country-level) suspected root cause of 0-hit results** |
| 13 | 03-api-gathering | `gather-local-seo.js` | ✅ Done |
| 14 | 04-analysis-population | `analyze-backlink-quality.js` | ✅ Done **— orphan script, not wired into skill** |
| 15 | 04-analysis-population | `populate-audit-data.js` | ✅ Done |
| 16 | 05-deliverables | `parse-google-ads.js` | ✅ Done |
| 17 | 05-deliverables | `generate-spreadsheet.js` | ✅ Done |
| 18 | 05-deliverables | `generate-presentation.js` | ✅ Done |
| 19 | 05-deliverables | `generate-ppc-spreadsheet.js` | ✅ Done |
| 20 | 05-deliverables | `generate-ppc-presentation.js` | ✅ Done |
| 21 | 06-generator | `generate-multipage-report.js` | ✅ Done (architectural — deferred per-section deep-dives #21b-#21n) |
| 22 | 07-page-renderers | `pages/index.js` | ✅ Done |
| 23 | 07-page-renderers | `pages/keywords.js` | ✅ Done |
| 24 | 07-page-renderers | `pages/content.js` | ✅ Done |
| 25 | 07-page-renderers | `pages/technical.js` | ✅ Done **— highly downstream; surface of many upstream bugs** |
| 26 | 07-page-renderers | `pages/links.js` | ✅ Done **— internal-linking sections render garbage for Matt + anyone hit by build_audit.py:216** |
| 27 | 07-page-renderers | `pages/competitors.js` | ✅ Done **— NO comp-column bug here; use as reference for #17/#18 fix** |
| 28 | 07-page-renderers | `pages/local.js` | ✅ Done |
| 29 | 07-page-renderers | `pages/action-plan.js` | ✅ Done |
| 30 | 07-page-renderers | `pages/backlink-opportunities.js` | ✅ Done |
| 31 | 08-shared-renderer | `shared/data-loader.js` | ✅ Done |
| 32 | 08-shared-renderer | `shared/nav.js` | ✅ Done |
| 33 | 08-shared-renderer | `shared/charts.js` | ✅ Done |
| 34 | 08-shared-renderer | `shared/utils.js` | ✅ Done |
| 35 | 08-shared-renderer | `shared/table-filters.js` | ✅ Done |
| 36 | 08-shared-renderer | `shared/table-pagination.js` | ✅ Done |
| 37 | 08-shared-renderer | `shared/explainer.js` | ✅ Done |
| 38 | 08-shared-renderer | `shared/search.js` | ✅ Done |
| 39 | 08-shared-renderer | `shared/print.js` | ✅ Done |
| 40 | 09-python-connectors | `connectors/base.py` | ✅ Done |
| 41 | 09-python-connectors | `connectors/dataforseo.py` | ✅ Done |
| 42 | 09-python-connectors | `connectors/pagespeed.py` | ✅ Done |
| 43 | 09-python-connectors | `connectors/search_console.py` | ✅ Done |
| 44 | 09-python-connectors | `connectors/ga4.py` | ✅ Done |
| 45 | 09-python-connectors | `connectors/business_profile.py` | ✅ Done |
| 46 | 09-python-connectors | `connectors/local_seo.py` | ✅ Done |
| 47 | 09-python-connectors | `connectors/crux.py` | ✅ Done |
| 48 | 09-python-connectors | `connectors/brand_mentions.py` | ✅ Done |
| 49 | 09-python-connectors | `connectors/social_audit.py` | ✅ Done |
| 50 | 09-python-connectors | `connectors/google_ads.py` | ✅ Done |
| 51 | 10-python-analyzers | `analyzers/content_quality.py` | ✅ Done |
| 52 | 10-python-analyzers | `analyzers/internal_linking.py` | ✅ Done |
| 53 | 10-python-analyzers | `analyzers/technical_seo.py` | ✅ Done |
| 54 | 10-python-analyzers | `analyzers/backlinks.py` | ✅ Done |
| 55 | 10-python-analyzers | `analyzers/competitor.py` | ✅ Done |
| 56 | 10-python-analyzers | `analyzers/local_seo.py` | ✅ Done |
| 57 | 10-python-analyzers | `analyzers/indexation_crawlability.py` | ✅ Done |
| 58 | 10-python-analyzers | `analyzers/eeat_signals.py` | ✅ Done |
| 59 | 10-python-analyzers | `analyzers/content_gap.py` | ✅ Done |
| 60 | 10-python-analyzers | `analyzers/reporting_intelligence.py` | ✅ Done |
| 61 | 10-python-analyzers | `analyzers/rank_tracker.py` | ✅ Done |
| 62 | 10-python-analyzers | `analyzers/ppc_analyzer.py` | ✅ Done |
| 63 | 11-python-orchestrators | `scripts/build_audit.py` | ✅ Done **— CRITICAL LINE 216 BUG (see INDEX addendum)** |
| 64 | 11-python-orchestrators | `scripts/run_backlink_analysis.py` | ✅ Done |
| 65 | 11-python-orchestrators | `scripts/run_rank_tracker.py` | ✅ Done |
| 66 | 11-python-orchestrators | `scripts/run_all.py` | ✅ Done |
| 67 | 12-workflow | `commands/seo-audit.md` | ✅ **Done — ALL 67 DEEP-DIVES COMPLETE** |

---

## Format used for each file

1. **Purpose** — what + why
2. **Inputs** — CLI args, env vars, files read (exact)
3. **Outputs** — file written, exact JSON shape, stdout side effects
4. **Annotated walk** — line-numbered tour of the meaningful logic
5. **Bugs & fragility** — specific line numbers, severity-rated
6. **Integration** — consumers, contracts, assumptions
7. **Fix / improve** — ranked by ROI
8. **What to verify before we touch this file** — the pre-flight

---

## Cross-referenced prior work

- `codex findings/` — directory of prior per-file analyses at the root of the repo. Read alongside each Claude finding. Codex analyses are usually shorter and less line-specific, but catch consumer-side issues (e.g., a caller that mis-uses a module).
- `docs/SEO-AUDIT-SYSTEM.md` — definitive system spec
- `HANDOFF.md` — known issues + current normalizer auto-fixes
- `AUDIT-SOP.md` — mandatory standards

---

## Reference client for spot-checks

**matt-wallmow** is the designated live-reference client for validating findings against real audit output. Each finding's "Direct impact on live clients" section should spot-check Matt's data when the script could plausibly have affected him. Known Matt issues we're tracking as we go:

- Blog undercount (10 posts in sitemap, 3 in `crawl-data.json`, 11 total analyzed pages) — root-caused in finding #5 addendum below.
- Internal link graph has only 11 source pages → `total_pages: 0`, `nodes: 0`, `max_depth: 0`, `hub_clusters: 0`, all 11 pages flagged as orphans in `audit-data.json`.

## Cross-cutting addendum to finding #5 (crawl-sitemap.js)

**New bug #21 (H):** The `/seo-audit` skill's Agent 2 (site-crawler) prompt at `commands/seo-audit.md:341-410` instructs the research agent to WRITE `seo/research/crawl-data.json` and `seo/research/link-graph.json` itself, *after* Step 1 runs the full `crawl-sitemap.js --analyze`. The template script's rich, full-sitemap output (40 content pages for Matt) is silently overwritten by the agent's curated 7-15 page browse.js-based set. Evidence:

- Matt's `crawl-data.json` is missing template-emitted fields (`analyzedCount`, `idxFilterPages`, `elapsedSeconds`, `issuesSummary`) and `categories` is `{}`.
- Matt's `link-graph.json` has an extra `notes` field the template script doesn't write.
- Matt's `link-graph.json` has 11 source pages (matches agent's browse list), not the 40 contextual pages crawl-sitemap.js would have captured.

Cascading effects downstream (observed in Matt's `audit-data.json`):
- `build_audit.py:217` computes `sitemap_urls` as `[p.url for p in crawl_data.pages]` — inherits the 11-page cap.
- `build_audit.py:216` passes the raw `link-graph.json` dict (not `link_graph['edges']`) as `edges` to `InternalLinkAnalyzer`, so the analyzer iterates top-level keys (`domain`, `crawlDate`, `notes`, `edges`), sees none are lists, and processes ZERO edges. Results: `total_pages: 0`, `total_internal_links: 0`, `nodes: []`, `max_depth: 0`, all pages flagged as orphans.
- Normalizer at `generate-multipage-report.js:1104+` does its own read of `link-graph.json` to repair `hubClusters` and `internalLinking.summary` — but still only sees 11 source pages. Report quality ceiling is set by this bug.

**Fix direction** (to be detailed when we re-visit finding #5 for the PR): (a) delete Steps 5 / "Write seo/research/crawl-data.json" / "Write seo/research/link-graph.json" from Agent 2's prompt, (b) fix `build_audit.py:216` to pass `link_graph.get("edges", {})`, (c) add a `sitemap_urls` pipeline that reads the FULL sitemap (not just analyzed pages) into the InternalLinkAnalyzer so orphan detection has ground truth.

---

## Final synthesis ✅ Done

Delivered as [`FINAL-SYNTHESIS.md`](./FINAL-SYNTHESIS.md) (2026-04-20).

Covers all 5 promised artifacts:
1. End-to-end data flow diagram — 6-stage pipeline with every script placed
2. Cross-script contract matrix — 30+ `audit-data.json` fields mapped to writer + consumers
3. Consolidated bug queue — top 30 bugs ranked by blast radius × effort
4. Live-client remediation plan — per-client actions for all 8 active clients
5. Priority-ordered fix queue — 15 fixes in 5 tiers with rationale + effort + risk

**Tier 1 (must ship first):** build_audit.py:216 edges key · gather-backlinks.js Semaphore import · seo-audit.md Agent 2 overwrite deletion. These three fixes alone unblock every client's internal linking + backlinks + crawl data.
