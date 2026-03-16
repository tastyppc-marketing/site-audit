#!/usr/bin/env python3
"""Standalone test script for the Search Console connector.

Usage examples:
    python scripts/test_search_console.py --method query
    python scripts/test_search_console.py --method pages --days 30
    python scripts/test_search_console.py --method devices --site-url "sc-domain:example.com"
    python scripts/test_search_console.py --method countries
    python scripts/test_search_console.py --method query_pages --days 60
    python scripts/test_search_console.py --method indexing
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta

from audit_platform.config import Settings
from audit_platform.connectors.search_console import SearchConsoleConnector
from audit_platform.utils.logging import setup_logging


def _json_serialiser(obj: object) -> str:
    """Handle date/datetime serialisation for json.dumps."""
    if isinstance(obj, date):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test the Search Console connector.",
    )
    parser.add_argument(
        "--method",
        choices=["query", "pages", "devices", "countries", "query_pages", "indexing"],
        default="query",
        help="Which connector method to call (default: query).",
    )
    parser.add_argument(
        "--site-url",
        default=None,
        help="Override SEARCH_CONSOLE_SITE_URL from .env.",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=90,
        help="Number of days to look back (default: 90).",
    )
    parser.add_argument(
        "--row-limit",
        type=int,
        default=25,
        help="Maximum rows to return (default: 25 for testing).",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Log level (default: INFO).",
    )
    args = parser.parse_args()

    setup_logging(args.log_level)
    settings = Settings()

    end_date = date.today() - timedelta(days=3)
    start_date = end_date - timedelta(days=args.days)

    connector = SearchConsoleConnector(settings)

    try:
        if args.method == "query":
            print(f"\n--- Query data ({start_date} to {end_date}) ---")
            results = connector.get_query_data(
                site_url=args.site_url,
                start_date=start_date,
                end_date=end_date,
                row_limit=args.row_limit,
            )

        elif args.method == "pages":
            print(f"\n--- Page data ({start_date} to {end_date}) ---")
            results = connector.get_page_data(
                site_url=args.site_url,
                start_date=start_date,
                end_date=end_date,
                row_limit=args.row_limit,
            )

        elif args.method == "devices":
            print(f"\n--- Device data ({start_date} to {end_date}) ---")
            results = connector.get_device_data(
                site_url=args.site_url,
                start_date=start_date,
                end_date=end_date,
            )

        elif args.method == "countries":
            print(f"\n--- Country data ({start_date} to {end_date}) ---")
            results = connector.get_country_data(
                site_url=args.site_url,
                start_date=start_date,
                end_date=end_date,
            )

        elif args.method == "query_pages":
            print(f"\n--- Query + Page data ({start_date} to {end_date}) ---")
            results = connector.get_query_page_data(
                site_url=args.site_url,
                start_date=start_date,
                end_date=end_date,
                row_limit=args.row_limit,
            )

        elif args.method == "indexing":
            print("\n--- Indexing status ---")
            results = connector.get_indexing_status(site_url=args.site_url)

        else:
            print(f"Unknown method: {args.method}", file=sys.stderr)
            sys.exit(1)

        print(json.dumps(results, indent=2, default=_json_serialiser))
        if isinstance(results, list):
            print(f"\nTotal rows: {len(results)}")

    except Exception as exc:
        print(f"\nError: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        connector.close()


if __name__ == "__main__":
    main()
