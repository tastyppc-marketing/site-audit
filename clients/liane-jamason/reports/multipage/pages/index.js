/**
 * pages/index.js — Executive summary page renderers
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

  function $(selector) {
    return document.querySelector(selector);
  }

  function _text(value) {
    return esc(value == null ? '' : value);
  }

  function _plainText(value) {
    var div = document.createElement('div');
    div.innerHTML = _text(value);
    return div.textContent || '';
  }

  function _setHTML(selector, value) {
    var el = $(selector);
    if (!el) return;
    el.innerHTML = value;
  }

  function _toggleMeta(selector, hasValue) {
    var el = $(selector);
    if (!el) return;
    el.style.display = hasValue ? '' : 'none';
  }

  function _hideSection(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  function _statSeverityClass(value) {
    var normalized = String(value || '').toLowerCase();
    if (normalized === 'red') return 'severity-red';
    if (normalized === 'orange') return 'severity-orange';
    if (normalized === 'yellow') return 'severity-yellow';
    if (normalized === 'green') return 'severity-green';
    return '';
  }

  window.TPPC.pages.index = {
    init: function (data) {
      window.TPPC.currentPage = 'index';
      this.renderHero(data);
      this.renderKeyStats(data);
      this.renderTopIssues(data);
      this.renderSiteComparison(data);
      this.renderQuickWins(data);
      this.renderNextSteps(data);
    },

    renderHero: function (data) {
      var client = data && data.client ? data.client : {};
      var gradeClass = utils.gradeClass || function () { return 'grade-d'; };
      var clientName = client.name || client.company || 'SEO Audit';
      var serviceType = client.serviceType ? _text(client.serviceType) + ' Audit Report' : 'SEO Audit Report';

      _setHTML('#hero-service-type', serviceType);
      _setHTML('#hero-client', _text(clientName));
      _setHTML('#hero-website', _text(client.website || client.websiteUrl || ''));
      _setHTML('#hero-date-text', _text(client.auditDate || ''));
      _setHTML('#hero-platform-text', _text(client.platform || ''));
      _setHTML('#hero-location-text', _text(client.location || ''));
      _setHTML('#hero-summary', _text(client.gradeSummary || ''));
      _setHTML('#footer-date', _text(client.auditDate || ''));

      _toggleMeta('#hero-date', !!client.auditDate);
      _toggleMeta('#hero-platform', !!client.platform);
      _toggleMeta('#hero-location', !!client.location);

      var grade = document.getElementById('hero-grade');
      if (grade) {
        grade.className = 'grade-badge mx-auto mb-3 ' + gradeClass(client.overallGrade);
        grade.innerHTML = _text(client.overallGrade || '?');
      }

      document.title = 'SEO Audit - ' + _plainText(client.name || client.company || client.website || 'Report');
    },

    renderKeyStats: function (data) {
      var stats = data && data.keyStats;
      if (!stats || !stats.length) {
        _hideSection('section-stats');
        return;
      }

      _setHTML('#stats-grid', stats.map(function (stat) {
        return '' +
          '<div class="stat-card ' + _statSeverityClass(stat.severity) + ' animate-in no-break">' +
            '<div class="stat-value">' + _text(stat.value) + '</div>' +
            '<div class="stat-label">' + _text(stat.label) + '</div>' +
          '</div>';
      }).join(''));
    },

    renderTopIssues: function (data) {
      var issues = data && data.topIssues;
      var severityClass = utils.severityClass || function () { return 'info'; };
      var pillClass = utils.pillClass || function () { return ''; };

      if (!issues || !issues.length) {
        _hideSection('section-issues');
        return;
      }

      _setHTML('#issues-list', issues.map(function (item, index) {
        var effort = item && item.effort
          ? '<span class="' + pillClass('effort', item.effort) + '">' + _text(item.effort) + ' effort</span>'
          : '';

        return '' +
          '<div class="issue-card animate-in no-break">' +
            '<div class="issue-number">' + _text(index + 1) + '</div>' +
            '<div class="flex-1">' +
              '<div class="flex flex-wrap items-center gap-2 mb-1">' +
                '<span class="font-bold text-slate-800">' + _text(item.issue) + '</span>' +
                '<span class="severity-badge ' + severityClass(item.impact) + '">' + _text(item.impact) + '</span>' +
                effort +
              '</div>' +
              '<p class="text-sm text-slate-500 leading-relaxed">' + _text(item.detail) + '</p>' +
            '</div>' +
          '</div>';
      }).join(''));
    },

    renderSiteComparison: function (data) {
      var rows = data && data.siteComparison;
      var table = document.getElementById('comparison-table');
      var clientLabel = data && data.client ? data.client.website : '';
      var competitorLabel = data && data.competitor ? (data.competitor.primaryLabel || data.competitor.primary) : '';

      if (!rows || !rows.length || !table) {
        _hideSection('section-comparison');
        return;
      }

      _setHTML('#comparison-table thead tr',
        '<th>Metric</th>' +
        '<th class="highlight-col">' + _text(clientLabel || 'Client') + '</th>' +
        '<th>' + _text(competitorLabel || 'Competitor') + '</th>' +
        '<th>Gap</th>'
      );

      _setHTML('#comparison-table tbody', rows.map(function (row) {
        return '' +
          '<tr class="no-break">' +
            '<td class="font-medium text-slate-700">' + _text(row.metric) + '</td>' +
            '<td class="highlight-col">' + _text(row.client) + '</td>' +
            '<td>' + _text(row.competitor) + '</td>' +
            '<td><span class="text-sm text-slate-500 italic">' + _text(row.gap) + '</span></td>' +
          '</tr>';
      }).join(''));
    },

    renderQuickWins: function (data) {
      var wins = data && data.quickWins;
      var severityClass = utils.severityClass || function () { return 'info'; };

      if (!wins || !wins.length) {
        _hideSection('section-quickwins');
        return;
      }

      _setHTML('#quickwins-list', wins.map(function (item) {
        var impact = item && item.impact
          ? '<span class="severity-badge ' + severityClass(item.impact) + ' flex-shrink-0">' + _text(item.impact) + ' Impact</span>'
          : '';

        return '' +
          '<div class="quickwin-item no-break">' +
            '<div class="quickwin-check">' +
              '<svg class="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' +
            '</div>' +
            '<div class="flex-1">' +
              '<span class="text-sm font-medium text-slate-700">' + _text(item.action) + '</span>' +
            '</div>' +
            impact +
          '</div>';
      }).join(''));
    },

    renderNextSteps: function (data) {
      var nextSteps = data && data.nextSteps;

      if (!nextSteps || !nextSteps.length) {
        _hideSection('section-nextsteps');
        return;
      }

      _setHTML('#nextsteps-list', nextSteps.map(function (item, index) {
        var sub = item && item.sub
          ? '<p class="text-sm text-slate-500 mt-0.5">' + _text(item.sub) + '</p>'
          : '';

        return '' +
          '<div class="nextstep-card animate-in no-break">' +
            '<div class="nextstep-number">' + _text(index + 1) + '</div>' +
            '<div>' +
              '<div class="font-semibold text-slate-800">' + _text(item.text) + '</div>' +
              sub +
            '</div>' +
          '</div>';
      }).join(''));
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
