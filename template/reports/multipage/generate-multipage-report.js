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
            opp.domainRating ? `DR: ${opp.domainRating}` : '',
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
            comp.domainRating ? `DR: ${comp.domainRating}` : '',
          ]),
          terms: [
            comp.domain,
            'competitor',
            'backlink',
            'domain rating',
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
  const tech = data.technicalSeo || (data.technicalSeo = {});
  let fixes = 0;
  data._dataSourceErrors = data._dataSourceErrors || {};

  function propagateApiErrors(source, payload) {
    if (!payload || typeof payload !== 'object') return;

    const errors = Array.isArray(payload.errors) ? payload.errors : [];
    const status = typeof payload.status === 'string' ? payload.status : null;
    const hasErrorStatus = status === 'partial' || status === 'failed' || status === 'error';

    if (!errors.length && !hasErrorStatus) return;

    data._dataSourceErrors[source] = {
      errors: errors,
      status: status || (errors.length ? 'partial' : 'failed'),
    };

    if (typeof payload.gatheredAt === 'string' && payload.gatheredAt) {
      data._dataSourceErrors[source].gatheredAt = payload.gatheredAt;
    }

    if (errors.length) {
      logWarning(source + ' has API errors', errors.length + ' error(s): ' + (errors[0].reason || errors[0].message || JSON.stringify(errors[0])));
    }
    if (status === 'failed') {
      logWarning(source + ' FAILED', 'All API calls failed — section will show error details in report');
    }
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
    const psiPath = path.join(dataDir, 'research', 'pagespeed-data.json');
    if (fs.existsSync(psiPath)) {
      try {
        const psi = JSON.parse(fs.readFileSync(psiPath, 'utf-8'));
        propagateApiErrors('pagespeed-data.json', psi);
        const clientPages = (psi.data && Array.isArray(psi.data.client)) ? psi.data.client : [];
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
      } catch (err) { logWarning('Failed to parse pagespeed-data.json', err.message); }
    }
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
    const allPages = new Set();
    let totalLinks = 0;

    Object.keys(linkEdges).forEach(function (source) {
      const targets = Array.isArray(linkEdges[source]) ? linkEdges[source] : [];
      allPages.add(source);
      outbound[source] = targets.length;
      totalLinks += targets.length;
      targets.forEach(function (target) {
        allPages.add(target);
        inbound[target] = (inbound[target] || 0) + 1;
      });
    });

    const sitemapPages = new Set(Object.keys(linkEdges));
    const pageCount = sitemapPages.size;

    // ── 5a. Recompute overview stats if stale (total_pages is 0 or missing) ──
    const currentTotal = Number(linking.total_pages || linking.totalPages) || 0;
    if (currentTotal === 0 && pageCount > 0) {
      // Compute averages across sitemap pages
      const inboundValues = [];
      const outboundValues = [];
      sitemapPages.forEach(function (url) {
        inboundValues.push(inbound[url] || 0);
        outboundValues.push(outbound[url] || 0);
      });
      const sum = function (arr) { return arr.reduce(function (a, b) { return a + b; }, 0); };
      const avgIn = pageCount ? sum(inboundValues) / pageCount : 0;
      const avgOut = pageCount ? sum(outboundValues) / pageCount : 0;

      // Identify orphans: pages in sitemap with 0 inbound links (except homepage)
      const orphans = [];
      sitemapPages.forEach(function (url) {
        if ((inbound[url] || 0) === 0) {
          // Don't count homepage as orphan
          const pathname = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
          if (pathname && pathname !== '') {
            orphans.push({
              url: url,
              outbound_links: outbound[url] || 0,
              is_in_sitemap: true,
              recommendation: 'No contextual links point to this page. Add it to at least 2-3 hub or category pages.',
            });
          }
        }
      });

      linking.total_pages = pageCount;
      linking.total_internal_links = totalLinks;
      linking.avg_inbound_links = Math.round(avgIn * 10) / 10;
      linking.avg_outbound_links = Math.round(avgOut * 10) / 10;
      linking.orphan_count = orphans.length;
      linking.orphan_rate = pageCount ? Math.round((orphans.length / pageCount) * 1000) / 10 : 0;

      // Only replace orphans list if current one looks stale too
      const currentOrphans = Array.isArray(linking.orphans) ? linking.orphans : [];
      if (!currentOrphans.length || currentOrphans.length === Number(linking.orphan_count)) {
        linking.orphans = orphans;
      }

      // Recompute issues based on real data
      const issues = [];
      if (orphans.length > 0) issues.push('HAS_ORPHANS');
      if (avgIn < 2) issues.push('WEAK_INTERNAL_LINKING');
      if (!hubClusters.length) issues.push('NO_HUB_STRUCTURE');
      linking.issues = issues;

      linking.recommendations = [];
      if (avgIn < 2) {
        linking.recommendations.push(
          'Average inbound contextual links per page is ' + linking.avg_inbound_links +
          ' (below 2.0). Increase internal linking density across the site.'
        );
      }
      if (orphans.length > 0) {
        linking.recommendations.push(
          orphans.length + ' orphan page' + (orphans.length === 1 ? '' : 's') +
          ' found with zero inbound links. Add contextual links from hub or category pages.'
        );
      }

      logInfo('Auto-populated link overview', pageCount + ' pages, ' + totalLinks + ' links, ' + orphans.length + ' orphans');
      fixes++;
    }

    // ── 5b. Build hub clusters if missing ──
    if (!hubClusters.length) {
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
  }

  // ── 5c. Content readability — enrich with syllables/word from page-text-analysis.json ──
  const ptaPath = path.join(dataDir, 'research', 'page-text-analysis.json');
  if (fs.existsSync(ptaPath)) {
    try {
      const ptaRaw = JSON.parse(fs.readFileSync(ptaPath, 'utf-8'));
      propagateApiErrors('page-text-analysis.json', ptaRaw);
      const ptaPages = Array.isArray(ptaRaw) ? ptaRaw : (ptaRaw.pages || []);
      if (ptaPages.length) {
        const ptaByUrl = {};
        ptaPages.forEach(function (p) { if (p.url) ptaByUrl[p.url] = p; });

        const cq = data.contentQuality || {};
        const cqPages = Array.isArray(cq.pages) ? cq.pages : [];
        let enriched = 0;
        cqPages.forEach(function (page) {
          if (!page || !page.readability) return;
          const pta = ptaByUrl[page.url];
          if (!pta) return;
          if (pta.avgSyllablesPerWord != null && page.readability.syllablesPerWord == null) {
            page.readability.syllablesPerWord = pta.avgSyllablesPerWord;
            enriched++;
          }
          if (pta.avgSentenceLength != null && page.readability.avgSentenceLength == null) {
            page.readability.avgSentenceLength = pta.avgSentenceLength;
          }
          if (pta.sentenceCount != null && page.readability.sentenceCount == null) {
            page.readability.sentenceCount = pta.sentenceCount;
          }
        });
        if (enriched) {
          logInfo('Enriched readability data', enriched + ' pages with syllables/word from page-text-analysis.json');
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

      if (rawDomains.length && !backlinks.topReferringDomains) {
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
    } catch (err) { logWarning('Failed to parse client-backlinks.json', err.message); }
  }

  // ── 6. Domain metrics comparison (competitors page) ──────────────────
  // Renderer reads data.domainMetrics = { client: { domain, domainRating,
  // organicTraffic, organicKeywords, referringDomains, backlinks, trafficValue },
  // competitors: [same shape] }.
  // Data pipelines put this in backlinks.competitorDomainMetrics or
  // competitorAnalysis.domainMetricsComparison, or research/domain-metrics.json.
  if (!data.domainMetrics || (!data.domainMetrics.client && !data.domainMetrics.competitors)) {
    // Try backlinks.competitorDomainMetrics first (most common)
    let sourceEntries = null;
    const bl = data.backlinks || {};
    const ca = data.competitorAnalysis || {};

    if (Array.isArray(bl.competitorDomainMetrics) && bl.competitorDomainMetrics.length) {
      sourceEntries = bl.competitorDomainMetrics;
    } else if (Array.isArray(ca.domainMetricsComparison) && ca.domainMetricsComparison.length) {
      sourceEntries = ca.domainMetricsComparison;
    }

    // Fallback: read from research/domain-metrics.json
    if (!sourceEntries) {
      const dmPath = path.join(dataDir, 'research', 'domain-metrics.json');
      if (fs.existsSync(dmPath)) {
        try {
          const dmFile = JSON.parse(fs.readFileSync(dmPath, 'utf-8'));
          propagateApiErrors('domain-metrics.json', dmFile);
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
          domain:           e.domain || '',
          domainRating:     e.domainRating != null ? e.domainRating : (e.domain_rating != null ? e.domain_rating : (e.dr != null ? e.dr : null)),
          organicTraffic:   e.organicTraffic != null ? e.organicTraffic : (e.organic_traffic != null ? e.organic_traffic : null),
          organicKeywords:  e.organicKeywords != null ? e.organicKeywords : (e.organic_keywords != null ? e.organic_keywords : null),
          referringDomains: e.referringDomains != null ? e.referringDomains : (e.referring_domains != null ? e.referring_domains : null),
          backlinks:        e.backlinks != null ? e.backlinks : (e.totalBacklinks != null ? e.totalBacklinks : (e.total_backlinks != null ? e.total_backlinks : null)),
          trafficValue:     e.trafficValue != null ? e.trafficValue : (e.traffic_value != null ? e.traffic_value : null),
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

  // ── 6b. Backlink Opportunities — build from available data ──────────
  const bo = data.backlinkOpportunities || (data.backlinkOpportunities = {});

  // Client profile
  if (!bo.client) {
    const blMetrics = (data.backlinks || {}).domainMetrics || {};
    bo.client = {
      domain: blMetrics.domain || (data.client && (data.client.website || data.client.websiteUrl)) || '',
      backlinks: blMetrics.totalBacklinks || 0,
      referringDomains: blMetrics.referringDomains || 0,
      domainRating: blMetrics.domainRating || 0,
      dofollowRatio: (data.backlinks || {}).dofollowRatio || 0
    };
  }

  // Competitor profiles (from competitorDomainMetrics)
  if (!bo.competitors || !bo.competitors.length) {
    const cdm = (data.backlinks || {}).competitorDomainMetrics || [];
    bo.competitors = cdm.filter(function(c) { return !c.isClient; }).map(function(c) {
      return {
        domain: c.domain || '',
        backlinks: c.backlinks || c.totalBacklinks || 0,
        referringDomains: c.referringDomains || 0,
        domainRating: c.domainRating || 0,
        dofollowRatio: c.dofollowRatio || 0
      };
    });
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

  // Similarity pairs default
  if (!bo.similarityPairs) {
    bo.similarityPairs = [];
  }

  logInfo('Backlink opportunities data',
    'client=' + (bo.client.domain || 'unknown') +
    ', competitors=' + bo.competitors.length +
    ', opportunities=' + bo.opportunities.length +
    ', clientBacklinks=' + bo.clientBacklinks.length);

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

  if (fixes) {
    logInfo('Data normalization', `${fixes} fix${fixes === 1 ? '' : 'es'} applied`);
  }
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
