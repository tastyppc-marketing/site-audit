/**
 * shared/nav.js — TastyPPC top nav + side nav + scrollspy
 * Namespace: window.TPPC.nav
 * Requires: utils.js loaded before this
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};

  // -------------------------------------------------------------------------
  // Navigation config — all 9 pages with their sections
  // -------------------------------------------------------------------------
  window.TPPC.NAV_CONFIG = [
    {
      id: 'index',
      title: 'Summary',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>',
      href: 'index.html',
      sections: [
        { id: 'section-hero',       title: 'Overview' },
        { id: 'section-stats',      title: 'Key Stats' },
        { id: 'section-issues',     title: 'Top Issues' },
        { id: 'section-comparison', title: 'Comparison' },
        { id: 'section-quickwins',  title: 'Quick Wins' },
        { id: 'section-nextsteps',  title: 'Next Steps' }
      ]
    },
    {
      id: 'keywords',
      title: 'Keywords',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>',
      href: 'keywords.html',
      sections: [
        { id: 'section-rankings', title: 'Rankings' },
        { id: 'section-volume',   title: 'Search Volume' },
        { id: 'section-organic',  title: 'Organic Visibility' },
        { id: 'section-gsc',      title: 'Search Console' },
        { id: 'section-traffic',  title: 'Traffic' },
        { id: 'section-rank-history', title: 'Rank History' }
      ]
    },
    {
      id: 'content',
      title: 'Content',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>',
      href: 'content.html',
      sections: [
        { id: 'section-overview',        title: 'Content Overview' },
        { id: 'section-readability',     title: 'Readability' },
        { id: 'section-thin',            title: 'Thin Content' },
        { id: 'section-duplicates',      title: 'Duplicates' },
        { id: 'section-cannibalization', title: 'Cannibalization' },
        { id: 'section-structure',       title: 'Content Structure' }
      ]
    },
    {
      id: 'technical',
      title: 'Technical',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>',
      href: 'technical.html',
      sections: [
        { id: 'section-cwv',           title: 'Core Web Vitals' },
        { id: 'section-pagespeed',     title: 'PageSpeed' },
        { id: 'section-schema',        title: 'Schema Markup' },
        { id: 'section-meta',          title: 'Meta Tags' },
        { id: 'section-crawl',         title: 'Crawl Issues' },
        { id: 'section-sitestructure', title: 'Site Structure' }
      ]
    },
    {
      id: 'links',
      title: 'Internal Links',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>',
      href: 'links.html',
      sections: [
        { id: 'section-linkstats', title: 'Link Overview' },
        { id: 'section-orphans',   title: 'Orphan Pages' },
        { id: 'section-hubs',      title: 'Hub & Spoke' },
        { id: 'section-depth',     title: 'Link Depth' }
      ]
    },
    {
      id: 'backlink-opportunities',
      title: 'Backlinks',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>',
      href: 'backlink-opportunities.html',
      sections: [
        { id: 'section-insights',           title: 'Key Insights' },
        { id: 'section-backlinks',          title: 'Your Backlinks' },
        { id: 'section-summary',            title: 'Overview' },
        { id: 'section-top-opportunities',  title: 'Top Opportunities' },
        { id: 'section-intelligence',       title: 'Backlink Intelligence' },
        { id: 'section-details',            title: 'Detailed Analysis' }
      ]
    },
    {
      id: 'competitors',
      title: 'Competitors',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>',
      href: 'competitors.html',
      sections: [
        { id: 'section-comparison',  title: 'Comparison' },
        { id: 'section-radar',       title: 'Health Radar' },
        { id: 'section-strategies',  title: 'Strategies' },
        { id: 'section-domains',     title: 'Domain Metrics' },
        { id: 'section-pagespeedcomp', title: 'PageSpeed' }
      ]
    },
    {
      id: 'local',
      title: 'Local',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>',
      href: 'local.html',
      sections: [
        { id: 'section-gbp',         title: 'Business Profile' },
        { id: 'section-localperf',   title: 'Local Performance' },
        { id: 'section-citations',   title: 'Citations' },
        { id: 'section-servicemap',  title: 'Service Area Map' },
        { id: 'section-mappack',     title: 'Map Pack' }
      ]
    },
    {
      id: 'action-plan',
      title: 'Action Plan',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>',
      href: 'action-plan.html',
      sections: [
        { id: 'section-plan',          title: 'Priority Action Plan' },
        { id: 'section-calendar',      title: 'Content Calendar' },
        { id: 'section-pillars',       title: 'Strategy Pillars' },
        { id: 'section-roadmap',       title: 'Medium-Term Roadmap' },
        { id: 'section-longterm',      title: 'Long-Term Strategy' },
        { id: 'section-advantages',    title: 'Advantages' },
        { id: 'section-deliverables',  title: 'Deliverables' }
      ]
    }
  ];

  // -------------------------------------------------------------------------
  // Nav init
  // -------------------------------------------------------------------------
  function init() {
    // Detect current page
    var currentFile = window.location.pathname.split('/').pop() || 'index.html';
    if (!currentFile || currentFile === '') currentFile = 'index.html';
    window.TPPC.currentPage = currentFile.replace('.html', '');

    _renderTopNav();
    _renderSideNav();
    _renderMobileDrawer();
    _initScrollspy();
  }

  // -------------------------------------------------------------------------
  // Top nav
  // -------------------------------------------------------------------------
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

    // Hamburger click
    var hamburger = document.getElementById('hamburger-btn');
    if (hamburger) {
      hamburger.addEventListener('click', _toggleDrawer);
    }

    // Search button click
    var searchBtn = document.getElementById('search-open-btn');
    if (searchBtn && window.TPPC.search) {
      searchBtn.addEventListener('click', window.TPPC.search.openModal);
    }
  }

  // -------------------------------------------------------------------------
  // Side nav
  // -------------------------------------------------------------------------
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

    var html = '<div class="side-nav__heading">' + pageConfig.title + '</div>';
    pageConfig.sections.forEach(function (s) {
      html += '<a href="#' + s.id + '" class="side-nav__link" data-section="' + s.id + '">' + s.title + '</a>';
    });

    aside.innerHTML = html;
  }

  // -------------------------------------------------------------------------
  // Mobile drawer
  // -------------------------------------------------------------------------
  function _renderMobileDrawer() {
    var drawer = document.getElementById('mobile-drawer');
    if (!drawer) return;

    var currentId = window.TPPC.currentPage;

    var linksHTML = '';
    window.TPPC.NAV_CONFIG.forEach(function (page) {
      var isActive = page.id === currentId;
      linksHTML += '<a href="' + page.href + '" class="mobile-drawer__link' + (isActive ? ' active' : '') + '">' +
        page.icon + page.title +
      '</a>';
    });

    drawer.innerHTML =
      '<div class="mobile-drawer__backdrop" id="drawer-backdrop"></div>' +
      '<div class="mobile-drawer__panel">' +
        '<div class="mobile-drawer__close">' +
          '<button id="drawer-close-btn">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>' +
          '</button>' +
        '</div>' +
        linksHTML +
      '</div>';

    var backdrop = document.getElementById('drawer-backdrop');
    if (backdrop) backdrop.addEventListener('click', _closeDrawer);

    var closeBtn = document.getElementById('drawer-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', _closeDrawer);
  }

  function _toggleDrawer() {
    var drawer = document.getElementById('mobile-drawer');
    if (!drawer) return;
    if (drawer.classList.contains('open')) {
      _closeDrawer();
    } else {
      drawer.classList.add('open');
    }
  }

  function _closeDrawer() {
    var drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  // -------------------------------------------------------------------------
  // Scrollspy via IntersectionObserver
  // -------------------------------------------------------------------------
  function _initScrollspy() {
    if (!('IntersectionObserver' in window)) return;

    var currentId = window.TPPC.currentPage;
    var pageConfig = null;
    for (var i = 0; i < window.TPPC.NAV_CONFIG.length; i++) {
      if (window.TPPC.NAV_CONFIG[i].id === currentId) {
        pageConfig = window.TPPC.NAV_CONFIG[i];
        break;
      }
    }
    if (!pageConfig) return;

    // Track which sections are currently visible, pick topmost
    var visibleSections = {};

    function activateTopmost() {
      var best = null;
      var bestTop = Infinity;
      for (var id in visibleSections) {
        if (!visibleSections[id]) continue;
        var el = document.getElementById(id);
        if (!el) continue;
        var rect = el.getBoundingClientRect();
        var dist = Math.abs(rect.top - 80);
        if (rect.top < window.innerHeight && rect.bottom > 0 && dist < bestTop) {
          bestTop = dist;
          best = id;
        }
      }
      if (best) {
        var allLinks = document.querySelectorAll('.side-nav__link');
        allLinks.forEach(function (l) { l.classList.remove('active'); });
        var matching = document.querySelector('.side-nav__link[data-section="' + best + '"]');
        if (matching) matching.classList.add('active');
      }
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visibleSections[entry.target.id] = entry.isIntersecting;
      });
      activateTopmost();
    }, { rootMargin: '-60px 0px -35% 0px', threshold: [0, 0.1] });

    pageConfig.sections.forEach(function (s) {
      var el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    // Throttled scroll listener for smooth tracking during fast scrolling
    var scrollTimer = null;
    window.addEventListener('scroll', function () {
      if (scrollTimer) return;
      scrollTimer = setTimeout(function () {
        scrollTimer = null;
        activateTopmost();
      }, 80);
    }, { passive: true });
  }

  window.TPPC.nav = {
    init: init
  };

})();
