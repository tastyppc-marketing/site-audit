/**
 * shared/nav.js — TastyPPC PPC Audit Report navigation
 * Adapted from SEO report nav for PPC-specific pages
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  window.TPPC.NAV_CONFIG = [
    {
      id: 'index',
      title: 'Dashboard',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>',
      href: 'index.html',
      sections: [
        { id: 'section-score', title: 'Account Score' },
        { id: 'section-overview', title: 'Key Metrics' },
        { id: 'section-findings', title: 'Top Findings' },
        { id: 'section-recommendations', title: 'Recommendations' }
      ]
    },
    {
      id: 'structure',
      title: 'Structure',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Z" /></svg>',
      href: 'structure.html',
      sections: [
        { id: 'section-campaigns', title: 'Campaigns' },
        { id: 'section-adgroups', title: 'Ad Groups' },
        { id: 'section-matchtypes', title: 'Match Types' },
        { id: 'section-duplicates', title: 'Duplicates' }
      ]
    },
    {
      id: 'quality-score',
      title: 'Quality Score',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>',
      href: 'quality-score.html',
      sections: [
        { id: 'section-account-qs', title: 'Account QS' },
        { id: 'section-distribution', title: 'QS Distribution' },
        { id: 'section-components', title: 'Sub-Components' },
        { id: 'section-top-spenders', title: 'Top Spenders' }
      ]
    },
    {
      id: 'wasted-spend',
      title: 'Wasted Spend',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>',
      href: 'wasted-spend.html',
      sections: [
        { id: 'section-summary', title: 'Spend Overview' },
        { id: 'section-zero-conv', title: 'Zero Conversions' },
        { id: 'section-overspending', title: 'Overspending' },
        { id: 'section-broad-match', title: 'Broad Match' }
      ]
    },
    {
      id: 'search-terms',
      title: 'Search Terms',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>',
      href: 'search-terms.html',
      sections: [
        { id: 'section-ngrams', title: 'N-gram Analysis' },
        { id: 'section-negatives', title: 'Negative Candidates' },
        { id: 'section-top-terms', title: 'Top Search Terms' }
      ]
    },
    {
      id: 'budget',
      title: 'Budget',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>',
      href: 'budget.html',
      sections: [
        { id: 'section-strategies', title: 'Bidding Strategies' },
        { id: 'section-impression-share', title: 'Impression Share' },
        { id: 'section-pacing', title: 'Budget Pacing' }
      ]
    },
    {
      id: 'action-plan',
      title: 'Action Plan',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>',
      href: 'action-plan.html',
      sections: [
        { id: 'section-critical', title: 'Critical Actions' },
        { id: 'section-high', title: 'High Priority' },
        { id: 'section-medium', title: 'Medium Priority' },
        { id: 'section-negatives-add', title: 'Negatives to Add' }
      ]
    }
  ];

  // Reuse the same nav rendering logic from SEO report
  var _drawerOpen = false;

  function init() {
    var currentFile = window.location.pathname.split('/').pop() || 'index.html';
    if (!currentFile || currentFile === '') currentFile = 'index.html';
    window.TPPC.currentPage = currentFile.replace('.html', '');

    _renderTopNav();
    _renderSideNav();
    _renderMobileDrawer();
    _initScrollspy();
  }

  function _renderTopNav() {
    var nav = document.getElementById('top-nav');
    if (!nav) return;

    var currentId = window.TPPC.currentPage;
    var linksHTML = '';
    window.TPPC.NAV_CONFIG.forEach(function (page) {
      var isActive = (page.id === currentId || (currentId === '' && page.id === 'index'));
      linksHTML += '<a href="' + page.href + '" class="top-nav__link' + (isActive ? ' active' : '') + '">' +
        page.icon + page.title +
      '</a>';
    });

    nav.innerHTML =
      '<a href="index.html" class="top-nav__logo">' +
        '<img src="assets/tasty-ppc-logo.svg" alt="TastyPPC" width="32" height="32" onerror="this.style.display=\'none\'">' +
        '<span class="top-nav__logo-text">TastyPPC</span>' +
        '<span style="font-size:0.65rem;color:#94a3b8;margin-left:4px">PPC</span>' +
      '</a>' +
      '<div class="top-nav__links">' + linksHTML + '</div>' +
      '<div class="top-nav__actions">' +
        '<button class="top-nav__search-btn" id="search-open-btn" title="Search (Ctrl+K)">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>' +
          'Search <kbd>Ctrl K</kbd>' +
        '</button>' +
        '<button class="top-nav__hamburger" id="hamburger-btn" title="Menu">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>' +
        '</button>' +
      '</div>';

    var hamburger = document.getElementById('hamburger-btn');
    if (hamburger) hamburger.addEventListener('click', _toggleDrawer);

    var searchBtn = document.getElementById('search-open-btn');
    if (searchBtn && window.TPPC.search) searchBtn.addEventListener('click', window.TPPC.search.openModal);
  }

  function _renderSideNav() {
    var aside = document.getElementById('side-nav');
    if (!aside) return;

    var currentId = window.TPPC.currentPage;
    var pageConfig = null;
    for (var i = 0; i < window.TPPC.NAV_CONFIG.length; i++) {
      if (window.TPPC.NAV_CONFIG[i].id === currentId) {
        pageConfig = window.TPPC.NAV_CONFIG[i];
        break;
      }
    }

    if (!pageConfig || !pageConfig.sections.length) {
      aside.style.display = 'none';
      return;
    }

    aside.className = 'side-nav';
    var linksHTML = '<div class="side-nav__title">' + (pageConfig.title || '') + '</div>';
    pageConfig.sections.forEach(function (s) {
      linksHTML += '<a href="#' + s.id + '" class="side-nav__link" data-section="' + s.id + '">' + s.title + '</a>';
    });
    aside.innerHTML = linksHTML;

    aside.querySelectorAll('.side-nav__link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(link.getAttribute('data-section'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function _renderMobileDrawer() {
    var drawer = document.getElementById('mobile-drawer');
    if (!drawer) return;

    var linksHTML = '<div class="mobile-drawer__header"><span>PPC Audit</span><button id="drawer-close" class="mobile-drawer__close">&times;</button></div>';
    window.TPPC.NAV_CONFIG.forEach(function (page) {
      linksHTML += '<a href="' + page.href + '" class="mobile-drawer__link">' + page.icon + page.title + '</a>';
    });
    drawer.innerHTML = '<div class="mobile-drawer__backdrop"></div><div class="mobile-drawer__panel">' + linksHTML + '</div>';

    var closeBtn = document.getElementById('drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', _closeDrawer);

    var backdrop = drawer.querySelector('.mobile-drawer__backdrop');
    if (backdrop) backdrop.addEventListener('click', _closeDrawer);
  }

  function _toggleDrawer() {
    var drawer = document.getElementById('mobile-drawer');
    if (drawer) { _drawerOpen = !_drawerOpen; drawer.classList.toggle('open', _drawerOpen); }
  }

  function _closeDrawer() {
    var drawer = document.getElementById('mobile-drawer');
    if (drawer) { _drawerOpen = false; drawer.classList.remove('open'); }
  }

  function _initScrollspy() {
    if (!('IntersectionObserver' in window)) return;
    var currentId = window.TPPC.currentPage;
    var pageConfig = null;
    for (var i = 0; i < window.TPPC.NAV_CONFIG.length; i++) {
      if (window.TPPC.NAV_CONFIG[i].id === currentId) { pageConfig = window.TPPC.NAV_CONFIG[i]; break; }
    }
    if (!pageConfig) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var links = document.querySelectorAll('.side-nav__link');
          links.forEach(function (l) { l.classList.remove('active'); });
          var active = document.querySelector('.side-nav__link[data-section="' + entry.target.id + '"]');
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

    pageConfig.sections.forEach(function (s) {
      var el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
  }

  window.TPPC.nav = { init: init };
})();
