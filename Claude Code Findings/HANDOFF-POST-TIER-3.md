# Handoff — Post-Tier-3, Resuming at Tier 4

**Written:** 2026-04-23
**Branch:** `site-audit-fixes` (origin + local match at `bc76896`)
**Repo root:** `/root/site-audit-fix-work/` — the dedicated fix-work clone. Production clone at `/root/site-audit/` — don't touch it.

**This handoff is designed to be self-sufficient.** A fresh session can read this single doc and be ready to plan Tier 4 without chaining through prior handoffs. Prior handoffs (`HANDOFF.md`, `HANDOFF-POST-TIER-1.md`, `HANDOFF-POST-TIER-2.md`) are retained in the repo for deeper dives but are not required reading.

---

## 0. Required reading for Tier 4 planning

Beyond this handoff, the Tier 4 session should read (in this order):

| Doc | Why |
|---|---|
| `CLAUDE.md` (repo root) | Fix-work-clone-specific rules: per-fix recipe, hard rules (one fix per commit, no `git add .`, etc.), current git state summary. |
| `Claude Code Findings/FINAL-SYNTHESIS.md` §5 | **The 5-tier priority fix queue.** Tier 4's core scope (fixes 11–13) lives here. Also read the "Additional Information" appendix — 2026-04-23 Tier 3 SHIPPED + advisor-catch dispositions. |
| `Claude Code Findings/INDEX.md` | 67-file status tracker + cross-cutting bugs. Orienting reference — use it to find which finding doc corresponds to a file you're touching. |
| `Claude Code Findings/MAJOR-FINDINGS.md` | Curated cross-finding bug index. Pattern recognition. F#54 "dual-classifier conflict" framing revised in Tier 3 (see §2 below). |
| `Claude Code Findings/<layer>/<N>-<name>.md` | Per-file deep-dive. Read on demand when touching that specific file. Findings with post-Tier-3 addenda: **F#10, F#13, F#14, F#17, F#18, F#54, F#56, F#63**. Every addendum is under `## Additional Information` at the bottom. |
| `docs/SEO-AUDIT-SYSTEM.md` | Full pipeline reference. Read when a fix's blast radius is unclear. |
| `docs/PRODUCTION-CLAUDE.md` | Inherited production rules (15 numbered data-integrity + report/template invariants). Read when verifying a fix didn't break a known invariant. |

Findings are **append-only**: never modify existing finding text. Add new observations under `## Additional Information` at the bottom of the relevant finding file. Don't re-audit from scratch.

---

## 1. Complete changelog — Tier 3 (proper) + advisor catches

### 1a. Tier 3 prep — new artifacts imported before planning

Surfaced while orienting for Tier 3. Neither was a fix; both were prerequisites for Tier 3 work to have anything to reference or build on.

| Commit | What | Why |
|---|---|---|
| `920807a` | Imported `template/scripts/analyze-backlink-quality.js` from the production clone | Script existed in `/root/site-audit/template/scripts/` but had **never been committed** — fix-work clone + GitHub had no copy. Fix 7 below would have wired a missing file. |
| `304ae6a` | Imported `codex findings/` + `docs/TANDEM-MAP.md` from the production clone | Cross-reference material for per-finding deep-dives. Not required, but useful for parallel consultation during planning. |

### 1b. Tier 3 — 5 feature-restoration fixes + 2 pre-existing-bug prep commits

The 5 planned fixes from `FINAL-SYNTHESIS.md §5` Tier 3 shipped in full. **Two additional "prep" commits** fell out of the verification discipline: each fix's narrowest-boundary verification uncovered a pre-existing blocker that had to land first. Shipped as their own commits (not batched with the primary fix) so each commit stays narrowly scoped per the one-fix-per-commit rule.

| Commit | Fix | Summary |
|---|---|---|
| `543cfc2` | **Fix 7** | `commands/seo-audit.md` Step 5.5 now invokes `node scripts/analyze-backlink-quality.js` between `gather-backlinks.js` and `gather-keyword-volumes.js`. Script exits 0 on missing inputs (documented in skill) so backlink budget caps don't abort the audit. Step 1.5 auto-sync carries the script to every client. |
| `d98fc43` | **8-prep** | `template/scripts/generate-presentation.js` Slide 4 kwTable — null-safe coercion on `k.volume` / `k.clientRank` / `k.competitorRank` / `k.topResult`. Pre-existing pptxgenjs `TypeError: Cannot read properties of null (reading 'options')` crash; PPTX generation had been failing silently for any keyword with null volume. Strict prereq for Fix 8's PPTX verification. |
| `257ee52` | **Fix 8** | `generate-spreadsheet.js:50-66` and `generate-presentation.js` Slide 5 — both body row builders now iterate `compN` keys derived from the `competitorComparison` row (mirrors canonical pattern at `pages/competitors.js:64-71`). Matt's 6th competitor (`skagenteam.firstweber.com`) previously silently dropped because his `competitor.all` has 5 entries but his rows have 6 `compN` keys. XLSX also gains the missing "Gap" header. PPTX uses dynamic `colW` math keyed to `compKeys.length`. |
| `ef94747` | **9-prep** | `template/scripts/gather-local-seo.js` `fetchHtml` — `requestText()` returns just `res.body` (a string), not `{statusCode, body}`. The previous code accessed `.statusCode` and `.body` on the string, so EVERY directory check silently returned `note="HTTP undefined"` with empty body. Swapped to `requestJson` which returns the expected shape. Strict prereq for Fix 9's UA + match changes to have any effect. |
| `8c9b716` | **Fix 9** | `gather-local-seo.js` — Chrome UA (Win10 Chrome 130) replaces SiteAuditBot/1.0 (BBB + Google Maps now 200, were 403); matcher now requires full-name substring (was first-word, causing "Matt" → "Matt's Deli" false positives); RE detection regex now tests `[name, location, cfg.clientCompany].join(' ')` so Matt's "Wallmow Realty, Inc / Lakeland Realty" clientCompany triggers Realtor.com / Zillow checks. `loadConfig()` now returns `company`. |
| `3a1aea3` | **Fix 10** | `gather-organic-metrics.js` — location/language parameterized (lifted `resolveLocationCode` from `gather-local-pack.js`, added parallel `resolveLanguageCode`). New second DFS call per domain to `/dataforseo_labs/google/domain_rank_overview/live` populates a new field `organicTrafficTotal` (uncapped domain-level traffic) alongside the existing `organicTraffic` (top-100 sum). Normalizer (`generate-multipage-report.js` 1767, 1792, 1832, 1870) propagates the new field. Renderer (`pages/keywords.js`, `pages/competitors.js`) adds a "Total organic traffic" card/row above the relabeled "Est. top-100 traffic" one. matt-wallmow config gains `"languageCode": "en"` for parity with Tier-2's `locationCode`. |
| `6e4af6c` | **Fix 11** | New `platform/src/audit_platform/utils/atomic_write.py` — Python twin of `template/scripts/lib/atomic-write.js`. `build_audit.py:872` swaps the crash-unsafe `with open(..., "w") + json.dump` for `write_json_atomic(...)`. 4-case test suite in `platform/tests/test_atomic_write.py` (round-trip, existing-target `.bak`, mid-write crash preservation, first-write-no-backup). `.gitignore` broadened: `clients/*/seo/audit-data.json.tmp-*` + `clients/*/seo/research/*.json.bak`. |
| `36d9b06` | docs | Finding addenda for F#10, F#13, F#14, F#17, F#18, F#54, F#56, F#63 + FINAL-SYNTHESIS Tier 3 appendix. Append-only under `## Additional Information`. |

### 1c. Advisor catches — 3 follow-up commits

After Tier 3 shipped, advisor flagged 6 follow-ups. 3 landed as code/docs commits; 3 were status-quo / already-documented / not-in-tier-scope.

| Commit | Catch | Summary |
|---|---|---|
| `ea3eb23` | #5 | `platform/src/audit_platform/utils/__init__.py` — re-export `write_json_atomic` alongside `setup_logging` / `retry`. One-line consistency fix (submodule-path import in `build_audit.py` already worked; this enables `from audit_platform.utils import write_json_atomic` for future code). |
| `dd3f9ac` | #2 | `gather-local-seo.js` — `fetchHtml` gains optional third arg `opts.maxRetries`. Directory-check call site at L195 passes `{ maxRetries: 1 }`; NAP scrape at L245 unchanged (default 5-retry budget). Realtor.com 429 retry-storm (5 retries × backoffs = ~62s wasted) capped at 1 retry. **Empirical reduction on matt-wallmow: 70.3s → 9.6s** (60.7s reclaimed per audit). Status codes confirm: 6×429 → 2×429 (1 initial + 1 retry). |
| `bc76896` | #1 + index | F#10 gains an "Operator verification (post-next-/seo-audit-run)" checklist for the `organicTrafficTotal` silent-failure path (try/catch defensively omits the field on endpoint failure; operator needs to know what to `jq` for). FINAL-SYNTHESIS Tier 3 addendum gains a dispositions table mapping each of the 6 catches to outcome. |

Catches left as status quo:
- **#3** UI card ordering — intentional (total before top-100 = metric-importance rule).
- **#4** Zillow URL deferral — already documented in F#13 + FINAL-SYNTHESIS Tier 3 addendum.
- **#6** 11 pre-existing pytest failures (`test_internal_linking.py` + `test_local_seo.py` — missing `networkx` / `vaderSentiment` packages) — confirmed pre-existing at `304ae6a`, owned by whoever touches those analyzers next. See §5b below.

### 1d. Empirical evidence — Tier 3 + catches

| Signal | Before | After | Commit |
|---|---|---|---|
| matt-wallmow `client-backlinks.json` has `qualitySummary` | 0 occurrences | 706 domains classified across 6 files (1 legit / 35 spam for client; 219/194 totals) | `543cfc2` |
| matt `SEO-Audit-Presentation.pptx` Slide 5 cell count | 5 (comp3+ dropped, Gap in wrong col) | 9 (Metric + Client + 6 comps + Gap); "Comp 6" header fallback, `skagenteam.firstweber.com` populated | `257ee52` |
| matt XLSX Competitors header cols | 8 (no Gap) / 5 body cols | 9 / 9 matched | `257ee52` |
| `generate-presentation.js` on matt | crashes at line 103 `TypeError` | writes PPTX successfully | `d98fc43` |
| matt `gather-local-seo.js` directory listings | all 4 `note="HTTP undefined"`, `found=false` | real HTTP statuses; BBB + Maps `found=true` via full-name match | `ef94747` + `8c9b716` |
| matt RE-specific directories checked | 0 (Realtor + Zillow skipped — RE keyword not in `name + ' ' + location`) | 2 (triggered by `clientCompany`) | `8c9b716` |
| matt `gather-local-seo.js` elapsed | 70.3s (6×429 w/ 5 retries on Realtor) | 9.6s (2×429 w/ 1 retry) | `dd3f9ac` |
| `gather-organic-metrics.js` CLI resolution | hardcoded `location_code: 2840, language_code: 'en'` | `--location` / `--language` flags + config + warn on default | `3a1aea3` |
| `organicTrafficTotal` field shape | not defined | emitted when `domain_rank_overview/live` succeeds; omitted (not null) on failure; normalizer + renderer pass-through | `3a1aea3` |
| `build_audit.py` write path | `open("w") + json.dump` crash-unsafe | atomic `.tmp-<pid>-<ms>` → fsync → `os.replace` with `.bak` preserved | `6e4af6c` |
| atomic-write unit tests | (module did not exist) | 4/4 passing in 0.17s | `6e4af6c` |

### 1e. Two important Tier 3 recon resolutions

Both of these were bugs in prior findings' predictions, not prior findings' authoritative text. Resolving them shrinks the active backlog:

1. **`"audit-synthesis"` literal does not exist anywhere in the repo.** F#13 §8 and F#56 bug #1 both predicted this string was emitted by some code path. Repo-wide grep returns zero matches across `*.js`, `*.py`, `*.md`, `*.json` in `template/` and `platform/`. Matt's fresh `gather-local-seo.js` run emits `source: "web-research"` (the script default), not `"audit-synthesis"`. Both items resolved-as-spurious in their respective finding addenda.
2. **F#54 "dual-classifier conflict" is architectural, not active.** The multipage renderer at `generate-multipage-report.js:2230-2260` reads `qualitySummary.analyzedAt` from the **research file** (`seo/research/client-backlinks.json`) — exactly the JS classifier's output path. The Python `qualitySummary` writer at `analyzers/backlinks.py:122` writes to `audit-data.json` instead — a path the multipage renderer doesn't consume for this field. So the two classifiers write to **different files** and only the JS path is consumed by the renderer. MAJOR-FINDINGS §4 "writer collision" framing revised. Retire-one-or-the-other decision is still owed, but pushed to Fix 15 (Tier 5) since there's no active collision.

---

## 2. Architectural state — what's guaranteed now (post-Tier-3)

### 2a. Step 1.5 contract (unchanged from Tier 2, still load-bearing)

`commands/seo-audit.md` Step 1.5 runs on **every** `/seo-audit` invocation (new and existing clients). Walks `template/scripts/` recursively; missing / differing files get synced (with backup at `scripts/_backup/<timestamp>-<pid>/`); orphans are warned, never auto-deleted; fatal exit on bad `TEMPLATE_DIR`; protected by sentinel banner `⚠ DO NOT REMOVE OR SKIP THIS STEP`.

**Tier 3 dependency:** Every Tier 3 fix in `template/scripts/` (analyze-backlink-quality.js, gather-organic-metrics.js, gather-local-seo.js, generate-spreadsheet.js, generate-presentation.js) will propagate to every client on their next `/seo-audit` run via Step 1.5. No per-client edits needed. Step 1.5 will report `[NEW] analyze-backlink-quality.js` for all 7 clients that don't have it (only liane-jamason had it manually — finding #14 §6).

### 2b. New shared utilities

| Utility | Location | Consumers |
|---|---|---|
| `atomic-write.js::writeJsonAtomic` | `template/scripts/lib/atomic-write.js` (Tier 2) | `populate-audit-data.js:461`, `gather-keyword-volumes.js:297` |
| `atomic_write.py::write_json_atomic` | `platform/src/audit_platform/utils/atomic_write.py` (Tier 3) | `platform/scripts/build_audit.py:872`. Re-exported from `audit_platform.utils` package. |
| `fetch-with-retry.js::requestJson` | `template/scripts/lib/fetch-with-retry.js` | `gather-local-seo.js::fetchHtml` (Tier 3 — swap from `requestText`) |
| `resolveLocationCode()` pattern | inline in `gather-local-pack.js:65-98` (Tier 2) and `gather-organic-metrics.js` (Tier 3) | Same helper lifted per-script. Convention: CLI → config → default-with-warn. `resolveLanguageCode()` added in Tier 3 using the same shape. |

### 2c. Dual-write paths — status

| Field | JS producer (primary) | Python producer (status) |
|---|---|---|
| `qualitySummary` (backlink classifier) | `analyze-backlink-quality.js` → writes to `seo/research/*.json` (consumed by renderer `generate-multipage-report.js:2230-2260`) | `analyzers/backlinks.py:122` → writes to `audit-data.json` (NOT consumed by renderer for this field — dead in render path) |
| `organicTraffic` + `organicTrafficTotal` | `gather-organic-metrics.js` (Tier 3) | `connectors/dataforseo.py:830` `get_competitors_domain` — **zero callers anywhere in the codebase, dead code** |
| `locationCode` param | `gather-local-pack.js` (Tier 2) + `gather-organic-metrics.js` (Tier 3) read from `client-config.json` | No Python equivalent; location is passed explicitly by `build_audit.py` |
| `audit-data.json` atomic writes | Not applicable (JS reads only) | `build_audit.py:872` via `write_json_atomic` (Tier 3) |

### 2d. Known anti-bot blocks (Tier 3 surfaced; transport-layer fix deferred)

| Directory | Status | Why |
|---|---|---|
| Yelp | HTTP 403 even with Chrome UA + browser headers | CloudFront JS challenge — needs headless browser or proxy. |
| Realtor.com | HTTP 429 throttling (now 1 retry, 1 initial = 2 attempts total per `dd3f9ac`) | Rate-limited by IP. |
| Zillow | HTTP 403 — both URL forms (current `rhinelander%2c-wi-54501/` AND proposed `rhinelander-wi/`) | CloudFront — live-test gate failed before commit, URL change deferred. |
| BBB | HTTP 200 — works with Chrome UA | Was 403 with SiteAuditBot/1.0. |
| Google Maps | HTTP 200 — works | Was 403. |
| Facebook | HTTP 400 (search query format issue, not UA) | Tracked informally; not blocking. |

Tracked as a single follow-up: transport-layer fetcher for anti-bot directories. Three production directories affected (Yelp, Realtor, Zillow). Scope is NOT Tier 4 — post-tier nice-to-have.

### 2e. The 12 layer directories (unchanged — map of the codebase)

| Dir | Role |
|---|---|
| `01-shared-util/` | HTTP retry + semaphore utility + atomic-write (JS) |
| `02-diagnostic/` | Playwright reconnaissance |
| `03-api-gathering/` | JS scripts → `seo/research/*.json`. Most template drift lives here. |
| `04-analysis-population/` | Enrichment + Markdown→JSON bridge |
| `05-deliverables/` | XLSX + PPTX builders |
| `06-generator/` | `generate-multipage-report.js` — the normalizer |
| `07-page-renderers/` | Client-side JS for each HTML report page |
| `08-shared-renderer/` | Shared renderer infrastructure |
| `09-python-connectors/` | Python wrappers around external APIs |
| `10-python-analyzers/` | Python analyzers |
| `11-python-orchestrators/` | Pipeline runners (`build_audit.py`) |
| `12-workflow/` | `commands/seo-audit.md` master skill orchestrator |

---

## 3. Verification discipline (carry forward into Tier 4)

This discipline is what has made every prior tier work. Tier 4 continues it. One pattern got sharpened in Tier 3:

- **Verify each fix at its narrowest code boundary** — not through the full pipeline.
- **Use `matt-wallmow` as the reference client** for empirical checks.
- **Capture "before" baselines** to `/tmp/matt-*.pre-fixN.{json,txt}` before running anything that mutates state.
- **Go/no-go gates.** When a fix's hypothesis is causally uncertain, empirically verify the link BEFORE writing code. If the gate fails, PAUSE — do not ship an inert fix. Surface to the user. Tier 3 examples: Zillow URL gate (both variants 403 → deferred entire URL fix); Fix 10 summary endpoint gate (no DFS creds → operator-side verification documented).
- **Tier-boundary spill handling.** If a Tier X fix's verification reveals a pre-existing bug that blocks verification, do NOT paper over it. Ship a narrow "prep commit" first; then the primary fix lands in a clean verification state. Two Tier 3 examples: `d98fc43` (PPTX kwTable null-safety before Fix 8); `ef94747` (local-seo response-unwrap before Fix 9). Both pre-existing, both blocked verification of the planned fix, both shipped as their own commit with a commit-body note that they are prep not the-fix-itself.
- **Operator-side gates when credentials live in 1Password.** DFS-live verification is often impossible in this repo clone. Defensive implementation (try/catch → omit the field on failure, don't set null, don't crash) + a verification checklist appended to the relevant finding's `## Additional Information` is the convention. The operator runs the gate on the next real `/seo-audit`. See F#10 "Operator verification" block for the template.

Reference client state now:
- `clients/matt-wallmow/` — scripts in sync with template (Step 1.5 auto-heals drift on next audit). `client-config.json` has `locationCode: 1028181` (Tier 2) AND `languageCode: "en"` (Tier 3).
- Other clients — no `locationCode` / `languageCode` in configs → fall back to `2840` / `'en'` with warn on next audit. Backfill candidate (see §5c).

---

## 4. Hard constraints (unchanged)

1. **One fix per commit.** No batched commits. Tier 4 bulk ops may be one commit per client cohort (see §6).
2. **Stage explicitly by path.** Never `git add .`.
3. **Don't modify existing finding text.** Append under `## Additional Information` only.
4. **Don't re-audit from scratch.** Re-reading scripts for full context is expected; producing new finding docs is not.
5. **Don't skip matt-wallmow verification** on functional fixes.
6. **Don't fix out of tier order** unless promoting a dependency via the discipline in §3 (Tier 1.5, Tier 2 C1, and Tier 3 prep commits are all precedents).
7. **Before pushing:** `gh auth setup-git && git push` (HTTPS remote needs gh credential helper — from global `~/.claude/CLAUDE.md`).
8. **Commit footer:** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

---

## 5. Deferred — the Tier 4 / Tier 5 / post-tier punch-list

Complete carried-forward inventory across all shipped tiers.

### 5a. Reliability sweep — Python connectors bypassing `_request_sync` (CARRIED FROM TIER 2)

**Still open.** Fix 6 (Tier 2) added retry coverage to `base._request_sync` and routed DataForSEO's `_post` through it. The other 9 sync connectors still call `self.sync_client.request()` / `.post()` directly with inline `raise_for_status()` — no retry coverage for transient failures.

| File | Line(s) | Current pattern |
|---|---|---|
| `connectors/pagespeed.py` | 187 | `response.raise_for_status()` after direct client call; **also no rate-limit at all** |
| `connectors/crux.py` | 99 | direct |
| `connectors/business_profile.py` | 126, 132 | two direct call sites |
| `connectors/brand_mentions.py` | 85 | direct |
| `connectors/social_audit.py` | 121 | direct |
| `connectors/search_console.py` | TBD (grep) | direct |
| `connectors/ga4.py` | TBD | direct |
| `connectors/google_ads.py` | TBD | via Google Ads SDK, not httpx — may be out of scope |
| `connectors/local_seo.py` | TBD | direct |

Not in Tier 4 scope (which is bulk re-template); could bundle opportunistically. Most natural fit is whenever a future fix touches any of these connectors — backfill retry coverage at the same time.

### 5b. Missing test / runtime dependencies in `platform/pyproject.toml` (CARRIED FROM TIER 2, CONFIRMED IN TIER 3)

**Still open.** 11 pre-existing pytest failures across `test_internal_linking.py` and `test_local_seo.py`. Confirmed pre-existing at `304ae6a` (before any Tier 3 commit). `platform/pyproject.toml` declares neither `networkx` nor `vaderSentiment`; analyzers use try/except-import and silently degrade to empty/zero when missing.

| Failing test cluster | Missing package | Analyzer | Symptom |
|---|---|---|---|
| `test_internal_linking.py::test_extended_metrics_returns_dict`, `test_betweenness_bridge_detection`, `test_community_detection`, `test_graph_density` (4 tests) | `networkx` | `InternalLinkAnalyzer.compute_extended_metrics` | `KeyError: 'density'`, logs `networkx_not_available` |
| `test_local_seo.py::test_sentiment_*` (7 tests) | `vaderSentiment` | `LocalSEOAnalyzer` sentiment | `assert 0 > 0`, logs `vader_not_available` |

**Prod data-integrity implication:** if `build_audit.py` runs in a venv missing these libs, extended internal-link metrics (density, betweenness, communities) and review sentiment are silently zero. Reports / XLSX / PPTX consumers of those fields see blank cells.

**Recommended action before Tier 4:** confirm whether prod venv has these (one `pip show networkx vaderSentiment` in prod tells you). If yes, this is dev-hygiene; add to `pyproject.toml` as optional extras + CI-only. If no, silent prod regression — add to main `dependencies`.

Owner is whoever next touches the internal-linking or local-seo analyzers. Not in Tier 4 scope.

### 5c. Tier 4 scope per `FINAL-SYNTHESIS.md §5` — bulk re-template operations

Three fixes. All are mechanical + low-risk per the synthesis doc. Coordinated scope.

**Fix 12 — Re-template the 3-client old cohort across 6 gather scripts**
- Clients: **chris-nevada, laura-willis, liane-jamason** — all behind on all 6 gather scripts per finding drift sections.
- Source of drift: F#7, #8, #9, #10, #11, #12, #13 (§Drift sections).
- Must land AFTER all Tier 1 / 2 / 3 script fixes (otherwise re-template would re-inherit now-fixed bugs — but since the fixes are IN the template, this just means "Tier 4 runs after Tier 3," which we're doing).
- **Step 1.5 auto-sync handles most of this automatically on the next `/seo-audit` run per client.** Tier 4 may simply reduce to: trigger a no-op audit per client, let Step 1.5 propagate; OR explicitly run the sync for each client offline and commit the result per cohort. Pattern is the 3-client cohort approach used in prior drift operations.
- Effort: M (coordinated across 3 clients × 6 scripts). Risk: low — `scripts/_backup/<timestamp>/` preserves prior client state.

**Fix 13 — Restore missing scripts for 4 clients**
- Clients: **calgary-castles, mammoth-lakes, murray-gardner, p3realtync** — these clients currently fail to audit because source scripts don't exist in their folders at all.
- Source: F#7, #8, #9, #10, #11, #12 (§Missing sections).
- Same Step 1.5 auto-sync mechanism covers the missing case (`[NEW]` path copies). Effort: M. Risk: low.

**Fix 14 — Delete client-local `generate-multipage-report.js` copies**
- Clients: **matt-wallmow, laura-willis, liane-jamason** — all 3 run stale normalizers (30-43% behind template per F#21 §6).
- Nothing currently invokes the local copies per skill inspection, but their presence is a footgun (risk that someone invokes the local copy).
- Effort: S. Risk: low.

**Coordination detail:** Step 1.5 syncs scripts from `template/scripts/` — but `generate-multipage-report.js` lives at `template/reports/multipage/`, NOT `template/scripts/`. So Step 1.5 does NOT currently touch it. Fix 14's delete is genuinely needed; it's not an auto-sync target.

**Tier 4 decision point (surface to user before starting):** do we let Step 1.5 do the work implicitly by triggering a lightweight audit per client, or do we explicitly run the sync offline per client + commit the diff cohort-wise? Second approach is cleaner for audit-trail (one commit per client, explicit before/after) but more mechanical work. First approach is what Step 1.5 was built for.

### 5d. Tier 3 operator-side follow-ups

Each of these requires a real `/seo-audit` run with secrets (DFS + GBP credentials in 1Password). Not runnable in this repo clone.

- **Fix 10 `organicTrafficTotal` gate.** On next real run, `jq '.data[] | {domain, organicTraffic, organicTrafficTotal}' seo/research/organic-metrics.json` — expect `organicTrafficTotal >= organicTraffic` for any domain ranking for >100 keywords. If field is missing for ALL domains, the `domain_rank_overview/live` parser needs investigation. Full checklist in F#10 `## Additional Information`.
- **Fix 11 SIGKILL stress test.** Unit tests simulate crash via `monkeypatch`. Real-world signal handling under the new `write_json_atomic` code path was not validated. Low-priority — the atomic mechanism is well-known POSIX.
- **End-to-end visual verification of Tier 3** per `FINAL-SYNTHESIS.md §5d` step 3: open all 9 HTML report pages after a real audit; confirm Backlinks page shows qualitySummary values; Competitors page + XLSX + PPTX show all competitor columns populated; Local page shows non-zero citation hits (BBB, Maps); Keywords + Competitors pages show both "top-100" and "total organic" labels. One-time cross-tier regression check.

### 5e. Tier 5 scope per `FINAL-SYNTHESIS.md §5` — architectural cleanup

Out of Tier 4 scope; documented here so they're not lost.

- **Fix 15 — PPC workflow** (F#16, #19, #20, #62). Create `commands/ppc-audit.md` + raw→data transformer. Entire PPC cluster currently orphaned. Effort: L. Risk: medium (new workflow, needs E2E testing).
- **Fix 16 — Dual-path decisions.** Pick Python OR JS for backlinks / local / PPC / DFS (F#41, #54, #8, #9, #16). Eliminates redundant API billing + divergent output shapes + divergent classifiers (F#54's JS-vs-Python qualitySummary is one example — Tier 3 confirmed it's architectural not active, but retire-one-path is still owed). Effort: L. Risk: high.
- **Spam-classifier calibration** (F#14 §7 item 2). `analyze-backlink-quality.js` rule-based v1 flagged 35/42 of matt's domains as spam and only 1 as legit — almost certainly over-aggressive. Hand-label ~100 samples, tune thresholds, bump `method` to `rule-based-v2`. Bundle with Fix 16's Python-or-JS decision since the classifier reconciliation is the same decision.

### 5f. Post-tier / opportunistic bundling (unchanged from Tier 2 handoff)

- **City → DFS code lookup table** — would benefit `gather-local-seo.js` too. Post-tier nice-to-have.
- **Pre-commit hook protecting Step 1.5** — greps `commands/seo-audit.md` for the `⚠ DO NOT REMOVE OR SKIP THIS STEP` sentinel, blocks commits that remove it. Post-tier.
- **Transport-layer fetcher for anti-bot directories** — headless browser or proxy for Yelp / Realtor / Zillow. Would retire the Zillow URL deferral, could cap directory-check retries more aggressively, might unblock full citation checking. Post-tier (but high-ROI for Local page quality).
- **Cleanup of `scripts/_backup/*` + `audit-data.json.bak`** across clients. Disk hygiene only.
- **Review liane-jamason's post-sync state** after her next audit. Her 208-line `gather-backlinks.js` fork was backed up during Tier 1 verification — may have intentional logic worth preserving.
- **Dead `competitorRank` field** in `audit-data.keywords[]` — populate or drop. Schema hygiene.
- **`utils/__init__.py` sibling exports** — consider adding `atomic_write` alongside the explicit `write_json_atomic` re-export, for parity with `logging` module exposure (currently only `setup_logging` is re-exported, not the whole module).

### 5g. Supplementary recommendations (not ordered; bundle with their domain's Tier)

Lifted directly from `FINAL-SYNTHESIS.md §5 Supplementary`:

- `generate-multipage-report.js::validateAuditData` exit 1 on critical issues (F#21 #2). Bundle with Fix 1 / normalizer work.
- DR scale normalization at connector layer (F#8 #3, #54 #3). Bundle with Fix 10 (done — not touched in Tier 3) or Fix 16.
- `base.py` rate-limit shared across connector instances (F#40 #3). Bundle with §5a reliability sweep.
- `populate-audit-data.js` multi-regex heading fallback + skill-level heading enforcement (F#15 #1). Bundle with Fix 5 / populate-audit-data work.
- `extract-text.js` default `--limit Infinity` + warn on cap (F#6 #1). Bundle with any skill-prompt update.

---

## 6. Tier 4 starting prompt (for /ultraplan or fresh session)

```
# Ultra Plan request — Tier 4 bulk re-template operations

## Repo + branch
- Working clone: /root/site-audit-fix-work/ (production clone at /root/site-audit/ — don't touch)
- Branch: site-audit-fixes, origin synced at bc76896
- Tier 1 / 1.5 / 2 / 3 complete. 13 commits ahead of the pre-Tier-3 import commit (304ae6a).

## Required reading
1. Claude Code Findings/HANDOFF-POST-TIER-3.md (this handoff, self-sufficient)
2. Claude Code Findings/FINAL-SYNTHESIS.md §5 Tier 4 (fixes 12, 13, 14 — the bulk ops)
3. Claude Code Findings/INDEX.md (67-file status tracker, for orientation)
4. Claude Code Findings/MAJOR-FINDINGS.md (cross-finding bug index)
5. Claude Code Findings/<layer>/<N>-<name>.md on demand — especially F#7, #8, #9, #10, #11, #12, #13 §Drift / §Missing sections
6. CLAUDE.md (fix-work rules)

## Tier 4 scope per FINAL-SYNTHESIS.md §5

Three coordinated fixes:

1. **Fix 12:** Re-template the 3-client old cohort (chris-nevada, laura-willis, liane-jamason)
   across 6 gather scripts. Step 1.5 auto-sync does most of this on their next
   /seo-audit run; decide whether to let it run implicitly OR run the sync
   offline + commit cohort-wise per client.

2. **Fix 13:** Restore missing scripts for 4 clients (calgary-castles, mammoth-lakes,
   murray-gardner, p3realtync). Currently these clients can't audit because source
   scripts aren't in their folders. Step 1.5 covers the [NEW] case.

3. **Fix 14:** Delete client-local generate-multipage-report.js copies
   (matt-wallmow, laura-willis, liane-jamason). NOT auto-synced by Step 1.5
   because it lives outside template/scripts/. Explicit delete needed.

## Decision point to surface before starting

Do we:
  (a) trigger a lightweight audit per client and let Step 1.5 propagate,
      then commit the client-dir diffs cohort-wise? Cleanest for audit trail.
  OR
  (b) run the sync explicitly offline for each client, producing before/after
      diffs, commit per client? More mechanical, but no external invocation needed.

Recommend (b) for this tier — keeps the work fully inside the fix-work clone and
doesn't require live API credentials.

## Propose a commit plan per the discipline in §3 of the handoff:
  - one commit per client (Tier 4 bulk ops explicit exemption allows one commit per cohort),
  - each verified at its narrowest boundary (file diff vs template is sufficient),
  - no go/no-go gates needed (mechanical operation, no causal uncertainty),
  - promote any tier-boundary spills surfaced during verification.

## Hard constraints (§4 of this handoff, unchanged across tiers)
1. One fix per commit (or per cohort, per Tier 4 exemption).
2. Commit footer: Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>.
3. Don't modify existing finding text — append only under "## Additional Information".
4. Stage explicitly by path; never `git add .`.
5. Never skip matt-wallmow verification on functional fixes (Tier 4 mostly
   affects OTHER clients; matt is already in sync with template).
6. Before pushing: `gh auth setup-git` then `git push`.
```

Launch `/ultraplan` from inside `/root/site-audit-fix-work` (not `/root`, or it can't find a git repo).

---

## 7. Fast-start checklist

1. `cd /root/site-audit-fix-work`
2. `git status` — expect clean tree.
3. `git log --oneline -15` — last commit should be `bc76896 docs(findings): append Tier 3 advisor-catch dispositions`. Commits `543cfc2..bc76896` span Tier 3 + advisor catches.
4. `git branch --show-current` — expect `site-audit-fixes`.
5. `PYTHONPATH=platform/src pytest platform/tests/test_atomic_write.py platform/tests/test_connectors_base.py -v` — expect 8/8 passing (Tier 2 retry regression + Tier 3 atomic-write suites).
6. `PYTHONPATH=platform/src python3 -c "from audit_platform.utils import write_json_atomic; print(write_json_atomic.__module__)"` — expect `audit_platform.utils.atomic_write` (catch #5 re-export).
7. Skim §1–§4 of this handoff. Read §5 in full to calibrate Tier 4 surface area.
8. Open `FINAL-SYNTHESIS.md` §5 Tier 4 for the authoritative Tier 4 fix list. Read the 2026-04-23 "Additional Information" appendix for Tier 3 context.
9. Launch `/ultraplan` with the prompt in §6. Remember to run it from the repo root.
10. Implement per the discipline in §3.

---

**Total state:** Tier 1 / 1.5 / 2 / 3 shipped + 3 advisor catches landed. Auto-sync architectural guarantee in force. Atomic write coverage on both JS + Python sides of `audit-data.json`. Feature restoration (backlink quality classification, competitor columns in deliverables, local-SEO citations, true-total organic traffic) complete. matt-wallmow local-SEO runtime cut from 70s to 10s via catch-B retry cap. 13 commits ahead of pre-Tier-3 baseline `304ae6a`. Origin pushed at `bc76896`. Ready for Tier 4.
