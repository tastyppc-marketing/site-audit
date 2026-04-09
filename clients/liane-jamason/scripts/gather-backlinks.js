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
 *   totalBacklinks: number | null,
 *   referringDomains: number | null,
 *   backlinks: [...] | null,
 *   referring_domains: [...] | null,
 *   errors: [{ endpoint, code?, reason }],
 *   status: "success" | "partial" | "failed",
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
  const errors = [];

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
    if (!task) {
      errors.push({ endpoint: 'backlinks', reason: 'No task returned' });
      backlinks = null;
      console.error(`  WARNING: No task returned for backlinks`);
    } else if (task.status_code !== 20000 || !task.result || !task.result[0]) {
      errors.push({ endpoint: 'backlinks', code: task.status_code, reason: task.status_message });
      backlinks = null;
      console.error(`  WARNING: No backlink data: ${task.status_message}`);
    } else {
      backlinks = (task.result[0].items || []).map(item => ({
        source_url: item.url_from || '',
        target_url: item.url_to || '',
        anchor_text: item.anchor || '',
        domain_rating: item.rank || null,
        is_dofollow: item.dofollow !== false,
        first_seen: item.first_seen || '',
      }));
      console.error(`  Backlinks: ${backlinks.length} records`);
    }
  } catch (err) {
    errors.push({ endpoint: 'backlinks', reason: err.message });
    backlinks = null;
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
    if (!task) {
      errors.push({ endpoint: 'referring_domains', reason: 'No task returned' });
      referringDomains = null;
      console.error(`  WARNING: No task returned for referring domains`);
    } else if (task.status_code !== 20000 || !task.result || !task.result[0]) {
      errors.push({ endpoint: 'referring_domains', code: task.status_code, reason: task.status_message });
      referringDomains = null;
      console.error(`  WARNING: No referring domain data: ${task.status_message}`);
    } else {
      referringDomains = (task.result[0].items || []).map(item => ({
        domain: item.domain || '',
        rank: item.rank || 0,
        backlinks: item.backlinks || 0,
        first_seen: item.first_seen || '',
        dofollow: item.dofollow || 0,
        referring_pages: item.referring_pages || 0,
      }));
      console.error(`  Referring domains: ${referringDomains.length} records`);
    }
  } catch (err) {
    errors.push({ endpoint: 'referring_domains', reason: err.message });
    referringDomains = null;
    console.error(`  ERROR fetching referring domains: ${err.message}`);
  }

  // Compute status
  let status;
  if (errors.length === 0) {
    status = 'success';
  } else if (backlinks === null && referringDomains === null) {
    status = 'failed';
  } else {
    status = 'partial';
  }

  const output = {
    domain,
    totalBacklinks: backlinks ? backlinks.length : null,
    referringDomains: referringDomains ? referringDomains.length : null,
    backlinks,
    referring_domains: referringDomains,
    errors,
    status,
    gatheredAt: new Date().toISOString(),
  };

  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'client-backlinks.json');

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.error(`\nWritten: ${outputPath} (${backlinks ? backlinks.length : 'null'} backlinks, ${referringDomains ? referringDomains.length : 'null'} referring domains)`);
  if (errors.length > 0) console.error(`  Errors: ${errors.length} (status: ${status})`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
