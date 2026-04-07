(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'backlink-opportunities';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function esc(value) {
    if (window.TPPC.utils && typeof window.TPPC.utils.esc === 'function') {
      return window.TPPC.utils.esc(value);
    }
    if (value == null) return '';
    return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatNumber(value) {
    return window.TPPC.utils && typeof window.TPPC.utils.formatNumber === 'function'
      ? window.TPPC.utils.formatNumber(value)
      : (value == null ? '' : Number(value).toLocaleString());
  }

  // ---------------------------------------------------------------------------
  // Overlap display: small dots + named competitors with "show more"
  // ---------------------------------------------------------------------------
  var overlapExpandCounter = 0;

  function renderOverlapCell(opp) {
    overlapExpandCounter++;
    var id = 'overlap-expand-' + overlapExpandCounter;
    var hasComps = opp.competitors;
    var totalComps = COMPETITORS.length;

    var dots = '<div class="flex gap-0.5 items-center mb-1">';
    for (var j = 0; j < COMPETITORS.length; j++) {
      var has = hasComps.indexOf(COMPETITORS[j].domain) !== -1;
      dots += '<span style="display:inline-block;width:14px;height:14px;border-radius:50%;' +
        (has ? 'background:var(--sev-low)' : 'background:#e2e8f0') +
        '" title="' + esc(COMPETITORS[j].domain) + '"></span>';
    }
    dots += '<span style="font-size:0.7rem;color:#64748b;margin-left:6px;font-weight:600">' +
      hasComps.length + '/' + totalComps + '</span>';
    dots += '</div>';

    var maxVisible = 2;
    var names = '';
    for (var k = 0; k < hasComps.length && k < maxVisible; k++) {
      names += '<span style="font-size:0.75rem;color:#475569">' + esc(hasComps[k]) + '</span>';
      if (k < Math.min(hasComps.length, maxVisible) - 1) names += '<br>';
    }

    var remaining = hasComps.length - maxVisible;
    if (remaining > 0) {
      var toggleId = 'overlap-toggle-' + overlapExpandCounter;
      names += '<a href="javascript:void(0)" id="' + toggleId + '" onclick="(function(el){' +
        'var t=document.getElementById(\'' + id + '\');' +
        'var open=t.style.display===\'none\';' +
        't.style.display=open?\'block\':\'none\';' +
        'el.style.display=open?\'none\':\'block\'' +
        '})(this)" style="font-size:0.7rem;color:var(--accent-blue);text-decoration:none;display:block;margin-top:2px">+' + remaining + ' more</a>';
      names += '<div id="' + id + '" style="display:none;margin-top:2px">';
      for (var m = maxVisible; m < hasComps.length; m++) {
        names += '<span style="font-size:0.75rem;color:#475569">' + esc(hasComps[m]) + '</span><br>';
      }
      names += '<a href="javascript:void(0)" onclick="(function(el){' +
        'var t=document.getElementById(\'' + id + '\');' +
        'var btn=document.getElementById(\'' + toggleId + '\');' +
        't.style.display=\'none\';btn.style.display=\'block\'' +
        '})(this)" style="font-size:0.7rem;color:var(--accent-blue);text-decoration:none;display:block;margin-top:4px">show less</a>';
      names += '</div>';
    }

    return dots + names;
  }

  // Type badge colors
  var TYPE_COLORS = {
    directory: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    social: { bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4' },
    press: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    industry: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    blog: { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc' },
    forum: { bg: '#f3e8ff', color: '#6b21a8', border: '#c4b5fd' },
    government: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    educational: { bg: '#ccfbf1', color: '#134e4a', border: '#5eead4' },
    other: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
  };

  function typeBadge(type) {
    var c = TYPE_COLORS[type] || TYPE_COLORS.other;
    return '<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:9999px;font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:' + c.bg + ';color:' + c.color + ';border:1px solid ' + c.border + '">' + esc(type) + '</span>';
  }

  var LOCAL_COLORS = {
    local: { bg: '#dcfce7', color: '#166534', border: '#86efac', label: 'Local' },
    national: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', label: 'National' },
    international: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Intl' }
  };

  function localBadge(relevance) {
    var c = LOCAL_COLORS[relevance] || LOCAL_COLORS.international;
    return '<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:9999px;font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:' + c.bg + ';color:' + c.color + ';border:1px solid ' + c.border + '">' + c.label + '</span>';
  }

  var EFFORT_COLORS = {
    easy: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    medium: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    hard: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
  };

  function effortBadge(effort) {
    var c = EFFORT_COLORS[effort] || EFFORT_COLORS.medium;
    return '<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:9999px;font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:' + c.bg + ';color:' + c.color + ';border:1px solid ' + c.border + '">' + esc(effort) + '</span>';
  }

  // ---------------------------------------------------------------------------
  // MOCKUP DATA
  // ---------------------------------------------------------------------------
  var COMPETITORS = [
    { domain: 'justinhavre.com', backlinks: 47564, referringDomains: 1162, dofollowRatio: 0.72, typeCounts: { directory: 45, press: 12, social: 8, industry: 22, blog: 15, forum: 3, other: 95 } },
    { domain: 'calgaryhomes.ca', backlinks: 5792, referringDomains: 1016, dofollowRatio: 0.68, typeCounts: { directory: 52, press: 5, social: 7, industry: 18, blog: 20, forum: 1, other: 97 } },
    { domain: 'calgaryhousefinder.ca', backlinks: 1473, referringDomains: 433, dofollowRatio: 0.71, typeCounts: { directory: 38, press: 2, social: 6, industry: 10, blog: 8, forum: 0, other: 136 } },
    { domain: 'kirbycox.com', backlinks: 3375, referringDomains: 443, dofollowRatio: 0.65, typeCounts: { directory: 30, press: 4, social: 9, industry: 12, blog: 5, forum: 2, other: 138 } },
    { domain: 'reevesrealty.ca', backlinks: 523, referringDomains: 61, dofollowRatio: 0.58, typeCounts: { directory: 12, press: 0, social: 4, industry: 3, blog: 2, forum: 0, other: 40 } },
    { domain: 'bestcalgaryhomes.com', backlinks: 1842, referringDomains: 581, dofollowRatio: 0.70, typeCounts: { directory: 42, press: 3, social: 7, industry: 15, blog: 12, forum: 1, other: 101 } },
    { domain: 'thinkcalgaryhomes.com', backlinks: 497, referringDomains: 107, dofollowRatio: 0.62, typeCounts: { directory: 15, press: 1, social: 5, industry: 4, blog: 3, forum: 0, other: 79 } }
  ];

  var CLIENT = { domain: 'sellingcalgarycastles.com', backlinks: 280, referringDomains: 209, dofollowRatio: 0.65, typeCounts: { directory: 3, press: 0, social: 0, industry: 1, blog: 0, forum: 0, other: 205 } };

  var MOCK_OPPORTUNITIES = [
    { domain: 'yellowpages.ca', dr: 72, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','calgaryhousefinder.ca','kirbycox.com','reevesrealty.ca','bestcalgaryhomes.com','thinkcalgaryhomes.com'], score: 96, type: 'directory', localRelevance: 'national', effort: 'easy' },
    { domain: 'facebook.com', dr: 96, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','calgaryhousefinder.ca','kirbycox.com','reevesrealty.ca','bestcalgaryhomes.com','thinkcalgaryhomes.com'], score: 98, type: 'social', localRelevance: 'international', effort: 'easy' },
    { domain: 'calgaryherald.com', dr: 82, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','calgaryhousefinder.ca','kirbycox.com','bestcalgaryhomes.com'], score: 94, type: 'press', localRelevance: 'local', effort: 'hard' },
    { domain: 'realtor.ca', dr: 78, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','calgaryhousefinder.ca','kirbycox.com'], score: 88, type: 'industry', localRelevance: 'national', effort: 'medium' },
    { domain: 'instagram.com', dr: 94, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','kirbycox.com','bestcalgaryhomes.com'], score: 91, type: 'social', localRelevance: 'international', effort: 'easy' },
    { domain: 'linkedin.com', dr: 98, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','kirbycox.com'], score: 89, type: 'social', localRelevance: 'international', effort: 'easy' },
    { domain: 'bbb.org', dr: 85, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','kirbycox.com','bestcalgaryhomes.com'], score: 87, type: 'directory', localRelevance: 'national', effort: 'easy' },
    { domain: 'zillow.com', dr: 92, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca'], score: 80, type: 'industry', localRelevance: 'international', effort: 'medium' },
    { domain: 'creb.com', dr: 65, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','calgaryhousefinder.ca','reevesrealty.ca'], score: 79, type: 'industry', localRelevance: 'local', effort: 'medium' },
    { domain: 'betterdwelling.com', dr: 71, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','bestcalgaryhomes.com'], score: 75, type: 'press', localRelevance: 'national', effort: 'hard' },
    { domain: 'yelp.ca', dr: 74, clientHas: false, competitors: ['justinhavre.com','kirbycox.com','bestcalgaryhomes.com'], score: 73, type: 'directory', localRelevance: 'national', effort: 'easy' },
    { domain: 'globalnews.ca', dr: 88, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca'], score: 72, type: 'press', localRelevance: 'national', effort: 'hard' },
    { domain: 'canada411.ca', dr: 58, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca','kirbycox.com'], score: 68, type: 'directory', localRelevance: 'national', effort: 'easy' },
    { domain: 'point2homes.com', dr: 61, clientHas: false, competitors: ['justinhavre.com','calgaryhousefinder.ca','bestcalgaryhomes.com'], score: 66, type: 'industry', localRelevance: 'national', effort: 'medium' },
    { domain: 'newhomelistingservice.com', dr: 55, clientHas: true, competitors: ['justinhavre.com','calgaryhousefinder.ca','bestcalgaryhomes.com'], score: 62, type: 'industry', localRelevance: 'national', effort: 'easy' },
    { domain: 'ratehub.ca', dr: 68, clientHas: false, competitors: ['justinhavre.com','calgaryhomes.ca'], score: 58, type: 'industry', localRelevance: 'national', effort: 'medium' },
    { domain: 'odp.org', dr: 48, clientHas: true, competitors: ['justinhavre.com','calgaryhomes.ca'], score: 52, type: 'directory', localRelevance: 'international', effort: 'easy' },
    { domain: 'homefinder.ca', dr: 44, clientHas: false, competitors: ['calgaryhousefinder.ca','thinkcalgaryhomes.com'], score: 39, type: 'industry', localRelevance: 'national', effort: 'medium' },
    { domain: 'cirrealty.ca', dr: 52, clientHas: true, competitors: ['reevesrealty.ca'], score: 38, type: 'industry', localRelevance: 'local', effort: 'easy' },
    { domain: 'weddingwire.ca', dr: 42, clientHas: false, competitors: ['kirbycox.com'], score: 28, type: 'other', localRelevance: 'national', effort: 'medium' }
  ];

  // Computed stats
  var missingDomains = MOCK_OPPORTUNITIES.filter(function(o) { return !o.clientHas; });
  var sharedDomains = MOCK_OPPORTUNITIES.filter(function(o) { return o.clientHas; });
  var highPriority = missingDomains.filter(function(o) { return o.competitors.length >= 3; });
  var localOpps = MOCK_OPPORTUNITIES.filter(function(o) { return o.localRelevance === 'local'; });

  // ---------------------------------------------------------------------------
  // Section 1: Summary + Chart + Insight
  // ---------------------------------------------------------------------------
  function renderSummary() {
    var el = document.getElementById('summary-content');
    if (!el) return;

    var avgCompetitorBacklinks = Math.round(COMPETITORS.reduce(function(s, c) { return s + c.backlinks; }, 0) / COMPETITORS.length);
    var avgCompetitorRD = Math.round(COMPETITORS.reduce(function(s, c) { return s + c.referringDomains; }, 0) / COMPETITORS.length);

    // Stat cards
    var html = '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">' +
      '<div class="stat-card severity-red">' +
        '<div class="stat-value">' + highPriority.length + '</div>' +
        '<div class="stat-label">High-Priority Gaps</div>' +
        '<div style="font-size:0.7rem;color:#94a3b8;margin-top:2px">Shared by 3+ competitors</div>' +
      '</div>' +
      '<div class="stat-card" style="border-left:3px solid var(--accent-blue)">' +
        '<div class="stat-value" style="color:var(--accent-blue)">' + MOCK_OPPORTUNITIES.length + '</div>' +
        '<div class="stat-label">Total Referring Domains Analyzed</div>' +
        '<div style="font-size:0.7rem;color:#94a3b8;margin-top:2px">Across all ' + COMPETITORS.length + ' competitors</div>' +
      '</div>' +
      '<div class="stat-card severity-green">' +
        '<div class="stat-value">' + sharedDomains.length + '</div>' +
        '<div class="stat-label">Already Shared</div>' +
        '<div style="font-size:0.7rem;color:#94a3b8;margin-top:2px">You have links from these</div>' +
      '</div>' +
      '<div class="stat-card severity-orange">' +
        '<div class="stat-value">' + formatNumber(CLIENT.referringDomains) + '</div>' +
        '<div class="stat-label">Your Referring Domains</div>' +
        '<div style="font-size:0.7rem;color:#94a3b8;margin-top:2px">Competitor avg: ' + formatNumber(avgCompetitorRD) + '</div>' +
      '</div>' +
    '</div>';

    // Insight card with actionable guidance
    var easyHighPriority = highPriority.filter(function(o) { return o.effort === 'easy'; });
    var mediumOpps = missingDomains.filter(function(o) { return o.effort === 'medium'; });
    html += '<div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #bbf7d0;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:2rem">' +
      '<div style="font-weight:700;color:#166534;margin-bottom:0.5rem;display:flex;align-items:center;gap:8px">' +
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>' +
        'Key Insight' +
      '</div>' +
      '<p style="font-size:0.9rem;color:#15803d;line-height:1.6;margin:0 0 0.75rem 0">' +
        'You have <strong>' + CLIENT.referringDomains + '</strong> referring domains. The average competitor has <strong>' + avgCompetitorRD + '</strong>. ' +
        'There are <strong>' + highPriority.length + ' high-priority domains</strong> that 3 or more competitors share but you don\'t have. ' +
        'Of these, <strong>' + easyHighPriority.length + ' are directories or listings</strong> where getting listed is straightforward. ' +
        'There are also <strong>' + localOpps.length + ' locally relevant</strong> referring domains specific to Calgary/Alberta.' +
      '</p>' +
      '<div style="border-top:1px solid #bbf7d0;padding-top:0.75rem">' +
        '<div style="font-weight:700;color:#166534;font-size:0.82rem;margin-bottom:0.5rem">Recommended Next Steps</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">' +
          '<div style="background:rgba(255,255,255,0.7);border-radius:8px;padding:8px 12px">' +
            '<div style="font-size:0.7rem;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em">This week</div>' +
            '<div style="font-size:0.82rem;color:#166534;margin-top:2px">Submit to <strong>' + easyHighPriority.length + ' easy</strong> directories &amp; listings (~15 min each)</div>' +
          '</div>' +
          '<div style="background:rgba(255,255,255,0.7);border-radius:8px;padding:8px 12px">' +
            '<div style="font-size:0.7rem;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em">This month</div>' +
            '<div style="font-size:0.82rem;color:#166534;margin-top:2px">Outreach to <strong>' + mediumOpps.length + ' medium-effort</strong> industry sites &amp; associations</div>' +
          '</div>' +
          '<div style="background:rgba(255,255,255,0.7);border-radius:8px;padding:8px 12px">' +
            '<div style="font-size:0.7rem;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em">Ongoing</div>' +
            '<div style="font-size:0.82rem;color:#166534;margin-top:2px">Target <strong>' + localOpps.length + ' local</strong> links for maximum local SEO impact</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    // Referring domains bar chart
    html += '<div class="chart-container chart-tall" style="margin-bottom:1rem;position:relative">' +
      '<div style="font-weight:600;color:var(--navy-800);margin-bottom:0.75rem">Referring Domains: You vs Competitors</div>' +
      '<div style="position:relative;height:' + ((COMPETITORS.length + 1) * 48 + 40) + 'px">' +
        '<canvas id="rd-comparison-chart"></canvas>' +
      '</div>' +
    '</div>';

    el.innerHTML = html;

    // Render chart after DOM update
    setTimeout(function() { renderRDChart(); }, 100);
  }

  function renderRDChart() {
    var ctx = document.getElementById('rd-comparison-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    var labels = [CLIENT.domain];
    var values = [CLIENT.referringDomains];
    var colors = ['rgba(59,130,246,0.85)'];

    for (var i = 0; i < COMPETITORS.length; i++) {
      labels.push(COMPETITORS[i].domain);
      values.push(COMPETITORS[i].referringDomains);
      colors.push('rgba(100,116,139,0.6)');
    }

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
          barThickness: 28
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { left: 4, right: 16, top: 4, bottom: 4 } },
        scales: {
          x: {
            type: 'logarithmic',
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: function(v) { return v.toLocaleString(); },
              font: { family: 'Inter', size: 11 },
              maxRotation: 0
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', size: 12, weight: '500' },
              padding: 8
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) { return ctx.raw.toLocaleString() + ' referring domains'; }
            }
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Section 2: Top Opportunities (with type/local/effort tags)
  // ---------------------------------------------------------------------------
  function renderTopOpportunities() {
    var el = document.getElementById('top-opportunities-content');
    if (!el) return;

    var top10 = MOCK_OPPORTUNITIES.slice().sort(function(a, b) { return b.score - a.score; }).slice(0, 10);

    var rows = '';
    for (var i = 0; i < top10.length; i++) {
      var opp = top10[i];
      var expandId = 'top-opp-detail-' + i;

      var priorityBadge = '';
      if (opp.clientHas) {
        priorityBadge = '<span class="severity-badge low">Already Have</span>';
      } else if (opp.competitors.length >= 3) {
        priorityBadge = '<span class="severity-badge high">High Priority</span>';
      } else {
        priorityBadge = '<span class="severity-badge info">Worth Exploring</span>';
      }

      // Expanded detail row content
      var compList = '';
      for (var cl = 0; cl < opp.competitors.length; cl++) {
        compList += '<span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:0.72rem;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;margin:2px">' + esc(opp.competitors[cl]) + '</span>';
      }
      var actionHint = '';
      if (opp.effort === 'easy') actionHint = 'Submit your listing or claim your profile on this site.';
      else if (opp.effort === 'medium') actionHint = 'Requires outreach — contact the site or apply for inclusion.';
      else actionHint = 'Earned link — requires content creation, PR outreach, or partnership.';

      rows += '<tr>' +
        '<td>' +
          '<button class="top-opp-expand-btn" data-target="' + expandId + '" style="width:28px;height:28px;border-radius:50%;border:1px solid #e2e8f0;background:white;cursor:pointer;font-weight:700;font-size:0.8rem;color:var(--accent-blue);display:flex;align-items:center;justify-content:center;transition:all 0.15s;font-family:inherit">' +
            '<span style="transition:transform 0.2s;display:inline-block">&#9660;</span>' +
          '</button>' +
        '</td>' +
        '<td>' +
          '<div style="font-weight:600;color:var(--accent-blue)">' + esc(opp.domain) + '</div>' +
          '<div class="flex gap-1 mt-1 flex-wrap">' + typeBadge(opp.type) + localBadge(opp.localRelevance) + '</div>' +
        '</td>' +
        '<td class="text-center">' + opp.dr + '</td>' +
        '<td class="text-center">' + effortBadge(opp.effort) + '</td>' +
        '<td>' + renderOverlapCell(opp) + '</td>' +
        '<td>' +
          '<div class="flex items-center gap-2">' +
            '<div style="flex:1;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden">' +
              '<div style="height:100%;width:' + opp.score + '%;border-radius:4px;background:linear-gradient(90deg,var(--accent-blue),var(--accent-indigo))"></div>' +
            '</div>' +
            '<span style="font-size:0.8rem;font-weight:700;color:var(--navy-800);min-width:28px">' + opp.score + '</span>' +
          '</div>' +
        '</td>' +
        '<td>' + priorityBadge + '</td>' +
      '</tr>' +
      '<tr id="' + expandId + '" style="display:none">' +
        '<td colspan="7" style="padding:0">' +
          '<div style="background:#f8fafc;border-top:2px solid var(--accent-blue);padding:1rem 1.25rem">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
              '<div>' +
                '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:6px">Competitors with this link (' + opp.competitors.length + '/' + COMPETITORS.length + ')</div>' +
                '<div style="display:flex;flex-wrap:wrap;gap:2px">' + compList + '</div>' +
              '</div>' +
              '<div>' +
                '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:6px">Suggested Action</div>' +
                '<div style="font-size:0.82rem;color:#475569;line-height:1.5">' + actionHint + '</div>' +
                '<div style="margin-top:8px;font-size:0.78rem">' +
                  '<span style="color:#64748b">Domain Rating:</span> <strong style="color:var(--navy-800)">' + opp.dr + '/100</strong>' +
                  '<span style="color:#64748b;margin-left:12px">Score:</span> <strong style="color:var(--navy-800)">' + opp.score + '/100</strong>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }

    el.innerHTML =
      '<div class="report-table-wrap">' +
        '<table class="report-table">' +
          '<thead><tr>' +
            '<th style="width:40px"></th>' +
            '<th>Referring Domain</th>' +
            '<th class="text-center">DR</th>' +
            '<th class="text-center">Difficulty</th>' +
            '<th>Competitor Overlap</th>' +
            '<th>Opportunity Score</th>' +
            '<th>Priority</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';

    // Wire expand buttons
    el.querySelectorAll('.top-opp-expand-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var target = document.getElementById(this.getAttribute('data-target'));
        if (!target) return;
        var open = target.style.display !== 'none';
        target.style.display = open ? 'none' : 'table-row';
        var arrow = this.querySelector('span');
        if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)';
        this.style.background = open ? 'white' : 'var(--accent-blue)';
        this.style.color = open ? 'var(--accent-blue)' : 'white';
        this.style.borderColor = open ? '#e2e8f0' : 'var(--accent-blue)';
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Profile Similarity: full pairwise data + helpers
  // ---------------------------------------------------------------------------
  var SIMILARITY_PAIRS = (function() {
    // All pairwise overlaps (mockup data). In production, computed from DFS intersection API.
    var all = [CLIENT.domain];
    for (var i = 0; i < COMPETITORS.length; i++) all.push(COMPETITORS[i].domain);

    // Mockup similarity percentages for every pair (symmetric)
    var raw = {
      'sellingcalgarycastles.com|justinhavre.com': 8,
      'sellingcalgarycastles.com|calgaryhomes.ca': 11,
      'sellingcalgarycastles.com|calgaryhousefinder.ca': 14,
      'sellingcalgarycastles.com|kirbycox.com': 9,
      'sellingcalgarycastles.com|reevesrealty.ca': 18,
      'sellingcalgarycastles.com|bestcalgaryhomes.com': 12,
      'sellingcalgarycastles.com|thinkcalgaryhomes.com': 15,
      'justinhavre.com|calgaryhomes.ca': 34,
      'justinhavre.com|calgaryhousefinder.ca': 21,
      'justinhavre.com|kirbycox.com': 18,
      'justinhavre.com|reevesrealty.ca': 10,
      'justinhavre.com|bestcalgaryhomes.com': 24,
      'justinhavre.com|thinkcalgaryhomes.com': 13,
      'calgaryhomes.ca|calgaryhousefinder.ca': 26,
      'calgaryhomes.ca|kirbycox.com': 20,
      'calgaryhomes.ca|reevesrealty.ca': 12,
      'calgaryhomes.ca|bestcalgaryhomes.com': 25,
      'calgaryhomes.ca|thinkcalgaryhomes.com': 16,
      'calgaryhousefinder.ca|kirbycox.com': 15,
      'calgaryhousefinder.ca|reevesrealty.ca': 11,
      'calgaryhousefinder.ca|bestcalgaryhomes.com': 19,
      'calgaryhousefinder.ca|thinkcalgaryhomes.com': 22,
      'kirbycox.com|reevesrealty.ca': 7,
      'kirbycox.com|bestcalgaryhomes.com': 28,
      'kirbycox.com|thinkcalgaryhomes.com': 10,
      'reevesrealty.ca|bestcalgaryhomes.com': 9,
      'reevesrealty.ca|thinkcalgaryhomes.com': 6,
      'bestcalgaryhomes.com|thinkcalgaryhomes.com': 17
    };

    var pairs = [];
    for (var key in raw) {
      var parts = key.split('|');
      pairs.push({ a: parts[0], b: parts[1], pct: raw[key] });
    }
    return pairs;
  })();

  function getSimilarity(domA, domB) {
    if (domA === domB) return 100;
    for (var i = 0; i < SIMILARITY_PAIRS.length; i++) {
      var p = SIMILARITY_PAIRS[i];
      if ((p.a === domA && p.b === domB) || (p.a === domB && p.b === domA)) return p.pct;
    }
    return 0;
  }

  function heatColor(pct) {
    // Low (blue-tinted) to high (deep indigo)
    if (pct <= 10) return '#eff6ff';
    if (pct <= 15) return '#dbeafe';
    if (pct <= 20) return '#93c5fd';
    if (pct <= 25) return '#60a5fa';
    if (pct <= 30) return '#3b82f6';
    if (pct <= 40) return '#6366f1';
    return '#4338ca';
  }

  function renderPairDetail(domA, domB) {
    var el = document.getElementById('sim-pair-detail');
    if (!el) return;

    if (domA === domB) {
      el.innerHTML = '<div style="padding:1.5rem;text-align:center;color:#94a3b8;font-style:italic">Select two different domains to compare.</div>';
      return;
    }

    var pct = getSimilarity(domA, domB);

    // Find shared opportunities (both have links from)
    var shared = [];
    var onlyA = [];
    var onlyB = [];
    for (var i = 0; i < MOCK_OPPORTUNITIES.length; i++) {
      var opp = MOCK_OPPORTUNITIES[i];
      var aHas = (domA === CLIENT.domain ? opp.clientHas : opp.competitors.indexOf(domA) !== -1);
      var bHas = (domB === CLIENT.domain ? opp.clientHas : opp.competitors.indexOf(domB) !== -1);
      if (aHas && bHas) shared.push(opp);
      else if (aHas && !bHas) onlyA.push(opp);
      else if (!aHas && bHas) onlyB.push(opp);
    }

    var labelA = domA === CLIENT.domain ? 'You' : domA;
    var labelB = domB === CLIENT.domain ? 'You' : domB;

    var html = '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1.25rem">';

    // Overlap stat + bar
    html += '<div style="display:flex;align-items:center;gap:16px;margin-bottom:1.25rem">' +
      '<div style="font-size:2rem;font-weight:800;color:var(--navy-800)">' + pct + '%</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:0.85rem;font-weight:600;color:var(--navy-800);margin-bottom:6px">Profile Overlap</div>' +
        '<div style="height:10px;background:#e2e8f0;border-radius:5px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;border-radius:5px;background:linear-gradient(90deg,var(--accent-blue),var(--accent-indigo))"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

    // Three-column breakdown
    html += '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:start">';

    // Only A
    html += '<div>' +
      '<div style="font-size:0.75rem;font-weight:700;color:var(--accent-blue);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Only ' + esc(labelA) + ' (' + onlyA.length + ')</div>';
    var showA = onlyA.slice(0, 5);
    for (var a = 0; a < showA.length; a++) {
      html += '<div style="font-size:0.78rem;color:#475569;padding:3px 0;border-bottom:1px solid #f1f5f9">' + esc(showA[a].domain) + ' <span style="color:#94a3b8">DR ' + showA[a].dr + '</span></div>';
    }
    if (onlyA.length > 5) html += '<div style="font-size:0.72rem;color:#94a3b8;padding-top:4px">+' + (onlyA.length - 5) + ' more</div>';
    html += '</div>';

    // Shared (center)
    html += '<div style="text-align:center;padding:0 12px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">' +
      '<div style="font-size:0.75rem;font-weight:700;color:var(--sev-low);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Shared (' + shared.length + ')</div>';
    var showS = shared.slice(0, 5);
    for (var s = 0; s < showS.length; s++) {
      html += '<div style="font-size:0.78rem;color:#475569;padding:3px 0;border-bottom:1px solid #f1f5f9">' + esc(showS[s].domain) + ' <span style="color:#94a3b8">DR ' + showS[s].dr + '</span></div>';
    }
    if (shared.length > 5) html += '<div style="font-size:0.72rem;color:#94a3b8;padding-top:4px">+' + (shared.length - 5) + ' more</div>';
    html += '</div>';

    // Only B
    html += '<div>' +
      '<div style="font-size:0.75rem;font-weight:700;color:var(--accent-indigo);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Only ' + esc(labelB) + ' (' + onlyB.length + ')</div>';
    var showB = onlyB.slice(0, 5);
    for (var b = 0; b < showB.length; b++) {
      html += '<div style="font-size:0.78rem;color:#475569;padding:3px 0;border-bottom:1px solid #f1f5f9">' + esc(showB[b].domain) + ' <span style="color:#94a3b8">DR ' + showB[b].dr + '</span></div>';
    }
    if (onlyB.length > 5) html += '<div style="font-size:0.72rem;color:#94a3b8;padding-top:4px">+' + (onlyB.length - 5) + ' more</div>';
    html += '</div>';

    html += '</div></div>';
    el.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // Section 3: Backlink Intelligence
  // ---------------------------------------------------------------------------
  function renderIntelligence() {
    var el = document.getElementById('intelligence-content');
    if (!el) return;

    var html = '';

    // --- 3a: Type Breakdown Chart ---
    html += '<div style="margin-bottom:2.5rem">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--navy-800);margin-bottom:0.5rem">Link Type Breakdown</h3>' +
      '<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem">What kinds of sites link to you vs your competitors. Link diversity signals a natural, healthy backlink profile.</p>' +
      '<div class="chart-container" style="position:relative;height:400px"><canvas id="type-breakdown-chart"></canvas></div>' +
    '</div>';

    // --- 3b: Link Type Gaps ---
    html += '<div style="margin-bottom:2.5rem">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--navy-800);margin-bottom:0.5rem">Link Type Gaps</h3>' +
      '<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem">Areas where competitors are getting links that you\'re not. These gaps represent link-building strategies you haven\'t tapped yet.</p>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';

    var types = ['press', 'directory', 'social', 'industry', 'blog'];
    for (var t = 0; t < types.length; t++) {
      var typeName = types[t];
      var clientCount = CLIENT.typeCounts[typeName] || 0;
      var maxComp = null;
      var maxCount = 0;
      for (var c = 0; c < COMPETITORS.length; c++) {
        var cc = COMPETITORS[c].typeCounts[typeName] || 0;
        if (cc > maxCount) { maxCount = cc; maxComp = COMPETITORS[c].domain; }
      }
      if (maxCount > clientCount) {
        var gapSeverity = clientCount === 0 ? 'critical' : (maxCount > clientCount * 5 ? 'high' : 'medium');
        var borderColor = gapSeverity === 'critical' ? 'var(--sev-critical)' : (gapSeverity === 'high' ? 'var(--sev-high)' : 'var(--sev-medium)');
        html += '<div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid ' + borderColor + ';border-radius:12px;padding:1rem 1.25rem">' +
          '<div class="flex items-center gap-2 mb-2">' + typeBadge(typeName) + '</div>' +
          '<div style="font-size:1.5rem;font-weight:800;color:var(--navy-800)">' + clientCount + ' <span style="font-size:0.85rem;font-weight:400;color:#94a3b8">vs</span> ' + maxCount + '</div>' +
          '<div style="font-size:0.8rem;color:#64748b;margin-top:4px">You have ' + clientCount + ' ' + typeName + ' backlinks. <strong>' + esc(maxComp) + '</strong> has ' + maxCount + '.</div>' +
        '</div>';
      }
    }
    html += '</div></div>';

    // --- 3c: Local Relevance ---
    html += '<div style="margin-bottom:2.5rem">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--navy-800);margin-bottom:0.5rem">Locally Relevant Opportunities</h3>' +
      '<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem">Links from Calgary and Alberta-specific sites carry extra weight for local SEO. These are your highest-value targets.</p>';

    if (localOpps.length > 0) {
      html += '<div class="report-table-wrap"><table class="report-table"><thead><tr>' +
        '<th>Domain</th><th class="text-center">DR</th><th>Type</th><th>Effort</th><th class="text-center">You Have?</th>' +
        '</tr></thead><tbody>';
      for (var l = 0; l < localOpps.length; l++) {
        var lo = localOpps[l];
        html += '<tr>' +
          '<td style="font-weight:600">' + esc(lo.domain) + ' ' + localBadge('local') + '</td>' +
          '<td class="text-center">' + lo.dr + '</td>' +
          '<td>' + typeBadge(lo.type) + '</td>' +
          '<td>' + effortBadge(lo.effort) + '</td>' +
          '<td class="text-center" style="color:' + (lo.clientHas ? 'var(--sev-low)' : 'var(--sev-critical)') + ';font-weight:600">' + (lo.clientHas ? 'Yes' : 'No') + '</td>' +
        '</tr>';
      }
      html += '</tbody></table></div>';
    } else {
      html += '<p style="color:#94a3b8;font-style:italic">No locally relevant referring domains found.</p>';
    }
    html += '</div>';

    // --- 3d: DR Distribution ---
    html += '<div style="margin-bottom:2.5rem">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--navy-800);margin-bottom:0.5rem">Domain Rating Distribution</h3>' +
      '<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem">Quality spread of referring domains. A healthy profile has links from a range of DR levels, weighted toward mid-to-high authority.</p>' +
      '<div class="chart-container" style="position:relative;height:300px"><canvas id="dr-distribution-chart"></canvas></div>' +
    '</div>';

    // --- 3e: Dofollow Ratios ---
    html += '<div style="margin-bottom:2.5rem">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--navy-800);margin-bottom:0.5rem">Dofollow Ratio Comparison</h3>' +
      '<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem">Percentage of referring domains passing link authority. Higher is better, but a natural profile typically falls between 60-80%.</p>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">';

    // Client dofollow
    html += renderDofollowCard(CLIENT.domain, CLIENT.dofollowRatio, true);
    for (var d = 0; d < COMPETITORS.length; d++) {
      html += renderDofollowCard(COMPETITORS[d].domain, COMPETITORS[d].dofollowRatio, false);
    }
    html += '</div></div>';

    // --- 3f: Link Velocity ---
    html += '<div style="margin-bottom:2.5rem">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--navy-800);margin-bottom:0.5rem">Link Velocity</h3>' +
      '<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem">How actively competitors are building links. Based on first-seen dates of referring domains.</p>' +
      '<div class="chart-container" style="position:relative;height:300px"><canvas id="velocity-chart"></canvas></div>' +
    '</div>';

    // --- 3g: Profile Similarity (heatmap + pair picker) ---
    html += '<div style="margin-bottom:1rem">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--navy-800);margin-bottom:0.5rem">Backlink Profile Similarity</h3>' +
      '<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem">How much overlap exists between backlink profiles. High overlap means similar link-building strategies — these competitors fish in the same pond.</p>';

    // Build all pairwise overlaps sorted for quick-glance
    var sortedPairs = SIMILARITY_PAIRS.slice().sort(function(a, b) { return b.pct - a.pct; });
    var top3 = sortedPairs.slice(0, 3);
    var lowest = sortedPairs[sortedPairs.length - 1];

    // --- Quick-glance insight cards ---
    html += '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:1.5rem">';

    // Top 3 overlaps
    for (var q = 0; q < top3.length; q++) {
      var pair = top3[q];
      var medalColors = ['#f59e0b', '#94a3b8', '#cd7f32'];
      var medalLabels = ['Highest Overlap', '2nd Highest', '3rd Highest'];
      html += '<div style="flex:1;min-width:200px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1rem 1.25rem;border-top:3px solid ' + medalColors[q] + '">' +
        '<div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:' + medalColors[q] + ';margin-bottom:8px">' + medalLabels[q] + '</div>' +
        '<div style="font-size:1.75rem;font-weight:800;color:var(--navy-800)">' + pair.pct + '%</div>' +
        '<div style="font-size:0.78rem;color:#64748b;margin-top:4px;line-height:1.4">' +
          '<strong>' + esc(pair.a) + '</strong> &amp; <strong>' + esc(pair.b) + '</strong>' +
        '</div>' +
        '<div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-top:8px">' +
          '<div style="height:100%;width:' + pair.pct + '%;border-radius:3px;background:' + medalColors[q] + '"></div>' +
        '</div>' +
      '</div>';
    }

    // Lowest overlap
    html += '<div style="flex:1;min-width:200px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1rem 1.25rem;border-top:3px solid var(--accent-blue)">' +
      '<div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--accent-blue);margin-bottom:8px">Most Distinct</div>' +
      '<div style="font-size:1.75rem;font-weight:800;color:var(--navy-800)">' + lowest.pct + '%</div>' +
      '<div style="font-size:0.78rem;color:#64748b;margin-top:4px;line-height:1.4">' +
        '<strong>' + esc(lowest.a) + '</strong> &amp; <strong>' + esc(lowest.b) + '</strong>' +
      '</div>' +
      '<div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-top:8px">' +
        '<div style="height:100%;width:' + lowest.pct + '%;border-radius:3px;background:var(--accent-blue)"></div>' +
      '</div>' +
    '</div>';
    html += '</div>';

    // --- Heatmap matrix ---
    html += '<div style="margin-bottom:1.5rem">' +
      '<div style="font-size:0.85rem;font-weight:600;color:var(--navy-800);margin-bottom:0.75rem">Overlap Heatmap</div>' +
      '<div class="report-table-wrap" style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:0.75rem;font-family:Inter,system-ui,sans-serif">' +
      '<thead><tr><td style="padding:4px 8px"></td>';

    var allDomains = [CLIENT.domain];
    for (var ad = 0; ad < COMPETITORS.length; ad++) allDomains.push(COMPETITORS[ad].domain);

    // Short labels for column headers: strip TLD, truncate if needed
    function shortLabel(domain, idx) {
      if (idx === 0) return 'You';
      return domain.replace(/\.(com|ca|org|net)$/i, '');
    }

    for (var h = 0; h < allDomains.length; h++) {
      var isYou = h === 0;
      html += '<td style="padding:4px 2px;text-align:center;font-weight:600;font-size:0.65rem;color:' + (isYou ? 'var(--accent-blue)' : '#64748b') + ';max-width:68px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(allDomains[h]) + '">' +
        shortLabel(allDomains[h], h) + '</td>';
    }
    html += '</tr></thead><tbody>';

    for (var r = 0; r < allDomains.length; r++) {
      var isYouRow = r === 0;
      html += '<tr><td style="font-weight:600;font-size:0.72rem;white-space:nowrap;padding:4px 8px 4px 0;color:' + (isYouRow ? 'var(--accent-blue)' : 'var(--navy-800)') + '" title="' + esc(allDomains[r]) + '">' +
        shortLabel(allDomains[r], r) + '</td>';

      for (var col = 0; col < allDomains.length; col++) {
        if (r === col) {
          html += '<td style="background:#1e293b;color:white;font-weight:700;font-size:0.7rem;text-align:center;padding:6px 2px">&mdash;</td>';
        } else {
          var pct = getSimilarity(allDomains[r], allDomains[col]);
          var cellBg = heatColor(pct);
          var textColor = pct > 30 ? 'white' : 'var(--navy-800)';
          html += '<td class="similarity-cell" data-a="' + esc(allDomains[r]) + '" data-b="' + esc(allDomains[col]) + '" style="background:' + cellBg + ';color:' + textColor + ';font-weight:600;font-size:0.7rem;text-align:center;padding:6px 2px;cursor:pointer" title="' + esc(allDomains[r]) + ' vs ' + esc(allDomains[col]) + ' — click to compare">' + pct + '%</td>';
        }
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-top:6px">' +
        '<span style="font-size:0.7rem;color:#94a3b8">Low</span>' +
        '<div style="height:8px;flex:1;max-width:200px;border-radius:4px;background:linear-gradient(90deg,#eff6ff,#93c5fd,#3b82f6,#6366f1,#4338ca)"></div>' +
        '<span style="font-size:0.7rem;color:#94a3b8">High</span>' +
        '<span style="font-size:0.7rem;color:#94a3b8;margin-left:8px">Click any cell to compare</span>' +
      '</div>' +
    '</div>';

    // --- Pair picker + detail ---
    html += '<div style="margin-bottom:1rem">' +
      '<div style="font-size:0.85rem;font-weight:600;color:var(--navy-800);margin-bottom:0.75rem">Compare Two Profiles</div>' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:1rem">' +
        '<select id="sim-picker-a" style="border:1px solid #e2e8f0;border-radius:8px;padding:0.4rem 0.75rem;font-size:0.8rem;background:white;font-family:inherit">';
    for (var pa = 0; pa < allDomains.length; pa++) {
      html += '<option value="' + esc(allDomains[pa]) + '"' + (pa === 0 ? ' selected' : '') + '>' + (pa === 0 ? 'You (' + esc(allDomains[0]) + ')' : esc(allDomains[pa])) + '</option>';
    }
    html += '</select>' +
        '<span style="font-size:0.85rem;color:#94a3b8;font-weight:600">vs</span>' +
        '<select id="sim-picker-b" style="border:1px solid #e2e8f0;border-radius:8px;padding:0.4rem 0.75rem;font-size:0.8rem;background:white;font-family:inherit">';
    for (var pb = 0; pb < allDomains.length; pb++) {
      html += '<option value="' + esc(allDomains[pb]) + '"' + (pb === 1 ? ' selected' : '') + '>' + (pb === 0 ? 'You (' + esc(allDomains[0]) + ')' : esc(allDomains[pb])) + '</option>';
    }
    html += '</select>' +
      '</div>' +
      '<div id="sim-pair-detail"></div>' +
    '</div>';

    html += '</div>';

    el.innerHTML = html;

    // Render charts + wire similarity interactions
    setTimeout(function() {
      renderTypeChart();
      renderDRDistributionChart();
      renderVelocityChart();

      // Default pair detail: client vs top competitor
      var allDomains = [CLIENT.domain];
      for (var i = 0; i < COMPETITORS.length; i++) allDomains.push(COMPETITORS[i].domain);
      renderPairDetail(allDomains[0], allDomains[1]);

      // Auto-update on dropdown change
      function onPickerChange() {
        var a = document.getElementById('sim-picker-a').value;
        var b = document.getElementById('sim-picker-b').value;
        renderPairDetail(a, b);
      }
      var pickerA = document.getElementById('sim-picker-a');
      var pickerB = document.getElementById('sim-picker-b');
      if (pickerA) pickerA.addEventListener('change', onPickerChange);
      if (pickerB) pickerB.addEventListener('change', onPickerChange);

      // Heatmap cell clicks
      var cells = document.querySelectorAll('.similarity-cell');
      for (var c = 0; c < cells.length; c++) {
        cells[c].addEventListener('click', function() {
          var a = this.getAttribute('data-a');
          var b = this.getAttribute('data-b');
          document.getElementById('sim-picker-a').value = a;
          document.getElementById('sim-picker-b').value = b;
          renderPairDetail(a, b);
          // Scroll to pair detail
          var detail = document.getElementById('sim-pair-detail');
          if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    }, 150);
  }

  function renderDofollowCard(domain, ratio, isClient) {
    var pct = Math.round(ratio * 100);
    var barColor = pct >= 70 ? 'var(--sev-low)' : (pct >= 55 ? 'var(--sev-medium)' : 'var(--sev-critical)');
    return '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1rem;' + (isClient ? 'border-left:3px solid var(--accent-blue)' : '') + '">' +
      '<div style="font-size:0.8rem;font-weight:600;color:' + (isClient ? 'var(--accent-blue)' : 'var(--navy-800)') + ';margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(domain) + '">' + esc(domain) + '</div>' +
      '<div style="font-size:1.5rem;font-weight:800;color:var(--navy-800)">' + pct + '%</div>' +
      '<div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-top:6px">' +
        '<div style="height:100%;width:' + pct + '%;border-radius:3px;background:' + barColor + '"></div>' +
      '</div>' +
    '</div>';
  }

  function renderTypeChart() {
    var ctx = document.getElementById('type-breakdown-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    var types = ['directory', 'press', 'social', 'industry', 'blog', 'other'];
    var typeColors = ['#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#6366f1', '#94a3b8'];

    var datasets = [];
    // Client first
    datasets.push({
      label: CLIENT.domain,
      data: types.map(function(t) { return CLIENT.typeCounts[t] || 0; }),
      backgroundColor: 'rgba(59,130,246,0.85)',
      borderRadius: 4
    });

    var compColors = ['rgba(100,116,139,0.65)', 'rgba(139,92,246,0.5)', 'rgba(236,72,153,0.5)', 'rgba(16,185,129,0.5)', 'rgba(245,158,11,0.5)', 'rgba(239,68,68,0.4)', 'rgba(20,184,166,0.4)'];
    for (var i = 0; i < COMPETITORS.length; i++) {
      datasets.push({
        label: COMPETITORS[i].domain,
        data: types.map(function(t) { return COMPETITORS[i].typeCounts[t] || 0; }),
        backgroundColor: compColors[i % compColors.length],
        borderRadius: 4
      });
    }

    new Chart(ctx, {
      type: 'bar',
      data: { labels: types.map(function(t) { return t.charAt(0).toUpperCase() + t.slice(1); }), datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 } } },
          y: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter', size: 11 } } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 12 } }
        }
      }
    });
  }

  function renderDRDistributionChart() {
    var ctx = document.getElementById('dr-distribution-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    var buckets = ['0-20', '21-40', '41-60', '61-80', '81-100'];

    function bucketize(opps) {
      var counts = [0, 0, 0, 0, 0];
      for (var i = 0; i < opps.length; i++) {
        var dr = opps[i].dr;
        if (dr <= 20) counts[0]++;
        else if (dr <= 40) counts[1]++;
        else if (dr <= 60) counts[2]++;
        else if (dr <= 80) counts[3]++;
        else counts[4]++;
      }
      return counts;
    }

    // Bucketize all opportunities as a proxy for overall distribution
    var allCounts = bucketize(MOCK_OPPORTUNITIES);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: buckets,
        datasets: [{
          label: 'Referring Domains by DR Range',
          data: allCounts,
          backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, title: { display: true, text: 'Domain Rating Range', font: { family: 'Inter', size: 12 } } },
          y: { grid: { color: '#f1f5f9' }, title: { display: true, text: 'Count', font: { family: 'Inter', size: 12 } } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  function renderVelocityChart() {
    var ctx = document.getElementById('velocity-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    var months = ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'];

    // Mockup velocity data (new referring domains per month)
    var datasets = [
      { label: CLIENT.domain, data: [2, 1, 3, 1, 2, 0], borderColor: 'rgb(59,130,246)', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 },
      { label: 'justinhavre.com', data: [18, 22, 15, 25, 20, 28], borderColor: 'rgb(100,116,139)', backgroundColor: 'transparent', tension: 0.3 },
      { label: 'calgaryhomes.ca', data: [12, 8, 14, 10, 16, 11], borderColor: 'rgb(139,92,246)', backgroundColor: 'transparent', tension: 0.3 },
      { label: 'kirbycox.com', data: [5, 7, 4, 8, 6, 5], borderColor: 'rgb(16,185,129)', backgroundColor: 'transparent', tension: 0.3 }
    ];

    new Chart(ctx, {
      type: 'line',
      data: { labels: months, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
          y: { grid: { color: '#f1f5f9' }, title: { display: true, text: 'New Referring Domains', font: { family: 'Inter', size: 12 } } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 12 } }
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Section 4: Detail Views (Tabbed) — with type/local/effort tags
  // ---------------------------------------------------------------------------
  var activeView = 'opportunities';

  function renderDetails() {
    var el = document.getElementById('details-content');
    if (!el) return;

    var tabs = '<div class="flex gap-2 mb-6 flex-wrap">' +
      '<button class="tab-btn' + (activeView === 'opportunities' ? ' active' : '') + '" data-view="opportunities">Opportunities</button>' +
      '<button class="tab-btn' + (activeView === 'competitor' ? ' active' : '') + '" data-view="competitor">By Competitor</button>' +
      '<button class="tab-btn' + (activeView === 'matrix' ? ' active' : '') + '" data-view="matrix">Matrix</button>' +
    '</div>';

    var content = '';
    if (activeView === 'opportunities') content = renderOpportunitiesView();
    else if (activeView === 'competitor') content = renderCompetitorView();
    else if (activeView === 'matrix') content = renderMatrixView();

    el.innerHTML = tabs + content;

    el.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function () {
        activeView = this.getAttribute('data-view');
        renderDetails();
      });
    });

    if (activeView === 'opportunities') {
      setTimeout(bindFilterEvents, 50);
    }

    if (activeView === 'matrix') {
      el.querySelectorAll('.matrix-comp-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
          var d = this.getAttribute('data-domain');
          var idx = matrixSelectedComps.indexOf(d);
          if (idx === -1) matrixSelectedComps.push(d);
          else matrixSelectedComps.splice(idx, 1);
          renderDetails();
        });
      });
      el.querySelectorAll('.matrix-mode-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          matrixOverlapMode = this.getAttribute('data-mode');
          renderDetails();
        });
      });
    }

    el.querySelectorAll('.collapsible-header').forEach(function(header) {
      header.addEventListener('click', function () {
        var isOpen = this.classList.toggle('open');
        var body = this.nextElementSibling;
        if (body) {
          body.style.display = isOpen ? 'block' : 'none';
          body.classList.toggle('open', isOpen);
        }
        var chev = this.querySelector('.chevron');
        if (chev) chev.style.transform = isOpen ? 'rotate(180deg)' : '';
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Filter bar for Opportunities view
  // ---------------------------------------------------------------------------
  function renderFilterBar() {
    var typeOpts = '';
    var seenTypes = {};
    for (var i = 0; i < MOCK_OPPORTUNITIES.length; i++) {
      var t = MOCK_OPPORTUNITIES[i].type;
      if (!seenTypes[t]) { seenTypes[t] = true; typeOpts += '<option value="' + esc(t) + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>'; }
    }

    var compOpts = '';
    for (var c = 0; c < COMPETITORS.length; c++) {
      compOpts += '<label style="display:flex;align-items:center;gap:4px;font-size:0.78rem;cursor:pointer;white-space:nowrap">' +
        '<input type="checkbox" class="opp-filter-comp" value="' + esc(COMPETITORS[c].domain) + '" checked style="accent-color:var(--accent-blue)"> ' + esc(COMPETITORS[c].domain) +
      '</label>';
    }

    return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:0.75rem 1rem;margin-bottom:0.75rem" id="opp-filter-bar">' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;margin-bottom:0.5rem">' +
        '<select id="opp-filter-type" style="border:1px solid #e2e8f0;border-radius:8px;padding:0.35rem 0.75rem;font-size:0.8rem;background:white;font-family:inherit">' +
          '<option value="">All Types</option>' + typeOpts +
        '</select>' +
        '<select id="opp-filter-local" style="border:1px solid #e2e8f0;border-radius:8px;padding:0.35rem 0.75rem;font-size:0.8rem;background:white;font-family:inherit">' +
          '<option value="">All Relevance</option><option value="local">Local</option><option value="national">National</option><option value="international">International</option>' +
        '</select>' +
        '<select id="opp-filter-effort" style="border:1px solid #e2e8f0;border-radius:8px;padding:0.35rem 0.75rem;font-size:0.8rem;background:white;font-family:inherit">' +
          '<option value="">All Difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>' +
        '</select>' +
        '<span style="font-size:0.78rem;color:#64748b">DR:</span>' +
        '<input id="opp-filter-dr-min" type="number" min="0" max="100" placeholder="0" style="border:1px solid #e2e8f0;border-radius:8px;padding:0.35rem 0.5rem;font-size:0.8rem;width:56px;font-family:inherit">' +
        '<span style="font-size:0.78rem;color:#94a3b8">&ndash;</span>' +
        '<input id="opp-filter-dr-max" type="number" min="0" max="100" placeholder="100" style="border:1px solid #e2e8f0;border-radius:8px;padding:0.35rem 0.5rem;font-size:0.8rem;width:56px;font-family:inherit">' +
        '<span style="font-size:0.78rem;color:#64748b;margin-left:4px">Overlap &ge;</span>' +
        '<input id="opp-filter-overlap" type="number" min="0" max="' + COMPETITORS.length + '" placeholder="0" style="border:1px solid #e2e8f0;border-radius:8px;padding:0.35rem 0.5rem;font-size:0.8rem;width:56px;font-family:inherit">' +
        '<span style="font-size:0.78rem;color:#64748b;margin-left:4px">Score &ge;</span>' +
        '<input id="opp-filter-score" type="number" min="0" max="100" placeholder="0" style="border:1px solid #e2e8f0;border-radius:8px;padding:0.35rem 0.5rem;font-size:0.8rem;width:56px;font-family:inherit">' +
        '<button onclick="window.TPPC.pages.backlinkOpportunities.clearFilters()" style="font-size:0.75rem;color:#3b82f6;cursor:pointer;background:none;border:none;padding:0;font-family:inherit;margin-left:auto">Clear all</button>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem">' +
        '<span style="font-size:0.78rem;color:#64748b;font-weight:600">Competitors:</span>' +
        compOpts +
      '</div>' +
    '</div>';
  }

  function applyFilters(resetPage) {
    if (resetPage) oppCurrentPage = 1;

    var wrap = document.getElementById('opp-table-wrap');
    if (!wrap) return;
    var rows = wrap.querySelectorAll('tbody tr');
    if (!rows.length) return;

    var fType = (document.getElementById('opp-filter-type') || {}).value || '';
    var fLocal = (document.getElementById('opp-filter-local') || {}).value || '';
    var fEffort = (document.getElementById('opp-filter-effort') || {}).value || '';
    var fDRMin = parseInt((document.getElementById('opp-filter-dr-min') || {}).value) || 0;
    var fDRMax = parseInt((document.getElementById('opp-filter-dr-max') || {}).value) || 100;
    var fOverlap = parseInt((document.getElementById('opp-filter-overlap') || {}).value) || 0;
    var fScore = parseInt((document.getElementById('opp-filter-score') || {}).value) || 0;

    var checkedComps = [];
    var checkboxes = document.querySelectorAll('.opp-filter-comp');
    for (var c = 0; c < checkboxes.length; c++) {
      if (checkboxes[c].checked) checkedComps.push(checkboxes[c].value);
    }

    var sorted = MOCK_OPPORTUNITIES.slice().sort(function(a, b) { return b.score - a.score; });

    // First pass: determine which rows pass filters
    var matchingIndices = [];
    for (var i = 0; i < sorted.length; i++) {
      var opp = sorted[i];
      var compOverlapWithChecked = 0;
      for (var j = 0; j < opp.competitors.length; j++) {
        if (checkedComps.indexOf(opp.competitors[j]) !== -1) compOverlapWithChecked++;
      }

      var pass = true;
      if (fType && opp.type !== fType) pass = false;
      if (fLocal && opp.localRelevance !== fLocal) pass = false;
      if (fEffort && opp.effort !== fEffort) pass = false;
      if (opp.dr < fDRMin || opp.dr > fDRMax) pass = false;
      if (compOverlapWithChecked < fOverlap) pass = false;
      if (opp.score < fScore) pass = false;

      if (pass) matchingIndices.push(i);
    }

    // Pagination
    var totalMatching = matchingIndices.length;
    var totalPages = Math.max(1, Math.ceil(totalMatching / OPP_PAGE_SIZE));
    if (oppCurrentPage > totalPages) oppCurrentPage = totalPages;
    var startIdx = (oppCurrentPage - 1) * OPP_PAGE_SIZE;
    var endIdx = startIdx + OPP_PAGE_SIZE;
    var pageIndices = matchingIndices.slice(startIdx, endIdx);

    // Second pass: show/hide rows
    for (var r = 0; r < rows.length; r++) {
      rows[r].style.display = pageIndices.indexOf(r) !== -1 ? '' : 'none';
    }

    // Update count
    var countEl = document.getElementById('opp-filter-count');
    if (countEl) {
      var showStart = totalMatching > 0 ? startIdx + 1 : 0;
      var showEnd = Math.min(endIdx, totalMatching);
      countEl.textContent = 'Showing ' + showStart + '-' + showEnd + ' of ' + totalMatching + ' referring domains';
    }

    // Render pagination buttons
    var pagEl = document.getElementById('opp-pagination');
    if (pagEl) {
      var pagHtml = '';
      if (totalPages > 1) {
        // Prev
        pagHtml += '<button class="opp-page-btn" data-page="' + Math.max(1, oppCurrentPage - 1) + '" style="padding:4px 10px;font-size:0.75rem;border:1px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;font-family:inherit"' + (oppCurrentPage === 1 ? ' disabled style="padding:4px 10px;font-size:0.75rem;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;cursor:default;font-family:inherit;color:#cbd5e1"' : '') + '>&lsaquo;</button>';
        for (var p = 1; p <= totalPages; p++) {
          var isActive = p === oppCurrentPage;
          pagHtml += '<button class="opp-page-btn" data-page="' + p + '" style="padding:4px 12px;font-size:0.75rem;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:' + (isActive ? '700' : '400') + ';' +
            (isActive ? 'background:var(--accent-blue);color:white;border:1px solid var(--accent-blue)' : 'background:white;border:1px solid #e2e8f0;color:#64748b') + '">' + p + '</button>';
        }
        // Next
        pagHtml += '<button class="opp-page-btn" data-page="' + Math.min(totalPages, oppCurrentPage + 1) + '" style="padding:4px 10px;font-size:0.75rem;border:1px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;font-family:inherit"' + (oppCurrentPage === totalPages ? ' disabled style="padding:4px 10px;font-size:0.75rem;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;cursor:default;font-family:inherit;color:#cbd5e1"' : '') + '>&rsaquo;</button>';
      }
      pagEl.innerHTML = pagHtml;
      pagEl.querySelectorAll('.opp-page-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var page = parseInt(this.getAttribute('data-page'));
          if (page && page !== oppCurrentPage) {
            oppCurrentPage = page;
            applyFilters(false);
          }
        });
      });
    }
  }

  function clearFilters() {
    var ids = ['opp-filter-type', 'opp-filter-local', 'opp-filter-effort'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) el.value = '';
    }
    var nums = ['opp-filter-dr-min', 'opp-filter-dr-max', 'opp-filter-overlap', 'opp-filter-score'];
    for (var j = 0; j < nums.length; j++) {
      var nel = document.getElementById(nums[j]);
      if (nel) nel.value = '';
    }
    var checkboxes = document.querySelectorAll('.opp-filter-comp');
    for (var c = 0; c < checkboxes.length; c++) checkboxes[c].checked = true;
    applyFilters(true);
  }

  function bindFilterEvents() {
    var controls = ['opp-filter-type', 'opp-filter-local', 'opp-filter-effort', 'opp-filter-dr-min', 'opp-filter-dr-max', 'opp-filter-overlap', 'opp-filter-score'];
    for (var i = 0; i < controls.length; i++) {
      var el = document.getElementById(controls[i]);
      if (el) el.addEventListener('input', function() { applyFilters(true); });
    }
    var checkboxes = document.querySelectorAll('.opp-filter-comp');
    for (var c = 0; c < checkboxes.length; c++) {
      checkboxes[c].addEventListener('change', function() { applyFilters(true); });
    }
    // Initial pagination render
    applyFilters(true);
  }

  var OPP_PAGE_SIZE = 15;
  var oppCurrentPage = 1;

  function renderOpportunitiesView() {
    var sorted = MOCK_OPPORTUNITIES.slice().sort(function(a, b) { return b.score - a.score; });

    var rows = '';
    for (var i = 0; i < sorted.length; i++) {
      var opp = sorted[i];

      var priorityBadge = '';
      if (opp.clientHas) priorityBadge = '<span class="severity-badge low">Already Have</span>';
      else if (opp.competitors.length >= 3) priorityBadge = '<span class="severity-badge high">High Priority</span>';
      else priorityBadge = '<span class="severity-badge info">Worth Exploring</span>';

      rows += '<tr data-opp-idx="' + i + '">' +
        '<td>' +
          '<div style="font-weight:600">' + esc(opp.domain) + '</div>' +
          '<div class="flex gap-1 mt-1 flex-wrap">' + typeBadge(opp.type) + localBadge(opp.localRelevance) + '</div>' +
        '</td>' +
        '<td class="text-center">' + opp.dr + '</td>' +
        '<td class="text-center">' + effortBadge(opp.effort) + '</td>' +
        '<td class="text-center" style="color:' + (opp.clientHas ? 'var(--sev-low)' : 'var(--sev-critical)') + ';font-weight:600">' + (opp.clientHas ? 'Yes' : 'No') + '</td>' +
        '<td>' + renderOverlapCell(opp) + '</td>' +
        '<td>' +
          '<div class="flex items-center gap-2">' +
            '<div style="flex:1;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden">' +
              '<div style="height:100%;width:' + opp.score + '%;border-radius:4px;background:linear-gradient(90deg,var(--accent-blue),var(--accent-indigo))"></div>' +
            '</div>' +
            '<span style="font-size:0.8rem;font-weight:700;min-width:28px">' + opp.score + '</span>' +
          '</div>' +
        '</td>' +
        '<td>' + priorityBadge + '</td>' +
      '</tr>';
    }

    return renderFilterBar() +
    '<div class="report-table-wrap" id="opp-table-wrap">' +
      '<table class="report-table">' +
        '<thead><tr>' +
          '<th>Referring Domain</th>' +
          '<th class="text-center">DR</th>' +
          '<th class="text-center">Difficulty</th>' +
          '<th class="text-center">You Have?</th>' +
          '<th>Competitor Overlap</th>' +
          '<th>Score</th>' +
          '<th>Priority</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;font-size:0.8rem;color:#64748b;border-top:1px solid #e2e8f0">' +
        '<span id="opp-filter-count"></span>' +
        '<div class="flex gap-1" id="opp-pagination"></div>' +
      '</div>' +
    '</div>';
  }

  function renderCompetitorView() {
    var html = '';
    for (var c = 0; c < COMPETITORS.length; c++) {
      var comp = COMPETITORS[c];
      var compOpps = MOCK_OPPORTUNITIES.filter(function(o) {
        return o.competitors.indexOf(comp.domain) !== -1;
      }).sort(function(a, b) { return b.dr - a.dr; });
      var isFirst = c === 0;

      html += '<div class="collapsible-header' + (isFirst ? ' open' : '') + '">' +
        '<span style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<strong>' + esc(comp.domain) + '</strong>' +
          '<span style="font-weight:400;color:#64748b;font-size:0.85rem">' + formatNumber(comp.referringDomains) + ' referring domains &middot; ' + formatNumber(comp.backlinks) + ' backlinks</span>' +
        '</span>' +
        '<span class="chevron" style="transition:transform 0.2s;font-size:0.8rem;color:#94a3b8;' + (isFirst ? 'transform:rotate(180deg)' : '') + '">&#9660;</span>' +
      '</div>';

      var rows = '';
      for (var r = 0; r < compOpps.length; r++) {
        var opp = compOpps[r];
        rows += '<tr>' +
          '<td><div style="font-weight:600">' + esc(opp.domain) + '</div><div class="flex gap-1 mt-1">' + typeBadge(opp.type) + effortBadge(opp.effort) + '</div></td>' +
          '<td class="text-center">' + opp.dr + '</td>' +
          '<td class="text-center" style="color:' + (opp.clientHas ? 'var(--sev-low)' : 'var(--sev-critical)') + ';font-weight:600">' + (opp.clientHas ? 'Yes' : 'No') + '</td>' +
          '<td class="text-center">' + opp.competitors.length + '</td>' +
        '</tr>';
      }

      html += '<div class="collapsible-body' + (isFirst ? ' open' : '') + '" style="' + (isFirst ? 'display:block' : 'display:none') + ';margin-bottom:12px">' +
        '<div class="report-table-wrap" style="margin-top:8px">' +
          '<table class="report-table"><thead><tr>' +
            '<th>Referring Domain</th><th class="text-center">DR</th><th class="text-center">You Have?</th><th class="text-center">Total Competitors</th>' +
          '</tr></thead><tbody>' + rows + '</tbody></table>' +
        '</div></div>';
    }
    return html;
  }

  // ---------------------------------------------------------------------------
  // Interactive Matrix: toggle competitors on/off, filter by overlap mode
  // ---------------------------------------------------------------------------
  var matrixSelectedComps = null; // null = all selected (initialized on first render)
  var matrixOverlapMode = 'all'; // 'all' | 'shared-only' | 'gaps-only' | 'unique'

  function initMatrixSelection() {
    if (matrixSelectedComps !== null) return;
    matrixSelectedComps = [];
    for (var i = 0; i < COMPETITORS.length; i++) matrixSelectedComps.push(COMPETITORS[i].domain);
  }

  function renderMatrixView() {
    initMatrixSelection();

    // --- Competitor toggle chips ---
    var chips = '<div style="margin-bottom:1rem">' +
      '<div style="font-size:0.8rem;font-weight:600;color:#64748b;margin-bottom:0.5rem">Select competitors to compare:</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:0.75rem">';

    for (var c = 0; c < COMPETITORS.length; c++) {
      var sel = matrixSelectedComps.indexOf(COMPETITORS[c].domain) !== -1;
      chips += '<button class="matrix-comp-chip" data-domain="' + esc(COMPETITORS[c].domain) + '" style="' +
        'display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:9999px;font-size:0.78rem;font-weight:500;cursor:pointer;transition:all 0.15s;font-family:inherit;' +
        (sel
          ? 'background:var(--accent-blue);color:white;border:1px solid var(--accent-blue)'
          : 'background:white;color:#64748b;border:1px solid #e2e8f0') +
        '">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + (sel ? 'white' : '#cbd5e1') + '"></span>' +
        esc(COMPETITORS[c].domain) +
      '</button>';
    }

    chips += '<button onclick="window.TPPC.pages.backlinkOpportunities.matrixSelectAll()" style="font-size:0.72rem;color:#3b82f6;cursor:pointer;background:none;border:none;padding:4px 8px;font-family:inherit">Select all</button>' +
      '<button onclick="window.TPPC.pages.backlinkOpportunities.matrixSelectNone()" style="font-size:0.72rem;color:#94a3b8;cursor:pointer;background:none;border:none;padding:4px 8px;font-family:inherit">Clear</button>' +
    '</div>';

    // --- Overlap mode tabs ---
    var modes = [
      { key: 'all', label: 'All Domains' },
      { key: 'shared-only', label: 'Shared Only' },
      { key: 'gaps-only', label: 'Your Gaps' },
      { key: 'unique', label: 'Unique to Selected' }
    ];
    chips += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
    for (var m = 0; m < modes.length; m++) {
      var active = matrixOverlapMode === modes[m].key;
      chips += '<button class="matrix-mode-btn" data-mode="' + modes[m].key + '" style="' +
        'padding:4px 14px;border-radius:8px;font-size:0.75rem;font-weight:500;cursor:pointer;font-family:inherit;transition:all 0.15s;' +
        (active
          ? 'background:var(--navy-800);color:white;border:1px solid var(--navy-800)'
          : 'background:white;color:#64748b;border:1px solid #e2e8f0') +
        '">' + modes[m].label + '</button>';
    }
    chips += '</div></div>';

    // --- Filter opportunities based on selected competitors & mode ---
    var filtered = MOCK_OPPORTUNITIES.slice().sort(function(a, b) { return b.score - a.score; });

    if (matrixOverlapMode === 'shared-only') {
      filtered = filtered.filter(function(opp) {
        return opp.clientHas && matrixSelectedComps.some(function(d) { return opp.competitors.indexOf(d) !== -1; });
      });
    } else if (matrixOverlapMode === 'gaps-only') {
      filtered = filtered.filter(function(opp) {
        return !opp.clientHas && matrixSelectedComps.some(function(d) { return opp.competitors.indexOf(d) !== -1; });
      });
    } else if (matrixOverlapMode === 'unique') {
      // Domains that ONLY selected competitors have (none of the unselected)
      filtered = filtered.filter(function(opp) {
        var hasSelected = false;
        var hasUnselected = false;
        for (var k = 0; k < opp.competitors.length; k++) {
          if (matrixSelectedComps.indexOf(opp.competitors[k]) !== -1) hasSelected = true;
          else hasUnselected = true;
        }
        return hasSelected && !hasUnselected;
      });
    }

    // --- Build table with only selected competitor columns ---
    var headerCols = '<th style="min-width:180px;position:sticky;left:0;z-index:3;background:#f8fafc;border-right:2px solid #e2e8f0">Referring Domain</th>' +
      '<th class="text-center">DR</th>' +
      '<th class="text-center" style="background:#eff6ff">You</th>';
    for (var sc = 0; sc < matrixSelectedComps.length; sc++) {
      headerCols += '<th class="text-center" style="font-size:0.75rem;max-width:120px;white-space:normal;line-height:1.2">' + esc(matrixSelectedComps[sc]) + '</th>';
    }
    headerCols += '<th class="text-center" style="font-size:0.75rem">Overlap</th>';

    var rows = '';
    for (var i = 0; i < filtered.length; i++) {
      var opp = filtered[i];
      var clientCell = opp.clientHas
        ? '<td class="text-center" style="background:#f0fdf4;color:var(--sev-low);font-weight:700">&#10003;</td>'
        : '<td class="text-center" style="background:#fef2f2;color:var(--sev-critical);font-weight:700">&#10007;</td>';
      var compCells = '';
      var overlapCount = 0;
      for (var j = 0; j < matrixSelectedComps.length; j++) {
        var has = opp.competitors.indexOf(matrixSelectedComps[j]) !== -1;
        if (has) overlapCount++;
        compCells += has
          ? '<td class="text-center" style="color:var(--sev-low)">&#10003;</td>'
          : '<td class="text-center" style="color:#cbd5e1">&#8212;</td>';
      }
      compCells += '<td class="text-center"><span style="font-size:0.75rem;font-weight:700;color:' +
        (overlapCount >= 3 ? 'var(--sev-critical)' : (overlapCount >= 2 ? 'var(--sev-medium)' : '#94a3b8')) +
        '">' + overlapCount + '/' + matrixSelectedComps.length + '</span></td>';

      rows += '<tr>' +
        '<td style="font-weight:600;position:sticky;left:0;background:#fff;border-right:2px solid #e2e8f0;z-index:2">' + esc(opp.domain) + '</td>' +
        '<td class="text-center">' + opp.dr + '</td>' +
        clientCell + compCells +
      '</tr>';
    }

    var emptyMsg = '';
    if (filtered.length === 0) {
      var colSpan = 3 + matrixSelectedComps.length + 1;
      emptyMsg = '<tr><td colspan="' + colSpan + '" style="text-align:center;padding:2rem;color:#94a3b8;font-style:italic">No domains match the current selection.</td></tr>';
    }

    return chips +
      '<div class="report-table-wrap" style="overflow-x:auto">' +
        '<table class="report-table"><thead><tr>' + headerCols + '</tr></thead><tbody>' + (rows || emptyMsg) + '</tbody></table>' +
      '</div>' +
      '<div class="flex flex-wrap gap-4 mt-3" style="font-size:0.75rem;color:#94a3b8">' +
        '<span><strong style="color:var(--sev-low)">&#10003;</strong> = has link</span>' +
        '<span><strong style="color:var(--sev-critical)">&#10007;</strong> = you\'re missing this</span>' +
        '<span><strong style="color:#cbd5e1">&#8212;</strong> = competitor doesn\'t have it either</span>' +
        '<span style="margin-left:auto">' + filtered.length + ' domains shown</span>' +
      '</div>';
  }

  // ---------------------------------------------------------------------------
  // Explainer content
  // ---------------------------------------------------------------------------
  function registerExplainers() {
    if (!window.TPPC.explainer || !window.TPPC.explainer.registerExplanations) return;

    window.TPPC.explainer.registerExplanations({
      'section-summary': {
        title: 'How to Use This Page',
        explanation: 'Referring domains are websites that link to yours. Search engines treat each linking domain as a "vote of confidence." This page compares your referring domains against competitors to find link-building opportunities — sites that link to them but not to you. Start with "easy" + "high priority" items (directories and listings you can submit to today), then tackle "medium" effort outreach, then long-term "hard" earned links.',
        tip: 'Use the filters in the Detailed Analysis section to focus on one category at a time. Start with "easy" + "local" for the quickest local SEO wins.'
      },
      'section-top-opportunities': {
        title: 'Top Opportunities',
        explanation: 'These are the 10 highest-scoring link-building opportunities, ranked by domain authority and competitor overlap. Click the arrow button on any row to expand it and see which competitors have this link and what action to take. "High Priority" means 3+ competitors have it but you don\'t — these are table-stakes links you\'re missing. "Difficulty" tells you the effort: Easy = self-submit, Medium = outreach required, Hard = earned media.',
        tip: 'Work through High Priority + Easy items first. Most can be done in 15-20 minutes each.'
      },
      'section-intelligence': {
        title: 'Backlink Intelligence',
        explanation: 'This section breaks down the quality and character of your backlink profile vs competitors. Type breakdown shows what kinds of sites link to each competitor — diversity signals a natural profile. Local relevance highlights Calgary/Alberta-specific links that carry extra local SEO weight. Dofollow ratio between 60-80% is natural. Link velocity shows who\'s actively building right now. The heatmap lets you click any cell to compare two profiles side by side.',
        tip: 'If a competitor gains 20+ referring domains per month, they have an active link-building campaign. Study their profile similarity to replicate their strategy.'
      },
      'section-details': {
        title: 'Detailed Analysis',
        explanation: 'Three views into the same data: "Opportunities" is your working checklist with filters for type, difficulty, DR range, and more. "By Competitor" lets you study one competitor\'s links at a time. "Matrix" is the bird\'s-eye view — toggle competitors on/off, use "Your Gaps" to see what you\'re missing, or "Unique to Selected" to find their secret weapons.',
        tip: 'Export your filtered Opportunities list as your link-building task list. Work through it top-to-bottom by score.'
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function init() {
    renderSummary();
    renderTopOpportunities();
    renderIntelligence();
    renderDetails();
    registerExplainers();
  }

  window.TPPC.pages.backlinkOpportunities = {
    init: init,
    clearFilters: clearFilters,
    matrixSelectAll: function() {
      matrixSelectedComps = [];
      for (var i = 0; i < COMPETITORS.length; i++) matrixSelectedComps.push(COMPETITORS[i].domain);
      renderDetails();
    },
    matrixSelectNone: function() {
      matrixSelectedComps = [];
      renderDetails();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
