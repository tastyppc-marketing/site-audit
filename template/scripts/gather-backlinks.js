#!/usr/bin/env node
'use strict';

/**
 * gather-backlinks.js — Calls DataForSEO backlinks endpoints for one client domain
 * and any number of competitor domains.
 * Produces seo/research/client-backlinks.json for the first domain and
 * seo/research/backlinks-{domain}.json for each additional domain.
 *
 * Usage:
 *   node gather-backlinks.js <client-domain> [competitor-domain ...] [--limit 200]
 *   node gather-backlinks.js --from-audit-data [--competitors-only] [--limit 200]
 *
 * Flags:
 *   --from-audit-data   Auto-read client + competitor domains from seo/audit-data.json
 *   --competitors-only  Skip client domain if client-backlinks.json already exists
 *   --limit N           Max backlinks per domain (default 200)
 *
 * Approximate DataForSEO cost: ~$0.06 per domain (2 calls at ~$0.03 each).
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
const { postJson } = require('./lib/fetch-with-retry');

const DFS_BASE = 'https://api.dataforseo.com/v3';
const DEFAULT_LIMIT = 200;
const REFERRING_DOMAINS_LIMIT = 200;
const DFS_CALL_COST = 0.03;

function dfsPost(endpoint, payload, auth) {
  return postJson(`${DFS_BASE}${endpoint}`, payload, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(auth).toString('base64'),
    },
    timeout: 120000,
    label: `DataForSEO ${endpoint}`,
  }).then((response) => response.body);
}

async function fetchDomainBacklinks(domain, limit, auth) {
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

  // 2. Fetch referring domains
  console.error(`  Fetching referring domains for ${domain} (limit ${REFERRING_DOMAINS_LIMIT})...`);
  let referringDomains = [];
  try {
    const resp = await dfsPost('/backlinks/referring_domains/live', [{
      target: domain,
      limit: REFERRING_DOMAINS_LIMIT,
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

  return output;
}

async function main() {
  const args = process.argv.slice(2);
  const domains = [];
  let limit = DEFAULT_LIMIT;
  const fromAuditData = args.includes('--from-audit-data');
  const competitorsOnly = args.includes('--competitors-only');

  // Parse CLI flags
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--limit') { limit = parseInt(args[i + 1], 10); i += 1; continue; }
    if (arg.startsWith('--')) continue;
    domains.push(arg);
  }

  // --from-audit-data: auto-read domains from audit-data.json
  if (fromAuditData) {
    const auditPath = path.resolve('seo', 'audit-data.json');
    if (!fs.existsSync(auditPath)) {
      console.error('ERROR: --from-audit-data requires seo/audit-data.json in the current directory');
      process.exit(1);
    }
    const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
    const clientDomain = auditData.client && (auditData.client.website || auditData.client.websiteUrl || '');
    const cleanDomain = clientDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    if (!cleanDomain) {
      console.error('ERROR: audit-data.json has no client.website');
      process.exit(1);
    }
    if (!competitorsOnly) domains.unshift(cleanDomain);
    else domains.unshift(cleanDomain); // still need client as first for isClient flag

    const compAll = (auditData.competitor && Array.isArray(auditData.competitor.all))
      ? auditData.competitor.all : [];
    compAll.forEach(function(c) {
      var d = (c.domain || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
      if (d && domains.indexOf(d) === -1) domains.push(d);
    });
    console.error('Auto-loaded from audit-data.json: ' + domains.length + ' domains');
    console.error('  Client: ' + cleanDomain);
    console.error('  Competitors: ' + (domains.length - 1));
  }

  if (domains.length === 0) {
    console.error('Usage: node gather-backlinks.js <client-domain> [competitor ...] [--limit 200]');
    console.error('       node gather-backlinks.js --from-audit-data [--competitors-only] [--limit 200]');
    process.exit(1);
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    console.error('ERROR: --limit must be a positive integer');
    process.exit(1);
  }

  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error('ERROR: Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables');
    process.exit(1);
  }

  const auth = `${login}:${password}`;
  const outputDir = path.resolve('seo', 'research');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Build task list (skip client if --competitors-only and data exists)
  const tasks = domains.map(function(domain, i) {
    const isClient = i === 0;
    const outputFilename = isClient ? 'client-backlinks.json' : `backlinks-${domain}.json`;
    const outputPath = path.join(outputDir, outputFilename);
    const skip = isClient && competitorsOnly && fs.existsSync(outputPath);
    return { domain, isClient, outputFilename, outputPath, skip };
  });

  const activeTasks = tasks.filter(function(t) { return !t.skip; });
  const estCost = activeTasks.length * DFS_CALL_COST * 2;
  console.error(`\nEstimated cost: ~$${estCost.toFixed(2)} (${activeTasks.length} domains x 2 calls x $${DFS_CALL_COST})`);
  if (tasks.some(function(t) { return t.skip; })) {
    console.error('Skipping client domain (--competitors-only, client-backlinks.json exists)');
  }

  // Parallel fetching with Semaphore(2) for ~2x speedup
  let processedDomains = 0;
  const sem = new Semaphore(2);

  await Promise.all(activeTasks.map(function(task, idx) {
    return sem.run(async function() {
      console.error(`\n[${idx + 1}/${activeTasks.length}] ${task.isClient ? 'Client' : 'Competitor'} domain: ${task.domain}`);
      const output = await fetchDomainBacklinks(task.domain, limit, auth);

      fs.writeFileSync(task.outputPath, JSON.stringify(output, null, 2));
      processedDomains += 1;

      console.error(`Written: ${task.outputPath} (${output.backlinks ? output.backlinks.length : 'null'} backlinks, ${output.referring_domains ? output.referring_domains.length : 'null'} referring domains)`);
      if (output.errors.length > 0) console.error(`  Errors: ${output.errors.length} (status: ${output.status})`);
    });
  }));

  const totalCost = processedDomains * DFS_CALL_COST * 2;
  console.error(`\nTotal DFS API cost estimate: ~$${totalCost.toFixed(2)} (${processedDomains} domains x 2 calls)`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
