(function () {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};
  window.TPPC.currentPage = 'content';

  var EMPTY_STATE_MESSAGE = 'Content quality analysis has not been run yet.';

  function getUtils() {
    return window.TPPC.utils || {};
  }

  function esc(value) {
    var utils = getUtils();
    if (utils && typeof utils.esc === 'function') {
      return utils.esc(value);
    }
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hasNumber(value) {
    return value !== null && value !== undefined && value !== '' && !isNaN(Number(value));
  }

  function toNumber(value) {
    return hasNumber(value) ? Number(value) : null;
  }

  function toArray(value) {
    return Array.isArray(value) ? value : null;
  }

  function formatNumber(value, decimals) {
    if (!hasNumber(value)) return '&mdash;';
    var num = Number(value);
    if (decimals == null) {
      return num.toLocaleString();
    }
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatPercent(value, decimals) {
    if (!hasNumber(value)) return '&mdash;';
    return formatNumber(Number(value) * 100, decimals == null ? 0 : decimals) + '%';
  }

  function formatWordRange(rangeValue) {
    if (!Array.isArray(rangeValue) || rangeValue.length < 2) return '&mdash;';
    if (!hasNumber(rangeValue[0]) || !hasNumber(rangeValue[1])) return '&mdash;';
    return formatNumber(rangeValue[0]) + ' - ' + formatNumber(rangeValue[1]) + ' words';
  }

  function titleCase(value) {
    if (!value) return '';
    return String(value)
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, function (char) { return char.toUpperCase(); });
  }

  function renderEmptyState(message) {
    return '' +
      '<div class="empty-state">' +
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-8.625a2.625 2.625 0 0 0-2.625-2.625H7.125A2.625 2.625 0 0 0 4.5 5.625v12.75A2.625 2.625 0 0 0 7.125 21h9.75a2.625 2.625 0 0 0 2.625-2.625V14.25M9 10.5h6M9 14.25h3" />' +
        '</svg>' +
        '<p>' + esc(message || EMPTY_STATE_MESSAGE) + '</p>' +
      '</div>';
  }

  function setContent(id, html) {
    var container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = html;
  }

  function getContentQuality(data) {
    if (!data || typeof data !== 'object' || !data.contentQuality || typeof data.contentQuality !== 'object') {
      return null;
    }
    return data.contentQuality;
  }

  function scoreCardSeverity(score) {
    var num = toNumber(score);
    if (num == null) return '';
    if (num >= 75) return 'severity-green';
    if (num >= 60) return 'severity-yellow';
    if (num >= 40) return 'severity-orange';
    return 'severity-red';
  }

  function thinCardSeverity(thinCount, totalPages) {
    var thin = toNumber(thinCount);
    var total = toNumber(totalPages);
    if (thin == null || total == null || total <= 0) return '';
    var ratio = thin / total;
    if (ratio <= 0.1) return 'severity-green';
    if (ratio <= 0.25) return 'severity-yellow';
    if (ratio <= 0.5) return 'severity-orange';
    return 'severity-red';
  }

  function similarityBadgeClass(similarity) {
    var num = toNumber(similarity);
    if (num == null) return 'info';
    if (num >= 0.9) return 'critical';
    if (num >= 0.8) return 'high';
    if (num >= 0.7) return 'medium';
    return 'low';
  }

  function readabilitySeverity(score) {
    var num = toNumber(score);
    if (num == null) return 'info';
    if (num >= 70) return 'low';
    if (num >= 50) return 'medium';
    return 'high';
  }

  function renderUrlCell(url, title) {
    var html = '<div class="font-medium text-slate-900 break-all">' + (url ? esc(url) : '&mdash;') + '</div>';
    if (title) {
      html += '<div class="mt-1 text-xs text-slate-500">' + esc(title) + '</div>';
    }
    return html;
  }

  function renderTextList(items, emptyLabel, limit) {
    var values = Array.isArray(items) ? items.filter(function (item) { return !!item; }) : [];
    var maxItems = limit == null ? values.length : limit;
    if (!values.length) {
      return '<span class="text-slate-400">' + esc(emptyLabel || 'None listed') + '</span>';
    }

    var html = '<div class="space-y-1">';
    values.slice(0, maxItems).forEach(function (item) {
      html += '<div class="text-sm text-slate-700">' + esc(item) + '</div>';
    });
    if (values.length > maxItems) {
      html += '<div class="text-xs text-slate-500">+' + esc(values.length - maxItems) + ' more</div>';
    }
    html += '</div>';
    return html;
  }

  function compareNumbers(a, b, descending) {
    var left = toNumber(a);
    var right = toNumber(b);
    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;
    return descending ? right - left : left - right;
  }

  function renderContentOverview(data) {
    var content = getContentQuality(data);
    if (!content || !content.summary || typeof content.summary !== 'object') {
      setContent('section-overview-content', renderEmptyState());
      return;
    }

    var summary = content.summary;
    var totalPages = toNumber(summary.totalPagesAnalyzed);
    var avgQualityScore = toNumber(summary.avgQualityScore);
    var thinPageCount = toNumber(summary.thinPageCount);

    var html = '' +
      '<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">' +
        '<div class="stat-card animate-in">' +
          '<div class="stat-value text-slate-900">' + formatNumber(totalPages, 0) + '</div>' +
          '<div class="stat-label">Total pages analyzed</div>' +
        '</div>' +
        '<div class="stat-card animate-in ' + scoreCardSeverity(avgQualityScore) + '">' +
          '<div class="stat-value">' + formatNumber(avgQualityScore, 1) + '</div>' +
          '<div class="stat-label">Average quality score</div>' +
        '</div>' +
        '<div class="stat-card animate-in ' + thinCardSeverity(thinPageCount, totalPages) + '">' +
          '<div class="stat-value">' + formatNumber(thinPageCount, 0) + '</div>' +
          '<div class="stat-label">Thin-content pages flagged</div>' +
        '</div>' +
      '</div>';

    var secondaryStats = [];
    if (hasNumber(summary.avgReadabilityScore)) {
      secondaryStats.push('Avg. readability: ' + formatNumber(summary.avgReadabilityScore, 1));
    }
    if (hasNumber(summary.avgSeoScore)) {
      secondaryStats.push('Avg. SEO score: ' + formatNumber(summary.avgSeoScore, 1));
    }
    if (hasNumber(summary.avgStructureScore)) {
      secondaryStats.push('Avg. structure score: ' + formatNumber(summary.avgStructureScore, 1));
    }
    if (hasNumber(summary.duplicateGroupCount)) {
      secondaryStats.push('Duplicate groups: ' + formatNumber(summary.duplicateGroupCount, 0));
    }
    if (hasNumber(summary.cannibalizationCount)) {
      secondaryStats.push('Cannibalization issues: ' + formatNumber(summary.cannibalizationCount, 0));
    }

    if (secondaryStats.length) {
      html += '<div class="mt-6 flex flex-wrap gap-3">';
      secondaryStats.forEach(function (item) {
        html += '<div class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">' + item + '</div>';
      });
      html += '</div>';
    }

    setContent('section-overview-content', html);
  }

  function renderReadabilityTable(data) {
    var content = getContentQuality(data);
    var pages = content && toArray(content.pages);

    if (!content || !pages) {
      setContent('section-readability-content', renderEmptyState());
      return;
    }

    if (!pages.length) {
      setContent('section-readability-content', renderEmptyState('No readability results are available for this audit.'));
      return;
    }

    pages = pages.slice().sort(function (left, right) {
      var scoreCompare = compareNumbers(left && left.readabilityScore, right && right.readabilityScore, false);
      if (scoreCompare !== 0) return scoreCompare;
      return compareNumbers(
        left && left.readability && left.readability.wordCount,
        right && right.readability && right.readability.wordCount,
        false
      );
    });

    var html = '' +
      '<div class="report-table-wrap">' +
        '<table class="report-table">' +
          '<thead>' +
            '<tr>' +
              '<th>URL</th>' +
              '<th>Readability Score</th>' +
              '<th>Flesch Reading Ease</th>' +
              '<th>Word Count</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

    pages.forEach(function (page) {
      var readability = page && page.readability ? page.readability : {};
      html += '' +
        '<tr>' +
          '<td>' + renderUrlCell(page && page.url, page && page.title) + '</td>' +
          '<td>' +
            '<span class="severity-badge ' + readabilitySeverity(page && page.readabilityScore) + '">' +
              formatNumber(page && page.readabilityScore, 1) +
            '</span>' +
          '</td>' +
          '<td>' + formatNumber(readability.fleschReadingEase, 1) + '</td>' +
          '<td>' + formatNumber(readability.wordCount, 0) + '</td>' +
        '</tr>';
    });

    html += '' +
          '</tbody>' +
        '</table>' +
      '</div>';

    setContent('section-readability-content', html);
  }

  function renderThinContent(data) {
    var content = getContentQuality(data);
    var pages = content && toArray(content.pages);
    var summary = content && content.summary ? content.summary : {};

    if (!content || !pages) {
      setContent('section-thin-content', renderEmptyState());
      return;
    }

    var thinPages = pages.filter(function (page) {
      return !!(page && page.isThin === true);
    }).sort(function (left, right) {
      return compareNumbers(
        left && left.readability && left.readability.wordCount,
        right && right.readability && right.readability.wordCount,
        false
      );
    });

    if (!thinPages.length) {
      setContent('section-thin-content', renderEmptyState('No thin-content pages were identified.'));
      return;
    }

    var html = '';
    if (hasNumber(summary.thinThreshold)) {
      html += '' +
        '<div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">' +
          'Pages with fewer than <strong>' + formatNumber(summary.thinThreshold, 0) + '</strong> words are flagged as thin.' +
        '</div>';
    }

    html += '' +
      '<div class="report-table-wrap">' +
        '<table class="report-table">' +
          '<thead>' +
            '<tr>' +
              '<th>URL</th>' +
              '<th>Word Count</th>' +
              '<th>Quality Score</th>' +
              '<th>Issues</th>' +
              '<th>Recommendations</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

    thinPages.forEach(function (page) {
      var readability = page && page.readability ? page.readability : {};
      html += '' +
        '<tr>' +
          '<td>' + renderUrlCell(page && page.url, page && page.title) + '</td>' +
          '<td>' + formatNumber(readability.wordCount, 0) + '</td>' +
          '<td>' + formatNumber(page && page.qualityScore, 1) + '</td>' +
          '<td>' + renderTextList(page && page.issues, 'No issues listed', 3) + '</td>' +
          '<td>' + renderTextList(page && page.recommendations, 'No recommendation provided', 3) + '</td>' +
        '</tr>';
    });

    html += '' +
          '</tbody>' +
        '</table>' +
      '</div>';

    setContent('section-thin-content', html);
  }

  function renderDuplicateGroups(data) {
    var content = getContentQuality(data);
    var groups = content && toArray(content.duplicateGroups);

    if (!content || !groups) {
      setContent('section-duplicates-content', renderEmptyState());
      return;
    }

    if (!groups.length) {
      setContent('section-duplicates-content', renderEmptyState('No duplicate content groups were detected.'));
      return;
    }

    groups = groups.slice().sort(function (left, right) {
      return compareNumbers(left && left.similarity, right && right.similarity, true);
    });

    var html = '<div class="grid gap-4 lg:grid-cols-2">';

    groups.forEach(function (group, index) {
      var pages = Array.isArray(group && group.pages) ? group.pages : [];
      html += '' +
        '<article class="animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">' +
          '<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">' +
            '<div>' +
              '<div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Duplicate Group ' + esc(index + 1) + '</div>' +
              '<h3 class="mt-1 text-lg font-semibold text-slate-900">' + esc(group && group.fingerprint ? group.fingerprint : 'Unlabeled fingerprint') + '</h3>' +
            '</div>' +
            '<span class="severity-badge ' + similarityBadgeClass(group && group.similarity) + '">' +
              'Similarity ' + formatPercent(group && group.similarity, 0) +
            '</span>' +
          '</div>' +
          '<div class="mt-4 text-sm text-slate-600">Word count range: ' + formatWordRange(group && group.wordCountRange) + '</div>' +
          '<div class="mt-4">' +
            '<div class="text-sm font-semibold text-slate-900">Pages</div>' +
            '<div class="mt-2 space-y-2">';

      if (!pages.length) {
        html += '<div class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">No pages listed.</div>';
      } else {
        pages.forEach(function (pageUrl) {
          html += '<div class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 break-all">' + esc(pageUrl) + '</div>';
        });
      }

      html += '' +
            '</div>' +
          '</div>' +
          '<div class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">' +
            '<span class="font-semibold text-slate-900">Recommendation:</span> ' + esc(group && group.recommendation ? group.recommendation : 'No recommendation provided.') +
          '</div>' +
        '</article>';
    });

    html += '</div>';

    setContent('section-duplicates-content', html);
  }

  function renderCannibalization(data) {
    var content = getContentQuality(data);
    var records = content && toArray(content.cannibalization);
    var utils = getUtils();
    var severityClass = utils && typeof utils.severityClass === 'function'
      ? utils.severityClass
      : function (value) { return value ? String(value).toLowerCase() : 'info'; };

    if (!content || !records) {
      setContent('section-cannibalization-content', renderEmptyState());
      return;
    }

    if (!records.length) {
      setContent('section-cannibalization-content', renderEmptyState('No keyword cannibalization issues were detected.'));
      return;
    }

    var severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

    records = records.slice().sort(function (left, right) {
      var leftSeverity = severityOrder[severityClass(left && left.severity)] || 0;
      var rightSeverity = severityOrder[severityClass(right && right.severity)] || 0;
      if (leftSeverity !== rightSeverity) return rightSeverity - leftSeverity;
      var leftPages = Array.isArray(left && left.pages) ? left.pages.length : 0;
      var rightPages = Array.isArray(right && right.pages) ? right.pages.length : 0;
      return rightPages - leftPages;
    });

    var html = '<div class="space-y-6">';

    records.forEach(function (record) {
      var pages = Array.isArray(record && record.pages) ? record.pages : [];
      html += '' +
        '<article class="animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">' +
          '<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">' +
            '<div>' +
              '<h3 class="text-lg font-semibold text-slate-900">' + esc(record && record.keyword ? record.keyword : 'Unnamed keyword') + '</h3>' +
              '<p class="mt-1 text-sm text-slate-500">' + esc(pages.length) + ' competing page' + (pages.length === 1 ? '' : 's') + ' detected.</p>' +
            '</div>' +
            '<span class="severity-badge ' + severityClass(record && record.severity) + '">' +
              esc(titleCase(record && record.severity ? record.severity : 'info')) +
            '</span>' +
          '</div>';

      if (!pages.length) {
        html += '<div class="mt-4">' + renderEmptyState('No competing pages were included for this keyword.') + '</div>';
      } else {
        html += '' +
          '<div class="report-table-wrap mt-4">' +
            '<table class="report-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Page</th>' +
                  '<th>Clicks</th>' +
                  '<th>Impressions</th>' +
                  '<th>Avg. Position</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>';

        pages.forEach(function (page) {
          html += '' +
            '<tr>' +
              '<td><div class="font-medium text-slate-900 break-all">' + (page && page.url ? esc(page.url) : '&mdash;') + '</div></td>' +
              '<td>' + formatNumber(page && page.clicks, 0) + '</td>' +
              '<td>' + formatNumber(page && page.impressions, 0) + '</td>' +
              '<td>' + formatNumber(page && page.position, 1) + '</td>' +
            '</tr>';
        });

        html += '' +
              '</tbody>' +
            '</table>' +
          '</div>';
      }

      html += '' +
          '<div class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">' +
            '<span class="font-semibold text-slate-900">Recommendation:</span> ' + esc(record && record.recommendation ? record.recommendation : 'No recommendation provided.') +
          '</div>' +
        '</article>';
    });

    html += '</div>';

    setContent('section-cannibalization-content', html);
  }

  function renderStructureAudit(data) {
    var content = getContentQuality(data);
    var pages = content && toArray(content.pages);

    if (!content || !pages) {
      setContent('section-structure-content', renderEmptyState());
      return;
    }

    if (!pages.length) {
      setContent('section-structure-content', renderEmptyState('No page-level structure results are available for this audit.'));
      return;
    }

    pages = pages.slice().sort(function (left, right) {
      var leftStructure = left && left.structure ? left.structure : {};
      var rightStructure = right && right.structure ? right.structure : {};
      if (!!leftStructure.headingHierarchyValid !== !!rightStructure.headingHierarchyValid) {
        return leftStructure.headingHierarchyValid ? 1 : -1;
      }
      var leftCoverage = leftStructure.imageCount > 0 ? leftStructure.imagesWithAlt / leftStructure.imageCount : 1;
      var rightCoverage = rightStructure.imageCount > 0 ? rightStructure.imagesWithAlt / rightStructure.imageCount : 1;
      if (leftCoverage !== rightCoverage) return leftCoverage - rightCoverage;
      return compareNumbers(leftStructure.internalLinks, rightStructure.internalLinks, false);
    });

    var html = '' +
      '<div class="report-table-wrap">' +
        '<table class="report-table">' +
          '<thead>' +
            '<tr>' +
              '<th>URL</th>' +
              '<th>Headings</th>' +
              '<th>Hierarchy</th>' +
              '<th>Images</th>' +
              '<th>Alt Text</th>' +
              '<th>Internal Links</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

    pages.forEach(function (page) {
      var structure = page && page.structure ? page.structure : {};
      var imageCount = toNumber(structure.imageCount);
      var imagesWithAlt = toNumber(structure.imagesWithAlt);
      var altCoverage = (imageCount != null && imageCount > 0 && imagesWithAlt != null)
        ? formatNumber(imagesWithAlt, 0) + ' / ' + formatNumber(imageCount, 0) + ' (' + formatPercent(imagesWithAlt / imageCount, 0) + ')'
        : 'No images';

      html += '' +
        '<tr>' +
          '<td>' + renderUrlCell(page && page.url, page && page.title) + '</td>' +
          '<td>' +
            '<div class="font-medium text-slate-900">' + formatNumber(structure.headingCount, 0) + '</div>' +
            '<div class="mt-1 text-xs text-slate-500">H2: ' + formatNumber(structure.h2Count, 0) + ' | H3: ' + formatNumber(structure.h3Count, 0) + '</div>' +
          '</td>' +
          '<td>' +
            '<span class="severity-badge ' + (structure.headingHierarchyValid ? 'low' : 'high') + '">' +
              (structure.headingHierarchyValid ? 'Valid' : 'Needs review') +
            '</span>' +
          '</td>' +
          '<td>' + formatNumber(structure.imageCount, 0) + '</td>' +
          '<td>' + altCoverage + '</td>' +
          '<td>' +
            '<div class="font-medium text-slate-900">' + formatNumber(structure.internalLinks, 0) + '</div>' +
            '<div class="mt-1 text-xs text-slate-500">FAQ schema: ' + esc(structure.hasFaqSchema ? 'Yes' : 'No') + '</div>' +
          '</td>' +
        '</tr>';
    });

    html += '' +
          '</tbody>' +
        '</table>' +
      '</div>';

    setContent('section-structure-content', html);
  }

  window.TPPC.pages.content = {
    init: function (data) {
      renderContentOverview(data);
      renderReadabilityTable(data);
      renderThinContent(data);
      renderDuplicateGroups(data);
      renderCannibalization(data);
      renderStructureAudit(data);
    }
  };

  function bootWhenReady(attempt) {
    if (typeof window.TPPC.boot === 'function') {
      window.TPPC.boot();
      return;
    }
    if ((attempt || 0) >= 200) return;
    window.setTimeout(function () {
      bootWhenReady((attempt || 0) + 1);
    }, 25);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bootWhenReady(0);
    });
  } else {
    bootWhenReady(0);
  }
})();
