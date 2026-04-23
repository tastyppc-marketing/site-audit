# Tier 4 — Ultra Plan request (bulk re-template + client-local generator deletion)

> **Invocation:** this file is the full brief for the Tier 4 planner.
> Run `/ultraplan` from `/root/site-audit-fix-work` with a prompt like
> `Read Claude Code Findings/TIER-4-ULTRAPLAN-BRIEF.md and produce the plan it requests.`

---

## Mode of operation for this plan

This is NOT a "follow the handoff's §6 prompt verbatim" request. Use the
handoff §6 as one input among many. Produce a **fully-rounded, scoped plan**
that:

1. Reads every prior handoff (HANDOFF.md + POST-TIER-1 + POST-TIER-2 +
   POST-TIER-3) cover-to-cover so you understand the full journey —
   what shipped in each tier, what discipline evolved, what got deferred,
   and WHY Tier 4 looks the way it does.
2. Reads every finding directly relevant to Tier 4, AND every adjacent
   finding that might bleed in.
3. Looks ahead to Tier 5 (Fix 15 PPC workflow + Fix 16 dual-path decisions +
   spam-classifier calibration) and identifies anywhere Tier 4's mechanics
   could either pre-empt or entangle those Tier 5 decisions.
4. Reads the actual source code for every script involved, not just the
   finding docs — the per-fix recipe in `CLAUDE.md` is explicit about this.
5. Takes the "proposed 8-commit plan" below as INPUT context, not as the
   final plan. Adapt, refactor, expand, or discard parts as the primary
   source reading warrants.

**Output:** a durable plan doc committed to the repo (see §Deliverable below).
Do not implement fixes — this is a planning session only.

---

## Where we are

- **Working clone:** `/root/site-audit-fix-work/` (production clone at
  `/root/site-audit/` — don't touch).
- **Branch:** `site-audit-fixes`, origin synced at `bc76896`. Local at
  `d21d8f1` (post-Tier-3 handoff commit).
- **Shipped:** Tier 1 (cross-layer fixes) + Tier 1.5 (Step 1.5 auto-sync) +
  Tier 2 (reliability: location/lang param, atomic writes, retry) + Tier 3
  (feature restoration: backlink qualitySummary, competitor columns, local
  SEO citations, organicTrafficTotal). Plus 3 Tier-3 advisor-catch follow-ups.
- **Regression suites:** `PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v`
  → 8/8 passing as of `d21d8f1`.

---

## Required reading — everything in this section, in order

### A. The journey (all handoff files — read cover-to-cover)

1. `Claude Code Findings/HANDOFF.md` — original audit handoff, pre-Tier-1.
2. `Claude Code Findings/HANDOFF-POST-TIER-1.md` — post-Tier-1/1.5 state.
3. `Claude Code Findings/HANDOFF-POST-TIER-2.md` — post-Tier-2 state.
4. `Claude Code Findings/HANDOFF-POST-TIER-3.md` — primary, most recent.

You need all four because: Tier 4 is the FIRST tier where the script-sync
mechanism introduced in Tier 1.5 is the primary instrument. Tier 2
established the drift-cleanup pattern. Tier 3 introduced new template files
(analyze-backlink-quality.js, lib/, populate-audit-data.js atomic-write
usage) that Tier 4 will propagate whether we like it or not. The journey
across handoffs reveals the discipline (narrowest-boundary verification,
go/no-go gates, tier-boundary prep commits) that Tier 4 must continue.

### B. Core orientation docs

- `CLAUDE.md` (repo root) — fix-work-clone-specific hard rules.
- `Claude Code Findings/FINAL-SYNTHESIS.md` §5 — the 5-tier fix queue.
  Read Tier 4 in full. Read Tier 5 (fixes 15, 16, spam-classifier) enough
  to know what's pending. Read the 2026-04-23 "Additional Information"
  appendix for Tier 3's shipped outcome + advisor-catch dispositions.
- `Claude Code Findings/INDEX.md` — 67-file status tracker.
- `Claude Code Findings/MAJOR-FINDINGS.md` — cross-finding bug index.

### C. Direct Tier 4 findings (full body + any `## Additional Information`)

These correspond exactly to the 6 gather scripts + the Tier-3-new
analyze-backlink script + the Fix 14 generator:

- `Claude Code Findings/03-api-gathering/07-gather-pagespeed.md`
- `Claude Code Findings/03-api-gathering/08-gather-domain-metrics.md`
- `Claude Code Findings/03-api-gathering/09-gather-backlinks.md`
- `Claude Code Findings/03-api-gathering/10-gather-organic-metrics.md` (has post-Tier-3 addendum)
- `Claude Code Findings/03-api-gathering/11-gather-keyword-volumes.md`
- `Claude Code Findings/03-api-gathering/12-gather-local-pack.md`
- `Claude Code Findings/03-api-gathering/13-gather-local-seo.md` (has post-Tier-3 addendum)
- `Claude Code Findings/04-analysis-population/14-analyze-backlink-quality.md` (has post-Tier-3 addendum — Tier-3-new, will propagate to every Fix 13 target)
- `Claude Code Findings/06-generator/21-generate-multipage-report.md` (Fix 14's delete target)

For each: read the §Drift and §Missing sections carefully — they name
exactly which clients deviate from template and how.

### D. Indirect / adjacent findings (read in full — these could bleed in)

- `Claude Code Findings/03-api-gathering/06-extract-text.md` — template/ has it; non-gather; may be drifted on existing clients.
- `Claude Code Findings/04-analysis-population/15-populate-audit-data.md` — template/ has it; non-gather; pre-exists on some clients, missing on others.
- `Claude Code Findings/05-deliverables/17-generate-spreadsheet.md` (post-Tier-3 addendum) + `18-generate-presentation.md` (post-Tier-3 addendum) — Tier 3 fixed these scripts; re-template will propagate the fix to drifted clients.
- `Claude Code Findings/10-python-analyzers/54-analyzers-backlinks.md` (post-Tier-3 addendum) — dual classifier framing, relevant to Tier 5 look-ahead.
- `Claude Code Findings/10-python-analyzers/56-analyzers-local-seo.md` (post-Tier-3 addendum) — qualitySummary path disposition.
- `Claude Code Findings/11-python-orchestrators/63-scripts-build-audit.md` (post-Tier-3 addendum) — atomic writes, interacts with template lib/.
- `Claude Code Findings/12-workflow/67-commands-seo-audit.md` — THE Step 1.5 contract. Critical: if Tier 4 chooses offline (b)-approach, the offline mechanism must mirror Step 1.5's walk/copy/backup/orphan semantics exactly, otherwise Tier 4's offline sync diverges from the runtime sync next time someone invokes /seo-audit for these clients.

### E. Tier 5 look-ahead findings (skim — flag Tier-4 entanglements)

- `Claude Code Findings/05-deliverables/16-parse-google-ads.md`, `19-generate-ppc-spreadsheet.md`, `20-generate-ppc-presentation.md` — Fix 15 PPC cluster. `generate-ppc-*.js` + `parse-google-ads.js` exist in `template/scripts/`. If Tier 4 syncs `template/scripts/` recursively, these propagate. Does that pre-empt Fix 15's architecture?
- `Claude Code Findings/10-python-analyzers/62-analyzers-ppc-analyzer.md` — PPC analyzer, orphaned, relevant to Fix 15.
- `Claude Code Findings/09-python-connectors/41-connectors-dataforseo.md` — dual-path decision. If Tier 4 blesses the JS gather path for all clients, is that implicitly deciding Fix 16?

### F. Production / pipeline docs

- `docs/SEO-AUDIT-SYSTEM.md` — full pipeline reference.
- `docs/PRODUCTION-CLAUDE.md` — 15 inherited data-integrity invariants.
- `docs/TANDEM-MAP.md` — imported during Tier 3 prep.

### G. Source code (read end-to-end)

- All 21 files under `template/scripts/` (the propagation surface):
  - `template/scripts/{analyze-backlink-quality,browse,check-technical,crawl-sitemap,ddg-search,extract-text,gather-backlinks,gather-domain-metrics,gather-keyword-volumes,gather-local-pack,gather-local-seo,gather-organic-metrics,gather-pagespeed,generate-ppc-presentation,generate-ppc-spreadsheet,generate-presentation,generate-spreadsheet,parse-google-ads,populate-audit-data}.js`
  - `template/scripts/lib/{atomic-write,fetch-with-retry}.js`
- `template/reports/multipage/generate-multipage-report.js` (Fix 14 source).
- The 3 client-local copies Fix 14 deletes:
  - `clients/{laura-willis,liane-jamason,matt-wallmow}/reports/multipage/generate-multipage-report.js`
- `commands/seo-audit.md` Step 1.5 block (the auto-sync contract).

For the client-local generator copies: `diff` them against
`template/reports/multipage/generate-multipage-report.js` so the plan
documents exactly what's being deleted (history is preserved in git).

---

## Current client state (ground truth, 2026-04-23)

```
clients/
├── calgary-castles/scripts/   — 9 files; NO gather-*.js. Has PPC + generate-* + browse.
├── chris-nevada/              — NO scripts/ directory exists at all.
├── laura-willis/scripts/      — 18 files; all 6 gathers present; also populate-audit-data.js.
│   └── reports/multipage/generate-multipage-report.js  ← Fix 14 target
├── liane-jamason/scripts/     — 18 files; all 6 gathers present; also populate-audit-data.js.
│   └── reports/multipage/generate-multipage-report.js  ← Fix 14 target
├── mammoth-lakes/scripts/     — 9 files; NO gather-*.js. Has PPC + generate-* + browse.
├── matt-wallmow/scripts/      — 19 files + lib/; synced to template (Tier 3).
│   └── reports/multipage/generate-multipage-report.js  ← Fix 14 target
├── murray-gardner/scripts/    — 9 files; NO gather-*.js. Same shape as mammoth/calgary/p3.
└── p3realtync/scripts/        — 9 files; NO gather-*.js. Same shape.
```

**Deviation from handoff §5c to flag in the plan:** handoff bucketed
`chris-nevada` into Fix 12 (stale). Reality: chris-nevada has no `scripts/`
directory — they're actually in the Fix 13 bucket (missing entirely). So
Fix 13 applies to 5 clients, not 4, and Fix 12 applies to 2 clients, not 3.

---

## Questions the plan MUST answer

1. **Fix 13 scope.** Does "restore missing scripts" mean only the 6 gather scripts the findings §Missing sections name, or everything in `template/scripts/` (21 files) — matching Step 1.5's recursive-walk contract? Decide and justify.

2. **Fix 12 scope.** Re-template only the 6 gathers for laura/liane, or sweep ALL template drift in their scripts/? What's actually drifted — produce a diff per file per client.

3. **chris-nevada bucket.** Confirm Fix 13 (missing) vs Fix 12 (stale) and adjust the commit plan accordingly.

4. **Fix 14 follow-up.** Delete only, or also add a structural guard (README/comment) at `template/reports/multipage/` to prevent client-local copies from re-emerging? Any scripts / docs / skills reference `clients/<c>/reports/multipage/generate-multipage-report.js`? Grep repo-wide.

5. **PPC scripts propagation.** All 5 Fix-13 clients already have `generate-ppc-*.js` + `parse-google-ads.js`. Are those files drifted vs `template/scripts/`? If Tier 4 syncs recursively, existing PPC scripts get [UPDATE]'d to the template versions — is that intended? Is it entangled with Tier 5 Fix 15 (orphaned PPC workflow)?

6. **Tier 5 Fix 16 entanglement.** Tier 4 is about to propagate the JS gather stack to every client. Does that de-facto-bless the JS path for backlinks / local / DFS and pre-judge Fix 16's "Python OR JS" decision? HANDOFF-POST-TIER-3 §1e.2 says F#54 is architectural not active (only JS path is consumed by renderer), which may mean the decision is already implicit. Confirm and document.

7. **lib/ propagation safety.** `template/scripts/lib/` currently exists only on matt-wallmow. Fix 13 adds it to 5 more. Fix 12 adds it to 2. Check `require()` resolution: does `require('./lib/atomic-write.js')` appear in any script that'd fail when copied to a client with a differently-shaped scripts/ dir? (It shouldn't, because scripts/ is flat on every client, but verify.)

8. **Backup strategy.** Step 1.5's contract creates `scripts/_backup/<timestamp>-<pid>/` when a file is [UPDATE]d. Should offline (b)-approach create the same backup dirs (and gitignore them), or skip the backup since git preserves history? What does hard-rule #2 ("Stage explicitly by path; never `git add .`") force?

9. **Orphan files in Fix-13-target clients.** calgary/mammoth/murray/p3realtync have `check-technical.js`, `browse.js`, `crawl-sitemap.js`, `ddg-search.js` — are any drifted vs template? Fix them as part of Fix 13 or defer?

10. **Per-commit narrowest-boundary verification.** What's the gate for each commit type? At minimum: `diff -r template/scripts/ clients/<c>/scripts/` shows only expected deltas; `node --check clients/<c>/scripts/<file>.js` on every synced script. Does anything need to go further (a dry-run without API calls)?

11. **Commit ordering.** Fix 14 first (pure deletes) or last? Fix 13 before Fix 12 (build up from nothing) or after (clean up stale first)? Justify.

12. **Tier-boundary spills.** If source-code review of the 21 template scripts reveals a pre-existing bug that Tier 4 would propagate to 5+ clients, plan a prep-commit (per §3 HANDOFF-POST-TIER-3 discipline). Don't let a bug spread horizontally.

13. **matt-wallmow under Fix 14.** matt has `reports/multipage/generate-multipage-report.js`. Confirm it's stale vs template, then confirm deletion won't break anything matt-specific. matt is the reference client — extra caution.

---

## Proposed 8-commit plan (INPUT — not final; refactor as warranted)

| # | Fix | Scope | Client(s) |
|---|---|---|---|
| 1 | 13 | copy template/scripts/* → clients/chris-nevada/scripts/ | chris-nevada |
| 2 | 13 | same | calgary-castles |
| 3 | 13 | same | mammoth-lakes |
| 4 | 13 | same | murray-gardner |
| 5 | 13 | same | p3realtync |
| 6 | 12 | re-sync drifted scripts (template → client, backup drift) | laura-willis |
| 7 | 12 | same | liane-jamason |
| 8 | 14 | rm clients/{matt,laura,liane}/reports/multipage/generate-multipage-report.js | batched |

Questions about this that the refined plan should resolve: should the 5
Fix-13 clients batch into one cohort commit (Tier-4 exemption allows
"one commit per cohort")? Is the "full recursive template/scripts/ sync"
the right scope, or should Fix 13 only copy the 6 missing gather scripts
per the finding text? Should Fix 14 batch all 3 deletes or split into 3?

---

## Decision recommendation carried over from handoff §6

Handoff recommends approach (b) — offline sync, no live `/seo-audit` —
because:

- This fix-work clone has no DFS/GBP credentials (those live in 1Password on operator's machine).
- (b) produces a self-contained, reviewable diff per commit.

Confirm this holds, or surface why (a) might be warranted.

---

## Deliverable

Commit the resulting plan as:

- `Claude Code Findings/TIER-4-PLAN.md` — new doc, not an append to an existing finding.

The plan doc must contain:

1. **Executive summary** — scope after all decisions resolved.
2. **Decision record** — each of the 13 questions above, answered with justification and primary-source citations.
3. **Tier 5 look-ahead** — each Tier 5 item, whether Tier 4 affects it, how.
4. **Refined commit plan** — per commit: files touched, pre-verification command(s), exact operations, post-verification command(s), commit message template (body + footer).
5. **Commit dependency graph / ordering rationale.**
6. **Pre-flight checklist** (before commit 1).
7. **Post-flight checklist** (after final commit, before push).
8. **Rollback plan** per commit type.
9. **Tier-boundary spill register** — any prep commits surfaced during source-code review, with their own commit specs.
10. **Propagation matrix** — which template files land on which clients in which commit. (Per-file × per-client grid.)

---

## Hard constraints (from §4 of HANDOFF-POST-TIER-3.md, unchanged)

1. **One fix per commit** (or per cohort, per Tier 4 exemption).
2. **Stage explicitly by path.** Never `git add .` — working tree has `.collab/`, `.playwright-mcp/`, `.codex/` noise.
3. **Don't modify existing finding text.** Append under `## Additional Information` only. The plan doc itself is new, not a finding, so the append-only rule doesn't apply to it.
4. **Don't re-audit from scratch.** Re-read source code for full context; do not produce new finding docs for known files.
5. **Don't skip matt-wallmow verification** on functional fixes. Tier 4 mostly affects OTHER clients; matt is already in sync. Fix 14 includes matt — verify carefully there.
6. **Commit footer:** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
7. **Before pushing:** `gh auth setup-git && git push`.

---

## Fast-start verifications for the planner

```bash
cd /root/site-audit-fix-work
git status                       # expect clean
git log --oneline -15            # last is d21d8f1
git branch --show-current        # site-audit-fixes
PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v
# expect 8/8 passing
```

---

**When the planner finishes,** it should have committed `Claude Code Findings/TIER-4-PLAN.md` and pushed it. Review that, then Tier 4 implementation starts in a fresh session using the plan as the spec.
