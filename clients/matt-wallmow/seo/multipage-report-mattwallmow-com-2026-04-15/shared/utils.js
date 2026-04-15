/**
 * shared/utils.js — TastyPPC report utility helpers
 * Namespace: window.TPPC.utils
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  /**
   * XSS-safe HTML escape. Always use before inserting user data into innerHTML.
   */
  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /** Maps grade letter to CSS class (grade-a … grade-f). */
  function gradeClass(grade) {
    if (!grade) return 'grade-d';
    var letter = grade.charAt(0).toUpperCase();
    if (letter === 'A') return 'grade-a';
    if (letter === 'B') return 'grade-b';
    if (letter === 'C') return 'grade-c';
    if (letter === 'D') return 'grade-d';
    return 'grade-f';
  }

  /** Maps severity string to CSS class (critical, high, medium, low, info). */
  function severityClass(sev) {
    if (!sev) return '';
    var s = sev.toLowerCase().replace(/[\s_-]/g, '-');
    if (s.indexOf('critical') !== -1) return 'critical';
    if (s.indexOf('very') !== -1 && s.indexOf('high') !== -1) return 'very-high';
    if (s.indexOf('high') !== -1) return 'high';
    if (s.indexOf('medium') !== -1 || s.indexOf('moderate') !== -1) return 'medium';
    if (s.indexOf('low') !== -1) return 'low';
    return 'info';
  }

  /**
   * Maps effort/impact value to pill CSS classes.
   * prefix: 'effort' or 'impact'
   */
  function pillClass(prefix, val) {
    if (!val) return '';
    var s = val.toLowerCase().replace(/[\s_]/g, '-');
    var level = s.indexOf('very') !== -1 ? 'very-high'
      : s.indexOf('high') !== -1 ? 'high'
      : (s.indexOf('medium') !== -1 || s.indexOf('moderate') !== -1) ? 'medium'
      : 'low';
    return 'pill pill-' + prefix + '-' + level;
  }

  /** Maps rank number/string to color class (rank-green, rank-orange, rank-red). */
  function rankClass(rank) {
    if (!rank) return 'rank-red';
    var str = String(rank).toLowerCase();
    if (str.indexOf('not found') !== -1 || str === 'n/a' || str === '-') return 'rank-red';
    var num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return 'rank-red';
    if (num <= 10) return 'rank-green';
    if (num <= 30) return 'rank-orange';
    return 'rank-red';
  }

  /** Shorthand querySelector. */
  function $(sel) { return document.querySelector(sel); }

  /** Shorthand querySelectorAll. */
  function $$(sel) { return document.querySelectorAll(sel); }

  /**
   * Build a collapsible section.
   * title  — displayed header text (will be escaped internally)
   * contentFn — zero-arg function returning inner HTML string
   */
  function buildCollapsible(title, contentFn) {
    return '<div class="mb-2">' +
      '<div class="collapsible-header">' +
        '<span>' + esc(title) + '</span>' +
        '<svg class="chevron w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>' +
        '</svg>' +
      '</div>' +
      '<div class="collapsible-body">' +
        '<div class="p-4">' + contentFn() + '</div>' +
      '</div>' +
    '</div>';
  }

  /** Format a number with locale separators. */
  function formatNumber(n) {
    if (n == null || isNaN(Number(n))) return String(n || '');
    return Number(n).toLocaleString();
  }

  /** Format a decimal as a percentage string (e.g. 0.45 → '45%'). */
  function formatPercent(n, decimals) {
    if (n == null || isNaN(Number(n))) return '';
    return (Number(n) * 100).toFixed(decimals != null ? decimals : 1) + '%';
  }

  /* Attach collapsible click handlers for all .collapsible-header elements */
  function initCollapsibles(scope) {
    var root = scope || document;
    var headers = root.querySelectorAll('.collapsible-header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        var body = header.nextElementSibling;
        header.classList.toggle('open');
        if (body) body.classList.toggle('open');
      });
    });
  }

  /**
   * Make report tables responsive on mobile.
   * Reads column headers, adds data-label attrs to cells, marks table responsive.
   * Called after all page rendering is complete (from data-loader boot).
   */
  function makeTablesResponsive() {
    var tables = document.querySelectorAll('.report-table');
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var headers = [];
      var ths = table.querySelectorAll('thead th');
      for (var h = 0; h < ths.length; h++) {
        headers.push(ths[h].textContent.trim());
      }
      if (!headers.length) continue;

      table.classList.add('report-table--responsive');

      var rows = table.querySelectorAll('tbody tr');
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r].querySelectorAll('td');
        for (var c = 0; c < cells.length; c++) {
          if (headers[c]) {
            cells[c].setAttribute('data-label', headers[c]);
          }
        }
      }
    }
  }

  function getApiErrors(data, sourceFile) {
    if (!data || !Array.isArray(data.apiErrors)) return null;
    var entry = data.apiErrors.find(function(e) { return e.source === sourceFile; });
    return (entry && entry.errors && entry.errors.length) ? entry : null;
  }

  function renderApiErrorBanner(entry) {
    if (!entry) return '';
    var html = '<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:12px 0">';
    html += '<div style="font-weight:600;color:#92400e;margin-bottom:8px">&#9888; Data Source Issue</div>';
    entry.errors.forEach(function(err) {
      html += '<div style="color:#78350f;font-size:0.875rem;margin-bottom:4px">';
      if (err.code) html += '<strong>HTTP ' + err.code + '</strong>: ';
      html += (err.reason || err.message || 'Unknown error');
      html += '</div>';
    });
    html += '<div style="color:#92400e;font-size:0.75rem;margin-top:8px">The data-gathering script ran but the API returned an error. Fix the issue above and re-run the script to populate this section.</div>';
    html += '</div>';
    return html;
  }

  window.TPPC.utils = {
    esc: esc,
    gradeClass: gradeClass,
    severityClass: severityClass,
    pillClass: pillClass,
    rankClass: rankClass,
    $: $,
    $$: $$,
    buildCollapsible: buildCollapsible,
    formatNumber: formatNumber,
    formatPercent: formatPercent,
    getApiErrors: getApiErrors,
    initCollapsibles: initCollapsibles,
    makeTablesResponsive: makeTablesResponsive,
    renderApiErrorBanner: renderApiErrorBanner
  };

  // Also expose esc globally as a convenience used throughout page renderers
  window.TPPC.esc = esc;

})();
