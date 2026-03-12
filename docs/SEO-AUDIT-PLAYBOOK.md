# SEO Audit Playbook — Repeatable Process

**Version:** 1.0
**Last Used:** March 1, 2026
**Industry Tested:** Real Estate (Park City, UT)
**Adaptable To:** Any local service business website

---

## How to Use This Playbook

Copy this file into any new project directory and tell Claude:

> "Read SEO-AUDIT-PLAYBOOK.md and follow it to audit [CLIENT_WEBSITE]. The competitor is [COMPETITOR_WEBSITE]. The client is [CLIENT_NAME] at [BROKERAGE]. They are in [LOCATION] and their primary goal is [GOAL]."

Claude will then follow the entire process below, creating scripts, spawning agents, generating all reports, deliverables, and client-ready presentation files.

---

## Prerequisites

```bash
mkdir -p results deliverables scripts
npm init -y
npm install playwright pptxgenjs xlsx
npx playwright install chromium
```

---

## Phase 1: Discovery & Setup

### 1.1 Gather Client Info (Ask User)

Collect these before starting:

| Field | Example |
|-------|---------|
| Client website URL | livingparkcityutah.com |
| Client name(s) | Tisha Digman & Cam Schiedel |
| Brokerage/Company | Summit Sotheby's International Realty |
| Primary competitor URL | laurawillisrealestate.com |
| Service type | Full Service (Buy/Sell/Luxury) |
| Target geography | Park City + Summit County, UT |
| Primary goal | More leads and conversions |
| Auto-discover competitors? | Yes/No |

### 1.2 Define Keyword List (25 Keywords)

Build a list of 25 keywords across these 5 categories:

| Category | Count | Examples |
|----------|-------|---------|
| Brand terms | 1-2 | "[client name] [location] real estate" |
| High-volume property terms | 5-6 | "[location] homes for sale", "[location] condos for sale" |
| Area-specific terms | 4-5 | "[subarea] homes for sale", "[county] real estate" |
| Buyer/seller intent terms | 5 | "buy home [location]", "sell home [location]", "[location] real estate market" |
| Long-tail/niche terms | 8-10 | "luxury ski homes [location]", "[location] investment property", "best neighborhoods [location]" |

---

## Phase 2: Research (5 Parallel Agent Tasks)

### Agent Team Structure

Spawn a team with these 5 research tasks running in parallel:

#### Task 1: Keyword Research Agent
**Agent type:** `general-purpose`
**Tools:** WebSearch (primary), Playwright/ddg-search.js (backup)
**Output:** `results/keyword-research.md`

**Prompt template:**
```
You are a keyword research specialist. Search Google for each of the following 25 keywords
and record: (1) whether [CLIENT_SITE] appears in results, (2) whether [COMPETITOR_SITE]
appears, (3) the top organic result, (4) estimated search volume (Very High/High/Medium/Low),
(5) any "People Also Ask" questions.

Keywords: [LIST_25_KEYWORDS]

Target sites to track: [CLIENT_SITE], [COMPETITOR_SITE]

Write a comprehensive keyword research report to results/keyword-research.md including:
- Rankings summary table
- Competitor domain frequency analysis (which domains appear most often)
- Key local competitors identified
- People Also Ask questions (content opportunities)
- Keyword gaps analysis
- Recommended priority actions

Use WebSearch tool for each keyword. If WebSearch is unavailable, use:
node scripts/ddg-search.js "[keyword]"
```

#### Task 2: Site Structure Crawler Agent
**Agent type:** `general-purpose`
**Tools:** Bash (Playwright scripts)
**Output:** `results/client-site-structure.md`

**Prompt template:**
```
You are a technical SEO analyst. Crawl [CLIENT_SITE] and analyze its structure.

Step 1: Crawl sitemap
  node scripts/crawl-sitemap.js [CLIENT_SITE] --analyze

Step 2: Check homepage technical details
  node scripts/check-technical.js
  (Create this script if needed — checks schema, images, social meta, performance)

Step 3: Check additional pages (browse key inner pages)
  node scripts/browse.js [CLIENT_SITE]/about/ --extract-meta --extract-headings --extract-links --extract-text
  node scripts/browse.js [CLIENT_SITE]/buyers/ --extract-meta --extract-headings --extract-text
  node scripts/browse.js [CLIENT_SITE]/sellers/ --extract-meta --extract-headings --extract-text
  node scripts/browse.js [CLIENT_SITE]/contact/ --extract-meta --extract-headings --extract-text
  node scripts/browse.js [CLIENT_SITE]/blog/ --extract-meta --extract-headings --extract-links
  (Plus 3-5 community/service pages)

Write results/client-site-structure.md covering:
- Sitemap analysis (URL count, categories, structure)
- Navigation and internal linking assessment
- Meta tag audit (titles, descriptions, OG tags)
- H1 tag audit
- Image alt text analysis
- Schema markup presence
- Canonical tag analysis
- Robots.txt review
- 20 prioritized technical recommendations
```

#### Task 3: Content Audit Agent
**Agent type:** `general-purpose`
**Tools:** Bash (Playwright scripts)
**Output:** `results/content-audit.md`

**Prompt template:**
```
You are a content quality analyst. Audit the content on [CLIENT_SITE].

Browse and analyze each major page section:
- Homepage
- About page
- Buyer pages (landing + sub-pages)
- Seller pages (landing + sub-pages)
- Community/neighborhood pages (sample 5-8)
- Blog posts (all of them if <20)
- Contact page

For each page assess:
- Word count
- Content quality (unique vs template/generic)
- Local relevance (mentions of [LOCATION]?)
- CTAs and lead capture elements
- Meta data quality
- Heading structure

Write results/content-audit.md with:
- Executive summary with overall grade (A-F)
- Page-by-page analysis
- Sitewide content issues
- Content gaps analysis
- Lead generation assessment
- Prioritized recommendations
```

#### Task 4: Competitor Analysis Agent
**Agent type:** `general-purpose`
**Tools:** Bash (Playwright scripts), WebSearch
**Output:** `results/competitor-analysis.md`

**Prompt template:**
```
You are a competitive intelligence analyst. Analyze [CLIENT_SITE]'s competitors.

For each competitor (start with [COMPETITOR_SITE] + any discovered in keyword research):
1. Crawl their sitemap: node scripts/crawl-sitemap.js [COMPETITOR_DOMAIN]
2. Analyze homepage: node scripts/browse.js [COMPETITOR_URL] --extract-meta --extract-headings --extract-links --extract-text
3. Analyze 3-5 inner pages (community page, blog post, about page)
4. Check schema: create and run a schema check script
5. Assess content strategy, blog frequency, community page depth

Write results/competitor-analysis.md with:
- Executive summary table (all competitors vs client)
- Per-competitor deep dive (structure, content strategy, meta, schema, internal linking, lead capture)
- Cross-competitor analysis tables
- What each competitor does better
- Lessons and recommendations for client
```

#### Task 5: SEO Best Practices Research Agent
**Agent type:** `general-purpose`
**Tools:** WebSearch
**Output:** `results/seo-best-practices-2026.md`

**Prompt template:**
```
You are an SEO research specialist. Research current [YEAR] SEO best practices across 10 topics:
1. Google algorithm updates and ranking factors
2. AI Overviews / SGE optimization
3. E-E-A-T signals and implementation
4. Schema markup best practices
5. Content quality standards and optimal word counts
6. Local SEO for [INDUSTRY]
7. Core Web Vitals and page speed
8. Link building strategies
9. Mobile-first indexing requirements
10. [INDUSTRY]-specific SEO trends

For each topic, provide: current best practice, what changed recently, actionable recommendations.
Write results/seo-best-practices-[YEAR].md
```

### Monitoring Agents

While agents work, check progress:
- Read results files as they're created
- Send messages to stuck agents
- Spawn replacement agents if any get stuck (this happened with competitor and report tasks)

---

## Phase 3: Report Compilation

Once all 5 research tasks complete, spawn a report compilation agent:

**Agent type:** `general-purpose`
**Output:** `results/FINAL-AUDIT-REPORT.md`

**Prompt template:**
```
You are a senior SEO strategist. Read all research files and compile a comprehensive audit report.

Read these files:
- results/keyword-research.md
- results/client-site-structure.md
- results/content-audit.md
- results/competitor-analysis.md
- results/seo-best-practices-[YEAR].md

Write results/FINAL-AUDIT-REPORT.md with these sections:
1. Executive Summary (overall grade, top 5 issues)
2. Search Visibility Assessment (keyword rankings, gaps, competitive landscape)
3. Technical SEO Issues (critical, high, medium priority)
4. Content Assessment (depth, quality, gaps)
5. Competitor Benchmarking (side-by-side comparison)
6. Prioritized Action Plan (45 items across 4 time horizons)
7. Content Calendar (3-month blog + community page expansion plan)
Appendices: Full keyword data, People Also Ask, competitor domain frequency

Target: 600-800 lines, comprehensive but actionable.
```

---

## Phase 4: Implementation (Smart Team)

Use `/smart-team` skill to spawn implementation agents. Route tasks through both Claude and Codex for comparison, or pick one.

### Implementation Tasks (4 deliverables)

#### Deliverable 1: Meta Tags
**Output:** `deliverables/meta-tags.md`

**Prompt:**
```
Read results/FINAL-AUDIT-REPORT.md, results/client-site-structure.md, results/keyword-research.md.

Create optimized meta titles and descriptions for EVERY page on [CLIENT_SITE].
Requirements:
- Title: 50-60 characters, include primary keyword + brand
- Description: 120-155 characters, include location + CTA + unique value prop
- Show character count for each entry
- Fix any corrupted/stuffed meta tags identified in audit
- Write unique descriptions for all community/service pages
- Include implementation notes (OG tags, H1 fixes, etc.)

Output as a markdown table: URL | Current Title | New Title (chars) | Current Desc | New Desc (chars)
```

#### Deliverable 2: Schema Markup
**Output:** `deliverables/schema-markup.md`

**Prompt:**
```
Read results/FINAL-AUDIT-REPORT.md, results/seo-best-practices-[YEAR].md.

Create production-ready JSON-LD schema markup for [CLIENT_SITE]:
1. Homepage: Organization + RealEstateAgent + WebSite + SearchAction
2. About page: Person (for each agent) + RealEstateAgent
3. Contact page: LocalBusiness + ContactPoint + GeoCoordinates + OpeningHours
4. Community page template: Article + BreadcrumbList (with filled examples)
5. Blog post template: BlogPosting + BreadcrumbList (with filled example)
6. Buyer FAQ page: FAQPage with 5+ Q&A pairs using local data
7. Seller FAQ page: FAQPage with 4+ Q&A pairs using local data
8. AggregateRating for reviews section

Use consistent @id URIs across all schemas. Include implementation checklist.
Validate against schema.org and Google Rich Results Test standards.
```

#### Deliverable 3: Community Pages (Top 4)
**Output:** `deliverables/community-pages.md`

**Prompt:**
```
Read results/FINAL-AUDIT-REPORT.md, results/content-audit.md, results/competitor-analysis.md.

Write 4 expanded community pages for [CLIENT_SITE]'s top neighborhoods.
Each page: 1,000-1,500 words with these sections:
- Meta title + description (with char counts)
- H1 tag
- Overview (2-3 paragraphs)
- Location & Access
- Property Types & Price Ranges
- Lifestyle & Amenities
- Schools & Family
- Dining & Shopping nearby
- "Why Buy in [Community]" section
- FAQ section (4 Q&As for AI Overview optimization)
- Internal link suggestions
- CTA linking to contact page

Communities to write: [TOP 4 from audit findings]
Voice: Luxury, authoritative, locally knowledgeable.
```

#### Deliverable 4: Blog Posts (First 4)
**Output:** `deliverables/blog-posts.md`

**Prompt:**
```
Read results/FINAL-AUDIT-REPORT.md, results/keyword-research.md, results/content-audit.md.

Write 4 SEO-optimized blog posts for [CLIENT_SITE]:
1. [Location] Real Estate Market Report: [Season] [Year]
2. The Best Neighborhoods in [Location] ([Year] Guide)
3. Is [Location] Real Estate a Good Investment? What the Data Says
4. [Location] Ski-in/Ski-out Homes: Communities, Prices, and What to Expect

Each post: 900-1,200 words with:
- Meta title (50-60 chars) + description (120-155 chars)
- H1 tag
- H2/H3 heading structure
- Internal links to community pages and buyer/seller resources
- FAQ/Q&A section (3-4 questions for AI Overview optimization)
- Author byline: [CLIENT_NAME]
- CTA at end linking to contact page

Voice: Expert, data-informed, locally authoritative. Include specific price ranges,
neighborhood names, and market data from the audit findings.
```

### Review & Verification

After implementation, spawn:

1. **Code Reviewer** (`code-reviewer` agent type): Compare outputs, score on SEO/Content/Actionability/2026-Compliance, flag errors
2. **Product Verifier** (`product-verifier` agent type): Verify deliverables match audit requirements

---

## Phase 5: Client Deliverables

### 5.1 Generate Excel Spreadsheet

Run: `node scripts/generate-spreadsheet.js`

Sheets:
1. **Executive Summary** — Grade, top 5 issues, site comparison snapshot
2. **Keyword Research** — 25 keywords with rankings
3. **Competitor Comparison** — Side-by-side metrics
4. **Action Plan** — All items with priority/effort/impact
5. **Content Calendar** — 3-month blog + community expansion plan
6. **Deliverables** — Summary of ready-to-deploy assets

### 5.2 Generate PowerPoint Presentation

Run: `node scripts/generate-presentation.js`

15 slides:
1. Title (client name, website, date)
2. Current State (overall grade + 6 key stats)
3. Top 5 Critical Issues
4. Search Visibility (keyword table showing 0/25)
5. Content Gap (competitor comparison table)
6. What Competitors Do Right (6 strategies)
7. Growth Strategy: 4 Pillars (visual)
8. Quick Wins: Week 1-2 (10-item table)
9. Content Strategy: Month 1-2
10. Blog Content Calendar: 3 Months
11. Ready-to-Deploy Deliverables
12. Medium-Term Roadmap: Month 2-4
13. Long-Term Strategy: Month 4+ (4 columns)
14. The Opportunity (competitive advantages)
15. Next Steps (5 action items)

---

## Complete File Structure

```
project-root/
├── SEO-AUDIT-PLAYBOOK.md          ← This file
├── package.json                    ← Dependencies
├── scripts/
│   ├── browse.js                   ← Playwright: visit URL, extract meta/headings/links/text
│   ├── crawl-sitemap.js            ← Playwright: crawl sitemap.xml, categorize URLs, analyze pages
│   ├── ddg-search.js               ← Playwright: DuckDuckGo search (CAPTCHA-free)
│   ├── check-technical.js          ← Playwright: schema, images, social meta, performance
│   ├── check-competitor-schema.js  ← Playwright: competitor schema/image/social check
│   ├── generate-spreadsheet.js     ← Node: XLSX generation from audit data
│   └── generate-presentation.js    ← Node: PPTX generation from audit data
├── results/
│   ├── keyword-research.md         ← Task 1 output
│   ├── client-site-structure.md    ← Task 2 output
│   ├── content-audit.md            ← Task 3 output
│   ├── competitor-analysis.md      ← Task 4 output
│   ├── seo-best-practices-YYYY.md  ← Task 5 output
│   └── FINAL-AUDIT-REPORT.md       ← Compiled master report
└── deliverables/
    ├── meta-tags.md                ← Optimized meta titles + descriptions
    ├── schema-markup.md            ← Production-ready JSON-LD
    ├── community-pages.md          ← Expanded community page content
    ├── blog-posts.md               ← SEO-optimized blog posts
    ├── REVIEW-claude-vs-codex.md   ← Head-to-head comparison (if dual-routed)
    ├── SEO-Audit-GamePlan.xlsx     ← Client spreadsheet
    └── SEO-Audit-Presentation.pptx ← Client presentation
```

---

## Adaptation Guide

### For a Different Industry

Replace these variables throughout the playbook:

| Variable | Real Estate Example | Generic |
|----------|-------------------|---------|
| Schema types | RealEstateAgent, LocalBusiness | [Industry]Agent, LocalBusiness |
| Community pages | Neighborhood guides | Service area pages / Product category pages |
| Property types | Homes, condos, ski homes | Service types / product lines |
| Market reports | Monthly price/inventory data | Industry trend reports |
| Lifestyle content | "Things to Do" guides | Related educational content |
| Lead magnets | Market report PDF, buyer guide | Industry-specific downloadable |

### For a Different Location

Replace:
- All keyword "[location]" references
- Community/neighborhood names
- Competitor domains
- Geographic schema data (GeoCoordinates, areaServed)

### Key Process Lessons Learned

1. **Google blocks Playwright** — Always start keyword research with WebSearch tool, use Playwright ddg-search.js as backup. Do NOT waste time on Google search via Playwright.

2. **Agents get stuck** — If an agent goes idle for >5 minutes with no output, spawn a replacement. Don't wait.

3. **Ahrefs MCP requires paid account** — Check subscription before planning to use Ahrefs tools. If no account, skip and use WebSearch + Playwright for all data.

4. **Dual-route implementation for quality** — Running both Claude and Codex on the same tasks and reviewing head-to-head produces the best output. Claude wins on technical precision (schema, meta tags); Codex wins on AI Overview optimization (FAQ blocks, structured Q&A).

5. **Community pages need FAQ blocks** — For 2026+ SEO, every content page should include a FAQ section with 3-5 Q&As targeting "People Also Ask" and AI Overview citation.

6. **Spreadsheet + PPT generation** — The xlsx and pptxgenjs Node packages work well. Scripts need to be customized per audit but the structure/template is reusable.

7. **tmux visibility** — If using smart-team, the team agents run as in-process if not in tmux. For pane visibility, launch Claude Code from inside a tmux session first.

---

## Quick-Start Command

To run the full audit from scratch in a new session:

```
mkdir "new-client-audit" && cd "new-client-audit"
cp /path/to/SEO-AUDIT-PLAYBOOK.md .
npm init -y && npm install playwright pptxgenjs xlsx && npx playwright install chromium
```

Then tell Claude:

> "Read SEO-AUDIT-PLAYBOOK.md. The client is [NAME] at [COMPANY], website [URL].
> Primary competitor: [COMPETITOR_URL]. Location: [CITY, STATE]. Goal: [GOAL].
> Run the full audit process with parallel agents. Use smart-team for implementation.
> Generate the spreadsheet and presentation at the end."

---

## Reusable Scripts Reference

### browse.js
```
node scripts/browse.js <url> [options]
Options:
  --extract-meta       Extract title, description, OG tags, canonical, H1s
  --extract-headings   Extract all H1-H6 tags
  --extract-links      Extract and categorize internal/external links
  --extract-text       Extract page text content (first 5000 chars)
  --screenshot <file>  Save screenshot
  --full-page          Full page screenshot
  --headed             Launch visible browser
  --wait <ms>          Wait time after load (default: 2000)
```

### crawl-sitemap.js
```
node scripts/crawl-sitemap.js <domain> [options]
Options:
  --analyze   Analyze first 20 pages (meta, H1, word count, images, schema)
  --headed    Launch visible browser
```

### ddg-search.js
```
node scripts/ddg-search.js "<search query>" [--headed]
Outputs: Ranked results with position, title, URL, domain, snippet
Also checks for target site positions automatically
```

### check-technical.js
```
node scripts/check-technical.js
Checks: Schema/JSON-LD, image alt text, social meta (OG/Twitter), DOM stats, hreflang
Note: Hardcoded URL — edit the URL at top of script for each client
```

### generate-spreadsheet.js
```
node scripts/generate-spreadsheet.js
Reads: Audit data hardcoded in script (update per client)
Output: deliverables/SEO-Audit-GamePlan.xlsx (6 sheets)
```

### generate-presentation.js
```
node scripts/generate-presentation.js
Reads: Audit data hardcoded in script (update per client)
Output: deliverables/SEO-Audit-Presentation.pptx (15 slides)
```

---

*Playbook created March 1, 2026. Based on a complete audit of livingparkcityutah.com.*
