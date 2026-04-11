# API Setup Instructions — SEO Audit Pipeline

Do these while Claude handles the data population. Once done, re-run the scripts and the report sections will populate automatically.

---

## 1. Google Cloud APIs — PageSpeed Insights + Custom Search (FREE)

Both APIs run under the same Google Cloud project, share one API key, and are managed from the same dashboard.

### Step A — Create (or select) a Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. At the top, click the project dropdown
3. Either select an existing project or click **"New Project"**
   - Name it something like **"SEO Audit Tool"**
   - Click **"Create"**
4. Make sure this project is selected for all remaining steps

### Step B — Enable Both APIs

Enable each one (just click "Enable" — takes 2 seconds each):

1. **PageSpeed Insights:** https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com
2. **Custom Search:** https://console.cloud.google.com/apis/library/customsearch.googleapis.com

Both should now show as "Enabled" under your project's API dashboard:
https://console.cloud.google.com/apis/dashboard

### Step C — Create One Shared API Key

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"Create Credentials" > "API Key"**
3. Copy the key
4. (Optional) Click **"Restrict Key"** to limit it to only the two APIs above — good security practice but not required

This single key works for both PageSpeed Insights and Custom Search.

### Step D — Create a Programmable Search Engine (for Custom Search only)

The Custom Search API requires a Search Engine ID (`cx`) that tells it what scope to search.

1. Go to: https://programmablesearchengine.google.com/controlpanel/all
2. Click **"Add"**
3. Under "What to search":
   - Select **"Search the entire web"**
4. Name it something like **"SEO Audit — Full Web"**
5. Click **"Create"**
6. Copy the **Search Engine ID** (your `cx` value — looks like `a1b2c3d4e5f6g7h8i`)
7. You can find it later under "Overview" in the control panel

### Step E — Store Credentials

Add these to `platform/.env`:
```
GOOGLE_API_KEY=your_api_key_here
GOOGLE_CSE_CX=your_search_engine_id_here
```

### Verify — PageSpeed Insights

```bash
source platform/.env
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://www.google.com&strategy=mobile&category=performance&key=$GOOGLE_API_KEY" | head -5
```
Should return JSON with `lighthouseResult`, not a 429 error.

### Verify — Custom Search

```bash
source platform/.env
curl "https://www.googleapis.com/customsearch/v1?key=$GOOGLE_API_KEY&cx=$GOOGLE_CSE_CX&q=liane+jamason+realtor" | head -30
```
Should return JSON with an `items` array containing search results, not an error.

### What You Get from Each

**PageSpeed Insights (25,000 queries/day free):**
- Performance, accessibility, best practices, and SEO scores
- Core Web Vitals (LCP, FID, CLS, INP)
- Lighthouse audit details and recommendations
- Mobile and desktop analysis

**Custom Search (100 queries/day free, $5/1,000 paid):**
- Organic result URLs, titles, and snippets (up to 10 per page)
- Total estimated result count
- Rich result metadata (featured snippets, knowledge panels, etc.)
- Pagination to get beyond page 1
- Keyword ranking checks without needing client Search Console access

### Monitor Usage

Both APIs share one dashboard where you can track quota and usage:
https://console.cloud.google.com/apis/dashboard

---

## 2. DataForSEO Backlinks API ($100/month)

The DFS API returned "Access denied — activate your Backlinks subscription."

**Steps:**
1. Log in to: https://app.dataforseo.com
2. Go to: https://app.dataforseo.com/backlinks-subscription
3. Activate the Backlinks API subscription ($100/month minimum)
4. The same `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` credentials in `platform/.env` will work — no credential changes needed

**Verify it works:**
```bash
cd "/mnt/c/dev/site audit"
source platform/.env
curl -X POST "https://api.dataforseo.com/v3/backlinks/summary/live" \
  -H "Content-Type: application/json" \
  -u "$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD" \
  -d '[{"target": "google.com"}]' | head -20
```
Should return JSON with `status_code: 20000`, not "Access denied."

---

## 3. After All APIs Are Set Up — Re-run Scripts

```bash
cd "/mnt/c/dev/site audit/clients/liane-jamason"

# Source all credentials
set -a && source ../../platform/.env 2>/dev/null && set +a

# PSI (now with API enabled + key)
node scripts/gather-pagespeed.js https://www.lianejamason.com https://avalongrouptampabay.com https://eaganluxury.com https://smithandassociates.com https://stpete.pro

# DFS Domain Metrics (now with Backlinks subscription)
node scripts/gather-domain-metrics.js lianejamason.com avalongrouptampabay.com eaganluxury.com smithandassociates.com stpete.pro

# DFS Backlinks
node scripts/gather-backlinks.js lianejamason.com

# Verify all produced real data (not nulls/zeroes)
node -e "
const psi = require('./seo/research/pagespeed-data.json');
const dm = require('./seo/research/domain-metrics.json');
const bl = require('./seo/research/client-backlinks.json');
console.log('PSI client score:', psi.data.client[0]?.mobile?.performanceScore ?? 'STILL NULL');
console.log('DM client DR:', dm.data[0]?.domainRating ?? 'STILL NULL');
console.log('BL count:', bl.backlinks?.length ?? 'STILL NULL');
"
```

If all three show real values (not NULL), the APIs are working. Tell Claude and we'll regenerate the report.

---

## Current Status of Each API

| API | Status | Cost | Action |
|-----|--------|------|--------|
| Google PSI | Quota at 0 (not enabled) | Free (25K/day) | See Section 1 |
| Google Custom Search | Not set up | Free (100/day) | See Section 1 |
| DFS Backlinks | Subscription inactive | $100/month | Activate at app.dataforseo.com |
| DFS Keywords/SERP | Working | Already paid | No action needed |
| Playwright (crawl) | Working | Free (local) | No action needed |
