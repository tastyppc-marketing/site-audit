#!/usr/bin/env node
/**
 * generate-multipage-report.js
 *
 * Reads audit-data.json plus the 9 multipage HTML templates, injects
 * window.AUDIT_DATA and window.SEARCH_INDEX into each page, optionally
 * inlines local CSS, then writes the report bundle to the output directory.
 *
 * Usage:
 *   node generate-multipage-report.js --data ../seo/audit-data.json --output ./dist [--inline]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  makeResearchLoader,
  mergeLegacyPagespeed,
  mergeLegacyGsc,
  mergeLegacyGa4,
  mergeLegacyKeywords,
} = require('./lib/load-research');

const PAGE_FILES = [
  'index.html',
  'keywords.html',
  'content.html',
  'technical.html',
  'links.html',
  'backlink-opportunities.html',
  'competitors.html',
  'local.html',
  'action-plan.html',
];

const COPY_DIRS = ['shared', 'pages', 'assets'];

const LOCAL_STYLESHEETS = [
  'shared/tailwind.css',
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
    '  --inline   Inline shared CSS and JS into each HTML page (recommended for file:// viewing)',
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

/**
 * deepCamelCaseKeys — recursively converts all snake_case object keys to camelCase.
 * Mutates the object in place. Skips keys starting with '_' (internal).
 * Only converts keys containing underscores (e.g., performance_score → performanceScore).
 */
function deepCamelCaseKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    obj.forEach(function(item) { deepCamelCaseKeys(item); });
    return obj;
  }
  Object.keys(obj).forEach(function(key) {
    var value = obj[key];
    // Recurse into nested objects/arrays first
    if (value && typeof value === 'object') {
      deepCamelCaseKeys(value);
    }
    // Convert snake_case keys (skip internal keys starting with _)
    if (key.indexOf('_') > 0 && key.charAt(0) !== '_') {
      var camelKey = key.replace(/_([a-z0-9])/g, function(m, ch) { return ch.toUpperCase(); });
      if (camelKey !== key && !Object.prototype.hasOwnProperty.call(obj, camelKey)) {
        obj[camelKey] = obj[key];
        delete obj[key];
      }
    }
  });
  return obj;
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

  // Backlink opportunities
  if (data.backlinkOpportunities) {
    const boData = data.backlinkOpportunities;

    if (Array.isArray(boData.opportunities)) {
      boData.opportunities.forEach(function(opp) {
        pushIndexEntry(index, {
          page: 'backlink-opportunities.html',
          section: 'section-opportunities',
          title: opp.domain || opp.url || opp.source || '',
          snippet: joinNonEmpty([
            opp.type ? `Type: ${opp.type}` : '',
            opp.domainRating ? `Authority Score: ${opp.domainRating}` : '',
            opp.traffic ? `Traffic: ${opp.traffic}` : '',
            opp.reason || opp.description || '',
          ]),
          terms: [
            opp.domain,
            opp.url,
            opp.source,
            opp.type,
            opp.reason,
            opp.description,
            'backlink',
            'opportunity',
            'link building',
          ],
        });
      });
    }

    if (Array.isArray(boData.competitors)) {
      boData.competitors.forEach(function(comp) {
        pushIndexEntry(index, {
          page: 'backlink-opportunities.html',
          section: 'section-competitor-comparison',
          title: comp.domain || '',
          snippet: joinNonEmpty([
            comp.backlinks ? `Backlinks: ${comp.backlinks}` : '',
            comp.referringDomains ? `Referring domains: ${comp.referringDomains}` : '',
            comp.domainRating ? `Authority Score: ${comp.domainRating}` : '',
          ]),
          terms: [
            comp.domain,
            'competitor',
            'backlink',
            'authority score',
            'referring domains',
          ],
        });
      });
    }
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

function inlineJs(html, templateDir) {
  // Replace local <script defer src="shared/..."> and <script defer src="pages/...">
  // with inline <script> blocks.  Skip external CDN scripts.
  return html.replace(
    /<script\b([^>]*)\bsrc=["']((shared|pages)\/[^"']+)["']([^>]*)><\/script>\s*/gi,
    function (match, pre, src) {
      var scriptPath = path.join(templateDir, src);
      if (!fs.existsSync(scriptPath)) {
        logWarning('Inline JS: file not found', scriptPath);
        return match;
      }
      var js = fs.readFileSync(scriptPath, 'utf-8');
      return '<script data-inline-source="' + src + '">\n' + js + '\n</script>\n';
    }
  );
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

/**
 * normalizeAuditData — reshape audit-data.json so every renderer in
 * technical.js (and other page JS) finds data where it expects it.
 *
 * This runs once at generate time so individual audit pipelines don't
 * need to know the exact shape the HTML renderers expect.
 *
 * Mutations are applied in-place on `data`.  The function also accepts
 * `dataDir` (directory containing audit-data.json) so it can auto-discover
 * sibling research files (e.g. crawl-data.json, pagespeed-data.json).
 */
function normalizeAuditData(data, dataDir) {
  // Convert all snake_case keys to camelCase before any section-specific normalization
  deepCamelCaseKeys(data);

  const tech = data.technicalSeo || (data.technicalSeo = {});
  let fixes = 0;
  // bd i57: canonical-first research loader; legacy Python filenames are temporary fallback.
  const researchRoot = path.join(dataDir, 'research');
  const researchLoader = makeResearchLoader({ warn: logWarning, info: logInfo });
  const PSI_SPEC = {
    canonical: 'pagespeed-data.json',
    legacy: ['pagespeed.json', 'pagespeed-interior.json'],
    mergeLegacy: mergeLegacyPagespeed,
  };
  const GSC_SPEC = {
    canonical: 'search-console.json',
    legacy: ['gsc-pages.json', 'gsc-queries.json', 'gsc-devices.json', 'gsc-query-pages.json'],
    mergeLegacy: mergeLegacyGsc,
  };
  const GA4_SPEC = {
    canonical: 'ga4-data.json',
    legacy: ['ga4-acquisition.json', 'ga4-devices.json', 'ga4-landing-pages.json', 'ga4-page-performance.json'],
    mergeLegacy: mergeLegacyGa4,
  };
  const KW_RESEARCH_SPEC = {
    canonical: 'keyword-research.json',
    legacy: ['keyword-suggestions.json'],
    mergeLegacy: mergeLegacyKeywords,
  };
  data.apiErrors = data.apiErrors || [];
  const clientWebsite = toText(data.client && (data.client.websiteUrl || data.client.website));
  let clientBaseUrl = null;

  if (clientWebsite) {
    try {
      clientBaseUrl = new URL(/^https?:\/\//i.test(clientWebsite) ? clientWebsite : `https://${clientWebsite}`);
    } catch (error) {
      clientBaseUrl = null;
    }
  }

  function urlVariants(value) {
    const text = toText(value);
    const seen = new Set();
    const variants = [];

    function addVariant(candidate) {
      const normalized = toText(candidate);
      if (!normalized) return;

      const finalValue = normalized.length > 1
        ? normalized.replace(/\/+$/, '')
        : normalized;

      if (!finalValue || seen.has(finalValue)) return;
      seen.add(finalValue);
      variants.push(finalValue);
    }

    if (!text) return variants;

    addVariant(text);

    try {
      const parsed = clientBaseUrl ? new URL(text, clientBaseUrl) : new URL(text);
      addVariant(parsed.toString());
      addVariant(`${parsed.origin}${parsed.pathname || '/'}`);
      addVariant(parsed.pathname || '/');
    } catch (error) {
      if (text.charAt(0) === '/') {
        addVariant(text === '/' ? '/' : text);
      }
    }

    return variants;
  }

  function buildUrlLookup(entries) {
    const lookup = new Map();

    (Array.isArray(entries) ? entries : []).forEach(function(entry) {
      if (!entry || typeof entry !== 'object') return;

      urlVariants(entry.url).forEach(function(variant) {
        if (!lookup.has(variant)) {
          lookup.set(variant, entry);
        }
      });
    });

    return lookup;
  }

  function findByUrl(lookup, value) {
    const variants = urlVariants(value);
    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      if (lookup.has(variant)) {
        return lookup.get(variant);
      }
    }
    return null;
  }

  function toRelativeUrl(value) {
    const text = toText(value);
    if (!text) return '';

    try {
      const parsed = clientBaseUrl ? new URL(text, clientBaseUrl) : new URL(text);
      if (!clientBaseUrl || parsed.origin === clientBaseUrl.origin) {
        return parsed.pathname || '/';
      }
      return parsed.toString();
    } catch (error) {
      return text;
    }
  }

  function buildReadabilityExplanation(page) {
    if (!page || typeof page !== 'object') return '';

    const parts = [];
    if (page.fleschReadingEase != null) {
      const score = Number(page.fleschReadingEase);
      let level = 'Very difficult';
      if (score >= 90) level = 'Very easy';
      else if (score >= 80) level = 'Easy';
      else if (score >= 70) level = 'Fairly easy';
      else if (score >= 60) level = 'Standard';
      else if (score >= 50) level = 'Fairly difficult';
      else if (score >= 30) level = 'Difficult';
      parts.push(`Flesch Reading Ease ${score.toFixed(1)} (${level})`);
    }
    if (page.fleschKincaidGrade != null) {
      parts.push(`Grade level ${Number(page.fleschKincaidGrade).toFixed(1)}`);
    }
    if (page.avgSentenceLength != null) {
      parts.push(`Average sentence length ${Number(page.avgSentenceLength).toFixed(1)} words`);
    }
    if (page.wordCount != null) {
      parts.push(`Word count ${Number(page.wordCount).toLocaleString()}`);
    }
    return parts.join(' | ');
  }

  function normalizeDomain(value) {
    const text = toText(value);
    if (!text) return '';

    try {
      const parsed = /^https?:\/\//i.test(text) ? new URL(text) : new URL(`https://${text}`);
      return parsed.hostname.replace(/^www\./i, '').toLowerCase();
    } catch (error) {
      return text.replace(/^https?:\/\//i).replace(/\/.*$/, '').replace(/^www\./i, '').toLowerCase();
    }
  }

  function parseKeywordRank(value) {
    const text = toText(value);
    if (!text) return null;
    if (/not\s*found|n\/a|^-$|^w\/r$/i.test(text)) return null;
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  function propagateApiErrors(source, payload) {
    if (!payload || typeof payload !== 'object') return;
    const errors = Array.isArray(payload.errors) ? payload.errors : [];
    const status = typeof payload.status === 'string' ? payload.status : null;
    const hasErrorStatus = status === 'partial' || status === 'failed' || status === 'error';
    if (!errors.length && !hasErrorStatus) return;

    const entry = {
      source: source,
      status: status || (errors.length ? 'partial' : 'failed'),
      errors: errors,
    };
    if (typeof payload.gatheredAt === 'string' && payload.gatheredAt) {
      entry.gatheredAt = payload.gatheredAt;
    }

    // Store in array (for iteration) and remove any previous entry for same source
    const idx = data.apiErrors.findIndex(function (e) { return e && e.source === source; });
    if (idx >= 0) { data.apiErrors[idx] = entry; } else { data.apiErrors.push(entry); }

    if (errors.length) {
      logWarning(source + ' has API errors', errors.length + ' error(s): ' + (errors[0].reason || errors[0].message || JSON.stringify(errors[0])));
    }
    if (status === 'failed') {
      logWarning(source + ' FAILED', 'All API calls failed — section will show error details in report');
    }
  }

  // ── 0. Keywords — merge numeric volumes from keyword-volumes.json ──
  if (Array.isArray(data.keywords) && data.keywords.length) {
    const kvPath = path.join(dataDir, 'research', 'keyword-volumes.json');
    if (fs.existsSync(kvPath)) {
      try {
        const kvRaw = JSON.parse(fs.readFileSync(kvPath, 'utf-8'));
        propagateApiErrors('keyword-volumes.json', kvRaw);
        const kvEntries = Array.isArray(kvRaw) ? kvRaw
          : (Array.isArray(kvRaw.data) ? kvRaw.data : []);

        if (kvEntries.length) {
          const normalizeKeyword = function (value) {
            return typeof value === 'string' ? value.trim().toLowerCase() : '';
          };
          const volumesByKeyword = new Map();

          kvEntries.forEach(function (entry) {
            const key = normalizeKeyword(entry && entry.keyword);
            if (!key || volumesByKeyword.has(key)) return;
            volumesByKeyword.set(key, entry);
          });

          let mergedKeywordVolumes = 0;
          data.keywords.forEach(function (keyword) {
            if (!keyword || typeof keyword !== 'object') return;
            const match = volumesByKeyword.get(normalizeKeyword(keyword.keyword));
            if (!match) return;

            const nextVolume = match.volume != null ? match.volume
              : (match.search_volume != null ? match.search_volume : null);
            if (nextVolume == null || keyword.volume === nextVolume) return;

            keyword.volume = nextVolume;
            mergedKeywordVolumes++;
          });

          if (mergedKeywordVolumes) {
            logInfo('Merged keyword volumes', mergedKeywordVolumes + ' keywords from keyword-volumes.json');
            fixes++;
          }
        }
      } catch (err) { logWarning('Failed to parse keyword-volumes.json', err.message); }
    }

    data.keywords.forEach(function(keyword) {
      if (!keyword || typeof keyword !== 'object') return;

      if (keyword.clientRankValue == null) {
        keyword.clientRankValue = parseKeywordRank(keyword.clientRank);
      }
      if (keyword.competitorRankValue == null) {
        keyword.competitorRankValue = parseKeywordRank(keyword.competitorRank);
      }
    });
  }

  // ── 1. Core Web Vitals ──────────────────────────────────────────────
  // Renderer reads data.coreWebVitals (top-level), with .mobile.score
  // and .desktop.score.  Data pipelines often put it under technicalSeo
  // and use "performanceScore" instead of "score".
  if (!data.coreWebVitals && tech.coreWebVitals) {
    data.coreWebVitals = tech.coreWebVitals;
    fixes++;
  }
  if (data.coreWebVitals) {
    ['mobile', 'desktop'].forEach(function (device) {
      const d = data.coreWebVitals[device];
      if (d && d.performanceScore != null && d.score == null) {
        d.score = d.performanceScore;
        fixes++;
      }
    });
  }

  // ── 2. Lighthouse results ───────────────────────────────────────────
  // Renderer reads data.technicalSeo.lighthouseResults as an ARRAY of
  // { url, strategy, performanceScore, lcp, cls, fcp, inp, ttfb,
  //   speedIndex, opportunities[], diagnostics[] }.
  // Data pipelines may produce a dict: { clientPages: [...], avgClientMobile, avgClientDesktop }
  // with per-page objects keyed mobileScore/desktopScore, or may use
  // snake_case from the PSI API.
  const lr = tech.lighthouseResults;
  if (lr && !Array.isArray(lr) && typeof lr === 'object' && Array.isArray(lr.clientPages)) {
    const expanded = [];
    lr.clientPages.forEach(function (page) {
      const url = page.url || '';
      ['mobile', 'desktop'].forEach(function (strategy) {
        // Strategy data may be nested (page.mobile) or flat (page.mobileScore)
        const nested = page[strategy];
        const hasNested = nested && typeof nested === 'object';
        const scoreKey = strategy + 'Score';
        const score = hasNested
          ? (nested.performance_score != null ? nested.performance_score : nested.performanceScore)
          : page[scoreKey];
        if (score == null) return;

        const src = hasNested ? nested : {};
        expanded.push({
          url: src.url || url,
          strategy: strategy,
          performanceScore: score,
          lcp:        src.lcp        != null ? src.lcp        : page[strategy + 'Lcp'],
          cls:        src.cls        != null ? src.cls        : page[strategy + 'Cls'],
          fcp:        src.fcp        != null ? src.fcp        : page[strategy + 'Fcp'],
          inp:        src.inp        != null ? src.inp        : page[strategy + 'Inp'],
          ttfb:       src.ttfb       != null ? src.ttfb       : page[strategy + 'Ttfb'],
          speedIndex: src.speed_index != null ? src.speed_index : (src.speedIndex != null ? src.speedIndex : page[strategy + 'SpeedIndex']),
          opportunities: Array.isArray(src.opportunities)
            ? src.opportunities.map(function (o) {
                return { title: o.title || o.id || '', savings: o.savings_ms || o.savings || 0 };
              }).filter(function (o) { return o.savings > 0; })
            : [],
          diagnostics: [],
        });
      });
    });
    tech.lighthouseResults = expanded;
    fixes++;
  }

  // If lighthouseResults is still missing, try to build from pagespeed-data.json
  if (!Array.isArray(tech.lighthouseResults) || !tech.lighthouseResults.length) {
    const psi = researchLoader.load(researchRoot, PSI_SPEC);
    if (psi) {
      try {
        propagateApiErrors('pagespeed-data.json', psi);
        const rawClientPages = (psi.data && Array.isArray(psi.data.client)) ? psi.data.client : [];
        const expectedClientDomain = normalizeDomain(data.client && (data.client.websiteUrl || data.client.website));
        const clientPages = rawClientPages.filter(function(entry) {
          const entryDomain = normalizeDomain((entry && (entry.domain || entry.url)) || '');
          return !!entryDomain && entryDomain === expectedClientDomain;
        });

        if (!clientPages.length && rawClientPages.length) {
          logWarning(
            'pagespeed-data.json client domain mismatch',
            'Expected ' + (expectedClientDomain || 'unknown') + ' but found ' +
              rawClientPages.map(function(entry) {
                return normalizeDomain((entry && (entry.domain || entry.url)) || '') || 'unknown';
              }).filter(Boolean).join(', ') +
              '. Skipping PSI client auto-population.'
          );
        }

        const expanded = [];
        clientPages.forEach(function (entry) {
          ['mobile', 'desktop'].forEach(function (strategy) {
            const s = entry[strategy];
            if (!s) return;
            expanded.push({
              url: s.url || entry.url || '',
              strategy: strategy,
              performanceScore: s.performance_score != null ? s.performance_score : s.performanceScore,
              lcp: s.lcp, cls: s.cls, fcp: s.fcp, inp: s.inp, ttfb: s.ttfb,
              speedIndex: s.speed_index != null ? s.speed_index : s.speedIndex,
              opportunities: Array.isArray(s.opportunities)
                ? s.opportunities.map(function (o) {
                    return { title: o.title || o.id || '', savings: o.savings_ms || o.savings || 0 };
                  }).filter(function (o) { return o.savings > 0; })
                : [],
              diagnostics: [],
            });
          });
        });
        if (expanded.length) {
          tech.lighthouseResults = expanded;
          logInfo('Auto-populated lighthouseResults', `${expanded.length} entries from pagespeed-data.json`);
          fixes++;
        }
        // Also populate coreWebVitals from PSI client data
        if (!tech.coreWebVitals || (tech.coreWebVitals.mobile && tech.coreWebVitals.mobile.performanceScore == null)) {
          const clientEntry = clientPages[0];
          if (clientEntry && (clientEntry.mobile || clientEntry.desktop)) {
            tech.coreWebVitals = {};
            ['mobile', 'desktop'].forEach(function (device) {
              const s = clientEntry[device];
              if (!s) return;
              tech.coreWebVitals[device] = {
                performanceScore: s.performanceScore != null ? s.performanceScore : s.performance_score,
                score: s.performanceScore != null ? s.performanceScore : s.performance_score,
                lcp: s.lcp, fcp: s.fcp, cls: s.cls, inp: s.inp, ttfb: s.ttfb,
                speedIndex: s.speedIndex != null ? s.speedIndex : s.speed_index,
                opportunities: s.opportunities || [],
              };
            });
            logInfo('Auto-populated coreWebVitals', 'from pagespeed-data.json client entry');
            fixes++;
          }
        }

        // Also populate pageSpeedComparison from all PSI domains
        const allPsiDomains = [].concat(clientPages, (psi.data && Array.isArray(psi.data.competitors)) ? psi.data.competitors : []);
        if (allPsiDomains.length > 1 && (!data.pageSpeedComparison || data.pageSpeedComparison.every(function (e) { return e.score == null; }))) {
          data.pageSpeedComparison = allPsiDomains.map(function (entry) {
            const mob = entry.mobile ? (entry.mobile.performanceScore != null ? entry.mobile.performanceScore : entry.mobile.performance_score) : null;
            const desk = entry.desktop ? (entry.desktop.performanceScore != null ? entry.desktop.performanceScore : entry.desktop.performance_score) : null;
            const scores = [mob, desk].filter(function (s) { return s != null; });
            let avg = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : null;
            if (avg != null && avg <= 1) avg = Math.round(avg * 100);
            const isClient = clientPages.indexOf(entry) !== -1;
            return { name: (entry.domain || '') + (isClient ? ' (Client)' : ''), score: avg };
          });
          logInfo('Auto-populated pageSpeedComparison', allPsiDomains.length + ' domains from pagespeed-data.json');
          fixes++;
        }

        // Also populate competitorAnalysis.pageSpeedComparison
        if (allPsiDomains.length > 1) {
          const ca = data.competitorAnalysis || (data.competitorAnalysis = {});
          if (!ca.pageSpeedComparison || ca.pageSpeedComparison.every(function (e) { return e.mobileScore == null; })) {
            ca.pageSpeedComparison = allPsiDomains.map(function (entry) {
              const isClient = clientPages.indexOf(entry) !== -1;
              return {
                domain: entry.domain || '',
                mobileScore: entry.mobile ? (entry.mobile.performanceScore != null ? entry.mobile.performanceScore : entry.mobile.performance_score) : null,
                desktopScore: entry.desktop ? (entry.desktop.performanceScore != null ? entry.desktop.performanceScore : entry.desktop.performance_score) : null,
                isClient: isClient,
              };
            });
            logInfo('Auto-populated competitorAnalysis.pageSpeedComparison', allPsiDomains.length + ' domains');
            fixes++;
          }
        }
      } catch (err) { logWarning('Failed to parse pagespeed-data.json', err.message); }
    }
  }

  // ── 1a. Re-run CWV hoisting after PSI auto-population ─────────────
  // The first CWV copy (step 1) may have copied null-valued CWV from
  // audit-data.json before PSI data was loaded. If tech.coreWebVitals
  // now has real values (from PSI), overwrite the null-valued copy.
  if (tech.coreWebVitals && tech.coreWebVitals.mobile && tech.coreWebVitals.mobile.performanceScore != null) {
    data.coreWebVitals = tech.coreWebVitals;
    fixes++;
  }
  if (data.coreWebVitals) {
    ['mobile', 'desktop'].forEach(function (device) {
      var d = data.coreWebVitals[device];
      if (d && d.performanceScore != null && d.score == null) {
        d.score = d.performanceScore;
        fixes++;
      }
    });
  }


  // ── 3. PageSpeed comparison ─────────────────────────────────────────
  // Renderer reads data.pageSpeedComparison (top-level) as [{ name, score }].
  // Data pipelines may put it under technicalSeo or competitorAnalysis,
  // using { domain, mobileScore, desktopScore }.
  // Prefer competitorAnalysis version (has per-domain scores) over
  // technicalSeo version (may have stale/duplicated client-only scores).
  if (!data.pageSpeedComparison) {
    const caPsc = data.competitorAnalysis && Array.isArray(data.competitorAnalysis.pageSpeedComparison)
      ? data.competitorAnalysis.pageSpeedComparison : null;
    const techPsc = tech.pageSpeedComparison;

    // Detect stale technicalSeo data: if all non-client entries have identical
    // mobileScore/desktopScore as the client, the data was copy-pasted wrong
    let useCompAnalysis = false;
    if (caPsc && caPsc.length && Array.isArray(techPsc) && techPsc.length) {
      const clientEntry = techPsc.find(function (e) { return e.isClient; });
      if (clientEntry) {
        const allSame = techPsc.every(function (e) {
          return e.mobileScore === clientEntry.mobileScore && e.desktopScore === clientEntry.desktopScore;
        });
        if (allSame && techPsc.length > 1) useCompAnalysis = true;
      }
    }

    if (useCompAnalysis || (!techPsc && caPsc)) {
      data.pageSpeedComparison = caPsc;
      if (useCompAnalysis) logWarning('technicalSeo.pageSpeedComparison had identical scores for all domains — using competitorAnalysis version instead');
    } else if (techPsc) {
      data.pageSpeedComparison = techPsc;
    }
    if (data.pageSpeedComparison) fixes++;
  }
  if (Array.isArray(data.pageSpeedComparison) && data.pageSpeedComparison.length) {
    const first = data.pageSpeedComparison[0];
    if (first.domain && first.name == null) {
      data.pageSpeedComparison = data.pageSpeedComparison.map(function (entry) {
        if (entry.name != null) return entry; // already in correct format
        const mob = entry.mobileScore != null ? Number(entry.mobileScore) : null;
        const desk = entry.desktopScore != null ? Number(entry.desktopScore) : null;
        const scores = [mob, desk].filter(function (s) { return s != null; });
        let avg = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : null;
        if (avg != null && avg <= 1) avg = Math.round(avg * 100);
        let name = entry.domain || '';
        if (entry.isClient) name += ' (Client)';
        return { name: name, score: avg };
      });
      fixes++;
    }
  }

  // ── 3a. Rank history — transpose snapshot-based rankings into keyword-centric history ──
  if (data.rankHistory && typeof data.rankHistory === 'object') {
    const rh = data.rankHistory;
    const snapshots = Array.isArray(rh.snapshots) ? rh.snapshots : [];
    const keywords = rh.keywords && typeof rh.keywords === 'object' ? rh.keywords : null;

    if (snapshots.length && typeof snapshots[0] === 'object' && snapshots[0] !== null) {
      rh.snapshots = snapshots.map(function(snapshot) {
        return snapshot && typeof snapshot === 'object' ? (snapshot.date || '') : snapshot;
      }).filter(Boolean);
      fixes++;
    }

    if (snapshots.length && keywords) {
      let transposedEntries = 0;

      snapshots.forEach(function(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') return;

        const snapshotDate = toText(snapshot.date);
        const rankings = snapshot.rankings && typeof snapshot.rankings === 'object'
          ? snapshot.rankings
          : null;

        if (!snapshotDate || !rankings) return;

        Object.keys(rankings).forEach(function(domain) {
          const domainRankings = rankings[domain];
          if (!domainRankings || typeof domainRankings !== 'object') return;

          Object.keys(domainRankings).forEach(function(keyword) {
            if (!Object.prototype.hasOwnProperty.call(keywords, keyword)) {
              keywords[keyword] = {};
            }

            const rankValue = domainRankings[keyword];
            const keywordEntry = keywords[keyword];
            if (!keywordEntry || typeof keywordEntry !== 'object') return;

            keywordEntry.history = keywordEntry.history && typeof keywordEntry.history === 'object'
              ? keywordEntry.history
              : {};
            keywordEntry.history[domain] = keywordEntry.history[domain] && typeof keywordEntry.history[domain] === 'object'
              ? keywordEntry.history[domain]
              : {};

            if (keywordEntry.history[domain][snapshotDate] !== rankValue) {
              keywordEntry.history[domain][snapshotDate] = rankValue;
              transposedEntries++;
            }
          });
        });
      });

      if (transposedEntries) {
        logInfo('Transposed rankHistory snapshots', transposedEntries + ' keyword/domain/date entries');
        fixes++;
      }
    }
  }

  // ── 4. Page audits (site structure) ─────────────────────────────────
  // Renderer reads data.technicalSeo.pageAudits as [{ url, title,
  // metaDescription, canonicalUrl, wordCount, h1Tags[], h2Tags[],
  // internalLinks, externalLinks, hasSchema, schemaTypes[], issues[] }].
  // If missing, try to populate from crawl-data.json.
  if (!Array.isArray(tech.pageAudits) || !tech.pageAudits.length) {
    const crawlPath = path.join(dataDir, 'research', 'crawl-data.json');
    if (fs.existsSync(crawlPath)) {
      try {
        const crawl = JSON.parse(fs.readFileSync(crawlPath, 'utf-8'));
        propagateApiErrors('crawl-data.json', crawl);
        const pages = Array.isArray(crawl.pages) ? crawl.pages : (Array.isArray(crawl) ? crawl : []);
        if (pages.length) {
          tech.pageAudits = pages.map(function (p) {
            return {
              url:             p.url || '',
              title:           p.title || '',
              metaDescription: p.description || p.metaDescription || '',
              canonicalUrl:    p.canonical || p.canonicalUrl || '',
              wordCount:       p.wordCount != null ? p.wordCount : null,
              h1Tags:          Array.isArray(p.h1) ? p.h1 : (Array.isArray(p.h1Tags) ? p.h1Tags : []),
              h2Tags:          Array.isArray(p.h2) ? p.h2 : (Array.isArray(p.h2Tags) ? p.h2Tags : []),
              internalLinks:   p.totalInternalLinks != null ? p.totalInternalLinks : (p.internalLinks != null ? p.internalLinks : null),
              externalLinks:   p.externalLinks != null ? p.externalLinks : null,
              hasSchema:       !!p.hasSchema,
              schemaTypes:     Array.isArray(p.schemaTypes) ? p.schemaTypes : [],
              issues:          Array.isArray(p.issues) ? p.issues : [],
              imageCount:      p.imgCount != null ? p.imgCount : (p.imageCount != null ? p.imageCount : null),
              imagesWithAlt:   p.imagesWithAlt != null ? p.imagesWithAlt : (
                p.imgCount != null && p.imgWithoutAlt != null ? Math.max(p.imgCount - p.imgWithoutAlt, 0) : null
              ),
              hasFaqSchema:    p.hasFaqSchema != null ? p.hasFaqSchema : null,
              h3Tags:          Array.isArray(p.h3) ? p.h3 : (Array.isArray(p.h3Tags) ? p.h3Tags : []),
              headingHierarchyValid: p.headingHierarchyValid != null ? p.headingHierarchyValid : (
                Array.isArray(p.h1) ? p.h1.length === 1 : null
              ),
              statusCode:      p.statusCode != null ? p.statusCode : 200,
            };
          });
          logInfo('Auto-populated pageAudits', `${tech.pageAudits.length} pages from crawl-data.json`);
          fixes++;
        }
      } catch (err) { logWarning('Failed to parse crawl-data.json', err.message); }
    }
  }

  // ── 5. Internal linking: overview stats + hub & spoke clusters ──────
  // Renderer reads internalLinking summary fields (total_pages,
  // total_internal_links, avg_inbound_links, avg_outbound_links,
  // orphan_count, orphan_rate) and internalLinking.hubClusters.
  // Both can be derived from link-graph.json + crawl-data.json.
  const linking = data.internalLinking || (data.internalLinking = {});
  const hubClusters = Array.isArray(linking.hubClusters) ? linking.hubClusters
    : (Array.isArray(linking.hub_clusters) ? linking.hub_clusters : []);

  // Parse link-graph.json once — used for both summary stats and hub clusters
  const lgPath = path.join(dataDir, 'research', 'link-graph.json');
  let linkEdges = null; // { sourceUrl: [targetUrl, ...] }
  if (fs.existsSync(lgPath)) {
    try {
      const lg = JSON.parse(fs.readFileSync(lgPath, 'utf-8'));
      propagateApiErrors('link-graph.json', lg);
      const edges = lg.edges || {};
      if (typeof edges === 'object' && !Array.isArray(edges) && Object.keys(edges).length) {
        linkEdges = edges;
      }
    } catch (err) { logWarning('Failed to parse link-graph.json', err.message); }
  }

  if (linkEdges) {
    // Build inbound/outbound maps
    const inbound = {};
    const outbound = {};
    let totalLinks = 0;

    Object.keys(linkEdges).forEach(function (source) {
      const targets = Array.isArray(linkEdges[source]) ? linkEdges[source] : [];
      outbound[source] = targets.length;
      totalLinks += targets.length;
      targets.forEach(function (target) {
        inbound[target] = (inbound[target] || 0) + 1;
      });
    });

    const sitemapPages = new Set(Object.keys(linkEdges));
    const pageCount = sitemapPages.size;
    const inboundValues = [];
    const outboundValues = [];
    const currentTotal = Number(linking.total_pages || linking.totalPages) || 0;
    const currentOrphans = Array.isArray(linking.orphans) ? linking.orphans : [];
    const currentHubClusters = Array.isArray(linking.hubClusters) ? linking.hubClusters
      : (Array.isArray(linking.hub_clusters) ? linking.hub_clusters : []);
    const hasUsableHubClusters = currentHubClusters.some(function(cluster) {
      return !!(
        cluster &&
        (cluster.hubUrl || cluster.hub_url) &&
        (
          Array.isArray(cluster.spokes) ||
          cluster.spokeCount != null ||
          cluster.spoke_count != null
        )
      );
    });

    sitemapPages.forEach(function (url) {
      inboundValues.push(inbound[url] || 0);
      outboundValues.push(outbound[url] || 0);
    });

    const sum = function (arr) { return arr.reduce(function (a, b) { return a + b; }, 0); };
    const avgIn = pageCount ? sum(inboundValues) / pageCount : 0;
    const avgOut = pageCount ? sum(outboundValues) / pageCount : 0;

    const derivedOrphans = [];
    sitemapPages.forEach(function (url) {
      if ((inbound[url] || 0) !== 0) return;

      const pathname = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
      if (!pathname) return;

      derivedOrphans.push({
        url: url,
        outboundLinks: outbound[url] || 0,
        isInSitemap: true,
        recommendation: 'No contextual links point to this page. Add it to at least 2-3 hub or category pages.',
      });
    });

    // ── 5a. Recompute overview stats if stale (total_pages is 0 or missing) ──
    if (pageCount > 0 && (currentTotal === 0 || !currentOrphans.length || Math.abs(currentTotal - pageCount) > pageCount * 0.5)) {
      linking.totalPages = pageCount;
      linking.totalInternalLinks = totalLinks;
      linking.avgInboundLinks = Math.round(avgIn * 10) / 10;
      linking.avgOutboundLinks = Math.round(avgOut * 10) / 10;
      linking.orphanCount = derivedOrphans.length;
      linking.orphanRate = pageCount ? Math.round((derivedOrphans.length / pageCount) * 1000) / 10 : 0;
      linking.orphans = derivedOrphans;

      // Recompute issues based on real data
      const issues = [];
      if (derivedOrphans.length > 0) issues.push('HAS_ORPHANS');
      if (avgIn < 2) issues.push('WEAK_INTERNAL_LINKING');
      if (!hasUsableHubClusters) issues.push('NO_HUB_STRUCTURE');
      linking.issues = issues;

      linking.recommendations = [];
      if (avgIn < 2) {
        linking.recommendations.push(
          'Average inbound contextual links per page is ' + linking.avgInboundLinks +
          ' (below 2.0). Increase internal linking density across the site.'
        );
      }
      if (derivedOrphans.length > 0) {
        linking.recommendations.push(
          derivedOrphans.length + ' orphan page' + (derivedOrphans.length === 1 ? '' : 's') +
          ' found with zero inbound links. Add contextual links from hub or category pages.'
        );
      }

      logInfo('Auto-populated link overview', pageCount + ' pages, ' + totalLinks + ' links, ' + derivedOrphans.length + ' orphans');
      fixes++;
    } else if (!currentOrphans.length && derivedOrphans.length) {
      linking.orphans = derivedOrphans;
      logInfo('Auto-populated orphan pages', derivedOrphans.length + ' orphan URLs from link-graph.json');
      fixes++;
    }

    // ── 5b. Build hub clusters if missing ──
    if (!hasUsableHubClusters) {
      const hubCandidates = Object.keys(linkEdges)
        .map(function (url) {
          const targets = (Array.isArray(linkEdges[url]) ? linkEdges[url] : [])
            .filter(function (t) { return sitemapPages.has(t) && t !== url; });
          return {
            hubUrl: url,
            hubInbound: inbound[url] || 0,
            hubOutbound: outbound[url] || 0,
            spokes: targets,
            spokeCount: targets.length,
          };
        })
        .filter(function (h) { return h.spokeCount >= 3; })
        .sort(function (a, b) { return b.spokeCount - a.spokeCount; })
        .slice(0, 12);

      if (hubCandidates.length) {
        linking.hubClusters = hubCandidates;
        logInfo('Auto-populated hubClusters', hubCandidates.length + ' hubs from link-graph.json');
        fixes++;
      }
    }

    // ── 5b-depth. Compute link depth via BFS from homepage ─────────
    var depthResult = linking.depth_result || linking.depthResult || {};
    var depths = depthResult.depths || {};
    if (Object.keys(depths).length === 0) {
      var homepageUrl = (data.client && (data.client.websiteUrl || data.client.website)) || linking.domain || '';
      // Normalize to https and strip trailing slash for lookup
      var homeNorm = homepageUrl.replace(/\/+$/, '');
      var homeVariants = [homeNorm, homeNorm + '/', homeNorm.replace('http://', 'https://'), homeNorm.replace('https://', 'http://')];
      // Also try www / non-www variants
      homeVariants = homeVariants.concat(homeVariants.map(function(u) {
        return /\/\/www\./.test(u) ? u.replace('://www.', '://') : u.replace('://', '://www.');
      }));
      var startUrl = homeVariants.find(function(u) { return !!linkEdges[u]; }) || null;

      if (startUrl) {
        var visited = {};
        var queue = [{ url: startUrl, depth: 0 }];
        visited[startUrl] = true;
        var depthCounts = {};
        var maxDepth = 0;
        var totalDepth = 0;
        var visitedCount = 0;

        while (queue.length) {
          var item = queue.shift();
          var d = item.depth;
          depthCounts[d] = (depthCounts[d] || 0) + 1;
          if (d > maxDepth) maxDepth = d;
          totalDepth += d;
          visitedCount++;
          var neighbors = linkEdges[item.url] || [];
          neighbors.forEach(function(target) {
            if (!visited[target] && linkEdges[target] !== undefined) {
              visited[target] = true;
              queue.push({ url: target, depth: d + 1 });
            }
          });
        }

        var allNodes = Object.keys(linkEdges);
        var unreachable = allNodes.filter(function(u) { return !visited[u]; });

        depthResult.depths = depthCounts;
        depthResult.maxDepth = maxDepth;
        depthResult.avgDepth = visitedCount ? Math.round((totalDepth / visitedCount) * 10) / 10 : 0;
        depthResult.unreachableCount = unreachable.length;
        depthResult.unreachable = unreachable.slice(0, 50); // cap for JSON size (links.js reads 'unreachable')
        linking.depthResult = depthResult;

        logInfo('Computed link depth via BFS', 'max_depth=' + maxDepth + ', pages=' + visitedCount + ', unreachable=' + unreachable.length);
        fixes++;
      } else {
        logWarning('Link depth BFS: could not locate homepage in link graph', 'tried ' + homeVariants.slice(0, 2).join(', '));
      }
    }
  }

  // ── 5c. Content readability — enrich with syllables/word from page-text-analysis.json ──
  const ptaPath = path.join(dataDir, 'research', 'page-text-analysis.json');
  if (fs.existsSync(ptaPath)) {
    try {
      const ptaRaw = JSON.parse(fs.readFileSync(ptaPath, 'utf-8'));
      propagateApiErrors('page-text-analysis.json', ptaRaw);
      const ptaPages = Array.isArray(ptaRaw) ? ptaRaw : (ptaRaw.pages || []);
      if (ptaPages.length) {
        const ptaByUrl = buildUrlLookup(ptaPages);

        // Defensive normalizer: Handle snake_case from build_audit.py and compute missing summary
        if (data.contentQuality && Array.isArray(data.contentQuality.pages) && data.contentQuality.pages.length > 0) {
          const cq = data.contentQuality;
          const firstPage = cq.pages[0] || {};

          // 1. Detect and transform snake_case
          const isSnake = Object.prototype.hasOwnProperty.call(firstPage, 'quality_score') ||
                          Object.prototype.hasOwnProperty.call(firstPage, 'is_thin');

          if (isSnake) {
            cq.pages = cq.pages.map(function(p) {
              if (!p) return p;
              if (p.quality_score !== undefined) { p.qualityScore = p.quality_score; delete p.quality_score; }
              if (p.readability_score !== undefined) { p.readabilityScore = p.readability_score; delete p.readability_score; }
              if (p.is_thin !== undefined) { p.isThin = p.is_thin; delete p.is_thin; }
              if (p.structure_score !== undefined) { p.structureScore = p.structure_score; delete p.structure_score; }

              // 2. Handle string readability (parse if possible)
              if (typeof p.readability === 'string') {
                try { p.readability = JSON.parse(p.readability); } catch(e) { p.readability = {}; }
              }
              return p;
            });
          }

          // 3. Compute summary if missing or empty
          if (!cq.summary || !Object.keys(cq.summary).length) {
            const scores = cq.pages.map(p => p.qualityScore).filter(s => s != null);
            const words = cq.pages.map(p => p.wordCount).filter(w => w != null);
            cq.summary = {
              totalPages: cq.pages.length,
              avgQualityScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0,
              avgWordCount: words.length ? Math.round(words.reduce((a, b) => a + b, 0) / words.length) : 0,
              thinPageCount: cq.pages.filter(p => p.isThin).length,
              duplicateGroupCount: Array.isArray(cq.duplicateGroups) ? cq.duplicateGroups.length : 0
            };
          }
        }

        const cq = data.contentQuality || (data.contentQuality = {});
        const existingPages = Array.isArray(cq.pages) ? cq.pages : [];
        const existingByUrl = buildUrlLookup(existingPages);
        const pageAuditsByUrl = buildUrlLookup(Array.isArray(tech.pageAudits) ? tech.pageAudits : []);
        const summary = cq.summary && typeof cq.summary === 'object' ? cq.summary : {};
        const thinThreshold = summary.thinThreshold != null ? Number(summary.thinThreshold) : null;
        const needsReadabilityRebuild = !existingPages.length || existingPages.every(function(page) {
          return !page || (page.readability == null && page.readabilityScore == null);
        });
        let enriched = 0;

        if (needsReadabilityRebuild) {
          cq.pages = ptaPages.map(function(ptaPage) {
            const existing = findByUrl(existingByUrl, ptaPage.url) || {};
            const pageAudit = findByUrl(pageAuditsByUrl, ptaPage.url) || {};
            const wordCount = ptaPage.wordCount != null ? ptaPage.wordCount
              : (existing.wordCount != null ? existing.wordCount : pageAudit.wordCount);
            const readabilityScore = ptaPage.fleschReadingEase != null ? Number(ptaPage.fleschReadingEase)
              : (existing.readabilityScore != null ? existing.readabilityScore : null);
            const issues = Array.isArray(existing.issues) ? existing.issues.slice()
              : (existing.issue ? [existing.issue] : []);
            const page = Object.assign({}, existing, {
              url: toRelativeUrl(ptaPage.url),
              title: toText(ptaPage.title) || toText(existing.title) || toText(pageAudit.title),
              wordCount: wordCount != null ? wordCount : null,
              readabilityScore: readabilityScore,
              readability: Object.assign({}, existing.readability || {}, {
                fleschReadingEase: ptaPage.fleschReadingEase != null ? Number(ptaPage.fleschReadingEase) : null,
                fleschKincaidGrade: ptaPage.fleschKincaidGrade != null ? Number(ptaPage.fleschKincaidGrade) : null,
                wordCount: wordCount != null ? wordCount : null,
                syllablesPerWord: ptaPage.avgSyllablesPerWord != null ? Number(ptaPage.avgSyllablesPerWord) : null,
                avgSentenceLength: ptaPage.avgSentenceLength != null ? Number(ptaPage.avgSentenceLength) : null,
                sentenceCount: ptaPage.sentenceCount != null ? Number(ptaPage.sentenceCount) : null,
                readingLevel: toText(ptaPage.readingLevel),
                scoreExplanation: buildReadabilityExplanation(ptaPage),
              }),
            });

            if (page.isThin == null && thinThreshold != null && wordCount != null) {
              page.isThin = Number(wordCount) < thinThreshold;
            }
            if (issues.length) {
              page.issues = issues;
            }
            return page;
          });
          enriched = cq.pages.length;
        } else {
          const cqPages = Array.isArray(cq.pages) ? cq.pages : [];
          cqPages.forEach(function (page) {
            if (!page || typeof page !== 'object') return;

            const pta = findByUrl(ptaByUrl, page.url);
            if (!pta) return;

            page.readability = page.readability && typeof page.readability === 'object' ? page.readability : {};

            if (pta.fleschReadingEase != null && page.readabilityScore == null) {
              page.readabilityScore = Number(pta.fleschReadingEase);
              enriched++;
            }
            if (page.wordCount == null && pta.wordCount != null) {
              page.wordCount = pta.wordCount;
            }
            if (page.readability.wordCount == null && (pta.wordCount != null || page.wordCount != null)) {
              page.readability.wordCount = pta.wordCount != null ? pta.wordCount : page.wordCount;
            }
            if (pta.fleschReadingEase != null && page.readability.fleschReadingEase == null) {
              page.readability.fleschReadingEase = Number(pta.fleschReadingEase);
            }
            if (pta.fleschKincaidGrade != null && page.readability.fleschKincaidGrade == null) {
              page.readability.fleschKincaidGrade = Number(pta.fleschKincaidGrade);
            }
            if (pta.avgSyllablesPerWord != null && page.readability.syllablesPerWord == null) {
              page.readability.syllablesPerWord = Number(pta.avgSyllablesPerWord);
            }
            if (pta.avgSentenceLength != null && page.readability.avgSentenceLength == null) {
              page.readability.avgSentenceLength = Number(pta.avgSentenceLength);
            }
            if (pta.sentenceCount != null && page.readability.sentenceCount == null) {
              page.readability.sentenceCount = Number(pta.sentenceCount);
            }
            if (page.readability.readingLevel == null && pta.readingLevel) {
              page.readability.readingLevel = pta.readingLevel;
            }
            if (!page.readability.scoreExplanation) {
              page.readability.scoreExplanation = buildReadabilityExplanation(pta);
            }
          });
        }

        const cqPages = Array.isArray(cq.pages) ? cq.pages : [];
        cqPages.forEach(function(page) {
          if (!page || typeof page !== 'object') return;

          if ((!Array.isArray(page.issues) || !page.issues.length) && page.issue) {
            page.issues = [page.issue];
          }
          if (page.readability && page.readability.wordCount == null && page.wordCount != null) {
            page.readability.wordCount = page.wordCount;
          }
          if (page.isThin == null && thinThreshold != null && page.wordCount != null) {
            page.isThin = Number(page.wordCount) < thinThreshold;
          }

          const pageAudit = findByUrl(pageAuditsByUrl, page.url);
          if (!pageAudit) return;

          const structure = page.structure && typeof page.structure === 'object' ? page.structure : (page.structure = {});
          const h1Tags = Array.isArray(pageAudit.h1Tags) ? pageAudit.h1Tags : [];
          const h2Tags = Array.isArray(pageAudit.h2Tags) ? pageAudit.h2Tags : [];
          const h3Tags = Array.isArray(pageAudit.h3Tags) ? pageAudit.h3Tags : [];
          const inferredHeadingCount = h1Tags.length + h2Tags.length + h3Tags.length;

          if (page.title == null && pageAudit.title) {
            page.title = pageAudit.title;
          }
          if (page.wordCount == null && pageAudit.wordCount != null) {
            page.wordCount = pageAudit.wordCount;
          }
          if (page.readability && page.readability.wordCount == null && page.wordCount != null) {
            page.readability.wordCount = page.wordCount;
          }
          if (structure.headingCount == null && inferredHeadingCount) {
            structure.headingCount = inferredHeadingCount;
          }
          if (structure.h2Count == null && h2Tags.length) {
            structure.h2Count = h2Tags.length;
          }
          if (structure.h3Count == null && h3Tags.length) {
            structure.h3Count = h3Tags.length;
          }
          if (structure.headingHierarchyValid == null) {
            if (pageAudit.headingHierarchyValid != null) {
              structure.headingHierarchyValid = pageAudit.headingHierarchyValid;
            } else if (h1Tags.length) {
              structure.headingHierarchyValid = h1Tags.length === 1;
            }
          }
          if (structure.imageCount == null && pageAudit.imageCount != null) {
            structure.imageCount = pageAudit.imageCount;
          }
          if (structure.imagesWithAlt == null && pageAudit.imagesWithAlt != null) {
            structure.imagesWithAlt = pageAudit.imagesWithAlt;
          }
          if (structure.internalLinks == null && pageAudit.internalLinks != null) {
            structure.internalLinks = pageAudit.internalLinks;
          }
          if (structure.hasFaqSchema == null) {
            if (pageAudit.hasFaqSchema != null) {
              structure.hasFaqSchema = pageAudit.hasFaqSchema;
            } else if (Array.isArray(pageAudit.schemaTypes) && pageAudit.schemaTypes.length) {
              structure.hasFaqSchema = pageAudit.schemaTypes.some(function(type) {
                return String(type).toLowerCase() === 'faqpage';
              });
            }
          }
        });

        if (enriched) {
          logInfo(
            needsReadabilityRebuild ? 'Rebuilt content readability data' : 'Enriched readability data',
            enriched + ' pages from page-text-analysis.json'
          );
          fixes++;
        }
      }
    } catch (err) { logWarning('Failed to parse page-text-analysis.json', err.message); }
  }

  // ── 5d. Backlinks — auto-populate full list from client-backlinks.json ──
  const backlinks = data.backlinks || (data.backlinks = {});
  const currentBacklinks = Array.isArray(backlinks.topBacklinks) ? backlinks.topBacklinks : [];
  const cbPath = path.join(dataDir, 'research', 'client-backlinks.json');
  if (fs.existsSync(cbPath)) {
    try {
      const cb = JSON.parse(fs.readFileSync(cbPath, 'utf-8'));
      propagateApiErrors('client-backlinks.json', cb);
      const rawLinks = Array.isArray(cb.backlinks) ? cb.backlinks
        : (cb.data && Array.isArray(cb.data.backlinks)) ? cb.data.backlinks : [];
      const rawDomains = Array.isArray(cb.referring_domains) ? cb.referring_domains
        : (cb.data && Array.isArray(cb.data.referring_domains)) ? cb.data.referring_domains : [];

      if (rawLinks.length > currentBacklinks.length) {
        backlinks.topBacklinks = rawLinks.map(function (l) {
          return {
            sourceUrl:    l.source_url || l.sourceUrl || '',
            targetUrl:    l.target_url || l.targetUrl || '',
            anchorText:   l.anchor_text || l.anchorText || '',
            domainRating: l.domain_rating != null ? l.domain_rating : (l.domainRating != null ? l.domainRating : null),
            isDofollow:   l.is_dofollow != null ? l.is_dofollow : (l.isDofollow != null ? l.isDofollow : null),
            firstSeen:    l.first_seen || l.firstSeen || '',
          };
        });
        logInfo('Auto-populated topBacklinks', rawLinks.length + ' backlinks from client-backlinks.json (was ' + currentBacklinks.length + ')');
        fixes++;
      }

      if (rawDomains.length && !Array.isArray(backlinks.topReferringDomains)) {
        backlinks.topReferringDomains = rawDomains.map(function (d) {
          return {
            domain:         d.domain || '',
            rank:           d.rank != null ? d.rank : null,
            backlinks:      d.backlinks != null ? d.backlinks : null,
            firstSeen:      d.first_seen || d.firstSeen || '',
            dofollow:       d.dofollow != null ? d.dofollow : null,
            referringPages: d.referring_pages != null ? d.referring_pages : null,
          };
        });
        logInfo('Auto-populated topReferringDomains', rawDomains.length + ' domains from client-backlinks.json');
        fixes++;
      }

      // analyze-backlink-quality.js writes qualitySummary onto the same
      // research file. Propagate it whenever research has actual data
      // (total > 0); the audit-data.json default is { total: 0, ... }.
      // Without this, the rendered report shows 0/0/0 even when the
      // analyzer has classified hundreds of referring domains.
      if (cb.qualitySummary && typeof cb.qualitySummary === 'object' &&
          (cb.qualitySummary.total || 0) > 0) {
        backlinks.qualitySummary = cb.qualitySummary;
        logInfo('Auto-populated backlinks.qualitySummary',
          cb.qualitySummary.total + ' domains classified from client-backlinks.json');
        fixes++;
      }
    } catch (err) { logWarning('Failed to parse client-backlinks.json', err.message); }
  }

  // ── 5e. Competitor backlinks — merge backlinks-*.json research files ──
  const cdm = Array.isArray(backlinks.competitorDomainMetrics) ? backlinks.competitorDomainMetrics
    : (backlinks.competitorDomainMetrics = []);
  const boFromFiles = data.backlinkOpportunities || (data.backlinkOpportunities = {});
  const boCompetitorsFromFiles = Array.isArray(boFromFiles.competitors) ? boFromFiles.competitors
    : (boFromFiles.competitors = []);
  const researchDir = path.join(dataDir, 'research');
  if (fs.existsSync(researchDir)) {
    const competitorBacklinkFiles = fs.readdirSync(researchDir).filter(function (name) {
      return /^backlinks-.+\.json$/.test(name);
    });

    let mergedCompetitorBacklinkFiles = 0;
    competitorBacklinkFiles.forEach(function (filename) {
      const filePath = path.join(researchDir, filename);
      try {
        const cb = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        propagateApiErrors(filename, cb);
        const domain = cb.domain || filename.replace(/^backlinks-/, '').replace(/\.json$/, '');
        if (!domain) return;

        const rawLinks = Array.isArray(cb.backlinks) ? cb.backlinks
          : (cb.data && Array.isArray(cb.data.backlinks)) ? cb.data.backlinks : [];
        const rawDomains = Array.isArray(cb.referring_domains) ? cb.referring_domains
          : (cb.data && Array.isArray(cb.data.referring_domains)) ? cb.data.referring_domains : [];

        const backlinksCount = cb.totalBacklinks != null ? cb.totalBacklinks : rawLinks.length;
        const referringDomainsCount = cb.referringDomains != null ? cb.referringDomains : rawDomains.length;

        let dofollowRatio = null;
        if (rawLinks.length) {
          const dofollowLinks = rawLinks.filter(function (link) {
            return link && (link.is_dofollow === true || link.isDofollow === true);
          }).length;
          dofollowRatio = dofollowLinks / rawLinks.length;
        } else if (rawDomains.length) {
          const totalDofollow = rawDomains.reduce(function (sum, entry) {
            const value = entry && entry.dofollow != null ? Number(entry.dofollow) : 0;
            return sum + (Number.isFinite(value) ? value : 0);
          }, 0);
          const totalDomainBacklinks = rawDomains.reduce(function (sum, entry) {
            const value = entry && entry.backlinks != null ? Number(entry.backlinks) : 0;
            return sum + (Number.isFinite(value) ? value : 0);
          }, 0);
          if (totalDomainBacklinks > 0) {
            dofollowRatio = totalDofollow / totalDomainBacklinks;
          }
        }

        let metricsEntry = cdm.find(function (entry) { return entry && entry.domain === domain; });
        if (!metricsEntry) {
          metricsEntry = { domain: domain };
          cdm.push(metricsEntry);
          mergedCompetitorBacklinkFiles++;
        }
        metricsEntry.backlinks = backlinksCount;
        metricsEntry.totalBacklinks = backlinksCount;
        metricsEntry.referringDomains = referringDomainsCount;
        if (dofollowRatio != null) {
          metricsEntry.dofollowRatio = dofollowRatio;
        }

        let competitorEntry = boCompetitorsFromFiles.find(function (entry) { return entry && entry.domain === domain; });
        if (!competitorEntry) {
          competitorEntry = { domain: domain };
          boCompetitorsFromFiles.push(competitorEntry);
        }
        competitorEntry.backlinks = backlinksCount;
        competitorEntry.referringDomains = referringDomainsCount;
        if (dofollowRatio != null) {
          competitorEntry.dofollowRatio = dofollowRatio;
        }

        // 4b: Retain individual referring domain records per competitor
        if (!boFromFiles.competitorReferringDomains) boFromFiles.competitorReferringDomains = {};
        if (rawDomains.length) {
          boFromFiles.competitorReferringDomains[domain] = rawDomains.map(function(d) {
            return {
              domain: d.domain || '',
              rank: d.rank != null ? d.rank : 0,
              backlinks: d.backlinks != null ? d.backlinks : 0,
              dofollow: d.dofollow != null ? d.dofollow : 0,
              referringPages: d.referringPages || d.referring_pages || 0,
            };
          });
        }
      } catch (err) { logWarning('Failed to parse ' + filename, err.message); }
    });

    if (mergedCompetitorBacklinkFiles) {
      logInfo('Merged competitor backlink files', mergedCompetitorBacklinkFiles + ' domains from backlinks-*.json');
      fixes++;
    }
  }

  // ── 6. Domain metrics comparison (competitors page) ──────────────────
  // Renderer reads data.domainMetrics = { client: { domain, domainRating,
  // organicTraffic, organicKeywords, referringDomains, backlinks, trafficValue },
  // competitors: [same shape] }.
  // Data pipelines put this in backlinks.competitorDomainMetrics or
  // competitorAnalysis.domainMetricsComparison, or research/domain-metrics.json.
  if (!data.domainMetrics || (!data.domainMetrics.client && !data.domainMetrics.competitors)) {
    let sourceEntries = null;
    const bl = data.backlinks || {};
    const ca = data.competitorAnalysis || {};

    // Prefer research/domain-metrics.json when it has API data (gatheredAt timestamp)
    // over web-research estimates in backlinks.competitorDomainMetrics
    const dmPath = path.join(dataDir, 'research', 'domain-metrics.json');
    if (fs.existsSync(dmPath)) {
      try {
        const dmFile = JSON.parse(fs.readFileSync(dmPath, 'utf-8'));
        propagateApiErrors('domain-metrics.json', dmFile);
        if (dmFile.gatheredAt) {
          const entries = Array.isArray(dmFile.data) ? dmFile.data : (Array.isArray(dmFile) ? dmFile : []);
          if (entries.length) {
            sourceEntries = entries;
            logInfo('Using domain-metrics.json (API data)', entries.length + ' domains');
          }
        }
      } catch (err) { logWarning('Failed to parse domain-metrics.json', err.message); }
    }

    // Fall back to backlinks.competitorDomainMetrics or competitorAnalysis
    if (!sourceEntries && Array.isArray(bl.competitorDomainMetrics) && bl.competitorDomainMetrics.length) {
      sourceEntries = bl.competitorDomainMetrics;
    } else if (!sourceEntries && Array.isArray(ca.domainMetricsComparison) && ca.domainMetricsComparison.length) {
      sourceEntries = ca.domainMetricsComparison;
    }

    // Final fallback: read from research/domain-metrics.json even without gatheredAt
    if (!sourceEntries) {
      if (fs.existsSync(dmPath)) {
        try {
          const dmFile = JSON.parse(fs.readFileSync(dmPath, 'utf-8'));
          const entries = Array.isArray(dmFile.data) ? dmFile.data : (Array.isArray(dmFile) ? dmFile : []);
          if (entries.length) sourceEntries = entries;
        } catch (err) { logWarning('Failed to parse domain-metrics.json', err.message); }
      }
    }

    if (sourceEntries && sourceEntries.length) {
      const clientEntry = sourceEntries.find(function (e) { return e.isClient; })
        || sourceEntries.find(function (e) {
          const d = (data.client && data.client.website) || '';
          return d && (e.domain || '').indexOf(d.replace(/^www\./, '')) !== -1;
        })
        || sourceEntries[0];

      const competitorEntries = sourceEntries.filter(function (e) { return e !== clientEntry; });

      function normalizeDMEntry(e) {
        return {
          domain:               e.domain || '',
          domainRating:         e.domainRating != null ? e.domainRating : (e.domain_rating != null ? e.domain_rating : (e.dr != null ? e.dr : null)),
          organicTraffic:       e.organicTraffic != null ? e.organicTraffic : (e.organic_traffic != null ? e.organic_traffic : null),
          organicTrafficTotal:  e.organicTrafficTotal != null ? e.organicTrafficTotal : (e.organic_traffic_total != null ? e.organic_traffic_total : null),
          organicKeywords:      e.organicKeywords != null ? e.organicKeywords : (e.organic_keywords != null ? e.organic_keywords : null),
          referringDomains:     e.referringDomains != null ? e.referringDomains : (e.referring_domains != null ? e.referring_domains : null),
          backlinks:            e.backlinks != null ? e.backlinks : (e.totalBacklinks != null ? e.totalBacklinks : (e.total_backlinks != null ? e.total_backlinks : null)),
          trafficValue:         e.trafficValue != null ? e.trafficValue : (e.traffic_value != null ? e.traffic_value : null),
        };
      }

      data.domainMetrics = {
        client: normalizeDMEntry(clientEntry),
        competitors: competitorEntries.map(normalizeDMEntry),
      };
      logInfo('Auto-populated domainMetrics', '1 client + ' + competitorEntries.length + ' competitors');
      fixes++;
    }
  }

  // ── 6a. Backward-compat: keywords.js reads backlinks.domainMetrics for organic data
  // The normalizer populates data.domainMetrics.client (top-level) but the keywords
  // renderer reads data.backlinks.domainMetrics.organicKeywords (old path).
  if (data.domainMetrics && data.domainMetrics.client) {
    var bl6a = data.backlinks || (data.backlinks = {});
    var blDm = bl6a.domainMetrics || (bl6a.domainMetrics = {});
    var clientDm = data.domainMetrics.client;
    ['organicKeywords', 'organicTraffic', 'organicTrafficTotal', 'trafficValue', 'referringDomains', 'domain', 'domainRating'].forEach(function (key) {
      if (clientDm[key] != null && blDm[key] == null) {
        blDm[key] = clientDm[key];
      }
    });
  }

  // ── 6c. Organic metrics fallback — merge research/organic-metrics.json ─────
  const omPath = path.join(dataDir, 'research', 'organic-metrics.json');
  if (fs.existsSync(omPath)) {
    try {
      const omFile = JSON.parse(fs.readFileSync(omPath, 'utf-8'));
      propagateApiErrors('organic-metrics.json', omFile);
      const omEntries = Array.isArray(omFile.data) ? omFile.data : (Array.isArray(omFile) ? omFile : []);

      if (omEntries.length) {
        const normalizeDomainName = function (value) {
          return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/.*$/, '');
        };

        let mergedDomains = 0;
        const clientOrganicEntry = omEntries.find(function (entry) { return entry && entry.isClient; }) || omEntries[0];
        if (clientOrganicEntry) {
          let mergedClient = false;
          const bl6c = data.backlinks || (data.backlinks = {});
          const blDm6c = bl6c.domainMetrics || (bl6c.domainMetrics = {});

          if (blDm6c.organicKeywords == null && clientOrganicEntry.organicKeywords != null) {
            blDm6c.organicKeywords = clientOrganicEntry.organicKeywords;
            mergedClient = true;
          }
          if (blDm6c.organicTraffic == null && clientOrganicEntry.organicTraffic != null) {
            blDm6c.organicTraffic = clientOrganicEntry.organicTraffic;
            mergedClient = true;
          }
          if (blDm6c.organicTrafficTotal == null && clientOrganicEntry.organicTrafficTotal != null) {
            blDm6c.organicTrafficTotal = clientOrganicEntry.organicTrafficTotal;
            mergedClient = true;
          }

          if (data.domainMetrics && data.domainMetrics.client) {
            if (data.domainMetrics.client.organicKeywords == null && clientOrganicEntry.organicKeywords != null) {
              data.domainMetrics.client.organicKeywords = clientOrganicEntry.organicKeywords;
              mergedClient = true;
            }
            if (data.domainMetrics.client.organicTraffic == null && clientOrganicEntry.organicTraffic != null) {
              data.domainMetrics.client.organicTraffic = clientOrganicEntry.organicTraffic;
              mergedClient = true;
            }
            if (data.domainMetrics.client.organicTrafficTotal == null && clientOrganicEntry.organicTrafficTotal != null) {
              data.domainMetrics.client.organicTrafficTotal = clientOrganicEntry.organicTrafficTotal;
              mergedClient = true;
            }
          }

          if (mergedClient) mergedDomains++;
        }

        if (data.domainMetrics && Array.isArray(data.domainMetrics.competitors) && data.domainMetrics.competitors.length) {
          const competitorsByDomain = new Map();
          data.domainMetrics.competitors.forEach(function (competitor) {
            const key = normalizeDomainName(competitor && competitor.domain);
            if (key && !competitorsByDomain.has(key)) {
              competitorsByDomain.set(key, competitor);
            }
          });

          omEntries.forEach(function (entry) {
            if (!entry || entry.isClient !== false) return;
            const competitor = competitorsByDomain.get(normalizeDomainName(entry.domain));
            if (!competitor) return;

            let mergedCompetitor = false;
            if (competitor.organicKeywords == null && entry.organicKeywords != null) {
              competitor.organicKeywords = entry.organicKeywords;
              mergedCompetitor = true;
            }
            if (competitor.organicTraffic == null && entry.organicTraffic != null) {
              competitor.organicTraffic = entry.organicTraffic;
              mergedCompetitor = true;
            }
            if (competitor.organicTrafficTotal == null && entry.organicTrafficTotal != null) {
              competitor.organicTrafficTotal = entry.organicTrafficTotal;
              mergedCompetitor = true;
            }

            if (mergedCompetitor) mergedDomains++;
          });
        }

        if (mergedDomains) {
          logInfo('Merged organic-metrics.json', mergedDomains + ' domains');
          fixes++;
        }
      }
    } catch (err) { logWarning('Failed to parse organic-metrics.json', err.message); }
  }

  // ── 6b. Backlink Opportunities — build from available data ──────────
  const bo = data.backlinkOpportunities || (data.backlinkOpportunities = {});

  // Client profile
  if (!bo.client) {
    const blMetrics = (data.backlinks || {}).domainMetrics || {};
    const dmClient = (data.domainMetrics && data.domainMetrics.client) ? data.domainMetrics.client : {};
    bo.client = {
      domain: blMetrics.domain || dmClient.domain || (data.client && (data.client.website || data.client.websiteUrl)) || '',
      backlinks: blMetrics.totalBacklinks || dmClient.backlinks || ((data.backlinks || {}).topBacklinks || []).length || 0,
      referringDomains: blMetrics.referringDomains || dmClient.referringDomains || 0,
      domainRating: blMetrics.domainRating || dmClient.domainRating || 0,
      dofollowRatio: (data.backlinks || {}).dofollowRatio || 0
    };
    if (bo.client.backlinks || bo.client.referringDomains || bo.client.domainRating) {
      logInfo('Backlink opportunities client', 'DR=' + bo.client.domainRating + ' RD=' + bo.client.referringDomains + ' BL=' + bo.client.backlinks);
    }
  }

  // Competitor profiles (from domainMetrics.competitors or competitorDomainMetrics)
  if (!bo.competitors || !bo.competitors.length) {
    const dmComps = (data.domainMetrics && Array.isArray(data.domainMetrics.competitors)) ? data.domainMetrics.competitors : null;
    const cdm = (data.backlinks || {}).competitorDomainMetrics || [];
    const compSource = (dmComps && dmComps.length) ? dmComps : cdm.filter(function(c) { return !c.isClient; });
    bo.competitors = compSource.map(function(c) {
      return {
        domain: c.domain || '',
        backlinks: c.backlinks || c.totalBacklinks || 0,
        referringDomains: c.referringDomains || 0,
        domainRating: c.domainRating || 0,
        dofollowRatio: c.dofollowRatio || 0
      };
    });
    if (bo.competitors.length) {
      logInfo('Backlink opportunities competitors', bo.competitors.length + ' from ' + ((dmComps && dmComps.length) ? 'domainMetrics.competitors' : 'competitorDomainMetrics'));
    }
  }

  // Opportunities array (from backlink-opportunities.json if it exists)
  if (!bo.opportunities) {
    const boPath = path.join(dataDir, 'research', 'backlink-opportunities.json');
    if (fs.existsSync(boPath)) {
      try {
        const boRaw = JSON.parse(fs.readFileSync(boPath, 'utf-8'));
        bo.opportunities = Array.isArray(boRaw.opportunities) ? boRaw.opportunities : (Array.isArray(boRaw) ? boRaw : []);
        if (boRaw.similarityPairs) bo.similarityPairs = boRaw.similarityPairs;
        logInfo('Loaded backlink opportunities', bo.opportunities.length + ' opportunities from backlink-opportunities.json');
      } catch (e) {
        logWarning('Could not parse backlink-opportunities.json: ' + e.message);
        bo.opportunities = [];
      }
    } else {
      bo.opportunities = [];
    }
  }

  // Client backlinks inventory (reuse from existing topBacklinks)
  if (!bo.clientBacklinks) {
    bo.clientBacklinks = (data.backlinks || {}).topBacklinks || [];
  }

  // ── 4c. Auto-generate opportunities from competitor referring domains ──
  // If opportunities array is empty and we have competitor referring domain data,
  // compute opportunities by finding domains competitors have that client doesn't.
  if ((!bo.opportunities || !bo.opportunities.length) && bo.competitorReferringDomains && Object.keys(bo.competitorReferringDomains).length) {
    // Build set of client's referring domains
    var clientRDs = new Set();
    var clientTopRDs = Array.isArray((data.backlinks || {}).topReferringDomains) ? data.backlinks.topReferringDomains : [];
    clientTopRDs.forEach(function(rd) { if (rd.domain) clientRDs.add(rd.domain.toLowerCase()); });
    // Also check client backlinks source domains
    (bo.clientBacklinks || []).forEach(function(bl) {
      var src = bl.sourceUrl || '';
      try { clientRDs.add(new URL(src).hostname.replace(/^www\./, '').toLowerCase()); } catch(e) {}
    });

    // Domain classification lookup
    var DOMAIN_TYPES = {
      directory: ['yellowpages','yelp','bbb','manta','hotfrog','superpages','angieslist','thumbtack','homeadvisor','houzz','foursquare','mapquest','citysearch'],
      social: ['facebook','linkedin','twitter','pinterest','youtube','instagram','tiktok','reddit'],
      realEstate: ['zillow','realtor','redfin','trulia','homes.com','movoto','loopnet','homesnap','har.com','mlslistings'],
      press: ['patch.com','prnewswire','prweb','businesswire','globenewswire'],
      forum: ['activerain','biggerpockets','city-data','quora','reddit'],
    };

    function classifyDomain(domainName) {
      var d = domainName.toLowerCase();
      var type = 'other', effort = 'medium', localRelevance = 'international';
      // Check known domain lists
      Object.keys(DOMAIN_TYPES).forEach(function(t) {
        DOMAIN_TYPES[t].forEach(function(known) {
          if (d.indexOf(known) >= 0) type = t;
        });
      });
      if (/\.gov$/i.test(d)) type = 'government';
      if (/\.edu$/i.test(d)) type = 'educational';
      if (/blog|article|resource|guide/i.test(d)) type = 'blog';
      if (/forum|community|discuss/i.test(d)) type = 'forum';
      if (/news|times|herald|gazette|tribune|journal|post\b|observer|chronicle/i.test(d)) type = 'press';

      // Effort based on type
      if (type === 'directory' || type === 'social') effort = 'easy';
      else if (type === 'press' || type === 'government' || type === 'educational') effort = 'hard';
      else effort = 'medium';

      // Local relevance: check if domain contains client location words
      var clientLoc = (data.client && data.client.location) || '';
      var locWords = clientLoc.toLowerCase().split(/[,\s]+/).filter(function(w) { return w.length > 3; });
      locWords.forEach(function(w) { if (d.indexOf(w) >= 0) localRelevance = 'local'; });

      return { type: type, effort: effort, localRelevance: localRelevance };
    }

    // Count which competitor domains the client doesn't have
    var oppMap = new Map(); // domain → { dr, competitors[], ... }
    Object.keys(bo.competitorReferringDomains).forEach(function(compDomain) {
      var rds = bo.competitorReferringDomains[compDomain] || [];
      rds.forEach(function(rd) {
        var rdDomain = (rd.domain || '').toLowerCase();
        if (!rdDomain || clientRDs.has(rdDomain)) return;
        if (!oppMap.has(rdDomain)) {
          oppMap.set(rdDomain, { domain: rd.domain, dr: rd.rank || 0, competitors: [], linkCount: rd.backlinks || 0 });
        }
        var entry = oppMap.get(rdDomain);
        if (entry.competitors.indexOf(compDomain) === -1) entry.competitors.push(compDomain);
        if (rd.rank != null && rd.rank > entry.dr) entry.dr = rd.rank;
      });
    });

    // Score and classify each opportunity
    var generatedOpps = [];
    oppMap.forEach(function(opp) {
      var cls = classifyDomain(opp.domain);
      var score = (opp.competitors.length * 20) + (opp.dr * 0.5);
      generatedOpps.push({
        domain: opp.domain,
        dr: opp.dr,
        clientHas: false,
        competitors: opp.competitors,
        score: Math.round(score),
        type: cls.type,
        localRelevance: cls.localRelevance,
        effort: cls.effort,
      });
    });

    // Also add domains the client HAS that competitors also have
    clientRDs.forEach(function(clientDomain) {
      var sharedWith = [];
      Object.keys(bo.competitorReferringDomains).forEach(function(compDomain) {
        var rds = bo.competitorReferringDomains[compDomain] || [];
        if (rds.some(function(rd) { return (rd.domain || '').toLowerCase() === clientDomain; })) {
          sharedWith.push(compDomain);
        }
      });
      if (sharedWith.length) {
        var cls = classifyDomain(clientDomain);
        var clientRD = clientTopRDs.find(function(rd) { return (rd.domain || '').toLowerCase() === clientDomain; });
        var dr = clientRD ? (clientRD.rank || 0) : 0;
        generatedOpps.push({
          domain: clientDomain,
          dr: dr,
          clientHas: true,
          competitors: sharedWith,
          score: Math.round((sharedWith.length * 10) + (dr * 0.3)),
          type: cls.type,
          localRelevance: cls.localRelevance,
          effort: cls.effort,
        });
      }
    });

    generatedOpps.sort(function(a, b) { return b.score - a.score; });
    bo.opportunities = generatedOpps.slice(0, 200);

    if (bo.opportunities.length) {
      var missing = bo.opportunities.filter(function(o) { return !o.clientHas; }).length;
      var shared = bo.opportunities.filter(function(o) { return o.clientHas; }).length;
      logInfo('Auto-generated opportunities', bo.opportunities.length + ' (' + missing + ' gaps, ' + shared + ' shared)');
      fixes++;
    }
  }

  // ── 4d. Compute typeCounts for client and competitors ──
  function computeTypeCounts(backlinks) {
    var counts = {};
    (backlinks || []).forEach(function(bl) {
      var src = bl.sourceUrl || bl.source_url || '';
      var domain;
      try { domain = new URL(src).hostname.replace(/^www\./, '').toLowerCase(); } catch(e) { domain = src; }
      var cls = typeof classifyDomain === 'function' ? classifyDomain(domain) : { type: 'other' };
      counts[cls.type] = (counts[cls.type] || 0) + 1;
    });
    return counts;
  }

  if (bo.client && bo.clientBacklinks && bo.clientBacklinks.length) {
    if (!bo.client.typeCounts || !Object.keys(bo.client.typeCounts).length) {
      bo.client.typeCounts = computeTypeCounts(bo.clientBacklinks);
    }
  }

  // ── 4e. Generate similarityPairs (Jaccard index) ──
  if (!bo.similarityPairs || !bo.similarityPairs.length) {
    var allDomainSets = {};
    // Client set
    var clientDomainName = bo.client ? bo.client.domain : '';
    if (clientDomainName && clientTopRDs && clientTopRDs.length) {
      allDomainSets[clientDomainName] = new Set(clientTopRDs.map(function(rd) { return (rd.domain || '').toLowerCase(); }));
    }
    // Competitor sets
    if (bo.competitorReferringDomains) {
      Object.keys(bo.competitorReferringDomains).forEach(function(compDomain) {
        allDomainSets[compDomain] = new Set(
          (bo.competitorReferringDomains[compDomain] || []).map(function(rd) { return (rd.domain || '').toLowerCase(); })
        );
      });
    }

    var simPairs = [];
    var domainNames = Object.keys(allDomainSets);
    for (var si = 0; si < domainNames.length; si++) {
      for (var sj = si + 1; sj < domainNames.length; sj++) {
        var setA = allDomainSets[domainNames[si]];
        var setB = allDomainSets[domainNames[sj]];
        var intersection = 0;
        setA.forEach(function(d) { if (setB.has(d)) intersection++; });
        var union = setA.size + setB.size - intersection;
        var similarity = union > 0 ? Math.round(intersection / union * 100) : 0;
        simPairs.push({
          domainA: domainNames[si],
          domainB: domainNames[sj],
          shared: intersection,
          similarity: similarity,
        });
      }
    }
    simPairs.sort(function(a, b) { return b.similarity - a.similarity; });
    bo.similarityPairs = simPairs;
  }

  logInfo('Backlink opportunities data',
    'client=' + (bo.client.domain || 'unknown') +
    ', competitors=' + bo.competitors.length +
    ', opportunities=' + bo.opportunities.length +
    ', clientBacklinks=' + bo.clientBacklinks.length);

  // ── 4f. Anchor text distribution ──────────────────────────────────────
  if (bo.clientBacklinks && bo.clientBacklinks.length && !bo.anchorDistribution) {
    var anchorCounts = { branded: 0, exactMatch: 0, partial: 0, url: 0, empty: 0, generic: 0, other: 0 };
    var clientDomainLower = (bo.client && bo.client.domain || '').toLowerCase().replace(/\.(com|net|org|co|io)$/i, '');
    var clientNameLower = (data.client && (data.client.name || data.client.company) || '').toLowerCase();

    bo.clientBacklinks.forEach(function(bl) {
      var anchor = (bl.anchorText || '').trim();
      if (!anchor || anchor === '(empty)') { anchorCounts.empty++; return; }
      var aLower = anchor.toLowerCase();
      if (/^https?:\/\/|^www\./i.test(anchor) || /^\S+\.\S{2,4}$/.test(anchor)) { anchorCounts.url++; return; }
      if (/^(click here|here|link|website|read more|learn more|visit|source|post|this|view)$/i.test(anchor)) { anchorCounts.generic++; return; }
      if (clientDomainLower && aLower.indexOf(clientDomainLower) >= 0) { anchorCounts.branded++; return; }
      if (clientNameLower && clientNameLower.length > 3 && aLower.indexOf(clientNameLower) >= 0) { anchorCounts.branded++; return; }
      // Check if anchor matches any keyword (rough: >4 words = likely partial match)
      if (anchor.split(/\s+/).length > 4) { anchorCounts.partial++; return; }
      anchorCounts.other++;
    });

    var total = bo.clientBacklinks.length;
    bo.anchorDistribution = Object.keys(anchorCounts).map(function(type) {
      return { type: type, count: anchorCounts[type], pct: total ? Math.round(anchorCounts[type] / total * 100) : 0 };
    }).filter(function(a) { return a.count > 0; }).sort(function(a, b) { return b.count - a.count; });

    // Top anchors by frequency
    var anchorFreq = {};
    bo.clientBacklinks.forEach(function(bl) {
      var anchor = (bl.anchorText || '').trim() || '(empty)';
      anchorFreq[anchor] = (anchorFreq[anchor] || 0) + 1;
    });
    bo.topAnchors = Object.entries(anchorFreq)
      .sort(function(a, b) { return b[1] - a[1]; })
      .slice(0, 20)
      .map(function(pair) { return { text: pair[0], count: pair[1] }; });
  }

  // ── 4g. Link velocity ──────────────────────────────────────────────────
  if (bo.clientBacklinks && bo.clientBacklinks.length && !bo.velocityData) {
    var monthBuckets = {};
    bo.clientBacklinks.forEach(function(bl) {
      var date = bl.firstSeen || '';
      if (!date) return;
      var month = date.substring(0, 7); // YYYY-MM
      if (!/^\d{4}-\d{2}$/.test(month)) return;
      monthBuckets[month] = (monthBuckets[month] || 0) + 1;
    });

    var months = Object.keys(monthBuckets).sort();
    if (months.length) {
      bo.velocityData = {
        months: months,
        client: months.map(function(m) { return monthBuckets[m] || 0; }),
      };

      // Also compute competitor velocity if we have their backlinks
      if (bo.competitorReferringDomains) {
        bo.velocityData.competitors = {};
        // Note: We only have referring domain data (not individual backlinks with dates)
        // for competitors, so velocity is limited to client for now
      }
    }
  }

  // ── 4h. Broken backlink detection ──────────────────────────────────────
  if (bo.clientBacklinks && bo.clientBacklinks.length && !bo.brokenBacklinks) {
    var crawlPath4h = path.join(dataDir, 'research', 'crawl-data.json');
    if (fs.existsSync(crawlPath4h)) {
      try {
        var crawl4h = JSON.parse(fs.readFileSync(crawlPath4h, 'utf-8'));
        var crawlPages4h = Array.isArray(crawl4h.pages) ? crawl4h.pages : (Array.isArray(crawl4h) ? crawl4h : []);
        var notFoundUrls = new Set();
        crawlPages4h.forEach(function(p) {
          if (p.statusCode && (p.statusCode === 404 || p.statusCode === 410)) {
            var url = (p.url || '').toLowerCase();
            notFoundUrls.add(url);
            // Also add without trailing slash
            notFoundUrls.add(url.replace(/\/$/, ''));
          }
        });

        if (notFoundUrls.size) {
          var broken = [];
          bo.clientBacklinks.forEach(function(bl) {
            var target = (bl.targetUrl || '').toLowerCase();
            if (notFoundUrls.has(target) || notFoundUrls.has(target.replace(/\/$/, ''))) {
              broken.push({
                sourceUrl: bl.sourceUrl,
                targetUrl: bl.targetUrl,
                anchorText: bl.anchorText || '',
                domainRating: bl.domainRating,
              });
            }
          });
          if (broken.length) {
            bo.brokenBacklinks = broken;
            logInfo('Broken backlinks detected', broken.length + ' backlinks pointing to 404 pages');
          }
        }
      } catch (err4h) { /* crawl data parse error — non-critical */ }
    }
  }

  // ── 6d. Referring domain spam analysis ────────────────────────────────
  // Uses AI quality data from analyze-backlink-quality.js when available,
  // falls back to heuristic classification otherwise.
  if (bo.clientBacklinks && bo.clientBacklinks.length) {
    // Check if AI quality analyzer has already classified the data
    var cbPath6d = path.join(dataDir, 'research', 'client-backlinks.json');
    var aiQualitySummary = null;
    if (fs.existsSync(cbPath6d)) {
      try {
        var cb6d = JSON.parse(fs.readFileSync(cbPath6d, 'utf-8'));
        if (cb6d.qualitySummary && cb6d.qualitySummary.analyzedAt) {
          aiQualitySummary = cb6d.qualitySummary;
          // Also enrich clientBacklinks with per-domain quality from the analyzed file
          var rdQuality = {};
          (Array.isArray(cb6d.referring_domains) ? cb6d.referring_domains : []).forEach(function(rd) {
            if (rd.domainQuality) rdQuality[(rd.domain || '').toLowerCase()] = rd;
          });
          bo.clientBacklinks.forEach(function(bl) {
            var src = bl.sourceUrl || '';
            var domain;
            try { domain = new URL(src).hostname.replace(/^www\./, '').toLowerCase(); } catch(e) { return; }
            var rd = rdQuality[domain];
            if (rd) {
              bl.domainQuality = rd.domainQuality;
              bl.qualityScore = rd.qualityScore;
            }
          });
        }
      } catch(e) { /* non-critical */ }
    }

    var spamSignals = {
      telegramAnchors: /telegram|t\.me|darksidelinks|quarterlinks/i,
      genericAnchors: /^\[.*more\]$|^post$|^click here$|^here$|^link$|^website$/i,
      spamTlds: /\.(info|xyz|top|club|buzz|wang|bid|win|stream|gq|cf|ga|ml|tk)$/i,
      foreignSpam: /\.(ru|cn|vn|id|pl|be)$/i,
    };

    var domainMap = new Map();
    bo.clientBacklinks.forEach(function(link) {
      var src = link.sourceUrl || '';
      var domain;
      try { domain = new URL(src).hostname.replace(/^www\./, '').toLowerCase(); } catch(e) { domain = src; }
      if (!domain) return;
      if (!domainMap.has(domain)) {
        domainMap.set(domain, { domain: domain, links: [], dr: link.domainRating || 0, isDofollow: false });
      }
      var entry = domainMap.get(domain);
      entry.links.push(link);
      if (link.isDofollow) entry.isDofollow = true;
      if (link.domainRating != null && link.domainRating > entry.dr) entry.dr = link.domainRating;
    });

    var spamDomains = [];
    var suspiciousDomains = [];
    var legitDomains = [];

    domainMap.forEach(function(entry) {
      var flags = [];
      var score = 0; // higher = more spammy

      // DR-based signals
      if (entry.dr === 0) { flags.push('DR 0'); score += 3; }
      else if (entry.dr < 5) { flags.push('Very low DR (' + entry.dr + ')'); score += 2; }

      // Anchor text signals
      entry.links.forEach(function(link) {
        var anchor = link.anchorText || '';
        if (spamSignals.telegramAnchors.test(anchor)) { flags.push('Telegram/spam anchor'); score += 5; }
        if (spamSignals.genericAnchors.test(anchor)) { flags.push('Generic anchor text'); score += 1; }
      });

      // TLD signals
      if (spamSignals.spamTlds.test(entry.domain)) { flags.push('Spam TLD'); score += 3; }
      if (spamSignals.foreignSpam.test(entry.domain) && entry.dr < 10) { flags.push('Low-DR foreign domain'); score += 2; }

      // Single-page, low-DR dofollow = likely paid/spam
      if (entry.links.length === 1 && entry.dr === 0 && entry.isDofollow) {
        flags.push('Single dofollow link from DR-0 domain');
        score += 2;
      }

      entry.spamScore = score;
      entry.flags = flags;
      entry.classification = score >= 5 ? 'spam' : (score >= 2 ? 'suspicious' : 'legit');

      if (entry.classification === 'spam') spamDomains.push(entry);
      else if (entry.classification === 'suspicious') suspiciousDomains.push(entry);
      else legitDomains.push(entry);
    });

    // Sort each group by spam score descending
    spamDomains.sort(function(a, b) { return b.spamScore - a.spamScore; });
    suspiciousDomains.sort(function(a, b) { return b.spamScore - a.spamScore; });
    legitDomains.sort(function(a, b) { return (b.dr || 0) - (a.dr || 0); });

    var totalDomains = domainMap.size;
    var spamPct = totalDomains ? Math.round(spamDomains.length / totalDomains * 100) : 0;
    var suspPct = totalDomains ? Math.round(suspiciousDomains.length / totalDomains * 100) : 0;
    var legitPct = totalDomains ? Math.round(legitDomains.length / totalDomains * 100) : 0;

    var healthRating = spamPct >= 50 ? 'Poor' : (spamPct >= 25 ? 'Needs Attention' : (spamPct >= 10 ? 'Fair' : 'Good'));

    bo.spamAnalysis = {
      totalDomains: totalDomains,
      spam: { count: spamDomains.length, pct: spamPct, domains: spamDomains.slice(0, 50).map(function(d) {
        return { domain: d.domain, dr: d.dr, flags: d.flags, spamScore: d.spamScore, linkCount: d.links.length };
      })},
      suspicious: { count: suspiciousDomains.length, pct: suspPct, domains: suspiciousDomains.slice(0, 30).map(function(d) {
        return { domain: d.domain, dr: d.dr, flags: d.flags, spamScore: d.spamScore, linkCount: d.links.length };
      })},
      legit: { count: legitDomains.length, pct: legitPct, domains: legitDomains.slice(0, 30).map(function(d) {
        return { domain: d.domain, dr: d.dr, linkCount: d.links.length };
      })},
      healthRating: healthRating,
      recommendations: [],
    };

    // Generate recommendations
    if (spamPct >= 25) {
      bo.spamAnalysis.recommendations.push('Consider using Google\'s Disavow Tool to disavow the ' + spamDomains.length + ' spam domains identified. These low-quality links may be suppressing your domain authority.');
    }
    if (spamDomains.some(function(d) { return d.flags.indexOf('Telegram/spam anchor') >= 0; })) {
      bo.spamAnalysis.recommendations.push('Multiple backlinks contain Telegram spam channel anchors — a sign of automated link-building attacks. Monitor Google Search Console for manual action warnings.');
    }
    if (spamPct >= 50) {
      bo.spamAnalysis.recommendations.push('Over half of referring domains are classified as spam. This is a significant link profile toxicity issue that should be addressed before investing in new link building.');
    }
    if (legitDomains.length < 10) {
      bo.spamAnalysis.recommendations.push('Only ' + legitDomains.length + ' referring domains appear to be high-quality. Prioritize earning links from authoritative, relevant real estate and local business sites.');
    }

    // Build filtered backlinks list (excluding spam domains for cleaner display)
    var spamDomainSet = new Set(spamDomains.map(function(d) { return d.domain; }));
    bo.filteredTopBacklinks = (bo.clientBacklinks || []).filter(function(bl) {
      var src = bl.sourceUrl || '';
      var domain;
      try { domain = new URL(src).hostname.replace(/^www\./, '').toLowerCase(); } catch(e) { return true; }
      return !spamDomainSet.has(domain);
    });

    logInfo('Spam analysis', totalDomains + ' domains: ' + spamDomains.length + ' spam (' + spamPct + '%), ' + suspiciousDomains.length + ' suspicious (' + suspPct + '%), ' + legitDomains.length + ' legit (' + legitPct + '%) — ' + healthRating);
    logInfo('Filtered backlinks', bo.filteredTopBacklinks.length + ' of ' + (bo.clientBacklinks || []).length + ' backlinks after removing spam domains');
    fixes++;
  }

  // ── 7. Competitor comparison table column normalization ─────────────
  // Renderer expects competitor columns named comp1, comp2, etc.
  // Data pipelines may use actual domain names as keys.
  if (Array.isArray(data.competitorComparison) && data.competitorComparison.length) {
    const firstRow = data.competitorComparison[0];
    const hasCompKeys = Object.keys(firstRow).some(function (k) { return /^comp\d+$/.test(k); });

    if (!hasCompKeys) {
      // Identify non-standard competitor columns (everything except 'metric', 'client', 'gap')
      const reservedKeys = { metric: 1, client: 1, gap: 1 };
      const compKeys = Object.keys(firstRow).filter(function (k) { return !reservedKeys[k]; });

      if (compKeys.length) {
        // Build mapping and also populate competitor.all if not already set
        const compMapping = {};
        compKeys.forEach(function (key, index) {
          compMapping[key] = 'comp' + (index + 1);
        });

        data.competitorComparison = data.competitorComparison.map(function (row) {
          const newRow = { metric: row.metric, client: row.client };
          compKeys.forEach(function (key) {
            newRow[compMapping[key]] = row[key];
          });
          if (row.gap != null) newRow.gap = row.gap;
          return newRow;
        });

        // Ensure competitor.all has entries for label resolution
        const comp = data.competitor || (data.competitor = {});
        if (!Array.isArray(comp.all) || !comp.all.length) {
          comp.all = compKeys.map(function (key) {
            return { domain: key, name: key };
          });
        }

        logInfo('Normalized competitorComparison', compKeys.length + ' competitor columns mapped to comp1..comp' + compKeys.length);
        fixes++;
      }
    }
  }


  // ── 8. coreWebVitals — fallback from pagespeed-data.json ─────────────
  // If data.coreWebVitals is still missing after earlier PSI hoists, try again
  // with a broader search of pagespeed-data.json client entries.
  if (!data.coreWebVitals || (!data.coreWebVitals.mobile && !data.coreWebVitals.desktop)) {
    var psi8 = researchLoader.load(researchRoot, PSI_SPEC);
    if (psi8) {
      try {
        deepCamelCaseKeys(psi8);
        var clientEntries8 = (psi8.data && Array.isArray(psi8.data.client)) ? psi8.data.client : [];
        if (clientEntries8.length) {
          var cwv8 = {};
          ['mobile', 'desktop'].forEach(function(strategy) {
            var scores = [];
            var sums = { lcp: 0, cls: 0, fcp: 0, inp: 0, ttfb: 0 };
            clientEntries8.forEach(function(entry) {
              var s = entry[strategy];
              if (!s) return;
              var ps = s.performanceScore != null ? s.performanceScore : s.score;
              if (ps != null) scores.push(ps);
              Object.keys(sums).forEach(function(k) { if (s[k] != null) sums[k] += s[k]; });
            });
            if (scores.length) {
              var avg = scores.reduce(function(a, b) { return a + b; }, 0) / scores.length;
              var n = scores.length;
              cwv8[strategy] = {
                performanceScore: avg,
                score: avg,
                lcp: Math.round(sums.lcp / n),
                cls: Math.round(sums.cls / n * 1000) / 1000,
                fcp: Math.round(sums.fcp / n),
                inp: Math.round(sums.inp / n),
                ttfb: Math.round(sums.ttfb / n),
              };
            }
          });
          if (cwv8.mobile || cwv8.desktop) {
            data.coreWebVitals = cwv8;
            logInfo('Auto-populated coreWebVitals', 'from pagespeed-data.json (' + clientEntries8.length + ' client pages)');
            fixes++;
          }
        }
      } catch (err8) { logWarning('Failed to parse pagespeed-data.json for CWV: ' + err8.message); }
    }
  }

  // ── 9. pageSpeedComparison — fallback from pagespeed-data.json ──────
  if (!Array.isArray(data.pageSpeedComparison) || !data.pageSpeedComparison.length) {
    var psi9 = researchLoader.load(researchRoot, PSI_SPEC);
    if (psi9) {
      try {
        deepCamelCaseKeys(psi9);
        var allDomains9 = [];
        var clientDomains9 = (psi9.data && Array.isArray(psi9.data.client)) ? psi9.data.client : [];
        var compDomains9 = (psi9.data && Array.isArray(psi9.data.competitors)) ? psi9.data.competitors : [];
        clientDomains9.forEach(function(e) { allDomains9.push({ entry: e, isClient: true }); });
        compDomains9.forEach(function(e) { allDomains9.push({ entry: e, isClient: false }); });

        if (allDomains9.length > 1) {
          data.pageSpeedComparison = allDomains9.map(function(item) {
            var e = item.entry;
            var mob = e.mobile ? (e.mobile.performanceScore != null ? e.mobile.performanceScore : e.mobile.score) : null;
            var score = mob != null ? Math.round(mob * 100) : null;
            var name = e.domain || normalizeDomain(e.url) || '';
            if (item.isClient) name += ' (Client)';
            return { name: name, score: score };
          });
          logInfo('Auto-populated pageSpeedComparison', allDomains9.length + ' domains from pagespeed-data.json');
          fixes++;
        }
      } catch (err9) { logWarning('Failed to parse pagespeed-data.json for comparison: ' + err9.message); }
    }
  }

  // ── 10. keywords — merge keyword-data.json + keyword-research.json ──
  if (!Array.isArray(data.keywords) || !data.keywords.length) {
    var kwDataPath = path.join(dataDir, 'research', 'keyword-data.json');
    var kwResearchPath = path.join(dataDir, 'research', 'keyword-research.json');
    var kwVolumesPath = path.join(dataDir, 'research', 'keyword-volumes.json');
    var mergedKeywords = [];

    // Load keyword-data.json (has volume, cpc, competition)
    var kwDataMap = new Map();
    if (fs.existsSync(kwDataPath)) {
      try {
        var kwRaw = JSON.parse(fs.readFileSync(kwDataPath, 'utf-8'));
        deepCamelCaseKeys(kwRaw);
        var kwArr = Array.isArray(kwRaw) ? kwRaw : (kwRaw.data || []);
        kwArr.forEach(function(e) {
          if (e && e.keyword) kwDataMap.set(e.keyword.toLowerCase().trim(), e);
        });
      } catch (err10a) { logWarning('Failed to parse keyword-data.json: ' + err10a.message); }
    }
    // Also try keyword-volumes.json as fallback volume source
    if (fs.existsSync(kwVolumesPath) && !kwDataMap.size) {
      try {
        var kvRaw = JSON.parse(fs.readFileSync(kwVolumesPath, 'utf-8'));
        deepCamelCaseKeys(kvRaw);
        var kvArr = Array.isArray(kvRaw) ? kvRaw : (kvRaw.data || []);
        kvArr.forEach(function(e) {
          if (e && e.keyword) kwDataMap.set(e.keyword.toLowerCase().trim(), e);
        });
      } catch (err10b) { logWarning('Failed to parse keyword-volumes.json: ' + err10b.message); }
    }

    // Load keyword-research.json (has clientFound, competitorDomains, topResult)
    var kwResearchMap = new Map();
    var krRaw = researchLoader.load(researchRoot, KW_RESEARCH_SPEC);
    if (krRaw) {
      try {
        deepCamelCaseKeys(krRaw);
        var krArr = Array.isArray(krRaw) ? krRaw : (krRaw.keywords || krRaw.data || []);
        krArr.forEach(function(e) {
          if (e && e.keyword) kwResearchMap.set(e.keyword.toLowerCase().trim(), e);
        });
      } catch (err10c) { logWarning('Failed to parse keyword-research.json: ' + err10c.message); }
    }

    // Merge: iterate over all unique keywords from both sources
    var allKwKeys = new Set();
    kwDataMap.forEach(function(v, k) { allKwKeys.add(k); });
    kwResearchMap.forEach(function(v, k) { allKwKeys.add(k); });

    allKwKeys.forEach(function(kwKey) {
      var kd = kwDataMap.get(kwKey) || {};
      var kr = kwResearchMap.get(kwKey) || {};
      var volume = kd.volume != null ? kd.volume : (kd.searchVolume != null ? kd.searchVolume : null);
      var compDomains = Array.isArray(kr.competitorDomains) ? kr.competitorDomains : [];
      var compRank = '';
      if (compDomains.length && kr.competitorNotes) {
        compRank = kr.competitorNotes;
      } else if (compDomains.length) {
        compRank = compDomains[0];
      }

      mergedKeywords.push({
        keyword: kr.keyword || kd.keyword || kwKey,
        volume: volume,
        volumeNumeric: volume,
        cpc: kd.cpc != null ? kd.cpc : null,
        competitionIndex: kd.competitionIndex != null ? kd.competitionIndex : null,
        clientRank: kr.clientFound === true ? 'Found' : (kr.clientFound === false ? 'Not found' : ''),
        competitorRank: compRank,
        topResult: kr.topResult || '',
      });
    });

    if (mergedKeywords.length) {
      data.keywords = mergedKeywords;
      logInfo('Auto-populated keywords', mergedKeywords.length + ' keywords from research files');
      fixes++;
    }
  }

  // ── 11. rankHistory — reformat rank-history.json ────────────────────
  if (!data.rankHistory || !data.rankHistory.keywords || !Object.keys(data.rankHistory.keywords).length) {
    var rhPath = path.join(dataDir, 'research', 'rank-history.json');
    if (fs.existsSync(rhPath)) {
      try {
        var rhRaw = JSON.parse(fs.readFileSync(rhPath, 'utf-8'));
        deepCamelCaseKeys(rhRaw);
        var rhKeywords = rhRaw.keywords || {};
        var kwNames = Object.keys(rhKeywords);
        if (kwNames.length) {
          var allDates = new Set();
          var allDomains = new Set();
          var clientDomain11 = (rhRaw.meta && rhRaw.meta.clientDomain) || '';

          kwNames.forEach(function(kwName) {
            var entry = rhKeywords[kwName];
            var positions = entry.positions || entry.history || {};
            Object.keys(positions).forEach(function(domain) {
              allDomains.add(domain);
              var dateMap = positions[domain];
              if (dateMap && typeof dateMap === 'object') {
                Object.keys(dateMap).forEach(function(d) { allDates.add(d); });
              }
            });
          });

          var snapshots = Array.from(allDates).sort();
          var competitors = Array.from(allDomains).filter(function(d) { return d !== clientDomain11; });

          // Rename positions → history for each keyword
          var normalizedKws = {};
          kwNames.forEach(function(kwName) {
            var entry = rhKeywords[kwName];
            normalizedKws[kwName] = {
              volume: entry.volume || null,
              history: entry.positions || entry.history || {},
            };
          });

          // Build chart labels from milestones or dates
          var chartLabels = snapshots.map(function(d) {
            if (rhRaw.milestones && Array.isArray(rhRaw.milestones)) {
              var ms = rhRaw.milestones.find(function(m) { return m.date === d; });
              if (ms && ms.label) return ms.label;
            }
            return d;
          });

          data.rankHistory = {
            snapshots: snapshots,
            chartLabels: chartLabels,
            domains: { client: clientDomain11, competitors: competitors },
            keywords: normalizedKws,
          };
          logInfo('Auto-populated rankHistory', kwNames.length + ' keywords, ' + snapshots.length + ' snapshots');
          fixes++;
        }
      } catch (err11) { logWarning('Failed to parse rank-history.json: ' + err11.message); }
    }
  }

  // ── 12. searchConsoleData — from search-console.json ────────────────
  if (!data.searchConsoleData) {
    var scRaw = researchLoader.load(researchRoot, GSC_SPEC);
    if (scRaw) {
      try {
        deepCamelCaseKeys(scRaw);
        if (scRaw.topQueries || scRaw.topPages) {
          data.searchConsoleData = {
            totalQueries: scRaw.totalQueries || 0,
            totalPages: scRaw.totalPages || 0,
            topQueries: (Array.isArray(scRaw.topQueries) ? scRaw.topQueries : []).slice(0, 50),
            topPages: (Array.isArray(scRaw.topPages) ? scRaw.topPages : []).slice(0, 50),
          };
          logInfo('Auto-populated searchConsoleData', (data.searchConsoleData.topQueries.length) + ' queries, ' + (data.searchConsoleData.topPages.length) + ' pages');
          fixes++;
        }
      } catch (err12) { logWarning('Failed to parse search-console.json: ' + err12.message); }
    }
  }

  // ── 13. trafficData — from ga4-data.json ────────────────────────────
  if (!data.trafficData) {
    var ga4 = researchLoader.load(researchRoot, GA4_SPEC);
    if (ga4) {
      try {
        deepCamelCaseKeys(ga4);
        var trafficData = {};
        var hasTrafficData = false;

        // Channels: group by channel, sum sessions
        if (Array.isArray(ga4.acquisitionChannels) && ga4.acquisitionChannels.length) {
          var channelMap = new Map();
          ga4.acquisitionChannels.forEach(function(item) {
            var name = item.sessionDefaultChannelGroup || item.channel || 'Unknown';
            var existing = channelMap.get(name) || 0;
            channelMap.set(name, existing + (item.sessions || 0));
          });
          trafficData.channels = Array.from(channelMap.entries())
            .map(function(pair) { return { name: pair[0], value: pair[1] }; })
            .sort(function(a, b) { return b.value - a.value; })
            .slice(0, 8);
          hasTrafficData = true;
        }

        // Devices
        if (Array.isArray(ga4.deviceBreakdown) && ga4.deviceBreakdown.length) {
          trafficData.devices = ga4.deviceBreakdown.map(function(item) {
            return { name: item.deviceCategory || 'Unknown', value: item.sessions || 0 };
          });
          hasTrafficData = true;
        }

        // Top landing pages
        if (Array.isArray(ga4.landingPages) && ga4.landingPages.length) {
          trafficData.topLandingPages = ga4.landingPages
            .slice(0, 25)
            .map(function(item) {
              return {
                page: item.landingPage || item.page || '',
                sessions: item.sessions || 0,
                bounceRate: item.bounceRate != null ? item.bounceRate : null,
              };
            });
          hasTrafficData = true;
        }

        if (hasTrafficData) {
          data.trafficData = trafficData;
          logInfo('Auto-populated trafficData', [
            trafficData.channels ? trafficData.channels.length + ' channels' : '',
            trafficData.devices ? trafficData.devices.length + ' devices' : '',
            trafficData.topLandingPages ? trafficData.topLandingPages.length + ' pages' : '',
          ].filter(Boolean).join(', '));
          fixes++;
        }
      } catch (err13) { logWarning('Failed to parse ga4-data.json: ' + err13.message); }
    }
  }

  // ── 14. contentQuality — from crawl-data.json + page-text-analysis.json ─
  if (!data.contentQuality || !Array.isArray(data.contentQuality.pages) || !data.contentQuality.pages.length) {
    var crawlPath14 = path.join(dataDir, 'research', 'crawl-data.json');
    var ptaPath14 = path.join(dataDir, 'research', 'page-text-analysis.json');
    var cqPages = [];

    // Load crawl data for base page info
    var crawlPages14 = [];
    if (fs.existsSync(crawlPath14)) {
      try {
        var crawl14 = JSON.parse(fs.readFileSync(crawlPath14, 'utf-8'));
        deepCamelCaseKeys(crawl14);
        crawlPages14 = Array.isArray(crawl14.pages) ? crawl14.pages : (Array.isArray(crawl14) ? crawl14 : []);
      } catch (err14a) { logWarning('Failed to parse crawl-data.json for contentQuality: ' + err14a.message); }
    }

    // Load text analysis for readability scores
    var ptaMap14 = new Map();
    if (fs.existsSync(ptaPath14)) {
      try {
        var pta14 = JSON.parse(fs.readFileSync(ptaPath14, 'utf-8'));
        deepCamelCaseKeys(pta14);
        var ptaArr14 = Array.isArray(pta14) ? pta14 : (pta14.pages || []);
        ptaArr14.forEach(function(p) {
          if (p && p.url) {
            var key14 = toRelativeUrl(p.url);
            if (!ptaMap14.has(key14)) ptaMap14.set(key14, p);
            if (!ptaMap14.has(p.url)) ptaMap14.set(p.url, p);
          }
        });
      } catch (err14b) { logWarning('Failed to parse page-text-analysis.json for contentQuality: ' + err14b.message); }
    }

    // Build page array
    var sourcePages14 = crawlPages14.length ? crawlPages14 : Array.from(ptaMap14.values());
    sourcePages14.forEach(function(page) {
      var url = page.url || '';
      var relUrl = toRelativeUrl(url);
      var pta = ptaMap14.get(relUrl) || ptaMap14.get(url) || {};

      var wordCount = pta.wordCount != null ? pta.wordCount : (page.wordCount != null ? page.wordCount : null);
      var fleschScore = pta.fleschReadingEase != null ? Number(pta.fleschReadingEase) : null;

      // Quality score: simple formula based on word count + readability
      var qualityScore = null;
      if (wordCount != null) {
        var wcScore = wordCount >= 1500 ? 90 : (wordCount >= 800 ? 70 : (wordCount >= 300 ? 50 : 20));
        var rdScore = fleschScore != null ? Math.min(fleschScore, 100) : 50;
        qualityScore = Math.round((wcScore * 0.6 + rdScore * 0.4));
      }

      cqPages.push({
        url: relUrl || url,
        title: page.title || pta.title || '',
        wordCount: wordCount,
        qualityScore: qualityScore,
        readabilityScore: fleschScore,
        isThin: wordCount != null ? wordCount < 300 : false,
        readability: {
          fleschReadingEase: fleschScore,
          fleschKincaidGrade: pta.fleschKincaidGrade != null ? Number(pta.fleschKincaidGrade) : null,
          wordCount: wordCount,
          syllablesPerWord: pta.avgSyllablesPerWord != null ? Number(pta.avgSyllablesPerWord) : null,
          avgSentenceLength: pta.avgSentenceLength != null ? Number(pta.avgSentenceLength) : null,
          sentenceCount: pta.sentenceCount != null ? Number(pta.sentenceCount) : null,
          readingLevel: pta.readingLevel || '',
          scoreExplanation: buildReadabilityExplanation(pta),
        },
      });
    });

    if (cqPages.length) {
      var scores14 = cqPages.map(function(p) { return p.qualityScore; }).filter(function(s) { return s != null; });
      var words14 = cqPages.map(function(p) { return p.wordCount; }).filter(function(w) { return w != null; });
      var thinCount14 = cqPages.filter(function(p) { return p.isThin; }).length;
      var avgQuality14 = scores14.length ? Math.round(scores14.reduce(function(a, b) { return a + b; }, 0) / scores14.length) : 0;
      var avgWords14 = words14.length ? Math.round(words14.reduce(function(a, b) { return a + b; }, 0) / words14.length) : 0;
      var wordRange14 = words14.length ? [Math.min.apply(null, words14), Math.max.apply(null, words14)] : [0, 0];

      var cq = data.contentQuality || (data.contentQuality = {});
      cq.pages = cqPages;
      cq.summary = {
        totalPages: cqPages.length,
        totalPagesAnalyzed: cqPages.length,
        avgQualityScore: avgQuality14,
        avgWordCount: avgWords14,
        thinPageCount: thinCount14,
        wordCountRange: wordRange14,
        duplicateGroupCount: Array.isArray(cq.duplicateGroups) ? cq.duplicateGroups.length : 0,
      };
      logInfo('Auto-populated contentQuality', cqPages.length + ' pages (' + thinCount14 + ' thin, avg ' + avgWords14 + ' words)');
      fixes++;
    }
  }

  // ── 1b. Auto-derive keyStats from available data ─────────────────────
  // Append derived stat cards if keyStats has fewer than 10 entries.
  var keyStats = Array.isArray(data.keyStats) ? data.keyStats : (data.keyStats = []);
  function hasKeyStat(labelFragment) {
    return keyStats.some(function(s) {
      return s && typeof s.label === 'string' && s.label.toLowerCase().indexOf(labelFragment.toLowerCase()) !== -1;
    });
  }
  function appendKeyStat(obj) {
    if (keyStats.length < 10) keyStats.push(obj);
  }

  if (!hasKeyStat('Mobile Performance') && data.coreWebVitals && data.coreWebVitals.mobile) {
    var mobileScore = data.coreWebVitals.mobile.score != null ? data.coreWebVitals.mobile.score : data.coreWebVitals.mobile.performanceScore;
    if (mobileScore != null) {
      var msPct = mobileScore <= 1 ? Math.round(mobileScore * 100) : Math.round(mobileScore);
      appendKeyStat({
        label: 'Mobile Performance Score',
        value: msPct + '%',
        severity: msPct >= 90 ? 'green' : (msPct >= 50 ? 'yellow' : 'red'),
      });
      fixes++;
    }
  }

  if (!hasKeyStat('Backlink') && data.backlinks && Array.isArray(data.backlinks.topBacklinks) && data.backlinks.topBacklinks.length) {
    appendKeyStat({
      label: 'Total Backlinks',
      value: data.backlinks.topBacklinks.length.toLocaleString ? String(data.backlinks.topBacklinks.length) : data.backlinks.topBacklinks.length,
      severity: 'green',
    });
    fixes++;
  }

  if (!hasKeyStat('Referring Domain') && data.domainMetrics && data.domainMetrics.client && data.domainMetrics.client.referringDomains != null) {
    appendKeyStat({
      label: 'Referring Domains',
      value: String(data.domainMetrics.client.referringDomains),
      severity: 'green',
    });
    fixes++;
  }

  if (!hasKeyStat('Authority Score') && data.domainMetrics && data.domainMetrics.client && data.domainMetrics.client.domainRating != null) {
    var dr = data.domainMetrics.client.domainRating;
    appendKeyStat({
      label: 'Authority Score',
      value: String(dr),
      severity: dr >= 40 ? 'green' : (dr >= 20 ? 'yellow' : 'red'),
    });
    fixes++;
  }

  if (!hasKeyStat('Orphan') && data.internalLinking && (data.internalLinking.orphanCount != null || data.internalLinking.orphan_count != null)) {
    var orphanCount = data.internalLinking.orphanCount != null ? data.internalLinking.orphanCount : data.internalLinking.orphan_count;
    var orphanRate = data.internalLinking.orphanRate != null ? data.internalLinking.orphanRate : (data.internalLinking.orphan_rate != null ? data.internalLinking.orphan_rate : null);
    appendKeyStat({
      label: 'Orphan Pages' + (orphanRate != null ? ' (' + orphanRate + '%)' : ''),
      value: String(orphanCount),
      severity: orphanRate != null && orphanRate > 20 ? 'red' : (orphanCount > 0 ? 'yellow' : 'green'),
    });
    fixes++;
  }

  if (!hasKeyStat('Pages Crawled') && data.internalLinking && (data.internalLinking.totalPages != null || data.internalLinking.total_pages != null)) {
    appendKeyStat({
      label: 'Pages Crawled',
      value: String(data.internalLinking.totalPages != null ? data.internalLinking.totalPages : data.internalLinking.total_pages),
      severity: 'green',
    });
    fixes++;
  }

  // ── 8. Local SEO — read local-seo.json if localSeo is empty/incomplete ──
  const localSeoPath = path.join(dataDir, 'research', 'local-seo.json');
  if (fs.existsSync(localSeoPath)) {
    try {
      const lsRaw = JSON.parse(fs.readFileSync(localSeoPath, 'utf-8'));
      propagateApiErrors('local-seo.json', lsRaw);

      const ls = data.localSeo || (data.localSeo = {});

      // businessProfile: copy if not already set or if empty
      const hasExistingProfile = ls.businessProfile && (
        ls.businessProfile.name || ls.businessProfile.address || ls.businessProfile.phone
      );
      if (!hasExistingProfile && lsRaw.businessProfile) {
        ls.businessProfile = lsRaw.businessProfile;
        logInfo('Auto-populated localSeo.businessProfile', 'from local-seo.json (source: ' + (lsRaw.businessProfile.source || 'web-research') + ')');
        fixes++;
      }

      // napConsistency: copy if not already set
      if (!ls.napConsistency && lsRaw.napConsistency) {
        ls.napConsistency = lsRaw.napConsistency;
        logInfo('Auto-populated localSeo.napConsistency', 'from local-seo.json');
        fixes++;
      }

      // citations: copy from napConsistency directoryListings if citations not set
      if (!ls.citations && lsRaw.citations) {
        ls.citations = lsRaw.citations;
        logInfo('Auto-populated localSeo.citations', lsRaw.citations.totalFound + ' found, ' + (lsRaw.citations.missing || []).length + ' missing');
        fixes++;
      }

      // accessNotes: set based on data source
      if (!ls.accessNotes) {
        ls.accessNotes = {
          source: lsRaw.businessProfile && lsRaw.businessProfile.source || 'web-research',
          note: lsRaw.businessProfile && lsRaw.businessProfile.note || 'Local SEO data gathered from public web research.',
          gbpAccess: false,
        };
        fixes++;
      }
    } catch (err) { logWarning('Failed to parse local-seo.json', err.message); }
  }

  // ── 8a. Local Pack data — read local-pack-data.json if present ──────
  const localPackPath = path.join(dataDir, 'research', 'local-pack-data.json');
  if (fs.existsSync(localPackPath)) {
    try {
      const localPackJson = JSON.parse(fs.readFileSync(localPackPath, 'utf-8'));
      const ls = data.localSeo || (data.localSeo = {});
      if (!ls.mapPackKeywords && localPackJson.keywords && localPackJson.keywords.length > 0) {
        ls.mapPackKeywords = localPackJson.keywords.map(function(kw) {
          return {
            keyword: kw.keyword,
            position: kw.foundInPack ? kw.position : null,
            inPack: kw.foundInPack,
            packSize: kw.packItems.length,
          };
        });
        logInfo('Auto-populated localSeo.mapPackKeywords', 'from local-pack-data.json (' + localPackJson.keywords.length + ' keywords)');
        fixes++;
      }
    } catch (err) { logWarning('Failed to parse local-pack-data.json', err.message); }
  }


  // ── 1e. Sanitize AI tool references from client-facing data ──────────
  (function sanitizeAiReferences(obj, path2) {
    if (!obj || typeof obj !== 'object') return;
    var aiPattern = /\b(Claude|Codex|GPT[-\s]?\d*|OpenAI|Anthropic|AI[- ]generated|AI[- ]assisted|AI tool)\b/gi;
    Object.keys(obj).forEach(function (key) {
      var val = obj[key];
      if (typeof val === 'string') {
        aiPattern.lastIndex = 0;
        if (!aiPattern.test(val)) return;
        aiPattern.lastIndex = 0;
        var cleaned = val.replace(aiPattern, '').replace(/\s*\([,\s]*\)\s*/g, '').replace(/\s{2,}/g, ' ').trim();
        if (cleaned !== val) {
          logWarning('Sanitized AI reference at ' + (path2 ? path2 + '.' : '') + key + ': "' + val.substring(0, 80) + '"');
          obj[key] = cleaned;
        }
      } else if (val && typeof val === 'object') {
        sanitizeAiReferences(val, (path2 ? path2 + '.' : '') + key);
      }
    });
  })(data, '');

  if (fixes) {
    logInfo('Data normalization', `${fixes} fix${fixes === 1 ? '' : 'es'} applied`);
  }
}

/**
 * validateAuditData — checks each page's minimum data contract after normalization.
 * Returns array of { page, severity, message } for any missing/incomplete data.
 */
function validateAuditData(data) {
  var issues = [];

  function check(page, condition, message, severity) {
    if (!condition) {
      issues.push({ page: page, severity: severity || 'warning', message: message });
    }
  }

  function isNonEmptyArray(val) { return Array.isArray(val) && val.length > 0; }
  function isObj(val) { return val && typeof val === 'object' && !Array.isArray(val); }

  // Index page
  var client = data.client || {};
  check('index', client.name || client.company || client.website, 'client name/company is missing — header will be blank', 'critical');
  check('index', isNonEmptyArray(data.keyStats), 'keyStats is empty — stat cards will not render');
  check('index', isNonEmptyArray(data.topIssues), 'topIssues is empty — issues section will be blank');

  // Keywords page
  check('keywords', isNonEmptyArray(data.keywords), 'keywords array is empty — keyword table will not render');

  // Content page
  var cq = data.contentQuality || {};
  check('content', isObj(data.contentQuality), 'contentQuality is missing — entire content page will be empty');
  check('content', isNonEmptyArray(cq.pages), 'contentQuality.pages is empty — readability table will not render');
  check('content', isObj(cq.summary), 'contentQuality.summary is missing — overview stat cards will show dashes');

  // Technical page
  check('technical', isObj(data.coreWebVitals), 'coreWebVitals is missing — CWV gauges will not render');
  var techSeo = data.technicalSeo || {};
  check('technical', isNonEmptyArray(techSeo.lighthouseResults), 'technicalSeo.lighthouseResults is empty — Lighthouse section will be blank');

  // Links page
  var linking = data.internalLinking || {};
  check('links', linking.totalPages != null || linking.total_pages != null, 'internalLinking.totalPages is missing — link overview will be empty');

  // Backlink opportunities page
  var bo = data.backlinkOpportunities || {};
  check('backlink-opportunities', isObj(data.backlinkOpportunities) && (isNonEmptyArray(bo.competitors) || isObj(bo.client)), 'backlinkOpportunities is missing or has no competitors — page will show empty state');

  // Competitors page
  check('competitors', isNonEmptyArray(data.competitorComparison) || isNonEmptyArray(data.siteComparison), 'competitorComparison and siteComparison are both empty — comparison table will not render');

  // Local page
  check('local', isObj(data.localSeo), 'localSeo is missing — entire local page will be empty');

  // Action plan page
  var ap = data.actionPlan || {};
  check('action-plan', isNonEmptyArray(ap.quickWins) || isNonEmptyArray(ap.shortTerm) || isNonEmptyArray(data.quickWins), 'actionPlan has no items — action plan tabs will be empty');

  return issues;
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

  // Normalize data shape before injection — handles field aliasing,
  // format conversion, and auto-population from sibling research files.
  const dataDir = path.dirname(dataPath);
  normalizeAuditData(auditData, dataDir);

  // Validate data completeness — warn about pages that may render empty
  var validationIssues = validateAuditData(auditData);
  if (validationIssues.length) {
    var criticals = validationIssues.filter(function(i) { return i.severity === 'critical'; });
    var warnings = validationIssues.filter(function(i) { return i.severity !== 'critical'; });
    validationIssues.forEach(function(issue) {
      if (issue.severity === 'critical') {
        console.error('\x1b[31mCRITICAL:\x1b[0m Page \'' + issue.page + '\': ' + issue.message);
      } else {
        logWarning('Page \'' + issue.page + '\': ' + issue.message);
      }
    });
    var emptyPages = validationIssues.map(function(i) { return i.page; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
    logInfo('Data validation', validationIssues.length + ' issue(s) — ' + emptyPages.join(', ') + ' page(s) may render empty');
  } else {
    logSuccess('Data validation', 'All 9 pages have required data');
  }

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

    // Always inline JS — required for file:// protocol (Chrome blocks cross-file script loading)
    html = inlineJs(html, __dirname);

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

// Export for testing — only when required as a module, not when run directly
if (require.main === module) {
  try {
    main();
  } catch (error) {
    exitWithError(error.message);
  }
} else {
  module.exports = { normalizeAuditData, validateAuditData, deepCamelCaseKeys, buildSearchIndex };
}
