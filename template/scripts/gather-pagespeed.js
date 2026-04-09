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
 *   data: { client: [...], competitors: [...] },
 *   pageSpeedComparison: [...],
 *   coreWebVitals: { mobile: {...}, desktop: {...} },
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
