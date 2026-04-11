# Fix SEO Audit Pipeline — Definitive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SEO audit pipeline reliably populate every section of the 9-page multipage HTML report for any new client, with zero silent failures.

**Architecture:** The pipeline has 4 stages: (1) data-gathering scripts produce JSON research files, (2) the /seo-audit skill orchestrates agents that run those scripts, (3) Claude populates audit-data.json from research files, (4) generate-multipage-report.js normalizes and injects data into HTML. Stages 1-3 are broken. This plan fixes all 4 stages across 4 phases: bug fixes, new scripts, template/skill updates, and verification.

**Tech Stack:** Node.js (scripts), Playwright (crawling), DataForSEO API, Google PSI API (public), Leaflet (maps), Chart.js, Tailwind CSS.

**Research files informing this plan (4,367 lines total):**
- `clients/liane-jamason/troubleshooting/normalizer-trace.md` — step-by-step generator data flow
- `clients/liane-jamason/troubleshooting/calgary-golden-schema.md` — complete 29-key reference schema
- `clients/liane-jamason/troubleshooting/renderer-field-manifest.md` — exhaustive field access for all 9 renderers
- `clients/liane-jamason/troubleshooting/risk-analysis.md` — Chart.js crashes, silent failures, API risks
- `clients/liane-jamason/troubleshooting/data-contract-map.md` — what each page needs + generator auto-populations
- `clients/liane-jamason/troubleshooting/calgary-vs-liane-diff.md` — 10 missing sections, 4 missing JSON files
- `clients/liane-jamason/troubleshooting/skill-vs-template-gap.md` — 9 contract gaps between skill/template/generator

**Ultraplan agent findings (post-plan validation):**
- `gather-pagespeed.js` output shape MISMATCH: normalizer reads `psi.data.client[]`, not `clientPages[]` — script output corrected below
- DFS env vars are `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD`, not `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` — corrected in Tasks 8-9
- `extract-text.js` missing `avgSentenceLength` field the normalizer reads — corrected below
- `action-plan.js` null container crashes (lines 244, 408) — added as Task 2b
- `data-loader.js` missing try/catch on renderer init (line 59) — added as Task 2c
- `backlink-opportunities.js` shows all-zero data as real when data missing — added to Task 2 empty-state guards
- **Known out-of-scope issues (DFS connector field semantics):** `dataforseo.py:513` maps DFS `rank` as `domainRating` (different metric) and `estimated_paid_traffic` as `organic_traffic` (wrong field). These are pre-existing data quality issues in the connector that affect all clients equally. Flagged for separate fix.

---

## Phase 0: Critical Bug Fixes

These bugs must be fixed before any data work — the pipeline will produce wrong output even with correct data if these aren't fixed first.

---

### Task 1: Fix `linkOpportunities` → `backlinkOpportunities` key mismatch

**Files:**
- Modify: `platform/scripts/run_backlink_analysis.py:74`
- Modify: `platform/scripts/run_backlink_analysis.py:91-92`
- Modify: `platform/scripts/build_audit.py:68`
- Modify: `platform/scripts/build_audit.py:236`

The `run_backlink_analysis.py` script writes results to `existing["linkOpportunities"]`. The generator and the backlink-opportunities renderer both read `data.backlinkOpportunities`. The key mismatch means the opportunities section is always empty even after the script runs successfully.

- [ ] **Step 1: Fix key name in `run_backlink_analysis.py`**

In `platform/scripts/run_backlink_analysis.py`, change all three occurrences of `linkOpportunities` to `backlinkOpportunities`:

Line 74:
```python
# OLD:
result["linkOpportunities"] = opportunities
# NEW:
result["backlinkOpportunities"] = opportunities
```

Line 91-92:
```python
# OLD:
if "linkOpportunities" in result:
    existing["linkOpportunities"] = result["linkOpportunities"]
# NEW:
if "backlinkOpportunities" in result:
    existing["backlinkOpportunities"] = result["backlinkOpportunities"]
```

- [ ] **Step 2: Fix key name in `build_audit.py`**

In `platform/scripts/build_audit.py`:

Line 68 — change the `outputs` list:
```python
# OLD:
AuditStep("backlinks", "Backlink Analysis (P4)", "_run_backlinks", ["backlinks", "domainMetrics", "linkOpportunities"], requires_api=True, audit_type="seo"),
# NEW:
AuditStep("backlinks", "Backlink Analysis (P4)", "_run_backlinks", ["backlinks", "domainMetrics", "backlinkOpportunities"], requires_api=True, audit_type="seo"),
```

Line 236:
```python
# OLD:
result["linkOpportunities"] = opportunities
# NEW:
result["backlinkOpportunities"] = opportunities
```

- [ ] **Step 3: Commit**

```bash
git add platform/scripts/run_backlink_analysis.py platform/scripts/build_audit.py
git commit -m "fix: rename linkOpportunities → backlinkOpportunities to match generator/renderer key"
```

---

### Task 2: Fix divide-by-zero and empty-state guards in `backlink-opportunities.js`

**Files:**
- Modify: `template/reports/multipage/pages/backlink-opportunities.js:314-325`
- Modify: `template/reports/multipage/pages/backlink-opportunities.js:537-542`

When `COMPETITORS` is empty (which it will be until backlink data exists), `COMPETITORS.reduce(...) / COMPETITORS.length` produces `NaN` (0/0). This causes every stat card on the backlink-opportunities page to display "NaN".

- [ ] **Step 1: Add empty-state guard to `renderInsights()`**

In `template/reports/multipage/pages/backlink-opportunities.js`, add a guard at the top of `renderInsights()` (after line 316):

```javascript
  function renderInsights() {
    var el = document.getElementById('insights-content');
    if (!el) return;

    // Guard: no competitors means no meaningful comparison
    if (!COMPETITORS.length) {
      el.innerHTML = '<div class="empty-state"><p>Backlink competitor data not yet available. Run the data-gathering scripts to populate this section.</p></div>';
      return;
    }

    var avgCompetitorRD = Math.round(COMPETITORS.reduce(function(s, c) { return s + c.referringDomains; }, 0) / COMPETITORS.length);
```

- [ ] **Step 2: Add empty-state guard to `renderSummary()`**

Same pattern at the top of `renderSummary()` (after line 539):

```javascript
  function renderSummary() {
    var el = document.getElementById('summary-content');
    if (!el) return;

    // Guard: no competitors means no meaningful comparison
    if (!COMPETITORS.length) {
      el.innerHTML = '<div class="empty-state"><p>Competitor backlink data not yet available.</p></div>';
      return;
    }

    var avgCompetitorRD = Math.round(COMPETITORS.reduce(function(s, c) { return s + c.referringDomains; }, 0) / COMPETITORS.length);
```

- [ ] **Step 3: Add page-level empty state when no backlink data at all**

When `backlinkOpportunities` is entirely missing, the page shows all-zero data as if it's real (no empty state). Add a top-level guard in the page's main render flow. Find where the page sections are rendered (the main IIFE or init equivalent) and add:

```javascript
// At the top of the rendering flow, after _hasData is computed (line 122):
if (!_hasData) {
  // Show a single page-wide empty state instead of rendering zeros everywhere
  var main = document.querySelector('.content-area') || document.querySelector('main');
  if (main) {
    main.innerHTML = '<div class="empty-state" style="padding:3rem;text-align:center">' +
      '<h2>Backlink Opportunity Analysis</h2>' +
      '<p>No backlink data available yet. Run the data-gathering scripts to populate this page.</p></div>';
  }
  return;
}
```

- [ ] **Step 4: Commit**

```bash
git add template/reports/multipage/pages/backlink-opportunities.js
git commit -m "fix: guard divide-by-zero and add empty-state in backlink-opportunities"
```

---

### Task 2b: Add null-container guards to `action-plan.js`

**Files:**
- Modify: `template/reports/multipage/pages/action-plan.js:244`
- Modify: `template/reports/multipage/pages/action-plan.js:408`

If `calendar-container` or `deliverables-container` DOM elements are missing from the HTML, `null.innerHTML` throws a TypeError that crashes the entire page `init()` — all subsequent sections silently don't render.

- [ ] **Step 1: Add null guard to `renderContentCalendar`**

In `template/reports/multipage/pages/action-plan.js`, find the line where `container` is used for `calendar-container` (around line 244):

```javascript
// Before the innerHTML assignment, add:
if (!container) return;
```

- [ ] **Step 2: Add null guard to `renderDeliverables`**

Same pattern around line 408:

```javascript
if (!container) return;
```

- [ ] **Step 3: Commit**

```bash
git add template/reports/multipage/pages/action-plan.js
git commit -m "fix: guard null containers in action-plan.js to prevent init crash"
```

---

### Task 2c: Add try/catch to data-loader renderer init calls

**Files:**
- Modify: `template/reports/multipage/shared/data-loader.js:59`

Any runtime error in a renderer's `init()` crashes the entire boot sequence with no visible error. Wrap the init call in a try/catch so one page's failure doesn't take down the rest.

- [ ] **Step 1: Wrap renderer init in try/catch**

In `template/reports/multipage/shared/data-loader.js`, find where `init(data)` is called on page renderers (around line 59):

```javascript
// OLD:
window.TPPC.pages[pageName].init(window.TPPC.data);
// NEW:
try {
  window.TPPC.pages[pageName].init(window.TPPC.data);
} catch (err) {
  console.error('[TPPC] Renderer init failed for page "' + pageName + '":', err);
}
```

- [ ] **Step 2: Commit**

```bash
git add template/reports/multipage/shared/data-loader.js
git commit -m "fix: wrap renderer init in try/catch to prevent crash propagation"
```

---

### Task 3: Add rate limiting to DataForSEO `_post()` sync path

**Files:**
- Modify: `platform/src/audit_platform/connectors/dataforseo.py:80-93`

The `_post()` method calls `self.sync_client.post(...)` directly without calling `self._rate_limit_sync()` first. The base class already has `_rate_limit_sync()` at `base.py:68`. Rapid consecutive calls (e.g., fetching metrics for 5+ competitors) can trigger 429 errors.

- [ ] **Step 1: Add rate limit call to `_post()`**

In `platform/src/audit_platform/connectors/dataforseo.py`, add one line at the start of `_post()`:

```python
    def _post(
        self,
        path: str,
        payload: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """POST *payload* to ``{_BASE_URL}{path}`` and return raw JSON.

        Raises ``httpx.HTTPStatusError`` on HTTP-level failures.
        """
        self._rate_limit_sync()
        url = f"{_BASE_URL}{path}"
        self.log.debug("dataforseo_request", url=url, tasks=len(payload))
        resp = self.sync_client.post(url, json=payload, auth=self._auth)
        resp.raise_for_status()
        return resp.json()
```

- [ ] **Step 2: Commit**

```bash
git add platform/src/audit_platform/connectors/dataforseo.py
git commit -m "fix: add rate limiting to DataForSEO _post() sync path"
```

---

### Task 4: Add logging to normalizer's silent try/catch blocks

**Files:**
- Modify: `template/reports/multipage/generate-multipage-report.js:624,710,733,885,929,958`

Six auto-population blocks catch errors with `catch (_) { /* ignore */ }`. If any research JSON is malformed, the normalizer silently skips that entire section with no indication. Replace each with a `logWarning()` call.

- [ ] **Step 1: Replace all 6 silent catches with `logWarning()` calls**

In `template/reports/multipage/generate-multipage-report.js`, find and replace each of these 6 lines:

Line 624 (pagespeed-data.json):
```javascript
// OLD:
    } catch (_) { /* ignore parse errors */ }
// NEW:
    } catch (err) { logWarning('Failed to parse pagespeed-data.json', err.message); }
```

Line 710 (crawl-data.json):
```javascript
// OLD:
    } catch (_) { /* ignore parse errors */ }
// NEW:
    } catch (err) { logWarning('Failed to parse crawl-data.json', err.message); }
```

Line 733 (link-graph.json):
```javascript
// OLD:
  } catch (_) { /* ignore parse errors */ }
// NEW:
  } catch (err) { logWarning('Failed to parse link-graph.json', err.message); }
```

Line 885 (page-text-analysis.json):
```javascript
// OLD:
  } catch (_) { /* ignore */ }
// NEW:
  } catch (err) { logWarning('Failed to parse page-text-analysis.json', err.message); }
```

Line 929 (client-backlinks.json):
```javascript
// OLD:
  } catch (_) { /* ignore */ }
// NEW:
  } catch (err) { logWarning('Failed to parse client-backlinks.json', err.message); }
```

Line 958 (domain-metrics.json):
```javascript
// OLD:
      } catch (_) { /* ignore */ }
// NEW:
      } catch (err) { logWarning('Failed to parse domain-metrics.json', err.message); }
```

- [ ] **Step 2: Commit**

```bash
git add template/reports/multipage/generate-multipage-report.js
git commit -m "fix: replace 6 silent try/catch blocks with logWarning in normalizer"
```

---

### Task 5: Remove Calgary-specific strings from template

**Files:**
- Modify: `template/reports/multipage/shared/explainer.js:164`
- Modify: `template/reports/multipage/shared/explainer.js:202`
- Delete: `template/reports/multipage/seo-best-practices-2026-calgary-castles.md`

Two explainer tooltips reference Calgary by name. Every generated report ships with these Calgary-specific phrases, which is unprofessional for non-Calgary clients. Also remove a Calgary-specific markdown file from the template directory.

- [ ] **Step 1: Fix Hub & Spoke explanation (line 164)**

In `template/reports/multipage/shared/explainer.js` line 164:

```javascript
// OLD:
explanation: 'A hub page is a main topic page (like "Calgary Communities") that links out to detailed sub-pages (like individual neighborhood pages). This structure tells Google you\'re an authority on the topic and helps all related pages rank better.',
// NEW:
explanation: 'A hub page is a main topic page (like "Communities" or "Neighborhoods") that links out to detailed sub-pages (like individual area pages). This structure tells Google you\'re an authority on the topic and helps all related pages rank better.',
```

- [ ] **Step 2: Fix Local Search Performance explanation (line 202)**

```javascript
// OLD:
explanation: 'This shows how well you\'re performing in location-based searches — when someone in Calgary searches "real estate agent near me" or "homes for sale in [neighborhood]." Local performance depends on your GBP, reviews, and local content.',
// NEW:
explanation: 'This shows how well you\'re performing in location-based searches — when someone searches "real estate agent near me" or "homes for sale in [neighborhood]." Local performance depends on your GBP, reviews, and local content.',
```

- [ ] **Step 3: Remove Calgary-specific markdown from template**

```bash
rm "template/reports/multipage/seo-best-practices-2026-calgary-castles.md"
```

- [ ] **Step 4: Commit**

```bash
git add template/reports/multipage/shared/explainer.js
git add -u template/reports/multipage/seo-best-practices-2026-calgary-castles.md
git commit -m "fix: remove Calgary-specific strings from template explainer and stale markdown"
```

---

### Task 6: Create Phase 0 save point

- [ ] **Step 1: Commit all Phase 0 work as a save point**

Verify everything from Tasks 1-5 is committed:

```bash
git status
git log --oneline -6
```

Record the commit hash — this is the "Phase 0 complete" rollback point.

---

## Phase 1: Create 4 Missing Data-Gathering Scripts

These 4 scripts produce the JSON files the normalizer needs. They can be developed in parallel (Tasks 7-10 are independent). Each script lives in `template/scripts/` and is copied to each client's `scripts/` directory during audit setup.

---

### Task 7: Create `scripts/gather-pagespeed.js`

**Files:**
- Create: `template/scripts/gather-pagespeed.js`

This script calls the public Google PSI API for the client domain + all competitor domains, producing `pagespeed-data.json`. The normalizer reads this at Step 2B (line 593-626) to populate `technicalSeo.lighthouseResults` and the CWV gauges.

- [ ] **Step 1: Write the script**

Create `template/scripts/gather-pagespeed.js`:

```javascript
#!/usr/bin/env node
'use strict';

/**
 * gather-pagespeed.js — Calls Google PageSpeed Insights API (public, no auth)
 * for client + competitor URLs. Produces research/pagespeed-data.json.
 *
 * Usage:
 *   node scripts/gather-pagespeed.js <client-url> [competitor-url ...]
 *   node scripts/gather-pagespeed.js --urls urls.txt
 *
 * Output shape (what the normalizer expects at generate-multipage-report.js:593-626):
 * {
 *   clientPages: [{ url, mobile: { performanceScore, lcp, fcp, cls, inp, ttfb, speedIndex }, desktop: {...} }],
 *   competitorPages: [{ url, domain, mobile: {...}, desktop: {...} }],
 *   pageSpeedComparison: [{ domain, mobileScore, desktopScore, isClient }],
 *   coreWebVitals: { mobile: { performanceScore, lcp, cls, fcp, inp, ttfb, speedIndex }, desktop: {...} },
 *   gatheredAt: ISO timestamp
 * }
 *
 * Rate limit: Google PSI allows ~25 requests per 100 seconds (public, no key).
 * We make 2 calls per URL (mobile + desktop). For 5 URLs = 10 calls — well within limit.
 * Add 3-second delay between URLs as a safety margin.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PSI_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractMetrics(psiResponse) {
  const lhr = psiResponse.lighthouseResult;
  if (!lhr) return null;
  const perf = lhr.categories && lhr.categories.performance;
  const audits = lhr.audits || {};

  return {
    performanceScore: perf ? perf.score : null,
    lcp: audits['largest-contentful-paint'] ? audits['largest-contentful-paint'].numericValue : null,
    fcp: audits['first-contentful-paint'] ? audits['first-contentful-paint'].numericValue : null,
    cls: audits['cumulative-layout-shift'] ? audits['cumulative-layout-shift'].numericValue : null,
    inp: audits['interaction-to-next-paint'] ? audits['interaction-to-next-paint'].numericValue : null,
    ttfb: audits['server-response-time'] ? audits['server-response-time'].numericValue : null,
    speedIndex: audits['speed-index'] ? audits['speed-index'].numericValue : null,
    opportunities: Object.values(audits)
      .filter(a => a.details && a.details.type === 'opportunity' && a.details.overallSavingsMs > 0)
      .map(a => ({ title: a.title, id: a.id, savings: Math.round(a.details.overallSavingsMs) })),
  };
}

function domainFromUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

async function fetchPSI(url, strategy) {
  const apiUrl = `${PSI_BASE}?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance`;
  console.error(`  Fetching PSI: ${url} [${strategy}]...`);
  try {
    return await fetchJSON(apiUrl);
  } catch (err) {
    console.error(`  WARNING: PSI failed for ${url} [${strategy}]: ${err.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (args.length === 0) {
    console.error('Usage: node gather-pagespeed.js <client-url> [competitor-url ...]');
    process.exit(1);
  }

  const clientUrl = args[0];
  const competitorUrls = args.slice(1);
  const allUrls = [clientUrl, ...competitorUrls];

  // Determine output path
  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'pagespeed-data.json');

  const clientPages = [];
  const competitorPages = [];
  const comparison = [];

  for (let i = 0; i < allUrls.length; i++) {
    const url = allUrls[i];
    const isClient = (i === 0);
    const domain = domainFromUrl(url);

    if (i > 0) await sleep(3000); // Rate-limit safety margin

    const mobileResp = await fetchPSI(url, 'mobile');
    await sleep(1500);
    const desktopResp = await fetchPSI(url, 'desktop');

    const mobile = mobileResp ? extractMetrics(mobileResp) : null;
    const desktop = desktopResp ? extractMetrics(desktopResp) : null;

    const entry = { url, domain, mobile, desktop };

    if (isClient) {
      clientPages.push(entry);
    } else {
      competitorPages.push(entry);
    }

    comparison.push({
      domain,
      mobileScore: mobile ? mobile.performanceScore : null,
      desktopScore: desktop ? desktop.performanceScore : null,
      isClient,
    });

    console.error(`  Done: ${domain} — mobile: ${mobile ? mobile.performanceScore : 'FAILED'}, desktop: ${desktop ? desktop.performanceScore : 'FAILED'}`);
  }

  // Build coreWebVitals from client homepage
  const clientHome = clientPages[0] || {};
  const output = {
    data: {
      client: clientPages,
      competitors: competitorPages,
    },
    pageSpeedComparison: comparison,
    coreWebVitals: {
      mobile: clientHome.mobile || {},
      desktop: clientHome.desktop || {},
    },
    gatheredAt: new Date().toISOString(),
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.error(`\nWritten: ${outputPath}`);
  console.error(`  Client pages: ${clientPages.length}, Competitor pages: ${competitorPages.length}`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
```

- [ ] **Step 2: Test with Liane's domain**

```bash
cd "/mnt/c/dev/site audit/clients/liane-jamason"
node ../../template/scripts/gather-pagespeed.js https://www.lianejamason.com https://avalongrouptampabay.com https://eaganluxury.com https://smithandassociates.com https://stpete.pro
```

Expected: `seo/research/pagespeed-data.json` created with real scores for all 5 domains. Verify with:

```bash
node -e "const d = require('./seo/research/pagespeed-data.json'); console.log('Client pages:', d.data.client.length, 'Competitor pages:', d.data.competitors.length, 'Comparison:', d.pageSpeedComparison.length)"
```

- [ ] **Step 3: Commit**

```bash
git add template/scripts/gather-pagespeed.js
git commit -m "feat: add gather-pagespeed.js — PSI API for CWV + Lighthouse scores"
```

---

### Task 8: Create `scripts/gather-domain-metrics.js`

**Files:**
- Create: `template/scripts/gather-domain-metrics.js`

Calls DataForSEO `backlinks/summary/live` for client + competitors. Produces `domain-metrics.json`. The normalizer reads this at Step 6 (line 950-958) as the last fallback for the domain metrics comparison table on the competitors page.

- [ ] **Step 1: Write the script**

Create `template/scripts/gather-domain-metrics.js`:

```javascript
#!/usr/bin/env node
'use strict';

/**
 * gather-domain-metrics.js — Calls DataForSEO backlinks/summary for client + competitors.
 * Produces research/domain-metrics.json.
 *
 * Usage:
 *   node scripts/gather-domain-metrics.js <client-domain> [competitor-domain ...]
 *
 * Requires env vars: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 *
 * Output shape (what the normalizer expects at generate-multipage-report.js:950-958):
 * {
 *   data: [{ domain, domainRating, referringDomains, backlinks, organicTraffic, organicKeywords, trafficValue, isClient }],
 *   gatheredAt: ISO timestamp
 * }
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DFS_BASE = 'https://api.dataforseo.com/v3';

function dfsPost(endpoint, payload, auth) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url = new URL(`${DFS_BASE}${endpoint}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(auth).toString('base64'),
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 60000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error('ERROR: Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables');
    process.exit(1);
  }

  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (args.length === 0) {
    console.error('Usage: node gather-domain-metrics.js <client-domain> [competitor-domain ...]');
    process.exit(1);
  }

  const auth = `${login}:${password}`;
  const clientDomain = args[0];
  const allDomains = args;
  const results = [];

  for (let i = 0; i < allDomains.length; i++) {
    const domain = allDomains[i];
    const isClient = (i === 0);
    console.error(`  Fetching backlinks/summary for ${domain}...`);

    if (i > 0) await sleep(1500); // Rate-limit safety

    try {
      const resp = await dfsPost('/backlinks/summary/live', [{ target: domain }], auth);
      const tasks = resp.tasks || [];
      const task = tasks[0];
      if (!task || task.status_code !== 20000 || !task.result || !task.result[0]) {
        console.error(`  WARNING: No data for ${domain}: ${task ? task.status_message : 'no task'}`);
        results.push({ domain, domainRating: 0, referringDomains: 0, backlinks: 0, isClient });
        continue;
      }

      const r = task.result[0];
      results.push({
        domain,
        domainRating: r.rank || 0,
        referringDomains: r.referring_domains || 0,
        backlinks: r.backlinks || 0,
        organicTraffic: null, // Not available from backlinks endpoint
        organicKeywords: null,
        trafficValue: null,
        brokenBacklinks: r.broken_backlinks || 0,
        isClient,
      });
      console.error(`  Done: ${domain} — DR: ${r.rank}, RD: ${r.referring_domains}, BL: ${r.backlinks}`);
    } catch (err) {
      console.error(`  ERROR for ${domain}: ${err.message}`);
      results.push({ domain, domainRating: 0, referringDomains: 0, backlinks: 0, isClient });
    }
  }

  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'domain-metrics.json');

  fs.writeFileSync(outputPath, JSON.stringify({ data: results, gatheredAt: new Date().toISOString() }, null, 2));
  console.error(`\nWritten: ${outputPath} (${results.length} domains)`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
```

- [ ] **Step 2: Test with Liane's domains**

```bash
cd "/mnt/c/dev/site audit/clients/liane-jamason"
node ../../template/scripts/gather-domain-metrics.js lianejamason.com avalongrouptampabay.com eaganluxury.com smithandassociates.com stpete.pro
```

Expected: `seo/research/domain-metrics.json` with 5 domain entries. Verify:

```bash
node -e "const d = require('./seo/research/domain-metrics.json'); d.data.forEach(e => console.log(e.domain, 'DR:', e.domainRating, 'RD:', e.referringDomains))"
```

- [ ] **Step 3: Commit**

```bash
git add template/scripts/gather-domain-metrics.js
git commit -m "feat: add gather-domain-metrics.js — DFS backlink summary for DR comparison"
```

---

### Task 9: Create `scripts/gather-backlinks.js`

**Files:**
- Create: `template/scripts/gather-backlinks.js`

Calls DataForSEO `backlinks/backlinks/live` + `backlinks/referring_domains/live` for the client domain. Produces `client-backlinks.json`. The normalizer reads this at Step 5d (line 888-930) for the backlink inventory table and referring domains list.

- [ ] **Step 1: Write the script**

Create `template/scripts/gather-backlinks.js`:

```javascript
#!/usr/bin/env node
'use strict';

/**
 * gather-backlinks.js — Calls DataForSEO backlinks endpoints for client domain.
 * Produces research/client-backlinks.json.
 *
 * Usage:
 *   node scripts/gather-backlinks.js <client-domain> [--limit 500]
 *
 * Requires env vars: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 *
 * Output shape (what the normalizer expects at generate-multipage-report.js:888-930):
 * {
 *   domain: string,
 *   totalBacklinks: number,
 *   referringDomains: number,
 *   backlinks: [{ source_url, target_url, anchor_text, domain_rating, is_dofollow, first_seen }],
 *   referring_domains: [{ domain, rank, backlinks, first_seen, dofollow, referring_pages }],
 *   gatheredAt: ISO timestamp
 * }
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DFS_BASE = 'https://api.dataforseo.com/v3';

function dfsPost(endpoint, payload, auth) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url = new URL(`${DFS_BASE}${endpoint}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(auth).toString('base64'),
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 120000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error('ERROR: Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const domain = args.find(a => !a.startsWith('--'));
  if (!domain) {
    console.error('Usage: node gather-backlinks.js <client-domain> [--limit 500]');
    process.exit(1);
  }

  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 500;
  const auth = `${login}:${password}`;

  // 1. Fetch backlink list
  console.error(`  Fetching backlinks for ${domain} (limit ${limit})...`);
  let backlinks = [];
  try {
    const resp = await dfsPost('/backlinks/backlinks/live', [{
      target: domain,
      limit: limit,
      mode: 'as_is',
      order_by: ['rank,desc'],
    }], auth);
    const task = (resp.tasks || [])[0];
    if (task && task.status_code === 20000 && task.result && task.result[0]) {
      backlinks = (task.result[0].items || []).map(item => ({
        source_url: item.url_from || '',
        target_url: item.url_to || '',
        anchor_text: item.anchor || '',
        domain_rating: item.rank || null,
        is_dofollow: item.dofollow !== false,
        first_seen: item.first_seen || '',
      }));
      console.error(`  Backlinks: ${backlinks.length} records`);
    } else {
      console.error(`  WARNING: No backlink data: ${task ? task.status_message : 'no task'}`);
    }
  } catch (err) {
    console.error(`  ERROR fetching backlinks: ${err.message}`);
  }

  await sleep(2000);

  // 2. Fetch referring domains
  console.error(`  Fetching referring domains for ${domain}...`);
  let referringDomains = [];
  try {
    const resp = await dfsPost('/backlinks/referring_domains/live', [{
      target: domain,
      limit: 200,
      order_by: ['rank,desc'],
    }], auth);
    const task = (resp.tasks || [])[0];
    if (task && task.status_code === 20000 && task.result && task.result[0]) {
      referringDomains = (task.result[0].items || []).map(item => ({
        domain: item.domain || '',
        rank: item.rank || 0,
        backlinks: item.backlinks || 0,
        first_seen: item.first_seen || '',
        dofollow: item.dofollow || 0,
        referring_pages: item.referring_pages || 0,
      }));
      console.error(`  Referring domains: ${referringDomains.length} records`);
    } else {
      console.error(`  WARNING: No referring domain data: ${task ? task.status_message : 'no task'}`);
    }
  } catch (err) {
    console.error(`  ERROR fetching referring domains: ${err.message}`);
  }

  const output = {
    domain,
    totalBacklinks: backlinks.length,
    referringDomains: referringDomains.length,
    backlinks,
    referring_domains: referringDomains,
    gatheredAt: new Date().toISOString(),
  };

  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'client-backlinks.json');

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.error(`\nWritten: ${outputPath} (${backlinks.length} backlinks, ${referringDomains.length} referring domains)`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
```

- [ ] **Step 2: Test with Liane's domain**

```bash
cd "/mnt/c/dev/site audit/clients/liane-jamason"
node ../../template/scripts/gather-backlinks.js lianejamason.com --limit 200
```

Expected: `seo/research/client-backlinks.json` with backlink records. Verify:

```bash
node -e "const d = require('./seo/research/client-backlinks.json'); console.log('Backlinks:', d.backlinks.length, 'Referring domains:', d.referring_domains.length)"
```

- [ ] **Step 3: Commit**

```bash
git add template/scripts/gather-backlinks.js
git commit -m "feat: add gather-backlinks.js — DFS backlink inventory for client"
```

---

### Task 10: Create `scripts/extract-text.js`

**Files:**
- Create: `template/scripts/extract-text.js`

Uses Playwright to extract real page text from each URL in crawl-data.json, computing Flesch-Kincaid readability scores. Produces `page-text-analysis.json`. The normalizer reads this at Step 5c (line 852-886) to enrich `contentQuality.pages[].readability` with syllables/word data.

- [ ] **Step 1: Write the script**

Create `template/scripts/extract-text.js`:

```javascript
#!/usr/bin/env node
'use strict';

/**
 * extract-text.js — Extracts page text via Playwright and computes Flesch-Kincaid
 * readability scores. Produces research/page-text-analysis.json.
 *
 * Usage:
 *   node scripts/extract-text.js [--input research/crawl-data.json] [--limit 50]
 *
 * Output shape (what the normalizer expects at generate-multipage-report.js:852-886):
 * {
 *   pages: [{
 *     url, title, wordCount, sentenceCount, syllableCount,
 *     fleschReadingEase, fleschKincaidGrade, avgWordsPerSentence, avgSyllablesPerWord
 *   }],
 *   summary: { totalPages, avgFleschReadingEase, avgFleschKincaidGrade, avgWordCount },
 *   gatheredAt: ISO timestamp
 * }
 */

const fs = require('fs');
const path = require('path');

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;
  // Remove trailing silent-e
  word = word.replace(/e$/, '');
  // Count vowel groups
  const matches = word.match(/[aeiouy]+/g);
  const count = matches ? matches.length : 1;
  return Math.max(1, count);
}

function analyzeText(text) {
  // Split into sentences (. ! ? followed by space or end)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Split into words
  const words = text.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0);
  const wordCount = words.length;
  if (wordCount === 0) return null;

  // Count syllables
  let syllableCount = 0;
  for (const w of words) {
    syllableCount += countSyllables(w);
  }

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
  const fleschReadingEase = Math.round((206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord) * 10) / 10;

  // Flesch-Kincaid Grade: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
  const fleschKincaidGrade = Math.round((0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59) * 10) / 10;

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    fleschReadingEase,
    fleschKincaidGrade,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSentenceLength: Math.round(avgWordsPerSentence * 10) / 10, // alias — normalizer reads this at line 873
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}

async function main() {
  let chromium;
  try {
    chromium = require('playwright').chromium;
  } catch {
    console.error('ERROR: Playwright not installed. Run: npm install playwright');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 50;

  const inputIdx = args.indexOf('--input');
  const inputPath = inputIdx >= 0
    ? path.resolve(args[inputIdx + 1])
    : path.resolve('seo', 'research', 'crawl-data.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`ERROR: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const crawlData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  let urls = [];
  if (Array.isArray(crawlData.pages)) {
    urls = crawlData.pages.map(p => p.url).filter(Boolean);
  } else if (Array.isArray(crawlData.urls)) {
    urls = crawlData.urls.filter(Boolean);
  } else if (Array.isArray(crawlData)) {
    urls = crawlData.map(p => p.url || p).filter(Boolean);
  }

  if (urls.length === 0) {
    console.error('ERROR: No URLs found in crawl data');
    process.exit(1);
  }

  const urlsToProcess = urls.slice(0, limit);
  console.error(`Processing ${urlsToProcess.length} of ${urls.length} URLs (limit: ${limit})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)' });
  const pages = [];

  for (let i = 0; i < urlsToProcess.length; i++) {
    const url = urlsToProcess[i];
    console.error(`  [${i + 1}/${urlsToProcess.length}] ${url}`);

    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Extract body text, stripping non-content elements
      const result = await page.evaluate(() => {
        // Remove non-content elements
        const removeSelectors = ['script', 'style', 'noscript', 'nav', 'footer', 'header', 'aside', '.nav', '.footer', '.header', '.sidebar'];
        const clone = document.body.cloneNode(true);
        removeSelectors.forEach(sel => {
          clone.querySelectorAll(sel).forEach(el => el.remove());
        });
        return {
          title: document.title || '',
          text: (clone.textContent || '').replace(/\s+/g, ' ').trim(),
        };
      });

      await page.close();

      const metrics = analyzeText(result.text);
      if (metrics) {
        pages.push({ url, title: result.title, ...metrics });
      } else {
        console.error(`    Skipped: no extractable text`);
      }
    } catch (err) {
      console.error(`    ERROR: ${err.message}`);
    }

    // Rate limit: 500ms between pages
    if (i < urlsToProcess.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  await browser.close();

  // Compute summary
  const avgFRE = pages.length ? Math.round(pages.reduce((s, p) => s + p.fleschReadingEase, 0) / pages.length * 10) / 10 : 0;
  const avgFKG = pages.length ? Math.round(pages.reduce((s, p) => s + p.fleschKincaidGrade, 0) / pages.length * 10) / 10 : 0;
  const avgWC = pages.length ? Math.round(pages.reduce((s, p) => s + p.wordCount, 0) / pages.length) : 0;

  const output = {
    pages,
    summary: {
      totalPages: pages.length,
      avgFleschReadingEase: avgFRE,
      avgFleschKincaidGrade: avgFKG,
      avgWordCount: avgWC,
    },
    gatheredAt: new Date().toISOString(),
  };

  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'page-text-analysis.json');

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.error(`\nWritten: ${outputPath} (${pages.length} pages analyzed)`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
```

- [ ] **Step 2: Test with Liane's crawl data**

```bash
cd "/mnt/c/dev/site audit/clients/liane-jamason"
node ../../template/scripts/extract-text.js --limit 10
```

Expected: `seo/research/page-text-analysis.json` with readability scores. Verify:

```bash
node -e "const d = require('./seo/research/page-text-analysis.json'); console.log('Pages:', d.pages.length, 'Avg FRE:', d.summary.avgFleschReadingEase, 'Avg words:', d.summary.avgWordCount)"
```

- [ ] **Step 3: Commit**

```bash
git add template/scripts/extract-text.js
git commit -m "feat: add extract-text.js — Flesch-Kincaid readability from real page text"
```

---

### Task 11: Phase 1 save point

- [ ] **Step 1: Create save point**

```bash
git log --oneline -5
```

Record the commit hash — this is the "Phase 1 complete: all 4 scripts" rollback point.

---

## Phase 2: Template & Skill Updates

---

### Task 12: Update template `audit-data.json` with full 29-key schema scaffold

**Files:**
- Modify: `template/seo/audit-data.json`

The template must include empty scaffolds for ALL 10 missing top-level sections so the data-populator has a clear target and the generator doesn't encounter undefined keys.

- [ ] **Step 1: Add 10 missing section scaffolds to `template/seo/audit-data.json`**

Add these keys after the existing 19 keys (before the final closing `}`). The structure below is the minimum required by each renderer, based on the renderer-field-manifest and calgary-golden-schema research files.

```json
  "contentQuality": {
    "summary": {
      "totalPagesAnalyzed": 0,
      "avgQualityScore": 0,
      "thinPageCount": 0,
      "thinThreshold": 300,
      "avgReadabilityScore": 0,
      "avgSeoScore": 0,
      "avgStructureScore": 0,
      "duplicateGroupCount": 0,
      "cannibalizationCount": 0
    },
    "pages": [],
    "duplicateGroups": [],
    "cannibalization": [],
    "issues": []
  },

  "backlinks": {
    "domainMetrics": {
      "domainRating": 0,
      "referringDomains": 0,
      "totalBacklinks": 0,
      "organicTraffic": null,
      "source": "DataForSEO"
    },
    "topBacklinks": [],
    "competitorDomainMetrics": [],
    "backlinkQualityNote": "",
    "topReferringDomains": 0,
    "dofollowRatio": 0
  },

  "internalLinking": {
    "domain": "",
    "total_pages": 0,
    "total_internal_links": 0,
    "orphan_count": 0,
    "orphan_rate": 0,
    "avg_inbound_links": 0,
    "avg_outbound_links": 0,
    "orphans": [],
    "hubClusters": [],
    "issues": [],
    "recommendations": []
  },

  "technicalSeo": {
    "metaTagSummary": {},
    "metaTagIssues": [],
    "imageAudit": { "summary": {}, "worstPages": [] },
    "schemaSummary": {},
    "canonicalAudit": { "summary": {}, "issues": [] },
    "redirectChains": { "summary": {}, "chains": [], "issues": [] },
    "securityHeaders": { "summary": {}, "issues": [] },
    "coreWebVitals": { "mobile": {}, "desktop": {} },
    "lighthouseResults": { "clientPages": [] },
    "pageSpeedComparison": [],
    "pageSpeedOpportunities": [],
    "crawlIssues": [],
    "pageAudits": []
  },

  "localSeo": {
    "businessProfile": {
      "name": "",
      "address": "",
      "phone": "",
      "latitude": 0,
      "longitude": 0,
      "category": "",
      "rating": null,
      "reviewCount": 0,
      "gbpVerified": false
    },
    "competitorLocations": [],
    "searchDemandZones": [],
    "reviewSentiment": { "summary": {} },
    "serviceAreaMap": { "type": "FeatureCollection", "features": [] },
    "accessNotes": { "gbpAccess": false, "gaAccess": false, "searchConsoleAccess": false, "note": "" }
  },

  "indexationCrawlability": {
    "crawlBudgetHealth": { "score": 0, "grade": "", "factors": {} },
    "parameterAudit": { "summary": {}, "pages": [], "issues": [] },
    "paginationAudit": { "summary": {}, "pages": [], "issues": [] },
    "soft404s": { "summary": {}, "pages": [] },
    "indexOrphans": { "summary": {}, "orphans": [] }
  },

  "eeatSignals": {
    "summary": {
      "eeatScore": 0,
      "eeatGrade": "",
      "trustScore": 0,
      "expertiseScore": 0,
      "authorityScore": 0,
      "experienceScore": 0,
      "totalPages": 0
    },
    "siteTrust": {},
    "pageSignals": [],
    "eeatScore": { "score": 0, "grade": "" },
    "issues": []
  },

  "reportingIntelligence": {
    "siteHealthGrade": { "compositeScore": 0, "letterGrade": "" },
    "categoryScores": {},
    "prioritizedFindings": [],
    "executiveSummary": "",
    "benchmarkComparisons": []
  },

  "competitorAnalysis": {
    "domainMetricsComparison": [],
    "pageSpeedComparison": [],
    "organicKeywordsComparison": {},
    "keyInsights": []
  },

  "rankHistory": {
    "snapshots": [],
    "chartLabels": [],
    "milestoneLabels": {},
    "domains": { "client": "", "competitors": [] },
    "keywords": {}
  }
```

- [ ] **Step 2: Verify the template parses and has 29 keys**

```bash
cd "/mnt/c/dev/site audit"
node -e "const d = require('./template/seo/audit-data.json'); console.log(Object.keys(d).length, 'top-level keys'); if (Object.keys(d).length !== 29) { console.error('EXPECTED 29 KEYS'); process.exit(1); }"
```

Expected: `29 top-level keys`

- [ ] **Step 3: Commit**

```bash
git add template/seo/audit-data.json
git commit -m "feat: add full 29-key schema scaffold to template audit-data.json"
```

---

### Task 13: Clean template HTML of stale data

**Files:**
- Verify: `template/reports/multipage/shared/debug-data.js`
- Check: `template/reports/multipage/*.html` for baked client data

- [ ] **Step 1: Verify debug-data.js is clean**

```bash
cat "template/reports/multipage/shared/debug-data.js"
```

Expected: Should contain only `window.AUDIT_DATA = null;` (or similar empty state). If it contains real client data, replace with:

```javascript
window.AUDIT_DATA = null;
```

- [ ] **Step 2: Check template HTML files for baked data**

```bash
cd "/mnt/c/dev/site audit"
grep -l "AUDIT_DATA" template/reports/multipage/*.html 2>/dev/null | head -5
```

If any HTML files have `window.AUDIT_DATA = {` with real client data, strip the data injection. The HTML templates should only contain the placeholder `/* __AUDIT_DATA_PLACEHOLDER__ */null`.

- [ ] **Step 3: Commit (if changes made)**

```bash
git add template/reports/multipage/
git commit -m "fix: clean stale client data from template HTML and debug-data.js"
```

---

### Task 14: Pre-build Tailwind CSS to eliminate blank-page-on-first-load

**Files:**
- Modify: `template/reports/multipage/generate-multipage-report.js` (swap CDN script for CSS link)
- Create: `template/reports/multipage/shared/tailwind.css` (output from build)

The Tailwind CDN script (`cdn.tailwindcss.com`) causes a brief blank-page flash and fails entirely when offline. Pre-building produces a minimal CSS file with only the classes actually used.

- [ ] **Step 1: Install Tailwind CLI as devDependency**

```bash
cd "/mnt/c/dev/site audit/template"
npm install --save-dev tailwindcss @tailwindcss/cli
```

- [ ] **Step 2: Create Tailwind config**

Create `template/tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './reports/multipage/**/*.html',
    './reports/multipage/pages/**/*.js',
    './reports/multipage/shared/**/*.js',
  ],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 3: Generate the pre-built CSS**

```bash
cd "/mnt/c/dev/site audit/template"
npx @tailwindcss/cli -o reports/multipage/shared/tailwind.css --minify
```

Expected: `shared/tailwind.css` file created (~15-30KB).

- [ ] **Step 4: Update generator to emit CSS link instead of CDN script**

In `template/reports/multipage/generate-multipage-report.js`, find where it writes the `<head>` section. Find:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Replace with:

```html
<link rel="stylesheet" href="shared/tailwind.css">
```

- [ ] **Step 5: Commit**

```bash
git add template/reports/multipage/shared/tailwind.css template/tailwind.config.js template/reports/multipage/generate-multipage-report.js template/package.json template/package-lock.json
git commit -m "perf: pre-build Tailwind CSS — eliminates blank-page-on-first-load"
```

---

### Task 15: Update `/seo-audit` skill with missing data-gathering steps

**Files:**
- Modify: `commands/seo-audit.md`

The skill needs 3 changes: a new Step 5.5 for running the 4 data-gathering scripts, an expanded Step 8a with the 10 missing sections, and a Step 8b addition for multipage HTML generation.

- [ ] **Step 1: Add Step 5.5 — "Run Data-Gathering Scripts"**

Add after the 6 research agents complete (after Step 5) but before the report compiler (Step 6):

```markdown
## Step 5.5: Run Data-Gathering Scripts

After all 6 research agents are complete, run these scripts to produce the JSON files
the report generator needs. These do NOT require Google connectors.

### PageSpeed data (public PSI API, no auth):
```bash
node scripts/gather-pagespeed.js {CLIENT_SITE_URL} {COMPETITOR_URLS_SPACE_SEPARATED}
```
Output: `seo/research/pagespeed-data.json`

### Domain metrics (DataForSEO, API key only):
```bash
node scripts/gather-domain-metrics.js {CLIENT_DOMAIN} {COMPETITOR_DOMAINS_SPACE_SEPARATED}
```
Output: `seo/research/domain-metrics.json`

### Backlink inventory (DataForSEO, API key only):
```bash
node scripts/gather-backlinks.js {CLIENT_DOMAIN}
```
Output: `seo/research/client-backlinks.json`

### Page text analysis (Playwright, no auth):
```bash
node scripts/extract-text.js --limit 50
```
Output: `seo/research/page-text-analysis.json`

**Verify all 4 files exist before proceeding:**
```bash
ls -lh seo/research/{pagespeed-data,domain-metrics,client-backlinks,page-text-analysis}.json
```
```

- [ ] **Step 2: Expand Step 8a field list with 10 missing sections**

Add these to the "Fields to populate in audit-data.json" list:

```markdown
### Sections that require manual population from research files:

- `contentQuality` — from content-audit.md + page-text-analysis.json:
  - `summary`: totalPagesAnalyzed, avgQualityScore, thinPageCount (threshold: 300 words), avgReadabilityScore, avgSeoScore, avgStructureScore, duplicateGroupCount, cannibalizationCount
  - `pages[]`: url, title, readabilityScore, qualityScore, isThin, readability (sub-object with fleschReadingEase, fleschKincaidGrade, wordCount, scoreExplanation), structure (sub-object with headingCount, h2Count, h3Count, headingHierarchyValid, imageCount, imagesWithAlt, internalLinks, hasFaqSchema), issues[], recommendations[]
  - `duplicateGroups[]`: fingerprint, similarity, wordCountRange, pages[], recommendation
  - `cannibalization[]`: keyword, severity, pages[] (url, clicks, impressions, position), recommendation

- `backlinks` — from backlink-analysis.md + domain-metrics.json + client-backlinks.json:
  - `domainMetrics`: domainRating, referringDomains, totalBacklinks, organicTraffic, source ("DataForSEO")
  - `topBacklinks[]`: sourceUrl, targetUrl, anchorText, domainRating, isDofollow, firstSeen
  - `competitorDomainMetrics[]`: domain, domainRating, referringDomains, backlinks, isClient

- `technicalSeo` — from client-site-structure.md + pagespeed-data.json:
  - `metaTagSummary`: pagesWithTitle, pagesWithoutTitle, pagesWithDescription, pagesWithoutDescription, duplicateTitles, duplicateDescriptions, pagesWithCanonical, pagesWithoutCanonical
  - `metaTagIssues[]`: url, issue, detail
  - `imageAudit`: summary (totalImages, totalMissingAlt, overallAltCoverage), worstPages[]
  - `schemaSummary`: pagesWithSchema, pagesWithoutSchema, schemaTypesFound[], recommendedSchemas[]
  - `canonicalAudit`: summary, issues[]
  - `redirectChains`: summary, chains[], issues[]
  - `securityHeaders`: summary (headerCoverage per header), issues[]
  - `coreWebVitals`: mobile + desktop (performanceScore, lcp, cls, fcp, inp, ttfb, speedIndex)
  - `lighthouseResults`: clientPages[] (url + per-strategy scores)
  - `pageSpeedComparison[]`: domain, mobileScore, desktopScore, isClient — **MUST use real per-competitor PSI measurements, never copy client scores**
  - `pageSpeedOpportunities[]`: issue, savingsKb, savingsMs, affectsAllPages
  - `crawlIssues[]`: url, statusCode, issue

- `localSeo` — from geocoded client address + competitor research:
  - `businessProfile`: name, address, phone, latitude (**required**), longitude (**required**), category, rating, reviewCount, gbpVerified
  - `competitorLocations[]`: name, domain, lat, lng
  - `searchDemandZones[]`: lat, lng, radius, label, volume, color, opacity
  - `serviceAreaMap`: GeoJSON FeatureCollection with Point (center, **coordinates in [lng, lat] order**) + Polygon (service area boundary)
  - `accessNotes`: gbpAccess, gaAccess, searchConsoleAccess, note

- `eeatSignals` — from content-audit.md + best-practices:
  - `summary`: eeatScore, eeatGrade, trustScore, expertiseScore, authorityScore, experienceScore, totalPages
  - `siteTrust`: boolean flags (hasAboutPage, hasContactPage, hasPrivacyPolicy, etc.), trustSignalCount/Total/Pct
  - `pageSignals[]`: url, isYmyl, hasAuthor, hasPublicationDate, hasExpertiseSchema, effortScore, expertiseScore
  - `eeatScore`: score, grade — **must match summary values**
  - `issues[]`: issue, detail, severity, reference

- `indexationCrawlability` — from client-site-structure.md crawl data:
  - `crawlBudgetHealth`: score, grade, factors (parameterizedUrls, orphanPages, redirectChains, soft404s, deepPages)
  - `parameterAudit`, `paginationAudit`, `soft404s`, `indexOrphans` — each with summary + items

- `competitorAnalysis` — from competitor-analysis.md + domain-metrics.json + pagespeed-data.json:
  - `domainMetricsComparison[]`: domain, dr, referringDomains, backlinks, isClient
  - `pageSpeedComparison[]`: domain, mobileScore, desktopScore, isClient
  - `organicKeywordsComparison`: keyed by domain
  - `keyInsights[]`: insight strings

- `rankHistory` — from keyword-research.md (current snapshot):
  - `snapshots[]`: date strings (ISO)
  - `chartLabels[]`: display labels
  - `domains`: { client: domain, competitors: [domain, ...] }
  - `keywords`: object keyed by keyword string, each with volume, difficulty, history (object keyed by domain, each keyed by date → rank or null)

- `reportingIntelligence` — **populate LAST, derived from all other sections**:
  - `siteHealthGrade`: compositeScore, letterGrade
  - `categoryScores`: technical, performance, content, backlinks, indexability, local
  - `prioritizedFindings[]`: issue, detail, impact, effort, roiScore, affectedCount, category, sampleUrls
  - `executiveSummary`: narrative string

### Fields auto-populated by the generator (DO NOT manually populate):
- `technicalSeo.pageAudits[]` — from research/crawl-data.json
- `technicalSeo.lighthouseResults[]` — from research/pagespeed-data.json (reshaped)
- `coreWebVitals` — hoisted from technicalSeo.coreWebVitals
- `pageSpeedComparison[]` — derived from competitorAnalysis or technicalSeo version
- `internalLinking` stats — from research/link-graph.json
- `internalLinking.hubClusters[]` — from research/link-graph.json
- `contentQuality.pages[].readability.syllablesPerWord` — enriched from research/page-text-analysis.json
- `backlinks.topBacklinks[]` — enriched from research/client-backlinks.json
- `backlinks.topReferringDomains[]` — from research/client-backlinks.json
- `domainMetrics` — from backlinks.competitorDomainMetrics or research/domain-metrics.json
- `backlinkOpportunities` — constructed from backlinks + research/backlink-opportunities.json
- `competitorComparison[]` column normalization — domain-slug keys → comp1..compN
```

- [ ] **Step 3: Add multipage HTML generation to Step 8b**

After the existing Excel + PowerPoint generation, add:

```markdown
### Generate multipage HTML report:
```bash
cd reports/multipage && node generate-multipage-report.js
```
Output: `seo/multipage-report-{CLIENT_SLUG}-{DATE}/` — 9 HTML pages + assets

### Quick validation:
```bash
cd seo/multipage-report-*/ && python3 -m http.server 8080
```
Open http://localhost:8080 and verify all 9 pages render.
```

- [ ] **Step 4: Commit**

```bash
git add commands/seo-audit.md
git commit -m "fix: update /seo-audit skill — add Step 5.5 data scripts + expand Step 8a field list"
```

---

### Task 16: Phase 2 save point

- [ ] **Step 1: Create save point**

```bash
git status
git log --oneline -8
```

Record the commit hash — this is the "Phase 2 complete: template + skill updated" rollback point.

---

## Phase 3: Verify with Liane Jamason

This phase runs the new scripts against Liane's data, populates the 10 missing audit-data.json sections, and regenerates all reports for visual verification.

---

### Task 17: Copy new scripts and run all 4 for Liane

**Files:**
- Working directory: `clients/liane-jamason/`

- [ ] **Step 1: Copy new scripts from template**

```bash
cd "/mnt/c/dev/site audit"
cp template/scripts/gather-pagespeed.js clients/liane-jamason/scripts/
cp template/scripts/gather-domain-metrics.js clients/liane-jamason/scripts/
cp template/scripts/gather-backlinks.js clients/liane-jamason/scripts/
cp template/scripts/extract-text.js clients/liane-jamason/scripts/
```

- [ ] **Step 2: Run gather-pagespeed.js (public PSI API, no auth)**

```bash
cd "/mnt/c/dev/site audit/clients/liane-jamason"
node scripts/gather-pagespeed.js https://www.lianejamason.com https://avalongrouptampabay.com https://eaganluxury.com https://smithandassociates.com https://stpete.pro
```

- [ ] **Step 3: Run gather-domain-metrics.js (requires DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD)**

```bash
node scripts/gather-domain-metrics.js lianejamason.com avalongrouptampabay.com eaganluxury.com smithandassociates.com stpete.pro
```

- [ ] **Step 4: Run gather-backlinks.js (requires DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD)**

```bash
node scripts/gather-backlinks.js lianejamason.com
```

- [ ] **Step 5: Run extract-text.js (requires Playwright)**

```bash
node scripts/extract-text.js --limit 30
```

- [ ] **Step 6: Verify all 4 JSON files exist and are valid**

```bash
for f in pagespeed-data domain-metrics client-backlinks page-text-analysis; do
  echo -n "$f.json: "
  python3 -m json.tool "seo/research/$f.json" > /dev/null 2>&1 && echo "OK ($(wc -c < "seo/research/$f.json") bytes)" || echo "INVALID JSON"
done
```

Expected: All 4 files exist with non-zero sizes and valid JSON.

- [ ] **Step 7: Commit**

```bash
git add clients/liane-jamason/scripts/ clients/liane-jamason/seo/research/
git commit -m "data: run all 4 data-gathering scripts for Liane Jamason"
```

---

### Task 18: Populate 10 missing audit-data.json sections for Liane

**Files:**
- Modify: `clients/liane-jamason/seo/audit-data.json`

**Source files to read while populating:**
- `clients/liane-jamason/seo/research/content-audit.md` → contentQuality
- `clients/liane-jamason/seo/research/client-site-structure.md` → technicalSeo, indexationCrawlability
- `clients/liane-jamason/seo/research/backlink-analysis.md` → backlinks
- `clients/liane-jamason/seo/research/competitor-analysis.md` → competitorAnalysis, backlinks.competitorDomainMetrics
- `clients/liane-jamason/seo/research/keyword-research.md` → rankHistory
- `clients/liane-jamason/seo/research/pagespeed-data.json` → technicalSeo.coreWebVitals, lighthouseResults, pageSpeedComparison
- `clients/liane-jamason/seo/research/domain-metrics.json` → backlinks.competitorDomainMetrics
- `clients/liane-jamason/seo/research/client-backlinks.json` → backlinks.topBacklinks (auto-populated by normalizer)
- `clients/liane-jamason/seo/research/page-text-analysis.json` → contentQuality.pages[].readability (auto-enriched)
- `clients/liane-jamason/seo/FINAL-AUDIT-REPORT.md` → eeatSignals, reportingIntelligence

**Population order (dependencies matter):**

- [ ] **Step 1: Populate `technicalSeo`**

Read `client-site-structure.md` for meta tag counts, image audit, schema coverage, security headers, crawl issues. Read `pagespeed-data.json` for coreWebVitals and lighthouseResults.clientPages. Build `pageSpeedComparison[]` from `pagespeed-data.json` comparison array — use **real per-domain scores**, NOT copied from client.

- [ ] **Step 2: Populate `contentQuality`**

Read `content-audit.md` for per-page quality assessments. Build `summary` from page data. Set `thinThreshold: 300`. Build `pages[]` with readability, structure, and issues per page. The normalizer will enrich `readability.syllablesPerWord` from `page-text-analysis.json` automatically.

- [ ] **Step 3: Populate `backlinks`**

Read `backlink-analysis.md` + `domain-metrics.json`. Set `domainMetrics` from client entry. Build `competitorDomainMetrics[]` from all domain-metrics entries. The normalizer will add `topBacklinks[]` from `client-backlinks.json` automatically.

- [ ] **Step 4: Populate `localSeo`**

Client: Liane Jamason, Corcoran Dwellings, 1405 Dr. MLK Jr St N, St Petersburg, FL 33704.
Coordinates: latitude ~27.7861, longitude ~-82.6638 (verify via Google Maps).
Build `serviceAreaMap` GeoJSON with Point at [-82.6638, 27.7861] (GeoJSON uses [lng, lat]) and Polygon covering St. Petersburg / Tampa Bay area.
Build `competitorLocations[]` with approximate city-center coords for each competitor.
Set `accessNotes`: { gbpAccess: false, gaAccess: false, searchConsoleAccess: false, note: "No Google connector access" }.

- [ ] **Step 5: Populate `competitorAnalysis`**

Build from `competitor-analysis.md` + `domain-metrics.json` + `pagespeed-data.json`. Set `domainMetricsComparison[]` and `pageSpeedComparison[]` with real per-domain data.

- [ ] **Step 6: Populate `eeatSignals`**

Build from `content-audit.md` + `seo-best-practices-2026.md`. Score trust signals by checking site features (about page, contact, privacy policy, schema, etc.). Set both `summary` and `eeatScore` with **matching values**.

- [ ] **Step 7: Populate `internalLinking`**

Most fields auto-populated from `link-graph.json` by the normalizer. Set `domain` to `https://www.lianejamason.com`.

- [ ] **Step 8: Populate `indexationCrawlability`**

Build from `client-site-structure.md` crawl data — parameterized URLs, pagination, soft 404s.

- [ ] **Step 9: Populate `rankHistory`**

Build from `keyword-research.md`. Create one snapshot for current date. Set `domains.client` and `domains.competitors`. Build `keywords` object keyed by keyword string with volume, difficulty, and history (domain → date → rank or null).

- [ ] **Step 10: Populate `reportingIntelligence` (LAST)**

Derive from all other sections. Calculate `compositeScore` and `letterGrade` from category scores. Build `prioritizedFindings[]` from issues across all sections. Write `executiveSummary` narrative.

- [ ] **Step 11: Verify JSON is valid and has 29 keys**

```bash
cd "/mnt/c/dev/site audit/clients/liane-jamason"
node -e "
const d = require('./seo/audit-data.json');
const keys = Object.keys(d);
console.log(keys.length, 'keys');
const required = ['contentQuality','backlinks','internalLinking','technicalSeo','localSeo','indexationCrawlability','eeatSignals','reportingIntelligence','competitorAnalysis','rankHistory'];
required.forEach(k => console.log(k + ':', d[k] ? 'OK' : 'MISSING'));
"
```

Expected: 29 keys, all 10 previously missing sections present.

- [ ] **Step 12: Commit**

```bash
git add clients/liane-jamason/seo/audit-data.json
git commit -m "data: populate all 10 missing audit-data.json sections for Liane Jamason"
```

---

### Task 19: Regenerate all reports and verify

**Files:**
- Working directory: `clients/liane-jamason/`

- [ ] **Step 1: Regenerate Excel + PowerPoint**

```bash
cd "/mnt/c/dev/site audit/clients/liane-jamason"
node scripts/generate-spreadsheet.js
node scripts/generate-presentation.js
```

- [ ] **Step 2: Regenerate multipage HTML report**

```bash
cd reports/multipage && node generate-multipage-report.js
```

Check the console output for:
- `Auto-populated` messages (should see several)
- `WARNING` messages from the new try/catch logging (should see none if JSON files are valid)
- `fixes` count at the end

- [ ] **Step 3: Verify all 9 HTML pages exist in output**

```bash
ls -la "/mnt/c/dev/site audit/clients/liane-jamason/seo/multipage-report-liane-jamason-"*/
```

Expected: 9 HTML files (index, keywords, content, technical, links, backlink-opportunities, competitors, local, action-plan) + shared/ and pages/ directories.

- [ ] **Step 4: Visual verification checklist**

Launch a local server and check each page:

```bash
cd "/mnt/c/dev/site audit/clients/liane-jamason/seo/multipage-report-liane-jamason-"*/ && python3 -m http.server 8080
```

| Page | Must verify |
|------|-----------|
| **Summary** (index.html) | 6 key stat tiles, top issues list, site comparison table, quick wins |
| **Keywords** (keywords.html) | Rankings table with numeric volumes, volume bar chart renders, rank history (at least 1 snapshot) |
| **Content** (content.html) | Readability table with scores, thin content list, duplicate groups |
| **Technical** (technical.html) | CWV gauges with real scores, Lighthouse per-page results, PageSpeed comparison chart with different per-domain scores, meta audit table, schema coverage |
| **Links** (links.html) | Internal linking stats, orphan pages, hub clusters |
| **Backlinks** (backlink-opportunities.html) | NO "NaN" anywhere, competitor comparison chart, opportunity table |
| **Competitors** (competitors.html) | Domain metrics comparison table, PageSpeed comparison chart, competitor strategies |
| **Local** (local.html) | Leaflet map renders with St. Petersburg center, competitor pins, GBP card |
| **Action Plan** (action-plan.html) | All 4 tabs (quick wins, short, medium, long term), content calendar |

- [ ] **Step 5: Create save point**

```bash
cd "/mnt/c/dev/site audit"
git add clients/liane-jamason/
git commit -m "Save point: Liane Jamason full pipeline fix — all 9 report pages verified"
```

---

## Phase 4: Final Test on New Client

**This is the success criterion.** The pipeline must work for a brand new client — not Liane, not Calgary — with only a domain name and competitor list as inputs. If all 9 pages populate correctly following the `/seo-audit` skill, the pipeline is fixed.

---

### Task 20: Run `/seo-audit` on a fresh client

- [ ] **Step 1: Choose a test client**

Pick a real estate website that is NOT lianejamason.com or sellingcalgarycastles.com. Use it as a fresh test of the full `/seo-audit` workflow.

- [ ] **Step 2: Run the full `/seo-audit` workflow**

Follow the updated `/seo-audit` skill end-to-end, including the new Step 5.5 data-gathering scripts.

- [ ] **Step 3: Verify all 9 pages render correctly**

Same visual verification checklist as Task 19, Step 4. If any page is blank or shows "NaN" / missing data:

1. Check the generator console output for `WARNING` messages
2. Check if the relevant research JSON file exists and is valid
3. Check if the relevant `audit-data.json` section is populated
4. Use `/systematic-debugging` to diagnose

- [ ] **Step 4: If pages pass — commit and celebrate**

```bash
git add clients/{NEW_CLIENT}/
git commit -m "verified: full pipeline working on fresh client {NEW_CLIENT}"
```

- [ ] **Step 5: If pages fail — loop back**

Read the specific failure, diagnose root cause, fix in template, regenerate. Do NOT patch client data — fix the pipeline so it works for all future clients.

---

## Execution Tooling Recommendations

| Phase | Tasks | Tool | Why |
|-------|-------|------|-----|
| Phase 0 | Tasks 1-5 (bug fixes) | Inline edits | Small, focused changes — no parallelism needed |
| Phase 1 | Tasks 7-10 (scripts) | /subagent-driven-development | 4 independent scripts, can be written in parallel |
| Phase 2 | Tasks 12-15 (template+skill) | Inline edits | Sequential dependencies (schema before skill) |
| Phase 3 | Task 17 (run scripts) | /dispatching-parallel-agents | Run 4 scripts in parallel |
| Phase 3 | Task 18 (populate data) | Single agent with research files in context | Needs cross-section consistency |
| Phase 3 | Task 19 (verify) | /verify or Codex vision agent | Visual confirmation of all 9 pages |
| Phase 4 | Task 20 (fresh client) | Full /seo-audit skill run | End-to-end validation |

**Total: 22 tasks across 4 phases** (Tasks 2b and 2c added after ultraplan agent validation)

## Smart-Team Agent Roster

| Agent | Role | Phases | Dispatch Trigger |
|-------|------|--------|-----------------|
| **silent-failure-hunter** | Scans for silent error swallowing, `\|\| 0` masking, missing empty states | Phase 0 | After each bug fix commit |
| **data-contract-enforcer** | Verifies script output keys match normalizer read paths match renderer access paths | Phase 1, 3 | After each new script created; after audit-data.json populated |
| **json-integrity-validator** | Validates research JSON for structural + semantic correctness (non-zero values, required arrays) | Phase 3 | After each data-gathering script runs |
| **schema-populator-auditor** | Cross-section consistency of audit-data.json (matching eeatScore duplicates, GeoJSON coord order, distinct competitor scores) | Phase 3 | After Task 18 Steps 1-9, before Step 11 |
| **visual-render-verifier** | Screenshots all 9 HTML pages, checks for NaN, Calgary strings, correct map center, distinct scores | Phase 3-4 | After Task 19 Step 2; after Task 20 Step 3 |
| **QA agent** | Per-task output verification (file exists, JSON valid, expected counts) | All phases | After every task |
| **Code Reviewer** | Commit-level code quality, security, conventions | All phases | After every commit |

## Known Out-of-Scope Issues (flagged for separate fix)

These are pre-existing bugs in `platform/src/audit_platform/connectors/dataforseo.py` that affect all clients equally:
- **Line 513:** DFS `rank` is mapped as `domainRating` — these are different metrics on different scales
- **Line 513:** `estimated_paid_traffic` is mapped as `organic_traffic` — wrong field
- **Line 659-668:** `avg_position` mapped as `domain_rating` for competitor results
- **content.js:52-55:** `formatPercent(value)` with 0-100 value produces 9500%
- **technical.js normalizeScore():** score `1.05` → shows `1/100` instead of ~100
