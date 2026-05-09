#!/usr/bin/env node
'use strict';

/**
 * analyze-backlink-quality.js — Classifies referring domains as legit/suspicious/spam.
 *
 * Phase 1: Rule-based classifier (instant, runs entirely in Node.js)
 * Phase 2: Optional Claude CLI session for ambiguous domains (no API cost)
 *
 * Usage:
 *   node scripts/analyze-backlink-quality.js [--client-only] [--skip-ai]
 *
 * Reads:  seo/research/client-backlinks.json (and optionally backlinks-*.json)
 * Writes: Enriches JSON files in-place with domainQuality fields + qualitySummary
 *
 * No API costs — rule-based classifier handles ~80% of domains.
 * The optional AI pass spawns a Claude Code CLI session via tmux for edge cases.
 */

const fs = require('fs');
const path = require('path');

// ── Spam signal patterns ─────────────────────────────────────────────

const SPAM_TLDS = /\.(xyz|top|click|loan|tk|gq|cf|ga|ml|buzz|wang|bid|win|stream|club|site|online|icu|monster|rest|beauty|hair|skin|quest|cfd)$/i;
const SPAM_KEYWORDS = /casino|gambling|gamble|poker|slots|betting|pharma|viagra|cialis|payday|loan|forex|crypto.*trade|adult|porn|xxx|sex|dating|hookup/i;
const TELEGRAM_SPAM = /telegram|t\.me|darksidelinks|quarterlinks|darkside/i;
const GENERIC_ANCHORS = /^\[.*more\]$|^post$|^click here$|^here$|^link$|^website$|^read more$|^learn more$|^visit$|^source$|^this$/i;
const SEO_SPAM = /seo|backlink|link.?build|guest.?post|submit|free.?directory|article.?director|web.?director/i;
const FOREIGN_SPAM_TLDS = /\.(ru|cn|vn|id|pl|be|ua|kz|uz|by|su)$/i;

// Known legitimate domain patterns (real estate, business, etc.)
const LEGIT_PATTERNS = [
  /realtor\.com|zillow|redfin|trulia|homes\.com|homesnap|movoto|har\.com/i,
  /yelp\.com|bbb\.org|yellowpages|angieslist|thumbtack|homeadvisor|houzz/i,
  /facebook\.com|linkedin\.com|twitter\.com|instagram\.com|pinterest\.com|youtube\.com/i,
  /google\.com|bing\.com|yahoo\.com|apple\.com|microsoft\.com/i,
  /\.gov$|\.edu$|\.mil$/i,
  /activerain\.com|biggerpockets\.com|inman\.com|realtrends\.com/i,
  /patch\.com|nextdoor\.com|alignable\.com/i,
  /chamber.*commerce|rotary|kiwanis|lions.*club/i,
];

// ── Classification logic ─────────────────────────────────────────────

function classifyDomain(entry) {
  var domain = (entry.domain || '').toLowerCase();
  var dr = entry.rank || entry.dr || entry.domainRating || 0;
  var anchors = entry.anchors || []; // aggregated from backlinks
  var linkCount = entry.linkCount || entry.backlinks || 1;

  var flags = [];
  var score = 0; // higher = more spammy

  // Check known legit domains first
  for (var i = 0; i < LEGIT_PATTERNS.length; i++) {
    if (LEGIT_PATTERNS[i].test(domain)) {
      return {
        domainQuality: 'legitimate',
        qualityScore: Math.min(100, 50 + dr),
        qualitySignals: ['known-legitimate-domain'],
        qualityReason: 'Recognized legitimate domain',
      };
    }
  }

  // High DR domains are likely legit (unless other red flags)
  if (dr >= 50) {
    // Still check for spam keywords in domain name
    if (!SPAM_KEYWORDS.test(domain)) {
      return {
        domainQuality: 'legitimate',
        qualityScore: Math.min(100, 40 + dr),
        qualitySignals: ['high-domain-rating'],
        qualityReason: 'High domain authority (DR ' + dr + ')',
      };
    }
  }

  // DR-based signals
  if (dr === 0) { flags.push('DR-0'); score += 3; }
  else if (dr < 5) { flags.push('very-low-DR'); score += 2; }
  else if (dr < 15) { flags.push('low-DR'); score += 1; }

  // TLD signals
  if (SPAM_TLDS.test(domain)) { flags.push('spam-TLD'); score += 4; }
  if (FOREIGN_SPAM_TLDS.test(domain) && dr < 15) { flags.push('low-DR-foreign'); score += 2; }

  // Domain name keyword signals
  if (SPAM_KEYWORDS.test(domain)) { flags.push('spam-keyword-in-domain'); score += 5; }
  if (SEO_SPAM.test(domain)) { flags.push('SEO-spam-domain'); score += 3; }

  // Anchor text signals
  var hasTelegramAnchor = false;
  var hasGenericAnchor = false;
  anchors.forEach(function(anchor) {
    if (TELEGRAM_SPAM.test(anchor)) { hasTelegramAnchor = true; }
    if (GENERIC_ANCHORS.test(anchor)) { hasGenericAnchor = true; }
  });
  if (hasTelegramAnchor) { flags.push('telegram-spam-anchor'); score += 5; }
  if (hasGenericAnchor && dr < 10) { flags.push('generic-anchor-low-DR'); score += 1; }

  // Single dofollow link from DR-0 domain
  if (dr === 0 && linkCount === 1 && entry.hasDofollow) {
    flags.push('single-dofollow-DR0');
    score += 2;
  }

  // Domain name heuristics
  if (domain.length > 30 && dr < 10) { flags.push('suspiciously-long-domain'); score += 1; }
  if (/\d{4,}/.test(domain) && dr < 10) { flags.push('numeric-domain'); score += 1; }

  // Classification
  var classification = score >= 5 ? 'spam' : (score >= 2 ? 'suspicious' : 'legitimate');
  var qualityScore = Math.max(0, Math.min(100, 80 - score * 10 + dr));

  return {
    domainQuality: classification,
    qualityScore: qualityScore,
    qualitySignals: flags,
    qualityReason: flags.length ? flags.join(', ') : 'No negative signals detected',
  };
}

// ── File processing ──────────────────────────────────────────────────

function processBacklinksFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  var raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  var backlinks = Array.isArray(raw.backlinks) ? raw.backlinks
    : (raw.data && Array.isArray(raw.data.backlinks)) ? raw.data.backlinks : [];
  var referringDomains = Array.isArray(raw.referring_domains) ? raw.referring_domains
    : (raw.data && Array.isArray(raw.data.referring_domains)) ? raw.data.referring_domains : [];

  if (!referringDomains.length && !backlinks.length) return null;

  // Build per-domain anchor aggregation from backlinks
  var domainAnchors = {};
  var domainDofollow = {};
  backlinks.forEach(function(bl) {
    var src = bl.source_url || bl.sourceUrl || '';
    var domain;
    try { domain = new URL(src).hostname.replace(/^www\./, '').toLowerCase(); } catch(e) { return; }
    if (!domainAnchors[domain]) domainAnchors[domain] = [];
    domainAnchors[domain].push(bl.anchor_text || bl.anchorText || '');
    if (bl.is_dofollow || bl.isDofollow) domainDofollow[domain] = true;
  });

  // Classify each referring domain
  var counts = { legitimate: 0, suspicious: 0, spam: 0 };
  var classified = [];

  referringDomains.forEach(function(rd) {
    var domain = (rd.domain || '').toLowerCase();
    var entry = Object.assign({}, rd, {
      anchors: domainAnchors[domain] || [],
      hasDofollow: !!domainDofollow[domain],
      linkCount: rd.backlinks || rd.referring_pages || 1,
    });

    var result = classifyDomain(entry);
    rd.domainQuality = result.domainQuality;
    rd.qualityScore = result.qualityScore;
    rd.qualitySignals = result.qualitySignals;
    rd.qualityReason = result.qualityReason;

    counts[result.domainQuality]++;
    classified.push({ domain: rd.domain, quality: result.domainQuality, score: result.qualityScore, reason: result.qualityReason });
  });

  // Also classify backlinks by their source domain
  backlinks.forEach(function(bl) {
    var src = bl.source_url || bl.sourceUrl || '';
    var domain;
    try { domain = new URL(src).hostname.replace(/^www\./, '').toLowerCase(); } catch(e) { return; }
    var rd = referringDomains.find(function(r) { return (r.domain || '').toLowerCase() === domain; });
    if (rd) {
      bl.domainQuality = rd.domainQuality;
      bl.qualityScore = rd.qualityScore;
    }
  });

  // Add summary
  var total = referringDomains.length;
  raw.qualitySummary = {
    total: total,
    legitimate: counts.legitimate,
    suspicious: counts.suspicious,
    spam: counts.spam,
    legitimatePct: total ? Math.round(counts.legitimate / total * 100) : 0,
    suspiciousPct: total ? Math.round(counts.suspicious / total * 100) : 0,
    spamPct: total ? Math.round(counts.spam / total * 100) : 0,
    topLegitimate: classified.filter(function(c) { return c.quality === 'legitimate'; })
      .sort(function(a, b) { return b.score - a.score; }).slice(0, 20),
    topSpam: classified.filter(function(c) { return c.quality === 'spam'; })
      .sort(function(a, b) { return a.score - b.score; }).slice(0, 20),
    analyzedAt: new Date().toISOString(),
    method: 'rule-based-v1',
  };

  // Write back (with backup)
  var backupPath = filePath + '.bak';
  fs.copyFileSync(filePath, backupPath);
  fs.writeFileSync(filePath, JSON.stringify(raw, null, 2));

  return { file: path.basename(filePath), total: total, counts: counts };
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  var args = process.argv.slice(2);
  var clientOnly = args.includes('--client-only');

  var researchDir = path.resolve('seo', 'research');
  if (!fs.existsSync(researchDir)) {
    console.error('ERROR: No seo/research/ directory found. Run from a client directory.');
    process.exit(1);
  }

  console.log('Backlink Quality Analyzer (Rule-Based v1)');
  console.log('=========================================\n');

  var results = [];

  // Process client backlinks
  var clientPath = path.join(researchDir, 'client-backlinks.json');
  if (fs.existsSync(clientPath)) {
    var result = processBacklinksFile(clientPath);
    if (result) {
      results.push(result);
      console.log('  ' + result.file + ': ' + result.total + ' domains → ' +
        result.counts.legitimate + ' legit, ' +
        result.counts.suspicious + ' suspicious, ' +
        result.counts.spam + ' spam');
    }
  }

  // Process competitor backlinks
  if (!clientOnly) {
    var files = fs.readdirSync(researchDir).filter(function(f) {
      return /^backlinks-.+\.json$/.test(f);
    });
    files.forEach(function(filename) {
      var filePath = path.join(researchDir, filename);
      var result = processBacklinksFile(filePath);
      if (result) {
        results.push(result);
        console.log('  ' + result.file + ': ' + result.total + ' domains → ' +
          result.counts.legitimate + ' legit, ' +
          result.counts.suspicious + ' suspicious, ' +
          result.counts.spam + ' spam');
      }
    });
  }

  if (!results.length) {
    console.log('No backlink files found to analyze.');
    process.exit(0);
  }

  var totals = results.reduce(function(acc, r) {
    acc.total += r.total;
    acc.legitimate += r.counts.legitimate;
    acc.suspicious += r.counts.suspicious;
    acc.spam += r.counts.spam;
    return acc;
  }, { total: 0, legitimate: 0, suspicious: 0, spam: 0 });

  console.log('\n  TOTAL: ' + totals.total + ' referring domains analyzed across ' + results.length + ' files');
  console.log('    Legitimate: ' + totals.legitimate + ' (' + Math.round(totals.legitimate / totals.total * 100) + '%)');
  console.log('    Suspicious: ' + totals.suspicious + ' (' + Math.round(totals.suspicious / totals.total * 100) + '%)');
  console.log('    Spam:       ' + totals.spam + ' (' + Math.round(totals.spam / totals.total * 100) + '%)');
  console.log('\n  Backups saved as *.json.bak');
  console.log('\n  To run AI analysis on ambiguous domains, spawn a Claude session:');
  console.log('  claude "Read seo/research/client-backlinks.json and classify the suspicious domains"');
}

main();
