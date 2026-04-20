# Deep Dive #6 — `template/scripts/extract-text.js`

**File:** [`template/scripts/extract-text.js`](/root/site-audit/template/scripts/extract-text.js) (204 lines)
**Layer:** 03 — API / data gathering (Playwright re-crawl for readability metrics)
**Cross-reference:** [`codex findings/02-data-gathering/04-extract_text.md`](/root/site-audit/codex findings/02-data-gathering/04-extract_text.md) (145 lines)
**Template-vs-client drift:** **YES — `calgary-castles` + its Backup are a 275-line fork.** See §6.
**Template-vs-skill drift:** No inline stub in the skill — `/seo-audit` at `seo-audit.md:724` just invokes the real script (with `--limit 50`). Clean on that axis.
**Date:** 2026-04-20

---

## 1. Purpose

The readability enrichment pass. Reads a URL list from `crawl-data.json`, re-navigates every URL in Playwright, strips boilerplate, and writes Flesch-Kincaid + word/sentence/syllable stats to `research/page-text-analysis.json`. That JSON is consumed by:

- `build_audit.py` (ContentQualityAnalyzer / `_merge_page_text_analysis`) — used to override wordCount and readability on crawl pages before content scoring.
- `generate-multipage-report.js` normalizer at lines **1349-1565** and **2717-2720** — enriches `contentQuality.pages[].readability` with `fleschReadingEase`, `fleschKincaidGrade`, `wordCount`, `avgSentenceLength`, `avgSyllablesPerWord`, `readingLevel`. Drives the Content page's **Readability Analysis** table.

The script is narrow in scope but a hard contract with the normalizer: the normalizer reads `pta.avgSentenceLength` specifically (line 1474), not `avgWordsPerSentence`, which is why the script emits both fields as aliases (line 73).

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `--input <path>` | flag+value | `seo/research/crawl-data.json` | Source of URLs. Resolved relative to CWD. |
| `--limit <N>` | flag+value | **50** | Hard cap on URLs processed. **Silent** — no warning if URLs > limit. |

**Env vars:** None.
**Files read:** `crawl-data.json` (resolved at line 92-94).
**Network:** Re-fetches every URL via Playwright Chromium.

**Accepted crawl-data.json shapes** (lines 103-109):
1. `crawlData.pages[].url` — primary (template crawl output)
2. `crawlData.urls[]` — legacy fallback
3. `crawlData` as an array — even more permissive fallback

## 3. Outputs

Written to `seo/research/page-text-analysis.json` (relative to CWD — line 195).

```
{
  pages: [{
    url, title, wordCount, sentenceCount, syllableCount,
    fleschReadingEase, fleschKincaidGrade,
    avgWordsPerSentence, avgSentenceLength, avgSyllablesPerWord
  }],
  summary: { totalPages, avgFleschReadingEase, avgFleschKincaidGrade, avgWordCount },
  errors: [{ url, reason }],
  status: "success" | "partial" | "failed",
  gatheredAt: ISO timestamp
}
```

`avgWordsPerSentence` and `avgSentenceLength` are the **same value with two names** (line 72-73) — purely to satisfy the normalizer, which reads `avgSentenceLength` (gen-multipage:1474).

**Exit code:** 0 on success, 1 on fatal (no Playwright, no input file, no URLs found). Per-URL errors recorded in `errors[]` and status downgrades to `"partial"`.

## 4. Annotated walk

**Lines 30-39 — `countSyllables(word)`.** Cheap heuristic:
1. Lowercase, strip non-alpha.
2. `word.length <= 2` → 1 (covers "a", "I", "we", "am"; mis-fires on "by", "go" → should be 1 anyway).
3. Strip trailing `e` (silent-e heuristic).
4. Count vowel groups (`/[aeiouy]+/g`).
5. Return `max(1, count)`.

Correct on most 1-3 syllable words. **Misfires systematically on:**
- Words ending in `le` after a consonant ("little", "apple" → strips no `e` → counts `i`+`e` / `a`+`e` = 2 — lucky correct). Wait: `little` → `littl` (no trailing e yet; `replace(/e$/)` only strips one `e` at end) → actually `little` ends in `e`, strips to `littl` → matches `i` → 1 syllable. **Actual "lit-tle" = 2.** Bug.
- Words with `es` / `ed` endings: "walked" → `walked` (doesn't end in `e`) → matches `a`+`e` = 2. **Actual "walked" = 1.** Overcount.
- Words ending in `y` acting as vowel: "happy" → `happ` (strips `y` of…wait, `/e$/` only strips `e`) → `happy` → matches `a`+`y` = 2. Actual = 2. OK.
- Words with consecutive same vowel: "tree" → `tre` → matches `e` → 1. Actual = 1. OK.

Net effect: a systematic **overcount by ~5-10%** on English text (mostly from `-ed`, `-le`). Inflates `avgSyllablesPerWord` → deflates `fleschReadingEase` → makes sites look *harder* to read than they are. Calgary fork (§6) has a smarter `countSyllables` that strips `[^laeiouy]es|ed|[^laeiouy]e` and caps at 1-2 vowel group matches.

**Lines 41-76 — `analyzeText(text)`.**

- **Line 43 — sentence splitter:** `text.split(/[.!?]+/)`. Splits on ANY `.!?` regardless of context. Abbreviations inflate count: "U.S. Route 66 is in America." → 3 "sentences" (`U`, `S`, ` Route 66 is in America`). Decimal numbers too: "3.5% of users" → 2 sentences. **Systematic overcount of sentenceCount → underestimate of avgWordsPerSentence → inflate Flesch Reading Ease.**
- Line 43 `.filter(s => s.trim().length > 0)` — drops empty strings but keeps fragments. Calgary fork adds `&& s.split(/\s+/).length >= 2` which catches abbreviations better.
- Line 44 `Math.max(1, sentences.length)` — avoids divide-by-zero.
- Line 47 — word split on `\s+`, filter to alpha-containing tokens. Good: strips pure-punctuation tokens.
- Line 49 — early-return `null` if `wordCount === 0` so empty pages get skipped (line 151 `if (metrics)`).
- Lines 60-64 — standard Flesch formulas applied correctly.
- Line 73 — **`avgSentenceLength: avgWordsPerSentence`** — the alias for the normalizer. Critical; do not remove.

**Lines 78-85 — Playwright lazy-import.** Good pattern: doesn't fail at file-parse time if Playwright missing.

**Lines 87-99 — CLI parsing.**
- Line 89 `parseInt(args[limitIdx + 1], 10)` — no bounds check. If `--limit` is last arg, `args[limitIdx+1]` is `undefined`, `parseInt(undefined, 10)` = `NaN`. Then line 116 `urls.slice(0, NaN)` returns `[]` → line 111 empty-check → `process.exit(1)`. **Silent fail if user miswrites the flag.** Same bug family as `crawl-sitemap.js:279` (finding #5 #17).
- Line 92-94 — `--input` resolved with `path.resolve` off CWD, NOT `__dirname`. Running from the wrong directory silently picks the wrong file or fails hard. Inconsistent with `crawl-sitemap.js:455` which uses `__dirname`.

**Lines 101-114 — URL extraction.** Three fallback shapes (§2). Exits 1 if none match.

**Line 116 — `urls.slice(0, limit)`.** The silent cap. Default is 50. **No warning if `urls.length > limit`** — just a stderr line "Processing N of M URLs" on line 117, which is informational only. A site with 83 URLs gets the first 50 and the user doesn't get flagged about the 33 missing.

**Lines 119-120 — Browser launch.**
- Line 120 `userAgent: 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)'` — **outlier UA.** Every other diagnostic script (`crawl-sitemap.js:287`, `browse.js`, `ddg-search.js`) sends a real Chrome UA. An explicit "SEOAuditBot" UA can trip Cloudflare Super Bot Fight Mode, Akamai, or CDN-level bot filters — silent rejection or 403. Sites with such protection would show as all-errored even though they're reachable from every other diagnostic.
- No viewport configured. Playwright's Chromium default applies. Rendering-dependent JS or responsive hide-on-mobile could affect `textContent`.

**Line 124-163 — Per-URL loop.** Sequential, no concurrency.

- Line 129 `context.newPage()` — new page per URL. Good hygiene (state isolation) but slow: page creation + close add ~200ms per URL.
- Line 130 `waitUntil: 'networkidle'`, `timeout: 30000`. Aggressive 30s timeout (vs 20s in crawl-sitemap analyze). Good.
- Lines 133-144 — Boilerplate removal in the browser.
  - Removes: `script, style, noscript, nav, footer, header, aside, .nav, .footer, .header, .sidebar`.
  - **MISSES:** `.site-header`, `.primary-menu`, `.widget-area`, `#sidebar-primary`, `div.nav-wrapper`, `[role="navigation"]`, `[role="banner"]`, `[role="contentinfo"]`, cookie banners (`#cookie-notice`), consent modals (`.gdpr-`), inline schema blocks inside `<div>`, WordPress admin bar when logged in.
  - **Uses `textContent`** (line 142). This pulls `display:none`/`visibility:hidden`/`hidden` text, including mega-menu contents, hover-revealed dropdowns, modal dialogs, and SR-only text. **Direct source of word-count inflation.** Calgary fork uses `innerText` instead (respects rendering).
  - Doesn't prefer `<main>` / `<article>` / `<section>` — just mass-strips from `document.body`. Any site that nests main content deep inside presentational wrappers will have that content captured, but so will sibling widgets like "related posts," "popular tags," etc.
- Line 148 `analyzeText(result.text)` — the readability math.
- Line 151 — empty-text pages pushed into pages array with all metrics only if `metrics !== null`. Those where extraction fell through are silently dropped (no errors row added).
- Lines 154-157 — catch-all `err` → `errors.push`. Reasonable.
- Line 160-162 — 500ms hardcoded rate limit. **No flag override.** On a 50-URL run: 50 × (~3s load + 0.5s wait + ~0.3s create/close) ≈ 3 minutes. For 500 URLs: 30+ minutes serially.

**Lines 167-175 — Status derivation.**
- `errors.length === 0` → `"success"`
- `pages.length === 0 && errors.length > 0` → `"failed"`
- Else → `"partial"`
- **Missing case:** `pages.length === 0 && errors.length === 0` (e.g., every page had zero words or extraction returned null). Falls into the `else` → reports `"partial"` even though nothing happened and no errors were raised. Consumers of `status` can't distinguish "nothing-to-see" from "some-errors-but-data-recovered."

**Lines 178-180 — Summary reductions.** If `pages` is empty, all averages are 0. `avgFleschReadingEase: 0` is a VALID (very hard-to-read) score. Downstream consumer cannot distinguish "no data" from "worst possible score." Would be safer to emit `null` when no pages.

**Lines 195-201 — Output.** `mkdir -p`, non-atomic `fs.writeFileSync`, `console.error` status line. Crash mid-write corrupts the file (same pattern as crawl-sitemap.js:461, finding #5 #19).

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 89, 116 | **Silent `--limit 50` default.** Default cap hard-drops any URL beyond the 50th. No warning, no issue-flag, no `errors[]` row, no `skipped[]` array. `/seo-audit` skill at `seo-audit.md:724` runs `--limit 50` explicitly — double-locked. A site with 51-200 pages gets partial readability data and the normalizer computes averages on a truncated set. |
| 2 | **H** | 135, 142 | **Boilerplate stripping is shallow + `textContent` pulls hidden text.** Fixed selector list misses modern site chrome (`.site-header`, `.widget`, `[role="navigation"]`, cookie banners). `textContent` ignores CSS `display:none` and `hidden` attributes, so mega-menu dropdowns and SR-only text land in the content pool. Inflates `wordCount`, deflates `fleschReadingEase`. Systematic across all non-real-estate clients. |
| 3 | **H** | 43 | **Sentence splitter breaks on abbreviations and decimals.** `text.split(/[.!?]+/)` treats `U.S.` and `3.5` as sentence boundaries. Inflates sentenceCount → deflates avgWordsPerSentence → inflates Flesch score. Bias direction is "sites look easier than they are." |
| 4 | **H** | 30-39 | **Syllable counter undercounts `-le` and overcounts `-ed`.** `little` → 1 syllable (actual 2). `walked` → 2 (actual 1). Net ≈ 5-10% overcount across typical English copy → inflates `avgSyllablesPerWord` → deflates Flesch. Calgary fork at `clients/calgary-castles/scripts/extract-text.js:19-24` has a superior version (strips `[^laeiouy]es|ed|[^laeiouy]e`, caps vowel matches). |
| 5 | **H** | — | **Upstream-bound contract failure (not this file's fault but caps its value).** `extract-text` reads URLs from `crawl-data.json`, which the `/seo-audit` skill's Agent 2 overwrites after `crawl-sitemap.js --analyze` runs. That agent's curated 11-page list (see finding #5 §5 and today's Matt Wallmow lens) becomes the universe `extract-text` sees. **Evidence:** Matt Wallmow has 40 content pages in his sitemap but `page-text-analysis.json` has exactly 11 — same 11 pages the agent kept in `crawl-data.json`. This script CAN'T do better than its upstream. Fix belongs in `seo-audit.md`. |
| 6 | **H** | — | **Client drift: `calgary-castles` + its Backup are a 275-line fork with an incompatible output shape.** Missing `summary`, `status`, `errors`, `gatheredAt`. Adds `crawlDate`, per-page `bodyText` (first 500 chars), `paragraphCount`, `readabilityLevel`, `scoreExplanation`. Also: **hardcoded Calgary community slugs** in `buildExplanation()` lines 82-90 (`auburn-bay|bridlewood|chaparral|...`) — NOT portable to other clients. The normalizer still works because key per-page fields match, but `status/errors/summary` absence means partial failures go unreported. |
| 7 | **M** | 120 | **Outlier "SEOAuditBot" user agent.** Every other diagnostic uses a real Chrome UA. Cloudflare Super Bot Fight Mode, Akamai Bot Manager, and many WAFs will 403 "SEOAuditBot" outright. All-errored output on protected sites would look like a site outage, not a UA choice. |
| 8 | **M** | 119-120 | **No viewport configured.** Playwright default varies across releases. Responsive hide-on-mobile text may or may not appear in `textContent`. Inconsistent with `browse.js` / `ddg-search.js` which set explicit viewports. |
| 9 | **M** | 129 | **New page per URL.** ~200ms overhead per URL beyond network cost. Alternative: reuse one page, `page.goto()` between URLs. Minor but compounds over 500-URL sites. |
| 10 | **M** | 160-162 | **Hardcoded 500ms rate limit + serial processing.** No `--concurrency` or `--delay` flag. 50-URL run ≈ 3 min; 500-URL run ≈ 30 min. Fine for one-off, hostile for dev iteration. |
| 11 | **M** | 133 | **No `main`/`article`/`section` preference.** Strips boilerplate from full `document.body`. Calgary fork tries `main → article → section → body` before falling back. Main-content selection would reduce widget/sidebar pollution on WordPress/Shopify/Wix. |
| 12 | **M** | — | **Duplicate fetch cost.** `crawl-sitemap.js --analyze` has already loaded every page and captured its HTML. This script re-fetches. Could be refactored to read extracted text from `crawl-data.json` if crawl-sitemap emitted it. Codex finding flags this (#108). |
| 13 | **M** | 167-175 | **Missing status case.** `pages.length === 0 && errors.length === 0` (all pages had unextractable text) reports `"partial"` — should be `"empty"` or similar. |
| 14 | **L** | 89 | **No bounds check on `--limit`.** `--limit` without value → `NaN` → silent empty exit. Same pattern as `crawl-sitemap.js` finding #5 #17. |
| 15 | **L** | 178-180 | **Empty-data averages are `0`, not `null`.** `avgFleschReadingEase: 0` is a valid (awful) score — indistinguishable from "no data." |
| 16 | **L** | 195-199 | **Non-atomic write.** Crash mid-write → corrupt JSON. Same pattern as crawl-sitemap.js. |
| 17 | **L** | 92-94 | **`--input` uses CWD, not `__dirname`.** Inconsistent with `crawl-sitemap.js:455` which uses `__dirname`. Running from the wrong directory → wrong file silently picked up. |
| 18 | **L** | 205 | **Exit 0 on main-catch error** — consistent with the "swallow-and-stderr" pattern across diagnostics, but means CI can't reliably detect fatal failures. |
| 19 | **L** | 61-64 | **No language detection.** Flesch formulas are English-specific. Spanish/French/German client → readability scores are noise. |

## 6. Integration map

**Invoked by:**
- `/seo-audit` skill, Step 5 at `seo-audit.md:724`: `node scripts/extract-text.js --limit 50`. No per-client override.
- Audit-log evidence: `[2026-04-15 04:16] page-text-analysis.json ✓` in Matt Wallmow's log — no flags logged.
- Nothing else invokes it (checked `platform/`, `template/`, `clients/*/scripts/`, `codex/`).

**Consumers of `page-text-analysis.json`:**

| Consumer | File:lines | Reads |
|---|---|---|
| `build_audit.py` → `_merge_page_text_analysis` | `platform/scripts/build_audit.py:197` | Per-page merged into `ContentQualityAnalyzer` input. Reads `wordCount`, readability fields. |
| `generate-multipage-report.js` normalizer | `template/reports/multipage/generate-multipage-report.js:1349-1565` | Builds index by URL (`ptaByUrl`), enriches `contentQuality.pages[].readability` with `fleschReadingEase`, `fleschKincaidGrade`, `wordCount`, `avgSentenceLength`, `avgSyllablesPerWord`, `readingLevel`, `sentenceCount`. Fallback path for `contentQuality` if Python didn't run. |
| `generate-multipage-report.js` contentQuality fallback | `template/reports/multipage/generate-multipage-report.js:2717-2720` | Loads raw `page-text-analysis.json` if `contentQuality.pages` is empty in audit-data.json. |
| `propagateApiErrors` | `template/reports/multipage/generate-multipage-report.js:1354` | Surfaces error rows into the report if `page-text-analysis.json` contains an `errors[]` array — so clipped/misshaped output from the calgary-castles fork silently loses error surfacing. |

**Contract imposed on consumers:**
- `pages[].url` must be a string URL matching `contentQuality.pages[].url` for the normalizer's URL-index lookup (normalizer's `findByUrl` is trailing-slash-sensitive in some places — worth a separate audit on the normalizer itself; tracked for deep-dive #21).
- `pages[].avgSentenceLength` must be present (normalizer reads this name, not `avgWordsPerSentence`).
- `pages[].avgSyllablesPerWord` must be present (used directly in the Readability Analysis table — see finding note, normalizer line 1472).
- `pages[].fleschReadingEase` / `fleschKincaidGrade` — numerics, unit-consistent.
- `summary.*` fields — currently read by nothing in the normalizer (only per-page is consumed). So the calgary fork's absent `summary` block is harmless in practice but technically contract-violating.
- `errors[]` — consumed by `propagateApiErrors` to display error rows. Missing in calgary fork → error transparency lost.

**Drift table:**

| Version | Lines | `--limit` | `--input` | Syllable algo | Boilerplate | Content extraction | `innerText` | Output `summary/status/errors` | Extra per-page fields |
|---|---|---|---|---|---|---|---|---|---|
| Template | 204 | ✅ (default 50) | ✅ | Simple | 10 selectors | body | ❌ (textContent) | ✅ | — |
| matt-wallmow | 204 | = template | = template | = template | = template | = template | = template | ✅ | — |
| laura-willis | 204 | = template | = template | = template | = template | = template | = template | ✅ | — |
| liane-jamason | 204 | = template | = template | = template | = template | = template | = template | ✅ | — |
| chris-nevada | 204 | = template | = template | = template | = template | = template | = template | ✅ | — |
| **calgary-castles** | **275** | ❌ (no flag) | ❌ (hardcoded) | Richer (strips -es/-ed) | 20+ selectors incl. `[class*="menu"]` | main → article → section → body | ✅ | ❌ (`crawlDate` only) | `bodyText`, `paragraphCount`, `readabilityLevel`, `scoreExplanation` |
| Backup/calgary-castles | 275 | (identical to calgary fork) | | | | | | | |

**Skill-inline:** no inline stub. Just the invocation line.

**Direct impact on live clients:**
- **matt-wallmow**: page-text-analysis has 11 pages — matches his curated crawl-data.json (upstream bug #5). Readability averages are computed on 11 pages instead of the ~40 content pages his sitemap lists. **Not a defect of this script; it faithfully does its job on bad input.**
- **calgary-castles**: 36 pages processed (his crawl-data has 36; no `--limit` cap in his fork; all processed). Output missing `status/errors/summary` — if any page errored, the normalizer's error surfacing is blind to it. Worth a spot-check of his current report for silently-dropped pages.
- **No client is currently suffering from the template's `--limit 50` cap** because all their crawls produced ≤40 content pages. This is latent — the next client audited with 51+ content pages will hit it and the truncation will be invisible.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Make `--limit` opt-in, default unlimited.** Change line 89 to `const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;`. Also update the skill (`seo-audit.md:724`) to drop the `--limit 50`. Align with the user's goal of seeing "all pages." Add a `--limit` stderr warning when the cap is hit: `WARNING: capped at N of M URLs — use --limit 0 for full`.
2. **Upstream the calgary-castles improvements selectively** (without the Calgary-specific slug list):
   - Smarter syllable algo (fixes bug #4 directly).
   - Richer boilerplate removal (fixes bug #2).
   - `main → article → section → body` fallback (fixes bug #11).
   - `innerText` over `textContent` (fixes bug #2 second half).
   - `paragraphCount` metric — useful for the Readability Analysis table.
   - Do NOT upstream `buildExplanation()` — it's client-specific and the normalizer builds its own explanation UI.
3. **Fix the `/seo-audit` skill's Agent 2 overwrite** (cross-ref finding #5 §7 item 2 and today's Matt Wallmow lens). This script's output quality is bounded by `crawl-data.json` completeness. Fixing the overwrite will cascade: `extract-text` runs on the full page set, and readability averages become representative.
4. **Better sentence splitter** — use an abbreviation-aware regex or a `sentence-splitter` package. Quick win: `text.split(/(?<=[.!?])\s+(?=[A-Z])/)` for capital-letter-starts-sentence heuristic.
5. **Switch UA to real Chrome string.** Match `browse.js` / `crawl-sitemap.js` (bug #7). Zero-cost fix.
6. **Add `null` instead of `0` for empty-data averages** (bug #15). Consumers can then distinguish "no pages" from "unreadable pages."
7. **Add `"empty"` status** when pages=0 and errors=0 (bug #13).
8. **Atomic write** — write to `.tmp` then rename. Applies to all diagnostic scripts (tracked cross-cutting).
9. **Expose `--concurrency`** (default 3 or 5) and `--delay` flags. Keep defaults conservative; let the operator override for big runs.
10. **`--input` path resolution: prefer `__dirname`-based.** Aligns with crawl-sitemap.js and makes cross-directory invocation safe.
11. **Language check guard** — detect non-English and either skip readability or warn. Out of scope for current client base (all English), but worth a cheap lang-detect call (`<html lang>` attribute check) to avoid nonsense scores on the first i18n client.
12. **Read HTML directly from `crawl-data.json`** if crawl-sitemap.js is enhanced to emit it. Halves network cost on every audit. Requires crawl-sitemap.js change first.

## 8. What to verify before we touch this file

- **Re-run `/seo-audit` skill for Matt Wallmow with a patched Agent 2** (no crawl-data.json overwrite) and verify `page-text-analysis.json` goes from 11 pages to ~40. Smoke-tests bug #5 resolution.
- **Diff calgary-castles fork line-by-line** and categorize each delta as "upstream-worthy," "Calgary-specific," "incompatible." This finding categorizes the big ones but a line-by-line canonical diff belongs in the fix PR.
- **Spot-check calgary-castles' current report** for silent per-page errors (the fork drops `errors[]`).
- **Check platform/src/audit_platform/analyzers/content_quality.py** (deep-dive #51) for how it handles missing fields from `page-text-analysis.json` — `title` is absent in calgary fork; `wordCount` always present. Confirm no KeyError risk on the fork's output shape before touching anything upstream.
- **Check `_merge_page_text_analysis` in build_audit.py** — deep-dive #63 — for how it indexes by URL. If it's trailing-slash-sensitive, fork's URLs may miss matching → silent merge failure.
- **Grep for any other script that writes `page-text-analysis.json`** (should be just this one). Ensure no client has a custom writer that would conflict.
