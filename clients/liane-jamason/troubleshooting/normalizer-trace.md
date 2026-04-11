# Normalizer Trace: generate-multipage-report.js

Full step-by-step execution trace of `normalizeAuditData()` and `buildSearchIndex()`.
All line numbers reference `/mnt/c/dev/site audit/template/reports/multipage/generate-multipage-report.js`.

---

## Order of Operations (top-level)

```
main() [L1103]
  1. Parse CLI args
  2. Read audit-data.json         [L1115]  readJsonFile() → exits hard on JSON error
  3. normalizeAuditData(data, dataDir)  [L1120]  mutates in-place
  4. inferOutputDir()             [L1122]
  5. Read all 9 HTML templates    [L1124-1133]
  6. buildSearchIndex(auditData)  [L1136]  reads already-normalized data
  7. JSON.stringify both objects  [L1137-1138]
  8. (optional) Read stylesheets  [L1144-1148]  only with --inline flag
  9. Write each HTML page         [L1154-1180]  replace two placeholders per file
 10. Copy shared/, pages/, assets/ dirs  [L1182-1190]
```

`dataDir` is always the **directory containing audit-data.json** — i.e. the client's `seo/` folder.
All sibling file lookups use `path.join(dataDir, 'research', '<filename>')`.

---

## normalizeAuditData() — Step-by-Step

Called at L1120 before anything is serialized. Applies fixes in-place on `data`.
A counter `fixes` is incremented for each fix applied; the total is logged at L1099.

### Step 1 — Core Web Vitals hoist [L528-544]

**What it does:**
- If `data.coreWebVitals` is falsy AND `data.technicalSeo.coreWebVitals` exists → copies it up to `data.coreWebVitals`.
- Then, for both `mobile` and `desktop` sub-objects: if `.performanceScore` exists but `.score` does not → aliases `.score = .performanceScore`.

**Sibling files:** None.

**If field is missing:** Leaves `data.coreWebVitals` undefined — renderer will get nothing.

---

### Step 2 — Lighthouse Results normalization [L547-626]

**What it does (two passes):**

**Pass A — dict-to-array conversion [L553-590]:**
If `tech.lighthouseResults` is a plain object (not an array) with a `clientPages` array:
- Expands each page × each strategy (`mobile`, `desktop`) into a flat array of objects.
- Each output object shape:
  ```
  { url, strategy, performanceScore, lcp, cls, fcp, inp, ttfb, speedIndex, opportunities[], diagnostics[] }
  ```
- Opportunities are filtered to only those with `savings > 0` and renamed `savings_ms` → `savings`.
- Both nested (`page.mobile.lcp`) and flat (`page.mobileLcp`) source shapes are handled.
- `speed_index` → `speedIndex` (snake_case normalized).

**Pass B — read from pagespeed-data.json [L593-626]:**
Runs if `tech.lighthouseResults` is still missing or empty after Pass A.

| Property | Value |
|----------|-------|
| File | `research/pagespeed-data.json` |
| If missing | Silently skipped (no error, no log) |
| Data path | `psi.data.client[]` — array of per-page objects |
| Per-page shape | each has `.mobile` and `.desktop` sub-objects |
| Output | Same flat array shape as Pass A |

Fields read from each strategy sub-object:
- `performance_score` or `performanceScore` → `performanceScore`
- `lcp`, `cls`, `fcp`, `inp`, `ttfb`
- `speed_index` or `speedIndex` → `speedIndex`
- `opportunities[]` — filtered to `savings > 0`, renamed

Log message when populated: `Auto-populated lighthouseResults: N entries from pagespeed-data.json`

**Sibling files:** `research/pagespeed-data.json`

---

### Step 3 — PageSpeed Comparison table [L628-676]

**What it does:**
Populates `data.pageSpeedComparison` (top-level). The renderer expects an array of `{ name, score }`.

**Source priority:**
1. If `data.pageSpeedComparison` already exists → skip entirely.
2. Check `data.competitorAnalysis.pageSpeedComparison` (array).
3. Check `data.technicalSeo.pageSpeedComparison` (array).
4. Stale-data detection [L642-648]: if both exist and every entry in the `technicalSeo` version has the same `mobileScore`/`desktopScore` as the client entry → the `technicalSeo` version is considered copy-pasted. Logs a warning and uses `competitorAnalysis` version instead.
5. If neither exists → field stays unset.

**Format normalization [L660-676]:**
If the chosen array has objects with a `domain` key but no `name` key → reshapes each:
- Averages `mobileScore` and `desktopScore` → `score`
- If score is `<= 1` → multiplies by 100 (decimal → percentage)
- `name = domain + ' (Client)'` if `isClient` flag is set

**Sibling files:** None.

---

### Step 4 — Page Audits from crawl-data.json [L678-712]

**What it does:**
Populates `data.technicalSeo.pageAudits` if it is missing or empty.

| Property | Value |
|----------|-------|
| File | `research/crawl-data.json` |
| If missing | Silently skipped |
| If parse error | Silently skipped |

**Data path in file:** `crawl.pages[]` (falls back to `crawl[]` if top-level is already an array).

**Field mapping per page:**

| Output field | Source (tries in order) |
|---|---|
| `url` | `p.url` |
| `title` | `p.title` |
| `metaDescription` | `p.description` then `p.metaDescription` |
| `canonicalUrl` | `p.canonical` then `p.canonicalUrl` |
| `wordCount` | `p.wordCount` |
| `h1Tags` | `p.h1[]` then `p.h1Tags[]` |
| `h2Tags` | `p.h2[]` then `p.h2Tags[]` |
| `internalLinks` | `p.totalInternalLinks` then `p.internalLinks` |
| `externalLinks` | `p.externalLinks` |
| `hasSchema` | `!!p.hasSchema` |
| `schemaTypes` | `p.schemaTypes[]` |
| `issues` | `p.issues[]` |
| `statusCode` | `p.statusCode` (defaults to 200) |

Log: `Auto-populated pageAudits: N pages from crawl-data.json`

**For Liane Jamason:** `research/crawl-data.json` EXISTS in the client's research directory. This step will fire.

---

### Step 5a — Internal Linking overview stats from link-graph.json [L714-824]

**What it does:**
Reads `research/link-graph.json` once (used by both 5a and 5b).

| Property | Value |
|----------|-------|
| File | `research/link-graph.json` |
| If missing | Entire step 5 silently skipped |
| Data path | `lg.edges` — object of `{ sourceUrl: [targetUrl, ...] }` |

If `data.internalLinking.total_pages` (or `totalPages`) is 0 or missing, recomputes from the edge map:

**Stats written to `data.internalLinking`:**
- `total_pages` — count of source URLs in edges object
- `total_internal_links` — sum of all edge counts
- `avg_inbound_links` — rounded to 1 decimal
- `avg_outbound_links` — rounded to 1 decimal
- `orphan_count` — pages with 0 inbound links, excluding homepage (empty pathname)
- `orphan_rate` — percentage, rounded to 1 decimal
- `orphans[]` — array of `{ url, outbound_links, is_in_sitemap: true, recommendation }`
- `issues[]` — tags: `'HAS_ORPHANS'`, `'WEAK_INTERNAL_LINKING'`, `'NO_HUB_STRUCTURE'`
- `recommendations[]` — human-readable strings

**Condition to run:** Only if `total_pages` is currently 0 or missing. Does not overwrite existing populated stats.

**For Liane Jamason:** `research/link-graph.json` EXISTS. Whether step 5a fires depends on whether `audit-data.json` has `internalLinking.total_pages > 0`.

Log: `Auto-populated link overview: N pages, N links, N orphans`

---

### Step 5b — Hub clusters from link-graph.json [L826-849]

Uses the same parsed `linkEdges` from step 5a.

Runs if `linking.hubClusters` (or `linking.hub_clusters`) is empty.

**Algorithm:**
- For each source URL, find its outbound targets that are also source pages (i.e. on-site) and not self-links.
- Keep only pages with `>= 3` spokes.
- Sort descending by spoke count, take top 12.
- Each hub object: `{ hubUrl, hubInbound, hubOutbound, spokes[], spokeCount }`

Writes to `data.internalLinking.hubClusters`.

Log: `Auto-populated hubClusters: N hubs from link-graph.json`

---

### Step 5c — Readability enrichment from page-text-analysis.json [L852-886]

| Property | Value |
|----------|-------|
| File | `research/page-text-analysis.json` |
| If missing | Silently skipped |
| If parse error | Silently skipped |

**Data path:** `ptaRaw` can be an array directly OR `ptaRaw.pages[]`.

**What it enriches:**
For each entry in `data.contentQuality.pages[]`, looks up the matching URL in the PTA file and fills in missing sub-fields:
- `page.readability.syllablesPerWord` ← `pta.avgSyllablesPerWord` (only if currently null)
- `page.readability.avgSentenceLength` ← `pta.avgSentenceLength` (only if currently null)
- `page.readability.sentenceCount` ← `pta.sentenceCount` (only if currently null)

**For Liane Jamason:** `research/page-text-analysis.json` does NOT exist. Step silently skipped.

Log: `Enriched readability data: N pages with syllables/word from page-text-analysis.json`

---

### Step 5d — Backlinks from client-backlinks.json [L888-930]

| Property | Value |
|----------|-------|
| File | `research/client-backlinks.json` |
| If missing | Silently skipped (file check at L892) |
| If parse error | Silently skipped |

**Data paths tried:**
- `cb.backlinks[]` or `cb.data.backlinks[]` → `topBacklinks`
- `cb.referring_domains[]` or `cb.data.referring_domains[]` → `topReferringDomains`

**topBacklinks** — only overwrites if `rawLinks.length > currentBacklinks.length` (takes the larger set):

| Output field | Source (tries in order) |
|---|---|
| `sourceUrl` | `l.source_url`, `l.sourceUrl` |
| `targetUrl` | `l.target_url`, `l.targetUrl` |
| `anchorText` | `l.anchor_text`, `l.anchorText` |
| `domainRating` | `l.domain_rating`, `l.domainRating` |
| `isDofollow` | `l.is_dofollow`, `l.isDofollow` |
| `firstSeen` | `l.first_seen`, `l.firstSeen` |

**topReferringDomains** — only written if not already set:

| Output field | Source |
|---|---|
| `domain` | `d.domain` |
| `rank` | `d.rank` |
| `backlinks` | `d.backlinks` |
| `firstSeen` | `d.first_seen`, `d.firstSeen` |
| `dofollow` | `d.dofollow` |
| `referringPages` | `d.referring_pages` |

**For Liane Jamason:** `research/client-backlinks.json` does NOT exist. Step silently skipped.

---

### Step 6 — Domain Metrics comparison [L932-991]

**What it does:**
Populates `data.domainMetrics = { client: {...}, competitors: [...] }` if missing or empty.

**Source priority:**
1. `data.backlinks.competitorDomainMetrics[]` (most common)
2. `data.competitorAnalysis.domainMetricsComparison[]`
3. `research/domain-metrics.json` — reads `dmFile.data[]` or `dmFile[]`

| Property | Value |
|----------|-------|
| Fallback file | `research/domain-metrics.json` |
| If missing | Silently skipped |

**Client identification:** Finds entry where `isClient === true`. Falls back to matching `e.domain` against `data.client.website`. Falls back to `sourceEntries[0]`.

**normalizeDMEntry() field mapping:**

| Output field | Source (tries in order) |
|---|---|
| `domain` | `e.domain` |
| `domainRating` | `e.domainRating`, `e.domain_rating`, `e.dr` |
| `organicTraffic` | `e.organicTraffic`, `e.organic_traffic` |
| `organicKeywords` | `e.organicKeywords`, `e.organic_keywords` |
| `referringDomains` | `e.referringDomains`, `e.referring_domains` |
| `backlinks` | `e.backlinks`, `e.totalBacklinks`, `e.total_backlinks` |
| `trafficValue` | `e.trafficValue`, `e.traffic_value` |

Log: `Auto-populated domainMetrics: 1 client + N competitors`

---

### Step 6b — Backlink Opportunities construction [L993-1054]

**What it does:**
Ensures `data.backlinkOpportunities` has four sub-keys: `client`, `competitors`, `opportunities`, `clientBacklinks`, `similarityPairs`.

**bo.client** [L996-1006] — built if missing:
- `domain` ← `data.backlinks.domainMetrics.domain` or `data.client.website`
- `backlinks` ← `data.backlinks.domainMetrics.totalBacklinks` or 0
- `referringDomains` ← `data.backlinks.domainMetrics.referringDomains` or 0
- `domainRating` ← `data.backlinks.domainMetrics.domainRating` or 0
- `dofollowRatio` ← `data.backlinks.dofollowRatio` or 0

**bo.competitors** [L1009-1020] — built if missing or empty:
- Source: `data.backlinks.competitorDomainMetrics[]` filtered to `!c.isClient`
- Each: `{ domain, backlinks, referringDomains, domainRating, dofollowRatio }`

**bo.opportunities** [L1022-1038] — built if missing:

| Property | Value |
|----------|-------|
| File | `research/backlink-opportunities.json` |
| If missing | Sets `bo.opportunities = []` (no error, no log) |
| If parse error | Logs warning, sets `bo.opportunities = []` |

**Data paths tried:**
- `boRaw.opportunities[]`
- `boRaw[]` (if top-level is already an array)

Also reads `boRaw.similarityPairs` if present.

Log when loaded: `Loaded backlink opportunities: N opportunities from backlink-opportunities.json`

**For Liane Jamason:** `research/backlink-opportunities.json` does NOT exist. `bo.opportunities` will be `[]`.

**bo.clientBacklinks** [L1041-1043] — built if missing:
- Reuses `data.backlinks.topBacklinks` (already normalized in step 5d)

**bo.similarityPairs** [L1046-1048] — defaults to `[]` if not set by file read above.

---

### Step 7 — Competitor Comparison column normalization [L1056-1096]

**What it does:**
The renderer expects `competitorComparison[]` rows with keys `{ metric, client, comp1, comp2, ... }`.
Data pipelines sometimes use actual domain names as column keys.

If no `compN` keys are found in the first row:
- Identifies non-reserved keys (everything except `metric`, `client`, `gap`)
- Renames them to `comp1`, `comp2`, etc.
- Builds `data.competitor.all[]` with `{ domain, name }` entries (using the original domain keys) if `comp.all` is missing or empty

Log: `Normalized competitorComparison: N competitor columns mapped to comp1..compN`

---

## Sibling Files Summary

| File | Step | If Missing |
|------|------|-----------|
| `research/pagespeed-data.json` | 2B | Silently skipped |
| `research/crawl-data.json` | 4 | Silently skipped |
| `research/link-graph.json` | 5a, 5b | Entire link-stats block skipped |
| `research/page-text-analysis.json` | 5c | Silently skipped |
| `research/client-backlinks.json` | 5d | Silently skipped |
| `research/domain-metrics.json` | 6 | Silently skipped (last fallback) |
| `research/backlink-opportunities.json` | 6b | `bo.opportunities = []`, no error |

No sibling file read causes a hard exit. All failures are silent catches or existence checks.

---

## Liane Jamason: Which Files Exist vs. Missing

| File | Exists |
|------|--------|
| `research/pagespeed-data.json` | NO |
| `research/crawl-data.json` | YES |
| `research/link-graph.json` | YES |
| `research/page-text-analysis.json` | NO |
| `research/client-backlinks.json` | NO |
| `research/domain-metrics.json` | NO |
| `research/backlink-opportunities.json` | NO |

Steps that will auto-fire: 4 (pageAudits from crawl-data.json), 5a/5b (link stats + hub clusters from link-graph.json).

---

## buildSearchIndex() — What Contributes Search Terms

Called at L1136 after normalization. Iterates the already-normalized `auditData` object.

| Data field | Page | Section anchor |
|---|---|---|
| `data.keywords[]` | `keywords.html` | `section-rankings` |
| `data.topIssues[]` | `index.html` | `section-issues` |
| `data.competitorStrategies[]` | `competitors.html` | `section-strategies` |
| `data.quickWins[]` | `index.html` | `section-quickwins` |
| `data.actionPlan.quickWins[]`, `.shortTerm[]`, `.mediumTerm[]`, `.longTerm[]`, + any other keys | `action-plan.html` | `section-plan` |
| `data.contentCalendar.month1[]`, `.month2[]`, etc. (keys matching `/^month\d+$/`) | `action-plan.html` | `section-calendar` |
| `data.contentQuality.pages[]` | `content.html` | `section-readability` |
| `data.internalLinking.orphans[]` | `links.html` | `section-orphans` |
| `data.backlinkOpportunities.opportunities[]` | `backlink-opportunities.html` | `section-opportunities` |
| `data.backlinkOpportunities.competitors[]` | `backlink-opportunities.html` | `section-competitor-comparison` |

**Entry rejection rules** (L152-154): An entry is dropped if it has no `page`, no `section`, or both `title` and `snippet` are empty.

**Deduplication** (L129-145): `uniqueStrings()` lowercases and deduplicates the `terms[]` array per entry.

---

## Injection Placeholders in HTML Templates

Two replacements per template file (L1157-1171):

| Placeholder in HTML | Replaced with |
|---|---|
| `/* __AUDIT_DATA_PLACEHOLDER__ */null` | Full `JSON.stringify(auditData)` |
| `/* __SEARCH_INDEX_PLACEHOLDER__ */[]` | Full `JSON.stringify(searchIndex)` |

If either placeholder is not found in a template file, `exitWithError()` is called — **hard exit**. This means every HTML template must contain both placeholders exactly as written, or generation aborts.

---

## Field Renames (complete list)

| Source key(s) | Normalized to | Step |
|---|---|---|
| `technicalSeo.coreWebVitals` | `data.coreWebVitals` (hoisted) | 1 |
| `coreWebVitals[device].performanceScore` | `.score` | 1 |
| `lighthouseResults` (dict) | `lighthouseResults` (array) | 2 |
| `performance_score` | `performanceScore` | 2 |
| `speed_index` | `speedIndex` | 2 |
| `savings_ms` | `savings` | 2 |
| `mobileScore`/`desktopScore` → averaged | `score` | 3 |
| `domain` + `isClient` | `name` | 3 |
| `p.description` | `metaDescription` | 4 |
| `p.canonical` | `canonicalUrl` | 4 |
| `p.h1[]` | `h1Tags[]` | 4 |
| `p.totalInternalLinks` | `internalLinks` | 4 |
| `linking.hub_clusters` | `linking.hubClusters` | 5b |
| `l.source_url` | `sourceUrl` | 5d |
| `l.target_url` | `targetUrl` | 5d |
| `l.anchor_text` | `anchorText` | 5d |
| `l.domain_rating` | `domainRating` | 5d |
| `l.is_dofollow` | `isDofollow` | 5d |
| `l.first_seen` | `firstSeen` | 5d/6 |
| `e.domain_rating` / `e.dr` | `domainRating` | 6 |
| `e.organic_traffic` | `organicTraffic` | 6 |
| `e.organic_keywords` | `organicKeywords` | 6 |
| `e.referring_domains` | `referringDomains` | 6 |
| `e.total_backlinks` / `e.totalBacklinks` | `backlinks` | 6 |
| `e.traffic_value` | `trafficValue` | 6 |
| domain-keyed comp columns | `comp1`, `comp2`, ... | 7 |
