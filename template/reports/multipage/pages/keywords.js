/**
 * pages/keywords.js — Page 2 renderers for keyword visibility
 * Namespace: window.TPPC.pages.keywords
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'keywords';

  var EMPTY_ICONS = {
    keywords: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m21 21-4.35-4.35m1.35-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />',
    volume: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13.5h4.5V21H3v-7.5Zm6.75-6h4.5V21h-4.5V7.5Zm6.75-4.5H21V21h-4.5V3Z" />',
    organic: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9Zm-1.5-4.5c0-2.485 2.015-4.5 4.5-4.5m-6 0c0-2.485 2.015-4.5 4.5-4.5m-1.5 9V7.5" />',
    gsc: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.5 3v18m9-18v18M3 7.5h18M3 16.5h18" />',
    traffic: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5.25h18M3 12h12.75M3 18.75h7.5" />'
  };

  function init(data) {
    renderKeywordTable(data);
    renderVolumeChart(data);
    renderOrganicOverview(data);
    renderSearchConsole(data);
    renderTrafficOverview(data);
    renderRankHistory(data);
    if (window.TPPC.filters) window.TPPC.filters.init();
  }

  function renderKeywordTable(data) {
    var container = document.getElementById('rankings-content');
    var keywords = Array.isArray(data && data.keywords) ? data.keywords.filter(Boolean) : [];
    var utils = window.TPPC.utils || {};
    var rankClass = utils.rankClass || function () { return ''; };

    if (!container) return;

    if (!keywords.length) {
      container.innerHTML = buildEmptyState(
        'No keyword rankings were provided',
        'Add a keywords array to the audit data to populate the rankings table for this page.',
        EMPTY_ICONS.keywords
      );
      return;
    }

    var top10 = 0;
    var top30 = 0;
    var missed = 0;

    keywords.forEach(function (keyword) {
      var rank = parseRankNumber(keyword.clientRank);
      if (isNaN(rank)) {
        missed += 1;
        return;
      }
      if (rank <= 10) top10 += 1;
      if (rank <= 30) top30 += 1;
    });

    container.innerHTML =
      '<div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">' +
        buildStatCard(formatInteger(keywords.length), 'Tracked keywords', 'green') +
        buildStatCard(formatInteger(top10), 'Page 1 rankings', top10 > 0 ? 'green' : 'red') +
        buildStatCard(formatInteger(top30), 'Top 30 rankings', top30 > 0 ? 'orange' : 'red') +
        buildStatCard(formatInteger(missed), 'Not ranking', missed > 0 ? 'red' : 'green') +
      '</div>' +
      '<div data-filterable data-filters=\'[{"col":2,"label":"Your Rank","options":["Not found","Top 3","Top 10","11-20","21+"]},{"col":4,"label":"Intent","type":"badge"}]\'>' +
      '<div class="report-table-wrap">' +
        '<table class="report-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Keyword</th>' +
              '<th>Volume</th>' +
              '<th>Your Rank</th>' +
              '<th>Competitor</th>' +
              '<th>Top Result</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + keywords.map(function (keyword) {
            var volumeMeta = '';
            if (hasValue(keyword.difficulty)) {
              volumeMeta += ' <span class="text-slate-400 text-xs">(D: ' + esc(keyword.difficulty) + ')</span>';
            }
            if (hasValue(keyword.cpc)) {
              volumeMeta += ' <span class="text-slate-400 text-xs">' + formatCurrency(keyword.cpc) + '</span>';
            }

            return '' +
              '<tr class="no-break">' +
                '<td class="font-medium text-slate-700">' + esc(keyword.keyword || '--') + '</td>' +
                '<td>' + esc(keyword.volume || '--') + volumeMeta + '</td>' +
                '<td class="' + rankClass(keyword.clientRank) + '">' + esc(keyword.clientRank || '--') + '</td>' +
                '<td class="' + rankClass(keyword.competitorRank) + '">' + esc(keyword.competitorRank || '--') + '</td>' +
                '<td class="text-slate-500 text-xs" style="max-width: 280px; word-break: break-word;">' + esc(keyword.topResult || '--') + '</td>' +
              '</tr>';
          }).join('') + '</tbody>' +
        '</table>' +
      '</div>' +
      '</div>';
  }

  function renderVolumeChart(data) {
    var container = document.getElementById('volume-content');
    var keywords = Array.isArray(data && data.keywords) ? data.keywords.filter(Boolean) : [];
    var utils = window.TPPC.utils || {};
    var rankClass = utils.rankClass || function () { return ''; };
    var charts = window.TPPC.charts || {};
    var chartData = [];

    if (!container) return;

    keywords.forEach(function (keyword) {
      var volume = parseNumber(keyword.volume);
      if (!isNaN(volume) && volume > 0) {
        chartData.push({
          keyword: keyword.keyword || 'Keyword',
          volume: volume,
          rank: keyword.clientRank
        });
      }
    });

    chartData = chartData.slice(0, 15);

    if (!chartData.length) {
      container.innerHTML = buildEmptyState(
        'No numeric search volume data was provided',
        'Current keyword rows use qualitative labels only, so the monthly search volume chart cannot be rendered yet.',
        EMPTY_ICONS.volume
      );
      return;
    }

    container.innerHTML =
      '<div class="chart-container chart-tall no-break" style="height: ' + Math.max(360, chartData.length * 38) + 'px;">' +
        '<canvas id="keywordVolumeChart"></canvas>' +
      '</div>';

    if (typeof charts.createBarChart === 'function') {
      charts.createBarChart('keywordVolumeChart', {
        horizontal: true,
        labels: chartData.map(function (entry) { return truncateLabel(entry.keyword, 30); }),
        datasets: [{
          label: 'Monthly Search Volume',
          data: chartData.map(function (entry) { return entry.volume; }),
          backgroundColor: chartData.map(function (entry) {
            var cls = rankClass(entry.rank);
            if (cls === 'rank-green') return 'rgba(34, 197, 94, 0.75)';
            if (cls === 'rank-orange') return 'rgba(249, 115, 22, 0.75)';
            return 'rgba(239, 68, 68, 0.55)';
          })
        }]
      });
    }
  }

  function renderOrganicOverview(data) {
    var container = document.getElementById('organic-content');
    var metrics = data && data.backlinks && data.backlinks.domainMetrics ? data.backlinks.domainMetrics : null;
    var cards = [];
    var context = [];

    if (!container) return;

    if (!metrics || (!hasValue(metrics.organicKeywords) && !hasValue(metrics.organicTraffic))) {
      var apiErr = window.TPPC.utils && window.TPPC.utils.getApiErrors(data, 'domain-metrics.json');
      if (apiErr && window.TPPC.utils.renderApiErrorBanner) {
        container.innerHTML = window.TPPC.utils.renderApiErrorBanner(apiErr);
        return;
      }
      container.innerHTML = buildEmptyState(
        'No organic visibility data was provided',
        'Add backlinks.domainMetrics.organicKeywords and organicTraffic to show current organic visibility on this page.',
        EMPTY_ICONS.organic
      );
      return;
    }

    if (hasValue(metrics.organicKeywords)) {
      cards.push(buildStatCard(formatInteger(metrics.organicKeywords), 'Organic keywords', 'green'));
    }
    if (hasValue(metrics.organicTraffic)) {
      cards.push(buildStatCard(formatInteger(metrics.organicTraffic), 'Estimated organic traffic', 'orange'));
    }
    if (hasValue(metrics.trafficValue)) {
      cards.push(buildStatCard(formatCurrency(metrics.trafficValue), 'Traffic value', 'green'));
    }
    if (hasValue(metrics.referringDomains)) {
      cards.push(buildStatCard(formatInteger(metrics.referringDomains), 'Referring domains', 'orange'));
    }

    if (hasValue(metrics.domain)) {
      context.push('Domain: ' + esc(metrics.domain));
    }
    if (hasValue(metrics.source)) {
      context.push('Source: ' + esc(metrics.source));
    }

    container.innerHTML =
      '<div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">' + cards.join('') + '</div>' +
      (context.length ? (
        '<div class="bg-white border border-slate-200 rounded-xl p-5 mt-6">' +
          '<div class="text-sm font-semibold text-slate-700 mb-1">Visibility data context</div>' +
          '<p class="text-sm text-slate-500">' + context.join(' | ') + '</p>' +
        '</div>'
      ) : '');
  }

  function renderSearchConsole(data) {
    var container = document.getElementById('gsc-content');
    var gsc = data && data.searchConsoleData ? data.searchConsoleData : null;
    var topQueries = gsc && Array.isArray(gsc.topQueries) ? gsc.topQueries.filter(Boolean) : [];
    var topPages = gsc && Array.isArray(gsc.topPages) ? gsc.topPages.filter(Boolean) : [];
    var html = '';

    if (!container) return;

    if (!topQueries.length && !topPages.length) {
      container.innerHTML = buildEmptyState(
        'Search Console data is not available',
        'Add searchConsoleData.topQueries or searchConsoleData.topPages to populate this section with live search performance insights.',
        EMPTY_ICONS.gsc
      );
      return;
    }

    if (topQueries.length) {
      html += '' +
        '<div class="mb-8">' +
          '<h3 class="text-base font-bold text-slate-700 mb-3">Top Queries</h3>' +
          '<div class="report-table-wrap">' +
            '<table class="report-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Query</th>' +
                  '<th>Clicks</th>' +
                  '<th>Impressions</th>' +
                  '<th>CTR</th>' +
                  '<th>Avg Position</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' + topQueries.map(function (query) {
                return '' +
                  '<tr class="no-break">' +
                    '<td class="font-medium text-slate-700">' + esc(query.query || '--') + '</td>' +
                    '<td>' + formatInteger(query.clicks) + '</td>' +
                    '<td>' + formatInteger(query.impressions) + '</td>' +
                    '<td>' + formatPercentValue(query.ctr) + '</td>' +
                    '<td>' + formatPosition(query.position) + '</td>' +
                  '</tr>';
              }).join('') + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }

    if (topPages.length) {
      html += '' +
        '<div>' +
          '<h3 class="text-base font-bold text-slate-700 mb-3">Top Pages</h3>' +
          '<div class="report-table-wrap">' +
            '<table class="report-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Page</th>' +
                  '<th>Clicks</th>' +
                  '<th>Impressions</th>' +
                  '<th>CTR</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' + topPages.map(function (page) {
                return '' +
                  '<tr class="no-break">' +
                    '<td class="font-medium text-slate-700 text-xs" style="max-width: 340px; word-break: break-word;">' + esc(page.page || '--') + '</td>' +
                    '<td>' + formatInteger(page.clicks) + '</td>' +
                    '<td>' + formatInteger(page.impressions) + '</td>' +
                    '<td>' + formatPercentValue(page.ctr) + '</td>' +
                  '</tr>';
              }).join('') + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }

    container.innerHTML = html;
  }

  function renderTrafficOverview(data) {
    var container = document.getElementById('traffic-content');
    var traffic = data && data.trafficData ? data.trafficData : null;
    var charts = window.TPPC.charts || {};
    var palette = charts.COLORS && charts.COLORS.set ? charts.COLORS.set : ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'];
    var channels = normalizeSeries(traffic && traffic.channels);
    var devices = normalizeSeries(traffic && traffic.devices);
    var landingPages = traffic && Array.isArray(traffic.topLandingPages) ? traffic.topLandingPages.filter(Boolean) : [];
    var chartPanels = [];
    var html = '';

    if (!container) return;

    if (!channels.length && !devices.length && !landingPages.length) {
      container.innerHTML = buildEmptyState(
        'Traffic data is not available',
        'Add trafficData.channels, trafficData.devices, or trafficData.topLandingPages to populate this section.',
        EMPTY_ICONS.traffic
      );
      return;
    }

    if (channels.length) {
      chartPanels.push(
        '<div class="chart-container no-break" style="height: 320px;">' +
          '<h3 class="text-base font-bold text-slate-700 mb-4">Acquisition Channels</h3>' +
          '<canvas id="trafficChannelsChart"></canvas>' +
        '</div>'
      );
    }

    if (devices.length) {
      chartPanels.push(
        '<div class="chart-container no-break" style="height: 320px;">' +
          '<h3 class="text-base font-bold text-slate-700 mb-4">Device Breakdown</h3>' +
          '<canvas id="trafficDevicesChart"></canvas>' +
        '</div>'
      );
    }

    if (chartPanels.length > 1) {
      html += '<div class="grid md:grid-cols-2 gap-8 mb-8">' + chartPanels.join('') + '</div>';
    } else if (chartPanels.length === 1) {
      html += '<div class="mb-8">' + chartPanels[0] + '</div>';
    }

    if (landingPages.length) {
      html += '' +
        '<div>' +
          '<h3 class="text-base font-bold text-slate-700 mb-3">Top Landing Pages</h3>' +
          '<div class="report-table-wrap">' +
            '<table class="report-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Page</th>' +
                  '<th>Sessions</th>' +
                  '<th>Bounce Rate</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' + landingPages.map(function (page) {
                return '' +
                  '<tr class="no-break">' +
                    '<td class="font-medium text-slate-700 text-xs" style="max-width: 340px; word-break: break-word;">' + esc(page.page || '--') + '</td>' +
                    '<td>' + formatInteger(page.sessions) + '</td>' +
                    '<td>' + formatRate(page.bounceRate) + '</td>' +
                  '</tr>';
              }).join('') + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }

    container.innerHTML = html;

    if (channels.length && typeof charts.createDoughnutChart === 'function') {
      charts.createDoughnutChart('trafficChannelsChart', {
        labels: channels.map(function (channel) { return channel.name; }),
        data: channels.map(function (channel) { return channel.value; }),
        colors: channels.map(function (_, index) { return palette[index % palette.length]; })
      });
    }

    if (devices.length && typeof charts.createBarChart === 'function') {
      charts.createBarChart('trafficDevicesChart', {
        labels: devices.map(function (device) { return device.name; }),
        datasets: [{
          label: 'Sessions',
          data: devices.map(function (device) { return device.value; }),
          backgroundColor: devices.map(function (_, index) { return palette[index % palette.length]; })
        }]
      });
    }
  }

  function normalizeSeries(items) {
    if (!Array.isArray(items)) return [];

    return items.map(function (item) {
      return {
        name: item && item.name ? String(item.name) : '',
        value: parseNumber(item && item.value)
      };
    }).filter(function (item) {
      return item.name && !isNaN(item.value) && item.value > 0;
    });
  }

  function buildStatCard(value, label, tone) {
    return '' +
      '<div class="stat-card severity-' + tone + ' no-break">' +
        '<div class="stat-value">' + esc(value) + '</div>' +
        '<div class="stat-label">' + esc(label) + '</div>' +
      '</div>';
  }

  function buildEmptyState(title, detail, iconPath) {
    return '' +
      '<div class="empty-state">' +
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
          iconPath +
        '</svg>' +
        '<div class="text-base font-semibold text-slate-700 mb-2">' + esc(title) + '</div>' +
        '<p>' + esc(detail) + '</p>' +
      '</div>';
  }

  function truncateLabel(value, limit) {
    var str = String(value || '');
    if (str.length <= limit) return str;
    return str.substring(0, limit - 3) + '...';
  }

  function parseNumber(value) {
    if (value == null || value === '') return NaN;
    if (typeof value === 'number') return value;

    var cleaned = String(value).replace(/[$,%]/g, '').replace(/,/g, '').trim();
    if (!cleaned) return NaN;

    var parsed = Number(cleaned);
    return isNaN(parsed) ? NaN : parsed;
  }

  function parseRankNumber(value) {
    if (!hasValue(value)) return NaN;
    var match = String(value).match(/(\d+)/);
    return match ? Number(match[1]) : NaN;
  }

  function formatInteger(value) {
    var utils = window.TPPC.utils || {};
    var parsed = parseNumber(value);

    if (isNaN(parsed)) return esc(hasValue(value) ? value : '--');
    if (typeof utils.formatNumber === 'function') return utils.formatNumber(parsed);
    return parsed.toLocaleString();
  }

  function formatCurrency(value) {
    var parsed = parseNumber(value);

    if (isNaN(parsed)) return esc(hasValue(value) ? value : '--');

    return '$' + parsed.toLocaleString(undefined, {
      minimumFractionDigits: parsed % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function formatPercentValue(value) {
    if (!hasValue(value)) return '--';

    var raw = String(value).trim();
    if (raw.indexOf('%') !== -1) return esc(raw);

    var parsed = parseNumber(raw);
    if (isNaN(parsed)) return esc(raw);

    if (parsed > 1) {
      return parsed.toFixed(parsed % 1 === 0 ? 0 : 1) + '%';
    }

    return (window.TPPC.utils && typeof window.TPPC.utils.formatPercent === 'function')
      ? window.TPPC.utils.formatPercent(parsed, 1)
      : (parsed * 100).toFixed(1) + '%';
  }

  function formatPosition(value) {
    if (!hasValue(value)) return '--';

    var parsed = parseNumber(value);
    if (isNaN(parsed)) return esc(value);

    return parsed.toFixed(parsed % 1 === 0 ? 0 : 1);
  }

  function formatRate(value) {
    return formatPercentValue(value);
  }

  function hasValue(value) {
    return value != null && String(value).trim() !== '';
  }

  function esc(value) {
    if (window.TPPC.utils && typeof window.TPPC.utils.esc === 'function') {
      return window.TPPC.utils.esc(value);
    }
    if (value == null) return '';
    return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function bootPage(attempt) {
    if (window.TPPC && typeof window.TPPC.boot === 'function') {
      window.TPPC.boot();
      return;
    }

    if ((attempt || 0) < 80) {
      window.setTimeout(function () {
        bootPage((attempt || 0) + 1);
      }, 50);
    }
  }

  // -------------------------------------------------------------------------
  // Rank History — position trends over time with competitor comparison
  // -------------------------------------------------------------------------
  var _rankCharts = [];

  function renderRankHistory(data) {
    var container = document.getElementById('rank-history-content');
    if (!container) return;

    var rh = data && data.rankHistory;
    if (!rh || !rh.keywords || !Object.keys(rh.keywords).length) {
      container.innerHTML = buildEmptyState(
        'No rank tracking history available',
        'Run the rank tracker to capture SERP positions over time: python3 scripts/run_rank_tracker.py --domain example.com --keywords-file client-info.json --history rank-history.json --label "Baseline"',
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13.5h4.5V21H3v-7.5Zm6.75-6h4.5V21h-4.5V7.5Zm6.75-4.5H21V21h-4.5V3Z" />'
      );
      return;
    }

    var snapshots = rh.snapshots || [];
    var chartLabels = rh.chartLabels || snapshots;
    var clientDomain = (rh.domains && rh.domains.client) || '';
    var compDomains = (rh.domains && rh.domains.competitors) || [];
    var allDomains = [clientDomain].concat(compDomains);
    var charts = window.TPPC.charts || {};
    var COLORS = charts.COLORS || { primary: '#3b82f6', danger: '#ef4444', set: ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'] };
    var renderDelta = charts.renderPositionDelta || function () { return ''; };

    var kwEntries = Object.keys(rh.keywords);
    var html = '';

    // Summary cards
    var clientPositions = [];
    var prevPositions = [];
    kwEntries.forEach(function (kw) {
      var entry = rh.keywords[kw];
      var clientHistory = (entry.history && entry.history[clientDomain]) || {};
      var latestDate = snapshots[snapshots.length - 1];
      var prevDate = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
      var latestPos = clientHistory[latestDate];
      if (latestPos != null) clientPositions.push(latestPos);
      if (prevDate) {
        var prevPos = clientHistory[prevDate];
        if (prevPos != null) prevPositions.push(prevPos);
      }
    });

    var ranking = clientPositions.length;
    var top10 = clientPositions.filter(function (p) { return p <= 10; }).length;
    var avgPos = clientPositions.length ? Math.round(clientPositions.reduce(function (a, b) { return a + b; }, 0) / clientPositions.length * 10) / 10 : null;

    html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">';
    html += _statCard(snapshots.length, 'Snapshots', 'green');
    html += _statCard(ranking + '/' + kwEntries.length, 'Ranking', ranking > kwEntries.length / 2 ? 'green' : 'orange');
    html += _statCard(top10, 'Top 10', top10 > 0 ? 'green' : 'red');
    html += _statCard(avgPos != null ? '#' + avgPos : 'N/R', 'Avg Position', avgPos && avgPos <= 20 ? 'green' : 'orange');
    html += '</div>';

    // Summary chart — average position over time for client
    if (snapshots.length >= 2) {
      html += '<div class="chart-container mb-8" style="height:300px"><canvas id="rank-avg-chart"></canvas></div>';
    }

    // Per-keyword comparison table
    html += '<div class="report-table-wrap mb-8"><table class="report-table">';
    html += '<thead><tr><th>Keyword</th>';
    allDomains.forEach(function (d) {
      var isClient = d === clientDomain;
      html += '<th' + (isClient ? ' class="highlight-col"' : '') + '>' + esc(d) + '</th>';
    });
    if (snapshots.length >= 2) html += '<th>Change</th>';
    html += '</tr></thead><tbody>';

    kwEntries.forEach(function (kw) {
      var entry = rh.keywords[kw];
      html += '<tr>';
      html += '<td class="font-semibold text-slate-900">' + esc(kw) + '</td>';

      var latestDate = snapshots[snapshots.length - 1];
      var prevDate = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;

      allDomains.forEach(function (d) {
        var history = (entry.history && entry.history[d]) || {};
        var pos = history[latestDate];
        var isClient = d === clientDomain;
        var posText = pos != null ? '#' + pos : 'N/R';
        var rClass = pos != null && window.TPPC.utils ? window.TPPC.utils.rankClass(posText) : '';
        html += '<td' + (isClient ? ' class="highlight-col"' : '') + '>';
        html += '<span class="' + rClass + '">' + esc(posText) + '</span></td>';
      });

      if (prevDate) {
        var clientHist = (entry.history && entry.history[clientDomain]) || {};
        html += '<td>' + renderDelta(clientHist[prevDate], clientHist[latestDate]) + '</td>';
      }

      html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Per-keyword mini charts (top 5 by volume)
    var sorted = kwEntries.slice().sort(function (a, b) {
      return ((rh.keywords[b] || {}).volume || 0) - ((rh.keywords[a] || {}).volume || 0);
    });

    if (snapshots.length >= 2) {
      html += '<h3 class="text-lg font-bold text-slate-800 mb-4">Position Trends — Top Keywords</h3>';
      html += '<div class="grid md:grid-cols-2 gap-6">';
      sorted.slice(0, 6).forEach(function (kw, idx) {
        html += '<div class="chart-container" style="height:220px">' +
          '<div class="text-sm font-semibold text-slate-700 mb-2">' + esc(kw) + '</div>' +
          '<canvas id="rank-kw-chart-' + idx + '"></canvas>' +
        '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;

    // Destroy old charts
    _rankCharts.forEach(function (c) { if (c) c.destroy(); });
    _rankCharts = [];

    // Render average position chart
    if (snapshots.length >= 2 && charts.createRankLineChart) {
      var avgData = snapshots.map(function (date) {
        var positions = [];
        kwEntries.forEach(function (kw) {
          var entry = rh.keywords[kw];
          var pos = (entry.history && entry.history[clientDomain] || {})[date];
          if (pos != null) positions.push(pos);
        });
        return positions.length ? Math.round(positions.reduce(function (a, b) { return a + b; }, 0) / positions.length) : null;
      });

      var maxPos = 50;
      var allVals = avgData.filter(function (v) { return v != null; });
      if (allVals.length) maxPos = Math.min(Math.ceil(Math.max.apply(null, allVals) / 10) * 10 + 10, 100);

      var avgChart = charts.createRankLineChart('rank-avg-chart', {
        labels: chartLabels,
        maxPosition: maxPos,
        datasets: [{ label: clientDomain + ' (avg)', data: avgData, color: COLORS.primary, isClient: true }]
      });
      if (avgChart) _rankCharts.push(avgChart);
    }

    // Render per-keyword charts
    if (snapshots.length >= 2 && charts.createRankLineChart) {
      sorted.slice(0, 6).forEach(function (kw, idx) {
        var entry = rh.keywords[kw];
        var datasets = [];
        var maxP = 30;

        allDomains.forEach(function (d, di) {
          var history = (entry.history && entry.history[d]) || {};
          var lineData = snapshots.map(function (date) { return history[date] != null ? history[date] : null; });
          var isClient = d === clientDomain;
          var vals = lineData.filter(function (v) { return v != null; });
          if (vals.length) maxP = Math.max(maxP, Math.max.apply(null, vals));

          datasets.push({
            label: d,
            data: lineData,
            color: isClient ? COLORS.primary : (di === 1 ? COLORS.danger : COLORS.set[(di + 1) % COLORS.set.length]),
            isClient: isClient
          });
        });

        maxP = Math.min(Math.ceil(maxP / 10) * 10 + 5, 100);

        var chart = charts.createRankLineChart('rank-kw-chart-' + idx, {
          labels: chartLabels,
          maxPosition: maxP,
          datasets: datasets
        });
        if (chart) _rankCharts.push(chart);
      });
    }
  }

  function _statCard(value, label, tone) {
    tone = tone || 'green';
    return '<div class="stat-card severity-' + tone + ' no-break">' +
      '<div class="stat-value">' + esc(String(value)) + '</div>' +
      '<div class="stat-label">' + esc(label) + '</div>' +
    '</div>';
  }

  window.TPPC.pages.keywords = {
    init: init,
    renderKeywordTable: renderKeywordTable,
    renderVolumeChart: renderVolumeChart,
    renderOrganicOverview: renderOrganicOverview,
    renderSearchConsole: renderSearchConsole,
    renderTrafficOverview: renderTrafficOverview,
    renderRankHistory: renderRankHistory
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bootPage(0);
    });
  } else {
    bootPage(0);
  }

})();
