# Deep Dive #14 — `template/scripts/analyze-backlink-quality.js`

**File:** [`template/scripts/analyze-backlink-quality.js`](/root/site-audit/template/scripts/analyze-backlink-quality.js) (280 lines)
**Layer:** 04 — analysis / population (rule-based classifier — reads + enriches gather-backlinks.js output)
**Cross-reference:** [`codex findings/07-python-analyzers/17-analyze_backlink_quality.md`](/root/site-audit/codex findings/07-python-analyzers/17-analyze_backlink_quality.md) (note: codex mistakenly catalogued this under `07-python-analyzers` even though the script is JavaScript)
**Template-vs-client drift:** **Only `liane-jamason` has this script.** Template + 1 client = 2 copies total. 7 clients missing entirely. See §6.
**Template-vs-skill drift:** **Skill does NOT invoke this script.** Grep of `commands/seo-audit.md` finds zero references. Orphan tool.
**Date:** 2026-04-20

---

## 1. Purpose

The **rule-based backlink spam classifier.** Reads `client-backlinks.json` + all `backlinks-*.json` produced by `gather-backlinks.js` (finding #9), classifies each referring domain as `legitimate | suspicious | spam` using a rule set (TLDs, domain keywords, anchor patterns, DR thresholds), writes the classification IN-PLACE back into the source files, and adds a top-level `qualitySummary` block.

Header (line 7-8) promises a "Phase 2: Optional Claude CLI session for ambiguous domains" — **not implemented.** The `--skip-ai` flag documented at line 11 is never checked in code. Only the rule-based phase runs.

**Key architectural distinction:** this is the ONLY JavaScript script in the audit pipeline that is NOT invoked by the `/seo-audit` skill. It has to be run manually. That orphan status explains why only 1 of 8 clients (liane-jamason) has data enrichment from it.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `--client-only` | bool | false | Skip competitor files; process only `client-backlinks.json` |
| `--skip-ai` | documented but **unimplemented** | — | Would skip the optional Claude session (phase 2 that never runs anyway) |

**Env vars:** None.
**Files read:**
- `seo/research/client-backlinks.json` (line 228).
- All `seo/research/backlinks-*.json` via regex `/^backlinks-.+\.json$/` (line 243).

**Files written:** Same input files — in-place enrichment. Backups written as `*.json.bak` (line 203).

## 3. Outputs

**Per-file enrichment** (lines 163-166): each `referring_domains[i]` gets:
- `domainQuality`: `"legitimate" | "suspicious" | "spam"`
- `qualityScore`: 0-100 (higher = better)
- `qualitySignals`: array of signal tags
- `qualityReason`: string explanation

**Per-backlink enrichment** (lines 173-182): each `backlinks[i]` gets the `domainQuality` + `qualityScore` of its source domain (cross-referenced via `new URL(source_url).hostname`).

**Top-level `qualitySummary` block** (lines 186-200):
```
{
  total, legitimate, suspicious, spam,
  legitimatePct, suspiciousPct, spamPct,
  topLegitimate: [{domain, quality, score, reason}, ...10-20],
  topSpam: [{domain, quality, score, reason}, ...10-20],
  analyzedAt: ISO,
  method: "rule-based-v1"
}
```

**Backup file:** `<filename>.json.bak` written before the in-place rewrite (line 203-204). Liane's research dir has 6 `.bak` files — confirms the write path.

## 4. Annotated walk

**Lines 25-42 — the signal patterns.**
- `SPAM_TLDS` (line 25): 25 TLDs — `.xyz, .top, .click, .loan, .tk, .gq, .cf, .ga, .ml, .buzz, .wang, .bid, .win, .stream, .club, .site, .online, .icu, .monster, .rest, .beauty, .hair, .skin, .quest, .cfd`. Closed list. New spam TLDs emerge (`.pro, .xin, .life, ...`) not in the list.
- `SPAM_KEYWORDS` (line 26): casino, gambling, pharma, payday, forex, crypto-trade, adult, porn, xxx, sex, dating, hookup. Straightforward.
- `TELEGRAM_SPAM` (line 27): telegram/t.me links — known spam vector.
- `GENERIC_ANCHORS` (line 28): "click here", "read more", etc. — low-signal generic anchors.
- `SEO_SPAM` (line 29): "seo, backlink, linkbuild, guest post, directory" — matches scrape-farms.
- `FOREIGN_SPAM_TLDS` (line 30): `.ru, .cn, .vn, .id, .pl, .be, .ua, .kz, .uz, .by, .su`. **Opinionated call.** These TLDs are assumed spammy when combined with low DR. A legit Canadian client with a `.ru` industry partner would get +2 spam score.
- `LEGIT_PATTERNS` (lines 33-42): 8 regex patterns covering real-estate directories, business dirs, social, major tech, `.gov/.edu/.mil`, RE-specific blogs, community dirs, civic orgs. **Very real-estate-biased.** A law firm's legit partner domains (law-school alumni sites, state bar associations) aren't captured.

**Lines 46-123 — `classifyDomain(entry)`.** The core classifier.
- Line 48: `dr = entry.rank || entry.dr || entry.domainRating || 0`. **Field-alias fallback.** But **these fields use different scales:** `rank` (DFS) is 0-1000; `dr` (Ahrefs convention) is 0-100. For DFS-sourced data, DR=37 is low authority; for Ahrefs, DR=37 is mid. At **line 68** `if (dr >= 50)` triggers "legitimate" — safe for Ahrefs (50+ is high), but for DFS, `rank=50` is weak and gets incorrectly boosted. Cross-cuts with finding #8 bug #3 (DFS rank vs Ahrefs DR naming).
- Lines 56-65: Legit-pattern short-circuit. If domain matches any `LEGIT_PATTERNS` → return `legitimate` immediately, with reason "Recognized legitimate domain". Scoring capped at `50 + dr` (lines 60, 73).
- Lines 67-78: High-DR short-circuit. `dr >= 50 && !SPAM_KEYWORDS.test(domain)` → `legitimate`. See scale concern above.
- Lines 81-83: DR bucketing penalty. DR=0 → +3 score. DR<5 → +2. DR<15 → +1. **Non-linear ramp; DR=0 hits harder than DR=1.** Defensible — "no data DR" often indicates obscure/spam.
- Lines 86-87: TLD penalties. Spam TLD +4. Foreign TLD + low DR → +2.
- Lines 90-91: Keyword penalties. Spam keyword +5. SEO spam +3.
- Lines 94-101: Anchor text penalties. Telegram anchor +5. Generic anchor + low DR +1. **Note: `hasTelegramAnchor` and `hasGenericAnchor` are set once any anchor in the list matches, not per-anchor** — so one telegram anchor + 999 normal anchors = same penalty as all telegram anchors. Coarse but reasonable.
- Lines 103-107: "Single dofollow DR-0" +2 — signature for link-farm seed.
- Lines 110-111: `suspiciously-long-domain` (>30 chars, low DR), `numeric-domain` (4+ digits, low DR) — heuristics for auto-generated spam domains.
- Line 114: Classification thresholds — `score >= 5 → spam`, `score >= 2 → suspicious`, else `legitimate`.
- Line 115: `qualityScore = Math.max(0, Math.min(100, 80 - score*10 + dr))`. High spam score → low quality. High DR → higher quality. Bounded.

**Lines 127-208 — `processBacklinksFile(filePath)`.**
- Line 128: existence guard — returns null if file missing (not error).
- Line 131-134: **Schema tolerance** — supports both `raw.backlinks[]` + `raw.referring_domains[]` (top-level) AND `raw.data.backlinks[]` + `raw.data.referring_domains[]` (nested). Why tolerate both? Because gather-backlinks.js writes flat; some pre-existing external sources (Ahrefs-export format) use nested. Defensive.
- Lines 141-148: **Aggregates per-source-domain anchors + dofollow flags** from the backlinks array. Iterates all backlinks, groups by hostname.
  - Line 144: `new URL(src).hostname.replace(/^www\./, '')` — strips www. If `src` is malformed, `new URL` throws; catch returns → **entire backlink silently dropped**. No error log. Codex #4 flagged this as silent failure mode.
- Lines 154-170: Classify each referring domain with aggregated anchors + linkCount. Mutate the `rd` object in place.
- Lines 173-182: Second pass — propagate the domain classification onto each backlink (via source-domain lookup).
- Lines 186-200: Build `qualitySummary`.
  - Line 195: `topLegitimate` sorted DESCENDING by score (best first). Slice top 20.
  - Line 197: `topSpam` sorted ASCENDING by score (worst first). Slice bottom 20.
- Lines 203-205: **Backup-then-write** sequence. `fs.copyFileSync(filePath, backupPath)` then `fs.writeFileSync(filePath, ...)`. Neither call is atomic, but the backup provides recovery if the write crashes mid-way.

**Lines 212-278 — main.**
- Lines 213-214: only checks `--client-only`. `--skip-ai` advertised in header (line 11) is **NEVER READ**. Dead flag.
- Line 216-220: requires `seo/research/` directory.
- Lines 258-261: if no files processed, print "No backlink files found to analyze." and exit 0.
- Lines 263-274: totals summary to stdout.
- Lines 276-277: prints a suggestion to manually spawn Claude — **no integration**, just an operator nudge.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Script is not wired into the `/seo-audit` skill.** Grep of `commands/seo-audit.md` returns zero matches. Orphan tool. Only liane-jamason has ever been analyzed. Every other client's `client-backlinks.json` is NOT enriched with `domainQuality` / `qualityScore` / `qualitySummary`, yet `generate-multipage-report.js:2232, 2241-2254` and `platform/.../backlinks.py:122` and the test in `platform/tests/test_backlinks.py` all EXPECT the enrichment. Downstream reads fall through to null/default paths. Fix: wire this into Step 5 of the skill after `gather-backlinks.js`. |
| 2 | **H** | — | **Classifier may be mis-calibrated.** Liane's only-working-example shows 200 RDs → 7 legitimate (3.5%), 77 spam (38.5%), 116 suspicious (58%). Either Liane genuinely has a bad backlink profile OR the rules are too aggressive. Before propagating to all clients, the classifier needs a calibration pass: hand-label a sample of 100 "suspicious" and "spam" entries; measure accuracy. A 3.5% legit rate on a real-estate-agent profile is suspicious. |
| 3 | **H** | 48, 68 | **DR scale mismatch between DFS and Ahrefs inputs.** `entry.rank` (from DFS) is 0-1000; `entry.dr`/`entry.domainRating` (Ahrefs convention) is 0-100. Line 68 `if (dr >= 50)` treats DFS rank=50 as "high DR" and short-circuits to legitimate — but DFS rank 50 = weak authority. For clients whose `gather-backlinks.js` output has DFS-scale `rank`, every domain with rank 50+ gets auto-classified legit regardless of other signals. Cross-cuts finding #8 bug #3. Fix: normalize scale at input (divide DFS rank by 10, or rename to `dfsRank` and have two branches). |
| 4 | **H** | 213-214, 11 | **`--skip-ai` is advertised but not implemented.** Header documents it; code doesn't read it. Phase 2 (Claude CLI session) referenced in line 8 is also never implemented. Either build the AI phase or strip the dead documentation. |
| 5 | **M** | 30, 86-87 | **Foreign TLD list is opinionated.** `.ru, .cn, .vn, .id, .pl, .be, .ua, .kz, .uz, .by, .su` penalized at low DR. Legitimate international sites get flagged. Particularly biased against Polish (`.pl`) and Belgian (`.be`) which have many real businesses. Should be configurable or risk-weighted rather than hard rule. |
| 6 | **M** | 33-42 | **`LEGIT_PATTERNS` is real-estate-biased.** Non-RE clients (law, medical, retail) have their own ecosystems (state bars, medical boards, industry-specific dirs) that aren't captured. Results: more false-suspicious classifications for non-RE audits. |
| 7 | **M** | 25 | **`SPAM_TLDS` is a closed list.** New spam TLDs emerge. No config-driven update path. Cheap fix: external `spam-tlds.json` file. |
| 8 | **M** | 114 | **Classification thresholds hardcoded.** `score >= 5 → spam`, `score >= 2 → suspicious`. Tuning requires code edit. Threshold-configurable form would enable A/B testing of calibration. |
| 9 | **M** | 144, 176 | **Silent drop of backlinks with malformed source URL.** `try { new URL(src) } catch(e) { return; }` drops the backlink entirely, no log, no counter. On a noisy data set, could silently exclude meaningful rows. Codex #3. |
| 10 | **M** | 199 | **`method: 'rule-based-v1'` never updated.** No version bump mechanism if rules change. Older enrichments may have different semantics under the same label. |
| 11 | **M** | — | **7 clients missing script.** Template + liane-jamason = only copies. chris-nevada, laura-willis, matt-wallmow, calgary-castles, mammoth-lakes, murray-gardner, p3realtync all missing. |
| 12 | **L** | 203-205 | **Non-atomic write, but `.bak` backup covers recovery.** Better than gather-keyword-volumes.js (no backup) but worse than full atomic `.tmp + rename`. |
| 13 | **L** | 96-101 | **Anchor classification uses boolean flags, not per-anchor scoring.** One telegram anchor triggers penalty as much as 100. Low impact. |
| 14 | **L** | 130 | **`JSON.parse` uncaught.** Corrupted file throws. Surfaces to main-catch. |
| 15 | **L** | 276-277 | **Stdout suggestion to spawn Claude manually.** UX nudge with no auto-wire. Low impact. |

## 6. Integration map

**Invoked by:** **Nothing.** Not in the skill. Not in any Python orchestrator. Not in `populate-audit-data.js`. Manual-only.

**Files enriched:** Same input files (in-place):
- `seo/research/client-backlinks.json`
- `seo/research/backlinks-*.json`

**Consumers of the enrichment:**

| Consumer | File:lines | Reads |
|---|---|---|
| `generate-multipage-report.js` normalizer | `:2232, :2241-2246, :2254` | Checks for `qualitySummary`; maps `domainQuality` onto displayed backlinks. |
| `platform/src/audit_platform/analyzers/backlinks.py` | `:122` | Includes `qualitySummary` in Python analyzer output (if present). |
| `platform/tests/test_backlinks.py` | — | Asserts `qualitySummary` presence — **this test either skips or expects the enrichment to have run.** Worth checking whether the test currently passes for all clients. |

**Contract:**
- If `qualitySummary` present → renderer shows quality breakdown.
- If absent → renderer falls through to default (probably "no quality analysis" state).
- `rd[i].domainQuality` optional — consumers guard.

**Drift table:**

| Version | Lines | Status |
|---|---|---|
| Template | 280 | current |
| liane-jamason | 280 | Identical; ran it, has enrichment |
| matt-wallmow | — | MISSING — never ran |
| chris-nevada | — | MISSING |
| laura-willis | — | MISSING |
| calgary-castles | — | MISSING |
| mammoth-lakes | — | MISSING |
| murray-gardner | — | MISSING |
| p3realtync | — | MISSING |

**Skill-inline:** no reference.

**Correction to finding #9:** Finding #9 §5 (row 14) stated: "Matt's and Liane's `client-backlinks.json` both have an extra `qualitySummary` key." **Verified wrong.** Matt's file has NO `qualitySummary`. Only Liane's. Matt has never run this analyzer. Finding #9 correction note added in INDEX.

**Liane's data inspection:**
- `qualitySummary.total: 200` (matches her `--limit 200` cap).
- `legitimate: 7 (3.5%)`, `suspicious: 116`, `spam: 77 (38.5%)`.
- `method: "rule-based-v1"`.
- 6 `.bak` files in her `seo/research/` confirm backup path works.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Wire into the skill.** Add `node scripts/analyze-backlink-quality.js` after `gather-backlinks.js` in Step 5 of `commands/seo-audit.md:712`. One-line addition. Immediately enables backlink quality display on every future audit.
2. **Calibration pass BEFORE promoting to all clients.** Hand-label 100 random entries from Liane's output; compute precision/recall. Adjust thresholds (line 114) based on results. 3.5% legit rate is suspicious — tune before trusting.
3. **Fix DR scale conflation (bug #3).** Either: (a) normalize DFS `rank` to 0-100 at the entry level (divide by 10), or (b) check the field name and apply scale-specific thresholds. Affects the correctness of the high-DR short-circuit (line 68) — currently lets weak DFS domains through as legitimate.
4. **Run on all 7 missing clients** (after fixes #1-3). Backups provided by `.bak` files mean we can iterate safely.
5. **Externalize SPAM_TLDS + LEGIT_PATTERNS to a config file.** `config/spam-tlds.json` + `config/legit-patterns.json`. Update without code change. Supports vertical-specific overrides.
6. **Strip or implement `--skip-ai` flag** (bug #4). If not implementing, remove from header comment. If implementing, spec out the AI phase behavior.
7. **Silent drop → logged drop** (bug #9). Surface malformed source_url count in the console summary.
8. **Version bump mechanism for `method`** (bug #10). Change to `rule-based-v2` when rules change; enables downstream to interpret historic enrichments correctly.
9. **Configurable thresholds** (bug #8). Env var or CLI flag.
10. **Atomic write via `.tmp + rename`** in addition to the `.bak`. Belt and braces.

## 8. What to verify before we touch this file

- **Run it once on Matt Wallmow** with current rules (no changes) and inspect the output. Does the classifier seem reasonable on his 66-backlink + 5 competitor-file profile? If yes, the skill-wire fix is safe. If wildly off, calibrate first.
- **Check `platform/tests/test_backlinks.py`** — does it currently pass given most clients have no `qualitySummary`? If it's skipping based on absence, the wire-in expands test coverage too.
- **Confirm DFS vs Ahrefs data scale via actual client files.** Open `matt-wallmow/seo/research/client-backlinks.json` and note whether `referring_domains[i]` has `rank` (DFS, 0-1000) or `dr` (Ahrefs, 0-100). That determines the urgency of fix #3.
- **Trace how Liane's `qualitySummary` happened** — if analyze-backlink-quality.js was run manually once for her as a one-off experiment, there may be tribal knowledge about why (calibration? A/B test? forgotten initiative?). Worth a git-blame on when that run happened.
- **Inspect `pages/backlink-opportunities.js` + `pages/links.js`** to confirm what UI elements depend on `domainQuality` / `qualitySummary`. If renderers have null-safe fallbacks to a "no quality data" state, the wire-in is additive; if not, we're shipping new UI for old clients that may have gaps.

---

## Additional Information

### Tier 3 Fix 7 — wired into the skill (commit `543cfc2`, 2026-04-23)

`commands/seo-audit.md` now invokes `node scripts/analyze-backlink-quality.js`
after `gather-backlinks.js` and BEFORE `populate-audit-data.js` (Step 5.5
section). Step 1.5 auto-sync covers the new invocation — every file under
`template/scripts/` is recursively synced into `clients/<name>/scripts/` on
each `/seo-audit` run, so the script becomes available to every client.

The new sub-step documents the script's no-input tolerance: if `gather-backlinks.js`
skipped (DFS budget cap, missing competitor list, etc.), the script prints
`"No backlink files found to analyze."` and exits 0 — surface as a warning,
do NOT abort the audit.

**Pre-requisite (commit `920807a`):** `analyze-backlink-quality.js` was
present in `/root/site-audit/template/scripts/` but had **never been committed
to git** — so the fix-work clone didn't have it at all, and the GitHub repo
didn't either. Re-imported from the parent working tree before Tier 3 began,
to make the wire-up commit meaningful.

**Renderer is designed for the JS-script output shape, not the Python one.**
`generate-multipage-report.js:2230-2260` reads `cb6d.qualitySummary.analyzedAt`
from the **research file** (`seo/research/client-backlinks.json`), which is
exactly what this script writes. The Python-side `qualitySummary` writer at
`platform/src/audit_platform/analyzers/backlinks.py:122` writes to
`audit-data.json` instead — a path the multipage renderer doesn't consume.
Net: the JS classifier is the production write path; the Python classifier
is dead in the render pipeline. Reconciliation deferred to Fix 15.

### Verification on matt-wallmow

- Pre-fix: 0 occurrences of `qualitySummary` in `client-backlinks.json`.
- Post-fix (one manual run): 706 referring domains classified across 6 files
  (client + 5 competitors). 1 legit / 35 spam for the client; 219 / 194 totals.
  All 6 files gained `*.json.bak` backups.
- Missing-input variant (empty `seo/research/`): exits 0 with the documented
  warning. Confirmed in `/tmp/fix7-empty`.
