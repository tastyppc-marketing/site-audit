# Handoff — Resuming Fix Work in a New Session

**Written:** 2026-04-21
**Previous session did:** full 67-file audit of the site-audit pipeline. Zero code fixes shipped.
**Next session does:** implement the fixes, one by one, using ultra plan mode per script, grouped by the 12 layer-directories the audit already organized.
**Branch:** `site-audit-fixes` (already pushed — 3 commits).
**Repo root:** `/root/site-audit`.

---

## 1. What's already been produced (read these, in order)

All under `/root/site-audit/Claude Code Findings/`:

| File | What it gives you | When to read it |
|---|---|---|
| [`INDEX.md`](./INDEX.md) | 67-file status tracker + addendum on cross-cutting bugs | First — orient. |
| [`FINAL-SYNTHESIS.md`](./FINAL-SYNTHESIS.md) | Data flow diagram, contract matrix, ranked bug queue, per-client remediation plan, **priority fix queue in 5 tiers**. | Second — decide what to fix. |
| [`MAJOR-FINDINGS.md`](./MAJOR-FINDINGS.md) | Curated cross-finding bug index (CRITICAL / SYSTEMIC / SILENT DATA LOSS / ARCHITECTURAL GAPS / OPEN MYSTERIES). | Third — see patterns. |
| `<layer>/<N>-<name>.md` | Per-file deep-dive (Purpose, Inputs, Outputs, Annotated walk, Bugs & fragility, Integration map, Fix suggestions, Pre-flight checks). | When working on a specific fix — open the finding for the file you're about to edit. |

**Don't re-audit. Don't re-read every finding cold.** The synthesis is the entry point. Open per-file findings on demand.

## 2. The 12 layer directories (houses for fix work by theme)

Each directory is a coherent theme. One session per directory is a reasonable cadence; Tier-1 fixes cross directories and should go first.

| Directory | Files | Role |
|---|---|---|
| `01-shared-util/` | 1 (`lib/fetch-with-retry.js`) | HTTP retry + semaphore utility used by every JS gather script. |
| `02-diagnostic/` | 4 (browse, ddg-search, check-technical, crawl-sitemap) | Playwright-based reconnaissance scripts. `crawl-sitemap.js` is the highest-leverage file in the whole repo. |
| `03-api-gathering/` | 8 (extract-text, gather-pagespeed, gather-domain-metrics, gather-backlinks, gather-organic-metrics, gather-keyword-volumes, gather-local-pack, gather-local-seo) | JS scripts that call external APIs and write `seo/research/*.json`. Most drift lives here. |
| `04-analysis-population/` | 2 (analyze-backlink-quality, populate-audit-data) | Enrichment + Markdown→JSON bridge. |
| `05-deliverables/` | 5 (parse-google-ads, generate-spreadsheet, generate-presentation, generate-ppc-spreadsheet, generate-ppc-presentation) | XLSX + PPTX builders. PPC subset is orphaned. |
| `06-generator/` | 1 (`generate-multipage-report.js` — 3160 lines) | The normalizer + HTML injector. The heart of the report. Has 13 HANDOFF auto-fixes baked in. |
| `07-page-renderers/` | 9 (index, keywords, content, technical, links, competitors, local, action-plan, backlink-opportunities) | Client-side JS that renders each of the 9 HTML report pages. |
| `08-shared-renderer/` | 9 (data-loader, utils, nav, charts, table-filters, table-pagination, explainer, search, print) | Shared infrastructure for all page renderers. |
| `09-python-connectors/` | 11 (base, dataforseo, pagespeed, search_console, ga4, business_profile, local_seo, crux, brand_mentions, social_audit, google_ads) | Python wrappers around external APIs. |
| `10-python-analyzers/` | 12 (content_quality, internal_linking, technical_seo, backlinks, competitor, local_seo, indexation_crawlability, eeat_signals, content_gap, reporting_intelligence, rank_tracker, ppc_analyzer) | Python analyzers — the brain of `build_audit.py`. |
| `11-python-orchestrators/` | 4 (build_audit, run_backlink_analysis, run_rank_tracker, run_all) | Pipeline runners. **`build_audit.py:216` has a CRITICAL bug.** |
| `12-workflow/` | 1 (`commands/seo-audit.md` — 1360 lines) | The master skill orchestrator. Touches everything. |

## 3. Priority tiers (from `FINAL-SYNTHESIS.md` §5)

**START HERE → Tier 1. Three fixes. Highest ROI. Land these first.**

### Tier 1 — must ship first
1. **`build_audit.py:216`** → change `edges = link_graph or {}` to `edges = (link_graph or {}).get("edges", {})`. Finding #63, #52. One line. Unblocks every client's internal linking.
2. **`template/scripts/gather-backlinks.js:38`** → change `const { postJson } = require('./lib/fetch-with-retry');` to `const { postJson, Semaphore } = require('./lib/fetch-with-retry');`. Finding #9. One line. Unblocks every new template-copy client.
3. **`commands/seo-audit.md:391-397`** → delete the block that instructs Agent 2 to "Write seo/research/crawl-data.json" and "Write seo/research/link-graph.json". Finding #5 addendum, #67 #1. Restores full-sitemap crawl output for every client.

### Tier 2 — categorical reliability (after Tier 1)
4. `gather-local-pack.js` + skill: parameterize `--location` from client-config (finding #12).
5. Atomic + backed-up `audit-data.json` rewrite for `populate-audit-data.js` + `gather-keyword-volumes.js` (findings #11, #15).
6. `base.py` retry: cover HTTP 5xx + add `@retry` to `_request_sync` (finding #40).

### Tier 3 — restore promised features
7. Wire `analyze-backlink-quality.js` into skill Step 5 (finding #14).
8. Port `pages/competitors.js`'s dynamic comp-column logic to `generate-spreadsheet.js` + `generate-presentation.js` (findings #17, #18).
9. `gather-local-seo.js`: real Chrome UA + full-name match + Zillow URL fix (finding #13).
10. `gather-organic-metrics.js`: parameterize location/language + add true-total organic traffic call (finding #10).

### Tier 4 — bulk re-template
11. Re-template 3-client cohort (chris-nevada, laura-willis, liane-jamason) across 6 gather scripts.
12. Restore missing scripts for 4 clients (calgary-castles, mammoth-lakes, murray-gardner, p3realtync).
13. Delete client-local `generate-multipage-report.js` copies (matt-wallmow, laura-willis, liane-jamason).

### Tier 5 — architectural (do last)
14. PPC workflow: create `commands/ppc-audit.md` + raw→data transformer.
15. Dual-path decisions: pick Python OR JS for backlinks, local, PPC, DFS, PSI.

## 4. Per-fix workflow (the repeating recipe)

For each finding you work on:

1. **Open the finding file** (`Claude Code Findings/<layer>/<N>-<name>.md`).
2. **Open the source file** it documents. Confirm line numbers still match (most will; some files may have shifted).
3. **Open any cross-referenced files** mentioned in the finding's Integration Map.
4. **Ultra plan mode.** Produce a plan that specifies:
   - Exact file + line change
   - Why the existing behavior is wrong
   - What the new behavior will be
   - What could break downstream
   - What test or manual verification step confirms the fix
5. **Implement** per the plan.
6. **Verify.** For Tier 1-3 fixes, matt-wallmow is the reference client — re-run the relevant gather/analyze step on his data and confirm the output changed correctly.
7. **Commit with a scoped message** (see §6).
8. **Move to the next finding.**

One fix per commit is ideal. Bulk-operation fixes (Tier 4) can be one commit per cohort of clients.

## 5. Reference client — matt-wallmow

All validation happens against `/root/site-audit/clients/matt-wallmow/`. Why: he's the designated live-reference from the audit. His data shape is well-understood. Findings document what his report CURRENTLY shows (wrong) and what it SHOULD show post-fix.

**Key quick-checks on Matt after a fix:**
- **Tier 1 fix 1 (build_audit.py):** `internalLinking.total_pages` should go from `0` to a real number. `orphans` should drop from 11 to a small number.
- **Tier 1 fix 2 (Semaphore):** `node clients/matt-wallmow/scripts/gather-backlinks.js` (or template version) should no longer crash.
- **Tier 1 fix 3 (Agent 2 overwrite):** after re-running `/seo-audit`, `crawl-data.json` should have 40 analyzed pages, not 11. `link-graph.json` should have 40 source pages.

## 6. Git + workflow conventions

- **Branch:** `site-audit-fixes` (already checked out + pushed).
- **Commit style:** `<type>: short summary — detail` (e.g., `fix:`, `docs:`, `refactor:`). Match what's in `git log --oneline -20`.
- **Before pushing:** run `gh auth setup-git` (per global CLAUDE.md — the HTTPS remote needs the gh credential helper).
- **Co-author footer:** keep `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` on commits.
- **Don't commit unrelated files.** `git status` currently shows `.collab/*`, `.playwright-mcp/*`, `.codex/`, `.claude/settings.local.json` as untracked or modified — those are runtime/IDE noise. Stage files explicitly; don't `git add .`.
- **Don't modify the findings.** They're the authoritative research. If a finding is wrong or out-of-date, append an "## Additional Information" section at the bottom — don't edit or delete the existing text. (This is a hard rule from the user.)

## 7. Current git state

```
Branch: site-audit-fixes (tracking origin/site-audit-fixes)
  ccab1e4  docs: add systematic deep-dive audit — 67 findings + synthesis
  2f9e74d  wip: preserve in-flight template edits (gather-backlinks, normalizer, backlink-opportunities)
  5becdb0  wip: preserve in-flight client data snapshots (matt-wallmow, liane-jamason)
```

Three `wip:` commits on top of the findings commit capture pre-existing working-tree edits that pre-dated the audit — they're preserved, not reviewed. If any turn out to conflict with planned fixes, resolve via git (likely `git log -p <file>` to understand, then decide).

## 8. Known open mysteries (document when resolved)

Track resolutions in the relevant finding as `## Additional Information` sections:

- **`"audit-synthesis"` source label** in Matt's `local-seo.json` — provenance unknown. Finding #13 #8. Likely in `platform/src/audit_platform/analyzers/local_seo.py` per finding #56. Grep the literal string to confirm.
- **Missing 5th competitor (northwoodshomefinder.com)** from Matt's `pagespeed-data.json` — no error row. Finding #7 #11. Likely a skill-level variable-substitution bug around `seo-audit.md:692`.
- **Who writes the ghost fields** (`pillars, keyStats, longTermColumns, mediumTermRoadmap, nextSteps, gradeSummary`) — findings #18, #22, #29. Most likely `reporting_intelligence.py` per finding #60.
- **`calgary-castles` data provenance** — she has several research JSONs but is missing the scripts that produce them. Findings #7, #9. Likely seeded from an older template generation.
- **`laura-willis`'s 673-byte `client-backlinks.json`** — suspiciously small. Likely a failure stub. Finding #9.

## 9. Don't-dos (explicit)

- **Don't modify existing finding text.** Additions only, under a `## Additional Information` heading.
- **Don't delete findings or their sections.**
- **Don't auto-batch commits.** One fix per commit.
- **Don't re-run the audit.** It's done. Use the findings.
- **Don't sweep untracked files into a commit.** Stage explicitly by path.
- **Don't fix out of tier order** unless you have a specific reason. Tier 1 unblocks most downstream analysis; doing Tier 3 first means validating against a broken pipeline.
- **Don't skip matt-wallmow verification.** For every functional fix, re-run the relevant step on his data and confirm the change.

## 10. Fast-start checklist for the next session

1. `cd /root/site-audit`
2. `git status` → confirm clean-ish working tree (expect some `.collab/` and `.playwright-mcp/` noise).
3. `git branch --show-current` → should be `site-audit-fixes`. If not: `git checkout site-audit-fixes`.
4. Read `Claude Code Findings/INDEX.md` (1 minute).
5. Read `Claude Code Findings/FINAL-SYNTHESIS.md` §5 (the fix queue — 2 minutes).
6. Pick Tier 1 fix #1 (`build_audit.py:216`).
7. Open `Claude Code Findings/11-python-orchestrators/63-scripts-build-audit.md`.
8. Open `platform/scripts/build_audit.py`, line 216.
9. **Go into ultra plan mode.** Draft the fix.
10. Implement → verify on matt-wallmow → commit.
11. Next fix.

---

**Total audit artifacts:** 67 findings + 3 synthesis docs + this handoff = 71 markdown files under `Claude Code Findings/`. All live on `site-audit-fixes` branch. Ready.
