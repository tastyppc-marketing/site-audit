/**
 * pages/structure.js — Campaign structure page renderer
 * Namespace: window.TPPC.pages.structure
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'structure';

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

  function _tableEmpty(colspan, title, detail) {
    return '<tr><td colspan="' + colspan + '" class="p-0">' + _emptyState(title, detail) + '</td></tr>';
  }

  function _getAudit(data) {
    return data && data.ppcAudit && typeof data.ppcAudit === 'object' ? data.ppcAudit : (data || {});
  }

  function _getClient(data) {
    return data && data.client && typeof data.client === 'object' ? data.client : {};
  }

  function _getCampaigns(data, audit) {
    return _asArray(audit && audit.structure && audit.structure.campaigns).length
      ? _asArray(audit.structure.campaigns)
      : _asArray(data && data.campaigns);
  }

  function _getAdGroups(data, audit) {
    return _asArray(audit && audit.structure && audit.structure.adGroups).length
      ? _asArray(audit.structure.adGroups)
      : _asArray(data && data.adGroups);
  }

  function _getKeywords(data, audit) {
    return _asArray(audit && audit.structure && audit.structure.keywords).length
      ? _asArray(audit.structure.keywords)
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
    document.title = 'Campaign Structure - ' + String(titleBase);
  }

  function _summaryCard(value, label, helper, severity) {
    return '' +
      '<div class="stat-card severity-' + _text(severity || 'green') + ' no-break">' +
        '<div class="stat-value">' + _text(value) + '</div>' +
        '<div class="stat-label">' + _text(label) + '</div>' +
        (helper ? '<div class="mt-2 text-xs text-slate-400">' + _text(helper) + '</div>' : '') +
      '</div>';
  }

  function _buildDuplicateKeywords(keywords) {
    var groups = {};

    _asArray(keywords).forEach(function (keyword) {
      var keywordText = String(keyword && (keyword.keyword || keyword.keyword_text || keyword.keywordText || '')).trim();
      var matchType = String(keyword && (keyword.match_type || keyword.matchType || 'UNKNOWN')).trim().toUpperCase();
      var adGroup = String(keyword && (keyword.ad_group || keyword.adGroup || keyword.ad_group_name || keyword.adGroupName || '')).trim();
      var key;

      if (!keywordText) return;

      key = keywordText.toLowerCase() + '|' + matchType;
      if (!groups[key]) {
        groups[key] = {
          keyword: keywordText,
          matchType: matchType,
          count: 0,
          adGroups: {}
        };
      }

      groups[key].count += 1;
      if (adGroup) groups[key].adGroups[adGroup] = true;
    });

    return Object.keys(groups).map(function (key) {
      return {
        keyword: groups[key].keyword,
        matchType: groups[key].matchType,
        count: groups[key].count,
        adGroups: Object.keys(groups[key].adGroups)
      };
    }).filter(function (row) {
      return row.count > 1;
    }).sort(function (a, b) {
      return b.count - a.count;
    });
  }

  function _buildAdGroupCounts(adGroups, keywords) {
    var counts = {};
    var rows = [];

    _asArray(adGroups).forEach(function (adGroup) {
      var key = String(adGroup && (adGroup.id || adGroup.ad_group_id || adGroup.adGroupId || adGroup.adGroup || adGroup.ad_group || '')).trim();
      var name = String(adGroup && (adGroup.adGroup || adGroup.ad_group || adGroup.name || '')).trim();
      var label = key || name;
      if (!label) return;
      counts[label] = {
        name: name || label,
        keywordCount: 0,
        status: String(adGroup && (adGroup.status || adGroup.adGroupStatus || '')).trim() || 'Unknown'
      };
    });

    _asArray(keywords).forEach(function (keyword) {
      var id = String(keyword && (keyword.ad_group_id || keyword.adGroupId || '')).trim();
      var name = String(keyword && (keyword.ad_group || keyword.adGroup || keyword.ad_group_name || keyword.adGroupName || '')).trim();
      var label = id || name;
      if (!label) return;
      if (!counts[label]) {
        counts[label] = {
          name: name || label,
          keywordCount: 0,
          status: 'Unknown'
        };
      }
      counts[label].keywordCount += 1;
    });

    rows = Object.keys(counts).map(function (key) {
      return counts[key];
    }).sort(function (a, b) {
      return b.keywordCount - a.keywordCount;
    });

    return rows;
  }

  function _renderCampaignSummary(structure) {
    var summary = structure && structure.summary ? structure.summary : {};
    var cards = [
      _summaryCard(summary.totalCampaigns != null ? formatNumber(summary.totalCampaigns) : '0', 'Total Campaigns', '', 'green'),
      _summaryCard(summary.totalAdGroups != null ? formatNumber(summary.totalAdGroups) : '0', 'Total Ad Groups', '', 'green'),
      _summaryCard(summary.totalKeywords != null ? formatNumber(summary.totalKeywords) : '0', 'Tracked Keywords', '', 'green'),
      _summaryCard(summary.oversizedAdGroups != null ? formatNumber(summary.oversizedAdGroups) : '0', 'Oversized Ad Groups', 'Groups with more than the recommended keyword count', _toNumber(summary.oversizedAdGroups) > 0 ? 'orange' : 'green')
    ];

    _setHTML('#campaign-summary', cards.join(''));
  }

  function _renderCampaignTable(data, audit) {
    var campaigns = _getCampaigns(data, audit);

    if (!campaigns.length) {
      _setHTML('#campaigns-table-body', _tableEmpty(5, 'No campaign-level data available', 'The analyzer returns structure summaries, but it does not include a campaign list unless supporting raw campaign data is supplied.'));
      return;
    }

    _setHTML('#campaigns-table-body', campaigns.map(function (campaign) {
      return '' +
        '<tr class="no-break">' +
          '<td class="font-medium text-slate-700">' + _text(campaign.name || campaign.campaign || campaign.campaignName || campaign.id || '') + '</td>' +
          '<td>' + _text(campaign.status || 'Unknown') + '</td>' +
          '<td>' + _text(campaign.bidding_strategy_type || campaign.biddingStrategy || 'Unknown') + '</td>' +
          '<td>' + _text(campaign.daily_budget || campaign.dailyBudget || campaign.budget || campaign.amount || 'N/A') + '</td>' +
          '<td>' + _percent(campaign.search_impression_share || campaign.searchImpressionShare) + '</td>' +
        '</tr>';
    }).join(''));
  }

  function _renderAdGroupTheming(data, audit) {
    var structure = audit && audit.structure ? audit.structure : {};
    var checks = _asArray(structure.checks).filter(function (check) {
      return /^ST-/.test(String(check && check.id || '')) || String(check && check.id || '') === 'QS-08';
    });
    var adGroupRows = _buildAdGroupCounts(_getAdGroups(data, audit), _getKeywords(data, audit)).slice(0, 12);
    var checksHtml;
    var adGroupHtml;

    checksHtml = checks.length
      ? '<div class="flex flex-col gap-4">' + checks.map(function (check, index) {
          return '' +
            '<div class="issue-card no-break animate-in">' +
              '<div class="issue-number">' + _text(index + 1) + '</div>' +
              '<div class="flex-1">' +
                '<div class="flex flex-wrap items-center gap-2 mb-2">' +
                  '<div class="font-semibold text-slate-800">' + _text(check.name || check.id || 'Structure check') + '</div>' +
                  _statusBadge(check.status) +
                  '<span class="severity-badge ' + severityClass(check.severity) + '">' + _text(check.severity || 'info') + '</span>' +
                '</div>' +
                '<p class="text-sm text-slate-500">' + _text(check.detail || '') + '</p>' +
              '</div>' +
            '</div>';
        }).join('') + '</div>'
      : _emptyState('No structure checks returned', 'The structure analyzer did not emit any themed ad-group checks.');

    adGroupHtml = adGroupRows.length
      ? '' +
        '<div class="bg-white border border-slate-200 rounded-2xl overflow-hidden no-break">' +
          '<div class="px-5 py-4 border-b border-slate-200 bg-slate-50">' +
            '<div class="font-semibold text-slate-800">Largest Ad Groups by Keyword Count</div>' +
            '<div class="mt-1 text-sm text-slate-500">Use this list to spot groups that may be too broad or loosely themed.</div>' +
          '</div>' +
          '<div class="divide-y divide-slate-100">' +
            adGroupRows.map(function (row) {
              return '' +
                '<div class="px-5 py-4 flex items-center justify-between gap-4">' +
                  '<div>' +
                    '<div class="font-medium text-slate-800">' + _text(row.name) + '</div>' +
                    '<div class="text-xs uppercase tracking-[0.16em] text-slate-400 mt-1">' + _text(row.status) + '</div>' +
                  '</div>' +
                  '<div class="text-right">' +
                    '<div class="text-2xl font-bold ' + (row.keywordCount > 20 ? 'text-orange-600' : 'text-slate-800') + '">' + _text(row.keywordCount) + '</div>' +
                    '<div class="text-xs text-slate-400">keywords</div>' +
                  '</div>' +
                '</div>';
            }).join('') +
          '</div>' +
        '</div>'
      : _emptyState('No ad-group detail rows available', 'The current audit data does not include raw ad group or keyword rows to calculate keyword counts per ad group.');

    _setHTML('#adgroup-checks', checksHtml + adGroupHtml);
  }

  function _renderMatchTypes(audit) {
    var structure = audit && audit.structure ? audit.structure : {};
    var distribution = structure && structure.summary ? (structure.summary.matchTypeDistribution || {}) : {};
    var labels = Object.keys(distribution);
    var total = 0;

    labels.forEach(function (label) {
      total += _toNumber(distribution[label]) || 0;
    });

    if (!labels.length || !total) {
      var canvasWrap = $('#matchtype-chart');
      if (canvasWrap && canvasWrap.parentNode) {
        canvasWrap.parentNode.innerHTML = _emptyState('No match type distribution available', 'The structure summary did not include keyword counts by match type.');
      }
      _setHTML('#matchtype-breakdown', _emptyState('No match type breakdown', 'Provide structure summary data or raw keyword rows to populate this section.'));
      return;
    }

    if (window.TPPC.charts && typeof window.TPPC.charts.createDoughnutChart === 'function') {
      window.TPPC.charts.createDoughnutChart('matchtype-chart', {
        labels: labels,
        data: labels.map(function (label) { return _toNumber(distribution[label]) || 0; })
      });
    }

    _setHTML('#matchtype-breakdown', labels.map(function (label) {
      var value = _toNumber(distribution[label]) || 0;
      var pct = total ? ((value / total) * 100).toFixed(1) : '0.0';
      return _summaryCard(formatNumber(value), label + ' Match', pct + '% of tracked keywords', label === 'BROAD' ? (pct > 30 ? 'red' : 'orange') : 'green');
    }).join(''));
  }

  function _renderDuplicates(data, audit) {
    var duplicates = _buildDuplicateKeywords(_getKeywords(data, audit));
    var structure = audit && audit.structure ? audit.structure : {};
    var duplicateCheck = _asArray(structure.checks).filter(function (check) {
      return check && check.id === 'ST-09';
    })[0];

    if (!duplicates.length) {
      if (duplicateCheck && _toNumber(structure.summary && structure.summary.duplicateKeywords) > 0) {
        _setHTML('#duplicates-table-body',
          '<tr class="no-break">' +
            '<td class="font-medium text-slate-700">Duplicate combinations detected</td>' +
            '<td>N/A</td>' +
            '<td>' + _text(structure.summary.duplicateKeywords) + '</td>' +
            '<td>' + _text(duplicateCheck.detail || 'Details unavailable in analyzer output') + '</td>' +
          '</tr>'
        );
        return;
      }

      _setHTML('#duplicates-table-body', _tableEmpty(4, 'No duplicate keywords listed', 'The current data set does not include raw keyword rows with enough detail to enumerate duplicate keyword and match-type combinations.'));
      return;
    }

    _setHTML('#duplicates-table-body', duplicates.map(function (row) {
      return '' +
        '<tr class="no-break">' +
          '<td class="font-medium text-slate-700">' + _text(row.keyword) + '</td>' +
          '<td>' + _text(row.matchType) + '</td>' +
          '<td>' + _text(row.count) + '</td>' +
          '<td>' + _text(row.adGroups.join(', ') || 'N/A') + '</td>' +
        '</tr>';
    }).join(''));
  }

  window.TPPC.pages.structure = {
    init: function (data) {
      var audit = _getAudit(data);
      window.TPPC.currentPage = 'structure';
      _renderHeader(data);
      _renderCampaignSummary(audit.structure || {});
      _renderCampaignTable(data, audit);
      _renderAdGroupTheming(data, audit);
      _renderMatchTypes(audit);
      _renderDuplicates(data, audit);
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
