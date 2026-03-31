"""Internal link graph analyzer.

Standalone analysis class for building a directed link graph from crawl data,
computing PageRank, detecting orphan pages, identifying hub-and-spoke clusters,
measuring link depth from the homepage, and (when NetworkX is available)
computing betweenness centrality, HITS hub/authority scores, Louvain community
detection, and graph-level structural metrics.

No HTTP calls -- operates entirely on pre-crawled edge data.

Research-backed: Briggsby internal link analysis (7+ graph metrics),
ContextBridge semantic linking, ImportSEM topical clustering.
"""

from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime
from typing import Any, Optional
from urllib.parse import urlparse, urlunparse

import structlog

try:
    import networkx as nx
    _NETWORKX_AVAILABLE = True
except ImportError:
    _NETWORKX_AVAILABLE = False

from audit_platform.models.linking import (
    HubSpokeCluster,
    LinkDepthResult,
    LinkGraphNode,
    LinkGraphResult,
    OrphanPage,
)


class InternalLinkAnalyzer:
    """Standalone internal link graph analysis. No HTTP calls."""

    PAGERANK_DAMPING: float = 0.85
    PAGERANK_ITERATIONS: int = 50
    PAGERANK_CONVERGENCE: float = 1e-6
    HUB_OUTBOUND_PERCENTILE: float = 0.75
    HUB_MIN_INBOUND: int = 3
    DEEP_LINK_THRESHOLD: int = 4

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)

    def analyze(
        self,
        edges: dict[str, list[str]],
        sitemap_urls: list[str],
        homepage: str,
    ) -> LinkGraphResult:
        """Build link graph and compute all metrics.

        Args:
            edges: Raw edge data from link-graph.json. Keys are source URLs,
                values are lists of target URLs (contextual links only).
            sitemap_urls: All known page URLs from the sitemap/crawl.
            homepage: The root URL of the site (e.g., "https://example.com").

        Returns:
            LinkGraphResult with all fields populated.
        """
        self.log.info("internal_link_analysis_start", edge_count=len(edges), sitemap_url_count=len(sitemap_urls))

        homepage = self._normalize_url(homepage)
        parsed = urlparse(homepage)
        domain = f"{parsed.scheme}://{parsed.netloc}"

        outbound_adj, inbound_adj = self.build_graph(edges)
        orphans = self.find_orphans(inbound_adj, sitemap_urls, homepage)
        depth_result = self.compute_link_depth(outbound_adj, inbound_adj, homepage)
        hub_clusters = self.find_hubs_and_spokes(outbound_adj, inbound_adj)
        pageranks = self.compute_pagerank(outbound_adj, inbound_adj)

        all_urls = self._get_all_urls(outbound_adj, inbound_adj)
        orphan_urls = {o.url for o in orphans}
        nodes = self._build_node_list(all_urls, outbound_adj, inbound_adj, depth_result.depths, pageranks, orphan_urls, hub_clusters)

        # Extended graph metrics via NetworkX (when available)
        extended = self.compute_extended_metrics(outbound_adj, inbound_adj)
        communities = extended.get("communities", [])
        link_suggestions = self.suggest_link_additions(nodes, orphan_urls, outbound_adj, inbound_adj)

        # Enrich nodes with extended metrics
        if extended:
            betweenness = extended.get("betweenness", {})
            hits_hubs = extended.get("hits_hubs", {})
            hits_auths = extended.get("hits_authorities", {})
            community_map = extended.get("community_map", {})
            pr_median = sorted(pageranks.values())[len(pageranks) // 2] if pageranks else 0
            bc_top_10_pct = sorted(betweenness.values(), reverse=True)[:max(1, len(betweenness) // 10)]
            bc_threshold = bc_top_10_pct[-1] if bc_top_10_pct else 0

            for node in nodes:
                node.betweenness_centrality = round(betweenness.get(node.url, 0.0), 6)
                node.hits_hub_score = round(hits_hubs.get(node.url, 0.0), 6)
                node.hits_authority_score = round(hits_auths.get(node.url, 0.0), 6)
                node.community_id = community_map.get(node.url)
                # Bridge detection: top 10% betweenness but below median PageRank
                if node.betweenness_centrality >= bc_threshold > 0 and node.pagerank < pr_median:
                    node.is_bridge = True

        total_pages = len(all_urls)
        total_edges = sum(len(v) for v in outbound_adj.values())
        orphan_count = len(orphans)
        orphan_rate = orphan_count / total_pages if total_pages > 0 else 0.0
        avg_inbound = sum(len(v) for v in inbound_adj.values()) / total_pages if total_pages > 0 else 0.0
        avg_outbound = sum(len(v) for v in outbound_adj.values()) / total_pages if total_pages > 0 else 0.0
        unreachable_count = len(depth_result.unreachable)

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
            graph_density=extended.get("density", 0.0),
            avg_clustering_coefficient=extended.get("avg_clustering", 0.0),
            community_count=len(communities),
            communities=communities,
            link_suggestions=link_suggestions,
        )

        self._generate_recommendations(result)
        self.log.info("internal_link_analysis_complete", total_pages=total_pages, orphan_count=orphan_count, hub_count=len(hub_clusters))
        return result

    def build_graph(
        self,
        edges: dict[str, list[str]],
    ) -> tuple[dict[str, set[str]], dict[str, set[str]]]:
        """Build outbound and inbound adjacency dicts from raw edge data.

        Args:
            edges: Raw edge data. Keys are source URLs, values are lists of target URLs.

        Returns:
            Tuple of (outbound, inbound) dicts mapping URL -> set of URLs.
        """
        outbound: dict[str, set[str]] = defaultdict(set)
        inbound: dict[str, set[str]] = defaultdict(set)

        for source_url, target_urls in edges.items():
            if not isinstance(target_urls, list):
                continue
            norm_source = self._normalize_url(source_url)
            outbound[norm_source]  # initialize key in defaultdict
            for target_url in target_urls:
                norm_target = self._normalize_url(target_url)
                if norm_target == norm_source:
                    continue
                outbound[norm_source].add(norm_target)
                inbound[norm_target].add(norm_source)

        self.log.debug("build_graph_complete", node_count=len(outbound), edge_count=sum(len(v) for v in outbound.values()))
        return (dict(outbound), dict(inbound))

    def find_orphans(
        self,
        inbound_graph: dict[str, set[str]],
        sitemap_urls: list[str],
        homepage: str,
    ) -> list[OrphanPage]:
        """Find pages in the sitemap with zero contextual inbound links.

        Args:
            inbound_graph: The inbound adjacency dict from build_graph.
            sitemap_urls: All known page URLs.
            homepage: The homepage URL (already normalized by caller).

        Returns:
            List of OrphanPage objects.
        """
        norm_sitemap = [self._normalize_url(u) for u in sitemap_urls]
        orphans: list[OrphanPage] = []

        for url in norm_sitemap:
            if url == homepage:
                continue
            inbound = inbound_graph.get(url, set())
            if len(inbound) == 0:
                orphans.append(OrphanPage(
                    url=url,
                    outbound_links=0,
                    is_in_sitemap=True,
                    recommendation="No contextual links point to this page. Add it to at least 2-3 hub or category pages.",
                ))

        self.log.debug("find_orphans_complete", orphan_count=len(orphans), sitemap_count=len(norm_sitemap))
        return orphans

    def compute_link_depth(
        self,
        outbound_graph: dict[str, set[str]],
        inbound_graph: dict[str, set[str]],
        homepage: str,
    ) -> LinkDepthResult:
        """BFS from homepage to compute click depth for every reachable page.

        Args:
            outbound_graph: The outbound adjacency dict from build_graph.
            inbound_graph: The inbound adjacency dict from build_graph.
            homepage: The homepage URL.

        Returns:
            LinkDepthResult with BFS depths from homepage.
        """
        homepage = self._normalize_url(homepage)
        depths: dict[str, int] = {homepage: 0}
        queue: deque = deque([(homepage, 0)])

        while queue:
            current, depth = queue.popleft()
            for neighbor in outbound_graph.get(current, set()):
                if neighbor not in depths:
                    depths[neighbor] = depth + 1
                    queue.append((neighbor, depth + 1))

        all_graph_urls = self._get_all_urls(outbound_graph, inbound_graph)
        unreachable = [u for u in all_graph_urls if u not in depths]
        max_depth = max(depths.values()) if len(depths) > 1 else 0
        avg_depth = sum(depths.values()) / len(depths) if depths else 0.0

        self.log.debug("compute_link_depth_complete", reachable=len(depths), unreachable=len(unreachable), max_depth=max_depth)
        return LinkDepthResult(homepage=homepage, depths=depths, unreachable=unreachable, max_depth=max_depth, avg_depth=avg_depth)

    def find_hubs_and_spokes(
        self,
        outbound_graph: dict[str, set[str]],
        inbound_graph: dict[str, set[str]],
    ) -> list[HubSpokeCluster]:
        """Identify hub pages and their associated spoke pages.

        Args:
            outbound_graph: The outbound adjacency dict.
            inbound_graph: The inbound adjacency dict.

        Returns:
            List of HubSpokeCluster objects.
        """
        all_urls = self._get_all_urls(outbound_graph, inbound_graph)
        if len(all_urls) < 3:
            return []

        outbound_counts = {u: len(outbound_graph.get(u, set())) for u in all_urls}
        outbound_values = list(outbound_counts.values())
        threshold_outbound = max(self._percentile(outbound_values, self.HUB_OUTBOUND_PERCENTILE), 3.0)

        candidates = [
            u for u in all_urls
            if outbound_counts[u] >= threshold_outbound
            and len(inbound_graph.get(u, set())) >= self.HUB_MIN_INBOUND
        ]
        candidates.sort(key=lambda u: outbound_counts[u], reverse=True)

        clusters: list[HubSpokeCluster] = []
        for i, hub_url in enumerate(candidates):
            hub_outbound = outbound_graph.get(hub_url, set())
            hub_inbound = inbound_graph.get(hub_url, set())
            spokes: list[str] = []
            for spoke_url in hub_outbound:
                spoke_inbound = inbound_graph.get(spoke_url, set())
                is_bidirectional = hub_url in outbound_graph.get(spoke_url, set())
                spoke_inbound_count = len(spoke_inbound)
                is_primary = spoke_inbound_count > 0 and hub_url in spoke_inbound and (1.0 / spoke_inbound_count) >= 0.5
                if is_bidirectional or is_primary:
                    spokes.append(spoke_url)

            clusters.append(HubSpokeCluster(
                cluster_id=f"hub_{i}",
                hub_url=hub_url,
                hub_inbound=len(hub_inbound),
                hub_outbound=outbound_counts[hub_url],
                spokes=spokes,
                spoke_count=len(spokes),
            ))

        self.log.debug("find_hubs_and_spokes_complete", hub_count=len(clusters))
        return clusters

    def compute_pagerank(
        self,
        outbound_graph: dict[str, set[str]],
        inbound_graph: dict[str, set[str]],
    ) -> dict[str, float]:
        """Compute normalized PageRank scores for all nodes.

        Args:
            outbound_graph: The outbound adjacency dict.
            inbound_graph: The inbound adjacency dict.

        Returns:
            Dict mapping URL -> normalized PageRank score (all values sum to 1.0).
        """
        all_urls = list(self._get_all_urls(outbound_graph, inbound_graph))
        N = len(all_urls)
        if N == 0:
            return {}

        rank: dict[str, float] = {u: 1.0 / N for u in all_urls}
        dangling_nodes = {u for u in all_urls if not outbound_graph.get(u)}

        _iter = 0
        for _iter in range(self.PAGERANK_ITERATIONS):
            dangling_sum = sum(rank[n] for n in dangling_nodes)
            new_rank: dict[str, float] = {}
            for url in all_urls:
                inbound = inbound_graph.get(url, set())
                rank_sum = sum(rank[src] / len(outbound_graph[src]) for src in inbound if outbound_graph.get(src))
                new_rank[url] = (1 - self.PAGERANK_DAMPING) / N + self.PAGERANK_DAMPING * (dangling_sum / N + rank_sum)
            delta = sum(abs(new_rank[u] - rank[u]) for u in all_urls)
            rank = new_rank
            if delta < self.PAGERANK_CONVERGENCE:
                break

        total = sum(rank.values())
        rank = {u: v / total for u, v in rank.items()} if total > 0 else rank

        self.log.debug("compute_pagerank_complete", iterations_run=_iter + 1, node_count=N)
        return rank

    # ------------------------------------------------------------------
    # Extended Graph Metrics (NetworkX-powered)
    # ------------------------------------------------------------------

    def compute_extended_metrics(
        self,
        outbound_graph: dict[str, set[str]],
        inbound_graph: dict[str, set[str]],
    ) -> dict[str, Any]:
        """Compute advanced graph metrics using NetworkX.

        Returns betweenness centrality, HITS hub/authority scores,
        Louvain community detection, density, and clustering coefficient.

        Falls back to empty dict if NetworkX is not installed or graph
        is too small (<3 nodes).
        """
        if not _NETWORKX_AVAILABLE:
            self.log.info("networkx_not_available", msg="Install networkx for extended graph metrics")
            return {}

        all_urls = self._get_all_urls(outbound_graph, inbound_graph)
        if len(all_urls) < 3:
            return {}

        # Build NetworkX DiGraph
        G = nx.DiGraph()
        for src, targets in outbound_graph.items():
            for tgt in targets:
                G.add_edge(src, tgt)

        self.log.info("extended_metrics_start", nodes=G.number_of_nodes(), edges=G.number_of_edges())

        result: dict[str, Any] = {}

        # Density
        try:
            result["density"] = round(nx.density(G), 6)
        except Exception:
            result["density"] = 0.0

        # Average clustering coefficient (on undirected version)
        try:
            G_undirected = G.to_undirected()
            result["avg_clustering"] = round(nx.average_clustering(G_undirected), 6)
        except Exception:
            result["avg_clustering"] = 0.0

        # Betweenness centrality (cap computation on large graphs)
        try:
            if G.number_of_nodes() <= 5000:
                result["betweenness"] = nx.betweenness_centrality(G)
            else:
                # Sample-based approximation for large graphs
                result["betweenness"] = nx.betweenness_centrality(G, k=min(500, G.number_of_nodes()))
        except Exception:
            result["betweenness"] = {}

        # HITS (hub and authority scores)
        try:
            hubs, authorities = nx.hits(G, max_iter=100, tol=1e-6)
            result["hits_hubs"] = hubs
            result["hits_authorities"] = authorities
        except (nx.PowerIterationFailedConvergence, Exception):
            result["hits_hubs"] = {}
            result["hits_authorities"] = {}

        # Community detection via Louvain (on undirected graph)
        try:
            if not hasattr(nx, 'to_undirected'):
                G_undirected = G.to_undirected()
            else:
                G_undirected = G.to_undirected()

            communities_gen = nx.community.louvain_communities(G_undirected, seed=42)
            communities = [sorted(list(c)) for c in communities_gen]
            communities.sort(key=len, reverse=True)

            # Build URL -> community_id map
            community_map: dict[str, int] = {}
            for idx, community in enumerate(communities):
                for url in community:
                    community_map[url] = idx

            result["communities"] = communities[:20]  # Cap at 20 communities
            result["community_map"] = community_map
        except Exception as exc:
            self.log.warning("community_detection_failed", error=str(exc))
            result["communities"] = []
            result["community_map"] = {}

        self.log.info(
            "extended_metrics_complete",
            density=result.get("density", 0),
            communities=len(result.get("communities", [])),
        )

        return result

    def suggest_link_additions(
        self,
        nodes: list,
        orphan_urls: set[str],
        outbound_graph: dict[str, set[str]],
        inbound_graph: dict[str, set[str]],
    ) -> list[dict[str, Any]]:
        """Suggest specific internal link additions for orphan/weak pages.

        For each orphan or low-link page, finds high-PageRank hub pages
        that could serve as link sources, based on URL path token overlap.
        """
        suggestions: list[dict[str, Any]] = []

        # Find hub pages (high PageRank + high outbound)
        hubs = sorted(
            [n for n in nodes if n.is_hub or n.pagerank > 0],
            key=lambda n: n.pagerank,
            reverse=True,
        )[:20]

        if not hubs:
            return suggestions

        # Build token sets for hub pages (from URL path segments)
        hub_tokens: dict[str, set[str]] = {}
        for hub in hubs:
            tokens = set(hub.url.lower().strip("/").split("/")[-1].replace("-", " ").replace("_", " ").split())
            tokens.discard("")
            hub_tokens[hub.url] = tokens

        # For each orphan/weak page, find matching hubs
        target_pages = [n for n in nodes if n.url in orphan_urls or (n.inbound_count <= 1 and not n.is_hub)]

        for target in target_pages[:30]:  # Cap suggestions
            target_tokens = set(target.url.lower().strip("/").split("/")[-1].replace("-", " ").replace("_", " ").split())
            target_tokens.discard("")

            if not target_tokens:
                continue

            # Score each hub by token overlap
            scored_hubs: list[tuple[str, int]] = []
            for hub in hubs:
                if hub.url == target.url:
                    continue
                # Don't suggest if hub already links to target
                if target.url in outbound_graph.get(hub.url, set()):
                    continue
                overlap = len(target_tokens & hub_tokens.get(hub.url, set()))
                if overlap > 0:
                    scored_hubs.append((hub.url, overlap))

            scored_hubs.sort(key=lambda x: x[1], reverse=True)

            for source_url, overlap in scored_hubs[:3]:
                common = target_tokens & hub_tokens.get(source_url, set())
                suggestions.append({
                    "sourceUrl": source_url,
                    "targetUrl": target.url,
                    "reason": f"Orphan page — {overlap} keyword overlap in URL paths",
                    "suggestedAnchorTokens": sorted(common)[:5],
                })

        return suggestions[:50]

    def _normalize_url(self, url: str) -> str:
        """Normalize a URL: lowercase scheme/netloc, strip fragment and trailing slash."""
        if not url:
            return ""
        parsed = urlparse(url)
        normalized = parsed._replace(
            scheme=parsed.scheme.lower(),
            netloc=parsed.netloc.lower(),
            fragment="",
            path=parsed.path.rstrip("/") or "/",
        )
        return urlunparse(normalized)

    def _percentile(self, values: list[int], p: float) -> float:
        """Return the p-th percentile of values (0.0-1.0 scale for p)."""
        if not values:
            return 0.0
        sorted_vals = sorted(values)
        idx = int(p * len(sorted_vals))
        idx = min(idx, len(sorted_vals) - 1)
        return float(sorted_vals[idx])

    def _get_all_urls(
        self,
        forward_adj: dict[str, set[str]],
        reverse_adj: dict[str, set[str]],
    ) -> set[str]:
        """Return union of all URLs appearing as keys in either adjacency dict."""
        return set(forward_adj.keys()) | set(reverse_adj.keys())

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
        """Build a sorted list of LinkGraphNode objects for all URLs."""
        url_to_cluster: dict[str, str] = {}
        url_is_hub: dict[str, bool] = {}
        for cluster in hub_clusters:
            url_to_cluster[cluster.hub_url] = cluster.cluster_id
            url_is_hub[cluster.hub_url] = True
            for spoke in cluster.spokes:
                if spoke not in url_to_cluster:  # don't overwrite if spoke is also a hub
                    url_to_cluster[spoke] = cluster.cluster_id
                    url_is_hub[spoke] = False

        nodes: list[LinkGraphNode] = []
        for url in sorted(all_urls):
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
        return nodes

    def _generate_recommendations(
        self,
        result: LinkGraphResult,
    ) -> None:
        """Generate site-level and per-node recommendations in place."""
        # Site-level issues
        if result.orphan_count > 0:
            result.issues.append("HAS_ORPHANS")
        if result.orphan_rate > 0.20:
            result.issues.append("HIGH_ORPHAN_RATE")
            result.recommendations.append(
                "Over 20% of pages have no contextual inbound links. Audit your internal linking structure and add contextual links from hub pages to orphaned content."
            )
        if result.unreachable_count > 0:
            result.issues.append("UNREACHABLE_PAGES")
            result.recommendations.append(
                f"{result.unreachable_count} pages are unreachable from the homepage via contextual links. Check for broken links or isolated page clusters."
            )
        if result.avg_inbound_links < 2.0:
            result.issues.append("WEAK_INTERNAL_LINKING")
            result.recommendations.append(
                f"Average inbound contextual links per page is {result.avg_inbound_links:.1f} (below 2.0). Increase internal linking density across the site."
            )
        if not result.hub_clusters:
            result.issues.append("NO_HUB_STRUCTURE")

        has_deep = any(n.link_depth >= self.DEEP_LINK_THRESHOLD for n in result.nodes if n.link_depth >= 0)
        if has_deep:
            result.issues.append("DEEP_PAGES")
            result.recommendations.append(
                "Some pages are buried 4+ clicks from the homepage. Flatten the link hierarchy for key content pages."
            )

        # Per-node recommendations
        pagerank_values = [n.pagerank for n in result.nodes]
        low_pr_threshold = self._percentile(pagerank_values, 0.25)

        for node in result.nodes:
            if node.is_orphan:
                node.recommendations.append("No contextual links point to this page. Add it to at least 2-3 hub or category pages.")
            if node.link_depth >= self.DEEP_LINK_THRESHOLD:
                node.recommendations.append(f"This page is {node.link_depth} clicks from the homepage. Move key content higher in the site hierarchy.")
            if node.pagerank < low_pr_threshold and node.pagerank > 0.0:
                node.recommendations.append("Low internal PageRank. Consider adding contextual links from hub pages.")
