(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'competitors';

  var radarChart = null;
  var pageSpeedChart = null;

  function esc(value) {
    if (window.TPPC.utils && typeof window.TPPC.utils.esc === 'function') {
      return window.TPPC.utils.esc(value);
    }
    if (value == null) return '';
    return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatNumber(value) {
    return window.TPPC.utils && typeof window.TPPC.utils.formatNumber === 'function'
      ? window.TPPC.utils.formatNumber(value)
      : String(value == null ? '' : value);
  }

  function formatCurrency(value) {
    var num = Number(value);
    if (isNaN(num)) return value == null ? '' : String(value);
    return num.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function emptyState(message) {
    return '' +
      '<div class="empty-state no-break">' +
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3.082c.602-1.036 2.262-1.036 2.864 0l6.183 10.64c.608 1.045-.139 2.348-1.432 2.348H4.817c-1.293 0-2.04-1.303-1.432-2.348L9.568 3.082Z" />' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v3.75m0 3.75h.008v.008H12v-.008Z" />' +
        '</svg>' +
        '<p>' + esc(message) + '</p>' +
      '</div>';
  }

  function getClientLabel(data) {
    return (data.client && (data.client.website || data.client.company || data.client.name)) || 'Client';
  }

  function getCompetitorLabel(data, index) {
    var competitor = data.competitor || {};
    var all = Array.isArray(competitor.all) ? competitor.all : [];
    var entry = all[index] || null;
    if (entry) {
      if (entry.domain) return entry.domain;
      if (entry.name) return entry.name;
    }
    if (index === 0 && competitor.primaryLabel) return competitor.primaryLabel;
    if (index === 0 && competitor.primary) return competitor.primary;
    return 'Comp ' + (index + 1);
  }

  function getCompetitorColumnKeys(rows) {
    if (!rows.length) return [];
    return Object.keys(rows[0]).filter(function (key) {
      return /^comp\d+$/.test(key) && rows[0][key] !== undefined;
    }).sort(function (a, b) {
      return parseInt(a.slice(4), 10) - parseInt(b.slice(4), 10);
    });
  }

  function average(numbers) {
    if (!numbers.length) return null;
    var sum = 0;
    for (var i = 0; i < numbers.length; i++) sum += numbers[i];
    return sum / numbers.length;
  }

  function parseNumericValue(value) {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (value == null) return null;

    var str = String(value).trim();
    if (!str) return null;

    var rangeFraction = str.match(/(-?\d[\d,]*(?:\.\d+)?)\s*(?:-|to)\s*(-?\d[\d,]*(?:\.\d+)?)\s*\/\s*(-?\d[\d,]*(?:\.\d+)?)/i);
    if (rangeFraction) {
      var low = parseFloat(rangeFraction[1].replace(/,/g, ''));
      var high = parseFloat(rangeFraction[2].replace(/,/g, ''));
      var denominator = parseFloat(rangeFraction[3].replace(/,/g, ''));
      if (!isNaN(low) && !isNaN(high) && denominator) return ((low + high) / 2 / denominator) * 100;
    }

    var fraction = str.match(/(-?\d[\d,]*(?:\.\d+)?)\s*\/\s*(-?\d[\d,]*(?:\.\d+)?)/);
    if (fraction) {
      var numerator = parseFloat(fraction[1].replace(/,/g, ''));
      var div = parseFloat(fraction[2].replace(/,/g, ''));
      if (!isNaN(numerator) && div) return (numerator / div) * 100;
    }

    var matches = str.match(/-?\d[\d,]*(?:\.\d+)?/g);
    if (!matches || !matches.length) return null;

    var numbers = matches.map(function (match) {
      return parseFloat(match.replace(/,/g, ''));
    }).filter(function (num) {
      return !isNaN(num);
    });

    return average(numbers);
  }

  function normalizeToPercent(metrics) {
    return metrics.map(function (metric) {
      var max = Math.max(metric.clientValue, metric.competitorValue, 1);
      return {
        label: metric.label,
        client: Math.round((metric.clientValue / max) * 100),
        competitor: Math.round((metric.competitorValue / max) * 100)
      };
    });
  }

  function destroyChart(chart) {
    if (chart && typeof chart.destroy === 'function') chart.destroy();
  }

  function renderComparisonTable(data) {
    var container = document.getElementById('comparison-content');
    var rows = Array.isArray(data.competitorComparison) ? data.competitorComparison : [];

    if (!container) return;
    if (!rows.length) {
      container.innerHTML = emptyState('No competitor comparison rows were included for this audit.');
      return;
    }

    var competitorKeys = getCompetitorColumnKeys(rows);
    var headers = ['Metric', getClientLabel(data)];
    competitorKeys.forEach(function (key) {
      var index = parseInt(key.slice(4), 10) - 1;
      headers.push(getCompetitorLabel(data, index));
    });
    headers.push('Gap');

    container.innerHTML =
      '<div class="report-table-wrap no-break">' +
        '<table class="report-table">' +
          '<thead><tr>' + headers.map(function (header, index) {
            return '<th' + (index === 1 ? ' class="highlight-col"' : '') + '>' + esc(header) + '</th>';
          }).join('') + '</tr></thead>' +
          '<tbody>' + rows.map(function (row) {
            var cells = [
              '<td class="font-medium text-slate-700">' + esc(row.metric) + '</td>',
              '<td class="highlight-col">' + esc(row.client) + '</td>'
            ];

            competitorKeys.forEach(function (key) {
              cells.push('<td>' + esc(row[key]) + '</td>');
            });

            cells.push('<td><span class="text-sm text-slate-500 italic">' + esc(row.gap) + '</span></td>');
            return '<tr class="no-break">' + cells.join('') + '</tr>';
          }).join('') + '</tbody>' +
        '</table>' +
      '</div>';
  }

  function renderRadarChart(data) {
    var container = document.getElementById('radar-content');
    var rows = Array.isArray(data.siteComparison) ? data.siteComparison : [];
    var metrics = [];
    var charts = window.TPPC.charts || {};
    var colors = charts.COLORS || {};

    if (!container) return;

    rows.forEach(function (row) {
      var clientValue = parseNumericValue(row.client);
      var competitorValue = parseNumericValue(row.competitor);
      if (clientValue == null || competitorValue == null) return;

      metrics.push({
        label: row.metric,
        clientValue: clientValue,
        competitorValue: competitorValue
      });
    });

    if (metrics.length < 3 || typeof charts.createRadarChart !== 'function') {
      destroyChart(radarChart);
      radarChart = null;
      container.innerHTML = emptyState('Need at least three comparable numeric site metrics to render the radar chart.');
      return;
    }

    var normalized = normalizeToPercent(metrics);
    container.innerHTML =
      '<div class="chart-container no-break">' +
        '<h3 class="text-base font-bold text-slate-700 mb-4">Normalized Site Health Comparison</h3>' +
        '<canvas id="competitor-radar-chart"></canvas>' +
      '</div>';

    destroyChart(radarChart);
    radarChart = charts.createRadarChart('competitor-radar-chart', {
      labels: normalized.map(function (metric) { return metric.label; }),
      max: 100,
      datasets: [
        {
          label: getClientLabel(data),
          data: normalized.map(function (metric) { return metric.client; }),
          backgroundColor: 'rgba(59,130,246,0.15)',
          borderColor: colors.primary || '#3b82f6',
          pointBackgroundColor: colors.primary || '#3b82f6',
          pointHoverBackgroundColor: colors.primary || '#3b82f6',
          borderWidth: 2
        },
        {
          label: (data.competitor && (data.competitor.primaryLabel || data.competitor.primary)) || getCompetitorLabel(data, 0),
          data: normalized.map(function (metric) { return metric.competitor; }),
          backgroundColor: 'rgba(239,68,68,0.10)',
          borderColor: colors.danger || '#ef4444',
          pointBackgroundColor: colors.danger || '#ef4444',
          pointHoverBackgroundColor: colors.danger || '#ef4444',
          borderWidth: 2
        }
      ]
    });
  }

  function renderStrategies(data) {
    var container = document.getElementById('strategies-content');
    var strategies = Array.isArray(data.competitorStrategies) ? data.competitorStrategies : [];

    if (!container) return;
    if (!strategies.length) {
      container.innerHTML = emptyState('No competitor strategy notes were captured for this audit.');
      return;
    }

    container.innerHTML = strategies.map(function (strategy) {
      return '' +
        '<div class="bg-white border border-slate-200 rounded-xl p-4 no-break animate-in">' +
          '<div class="font-bold text-slate-800 mb-1 flex items-center gap-2">' +
            '<svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>' +
            '</svg>' +
            esc(strategy.strategy) +
          '</div>' +
          '<p class="text-sm text-slate-500">' + esc(strategy.detail) + '</p>' +
        '</div>';
    }).join('');
  }

  function renderDomainMetrics(data) {
    var container = document.getElementById('domains-content');
    var domainMetrics = data.domainMetrics || {};
    var client = domainMetrics.client || null;
    var competitors = Array.isArray(domainMetrics.competitors) ? domainMetrics.competitors : [];
    var columns = [];
    var metricDefs = [
      { key: 'domainRating', label: 'Domain Rating' },
      { key: 'organicTraffic', label: 'Organic Traffic' },
      { key: 'organicKeywords', label: 'Organic Keywords' },
      { key: 'referringDomains', label: 'Referring Domains' },
      { key: 'backlinks', label: 'Backlinks' },
      { key: 'trafficValue', label: 'Traffic Value', format: 'currency' }
    ];

    if (!container) return;
    if (!client || !competitors.length) {
      container.innerHTML = emptyState('Domain-level competitor metrics were not provided for this audit yet.');
      return;
    }

    columns.push({
      label: client.domain || getClientLabel(data),
      values: client,
      highlight: true
    });

    competitors.forEach(function (competitor) {
      columns.push({
        label: competitor.domain || 'Competitor',
        values: competitor,
        highlight: false
      });
    });

    container.innerHTML =
      '<div class="report-table-wrap no-break">' +
        '<table class="report-table">' +
          '<thead><tr>' +
            '<th>Metric</th>' +
            columns.map(function (column) {
              return '<th' + (column.highlight ? ' class="highlight-col"' : '') + '>' + esc(column.label) + '</th>';
            }).join('') +
          '</tr></thead>' +
          '<tbody>' +
            metricDefs.map(function (metric) {
              return '<tr class="no-break">' +
                '<td class="font-medium text-slate-700">' + esc(metric.label) + '</td>' +
                columns.map(function (column) {
                  var rawValue = column.values[metric.key];
                  var displayValue = rawValue == null
                    ? '&mdash;'
                    : metric.format === 'currency'
                      ? esc(formatCurrency(rawValue))
                      : esc(formatNumber(rawValue));
                  return '<td' + (column.highlight ? ' class="highlight-col"' : '') + '>' + displayValue + '</td>';
                }).join('') +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
  }

  function scoreColor(score) {
    if (score >= 90) return 'rgba(34,197,94,0.75)';
    if (score >= 50) return 'rgba(249,115,22,0.75)';
    return 'rgba(239,68,68,0.75)';
  }

  function renderPageSpeedComparison(data) {
    var container = document.getElementById('pagespeedcomp-content');
    var charts = window.TPPC.charts || {};
    var rows = Array.isArray(data.pageSpeedComparison) ? data.pageSpeedComparison : [];
    var entries = rows.map(function (row) {
      return {
        name: row && row.name,
        score: Number(row && row.score)
      };
    }).filter(function (row) {
      return row.name && !isNaN(row.score);
    });

    if (!container) return;
    if (!entries.length || typeof charts.createBarChart !== 'function') {
      destroyChart(pageSpeedChart);
      pageSpeedChart = null;
      container.innerHTML = emptyState('PageSpeed comparison data was not included for this audit.');
      return;
    }

    container.innerHTML =
      '<div class="chart-container no-break">' +
        '<h3 class="text-base font-bold text-slate-700 mb-4">PageSpeed Scores by Domain</h3>' +
        '<canvas id="pagespeed-comparison-chart"></canvas>' +
      '</div>';

    destroyChart(pageSpeedChart);
    pageSpeedChart = charts.createBarChart('pagespeed-comparison-chart', {
      horizontal: true,
      labels: entries.map(function (entry) { return entry.name; }),
      datasets: [{
        label: 'PageSpeed Score',
        data: entries.map(function (entry) { return entry.score; }),
        backgroundColor: entries.map(function (entry) { return scoreColor(entry.score); }),
        borderRadius: 8,
        borderSkipped: false
      }],
      options: {
        maintainAspectRatio: true,
        scales: {
          x: {
            min: 0,
            max: 100,
            grid: { color: '#f1f5f9' }
          },
          y: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  window.TPPC.pages.competitors = {
    init: function (data) {
      renderComparisonTable(data);
      renderRadarChart(data);
      renderStrategies(data);
      renderDomainMetrics(data);
      renderPageSpeedComparison(data);
    }
  };

  function _bootWhenReady(attempt) {
    if (window.TPPC && typeof window.TPPC.boot === 'function') {
      window.TPPC.boot();
      return;
    }
    if ((attempt || 0) < 80) {
      window.setTimeout(function () { _bootWhenReady((attempt || 0) + 1); }, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bootWhenReady);
  } else {
    _bootWhenReady();
  }
})();
