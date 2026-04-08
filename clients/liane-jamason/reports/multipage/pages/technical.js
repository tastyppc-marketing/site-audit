/**
 * pages/technical.js — Technical SEO & Performance page renderer
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'technical';

  var utils = window.TPPC.utils || {};
  var esc = utils.esc || function (str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  var formatNumber = utils.formatNumber || function (n) {
    if (n == null || isNaN(Number(n))) return String(n || '');
    return Number(n).toLocaleString();
  };
  var buildCollapsible = utils.buildCollapsible || function (title, contentFn) {
    return '<div class="mb-2">' +
      '<div class="collapsible-header"><span>' + esc(title) + '</span></div>' +
      '<div class="collapsible-body"><div class="p-4">' + contentFn() + '</div></div>' +
    '</div>';
  };

  function $(id) {
    return document.getElementById(id);
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toNumber(value) {
    if (value == null || value === '') return null;
    var num = Number(value);
    return isNaN(num) ? null : num;
  }

  function normalizeScore(score) {
    var num = toNumber(score);
    if (num == null) return null;
    if (num <= 1) return Math.round(num * 100);
    return Math.round(num);
  }

  function normalizeText(value) {
    if (value == null) return '';
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function average(values) {
    var numbers = values.filter(function (value) {
      return value != null && !isNaN(value);
    });
    if (!numbers.length) return null;
    var total = numbers.reduce(function (sum, value) {
      return sum + value;
    }, 0);
    return total / numbers.length;
  }

  function uniqueCount(values) {
    var seen = {};
    values.forEach(function (value) {
      if (value != null && value !== '') seen[String(value)] = true;
    });
    return Object.keys(seen).length;
  }

  function statCard(value, label, severity, helper) {
    var sev = severity ? ' severity-' + severity : '';
    return '<div class="stat-card' + sev + '">' +
      '<div class="stat-value">' + esc(value) + '</div>' +
      '<div class="stat-label">' + esc(label) + '</div>' +
      (helper ? '<div class="text-xs text-slate-400 mt-2">' + esc(helper) + '</div>' : '') +
    '</div>';
  }

  function emptyState(title, message) {
    return '<div class="empty-state">' +
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 15.75h.008v.008H12v-.008Z" />' +
      '</svg>' +
      '<div class="text-base font-semibold text-slate-600">' + esc(title) + '</div>' +
      '<p>' + esc(message) + '</p>' +
    '</div>';
  }

  function formatMetric(metric, value) {
    var num = toNumber(value);
    if (num == null) return 'N/A';
    if (metric === 'CLS') return num.toFixed(2);
    return formatNumber(Math.round(num)) + ' ms';
  }

  function scoreTone(score) {
    if (score == null) return 'slate';
    if (score >= 90) return 'green';
    if (score >= 50) return 'amber';
    return 'red';
  }

  function scoreBadge(score) {
    var tone = scoreTone(score);
    var classes = tone === 'green'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : tone === 'amber'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : tone === 'red'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-slate-50 text-slate-600 border-slate-200';

    return '<span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ' + classes + '">' +
      esc(score != null ? score + '/100' : 'N/A') +
    '</span>';
  }

  function coverageBadge(isGood, yesLabel, noLabel) {
    return isGood
      ? '<span class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">' + esc(yesLabel) + '</span>'
      : '<span class="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">' + esc(noLabel) + '</span>';
  }

  function statusBadge(statusCode) {
    var code = toNumber(statusCode);
    var cls = 'info';
    if (code >= 500) cls = 'critical';
    else if (code >= 400) cls = 'high';
    else if (code >= 300) cls = 'medium';
    else if (code >= 200) cls = 'low';
    return '<span class="severity-badge ' + cls + '">' + esc(statusCode) + '</span>';
  }

  function normalizeCWVData(coreWebVitals) {
    if (!coreWebVitals || typeof coreWebVitals !== 'object') return null;

    function normalizeDevice(deviceData) {
      if (!deviceData || typeof deviceData !== 'object') return null;

      var normalized = {};
      ['LCP', 'CLS', 'FCP', 'INP', 'TTFB'].forEach(function (metric) {
        var direct = deviceData[metric];
        var lower = deviceData[metric.toLowerCase()];
        var value = direct != null ? direct : lower;
        if (value != null) normalized[metric] = toNumber(value) != null ? toNumber(value) : value;
      });

      return Object.keys(normalized).length ? normalized : null;
    }

    var mobile = normalizeDevice(coreWebVitals.mobile);
    var desktop = normalizeDevice(coreWebVitals.desktop);

    if (!mobile && !desktop) return null;
    return {
      mobile: mobile,
      desktop: desktop
    };
  }

  function normalizeComparisonScores(comparison) {
    return asArray(comparison)
      .map(function (entry) {
        return {
          name: normalizeText(entry && entry.name),
          score: normalizeScore(entry && entry.score)
        };
      })
      .filter(function (entry) {
        return entry.name && entry.score != null;
      });
  }

  function normalizeLighthouseResults(results) {
    return asArray(results)
      .map(function (record) {
        return {
          url: normalizeText(record && record.url),
          strategy: normalizeText(record && record.strategy).toLowerCase() || 'unknown',
          performanceScore: normalizeScore(record && record.performanceScore),
          lcp: toNumber(record && (record.lcp != null ? record.lcp : record.LCP)),
          inp: toNumber(record && (record.inp != null ? record.inp : record.INP)),
          cls: toNumber(record && (record.cls != null ? record.cls : record.CLS)),
          fcp: toNumber(record && (record.fcp != null ? record.fcp : record.FCP)),
          ttfb: toNumber(record && (record.ttfb != null ? record.ttfb : record.TTFB)),
          speedIndex: toNumber(record && record.speedIndex),
          opportunities: asArray(record && record.opportunities),
          diagnostics: asArray(record && record.diagnostics)
        };
      })
      .filter(function (record) {
        return record.url || record.performanceScore != null;
      });
  }

  function buildSchemaSummary(summary, pageAudits) {
    var audits = asArray(pageAudits);
    var schemaTypes = {};
    var withSchema = 0;

    audits.forEach(function (audit) {
      var types = asArray(audit && audit.schemaTypes).filter(Boolean);
      var hasSchema = !!audit.hasSchema || !!types.length;
      if (hasSchema) withSchema += 1;
      types.forEach(function (type) {
        schemaTypes[String(type)] = true;
      });
    });

    var derived = audits.length ? {
      pagesWithSchema: withSchema,
      pagesWithoutSchema: audits.length - withSchema,
      schemaTypesFound: Object.keys(schemaTypes),
      recommendedSchemas: []
    } : null;

    if (summary && typeof summary === 'object') {
      return {
        pagesWithSchema: toNumber(summary.pagesWithSchema) != null ? toNumber(summary.pagesWithSchema) : derived && derived.pagesWithSchema,
        pagesWithoutSchema: toNumber(summary.pagesWithoutSchema) != null ? toNumber(summary.pagesWithoutSchema) : derived && derived.pagesWithoutSchema,
        schemaTypesFound: asArray(summary.schemaTypesFound).length ? asArray(summary.schemaTypesFound) : derived ? derived.schemaTypesFound : [],
        recommendedSchemas: asArray(summary.recommendedSchemas)
      };
    }

    if (!derived) return null;
    return {
      pagesWithSchema: derived.pagesWithSchema,
      pagesWithoutSchema: derived.pagesWithoutSchema,
      schemaTypesFound: derived.schemaTypesFound,
      recommendedSchemas: derived.recommendedSchemas
    };
  }

  function buildMetaSummary(summary, pageAudits) {
    var audits = asArray(pageAudits);
    var titleGroups = collectDuplicateGroups(audits, 'title');
    var descriptionGroups = collectDuplicateGroups(audits, 'metaDescription');
    var withTitle = 0;
    var withDescription = 0;
    var withCanonical = 0;

    audits.forEach(function (audit) {
      if (normalizeText(audit && audit.title)) withTitle += 1;
      if (normalizeText(audit && audit.metaDescription)) withDescription += 1;
      if (normalizeText(audit && audit.canonicalUrl)) withCanonical += 1;
    });

    var derived = audits.length ? {
      pagesWithTitle: withTitle,
      pagesWithoutTitle: audits.length - withTitle,
      pagesWithDescription: withDescription,
      pagesWithoutDescription: audits.length - withDescription,
      duplicateTitles: titleGroups.length,
      duplicateDescriptions: descriptionGroups.length,
      pagesWithCanonical: withCanonical,
      pagesWithoutCanonical: audits.length - withCanonical
    } : null;

    if (summary && typeof summary === 'object') {
      return {
        pagesWithTitle: toNumber(summary.pagesWithTitle) != null ? toNumber(summary.pagesWithTitle) : derived && derived.pagesWithTitle,
        pagesWithoutTitle: toNumber(summary.pagesWithoutTitle) != null ? toNumber(summary.pagesWithoutTitle) : derived && derived.pagesWithoutTitle,
        pagesWithDescription: toNumber(summary.pagesWithDescription) != null ? toNumber(summary.pagesWithDescription) : derived && derived.pagesWithDescription,
        pagesWithoutDescription: toNumber(summary.pagesWithoutDescription) != null ? toNumber(summary.pagesWithoutDescription) : derived && derived.pagesWithoutDescription,
        duplicateTitles: toNumber(summary.duplicateTitles) != null ? toNumber(summary.duplicateTitles) : derived && derived.duplicateTitles,
        duplicateDescriptions: toNumber(summary.duplicateDescriptions) != null ? toNumber(summary.duplicateDescriptions) : derived && derived.duplicateDescriptions,
        pagesWithCanonical: toNumber(summary.pagesWithCanonical) != null ? toNumber(summary.pagesWithCanonical) : derived && derived.pagesWithCanonical,
        pagesWithoutCanonical: toNumber(summary.pagesWithoutCanonical) != null ? toNumber(summary.pagesWithoutCanonical) : derived && derived.pagesWithoutCanonical
      };
    }

    if (!derived) return null;
    return {
      pagesWithTitle: derived.pagesWithTitle,
      pagesWithoutTitle: derived.pagesWithoutTitle,
      pagesWithDescription: derived.pagesWithDescription,
      pagesWithoutDescription: derived.pagesWithoutDescription,
      duplicateTitles: derived.duplicateTitles,
      duplicateDescriptions: derived.duplicateDescriptions,
      pagesWithCanonical: derived.pagesWithCanonical,
      pagesWithoutCanonical: derived.pagesWithoutCanonical
    };
  }

  function collectDuplicateGroups(pageAudits, fieldName) {
    var groups = {};

    asArray(pageAudits).forEach(function (audit) {
      var value = normalizeText(audit && audit[fieldName]);
      var url = normalizeText(audit && audit.url);

      if (!value) return;

      var key = value.toLowerCase();
      if (!groups[key]) {
        groups[key] = {
          value: value,
          urls: []
        };
      }
      groups[key].urls.push(url || 'Untitled page');
    });

    return Object.keys(groups)
      .map(function (key) {
        return groups[key];
      })
      .filter(function (group) {
        return group.urls.length > 1;
      })
      .sort(function (a, b) {
        return b.urls.length - a.urls.length;
      });
  }

  function renderCoreWebVitals(data) {
    var container = $('section-cwv-content');
    if (!container) return;

    var raw = data && data.coreWebVitals;
    var normalized = normalizeCWVData(raw);
    if (!normalized) {
      container.innerHTML = emptyState(
        'No Core Web Vitals data',
        'This audit build did not include a coreWebVitals object for mobile or desktop rendering.'
      );
      return;
    }

    var cards = [];
    if (raw && raw.mobile && raw.mobile.score != null) {
      cards.push(statCard(
        normalizeScore(raw.mobile.score) + '/100',
        'Mobile lab score',
        scoreTone(normalizeScore(raw.mobile.score)) === 'amber' ? 'orange' : scoreTone(normalizeScore(raw.mobile.score)) === 'green' ? 'green' : 'red'
      ));
    }
    if (raw && raw.desktop && raw.desktop.score != null) {
      cards.push(statCard(
        normalizeScore(raw.desktop.score) + '/100',
        'Desktop lab score',
        scoreTone(normalizeScore(raw.desktop.score)) === 'amber' ? 'orange' : scoreTone(normalizeScore(raw.desktop.score)) === 'green' ? 'green' : 'red'
      ));
    }
    if (raw && raw.crux && raw.crux.lcp_p75 != null) {
      cards.push(statCard(formatMetric('LCP', raw.crux.lcp_p75), 'CrUX p75 LCP', 'green'));
    }
    if (raw && raw.crux && raw.crux.cls_p75 != null) {
      cards.push(statCard(formatMetric('CLS', raw.crux.cls_p75), 'CrUX p75 CLS', 'green'));
    }

    var note = '';
    if (raw && raw.crux && raw.crux.note) {
      note = '<div class="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-slate-700">' +
        '<div class="font-semibold text-slate-800 mb-1">Real-user context</div>' +
        '<p>' + esc(raw.crux.note) + '</p>' +
      '</div>';
    }

    container.innerHTML =
      (cards.length
        ? '<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">' + cards.join('') + '</div>'
        : '') +
      '<div id="cwv-gauge-grid" class="grid gap-6 lg:grid-cols-2"></div>' +
      (note ? '<div class="mt-6">' + note + '</div>' : '');

    if (window.TPPC.charts && typeof window.TPPC.charts.renderCWVGauges === 'function') {
      window.TPPC.charts.renderCWVGauges('cwv-gauge-grid', normalized);
    }
  }

  function renderPageSpeed(data) {
    var container = $('section-pagespeed-content');
    if (!container) return;

    var technicalSeo = data && data.technicalSeo ? data.technicalSeo : {};
    var lighthouseResults = normalizeLighthouseResults(technicalSeo.lighthouseResults);
    var comparison = normalizeComparisonScores(data && data.pageSpeedComparison);

    if (!lighthouseResults.length && !comparison.length) {
      container.innerHTML = emptyState(
        'No PageSpeed data',
        'technicalSeo.lighthouseResults and pageSpeedComparison were not included in this audit payload.'
      );
      return;
    }

    var overviewCards = [];
    if (lighthouseResults.length) {
      var allScores = lighthouseResults.map(function (result) { return result.performanceScore; });
      var mobileScores = lighthouseResults
        .filter(function (result) { return result.strategy === 'mobile'; })
        .map(function (result) { return result.performanceScore; });
      var desktopScores = lighthouseResults
        .filter(function (result) { return result.strategy === 'desktop'; })
        .map(function (result) { return result.performanceScore; });

      overviewCards.push(statCard(String(lighthouseResults.length), 'Lighthouse runs captured', 'green'));
      overviewCards.push(statCard(
        average(allScores) != null ? Math.round(average(allScores)) + '/100' : 'N/A',
        'Average performance score',
        scoreTone(average(allScores)) === 'amber' ? 'orange' : scoreTone(average(allScores)) === 'green' ? 'green' : 'red'
      ));
      overviewCards.push(statCard(
        mobileScores.length ? Math.round(average(mobileScores)) + '/100' : 'N/A',
        'Average mobile score',
        scoreTone(average(mobileScores)) === 'amber' ? 'orange' : scoreTone(average(mobileScores)) === 'green' ? 'green' : 'red'
      ));
      overviewCards.push(statCard(
        desktopScores.length ? Math.round(average(desktopScores)) + '/100' : 'N/A',
        'Average desktop score',
        scoreTone(average(desktopScores)) === 'amber' ? 'orange' : scoreTone(average(desktopScores)) === 'green' ? 'green' : 'red'
      ));
    }

    var html = '';
    if (overviewCards.length) {
      html += '<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">' + overviewCards.join('') + '</div>';
    }

    if (comparison.length) {
      html += '<div class="chart-container mb-8">' +
        '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">' +
          '<div>' +
            '<h3 class="text-base font-bold text-slate-800">PageSpeed Comparison</h3>' +
            '<p class="text-sm text-slate-500">Existing benchmark scores used elsewhere in the audit.</p>' +
          '</div>' +
        '</div>' +
        '<div class="h-80"><canvas id="pagespeed-comparison-chart"></canvas></div>' +
      '</div>';
    }

    if (!lighthouseResults.length) {
      html += emptyState(
        'No page-level Lighthouse results',
        'The new technicalSeo.lighthouseResults array is missing, so only existing comparison data can be shown here.'
      );
      container.innerHTML = html;

      if (comparison.length && window.TPPC.charts && typeof window.TPPC.charts.createBarChart === 'function') {
        window.TPPC.charts.createBarChart('pagespeed-comparison-chart', {
          horizontal: true,
          labels: comparison.map(function (entry) { return entry.name; }),
          datasets: [{
            label: 'PageSpeed Score',
            data: comparison.map(function (entry) { return entry.score; }),
            backgroundColor: comparison.map(function (entry) {
              var tone = scoreTone(entry.score);
              return tone === 'green' ? 'rgba(34,197,94,0.75)' : tone === 'amber' ? 'rgba(249,115,22,0.75)' : 'rgba(239,68,68,0.75)';
            })
          }],
          options: {
            scales: {
              x: { min: 0, max: 100, grid: { color: '#f1f5f9' } },
              y: { grid: { display: false } }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
      return;
    }

    html += '<div class="space-y-5">';
    lighthouseResults.forEach(function (result) {
      var opportunityBlock = result.opportunities.length
        ? buildCollapsible('Opportunities (' + result.opportunities.length + ')', function () {
            return '<div class="space-y-3">' + result.opportunities.map(function (item) {
              var savings = toNumber(item && item.savings);
              return '<div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">' +
                '<div class="font-semibold text-slate-800">' + esc(item && item.title ? item.title : item && item.id ? item.id : 'Untitled opportunity') + '</div>' +
                (savings != null ? '<div class="text-xs text-slate-500 mt-1">Estimated savings: ' + esc(formatNumber(Math.round(savings))) + ' ms</div>' : '') +
              '</div>';
            }).join('') + '</div>';
          })
        : '';

      var diagnosticBlock = result.diagnostics.length
        ? buildCollapsible('Diagnostics (' + result.diagnostics.length + ')', function () {
            return '<div class="space-y-3">' + result.diagnostics.map(function (item) {
              return '<div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">' +
                '<div class="font-semibold text-slate-800">' + esc(item && item.title ? item.title : item && item.id ? item.id : 'Untitled diagnostic') + '</div>' +
                (item && item.value != null ? '<div class="text-xs text-slate-500 mt-1">Observed value: ' + esc(item.value) + '</div>' : '') +
              '</div>';
            }).join('') + '</div>';
          })
        : '';

      html += '<article class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">' +
        '<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">' +
          '<div class="min-w-0">' +
            '<div class="flex flex-wrap items-center gap-2 mb-2">' +
              '<span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">' + esc(result.strategy || 'unknown') + '</span>' +
              scoreBadge(result.performanceScore) +
            '</div>' +
            '<div class="text-base font-bold text-slate-800 break-all">' + esc(result.url || 'Untitled URL') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-6 mt-5">' +
          statCard(formatMetric('LCP', result.lcp), 'LCP', 'red') +
          statCard(formatMetric('INP', result.inp), 'INP', 'orange') +
          statCard(formatMetric('CLS', result.cls), 'CLS', 'orange') +
          statCard(formatMetric('FCP', result.fcp), 'FCP', 'orange') +
          statCard(formatMetric('TTFB', result.ttfb), 'TTFB', 'green') +
          statCard(result.speedIndex != null ? formatNumber(Math.round(result.speedIndex)) + ' ms' : 'N/A', 'Speed Index', 'orange') +
        '</div>' +
        ((opportunityBlock || diagnosticBlock)
          ? '<div class="mt-6">' + opportunityBlock + diagnosticBlock + '</div>'
          : '') +
      '</article>';
    });
    html += '</div>';

    container.innerHTML = html;

    if (comparison.length && window.TPPC.charts && typeof window.TPPC.charts.createBarChart === 'function') {
      window.TPPC.charts.createBarChart('pagespeed-comparison-chart', {
        horizontal: true,
        labels: comparison.map(function (entry) { return entry.name; }),
        datasets: [{
          label: 'PageSpeed Score',
          data: comparison.map(function (entry) { return entry.score; }),
          backgroundColor: comparison.map(function (entry) {
            var tone = scoreTone(entry.score);
            return tone === 'green' ? 'rgba(34,197,94,0.75)' : tone === 'amber' ? 'rgba(249,115,22,0.75)' : 'rgba(239,68,68,0.75)';
          })
        }],
        options: {
          scales: {
            x: { min: 0, max: 100, grid: { color: '#f1f5f9' } },
            y: { grid: { display: false } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  function renderSchemaAudit(data) {
    var container = $('section-schema-content');
    if (!container) return;

    var technicalSeo = data && data.technicalSeo ? data.technicalSeo : {};
    var pageAudits = asArray(technicalSeo.pageAudits);
    var summary = buildSchemaSummary(technicalSeo.schemaSummary, pageAudits);

    if (!summary) {
      container.innerHTML = emptyState(
        'No schema audit data',
        'technicalSeo.schemaSummary and page-level schema audit data were not included in this report.'
      );
      return;
    }

    var schemaTypesFound = asArray(summary.schemaTypesFound).filter(Boolean);
    var recommendedSchemas = asArray(summary.recommendedSchemas).filter(Boolean);
    var pagesMissingSchema = pageAudits.filter(function (audit) {
      return !(audit && audit.hasSchema) && !asArray(audit && audit.schemaTypes).length;
    });
    var pagesWithSchema = pageAudits.filter(function (audit) {
      return !!(audit && audit.hasSchema) || !!asArray(audit && audit.schemaTypes).length;
    });

    container.innerHTML =
      '<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] mb-8">' +
        '<div class="chart-container">' +
          '<div class="flex items-center justify-between gap-3 mb-4">' +
            '<div>' +
              '<h3 class="text-base font-bold text-slate-800">Schema Coverage</h3>' +
              '<p class="text-sm text-slate-500">Share of audited pages with any detected schema.</p>' +
            '</div>' +
          '</div>' +
          '<div class="h-72"><canvas id="schema-coverage-chart"></canvas></div>' +
        '</div>' +
        '<div class="grid gap-4 sm:grid-cols-2">' +
          statCard(summary.pagesWithSchema != null ? formatNumber(summary.pagesWithSchema) : 'N/A', 'Pages with schema', 'green') +
          statCard(summary.pagesWithoutSchema != null ? formatNumber(summary.pagesWithoutSchema) : 'N/A', 'Pages without schema', 'red') +
          statCard(String(schemaTypesFound.length), 'Schema types found', schemaTypesFound.length ? 'green' : 'orange') +
          statCard(String(recommendedSchemas.length), 'Recommended schema types', recommendedSchemas.length ? 'orange' : 'green') +
        '</div>' +
      '</div>' +
      '<div class="grid gap-6 lg:grid-cols-2 mb-8">' +
        '<div class="bg-white border border-slate-200 rounded-2xl p-6">' +
          '<h3 class="text-base font-bold text-slate-800 mb-4">Detected Schema Types</h3>' +
          (schemaTypesFound.length
            ? '<div class="flex flex-wrap gap-2">' + schemaTypesFound.map(function (type) {
                return '<span class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">' + esc(type) + '</span>';
              }).join('') + '</div>'
            : '<p class="text-sm text-slate-500">No schema types were detected in the available page audit data.</p>') +
        '</div>' +
        '<div class="bg-white border border-slate-200 rounded-2xl p-6">' +
          '<h3 class="text-base font-bold text-slate-800 mb-4">Recommended Schema Types</h3>' +
          (recommendedSchemas.length
            ? '<div class="flex flex-wrap gap-2">' + recommendedSchemas.map(function (type) {
                return '<span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">' + esc(type) + '</span>';
              }).join('') + '</div>'
            : '<p class="text-sm text-slate-500">No recommendation list was supplied for this audit.</p>') +
        '</div>' +
      '</div>' +
      (pageAudits.length
        ? '<div class="grid gap-6 xl:grid-cols-2">' +
            '<div>' +
              '<h3 class="text-base font-bold text-slate-800 mb-4">Pages Missing Schema</h3>' +
              '<div class="report-table-wrap">' +
                '<table class="report-table">' +
                  '<thead><tr><th>Page</th><th>Status</th></tr></thead>' +
                  '<tbody>' +
                    (pagesMissingSchema.length
                      ? pagesMissingSchema.map(function (audit) {
                          return '<tr>' +
                            '<td><div class="font-medium text-slate-700 break-all">' + esc(audit.url || audit.title || 'Untitled page') + '</div></td>' +
                            '<td>' + coverageBadge(false, 'Schema found', 'Missing schema') + '</td>' +
                          '</tr>';
                        }).join('')
                      : '<tr><td colspan="2" class="text-slate-500">Every audited page has some schema coverage.</td></tr>') +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<h3 class="text-base font-bold text-slate-800 mb-4">Pages With Schema</h3>' +
              '<div class="report-table-wrap">' +
                '<table class="report-table">' +
                  '<thead><tr><th>Page</th><th>Schema Types</th></tr></thead>' +
                  '<tbody>' +
                    (pagesWithSchema.length
                      ? pagesWithSchema.map(function (audit) {
                          var types = asArray(audit && audit.schemaTypes).filter(Boolean);
                          return '<tr>' +
                            '<td><div class="font-medium text-slate-700 break-all">' + esc(audit && (audit.url || audit.title) ? audit.url || audit.title : 'Untitled page') + '</div></td>' +
                            '<td>' + esc(types.length ? types.join(', ') : 'Schema present') + '</td>' +
                          '</tr>';
                        }).join('')
                      : '<tr><td colspan="2" class="text-slate-500">No audited pages were marked as having schema.</td></tr>') +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>'
        : '');

    if (window.TPPC.charts && typeof window.TPPC.charts.createDoughnutChart === 'function') {
      window.TPPC.charts.createDoughnutChart('schema-coverage-chart', {
        labels: ['Pages with schema', 'Pages without schema'],
        data: [summary.pagesWithSchema || 0, summary.pagesWithoutSchema || 0],
        colors: ['#22c55e', '#ef4444'],
        options: {
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 16
              }
            }
          }
        }
      });
    }
  }

  function renderMetaTagAudit(data) {
    var container = $('section-meta-content');
    if (!container) return;

    var technicalSeo = data && data.technicalSeo ? data.technicalSeo : {};
    var pageAudits = asArray(technicalSeo.pageAudits);
    var summary = buildMetaSummary(technicalSeo.metaTagSummary, pageAudits);

    if (!summary) {
      container.innerHTML = emptyState(
        'No meta-tag audit data',
        'technicalSeo.metaTagSummary and page-level title or canonical data were not included in this report.'
      );
      return;
    }

    var duplicateTitles = collectDuplicateGroups(pageAudits, 'title');
    var duplicateDescriptions = collectDuplicateGroups(pageAudits, 'metaDescription');
    var missingMetaPages = pageAudits.filter(function (audit) {
      return !normalizeText(audit && audit.title) ||
        !normalizeText(audit && audit.metaDescription) ||
        !normalizeText(audit && audit.canonicalUrl);
    });

    container.innerHTML =
      '<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">' +
        statCard(summary.pagesWithTitle != null ? formatNumber(summary.pagesWithTitle) : 'N/A', 'Pages with title tag', 'green') +
        statCard(summary.pagesWithoutTitle != null ? formatNumber(summary.pagesWithoutTitle) : 'N/A', 'Pages missing title tag', 'red') +
        statCard(summary.pagesWithDescription != null ? formatNumber(summary.pagesWithDescription) : 'N/A', 'Pages with meta description', 'green') +
        statCard(summary.pagesWithoutDescription != null ? formatNumber(summary.pagesWithoutDescription) : 'N/A', 'Pages missing description', 'red') +
        statCard(summary.pagesWithCanonical != null ? formatNumber(summary.pagesWithCanonical) : 'N/A', 'Pages with canonical', 'green') +
        statCard(summary.pagesWithoutCanonical != null ? formatNumber(summary.pagesWithoutCanonical) : 'N/A', 'Pages missing canonical', 'red') +
        statCard(summary.duplicateTitles != null ? formatNumber(summary.duplicateTitles) : 'N/A', 'Duplicate title groups', summary.duplicateTitles ? 'orange' : 'green') +
        statCard(summary.duplicateDescriptions != null ? formatNumber(summary.duplicateDescriptions) : 'N/A', 'Duplicate description groups', summary.duplicateDescriptions ? 'orange' : 'green') +
      '</div>' +
      (pageAudits.length
        ? '<div class="grid gap-6 xl:grid-cols-2">' +
            '<div>' +
              '<h3 class="text-base font-bold text-slate-800 mb-4">Pages Missing Key Meta Tags</h3>' +
              '<div data-filterable data-filters=\'[{"col":1,"label":"Missing","type":"unique"}]\'>' +
              '<div class="report-table-wrap">' +
                '<table class="report-table">' +
                  '<thead><tr><th>Page</th><th>Missing</th><th>Details</th></tr></thead>' +
                  '<tbody>' +
                    (missingMetaPages.length
                      ? missingMetaPages.map(function (audit) {
                          var missing = [];
                          if (!normalizeText(audit.title)) missing.push('Title');
                          if (!normalizeText(audit.metaDescription)) missing.push('Description');
                          if (!normalizeText(audit.canonicalUrl)) missing.push('Canonical');
                          return '<tr>' +
                            '<td>' +
                              '<div class="font-medium text-slate-700 break-all">' + esc(audit.url || audit.title || 'Untitled page') + '</div>' +
                              (audit.title ? '<div class="text-xs text-slate-500 mt-1">' + esc(audit.title) + '</div>' : '') +
                            '</td>' +
                            '<td>' + esc(missing.join(', ')) + '</td>' +
                            '<td class="text-slate-500 text-xs">' +
                              'Title: ' + esc(normalizeText(audit.title) ? normalizeText(audit.title).length + ' chars' : 'Missing') + '<br>' +
                              'Description: ' + esc(normalizeText(audit.metaDescription) ? normalizeText(audit.metaDescription).length + ' chars' : 'Missing') +
                            '</td>' +
                          '</tr>';
                        }).join('')
                      : '<tr><td colspan="3" class="text-slate-500">No missing title, description, or canonical tags were flagged.</td></tr>') +
                  '</tbody>' +
                '</table>' +
              '</div>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<h3 class="text-base font-bold text-slate-800 mb-4">Duplicate Meta Content</h3>' +
              '<div class="report-table-wrap">' +
                '<table class="report-table">' +
                  '<thead><tr><th>Type</th><th>Value</th><th>Pages</th></tr></thead>' +
                  '<tbody>' +
                    (duplicateTitles.length || duplicateDescriptions.length
                      ? duplicateTitles.map(function (group) {
                          return '<tr>' +
                            '<td>Title</td>' +
                            '<td class="text-slate-700">' + esc(group.value) + '</td>' +
                            '<td class="text-xs text-slate-500">' + esc(group.urls.join(', ')) + '</td>' +
                          '</tr>';
                        }).join('') +
                        duplicateDescriptions.map(function (group) {
                          return '<tr>' +
                            '<td>Description</td>' +
                            '<td class="text-slate-700">' + esc(group.value) + '</td>' +
                            '<td class="text-xs text-slate-500">' + esc(group.urls.join(', ')) + '</td>' +
                          '</tr>';
                        }).join('')
                      : '<tr><td colspan="3" class="text-slate-500">No duplicate title or description groups were found in the available page audits.</td></tr>') +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>'
        : '<div class="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-500">Only summary counts were provided for metadata. Page-level duplicate and missing-tag tables require technicalSeo.pageAudits[] data.</div>');
  }

  function renderCrawlIssues(data) {
    var container = $('section-crawl-content');
    if (!container) return;

    var technicalSeo = data && data.technicalSeo ? data.technicalSeo : {};
    var crawlIssues = asArray(technicalSeo.crawlIssues);

    if (!crawlIssues.length) {
      container.innerHTML = emptyState(
        'No crawl issues provided',
        'technicalSeo.crawlIssues[] is missing, so this section cannot show status-code or redirect findings.'
      );
      return;
    }

    var sortedIssues = crawlIssues.slice().sort(function (a, b) {
      var aCode = toNumber(a && a.statusCode) || 0;
      var bCode = toNumber(b && b.statusCode) || 0;

      function priority(code) {
        if (code >= 500) return 1;
        if (code >= 400) return 2;
        if (code >= 300) return 3;
        return 4;
      }

      if (priority(aCode) !== priority(bCode)) return priority(aCode) - priority(bCode);
      return bCode - aCode;
    });

    var brokenCount = sortedIssues.filter(function (issue) {
      return (toNumber(issue && issue.statusCode) || 0) >= 400;
    }).length;
    var redirectCount = sortedIssues.filter(function (issue) {
      var code = toNumber(issue && issue.statusCode) || 0;
      return code >= 300 && code < 400;
    }).length;

    container.innerHTML =
      '<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">' +
        statCard(String(sortedIssues.length), 'Total crawl issues', brokenCount ? 'red' : 'green') +
        statCard(String(brokenCount), '4xx / 5xx issues', brokenCount ? 'red' : 'green') +
        statCard(String(redirectCount), '3xx redirect issues', redirectCount ? 'orange' : 'green') +
        statCard(String(uniqueCount(sortedIssues.map(function (issue) { return issue && issue.statusCode; }))), 'Unique status codes', 'orange') +
      '</div>' +
      '<div data-filterable data-filters=\'[{"col":1,"label":"Status","type":"badge"}]\'>' +
      '<div class="report-table-wrap">' +
        '<table class="report-table">' +
          '<thead><tr><th>URL</th><th>Status</th><th>Issue</th></tr></thead>' +
          '<tbody>' +
            sortedIssues.map(function (issue) {
              return '<tr>' +
                '<td><div class="font-medium text-slate-700 break-all">' + esc(issue && issue.url ? issue.url : 'Untitled URL') + '</div></td>' +
                '<td>' + statusBadge(issue && issue.statusCode) + '</td>' +
                '<td class="text-slate-600">' + esc(issue && issue.issue ? issue.issue : 'No issue description provided') + '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '</div>';
  }

  function renderSiteStructure(data) {
    var container = $('section-sitestructure-content');
    if (!container) return;

    var technicalSeo = data && data.technicalSeo ? data.technicalSeo : {};
    var pageAudits = asArray(technicalSeo.pageAudits);

    if (!pageAudits.length) {
      container.innerHTML = emptyState(
        'No page audit inventory',
        'technicalSeo.pageAudits[] is missing, so page-level structure metrics cannot be summarized.'
      );
      return;
    }

    var sortedAudits = pageAudits.slice().sort(function (a, b) {
      var issueDiff = asArray(b && b.issues).length - asArray(a && a.issues).length;
      if (issueDiff) return issueDiff;
      return (toNumber(a && a.wordCount) || 0) - (toNumber(b && b.wordCount) || 0);
    });

    var avgWordCount = average(sortedAudits.map(function (audit) { return toNumber(audit && audit.wordCount); }));
    var avgInternalLinks = average(sortedAudits.map(function (audit) { return toNumber(audit && audit.internalLinks); }));
    var avgExternalLinks = average(sortedAudits.map(function (audit) { return toNumber(audit && audit.externalLinks); }));
    var pagesWithIssues = sortedAudits.filter(function (audit) {
      return asArray(audit && audit.issues).length > 0;
    }).length;
    var pagesWithSchema = sortedAudits.filter(function (audit) {
      return !!(audit && audit.hasSchema) || asArray(audit && audit.schemaTypes).length > 0;
    }).length;

    container.innerHTML =
      '<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-8">' +
        statCard(String(sortedAudits.length), 'Pages analyzed', 'green') +
        statCard(avgWordCount != null ? formatNumber(Math.round(avgWordCount)) : 'N/A', 'Average word count', avgWordCount != null && avgWordCount >= 500 ? 'green' : 'orange') +
        statCard(avgInternalLinks != null ? formatNumber(Math.round(avgInternalLinks)) : 'N/A', 'Average internal links', avgInternalLinks != null && avgInternalLinks >= 5 ? 'green' : 'orange') +
        statCard(avgExternalLinks != null ? formatNumber(Math.round(avgExternalLinks)) : 'N/A', 'Average external links', 'orange') +
        statCard(String(pagesWithIssues), 'Pages with issues', pagesWithIssues ? 'red' : 'green', pagesWithSchema + ' pages show schema coverage') +
      '</div>' +
      '<div data-filterable data-filters=\'[{"col":4,"label":"Schema","type":"badge"},{"col":5,"label":"Issues","options":["None","Has issues"]}]\'>' +
      '<div class="report-table-wrap">' +
        '<table class="report-table">' +
          '<thead><tr><th>Page</th><th>Words</th><th>H1 / H2</th><th>Links</th><th>Schema</th><th>Issues</th></tr></thead>' +
          '<tbody>' +
            sortedAudits.map(function (audit) {
              var issues = asArray(audit && audit.issues);
              var types = asArray(audit && audit.schemaTypes).filter(Boolean);
              return '<tr>' +
                '<td>' +
                  '<div class="font-medium text-slate-700">' + esc(audit && audit.title ? audit.title : audit && audit.url ? audit.url : 'Untitled page') + '</div>' +
                  (audit && audit.url ? '<div class="text-xs text-slate-500 break-all mt-1">' + esc(audit.url) + '</div>' : '') +
                '</td>' +
                '<td>' + esc(audit && audit.wordCount != null ? formatNumber(audit.wordCount) : 'N/A') + '</td>' +
                '<td>' + esc(asArray(audit && audit.h1Tags).length + ' / ' + asArray(audit && audit.h2Tags).length) + '</td>' +
                '<td>' +
                  '<div class="text-slate-700">' + esc((audit && audit.internalLinks != null ? audit.internalLinks : '0') + ' internal') + '</div>' +
                  '<div class="text-xs text-slate-500 mt-1">' + esc((audit && audit.externalLinks != null ? audit.externalLinks : '0') + ' external') + '</div>' +
                '</td>' +
                '<td>' +
                  (types.length || (audit && audit.hasSchema)
                    ? coverageBadge(true, 'Present', 'Missing') + (types.length ? '<div class="text-xs text-slate-500 mt-1">' + esc(types.join(', ')) + '</div>' : '')
                    : coverageBadge(false, 'Present', 'Missing')) +
                '</td>' +
                '<td>' +
                  (issues.length
                    ? '<div class="font-semibold text-slate-700">' + esc(String(issues.length)) + ' issues</div><div class="text-xs text-slate-500 mt-1">' + esc(issues.slice(0, 2).join('; ')) + '</div>'
                    : '<span class="text-slate-400 text-sm">None</span>') +
                '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '</div>';
  }

  window.TPPC.pages.technical = {
    init: function (data) {
      this.renderCoreWebVitals(data);
      this.renderPageSpeed(data);
      this.renderSchemaAudit(data);
      this.renderMetaTagAudit(data);
      this.renderCrawlIssues(data);
      this.renderSiteStructure(data);
      if (window.TPPC.filters) window.TPPC.filters.init();
    },

    renderCoreWebVitals: renderCoreWebVitals,
    renderPageSpeed: renderPageSpeed,
    renderSchemaAudit: renderSchemaAudit,
    renderMetaTagAudit: renderMetaTagAudit,
    renderCrawlIssues: renderCrawlIssues,
    renderSiteStructure: renderSiteStructure
  };

  function bootWhenReady(attempt) {
    if (window.TPPC && typeof window.TPPC.boot === 'function') {
      window.TPPC.boot();
      return;
    }

    if (attempt > 100) return;

    window.setTimeout(function () {
      bootWhenReady(attempt + 1);
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bootWhenReady(0);
    });
  } else {
    bootWhenReady(0);
  }
})();
