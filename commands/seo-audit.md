---
description: Run a full SEO audit with parallel agents — keyword research, site crawl, content audit, competitor analysis, deliverables, and client-ready spreadsheet + PowerPoint.
argument-hint: <client-website> [competitor-website]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent, TeamCreate, TeamDelete, TaskCreate, TaskUpdate, TaskList, TaskGet, AskUserQuestion, SendMessage, WebSearch, WebFetch]
---

# /seo-audit — Full SEO Audit with Parallel Agents

$ARGUMENTS

## Overview

This skill runs a comprehensive SEO audit of a client website using parallel research agents, produces a master audit report, generates implementation deliverables (meta tags, schema markup, community pages, blog posts), and creates client-ready Excel and PowerPoint files.

---

## Step 0: Gather Client Info

Ask the user to fill any gaps. Required fields:

| Field | Variable | Value |
|-------|----------|-------|
| Client website URL | `CLIENT_SITE` | (from $ARGUMENTS or ask) |
| Client name(s) | `CLIENT_NAME` | (ask) |
| Company/Brokerage | `CLIENT_COMPANY` | (ask) |
| Primary competitor URL | `COMPETITOR_SITE` | (from $ARGUMENTS or ask) |
| Service type | `SERVICE_TYPE` | Full Service / Specific niche (ask) |
| Target geography | `LOCATION` | City + region (ask) |
| Primary goal | `GOAL` | Leads / Traffic / Brand awareness (ask) |
| Auto-discover competitors? | `AUTO_COMPETITORS` | Yes/No (ask) |
| Dual-route implementation? | `DUAL_ROUTE` | Claude only / Codex only / Both (ask) |

Use AskUserQuestion with up to 4 questions to gather missing info efficiently.

Store all collected values — they are substituted into every agent prompt below as `{VARIABLE_NAME}`.

### client-config.json

Create `client-config.json` in the client root from the shared template and fill in the client domain, name, competitor list, and Google access values. Set `googleAccess.searchConsole.siteUrl` to the exact property URL (example: `https://www.example.com/`), `googleAccess.analytics.propertyId` to the GA4 property ID (example: `123456789`), and keep any unavailable integrations blank with `hasAccess: false`.

---

## Step 1: Project Setup

Copy the reusable template into a client-specific folder (new clients only). The template lives at the project root.

```bash
# Resolve template + client dirs relative to the repo root (works on macOS/Linux/WSL)
REPO_ROOT=$(git -C "$PWD" rev-parse --show-toplevel 2>/dev/null || pwd)
TEMPLATE_DIR="$REPO_ROOT/template"
CLIENT_DIR="$REPO_ROOT/clients/${CLIENT_NAME_SLUG}"

# Only create from template if the client folder doesn't exist yet
if [ ! -d "$CLIENT_DIR" ]; then
  cp -r "$TEMPLATE_DIR" "$CLIENT_DIR"
  echo "Created new client folder at $CLIENT_DIR"
fi

cd "$CLIENT_DIR"
```

If the template doesn't exist, create the structure manually:
```bash
mkdir -p seo/{research,content,reports} ppc/{exports,research,reports} scripts
```

## Step 1.5: Sync Client Scripts from Template

**⚠ DO NOT REMOVE OR SKIP THIS STEP.** It is the architectural guarantee that every audit runs the latest fixed scripts. Removing it reintroduces silent fork drift — the exact class of bug that caused the Tier 1 audit work.

Before running ANY audit (new or re-run), sync client scripts with the current template. Client copies that differ are **backed up** before being replaced, so nothing is ever lost. Every file under `template/scripts/` is covered recursively — not just `.js`, not just known subdirs. This future-proofs the sync against adding new script types or directory structure.

```bash
# Sanity check: template must have a scripts/ dir. If not, fail loudly — something is wrong with TEMPLATE_DIR resolution.
if [ ! -d "$TEMPLATE_DIR/scripts" ]; then
  echo "FATAL: TEMPLATE_DIR=$TEMPLATE_DIR has no scripts/ subdir. Refusing to sync. Fix Step 1's TEMPLATE_DIR resolution."
  exit 1
fi

# Timestamp + PID to guarantee uniqueness even if two audits launch in the same second.
TIMESTAMP="$(date +%Y%m%d-%H%M%S)-$$"
BACKUP_DIR="$CLIENT_DIR/scripts/_backup/$TIMESTAMP"
SYNCED=0
BACKED_UP=0
ORPHANS=""

sync_file() {
  local src="$1" dst="$2" rel="$3"
  if [ ! -f "$dst" ]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "  [NEW]     $rel"
    SYNCED=$((SYNCED+1))
  elif ! cmp -s "$src" "$dst"; then
    mkdir -p "$BACKUP_DIR/$(dirname "$rel")"
    cp "$dst" "$BACKUP_DIR/$rel"
    cp "$src" "$dst"
    echo "  [UPDATED] $rel (old version saved to scripts/_backup/$TIMESTAMP/)"
    SYNCED=$((SYNCED+1))
    BACKED_UP=$((BACKED_UP+1))
  fi
}

# Walk every file under template/scripts/ recursively — covers .js, .ts, .py, .sh,
# nested subdirs, future-proof against any addition. Excludes _backup/ if it ever
# ends up in the template (shouldn't, but defensive).
while IFS= read -r -d '' src; do
  rel="${src#$TEMPLATE_DIR/scripts/}"
  case "$rel" in _backup/*) continue ;; esac
  sync_file "$src" "$CLIENT_DIR/scripts/$rel" "$rel"
done < <(find "$TEMPLATE_DIR/scripts" -type f -print0)

# Detect orphans: files in client/scripts that are NOT in template/scripts. Do not
# auto-delete (could be intentional client customization) — WARN only.
while IFS= read -r -d '' dst; do
  rel="${dst#$CLIENT_DIR/scripts/}"
  case "$rel" in _backup/*) continue ;; esac
  if [ ! -f "$TEMPLATE_DIR/scripts/$rel" ]; then
    ORPHANS="$ORPHANS  $rel\n"
  fi
done < <(find "$CLIENT_DIR/scripts" -type f -print0 2>/dev/null)

if [ "$SYNCED" -eq 0 ]; then
  echo "Client scripts already match template — no sync needed."
else
  echo "Synced $SYNCED script(s). $BACKED_UP existing client copies were backed up to scripts/_backup/$TIMESTAMP/ (safe to delete once the audit succeeds)."
fi

if [ -n "$ORPHANS" ]; then
  echo ""
  echo "WARNING: client has script files NOT in template (possible intentional customization, possible stale leftover):"
  echo -e "$ORPHANS"
  echo "Review these manually. Delete if stale, or add to template if they should be part of the baseline."
fi
```

**Contract:**
- Template is the single source of truth for every file under `scripts/`.
- Client drift from template is a bug by default. Step 1.5 heals it automatically.
- Intentional client customizations belong in the template (promote the fix upstream) or in a clearly-named sibling directory outside `scripts/` (e.g., `scripts-custom/`) — but NOT in `scripts/` itself.
- Backups in `scripts/_backup/<timestamp>-<pid>/` preserve everything the sync touched. Delete after verifying nothing important was lost.
- Orphan warnings surface files the sync leaves alone. Review and promote/delete; don't ignore.

## Step 1.6: Dependency Check

Check if dependencies are installed:
```bash
node -e "require('playwright')" 2>/dev/null && echo "playwright OK" || echo "NEED playwright"
node -e "require('xlsx')" 2>/dev/null && echo "xlsx OK" || echo "NEED xlsx"
node -e "require('pptxgenjs')" 2>/dev/null && echo "pptxgenjs OK" || echo "NEED pptxgenjs"
```

If missing:
```bash
npm install
npx playwright install chromium
```

All subsequent steps run from within the client folder. All file paths (seo/research/, seo/content/, seo/reports/, scripts/) are relative to this folder.

---

## Step 2: Verify Playwright Scripts Are Present

Step 1.5 should have synced all scripts from template. Confirm with `ls scripts/` — you should see at minimum: `browse.js`, `crawl-sitemap.js`, `check-technical.js`, `ddg-search.js`, and all `gather-*.js` files. If any are missing, Step 1.5 failed or the template is incomplete. Do NOT hand-write scripts to fill gaps — fix the template or Step 1.5 instead.

The reference implementations below document the expected contract and should be updated in the template (not inlined per-client) if the API surface changes.

### scripts/browse.js — General Page Browser

```javascript
// Playwright browser utility - launches Chromium and navigates to a URL
// Usage: node scripts/browse.js <url> [--screenshot <filename>] [--full-page] [--extract-links] [--extract-text] [--extract-meta] [--extract-headings] [--headed] [--wait <ms>]
const { chromium } = require('playwright');

async function main() {
  const args = process.argv.slice(2);
  const url = args[0];
  if (!url) { console.error('Usage: node scripts/browse.js <url> [options]'); process.exit(1); }

  const flags = {
    screenshot: args.includes('--screenshot') ? args[args.indexOf('--screenshot') + 1] : null,
    fullPage: args.includes('--full-page'),
    extractLinks: args.includes('--extract-links'),
    extractText: args.includes('--extract-text'),
    extractMeta: args.includes('--extract-meta'),
    extractHeadings: args.includes('--extract-headings'),
    headed: args.includes('--headed'),
    wait: args.includes('--wait') ? parseInt(args[args.indexOf('--wait') + 1]) : 2000,
  };

  const browser = await chromium.launch({ headless: !flags.headed, slowMo: flags.headed ? 500 : 0 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(flags.wait);

    if (flags.screenshot) {
      await page.screenshot({ path: flags.screenshot, fullPage: flags.fullPage });
      console.log(`Screenshot saved to ${flags.screenshot}`);
    }
    if (flags.extractMeta) {
      const meta = await page.evaluate(() => {
        const getMeta = (name) => { const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`); return el ? el.getAttribute('content') : null; };
        return { title: document.title, description: getMeta('description'), ogTitle: getMeta('og:title'), ogDescription: getMeta('og:description'), ogImage: getMeta('og:image'), canonical: document.querySelector('link[rel="canonical"]')?.href, robots: getMeta('robots'), h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim()) };
      });
      console.log('\n=== META DATA ===');
      console.log(JSON.stringify(meta, null, 2));
    }
    if (flags.extractHeadings) {
      const headings = await page.evaluate(() => { const r = []; document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => { r.push({ tag: el.tagName, text: el.textContent.trim() }); }); return r; });
      console.log('\n=== HEADINGS ===');
      headings.forEach(h => console.log(`${h.tag}: ${h.text}`));
    }
    if (flags.extractLinks) {
      const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map(a => ({ text: a.textContent.trim().substring(0, 100), href: a.href, isInternal: a.href.includes(window.location.hostname), isExternal: !a.href.includes(window.location.hostname) && a.href.startsWith('http') })));
      const internal = links.filter(l => l.isInternal); const external = links.filter(l => l.isExternal);
      console.log(`\n=== LINKS (${links.length} total, ${internal.length} internal, ${external.length} external) ===`);
      console.log('\n--- Internal Links ---');
      [...new Map(internal.map(l => [l.href, l])).values()].forEach(l => console.log(`  ${l.href} [${l.text || 'no text'}]`));
      console.log('\n--- External Links ---');
      [...new Map(external.map(l => [l.href, l])).values()].forEach(l => console.log(`  ${l.href} [${l.text || 'no text'}]`));
    }
    if (flags.extractText) {
      const text = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script, style, noscript').forEach(el => el.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); });
      console.log('\n=== PAGE TEXT ===');
      console.log(text.substring(0, 5000));
      if (text.length > 5000) console.log(`\n... [truncated, total ${text.length} chars]`);
    }
  } catch (err) { console.error('Error:', err.message); } finally { await browser.close(); }
}
main();
```

### scripts/crawl-sitemap.js — Sitemap Crawler

```javascript
// Usage: node scripts/crawl-sitemap.js <domain> [--analyze] [--headed]
const { chromium } = require('playwright');
async function fetchText(page, url) { try { await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }); return await page.content(); } catch(e) { return null; } }
async function main() {
  const args = process.argv.slice(2);
  const domain = args[0];
  if (!domain) { console.error('Usage: node scripts/crawl-sitemap.js <domain> [--analyze]'); process.exit(1); }
  const analyze = args.includes('--analyze');
  const headed = args.includes('--headed');
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
  const page = await context.newPage();
  try {
    console.log('=== ROBOTS.TXT ===');
    const rc = await fetchText(page, `${baseUrl}/robots.txt`);
    if (rc) { const t = await page.evaluate(() => document.body?.textContent || ''); console.log(t.substring(0, 2000)); }
    else console.log('No robots.txt found');
    console.log('\n=== SITEMAP ===');
    let sitemapContent = null, sitemapUrl = null;
    for (const url of [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap_index.xml`, `${baseUrl}/sitemap`]) {
      const c = await fetchText(page, url);
      if (c && (c.includes('<urlset') || c.includes('<sitemapindex'))) { sitemapContent = c; sitemapUrl = url; break; }
    }
    if (sitemapContent) console.log(`Found sitemap at: ${sitemapUrl}`);
    else console.log('No standard sitemap found.');
    const urls = await page.evaluate(() => Array.from(document.querySelectorAll('loc')).map(el => el.textContent.trim()));
    if (urls.length > 0) {
      console.log(`\nTotal URLs in sitemap: ${urls.length}\n`);
      const categories = {};
      urls.forEach(url => { const path = new URL(url).pathname; const seg = path.split('/').filter(Boolean); const cat = seg[0] || 'homepage'; if (!categories[cat]) categories[cat] = []; categories[cat].push(url); });
      console.log('--- URL Categories ---');
      Object.entries(categories).sort((a,b) => b[1].length - a[1].length).forEach(([cat, catUrls]) => {
        console.log(`  ${cat}: ${catUrls.length} pages`);
        catUrls.slice(0, 5).forEach(u => console.log(`    - ${u}`));
        if (catUrls.length > 5) console.log(`    ... and ${catUrls.length - 5} more`);
      });
      if (analyze) {
        console.log('\n=== PAGE ANALYSIS ===');
        for (const pageUrl of urls.slice(0, 20)) {
          try {
            await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15000 }); await page.waitForTimeout(1000);
            const d = await page.evaluate(() => {
              const gm = (n) => { const el = document.querySelector(`meta[name="${n}"], meta[property="${n}"]`); return el ? el.getAttribute('content') : null; };
              return { title: document.title, description: gm('description'), h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim()), h2Count: document.querySelectorAll('h2').length, wordCount: document.body.textContent.replace(/\s+/g, ' ').trim().split(' ').length, imgCount: document.querySelectorAll('img').length, imgWithoutAlt: document.querySelectorAll('img:not([alt]), img[alt=""]').length, internalLinks: document.querySelectorAll(`a[href*="${window.location.hostname}"]`).length, canonical: document.querySelector('link[rel="canonical"]')?.href, hasSchema: !!document.querySelector('script[type="application/ld+json"]') };
            });
            console.log(`\n--- ${pageUrl} ---`);
            console.log(`  Title: ${d.title}\n  Meta Desc: ${d.description || 'MISSING'}\n  H1: ${d.h1.join(', ') || 'MISSING'}\n  H2s: ${d.h2Count}\n  Word Count: ${d.wordCount}\n  Images: ${d.imgCount} (${d.imgWithoutAlt} missing alt)\n  Internal Links: ${d.internalLinks}\n  Canonical: ${d.canonical || 'MISSING'}\n  Schema: ${d.hasSchema ? 'YES' : 'NO'}`);
          } catch(e) { console.log(`\n--- ${pageUrl} --- ERROR: ${e.message}`); }
        }
      }
    }
    console.log('\n=== ALL SITEMAP URLS (JSON) ===');
    console.log(JSON.stringify(urls, null, 2));
  } catch(err) { console.error('Error:', err.message); } finally { await browser.close(); }
}
main();
```

### scripts/ddg-search.js — DuckDuckGo Search (CAPTCHA-free)

```javascript
// Usage: node scripts/ddg-search.js "<query>" [--headed]
const { chromium } = require('playwright');
async function main() {
  const args = process.argv.slice(2);
  const query = args[0];
  if (!query) { console.error('Usage: node scripts/ddg-search.js "<query>" [--headed]'); process.exit(1); }
  const headed = args.includes('--headed');
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', viewport: { width: 1920, height: 1080 }, locale: 'en-US' });
  const page = await context.newPage();
  try {
    await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&kl=us-en`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('[data-testid="result"]').forEach((el, idx) => {
        const titleEl = el.querySelector('h2 a, [data-testid="result-title-a"]');
        const snippetEl = el.querySelector('[data-result="snippet"], .kY2IgmnCmOGjharHErah');
        if (titleEl) items.push({ position: idx + 1, title: titleEl.textContent.trim(), url: titleEl.href, domain: titleEl.href ? new URL(titleEl.href).hostname : '', snippet: snippetEl ? snippetEl.textContent.trim() : '' });
      });
      return items;
    });
    console.log(`=== DUCKDUCKGO RESULTS FOR: "${query}" ===\n--- Results (${results.length}) ---`);
    results.forEach(r => { console.log(`  #${r.position}: ${r.title}\n    URL: ${r.url}\n    Domain: ${r.domain}`); if (r.snippet) console.log(`    Snippet: ${r.snippet.substring(0, 200)}`); console.log(''); });
    // Check target sites — update these per client
    console.log('\n--- TARGET SITE POSITIONS ---');
    ['CLIENT_DOMAIN_HERE', 'COMPETITOR_DOMAIN_HERE'].forEach(target => {
      const found = results.filter(r => r.domain.includes(target.replace('www.', '')));
      if (found.length > 0) found.forEach(f => console.log(`  ${target}: Position #${f.position} - "${f.title}"`));
      else console.log(`  ${target}: NOT FOUND in results`);
    });
  } catch(err) { console.error('Error:', err.message); } finally { await browser.close(); }
}
main();
```

### scripts/check-technical.js — Homepage Technical Audit

```javascript
// Checks: JSON-LD schema, image alt text, social meta, DOM stats, hreflang
// NOTE: Update the URL below for each client
const { chromium } = require('playwright');
(async () => {
  const TARGET_URL = 'https://www.CLIENT_DOMAIN_HERE/';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  const schemas = await page.evaluate(() => Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => { try { return JSON.parse(s.textContent); } catch(e) { return s.textContent; } }));
  console.log('=== SCHEMA/STRUCTURED DATA ===\n' + JSON.stringify(schemas, null, 2));
  const imgData = await page.evaluate(() => { const imgs = document.querySelectorAll('img'); const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt === ''); return { total: imgs.length, missingAlt: noAlt.length, sampleMissing: noAlt.slice(0, 10).map(i => i.src ? i.src.substring(0, 100) : 'no src') }; });
  console.log('\n=== IMAGE ALT TEXT ===\n' + JSON.stringify(imgData, null, 2));
  const socialMeta = await page.evaluate(() => { const m = {}; document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(el => { m[el.getAttribute('property') || el.getAttribute('name')] = el.getAttribute('content'); }); return m; });
  console.log('\n=== SOCIAL META ===\n' + JSON.stringify(socialMeta, null, 2));
  const perf = await page.evaluate(() => ({ domElements: document.querySelectorAll('*').length, scripts: document.querySelectorAll('script').length, stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length, iframes: document.querySelectorAll('iframe').length, viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'), lang: document.documentElement.lang }));
  console.log('\n=== TECHNICAL ===\n' + JSON.stringify(perf, null, 2));
  const hreflang = await page.evaluate(() => Array.from(document.querySelectorAll('link[hreflang]')).map(l => ({ hreflang: l.getAttribute('hreflang'), href: l.href })));
  console.log('\n=== HREFLANG ===\n' + JSON.stringify(hreflang, null, 2));
  await browser.close();
})();
```

---

## Step 3: Build Keyword List

Generate 25 keywords across 5 categories for the client's industry and location:

1. **Brand terms** (1-2): "{CLIENT_NAME} {LOCATION} {INDUSTRY}"
2. **High-volume terms** (5-6): "{LOCATION} homes/services for sale"
3. **Area-specific terms** (4-5): "{SUBAREA} homes/services for sale"
4. **Intent terms** (5): "buy/sell {SERVICE} {LOCATION}", "{LOCATION} {SERVICE} market"
5. **Long-tail/niche terms** (8-10): "luxury/best/affordable {SERVICE} {LOCATION}"

---

## Step 4: Spawn 6 Parallel Research Agents

Spawn all 6 agents using the Agent tool with `run_in_background: true`. Each gets a `general-purpose` subagent_type.

### Agent 1: keyword-researcher

```
name: "keyword-researcher"
subagent_type: "general-purpose"
run_in_background: true
prompt: |
  You are a keyword research specialist conducting an SEO audit.

  CLIENT SITE: {CLIENT_SITE}
  COMPETITOR SITE: {COMPETITOR_SITE}
  LOCATION: {LOCATION}
  INDUSTRY: {INDUSTRY}

  TASK: Search for each of these 25 keywords using the WebSearch tool and record results.

  KEYWORDS:
  {LIST_ALL_25_KEYWORDS_HERE}

  For EACH keyword search:
  1. Note whether {CLIENT_SITE} appears in organic results and at what position
  2. Note whether {COMPETITOR_SITE} appears and at what position
  3. Record the #1 organic result (domain)
  4. Estimate search volume: Very High / High / Medium / Low
  5. Record any "People Also Ask" questions that appear

  IMPORTANT: Use the WebSearch tool for every keyword. Do NOT use Playwright for Google
  searches — Google will block you with CAPTCHA. WebSearch is the primary tool.
  As a backup only, you may use: node scripts/ddg-search.js "<keyword>"

  After all 25 searches, write seo/research/keyword-research.md containing:
  - Executive summary (how many keywords client ranks for)
  - Full rankings table: #, Keyword, Est. Volume, {CLIENT_SITE} rank, {COMPETITOR_SITE} rank, Top Result
  - Competitor domain frequency analysis (which domains appeared most, categorized by tier)
  - Key local competitors identified with descriptions
  - People Also Ask questions organized by category (content opportunities)
  - Keyword gaps analysis (where client should rank but doesn't)
  - What top competitors are doing right
  - Competitor keyword density observations (which competitors target which keyword clusters)
  - Supporting/LSI keywords discovered during searches (related terms, semantic variations)
  - Recommended priority actions
```

### Agent 2: site-crawler

```
name: "site-crawler"
subagent_type: "general-purpose"
run_in_background: true
prompt: |
  You are a technical SEO analyst conducting a site structure audit.

  CLIENT SITE: {CLIENT_SITE}

  TASK: Crawl the client website and analyze its technical SEO structure.

  Step 1 — Crawl the sitemap:
    node scripts/crawl-sitemap.js {CLIENT_SITE} --analyze

  Step 2 — Check homepage technical details:
    node scripts/check-technical.js
    (If this script doesn't exist or has a different URL hardcoded, create/update it for {CLIENT_SITE})

  Step 3 — Browse key inner pages (run each command):
    node scripts/browse.js {CLIENT_SITE}/about/ --extract-meta --extract-headings --extract-links --extract-text
    node scripts/browse.js {CLIENT_SITE}/contact/ --extract-meta --extract-headings --extract-text
    node scripts/browse.js {CLIENT_SITE}/blog/ --extract-meta --extract-headings --extract-links
    (Plus 5-8 service/community/product pages — pick the most important ones from the sitemap)

  Step 4 — For each analyzed page, extract:
    - Title tag and character count
    - Meta description and character count
    - H1 tags (count and content)
    - H2/H3 structure
    - Word count
    - Image count and missing alt text count
    - Internal link count
    - Canonical tag presence
    - Schema markup presence (JSON-LD)
    - OG tags presence

  Write seo/research/client-site-structure.md with:
  - Sitemap overview (total pages, URL categories, structure analysis)
  - Navigation and internal linking assessment
  - Page-by-page meta tag audit (table format)
  - H1 tag audit (issues flagged)
  - Image alt text analysis (% missing)
  - Schema markup inventory
  - Canonical tag analysis
  - Open Graph / social meta analysis
  - Robots.txt review
  - 20 prioritized technical recommendations with effort/impact ratings
```

### Agent 3: content-auditor

```
name: "content-auditor"
subagent_type: "general-purpose"
run_in_background: true
prompt: |
  You are a content quality analyst conducting a content audit.

  CLIENT SITE: {CLIENT_SITE}
  CLIENT NAME: {CLIENT_NAME}
  COMPANY: {CLIENT_COMPANY}
  LOCATION: {LOCATION}
  GOAL: {GOAL}

  TASK: Audit every major content section of the client website.

  Browse and analyze each section using Playwright:
    node scripts/browse.js {CLIENT_SITE}/ --extract-meta --extract-headings --extract-text
    node scripts/browse.js {CLIENT_SITE}/about/ --extract-meta --extract-headings --extract-text
    node scripts/browse.js {CLIENT_SITE}/[buyers-or-services]/ --extract-meta --extract-headings --extract-text
    node scripts/browse.js {CLIENT_SITE}/[sellers-or-products]/ --extract-meta --extract-headings --extract-text
    (Browse ALL sub-pages under buyer/seller/service sections)
    (Browse 5-8 community/service-area/product pages)
    (Browse ALL blog posts if fewer than 20)
    node scripts/browse.js {CLIENT_SITE}/contact/ --extract-meta --extract-headings --extract-text

  For EACH page assess:
  - Word count of unique content
  - Content quality score (is it unique or template/generic?)
  - Local/industry relevance (does it mention {LOCATION} and specific local details?)
  - CTAs and lead capture elements present
  - Meta data quality (title, description length and relevance)
  - Heading structure (proper H1 > H2 > H3 hierarchy?)

  Write seo/research/content-audit.md with:
  - Executive summary with overall content grade (A through F, with +/-)
  - Page-by-page analysis (every major page gets its own section with issues table)
  - Sitewide content issues (meta data quality, content depth, keyword optimization)
  - Keyword density analysis per page (what terms are used, frequency, supporting keywords present)
  - Content gaps analysis (what's missing vs what competitors likely have)
  - Lead generation / conversion assessment (forms, CTAs, lead magnets)
  - Prioritized content recommendations (immediate fixes, short-term, medium-term, long-term)
  - Competitive content gaps table (content type | have it? | priority)
```

### Agent 4: competitor-analyzer

```
name: "competitor-analyzer"
subagent_type: "general-purpose"
run_in_background: true
prompt: |
  You are a competitive intelligence analyst.

  CLIENT SITE: {CLIENT_SITE}
  PRIMARY COMPETITOR: {COMPETITOR_SITE}
  LOCATION: {LOCATION}
  AUTO-DISCOVER: {AUTO_COMPETITORS}

  TASK: Analyze the client's competitors in depth.

  For EACH competitor (start with {COMPETITOR_SITE}, then add 2-3 more top local competitors
  if AUTO-DISCOVER is yes — find them via WebSearch for "{LOCATION} {INDUSTRY}"):

  Step 1 — Crawl their sitemap:
    node scripts/crawl-sitemap.js {COMPETITOR_DOMAIN}

  Step 2 — Analyze their homepage:
    node scripts/browse.js {COMPETITOR_URL} --extract-meta --extract-headings --extract-links --extract-text

  Step 3 — Analyze 3-5 inner pages:
    - A community/service-area page
    - A blog post (preferably their best/longest one)
    - Their about page
    - A product/property type page if it exists

  Step 4 — Check their schema markup:
    Create a quick script or use browse.js to check for JSON-LD on their pages.

  Step 4 — For each competitor, analyze keyword strategy:
    - What primary keywords do their title tags target?
    - What keyword patterns appear across their H1/H2 tags?
    - Estimate keyword density on their top community pages (count occurrences of target terms)
    - Identify supporting/LSI keywords they use (semantic clusters)
    - What long-tail keywords do their blog posts target?

  For each competitor document:
  - Site structure (total pages, blog post count, community/service pages, resources)
  - Content strategy (blog frequency, content depth, content types)
  - Meta optimization (title format, description quality, H1 usage)
  - Keyword strategy (primary keywords, supporting keywords, keyword density patterns)
  - Schema markup (present or not, what types)
  - Internal linking strategy
  - Lead capture and conversion elements
  - What they do BETTER than {CLIENT_SITE}
  - What {CLIENT_SITE} does better (be fair)

  Write seo/research/competitor-analysis.md with:
  - Executive summary table (all competitors vs client side-by-side)
  - Per-competitor deep dive sections
  - Cross-competitor comparison tables (content volume, technical SEO, platform, keyword targeting)
  - Keyword strategy comparison (which competitors target which keywords, supporting keyword clusters)
  - Unique strategies worth noting
  - Lessons and prioritized recommendations for {CLIENT_SITE}
  - Bottom line summary
```

### Agent 5: best-practices-researcher

```
name: "best-practices-researcher"
subagent_type: "general-purpose"
run_in_background: true
prompt: |
  You are an SEO research specialist. Research current {YEAR} SEO best practices.

  INDUSTRY: {INDUSTRY}
  LOCATION TYPE: {LOCATION_TYPE} (local service business)

  TASK: Use WebSearch to research the latest SEO best practices across these 10 topics:

  1. Google algorithm updates and ranking factors for {YEAR}
  2. AI Overviews / SGE optimization — how to get cited, optimal content formats
  3. E-E-A-T signals — how to demonstrate experience, expertise, authoritativeness, trust
  4. Schema markup best practices — which types matter most, validation tools
  5. Content quality standards — optimal word counts, semantic completeness, freshness signals
  6. Local SEO for {INDUSTRY} — Google Business Profile, NAP consistency, local citations
  7. Core Web Vitals and page speed — current thresholds, impact on rankings
  8. Link building strategies — what works now, what's penalized
  9. Mobile-first indexing requirements — current standards
  10. {INDUSTRY}-specific SEO trends — what's working for top performers

  For each topic provide:
  - Current best practice (what to do)
  - What changed recently (vs prior year)
  - Actionable recommendations for a local {INDUSTRY} website

  IMPORTANT: First read the existing file at ../../docs/seo-best-practices-{YEAR}.md.
  If it exists and was updated within the last 30 days, skip the research and just confirm it is current.
  If it is stale or missing, do the full research and write/update the file.

  Write ../../docs/seo-best-practices-{YEAR}.md with all 10 topics covered in detail.
  This file is shared across all clients and serves as the baseline standard against which
  all audit findings and deliverables will be measured.
```

### Agent 6: backlink-researcher

```
name: "backlink-researcher"
subagent_type: "general-purpose"
run_in_background: true
prompt: |
  You are a backlink and link profile research specialist.

  CLIENT SITE: {CLIENT_DOMAIN}
  COMPETITORS: {COMPETITOR_DOMAINS_COMMA_SEPARATED}
  LOCATION: {LOCATION}

  TASK: Research backlink profiles for client and competitors.

  Step 1 — Fetch DataForSEO backlink data (if DFS scripts exist):
    Check if DFS backlink scripts exist in the client scripts/ folder or in
    platform/scripts/run_backlink_analysis.py. If available, run them to fetch:
    - Up to 500 individual backlinks sorted by domain rating
    - Up to 200 referring domains
    - Domain metrics for client + all competitors
    Output: seo/research/client-backlinks.json with this structure:
    {
      "meta": { "script": "client_backlinks", "target": "domain.com", "backlinks_count": N, "referring_domains_count": N },
      "backlinks": [{ "source_url", "target_url", "anchor_text", "domain_rating", "is_dofollow", "first_seen" }, ...],
      "referring_domains": [{ "domain", "rank", "backlinks", "first_seen", "dofollow", "referring_pages" }, ...]
    }
    The HTML report generator auto-populates the full backlink inventory table
    from this file (grouped by referring domain, with expand/collapse and pagination).

  Step 2 — Supplement with WebSearch research:
    - "{CLIENT_DOMAIN} backlinks"
    - "site:{CLIENT_DOMAIN}" (indexed pages)
    - "{CLIENT_NAME}" "{LOCATION}" real estate (brand mentions)
    - "{CLIENT_COMPANY_NAME}" mentions/citations

  Step 3 — WebSearch for competitor backlink profiles:
    - "{COMPETITOR_DOMAIN} backlinks" (for each competitor)

  Step 4 — Check local citations and directories:
    - "{CLIENT_NAME}" realtor profile
    - {CLIENT_DOMAIN} zillow OR realtor.com OR homes.com
    - "{LOCATION} real estate agents directory"
    - "{LOCATION} Chamber of Commerce real estate"
    - Local Board of Realtors

  Step 5 — Check referring domain quality:
    - .edu or .gov backlinks?
    - Local news mentions (local papers, radio)?
    - Industry publication mentions (Inman, RealTrends)?
    - Social media profiles linking back?

  Step 6 — Analyze competitor link-building strategies:
    - Directories/citations competitors have that client doesn't
    - Press coverage or news mentions
    - Guest post opportunities

  Step 7 — Build backlink-opportunities.json for the report:
    Using data from Steps 1-6, create seo/research/backlink-opportunities.json:
    {
      "opportunities": [
        {
          "domain": "yellowpages.ca",
          "dr": 72,
          "clientHas": false,
          "competitors": ["competitor1.com", "competitor2.com"],
          "score": 96,
          "type": "directory|social|press|industry|blog|forum|government|educational|other",
          "localRelevance": "local|national|international",
          "effort": "easy|medium|hard"
        }
      ],
      "similarityPairs": [
        { "a": "client.com", "b": "competitor1.com", "pct": 12 }
      ]
    }

    Rules for building opportunities:
    - Include every referring domain found across competitors that the client doesn't have
    - Also include domains the client already has (set clientHas: true)
    - score: 0-100 based on (DR weight * 0.4) + (competitor overlap count / total competitors * 0.6) * 100
    - type classification: match domain against known patterns:
      - "directory": yellowpages, yelp, bbb, 411, canpages, foursquare, mapquest, etc.
      - "social": facebook, instagram, linkedin, twitter, pinterest, youtube, etc.
      - "press": news sites, herald, sun, globalnews, cbc, etc.
      - "industry": realtor.ca, zillow, remax, royallepage, crea, mls, etc.
      - "blog": blogto, medium, wordpress blogs, etc.
      - "forum": reddit, forums, community boards
      - "government": .gc.ca, .gov domains
      - "educational": .edu domains
      - "other": anything that doesn't match above
    - localRelevance: "local" if domain contains city/region name or is a known local site,
      "national" if it's a Canadian-wide site, "international" otherwise
    - effort: "easy" for directories/listings/social profiles (self-submit),
      "medium" for industry sites requiring outreach/application,
      "hard" for press/earned media requiring content or PR
    - similarityPairs: for each pair of (client + competitors), estimate overlap %
      based on shared referring domains found. If DFS intersection data is available,
      use exact numbers. Otherwise estimate from research.
    - Sort opportunities by score descending
    - Cap at 200 opportunities max

  Write seo/research/backlink-analysis.md with:
  - Executive summary (client's estimated link authority vs competitors)
  - Client backlink profile assessment (referring domains, citations, social, mentions)
  - Competitor backlink comparison table
  - Citation gap analysis
  - Link building opportunities (quick wins, medium-term, long-term)
  - 30 specific link building actions with priority and effort
  - Local citation checklist (specific directories to submit to)
```

---

## Step 5: Monitor Research Agents

Check on agents periodically:
- Read each seo/research/ file as it appears
- If an agent is idle >5 minutes with no output file created, spawn a replacement agent with the same prompt
- When all 6 results files exist and are complete, proceed to Step 6
- Expected files: keyword-research.md, client-site-structure.md, content-audit.md, competitor-analysis.md, seo-best-practices-{YEAR}.md, backlink-analysis.md, backlink-opportunities.json

---

---

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

### Organic metrics — DFS fallback for GSC (estimated organic keywords + traffic):
```bash
node scripts/gather-organic-metrics.js {CLIENT_DOMAIN} {COMPETITOR_DOMAINS_SPACE_SEPARATED}
```
Output: `seo/research/organic-metrics.json`

Note: Only run when Google Search Console is not connected. This provides estimated organic keywords and traffic using DataForSEO Labs data.

### Backlink inventory (DataForSEO, API key only):
```bash
node scripts/gather-backlinks.js {CLIENT_DOMAIN} {COMPETITOR_DOMAINS_SPACE_SEPARATED} --limit 200
```
Output: `seo/research/client-backlinks.json` + `seo/research/backlinks-{competitor-domain}.json`

### Keyword volumes (DataForSEO, API key only):
```bash
node scripts/gather-keyword-volumes.js --from-audit seo/audit-data.json
```
Output: `seo/research/keyword-volumes.json`

### Page text analysis (Playwright, no auth):
```bash
node scripts/extract-text.js --limit 50
```
Output: `seo/research/page-text-analysis.json`

### Local SEO data (public web research, no auth needed):
```bash
node scripts/gather-local-seo.js --domain {CLIENT_DOMAIN} --name "{CLIENT_NAME}" --location "{LOCATION}"
```
Output: `seo/research/local-seo.json`

Note: This gathers NAP from the client website and checks directory presence (Yelp, BBB, Facebook, etc.). If the client has GBP API access configured in `client-config.json`, `build_audit.py` will use `BusinessProfileConnector` for full GBP data (reviews, ratings, hours) instead.

### Local Pack tracking (DataForSEO, ~$0.05 for 25 keywords):
```bash
node scripts/gather-local-pack.js --from-audit seo/audit-data.json --location 2840
```
Output: `seo/research/local-pack-data.json`

Checks if the client business appears in Google's Local Pack (map pack) for each tracked keyword. Uses client.name from audit-data.json for fuzzy matching.

**Verify all files exist before proceeding:**
```bash
ls -lh seo/research/{pagespeed-data,domain-metrics,organic-metrics,client-backlinks,keyword-volumes,page-text-analysis,local-seo,local-pack-data}.json seo/research/backlinks-*.json
```
## Step 5.6: Auto-Populate audit-data.json from Research

Extract structured data from research Markdown files into audit-data.json:

```bash
cd "{CLIENT_DIR}"
node scripts/populate-audit-data.js
```

This parses keyword-research.md, competitor-analysis.md, and FINAL-AUDIT-REPORT.md to populate: `keywords[]`, `competitorComparison[]`, `competitorStrategies[]`, `siteComparison[]`, `contentCalendar`, and `advantages[]`.

Only populates fields that are empty/missing — won't overwrite manually entered data. Run with `--force` to overwrite existing data.



## Step 5.7: Run Python Audit Pipeline

After all data-gathering scripts complete, run the Python audit orchestrator to populate remaining data fields:

```bash
cd "{CLIENT_DIR}"
python "../../platform/scripts/build_audit.py" \
  --type seo \
  --domain {CLIENT_DOMAIN} \
  --competitors {COMPETITOR_DOMAINS_COMMA_SEPARATED} \
  --research-dir seo/research \
  --output seo/audit-data.json \
  --client-config client-config.json
```

This runs 10 Python analyzers that populate: `contentQuality`, `technicalSeo` (meta tags, schema, crawl issues), `internalLinking` (full graph analysis), `backlinks` (if DFS credentials available), `competitorAnalysis`, `localSeo`, `indexationCrawlability`, `eeatSignals`, `contentGap`, and `reportingIntelligence` (which auto-generates `topIssues`, `quickWins`, `actionPlan`, and the overall grade).

If `--skip-api` is passed, only the non-API analyzers run (content_quality, internal_linking, technical_seo, local_seo, indexation, eeat, reporting).

## Step 5.8: Rank Tracking Baseline (Optional, ~$0.05 DFS cost)

Ask the user: "Would you like to establish a rank tracking baseline? This checks current SERP positions for all 25 target keywords (~$0.05 in DFS credits)."

If yes:
```bash
cd "{CLIENT_DIR}"
python "../../platform/scripts/run_rank_tracker.py" \
  --domain {CLIENT_DOMAIN} \
  --competitors {COMPETITOR_DOMAINS_COMMA_SEPARATED} \
  --keywords seo/research/keyword-research.md \
  --history seo/research/rank-history.json \
  --label "Audit Baseline {DATE}" \
  check
```

Then inject into audit-data.json:
```bash
python "../../platform/scripts/run_rank_tracker.py" \
  --history seo/research/rank-history.json \
  --output seo/audit-data.json \
  inject
```

## Step 6: Compile Final Report

Spawn a report compilation agent:

```
name: "report-compiler"
subagent_type: "general-purpose"
run_in_background: true
prompt: |
  You are a senior SEO strategist compiling a master audit report.

  CLIENT: {CLIENT_NAME} at {CLIENT_COMPANY}
  SITE: {CLIENT_SITE}
  LOCATION: {LOCATION}
  GOAL: {GOAL}

  TASK: Read ALL research files and compile a comprehensive, client-ready audit report.

  READ THESE FILES FIRST:
  - seo/research/keyword-research.md
  - seo/research/client-site-structure.md
  - seo/research/content-audit.md
  - seo/research/competitor-analysis.md
  - seo/research/backlink-analysis.md
  - ../../docs/seo-best-practices-{YEAR}.md

  Write seo/reports/FINAL-AUDIT-REPORT.md with these sections:

  ## Executive Summary
  - Overall site health grade (A-F with +/-)
  - Top 5 most critical issues (numbered, with brief explanation of each)
  - One paragraph overview of the site's current state

  ## Section 1: Search Visibility Assessment
  - Current keyword rankings summary table
  - High-value keyword opportunities (critical, strategic, long-tail)
  - Competitive landscape overview (tier 1/2/3 competitors with appearance counts)

  ## Section 2: Technical SEO Issues
  - Critical issues (fix immediately)
  - High priority issues
  - Medium priority issues
  - Each issue: what it is, why it matters, how to fix it

  ## Section 3: Content Assessment
  - Content depth analysis with word count comparisons
  - Content quality analysis (unique vs generic/template)
  - Blog assessment
  - Specific content gaps

  ## Section 4: Competitor Benchmarking
  - Side-by-side comparison table (client vs all competitors)
  - What competitors do better (numbered list)
  - What client does better (be fair)

  ## Section 5: Backlink & Link Profile Analysis
  - Client backlink profile summary
  - Competitor backlink comparison table
  - Citation gap analysis
  - Link building opportunity roadmap (quick wins, medium-term, long-term)

  ## Section 6: Lead Capture & Conversion Analysis
  - Current lead capture inventory by page type
  - Missing conversion elements
  - Recommendations

  ## Section 7: Prioritized Action Plan (45 items)
  - Quick Wins (Week 1-2): ~10 items, low effort, high impact — table with #, Action, Why, Effort, Impact
  - Short-Term (Month 1-2): ~10 items, medium effort — same table format
  - Medium-Term (Month 2-4): ~13 items, higher effort — same table format
  - Long-Term (Month 4+): ~12 items, ongoing strategy — same table format

  ## Section 8: Content Calendar
  - Month 1-3 blog topics (weekly, with target keyword and type)
  - Community/service page expansion plan (prioritized list with current vs target word counts)
  - Market report schedule (monthly, quarterly, annual)

  ## Appendices
  - A: Full keyword research data (25-row table)
  - B: People Also Ask questions (organized by category)
  - C: Competitor domain frequency data (all domains found, by tier)

  TARGET: 600-800 lines. Comprehensive but actionable. Every issue includes a "fix" recommendation.
```

---

## Step 7: Generate Implementation Deliverables

### If user chose dual-route (Claude + Codex via /smart-team):
Invoke `/smart-team` and create 4 implementation tasks, each routed through both Claude and Codex. Add a review task and a verify task. Let smart-team handle the agent spawning and routing.

### If user chose single-route (Claude only):
Spawn 4 `claude-implementer` agents in parallel:

#### Implementation Agent: meta-tags

```
name: "meta-tags-writer"
subagent_type: "claude-implementer"
run_in_background: true
prompt: |
  Read these files:
  - seo/reports/FINAL-AUDIT-REPORT.md
  - seo/research/client-site-structure.md
  - seo/research/keyword-research.md

  Create optimized meta titles and descriptions for EVERY page on {CLIENT_SITE}.

  Requirements:
  - Title: 50-60 characters, include primary keyword + brand name
  - Description: 120-155 characters, include {LOCATION} + CTA + unique value proposition
  - Show explicit character count in parentheses for EVERY entry
  - Fix any corrupted/stuffed meta tags identified in the audit
  - Write unique descriptions for all community/service pages (no templates)
  - Include implementation notes section at the end

  Format as markdown table: URL | Current Title | New Title (chars) | New Description (chars)
  Group by page type (homepage, about, buyer pages, seller pages, community pages, blog, etc.)

  Write to: seo/content/meta-tags.md
```

#### Implementation Agent: schema-markup

```
name: "schema-writer"
subagent_type: "claude-implementer"
run_in_background: true
prompt: |
  Read these files:
  - seo/reports/FINAL-AUDIT-REPORT.md
  - ../../docs/seo-best-practices-{YEAR}.md

  Create production-ready JSON-LD schema markup for {CLIENT_SITE}.

  CLIENT: {CLIENT_NAME}
  COMPANY: {CLIENT_COMPANY}
  ADDRESS: (use data from site crawl or ask)
  PHONE: (use data from site crawl or ask)

  Create these schema blocks:
  1. Homepage: Organization + RealEstateAgent (or industry equivalent) + WebSite + SearchAction — in a single @graph
  2. Homepage: Person schema for each team member linked via member/sameAs
  3. About page: Person x2 + industry agent schema with member links
  4. Contact page: LocalBusiness + ContactPoint + GeoCoordinates + OpeningHoursSpecification
  5. Community/service page template: Article + BreadcrumbList (with 2 filled examples)
  6. Blog post template: BlogPosting + BreadcrumbList + ImageObject (with 1 filled example)
  7. Buyer/service FAQ: FAQPage with 5+ Q&A pairs using REAL local data from audit
  8. Seller FAQ: FAQPage with 4+ Q&A pairs using REAL local data
  9. AggregateRating for reviews section (with warning to update to real data)

  Rules:
  - Use consistent @id URIs across ALL schemas (e.g., https://{CLIENT_SITE}/#org, /#person-name)
  - Use www prefix consistently if site redirects to www
  - Include sameAs links for social profiles (note which need verification)
  - Include implementation checklist with priority order
  - Validate against schema.org standards
  - No deprecated patterns

  Write to: seo/content/schema-markup.md
```

#### Implementation Agent: community-pages

```
name: "community-writer"
subagent_type: "claude-implementer"
run_in_background: true
prompt: |
  Read these files:
  - seo/reports/FINAL-AUDIT-REPORT.md
  - seo/research/content-audit.md
  - seo/research/competitor-analysis.md

  Write 4 expanded community/service-area pages for {CLIENT_SITE}.
  Pick the top 4 communities/areas from the audit's priority list.

  Each page must be 1,000-1,500 words with these sections:
  - Meta title (50-60 chars with count) + meta description (120-155 chars with count)
  - H1 tag
  - Overview (2-3 paragraphs introducing the area)
  - Location & Access
  - Property Types & Price Ranges (or service types)
  - Lifestyle & Amenities
  - Schools & Family (if applicable)
  - Dining & Shopping nearby
  - "Why Buy/Choose [Area]" section
  - FAQ section (4 Q&As targeting "People Also Ask" for AI Overview optimization)
  - Internal link suggestions (list 4-6 pages to link to/from)
  - CTA: "Interested in [Area]? Contact {CLIENT_NAME}" with link to /contact/

  Voice: Luxury, authoritative, locally knowledgeable (match {CLIENT_COMPANY} brand).
  Include SPECIFIC price ranges, neighborhood details, and local data from the audit findings.

  Write to: seo/content/community-pages.md
```

#### Implementation Agent: blog-posts

```
name: "blog-writer"
subagent_type: "claude-implementer"
run_in_background: true
prompt: |
  Read these files:
  - seo/reports/FINAL-AUDIT-REPORT.md
  - seo/research/keyword-research.md
  - seo/research/content-audit.md

  Write the first 4 SEO-optimized blog posts from the content calendar.

  Posts to write:
  1. "{LOCATION} Real Estate Market Report: [Season] {YEAR}" — target keyword: "{LOCATION} real estate market"
  2. "The Best Neighborhoods in {LOCATION} ({YEAR} Guide)" — target: "best neighborhoods {LOCATION}"
  3. "Is {LOCATION} Real Estate a Good Investment? What the Data Says" — target: "{LOCATION} real estate investment"
  4. "{LOCATION} [Specialty] Guide: Communities, Prices, and What to Expect" — target: "{LOCATION} [specialty] for sale"

  Each post: 900-1,200 words with:
  - Meta title (50-60 chars with count) + meta description (120-155 chars with count)
  - H1 tag (matches title)
  - H2/H3 heading structure (at least 4-5 H2 sections per post)
  - Internal links to community pages and service pages (4-6 per post)
  - FAQ / Q&A section at end (3-4 questions from "People Also Ask" for AI Overview)
  - Author byline: {CLIENT_NAME}
  - CTA at end: "Questions about {LOCATION}? Contact {CLIENT_NAME}" with /contact/ link

  Voice: Expert, data-informed, locally authoritative.
  Include specific price ranges, neighborhood names, and market data from audit findings.
  Both team members should be credited if it's a team.

  Write to: seo/content/blog-posts.md
```

### Review Agent (spawn after implementation completes)

```
name: "reviewer"
subagent_type: "code-reviewer"
run_in_background: true
prompt: |
  Review all deliverables in the seo/content/ directory against the audit findings
  and best practices baseline.

  Read these reference files:
  - seo/reports/FINAL-AUDIT-REPORT.md
  - ../../docs/seo-best-practices-{YEAR}.md
  - seo/research/keyword-research.md

  Then review each deliverable:
  - seo/content/meta-tags.md
  - seo/content/schema-markup.md
  - seo/content/community-pages.md
  - seo/content/blog-posts.md

  Score each on 4 dimensions (1-10):
  - SEO Optimization: keyword targeting, character compliance, technical correctness
  - Content Quality: accuracy, depth, brand voice, uniqueness
  - Actionability: ease of deployment, clear instructions, minimal editing needed
  - {YEAR} Compliance: E-E-A-T signals, AI Overview optimization, no deprecated patterns

  Only flag issues at 80%+ confidence. For each issue note: confidence level, file, line,
  what's wrong, and how to fix it.

  If dual-routed (Claude vs Codex files exist), do a head-to-head comparison
  and declare a winner per deliverable with reasoning.

  Write to: seo/content/REVIEW.md (or seo/content/REVIEW-claude-vs-codex.md if dual)
```

### Verification Agent (spawn after review)

```
name: "verifier"
subagent_type: "product-verifier"
run_in_background: true
prompt: |
  Verify that all deliverables match the requirements from the audit report.

  Read:
  - seo/reports/FINAL-AUDIT-REPORT.md (the requirements source)
  - seo/content/REVIEW.md (reviewer findings)
  - All deliverable files in seo/content/

  Check:
  1. Do the meta tags cover ALL pages found in the sitemap?
  2. Does the schema markup include all required types (Organization, Person, LocalBusiness, FAQ, Article, BlogPosting, BreadcrumbList, AggregateRating)?
  3. Do community pages meet the 1,000+ word minimum?
  4. Do blog posts target the keywords identified in the audit?
  5. Do all deliverables include FAQ sections for AI Overview optimization?
  6. Are there any factual errors (wrong prices, wrong community descriptions)?
  7. Are all meta descriptions within 120-155 characters?
  8. Are all meta titles within 50-60 characters?

  Report: PASS / FAIL per deliverable with specific findings.
  List any items that need client verification before publishing.

  Write findings as a message to the team lead (or to seo/content/VERIFICATION.md).
```

---

## Step 8: Populate audit-data.json and Generate Client Deliverables

After all deliverables are complete and reviewed, Claude does this automatically — no manual steps needed.

### Step 8a: Populate audit-data.json

Read ALL research files and fill in `seo/audit-data.json` (the template is already in the client folder from Step 1). Use the Edit tool to update every field with real audit data:

**Read these files to extract data:**
- `seo/reports/FINAL-AUDIT-REPORT.md` → client info, grade, top issues, action plan, content calendar, advantages, next steps
- `seo/research/keyword-research.md` → keywords array (all 25 with rankings)
- `seo/research/client-site-structure.md` → site comparison metrics, key stats
- `seo/research/competitor-analysis.md` → competitor names/domains, comparison table, strategies
- `seo/research/content-audit.md` → content gaps, deliverable scores
- `seo/research/backlink-analysis.md` → backlink profile, citation gaps, link building plan
- `seo/content/REVIEW.md` → deliverable quality scores and status

**Fields to populate in audit-data.json:**
- `client.*` — website, name, company, platform, date, grade, location, address (physical address for map pin)
- `competitor.*` — primary competitor, all competitors array
- `topIssues[]` — top 5 from the final report
- `siteComparison[]` — multi-competitor gap analysis (use comp1..compN keys matching competitor.all order, not a single "competitor" key)
- `keyStats[]` — 6 headline stats with severity (red/orange/green)
- `keywords[]` — all 25 keywords with volume, client rank, competitor rank, top result
- `competitorComparison[]` — side-by-side metrics
- `competitorStrategies[]` — what competitors do right
- `quickWins[]` — week 1-2 actions from action plan
- `actionPlan.*` — all 4 phases (quickWins, shortTerm, mediumTerm, longTerm)
- `contentCalendar.*` — 3 months of blog topics
- `deliverables[]` — name, scope, score, status for each deliverable created
- `keyPagesCreated[]` — list of community/service pages written
- `blogPostsCreated[]` — list of blog posts written
- `advantages[]` — competitive advantages
- `nextSteps[]` — 5 recommended next actions
- `pillars[]` — 4-pillar strategy summary
- `mediumTermRoadmap[]` — month 2-4 items
- `longTermColumns[]` — 4 columns for long-term slide
- `localSeo.businessProfile` — **REQUIRED for the local page map.** Must include `latitude`, `longitude`, `name`, `address`, `phone`. Get lat/lng from the client's physical address. If GBP access exists, also include `rating`, `reviewCount`, `gbpVerified: true`
- `localSeo.competitorLocations[]` — array of `{ name, domain, lat, lng }` for map pins. Use approximate city-center coordinates for each competitor based on their listed office address
- `localSeo.searchDemandZones[]` — array of `{ lat, lng, radius, label, volume, color, opacity }` for heat circles on the map. Place over key service-area neighbourhoods/communities. Use red (#ef4444) for Very High, orange (#f97316) for High, yellow (#eab308) for Medium, green (#22c55e) for Low
- `localSeo.serviceAreaMap` — GeoJSON FeatureCollection with a Point (business location) and a Polygon (service area boundary). The map renderer reads center coordinates from the Point feature
- `localSeo.accessNotes` — `{ gbpAccess, gaAccess, searchConsoleAccess, note }` documenting what data sources are/aren't available

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

**Fields auto-populated by the HTML report generator (do NOT populate manually):**
The multipage report generator (`generate-multipage-report.js`) auto-derives these from sibling research files during Step 8b. Just make sure the research files exist:
- `technicalSeo.pageAudits[]` — auto-populated from `seo/research/crawl-data.json`
- `technicalSeo.lighthouseResults[]` — auto-populated from `seo/research/pagespeed-data.json`
- `coreWebVitals` — hoisted and normalized from `technicalSeo.coreWebVitals`
- `pageSpeedComparison[]` — prefers `competitorAnalysis.pageSpeedComparison` (per-domain scores); detects and skips stale `technicalSeo.pageSpeedComparison` if all entries have identical scores. Converts `{domain, mobileScore, desktopScore}` → `{name, score}`
- `internalLinking` summary stats (total_pages, total_internal_links, avg_inbound_links, avg_outbound_links, orphan_count, orphan_rate, orphans[]) — auto-derived from `seo/research/link-graph.json`
- `internalLinking.hubClusters[]` — auto-derived from `seo/research/link-graph.json`
- `domainMetrics` — auto-populated from `backlinks.competitorDomainMetrics`, `competitorAnalysis.domainMetricsComparison`, or `seo/research/domain-metrics.json`. Normalizes field names (domain_rating → domainRating, etc.)
- `competitorComparison[]` column normalization — if rows use domain names as keys (e.g. "justinhavre", "kirbycox") instead of comp1..compN, the generator auto-maps them and populates `competitor.all` for label resolution
- `backlinks.topBacklinks[]` — auto-populated with ALL backlinks from `seo/research/client-backlinks.json` (replaces the limited subset in audit-data.json). Grouped by referring domain in the HTML report with expand/collapse and 25-per-page pagination
- `backlinks.topReferringDomains[]` — auto-populated from `seo/research/client-backlinks.json` referring_domains array
- `contentQuality.pages[].readability.syllablesPerWord` — enriched from `seo/research/page-text-analysis.json` (avgSyllablesPerWord). Also backfills avgSentenceLength and sentenceCount if missing. Displayed in the Readability Analysis table alongside the readability score and word count

**Data quality rules enforced by the generator:**
- Stale PageSpeed data (all competitors showing identical scores) is detected and replaced with `competitorAnalysis` version
- `client.platform` must match the actual site platform from crawl research (e.g. "Sierra Interactive", not "RealtyPress")
- `siteComparison` values should be numeric for chart rendering — avoid qualitative values like "Limited" or "Strong"
- All competitor data should be cross-referenced against `seo/research/competitor-analysis.md` before populating
- `localSeo.businessProfile` MUST have `latitude` and `longitude` — without these the service area map shows an error instead of rendering. Get coordinates from the client's physical address
- `localSeo.competitorLocations` and `searchDemandZones` are optional but strongly recommended for a complete local page

### Step 8b: Generate Client Deliverables (Excel + PowerPoint + HTML Report)

The generator scripts are already in the template. Run all three:

```bash
node scripts/generate-spreadsheet.js
node scripts/generate-presentation.js
node ../../template/reports/multipage/generate-multipage-report.js --data seo/audit-data.json --output seo/reports/multipage --inline
```

### Generate multipage HTML report (local client folder):
```bash
cd reports/multipage && node generate-multipage-report.js
```
Output: `seo/multipage-report-{CLIENT_SLUG}-{DATE}/` — 9 HTML pages + assets

### Quick validation:
```bash
cd seo/multipage-report-*/ && python3 -m http.server 8080
```
Open http://localhost:8080 and verify all 9 pages render.

Or: `npm run generate`

**Output:**
- `seo/reports/SEO-Audit-GamePlan.xlsx` — 6-sheet Excel workbook
- `seo/reports/SEO-Audit-Presentation.pptx` — 15-slide PowerPoint
- `seo/reports/multipage/` — 8-page interactive HTML report (index, keywords, content, technical, links, competitors, local, action-plan)

The generators read from `seo/audit-data.json` — no hardcoded data, no manual editing needed. The multipage report generator auto-normalizes the data shape (CWV, PageSpeed, page audits, internal linking, domain metrics, competitor columns) and auto-populates missing sections from sibling research files (`research/crawl-data.json`, `research/pagespeed-data.json`, `research/link-graph.json`, `research/domain-metrics.json`).

**HTML report features:**
- Competitive Gap Analysis: multi-competitor log-scale grouped bar chart + gap breakdown table (replaces old radar chart that collapsed when client was far behind)
- Sticky metric columns on all wide competitor tables for horizontal scroll readability
- Hub & spoke cluster visualization derived from link graph
- Core Web Vitals gauges, PageSpeed comparison, and site structure overview on technical page
- Data-driven service area map: reads business location, competitor pins, and search demand hotspots from `localSeo` — no hardcoded coordinates. GeoJSON service area polygon rendered as overlay. Sections 1-3 and 5 (GBP, performance, citations, map pack) auto-populate when GBP/GA/GSC access is available
- Table filters on all data tables: text search, dropdown filters (badge, unique-value, and numeric range types), row counts, and "Clear all" reset. Filters are hidden during print. Key filters: readability score ranges, word count ranges, DR ranges, dofollow/nofollow, schema presence, crawl status codes, impact/effort badges
- Readability Analysis table shows Readability Score, Syllables/Word (enriched from page-text-analysis.json), and Word Count — hover any row for the full readability explanation
- Backlink Inventory: grouped by referring domain, sorted by DR, expand/collapse for multi-link domains, 25-per-page pagination with DR range and dofollow/nofollow filters
- Content Calendar: table layout with Week, Topic, Target Keyword, and Type columns
- "What does this mean?" floating explainer widget: tracks the current section via scrollspy and shows plain-English explanations with actionable tips. Updates reliably during fast scrolling and nav clicks (uses topmost-visible-section algorithm, not naive last-intersecting)
- Side navigation scrollspy: highlights the current section in the left nav, synced with the explainer. Both use the same topmost-visible-section tracking for consistent behavior

---

## Step 9: Final Delivery

Present to user:
- List all files created with sizes
- Summarize key findings (grade, keyword visibility, top gaps)
- Highlight ready-to-deploy deliverables and their quality scores
- Note any items needing client verification before publishing
- Confirm spreadsheet, presentation, and interactive HTML report are ready for client Zoom
- Provide the local path to `seo/reports/multipage/index.html` for browser preview

---

## Process Notes & Lessons Learned

1. **WebSearch over Playwright for keywords** — Google blocks Playwright with CAPTCHA. Always use WebSearch tool first. DuckDuckGo via Playwright is the backup.
2. **Agents get stuck** — Spawn replacements after 5 min of no output. Don't wait.
3. **Ahrefs MCP needs paid account** — Check `subscription-info-limits-and-usage` first. If it fails, skip Ahrefs entirely and use WebSearch + Playwright for all data.
4. **FAQ blocks on every content page** — Critical for AI Overview optimization. Every community page and blog post should include a FAQ section with 3-5 Q&As.
5. **Dual-route produces best quality** — Claude wins technical precision (schema, meta); Codex wins AI optimization (FAQ blocks, structured Q&A). Use hybrid of both for best results.
6. **Spreadsheet/PPT auto-generated from audit-data.json** — Claude populates audit-data.json from research results, then `npm run generate` creates both files. No manual data entry needed.
7. **Community pages need 1,000+ words** — Under 500 words won't compete. Include: overview, property types, price ranges, schools, dining, lifestyle, FAQ, CTA.
8. **Smart-team is a separate tool** — If user wants dual Claude/Codex routing, invoke `/smart-team` for Step 7. Do NOT modify or merge smart-team into this skill.
9. **Backlink research without Ahrefs** — Use WebSearch + WebFetch with free backlink checkers. Focus on citation gaps, directory submissions, local mentions, and competitor link strategies. This is Agent 6.
10. **Competitor keyword density analysis** — Agent 4 now includes keyword density estimation and supporting/LSI keyword identification. Count target term occurrences in page text and map semantic clusters per competitor.
11. **Supporting keywords (LSI)** — Related terms that strengthen topical relevance. For real estate: if primary is "Park City homes for sale", supporting terms include "ski-in ski-out", "Deer Valley", "Summit County", "mountain homes", etc. Both keyword researcher and content auditor should identify and report these.
12. **Dual-route benchmarking** — When using both Claude + Codex, first have both propose scoring criteria independently, then merge into a unified rubric before implementation begins. This prevents bias toward either LLM's strengths.

---

## Complete Output Inventory

```
seo/research/
  keyword-research.md
  client-site-structure.md
  content-audit.md
  competitor-analysis.md
  seo-best-practices-YYYY.md
  backlink-analysis.md
  keyword-data.json

seo/reports/
  FINAL-AUDIT-REPORT.md
  SEO-Audit-GamePlan.xlsx
  SEO-Audit-Presentation.pptx

seo/content/
  meta-tags.md                  (or claude-meta-tags.md + codex-meta-tags.md if dual)
  schema-markup.md              (or claude-schema-markup.md + codex-schema-markup.md)
  community-pages.md            (or claude-community-pages.md + codex-community-pages.md)
  blog-posts.md                 (or claude-blog-posts.md + codex-blog-posts.md)
  REVIEW.md                     (or REVIEW-claude-vs-codex.md if dual)
  VERIFICATION.md

scripts/
  browse.js
  crawl-sitemap.js
  ddg-search.js
  check-technical.js
  generate-spreadsheet.js       (reads seo/audit-data.json → seo/reports/)
  generate-presentation.js      (reads seo/audit-data.json → seo/reports/)

seo/audit-data.json              (auto-populated by Claude from seo/research/)
package.json
```
