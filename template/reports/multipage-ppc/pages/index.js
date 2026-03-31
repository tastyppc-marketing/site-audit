/**
 * pages/index.js — PPC dashboard page renderer
 * Namespace: window.TPPC.pages.index
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'index';

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
    return '$' + formatNumber(num.toFixed(2));
  }

  function _compactMoney(value) {
    var num = _toNumber(value);
    if (num == null) return 'N/A';
    return '$' + Number(num).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function _percent(value, decimals) {
    var num = _toNumber(value);
    if (num == null) return 'N/A';
    return Number(num).toFixed(decimals == null ? 1 : decimals) + '%';
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

  function _statusWeight(status) {
    var normalized = String(status || '').toLowerCase();
    if (normalized === 'fail') return 0;
    if (normalized === 'warn') return 1;
    if (normalized === 'pass') return 2;
    return 3;
  }

  function _severityWeight(severity) {
    var normalized = String(severity || '').toLowerCase();
    if (normalized === 'critical') return 0;
    if (normalized === 'high') return 1;
    if (normalized === 'medium') return 2;
    if (normalized === 'low') return 3;
    return 4;
  }

  function _statusBadge(status) {
    var normalized = String(status || '').toLowerCase();
    var label = normalized ? normalized.toUpperCase() : 'INFO';
    var cls = normalized === 'fail'
      ? 'critical'
      : normalized === 'warn'
      ? 'medium'
      : normalized === 'pass'
      ? 'low'
      : 'info';
    return '<span class="severity-badge ' + cls + '">' + _text(label) + '</span>';
  }

  function _getAudit(data) {
    return data && data.ppcAudit && typeof data.ppcAudit === 'object' ? data.ppcAudit : (data || {});
  }

  function _getClient(data) {
    return data && data.client && typeof data.client === 'object' ? data.client : {};
  }

  function _findMetricValue(data, matcher) {
    var campaignHealth = _asArray(data && data.campaignHealth);
    var i;

    for (i = 0; i < campaignHealth.length; i += 1) {
      if (matcher(String(campaignHealth[i].metric || '').toLowerCase())) {
        return campaignHealth[i].value;
      }
    }

    return null;
  }

  function _sumValues(rows, keys) {
    var total = 0;
    var found = false;

    _asArray(rows).forEach(function (row) {
      var i;
      for (i = 0; i < keys.length; i += 1) {
        var value = row && row[keys[i]];
        var num = _toNumber(value);
        if (num != null) {
          total += num;
          found = true;
          break;
        }
      }
    });

    return found ? total : null;
  }

  function _deriveMetrics(data, audit) {
    var summary = audit && audit.wastedSpend ? (audit.wastedSpend.summary || {}) : {};
    var keywords = _asArray(data && data.keywords);
    var searchTerms = _asArray(data && data.searchTerms);
    var totalCost = _toNumber(summary.totalCost);
    var conversions = _toNumber(summary.totalConversions);
    var costSource = 'Audit summary';
    var cpa = null;
    var cpaSource = '';
    var roas = _toNumber(summary.roas);
    var roasSource = roas != null ? 'Audit summary' : '';
    var conversionValue = null;

    if (totalCost == null) {
      totalCost = _sumValues(keywords, ['cost']) || _sumValues(searchTerms, ['cost']);
      if (totalCost != null) costSource = 'Raw keyword/search-term data';
    }
    if (totalCost == null) {
      totalCost = _toNumber(_findMetricValue(data, function (metric) {
        return metric.indexOf('total spend') !== -1 || metric.indexOf('cost') !== -1;
      }));
      if (totalCost != null) costSource = 'Legacy PPC metrics';
    }

    if (conversions == null) {
      conversions = _sumValues(keywords, ['conversions']) || _sumValues(searchTerms, ['conversions']);
    }
    if (conversions == null) {
      conversions = _toNumber(_findMetricValue(data, function (metric) {
        return metric.indexOf('conversion') !== -1 && metric.indexOf('cost') === -1;
      }));
    }

    if (totalCost != null && conversions != null && conversions > 0) {
      cpa = totalCost / conversions;
      cpaSource = 'Derived from total cost / conversions';
    } else if (_toNumber(summary.targetCpa) != null) {
      cpa = _toNumber(summary.targetCpa);
      cpaSource = 'Target CPA';
    }

    if (roas == null) {
      conversionValue = _sumValues(keywords, ['conversion_value', 'conversions_value', 'conversionValue']);
      if (conversionValue != null && totalCost != null && totalCost > 0) {
        roas = conversionValue / totalCost;
        roasSource = 'Derived from conversion value / cost';
      }
    }
    if (roas == null) {
      roas = _toNumber(_findMetricValue(data, function (metric) {
        return metric.indexOf('roas') !== -1;
      }));
      if (roas != null) roasSource = 'Legacy PPC metrics';
    }

    return {
      totalCost: totalCost,
      totalCostSource: costSource,
      conversions: conversions,
      cpa: cpa,
      cpaSource: cpaSource,
      roas: roas,
      roasSource: roasSource
    };
  }

  function _allChecks(audit) {
    var checks = [];
    ['structure', 'qualityScore', 'wastedSpend', 'budgetBidding'].forEach(function (key) {
      checks = checks.concat(_asArray(audit && audit[key] && audit[key].checks));
    });
    return checks;
  }

  function _recommendationCard(item, index) {
    var priority = item && item.priority != null
      ? '<span class="severity-badge info">Priority ' + _text(item.priority) + '</span>'
      : '';
    var severity = item && item.severity
      ? '<span class="severity-badge ' + severityClass(item.severity) + '">' + _text(item.severity) + '</span>'
      : '';
    var category = item && item.category
      ? '<span class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">' + _text(String(item.category).replace(/_/g, ' ')) + '</span>'
      : '';

    return '' +
      '<div class="nextstep-card animate-in no-break">' +
        '<div class="nextstep-number">' + _text(index + 1) + '</div>' +
        '<div class="flex-1">' +
          '<div class="flex flex-wrap items-center gap-2 mb-1">' +
            '<div class="font-semibold text-slate-800">' + _text(item && item.name ? item.name : 'Recommendation') + '</div>' +
            severity +
            priority +
          '</div>' +
          (category ? '<div class="mb-2">' + category + '</div>' : '') +
          '<p class="text-sm text-slate-500">' + _text(item && item.detail ? item.detail : '') + '</p>' +
        '</div>' +
      '</div>';
  }

  function _findingCard(item, index) {
    var meta = [];
    if (item && item.id) meta.push(item.id);
    if (item && item.category) meta.push(String(item.category).replace(/_/g, ' '));

    return '' +
      '<div class="issue-card animate-in no-break">' +
        '<div class="issue-number">' + _text(index + 1) + '</div>' +
        '<div class="flex-1">' +
          '<div class="flex flex-wrap items-center gap-2 mb-2">' +
            '<div class="font-semibold text-slate-800">' + _text(item && item.name ? item.name : 'Finding') + '</div>' +
            _statusBadge(item && item.status) +
            (item && item.severity ? '<span class="severity-badge ' + severityClass(item.severity) + '">' + _text(item.severity) + '</span>' : '') +
          '</div>' +
          '<p class="text-sm text-slate-500">' + _text(item && item.detail ? item.detail : '') + '</p>' +
          (meta.length ? '<div class="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">' + _text(meta.join(' | ')) + '</div>' : '') +
        '</div>' +
      '</div>';
  }

  function _metricCard(value, label, helper, severity) {
    var severityClassName = severity ? ' severity-' + severity : '';
    return '' +
      '<div class="stat-card' + severityClassName + ' no-break animate-in">' +
        '<div class="stat-value">' + _text(value) + '</div>' +
        '<div class="stat-label">' + _text(label) + '</div>' +
        (helper ? '<div class="mt-2 text-xs text-slate-400">' + _text(helper) + '</div>' : '') +
      '</div>';
  }

  function _scoreGauge(score, grade) {
    var pct = Math.max(0, Math.min(100, Math.round(_toNumber(score) || 0)));
    var gradeColor = '#ef4444';

    if (String(grade || '').charAt(0).toUpperCase() === 'A') gradeColor = '#22c55e';
    else if (String(grade || '').charAt(0).toUpperCase() === 'B') gradeColor = '#84cc16';
    else if (String(grade || '').charAt(0).toUpperCase() === 'C') gradeColor = '#eab308';
    else if (String(grade || '').charAt(0).toUpperCase() === 'D') gradeColor = '#f97316';

    return '' +
      '<div class="mx-auto flex h-56 w-56 items-center justify-center rounded-full" style="background:conic-gradient(#3b82f6 0 ' + _text(pct) + '%, rgba(255,255,255,0.16) ' + _text(pct) + '% 100%);">' +
        '<div class="flex h-44 w-44 flex-col items-center justify-center rounded-full bg-navy-900/95 text-center shadow-inner">' +
          '<div class="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Score</div>' +
          '<div class="mt-2 text-5xl font-extrabold text-white">' + _text(score != null ? score : 0) + '</div>' +
          '<div class="mt-3 inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-semibold text-white" style="background:' + gradeColor + ';">' + _text(grade || 'F') + '</div>' +
        '</div>' +
      '</div>';
  }

  function _renderHeader(data, audit) {
    var client = _getClient(data);
    var accountScore = audit && audit.accountScore ? audit.accountScore : {};
    var titleBase = client.name || client.company || client.website || 'PPC Audit';

    _setHTML('#hero-client', _text(client.name || client.company || 'PPC Audit'));
    _setHTML('#hero-website', _text(client.website || client.websiteUrl || ''));
    _setHTML('#hero-date', _text(client.auditDate || ''));
    _setHTML('#hero-summary', _text(client.gradeSummary || ''));
    _setHTML('#footer-date', _text(client.auditDate || ''));

    _setHTML('#hero-score-card',
      '<div class="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm no-break">' +
        _scoreGauge(accountScore.score || 0, accountScore.grade || client.overallGrade || 'F') +
        '<div class="mt-5 grid grid-cols-3 gap-3 text-center text-sm">' +
          '<div><div class="text-lg font-bold text-white">' + _text(accountScore.checksPassed || 0) + '</div><div class="text-blue-200">Passed</div></div>' +
          '<div><div class="text-lg font-bold text-white">' + _text(accountScore.checksWarned || 0) + '</div><div class="text-blue-200">Warned</div></div>' +
          '<div><div class="text-lg font-bold text-white">' + _text(accountScore.checksFailed || 0) + '</div><div class="text-blue-200">Failed</div></div>' +
        '</div>' +
      '</div>'
    );

    document.title = 'PPC Dashboard - ' + String(titleBase);
  }

  function _renderScore(audit) {
    var accountScore = audit && audit.accountScore ? audit.accountScore : null;

    if (!accountScore) {
      _setHTML('#score-panel', _emptyState('No account score available', 'The PPC audit did not return a weighted account score for this report.'));
      return;
    }

    _setHTML('#score-panel',
      '<div class="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 no-break">' +
        '<div class="grid gap-8 xl:grid-cols-[320px,1fr] xl:items-center">' +
          _scoreGauge(accountScore.score || 0, accountScore.grade || 'F') +
          '<div>' +
            '<div class="flex flex-wrap items-center gap-3 mb-3">' +
              '<span class="severity-badge info">Total checks: ' + _text(accountScore.totalChecks || 0) + '</span>' +
              '<span class="severity-badge low">Passed: ' + _text(accountScore.checksPassed || 0) + '</span>' +
              '<span class="severity-badge medium">Warned: ' + _text(accountScore.checksWarned || 0) + '</span>' +
              '<span class="severity-badge critical">Failed: ' + _text(accountScore.checksFailed || 0) + '</span>' +
            '</div>' +
            '<h2 class="text-2xl font-bold text-slate-900">Grade ' + _text(accountScore.grade || 'F') + ' account health</h2>' +
            '<p class="mt-3 text-slate-500 leading-relaxed">This score blends the PPC audit categories with weighted severity. Warnings receive half credit, while failures pull the score down most when they sit in critical categories like wasted spend.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function _renderMetrics(data, audit) {
    var summary = audit && audit.wastedSpend ? (audit.wastedSpend.summary || {}) : {};
    var metrics = _deriveMetrics(data, audit);
    var actualCpa = metrics.cpa;
    var actualRoas = metrics.roas;
    var cards = [
      _metricCard(_compactMoney(metrics.totalCost), 'Total Cost', metrics.totalCostSource || '', _toNumber(summary.wastedPct) > 15 ? 'red' : 'green'),
      _metricCard(metrics.conversions != null ? formatNumber(metrics.conversions.toFixed ? metrics.conversions.toFixed(1).replace(/\.0$/, '') : metrics.conversions) : 'N/A', 'Conversions', metrics.conversions != null ? 'Derived from available PPC data' : 'Not present in analyzer output', metrics.conversions > 0 ? 'green' : 'red'),
      _metricCard(actualCpa != null ? _money(actualCpa) : 'N/A', 'CPA', metrics.cpaSource || 'Not available', actualCpa != null && _toNumber(summary.targetCpa) != null && actualCpa <= _toNumber(summary.targetCpa) ? 'green' : 'orange'),
      _metricCard(actualRoas != null ? Number(actualRoas).toFixed(2) + 'x' : 'N/A', 'ROAS', metrics.roasSource || 'Not available in analyzer output', actualRoas != null && actualRoas >= 3 ? 'green' : actualRoas != null && actualRoas >= 1 ? 'yellow' : 'red')
    ];

    _setHTML('#overview-grid', cards.join(''));
  }

  function _renderFindings(audit) {
    var findings = _allChecks(audit)
      .filter(function (check) {
        return check && (check.status === 'fail' || check.status === 'warn');
      })
      .sort(function (a, b) {
        return _statusWeight(a.status) - _statusWeight(b.status) || _severityWeight(a.severity) - _severityWeight(b.severity);
      })
      .slice(0, 6);

    if (!findings.length) {
      _setHTML('#findings-list', _emptyState('No failed or warning checks', 'All PPC audit checks passed, so there are no major findings to call out on the dashboard.'));
      return;
    }

    _setHTML('#findings-list', findings.map(_findingCard).join(''));
  }

  function _renderRecommendations(audit) {
    var recommendations = _asArray(audit && audit.recommendations)
      .slice()
      .sort(function (a, b) {
        return (_toNumber(b && b.priority) || 0) - (_toNumber(a && a.priority) || 0);
      })
      .slice(0, 8);

    if (!recommendations.length) {
      _setHTML('#recommendations-list', _emptyState('No recommendations available', 'The PPC analyzer did not emit any prioritized recommendations for this report.'));
      return;
    }

    _setHTML('#recommendations-list', recommendations.map(_recommendationCard).join(''));
  }

  window.TPPC.pages.index = {
    init: function (data) {
      var audit = _getAudit(data);
      window.TPPC.currentPage = 'index';
      _renderHeader(data, audit);
      _renderScore(audit);
      _renderMetrics(data, audit);
      _renderFindings(audit);
      _renderRecommendations(audit);
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
