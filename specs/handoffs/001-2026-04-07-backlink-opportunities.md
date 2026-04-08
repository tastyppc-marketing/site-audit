# Session Handoff - 2026-04-07

## Context
Building a new 9th report page ("Backlink Opportunities") for the SEO audit multipage report system. The page compares referring domains across competitors, surfaces link-building gaps, and provides RLink intelligence (type tagging, local relevance, effort classification, DR distribution, link velocity, profile similarity).

## Completed
- Brainstormed and finalized full design with user approval
- Written and committed design spec: `docs/superpowers/specs/2026-04-06-backlink-opportunities-design.md` (commit `f0dea58`)
- Created working mockup page inside Calgary Castles report: `clients/calgary-castles/seo/reports/multipage/backlink-opportunities.html`
- Created page JS renderer with mockup data: `clients/calgary-castles/seo/reports/multipage/pages/backlink-opportunities.js`
- Mockup includes: summary stat cards, insight card, referring domains bar chart, top 10 opportunities table, RLink Intelligence section (type breakdown chart, link type gaps, local relevance table, DR distribution histogram, dofollow ratios, link velocity chart, profile similarity), and 3 tabbed detail views (Opportunities, By Competitor, Matrix)
- Added type/local/effort badge tags to all table rows
- Updated overlap cells to use small dots + first 2 named competitors + "show more" expand

## In Progress
- User reviewed the mockup and provided specific UI feedback that needs to be addressed (see Next Steps)

## Next Steps
1. **Fix chart overflow** — Section 1 "Referring Domains vs Competitors" bar chart: the axis labels/numbers overflow outside the white container box. Needs proper padding or container sizing.

2. **Fix "show more/show less" button position** — When expanded, the "show less" link should appear at the BOTTOM of the expanded list, not stuck in the middle where it was before expansion. Applies to ALL "show more/show less" instances across the page.

3. **Move difficulty badges to their own column** — In Section 2 (Top Opportunities) and Section 4 (Opportunities view), the easy/medium/hard effort badges should be in a separate "Difficulty" column, not stacked under the domain name. Type and local badges stay with the domain name.

4. **Build comprehensive filter system** — Add filter controls above the tables in Sections 2 and 4 with:
   - **Type filter**: dropdown to filter by site type (directory, social, press, industry, blog, etc.)
   - **Local relevance filter**: dropdown for local/national/international
   - **Difficulty filter**: dropdown for easy/medium/hard
   - **Domain Rating filter**: range input or dual slider, 1-100
   - **Competitor overlap filter**: dynamic based on number of competitors (e.g., 1-7), letting user select minimum overlap count
   - **Competitor filter**: multi-select dropdown to filter by specific competitor(s) who have the link
   - **Opportunity score filter**: comparison operator (>, <, =) with numeric input
   - All filters should be dynamic — competitor count and names come from data, not hardcoded

5. **After mockup fixes**: Push to GitHub, create feature branch, then move to implementation plan (`/writing-plans` skill) to build the real thing (template updates, generator updates, agent updates, nav.js config)

6. **Before any real code changes**: Commit current master to GitHub as backup, create `backlink-opportunities` feature branch

## Key Files
- `docs/superpowers/specs/2026-04-06-backlink-opportunities-design.md` — Full approved design spec
- `clients/calgary-castles/seo/reports/multipage/backlink-opportunities.html` — Mockup HTML page (uses real report shell from competitors.html)
- `clients/calgary-castles/seo/reports/multipage/pages/backlink-opportunities.js` — Mockup page renderer (all sections, mockup data)
- `template/reports/multipage/generate-multipage-report.js` — Report generator (needs updating for new page)
- `template/reports/multipage/shared/nav.js` — Nav config (needs 9th page entry)
- `template/reports/multipage/shared/table-filters.js` — Existing filter system (may be reusable/extendable)
- `platform/src/audit_platform/connectors/dataforseo.py` — DFS connector with `get_referring_domains()`, `get_backlink_intersection()`
- `commands/seo-audit.md` — Agent 6 (backlink-researcher) needs updating

## Blockers / Notes
- The mockup uses simulated data — real implementation will need DFS API calls for competitor referring domains
- DFS Backlinks API requires $100/month commitment (noted in connector). Confirm account has it enabled before testing.
- User wants reports served from tastyppc.com (not file://), so fetch() for lazy-loaded JSON is fine
- User's pricing model: 200 RLinks/competitor cap as standard, deep dive at 2x API cost (1x API + 1x margin). Don't expose margin in reports.
- The existing `table-filters.js` already supports search/dropdowns/pagination — investigate reuse before building new filter UI
- User confirmed: no drill-down to individual backlinks in this version. That's a future follow-up service.
- Calgary Castles competitors: justinhavre.com, calgaryhomes.ca, calgaryhousefinder.ca, kirbycox.com, reevesrealty.ca, bestcalgaryhomes.com, thinkcalgaryhomes.com
