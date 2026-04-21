# Handoff — Post-Tier-1, Resuming at Tier 2

**Written:** 2026-04-21 (succeeds `HANDOFF.md`, which is now historical — read it for pre-Tier-1 context)
**Branch:** `site-audit-fixes` (origin + local match at `0f14516`)
**Repo root:** `/root/site-audit-fix-work/` — this is the dedicated fix-work clone. The production clone lives at `/root/site-audit/` — don't touch it.

---

## 1. What changed since HANDOFF.md

**Tier 1 — all three fixes shipped and empirically verified on `matt-wallmow`.** Plus one scope expansion (Tier 1.5 — a prerequisite that surfaced during verification) and one architectural addition (auto-sync in the skill).

| Commit | Category | Summary |
|---|---|---|
| `76e8535` | Tier 1 | `build_audit.py:216` — extract `edges` from the link-graph envelope. Null-safe form. |
| `eb2f693` | Tier 1 | `template/scripts/gather-backlinks.js:38` — add `Semaphore` to the destructured import. |
| `ff952ad` | Tier 1 | `commands/seo-audit.md` lines 379–397 deleted — Agent 2 no longer overwrites `crawl-data.json` or `link-graph.json`. |
| `93835d7` | scaffolding | Scoped `CLAUDE.md` for fix work; preserved production rules at `docs/PRODUCTION-CLAUDE.md`. |
| `88a67e6` | **Tier 1.5** | `template/scripts/crawl-sitemap.js` — ported liane-jamason's `fetchXmlRaw` so Yoast-stylesheet XML sitemaps parse. Finding #5 bug #2. |
| `2c41634` | docs | Verification appendices on findings #63, #67, #5 (append-only under `## Additional Information`). |
| `e58dd6d` | **architectural** | `/seo-audit` Step 1.5 — auto-syncs client scripts from template on every invocation. Fixes the root cause of client-fork drift. |
| `218086d` | chore | matt-wallmow scripts synced to template (empirical Step 1.5 dry run). |
| `0f14516` | harden | Step 1.5 hardened: recursive `find`, PID-extended timestamps, `TEMPLATE_DIR` sanity check, orphan detection, "⚠ DO NOT REMOVE" banner + Contract section. |

Verification evidence (Tier 1, on matt-wallmow):

| Signal | Before | After |
|---|---|---|
| `internalLinking.total_pages` | 0 | 52 |
| `internalLinking.total_internal_links` | 0 | 93 |
| `internalLinking.orphans` count | 11 | 5 |
| `gather-backlinks.js` execution | `ReferenceError: Semaphore is not defined` | auth error (= passed import line) |
| crawl-sitemap standalone on Yoast-styled sitemap | "No sitemap found" (0 pages) | 84 pages discovered across 5 child sitemaps, 69-source link-graph |

Hardened Step 1.5 passed 6 stress tests: baseline no-op, missing-file restore, drift replacement, orphan preservation + warning, bad-`TEMPLATE_DIR` fatal exit, real-drift sync on liane-jamason scratch (9 actions — 8 updates + 1 missing-lib creation).

## 2. Reference client state

- **`clients/matt-wallmow/`** — scripts fully in sync with template (0 diffs). Backups of pre-sync versions live under `scripts/_backup/*` (gitignored; discard when you're sure nothing needs recovering). The 208-line legacy `gather-backlinks.js` fork is preserved there.
- **`clients/liane-jamason/`** — still has 8 drifted scripts + 1 missing lib file. Will auto-heal via Step 1.5 on her next `/seo-audit` run. Do not pre-sync her manually; let the skill do it.
- **`clients/laura-willis/`, others** — drift status unknown. Each will auto-heal on their next audit.
- **Matt's `seo/research/crawl-data.json`** still holds the pre-fix 11-page snapshot (intentionally not regenerated during verification — Fix 3 was verified via a scratch run in `template/seo/research/` which was cleaned up). The 11-page snapshot will be overwritten by `crawl-sitemap.js --analyze` the next time it runs in matt's dir.

## 3. The Step 1.5 contract (know this before editing the skill)

`commands/seo-audit.md` Step 1.5 is the architectural guarantee that every future audit picks up the latest template scripts. It:

- Runs on EVERY `/seo-audit` invocation (new and existing clients).
- Walks `template/scripts/` recursively — covers any file type, any subdir depth.
- For each template file:
  - missing in client → `[NEW]` copy.
  - present but differs → back up client copy to `scripts/_backup/<timestamp>-<pid>/`, then overwrite.
  - identical → skip.
- Detects orphans (files in client/scripts not in template/scripts) and **WARNS** — never auto-deletes.
- Fails fatally (exit 1) if `TEMPLATE_DIR/scripts` doesn't resolve to a real dir.

**Rules of engagement:**

- Never add client-specific customizations directly to `clients/*/scripts/*.js`. They'll be overwritten on the next audit. Promote the change to the template, or put custom tooling in a sibling dir like `scripts-custom/` (outside `scripts/`).
- Never remove Step 1.5 from the skill. The skill banner says `⚠ DO NOT REMOVE OR SKIP THIS STEP`. Honor it. A future-work item (see §6) is a pre-commit hook that enforces this.
- Intentional client-script divergence is a design smell. If you spot one, ask first.

## 4. Isolated verification methodology (carry forward into Tier 2)

Tier 2 fixes must use the same verification discipline as Tier 1:

- Verify each fix at its **narrowest code boundary** — not through the whole pipeline. Full `/seo-audit` end-to-end runs exercise every tier's code simultaneously and make it impossible to tell which tier's bug fired if something breaks. Save the integration test for once many tiers have shipped.
- Use `matt-wallmow` as the reference client for empirical checks — his data shape is known, the "before" baseline is documented in the findings.
- Capture "before" baselines in `/tmp/matt-*.pre-fixN.json` before running anything that mutates state.
- Bail out to the user if a bug spills across tier boundaries — do NOT paper over Tier X's dependency on a not-yet-fixed Tier Y concern. Propose promoting Tier Y to the current tier (as we did for Finding #5 bug #2 → Tier 1.5), or pause for a decision.

## 5. Tier 2 — what's next

From `Claude Code Findings/FINAL-SYNTHESIS.md` §5:

| # | Finding | File | Fix summary |
|---|---|---|---|
| 4 | #12 | `template/scripts/gather-local-pack.js` + `commands/seo-audit.md` | Parameterize `--location` from `client-config.json` instead of hardcoding. Critical for clients outside the default service area. |
| 5 | #11, #15 | `template/scripts/populate-audit-data.js` + `template/scripts/gather-keyword-volumes.js` | Atomic + backed-up `audit-data.json` rewrite. Current code can corrupt the file on partial failure. |
| 6 | #40 | `platform/src/audit_platform/connectors/base.py` | Retry coverage: extend retry to cover HTTP 5xx, add `@retry` decorator to `_request_sync`. |

Full details in the per-file finding docs:
- `Claude Code Findings/03-api-gathering/12-gather-local-pack.md`
- `Claude Code Findings/03-api-gathering/15-gather-keyword-volumes.md`
- `Claude Code Findings/04-analysis-population/11-populate-audit-data.md`
- `Claude Code Findings/09-python-connectors/40-connectors-base.md`

Tier 2 verification against matt-wallmow:
- Fix #4: `node scripts/gather-local-pack.js` picks up `--location` from matt's `client-config.json` instead of any hardcoded default.
- Fix #5: interrupt `populate-audit-data.js` mid-run, confirm `audit-data.json` is not corrupted and a backup exists.
- Fix #6: simulate HTTP 500 from DataForSEO, confirm `base.py` retries N times with backoff.

## 6. Deferred — do after all tiers ship

- **Pre-commit hook to protect Step 1.5** — greps `commands/seo-audit.md` for a sentinel marker (e.g., `⚠ DO NOT REMOVE OR SKIP THIS STEP`) and blocks any commit that removes it. Final architectural safeguard. User explicitly deferred this until Tier 2+ work is complete.
- **Full `/seo-audit` end-to-end integration test** on matt-wallmow. Worth running once after all tiers land to catch any cross-tier regression.
- **Cleanup pass on `scripts/_backup/*`** directories — once operators are comfortable that nothing in them is needed, delete. Gitignored, so this is a disk-hygiene task only.
- **Review liane-jamason's post-sync state** after her next audit. Her 208-line gather-backlinks fork (already backed up in scratch during verification) may or may not have had intentional logic worth preserving.

## 7. Starting Tier 2 — ultra plan mode prompt

Copy-paste this block into a fresh session (or `/ultraplan`):

```
# Ultra Plan request — Tier 2 fixes for site-audit pipeline

## Repo + branch
- Working clone: /root/site-audit-fix-work/ (production clone at /root/site-audit/ — don't touch)
- Branch: site-audit-fixes, origin synced at 0f14516
- Tier 1 + 1.5 + auto-sync complete. Read Claude Code Findings/HANDOFF-POST-TIER-1.md first for full context.

## Tier 2 — three fixes (from FINAL-SYNTHESIS.md §5)

### Fix 4: gather-local-pack.js --location parameterization
- Finding: Claude Code Findings/03-api-gathering/12-gather-local-pack.md (#12)
- Touches: template/scripts/gather-local-pack.js + commands/seo-audit.md
- Problem: --location is hardcoded; clients outside the default service area get wrong local-pack data.
- Source: read script end-to-end, check how client-config.json is read elsewhere.

### Fix 5: atomic audit-data.json rewrites
- Findings: #11 (populate-audit-data.js) + #15 (gather-keyword-volumes.js)
- Touches: template/scripts/populate-audit-data.js, template/scripts/gather-keyword-volumes.js
- Problem: both scripts overwrite audit-data.json without atomic write semantics. Partial failure = corrupted JSON = downstream chaos.
- Fix direction: write to .tmp, fsync, rename on success. Keep a .bak of the previous version.

### Fix 6: base.py retry coverage
- Finding: Claude Code Findings/09-python-connectors/40-connectors-base.md (#40)
- Touches: platform/src/audit_platform/connectors/base.py
- Problem: retry logic covers HTTP 4xx/network errors but misses 5xx, and _request_sync has no @retry decorator at all.

## Verification discipline (mandatory — from HANDOFF-POST-TIER-1.md §4)
- Verify each fix at its narrowest code boundary. Do not run full /seo-audit.
- Use matt-wallmow as reference client. His scripts are now in sync with template (commit 218086d); Step 1.5 heals any future drift automatically.
- Capture baselines before mutating state.
- If a Tier 2 bug depends on a not-yet-fixed Tier 3+ finding, pause and propose promotion (like we did for Finding #5 bug #2 → Tier 1.5).

## What I want from the plan
- Per-fix section: problem, exact diff (old → new with surrounding context), blast-radius map (every call site / producer / consumer), verification protocol, rollback.
- Execution order with reasoning.
- Critical files to read before editing; existing utilities to reuse.
- End-to-end verification checklist once all three ship.
- Out-of-scope list for Tier 2 — things that look tempting but belong later.
- Anything the original audit missed — source files are ground truth, findings are supporting evidence.

## Hard constraints (unchanged from Tier 1)
1. One fix per commit; scoped commit message with finding reference and Claude Opus 4.7 (1M context) co-author footer.
2. Don't modify existing finding text — append only under "## Additional Information".
3. Don't re-audit or rewrite findings.
4. Stage explicitly by path; never `git add .`.
5. Never skip matt-wallmow verification on functional fixes.
6. Don't fix out of tier order unless promoting a dependency.
7. Before pushing: `gh auth setup-git` then `git push`.
```

## 8. Fast-start checklist

1. `cd /root/site-audit-fix-work`
2. `git status` — expect clean tree.
3. `git branch --show-current` — expect `site-audit-fixes`.
4. `git log --oneline -10` — last commit should be `0f14516 harden: Step 1.5 sync…`.
5. Read this handoff (§1–4 minimum, §5 to orient on Tier 2).
6. Open the four Tier 2 finding docs listed in §5.
7. Kick off ultra plan mode with the prompt in §7.
8. When the plan comes back, execute per the verification discipline in §4.

---

**Total state:** Tier 1 shipped, Tier 1.5 shipped, auto-sync architectural guarantee shipped and hardened, reference client clean, origin pushed, 9 commits ahead of the last audit-artifact commit. Ready for Tier 2.
