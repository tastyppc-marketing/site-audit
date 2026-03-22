"""Social media audit connector.

Audits social media presence and activity by checking common URL patterns
for major platforms, scraping the target website for social links, and
scoring the overall social media posture.

All HTTP requests go through the inherited ``sync_client`` (httpx).
Sites that block automated requests are handled gracefully.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote_plus, urlparse

import httpx
import structlog

from audit_platform.config import Settings
from audit_platform.connectors.base import BaseConnector

logger = structlog.get_logger(__name__)

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

_DEFAULT_HEADERS: dict[str, str] = {
    "User-Agent": _USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Social platforms and their URL patterns.
# {name} will be replaced with various name permutations.
_SOCIAL_PLATFORMS: list[dict[str, str]] = [
    {"platform": "Facebook", "url_template": "https://www.facebook.com/{name}"},
    {"platform": "Instagram", "url_template": "https://www.instagram.com/{name}"},
    {"platform": "YouTube", "url_template": "https://www.youtube.com/@{name}"},
    {"platform": "LinkedIn", "url_template": "https://www.linkedin.com/company/{name}"},
    {"platform": "X (Twitter)", "url_template": "https://x.com/{name}"},
    {"platform": "TikTok", "url_template": "https://www.tiktok.com/@{name}"},
    {"platform": "Pinterest", "url_template": "https://www.pinterest.com/{name}"},
]

# Patterns used to find social links in HTML source.
_SOCIAL_LINK_PATTERNS: dict[str, re.Pattern[str]] = {
    "Facebook": re.compile(r'https?://(?:www\.)?facebook\.com/[A-Za-z0-9._%-]+', re.IGNORECASE),
    "Instagram": re.compile(r'https?://(?:www\.)?instagram\.com/[A-Za-z0-9._%-]+', re.IGNORECASE),
    "YouTube": re.compile(r'https?://(?:www\.)?youtube\.com/(?:@|channel/|c/|user/)[A-Za-z0-9._%-]+', re.IGNORECASE),
    "LinkedIn": re.compile(r'https?://(?:www\.)?linkedin\.com/(?:company|in)/[A-Za-z0-9._%-]+', re.IGNORECASE),
    "X (Twitter)": re.compile(r'https?://(?:www\.)?(?:twitter|x)\.com/[A-Za-z0-9._%-]+', re.IGNORECASE),
    "TikTok": re.compile(r'https?://(?:www\.)?tiktok\.com/@[A-Za-z0-9._%-]+', re.IGNORECASE),
    "Pinterest": re.compile(r'https?://(?:www\.)?pinterest\.com/[A-Za-z0-9._%-]+', re.IGNORECASE),
}

# URLs that are clearly not real profile pages (platform help pages, etc.)
_SOCIAL_URL_EXCLUDES = {
    "facebook.com/sharer",
    "facebook.com/dialog",
    "facebook.com/tr",
    "facebook.com/plugins",
    "twitter.com/intent",
    "twitter.com/share",
    "twitter.com/home",
    "x.com/intent",
    "x.com/share",
    "x.com/home",
    "linkedin.com/shareArticle",
    "linkedin.com/share",
    "pinterest.com/pin/create",
    "youtube.com/embed",
    "youtube.com/watch",
    "instagram.com/p/",
    "tiktok.com/embed",
}


class SocialAuditConnector(BaseConnector):
    """Audits social media presence and activity."""

    def __init__(
        self,
        settings: Settings | None = None,
        requests_per_second: float = 2.0,
    ) -> None:
        super().__init__(settings, requests_per_second=requests_per_second)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _safe_head(self, url: str, *, label: str = "head") -> int | None:
        """Issue a HEAD request and return the status code, or None on failure."""
        headers = {**_DEFAULT_HEADERS}
        try:
            self._rate_limit_sync()
            resp = self.sync_client.head(url, headers=headers, follow_redirects=True)
            return resp.status_code
        except (httpx.HTTPStatusError, httpx.TransportError, httpx.TimeoutException) as exc:
            self.log.debug("head_request_failed", url=url, error=str(exc), label=label)
            return None
        except Exception as exc:
            self.log.debug("head_request_unexpected", url=url, error=str(exc), label=label)
            return None

    def _safe_get(
        self,
        url: str,
        *,
        label: str = "get",
    ) -> httpx.Response | None:
        """Issue a GET that returns None on any failure."""
        headers = {**_DEFAULT_HEADERS}
        try:
            self._rate_limit_sync()
            resp = self.sync_client.get(url, headers=headers, follow_redirects=True)
            resp.raise_for_status()
            return resp
        except (httpx.HTTPStatusError, httpx.TransportError, httpx.TimeoutException) as exc:
            self.log.debug("get_request_failed", url=url, error=str(exc), label=label)
            return None
        except Exception as exc:
            self.log.debug("get_request_unexpected", url=url, error=str(exc), label=label)
            return None

    @staticmethod
    def _is_excluded_url(url: str) -> bool:
        """Return True if the URL is a sharing/embed link, not a real profile."""
        url_lower = url.lower()
        return any(excl in url_lower for excl in _SOCIAL_URL_EXCLUDES)

    # ==================================================================
    # Find social profiles
    # ==================================================================

    def find_social_profiles(self, business_name: str, domain: str) -> dict:
        """Find social media profiles for a business.

        Uses two strategies:
        1. Check common URL patterns (e.g. facebook.com/{name}).
        2. Scrape the business website's HTML for social links in meta tags,
           ``<a>`` tags, and ``<link>`` elements.

        Parameters
        ----------
        business_name:
            The business name to search for.
        domain:
            The business website domain (e.g. ``"example.com"``).

        Returns
        -------
        dict
            Keyed by platform name. Each value is a dict with keys: url,
            found, source (``"url_check"`` or ``"website_scrape"``),
            followers, last_post_date.
        """
        self.log.info(
            "find_social_profiles_start",
            business_name=business_name,
            domain=domain,
        )

        profiles: dict[str, dict[str, Any]] = {}

        # Initialize all platforms as not found
        for platform_info in _SOCIAL_PLATFORMS:
            platform = platform_info["platform"]
            profiles[platform] = {
                "url": None,
                "found": False,
                "source": None,
                "followers": None,
                "last_post_date": None,
            }

        # Strategy 1: scrape the website for social links (most reliable)
        website_profiles = self._find_profiles_from_website(domain)
        for platform, data in website_profiles.items():
            if data.get("url"):
                profiles[platform] = {
                    "url": data["url"],
                    "found": True,
                    "source": "website_scrape",
                    "followers": None,
                    "last_post_date": None,
                }

        # Strategy 2: check common URL patterns for platforms not yet found
        name_slug = self._make_slug(business_name)
        domain_slug = domain.replace(".", "").replace("www", "")

        name_variants = list(dict.fromkeys([
            name_slug,
            domain_slug,
            business_name.replace(" ", ""),
            business_name.replace(" ", ".").lower(),
        ]))

        for platform_info in _SOCIAL_PLATFORMS:
            platform = platform_info["platform"]
            if profiles[platform]["found"]:
                continue  # Already found via website scrape

            url_template = platform_info["url_template"]
            found_url = self._check_url_variants(url_template, name_variants, platform)
            if found_url:
                profiles[platform] = {
                    "url": found_url,
                    "found": True,
                    "source": "url_check",
                    "followers": None,
                    "last_post_date": None,
                }

        found_count = sum(1 for p in profiles.values() if p["found"])
        self.log.info(
            "find_social_profiles_complete",
            business_name=business_name,
            platforms_found=found_count,
            platforms_total=len(profiles),
        )
        return profiles

    def _find_profiles_from_website(self, domain: str) -> dict[str, dict[str, Any]]:
        """Scrape the business website for social media links."""
        results: dict[str, dict[str, Any]] = {}

        # Try both http and https
        for scheme in ("https", "http"):
            url = f"{scheme}://{domain}"
            resp = self._safe_get(url, label="website_scrape")
            if resp is not None:
                break
        else:
            self.log.warning("website_not_reachable", domain=domain)
            return results

        html = resp.text

        # Search for social links in the HTML
        for platform, pattern in _SOCIAL_LINK_PATTERNS.items():
            matches = pattern.findall(html)
            for match in matches:
                # Filter out sharing/embed URLs
                if self._is_excluded_url(match):
                    continue
                # Clean trailing slashes and quotes
                clean_url = match.rstrip("/").rstrip('"').rstrip("'")
                results[platform] = {"url": clean_url}
                break  # Take the first valid match per platform

        # Also check og:see_also meta tags
        og_matches = re.findall(
            r'<meta[^>]*property=["\']og:see_also["\'][^>]*content=["\']([^"\']+)["\']',
            html,
            re.IGNORECASE,
        )
        for og_url in og_matches:
            for platform, pattern in _SOCIAL_LINK_PATTERNS.items():
                if platform not in results and pattern.search(og_url):
                    if not self._is_excluded_url(og_url):
                        results[platform] = {"url": og_url.rstrip("/")}

        return results

    def _check_url_variants(
        self,
        url_template: str,
        name_variants: list[str],
        platform: str,
    ) -> str | None:
        """Try multiple name variants against a URL template.

        Returns the first URL that returns a 200 status, or None.
        """
        for name in name_variants:
            url = url_template.format(name=name)
            status = self._safe_head(url, label=f"social_check_{platform}")
            if status is not None and status == 200:
                return url
        return None

    @staticmethod
    def _make_slug(name: str) -> str:
        """Convert a business name into a URL-friendly slug."""
        slug = name.lower().strip()
        slug = re.sub(r"[^\w\s-]", "", slug)
        slug = re.sub(r"[\s_]+", "", slug)
        return slug

    # ==================================================================
    # Analyze social presence
    # ==================================================================

    def analyze_social_presence(self, profiles: dict) -> dict:
        """Score social media presence based on discovered profiles.

        Parameters
        ----------
        profiles:
            The dict returned by ``find_social_profiles()``, keyed by
            platform name.

        Returns
        -------
        dict
            Keys: overall_score (0-100), platforms_found (list),
            platforms_missing (list), recommendations (list of
            actionable strings), details (dict of per-platform info).
        """
        self.log.info("analyze_social_presence_start")

        # Platform importance weights (higher = more important for SEO / visibility)
        weights: dict[str, int] = {
            "Facebook": 20,
            "Instagram": 15,
            "YouTube": 15,
            "LinkedIn": 15,
            "X (Twitter)": 10,
            "TikTok": 10,
            "Pinterest": 5,
        }
        # Remaining weight is for activity/engagement (future enhancement)
        bonus_weight = 10

        total_weight = sum(weights.values()) + bonus_weight
        earned = 0

        platforms_found: list[str] = []
        platforms_missing: list[str] = []
        recommendations: list[str] = []
        details: dict[str, dict[str, Any]] = {}

        for platform, weight in weights.items():
            profile = profiles.get(platform, {})
            is_found = profile.get("found", False)

            details[platform] = {
                "found": is_found,
                "url": profile.get("url"),
                "weight": weight,
                "source": profile.get("source"),
            }

            if is_found:
                earned += weight
                platforms_found.append(platform)
            else:
                platforms_missing.append(platform)

        # Generate recommendations
        if not platforms_found:
            recommendations.append(
                "CRITICAL: No social media profiles found. Establish presence on "
                "at least Facebook, Instagram, and LinkedIn to improve brand visibility."
            )
        else:
            # Recommend high-priority missing platforms
            high_priority = {"Facebook", "Instagram", "YouTube", "LinkedIn"}
            missing_high = [p for p in platforms_missing if p in high_priority]
            if missing_high:
                recommendations.append(
                    f"Create profiles on: {', '.join(missing_high)}. "
                    "These are high-impact platforms for business visibility."
                )

            low_priority = [p for p in platforms_missing if p not in high_priority]
            if low_priority:
                recommendations.append(
                    f"Consider also creating profiles on: {', '.join(low_priority)}."
                )

        # Bonus: if they have 4+ platforms, give partial bonus
        if len(platforms_found) >= 4:
            earned += bonus_weight // 2
            recommendations.append(
                "Good platform coverage. Focus on consistent posting and engagement."
            )
        if len(platforms_found) >= 6:
            earned += bonus_weight // 2
            recommendations.append(
                "Excellent platform coverage. Consider cross-platform content strategy."
            )

        # Recommend linking from website
        website_sourced = [
            p for p in platforms_found
            if profiles.get(p, {}).get("source") != "website_scrape"
        ]
        if website_sourced:
            recommendations.append(
                f"Add social media links to your website for: {', '.join(website_sourced)}. "
                "This helps search engines associate your social profiles with your brand."
            )

        overall_score = min(round((earned / total_weight) * 100), 100) if total_weight > 0 else 0

        result = {
            "overall_score": overall_score,
            "platforms_found": platforms_found,
            "platforms_missing": platforms_missing,
            "recommendations": recommendations,
            "details": details,
        }

        self.log.info(
            "analyze_social_presence_complete",
            score=overall_score,
            found=len(platforms_found),
            missing=len(platforms_missing),
        )
        return result
