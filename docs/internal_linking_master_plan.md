# Master Plan: Internal Link Graph Analyzer (`analyzers/internal_linking.py`)

> **Status**: Draft — produced by GI-Mapper, 2026-03-22  
> **Next**: Handed to Spec Writer (Task #2) to produce implementation specs

### 1. Architecture Decision

- Standalone class `InternalLinkAnalyzer` — no inheritance from BaseConnector
- Location: `platform/src/audit_platform/analyzers/internal_linking.py`
- Follows content_quality.py pattern: structlog, stateless methods, no HTTP calls
- Export it in `analyzers/__init__.py`

### 2. Data Source Decision — CRITICAL SECTION

Evaluate all three options:

**(A) Modify crawl-sitemap.js to write a SEPARATE `link-graph.json`**
- Where to write: `seo/research/link-graph.json` alongside `crawl-data.json`
- Format: `{ "domain": "...", "crawlDate": "...", "edges": { "https://example.com/page-a": ["https://example.com/page-b", "https://example.com/page-c"], ... } }`
- Pros: keeps crawl-data.json lean; edges exist in memory already; one new fs.writeFileSync call; clean separation
- Cons: one more file to manage; caller must load two files

**(B) Stop stripping contextualLinkTargets in crawl-data.json**
- Change `const { contextualLinkTargets, ...rest } = pd; return rest;` to just `return pd;`
- Pros: simpler — one file; no code path changes
- Cons: inflates crawl-data.json significantly (50-200 URLs per page × 50-200 pages = potentially 10,000-40,000 URL strings added); defeats the comment "keep file size reasonable"

**(C) Analyzer accepts pre-built edge dict as input, agnostic to source**
- `analyze(edges: dict[str, list[str]], sitemap_urls: list[str], homepage: str)`
- The edge dict must be supplied by the caller — either from link-graph.json or built from crawl-data.json somehow
- Pros: maximum flexibility; Python code has no dependency on JS crawl internals
- Cons: crawl-data.json STILL lacks edge data, so caller needs another mechanism to supply it

**RECOMMENDATION**: Option A (separate link-graph.json) — this is the right tradeoff:
- The data exists in memory during crawl and just needs one extra write
- Keeps crawl-data.json lean (backwards compatible with existing report generation)
- Clean, explicit data contract: graph analysis consumes link-graph.json
- The Python analyzer uses Option C's interface (accepts edges dict) so it's decoupled from JS
- Implementation: add a `writeLinkGraph()` call right before or after writeCrawlData() in crawl-sitemap.js

**Modification to crawl-sitemap.js required** (show exact diff):
```js
// After building results object, before or after the crawl-data.json write:
const linkGraph = {
  domain: baseUrl,
  crawlDate: new Date().toISOString(),
  edges: Object.fromEntries(
    analyzedPages
      .filter(pd => pd.contextualLinkTargets)
      .map(pd => [pd.url, pd.contextualLinkTargets])
  ),
};
const graphOutputPath = path.join(__dirname, '..', 'seo', 'research', 'link-graph.json');
fs.writeFileSync(graphOutputPath, JSON.stringify(linkGraph, null, 2));
console.log(`Link graph saved to: ${graphOutputPath}`);
```

### 3. Data Flow Map

```
crawl-sitemap.js (--analyze flag)
  ├── writes seo/research/crawl-data.json     (page metadata, no edge data)
  └── writes seo/research/link-graph.json     (NEW: edge adjacency dict)
        { edges: { url → [target_urls] } }

Python audit pipeline:
  link-graph.json
    → load as dict[str, list[str]]  (edges)
  crawl-data.json
    → load pages[] for sitemap_urls
    → extract homepage (domain root URL)

  InternalLinkAnalyzer.analyze(edges, sitemap_urls, homepage)
    ├── build_graph(edges)              → dict[str, set[str]] (adjacency)
    ├── find_orphans(graph, sitemap_urls) → list[OrphanPage]
    ├── compute_link_depth(graph, homepage) → dict[str, int]  (BFS)
    ├── find_hubs_and_spokes(graph)     → list[HubSpokeCluster]
    └── compute_pagerank(graph)         → dict[str, float]

  Returns: LinkGraphResult
    → serialized into audit-data.json under "internalLinking" key
    → rendered by generate-report.js
```

### 4. Pydantic Models Needed

New file: `platform/src/audit_platform/models/linking.py`

Define these models exactly (with field names, types, defaults, docstrings):

```python
class LinkGraphNode(BaseModel):
    """A single URL node in the internal link graph."""
    url: str
    inbound_count: int = 0       # number of pages linking TO this page (contextual only)
    outbound_count: int = 0      # number of contextual links FROM this page
    link_depth: int = -1         # BFS hops from homepage; -1 = unreachable
    pagerank: float = 0.0        # iterative PageRank score (normalized, sums to 1.0)
    is_orphan: bool = False       # True if inbound_count == 0 and not homepage
    hub_cluster: Optional[str] = None  # cluster ID if this page is part of a hub/spoke group
    is_hub: bool = False          # True if identified as a hub page
    recommendations: list[str] = Field(default_factory=list)

class OrphanPage(BaseModel):
    """A page with zero inbound contextual internal links."""
    url: str
    outbound_links: int = 0     # it may still link out
    is_in_sitemap: bool = True   # whether it appears in sitemap
    recommendation: str = ""

class HubSpokeCluster(BaseModel):
    """A hub page and its spoke pages."""
    cluster_id: str              # e.g., "hub_0", "hub_1"
    hub_url: str
    hub_inbound: int = 0
    hub_outbound: int = 0
    spokes: list[str] = Field(default_factory=list)  # URLs of spoke pages
    spoke_count: int = 0

class LinkDepthResult(BaseModel):
    """BFS link depth from homepage for all reachable pages."""
    homepage: str
    depths: dict[str, int] = Field(default_factory=dict)  # url → depth
    unreachable: list[str] = Field(default_factory=list)   # pages not reachable from homepage
    max_depth: int = 0
    avg_depth: float = 0.0

class LinkGraphResult(BaseModel):
    """Complete internal link graph analysis result."""
    domain: str = ""
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    total_pages: int = 0
    total_edges: int = 0          # total contextual link relationships
    
    nodes: list[LinkGraphNode] = Field(default_factory=list)
    orphans: list[OrphanPage] = Field(default_factory=list)
    depth_result: LinkDepthResult = Field(default_factory=LinkDepthResult)
    hub_clusters: list[HubSpokeCluster] = Field(default_factory=list)
    
    # Summary stats
    orphan_count: int = 0
    orphan_rate: float = 0.0       # orphan_count / total_pages
    avg_inbound_links: float = 0.0
    avg_outbound_links: float = 0.0
    unreachable_count: int = 0
    
    issues: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
```

### 5. Method Signatures (Full)

All public methods, private helpers, constants:

```python
from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime
from typing import Any, Optional

import structlog

from audit_platform.models.linking import (
    HubSpokeCluster,
    LinkDepthResult,
    LinkGraphNode,
    LinkGraphResult,
    OrphanPage,
)


class InternalLinkAnalyzer:
    """Standalone internal link graph analysis. No HTTP calls."""

    # Tuning constants
    PAGERANK_DAMPING: float = 0.85
    PAGERANK_ITERATIONS: int = 50
    PAGERANK_CONVERGENCE: float = 1e-6   # stop early if delta < this
    HUB_OUTBOUND_PERCENTILE: float = 0.75  # top 25% outbound → hub candidate
    HUB_MIN_INBOUND: int = 3               # hub must have >= 3 inbound links too
    DEEP_LINK_THRESHOLD: int = 4           # depth >= 4 is flagged

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)

    # ── Public API ──────────────────────────────────────────────────────────

    def analyze(
        self,
        edges: dict[str, list[str]],
        sitemap_urls: list[str],
        homepage: str,
    ) -> LinkGraphResult:
        """Orchestrator. Runs all 5 analyses and returns full results."""
        # Steps: build_graph → find_orphans → compute_link_depth →
        #        find_hubs_and_spokes → compute_pagerank → assemble LinkGraphResult

    def build_graph(
        self,
        edges: dict[str, list[str]],
    ) -> tuple[dict[str, set[str]], dict[str, set[str]]]:
        """Build forward (outbound) and reverse (inbound) adjacency sets.
        
        Returns: (outbound_graph, inbound_graph)
          outbound_graph[url] = {urls this page links TO}
          inbound_graph[url] = {urls that link TO this page}
        
        Normalizes URLs (strip trailing slash, lowercase scheme+host).
        Filters out self-links.
        Only includes URLs present in either edges keys or as edge targets.
        """

    def find_orphans(
        self,
        inbound_graph: dict[str, set[str]],
        sitemap_urls: list[str],
        homepage: str,
    ) -> list[OrphanPage]:
        """Return pages from sitemap_urls with zero inbound contextual links.
        
        Homepage is never considered an orphan (it's the root).
        A page is orphan if inbound_graph.get(url, set()) is empty and url != homepage.
        """

    def compute_link_depth(
        self,
        outbound_graph: dict[str, set[str]],
        homepage: str,
    ) -> LinkDepthResult:
        """BFS from homepage. Returns depth for every reachable page.
        
        Algorithm:
          queue = deque([(homepage, 0)])
          visited = {homepage: 0}
          while queue:
            current, depth = queue.popleft()
            for neighbor in outbound_graph.get(current, set()):
              if neighbor not in visited:
                visited[neighbor] = depth + 1
                queue.append((neighbor, depth + 1))
        
        Unreachable pages: any URL in outbound_graph.keys() not in visited.
        """

    def find_hubs_and_spokes(
        self,
        outbound_graph: dict[str, set[str]],
        inbound_graph: dict[str, set[str]],
    ) -> list[HubSpokeCluster]:
        """Identify hub pages and their spoke clusters.
        
        Hub detection heuristic:
          1. Compute outbound_count for each page
          2. Find the 75th percentile of outbound_count (HUB_OUTBOUND_PERCENTILE)
          3. Candidate hubs = pages where outbound_count >= 75th percentile AND inbound_count >= HUB_MIN_INBOUND
          4. For each hub, its "spokes" = pages that the hub links to AND that link back to the hub
             (bidirectional link = strong hub/spoke relationship)
             If no bidirectional, fall back to pages the hub links to that have few other inbound links (hub is their primary referrer)
          5. Sort clusters by spoke_count DESC
        """

    def compute_pagerank(
        self,
        outbound_graph: dict[str, set[str]],
        inbound_graph: dict[str, set[str]],
        damping: float = PAGERANK_DAMPING,
        iterations: int = PAGERANK_ITERATIONS,
    ) -> dict[str, float]:
        """Iterative PageRank approximation (power method).
        
        Algorithm:
          N = total pages (all nodes in graph)
          Initialize: rank[url] = 1.0 / N  for all urls
          
          For each iteration t in range(iterations):
            new_rank = {}
            for url in all_urls:
              inbound = inbound_graph.get(url, set())
              # Sum contributions from pages linking to url
              rank_sum = sum(
                rank[src] / len(outbound_graph.get(src, {url}))
                for src in inbound
              )
              new_rank[url] = (1 - damping) / N + damping * rank_sum
            
            # Check convergence
            delta = sum(abs(new_rank[u] - rank[u]) for u in all_urls)
            rank = new_rank
            if delta < PAGERANK_CONVERGENCE:
              break
          
          # Normalize so all values sum to 1.0
          total = sum(rank.values())
          return {u: v / total for u, v in rank.items()}
        
        Note: Pages with no outbound links (dangling nodes) distribute
        their rank evenly to all pages (teleportation model).
        """

    # ── Private helpers ─────────────────────────────────────────────────────

    def _normalize_url(self, url: str) -> str:
        """Lowercase scheme+host, strip trailing slash, strip fragments."""

    def _percentile(self, values: list[int], p: float) -> float:
        """Compute p-th percentile of a list of ints (0 <= p <= 1)."""

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
        """Assemble LinkGraphNode list from all sub-analysis results."""

    def _generate_recommendations(
        self,
        result: LinkGraphResult,
    ) -> None:
        """Populate result.recommendations and per-node recommendations in place.
        
        Rules:
        - If orphan_rate > 0.2: add site-level issue 'HIGH_ORPHAN_RATE'
          recommendation: 'Over 20% of pages have no contextual inbound links...'
        - For each orphan: add node recommendation 'No contextual links point to this page...'
        - For pages with link_depth >= DEEP_LINK_THRESHOLD: add node recommendation
          'This page is {depth} clicks from the homepage...'
        - For pages with low pagerank (bottom 25%): add node recommendation
          'Low internal PageRank. Consider adding contextual links from hub pages.'
        - If unreachable_count > 0: add site-level recommendation about unreachable pages
        """
```

### 6. Algorithm Details

#### 6.1 BFS Link Depth
- Standard BFS using `collections.deque`
- Homepage depth = 0
- Each link hop increments depth by 1
- First visit wins (shortest path)
- Pages not reached are "unreachable" — add 'UNREACHABLE_PAGES' issue if count > 0

#### 6.2 Iterative PageRank
- Power method, not eigenvector decomposition
- Dangling node handling: dangling nodes (no outbound links) teleport rank to all nodes
  - At each iteration: `dangling_sum = sum(rank[n] for n in dangling_nodes)`
  - Add `damping * dangling_sum / N` to every node's new rank
- Convergence: L1 delta < 1e-6 OR max iterations reached
- Final normalization: divide all values by sum to ensure they sum to 1.0
- Typical convergence: 20-40 iterations for small graphs (50-200 pages)

#### 6.3 Hub Detection
- Compute outbound degree for all nodes
- Use numpy-free percentile: sort values, index at int(p * len)
- Threshold = max(HUB_OUTBOUND_PERCENTILE quantile, 3)  # at least 3 outbound
- Candidate hubs must also have inbound >= HUB_MIN_INBOUND (3)
- Spoke assignment: pages the hub links to AND (links back to hub OR hub is their primary referrer = ≥50% of their inbound come from the hub)
- Cluster ID: "hub_0", "hub_1", ... sorted by hub outbound_count DESC

#### 6.4 URL Normalization
Critical for graph correctness. Two URLs for same page must hash to same key:
```
https://Example.com/page/ → https://example.com/page
https://example.com/page#section → https://example.com/page
```
Use `urllib.parse.urlparse` + `urlunparse` — already in stdlib.

### 7. Issues Vocabulary

| Constant | Trigger |
|---|---|
| `HIGH_ORPHAN_RATE` | orphan_rate > 0.20 |
| `HAS_ORPHANS` | orphan_count > 0 |
| `UNREACHABLE_PAGES` | unreachable_count > 0 |
| `DEEP_PAGES` | any page has link_depth >= 4 |
| `WEAK_INTERNAL_LINKING` | avg_inbound_links < 2.0 |
| `NO_HUB_STRUCTURE` | no hub clusters detected (all outbound counts similar) |

### 8. Integration Points

#### 8.1 link-graph.json → InternalLinkAnalyzer field mapping

| link-graph.json field | Python |
|---|---|
| `edges[url]` | `edges: dict[str, list[str]]` param |
| `domain` | `result.domain` |
| `crawlDate` | reference only |

#### 8.2 crawl-data.json → sitemap_urls and homepage

```python
import json

with open('seo/research/crawl-data.json') as f:
    crawl = json.load(f)
with open('seo/research/link-graph.json') as f:
    graph_data = json.load(f)

sitemap_urls = [p['url'] for p in crawl['pages'] if not p.get('error')]
homepage = crawl['domain']  # or find the page with shortest URL
edges = graph_data['edges']

analyzer = InternalLinkAnalyzer()
result = analyzer.analyze(edges, sitemap_urls, homepage)
```

#### 8.3 LinkGraphResult → audit-data.json

```json
{
  "internalLinking": {
    "domain": "https://mammothlakesproperties.com",
    "analyzed_at": "2026-03-22T19:00:00Z",
    "total_pages": 45,
    "total_edges": 312,
    "orphan_count": 7,
    "orphan_rate": 0.156,
    "avg_inbound_links": 6.9,
    "avg_outbound_links": 6.9,
    "unreachable_count": 2,
    "issues": ["HAS_ORPHANS", "DEEP_PAGES"],
    "recommendations": ["7 pages have no contextual inbound links..."],
    "nodes": [
      {
        "url": "https://mammothlakesproperties.com/",
        "inbound_count": 42,
        "outbound_count": 15,
        "link_depth": 0,
        "pagerank": 0.082,
        "is_hub": true,
        "hub_cluster": "hub_0"
      }
    ],
    "orphans": [{ "url": "...", "outbound_links": 3, "recommendation": "..." }],
    "depth_result": { "homepage": "...", "max_depth": 5, "avg_depth": 2.3, "unreachable": [] },
    "hub_clusters": [{ "cluster_id": "hub_0", "hub_url": "...", "spokes": [...], "spoke_count": 8 }]
  }
}
```

#### 8.4 HTML Report Integration

The `generate-report.js` file will need a new section "Internal Linking" (separate task). Data contract:
- Table of orphaned pages with recommendations
- Depth distribution histogram (0-deep link counts)
- Top 10 pages by PageRank
- Hub/spoke cluster visual (list-based, not graph visual — keep it simple)
- Issues summary badge counts

### 9. Dependencies

All stdlib + structlog (already in pyproject.toml):

| Module | Usage |
|---|---|
| `collections.deque` | BFS queue for link depth |
| `collections.defaultdict` | Graph adjacency construction |
| `urllib.parse` | URL normalization |
| `datetime` | `analyzed_at` timestamp |
| `structlog` | Structured logging |
| `pydantic` | Model definitions (already a dependency) |

No new pip packages needed.

### 10. crawl-sitemap.js Modification Spec

Exact change needed — minimal diff from current code:

**Location**: After `const results = { ... }` block, before or after the `fs.writeFileSync(outputPath, ...)` call.

**Add** (approximately line 385-395 in current file):

```js
// Write link graph (edge data for Python graph analyzer)
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
```

Note: `analyzedPages` still has `contextualLinkTargets` at this point. The stripping happens in the `.map()` inside `results.pages`, which is separate. So the above reads `pd.contextualLinkTargets` directly from `analyzedPages` — it will have the data.

### 11. Handoff Notes for Spec Writer

1. **Two files to create**: `analyzers/internal_linking.py` and `models/linking.py`
2. **One file to modify**: `analyzers/__init__.py` (add InternalLinkAnalyzer export)
3. **One JS file to modify**: `template/scripts/crawl-sitemap.js` (add link-graph.json write)
4. **URL normalization is critical**: inconsistent trailing slashes will create phantom duplicate nodes. Normalize ALL URLs when building the graph.
5. **Homepage detection**: The `homepage` parameter should default to the domain root (e.g., `https://example.com`). If the domain ends in a path, normalize it too.
6. **Dangling nodes**: Pages that appear as link targets but have no outbound links must still exist as graph nodes (inbound_count > 0, outbound_count = 0). Include them in PageRank with the dangling node teleportation model.
7. **Self-links**: Filter out `pd.url == target_url` pairs in `build_graph`. A page linking to itself doesn't count as a meaningful edge.
8. **Test data**: A 5-node test graph with known orphan, known hub, and one dangling node is sufficient to verify all 5 analysis features deterministically.
9. **Performance**: O(N²) operations only appear in PageRank (N × iterations). For N=200 pages and 50 iterations, that's 10,000 iterations — each with a `sum()` over inbound set. Totally fine for this scale.
10. **The existing orphanedPages field in crawl-data.json**: This was computed by the JS crawler and is a simple set-based check. The Python analyzer's `find_orphans` will produce a richer `OrphanPage` object with recommendations. The JS-computed list is a useful sanity check but is not the authoritative source — the Python analyzer's result is.

