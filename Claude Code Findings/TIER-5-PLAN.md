# Tier 5 — Plan (architectural cleanup: dual-path retirement + client env-segregation)

**Branch:** `site-audit-fixes-tier-5` (forked from `site-audit-fixes-tier-4-followups` at `b7d1f10`).
**Date:** 2026-05-03.
**Method:** subagent-driven execution per phase, with per-commit verification gates.
**Overriding principle:** **reliability, durability, consistency** (not simplicity). Choose paths with smallest failure surface, fewest false positives, most boring/well-tested patterns. Avoid cleverness.

This plan supersedes the placeholder Tier 5 scope in `FINAL-SYNTHESIS.md §5e` with concrete decisions captured during the 2026-04-29 / 2026-05-03 scoping sessions. PPC workflow (formerly Fix 15) is **out of scope** — user is building separately.

---

## 1. Locked decisions (per user direction)

| # | Decision | Source |
|---|---|---|
| D1 | **Spam classifier OMITTED entirely** — no warning UI either. Renderer's classification fallback heuristics also out. | bd `tier-5-spam-classifier-omitted-entirely-strengthened-from` |
| D2 | **Dual-path retirement = MOVE to `/root/site-audit-retired/` repo**, not delete + not just `@deprecated` tags. Path-mirror inside; per-file header comment with tier + replacement + reason. | bd `tier-5-dual-path-retirement-move-to-removed` + `tier-5-retired-code-archive-lives-at-root` |
| D3 | **JS wins for all 6 DFS endpoint conflicts.** 3 clean retirements + 1 dead-method cleanup + 2 needing analyzer-refactor (`competitor.py`, `content_gap.py`, `rank_tracker.py`, `local_seo.py` pack-check). | Audit 2 results 2026-04-29 |
| D4 | **vaderSentiment dead code removed; `vaderSentiment` reverted from `pyproject.toml`.** Documented as worked example in SOP issue. | bd issue `5hy` |
| D5 | **Python env-loading = `ClientContext` class (~40 LOC).** Wraps pydantic `Settings` for validation; uses `dotenv_values` to parse without `os.environ` pollution. Carries slug + lazy `.env` load + `audit_data_path()` helpers. | bd `tier-5-python-env-loading-clientcontext-class-option` |
| D6 | **JS env-loading = `lib/load-client-env.js` helper.** Reads `clients/<slug>/.env`, returns object. Replaces `process.env.X` with `env.X` across ~10 gather scripts. | bd `tier-5-js-env-loading-custom-lib-load` |
| D7 | **Pre-commit safety = `pre-commit` framework + `.gitignore` pattern `clients/*/.env`.** | bd `tier-5-pre-commit-safety-pre-commit-framework` |
| D8 | **New-client onboarding = `/new-client` skill** that prompts for keys and writes `clients/<slug>/.env` from global template. | bd `tier-5-new-client-onboarding-build-new-client` |
| D9 | **PPC workflow OUT of Tier 5.** User building separately. | bd `ppc-workflow-fix-15-is-out-of-tier` |
| D10 | **bd hygiene (c6r + 8d2) = post-op.** Hygiene, not architectural — runs after substantive work. | This session 2026-04-29 |

---

## 2. Phase order (dependency-driven)

1. **Phase A — Dual-path retirements (no refactor needed).** 3 backlinks endpoints + 1 dead method + 3 dead methods = 4 commits. Lowest blast radius; clears the retired-repo conventions before bigger work.
2. **Phase B — Python analyzer refactors.** 4-5 analyzers (`competitor`, `content_gap`, `rank_tracker`, `local_seo` pack-check) refactored to read JS-emitted JSON instead of calling DFS directly. Largest single chunk — ~8-12 commits.
3. **Phase C — Spam classifier removal.** Move classifier to retired; delete renderer fallback; remove Step 5.5 in `seo-audit.md`; reduce backlinks page to raw list. 4 commits + 8-client propagation.
4. **Phase D — Sentiment removal + vaderSentiment revert.** Delete `analyze_review_sentiment` + `reviewSentiment` writes; revert `vaderSentiment` from `pyproject.toml`. 2 commits.
5. **Phase E — Client env-segregation (foundational architectural work).** This is the big one. ~10-15 commits across Python + JS + onboarding skill + pre-commit framework + per-client `.env` provisioning.
6. **Phase F — bd hygiene.** Close c6r (`.bak` removal) + 8d2 (`.collab/` removal). 2 commits.

**Phase A→D order rationale:** B depends on A (refactors only happen after the retired Python output is fenced off). C depends on nothing but is small and self-contained. D is independent. E touches winning paths from A-B-C-D — runs after the dust settles. F is hygiene last.

**Estimated total:** 30-45 commits across the 6 phases.

---

## 2.5 — Audit invalidation finding (2026-05-03 Phase A pre-flight)

**Empirical re-verification of the 2026-04-29 dual-path audit's "Python is dead" claims invalidated most of Phase A as originally scoped.**

`build_audit.py:69` registers `_run_backlinks` as an active `AuditStep` that runs whenever `DATAFORSEO_LOGIN` is set. `_run_backlinks` calls `BacklinkAnalyzer.analyze()` (analyzers/backlinks.py:769 LOC) and writes the result into `audit_data["backlinks"]`. The renderer (`generate-multipage-report.js:1614-1772`) then reads from `audit_data["backlinks"]` for **6+ fields**:

| Field | Source | Renderer line |
|---|---|---|
| `domainMetrics` | Python → `audit_data["backlinks"]` | 1716, 1736 |
| `competitorDomainMetrics` | Python | 1614 |
| `qualitySummary` | Python (spam classifier output — D1 will remove anyway) | various |
| `referringDomains` | Python | also read by `build_audit.py:387` |
| `anchorDistribution`, `anchorIssues`, `brokenBacklinkOpportunities` | Python | various |
| `topBacklinks` | Python writes; renderer overwrites from `client-backlinks.json` | 1582 (JS wins) |
| `topReferringDomains` | Renderer populates from `client-backlinks.json` if absent | 1596 |

**Conclusion:** the original audit conflated "renderer doesn't consume Python output" (false — it consumes 6+ fields) with "Python is dead." Most of Phase A as originally scoped would break the report.

Re-verification of the 3 "dead Python methods" (A4) showed:
- `get_keyword_overlap` — truly dead (zero callers anywhere). ✓ Safe to retire.
- `get_keyword_suggestions` — called by `platform/scripts/test_dataforseo.py` (manual CLI tester). NOT dead in the strictest sense.
- `get_serp_batch` — same as above.

### Revised Phase A scope (2026-05-03)

Phase A reduced to **1 commit**: retire `get_keyword_overlap` only. The other claimed "dead methods" need a separate decision — keep them as manual-tester surface, or retire the manual tester too. Defer to Phase B.

The 3 backlinks-endpoint retirements (originally A1-A3) become **Phase B work** — they require migrating the renderer's 6+ Python-sourced fields to JS-side gather + analyzer JSON outputs first. That's a substantial scope expansion for Phase B (was 8-12 commits, now likely 15-20).

### Trust impact on the rest of the plan

Phases C and D rest on audit claims that have not been re-verified:
- Phase C: "renderer fallback at `generate-multipage-report.js:2275-2380` is classifier-only" — needs re-verification before deletion.
- Phase D: "renderer never reads `reviewSentiment`" — needs re-verification before deletion.

Phases E and F are independent of the dual-path audit and can proceed.

**Recommended pivot:** start with **Phase E (env-segregation)** since it's foundational, audit-independent, and matches user's stated TOP PRIORITY. Re-audit C/D claims in parallel before executing those phases.

---

## 3. Phase A — Dual-path retirements (no refactor) — REVISED

**Method:** for each retired artifact: copy to `/root/site-audit-retired/<mirrored-path>/<file>` with a header comment, `git rm` from main repo, commit with one fix per commit.

**Header template (per retired file):**
```
# RETIRED: Tier 5, 2026-05-XX
# Replaced by: <main repo path or "no replacement; was dead code">
# Reason: <one sentence>
# Original location: <main repo path>
```

| Commit | Action | Files |
|---|---|---|
| A1 | ~~Retire Python backlinks analyzer~~ | **DEFERRED to Phase B** — Python output actively consumed by renderer (see §2.5) |
| A2 | ~~Retire 3 backlinks methods from `dataforseo.py`~~ | **DEFERRED to Phase B** — same reason |
| A3 | ~~Retire dead `get_keyword_volumes` Python method~~ | **NEEDS RE-VERIFICATION** — audit track record poor; defer until reverified |
| A4 | Retire `get_keyword_overlap` only | `dataforseo.py` — verified zero callers 2026-05-03 |

**Verification per commit:**
- `pytest platform/tests/ --tb=no -q` — expect 414 passed (no regressions; removed tests count is reduced 1:1).
- `grep -rn "<retired_method_name>" platform/src` — expect zero hits in main repo.
- `ls /root/site-audit-retired/<mirrored-path>/` — expect file present with header.

---

## 4. Phase B — Python analyzer refactors

**Goal:** 4-5 Python analyzers stop calling DFS directly; instead read from JS-emitted JSON files in `clients/<slug>/seo/research/`.

**Affected analyzers + endpoints:**
- `analyzers/competitor.py` — reads `ranked_keywords/live` + `serp/google/organic/live/advanced`
- `analyzers/content_gap.py` — reads `ranked_keywords/live`
- `analyzers/rank_tracker.py` — reads `serp/google/organic/live/advanced`
- `analyzers/local_seo.py` (pack-check section only) — reads `serp/google/organic/live/advanced`

**JS-side outputs (already produced today by gather scripts):**
- `clients/<slug>/seo/research/keyword-rankings.json` (or similar)
- `clients/<slug>/seo/research/serp-results.json` (or similar)

**Verification surface:** existing analyzer tests should still pass after refactor. May need new test fixtures (saved JSON snippets) to replace mocked DFS responses. Reference client = `matt-wallmow`.

**Decision points to surface during phase planning:**
- B-Q1: Do we keep the DFS connector methods callable for ad-hoc/manual use, or remove them entirely once no analyzer calls them?
- B-Q2: Do we add a "freshness check" to the analyzer (warn if JSON file is older than N hours) since DFS data changes fast?

These will be resolved in a Phase B sub-plan once we get there. Estimated 8-12 commits.

---

## 5. Phase C — Spam classifier removal

| Commit | Action |
|---|---|
| C1 | Retire `template/scripts/analyze-backlink-quality.js` to retired repo |
| C2 | Delete renderer's classification fallback at `generate-multipage-report.js:2275-2380` (template + auto-propagate to 8 clients via Step 1.5 mechanism — re-verify with `diff -rq`) |
| C3 | Remove Step 5.5 invocation in `commands/seo-audit.md` |
| C4 | Reduce backlinks page (`pages/links.js` or similar) to render raw `referring_domains[]` with `domain_rating`, `is_dofollow` columns — let user judge |
| C5 | Propagate template changes to 8 clients (1 cohort commit, mirrors Tier 4 pattern) |

**Verification:** matt-wallmow regenerated report shows raw backlinks list, no spam classification UI, no errors in console.

---

## 6. Phase D — Sentiment removal + vaderSentiment revert

| Commit | Action |
|---|---|
| D1 | Delete `LocalSeoAnalyzer.analyze_review_sentiment()` + `audit_data["localSeo"]["reviewSentiment"]` writes; remove try/except-import guard for vaderSentiment |
| D2 | Revert `vaderSentiment>=3.3.2` from `platform/pyproject.toml` `dependencies`; uninstall locally |

**Verification:**
- `pytest platform/tests/ --tb=no -q` — expect 414 passed minus removed sentiment tests.
- `grep -rn "reviewSentiment\|vaderSentiment" platform/src template` — expect zero hits.
- bd issue `5hy` (SOP) referenced in commit body of D1 as the worked example.

---

## 7. Phase E — Client env-segregation (foundational architectural work)

**The big phase.** Touches every connector + gather script. Order matters within this phase.

### E.1 — Foundations (preparatory)
| Commit | Action |
|---|---|
| E1 | Add `clients/*/.env` to `.gitignore` |
| E2 | Set up `pre-commit` framework (`.pre-commit-config.yaml`) with hook to refuse staged `clients/*/.env` files |
| E3 | Build `/new-client` skill (`commands/new-client.md`) that prompts for keys + creates `clients/<slug>/.env` from global `.env.template` (the renamed global `.env`) |
| E4 | Rename global `.env` → `.env.template`; document in repo README that it is the **template only**, never read by connectors |

### E.2 — Python ClientContext + connector refactor
| Commit | Action |
|---|---|
| E5 | Add `python-dotenv` to `pyproject.toml` dependencies (already transitive via `pydantic-settings`; making explicit) |
| E6 | Build `platform/src/audit_platform/config/client_context.py` (~40 LOC `ClientContext` class) + `tests/test_client_context.py` (load → validate → reject missing-file → reject missing-required-key) |
| E7..E12 | Refactor each connector to take `ctx: ClientContext` argument: `pagespeed`, `business_profile`, `crux`, `brand_mentions`, `social_audit`, `dataforseo` (winning paths only) |
| E13 | Refactor analyzers that resolve client paths: replace string concatenation with `ctx.audit_data_path()` etc. |
| E14 | Refactor `build_audit.py` orchestrator to construct `ClientContext` once + thread through |

### E.3 — JS load-client-env helper + gather-script refactor
| Commit | Action |
|---|---|
| E15 | Build `template/scripts/lib/load-client-env.js` (~15 LOC) + minimal node test |
| E16..E25 | Refactor each gather script to use `loadClientEnv(slug)` instead of `process.env.X`: `gather-backlinks`, `gather-keyword-volumes`, `gather-pagespeed`, `gather-organic-metrics`, `gather-domain-metrics`, `gather-local-pack`, others as needed |
| E26 | Update `commands/seo-audit.md` to invoke gather scripts with client-slug arg + remove any global-env loading |
| E27 | Propagate `lib/load-client-env.js` to 8 clients (Step 1.5 cohort commit) |

### E.4 — Provisioning
| Commit | Action |
|---|---|
| E28 | Provision `clients/<slug>/.env` for each of 8 existing clients (manual; user inputs keys; not committed — gitignored) |

**Verification surface (Phase E):**
- After each connector refactor: pytest passes; smoke-run on matt-wallmow confirms data still gathered.
- After E27: `diff -rq template/scripts/ clients/<c>/scripts/` clean for all 8 clients.
- Pre-commit hook test: `git add -f clients/matt-wallmow/.env && git commit` fails with our hook message.
- Cross-wire test: rename matt-wallmow's `.env` keys to obviously-wrong values; run liane-jamason audit; confirm zero corruption (audit succeeds with liane's correct keys, not matt's).

**Estimated:** 25-28 commits in Phase E alone.

---

## 8. Phase F — bd hygiene

| Commit | Action |
|---|---|
| F1 | Close `c6r`: remove committed `*.js.bak` files (4 locations) + add `*.js.bak` to `.gitignore` |
| F2 | Close `8d2`: remove `.collab/` from tracking (incl. 104KB `collab.db`) + add `.collab/` to `.gitignore`. Decision needed at execution time: keep `.md` prompt files in retired repo, drop `.db`. |

---

## 9. Hard rules (carry forward from CLAUDE.md)

1. **One fix per commit.** Cohort commits permitted only for mechanical Step-1.5 propagation across clients (Phase C5, E27).
2. **Don't modify existing finding text.** Append under `## Additional Information`.
3. **Stage explicitly by path** — never `git add .`.
4. **Don't push without explicit user direction** (TANDEM §3).
5. **Commit footer:** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
6. **`matt-wallmow` is the reference client** for all functional verification.
7. **`gh auth setup-git`** before any `git push`.

---

## 10. Branch + push convention

- Branch: `site-audit-fixes-tier-5` (this branch).
- Push at phase boundaries (after Phase A, B, C, D, E, F) on user direction.
- Final FINAL-SYNTHESIS appendix + `HANDOFF-POST-TIER-5.md` written at the end, before close-out push.

---

## 11. Open questions deferred to per-phase planning

- **B-Q1, B-Q2** (Phase B sub-plan)
- Phase E exact ordering of E7..E14 — may run as parallel subagent dispatches given they're independent connectors
- Whether Phase E `.env.template` rename happens at E4 or after E27 (matters for parallel `/seo-audit` runs during the migration window — recommend E4 to fail-fast)

These get resolved at phase-entry, not pre-committed here.
