# Handoff — Tier 5 WIP, Mid-Planning

**Written:** 2026-05-03
**Branch:** `site-audit-fixes-tier-5` (forked from `site-audit-fixes-tier-4-followups` at `b7d1f10`).
**State:** No code changes yet. 3 plan/doc commits on the branch. Awaiting 4 user decisions before execution begins.
**Repo root:** `/root/site-audit-fix-work/` — production clone at `/root/site-audit/` is untouched.

**This handoff is designed to be fully self-sufficient.** A fresh session can read this single doc + `TIER-5-PLAN.md` and resume cold without chaining through prior handoffs. Everything below — the 4 audit re-verifications, the 10 locked decisions, the 4 open decisions, the prior crashed-session context — is captured here durably. **No context is sacrificed.**

---

## 1. Required reading on session resume (in order)

| Doc | Why |
|---|---|
| `Claude Code Findings/HANDOFF-TIER-5-WIP.md` (this file) | Resume context |
| `Claude Code Findings/TIER-5-PLAN.md` | The actual plan with all locked decisions, audit re-verification findings (§2.5), and revised per-phase scopes |
| `Claude Code Findings/HANDOFF-POST-TIER-4-FOLLOWUPS.md` | Tier 4 followups context (the tier this branch forked from) |
| `Claude Code Findings/HANDOFF-POST-TIER-4.md` | Tier 4 context |
| `CLAUDE.md` | Fix-work hard rules (one fix per commit, never `git add .`, TANDEM override: never push without explicit user direction) |
| `bd ready` | Live punch list — should show `c6r`, `8d2`, `5hy` open at minimum |

---

## 2. The story so far — how we got here

### 2a. Two prior sessions

1. **2026-04-29 session** (crashed) — scoped Tier 5 directionally. Captured 10 decisions to `bd remember` + filed bd issue `5hy` (SOP) + initialized `/root/site-audit-retired/` repo with `3cd3697 init`. Crashed before drafting formal plan. Last 4 questions on screen were unanswered.
2. **2026-05-03 session** (this one, in progress) — recovered all crashed-session context from `/root/.claude/projects/-root-site-audit-fix-work/b57839ee-2088-46eb-a3a0-39b9ed1a5a24.jsonl`, answered the 4 open env-segregation questions, drafted `TIER-5-PLAN.md`, **then re-verified every audit claim and found most of them empirically wrong**.

### 2b. Why audit re-verification happened

Pre-flight check before Phase A1 (retire `analyzers/backlinks.py`) found `BacklinkAnalyzer` is an active `AuditStep` at `build_audit.py:69`, and the renderer reads 6+ fields from `audit_data["backlinks"]` (`domainMetrics`, `competitorDomainMetrics`, `referringDomains`, `anchorDistribution`, `qualitySummary`, `anchorIssues`, `brokenBacklinkOpportunities`). The 2026-04-29 audit had confused "import-only check" with "consumer-trace check." Retiring as planned would have broken the report.

User direction: re-verify every other phase's claims with the same scrutiny. **4 parallel Explore agents dispatched; results captured in `TIER-5-PLAN.md §2.5`.**

---

## 3. Branch state

```
site-audit-fixes-tier-5  (3 commits ahead of site-audit-fixes-tier-4-followups)
├── <hash> docs(tier-5): commit Tier 5 plan with locked decisions
├── <hash> docs(tier-5): invalidate audit's "Python is dead" claim, revise Phase A
└── <hash> docs(tier-5): full audit re-verification across phases B/C/D/E/F
```

Run `git log --oneline -5` on resume to confirm hashes. **No code changes yet — only plan docs.** Tree should be clean (or with `.codex/` and `.claude/settings.local.json` noise per usual).

**Push status:** NOT pushed to origin. CLAUDE.md TANDEM rule §3 = never push without explicit user direction. User has not yet authorized push.

---

## 4. The 10 locked decisions (from prior sessions, all in bd memory)

| # | Decision | bd memory key |
|---|---|---|
| D1 | Spam classifier OMITTED entirely — no warning UI either | `tier-5-spam-classifier-omitted-entirely-strengthened-from` |
| D2 | Dual-path retirement = MOVE to `/root/site-audit-retired/` (path-mirror, per-file header) | `tier-5-dual-path-retirement-move-to-removed` + `tier-5-retired-code-archive-lives-at-root` |
| D3 | JS wins for all 6 DFS endpoint conflicts (per original audit — see §6 below for revisions) | (audit findings 2026-04-29) |
| D4 | vaderSentiment dead code removed; revert from `pyproject.toml` | bd issue `5hy` |
| D5 | Python env-loading = `ClientContext` class (~40 LOC); wraps pydantic Settings; uses `dotenv_values` | `tier-5-python-env-loading-clientcontext-class-option` |
| D6 | JS env-loading = `lib/load-client-env.js` helper; `process.env.X` → `env.X` | `tier-5-js-env-loading-custom-lib-load` |
| D7 | Pre-commit safety = `pre-commit` framework + `.gitignore clients/*/.env` | `tier-5-pre-commit-safety-pre-commit-framework` |
| D8 | New-client onboarding = `/new-client` skill | `tier-5-new-client-onboarding-build-new-client` |
| D9 | PPC workflow OUT of Tier 5 (user building separately) | `ppc-workflow-fix-15-is-out-of-tier` |
| D10 | bd hygiene (c6r + 8d2) = post-op | (this session 2026-04-29) |

**Overriding principle, captured separately:** `tier-5-overriding-principle-reliability-durability-consisten` — "reliability, durability, consistency. Not simplicity. Choose paths with smallest failure surface, fewest false positives, most boring/well-tested patterns. Avoid cleverness."

---

## 5. The 4 OPEN decisions awaiting user input

These block autonomous execution of Phases B and C. Phases D, E, F can proceed without them.

### 5a. `.collab/.md` files — keep or drop?

`.collab/` directory has 10 tracked files:
- `collab.db` (104K) — definitely drop, it's a session database
- 9 `.md` files (`partner-prompt-claude.md`, `partner-prompt-codex.md`, `partner-prompt-gemini.md`, `partner-prompt.md`, `prompt-claude-diag.md`, `prompt-claude-impl.md`, `prompt-codex.md`, `prompt-gemini.md`, `prompt-orchestrator.md`) — orchestration prompts for multi-LLM collaboration

**Question:** drop all 10 (treat `.collab/` as ephemera), or keep the 9 `.md` files in `/root/site-audit-retired/.collab/`?

### 5b. `rank_tracker.py` orphan — build it out or delete the waiting renderer code?

`platform/src/audit_platform/analyzers/rank_tracker.py` exists but is NOT registered in `build_audit.py` SEO_STEPS. The renderer at `generate-multipage-report.js:1040-1094` and `:2589-2642` has full code waiting to consume `rankHistory` data, but nothing produces it (Python orphan, no JS gather script).

**Question:** build it out properly in a future tier (defer + leave renderer code), OR delete the orphaned analyzer + the renderer code that waits for it?

### 5c. Phase C dual classifier — kill both, or kill only JS?

Two parallel spam classifiers exist:
- JS: `template/scripts/analyze-backlink-quality.js` (writes `qualitySummary` with `legitimate/suspicious/spam` + `topLegitimate[]`/`topSpam[]`)
- Python: `analyzers/backlinks.py:122` (writes `qualitySummary` with `highQuality/mediumQuality/lowQuality` counts)
- Renderer fallback at `generate-multipage-report.js:2275-2380` is an INDEPENDENT third classifier (heuristic rules: TLD patterns, FR signals, anchor text, dofollow status) that always runs.

User's stated direction (D1) was OMIT classifier entirely. Strict interpretation = kill all three.

**Question:** confirm strict interpretation (kill all three classifiers + the renderer's heuristic), or keep one of them?

### 5d. Phase C page redesign — strip to raw list, or keep heuristic health analysis?

`pages/backlink-opportunities.js:349-454` renders the entire "Referring Domain Health Analysis" section (~100 LOC of UI: health rating, domain counts, charts, recommendations, spam/quality tables) **from the renderer's heuristic classifier output** (the third one), NOT from the JS or Python classifier directly.

If we kill all three classifiers (per D1 strict), this UI section disappears. User's earlier direction was "Backlinks page just shows the raw `referring_domains[]` list with `domain_rating`, `is_dofollow` — let the user judge."

**Question:** confirm strip-to-raw-list (lose the ~100 LOC of health UI), OR keep the heuristic health analysis (since it's classifier-independent post-redesign — actually it's not, it depends on the heuristic classifier; need to confirm intent)?

---

## 6. Per-phase revised scope (full detail in TIER-5-PLAN.md §2.5)

### Phase A — VERIFIED, 1 commit

- A4: Retire `get_keyword_overlap` from `dataforseo.py` (zero callers, verified).
- A1, A2 deferred to Phase B (Python backlinks code is alive — see TIER-5-PLAN §2.6).
- A3 (`get_keyword_volumes`) needs separate re-verification before commit.

### Phase B — INVALIDATED, re-scope as dead-code deletion + orphan decision

| Analyzer | Verified state | Action |
|---|---|---|
| `competitor.py` | DFS calls real, but only `domainMetrics` consumed (sourced from JS, not Python). `keywordOverlap`, `serpFeatures`, `techStack` written but unread. | Delete dead-code paths; keep domain-metrics retrieval. |
| `content_gap.py` | 100% dead. All 3 outputs unconsumed. No JS equivalent. | Delete entirely (analyzer + AuditStep registration + tests). |
| `rank_tracker.py` | Not registered in `build_audit.py`. Orphaned. | **Awaits decision 5b.** |
| `local_seo.py` (pack-check) | Calls ZERO DFS endpoints (audit claim false). 80% of outputs dead. | Delete dead-code paths; keep research-file fallback for `businessProfile`/`napConsistency`/`citations`. |

Phase B is no longer "refactor 4 analyzers to read JSON" — it's "delete dead code + decide rank_tracker fate." Estimated 6-10 commits.

### Phase C — CRITICAL GAPS, awaits decisions 5c + 5d

Once 5c and 5d resolved, Phase C becomes:
1. (If 5c=strict) Move JS classifier to retired repo + propagate to 8 clients
2. (If 5c=strict) Delete Python classifier writes in `analyzers/backlinks.py`
3. Delete renderer's heuristic classifier (lines 2275-2380)
4. Delete Step 5.5 in `commands/seo-audit.md`
5. (If 5d=strip) Reduce `pages/backlink-opportunities.js` to raw `referring_domains[]` table
6. Update `populate-audit-data.js` (Step 5.6) to no longer expect `qualitySummary`

Estimated 6-9 commits + cohort propagation.

### Phase D — VERIFIED CLEAN, ~3 commits ready to ship

| Commit | Action |
|---|---|
| D1 | Delete `LocalSeoAnalyzer.analyze_review_sentiment()` (`local_seo.py:96-182`) + the call at `:67` + the result-dict entry at `:77`. Leave try/except-import guard at `:23-27`. |
| D2 | Remove `vaderSentiment>=3.3.2` from `platform/pyproject.toml`. |
| D3 | Delete 9 sentiment tests at `platform/tests/test_local_seo.py:83-129` + update assertion in `test_full_analyze:269` (remove `assert "reviewSentiment" in result`). Update `docs/SEO-AUDIT-SYSTEM.md:51` to remove "review sentiment" from feature list. |

Verification per commit: `pytest platform/tests/ --tb=no -q` passes; `grep -rn "reviewSentiment\|vaderSentiment" platform/src template` returns zero hits after D2+D3.

### Phase E — surface mapped, ready to plan execution

**Python side (15 refactor points):**
- `connectors/base.py:42` — `BaseConnector.__init__(settings or Settings())` — refactor to take `ctx: ClientContext`
- `scripts/build_audit.py:821` — main orchestrator entry — construct `ClientContext` from slug arg, thread through
- `analyzers/reporting_intelligence.py:572` — **direct `os.environ.get("ANTHROPIC_API_KEY")` bypass** — must route through `ClientContext`
- 13 test scripts in `platform/scripts/` — refactor to take `--client-slug` arg + construct `ClientContext`

**JS side:**
- 6 template gather scripts: `gather-backlinks.js`, `gather-local-pack.js`, `gather-keyword-volumes.js`, `gather-organic-metrics.js`, `gather-domain-metrics.js`, `gather-pagespeed.js`
- Replace `process.env.X` with `loadClientEnv(slug).X` in each
- Propagate to 9 clients via Step 1.5 (auto-sync at next `/seo-audit` invocation, or one cohort commit)

**Hazards:**
- Slug flow today is `cd`-based, not arg-passed. Phase E must thread slug explicitly. `commands/seo-audit.md` orchestrator needs updating.
- `.gitignore` has `.env` but not `clients/*/.env`. Add the pattern.
- No `.pre-commit-config.yaml` exists. Build it from scratch.
- No `dotenv` npm dep — Option B unblocked.
- No module-level `Settings()` caching — refactor straightforward.

Estimated 25-28 commits.

### Phase F — concrete and clean, ~2 commits

| Commit | Action |
|---|---|
| F1 | Close `c6r`: `git rm` the 4 tracked `.bak` files (`template/reports/multipage/generate-multipage-report.js.bak` + same path under `clients/{matt-wallmow,laura-willis,liane-jamason}/`). Add `*.js.bak` to `.gitignore`. |
| F2 | Close `8d2`: per decision 5a — drop `collab.db` regardless; keep or drop `.md` files based on user answer. Add `.collab/` to `.gitignore`. |

---

## 7. Recommended resume order

1. **Read this handoff + TIER-5-PLAN.md** (full context recovery)
2. **User answers the 4 open decisions** (5a, 5b, 5c, 5d)
3. **Ship Phase D first** — verified clean, smallest scope, builds momentum on a known-safe target. ~3 commits.
4. **Ship Phase F next** — clean and quick once 5a is resolved. ~2 commits.
5. **Ship Phase E** — no audit-trust issues; proceed per the 25-28 commit plan in TIER-5-PLAN §7.
6. **Ship Phase C** — once 5c + 5d are answered, ~6-9 commits + propagation.
7. **Ship Phase B** — re-scoped to dead-code deletion + rank_tracker decision (5b), ~6-10 commits.
8. **Ship Phase A4** — single commit at any point in the sequence (`get_keyword_overlap` retirement is independent of all others).
9. **Final: write `HANDOFF-POST-TIER-5.md` + FINAL-SYNTHESIS Tier 5 SHIPPED appendix.**

Total estimated: 45-55 commits across the branch.

---

## 8. Hard rules (carry forward from CLAUDE.md, repeated for resume safety)

1. **One fix per commit.** Cohort commits permitted only for mechanical Step-1.5 propagation across clients.
2. **Don't modify existing finding text.** Append under `## Additional Information`.
3. **Stage explicitly by path** — never `git add .`.
4. **Don't push without explicit user direction** (TANDEM §3).
5. **Commit footer:** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
6. **`matt-wallmow` is the reference client** for all functional verification.
7. **`gh auth setup-git`** before any `git push`.
8. **Trust your own re-verification, not prior audit framings.** The 2026-04-29 audit was wrong on most phases. Always trace consumption empirically; don't trust import-only checks.

---

## 9. Persistent artifacts (survive the session)

| Artifact | Location | Status |
|---|---|---|
| Tier 5 plan | `/root/site-audit-fix-work/Claude Code Findings/TIER-5-PLAN.md` | ✓ committed (3 doc commits on branch) |
| This handoff | `/root/site-audit-fix-work/Claude Code Findings/HANDOFF-TIER-5-WIP.md` | ✓ committing now |
| Retired-code repo | `/root/site-audit-retired/` | ✓ initialized at `3cd3697 init` (separate sibling repo) |
| bd issue `5hy` (SOP) | bd database | ✓ open, P2 |
| bd issue `c6r` (.bak cleanup) | bd database | ✓ open, P3 |
| bd issue `8d2` (.collab cleanup) | bd database | ✓ open, P3 |
| 11 bd memory entries | bd database (run `bd recall <key>`) | ✓ recallable |

**Critical bd memory keys to recall on resume:**
- `tier-5-overriding-principle-reliability-durability-consisten`
- `tier-5-spam-classifier-omitted-entirely-strengthened-from`
- `tier-5-dual-path-retirement-move-to-removed`
- `tier-5-retired-code-archive-lives-at-root`
- `tier-5-client-env-segregation-top-priority-global`
- `tier-5-python-env-loading-clientcontext-class-option`
- `tier-5-js-env-loading-custom-lib-load`
- `tier-5-pre-commit-safety-pre-commit-framework`
- `tier-5-new-client-onboarding-build-new-client`
- `ppc-workflow-fix-15-is-out-of-tier`
- `project-sop-needed-for-ai-assisted-feature-data`

---

## 10. Resume prompt (paste this to start a fresh session)

```
Resuming Tier 5 from a WIP handoff.

Repo: /root/site-audit-fix-work/
Branch: site-audit-fixes-tier-5

Required reading in order:
1. Claude Code Findings/HANDOFF-TIER-5-WIP.md (this is the resume doc)
2. Claude Code Findings/TIER-5-PLAN.md (the actual plan + audit re-verification §2.5)
3. CLAUDE.md (fix-work hard rules + TANDEM override)
4. bd ready (live punch list)

State at handoff time:
- 3 plan/doc commits on branch, no code changes yet
- 4 user decisions OPEN (see HANDOFF-TIER-5-WIP §5): .collab .md keep/drop;
  rank_tracker orphan build/delete; dual-classifier strict-omit confirmation;
  backlinks-page strip-to-raw confirmation
- Phases D, F ready to ship the moment decisions land
- Phases E ready to plan execution (no audit-trust issues)
- Phases B, C need scope revision (audit was empirically wrong; see §2.5)

Next action: ask the user for the 4 open decisions, then ship Phase D first
(verified clean, ~3 commits).
```

---

**Sleep well. All context preserved.**
