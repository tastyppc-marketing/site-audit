# Deep Dive #1 — `template/scripts/lib/fetch-with-retry.js`

**File:** [`template/scripts/lib/fetch-with-retry.js`](/root/site-audit/template/scripts/lib/fetch-with-retry.js) (297 lines)
**Layer:** 01 — Shared utility
**Cross-reference:** [`codex findings/05-shared-report-runtime/22-fetch_with_retry.md`](/root/site-audit/codex findings/05-shared-report-runtime/22-fetch_with_retry.md) (132 lines)
**Date:** 2026-04-17

---

## 1. Purpose

Shared HTTP/HTTPS utility used by all 7 API-hitting Node gather scripts (`gather-pagespeed.js`, `gather-domain-metrics.js`, `gather-backlinks.js`, `gather-organic-metrics.js`, `gather-keyword-volumes.js`, `gather-local-pack.js`, `gather-local-seo.js`). Provides retry-with-backoff, concurrency limiting, per-request logging, and process-wide stats. Built on Node's native `http`/`https` modules — zero third-party deps. It is the single dependency underneath every paid API call the system makes, so any bug here shows up in every audit's raw data.

## 2. Inputs

- **Not a CLI script.** Pure library — imported via `require('./lib/fetch-with-retry')`.
- **No env vars read directly** — callers pass credentials via `options.auth: 'user:pass'`.
- **No files read.**

## 3. Outputs

Returned values, per export:

| Export | Returns | On non-2xx | On thrown error |
|---|---|---|---|
| `rawRequest(url, options)` | `{ statusCode, headers, body: string }` | Same (doesn't throw) | Rejects |
| `fetchWithRetry(url, options)` | `{ statusCode, headers, body: string }` after retries | Returns last response | Rejects after retries exhausted |
| `fetchJSON(url, options)` | Parsed JSON object | **Throws** (unless `allowNon2xx`) | Throws |
| `postJson(url, payload, options)` | `{ statusCode, headers, body: parsed-or-raw }` | Returns (does NOT throw) | Throws |
| `requestJson(url, options)` | `{ statusCode, headers, body: parsed-or-raw }` | Returns (does NOT throw) | Throws |
| `requestText(url, options)` | Raw string body | Returns | Throws |
| `Semaphore` | Class with `.run(fn)` method | — | — |
| `sleep(ms)` / `isRetryable(code)` | helpers | — | — |

**Stdout side effects:** Every request logs a line like `  [timestamp] POST OK 200 12.3KB 450ms https://...`. On process `beforeExit`, prints a 7-line summary block with totals, bytes, elapsed.

## 4. Annotated walk

**Lines 36-44 — Module-level `stats` object.** Singleton across the entire process. `startTime` is captured at *require* time, not at first-request time. Means if a script imports this module, then sits idle for 10s before making requests, the "elapsed" in the summary includes the idle window.

**Lines 46-48 — `ts()` helper.** ISO timestamp truncated to millisecond-precision `YYYY-MM-DD HH:MM:SS.sss`.

**Lines 50-54 — `logRequest()`.** Builds the log line. `url.substring(0, 100)` truncates long URLs (note: `label` passed in is already truncated to 80 at line 183, so this is redundant for labelled calls — but on the error path line 217-218 it logs `label` directly which is the 80-char version).

**Lines 56-69 — `printSummary()`.** Logged to stdout. No way to silence. No way to get programmatic access to stats.

**Line 72 — `process.on('beforeExit', printSummary)`.** Registered at module-load time. If any caller does `process.exit(1)` (most gather scripts do, e.g. `gather-pagespeed.js` on auth failure), `beforeExit` does NOT fire, and the summary is lost. Inconsistent user experience — sometimes you get the summary, sometimes you don't.

**Lines 77-98 — `Semaphore` class.** Simple promise-queue pattern.
- `constructor(max = 2)` — default concurrency 2.
- `.run(fn)` — awaits a slot, runs `fn()`, releases. Waiters are queued as resolved-promise-callbacks.
- **Correct for single-threaded JS.** No thread-safety concerns.
- **No abort / cancel mechanism** — if a caller Ctrl+Cs, pending queued callbacks are abandoned but the process exits anyway so it's fine.
- **No timeout on queue wait** — if the worker pool stalls (e.g., all 2 concurrent requests hang at 60s timeout), callers wait the full 60s.

**Lines 103-156 — `rawRequest()`.** The actual HTTP.
- Line 105: `new URL(url)` throws on malformed URLs — fine.
- Line 107: Picks `http` vs `https` module. **No redirect following.** If an API returns 301/302, the caller sees that response directly; no auto-follow. This is probably correct for API usage.
- Line 110: `options.body` gets `JSON.stringify`ed. No way to send non-JSON bodies (form-encoded, multipart, raw). All callers send JSON so this is fine.
- Line 113: Default `Accept: application/json`. Good.
- Lines 117-120: If body is present, adds `Content-Type: application/json` and `Content-Length`. Correct.
- Lines 122-124: Basic Auth from `options.auth = 'user:pass'` — converts to base64. DFS uses this.
- Line 132: **Default timeout 60000 ms (60s).** Per-request, not per-attempt. Overridable via `options.timeout`.
- Lines 136-138: **Body accumulation via string concatenation** (`data += chunk`). This is the first subtle bug — see §5.
- Line 147: `req.on('error', reject)` — handles network-level errors (DNS fail, ECONNREFUSED, etc.).
- Lines 148-151: Timeout destroys the request and rejects. Error message includes the original URL.
- **Missing:** `res.on('error', ...)` — if the *response* stream errors mid-read, the Promise hangs until process timeout.

**Lines 161-163 — Constants.**
- `DEFAULT_MAX_RETRIES = 5` → 6 attempts total.
- `BACKOFF_BASE_MS = 2000` → first retry wait is 2s.
- `BACKOFF_CAP_MS = 60000` → max wait between attempts is 60s.
- Backoff sequence: 2s, 4s, 8s, 16s, 32s, 60s. Total maximum wait across all retries: **122 seconds**. Plus up to 6 × 60s of request timeout = up to ~8 min per fatally failing request.

**Lines 165-167 — `isRetryable()`.** Retries only on 429 or 5xx. See §5 bug list for what's missing.

**Lines 169-172 — `backoffMs()`.** No jitter. See §5.

**Lines 181-227 — `fetchWithRetry()`.** The retry loop.
- Line 188: `for (let attempt = 0; attempt <= maxRetries; attempt++)` — `<=` so max 6 attempts with `maxRetries=5`.
- Lines 195-196: `byStatus` counter and `totalBytes` are incremented inside the retry loop — so for a request that gets 429 three times then 200, `byStatus` will show `{429: 3, 200: 1}` and `totalBytes` includes all four response bodies. Useful for cost analysis but note this.
- Line 198: `if (isRetryable(res.statusCode) && attempt < maxRetries)` — if we're at max retries and still getting 429, we return the 429 response (caller must handle).
- Lines 212-225: Catch handles `rawRequest`-thrown errors (network/timeout). **Same backoff schedule reused.** Also increments `stats.retries` but does NOT log to `byStatus` (because there's no status code — the request never completed).

**Lines 233-251 — `fetchJSON()`.** Throws on 4xx+5xx (unlike the other wrappers). Error objects carry `statusCode` and `responseBody` for inspection. Body is truncated to 500 chars in the error message.

**Lines 257-269 — `postJson()`.** POST convenience. **Does NOT throw on non-2xx** — returns the response. Body parse errors silently fall back to raw string (`body = res.body`). This is the function DFS scripts use most often.

**Lines 274-283 — `requestJson()`.** GET version of postJson. Same non-throwing behavior.

**Lines 288-291 — `requestText()`.** Returns raw string. Used by `gather-local-seo.js` for HTML scraping.

**Lines 293-296 — Exports.** Full public surface.

## 5. Bugs & fragility

Severity: **H** = high / **M** = medium / **L** = low.

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | 137 | **UTF-8 chunk-boundary corruption.** Body is accumulated as `data += chunk` where `chunk` is a Buffer (Node default). JavaScript string concatenation coerces the Buffer to UTF-8 string, but **chunks may split a multi-byte UTF-8 character mid-sequence**. Result: garbled é, ñ, É, ü, etc. in API responses. **Relevant to Canadian/French clients** (Calgary Castles, Murray Gardner) and to any page title that contains a multi-byte character. Fix: `res.setEncoding('utf8')` before the `data` listener, or accumulate chunks as `Buffer[]` and `Buffer.concat(chunks).toString('utf8')` on end. |
| 2 | **M** | 147 | **Missing `res.on('error', reject)`.** Network errors mid-response (connection reset after headers) leave the Promise unresolved until the outer timeout fires (60s by default). Should be a one-line fix. |
| 3 | **M** | 166 | **`isRetryable` excludes 408 (Request Timeout) and 425 (Too Early).** Some APIs return 408 under load. Also `ETIMEDOUT` / `ECONNRESET` errors from `rawRequest` are retried via the catch block — but intermittent 4xx timeouts aren't. |
| 4 | **M** | 169-172 | **No jitter in backoff.** If 5 concurrent requests to DFS all get rate-limited at the same moment, they all wait exactly 2s, then retry simultaneously — the same thundering herd that triggered the rate limit to begin with. Fix: `ms * (0.5 + Math.random() * 0.5)`. |
| 5 | **M** | 257-269, 274-283 | **API inconsistency: `fetchJSON` throws on non-2xx, but `postJson`/`requestJson` don't.** Callers must manually check `res.statusCode`. If a caller forgets, they process an error envelope as if it were data. This contract mismatch is documented nowhere in the file. |
| 6 | **L** | 72 | **`beforeExit` summary doesn't fire on `process.exit()`.** Most gather scripts call `process.exit(1)` on auth errors — so you don't get the stats summary in those cases. Minor inconsistency in observability. |
| 7 | **L** | 36-44 | **Stats singleton has no reset.** Fine for CLI (one process per script), but would be a problem for any integration test harness or orchestrator that runs multiple gather scripts in the same process. |
| 8 | **L** | — | **No gzip support.** No `Accept-Encoding: gzip` sent, no `zlib.createGunzip()` decode path. DFS and Google APIs would happily serve compressed responses; you're paying for larger-than-necessary bandwidth. Minor cost issue. |
| 9 | **L** | 183 | **Label truncation to 80 chars** — long DFS URLs with many query params can lose useful diagnostic tail in logs. |
| 10 | **L** | — | **No abort/cancel on Semaphore** — if a caller wants to cancel mid-batch, queued callbacks leak. Doesn't matter for one-shot CLI but would for anything else. |

**Codex's additional concern (§"Shared utility appears inconsistently imported"):** `gather-backlinks.js` uses `new Semaphore(2)` while importing only `postJson`. That's a **consumer bug** in `gather-backlinks.js`, not in this file. We'll catch it when we deep-dive that script.

## 6. Integration map

**Consumers (confirmed via grep):**
- `template/scripts/gather-pagespeed.js` — uses `fetchJSON` for PSI GETs
- `template/scripts/gather-domain-metrics.js` — uses `postJson`, `Semaphore`
- `template/scripts/gather-backlinks.js` — uses `postJson`, `Semaphore`
- `template/scripts/gather-organic-metrics.js` — uses `postJson`, `Semaphore`
- `template/scripts/gather-keyword-volumes.js` — uses `postJson`, `Semaphore`
- `template/scripts/gather-local-pack.js` — uses `postJson`, `Semaphore`
- `template/scripts/gather-local-seo.js` — uses `requestText`, `Semaphore`

**NOT consumers:**
- `crawl-sitemap.js`, `extract-text.js`, `browse.js`, `check-technical.js` — use Playwright, not HTTP fetch
- `ddg-search.js` — uses Playwright
- `populate-audit-data.js`, `analyze-backlink-quality.js` — file I/O only
- All `generate-*.js` deliverable scripts — no network

**Contract this module imposes on consumers:**
- Callers are responsible for checking `res.statusCode` when using `postJson`/`requestJson`/`requestText`.
- Callers must encode their own auth string (`"username:password"`) for DFS.
- Callers get automatic retry on 429/5xx and on network errors — they should NOT implement their own retry loop on top.
- All responses come back as strings (not streams) — not suitable for very large payloads (>100MB).

**Client-folder duplication:** `clients/liane-jamason/scripts/lib/fetch-with-retry.js` and `clients/matt-wallmow/scripts/lib/fetch-with-retry.js` exist as **byte-identical copies** of the template (verified via diff). This is the template-copy-to-client pattern from Step 1 of `/seo-audit`. **Risk:** If we fix a bug in the template, it doesn't propagate to existing client folders. Any client with legacy scripts will keep the old bug until re-templated. When we fix bug #1 (UTF-8) we need a decision: (a) re-template affected clients, (b) symlink client copies to template, or (c) resolve via client-side `require` path from template.

## 7. Fix / improve suggestions (ranked by ROI)

1. **Fix UTF-8 chunk-boundary corruption (bug #1).** One-line change. High user-visible impact for Canadian clients and any page with non-ASCII content. Do this first.
2. **Add `res.on('error', reject)` (bug #2).** One line. Prevents hung requests.
3. **Add jitter to backoff (bug #4).** Small change. Prevents thundering herd under rate limiting.
4. **Add 408 to `isRetryable` (bug #3).** One line. Covers an edge case.
5. **Unify non-2xx behavior across `fetchJSON`/`postJson`/`requestJson` (bug #5).** Either all throw or all return — plus an `allowNon2xx` escape hatch. Document which is which. This is a **design decision** — align on it before touching, because we'll need to audit every caller to make sure they handle the new behavior.
6. **Resolve template-vs-client-copy drift.** When we start fixing things, decide: copy forward to existing client dirs, or refactor clients to reference the template. Recommend the latter — fewer copies to maintain.
7. **Expose `resetStats()` and make summary opt-in** (bugs #6, #7). Codex flagged this too. Low priority but cleans up orchestrator behavior.
8. **Gzip support** (bug #8). Bandwidth optimization only. Skip unless we find cost pressure.

## 8. What to verify before we touch this file

- Run all 7 consumer scripts against a test client and confirm nothing relies on the current string-concatenation quirk (unlikely, but verify).
- Check the Canadian clients' existing research JSONs for existing mojibake (`Ã©` instead of `é`, `â€™` instead of `'`) — that would confirm bug #1 is biting us now.
