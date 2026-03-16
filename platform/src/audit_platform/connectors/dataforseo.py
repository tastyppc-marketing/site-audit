"""DataForSEO API connector.

Provides access to SERP, Keywords Data, Backlinks, and Domain Analytics
endpoints via the DataForSEO REST API v3.

Authentication is HTTP Basic using ``DATAFORSEO_LOGIN`` and
``DATAFORSEO_PASSWORD`` from settings.

Pricing note
------------
TODO: The Backlinks API requires a separate $100/month minimum commitment
on top of the standard DataForSEO subscription.  Ensure the account has
the Backlinks product enabled before calling backlink methods.

Reference: https://docs.dataforseo.com/v3/
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx
import structlog

from audit_platform.config import Settings
from audit_platform.connectors.base import BaseConnector
from audit_platform.models.seo import BacklinkRecord, DomainMetrics, KeywordRecord

logger = structlog.get_logger(__name__)

_BASE_URL = "https://api.dataforseo.com/v3"


class DataForSEOError(Exception):
    """Raised when the DataForSEO API returns a non-success status."""

    def __init__(self, status_code: int, status_message: str, data: Any = None) -> None:
        self.status_code = status_code
        self.status_message = status_message
        self.data = data
        super().__init__(f"DataForSEO error {status_code}: {status_message}")


class DataForSEOConnector(BaseConnector):
    """Connector for the DataForSEO REST API v3.

    Inherits ``BaseConnector`` for settings, shared httpx client, and
    logging.  All POST payloads follow the DataForSEO convention of
    sending a JSON array of task objects.

    Usage::

        with DataForSEOConnector() as dfs:
            results = dfs.get_serp("best seo tools")
            metrics = dfs.get_domain_metrics("example.com")
    """

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)
        self._login = self.settings.DATAFORSEO_LOGIN
        self._password = self.settings.DATAFORSEO_PASSWORD
        if not self._login or not self._password:
            self.logger.warning(
                "dataforseo_credentials_missing",
                hint=(
                    "Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env. "
                    "All DataForSEO calls will fail without valid credentials."
                ),
            )

    # ------------------------------------------------------------------
    # Auth / HTTP helpers
    # ------------------------------------------------------------------

    @property
    def _auth(self) -> tuple[str, str]:
        return (self._login, self._password)

    def _post(
        self,
        path: str,
        payload: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """POST *payload* to ``{_BASE_URL}{path}`` and return raw JSON.

        Raises ``httpx.HTTPStatusError`` on HTTP-level failures.
        """
        url = f"{_BASE_URL}{path}"
        self.logger.debug("dataforseo_request", url=url, tasks=len(payload))
        resp = self.http_client.post(url, json=payload, auth=self._auth)
        resp.raise_for_status()
        return resp.json()

    def _unwrap(
        self,
        raw: dict[str, Any],
        *,
        expect_single_task: bool = True,
    ) -> list[dict[str, Any]]:
        """Unwrap the standard DataForSEO response envelope.

        DataForSEO responses follow the pattern::

            {
              "status_code": 20000,
              "status_message": "Ok.",
              "tasks": [
                {
                  "status_code": 20000,
                  "result": [ ... ]
                }
              ]
            }

        This helper validates the outer and per-task status codes, then
        returns the concatenated ``result`` arrays from all tasks.

        Parameters
        ----------
        raw:
            The full JSON response dict.
        expect_single_task:
            If True (default), logs a warning when multiple tasks are
            returned unexpectedly.

        Returns
        -------
        list[dict]
            Merged result items across all tasks.

        Raises
        ------
        DataForSEOError
            If the top-level or any task-level status is not 20000.
        """
        top_code = raw.get("status_code", 0)
        top_msg = raw.get("status_message", "")
        if top_code != 20000:
            raise DataForSEOError(top_code, top_msg, raw)

        tasks = raw.get("tasks", [])
        if not tasks:
            self.logger.warning("dataforseo_empty_tasks", response=raw)
            return []

        if expect_single_task and len(tasks) > 1:
            self.logger.debug("dataforseo_multiple_tasks", count=len(tasks))

        results: list[dict[str, Any]] = []
        for task in tasks:
            task_code = task.get("status_code", 0)
            task_msg = task.get("status_message", "")
            if task_code != 20000:
                self.logger.error(
                    "dataforseo_task_error",
                    status_code=task_code,
                    status_message=task_msg,
                    task_id=task.get("id"),
                )
                raise DataForSEOError(task_code, task_msg, task)
            task_result = task.get("result")
            if task_result:
                results.extend(task_result)
        return results

    # ==================================================================
    # SERP
    # ==================================================================

    def get_serp(
        self,
        keyword: str,
        location_code: int = 2840,
        language_code: str = "en",
        device: str = "desktop",
        depth: int = 100,
    ) -> list[dict[str, Any]]:
        """Fetch a live Google organic SERP for *keyword*.

        Parameters
        ----------
        keyword:
            Search query.
        location_code:
            DataForSEO location code (2840 = United States).
        language_code:
            Two-letter language code.
        device:
            ``"desktop"`` or ``"mobile"``.
        depth:
            Number of results to request (max 700).

        Returns
        -------
        list[dict]
            Parsed SERP items with keys: ``type``, ``rank_group``,
            ``rank_absolute``, ``domain``, ``url``, ``title``,
            ``description``, ``breadcrumb``.
        """
        self.logger.info(
            "dataforseo_serp_request",
            keyword=keyword,
            location=location_code,
            device=device,
        )
        raw = self._post(
            "/serp/google/organic/live/advanced",
            [
                {
                    "keyword": keyword,
                    "location_code": location_code,
                    "language_code": language_code,
                    "device": device,
                    "depth": depth,
                }
            ],
        )
        results = self._unwrap(raw)
        items: list[dict[str, Any]] = []
        for result in results:
            for item in result.get("items", []):
                items.append({
                    "type": item.get("type", ""),
                    "rank_group": item.get("rank_group"),
                    "rank_absolute": item.get("rank_absolute"),
                    "domain": item.get("domain", ""),
                    "url": item.get("url", ""),
                    "title": item.get("title", ""),
                    "description": item.get("description", ""),
                    "breadcrumb": item.get("breadcrumb", ""),
                })
        self.logger.info("dataforseo_serp_items", keyword=keyword, count=len(items))
        return items

    def get_serp_batch(
        self,
        keywords: list[str],
        location_code: int = 2840,
        language_code: str = "en",
        device: str = "desktop",
        depth: int = 100,
    ) -> dict[str, list[dict[str, Any]]]:
        """Submit multiple keywords as a single SERP batch.

        Parameters
        ----------
        keywords:
            List of search queries.

        Returns
        -------
        dict[str, list[dict]]
            Results keyed by keyword.
        """
        self.logger.info(
            "dataforseo_serp_batch",
            keywords_count=len(keywords),
            location=location_code,
        )
        payload = [
            {
                "keyword": kw,
                "location_code": location_code,
                "language_code": language_code,
                "device": device,
                "depth": depth,
                "tag": kw,  # Use tag to map results back to keywords
            }
            for kw in keywords
        ]
        raw = self._post("/serp/google/organic/live/advanced", payload)

        # Map results back by tag (which carries the original keyword)
        top_code = raw.get("status_code", 0)
        if top_code != 20000:
            raise DataForSEOError(top_code, raw.get("status_message", ""), raw)

        by_keyword: dict[str, list[dict[str, Any]]] = {kw: [] for kw in keywords}
        for task in raw.get("tasks", []):
            task_code = task.get("status_code", 0)
            if task_code != 20000:
                self.logger.warning(
                    "dataforseo_batch_task_error",
                    status_code=task_code,
                    status_message=task.get("status_message", ""),
                    tag=task.get("data", {}).get("tag", ""),
                )
                continue
            tag = task.get("data", {}).get("tag", "")
            for result in task.get("result") or []:
                for item in result.get("items", []):
                    by_keyword.setdefault(tag, []).append({
                        "type": item.get("type", ""),
                        "rank_group": item.get("rank_group"),
                        "rank_absolute": item.get("rank_absolute"),
                        "domain": item.get("domain", ""),
                        "url": item.get("url", ""),
                        "title": item.get("title", ""),
                        "description": item.get("description", ""),
                        "breadcrumb": item.get("breadcrumb", ""),
                    })

        self.logger.info(
            "dataforseo_serp_batch_complete",
            keywords_returned=sum(1 for v in by_keyword.values() if v),
        )
        return by_keyword

    def get_local_pack(
        self,
        keyword: str,
        location_code: int = 2840,
        language_code: str = "en",
    ) -> list[dict[str, Any]]:
        """Fetch local pack results from a Google SERP for *keyword*.

        Calls the same SERP endpoint but filters to items with
        ``type == "local_pack"``.

        Returns
        -------
        list[dict]
            Local pack items only.
        """
        self.logger.info("dataforseo_local_pack_request", keyword=keyword)
        raw = self._post(
            "/serp/google/organic/live/advanced",
            [
                {
                    "keyword": keyword,
                    "location_code": location_code,
                    "language_code": language_code,
                    "device": "desktop",
                    "depth": 100,
                }
            ],
        )
        results = self._unwrap(raw)
        items: list[dict[str, Any]] = []
        for result in results:
            for item in result.get("items", []):
                if item.get("type") == "local_pack":
                    items.append(item)
        self.logger.info("dataforseo_local_pack_items", keyword=keyword, count=len(items))
        return items

    # ==================================================================
    # KEYWORDS DATA
    # ==================================================================

    def get_keyword_data(
        self,
        keywords: list[str],
        location_code: int = 2840,
        language_code: str = "en",
    ) -> list[KeywordRecord]:
        """Retrieve search volume and competition data for *keywords*.

        Uses the Google Ads Search Volume endpoint.

        Parameters
        ----------
        keywords:
            Up to 1000 keywords per request.

        Returns
        -------
        list[KeywordRecord]
            Normalised keyword records.
        """
        self.logger.info(
            "dataforseo_keyword_data",
            keywords_count=len(keywords),
            location=location_code,
        )
        raw = self._post(
            "/keywords_data/google_ads/search_volume/live",
            [
                {
                    "keywords": keywords,
                    "location_code": location_code,
                    "language_code": language_code,
                }
            ],
        )
        results = self._unwrap(raw)
        records: list[KeywordRecord] = []
        for result in results:
            for item in (result if isinstance(result, list) else [result]):
                kw = item.get("keyword", "")
                if not kw:
                    continue
                records.append(
                    KeywordRecord(
                        keyword=kw,
                        volume=item.get("search_volume"),
                        cpc=item.get("cpc"),
                        difficulty=item.get("competition_index"),
                        position=None,
                        url=None,
                        serp_features=[],
                        source="dataforseo",
                    )
                )
        self.logger.info("dataforseo_keyword_data_fetched", count=len(records))
        return records

    def get_keyword_suggestions(
        self,
        seed_keyword: str,
        location_code: int = 2840,
        language_code: str = "en",
        limit: int = 100,
    ) -> list[KeywordRecord]:
        """Get keyword suggestions (related keywords) for a seed keyword.

        Uses the Google Ads Keywords For Keywords endpoint.

        Parameters
        ----------
        seed_keyword:
            The seed keyword to expand.
        limit:
            Maximum number of suggestions to return.

        Returns
        -------
        list[KeywordRecord]
            Normalised keyword records for the suggestions.
        """
        self.logger.info(
            "dataforseo_keyword_suggestions",
            seed=seed_keyword,
            limit=limit,
        )
        raw = self._post(
            "/keywords_data/google_ads/keywords_for_keywords/live",
            [
                {
                    "keywords": [seed_keyword],
                    "location_code": location_code,
                    "language_code": language_code,
                    "include_seed_keyword": True,
                    "limit": limit,
                }
            ],
        )
        results = self._unwrap(raw)
        records: list[KeywordRecord] = []
        for result in results:
            for item in (result if isinstance(result, list) else [result]):
                kw = item.get("keyword", "")
                if not kw:
                    continue
                records.append(
                    KeywordRecord(
                        keyword=kw,
                        volume=item.get("search_volume"),
                        cpc=item.get("cpc"),
                        difficulty=item.get("competition_index"),
                        position=None,
                        url=None,
                        serp_features=[],
                        source="dataforseo",
                    )
                )
        self.logger.info("dataforseo_keyword_suggestions_fetched", count=len(records))
        return records[:limit]

    # ==================================================================
    # BACKLINKS
    # ==================================================================
    # TODO: The Backlinks API requires a $100/month minimum commitment
    # on top of the base DataForSEO subscription.  Ensure the account
    # has the Backlinks product enabled before calling these methods.

    def get_backlinks_summary(self, target: str) -> DomainMetrics:
        """Fetch a backlink profile summary for *target*.

        Parameters
        ----------
        target:
            Domain or URL to analyse (e.g. ``"example.com"``).

        Returns
        -------
        DomainMetrics
            Normalised domain-level metrics.
        """
        self.logger.info("dataforseo_backlinks_summary", target=target)
        raw = self._post(
            "/backlinks/summary/live",
            [
                {
                    "target": target,
                    "internal_list_limit": 0,
                    "backlinks_status_type": "live",
                }
            ],
        )
        results = self._unwrap(raw)
        if not results:
            self.logger.warning("dataforseo_backlinks_summary_empty", target=target)
            return DomainMetrics(domain=target, source="dataforseo")

        data = results[0]
        return DomainMetrics(
            domain=target,
            domain_rating=data.get("rank"),
            backlinks=data.get("backlinks"),
            referring_domains=data.get("referring_domains"),
            organic_traffic=data.get("estimated_paid_traffic"),
            organic_keywords=None,
            source="dataforseo",
        )

    def get_backlinks(
        self,
        target: str,
        limit: int = 100,
        order_by: list[str] | None = None,
    ) -> list[BacklinkRecord]:
        """Fetch individual backlinks pointing to *target*.

        Parameters
        ----------
        target:
            Domain or URL.
        limit:
            Maximum results (max 1000 per request).
        order_by:
            DataForSEO order_by clauses, e.g. ``["rank,desc"]``.

        Returns
        -------
        list[BacklinkRecord]
            Normalised backlink records.
        """
        if order_by is None:
            order_by = ["rank,desc"]

        self.logger.info("dataforseo_backlinks_fetch", target=target, limit=limit)
        raw = self._post(
            "/backlinks/backlinks/live",
            [
                {
                    "target": target,
                    "limit": limit,
                    "order_by": order_by,
                    "backlinks_status_type": "live",
                }
            ],
        )
        results = self._unwrap(raw)
        records: list[BacklinkRecord] = []
        for result in results:
            for item in result.get("items", []):
                first_seen_raw = item.get("first_seen")
                first_seen = None
                if first_seen_raw:
                    try:
                        first_seen = datetime.fromisoformat(
                            first_seen_raw.replace("Z", "+00:00")
                        )
                    except (ValueError, TypeError):
                        pass
                records.append(
                    BacklinkRecord(
                        source_url=item.get("url_from", ""),
                        target_url=item.get("url_to", ""),
                        anchor_text=item.get("anchor", ""),
                        domain_rating=item.get("domain_from_rank"),
                        is_dofollow=item.get("dofollow", True),
                        first_seen=first_seen,
                        source="dataforseo",
                    )
                )
        self.logger.info("dataforseo_backlinks_fetched", count=len(records))
        return records

    def get_referring_domains(
        self,
        target: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Fetch referring domains for *target*.

        Parameters
        ----------
        target:
            Domain or URL.
        limit:
            Maximum results.

        Returns
        -------
        list[dict]
            Raw referring domain records including ``domain``,
            ``rank``, ``backlinks``, ``first_seen``, etc.
        """
        self.logger.info("dataforseo_referring_domains", target=target, limit=limit)
        raw = self._post(
            "/backlinks/referring_domains/live",
            [
                {
                    "target": target,
                    "limit": limit,
                    "backlinks_status_type": "live",
                    "order_by": ["rank,desc"],
                }
            ],
        )
        results = self._unwrap(raw)
        domains: list[dict[str, Any]] = []
        for result in results:
            for item in result.get("items", []):
                domains.append({
                    "domain": item.get("domain", ""),
                    "rank": item.get("rank"),
                    "backlinks": item.get("backlinks"),
                    "first_seen": item.get("first_seen"),
                    "lost_date": item.get("lost_date"),
                    "dofollow": item.get("backlinks_nofollow", 0) == 0,
                    "broken_backlinks": item.get("broken_backlinks", 0),
                    "referring_pages": item.get("referring_pages", 0),
                })
        self.logger.info("dataforseo_referring_domains_fetched", count=len(domains))
        return domains

    def get_competitors(
        self,
        target: str,
        limit: int = 20,
    ) -> list[DomainMetrics]:
        """Find backlink-based competitors for *target*.

        Uses the ``backlinks/competitors`` endpoint which returns domains
        that share backlink sources with *target*.

        Returns
        -------
        list[DomainMetrics]
            Competitor domains with domain-level metrics.
        """
        self.logger.info("dataforseo_competitors", target=target, limit=limit)
        raw = self._post(
            "/backlinks/competitors/live",
            [
                {
                    "target": target,
                    "limit": limit,
                }
            ],
        )
        results = self._unwrap(raw)
        competitors: list[DomainMetrics] = []
        for result in results:
            for item in result.get("items", []):
                competitors.append(
                    DomainMetrics(
                        domain=item.get("domain", ""),
                        domain_rating=item.get("avg_position"),
                        backlinks=item.get("backlinks"),
                        referring_domains=item.get("referring_domains"),
                        source="dataforseo",
                    )
                )
        self.logger.info("dataforseo_competitors_fetched", count=len(competitors))
        return competitors

    def get_backlink_intersection(
        self,
        targets: list[str],
    ) -> list[dict[str, Any]]:
        """Find backlinks shared among multiple *targets*.

        Useful for identifying link opportunities: domains that link to
        competitors but not to the client.

        Parameters
        ----------
        targets:
            List of domains/URLs (2-20).  The first element is the
            "base" target; the rest are comparisons.

        Returns
        -------
        list[dict]
            Raw intersection records with per-target backlink info.
        """
        if len(targets) < 2:
            raise ValueError("backlink_intersection requires at least 2 targets")
        if len(targets) > 20:
            raise ValueError("backlink_intersection supports a maximum of 20 targets")

        self.logger.info("dataforseo_backlink_intersection", targets=targets)

        # Build the targets dict expected by the API: {1: "a.com", 2: "b.com", …}
        targets_dict: dict[str, str] = {str(i + 1): t for i, t in enumerate(targets)}

        raw = self._post(
            "/backlinks/intersection/live",
            [
                {
                    "targets": targets_dict,
                    "limit": 100,
                    "order_by": ["1.rank,desc"],
                }
            ],
        )
        results = self._unwrap(raw)
        items: list[dict[str, Any]] = []
        for result in results:
            for item in result.get("items", []):
                items.append(item)
        self.logger.info("dataforseo_intersection_fetched", count=len(items))
        return items

    # ==================================================================
    # DOMAIN ANALYTICS
    # ==================================================================

    def get_domain_metrics(self, domain: str) -> DomainMetrics:
        """Aggregate domain-level metrics from the backlinks summary.

        This is a convenience wrapper around ``get_backlinks_summary``
        that may be extended in the future to merge data from additional
        DataForSEO endpoints (e.g. Rank, Traffic analytics).

        Returns
        -------
        DomainMetrics
            Combined domain metrics.
        """
        self.logger.info("dataforseo_domain_metrics", domain=domain)
        metrics = self.get_backlinks_summary(domain)
        metrics.domain = domain
        return metrics
