"""Google Ads connector using the google-ads Python client library.

Provides methods to fetch campaign, ad group, keyword, and search term data
via GAQL queries, normalizing results into pydantic models.
"""

from __future__ import annotations

from typing import Any

import structlog
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

from audit_platform.auth.oauth import get_oauth_credentials
from audit_platform.config import Settings
from audit_platform.connectors.base import BaseConnector
from audit_platform.models.ppc import (
    AdGroupRecord,
    CampaignRecord,
    KeywordPPCRecord,
    SearchTermRecord,
)

logger = structlog.get_logger(__name__)


def _micros_to_dollars(micros: int) -> float:
    """Convert Google Ads cost micros to dollars."""
    return micros / 1_000_000


def _safe_enum_name(enum_value: Any) -> str:
    """Extract the name from a protobuf enum value, falling back to str."""
    return getattr(enum_value, "name", str(enum_value))


class GoogleAdsConnector(BaseConnector):
    """Connector for the Google Ads API.

    Initializes a GoogleAdsClient using OAuth credentials from settings and
    exposes methods that return lists of normalized pydantic models.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)
        self._ads_client: GoogleAdsClient | None = None

    # ------------------------------------------------------------------
    # Client initialisation
    # ------------------------------------------------------------------

    def _get_client(self) -> GoogleAdsClient:
        """Lazily build and return a GoogleAdsClient."""
        if self._ads_client is not None:
            return self._ads_client

        s = self.settings

        if not s.GOOGLE_ADS_DEVELOPER_TOKEN:
            raise ValueError(
                "GOOGLE_ADS_DEVELOPER_TOKEN is not configured. "
                "Set it in your .env file or environment variables."
            )
        if not s.GOOGLE_CLIENT_ID or not s.GOOGLE_CLIENT_SECRET:
            raise ValueError(
                "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required. "
                "Set them in your .env file or environment variables."
            )
        if not s.GOOGLE_REFRESH_TOKEN:
            raise ValueError(
                "GOOGLE_REFRESH_TOKEN is not configured. "
                "Set it in your .env file or environment variables."
            )

        credentials = get_oauth_credentials(
            client_id=s.GOOGLE_CLIENT_ID,
            client_secret=s.GOOGLE_CLIENT_SECRET,
            refresh_token=s.GOOGLE_REFRESH_TOKEN,
        )

        config: dict[str, Any] = {
            "developer_token": s.GOOGLE_ADS_DEVELOPER_TOKEN,
            "client_id": s.GOOGLE_CLIENT_ID,
            "client_secret": s.GOOGLE_CLIENT_SECRET,
            "refresh_token": s.GOOGLE_REFRESH_TOKEN,
            "use_proto_plus": True,
        }
        if s.GOOGLE_ADS_LOGIN_CUSTOMER_ID:
            config["login_customer_id"] = s.GOOGLE_ADS_LOGIN_CUSTOMER_ID

        self._ads_client = GoogleAdsClient.load_from_dict(config)
        self.logger.info(
            "google_ads_client_initialized",
            login_customer_id=s.GOOGLE_ADS_LOGIN_CUSTOMER_ID or "(default)",
        )
        return self._ads_client

    @property
    def _default_customer_id(self) -> str:
        """Return the configured customer ID, raising if unset."""
        cid = self.settings.GOOGLE_ADS_CUSTOMER_ID
        if not cid:
            raise ValueError(
                "GOOGLE_ADS_CUSTOMER_ID is not configured and no customer_id "
                "was passed explicitly. Set it in your .env file."
            )
        return cid

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _search(self, customer_id: str, query: str) -> list[Any]:
        """Execute a GAQL search query and return all result rows.

        Uses the search (not stream) method so we get a plain list of
        GoogleAdsRow objects that are easy to iterate.
        """
        client = self._get_client()
        service = client.get_service("GoogleAdsService")

        self.logger.debug("gaql_search", customer_id=customer_id, query=query)

        try:
            response = service.search(customer_id=customer_id, query=query)
            return list(response)
        except GoogleAdsException as exc:
            self.logger.error(
                "google_ads_api_error",
                customer_id=customer_id,
                query=query[:200],
                errors=[
                    {
                        "error_code": str(e.error_code),
                        "message": e.message,
                    }
                    for e in exc.failure.errors
                ],
            )
            raise

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def get_campaigns(
        self,
        customer_id: str | None = None,
        date_range: str = "LAST_30_DAYS",
    ) -> list[CampaignRecord]:
        """Fetch campaign-level performance data.

        Args:
            customer_id: Google Ads customer ID (digits only). Falls back to
                GOOGLE_ADS_CUSTOMER_ID from settings.
            date_range: GAQL date range literal, e.g. LAST_30_DAYS, LAST_7_DAYS.

        Returns:
            List of CampaignRecord models with metrics in dollars.
        """
        cid = customer_id or self._default_customer_id

        query = f"""
            SELECT
                campaign.id,
                campaign.name,
                campaign.status,
                campaign.campaign_budget,
                campaign.bidding_strategy_type,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.cost_per_conversion
            FROM campaign
            WHERE segments.date DURING {date_range}
        """

        rows = self._search(cid, query)
        records: list[CampaignRecord] = []

        for row in rows:
            campaign = row.campaign
            m = row.metrics

            # Retrieve budget amount if the resource is populated
            budget_amount = 0.0
            try:
                budget_amount = _micros_to_dollars(campaign.campaign_budget)
            except (AttributeError, TypeError):
                # campaign_budget is a resource name string; amount needs
                # a separate call.  We store 0 and let callers hydrate later.
                pass

            cost_per_conv = (
                _micros_to_dollars(int(m.cost_per_conversion))
                if m.cost_per_conversion
                else None
            )

            records.append(
                CampaignRecord(
                    campaign_id=str(campaign.id),
                    name=campaign.name,
                    status=_safe_enum_name(campaign.status),
                    budget_amount=budget_amount,
                    bidding_strategy=_safe_enum_name(campaign.bidding_strategy_type),
                    impressions=m.impressions,
                    clicks=m.clicks,
                    cost=_micros_to_dollars(m.cost_micros),
                    conversions=m.conversions,
                    cost_per_conversion=cost_per_conv,
                )
            )

        self.logger.info("campaigns_fetched", count=len(records), date_range=date_range)
        return records

    def get_ad_groups(
        self,
        campaign_id: str | None = None,
        customer_id: str | None = None,
        date_range: str = "LAST_30_DAYS",
    ) -> list[AdGroupRecord]:
        """Fetch ad-group-level performance data.

        Args:
            campaign_id: Optional campaign ID to filter by.
            customer_id: Google Ads customer ID. Falls back to settings.
            date_range: GAQL date range literal.

        Returns:
            List of AdGroupRecord models.
        """
        cid = customer_id or self._default_customer_id

        where_clauses = [f"segments.date DURING {date_range}"]
        if campaign_id:
            where_clauses.append(f"campaign.id = {campaign_id}")

        where = " AND ".join(where_clauses)

        query = f"""
            SELECT
                ad_group.id,
                ad_group.name,
                ad_group.status,
                campaign.id,
                campaign.name,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.ctr,
                metrics.average_cpc
            FROM ad_group
            WHERE {where}
        """

        rows = self._search(cid, query)
        records: list[AdGroupRecord] = []

        for row in rows:
            ag = row.ad_group
            m = row.metrics

            records.append(
                AdGroupRecord(
                    ad_group_id=str(ag.id),
                    campaign_id=str(row.campaign.id),
                    name=ag.name,
                    status=_safe_enum_name(ag.status),
                    impressions=m.impressions,
                    clicks=m.clicks,
                    cost=_micros_to_dollars(m.cost_micros),
                    conversions=m.conversions,
                    ctr=m.ctr,
                    avg_cpc=_micros_to_dollars(m.average_cpc),
                )
            )

        self.logger.info(
            "ad_groups_fetched",
            count=len(records),
            campaign_id=campaign_id,
            date_range=date_range,
        )
        return records

    def get_keywords(
        self,
        campaign_id: str | None = None,
        customer_id: str | None = None,
        date_range: str = "LAST_30_DAYS",
    ) -> list[KeywordPPCRecord]:
        """Fetch keyword-level performance data including quality score.

        Args:
            campaign_id: Optional campaign ID to filter by.
            customer_id: Google Ads customer ID. Falls back to settings.
            date_range: GAQL date range literal.

        Returns:
            List of KeywordPPCRecord models.
        """
        cid = customer_id or self._default_customer_id

        where_clauses = [
            f"segments.date DURING {date_range}",
            "ad_group_criterion.type = KEYWORD",
        ]
        if campaign_id:
            where_clauses.append(f"campaign.id = {campaign_id}")

        where = " AND ".join(where_clauses)

        query = f"""
            SELECT
                ad_group_criterion.criterion_id,
                ad_group_criterion.keyword.text,
                ad_group_criterion.keyword.match_type,
                ad_group_criterion.status,
                ad_group_criterion.quality_info.quality_score,
                ad_group.id,
                ad_group.name,
                campaign.id,
                campaign.name,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions
            FROM keyword_view
            WHERE {where}
        """

        rows = self._search(cid, query)
        records: list[KeywordPPCRecord] = []

        for row in rows:
            crit = row.ad_group_criterion
            m = row.metrics

            # Quality score is 0 when not available
            qs = crit.quality_info.quality_score if crit.quality_info.quality_score else None

            records.append(
                KeywordPPCRecord(
                    keyword_text=crit.keyword.text,
                    match_type=_safe_enum_name(crit.keyword.match_type),
                    ad_group_id=str(row.ad_group.id),
                    campaign_id=str(row.campaign.id),
                    quality_score=qs,
                    impressions=m.impressions,
                    clicks=m.clicks,
                    cost=_micros_to_dollars(m.cost_micros),
                    conversions=m.conversions,
                    status=_safe_enum_name(crit.status),
                )
            )

        self.logger.info(
            "keywords_fetched",
            count=len(records),
            campaign_id=campaign_id,
            date_range=date_range,
        )
        return records

    def get_search_terms(
        self,
        campaign_id: str | None = None,
        customer_id: str | None = None,
        date_range: str = "LAST_30_DAYS",
    ) -> list[SearchTermRecord]:
        """Fetch the search terms report.

        Args:
            campaign_id: Optional campaign ID to filter by.
            customer_id: Google Ads customer ID. Falls back to settings.
            date_range: GAQL date range literal.

        Returns:
            List of SearchTermRecord models.
        """
        cid = customer_id or self._default_customer_id

        where_clauses = [f"segments.date DURING {date_range}"]
        if campaign_id:
            where_clauses.append(f"campaign.id = {campaign_id}")

        where = " AND ".join(where_clauses)

        query = f"""
            SELECT
                search_term_view.search_term,
                campaign.id,
                campaign.name,
                ad_group.id,
                ad_group.name,
                segments.keyword.info.match_type,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions
            FROM search_term_view
            WHERE {where}
        """

        rows = self._search(cid, query)
        records: list[SearchTermRecord] = []

        for row in rows:
            m = row.metrics

            records.append(
                SearchTermRecord(
                    search_term=row.search_term_view.search_term,
                    campaign_id=str(row.campaign.id),
                    ad_group_id=str(row.ad_group.id),
                    impressions=m.impressions,
                    clicks=m.clicks,
                    cost=_micros_to_dollars(m.cost_micros),
                    conversions=m.conversions,
                    match_type=_safe_enum_name(row.segments.keyword.info.match_type),
                )
            )

        self.logger.info(
            "search_terms_fetched",
            count=len(records),
            campaign_id=campaign_id,
            date_range=date_range,
        )
        return records

    def get_campaign_performance(
        self,
        campaign_id: str,
        customer_id: str | None = None,
        date_range: str = "LAST_30_DAYS",
    ) -> dict[str, Any]:
        """Fetch daily performance metrics for a single campaign.

        Args:
            campaign_id: The campaign ID to retrieve performance for.
            customer_id: Google Ads customer ID. Falls back to settings.
            date_range: GAQL date range literal.

        Returns:
            Dict with ``campaign_id``, ``campaign_name``, and ``daily``
            (a list of dicts, one per day, sorted by date).
        """
        cid = customer_id or self._default_customer_id

        query = f"""
            SELECT
                campaign.id,
                campaign.name,
                segments.date,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.ctr,
                metrics.average_cpc,
                metrics.cost_per_conversion
            FROM campaign
            WHERE campaign.id = {campaign_id}
                AND segments.date DURING {date_range}
            ORDER BY segments.date ASC
        """

        rows = self._search(cid, query)

        daily: list[dict[str, Any]] = []
        campaign_name = ""

        for row in rows:
            campaign_name = row.campaign.name
            m = row.metrics

            daily.append(
                {
                    "date": row.segments.date,
                    "impressions": m.impressions,
                    "clicks": m.clicks,
                    "cost": _micros_to_dollars(m.cost_micros),
                    "conversions": m.conversions,
                    "ctr": m.ctr,
                    "avg_cpc": _micros_to_dollars(m.average_cpc),
                    "cost_per_conversion": (
                        _micros_to_dollars(int(m.cost_per_conversion))
                        if m.cost_per_conversion
                        else None
                    ),
                }
            )

        self.logger.info(
            "campaign_performance_fetched",
            campaign_id=campaign_id,
            days=len(daily),
        )

        return {
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "daily": daily,
        }

    def get_recommendations(
        self,
        customer_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch active recommendations from Google Ads.

        Returns raw recommendation data as a list of dicts containing
        resource_name, type, impact, and campaign info.

        Args:
            customer_id: Google Ads customer ID. Falls back to settings.

        Returns:
            List of dicts, one per recommendation.
        """
        cid = customer_id or self._default_customer_id

        query = """
            SELECT
                recommendation.resource_name,
                recommendation.type,
                recommendation.impact,
                recommendation.campaign_budget_recommendation,
                recommendation.keyword_recommendation,
                recommendation.text_ad_recommendation,
                recommendation.campaign
            FROM recommendation
        """

        rows = self._search(cid, query)
        results: list[dict[str, Any]] = []

        for row in rows:
            rec = row.recommendation
            entry: dict[str, Any] = {
                "resource_name": rec.resource_name,
                "type": _safe_enum_name(rec.type),
                "campaign": rec.campaign,
            }

            # Include impact metrics when available
            if rec.impact and rec.impact.base_metrics:
                bm = rec.impact.base_metrics
                entry["impact"] = {
                    "impressions": bm.impressions.value if bm.impressions else None,
                    "clicks": bm.clicks.value if bm.clicks else None,
                    "cost_micros": bm.cost_micros.value if bm.cost_micros else None,
                    "conversions": bm.conversions.value if bm.conversions else None,
                }

            results.append(entry)

        self.logger.info("recommendations_fetched", count=len(results))
        return results
