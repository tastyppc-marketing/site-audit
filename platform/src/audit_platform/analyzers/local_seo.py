"""Local SEO Deep Dive Analyzer (P6).

Review sentiment analysis, competitor GBP comparison, local landing page
scoring, Maps grid ranking preparation, service area mapping.

Uses VADER for sentiment (5K stars, lexicon-based, no model download).
Uses geopy for coordinate math (4.8K stars).

Outputs to ``localSeo`` key extensions in audit-data.json, consumed by
local.html in the multi-page report.
"""

from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Any, Optional

import structlog

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer as VaderAnalyzer
    HAS_VADER = True
except ImportError:
    HAS_VADER = False

try:
    from geopy.distance import distance as geodesic_distance
    HAS_GEOPY = True
except ImportError:
    HAS_GEOPY = False


class LocalSeoAnalyzer:
    """Local SEO deep-dive analysis."""

    MIN_REVIEW_LENGTH: int = 20  # Min chars for sentiment analysis

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)
        self._vader = VaderAnalyzer() if HAS_VADER else None

    def analyze(
        self,
        reviews: list[dict[str, Any]] | None = None,
        business_profile: dict[str, Any] | None = None,
        competitor_profiles: list[dict[str, Any]] | None = None,
        crawl_pages: list[dict[str, Any]] | None = None,
        location_keywords: list[str] | None = None,
    ) -> dict[str, Any]:
        """Run full local SEO analysis.

        Args:
            reviews: GBP reviews [{comment, rating, createTime, reply}].
            business_profile: Client's GBP data.
            competitor_profiles: Competitor GBP data from DataForSEO Maps.
            crawl_pages: Crawl data pages for landing page scoring.
            location_keywords: City/area keywords for landing page checks.

        Returns:
            Dict for ``localSeo`` extensions in audit-data.json.
        """
        self.log.info("local_seo_analysis_start")

        review_sentiment = self.analyze_review_sentiment(reviews or [])
        gbp_comparison = self.compare_competitor_gbp(
            business_profile or {}, competitor_profiles or []
        )
        landing_scores = self.score_local_landing_pages(
            crawl_pages or [], business_profile or {}, location_keywords or []
        )
        service_area = self.generate_service_area_geojson(business_profile or {})

        result = {
            "reviewSentiment": review_sentiment,
            "competitorGbp": gbp_comparison,
            "landingPageScores": landing_scores,
            "serviceAreaMap": service_area,
        }

        self.log.info(
            "local_seo_analysis_complete",
            reviews_analyzed=review_sentiment["summary"]["totalReviews"],
            competitors_compared=len(gbp_comparison),
            pages_scored=len(landing_scores),
        )

        return result

    # ------------------------------------------------------------------
    # Review Sentiment Analysis
    # ------------------------------------------------------------------

    def analyze_review_sentiment(
        self, reviews: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Analyze review sentiment using VADER.

        Classifies each review as positive/negative/neutral, extracts
        keyword themes, computes reply rate and sentiment trend.
        """
        if not reviews:
            return self._empty_sentiment_summary()

        if not self._vader:
            self.log.warning("vader_not_available", msg="Install vaderSentiment for review analysis")
            return self._empty_sentiment_summary()

        analyzed: list[dict[str, Any]] = []
        positive_words: Counter[str] = Counter()
        negative_words: Counter[str] = Counter()
        total_compound = 0.0
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        replied_count = 0

        for review in reviews:
            comment = (review.get("comment") or review.get("text") or "").strip()
            rating = review.get("rating") or review.get("starRating")
            create_time = review.get("createTime") or review.get("create_time") or review.get("date")
            has_reply = bool(review.get("reply") or review.get("reviewReply"))

            if has_reply:
                replied_count += 1

            # Skip very short/empty reviews for sentiment
            if len(comment) < self.MIN_REVIEW_LENGTH:
                if rating:
                    # Use rating as proxy sentiment
                    r = int(rating) if isinstance(rating, (int, float, str)) and str(rating).isdigit() else 3
                    if r >= 4:
                        positive_count += 1
                    elif r <= 2:
                        negative_count += 1
                    else:
                        neutral_count += 1
                continue

            # VADER sentiment
            scores = self._vader.polarity_scores(comment)
            compound = scores["compound"]
            total_compound += compound

            if compound >= 0.05:
                sentiment = "positive"
                positive_count += 1
                self._extract_keywords(comment, positive_words)
            elif compound <= -0.05:
                sentiment = "negative"
                negative_count += 1
                self._extract_keywords(comment, negative_words)
            else:
                sentiment = "neutral"
                neutral_count += 1

            analyzed.append({
                "comment": comment[:200],
                "rating": rating,
                "compound": round(compound, 3),
                "sentiment": sentiment,
                "date": str(create_time) if create_time else None,
            })

        total = len(reviews)
        analyzed_count = max(positive_count + negative_count + neutral_count, 1)

        summary = {
            "totalReviews": total,
            "analyzedReviews": len(analyzed),
            "meanCompound": round(total_compound / len(analyzed), 3) if analyzed else 0,
            "pctPositive": round(positive_count / analyzed_count * 100, 1),
            "pctNegative": round(negative_count / analyzed_count * 100, 1),
            "pctNeutral": round(neutral_count / analyzed_count * 100, 1),
            "replyRate": round(replied_count / total * 100, 1) if total else 0,
            "topPositiveKeywords": [{"keyword": k, "count": c} for k, c in positive_words.most_common(10)],
            "topNegativeKeywords": [{"keyword": k, "count": c} for k, c in negative_words.most_common(10)],
        }

        return {"summary": summary, "reviews": analyzed[:50]}

    # ------------------------------------------------------------------
    # Competitor GBP Comparison
    # ------------------------------------------------------------------

    def compare_competitor_gbp(
        self,
        client_profile: dict[str, Any],
        competitor_profiles: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Build side-by-side GBP comparison table."""
        if not client_profile or not competitor_profiles:
            return []

        comparison: list[dict[str, Any]] = []

        client_entry = self._normalize_gbp_for_comparison(client_profile, is_client=True)
        comparison.append(client_entry)

        for comp in competitor_profiles:
            entry = self._normalize_gbp_for_comparison(comp, is_client=False)
            comparison.append(entry)

        return comparison

    # ------------------------------------------------------------------
    # Local Landing Page Scoring
    # ------------------------------------------------------------------

    def score_local_landing_pages(
        self,
        pages: list[dict[str, Any]],
        business_profile: dict[str, Any],
        location_keywords: list[str],
    ) -> list[dict[str, Any]]:
        """Score crawled pages for local SEO landing page quality.

        8 checks worth 100 points total.
        """
        if not pages or not location_keywords:
            return []

        results: list[dict[str, Any]] = []
        location_pattern = re.compile(
            "|".join(re.escape(kw) for kw in location_keywords),
            re.IGNORECASE,
        ) if location_keywords else None

        biz_phone = (business_profile.get("phone") or "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        biz_name = (business_profile.get("title") or business_profile.get("name") or "").lower()

        for page in pages:
            url = page.get("url", "")
            title = page.get("title") or ""
            h1_list = page.get("h1") or []
            h1_text = " ".join(h1_list) if isinstance(h1_list, list) else str(h1_list)
            description = page.get("description") or page.get("meta_description") or ""
            word_count = page.get("wordCount") or 0
            schema_types = page.get("schemaTypes") or []
            internal_links = page.get("contextualInternalLinks") or page.get("totalInternalLinks") or 0

            checks: list[dict[str, Any]] = []
            score = 0

            # 1. LocalBusiness schema (20 points)
            local_schemas = {"LocalBusiness", "RealEstateAgent", "Restaurant", "Store", "Hotel"}
            has_local_schema = bool(set(schema_types) & local_schemas)
            checks.append({"check": "LocalBusiness schema", "passed": has_local_schema, "weight": 20})
            if has_local_schema:
                score += 20

            # 2. City name in title (15 points)
            has_location_title = bool(location_pattern and location_pattern.search(title))
            checks.append({"check": "Location in title", "passed": has_location_title, "weight": 15})
            if has_location_title:
                score += 15

            # 3. City name in H1 (15 points)
            has_location_h1 = bool(location_pattern and location_pattern.search(h1_text))
            checks.append({"check": "Location in H1", "passed": has_location_h1, "weight": 15})
            if has_location_h1:
                score += 15

            # 4. NAP on page (15 points) — check if phone or business name appears
            page_text = (title + " " + h1_text + " " + description).lower()
            page_phone = page_text.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            has_nap = (biz_phone and biz_phone in page_phone) or (biz_name and biz_name in page_text)
            checks.append({"check": "NAP consistency", "passed": has_nap, "weight": 15})
            if has_nap:
                score += 15

            # 5. Location keywords in meta description (10 points)
            has_location_desc = bool(location_pattern and location_pattern.search(description))
            checks.append({"check": "Location in meta description", "passed": has_location_desc, "weight": 10})
            if has_location_desc:
                score += 10

            # 6. Embedded map (10 points)
            # Can only check if page HTML is available; approximate from page data
            has_map = False  # Would need HTML content; mark as unchecked
            checks.append({"check": "Embedded map", "passed": has_map, "weight": 10})
            if has_map:
                score += 10

            # 7. Internal links (10 points)
            has_links = internal_links >= 3
            checks.append({"check": "Internal links (≥3)", "passed": has_links, "weight": 10})
            if has_links:
                score += 10

            # 8. Minimum word count 300 (5 points)
            has_content = word_count >= 300
            checks.append({"check": "Content depth (≥300 words)", "passed": has_content, "weight": 5})
            if has_content:
                score += 5

            # Only include pages that have at least some local signals
            if has_location_title or has_location_h1 or has_local_schema:
                results.append({
                    "url": url,
                    "score": score,
                    "maxScore": 100,
                    "checks": checks,
                })

        results.sort(key=lambda r: r["score"], reverse=True)
        return results[:25]

    # ------------------------------------------------------------------
    # Service Area Map (GeoJSON)
    # ------------------------------------------------------------------

    def generate_service_area_geojson(
        self,
        business_profile: dict[str, Any],
        radius_km: float = 15.0,
        competitor_locations: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Generate GeoJSON FeatureCollection for service area map.

        Creates a circle polygon for the service area and point features
        for the business and competitors.
        """
        lat = business_profile.get("latitude")
        lng = business_profile.get("longitude")

        if not lat or not lng:
            return {"type": "FeatureCollection", "features": []}

        features: list[dict[str, Any]] = []

        # Business point
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lng, lat]},
            "properties": {
                "name": business_profile.get("title") or business_profile.get("name") or "Your Business",
                "type": "client",
                "rating": business_profile.get("rating"),
                "reviewCount": business_profile.get("reviewCount") or business_profile.get("review_count"),
            },
        })

        # Service area circle (approximated as polygon)
        circle_coords = self._generate_circle_polygon(lat, lng, radius_km)
        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [circle_coords]},
            "properties": {
                "name": "Service Area",
                "type": "service_area",
                "radiusKm": radius_km,
            },
        })

        # Competitor points
        for comp in (competitor_locations or []):
            comp_lat = comp.get("latitude")
            comp_lng = comp.get("longitude")
            if comp_lat and comp_lng:
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [comp_lng, comp_lat]},
                    "properties": {
                        "name": comp.get("title") or comp.get("name") or "Competitor",
                        "type": "competitor",
                        "rating": comp.get("rating"),
                        "reviewCount": comp.get("reviewCount") or comp.get("review_count"),
                    },
                })

        return {"type": "FeatureCollection", "features": features}

    # ------------------------------------------------------------------
    # Grid Ranking Coordinate Generation
    # ------------------------------------------------------------------

    @staticmethod
    def generate_grid_points(
        center_lat: float,
        center_lng: float,
        grid_size: int = 5,
        spacing_km: float = 1.0,
    ) -> list[tuple[float, float]]:
        """Generate NxN grid of coordinates for Maps grid ranking.

        Args:
            center_lat: Center latitude.
            center_lng: Center longitude.
            grid_size: Grid dimension (5 = 5x5 = 25 points).
            spacing_km: Distance between points in km.

        Returns:
            List of (lat, lng) tuples.
        """
        points: list[tuple[float, float]] = []

        # Degrees per km (approximation)
        lat_per_km = 1.0 / 111.32
        lng_per_km = 1.0 / (111.32 * math.cos(math.radians(center_lat)))

        half = (grid_size - 1) / 2.0

        for row in range(grid_size):
            for col in range(grid_size):
                offset_ns = (row - half) * spacing_km
                offset_ew = (col - half) * spacing_km

                point_lat = center_lat + (offset_ns * lat_per_km)
                point_lng = center_lng + (offset_ew * lng_per_km)

                points.append((round(point_lat, 7), round(point_lng, 7)))

        return points

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _extract_keywords(self, text: str, counter: Counter[str]) -> None:
        """Extract simple noun-phrase-like keywords from review text."""
        # Simple word frequency (2-3 word phrases) — avoids TextBlob dependency
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        stop_words = {
            "the", "and", "was", "were", "are", "for", "that", "this", "with",
            "they", "have", "had", "has", "from", "very", "really", "just",
            "our", "will", "been", "not", "but", "all", "can", "her", "his",
            "she", "him", "you", "your", "them", "their", "than", "about",
        }
        filtered = [w for w in words if w not in stop_words]

        # Single words
        for word in filtered:
            counter[word] += 1

        # Bigrams
        for i in range(len(filtered) - 1):
            bigram = f"{filtered[i]} {filtered[i+1]}"
            counter[bigram] += 1

    def _normalize_gbp_for_comparison(
        self, profile: dict[str, Any], is_client: bool = False
    ) -> dict[str, Any]:
        """Normalize a GBP profile dict for comparison table."""
        return {
            "name": profile.get("title") or profile.get("name") or "",
            "isClient": is_client,
            "rating": profile.get("rating"),
            "reviewCount": profile.get("reviewCount") or profile.get("review_count") or 0,
            "primaryCategory": profile.get("primaryCategory") or profile.get("primary_category") or "",
            "additionalCategories": len(profile.get("additionalCategories") or profile.get("additional_categories") or []),
            "isVerified": profile.get("isVerified") or profile.get("is_verified") or False,
            "hasWebsite": bool(profile.get("website")),
            "phone": profile.get("phone") or "",
        }

    @staticmethod
    def _generate_circle_polygon(
        lat: float, lng: float, radius_km: float, num_points: int = 32
    ) -> list[list[float]]:
        """Generate a circle polygon as a list of [lng, lat] coordinates."""
        coords: list[list[float]] = []
        lat_per_km = 1.0 / 111.32
        lng_per_km = 1.0 / (111.32 * math.cos(math.radians(lat)))

        for i in range(num_points + 1):
            angle = 2 * math.pi * i / num_points
            dlat = radius_km * math.sin(angle) * lat_per_km
            dlng = radius_km * math.cos(angle) * lng_per_km
            coords.append([round(lng + dlng, 7), round(lat + dlat, 7)])

        return coords

    @staticmethod
    def _empty_sentiment_summary() -> dict[str, Any]:
        return {
            "summary": {
                "totalReviews": 0,
                "analyzedReviews": 0,
                "meanCompound": 0,
                "pctPositive": 0,
                "pctNegative": 0,
                "pctNeutral": 0,
                "replyRate": 0,
                "topPositiveKeywords": [],
                "topNegativeKeywords": [],
            },
            "reviews": [],
        }
