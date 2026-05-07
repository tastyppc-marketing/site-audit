// Tests for the bd i57 legacy-filename fallback loader.
// Fixtures are real-client slices (mammoth-lakes for legacy, matt-wallmow /
// p3realtync for canonical). Keyword-research has no real-client canonical,
// so fixture is hand-built minimal shape.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  makeResearchLoader,
  mergeLegacyPagespeed,
  mergeLegacyGsc,
  mergeLegacyGa4,
  mergeLegacyKeywords,
} = require('../load-research');

const FIXTURES = path.join(__dirname, '__fixtures__');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'load-research-'));
}

function copyFixture(tmpDir, fixtureName, destName) {
  fs.copyFileSync(path.join(FIXTURES, fixtureName), path.join(tmpDir, destName));
}

function recordingLogger() {
  const warnings = [];
  return {
    warn: function (msg) { warnings.push(String(msg)); },
    info: function () {},
    warnings: warnings,
  };
}

const SPECS = {
  pagespeed: {
    canonical: 'pagespeed-data.json',
    legacy: ['pagespeed.json', 'pagespeed-interior.json'],
    mergeLegacy: mergeLegacyPagespeed,
    canonicalFixture: 'canonical-pagespeed-data.json',
    legacyFixtures: { 'pagespeed.json': 'legacy-pagespeed.json', 'pagespeed-interior.json': 'legacy-pagespeed-interior.json' },
  },
  gsc: {
    canonical: 'search-console.json',
    legacy: ['gsc-pages.json', 'gsc-queries.json', 'gsc-devices.json', 'gsc-query-pages.json'],
    mergeLegacy: mergeLegacyGsc,
    canonicalFixture: 'canonical-search-console.json',
    legacyFixtures: {
      'gsc-pages.json': 'legacy-gsc-pages.json',
      'gsc-queries.json': 'legacy-gsc-queries.json',
      'gsc-devices.json': 'legacy-gsc-devices.json',
      'gsc-query-pages.json': 'legacy-gsc-query-pages.json',
    },
  },
  ga4: {
    canonical: 'ga4-data.json',
    legacy: ['ga4-acquisition.json', 'ga4-devices.json', 'ga4-landing-pages.json', 'ga4-page-performance.json'],
    mergeLegacy: mergeLegacyGa4,
    canonicalFixture: 'canonical-ga4-data.json',
    legacyFixtures: {
      'ga4-acquisition.json': 'legacy-ga4-acquisition.json',
      'ga4-devices.json': 'legacy-ga4-devices.json',
      'ga4-landing-pages.json': 'legacy-ga4-landing-pages.json',
      'ga4-page-performance.json': 'legacy-ga4-page-performance.json',
    },
  },
  keyword: {
    canonical: 'keyword-research.json',
    legacy: ['keyword-suggestions.json'],
    mergeLegacy: mergeLegacyKeywords,
    canonicalFixture: 'canonical-keyword-research.json',
    legacyFixtures: { 'keyword-suggestions.json': 'legacy-keyword-suggestions.json' },
  },
};

describe('load-research: canonical-only', () => {
  Object.entries(SPECS).forEach(([key, spec]) => {
    test(`${key}: canonical present, no legacy → returns canonical, no warning`, () => {
      const tmp = makeTmpDir();
      copyFixture(tmp, spec.canonicalFixture, spec.canonical);
      const log = recordingLogger();
      const loader = makeResearchLoader(log);
      const result = loader.load(tmp, spec);
      expect(result).not.toBeNull();
      expect(log.warnings).toHaveLength(0);
    });
  });
});

describe('load-research: legacy-only', () => {
  Object.entries(SPECS).forEach(([key, spec]) => {
    test(`${key}: only legacy present → adapter merges, exactly one warning`, () => {
      const tmp = makeTmpDir();
      Object.entries(spec.legacyFixtures).forEach(([targetName, fixtureName]) => {
        copyFixture(tmp, fixtureName, targetName);
      });
      const log = recordingLogger();
      const loader = makeResearchLoader(log);
      const result = loader.load(tmp, spec);
      expect(result).not.toBeNull();
      expect(log.warnings).toHaveLength(1);
      expect(log.warnings[0]).toMatch(/legacy research files for/);
      expect(log.warnings[0]).toContain(spec.canonical);
    });
  });
});

describe('load-research: canonical wins when both present', () => {
  test('pagespeed: canonical + legacy → returns canonical, no warning', () => {
    const tmp = makeTmpDir();
    copyFixture(tmp, 'canonical-pagespeed-data.json', 'pagespeed-data.json');
    copyFixture(tmp, 'legacy-pagespeed.json', 'pagespeed.json');
    copyFixture(tmp, 'legacy-pagespeed-interior.json', 'pagespeed-interior.json');
    const log = recordingLogger();
    const loader = makeResearchLoader(log);
    const result = loader.load(tmp, SPECS.pagespeed);
    expect(result).not.toBeNull();
    // Canonical matt-wallmow client url is mattwallmow.com — not the mammoth url
    expect(result.data.client[0].url).toMatch(/mattwallmow/);
    expect(log.warnings).toHaveLength(0);
  });
});

describe('load-research: none present', () => {
  Object.entries(SPECS).forEach(([key, spec]) => {
    test(`${key}: neither canonical nor legacy → null, no warning`, () => {
      const tmp = makeTmpDir();
      const log = recordingLogger();
      const loader = makeResearchLoader(log);
      const result = loader.load(tmp, spec);
      expect(result).toBeNull();
      expect(log.warnings).toHaveLength(0);
    });
  });
});

describe('load-research: warn-once (cached)', () => {
  test('pagespeed loaded 3 times via legacy → exactly one warning', () => {
    const tmp = makeTmpDir();
    copyFixture(tmp, 'legacy-pagespeed.json', 'pagespeed.json');
    copyFixture(tmp, 'legacy-pagespeed-interior.json', 'pagespeed-interior.json');
    const log = recordingLogger();
    const loader = makeResearchLoader(log);
    const r1 = loader.load(tmp, SPECS.pagespeed);
    const r2 = loader.load(tmp, SPECS.pagespeed);
    const r3 = loader.load(tmp, SPECS.pagespeed);
    expect(r1).toBe(r2); // same cached reference
    expect(r2).toBe(r3);
    expect(log.warnings).toHaveLength(1);
  });
});

describe('load-research: malformed legacy ignored when canonical exists', () => {
  test('canonical valid + legacy malformed → canonical wins, no warning, no error', () => {
    const tmp = makeTmpDir();
    copyFixture(tmp, 'canonical-pagespeed-data.json', 'pagespeed-data.json');
    fs.writeFileSync(path.join(tmp, 'pagespeed.json'), '{this is not json');
    fs.writeFileSync(path.join(tmp, 'pagespeed-interior.json'), '{nor is this');
    const log = recordingLogger();
    const loader = makeResearchLoader(log);
    const result = loader.load(tmp, SPECS.pagespeed);
    expect(result).not.toBeNull();
    expect(result.data.client[0].url).toMatch(/mattwallmow/);
    expect(log.warnings).toHaveLength(0); // canonical short-circuits before parsing legacy
  });
});

describe('load-research: shape contract — pagespeed legacy adapter', () => {
  test('mammoth legacy → canonical-shape with camelCase + savings field', () => {
    const tmp = makeTmpDir();
    copyFixture(tmp, 'legacy-pagespeed.json', 'pagespeed.json');
    copyFixture(tmp, 'legacy-pagespeed-interior.json', 'pagespeed-interior.json');
    const log = recordingLogger();
    const loader = makeResearchLoader(log);
    const result = loader.load(tmp, SPECS.pagespeed);
    expect(result).toEqual(expect.objectContaining({
      data: expect.objectContaining({
        client: expect.any(Array),
        competitors: expect.any(Array),
      }),
    }));
    const first = result.data.client[0];
    expect(first.url).toBeTruthy();
    expect(first.domain).toBeTruthy();
    expect(first.mobile).toBeDefined();
    // performanceScore (camelCase), not performance_score
    expect(first.mobile.performanceScore).toBeDefined();
    expect(first.mobile.speedIndex).toBeDefined();
    // opportunities use {title, id, savings}, not savings_ms
    if (Array.isArray(first.mobile.opportunities) && first.mobile.opportunities.length) {
      const opp = first.mobile.opportunities[0];
      expect(opp).toHaveProperty('title');
      expect(opp).toHaveProperty('id');
      expect(opp).toHaveProperty('savings');
      expect(opp).not.toHaveProperty('savings_ms');
    }
  });
});

describe('load-research: shape contract — gsc legacy adapter', () => {
  test('mammoth legacy → {topQueries, topPages, totalQueries, totalPages}', () => {
    const tmp = makeTmpDir();
    Object.entries(SPECS.gsc.legacyFixtures).forEach(([target, fixture]) => {
      copyFixture(tmp, fixture, target);
    });
    const result = makeResearchLoader(recordingLogger()).load(tmp, SPECS.gsc);
    expect(Array.isArray(result.topQueries)).toBe(true);
    expect(Array.isArray(result.topPages)).toBe(true);
    expect(typeof result.totalQueries).toBe('number');
    expect(typeof result.totalPages).toBe('number');
  });
});

describe('load-research: shape contract — ga4 legacy adapter', () => {
  test('mammoth legacy → {acquisitionChannels, deviceBreakdown, landingPages, pagePerformance}', () => {
    const tmp = makeTmpDir();
    Object.entries(SPECS.ga4.legacyFixtures).forEach(([target, fixture]) => {
      copyFixture(tmp, fixture, target);
    });
    const result = makeResearchLoader(recordingLogger()).load(tmp, SPECS.ga4);
    expect(Array.isArray(result.acquisitionChannels)).toBe(true);
    expect(Array.isArray(result.deviceBreakdown)).toBe(true);
    expect(Array.isArray(result.landingPages)).toBe(true);
    expect(Array.isArray(result.pagePerformance)).toBe(true);
  });
});

describe('load-research: shape contract — keyword legacy adapter', () => {
  test('mammoth legacy keyword-suggestions → {keywords: [{keyword, volume, cpc}]}', () => {
    const tmp = makeTmpDir();
    copyFixture(tmp, 'legacy-keyword-suggestions.json', 'keyword-suggestions.json');
    const result = makeResearchLoader(recordingLogger()).load(tmp, SPECS.keyword);
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);
    const k = result.keywords[0];
    expect(k).toHaveProperty('keyword');
    expect(k).toHaveProperty('volume');
    expect(k).toHaveProperty('cpc');
  });
});
