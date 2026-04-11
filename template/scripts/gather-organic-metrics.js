#!/usr/bin/env node
'use strict';

/**
 * gather-organic-metrics.js — Calls DataForSEO Labs ranked keywords for client + competitors.
 * Produces research/organic-metrics.json.
 *
 * Usage:
 *   node scripts/gather-organic-metrics.js <client-domain> [competitor-domain ...]
 *
 * Requires env vars: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 *
 * Output shape:
 * {
 *   data: [{ domain, organicKeywords, organicTraffic, topKeywords, isClient }],
 *   errors: [{ domain, code?, reason }],
 *   status: "success" | "partial" | "failed",
 *   gatheredAt: ISO timestamp
 * }
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DFS_BASE = 'https://api.dataforseo.com/v3';
const DFS_ENDPOINT = '/dataforseo_labs/google/ranked_keywords/live';
const REQUEST_DELAY_MS = 2000;

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

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function toNumberOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullEntry(domain, isClient) {
  return {
    domain,
    organicKeywords: null,
    organicTraffic: null,
    topKeywords: [],
    isClient,
  };
}

async function main() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error('ERROR: Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables');
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  if (args.length === 0) {
    console.error('Usage: node scripts/gather-organic-metrics.js <client-domain> [competitor-domain ...]');
    process.exit(1);
  }

  const auth = `${login}:${password}`;
  const results = [];
  const errors = [];

  for (let i = 0; i < args.length; i++) {
    const domain = args[i];
    const isClient = i === 0;
    console.error(`  Fetching ranked keywords for ${domain}...`);

    if (i > 0) await sleep(REQUEST_DELAY_MS);

    try {
      const payload = [{
        target: domain,
        location_code: 2840,
        language_code: 'en',
        limit: 100,
      }];
      const resp = await dfsPost(DFS_ENDPOINT, payload, auth);
      const tasks = resp.tasks || [];
      const task = tasks[0];
      const result = task && Array.isArray(task.result) ? task.result[0] : null;
      const items = result && Array.isArray(result.items) ? result.items : null;

      if (!task || task.status_code !== 20000 || !result || !items || items.length === 0) {
        const reason = !task ? 'No task returned'
          : (task.status_code !== 20000 ? task.status_message : 'No ranked keywords returned');
        const code = task ? task.status_code : null;
        errors.push({ domain, code, reason });
        console.error(`  WARNING: No data for ${domain}: ${reason}`);
        results.push(nullEntry(domain, isClient));
        continue;
      }

      const totalCount = toNumberOrNull(result.total_count);
      const organicKeywords = totalCount != null ? totalCount : items.length;
      let organicTraffic = 0;
      const keywordRows = items.map((item) => {
        const keywordData = item && item.keyword_data ? item.keyword_data : {};
        const keywordInfo = keywordData && keywordData.keyword_info ? keywordData.keyword_info : {};
        const serpElement = item && item.ranked_serp_element ? item.ranked_serp_element : {};
        const serpItem = serpElement && serpElement.serp_item ? serpElement.serp_item : {};
        const traffic = toNumberOrNull(serpItem.etv) || 0;
        organicTraffic += traffic;

        return {
          keyword: keywordData.keyword || '',
          volume: toNumberOrNull(keywordInfo.search_volume),
          position: toNumberOrNull(serpItem.rank_group),
          url: serpItem.url || '',
          traffic,
        };
      });

      const topKeywords = keywordRows
        .slice()
        .sort((a, b) => b.traffic - a.traffic)
        .slice(0, 10)
        .map((entry) => ({
          keyword: entry.keyword,
          volume: entry.volume,
          position: entry.position,
          traffic: entry.traffic,
        }));

      results.push({
        domain,
        organicKeywords,
        organicTraffic,
        topKeywords,
        isClient,
      });
      console.error(`  Done: ${domain} — keywords: ${organicKeywords}, traffic: ${organicTraffic}`);
    } catch (err) {
      errors.push({ domain, reason: err.message });
      console.error(`  ERROR for ${domain}: ${err.message}`);
      results.push(nullEntry(domain, isClient));
    }
  }

  let status;
  if (errors.length === 0) {
    status = 'success';
  } else if (results.every((entry) => entry.organicKeywords === null)) {
    status = 'failed';
  } else {
    status = 'partial';
  }

  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'organic-metrics.json');

  fs.writeFileSync(outputPath, JSON.stringify({
    data: results,
    errors,
    status,
    gatheredAt: new Date().toISOString(),
  }, null, 2));

  console.error(`\nWritten: ${outputPath} (${results.length} domains)`);
  if (errors.length > 0) console.error(`  Errors: ${errors.length} (status: ${status})`);
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
