"""Google Business Profile connector.

Uses the Business Profile APIs (Business Information v1 + Performance v1)
to retrieve location data, daily performance metrics, search keywords,
and reviews.

IMPORTANT: These APIs require OAuth 2.0 with a verified Business Profile
owner/manager.  The ``business.manage`` scope must be granted and the
locations must already be verified inside Google Business Profile before
any data will be returned.

References
----------
- Business Information API: https://developers.google.com/my-business/reference/businessinformation/rest
- Business Profile Performance API: https://developers.google.com/my-business/reference/performance/rest
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

import httpx
import structlog

from audit_platform.auth.oauth import get_oauth_credentials
from audit_platform.config import Settings
from audit_platform.connectors.base import BaseConnector
from audit_platform.models.local import BusinessProfileRecord, LocalPerformanceRecord

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# API surface constants
# ---------------------------------------------------------------------------
_BIZ_INFO_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1"
_PERF_BASE = "https://businessprofileperformance.googleapis.com/v1"

# Metric enum values used for dailyMetrics timeSeries requests
_DAILY_METRICS = [
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "CALL_CLICKS",
    "WEBSITE_CLICKS",
    "BUSINESS_DIRECTION_REQUESTS",
]

_DEFAULT_LOOKBACK_DAYS = 90

# Mapping from API metric enum → LocalPerformanceRecord field name
_METRIC_FIELD_MAP: dict[str, str] = {
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH": "desktop_search_impressions",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH": "mobile_search_impressions",
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS": "desktop_maps_impressions",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS": "mobile_maps_impressions",
    "CALL_CLICKS": "call_clicks",
    "WEBSITE_CLICKS": "website_clicks",
    "BUSINESS_DIRECTION_REQUESTS": "direction_requests",
}


class BusinessProfileConnector(BaseConnector):
    """Connector for the Google Business Profile suite of APIs.

    Authenticates via OAuth 2.0 credentials built from settings and issues
    REST requests using the inherited ``httpx.Client``.  A fresh access
    token is obtained lazily and cached until it expires.

    TODO: Manual setup requirements
    --------------------------------
    1. Create an OAuth 2.0 client in Google Cloud Console and download the
       client secret JSON (or use GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
    2. Run the consent flow once to obtain a refresh token scoped to
       ``https://www.googleapis.com/auth/business.manage``.  Store it in
       ``.env`` as ``GOOGLE_REFRESH_TOKEN``.
    3. The Google account used must be an Owner or Manager of the Business
       Profile locations you wish to query.
    4. Locations must be *verified* — unverified listings return empty data.
    5. The Business Profile APIs must be enabled in the Cloud project.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)
        self._credentials = get_oauth_credentials(
            client_id=self.settings.GOOGLE_CLIENT_ID,
            client_secret=self.settings.GOOGLE_CLIENT_SECRET,
            refresh_token=self.settings.GOOGLE_REFRESH_TOKEN,
        )

    # ------------------------------------------------------------------
    # Auth helper
    # ------------------------------------------------------------------

    def _get_auth_headers(self) -> dict[str, str]:
        """Return an Authorization header with a valid access token.

        Refreshes the token automatically when it is missing or expired.
        """
        if not self._credentials.valid:
            from google.auth.transport.requests import Request

            try:
                self._credentials.refresh(Request())
            except Exception as exc:
                self.log.error(
                    "oauth_token_refresh_failed",
                    error=str(exc),
                    hint=(
                        "Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and "
                        "GOOGLE_REFRESH_TOKEN are set correctly in .env and "
                        "that the refresh token has the business.manage scope."
                    ),
                )
                raise
        return {"Authorization": f"Bearer {self._credentials.token}"}

    # ------------------------------------------------------------------
    # Internal HTTP helpers
    # ------------------------------------------------------------------

    def _get(self, url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """Issue an authenticated GET and return the JSON body."""
        resp = self._request_sync("GET", url, headers=self._get_auth_headers(), params=params)
        return resp.json()

    def _post(self, url: str, json_body: dict[str, Any] | None = None) -> dict[str, Any]:
        """Issue an authenticated POST and return the JSON body."""
        resp = self._request_sync("POST", url, headers=self._get_auth_headers(), json=json_body)
        return resp.json()

    # ------------------------------------------------------------------
    # Resolve account
    # ------------------------------------------------------------------

    def _resolve_account_id(self, account_id: str | None = None) -> str:
        """Return an account resource name, resolving from settings or listing."""
        if account_id:
            return account_id if account_id.startswith("accounts/") else f"accounts/{account_id}"

        configured = self.settings.GBP_ACCOUNT_ID
        if configured:
            return (
                configured if configured.startswith("accounts/") else f"accounts/{configured}"
            )

        # Fall back: list accounts and pick the first one.
        self.log.info("gbp_listing_accounts", reason="no account_id provided")
        data = self._get("https://mybusinessaccountmanagement.googleapis.com/v1/accounts")
        accounts = data.get("accounts", [])
        if not accounts:
            raise RuntimeError(
                "No Business Profile accounts found for this Google account. "
                "Verify that the OAuth credentials belong to a GBP owner/manager."
            )
        chosen = accounts[0]["name"]
        self.log.info("gbp_auto_selected_account", account=chosen)
        return chosen

    # ------------------------------------------------------------------
    # Static helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _default_dates(
        start_date: date | None,
        end_date: date | None,
    ) -> tuple[date, date]:
        """Return (start, end) defaulting to the last 90 days."""
        if end_date is None:
            end_date = date.today() - timedelta(days=1)  # yesterday (latest available)
        if start_date is None:
            start_date = end_date - timedelta(days=_DEFAULT_LOOKBACK_DAYS - 1)
        return start_date, end_date

    @staticmethod
    def _date_to_proto(d: date) -> dict[str, int]:
        """Convert a Python date to the ``google.type.Date`` proto dict."""
        return {"year": d.year, "month": d.month, "day": d.day}

    @staticmethod
    def _proto_to_date(proto: dict[str, int]) -> date:
        """Convert a ``google.type.Date`` proto dict to a Python date."""
        return date(proto["year"], proto["month"], proto["day"])

    # ------------------------------------------------------------------
    # Public: Locations
    # ------------------------------------------------------------------

    def get_locations(
        self,
        account_id: str | None = None,
    ) -> list[BusinessProfileRecord]:
        """List all locations under *account_id*.

        Parameters
        ----------
        account_id:
            GBP account resource name or numeric ID.  Falls back to
            ``GBP_ACCOUNT_ID`` from settings, then auto-discovers.

        Returns
        -------
        list[BusinessProfileRecord]
            One record per location, normalised into the platform model.
        """
        account = self._resolve_account_id(account_id)
        self.log.info("gbp_listing_locations", account=account)

        url = f"{_BIZ_INFO_BASE}/{account}/locations"
        params: dict[str, Any] = {
            "readMask": (
                "name,title,storeCode,phoneNumbers,websiteUri,"
                "storefrontAddress,categories,latlng,metadata,profile"
            ),
            "pageSize": 100,
        }

        records: list[BusinessProfileRecord] = []
        while True:
            data = self._get(url, params=params)
            for loc in data.get("locations", []):
                records.append(self._parse_location(loc, account))
            next_page = data.get("nextPageToken")
            if not next_page:
                break
            params["pageToken"] = next_page

        self.log.info("gbp_locations_fetched", count=len(records))
        return records

    def _parse_location(
        self, raw: dict[str, Any], account: str
    ) -> BusinessProfileRecord:
        """Normalise a raw location JSON dict into a BusinessProfileRecord."""
        resource_name = raw.get("name", "")
        # Extract numeric location ID from "locations/12345"
        location_id = resource_name.rsplit("/", 1)[-1] if "/" in resource_name else resource_name
        account_id = account.rsplit("/", 1)[-1] if "/" in account else account

        address_obj = raw.get("storefrontAddress", {})
        address_lines = address_obj.get("addressLines", [])
        city = address_obj.get("locality", "")
        state = address_obj.get("administrativeArea", "")
        postal_code = address_obj.get("postalCode", "")
        country = address_obj.get("regionCode", "")
        full_address = ", ".join(filter(None, [*address_lines, city, state, postal_code, country]))

        categories = raw.get("categories", {})
        primary_cat = categories.get("primaryCategory", {}).get("displayName", "")
        additional_cats = [
            c.get("displayName", "") for c in categories.get("additionalCategories", [])
        ]

        latlng = raw.get("latlng", {})
        metadata = raw.get("metadata", {})

        phones = raw.get("phoneNumbers", {})
        primary_phone = phones.get("primaryPhone", "")

        return BusinessProfileRecord(
            account_id=account_id,
            location_id=location_id,
            name=resource_name,
            title=raw.get("title", ""),
            address=full_address,
            address_lines=address_lines,
            city=city,
            state=state,
            postal_code=postal_code,
            country=country,
            phone=primary_phone,
            website=raw.get("websiteUri", ""),
            primary_category=primary_cat,
            additional_categories=additional_cats,
            latitude=latlng.get("latitude"),
            longitude=latlng.get("longitude"),
            is_verified=metadata.get("hasVoiceOfMerchant", False),
            place_id=metadata.get("placeId"),
        )

    # ------------------------------------------------------------------
    # Public: Performance
    # ------------------------------------------------------------------

    def get_performance(
        self,
        location_name: str,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[LocalPerformanceRecord]:
        """Fetch daily performance metrics for a location.

        Uses the ``dailyMetrics:timeSeries`` endpoint of the Business
        Profile Performance API.

        Parameters
        ----------
        location_name:
            Full resource name, e.g. ``locations/12345``.
        start_date, end_date:
            Inclusive date range.  Defaults to the last 90 days.

        Returns
        -------
        list[LocalPerformanceRecord]
            One record per day in the requested range.
        """
        start, end = self._default_dates(start_date, end_date)
        if not location_name.startswith("locations/"):
            location_name = f"locations/{location_name}"

        self.log.info(
            "gbp_fetching_performance",
            location=location_name,
            start=str(start),
            end=str(end),
        )

        # Build dailyMetrics timeSeries URL with comma-separated metrics
        metrics_param = ",".join(_DAILY_METRICS)
        url = (
            f"{_PERF_BASE}/{location_name}:getDailyMetricsTimeSeries"
        )
        params: dict[str, Any] = {
            "dailyMetrics": metrics_param,
            "dailyRange.startDate.year": start.year,
            "dailyRange.startDate.month": start.month,
            "dailyRange.startDate.day": start.day,
            "dailyRange.endDate.year": end.year,
            "dailyRange.endDate.month": end.month,
            "dailyRange.endDate.day": end.day,
        }

        data = self._get(url, params=params)

        # Collect metric values keyed by date string
        # The API returns one timeSeries per metric inside
        # ``dailyMetricTimeSeries``.
        daily: dict[str, dict[str, int]] = {}
        for series in data.get("timeSeries", []):
            metric_name = series.get("dailyMetric", "")
            field = _METRIC_FIELD_MAP.get(metric_name)
            if field is None:
                continue
            for point in series.get("timeSeries", {}).get("datedValues", []):
                d = self._proto_to_date(point.get("date", {}))
                key = d.isoformat()
                daily.setdefault(key, {})
                daily[key][field] = int(point.get("value", 0))

        # Convert aggregated dict → list of records
        location_id = location_name.rsplit("/", 1)[-1]
        records: list[LocalPerformanceRecord] = []
        for date_str in sorted(daily):
            vals = daily[date_str]
            ds = vals.get("desktop_search_impressions", 0)
            ms = vals.get("mobile_search_impressions", 0)
            dm = vals.get("desktop_maps_impressions", 0)
            mm = vals.get("mobile_maps_impressions", 0)
            records.append(
                LocalPerformanceRecord(
                    location_id=location_id,
                    date=date.fromisoformat(date_str),
                    desktop_search_impressions=ds,
                    mobile_search_impressions=ms,
                    desktop_maps_impressions=dm,
                    mobile_maps_impressions=mm,
                    search_impressions=ds + ms,
                    maps_impressions=dm + mm,
                    call_clicks=vals.get("call_clicks", 0),
                    website_clicks=vals.get("website_clicks", 0),
                    direction_requests=vals.get("direction_requests", 0),
                )
            )

        self.log.info("gbp_performance_fetched", days=len(records))
        return records

    # ------------------------------------------------------------------
    # Public: Search Keywords
    # ------------------------------------------------------------------

    def get_search_keywords(
        self,
        location_name: str,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch search keyword impressions for a location.

        Uses the ``searchkeywords.impressions.monthly`` endpoint.  This
        API may not be available for all locations or may require
        additional enablement.

        TODO: This endpoint has limited availability.  Google has been
        rolling it out gradually; some accounts may receive a 404 or
        empty result.  Fall back gracefully.

        Parameters
        ----------
        location_name:
            Full resource name, e.g. ``locations/12345``.

        Returns
        -------
        list[dict]
            Raw keyword impression records as returned by the API.
        """
        start, end = self._default_dates(start_date, end_date)
        if not location_name.startswith("locations/"):
            location_name = f"locations/{location_name}"

        self.log.info(
            "gbp_fetching_search_keywords",
            location=location_name,
            start=str(start),
            end=str(end),
        )

        url = (
            f"{_PERF_BASE}/{location_name}/searchkeywords/impressions/monthly"
        )
        params: dict[str, Any] = {
            "monthlyRange.startMonth.year": start.year,
            "monthlyRange.startMonth.month": start.month,
            "monthlyRange.endMonth.year": end.year,
            "monthlyRange.endMonth.month": end.month,
            "pageSize": 300,
        }

        keywords: list[dict[str, Any]] = []
        try:
            while True:
                data = self._get(url, params=params)
                for kw in data.get("searchKeywordsCounts", []):
                    keywords.append({
                        "keyword": kw.get("searchKeyword", ""),
                        "impressions": kw.get("insightsValue", {}).get("value", 0),
                        "month": kw.get("insightsValue", {}).get("threshold"),
                    })
                next_page = data.get("nextPageToken")
                if not next_page:
                    break
                params["pageToken"] = next_page
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                self.log.warning(
                    "gbp_search_keywords_not_available",
                    location=location_name,
                    hint="The searchkeywords endpoint may not be enabled for this location.",
                )
                return []
            raise

        self.log.info("gbp_search_keywords_fetched", count=len(keywords))
        return keywords

    # ------------------------------------------------------------------
    # Public: Reviews
    # ------------------------------------------------------------------

    def get_reviews(
        self,
        location_name: str,
    ) -> list[dict[str, Any]]:
        """Fetch reviews for a location for downstream sentiment analysis.

        TODO: The ``mybusiness`` v4 reviews endpoint was deprecated in
        favour of the Account Management API.  Check the latest migration
        guide: https://developers.google.com/my-business/content/review-data

        Parameters
        ----------
        location_name:
            Full resource name, e.g. ``accounts/123/locations/456`` or
            ``locations/456``.

        Returns
        -------
        list[dict]
            Raw review dicts including ``comment``, ``starRating``,
            ``createTime``, and ``reviewReply`` (if any).
        """
        # The reviews endpoint sits on the Account Management API (v1)
        if not location_name.startswith("accounts/"):
            # Need the full path; try using the configured account
            account = self._resolve_account_id()
            location_name = f"{account}/{location_name}"

        self.log.info("gbp_fetching_reviews", location=location_name)

        url = (
            f"https://mybusiness.googleapis.com/v4/{location_name}/reviews"
        )
        params: dict[str, Any] = {"pageSize": 50}

        reviews: list[dict[str, Any]] = []
        try:
            while True:
                data = self._get(url, params=params)
                for review in data.get("reviews", []):
                    reviews.append({
                        "review_id": review.get("reviewId", ""),
                        "reviewer_name": review.get("reviewer", {}).get("displayName", ""),
                        "star_rating": review.get("starRating", ""),
                        "comment": review.get("comment", ""),
                        "create_time": review.get("createTime", ""),
                        "update_time": review.get("updateTime", ""),
                        "reply": review.get("reviewReply", {}).get("comment", ""),
                        "reply_time": review.get("reviewReply", {}).get("updateTime", ""),
                    })
                next_page = data.get("nextPageToken")
                if not next_page:
                    break
                params["pageToken"] = next_page
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (403, 404):
                self.log.warning(
                    "gbp_reviews_not_available",
                    location=location_name,
                    status=exc.response.status_code,
                    hint=(
                        "Reviews may not be accessible. Ensure the account "
                        "has Owner/Manager access and the Reviews API is enabled."
                    ),
                )
                return []
            raise

        self.log.info("gbp_reviews_fetched", count=len(reviews))
        return reviews
