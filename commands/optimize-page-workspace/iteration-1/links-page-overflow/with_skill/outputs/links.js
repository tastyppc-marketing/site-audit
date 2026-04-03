/**
 * pages/links.js — Internal Linking & Backlinks page renderer
 * Namespace: window.TPPC.pages.links
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'links';

  var _chartInstances = [];

  function init(data) {
    _destroyCharts();
    renderLinkOverview(data);
    renderOrphanPages(data);
    renderHubSpokeClusters(data);
    renderLinkDepth(data);
    renderBacklinkProfile(data);
  }

  function renderLinkOverview(data) {
    var container = document.getElementById('linkstats-content');
    if (!container) return;

    var linking = _getInternalLinking(data);
    var summary = _getLinkSummary(data);
    var hasSummary = _hasAnyValue([
      summary.totalPages,
      summary.totalInternalLinks,
      summary.orphanCount,
      summary.orphanRate,
      summary.avgInboundLinks,
      summary.avgOutboundLinks,
      summary.unreachableCount,
      summary.domain
    ]);
    var issues = _toArray(_pick(linking, ['issues'], []));
    var recommendations = _toArray(_pick(linking, ['recommendations'], []));
    var orphanTone = _orphanTone(summary.orphanRate, summary.orphanCount);

    var html = '';
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">';
    html += _statCard('Total pages', _formatNumber(summary.totalPages), summary.totalPages != null ? 'green' : 'yellow');
    html += _statCard('Total internal links', _formatNumber(summary.totalInternalLinks), summary.totalInternalLinks != null ? 'green' : 'yellow');
    html += _statCard('Orphan pages', _formatNumber(summary.orphanCount), orphanTone);
    html += _statCard('Orphan rate', _formatPercent(summary.orphanRate), orphanTone);
    html += '</div>';

    html += '<div class="grid md:grid-cols-3 gap-4 mt-8">';
    html += _detailCard('Average inbound links', _formatDecimal(summary.avgInboundLinks, 1), 'Average contextual links pointing into each page.');
    html += _detailCard('Average outbound links', _formatDecimal(summary.avgOutboundLinks, 1), 'Average internal links each page sends to other pages.');
    html += _detailCard('Unreachable pages', _formatNumber(summary.unreachableCount), 'Pages discovered but not reachable from the homepage crawl path.');
    html += '</div>';

    if (summary.domain || issues.length || recommendations.length) {
      html += '<div class="grid lg:grid-cols-3 gap-4 mt-8">';
      html += _detailCard('Analyzed domain', _displayText(summary.domain), 'Primary domain captured in the link graph result.');
      html += _listCard('Link graph issues', issues, 'No link-graph issues were attached to this result.');
      html += _listCard('Recommended fixes', recommendations, 'No site-level link recommendations were attached to this result.');
      html += '</div>';
    }

    if (!hasSummary) {
      html += '<div class="mt-8">' +
        _emptyState(
          'No internal link summary yet',
          'Populate `internalLinking.summary` or provide root `LinkGraphResult` fields so the page can show site-wide link metrics.'
        ) +
      '</div>';
    }

    container.innerHTML = html;
  }

  function renderOrphanPages(data) {
    var container = document.getElementById('orphans-content');
    if (!container) return;

    var orphans = _getOrphans(data);
    if (!orphans.length) {
      container.innerHTML = _emptyState(
        'No orphan page data available',
        'Populate `internalLinking.orphans` to surface pages with zero contextual inbound links.'
      );
      return;
    }

    var rows = orphans.map(function (item) {
      var sitemapBadge = item.isInSitemap
        ? '<span class="severity-badge info">In sitemap</span>'
        : '<span class="severity-badge medium">Not in sitemap</span>';

      return '<tr class="no-break">' +
        '<td class="url-cell"><div class="font-medium text-slate-800" style="overflow-wrap:anywhere;word-break:break-all" title="' + _esc(item.url) + '">' + _esc(_shortUrl(item.url, 64)) + '</div></td>' +
        '<td>' + _formatNumber(item.outboundLinks) + '</td>' +
        '<td>' + sitemapBadge + '</td>' +
        '<td><div class="text-sm text-slate-600 leading-relaxed">' + _esc(item.recommendation || _defaultOrphanRecommendation(item)) + '</div></td>' +
      '</tr>';
    }).join('');

    container.innerHTML =
      '<div class="bg-white border border-slate-200 rounded-xl p-5 mb-6">' +
        '<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">' +
          '<div>' +
            '<div class="text-sm font-semibold text-slate-800">Orphan pages detected</div>' +
            '<p class="text-sm text-slate-500 mt-1">These URLs need contextual links from relevant pages to improve crawlability and discoverability.</p>' +
          '</div>' +
          '<div class="text-sm text-slate-500">Total orphan pages: <span class="font-bold text-slate-800">' + _formatNumber(orphans.length) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="report-table-wrap" role="region" aria-label="Orphan pages table" tabindex="0">' +
        '<table class="report-table">' +
          '<thead>' +
            '<tr>' +
              '<th scope="col">URL</th>' +
              '<th scope="col">Outbound Links</th>' +
              '<th scope="col">Sitemap Status</th>' +
              '<th scope="col">Recommendation</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  }

  function renderHubSpokeClusters(data) {
    var container = document.getElementById('hubs-content');
    if (!container) return;

    var clusters = _getHubClusters(data);
    if (!clusters.length) {
      container.innerHTML = _emptyState(
        'No hub-and-spoke clusters available',
        'Populate `internalLinking.hubClusters` to visualize hub pages and their supporting spokes.'
      );
      return;
    }

    var maxSpokeCount = 0;
    clusters.forEach(function (cluster) {
      if ((cluster.spokeCount || 0) > maxSpokeCount) maxSpokeCount = cluster.spokeCount || 0;
    });

    var cards = clusters.map(function (cluster) {
      var spokeCount = cluster.spokeCount != null ? cluster.spokeCount : cluster.spokes.length;
      var width = maxSpokeCount > 0 ? Math.max((spokeCount / maxSpokeCount) * 100, 10) : 0;
      var visibleSpokes = cluster.spokes.slice(0, 10);
      var remaining = cluster.spokes.length - visibleSpokes.length;
      var spokeHtml = '';

      if (visibleSpokes.length) {
        spokeHtml = visibleSpokes.map(function (spoke) {
          return '<span class="url-tag inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700" style="overflow-wrap:anywhere" title="' + _esc(spoke) + '">' +
            _esc(_shortUrl(spoke, 40)) +
          '</span>';
        }).join('');
        if (remaining > 0) {
          spokeHtml += '<span class="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">+' + _formatNumber(remaining) + ' more</span>';
        }
      } else {
        spokeHtml = '<div class="text-sm text-slate-500">Spoke count supplied without individual spoke URLs.</div>';
      }

      return '<div class="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 no-break" style="min-width:0;overflow:hidden">' +
        '<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">' +
          '<div class="min-w-0">' +
            '<div class="text-xs uppercase tracking-[0.16em] text-slate-400">Hub URL</div>' +
            '<div class="mt-1 text-base font-semibold text-slate-800" style="overflow-wrap:anywhere;word-break:break-all" title="' + _esc(cluster.hubUrl) + '">' + _esc(_shortUrl(cluster.hubUrl, 64)) + '</div>' +
          '</div>' +
          '<div class="text-left sm:text-right">' +
            '<div class="text-3xl font-extrabold text-blue-600 leading-none">' + _formatNumber(spokeCount) + '</div>' +
            '<div class="text-xs uppercase tracking-[0.14em] text-slate-400 mt-1">Spokes</div>' +
          '</div>' +
        '</div>' +
        '<div class="mt-5 h-3 rounded-full bg-slate-100 overflow-hidden">' +
          '<div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style="width:' + width + '%"></div>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-3 mt-5">' +
          _miniMetric('Inbound links', _formatNumber(cluster.hubInbound)) +
          _miniMetric('Outbound links', _formatNumber(cluster.hubOutbound)) +
        '</div>' +
        '<div class="mt-5">' +
          '<div class="text-xs uppercase tracking-[0.16em] text-slate-400">Spokes visualization</div>' +
          '<div class="mt-3 flex flex-wrap gap-2">' + spokeHtml + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    container.innerHTML =
      '<div class="chart-container mb-8 no-break">' +
        '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">' +
          '<div>' +
            '<h3 class="text-base font-bold text-slate-800">Spoke count by hub</h3>' +
            '<p class="text-sm text-slate-500">The strongest hubs should concentrate authority and route it into related spokes.</p>' +
          '</div>' +
        '</div>' +
        '<div style="height:320px"><canvas id="hub-spoke-chart"></canvas></div>' +
      '</div>' +
      '<div class="grid xl:grid-cols-2 gap-6">' + cards + '</div>';

    _trackChart((window.TPPC.charts || {}).createBarChart && window.TPPC.charts.createBarChart('hub-spoke-chart', {
      horizontal: true,
      labels: clusters.map(function (cluster) { return _shortUrl(cluster.hubUrl, 42); }),
      datasets: [{
        label: 'Spokes',
        data: clusters.map(function (cluster) { return cluster.spokeCount != null ? cluster.spokeCount : cluster.spokes.length; }),
        backgroundColor: _chartColor('primary')
      }]
    }));
  }

  function renderLinkDepth(data) {
    var container = document.getElementById('depth-content');
    if (!container) return;

    var depth = _getDepthResult(data);
    var distribution = _depthDistribution(depth.depths);
    var hasDistribution = distribution.labels.length > 0;
    var reachableCount = _depthCount(depth.depths);
    var hasDepthData = _hasAnyValue([depth.maxDepth, depth.avgDepth, reachableCount, depth.unreachable.length, depth.homepage]);

    var html = '';
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">';
    html += _statCard('Max depth', _displayText(depth.maxDepth), depth.maxDepth != null ? (depth.maxDepth > 4 ? 'orange' : 'green') : 'yellow');
    html += _statCard('Average depth', _formatDecimal(depth.avgDepth, 1), depth.avgDepth != null ? (depth.avgDepth > 3 ? 'orange' : 'green') : 'yellow');
    html += _statCard('Reachable pages', _formatNumber(reachableCount), reachableCount > 0 ? 'green' : 'yellow');
    html += _statCard('Unreachable pages', _formatNumber(depth.unreachable.length), depth.unreachable.length > 0 ? 'orange' : 'green');
    html += '</div>';

    if (hasDistribution) {
      html += '<div class="chart-container no-break">' +
        '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">' +
          '<div>' +
            '<h3 class="text-base font-bold text-slate-800">Depth distribution</h3>' +
            '<p class="text-sm text-slate-500">Lower click depth usually improves crawl efficiency and keeps important pages easier to discover.</p>' +
          '</div>' +
          '<div class="text-sm text-slate-500">Homepage: <span class="font-medium text-slate-700">' + _esc(_displayText(depth.homepage)) + '</span></div>' +
        '</div>' +
        '<div style="height:320px"><canvas id="link-depth-chart"></canvas></div>' +
      '</div>';
    } else if (hasDepthData) {
      html += _emptyState(
        'No depth distribution available',
        'Populate `internalLinking.depthResult.depths` to chart how many pages sit at each click depth.'
      );
    }

    if (depth.unreachable.length) {
      html += '<div class="bg-white border border-slate-200 rounded-xl p-6 mt-6">' +
        '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">' +
          '<div>' +
            '<h3 class="text-base font-bold text-slate-800">Unreachable URLs</h3>' +
            '<p class="text-sm text-slate-500 mt-1">These pages were discovered in the data set but could not be reached by following internal links from the homepage.</p>' +
          '</div>' +
          '<div class="text-sm text-slate-500">Total: <span class="font-bold text-slate-800">' + _formatNumber(depth.unreachable.length) + '</span></div>' +
        '</div>' +
        '<div class="mt-4 flex flex-wrap gap-2">' +
          depth.unreachable.slice(0, 16).map(function (url) {
            return '<span class="url-tag inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800" style="overflow-wrap:anywhere" title="' + _esc(url) + '">' +
              _esc(_shortUrl(url, 40)) +
            '</span>';
          }).join('') +
          (depth.unreachable.length > 16
            ? '<span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">+' + _formatNumber(depth.unreachable.length - 16) + ' more</span>'
            : '') +
        '</div>' +
      '</div>';
    } else if (hasDepthData) {
      html += '<div class="bg-white border border-slate-200 rounded-xl p-6 mt-6">' +
        '<div class="text-sm font-semibold text-slate-800">Unreachable status</div>' +
        '<p class="text-sm text-slate-500 mt-1">No unreachable URLs were supplied in the depth analysis result.</p>' +
      '</div>';
    }

    if (!hasDepthData) {
      html += '<div class="mt-6">' +
        _emptyState(
          'No link depth metrics yet',
          'Populate `internalLinking.depthResult` with homepage depth data, max depth, and unreachable URLs.'
        ) +
      '</div>';
    }

    container.innerHTML = html;

    if (hasDistribution && (window.TPPC.charts || {}).createBarChart) {
      _trackChart(window.TPPC.charts.createBarChart('link-depth-chart', {
        labels: distribution.labels,
        datasets: [{
          label: 'Pages',
          data: distribution.values,
          backgroundColor: _chartColor('secondary')
        }]
      }));
    }
  }

  function renderBacklinkProfile(data) {
    var container = document.getElementById('backlinks-content');
    if (!container) return;

    var backlinkData = _getBacklinkData(data);
    var metrics = backlinkData.domainMetrics;
    var topBacklinks = backlinkData.topBacklinks;
    var competitors = backlinkData.competitorDomainMetrics;
    var hasMetrics = _hasAnyValue([
      metrics.domain,
      metrics.domainRating,
      metrics.referringDomains,
      metrics.totalBacklinks,
      metrics.trafficValue
    ]);

    var html = '';
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">';
    html += _statCard('Domain rating', _displayText(metrics.domainRating), metrics.domainRating != null ? (metrics.domainRating >= 40 ? 'green' : metrics.domainRating >= 20 ? 'yellow' : 'orange') : 'yellow');
    html += _statCard('Referring domains', _formatNumber(metrics.referringDomains), metrics.referringDomains != null ? 'green' : 'yellow');
    html += _statCard('Total backlinks', _formatNumber(metrics.totalBacklinks), metrics.totalBacklinks != null ? 'green' : 'yellow');
    html += _statCard('Traffic value', _formatCurrency(metrics.trafficValue), metrics.trafficValue != null ? 'green' : 'yellow');
    html += '</div>';

    if (metrics.domain || metrics.source) {
      html += '<div class="grid md:grid-cols-2 gap-4 mt-8">';
      html += _detailCard('Backlink source domain', _displayText(metrics.domain), 'Primary domain associated with the backlink metrics set.');
      html += _detailCard('Data source', _displayText(metrics.source), 'Source platform used to collect the backlink profile.');
      html += '</div>';
    }

    if (competitors.length) {
      var compareSet = [];
      if (metrics.domain || hasMetrics) {
        compareSet.push({
          domain: metrics.domain || ((data && data.client && (data.client.website || data.client.websiteUrl)) || 'Client domain'),
          referringDomains: metrics.referringDomains,
          domainRating: metrics.domainRating
        });
      }
      compareSet = compareSet.concat(competitors);

      html += '<div class="chart-container mt-8 no-break">' +
        '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">' +
          '<div>' +
            '<h3 class="text-base font-bold text-slate-800">Referring domains comparison</h3>' +
            '<p class="text-sm text-slate-500">External authority gaps are easiest to see when the site is compared against competitors in the same market.</p>' +
          '</div>' +
        '</div>' +
        '<div style="height:320px"><canvas id="backlink-compare-chart"></canvas></div>' +
      '</div>';

      window.setTimeout(function () {
        if ((window.TPPC.charts || {}).createBarChart) {
          _trackChart(window.TPPC.charts.createBarChart('backlink-compare-chart', {
            labels: compareSet.map(function (item) { return _shortUrl(item.domain, 28); }),
            datasets: [{
              label: 'Referring domains',
              data: compareSet.map(function (item) { return item.referringDomains || 0; }),
              backgroundColor: _chartColor('info')
            }]
          }));
        }
      }, 0);
    }

    if (topBacklinks.length) {
      html += '<div class="report-table-wrap mt-8" role="region" aria-label="Top backlinks table" tabindex="0">' +
        '<table class="report-table">' +
          '<thead>' +
            '<tr>' +
              '<th scope="col">Source URL</th>' +
              '<th scope="col">Target URL</th>' +
              '<th scope="col">Anchor Text</th>' +
              '<th scope="col">Domain Rating</th>' +
              '<th scope="col">Follow</th>' +
              '<th scope="col">First Seen</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            topBacklinks.map(function (link) {
              return '<tr class="no-break">' +
                '<td class="url-cell"><div class="font-medium text-slate-800" style="overflow-wrap:anywhere;word-break:break-all" title="' + _esc(link.sourceUrl) + '">' + _esc(_shortUrl(link.sourceUrl, 48)) + '</div></td>' +
                '<td class="url-cell"><div class="text-slate-600" style="overflow-wrap:anywhere;word-break:break-all" title="' + _esc(link.targetUrl) + '">' + _esc(_shortUrl(link.targetUrl, 48)) + '</div></td>' +
                '<td><div class="text-slate-600 leading-relaxed">' + _esc(link.anchorText || 'No anchor text provided') + '</div></td>' +
                '<td>' + _displayText(link.domainRating) + '</td>' +
                '<td>' + (link.isDofollow == null
                  ? '<span class="severity-badge info">Unknown</span>'
                  : link.isDofollow
                    ? '<span class="severity-badge low">Dofollow</span>'
                    : '<span class="severity-badge medium">Nofollow</span>') + '</td>' +
                '<td>' + _esc(_formatDate(link.firstSeen)) + '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
    } else if (hasMetrics || competitors.length) {
      html += '<div class="mt-8">' +
        _emptyState(
          'No top backlinks listed',
          'Populate `backlinks.topBacklinks` to surface the strongest incoming links and anchor text opportunities.'
        ) +
      '</div>';
    }

    if (!hasMetrics && !topBacklinks.length && !competitors.length) {
      html += '<div class="mt-8">' +
        _emptyState(
          'No backlink profile data yet',
          'Populate `backlinks.domainMetrics`, `backlinks.topBacklinks`, or `backlinks.competitorDomainMetrics` to complete this section.'
        ) +
      '</div>';
    }

    container.innerHTML = html;
  }

  function _getInternalLinking(data) {
    return (data && data.internalLinking) || {};
  }

  function _getLinkSummary(data) {
    var linking = _getInternalLinking(data);
    var summary = _pick(linking, ['summary'], linking) || {};
    var depth = _getDepthResult(data);

    return {
      domain: _pick(summary, ['domain'], _pick(linking, ['domain'], '')),
      totalPages: _toNumber(_pick(summary, ['totalPages', 'total_pages'], null)),
      totalInternalLinks: _toNumber(_pick(summary, ['totalInternalLinks', 'total_internal_links'], null)),
      orphanCount: _toNumber(_pick(summary, ['orphanCount', 'orphan_count'], null)),
      orphanRate: _toNumber(_pick(summary, ['orphanRate', 'orphan_rate'], null)),
      avgInboundLinks: _toNumber(_pick(summary, ['avgInboundLinks', 'avg_inbound_links'], null)),
      avgOutboundLinks: _toNumber(_pick(summary, ['avgOutboundLinks', 'avg_outbound_links'], null)),
      unreachableCount: _toNumber(_pick(summary, ['unreachableCount', 'unreachable_count'], depth.unreachable.length))
    };
  }

  function _getOrphans(data) {
    return _toArray(_pick(_getInternalLinking(data), ['orphans'], [])).map(function (item) {
      return {
        url: _pick(item, ['url'], ''),
        outboundLinks: _toNumber(_pick(item, ['outboundLinks', 'outbound_links'], null)),
        isInSitemap: _toBoolean(_pick(item, ['isInSitemap', 'is_in_sitemap'], null)),
        recommendation: _pick(item, ['recommendation'], '')
      };
    });
  }

  function _getHubClusters(data) {
    return _toArray(_pick(_getInternalLinking(data), ['hubClusters', 'hub_clusters'], [])).map(function (item) {
      var spokes = _toArray(_pick(item, ['spokes'], []));
      return {
        clusterId: _pick(item, ['clusterId', 'cluster_id'], ''),
        hubUrl: _pick(item, ['hubUrl', 'hub_url'], ''),
        hubInbound: _toNumber(_pick(item, ['hubInbound', 'hub_inbound'], null)),
        hubOutbound: _toNumber(_pick(item, ['hubOutbound', 'hub_outbound'], null)),
        spokes: spokes,
        spokeCount: _toNumber(_pick(item, ['spokeCount', 'spoke_count'], spokes.length))
      };
    });
  }

  function _getDepthResult(data) {
    var raw = _pick(_getInternalLinking(data), ['depthResult', 'depth_result'], {}) || {};
    return {
      homepage: _pick(raw, ['homepage'], ''),
      depths: _pick(raw, ['depths'], {}) || {},
      unreachable: _toArray(_pick(raw, ['unreachable'], [])),
      maxDepth: _toNumber(_pick(raw, ['maxDepth', 'max_depth'], null)),
      avgDepth: _toNumber(_pick(raw, ['avgDepth', 'avg_depth'], null))
    };
  }

  function _getBacklinkData(data) {
    var backlinks = (data && data.backlinks) || {};
    var domainMetrics = _pick(backlinks, ['domainMetrics', 'domain_metrics'], {}) || {};

    return {
      domainMetrics: {
        domain: _pick(domainMetrics, ['domain'], ''),
        domainRating: _toNumber(_pick(domainMetrics, ['domainRating', 'domain_rating'], null)),
        referringDomains: _toNumber(_pick(domainMetrics, ['referringDomains', 'referring_domains'], null)),
        totalBacklinks: _toNumber(_pick(domainMetrics, ['totalBacklinks', 'total_backlinks'], null)),
        trafficValue: _toNumber(_pick(domainMetrics, ['trafficValue', 'traffic_value'], null)),
        source: _pick(domainMetrics, ['source'], '')
      },
      topBacklinks: _toArray(_pick(backlinks, ['topBacklinks', 'top_backlinks'], [])).map(function (item) {
        return {
          sourceUrl: _pick(item, ['sourceUrl', 'source_url'], ''),
          targetUrl: _pick(item, ['targetUrl', 'target_url'], ''),
          anchorText: _pick(item, ['anchorText', 'anchor_text'], ''),
          domainRating: _toNumber(_pick(item, ['domainRating', 'domain_rating'], null)),
          isDofollow: _toBoolean(_pick(item, ['isDofollow', 'is_dofollow'], null)),
          firstSeen: _pick(item, ['firstSeen', 'first_seen'], '')
        };
      }),
      competitorDomainMetrics: _toArray(_pick(backlinks, ['competitorDomainMetrics', 'competitor_domain_metrics'], [])).map(function (item) {
        return {
          domain: _pick(item, ['domain'], ''),
          domainRating: _toNumber(_pick(item, ['domainRating', 'domain_rating'], null)),
          referringDomains: _toNumber(_pick(item, ['referringDomains', 'referring_domains'], null)),
          totalBacklinks: _toNumber(_pick(item, ['totalBacklinks', 'total_backlinks', 'backlinks'], null)),
          trafficValue: _toNumber(_pick(item, ['trafficValue', 'traffic_value'], null))
        };
      })
    };
  }

  function _depthDistribution(depths) {
    var counts = {};
    var key;
    for (key in (depths || {})) {
      if (Object.prototype.hasOwnProperty.call(depths, key)) {
        var value = _toNumber(depths[key]);
        if (value == null || value < 0) continue;
        var bucket = String(value);
        counts[bucket] = (counts[bucket] || 0) + 1;
      }
    }

    var sortedKeys = Object.keys(counts).sort(function (a, b) { return Number(a) - Number(b); });
    return {
      labels: sortedKeys.map(function (bucket) { return 'Depth ' + bucket; }),
      values: sortedKeys.map(function (bucket) { return counts[bucket]; })
    };
  }

  function _depthCount(depths) {
    var total = 0;
    var key;
    for (key in (depths || {})) {
      if (Object.prototype.hasOwnProperty.call(depths, key) && _toNumber(depths[key]) != null && _toNumber(depths[key]) >= 0) {
        total += 1;
      }
    }
    return total;
  }

  function _pick(obj, keys, fallback) {
    if (!obj) return fallback;
    for (var i = 0; i < keys.length; i++) {
      if (obj[keys[i]] != null) return obj[keys[i]];
    }
    return fallback;
  }

  function _toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function _toNumber(value) {
    if (value == null || value === '') return null;
    var num = Number(value);
    return isNaN(num) ? null : num;
  }

  function _toBoolean(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      var normalized = value.toLowerCase().trim();
      if (normalized === 'true' || normalized === 'yes') return true;
      if (normalized === 'false' || normalized === 'no') return false;
    }
    return Boolean(value);
  }

  function _hasAnyValue(values) {
    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      if (value == null) continue;
      if (Array.isArray(value) && !value.length) continue;
      if (typeof value === 'string' && value === '') continue;
      return true;
    }
    return false;
  }

  function _esc(value) {
    return (window.TPPC.utils && window.TPPC.utils.esc)
      ? window.TPPC.utils.esc(value)
      : String(value == null ? '' : value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
  }

  function _formatNumber(value) {
    if (value == null) return '--';
    if (window.TPPC.utils && typeof window.TPPC.utils.formatNumber === 'function') {
      return window.TPPC.utils.formatNumber(value);
    }
    return String(value);
  }

  function _formatDecimal(value, digits) {
    if (value == null) return '--';
    return Number(value).toFixed(digits != null ? digits : 1);
  }

  function _formatPercent(value) {
    if (value == null) return '--';
    var num = Number(value);
    if (isNaN(num)) return '--';
    if (num > 1) return num.toFixed(1) + '%';
    if (window.TPPC.utils && typeof window.TPPC.utils.formatPercent === 'function') {
      return window.TPPC.utils.formatPercent(num, 1);
    }
    return (num * 100).toFixed(1) + '%';
  }

  function _formatCurrency(value) {
    if (value == null) return '--';
    return '$' + Number(value).toLocaleString(undefined, {
      minimumFractionDigits: Number(value) % 1 ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function _formatDate(value) {
    if (!value) return '--';
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function _displayText(value) {
    return value == null || value === '' ? '--' : String(value);
  }

  function _shortUrl(url, maxLength) {
    var text = _displayText(url)
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '');

    if (text.length <= maxLength) return text;
    return text.slice(0, Math.max(maxLength - 1, 1)) + '...';
  }

  function _orphanTone(orphanRate, orphanCount) {
    if (orphanRate != null) {
      if (orphanRate >= 0.2) return 'red';
      if (orphanRate >= 0.1) return 'orange';
      if (orphanRate > 0) return 'yellow';
      return 'green';
    }
    if (orphanCount != null) {
      if (orphanCount >= 10) return 'red';
      if (orphanCount >= 5) return 'orange';
      if (orphanCount > 0) return 'yellow';
      return 'green';
    }
    return 'yellow';
  }

  function _defaultOrphanRecommendation(orphan) {
    if (orphan.isInSitemap === false) {
      return 'Add the page to the sitemap only if it should remain indexable, then create contextual internal links to it.';
    }
    if ((orphan.outboundLinks || 0) > 0) {
      return 'Add links from related category, service, or blog pages so this URL receives contextual inbound equity.';
    }
    return 'Review whether this page should remain live, and add contextual links from the closest topical hub if it should be kept.';
  }

  function _statCard(label, value, tone) {
    return '<div class="stat-card ' + (tone ? 'severity-' + tone : '') + ' no-break">' +
      '<div class="stat-value">' + _esc(value) + '</div>' +
      '<div class="stat-label">' + _esc(label) + '</div>' +
    '</div>';
  }

  function _detailCard(label, value, detail) {
    return '<div class="bg-white border border-slate-200 rounded-xl p-5 no-break" style="min-width:0;overflow:hidden">' +
      '<div class="text-xs uppercase tracking-[0.16em] text-slate-400">' + _esc(label) + '</div>' +
      '<div class="mt-2 text-xl sm:text-2xl font-bold text-slate-800 detail-card-value" style="overflow-wrap:anywhere;word-break:break-all">' + _esc(value) + '</div>' +
      '<p class="mt-2 text-sm text-slate-500 leading-relaxed">' + _esc(detail) + '</p>' +
    '</div>';
  }

  function _miniMetric(label, value) {
    return '<div class="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">' +
      '<div class="text-xs uppercase tracking-[0.16em] text-slate-400">' + _esc(label) + '</div>' +
      '<div class="mt-1 text-lg font-bold text-slate-800">' + _esc(value) + '</div>' +
    '</div>';
  }

  function _listCard(title, items, emptyText) {
    var content = items.length
      ? '<ul class="mt-3 space-y-2">' + items.slice(0, 6).map(function (item) {
          return '<li class="text-sm text-slate-600 leading-relaxed flex gap-2"><span class="text-blue-500 font-bold">•</span><span>' + _esc(item) + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="mt-3 text-sm text-slate-500">' + _esc(emptyText) + '</p>';

    return '<div class="bg-white border border-slate-200 rounded-xl p-5 no-break">' +
      '<div class="text-xs uppercase tracking-[0.16em] text-slate-400">' + _esc(title) + '</div>' +
      content +
    '</div>';
  }

  function _emptyState(title, message) {
    return '<div class="empty-state">' +
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12M3.75 3h16.5M3.75 3v.75m16.5-.75v11.25A2.25 2.25 0 0 1 18 16.5H6m13.5-12.75v.75M8.25 21h7.5" />' +
      '</svg>' +
      '<div class="text-base font-semibold text-slate-700">' + _esc(title) + '</div>' +
      '<p>' + _esc(message) + '</p>' +
    '</div>';
  }

  function _chartColor(name) {
    var colors = (window.TPPC.charts && window.TPPC.charts.COLORS) || {};
    return colors[name] || '#3b82f6';
  }

  function _trackChart(chart) {
    if (chart && typeof chart.destroy === 'function') {
      _chartInstances.push(chart);
    }
    return chart;
  }

  function _destroyCharts() {
    while (_chartInstances.length) {
      var chart = _chartInstances.pop();
      if (chart && typeof chart.destroy === 'function') chart.destroy();
    }
  }

  function _bootWhenReady(attempt) {
    if (window.TPPC && typeof window.TPPC.boot === 'function') {
      window.TPPC.currentPage = 'links';
      window.TPPC.boot();
      return;
    }

    if (attempt < 40) {
      window.setTimeout(function () { _bootWhenReady(attempt + 1); }, 50);
    }
  }

  window.TPPC.pages.links = {
    init: init,
    renderLinkOverview: renderLinkOverview,
    renderOrphanPages: renderOrphanPages,
    renderHubSpokeClusters: renderHubSpokeClusters,
    renderLinkDepth: renderLinkDepth,
    renderBacklinkProfile: renderBacklinkProfile
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      _bootWhenReady(0);
    });
  } else {
    _bootWhenReady(0);
  }

})();
