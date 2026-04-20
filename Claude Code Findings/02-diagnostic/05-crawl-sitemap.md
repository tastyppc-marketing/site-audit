# Deep Dive #5 — `template/scripts/crawl-sitemap.js`

**File:** [`template/scripts/crawl-sitemap.js`](/root/site-audit/template/scripts/crawl-sitemap.js) (493 lines)
**Layer:** 02 — Diagnostic / site crawler (but functionally the single largest research-data producer)
**Cross-reference:** [`codex findings/02-data-gathering/03-crawl_sitemap.md`](/root/site-audit/codex findings/02-data-gathering/03-crawl_sitemap.md) (196 lines)
**Template-vs-client drift:** **YES — multiple versions in the wild.** See §6.
**Template-vs-skill drift:** **YES — skill inline is radically stripped (59 lines, no JSON outputs).**
**Date:** 2026-04-18

---

## 1. Purpose

The foundation of the entire audit's structured data. Discovers sitemap → fetches all URLs → filters IDX/thin-content noise → deeply analyzes content pages via Playwright → writes **two** research artifacts:
- `seo/research/crawl-data.json` — per-page meta, heading, link, schema, canonical, response-header, redirect-chain, issue-flag data
- `seo/research/link-graph.json` — contextual-links-only edge dict for Python `InternalLinkAnalyzer`

Codex: *"This is one of the highest-dependency scripts in the repo."* Confirmed: build_audit.py reads both outputs, ContentQualityAnalyzer reads pages, TechnicalSeoAnalyzer reads pages, InternalLinkAnalyzer reads link-graph, IndexCrawlabilityAnalyzer reads pages, EEATSignalAnalyzer reads pages, normalizer in `generate-multipage-report.js` reads both for hubClusters/pageAudits fallback. **Any data quality issue here cascades into ~10 downstream fields** on the final report.

Registered as `npm run crawl` in `template/package.json:7`.

## 2. Inputs

| Arg | Type | Default | Purpose |
|---|---|---|---|
| `<domain>` | positional | — **required** | Domain or URL; prepends `https://` if protocol missing |
| `--analyze` | bool | false | **Critical flag** — without this, only stdout discovery; no JSON files written |
| `--headed` | bool | false | Visible browser; no `slowMo` (unlike other diagnostics) |
| `--max <N>` | flag+value | Infinity | Cap number of pages analyzed |

**Env vars:** None.
**Files read:** None (only network).
**Network dependencies:** reachable `/robots.txt`, `/sitemap.xml` (or `/sitemap_index.xml` or `/sitemap`).

## 3. Outputs

**With `--analyze`:**
- **`seo/research/crawl-data.json`** — 9 top-level keys:
  ```
  {
    "domain": "https://example.com",
    "crawlDate": "ISO-8601",
    "totalSitemapUrls": number,
    "contentPages": number,           // post-IDX-filter
    "idxFilterPages": number,
    "analyzedCount": number,          // may be < contentPages if --max set
    "elapsedSeconds": number,
    "categories": { "<first-segment>": {total, content, idx}, ... },
    "pages": [ {...see below}, ... ],
    "issuesSummary": { "ISSUE_CODE": count, ... },
    "orphanedPages": [ "url", ... ]
  }
  ```
  Each page object (~27 fields): `url, title, titleLength, description, descriptionLength, h1[], h2[], h2Count, h3Count, wordCount, imgCount, imgWithoutAlt, totalInternalLinks, contextualInternalLinks, externalLinks, canonical, canonicalResolved, canonicalCount, robotsMeta, googlebotMeta, viewportMeta, hasSchema, schemaTypes[], schemaData[], ogTitle, ogDescription, ogImage, twitterCard, responseHeaders{...}, redirectChain[], redirectChainLength, statusCode, httpCanonical, issues[]`.
  **On error, page object is sparse:** `{url, error, issues: ['CRAWL_ERROR']}` — missing every other field.

- **`seo/research/link-graph.json`**:
  ```
  {
    "domain": "https://example.com",
    "crawlDate": "ISO-8601",
    "edges": { "page-url": [ "target-url", ... ], ... }
  }
  ```
  Only **contextual** links (not nav/header/footer) are included. Error pages are excluded.

**Without `--analyze`:** stdout only. Robots.txt preview, sitemap discovery, category counts, URLs JSON. **No file output.**

**Exit code:** 0 on success, 0 on caught error.

## 4. Annotated walk

**Lines 7-25 — IDX patterns array.** Hardcoded regexes to skip:
- Filter combos (`3-bedroom`, `price-100k`)
- Pagination (`/3/`, `/page/5`)
- MLS pages (`/mls-`, `/listing/`)
- Deep real-estate URLs (`/property/ABC-123`, `/homes-for-sale/x/y`)

**Entirely real-estate-specific.** No config hook. Any SaaS / news / e-commerce client gets wrong filtering — legitimate nested pages (`/blog/category/post`) are excluded by line 36's >3-segment rule.

**Lines 27-39 — `isContentPage(url)`.** Two filters:
1. Any idxPattern matches → exclude.
2. Line 36: **more than 3 path segments → exclude.** This is the most hostile rule for non-real-estate sites. A blog at `/2026/04/seo-best-practices/post` (4 segments) is **silently excluded**.

**Lines 41-48 — `fetchText(page, url)`.** Uses Playwright's `page.goto` + `page.content()`. **The bug that liane-jamason fixed** (see §6): Playwright loads XML through its browser engine which applies XSLT / DOM transforms. `page.content()` returns the possibly-transformed document; for some XML sitemaps this breaks `<loc>` selection. liane-jamason added `fetchXmlRaw()` using Node `https.get` to bypass Playwright for sitemaps — a real upgrade that was never merged to template.

**Lines 51-86 — `fetchAllSitemapUrls(page, sitemapUrl)`.**
- Line 55: Detects sitemap-index via `content.includes('<sitemapindex')`.
- Lines 57-78: For index, iterates children. Line 68 fetches child (navigates page); line 70 runs `page.evaluate` on whatever page is currently loaded. **If `fetchText` returns content but the page crashed or redirected**, evaluate runs on wrong page. Acceptable in practice; fragile.
- Lines 70-73: Simple `document.querySelectorAll('loc')` → array of URLs. Note that in sitemap-index mode, the URL child pages are also XMLs being loaded; again Playwright transforms them. Liane's fix addresses this.

**Lines 89-228 — `analyzePage(browserPage, pageUrl)`.** The heart of the script. ~140 lines.

**Lines 94-123 — Response listener.** Attached via `browserPage.on('response', ...)`:
- Line 99-104: Records redirects (3xx) to `redirectChain`.
- **Lines 109-122 — BUG**: `if (status < 300 || status >= 400)` matches **every non-redirect response**, including subresources (CSS, JS, images, fonts). Each such response **overwrites** `responseHeaders.server`, `.statusCode`, `.cacheControl`, `.strictTransportSecurity`, etc. So:
  - `responseHeaders.server` ends up being whichever subresource landed last (often a CDN like `cloudflare` for an image, not the origin server for the HTML page).
  - `responseHeaders.statusCode` may be the status of a favicon request, not the page.
  - `responseHeaders.strictTransportSecurity` may reflect a subresource domain's HSTS, not the page's.
  - **This directly affects `MISSING_HSTS` issue flag at line 225 and `statusCode` field** — false negatives/positives are guaranteed when a page has any subresource with different headers.
  - Fix: Filter to only the response matching the target URL (or the first HTML response); use Playwright's `response` returned from `page.goto()` instead.

**Line 125 — `page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 20000 })`.** 20s timeout (vs 15s for sitemap fetches). `networkidle` waits for 500ms of network silence.

**Line 126 — `waitForTimeout(500)`.** Extra 0.5s wait. Not configurable.

**Lines 128-188 — Page data extraction.** Big `page.evaluate()` block:
- Line 135-144: **Internal link extraction uses correct hostname comparison** (`new URL(a.href).hostname === hostname`). **Unlike `browse.js:81` and `ddg-search.js:64`**, no `includes()` bug here. Good.
- Line 143: `inNav` = `.closest('nav, header, footer')`. Reasonable definition of "boilerplate link."
- Line 147: `contextualLinks` = internal links NOT in nav/header/footer. Only these go to link-graph.
- Line 159: **`document.body.textContent.replace(/\s+/g, ' ').trim().split(' ').length`** — word count **includes nav/header/footer text**. For a page with a 40-word header and 40-word footer and 200-word main content, wordCount = ~280. Then line 212 flags `THIN_CONTENT` at <300 → this page gets flagged thin even though it has 200 words of real content. **Inconsistent with `extract-text.js` which strips boilerplate.**
- Line 161: **`img:not([alt]), img[alt=""]`** — same WCAG bug as check-technical.js: whitespace-only alt passes.
- Line 168: Canonical via `getAttribute('href')` — preserves relative URL (good for auditing correctness).
- Line 169: `canonicalResolved` via `.href` — absolute URL.
- Line 170: `canonicalCount` — detects multiple canonical tags. Good.
- Line 177-181: Schema capture includes both the type names AND the full parsed JSON for each block. Parse errors captured as `{_parseError, _raw}`. Very useful for schema validation.
- Line 179: `d['@type'] || (d['@graph'] ? 'graph' : 'unknown')` — if a `<script type="application/ld+json">` contains an **array** of schemas (common pattern), `d` is an array, `d['@type']` is undefined, `d['@graph']` is undefined → result is `'unknown'`. **Misses type detection for array-wrapped schemas.** Bug.

**Lines 190-202 — Post-eval enrichment.**
- Line 194: `statusCode: responseHeaders.statusCode || 200` — defaults to 200 if listener never captured. That's the bug we flagged at lines 109-122 compounding.
- Line 197-202: HTTP Link header parse. Simple regex `<([^>]+)>;\s*rel="canonical"`. Fails for comma-separated Link headers with multiple rel values.

**Lines 204-225 — Issue flagging (hardcoded thresholds).**

| Threshold | Line | Value | Notes |
|---|---|---|---|
| TITLE_TOO_LONG | 206 | > 60 | No grace zone; 61 = long |
| TITLE_TOO_SHORT | 207 | < 20 (but > 0) | Debatable; strong brands use shorter |
| META_DESCRIPTION_TOO_LONG | 209 | > 160 | — |
| MISSING_H1 | 210 | h1.length === 0 | — |
| MULTIPLE_H1 | 211 | h1.length > 1 | HTML5 allows multiple H1; rule is aggressive |
| THIN_CONTENT | 212 | wordCount < 300 | **Inflated by boilerplate** (§4 line 159) |
| NO_SCHEMA | 213 | !hasSchema | — |
| NO_CANONICAL | 214 | !canonical | — |
| NO_OG_TAGS | 215 | !ogTitle | Only checks og:title, not other OG fields |
| NO_CONTEXTUAL_INTERNAL_LINKS | 216 | contextualInternalLinks === 0 | — |
| MISSING_ALT_TEXT | 217 | imgWithoutAlt > 0 | Any missing alt flags entire page |
| MISSING_VIEWPORT | 220 | !viewportMeta | — |
| REDIRECT_CHAIN | 221 | redirectChainLength > 1 | — |
| MULTIPLE_CANONICALS | 222 | canonicalCount > 1 | — |
| NOINDEX | 223 | robotsMeta.includes('noindex') | Case-insensitive |
| X_ROBOTS_NOINDEX | 224 | xRobotsTag.includes('noindex') | **Depends on buggy header capture** (§4 line 109) |
| MISSING_HSTS | 225 | !strictTransportSecurity | **Same buggy header source** — will flag false positives when last subresource response had no HSTS |

**Lines 231-266 — `analyzeInBatches(context, pages, concurrency = 3)`.**
- **Concurrency hardcoded to 3.** No flag override. For 500-page sites with slow rendering, 3 is slow. For 5-page sites, 3 is overkill.
- Line 247-250: **Error page shape is sparse:** `{url, error, issues: ['CRAWL_ERROR']}` — lacks `title, wordCount, links, schema`, etc. Downstream consumers (ContentQualityAnalyzer, TechnicalSeoAnalyzer) must handle undefined fields. If they don't, they'll throw.
- Line 261: 500ms delay between batches. Politeness guard.

**Lines 268-280 — Main arg parsing.**
- Line 279: `parseInt(args[maxIdx + 1], 10)` — radix used (unlike ddg-search bug).
- Line 279: No bounds check on `args[maxIdx + 1]`. If `--max` is last arg, parseInt(undefined, 10) = NaN. Then `maxPages < Infinity` evaluates `NaN < Infinity` = false, so full analysis runs. Silent.

**Line 286-288 — Context.** UA only; **no viewport** (unlike browse.js/ddg-search.js). Playwright default viewport is 1280×720 (changes across versions).

**Line 294-300 — Robots.txt fetch.** Same Playwright-for-text issue; liane-jamason probably fixes this via `fetchXmlRaw`.

**Lines 304-316 — Sitemap probe.** Tries three candidate URLs in order. Good.

**Line 323 — `[...new Set(urls)]`.** Dedupes. Does NOT normalize trailing slashes or case; `https://x.com/a` and `https://x.com/a/` both stay.

**Lines 334-348 — Category aggregation.**
- Line 339: `segments[0] || 'homepage'` — category = first URL path segment. Brittle for non-hierarchical sites. For `/blog/post-1`, `/blog/post-2`, `/products/x`, works fine. For `/about`, `/contact`, each becomes its own category of 1.

**Lines 352-363 — Category stdout.** Sorted by total; sample URLs shown.

**Lines 366-416 — Analysis phase (only if `--analyze`).**

**Lines 418-433 — Orphan detection.**
- `allLinkedUrls`: union of all `contextualLinkTargets` across analyzed pages.
- Orphans: pages in `analyzedPages` whose URL is NOT in `allLinkedUrls`.
- **Problem 1:** If only 20 of 500 content pages are analyzed (via `--max 20`), then pages 21–500 could link to the analyzed 20 — but we don't see those links, so analyzed pages appear "orphaned."
- **Problem 2:** A page linked only from nav/header/footer is NOT in contextualLinkTargets → flagged orphan. But that's by design; the point is to find pages without contextual link support.
- **Handoff.md:18 noted "35 orphans"** on a prior Murray Gardner audit. This was likely the false-orphan effect.

**Lines 436-452 — Results assembly.** 11-key JSON.

**Lines 446-449 — `contextualLinkTargets` removed from per-page output** (kept in link-graph). Good file-size discipline.

**Line 455 — Output path.** `path.join(__dirname, '..', 'seo', 'research', 'crawl-data.json')`. **`__dirname` is `clients/<slug>/scripts/` when run from a client directory.** Writes to `clients/<slug>/seo/research/crawl-data.json`. If run from template directly, writes to `template/seo/research/` which doesn't exist → mkdir creates it → orphan files in template.

**Lines 458-461 — Write.** `mkdir -p` then `fs.writeFileSync` (non-atomic). Crash mid-write corrupts the file.

**Lines 465-476 — Link-graph write.** Pages with errors excluded (good). Pages WITHOUT `contextualLinkTargets` excluded too (can happen if eval failed partway).

## 5. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 109-122 | **Response-header listener overwrites main-doc headers with subresource headers.** `responseHeaders.server`, `.statusCode`, `.strictTransportSecurity`, `.cacheControl`, etc. reflect whatever subresource (CSS, image, analytics beacon) completed last — NOT the page's actual response. Directly corrupts `MISSING_HSTS`, `X_ROBOTS_NOINDEX`, `statusCode` fields for every analyzed page. **Fix:** Filter listener to `response.url() === page.url()` or use `await page.goto()`'s return value. |
| 2 | **H** | 41-48, 294 | **Playwright used to fetch XML sitemaps and robots.txt.** Some browsers transform XML via XSLT, breaking `<loc>` selection → silently returns empty URL list. **liane-jamason patched this per-client** (added `fetchXmlRaw` using Node https.get) — that fix was never merged upstream. Any client whose sitemap is flat XML (no XSLT stylesheet) works; any that triggers Playwright's XML viewer breaks silently. |
| 3 | **H** | 8-25, 36 | **Real-estate-specific IDX filter applied to all clients.** Line 36's `segments.length > 3` excludes legitimate deep URLs (blog archives, nested category pages) for non-real-estate sites. Non-configurable. |
| 4 | **H** | 159 | **Word count includes nav/header/footer text.** Overcounts by 50-200 words typically. `THIN_CONTENT` flag (line 212) fires incorrectly on legitimate content. **Inconsistent with `extract-text.js`** which strips boilerplate. Direct source of content-auditor's wrong thin-content calls. |
| 5 | **H** | seo-audit.md:153-212 | **Skill inline is a 59-line stub** with NO `--analyze` support (it shows analysis of 20 pages to stdout, no JSON write, no link graph). Fresh audits generated from skill instead of template copy produce zero research JSON files. **This is why murray-gardner has 7+ empty audit-data.json fields.** |
| 6 | **H** | — | **Client-folder drift (3 clients):** |
| | | | • `liane-jamason` = template + fetchXmlRaw upgrade (deserves upstreaming) |
| | | | • `mammoth-lakes` = older pre-P7 template (411 lines) |
| | | | • `murray-gardner` = skill inline stub (153 lines, no JSON output) |
| 7 | **M** | 247-250 | **Error-page output shape is sparse.** Downstream analyzers reading `page.title`, `page.wordCount` etc. on error pages read undefined. Must defensively handle — if they don't, TypeError. |
| 8 | **M** | 179 | **Schema array-wrapping not detected.** Sites emitting `[{@type:"Org"},{@type:"FAQ"}]` in one script block get `schemaTypes: ['unknown']`. |
| 9 | **M** | 161 | **Whitespace-only alt not caught** (same as check-technical.js #6). |
| 10 | **M** | 215 | **`NO_OG_TAGS` only checks `ogTitle`** — a site with `og:description` but no `og:title` gets flagged; a site with `og:title` but no others gets a pass. |
| 11 | **M** | 231 | **Concurrency hardcoded to 3.** Non-configurable. |
| 12 | **M** | 418-433 | **Orphan detection produces false positives** when `--max N` limits analyzed set. Pages outside the analyzed subset can't contribute link data. |
| 13 | **M** | 197-202 | **HTTP `Link` canonical regex fails on multi-value headers.** `Link: <a>;rel="canonical", <b>;rel="alternate"` — works. But some origins send two separate `Link` headers that Node joins with `,`; regex could match wrong segment. |
| 14 | **M** | 210 | **`MISSING_H1` / `MULTIPLE_H1`**: HTML5 spec actually allows multiple H1s under sectioning content. The rule is old-school SEO advice; still widely followed but flagged aggressively. |
| 15 | **M** | 286-288 | **No viewport in context.** Playwright default varies across versions; inconsistent with other diagnostic tools. |
| 16 | **M** | 29-39, 342-347 | **Category aggregation by first path segment.** Hostile to flat URL structures. |
| 17 | **L** | 279 | **No bounds check on `--max`** — missing value → NaN → silently falls back to full analysis. |
| 18 | **L** | 323 | **URL dedupe doesn't normalize trailing slash / case.** `/a` and `/a/` both analyzed. |
| 19 | **L** | 455, 461 | **Non-atomic write, relies on `__dirname`.** Crash mid-write → corrupt JSON. Running from wrong cwd → wrong output location. |
| 20 | **L** | 486-490 | **Exit 0 on error** (pattern consistent with other diagnostics). |

## 6. Integration map

**Registered in `template/package.json:7`** as `"crawl": "node scripts/crawl-sitemap.js"`.

**Called by:**
- **site-crawler agent** (Step 4 Agent 2 of `/seo-audit`, `seo-audit.md:355`): `node scripts/crawl-sitemap.js {CLIENT_SITE} --analyze`
- **Competitor-analyzer agent** (`seo-audit.md:478`): `node scripts/crawl-sitemap.js {COMPETITOR_DOMAIN}` (without `--analyze`, just for sitemap inventory)
- **Operator CLI**

**Consumers of its outputs:**

| File | Consumed by | Reads which fields |
|---|---|---|
| `crawl-data.json` | `build_audit.py` (ContentQualityAnalyzer) | pages[].url, title, description, wordCount, headings, issues |
| `crawl-data.json` | `build_audit.py` (TechnicalSeoAnalyzer) | pages[].canonical, schema, robotsMeta, metaTags |
| `crawl-data.json` | `build_audit.py` (IndexCrawlabilityAnalyzer) | pages[].canonical, redirectChain, robotsMeta, issues |
| `crawl-data.json` | `build_audit.py` (EEATSignalAnalyzer) | pages[].schema, content patterns |
| `crawl-data.json` | `generate-multipage-report.js` normalizer | `pageAudits[]` fallback (if Python didn't populate) — normalizer lines ~1104+ |
| `link-graph.json` | `build_audit.py` (InternalLinkAnalyzer) | `edges` dict → PageRank, orphan/hub/depth analysis |
| `link-graph.json` | `generate-multipage-report.js` normalizer | `internalLinking.summary`, `hubClusters[]` BFS — normalizer lines ~1151+ |

**Contract this script imposes:**
- `crawl-data.json` schema MUST keep `pages[]` as an array of objects with the ~27-field shape; adding fields is safe, renaming/removing is not.
- `link-graph.json.edges` MUST be an object mapping source URL to array of target URLs.
- Error pages in `pages[]` have sparse shape `{url, error, issues}` — consumers must `if (!page.error)` guard before reading other fields.

**Template-vs-client-vs-skill divergence:**

| Version | Lines | `--analyze` | fetchXmlRaw | Category summary | Issue flags | Link graph | IDX filter |
|---|---|---|---|---|---|---|---|
| Template | 493 | ✅ | ❌ | ✅ | ✅ (16 codes) | ✅ | Real-estate |
| liane-jamason | 504 | ✅ | ✅ | ✅ | ✅ (16) | ✅ | Real-estate |
| mammoth-lakes | 411 | ✅ | ❌ | (partial) | (older set) | (possibly) | Real-estate |
| murray-gardner | 153 | ❌ | ❌ | ✅ (limited) | ❌ | ❌ | None |
| Skill inline | 59 | ❌ | ❌ | ✅ (limited) | ❌ | ❌ | None |

**Direct impact on live clients:**
- **murray-gardner**: `audit-data.json` has empty `contentQuality`, `backlinks`, `internalLinking`, `technicalSeo`, `localSeo`, `indexation`, `eeat`, `rankHistory` — because their crawl-sitemap.js (the inline stub) **never produced crawl-data.json or link-graph.json**, so build_audit.py analyzers had no inputs. **Root cause confirmed.**
- **mammoth-lakes**: Likely same reason, to a lesser degree — pre-P7 template has different field set so downstream normalizer path may skip things.
- **liane-jamason**: Actually works BETTER than template (fetchXmlRaw makes its sitemap fetching more reliable).

## 7. Fix / improve suggestions (ranked by ROI)

1. **Upstream `fetchXmlRaw` from liane-jamason to template (bug #2).** A real, tested bug fix already shipped per-client. Merging it upstream closes sitemap-parse silent failures across all future audits.
2. **Resolve skill-inline drift (bug #5).** Same fix pattern as the three earlier diagnostics — replace `seo-audit.md:153-212` with a `# See template/scripts/crawl-sitemap.js` reference. **This is the single biggest actionable fix in the system so far** — it explains real client-data gaps we measured.
3. **Fix response-header listener to only capture main-doc response (bug #1).** Use Playwright's `page.goto()` return value or filter by URL. Immediately fixes `MISSING_HSTS` false positives, statusCode, cache-control, server fields.
4. **Rebuild word count from main-content extraction (bug #4).** Either call into `extract-text.js` logic, or add an analogous boilerplate-stripping block. Fixes THIN_CONTENT false positives across all pages.
5. **Re-template the 3 drifted clients (bug #6).** For mammoth-lakes and murray-gardner, copy template `crawl-sitemap.js` in, then re-run `--analyze`, then re-run `build_audit.py`, then regenerate reports. Should unblock the 8 empty audit-data.json fields on those two clients. liane-jamason is fine to leave as-is pending fix #1.
6. **Make IDX patterns configurable (bug #3).** Accept `--idx-config <path>` or read from `client-config.json`. Default: real-estate patterns. Non-real-estate clients get empty default.
7. **Capture array-wrapped schema types correctly (bug #8).**
8. **Expose `--concurrency <N>` flag (bug #11).**
9. **Normalize URLs when deduping (bug #18).** `new URL(u).href` for consistency.
10. **Add issue flag `DEEP_URL` / `UNREACHABLE_DEPTH`** rather than silently excluding >3-segment URLs.

## 8. What to verify before we touch this file

- **Diff liane-jamason's full `crawl-sitemap.js` against template line-by-line** — ensure fetchXmlRaw upgrade is the ONLY meaningful change. If there are others, decide whether to upstream them too.
- **Grep all analyzers' Python source for `page.get('wordCount'`, `page.get('title'`, etc.** — confirm they handle the sparse error-page shape gracefully. If any don't, we need to add guards before fixing anything in the analyzers themselves.
- **Check `test_*.py`** to see if crawl-data fixtures exist and what shape they cover — tests may need updating if we change the schema.
- **Confirm which exact clients were generated from template vs inline** — spot-check each `clients/*/scripts/crawl-sitemap.js` size and features. Build a migration plan.
