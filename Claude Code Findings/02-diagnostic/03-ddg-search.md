# Deep Dive #3 — `template/scripts/ddg-search.js`

**File:** [`template/scripts/ddg-search.js`](/root/site-audit/template/scripts/ddg-search.js) (80 lines)
**Layer:** 02 — Diagnostic / SERP-scraping fallback
**Cross-reference:** [`codex findings/02-data-gathering/19-ddg_search.md`](/root/site-audit/codex findings/02-data-gathering/19-ddg_search.md) (117 lines)
**Template-vs-client drift:** None across `matt-wallmow`, `liane-jamason`, `laura-willis`, `chris-nevada` (byte-identical).
**Template-vs-skill drift:** **YES — significant.** See §6.
**Date:** 2026-04-18

---

## 1. Purpose

Playwright-driven DuckDuckGo SERP scraper. Primary use in `/seo-audit` is as a **backup** for keyword-researcher agent (Step 4 Agent 1). Per `seo-audit.md:326` and `:1310`, Google gets scraped via WebSearch tool (the Claude tool) which doesn't trigger CAPTCHA; Playwright against Google gets blocked, so DuckDuckGo is the fallback when WebSearch fails. Registered as `npm run search` in `template/package.json:8`.

## 2. Inputs

**CLI (positional + flags):**

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<query>` | positional | — **required** | Search query (quote to preserve spaces) |
| `--headed` | bool | false | Visible browser; `slowMo: 500` |
| `--target <csv>` | flag+value | `[]` | Comma-separated list of domains to check for position |

**Env vars:** None.
**Files read:** None.

## 3. Outputs

**stdout, text-only (NOT JSON):**
- Banner: `=== DUCKDUCKGO RESULTS FOR: "<query>" ===`
- Summary line: `--- Results (<N>) ---`
- Per-result block: `#<position>: <title>` / `URL: ...` / `Domain: ...` / `Snippet: <200 chars>`
- If `--target` provided: `--- TARGET SITE POSITIONS ---` + per-target `Position #N - "title"` OR `NOT FOUND in results`

**No file side effects. No structured output mode.**

**Exit code:** 0 on success; 0 on caught error (same pattern as `browse.js` — bug).

## 4. Annotated walk

**Lines 6-11 — Arg parse.** `query` is positional. Usage exit if missing.

**Lines 13-15 — Flag parse.**
- `headed`: simple boolean.
- Line 15: `targetIdx !== -1 ? args[targetIdx + 1].split(',') : []` — **no bounds check**. If `--target` is the last arg with no value after, `args[args.length]` is `undefined`, and `.split(',')` throws `TypeError`. That throws before the try/catch at line 28, so browser is never launched — acceptable failure mode, but confusing to debug.

**Lines 17-20 — Browser launch.** Same pattern as `browse.js`: `headless: !headed`, `slowMo: 500` when headed.

**Lines 21-25 — Context.**
- Hardcoded Chrome 120 Windows UA (same as `browse.js`).
- Hardcoded 1920×1080 viewport.
- **`locale: 'en-US'`** — hardcoded. Canadian clients should use `en-CA`. No override flag.

**Line 29 — Search URL.**
- `kl=us-en` → DuckDuckGo's region/language parameter for **United States / English**.
- **Hardcoded US-English region.** For Canadian clients (Calgary Castles, Murray Gardner), should be `kl=ca-en`. For UK, `uk-en`. This means any "Canadian SEO" results from this tool are **filtered through a US lens**. Not catastrophic — DDG still returns relevant results — but ranking and result ordering will differ from what a Canadian searcher sees. **The SEO-AUDIT-PLAYBOOK probably thinks this is returning CA results.**

**Line 30 — `page.goto`.** `networkidle` + 30s timeout (same as `browse.js`).

**Line 31 — `waitForTimeout(3000)`.** **Hardcoded 3-second extra wait** after networkidle. Not flag-configurable. Slightly wasteful; DDG usually renders results before networkidle fires.

**Lines 33-49 — Result extraction.**
- Selector: `[data-testid="result"]` — **DDG-stable** test-id convention; won't break as easily as class names.
- Title selector: `h2 a, [data-testid="result-title-a"]` — two fallbacks, both use stable attributes.
- **Snippet selector: `[data-result="snippet"], .kY2IgmnCmOGjharHErah`** — the second selector is an **obfuscated/minified CSS class**. DDG rotates these. **This WILL break** the moment DDG redeploys. The `data-result` attribute fallback *might* work; no guarantee.
- Line 43: `new URL(titleEl.href).hostname` — correct hostname extraction (unlike `browse.js`'s `includes()` approach).

**Lines 51-59 — Result display.** Plain text with markers. Snippet truncated to 200 chars for display; full snippet held in memory but not printed or exposed.

**Lines 61-71 — Target-domain matching.**
- Line 64: `r.domain.includes(target.replace('www.', ''))` — strips `www.` from the **target only**, not from the result domain. So matching is lossy in both directions:
  - If target is `example.com` and result is `www.example.com`: result domain contains "example.com" → match works ✅
  - If target is `www.example.com` and result is `www.example.com`: target becomes `example.com`, result still `www.example.com` → match works ✅
  - **If target is `example.com` and result is `notexample.com`**: result.domain.includes("example.com") → TRUE — **false positive** ❌
  - **If target is `mysite.example.com` (subdomain) and result is `example.com`**: "example.com".includes("mysite.example.com") → FALSE → false negative ❌
- No `hostname === target` exact match option.

**Lines 73-77 — Error handling.** Same pattern as `browse.js`: catch prints error message, finally closes browser, **no non-zero exit code on failure**.

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 37 | **Obfuscated snippet class `.kY2IgmnCmOGjharHErah`** — minified/rotating DDG class name. Will break silently (snippets return empty) whenever DDG redeploys. The `[data-result="snippet"]` fallback is the correct primary selector; the minified class should be removed. |
| 2 | **H** | 29 | **Hardcoded `kl=us-en` region.** Canadian/UK clients get US SERP rankings, not their local ones. **Directly affects the accuracy of keyword-researcher's "client ranks #N for keyword X" claims** for non-US clients — which is most of Calgary Castles, Murray Gardner, Liane Jamason. No `--region` flag. |
| 3 | **H** | seo-audit.md:215-252 | **Skill prompt contains a stale inline version of this script.** The skill tells agents to write `scripts/ddg-search.js` with: (a) hardcoded placeholders `CLIENT_DOMAIN_HERE` / `COMPETITOR_DOMAIN_HERE` baked into the code (line 244 of seo-audit.md), (b) NO `--target` flag support. The real template script uses `--target` CLI flag. Agents following Step 2 will overwrite the good version with the stripped one that requires per-client code edits. Codex did NOT flag this. |
| 4 | **M** | 15 | **No bounds check on `args[targetIdx + 1]`.** If `--target` is last flag with no value, throws `TypeError` before any logic runs. |
| 5 | **M** | 64 | **`includes()` target matching = false positives + false negatives.** Same bug class as `browse.js` line 81. `notexample.com` matches target `example.com`. Subdomains don't match parent domain. Fix: strict hostname compare with optional www normalization. |
| 6 | **M** | 24, 29 | **`locale: 'en-US'` + `kl=us-en` hardcoded** — Canadian/UK clients get US results. No override. |
| 7 | **M** | 73-77 | **Exit code 0 on error** (same as `browse.js` #4). Caller can't detect failure. |
| 8 | **M** | — | **stdout-only output.** No `--json` flag. Brittle banner-text contract with parsers. Codex flagged this. |
| 9 | **L** | 22 | **Hardcoded Windows Chrome 120 UA.** Anti-bot exposure (minor for DDG). |
| 10 | **L** | 23 | **Hardcoded 1920×1080 viewport.** |
| 11 | **L** | 30 | **30s timeout hardcoded.** |
| 12 | **L** | 31 | **`waitForTimeout(3000)` hardcoded.** Adds 3s per query; with 25-keyword fallback could add ~75s even when DDG renders fast. |
| 13 | **L** | — | **Only scrapes page 1.** No `--depth` or pagination option. If the client ranks on page 2 for a keyword, the tool reports "NOT FOUND." For keyword-researcher this matters because many targeted long-tails rank page 2-5. |
| 14 | **L** | 74 | **`console.error('Error:', err.message)`** — stack lost. |

## 6. Integration map

**Registered in `template/package.json:8`** as `"search": "node scripts/ddg-search.js"` — invoked via `npm run search -- "<query>" [flags]`.

**Called by:**
- **keyword-researcher agent** (Step 4 Agent 1 of `/seo-audit`) — `seo-audit.md:326` explicitly says "As a backup only, you may use: node scripts/ddg-search.js `<keyword>`". Primary tool is WebSearch.
- **Operator CLI** — quick ranking check when needed.

**NOT called by:**
- Python platform
- Normalizer / generator
- Renderer
- Any other Node script via `require()`

**Skill drift (§5 bug #3) — detailed:**

| | Template (`template/scripts/ddg-search.js`) | Skill inline (`seo-audit.md:215-252`) |
|---|---|---|
| Lines | 80 | 38 (one-liners, compact) |
| `--target` flag | ✅ Yes, via `args.indexOf('--target')` | ❌ No — hardcoded `['CLIENT_DOMAIN_HERE', 'COMPETITOR_DOMAIN_HERE']` array |
| Selector fallbacks | 2 each for title + snippet | 2 each (same) |
| Banner format | Multi-line | Single-line |
| Client edit required before use | No | **Yes** — agents must replace placeholders |

The skill was written first, the template script was upgraded later (adding `--target` and cleaner formatting), but the inline in `seo-audit.md` never got the upgrade. When Step 2 runs, it either:
- (a) finds the script already exists and skips (if prior audit set it up) — good
- (b) creates a new one from the inline template — bad, reverts to stripped version

Confirmed at `seo-audit.md:77-79`:
> Step 2: Create Playwright Scripts … Confirms or creates 4 Node.js scripts

The "confirms or creates" logic means already-correct scripts are preserved, but if the template copy step (Step 1) failed or the directory is fresh, the agent uses the inline skill code. This is how stale inline drift gets into new clients.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Resolve the skill inline drift (bug #3).** Either: (a) replace `seo-audit.md:215-252` with a simple `# See template/scripts/ddg-search.js` reference, or (b) update the inline to match current `--target` version. Option (a) is better — one source of truth.
2. **Remove the obfuscated `.kY2IgmnCmOGjharHErah` fallback (bug #1).** Replace with just `[data-result="snippet"]`. Lower selector fragility. Investigate current DDG DOM to confirm stable primary selector.
3. **Add `--region <code>` flag and wire to both `locale` and DDG `kl` param (bugs #2, #6).** Default `us-en` but accept `ca-en`, `uk-en`, etc. Thread through from `client-config.json` when skill invokes.
4. **Fix target matching to use strict hostname compare with www normalization (bug #5).** Same fix as `browse.js` #3.
5. **Add `--json` mode (bug #8).** Emit a single JSON object `{query, region, results: [...], targetPositions: {...}}`. Matches the fix we suggested for `browse.js`.
6. **Exit non-zero on navigation/extract error (bug #7).** One-line change.
7. **Bounds check on `--target` value (bug #4).** Defensive one-line guard.
8. **Add `--depth <pages>` and pagination (bug #13).** Low priority; most rankings are on page 1.

## 8. What to verify before we touch this file

- **Grep `client-config.json` across clients for a `region` / `country` field** — if it exists we can thread through; if not, we need to add the field per client and document it.
- **Check if DDG still returns `[data-result="snippet"]`** via a manual `npm run search -- "test"` — confirm the obfuscated class fallback isn't actually the only working selector right now.
- **Check whether any existing `clients/*/scripts/ddg-search.js` still has the hardcoded-placeholder form** (drift from having been generated by the stale inline skill). Diff them against the template.
