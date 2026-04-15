#!/usr/bin/env node
'use strict';

/**
 * gather-keyword-volumes.js — Calls DataForSEO Google Ads search volume API for real monthly keyword volumes.
 * Produces seo/research/keyword-volumes.json relative to the current working directory.
 *
 * Usage:
 *   node scripts/gather-keyword-volumes.js keyword1 "keyword two" keyword3 [--location 2840] [--language en]
 *   node scripts/gather-keyword-volumes.js --from-audit seo/audit-data.json [--location 2840] [--language en]
 *
 * Requires env vars: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 *
 * Output shape:
 * {
 *   data: [{ keyword, volume, cpc, competition, trend }],
 *   errors: [{ batch?, code?, reason }],
 *   status: "success" | "partial" | "failed",
 *   locationCode: 2840,
 *   languageCode: "en",
 *   gatheredAt: ISO timestamp
 * }
 *
 * Cost note: DataForSEO bills about $0.075 per task, with up to 1000 keywords per task.
 */

const fs = require('fs');
const path = require('path');
const { postJson } = require('./lib/fetch-with-retry');

const DFS_BASE = 'https://api.dataforseo.com/v3';
const DEFAULT_LOCATION_CODE = 2840;
const DEFAULT_LANGUAGE_CODE = 'en';
const MAX_KEYWORDS_PER_BATCH = 1000;
const COST_PER_BATCH = 0.075;

function dfsPost(endpoint, payload, auth) {
  return postJson(`${DFS_BASE}${endpoint}`, payload, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(auth).toString('base64'),
    },
    timeout: 60000,
    label: `DataForSEO ${endpoint}`,
  }).then((response) => response.body);
}

function usage() {
  console.error('Usage:');
  console.error('  node scripts/gather-keyword-volumes.js keyword1 "keyword two" keyword3 [--location 2840] [--language en]');
  console.error('  node scripts/gather-keyword-volumes.js --from-audit seo/audit-data.json [--location 2840] [--language en]');
}

function normalizeKeyword(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function nullEntry(keyword) {
  return {
    keyword,
    volume: null,
    cpc: null,
    competition: null,
    trend: [],
  };
}

function parseArgs(argv) {
  const parsed = {
    keywords: [],
    fromAuditPath: null,
    locationCode: DEFAULT_LOCATION_CODE,
    languageCode: DEFAULT_LANGUAGE_CODE,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--from-audit') {
      const next = argv[++i];
      if (!next) {
        console.error('ERROR: Missing value for --from-audit');
        usage();
        process.exit(1);
      }
      parsed.fromAuditPath = next;
      continue;
    }

    if (arg === '--location') {
      const next = argv[++i];
      const locationCode = Number.parseInt(next, 10);
      if (!next || !Number.isInteger(locationCode) || locationCode <= 0) {
        console.error('ERROR: --location must be a positive integer location code');
        usage();
        process.exit(1);
      }
      parsed.locationCode = locationCode;
      continue;
    }

    if (arg === '--language') {
      const next = argv[++i];
      if (!next) {
        console.error('ERROR: Missing value for --language');
        usage();
        process.exit(1);
      }
      parsed.languageCode = next;
      continue;
    }

    if (arg.startsWith('--')) {
      console.error(`ERROR: Unknown flag ${arg}`);
      usage();
      process.exit(1);
    }

    parsed.keywords.push(arg);
  }

  return parsed;
}

function chunk(array, size) {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

function loadKeywordsFromAudit(auditPath) {
  const raw = fs.readFileSync(auditPath, 'utf8');
  const auditData = JSON.parse(raw);
  const keywords = Array.isArray(auditData.keywords)
    ? auditData.keywords
      .map((entry) => entry && typeof entry.keyword === 'string' ? entry.keyword.trim() : '')
      .filter(Boolean)
    : [];

  return { auditData, keywords };
}

function mapKeywordResult(item) {
  return {
    keyword: item.keyword,
    volume: item.search_volume ?? null,
    cpc: item.cpc ?? null,
    competition: item.competition ?? null,
    trend: Array.isArray(item.monthly_searches)
      ? item.monthly_searches.map((month) => month && typeof month === 'object' ? (month.search_volume ?? null) : null)
      : [],
  };
}

function updateAuditKeywordVolumes(auditData, keywordResults) {
  if (!Array.isArray(auditData.keywords)) return 0;

  const resultsByKeyword = new Map();
  for (const result of keywordResults) {
    resultsByKeyword.set(normalizeKeyword(result.keyword), result);
  }

  let updatedCount = 0;
  for (const keywordEntry of auditData.keywords) {
    if (!keywordEntry || typeof keywordEntry !== 'object') continue;
    const match = resultsByKeyword.get(normalizeKeyword(keywordEntry.keyword));
    if (!match) continue;
    keywordEntry.volume = match.volume;
    keywordEntry.cpc = match.cpc;
    keywordEntry.competition = match.competition;
    updatedCount += 1;
  }

  return updatedCount;
}

async function main() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error('ERROR: Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables');
    process.exit(1);
  }

  const parsed = parseArgs(process.argv.slice(2));
  const auth = `${login}:${password}`;

  let auditPath = null;
  let auditData = null;
  let keywords = parsed.keywords;

  if (parsed.fromAuditPath) {
    auditPath = path.resolve(parsed.fromAuditPath);
    const loaded = loadKeywordsFromAudit(auditPath);
    auditData = loaded.auditData;
    keywords = loaded.keywords;

    if (parsed.keywords.length > 0) {
      console.error('WARNING: Ignoring positional keywords because --from-audit was provided');
    }

    if (keywords.length === 0) {
      console.error(`WARNING: No keywords found in ${auditPath}`);
      return;
    }
  }

  if (keywords.length === 0) {
    usage();
    process.exit(1);
  }

  console.error(`Fetching volumes for ${keywords.length} keywords...`);

  const batches = chunk(keywords, MAX_KEYWORDS_PER_BATCH);
  const results = [];
  const errors = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.error(`  Batch ${i + 1}/${batches.length}: ${batch.length} keywords`);

    try {
      const resp = await dfsPost('/keywords_data/google_ads/search_volume/live', [{
        keywords: batch,
        location_code: parsed.locationCode,
        language_code: parsed.languageCode,
      }], auth);

      const tasks = Array.isArray(resp.tasks) ? resp.tasks : [];
      const task = tasks[0];
      if (!task || task.status_code !== 20000 || !Array.isArray(task.result)) {
        const reason = task ? task.status_message : 'No task returned';
        const code = task ? task.status_code : null;
        errors.push({ batch: i + 1, code, reason });
        console.error(`  WARNING: Batch ${i + 1} failed: ${reason}`);
        for (const keyword of batch) results.push(nullEntry(keyword));
      } else {
        const resultsByKeyword = new Map();
        for (const item of task.result) {
          if (!item || !item.keyword) continue;
          resultsByKeyword.set(normalizeKeyword(item.keyword), mapKeywordResult(item));
        }

        let foundCount = 0;
        for (const keyword of batch) {
          const match = resultsByKeyword.get(normalizeKeyword(keyword));
          if (match) {
            results.push(match);
            if (match.volume !== null) foundCount += 1;
          } else {
            results.push(nullEntry(keyword));
          }
        }

        console.error(`  Done: Batch ${i + 1} returned volume data for ${foundCount}/${batch.length} keywords`);
      }
    } catch (err) {
      errors.push({ batch: i + 1, reason: err.message });
      console.error(`  ERROR in batch ${i + 1}: ${err.message}`);
      for (const keyword of batch) results.push(nullEntry(keyword));
    }
  }

  let status;
  if (errors.length === 0) {
    status = 'success';
  } else if (results.every((result) => result.volume === null)) {
    status = 'failed';
  } else {
    status = 'partial';
  }

  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'keyword-volumes.json');

  const output = {
    data: results,
    errors,
    status,
    locationCode: parsed.locationCode,
    languageCode: parsed.languageCode,
    gatheredAt: new Date().toISOString(),
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.error(`\nWritten: ${outputPath} (${results.length} keywords)`);
  if (errors.length > 0) console.error(`  Errors: ${errors.length} (status: ${status})`);

  const estimatedCost = batches.length * COST_PER_BATCH;
  console.error(`Estimated DataForSEO cost: $${COST_PER_BATCH.toFixed(3)} per batch task x ${batches.length} = ~$${estimatedCost.toFixed(2)} total`);

  if (auditPath && auditData) {
    const updatedCount = updateAuditKeywordVolumes(auditData, results);
    fs.writeFileSync(auditPath, `${JSON.stringify(auditData, null, 2)}\n`);
    console.error(`Updated ${updatedCount} keywords in audit-data.json with real volumes`);
  }
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
