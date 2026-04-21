# Tier 2 — Ultra Plan: three reliability fixes for the site-audit pipeline

## Context

Tier 1 + 1.5 + auto-sync shipped (commits `76e8535` → `0f14516`). The pipeline now actually runs internal-linking analysis, gather-backlinks.js imports `Semaphore`, Agent 2 no longer overwrites crawl outputs, Yoast-styled sitemaps parse, and client scripts auto-heal against `template/` on every `/seo-audit` invocation.

Tier 2 is the **categorical reliability** tier. Three orthogonal fixes that each harden one failure mode:

1. **Fix 4** — parameterize local-pack location so clients outside the default US country-level SERP actually get local-pack data.
2. **Fix 5** — make `audit-data.json` rewrites atomic + backed up, so a crash or concurrent edit can't corrupt the pipeline's single source of truth.
3. **Fix 6** — extend Python connector retry coverage to HTTP 5xx and to the sync request path.

All three are independent. Execution order recommended: **5 → 4 → 6** (rationale in §Order).

Verification discipline is carried forward from `HANDOFF-POST-TIER-1.md` §4: **each fix verified at its narrowest boundary** against `matt-wallmow`, no full-pipeline `/seo-audit` runs. Baselines captured to `/tmp/matt-*.pre-fixN.*` before mutating state.

Repo: `/root/site-audit-fix-work/` · Branch: `site-audit-fixes` · Base: `0f14516` · Commit footer: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

---

## Fix 5 — Atomic, backed-up `audit-data.json` rewrites

**Findings:** #11 (`04-analysis-population/11-populate-audit-data.md`), #15 (`03-api-gathering/15-gather-keyword-volumes.md`)

### Problem

Two writers clobber `audit-data.json` in place with no atomicity and no backup:

| File | Line | Call |
|---|---|---|
| `template/scripts/populate-audit-data.js` | 461 | `fs.writeFileSync(AUDIT_DATA_PATH, JSON.stringify(data, null, 2));` |
| `template/scripts/gather-keyword-volumes.js` | 297 | `fs.writeFileSync(auditPath, ${JSON.stringify(auditData, null, 2)}\n);` |

Both run in sequence during `/seo-audit` Step 5 (seo-audit.md lines 785 and 821). A crash, signal, or concurrent editor write mid-`writeFileSync` leaves the file partial / invalid JSON — and the pipeline's single source of truth is gone, with no `.bak` to recover from.

`build_audit.py:871` also rewrites `audit-data.json` non-atomically, but that's in a later step, a different layer, and is **out of scope for Tier 2**. Note it for Tier 3/4.

### Fix direction

No existing atomic-write utility in the repo (searched `template/scripts/lib/` and repo-wide for `fs.rename`/`.tmp`/`mkstemp`). Add a tiny shared helper, then call it from both writers. Since Step 1.5 recursively syncs `template/scripts/**` into every client, a new `template/scripts/lib/atomic-write.js` propagates automatically on the next audit.

**New file: `template/scripts/lib/atomic-write.js`**

```js
// Single exported function. No deps beyond node:fs + node:path.
// writeJsonAtomic(targetPath, value, { indent = 2 } = {})
//   1. If target exists: copy to `${target}.bak` (overwrites any prior .bak).
//   2. Write JSON to `${target}.tmp-<pid>-<ts>` with fsync.
//   3. fs.renameSync(tmp, target).
// On any throw between (1) and (3), target is untouched (.bak preserved) and .tmp is best-effort unlinked.
```

POSIX rename is atomic within a filesystem; `.tmp` sibling guarantees same-fs. fsync before rename prevents a power-loss-visible-but-empty file.

**Changes:**

- `template/scripts/populate-audit-data.js:461` → replace `fs.writeFileSync(...)` with `writeJsonAtomic(AUDIT_DATA_PATH, data)`. Add `require('./lib/atomic-write')` import at top.
- `template/scripts/gather-keyword-volumes.js:297` → same substitution with `auditPath` + `auditData`. Note the trailing `\n` the current code emits — preserve by having the helper optionally append a trailing newline, or match behaviour by indent option. Keep output byte-identical except for atomicity.

### Blast radius

- **Producers touched:** the two scripts above only.
- **Consumers of `audit-data.json`:** `generate-multipage-report.js`, `build_audit.py`, XLSX/PPTX builders, every page-renderer — all **readers**, and the on-disk schema is unchanged. Zero consumer impact.
- **`.bak` files:** new on disk at `clients/<client>/seo/audit-data.json.bak`. **Verified not in `.gitignore`** (current `.gitignore` covers `clients/*/scripts/_backup/` but nothing under `seo/`). Fix 5's commit must also add `clients/*/seo/audit-data.json.bak` to `.gitignore` so the working tree stays clean. Fixed name (not timestamped) so disk doesn't balloon.
- **Step 1.5 sync:** new `lib/atomic-write.js` is missing in every existing client → on each client's next `/seo-audit` run, Step 1.5 will report `[NEW] lib/atomic-write.js` copy actions. Expected and desirable.
- **Require path:** both target scripts are invoked from the client dir as `node scripts/...`, so `require('./lib/atomic-write')` inside `scripts/populate-audit-data.js` and `scripts/gather-keyword-volumes.js` resolves to `clients/<client>/scripts/lib/atomic-write.js`. Matches the exact pattern used by `gather-local-pack.js:28` and `gather-local-seo.js:46` for `./lib/fetch-with-retry`. Verified.

### Critical files to read before editing

- `template/scripts/populate-audit-data.js` (full, 473 lines — we're changing load/merge/write flow at the tail).
- `template/scripts/gather-keyword-volumes.js` (full, 303 lines — write path starts line 295, check `auditPath && auditData` guard).
- `template/scripts/lib/fetch-with-retry.js` — follow its export/require style and header comment conventions so the new lib file matches.
- `commands/seo-audit.md` Step 1.5 — confirm the recursive walk picks up `lib/atomic-write.js`.

### Verification (matt-wallmow)

1. `cp clients/matt-wallmow/seo/audit-data.json /tmp/matt-audit-data.pre-fix5.json`
2. Install fix, copy updated scripts into matt's dir (or let Step 1.5 do it — but for narrow-boundary test, copy just the two scripts + new lib, not via skill).
3. **Happy path:** run `node scripts/populate-audit-data.js --force` (in matt's dir). Expect: exit 0, `audit-data.json` valid JSON, `audit-data.json.bak` exists and equals the pre-run file. Re-run; `.bak` now equals the post-first-run file.
4. **Crash mid-write:** temporarily inject `process.exit(1)` between the in-memory update and the write call, or patch `writeJsonAtomic` to throw between fsync and rename. Expect: `audit-data.json` bytes unchanged from pre-run, `.bak` exists, `.tmp-*` best-effort cleaned (inspect; manual `rm` tolerated if present).
5. Repeat (3) + (4) for `gather-keyword-volumes.js` — pass `--from-audit seo/audit-data.json`. Confirm the trailing-newline byte is preserved.
6. `diff /tmp/matt-audit-data.pre-fix5.json <(jq -S . clients/matt-wallmow/seo/audit-data.json)` to confirm no semantic drift from the fix itself.

### Rollback

Revert both script commits. `.bak` files are harmless leftovers. No schema, no consumer, no config touched.

### Commit plan

Two commits (one fix, but two touched scripts + one new lib — the finding docs are two separate findings so two commits keeps the 1:1 mapping):

- Commit A: `fix(scripts): atomic-write helper for audit-data.json rewrites` — adds `template/scripts/lib/atomic-write.js`, updates `populate-audit-data.js:461`, adds `clients/*/seo/audit-data.json.bak` to `.gitignore`. References finding #11.
- Commit B: `fix(scripts): use atomic-write in gather-keyword-volumes` — updates `gather-keyword-volumes.js:297`. References finding #15.

---

## Fix 4 — Parameterize `--location` in `gather-local-pack.js`

**Finding:** #12 (`03-api-gathering/12-gather-local-pack.md`)

### Problem

`template/scripts/gather-local-pack.js:63`:

```js
const locationCode = parseInt(getArg('--location', '2840'), 10);
```

`2840` is DataForSEO's **country-level US** code. DFS returns "US top results" not a city-local pack. matt-wallmow's 25 "Rhinelander WI" keywords all return empty `packItems[]` with status `success` — silent false-negative.

Only invocation (`commands/seo-audit.md:805`):

```bash
node scripts/gather-local-pack.js --from-audit seo/audit-data.json --location 2840
```

### Fix direction

Adopt the `loadConfig()` pattern from `template/scripts/gather-local-seo.js:62-86` (the gold-standard client-config reader in this repo). Resolution order:

1. `--location` CLI flag (explicit override, unchanged behaviour for ad-hoc runs).
2. `client-config.json` new field `locationCode` (numeric DFS code).
3. Hardcoded `2840` fallback with a prominent `console.warn` — never silently.

**Changes:**

- `template/scripts/gather-local-pack.js`:
  - Add a `loadClientConfig()` helper modelled on `gather-local-seo.js:62-86`.
  - Resolution: `--config <path>` flag → explicit path. Else `./client-config.json` (cwd = client dir during skill invocation, matching how `--from-audit seo/audit-data.json` already resolves relative to cwd in the current script).
  - Priority: `--location` CLI flag → `cfg.locationCode` → fallback `2840` with a prominent `console.warn` listing which sources were checked.
  - Integer validation on whichever source wins (reject non-positive, non-integer values; exit 1 with a clear message rather than silently falling to 2840).
- `commands/seo-audit.md:805` — drop the `--location 2840` arg. Keeping it makes the fix inert because CLI flag overrides config. Operators who need an ad-hoc override can pass it at shell level.
- `clients/matt-wallmow/client-config.json` — add `"locationCode": <CODE>` where `<CODE>` is resolved **live from DFS during verification**, not guessed. **Do not commit a placeholder.** The verification step below includes the lookup as a prerequisite.

### Blast radius

- **Producers:** only `gather-local-pack.js` reads `locationCode` from config. No other script needs it (Matt's `gather-local-seo.js` consumes human-readable `location` for a different API path).
- **Consumers:** `generate-multipage-report.js:2931` reads `local-pack-data.json` unchanged — only the DFS query's `location_code` changes, not the output schema. `audit-data.localSeo.mapPackKeywords` shape is identical.
- **Other clients without `locationCode` in config** (laura-willis, liane-jamason, cohort): fall back to `2840` with a warning. Add `locationCode` to each over time; **out of scope for this commit** — Tier 4 has the cohort re-template pass.

### Critical files to read before editing

- `template/scripts/gather-local-pack.js` full (215 lines).
- `template/scripts/gather-local-seo.js` lines 62-86 — the `loadConfig()` pattern to clone.
- `commands/seo-audit.md` Step 5.5 (around line 800-810) — invocation context.
- `clients/matt-wallmow/client-config.json` — field layout.
- DFS locations endpoint (live): resolve the correct numeric code for Rhinelander before committing matt's config.

### Verification (matt-wallmow — go/no-go gate, requires live DFS)

**This fix has three plausible root causes for matt's empty packs:** (a) country-vs-city location code, (b) DFS renamed `type: 'local_pack'` silently breaking the line-137 filter, (c) `device: 'desktop'` suppresses local pack rendering. **Only (a) is what this fix addresses.** The pre-fix empirical check is a go/no-go gate, not a checkbox — if a city-level code also returns empty, the real bug is elsewhere and shipping this fix does nothing but add config surface.

1. `cp clients/matt-wallmow/seo/research/local-pack-data.json /tmp/matt-local-pack.pre-fix4.json`
2. **Live code lookup (prerequisite, do before committing matt's config):** query DFS `/v3/serp/google/locations` for "Rhinelander, Wisconsin, United States" → record the actual `location_code` returned. If no city-level code exists for Rhinelander specifically, step up to the closest county/metro and note the substitution.
3. **Go/no-go empirical check (DO NOT SHIP IF THIS FAILS):** run the current script (unmodified) twice on a single geo-tagged keyword like "real estate rhinelander wi":
   - Once with the hardcoded `--location 2840` (country).
   - Once with `--location <city-code-from-step-2>`.
   - Compare `packItems.length` and the raw `items` returned.
   - **If the city code returns non-empty and country does not →** causally validated, proceed with the fix.
   - **If both return empty →** pause per handoff §4. The root cause is (b) or (c), not the location code. Report back before writing any code for this fix. Candidate next investigations: inspect raw DFS response for new item `type` values, try `device: 'mobile'`, try `tag`/`load_async_ai_overview` flags.
4. Add the verified `locationCode` to `clients/matt-wallmow/client-config.json`. Ship the script + skill changes.
5. Run `node scripts/gather-local-pack.js --from-audit seo/audit-data.json` (no explicit `--location`). Confirm stdout shows the config-derived code (not `2840`) and `local-pack-data.json.locationCode` matches config.
6. Confirm `--location 9999 --from-audit ...` still wins over config (CLI override precedence preserved).
7. Confirm removing `locationCode` from config falls back to `2840` with a visible warn line.

### Rollback

Revert the commit; `clients/matt-wallmow/client-config.json` reverts the `locationCode` field too. Next audit regenerates `local-pack-data.json` with the old country code — no data-shape damage.

### Commit plan

One commit: `fix(local-pack): derive location_code from client-config.json`. Touches `template/scripts/gather-local-pack.js`, `commands/seo-audit.md:805`, `clients/matt-wallmow/client-config.json`. References finding #12.

---

## Fix 6 — Retry coverage in `platform/src/audit_platform/connectors/base.py` + DataForSEO routing

**Finding:** #40 (`09-python-connectors/40-connectors-base.md`)

### Problem

`base.py` current state (140 lines):

- Lines 77–99 — `async def _request()`: has `@retry` from `tenacity`, but only on `httpx.TransportError` and `httpx.TimeoutException`. 5xx (raised as `HTTPStatusError` from `response.raise_for_status()` at line 98) is **not retried**.
- Lines 101–117 — `def _request_sync()`: has **no retry decorator at all**. Same `raise_for_status()` at line 116.

All 10 concrete connectors are sync-only. **Most bypass `_request_sync()` entirely** and call `self.sync_client.request()` / `.post()` directly. Fixing base.py alone is near-zero production impact — the hottest path (DataForSEO) doesn't touch it.

### Scope (decided: Base + DataForSEO)

Base-only is symbolic. The user's reliability stance ("I don't want to have those days") rules out shipping a no-op. Scope is **Base + DataForSEO**:

- **Base:** extend retry predicate to cover 5xx; add `@retry` to `_request_sync`.
- **DataForSEO:** refactor `dataforseo.py:_post` (the single shared entrypoint that all 20+ API methods funnel through) to route through `_request_sync`. One function, one diff, one subclass — every DataForSEO endpoint gets retry coverage transparently.
- **Other 9 connectors:** flagged as a dedicated Tier 3 sweep. They're called less often than DataForSEO and a coordinated refactor is cleaner than mixing it into Tier 2. If Tier 3 turns out to be heavier unrelated work, we can pull the sweep forward into a Tier 2.5 (same promotion pattern as Finding #5 bug #2 → Tier 1.5).

### Fix direction

Tenacity's `retry_if_exception_type` can't inspect status codes. Use a custom predicate:

```python
def _retry_on_transient(exc):
    if isinstance(exc, (httpx.TransportError, httpx.TimeoutException)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return 500 <= exc.response.status_code < 600
    return False
```

Replace both decorators with:

```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=1, max=30),
    retry=retry_if_exception(_retry_on_transient),
    reraise=True,
)
```

Add `@retry` to `_request_sync()` with the same config.

Import: swap `retry_if_exception_type` for `retry_if_exception`.

### Blast radius

- **DataForSEO (all 20+ methods):** now retry automatically on 5xx and on `TransportError`/`TimeoutException` because `_post` is the single entrypoint. No caller-visible API change — success path returns identical JSON; failure-after-3-attempts still raises `HTTPStatusError`.
- **Other 9 subclasses calling `self.sync_client` directly:** unaffected. Flagged in commit body as Tier 3 sweep work.
- **Rate-limiter interaction** (`_rate_limit_sync` at base.py:68-75): retries call the decorated function fresh each time, so rate-limit sleeps re-trigger between attempts. Acceptable — preserves politeness on retry. **Within a single attempt**, rate-limit must fire exactly once — handled by dropping the redundant `_rate_limit_sync()` call in `_post` (see implementation details below).
- **Tests:** no `test_base.py` or `test_dataforseo.py` exists. `conftest.py` mocks `httpx.Client` globally. Add minimal `test_connectors_base.py` that asserts 3 attempts on 503, 1 attempt on 404, 3 attempts on timeout.

### Critical files to read before editing

- `platform/src/audit_platform/connectors/base.py` full (140 lines).
- `platform/tests/conftest.py` — existing httpx mock fixture, pattern for mocking 503s.
- `platform/src/audit_platform/connectors/dataforseo.py:80-94` — `_post` is the refactor target; lines 89 (`_rate_limit_sync`) and 93 (`raise_for_status`) both need to go when routing through `_request_sync`.

### Verification (narrowest boundary)

1. Add a minimal `platform/tests/test_connectors_base.py`:
   - Mock `httpx.Client.request` to return a 503 response. Assert the decorated `_request_sync` calls it 3 times before raising `HTTPStatusError`.
   - Mock returning a 404. Assert it calls once (not retried).
   - Mock raising `httpx.TimeoutException`. Assert 3 attempts (existing behaviour preserved).
2. Run `pytest platform/tests/test_connectors_base.py -v`.
3. Skip live-DFS empirical verification — the change is bounded to base.py and the predicate, and mocked tests are the narrowest boundary.

### Rollback

Revert both commits in reverse order (dataforseo first, then base). Predicate disappears; decorators revert; `_post` returns to direct `self.sync_client.post()`.

### Implementation details — watch for double rate-limiting

After refactor, `dataforseo.py:_post` currently calls `self._rate_limit_sync()` at line 89, then `self.sync_client.post(...)` at line 92. Routing through `_request_sync` means rate-limiting fires **twice** per request unless we drop line 89. **Remove the explicit `_rate_limit_sync()` call in `_post`** when swapping to `_request_sync` — the decorated method handles it at line 107.

Refactored `_post` shape:

```python
def _post(self, path: str, payload: list[dict[str, Any]]) -> dict[str, Any]:
    url = f"{_BASE_URL}{path}"
    self.log.debug("dataforseo_request", url=url, tasks=len(payload))
    resp = self._request_sync("POST", url, json=payload, auth=self._auth)
    return resp.json()
```

`_request_sync` already calls `raise_for_status()` internally, so the explicit call at line 93 also goes away.

### Commit plan

Two commits:

- Commit A: `fix(connectors): retry 5xx in base + add @retry to _request_sync`. Touches `platform/src/audit_platform/connectors/base.py` + new `platform/tests/test_connectors_base.py`. References finding #40. Body notes Tier 3 will sweep the remaining 9 subclasses.
- Commit B: `refactor(dataforseo): route _post through base._request_sync for retry coverage`. Touches `platform/src/audit_platform/connectors/dataforseo.py`. Drops the redundant `_rate_limit_sync` call.

---

## Order of execution & reasoning

**5 → 4 → 6**

1. **Fix 5 first.** Self-contained, no external dependencies, no go/no-go gate. Introduces a shared helper (`lib/atomic-write.js`) that Step 1.5 propagates. Safest first step — if anything later derails, audit-data.json rewrites are already hardened.
2. **Fix 4 second.** Has a go/no-go gate (live DFS empirical check) that could pause the fix entirely. Doing it second — not last — means we know the gate's outcome before we commit to Fix 6's test work. If Fix 4 pauses, Fix 6 still ships.
3. **Fix 6 last.** Pure Python change, two commits, narrowest tests. Fastest to iterate once we're through the JS-side work.

---

## End-of-tier verification checklist (once all three ship)

Run after the last commit, before pushing:

- [ ] `git status` clean; branch at 5 commits past `0f14516` (Fix 5 → 2, Fix 4 → 1, Fix 6 → 2).
- [ ] Fix 5 round-trip: crash-inject test confirms `audit-data.json` is unchanged and `.bak` exists after simulated mid-write failure.
- [ ] `node clients/matt-wallmow/scripts/populate-audit-data.js --force` succeeds; post-run `audit-data.json` is valid JSON and semantically equal to pre-run (jq -S diff).
- [ ] Fix 4 go/no-go empirical check passed (city code returns non-empty packs on "real estate rhinelander wi" while country code returns empty). If it didn't, Fix 4 was PAUSED and this checklist item is explicitly deferred.
- [ ] `node clients/matt-wallmow/scripts/gather-local-pack.js --from-audit seo/audit-data.json` (no `--location`) uses the config'd code and returns non-empty `packItems` on at least one geo keyword.
- [ ] `pytest platform/tests/test_connectors_base.py -v` — all retry cases pass (3 attempts on 503, 1 attempt on 404, 3 attempts on timeout).
- [ ] `git diff 0f14516...HEAD -- platform/src/audit_platform/connectors/dataforseo.py` review: `_post` routes through `_request_sync`, no double rate-limit, no other drift.
- [ ] `git diff 0f14516...HEAD` wide review: every change maps to exactly one of the three fixes, zero unrelated drift.
- [ ] `gh auth setup-git && git push` per global CLAUDE.md (remote: `github.com/tastyppc-marketing/site-audit`, branch `site-audit-fixes`).
- [ ] Defer full-pipeline `/seo-audit` integration test to the post-tier punch-list in HANDOFF-POST-TIER-1.md §6.

---

## Out-of-scope for Tier 2 (tempting, but no)

- **`build_audit.py:871` non-atomic write.** Python-side twin of Fix 5. Belongs to Tier 3 Python-reliability work.
- **Refactoring every connector to use `_request_sync`** (Fix 6 Option C). Tier 3.
- **Adding `locationCode` to non-matt clients** (laura-willis, liane-jamason, cohort). Tier 4 cohort pass.
- **City → DFS code lookup table.** Nice-to-have; configs currently have human-readable `location` strings. If a lookup table were built, `gather-local-seo.js` would benefit too. Post-tier work.
- **Dropping the dead `competitorRank` field** from `audit-data.keywords[]`. Schema hygiene, unrelated to reliability.
- **Pre-commit hook protecting Step 1.5.** Already deferred in §6 of the handoff.
- **Cohort re-template bulk ops.** That is literally Tier 4.

---

## Critical files reference

| File | Role | Why read |
|---|---|---|
| `template/scripts/populate-audit-data.js:461` | Fix 5 write site | Replace with atomic write |
| `template/scripts/gather-keyword-volumes.js:297` | Fix 5 write site | Replace with atomic write |
| `template/scripts/lib/fetch-with-retry.js` | Fix 5 style reference | Match lib/ file conventions |
| `template/scripts/gather-local-pack.js:63, 118` | Fix 4 hardcode + payload | Replace resolution logic |
| `template/scripts/gather-local-seo.js:62-86` | Fix 4 pattern donor | `loadConfig()` to clone |
| `commands/seo-audit.md:805` | Fix 4 invocation | Drop `--location 2840` |
| `clients/matt-wallmow/client-config.json` | Fix 4 config | Add `locationCode` |
| `platform/src/audit_platform/connectors/base.py:77-117` | Fix 6 target | Predicate + decorator |
| `platform/tests/conftest.py` | Fix 6 test infra | httpx mock fixture |
| `platform/src/audit_platform/connectors/dataforseo.py:80-94` | Fix 6 refactor target | `_post` routes through `_request_sync` |
| `Claude Code Findings/HANDOFF-POST-TIER-1.md` §4 | Verification discipline | Carry forward |
