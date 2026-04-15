'use strict';

const path = require('path');
const fs = require('fs');

// Mock fs for research file reads — must come before require
const originalReadFileSync = fs.readFileSync;
const originalExistsSync = fs.existsSync;
let mockFiles = {};

function setMockFiles(files) {
  mockFiles = files;
}

function installFsMocks() {
  fs.existsSync = function(p) {
    if (mockFiles[p] !== undefined) return true;
    return originalExistsSync(p);
  };
  fs.readFileSync = function(p, enc) {
    if (mockFiles[p] !== undefined) return typeof mockFiles[p] === 'string' ? mockFiles[p] : JSON.stringify(mockFiles[p]);
    return originalReadFileSync(p, enc);
  };
}

function restoreFsMocks() {
  fs.existsSync = originalExistsSync;
  fs.readFileSync = originalReadFileSync;
  mockFiles = {};
}

const { deepCamelCaseKeys, normalizeAuditData, validateAuditData } = require('./generate-multipage-report');

afterEach(restoreFsMocks);

// ── deepCamelCaseKeys tests ─────────────────────────────────────────

describe('deepCamelCaseKeys', function() {
  test('converts snake_case keys to camelCase', function() {
    var obj = { quality_score: 5, word_count: 100, normal: 'keep' };
    deepCamelCaseKeys(obj);
    expect(obj.qualityScore).toBe(5);
    expect(obj.wordCount).toBe(100);
    expect(obj.normal).toBe('keep');
    expect(obj.quality_score).toBeUndefined();
    expect(obj.word_count).toBeUndefined();
  });

  test('recurses into nested objects', function() {
    var obj = { outer: { inner_key: 'value', deep: { very_deep_key: 42 } } };
    deepCamelCaseKeys(obj);
    expect(obj.outer.innerKey).toBe('value');
    expect(obj.outer.deep.veryDeepKey).toBe(42);
  });

  test('handles arrays of objects', function() {
    var arr = [{ is_thin: true }, { domain_rating: 50 }];
    deepCamelCaseKeys(arr);
    expect(arr[0].isThin).toBe(true);
    expect(arr[1].domainRating).toBe(50);
  });

  test('skips keys starting with underscore', function() {
    var obj = { _internal_key: 'skip', normal_key: 'convert' };
    deepCamelCaseKeys(obj);
    expect(obj._internal_key).toBe('skip');
    expect(obj.normalKey).toBe('convert');
  });

  test('does not overwrite existing camelCase keys', function() {
    var obj = { qualityScore: 99, quality_score: 50 };
    deepCamelCaseKeys(obj);
    expect(obj.qualityScore).toBe(99);
  });

  test('handles null and primitive values safely', function() {
    expect(deepCamelCaseKeys(null)).toBeNull();
    expect(deepCamelCaseKeys(undefined)).toBeUndefined();
    expect(deepCamelCaseKeys(42)).toBe(42);
  });
});

// ── normalizeAuditData tests ────────────────────────────────────────

describe('normalizeAuditData', function() {
  test('does not crash on empty input', function() {
    var data = {};
    expect(function() { normalizeAuditData(data, '/tmp'); }).not.toThrow();
    expect(data.technicalSeo).toBeDefined();
    expect(data.apiErrors).toEqual([]);
  });

  test('hoists coreWebVitals from technicalSeo to top level', function() {
    var data = {
      technicalSeo: {
        coreWebVitals: {
          mobile: { performanceScore: 0.85 },
          desktop: { performanceScore: 0.95 },
        },
      },
    };
    normalizeAuditData(data, '/tmp');
    expect(data.coreWebVitals).toBeDefined();
    expect(data.coreWebVitals.mobile.score).toBe(0.85);
    expect(data.coreWebVitals.desktop.score).toBe(0.95);
  });

  test('populates lighthouseResults from pagespeed-data.json', function() {
    var dataDir = '/tmp/test-client/seo';
    var psiPath = path.join(dataDir, 'research', 'pagespeed-data.json');
    installFsMocks();
    setMockFiles({
      [psiPath]: {
        data: {
          client: [{
            url: 'https://example.com/',
            domain: 'example.com',
            mobile: { performance_score: 0.75, lcp: 3000, cls: 0.1, fcp: 2000, inp: 100, ttfb: 50, speed_index: 2500 },
            desktop: { performance_score: 0.90, lcp: 1500, cls: 0.01, fcp: 800, inp: 50, ttfb: 30, speed_index: 1200 },
          }],
          competitors: [],
        },
      },
    });

    var data = { client: { website: 'example.com' }, technicalSeo: {} };
    normalizeAuditData(data, dataDir);

    expect(Array.isArray(data.technicalSeo.lighthouseResults)).toBe(true);
    expect(data.technicalSeo.lighthouseResults.length).toBeGreaterThan(0);
  });

  test('populates keywords from keyword-data.json + keyword-research.json', function() {
    var dataDir = '/tmp/test-kw/seo';
    var kdPath = path.join(dataDir, 'research', 'keyword-data.json');
    var krPath = path.join(dataDir, 'research', 'keyword-research.json');
    installFsMocks();
    setMockFiles({
      [kdPath]: { data: [{ keyword: 'test keyword', volume: 500, cpc: 1.5, competition_index: 30 }] },
      [krPath]: { keywords: [{ keyword: 'test keyword', clientFound: false, competitorDomains: ['comp.com'], topResult: 'top.com' }] },
    });

    var data = { client: { website: 'example.com' } };
    normalizeAuditData(data, dataDir);

    expect(Array.isArray(data.keywords)).toBe(true);
    expect(data.keywords.length).toBe(1);
    expect(data.keywords[0].keyword).toBe('test keyword');
    expect(data.keywords[0].volume).toBe(500);
    expect(data.keywords[0].clientRank).toBe('Not found');
    expect(data.keywords[0].topResult).toBe('top.com');
  });

  test('populates searchConsoleData from search-console.json', function() {
    var dataDir = '/tmp/test-sc/seo';
    var scPath = path.join(dataDir, 'research', 'search-console.json');
    installFsMocks();
    setMockFiles({
      [scPath]: {
        totalQueries: 100,
        totalPages: 50,
        topQueries: [{ query: 'test', clicks: 10, impressions: 100, ctr: 0.1, position: 5 }],
        topPages: [{ page: '/test', clicks: 5, impressions: 50, ctr: 0.1, position: 3 }],
      },
    });

    var data = { client: { website: 'example.com' } };
    normalizeAuditData(data, dataDir);

    expect(data.searchConsoleData).toBeDefined();
    expect(data.searchConsoleData.topQueries.length).toBe(1);
    expect(data.searchConsoleData.topQueries[0].query).toBe('test');
  });

  test('writes camelCase keys for internalLinking stats', function() {
    var dataDir = '/tmp/test-links/seo';
    var lgPath = path.join(dataDir, 'research', 'link-graph.json');
    installFsMocks();
    setMockFiles({
      [lgPath]: {
        edges: {
          'https://example.com/': ['https://example.com/about', 'https://example.com/contact'],
          'https://example.com/about': ['https://example.com/'],
          'https://example.com/contact': ['https://example.com/'],
        },
      },
    });

    var data = { client: { website: 'example.com' }, internalLinking: {} };
    normalizeAuditData(data, dataDir);

    // Should use camelCase, not snake_case
    expect(data.internalLinking.totalPages).toBeDefined();
    expect(data.internalLinking.total_pages).toBeUndefined();
    expect(data.internalLinking.orphanCount).toBeDefined();
    expect(data.internalLinking.orphan_count).toBeUndefined();
  });
});

// ── validateAuditData tests ─────────────────────────────────────────

describe('validateAuditData', function() {
  test('returns warnings for missing content data', function() {
    var data = { client: { name: 'Test' }, technicalSeo: {} };
    var issues = validateAuditData(data);
    var contentIssues = issues.filter(function(i) { return i.page === 'content'; });
    expect(contentIssues.length).toBeGreaterThan(0);
    expect(contentIssues[0].message).toContain('contentQuality');
  });

  test('returns no warnings for complete data', function() {
    var data = {
      client: { name: 'Test Client' },
      keyStats: [{ label: 'test', value: '1', severity: 'green' }],
      topIssues: [{ issue: 'Test issue', detail: 'Detail', impact: 'high' }],
      keywords: [{ keyword: 'test', volume: 100 }],
      contentQuality: {
        pages: [{ url: '/test', qualityScore: 80 }],
        summary: { totalPages: 1, avgQualityScore: 80 },
      },
      coreWebVitals: { mobile: { score: 0.9 }, desktop: { score: 0.95 } },
      technicalSeo: {
        lighthouseResults: [{ url: '/test', strategy: 'mobile', performanceScore: 90 }],
      },
      internalLinking: { totalPages: 10 },
      backlinkOpportunities: { client: { domain: 'test.com' }, competitors: [{ domain: 'comp.com' }] },
      competitorComparison: [{ metric: 'DR', client: '50', comp1: '60' }],
      localSeo: { businessProfile: { title: 'Test' } },
      actionPlan: { quickWins: [{ action: 'Fix titles' }] },
    };
    var issues = validateAuditData(data);
    expect(issues.length).toBe(0);
  });

  test('flags critical issue for missing client name', function() {
    var data = { client: {}, technicalSeo: {} };
    var issues = validateAuditData(data);
    var critical = issues.filter(function(i) { return i.severity === 'critical'; });
    expect(critical.length).toBeGreaterThan(0);
    expect(critical[0].page).toBe('index');
  });
});
