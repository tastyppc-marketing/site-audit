#!/usr/bin/env python3
"""Test Google Ads connector independently.

Run from the platform directory:
    python scripts/test_google_ads.py
    python scripts/test_google_ads.py --method campaigns
    python scripts/test_google_ads.py --method keywords --campaign-id 123456789
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Ensure the src directory is on the path when running as a script
_SCRIPT_DIR = Path(__file__).resolve().parent
_SRC_DIR = _SCRIPT_DIR.parent / "src"
if str(_SRC_DIR) not in sys.path:
    sys.path.insert(0, str(_SRC_DIR))

from audit_platform.config import Settings
from audit_platform.connectors.google_ads import GoogleAdsConnector
from audit_platform.utils.logging import setup_logging


AVAILABLE_METHODS = [
    "campaigns",
    "ad_groups",
    "keywords",
    "search_terms",
    "campaign_performance",
    "recommendations",
]


def _dump(label: str, data: object) -> None:
    """Pretty-print a labelled data block as JSON."""
    print(f"\n{'=' * 60}")
    print(f"  {label}")
    print(f"{'=' * 60}")
    if hasattr(data, "__len__"):
        print(f"  ({len(data)} record(s))\n")  # type: ignore[arg-type]
    # Use pydantic .model_dump() for model lists, else plain serialisation
    if isinstance(data, list):
        serialisable = [
            item.model_dump() if hasattr(item, "model_dump") else item for item in data
        ]
    elif isinstance(data, dict):
        serialisable = data
    else:
        serialisable = str(data)
    print(json.dumps(serialisable, indent=2, default=str))


def run_method(
    connector: GoogleAdsConnector,
    method: str,
    campaign_id: str | None = None,
    date_range: str = "LAST_30_DAYS",
) -> None:
    """Execute a single connector method and print results."""
    if method == "campaigns":
        result = connector.get_campaigns(date_range=date_range)
        _dump("Campaigns", result)

    elif method == "ad_groups":
        result = connector.get_ad_groups(campaign_id=campaign_id, date_range=date_range)
        _dump("Ad Groups", result)

    elif method == "keywords":
        result = connector.get_keywords(campaign_id=campaign_id, date_range=date_range)
        _dump("Keywords", result)

    elif method == "search_terms":
        result = connector.get_search_terms(campaign_id=campaign_id, date_range=date_range)
        _dump("Search Terms", result)

    elif method == "campaign_performance":
        if not campaign_id:
            print("ERROR: --campaign-id is required for campaign_performance")
            sys.exit(1)
        result = connector.get_campaign_performance(
            campaign_id=campaign_id, date_range=date_range
        )
        _dump("Campaign Performance (daily)", result)

    elif method == "recommendations":
        result = connector.get_recommendations()
        _dump("Recommendations", result)

    else:
        print(f"ERROR: Unknown method '{method}'.")
        print(f"Available methods: {', '.join(AVAILABLE_METHODS)}")
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test Google Ads connector methods interactively.",
    )
    parser.add_argument(
        "--method",
        choices=AVAILABLE_METHODS,
        default=None,
        help="Run a specific method (default: run all).",
    )
    parser.add_argument(
        "--campaign-id",
        default=None,
        help="Campaign ID for methods that accept one.",
    )
    parser.add_argument(
        "--date-range",
        default="LAST_30_DAYS",
        help="GAQL date range literal (default: LAST_30_DAYS).",
    )
    parser.add_argument(
        "--customer-id",
        default=None,
        help="Override GOOGLE_ADS_CUSTOMER_ID from settings.",
    )
    args = parser.parse_args()

    setup_logging("INFO")

    # ---- Load settings and validate early ----
    try:
        settings = Settings()
    except Exception as exc:
        print(f"ERROR loading settings: {exc}")
        print("Make sure you have a .env file in the platform directory with:")
        print("  GOOGLE_CLIENT_ID=...")
        print("  GOOGLE_CLIENT_SECRET=...")
        print("  GOOGLE_REFRESH_TOKEN=...")
        print("  GOOGLE_ADS_DEVELOPER_TOKEN=...")
        print("  GOOGLE_ADS_CUSTOMER_ID=...")
        sys.exit(1)

    # Quick pre-flight check
    missing: list[str] = []
    if not settings.GOOGLE_CLIENT_ID:
        missing.append("GOOGLE_CLIENT_ID")
    if not settings.GOOGLE_CLIENT_SECRET:
        missing.append("GOOGLE_CLIENT_SECRET")
    if not settings.GOOGLE_REFRESH_TOKEN:
        missing.append("GOOGLE_REFRESH_TOKEN")
    if not settings.GOOGLE_ADS_DEVELOPER_TOKEN:
        missing.append("GOOGLE_ADS_DEVELOPER_TOKEN")
    if not settings.GOOGLE_ADS_CUSTOMER_ID and not args.customer_id:
        missing.append("GOOGLE_ADS_CUSTOMER_ID")

    if missing:
        print("ERROR: The following required settings are missing:")
        for m in missing:
            print(f"  - {m}")
        print("\nSet them in your .env file or as environment variables.")
        sys.exit(1)

    if args.customer_id:
        settings.GOOGLE_ADS_CUSTOMER_ID = args.customer_id

    # ---- Initialise connector ----
    try:
        connector = GoogleAdsConnector(settings=settings)
    except Exception as exc:
        print(f"ERROR initialising GoogleAdsConnector: {exc}")
        sys.exit(1)

    # ---- Run methods ----
    methods_to_run = [args.method] if args.method else AVAILABLE_METHODS

    for method in methods_to_run:
        # Skip campaign_performance in "all" mode without a campaign ID
        if method == "campaign_performance" and not args.campaign_id:
            print(
                "\n[SKIP] campaign_performance requires --campaign-id; "
                "skipping in run-all mode."
            )
            continue

        try:
            run_method(
                connector,
                method=method,
                campaign_id=args.campaign_id,
                date_range=args.date_range,
            )
        except ValueError as exc:
            print(f"\n[CONFIG ERROR] {method}: {exc}")
        except Exception as exc:
            print(f"\n[API ERROR] {method}: {type(exc).__name__}: {exc}")
            # For Google Ads exceptions, show the individual errors
            if hasattr(exc, "failure"):
                for error in exc.failure.errors:
                    print(f"  -> {error.error_code}: {error.message}")

    print("\nDone.")


if __name__ == "__main__":
    main()
