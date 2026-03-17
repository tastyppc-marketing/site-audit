"""Chrome UX Report (CrUX) API connector."""

from __future__ import annotations

from typing import Any

import httpx
import structlog

from audit_platform.config import Settings
from audit_platform.connectors.base import BaseConnector
from audit_platform.models.performance import CrUXRecord

logger = structlog.get_logger(__name__)

_CRUX_ENDPOINT = "https://chromeuxreport.googleapis.com/v1/records:queryRecord"

# Mapping from CrUX API metric keys to our CrUXRecord field names.
_METRIC_P75_MAP: dict[str, str] = {
    "largest_contentful_paint": "lcp_p75",
    "interaction_to_next_paint": "inp_p75",
    "cumulative_layout_shift": "cls_p75",
    "first_contentful_paint": "fcp_p75",
    "experimental_time_to_first_byte": "ttfb_p75",
}


def _parse_crux_response(
    data: dict[str, Any],
    url_or_origin: str,
    form_factor: str | None,
) -> CrUXRecord:
    """Parse the CrUX API JSON response into a ``CrUXRecord``."""
    record_data = data.get("record", {})
    metrics = record_data.get("metrics", {})

    field_values: dict[str, float | None] = {}
    for api_key, model_field in _METRIC_P75_MAP.items():
        metric_raw = metrics.get(api_key)
        if metric_raw:
            percentiles = metric_raw.get("percentiles", {})
            p75 = percentiles.get("p75")
            field_values[model_field] = float(p75) if p75 is not None else None
        else:
            field_values[model_field] = None

    return CrUXRecord(
        url_or_origin=url_or_origin,
        form_factor=form_factor or "ALL",
        lcp_p75=field_values.get("lcp_p75"),
        inp_p75=field_values.get("inp_p75"),
        cls_p75=field_values.get("cls_p75"),
        fcp_p75=field_values.get("fcp_p75"),
        ttfb_p75=field_values.get("ttfb_p75"),
    )


class CrUXConnector(BaseConnector):
    """Connector for the Chrome UX Report API.

    Works with or without an API key.  Without a key the rate limit is
    approximately 150 requests per minute.  A key raises this and provides
    higher daily quotas.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)
        self._api_key: str | None = self.settings.CRUX_API_KEY or None

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _endpoint_url(self) -> str:
        """Build the endpoint URL, appending the API key if available."""
        if self._api_key:
            return f"{_CRUX_ENDPOINT}?key={self._api_key}"
        return _CRUX_ENDPOINT

    def _post(self, body: dict[str, Any]) -> dict[str, Any] | None:
        """Execute a POST request to the CrUX API.

        Returns the parsed JSON response, or ``None`` if the URL / origin
        has insufficient data (HTTP 404).
        """
        url = self._endpoint_url()
        self.log.debug("crux_request", body=body)

        response = self.sync_client.post(
            url,
            json=body,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 404:
            self.log.info("crux_no_data", body=body)
            return None

        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def query_url(
        self,
        url: str,
        form_factor: str | None = None,
    ) -> CrUXRecord | None:
        """Query CrUX data for a specific URL.

        Args:
            url: The page URL to query (full URL, not just an origin).
            form_factor: ``"PHONE"``, ``"DESKTOP"``, ``"TABLET"``, or
                         ``None`` for all form factors combined.

        Returns:
            A :class:`CrUXRecord` with p75 field data, or ``None`` if no
            data exists for this URL.
        """
        body: dict[str, Any] = {"url": url}
        if form_factor:
            body["formFactor"] = form_factor.upper()

        self.log.info("crux_query_url", url=url, form_factor=form_factor)
        data = self._post(body)
        if data is None:
            return None

        return _parse_crux_response(data, url_or_origin=url, form_factor=form_factor)

    def query_origin(
        self,
        origin: str,
        form_factor: str | None = None,
    ) -> CrUXRecord | None:
        """Query CrUX data for an entire origin.

        Args:
            origin: The origin to query (e.g. ``"https://www.example.com"``).
            form_factor: ``"PHONE"``, ``"DESKTOP"``, ``"TABLET"``, or ``None``.

        Returns:
            A :class:`CrUXRecord`, or ``None`` if no data exists.
        """
        body: dict[str, Any] = {"origin": origin}
        if form_factor:
            body["formFactor"] = form_factor.upper()

        self.log.info("crux_query_origin", origin=origin, form_factor=form_factor)
        data = self._post(body)
        if data is None:
            return None

        return _parse_crux_response(data, url_or_origin=origin, form_factor=form_factor)

    def get_full_vitals(self, url_or_origin: str) -> dict[str, CrUXRecord | None]:
        """Query CrUX data across all form-factor segments.

        Queries for ``PHONE``, ``DESKTOP``, and combined (no form-factor
        filter).

        Args:
            url_or_origin: A URL or origin string.  If it looks like a bare
                origin (no path beyond ``/``) an origin query is used;
                otherwise a URL query.

        Returns:
            Dict with keys ``"phone"``, ``"desktop"``, ``"all"`` mapped
            to :class:`CrUXRecord` instances (or ``None`` where no data).
        """
        # Determine whether this is a URL or an origin.
        is_origin = url_or_origin.rstrip("/").count("/") <= 2
        query_fn = self.query_origin if is_origin else self.query_url

        self.log.info(
            "crux_full_vitals_start",
            target=url_or_origin,
            mode="origin" if is_origin else "url",
        )

        results: dict[str, CrUXRecord | None] = {
            "phone": query_fn(url_or_origin, form_factor="PHONE"),
            "desktop": query_fn(url_or_origin, form_factor="DESKTOP"),
            "all": query_fn(url_or_origin, form_factor=None),
        }

        available = sum(1 for v in results.values() if v is not None)
        self.log.info(
            "crux_full_vitals_complete",
            target=url_or_origin,
            segments_with_data=available,
        )
        return results
