# Tier 4 — Plan (bulk re-template + client-local generator deletion)

**Branch:** `site-audit-fixes-tier-4` (local + origin synced at `545f82e`).
**Date:** 2026-04-25.
**Method:** offline (b)-approach per BRIEF PR-1; no live `/seo-audit` invocations.
**Numbering:** This plan uses HANDOFF-POST-TIER-3 §5c numbering (Fix 12 / 13 / 14). FINAL-SYNTHESIS.md §5 uses an older 11/12/13 numbering for the same three fixes — same scope, different labels. Cross-reference table:

| HANDOFF (this plan) | FINAL-SYNTHESIS §5 | Scope |
|---|---|---|
| Fix 12 | Fix 11 | Re-template old cohort (laura + liane; chris-nevada is Fix 13 per BRIEF PR-3) |
| Fix 13 | Fix 12 | Restore missing scripts (5 clients incl. chris-nevada) |
| Fix 14 | Fix 13 | Delete client-local generate-multipage-report.js (matt + laura + liane) |

---

## 1. Executive Summary

**Scope:** 8 commits.

- **Fix 14** (1 commit, batched) — `git rm` 3 stale client-local `generate-multipage-report.js` copies (matt, laura, liane). Pure delete; smallest blast radius; first.
- **Fix 13** (5 commits, one per client) — Restore template scripts for chris-nevada, calgary-castles, mammoth-lakes, murray-gardner, p3realtync via offline recursive sync mirroring Step 1.5 contract.
- **Fix 12** (2 commits, one per client) — Re-sync drifted scripts in laura-willis + liane-jamason via the same recursive sync.

**Key revisions to the brief's input:**

1. **Fix 12/13 scope EXPANDED from "6 gather scripts" to full recursive `template/scripts/*` sync.** Per-client diff shows 11 drifted files for laura/liane (gathers + crawl-sitemap + populate-audit-data + generate-presentation + generate-spreadsheet) plus lib/ absent and analyze-backlink-quality.js missing. Half-scope would diverge from Step 1.5's runtime sync. Per BRIEF PR-4.
2. **Calgary's `extract-text.js` is an intentional fork** with Calgary-specific community slugs and richer main/article extraction. Plain sync would silently erase. Surfaced as Q1.5; preserved during Fix 13 calgary commit; deferred to Tier 5 for proper upstream-then-replace.
3. **PPC scripts propagation is a non-event.** All clients with PPC files already match template (or get them as [NEW] for chris-nevada). No Tier 5 Fix 15 entanglement.
4. **lib/ propagation safety verified.** 9 require sites; offline sync mirrors Step 1.5's recursive `mkdir -p` semantics.
5. **No prep commits required.** Investigated 8 candidates; all rejected as pre-existing template behavior or non-blocking design choices.

**Order:** Fix 14 → Fix 13 (chris → calgary → mammoth → murray → p3) → Fix 12 (laura → liane). 8 commits total.
*Rationale: pure-delete first (smallest), then create-from-nothing (additive, no disruption), then drift cleanup (most complex).*

---

## 2. Decision Record

### Q1 — Fix 12 per-client diff & cohort granularity

Live `diff -rq` output: laura and liane have **identical sets** of 11 drifted files plus lib/ absent and analyze-backlink-quality.js missing. Drift magnitudes:

| File | laura diff lines | liane diff lines |
|---|---|---|
| crawl-sitemap.js | 86 | 94 |
| gather-backlinks.js | 186 | 11 |
| gather-domain-metrics.js | 61 | 61 |
| gather-keyword-volumes.js | 76 | 76 |
| gather-local-pack.js | 176 | 176 |
| gather-local-seo.js | 150 | 150 |
| gather-organic-metrics.js | 269 | 269 |
| gather-pagespeed.js | 109 | 109 |
| generate-presentation.js | 89 | 89 |
| generate-spreadsheet.js | 35 | 35 |
| populate-audit-data.js | 19 | 19 |
| **Totals** | **~1256** | **~1069** |

**Liane's gather-backlinks.js correction:** HANDOFF §5f mentioned a "208-line fork" — that referred to **matt-wallmow**, not liane. Liane's actual file is 255 lines (matches template structure) with only the Semaphore import removed (11 diff lines). No "intentional logic worth preserving" flag. Sync-and-replace is the correct action.

**Decision: one commit per client (C7 = laura, C8 = liane).** Same set of files but different drift magnitudes per file (laura's gather-backlinks is 186 vs liane's 11 — different fork points). Per-client commits keep audit trail crisp; the cohort exemption (BRIEF hard rule #1) permits but doesn't require batching.

### Q1.5 — Calgary `extract-text.js` (NEW, surfaced during plan synthesis)

Calgary-castles has a 275-line `extract-text.js` fork with **intentional Calgary-specific logic**:
- Calgary-specific community slugs hardcoded
- Richer syllable algorithm (vs template's basic implementation)
- Main/article extraction (vs template's body-wide extraction)

Source: FINAL-SYNTHESIS.md lines 308-313 (live-client remediation §calgary-castles).

A naive recursive `cp template/scripts/. clients/calgary-castles/scripts/` would [UPDATED] this file → community slugs and richer extraction logic gone (recoverable from git, but runtime behavior changes silently on next audit). This is **client logic erased inward** — the inverse of the spill register's concern.

Three options:
- **(a) Preserve calgary's fork — skip extract-text.js in Fix 13 calgary commit.** Tier 4 stays narrow; defer to Tier 5. *Recommended.*
- (b) Sync-and-lose with explicit commit-body note. Honest but loses Calgary-specific behavior.
- (c) Prep-commit to upstream Calgary's improvements (richer syllable algo + main/article extraction) into template, then sync. Best long-term outcome, but Tier 4 expansion. Owner needed.

**Decision: (a) preserve.** Operation: full recursive cp, then `git checkout HEAD -- clients/calgary-castles/scripts/extract-text.js` to restore. Document in commit body. Tier-5 spill register notes the upstream-then-replace work.

### Q2 — PPC scripts propagation entanglement with Tier 5 Fix 15

Live diff confirms: `generate-ppc-presentation.js`, `generate-ppc-spreadsheet.js`, and `parse-google-ads.js` are **not listed as drifted** for calgary, mammoth, murray, p3realtync, laura, or liane. They already match template across the existing fleet. Chris-nevada (empty dir) gets them as [NEW] from the recursive sync.

**Decision: propagate as-is via Fix 13 recursive sync.** Net effect: every client now has PPC scripts. Tier 5 Fix 15 will create the `commands/ppc-audit.md` workflow that consumes them — Tier 4 just ensures consumers exist. **No entanglement.**

### Q3 — Tier 5 Fix 16 entanglement (dual-path Python OR JS decision)

After Tier 4, every client has the JS gather stack. HANDOFF §1e.2 confirmed F#54 dual-classifier is **architectural-not-active** — only the JS path is consumed by the multipage renderer (`generate-multipage-report.js:2230-2260` reads from `seo/research/client-backlinks.json`, the JS classifier's output path; Python `qualitySummary` writer lands in `audit-data.json` which the renderer doesn't consume for that field).

**Decision: document for the record; doesn't block Fix 16.** Tier 4 de-facto-blesses the JS path for backlinks/local/DFS at the *consumer* level, but doesn't add new Python consumers either. Fix 16 retains full freedom to retire the dead Python `qualitySummary` writer or consolidate API call paths.

### Q4 — lib/ propagation safety

Verified via grep: 9 `require('./lib/...')` sites in `template/scripts/*.js`:

```
gather-backlinks.js:38       require('./lib/fetch-with-retry')
gather-domain-metrics.js:24  require('./lib/fetch-with-retry')
gather-local-pack.js:34      require('./lib/fetch-with-retry')
gather-organic-metrics.js:41 require('./lib/fetch-with-retry')
gather-local-seo.js:46       require('./lib/fetch-with-retry')
gather-pagespeed.js:29       require('./lib/fetch-with-retry')
gather-keyword-volumes.js:29 require('./lib/fetch-with-retry')
gather-keyword-volumes.js:30 require('./lib/atomic-write')
populate-audit-data.js:25    require('./lib/atomic-write')
```

Path shape: `./lib/<file>` resolves to `<scripts/>lib/<file>`. Step 1.5's recursive `find ... -type f -print0` + `mkdir -p "$(dirname "$dst")"` creates `lib/` automatically before copying its contents. Offline (b) sync must match.

**Decision: use `cp -R template/scripts/. clients/<c>/scripts/`** (the trailing `/.` includes lib/ subdir + hidden files). Verify post-sync: `ls clients/<c>/scripts/lib/` → expect `atomic-write.js fetch-with-retry.js`.

### Q5 — Tier-boundary spill register

Investigated 8 candidates (full table in §5). All rejected. **Decision: no prep commits.** Carry-forward items from prior tiers' §5f/§5g remain deferred per their original disposition.

### Q6 — Per-commit narrowest-boundary verification gate

Minimum gate per commit:

1. **Diff parity:** `diff -rq template/scripts/ clients/<c>/scripts/` → expect zero deltas (or only documented orphans like calgary's `update-readability.py` and the calgary `extract-text.js` preserved per Q1.5).
2. **Syntax check:** `find clients/<c>/scripts/ -name '*.js' -type f -exec node --check {} \;` → no error output.
3. **lib/ propagation:** `ls clients/<c>/scripts/lib/` → `atomic-write.js fetch-with-retry.js` both present.
4. **Fix 14 only:** `grep -rn "clients/.*/reports/multipage/generate-multipage-report" --include='*.{md,js,py,json}' .` → expect zero callers (already verified pre-flight).

**Not in gate:** `node script.js` execution. No DFS/GBP credentials in this clone; runtime check would fail for non-API-related reasons.

### Q7 — Commit ordering

**Decision: Fix 14 → Fix 13 (per-client) → Fix 12 (per-client).** Justification: Fix 14 is pure delete with smallest blast radius and removes a known footgun before any other work; Fix 13 is additive (mostly creating new dirs, no disruption to working state); Fix 12 is the most complex (drift cleanup) and benefits from any spills surfaced earlier. Within Fix 13, alphabetical-ish (chris first because most pathological — empty dir; then calgary because it has the extract-text edge case; then mammoth/murray/p3 in name order).

### Q8 — Refined commit plan

See §4. 8 commits as enumerated above.

---

## 3. Tier 5 Look-Ahead

| Tier 5 item | Tier 4 effect | How |
|---|---|---|
| Fix 15 — PPC workflow | Neutral | PPC scripts already match template across 4 clients; chris-nevada gets them as [NEW]. Fix 15 still creates `commands/ppc-audit.md`; Tier 4 just ensures consumers exist on every client. |
| Fix 16 — Dual-path decisions | De-facto-blesses JS for backlinks/local/DFS at consumer level | F#54 already architectural-not-active. Fix 16 retains freedom to retire dead Python writers. |
| Spam-classifier calibration | Wider deployment surface | `analyze-backlink-quality.js` lands on all 8 clients (was only liane-manual + matt-synced). Calibration affects more reports; same scope decision, more visible. |
| Calgary `extract-text.js` upstreaming (NEW from Q1.5) | Deferred to Tier 5 / dedicated commit | Tier 4 preserves the fork. Proper handling: upstream the non-Calgary improvements (richer syllable algo + main/article extraction) into template, delete Calgary-specific slugs from fork, then sync calgary. |

---

## 4. Refined Commit Plan

### Pre-flight (run once before commit 1)

```bash
cd /root/site-audit-fix-work
git status                                 # expect clean
git branch --show-current                  # site-audit-fixes-tier-4
git log --oneline -5                       # last is 545f82e (compressed brief)
PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v
# expect 8/8 passing

# Pre-Fix-14 caller check
grep -rn "clients/.*/reports/multipage/generate-multipage-report" --include='*.md' --include='*.js' --include='*.py' --include='*.json' . 2>/dev/null
# expect zero output (no callers)
```

---

### Commit 1 — Fix 14 (batched delete)

**Files removed:**
- `clients/matt-wallmow/reports/multipage/generate-multipage-report.js` (2180 lines, 1102 diff vs template)
- `clients/laura-willis/reports/multipage/generate-multipage-report.js` (1797 lines, 1633 diff)
- `clients/liane-jamason/reports/multipage/generate-multipage-report.js` (1797 lines, byte-identical to laura)

**Operations:**
```bash
git rm "clients/matt-wallmow/reports/multipage/generate-multipage-report.js"
git rm "clients/laura-willis/reports/multipage/generate-multipage-report.js"
git rm "clients/liane-jamason/reports/multipage/generate-multipage-report.js"
```

**Post-verification:**
```bash
for c in matt-wallmow laura-willis liane-jamason; do
  test ! -f "clients/$c/reports/multipage/generate-multipage-report.js" && echo "  $c: deleted OK" || echo "  $c: STILL EXISTS"
done
git status   # expect 3 deletions staged
```

**Commit message:**
```
fix(clients): remove stale client-local generate-multipage-report.js (Fix 14)

Three clients had local copies 30-43% behind template (3173 lines):
- matt-wallmow: 2180 lines (1102 diff)
- laura-willis: 1797 lines (1633 diff)
- liane-jamason: 1797 lines (byte-identical to laura)

The skill at commands/seo-audit.md:1332 invokes
`node ../../template/reports/multipage/generate-multipage-report.js`
(template path), so these copies have no callers — confirmed via
repo-wide grep across *.md, *.js, *.py, *.json. Footgun risk: an
alias / CI / manual invocation could pick up the stale local copy
and produce a 1102+ line normalizer divergence in output.

Step 1.5's auto-sync covers template/scripts/ only; this file lives
at template/reports/multipage/, outside Step 1.5 scope, so the
deletes are explicit. Per F#21 §6 + HANDOFF-POST-TIER-3 §5c.

Verification: zero callers in *.md, *.js, *.py, *.json across the
repo. Git history preserves deleted versions for forensic
comparison if needed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

### Commits 2–6 — Fix 13 (per-client restore)

**Common operation template:**
```bash
# Setup (chris-nevada only — others have scripts/ already)
mkdir -p "clients/<c>/scripts"

# Recursive sync mirroring Step 1.5 contract
# Trailing /. on src ensures lib/ subdir copied; -R is recursive.
cp -R template/scripts/. clients/<c>/scripts/

# Calgary-only — preserve extract-text.js fork (Q1.5)
git checkout HEAD -- clients/calgary-castles/scripts/extract-text.js

# Stage by exact path (never `git add .`)
git add "clients/<c>/scripts"
```

**Per-commit specifics:**

#### Commit 2 — Fix 13 chris-nevada

- Prior state: empty directory (no `scripts/` subdir).
- Operation: `mkdir -p clients/chris-nevada/scripts && cp -R template/scripts/. clients/chris-nevada/scripts/`
- Result: 21 [NEW] files (every template script + lib/atomic-write.js + lib/fetch-with-retry.js).
- Verification: `diff -rq template/scripts/ clients/chris-nevada/scripts/` → empty.
- Commit body lists all 21 files as [NEW].

#### Commit 3 — Fix 13 calgary-castles

- Prior state: 9 scripts; 1 orphan (`update-readability.py`); 1 fork (`extract-text.js` — Q1.5).
- Operation: `cp -R template/scripts/. clients/calgary-castles/scripts/` then `git checkout HEAD -- clients/calgary-castles/scripts/extract-text.js`.
- Result: 11 [NEW] files (8 missing + lib/ pair + analyze-backlink-quality.js); 3 [UPDATED] (crawl-sitemap.js, generate-presentation.js, generate-spreadsheet.js); 1 PRESERVED (extract-text.js); 1 ORPHAN preserved (update-readability.py — Step 1.5 warn-don't-delete).
- Verification: `diff -rq template/scripts/ clients/calgary-castles/scripts/` → expect only `extract-text.js (Files differ)` and `update-readability.py (Only in client)`.
- Commit body lists all ops + Q1.5 rationale.

#### Commit 4 — Fix 13 mammoth-lakes

- Prior state: 9 scripts; no extract-text fork; no orphans.
- Operation: `cp -R template/scripts/. clients/mammoth-lakes/scripts/`.
- Result: 12 [NEW] (all 6 gathers + extract-text + populate-audit-data + analyze-backlink-quality + lib/ pair); 3 [UPDATED] (crawl-sitemap.js, generate-presentation.js, generate-spreadsheet.js).
- Verification: `diff -rq` → empty.

#### Commit 5 — Fix 13 murray-gardner

Same shape as mammoth-lakes.

#### Commit 6 — Fix 13 p3realtync

Same shape as mammoth-lakes.

**Commit message template (Fix 13, calgary version with Q1.5 — others omit the PRESERVED block):**
```
fix(clients): restore + re-sync template scripts for calgary-castles (Fix 13 — calgary-castles)

calgary-castles had 9 scripts; missing all 6 gather-*.js scripts +
extract-text + populate-audit-data + lib/ + analyze-backlink-quality.
Synced via recursive copy of template/scripts/ mirroring Step 1.5
semantics.

[NEW] (11):
  analyze-backlink-quality.js, gather-backlinks.js,
  gather-domain-metrics.js, gather-keyword-volumes.js,
  gather-local-pack.js, gather-local-seo.js,
  gather-organic-metrics.js, gather-pagespeed.js,
  populate-audit-data.js, lib/atomic-write.js,
  lib/fetch-with-retry.js

[UPDATED] (3):
  crawl-sitemap.js (Tier 1.5 fetchXmlRaw),
  generate-presentation.js (Tier 3 Fix 8 + 8a prep),
  generate-spreadsheet.js (Tier 3 Fix 8)

[PRESERVED] — Calgary-specific intentional fork, see TIER-4-PLAN
§Q1.5:
  extract-text.js — 275-line fork with Calgary-specific community
  slugs + richer syllable algo + main/article extraction. Tier 4 is
  bulk re-template, not refactor; upstreaming the non-Calgary
  improvements is deferred to Tier 5 or its own dedicated commit.
  Restored via `git checkout HEAD --` after recursive cp.

[ORPHAN preserved per Step 1.5 warn-don't-delete contract]:
  update-readability.py

Verification:
  diff -rq template/scripts/ clients/calgary-castles/scripts/
    → only extract-text.js (Files differ) + update-readability.py
      (Only in client) — both expected and documented.
  find clients/calgary-castles/scripts/ -name '*.js' -exec node --check {} \;
    → no errors.
  ls clients/calgary-castles/scripts/lib/
    → atomic-write.js fetch-with-retry.js

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

### Commits 7–8 — Fix 12 (per-client drift cleanup)

#### Commit 7 — Fix 12 laura-willis

- Operation: `cp -R template/scripts/. clients/laura-willis/scripts/`
- Result: 3 [NEW] (analyze-backlink-quality.js + lib/ pair); 11 [UPDATED] (full drift list per Q1).
- Drift magnitude pre-sync: ~1256 diff lines.

#### Commit 8 — Fix 12 liane-jamason

- Operation: `cp -R template/scripts/. clients/liane-jamason/scripts/`
- Result: same 3 [NEW] + same 11 [UPDATED] file set as laura.
- Drift magnitude pre-sync: ~1069 diff lines (lower than laura primarily because liane's gather-backlinks.js diverged later).

**Commit message template (Fix 12, laura version):**
```
fix(clients): re-sync drifted scripts for laura-willis (Fix 12 — laura-willis)

laura-willis was on the early-P7 template — 11 scripts drifted
across all Tier 1.5 + 2 + 3 fixes. Lacked lib/ and
analyze-backlink-quality.js. Synced via recursive copy of
template/scripts/ mirroring Step 1.5 semantics.

[NEW] (3):
  analyze-backlink-quality.js, lib/atomic-write.js,
  lib/fetch-with-retry.js

[UPDATED] (11):
  crawl-sitemap.js (Tier 1.5 fetchXmlRaw),
  gather-backlinks.js (Tier 1 Semaphore + 186 diff lines of older
    raw-https removal),
  gather-domain-metrics.js,
  gather-keyword-volumes.js (Tier 2 atomic write),
  gather-local-pack.js (Tier 2 location param),
  gather-local-seo.js (Tier 3 Fix 9 — Chrome UA + full-name match),
  gather-organic-metrics.js (Tier 3 Fix 10),
  gather-pagespeed.js (Tier 1 fetch-with-retry),
  generate-presentation.js (Tier 3 Fix 8 + 8a prep),
  generate-spreadsheet.js (Tier 3 Fix 8),
  populate-audit-data.js (Tier 2 atomic write)

Total drift magnitude before sync: ~1256 diff lines.

Verification:
  diff -rq template/scripts/ clients/laura-willis/scripts/ → empty.
  find clients/laura-willis/scripts/ -name '*.js' -exec node --check {} \;
    → no errors.
  ls clients/laura-willis/scripts/lib/
    → atomic-write.js fetch-with-retry.js

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

## 5. Tier-Boundary Spill Register

**Tier 4 introduces NO prep commits.** Investigated 8 candidates:

| # | Candidate | Why rejected as Tier 4 prep |
|---|---|---|
| 1 | `crawl-sitemap.js` header-listener bug (F#5 #1) | Pre-existing on template; not a Tier 4-introduced propagation. Defer per Tier 1 plan. |
| 2 | `crawl-sitemap.js` word-count bug (F#5 #4) | Same. |
| 3 | `gather-backlinks.js` totalBacklinks reports fetched-count not true total (F#9 #4) | Semantic, not crash. Existing behavior. |
| 4 | `gather-local-pack.js` locationCode default-with-warn (F#12 #1) | `resolveLocationCode` warns on fallback; doesn't crash or silently wrong. |
| 5 | `gather-organic-metrics.js` `organicTrafficTotal` omission on endpoint failure (F#10) | Intentional Tier 3 design (try/catch omits, no null). Operator-side gate documented. |
| 6 | `gather-local-seo.js` anti-bot blocks (Yelp/Realtor/Zillow) | Pre-existing. Transport-layer fix is post-tier (HANDOFF §5f). |
| 7 | `populate-audit-data.js` heading-literal parsing (F#15 #1) | Pre-existing. Old-cohort version is OLDER; sync replaces with current behavior, no regression. |
| 8 | `gather-backlinks.js` `is_dofollow` schema mismatch (F#9 #6) | Pre-existing. Both consumers handle both shapes. |

**Open items inherited from prior tiers (§5a–§5g of HANDOFF-POST-TIER-3, carried forward unchanged):**

- §5a — Reliability sweep: 9 Python connectors bypassing `_request_sync`.
- §5b — Missing test/runtime deps in `pyproject.toml` (networkx, vaderSentiment) → 11 pre-existing pytest failures.
- §5d — Tier 3 operator-side follow-ups: Fix 10 traffic-total gate, Fix 11 SIGKILL stress, end-to-end visual.
- §5f — City→DFS code lookup table; pre-commit hook protecting Step 1.5; transport-layer fetcher; `scripts/_backup/*` cleanup; dead `competitorRank` field; `utils/__init__.py` sibling exports parity.
- §5g — `validateAuditData` exit-1; DR scale normalization; `base.py` rate-limit shared; multi-regex heading fallback; `extract-text.js` default `--limit Infinity`.

**NEW open item from Tier 4 planning:**

- **Calgary `extract-text.js` upstream cleanup (Q1.5):** Currently a 275-line fork with Calgary-specific community slugs + richer main/article extraction + better syllable algo. Tier 4 preserves it. Owner needed: extract the universally-useful improvements (syllable algo, main/article extraction) into template; remove Calgary-specific slugs from the fork (or move them to a config-driven mechanism); then sync calgary's extract-text.js. Bundle with whoever next touches `extract-text.js` (or with Tier 5 Fix 16 if it touches the JS gather stack).

---

## 6. Propagation Matrix

Per-client summary of file ops by commit (post-Tier-4 state):

### matt-wallmow

- **C1:** `[DEL] reports/multipage/generate-multipage-report.js`
- scripts/ unchanged (already in sync with template per Tier 3 commit `218086d`).

### laura-willis (C7) + Fix 14 (C1)

- **C1:** `[DEL] reports/multipage/generate-multipage-report.js`
- **C7:** `[NEW]` analyze-backlink-quality.js, lib/atomic-write.js, lib/fetch-with-retry.js
- **C7:** `[UPD]` crawl-sitemap.js, gather-backlinks.js, gather-domain-metrics.js, gather-keyword-volumes.js, gather-local-pack.js, gather-local-seo.js, gather-organic-metrics.js, gather-pagespeed.js, generate-presentation.js, generate-spreadsheet.js, populate-audit-data.js

### liane-jamason (C8) + Fix 14 (C1)

Same op set as laura.

### chris-nevada (C2)

`mkdir -p scripts/`, then **C2 [NEW]** all 21 files: analyze-backlink-quality.js, browse.js, check-technical.js, crawl-sitemap.js, ddg-search.js, extract-text.js, gather-backlinks.js, gather-domain-metrics.js, gather-keyword-volumes.js, gather-local-pack.js, gather-local-seo.js, gather-organic-metrics.js, gather-pagespeed.js, generate-ppc-presentation.js, generate-ppc-spreadsheet.js, generate-presentation.js, generate-spreadsheet.js, parse-google-ads.js, populate-audit-data.js, lib/atomic-write.js, lib/fetch-with-retry.js.

### calgary-castles (C3)

- **C3 [NEW]** (11): analyze-backlink-quality.js, gather-backlinks.js, gather-domain-metrics.js, gather-keyword-volumes.js, gather-local-pack.js, gather-local-seo.js, gather-organic-metrics.js, gather-pagespeed.js, populate-audit-data.js, lib/atomic-write.js, lib/fetch-with-retry.js
- **C3 [UPD]** (3): crawl-sitemap.js, generate-presentation.js, generate-spreadsheet.js
- **C3 [PRESERVED]**: extract-text.js (Calgary fork — Q1.5)
- **[ORPHAN, no action]**: update-readability.py

### mammoth-lakes (C4)

- **C4 [NEW]** (12): analyze-backlink-quality.js, extract-text.js, gather-backlinks.js, gather-domain-metrics.js, gather-keyword-volumes.js, gather-local-pack.js, gather-local-seo.js, gather-organic-metrics.js, gather-pagespeed.js, populate-audit-data.js, lib/atomic-write.js, lib/fetch-with-retry.js
- **C4 [UPD]** (3): crawl-sitemap.js, generate-presentation.js, generate-spreadsheet.js

### murray-gardner (C5)

Same op set as mammoth-lakes.

### p3realtync (C6)

Same op set as mammoth-lakes.

---

## 7. Pre-flight + Post-flight Checklists

### Pre-flight (before commit 1)

```bash
cd /root/site-audit-fix-work
git status                                                                # expect clean
git branch --show-current                                                 # site-audit-fixes-tier-4
git log --oneline -5                                                      # last is 545f82e
PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v
# expect 8/8 passing

# Pre-Fix-14 caller check
grep -rn "clients/.*/reports/multipage/generate-multipage-report" --include='*.md' --include='*.js' --include='*.py' --include='*.json' . 2>/dev/null
# expect zero output
```

### Post-flight (after commit 8, before push)

```bash
# 1. All synced clients in template parity
for c in laura-willis liane-jamason chris-nevada mammoth-lakes murray-gardner p3realtync; do
  echo "=== $c ==="
  diff -rq template/scripts/ "clients/$c/scripts/" 2>&1 | grep -v '^Only in.*_backup$' || echo "  IN SYNC"
done
# Each block should be empty (all in sync) — no "Files differ" lines.

# 2. Calgary expected exceptions
echo "=== calgary-castles (expect: extract-text.js Files differ + update-readability.py Only in client) ==="
diff -rq template/scripts/ clients/calgary-castles/scripts/

# 3. Fix 14 deletes verified
for c in matt-wallmow laura-willis liane-jamason; do
  test ! -f "clients/$c/reports/multipage/generate-multipage-report.js" \
    && echo "  $c: deleted OK" \
    || echo "  $c: STILL EXISTS"
done

# 4. node --check across every synced .js
find clients/*/scripts/ -name '*.js' -type f -not -path '*_backup*' -exec node --check {} \; 2>&1 | head -20
# expect zero error lines

# 5. lib/ presence
for c in laura-willis liane-jamason chris-nevada calgary-castles mammoth-lakes murray-gardner p3realtync; do
  echo -n "  $c lib/: "
  ls "clients/$c/scripts/lib/" 2>/dev/null | tr '\n' ' '
  echo
done
# each line should show: atomic-write.js fetch-with-retry.js

# 6. Regression suite
PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v
# expect 8/8 passing

# 7. Commit history sanity
git log --oneline -10
# expect 8 new commits since 545f82e (Fix 14, then 5x Fix 13, then 2x Fix 12)

# 8. Push
gh auth setup-git
git push -u origin site-audit-fixes-tier-4
```

---

## 8. Rollback Plan

### Per-commit rollback

| Commit type | Method | Notes |
|---|---|---|
| C1 (Fix 14) | `git revert <C1-sha>` | Restores 3 deleted files. No data loss — git history preserves. |
| C2–C6 (Fix 13) | `git revert <Cn-sha>` per commit, or `git revert C2..C6` for all | Reverts the additions back to original empty/incomplete per-client state. Calgary's preserved `extract-text.js` is unaffected (it was never modified, only intentionally re-checked-out). |
| C7–C8 (Fix 12) | `git revert <Cn-sha>` per commit | Restores prior drift state. Offline (b) didn't create `_backup/` dirs; rollback via git is the only recovery path (and is sufficient). |

### Full Tier 4 rollback

If the branch hasn't been pushed yet (or only locally):

```bash
git reset --hard 545f82e   # back to brief commit, pre-Tier-4
```

If pushed (after step 8 of post-flight):

```bash
git revert 545f82e..HEAD   # 8 commits, in reverse order, as new revert commits
gh auth setup-git
git push origin site-audit-fixes-tier-4
```

**Do not force-push.** The branch is currently exclusive to this clone; preserve discipline.

### Pipeline verification post-rollback

```bash
PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v
# expect 8/8 passing — Tier 4 doesn't touch platform/ tests
```

---

## Done

After commit 8 + push, Tier 4 implementation moves to a fresh session that uses this plan as the spec. Reference client matt-wallmow scripts/ unchanged; Fix 14 is the only Tier-4 op affecting matt's tree. Step 1.5 will produce zero deltas on every client's next live `/seo-audit` run — the architectural guarantee from Tier 1.5 is now end-to-end honored across the fleet.
