#!/usr/bin/env node
'use strict';

/**
 * gather-local-pack.js — Calls DataForSEO SERP API to check if client appears
 * in Google Local Pack (map pack) for each tracked keyword.
 * Produces research/local-pack-data.json.
 *
 * Usage:
 *   node scripts/gather-local-pack.js --keywords "kw1,kw2,kw3" --location 2840 --business "Business Name"
 *   node scripts/gather-local-pack.js --from-audit seo/audit-data.json --location 2840
 *
 * Requires env vars: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 *
 * Output shape:
 * {
 *   businessName, locationCode,
 *   keywords: [{ keyword, foundInPack, position, packItems }],
 *   summary: { totalKeywords, foundInPack, notInPack, avgPosition },
 *   errors: [{ keyword, code?, reason }],
 *   status: "success" | "partial" | "failed",
 *   gatheredAt: ISO timestamp
 * }
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DFS_BASE = 'https://api.dataforseo.com/v3';
const DELAY_MS = 3000; // 3 seconds between SERP calls (~$0.002 each)

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

function getArg(flag, defaultVal) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return defaultVal;
}

function hasFlag(flag) { return process.argv.includes(flag); }

function fuzzyMatch(title, businessName) {
  if (!title || !businessName) return false;
  return title.toLowerCase().includes(businessName.toLowerCase()) ||
    businessName.toLowerCase().includes(title.toLowerCase());
}

async function main() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error('ERROR: Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables');
    process.exit(1);
  }

  const locationCode = parseInt(getArg('--location', '2840'), 10);
  let keywords = [];
  let businessName = '';

  // --from-audit mode: read keywords and business name from audit-data.json
  const fromAudit = getArg('--from-audit', null);
  if (fromAudit) {
    const auditPath = path.resolve(fromAudit);
    if (!fs.existsSync(auditPath)) {
      console.error(`ERROR: audit-data.json not found at ${auditPath}`);
      process.exit(1);
    }
    const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
    const kwArray = (auditData.data || auditData).keywords || [];
    keywords = kwArray.map(k => (typeof k === 'string' ? k : k.keyword)).filter(Boolean);
    businessName = ((auditData.data || auditData).client || {}).name || '';
    if (!businessName) {
      console.error('ERROR: Could not read client.name from audit-data.json');
      process.exit(1);
    }
  } else {
    // --keywords and --business mode
    const kwArg = getArg('--keywords', '');
    if (!kwArg) {
      console.error('Usage: node gather-local-pack.js --keywords "kw1,kw2" --location 2840 --business "Name"');
      console.error('       node gather-local-pack.js --from-audit seo/audit-data.json --location 2840');
      process.exit(1);
    }
    keywords = kwArg.split(',').map(k => k.trim()).filter(Boolean);
    businessName = getArg('--business', '');
    if (!businessName) {
      console.error('ERROR: --business "Business Name" is required');
      process.exit(1);
    }
  }

  if (keywords.length === 0) {
    console.error('ERROR: No keywords found');
    process.exit(1);
  }

  console.error(`Checking Local Pack for "${businessName}" — ${keywords.length} keywords, location ${locationCode}`);
  console.error(`Estimated cost: $${(keywords.length * 0.002).toFixed(3)} (${keywords.length} SERP queries)\n`);

  const auth = `${login}:${password}`;
  const results = [];
  const errors = [];

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    if (i > 0) await sleep(DELAY_MS);

    console.error(`  [${i + 1}/${keywords.length}] ${keyword}`);

    try {
      const resp = await dfsPost('/serp/google/organic/live/advanced', [{
        keyword,
        location_code: locationCode,
        language_code: 'en',
        device: 'desktop',
        depth: 100,
      }], auth);

      const tasks = resp.tasks || [];
      const task = tasks[0];
      if (!task || task.status_code !== 20000 || !task.result || !task.result[0]) {
        const reason = task ? task.status_message : 'No task returned';
        const code = task ? task.status_code : null;
        errors.push({ keyword, code, reason });
        console.error(`    WARNING: No data — ${reason}`);
        results.push({ keyword, foundInPack: false, position: null, packItems: [] });
        continue;
      }

      // Find local_pack items in the SERP result
      const items = task.result[0].items || [];
      const localPackItem = items.find(item => item.type === 'local_pack');

      if (!localPackItem || !localPackItem.items || localPackItem.items.length === 0) {
        console.error(`    No local pack found`);
        results.push({ keyword, foundInPack: false, position: null, packItems: [] });
        continue;
      }

      const packEntries = localPackItem.items.slice(0, 3);
      const packItems = packEntries.map((entry, idx) => ({
        title: entry.title || entry.domain || '',
        rating: entry.rating ? (entry.rating.value || entry.rating) : null,
        reviews: entry.rating ? (entry.rating.votes_count || null) : null,
        position: idx + 1,
      }));

      // Fuzzy match client business name
      const matchIdx = packItems.findIndex(p => fuzzyMatch(p.title, businessName));
      const foundInPack = matchIdx !== -1;
      const position = foundInPack ? matchIdx + 1 : null;

      if (foundInPack) {
        console.error(`    FOUND at position ${position}`);
      } else {
        console.error(`    Not in pack (pack: ${packItems.map(p => p.title).join(', ')})`);
      }

      results.push({ keyword, foundInPack, position, packItems });
    } catch (err) {
      errors.push({ keyword, reason: err.message });
      console.error(`    ERROR: ${err.message}`);
      results.push({ keyword, foundInPack: false, position: null, packItems: [] });
    }
  }

  // Summary
  const inPackResults = results.filter(r => r.foundInPack);
  const positions = inPackResults.map(r => r.position).filter(p => p !== null);
  const avgPosition = positions.length > 0
    ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
    : null;

  const summary = {
    totalKeywords: results.length,
    foundInPack: inPackResults.length,
    notInPack: results.length - inPackResults.length,
    avgPosition,
  };

  // Compute status
  let status;
  if (errors.length === 0) {
    status = 'success';
  } else if (results.every(r => !r.foundInPack) && errors.length === results.length) {
    status = 'failed';
  } else {
    status = 'partial';
  }

  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'local-pack-data.json');

  fs.writeFileSync(outputPath, JSON.stringify({
    businessName,
    locationCode,
    keywords: results,
    summary,
    errors,
    status,
    gatheredAt: new Date().toISOString(),
  }, null, 2));

  console.error(`\nWritten: ${outputPath}`);
  console.error(`Summary: ${summary.foundInPack}/${summary.totalKeywords} keywords in pack` +
    (avgPosition !== null ? `, avg position ${avgPosition}` : ''));
  if (errors.length > 0) console.error(`Errors: ${errors.length} (status: ${status})`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
