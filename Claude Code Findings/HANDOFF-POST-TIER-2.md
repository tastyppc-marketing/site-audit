# Handoff — Post-Tier-2, Resuming at Tier 3

**Written:** 2026-04-21
**Branch:** `site-audit-fixes` (origin + local match at `09a9417`)
**Repo root:** `/root/site-audit-fix-work/` — the dedicated fix-work clone. Production clone at `/root/site-audit/` — don't touch it.

**This handoff is designed to be self-sufficient.** A fresh session can read this single doc and be ready to plan Tier 3 without chaining through prior handoffs. Prior handoffs (`HANDOFF.md`, `HANDOFF-POST-TIER-1.md`) are retained in the repo for deeper dives but are not required reading.

---

## 0. Required reading for Tier 3 planning

Beyond this handoff, the Tier 3 session should read (in this order):

| Doc | Why |
|---|---|
| `CLAUDE.md` (repo root) | Fix-work-clone-specific rules: per-fix recipe, hard rules (one fix per commit, no `git add .`, etc.), current git state summary. |
| `Claude Code Findings/FINAL-SYNTHESIS.md` §5 | **The 5-tier priority fix queue.** Tier 3's core scope lives here: 4 "restore promised features" fixes. This is authoritative. |
| `Claude Code Findings/INDEX.md` | 67-file status tracker + cross-cutting bugs. Orienting reference — use it to find which finding doc corresponds to a file you're touching. |
| `Claude Code Findings/MAJOR-FINDINGS.md` | Curated cross-finding bug index. Pattern recognition — spots dependencies between findings. |
| `Claude Code Findings/<layer>/<N>-<name>.md` | Per-file deep-dive. Read on demand when touching that specific file — NOT all of them upfront. Layer = architectural role (see §2 below). |
| `docs/SEO-AUDIT-SYSTEM.md` | Full pipeline reference. Read when a fix's blast radius is unclear. |
| `docs/PRODUCTION-CLAUDE.md` | Inherited production rules (15 numbered data-integrity + report/template invariants). Read when verifying a fix didn't break a known invariant. |

Findings are **append-only**: never modify existing finding text. Add new observations under `## Additional Information` at the bottom of the relevant finding file. Don't re-audit from scratch.

---

## 1. Complete changelog: Tier 1 → Tier 1.5 → Tier 2

### Tier 1 (3 fixes — landed in the first fix-work session)

| Commit | Category | Summary |
|---|---|---|
| `76e8535` | Tier 1 | `platform/scripts/build_audit.py:216` — extract `edges` from the link-graph envelope. Null-safe form. |
| `eb2f693` | Tier 1 | `template/scripts/gather-backlinks.js:38` — add `Semaphore` to the destructured import. |
| `ff952ad` | Tier 1 | `commands/seo-audit.md` lines 379–397 deleted — Agent 2 no longer overwrites `crawl-data.json` or `link-graph.json`. |
| `93835d7` | scaffolding | Scoped `CLAUDE.md` for fix work; preserved production rules at `docs/PRODUCTION-CLAUDE.md`. |
| `88a67e6` | **Tier 1.5** | `template/scripts/crawl-sitemap.js` — ported liane-jamason's `fetchXmlRaw` so Yoast-stylesheet XML sitemaps parse. Finding #5 bug #2, promoted during Tier 1 verification. |
| `2c41634` | docs | Verification appendices on findings #63, #67, #5 (append-only under `## Additional Information`). |
| `e58dd6d` | **architectural** | `/seo-audit` Step 1.5 — auto-syncs client scripts from template on every invocation. Fixes the root cause of client-fork drift. |
| `218086d` | chore | matt-wallmow scripts synced to template (empirical Step 1.5 dry run). |
| `0f14516` | harden | Step 1.5 hardened: recursive `find`, PID-extended timestamps, `TEMPLATE_DIR` sanity check, orphan detection, "⚠ DO NOT REMOVE" banner + Contract section. |
| `5c21ce9` | docs | `HANDOFF-POST-TIER-1.md` — the prior handoff (now historical). |

Empirical evidence (Tier 1 on matt-wallmow):

| Signal | Before | After |
|---|---|---|
| `internalLinking.total_pages` | 0 | 52 |
| `internalLinking.total_internal_links` | 0 | 93 |
| `internalLinking.orphans` count | 11 | 5 |
| `gather-backlinks.js` execution | `ReferenceError: Semaphore is not defined` | auth error (= passed import line) |
| crawl-sitemap standalone on Yoast-styled sitemap | "No sitemap found" (0 pages) | 84 pages, 5 child sitemaps, 69-source link-graph |

Step 1.5 hardened form passed 6 stress tests: baseline no-op, missing-file restore, drift replacement, orphan preservation + warning, bad-`TEMPLATE_DIR` fatal exit, real-drift sync on liane-jamason scratch.

### Tier 2 (2 fixes as spec'd, expanded to 3 during verification)

| Commit | Fix | Summary |
|---|---|---|
| `7b0f9ed` | 5A | New `template/scripts/lib/atomic-write.js` + `populate-audit-data.js:461` → atomic `.tmp` + fsync + rename with `.bak` backup. `.gitignore` covers the `.bak` files. |
| `3109fdd` | 5B | `gather-keyword-volumes.js:297` adopts the same helper (`trailingNewline: true` — byte-preserves prior output). |
| `87a8b08` | **4C1** (promoted) | `gather-local-pack.js:137` — each DFS `local_pack` is a top-level item, not an aggregator with nested `.items[]`. `items.find(...)` → `items.filter(...)`. Matt's packs now return real data (Pine Point Realty / First Weber / Cecily Dawson) where before all 25/25 keywords silently returned empty. |
| `4faa951` | 4C2 | `gather-local-pack.js` — new `resolveLocationCode()` helper. Priority: `--location` CLI → `client-config.json.locationCode` → fallback `2840` with prominent warn. `commands/seo-audit.md:805` drops `--location 2840`. Matt's config gains `"locationCode": 1028181` (Rhinelander city code, verified live from DFS `/v3/serp/google/locations/US`). |
| `6cc45a6` | 6D | `connectors/base.py` — `_retry_on_transient` predicate covers 5xx + `TransportError` + `TimeoutException`. `@retry` added to `_request_sync`. New `platform/tests/test_connectors_base.py` (4 cases — all pass in 0.73s). |
| `ef1cd03` | 6E | `connectors/dataforseo.py:_post` routes through `self._request_sync` — every DataForSEO method (14) gains retry coverage transparently. Drops the redundant `_rate_limit_sync` + `raise_for_status` that would have double-fired. |
| `b53c6ec` | cleanup | Revert of scratch `docs/scratch-tier-2-plan.md` (temp file Ultraplan needed — never meant to ship). |
| `09a9417` | docs | This handoff. |

Empirical evidence (Tier 2):

| Signal | Before | After |
|---|---|---|
| `audit-data.json` crash-mid-write | file corrupted / truncated | file untouched, `.bak` preserved, stray `.tmp-*` cleaned |
| matt-wallmow `local-pack-data.json` foundInPack/notInPack | 0 / 25 (false-negative) | non-empty packs returned for geo keywords |
| DFS 5xx on DataForSEO connector | first-attempt failure | 3 attempts with exponential backoff |
| `pytest platform/tests/test_connectors_base.py -v` | (test did not exist) | 4/4 passing in 0.73s |

**Notable scope event:** Fix 4's live-DFS go/no-go gate (per Tier 1's verification discipline — see §3 below) revealed that country-level `2840` and Rhinelander-city `1028181` both returned 3 `local_pack` items. The location code was NOT the causal factor. Real cause was the `gather-local-pack.js:137` filter expecting a nested `.items[]` that DFS doesn't emit. Per discipline, filter fix was promoted into Tier 2 (Commit C1) rather than shipping the inert location-param change alone. The location-param change still shipped (C2) for cohort-client configurability, but now it does observable work on top of a correct parser. Same promotion pattern as Finding #5 bug #2 → Tier 1.5.

---

## 2. Architectural state — what's guaranteed now

### 2a. Step 1.5 contract (the auto-sync guarantee)

`commands/seo-audit.md` Step 1.5 runs on **every** `/seo-audit` invocation (new and existing clients) and is the architectural guarantee that future audits always pick up the latest template scripts:

- Walks `template/scripts/` **recursively** — any file type, any subdir depth.
- For each template file:
  - Missing in client → `[NEW]` copy.
  - Present but differs → back up client copy to `scripts/_backup/<timestamp>-<pid>/`, then overwrite.
  - Identical → skip.
- Detects orphans (files in client/scripts not in template/scripts) and **WARNS** — never auto-deletes.
- Fails fatally (exit 1) if `TEMPLATE_DIR/scripts` doesn't resolve to a real dir.
- Sentinel banner in the skill: `⚠ DO NOT REMOVE OR SKIP THIS STEP`.

**Rules of engagement:**

- Never add client-specific customizations directly to `clients/*/scripts/*.js`. They'll be overwritten on the next audit. Promote the change to the template, or put custom tooling in a sibling dir like `scripts-custom/` (outside `scripts/`).
- Never remove Step 1.5 from the skill. Honor the sentinel. (A pre-commit hook enforcing this is deferred — see §5d.)
- Intentional client-script divergence is a design smell. If you spot one, ask first.

### 2b. Template layout Tier 3 inherits

- `template/scripts/*.js` — the source of truth for per-client scripts. Step 1.5 propagates these on each audit.
- `template/scripts/lib/fetch-with-retry.js` — shared HTTP retry + Semaphore utility. Used by every gather-*.js.
- `template/scripts/lib/atomic-write.js` (new in Tier 2) — shared atomic JSON writer. Used by populate-audit-data.js and gather-keyword-volumes.js. On each client's next audit, Step 1.5 will report `[NEW] lib/atomic-write.js`. Expected and desirable.
- `platform/src/audit_platform/connectors/base.py` — `BaseConnector` with `@retry` on both `_request` (async) and `_request_sync`. Predicate `_retry_on_transient` covers 5xx + transport + timeout.
- `platform/src/audit_platform/connectors/dataforseo.py` — `_post` routes through `_request_sync` and inherits retry coverage. Other 9 sync connectors still bypass it (Tier 3 sweep — see §5a).

### 2c. The 12 layer directories (map of the codebase)

Findings are organized by architectural role, not tier. Tiers cut across layers.

| Dir | Role |
|---|---|
| `01-shared-util/` | HTTP retry + semaphore utility |
| `02-diagnostic/` | Playwright reconnaissance (crawl-sitemap lives here) |
| `03-api-gathering/` | JS scripts → `seo/research/*.json`. Most drift lives here. |
| `04-analysis-population/` | Enrichment + Markdown→JSON bridge (populate-audit-data) |
| `05-deliverables/` | XLSX + PPTX builders |
| `06-generator/` | `generate-multipage-report.js` — the normalizer |
| `07-page-renderers/` | Client-side JS for each HTML report page |
| `08-shared-renderer/` | Shared renderer infrastructure |
| `09-python-connectors/` | Python wrappers around external APIs |
| `10-python-analyzers/` | Python analyzers (brain of `build_audit.py`) |
| `11-python-orchestrators/` | Pipeline runners (`build_audit.py`) |
| `12-workflow/` | `commands/seo-audit.md` master skill orchestrator |

---

## 3. Verification discipline (carry forward into Tier 3)

This discipline is what made Tier 1/1.5/2 work. Tier 3 must continue it.

- **Verify each fix at its narrowest code boundary** — not through the full pipeline. A `/seo-audit` end-to-end run exercises every tier simultaneously and makes it impossible to tell which tier's bug fired if something breaks. Save integration testing for after all tiers close.
- **Use `matt-wallmow` as the reference client** for empirical checks. His data shape is known, his scripts are in sync with template, his `client-config.json` now has `locationCode: 1028181` (Tier 2). The "before" baseline per finding is documented in the findings.
- **Capture "before" baselines** to `/tmp/matt-*.pre-fixN.{json,txt}` before running anything that mutates state.
- **Go/no-go gates.** When a fix's hypothesis is causally uncertain (e.g. "is X causing Y, or is it Z?"), empirically verify the causal link BEFORE writing code. If the gate fails, PAUSE — do not ship an inert fix. Surface to the user.
- **Tier-boundary spill handling.** If a Tier X bug depends on a not-yet-fixed Tier Y concern, do NOT paper over it. Propose promoting Y into X (precedents: Finding #5 bug #2 → Tier 1.5; `gather-local-pack.js:137` filter → Tier 2 C1). Or pause for user decision.

Reference client state now:
- `clients/matt-wallmow/` — scripts in sync with template (Step 1.5 auto-heals any drift on next audit). `client-config.json` has `locationCode: 1028181`.
- Other clients (laura-willis, liane-jamason, cohort) — no `locationCode` in their configs → fall back to `2840` with warn on next audit. Backfill is Tier 4 cohort pass.

---

## 4. Hard constraints (unchanged from Tier 1/2)

1. **One fix per commit.** No batched commits. Tier 4 bulk ops may be one commit per client cohort.
2. **Stage explicitly by path.** Never `git add .` (working tree has `.collab/`, `.playwright-mcp/`, `.codex/` noise historically).
3. **Don't modify existing finding text.** Append under `## Additional Information` only.
4. **Don't re-audit from scratch.** Re-reading scripts for full context is expected and encouraged; producing new finding docs is not.
5. **Don't skip matt-wallmow verification** on functional fixes.
6. **Don't fix out of tier order** unless promoting a dependency via the discipline in §3.
7. **Before pushing:** `gh auth setup-git && git push` (HTTPS remote needs gh credential helper — from global `~/.claude/CLAUDE.md`).
8. **Commit footer:** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

---

## 5. Deferred — the Tier 3 / Tier 4 / post-tier punch-list

This is the complete carried-forward inventory across all shipped tiers.

### 5a. Reliability sweep — connectors bypassing `_request_sync`

**Context:** Fix 6 (Tier 2) added retry coverage to `base._request_sync` and routed DataForSEO's `_post` through it. The other 9 sync connectors still call `self.sync_client.request()` / `.post()` directly and handle `raise_for_status()` inline — **no retry coverage** for transient failures. Route each through `_request_sync` the same way `dataforseo._post` now does.

| File | Line | Current pattern |
|---|---|---|
| `connectors/pagespeed.py` | 187 | `response.raise_for_status()` after direct client call |
| `connectors/crux.py` | 99 | same |
| `connectors/business_profile.py` | 126, 132 | two direct call sites |
| `connectors/brand_mentions.py` | 85 | direct |
| `connectors/social_audit.py` | 121 | direct |
| `connectors/search_console.py` | — | direct (exact line TBD — grep it) |
| `connectors/ga4.py` | — | direct (exact line TBD) |
| `connectors/google_ads.py` | — | direct (via the Google Ads SDK, not httpx — may be out of scope) |
| `connectors/local_seo.py` | — | direct (exact line TBD) |

**Also:** `pagespeed.py:186` has no rate-limit at all — no `_rate_limit_sync` or equivalent. Fix alongside the retry refactor.

### 5b. Missing test / runtime dependencies in `platform/pyproject.toml`

**Investigated and documented during Tier 2 pytest runs.** Confirmed NOT caused by Tier 2 work (verified by `git stash && pytest` — same 11 failures without Tier 2 commits present).

11 pre-existing test failures, two missing packages:

| Failing test | Missing package | Analyzer | Symptom |
|---|---|---|---|
| `test_internal_linking.py::test_extended_metrics_returns_dict` | `networkx` | `InternalLinkAnalyzer.compute_extended_metrics` | `KeyError: 'density'`, logs `networkx_not_available` |
| `test_internal_linking.py::test_betweenness_bridge_detection` | `networkx` | same | assertion failure on missing field |
| `test_internal_linking.py::test_community_detection` | `networkx` | same | same |
| `test_internal_linking.py::test_graph_density` | `networkx` | same | `KeyError: 'density'` |
| `test_local_seo.py::test_sentiment_positive_reviews` | `vaderSentiment` | `LocalSEOAnalyzer` sentiment | `assert 0 > 0`, logs `vader_not_available` |
| `test_local_seo.py::test_sentiment_negative_reviews` | `vaderSentiment` | same | `assert 0 > 0` |
| `test_local_seo.py::test_sentiment_mean_compound` | `vaderSentiment` | same | `assert 0 > 0` |
| `test_local_seo.py::test_sentiment_reply_rate` | `vaderSentiment` | same | `assert 0 == 33.3` |
| `test_local_seo.py::test_sentiment_total_reviews` | `vaderSentiment` | same | `assert 0 == 6` |
| `test_local_seo.py::test_sentiment_keyword_extraction` | `vaderSentiment` | same | `assert 0 > 0` |
| `test_local_seo.py::test_sentiment_short_reviews_use_rating` | `vaderSentiment` | same | `assert 0 > 0` |

**Root cause:** `platform/pyproject.toml` declares neither `networkx` nor `vaderSentiment` — not as main deps, not as optional extras. Analyzers use try/except-import and silently degrade to empty/zero when missing.

**Recommended fix direction (pick one or both):**
1. **Add to main `dependencies`** in `pyproject.toml` — guarantees prod environments get full analyzer functionality. Bumps dep footprint by two libs (~500 KB + vader's NLTK-adjacent data).
2. **Mark tests conditional** via `pytest.importorskip("networkx")` / `importorskip("vaderSentiment")` — just hides failures. Leaves prod with silently-degraded analyzers. **Not recommended alone.**

**Production data-integrity implication:** if `build_audit.py` runs in a venv missing these libs, `InternalLinkAnalyzer` returns empty extended metrics (no density, no betweenness, no communities) and `LocalSEOAnalyzer` returns zero sentiment — with zero error log. Reports / XLSX / PPTX consumers of those fields see blank cells. **Worth confirming which venv production uses** before Tier 3 starts — determines whether this is dev-hygiene (prod already has them) or a silent prod regression (prod doesn't).

### 5c. From FINAL-SYNTHESIS.md §5 Tier 3 — 4 feature-restoration fixes

These are the findings originally scoped to Tier 3. Re-read `FINAL-SYNTHESIS.md` §5 for exact file paths and per-fix summaries — this handoff deliberately doesn't duplicate that authoritative list. The four are cited there as restoring features the pipeline promised but silently skipped.

### 5d. Other deferred items (from Tier 1 / Tier 1.5 / Tier 2 residue)

- **`build_audit.py:871` non-atomic Python write.** Twin of Fix 5 on the Python side. Tier 3 candidate.
- **Cohort `locationCode` backfill** (laura-willis, liane-jamason, chris-nevada, others). Tier 4 cohort pass.
- **Cohort re-template for pre-Tier-1 script divergence** (the 4 clients missing `gather-keyword-volumes.js` entirely; the 3 with the 327-line legacy `gather-backlinks.js`). Tier 4.
- **City → DFS code lookup table** — would benefit `gather-local-seo.js` too. Post-tier nice-to-have.
- **Pre-commit hook protecting Step 1.5** — greps `commands/seo-audit.md` for the `⚠ DO NOT REMOVE OR SKIP THIS STEP` sentinel and blocks commits that remove it. Post-tier.
- **Full `/seo-audit` end-to-end integration test** on matt-wallmow. Run once after Tier 3 lands to catch cross-tier regressions.
- **Cleanup of `scripts/_backup/*` + `audit-data.json.bak`** across clients. Disk hygiene only.
- **Review liane-jamason's post-sync state** after her next audit (the 208-line `gather-backlinks.js` fork was backed up during Tier 1 verification — may have intentional logic worth preserving).
- **Dead `competitorRank` field** in `audit-data.keywords[]` — populate or drop. Schema hygiene, unrelated to reliability.

---

## 6. Tier 3 starting prompt (for /ultraplan or fresh session)

```
# Ultra Plan request — Tier 3 fixes for site-audit pipeline

## Repo + branch
- Working clone: /root/site-audit-fix-work/ (production clone at /root/site-audit/ — don't touch)
- Branch: site-audit-fixes, origin synced at 09a9417
- Tier 1 / 1.5 / 2 complete.

## Required reading
1. Claude Code Findings/HANDOFF-POST-TIER-2.md (this handoff, self-sufficient)
2. Claude Code Findings/FINAL-SYNTHESIS.md §5 (the 5-tier fix queue — authoritative Tier 3 scope)
3. Claude Code Findings/INDEX.md (67-file status tracker, for orientation)
4. Claude Code Findings/MAJOR-FINDINGS.md (cross-finding bug index, for pattern recognition)
5. Claude Code Findings/<layer>/<N>-<name>.md on demand when touching a file
6. CLAUDE.md (fix-work rules)

## Tier 3 scope proposal
Combine FINAL-SYNTHESIS.md §5 Tier 3 (4 feature-restoration fixes) with the
reliability-sweep work surfaced during Tier 2 (§5a, §5b of this handoff).

Propose a commit plan per the discipline in §3 of this handoff:
  - one fix per commit,
  - each verified at its narrowest boundary on matt-wallmow,
  - go/no-go gates where causality is uncertain,
  - promote tier-boundary spills rather than papering over them.

## Hard constraints (§4 of this handoff, unchanged across tiers)
1. One fix per commit; commit footer: Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>.
2. Don't modify existing finding text — append only under "## Additional Information".
3. Stage explicitly by path; never `git add .`.
4. Never skip matt-wallmow verification on functional fixes.
5. Before pushing: `gh auth setup-git` then `git push`.
```

Launch `/ultraplan` from inside `/root/site-audit-fix-work` (not `/root`, or it can't find a git repo).

---

## 7. Fast-start checklist

1. `cd /root/site-audit-fix-work`
2. `git status` — expect clean tree.
3. `git log --oneline -12` — last commit should be the docs commit that added this handoff; look for `09a9417 docs: add post-Tier-2 handoff for resuming at Tier 3` (or a later docs commit if this one got iterated).
4. `git branch --show-current` — expect `site-audit-fixes`.
5. `PYTHONPATH=platform/src pytest platform/tests/test_connectors_base.py -v` — expect 4 pass (Tier 2 retry regression tests).
6. Skim §1–§4 of this handoff. Read §5 in full to calibrate Tier 3 surface area.
7. Open `FINAL-SYNTHESIS.md` §5 for the authoritative Tier 3 fix list.
8. Launch `/ultraplan` with the prompt in §6. Remember to run it from the repo root.
9. Implement per the discipline in §3.

---

**Total state:** Tier 1 / 1.5 / 2 shipped. Auto-sync architectural guarantee in force. Reference client has working local-pack + config'd `locationCode`. DataForSEO retries 5xx. 9 commits ahead of Tier-2 baseline `0f14516`. Origin pushed. Ready for Tier 3.
