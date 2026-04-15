/**
 * shared/search.js — Ctrl+K search modal
 * Namespace: window.TPPC.search
 * Requires: utils.js, data-loader.js
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  var _modalEl = null;
  var _inputEl = null;
  var _resultsEl = null;
  var _focusedIndex = -1;
  var _currentResults = [];

  function init() {
    _createModal();
    _bindGlobalKeys();
  }

  function _createModal() {
    var existing = document.getElementById('search-modal');
    if (existing) { _modalEl = existing; _bindModalEvents(); return; }

    _modalEl = document.createElement('div');
    _modalEl.id = 'search-modal';
    _modalEl.setAttribute('role', 'dialog');
    _modalEl.setAttribute('aria-modal', 'true');
    _modalEl.setAttribute('aria-label', 'Search report');

    _modalEl.innerHTML =
      '<div class="search-modal__box">' +
        '<div class="search-modal__input-wrap">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>' +
          '<input type="text" class="search-modal__input" id="search-modal-input" placeholder="Search keywords, issues, pages..." autocomplete="off" spellcheck="false">' +
        '</div>' +
        '<div class="search-modal__results" id="search-modal-results"></div>' +
        '<div class="search-modal__footer">' +
          '<kbd>Enter</kbd> to open &nbsp; <kbd>&uarr;&darr;</kbd> navigate &nbsp; <kbd>Esc</kbd> close' +
        '</div>' +
      '</div>';

    document.body.appendChild(_modalEl);
    _bindModalEvents();
  }

  function _bindModalEvents() {
    _inputEl = document.getElementById('search-modal-input');
    _resultsEl = document.getElementById('search-modal-results');

    // Close on backdrop click
    _modalEl.addEventListener('click', function (e) {
      if (e.target === _modalEl) closeModal();
    });

    // Input handler
    if (_inputEl) {
      _inputEl.addEventListener('input', function () {
        _handleInput(_inputEl.value);
      });
      _inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); _moveFocus(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); _moveFocus(-1); }
        else if (e.key === 'Enter') { _selectFocused(); }
        else if (e.key === 'Escape') { closeModal(); }
      });
    }
  }

  function _bindGlobalKeys() {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openModal();
      }
    });
  }

  function openModal() {
    if (!_modalEl) _createModal();
    _modalEl.classList.add('open');
    _focusedIndex = -1;
    if (_inputEl) {
      _inputEl.value = '';
      _inputEl.focus();
    }
    if (_resultsEl) _resultsEl.innerHTML = '';
    _currentResults = [];
  }

  function closeModal() {
    if (_modalEl) _modalEl.classList.remove('open');
  }

  function _handleInput(query) {
    var esc = (window.TPPC.utils && window.TPPC.utils.esc) || function(s) { return s; };
    var index = window.TPPC.searchIndex || [];

    if (!query || query.trim().length < 2) {
      _resultsEl.innerHTML = '';
      _currentResults = [];
      _focusedIndex = -1;
      return;
    }

    var q = query.toLowerCase();
    var matches = [];

    for (var i = 0; i < index.length && matches.length < 20; i++) {
      var entry = index[i];
      var haystack = [
        (entry.title || '').toLowerCase(),
        (entry.snippet || '').toLowerCase()
      ].concat((entry.terms || []).map(function (t) { return (t || '').toLowerCase(); }));

      var found = false;
      for (var j = 0; j < haystack.length; j++) {
        if (haystack[j].indexOf(q) !== -1) { found = true; break; }
      }
      if (found) matches.push(entry);
    }

    _currentResults = matches;
    _focusedIndex = -1;
    _renderResults(matches, esc);
  }

  function _renderResults(matches, esc) {
    if (!_resultsEl) return;

    if (!matches.length) {
      _resultsEl.innerHTML = '<div class="search-modal__empty">No results found</div>';
      return;
    }

    // Group by page
    var groups = {};
    var groupOrder = [];
    matches.forEach(function (m) {
      if (!groups[m.page]) { groups[m.page] = []; groupOrder.push(m.page); }
      groups[m.page].push(m);
    });

    var html = '';
    var itemIndex = 0;
    groupOrder.forEach(function (page) {
      var pageLabel = page.replace('.html', '').replace(/-/g, ' ');
      pageLabel = pageLabel.charAt(0).toUpperCase() + pageLabel.slice(1);
      html += '<div class="search-results__group-label">' + esc(pageLabel) + '</div>';
      groups[page].forEach(function (entry) {
        html += '<a href="' + esc(entry.page) + '#' + esc(entry.section) + '"' +
          ' class="search-results__item" data-result-index="' + itemIndex + '">' +
          '<div class="search-results__item-title">' + esc(entry.title) + '</div>' +
          '<div class="search-results__item-snippet">' + esc(entry.snippet) + '</div>' +
          '</a>';
        itemIndex++;
      });
    });

    _resultsEl.innerHTML = html;
  }

  function _moveFocus(dir) {
    var items = _resultsEl ? _resultsEl.querySelectorAll('.search-results__item') : [];
    if (!items.length) return;

    // Remove current focus
    if (_focusedIndex >= 0 && items[_focusedIndex]) {
      items[_focusedIndex].classList.remove('focused');
    }

    _focusedIndex = _focusedIndex + dir;
    if (_focusedIndex < 0) _focusedIndex = items.length - 1;
    if (_focusedIndex >= items.length) _focusedIndex = 0;

    if (items[_focusedIndex]) {
      items[_focusedIndex].classList.add('focused');
      items[_focusedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  function _selectFocused() {
    var items = _resultsEl ? _resultsEl.querySelectorAll('.search-results__item') : [];
    if (_focusedIndex >= 0 && items[_focusedIndex]) {
      window.location.href = items[_focusedIndex].getAttribute('href');
      closeModal();
    }
  }

  window.TPPC.search = {
    init: init,
    openModal: openModal,
    closeModal: closeModal
  };

})();
