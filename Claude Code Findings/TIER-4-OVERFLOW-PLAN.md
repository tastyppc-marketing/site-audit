# Tier 4 Overflow — Implementation Plan (4 bd issues)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the 4 bd issues filed during the Tier 4 wrap (`site-audit-fix-work-{aj1,acf,ar9,0au}`) — items that overflowed the bulk-re-template scope into the Tier 5 spill register but warrant immediate attention before Tier 5's larger architectural work begins.

**Architecture:** New branch `site-audit-fixes-tier-4-followups` forked from `site-audit-fixes-tier-4` at HEAD `f761fea`. Tasks ordered **aj1 → 0au → acf → ar9**: P2 prod-impact bug first, cheap forensic next (derisks later work + may surface new artifacts), 5-commit reliability sweep third, refactor-with-touchy-consumer-paths last. Total estimate: 9-10 commits.

**Tech Stack:** Python (`pyproject.toml` + `platform/src/audit_platform/connectors/`), Node.js (`template/scripts/extract-text.js`), Bash + git for execution. `pytest` for regression. `pip install -e platform/` for dep install.

---

## Status

- **Filed:** 2026-04-29 during Tier 4 Task 9 wrap
- **Planned:** 2026-04-29 (this doc, max-effort revision)
- **Branch base:** `site-audit-fixes-tier-4` at `f761fea` (Tier 4 SHIPPED + wrap docs)
- **Source plan iteration:** `/root/.claude/plans/okay-awesome-can-we-zazzy-hopcroft.md` (Tier 4 historical) was the prior iteration before user requested separate files

## Context — why each issue + what overflow means

The 4 issues were surfaced during Tier 4 execution but explicitly NOT in scope for "bulk re-template + client-local generator deletion." Each is a discrete known issue that the Tier 4 spill register would defer to Tier 5 by default. The user elected to address them as a Tier-4-followup pass before opening Tier 5 because:

- **`aj1` [P2 bug]** — `networkx` + `vaderSentiment` missing from `platform/pyproject.toml`. The analyzers (`internal_linking.py:24-28`, `local_seo.py:23-27`) use try/except-import + degrade silently to empty/zero values when libs are missing. **Active prod-impact risk:** if prod venv is missing these libs, internal-link metrics (density, betweenness, communities, clustering) and review sentiment scores ship as zero in client reports — clients misinterpret as "no data found." Pre-existing 11 pytest failures (`test_internal_linking.py` 4 + `test_local_seo.py` 7) are the dev-side tell. Source: HANDOFF-POST-TIER-3 §5b → HANDOFF-POST-TIER-4 §5a.
- **`0au` [P3]** — Investigate `remotes/origin/v4` for additional abandoned-experiment artifacts beyond the phantom gitlink discovered during Tier 4 C2 (cleaned up in `34f0801`). Read-only forensic; produces findings (and possibly new bd issues) but no code changes. Source: discovered during Tier 4, filed at wrap.
- **`acf` [P3]** — 9 Python connectors bypass `base._request_sync` retry coverage that Tier 2 added (`6cc45a6`). Per Explore: only **5 actually in scope** (`pagespeed`, `crux`, `business_profile`, `brand_mentions`, `social_audit`); the other 4 either use Google SDKs (no httpx) or compose other connectors. Reference impl: `dataforseo._post:80-98` post-Tier-2 (`ef1cd03`). Source: HANDOFF-POST-TIER-3 §5a → HANDOFF-POST-TIER-4 §5a.
- **`ar9` [P3]** — Calgary's `extract-text.js` is a 275-line fork of template's 204-line script. Three universally-useful improvements (richer syllable algo, `<main>`/`<article>` extraction, `getReadabilityLevel` helper) should be upstreamed; Calgary-specific community slugs should be deleted (cosmetic, renderer has a fallback). Then sync calgary to template. Source: TIER-4-PLAN §Q1.5 → HANDOFF-POST-TIER-4 §5a.

User-confirmed decisions (from planning conversation):
- **Order:** aj1 → 0au → acf → ar9 (after a flip discussion that elevated 0au above acf because forensic is cheap and may surface info that affects later work).
- **Branch:** `site-audit-fixes-tier-4-followups`, forked from `site-audit-fixes-tier-4`.
- **Auto-push:** NO — surface to user only per CLAUDE.md TANDEM §3.
- **Effort:** Max — this plan is the max-effort revision incorporating consumer audits and risk mitigation that the standard-effort draft lacked.

## Decision Record

Each major call below is documented with rationale so the executor (or a reviewer) can override before commit-time without re-litigating the planning step.

### D1 — aj1: required deps vs optional extras
**Decision:** Add `networkx>=2.6` + `vaderSentiment>=3.3.2` as required entries in `[project] dependencies = [...]`.

**Rationale:** Both are pure Python (no compile cost), small footprint (~1-2 MB networkx, ~500 KB vaderSentiment + nltk data), and standard tools in their domains. The current silent-degradation behavior corrupts research files without raising any error — clients can ship with zero sentiment scores and zero link-density metrics, which they interpret as "no data" rather than "analysis didn't run." Per CLAUDE.md data-integrity rule: "Research files are source of truth." Silent zeros violate this rule. Optional-extras would require an additional opt-in step in prod and wouldn't fix the silent-failure pattern.

**What we're NOT doing:** Removing the try/except-import guards. Keeping them as defense-in-depth for stripped/embedded venvs that might exist somewhere we don't know about. Removal is a candidate for a future cleanup pass (would be simple: delete the `_FLAG = False` branches and let `ImportError` raise naturally).

### D2 — 0au: scope of forensic
**Decision:** Investigation only. If new artifacts surfaced, file as new bd issues; do NOT clean them up in this overflow plan (would extend scope into "tier-4-overflow-followups," which is exactly the spiral we're trying to avoid).

**Rationale:** The phantom-gitlink discovery was a one-off; the forensic determines whether it's representative of broader v4 hygiene problems or isolated. If isolated, we close 0au with "no further action needed" and move on. If broad, we file each as its own bd issue + plan as part of Tier 5 or its own pass.

### D3 — acf: PageSpeed delay handling
**Decision:** Keep PageSpeed's manual `_request_delay()` logic intact. Only swap the HTTP call line through `_request_sync`.

**Rationale:** PageSpeed has API-key-conditional rate-limit needs (50ms delay with key vs 1.1s without) that don't map cleanly to `base.requests_per_second` (which is a single uniform per-instance rate). Conservative path: add retry coverage without changing pacing. Alternative (override `requests_per_second` in `__init__` based on whether key is set) is a future cleanup.

### D4 — acf: brand_mentions + social_audit safe-wrappers
**Decision:** Refactor `_safe_get` and `_safe_head` to wrap `_request_sync` calls and continue catching exceptions to return None on failure. **Keep** the existing inline 429-retry-once in brand_mentions.

**Rationale:** Caller semantics depend on these wrappers returning None on failure (used for opportunistic checks where missing data is acceptable). Exceptions from `_request_sync` would otherwise propagate. Base intentionally does NOT retry 429 (rate-limit is not transient — re-trying immediately makes throttling worse). brand_mentions' inline single-retry on 429 with backoff is a domain-specific affordance that should survive the refactor.

### D5 — ar9: output shape (revised at max effort)
**Decision:** Upstream **only** the additive logic changes (syllable algo + main/article extraction + `getReadabilityLevel` helper). Do NOT change template's output shape. Calgary's extra fields (`bodyText`, `paragraphCount`, `readabilityLevel`) get dropped on sync — they have no code consumers (verified via repo-wide grep: only present in `Backup/calgary-castles/.../page-text-analysis.json` snapshots and `template/reports/multipage/ARCHITECTURE.md` doc reference).

**Critical correction vs Explore C's recommendation:** `scoreExplanation` IS consumed by code, contrary to Explore C's claim. Verified consumers:
- `template/reports/multipage/generate-multipage-report.js:1432, 1483-1484, 2796` — normalizer reads `scoreExplanation` and has a fallback `buildReadabilityExplanation(pta)` that constructs it from readability metrics when missing
- `template/reports/multipage/pages/content.js:293` — HTML renderer displays it
- `platform/scripts/build_audit.py:692` — Python pipeline emits it
- `AUDIT-SOP.md:26` — SOP requires every page to include it

This means: when Calgary syncs to template (which doesn't emit `scoreExplanation` from extract-text), the renderer's `buildReadabilityExplanation()` fallback kicks in. Calgary's per-page readability explanations will lose the contextual community-slug prefix ("Community/neighbourhood page content") and become generic. **This is acceptable** — the loss is cosmetic, the renderer fallback is the safety net, and the slugs were hardcoded data not extraction logic. But commit messages must be honest about the fallback path, not claim "no consumers."

### D6 — ar9: community slugs deletion vs config-drive
**Decision:** Delete the slugs (per Explore C recommendation, with the corrected understanding from D5).

**Rationale:** Config-driven would be ~30 lines of new infrastructure (template needs to read an optional client config file, apply custom regex if present). Calgary doesn't actually need the contextual strings — the readability scores themselves are unchanged; only the human-readable explanation prefix changes. If Calgary later requests personalized context, build the config-driven mechanism then.

## Risk Register

| # | Task | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | aj1 | `pip install` fails (no network in this clone) | Medium | Blocks aj1 entirely | Pre-flight network check in Task 0; if no network, surface to user |
| R2 | aj1 | vaderSentiment first-import downloads nltk data and is slow | Low | Slow first run; no functional impact | Document expected pause in commit body |
| R3 | aj1 | Adding deps breaks an unknown CI pipeline | Low | CI break elsewhere | No CI files in this repo per Explore A; risk is hypothetical. Surface in commit body. |
| R4 | 0au | v4 branch fetch needed and fails | Low | 0au stalls | Pre-flight `git fetch origin v4` |
| R5 | 0au | Forensic surfaces a CRITICAL artifact (e.g., another phantom gitlink in a different important client dir) | Low | Scope expansion | Plan says: file bd issue, don't clean inline. Stays disciplined. |
| R6 | acf-pagespeed | Routing through `_request_sync` changes effective pacing if `requests_per_second` default conflicts with `_request_delay` logic | Medium | Slower or faster API calls than intended | Keep `_request_delay`; only swap HTTP call. Smoke-test: time a real call before/after. |
| R7 | acf-crux | 404-as-success branch reordered incorrectly, causing 404 to bubble | Medium | Crux missing-data path crashes | Explicit try/except `httpx.HTTPStatusError` with 404 check. Test with mocked 404 response. |
| R8 | acf-brand_mentions | `_safe_get` exception handling becomes too narrow (e.g., misses a class) | Medium | Caller crashes when previously was defensive | Catch the union: `(httpx.HTTPStatusError, httpx.TransportError, httpx.TimeoutException)` — same set the wrapper currently catches |
| R9 | acf-social_audit | Same as R8 | Medium | Same | Same mitigation |
| R10 | ar9-upstream | Smoke test passes on matt but fails on a different client's input (e.g., HTML without `<main>`) | Medium | Regression for some clients | Smoke-test against ≥3 clients (matt + laura + 1 with no main element) |
| R11 | ar9-delete-slugs | Calgary's existing audit-data.json contains `scoreExplanation` strings with community slug prefixes; if we leave Calgary's old run output intact, future renderer runs read the OLD slug-prefixed strings, masking the change | Low | Confusion about "did we ship the change" | Note in commit body: future Calgary audit run will produce slug-free explanations via renderer fallback; existing audit-data.json content is historical |
| R12 | ar9-sync | Calgary's `update-readability.py` orphan still expected after sync; `diff -rq` should show only that one line, not extract-text.js anymore | Low | Confused executor | Explicit expected-output assertion in 4c-4 |
| R13 | All | Working tree dirty (`.claude/settings.local.json`) accidentally staged | Medium | Bad commit content | Explicit `git status --short` check after every `git add`; "stage by exact path" discipline |
| R14 | All | `bd close` runs before commit succeeds, leaving status inconsistent | Low | bd state out of sync with git | Order: commit → verify → bd close (never bd close → commit) |

## File structure

**aj1 (1 commit, branch `site-audit-fixes-tier-4-followups`):**
- Modify: `platform/pyproject.toml` (add 2 deps)
- Verify (read): `platform/tests/test_internal_linking.py` (4 tests should now pass), `platform/tests/test_local_seo.py` (7 tests should now pass)
- Verify (read): `platform/src/audit_platform/analyzers/{internal_linking.py,local_seo.py}` (try/except-import guards remain in place per D1)

**0au (0-1 commits or no commits, depends on findings):**
- Read-only: `git fetch origin v4` then `git ls-tree -r origin/v4`, `git diff --stat site-audit-fixes-tier-4...origin/v4`, etc.
- Conditionally: file new bd issues (no code commits unless cleanup explicitly authorized)

**acf (5 commits, one per in-scope connector):**
- Modify: `platform/src/audit_platform/connectors/pagespeed.py:186-187`
- Modify: `platform/src/audit_platform/connectors/crux.py:89-99` (+ preserve 404 handling)
- Modify: `platform/src/audit_platform/connectors/business_profile.py:125-126,131-132`
- Modify: `platform/src/audit_platform/connectors/brand_mentions.py:74,84` + `_safe_get` refactor
- Modify: `platform/src/audit_platform/connectors/social_audit.py:101,120` + `_safe_head`/`_safe_get` refactor
- Reference (read): `platform/src/audit_platform/connectors/base.py:110-132`, `platform/src/audit_platform/connectors/dataforseo.py:80-98`, `platform/tests/test_connectors_base.py`

**ar9 (3 commits):**
- Modify: `template/scripts/extract-text.js` (upstream syllable algo + main/article + helper)
- Modify: `clients/calgary-castles/scripts/extract-text.js` (delete community slugs)
- Sync: `cp template/scripts/extract-text.js clients/calgary-castles/scripts/extract-text.js`
- Reference (read): `template/reports/multipage/generate-multipage-report.js:1432,1483-1484,2796`, `template/reports/multipage/pages/content.js:293`, `platform/scripts/build_audit.py:692`, `AUDIT-SOP.md:26`

---

### Task 0: Pre-flight + new branch

**Files:** none (read-only checks + branch fork)

- [ ] **Step 1: Verify clean state, HEAD, branch**

```bash
cd /root/site-audit-fix-work
git rev-parse HEAD
```
Expected: `f761feab5315cc9904d10f456686ddb43585253d`

```bash
git branch --show-current
```
Expected: `site-audit-fixes-tier-4`

```bash
git status --short
```
Expected: only ` M .claude/settings.local.json` (accepted noise; never staged this session).

- [ ] **Step 2: Run regression baseline (full pre-fix state, including the 11 expected failures)**

```bash
PYTHONPATH=platform/src pytest platform/tests/ -v --tb=no 2>&1 | tail -25
```
Expected: `8 passed`, `11 failed`. Memorize the exact failing test names — they map to aj1's expected-to-pass set:
- `test_internal_linking.py::test_extended_metrics_returns_dict`
- `test_internal_linking.py::test_betweenness_bridge_detection`
- `test_internal_linking.py::test_community_detection`
- `test_internal_linking.py::test_graph_density`
- `test_local_seo.py::test_sentiment_positive_reviews`
- `test_local_seo.py::test_sentiment_negative_reviews`
- `test_local_seo.py::test_sentiment_mean_compound`
- `test_local_seo.py::test_sentiment_reply_rate`
- `test_local_seo.py::test_sentiment_total_reviews`
- `test_local_seo.py::test_sentiment_keyword_extraction`
- `test_local_seo.py::test_sentiment_short_reviews_use_rating`

If the count or names diverge significantly, ABORT and re-baseline.

- [ ] **Step 3: Pip install network probe (R1 mitigation)**

```bash
pip install --dry-run networkx vaderSentiment 2>&1 | tail -10
```
Expected: pip resolves both packages without network errors (output shows "Would install ..."). If "Could not fetch" / "No matching distribution" / network errors appear, surface to user before proceeding to aj1.

- [ ] **Step 4: Fetch v4 branch (R4 mitigation)**

```bash
git fetch origin v4 2>&1 | tail -5
git rev-parse origin/v4
```
Expected: fetch succeeds (or is no-op if already up to date); `git rev-parse` returns a SHA. Memorize for 0au use.

- [ ] **Step 5: Fork the followups branch**

```bash
git checkout -b site-audit-fixes-tier-4-followups
git branch --show-current
```
Expected: `site-audit-fixes-tier-4-followups`.

- [ ] **Step 6: Confirm bd ready issues**

```bash
bd ready
```
Expected: 4 issues listed (aj1, 0au, acf, ar9). All status `open`, none claimed.

---

### Task 1: aj1 — add networkx + vaderSentiment to pyproject.toml

**Files:**
- Modify: `platform/pyproject.toml` (lines 10-22, the `dependencies = [...]` block)

**Reference (read-only):**
- `platform/src/audit_platform/analyzers/internal_linking.py:24-28` (try/except-import for networkx)
- `platform/src/audit_platform/analyzers/local_seo.py:23-27` (try/except-import for vaderSentiment)

- [ ] **Step 1: Update bd status**

```bash
bd update site-audit-fix-work-aj1 --claim
```

- [ ] **Step 2: Read current pyproject.toml dependency block**

```bash
sed -n '10,22p' platform/pyproject.toml
```
Confirm shape:
```toml
dependencies = [
    "pydantic>=2.0",
    ...
    "structlog>=23.0",
]
```

- [ ] **Step 3: Add networkx + vaderSentiment to dependencies**

Use Edit tool. Insert two lines BEFORE the closing `]` of the `dependencies` block. Place them after `"structlog>=23.0",`. Match the existing 4-space indent style:

```toml
    "networkx>=2.6",
    "vaderSentiment>=3.3.2",
```

The full updated block should be 14 entries instead of 12.

- [ ] **Step 4: Install the new deps**

```bash
pip install -e platform/ 2>&1 | tail -15
```
Expected: Successfully installs networkx + vaderSentiment + their transitive deps. The vaderSentiment install MAY pull a small nltk dataset on first import (R2) — that happens lazily at import time, not pip install. Note any warnings.

- [ ] **Step 5: Smoke-test imports work end-to-end**

```bash
PYTHONPATH=platform/src python3 -c "
from audit_platform.analyzers.internal_linking import InternalLinkAnalyzer, _NETWORKX_AVAILABLE
print(f'networkx_available: {_NETWORKX_AVAILABLE}')
import networkx; print(f'networkx version: {networkx.__version__}')
"
```
Expected: `networkx_available: True` + version string.

```bash
PYTHONPATH=platform/src python3 -c "
from audit_platform.analyzers.local_seo import LocalSEOAnalyzer, HAS_VADER
print(f'vader_available: {HAS_VADER}')
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
analyzer = SentimentIntensityAnalyzer()
print(f'vader sentiment compound for \"great\": {analyzer.polarity_scores(\"great\")[\"compound\"]}')
"
```
Expected: `vader_available: True` + a positive compound score for "great" (~0.6249). If first invocation downloads nltk data and is slow, that's expected per R2.

- [ ] **Step 6: Re-run the previously-failing tests**

```bash
PYTHONPATH=platform/src pytest platform/tests/test_internal_linking.py platform/tests/test_local_seo.py -v 2>&1 | tail -45
```
Expected: All 11 previously-failing tests now PASS:
- 4 internal_linking: `test_extended_metrics_returns_dict`, `test_betweenness_bridge_detection`, `test_community_detection`, `test_graph_density`
- 7 local_seo: `test_sentiment_positive_reviews`, `test_sentiment_negative_reviews`, `test_sentiment_mean_compound`, `test_sentiment_reply_rate`, `test_sentiment_total_reviews`, `test_sentiment_keyword_extraction`, `test_sentiment_short_reviews_use_rating`

If any still fail, ABORT — investigate root cause (version mismatch? import path issue? test fixture problem?).

- [ ] **Step 7: Confirm no regression in the 8 previously-passing tests**

```bash
PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v 2>&1 | tail -10
```
Expected: 8 passed (matches Task 0 baseline).

- [ ] **Step 8: Full suite sanity (now expected to be all-green)**

```bash
PYTHONPATH=platform/src pytest platform/tests/ -v --tb=line 2>&1 | tail -10
```
Expected: 19 passed total (8 prior + 11 newly-passing). Zero failures. Memorize the count for the post-flight Task 5 check.

- [ ] **Step 9: Stage by exact path and commit**

```bash
git add platform/pyproject.toml
git status --short
```
Expected: 1 `M ` line for pyproject.toml + ` M .claude/settings.local.json` (UNSTAGED). The ` M` for settings.local.json must remain unstaged.

```bash
git commit -m "$(cat <<'EOF'
fix(platform): add networkx + vaderSentiment as required dependencies (aj1)

These libs were used via try/except-import in two analyzers but
missing from platform/pyproject.toml. When prod venv lacks them,
the analyzers silently degrade to empty/zero values:

  analyzers/internal_linking.py:24-28
    → networkx missing → compute_extended_metrics() returns {}
    → density, betweenness, communities, clustering coeff = 0/empty
    → reports show graph metrics as zero

  analyzers/local_seo.py:23-27
    → vaderSentiment missing → analyze_review_sentiment() returns
    _empty_sentiment_summary() (zero polarity, empty keyword list)
    → reports show review sentiment as zero

Per CLAUDE.md data-integrity rule ("Research files are source of
truth"): silent zeros corrupt research files and propagate into
client reports. Both libs are pure Python, small install
footprint, standard tools in their domains — required deps, not
optional extras (per D1 in TIER-4-OVERFLOW-PLAN.md).

Verification:
  Pre-fix:  11 pytest failures (4 in test_internal_linking.py +
            7 in test_local_seo.py) per HANDOFF-POST-TIER-3 §5b.
  Post-fix: 19 passed (11 newly-passing + 8 prior baseline);
            networkx + vaderSentiment importable + functional;
            VADER returns positive compound score for "great".

The try/except-import guards in both analyzers are LEFT IN PLACE
as defense-in-depth (works if someone runs in a stripped venv).
Removal of the guards is a candidate for a future cleanup pass.

Source: bd site-audit-fix-work-aj1 + HANDOFF-POST-TIER-4 §5a.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 10: Verify commit landed + close bd**

```bash
git log --oneline -1
git status --short
bd close site-audit-fix-work-aj1
```
Expected: commit subject ends with `(aj1)`; bd marks issue closed.

---

### Task 2: 0au — v4 branch forensic investigation

**Files:** none expected (read-only); 0-N bd commits if findings warrant.

- [ ] **Step 1: Update bd status**

```bash
bd update site-audit-fix-work-0au --claim
```

- [ ] **Step 2: Identify all phantom gitlinks (160000 mode entries) on v4**

```bash
git ls-tree -r origin/v4 | awk '$1 == "160000" {print}'
```
Expected output: 1 line for `clients/chris-nevada` (the one we already cleaned up). If MORE lines appear, document each — these are NEW findings.

- [ ] **Step 3: For each gitlink found, check if its target commit exists locally**

```bash
git ls-tree -r origin/v4 | awk '$1 == "160000" {print $3, $4}' | while read sha path; do
  echo "=== $path → $sha ==="
  git cat-file -t "$sha" 2>&1 || echo "  (commit not in local db — phantom)"
done
```
Expected: chris-nevada's `8832cc2c...` shows "Not a valid object name" (already known). Any other gitlink with the same status is a NEW phantom.

- [ ] **Step 4: Find files modified on v4 vs current branch base**

```bash
git diff --stat site-audit-fixes-tier-4...origin/v4 2>&1 | tail -40
```
This shows what v4 added/changed beyond Tier 4. Look for:
- Anything in `template/scripts/` or `template/reports/` (would propagate to clients via Step 1.5 if v4 were merged)
- Anything in `platform/src/` (would affect production)
- Anything in `commands/seo-audit.md` (skill changes)
- Anything in `.gitignore`, `package.json`, `pyproject.toml` (infra)

- [ ] **Step 5: Check for `.gitmodules` or other submodule infra on v4**

```bash
git show origin/v4:.gitmodules 2>&1 | head -10
git ls-tree origin/v4 | grep -iE 'gitmodul|submodule' || echo "(no submodule config files)"
```
Expected: "fatal: path '.gitmodules' does not exist" + "(no submodule config files)" — confirms the phantom gitlink wasn't backed by any config (consistent with Tier 4 finding).

- [ ] **Step 6: Look for experimental files unique to v4**

```bash
git diff site-audit-fixes-tier-4...origin/v4 --name-only --diff-filter=A 2>&1 | head -30
```
Files only on v4 (added there, not in our branch). Skim for in-progress experimental work patterns: `*.collab*`, `*-experimental*`, `*-wip*`, `*-temp*`, `*scratch*`, `*test*` outside `tests/` dirs.

- [ ] **Step 7: Check v4's commit history for context on intent**

```bash
git log --oneline site-audit-fixes-tier-4..origin/v4 2>&1 | head -30
```
Skim subjects for: feature flags, abandoned experiments, broken-state commits, unfinished refactors. Cite anything ominous.

- [ ] **Step 8: Compile findings and decide on follow-up**

| Outcome | Action |
|---|---|
| ZERO new artifacts (only the known chris-nevada gitlink) | No new bd issues. Skip Step 9. Close 0au with reason note (Step 10). |
| 1-3 new significant artifacts | File one bd issue per artifact (Step 9). Close 0au summarizing findings. |
| 4+ new artifacts OR something CRITICAL (data corruption risk, security, etc.) | File bd issues. Close 0au. **Surface to user as a heads-up before proceeding to acf** — they may want to reorder or pause. |

- [ ] **Step 9: (Conditional) File new bd issues for findings**

```bash
# Template — adapt per finding
bd create --title="<concise title>" \
  --description="Discovered during 0au v4 branch forensic investigation. <Description of artifact + provenance + recommended action>. Source: bd site-audit-fix-work-0au." \
  --type=task --priority=3
```

- [ ] **Step 10: Close 0au with summary**

```bash
bd close site-audit-fix-work-0au --reason="v4 forensic complete. Findings: <0 new artifacts beyond the known chris-nevada gitlink (already cleaned up in tier-4 commit 34f0801) | N new bd issues filed: <ids>>."
```

---

### Task 3: acf — connector retry sweep (5 commits, one per connector)

**Reference (read once at start, before any subtask):**
- `platform/src/audit_platform/connectors/base.py:110-132` (`_request_sync` impl post-Tier-2). Notable: retries on 5xx + `httpx.TransportError` + `httpx.TimeoutException`; does NOT retry 4xx including 429; built-in `_rate_limit_sync()` enforces `requests_per_second` (default 10.0).
- `platform/src/audit_platform/connectors/dataforseo.py:80-98` (reference: `_post` routed through `_request_sync` per `ef1cd03`). Pattern: `resp = self._request_sync("POST", url, json=payload, auth=self._auth)` — auth/headers/json/params flow through as kwargs; no explicit `raise_for_status()`.
- `platform/tests/test_connectors_base.py` (existing 6 tests — all should remain passing throughout).

The pattern to apply, per connector:
- Replace `self.sync_client.<verb>(url, ...)` + `response.raise_for_status()` with `resp = self._request_sync("<VERB>", url, ...)`.
- Drop the manual `raise_for_status()` (base does it).
- Auth/headers/json/params flow through as kwargs.
- Return `resp.json()` or `resp` matching existing call shape.

- [ ] **Step 1: Update bd status**

```bash
bd update site-audit-fix-work-acf --claim
```

#### Subtask 3a: pagespeed.py (easy first — builds confidence)

**Files:** Modify `platform/src/audit_platform/connectors/pagespeed.py:186-187`.

- [ ] **3a-1: Read current implementation**

```bash
sed -n '175,200p' platform/src/audit_platform/connectors/pagespeed.py
```
Confirm the lines: `response = self.sync_client.get(_PSI_ENDPOINT, params=params)` followed by `response.raise_for_status()`.

- [ ] **3a-2: Edit — swap HTTP call line, drop raise_for_status (D3)**

Before:
```python
response = self.sync_client.get(_PSI_ENDPOINT, params=params)
response.raise_for_status()
```
After:
```python
response = self._request_sync("GET", _PSI_ENDPOINT, params=params)
```

**Do not touch** the `_request_delay()` invocation that wraps this call — preserves PageSpeed's API-key-conditional pacing (D3).

- [ ] **3a-3: Tests + commit**

```bash
PYTHONPATH=platform/src pytest platform/tests/test_connectors_base.py -v 2>&1 | tail -10
```
Expected: 8 passed (no regression).

```bash
git add platform/src/audit_platform/connectors/pagespeed.py
git status --short
```
Expected: 1 `M ` for pagespeed.py + ` M .claude/settings.local.json` (UNSTAGED).

```bash
git commit -m "$(cat <<'EOF'
fix(pagespeed): route GET through _request_sync for retry coverage (acf 1/5)

Replaces direct self.sync_client.get() + raise_for_status() with
self._request_sync("GET", ...). Gains transparent retry on:
  - HTTP 5xx (3 attempts, exponential backoff 1-30s)
  - httpx.TransportError + TimeoutException

Mirrors the DataForSEO _post pattern (Tier 2, ef1cd03).

PageSpeed's manual _request_delay() logic is preserved (D3 in
TIER-4-OVERFLOW-PLAN.md). PageSpeed has API-key-conditional
rate-limit needs (50ms with key vs 1.1s without) that don't map
cleanly to base's uniform requests_per_second. Future cleanup
candidate: override requests_per_second in __init__.

Verification:
  test_connectors_base.py → 8 passed (no regression).

Source: bd site-audit-fix-work-acf + HANDOFF-POST-TIER-4 §5a.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

#### Subtask 3b: business_profile.py (easy second — uniform pattern, OAuth flow-through)

**Files:** Modify `platform/src/audit_platform/connectors/business_profile.py:125-126,131-132`.

- [ ] **3b-1: Read current**

```bash
sed -n '115,140p' platform/src/audit_platform/connectors/business_profile.py
```
Confirm two call sites: GET (lines 125-126) and POST (lines 131-132), each followed by `raise_for_status()`.

- [ ] **3b-2: Edit both call sites**

GET site → `self._request_sync("GET", url, headers=self._get_auth_headers(), params=...)`
POST site → `self._request_sync("POST", url, headers=self._get_auth_headers(), json=...)`
Drop both `.raise_for_status()` lines.

OAuth Bearer headers from `_get_auth_headers()` flow through as kwargs.

- [ ] **3b-3: Tests + commit**

```bash
PYTHONPATH=platform/src pytest platform/tests/test_connectors_base.py -v 2>&1 | tail -5
git add platform/src/audit_platform/connectors/business_profile.py
git status --short
git commit -m "$(cat <<'EOF'
fix(business_profile): route OAuth GET/POST through _request_sync (acf 2/5)

Both call sites (GET + POST helper methods) now flow through
self._request_sync(...). OAuth Bearer headers from
_get_auth_headers() pass as kwargs. Gains 5xx + transport-error
retry coverage (no 4xx retry — OAuth 401 still raises immediately
per base contract).

Verification:
  test_connectors_base.py → 8 passed (no regression).

Source: bd site-audit-fix-work-acf + HANDOFF-POST-TIER-4 §5a.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

#### Subtask 3c: crux.py (preserves 404-as-no-data)

**Files:** Modify `platform/src/audit_platform/connectors/crux.py:89-99`.

- [ ] **3c-1: Read current**

```bash
sed -n '80,110p' platform/src/audit_platform/connectors/crux.py
```
Confirm: post + 404 short-circuit + `raise_for_status()` for non-404.

- [ ] **3c-2: Edit — preserve 404-as-no-data semantic via try/except (R7 mitigation)**

Pattern:
```python
import httpx  # ensure imported at top of file

try:
    response = self._request_sync("POST", url, json=body, headers={"Content-Type": "application/json"})
except httpx.HTTPStatusError as exc:
    if exc.response.status_code == 404:
        return None
    raise
```

The base's `raise_for_status()` raises `httpx.HTTPStatusError` for any 4xx including 404. We catch and branch on 404 → return None; everything else re-raises (which after _request_sync's retry exhaustion means the 5xx/transport errors have been retried already).

- [ ] **3c-3: Tests + commit**

```bash
PYTHONPATH=platform/src pytest platform/tests/test_connectors_base.py -v 2>&1 | tail -5
git add platform/src/audit_platform/connectors/crux.py
git status --short
git commit -m "$(cat <<'EOF'
fix(crux): route POST through _request_sync, preserve 404 (acf 3/5)

Replaces direct self.sync_client.post() with self._request_sync(...).
Gains 5xx + transport-error retry coverage.

Preserves the 404-as-no-data branch by catching httpx.HTTPStatusError
after the routed call and returning None on 404; other 4xx status
errors re-raise (5xx/transport were retried by base before bubbling).

Verification:
  test_connectors_base.py → 8 passed (no regression).

Source: bd site-audit-fix-work-acf + HANDOFF-POST-TIER-4 §5a.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

#### Subtask 3d: brand_mentions.py (refactor `_safe_get` wrapper)

**Files:** Modify `platform/src/audit_platform/connectors/brand_mentions.py:74,84` + refactor `_safe_get`.

- [ ] **3d-1: Read current `_safe_get` end-to-end**

```bash
sed -n '60,95p' platform/src/audit_platform/connectors/brand_mentions.py
```
Confirm: `_safe_get` does an HTTP GET, has inline 429 retry-once with sleep, catches HTTPStatusError/TransportError/TimeoutException, returns None on any failure.

- [ ] **3d-2: Refactor — preserve None-on-failure + 429 retry (D4 + R8 mitigation)**

```python
def _safe_get(self, url, headers=None, params=None):
    merged_headers = {**self._default_headers, **(headers or {})}
    try:
        response = self._request_sync("GET", url, headers=merged_headers, params=params)
        return response  # match existing return shape — verify whether callers expect Response or .json()
    except httpx.HTTPStatusError as exc:
        # Preserve inline 429 retry-once: base intentionally does not retry 429
        # (rate-limit is not transient; immediate retry worsens throttling)
        if exc.response.status_code == 429:
            time.sleep(self._429_backoff_seconds)  # match existing backoff value
            try:
                response = self._request_sync("GET", url, headers=merged_headers, params=params)
                return response
            except (httpx.HTTPStatusError, httpx.TransportError, httpx.TimeoutException):
                return None
        return None
    except (httpx.TransportError, httpx.TimeoutException):
        return None
```

Adjust the exact return shape to match existing callers (raw Response vs `.json()` vs body). The exception union must match what current `_safe_get` catches.

- [ ] **3d-3: Tests + commit**

```bash
PYTHONPATH=platform/src pytest platform/tests/test_connectors_base.py -v 2>&1 | tail -5
git add platform/src/audit_platform/connectors/brand_mentions.py
git status --short
git commit -m "$(cat <<'EOF'
fix(brand_mentions): route _safe_get through _request_sync, preserve 429 retry (acf 4/5)

_safe_get now wraps self._request_sync("GET", ...) instead of
calling self.sync_client.get() directly. Preserves the
return-None-on-failure semantic by catching httpx exceptions
that bubble from _request_sync.

Gains 5xx + transport-error retry coverage from base. The
inline single-retry on 429 is preserved (D4 in
TIER-4-OVERFLOW-PLAN.md): base intentionally does NOT retry
429 (rate-limit is not transient — immediate retry makes
throttling worse), and brand_mentions' opportunistic check
pattern benefits from one extra attempt with backoff.

Verification:
  test_connectors_base.py → 8 passed (no regression).

Source: bd site-audit-fix-work-acf + HANDOFF-POST-TIER-4 §5a.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

#### Subtask 3e: social_audit.py (refactor `_safe_head` + `_safe_get`)

**Files:** Modify `platform/src/audit_platform/connectors/social_audit.py:101,120` + refactor `_safe_head`/`_safe_get`.

Same shape as 3d but with two methods (HEAD + GET). No 429-specific affordance unless current code has one.

- [ ] **3e-1: Read current**

```bash
sed -n '90,135p' platform/src/audit_platform/connectors/social_audit.py
```

- [ ] **3e-2: Refactor both safe wrappers**

```python
def _safe_head(self, url, headers=None):
    try:
        response = self._request_sync("HEAD", url, headers=headers)
        return response
    except (httpx.HTTPStatusError, httpx.TransportError, httpx.TimeoutException):
        return None

def _safe_get(self, url, headers=None):
    try:
        response = self._request_sync("GET", url, headers=headers)
        return response
    except (httpx.HTTPStatusError, httpx.TransportError, httpx.TimeoutException):
        return None
```

If existing code has 429-specific handling here (mirror of brand_mentions pattern), preserve it the same way.

- [ ] **3e-3: Tests + commit + close bd**

```bash
PYTHONPATH=platform/src pytest platform/tests/test_connectors_base.py -v 2>&1 | tail -5
git add platform/src/audit_platform/connectors/social_audit.py
git status --short
git commit -m "$(cat <<'EOF'
fix(social_audit): route _safe_head/_safe_get through _request_sync (acf 5/5)

Both safe wrappers (_safe_head + _safe_get) now route through
self._request_sync(...). Preserves return-None-on-failure
semantic. Gains 5xx + transport-error retry coverage.

Closes acf: 5 in-scope connectors (pagespeed, crux,
business_profile, brand_mentions, social_audit) now have retry
coverage. Out of scope (confirmed via Explore): search_console,
ga4, google_ads (use Google's proprietary SDKs, not httpx);
local_seo (composes others; gains coverage transitively
through brand_mentions and dataforseo).

Verification:
  test_connectors_base.py → 8 passed (no regression).
  Full suite (post-aj1): 19 passed.

Source: bd site-audit-fix-work-acf + HANDOFF-POST-TIER-4 §5a.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
bd close site-audit-fix-work-acf
```

---

### Task 4: ar9 — Calgary extract-text.js upstream-then-replace (3 commits)

**Reference (read once before subtask 4a):**
- `template/scripts/extract-text.js` (~204 lines, current template)
- `clients/calgary-castles/scripts/extract-text.js` (~275 lines, sha256 `b2e89f0f5e097af1758f3d41b199520a81b56c3aa05696cbeb78502484cdc291` per pre-Tier-4 capture)
- Per Explore C: 5 universally-useful hunks (A1-A5), 1 Calgary-specific hunk (community slugs), 4 cosmetic, 3 ambiguous.
- **Consumer audit (verified at planning time, more thorough than Explore C):**
  - `template/reports/multipage/generate-multipage-report.js` reads `pages[].url, wordCount, sentenceCount, syllableCount, fleschReadingEase, fleschKincaidGrade, avgSentenceLength, avgSyllablesPerWord` from `page-text-analysis.json`.
  - **`scoreExplanation` IS consumed** at `:1432, 1483-1484, 2796` with a `buildReadabilityExplanation(pta)` fallback that constructs it from readability metrics when missing (D5 correction). Calgary's removal of slug context → renderer fallback produces generic strings; loss is cosmetic.
  - **`bodyText`, `paragraphCount`, `readabilityLevel`** are NOT consumed by code (only in `Backup/calgary-castles/.../page-text-analysis.json` snapshots and `template/reports/multipage/ARCHITECTURE.md` doc reference). Safe to drop on Calgary sync.
- `template/reports/multipage/pages/content.js:293` displays `scoreExplanation`.
- `platform/scripts/build_audit.py:692` writes `scoreExplanation` from Python pipeline (independent code path).
- `AUDIT-SOP.md:26` requires `scoreExplanation` for every page.

Strategy per D5 + D6: upstream additive logic only (not output-shape changes); delete Calgary's UI-only community slugs (renderer fallback handles missing slug context); sync.

- [ ] **Step 1: Update bd status**

```bash
bd update site-audit-fix-work-ar9 --claim
```

#### Subtask 4a: Upstream universally-useful improvements to template

**Files:** Modify `template/scripts/extract-text.js`.

- [ ] **4a-1: Capture both files for diff context**

```bash
wc -l template/scripts/extract-text.js clients/calgary-castles/scripts/extract-text.js
diff -u template/scripts/extract-text.js clients/calgary-castles/scripts/extract-text.js > /tmp/calgary-vs-template.diff
wc -l /tmp/calgary-vs-template.diff
echo "--- Top 50 lines of diff: ---"
head -50 /tmp/calgary-vs-template.diff
```

- [ ] **4a-2: Apply 3 hunks to template via Edit tool**

**Hunk A1 — replace `countSyllables` function** (template lines ~30-39 → Calgary's lines 17-24):

```javascript
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}
```
Justification: more accurate English syllabication (handles "classes" = 1 not 2; "educated" suffix-stripping; leading-y treated as consonant).

**Hunk A2 — replace text-extraction body** (template lines ~133-144 → Calgary's lines 143-191):
- Add 22-selector boilerplate stripping (broader than template's 8 — covers menu/nav/footer/sidebar/widget by class+id with case variants).
- Try `<main>` → `<article>` → aggregated `<section>`s → fallback to body.

The exact code goes here (transcribe from Calgary's extract-text.js Lines 143-191 verbatim, using the file content at planning time as reference; the executor reads the current calgary file and copies the function body).

**Hunk A3 — add `getReadabilityLevel(score)` helper** (Calgary lines ~27-35):

```javascript
function getReadabilityLevel(score) {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}
```
(Adjust labels to match Calgary's exact strings — read calgary's file at execution time.)

Place near `countSyllables` for cohesion. Even though template's output shape doesn't yet emit `readabilityLevel`, the helper is useful utility code reusable elsewhere.

**Do NOT upstream:**
- Output-shape additions (`bodyText`, `paragraphCount`, `readabilityLevel` field in output, custom `scoreExplanation` content) — keeps template's output stable for the multipage normalizer consumer.
- Calgary's `buildExplanation` + community slugs — Calgary-specific (deleted in 4b).
- Cosmetic-only diffs (logging format, `'use strict'` removal).

- [ ] **4a-3: node --check on template**

```bash
node --check template/scripts/extract-text.js
```
Expected: no error.

- [ ] **4a-4: Smoke test against ≥3 client inputs (R10 mitigation)**

```bash
for c in matt-wallmow laura-willis liane-jamason; do
  echo "=== $c ==="
  if [ -f "clients/$c/seo/research/crawl-data.json" ]; then
    cd "clients/$c"
    node ../../template/scripts/extract-text.js --input seo/research/crawl-data.json --limit 3 > "/tmp/${c}-extract-test.json" 2>&1
    echo "exit=$?"
    if [ -s "/tmp/${c}-extract-test.json" ]; then
      echo "Output size: $(wc -l < /tmp/${c}-extract-test.json) lines"
      jq -r '.pages[0] | keys | .[]' "/tmp/${c}-extract-test.json" 2>&1 | head -10 || echo "(JSON parse failed)"
    fi
    cd /root/site-audit-fix-work
  else
    echo "  no crawl-data.json — skipping"
  fi
done
```
Expected: exit 0 for each client with crawl-data.json; output JSON contains all 8 consumer-required keys (`url`, `wordCount`, `sentenceCount`, `syllableCount`, `fleschReadingEase`, `fleschKincaidGrade`, `avgSentenceLength`, `avgSyllablesPerWord`).

If any client fails, ABORT and investigate before committing. Common failure modes:
- HTML without `<main>`/`<article>`/`<section>` — fallback should kick in (verify by reading the function output)
- HTML with deeply nested boilerplate — verify the 22-selector list catches it
- Empty pages — verify graceful handling (returns 0/null vs crash)

- [ ] **4a-5: Stage + commit**

```bash
git add template/scripts/extract-text.js
git status --short
git commit -m "$(cat <<'EOF'
fix(extract-text): upstream calgary syllable algo + main/article extraction (ar9 1/3)

Backports three universally-useful improvements from
clients/calgary-castles/scripts/extract-text.js (preserved as a
fork through Tier 4 sync via sha256 guard) into the canonical
template script.

Upstreamed:
  1. countSyllables — regex-driven suffix stripping (-es/-ed/-e)
     + leading-y exclusion + vowel-group counting. More accurate
     English syllabication (e.g., "classes" = 1 not 2; "educated"
     handled correctly). 7 lines vs prior 5.

  2. Text extraction — prefer <main> → <article> → aggregated
     <section>s before falling back to body. Broader boilerplate
     stripping (22 CSS selectors covering menu/nav/footer/sidebar/
     widget by class+id with case variants).

  3. getReadabilityLevel(score) helper — labeled readability tiers
     ("Very Easy" → "Very Difficult"). Reusable utility, not yet
     emitted into output shape (left as future enhancement).

NOT upstreamed (per D5/D6 in TIER-4-OVERFLOW-PLAN.md):
  - Output-shape additions (bodyText, paragraphCount,
    readabilityLevel field, calgary-specific scoreExplanation
    content): template's output shape stays stable for the
    multipage normalizer consumer.
  - Calgary buildExplanation + community slugs: Calgary-specific
    UI polish, deleted in next commit (ar9 2/3).
  - Cosmetic-only diffs (logging format, 'use strict' removal).

Verification:
  node --check template/scripts/extract-text.js → no errors.
  Smoke test against 3 clients (matt + laura + liane), --limit 3:
    exit 0 for each, valid JSON, all 8 consumer-required keys
    present in pages[0] (url, wordCount, sentenceCount,
    syllableCount, fleschReadingEase, fleschKincaidGrade,
    avgSentenceLength, avgSyllablesPerWord).

Source: bd site-audit-fix-work-ar9 + TIER-4-PLAN §Q1.5 +
HANDOFF-POST-TIER-4 §5a.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

#### Subtask 4b: Delete Calgary's community slugs

**Files:** Modify `clients/calgary-castles/scripts/extract-text.js` (delete the community-slug regex around line 81 + any remaining slug-conditional code).

- [ ] **4b-1: Locate the community-slug code**

```bash
grep -n "communities/\|auburn-bay\|bridlewood\|cranston" clients/calgary-castles/scripts/extract-text.js
```
Expected: 1+ match around line 81 in `buildExplanation` function.

- [ ] **4b-2: Edit — remove the slug-conditional branch**

Use Edit tool to remove the `else if (url.includes('/communities/') || url.match(/\/(auburn-bay|...)\//))` branch that sets `contentNote = 'Community/neighbourhood page content '`. Keep the surrounding `buildExplanation` flow and other branches (generic content, etc.) intact.

If `buildExplanation` becomes structurally identical to template's after this removal, that's expected — confirms the only Calgary-specific delta was the slug branch.

- [ ] **4b-3: node --check + smoke test calgary's local script (R11 mitigation note)**

```bash
node --check clients/calgary-castles/scripts/extract-text.js
echo "exit=$?"
```
Expected: 0.

```bash
if [ -f "clients/calgary-castles/seo/research/crawl-data.json" ]; then
  cd clients/calgary-castles
  node scripts/extract-text.js --input seo/research/crawl-data.json --limit 3 > /tmp/calgary-extract-4b.json 2>&1
  echo "exit=$?"
  jq '.pages[0].scoreExplanation' /tmp/calgary-extract-4b.json 2>&1 | head -5
  cd /root/site-audit-fix-work
fi
```
Expected: scoreExplanation strings no longer contain "Community/neighbourhood page content" prefix; otherwise structurally similar to prior output.

Note for commit body (R11): existing `clients/calgary-castles/seo/research/page-text-analysis.json` historical output still has slug-prefixed strings — they're frozen in time. Future runs produce slug-free strings. The `Backup/` snapshot is unaffected.

- [ ] **4b-4: Stage + commit**

```bash
git add clients/calgary-castles/scripts/extract-text.js
git status --short
git commit -m "$(cat <<'EOF'
fix(calgary): remove community-slug context from extract-text fork (ar9 2/3)

Calgary's extract-text.js had a hardcoded regex matching 9
neighborhood slugs (auburn-bay, bridlewood, chaparral, cranston,
evergreen, legacy, mahogany, mckenzie-towne, new-brighton,
walden) that fed contentNote → scoreExplanation strings.

scoreExplanation IS consumed by code (not "no consumers" as the
original Tier-4-spill register noted — corrected during overflow
planning):
  - template/reports/multipage/generate-multipage-report.js:1432,
    1483-1484, 2796 — normalizer reads it with a
    buildReadabilityExplanation() fallback that constructs it
    from readability metrics when missing.
  - template/reports/multipage/pages/content.js:293 — HTML
    renderer displays it.
  - platform/scripts/build_audit.py:692 — Python pipeline emits it.
  - AUDIT-SOP.md:26 — SOP requires it for every page.

Behavior change: Calgary's per-page scoreExplanation strings lose
the "Community/neighbourhood page content" contextual prefix.
After ar9 3/3 (sync), Calgary's extract-text.js stops emitting
custom scoreExplanation entirely; the renderer's
buildReadabilityExplanation() fallback constructs generic
explanations from the same numeric readability data. Loss is
purely cosmetic — readability scores are unchanged; only the
human-readable explanation prefix changes.

Existing clients/calgary-castles/seo/research/page-text-analysis.json
output is frozen historical data with slug-prefixed strings. Next
live audit run produces slug-free strings via the renderer fallback.

This unblocks the next commit (ar9 3/3): syncing Calgary's
extract-text.js to the upstreamed template script.

Source: bd site-audit-fix-work-ar9 + Explore agent C report
(corrected at planning time per D5/D6 in TIER-4-OVERFLOW-PLAN.md).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

#### Subtask 4c: Sync Calgary's extract-text.js to template

**Files:** `cp template/scripts/extract-text.js clients/calgary-castles/scripts/extract-text.js`.

- [ ] **4c-1: Capture pre-sync state for the commit body**

```bash
PRE_SYNC_SHA=$(sha256sum clients/calgary-castles/scripts/extract-text.js | awk '{print $1}')
PRE_SYNC_LINES=$(wc -l < clients/calgary-castles/scripts/extract-text.js)
echo "PRE_SYNC: sha=$PRE_SYNC_SHA, lines=$PRE_SYNC_LINES"
TEMPLATE_SHA=$(sha256sum template/scripts/extract-text.js | awk '{print $1}')
TEMPLATE_LINES=$(wc -l < template/scripts/extract-text.js)
echo "TEMPLATE: sha=$TEMPLATE_SHA, lines=$TEMPLATE_LINES"
```

The pre-sync sha must NOT match `b2e89f0f...` (the original Tier 4 fork sha) because 4b modified the file. Confirm the difference is real before sync.

- [ ] **4c-2: Sync via straight cp**

```bash
cp template/scripts/extract-text.js clients/calgary-castles/scripts/extract-text.js
```

- [ ] **4c-3: Verify post-sync sha matches template (R12 mitigation)**

```bash
POST_SYNC_SHA=$(sha256sum clients/calgary-castles/scripts/extract-text.js | awk '{print $1}')
test "$POST_SYNC_SHA" = "$TEMPLATE_SHA" \
  && echo "OK: calgary now matches template ($POST_SYNC_SHA)" \
  || (echo "FAIL: calgary=$POST_SYNC_SHA template=$TEMPLATE_SHA" && false)
```

- [ ] **4c-4: Verify diff -rq for calgary's full scripts/ directory**

```bash
diff -rq template/scripts/ clients/calgary-castles/scripts/
```
Expected EXACTLY 1 line:
```
Only in clients/calgary-castles/scripts: update-readability.py
```
(The pre-Tier-4 `Files differ` for `extract-text.js` is now gone.)

- [ ] **4c-5: node --check across calgary's scripts**

```bash
find clients/calgary-castles/scripts/ -name '*.js' -type f -exec node --check {} \;
```
Expected: no error.

- [ ] **4c-6: Stage + commit + close bd**

```bash
git add clients/calgary-castles/scripts/extract-text.js
git status --short
git commit -m "$(cat <<'EOF'
fix(calgary): sync extract-text.js to upstreamed template (ar9 3/3)

cp template/scripts/extract-text.js → calgary. Completes the
upstream-then-replace cycle started by Tier 4 (which preserved
Calgary's 275-line fork via sha256 guard):

  ar9 1/3: upstreamed syllable algo + <main>/<article>
           extraction + getReadabilityLevel helper to template
           (canonical)
  ar9 2/3: deleted Calgary's community-slug context from
           extract-text fork (cosmetic loss; renderer fallback
           via buildReadabilityExplanation handles missing
           scoreExplanation)
  ar9 3/3: this — sync Calgary's extract-text.js to template

Result: Calgary's extract-text.js is now byte-identical to
template (sha256 verified). The Tier 4 sha256-fingerprint guard
is no longer needed for this file. Calgary remains template-
paritied across its scripts/ directory except for the documented
update-readability.py orphan (preserved per Step 1.5
warn-don't-delete contract).

Verification:
  sha256 match: calgary == template (post-sync).
  diff -rq template/scripts/ clients/calgary-castles/scripts/
    → only update-readability.py (Only in client) — orphan,
      preserved.
  node --check clean across calgary's scripts/.

Closes ar9. Calgary's extract-text.js will participate in normal
Step 1.5 auto-sync going forward; no special handling needed.

Source: bd site-audit-fix-work-ar9 + TIER-4-PLAN §Q1.5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
bd close site-audit-fix-work-ar9
```

---

### Task 5: Post-flight + push surface

- [ ] **Step 1: Final fleet parity check (calgary should now show only the orphan)**

```bash
for c in laura-willis liane-jamason chris-nevada mammoth-lakes murray-gardner p3realtync; do
  echo "=== $c ==="
  diff -rq template/scripts/ "clients/$c/scripts/" 2>&1 | grep -v '^Only in.*_backup$' || echo "  IN SYNC"
done
echo "=== calgary-castles (expect: only update-readability.py orphan) ==="
diff -rq template/scripts/ clients/calgary-castles/scripts/
```
Expected: 6 `IN SYNC` blocks; calgary now shows ONLY `Only in clients/calgary-castles/scripts: update-readability.py` (extract-text.js diff line is GONE — the Tier 4 fork has been retired).

- [ ] **Step 2: Full regression suite**

```bash
PYTHONPATH=platform/src pytest platform/tests/ -v --tb=line 2>&1 | tail -10
```
Expected: 19 passed (8 baseline + 11 new from aj1). Zero failures.

- [ ] **Step 3: node --check across all template + client .js**

```bash
err_lines=$(find template/scripts/ clients/*/scripts/ -name '*.js' -type f -not -path '*_backup*' -exec node --check {} \; 2>&1 | wc -l)
echo "node --check error lines: $err_lines"
```
Expected: `0`. If non-zero, re-run without `wc -l` to see actual errors.

- [ ] **Step 4: Commit count**

```bash
git log --oneline f761fea..HEAD | wc -l
git log --oneline f761fea..HEAD
```
Expected: 9-10 commits (1 aj1 + 0-N conditional 0au + 5 acf + 3 ar9). All authored by `Claude Opus 4.7 (1M context) <noreply@anthropic.com>` footer.

- [ ] **Step 5: bd state**

```bash
bd ready
bd list --status=closed 2>&1 | tail -10
```
Expected: 4 issues closed (aj1, acf, ar9, 0au). Ready list empty unless 0au surfaced new issues that we explicitly chose not to address in this plan.

- [ ] **Step 6: Surface to user for push authorization (DO NOT auto-push)**

Output the surface message:

```
Tier 4 Followups complete. <N> commits ready to push to
origin/site-audit-fixes-tier-4-followups (NEW remote branch) —
DO NOT push without your authorization.

Commits this session:
  aj1 (1):  fix(platform): add networkx + vaderSentiment as required dependencies (aj1)
  0au (0-N): [conditional based on findings; specify exact subjects + count]
  acf (5):  fix(pagespeed): route GET through _request_sync ... (acf 1/5)
            fix(business_profile): route OAuth GET/POST ... (acf 2/5)
            fix(crux): route POST through _request_sync, preserve 404 (acf 3/5)
            fix(brand_mentions): route _safe_get ... preserve 429 retry (acf 4/5)
            fix(social_audit): route _safe_head/_safe_get ... (acf 5/5)
  ar9 (3):  fix(extract-text): upstream calgary syllable algo + main/article extraction (ar9 1/3)
            fix(calgary): remove community-slug context from extract-text fork (ar9 2/3)
            fix(calgary): sync extract-text.js to upstreamed template (ar9 3/3)

Tests: 19/19 passing (was 8 passing + 11 failing; aj1 unblocked the 11).
Fleet parity: all 7 clients in template parity. Calgary's
extract-text.js now matches template (the Tier 4 sha256 fork
guard is no longer needed for that file).
bd: 4 issues closed (aj1, 0au, acf, ar9). <0 or N> new issues filed from 0au forensic.

To push (when you authorize):
  gh auth setup-git && git push -u origin site-audit-fixes-tier-4-followups

To rollback (preserves Tier 4):
  git checkout site-audit-fixes-tier-4 && git branch -D site-audit-fixes-tier-4-followups
```

Per CLAUDE.md TANDEM §3: never push without explicit user direction.

---

## Self-review checklist

- [x] **Spec coverage:** Every bd issue maps to a Task. aj1→T1, 0au→T2 (with explicit decision tree for 0/some/many findings), acf→T3 (5 subtasks for 5 connectors), ar9→T4 (3 subtasks for upstream/delete-slugs/sync). Pre-flight=T0, post-flight=T5.
- [x] **Placeholder scan:** No "TBD" / "implement later". The "If new artifacts surfaced" branches in T2 are explicit decision trees with concrete commands, not placeholders.
- [x] **Path/name consistency:** All file paths spelled identically across tasks. bd issue IDs (`site-audit-fix-work-{aj1,0au,acf,ar9}`) consistent throughout.
- [x] **Decisions surfaced:** All 6 decision points (D1-D6) called out in `## Decision Record` with rationale + override option for executor.
- [x] **Risk register:** 14 risks enumerated with likelihood/impact/mitigation. Each non-trivial risk has a corresponding mitigation step in the plan body.
- [x] **Verification gates:** Per-commit verification (test runs, diff -rq, sha256 round-trip where applicable, node --check, smoke tests). Final regression suite covers entire 19-test footprint after aj1.
- [x] **Push discipline:** Auto-push explicitly forbidden in T5 Step 6; surface step is exact-SHA disclosure with explicit branch-fork callout (this is a NEW remote branch).
- [x] **Smoke test depth:** ar9 smoke-tests against 3 clients (matt + laura + liane), not just one — catches HTML-shape variability per R10.
- [x] **Consumer correctness:** ar9 corrects Explore C's claim that scoreExplanation has no consumers. Verified consumers cited in commit message body.

---

## Verification (end-to-end)

After all tasks complete:
- `pytest platform/tests/` → **19/19 passing** (8 baseline + 11 new from aj1)
- `diff -rq template/scripts/ clients/<c>/scripts/` → empty for all 7 clients **except** calgary's `update-readability.py` orphan (extract-text.js no longer in the diff — fork retired)
- `git log --oneline f761fea..HEAD` → 9-10 new commits, all with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` footer
- `bd ready` → empty (or only new findings from 0au); 4 original issues closed
- `node --check` clean across all client and template `.js` files
- `clients/calgary-castles/scripts/extract-text.js` sha256 == `template/scripts/extract-text.js` sha256 (fork retired)
- networkx + vaderSentiment importable from `audit-platform` venv

## Critical files

- **Modified (aj1):** `platform/pyproject.toml`
- **Modified (acf, 5):** `platform/src/audit_platform/connectors/{pagespeed,business_profile,crux,brand_mentions,social_audit}.py`
- **Reference (acf, read-only):** `platform/src/audit_platform/connectors/{base.py,dataforseo.py}`, `platform/tests/test_connectors_base.py`
- **Modified (ar9):** `template/scripts/extract-text.js`, `clients/calgary-castles/scripts/extract-text.js`
- **Reference (ar9, read-only):** `template/reports/multipage/generate-multipage-report.js` (consumer of extract-text output, with `buildReadabilityExplanation` fallback), `template/reports/multipage/pages/content.js`, `platform/scripts/build_audit.py`, `AUDIT-SOP.md`
- **Authoritative bd issues:** `bd show site-audit-fix-work-{aj1,0au,acf,ar9}`
- **Spec context:** `Claude Code Findings/HANDOFF-POST-TIER-4.md` §5

## Execution handoff

Plan complete. Two execution options:

1. **Subagent-Driven via /smart-team** (recommended — same as Tier 4) — fresh CX-Executor per Task with per-task review checkpoints. Worked well for Tier 4. Total: ~9-10 dispatches (T0 inline + T1 + T2 + 5×T3 + 3×T4 + T5 inline).

2. **Inline execution** — drive tasks in this session with checkpoints between commits.

Recommended: smart-team subagent-driven, mirroring the successful Tier 4 execution pattern. Reasoning: per-task isolation catches issues early; the 4 issues are heterogeneous enough that fresh context per task helps; the writing-plans bite-sized format proven to work well with CX-Executor dispatches.
