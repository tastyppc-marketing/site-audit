# Calgary Castles SEO Report — Mobile Optimization Log

**Date:** 2026-04-03
**Scope:** All 8 HTML pages in `/clients/calgary-castles/seo/reports/multipage/`
**Constraint:** No visual changes to desktop design. CSS-only mobile optimization + safe JS tweaks.

---

## Audit Summary

- **Framework:** Tailwind CSS (CDN) + custom report-styles.css
- **Data flow:** `window.AUDIT_DATA` → `data-loader.js` → `window.TPPC` → per-page `.init(data)`
- **Audited by:** 3 parallel agents (performance, responsiveness, frontend-design)
- **Total issues found:** 28 (4 critical, 9 high, 8 medium, 7 low/nice-to-have)

---

## All Proposed Fixes

### Critical

| # | Issue | Files | Proposed Fix | Status |
|---|-------|-------|-------------|--------|
| 1 | scroll-margin-top missing on all 40+ section anchors — nav links scroll behind 64px fixed header | report-styles.css | Add `[id^="section-"] { scroll-margin-top: 5rem; }` | APPLIED |
| 2 | Google Fonts loaded via @import inside CSS — cascading waterfall delays LCP 200-600ms | All 8 HTML `<head>`, report-styles.css | Remove @import, add `<link>` with preconnect for fonts.googleapis.com and fonts.gstatic.com | APPLIED |
| 3 | Tailwind CDN loaded synchronously (300KB parser-blocking) — blocks FCP 500-1500ms | All 8 HTML `<head>` | Add `<link rel="preconnect" href="https://cdn.tailwindcss.com">` (can't defer Tailwind CDN) | APPLIED |
| 4 | Chart.js loaded synchronously in `<head>` (200KB) — blocks TBT 200-800ms | All 8 HTML `<head>` | Add `defer` attribute to Chart.js script tag | APPLIED |

### High

| # | Issue | Files | Proposed Fix | Status |
|---|-------|-------|-------------|--------|
| 5 | No preconnect hints for 4 CDN origins — +400-1200ms cold-start | All 8 HTML `<head>` | Add preconnect for cdn.tailwindcss.com, cdn.jsdelivr.net, fonts.googleapis.com, fonts.gstatic.com | APPLIED |
| 6 | 9 local scripts lack `defer` — sequential loading blocks interactivity | All 8 HTML (script tags at end of body) | Add `defer` to all `<script src="shared/*.js">` and `<script src="pages/*.js">` tags | APPLIED |
| 7 | local.js stat grids jump 1-col to 4-col — no 2-col intermediate | pages/local.js (3 grids) | Add `grid-cols-2` base class before `md:grid-cols-3` and `md:grid-cols-4` | APPLIED |
| 8 | Tab buttons only ~34px tall — below 44px touch target | report-styles.css | Add `min-height: 44px` and increased padding at 768px breakpoint | APPLIED |
| 9 | Hamburger button 36px — below 44px minimum | multipage-nav.css | Increase from 2.25rem to 2.75rem on mobile | APPLIED |
| 10 | Mobile drawer links ~38px — below 48px target | multipage-nav.css | Add `min-height: 48px`, increase padding to 0.75rem | APPLIED |
| 11 | Filter search input min-width: 200px overflows on 320px | shared/table-filters.js | Change to `min-width: min(200px, 100%)` | APPLIED |
| 12 | Chart canvas max-height: 350px silently clips dynamic charts | report-styles.css + pages/*.js | Have JS add `chart-tall` class to dynamically-sized chart containers | APPLIED |
| 13 | 5 of 8 pages missing `<h1>` tag | keywords, content, links, competitors, action-plan HTML | Add H1 (sr-only) inside `<main>` | APPLIED |

### Medium

| # | Issue | Files | Proposed Fix | Status |
|---|-------|-------|-------------|--------|
| 14 | Missing prefers-reduced-motion — animations play for motion-sensitive users | report-styles.css | Add `@media (prefers-reduced-motion: reduce)` with animation/transition reset | APPLIED |
| 15 | Local map fixed 480px height — taller than most phone viewports | report-styles.css | Add responsive overrides: 320px at 768px, 260px at 480px | APPLIED |
| 16 | Table font stays 0.8rem at 480px — too large for phones | report-styles.css | Add 480px breakpoint with 0.75rem font and 0.4rem padding | APPLIED |
| 17 | keywords.js grid-cols-2 forced on all viewports — cramped at 320px | pages/keywords.js | Change to `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` | PENDING |
| 18 | Chart lazy-init missing — all charts eagerly created at page load | shared/charts.js, pages/*.js | Wrap chart creation in IntersectionObserver callback | DEFERRED — follow-up pass with caching strategy |
| 19 | Chart.js DPR not capped — 3x displays render 9x pixels | shared/charts.js | Add `devicePixelRatio: Math.min(dpr, 2)` to chart default options | APPLIED |
| 20 | Missing canonical `<link>` on all 8 pages | All 8 HTML `<head>` | Add `<link rel="canonical">` with page URL | DEFERRED — reports are private |
| 21 | Missing Open Graph tags on all 8 pages | All 8 HTML `<head>` | Add og:title, og:description, og:type | DEFERRED — reports are private |

### Low / Nice-to-Have

| # | Issue | Files | Proposed Fix | Status |
|---|-------|-------|-------------|--------|
| 22 | No table scroll indicator — users may not realize tables scroll | report-styles.css | Add CSS gradient shadow hint on report-table-wrap | APPLIED |
| 23 | Sticky first column hurts more than helps below 640px | report-styles.css | Disable sticky with `position: static` below 640px | APPLIED |
| 24 | local.html hero padding px-8 tight on 320px | local.html | Change to `px-6 md:px-8` | APPLIED |
| 25 | CSS transitions on layout properties (width, max-height) | report-styles.css | Replace with transform-based animations | DEFERRED |
| 26 | Nav heading font at 11px (0.6875rem) | multipage-nav.css | Bump to 0.75rem on mobile | DEFERRED |
| 27 | Severity badge font at 11px (0.7rem) | report-styles.css | Bump to 0.75rem on mobile | DEFERRED |
| 28 | AUDIT_DATA inlined in every page (~194KB x 8) | Generate script + all HTML | Extract to shared external JS file for caching | DEFERRED — pipeline change |

---

## Conflict Resolution

| Perf Fix | Responsive/Design Risk | Resolution |
|----------|----------------------|------------|
| Defer Chart.js (#4) | Charts init from DOMContentLoaded — must verify | **Safe** — `defer` executes in order before DOMContentLoaded fires |
| Chart lazy-init (#18) | Could delay visible charts | **Safe with guard** — only lazy-init below-fold charts |
| Remove CSS max-height (#12) | Could make charts oversized | **Scoped** — JS adds `chart-tall` class, don't remove global rule |
| Precompile Tailwind | Build pipeline change | **Deferred** — too large for this pass |
| Extract AUDIT_DATA (#28) | Changes generate script | **Deferred** — flagged for future |

---

## User Decisions (2026-04-03)

1. **#13 — H1 tags:** YES — add H1 to the 5 pages missing them
2. **#20-21 — Canonical/OG tags:** DEFERRED — reports are private, not meant to be indexed. Base URL for future: `https://tastyppc.com/audits/Calgary-Castles`
3. **#18 — Chart lazy-init:** DEFERRED — good idea, implement in dedicated follow-up pass alongside page caching strategy (Service Worker or cache headers)

---

## Files Modified

| File | Changes | By |
|------|---------|-----|
| `shared/report-styles.css` | Tab touch targets, map height, table 480px, sticky column disable, **scroll-margin-top, table scroll hint, prefers-reduced-motion, removed @import** | design-reviewer + team-lead |
| `shared/multipage-nav.css` | Hamburger size, drawer link height | design-reviewer |
| `shared/table-filters.js` | Filter search min-width: min(200px, 100%) | team-lead |
| `shared/charts.js` | DPR cap: devicePixelRatio: Math.min(dpr, 2) | team-lead |
| `pages/local.js` | 3 stat grid intermediate breakpoints (grid-cols-2) | design-reviewer |
| `pages/keywords.js` | chart-tall class on dynamic volume chart | team-lead |
| `pages/competitors.js` | chart-tall class on dynamic gap chart | team-lead |
| `All 8 HTML pages` | Preconnect hints (4-5 origins), Google Fonts via `<link>`, Chart.js `defer`, all local scripts `defer`, removed @import from inlined CSS | team-lead |
| `keywords.html` | Added H1 (sr-only) | team-lead |
| `content.html` | Added H1 (sr-only) | team-lead |
| `links.html` | Added H1 (sr-only) | team-lead |
| `competitors.html` | Added H1 (sr-only) | team-lead |
| `action-plan.html` | Added H1 (sr-only) | team-lead |
| `local.html` | Hero padding px-6 md:px-8, Leaflet script `defer`, unpkg.com preconnect | design-reviewer + team-lead |

**Note:** CSS source file changes require report regeneration to appear in the HTML pages (CSS is inlined at build time). JS file changes take effect immediately. The HTML `<head>` and script changes are applied directly to the output HTML files.
