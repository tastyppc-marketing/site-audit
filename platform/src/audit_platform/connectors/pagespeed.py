"""PageSpeed Insights API v5 connector."""

from __future__ import annotations

import time
from typing import Any, Sequence

import httpx
import structlog

from audit_platform.config import Settings
from audit_platform.connectors.base import BaseConnector
from audit_platform.models.performance import CoreWebVitals, PageSpeedRecord

logger = structlog.get_logger(__name__)

_PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

# Lighthouse audit IDs used to populate the model fields.
_METRIC_AUDIT_IDS: dict[str, str] = {
    "largest-contentful-paint": "lcp",
    "cumulative-layout-shift": "cls",
    "first-contentful-paint": "fcp",
    "speed-index": "speed_index",
    "total-blocking-time": "inp",        # TBT is the lab proxy for INP
    "experimental-interaction-to-next-paint": "inp",  # INP when available
    "server-response-time": "ttfb",
}


def _extract_opportunities(audits: dict[str, Any]) -> list[dict[str, Any]]:
    """Return actionable Lighthouse opportunities sorted by potential savings."""
    items: list[dict[str, Any]] = []
    for audit_id, audit in audits.items():
        details = audit.get("details", {})
        if details.get("type") != "opportunity":
            continue
        score = audit.get("score")
        if score is not None and score >= 1.0:
            continue
        savings_ms = details.get("overallSavingsMs", 0)
        savings_bytes = details.get("overallSavingsBytes")
        items.append({
            "id": audit_id,
            "title": audit.get("title", ""),
            "description": audit.get("description", ""),
            "score": score,
            "display_value": audit.get("displayValue", ""),
            "savings_ms": savings_ms,
            "savings_bytes": int(savings_bytes) if savings_bytes is not None else None,
        })
    items.sort(key=lambda o: o.get("savings_ms", 0), reverse=True)
    return items


def _extract_diagnostics(audits: dict[str, Any]) -> list[dict[str, Any]]:
    """Return non-passing diagnostic audits."""
    items: list[dict[str, Any]] = []
    for audit_id, audit in audits.items():
        details = audit.get("details", {})
        detail_type = details.get("type", "")
        score = audit.get("score")
        display_mode = audit.get("scoreDisplayMode", "")

        # Skip opportunities (handled separately), passed audits, and non-applicable.
        if detail_type == "opportunity":
            continue
        if display_mode in ("notApplicable", "manual"):
            continue
        if score is not None and score >= 1.0:
            continue
        if score is None and display_mode != "informative":
            continue

        items.append({
            "id": audit_id,
            "title": audit.get("title", ""),
            "description": audit.get("description", ""),
            "score": score,
            "display_value": audit.get("displayValue", ""),
        })
    return items


class PageSpeedConnector(BaseConnector):
    """Connector for the Google PageSpeed Insights API v5.

    Works with or without an API key.  Without a key the rate limit is
    approximately 1 request per second.  With a key the quota rises to
    roughly 25 requests per second.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)
        self._api_key: str | None = self.settings.PAGESPEED_API_KEY or None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _request_delay(self) -> float:
        """Return the inter-request delay in seconds based on key availability."""
        return 0.05 if self._api_key else 1.1

    def _build_params(
        self,
        url: str,
        strategy: str,
        categories: Sequence[str],
    ) -> list[tuple[str, str]]:
        """Build query params as a list of tuples (supports repeated category keys)."""
        params: list[tuple[str, str]] = [
            ("url", url),
            ("strategy", strategy.upper()),
        ]
        for cat in categories:
            params.append(("category", cat.upper()))
        if self._api_key:
            params.append(("key", self._api_key))
        return params

    def _parse_response(self, data: dict[str, Any], url: str, strategy: str) -> PageSpeedRecord:
        """Parse the raw PSI JSON response into a ``PageSpeedRecord``."""
        lighthouse = data.get("lighthouseResult", {})
        categories = lighthouse.get("categories", {})
        audits = lighthouse.get("audits", {})

        # Performance score (0-1 from API, we store as 0-1).
        perf_score = (categories.get("performance") or {}).get("score", 0.0) or 0.0

        # Core metrics from audit numeric values.
        lcp = (audits.get("largest-contentful-paint") or {}).get("numericValue", 0.0)
        cls_val = (audits.get("cumulative-layout-shift") or {}).get("numericValue", 0.0)
        fcp = (audits.get("first-contentful-paint") or {}).get("numericValue", 0.0)
        speed_index = (audits.get("speed-index") or {}).get("numericValue")
        ttfb = (audits.get("server-response-time") or {}).get("numericValue")

        # INP: prefer the direct INP audit; fall back to TBT as lab proxy.
        inp_raw = (audits.get("experimental-interaction-to-next-paint") or {}).get("numericValue")
        if inp_raw is None:
            inp_raw = (audits.get("total-blocking-time") or {}).get("numericValue")

        return PageSpeedRecord(
            url=url,
            strategy=strategy.lower(),
            performance_score=round(float(perf_score), 4),
            lcp=round(float(lcp), 1),
            cls=round(float(cls_val), 4),
            fcp=round(float(fcp), 1),
            speed_index=round(float(speed_index), 1) if speed_index is not None else None,
            ttfb=round(float(ttfb), 1) if ttfb is not None else None,
            inp=round(float(inp_raw), 1) if inp_raw is not None else None,
            opportunities=_extract_opportunities(audits),
            diagnostics=_extract_diagnostics(audits),
        )

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def analyze(
        self,
        url: str,
        strategy: str = "mobile",
        categories: Sequence[str] | None = None,
    ) -> PageSpeedRecord:
        """Run a PageSpeed Insights analysis for a single URL.

        Args:
            url: The fully-qualified URL to analyse.
            strategy: ``"mobile"`` or ``"desktop"``.
            categories: Lighthouse categories to evaluate.
                        Default: ``["performance"]``.

        Returns:
            A populated :class:`PageSpeedRecord`.

        Raises:
            httpx.HTTPStatusError: On non-2xx responses from the API.
        """
        cats = list(categories or ["performance"])
        params = self._build_params(url, strategy, cats)

        self.log.info("pagespeed_analyze_start", url=url, strategy=strategy, categories=cats)

        response = self._request_sync("GET", _PSI_ENDPOINT, params=params)
        data: dict[str, Any] = response.json()

        record = self._parse_response(data, url, strategy)
        self.log.info(
            "pagespeed_analyze_complete",
            url=url,
            strategy=strategy,
            score=record.performance_score,
        )
        return record

    def analyze_batch(
        self,
        urls: list[str],
        strategy: str = "mobile",
        categories: Sequence[str] | None = None,
    ) -> list[PageSpeedRecord]:
        """Analyse multiple URLs sequentially, respecting rate limits.

        Args:
            urls: URLs to analyse.
            strategy: ``"mobile"`` or ``"desktop"``.
            categories: Lighthouse categories. Default: ``["performance"]``.

        Returns:
            List of :class:`PageSpeedRecord` instances.  Failed URLs are
            logged and skipped (the list may be shorter than *urls*).
        """
        results: list[PageSpeedRecord] = []
        delay = self._request_delay()

        self.log.info(
            "pagespeed_batch_start",
            count=len(urls),
            strategy=strategy,
            delay_sec=delay,
        )

        for idx, url in enumerate(urls):
            if idx > 0:
                time.sleep(delay)
            try:
                record = self.analyze(url, strategy=strategy, categories=categories)
                results.append(record)
            except httpx.HTTPStatusError as exc:
                self.log.warning(
                    "pagespeed_batch_item_error",
                    url=url,
                    status=exc.response.status_code,
                    detail=exc.response.text[:500],
                )
            except Exception as exc:
                self.log.warning(
                    "pagespeed_batch_item_error",
                    url=url,
                    error=str(exc),
                )

        self.log.info("pagespeed_batch_complete", succeeded=len(results), total=len(urls))
        return results

    def get_core_web_vitals(self, url: str) -> CoreWebVitals:
        """Run both mobile and desktop analyses and combine into :class:`CoreWebVitals`.

        Args:
            url: The URL to analyse.

        Returns:
            A :class:`CoreWebVitals` instance with both Lighthouse results.
        """
        self.log.info("pagespeed_cwv_start", url=url)

        mobile_record: PageSpeedRecord | None = None
        desktop_record: PageSpeedRecord | None = None

        try:
            mobile_record = self.analyze(url, strategy="mobile")
        except Exception as exc:
            self.log.warning("pagespeed_cwv_mobile_error", url=url, error=str(exc))

        time.sleep(self._request_delay())

        try:
            desktop_record = self.analyze(url, strategy="desktop")
        except Exception as exc:
            self.log.warning("pagespeed_cwv_desktop_error", url=url, error=str(exc))

        cwv = CoreWebVitals(
            url=url,
            lighthouse_mobile=mobile_record,
            lighthouse_desktop=desktop_record,
        )

        self.log.info(
            "pagespeed_cwv_complete",
            url=url,
            mobile_score=mobile_record.performance_score if mobile_record else None,
            desktop_score=desktop_record.performance_score if desktop_record else None,
        )
        return cwv
