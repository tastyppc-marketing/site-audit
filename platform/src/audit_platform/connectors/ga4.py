"""GA4 connector using the google-analytics-data Python client library.

Provides methods to run GA4 reports via the Data API v1beta, returning
results as clean lists of dicts.
"""

from __future__ import annotations

from typing import Any

import structlog
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
    RunReportResponse,
)
from google.api_core.exceptions import GoogleAPIError

from audit_platform.auth.oauth import get_oauth_credentials
from audit_platform.auth.service_account import get_service_account_credentials
from audit_platform.config import Settings
from audit_platform.connectors.base import BaseConnector

logger = structlog.get_logger(__name__)


class GA4Connector(BaseConnector):
    """Connector for the Google Analytics 4 Data API (v1beta).

    Prefers service-account credentials when GOOGLE_SERVICE_ACCOUNT_JSON is
    configured; otherwise falls back to OAuth credentials.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)
        self._analytics_client: BetaAnalyticsDataClient | None = None

    # ------------------------------------------------------------------
    # Client initialisation
    # ------------------------------------------------------------------

    def _get_client(self) -> BetaAnalyticsDataClient:
        """Lazily build and return a BetaAnalyticsDataClient."""
        if self._analytics_client is not None:
            return self._analytics_client

        s = self.settings

        # Prefer service account when available
        if s.GOOGLE_SERVICE_ACCOUNT_JSON:
            self.logger.info(
                "ga4_using_service_account",
                path=str(s.GOOGLE_SERVICE_ACCOUNT_JSON),
            )
            credentials = get_service_account_credentials(
                json_path=s.GOOGLE_SERVICE_ACCOUNT_JSON,
                scopes=["https://www.googleapis.com/auth/analytics.readonly"],
            )
            self._analytics_client = BetaAnalyticsDataClient(credentials=credentials)
        else:
            # Fall back to OAuth
            if not s.GOOGLE_CLIENT_ID or not s.GOOGLE_CLIENT_SECRET:
                raise ValueError(
                    "Neither GOOGLE_SERVICE_ACCOUNT_JSON nor OAuth credentials "
                    "(GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN) "
                    "are configured. Set them in your .env file."
                )
            if not s.GOOGLE_REFRESH_TOKEN:
                raise ValueError(
                    "GOOGLE_REFRESH_TOKEN is not configured. "
                    "Set it in your .env file or environment variables."
                )

            self.logger.info("ga4_using_oauth")
            credentials = get_oauth_credentials(
                client_id=s.GOOGLE_CLIENT_ID,
                client_secret=s.GOOGLE_CLIENT_SECRET,
                refresh_token=s.GOOGLE_REFRESH_TOKEN,
            )
            self._analytics_client = BetaAnalyticsDataClient(credentials=credentials)

        return self._analytics_client

    @property
    def _default_property_id(self) -> str:
        """Return the configured GA4 property ID, raising if unset."""
        pid = self.settings.GA4_PROPERTY_ID
        if not pid:
            raise ValueError(
                "GA4_PROPERTY_ID is not configured and no property_id was "
                "passed explicitly. Set it in your .env file."
            )
        return pid

    # ------------------------------------------------------------------
    # Response parsing
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_response(response: RunReportResponse) -> list[dict[str, Any]]:
        """Convert a RunReportResponse into a list of flat dicts.

        Dimension values are keyed by their header name; metric values are
        coerced to float (or int where the value has no decimal).
        """
        dim_headers = [h.name for h in response.dimension_headers]
        met_headers = [h.name for h in response.metric_headers]

        results: list[dict[str, Any]] = []
        for row in response.rows:
            record: dict[str, Any] = {}

            for i, dim_val in enumerate(row.dimension_values):
                record[dim_headers[i]] = dim_val.value

            for i, met_val in enumerate(row.metric_values):
                raw = met_val.value
                # Attempt numeric coercion
                try:
                    num = float(raw)
                    record[met_headers[i]] = int(num) if num == int(num) else num
                except (ValueError, TypeError):
                    record[met_headers[i]] = raw

            results.append(record)

        return results

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def run_report(
        self,
        property_id: str | None = None,
        dimensions: list[str] | None = None,
        metrics: list[str] | None = None,
        date_range_start: str = "30daysAgo",
        date_range_end: str = "today",
    ) -> list[dict[str, Any]]:
        """Execute a generic GA4 report.

        This is the building-block method used by all convenience methods.

        Args:
            property_id: GA4 property ID (numeric). Falls back to settings.
            dimensions: List of GA4 dimension API names.
            metrics: List of GA4 metric API names.
            date_range_start: Start date string (e.g. "30daysAgo", "2024-01-01").
            date_range_end: End date string (e.g. "today", "2024-01-31").

        Returns:
            List of dicts, one per row, with dimension and metric keys.

        Raises:
            ValueError: If no metrics are specified.
            google.api_core.exceptions.GoogleAPIError: On API failures.
        """
        if not metrics:
            raise ValueError("At least one metric must be specified for a GA4 report.")

        pid = property_id or self._default_property_id
        client = self._get_client()

        request = RunReportRequest(
            property=f"properties/{pid}",
            date_ranges=[
                DateRange(start_date=date_range_start, end_date=date_range_end),
            ],
            dimensions=[Dimension(name=d) for d in (dimensions or [])],
            metrics=[Metric(name=m) for m in metrics],
        )

        self.logger.debug(
            "ga4_run_report",
            property_id=pid,
            dimensions=dimensions,
            metrics=metrics,
            start=date_range_start,
            end=date_range_end,
        )

        try:
            response = client.run_report(request)
        except GoogleAPIError as exc:
            self.logger.error(
                "ga4_api_error",
                property_id=pid,
                error=str(exc),
            )
            raise

        rows = self._parse_response(response)
        self.logger.info(
            "ga4_report_complete",
            property_id=pid,
            row_count=len(rows),
        )
        return rows

    def get_landing_page_report(
        self,
        property_id: str | None = None,
        date_range_start: str = "30daysAgo",
        date_range_end: str = "today",
    ) -> list[dict[str, Any]]:
        """Landing page performance report.

        Dimensions: landingPage
        Metrics: sessions, engagedSessions, bounceRate, averageSessionDuration,
                 conversions, totalUsers, newUsers

        Args:
            property_id: GA4 property ID. Falls back to settings.
            date_range_start: Report start date.
            date_range_end: Report end date.

        Returns:
            List of dicts keyed by dimension/metric API names.
        """
        return self.run_report(
            property_id=property_id,
            dimensions=["landingPage"],
            metrics=[
                "sessions",
                "engagedSessions",
                "bounceRate",
                "averageSessionDuration",
                "conversions",
                "totalUsers",
                "newUsers",
            ],
            date_range_start=date_range_start,
            date_range_end=date_range_end,
        )

    def get_acquisition_report(
        self,
        property_id: str | None = None,
        date_range_start: str = "30daysAgo",
        date_range_end: str = "today",
    ) -> list[dict[str, Any]]:
        """Traffic acquisition report broken down by channel, source, medium.

        Dimensions: sessionDefaultChannelGroup, sessionSource, sessionMedium
        Metrics: sessions, totalUsers, engagedSessions, conversions

        Args:
            property_id: GA4 property ID. Falls back to settings.
            date_range_start: Report start date.
            date_range_end: Report end date.

        Returns:
            List of dicts keyed by dimension/metric API names.
        """
        return self.run_report(
            property_id=property_id,
            dimensions=[
                "sessionDefaultChannelGroup",
                "sessionSource",
                "sessionMedium",
            ],
            metrics=[
                "sessions",
                "totalUsers",
                "engagedSessions",
                "conversions",
            ],
            date_range_start=date_range_start,
            date_range_end=date_range_end,
        )

    def get_page_performance(
        self,
        property_id: str | None = None,
        date_range_start: str = "30daysAgo",
        date_range_end: str = "today",
    ) -> list[dict[str, Any]]:
        """Page-level performance report.

        Dimensions: pagePath, pageTitle
        Metrics: screenPageViews, averageSessionDuration, bounceRate, engagedSessions

        Args:
            property_id: GA4 property ID. Falls back to settings.
            date_range_start: Report start date.
            date_range_end: Report end date.

        Returns:
            List of dicts keyed by dimension/metric API names.
        """
        return self.run_report(
            property_id=property_id,
            dimensions=["pagePath", "pageTitle"],
            metrics=[
                "screenPageViews",
                "averageSessionDuration",
                "bounceRate",
                "engagedSessions",
            ],
            date_range_start=date_range_start,
            date_range_end=date_range_end,
        )

    def get_device_report(
        self,
        property_id: str | None = None,
        date_range_start: str = "30daysAgo",
        date_range_end: str = "today",
    ) -> list[dict[str, Any]]:
        """Device category breakdown report.

        Dimensions: deviceCategory
        Metrics: sessions, totalUsers, conversions, bounceRate

        Args:
            property_id: GA4 property ID. Falls back to settings.
            date_range_start: Report start date.
            date_range_end: Report end date.

        Returns:
            List of dicts keyed by dimension/metric API names.
        """
        return self.run_report(
            property_id=property_id,
            dimensions=["deviceCategory"],
            metrics=[
                "sessions",
                "totalUsers",
                "conversions",
                "bounceRate",
            ],
            date_range_start=date_range_start,
            date_range_end=date_range_end,
        )
