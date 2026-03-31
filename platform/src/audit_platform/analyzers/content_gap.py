"""Content Gap & Topical Authority Analyzer.

Identifies keywords competitors rank for that the client doesn't (content gaps),
clusters keywords by topic for topical authority scoring, and finds unlinked
brand mentions that could become backlinks.

Outputs to ``contentGap`` and ``topicalAuthority`` keys in audit-data.json.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from typing import Any, Optional

import structlog

from audit_platform.connectors.dataforseo import DataForSEOConnector


class ContentGapAnalyzer:
    """Find content gaps and map topical authority."""

    # Stop words for topic clustering
    STOP_WORDS = frozenset({
        "the", "and", "for", "are", "but", "not", "you", "all", "can",
        "had", "her", "was", "one", "our", "out", "has", "his", "how",
        "its", "may", "new", "now", "old", "see", "way", "who", "did",
        "get", "let", "say", "she", "too", "use", "what", "with", "from",
        "that", "this", "will", "your", "about", "been", "have", "into",
        "more", "most", "much", "some", "than", "them", "then", "they",
        "very", "when", "which", "would", "best", "near",
    })

    def __init__(self, connector: Optional[DataForSEOConnector] = None) -> None:
        self.connector = connector
        self.log = structlog.get_logger(self.__class__.__name__)

    def analyze_content_gaps(
        self,
        client_keywords: list[dict[str, Any]],
        competitor_keywords: dict[str, list[dict[str, Any]]],
        min_volume: int = 50,
    ) -> dict[str, Any]:
        """Find keywords competitors rank for that client doesn't.

        Args:
            client_keywords: Client's ranked keywords [{keyword, position, volume, ...}].
            competitor_keywords: Dict of competitor domain -> keyword list.
            min_volume: Minimum search volume to include.

        Returns:
            Content gap analysis with prioritized opportunities.
        """
        self.log.info("content_gap_start", client_kws=len(client_keywords), competitors=len(competitor_keywords))

        client_kw_set = {
            (kw.get("keyword") or "").lower().strip()
            for kw in client_keywords
            if kw.get("keyword")
        }

        gaps: list[dict[str, Any]] = []
        seen_keywords: set[str] = set()

        for comp_domain, comp_kws in competitor_keywords.items():
            for kw in comp_kws:
                keyword = (kw.get("keyword") or "").lower().strip()
                if not keyword or keyword in client_kw_set or keyword in seen_keywords:
                    continue

                volume = kw.get("volume") or kw.get("search_volume") or 0
                if volume < min_volume:
                    continue

                seen_keywords.add(keyword)
                position = kw.get("position") or kw.get("rank_group") or 0
                difficulty = kw.get("difficulty") or kw.get("competition_index") or 0

                # Priority score: high volume + low difficulty + good competitor position
                priority = 0
                if volume >= 1000:
                    priority += 40
                elif volume >= 500:
                    priority += 30
                elif volume >= 100:
                    priority += 20
                else:
                    priority += 10

                if difficulty and difficulty < 30:
                    priority += 30
                elif difficulty and difficulty < 50:
                    priority += 20
                elif difficulty and difficulty < 70:
                    priority += 10

                if position and position <= 10:
                    priority += 20
                elif position and position <= 20:
                    priority += 10

                gaps.append({
                    "keyword": keyword,
                    "volume": volume,
                    "difficulty": difficulty,
                    "competitorDomain": comp_domain,
                    "competitorPosition": position,
                    "priority": min(priority, 100),
                    "url": kw.get("url") or "",
                })

        # Sort by priority
        gaps.sort(key=lambda g: g["priority"], reverse=True)

        # Categorize by intent
        informational = [g for g in gaps if self._classify_intent(g["keyword"]) == "informational"]
        commercial = [g for g in gaps if self._classify_intent(g["keyword"]) == "commercial"]
        transactional = [g for g in gaps if self._classify_intent(g["keyword"]) == "transactional"]

        summary = {
            "totalGaps": len(gaps),
            "highPriority": sum(1 for g in gaps if g["priority"] >= 60),
            "mediumPriority": sum(1 for g in gaps if 30 <= g["priority"] < 60),
            "lowPriority": sum(1 for g in gaps if g["priority"] < 30),
            "informationalGaps": len(informational),
            "commercialGaps": len(commercial),
            "transactionalGaps": len(transactional),
            "avgVolume": round(sum(g["volume"] for g in gaps) / len(gaps)) if gaps else 0,
        }

        self.log.info("content_gap_complete", gaps=len(gaps), high_priority=summary["highPriority"])

        return {
            "summary": summary,
            "gaps": gaps[:100],
            "topInformational": informational[:20],
            "topCommercial": commercial[:20],
            "topTransactional": transactional[:20],
        }

    def analyze_topical_authority(
        self,
        keywords: list[dict[str, Any]],
        pages: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Cluster keywords by topic and score coverage depth.

        Args:
            keywords: All ranked keywords for the client.
            pages: Optional crawl pages for URL-based topic mapping.

        Returns:
            Topical authority map with coverage scores per topic.
        """
        self.log.info("topical_authority_start", keywords=len(keywords))

        # Extract topic tokens from keywords
        topic_counts: Counter[str] = Counter()
        keyword_topics: dict[str, list[str]] = defaultdict(list)

        for kw in keywords:
            keyword = (kw.get("keyword") or "").lower().strip()
            if not keyword:
                continue

            tokens = self._extract_topic_tokens(keyword)
            for token in tokens:
                topic_counts[token] += 1
                keyword_topics[token].append(keyword)

        # Build topic clusters (tokens appearing 3+ times)
        clusters: list[dict[str, Any]] = []
        for topic, count in topic_counts.most_common(30):
            if count < 2:
                continue

            cluster_keywords = keyword_topics[topic]
            cluster_volumes = []
            cluster_positions = []

            for kw in keywords:
                kw_text = (kw.get("keyword") or "").lower()
                if topic in kw_text:
                    vol = kw.get("volume") or 0
                    pos = kw.get("position") or 0
                    if vol:
                        cluster_volumes.append(vol)
                    if pos:
                        cluster_positions.append(pos)

            avg_position = round(sum(cluster_positions) / len(cluster_positions), 1) if cluster_positions else 0
            total_volume = sum(cluster_volumes)

            # Coverage depth score: more keywords + better positions = stronger authority
            depth_score = min(count * 10, 50)  # Up to 50 for keyword count
            if avg_position and avg_position <= 10:
                depth_score += 30
            elif avg_position and avg_position <= 20:
                depth_score += 15
            if total_volume >= 5000:
                depth_score += 20
            elif total_volume >= 1000:
                depth_score += 10

            depth_score = min(depth_score, 100)

            clusters.append({
                "topic": topic,
                "keywordCount": count,
                "keywords": sorted(set(cluster_keywords))[:10],
                "totalVolume": total_volume,
                "avgPosition": avg_position,
                "depthScore": depth_score,
            })

        clusters.sort(key=lambda c: c["depthScore"], reverse=True)

        # URL-based topic mapping if pages provided
        url_topics: list[dict[str, Any]] = []
        if pages:
            for page in pages[:100]:
                url = page.get("url") or ""
                path_tokens = self._extract_topic_tokens(url.split("/")[-1].replace("-", " "))
                matching_clusters = [c["topic"] for c in clusters if c["topic"] in path_tokens]
                if matching_clusters:
                    url_topics.append({
                        "url": url,
                        "topics": matching_clusters[:3],
                        "wordCount": page.get("wordCount") or 0,
                    })

        summary = {
            "totalTopics": len(clusters),
            "strongTopics": sum(1 for c in clusters if c["depthScore"] >= 60),
            "moderateTopics": sum(1 for c in clusters if 30 <= c["depthScore"] < 60),
            "weakTopics": sum(1 for c in clusters if c["depthScore"] < 30),
        }

        self.log.info("topical_authority_complete", topics=len(clusters), strong=summary["strongTopics"])

        return {
            "summary": summary,
            "clusters": clusters[:20],
            "urlTopicMap": url_topics[:30],
        }

    def find_unlinked_mentions(
        self,
        brand_mentions: list[dict[str, Any]],
        existing_backlink_domains: set[str],
    ) -> list[dict[str, Any]]:
        """Find brand mentions on sites that don't link to us.

        Cross-references brand mentions (from BrandMentionsConnector)
        with existing backlink referring domains to find link opportunities.
        """
        self.log.info(
            "unlinked_mentions_start",
            mentions=len(brand_mentions),
            existing_backlinks=len(existing_backlink_domains),
        )

        opportunities: list[dict[str, Any]] = []
        norm_backlinks = {d.lower().strip() for d in existing_backlink_domains}

        for mention in brand_mentions:
            source = (mention.get("source") or mention.get("url") or mention.get("domain") or "").lower()
            domain = self._extract_domain(source)

            if not domain or domain in norm_backlinks:
                continue

            opportunities.append({
                "domain": domain,
                "sourceUrl": mention.get("url") or source,
                "context": mention.get("snippet") or mention.get("title") or "",
                "platform": mention.get("platform") or mention.get("source_type") or "web",
                "recommendation": f"Site mentions your brand but doesn't link. Reach out to request a backlink.",
            })

        # Dedupe by domain
        seen: set[str] = set()
        deduped: list[dict[str, Any]] = []
        for opp in opportunities:
            if opp["domain"] not in seen:
                seen.add(opp["domain"])
                deduped.append(opp)

        self.log.info("unlinked_mentions_complete", opportunities=len(deduped))
        return deduped

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _classify_intent(keyword: str) -> str:
        """Classify search intent of a keyword."""
        kw = keyword.lower()

        transactional_signals = ["buy", "price", "cost", "cheap", "deal", "discount",
                                  "for sale", "purchase", "order", "shop"]
        commercial_signals = ["best", "top", "review", "compare", "vs", "alternative",
                              "recommended", "rated"]
        informational_signals = ["how to", "what is", "guide", "tutorial", "tips",
                                 "ideas", "examples", "definition", "meaning"]

        # Check informational FIRST (e.g., "how to buy" is informational, not transactional)
        for signal in informational_signals:
            if signal in kw:
                return "informational"
        for signal in transactional_signals:
            if signal in kw:
                return "transactional"
        for signal in commercial_signals:
            if signal in kw:
                return "commercial"

        # Default: if it contains a location, likely transactional
        if re.search(r'\b(near me|in \w+|for sale)\b', kw):
            return "transactional"

        return "informational"

    def _extract_topic_tokens(self, text: str) -> set[str]:
        """Extract meaningful topic tokens from text."""
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        return {w for w in words if w not in self.STOP_WORDS and len(w) >= 4}

    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract domain from URL."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url if "://" in url else f"https://{url}")
            host = parsed.hostname or url
            if host.startswith("www."):
                host = host[4:]
            return host.lower()
        except Exception:
            return ""
