/**
 * pages/quality-score.js — Quality Score page renderer
 * Namespace: window.TPPC.pages['quality-score']
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'quality-score';

  var utils = window.TPPC.utils || {};
  var esc = utils.esc || function (value) {
    if (value == null) return '';
    var div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  };
  var severityClass = utils.severityClass || function () { return 'info'; };
  var formatNumber = utils.formatNumber || function (value) {
    if (value == null || value === '' || isNaN(Number(value))) return '';
    return Number(value).toLocaleString();
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function _asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function _setHTML(selector, html) {
    var el = $(selector);
    if (el) el.innerHTML = html;
  }

  function _text(value) {
    return esc(value == null ? '' : value);
  }

  function _toNumber(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return isNaN(value) ? null : value;
    var normalized = String(value).replace(/[^0-9.\-]/g, '');
    if (!normalized) return null;
    var parsed = Number(normalized);
    return isNaN(parsed) ? null : parsed;
  }

  function _money(value) {
    var num = _toNumber(value);
    if (num == null) return 'N/A';
    return '$' + Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function _emptyState(title, detail) {
    return '' +
      '<div class="empty-state">' +
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 16.5h.008v.008H12V16.5Z" />' +
        '</svg>' +
        '<div class="text-base font-semibold text-slate-700">' + _text(title) + '</div>' +
        '<p class="mt-2 max-w-xl text-sm text-slate-500">' + _text(detail) + '</p>' +
      '</div>';
  }

  function _tableEmpty(colspan, title, detail) {
    return '<tr><td colspan="' + colspan + '" class="p-0">' + _emptyState(title, detail) + '</td></tr>';
  }

  function _getAudit(data) {
    return data && data.ppcAudit && typeof data.ppcAudit === 'object' ? data.ppcAudit : (data || {});
  }

  function _getClient(data) {
    return data && data.client && typeof data.client === 'object' ? data.client : {};
  }

  function _getKeywordRows(data) {
    var direct = _asArray(data && data.keywords);
    var qualityRows = _asArray(data && data.qualityScore);
    return direct.length ? direct : qualityRows;
  }

  function _statusBadge(status) {
    var normalized = String(status || '').toLowerCase();
    var cls = normalized === 'fail' ? 'critical' : normalized === 'warn' ? 'medium' : normalized === 'pass' ? 'low' : 'info';
    return '<span class="severity-badge ' + cls + '">' + _text(normalized ? normalized.toUpperCase() : 'INFO') + '</span>';
  }

  function _renderHeader(data) {
    var client = _getClient(data);
    var titleBase = client.name || client.company || client.website || 'PPC Audit';

    _setHTML('#hero-client', _text(client.name || client.company || 'PPC Audit'));
    _setHTML('#hero-website', _text(client.website || client.websiteUrl || ''));
    _setHTML('#hero-date', _text(client.auditDate || ''));
    _setHTML('#footer-date', _text(client.auditDate || ''));
    document.title = 'Quality Score - ' + String(titleBase);
  }

  function _qsTone(score) {
    var num = _toNumber(score);
    if (num == null) return 'bg-slate-200';
    if (num >= 7) return 'bg-emerald-500';
    if (num >= 5) return 'bg-amber-500';
    return 'bg-red-500';
  }

  function _renderAccountQS(audit) {
    var quality = audit && audit.qualityScore ? audit.qualityScore : {};
    var summary = quality.summary || {};
    var score = _toNumber(summary.accountQS) || 0;
    var pct = Math.max(0, Math.min(100, Math.round((score / 10) * 100)));

    _setHTML('#account-qs-panel',
      '<div class="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 no-break">' +
        '<div class="grid gap-8 xl:grid-cols-[320px,1fr] xl:items-center">' +
          '<div class="mx-auto flex h-56 w-56 items-center justify-center rounded-full" style="background:conic-gradient(#3b82f6 0 ' + _text(pct) + '%, #e2e8f0 ' + _text(pct) + '% 100%);">' +
            '<div class="flex h-44 w-44 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">' +
              '<div class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Account QS</div>' +
              '<div class="mt-2 text-5xl font-extrabold text-slate-900">' + _text(score.toFixed(1)) + '</div>' +
              '<div class="mt-3 rounded-full px-4 py-1 text-sm font-semibold text-white ' + _qsTone(score) + '">' + _text(score >= 7 ? 'Healthy' : score >= 5 ? 'Watchlist' : 'At Risk') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="grid gap-4 md:grid-cols-3">' +
            '<div class="stat-card no-break"><div class="stat-value">' + _text(summary.totalWithQS != null ? formatNumber(summary.totalWithQS) : '0') + '</div><div class="stat-label">Keywords With QS</div></div>' +
            '<div class="stat-card no-break"><div class="stat-value">' + _text(summary.lowQSKeywords != null ? formatNumber(summary.lowQSKeywords) : '0') + '</div><div class="stat-label">Keywords With QS 3 or Lower</div></div>' +
            '<div class="stat-card no-break"><div class="stat-value">' + _text(summary.lowQSPct != null ? Number(summary.lowQSPct).toFixed(1) + '%' : '0.0%') + '</div><div class="stat-label">Share of Low-QS Keywords</div></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function _renderDistribution(audit) {
    var quality = audit && audit.qualityScore ? audit.qualityScore : {};
    var distribution = quality.distribution || {};
    var labels = Object.keys(distribution);
    var totals = 0;

    labels.forEach(function (label) {
      totals += _toNumber(distribution[label]) || 0;
    });

    if (!labels.length || !totals) {
      var canvas = $('#qs-distribution-chart');
      if (canvas && canvas.parentNode) {
        canvas.parentNode.innerHTML = _emptyState('No QS distribution available', 'The analyzer did not return a keyword Quality Score distribution for this report.');
      }
      _setHTML('#qs-distribution-summary', _emptyState('No distribution summary', 'Provide quality score output with a distribution map to populate this section.'));
      return;
    }

    if (window.TPPC.charts && typeof window.TPPC.charts.createBarChart === 'function') {
      window.TPPC.charts.createBarChart('qs-distribution-chart', {
        labels: labels,
        datasets: [{
          label: 'Keywords',
          data: labels.map(function (label) { return _toNumber(distribution[label]) || 0; }),
          backgroundColor: labels.map(function (label) {
            var score = _toNumber(label) || 0;
            if (score >= 7) return '#22c55e';
            if (score >= 5) return '#f59e0b';
            return '#ef4444';
          })
        }],
        options: {
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    _setHTML('#qs-distribution-summary', labels.map(function (label) {
      var count = _toNumber(distribution[label]) || 0;
      var pct = totals ? ((count / totals) * 100).toFixed(1) + '%' : '0.0%';
      var sev = (_toNumber(label) || 0) >= 7 ? 'green' : (_toNumber(label) || 0) >= 5 ? 'yellow' : 'red';
      return '' +
        '<div class="stat-card severity-' + _text(sev) + ' no-break">' +
          '<div class="stat-value">' + _text(count) + '</div>' +
          '<div class="stat-label">QS ' + _text(label) + ' Keywords</div>' +
          '<div class="mt-2 text-xs text-slate-400">' + _text(pct) + ' of QS-scored keywords</div>' +
        '</div>';
    }).join(''));
  }

  function _renderComponents(audit) {
    var quality = audit && audit.qualityScore ? audit.qualityScore : {};
    var checks = _asArray(quality.checks);
    var subComponents = checks.filter(function (check) {
      return /QS-0[3-5]/.test(String(check && check.id || ''));
    });
    var allChecksHtml;

    if (!checks.length) {
      _setHTML('#component-checks', _emptyState('No quality-score checks available', 'The PPC analyzer did not emit any Quality Score checks for this data set.'));
      return;
    }

    allChecksHtml = '' +
      '<div class="bg-white border border-slate-200 rounded-2xl overflow-hidden no-break">' +
        '<div class="px-5 py-4 border-b border-slate-200 bg-slate-50">' +
          '<div class="font-semibold text-slate-800">Full Quality Score Check List</div>' +
          '<div class="mt-1 text-sm text-slate-500">Every QS-related check returned by the analyzer.</div>' +
        '</div>' +
        '<div class="divide-y divide-slate-100">' +
          checks.map(function (check) {
            return '' +
              '<div class="px-5 py-4">' +
                '<div class="flex flex-wrap items-center gap-2 mb-2">' +
                  '<div class="font-medium text-slate-800">' + _text(check.name || check.id || 'Check') + '</div>' +
                  _statusBadge(check.status) +
                  '<span class="severity-badge ' + severityClass(check.severity) + '">' + _text(check.severity || 'info') + '</span>' +
                '</div>' +
                '<div class="text-sm text-slate-500">' + _text(check.detail || '') + '</div>' +
              '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    _setHTML('#component-checks',
      (subComponents.length
        ? '<div class="grid gap-4">' + subComponents.map(function (check) {
            return '' +
              '<div class="issue-card no-break animate-in">' +
                '<div class="issue-number">' + _text(check.id || 'QS') + '</div>' +
                '<div class="flex-1">' +
                  '<div class="flex flex-wrap items-center gap-2 mb-2">' +
                    '<div class="font-semibold text-slate-800">' + _text(check.name || 'Sub-component') + '</div>' +
                    _statusBadge(check.status) +
                  '</div>' +
                  '<p class="text-sm text-slate-500">' + _text(check.detail || '') + '</p>' +
                '</div>' +
              '</div>';
          }).join('') + '</div>'
        : _emptyState('No QS sub-component checks', 'Expected CTR, ad relevance, and landing page experience checks were not present in the analyzer output.')) +
      allChecksHtml
    );
  }

  function _renderTopSpenders(data, audit) {
    var rows = _getKeywordRows(data).map(function (row) {
      return {
        keyword: row.keyword || row.keyword_text || row.keywordText || row.searchKeyword || '',
        qualityScore: row.quality_score != null ? row.quality_score : row.qualityScore,
        cost: row.cost,
        clicks: row.clicks,
        conversions: row.conversions
      };
    }).filter(function (row) {
      return row.keyword && _toNumber(row.cost) != null;
    }).sort(function (a, b) {
      return (_toNumber(b.cost) || 0) - (_toNumber(a.cost) || 0);
    }).slice(0, 20);
    var quality = audit && audit.qualityScore ? audit.qualityScore : {};
    var topSpendersCheck = _asArray(quality.checks).filter(function (check) {
      return check && check.id === 'QS-06';
    })[0];

    if (!rows.length) {
      if (topSpendersCheck) {
        _setHTML('#top-spenders-table-body',
          '<tr class="no-break">' +
            '<td class="font-medium text-slate-700">Top-spender QS check</td>' +
            '<td>N/A</td>' +
            '<td>N/A</td>' +
            '<td>N/A</td>' +
            '<td>' + _text(topSpendersCheck.detail || '') + '</td>' +
          '</tr>'
        );
        return;
      }

      _setHTML('#top-spenders-table-body', _tableEmpty(5, 'No keyword-level spend data available', 'Add raw keyword data to show the highest-spend keywords and their Quality Scores.'));
      return;
    }

    _setHTML('#top-spenders-table-body', rows.map(function (row) {
      var qs = _toNumber(row.qualityScore);
      var tone = qs >= 7 ? 'low' : qs >= 5 ? 'medium' : 'critical';
      return '' +
        '<tr class="no-break">' +
          '<td class="font-medium text-slate-700">' + _text(row.keyword) + '</td>' +
          '<td><span class="severity-badge ' + tone + '">' + _text(qs != null ? qs : 'N/A') + '</span></td>' +
          '<td>' + _money(row.cost) + '</td>' +
          '<td>' + _text(row.clicks != null ? formatNumber(row.clicks) : 'N/A') + '</td>' +
          '<td>' + _text(row.conversions != null ? formatNumber(row.conversions) : 'N/A') + '</td>' +
        '</tr>';
    }).join(''));
  }

  window.TPPC.pages['quality-score'] = {
    init: function (data) {
      var audit = _getAudit(data);
      window.TPPC.currentPage = 'quality-score';
      _renderHeader(data);
      _renderAccountQS(audit);
      _renderDistribution(audit);
      _renderComponents(audit);
      _renderTopSpenders(data, audit);
    }
  };

  function _bootWhenReady() {
    if (window.TPPC && typeof window.TPPC.boot === 'function') {
      window.TPPC.boot();
      return;
    }

    window.setTimeout(_bootWhenReady, 25);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bootWhenReady);
  } else {
    _bootWhenReady();
  }
})();
