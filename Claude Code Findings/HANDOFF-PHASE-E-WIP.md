# Handoff — Tier 5 Phase E WIP

**Written:** 2026-05-05
**Branch:** `tier-5-phase-E` (forked from `site-audit-fixes-tier-5` at `a90851d`)
**State:** Python side functionally complete. JS side started — 1 of 6 gather scripts migrated. Smoke tests + cohort propagation pending. Branch pushed to GitHub.

This handoff is self-sufficient. Read it + `Claude Code Findings/TIER-5-EXECUTION-PLAN.md` and you can resume cold.

---

## 1. Branch state

```
tier-5-phase-E  (8 commits ahead of site-audit-fixes-tier-5)
├── 43c52f3 feat(tier-5/E-Python-1): ClientContext class
├── 29e58c3 test(tier-5/E-Python): conftest guard against wrong editable install
├── 1dbb17b feat(tier-5/E-Python-2): BaseConnector accepts ClientContext
├── d34fcc1 feat(tier-5/E-Python-2b): 10 connector subclasses accept ClientContext
├── 7792729 feat(tier-5/E-Python-3): build_audit.py orchestrator threads ClientContext
├── 2973840 fix(tier-5/E-Python-4): route ANTHROPIC_API_KEY through ClientContext
├── bc7fee5 feat(tier-5/E-JS-1): add loadClientEnv helper
└── c3cde12 refactor(tier-5/E-JS-2): gather-domain-metrics uses loadClientEnv
```

`site-audit-fixes-tier-5` itself has 5 prior commits (Phase 0 + D1/D2/D3 + F1 + F3) all pushed. PR is NOT yet opened (do that at end of Phase E per the workflow we agreed on).

**Push status:** `tier-5-phase-E` is pushed to origin. No local-only commits.

---

## 2. What's done

### Python side — complete

The full Python audit pipeline now runs on `ClientContext` when invoked with `--client-slug`:

- `platform/src/audit_platform/config/client_context.py` — new file. `ClientContext.from_slug(slug)` reads `clients/<slug>/.env` via `dotenv_values()` (no `os.environ` mutation) plus `clients/<slug>/client-config.json`. Field access proxies to wrapped `Settings`.
- `platform/src/audit_platform/config/settings.py` — added `ANTHROPIC_API_KEY: Optional[str] = None`.
- `platform/src/audit_platform/connectors/base.py:37` — `BaseConnector.__init__` accepts `ctx` kwarg. When provided, `self.settings = ctx.settings`. When absent, falls back to existing `Settings()` flow.
- `platform/src/audit_platform/connectors/{brand_mentions,business_profile,crux,dataforseo,ga4,google_ads,local_seo,pagespeed,search_console,social_audit}.py` — all 10 subclasses accept `ctx` and forward to super.
- `platform/scripts/build_audit.py` — added `--client-slug` arg. Builds `ClientContext` when slug provided. Threads `ctx` through `AuditOrchestrator` and into `DataForSEOConnector` / `GoogleAdsConnector` instantiations. Defaults `--domain` from `ctx.client_config["clientDomain"]`.
- `platform/src/audit_platform/analyzers/reporting_intelligence.py:572` — last `os.environ.get("ANTHROPIC_API_KEY")` env-bypass closed. Prefers `ctx.ANTHROPIC_API_KEY`, falls back to `os.environ` only when no ctx is provided.
- `platform/tests/conftest.py` — pytest_configure hook fails fast if `audit_platform` is editable-installed from a different repo (this bit us mid-Phase-E; see §6).
- `platform/tests/test_client_context.py` — 6 unit tests; pre-existing test_connectors_base.py adds 4 ctx-wiring tests.

**Verification status:**
- `pytest platform/tests/ --ignore=platform/tests/test_atomic_write.py` → **412 passed, 0 failed.**
- `python3 platform/scripts/build_audit.py --type seo --client-slug matt-wallmow --output /tmp/x.json --skip-api` → runs end-to-end, pulls domain `mattwallmow.com` from client-config, writes audit-data.
- `os.environ` confirmed unmutated under both `--client-slug` and legacy paths.

### JS side — started

- `template/scripts/lib/load-client-env.js` — new file. Exports `loadClientEnv(slug)`, `parseEnvFile(text)`, `resolveClientEnvPath(slug)`, `resolveClientSlug(argv?)`. **Path resolution walks 3 levels up from `__dirname` so it works identically from `template/scripts/lib/` AND `clients/<slug>/scripts/lib/` post-Step-1.5.** No external dotenv dep — written 30-line parser inline.
- `template/scripts/lib/load-client-env.test.js` — 12 jest tests. All pass.
- `template/scripts/gather-domain-metrics.js` — first gather migrated. Reads creds via `loadClientEnv(resolveClientSlug())`, falls back to `process.env`. Strips `--client-slug <slug>` from positional args.

---

## 3. What's left in Phase E

### JS gather scripts — 5 remaining

Pattern is the same as `gather-domain-metrics.js` (commit `c3cde12`). For each:

1. Add `const { loadClientEnv, resolveClientSlug } = require('./lib/load-client-env');` to imports.
2. Replace `const X = process.env.X` with `const X = env.X || process.env.X` where `env = loadClientEnv(resolveClientSlug())`.
3. Adjust positional-arg parsing to strip `--client-slug <slug>` (the value would otherwise be mistaken for a domain).
4. Improve the missing-creds error to mention `clients/<slug>/.env`.

Remaining scripts and their `process.env` lines:

| Script | `process.env.*` lines | Notes |
|---|---|---|
| `template/scripts/gather-keyword-volumes.js` | :180-181 (DATAFORSEO_LOGIN/PASSWORD) | argv parser at :77-91, custom flag-handling |
| `template/scripts/gather-pagespeed.js` | :33 (PAGESPEED_API_KEY \|\| GOOGLE_API_KEY) | **Module-level read** — move inside main() |
| `template/scripts/gather-organic-metrics.js` | :158-159 (DATAFORSEO_LOGIN/PASSWORD) | uses `argFlag(flag, fallback)` helper at :74 |
| `template/scripts/gather-backlinks.js` | :207-208 (DATAFORSEO_LOGIN/PASSWORD) | argv parser at :154 |
| `template/scripts/gather-local-pack.js` | :107-108 (DATAFORSEO_LOGIN/PASSWORD) | uses `argFlag` helper at :48 |

### Orchestrator skill update

- `commands/seo-audit.md` — current flow does `cd clients/<slug>` so scripts inherit cwd-based env. Update to thread `--client-slug <slug>` to every gather invocation. Also update Step 8a populate references at `:1212-1219` if needed (probably no change since those are JSON keys, not env reads).

### Smoke gates

These are commit-able artifacts (assertion script + log), not throwaway runs:

- **E-Smoke-Python** (`platform/scripts/smoke/tier5_python_smoke.py`): given `--client-slug matt-wallmow`, runs one credentialed gather (DFS-backed `connectors.dataforseo.get_domain_metrics`), runs one analyzer, asserts `os.environ` was not mutated, exits 0.
- **E-Smoke-JS**: invoke `node template/scripts/gather-domain-metrics.js --client-slug matt-wallmow example.com` from repo root (no cd), confirm research file written + `printenv DATAFORSEO_LOGIN` in parent shell still empty.
- **E-Smoke-Render**: `node template/reports/multipage/generate-multipage-report.js --data clients/matt-wallmow/seo/audit-data.json --inline` produces report whose 8 pages pass `HANDOFF.md` lines 80-91 verification checklist.

**Blocker for Smoke-Python and Smoke-JS:** matt-wallmow has NO `.env` file. To fully validate the credentialed paths, `clients/matt-wallmow/.env` needs creating with real DataForSEO credentials. Either:
- User creates it manually (it's gitignored now via Phase 0)
- Smoke runs in "no credentials" mode that asserts the missing-creds error fires correctly without mutation

The structural smoke (`os.environ` not mutated, slug resolution works, fallback to process.env works) can be tested without real creds.

### Cohort propagation

After all template-side changes land, run Step 1.5 once across the 8 client dirs at `clients/{calgary-castles,chris-nevada,laura-willis,liane-jamason,mammoth-lakes,matt-wallmow,murray-gardner,p3realtync}/scripts/`. Single commit. Calgary's known fork stays an exception.

Verification: `git diff template/scripts clients/*/scripts -- ':!clients/calgary*'` returns no drift outside Calgary's documented delta.

### Final

- Open PR `tier-5-phase-E` → `site-audit-fixes-tier-5` for review.
- After merge, optionally also bring in 13 platform standalone test/run scripts (`platform/scripts/test_*.py`, `run_*.py`) — these are auxiliary, not part of the orchestrated pipeline. They can wait for a follow-up tier or get a small batch commit.

---

## 4. Resume checklist (paste-ready)

```bash
# Reach the right repo and branch
cd /root/site-audit-fix-work
git checkout tier-5-phase-E
git pull --ff-only

# Confirm we're on the right tree (this caught a real bug mid-Phase-E)
pip install -e platform/ --break-system-packages
python3 -c "import audit_platform; print(audit_platform.__file__)"
# Expected: /root/site-audit-fix-work/platform/src/audit_platform/__init__.py

# Sanity: tests + smoke
python3 -m pytest platform/tests/ --ignore=platform/tests/test_atomic_write.py --tb=no -q
# Expected: 412 passed
npx jest template/scripts/lib/load-client-env.test.js
# Expected: 12 passed

# Read the references in order
cat "Claude Code Findings/HANDOFF-PHASE-E-WIP.md"  # this file
cat "Claude Code Findings/TIER-5-EXECUTION-PLAN.md"
git log --oneline origin/site-audit-fixes-tier-5..HEAD
```

Then proceed with the next gather script — recommend `gather-keyword-volumes.js` first since it's the most similar to the migrated `gather-domain-metrics.js`. Use commit `c3cde12` as the diff template.

---

## 5. Locked decisions (carry forward)

From WIP handoff §5 + this session:

| ID | Decision | Status |
|---|---|---|
| 5a | `.collab/.md` files | **MOVE to `/root/site-audit-retired/.collab/`**, drop `collab.db`. Phase F2 pending. |
| 5b | `rank_tracker.py` orphan | **Build out properly in a future tier.** Do NOT delete during Tier 5. |
| 5c | Phase C dual classifier | **Strict: omit all three (JS + Python + renderer heuristic).** Leave room to build later. |
| 5d | Phase C backlinks page redesign | **DEFERRED — user thinking.** Will likely be a simple "competitor backlinks you don't have, ranked by DR/authority" gap analysis (NOT heuristic spam classifier). Does not block Phase E. |

---

## 6. The mid-Phase-E discovery (don't repeat)

Mid-way through Phase E, discovered that `audit_platform` was editable-installed from `/root/site-audit/platform` (the production repo), so pytest had been silently importing stale code. Phase D's "passing" tests were running against the unmodified production version, not our fix-work edits. Caught only when E-Python-1 added a NEW module that production didn't have.

Fix: `pip install -e platform/ --break-system-packages` from the fix-work repo. The conftest.py guard added in commit `29e58c3` now fails fast if this happens again.

**Lesson:** when a session opens against a fix-work clone, always run that pip install command before trusting any test result. The conftest guard makes this self-checking now.

---

## 7. Hard rules (carried forward — do not override)

1. One fix per commit; cohort commits only for mechanical Step-1.5 propagation.
2. Don't modify finding text — append under `## Additional Information`.
3. Stage explicitly by path — never `git add .`.
4. **Don't push without explicit user direction (TANDEM §3).** During this session the user OK'd pushes on the side branch as natural durability checkpoints; that doesn't generalize.
5. Commit footer: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
6. matt-wallmow is the reference client.
7. `gh auth setup-git` before any `git push`.
8. Trust empirical re-verification, not prior audit framings.

---

## 8. Persistent artifacts

| Artifact | Location | State |
|---|---|---|
| Tier 5 plan v2 | `Claude Code Findings/TIER-5-EXECUTION-PLAN.md` (commit `a4def6b`) | Authoritative |
| Phase 0 + D + F handoff | `Claude Code Findings/HANDOFF-TIER-5-WIP.md` (commit `6d8b038`) | Pre-Phase-E context |
| This handoff | `Claude Code Findings/HANDOFF-PHASE-E-WIP.md` | Resume doc |
| Phase E branch | `tier-5-phase-E` on origin | 8 commits, pushed |
| Bug `dxp` (test_atomic_write) | bd | Pre-existing, P3 |
| Bug `zxo` (retry tests) | bd | RESOLVED (was actually the editable-install issue) |

Bug `zxo` can be closed now — the "pre-existing retry failures" went away when the editable install was fixed. They were never real failures.

---

**Resume prompt for fresh session:**

```
Resuming Tier 5 Phase E from a WIP handoff.

Repo: /root/site-audit-fix-work/
Branch: tier-5-phase-E (pushed to origin)

Read in order:
1. Claude Code Findings/HANDOFF-PHASE-E-WIP.md (this file)
2. Claude Code Findings/TIER-5-EXECUTION-PLAN.md
3. CLAUDE.md (fix-work hard rules + TANDEM override)

State at handoff:
- Python side complete (412 tests pass, build_audit.py runs end-to-end on ClientContext)
- JS side: lib/load-client-env.js + 1 of 6 gather scripts migrated
- Smoke gates + cohort propagation + 5 gather scripts pending
- 5d (backlinks page redesign) still open — user thinking

Next action: migrate the 5 remaining gather scripts using commit c3cde12 as
the template. Then orchestrator skill update, smoke gates, cohort
propagation, final PR.

Run `pip install -e platform/ --break-system-packages` before trusting any
pytest output (conftest guard will fail fast if this isn't done).
```
