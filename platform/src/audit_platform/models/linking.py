"""Internal linking models.

Data structures for link-graph analysis results including orphan detection,
hub-and-spoke clustering, link depth mapping, and PageRank distribution.
Used by the internal link analyzer to assess site architecture quality.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


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
    # Extended graph metrics (NetworkX-powered when available)
    betweenness_centrality: float = 0.0
    hits_hub_score: float = 0.0
    hits_authority_score: float = 0.0
    community_id: Optional[int] = None  # Louvain community ID
    is_bridge: bool = False  # high betweenness but low PageRank
    recommendations: list[str] = Field(default_factory=list)


class OrphanPage(BaseModel):
    """A page in the sitemap with zero contextual inbound links."""

    url: str = ""
    outbound_links: int = 0
    is_in_sitemap: bool = True
    recommendation: str = ""


class HubSpokeCluster(BaseModel):
    """A hub page and its associated spoke pages."""

    cluster_id: str = ""
    hub_url: str = ""
    hub_inbound: int = 0
    hub_outbound: int = 0
    spokes: list[str] = Field(default_factory=list)
    spoke_count: int = 0


class LinkDepthResult(BaseModel):
    """BFS depth results from the homepage."""

    homepage: str = ""  # must have default so LinkGraphResult can use Field(default_factory=LinkDepthResult)
    depths: dict[str, int] = Field(default_factory=dict)  # url -> click depth from homepage
    unreachable: list[str] = Field(default_factory=list)  # urls not reachable via BFS from homepage
    max_depth: int = 0
    avg_depth: float = 0.0


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

    # Extended graph metrics (NetworkX-powered)
    graph_density: float = 0.0  # edges / (nodes * (nodes-1))
    avg_clustering_coefficient: float = 0.0
    community_count: int = 0  # number of detected topic communities
    communities: list[list[str]] = Field(default_factory=list)  # list of URL groups
    link_suggestions: list[dict[str, Any]] = Field(default_factory=list)

    # Issues and recommendations (site-level)
    issues: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
