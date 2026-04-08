/**
 * pages/budget.js — Budget and bidding page renderer
 * Namespace: window.TPPC.pages.budget
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'budget';

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

  function _percent(value) {
    var num = _toNumber(value);
    if (num == null) return 'N/A';
    return (num <= 1 ? num * 100 : num).toFixed(1) + '%';
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

  function _getAudit(data) {
    return data && data.ppcAudit && typeof data.ppcAudit === 'object' ? data.ppcAudit : (data || {});
  }

  function _getClient(data) {
    return data && data.client && typeof data.client === 'object' ? data.client : {};
  }

  function _getCampaigns(data, audit) {
    return _asArray(audit && audit.budgetBidding && audit.budgetBidding.campaigns).length
      ? _asArray(audit.budgetBidding.campaigns)
      : _asArray(data && data.campaigns);
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
    document.title = 'Budget & Bidding - ' + String(titleBase);
  }

  function _summaryCard(value, label, helper, severity) {
    return '' +
      '<div class="stat-card severity-' + _text(severity || 'green') + ' no-break">' +
        '<div class="stat-value">' + _text(value) + '</div>' +
        '<div class="stat-label">' + _text(label) + '</div>' +
        (helper ? '<div class="mt-2 text-xs text-slate-400">' + _text(helper) + '</div>' : '') +
      '</div>';
  }

  function _renderStrategies(data, audit) {
    var budget = audit && audit.budgetBidding ? audit.budgetBidding : {};
    var summary = budget.summary || {};
    var strategies = summary.biddingStrategies || {};
    var labels = Object.keys(strategies);
    var totalCampaigns = _toNumber(summary.totalCampaigns) || 0;
    var smart = _toNumber(summary.smartBiddingCount) || 0;
    var manual = _toNumber(summary.manualCount) || 0;

    if (!labels.length) {
      var canvas = $('#strategy-chart');
      if (canvas && canvas.parentNode) {
        canvas.parentNode.innerHTML = _emptyState('No bidding strategy data available', 'The budget and bidding summary did not include a strategy distribution.');
      }
      _setHTML('#strategy-summary', _emptyState('No strategy summary', 'Provide budget summary data or raw campaign rows to populate this section.'));
      return;
    }

    if (window.TPPC.charts && typeof window.TPPC.charts.createDoughnutChart === 'function') {
      window.TPPC.charts.createDoughnutChart('strategy-chart', {
        labels: labels,
        data: labels.map(function (label) { return _toNumber(strategies[label]) || 0; })
      });
    }

    _setHTML('#strategy-summary', [
      _summaryCard(totalCampaigns ? formatNumber(totalCampaigns) : formatNumber(labels.reduce(function (sum, label) {
        return sum + (_toNumber(strategies[label]) || 0);
      }, 0)), 'Total Campaigns', 'Account campaigns included in the bidding audit', 'green'),
      _summaryCard(formatNumber(smart), 'Smart Bidding Campaigns', 'Maximize, target CPA, or target ROAS strategies', smart > manual ? 'green' : 'orange'),
      _summaryCard(formatNumber(manual), 'Manual Campaigns', 'Manual CPC or manual CPM campaigns', manual === 0 ? 'green' : 'orange'),
      _summaryCard((smart + manual) ? ((smart / (smart + manual)) * 100).toFixed(1) + '%' : '0.0%', 'Smart Share', 'Share of campaigns using smart bidding', smart > manual ? 'green' : 'yellow')
    ].join(''));
  }

  function _renderImpressionShare(data, audit) {
    var budget = audit && audit.budgetBidding ? audit.budgetBidding : {};
    var campaigns = _getCampaigns(data, audit).filter(function (campaign) {
      return _toNumber(campaign && (campaign.search_impression_share || campaign.searchImpressionShare)) != null;
    });
    var impressionCheck = _asArray(budget.checks).filter(function (check) {
      return check && check.id === 'QS-09';
    })[0];

    if (!campaigns.length && !impressionCheck) {
      _setHTML('#impression-share-content', _emptyState('No impression share data available', 'The analyzer only includes average Search Impression Share when campaign-level impression share data is present.'));
      return;
    }

    if (!campaigns.length) {
      _setHTML('#impression-share-content',
        '<div class="bg-white border border-slate-200 rounded-2xl p-6 no-break">' +
          '<div class="flex flex-wrap items-center gap-3 mb-3">' +
            '<div class="font-semibold text-slate-800">' + _text(impressionCheck.name || 'Search Impression Share') + '</div>' +
            _statusBadge(impressionCheck.status) +
            '<span class="severity-badge ' + severityClass(impressionCheck.severity) + '">' + _text(impressionCheck.severity || 'info') + '</span>' +
          '</div>' +
          '<p class="text-sm text-slate-500">' + _text(impressionCheck.detail || '') + '</p>' +
        '</div>'
      );
      return;
    }

    _setHTML('#impression-share-content',
      '<div class="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">' +
        '<div class="grid gap-4 sm:grid-cols-2">' +
          _summaryCard(impressionCheck ? _text((impressionCheck.detail || '').replace(/^Average IS:\s*/i, '')) : _percent(campaigns.reduce(function (sum, campaign) {
            return sum + (_toNumber(campaign.search_impression_share || campaign.searchImpressionShare) || 0);
          }, 0) / campaigns.length), 'Average Search IS', 'Across campaigns with available data', impressionCheck && impressionCheck.status === 'fail' ? 'red' : impressionCheck && impressionCheck.status === 'warn' ? 'yellow' : 'green') +
          _summaryCard(formatNumber(campaigns.length), 'Campaigns With IS Data', 'Only campaigns with Search Impression Share are included', 'green') +
        '</div>' +
        '<div class="report-table-wrap">' +
          '<table class="report-table">' +
            '<thead><tr><th>Campaign</th><th>Strategy</th><th>Search Impression Share</th></tr></thead>' +
            '<tbody>' +
              campaigns.map(function (campaign) {
                return '' +
                  '<tr class="no-break">' +
                    '<td class="font-medium text-slate-700">' + _text(campaign.name || campaign.campaign || campaign.campaignName || campaign.id || '') + '</td>' +
                    '<td>' + _text(campaign.bidding_strategy_type || campaign.biddingStrategy || 'Unknown') + '</td>' +
                    '<td>' + _percent(campaign.search_impression_share || campaign.searchImpressionShare) + '</td>' +
                  '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>'
    );
  }

  function _renderPacing(audit) {
    var budget = audit && audit.budgetBidding ? audit.budgetBidding : {};
    var summary = budget.summary || {};
    var checks = _asArray(budget.checks);
    var smart = _toNumber(summary.smartBiddingCount) || 0;
    var manual = _toNumber(summary.manualCount) || 0;

    if (!checks.length && !summary.totalCampaigns) {
      _setHTML('#pacing-content', _emptyState('No bidding checks available', 'The budget and bidding analyzer did not return any checks or strategy counts.'));
      return;
    }

    _setHTML('#pacing-content',
      '<div class="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">' +
        '<div class="grid gap-4 sm:grid-cols-2">' +
          _summaryCard(formatNumber(smart), 'Smart Bidding', 'Campaigns using automated bidding strategies', smart > manual ? 'green' : 'yellow') +
          _summaryCard(formatNumber(manual), 'Manual Bidding', 'Campaigns still managed with manual bids', manual === 0 ? 'green' : 'orange') +
        '</div>' +
        '<div class="flex flex-col gap-4">' +
          checks.map(function (check) {
            return '' +
              '<div class="issue-card no-break animate-in">' +
                '<div class="issue-number">' + _text(check.id || 'BD') + '</div>' +
                '<div class="flex-1">' +
                  '<div class="flex flex-wrap items-center gap-2 mb-2">' +
                    '<div class="font-semibold text-slate-800">' + _text(check.name || 'Budget check') + '</div>' +
                    _statusBadge(check.status) +
                    '<span class="severity-badge ' + severityClass(check.severity) + '">' + _text(check.severity || 'info') + '</span>' +
                  '</div>' +
                  '<p class="text-sm text-slate-500">' + _text(check.detail || '') + '</p>' +
                '</div>' +
              '</div>';
          }).join('') +
        '</div>' +
      '</div>'
    );
  }

  window.TPPC.pages.budget = {
    init: function (data) {
      var audit = _getAudit(data);
      window.TPPC.currentPage = 'budget';
      _renderHeader(data);
      _renderStrategies(data, audit);
      _renderImpressionShare(data, audit);
      _renderPacing(audit);
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
