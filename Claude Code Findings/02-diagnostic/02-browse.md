# Deep Dive #2 — `template/scripts/browse.js`

**File:** [`template/scripts/browse.js`](/root/site-audit/template/scripts/browse.js) (114 lines)
**Layer:** 02 — Diagnostic / single-URL inspection
**Cross-reference:** [`codex findings/02-data-gathering/06-browse.md`](/root/site-audit/codex findings/02-data-gathering/06-browse.md) (149 lines)
**Template-vs-client drift:** None — byte-identical in `matt-wallmow`, `liane-jamason`, `laura-willis` client scripts folders.
**Date:** 2026-04-17

---

## 1. Purpose

Interactive single-URL Playwright inspection utility. Operator or agent gives it a URL and flags; it navigates, optionally screenshots, and extracts one or more of: meta tags, headings, links, body text. **Every output mode prints to stdout** — no structured JSON file output. Registered as `npm run browse` in `template/package.json:6`.

Used most heavily by AI research agents in Step 4 of `/seo-audit`:
- **content-auditor** uses `--extract-text` to read page body for quality judgments
- **competitor-analyzer** uses `--extract-meta` and `--extract-headings`
- **site-crawler** uses `--extract-links` to verify link graph

## 2. Inputs

**CLI (positional + flags):**

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<url>` | positional | — **required** | Target URL |
| `--screenshot <filename>` | flag+value | null | Save PNG to `<filename>` |
| `--full-page` | bool | false | Capture entire scroll area (with `--screenshot`) |
| `--extract-links` | bool | false | Print all internal + external links |
| `--extract-text` | bool | false | Print body text (truncated to 5000 chars) |
| `--extract-meta` | bool | false | Print title/description/OG/canonical/H1s |
| `--extract-headings` | bool | false | Print all H1–H6 |
| `--headed` | bool | false | Show visible browser; adds `slowMo: 500` |
| `--wait <ms>` | flag+value | 2000 | Extra wait after `networkidle` |

**Env vars:** None.
**Files read:** None.

## 3. Outputs

**stdout (mode-dependent, not JSON by default):**
- `--extract-meta` → block headed `=== META DATA ===` followed by `JSON.stringify(..., null, 2)` — this is the only structured output mode
- `--extract-headings` → `H1: text`, `H2: text`, …
- `--extract-links` → summary line + two blocks `--- Internal Links ---` / `--- External Links ---`
- `--extract-text` → `=== PAGE TEXT ===` + up to 5,000 chars, then optional `... [truncated, total N chars]`

**File side effect:** Optional `.png` screenshot at the path passed to `--screenshot`.

**No structured exit contract:** process exits 0 on success **and on caught error** (see §5 bug #6).

## 4. Annotated walk

**Lines 6-11 — Arg parse.** Manual arg parsing; `url` is first positional. Exits with usage message if absent.

**Lines 13-22 — Flag parsing.** Hand-rolled `args.indexOf(flag) + 1` pattern — if a value flag like `--screenshot` is the last argument with nothing after it, `args[args.length]` returns `undefined` and the subsequent `page.screenshot({ path: undefined })` would error. No bounds check.

**Line 21 — `parseInt(args[...])` without radix.** Minor lint issue; ES spec mandates base-10 inference for strings without `0x` prefix, but `parseInt(..., 10)` is recommended style.

**Lines 24-27 — Browser launch.**
- `headless: !flags.headed` — inverted. Headed mode also adds `slowMo: 500` — artificial 500ms delay between actions for debugging.
- No `args: [--no-sandbox]` — not needed when run as non-root (but **will fail if run as root in a Docker container without the flag**).

**Lines 28-31 — Browser context.**
- **Hardcoded user-agent: Chrome 120 on Windows.** Does not rotate, does not match platform (running on Linux). Fine for most sites but may be flagged by aggressive bot detection (Akamai, Cloudflare Bot Management).
- **Hardcoded viewport 1920×1080.** No way to override for mobile rendering checks.

**Line 35 — `page.goto`.** `waitUntil: 'networkidle'` with **30 000 ms timeout**. Network-idle waits until no network activity for 500ms. On sites with long-polling WebSockets or persistent analytics (e.g., Hotjar, Segment), can time out. Timeout is hardcoded — no flag to override.

**Line 36 — `page.waitForTimeout(flags.wait)`.** Sleeps additional `--wait ms` (default 2000) after networkidle settled. So total wait before extraction: up to `30s + 2s = 32s`.

**Lines 43-62 — `--extract-meta`.** Uses `page.evaluate()` to run DOM queries in the browser context. Emits `JSON.stringify(..., null, 2)`. Extracts: title, description, og:title, og:description, og:image, canonical, robots, **all h1 texts (array)**.
- Note: `getMeta(name)` uses `meta[name=] , meta[property=]` OR selector — so `getMeta('og:title')` correctly finds `<meta property="og:title">`. Good.
- **Canonical extraction uses optional chaining** (line 55): `document.querySelector('link[rel="canonical"]')?.href` — Node 14+ required.

**Lines 64-74 — `--extract-headings`.** Selects h1-h6, emits `{tag, text}` pairs. Text is trimmed but not sanitized of internal whitespace. Prints with `console.log` — one line per heading.

**Lines 76-94 — `--extract-links`.** Maps `<a[href]>` to `{text (first 100 chars), href, isInternal, isExternal}`.
- **Classification bug (codex noted):** `a.href.includes(window.location.hostname)` — e.g., if hostname is `example.com`, then a link to `https://notexample.com/tracker?redirect=example.com` is classified as **internal**. Also: `external` excludes mailto:, tel:, javascript:, # anchors (they don't start with http). Correct exclusion but both conditions loose.
- **Dedup by href** (line 89, 92): `new Map(arr.map(l => [l.href, l]))` — keeps first occurrence of each URL; drops text variants.
- No hostname normalization (www vs non-www treated as different).

**Lines 96-105 — `--extract-text`.** Clones `document.body`, removes only `script, style, noscript`. Replaces whitespace with single space, trims. **Does NOT remove `nav, header, footer, aside`** — unlike `extract-text.js` which does. See §5 bug #1.
- **Truncates display to 5000 chars.** Variable `text` holds full text but caller can only see first 5000 via stdout. If an agent is judging content quality on a 10,000-word page, it only sees ~5000 chars.

**Lines 107-111 — `try/catch/finally`.**
- `catch` logs error to stderr and falls through.
- `finally` closes browser.
- **Does NOT set a non-zero exit code on error.** Process still exits 0 (line 114, `main()` returns void, default exit code 0). Callers checking `$?` cannot detect failure.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 96-105 | **Text extraction does NOT strip `nav/header/footer/aside`.** Content-auditor agent (Step 4 Agent 3 of `/seo-audit`) uses this for quality judgments. Result: nav/footer text is counted in word count, dilutes keyword density observations, inflates "page length". This is a real source of the content-auditor hallucination noted in AUDIT-SOP §1.2. **Inconsistent with `extract-text.js`**, which strips those tags correctly. |
| 2 | **H** | 103-104 | **5,000-char truncation on text output.** An agent reviewing a long community page only sees the first ~5,000 characters. Beyond that, `[truncated, total N chars]` is the only signal. Means any content analysis of long pages is incomplete. |
| 3 | **M** | 81 | **Internal-link classification uses `includes()`**: misclassifies `https://notexample.com/?redirect=example.com` as internal. Also: no www normalization, no subdomain handling. Fix: `new URL(a.href).hostname.replace(/^www\./,'') === window.location.hostname.replace(/^www\./,'')`. |
| 4 | **M** | 107-111 | **No non-zero exit code on caught errors.** Agent or pipeline cannot detect failure from exit status. Fix: `process.exit(1)` in the catch. |
| 5 | **M** | 29 | **Hardcoded Windows Chrome 120 UA.** Doesn't match platform. Aggressive bot detection (Cloudflare, Akamai) may serve different/blocked content. No override flag. |
| 6 | **M** | 30 | **Hardcoded 1920×1080 viewport.** Mobile rendering not inspectable. No `--viewport mobile` / `--mobile` flag. |
| 7 | **M** | 35 | **30s networkidle timeout is hardcoded.** Sites with persistent connections (WebSockets, analytics) never reach networkidle. Timeout should be flag-overridable. |
| 8 | **M** | 96-105 | **stdout is not JSON (except `--extract-meta`).** Agents parsing stdout are parsing text blocks with header markers like `=== PAGE TEXT ===`. If the header text ever changes (reformat, capitalization, emoji), all downstream agents break simultaneously. Codex flagged this (§"No structured output mode"). Fix: add `--json` flag that unifies all modes into a single JSON object on stdout. |
| 9 | **L** | 14 | **No bounds check on `args[indexOf + 1]`** — if value flags are last and missing their value, `undefined` silently flows through. Low risk but caller-hostile. |
| 10 | **L** | 26 | **`slowMo: 500` in headed mode.** Intentional but undocumented — debugger-only behavior that affects timing-sensitive pages. |
| 11 | **L** | 89-93 | **Dedup loses per-link text.** Minor but means "same URL with different anchor text" is reported with only the first anchor. |
| 12 | **L** | 108 | **`console.error('Error:', err.message)`** — truncates to `.message`. Stack is lost. Agents can't diagnose why a page failed to load. |

## 6. Integration map

**Registered in `template/package.json:6`** as `"browse": "node scripts/browse.js"` — invoked via `npm run browse -- <url> [flags]`.

**Called by (Step 4 agents in `/seo-audit`):**
- **content-auditor** (`seo-audit.md` Agent 3): `browse.js --extract-text` — most critical consumer; bug #1 and #2 directly affect content quality ratings
- **competitor-analyzer** (Agent 4): `browse.js --extract-meta`, `browse.js --extract-text` — estimates competitor keyword density from truncated text (amplifies the SOP §1.2 hallucination risk)
- **site-crawler** (Agent 2): `browse.js --extract-links` — overlaps with crawl-sitemap.js; link classification bug (#3) affects cross-validation
- **Operator CLI:** `npm run browse -- https://example.com --extract-meta` for quick one-off inspection

**NOT called by (confirmed via grep):**
- Any other Node script via `require()`
- Python platform
- The generator or renderers

**Contract this script provides:**
- `--extract-meta` output is valid JSON (parseable block inside the stdout banner)
- `--extract-headings` / `--extract-links` / `--extract-text` outputs are plaintext with consistent section banners — **brittle contract** (§5 bug #8)
- Screenshot is written to the given path if `--screenshot` is passed
- Process exits 0 regardless of whether navigation succeeded (§5 bug #4)

## 7. Fix / improve suggestions (ranked by ROI)

1. **Strip `nav, header, footer, aside` in `--extract-text`** (bug #1). Matches `extract-text.js`. Single-line selector change. Immediately improves content-auditor + competitor-analyzer accuracy.
2. **Add `--full-text` flag or remove 5000-char cap** (bug #2). Let agents see the full content on long pages.
3. **Add `--json` output mode** (bug #8). Unifies all extraction modes into `{meta, headings, links, text}` JSON. Makes downstream automation robust to banner-text changes. Codex flagged this.
4. **Fix internal-link classification** (bug #3). Use `new URL(href).hostname === location.hostname` with www normalization.
5. **Exit non-zero on navigation/extract failure** (bug #4). One-line catch-block change.
6. **Add `--timeout <ms>` and `--viewport <spec>` flags** (bugs #6, #7). Increases mobile-rendering utility.
7. **Parse CLI flags via `minimist` or `commander`** — replaces the manual `indexOf` pattern, eliminates bugs #9 and similar edge cases.
8. **Log full stack on error** (bug #12) — one-line change from `err.message` to `err.stack`.

## 8. What to verify before we touch this file

- **Check what content-auditor output currently looks like.** Spot-check `clients/{client}/seo/research/content-audit.md` on any client — if word counts seem inflated vs actual page body, that's bug #1 biting.
- **Grep agent prompts for `=== META DATA ===` / `=== PAGE TEXT ===`** — if those banner strings appear in agent parsing expectations (in `commands/seo-audit.md`), we have to migrate carefully before changing output format.
- **Confirm no external docs/onboarding reference the current stdout format** so we can safely add `--json`.
