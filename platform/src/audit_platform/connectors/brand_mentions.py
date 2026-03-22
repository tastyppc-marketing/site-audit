"""Brand mentions connector.

Searches for brand mentions across Reddit, forums, YouTube, and the web
using free public methods (no API keys required for basic functionality).

All HTTP requests go through the inherited ``sync_client`` (httpx) with
appropriate User-Agent headers.  Sites that block or rate-limit are handled
gracefully -- the connector logs a warning and moves on without crashing.
"""

from __future__ import annotations

import json
import re
import time
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

# Headers used for all outgoing requests to look like a normal browser.
_DEFAULT_HEADERS: dict[str, str] = {
    "User-Agent": _USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Reddit JSON API uses a slightly different UA convention.
_REDDIT_HEADERS: dict[str, str] = {
    "User-Agent": "SEOAuditPlatform/1.0 (research; +https://example.com)",
    "Accept": "application/json",
}


class BrandMentionsConnector(BaseConnector):
    """Searches for brand mentions across Reddit, forums, and web."""

    def __init__(
        self,
        settings: Settings | None = None,
        requests_per_second: float = 1.0,
    ) -> None:
        # Default to 1 req/s to be respectful of free endpoints.
        super().__init__(settings, requests_per_second=requests_per_second)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _safe_get(
        self,
        url: str,
        *,
        headers: dict[str, str] | None = None,
        params: dict[str, Any] | None = None,
        label: str = "request",
    ) -> httpx.Response | None:
        """Issue a GET that never raises -- returns *None* on any failure."""
        merged_headers = {**_DEFAULT_HEADERS, **(headers or {})}
        try:
            self._rate_limit_sync()
            resp = self.sync_client.get(url, headers=merged_headers, params=params)
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", "5"))
                self.log.warning(
                    "rate_limited",
                    url=url,
                    retry_after=retry_after,
                    label=label,
                )
                time.sleep(min(retry_after, 30))
                resp = self.sync_client.get(url, headers=merged_headers, params=params)
            resp.raise_for_status()
            return resp
        except httpx.HTTPStatusError as exc:
            self.log.warning(
                "http_error",
                url=url,
                status=exc.response.status_code,
                label=label,
            )
            return None
        except (httpx.TransportError, httpx.TimeoutException) as exc:
            self.log.warning(
                "transport_error",
                url=url,
                error=str(exc),
                label=label,
            )
            return None
        except Exception as exc:
            self.log.warning(
                "unexpected_error",
                url=url,
                error=str(exc),
                label=label,
            )
            return None

    # ==================================================================
    # Reddit
    # ==================================================================

    def search_reddit(
        self,
        query: str,
        subreddits: list[str] | None = None,
        limit: int = 25,
    ) -> list[dict]:
        """Search Reddit via their public JSON API (no auth needed).

        Parameters
        ----------
        query:
            Search query string.
        subreddits:
            Optional list of subreddit names to restrict the search to.
        limit:
            Maximum number of results per subreddit (max 100).

        Returns
        -------
        list[dict]
            Parsed Reddit posts with keys: title, selftext, subreddit,
            score, num_comments, url, created_utc, author.
        """
        self.log.info("reddit_search_start", query=query, subreddits=subreddits, limit=limit)
        limit = min(limit, 100)
        results: list[dict] = []

        urls: list[str] = []
        if subreddits:
            for sub in subreddits:
                urls.append(
                    f"https://www.reddit.com/r/{quote_plus(sub)}/search.json"
                )
        else:
            urls.append("https://www.reddit.com/search.json")

        for url in urls:
            params: dict[str, Any] = {"q": query, "limit": limit, "sort": "relevance"}
            if subreddits:
                params["restrict_sr"] = "on"

            resp = self._safe_get(url, headers=_REDDIT_HEADERS, params=params, label="reddit_search")
            if resp is None:
                continue

            try:
                data = resp.json()
            except (json.JSONDecodeError, ValueError):
                self.log.warning("reddit_json_parse_error", url=url)
                continue

            children = data.get("data", {}).get("children", [])
            for child in children:
                post = child.get("data", {})
                results.append({
                    "title": post.get("title", ""),
                    "selftext": (post.get("selftext", "") or "")[:500],
                    "subreddit": post.get("subreddit", ""),
                    "score": post.get("score", 0),
                    "num_comments": post.get("num_comments", 0),
                    "url": f"https://www.reddit.com{post.get('permalink', '')}",
                    "created_utc": post.get("created_utc", 0),
                    "author": post.get("author", ""),
                })

        self.log.info("reddit_search_complete", query=query, results=len(results))
        return results

    # ==================================================================
    # Web mentions (DuckDuckGo HTML search)
    # ==================================================================

    def search_web_mentions(self, brand_name: str, domain: str) -> list[dict]:
        """Search for brand mentions using DuckDuckGo HTML search.

        Runs two queries:
        - ``"{brand_name}" -site:{domain}``
        - ``"{domain}" -site:{domain}``

        Parameters
        ----------
        brand_name:
            The brand/business name to search for.
        domain:
            The brand's own domain (excluded from results with -site:).

        Returns
        -------
        list[dict]
            Mention dicts with keys: source_domain, title, url, snippet.
        """
        self.log.info("web_mentions_start", brand_name=brand_name, domain=domain)
        queries = [
            f'"{brand_name}" -site:{domain}',
            f'"{domain}" -site:{domain}',
        ]

        all_mentions: list[dict] = []
        seen_urls: set[str] = set()

        for query in queries:
            encoded = quote_plus(query)
            url = f"https://html.duckduckgo.com/html/?q={encoded}"

            resp = self._safe_get(url, label="duckduckgo_search")
            if resp is None:
                continue

            mentions = self._parse_duckduckgo_html(resp.text)
            for mention in mentions:
                if mention["url"] not in seen_urls:
                    seen_urls.add(mention["url"])
                    all_mentions.append(mention)

        self.log.info("web_mentions_complete", brand_name=brand_name, results=len(all_mentions))
        return all_mentions

    def _parse_duckduckgo_html(self, html: str) -> list[dict]:
        """Parse DuckDuckGo HTML search results into structured dicts."""
        results: list[dict] = []

        # DuckDuckGo HTML results are inside <div class="result ..."> blocks.
        # Each has an <a class="result__a"> for title/URL and
        # <a class="result__snippet"> for the snippet text.
        result_blocks = re.findall(
            r'<div[^>]*class="[^"]*result[^"]*results_links[^"]*"[^>]*>(.*?)</div>\s*</div>',
            html,
            re.DOTALL,
        )

        # Fallback: try simpler pattern if the above finds nothing
        if not result_blocks:
            result_blocks = re.findall(
                r'<div[^>]*class="[^"]*result\b[^"]*"[^>]*>(.*?)</div>',
                html,
                re.DOTALL,
            )

        for block in result_blocks:
            # Extract title and URL from the result link
            link_match = re.search(
                r'<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>(.*?)</a>',
                block,
                re.DOTALL,
            )
            if not link_match:
                continue

            raw_url = link_match.group(1).strip()
            title = re.sub(r"<[^>]+>", "", link_match.group(2)).strip()

            # DuckDuckGo sometimes wraps URLs in a redirect; extract the real URL.
            real_url_match = re.search(r'uddg=([^&]+)', raw_url)
            if real_url_match:
                from urllib.parse import unquote
                raw_url = unquote(real_url_match.group(1))

            # Extract snippet
            snippet_match = re.search(
                r'<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>(.*?)</a>',
                block,
                re.DOTALL,
            )
            snippet = ""
            if snippet_match:
                snippet = re.sub(r"<[^>]+>", "", snippet_match.group(1)).strip()

            # Derive source domain
            try:
                source_domain = urlparse(raw_url).netloc
            except Exception:
                source_domain = ""

            if title or raw_url:
                results.append({
                    "source_domain": source_domain,
                    "title": title,
                    "url": raw_url,
                    "snippet": snippet,
                })

        return results

    # ==================================================================
    # YouTube
    # ==================================================================

    def search_youtube(self, query: str, max_results: int = 10) -> list[dict]:
        """Search YouTube for videos mentioning the query.

        Attempts to parse the ``ytInitialData`` JSON embedded in the
        YouTube search results page.  No API key is required for this
        approach, but YouTube may throttle or block automated requests.

        Parameters
        ----------
        query:
            Search query.
        max_results:
            Maximum number of results to return.

        Returns
        -------
        list[dict]
            Video dicts with keys: title, video_id, channel, view_count,
            published, url, thumbnail.
        """
        self.log.info("youtube_search_start", query=query, max_results=max_results)

        url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
        resp = self._safe_get(url, label="youtube_search")
        if resp is None:
            return []

        results = self._parse_youtube_initial_data(resp.text, max_results)
        self.log.info("youtube_search_complete", query=query, results=len(results))
        return results

    def _parse_youtube_initial_data(self, html: str, max_results: int) -> list[dict]:
        """Extract video data from YouTube's embedded ytInitialData JSON."""
        results: list[dict] = []

        # YouTube embeds a large JSON blob in a script tag.
        match = re.search(r"var ytInitialData\s*=\s*({.*?});\s*</script>", html, re.DOTALL)
        if not match:
            # Alternative pattern for some page layouts
            match = re.search(r'ytInitialData"\s*]\s*=\s*({.*?});\s*', html, re.DOTALL)
        if not match:
            self.log.warning("youtube_initial_data_not_found")
            return results

        try:
            data = json.loads(match.group(1))
        except (json.JSONDecodeError, ValueError):
            self.log.warning("youtube_initial_data_parse_error")
            return results

        # Navigate to the video renderer list.
        try:
            contents = (
                data.get("contents", {})
                .get("twoColumnSearchResultsRenderer", {})
                .get("primaryContents", {})
                .get("sectionListRenderer", {})
                .get("contents", [])
            )
        except (AttributeError, TypeError):
            self.log.warning("youtube_unexpected_structure")
            return results

        for section in contents:
            items = (
                section.get("itemSectionRenderer", {}).get("contents", [])
            )
            for item in items:
                renderer = item.get("videoRenderer")
                if not renderer:
                    continue
                if len(results) >= max_results:
                    break

                video_id = renderer.get("videoId", "")
                title_runs = renderer.get("title", {}).get("runs", [])
                title = "".join(r.get("text", "") for r in title_runs)

                channel_runs = (
                    renderer.get("ownerText", {}).get("runs", [])
                )
                channel = "".join(r.get("text", "") for r in channel_runs)

                view_text = renderer.get("viewCountText", {}).get("simpleText", "")
                published_text = renderer.get("publishedTimeText", {}).get("simpleText", "")

                thumbnails = renderer.get("thumbnail", {}).get("thumbnails", [])
                thumbnail = thumbnails[-1].get("url", "") if thumbnails else ""

                results.append({
                    "title": title,
                    "video_id": video_id,
                    "channel": channel,
                    "view_count": view_text,
                    "published": published_text,
                    "url": f"https://www.youtube.com/watch?v={video_id}" if video_id else "",
                    "thumbnail": thumbnail,
                })

        return results

    # ==================================================================
    # Directory listings
    # ==================================================================

    def check_directory_listings(
        self,
        business_name: str,
        location: str,
    ) -> list[dict]:
        """Check if the business appears in major directories.

        Searches Yelp, BBB, Realtor.com, Zillow, and Facebook for the
        business.  Each directory is checked independently; failures on
        one do not affect the others.

        Parameters
        ----------
        business_name:
            The legal or DBA name of the business.
        location:
            City, state, or full address for location-scoped searches.

        Returns
        -------
        list[dict]
            One dict per directory with keys: directory, url, found,
            rating, review_count, listing_url.
        """
        self.log.info(
            "directory_check_start",
            business_name=business_name,
            location=location,
        )

        encoded_name = quote_plus(business_name)
        encoded_loc = quote_plus(location)

        directories = [
            {
                "directory": "Yelp",
                "search_url": (
                    f"https://www.yelp.com/search?find_desc={encoded_name}"
                    f"&find_loc={encoded_loc}"
                ),
            },
            {
                "directory": "BBB",
                "search_url": (
                    f"https://www.bbb.org/search?find_text={encoded_name}"
                    f"&find_loc={encoded_loc}"
                ),
            },
            {
                "directory": "Realtor.com",
                "search_url": (
                    f"https://www.realtor.com/realestateagents/{encoded_name}"
                ),
            },
            {
                "directory": "Zillow",
                "search_url": (
                    f"https://www.zillow.com/professionals/real-estate-agent-reviews/"
                    f"?name={encoded_name}&location={encoded_loc}"
                ),
            },
            {
                "directory": "Facebook",
                "search_url": (
                    f"https://www.facebook.com/search/pages/?q={encoded_name}"
                ),
            },
        ]

        results: list[dict] = []
        for entry in directories:
            result = self._check_single_directory(
                directory=entry["directory"],
                search_url=entry["search_url"],
                business_name=business_name,
            )
            results.append(result)

        found_count = sum(1 for r in results if r["found"])
        self.log.info(
            "directory_check_complete",
            business_name=business_name,
            checked=len(results),
            found=found_count,
        )
        return results

    def _check_single_directory(
        self,
        directory: str,
        search_url: str,
        business_name: str,
    ) -> dict:
        """Check a single directory for the business. Returns a result dict."""
        result: dict[str, Any] = {
            "directory": directory,
            "search_url": search_url,
            "found": False,
            "listing_url": None,
            "rating": None,
            "review_count": None,
        }

        resp = self._safe_get(search_url, label=f"directory_{directory.lower()}")
        if resp is None:
            result["error"] = "blocked_or_unavailable"
            return result

        html = resp.text.lower()
        name_lower = business_name.lower()

        # Simple heuristic: check if the business name appears in the page.
        # This is intentionally conservative -- a more sophisticated approach
        # would parse the DOM or use directory-specific APIs.
        if name_lower in html:
            result["found"] = True
            result["listing_url"] = search_url

            # Attempt to extract rating (common patterns across directories)
            rating_match = re.search(
                r'(?:rating|stars?)["\s:]*(\d(?:\.\d)?)\s*(?:out of|/)\s*5',
                html,
            )
            if rating_match:
                try:
                    result["rating"] = float(rating_match.group(1))
                except (ValueError, TypeError):
                    pass

            # Attempt to extract review count
            review_match = re.search(
                r'(\d+)\s*(?:reviews?|ratings?)',
                html,
            )
            if review_match:
                try:
                    result["review_count"] = int(review_match.group(1))
                except (ValueError, TypeError):
                    pass

        return result

    # ==================================================================
    # Review summary
    # ==================================================================

    def get_review_summary(self, business_name: str, location: str) -> dict:
        """Aggregate review data from found directory listings.

        Calls ``check_directory_listings`` and summarises the review
        data across all platforms where the business was found.

        Parameters
        ----------
        business_name:
            The business name.
        location:
            Business location string.

        Returns
        -------
        dict
            Keys: total_reviews, avg_rating, platforms (list of
            {platform, rating, count, url}).
        """
        self.log.info("review_summary_start", business_name=business_name, location=location)

        listings = self.check_directory_listings(business_name, location)

        platforms: list[dict] = []
        total_reviews = 0
        rating_sum = 0.0
        rating_count = 0

        for listing in listings:
            if not listing["found"]:
                continue

            platform_data: dict[str, Any] = {
                "platform": listing["directory"],
                "rating": listing.get("rating"),
                "count": listing.get("review_count", 0) or 0,
                "url": listing.get("listing_url") or listing.get("search_url"),
            }
            platforms.append(platform_data)

            if platform_data["count"]:
                total_reviews += platform_data["count"]
            if listing.get("rating") is not None:
                rating_sum += listing["rating"]
                rating_count += 1

        avg_rating = round(rating_sum / rating_count, 2) if rating_count > 0 else None

        summary = {
            "total_reviews": total_reviews,
            "avg_rating": avg_rating,
            "platforms": platforms,
        }

        self.log.info(
            "review_summary_complete",
            business_name=business_name,
            total_reviews=total_reviews,
            avg_rating=avg_rating,
            platforms_found=len(platforms),
        )
        return summary
