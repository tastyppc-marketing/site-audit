#!/usr/bin/env node
/**
 * generate-ppc-report.js
 *
 * Reads PPC audit JSON plus the multipage PPC HTML templates, injects
 * window.AUDIT_DATA and window.SEARCH_INDEX into each page, optionally
 * inlines local CSS, then writes the report bundle to the output directory.
 *
 * Usage:
 *   node generate-ppc-report.js --data ../ppc/ppc-data.json --output ./dist [--inline]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PAGE_FILES = [
  'index.html',
  'structure.html',
  'quality-score.html',
  'wasted-spend.html',
  'search-terms.html',
  'budget.html',
  'action-plan.html',
];

const COPY_DIRS = ['shared', 'pages', 'assets'];

const LOCAL_STYLESHEETS = [
  'shared/report-styles.css',
  'shared/multipage-nav.css',
];

const args = process.argv.slice(2);

function getArg(flag, fallback) {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) return fallback;
  return args[index + 1];
}

function hasFlag(flag) {
  return args.includes(flag);
}

function printUsage() {
  console.log([
    'Usage:',
    '  node generate-ppc-report.js --data <ppc-data.json> --output <dir> [--inline]',
    '',
    'Flags:',
    '  --data     Path to PPC audit JSON',
    '  --output   Directory to write the generated report bundle',
    '  --inline   Inline shared CSS into each HTML page',
  ].join('\n'));
}

function exitWithError(message) {
  console.error(`\x1b[31mError:\x1b[0m ${message}`);
  process.exit(1);
}

function logInfo(label, value) {
  console.log(`\x1b[36m${label}:\x1b[0m ${value}`);
}

function logSuccess(label, value) {
  console.log(`\x1b[32m${label}:\x1b[0m ${value}`);
}

function logWarning(message) {
  console.warn(`\x1b[33mWarning:\x1b[0m ${message}`);
}

function slugify(value) {
  return String(value || 'report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function inferOutputDir(dataPath, auditData) {
  const explicitOutput = getArg('--output', '');
  if (explicitOutput) {
    return path.resolve(explicitOutput);
  }

  const client = auditData && auditData.client ? auditData.client : {};
  const clientName = client.name || client.company || client.website;
  const baseName = `multipage-ppc-report-${slugify(clientName || 'client')}-${new Date().toISOString().slice(0, 10)}`;
  return path.join(path.dirname(dataPath), baseName);
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    exitWithError(`Unable to parse JSON file ${filePath}: ${error.message}`);
  }
}

function ensureFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    exitWithError(`${label} not found: ${filePath}`);
  }
}

function toText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ');
  return '';
}

function joinNonEmpty(parts) {
  return parts.map(toText).filter(Boolean).join(' | ');
}

function uniqueStrings(values) {
  const seen = new Set();
  const list = [];

  values.forEach(function(value) {
    const text = toText(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return;
    seen.add(key);
    list.push(text);
  });

  return list;
}

function pushIndexEntry(index, entry) {
  const title = toText(entry.title);
  const snippet = toText(entry.snippet);

  if (!entry.page || !entry.section || (!title && !snippet)) {
    return;
  }

  index.push({
    page: entry.page,
    section: entry.section,
    title: title || snippet,
    snippet: snippet || '',
    terms: uniqueStrings(entry.terms || []),
  });
}

function getAuditRoot(data) {
  return data && data.ppcAudit && typeof data.ppcAudit === 'object' ? data.ppcAudit : (data || {});
}

function indexChecks(index, checks, page, section, extraTerms) {
  (Array.isArray(checks) ? checks : []).forEach(function(check) {
    pushIndexEntry(index, {
      page: page,
      section: section,
      title: check.name || check.id,
      snippet: joinNonEmpty([
        check.detail,
        check.status ? `Status: ${check.status}` : '',
        check.severity ? `Severity: ${check.severity}` : '',
      ]),
      terms: [
        check.id,
        check.name,
        check.detail,
        check.status,
        check.severity,
      ].concat(extraTerms || []),
    });
  });
}

function buildSearchIndex(data) {
  const index = [];
  const audit = getAuditRoot(data);
  const recommendations = Array.isArray(audit.recommendations) ? audit.recommendations : [];
  const ngram = audit.ngramAnalysis || {};
  const wasted = audit.wastedSpend || {};
  const structure = audit.structure || {};
  const quality = audit.qualityScore || {};
  const budget = audit.budgetBidding || {};

  recommendations.forEach(function(rec) {
    const section = rec.checkId === 'WS-09'
      ? 'section-negatives-add'
      : rec.severity === 'critical'
      ? 'section-critical'
      : rec.severity === 'high'
      ? 'section-high'
      : 'section-medium';

    pushIndexEntry(index, {
      page: 'action-plan.html',
      section: section,
      title: rec.name,
      snippet: joinNonEmpty([
        rec.detail,
        rec.severity ? `Severity: ${rec.severity}` : '',
        rec.priority != null ? `Priority: ${rec.priority}` : '',
      ]),
      terms: [
        rec.checkId,
        rec.name,
        rec.detail,
        rec.severity,
        rec.category,
        rec.priority,
        'recommendation',
        'action plan',
      ],
    });
  });

  indexChecks(index, structure.checks, 'structure.html', 'section-adgroups', ['structure', 'campaign', 'match type']);
  indexChecks(index, quality.checks, 'quality-score.html', 'section-components', ['quality score', 'qs']);
  indexChecks(index, wasted.checks, 'wasted-spend.html', 'section-summary', ['wasted spend', 'zero conversion']);
  indexChecks(index, budget.checks, 'budget.html', 'section-pacing', ['budget', 'bidding']);

  (Array.isArray(ngram.topNgrams) ? ngram.topNgrams : []).forEach(function(row) {
    pushIndexEntry(index, {
      page: 'search-terms.html',
      section: 'section-ngrams',
      title: row.ngram,
      snippet: joinNonEmpty([
        row.cost != null ? `Cost: $${row.cost}` : '',
        row.clicks != null ? `Clicks: ${row.clicks}` : '',
        row.conversions != null ? `Conversions: ${row.conversions}` : '',
        row.cpa != null ? `CPA: $${row.cpa}` : '',
      ]),
      terms: [
        row.ngram,
        row.wordCount,
        row.impressions,
        row.clicks,
        row.cost,
        row.conversions,
        row.cpa,
        'ngram',
        'search terms',
      ],
    });
  });

  (Array.isArray(ngram.negativeCandidates) ? ngram.negativeCandidates : []).forEach(function(row) {
    pushIndexEntry(index, {
      page: 'search-terms.html',
      section: 'section-negatives',
      title: row.ngram,
      snippet: joinNonEmpty([
        row.reason,
        row.recommendedMatchType ? `Recommended match: ${row.recommendedMatchType}` : '',
        row.cost != null ? `Cost: $${row.cost}` : '',
      ]),
      terms: [
        row.ngram,
        row.reason,
        row.recommendedMatchType,
        row.cost,
        row.clicks,
        'negative keyword',
      ],
    });
  });

  (Array.isArray(wasted.wastedItems) ? wasted.wastedItems : []).forEach(function(item) {
    pushIndexEntry(index, {
      page: 'wasted-spend.html',
      section: item.type === 'zero_conversion_keyword' ? 'section-zero-conv' : 'section-overspending',
      title: item.keyword,
      snippet: joinNonEmpty([
        item.type,
        item.cost != null ? `Cost: $${item.cost}` : '',
        item.clicks != null ? `Clicks: ${item.clicks}` : '',
      ]),
      terms: [
        item.keyword,
        item.type,
        item.cost,
        item.clicks,
        item.severity,
        'keyword',
        'waste',
      ],
    });
  });

  (Array.isArray(data.keywords) ? data.keywords : []).forEach(function(keyword) {
    pushIndexEntry(index, {
      page: 'quality-score.html',
      section: 'section-top-spenders',
      title: keyword.keyword || keyword.keyword_text || keyword.keywordText,
      snippet: joinNonEmpty([
        keyword.match_type || keyword.matchType ? `Match: ${keyword.match_type || keyword.matchType}` : '',
        keyword.quality_score != null || keyword.qualityScore != null ? `QS: ${keyword.quality_score != null ? keyword.quality_score : keyword.qualityScore}` : '',
        keyword.cost != null ? `Cost: $${keyword.cost}` : '',
      ]),
      terms: [
        keyword.keyword,
        keyword.keyword_text,
        keyword.keywordText,
        keyword.match_type,
        keyword.matchType,
        keyword.quality_score,
        keyword.qualityScore,
        keyword.cost,
        'keyword',
      ],
    });
  });

  (Array.isArray(data.searchTerms) ? data.searchTerms : []).forEach(function(row) {
    pushIndexEntry(index, {
      page: 'search-terms.html',
      section: 'section-top-terms',
      title: row.search_term || row.searchTerm || row.query,
      snippet: joinNonEmpty([
        row.campaign || row.campaignName,
        row.cost != null ? `Cost: $${row.cost}` : '',
        row.clicks != null ? `Clicks: ${row.clicks}` : '',
        row.conversions != null ? `Conversions: ${row.conversions}` : '',
      ]),
      terms: [
        row.search_term,
        row.searchTerm,
        row.query,
        row.campaign,
        row.campaignName,
        row.cost,
        row.clicks,
        row.conversions,
        'search term',
      ],
    });
  });

  return index;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacePlaceholder(html, pattern, replacement, fileName, placeholderName) {
  const updated = html.replace(pattern, function() {
    return replacement;
  });
  if (updated === html) {
    exitWithError(`Placeholder ${placeholderName} not found in ${fileName}`);
  }
  return updated;
}

function inlineCss(html, stylesByHref) {
  let output = html;
  const pendingBlocks = [];

  Object.keys(stylesByHref).forEach(function(href) {
    const css = stylesByHref[href];
    const styleBlock = `<style data-inline-source="${href}">\n${css}\n</style>`;
    const linkPattern = new RegExp(`<link\\b(?=[^>]*href=["']${escapeRegExp(href)}["'])[^>]*>\\s*`, 'i');

    if (linkPattern.test(output)) {
      output = output.replace(linkPattern, function() {
        return `${styleBlock}\n`;
      });
    } else {
      pendingBlocks.push(styleBlock);
    }
  });

  if (pendingBlocks.length > 0) {
    if (/<\/head>/i.test(output)) {
      output = output.replace(/<\/head>/i, function() {
        return `${pendingBlocks.join('\n')}\n</head>`;
      });
    } else {
      output = `${pendingBlocks.join('\n')}\n${output}`;
    }
  }

  return output;
}

function copyDirectory(sourceDir, destinationDir) {
  if (!fs.existsSync(sourceDir)) {
    logWarning(`Skipping missing directory: ${sourceDir}`);
    return;
  }

  if (path.resolve(sourceDir) === path.resolve(destinationDir)) {
    return;
  }

  fs.mkdirSync(destinationDir, { recursive: true });

  fs.readdirSync(sourceDir, { withFileTypes: true }).forEach(function(entry) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
      return;
    }

    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  });
}

function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    printUsage();
    return;
  }

  const dataPath = path.resolve(getArg('--data', path.join(__dirname, '..', '..', 'ppc', 'ppc-data.json')));
  const wantInline = hasFlag('--inline');

  ensureFileExists(dataPath, 'Data file');

  logInfo('Reading data', dataPath);
  const auditData = readJsonFile(dataPath);
  const outputDir = inferOutputDir(dataPath, auditData);

  const templates = PAGE_FILES.map(function(fileName) {
    const templatePath = path.join(__dirname, fileName);
    ensureFileExists(templatePath, 'HTML template');

    return {
      fileName: fileName,
      templatePath: templatePath,
      html: fs.readFileSync(templatePath, 'utf-8'),
    };
  });

  logInfo('Building search index', `${PAGE_FILES.length} HTML pages`);
  const searchIndex = buildSearchIndex(auditData);
  const auditJson = JSON.stringify(auditData);
  const searchJson = JSON.stringify(searchIndex);

  let stylesByHref = null;
  if (wantInline) {
    stylesByHref = {};

    LOCAL_STYLESHEETS.forEach(function(href) {
      const stylePath = path.join(__dirname, href);
      ensureFileExists(stylePath, 'Stylesheet');
      stylesByHref[href] = fs.readFileSync(stylePath, 'utf-8');
    });
  }

  fs.mkdirSync(outputDir, { recursive: true });
  logInfo('Writing report bundle', outputDir);

  templates.forEach(function(template) {
    let html = template.html;

    html = replacePlaceholder(
      html,
      /\/\*\s*__AUDIT_DATA_PLACEHOLDER__\s*\*\/null/,
      auditJson,
      template.fileName,
      '__AUDIT_DATA_PLACEHOLDER__'
    );

    html = replacePlaceholder(
      html,
      /\/\*\s*__SEARCH_INDEX_PLACEHOLDER__\s*\*\/\[\]/,
      searchJson,
      template.fileName,
      '__SEARCH_INDEX_PLACEHOLDER__'
    );

    if (wantInline) {
      html = inlineCss(html, stylesByHref);
    }

    const outputPath = path.join(outputDir, template.fileName);
    fs.writeFileSync(outputPath, html, 'utf-8');
    logSuccess('  HTML written', outputPath);
  });

  COPY_DIRS.forEach(function(dirName) {
    const sourceDir = path.join(__dirname, dirName);
    const destinationDir = path.join(outputDir, dirName);

    copyDirectory(sourceDir, destinationDir);
    if (fs.existsSync(sourceDir)) {
      logSuccess('  Copied', `${sourceDir} -> ${destinationDir}`);
    }
  });

  console.log(`\n\x1b[90mSearch index entries: ${searchIndex.length}\x1b[0m`);
  if (wantInline) {
    console.log('\x1b[90mShared CSS was inlined into each HTML page.\x1b[0m');
  }
}

try {
  main();
} catch (error) {
  exitWithError(error.message);
}
