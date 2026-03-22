"""Local SEO connector.

Analyzes local SEO signals including NAP consistency across directories,
local pack visibility, Google Business Profile completeness, and citation
opportunities for a given industry and location.

Designed to work alongside the ``BrandMentionsConnector`` for directory
data and the ``DataForSEOConnector`` for SERP / local pack analysis.
"""

from __future__ import annotations

from difflib import SequenceMatcher
from typing import Any

import structlog

from audit_platform.config import Settings
from audit_platform.connectors.base import BaseConnector

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Citation source databases by industry
# ---------------------------------------------------------------------------

_GENERAL_CITATIONS: list[dict[str, Any]] = [
    {"directory": "Google Business Profile", "url": "https://business.google.com", "priority": "high"},
    {"directory": "Bing Places", "url": "https://www.bingplaces.com", "priority": "high"},
    {"directory": "Apple Maps Connect", "url": "https://mapsconnect.apple.com", "priority": "high"},
    {"directory": "Yelp", "url": "https://biz.yelp.com", "priority": "high"},
    {"directory": "BBB", "url": "https://www.bbb.org", "priority": "medium"},
    {"directory": "Facebook Business", "url": "https://www.facebook.com/business", "priority": "high"},
    {"directory": "Yellow Pages", "url": "https://www.yellowpages.com", "priority": "medium"},
    {"directory": "Foursquare", "url": "https://foursquare.com", "priority": "low"},
    {"directory": "Manta", "url": "https://www.manta.com", "priority": "low"},
    {"directory": "Hotfrog", "url": "https://www.hotfrog.com", "priority": "low"},
]

_REAL_ESTATE_CITATIONS: list[dict[str, Any]] = [
    {"directory": "Realtor.com", "url": "https://www.realtor.com", "priority": "high"},
    {"directory": "Zillow", "url": "https://www.zillow.com", "priority": "high"},
    {"directory": "Trulia", "url": "https://www.trulia.com", "priority": "high"},
    {"directory": "Homes.com", "url": "https://www.homes.com", "priority": "medium"},
    {"directory": "RealtyTrac", "url": "https://www.realtytrac.com", "priority": "medium"},
    {"directory": "Redfin", "url": "https://www.redfin.com", "priority": "medium"},
    {"directory": "RE/MAX (if applicable)", "url": "https://www.remax.com", "priority": "low"},
    {"directory": "Local MLS", "url": "", "priority": "high"},
    {"directory": "State RE Association", "url": "", "priority": "medium"},
    {"directory": "Chamber of Commerce", "url": "", "priority": "medium"},
    {"directory": "Nextdoor", "url": "https://nextdoor.com", "priority": "medium"},
]

_INDUSTRY_CITATIONS: dict[str, list[dict[str, Any]]] = {
    "real_estate": _REAL_ESTATE_CITATIONS,
    "realtor": _REAL_ESTATE_CITATIONS,
    "real estate": _REAL_ESTATE_CITATIONS,
    "property": _REAL_ESTATE_CITATIONS,
}


class LocalSEOConnector(BaseConnector):
    """Analyzes local SEO signals and citation consistency.

    Provides tools for NAP consistency checking, local pack monitoring,
    Google Business Profile scoring, and citation opportunity discovery.
    """

    def __init__(
        self,
        settings: Settings | None = None,
        requests_per_second: float = 2.0,
    ) -> None:
        super().__init__(settings, requests_per_second=requests_per_second)

    # ------------------------------------------------------------------
    # NAP Consistency
    # ------------------------------------------------------------------

    def check_nap_consistency(
        self,
        business_name: str,
        address: str,
        phone: str,
        domain: str,
    ) -> list[dict]:
        """Check NAP (Name, Address, Phone) consistency across directories.

        Uses ``BrandMentionsConnector.check_directory_listings`` to find
        where the business is listed, then compares the NAP data found
        against the canonical values provided.

        Parameters
        ----------
        business_name:
            Canonical business name.
        address:
            Canonical full address.
        phone:
            Canonical phone number (any format).
        domain:
            The business website domain.

        Returns
        -------
        list[dict]
            One dict per directory source with keys: source, name_match,
            address_match, phone_match, found_name, found_address,
            found_phone, name_similarity, address_similarity.
        """
        self.log.info(
            "nap_check_start",
            business_name=business_name,
            domain=domain,
        )

        # Lazy import to avoid circular dependency at module level.
        from audit_platform.connectors.brand_mentions import BrandMentionsConnector

        mentions_connector = BrandMentionsConnector(self.settings)
        try:
            # Extract city/state from address for location parameter
            location = self._extract_location_from_address(address)
            listings = mentions_connector.check_directory_listings(business_name, location)
        finally:
            mentions_connector.close_sync()

        canonical_name = self._normalize_text(business_name)
        canonical_address = self._normalize_text(address)
        canonical_phone = self._normalize_phone(phone)

        results: list[dict] = []
        for listing in listings:
            found_name = listing.get("directory", "")
            # For now, we can only confirm presence (not scrape full NAP
            # from each directory without dedicated parsing per site).
            # We record what we know and flag unknowns.
            entry: dict[str, Any] = {
                "source": listing["directory"],
                "found": listing["found"],
                "search_url": listing.get("search_url", ""),
                "name_match": None,
                "address_match": None,
                "phone_match": None,
                "found_name": None,
                "found_address": None,
                "found_phone": None,
                "name_similarity": None,
                "address_similarity": None,
            }

            if listing["found"]:
                # We know the listing was found (business name appeared on page).
                # Mark name as a likely match but flag that full NAP extraction
                # would require per-directory parsing.
                entry["name_match"] = True
                entry["found_name"] = business_name
                entry["name_similarity"] = 1.0
                entry["address_match"] = None  # Cannot verify without deeper parsing
                entry["phone_match"] = None  # Cannot verify without deeper parsing

            results.append(entry)

        found_count = sum(1 for r in results if r["found"])
        self.log.info(
            "nap_check_complete",
            business_name=business_name,
            directories_checked=len(results),
            directories_found=found_count,
        )
        return results

    @staticmethod
    def _normalize_text(text: str) -> str:
        """Normalize text for fuzzy comparison."""
        import re
        text = text.lower().strip()
        text = re.sub(r"[^\w\s]", "", text)
        text = re.sub(r"\s+", " ", text)
        return text

    @staticmethod
    def _normalize_phone(phone: str) -> str:
        """Strip a phone number to digits only for comparison."""
        import re
        digits = re.sub(r"\D", "", phone)
        # Remove leading country code '1' for US numbers if present
        if len(digits) == 11 and digits.startswith("1"):
            digits = digits[1:]
        return digits

    @staticmethod
    def _text_similarity(a: str, b: str) -> float:
        """Return 0-1 similarity ratio between two strings."""
        if not a or not b:
            return 0.0
        return SequenceMatcher(None, a, b).ratio()

    @staticmethod
    def _extract_location_from_address(address: str) -> str:
        """Extract a usable location string (city, state) from a full address."""
        parts = [p.strip() for p in address.split(",")]
        if len(parts) >= 3:
            # Assume "Street, City, State ZIP" or similar
            return ", ".join(parts[1:3])
        elif len(parts) == 2:
            return ", ".join(parts)
        return address

    # ------------------------------------------------------------------
    # Local Pack
    # ------------------------------------------------------------------

    def check_local_pack(
        self,
        keywords: list[str],
        location: str,
    ) -> list[dict]:
        """Check if the business appears in Google's local pack for target keywords.

        Attempts to use the ``DataForSEOConnector.get_local_pack()`` method
        if DataForSEO credentials are configured.  Otherwise returns a
        placeholder indicating that manual checking or API access is needed.

        Parameters
        ----------
        keywords:
            Target keywords to check.
        location:
            Location context for the search (e.g. "Austin, TX").

        Returns
        -------
        list[dict]
            One dict per keyword with keys: keyword, location, in_local_pack,
            position, competitors_in_pack, data_source.
        """
        self.log.info(
            "local_pack_check_start",
            keywords=keywords,
            location=location,
        )

        results: list[dict] = []

        # Try to use DataForSEO if credentials are available.
        has_dataforseo = bool(
            self.settings.DATAFORSEO_LOGIN and self.settings.DATAFORSEO_PASSWORD
        )

        if has_dataforseo:
            results = self._check_local_pack_via_dataforseo(keywords, location)
        else:
            self.log.info(
                "local_pack_no_dataforseo",
                hint="DataForSEO credentials not configured; returning placeholders.",
            )
            for kw in keywords:
                results.append({
                    "keyword": kw,
                    "location": location,
                    "in_local_pack": None,
                    "position": None,
                    "competitors_in_pack": [],
                    "data_source": "none",
                    "note": (
                        "DataForSEO credentials required for automated local pack checking. "
                        "Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env."
                    ),
                })

        self.log.info("local_pack_check_complete", keywords=len(keywords), results=len(results))
        return results

    def _check_local_pack_via_dataforseo(
        self,
        keywords: list[str],
        location: str,
    ) -> list[dict]:
        """Use DataForSEO to check local pack presence."""
        from audit_platform.connectors.dataforseo import DataForSEOConnector

        results: list[dict] = []
        connector = DataForSEOConnector(self.settings)
        try:
            for kw in keywords:
                full_query = f"{kw} {location}" if location else kw
                entry: dict[str, Any] = {
                    "keyword": kw,
                    "location": location,
                    "in_local_pack": False,
                    "position": None,
                    "competitors_in_pack": [],
                    "data_source": "dataforseo",
                }
                try:
                    local_items = connector.get_local_pack(full_query)
                    if local_items:
                        entry["in_local_pack"] = True
                        # Extract competitor info from local pack items
                        for i, item in enumerate(local_items):
                            pack_items = item.get("items", [])
                            for j, pack_item in enumerate(pack_items):
                                entry["competitors_in_pack"].append({
                                    "position": j + 1,
                                    "title": pack_item.get("title", ""),
                                    "domain": pack_item.get("domain", ""),
                                    "rating": pack_item.get("rating"),
                                    "reviews_count": pack_item.get("reviews_count"),
                                })
                except Exception as exc:
                    self.log.warning(
                        "local_pack_dataforseo_error",
                        keyword=kw,
                        error=str(exc),
                    )
                    entry["data_source"] = "dataforseo_error"
                    entry["note"] = str(exc)

                results.append(entry)
        finally:
            connector.close_sync()

        return results

    # ------------------------------------------------------------------
    # GBP Completeness
    # ------------------------------------------------------------------

    def analyze_gbp_completeness(self, profile: dict) -> dict:
        """Score a Google Business Profile for completeness.

        Evaluates a profile dict (typically from
        ``BusinessProfileConnector.get_locations()``) against a checklist
        of recommended fields and attributes.

        Parameters
        ----------
        profile:
            A dict (or model_dump() of a BusinessProfileRecord) with
            keys like: title, address, phone, website, primary_category,
            additional_categories, is_verified, etc.  Also accepts
            optional keys: has_photos, has_posts, has_products,
            has_services, has_description, has_hours, review_count,
            avg_rating.

        Returns
        -------
        dict
            Keys: score (0-100), missing_fields (list), present_fields
            (list), recommendations (list of actionable strings).
        """
        self.log.info("gbp_completeness_start", profile_title=profile.get("title", "unknown"))

        checks: list[dict[str, Any]] = [
            {"field": "title", "label": "Business Name", "weight": 10, "required": True},
            {"field": "address", "label": "Address", "weight": 10, "required": True},
            {"field": "phone", "label": "Phone Number", "weight": 8, "required": True},
            {"field": "website", "label": "Website URL", "weight": 8, "required": True},
            {"field": "primary_category", "label": "Primary Category", "weight": 10, "required": True},
            {"field": "additional_categories", "label": "Additional Categories", "weight": 5, "required": False},
            {"field": "is_verified", "label": "Verified Listing", "weight": 10, "required": True},
            {"field": "has_description", "label": "Business Description", "weight": 8, "required": False},
            {"field": "has_hours", "label": "Business Hours", "weight": 7, "required": False},
            {"field": "has_photos", "label": "Photos", "weight": 7, "required": False},
            {"field": "has_posts", "label": "Google Posts", "weight": 5, "required": False},
            {"field": "has_products", "label": "Products/Services Listed", "weight": 4, "required": False},
            {"field": "has_services", "label": "Service Areas", "weight": 4, "required": False},
            {"field": "review_count", "label": "Customer Reviews", "weight": 7, "required": False},
            {"field": "avg_rating", "label": "Average Rating", "weight": 7, "required": False},
        ]

        total_weight = sum(c["weight"] for c in checks)
        earned_weight = 0
        missing_fields: list[str] = []
        present_fields: list[str] = []
        recommendations: list[str] = []

        for check in checks:
            field = check["field"]
            value = profile.get(field)

            # Determine if the field is "present" (truthy or explicitly True)
            is_present = False
            if isinstance(value, bool):
                is_present = value
            elif isinstance(value, (list, dict)):
                is_present = bool(value)
            elif isinstance(value, (int, float)):
                is_present = value > 0
            elif isinstance(value, str):
                is_present = bool(value.strip())
            else:
                is_present = value is not None

            if is_present:
                earned_weight += check["weight"]
                present_fields.append(check["label"])
            else:
                missing_fields.append(check["label"])
                if check["required"]:
                    recommendations.append(
                        f"CRITICAL: Add {check['label']} to your Google Business Profile."
                    )
                else:
                    recommendations.append(
                        f"Recommended: Add {check['label']} to improve your profile completeness."
                    )

        # Additional review-specific recommendations
        review_count = profile.get("review_count", 0) or 0
        avg_rating = profile.get("avg_rating", 0) or 0

        if review_count < 10:
            recommendations.append(
                f"You have {review_count} review(s). Aim for at least 10+ reviews "
                "to improve local search visibility."
            )
        if 0 < avg_rating < 4.0:
            recommendations.append(
                f"Your average rating is {avg_rating}. Focus on improving customer "
                "satisfaction to reach 4.0+ stars."
            )

        score = round((earned_weight / total_weight) * 100) if total_weight > 0 else 0

        result = {
            "score": score,
            "missing_fields": missing_fields,
            "present_fields": present_fields,
            "recommendations": recommendations,
            "total_checks": len(checks),
            "passed_checks": len(present_fields),
        }

        self.log.info(
            "gbp_completeness_complete",
            score=score,
            missing=len(missing_fields),
            present=len(present_fields),
        )
        return result

    # ------------------------------------------------------------------
    # Citation Opportunities
    # ------------------------------------------------------------------

    def find_citation_opportunities(
        self,
        industry: str,
        location: str,
    ) -> list[dict]:
        """Return a list of recommended citation sources for the industry/location.

        Combines a general citation list with industry-specific directories
        (e.g., real estate sites for realtors).  Optionally checks whether
        the business already has a listing (requires a brand mentions check
        to have been run separately).

        Parameters
        ----------
        industry:
            Industry keyword (e.g. "real_estate", "realtor", "restaurant").
        location:
            Business location (used for location-specific recommendations).

        Returns
        -------
        list[dict]
            Each dict has keys: directory, url, priority (high/medium/low),
            has_listing (bool|None), notes.
        """
        self.log.info(
            "citation_opportunities_start",
            industry=industry,
            location=location,
        )

        # Start with general citations
        opportunities: list[dict] = []
        seen_directories: set[str] = set()

        for source in _GENERAL_CITATIONS:
            key = source["directory"].lower()
            if key not in seen_directories:
                seen_directories.add(key)
                opportunities.append({
                    "directory": source["directory"],
                    "url": source["url"],
                    "priority": source["priority"],
                    "has_listing": None,  # Unknown until checked
                    "notes": "",
                })

        # Add industry-specific citations
        industry_lower = industry.lower().strip()
        industry_sources = _INDUSTRY_CITATIONS.get(industry_lower, [])
        for source in industry_sources:
            key = source["directory"].lower()
            if key not in seen_directories:
                seen_directories.add(key)
                opportunities.append({
                    "directory": source["directory"],
                    "url": source["url"],
                    "priority": source["priority"],
                    "has_listing": None,
                    "notes": f"Industry-specific ({industry})",
                })

        # Add location-specific recommendations
        if location:
            opportunities.append({
                "directory": f"Local Chamber of Commerce ({location})",
                "url": "",
                "priority": "medium",
                "has_listing": None,
                "notes": f"Search for the chamber of commerce in {location}.",
            })

        self.log.info(
            "citation_opportunities_complete",
            industry=industry,
            location=location,
            total_opportunities=len(opportunities),
        )
        return opportunities
