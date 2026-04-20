# Deep Dive #26 — `template/reports/multipage/pages/links.js`

**File:** [`template/reports/multipage/pages/links.js`](/root/site-audit/template/reports/multipage/pages/links.js) (638 lines)
**Layer:** 07 — page renderer (Links page — internal linking + backlink inventory)
**Cross-reference:** [`codex findings/06-page-renderers/39-links_page.md`](/root/site-audit/codex findings/06-page-renderers/39-links_page.md)
**Template-vs-client drift:** laura-willis 638 lines (identical).
**Date:** 2026-04-20

---

## 1. Purpose

Renders the Links page. Main sections:
1. **Link Overview** (line 23) — totals: pages, internal links, orphans, average outbound/inbound, depth stats, hub count.
2. **Orphan Pages** (line 82) — list of pages with no contextual inbound links.
3. **Hub & Spoke Clusters** (line 135) — top hubs + their spoke pages.
4. **Link Depth Distribution** (line 227) — BFS-from-homepage depth histogram.
5. **Backlink Inventory** (likely renderBacklinks at ~line 326+) — grouped-by-domain backlinks with pagination.

## 2. Inputs

Reads:
- `data.internalLinking.*` (from Python `InternalLinkAnalyzer` + normalizer) — **this is the high-impact path of build_audit.py:216 bug** (INDEX addendum). If the analyzer processed zero edges (as Matt's did), all 4 internal sections display empty or broken.
- `data.topBacklinks[]` — populated by normalizer from `client-backlinks.json` (HANDOFF auto-fix #8).
- `data.topReferringDomains[]` — ditto.
- Backlink quality enrichments (`domainQuality`, `qualityScore`) — only if `analyze-backlink-quality.js` ran (orphan script, finding #14).

## 3. Key sections

**`renderLinkOverview` (line 23).** Reads `internalLinking.summary` (totalPages, totalInternalLinks, orphanCount, avgInboundLinks, avgOutboundLinks, maxDepth, avgDepth, hubCount, etc.). **For Matt this entire panel shows zeros** because `build_audit.py:216` passes the raw link-graph dict as `edges`, so analyzer processed zero edges.

**`renderOrphanPages` (line 82).** Lists pages flagged as orphans. **Matt's list contains all 11 analyzed pages** because every page has `inboundCount: 0` (same root bug). The recommendation text "Add contextual links from 2-3 hub pages" is displayed for every page — useless.

**`renderHubSpokeClusters` (line 135).** Top hubs + their spokes. **For Matt this is empty** — no hubs detected.

**`renderLinkDepth` (line 227).** Depth histogram. **For Matt this shows only depth 0 (homepage)** — BFS couldn't walk further due to empty edge processing.

**Backlink rendering (~line 326+).** Reads `data.topBacklinks` + `topReferringDomains`. Per HANDOFF auto-fix #8, normalizer populates ALL backlinks (not capped at 10). Matt has 66 backlinks from 42 referring domains — legitimate data. **But note finding #9 bug #2:** the `totalBacklinks` number for each competitor reflects the 200-limit cap, not true total.

## 4. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **CRITICAL (downstream)** | — | **All 4 internal-linking sections render garbage for Matt (and anyone affected by build_audit.py:216 bug).** Link Overview shows zeros, Orphans shows every page as orphan, Hubs empty, Depth shows only homepage. **This is the most visually obvious downstream impact of the edges-key bug.** |
| 2 | **H** | — | **Total backlink counts are misleading** per finding #9 #2. Competitors showing "200 backlinks" means "we fetched 200 within our cap" — not "they have 200." The page has no indicator distinguishing. |
| 3 | **M** | — | **No backlink quality coloring** unless analyze-backlink-quality.js ran (finding #14 — orphan). Only Liane's report shows quality signals; other clients see a flat list with no spam/legit differentiation. |
| 4 | **M** | 82-134 | **Orphan recommendation text is generic** — "Add contextual links from 2-3 hub pages" for every orphan. For a real orphan (pages linked only from nav), that's useful. For Matt's false-positive orphans, it's misleading advice. |
| 5 | **M** | — | **No internal-link distribution heatmap or graph viz** — depth histogram is linear counts only. Could show which pages link to which with a force-directed graph if the underlying data existed. |
| 6 | **L** | — | **Backlink table uses pagination** (HANDOFF auto-fix #8: "25/page with grouped by referring domain"). Confirmed scalable. |

## 5. Integration map

**Data chain:**
- `crawl-sitemap.js` → `link-graph.json` → normalizer sections 1161-1350 + `build_audit.py` InternalLinkAnalyzer → `data.internalLinking.*`.
- `gather-backlinks.js` → `client-backlinks.json` + `backlinks-*.json` → normalizer sections 1571-1720 → `data.topBacklinks` + `data.topReferringDomains`.
- `analyze-backlink-quality.js` (ORPHAN) → same files enriched in-place with `qualitySummary`.

## 6. Fix / improve suggestions

1. **Bug #1 is the top priority** — fix build_audit.py:216 to pass `link_graph.get('edges', {})`. Immediately unblocks all 4 internal-linking sections. Already documented in INDEX addendum; worth re-emphasizing.
2. **Add "fetched vs total" indicators** (bug #2).
3. **Wire analyze-backlink-quality.js into the skill** (finding #14 #1) so quality signals appear on every client's Links page.
4. **Render empty-state with actionable next steps** when internalLinking.totalPages === 0 — "Run `build_audit.py` to populate" — not just a blank panel.

## 7. What to verify before we touch this file

- **Open Matt's Links page** — confirm Link Overview shows zeros and orphans list has 11 entries. This is the fastest visual proof of bug #1.
- **Open Liane's Links page** — she has analyze-backlink-quality output; backlinks should show quality coloring. Compare to Matt's (no coloring).
- **Test depth rendering** on a client with REAL link graph (e.g., calgary-castles after data fix) to see intended behavior.
