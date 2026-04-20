# Deep Dive #52 — `platform/src/audit_platform/analyzers/internal_linking.py`

**File:** [`internal_linking.py`](/root/site-audit/platform/src/audit_platform/analyzers/internal_linking.py) (609 lines)
**Layer:** 10 — Python analyzer (link graph + PageRank + orphans + hubs + depth)
**Date:** 2026-04-20

---

## 1. Purpose

**Already partially surveyed in the Matt Wallmow investigation (findings #21 §5, INDEX addendum).** The InternalLinkAnalyzer builds a directed graph from `link-graph.json.edges`, computes:
- **PageRank** (line 49 uses NetworkX when available).
- **Orphan pages** (line 171) — no contextual inbound links.
- **Link depth** via BFS from homepage (line 205).
- **Hub-and-spoke clusters** — by in/out degree.
- Community detection (Louvain) + HITS hub/authority + betweenness centrality (NetworkX extended metrics, lines 93-102).

Outputs `audit-data.json.internalLinking.{total_pages, total_internal_links, orphans, orphan_count, hub_clusters, depth_result, nodes, link_suggestions, ...}`.

## 2. Key architecture

**`analyze(edges, sitemap_urls, homepage)` (line 54).** The public entry point. Matches `build_audit.py:216` call site.

**`build_graph(edges)` (line 141).** Constructs outbound + inbound adjacency dicts. **Iterates `edges.items()`** — THE LOCATION OF THE UPSTREAM BUG documented in INDEX addendum.

**`_normalize_url` (line 500).** Strips trailing slash, lowercases scheme+netloc. Consistent across all function inputs.

**`compute_link_depth` (line 205).** BFS from homepage; produces `LinkDepthResult` with depths map + unreachable list + max_depth + avg_depth.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **CRITICAL (upstream)** | — | **The analyzer itself is CORRECT.** The data corruption is in `build_audit.py:216` which passes the raw link-graph.json dict (including `domain`, `crawlDate`, `notes` keys) instead of `link_graph.get("edges", {})`. Analyzer then iterates those top-level keys as if they're edges — skips them all because they're strings/dicts not lists. Result: 0 edges processed for Matt. **Fix belongs in build_audit.py, not here.** |
| 2 | **H** | 171-203 | **`find_orphans`** iterates `sitemap_urls` — which for Matt is `[p.url for p in crawl_data.pages]` (11 pages after agent-overwrite). If sitemap_urls were the full 40 content URLs, even with zero-edge graph, orphan count would be 40 (all orphans). Currently shows 11 because the sitemap_urls list is also capped. |
| 3 | **M** | 205-260 | **`compute_link_depth`** depends on both edges AND homepage-normalization. If homepage URL in input doesn't match any edge source (casing, slashes), BFS has only depth 0. |
| 4 | **M** | 93-102 | **Optional NetworkX integration** — line 93 comment "when NetworkX is available". If NetworkX is a hard dep, okay; if soft, missing library silently drops HITS / betweenness / community detection. |
| 5 | **L** | 500 | **`_normalize_url`** — well-defined. Consumers can trust it. |

## 4. Integration map

**Called by:** `build_audit.py::_run_internal_linking` (deep-dive #63, line 206-221).
**Input:** `link-graph.json` + `crawl-data.json.pages`.
**Output:** `audit-data.json.internalLinking`.
**Consumed by:** `pages/links.js` (#26), `pages/technical.js` (#25 siteStructure).

## 5. Fix / improve suggestions

1. **build_audit.py:216 must pass `link_graph.get("edges", {})`.** Already flagged in INDEX addendum. This analyzer is healthy — the bug is upstream.
2. **Pass full sitemap URLs** (from the original sitemap, not the analyzed subset) to `find_orphans` so orphan count reflects reality.
3. **Guard homepage URL normalization** — warn if `homepage` doesn't appear in any edge after normalization.
