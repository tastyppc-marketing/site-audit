/**
 * shared/charts.js — TastyPPC Chart.js helpers
 * Namespace: window.TPPC.charts
 * Requires: Chart.js loaded before this file
 *
 * Optimizations:
 *   - devicePixelRatio capped at 2 to prevent heavy rendering on 3x displays
 *   - IntersectionObserver-based lazy rendering: charts only initialize when
 *     their container scrolls into view
 *   - Responsive font sizing for mobile screens
 *   - Chart.js resize throttle for smoother window resizing
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  // -------------------------------------------------------------------------
  // Color palette
  // -------------------------------------------------------------------------
  var COLORS = {
    primary: '#3b82f6',
    secondary: '#6366f1',
    success: '#22c55e',
    warning: '#f97316',
    danger: '#ef4444',
    info: '#06b6d4',
    slate: '#64748b',
    set: ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#64748b']
  };

  // -------------------------------------------------------------------------
  // Performance: cap pixel ratio and detect mobile
  // -------------------------------------------------------------------------
  var MAX_DPR = 2;
  var effectiveDPR = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  var isMobile = window.innerWidth < 768;

  // -------------------------------------------------------------------------
  // Default Chart.js options helpers
  // -------------------------------------------------------------------------
  var DEFAULT_FONT = {
    family: "'Inter', ui-sans-serif, system-ui, sans-serif",
    size: isMobile ? 10 : 12
  };

  // Set global Chart.js defaults for performance
  if (typeof Chart !== 'undefined') {
    Chart.defaults.devicePixelRatio = effectiveDPR;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    // Throttle resize to avoid excessive redraws
    Chart.defaults.resizeDelay = 100;
    // Disable animations on mobile for better performance
    if (isMobile) {
      Chart.defaults.animation = false;
    }
  }

  function _baseOptions(overrides) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: effectiveDPR,
      plugins: {
        legend: {
          labels: {
            font: DEFAULT_FONT,
            usePointStyle: true,
            padding: isMobile ? 10 : 16
          }
        }
      }
    }, overrides || {});
  }

  // -------------------------------------------------------------------------
  // Lazy chart rendering via IntersectionObserver
  // -------------------------------------------------------------------------
  var _pendingCharts = [];
  var _observer = null;

  function _initObserver() {
    if (_observer) return;
    if (!('IntersectionObserver' in window)) {
      // Fallback: render all pending charts immediately
      _pendingCharts.forEach(function (item) { item.render(); });
      _pendingCharts = [];
      return;
    }

    _observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = -1;
        for (var i = 0; i < _pendingCharts.length; i++) {
          if (_pendingCharts[i].element === entry.target || _pendingCharts[i].element.contains(entry.target)) {
            idx = i;
            break;
          }
        }
        if (idx >= 0) {
          _pendingCharts[idx].render();
          _observer.unobserve(entry.target);
          _pendingCharts.splice(idx, 1);
        }
      });
    }, {
      rootMargin: '200px 0px',  // Start rendering 200px before visible
      threshold: 0.01
    });
  }

  /**
   * Schedule a chart to be lazily rendered when its container enters the viewport.
   * @param {string} canvasId - The canvas element ID
   * @param {Function} renderFn - Function that creates and returns the Chart instance
   * @returns {null} - The chart will be created later when visible
   */
  function _lazyRender(canvasId, renderFn) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    _initObserver();

    // If the canvas is already in the viewport (above the fold), render immediately
    var rect = canvas.getBoundingClientRect();
    var isVisible = rect.top < window.innerHeight + 200 && rect.bottom > -200;

    if (isVisible || !_observer) {
      return renderFn();
    }

    var container = canvas.closest('.chart-container') || canvas.parentElement;
    _pendingCharts.push({ element: container, render: renderFn });
    _observer.observe(container);

    return null;
  }

  // -------------------------------------------------------------------------
  // Bar chart factory
  // -------------------------------------------------------------------------
  function createBarChart(canvasId, config) {
    return _lazyRender(canvasId, function () {
      var canvas = document.getElementById(canvasId);
      if (!canvas) return null;
      var opts = _baseOptions({
        indexAxis: config.horizontal ? 'y' : 'x',
        scales: {
          x: {
            grid: { color: '#f1f5f9' },
            ticks: { font: DEFAULT_FONT, maxRotation: isMobile ? 45 : 0 }
          },
          y: {
            grid: { display: !config.horizontal },
            ticks: { font: DEFAULT_FONT }
          }
        },
        plugins: {
          legend: { display: !!config.showLegend }
        }
      });
      return new Chart(canvas, {
        type: 'bar',
        data: {
          labels: config.labels,
          datasets: (config.datasets || []).map(function (ds, i) {
            return Object.assign({
              backgroundColor: COLORS.set[i % COLORS.set.length],
              borderRadius: 6,
              borderSkipped: false
            }, ds);
          })
        },
        options: Object.assign(opts, config.options || {})
      });
    });
  }

  // -------------------------------------------------------------------------
  // Doughnut chart factory
  // -------------------------------------------------------------------------
  function createDoughnutChart(canvasId, config) {
    return _lazyRender(canvasId, function () {
      var canvas = document.getElementById(canvasId);
      if (!canvas) return null;
      var opts = _baseOptions({
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: DEFAULT_FONT,
              usePointStyle: true,
              padding: isMobile ? 10 : 16,
              // Responsive: reduce box width on mobile
              boxWidth: isMobile ? 10 : 40
            }
          }
        }
      });
      return new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: config.labels,
          datasets: [{
            data: config.data,
            backgroundColor: config.colors || COLORS.set.slice(0, (config.data || []).length),
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: Object.assign(opts, config.options || {})
      });
    });
  }

  // -------------------------------------------------------------------------
  // Radar chart factory
  // -------------------------------------------------------------------------
  function createRadarChart(canvasId, config) {
    return _lazyRender(canvasId, function () {
      var canvas = document.getElementById(canvasId);
      if (!canvas) return null;
      var opts = _baseOptions({
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: config.max || 100,
            ticks: { display: false },
            grid: { color: '#e2e8f0' },
            pointLabels: {
              font: {
                family: DEFAULT_FONT.family,
                size: isMobile ? 9 : 12
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: DEFAULT_FONT,
              usePointStyle: true,
              padding: isMobile ? 12 : 20
            }
          }
        }
      });
      return new Chart(canvas, {
        type: 'radar',
        data: {
          labels: config.labels,
          datasets: (config.datasets || []).map(function (ds) { return ds; })
        },
        options: Object.assign(opts, config.options || {})
      });
    });
  }

  // -------------------------------------------------------------------------
  // CWV gauge renderer (inline HTML, no canvas needed)
  // Renders into a container element.
  // metrics: array of { label, value, thresholds: { good, poor, unit, max } }
  // -------------------------------------------------------------------------
  var CWV_THRESHOLDS = {
    LCP:  { good: 2500, poor: 4000, unit: 'ms', max: 8000 },
    CLS:  { good: 0.1,  poor: 0.25, unit: '',   max: 0.5 },
    FCP:  { good: 1800, poor: 3000, unit: 'ms', max: 6000 },
    INP:  { good: 200,  poor: 500,  unit: 'ms', max: 1000 },
    TTFB: { good: 800,  poor: 1800, unit: 'ms', max: 3600 }
  };

  function _gaugeHTML(label, val, t) {
    if (val == null) return '';
    var pct = Math.min((val / t.max) * 100, 100);
    var color = val <= t.good ? 'green' : val <= t.poor ? 'orange' : 'red';
    var goodPct = (t.good / t.max) * 100;
    var poorPct = (t.poor / t.max) * 100;
    var textCls = color === 'green' ? 'text-green-600' : color === 'orange' ? 'text-amber-600' : 'text-red-600';
    return '<div class="mb-4 no-break">' +
      '<div class="flex justify-between items-baseline mb-1">' +
        '<span class="text-sm font-semibold text-slate-700">' + label + '</span>' +
        '<span class="text-sm font-bold ' + textCls + '">' + val + t.unit + '</span>' +
      '</div>' +
      '<div class="cwv-gauge">' +
        '<div class="cwv-gauge-fill ' + color + '" style="width:' + pct + '%"></div>' +
        '<div class="cwv-gauge-marker" style="left:' + goodPct + '%"></div>' +
        '<div class="cwv-gauge-marker" style="left:' + poorPct + '%"></div>' +
      '</div>' +
      '<div class="flex justify-between text-xs text-slate-400 mt-1">' +
        '<span>Good &le; ' + t.good + t.unit + '</span>' +
        '<span>Poor &gt; ' + t.poor + t.unit + '</span>' +
      '</div>' +
    '</div>';
  }

  function renderCWVGauges(containerId, cwvData) {
    var container = document.getElementById(containerId);
    if (!container || !cwvData) return;

    var metricKeys = ['LCP', 'CLS', 'FCP', 'INP', 'TTFB'];
    var html = '';

    if (cwvData.mobile) {
      html += '<div class="bg-white border border-slate-200 rounded-xl p-6">';
      html += '<h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">';
      html += '<svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">';
      html += '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>';
      html += '</svg> Mobile</h3>';
      metricKeys.forEach(function (m) {
        if (cwvData.mobile[m] != null && CWV_THRESHOLDS[m]) {
          html += _gaugeHTML(m, cwvData.mobile[m], CWV_THRESHOLDS[m]);
        }
      });
      html += '</div>';
    }

    if (cwvData.desktop) {
      html += '<div class="bg-white border border-slate-200 rounded-xl p-6">';
      html += '<h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">';
      html += '<svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">';
      html += '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>';
      html += '</svg> Desktop</h3>';
      metricKeys.forEach(function (m) {
        if (cwvData.desktop[m] != null && CWV_THRESHOLDS[m]) {
          html += _gaugeHTML(m, cwvData.desktop[m], CWV_THRESHOLDS[m]);
        }
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // -------------------------------------------------------------------------
  // Rank Line Chart (inverted Y-axis: #1 at top)
  // -------------------------------------------------------------------------
  function createRankLineChart(canvasId, config) {
    return _lazyRender(canvasId, function () {
      var canvas = document.getElementById(canvasId);
      if (!canvas || typeof Chart === 'undefined') return null;

      var maxPos = config.maxPosition || 50;

      return new Chart(canvas, {
        type: 'line',
        data: {
          labels: config.labels || [],
          datasets: (config.datasets || []).map(function (ds, i) {
            return {
              label: ds.label || '',
              data: ds.data || [],
              borderColor: ds.color || COLORS.set[i % COLORS.set.length],
              backgroundColor: 'transparent',
              borderWidth: ds.isClient ? 3 : 2,
              pointRadius: isMobile ? (ds.isClient ? 4 : 2) : (ds.isClient ? 6 : 4),
              pointHoverRadius: isMobile ? 6 : 8,
              pointBackgroundColor: ds.color || COLORS.set[i % COLORS.set.length],
              tension: 0.3,
              spanGaps: false,
              fill: false,
              borderDash: ds.isClient ? [] : [5, 3]
            };
          })
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          devicePixelRatio: effectiveDPR,
          scales: {
            y: {
              reverse: true,
              min: 1,
              max: maxPos,
              grid: { color: '#f1f5f9' },
              title: {
                display: true,
                text: 'Position',
                font: { size: isMobile ? 10 : 12, weight: 600 }
              },
              ticks: {
                stepSize: maxPos <= 20 ? 2 : (maxPos <= 50 ? 5 : 10),
                font: { family: 'Inter, system-ui, sans-serif', size: isMobile ? 9 : 11 },
                callback: function (val) { return '#' + val; }
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                font: { family: 'Inter, system-ui, sans-serif', size: isMobile ? 9 : 11 },
                maxRotation: 45
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: 'Inter, system-ui, sans-serif', size: isMobile ? 10 : 12 },
                usePointStyle: true,
                padding: isMobile ? 10 : 16
              }
            },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var val = ctx.raw;
                  if (val === null || val === undefined) return ctx.dataset.label + ': Not ranking';
                  return ctx.dataset.label + ': #' + val;
                }
              }
            }
          }
        }
      });
    });
  }

  function renderPositionDelta(oldPos, newPos) {
    if (oldPos === null && newPos === null) return '<span class="text-slate-400">&mdash;</span>';
    if (oldPos === null && newPos !== null) return '<span class="text-green-600 font-semibold">&#9733; New #' + newPos + '</span>';
    if (oldPos !== null && newPos === null) return '<span class="text-red-500 font-semibold">&#10007; Lost</span>';
    var delta = oldPos - newPos;
    if (delta > 0) return '<span class="text-green-600 font-semibold">&#9650; +' + delta + '</span>';
    if (delta < 0) return '<span class="text-red-500 font-semibold">&#9660; ' + Math.abs(delta) + '</span>';
    return '<span class="text-slate-400">&mdash; 0</span>';
  }

  window.TPPC.charts = {
    COLORS: COLORS,
    CWV_THRESHOLDS: CWV_THRESHOLDS,
    createBarChart: createBarChart,
    createDoughnutChart: createDoughnutChart,
    createRadarChart: createRadarChart,
    renderCWVGauges: renderCWVGauges,
    createRankLineChart: createRankLineChart,
    renderPositionDelta: renderPositionDelta
  };

})();
