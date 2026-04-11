/**
 * pages/action-plan.js — Action Plan & Strategy page renderer
 * Namespace: window.TPPC.pages['action-plan']
 */
(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'action-plan';

  var TAB_CONFIG = {
    qw: {
      key: 'quickWins',
      label: 'Quick Wins',
      empty: 'No quick wins were provided for this audit.'
    },
    st: {
      key: 'shortTerm',
      label: 'Short Term',
      empty: 'No short-term actions were provided for this audit.'
    },
    mt: {
      key: 'mediumTerm',
      label: 'Medium Term',
      empty: 'No medium-term actions were provided for this audit.'
    },
    lt: {
      key: 'longTerm',
      label: 'Long Term',
      empty: 'No long-term actions were provided for this audit.'
    }
  };

  function esc(value) {
    if (window.TPPC.utils && typeof window.TPPC.utils.esc === 'function') {
      return window.TPPC.utils.esc(value);
    }
    if (value == null) return '';
    return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function severityClass(value) {
    if (window.TPPC.utils && typeof window.TPPC.utils.severityClass === 'function') {
      return window.TPPC.utils.severityClass(value);
    }
    return 'info';
  }

  function pillClass(prefix, value) {
    if (window.TPPC.utils && typeof window.TPPC.utils.pillClass === 'function') {
      return window.TPPC.utils.pillClass(prefix, value);
    }
    return 'pill-' + prefix + '-medium';
  }

  function hideSection(sectionId) {
    var section = document.getElementById(sectionId);
    if (section) section.style.display = 'none';
  }

  function hasItems(list) {
    return Array.isArray(list) && list.length > 0;
  }

  function buildEmptyState(title, detail) {
    return '<div class="empty-state">' +
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 16.5h.008v.008H12V16.5Z" />' +
      '</svg>' +
      '<div class="text-base font-semibold text-slate-700">' + esc(title) + '</div>' +
      '<p class="mt-2 max-w-xl text-sm text-slate-500">' + esc(detail) + '</p>' +
    '</div>';
  }

  function buildActionItem(item, index) {
    var html = '<div class="bg-white border border-slate-200 rounded-xl p-4 no-break animate-in">' +
      '<div class="flex flex-wrap items-start gap-2 mb-1">' +
        '<span class="text-xs font-bold text-slate-400 bg-slate-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">' + (index + 1) + '</span>' +
        '<span class="font-semibold text-slate-800 flex-1 text-sm">' + esc(item.action || '') + '</span>';

    if (item.impact) {
      html += '<span class="severity-badge ' + severityClass(item.impact) + '">' + esc(item.impact) + '</span>';
    }

    if (item.effort) {
      html += '<span class="' + pillClass('effort', item.effort) + '">' + esc(item.effort) + ' effort</span>';
    }

    html += '</div>';

    if (item.why) {
      html += '<p class="text-xs text-slate-500 ml-8">' + esc(item.why) + '</p>';
    }

    html += '</div>';
    return html;
  }

  function resolveActionPlan(data) {
    var plan = data && data.actionPlan ? data.actionPlan : {};

    return {
      quickWins: hasItems(plan.quickWins) ? plan.quickWins : (hasItems(data.quickWins) ? data.quickWins : []),
      shortTerm: hasItems(plan.shortTerm) ? plan.shortTerm : [],
      mediumTerm: hasItems(plan.mediumTerm) ? plan.mediumTerm : [],
      longTerm: hasItems(plan.longTerm) ? plan.longTerm : []
    };
  }

  function firstAvailableTab(plan) {
    var order = ['qw', 'st', 'mt', 'lt'];
    var i;

    for (i = 0; i < order.length; i += 1) {
      if (hasItems(plan[TAB_CONFIG[order[i]].key])) {
        return order[i];
      }
    }

    return 'qw';
  }

  function activateTab(tabId) {
    var buttons = document.querySelectorAll('#section-plan [role="tab"]');
    var panels = document.querySelectorAll('#section-plan [role="tabpanel"]');

    buttons.forEach(function (button) {
      var isActive = button.getAttribute('data-tab') === tabId;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach(function (panel) {
      var isActive = panel.id === 'tab-' + tabId;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
  }

  function initTabs(defaultTabId) {
    var buttons = document.querySelectorAll('#section-plan [role="tab"]');
    var order = Array.prototype.slice.call(buttons);

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activateTab(button.getAttribute('data-tab'));
      });

      button.addEventListener('keydown', function (event) {
        var currentIndex;
        var nextIndex;

        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
          return;
        }

        event.preventDefault();
        currentIndex = order.indexOf(button);

        if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = order.length - 1;
        else if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % order.length;
        else nextIndex = (currentIndex - 1 + order.length) % order.length;

        order[nextIndex].focus();
        activateTab(order[nextIndex].getAttribute('data-tab'));
      });
    });

    activateTab(defaultTabId);
  }

  function renderActionPlanTabs(data) {
    var plan = resolveActionPlan(data || {});
    var tabIds = Object.keys(TAB_CONFIG);
    var hasAnyItems = false;
    var defaultTabId;

    tabIds.forEach(function (tabId) {
      var panel = document.getElementById('tab-' + tabId);
      var items = plan[TAB_CONFIG[tabId].key];

      if (!panel) return;
      if (hasItems(items)) hasAnyItems = true;

      panel.innerHTML = hasItems(items)
        ? '<div class="flex flex-col gap-3">' + items.map(buildActionItem).join('') + '</div>'
        : buildEmptyState(TAB_CONFIG[tabId].label, TAB_CONFIG[tabId].empty);
    });

    if (!hasAnyItems) {
      document.querySelectorAll('#section-plan [role="tab"]').forEach(function (button) {
        button.disabled = true;
      });
    }

    defaultTabId = firstAvailableTab(plan);
    initTabs(defaultTabId);
  }

  function renderContentCalendar(data) {
    var container = document.getElementById('calendar-container');
    var calendar = data && data.contentCalendar ? data.contentCalendar : {};
    var monthKeys = ['month1', 'month2', 'month3', 'month4', 'month5', 'month6'];
    var blocks = [];

    monthKeys.forEach(function (monthKey, index) {
      var weeks = calendar[monthKey];
      var label = calendar[monthKey + 'Label'] || ('Month ' + (index + 1));

      if (!hasItems(weeks)) return;

      blocks.push(
        '<div class="mb-6 no-break">' +
          '<div class="cal-month-header">' + esc(label) + '</div>' +
          '<div class="bg-white border border-slate-200 rounded-xl overflow-hidden">' +
            '<table class="cal-table">' +
              '<thead><tr>' +
                '<th>Wk</th><th>Topic</th><th>Target Keyword</th><th>Type</th>' +
              '</tr></thead>' +
              '<tbody>' +
              weeks.map(function (week) {
                return '<tr>' +
                  '<td class="font-semibold text-slate-600">' + esc(week.week) + '</td>' +
                  '<td class="text-slate-700">' + esc(week.topic || '') + '</td>' +
                  '<td class="text-blue-600 text-sm">' + esc(week.keyword || '') + '</td>' +
                  '<td><span class="severity-badge info">' + esc(week.type || '') + '</span></td>' +
                '</tr>';
              }).join('') +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>'
      );
    });

    if (!blocks.length) {
      hideSection('section-calendar');
      return;
    }

    container.innerHTML = blocks.join('');
  }

  function renderStrategyPillars(data) {
    var grid = document.getElementById('pillars-grid');
    var pillars = data && data.pillars;

    if (!hasItems(pillars)) {
      hideSection('section-pillars');
      return;
    }

    grid.innerHTML = pillars.map(function (pillar, index) {
      return '<div class="bg-white border border-slate-200 rounded-xl p-5 text-center no-break animate-in">' +
        '<div class="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Pillar ' + (index + 1) + '</div>' +
        '<div class="font-bold text-navy-800 text-sm mt-3 whitespace-pre-line">' + esc(pillar.title || '') + '</div>' +
        '<p class="text-sm text-slate-500 mt-3 whitespace-pre-line">' + esc(pillar.desc || '') + '</p>' +
        (pillar.time ? '<div class="mt-4"><span class="severity-badge info">' + esc(pillar.time) + '</span></div>' : '') +
      '</div>';
    }).join('');
  }

  function renderMediumTermRoadmap(data) {
    var list = document.getElementById('roadmap-list');
    var roadmap = data && data.mediumTermRoadmap;

    if (!hasItems(roadmap)) {
      hideSection('section-roadmap');
      return;
    }

    list.innerHTML = roadmap.map(function (item, index) {
      return '<div class="nextstep-card animate-in no-break">' +
        '<div class="nextstep-number">' + (index + 1) + '</div>' +
        '<div>' +
          '<div class="font-semibold text-slate-800">' + esc(item.title || '') + '</div>' +
          (item.detail ? '<p class="text-sm text-slate-500 mt-1">' + esc(item.detail) + '</p>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderLongTermStrategy(data) {
    var grid = document.getElementById('longterm-grid');
    var columns = data && data.longTermColumns;

    if (!hasItems(columns)) {
      hideSection('section-longterm');
      return;
    }

    grid.innerHTML = columns.map(function (column) {
      var items = hasItems(column.items) ? column.items : [];

      return '<div class="bg-white border border-slate-200 rounded-xl p-5 no-break">' +
        '<div class="font-bold text-navy-800 text-base">' + esc(column.title || '') + '</div>' +
        (
          items.length
            ? '<ul class="mt-4 space-y-2 text-sm text-slate-600">' +
                items.map(function (item) {
                  return '<li class="flex items-start gap-2">' +
                    '<span class="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>' +
                    '<span>' + esc(item) + '</span>' +
                  '</li>';
                }).join('') +
              '</ul>'
            : '<p class="mt-4 text-sm text-slate-400 italic">No long-term items provided.</p>'
        ) +
      '</div>';
    }).join('');
  }

  function renderAdvantages(data) {
    var grid = document.getElementById('advantages-grid');
    var advantages = data && data.advantages;

    if (!hasItems(advantages)) {
      hideSection('section-advantages');
      return;
    }

    grid.innerHTML = advantages.map(function (advantage) {
      return '<div class="advantage-card animate-in no-break">' +
        '<div class="adv-title flex items-center gap-2">' +
          '<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />' +
          '</svg>' +
          esc(advantage.title || '') +
        '</div>' +
        '<div class="adv-detail">' + esc(advantage.detail || '') + '</div>' +
      '</div>';
    }).join('');
  }

  function buildCreatedListCard(title, items, noun) {
    return '<div class="bg-white border border-slate-200 rounded-xl p-5 no-break">' +
      '<div class="flex items-center justify-between gap-3 mb-4">' +
        '<div class="font-semibold text-slate-800">' + esc(title) + '</div>' +
        '<span class="severity-badge info">' + items.length + ' ' + esc(noun) + '</span>' +
      '</div>' +
      '<ul class="space-y-2 text-sm text-slate-600">' +
        items.map(function (item) {
          return '<li class="flex items-start gap-2">' +
            '<span class="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>' +
            '<span>' + esc(item) + '</span>' +
          '</li>';
        }).join('') +
      '</ul>' +
    '</div>';
  }

  function renderDeliverables(data) {
    var container = document.getElementById('deliverables-container');
    var deliverables = data && data.deliverables;
    var keyPages = hasItems(data && data.keyPagesCreated) ? data.keyPagesCreated : [];
    var blogPosts = hasItems(data && data.blogPostsCreated) ? data.blogPostsCreated : [];
    var html = '';

    if (!hasItems(deliverables) && !keyPages.length && !blogPosts.length) {
      hideSection('section-deliverables');
      return;
    }

    if (hasItems(deliverables)) {
      html += '<div data-filterable data-filters=\'[{"col":2,"label":"Impact","type":"badge"},{"col":3,"label":"Effort","type":"badge"}]\'>' +
        '<div class="report-table-wrap">' +
        '<table class="report-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Deliverable</th>' +
              '<th>Scope</th>' +
              '<th>Score</th>' +
              '<th>Status</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            deliverables.map(function (deliverable) {
              return '<tr class="no-break">' +
                '<td class="font-medium">' + esc(deliverable.name || '') + '</td>' +
                '<td>' + esc(deliverable.scope || '') + '</td>' +
                '<td>' + esc(deliverable.score || '') + '</td>' +
                '<td>' + esc(deliverable.status || '') + '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '</div>';
    }

    if (keyPages.length || blogPosts.length) {
      html += '<div class="grid gap-4 lg:grid-cols-2' + (html ? ' mt-6' : '') + '">';

      if (keyPages.length) {
        html += buildCreatedListCard('Key Pages Created', keyPages, 'pages');
      }

      if (blogPosts.length) {
        html += buildCreatedListCard('Blog Posts Created', blogPosts, 'posts');
      }

      html += '</div>';
    }

    container.innerHTML = html;
  }

  function setPageTitle(data) {
    var client = data && data.client ? data.client : {};
    var label = client.name || client.company || client.website || 'SEO Audit';
    document.title = 'SEO Audit Report - Action Plan - ' + label;
  }

  function renumberSections() {
    var count = 0;

    document.querySelectorAll('.report-section').forEach(function (section) {
      var numberEl;

      if (section.style.display === 'none') return;
      numberEl = section.querySelector('.section-number');
      if (!numberEl) return;

      count += 1;
      numberEl.textContent = count;
    });
  }

  window.TPPC.pages['action-plan'] = {
    init: function (data) {
      setPageTitle(data || {});
      this.renderActionPlanTabs(data || {});
      this.renderContentCalendar(data || {});
      this.renderStrategyPillars(data || {});
      this.renderMediumTermRoadmap(data || {});
      this.renderLongTermStrategy(data || {});
      this.renderAdvantages(data || {});
      this.renderDeliverables(data || {});
      renumberSections();
      if (window.TPPC.filters) window.TPPC.filters.init();
    },
    renderActionPlanTabs: renderActionPlanTabs,
    renderContentCalendar: renderContentCalendar,
    renderStrategyPillars: renderStrategyPillars,
    renderMediumTermRoadmap: renderMediumTermRoadmap,
    renderLongTermStrategy: renderLongTermStrategy,
    renderAdvantages: renderAdvantages,
    renderDeliverables: renderDeliverables
  };

  var bootAttempts = 0;

  function bootWhenReady() {
    if (typeof window.TPPC.boot === 'function') {
      window.TPPC.boot();
      return;
    }

    if (bootAttempts >= 200) {
      return;
    }

    bootAttempts += 1;
    window.setTimeout(bootWhenReady, 25);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootWhenReady);
  } else {
    bootWhenReady();
  }
})();
