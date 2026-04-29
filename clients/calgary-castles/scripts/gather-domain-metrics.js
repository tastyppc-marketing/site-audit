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
 *   errors: [{ domain, code?, reason }],
 *   status: "success" | "partial" | "failed",
 *   gatheredAt: ISO timestamp
 * }
 */

const fs = require('fs');
const path = require('path');
const { postJson } = require('./lib/fetch-with-retry');

const DFS_BASE = 'https://api.dataforseo.com/v3';

function dfsPost(endpoint, payload, auth) {
  return postJson(`${DFS_BASE}${endpoint}`, payload, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(auth).toString('base64'),
    },
    timeout: 60000,
    label: `DataForSEO ${endpoint}`,
  }).then((response) => response.body);
}

const NULL_ENTRY = (domain, isClient) => ({
  domain,
  domainRating: null,
  referringDomains: null,
  backlinks: null,
  organicTraffic: null,
  organicKeywords: null,
  trafficValue: null,
  brokenBacklinks: null,
  isClient,
});

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
  const allDomains = args;
  const results = [];
  const errors = [];

  for (let i = 0; i < allDomains.length; i++) {
    const domain = allDomains[i];
    const isClient = (i === 0);
    console.error(`  Fetching backlinks/summary for ${domain}...`);

    try {
      const resp = await dfsPost('/backlinks/summary/live', [{ target: domain }], auth);
      const tasks = resp.tasks || [];
      const task = tasks[0];
      if (!task || task.status_code !== 20000 || !task.result || !task.result[0]) {
        const reason = task ? task.status_message : 'No task returned';
        const code = task ? task.status_code : null;
        errors.push({ domain, code, reason });
        console.error(`  WARNING: No data for ${domain}: ${reason}`);
        results.push(NULL_ENTRY(domain, isClient));
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
      errors.push({ domain, reason: err.message });
      console.error(`  ERROR for ${domain}: ${err.message}`);
      results.push(NULL_ENTRY(domain, isClient));
    }
  }

  // Compute status
  let status;
  if (errors.length === 0) {
    status = 'success';
  } else if (results.every(r => r.domainRating === null)) {
    status = 'failed';
  } else {
    status = 'partial';
  }

  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'domain-metrics.json');

  fs.writeFileSync(outputPath, JSON.stringify({ data: results, errors, status, gatheredAt: new Date().toISOString() }, null, 2));
  console.error(`\nWritten: ${outputPath} (${results.length} domains)`);
  if (errors.length > 0) console.error(`  Errors: ${errors.length} (status: ${status})`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
