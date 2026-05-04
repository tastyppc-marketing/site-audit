# Tier 5 Execution Plan — Final

**Layered on top of:** `Claude Code Findings/HANDOFF-TIER-5-WIP.md` + `Claude Code Findings/TIER-5-PLAN.md`. Does not replace them — adds (a) new findings from this session's audit scrub, (b) revised phase ordering, (c) gating discipline.

## Context

Tier 5 is the architectural-cleanup tier. The actual purpose, per `tier-5-client-env-segregation-top-priority-global` bd memory and the user's explicit framing, is **client env/data segregation via a `ClientContext` wrapper (Python) + `loadClientEnv(slug)` helper (JS)**. Everything else (dead-code retirement, dual-path resolution, repo hygiene) is supporting cleanup.

User asked for a deeper cross-file scrub before execution because the prior 2026-04-29 audit was empirically wrong on most phases (caught at Phase A1 pre-flight). This session's scrub surfaced 2 verified orphan producers, 5 new dual paths, 1 hardcoded-test-data hit, and 15 suspect orphan consumers (most likely populate-bridge artifacts — verification pass running). User locked in execution order, gating discipline, propagation timing, and architecture rule. This plan reflects all of that.

## Architecture rule (user-locked)

**JS template/scripts own client-run data gathering. Python should not duplicate live API gather paths unless there is a specific platform-only reason.**

- JS owns DataForSEO gather scripts that write `seo/research/*.json`.
- Generator/normalizer consumes those research files.
- Python analyzers should produce only **derived analysis** that's actually consumed.
- Python producers that duplicate JS gather output get **soft-deprecated first**, then deleted after consumer-trace verification (no renderer/generator still consumes their shape).

This rule applies retroactively to all 5 dual-path findings + the 6 known DFS conflicts.

## Phase ordering (user-locked)

**Phase 0 — Minimal pre-commit guardrails.** Install `pre-commit` framework BEFORE any code commits so every Tier 5 commit is validated. Hooks (minimal only):
- Block any commit touching `clients/*/.env`
- Trailing whitespace + EOF newline normalization
- (Optional, tune later) template/client sentinel guard
- (Optional, tune later) hardcoded-client-name grep

Heavy lint / pytest / report-gen go to manual gates or CI later, not pre-commit. Reason: missing-deps and other instability still in flight; strict hooks block forward motion. Add `clients/*/.env` to `.gitignore` in the same Phase 0 commit.

**Phase D — vaderSentiment cleanup (verified clean).**
Per WIP handoff §6 Phase D, ~3 commits:
- D1: Delete `LocalSeoAnalyzer.analyze_review_sentiment()` + call + dict entry. Keep try/except-import guard.
- D2: Remove `vaderSentiment>=3.3.2` from `platform/pyproject.toml`.
- D3: Delete 9 sentiment tests + update `test_full_analyze:269` + update `docs/SEO-AUDIT-SYSTEM.md:51`.

Per-commit verification: `pytest platform/tests/ --tb=no -q` passes; `grep -rn "reviewSentiment\|vaderSentiment" platform/src template` returns zero hits after D2+D3.

**Phase F — Repo hygiene (.bak + .collab + qa-test).** ~3 commits:
- F1: `git rm` 4 tracked `.bak` files. Add `*.js.bak` to `.gitignore`. Closes bd `c6r`.
- F2: Per decision 5a — drop `.collab/collab.db`; per user direction, file the `.md` keep-or-drop in bd if not yet decided (actionable below). Add `.collab/` to `.gitignore`. Closes bd `8d2`.
- F3: De-hardcode `template/reports/multipage/qa-test.js:129` — replace Mammoth Lakes assertions with config-derived expected values OR generic "client name/domain rendered" assertions. New finding, low risk.

**Verification gate — pre-Phase-E.** Two read-only investigations, both must complete before Phase E starts:
- **G1: 15 suspect orphan consumers — DONE this session.** Trace complete. Result: **ZERO genuinely orphaned**. Classification: 6 populate-produced (`advantages`, `competitorComparison`, `competitorStrategies`, `siteComparison`, `contentCalendar`, `blogPostsCreated`-related), 3 normalizer-derived (`keyStats`, `searchConsoleData`, `trafficData`), 6 agent-populated via `commands/seo-audit.md` Step 8a manual instructions (lines 1212-1219: `deliverables`, `keyPagesCreated`, `longTermColumns`, `mediumTermRoadmap`, `pillars`, `nextSteps`). User's prediction was correct — populate-bridge artifacts, not orphans. No deletions added to Phase B from this list. The two verified orphan producers (`discoveredCompetitors`, `unlinkedMentions`) remain Phase B deletion candidates after one final grep through generator/normalizer/search-index code, per user direction.
- **G2: 5e reconciliation.** ALREADY DONE this session. `connectors/local_seo.py:214-324` (`check_local_pack` → `_check_local_pack_via_dataforseo` → `DataForSEOConnector.get_local_pack`) IS a real DFS dual-path with `template/scripts/gather-local-pack.js`. Phase B's original "analyzer has zero DFS" claim stands (different file). Reclassify finding as connector-vs-JS, not analyzer-vs-JS. Per architecture rule: JS wins, Python connector path soft-deprecated.

**Phase E — ClientContext + env-loading refactor (the main event).**
Per WIP handoff §6 Phase E, ~25-28 commits, organized in stages:

- E-Python-1: Build `ClientContext` class (~40 LOC, wraps pydantic Settings, uses `dotenv_values`).
- E-Python-2: Refactor `connectors/base.py:42` `BaseConnector.__init__` to accept `ctx: ClientContext`.
- E-Python-3: Refactor `scripts/build_audit.py:821` main orchestrator to construct `ClientContext` from slug arg + thread through.
- E-Python-4: Fix `analyzers/reporting_intelligence.py:572` `os.environ.get("ANTHROPIC_API_KEY")` bypass — route through `ClientContext`.
- E-Python-5..N: Refactor 13 test scripts in `platform/scripts/` to take `--client-slug` arg + construct `ClientContext`.
- **E-Smoke-Python:** matt-wallmow smoke test — one credentialed gather (DFS-backed) + one analyzer + sanity check that the Python pipeline still produces an audit. Halt and triage if anything regresses.
- E-JS-1: Build `lib/load-client-env.js` helper.
- E-JS-2..7: Replace `process.env.X` with `loadClientEnv(slug).X` in 6 template gather scripts.
- E-JS-update-orchestrator: Update `commands/seo-audit.md` to thread slug explicitly (today's flow is `cd`-based).
- **E-Smoke-JS:** matt-wallmow smoke test — one JS gather invocation against new helper, confirm it reads from the right `.env`.
- **E-Smoke-Render:** Generate the multipage report against matt-wallmow, open and visually confirm key sections (CWV, links, backlinks, competitors, local) populate. Confirm no client-specific data leaked into `template/`.
- E-Cohort-Propagate: Run Step 1.5 once across the cohort. Single commit (or one per client, decide at the time). Inspect any backups/orphan warnings. Calgary's known fork stays an exception.

Smoke tests are commit-able artifacts (a smoke-test log or assertion script) — not throwaway runs.

**Phase C — Spam-classifier + backlinks-page cleanup (per decisions 5c + 5d).**
~6-9 commits + cohort propagation. Specific shape depends on user answers to 5c (kill all three classifiers vs partial) and 5d (strip backlinks page to raw `referring_domains[]` vs keep heuristic UI). **Open — surfacing again below.**

**Phase B — Dead-code deletion (re-scoped).**
After E exists, B deletes dead Python code against the new ClientContext API surface. ~6-10 commits including:
- New from this scrub: delete `competitorAnalysis.discoveredCompetitors` write (`competitor.py:374-380`).
- New from this scrub: delete `contentGap.unlinkedMentions` write (`build_audit.py:400`).
- New from G1 verification: delete genuinely-orphaned fields surfaced by G1 (count TBD after G1 lands).
- WIP handoff §6 Phase B items: `competitor.py` dead-code paths; `content_gap.py` entirely; `local_seo.py` analyzer dead-code paths; `connectors/local_seo.py` `check_local_pack` Python path soft-deprecate per architecture rule.
- Decision 5b — `rank_tracker.py` orphan: build out in future tier OR delete + delete renderer code at `:1040-1094` and `:2589-2642`. **Open — surfacing again below.**

**Phase A4 — Standalone retirement.** Single commit, independent of all others: retire `get_keyword_overlap` from `dataforseo.py` (zero callers, verified). Schedule near end as a low-stakes capstone.

**Final — `HANDOFF-POST-TIER-5.md` + FINAL-SYNTHESIS Tier 5 SHIPPED appendix.**

Total estimated: **45-55 commits** (unchanged from WIP estimate; new findings absorbed into existing phases).

## Open user decisions (still blocking specific phases)

These were carried forward from the WIP handoff §5. User has not yet answered:

| # | Decision | Blocks |
|---|---|---|
| 5a | `.collab/.md` files — keep in `/root/site-audit-retired/.collab/` or drop entirely | Phase F2 |
| 5b | `rank_tracker.py` orphan — build out (defer) or delete + remove renderer-side code at `:1040-1094`, `:2589-2642` | Phase B |
| 5c | Phase C dual classifier — kill all three (JS + Python + renderer heuristic) per strict D1, or kill only JS | Phase C |
| 5d | Phase C page redesign — strip backlinks page to raw `referring_domains[]` table, or keep heuristic health analysis section (~100 LOC of UI) | Phase C |

Phase 0, D, F, the verification gate, and Phase E can all proceed without these answers. C and B are blocked.

## Critical files

- `/root/site-audit-fix-work/CLAUDE.md` — fix-work hard rules + TANDEM override (never push without explicit user direction)
- `/root/site-audit-fix-work/Claude Code Findings/HANDOFF-TIER-5-WIP.md` — prior context
- `/root/site-audit-fix-work/Claude Code Findings/TIER-5-PLAN.md` — prior plan with §2.5 audit re-verification
- `/root/site-audit-fix-work/.gitignore` — add `clients/*/.env`, `*.js.bak`, `.collab/` (Phase 0 + F)
- `/root/site-audit-fix-work/.pre-commit-config.yaml` — new file in Phase 0
- `/root/site-audit-fix-work/platform/src/audit_platform/config/settings.py` — current pydantic Settings (Phase E baseline)
- `/root/site-audit-fix-work/platform/src/audit_platform/connectors/base.py:42` — Phase E refactor point
- `/root/site-audit-fix-work/platform/src/audit_platform/connectors/local_seo.py:214-324` — DFS dual-path soft-deprecate
- `/root/site-audit-fix-work/platform/src/audit_platform/analyzers/local_seo.py:23-27,67,77,96-182` — Phase D vaderSentiment cleanup
- `/root/site-audit-fix-work/platform/src/audit_platform/analyzers/reporting_intelligence.py:572` — Phase E env-bypass fix
- `/root/site-audit-fix-work/platform/src/audit_platform/analyzers/competitor.py:374-380` — Phase B orphan-producer delete
- `/root/site-audit-fix-work/platform/scripts/build_audit.py:400,821` — Phase B orphan-producer delete + Phase E entry refactor
- `/root/site-audit-fix-work/platform/pyproject.toml` — Phase D vaderSentiment removal
- `/root/site-audit-fix-work/platform/tests/test_local_seo.py:83-129,269` — Phase D test cleanup
- `/root/site-audit-fix-work/template/scripts/populate-audit-data.js` — G1 verification target
- `/root/site-audit-fix-work/template/scripts/gather-*.js` (6 scripts) — Phase E JS refactor
- `/root/site-audit-fix-work/template/scripts/analyze-backlink-quality.js` — Phase C classifier (pending 5c)
- `/root/site-audit-fix-work/template/reports/multipage/generate-multipage-report.js:2275-2380` — Phase C renderer-side classifier (pending 5c)
- `/root/site-audit-fix-work/template/reports/multipage/pages/backlink-opportunities.js:349-454` — Phase C UI strip (pending 5d)
- `/root/site-audit-fix-work/template/reports/multipage/qa-test.js:129` — Phase F3 hardcoded-test cleanup
- `/root/site-audit-fix-work/commands/seo-audit.md` — Phase E orchestrator update + G1 trace target
- `/root/site-audit-fix-work/lib/load-client-env.js` — new file in Phase E
- `/root/site-audit-fix-work/docs/SEO-AUDIT-SYSTEM.md:51` — Phase D doc cleanup

## Verification

**Per-commit (every commit, all phases):**
- `pytest platform/tests/ --tb=no -q` passes
- Pre-commit hooks pass (Phase 0 onward)
- One fix per commit; staged explicitly by path; commit footer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

**Phase D-specific:**
- `grep -rn "reviewSentiment\|vaderSentiment" platform/src template` returns zero hits after D2+D3.

**Phase F-specific:**
- `find . -name "*.js.bak" -not -path "./node_modules/*"` returns zero hits after F1.
- `git ls-files | grep .collab/` returns zero hits after F2.
- qa-test.js runs against generated test output for matt-wallmow without hardcoded-string assertion failures.

**Phase E gates (smoke tests):**
- E-Smoke-Python: matt-wallmow audit runs end-to-end via `python -m audit_platform.scripts.build_audit --client-slug matt-wallmow` (or equivalent post-refactor entry); no `os.environ` reads outside ClientContext; report data fields populate as before.
- E-Smoke-JS: one gather (e.g., `gather-domain-metrics.js`) invoked with new `loadClientEnv(slug)` helper, reads correct `.env`, writes correct `seo/research/*.json`.
- E-Smoke-Render: `node template/reports/multipage/generate-multipage-report.js --data clients/matt-wallmow/seo/audit-data.json --output ... --inline` produces a report whose Index/Keywords/Content/Technical/Links/Competitors/Local/Action-Plan pages all pass the parent HANDOFF.md verification checklist (lines 80-91).
- E-Cohort-Propagate: after Step 1.5 propagation, `git diff template/scripts clients/*/scripts -- ':!clients/calgary*'` shows no drift outside the documented Calgary exception.

**Final pre-push verification:**
- `gh auth setup-git` (HTTPS remote needs gh credential helper)
- User explicitly approves push (TANDEM rule §3 — never push without explicit user direction)

## Hard rules (carried forward)

1. One fix per commit; cohort commits only for mechanical Step-1.5 propagation
2. Don't modify finding text — append under `## Additional Information`
3. Stage explicitly by path — never `git add .`
4. Don't push without explicit user direction (TANDEM §3)
5. Commit footer: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
6. matt-wallmow is the reference client for all functional verification
7. `gh auth setup-git` before any `git push`
8. **Trust empirical re-verification, not prior audit framings** — the 2026-04-29 audit was wrong on most phases. This session re-confirmed: agent claims about file paths/labels can drift (5e was a real conflict but mislabeled).

---

**Ready to exit plan mode once user confirms.** Outstanding before execution: 5a, 5b, 5c, 5d (block C and B and F2 only — Phases 0, D, F1, F3, G1 verification, and E can start immediately). G1 agent still running; results will sharpen Phase B's deletion list.
