#!/usr/bin/env python3
"""Smoke-test every connector by initializing it and running a basic call.

Usage:
    python scripts/run_all.py

The script loads Settings from .env, attempts to instantiate each connector,
and calls the simplest available method. Results are printed as a summary
table at the end.
"""

from __future__ import annotations

import sys
import traceback
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# We import Settings early so we fail fast if pydantic-settings is missing.
# ---------------------------------------------------------------------------
try:
    from audit_platform.config import Settings
except ImportError:
    print(
        "Error: audit_platform is not installed.\n"
        "Run:  pip install -e '.[dev]'  from the platform/ directory.",
        file=sys.stderr,
    )
    sys.exit(1)


@dataclass
class ConnectorResult:
    name: str
    status: str = "SKIP"
    message: str = ""
    detail: str = ""


results: list[ConnectorResult] = []


def _try(name: str, fn) -> ConnectorResult:
    """Run *fn* and return a ConnectorResult."""
    result = ConnectorResult(name=name)
    try:
        fn()
        result.status = "OK"
        result.message = "Connected successfully"
    except Exception as exc:
        result.status = "FAIL"
        result.message = f"{type(exc).__name__}: {exc}"
        result.detail = traceback.format_exc()
    return result


# ---------------------------------------------------------------------------
# Individual connector probes
# ---------------------------------------------------------------------------

def probe_google_ads(settings: Settings) -> ConnectorResult:
    """Try to initialise the Google Ads client and fetch account info."""
    if not settings.GOOGLE_ADS_DEVELOPER_TOKEN:
        return ConnectorResult("Google Ads", "SKIP", "GOOGLE_ADS_DEVELOPER_TOKEN not set")

    def _run():
        from audit_platform.connectors.google_ads import GoogleAdsConnector
        connector = GoogleAdsConnector(settings)
        # Fetch campaigns for the last 7 days as a lightweight validation.
        connector.get_campaigns(date_range="LAST_7_DAYS")

    return _try("Google Ads", _run)


def probe_ga4(settings: Settings) -> ConnectorResult:
    """Try to initialise the GA4 connector and run a minimal report."""
    if not settings.GA4_PROPERTY_ID:
        return ConnectorResult("GA4", "SKIP", "GA4_PROPERTY_ID not set")

    def _run():
        from audit_platform.connectors.ga4 import GA4Connector
        connector = GA4Connector(settings)
        # Run a minimal report to verify credentials and property access.
        connector.run_report(
            metrics=["activeUsers"],
            date_range_start="7daysAgo",
            date_range_end="today",
        )

    return _try("GA4", _run)


def probe_search_console(settings: Settings) -> ConnectorResult:
    """Try to list sites via Search Console."""
    if not settings.SEARCH_CONSOLE_SITE_URL:
        return ConnectorResult("Search Console", "SKIP", "SEARCH_CONSOLE_SITE_URL not set")

    def _run():
        from audit_platform.connectors.search_console import SearchConsoleConnector
        connector = SearchConsoleConnector(settings)
        # Fetch a small query-data sample to verify credentials and property access.
        connector.get_query_data(row_limit=5)

    return _try("Search Console", _run)


def probe_pagespeed(settings: Settings) -> ConnectorResult:
    """Run a PageSpeed analysis on example.com."""
    def _run():
        from audit_platform.connectors.pagespeed import PageSpeedConnector
        connector = PageSpeedConnector(settings)
        connector.analyze("https://example.com", strategy="mobile")

    return _try("PageSpeed Insights", _run)


def probe_crux(settings: Settings) -> ConnectorResult:
    """Query CrUX for example.com origin data."""
    def _run():
        from audit_platform.connectors.crux import CrUXConnector
        connector = CrUXConnector(settings)
        connector.query_origin("https://example.com")

    return _try("CrUX", _run)


def probe_business_profile(settings: Settings) -> ConnectorResult:
    """Try to list accounts via Business Profile API."""
    if not settings.GBP_ACCOUNT_ID:
        return ConnectorResult("Business Profile", "SKIP", "GBP_ACCOUNT_ID not set")

    def _run():
        from audit_platform.connectors.business_profile import BusinessProfileConnector
        connector = BusinessProfileConnector(settings)
        # List locations under the configured account to verify access.
        connector.get_locations()

    return _try("Business Profile", _run)


def probe_dataforseo(settings: Settings) -> ConnectorResult:
    """Ping DataForSEO to verify credentials."""
    if not settings.DATAFORSEO_LOGIN:
        return ConnectorResult("DataForSEO", "SKIP", "DATAFORSEO_LOGIN not set")

    def _run():
        from audit_platform.connectors.dataforseo import DataForSEOConnector
        connector = DataForSEOConnector(settings)
        # Fetch keyword data for a single innocuous term to verify credentials.
        connector.get_keyword_data(["test"], location_code=2840)

    return _try("DataForSEO", _run)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("Loading settings from .env ...")
    try:
        settings = Settings()
    except Exception as exc:
        print(f"Failed to load settings: {exc}", file=sys.stderr)
        sys.exit(1)

    print()
    print("Probing connectors ...")
    print()

    probes = [
        probe_google_ads,
        probe_ga4,
        probe_search_console,
        probe_pagespeed,
        probe_crux,
        probe_business_profile,
        probe_dataforseo,
    ]

    for probe in probes:
        result = probe(settings)
        results.append(result)

        icon = {"OK": "[+]", "FAIL": "[-]", "SKIP": "[ ]"}[result.status]
        print(f"  {icon} {result.name:25s} {result.status:5s}  {result.message}")
        if result.detail and settings.LOG_LEVEL.upper() == "DEBUG":
            for line in result.detail.strip().splitlines():
                print(f"        {line}")

    # Summary
    ok_count = sum(1 for r in results if r.status == "OK")
    fail_count = sum(1 for r in results if r.status == "FAIL")
    skip_count = sum(1 for r in results if r.status == "SKIP")

    print()
    print("=" * 60)
    print(f"  Summary: {ok_count} OK, {fail_count} FAIL, {skip_count} SKIP")
    print("=" * 60)

    if fail_count:
        print()
        print("Failed connectors:")
        for r in results:
            if r.status == "FAIL":
                print(f"  - {r.name}: {r.message}")
        print()
        print("Tip: set LOG_LEVEL=DEBUG in .env and re-run for full tracebacks.")

    if skip_count:
        print()
        print("Skipped connectors (missing credentials):")
        for r in results:
            if r.status == "SKIP":
                print(f"  - {r.name}: {r.message}")

    print()

    # Exit non-zero only if something that was configured actually failed.
    sys.exit(1 if fail_count else 0)


if __name__ == "__main__":
    main()
