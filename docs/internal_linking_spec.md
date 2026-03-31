# Internal Link Graph Analyzer — Implementation Spec

> **Status:** Final — ready for implementation
> **Target files:**
> 1. `platform/src/audit_platform/models/linking.py` (new)
> 2. `platform/src/audit_platform/analyzers/internal_linking.py` (new)
> 3. `template/scripts/crawl-sitemap.js` (modify)
> 4. `platform/src/audit_platform/analyzers/__init__.py` (modify)
> 5. `platform/src/audit_platform/models/__init__.py` (modify)

---

## 1. File: `platform/src/audit_platform/models/linking.py`

### 1.1 Module Header

```python
"""Internal linking models.

Data structures for link-graph analysis results including orphan detection,
hub-and-spoke clustering, link depth mapping, and PageRank distribution.
Used by the internal link analyzer to assess site architecture quality.
"""
```

### 1.2 Imports

```python
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field
```

### 1.3 Models

Five models in this order:

#### `LinkGraphNode`

```python
class LinkGraphNode(BaseModel):
    """A single page in the internal link graph with computed metrics."""

    url: str = ""
    inbound_count: int = 0
    outbound_count: int = 0
    link_depth: int = -1  # -1 = unreachable from homepage
    pagerank: float = 0.0
    is_orphan: bool = False
    is_hub: bool = False
    hub_cluster: Optional[str] = None  # cluster_id if part of a hub/spoke cluster
    recommendations: list[str] = Field(default_factory=list)
```

#### `OrphanPage`

```python
class OrphanPage(BaseModel):
    """A page in the sitemap with zero contextual inbound links."""

    url: str = ""
    outbound_links: int = 0
    is_in_sitemap: bool = True
    recommendation: str = ""
```

#### `HubSpokeCluster`

```python
class HubSpokeCluster(BaseModel):
    """A hub page and its associated spoke pages."""

    cluster_id: str = ""
    hub_url: str = ""
    hub_inbound: int = 0
    hub_outbound: int = 0
    spokes: list[str] = Field(default_factory=list)
    spoke_count: int = 0
```

#### `LinkDepthResult`

```python
class LinkDepthResult(BaseModel):
    """BFS depth results from the homepage."""

    homepage: str = ""  # must have default so LinkGraphResult can use Field(default_factory=LinkDepthResult)
    depths: dict[str, int] = Field(default_factory=dict)  # url → click depth from homepage
    unreachable: list[str] = Field(default_factory=list)  # urls not reachable via BFS from homepage
    max_depth: int = 0
    avg_depth: float = 0.0
```

#### `LinkGraphResult`

```python
class LinkGraphResult(BaseModel):
    """Complete internal link graph analysis for a domain."""

    # Identification
    domain: str = ""
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)

    # Summary stats
    total_pages: int = 0
    total_internal_links: int = 0
    orphan_count: int = 0
    orphan_rate: float = 0.0  # orphan_count / total_pages
    avg_inbound_links: float = 0.0
    avg_outbound_links: float = 0.0
    unreachable_count: int = 0

    # Detailed results
    nodes: list[LinkGraphNode] = Field(default_factory=list)
    orphans: list[OrphanPage] = Field(default_factory=list)
    hub_clusters: list[HubSpokeCluster] = Field(default_factory=list)
    depth_result: LinkDepthResult = Field(default_factory=LinkDepthResult)

    # Issues and recommendations (site-level)
    issues: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
```

---

## 2. File: `platform/src/audit_platform/analyzers/internal_linking.py`

### 2.1 Module Header

```python
"""Internal link graph analyzer.

Standalone analysis class for building a directed link graph from crawl data,
computing PageRank, detecting orphan pages, identifying hub-and-spoke clusters,
and measuring link depth from the homepage. No HTTP calls — operates entirely
on pre-crawled edge data.
"""
```

### 2.2 Imports

```python
from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse, urlunparse

import structlog

from audit_platform.models.linking import (
    HubSpokeCluster,
    LinkDepthResult,
    LinkGraphNode,
    LinkGraphResult,
    OrphanPage,
)
```

### 2.3 Class Constants

```python
class InternalLinkAnalyzer:
    """Standalone internal link graph analysis. No HTTP calls."""

    PAGERANK_DAMPING: float = 0.85
    PAGERANK_ITERATIONS: int = 50
    PAGERANK_CONVERGENCE: float = 1e-6
    HUB_OUTBOUND_PERCENTILE: float = 0.75
    HUB_MIN_INBOUND: int = 3
    DEEP_LINK_THRESHOLD: int = 4
```

| Name | Type | Value | Purpose |
|------|------|-------|---------|
| `PAGERANK_DAMPING` | `float` | `0.85` | Standard PageRank damping factor (probability of following a link vs teleporting) |
| `PAGERANK_ITERATIONS` | `int` | `50` | Maximum number of PageRank power-iteration rounds |
| `PAGERANK_CONVERGENCE` | `float` | `1e-6` | Early-stop threshold: if total rank change across all nodes drops below this, stop iterating |
| `HUB_OUTBOUND_PERCENTILE` | `float` | `0.75` | A page must be at or above this percentile of outbound link count to be a hub candidate |
| `HUB_MIN_INBOUND` | `int` | `3` | A hub candidate must also have at least this many inbound links (prevents orphan-like pages from being hubs) |
| `DEEP_LINK_THRESHOLD` | `int` | `4` | Pages at or above this click-depth from the homepage are flagged as "deep" |

### 2.4 `__init__`

```python
def __init__(self) -> None:
    self.log = structlog.get_logger(self.__class__.__name__)
```

### 2.5 Public Method: `analyze`

**Signature:**

```python
def analyze(
    self,
    edges: dict[str, list[str]],
    sitemap_urls: list[str],
    homepage: str,
) -> LinkGraphResult:
```

**Parameters:**
- `edges` — `dict[str, list[str]]` — raw edge data from `link-graph.json`. Keys are source URLs, values are lists of target URLs (contextual links only). Comes directly from `graph_data['edges']`.
- `sitemap_urls` — `list[str]` — all known page URLs from the sitemap/crawl. Used for orphan detection.
- `homepage` — `str` — the root URL of the site (e.g., `"https://example.com"`). Used as the BFS origin for depth calculation.

**Return:** `LinkGraphResult` with all fields populated.

**Algorithm (numbered steps):**

1. Log start: `self.log.info("internal_link_analysis_start", edge_count=len(edges), sitemap_url_count=len(sitemap_urls))`
2. Normalize homepage: `homepage = self._normalize_url(homepage)`
3. Extract domain from homepage: `parsed = urlparse(homepage)` then `domain = f"{parsed.scheme}://{parsed.netloc}"`
4. Build adjacency lists: `outbound_adj, inbound_adj = self.build_graph(edges)`
5. Find orphans: `orphans = self.find_orphans(inbound_adj, sitemap_urls, homepage)`
6. Compute link depth: `depth_result = self.compute_link_depth(outbound_adj, homepage)`
7. Find hub/spoke clusters: `hub_clusters = self.find_hubs_and_spokes(outbound_adj, inbound_adj)`
8. Compute PageRank: `pageranks = self.compute_pagerank(outbound_adj, inbound_adj)`
9. Get all URLs in graph: `all_urls = self._get_all_urls(outbound_adj, inbound_adj)`
10. Compute orphan URL set: `orphan_urls = {o.url for o in orphans}`
11. Build node list: `nodes = self._build_node_list(all_urls, outbound_adj, inbound_adj, depth_result.depths, pageranks, orphan_urls, hub_clusters)`
12. Compute `total_pages = len(all_urls)`
13. Compute `total_edges = sum(len(v) for v in outbound_adj.values())`
14. Compute `orphan_count = len(orphans)`
15. Compute `orphan_rate = orphan_count / total_pages if total_pages > 0 else 0.0`
16. Compute `avg_inbound = sum(len(v) for v in inbound_adj.values()) / total_pages if total_pages > 0 else 0.0`
17. Compute `avg_outbound = sum(len(v) for v in outbound_adj.values()) / total_pages if total_pages > 0 else 0.0`
18. Compute `unreachable_count = len(depth_result.unreachable)`
19. Construct result:
    ```python
    result = LinkGraphResult(
        domain=domain,
        total_pages=total_pages,
        total_internal_links=total_edges,
        orphan_count=orphan_count,
        orphan_rate=orphan_rate,
        avg_inbound_links=avg_inbound,
        avg_outbound_links=avg_outbound,
        unreachable_count=unreachable_count,
        nodes=nodes,
        orphans=orphans,
        hub_clusters=hub_clusters,
        depth_result=depth_result,
    )
    ```
20. Generate recommendations: `self._generate_recommendations(result)` (modifies `result` in place)
21. Log completion: `self.log.info("internal_link_analysis_complete", total_pages=total_pages, orphan_count=orphan_count, hub_count=len(hub_clusters))`
22. Return `result`

**Edge cases:**
- `edges` is empty dict → `outbound_adj` and `inbound_adj` are empty dicts → all downstream methods receive empty inputs → result has `total_pages=0`, no orphans, no depth, no hubs.
- `homepage` not found in graph → `depth_result.depths` will be `{homepage: 0}` if homepage has outbound links, otherwise just `{homepage: 0}` with all other pages unreachable.
- `sitemap_urls` contains URLs not in the graph → they become orphans with `outbound_links=0`.

### 2.6 Public Method: `build_graph`

**Signature:**

```python
def build_graph(
    self,
    edges: dict[str, list[str]],
) -> tuple[dict[str, set[str]], dict[str, set[str]]]:
```

**Parameters:**
- `edges` — raw edge data. Keys are source URLs (strings), values are lists of target URLs.

**Return:** `(outbound, inbound)` — two plain dicts mapping URL → set of URLs.

**Algorithm:**

1. Initialize `outbound: dict[str, set[str]] = defaultdict(set)`
2. Initialize `inbound: dict[str, set[str]] = defaultdict(set)`
3. For each `(source_url, target_urls)` in `edges.items()`:
   a. Guard: `if not isinstance(target_urls, list): continue`
   b. `norm_source = self._normalize_url(source_url)`
   c. Ensure source exists in outbound: `outbound[norm_source]` (access to initialize defaultdict key)
   d. For each `target_url` in `target_urls`:
      - `norm_target = self._normalize_url(target_url)`
      - If `norm_target == norm_source`: skip (self-link)
      - Else: `outbound[norm_source].add(norm_target)` and `inbound[norm_target].add(norm_source)`
4. Log: `self.log.debug("build_graph_complete", node_count=len(outbound), edge_count=sum(len(v) for v in outbound.values()))`
5. Return `(dict(outbound), dict(inbound))`

**Edge cases:**
- `target_urls` is `None` or not a list → skipped via the guard.
- Empty `target_urls` list → source URL still appears in `outbound` with empty set (because of step 3c).
- All targets are self-links → source appears in `outbound` with empty set.

### 2.7 Public Method: `find_orphans`

**Signature:**

```python
def find_orphans(
    self,
    inbound_graph: dict[str, set[str]],
    sitemap_urls: list[str],
    homepage: str,
) -> list[OrphanPage]:
```

**Parameters:**
- `inbound_graph` — the inbound adjacency dict from `build_graph`.
- `sitemap_urls` — all known page URLs.
- `homepage` — the homepage URL (already normalized by caller).

**Return:** List of `OrphanPage` objects for sitemap URLs with zero inbound contextual links.

**Algorithm:**

1. Normalize all sitemap URLs: `norm_sitemap = [self._normalize_url(u) for u in sitemap_urls]`
2. `orphans: list[OrphanPage] = []`
3. For each `url` in `norm_sitemap`:
   a. If `url == homepage`: skip (homepage is never an orphan)
   b. `inbound = inbound_graph.get(url, set())`
   c. If `len(inbound) == 0`:
      ```python
      orphans.append(OrphanPage(
          url=url,
          outbound_links=0,
          is_in_sitemap=True,
          recommendation="No contextual links point to this page. Add it to at least 2-3 hub or category pages.",
      ))
      ```
4. Log: `self.log.debug("find_orphans_complete", orphan_count=len(orphans), sitemap_count=len(norm_sitemap))`
5. Return `orphans`

**Note:** `outbound_links` is set to `0` here because `outbound_graph` is not available in this method. The correct outbound count is reflected in the corresponding `LinkGraphNode` built by `_build_node_list`.

**Edge cases:**
- `sitemap_urls` is empty → returns empty list.
- URL in sitemap but not in graph at all → `inbound_graph.get(url, set())` returns empty set → it IS an orphan.
- `homepage` not in `sitemap_urls` → homepage check still works; it's a string comparison.

### 2.8 Public Method: `compute_link_depth`

**Signature:**

```python
def compute_link_depth(
    self,
    outbound_graph: dict[str, set[str]],
    homepage: str,
) -> LinkDepthResult:
```

**Parameters:**
- `outbound_graph` — the outbound adjacency dict from `build_graph`.
- `homepage` — the homepage URL (already normalized by caller, but normalize again for safety).

**Return:** `LinkDepthResult` with BFS depths from homepage.

**Algorithm:**

1. `homepage = self._normalize_url(homepage)`
2. `depths: dict[str, int] = {homepage: 0}`
3. `queue: deque = deque([(homepage, 0)])`
4. While `queue` is not empty:
   a. `current, depth = queue.popleft()`
   b. For each `neighbor` in `outbound_graph.get(current, set())`:
      - If `neighbor` not in `depths`:
        - `depths[neighbor] = depth + 1`
        - `queue.append((neighbor, depth + 1))`
5. Compute `all_graph_urls = set(outbound_graph.keys())`
6. `unreachable = [u for u in all_graph_urls if u not in depths]`
7. `max_depth = max(depths.values()) if len(depths) > 1 else 0` (use `> 1` to exclude the case where only homepage is in depths)
8. `avg_depth = sum(depths.values()) / len(depths) if depths else 0.0`
9. Log: `self.log.debug("compute_link_depth_complete", reachable=len(depths), unreachable=len(unreachable), max_depth=max_depth)`
10. Return `LinkDepthResult(homepage=homepage, depths=depths, unreachable=unreachable, max_depth=max_depth, avg_depth=avg_depth)`

**Edge cases:**
- `homepage` not in `outbound_graph` → BFS terminates immediately with just `{homepage: 0}`; all graph URLs are unreachable.
- Disconnected graph clusters → those clusters are all unreachable from homepage.
- `outbound_graph` is empty → `depths = {homepage: 0}`, `unreachable = []`, `max_depth = 0`.

### 2.9 Public Method: `find_hubs_and_spokes`

**Signature:**

```python
def find_hubs_and_spokes(
    self,
    outbound_graph: dict[str, set[str]],
    inbound_graph: dict[str, set[str]],
) -> list[HubSpokeCluster]:
```

**Parameters:**
- `outbound_graph` — the outbound adjacency dict.
- `inbound_graph` — the inbound adjacency dict.

**Return:** List of `HubSpokeCluster` objects.

**Algorithm:**

1. `all_urls = self._get_all_urls(outbound_graph, inbound_graph)`
2. If `len(all_urls) < 3`: return `[]` (too small for hub detection)
3. Compute outbound counts: `outbound_counts = {u: len(outbound_graph.get(u, set())) for u in all_urls}`
4. Compute `outbound_values = list(outbound_counts.values())`
5. `threshold_outbound = max(self._percentile(outbound_values, self.HUB_OUTBOUND_PERCENTILE), 3.0)` — minimum 3 outbound links to be a hub candidate
6. Identify candidate hubs:
   ```python
   candidates = [
       u for u in all_urls
       if outbound_counts[u] >= threshold_outbound
       and len(inbound_graph.get(u, set())) >= self.HUB_MIN_INBOUND
   ]
   ```
7. Sort candidates by outbound count descending: `candidates.sort(key=lambda u: outbound_counts[u], reverse=True)`
8. `clusters: list[HubSpokeCluster] = []`
9. For each `i, hub_url` in `enumerate(candidates)`:
   a. `hub_outbound = outbound_graph.get(hub_url, set())`
   b. `hub_inbound = inbound_graph.get(hub_url, set())`
   c. `spokes: list[str] = []`
   d. For each `spoke_url` in `hub_outbound`:
      - `spoke_inbound = inbound_graph.get(spoke_url, set())`
      - Bidirectional check: `is_bidirectional = hub_url in outbound_graph.get(spoke_url, set())`
      - Primary referrer check: `spoke_inbound_count = len(spoke_inbound)` then `is_primary = spoke_inbound_count > 0 and hub_url in spoke_inbound and (1.0 / spoke_inbound_count) >= 0.5`
      - If `is_bidirectional or is_primary`: `spokes.append(spoke_url)`
   e. Create cluster:
      ```python
      clusters.append(HubSpokeCluster(
          cluster_id=f"hub_{i}",
          hub_url=hub_url,
          hub_inbound=len(hub_inbound),
          hub_outbound=outbound_counts[hub_url],
          spokes=spokes,
          spoke_count=len(spokes),
      ))
      ```
10. Log: `self.log.debug("find_hubs_and_spokes_complete", hub_count=len(clusters))`
11. Return `clusters`

**Edge cases:**
- No candidates meet threshold → return empty list.
- Hub has no qualifying spokes → include hub cluster with `spokes=[]`, `spoke_count=0`.

### 2.10 Public Method: `compute_pagerank`

**Signature:**

```python
def compute_pagerank(
    self,
    outbound_graph: dict[str, set[str]],
    inbound_graph: dict[str, set[str]],
    damping: float = 0.85,
    iterations: int = 50,
) -> dict[str, float]:
```

**Important:** The default values in the signature must be literal values (`0.85` and `50`), NOT references to class constants. Python evaluates default argument values at class definition time when class constants are not yet accessible via `self`.

**Parameters:**
- `outbound_graph` — the outbound adjacency dict.
- `inbound_graph` — the inbound adjacency dict.
- `damping` — damping factor (default `0.85`).
- `iterations` — maximum iterations (default `50`).

**Return:** `dict[str, float]` mapping URL → normalized PageRank score (all values sum to 1.0).

**Algorithm:**

1. `all_urls = list(self._get_all_urls(outbound_graph, inbound_graph))`
2. `N = len(all_urls)`
3. If `N == 0`: return `{}`
4. `rank: dict[str, float] = {u: 1.0 / N for u in all_urls}`
5. Identify dangling nodes: `dangling_nodes = {u for u in all_urls if not outbound_graph.get(u)}`
6. For `_iter` in `range(iterations)`:
   a. `dangling_sum = sum(rank[n] for n in dangling_nodes)`
   b. `new_rank: dict[str, float] = {}`
   c. For each `url` in `all_urls`:
      - `inbound = inbound_graph.get(url, set())`
      - `rank_sum = sum(rank[src] / len(outbound_graph[src]) for src in inbound if outbound_graph.get(src))`
      - `new_rank[url] = (1 - damping) / N + damping * (dangling_sum / N + rank_sum)`
   d. Compute convergence delta: `delta = sum(abs(new_rank[u] - rank[u]) for u in all_urls)`
   e. `rank = new_rank`
   f. If `delta < self.PAGERANK_CONVERGENCE`: break
7. Normalize: `total = sum(rank.values())` then `rank = {u: v / total for u, v in rank.items()} if total > 0 else rank`
8. Log: `self.log.debug("compute_pagerank_complete", iterations_run=_iter + 1, node_count=N)`
9. Return `rank`

**Edge cases:**
- `N == 1` → single URL, returns `{url: 1.0}`.
- All nodes are dangling (no outbound links anywhere) → `dangling_sum = 1.0` at start; rank distributes evenly via teleportation.
- Division by zero guard: `if outbound_graph.get(src)` ensures we don't divide by zero for dangling sources in `rank_sum`.

### 2.11 Private Helper: `_normalize_url`

**Signature:**

```python
def _normalize_url(self, url: str) -> str:
```

**Algorithm:**

1. If `url` is empty string: return `""`
2. `parsed = urlparse(url)`
3. `normalized = parsed._replace(scheme=parsed.scheme.lower(), netloc=parsed.netloc.lower(), fragment="", path=parsed.path.rstrip("/") or "/")`
4. Return `urlunparse(normalized)`

**Examples:**
- `"https://Example.com/page/"` → `"https://example.com/page"`
- `"https://example.com/page#section"` → `"https://example.com/page"`
- `"https://example.com/"` → `"https://example.com/"` (root path preserved)
- `""` → `""`

### 2.12 Private Helper: `_percentile`

**Signature:**

```python
def _percentile(self, values: list[int], p: float) -> float:
```

**Algorithm:**

1. If `not values`: return `0.0`
2. `sorted_vals = sorted(values)`
3. `idx = int(p * len(sorted_vals))`
4. `idx = min(idx, len(sorted_vals) - 1)`
5. Return `float(sorted_vals[idx])`

### 2.13 Private Helper: `_get_all_urls`

**Signature:**

```python
def _get_all_urls(
    self,
    forward_adj: dict[str, set[str]],
    reverse_adj: dict[str, set[str]],
) -> set[str]:
```

**Algorithm:**

1. Return `set(forward_adj.keys()) | set(reverse_adj.keys())`

### 2.14 Private Helper: `_build_node_list`

**Signature:**

```python
def _build_node_list(
    self,
    all_urls: set[str],
    outbound_graph: dict[str, set[str]],
    inbound_graph: dict[str, set[str]],
    depths: dict[str, int],
    pageranks: dict[str, float],
    orphan_urls: set[str],
    hub_clusters: list[HubSpokeCluster],
) -> list[LinkGraphNode]:
```

**Algorithm:**

1. Build hub/spoke lookup:
   ```python
   url_to_cluster: dict[str, str] = {}
   url_is_hub: dict[str, bool] = {}
   for cluster in hub_clusters:
       url_to_cluster[cluster.hub_url] = cluster.cluster_id
       url_is_hub[cluster.hub_url] = True
       for spoke in cluster.spokes:
           if spoke not in url_to_cluster:  # don't overwrite if spoke is also a hub
               url_to_cluster[spoke] = cluster.cluster_id
               url_is_hub[spoke] = False
   ```
2. `nodes: list[LinkGraphNode] = []`
3. For each `url` in `sorted(all_urls)` (sort for deterministic output):
   ```python
   nodes.append(LinkGraphNode(
       url=url,
       inbound_count=len(inbound_graph.get(url, set())),
       outbound_count=len(outbound_graph.get(url, set())),
       link_depth=depths.get(url, -1),
       pagerank=pageranks.get(url, 0.0),
       is_orphan=url in orphan_urls,
       hub_cluster=url_to_cluster.get(url),
       is_hub=url_is_hub.get(url, False),
       recommendations=[],
   ))
   ```
4. Return `nodes`

### 2.15 Private Helper: `_generate_recommendations`

**Signature:**

```python
def _generate_recommendations(
    self,
    result: LinkGraphResult,
) -> None:
```

Modifies `result` in place. No return value.

**Algorithm — site-level issues** (append to `result.issues` and `result.recommendations`):

1. If `result.orphan_count > 0`:
   - `result.issues.append("HAS_ORPHANS")`
2. If `result.orphan_rate > 0.20`:
   - `result.issues.append("HIGH_ORPHAN_RATE")`
   - `result.recommendations.append("Over 20% of pages have no contextual inbound links. Audit your internal linking structure and add contextual links from hub pages to orphaned content.")`
3. If `result.unreachable_count > 0`:
   - `result.issues.append("UNREACHABLE_PAGES")`
   - `result.recommendations.append(f"{result.unreachable_count} pages are unreachable from the homepage via contextual links. Check for broken links or isolated page clusters.")`
4. If `result.avg_inbound_links < 2.0`:
   - `result.issues.append("WEAK_INTERNAL_LINKING")`
   - `result.recommendations.append(f"Average inbound contextual links per page is {result.avg_inbound_links:.1f} (below 2.0). Increase internal linking density across the site.")`
5. If `not result.hub_clusters`:
   - `result.issues.append("NO_HUB_STRUCTURE")`
6. Check for deep pages — do this BEFORE the per-node loop:
   - `has_deep = any(n.link_depth >= self.DEEP_LINK_THRESHOLD for n in result.nodes if n.link_depth >= 0)`
   - If `has_deep`:
     - `result.issues.append("DEEP_PAGES")`
     - `result.recommendations.append("Some pages are buried 4+ clicks from the homepage. Flatten the link hierarchy for key content pages.")`

**Algorithm — per-node recommendations** (append to `node.recommendations`):

Compute the low-pagerank threshold once before the loop:
```python
pagerank_values = [n.pagerank for n in result.nodes]
low_pr_threshold = self._percentile(pagerank_values, 0.25)
```

For each `node` in `result.nodes`:

1. If `node.is_orphan`:
   - `node.recommendations.append("No contextual links point to this page. Add it to at least 2-3 hub or category pages.")`
2. If `node.link_depth >= self.DEEP_LINK_THRESHOLD`:
   - `node.recommendations.append(f"This page is {node.link_depth} clicks from the homepage. Move key content higher in the site hierarchy.")`
3. If `node.pagerank < low_pr_threshold and node.pagerank > 0.0`:
   - `node.recommendations.append("Low internal PageRank. Consider adding contextual links from hub pages.")`

**Order of operations:** Site-level issues first (including the deep-pages check), then compute `low_pr_threshold`, then iterate nodes for per-node recommendations.

---

## 3. Modification: `template/scripts/crawl-sitemap.js`

### 3.1 Change Description

Add `link-graph.json` write after the `crawl-data.json` write, inside the `if (analyze)` block. This exports the raw edge data that the Python `InternalLinkAnalyzer` consumes.

### 3.2 Exact Diff

**Old** (lines 393–395 of current file):

```javascript
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\nCrawl data saved to: ${outputPath}`);
      }
```

**New** (replace those 3 lines with):

```javascript
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\nCrawl data saved to: ${outputPath}`);

        // Write link graph (edge data for Python InternalLinkAnalyzer)
        const linkGraph = {
          domain: baseUrl,
          crawlDate: new Date().toISOString(),
          edges: Object.fromEntries(
            analyzedPages
              .filter(pd => !pd.error && pd.contextualLinkTargets)
              .map(pd => [pd.url, pd.contextualLinkTargets])
          ),
        };
        const graphOutputPath = path.join(__dirname, '..', 'seo', 'research', 'link-graph.json');
        fs.writeFileSync(graphOutputPath, JSON.stringify(linkGraph, null, 2));
        console.log(`Link graph saved to: ${graphOutputPath}`);
      }
```

### 3.3 Why This Location Works

The `analyzedPages` array still has `contextualLinkTargets` at this point. The stripping of `contextualLinkTargets` happens inside `results.pages` via the `.map(pd => { const { contextualLinkTargets, ...rest } = pd; return rest; })` expression, which only strips it from the `results.pages` array used for `crawl-data.json`. The raw `analyzedPages` array is unaffected.

### 3.4 Output Format: `link-graph.json`

```json
{
  "domain": "https://example.com",
  "crawlDate": "2026-03-22T12:00:00.000Z",
  "edges": {
    "https://example.com/": ["https://example.com/about", "https://example.com/services"],
    "https://example.com/about": ["https://example.com/", "https://example.com/team"],
    "https://example.com/services": ["https://example.com/service-a"]
  }
}
```

---

## 4. Updates to `platform/src/audit_platform/analyzers/__init__.py`

**Complete new file content:**

```python
from audit_platform.analyzers.content_quality import ContentQualityAnalyzer
from audit_platform.analyzers.internal_linking import InternalLinkAnalyzer

__all__ = [
    "ContentQualityAnalyzer",
    "InternalLinkAnalyzer",
]
```

---

## 5. Updates to `platform/src/audit_platform/models/__init__.py`

**Complete new file content:**

```python
from audit_platform.models.content import (
    CannibalizationRecord,
    ContentQualityRecord,
    ContentStructure,
    DuplicateGroup,
    KeywordUsage,
    ReadabilityMetrics,
)
from audit_platform.models.linking import (
    HubSpokeCluster,
    LinkDepthResult,
    LinkGraphNode,
    LinkGraphResult,
    OrphanPage,
)
from audit_platform.models.local import BusinessProfileRecord, LocalPerformanceRecord
from audit_platform.models.performance import (
    CoreWebVitals,
    CrUXRecord,
    PageSpeedRecord,
)
from audit_platform.models.ppc import (
    AdGroupRecord,
    CampaignRecord,
    KeywordPPCRecord,
    SearchTermRecord,
)
from audit_platform.models.seo import (
    BacklinkRecord,
    DomainMetrics,
    KeywordRecord,
    OrganicKeywordRecord,
    PageAuditRecord,
)

__all__ = [
    "AdGroupRecord",
    "BacklinkRecord",
    "BusinessProfileRecord",
    "CampaignRecord",
    "CannibalizationRecord",
    "ContentQualityRecord",
    "ContentStructure",
    "CoreWebVitals",
    "CrUXRecord",
    "DomainMetrics",
    "DuplicateGroup",
    "HubSpokeCluster",
    "KeywordPPCRecord",
    "KeywordRecord",
    "KeywordUsage",
    "LinkDepthResult",
    "LinkGraphNode",
    "LinkGraphResult",
    "LocalPerformanceRecord",
    "OrphanPage",
    "OrganicKeywordRecord",
    "PageAuditRecord",
    "PageSpeedRecord",
    "ReadabilityMetrics",
    "SearchTermRecord",
]
```

---

## 6. Integration Usage Example

```python
import json
from audit_platform.analyzers.internal_linking import InternalLinkAnalyzer

# Load data
with open("seo/research/crawl-data.json") as f:
    crawl = json.load(f)
with open("seo/research/link-graph.json") as f:
    graph_data = json.load(f)

sitemap_urls = [p["url"] for p in crawl["pages"] if not p.get("error")]
homepage = crawl["domain"]  # e.g., "https://mammothlakesproperties.com"
edges = graph_data["edges"]

analyzer = InternalLinkAnalyzer()
result = analyzer.analyze(edges, sitemap_urls, homepage)

# Serialize to audit-data.json under "internalLinking" key
audit_data["internalLinking"] = result.model_dump(mode="json")
```

---

## 7. Issues Vocabulary Reference

| Constant String | Trigger Condition | Where Added |
|---|---|---|
| `"HAS_ORPHANS"` | `orphan_count > 0` | `result.issues` |
| `"HIGH_ORPHAN_RATE"` | `orphan_rate > 0.20` | `result.issues` |
| `"UNREACHABLE_PAGES"` | `unreachable_count > 0` | `result.issues` |
| `"WEAK_INTERNAL_LINKING"` | `avg_inbound_links < 2.0` | `result.issues` |
| `"NO_HUB_STRUCTURE"` | `len(hub_clusters) == 0` | `result.issues` |
| `"DEEP_PAGES"` | any node with `link_depth >= 4` | `result.issues` |

---

## 8. Test Data Checklist

Minimum test graph (5 nodes):

```
homepage → page_a, page_b, page_c
page_a  → page_b, homepage
page_b  → page_c
page_c  → (no outbound — dangling node)
page_d  → homepage
```

Expressed as `edges` input:

```python
edges = {
    "https://example.com/": ["https://example.com/page-a", "https://example.com/page-b", "https://example.com/page-c"],
    "https://example.com/page-a": ["https://example.com/page-b", "https://example.com/"],
    "https://example.com/page-b": ["https://example.com/page-c"],
    "https://example.com/page-d": ["https://example.com/"],
}
sitemap_urls = [
    "https://example.com/",
    "https://example.com/page-a",
    "https://example.com/page-b",
    "https://example.com/page-c",
    "https://example.com/page-d",
]
homepage = "https://example.com/"
```

**Expected results:**

| Method | Expected |
|---|---|
| `build_graph` outbound | 4 entries: homepage→{a,b,c}, a→{b,homepage}, b→{c}, d→{homepage}. page_c not in outbound (no outbound links, not a key in edges). |
| `build_graph` inbound | homepage←{a,d}, a←{homepage}, b←{homepage,a}, c←{homepage,b}. page_d not in inbound (no one links to it). |
| `find_orphans` | `[OrphanPage(url="https://example.com/page-d")]` — page_d has zero inbound links. |
| `compute_link_depth` | depths: `{homepage:0, a:1, b:1, c:1}`. Note: homepage links directly to a, b, and c so all are depth 1. `unreachable=["https://example.com/page-d"]` (page_d only has outbound to homepage; BFS from homepage never reaches page_d because no page links TO page_d). `max_depth=1`, `avg_depth=0.75`. |
| `compute_pagerank` | homepage has highest score (inbound from page_a and page_d). page_c next (inbound from homepage and page_b). All scores sum to 1.0. |
| `find_hubs_and_spokes` | With only 5 nodes, likely returns empty list — homepage has 3 outbound but only 2 inbound (page_a, page_d), which is below `HUB_MIN_INBOUND=3`. |

---

## 9. Complete Method Inventory

For the implementer's checklist — every method in `InternalLinkAnalyzer`, in declaration order:

| # | Method | Visibility | Section |
|---|--------|-----------|---------|
| 1 | `__init__` | public | 2.4 |
| 2 | `analyze` | public | 2.5 |
| 3 | `build_graph` | public | 2.6 |
| 4 | `find_orphans` | public | 2.7 |
| 5 | `compute_link_depth` | public | 2.8 |
| 6 | `find_hubs_and_spokes` | public | 2.9 |
| 7 | `compute_pagerank` | public | 2.10 |
| 8 | `_normalize_url` | private | 2.11 |
| 9 | `_percentile` | private | 2.12 |
| 10 | `_get_all_urls` | private | 2.13 |
| 11 | `_build_node_list` | private | 2.14 |
| 12 | `_generate_recommendations` | private | 2.15 |
