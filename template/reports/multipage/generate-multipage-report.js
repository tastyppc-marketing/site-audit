#!/usr/bin/env node
/**
 * generate-multipage-report.js
 *
 * Reads audit-data.json plus the 8 multipage HTML templates, injects
 * window.AUDIT_DATA and window.SEARCH_INDEX into each page, optionally
 * inlines local CSS, then writes the report bundle to the output directory.
 *
 * Usage:
 *   node generate-multipage-report.js --data ../seo/audit-data.json --output ./dist [--inline]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PAGE_FILES = [
  'index.html',
  'keywords.html',
  'content.html',
  'technical.html',
  'links.html',
  'competitors.html',
  'local.html',
  'action-plan.html',
];

const COPY_DIRS = ['shared', 'pages', 'assets'];

const LOCAL_STYLESHEETS = [
  'shared/report-styles.css',
  'shared/multipage-nav.css',
];

const ACTION_PLAN_LABELS = {
  quickWins: 'Quick Wins',
  shortTerm: 'Short Term',
  mediumTerm: 'Medium Term',
  longTerm: 'Long Term',
};

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
    '  node generate-multipage-report.js --data <audit-data.json> --output <dir> [--inline]',
    '',
    'Flags:',
    '  --data     Path to audit-data.json',
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

  const clientName = auditData.client && (auditData.client.name || auditData.client.company || auditData.client.website);
  const baseName = `multipage-report-${slugify(clientName || 'client')}-${new Date().toISOString().slice(0, 10)}`;
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
    if (!text) return;

    const key = text.toLowerCase();
    if (seen.has(key)) return;

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

function buildSearchIndex(data) {
  const index = [];

  if (Array.isArray(data.keywords)) {
    data.keywords.forEach(function(keyword) {
      pushIndexEntry(index, {
        page: 'keywords.html',
        section: 'section-rankings',
        title: keyword.keyword || keyword.topResult,
        snippet: joinNonEmpty([
          keyword.clientRank ? `Client rank: ${keyword.clientRank}` : 'Client rank: Not found',
          keyword.competitorRank ? `Competitor rank: ${keyword.competitorRank}` : '',
          keyword.volume ? `Volume: ${keyword.volume}` : '',
          keyword.topResult ? `Top result: ${keyword.topResult}` : '',
        ]),
        terms: [
          keyword.keyword,
          keyword.clientRank,
          keyword.competitorRank,
          keyword.volume,
          keyword.topResult,
          'keyword',
          'ranking',
          'search visibility',
        ],
      });
    });
  }

  if (Array.isArray(data.topIssues)) {
    data.topIssues.forEach(function(issue) {
      pushIndexEntry(index, {
        page: 'index.html',
        section: 'section-issues',
        title: issue.issue,
        snippet: joinNonEmpty([
          issue.detail,
          issue.impact ? `Impact: ${issue.impact}` : '',
          issue.effort ? `Effort: ${issue.effort}` : '',
        ]),
        terms: [
          issue.issue,
          issue.detail,
          issue.impact,
          issue.effort,
          'issue',
          'problem',
        ],
      });
    });
  }

  if (Array.isArray(data.competitorStrategies)) {
    data.competitorStrategies.forEach(function(strategy) {
      pushIndexEntry(index, {
        page: 'competitors.html',
        section: 'section-strategies',
        title: strategy.strategy,
        snippet: strategy.detail,
        terms: [
          strategy.strategy,
          strategy.detail,
          'competitor',
          'strategy',
          'analysis',
        ],
      });
    });
  }

  if (Array.isArray(data.quickWins)) {
    data.quickWins.forEach(function(item) {
      pushIndexEntry(index, {
        page: 'index.html',
        section: 'section-quickwins',
        title: item.action,
        snippet: item.impact ? `Impact: ${item.impact}` : '',
        terms: [
          item.action,
          item.impact,
          'quick win',
          'quick wins',
        ],
      });
    });
  }

  if (data.actionPlan && typeof data.actionPlan === 'object') {
    const orderedKeys = Object.keys(ACTION_PLAN_LABELS).concat(
      Object.keys(data.actionPlan).filter(function(key) {
        return !Object.prototype.hasOwnProperty.call(ACTION_PLAN_LABELS, key);
      })
    );

    orderedKeys.forEach(function(key) {
      const items = data.actionPlan[key];
      const label = ACTION_PLAN_LABELS[key] || key;

      if (!Array.isArray(items)) return;

      items.forEach(function(item) {
        pushIndexEntry(index, {
          page: 'action-plan.html',
          section: 'section-plan',
          title: item.action || item.title,
          snippet: joinNonEmpty([
            label,
            item.why,
            item.detail,
            item.effort ? `Effort: ${item.effort}` : '',
            item.impact ? `Impact: ${item.impact}` : '',
          ]),
          terms: [
            item.action,
            item.title,
            item.why,
            item.detail,
            item.effort,
            item.impact,
            label,
            'action plan',
            'roadmap',
          ],
        });
      });
    });
  }

  if (data.contentCalendar && typeof data.contentCalendar === 'object') {
    const monthKeys = Object.keys(data.contentCalendar)
      .filter(function(key) {
        return /^month\d+$/.test(key) && Array.isArray(data.contentCalendar[key]);
      })
      .sort(function(a, b) {
        return Number(a.replace('month', '')) - Number(b.replace('month', ''));
      });

    monthKeys.forEach(function(key) {
      const items = data.contentCalendar[key];
      const label = data.contentCalendar[`${key}Label`] || key;

      items.forEach(function(item) {
        pushIndexEntry(index, {
          page: 'action-plan.html',
          section: 'section-calendar',
          title: item.topic || item.keyword || `${label} Week ${item.week || ''}`.trim(),
          snippet: joinNonEmpty([
            label,
            item.week ? `Week ${item.week}` : '',
            item.keyword ? `Keyword: ${item.keyword}` : '',
            item.type ? `Type: ${item.type}` : '',
          ]),
          terms: [
            item.topic,
            item.keyword,
            item.type,
            label,
            item.week ? `week ${item.week}` : '',
            'content calendar',
            'editorial',
          ],
        });
      });
    });
  }

  if (data.contentQuality && Array.isArray(data.contentQuality.pages)) {
    data.contentQuality.pages.forEach(function(pageEntry) {
      pushIndexEntry(index, {
        page: 'content.html',
        section: 'section-readability',
        title: pageEntry.title || pageEntry.url,
        snippet: joinNonEmpty([
          pageEntry.qualityScore !== undefined ? `Quality: ${pageEntry.qualityScore}/100` : '',
          pageEntry.readabilityScore !== undefined ? `Readability: ${pageEntry.readabilityScore}/100` : '',
          pageEntry.readability && pageEntry.readability.wordCount !== undefined
            ? `Words: ${pageEntry.readability.wordCount}`
            : '',
          pageEntry.readability && pageEntry.readability.readingLevel
            ? `Level: ${pageEntry.readability.readingLevel}`
            : '',
        ]),
        terms: [
          pageEntry.title,
          pageEntry.url,
          pageEntry.qualityScore,
          pageEntry.readabilityScore,
          pageEntry.readability && pageEntry.readability.readingLevel,
          'content',
          'readability',
          'quality',
        ],
      });
    });
  }

  if (data.internalLinking && Array.isArray(data.internalLinking.orphans)) {
    data.internalLinking.orphans.forEach(function(orphan) {
      pushIndexEntry(index, {
        page: 'links.html',
        section: 'section-orphans',
        title: orphan.url || orphan.recommendation,
        snippet: joinNonEmpty([
          orphan.outboundLinks !== undefined ? `Outbound links: ${orphan.outboundLinks}` : '',
          orphan.isInSitemap !== undefined ? `In sitemap: ${orphan.isInSitemap ? 'Yes' : 'No'}` : '',
          orphan.recommendation,
        ]),
        terms: [
          orphan.url,
          orphan.recommendation,
          orphan.outboundLinks,
          orphan.isInSitemap ? 'in sitemap' : 'not in sitemap',
          'orphan',
          'internal linking',
        ],
      });
    });
  }

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

  const dataPath = path.resolve(getArg('--data', path.join(__dirname, '..', '..', 'seo', 'audit-data.json')));
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
