#!/usr/bin/env python3
"""Test GA4 connector independently.

Run from the platform directory:
    python scripts/test_ga4.py
    python scripts/test_ga4.py --method landing_pages
    python scripts/test_ga4.py --method custom --dimensions pagePath --metrics sessions screenPageViews
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
from audit_platform.connectors.ga4 import GA4Connector
from audit_platform.utils.logging import setup_logging


AVAILABLE_METHODS = [
    "landing_pages",
    "acquisition",
    "page_performance",
    "devices",
    "custom",
]


def _dump(label: str, data: list[dict]) -> None:
    """Pretty-print a labelled data block as JSON."""
    print(f"\n{'=' * 60}")
    print(f"  {label}")
    print(f"{'=' * 60}")
    print(f"  ({len(data)} row(s))\n")
    print(json.dumps(data, indent=2, default=str))


def run_method(
    connector: GA4Connector,
    method: str,
    property_id: str | None = None,
    date_start: str = "30daysAgo",
    date_end: str = "today",
    dimensions: list[str] | None = None,
    metrics: list[str] | None = None,
) -> None:
    """Execute a single connector method and print results."""
    if method == "landing_pages":
        result = connector.get_landing_page_report(
            property_id=property_id,
            date_range_start=date_start,
            date_range_end=date_end,
        )
        _dump("Landing Page Report", result)

    elif method == "acquisition":
        result = connector.get_acquisition_report(
            property_id=property_id,
            date_range_start=date_start,
            date_range_end=date_end,
        )
        _dump("Acquisition Report", result)

    elif method == "page_performance":
        result = connector.get_page_performance(
            property_id=property_id,
            date_range_start=date_start,
            date_range_end=date_end,
        )
        _dump("Page Performance Report", result)

    elif method == "devices":
        result = connector.get_device_report(
            property_id=property_id,
            date_range_start=date_start,
            date_range_end=date_end,
        )
        _dump("Device Report", result)

    elif method == "custom":
        if not metrics:
            print("ERROR: --metrics is required for custom reports.")
            print("Example: --metrics sessions totalUsers bounceRate")
            sys.exit(1)
        result = connector.run_report(
            property_id=property_id,
            dimensions=dimensions,
            metrics=metrics,
            date_range_start=date_start,
            date_range_end=date_end,
        )
        _dump("Custom Report", result)

    else:
        print(f"ERROR: Unknown method '{method}'.")
        print(f"Available methods: {', '.join(AVAILABLE_METHODS)}")
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test GA4 connector methods interactively.",
    )
    parser.add_argument(
        "--method",
        choices=AVAILABLE_METHODS,
        default=None,
        help="Run a specific method (default: run all except 'custom').",
    )
    parser.add_argument(
        "--property-id",
        default=None,
        help="Override GA4_PROPERTY_ID from settings.",
    )
    parser.add_argument(
        "--date-start",
        default="30daysAgo",
        help="Report start date (default: 30daysAgo).",
    )
    parser.add_argument(
        "--date-end",
        default="today",
        help="Report end date (default: today).",
    )
    parser.add_argument(
        "--dimensions",
        nargs="*",
        default=None,
        help="Dimension API names for custom reports (e.g. pagePath deviceCategory).",
    )
    parser.add_argument(
        "--metrics",
        nargs="*",
        default=None,
        help="Metric API names for custom reports (e.g. sessions totalUsers).",
    )
    args = parser.parse_args()

    setup_logging("INFO")

    # ---- Load settings and validate early ----
    try:
        settings = Settings()
    except Exception as exc:
        print(f"ERROR loading settings: {exc}")
        print("Make sure you have a .env file in the platform directory with:")
        print("  GA4_PROPERTY_ID=...")
        print("  GOOGLE_SERVICE_ACCOUNT_JSON=... (preferred)")
        print("  or GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN")
        sys.exit(1)

    # Quick pre-flight check
    has_service_account = bool(settings.GOOGLE_SERVICE_ACCOUNT_JSON)
    has_oauth = bool(
        settings.GOOGLE_CLIENT_ID
        and settings.GOOGLE_CLIENT_SECRET
        and settings.GOOGLE_REFRESH_TOKEN
    )

    if not has_service_account and not has_oauth:
        print("ERROR: No credentials configured for GA4.")
        print("Set one of the following in your .env file:")
        print("  Option 1 (preferred): GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/key.json")
        print("  Option 2: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN")
        sys.exit(1)

    if not settings.GA4_PROPERTY_ID and not args.property_id:
        print("ERROR: GA4_PROPERTY_ID is not configured.")
        print("Set it in your .env file or pass --property-id.")
        sys.exit(1)

    if args.property_id:
        settings.GA4_PROPERTY_ID = args.property_id

    # ---- Initialise connector ----
    try:
        connector = GA4Connector(settings=settings)
    except Exception as exc:
        print(f"ERROR initialising GA4Connector: {exc}")
        sys.exit(1)

    # ---- Run methods ----
    if args.method:
        methods_to_run = [args.method]
    else:
        # Run all built-in reports; skip 'custom' in run-all mode
        methods_to_run = [m for m in AVAILABLE_METHODS if m != "custom"]

    for method in methods_to_run:
        try:
            run_method(
                connector,
                method=method,
                property_id=args.property_id,
                date_start=args.date_start,
                date_end=args.date_end,
                dimensions=args.dimensions,
                metrics=args.metrics,
            )
        except ValueError as exc:
            print(f"\n[CONFIG ERROR] {method}: {exc}")
        except Exception as exc:
            print(f"\n[API ERROR] {method}: {type(exc).__name__}: {exc}")

    print("\nDone.")


if __name__ == "__main__":
    main()
