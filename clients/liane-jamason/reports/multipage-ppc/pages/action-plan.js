/**
 * pages/action-plan.js — PPC action plan page renderer
 * Namespace: window.TPPC.pages['action-plan']
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'action-plan';

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

  function _severityBucket(value) {
    var normalized = String(value || '').toLowerCase();
    if (normalized === 'critical') return 'critical';
    if (normalized === 'high') return 'high';
    return 'medium';
  }

  function _renderHeader(data) {
    var client = _getClient(data);
    var titleBase = client.name || client.company || client.website || 'PPC Audit';

    _setHTML('#hero-client', _text(client.name || client.company || 'PPC Audit'));
    _setHTML('#hero-website', _text(client.website || client.websiteUrl || ''));
    _setHTML('#hero-date', _text(client.auditDate || ''));
    _setHTML('#footer-date', _text(client.auditDate || ''));
    document.title = 'Action Plan - ' + String(titleBase);
  }

  function _recommendationCard(item, index) {
    var meta = [];
    if (item && item.category) meta.push(String(item.category).replace(/_/g, ' '));
    if (item && item.checkId) meta.push(item.checkId);

    return '' +
      '<div class="nextstep-card animate-in no-break">' +
        '<div class="nextstep-number">' + _text(index + 1) + '</div>' +
        '<div class="flex-1">' +
          '<div class="flex flex-wrap items-center gap-2 mb-2">' +
            '<div class="font-semibold text-slate-800">' + _text(item && item.name ? item.name : 'Recommendation') + '</div>' +
            '<span class="severity-badge ' + severityClass(item && item.severity ? item.severity : 'info') + '">' + _text(item && item.severity ? item.severity : 'info') + '</span>' +
            (item && item.priority != null ? '<span class="severity-badge info">Priority ' + _text(item.priority) + '</span>' : '') +
          '</div>' +
          '<p class="text-sm text-slate-500">' + _text(item && item.detail ? item.detail : '') + '</p>' +
          (meta.length ? '<div class="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">' + _text(meta.join(' | ')) + '</div>' : '') +
        '</div>' +
      '</div>';
  }

  function _renderRecommendationGroup(selector, recommendations, title, detail) {
    if (!recommendations.length) {
      _setHTML(selector, _emptyState(title, detail));
      return;
    }

    _setHTML(selector, recommendations.map(_recommendationCard).join(''));
  }

  function _renderRecommendations(audit) {
    var recommendations = _asArray(audit && audit.recommendations).slice().sort(function (a, b) {
      return (_toNumber(b && b.priority) || 0) - (_toNumber(a && a.priority) || 0);
    });
    var critical = [];
    var high = [];
    var medium = [];

    recommendations.forEach(function (recommendation) {
      var bucket = _severityBucket(recommendation && recommendation.severity);
      if (bucket === 'critical') critical.push(recommendation);
      else if (bucket === 'high') high.push(recommendation);
      else medium.push(recommendation);
    });

    _renderRecommendationGroup('#critical-recommendations', critical, 'No critical recommendations', 'The PPC analyzer did not emit any critical-priority recommendations.');
    _renderRecommendationGroup('#high-recommendations', high, 'No high-priority recommendations', 'No recommendations were classified as high severity.');
    _renderRecommendationGroup('#medium-recommendations', medium, 'No medium-priority recommendations', 'No medium or lower-severity recommendations were returned.');
  }

  function _renderNegativeAdds(audit) {
    var rows = _asArray(audit && audit.ngramAnalysis && audit.ngramAnalysis.negativeCandidates);

    if (!rows.length) {
      _setHTML('#negatives-add-table-body', _tableEmpty(5, 'No negative keyword adds recommended', 'The current n-gram analysis did not surface any candidate negatives.'));
      return;
    }

    _setHTML('#negatives-add-table-body', rows.map(function (row) {
      return '' +
        '<tr class="no-break">' +
          '<td class="font-medium text-slate-700">' + _text(row.ngram || '') + '</td>' +
          '<td>' + _money(row.cost) + '</td>' +
          '<td>' + _text(row.clicks != null ? formatNumber(row.clicks) : 'N/A') + '</td>' +
          '<td>' + _text(row.recommendedMatchType || 'N/A') + '</td>' +
          '<td>' + _text(row.reason || '') + '</td>' +
        '</tr>';
    }).join(''));
  }

  window.TPPC.pages['action-plan'] = {
    init: function (data) {
      var audit = _getAudit(data);
      window.TPPC.currentPage = 'action-plan';
      _renderHeader(data);
      _renderRecommendations(audit);
      _renderNegativeAdds(audit);
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
