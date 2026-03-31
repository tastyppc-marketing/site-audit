"""Deep Competitor Analysis (P5).

Discovers competitors, computes keyword overlap matrices, identifies content
gaps, tracks SERP feature ownership, detects tech stacks, and generates a
strategic comparison report.

Outputs to ``competitorAnalysis`` key in audit-data.json, consumed by
competitors.html in the multi-page report.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from typing import Any, Optional
from urllib.parse import urlparse

import structlog

from audit_platform.connectors.dataforseo import DataForSEOConnector
from audit_platform.models.seo import DomainMetrics


class CompetitorAnalyzer:
    """Full competitor analysis pipeline."""

    def __init__(self, connector: DataForSEOConnector) -> None:
        self.connector = connector
        self.log = structlog.get_logger(self.__class__.__name__)

    def discover_competitors(
        self,
        target: str,
        manual_competitors: list[str] | None = None,
        max_competitors: int = 10,
    ) -> list[dict[str, Any]]:
        """Discover competitors via organic overlap + backlinks + manual list.

        Merges three sources, deduplicates, and ranks by combined score.
        """
        seen: dict[str, dict[str, Any]] = {}

        # Source 1: Organic keyword overlap competitors
        try:
            organic = self.connector.get_organic_competitors(target, limit=20)
            for comp in organic:
                domain = self._norm_domain(comp.get("domain", ""))
                if domain and domain != self._norm_domain(target):
                    seen.setdefault(domain, {"domain": domain, "organicOverlap": 0, "backlinkOverlap": 0, "manual": False})
                    seen[domain]["organicOverlap"] = comp.get("intersections") or comp.get("organicKeywords") or 0
        except Exception as exc:
            self.log.warning("organic_competitor_discovery_failed", error=str(exc))

        # Source 2: Backlink competitors
        try:
            backlink_comps = self.connector.get_competitors(target, limit=20)
            for comp in backlink_comps:
                domain = self._norm_domain(comp.domain)
                if domain and domain != self._norm_domain(target):
                    seen.setdefault(domain, {"domain": domain, "organicOverlap": 0, "backlinkOverlap": 0, "manual": False})
                    seen[domain]["backlinkOverlap"] = comp.referring_domains or 0
        except Exception as exc:
            self.log.warning("backlink_competitor_discovery_failed", error=str(exc))

        # Source 3: Manual list
        for comp_domain in (manual_competitors or []):
            domain = self._norm_domain(comp_domain)
            if domain:
                seen.setdefault(domain, {"domain": domain, "organicOverlap": 0, "backlinkOverlap": 0, "manual": False})
                seen[domain]["manual"] = True

        # Score and rank
        competitors = list(seen.values())
        for comp in competitors:
            comp["score"] = (
                min(comp["organicOverlap"], 100) * 0.6 +
                min(comp["backlinkOverlap"], 100) * 0.3 +
                (10 if comp["manual"] else 0)
            )

        competitors.sort(key=lambda c: c["score"], reverse=True)

        self.log.info(
            "competitors_discovered",
            target=target,
            total=len(competitors),
        )

        return competitors[:max_competitors]

    def analyze_keyword_overlap(
        self,
        target: str,
        competitor_domains: list[str],
    ) -> dict[str, Any]:
        """Build keyword overlap matrix using Jaccard similarity.

        Returns overlap stats for each competitor pair + gap lists.
        """
        self.log.info("keyword_overlap_start", target=target, competitors=len(competitor_domains))

        # Fetch ranked keywords for client
        client_keywords = self._fetch_keyword_set(target)

        # Fetch ranked keywords for each competitor
        competitor_keywords: dict[str, set[str]] = {}
        for comp in competitor_domains:
            competitor_keywords[comp] = self._fetch_keyword_set(comp)

        # Build overlap matrix
        all_domains = [target] + competitor_domains
        matrix: list[dict[str, Any]] = []

        for i, d1 in enumerate(all_domains):
            kw1 = client_keywords if d1 == target else competitor_keywords.get(d1, set())
            row: dict[str, Any] = {"domain": d1}
            for j, d2 in enumerate(all_domains):
                kw2 = client_keywords if d2 == target else competitor_keywords.get(d2, set())
                if i == j:
                    row[d2] = 1.0
                else:
                    union = kw1 | kw2
                    intersection = kw1 & kw2
                    jaccard = round(len(intersection) / len(union), 3) if union else 0
                    row[d2] = jaccard
            matrix.append(row)

        # Keyword gaps: competitor has, client doesn't
        gaps: list[dict[str, Any]] = []
        for comp_domain, comp_kws in competitor_keywords.items():
            missing = comp_kws - client_keywords
            for kw in sorted(missing)[:50]:
                gaps.append({"keyword": kw, "competitorDomain": comp_domain})

        # Client-only keywords
        all_competitor_kws = set()
        for kws in competitor_keywords.values():
            all_competitor_kws |= kws
        client_only = client_keywords - all_competitor_kws

        summary = {
            "clientKeywords": len(client_keywords),
            "gapKeywords": len(gaps),
            "clientOnlyKeywords": len(client_only),
            "sharedKeywords": len(client_keywords & all_competitor_kws),
        }

        self.log.info(
            "keyword_overlap_complete",
            client_kws=len(client_keywords),
            gaps=len(gaps),
        )

        return {
            "summary": summary,
            "overlapMatrix": matrix,
            "keywordGaps": gaps[:100],
            "clientOnlyKeywords": sorted(client_only)[:50],
        }

    def analyze_serp_features(
        self,
        target: str,
        competitor_domains: list[str],
        keywords: list[str],
    ) -> dict[str, Any]:
        """Track SERP feature ownership per keyword across competitors.

        For each keyword, queries the SERP and identifies which domain
        owns which features (featured snippet, PAA, local pack, etc.).
        """
        self.log.info("serp_features_start", keywords=len(keywords))

        all_domains = {self._norm_domain(target)} | {self._norm_domain(d) for d in competitor_domains}
        ownership: list[dict[str, Any]] = []
        feature_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

        for keyword in keywords[:25]:  # Cap to avoid excessive API calls
            try:
                serp_items = self.connector.get_serp(keyword)
            except Exception as exc:
                self.log.warning("serp_fetch_failed", keyword=keyword, error=str(exc))
                continue

            kw_features: dict[str, str] = {}
            for item in serp_items:
                item_type = item.get("type", "organic")
                item_domain = self._norm_domain(item.get("domain", ""))

                if item_domain in all_domains and item_type != "organic":
                    kw_features[item_type] = item_domain
                    feature_counts[item_domain][item_type] += 1

            if kw_features:
                ownership.append({"keyword": keyword, "features": kw_features})

        # Build summary per domain
        domain_summaries: list[dict[str, Any]] = []
        for domain in sorted(all_domains):
            counts = feature_counts.get(domain, {})
            domain_summaries.append({
                "domain": domain,
                "featuredSnippets": counts.get("featured_snippet", 0),
                "peopleAlsoAsk": counts.get("people_also_ask", 0),
                "localPack": counts.get("local_pack", 0),
                "imagePack": counts.get("image_pack", 0),
                "video": counts.get("video", 0),
                "knowledgeGraph": counts.get("knowledge_graph", 0),
                "totalFeatures": sum(counts.values()),
            })

        return {
            "perKeyword": ownership,
            "perDomain": domain_summaries,
        }

    def detect_tech_stack(
        self,
        domains: list[str],
    ) -> list[dict[str, Any]]:
        """Detect technology stack for each domain via HTTP signals.

        Uses header/HTML pattern matching (no external dependency).
        Falls back gracefully if requests fail.
        """
        self.log.info("tech_stack_detection_start", domains=len(domains))
        results: list[dict[str, Any]] = []

        for domain in domains:
            techs = self._detect_from_headers(domain)
            results.append({
                "domain": domain,
                "technologies": techs,
            })

        return results

    def generate_strategy_report(
        self,
        target: str,
        competitor_domains: list[str],
        keyword_overlap: dict[str, Any] | None = None,
        serp_features: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Generate prioritized strategic recommendations.

        Aggregates findings from all competitor analyses into actionable items.
        """
        findings: list[dict[str, Any]] = []

        if keyword_overlap:
            gap_count = keyword_overlap.get("summary", {}).get("gapKeywords", 0)
            if gap_count > 0:
                findings.append({
                    "finding": f"Competitors rank for {gap_count} keywords you don't",
                    "action": "Create content targeting the top keyword gaps identified in the overlap analysis",
                    "impact": "high",
                    "effort": "medium",
                    "priority": 90,
                })

            shared = keyword_overlap.get("summary", {}).get("sharedKeywords", 0)
            client_total = keyword_overlap.get("summary", {}).get("clientKeywords", 0)
            if client_total > 0 and shared / max(client_total, 1) < 0.3:
                findings.append({
                    "finding": "Low keyword overlap with competitors — possible positioning gap",
                    "action": "Review if target keywords align with market demand",
                    "impact": "medium",
                    "effort": "low",
                    "priority": 60,
                })

        if serp_features:
            target_norm = self._norm_domain(target)
            for ds in serp_features.get("perDomain", []):
                if ds["domain"] == target_norm and ds["totalFeatures"] == 0:
                    findings.append({
                        "finding": "You own zero SERP features (featured snippets, PAA, local pack)",
                        "action": "Add FAQ schema, structured data, and long-form content to win SERP features",
                        "impact": "high",
                        "effort": "medium",
                        "priority": 85,
                    })
                    break

            # Check if competitors dominate features
            for ds in serp_features.get("perDomain", []):
                if ds["domain"] != target_norm and ds["featuredSnippets"] >= 3:
                    findings.append({
                        "finding": f"{ds['domain']} owns {ds['featuredSnippets']} featured snippets",
                        "action": f"Target the same keywords with better-structured content to steal featured snippets from {ds['domain']}",
                        "impact": "high",
                        "effort": "high",
                        "priority": 75,
                    })

        findings.sort(key=lambda f: f["priority"], reverse=True)
        return findings

    # ------------------------------------------------------------------
    # Full analysis pipeline
    # ------------------------------------------------------------------

    def analyze(
        self,
        target: str,
        competitor_domains: list[str] | None = None,
        keywords: list[str] | None = None,
        include_tech_stack: bool = True,
        include_serp_features: bool = True,
    ) -> dict[str, Any]:
        """Run the full competitor analysis pipeline.

        Args:
            target: Client domain.
            competitor_domains: Known competitors. If None, auto-discovers.
            keywords: Keywords to check SERP features for.
            include_tech_stack: Whether to detect tech stacks.
            include_serp_features: Whether to analyze SERP features.

        Returns:
            Dict for ``competitorAnalysis`` key in audit-data.json.
        """
        self.log.info("competitor_analysis_start", target=target)

        # Step 1: Discover competitors if not provided
        if not competitor_domains:
            discovered = self.discover_competitors(target)
            competitor_domains = [c["domain"] for c in discovered]
        else:
            discovered = [{"domain": d, "manual": True} for d in competitor_domains]

        if not competitor_domains:
            self.log.warning("no_competitors_found", target=target)
            return {"competitors": [], "keywordOverlap": {}, "serpFeatures": {}, "techStack": [], "strategy": []}

        # Step 2: Keyword overlap matrix
        keyword_overlap = {}
        try:
            keyword_overlap = self.analyze_keyword_overlap(target, competitor_domains)
        except Exception as exc:
            self.log.warning("keyword_overlap_failed", error=str(exc))

        # Step 3: SERP feature ownership
        serp_feature_data = {}
        if include_serp_features and keywords:
            try:
                serp_feature_data = self.analyze_serp_features(target, competitor_domains, keywords)
            except Exception as exc:
                self.log.warning("serp_features_failed", error=str(exc))

        # Step 4: Tech stack detection
        tech_stack = []
        if include_tech_stack:
            try:
                all_domains = [target] + competitor_domains
                tech_stack = self.detect_tech_stack(all_domains)
            except Exception as exc:
                self.log.warning("tech_stack_failed", error=str(exc))

        # Step 5: Strategy report
        strategy = self.generate_strategy_report(
            target, competitor_domains, keyword_overlap, serp_feature_data
        )

        self.log.info(
            "competitor_analysis_complete",
            target=target,
            competitors=len(competitor_domains),
            gaps=keyword_overlap.get("summary", {}).get("gapKeywords", 0),
            strategy_items=len(strategy),
        )

        return {
            "discoveredCompetitors": discovered,
            "keywordOverlap": keyword_overlap,
            "serpFeatures": serp_feature_data,
            "techStack": tech_stack,
            "strategy": strategy,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _fetch_keyword_set(self, domain: str) -> set[str]:
        """Fetch the set of keywords a domain ranks for."""
        try:
            items = self.connector.get_organic_keywords(domain, limit=1000)
            return {item["keyword"].lower().strip() for item in items if item.get("keyword")}
        except Exception as exc:
            self.log.warning("keyword_set_fetch_failed", domain=domain, error=str(exc))
            return set()

    @staticmethod
    def _norm_domain(domain: str) -> str:
        """Normalize domain for comparison."""
        if not domain:
            return ""
        domain = domain.lower().strip()
        if "://" in domain:
            try:
                domain = urlparse(domain).hostname or domain
            except Exception:
                pass
        if domain.startswith("www."):
            domain = domain[4:]
        return domain

    def _detect_from_headers(self, domain: str) -> list[dict[str, str]]:
        """Detect tech stack from HTTP headers and HTML patterns.

        This is a lightweight detection that doesn't require wappalyzer.
        Checks response headers and common HTML signatures.
        """
        # We use the connector's HTTP client for a simple GET
        techs: list[dict[str, str]] = []
        url = f"https://{domain}"

        try:
            import httpx
            with httpx.Client(timeout=10, follow_redirects=True, verify=False) as client:
                resp = client.get(url)

            headers = resp.headers
            body = resp.text[:20000]  # Only need first 20KB

            # Server
            server = headers.get("server", "")
            if server:
                techs.append({"name": server.split("/")[0], "category": "Web Server", "version": server})

            # CMS detection
            if "x-powered-by" in headers:
                powered = headers["x-powered-by"]
                techs.append({"name": powered.split("/")[0], "category": "Framework", "version": powered})

            # WordPress
            if "/wp-content/" in body or "/wp-includes/" in body:
                techs.append({"name": "WordPress", "category": "CMS"})

            # Next.js
            if "__NEXT_DATA__" in body or "x-nextjs" in headers.get("x-powered-by", "").lower():
                techs.append({"name": "Next.js", "category": "Framework"})

            # React
            if "__REACT" in body or "data-reactroot" in body:
                techs.append({"name": "React", "category": "JavaScript Framework"})

            # Google Analytics / GTM
            if "gtag(" in body or "google-analytics.com" in body or "googletagmanager.com" in body:
                techs.append({"name": "Google Analytics", "category": "Analytics"})
            if "googletagmanager.com/gtm.js" in body:
                techs.append({"name": "Google Tag Manager", "category": "Tag Manager"})

            # Schema.org
            if 'application/ld+json' in body:
                techs.append({"name": "Schema.org JSON-LD", "category": "Structured Data"})

            # CDN detection
            cdn_headers = {
                "cf-ray": "Cloudflare",
                "x-amz-cf-id": "Amazon CloudFront",
                "x-cache": "CDN (generic)",
                "x-fastly-request-id": "Fastly",
                "x-served-by": "Varnish",
            }
            for header_key, cdn_name in cdn_headers.items():
                if header_key in headers:
                    techs.append({"name": cdn_name, "category": "CDN"})
                    break

            # IDX/real estate platforms
            idx_signals = {
                "Sierra Interactive": ["sierrainteractive", "sierra-interactive"],
                "kvCORE": ["kvcore", "kv-core"],
                "BoomTown": ["boomtownroi", "boomtown"],
                "Chime": ["chime.me", "chimeinc"],
                "Luxury Presence": ["luxurypresence"],
                "Placester": ["placester"],
            }
            for platform, signals in idx_signals.items():
                if any(s in body.lower() or s in str(headers).lower() for s in signals):
                    techs.append({"name": platform, "category": "IDX Platform"})
                    break

        except Exception as exc:
            self.log.warning("tech_detection_failed", domain=domain, error=str(exc))

        return techs
