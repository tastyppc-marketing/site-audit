# Tier 4 — Ultra Plan request (bulk re-template + client-local generator deletion)

> **Invocation:** run `/ultraplan` from `/root/site-audit-fix-work` with a prompt like
> `Read Claude Code Findings/TIER-4-ULTRAPLAN-BRIEF.md and produce the plan it requests.`

---

## Mode of operation

Produce a durable `TIER-4-PLAN.md` (see §Deliverable). Do NOT implement fixes — planning only.

This brief **pre-resolves the obvious decisions inline** so you focus second-pair-of-eyes effort on the genuinely ambiguous calls. The earlier brief asked too many already-answered questions and demanded blanket reading of 50+ files; that timed out. This version cuts both.

---

## Where we are

- **Working clone:** `/root/site-audit-fix-work/` (production clone at `/root/site-audit/` — don't touch).
- **Branch:** `site-audit-fixes`; local + origin synced at `6b7e013`.
- **Shipped:** Tier 1 (cross-layer) + Tier 1.5 (Step 1.5 auto-sync) + Tier 2 (reliability) + Tier 3 (feature restoration) + 3 Tier-3 advisor catches.
- **Reference client `matt-wallmow`** scripts/ in sync with template.
- **Regression suite:** `PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v` → 8/8 passing.

---

## Required reading (in this order)

1. `Claude Code Findings/HANDOFF-POST-TIER-3.md` — primary, **self-sufficient** by design (see its §0). Older handoffs are historical only; skip unless a citation specifically points there.
2. `CLAUDE.md` (repo root) — fix-work hard rules + per-fix recipe.
3. **System architecture (use these so you don't have to read 21 source files cover-to-cover):**
   - `docs/TANDEM-MAP.md` — purpose-built for fix planning; pre-reconciled with the other architecture docs. Failure themes, cascade index, drift matrix, blast-radius rows. Read first.
   - `docs/SEO-AUDIT-SYSTEM.md` — canonical pipeline spec (every script, every data file, every output). Use as the authority TANDEM-MAP delta-overrides.
   - `Claude Code Findings/FINAL-SYNTHESIS.md` §1 (end-to-end data flow) + §2 (cross-script contract matrix) — adds bug-queue framing from the 67-file audit.
4. `Claude Code Findings/FINAL-SYNTHESIS.md` §5 Tier 4 + the 2026-04-23 "Additional Information" appendix.
5. The 9 Tier-4-relevant findings (full body + any `## Additional Information`):
   - `03-api-gathering/{07-gather-pagespeed,08-gather-domain-metrics,09-gather-backlinks,10-gather-organic-metrics,11-gather-keyword-volumes,12-gather-local-pack,13-gather-local-seo}.md`
   - `04-analysis-population/14-analyze-backlink-quality.md` (Tier-3-new — propagates to every Fix 13 target)
   - `06-generator/21-generate-multipage-report.md` (Fix 14 source)
6. `commands/seo-audit.md` — the Step 1.5 contract.

**Conditional reading** (pull only when a finding's §Drift names them, or when source review surfaces a tier-boundary-spill candidate):
- `03-api-gathering/06-extract-text.md`
- `04-analysis-population/15-populate-audit-data.md`
- `05-deliverables/{17-generate-spreadsheet,18-generate-presentation}.md`
- `10-python-analyzers/{54-analyzers-backlinks,56-analyzers-local-seo}.md`
- `11-python-orchestrators/63-scripts-build-audit.md`
- `12-workflow/67-commands-seo-audit.md`
- Tier 5 look-ahead: `05-deliverables/{16-parse-google-ads,19-generate-ppc-spreadsheet,20-generate-ppc-presentation}.md`, `09-python-connectors/41-connectors-dataforseo.md`, `10-python-analyzers/62-analyzers-ppc-analyzer.md`

---

## Source-code reading

Architecture docs in §3 above explain how everything fits together; read those before you reach for source files. Read source in full only when (a) the diff for that file shows nontrivial drift you can't classify from the docs + finding alone, OR (b) something suggests a tier-boundary-spill candidate (a pre-existing template bug that would propagate to 5+ clients).

Diff sources of truth:
- `diff -r template/scripts/ clients/<c>/scripts/` for each Fix 12 / Fix 13 client.
- `diff template/reports/multipage/generate-multipage-report.js clients/<c>/reports/multipage/generate-multipage-report.js` for matt-wallmow, laura-willis, liane-jamason (Fix 14).
- `commands/seo-audit.md` Step 1.5 block (the auto-sync contract — your offline mechanism must match its semantics).

---

## Current client state (ground truth, 2026-04-23)

```
clients/
├── calgary-castles/scripts/   — 9 files; NO gather-*.js. Has PPC + generate-* + browse.
├── chris-nevada/              — NO scripts/ directory exists at all.  ← Fix 13 (missing)
├── laura-willis/scripts/      — 18 files; all 6 gathers present; also populate-audit-data.js.
│   └── reports/multipage/generate-multipage-report.js  ← Fix 14 target
├── liane-jamason/scripts/     — 18 files; all 6 gathers present; also populate-audit-data.js.
│   └── reports/multipage/generate-multipage-report.js  ← Fix 14 target
├── mammoth-lakes/scripts/     — 9 files; NO gather-*.js. Same shape as calgary/murray/p3.
├── matt-wallmow/scripts/      — 19 files + lib/; synced to template (Tier 3).
│   └── reports/multipage/generate-multipage-report.js  ← Fix 14 target
├── murray-gardner/scripts/    — 9 files; NO gather-*.js.
└── p3realtync/scripts/        — 9 files; NO gather-*.js.
```

**Bucket count after correction:** Fix 13 → **5 clients** (chris-nevada + calgary + mammoth + murray + p3). Fix 12 → **2 clients** (laura, liane). Fix 14 → 3 clients (matt, laura, liane).

---

## Pre-resolved decisions (DO NOT re-litigate)

| # | Decision | Rationale |
|---|---|---|
| PR-1 | **Approach (b) — offline sync, no live `/seo-audit`** | This clone has no DFS/GBP creds (1Password lives on operator's machine). (b) produces reviewable per-commit diffs. |
| PR-2 | **No `scripts/_backup/<ts>-<pid>/` dirs in offline (b)** | Hard rule #2 forbids `git add .`; git history preserves prior client state. `_backup/` is Step 1.5 runtime convention; offline mode skips it. (Step 1.5 will still create them on the next live audit — that's fine.) |
| PR-3 | **chris-nevada is Fix 13 (missing), not Fix 12 (stale)** | Has no `scripts/` dir at all. Handoff §5c bucketed wrong; correction documented above. |
| PR-4 | **Fix 13 scope: full recursive `template/scripts/` → `clients/<c>/scripts/`** | Mirrors Step 1.5's recursive-walk contract exactly. Half-scope (only the 6 gather scripts) would diverge from the runtime sync next time `/seo-audit` runs. |
| PR-5 | **Fix 14 = pure deletes only** | No template-side structural guard (e.g., README at `template/reports/multipage/`). Out of Tier 4 scope; bundle with Tier 5 if needed. |
| PR-6 | **One commit per client cohort** for Fix 12 / Fix 13 | Tier 4 has the explicit cohort-exemption from "one fix per commit" (HANDOFF §4 #1). Per-client commits keep diffs reviewable. |

---

## What we need YOU to decide (the actual planner work)

Eight items. Cite primary sources in the plan.

1. **Fix 12 per-client diff & cohort granularity.** For laura-willis and liane-jamason: produce a per-file diff vs template, classify each delta (drift-fix vs Tier-3-new addition vs intentional-fork-worth-preserving), decide whether to commit as one cohort or one-per-client. (Liane historically had a 208-line `gather-backlinks.js` fork — flag any preserve-worthy logic; HANDOFF §5f.)

2. **PPC scripts propagation entanglement with Tier 5 Fix 15.** All 5 Fix-13 clients already have `generate-ppc-*.js` + `parse-google-ads.js`. PR-4 says Fix 13 is recursive — that means those PPC scripts get [UPDATE]'d to template versions. Diff template's PPC scripts vs client copies; decide: propagate now (and document the implication for Fix 15), OR scope-exclude PPC files from Fix 13 to keep Fix 15 unconstrained. Justify.

3. **Tier 5 Fix 16 entanglement.** HANDOFF-POST-TIER-3 §1e.2 confirmed F#54 dual-classifier is architectural-not-active (only the JS path is consumed by the renderer). Tier 4 propagates the JS gather stack to all clients — does this de-facto-bless the JS path for backlinks/local/DFS and pre-judge Fix 16's "Python OR JS" decision? Document for the record; this isn't a blocker, just needs to be on paper.

4. **`lib/` propagation safety.** `template/scripts/lib/` exists only on matt. After Fix 13, it lands on 5 more clients (and on laura/liane via Fix 12). Grep `template/scripts/*` for `require('./lib/...')` — confirm no path-shape mismatch when copied into a flat client `scripts/` dir. (Should be fine; verify.)

5. **Tier-boundary spill register.** During the diff + source review, surface anything pre-existing in `template/scripts/` that would propagate horizontally to 5+ clients as a known bug. Tier 3 had two such prep commits (`d98fc43`, `ef94747`); Tier 4 may have its own. Spec each as its own narrow prep commit.

6. **Per-commit narrowest-boundary verification gate.** At minimum:
   - `diff -r template/scripts/ clients/<c>/scripts/` after the sync — expect zero deltas (or only the intentional-skip set you justified in #2).
   - `node --check clients/<c>/scripts/<file>.js` on every synced script.
   Decide whether to add anything else (a dry-run without API calls, or grep-based config-key-presence checks). Justify minimalism vs thoroughness.

7. **Commit ordering.** Fix 14 first (pure deletes, smallest blast radius) or last (after the re-template work that may discover something)? Fix 13 before Fix 12 or after? Justify.

8. **Refined commit plan.** Adapt or refactor the input table below. Specific files per commit, exact ops, commit message bodies.

---

## Proposed 8-commit plan (input — adapt as warranted)

| # | Fix | Scope | Client(s) |
|---|---|---|---|
| 1 | 13 | recursive `template/scripts/*` → `clients/chris-nevada/scripts/` (mkdir first) | chris-nevada |
| 2 | 13 | same | calgary-castles |
| 3 | 13 | same | mammoth-lakes |
| 4 | 13 | same | murray-gardner |
| 5 | 13 | same | p3realtync |
| 6 | 12 | re-sync drifted scripts | laura-willis |
| 7 | 12 | same | liane-jamason |
| 8 | 14 | `rm clients/{matt-wallmow,laura-willis,liane-jamason}/reports/multipage/generate-multipage-report.js` | batched |

---

## Deliverable

Commit `Claude Code Findings/TIER-4-PLAN.md` (new doc, not an append). Required sections:

1. **Executive summary** — final scope after all decisions resolved.
2. **Decision record** — your answers to the 8 questions above, with primary-source citations.
3. **Tier 5 look-ahead** — which Tier 5 items Tier 4 affects (Fix 15 PPC, Fix 16 dual-path, spam-classifier calibration), and how. Keep it brief.
4. **Refined commit plan** — per commit: files touched, pre-verification command(s), exact operations, post-verification command(s), commit-message body template.
5. **Tier-boundary spill register** — any prep commits surfaced; spec each as its own commit.
6. **Propagation matrix** — per-file × per-client grid (which template files land on which clients in which commit).
7. **Pre-flight + post-flight checklists.**
8. **Rollback plan** per commit type.

---

## Hard constraints (from HANDOFF-POST-TIER-3 §4)

1. One fix per commit (Tier 4 cohort exemption: one commit per cohort allowed).
2. Stage explicitly by path. Never `git add .` (working tree has `.collab/`, `.playwright-mcp/`, `.codex/` noise).
3. Don't modify existing finding text — append under `## Additional Information` only. (The plan doc itself is new, not a finding, so this doesn't apply to it.)
4. Don't re-audit from scratch. Re-read source for context; do not produce new finding docs.
5. matt-wallmow is the reference client. Fix 14 includes matt — verify the deletion carefully there.
6. Commit footer: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
7. Before pushing: `gh auth setup-git && git push`.

---

## Fast-start verifications

```bash
cd /root/site-audit-fix-work
git status                       # expect clean
git log --oneline -5             # last is 6b7e013 (this brief)
git branch --show-current        # site-audit-fixes
PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v
# expect 8/8 passing
```

---

**When the planner finishes,** it should have committed `Claude Code Findings/TIER-4-PLAN.md` and pushed it. Review that, then Tier 4 implementation starts in a fresh session using the plan as the spec.
