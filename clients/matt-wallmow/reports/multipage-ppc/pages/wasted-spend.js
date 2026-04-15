/**
 * pages/wasted-spend.js — Wasted spend page renderer
 * Namespace: window.TPPC.pages['wasted-spend']
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'wasted-spend';

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

  var ZERO_CONV_CLICK_THRESHOLD = 100;
  var SMART_BIDDING = {
    MAXIMIZE_CONVERSIONS: true,
    MAXIMIZE_CONVERSION_VALUE: true,
    TARGET_CPA: true,
    TARGET_ROAS: true
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

  function _percent(value) {
    var num = _toNumber(value);
    if (num == null) return 'N/A';
    return Number(num).toFixed(1) + '%';
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

  function _getKeywords(data, audit) {
    return _asArray(audit && audit.wastedSpend && audit.wastedSpend.keywords).length
      ? _asArray(audit.wastedSpend.keywords)
      : _asArray(data && data.keywords);
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
    document.title = 'Wasted Spend - ' + String(titleBase);
  }

  function _summaryCard(value, label, helper, severity) {
    return '' +
      '<div class="stat-card severity-' + _text(severity || 'green') + ' no-break">' +
        '<div class="stat-value">' + _text(value) + '</div>' +
        '<div class="stat-label">' + _text(label) + '</div>' +
        (helper ? '<div class="mt-2 text-xs text-slate-400">' + _text(helper) + '</div>' : '') +
      '</div>';
  }

  function _deriveZeroConversionRows(data, audit) {
    var wasted = audit && audit.wastedSpend ? audit.wastedSpend : {};
    var items = _asArray(wasted.wastedItems).filter(function (item) {
      return item && item.type === 'zero_conversion_keyword';
    });

    if (items.length) return items;

    return _getKeywords(data, audit).filter(function (keyword) {
      return (_toNumber(keyword && keyword.clicks) || 0) >= ZERO_CONV_CLICK_THRESHOLD && (_toNumber(keyword && keyword.conversions) || 0) === 0;
    }).map(function (keyword) {
      return {
        keyword: keyword.keyword || keyword.keyword_text || keyword.keywordText || '',
        cost: keyword.cost,
        clicks: keyword.clicks,
        severity: 'high'
      };
    }).sort(function (a, b) {
      return (_toNumber(b.cost) || 0) - (_toNumber(a.cost) || 0);
    }).slice(0, 20);
  }

  function _deriveOverspendingRows(data, audit) {
    var wasted = audit && audit.wastedSpend ? audit.wastedSpend : {};
    var targetCpa = _toNumber(wasted.summary && wasted.summary.targetCpa);
    var rows = _asArray(wasted.overspendingKeywords).map(function (row) {
      return {
        keyword: row.keyword || row.keyword_text || row.keywordText || '',
        cost: row.cost,
        conversions: row.conversions,
        cpa: row.cpa || ((_toNumber(row.cost) || 0) / Math.max(_toNumber(row.conversions) || 1, 1)),
        multiple: row.multiple
      };
    });

    if (rows.length) return rows;
    if (targetCpa == null || targetCpa <= 0) return [];

    return _getKeywords(data, audit).filter(function (keyword) {
      var conversions = _toNumber(keyword && keyword.conversions) || 0;
      var cost = _toNumber(keyword && keyword.cost) || 0;
      return conversions > 0 && (cost / conversions) > targetCpa * 3;
    }).map(function (keyword) {
      var conversions = _toNumber(keyword && keyword.conversions) || 0;
      var cost = _toNumber(keyword && keyword.cost) || 0;
      var cpa = conversions > 0 ? cost / conversions : null;
      return {
        keyword: keyword.keyword || keyword.keyword_text || keyword.keywordText || '',
        cost: cost,
        conversions: conversions,
        cpa: cpa,
        multiple: cpa != null && targetCpa > 0 ? (cpa / targetCpa) : null
      };
    }).sort(function (a, b) {
      return (_toNumber(b.cpa) || 0) - (_toNumber(a.cpa) || 0);
    }).slice(0, 20);
  }

  function _deriveBroadMatchRows(data, audit) {
    var campaigns = _asArray(data && data.campaigns);
    var strategies = {};
    var rows = _asArray(audit && audit.wastedSpend && audit.wastedSpend.broadMatchIssues);

    if (rows.length) return rows;

    campaigns.forEach(function (campaign) {
      var id = String(campaign && (campaign.id || campaign.campaign_id || campaign.campaignId || '')).trim();
      if (!id) return;
      strategies[id] = String(campaign && (campaign.bidding_strategy_type || campaign.biddingStrategy || '')).toUpperCase();
    });

    return _getKeywords(data, audit).filter(function (keyword) {
      var matchType = String(keyword && (keyword.match_type || keyword.matchType || '')).toUpperCase();
      var strategy = String(keyword && (keyword.bidding_strategy_type || keyword.biddingStrategy || strategies[String(keyword && (keyword.campaign_id || keyword.campaignId || ''))] || '')).toUpperCase();
      return matchType === 'BROAD' && !SMART_BIDDING[strategy];
    }).map(function (keyword) {
      return {
        keyword: keyword.keyword || keyword.keyword_text || keyword.keywordText || '',
        strategy: keyword.bidding_strategy_type || keyword.biddingStrategy || strategies[String(keyword && (keyword.campaign_id || keyword.campaignId || ''))] || 'UNKNOWN',
        cost: keyword.cost,
        clicks: keyword.clicks,
        campaign: keyword.campaign || keyword.campaign_name || keyword.campaignName || ''
      };
    }).sort(function (a, b) {
      return (_toNumber(b.cost) || 0) - (_toNumber(a.cost) || 0);
    }).slice(0, 20);
  }

  function _renderSummary(audit) {
    var wasted = audit && audit.wastedSpend ? audit.wastedSpend : {};
    var summary = wasted.summary || {};
    var cards = [
      _summaryCard(_money(summary.wastedCost), 'Total Waste', 'Estimated cost tied to zero-conversion waste', (_toNumber(summary.wastedPct) || 0) >= 15 ? 'red' : 'orange'),
      _summaryCard(_percent(summary.wastedPct || 0), 'Waste %', 'Share of spend on wasted terms', (_toNumber(summary.wastedPct) || 0) >= 15 ? 'red' : (_toNumber(summary.wastedPct) || 0) >= 5 ? 'yellow' : 'green'),
      _summaryCard(summary.zeroConvKeywords != null ? formatNumber(summary.zeroConvKeywords) : '0', 'Zero-Conv Keywords', 'Keywords crossing the click threshold with no conversions', (_toNumber(summary.zeroConvKeywords) || 0) > 0 ? 'orange' : 'green'),
      _summaryCard(_money(summary.targetCpa), 'Target CPA', 'Benchmark used for overspending detection', 'green')
    ];

    _setHTML('#summary-grid', cards.join(''));

    _setHTML('#summary-checks', _asArray(wasted.checks).length
      ? _asArray(wasted.checks).map(function (check, index) {
          return '' +
            '<div class="issue-card no-break animate-in">' +
              '<div class="issue-number">' + _text(index + 1) + '</div>' +
              '<div class="flex-1">' +
                '<div class="flex flex-wrap items-center gap-2 mb-2">' +
                  '<div class="font-semibold text-slate-800">' + _text(check.name || check.id || 'Waste check') + '</div>' +
                  _statusBadge(check.status) +
                  '<span class="severity-badge ' + severityClass(check.severity) + '">' + _text(check.severity || 'info') + '</span>' +
                '</div>' +
                '<p class="text-sm text-slate-500">' + _text(check.detail || '') + '</p>' +
              '</div>' +
            '</div>';
        }).join('')
      : _emptyState('No wasted-spend checks returned', 'The PPC analyzer did not emit wasted-spend checks for this report.')
    );
  }

  function _renderZeroConversionTable(data, audit) {
    var rows = _deriveZeroConversionRows(data, audit);

    if (!rows.length) {
      _setHTML('#zero-conv-table-body', _tableEmpty(4, 'No zero-conversion keywords listed', 'No keyword crossed the click threshold without conversions, or raw keyword data was not provided.'));
      return;
    }

    _setHTML('#zero-conv-table-body', rows.map(function (row) {
      return '' +
        '<tr class="no-break">' +
          '<td class="font-medium text-slate-700">' + _text(row.keyword || '') + '</td>' +
          '<td>' + _money(row.cost) + '</td>' +
          '<td>' + _text(row.clicks != null ? formatNumber(row.clicks) : 'N/A') + '</td>' +
          '<td><span class="severity-badge ' + severityClass(row.severity || 'high') + '">' + _text(row.severity || 'high') + '</span></td>' +
        '</tr>';
    }).join(''));
  }

  function _renderOverspendingTable(data, audit) {
    var rows = _deriveOverspendingRows(data, audit);

    if (!rows.length) {
      _setHTML('#overspending-table-body', _tableEmpty(5, 'No overspending keywords listed', 'Overspending terms require either derived keyword-level CPA data or a dedicated overspending list in the audit output.'));
      return;
    }

    _setHTML('#overspending-table-body', rows.map(function (row) {
      return '' +
        '<tr class="no-break">' +
          '<td class="font-medium text-slate-700">' + _text(row.keyword || '') + '</td>' +
          '<td>' + _money(row.cost) + '</td>' +
          '<td>' + _text(row.conversions != null ? formatNumber(row.conversions) : 'N/A') + '</td>' +
          '<td>' + _money(row.cpa) + '</td>' +
          '<td>' + _text(row.multiple != null ? Number(row.multiple).toFixed(1) + 'x' : 'N/A') + '</td>' +
        '</tr>';
    }).join(''));
  }

  function _renderBroadMatch(data, audit) {
    var rows = _deriveBroadMatchRows(data, audit);
    var wasted = audit && audit.wastedSpend ? audit.wastedSpend : {};
    var broadCheck = _asArray(wasted.checks).filter(function (check) {
      return check && check.id === 'WS-05';
    })[0];

    if (!rows.length && !broadCheck) {
      _setHTML('#broad-match-content', _emptyState('No broad-match issues available', 'The report does not include raw keyword rows or a dedicated broad-match issue list.'));
      return;
    }

    _setHTML('#broad-match-content',
      (broadCheck
        ? '<div class="issue-card mb-6 no-break">' +
            '<div class="issue-number">' + _text(broadCheck.id || 'WS') + '</div>' +
            '<div class="flex-1">' +
              '<div class="flex flex-wrap items-center gap-2 mb-2">' +
                '<div class="font-semibold text-slate-800">' + _text(broadCheck.name || 'Broad match issue') + '</div>' +
                _statusBadge(broadCheck.status) +
                '<span class="severity-badge ' + severityClass(broadCheck.severity) + '">' + _text(broadCheck.severity || 'info') + '</span>' +
              '</div>' +
              '<p class="text-sm text-slate-500">' + _text(broadCheck.detail || '') + '</p>' +
            '</div>' +
          '</div>'
        : '') +
      (rows.length
        ? '<div class="report-table-wrap"><table class="report-table"><thead><tr><th>Keyword</th><th>Campaign</th><th>Bidding Strategy</th><th>Cost</th><th>Clicks</th></tr></thead><tbody>' +
            rows.map(function (row) {
              return '' +
                '<tr class="no-break">' +
                  '<td class="font-medium text-slate-700">' + _text(row.keyword || '') + '</td>' +
                  '<td>' + _text(row.campaign || 'N/A') + '</td>' +
                  '<td>' + _text(row.strategy || 'UNKNOWN') + '</td>' +
                  '<td>' + _money(row.cost) + '</td>' +
                  '<td>' + _text(row.clicks != null ? formatNumber(row.clicks) : 'N/A') + '</td>' +
                '</tr>';
            }).join('') +
          '</tbody></table></div>'
        : _emptyState('No raw broad-match rows available', 'The broad-match check fired, but the detailed keyword rows were not included in the report data.'))
    );
  }

  window.TPPC.pages['wasted-spend'] = {
    init: function (data) {
      var audit = _getAudit(data);
      window.TPPC.currentPage = 'wasted-spend';
      _renderHeader(data);
      _renderSummary(audit);
      _renderZeroConversionTable(data, audit);
      _renderOverspendingTable(data, audit);
      _renderBroadMatch(data, audit);
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
