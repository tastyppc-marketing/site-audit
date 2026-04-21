# Site Audit — Fix Work Instructions

**This clone exists for one purpose: work through the 67-file audit's priority tiers and ship fixes, one tier at a time.** Not for running new audits, not for client delivery. Fix work only.

Parent repo (production): `/root/site-audit/`. This clone: `/root/site-audit-fix-work/`. Branch: `site-audit-fixes`.

---

## Index — what to read, in order

| Document | Purpose | When |
|---|---|---|
| [`Claude Code Findings/HANDOFF.md`](./Claude%20Code%20Findings/HANDOFF.md) | Fresh-session starter. Tier list, per-fix recipe, don't-dos. | First. |
| [`Claude Code Findings/FINAL-SYNTHESIS.md`](./Claude%20Code%20Findings/FINAL-SYNTHESIS.md) §5 | The 5-tier priority fix queue. | Second. |
| [`Claude Code Findings/INDEX.md`](./Claude%20Code%20Findings/INDEX.md) | 67-file status tracker + cross-cutting bugs. | Orienting. |
| [`Claude Code Findings/MAJOR-FINDINGS.md`](./Claude%20Code%20Findings/MAJOR-FINDINGS.md) | Curated cross-finding bug index. | Pattern recognition. |
| `Claude Code Findings/<layer>/<N>-<name>.md` | Per-file deep-dive. | On demand, when touching that file. |
| `docs/SEO-AUDIT-SYSTEM.md` | Full pipeline reference. | When a fix's blast radius is unclear. |
| [`docs/PRODUCTION-CLAUDE.md`](./docs/PRODUCTION-CLAUDE.md) | Inherited production rules (15 numbered data-integrity + report/template invariants). | When verifying a fix didn't break a known invariant. |

---

## The tier-by-tier plan

**Work one tier at a time. Within each tier: re-read every script end-to-end (full source), use the existing finding as supporting evidence, then draft a comprehensive plan covering every fix in that tier before implementing.**

- **Tier 1** (3 fixes, cross-layer, must ship first):
  1. `platform/scripts/build_audit.py:216` — edges extraction
  2. `template/scripts/gather-backlinks.js:38` — Semaphore import
  3. `commands/seo-audit.md:391–397` — delete Agent 2 overwrite block
- **Tier 2** (3 fixes) — categorical reliability: location param, atomic audit-data writes, retry coverage.
- **Tier 3** (4 fixes) — restore promised features.
- **Tier 4** (3 bulk ops) — re-template cohort + restore missing scripts + delete client-local generator copies.
- **Tier 5** (2 items) — architectural: PPC workflow + dual-path decisions.

Full details: `Claude Code Findings/FINAL-SYNTHESIS.md` §5.

## Per-fix recipe (repeat for every finding)

1. Open the finding file under `Claude Code Findings/<layer>/`.
2. **Read the full source file** — not just the flagged lines. We want complete context.
3. Open cross-referenced files from the finding's Integration Map.
4. Ultra plan mode: exact file+line change, why current behavior is wrong, new behavior, downstream blast radius, verification step.
5. Implement.
6. Verify on `clients/matt-wallmow/` (reference client) — re-run the relevant gather/analyze step, confirm output changed correctly.
7. Commit (one fix per commit).

## Verification signals for matt-wallmow

- **Tier 1 #1** (`build_audit.py`): `internalLinking.total_pages` goes 0 → real number; orphans drop from 11.
- **Tier 1 #2** (Semaphore): `node clients/matt-wallmow/scripts/gather-backlinks.js` no longer crashes.
- **Tier 1 #3** (Agent 2 overwrite): after re-running `/seo-audit`, `crawl-data.json` has 40 analyzed pages (not 11); `link-graph.json` has 40 source pages.

## The 12 layer directories (map of the codebase)

Findings are organized by architectural role, not tier. Tiers cut across layers.

| Dir | Role |
|---|---|
| `01-shared-util/` | HTTP retry + semaphore utility (used by every JS gather script) |
| `02-diagnostic/` | Playwright reconnaissance (crawl-sitemap highest leverage) |
| `03-api-gathering/` | JS scripts → `seo/research/*.json`. Most drift lives here. |
| `04-analysis-population/` | Enrichment + Markdown→JSON bridge |
| `05-deliverables/` | XLSX + PPTX builders |
| `06-generator/` | `generate-multipage-report.js` (3160 lines) — the normalizer |
| `07-page-renderers/` | Client-side JS for each HTML report page |
| `08-shared-renderer/` | Shared renderer infrastructure |
| `09-python-connectors/` | Python wrappers around external APIs |
| `10-python-analyzers/` | Python analyzers (brain of `build_audit.py`) |
| `11-python-orchestrators/` | Pipeline runners. `build_audit.py:216` has Tier 1 bug. |
| `12-workflow/` | `commands/seo-audit.md` master skill orchestrator |

---

## Hard rules for fix work

1. **Don't modify finding text.** Append under `## Additional Information` only. Findings are authoritative research.
2. **One fix per commit.** No batched commits. Tier 4 bulk ops may be one commit per client cohort.
3. **Don't fix out of tier order** without a specific reason. Tier 1 unblocks downstream; skipping it means validating against a broken pipeline.
4. **Don't skip matt-wallmow verification** for functional fixes.
5. **Stage explicitly by path.** Never `git add .` — working tree has `.collab/`, `.playwright-mcp/`, `.codex/` noise.
6. **Don't re-audit from scratch.** Re-reading scripts for full context is expected and encouraged; producing a new finding doc is not.
7. **Before pushing:** `gh auth setup-git` (HTTPS remote needs gh credential helper).
8. **Commit footer:** keep `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

## Data-integrity rules inherited from the parent repo

These still apply whenever a fix changes data shape or flow:

- **Never hardcode client-specific data in templates** — everything comes from `audit-data.json` or research files.
- **Research files are the source of truth; `audit-data.json` is the shaped view.** The normalizer auto-populates; don't manually duplicate.
- **Cross-reference `audit-data.json` against research files** — agents hallucinate numbers.
- **Detect stale/copy-pasted data** — identical competitor scores usually mean copied data.
- **After ANY template change, regenerate the client report** — HTML has inlined data.

---

## Current git state

- Branch: `site-audit-fixes` (tracking `origin/site-audit-fixes`)
- Last 4 commits: `8f5aa43` HANDOFF → `5becdb0` wip client data → `2f9e74d` wip template edits → `ccab1e4` 67-finding audit
- Working tree: clean.
