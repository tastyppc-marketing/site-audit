/**
 * shared/data-loader.js — TastyPPC report namespace + data validation + boot
 * Namespace: window.TPPC
 * Load order: must come after utils.js
 */
(function () {
  'use strict';

  // 1. Initialize namespace
  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};

  // 2. Validate data exists
  if (!window.AUDIT_DATA || typeof window.AUDIT_DATA !== 'object') {
    // Dev/preview fallback: inject shared/debug-data.js via script tag
    var fallback = document.createElement('script');
    fallback.src = 'shared/debug-data.js';
    fallback.onload = function () {
      if (window.AUDIT_DATA && typeof window.AUDIT_DATA === 'object') {
        _setup();
      } else {
        _showError();
      }
    };
    fallback.onerror = _showError;
    document.head.appendChild(fallback);
    return;
  }

  _setup();

  function _setup() {
    // 3. Store references
    window.TPPC.data = window.AUDIT_DATA;
    window.TPPC.searchIndex = window.SEARCH_INDEX || [];

    // 4. Boot orchestrator — called by page-specific JS after DOMContentLoaded
    var _booted = false;
    window.TPPC.boot = function () {
      if (_booted) return;
      _booted = true;
      var pageName = window.TPPC.currentPage;

      // Init shared components
      if (window.TPPC.nav && typeof window.TPPC.nav.init === 'function') {
        window.TPPC.nav.init();
      }
      if (window.TPPC.search && typeof window.TPPC.search.init === 'function') {
        window.TPPC.search.init();
      }
      if (window.TPPC.print && typeof window.TPPC.print.init === 'function') {
        window.TPPC.print.init();
      }
      if (window.TPPC.explainer && typeof window.TPPC.explainer.init === 'function') {
        window.TPPC.explainer.init();
      }

      // Init page renderer
      if (pageName && window.TPPC.pages[pageName] && typeof window.TPPC.pages[pageName].init === 'function') {
        try {
          window.TPPC.pages[pageName].init(window.TPPC.data);
        } catch (err) {
          console.error('[TPPC] Renderer init failed for page "' + pageName + '":', err);
        }
      }

      // Init collapsibles after all rendering is done
      if (window.TPPC.utils && typeof window.TPPC.utils.initCollapsibles === 'function') {
        window.TPPC.utils.initCollapsibles();
      }

      // Make tables responsive on mobile (adds data-label attrs)
      if (window.TPPC.utils && typeof window.TPPC.utils.makeTablesResponsive === 'function') {
        window.TPPC.utils.makeTablesResponsive();
      }

      // Init pagination on tables with [data-paginate] wrappers
      if (window.TPPC.pagination && typeof window.TPPC.pagination.init === 'function') {
        window.TPPC.pagination.init();
      }
    };

    // If setup was called late (async debug-data.js fallback), auto-boot now
    if (document.readyState !== 'loading') {
      setTimeout(function () {
        if (window.TPPC.boot) window.TPPC.boot();
      }, 50);
    }
  }

  function _showError() {
    document.body.innerHTML =
      '<div style="' +
        'display:flex;align-items:center;justify-content:center;' +
        'min-height:100vh;padding:2rem;text-align:center;font-family:system-ui,sans-serif' +
      '">' +
        '<div style="max-width:480px">' +
          '<div style="font-size:3rem;margin-bottom:1rem">!</div>' +
          '<h1 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">No audit data found</h1>' +
          '<p style="color:#64748b;font-size:0.875rem">' +
            'Run <code>generate-multipage-report.js</code> to inject data, ' +
            'or provide <code>shared/debug-data.js</code> for local preview.' +
          '</p>' +
        '</div>' +
      '</div>';
  }

})();
