# Handoff — Post-Tier-4-Followups, Resuming at Tier 5

**Written:** 2026-04-29
**Branch:** `site-audit-fixes-tier-4-followups` (origin + local match at `e6033ec`).
**Repo root:** `/root/site-audit-fix-work/` — the dedicated fix-work clone. Production clone at `/root/site-audit/` — don't touch it.

**This handoff is designed to be self-sufficient.** A fresh session can read this single doc — in tandem with `HANDOFF-POST-TIER-4.md` for the prior tier's context — and be ready to plan Tier 5 without chaining through earlier handoffs. Prior handoffs (`HANDOFF.md`, `HANDOFF-POST-TIER-1.md`, `HANDOFF-POST-TIER-2.md`, `HANDOFF-POST-TIER-3.md`) are retained for deeper dives but are not required reading.

The **Tier 4 Followups** were a substantive 12-commit pass that resolved the 4 bd issues filed during Tier 4 wrap (aj1, 0au, acf, ar9), fixed silent-prod-data-loss in two analyzers, spread Tier 2's retry coverage to 5 in-scope Python connectors, retired Calgary's `extract-text.js` fork, restored fleet parity after the template upgrade, and surfaced 2 NEW Tier 5 candidates from forensic investigation. **The Tier 4 fleet-parity guarantee that was broken mid-execution by the 4a template upgrade was restored explicitly via a propagation commit (4d) — Step 1.5's auto-sync no longer has anything to catch up on.**

---

## 0. Required reading for Tier 5 planning

Beyond this handoff, the Tier 5 session should read (in this order):

| Doc | Why |
|---|---|
| `Claude Code Findings/HANDOFF-POST-TIER-4.md` | Tier 4 context — the bulk re-template work that preceded these followups. Read in tandem with this doc. |
| `CLAUDE.md` (repo root) | Fix-work-clone-specific rules: per-fix recipe, hard rules, TANDEM override (bd in TANDEM not exclusive; never push without explicit user direction). |
| `Claude Code Findings/FINAL-SYNTHESIS.md` §5 | **The 5-tier priority fix queue.** Tier 5's core scope (Fix 15 PPC workflow, Fix 16 dual-path decisions, spam-classifier calibration) lives here. Read both the 2026-04-29 "Tier 4 — SHIPPED" and "Tier 4 Followups — SHIPPED" appendices in `## Additional Information`. |
| `Claude Code Findings/INDEX.md` | 67-file status tracker + cross-cutting bugs. Orienting reference. |
| `Claude Code Findings/MAJOR-FINDINGS.md` | Curated cross-finding bug index. Pattern recognition. |
| `Claude Code Findings/<layer>/<N>-<name>.md` | Per-file deep-dive on demand. Findings with post-Tier-3 addenda still apply (F#10, F#13, F#14, F#17, F#18, F#54, F#56, F#63). |
| `Claude Code Findings/TIER-4-OVERFLOW-PLAN.md` | The plan executed for these followups. Includes Decision Record (D1-D6), Risk Register (14 risks), and consumer-audit corrections vs Explore C. Useful for understanding *why* certain choices were made. |
| `docs/SEO-AUDIT-SYSTEM.md` | Full pipeline reference. |
| `docs/PRODUCTION-CLAUDE.md` | Inherited 15 numbered data-integrity + report/template invariants. |
| `bd ready` | Live Tier 5 + post-tier punch list (2 NEW issues filed during 0au forensic). |

Findings are **append-only**: never modify existing finding text. Add new observations under `## Additional Information` at the bottom of the relevant finding file. Don't re-audit from scratch.

---

## 1. Complete changelog — Tier 4 Followups

12 commits on `site-audit-fixes-tier-4-followups`, forked from `site-audit-fixes-tier-4` at `f761fea`, pushed to origin `e6033ec`.

### 1a. The 12-commit changelog

| Commit | Issue | Summary |
|---|---|---|
| `cdb8153` | docs | Tier 4 Overflow Plan committed (max-effort revision; D1-D6 decision record + 14-risk register + corrected consumer audit). |
| `5950198` | **aj1** [P2] | Added `networkx>=2.6` + `vaderSentiment>=3.3.2` to `platform/pyproject.toml` `dependencies`. Both pure Python, small footprint. Try/except-import guards in analyzers preserved as defense-in-depth. **Pre-fix: 11 pytest failures (silent zero-data risk in prod). Post-fix: 414/414 passing.** |
| `f59998d` | **acf 1/5** | `pagespeed.py` GET routed through `_request_sync`. Manual `_request_delay()` preserved (D3: API-key-conditional pacing). |
| `4534d37` | **acf 2/5** | `business_profile.py` OAuth GET + POST routed through `_request_sync`. Bearer headers from `_get_auth_headers()` flow as kwargs. |
| `50ae087` | **acf 3/5** | `crux.py` POST routed through `_request_sync` with explicit `httpx.HTTPStatusError` catch preserving 404-as-no-data semantic. |
| `32b6149` | **acf 4/5** | `brand_mentions.py` `_safe_get` refactored to wrap `_request_sync`. **Preserved subtle behaviors:** removed redundant `_rate_limit_sync()` call (base does it internally — would double-consume); preserved `Retry-After` header parsing (`min(int(headers.get("Retry-After", "5")), 30)`); preserved bare `except Exception` (load-bearing for "never raises" docstring contract); preserved all 4 `log.warning` call sites with identical kwargs. |
| `27ac230` | **acf 5/5** | `social_audit.py` `_safe_head` + `_safe_get` refactored. **Critical preservation:** `_safe_head` returns `int | None` (status code, not Response); HTTPStatusError catch returns `exc.response.status_code` so callers depending on status-code-back-on-4xx don't silently get None. |
| `86e4ae6` | bd hook | Auto-commit from `bd close site-audit-fix-work-acf` (closes the parent acf issue after all 5 connector commits land). |
| `7836e23` | **ar9 1/3** | Upstreamed Calgary's universally-useful improvements to `template/scripts/extract-text.js`: regex-driven `countSyllables` (handles "classes" = 1 not 2), `<main>` → `<article>` → `<section>` extraction with 22-selector boilerplate stripping, `getReadabilityLevel(score)` helper. **Multi-client smoke test passed for matt + laura + liane.** |
| `ac9220b` | **ar9 2/3** | Removed Calgary's hardcoded community-slug regex from `clients/calgary-castles/scripts/extract-text.js`. **Critical correction vs Explore C:** the deeper consumer grep proved `scoreExplanation` IS consumed by code — `generate-multipage-report.js:1432,1483-1484,2796` reads it with a `buildReadabilityExplanation()` fallback; `pages/content.js:293` displays it; `build_audit.py:692` writes it; `AUDIT-SOP.md:26` requires it. Deletion is still safe — the renderer fallback handles missing values, producing generic explanations. |
| `1b22d64` | **ar9 3/3** | Synced `clients/calgary-castles/scripts/extract-text.js` to `template/scripts/extract-text.js` via `cp`. sha256 round-trip verified (calgary == template post-sync). **Calgary's 275-line fork retired.** Tier 4's sha256-fingerprint guard no longer needed for this file. |
| `e6033ec` | **ar9 4/3** | **Surfaced during post-flight:** task 4a's template upgrade had not been propagated to the 6 non-calgary clients, breaking Tier 4 fleet-parity until next-audit Step 1.5 sync. Fixed inline via cp loop + 1 cohort commit. **Restored Tier 4's fleet-parity guarantee explicitly.** |

### 1b. Empirical evidence — Tier 4 Followups

| Signal | Before | After | Commit(s) |
|---|---|---|---|
| `platform/pyproject.toml` `dependencies` count | 11 | 13 (+ networkx, vaderSentiment) | `5950198` |
| pytest full suite | 403 passed + 11 failed | 414 passed (zero failures) | `5950198` |
| `pip show networkx vaderSentiment` | not installed | networkx 3.6.1 + vaderSentiment 3.3.2 | `5950198` |
| `audit_platform.analyzers.internal_linking._NETWORKX_AVAILABLE` | `False` (silent zero metrics) | `True` (real metrics) | `5950198` |
| Connectors with `_request_sync` retry coverage | 1 (dataforseo, since Tier 2) | 6 (added pagespeed, business_profile, crux, brand_mentions, social_audit) | `f59998d`/`4534d37`/`50ae087`/`32b6149`/`27ac230` |
| `template/scripts/extract-text.js` syllable accuracy on "classes" | 2 syllables | 1 syllable (matches English) | `7836e23` |
| `template/scripts/extract-text.js` content extraction | body-wide after 8-selector boilerplate strip | `<main>`/`<article>`/`<section>` priority + 22-selector strip + body fallback | `7836e23` |
| Calgary's `extract-text.js` sha256 | `b2e89f0f...` (Tier-4-preserved fork) | matches template (fork retired) | `ac9220b` + `1b22d64` |
| Fleet `diff -rq template/scripts/ clients/<c>/scripts/` (extract-text.js delta) | drift on all 6 non-calgary clients post-`7836e23` | empty for all 7 clients (calgary excepted: `update-readability.py` orphan only) | `e6033ec` |
| bd issues open at handoff start | 4 (aj1, 0au, acf, ar9) | 2 (c6r, 8d2 — NEW from 0au forensic) | all close commits |
| Total commits on followups branch | 0 | 12 | — |

### 1c. Recon discoveries during Followups

Three findings surfaced during execution that did not exist in the plan's spill register:

1. **PEP 668 externally-managed Python environment.** Pre-flight `pip install --dry-run networkx vaderSentiment` failed with PEP 668 ("externally-managed-environment"). The plan's `pip install -e platform/` command would have stalled the CX-Executor. Resolved by using `pip install --break-system-packages networkx vaderSentiment` — established precedent (pytest itself is at `/usr/local/lib/python3.12/dist-packages` system-wide). The platform package itself doesn't need pip-install; it's PYTHONPATH-imported.
2. **`scoreExplanation` IS consumed by code (Explore C correction).** Explore C's report claimed Calgary's `scoreExplanation` had no consumers and was UI polish only. Repo-wide grep at planning time (D5) proved otherwise: 4 distinct consumers (renderer with fallback, HTML page, Python pipeline, AUDIT-SOP requirement). Deletion was still safe (renderer fallback handles missing values), but commit-message accuracy required correcting the framing — captured in commit `ac9220b` body.
3. **ar9 1/3 broke fleet parity until propagated.** The plan's 3-subtask ar9 structure (upstream / delete-slugs / sync-calgary) didn't account for the 6 OTHER clients also needing the template update. Surfaced during Task 5 post-flight `diff -rq` check; resolved by the unplanned propagation commit `e6033ec` (mirrors Tier 4 cohort exemption: 6 clients, 1 commit, mechanical sync).

### 1d. Two important detail-preservations during acf refactor

The CX-Executor agents caught and preserved subtle behaviors that would have broken existing call paths if blindly templated:

1. **`brand_mentions._safe_get` `_rate_limit_sync()` removal.** Existing code called `self._rate_limit_sync()` explicitly before `sync_client.get(...)`. Routing through `_request_sync` would have **double-consumed** the rate-limit token because base calls `_rate_limit_sync()` internally. Agent removed the redundant call. Also preserved the existing `Retry-After` header parsing for 429 backoff (not a fixed sleep value as the plan template assumed) and the bare `except Exception` for the "never raises" docstring contract.
2. **`social_audit._safe_head` returns `int | None` (status code), not `Response | None`.** Existing code returned `response.status_code` directly. Agent's refactor preserved this by returning `exc.response.status_code` from the `httpx.HTTPStatusError` except branch — otherwise callers depending on getting the status code back on 4xx (to distinguish "exists but forbidden" from "not found") would all silently get `None`.

These nuances mattered because the plan template described the refactor at one abstraction level; the actual code had domain-specific affordances at a lower level. The CX-Executor agents earned their compute by reading carefully rather than blindly templating.

---

## 2. Architectural state — what's guaranteed now (post-Followups)

### 2a. Step 1.5 contract (still load-bearing, fully end-to-end)

`commands/seo-audit.md` Step 1.5 walks `template/scripts/` recursively on every `/seo-audit` invocation; missing/differing files get synced; orphans warned not deleted; protected by sentinel banner.

**Followups close the architectural loop opened by the ar9 1/3 template upgrade:** all 7 clients now have the upgraded `extract-text.js` (committed via `e6033ec` propagation). Step 1.5's next live run per client will produce zero deltas (calgary's `update-readability.py` orphan excepted — that's preserved per warn-don't-delete).

**Calgary's 275-line `extract-text.js` fork is RETIRED.** The Tier 4 sha256-fingerprint guard is no longer needed for this file. Calgary participates in normal Step 1.5 auto-sync going forward.

### 2b. Shared utilities (post-Tier-4, now with consistent retry coverage on 6 connectors)

| Utility | Location | Now consumed by |
|---|---|---|
| `atomic-write.js::writeJsonAtomic` | `template/scripts/lib/atomic-write.js` | All 8 clients (Tier 4) |
| `atomic_write.py::write_json_atomic` | `platform/src/audit_platform/utils/atomic_write.py` | `platform/scripts/build_audit.py:872` (Tier 3) |
| `fetch-with-retry.js::requestJson` | `template/scripts/lib/fetch-with-retry.js` | All 8 clients (Tier 4) |
| `analyze-backlink-quality.js` | `template/scripts/analyze-backlink-quality.js` | All 8 clients (Tier 4) |
| `base._request_sync` (Python) | `platform/src/audit_platform/connectors/base.py:110-132` | **6 connectors:** dataforseo (Tier 2) + pagespeed/business_profile/crux/brand_mentions/social_audit (this pass). Out of scope: search_console/ga4/google_ads (Google SDKs, no httpx); local_seo (composes others, gains coverage transitively). |
| `extract-text.js` syllable algo + main/article extraction + getReadabilityLevel helper | `template/scripts/extract-text.js` | All 8 clients (this pass — propagated via `e6033ec`) |

### 2c. Dual-write paths — status (unchanged from Tier 3/Tier 4)

Same as HANDOFF-POST-TIER-3 §2c + HANDOFF-POST-TIER-4 §2c. Followups did NOT make new architectural decisions about JS vs Python paths. **Fix 16 retains full freedom** to retire one path; the JS-side is now as well-instrumented as the Python-side via the retry-coverage spread.

### 2d. Reference client(s) — unchanged

- **`matt-wallmow`** — verification reference. Scripts in template parity (with ar9 1/3 + 4d propagated).
- **All 7 other clients** — in template parity (calgary excepted: `update-readability.py` orphan).

### 2e. The 12 layer directories — unchanged

Same map as HANDOFF-POST-TIER-3 §2e + HANDOFF-POST-TIER-4 §2e.

---

## 3. Verification discipline (carry forward into Tier 5)

Same as HANDOFF-POST-TIER-4 §3 with two Followups additions:

- **`pip install` may need `--break-system-packages` on PEP 668 systems.** Established precedent in this environment: pytest + ruff are at `/usr/local/lib/python3.12/dist-packages` via this flag. The platform package is PYTHONPATH-imported (no pip install needed). External deps go in via `pip install --break-system-packages <pkg>`.
- **Post-flight fleet parity check is non-optional after a template change.** ar9 1/3 surfaced this: a template-only change leaves the fleet drifted until propagated. Future plans that touch `template/scripts/*` should include an explicit propagation step (or accept the drift with a documented "Step 1.5 will catch up at next audit" acknowledgement).

All other Tier 4 discipline (`git ls-tree HEAD` for `160000` mode entries, sha256 round-trip for forked file preservation, narrowest-boundary verification, matt-wallmow as reference, "before" baselines, go/no-go gates, tier-boundary spill handling, operator-side gates for credentialed paths) carries forward unchanged.

**Smart-team subagent-driven execution proven** across 9 dispatches this pass: 2 agents caught and preserved subtle behaviors (acf 4d brand_mentions Retry-After header parsing; acf 5 social_audit status-code return) that a blind template-application would have broken. The pattern works; recommend continuing for Tier 5.

`codex_worker.sh` reliability remains uneven: 1 valid manifest entry (Task 1 aj1), 1 wrong-file edit (Task 3a pagespeed touched pyproject.toml). Direct-bash fallback handled both correctly. Worth investigating worker setup before relying on it for evidence trails — but smart-team Step 7 evidence check #2 should be considered partially-applicable in this environment until then.

---

## 4. Hard constraints (unchanged across all tiers)

Same as HANDOFF-POST-TIER-4 §4. No changes.

---

## 5. Deferred — the Tier 5 / post-tier punch-list (UPDATED)

Live in bd. Run `bd ready` for the current view. Snapshot at handoff time:

### 5a. NEW issues filed during this pass (2 issues, both from 0au forensic)

| bd ID | Pri | Title |
|---|---|---|
| `site-audit-fix-work-c6r` | P3 | Remove committed `.bak` files for `generate-multipage-report.js` (4 locations: template + matt-wallmow + laura-willis + liane-jamason). Add `*.js.bak` to `.gitignore` (currently only `*.json.bak` is ignored). Discovered during 0au v4-branch forensic. |
| `site-audit-fix-work-8d2` | P3 | Remove committed `.collab/` directory (10 files including 104KB binary `collab.db`) from tracking. Add `.collab/` to `.gitignore`. Force-added to v4 while already tracked. Decision needed: whether to keep `.md` prompt files (binary `collab.db` should be removed regardless). Discovered during 0au v4-branch forensic. |

### 5b. Tier 4 Followups — RESOLVED (was §5a in HANDOFF-POST-TIER-4)

The 4 issues filed during Tier 4 wrap are all CLOSED:

- ✓ `site-audit-fix-work-aj1` (P2 bug) — RESOLVED via commit `5950198`. networkx + vaderSentiment now required deps; 11 silent-zero-data tests now pass.
- ✓ `site-audit-fix-work-0au` (P3) — RESOLVED via forensic investigation; no code commit needed. Surfaced 2 NEW issues (c6r, 8d2 above).
- ✓ `site-audit-fix-work-acf` (P3) — RESOLVED via 5 commits (`f59998d` → `27ac230`). 5 in-scope connectors now have retry coverage. Out of scope (3 Google SDKs + local_seo composition) confirmed.
- ✓ `site-audit-fix-work-ar9` (P3) — RESOLVED via 4 commits (`7836e23` upstream → `ac9220b` slugs → `1b22d64` sync → `e6033ec` propagation). Calgary fork retired; fleet parity restored.

### 5c. Tier 5 scope per `FINAL-SYNTHESIS.md §5e` (UNCHANGED, all 3 still owed)

- **Fix 15 — PPC workflow** (F#16, #19, #20, #62). Create `commands/ppc-audit.md` + raw→data transformer. PPC scripts already on every client. Effort: L. Risk: medium. Not yet in bd.
- **Fix 16 — Dual-path decisions** (F#41, #54, #8, #9, #16). Pick Python OR JS for backlinks/local/PPC/DFS. Tier 4 propagated JS path everywhere; Followups added retry coverage to the Python connectors so both sides are now well-instrumented. Fix 16 still owes the retire-one-path decision. Effort: L. Risk: high. Not yet in bd.
- **Spam-classifier calibration** (F#14 §7 item 2). `analyze-backlink-quality.js` rule-based v1 over-aggressive. Bundle with Fix 16. Not yet in bd.

### 5d. Tier 3 operator-side follow-ups (still owed; carry-forward)

Same as HANDOFF-POST-TIER-4 §5c.

### 5e. Post-tier opportunistic items (carry-forward + 2 new candidates)

Carry-forward from HANDOFF-POST-TIER-4 §5d unchanged. **New candidates from Followups:**

- **`pyproject.toml` try/except-import guard cleanup.** aj1 left the try/except-import patterns in `internal_linking.py:24-28` and `local_seo.py:23-27` as defense-in-depth. Now that the deps are required, the guards are dead code. Removing them would surface ImportError naturally if someone runs in a stripped venv. Low priority; bundle with whoever next touches those analyzers.
- **PageSpeed `requests_per_second` override.** acf 1/5 preserved PageSpeed's manual `_request_delay()` logic per D3. Future cleanup: override `requests_per_second` in `PageSpeedConnector.__init__()` (50ms with key vs 1.1s without) so base's rate-limiting handles the API-key-conditional pacing. Lets the manual delay logic retire.
- **`codex_worker.sh` reliability investigation.** Worker produced 1 valid + 1 wrong-file artifact across 9 dispatches. Smart-team Step 7 evidence check #2 should be considered partially-applicable until investigated. Bundle with whoever next touches the llm-router tooling.

---

## 6. Tier 5 starting prompt (for `/ultraplan` or fresh session — recommend local /smart-team given prior cloud reliability issues)

```
# Plan Tier 5 — architectural cleanup

## Repo + branch
- Working clone: /root/site-audit-fix-work/ (production clone at /root/site-audit/ — don't touch)
- Branch base: site-audit-fixes-tier-4-followups at e6033ec (12 commits ahead of f761fea, pushed to origin)
- Tier 1 / 1.5 / 2 / 3 / 4 / 4-followups complete. Auto-sync guarantee end-to-end.
  Calgary fork retired. 6 Python connectors with retry coverage. networkx + vaderSentiment in deps.

## Required reading
1. Claude Code Findings/HANDOFF-POST-TIER-4-FOLLOWUPS.md (this handoff, self-sufficient)
2. Claude Code Findings/HANDOFF-POST-TIER-4.md (prior tier context, in tandem)
3. Claude Code Findings/FINAL-SYNTHESIS.md §5 Tier 5 (Fix 15 PPC, Fix 16 dual-path, calibration)
   + the 2026-04-29 "Tier 4 — SHIPPED" + "Tier 4 Followups — SHIPPED" appendices
4. Claude Code Findings/INDEX.md (67-file status tracker)
5. Claude Code Findings/MAJOR-FINDINGS.md (cross-finding index)
6. CLAUDE.md (fix-work rules + TANDEM override)
7. bd ready (live Tier 5 + post-tier issues — c6r + 8d2 as carry-forward candidates)

## Tier 5 scope (per FINAL-SYNTHESIS.md §5e — unchanged from HANDOFF-POST-TIER-4)

Three architectural items:

1. Fix 15 — PPC workflow. Create commands/ppc-audit.md + raw→data
   transformer. PPC scripts already on every client (Tier 4); the
   skill that drives them does not exist.

2. Fix 16 — Dual-path decisions. Pick Python OR JS for backlinks /
   local / PPC / DFS. Tier 4 propagated JS everywhere; Followups
   added retry coverage to 5 more Python connectors. Fix 16 still
   owes the retire-one-path decision — both sides are now well-
   instrumented, so it's a clean architectural call.

3. Spam-classifier calibration. analyze-backlink-quality.js rule-
   based v1 is over-aggressive. Bundle with Fix 16 — same
   decision surface.

Plus 2 new spill candidates from 0au forensic (c6r, 8d2 in bd).

## Decision points to surface before starting

- Fix 15: full E2E PPC workflow scope (raw→data→XLSX→PPTX) or
  scoped (just the skill + transformer, defer deliverables)?
- Fix 16: hard retirement (delete dead path) or soft (mark
  deprecated + warn)? Affects ~9 connectors + 2 analyzers.
- Calibration: hand-label dataset size + thresholds source?
- c6r / 8d2: bundle with Tier 5 or its own pre-pass?

## Hard constraints
1. One fix per commit.
2. Don't modify existing finding text — append under ## Additional Information.
3. Stage explicitly by path; never `git add .`.
4. Don't push without explicit user direction (TANDEM §3).
5. Commit footer: Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>.
6. matt-wallmow remains the reference client.
7. New tier branch: site-audit-fixes-tier-5 (forked from site-audit-fixes-tier-4-followups).
```

---

## 7. Fast-start checklist

1. `cd /root/site-audit-fix-work`
2. `git status` — expect clean tree (or only ` M .claude/settings.local.json` accepted noise + `?? .codex` from any prior CX-Executor runs).
3. `git log --oneline -15` — last 12 commits should be Followups (`cdb8153..e6033ec`); above those `f761fea` (HANDOFF-POST-TIER-4) and the Tier 4 commits.
4. `git branch --show-current` — expect `site-audit-fixes-tier-4-followups` (or `site-audit-fixes-tier-5` if already forked).
5. `PYTHONPATH=platform/src pytest platform/tests/ --tb=no -q` — expect **414 passed** (was 8/8 in the 2-file subset baseline; full suite all-green post-aj1).
6. `bd ready` — see live Tier 5 punch list (2 issues at handoff time: c6r + 8d2).
7. Fleet parity check (note: should now show all 7 clients in sync, calgary's `extract-text.js` matches template):
   ```bash
   for c in laura-willis liane-jamason chris-nevada mammoth-lakes murray-gardner p3realtync matt-wallmow; do
     diff -rq template/scripts/ clients/$c/scripts/ > /dev/null && echo "$c: IN SYNC"
   done && diff -rq template/scripts/ clients/calgary-castles/scripts/ | head -5
   ```
   Expect 7 IN SYNC + 1 calgary exception line (only `update-readability.py` orphan).
8. Read §1–§5 of this handoff. Read FINAL-SYNTHESIS.md §5 + Tier 4 SHIPPED + Tier 4 Followups SHIPPED appendices for authoritative scope.
9. Plan Tier 5. Local `/smart-team` with subagent-driven execution worked well across both Tier 4 and Followups; recommend the local route over cloud `/ultraplan`.
10. Fork a new tier branch: `git checkout -b site-audit-fixes-tier-5`.

---

**Total state:** Tier 1 / 1.5 / 2 / 3 / 4 / 4-followups shipped. Auto-sync architectural guarantee in force end-to-end across the fleet (Calgary's `extract-text.js` fork RETIRED). Atomic write coverage on both JS + Python sides. Feature restoration complete. Bulk re-template + client-local generator deletion complete. **6 Python connectors with retry coverage** (was 1). **networkx + vaderSentiment now required deps** (silent zero-data prod risk eliminated). Calgary fork upstream-and-retire complete. 12 commits ahead of pre-Followups baseline `f761fea`. Origin synced at `e6033ec`. Ready for Tier 5.
