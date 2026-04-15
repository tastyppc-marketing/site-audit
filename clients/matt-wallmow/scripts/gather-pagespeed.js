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
 *   errors: [{ domain, strategy, code?, reason }],
 *   status: "success" | "partial" | "failed",
 *   gatheredAt: ISO timestamp
 * }
 *
 * Rate limit: Google PSI allows ~25 requests per 100 seconds (public) or 25,000/day (with key).
 * Requests now flow through a shared retry utility with max 2 concurrent requests,
 * exponential backoff on 429/5xx, and 5 retries per request.
 */

const fs = require('fs');
const path = require('path');
const { fetchJSON: fetchJSONRetry, Semaphore } = require('./lib/fetch-with-retry');
const sem = new Semaphore(2); // max 2 concurrent PSI requests

const PSI_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const PSI_API_KEY = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_API_KEY || '';

const errors = [];

function mapPsiStatusCode(code) {
  if (code === 429) return 'PSI API quota exceeded. Enable at console.cloud.google.com or request higher quota.';
  if (code === 403) return 'PSI API access denied.';
  return `PSI API error (HTTP ${code}).`;
}

async function fetchPSIJSON(url) {
  const res = await fetchJSONRetry(url, {
    timeout: 90000,
    label: `PSI ${url.substring(0, 60)}`,
    allowNon2xx: true, // we handle status codes ourselves
  });
  return res;
}

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

async function fetchPSI(url, strategy, domain) {
  const keyParam = PSI_API_KEY ? `&key=${PSI_API_KEY}` : '';
  const apiUrl = `${PSI_BASE}?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance${keyParam}`;
  console.error(`  Fetching PSI: ${url} [${strategy}]...`);
  return sem.run(async () => {
    try {
      const body = await fetchPSIJSON(apiUrl);
      if (body && body.error) {
        const code = body.error.code || 500;
        const reason = mapPsiStatusCode(code);
        errors.push({ domain, strategy, code, reason });
        console.error(`  WARNING: PSI HTTP ${code} for ${url} [${strategy}]: ${reason}`);
        return null;
      }
      if (!body || !body.lighthouseResult) {
        errors.push({ domain, strategy, reason: 'PSI API returned no lighthouseResult.' });
        console.error(`  WARNING: PSI no lighthouseResult for ${url} [${strategy}]`);
        return null;
      }
      return body;
    } catch (err) {
      const reason = err.message === 'timeout' ? 'PSI API request timed out.' : err.message;
      errors.push({ domain, strategy, reason });
      console.error(`  WARNING: PSI failed for ${url} [${strategy}]: ${reason}`);
      return null;
    }
  });
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

    const mobileResp = await fetchPSI(url, 'mobile', domain);
    const desktopResp = await fetchPSI(url, 'desktop', domain);

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

  // Compute status
  const allEntries = [...clientPages, ...competitorPages];
  let status;
  if (errors.length === 0) {
    status = 'success';
  } else if (allEntries.every(e => e.mobile === null && e.desktop === null)) {
    status = 'failed';
  } else {
    status = 'partial';
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
    errors,
    status,
    gatheredAt: new Date().toISOString(),
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.error(`\nWritten: ${outputPath}`);
  console.error(`  Client pages: ${clientPages.length}, Competitor pages: ${competitorPages.length}`);
  if (errors.length > 0) console.error(`  Errors: ${errors.length} (status: ${status})`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
