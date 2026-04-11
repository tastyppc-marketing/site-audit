/**
 * shared/table-pagination.js — Reusable DOM-based table pagination
 * Namespace: window.TPPC.pagination
 *
 * Architecture: Removes rows from the DOM entirely (not display:none).
 * Stores all rows in a JS array, only renders the current page's rows
 * into <tbody>. This guarantees pagination works regardless of CSS.
 *
 * Works with table-filters.js: listens for tppc:filterchange events.
 * Auto-detects [data-paginate] wrapper divs after init().
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  var DEFAULT_PAGE_SIZE = 25;
  var PAGE_SIZES = [10, 25, 50, 100, 'All'];

  function buildPagination(wrapper) {
    var table = wrapper.querySelector('table');
    var tbody = table && table.querySelector('tbody');
    if (!tbody) return;

    var pageSize = DEFAULT_PAGE_SIZE;
    var currentPage = 1;

    // Store ALL rows in memory — remove from DOM
    var allRows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
    var filteredRows = allRows.slice(); // rows not excluded by filters

    // Clear tbody
    while (tbody.firstChild) { tbody.removeChild(tbody.firstChild); }

    // Create control elements — one ABOVE table, one BELOW
    var topControl = document.createElement('div');
    topControl.className = 'tppc-pagination tppc-pagination-top';
    topControl.style.cssText = 'padding:4px 0 10px 0';

    var bottomControl = document.createElement('div');
    bottomControl.className = 'tppc-pagination tppc-pagination-bottom';
    bottomControl.style.cssText = 'padding:10px 0 4px 0';

    // Insert controls: top before table wrapper, bottom after
    var tableWrap = wrapper.querySelector('.report-table-wrap') || wrapper;
    tableWrap.parentNode.insertBefore(topControl, tableWrap);
    tableWrap.parentNode.insertBefore(bottomControl, tableWrap.nextSibling);

    function renderPage() {
      var total = filteredRows.length;
      var pageSz = (pageSize === 'All') ? total : pageSize;
      if (pageSz <= 0) pageSz = total || 1;
      var totalPages = Math.ceil(total / pageSz) || 1;

      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      var start = (pageSize === 'All') ? 0 : (currentPage - 1) * pageSz;
      var end = (pageSize === 'All') ? total : Math.min(start + pageSz, total);

      // Clear tbody and insert only current page rows
      while (tbody.firstChild) { tbody.removeChild(tbody.firstChild); }

      var fragment = document.createDocumentFragment();
      for (var i = start; i < end; i++) {
        // Ensure row is visible (undo any prior display:none)
        filteredRows[i].style.display = '';
        fragment.appendChild(filteredRows[i]);
      }
      tbody.appendChild(fragment);

      var visibleFrom = total > 0 ? start + 1 : 0;
      var visibleTo = Math.min(end, total);

      renderControls(topControl, visibleFrom, visibleTo, total, totalPages);
      renderControls(bottomControl, visibleFrom, visibleTo, total, totalPages);

      // Hide controls if everything fits on one page
      var showControls = total > 10;
      topControl.style.display = showControls ? '' : 'none';
      bottomControl.style.display = showControls ? '' : 'none';
    }

    function renderControls(controlEl, from, to, total, totalPages) {
      var pageSizeOptions = PAGE_SIZES.map(function (sz) {
        return '<option value="' + sz + '"' +
          (pageSize === sz || String(pageSize) === String(sz) ? ' selected' : '') +
          '>' + sz + '</option>';
      }).join('');

      // Page number window: up to 5 buttons around current page
      var windowStart = Math.max(1, currentPage - 2);
      var windowEnd = Math.min(totalPages, windowStart + 4);
      if (windowEnd - windowStart < 4) windowStart = Math.max(1, windowEnd - 4);

      var pageButtons = '';
      for (var p = windowStart; p <= windowEnd; p++) {
        var isActive = p === currentPage;
        pageButtons += '<button data-page="' + p + '" style="' +
          'min-width:30px;height:30px;border-radius:6px;border:1px solid ' +
          (isActive ? '#3b82f6' : '#e2e8f0') + ';background:' +
          (isActive ? '#3b82f6' : '#fff') + ';color:' +
          (isActive ? '#fff' : '#475569') +
          ';font-size:0.78rem;font-weight:600;cursor:' + (isActive ? 'default' : 'pointer') +
          ';padding:0 6px;line-height:1">' + p + '</button>';
      }

      var btnBase = 'height:30px;padding:0 10px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:0.78rem;cursor:pointer;line-height:1';
      var btnDisabled = 'height:30px;padding:0 10px;border-radius:6px;border:1px solid #e2e8f0;background:#f8fafc;color:#cbd5e1;font-size:0.78rem;cursor:default;line-height:1';

      controlEl.innerHTML =
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 4px;border-top:1px solid #e2e8f0;font-size:0.8rem;color:#64748b">' +
          '<span style="margin-right:auto;white-space:nowrap">Showing <strong>' + from + '</strong>&ndash;<strong>' + to + '</strong> of <strong>' + total + '</strong></span>' +
          '<button data-page="prev" style="' + (currentPage <= 1 ? btnDisabled : btnBase) + '"' + (currentPage <= 1 ? ' disabled' : '') + '>Prev</button>' +
          pageButtons +
          '<button data-page="next" style="' + (currentPage >= totalPages ? btnDisabled : btnBase) + '"' + (currentPage >= totalPages ? ' disabled' : '') + '>Next</button>' +
          '<select data-pagesize style="height:30px;padding:0 6px;border-radius:6px;border:1px solid #e2e8f0;font-size:0.78rem;color:#475569;background:#fff;cursor:pointer">' + pageSizeOptions + '</select>' +
        '</div>';

      // Bind page buttons
      controlEl.querySelectorAll('[data-page]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var pg = btn.getAttribute('data-page');
          if (pg === 'prev' && currentPage > 1) { currentPage--; }
          else if (pg === 'next' && currentPage < totalPages) { currentPage++; }
          else {
            var num = parseInt(pg, 10);
            if (!isNaN(num)) currentPage = num;
          }
          renderPage();
        });
      });

      // Bind page size selector
      var sel = controlEl.querySelector('[data-pagesize]');
      if (sel) {
        sel.addEventListener('change', function (e) {
          var val = e.target.value;
          pageSize = (val === 'All') ? 'All' : parseInt(val, 10);
          currentPage = 1;
          renderPage();
        });
      }
    }

    // Listen for filter changes from table-filters.js
    if (table) {
      table.addEventListener('tppc:filterchange', function () {
        // Rebuild filtered rows list from allRows based on _filteredOut flag
        filteredRows = allRows.filter(function (tr) { return !tr._filteredOut; });
        currentPage = 1;
        renderPage();
      });
    }

    // Initial render
    renderPage();
  }

  window.TPPC.pagination = {
    init: function () {
      var wrappers = document.querySelectorAll('[data-paginate]');
      Array.prototype.forEach.call(wrappers, function (wrapper) {
        if (wrapper.getAttribute('data-paginated')) return;
        wrapper.setAttribute('data-paginated', '1');
        buildPagination(wrapper);
      });
    }
  };
})();
