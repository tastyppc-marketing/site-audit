/**
 * shared/table-filters.js — Reusable table filtering system
 * Namespace: window.TPPC.filters
 *
 * Usage:
 *   Wrap any .report-table in a container with [data-filterable]:
 *     <div data-filterable>
 *       <table class="report-table"> ... </table>
 *     </div>
 *
 *   Optional dropdown filters via data-filters (JSON array):
 *     data-filters='[{"col":3,"label":"Severity","type":"badge"},{"col":1,"label":"Status","options":["Pass","Fail"]}]'
 *
 *   Self-initializes on DOMContentLoaded.
 *   Also callable after dynamic rendering: window.TPPC.filters.init()
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  // -----------------------------------------------------------------------
  // 1. Inject scoped CSS
  // -----------------------------------------------------------------------
  var STYLE_ID = 'tppc-table-filter-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '.tppc-filter-bar{' +
        'display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;' +
        'background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;' +
        'padding:0.5rem 0.75rem;margin-bottom:0.75rem;' +
      '}' +
      '.tppc-filter-bar .tppc-filter-search{' +
        'border:1px solid #e2e8f0;border-radius:8px;' +
        'padding:0.35rem 0.75rem;font-size:0.8rem;min-width:min(200px,100%);' +
        'outline:none;font-family:inherit;' +
      '}' +
      '.tppc-filter-bar .tppc-filter-search:focus{' +
        'border-color:#93c5fd;box-shadow:0 0 0 2px rgba(59,130,246,0.15);' +
      '}' +
      '.tppc-filter-bar .tppc-filter-select{' +
        'border:1px solid #e2e8f0;border-radius:8px;' +
        'padding:0.35rem 0.75rem;font-size:0.8rem;' +
        'background:white;outline:none;font-family:inherit;' +
        'cursor:pointer;' +
      '}' +
      '.tppc-filter-bar .tppc-filter-select:focus{' +
        'border-color:#93c5fd;box-shadow:0 0 0 2px rgba(59,130,246,0.15);' +
      '}' +
      '.tppc-filter-bar .tppc-filter-count{' +
        'font-size:0.75rem;color:#94a3b8;margin-left:auto;white-space:nowrap;' +
      '}' +
      '.tppc-filter-bar .tppc-filter-clear{' +
        'font-size:0.75rem;color:#3b82f6;cursor:pointer;' +
        'background:none;border:none;padding:0;font-family:inherit;' +
        'text-decoration:none;white-space:nowrap;' +
      '}' +
      '.tppc-filter-bar .tppc-filter-clear:hover{text-decoration:underline;}' +
      '@media print{.tppc-filter-bar{display:none !important;}}';
    document.head.appendChild(style);
  }

  // -----------------------------------------------------------------------
  // 2. Badge option auto-discovery
  // -----------------------------------------------------------------------
  var BADGE_CLASSES = ['critical', 'very-high', 'high', 'medium', 'low', 'info'];

  function discoverBadgeOptions(table, colIndex) {
    var seen = {};
    var options = [];
    var rows = getFilterableRows(table);

    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].getElementsByTagName('td');
      if (colIndex >= cells.length) continue;
      var badges = cells[colIndex].querySelectorAll('.severity-badge');
      for (var b = 0; b < badges.length; b++) {
        var text = (badges[b].textContent || '').replace(/\s+/g, ' ').trim();
        if (text && !seen[text]) {
          seen[text] = true;
          options.push(text);
        }
      }
    }
    return options;
  }

  function discoverUniqueValues(table, colIndex) {
    var seen = {};
    var options = [];
    var rows = getFilterableRows(table);
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].getElementsByTagName('td');
      if (colIndex >= cells.length) continue;
      var text = (cells[colIndex].textContent || '').replace(/\s+/g, ' ').trim();
      if (text && !seen[text]) {
        seen[text] = true;
        options.push(text);
      }
    }
    return options.sort();
  }

  function parseNumericFromCell(text) {
    if (!text) return null;
    var cleaned = text.replace(/[,%$]/g, '').replace(/\s/g, '');
    var num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  // -----------------------------------------------------------------------
  // 3. Row helpers
  // -----------------------------------------------------------------------

  /**
   * Returns only the parent-level <tr> rows that should be filtered.
   * Skips rows inside child <tbody> elements (the expand/collapse backlink
   * groups) by checking whether the row's parent tbody has an id that
   * starts with 'bl-group-' or is hidden by default (style display:none).
   */
  function getFilterableRows(table) {
    var allRows = table.querySelectorAll('tbody tr');
    var rows = [];
    for (var i = 0; i < allRows.length; i++) {
      var row = allRows[i];
      var parentTbody = row.parentNode;
      // Skip child tbodies used for expand/collapse grouping
      if (parentTbody && parentTbody.tagName === 'TBODY' && parentTbody.id) {
        continue;
      }
      rows.push(row);
    }
    return rows;
  }

  function getCellText(row, colIndex) {
    var cells = row.getElementsByTagName('td');
    if (colIndex >= cells.length) return '';
    return (cells[colIndex].textContent || '').replace(/\s+/g, ' ').trim();
  }

  function getAllCellText(row) {
    var cells = row.getElementsByTagName('td');
    var parts = [];
    for (var i = 0; i < cells.length; i++) {
      parts.push((cells[i].textContent || '').replace(/\s+/g, ' ').trim());
    }
    return parts.join(' ');
  }

  // -----------------------------------------------------------------------
  // 4. Build the filter bar for one wrapper
  // -----------------------------------------------------------------------
  function buildFilterBar(wrapper) {
    var table = wrapper.querySelector('.report-table');
    if (!table) return;

    // Avoid double-init
    if (wrapper.querySelector('.tppc-filter-bar')) return;

    // Parse optional dropdown filter config
    var filterDefs = [];
    var filtersAttr = wrapper.getAttribute('data-filters');
    if (filtersAttr) {
      try { filterDefs = JSON.parse(filtersAttr); } catch (e) { filterDefs = []; }
    }

    // Create bar container
    var bar = document.createElement('div');
    bar.className = 'tppc-filter-bar no-print';

    // --- Text search input ---
    var search = document.createElement('input');
    search.type = 'text';
    search.className = 'tppc-filter-search';
    search.placeholder = '\uD83D\uDD0D Search table\u2026';
    search.setAttribute('aria-label', 'Search table');
    bar.appendChild(search);

    // --- Dropdown filters ---
    var selects = [];
    for (var d = 0; d < filterDefs.length; d++) {
      var def = filterDefs[d];
      var col = def.col;
      var label = def.label || 'Filter';
      var opts;
      var isRange = def.type === 'range' && Array.isArray(def.ranges);

      if (isRange) {
        opts = def.ranges.map(function (r) { return r.label; });
      } else if (def.type === 'badge') {
        opts = discoverBadgeOptions(table, col);
      } else if (def.type === 'unique') {
        // Auto-discover unique text values in the column
        opts = discoverUniqueValues(table, col);
      } else {
        opts = def.options || [];
      }

      if (!opts.length) continue;

      var sel = document.createElement('select');
      sel.className = 'tppc-filter-select';
      sel.setAttribute('data-col', String(col));
      sel.setAttribute('data-filter-type', isRange ? 'range' : 'text');
      if (isRange) sel.setAttribute('data-ranges', JSON.stringify(def.ranges));
      sel.setAttribute('aria-label', label);

      var allOpt = document.createElement('option');
      allOpt.value = '';
      allOpt.textContent = label;
      sel.appendChild(allOpt);

      for (var o = 0; o < opts.length; o++) {
        var opt = document.createElement('option');
        opt.value = opts[o];
        opt.textContent = opts[o];
        sel.appendChild(opt);
      }

      bar.appendChild(sel);
      selects.push(sel);
    }

    // --- Clear link ---
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'tppc-filter-clear';
    clearBtn.textContent = 'Clear all';
    bar.appendChild(clearBtn);

    // --- Row count ---
    var countSpan = document.createElement('span');
    countSpan.className = 'tppc-filter-count';
    bar.appendChild(countSpan);

    // Insert bar before the table (or its wrapper)
    var tableWrap = table.closest('.report-table-wrap');
    var insertBefore = tableWrap || table;
    insertBefore.parentNode.insertBefore(bar, insertBefore);

    // -----------------------------------------------------------------------
    // 5. Filtering logic
    // -----------------------------------------------------------------------
    var rows = getFilterableRows(table);
    var totalRows = rows.length;

    function applyFilters() {
      var query = (search.value || '').toLowerCase();
      var dropdownFilters = [];
      for (var s = 0; s < selects.length; s++) {
        var val = selects[s].value;
        if (val) {
          var filterType = selects[s].getAttribute('data-filter-type');
          var filter = {
            col: parseInt(selects[s].getAttribute('data-col'), 10),
            value: val.toLowerCase(),
            type: filterType
          };
          if (filterType === 'range') {
            try {
              var ranges = JSON.parse(selects[s].getAttribute('data-ranges') || '[]');
              filter.range = null;
              for (var ri = 0; ri < ranges.length; ri++) {
                if (ranges[ri].label === val) {
                  filter.range = ranges[ri];
                  break;
                }
              }
            } catch (_) { filter.range = null; }
          }
          dropdownFilters.push(filter);
        }
      }

      var visibleCount = 0;

      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var show = true;

        // Text search — check all columns
        if (query) {
          var allText = getAllCellText(row).toLowerCase();
          if (allText.indexOf(query) === -1) {
            show = false;
          }
        }

        // Dropdown filters — AND logic
        if (show) {
          for (var f = 0; f < dropdownFilters.length; f++) {
            var df = dropdownFilters[f];
            var cellText = getCellText(row, df.col);

            if (df.type === 'range' && df.range) {
              // Numeric range filter
              var num = parseNumericFromCell(cellText);
              if (num == null) { show = false; break; }
              if (df.range.min != null && num < df.range.min) { show = false; break; }
              if (df.range.max != null && num > df.range.max) { show = false; break; }
            } else {
              // Text substring filter
              if (cellText.toLowerCase().indexOf(df.value) === -1) {
                show = false;
                break;
              }
            }
          }
        }

        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      }

      countSpan.textContent = visibleCount + ' of ' + totalRows + ' rows';
    }

    // --- Event listeners ---
    search.addEventListener('input', applyFilters);

    for (var s = 0; s < selects.length; s++) {
      selects[s].addEventListener('change', applyFilters);
    }

    clearBtn.addEventListener('click', function () {
      search.value = '';
      for (var s = 0; s < selects.length; s++) {
        selects[s].selectedIndex = 0;
      }
      applyFilters();
    });

    // Initial count
    applyFilters();
  }

  // -----------------------------------------------------------------------
  // 6. Public init — find all [data-filterable] wrappers and set up
  // -----------------------------------------------------------------------
  function init() {
    injectStyles();
    var wrappers = document.querySelectorAll('[data-filterable]');
    for (var i = 0; i < wrappers.length; i++) {
      buildFilterBar(wrappers[i]);
    }
  }

  // Expose on namespace
  window.TPPC.filters = {
    init: init
  };

  // Self-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
