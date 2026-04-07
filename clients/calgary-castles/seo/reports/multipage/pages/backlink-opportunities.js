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
      names += '<a href="javascript:void(0)" onclick="(function(el){' +
        'var t=document.getElementById(\'' + id + '\');' +
        't.style.display=t.style.display===\'none\'?\'block\':\'none\';' +
        'el.textContent=t.style.display===\'none\'?\'+' + remaining + ' more\':\'show less\'' +
        '})(this)" style="font-size:0.7rem;color:var(--accent-blue);text-decoration:none;display:block;margin-top:2px">+' + remaining + ' more</a>';
      names += '<div id="' + id + '" style="display:none;margin-top:2px">';
      for (var m = maxVisible; m < hasComps.length; m++) {
        names += '<span style="font-size:0.75rem;color:#475569">' + esc(hasComps[m]) + '</span><br>';
      }
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

    // Insight card
    var easyHighPriority = highPriority.filter(function(o) { return o.effort === 'easy'; });
    html += '<div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #bbf7d0;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:2rem">' +
      '<div style="font-weight:700;color:#166534;margin-bottom:0.5rem;display:flex;align-items:center;gap:8px">' +
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>' +
        'Key Insight' +
      '</div>' +
      '<p style="font-size:0.9rem;color:#15803d;line-height:1.6;margin:0">' +
        'You have <strong>' + CLIENT.referringDomains + '</strong> referring domains. The average competitor has <strong>' + avgCompetitorRD + '</strong>. ' +
        'There are <strong>' + highPriority.length + ' high-priority domains</strong> that 3 or more competitors share but you don\'t have. ' +
        'Of these, <strong>' + easyHighPriority.length + ' are directories or listings</strong> where getting listed is straightforward. ' +
        'There are also <strong>' + localOpps.length + ' locally relevant</strong> referring domains specific to Calgary/Alberta.' +
      '</p>' +
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

      var priorityBadge = '';
      if (opp.clientHas) {
        priorityBadge = '<span class="severity-badge low">Already Have</span>';
      } else if (opp.competitors.length >= 3) {
        priorityBadge = '<span class="severity-badge high">High Priority</span>';
      } else {
        priorityBadge = '<span class="severity-badge info">Worth Exploring</span>';
      }

      rows += '<tr>' +
        '<td style="font-weight:600;color:var(--navy-800)">' + (i + 1) + '</td>' +
        '<td>' +
          '<div style="font-weight:600;color:var(--accent-blue)">' + esc(opp.domain) + '</div>' +
          '<div class="flex gap-1 mt-1 flex-wrap">' + typeBadge(opp.type) + localBadge(opp.localRelevance) + effortBadge(opp.effort) + '</div>' +
        '</td>' +
        '<td class="text-center">' + opp.dr + '</td>' +
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
      '</tr>';
    }

    el.innerHTML =
      '<div class="report-table-wrap">' +
        '<table class="report-table">' +
          '<thead><tr>' +
            '<th>#</th>' +
            '<th>Referring Domain</th>' +
            '<th class="text-center">DR</th>' +
            '<th>Competitor Overlap</th>' +
            '<th>Opportunity Score</th>' +
            '<th>Priority</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  }

  // ---------------------------------------------------------------------------
  // Section 3: RLink Intelligence
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
          '<div style="font-size:0.8rem;color:#64748b;margin-top:4px">You have ' + clientCount + ' ' + typeName + ' RLinks. <strong>' + esc(maxComp) + '</strong> has ' + maxCount + '.</div>' +
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

    // --- 3g: Profile Similarity ---
    html += '<div style="margin-bottom:1rem">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--navy-800);margin-bottom:0.5rem">Backlink Profile Similarity</h3>' +
      '<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem">How much overlap exists between competitor backlink profiles. High overlap means they follow similar strategies.</p>';

    var similarities = [
      { a: 'justinhavre.com', b: 'calgaryhomes.ca', pct: 34 },
      { a: 'kirbycox.com', b: 'bestcalgaryhomes.com', pct: 28 },
      { a: 'calgaryhousefinder.ca', b: 'thinkcalgaryhomes.com', pct: 22 },
      { a: 'justinhavre.com', b: 'kirbycox.com', pct: 18 },
      { a: 'calgaryhomes.ca', b: 'bestcalgaryhomes.com', pct: 25 }
    ];

    html += '<div class="report-table-wrap"><table class="report-table"><thead><tr>' +
      '<th>Competitor A</th><th>Competitor B</th><th>Overlap</th>' +
      '</tr></thead><tbody>';
    for (var s = 0; s < similarities.length; s++) {
      html += '<tr>' +
        '<td style="font-weight:600">' + esc(similarities[s].a) + '</td>' +
        '<td style="font-weight:600">' + esc(similarities[s].b) + '</td>' +
        '<td>' +
          '<div class="flex items-center gap-2">' +
            '<div style="flex:1;max-width:200px;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden">' +
              '<div style="height:100%;width:' + similarities[s].pct + '%;border-radius:4px;background:var(--accent-indigo)"></div>' +
            '</div>' +
            '<span style="font-size:0.8rem;font-weight:700">' + similarities[s].pct + '%</span>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }
    html += '</tbody></table></div></div>';

    el.innerHTML = html;

    // Render charts
    setTimeout(function() {
      renderTypeChart();
      renderDRDistributionChart();
      renderVelocityChart();
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

    el.querySelectorAll('.collapsible-header').forEach(function(header) {
      header.addEventListener('click', function () {
        this.classList.toggle('open');
        var body = this.nextElementSibling;
        if (body) body.classList.toggle('open');
        var chev = this.querySelector('.chevron');
        if (chev) chev.style.transform = this.classList.contains('open') ? 'rotate(180deg)' : '';
      });
    });
  }

  function renderOpportunitiesView() {
    var sorted = MOCK_OPPORTUNITIES.slice().sort(function(a, b) { return b.score - a.score; });

    var rows = '';
    for (var i = 0; i < sorted.length; i++) {
      var opp = sorted[i];

      var priorityBadge = '';
      if (opp.clientHas) priorityBadge = '<span class="severity-badge low">Already Have</span>';
      else if (opp.competitors.length >= 3) priorityBadge = '<span class="severity-badge high">High Priority</span>';
      else priorityBadge = '<span class="severity-badge info">Worth Exploring</span>';

      rows += '<tr>' +
        '<td>' +
          '<div style="font-weight:600">' + esc(opp.domain) + '</div>' +
          '<div class="flex gap-1 mt-1 flex-wrap">' + typeBadge(opp.type) + localBadge(opp.localRelevance) + effortBadge(opp.effort) + '</div>' +
        '</td>' +
        '<td class="text-center">' + opp.dr + '</td>' +
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

    return '<div class="report-table-wrap">' +
      '<table class="report-table">' +
        '<thead><tr>' +
          '<th>Referring Domain</th>' +
          '<th class="text-center">DR</th>' +
          '<th class="text-center">You Have?</th>' +
          '<th>Competitor Overlap</th>' +
          '<th>Score</th>' +
          '<th>Priority</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;font-size:0.8rem;color:#64748b;border-top:1px solid #e2e8f0">' +
        '<span>Showing 1-' + sorted.length + ' of ' + sorted.length + ' referring domains</span>' +
        '<div class="flex gap-1"><button class="tab-btn active" style="padding:4px 12px;font-size:0.75rem">1</button></div>' +
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

  function renderMatrixView() {
    var sorted = MOCK_OPPORTUNITIES.slice().sort(function(a, b) { return b.score - a.score; });

    var headerCols = '<th style="min-width:180px;position:sticky;left:0;z-index:3;background:#f8fafc;border-right:2px solid #e2e8f0">Referring Domain</th>' +
      '<th class="text-center">DR</th>' +
      '<th class="text-center" style="background:#eff6ff">You</th>';
    for (var c = 0; c < COMPETITORS.length; c++) {
      headerCols += '<th class="text-center" style="font-size:0.75rem;max-width:120px;white-space:normal;line-height:1.2">' + esc(COMPETITORS[c].domain) + '</th>';
    }

    var rows = '';
    for (var i = 0; i < sorted.length; i++) {
      var opp = sorted[i];
      var clientCell = opp.clientHas
        ? '<td class="text-center" style="background:#f0fdf4;color:var(--sev-low);font-weight:700">&#10003;</td>'
        : '<td class="text-center" style="background:#fef2f2;color:var(--sev-critical);font-weight:700">&#10007;</td>';
      var compCells = '';
      for (var j = 0; j < COMPETITORS.length; j++) {
        var has = opp.competitors.indexOf(COMPETITORS[j].domain) !== -1;
        compCells += has
          ? '<td class="text-center" style="color:var(--sev-low)">&#10003;</td>'
          : '<td class="text-center" style="color:#cbd5e1">&#8212;</td>';
      }
      rows += '<tr>' +
        '<td style="font-weight:600;position:sticky;left:0;background:#fff;border-right:2px solid #e2e8f0;z-index:2">' + esc(opp.domain) + '</td>' +
        '<td class="text-center">' + opp.dr + '</td>' +
        clientCell + compCells +
      '</tr>';
    }

    return '<div class="report-table-wrap" style="overflow-x:auto">' +
      '<table class="report-table"><thead><tr>' + headerCols + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="flex flex-wrap gap-4 mt-3" style="font-size:0.75rem;color:#94a3b8">' +
        '<span><strong style="color:var(--sev-low)">&#10003;</strong> = has link</span>' +
        '<span><strong style="color:var(--sev-critical)">&#10007;</strong> = you\'re missing this</span>' +
        '<span><strong style="color:#cbd5e1">&#8212;</strong> = competitor doesn\'t have it either</span>' +
      '</div>';
  }

  // ---------------------------------------------------------------------------
  // Explainer content
  // ---------------------------------------------------------------------------
  function registerExplainers() {
    if (!window.TPPC.explainer || !window.TPPC.explainer.register) return;

    window.TPPC.explainer.register('section-summary', {
      title: 'How to Use This Page',
      content: '<p><strong>Referring domains</strong> (RLinks) are websites that link to yours. Search engines treat each linking domain as a "vote of confidence" — the more high-quality domains link to you, the higher you rank.</p>' +
        '<p>This page compares your referring domains against your competitors\' to find <strong>link-building opportunities</strong> — sites that link to your competitors but not to you.</p>' +
        '<p><strong>How to act on this data:</strong></p>' +
        '<ul>' +
          '<li><strong>Start with "easy" + "high priority"</strong> — these are directories and listings where you can submit your site today.</li>' +
          '<li><strong>Then tackle "medium" effort</strong> — industry sites and associations that require outreach.</li>' +
          '<li><strong>"Hard" effort items</strong> (press mentions) are long-term goals — build authority first.</li>' +
        '</ul>' +
        '<p><strong>Opportunity Score</strong> combines two signals: how many competitors share the link (60% weight) and the domain\'s authority rating (40% weight). Higher = more valuable.</p>'
    });

    window.TPPC.explainer.register('section-intelligence', {
      title: 'Understanding RLink Intelligence',
      content: '<p><strong>Type breakdown</strong> shows what kinds of sites link to each competitor. Link diversity signals a natural profile to search engines.</p>' +
        '<p><strong>Local relevance</strong> matters most for local businesses — a link from calgaryherald.com carries more local SEO weight than a link from a generic international directory.</p>' +
        '<p><strong>Dofollow ratio</strong> between 60-80% is natural. Below 50% may indicate low-quality or spammy links. Above 90% can look artificially built.</p>' +
        '<p><strong>Link velocity</strong> shows who\'s actively building — if a competitor is gaining 20+ referring domains per month, they have an active link-building campaign you should match.</p>'
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

  window.TPPC.pages.backlinkOpportunities = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
