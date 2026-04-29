# Handoff — Post-Tier-4, Resuming at Tier 5

**Written:** 2026-04-29
**Branch:** `site-audit-fixes-tier-4` (origin + local match at `690ed71` once pushed)
**Repo root:** `/root/site-audit-fix-work/` — the dedicated fix-work clone. Production clone at `/root/site-audit/` — don't touch it.

**This handoff is designed to be self-sufficient.** A fresh session can read this single doc and be ready to plan Tier 5 without chaining through prior handoffs. Prior handoffs (`HANDOFF.md`, `HANDOFF-POST-TIER-1.md`, `HANDOFF-POST-TIER-2.md`, `HANDOFF-POST-TIER-3.md`) are retained in the repo for deeper dives but are not required reading.

---

## 0. Required reading for Tier 5 planning

Beyond this handoff, the Tier 5 session should read (in this order):

| Doc | Why |
|---|---|
| `CLAUDE.md` (repo root) | Fix-work-clone-specific rules: per-fix recipe, hard rules (one fix per commit, no `git add .`, etc.), TANDEM override (bd in TANDEM not exclusive; never push without explicit user direction). |
| `Claude Code Findings/FINAL-SYNTHESIS.md` §5 | **The 5-tier priority fix queue.** Tier 5's core scope (Fix 15 PPC workflow, Fix 16 dual-path decisions, spam-classifier calibration) lives here. Also read the 2026-04-29 "Tier 4 — SHIPPED" appendix in `## Additional Information`. |
| `Claude Code Findings/INDEX.md` | 67-file status tracker + cross-cutting bugs. Orienting reference. |
| `Claude Code Findings/MAJOR-FINDINGS.md` | Curated cross-finding bug index. Pattern recognition. |
| `Claude Code Findings/<layer>/<N>-<name>.md` | Per-file deep-dive on demand. Findings with post-Tier-3 addenda still apply: F#10, F#13, F#14, F#17, F#18, F#54, F#56, F#63. |
| `docs/SEO-AUDIT-SYSTEM.md` | Full pipeline reference. |
| `docs/PRODUCTION-CLAUDE.md` | Inherited 15 numbered data-integrity + report/template invariants. |
| `bd ready` | Live Tier 5 + post-tier punch list (4 issues filed during Tier 4 wrap). |

Findings are **append-only**: never modify existing finding text. Add new observations under `## Additional Information` at the bottom of the relevant finding file. Don't re-audit from scratch.

---

## 1. Complete changelog — Tier 4

Tier 4 was bulk re-template + client-local generator deletion across the entire client fleet. Per CLAUDE.md hard rule, branch is `site-audit-fixes-tier-4` (forked from `site-audit-fixes`), not `site-audit-fixes` directly.

### 1a. Tier 4 — 3 bulk-op fixes shipped across 8 commits + 1 prep commit

| Commit | Fix | Summary |
|---|---|---|
| `6bb4dc3` | **Fix 14** | Removed 3 stale client-local `generate-multipage-report.js` copies (matt-wallmow, laura-willis, liane-jamason — 30-43% behind template's 2724 lines). Batched per Tier 4 cohort exemption. Zero code callers confirmed pre-flight via repo-wide grep. The skill at `commands/seo-audit.md:1332` invokes the template path directly. |
| `34f0801` | **C2-prep** | `git rm --cached clients/chris-nevada` to remove an orphan 160000 gitlink pointing at unreachable commit `8832cc2c...` (introduced by abandoned v4-branch experiment `a139db9`). Files on disk untouched. Following Tier 3 prep-commit precedent. |
| `6358bbe` | **Fix 13 chris-nevada** | `mkdir -p clients/chris-nevada/scripts && cp -R template/scripts/.` → 21 [NEW] files. |
| `b592fd1` | **Fix 13 calgary-castles** | `cp -R template/scripts/.` followed by `git checkout HEAD -- clients/calgary-castles/scripts/extract-text.js` to preserve the 275-line Calgary fork. sha256 round-trip verified (`b2e89f0f...` pre = post). 11 [NEW] + 3 [UPD] + 1 PRESERVED + 1 ORPHAN (`update-readability.py`). |
| `c455656` | **Fix 13 mammoth-lakes** | `cp -R template/scripts/.` → 12 [NEW] + 3 [UPD]. |
| `9ed246e` | **Fix 13 murray-gardner** | Same shape as mammoth. 12 [NEW] + 3 [UPD]. |
| `0041cad` | **Fix 13 p3realtync** | Same shape as mammoth. 12 [NEW] + 3 [UPD]. |
| `c1da62f` | **Fix 12 laura-willis** | Drift cleanup. 3 [NEW] (`analyze-backlink-quality.js` + `lib/`) + 11 [UPD] across all Tier 1.5 / 2 / 3 fixes. ~1256 diff lines pre-sync. |
| `690ed71` | **Fix 12 liane-jamason** | Same set as laura. ~1069 diff lines pre-sync. |

Plus 2 pre-existing unpushed docs/infra commits already on the branch (`e65bea4` TANDEM doc, `a98562f` bd init) that will go up alongside the 9 Tier 4 commits when push is authorized.

### 1b. Empirical evidence — Tier 4

| Signal | Before | After | Commit |
|---|---|---|---|
| Stale `generate-multipage-report.js` on disk for matt/laura/liane | 3 files (5774 lines total — 2180 + 1797 + 1797) | 0 files | `6bb4dc3` |
| `clients/chris-nevada/scripts/` exists | NO (gitlink masked the empty dir) | YES, 21 files at template parity | `34f0801` + `6358bbe` |
| Synced clients with `lib/atomic-write.js` + `lib/fetch-with-retry.js` | 1 (matt only) | 8 (matt + 7 newly synced) | C2 → C8 |
| `analyze-backlink-quality.js` present per client | 2 (matt + liane-manual) | 8 (entire fleet) | C2 → C8 |
| `diff -rq template/scripts/ clients/<c>/scripts/` per client | drift everywhere except matt | empty for 7 clients (calgary excepted: documented fork + orphan) | C2 → C8 |
| Calgary `extract-text.js` sha256 | `b2e89f0f...` | `b2e89f0f...` (preserved verbatim across cp + checkout round-trip) | `b592fd1` |
| `pytest test_atomic_write.py test_connectors_base.py` | 8 passed | 8 passed (no regression) | — |

### 1c. Recon discoveries during Tier 4

Three findings surfaced during execution that did not exist in the plan's spill register:

1. **Phantom gitlink for `clients/chris-nevada`.** The plan assumed an empty directory; the index actually had a 160000 gitlink to a commit no one has. `git status` masked it (compares the gitlink hash, not working tree). Cleanup was non-destructive (`git rm --cached`); files stayed on disk. Filed as bd `site-audit-fix-work-0au` for v4-branch follow-up investigation.
2. **Pre-flight check needs `git ls-tree HEAD` for `160000` mode entries.** Future Tier-N pre-flights should include this — `git status` alone misses phantom submodules.
3. **`codex_worker.sh` produced no manifest artifacts.** All 5 CX-Executor dispatches fell back to direct bash. Smart-team Step 7 evidence check #2 not satisfied at manifest level. Per-task git verification was independent and passed all gates. Worth investigating worker setup before relying on smart-team for evidence trails.

---

## 2. Architectural state — what's guaranteed now (post-Tier-4)

### 2a. Step 1.5 contract (still load-bearing, now end-to-end)

`commands/seo-audit.md` Step 1.5 walks `template/scripts/` recursively on every `/seo-audit` invocation; missing/differing files get synced (with backup at `scripts/_backup/<timestamp>-<pid>/`); orphans warned not deleted; protected by sentinel banner.

**Tier 4 closes the architectural loop:** every client now starts at template parity. Step 1.5's next live run per client will produce zero deltas (calgary excepted on `extract-text.js` until Tier 5 retires the fork). The auto-sync guarantee is honored across the fleet, not just on `matt-wallmow`.

### 2b. Shared utilities (unchanged from Tier 3, now propagated)

| Utility | Location | Now consumed by |
|---|---|---|
| `atomic-write.js::writeJsonAtomic` | `template/scripts/lib/atomic-write.js` | All 8 clients (was: matt only) via `populate-audit-data.js` + `gather-keyword-volumes.js` |
| `atomic_write.py::write_json_atomic` | `platform/src/audit_platform/utils/atomic_write.py` | `platform/scripts/build_audit.py:872` (Python side, unchanged from Tier 3) |
| `fetch-with-retry.js::requestJson` | `template/scripts/lib/fetch-with-retry.js` | All 8 clients via every gather script + `gather-local-seo.js::fetchHtml` |
| `analyze-backlink-quality.js` | `template/scripts/analyze-backlink-quality.js` | Wired into Step 5.5 by Tier 3; now lands on all 8 clients via Step 1.5 |

### 2c. Dual-write paths — status (unchanged from Tier 3)

Same as HANDOFF-POST-TIER-3 §2c. Tier 4 propagated the JS gather stack to every client but did NOT make new architectural decisions about JS vs Python paths. Fix 16 retains full freedom.

### 2d. Reference client(s) — updated

- **`matt-wallmow`** — still the verification reference. Scripts in template parity. `client-config.json` has `locationCode: 1028181` + `languageCode: "en"`.
- **All 7 other clients** — now in template parity (calgary excepted on `extract-text.js`). Clients without `locationCode`/`languageCode` in their config (everyone except matt) fall back to `2840` / `'en'` with warn on next audit. **Backfill candidate** carried forward from HANDOFF-POST-TIER-3 §3.

### 2e. The 12 layer directories — unchanged

Same map as HANDOFF-POST-TIER-3 §2e. No structural changes this tier.

---

## 3. Verification discipline (carry forward into Tier 5)

Same as HANDOFF-POST-TIER-3 §3 with two Tier 4 additions:

- **Pre-flight should `git ls-tree HEAD` for unexpected `160000` mode entries** in addition to `git status`. Phantom gitlinks don't show in status.
- **For any cp+checkout sequence touching forked client files:** capture sha256 BEFORE cp, verify sha256 round-trip AFTER cp + checkout. Replaces brittle `wc -l + grep` heuristics.

All other Tier 3 discipline (narrowest-boundary verification, matt-wallmow as reference, "before" baselines to `/tmp/`, go/no-go gates, tier-boundary spill handling, operator-side gates for credentialed paths) carries forward unchanged.

---

## 4. Hard constraints (unchanged across all tiers)

1. **One fix per commit.** Tier 4 cohort exemption only applied to bulk re-template ops; Tier 5 reverts to one-fix-per-commit unless its plan explicitly takes a similar exemption.
2. **Stage explicitly by path.** Never `git add .` or `-A`. Working tree noise (`.collab/`, `.playwright-mcp/`, `.codex/`, `.claude/settings.local.json`) must never accidentally land.
3. **Don't modify existing finding text.** Append under `## Additional Information` only.
4. **Don't re-audit from scratch.** Re-reading scripts for full context is expected; producing new finding docs is not.
5. **Don't skip matt-wallmow verification** on functional fixes.
6. **Don't fix out of tier order** unless promoting a dependency via the spill-prep-commit pattern (Tier 1.5, Tier 2 C1, Tier 3 prep commits, Tier 4 C2-prep — all precedents).
7. **Before pushing:** `gh auth setup-git && git push` (HTTPS remote needs gh credential helper). **Never push without explicit user direction** per CLAUDE.md TANDEM §3.
8. **Commit footer:** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

---

## 5. Deferred — the Tier 5 / post-tier punch-list

Live in bd. Run `bd ready` for the current view. Snapshot at handoff time:

### 5a. Filed in bd this session (4 issues)

| bd ID | Pri | Title |
|---|---|---|
| `site-audit-fix-work-aj1` | P2 [bug] | Missing test/runtime deps: `networkx` + `vaderSentiment` cause 11 pytest failures |
| `site-audit-fix-work-0au` | P3 | Investigate v4 branch artifacts (phantom gitlink discovered during Tier 4) |
| `site-audit-fix-work-acf` | P3 | Reliability sweep: 9 Python connectors bypass `_request_sync` retry coverage |
| `site-audit-fix-work-ar9` | P3 | Calgary `extract-text.js` upstream-then-replace |

### 5b. Tier 5 scope per `FINAL-SYNTHESIS.md §5e`

- **Fix 15 — PPC workflow** (F#16, #19, #20, #62). Create `commands/ppc-audit.md` + raw→data transformer. Entire PPC cluster currently orphaned. Tier 4 propagated PPC scripts to every client; consumers exist on disk but no skill drives them. Effort: L. Risk: medium (new workflow, needs E2E testing). Not yet in bd.
- **Fix 16 — Dual-path decisions** (F#41, #54, #8, #9, #16). Pick Python OR JS for backlinks / local / PPC / DFS. Eliminates redundant API billing + divergent output shapes + divergent classifiers. Tier 3 confirmed F#54's dual-classifier is architectural-not-active (only JS path is consumed); Tier 4 propagated the JS path everywhere. Fix 16 still owes the retire-one-or-the-other decision. Effort: L. Risk: high. Not yet in bd.
- **Spam-classifier calibration** (F#14 §7 item 2). `analyze-backlink-quality.js` rule-based v1 flagged 35/42 of matt's domains as spam, only 1 legit — almost certainly over-aggressive. Hand-label ~100 samples, tune thresholds, bump `method` to `rule-based-v2`. Bundle with Fix 16 since classifier reconciliation is the same decision. Not yet in bd.

### 5c. Tier 3 operator-side follow-ups (still owed; not yet in bd)

- **Fix 10 `organicTrafficTotal` gate** on next real `/seo-audit` run. Checklist in F#10 `## Additional Information`.
- **Fix 11 SIGKILL stress test.** Real-world signal handling under `write_json_atomic` not validated.
- **End-to-end visual verification** per `FINAL-SYNTHESIS.md §5d` — open all 9 HTML report pages after a real audit, confirm Tier 3 fixes visible.

### 5d. Post-tier opportunistic items (carry-forward; not yet in bd)

- City → DFS code lookup table.
- Pre-commit hook protecting Step 1.5 sentinel banner.
- Transport-layer fetcher for Yelp / Realtor / Zillow.
- `scripts/_backup/*` cleanup across clients (disk hygiene).
- `validateAuditData` exit 1 on critical issues (F#21 #2).
- DR scale normalization at connector layer (F#8 #3, #54 #3).
- `base.py` rate-limit shared across connector instances (F#40 #3).
- `populate-audit-data.js` multi-regex heading fallback (F#15 #1).
- `extract-text.js` default `--limit Infinity` + warn on cap (F#6 #1).

---

## 6. Tier 5 starting prompt (for `/ultraplan` or fresh session — but consider local /smart-team given prior cloud /ultraplan reliability issues)

```
# Plan Tier 5 — architectural cleanup

## Repo + branch
- Working clone: /root/site-audit-fix-work/ (production clone at /root/site-audit/ — don't touch)
- Branch base: site-audit-fixes-tier-4 at 690ed71 (10 commits ahead of e65bea4 once pushed)
- Tier 1 / 1.5 / 2 / 3 / 4 complete. Auto-sync guarantee end-to-end across the fleet.

## Required reading
1. Claude Code Findings/HANDOFF-POST-TIER-4.md (this handoff, self-sufficient)
2. Claude Code Findings/FINAL-SYNTHESIS.md §5 Tier 5 (Fix 15 PPC, Fix 16 dual-path, calibration)
   + the 2026-04-29 "Tier 4 — SHIPPED" appendix
3. Claude Code Findings/INDEX.md (67-file status tracker)
4. Claude Code Findings/MAJOR-FINDINGS.md (cross-finding index)
5. CLAUDE.md (fix-work rules + TANDEM override)
6. bd ready (live Tier 5 + post-tier issues)

## Tier 5 scope (per FINAL-SYNTHESIS.md §5e)

Three architectural items:

1. Fix 15 — PPC workflow. Create commands/ppc-audit.md + raw→data
   transformer. PPC scripts already on every client thanks to Tier 4;
   the skill that drives them does not exist.

2. Fix 16 — Dual-path decisions. Pick Python OR JS for backlinks /
   local / PPC / DFS. Tier 4 propagated the JS path everywhere; the
   architectural retire-one-path decision is still owed.

3. Spam-classifier calibration. analyze-backlink-quality.js rule-based
   v1 is over-aggressive. Bundle with Fix 16 — same decision surface.

## Decision points to surface before starting

- Fix 15: full E2E PPC workflow scope (raw→data→XLSX→PPTX) or scoped
  (just the skill + transformer, defer deliverables)?
- Fix 16: hard retirement (delete dead path) or soft (mark deprecated +
  warn)? Affects ~9 connectors + 2 analyzers.
- Calibration: hand-label dataset size + thresholds source?

## Hard constraints
1. One fix per commit.
2. Don't modify existing finding text — append under ## Additional Information.
3. Stage explicitly by path; never `git add .`.
4. Don't push without explicit user direction (TANDEM §3).
5. Commit footer: Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>.
6. matt-wallmow remains the reference client.
7. New tier branch: site-audit-fixes-tier-5 (forked from site-audit-fixes-tier-4).
```

---

## 7. Fast-start checklist

1. `cd /root/site-audit-fix-work`
2. `git status` — expect clean tree (or only ` M .claude/settings.local.json` accepted noise).
3. `git log --oneline -15` — last 9 commits should be Tier 4 (`6bb4dc3..690ed71`); above those `e65bea4` and `a98562f`.
4. `git branch --show-current` — expect `site-audit-fixes-tier-4` (or `site-audit-fixes-tier-5` if already forked).
5. `PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v` — expect 8/8 passing.
6. `bd ready` — see live Tier 5 punch list (4 issues at handoff time).
7. `for c in laura-willis liane-jamason chris-nevada mammoth-lakes murray-gardner p3realtync matt-wallmow; do diff -rq template/scripts/ clients/$c/scripts/ > /dev/null && echo "$c: IN SYNC"; done && diff -rq template/scripts/ clients/calgary-castles/scripts/ | head -5` — expect 7 IN SYNC + 2 calgary exception lines.
8. Read §1–§5 of this handoff. Read FINAL-SYNTHESIS.md §5 + Tier 4 SHIPPED appendix for authoritative scope.
9. Plan Tier 5. The cloud `/ultraplan` had reliability issues during Tier 4 planning (2 timeouts + 1 stale-snapshot result); local `/smart-team` with subagent-driven execution worked well. Recommend the local route.
10. Fork a new tier branch: `git checkout -b site-audit-fixes-tier-5`.

---

**Total state:** Tier 1 / 1.5 / 2 / 3 / 4 shipped. Auto-sync architectural guarantee in force end-to-end. Atomic write coverage on both JS + Python sides. Feature restoration complete. Bulk re-template + client-local generator deletion complete. matt-wallmow is in template parity; all 7 other clients now in template parity (calgary excepted on `extract-text.js` fork). 9 commits ahead of pre-Tier-4 baseline `e65bea4`. Origin sync pending user push authorization. Ready for Tier 5.
