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
    // Expand all collapsibles
    document.querySelectorAll('.collapsible-header').forEach(function (header) {
      header.classList.add('open');
      var body = header.nextElementSibling;
      if (body) body.classList.add('open');
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
  }

  window.TPPC.print = {
    init: init,
    preparePDF: preparePDF
  };

})();
