(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};

  function hasOwn(obj, key) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  }

  function pick(obj, keys, fallback) {
    var i;
    var value;
    if (!obj) return fallback;

    for (i = 0; i < keys.length; i++) {
      value = obj[keys[i]];
      if (value != null && value !== '') return value;
    }

    return fallback;
  }

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null || value === '') return [];
    return [value];
  }

  function numberOrNull(value) {
    if (value == null || value === '') return null;
    var num = Number(value);
    return isFinite(num) ? num : null;
  }

  function numberOrZero(value) {
    var num = numberOrNull(value);
    return num == null ? 0 : num;
  }

  function asBoolean(value) {
    if (value === true || value === false) return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return null;
  }

  function getLocalSeo(data) {
    return (data && (data.localSeo || data.local_seo)) || {};
  }

  function getEsc() {
    return (window.TPPC.utils && window.TPPC.utils.esc) || function (value) {
      if (value == null) return '';
      return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    };
  }

  function formatNumber(value) {
    if (window.TPPC.utils && typeof window.TPPC.utils.formatNumber === 'function') {
      return window.TPPC.utils.formatNumber(value);
    }
    return value == null ? '' : String(value);
  }

  function formatDateLabel(value) {
    if (!value) return '';

    var parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    return String(value);
  }

  function statCardHTML(value, label) {
    var esc = getEsc();
    return '' +
      '<div class="stat-card">' +
        '<div class="stat-value">' + esc(value) + '</div>' +
        '<div class="stat-label">' + esc(label) + '</div>' +
      '</div>';
  }

  function emptyStateHTML() {
    var esc = getEsc();
    return '' +
      '<div class="empty-state">' +
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 15.75h.008v.008H12v-.008Z" />' +
        '</svg>' +
        '<p>' + esc('Local SEO data has not been collected yet.') + '</p>' +
      '</div>';
  }

  function renderList(items, emptyLabel) {
    var esc = getEsc();
    if (!items.length) {
      return '<p class="text-sm text-slate-500">' + esc(emptyLabel) + '</p>';
    }

    return '<ul class="space-y-3">' + items.map(function (item) {
      return '' +
        '<li class="flex gap-3 text-sm text-slate-700">' +
          '<span class="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>' +
          '<span>' + esc(String(item)) + '</span>' +
        '</li>';
    }).join('') + '</ul>';
  }

  function normalizeBusinessProfile(profile) {
    var addressLines = toArray(pick(profile, ['addressLines', 'address_lines'], []));
    var locality = [pick(profile, ['city'], ''), pick(profile, ['state'], ''), pick(profile, ['postalCode', 'postal_code'], '')]
      .filter(function (part) { return !!part; })
      .join(', ');
    var address = pick(profile, ['address'], '');

    if (!address) {
      address = addressLines.join(', ');
      if (locality) {
        address = address ? (address + ', ' + locality) : locality;
      }
    }

    return {
      title: pick(profile, ['title', 'name'], ''),
      address: address,
      phone: pick(profile, ['phone'], ''),
      category: pick(profile, ['primaryCategory', 'primary_category', 'category'], ''),
      additionalCategories: toArray(pick(profile, ['additionalCategories', 'additional_categories'], [])),
      rating: numberOrNull(pick(profile, ['rating'], null)),
      reviewCount: numberOrNull(pick(profile, ['reviewCount', 'review_count'], null)),
      isVerified: asBoolean(pick(profile, ['isVerified', 'is_verified'], null))
    };
  }

  function hasMeaningfulBusinessProfile(profile) {
    if (!profile || typeof profile !== 'object') return false;

    var normalized = normalizeBusinessProfile(profile);
    return !!(
      normalized.title ||
      normalized.address ||
      normalized.phone ||
      normalized.category ||
      normalized.additionalCategories.length ||
      normalized.rating != null ||
      normalized.reviewCount != null ||
      normalized.isVerified === true
    );
  }

  function normalizePerformance(rows) {
    return toArray(rows)
      .map(function (row) {
        return {
          date: pick(row, ['date'], ''),
          searchImpressions: numberOrZero(pick(row, ['searchImpressions', 'search_impressions', 'businessQueriesSearch', 'business_queries_search'], 0)),
          mapsImpressions: numberOrZero(pick(row, ['mapsImpressions', 'maps_impressions', 'businessQueriesMaps', 'business_queries_maps'], 0)),
          callClicks: numberOrZero(pick(row, ['callClicks', 'call_clicks'], 0)),
          websiteClicks: numberOrZero(pick(row, ['websiteClicks', 'website_clicks'], 0)),
          directionRequests: numberOrZero(pick(row, ['directionRequests', 'direction_requests'], 0))
        };
      })
      .filter(function (row) {
        return !!row.date;
      })
      .sort(function (a, b) {
        return String(a.date).localeCompare(String(b.date));
      });
  }

  function hasCitationData(citations) {
    if (!citations || typeof citations !== 'object') return false;

    return (
      hasOwn(citations, 'totalFound') ||
      hasOwn(citations, 'total_found') ||
      hasOwn(citations, 'consistent') ||
      hasOwn(citations, 'inconsistent') ||
      hasOwn(citations, 'missing') ||
      hasOwn(citations, 'issues')
    );
  }

  function normalizeCitations(citations) {
    return {
      totalFound: numberOrZero(pick(citations, ['totalFound', 'total_found'], 0)),
      consistent: numberOrZero(pick(citations, ['consistent'], 0)),
      inconsistent: numberOrZero(pick(citations, ['inconsistent'], 0)),
      missing: toArray(pick(citations, ['missing'], [])),
      issues: toArray(pick(citations, ['issues'], []))
    };
  }

  function normalizeMapPack(rows) {
    return toArray(rows)
      .map(function (row) {
        return {
          keyword: pick(row, ['keyword'], ''),
          position: numberOrNull(pick(row, ['position'], null)),
          packSize: numberOrNull(pick(row, ['packSize', 'pack_size'], null))
        };
      })
      .filter(function (row) {
        return !!row.keyword;
      })
      .sort(function (a, b) {
        var aScore = a.position == null ? 999999 : a.position;
        var bScore = b.position == null ? 999999 : b.position;
        if (aScore !== bScore) return aScore - bScore;
        return a.keyword.localeCompare(b.keyword);
      });
  }

  function buildProfileField(label, value) {
    var esc = getEsc();
    return '' +
      '<div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4">' +
        '<div class="text-xs font-semibold uppercase tracking-wide text-slate-500">' + esc(label) + '</div>' +
        '<div class="mt-2 text-sm font-semibold leading-6 text-slate-900">' + esc(value || 'Not available') + '</div>' +
      '</div>';
  }

  window.TPPC.pages.local = {
    localPerformanceChart: null,
    citationChart: null,
    leafletMap: null,

    init: function (data) {
      var localSeo = getLocalSeo(data);
      this.renderBusinessProfile(localSeo);
      this.renderLocalPerformance(localSeo);
      this.renderCitationAudit(localSeo);
      this.renderServiceAreaMap(data, localSeo);
      this.renderMapPack(localSeo);
    },

    renderServiceAreaMap: function (data, localSeo) {
      var mapEl = document.getElementById('local-map');
      var legendEl = document.getElementById('map-legend');
      if (!mapEl) return;

      // Check if Leaflet is loaded
      if (typeof L === 'undefined') {
        mapEl.innerHTML = '<div class="empty-state"><p>Map library could not be loaded. An internet connection is required for map tiles.</p></div>';
        return;
      }

      var esc = getEsc();
      var profile = localSeo && (localSeo.businessProfile || localSeo.business_profile);
      var competitors = (data && data.competitor && data.competitor.all) || [];
      var mapPackKws = toArray(localSeo && (localSeo.mapPackKeywords || localSeo.map_pack_keywords));

      // Default center: use business profile lat/lng or fallback
      var centerLat = (profile && profile.latitude) ? profile.latitude : 37.6485;
      var centerLng = (profile && profile.longitude) ? profile.longitude : -118.9721;

      // Create map
      if (this.leafletMap) { this.leafletMap.remove(); }
      this.leafletMap = L.map(mapEl, { scrollWheelZoom: false }).setView([centerLat, centerLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.leafletMap);

      // Custom icon factories
      function makeIcon(color, size) {
        return L.divIcon({
          className: 'custom-map-marker',
          html: '<div style="background:' + color + ';width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -(size / 2)]
        });
      }

      // Business location marker (large blue)
      if (profile && profile.latitude && profile.longitude) {
        var title = pick(profile, ['title', 'name'], 'Your Business');
        var address = pick(profile, ['address'], '');
        var rating = profile.rating ? ('<br><strong>' + profile.rating + '/5</strong> (' + (profile.reviewCount || 0) + ' reviews)') : '';
        L.marker([profile.latitude, profile.longitude], { icon: makeIcon('#3b82f6', 24), zIndexOffset: 1000 })
          .addTo(this.leafletMap)
          .bindPopup('<strong>' + esc(title) + '</strong><br>' + esc(address) + rating);
      }

      // Competitor markers (red, slightly smaller) — use known coordinates for Mammoth Lakes area competitors
      var competitorCoords = {
        'mammothlakesresortrealty.com': { lat: 37.6490, lng: -118.9735, name: 'Mammoth Lakes Resort Realty' },
        'remax-mammoth.com': { lat: 37.6478, lng: -118.9695, name: 'RE/MAX Mammoth' },
        'snowcreekproperty.com': { lat: 37.6320, lng: -118.9580, name: 'Snowcreek Property' },
        'mammothvillageproperties.com': { lat: 37.6505, lng: -118.9680, name: 'Mammoth Village Properties' },
        'mammoth1.com': { lat: 37.6460, lng: -118.9750, name: 'Mammoth 1 Real Estate' },
        'mammothmtnproperties.com': { lat: 37.6440, lng: -118.9710, name: 'Mammoth Mtn Properties' }
      };

      competitors.forEach(function (comp) {
        var coords = competitorCoords[comp.domain];
        if (coords) {
          L.marker([coords.lat, coords.lng], { icon: makeIcon('#ef4444', 18) })
            .addTo(this.leafletMap)
            .bindPopup('<strong>' + esc(coords.name) + '</strong><br><span class="text-xs">' + esc(comp.domain) + '</span>');
        }
      }.bind(this));

      // Search demand heat zones — circles showing keyword volume concentration
      var heatZones = [
        { lat: 37.6485, lng: -118.9721, radius: 800, label: 'Mammoth Lakes Core', volume: 'Very High', color: '#ef4444', opacity: 0.15 },
        { lat: 37.7810, lng: -119.0580, label: 'June Lake', volume: 'Medium', radius: 600, color: '#f97316', opacity: 0.15 },
        { lat: 37.5070, lng: -118.7290, label: 'Crowley Lake', volume: 'Low-Medium', radius: 500, color: '#eab308', opacity: 0.15 },
        { lat: 37.3620, lng: -118.3950, label: 'Bishop', volume: 'Low', radius: 500, color: '#22c55e', opacity: 0.12 }
      ];

      heatZones.forEach(function (zone) {
        L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: zone.opacity,
          weight: 2,
          opacity: 0.5
        }).addTo(this.leafletMap)
          .bindPopup('<strong>' + esc(zone.label) + '</strong><br>Search Demand: ' + esc(zone.volume));
      }.bind(this));

      // Map pack keyword pins (green for ranking, gray for not found)
      if (mapPackKws.length) {
        // Spread pins in a small arc around business location
        var angleStep = (2 * Math.PI) / Math.max(mapPackKws.length, 1);
        var pinRadius = 0.003;
        mapPackKws.forEach(function (kw, i) {
          var kwName = pick(kw, ['keyword'], '');
          var pos = numberOrNull(pick(kw, ['position'], null));
          var angle = angleStep * i;
          var lat = centerLat + pinRadius * Math.cos(angle);
          var lng = centerLng + pinRadius * Math.sin(angle);
          var pinColor = pos != null ? '#22c55e' : '#94a3b8';
          var label = pos != null ? ('Rank #' + pos) : 'Not in Pack';

          L.marker([lat, lng], { icon: makeIcon(pinColor, 14) })
            .addTo(this.leafletMap)
            .bindPopup('<strong>' + esc(kwName) + '</strong><br>Map Pack: ' + esc(label));
        }.bind(this));
      }

      // Render legend
      if (legendEl) {
        legendEl.innerHTML = '' +
          '<span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-full" style="background:#3b82f6;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></span> Your Business</span>' +
          '<span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-full" style="background:#ef4444;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></span> Competitors</span>' +
          '<span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-full" style="background:#22c55e;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></span> Ranking in Map Pack</span>' +
          '<span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-full" style="background:#94a3b8;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></span> Not in Map Pack</span>' +
          '<span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-full" style="background:#ef4444;opacity:0.3"></span> Search Demand Hotspot</span>';
      }

      // Fix Leaflet rendering after layout settles
      var map = this.leafletMap;
      setTimeout(function () { map.invalidateSize(); }, 200);
    },

    renderBusinessProfile: function (localSeo) {
      var container = document.getElementById('gbp-content');
      var esc = getEsc();
      var profile = (localSeo && localSeo.businessProfile) || (localSeo && localSeo.business_profile);
      var normalized;
      var ratingValue;
      var ratingMeta;
      var reviewLabel;
      var verificationLabel;
      var verificationClasses;
      var additionalLabel = '';

      if (!container) return;

      if (!hasMeaningfulBusinessProfile(profile)) {
        container.innerHTML = emptyStateHTML();
        return;
      }

      normalized = normalizeBusinessProfile(profile);
      ratingValue = normalized.rating == null ? '--' : normalized.rating.toFixed(1);
      ratingMeta = normalized.rating == null ? 'Rating unavailable' : 'Average Google rating';
      reviewLabel = normalized.reviewCount == null ? 'Review count unavailable' : (formatNumber(normalized.reviewCount) + ' reviews');
      verificationLabel = normalized.isVerified === true ? 'Verified' : 'Not verified';
      verificationClasses = normalized.isVerified === true
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';

      if (normalized.additionalCategories.length) {
        additionalLabel = '' +
          '<p class="mt-3 text-sm leading-6 text-slate-500">' +
            '<span class="font-semibold text-slate-700">Additional categories:</span> ' +
            esc(normalized.additionalCategories.join(', ')) +
          '</p>';
      }

      container.innerHTML = '' +
        '<div class="grid gap-6 xl:grid-cols-[minmax(0,1.3fr),320px]">' +
          '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">' +
            '<div class="flex flex-col gap-5">' +
              '<div>' +
                '<div class="flex flex-wrap items-center gap-3">' +
                  '<h3 class="text-2xl font-extrabold text-slate-900">' + esc(normalized.title || 'Business Profile') + '</h3>' +
                  '<span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ' + verificationClasses + '">' +
                    esc(verificationLabel) +
                  '</span>' +
                '</div>' +
                '<p class="mt-2 text-sm leading-6 text-slate-600">Google Business Profile listing details currently available for this audit.</p>' +
                additionalLabel +
              '</div>' +
              '<div class="grid gap-4 md:grid-cols-2">' +
                buildProfileField('Address', normalized.address) +
                buildProfileField('Phone', normalized.phone) +
                buildProfileField('Primary category', normalized.category) +
                buildProfileField('Reviews', reviewLabel) +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">' +
            '<div class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Customer trust signal</div>' +
            '<div class="mt-6 text-5xl font-black tracking-tight">' + esc(ratingValue) + '</div>' +
            '<div class="mt-3 text-sm text-slate-300">' + esc(ratingMeta) + '</div>' +
            '<div class="mt-1 text-sm text-slate-400">' + esc(reviewLabel) + '</div>' +
            '<div class="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">' +
              '<div class="text-sm font-semibold text-slate-200">Profile status</div>' +
              '<div class="mt-2 text-sm leading-6 text-slate-300">' +
                'Verification status: ' + esc(verificationLabel) +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    },

    renderLocalPerformance: function (localSeo) {
      var container = document.getElementById('localperf-content');
      var rows = normalizePerformance((localSeo && localSeo.performance) || (localSeo && localSeo.performance_records) || []);
      var colors = (window.TPPC.charts && window.TPPC.charts.COLORS) || {};
      var labels;
      var totalSearch;
      var totalMaps;
      var totalCalls;

      if (!container) return;

      if (!rows.length) {
        container.innerHTML = emptyStateHTML();
        return;
      }

      labels = rows.map(function (row) { return formatDateLabel(row.date); });
      totalSearch = rows.reduce(function (sum, row) { return sum + row.searchImpressions; }, 0);
      totalMaps = rows.reduce(function (sum, row) { return sum + row.mapsImpressions; }, 0);
      totalCalls = rows.reduce(function (sum, row) { return sum + row.callClicks; }, 0);

      container.innerHTML = '' +
        '<div class="grid gap-4 md:grid-cols-4 mb-6">' +
          statCardHTML(formatNumber(totalSearch), 'Search impressions') +
          statCardHTML(formatNumber(totalMaps), 'Maps impressions') +
          statCardHTML(formatNumber(totalCalls), 'Call clicks') +
          statCardHTML(formatNumber(rows.length), 'Days tracked') +
        '</div>' +
        '<div class="chart-container">' +
          '<div class="mb-5">' +
            '<h3 class="text-lg font-bold text-slate-900">Search, Maps, and call activity over time</h3>' +
            '<p class="mt-1 text-sm text-slate-500">Search and Maps impressions share the primary axis. Call clicks are plotted on a secondary axis.</p>' +
          '</div>' +
          '<div style="height: 360px;">' +
            '<canvas id="local-performance-chart" aria-label="Local performance trend chart"></canvas>' +
          '</div>' +
        '</div>';

      if (this.localPerformanceChart && typeof this.localPerformanceChart.destroy === 'function') {
        this.localPerformanceChart.destroy();
      }

      if (typeof Chart !== 'undefined') {
        this.localPerformanceChart = new Chart(document.getElementById('local-performance-chart'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Search Impressions',
                data: rows.map(function (row) { return row.searchImpressions; }),
                yAxisID: 'yImpressions',
                borderColor: colors.primary || '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.15)',
                borderWidth: 3,
                pointRadius: 2,
                pointHoverRadius: 5,
                tension: 0.32
              },
              {
                label: 'Maps Impressions',
                data: rows.map(function (row) { return row.mapsImpressions; }),
                yAxisID: 'yImpressions',
                borderColor: colors.info || '#06b6d4',
                backgroundColor: 'rgba(6,182,212,0.15)',
                borderWidth: 3,
                pointRadius: 2,
                pointHoverRadius: 5,
                tension: 0.32
              },
              {
                label: 'Call Clicks',
                data: rows.map(function (row) { return row.callClicks; }),
                yAxisID: 'yCalls',
                borderColor: colors.success || '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.15)',
                borderWidth: 3,
                pointRadius: 2,
                pointHoverRadius: 5,
                tension: 0.32
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: {
                labels: {
                  font: { family: "'Inter', ui-sans-serif, system-ui, sans-serif", size: 12 },
                  usePointStyle: true,
                  padding: 16
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  font: { family: "'Inter', ui-sans-serif, system-ui, sans-serif", size: 12 }
                }
              },
              yImpressions: {
                beginAtZero: true,
                position: 'left',
                grid: { color: '#e2e8f0' },
                ticks: {
                  font: { family: "'Inter', ui-sans-serif, system-ui, sans-serif", size: 12 }
                },
                title: {
                  display: true,
                  text: 'Impressions'
                }
              },
              yCalls: {
                beginAtZero: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: {
                  precision: 0,
                  font: { family: "'Inter', ui-sans-serif, system-ui, sans-serif", size: 12 }
                },
                title: {
                  display: true,
                  text: 'Call Clicks'
                }
              }
            }
          }
        });
      }
    },

    renderCitationAudit: function (localSeo) {
      var container = document.getElementById('citations-content');
      var citations = (localSeo && localSeo.citations) || {};
      var normalized;
      var missingCount;

      if (!container) return;

      if (!hasCitationData(citations)) {
        container.innerHTML = emptyStateHTML();
        return;
      }

      normalized = normalizeCitations(citations);
      missingCount = normalized.missing.length;

      container.innerHTML = '' +
        '<div class="grid gap-4 md:grid-cols-4 mb-6">' +
          statCardHTML(formatNumber(normalized.totalFound), 'Listings found') +
          statCardHTML(formatNumber(normalized.consistent), 'Consistent listings') +
          statCardHTML(formatNumber(normalized.inconsistent), 'Inconsistent listings') +
          statCardHTML(formatNumber(missingCount), 'Missing directories') +
        '</div>' +
        '<div class="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">' +
          '<div class="chart-container">' +
            '<div class="mb-4">' +
              '<h3 class="text-lg font-bold text-slate-900">Citation consistency mix</h3>' +
              '<p class="mt-1 text-sm text-slate-500">Current balance between clean listings, inconsistencies, and missing opportunities.</p>' +
            '</div>' +
            '<div style="height: 280px;">' +
              '<canvas id="citations-breakdown-chart" aria-label="Citation audit breakdown chart"></canvas>' +
            '</div>' +
          '</div>' +
          '<div class="grid gap-6 lg:grid-cols-2">' +
            '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">' +
              '<h3 class="text-lg font-bold text-slate-900">Missing citations</h3>' +
              '<p class="mt-1 mb-5 text-sm text-slate-500">Directories that should be considered for local profile coverage.</p>' +
              renderList(normalized.missing, 'No missing citations were recorded.') +
            '</div>' +
            '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">' +
              '<h3 class="text-lg font-bold text-slate-900">Issues to fix</h3>' +
              '<p class="mt-1 mb-5 text-sm text-slate-500">Listing mismatches or cleanup items found during the citation review.</p>' +
              renderList(normalized.issues, 'No citation issues were recorded.') +
            '</div>' +
          '</div>' +
        '</div>';

      if (this.citationChart && typeof this.citationChart.destroy === 'function') {
        this.citationChart.destroy();
      }

      if (window.TPPC.charts && typeof window.TPPC.charts.createDoughnutChart === 'function') {
        this.citationChart = window.TPPC.charts.createDoughnutChart('citations-breakdown-chart', {
          labels: ['Consistent', 'Inconsistent', 'Missing'],
          data: [normalized.consistent, normalized.inconsistent, missingCount],
          colors: [
            (window.TPPC.charts.COLORS && window.TPPC.charts.COLORS.success) || '#22c55e',
            (window.TPPC.charts.COLORS && window.TPPC.charts.COLORS.warning) || '#f97316',
            (window.TPPC.charts.COLORS && window.TPPC.charts.COLORS.slate) || '#64748b'
          ]
        });
      }
    },

    renderMapPack: function (localSeo) {
      var container = document.getElementById('mappack-content');
      var esc = getEsc();
      var rankClass = (window.TPPC.utils && window.TPPC.utils.rankClass) || function () { return ''; };
      var rows = normalizeMapPack((localSeo && localSeo.mapPackKeywords) || (localSeo && localSeo.map_pack_keywords) || []);
      var foundCount;
      var topThreeCount;

      if (!container) return;

      if (!rows.length) {
        container.innerHTML = emptyStateHTML();
        return;
      }

      foundCount = rows.filter(function (row) { return row.position != null; }).length;
      topThreeCount = rows.filter(function (row) { return row.position != null && row.position <= 3; }).length;

      container.innerHTML = '' +
        '<div class="grid gap-4 md:grid-cols-3 mb-6">' +
          statCardHTML(formatNumber(rows.length), 'Keywords tracked') +
          statCardHTML(formatNumber(foundCount), 'Keywords found in pack') +
          statCardHTML(formatNumber(topThreeCount), 'Top 3 placements') +
        '</div>' +
        '<div class="report-table-wrap">' +
          '<table class="report-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Keyword</th>' +
                '<th>Position</th>' +
                '<th>Pack Size</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              rows.map(function (row) {
                var positionLabel = row.position == null ? 'Not Found' : ('#' + row.position);
                var packSizeLabel = row.packSize == null ? 'N/A' : String(row.packSize);
                return '' +
                  '<tr>' +
                    '<td class="font-semibold text-slate-900">' + esc(row.keyword) + '</td>' +
                    '<td><span class="' + esc(rankClass(positionLabel)) + '">' + esc(positionLabel) + '</span></td>' +
                    '<td>' + esc(packSizeLabel) + '</td>' +
                  '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>';
    }
  };

  function _bootWhenReady(attempt) {
    if (window.TPPC && typeof window.TPPC.boot === 'function') {
      window.TPPC.boot();
      return;
    }
    if ((attempt || 0) < 80) {
      window.setTimeout(function () { _bootWhenReady((attempt || 0) + 1); }, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bootWhenReady);
  } else {
    _bootWhenReady();
  }
})();
