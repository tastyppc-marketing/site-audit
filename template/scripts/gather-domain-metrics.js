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
