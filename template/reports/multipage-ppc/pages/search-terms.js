/**
 * pages/search-terms.js — Search terms page renderer
 * Namespace: window.TPPC.pages['search-terms']
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'search-terms';

  var utils = window.TPPC.utils || {};
  var esc = utils.esc || function (value) {
    if (value == null) return '';
    var div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  };
  var formatNumber = utils.formatNumber || function (value) {
    if (value == null || value === '' || isNaN(Number(value))) return '';
    return Number(value).toLocaleString();
  };

  var _ngramRows = [];
  var _sortDir = 'desc';

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

  function _getSearchTerms(data, audit) {
    return _asArray(audit && audit.ngramAnalysis && audit.ngramAnalysis.searchTerms).length
      ? _asArray(audit.ngramAnalysis.searchTerms)
      : _asArray(data && data.searchTerms);
  }

  function _renderHeader(data) {
    var client = _getClient(data);
    var titleBase = client.name || client.company || client.website || 'PPC Audit';

    _setHTML('#hero-client', _text(client.name || client.company || 'PPC Audit'));
    _setHTML('#hero-website', _text(client.website || client.websiteUrl || ''));
    _setHTML('#hero-date', _text(client.auditDate || ''));
    _setHTML('#footer-date', _text(client.auditDate || ''));
    document.title = 'Search Terms - ' + String(titleBase);
  }

  function _renderNgramRows() {
    if (!_ngramRows.length) {
      _setHTML('#ngrams-table-body', _tableEmpty(7, 'No n-gram analysis available', 'The PPC analyzer did not return aggregated n-gram results for this report.'));
      return;
    }

    var rows = _ngramRows.slice().sort(function (a, b) {
      var diff = (_toNumber(a.cost) || 0) - (_toNumber(b.cost) || 0);
      return _sortDir === 'desc' ? -diff : diff;
    });

    _setHTML('#ngrams-table-body', rows.map(function (row) {
      return '' +
        '<tr class="no-break">' +
          '<td class="font-medium text-slate-700">' + _text(row.ngram || '') + '</td>' +
          '<td>' + _text(row.wordCount != null ? row.wordCount : 'N/A') + '</td>' +
          '<td>' + _text(row.impressions != null ? formatNumber(row.impressions) : 'N/A') + '</td>' +
          '<td>' + _text(row.clicks != null ? formatNumber(row.clicks) : 'N/A') + '</td>' +
          '<td>' + _money(row.cost) + '</td>' +
          '<td>' + _text(row.conversions != null ? formatNumber(row.conversions) : 'N/A') + '</td>' +
          '<td>' + _text(row.cpa != null ? _money(row.cpa) : 'N/A') + '</td>' +
        '</tr>';
    }).join(''));
  }

  function _initSortButton() {
    var button = $('#sort-cost-btn');
    if (!button) return;

    button.addEventListener('click', function () {
      _sortDir = _sortDir === 'desc' ? 'asc' : 'desc';
      button.innerHTML = _text(_sortDir === 'desc' ? 'Sort Cost: High to Low' : 'Sort Cost: Low to High');
      _renderNgramRows();
    });
  }

  function _renderNegativeCandidates(audit) {
    var rows = _asArray(audit && audit.ngramAnalysis && audit.ngramAnalysis.negativeCandidates);

    if (!rows.length) {
      _setHTML('#negative-candidates-table-body', _tableEmpty(5, 'No negative keyword candidates returned', 'The current n-gram analysis did not produce any negative keyword candidates.'));
      return;
    }

    _setHTML('#negative-candidates-table-body', rows.map(function (row) {
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

  function _renderTopTerms(data, audit) {
    var rows = _getSearchTerms(data, audit).map(function (row) {
      var cost = _toNumber(row.cost);
      var conversions = _toNumber(row.conversions) || 0;
      return {
        term: row.search_term || row.searchTerm || row.query || '',
        campaign: row.campaign || row.campaign_name || row.campaignName || '',
        clicks: row.clicks,
        cost: cost,
        conversions: conversions,
        cpa: conversions > 0 && cost != null ? cost / conversions : null
      };
    }).filter(function (row) {
      return row.term && row.cost != null;
    }).sort(function (a, b) {
      return (_toNumber(b.cost) || 0) - (_toNumber(a.cost) || 0);
    }).slice(0, 25);

    if (!rows.length) {
      _setHTML('#top-terms-table-body', _tableEmpty(6, 'No raw search-term rows available', 'The analyzer can produce n-gram summaries without keeping the underlying search-term rows in the final report data.'));
      return;
    }

    _setHTML('#top-terms-table-body', rows.map(function (row) {
      return '' +
        '<tr class="no-break">' +
          '<td class="font-medium text-slate-700">' + _text(row.term) + '</td>' +
          '<td>' + _text(row.campaign || 'N/A') + '</td>' +
          '<td>' + _text(row.clicks != null ? formatNumber(row.clicks) : 'N/A') + '</td>' +
          '<td>' + _money(row.cost) + '</td>' +
          '<td>' + _text(row.conversions != null ? formatNumber(row.conversions) : 'N/A') + '</td>' +
          '<td>' + _text(row.cpa != null ? _money(row.cpa) : 'N/A') + '</td>' +
        '</tr>';
    }).join(''));
  }

  window.TPPC.pages['search-terms'] = {
    init: function (data) {
      var audit = _getAudit(data);
      window.TPPC.currentPage = 'search-terms';
      _renderHeader(data);
      _ngramRows = _asArray(audit && audit.ngramAnalysis && audit.ngramAnalysis.topNgrams);
      _renderNgramRows();
      _initSortButton();
      _renderNegativeCandidates(audit);
      _renderTopTerms(data, audit);
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
