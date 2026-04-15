# Future Improvements — Site Audit Platform

## The Core Problem

Reports frequently generate with empty sections. The data is usually there — the
generator script just can't find it because field names, data types, or nesting
structures don't match what the renderer expects. Every fix so far has been a
one-off patch in the 1,574-line `normalizeAuditData()` function. The patches
keep growing because there's no contract between the data producers (Python
analyzers, Node.js gather scripts) and the data consumers (9 page renderers).

### Why "camelCase vs snake_case" keeps breaking things

Python convention: `quality_score`, `is_thin`, `word_count`
JavaScript convention: `qualityScore`, `isThin`, `wordCount`

The Python analyzers output snake_case. The JS renderers expect camelCase. When
the generator looks for `qualityScore` but the data has `quality_score`, that
section renders empty. The data was there the whole time — just under a different
name. This class of bug can happen for ANY field on ANY analyzer, and the only
way we catch it today is by visually inspecting all 9 report pages.

### The normalizer is a 1,574-line band-aid collection

`normalizeAuditData()` (generate-multipage-report.js lines 542-2116) has 22+
separate transform sections numbered `0, 1, 1a, 1b, 1e, 2, 3, 3a, 4, 5, 5b,
5c, 5d, 5e, 6, 6a, 6b, 6c, 7, 8, 8a`. Each one exists because a section was
empty and someone added a patch. The numbering alone tells you it grew
organically — 1a, 1b, 1e with no 1c or 1d.

---

## Stability Fixes (High Priority)

These directly address the "empty sections" problem.

### 1. Data Contract Schema (JSON Schema or Zod)

**Problem:** No contract between producers and consumers. Python outputs whatever
shape it wants. JS renderers expect a very specific shape. Nothing validates in
between.

**Solution:** Define a JSON Schema for `audit-data.json` that specifies every
required field, its type, and its nesting structure. Run validation after
`build_audit.py` writes the file and before `generate-multipage-report.js` reads
it. Any mismatch produces a clear error message ("field contentQuality.pages[0]
expects qualityScore (number), got quality_score (number)") instead of a silently
empty section.

**Inspired by:** webhint's `optionsSchema` pattern — every plugin declares the
exact schema it expects, and the framework validates at load time, not at render
time.

**Files to create:**
- `platform/schemas/audit-data.schema.json` — the contract
- `platform/scripts/validate-audit-data.js` — validation step

**Impact:** Catches every field name, type, and structure mismatch before the
report is generated. Eliminates the entire class of "data was there but under a
wrong name" bugs.

### 2. Renderer-Level Validation with Error Banners

**Problem:** When a renderer can't find data, it silently renders nothing. You
have to visually inspect all 9 pages to notice. There's no red box, no warning,
no "this section is empty because X is missing."

**Solution:** Add a shared `validateSection(data, requiredKeys)` function to each
renderer. When required data is missing, render a visible error banner:
"Content Quality section is empty. Missing: contentQuality.pages (expected
array, got undefined)." Only show these banners in draft/QA mode, strip them for
client delivery.

**Inspired by:** SEOnaut's three-tier severity display — critical issues get
prominent visual treatment, not silent omission.

**Key renderer contracts to enforce (discovered via audit):**

| Renderer | Most Fragile Point | What It Expects |
|---|---|---|
| content.js | `readability` field | Must be object, not JSON string |
| content.js | `wordCountRange` | Must be array `[min, max]` |
| technical.js | `lighthouseResults` | Array with `.performanceScore` as number |
| competitors.js | `siteComparison` values | Must be numeric, not "High"/"Medium"/"Low" |
| backlink-opportunities.js | `opportunities[].competitors` | Must be array of domain strings |
| keywords.js | `rankHistory.keywords` | Must be object (not array) with keyword name keys |
| links.js | `depthResult.depths` | Must be object with string keys ('0', '1', '2') |
| local.js | service area coordinates | Needs businessProfile lat/lng OR GeoJSON Point |
| index.js | `competitorComparison` columns | Must use `comp1`, `comp2` numbering, not domain names |
| action-plan.js | content calendar | Must use `.month1`-`.month6` keys exactly |

### 3. Replace the Monolithic Normalizer with Per-Section Generators

**Problem:** `normalizeAuditData()` is 1,574 lines in a single function. It's
untestable, unmaintainable, and the ordering of transforms creates hidden
dependencies (section 1a depends on section 2 having already run).

**Solution:** Split into named functions:
- `buildKeywordsData(rawData, researchDir) → keywordsPayload`
- `buildTechnicalData(rawData, researchDir) → technicalPayload`
- `buildContentData(rawData, researchDir) → contentPayload`
- `buildLocalData(rawData, researchDir) → localPayload`
- etc.

Each function is independently testable. Each HTML page receives only its section
data (`window.PAGE_DATA = buildKeywordsData(auditData)`) instead of the full
137KB blob injected into all 9 pages.

**Inspired by:** Allure Report's 15 specialized generators — each produces one
JSON artifact, and they're individually testable. Also reduces HTML file sizes
from ~300KB to ~50-80KB each.

### 4. Automatic snake_case to camelCase at the Boundary

**Problem:** Every time a Python analyzer adds a new field in snake_case, the JS
renderer breaks. The current fix (line 1337-1350) only handles `quality_score`,
`readability_score`, `is_thin`, and `structure_score`. Any new snake_case field
from any analyzer will silently fail.

**Solution:** Run a recursive `snakeToCamel()` transform on the entire
`audit-data.json` immediately after loading it — before any section-specific
normalization. This was partially added in a previous session but only for the
contentQuality section. It should be global.

Note: A `normalizeSnakeToCamel()` function already exists in the generator but
is not called on the full data object. Wire it up as the first step in the
normalization pipeline.

### 5. Preflight Validation in build_audit.py

**Problem:** `build_audit.py` discovers missing API keys mid-run after other
steps already completed. If the DataForSEO credentials are missing, you find out
5 minutes into the run when the backlinks step fails.

**Solution:** Add a `preflight_check()` method that runs before any step:
- Validate all required API keys are present for enabled steps
- Validate domain format
- Validate output path is writable
- Validate crawl-data.json exists and has pages (if content steps are enabled)

Exit with code 2 (config error) immediately if preflight fails.

**Inspired by:** SiteOne Crawler's input validation — validates everything before
any work begins. Also their exit code taxonomy: 0 (success), 1 (step failed,
partial data), 2 (config error), 3 (no pages crawled).

### 6. Per-Step Cache Writes

**Problem:** `build_audit.py` only writes `audit-data.json` at the very end. If
the process crashes mid-run, all completed steps are lost. The next run starts
from scratch.

**Solution:** Write a partial `audit-data.json` after each step completes. If the
orchestrator crashes, the next run can detect existing step outputs and skip them
(with a `--use-cache` flag).

**Inspired by:** Unlighthouse's cache-on-disk pattern — interrupted runs resume
automatically without re-processing completed pages.

**Also add:** A `build-manifest.json` alongside `audit-data.json` that records
which steps ran, their status, duration, and error messages. This is the audit
log in machine-readable form.

---

## Reliability Improvements (Medium Priority)

### 7. Silent Exception Swallowing

**Problem:** Multiple places in `build_audit.py` catch all exceptions and return
empty data with no logging:

```python
try:
    client_kws = connector.get_organic_keywords(domain, limit=500)
except Exception:
    client_kws = []  # No logging! Silent failure
```

**Solution:** At minimum, log the exception at WARNING level. Better: return a
`StepResult` with `status="partial"` and the error message, so the report can
show "Organic keywords: API error (HTTP 429)" instead of an empty section.

### 8. Typed Issue Objects

**Problem:** Issues throughout the system are stored as plain strings:
`"Missing meta description on /about/"`. There's no severity, no category, no
structured data. The action plan can't automatically prioritize because it
doesn't know which issues are critical.

**Solution:** Standardize on a structured issue format across all analyzers:

```python
@dataclass
class SEOIssue:
    id: str           # "missing-meta-description"
    severity: str     # "critical" | "high" | "low"
    category: str     # "technical" | "content" | "local" | "backlinks"
    url: str          # affected page
    message: str      # human-readable description
    fix: str          # recommended action
```

**Inspired by:** SEOnaut's three-tier severity + webhint's
`HintContext.report()` with explicit `{severity, message, location, fix}`.

**Bonus:** This enables the action plan to be auto-generated from issues:
critical → Quick Wins, high → Short Term, low → Long Term. Currently the action
plan is manually authored by the AI, which sometimes hallucinates priorities.

### 9. Gather Script Runner Contract

**Problem:** The 7 gather scripts are all standalone Node.js processes with
different argument patterns, output shapes, and error handling. There's no way to
run them uniformly or skip individual scripts.

**Solution:** Define a formal contract:

```javascript
module.exports = {
  name: 'gather-pagespeed',
  requires: ['PAGESPEED_API_KEY'],  // env vars needed
  run: async (config) => ({
    status: 'ok' | 'partial' | 'failed',
    data: { ... },
    errors: [{ endpoint, code, reason }],
    gatheredAt: new Date().toISOString(),
  }),
};
```

A single orchestrator script (`gather-all.js`) imports each module and runs them
in sequence or parallel, with unified error handling and a single summary log.

**Inspired by:** Pa11y's runner contract — `{scripts, supports, run}`. Also
seo-analyzer's operations queue pattern (defer execution, flush on `run()`).

### 10. Timeout Protection

**Problem:** No timeout protection anywhere. If a gather script hangs on a slow
API, the entire process blocks forever. If an analyzer's NLP processing takes
too long, it blocks subsequent steps.

**Solution:**
- Wrap each gather script in a process-level timeout (e.g., 5 minutes)
- Wrap each Python analyzer step in `asyncio.wait_for(step(), timeout=120)`
- On timeout, write partial results and continue to next step

**Inspired by:** webhint's 60s per-hint timeout and jsreport's three-tier timeout
(report total, worker allocation, per-worker margin).

---

## Feature Additions (Lower Priority)

These come from patterns seen across 10 open-source projects.

### 11. Rule Registry Pattern for Analyzers

Convert individual check methods in analyzers (like `audit_meta_tags`,
`audit_images` in TechnicalSeoAnalyzer) from hard-coded method calls into a
registered rule system:

```python
@rule(id="title-too-short", category="technical", severity="high")
def check_title_length(page):
    if len(page.title) < 30:
        return SEOIssue(...)
```

Benefits: toggle rules on/off per client, run subsets for quick re-checks, add
new checks without modifying orchestrator code.

**Inspired by:** seo-analyzer (Mad Devs) — rules are pure functions with
`(dom, options) => Issue[]` signature. Also webhint's plugin architecture.

### 12. Single-File HTML Export

Add a `--single-file` flag to `generate-multipage-report.js` that produces one
self-contained HTML file with all CSS, JS, and data inlined. Useful for email
attachments and archiving.

The `--inline` flag already handles CSS inlining. Extending it to also inline
the page JS (currently in `shared/` and `pages/`) would yield a fully portable
report.

**Inspired by:** Allure Report's `singleFile: true` option that switches the
writer from disk-based to in-memory accumulation.

### 13. Per-Page Data Injection (Reduce HTML Size)

Currently all 9 HTML pages receive the full `audit-data.json` (~137KB) as
`window.AUDIT_DATA`. Each page only uses a fraction of it. Injecting only the
relevant subset per page would:
- Reduce HTML file sizes from ~300KB to ~50-80KB
- Improve browser load time
- Make per-page regeneration possible without the full dataset

### 14. Data Provenance Tracking

When a gather script finds a URL, keyword, or metric, log what research file or
API call surfaced it. This makes it possible to trace any number in the report
back to its source.

**Inspired by:** Unlighthouse's `discoveredFrom` field on routes.

### 15. Client-Side Severity Overrides

Allow `client-config.json` to specify rule overrides:
```json
{
  "ruleOverrides": {
    "title-too-short": "low",
    "missing-schema": "ignore"
  }
}
```

This lets you suppress noise for clients where certain rules aren't relevant
(e.g., a one-page landing page doesn't need internal linking warnings).

**Inspired by:** webhint's user-override-severity pattern.

### 16. CI/CD Exit Codes

Adopt a taxonomy of exit codes from `build_audit.py`:
- `0` — all steps succeeded
- `1` — some steps failed, partial data written
- `2` — fatal config error (missing keys, bad domain), no data written
- `3` — no pages crawled / empty crawl data
- `10` — data quality gate failed (critical issues above threshold)

**Inspired by:** SiteOne Crawler's `1`/`3`/`10` exit code system.

### 17. Multi-Format Export

Add `--format json|html|csv|xlsx` to the report generator. The same pipeline
should serve human-readable HTML reports and machine-readable exports for repeat
clients who want to track metrics over time.

**Inspired by:** site-audit-seo's support for console, JSON, CSV, XLSX, web, and
Google Drive export from the same audit data.

### 18. Process-Exit Partial Write

If a gather script crashes mid-run, write whatever data was collected. The
`fetch-with-retry.js` module already uses `process.on('beforeExit', printSummary)`
for stats — extend this to also write partial JSON results.

**Note:** The `beforeExit` hook currently fires even when the module is imported
(not run standalone). Guard it with `if (require.main === module)` to prevent
misleading summaries when imported by other scripts.

---

## Open-Source Tools Worth Studying Further

| Tool | Why | What to Look At |
|---|---|---|
| [Unlighthouse](https://github.com/harlan-zw/unlighthouse) | Worker pool, partial results, cache resume | `types.ts` (UnlighthouseWorkerStats), hookable lifecycle |
| [webhint](https://github.com/webhintio/hint) | Plugin architecture, per-hint timeout, schema validation | HintContext isolation, optionsSchema |
| [Pa11y](https://github.com/pa11y/pa11y) | Runner contract, finally-block cleanup | `{scripts, supports, run}` interface |
| [seo-analyzer (Mad Devs)](https://github.com/maddevsio/seo-analyzer) | Rules as pure functions, builder/chain API | Rule `(dom, options) => Issue[]` |
| [SEOnaut](https://github.com/StJudeWasHere/seonaut) | Severity tiers, clean package separation | `issues/`, `services/`, `models/` |
| [Allure Report](https://github.com/allure-framework/allure3) | Self-contained HTML, per-section generators | `singleFile` option, InMemoryWriter |
| [SiteOne Crawler](https://github.com/janreges/siteone-crawler) | Exit codes, preflight validation, zero deps | Input validation before crawl starts |
| [advertools](https://github.com/eliasdabbas/advertools) | DataFrame pipelines, typed returns | `*_to_df` naming, composable outputs |
| [jsreport](https://github.com/jsreport/jsreport) | Timeout tiers, worker isolation, error categorization | `WORKER_TIMEOUT` vs `WORKER_ABORTED` |
| [site-audit-seo](https://github.com/viasite/site-audit-seo) | Multi-format export, CSV intermediate layer | `--csv`, `--no-remove-csv` flags |

---

## Recommended Implementation Order

1. **Data contract schema** — foundation; catches all field mismatches before render
2. **Global snake_case→camelCase transform** — eliminates the #1 recurring bug class
3. **Preflight validation** — prevents wasted partial runs
4. **Per-step cache writes** — prevents lost work on crashes
5. **Renderer error banners** — makes empty sections visible during QA
6. **Split normalizer into per-section generators** — makes transforms testable
7. **Silent exception logging** — surfaces hidden failures
8. **Typed issue objects** — enables auto-generated action plans
9. **Gather script runner contract** — uniform error handling across all scripts
10. **Timeout protection** — prevents hangs from blocking entire runs
