# Backlink Opportunities Page — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Scope:** New 9th report page for the SEO audit multipage report system

---

## Overview

A dedicated "Backlink Opportunities" page that compares referring domains across all audited competitors, surfaces link-building opportunities the client is missing, and provides intelligence on competitor link-building strategies. The page answers: "Who links to my competitors but not to me, and what should I do about it?"

---

## Data Collection

### API Calls (runs during audit research phase)

Per competitor (7 competitors typical), capped at **200 referring domains each** (configurable via `backlinkOpportunitiesLimit` in `audit-data.json`):

| Endpoint | Purpose | Per Competitor |
|----------|---------|---------------|
| `get_referring_domains(domain, limit=200)` | Top referring domains with DR, backlink count, dofollow count, first_seen | Yes |
| `get_backlinks_summary(domain)` | Domain-level metrics (already collected in current audit flow) | Already done |
| `get_backlink_intersection(targets)` | Shared/unique referring domains across client + all competitors in one call | Once total |

**Estimated cost per audit:** ~$10 at 200 cap for 7 competitors.

### Backlink Research Agent Updates

Agent 6 (backlink-researcher) in `commands/seo-audit.md` needs updating to:

1. Fetch referring domains for each competitor (not just the client)
2. Run the intersection endpoint with client + all competitor domains
3. Output a `backlink-opportunities.json` file alongside the existing `backlink-analysis.md`
4. Tag each referring domain with type, local relevance, and effort (see Per-RLink Enrichment below)

---

## Data Architecture — Hybrid (Approach C)

### audit-data.json (inline, loads instantly)

New top-level key `backlinkOpportunities`:

```json
{
  "backlinkOpportunities": {
    "summary": {
      "highPriorityGaps": 11,
      "totalRLinksAnalyzed": 156,
      "sharedWithClient": 12,
      "clientBacklinks": 280,
      "clientReferringDomains": 209,
      "competitorAvgBacklinks": 8781,
      "competitorAvgReferringDomains": 543
    },
    "insight": "You have 209 referring domains. The average competitor has 543. The 11 high-priority domains below are directories and industry sites where getting listed is straightforward.",
    "top10": [
      {
        "domain": "yellowpages.ca",
        "dr": 72,
        "clientHas": false,
        "competitorCount": 7,
        "competitors": ["justinhavre.com", "calgaryhomes.ca", "..."],
        "score": 96,
        "type": "directory",
        "localRelevance": "national",
        "effort": "easy"
      }
    ],
    "perCompetitorOverview": [
      {
        "domain": "justinhavre.com",
        "referringDomains": 1162,
        "backlinks": 47564,
        "avgDR": 34,
        "dofollowRatio": 0.72,
        "typeCounts": { "directory": 45, "press": 12, "social": 8, "industry": 22, "blog": 15, "other": 98 }
      }
    ],
    "typeGaps": [
      { "type": "press", "client": 0, "topCompetitor": "justinhavre.com", "topCompetitorCount": 12 },
      { "type": "directory", "client": 3, "topCompetitor": "calgaryhomes.ca", "topCompetitorCount": 45 }
    ]
  }
}
```

### backlink-opportunities.json (separate file, lazy-loaded)

Lives alongside the HTML report at `reports/multipage/backlink-opportunities.json`. Loaded via `fetch()` when user navigates to detail views.

```json
{
  "generated": "2026-04-06T12:00:00Z",
  "config": {
    "limit": 200,
    "clientDomain": "sellingcalgarycastles.com"
  },
  "competitors": [
    {
      "domain": "justinhavre.com",
      "referringDomains": [
        {
          "domain": "calgaryherald.com",
          "dr": 82,
          "backlinks": 14,
          "dofollow": 12,
          "firstSeen": "2019-03-15",
          "type": "press",
          "localRelevance": "local",
          "effort": "hard"
        }
      ]
    }
  ],
  "intersection": {
    "allDomains": [
      {
        "domain": "calgaryherald.com",
        "dr": 82,
        "clientHas": false,
        "competitors": ["justinhavre.com", "calgaryhomes.ca", "calgaryhousefinder.ca", "kirbycox.com", "bestcalgaryhomes.com"],
        "competitorCount": 5,
        "score": 94,
        "type": "press",
        "localRelevance": "local",
        "effort": "hard",
        "dofollowFromCompetitors": true
      }
    ]
  },
  "drDistribution": {
    "sellingcalgarycastles.com": { "0-10": 45, "11-20": 80, "21-30": 40, "31-50": 30, "51-70": 10, "71+": 4 },
    "justinhavre.com": { "0-10": 200, "11-20": 300, "21-30": 250, "31-50": 200, "51-70": 120, "71+": 92 }
  },
  "dofollowRatios": {
    "sellingcalgarycastles.com": 0.65,
    "justinhavre.com": 0.72,
    "calgaryhomes.ca": 0.68
  },
  "profileSimilarity": [
    { "domain1": "justinhavre.com", "domain2": "calgaryhomes.ca", "overlapPercent": 34 },
    { "domain1": "kirbycox.com", "domain2": "bestcalgaryhomes.com", "overlapPercent": 28 }
  ]
}
```

---

## Page Structure

### HTML: `backlink-opportunities.html`

9th page in the multipage report. Same shell as all other pages (nav, sidebar, scrollspy, shared scripts). Page-specific renderer: `pages/backlink-opportunities.js`.

### Section 1: Summary (`#section-summary`)

- **4 stat cards**: High-priority gaps, total RLinks analyzed, already shared, your backlinks vs competitor avg
- **Referring domain bar chart**: Client vs each competitor — horizontal bar chart, log scale (gaps are 5x-50x). Uses Chart.js like other pages.
- **Insight card**: Auto-generated narrative from `backlinkOpportunities.insight`. Styled like the existing `advantage-card` pattern.

### Section 2: Top 10 Opportunities (`#section-top-opportunities`)

Table columns:
- Rank (#)
- Referring Domain (linked name)
- DR
- Competitor Overlap (small 14px dots for ratio + first 2 named competitors + "+N more" expand)
- Opportunity Score (gradient bar + number)
- Priority badge (High Priority / Worth Exploring / Already Have)
- Type tag (directory, press, social, etc.)
- Local flag (local/national/international)

Sorted by combined opportunity score (overlap count weighted + DR weighted) by default.

### Section 3: RLink Intelligence (`#section-intelligence`)

Lazy-loaded from `backlink-opportunities.json`.

Sub-sections:

1. **Type breakdown chart** — Grouped bar chart: each competitor's RLink distribution by type (directory, press, social, industry, blog, forum, other). Client shown as first bar for comparison.

2. **Link type gaps** — Cards showing: "You have 0 press RLinks. justinhavre.com has 12." One card per type where client is significantly behind.

3. **Local relevance** — Table or highlighted list of RLinks flagged as locally relevant (.ca, Calgary/Alberta-specific). These are the highest-value targets for local SEO clients.

4. **DR distribution histogram** — Chart.js histogram per competitor showing quality spread. Answers: "Are they getting links from legit sites or spam?"

5. **Dofollow vs nofollow ratio** — Small comparison bar per competitor. Simple visual.

6. **Link velocity** — Timeline or bar chart showing new referring domains per month/quarter per competitor (from `firstSeen` dates). Answers: "Who's actively building?"

7. **Backlink profile similarity** — Table or heatmap showing overlap percentage between competitor pairs. Answers: "Which competitors follow the same playbook?"

### Section 4: Detailed Analysis (`#section-details`)

Three tabbed views, lazy-loaded from `backlink-opportunities.json`:

**Opportunities View (default)**
- Full filterable/sortable table of ALL RLinks
- Columns: domain, DR, you have?, overlap (dots + names + show more), score, priority, type, local flag, effort
- Filters: search, dropdown (all / missing / shared / exclusive), sort (score / DR / overlap)
- Pagination (25 per page)

**By Competitor View**
- Accordion per competitor (domain name + referring domain count + backlink count in header)
- First accordion open by default
- Each accordion contains: filter bar + referring domains table (domain, DR, backlinks, dofollow, you have?)
- Filter: all / you don't have these / you share these
- Pagination per accordion

**Matrix View**
- Checkmark grid table
- Rows: referring domains (sorted by opportunity score)
- Columns: DR, You (highlighted), then each competitor (full domain name in header)
- Sticky first column for scrolling on mobile
- Legend: checkmark = has link, X = you're missing, dash = competitor doesn't have either
- Filters: search, dropdown (all / missing only / shared only / high DR only)
- Pagination

---

## Per-RLink Enrichment

Each referring domain is tagged during the research phase:

### Type Classification

| Type | Heuristic |
|------|-----------|
| directory | Domain matches known directory list (yellowpages, yelp, bbb, 411, etc.) or page structure indicates listing |
| social | facebook.com, instagram.com, linkedin.com, twitter.com, youtube.com, pinterest.com |
| press | Known news domains (herald, globalnews, cbc, etc.) or .news TLD |
| industry | Real estate specific: realtor.ca, creb.com, point2homes, zillow, etc. |
| government | .gov or .gc.ca domains |
| educational | .edu domains |
| blog | Detected via URL patterns (/blog/, /post/, /article/) or CMS signatures |
| forum | Detected via URL patterns (/forum/, /thread/, /discussion/) |
| other | Default |

The tagging is best-effort during research. A known-domains lookup list handles the top 80%. The remainder defaults to "other" — better to be honest than guess.

### Local Relevance

| Flag | Criteria |
|------|----------|
| local | Domain contains city/region name (calgary, alberta) or is a known local business/org |
| national | .ca TLD but not city-specific |
| international | Everything else |

### Effort Classification

| Effort | Criteria |
|--------|----------|
| easy | Directories, citations, social profiles — submit a listing |
| medium | Guest posts, partnerships, industry associations — requires outreach |
| hard | Press mentions, editorial links, .gov/.edu — requires earned media or significant authority |

---

## Explainer Content

### "How to Use This Page" (top-level explainer)

Triggered by the explainer widget on first visit or via "What does this mean?" links.

Content covers:
- What referring domains are and why they matter for SEO
- How the opportunity score is calculated (overlap count * weight + DR * weight, normalized to 0-100)
- What "High Priority" means (3+ competitors share this link, you don't have it)
- How to act on the data: start with easy/high-priority, then work through medium effort
- What the different views are for (opportunities = action planning, by competitor = studying their strategy, matrix = comprehensive comparison)

### Per-section explainers

Each section has a "What does this mean?" trigger with section-specific guidance:
- Summary: What the numbers mean in context
- Type breakdown: Why link diversity matters
- Local relevance: Why local links are weighted higher for local SEO
- DR distribution: What a healthy vs unhealthy quality spread looks like
- Matrix: How to read the grid and find patterns

---

## Report Generator Updates

### `generate-multipage-report.js`

1. Read `backlink-opportunities.json` from research directory (if it exists)
2. Auto-populate `backlinkOpportunities` in `audit-data.json` (summary, top 10, per-competitor overview, insight, type gaps)
3. Copy `backlink-opportunities.json` to the output report directory alongside the HTML
4. Generate `backlink-opportunities.html` from the template (same injection pattern as other pages)
5. Update search index to include backlink opportunity entries

### `nav.js`

Add 9th entry to `NAV_CONFIG`:

```javascript
{
  id: 'backlink-opportunities',
  title: 'Backlinks',
  icon: '<svg>...</svg>', // link/chain icon
  href: 'backlink-opportunities.html',
  sections: [
    { id: 'section-summary', title: 'Summary' },
    { id: 'section-top-opportunities', title: 'Top Opportunities' },
    { id: 'section-intelligence', title: 'RLink Intelligence' },
    { id: 'section-details', title: 'Detailed Analysis' }
  ]
}
```

Position: after Links (5th page), before Competitors (6th page). Reorder so the flow is: Links > Backlinks > Competitors.

---

## Template Files (new/modified)

### New Files

| File | Purpose |
|------|---------|
| `template/reports/multipage/backlink-opportunities.html` | HTML template for the page |
| `template/reports/multipage/pages/backlink-opportunities.js` | Page renderer (summary, charts, tables, tabs, lazy loading) |

### Modified Files

| File | Change |
|------|--------|
| `template/reports/multipage/shared/nav.js` | Add 9th page to NAV_CONFIG |
| `template/reports/multipage/generate-multipage-report.js` | Add backlink-opportunities to generation pipeline, copy JSON, update search index |
| `commands/seo-audit.md` | Update Agent 6 (backlink-researcher) to fetch competitor referring domains and produce backlink-opportunities.json |

---

## Mobile Responsiveness

Follow existing template patterns:
- Stat cards: 2-column grid on mobile, 4-column on desktop
- Tables: `report-table-wrap` with `overflow-x: auto` for horizontal scroll
- Matrix view: sticky first column works on touch scroll
- Tab buttons: wrap on small screens
- Accordion headers: full-width tap targets
- Charts: Chart.js responsive mode (already configured in `charts.js`)
- Overlap cell: dots wrap naturally, "show more" works on tap

---

## Scoring Algorithm

Opportunity score (0-100) for each referring domain:

```
overlapWeight = 0.6
drWeight = 0.4

overlapScore = (competitorCount / totalCompetitors) * 100
drScore = min(dr, 100)

rawScore = (overlapScore * overlapWeight) + (drScore * drWeight)
score = round(rawScore)
```

If `clientHas === true`, score is halved (still useful to see but not an "opportunity").

Sorted by score descending. User can re-sort by DR or overlap count.

---

## Tiered Pricing (Internal — NOT in report)

- **Standard** (included in audit): 200 referring domains per competitor, all features above
- **Deep Dive** (follow-up service): Full referring domain coverage, individual backlink drill-down per domain. Discussed between auditor and client. Pricing: 2x API cost (1x covers API, 1x is margin).

---

## Dependencies

- Chart.js (already loaded in report)
- DataForSEO Backlinks API ($100/month commitment — already noted in connector)
- No new npm packages needed
- No new Python packages needed
