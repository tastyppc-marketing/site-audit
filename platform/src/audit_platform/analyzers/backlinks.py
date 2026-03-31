"""Backlink analysis — wires DataForSEO backlink connector into audit-data.json schema.

Calls DataForSEO API to fetch backlink summary, individual backlinks, referring
domains, and competitor domain metrics. Outputs structured data matching the
``backlinks`` and ``domainMetrics`` keys defined in ARCHITECTURE.md Section 6.
"""

from __future__ import annotations

from typing import Any, Optional

import structlog

from audit_platform.connectors.dataforseo import DataForSEOConnector
from audit_platform.models.seo import BacklinkRecord, DomainMetrics


class BacklinkAnalyzer:
    """Fetch and structure backlink data for report consumption.

    This analyzer calls the DataForSEO Backlinks API and formats results
    into the audit-data.json schema expected by links.html and
    competitors.html in the multi-page report.
    """

    DEFAULT_BACKLINK_LIMIT: int = 100
    DEFAULT_REFERRING_DOMAIN_LIMIT: int = 50

    def __init__(self, connector: DataForSEOConnector) -> None:
        self.connector = connector
        self.log = structlog.get_logger(self.__class__.__name__)

    # High-risk TLDs (combined with low DR = likely spam)
    TOXIC_TLDS = frozenset({
        ".xyz", ".top", ".click", ".loan", ".biz", ".info", ".gq",
        ".ml", ".cf", ".ga", ".tk", ".work", ".date", ".review",
        ".stream", ".download", ".racing", ".win", ".bid", ".trade",
    })

    def analyze(
        self,
        target: str,
        competitor_domains: list[str] | None = None,
        backlink_limit: int | None = None,
        referring_domain_limit: int | None = None,
        brand_name: str | None = None,
        target_keywords: list[str] | None = None,
        known_404_urls: set[str] | None = None,
    ) -> dict[str, Any]:
        """Run full backlink analysis for a target domain.

        Args:
            target: The client domain (e.g., "example.com").
            competitor_domains: Optional list of competitor domains for
                comparison and intersection analysis.
            backlink_limit: Max individual backlinks to fetch.
            referring_domain_limit: Max referring domains to fetch.
            brand_name: Brand name for anchor text classification.
            target_keywords: Target keywords for exact-match anchor detection.
            known_404_urls: Set of known 404 URLs for broken backlink detection.

        Returns:
            Dict with two top-level keys matching audit-data.json schema:
            - ``backlinks``: Client backlink profile data.
            - ``domainMetrics``: Client + competitor domain comparison.
        """
        if backlink_limit is None:
            backlink_limit = self.DEFAULT_BACKLINK_LIMIT
        if referring_domain_limit is None:
            referring_domain_limit = self.DEFAULT_REFERRING_DOMAIN_LIMIT
        if competitor_domains is None:
            competitor_domains = []

        self.log.info(
            "backlink_analysis_start",
            target=target,
            competitors=len(competitor_domains),
        )

        # ---- Client backlink profile ----
        client_metrics = self._fetch_domain_metrics(target)
        top_backlinks = self._fetch_backlinks(target, backlink_limit)
        referring_domains = self._fetch_referring_domains(
            target, referring_domain_limit
        )

        # ---- Competitor domain metrics ----
        competitor_metrics_list = []
        for comp in competitor_domains:
            comp_metrics = self._fetch_domain_metrics(comp)
            if comp_metrics is not None:
                competitor_metrics_list.append(comp_metrics)

        # ---- Infer brand name if not provided ----
        if not brand_name:
            brand_name = target.split(".")[0] if target else ""

        # ---- Anchor text distribution (brand-aware) ----
        anchor_distribution = self._compute_anchor_distribution(
            top_backlinks, brand_name=brand_name, target_keywords=target_keywords
        )

        # ---- Backlink quality summary ----
        quality_summary = self._compute_quality_summary(top_backlinks)

        # ---- Anchor text over-optimization check ----
        anchor_issues = self._check_anchor_optimization(anchor_distribution)

        # ---- Broken backlink detection ----
        broken_opportunities = self._find_broken_backlinks(
            top_backlinks, known_404_urls or set()
        )

        # ---- Assemble output ----
        backlinks_section = {
            "domainMetrics": self._metrics_to_dict(client_metrics, target),
            "topBacklinks": [
                self._backlink_to_dict(bl) for bl in top_backlinks
            ],
            "referringDomains": referring_domains,
            "anchorDistribution": anchor_distribution,
            "qualitySummary": quality_summary,
            "anchorIssues": anchor_issues,
            "brokenBacklinkOpportunities": broken_opportunities,
            "competitorDomainMetrics": [
                self._metrics_to_dict(m) for m in competitor_metrics_list
            ],
        }

        domain_metrics_section = {
            "client": self._metrics_to_dict(client_metrics, target),
            "competitors": [
                self._metrics_to_dict(m) for m in competitor_metrics_list
            ],
        }

        self.log.info(
            "backlink_analysis_complete",
            target=target,
            backlinks_found=len(top_backlinks),
            referring_domains_found=len(referring_domains),
            competitors_analyzed=len(competitor_metrics_list),
        )

        return {
            "backlinks": backlinks_section,
            "domainMetrics": domain_metrics_section,
        }

    def analyze_intersection(
        self,
        target: str,
        competitor_domains: list[str],
    ) -> list[dict[str, Any]]:
        """Find backlink gap — domains linking to competitors but not client.

        Args:
            target: Client domain (placed first in intersection query).
            competitor_domains: Competitor domains to compare against.

        Returns:
            List of intersection records from DataForSEO.
        """
        if not competitor_domains:
            return []

        targets = [target] + competitor_domains[:19]  # API max 20
        self.log.info(
            "backlink_intersection_start",
            targets=targets,
        )

        try:
            results = self.connector.get_backlink_intersection(targets)
            self.log.info(
                "backlink_intersection_complete",
                results=len(results),
            )
            return results
        except Exception as exc:
            self.log.warning(
                "backlink_intersection_failed",
                error=str(exc),
            )
            return []

    def find_link_opportunities(
        self,
        target: str,
        competitor_domains: list[str],
        min_domain_rating: float = 15.0,
        max_results_per_competitor: int = 50,
    ) -> dict[str, Any]:
        """Find high-quality link opportunities from competitor backlink profiles.

        Pulls backlinks from each competitor, filters out sites already
        linking to the client, removes low-quality/spammy sources, and
        categorizes the remainder into actionable opportunity buckets.

        Args:
            target: Client domain.
            competitor_domains: Competitor domains to mine for opportunities.
            min_domain_rating: Minimum DR to consider (filters out junk).
            max_results_per_competitor: Max backlinks to pull per competitor.

        Returns:
            Dict with ``opportunities`` list and ``summary`` stats, ready
            for audit-data.json ``linkOpportunities`` key.
        """
        if not competitor_domains:
            return {"opportunities": [], "summary": self._empty_opp_summary()}

        self.log.info(
            "link_opportunities_start",
            target=target,
            competitors=len(competitor_domains),
            min_dr=min_domain_rating,
        )

        # Get client's existing backlink sources to exclude
        client_sources = set()
        try:
            client_bls = self.connector.get_backlinks(target, limit=200)
            for bl in client_bls:
                domain = self._extract_domain(bl.source_url)
                if domain:
                    client_sources.add(domain.lower())
        except Exception:
            pass  # If this fails, we just won't filter — still useful

        # Pull competitor backlinks and find gaps
        raw_opportunities: list[dict[str, Any]] = []
        seen_domains: set[str] = set()

        for comp in competitor_domains:
            try:
                comp_backlinks = self.connector.get_backlinks(
                    comp, limit=max_results_per_competitor, order_by=["rank,desc"]
                )
            except Exception as exc:
                self.log.warning(
                    "competitor_backlinks_failed",
                    competitor=comp,
                    error=str(exc),
                )
                continue

            for bl in comp_backlinks:
                source_domain = self._extract_domain(bl.source_url)
                if not source_domain:
                    continue

                source_lower = source_domain.lower()

                # Skip if client already has a link from this domain
                if source_lower in client_sources:
                    continue

                # Skip if we've already captured this domain
                if source_lower in seen_domains:
                    continue

                # Skip low-quality sources
                dr = bl.domain_rating or 0
                if dr < min_domain_rating:
                    continue

                # Skip obvious spam/junk patterns
                if self._is_spammy_domain(source_lower):
                    continue

                seen_domains.add(source_lower)

                category = self._categorize_opportunity(
                    source_lower, bl.anchor_text or "", bl.source_url
                )

                raw_opportunities.append({
                    "sourceDomain": source_domain,
                    "sourceUrl": bl.source_url,
                    "domainRating": dr,
                    "isDofollow": bl.is_dofollow,
                    "anchorText": bl.anchor_text or "",
                    "linksToCompetitor": comp,
                    "category": category,
                    "priority": self._score_opportunity(dr, bl.is_dofollow, category),
                })

        # Sort by priority (highest first)
        raw_opportunities.sort(key=lambda x: x["priority"], reverse=True)

        # Build summary
        summary = self._build_opp_summary(raw_opportunities)

        self.log.info(
            "link_opportunities_complete",
            target=target,
            total_found=len(raw_opportunities),
            high_priority=summary["highPriority"],
        )

        return {
            "opportunities": raw_opportunities,
            "summary": summary,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_domain(url: str) -> str:
        """Pull domain from a URL."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            host = parsed.hostname or ""
            if host.startswith("www."):
                host = host[4:]
            return host
        except Exception:
            return ""

    def _is_spammy_domain(self, domain: str, domain_rating: float = 0) -> bool:
        """Filter out known spam/low-value link sources.

        Checks domain patterns + high-risk TLDs (when combined with low DR).
        """
        spam_patterns = [
            # Link farms and PBN indicators
            "blogspot.", "wordpress.com", "weebly.com", "wixsite.com",
            "tumblr.com",
            # Scraper/aggregator junk
            "issuu.com", "slideshare.net", "scribd.com",
            # Social bookmarking spam
            "digg.com", "stumbleupon.com", "delicious.com",
            # Known low-quality directories
            "freewebdirectory", "linkdirectory", "submitlink",
            "addurl", "linkexchange", "reciprocallinks",
            # Web 2.0 spam
            "angelfire.com", "geocities.com", "tripod.com",
            # Pharma/casino spam patterns
            "pharmacy", "casino", "payday", "viagra",
        ]
        for pattern in spam_patterns:
            if pattern in domain:
                return True

        # High-risk TLDs combined with low domain rating
        if domain_rating < 15:
            for tld in self.TOXIC_TLDS:
                if domain.endswith(tld):
                    return True

        return False

    @staticmethod
    def _categorize_opportunity(
        domain: str, anchor: str, url: str
    ) -> str:
        """Categorize a link opportunity by type."""
        url_lower = url.lower()
        domain_lower = domain.lower()

        # Local/community organizations (check BEFORE directories
        # because .org domains with "member" paths are orgs, not directories)
        local_signals = [
            "chamber", "rotary", "kiwanis", "lions",
            ".gov", ".edu", ".org",
            "association", "society", "council", "board",
            "tourism", "visitor", "convention",
        ]
        for signal in local_signals:
            if signal in domain_lower:
                return "local-organization"

        # Industry directories
        directory_signals = [
            "realtor.com", "zillow.com", "trulia.com", "homes.com",
            "redfin.com", "yelp.com", "bbb.org", "yellowpages.com",
            "manta.com", "angieslist.com", "homeadvisor.com",
            "houzz.com", "thumbtack.com",
            "directory", "listing", "profile", "member",
        ]
        for signal in directory_signals:
            if signal in domain_lower or signal in url_lower:
                return "directory"

        # Press/media
        media_signals = [
            "news", "press", "media", "journal", "times",
            "post", "herald", "tribune", "gazette", "daily",
            "magazine", "review",
        ]
        for signal in media_signals:
            if signal in domain_lower:
                return "press-media"

        # Resource/content pages
        resource_signals = [
            "resource", "guide", "blog", "article",
            "best-of", "top-", "recommended",
        ]
        for signal in resource_signals:
            if signal in url_lower:
                return "resource-page"

        # Partner/business
        partner_signals = [
            "partner", "sponsor", "affiliate", "vendor",
        ]
        for signal in partner_signals:
            if signal in url_lower or signal in domain_lower:
                return "partnership"

        return "general"

    @staticmethod
    def _score_opportunity(
        domain_rating: float, is_dofollow: bool, category: str
    ) -> int:
        """Score an opportunity 0-100 for prioritization."""
        score = 0

        # DR contributes up to 50 points
        score += min(int(domain_rating * 0.5), 50)

        # Dofollow bonus
        if is_dofollow:
            score += 15

        # Category bonus
        category_bonus = {
            "local-organization": 20,
            "press-media": 15,
            "directory": 12,
            "resource-page": 10,
            "partnership": 8,
            "general": 5,
        }
        score += category_bonus.get(category, 5)

        return min(score, 100)

    @staticmethod
    def _build_opp_summary(opportunities: list[dict[str, Any]]) -> dict[str, Any]:
        """Build summary stats for link opportunities."""
        if not opportunities:
            return BacklinkAnalyzer._empty_opp_summary()

        categories: dict[str, int] = {}
        high = 0
        medium = 0
        low = 0

        for opp in opportunities:
            cat = opp.get("category", "general")
            categories[cat] = categories.get(cat, 0) + 1

            pri = opp.get("priority", 0)
            if pri >= 60:
                high += 1
            elif pri >= 35:
                medium += 1
            else:
                low += 1

        avg_dr = sum(o.get("domainRating", 0) for o in opportunities) / len(opportunities)

        return {
            "totalFound": len(opportunities),
            "highPriority": high,
            "mediumPriority": medium,
            "lowPriority": low,
            "avgDomainRating": round(avg_dr, 1),
            "byCategory": [
                {"category": cat, "count": count}
                for cat, count in sorted(categories.items(), key=lambda x: -x[1])
            ],
        }

    @staticmethod
    def _empty_opp_summary() -> dict[str, Any]:
        return {
            "totalFound": 0,
            "highPriority": 0,
            "mediumPriority": 0,
            "lowPriority": 0,
            "avgDomainRating": 0,
            "byCategory": [],
        }

    def _fetch_domain_metrics(self, domain: str) -> Optional[DomainMetrics]:
        """Fetch domain-level metrics from DataForSEO."""
        try:
            metrics = self.connector.get_backlinks_summary(domain)
            self.log.info(
                "domain_metrics_fetched",
                domain=domain,
                domain_rating=metrics.domain_rating,
                backlinks=metrics.backlinks,
            )
            return metrics
        except Exception as exc:
            self.log.warning(
                "domain_metrics_failed",
                domain=domain,
                error=str(exc),
            )
            return None

    def _fetch_backlinks(
        self, target: str, limit: int
    ) -> list[BacklinkRecord]:
        """Fetch individual backlinks sorted by domain rating."""
        try:
            backlinks = self.connector.get_backlinks(
                target,
                limit=limit,
                order_by=["rank,desc"],
            )
            self.log.info(
                "backlinks_fetched",
                target=target,
                count=len(backlinks),
            )
            return backlinks
        except Exception as exc:
            self.log.warning(
                "backlinks_fetch_failed",
                target=target,
                error=str(exc),
            )
            return []

    def _fetch_referring_domains(
        self, target: str, limit: int
    ) -> list[dict[str, Any]]:
        """Fetch referring domains with metadata."""
        try:
            domains = self.connector.get_referring_domains(
                target, limit=limit
            )
            self.log.info(
                "referring_domains_fetched",
                target=target,
                count=len(domains),
            )
            # Normalize to consistent schema
            return [
                {
                    "domain": d.get("domain", ""),
                    "domainRating": d.get("rank"),
                    "backlinks": d.get("backlinks", 0),
                    "dofollow": d.get("dofollow", 0),
                    "firstSeen": d.get("first_seen"),
                    "brokenBacklinks": d.get("broken_backlinks", 0),
                }
                for d in domains
            ]
        except Exception as exc:
            self.log.warning(
                "referring_domains_failed",
                target=target,
                error=str(exc),
            )
            return []

    def _compute_anchor_distribution(
        self,
        backlinks: list[BacklinkRecord],
        brand_name: str = "",
        target_keywords: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Categorize anchor text into distribution buckets.

        Brand-name aware: classifies anchors as branded (contains brand/domain),
        exact-match (matches a target keyword), or partial-match. Flags over-
        optimization when exact-match exceeds 10% or branded falls below 30%.
        """
        if not backlinks:
            return []

        categories: dict[str, int] = {
            "branded": 0,
            "exact-match": 0,
            "partial-match": 0,
            "generic": 0,
            "url": 0,
            "empty": 0,
        }

        generic_anchors = {
            "click here", "here", "read more", "learn more",
            "visit", "website", "link", "source", "this",
        }

        brand_lower = brand_name.lower().strip() if brand_name else ""
        brand_variants = set()
        if brand_lower:
            brand_variants.add(brand_lower)
            brand_variants.add(brand_lower.replace(" ", ""))
            # Add common suffixes stripped
            for suffix in [" llc", " inc", " corp", " ltd", " co"]:
                if brand_lower.endswith(suffix):
                    brand_variants.add(brand_lower[:-len(suffix)])

        kw_set = {kw.lower().strip() for kw in (target_keywords or []) if kw}

        for bl in backlinks:
            anchor = (bl.anchor_text or "").strip().lower()
            if not anchor:
                categories["empty"] += 1
            elif anchor.startswith("http") or anchor.startswith("www."):
                categories["url"] += 1
            elif anchor in generic_anchors:
                categories["generic"] += 1
            elif brand_variants and any(bv in anchor for bv in brand_variants):
                categories["branded"] += 1
            elif kw_set and anchor in kw_set:
                categories["exact-match"] += 1
            elif kw_set and any(kw in anchor for kw in kw_set):
                categories["partial-match"] += 1
            else:
                categories["partial-match"] += 1

        total = len(backlinks)
        return [
            {
                "category": cat,
                "count": count,
                "percentage": round(count / total * 100, 1) if total else 0,
            }
            for cat, count in categories.items()
            if count > 0
        ]

    def _check_anchor_optimization(
        self, distribution: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Check anchor text distribution for over-optimization signals."""
        issues: list[dict[str, Any]] = []
        dist_map = {d["category"]: d["percentage"] for d in distribution}

        exact_pct = dist_map.get("exact-match", 0)
        branded_pct = dist_map.get("branded", 0)
        empty_url_pct = dist_map.get("empty", 0) + dist_map.get("url", 0)

        if exact_pct > 10:
            issues.append({
                "issue": "ANCHOR_OVER_OPTIMIZATION",
                "detail": f"Exact-match anchors at {exact_pct}% (threshold: 10%). Risk of Google penalty.",
                "severity": "high",
            })

        if branded_pct < 30 and branded_pct > 0:
            issues.append({
                "issue": "LOW_BRAND_ANCHOR_RATIO",
                "detail": f"Branded anchors only {branded_pct}% (healthy: 30%+). Profile looks unnatural.",
                "severity": "medium",
            })

        if empty_url_pct > 40:
            issues.append({
                "issue": "POOR_ANCHOR_DIVERSITY",
                "detail": f"Empty/URL anchors at {empty_url_pct}% (threshold: 40%). Missing descriptive anchors.",
                "severity": "low",
            })

        return issues

    def _find_broken_backlinks(
        self,
        backlinks: list[BacklinkRecord],
        known_404_urls: set[str],
    ) -> list[dict[str, Any]]:
        """Find backlinks pointing to 404 pages on the client's site."""
        if not known_404_urls:
            return []

        opportunities: list[dict[str, Any]] = []
        norm_404s = {u.lower().rstrip("/") for u in known_404_urls}

        for bl in backlinks:
            target = (bl.target_url or "").lower().rstrip("/")
            if target in norm_404s:
                opportunities.append({
                    "sourceUrl": bl.source_url,
                    "targetUrl": bl.target_url,
                    "anchorText": bl.anchor_text,
                    "domainRating": bl.domain_rating,
                    "recommendation": f"Redirect {bl.target_url} to the correct page to reclaim this DR {bl.domain_rating or '?'} backlink.",
                })

        return opportunities

    def _compute_quality_summary(
        self, backlinks: list[BacklinkRecord]
    ) -> dict[str, Any]:
        """Compute quality distribution of backlinks."""
        if not backlinks:
            return {
                "total": 0,
                "dofollow": 0,
                "nofollow": 0,
                "avgDomainRating": 0,
                "highQuality": 0,
                "mediumQuality": 0,
                "lowQuality": 0,
            }

        dofollow = sum(1 for bl in backlinks if bl.is_dofollow)
        ratings = [bl.domain_rating for bl in backlinks if bl.domain_rating is not None]
        avg_dr = round(sum(ratings) / len(ratings), 1) if ratings else 0

        high = sum(1 for r in ratings if r >= 50)
        medium = sum(1 for r in ratings if 20 <= r < 50)
        low = sum(1 for r in ratings if r < 20)

        return {
            "total": len(backlinks),
            "dofollow": dofollow,
            "nofollow": len(backlinks) - dofollow,
            "avgDomainRating": avg_dr,
            "highQuality": high,
            "mediumQuality": medium,
            "lowQuality": low,
        }

    @staticmethod
    def _metrics_to_dict(
        metrics: Optional[DomainMetrics],
        fallback_domain: str = "",
    ) -> dict[str, Any]:
        """Convert DomainMetrics to audit-data.json compatible dict."""
        if metrics is None:
            return {
                "domain": fallback_domain,
                "domainRating": None,
                "organicTraffic": None,
                "organicKeywords": None,
                "referringDomains": None,
                "totalBacklinks": None,
                "trafficValue": None,
                "source": "dataforseo",
            }
        return {
            "domain": metrics.domain,
            "domainRating": metrics.domain_rating,
            "organicTraffic": metrics.organic_traffic,
            "organicKeywords": metrics.organic_keywords,
            "referringDomains": metrics.referring_domains,
            "totalBacklinks": metrics.backlinks,
            "trafficValue": metrics.traffic_value,
            "source": metrics.source or "dataforseo",
        }

    @staticmethod
    def _backlink_to_dict(bl: BacklinkRecord) -> dict[str, Any]:
        """Convert BacklinkRecord to audit-data.json compatible dict."""
        return {
            "sourceUrl": bl.source_url,
            "targetUrl": bl.target_url,
            "anchorText": bl.anchor_text,
            "domainRating": bl.domain_rating,
            "isDofollow": bl.is_dofollow,
            "firstSeen": bl.first_seen.isoformat() if bl.first_seen else None,
            "source": bl.source or "dataforseo",
        }
