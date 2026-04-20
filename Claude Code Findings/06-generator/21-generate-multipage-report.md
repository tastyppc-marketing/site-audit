# Deep Dive #21 — `template/reports/multipage/generate-multipage-report.js`

**File:** [`template/reports/multipage/generate-multipage-report.js`](/root/site-audit/template/reports/multipage/generate-multipage-report.js) (**3160 lines**)
**Layer:** 06 — generator (the normalizer + HTML injector — the core rendering pipeline)
**Cross-reference:** [`codex findings/01-orchestrators/02-generate_multipage_report.md`](/root/site-audit/codex findings/01-orchestrators/02-generate_multipage_report.md)
**Template-vs-client drift:** **CRITICAL — 3 clients run significantly stale versions.** See §6.
**Template-vs-skill drift:** Invoked via HANDOFF.md:72-76 with `--data --output --inline`.
**Date:** 2026-04-20

**Scope note:** 3160 lines — too large for an exhaustive line-by-line walk in a single finding. This deep-dive documents ARCHITECTURE + DRIFT + CROSS-FINDING BUG INDEX. Per-section deep-dives of the 13 HANDOFF auto-fix implementations are deferred to follow-ups #21b-#21n.

---

## 1. Purpose

The **heart of the report pipeline.** Does three things:

1. **Normalize** — `normalizeAuditData()` (lines 571-2981) reads `audit-data.json` + ~10 sibling research JSON files and aliases, hoists, reshapes, and auto-populates ~13 fields per HANDOFF.md auto-fix inventory.
2. **Validate** — `validateAuditData()` (lines 2982-3034) emits critical/warning messages per-page if required fields are missing.
3. **Inject** — `main()` (lines 3035-3149) reads 9 HTML templates, replaces `__AUDIT_DATA_PLACEHOLDER__` and `__SEARCH_INDEX_PLACEHOLDER__` with JSON.stringify'd data, optionally inlines CSS, always inlines JS, writes 9 self-contained HTML pages plus copied `shared/`, `pages/`, `assets/` directories.

**Output:** 9 standalone HTML pages that work from `file://` (no server required). Per-client: `seo/reports/multipage-report-<slug>-<date>/{index,keywords,content,technical,links,backlink-opportunities,competitors,local,action-plan}.html`.

## 2. Inputs

| Arg | Default | Purpose |
|---|---|---|
| `--data <path>` | `__dirname/../../seo/audit-data.json` | Primary audit data |
| `--output <dir>` | Derived: `<dataDir>/multipage-report-<slug>-<date>` | Output directory |
| `--inline` | false | Inline CSS + JS into each HTML (required for `file://`) |

**Files read (directly or via `_load_research_file` pattern in normalizer):**
- `seo/audit-data.json` — primary
- `seo/research/keyword-volumes.json` (line 744)
- `seo/research/pagespeed-data.json` (line 868)
- `seo/research/crawl-data.json` (line 1110)
- `seo/research/link-graph.json` (line 1161)
- `seo/research/page-text-analysis.json` (line 1354)
- `seo/research/client-backlinks.json` (line 1575)
- `seo/research/backlinks-*.json` — globbed (line 1630)
- `seo/research/domain-metrics.json` (line 1725)
- `seo/research/organic-metrics.json` (line 1804)
- `seo/research/local-seo.json` (line 2890)
- `seo/research/local-pack-data.json` (line 2931, per finding #12)

**Per-path — each file has a `propagateApiErrors()` call** (line 714) that surfaces gather-script errors into the report. A `gather-*.json` with `status: "partial"` + `errors: [...]` flows through to on-report warning banners.

## 3. Outputs

9 HTML pages + copied resource dirs.

**Placeholder pattern (lines 3107-3121):**
```
/* __AUDIT_DATA_PLACEHOLDER__ */null
/* __SEARCH_INDEX_PLACEHOLDER__ */[]
```
Each page's template HTML includes a `<script>` block with these placeholders; the generator substitutes JSON.stringify'd data at build time. No runtime data fetch — data is baked into each HTML file.

**Search index (built by `buildSearchIndex()`, lines 195-469):** flattens every keyword, issue, competitor strategy, quick-win, action, deliverable, page-audit, backlink domain, etc. into `[{page, section, title, snippet, terms}]` — powers the in-report search bar.

## 4. Architectural survey (not line-by-line)

### 4a. Top-level pipeline
- Lines 1-55: imports + constants (`PAGE_FILES`, `COPY_DIRS`, `LOCAL_STYLESHEETS`).
- Lines 86-193: utilities (`slugify`, `deepCamelCaseKeys`, `toText`, `joinNonEmpty`, `uniqueStrings`, `pushIndexEntry`).
- Lines 195-469: `buildSearchIndex(data)` — search index for all 9 pages.
- Lines 471-570: HTML injection utilities (`inlineCss`, `inlineJs`, `copyDirectory`).
- **Lines 571-2981: `normalizeAuditData(data, dataDir)` — THE BIG ONE.**
- Lines 2982-3034: `validateAuditData(data)` — emits critical/warning messages.
- Lines 3035-3149: `main()`.
- Line 3159: `module.exports` for testing.

### 4b. `normalizeAuditData` section map (2400 lines)

Based on `propagateApiErrors` call locations and HANDOFF.md auto-fix numbering:

| Line range | Section | HANDOFF auto-fix # |
|---|---|---|
| 571-713 | Entry + utilities (normalizeDomain etc.) | — |
| 714-743 | `propagateApiErrors()` helper | — |
| 744-867 | Keyword volumes merge | — |
| 868-1109 | PageSpeed / coreWebVitals / lighthouseResults | #1, #2, #3 |
| 1110-1160 | crawl-data.json integration (pageAudits) | #4 |
| 1161-1350 | link-graph.json → internalLinking.summary + hubClusters | #5, #6 |
| 1354-1570 | page-text-analysis.json → readability enrichment | #7 |
| 1571-1720 | client-backlinks.json + competitor backlinks → topBacklinks, topReferringDomains, competitorDomainMetrics | #8, #9 |
| 1725-1800 | domain-metrics.json → domainMetrics | #10 |
| 1804-1880 | organic-metrics.json → merge into domainMetrics (organicKeywords, organicTraffic) | — |
| 1881-2300 | (further sections not yet surveyed — likely competitor comparison, content quality fallback) | #11, #12 |
| 2499 | keyword-data.json fallback read | — |
| 2717-2720 | contentQuality fallback | — |
| 2890 | local-seo.json integration | — |
| 2931-2945 | local-pack-data.json → localSeo.mapPackKeywords | — |

**HANDOFF.md lists 13 auto-fixes.** At least 12 of them are implemented in the sections above. Full 1:1 mapping is a deferred task.

### 4c. `validateAuditData` (lines 2982-3034)

Walks 9 pages, checks each page's required-fields list. Emits:
- `CRITICAL` for pages that WILL render empty.
- Warnings for pages with partial data.
- Summary: "9 pages validated — 2 may render empty."

This is the first explicit "this will break downstream" signal the system emits. Consumers of the report (clients) don't see this output — it's stderr at build time.

### 4d. `main()` (lines 3035-3149)

1. Parse args + `ensureFileExists(dataPath)`.
2. Read audit-data.json.
3. `normalizeAuditData(auditData, dataDir)` — MUTATES the in-memory data with research-file merges.
4. `validateAuditData(auditData)` — logs warnings.
5. `inferOutputDir()` — derive directory from client slug + date OR `--output` flag.
6. Load 9 HTML templates.
7. Build search index.
8. Stringify auditData + searchIndex.
9. For each template: replace placeholders, optionally inline CSS, always inline JS, write.
10. Copy `shared/`, `pages/`, `assets/` dirs.

Output dir: `fs.mkdirSync({recursive: true})` (line 3101) — creates parent automatically.

## 5. Cross-finding bug index

Bugs involving this file that prior findings have surfaced. ALL of these are "to revisit during the deep survey":

| Source finding | Issue | Line(s) |
|---|---|---|
| Finding #5 §5 bug #1 | Response-header listener overwrite → normalizer can't fix downstream `MISSING_HSTS` / `statusCode` | Reading crawl-data.json (section 4b line 1110) |
| INDEX addendum bug #21 | Agent-overwrite of crawl-data.json + link-graph.json — normalizer works on the CURATED input, propagating the undercount | 1110, 1161 |
| Finding #7 §6 | PSI stale-data detection — `pageSpeedComparison` all-identical scores fall back to this file's comparison | section around line 868-1000 |
| Finding #8 §5 | domainMetrics merges from multiple sources with implicit fallback chain | 1721-1750 |
| Finding #10 §6 | `organicTraffic` merged into domainMetrics — but the capped top-100 value propagates as if total | 1799-1881 |
| Finding #11 §6 | `keyword-volumes.json` fallback reads | 744, 2499 |
| Finding #12 §6 | `local-pack-data.json` auto-populates `localSeo.mapPackKeywords` | 2931-2945 |
| Finding #13 §6 | `local-seo.json` → `localSeo.businessProfile` — Matt's "audit-synthesis" source label origin still unknown; could be in this normalizer or in populate-audit-data | 2886 |
| Finding #14 §6 | `qualitySummary` key checked; `domainQuality` mapped onto backlinks | 2232, 2241-2254 |
| Finding #6 §6 | page-text-analysis.json enrichment of `contentQuality.pages[].readability` | 1349-1565 |
| Finding #17 §5 | Competitor-column dynamic mapping — likely same bug family lives in `competitors.js` page renderer (not this file) | — |

**These are the entry points where the normalizer can MASK or AMPLIFY upstream bugs.** Any fix to a gather script must consider whether the normalizer's fallback path would also need updating.

## 6. Template-vs-client drift — THE MAJOR FINDING

| Version | Lines | Gap vs template | Era |
|---|---|---|---|
| **Template** | **3160** | — | current |
| matt-wallmow | 2180 | **-980 lines (~30% behind)** | mid-cycle |
| laura-willis | 1797 | **-1363 lines (~43% behind)** | older |
| liane-jamason | 1797 | -1363 lines (byte-identical to laura's) | older — same era |
| calgary-castles | — | MISSING (no local copy) | uses template |
| chris-nevada | — | MISSING | uses template |
| mammoth-lakes | — | MISSING | uses template |
| murray-gardner | — | MISSING | uses template |
| p3realtync | — | MISSING | uses template |

**Why this matters:**
- HANDOFF.md:72-76 prescribes running the TEMPLATE (`../../template/reports/multipage/generate-multipage-report.js`), NOT the client copy. If the skill follows HANDOFF, drift is harmless.
- BUT: the fact that some clients have local copies AT ALL suggests a historical workflow where clients ran their own copy. Any `npm run` alias, CI script, or operator reflex pointing at the client-local copy gets a stale normalizer.
- Laura's + Liane's 1797-line copies predate the 13 HANDOFF auto-fixes. A re-run of their report via their local generator would produce a visibly worse report than a template-run.
- Matt's 2180-line copy sits in the middle — has some auto-fixes but not all. Exact gap depends on which fixes landed after his generator was snapped.

**This is major** because the normalizer is the source of 13 silent-fix auto-populations. A stale normalizer = stale fixes = wrong data in the client-facing report.

## 7. Bugs & fragility (surveyed, not exhaustive)

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **H** | — | **Client-local stale copies.** See §6. Major architectural + data-quality concern. |
| 2 | **H** | — | **No schema validator RUNS at dev-time.** `validateAuditData()` runs at generate-time and outputs to stderr; no CI hook, no exit-1 on critical. A report with critical-empty pages still generates successfully. |
| 3 | **M** | 124-146 | **`deepCamelCaseKeys` mutates in-place.** If audit-data has snake_case keys (Python-analyzer output), it renames them. Downstream renderers expect camelCase. The mutation also changes the in-memory data that subsequent writes would persist — but since audit-data.json is NOT rewritten after normalization (unlike #11, #15), this is contained. Still surprising: any caller holding a reference to the pre-normalized data sees it mutated. |
| 4 | **M** | 3087 | **`JSON.stringify(auditData)` without size check.** A very large audit (5000+ backlinks) produces a huge inline JSON in each of 9 HTML pages, 9× duplication. File sizes balloon. No chunking or external JSON file reference. |
| 5 | **M** | — | **Silent success on placeholder-not-found.** `replacePlaceholder()` (line 475) — need to read to confirm whether it errors or silently continues if the placeholder regex doesn't match. If silent, a typo in any HTML template produces a page with `/* __AUDIT_DATA_PLACEHOLDER__ */null` verbatim in the output — no runtime data. Worth confirmation in a follow-up. |
| 6 | **M** | 3152-3154 | **`if (require.main === module) { try { main(); } }`** — if tests import the module (line 3159 exports), main() doesn't run. Good. But any uncaught promise rejection in main() may not be surfaced — worth verifying the catch shape. |
| 7 | **L** | — | **No atomic writes.** 9 HTML writes can partially succeed if any one fails mid-way, leaving the report bundle inconsistent. |
| 8 | **L** | — | **Output dir timestamp in folder name** (`inferOutputDir`): `multipage-report-<slug>-YYYY-MM-DD`. Re-running on same day overwrites. Intra-day re-runs silently clobber previous output. |

## 8. Integration map

**Invoked by:**
- HANDOFF.md:72-76 prescribes the operator command.
- `/seo-audit` skill: Step 8a (inferred from position).

**Reads:** 11 files (audit-data.json + 10 research JSONs listed in §2).

**Writes:** 9 HTML pages + copied resource dirs in the inferred/explicit output folder.

**Consumers of output:** The client, directly. `file://` browse. No other script reads the generated HTML.

**Module exports (line 3159):**
- `normalizeAuditData`
- `validateAuditData`
- `deepCamelCaseKeys`
- `buildSearchIndex`

Exposed for testing but also could be consumed by another orchestrator. Check `platform/` for any Python→JS bridge that might use these (unlikely).

## 9. Fix / improve suggestions (high-level — detailed fixes during per-section deep-dives)

1. **DELETE all client-local copies** of this file. Enforce template-only execution. Update any client `package.json` aliases that point at local copies. (Fix for §6.)
2. **Promote `validateAuditData` CRITICAL → exit 1** in `main()`. CI gate: report doesn't generate if any page is guaranteed-empty. Current silent success is an antipattern.
3. **Split `normalizeAuditData` into per-concern modules.** 2400 lines is unmaintainable. One file per data source (`normalizers/pagespeed.js`, `normalizers/backlinks.js`, etc.) keyed to the HANDOFF auto-fix inventory. Unit-testable individually.
4. **Audit placeholder replacement for silent failure** (bug #5). A strict-mode flag that errors if the regex doesn't match in every template.
5. **Size-gate the inline JSON.** For large audits, externalize data to a sibling `<report-dir>/data.json` and reference via `fetch()` from the HTML — avoids 9× duplication.
6. **Per-section deep-dives (#21b-#21n)** for each of the 13 HANDOFF auto-fixes. Each one gets its own bug list and fix queue. This is the natural next step; too much to fit in one finding.

## 10. What to verify before we touch this file

- **Diff matt-wallmow's 2180-line version vs template** — identify which auto-fixes he has vs doesn't. If he's missing the stale-PageSpeed detector (HANDOFF #3), his Competitors page may still show copy-pasted client scores.
- **Diff laura/liane's 1797-line version vs template** — same exercise. They're further behind.
- **Check all client `package.json` files for aliases pointing at client-local generate-multipage-report.js.** If any exist, they're bugs waiting to activate.
- **Trace whether any pre-existing `npm run` / build script invokes the LOCAL copy.** Worth a comprehensive grep across all clients.
- **Confirm `validateAuditData` doesn't exit 1 today.** Line 3068 logs to stderr but control flow continues. No CI signal.
- **Inspect `replacePlaceholder` behavior** on miss — does it throw, warn, or silently do nothing?
- **Benchmark the large-audit case** (Liane has 200-backlink data × 5 competitors). Her `auditJson` string is probably 500KB+, embedded in each of 9 HTML pages = 4.5 MB of duplicated JSON. Worth measuring actual output sizes.

---

## Next up

Deep-dives of individual page renderers (#22-#30 in INDEX) will complement this finding. Each page renderer reveals which fields of `audit-data.json` it reads → feeds back into the normalizer's contract documentation.

After #22-#30, we should do **follow-up deep-dives #21b-#21n** for the 13 auto-fixes, using the section map in §4b as a guide.
