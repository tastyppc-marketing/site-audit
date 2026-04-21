# Handoff — Post-Tier-2, Resuming at Tier 3

**Written:** 2026-04-21 (succeeds `HANDOFF-POST-TIER-1.md`, which is now historical — read it for Tier 1 / 1.5 / auto-sync context)
**Branch:** `site-audit-fixes` (origin + local match at `b53c6ec`)
**Repo root:** `/root/site-audit-fix-work/` — the dedicated fix-work clone. Production clone at `/root/site-audit/` — don't touch it.

---

## 1. What changed since HANDOFF-POST-TIER-1.md

**Tier 2 — all three fixes shipped. Plus one scope promotion** (a go/no-go gate failure surfaced that Fix 4's location-code parameterization was addressing the wrong root cause — the real cause was a parsing bug, which was promoted into Tier 2 as Commit C1. Same tier-promotion pattern as Finding #5 → Tier 1.5.)

| Commit | Fix | Summary |
|---|---|---|
| `7b0f9ed` | 5A | `template/scripts/lib/atomic-write.js` (new) + `populate-audit-data.js:461` → atomic `.tmp` + fsync + rename with `.bak` backup. `.gitignore` covers the `.bak` files. |
| `3109fdd` | 5B | `gather-keyword-volumes.js:297` adopts the same helper (`trailingNewline: true` — byte-preserves prior output). |
| `87a8b08` | **4C1** (promoted) | `gather-local-pack.js:137` — each DFS `local_pack` is a top-level item, not an aggregator with nested `.items[]`. `items.find(...)` → `items.filter(...)`. Matt's packs now return real data (Pine Point Realty / First Weber / Cecily Dawson) where before all 25/25 keywords silently returned empty. |
| `4faa951` | 4C2 | `gather-local-pack.js` — new `resolveLocationCode()` helper. Priority: `--location` CLI → `client-config.json.locationCode` → fallback `2840` with prominent warn. `commands/seo-audit.md:805` drops `--location 2840`. Matt's config gains `"locationCode": 1028181` (Rhinelander city code, verified live from DFS `/v3/serp/google/locations/US`). |
| `6cc45a6` | 6D | `connectors/base.py` — `_retry_on_transient` predicate covers 5xx + `TransportError` + `TimeoutException`. `@retry` added to `_request_sync`. New `platform/tests/test_connectors_base.py` (4 cases — all pass in 0.73s). |
| `ef1cd03` | 6E | `connectors/dataforseo.py:_post` routes through `self._request_sync` — every DataForSEO method (14) gains retry coverage transparently. Drops the redundant `_rate_limit_sync` + `raise_for_status` that would have double-fired. |
| `b53c6ec` | cleanup | Revert of scratch `docs/scratch-tier-2-plan.md` (the temp file Ultraplan needed — never meant to ship). |

Verification evidence (Tier 2):

| Signal | Before | After |
|---|---|---|
| `audit-data.json` crash-mid-write | file corrupted / truncated | file untouched, `.bak` preserved, stray `.tmp-*` cleaned |
| matt-wallmow `local-pack-data.json` foundInPack/notInPack | 0 / 25 (false-negative) | non-empty packs returned for geo keywords |
| DFS 5xx on DataForSEO connector | first-attempt failure | 3 attempts with exponential backoff |
| `pytest platform/tests/test_connectors_base.py -v` | (test did not exist) | 4/4 passing |

## 2. Reference client state

- **`clients/matt-wallmow/`** — scripts still in sync with template (Step 1.5 auto-heals any drift on next audit). `client-config.json` now carries `locationCode: 1028181`. `seo/audit-data.json` reflects template-populate-only run state; its `localSeo.mapPackKeywords` still shows the pre-Fix-4C1 empty data and will populate correctly on next `/seo-audit` run.
- **Other clients (laura-willis, liane-jamason, cohort)** — no `locationCode` in their configs → they'll fall back to `2840` with a warning on next audit. Tier 4 cohort pass is where those configs get backfilled.

## 3. Tier 2 decisions worth remembering

- **Step 1.5 propagates `lib/atomic-write.js`** automatically on each client's next `/seo-audit` run. Expect a `[NEW]` log line per client — this is desirable.
- **`gather-local-pack.js` auto-loads `./client-config.json`** by default (no `--config` flag required). This is a deliberate deviation from `gather-local-seo.js`'s pattern — justified by the skill always running the script from the client dir. Pass `--config <path>` to override.
- **DataForSEO-only retry routing.** The other 9 sync connectors still bypass `_request_sync` (see §4 below). Tier 3 will sweep them.

## 4. Deferred — for Tier 3 / Tier 4 / post-tier punch-list

### 4a. Tier 3 — reliability sweep (inherits from Fix 6)

**Connectors bypassing `_request_sync` — no retry coverage.** Each calls `self.sync_client.request()` / `.post()` directly and handles `raise_for_status()` inline. Route each through `_request_sync` the same way `dataforseo._post` now does.

| File | Line | Current pattern |
|---|---|---|
| `connectors/pagespeed.py` | 187 | `response.raise_for_status()` after direct client call |
| `connectors/crux.py` | 99 | same |
| `connectors/business_profile.py` | 126, 132 | two direct call sites |
| `connectors/brand_mentions.py` | 85 | direct |
| `connectors/social_audit.py` | 121 | direct |
| `connectors/search_console.py` | — | direct (exact line TBD) |
| `connectors/ga4.py` | — | direct (exact line TBD) |
| `connectors/google_ads.py` | — | direct (via the Google Ads SDK, not httpx — may be out of scope) |
| `connectors/local_seo.py` | — | direct (exact line TBD) |

**`pagespeed.py:186` has no rate-limit at all** — it doesn't call `_rate_limit_sync` or any equivalent. Fix alongside the retry refactor.

### 4b. Tier 3 — missing test dependencies

**Investigated and documented during Tier 2:** 11 pre-existing test failures in `platform/tests/` are NOT caused by Tier 2 work. Confirmed by `git stash && pytest` with my changes removed — same 11 fail. They're all driven by two missing optional Python packages that `pyproject.toml` doesn't declare:

| Failing test(s) | Missing package | Analyzer | Symptom |
|---|---|---|---|
| `test_internal_linking.py::test_extended_metrics_returns_dict` | `networkx` | `InternalLinkAnalyzer.compute_extended_metrics` | `KeyError: 'density'`, logs `networkx_not_available` |
| `test_internal_linking.py::test_betweenness_bridge_detection` | `networkx` | same | assertion failure on missing field |
| `test_internal_linking.py::test_community_detection` | `networkx` | same | same |
| `test_internal_linking.py::test_graph_density` | `networkx` | same | `KeyError: 'density'` |
| `test_local_seo.py::test_sentiment_positive_reviews` | `vaderSentiment` | `LocalSEOAnalyzer` sentiment path | `assert 0 > 0`, logs `vader_not_available` |
| `test_local_seo.py::test_sentiment_negative_reviews` | `vaderSentiment` | same | `assert 0 > 0` |
| `test_local_seo.py::test_sentiment_mean_compound` | `vaderSentiment` | same | `assert 0 > 0` |
| `test_local_seo.py::test_sentiment_reply_rate` | `vaderSentiment` | same | `assert 0 == 33.3` |
| `test_local_seo.py::test_sentiment_total_reviews` | `vaderSentiment` | same | `assert 0 == 6` |
| `test_local_seo.py::test_sentiment_keyword_extraction` | `vaderSentiment` | same | `assert 0 > 0` |
| `test_local_seo.py::test_sentiment_short_reviews_use_rating` | `vaderSentiment` | same | `assert 0 > 0` |

**Root cause:** `platform/pyproject.toml` declares neither `networkx` nor `vaderSentiment` — not as main deps, not as optional extras. The analyzers use them with a try/except-import pattern that silently degrades output to empty/zero when missing. Tests assume the full path works.

**Recommended fix direction (pick one or both):**
1. **Add to main `dependencies`** in `pyproject.toml` — guarantees prod environments get the analyzers' full functionality. Bump dep footprint by two libs (~500 KB + NLTK-adjacent data for vader).
2. **Mark tests conditional** via `pytest.importorskip("networkx")` / `importorskip("vaderSentiment")` — just hides the failures. Leaves prod with silently-degraded analyzers. Not recommended alone.

**Production data-integrity implication:** if `build_audit.py` runs against a venv missing these libs, the `InternalLinkAnalyzer` reports empty extended metrics (no density, no betweenness, no communities) and the `LocalSEOAnalyzer` reports zero sentiment. Consumers of these fields in reports/XLSX/PPTX will see blank cells. **Worth confirming which venv production uses** before Tier 3 starts — if prod already has these libs, the fix is purely dev-hygiene; if not, prod has silent data-integrity drift.

### 4c. Tier 3 / Tier 4 — other deferred items

Carried forward from HANDOFF-POST-TIER-1.md §6 and Tier 2 commit bodies:

- **`build_audit.py:871` non-atomic Python write.** Twin of Fix 5 on the Python side. Tier 3.
- **Cohort `locationCode` backfill** (laura-willis, liane-jamason, chris-nevada, others). Tier 4 cohort pass.
- **Cohort re-template for pre-Tier-1 script divergence.** Tier 4.
- **City → DFS code lookup table.** Nice-to-have; would benefit `gather-local-seo.js` too. Post-tier.
- **Pre-commit hook protecting Step 1.5.** Greps `commands/seo-audit.md` for the sentinel marker. Still deferred.
- **Full `/seo-audit` end-to-end integration test** on matt-wallmow. Worth running once after Tier 3 lands to catch cross-tier regressions.
- **Cleanup of `scripts/_backup/*` + new `audit-data.json.bak` files** across clients. Disk hygiene only.
- **Review liane-jamason's post-sync state** after her next audit.
- **Dead `competitorRank` field** in `audit-data.keywords[]` — populate it or drop it. Schema hygiene, unrelated to reliability.

## 5. Tier 3 — what's next

From `Claude Code Findings/FINAL-SYNTHESIS.md` §5, Tier 3 = 4 fixes to restore promised features. Combined with the new items surfaced in §4 above, the Tier 3 surface is roughly:

- Route the 9 non-DataForSEO sync connectors through `_request_sync` (reliability sweep).
- Add `networkx` and `vaderSentiment` to `pyproject.toml` (test + prod integrity).
- `pagespeed.py:186` rate-limit.
- `build_audit.py:871` atomic Python write.
- The 4 feature-restoration fixes listed in FINAL-SYNTHESIS.md §5 Tier 3.

## 6. Starting Tier 3 — ultra plan mode prompt

```
# Ultra Plan request — Tier 3 fixes for site-audit pipeline

## Repo + branch
- Working clone: /root/site-audit-fix-work/ (production clone at /root/site-audit/ — don't touch)
- Branch: site-audit-fixes, origin synced at b53c6ec
- Tier 1 / 1.5 / 2 complete. Read Claude Code Findings/HANDOFF-POST-TIER-2.md first.

## Tier 3 scope
See HANDOFF-POST-TIER-2.md §4–5 for the full picture. The four "restore promised features" findings from FINAL-SYNTHESIS.md §5 are the core, PLUS the reliability-sweep work surfaced during Tier 2:
  - 9 non-DataForSEO sync connectors bypassing _request_sync (no retry coverage)
  - networkx + vaderSentiment missing from pyproject.toml (11 test failures, silent analyzer degradation in prod)
  - pagespeed.py:186 missing rate-limit
  - build_audit.py:871 non-atomic Python write

Confirm which of these fit into Tier 3 vs Tier 4+ and propose a commit plan per the discipline in HANDOFF-POST-TIER-1.md §4.

## Hard constraints (unchanged)
1. One fix per commit; scoped commit message with finding reference and Claude Opus 4.7 (1M context) co-author footer.
2. Don't modify existing finding text — append only under "## Additional Information".
3. Don't re-audit or rewrite findings.
4. Stage explicitly by path; never `git add .`.
5. Never skip matt-wallmow verification on functional fixes.
6. Before pushing: `gh auth setup-git` then `git push`.
```

## 7. Fast-start checklist

1. `cd /root/site-audit-fix-work`
2. `git status` — expect clean tree.
3. `git log --oneline -10` — last commit should be `b53c6ec Revert "scratch: tier-2 plan…"`.
4. `git branch --show-current` — expect `site-audit-fixes`.
5. `PYTHONPATH=platform/src pytest platform/tests/test_connectors_base.py -v` — expect 4 pass (Tier 2 retry tests).
6. Read this handoff §1–4 minimum, §5 to orient on Tier 3.
7. Open FINAL-SYNTHESIS.md §5 for the Tier 3 feature-restoration list.
8. Kick off ultra plan mode with the prompt in §6. (Remember: run `/ultraplan` from the repo root, not `/root`, or it can't find a git repo.)

---

**Total state:** Tier 1 / 1.5 / 2 shipped, auto-sync architectural guarantee in force, reference client has working local-pack + `locationCode`, DataForSEO retries 5xx, origin pushed. 8 commits ahead of Tier-2 baseline. Ready for Tier 3.
