/**
 * shared/table-pagination.js — Reusable table pagination
 * Namespace: window.TPPC.pagination
 * Works with table-filters.js: respects already-hidden (filtered) rows.
 * Auto-detects [data-paginate] wrapper divs after init().
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  var DEFAULT_PAGE_SIZE = 50;
  var PAGE_SIZES = [25, 50, 100, 'All'];

  function buildPagination(wrapper) {
    var table = wrapper.querySelector('table');
    var tbody = table && table.querySelector('tbody');
    if (!tbody) return;

    var pageSize = DEFAULT_PAGE_SIZE;
    var currentPage = 1;

    var controlEl = document.createElement('div');
    controlEl.className = 'tppc-pagination';
    controlEl.style.cssText = 'padding:10px 0 4px 0';

    // Get pageable rows: not filtered out by table-filters.js
    function getRows() {
      return Array.prototype.filter.call(
        tbody.querySelectorAll('tr'),
        function (tr) { return !tr._filteredOut; }
      );
    }

    function applyPage() {
      var rows = getRows();
      var total = rows.length;
      var pageSz = (pageSize === 'All') ? total : pageSize;
      var totalPages = (pageSz > 0) ? Math.ceil(total / pageSz) : 1;

      if (currentPage > totalPages) currentPage = totalPages || 1;
      if (currentPage < 1) currentPage = 1;

      var start = (pageSz > 0 && pageSize !== 'All') ? (currentPage - 1) * pageSz : 0;
      var end = (pageSz > 0 && pageSize !== 'All') ? Math.min(start + pageSz, total) : total;

      rows.forEach(function (tr, i) {
        tr._paginationHidden = (i < start || i >= end);
        tr.style.display = tr._paginationHidden ? 'none' : '';
      });

      var visibleFrom = total > 0 ? start + 1 : 0;
      var visibleTo = Math.min(end, total);
      renderControls(visibleFrom, visibleTo, total, totalPages);
    }

    function renderControls(from, to, total, totalPages) {
      // Hide controls if everything fits on one page and page size not manually changed
      if (total <= 25 && pageSize === DEFAULT_PAGE_SIZE) {
        controlEl.style.display = 'none';
        return;
      }
      controlEl.style.display = '';

      var pageSizeOptions = PAGE_SIZES.map(function (sz) {
        return '<option value="' + sz + '"' + (pageSize === sz || String(pageSize) === String(sz) ? ' selected' : '') + '>' + sz + '</option>';
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
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 4px 6px;border-top:1px solid #e2e8f0;font-size:0.8rem;color:#64748b">' +
          '<span style="margin-right:auto;white-space:nowrap">Showing <strong>' + from + '</strong>&ndash;<strong>' + to + '</strong> of <strong>' + total + '</strong></span>' +
          '<button data-page="prev" style="' + (currentPage <= 1 ? btnDisabled : btnBase) + '"' + (currentPage <= 1 ? ' disabled' : '') + '>Prev</button>' +
          pageButtons +
          '<button data-page="next" style="' + (currentPage >= totalPages ? btnDisabled : btnBase) + '"' + (currentPage >= totalPages ? ' disabled' : '') + '>Next</button>' +
          '<select style="height:30px;padding:0 6px;border-radius:6px;border:1px solid #e2e8f0;font-size:0.78rem;color:#475569;background:#fff;cursor:pointer">' + pageSizeOptions + '</select>' +
        '</div>';

      // Bind page buttons
      controlEl.querySelectorAll('[data-page]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var pg = btn.getAttribute('data-page');
          var tp = totalPages;
          if (pg === 'prev' && currentPage > 1) { currentPage--; }
          else if (pg === 'next' && currentPage < tp) { currentPage++; }
          else {
            var num = parseInt(pg, 10);
            if (!isNaN(num)) currentPage = num;
          }
          applyPage();
        });
      });

      // Bind page size selector
      var sel = controlEl.querySelector('select');
      if (sel) {
        sel.addEventListener('change', function (e) {
          var val = e.target.value;
          pageSize = (val === 'All') ? 'All' : parseInt(val, 10);
          currentPage = 1;
          applyPage();
        });
      }
    }

    // Place control element after the table wrapper (or after the [data-paginate] wrapper's last child)
    var tableWrap = wrapper.querySelector('.report-table-wrap') || wrapper;
    tableWrap.parentNode.insertBefore(controlEl, tableWrap.nextSibling);

    // Listen for filter changes fired by table-filters.js
    if (table) {
      table.addEventListener('tppc:filterchange', function () {
        // Mark rows filtered out by table-filters.js
        Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (tr) {
          // A row is filtered out if display:none but not hidden by us
          if (!tr._paginationHidden && tr.style.display === 'none') {
            tr._filteredOut = true;
          } else if (tr.style.display !== 'none') {
            tr._filteredOut = false;
          }
        });
        currentPage = 1;
        applyPage();
      });
    }

    applyPage();
  }

  window.TPPC.pagination = {
    init: function () {
      var wrappers = document.querySelectorAll('[data-paginate]');
      Array.prototype.forEach.call(wrappers, function (wrapper) {
        if (wrapper.getAttribute('data-paginated')) return; // already set up
        wrapper.setAttribute('data-paginated', '1');
        buildPagination(wrapper);
      });
    }
  };
})();
