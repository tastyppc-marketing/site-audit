#!/usr/bin/env node
'use strict';

/**
 * gather-organic-metrics.js — Calls DataForSEO Labs ranked keywords for client + competitors.
 * Produces research/organic-metrics.json.
 *
 * Usage:
 *   node scripts/gather-organic-metrics.js <client-domain> [competitor-domain ...]
 *     [--location <DFS-location-code>] [--language <DFS-language-code>]
 *
 * Requires env vars: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 *
 * Location/language resolution priority:
 *   1. --location / --language CLI flags
 *   2. client-config.json fields locationCode / languageCode
 *   3. 2840 (US) / "en" with a visible warning
 *
 * Output shape:
 * {
 *   data: [{
 *     domain, organicKeywords, organicTraffic, organicTrafficTotal,
 *     topKeywords, isClient
 *   }],
 *   errors: [{ domain, code?, reason }],
 *   status: "success" | "partial" | "failed",
 *   gatheredAt: ISO timestamp
 * }
 *
 * Field semantics:
 *   organicTraffic       — sum of estimated traffic across the top 100 ranked
 *                          keywords (back-compat field; under-represents true
 *                          traffic for any domain ranking for >100 keywords).
 *   organicTrafficTotal  — true domain-level estimated organic traffic from
 *                          /dataforseo_labs/google/domain_rank_overview/live
 *                          (uncapped). Omitted if the summary endpoint fails.
 */

const fs = require('fs');
const path = require('path');
const { postJson } = require('./lib/fetch-with-retry');
const { loadClientEnv, resolveClientSlug } = require('./lib/load-client-env');

const DFS_BASE = 'https://api.dataforseo.com/v3';
const DFS_RANKED_ENDPOINT = '/dataforseo_labs/google/ranked_keywords/live';
const DFS_OVERVIEW_ENDPOINT = '/dataforseo_labs/google/domain_rank_overview/live';

function dfsPost(endpoint, payload, auth) {
  return postJson(`${DFS_BASE}${endpoint}`, payload, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(auth).toString('base64'),
    },
    timeout: 60000,
    label: `DataForSEO ${endpoint}`,
  }).then((response) => response.body);
}

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

function getCliArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
}

function loadClientConfig() {
  const configPath = path.resolve(getCliArg('--config', null) || 'client-config.json');
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.error(`WARNING: could not parse ${configPath}: ${e.message}`);
    return {};
  }
}

function resolveLocationCode(cfg) {
  const cliLoc = getCliArg('--location', null);
  if (cliLoc != null) {
    const code = parseInt(cliLoc, 10);
    if (!Number.isInteger(code) || code <= 0) {
      console.error(`ERROR: --location must be a positive integer, got: ${cliLoc}`);
      process.exit(1);
    }
    console.error(`location_code ${code} (source: --location CLI flag)`);
    return code;
  }
  if (cfg.locationCode != null) {
    const code = parseInt(cfg.locationCode, 10);
    if (!Number.isInteger(code) || code <= 0) {
      console.error(`ERROR: client-config.json "locationCode" must be a positive integer, got: ${cfg.locationCode}`);
      process.exit(1);
    }
    console.error(`location_code ${code} (source: client-config.json)`);
    return code;
  }
  console.error(`WARNING: no --location flag and no locationCode in client-config.json — falling back to 2840 (country-level US).`);
  console.error(`         Add "locationCode": <DFS numeric code> to client-config.json for city-level results.`);
  return 2840;
}

function resolveLanguageCode(cfg) {
  const cliLang = getCliArg('--language', null);
  if (cliLang != null) {
    console.error(`language_code ${cliLang} (source: --language CLI flag)`);
    return cliLang;
  }
  if (cfg.languageCode != null && cfg.languageCode !== '') {
    console.error(`language_code ${cfg.languageCode} (source: client-config.json)`);
    return String(cfg.languageCode);
  }
  console.error(`language_code en (source: default — add "languageCode" to client-config.json to override)`);
  return 'en';
}

/**
 * Extract metrics.organic.{count, etv} from a domain_rank_overview/live response.
 * Tolerates the two response shapes DFS Labs uses (result.items[0].metrics.organic
 * vs result.metrics.organic). Returns null on any error / missing data so the
 * caller can omit organicTrafficTotal from the output rather than crash.
 */
function extractOverviewMetrics(resp) {
  if (!resp || !Array.isArray(resp.tasks) || !resp.tasks[0]) return null;
  const task = resp.tasks[0];
  if (task.status_code !== 20000) return null;
  const result = Array.isArray(task.result) ? task.result[0] : null;
  if (!result) return null;

  let metrics = null;
  if (Array.isArray(result.items) && result.items[0] && result.items[0].metrics) {
    metrics = result.items[0].metrics.organic || null;
  }
  if (!metrics && result.metrics) {
    metrics = result.metrics.organic || null;
  }
  if (!metrics) return null;

  return {
    count: toNumberOrNull(metrics.count),
    etv: toNumberOrNull(metrics.etv),
  };
}

async function main() {
  const slug = resolveClientSlug();
  const env = loadClientEnv(slug);
  const login = env.DATAFORSEO_LOGIN || process.env.DATAFORSEO_LOGIN;
  const password = env.DATAFORSEO_PASSWORD || process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error(`ERROR: DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD missing for client '${slug}'.`);
    console.error(`       Set them in clients/${slug}/.env or export them in the shell.`);
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((arg, i, arr) => {
    if (arg.startsWith('--')) return false;
    // Drop the value following a flag (e.g. "--location 1028181").
    const prev = arr[i - 1];
    return !(prev && prev.startsWith('--'));
  });
  if (args.length === 0) {
    console.error('Usage: node scripts/gather-organic-metrics.js <client-domain> [competitor-domain ...]');
    console.error('  Optional: --location <DFS-location-code> --language <DFS-language-code>');
    console.error('  Both also read from client-config.json (locationCode / languageCode).');
    process.exit(1);
  }

  const cfg = loadClientConfig();
  const locationCode = resolveLocationCode(cfg);
  const languageCode = resolveLanguageCode(cfg);

  const auth = `${login}:${password}`;
  const results = [];
  const errors = [];

  for (let i = 0; i < args.length; i++) {
    const domain = args[i];
    const isClient = i === 0;
    console.error(`  Fetching ranked keywords for ${domain}...`);

    try {
      const payload = [{
        target: domain,
        location_code: locationCode,
        language_code: languageCode,
        limit: 100,
      }];
      const resp = await dfsPost(DFS_RANKED_ENDPOINT, payload, auth);
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

      // Second call: domain_rank_overview/live for true total organic traffic.
      // organicTraffic above is sum-of-top-100; this fills in the uncapped
      // domain-level total. Wrapped defensively — if the call fails or the
      // response shape is unexpected, organicTrafficTotal is omitted and
      // existing consumers fall back to organicTraffic transparently.
      let organicTrafficTotal = null;
      try {
        const overviewPayload = [{
          target: domain,
          location_code: locationCode,
          language_code: languageCode,
        }];
        const overviewResp = await dfsPost(DFS_OVERVIEW_ENDPOINT, overviewPayload, auth);
        const overview = extractOverviewMetrics(overviewResp);
        if (overview && overview.etv != null) {
          organicTrafficTotal = overview.etv;
        } else {
          console.error(`  WARNING: domain_rank_overview/live returned no organic.etv for ${domain} — keeping top-100 sum only.`);
        }
      } catch (overviewErr) {
        console.error(`  WARNING: domain_rank_overview/live failed for ${domain}: ${overviewErr.message} — keeping top-100 sum only.`);
      }

      const entry = {
        domain,
        organicKeywords,
        organicTraffic,
        topKeywords,
        isClient,
      };
      if (organicTrafficTotal != null) entry.organicTrafficTotal = organicTrafficTotal;
      results.push(entry);

      const totalDisplay = organicTrafficTotal != null ? `, total traffic: ${organicTrafficTotal}` : '';
      console.error(`  Done: ${domain} — keywords: ${organicKeywords}, top-100 traffic: ${organicTraffic}${totalDisplay}`);
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
