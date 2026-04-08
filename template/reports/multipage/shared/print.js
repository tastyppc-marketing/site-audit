/**
 * shared/print.js — Print / PDF preparation helpers
 * Namespace: window.TPPC.print
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  function init() {
    window.addEventListener('beforeprint', preparePDF);
  }

  /**
   * Expand all collapsibles, show all tab panels, prepare page breaks.
   * Called automatically before printing via beforeprint event.
   */
  function preparePDF() {
    // Expand all collapsibles (handle both class-based and inline display)
    document.querySelectorAll('.collapsible-header').forEach(function (header) {
      header.classList.add('open');
      var body = header.nextElementSibling;
      if (body) {
        body.classList.add('open');
        body.style.display = 'block';
      }
    });

    // Show all tab panels (remove hidden class)
    document.querySelectorAll('[role="tabpanel"]').forEach(function (panel) {
      panel.hidden = false;
      panel.classList.remove('hidden');
    });

    // Activate all tab buttons to avoid orphaned styling
    document.querySelectorAll('[role="tab"]').forEach(function (tab) {
      tab.setAttribute('aria-selected', 'true');
    });

    // Show all paginated table rows (remove display:none from filtered/paginated rows)
    document.querySelectorAll('tbody').forEach(function (tb) {
      tb.style.display = '';
    });
    document.querySelectorAll('tbody tr').forEach(function (row) {
      row.style.display = '';
    });

    // Hide pagination controls and filter bars during print
    document.querySelectorAll('#opp-pagination, #opp-filter-bar, .comp-page-btn, .matrix-page-btn').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  window.TPPC.print = {
    init: init,
    preparePDF: preparePDF
  };

})();
