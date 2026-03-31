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
    initCollapsibles: initCollapsibles
  };

  // Also expose esc globally as a convenience used throughout page renderers
  window.TPPC.esc = esc;

})();
