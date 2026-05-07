// Research-file loader with legacy-name fallback (bd i57 — temporary).
//
// Canonical (JS-pipeline) filenames win. When canonical is missing but Python-
// pipeline legacy files are present, an adapter merges them into the canonical
// shape so downstream renderer code (which only knows canonical names) keeps
// working. The loader caches per-canonical and emits at most one fallback
// warning per canonical per loader instance.
//
// Remove this fallback layer once every client research dir has been
// regenerated to canonical names. See follow-up bd issue covering removal.
//
// Shape parity: outputs match the canonical-file shape that the renderer's
// existing read sites already accept (e.g. matt-wallmow's pagespeed-data.json
// for PSI; p3realtync's search-console.json + ga4-data.json for GSC + GA4).
// Adapters emit camelCase to align with deepCamelCaseKeys idempotency.

'use strict';

const fs = require('fs');
const path = require('path');

function readJsonOrError(p) {
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(p, 'utf-8')) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function makeResearchLoader(logger) {
  const cache = new Map();
  const warned = new Set();
  const log = logger || { warn: function () {}, info: function () {} };

  function load(researchDir, spec) {
    const key = spec.canonical;
    if (cache.has(key)) return cache.get(key);

    const canonicalPath = path.join(researchDir, spec.canonical);
    if (fs.existsSync(canonicalPath)) {
      const r = readJsonOrError(canonicalPath);
      if (!r.ok) {
        log.warn('Failed to parse canonical ' + spec.canonical + ': ' + r.error);
        cache.set(key, null);
        return null;
      }
      cache.set(key, r.data);
      return r.data;
    }

    const legacyPresent = (spec.legacy || []).filter(function (name) {
      return fs.existsSync(path.join(researchDir, name));
    });
    if (!legacyPresent.length || typeof spec.mergeLegacy !== 'function') {
      cache.set(key, null);
      return null;
    }

    const legacyData = {};
    legacyPresent.forEach(function (name) {
      const r = readJsonOrError(path.join(researchDir, name));
      if (r.ok) legacyData[name] = r.data;
    });

    let merged = null;
    try {
      merged = spec.mergeLegacy(legacyData);
    } catch (err) {
      log.warn('Legacy merge for ' + spec.canonical + ' failed: ' + err.message);
      cache.set(key, null);
      return null;
    }

    if (merged && !warned.has(key)) {
      warned.add(key);
      log.warn(
        'using legacy research files for ' + spec.canonical + ': ' +
          legacyPresent.join(', ') +
          '. Migrate producer to canonical ' + spec.canonical +
          '. (bd i57 temporary fallback)'
      );
    }

    cache.set(key, merged);
    return merged;
  }

  return { load: load };
}

// ── Adapters ─────────────────────────────────────────────────────────────────

function domainFromUrl(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

// pagespeed.json (homepage, {mobile:{...}, desktop:{...}}) +
// pagespeed-interior.json (array of {url, strategy, ...})
//   → {data: {client: [{url, domain, mobile, desktop}], competitors: []}}
//
// Emits the canonical shape consumed by generate-multipage-report.js sections
// 1, 8, 9 (lighthouseResults, coreWebVitals, pageSpeedComparison). The
// canonical shape uses camelCase (performanceScore, speedIndex) and
// opportunities {title, id, savings}; legacy uses snake_case + savings_ms.
function mergeLegacyPagespeed(legacy) {
  const homepage = legacy['pagespeed.json'];
  const interior = legacy['pagespeed-interior.json'];
  const byUrl = new Map();

  function ensure(url) {
    if (!byUrl.has(url)) {
      byUrl.set(url, { url: url, domain: domainFromUrl(url) });
    }
    return byUrl.get(url);
  }

  function copyStrategy(target, strategy, src) {
    if (!src) return;
    const ps = src.performance_score != null ? src.performance_score : src.performanceScore;
    const si = src.speed_index != null ? src.speed_index : src.speedIndex;
    const opps = Array.isArray(src.opportunities) ? src.opportunities : [];
    target[strategy] = {
      url: src.url || target.url,
      performanceScore: ps != null ? ps : null,
      lcp: src.lcp,
      cls: src.cls,
      fcp: src.fcp,
      inp: src.inp,
      ttfb: src.ttfb,
      speedIndex: si != null ? si : null,
      opportunities: opps.map(function (o) {
        const savings =
          o.savings_ms != null ? o.savings_ms :
          (o.savings != null ? o.savings :
          (o.savingsMs != null ? o.savingsMs : 0));
        return { title: o.title || o.id || '', id: o.id || '', savings: savings };
      }),
    };
  }

  if (homepage && (homepage.mobile || homepage.desktop)) {
    const url =
      (homepage.mobile && homepage.mobile.url) ||
      (homepage.desktop && homepage.desktop.url) ||
      '';
    if (url) {
      const entry = ensure(url);
      copyStrategy(entry, 'mobile', homepage.mobile);
      copyStrategy(entry, 'desktop', homepage.desktop);
    }
  }

  if (Array.isArray(interior)) {
    interior.forEach(function (row) {
      if (!row || !row.url || !row.strategy) return;
      const entry = ensure(row.url);
      copyStrategy(entry, row.strategy, row);
    });
  }

  const client = Array.from(byUrl.values());
  if (!client.length) return null;
  return { data: { client: client, competitors: [] } };
}

// gsc-pages.json + gsc-queries.json (+ optional gsc-devices.json, gsc-query-pages.json)
//   → {topQueries, topPages, totalQueries, totalPages}
function mergeLegacyGsc(legacy) {
  const queries = legacy['gsc-queries.json'];
  const pages = legacy['gsc-pages.json'];
  const out = { topQueries: [], topPages: [], totalQueries: 0, totalPages: 0 };
  if (Array.isArray(queries)) {
    out.topQueries = queries;
    out.totalQueries = queries.length;
  }
  if (Array.isArray(pages)) {
    out.topPages = pages;
    out.totalPages = pages.length;
  }
  if (!out.topQueries.length && !out.topPages.length) return null;
  return out;
}

// ga4-acquisition.json + ga4-devices.json + ga4-landing-pages.json + ga4-page-performance.json
//   → {acquisitionChannels, deviceBreakdown, landingPages, pagePerformance}
function mergeLegacyGa4(legacy) {
  const out = { acquisitionChannels: [], deviceBreakdown: [], landingPages: [], pagePerformance: [] };
  const acq = legacy['ga4-acquisition.json'];
  const dev = legacy['ga4-devices.json'];
  const lp = legacy['ga4-landing-pages.json'];
  const pp = legacy['ga4-page-performance.json'];
  if (Array.isArray(acq)) out.acquisitionChannels = acq;
  if (Array.isArray(dev)) out.deviceBreakdown = dev;
  if (Array.isArray(lp)) out.landingPages = lp;
  if (Array.isArray(pp)) out.pagePerformance = pp;
  if (!out.acquisitionChannels.length && !out.deviceBreakdown.length &&
      !out.landingPages.length && !out.pagePerformance.length) {
    return null;
  }
  return out;
}

// keyword-suggestions.json (array of {keyword, volume, difficulty, cpc, ...})
//   → {keywords: [{keyword, volume, cpc}]}
//
// Suggestions has no clientFound / competitorDomains / topResult signal —
// those fields are absent in the merged output. The renderer's keyword merger
// treats missing fields as empty cells, so this degrades cleanly.
function mergeLegacyKeywords(legacy) {
  const sugg = legacy['keyword-suggestions.json'];
  if (!Array.isArray(sugg) || !sugg.length) return null;
  return {
    keywords: sugg
      .filter(function (e) { return e && e.keyword; })
      .map(function (e) {
        return {
          keyword: e.keyword,
          volume: e.volume != null ? e.volume : null,
          cpc: e.cpc != null ? e.cpc : null,
        };
      }),
  };
}

module.exports = {
  makeResearchLoader: makeResearchLoader,
  mergeLegacyPagespeed: mergeLegacyPagespeed,
  mergeLegacyGsc: mergeLegacyGsc,
  mergeLegacyGa4: mergeLegacyGa4,
  mergeLegacyKeywords: mergeLegacyKeywords,
  __domainFromUrl: domainFromUrl,
};
