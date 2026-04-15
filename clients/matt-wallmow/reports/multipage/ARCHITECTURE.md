# Multi-Page SEO Audit Report Architecture

> **System**: TastyPPC Agency SEO Audit Report  
> **Version**: 2.0 (multi-page)  
> **Date**: 2026-03-23  
> **Status**: Architecture specification — ready for implementation

This document specifies the complete architecture for converting the existing single-page SEO audit report (1,130 lines) into a modular 8-page report system with shared navigation, client-side search, and PDF export.

---

## 1. File Structure Map

```text
template/reports/multipage/
│
├── index.html                 # Page 1: Executive Summary
├── keywords.html              # Page 2: Keywords & Search Visibility
├── content.html               # Page 3: Content Quality & Readability
├── technical.html             # Page 4: Technical SEO & Performance
├── links.html                 # Page 5: Internal Linking & Backlinks
├── competitors.html           # Page 6: Competitor Analysis
├── local.html                 # Page 7: Local SEO & GBP
├── action-plan.html           # Page 8: Action Plan & Strategy
│
├── shared/                    # Shared CSS and JS (loaded by every page)
│   ├── report-styles.css      # Base theme: existing report-styles.css extended for multi-page layout
│   ├── multipage-nav.css      # Top nav, side nav, hamburger drawer, scrollspy styles
│   ├── data-loader.js         # Validates window.AUDIT_DATA, sets up TPPC namespace, dev fallback
│   ├── nav.js                 # Renders top nav + side nav, scrollspy via IntersectionObserver
│   ├── search.js              # Ctrl+K search modal, fuzzy matching against SEARCH_INDEX
│   ├── charts.js              # Chart.js helpers: color palette, gauge renderer, radar/bar/donut factories
│   ├── utils.js               # Extracted from existing: esc(), gradeClass(), severityClass(), pillClass(), rankClass()
│   └── print.js               # Print/PDF mode: expand collapsibles, show all tabs, inject page breaks
│
├── pages/                     # Page-specific renderers (one JS file per HTML page)
│   ├── index.js               # Executive summary: hero, stats grid, top issues, quick wins, next steps
│   ├── keywords.js            # Keyword table, volume chart, GSC insights, traffic overview
│   ├── content.js             # Readability scores, thin content list, duplicates, cannibalization
│   ├── technical.js           # CWV gauges, PageSpeed, schema audit, meta tag audit, crawl issues
│   ├── links.js               # Link graph stats, orphan pages, hub-spoke clusters, depth analysis, backlinks
│   ├── competitors.js         # Comparison tables, radar chart, strategies, domain metrics
│   ├── local.js               # GBP profile card, local performance charts, citation audit
│   └── action-plan.js         # Tabbed action plan, content calendar, roadmap, advantages, deliverables
│
├── assets/                    # Static brand assets
│   └── tasty-ppc-logo.svg     # TastyPPC agency logo (inline SVG preferred for file:// compat)
│
├── generate-multipage-report.js   # Node.js build script: data injection, CSS inlining, search index, PDF
└── ARCHITECTURE.md                # This file
```

### Script Loading Order (every HTML page)

```html
<head>
  <!-- 1. Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- 2. Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
  <!-- 3. Custom styles -->
  <link rel="stylesheet" href="shared/report-styles.css">
  <link rel="stylesheet" href="shared/multipage-nav.css">
  <!-- 4. Build-injected data (replaced at build time) -->
  <script>window.AUDIT_DATA = {}; window.SEARCH_INDEX = [];</script>
  <!-- 5. Tailwind config -->
  <script>tailwind.config = { /* ... */ }</script>
</head>
<body>
  <!-- ... page content ... -->

  <!-- 6. Shared JS (order matters: utils first, then data-loader, then nav) -->
  <script src="shared/utils.js"></script>
  <script src="shared/data-loader.js"></script>
  <script src="shared/charts.js"></script>
  <script src="shared/nav.js"></script>
  <script src="shared/search.js"></script>
  <script src="shared/print.js"></script>

  <!-- 7. Page-specific JS -->
  <script src="pages/{page-name}.js"></script>
</body>
```

---

## 2. Shared Data Layer Design

### Problem
The report must work from `file://` (no CORS, no fetch, no ES modules) AND from a web server.

### Solution: Build-Time Data Injection

**At build time**, `generate-multipage-report.js`:
1. Reads `audit-data.json`
2. JSON-serializes it as `window.AUDIT_DATA = {...};`
3. Builds the search index as `window.SEARCH_INDEX = [...];`
4. Replaces the placeholder `<script>` in each HTML page's `<head>`
5. Optionally inlines all CSS for fully self-contained output

**Exact injection pattern:**

```html
<!-- In each HTML <head>, the template has: -->
<script id="audit-data-inject">
  window.AUDIT_DATA = /* __AUDIT_DATA_PLACEHOLDER__ */null;
  window.SEARCH_INDEX = /* __SEARCH_INDEX_PLACEHOLDER__ */[];
</script>
```

The generator replaces `/* __AUDIT_DATA_PLACEHOLDER__ */null` with the JSON data and `/* __SEARCH_INDEX_PLACEHOLDER__ */[]` with the search index.

### shared/data-loader.js Behavior

```javascript
(function() {
  'use strict';

  // 1. Initialize namespace
  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};

  // 2. Validate data exists
  if (!window.AUDIT_DATA || typeof window.AUDIT_DATA !== 'object') {
    // Dev/preview fallback: try loading debug-data.js via script injection
    var fallback = document.createElement('script');
    fallback.src = 'shared/debug-data.js'; // must set window.AUDIT_DATA
    fallback.onerror = function() {
      document.body.innerHTML = '<div style="padding:2rem;text-align:center">' +
        '<h1>No audit data found</h1>' +
        '<p>Run generate-multipage-report.js or provide shared/debug-data.js</p></div>';
    };
    document.head.appendChild(fallback);
    return;
  }

  // 3. Store reference and expose data access helper
  window.TPPC.data = window.AUDIT_DATA;
  window.TPPC.searchIndex = window.SEARCH_INDEX || [];

  // 4. Boot: find current page's init function and call it
  window.TPPC.boot = function() {
    var pageName = window.TPPC.currentPage;
    if (pageName && window.TPPC.pages[pageName] && window.TPPC.pages[pageName].init) {
      window.TPPC.pages[pageName].init(window.TPPC.data);
    }
    // Initialize shared components
    if (window.TPPC.nav) window.TPPC.nav.init();
    if (window.TPPC.search) window.TPPC.search.init();
  };
})();
```

### Dev/Preview Mode

For development without running the generator, create `shared/debug-data.js`:
```javascript
window.AUDIT_DATA = { /* paste audit-data.json contents */ };
window.SEARCH_INDEX = [];
```

This file is loaded via `<script src>` (not fetch/import), so it works on `file://`.

---

## 3. Navigation Component Design

### Top Navigation Bar

Fixed horizontal bar at top of every page:

```
┌─────────────────────────────────────────────────────────────────┐
│ [TastyPPC Logo]  Summary  Keywords  Content  Technical  ...    │
│                                              [Search ⌘K] [☰]  │
└─────────────────────────────────────────────────────────────────┘
```

### window.NAV_CONFIG

Defined in `shared/nav.js`:

```javascript
window.TPPC.NAV_CONFIG = [
  {
    id: 'index',
    title: 'Summary',
    icon: '<svg>...</svg>', // Heroicons outline: home
    href: 'index.html',
    sections: [
      { id: 'section-hero', title: 'Overview' },
      { id: 'section-stats', title: 'Key Stats' },
      { id: 'section-issues', title: 'Top Issues' },
      { id: 'section-quickwins', title: 'Quick Wins' },
      { id: 'section-nextsteps', title: 'Next Steps' }
    ]
  },
  {
    id: 'keywords',
    title: 'Keywords',
    icon: '<svg>...</svg>', // Heroicons: magnifying-glass-circle
    href: 'keywords.html',
    sections: [
      { id: 'section-rankings', title: 'Rankings' },
      { id: 'section-volume', title: 'Search Volume' },
      { id: 'section-gsc', title: 'Search Console' },
      { id: 'section-traffic', title: 'Traffic' }
    ]
  },
  {
    id: 'content',
    title: 'Content',
    icon: '<svg>...</svg>', // Heroicons: document-text
    href: 'content.html',
    sections: [
      { id: 'section-overview', title: 'Content Overview' },
      { id: 'section-readability', title: 'Readability' },
      { id: 'section-thin', title: 'Thin Content' },
      { id: 'section-duplicates', title: 'Duplicates' },
      { id: 'section-cannibalization', title: 'Cannibalization' },
      { id: 'section-structure', title: 'Content Structure' }
    ]
  },
  {
    id: 'technical',
    title: 'Technical',
    icon: '<svg>...</svg>', // Heroicons: cog-6-tooth
    href: 'technical.html',
    sections: [
      { id: 'section-cwv', title: 'Core Web Vitals' },
      { id: 'section-pagespeed', title: 'PageSpeed' },
      { id: 'section-schema', title: 'Schema Markup' },
      { id: 'section-meta', title: 'Meta Tags' },
      { id: 'section-crawl', title: 'Crawl Issues' },
      { id: 'section-sitestructure', title: 'Site Structure' }
    ]
  },
  {
    id: 'links',
    title: 'Links',
    icon: '<svg>...</svg>', // Heroicons: link
    href: 'links.html',
    sections: [
      { id: 'section-linkstats', title: 'Link Overview' },
      { id: 'section-orphans', title: 'Orphan Pages' },
      { id: 'section-hubs', title: 'Hub & Spoke' },
      { id: 'section-depth', title: 'Link Depth' },
      { id: 'section-backlinks', title: 'Backlink Profile' }
    ]
  },
  {
    id: 'competitors',
    title: 'Competitors',
    icon: '<svg>...</svg>', // Heroicons: chart-bar
    href: 'competitors.html',
    sections: [
      { id: 'section-comparison', title: 'Comparison' },
      { id: 'section-radar', title: 'Health Radar' },
      { id: 'section-strategies', title: 'Strategies' },
      { id: 'section-domains', title: 'Domain Metrics' }
    ]
  },
  {
    id: 'local',
    title: 'Local',
    icon: '<svg>...</svg>', // Heroicons: map-pin
    href: 'local.html',
    sections: [
      { id: 'section-gbp', title: 'Business Profile' },
      { id: 'section-localperf', title: 'Local Performance' },
      { id: 'section-citations', title: 'Citations' },
      { id: 'section-mappack', title: 'Map Pack' }
    ]
  },
  {
    id: 'action-plan',
    title: 'Action Plan',
    icon: '<svg>...</svg>', // Heroicons: clipboard-document-check
    href: 'action-plan.html',
    sections: [
      { id: 'section-plan', title: 'Priority Roadmap' },
      { id: 'section-calendar', title: 'Content Calendar' },
      { id: 'section-pillars', title: 'Strategy Pillars' },
      { id: 'section-advantages', title: 'Advantages' },
      { id: 'section-deliverables', title: 'Deliverables' }
    ]
  }
];
```

### Active Page Detection

```javascript
// In nav.js init():
var currentFile = window.location.pathname.split('/').pop() || 'index.html';
window.TPPC.currentPage = currentFile.replace('.html', '');
```

### Side Navigation + Scrollspy

Each page gets a left sidebar showing its sections (from NAV_CONFIG). The sidebar uses `IntersectionObserver`:

```javascript
// In nav.js:
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      // Remove active class from all side-nav links
      // Add active class to matching link
    }
  });
}, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

// Observe all sections on the current page
currentPageConfig.sections.forEach(function(s) {
  var el = document.getElementById(s.id);
  if (el) observer.observe(el);
});
```

### Layout Structure (every page)

```html
<body class="font-sans antialiased">
  <!-- Top nav (injected by nav.js) -->
  <nav id="top-nav" class="fixed top-0 left-0 right-0 z-50 bg-navy-900 ..."></nav>

  <!-- Mobile drawer overlay (injected by nav.js) -->
  <div id="mobile-drawer" class="fixed inset-0 z-40 hidden ..."></div>

  <!-- Main layout: side nav + content -->
  <div class="flex pt-16">
    <!-- Side nav (injected by nav.js, hidden on mobile) -->
    <aside id="side-nav" class="hidden lg:block w-56 fixed top-16 left-0 bottom-0 ..."></aside>

    <!-- Page content -->
    <main id="page-content" class="flex-1 lg:ml-56 min-h-screen">
      <!-- Page-specific sections go here -->
    </main>
  </div>
</body>
```

### Mobile Responsive

- **>= 1024px (lg)**: Top nav + fixed side nav + content with left margin
- **768px - 1023px (md)**: Top nav only (side nav hidden), full-width content
- **< 768px**: Hamburger menu triggers drawer overlay with full nav

---

## 4. Search Index Strategy

### Build-Time Index Generation

The generator (`generate-multipage-report.js`) builds the index by crawling the data:

```javascript
function buildSearchIndex(data) {
  var index = [];

  // Index keywords
  if (data.keywords) {
    data.keywords.forEach(function(kw) {
      index.push({
        page: 'keywords.html',
        section: 'section-rankings',
        title: kw.keyword,
        snippet: 'Rank: ' + (kw.clientRank || 'Not found') + ', Volume: ' + (kw.volume || 'N/A'),
        terms: [kw.keyword, 'ranking', 'keyword']
      });
    });
  }

  // Index issues
  if (data.topIssues) {
    data.topIssues.forEach(function(issue) {
      index.push({
        page: 'index.html',
        section: 'section-issues',
        title: issue.issue,
        snippet: issue.detail,
        terms: [issue.issue, issue.impact, 'issue', 'problem']
      });
    });
  }

  // Index content quality pages
  if (data.contentQuality && data.contentQuality.pages) {
    data.contentQuality.pages.forEach(function(pg) {
      index.push({
        page: 'content.html',
        section: 'section-readability',
        title: pg.title || pg.url,
        snippet: 'Quality: ' + pg.qualityScore + '/100, Words: ' + (pg.readability ? pg.readability.wordCount : 'N/A'),
        terms: [pg.url, pg.title, 'content', 'readability']
      });
    });
  }

  // ... similar for all data sections

  return index;
}
```

### Search Index Entry Shape

```javascript
{
  page: 'links.html',           // target page filename
  section: 'section-orphans',   // section anchor ID
  title: '/blog/old-post',      // display title in results
  snippet: 'Orphan page with 0 inbound links', // preview text
  terms: ['orphan', 'link', '/blog/old-post']   // searchable terms
}
```

### shared/search.js

- Opens with `Ctrl+K` or `Cmd+K`, or clicking the search icon in the top nav
- Modal overlay with text input
- As user types, filters `window.SEARCH_INDEX` via substring match on `title`, `snippet`, and `terms`
- Results are grouped by page
- Clicking a result navigates to `page.html#section-id`
- Keyboard navigation: arrow keys + Enter to select
- Max 20 results shown

---

## 5. Component Breakdown

### Shared CSS Files

| File | Content | Source |
|------|---------|--------|
| `shared/report-styles.css` | All existing styles from `report-styles.css` (685 lines), plus: multi-page layout variables, page-content max-width, section spacing adjustments for side-nav layout | Extended from existing |
| `shared/multipage-nav.css` | Top nav bar, side nav panel, hamburger drawer, scrollspy active indicators, search modal, mobile breakpoints | New |

### Shared JS Files

| File | Namespace | Functions | Source |
|------|-----------|-----------|--------|
| `shared/utils.js` | `TPPC.utils` | `esc(str)`, `gradeClass(grade)`, `severityClass(sev)`, `pillClass(prefix, val)`, `rankClass(rank)`, `$(sel)`, `$$(sel)`, `buildCollapsible(title, contentFn)`, `formatNumber(n)`, `formatPercent(n)` | Extracted from existing lines 356-401 + 1007-1018 |
| `shared/data-loader.js` | `TPPC.data`, `TPPC.boot` | Validates `window.AUDIT_DATA`, sets up namespace, dev fallback, page boot orchestration | New |
| `shared/charts.js` | `TPPC.charts` | `createBarChart(canvasId, config)`, `createDoughnutChart(canvasId, config)`, `createRadarChart(canvasId, config)`, `renderCWVGauge(container, label, value, thresholds)`, `COLORS` palette object | Extracted from existing lines 471-703 + new helpers |
| `shared/nav.js` | `TPPC.nav` | `init()`, `renderTopNav()`, `renderSideNav()`, `initScrollspy()`, `renderMobileDrawer()`, `toggleDrawer()` | New |
| `shared/search.js` | `TPPC.search` | `init()`, `openModal()`, `closeModal()`, `handleInput(query)`, `navigateResult(entry)` | New |
| `shared/print.js` | `TPPC.print` | `preparePDF()` (expand all collapsibles, show all tab panels, add page-break markers), `generateCombinedPDF()` | Extracted from existing print CSS + new multi-page logic |

### Page-Specific JS Files

Each file follows this pattern:

```javascript
// pages/{name}.js
(function() {
  'use strict';

  window.TPPC = window.TPPC || {};
  window.TPPC.pages = window.TPPC.pages || {};

  window.TPPC.pages.{name} = {
    init: function(data) {
      this.renderSectionA(data);
      this.renderSectionB(data);
      // ...
    },

    renderSectionA: function(data) {
      var container = document.getElementById('section-a-content');
      if (!data.relevantKey) {
        document.getElementById('section-a').style.display = 'none';
        return;
      }
      // ... render logic
    }
  };

  // Auto-boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { window.TPPC.boot(); });
  } else {
    window.TPPC.boot();
  }
})();
```

| File | Renderer Functions |
|------|-------------------|
| `pages/index.js` | `renderHero()`, `renderKeyStats()`, `renderTopIssues()`, `renderSiteComparison()`, `renderQuickWins()`, `renderNextSteps()` |
| `pages/keywords.js` | `renderKeywordTable()`, `renderVolumeChart()`, `renderSearchConsole()`, `renderTrafficOverview()` |
| `pages/content.js` | `renderContentOverview()`, `renderReadabilityTable()`, `renderThinContent()`, `renderDuplicateGroups()`, `renderCannibalization()`, `renderStructureAudit()` |
| `pages/technical.js` | `renderCoreWebVitals()`, `renderPageSpeed()`, `renderSchemaAudit()`, `renderMetaTagAudit()`, `renderCrawlIssues()`, `renderSiteStructure()` |
| `pages/links.js` | `renderLinkOverview()`, `renderOrphanPages()`, `renderHubSpokeClusters()`, `renderLinkDepth()`, `renderBacklinkProfile()` |
| `pages/competitors.js` | `renderComparisonTable()`, `renderRadarChart()`, `renderStrategies()`, `renderDomainMetrics()` |
| `pages/local.js` | `renderBusinessProfile()`, `renderLocalPerformance()`, `renderCitationAudit()`, `renderMapPack()` |
| `pages/action-plan.js` | `renderActionPlanTabs()`, `renderContentCalendar()`, `renderStrategyPillars()`, `renderAdvantages()`, `renderDeliverables()` |

---

## 6. Data Schema Extensions

All new fields are added as top-level keys to `audit-data.json` alongside existing keys. Existing keys are preserved unchanged.

### 6.1 `contentQuality` (NEW)

**Python source models**: `ContentQualityRecord`, `ReadabilityMetrics`, `KeywordUsage`, `ContentStructure`, `DuplicateGroup`, `CannibalizationRecord`  
**Consumed by**: `content.html`

```json
"contentQuality": {
  "summary": {
    "totalPagesAnalyzed": 62,
    "avgQualityScore": 45.2,
    "avgReadabilityScore": 58.0,
    "avgSeoScore": 32.1,
    "avgStructureScore": 41.5,
    "thinPageCount": 38,
    "thinThreshold": 300,
    "duplicateGroupCount": 4,
    "cannibalizationCount": 2
  },
  "pages": [
    {
      "url": "/about",
      "title": "About Us",
      "qualityScore": 62.0,
      "readabilityScore": 71.0,
      "seoScore": 48.0,
      "structureScore": 55.0,
      "readability": {
        "fleschReadingEase": 65.2,
        "fleschKincaidGrade": 8.1,
        "gunningFogIndex": 10.3,
        "avgSentenceLength": 16.5,
        "avgWordLength": 4.8,
        "syllableCount": 890,
        "sentenceCount": 42,
        "wordCount": 695,
        "paragraphCount": 12,
        "readingLevel": "8th grade"
      },
      "keywordUsage": {
        "keyword": "real estate mammoth lakes",
        "density": 1.2,
        "count": 8,
        "inTitle": true,
        "inH1": true,
        "inFirst100Words": false,
        "inMetaDescription": true,
        "inUrl": false,
        "headingCount": 2,
        "prominenceScore": 68.0
      },
      "structure": {
        "headingCount": 6,
        "headingHierarchyValid": true,
        "h2Count": 3,
        "h3Count": 2,
        "listCount": 1,
        "imageCount": 4,
        "imagesWithAlt": 2,
        "tableCount": 0,
        "avgParagraphLength": 58.0,
        "shortParagraphs": 3,
        "longParagraphs": 1,
        "internalLinks": 5,
        "externalLinks": 2,
        "hasToc": false,
        "hasFaqSchema": false
      },
      "isThin": false,
      "isDuplicate": false,
      "duplicateOf": "",
      "similarityScore": 0.0,
      "lastModified": "2025-11-15T00:00:00Z",
      "contentAgeDays": 128,
      "isStale": true,
      "issues": ["Missing keyword in first 100 words", "2 images without alt text"],
      "recommendations": ["Add target keyword to opening paragraph", "Add descriptive alt text to all images"]
    }
  ],
  "duplicateGroups": [
    {
      "fingerprint": "a1b2c3d4",
      "pages": ["/listings/page-1", "/listings/page-2"],
      "similarity": 0.92,
      "wordCountRange": [180, 210],
      "recommendation": "Merge into a single page or differentiate content"
    }
  ],
  "cannibalization": [
    {
      "keyword": "mammoth lakes real estate",
      "pages": [
        { "url": "/", "clicks": 12, "impressions": 450, "position": 18.5 },
        { "url": "/about", "clicks": 3, "impressions": 220, "position": 24.1 }
      ],
      "severity": "high",
      "recommendation": "Consolidate ranking signals to homepage; remove competing keyword targeting from /about"
    }
  ]
}
```

### 6.2 `internalLinking` (NEW)

**Python source models**: `LinkGraphResult`, `LinkGraphNode`, `OrphanPage`, `HubSpokeCluster`, `LinkDepthResult`  
**Consumed by**: `links.html`

```json
"internalLinking": {
  "summary": {
    "domain": "example.com",
    "totalPages": 62,
    "totalInternalLinks": 340,
    "orphanCount": 8,
    "orphanRate": 0.129,
    "avgInboundLinks": 5.5,
    "avgOutboundLinks": 8.2,
    "unreachableCount": 3
  },
  "depthResult": {
    "homepage": "https://www.example.com/",
    "maxDepth": 5,
    "avgDepth": 2.3,
    "depths": {
      "/about": 1,
      "/listings": 1,
      "/blog/post-1": 3,
      "/blog/post-2": 4
    },
    "unreachable": ["/old-page-1", "/test-page", "/draft-page"]
  },
  "nodes": [
    {
      "url": "/about",
      "inboundCount": 12,
      "outboundCount": 8,
      "linkDepth": 1,
      "pagerank": 0.045,
      "isOrphan": false,
      "isHub": false,
      "hubCluster": null,
      "recommendations": []
    }
  ],
  "orphans": [
    {
      "url": "/blog/old-post",
      "outboundLinks": 3,
      "isInSitemap": true,
      "recommendation": "Add internal links from related blog posts or resource pages"
    }
  ],
  "hubClusters": [
    {
      "clusterId": "listings-hub",
      "hubUrl": "/listings",
      "hubInbound": 18,
      "hubOutbound": 45,
      "spokes": ["/listings/area-1", "/listings/area-2", "/listings/area-3"],
      "spokeCount": 3
    }
  ],
  "issues": ["8 orphan pages with zero inbound links", "3 pages unreachable from homepage"],
  "recommendations": ["Add contextual links to orphan pages", "Reduce max depth from 5 to 3 clicks"]
}
```

### 6.3 `technicalSeo` (NEW — extends existing `coreWebVitals`)

**Python source models**: `PageAuditRecord`, `PageSpeedRecord`, `CoreWebVitals`  
**Consumed by**: `technical.html`  
**Note**: The existing `coreWebVitals` and `pageSpeedComparison` keys continue to work; this adds page-level audit data.

```json
"technicalSeo": {
  "pageAudits": [
    {
      "url": "/about",
      "title": "About Us | Example",
      "metaDescription": "Learn about our team...",
      "h1Tags": ["About Our Team"],
      "h2Tags": ["Our Story", "Meet the Team"],
      "wordCount": 695,
      "hasSchema": false,
      "schemaTypes": [],
      "canonicalUrl": "https://www.example.com/about",
      "ogTags": { "og:title": "About Us", "og:image": "" },
      "altTextCoverage": 0.50,
      "internalLinks": 5,
      "externalLinks": 2,
      "issues": ["Missing schema markup", "2 images without alt text", "Missing og:image"]
    }
  ],
  "lighthouseResults": [
    {
      "url": "https://www.example.com/",
      "strategy": "mobile",
      "performanceScore": 62,
      "lcp": 3200,
      "inp": 180,
      "cls": 0.12,
      "fcp": 2100,
      "ttfb": 950,
      "speedIndex": 4500,
      "opportunities": [
        { "id": "render-blocking-resources", "title": "Eliminate render-blocking resources", "savings": 1200 }
      ],
      "diagnostics": [
        { "id": "dom-size", "title": "Avoid an excessive DOM size", "value": "1,245 elements" }
      ]
    }
  ],
  "crawlIssues": [
    { "url": "/broken-page", "statusCode": 404, "issue": "Page not found" },
    { "url": "/redirect-loop", "statusCode": 301, "issue": "Redirect chain (3 hops)" }
  ],
  "schemaSummary": {
    "pagesWithSchema": 0,
    "pagesWithoutSchema": 62,
    "schemaTypesFound": [],
    "recommendedSchemas": ["LocalBusiness", "RealEstateAgent", "FAQPage", "BreadcrumbList"]
  },
  "metaTagSummary": {
    "pagesWithTitle": 58,
    "pagesWithoutTitle": 4,
    "pagesWithDescription": 45,
    "pagesWithoutDescription": 17,
    "duplicateTitles": 3,
    "duplicateDescriptions": 8,
    "pagesWithCanonical": 30,
    "pagesWithoutCanonical": 32
  }
}
```

### 6.4 `backlinks` (NEW)

**Python source models**: `BacklinkRecord`, `DomainMetrics`  
**Consumed by**: `links.html` (backlink profile section)

```json
"backlinks": {
  "domainMetrics": {
    "domain": "example.com",
    "domainRating": 28,
    "organicTraffic": 145,
    "organicKeywords": 52,
    "referringDomains": 34,
    "totalBacklinks": 89,
    "trafficValue": 450.00,
    "source": "ahrefs"
  },
  "topBacklinks": [
    {
      "sourceUrl": "https://localnews.com/article",
      "targetUrl": "https://www.example.com/",
      "anchorText": "Example Real Estate",
      "domainRating": 65,
      "isDofollow": true,
      "firstSeen": "2025-08-12T00:00:00Z",
      "source": "ahrefs"
    }
  ],
  "competitorDomainMetrics": [
    {
      "domain": "competitor1.com",
      "domainRating": 52,
      "organicTraffic": 4200,
      "organicKeywords": 890,
      "referringDomains": 210,
      "totalBacklinks": 1450,
      "trafficValue": 12500.00,
      "source": "ahrefs"
    }
  ]
}
```

### 6.5 `localSeo` (NEW)

**Python source models**: `BusinessProfileRecord`, `LocalPerformanceRecord`  
**Consumed by**: `local.html`

```json
"localSeo": {
  "businessProfile": {
    "accountId": "accounts/123",
    "locationId": "locations/456",
    "title": "Client Name Real Estate",
    "address": "123 Main St, City, ST 12345",
    "addressLines": ["123 Main St"],
    "city": "Mammoth Lakes",
    "state": "CA",
    "postalCode": "93546",
    "country": "US",
    "phone": "(555) 123-4567",
    "website": "https://www.example.com",
    "primaryCategory": "Real estate agency",
    "additionalCategories": ["Real estate consultant"],
    "latitude": 37.6485,
    "longitude": -118.9721,
    "isVerified": true,
    "openStatus": "OPEN",
    "rating": 4.8,
    "reviewCount": 45,
    "placeId": "ChIJ...",
    "attributes": {
      "hasWheelchairAccessibleEntrance": true,
      "hasParkingLot": true
    }
  },
  "performance": [
    {
      "locationId": "locations/456",
      "date": "2026-01-15",
      "searchImpressions": 820,
      "mapsImpressions": 1200,
      "desktopSearchImpressions": 340,
      "mobileSearchImpressions": 480,
      "desktopMapsImpressions": 200,
      "mobileMapsImpressions": 1000,
      "callClicks": 12,
      "websiteClicks": 45,
      "directionRequests": 28
    }
  ],
  "citations": {
    "totalFound": 12,
    "consistent": 8,
    "inconsistent": 4,
    "missing": ["yelp.com", "yellowpages.com"],
    "issues": ["Phone number mismatch on 2 directories", "Old address on BBB listing"]
  },
  "mapPackKeywords": [
    { "keyword": "real estate near me", "position": 3, "packSize": 3 },
    { "keyword": "realtor mammoth lakes", "position": null, "packSize": 3 }
  ]
}
```

### 6.6 `domainMetrics` (NEW — site-level for competitors page)

**Python source models**: `DomainMetrics`  
**Consumed by**: `competitors.html`, `links.html`

```json
"domainMetrics": {
  "client": {
    "domain": "example.com",
    "domainRating": 28,
    "organicTraffic": 145,
    "organicKeywords": 52,
    "referringDomains": 34,
    "backlinks": 89,
    "trafficValue": 450.00
  },
  "competitors": [
    {
      "domain": "competitor1.com",
      "domainRating": 52,
      "organicTraffic": 4200,
      "organicKeywords": 890,
      "referringDomains": 210,
      "backlinks": 1450,
      "trafficValue": 12500.00
    },
    {
      "domain": "competitor2.com",
      "domainRating": 45,
      "organicTraffic": 2800,
      "organicKeywords": 620,
      "referringDomains": 155,
      "backlinks": 980,
      "trafficValue": 8200.00
    }
  ]
}
```

### Summary of Existing vs New Data Keys

| JSON Key | Status | Pages |
|----------|--------|-------|
| `client` | **Existing** | index, all (header) |
| `competitor` | **Existing** | index, competitors |
| `topIssues` | **Existing** | index |
| `siteComparison` | **Existing** | index, competitors |
| `keyStats` | **Existing** | index |
| `keywords` | **Existing** | keywords |
| `competitorComparison` | **Existing** | competitors |
| `competitorStrategies` | **Existing** | competitors |
| `quickWins` | **Existing** | index, action-plan |
| `actionPlan` | **Existing** | action-plan |
| `contentCalendar` | **Existing** | action-plan |
| `deliverables` | **Existing** | action-plan |
| `keyPagesCreated` | **Existing** | action-plan |
| `blogPostsCreated` | **Existing** | action-plan |
| `advantages` | **Existing** | action-plan |
| `nextSteps` | **Existing** | index |
| `pillars` | **Existing** | action-plan |
| `mediumTermRoadmap` | **Existing** | action-plan |
| `longTermColumns` | **Existing** | action-plan |
| `coreWebVitals` | **Existing** (optional) | technical |
| `searchConsoleData` | **Existing** (optional) | keywords |
| `trafficData` | **Existing** (optional) | keywords |
| `pageSpeedComparison` | **Existing** (optional) | technical, competitors |
| `contentQuality` | **NEW** | content |
| `internalLinking` | **NEW** | links |
| `technicalSeo` | **NEW** | technical |
| `backlinks` | **NEW** | links |
| `localSeo` | **NEW** | local |
| `domainMetrics` | **NEW** | competitors, links |

---

## 7. Page-by-Page Section Map

### Page 1: `index.html` — Executive Summary

| # | Section ID | Section Title | Data Fields | Exists? | Renderer | Required? |
|---|-----------|---------------|-------------|---------|----------|-----------|
| 1 | `section-hero` | Cover / Hero | `client.name`, `client.company`, `client.website`, `client.websiteUrl`, `client.auditDate`, `client.platform`, `client.location`, `client.overallGrade`, `client.gradeSummary`, `client.serviceType` | Yes | `renderHero(data)` | Required |
| 2 | `section-stats` | Key Stats Dashboard | `keyStats[]` (value, label, severity) | Yes | `renderKeyStats(data)` | Required |
| 3 | `section-issues` | Top Issues Found | `topIssues[]` (issue, detail, impact, effort) | Yes | `renderTopIssues(data)` | Required |
| 4 | `section-comparison` | Site vs Competitor | `siteComparison[]` (metric, client, competitor, gap), `client.website`, `competitor.primaryLabel` | Yes | `renderSiteComparison(data)` | Required |
| 5 | `section-quickwins` | Quick Wins | `quickWins[]` (action, impact) | Yes | `renderQuickWins(data)` | Required |
| 6 | `section-nextsteps` | Next Steps | `nextSteps[]` (text, sub) | Yes | `renderNextSteps(data)` | Required |

**Notes**: This page consolidates the executive view. No new data fields required. All renderers are extracted from the existing single-page report.

---

### Page 2: `keywords.html` — Keywords & Search Visibility

| # | Section ID | Section Title | Data Fields | Exists? | Renderer | Required? |
|---|-----------|---------------|-------------|---------|----------|-----------|
| 1 | `section-rankings` | Keyword Rankings Table | `keywords[]` (keyword, volume, clientRank, competitorRank, topResult, difficulty, cpc) | Yes | `renderKeywordTable(data)` | Required |
| 2 | `section-volume` | Search Volume Chart | `keywords[]` (keyword, volume, clientRank) | Yes | `renderVolumeChart(data)` | Conditional (needs numeric volumes) |
| 3 | `section-organic` | Organic Keywords | `backlinks.domainMetrics.organicKeywords`, `backlinks.domainMetrics.organicTraffic` | **NEW** | `renderOrganicOverview(data)` | Conditional |
| 4 | `section-gsc` | Search Console Insights | `searchConsoleData.topQueries[]`, `searchConsoleData.topPages[]` | Yes (optional) | `renderSearchConsole(data)` | Conditional |
| 5 | `section-traffic` | Traffic Overview | `trafficData.channels[]`, `trafficData.devices[]`, `trafficData.topLandingPages[]` | Yes (optional) | `renderTrafficOverview(data)` | Conditional |

---

### Page 3: `content.html` — Content Quality & Readability

| # | Section ID | Section Title | Data Fields | Exists? | Renderer | Required? |
|---|-----------|---------------|-------------|---------|----------|-----------|
| 1 | `section-overview` | Content Overview | `contentQuality.summary` (totalPagesAnalyzed, avgQualityScore, avgReadabilityScore, avgSeoScore, avgStructureScore, thinPageCount, duplicateGroupCount) | **NEW** | `renderContentOverview(data)` | Required |
| 2 | `section-readability` | Readability Analysis | `contentQuality.pages[]` (url, title, readabilityScore, readability.fleschReadingEase, readability.wordCount, readability.readingLevel) | **NEW** | `renderReadabilityTable(data)` | Conditional |
| 3 | `section-thin` | Thin Content | `contentQuality.pages[]` filtered by `isThin === true`, `contentQuality.summary.thinPageCount`, `contentQuality.summary.thinThreshold` | **NEW** | `renderThinContent(data)` | Conditional |
| 4 | `section-duplicates` | Duplicate Content | `contentQuality.duplicateGroups[]` (fingerprint, pages, similarity, wordCountRange, recommendation) | **NEW** | `renderDuplicateGroups(data)` | Conditional |
| 5 | `section-cannibalization` | Keyword Cannibalization | `contentQuality.cannibalization[]` (keyword, pages[url,clicks,impressions,position], severity, recommendation) | **NEW** | `renderCannibalization(data)` | Conditional |
| 6 | `section-structure` | Content Structure Audit | `contentQuality.pages[]` (structure.headingCount, structure.headingHierarchyValid, structure.imageCount, structure.imagesWithAlt, structure.hasFaqSchema, structure.internalLinks) | **NEW** | `renderStructureAudit(data)` | Conditional |

---

### Page 4: `technical.html` — Technical SEO & Performance

| # | Section ID | Section Title | Data Fields | Exists? | Renderer | Required? |
|---|-----------|---------------|-------------|---------|----------|-----------|
| 1 | `section-cwv` | Core Web Vitals | `coreWebVitals.mobile` (LCP, CLS, FCP, INP, TTFB), `coreWebVitals.desktop` (same) | Yes (optional) | `renderCoreWebVitals(data)` | Conditional |
| 2 | `section-pagespeed` | PageSpeed Scores | `technicalSeo.lighthouseResults[]` (url, strategy, performanceScore, opportunities[], diagnostics[]), `pageSpeedComparison[]` | Mixed (pageSpeedComparison=existing, lighthouseResults=**NEW**) | `renderPageSpeed(data)` | Conditional |
| 3 | `section-schema` | Schema Markup Audit | `technicalSeo.schemaSummary` (pagesWithSchema, pagesWithoutSchema, schemaTypesFound, recommendedSchemas), `technicalSeo.pageAudits[].hasSchema`, `technicalSeo.pageAudits[].schemaTypes` | **NEW** | `renderSchemaAudit(data)` | Conditional |
| 4 | `section-meta` | Meta Tag Audit | `technicalSeo.metaTagSummary` (pagesWithTitle, pagesWithoutTitle, pagesWithDescription, pagesWithoutDescription, duplicateTitles, duplicateDescriptions, pagesWithCanonical, pagesWithoutCanonical) | **NEW** | `renderMetaTagAudit(data)` | Conditional |
| 5 | `section-crawl` | Crawl Issues | `technicalSeo.crawlIssues[]` (url, statusCode, issue) | **NEW** | `renderCrawlIssues(data)` | Conditional |
| 6 | `section-sitestructure` | Site Structure Overview | `technicalSeo.pageAudits[]` (url, title, wordCount, internalLinks, externalLinks, issues), aggregated stats | **NEW** | `renderSiteStructure(data)` | Conditional |

---

### Page 5: `links.html` — Internal Linking & Backlinks

| # | Section ID | Section Title | Data Fields | Exists? | Renderer | Required? |
|---|-----------|---------------|-------------|---------|----------|-----------|
| 1 | `section-linkstats` | Link Overview | `internalLinking.summary` (totalPages, totalInternalLinks, orphanCount, orphanRate, avgInboundLinks, avgOutboundLinks, unreachableCount) | **NEW** | `renderLinkOverview(data)` | Conditional |
| 2 | `section-orphans` | Orphan Pages | `internalLinking.orphans[]` (url, outboundLinks, isInSitemap, recommendation) | **NEW** | `renderOrphanPages(data)` | Conditional |
| 3 | `section-hubs` | Hub & Spoke Clusters | `internalLinking.hubClusters[]` (clusterId, hubUrl, hubInbound, hubOutbound, spokes, spokeCount) | **NEW** | `renderHubSpokeClusters(data)` | Conditional |
| 4 | `section-depth` | Link Depth Analysis | `internalLinking.depthResult` (maxDepth, avgDepth, depths{}, unreachable[]) | **NEW** | `renderLinkDepth(data)` | Conditional |
| 5 | `section-backlinks` | Backlink Profile | `backlinks.domainMetrics` (domainRating, referringDomains, totalBacklinks, trafficValue), `backlinks.topBacklinks[]`, `backlinks.competitorDomainMetrics[]` | **NEW** | `renderBacklinkProfile(data)` | Conditional |

---

### Page 6: `competitors.html` — Competitor Analysis

| # | Section ID | Section Title | Data Fields | Exists? | Renderer | Required? |
|---|-----------|---------------|-------------|---------|----------|-----------|
| 1 | `section-comparison` | Multi-Competitor Comparison | `competitorComparison[]` (metric, client, comp1, comp2, gap), `competitor.all[]` | Yes | `renderComparisonTable(data)` | Required |
| 2 | `section-radar` | Site Health Radar | `siteComparison[]` (for radar normalization) | Yes | `renderRadarChart(data)` | Conditional (needs 3+ metrics) |
| 3 | `section-strategies` | Competitor Strategies | `competitorStrategies[]` (strategy, detail) | Yes | `renderStrategies(data)` | Conditional |
| 4 | `section-domains` | Domain Metrics Comparison | `domainMetrics.client`, `domainMetrics.competitors[]` (domainRating, organicTraffic, organicKeywords, referringDomains, backlinks, trafficValue) | **NEW** | `renderDomainMetrics(data)` | Conditional |
| 5 | `section-pagespeedcomp` | PageSpeed Comparison | `pageSpeedComparison[]` (name, score) | Yes (optional) | `renderPageSpeedComparison(data)` | Conditional |

---

### Page 7: `local.html` — Local SEO & GBP

| # | Section ID | Section Title | Data Fields | Exists? | Renderer | Required? |
|---|-----------|---------------|-------------|---------|----------|-----------|
| 1 | `section-gbp` | Google Business Profile | `localSeo.businessProfile` (title, address, city, state, phone, website, primaryCategory, additionalCategories, isVerified, rating, reviewCount, latitude, longitude) | **NEW** | `renderBusinessProfile(data)` | Conditional |
| 2 | `section-localperf` | Local Performance Trends | `localSeo.performance[]` (date, searchImpressions, mapsImpressions, callClicks, websiteClicks, directionRequests) | **NEW** | `renderLocalPerformance(data)` | Conditional |
| 3 | `section-citations` | Citation Audit | `localSeo.citations` (totalFound, consistent, inconsistent, missing[], issues[]) | **NEW** | `renderCitationAudit(data)` | Conditional |
| 4 | `section-mappack` | Map Pack Visibility | `localSeo.mapPackKeywords[]` (keyword, position, packSize) | **NEW** | `renderMapPack(data)` | Conditional |

---

### Page 8: `action-plan.html` — Action Plan & Strategy

| # | Section ID | Section Title | Data Fields | Exists? | Renderer | Required? |
|---|-----------|---------------|-------------|---------|----------|-----------|
| 1 | `section-plan` | Priority Action Plan | `actionPlan` (quickWins[], shortTerm[], mediumTerm[], longTerm[]) — each item: action, why, effort, impact | Yes | `renderActionPlanTabs(data)` | Required |
| 2 | `section-calendar` | Content Calendar | `contentCalendar` (month1Label, month1[], month2Label, month2[], ...) — each week: week, topic, keyword, type | Yes | `renderContentCalendar(data)` | Conditional |
| 3 | `section-pillars` | Strategy Pillars | `pillars[]` (title, desc, time) | Yes | `renderStrategyPillars(data)` | Conditional |
| 4 | `section-roadmap` | Medium-Term Roadmap | `mediumTermRoadmap[]` (title, detail) | Yes | `renderMediumTermRoadmap(data)` | Conditional |
| 5 | `section-longterm` | Long-Term Strategy | `longTermColumns[]` (title, items[]) | Yes | `renderLongTermStrategy(data)` | Conditional |
| 6 | `section-advantages` | Your Advantages | `advantages[]` (title, detail) | Yes | `renderAdvantages(data)` | Conditional |
| 7 | `section-deliverables` | Deliverables | `deliverables[]` (name, scope, score, status), `keyPagesCreated[]`, `blogPostsCreated[]` | Yes | `renderDeliverables(data)` | Conditional |

---

## 8. Build Script: generate-multipage-report.js

### Responsibilities

1. **Read inputs**: `audit-data.json` + 8 HTML templates + all CSS/JS
2. **Inject `window.AUDIT_DATA`** into each page's `<head>` placeholder
3. **Build search index** from data and inject `window.SEARCH_INDEX` into each page
4. **Inline CSS** (optional `--inline` flag for self-contained output)
5. **Derive output directory** from client name + date
6. **Copy shared JS files** alongside HTML (unless `--inline`)
7. **Optional PDF**: Use Playwright to render each page, then combine into single PDF

### CLI Interface

```bash
node generate-multipage-report.js \
  --data ../seo/audit-data.json \
  --output ./dist/ \
  [--inline]    # Inline all CSS/JS for self-contained pages
  [--pdf]       # Also generate combined PDF
```

### PDF Export Strategy

For combined PDF export:
1. Render each page in order using Playwright
2. Expand all collapsibles, show all tab panels
3. Render each page as a PDF section
4. Merge into single PDF with page numbers
5. Footer: "SEO Audit Report — Page X of Y"

---

## 9. TastyPPC Design System

### Color Palette (extended from existing)

```css
:root {
  /* Brand — preserved from existing */
  --navy-900: #0b1629;
  --navy-800: #111d35;
  --navy-700: #172644;
  --navy-600: #1e3a5f;
  --accent-blue: #3b82f6;
  --accent-indigo: #6366f1;

  /* Severity — preserved */
  --sev-critical: #ef4444;
  --sev-high: #f97316;
  --sev-medium: #eab308;
  --sev-low: #22c55e;
  --sev-info: #3b82f6;

  /* Grades — preserved */
  --grade-a: #22c55e;
  --grade-b: #84cc16;
  --grade-c: #eab308;
  --grade-d: #f97316;
  --grade-f: #ef4444;

  /* NEW: Navigation */
  --nav-bg: var(--navy-900);
  --nav-text: #94a3b8;
  --nav-active: #fff;
  --nav-hover: #e2e8f0;
  --sidenav-bg: #f8fafc;
  --sidenav-border: #e2e8f0;
  --sidenav-active: var(--accent-blue);
}
```

### Typography

- **Font**: Inter via Google Fonts CDN (weights: 300, 400, 500, 600, 700, 800, 900)
- **Headings**: `font-weight: 700-800`, `color: var(--navy-800)`
- **Body**: `font-weight: 400`, `color: #1e293b`

### Chart.js Color Palette

```javascript
TPPC.charts.COLORS = {
  primary: '#3b82f6',
  secondary: '#6366f1',
  success: '#22c55e',
  warning: '#f97316',
  danger: '#ef4444',
  info: '#06b6d4',
  slate: '#64748b',
  set: ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#64748b']
};
```

---

## 10. Migration Path from Single-Page

| Existing Feature | Single-Page Location | Multi-Page Destination |
|-----------------|---------------------|----------------------|
| Hero/Cover | Lines 54-80 | `index.html` section-hero |
| Key Stats | Lines 85-92 | `index.html` section-stats |
| Top Issues | Lines 97-104 | `index.html` section-issues |
| Site Comparison | Lines 109-121 | `index.html` section-comparison |
| Core Web Vitals | Lines 126-133 | `technical.html` section-cwv |
| Keyword Rankings | Lines 138-164 | `keywords.html` section-rankings |
| Competitor Analysis | Lines 169-193 | `competitors.html` section-comparison + section-strategies |
| Search Console | Lines 198-205 | `keywords.html` section-gsc |
| Traffic Overview | Lines 210-227 | `keywords.html` section-traffic |
| Quick Wins | Lines 232-239 | `index.html` section-quickwins |
| Action Plan | Lines 244-263 | `action-plan.html` section-plan |
| Content Calendar | Lines 268-275 | `action-plan.html` section-calendar |
| Advantages | Lines 280-287 | `action-plan.html` section-advantages |
| Next Steps | Lines 292-298 | `index.html` section-nextsteps |
| Appendix | Lines 304-311 | `action-plan.html` section-deliverables |
| Data Loader | Lines 332-351 | `shared/data-loader.js` |
| Utils (esc, gradeClass, etc.) | Lines 356-401 | `shared/utils.js` |
| Section Renderers | Lines 408-1005 | Split across `pages/*.js` |
| Chart Renderers | Lines 471-703, 1038-1075 | `shared/charts.js` + page-specific |
| Collapsible Builder | Lines 1007-1018 | `shared/utils.js` |
| Section Renumbering | Lines 1023-1033 | `shared/nav.js` (per-page auto) |
| Init/Boot | Lines 1080-1127 | `shared/data-loader.js` boot() + page `.init()` |

---

## 11. Implementation Handoff Order

Recommended build sequence for downstream lanes:

1. **shared/utils.js** — Extract from existing, no dependencies
2. **shared/data-loader.js** — Namespace setup, boot logic
3. **shared/charts.js** — Extract Chart.js helpers
4. **shared/report-styles.css** — Copy existing + add nav layout vars
5. **shared/multipage-nav.css** — New nav styles
6. **shared/nav.js** — Top nav + side nav + scrollspy
7. **shared/search.js** — Search modal
8. **shared/print.js** — Print/PDF preparation
9. **index.html + pages/index.js** — First page, validates full pipeline
10. **keywords.html + pages/keywords.js** — Second page
11. **content.html + pages/content.js** — Third page (NEW data)
12. **technical.html + pages/technical.js** — Fourth page
13. **links.html + pages/links.js** — Fifth page (NEW data)
14. **competitors.html + pages/competitors.js** — Sixth page
15. **local.html + pages/local.js** — Seventh page (NEW data)
16. **action-plan.html + pages/action-plan.js** — Eighth page
17. **generate-multipage-report.js** — Build script
