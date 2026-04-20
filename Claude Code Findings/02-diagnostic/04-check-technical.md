# Deep Dive #4 — `template/scripts/check-technical.js`

**File:** [`template/scripts/check-technical.js`](/root/site-audit/template/scripts/check-technical.js) (118 lines)
**Layer:** 02 — Diagnostic / single-URL tech audit
**Cross-reference:** [`codex findings/02-data-gathering/07-check_technical.md`](/root/site-audit/codex findings/02-data-gathering/07-check_technical.md) (138 lines)
**Template-vs-client drift:** None across `matt-wallmow`, `liane-jamason`, `laura-willis`, `chris-nevada` (byte-identical).
**Template-vs-skill drift:** **YES — skill inline is a reduced, placeholder-hardcoded version.** See §6.
**Date:** 2026-04-18

---

## 1. Purpose

Single-URL Playwright technical-SEO triage tool. Emits seven stdout sections per run: schema (JSON-LD), image alt coverage, social meta (OG + Twitter), page technical signals (DOM size, script/stylesheet/iframe counts, viewport, charset, lang, favicons), hreflang, canonical, heading structure. Intended for operator use and agent-driven verification of a single page's technical surface. Registered as `npm run check` in `template/package.json:9`.

**Not a pipeline producer** — everything goes to stdout. Significant overlap with `crawl-sitemap.js` which runs similar checks across every analyzed page (codex flagged the overlap).

## 2. Inputs

**CLI:**

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<url>` | positional | — **required** | Target URL (protocol optional; script prepends `https://` if missing) |
| `--headed` | bool | false | Visible browser; `slowMo: 500` |

**Env vars:** None.
**Files read:** None.

## 3. Outputs

**stdout, seven labeled sections:**

1. `=== SCHEMA/STRUCTURED DATA ===` — JSON-stringified array of parsed JSON-LD blocks (with raw text fallback if parse fails)
2. `=== IMAGE ALT TEXT ANALYSIS ===` — `{total, missingAlt, sampleMissing[10], sampleWithAlt[5]}`
3. `=== SOCIAL META TAGS ===` — flat object keyed by `og:*` / `twitter:*` property names
4. `=== PAGE TECHNICAL DATA ===` — `{totalDomElements, totalScripts, totalStylesheets, totalIframes, viewport, charset, lang, favicons[]}`
5. `=== HREFLANG TAGS ===` — array of `{hreflang, href}`
6. `=== CANONICAL TAG ===` — URL string OR literal `'MISSING'`
7. `=== HEADING STRUCTURE ===` — `{h1: {count, text[5]}, h2: {...}, ..., h6: {...}}`

**No file artifacts. No JSON mode. Exit 0 on success, exit 0 on caught error.**

## 4. Annotated walk

**Lines 6-11 — Arg parse.** Positional URL required. Unlike `browse.js`/`ddg-search.js`, no other flags beyond `--headed`.

**Line 14 — Protocol normalization.** `url.startsWith('http') ? url : 'https://${url}'`. Accepts bare `example.com`, prepends `https://`. Note `startsWith('http')` also matches `http://` as-is (good) but also `httpfoo` (degenerate edge case). Safe for practical inputs.

**Lines 16-19 — Browser launch.** Same as siblings: headless with optional `--headed` + slowMo. **No user-agent override, no viewport override** — uses Playwright defaults (which differ across versions — slightly inconsistent with `browse.js` and `ddg-search.js`, which *do* set UA+viewport).

**Line 20 — `browser.newPage()`.** Unlike `browse.js`, **does NOT create a browser context**. This means no control over UA, locale, viewport, device scale. A real latent inconsistency with the rest of the diagnostic tools.

**Line 23 — `page.goto`.** `waitUntil: 'domcontentloaded'` (not `networkidle`). DOMContentLoaded fires before subresources load; the script relies on the hardcoded 5s wait afterward to compensate. This is **faster** than browse.js/ddg-search.js approach but can miss late-injected schema scripts.

**Line 24 — `waitForTimeout(5000)`.** **Hardcoded 5s wait.** Not flag-configurable. Fine for most sites; wasteful for fast ones.

**Lines 27-34 — Schema extraction.** `script[type="application/ld+json"]` — the standard JSON-LD selector. **Graceful parse fallback** (line 30): if JSON.parse throws, returns raw `textContent`. That means `schemas[]` can be an array of **mixed types** (parsed objects + raw strings) — downstream parsers need to handle both.

**Lines 37-47 — Image alt analysis.**
- Line 39: **`!i.alt || i.alt === ''`** — treats empty-string alt and missing alt as "missing". **Does NOT catch whitespace-only alt** (`alt="   "`). Same small defect as other alt-checkers in the codebase.
- Line 40: Segregates images WITH alt text (for sample display).
- Line 44: Samples 10 missing-alt URLs (truncated to 100 chars).
- Line 45: Samples 5 with-alt pairs `{src, alt}`.
- **Decorative images treated same as content images** — no recognition of `role="presentation"` or `alt=""` as intentionally empty (per WCAG, empty alt on decorative images is correct). So a site that properly marks decorative imgs gets flagged.

**Lines 52-58 — Social meta.** Selector `meta[property^="og:"], meta[name^="twitter:"]`. Returns flat object. Edge case: a page with multiple `og:image` (gallery) only keeps the last one (object key collision).

**Lines 63-76 — Page technical.**
- Line 65: `document.querySelectorAll('*').length` — total DOM elements. Google Core Web Vitals guidance: <1500 for best INP; >3000 starts impacting rendering. But the script **doesn't flag this threshold** — just reports the number.
- Lines 66-68: Counts. No flagging either.
- Line 69: viewport — important for mobile. Reports raw content string; doesn't validate.
- Line 70: **charset** — queries only `meta[charset]`. Misses legacy `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">`. Low risk modern sites.
- Line 71: `documentElement.lang` — important for multilingual / Canadian bilingual sites.
- Line 72: Favicons extracted but never used (decorative output only).

**Lines 79-86 — Hreflang.** Simple list. No validation (e.g., doesn't check if declared hreflangs are symmetric or valid language codes).

**Lines 89-94 — Canonical.** Literal `'MISSING'` as the string fallback (not null, not empty). Consumers parsing stdout need to recognize the literal.
- **No canonical-vs-URL comparison** — doesn't flag a page where canonical points to a different URL (the most common canonical bug).

**Lines 97-107 — Heading structure.**
- Enumerates h1–h6. For each: `{count, text[first 5]}`.
- **Does NOT validate heading hierarchy** — doesn't flag `h1 → h3` skipping h2.
- **Does NOT flag multiple H1s** as an issue (just reports count).

**Lines 111-115 — Error handling.** Same pattern as browse.js/ddg-search.js: catch, log message, close browser, exit 0 on error. Failures are invisible from exit code.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | seo-audit.md:254-277 | **Skill inline drift.** Inline copy is dramatically reduced: hardcoded `TARGET_URL = 'https://www.CLIENT_DOMAIN_HERE/'`, no CLI arg, **no canonical check, no heading structure, no favicons, no charset**. An agent creating from inline gets a much weaker tool. Same issue class as ddg-search.js #3. |
| 2 | **H** | — | **No issue flagging / thresholding.** Data is reported but not interpreted. `totalDomElements: 4800` prints without flagging it's bad. `missingAlt: 120` prints without severity. An agent reading stdout gets raw numbers — any "issue" interpretation is agent judgment, not script analysis. |
| 3 | **H** | 89-94 | **No canonical-vs-URL comparison.** Real canonical bugs (canonical points to wrong URL, canonical chain, canonical-to-redirect) are undetected. Script just prints whatever the tag says. |
| 4 | **M** | 20, 23 | **No `newContext()`, no UA/viewport override.** Inconsistent with `browse.js` (1920×1080 + Chrome 120) and `ddg-search.js`. A site rendering different content for bot UAs would show inconsistent results across these three diagnostic tools. |
| 5 | **M** | 24 | **Hardcoded 5s wait.** Compensates for `domcontentloaded` vs `networkidle`. Lengthens every check; not flag-configurable. |
| 6 | **M** | 39 | **Empty-alt detection misses whitespace-only alt.** `alt="   "` passes the non-empty check. Also: no recognition of `role="presentation"` or intentional `alt=""` on decorative imgs — WCAG-correct sites will still get flagged. |
| 7 | **M** | 70 | **Charset detection misses `http-equiv` form.** Legacy sites with `<meta http-equiv="Content-Type">` report `charset: null`. Low impact modern sites. |
| 8 | **M** | 54-56 | **Social meta last-write-wins on duplicates.** Page with multiple `og:image` (gallery) drops all but the last. |
| 9 | **M** | 97-107 | **No heading-hierarchy validation.** Skipped heading levels (h1→h3) not flagged. Multiple H1s not flagged. |
| 10 | **M** | 111-115 | **Exit 0 on error** (same as browse.js / ddg-search.js). |
| 11 | **L** | — | **Overlaps with crawl-sitemap.js.** Schema, alt, social, canonical, heading extraction exists in both files. Two implementations can drift. Codex flagged this. |
| 12 | **L** | 79-86 | **No hreflang symmetry/validity check.** Declared `fr-CA` but site's root has `lang="en-US"`? Not flagged. Invalid codes? Not flagged. |
| 13 | **L** | 30 | **Schema parse fallback leaks raw text into array.** Consumers parsing stdout JSON must handle mixed array of `object | string`. If an agent passes this to another JSON consumer, it may trip. |
| 14 | **L** | — | **Stdout format is brittle banner-parsing contract**, same as browse.js/ddg-search.js. No `--json` mode. |
| 15 | **L** | 14 | **`startsWith('http')` also matches `httpfoo`** — degenerate but imprecise. `startsWith('http://') || startsWith('https://')` would be tighter. |

## 6. Integration map

**Registered in `template/package.json:9`** as `"check": "node scripts/check-technical.js"` — invoked via `npm run check -- <url>`.

**Called by:**
- **site-crawler agent** (Step 4 Agent 2 of `/seo-audit`, `seo-audit.md:358`) — for homepage deep dive after crawl
- **Operator CLI** — quick tech triage

**NOT called by:**
- Any other Node script via `require()`
- Python platform
- Normalizer/generator/renderers

**Contract with consumers:** plain-text banner format; agent must parse sections by header strings. Sections #1, #2, #3, #4, #5, #7 emit valid JSON; section #6 (canonical) emits either URL string OR literal `'MISSING'`. Agents relying on uniform JSON need special-casing.

**Skill drift (§5 bug #1) detailed comparison:**

| | Template (`check-technical.js`) | Skill inline (`seo-audit.md:256-277`) |
|---|---|---|
| Lines | 118 | 22 |
| URL input | CLI arg `args[0]` | Hardcoded `TARGET_URL` with `CLIENT_DOMAIN_HERE` placeholder |
| `--headed` support | Yes | No |
| Schema check | Yes | Yes |
| Image alt check | Yes + sampleWithAlt | Yes (no with-alt sample) |
| Social meta | Yes | Yes |
| Technical data | Yes + charset + favicons | No charset, no favicons |
| Hreflang | Yes | Yes |
| **Canonical check** | ✅ Yes | ❌ **Missing** |
| **Heading structure** | ✅ Yes (h1-h6 with sample text) | ❌ **Missing** |
| Client edits needed before use | No | **Yes** (replace `CLIENT_DOMAIN_HERE`) |

When a fresh client audit falls back to the inline template (Step 2 failure to copy from `template/`), the resulting check-technical.js **silently loses canonical + heading validation**. That's a real quality-of-audit hit on the Technical page of the final report.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Resolve skill inline drift (bug #1).** Same fix as ddg-search.js / browse.js: replace inline with a one-line reference to the template. One source of truth.
2. **Add issue flagging + severity (bug #2).** Script should emit flagged issues list: `{id, severity, detail}` alongside raw data. Matches what `crawl-sitemap.js` already does. Extract into a shared helper (fixes bug #11 at the same time).
3. **Add canonical-vs-current-URL check (bug #3).** Three lines: compare resolved canonical href against the URL loaded. Flag mismatch.
4. **Add heading-hierarchy validation (bug #9).** Detect skipped levels, multiple H1s. Matches crawl-sitemap.js behavior.
5. **Unify Playwright context setup with browse.js/ddg-search.js (bug #4).** Create a shared `lib/playwright-context.js` helper with UA + viewport + locale defaults. Fixes inconsistency across three diagnostic tools.
6. **Add `--json` mode (bug #14).** Output one JSON blob. Downstream agents stop banner-parsing.
7. **Exit non-zero on error (bug #10).** One-liner.
8. **Extract shared alt/schema/meta helpers to `lib/dom-extractors.js`** — eliminates overlap with crawl-sitemap.js (bug #11). Bigger refactor; do after the skill drift is resolved.
9. **Improve whitespace-alt + role-presentation detection (bug #6).** Small fix; better WCAG-correct audit behavior.

## 8. What to verify before we touch this file

- **Diff current client check-technical.js against the skill inline** (same sweep we'll run for all three diagnostic tools). If any client was generated fresh in Step 2 without the template copy, their copy will match the inline stub — which means their canonical + heading audit is missing in source output.
- **Search for agent prompts that reference `=== SCHEMA/STRUCTURED DATA ===` or other banners** in `commands/seo-audit.md` — those are parser contracts that constrain format changes.
- **Confirm crawl-sitemap.js's behavior for canonical/heading** — we're about to deep-dive it (#5) and we want the shared helper refactor to cover whatever it does.
