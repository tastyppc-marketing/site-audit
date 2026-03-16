"""Google Search Console connector using the Search Console API v1."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Sequence

import structlog
from googleapiclient.discovery import build, Resource
from googleapiclient.errors import HttpError

from audit_platform.auth.oauth import get_oauth_credentials
from audit_platform.config import Settings
from audit_platform.connectors.base import BaseConnector

logger = structlog.get_logger(__name__)

# Search Console data has a ~3-day processing lag.
_DATA_LAG_DAYS = 3


def _default_date_range() -> tuple[date, date]:
    """Return (start, end) covering the last 90 days, accounting for data lag."""
    end = date.today() - timedelta(days=_DATA_LAG_DAYS)
    start = end - timedelta(days=90)
    return start, end


def _to_date_str(d: date | str | None, default: date) -> str:
    """Normalise a date argument to an ISO-format string."""
    if d is None:
        return default.isoformat()
    if isinstance(d, str):
        return d
    return d.isoformat()


def _normalize_row(row: dict[str, Any], dimensions: Sequence[str]) -> dict[str, Any]:
    """Convert a Search Console response row to a flat snake_case dict.

    The API returns keys in a ``keys`` list aligned with the requested dimensions,
    plus top-level ``clicks``, ``impressions``, ``ctr``, and ``position`` fields.
    """
    result: dict[str, Any] = {}
    keys: list[str] = row.get("keys", [])
    for dim, val in zip(dimensions, keys):
        result[dim] = val
    result["clicks"] = row.get("clicks", 0)
    result["impressions"] = row.get("impressions", 0)
    result["ctr"] = round(row.get("ctr", 0.0), 6)
    result["position"] = round(row.get("position", 0.0), 2)
    return result


class SearchConsoleConnector(BaseConnector):
    """Connector for the Google Search Console API.

    Wraps ``searchAnalytics.query`` for performance data and basic indexing
    status via the Sitemaps API.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)
        self._service: Resource | None = None

    # ------------------------------------------------------------------
    # Service bootstrap
    # ------------------------------------------------------------------

    def _get_service(self) -> Resource:
        """Build or return the cached discovery service."""
        if self._service is not None:
            return self._service

        s = self.settings
        if not s.GOOGLE_CLIENT_ID or not s.GOOGLE_CLIENT_SECRET or not s.GOOGLE_REFRESH_TOKEN:
            raise RuntimeError(
                "Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, "
                "GOOGLE_REFRESH_TOKEN) are required for Search Console access."
            )

        creds = get_oauth_credentials(
            client_id=s.GOOGLE_CLIENT_ID,
            client_secret=s.GOOGLE_CLIENT_SECRET,
            refresh_token=s.GOOGLE_REFRESH_TOKEN,
        )
        self._service = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
        self.logger.info("search_console_service_initialized")
        return self._service

    def _resolve_site_url(self, site_url: str | None) -> str:
        """Use the provided site URL or fall back to settings."""
        url = site_url or self.settings.SEARCH_CONSOLE_SITE_URL
        if not url:
            raise ValueError(
                "site_url must be provided or SEARCH_CONSOLE_SITE_URL must be set in .env"
            )
        return url

    # ------------------------------------------------------------------
    # Internal query helper
    # ------------------------------------------------------------------

    def _query(
        self,
        *,
        site_url: str | None = None,
        start_date: date | str | None = None,
        end_date: date | str | None = None,
        dimensions: list[str],
        row_limit: int = 1000,
        start_row: int = 0,
        search_type: str = "web",
    ) -> list[dict[str, Any]]:
        """Execute a ``searchAnalytics.query`` request and return normalised rows."""
        service = self._get_service()
        resolved_url = self._resolve_site_url(site_url)
        default_start, default_end = _default_date_range()

        body: dict[str, Any] = {
            "startDate": _to_date_str(start_date, default_start),
            "endDate": _to_date_str(end_date, default_end),
            "dimensions": dimensions,
            "rowLimit": min(row_limit, 25000),
            "startRow": start_row,
            "type": search_type,
        }

        self.logger.debug(
            "search_console_query",
            site_url=resolved_url,
            dimensions=dimensions,
            start_date=body["startDate"],
            end_date=body["endDate"],
            row_limit=body["rowLimit"],
        )

        try:
            response: dict[str, Any] = (
                service.searchAnalytics()
                .query(siteUrl=resolved_url, body=body)
                .execute()
            )
        except HttpError as exc:
            self.logger.error("search_console_query_error", status=exc.resp.status, detail=str(exc))
            raise

        rows = response.get("rows", [])
        self.logger.info(
            "search_console_query_complete",
            dimensions=dimensions,
            rows_returned=len(rows),
        )
        return [_normalize_row(r, dimensions) for r in rows]

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def get_query_data(
        self,
        site_url: str | None = None,
        start_date: date | str | None = None,
        end_date: date | str | None = None,
        dimensions: list[str] | None = None,
        row_limit: int = 1000,
    ) -> list[dict[str, Any]]:
        """Fetch search-query performance data.

        Args:
            site_url: Search Console property URL. Falls back to settings.
            start_date: Start of the date range (inclusive). Default: 90 days ago.
            end_date: End of the date range (inclusive). Default: 3 days ago.
            dimensions: Override dimensions. Default ``["query"]``.
            row_limit: Maximum rows to return (API max 25 000).

        Returns:
            List of dicts with query, clicks, impressions, ctr, position.
        """
        return self._query(
            site_url=site_url,
            start_date=start_date,
            end_date=end_date,
            dimensions=dimensions or ["query"],
            row_limit=row_limit,
        )

    def get_page_data(
        self,
        site_url: str | None = None,
        start_date: date | str | None = None,
        end_date: date | str | None = None,
        row_limit: int = 1000,
    ) -> list[dict[str, Any]]:
        """Fetch page-level performance data.

        Returns:
            List of dicts with page, clicks, impressions, ctr, position.
        """
        return self._query(
            site_url=site_url,
            start_date=start_date,
            end_date=end_date,
            dimensions=["page"],
            row_limit=row_limit,
        )

    def get_device_data(
        self,
        site_url: str | None = None,
        start_date: date | str | None = None,
        end_date: date | str | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch device-segmented performance data.

        Returns:
            List of dicts with device (MOBILE/DESKTOP/TABLET), clicks, etc.
        """
        return self._query(
            site_url=site_url,
            start_date=start_date,
            end_date=end_date,
            dimensions=["device"],
        )

    def get_country_data(
        self,
        site_url: str | None = None,
        start_date: date | str | None = None,
        end_date: date | str | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch country-segmented performance data.

        Returns:
            List of dicts with country (3-letter code), clicks, etc.
        """
        return self._query(
            site_url=site_url,
            start_date=start_date,
            end_date=end_date,
            dimensions=["country"],
        )

    def get_query_page_data(
        self,
        site_url: str | None = None,
        start_date: date | str | None = None,
        end_date: date | str | None = None,
        row_limit: int = 5000,
    ) -> list[dict[str, Any]]:
        """Fetch cross-referenced query + page performance data.

        Returns:
            List of dicts with query, page, clicks, impressions, ctr, position.
        """
        return self._query(
            site_url=site_url,
            start_date=start_date,
            end_date=end_date,
            dimensions=["query", "page"],
            row_limit=row_limit,
        )

    def get_indexing_status(self, site_url: str | None = None) -> dict[str, Any]:
        """Retrieve basic indexing / sitemap coverage information.

        Attempts ``urlInspection`` first; falls back to the Sitemaps API
        which provides aggregate coverage counts.

        Returns:
            Dict with sitemap information and coverage summary.
        """
        service = self._get_service()
        resolved_url = self._resolve_site_url(site_url)

        result: dict[str, Any] = {"site_url": resolved_url, "sitemaps": []}

        try:
            sitemaps_response = (
                service.sitemaps().list(siteUrl=resolved_url).execute()
            )
            for sm in sitemaps_response.get("sitemap", []):
                sitemap_info: dict[str, Any] = {
                    "path": sm.get("path", ""),
                    "last_submitted": sm.get("lastSubmitted"),
                    "last_downloaded": sm.get("lastDownloaded"),
                    "is_pending": sm.get("isPending", False),
                    "warnings": sm.get("warnings", 0),
                    "errors": sm.get("errors", 0),
                    "contents": [],
                }
                for content in sm.get("contents", []):
                    sitemap_info["contents"].append({
                        "type": content.get("type", ""),
                        "submitted": content.get("submitted", 0),
                        "indexed": content.get("indexed", 0),
                    })
                result["sitemaps"].append(sitemap_info)

            self.logger.info(
                "search_console_indexing_status",
                sitemaps_count=len(result["sitemaps"]),
            )
        except HttpError as exc:
            self.logger.warning(
                "search_console_sitemaps_error",
                status=exc.resp.status,
                detail=str(exc),
            )
            result["error"] = f"Sitemaps API error: {exc.resp.status}"

        return result

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------

    def close(self) -> None:
        """Close underlying resources."""
        if self._service is not None:
            self._service.close()
            self._service = None
        super().close()
