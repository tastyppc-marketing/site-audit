#!/usr/bin/env python3
"""Standalone test script for the BusinessProfileConnector.

Usage examples
--------------
List all locations (auto-discovers account):
    python scripts/test_business_profile.py --method locations

List locations for a specific account:
    python scripts/test_business_profile.py --method locations --account-id 123456789

Fetch performance metrics for a location:
    python scripts/test_business_profile.py --method performance --location-id 987654321

Fetch search keywords:
    python scripts/test_business_profile.py --method keywords --location-id 987654321

Fetch reviews:
    python scripts/test_business_profile.py --method reviews --location-id 987654321

Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN
to be set in the project .env file.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta

import structlog

from audit_platform.config import Settings
from audit_platform.connectors.business_profile import BusinessProfileConnector
from audit_platform.utils.logging import setup_logging


def _serialize(obj: object) -> str:
    """JSON-serialise a value, handling pydantic models and dates."""
    if hasattr(obj, "model_dump"):
        return json.dumps(obj.model_dump(mode="json"), indent=2, default=str)  # type: ignore[union-attr]
    return json.dumps(obj, indent=2, default=str)


def _run_locations(connector: BusinessProfileConnector, args: argparse.Namespace) -> None:
    locations = connector.get_locations(account_id=args.account_id)
    print(f"\n--- {len(locations)} location(s) found ---\n")
    for loc in locations:
        print(_serialize(loc))
        print()


def _run_performance(connector: BusinessProfileConnector, args: argparse.Namespace) -> None:
    location_id = args.location_id
    if not location_id:
        print("ERROR: --location-id is required for the 'performance' method.", file=sys.stderr)
        sys.exit(1)

    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=89)
    records = connector.get_performance(location_id, start_date=start, end_date=end)
    print(f"\n--- {len(records)} daily performance record(s) ---\n")
    for rec in records[:5]:
        print(_serialize(rec))
    if len(records) > 5:
        print(f"  ... and {len(records) - 5} more records")


def _run_keywords(connector: BusinessProfileConnector, args: argparse.Namespace) -> None:
    location_id = args.location_id
    if not location_id:
        print("ERROR: --location-id is required for the 'keywords' method.", file=sys.stderr)
        sys.exit(1)

    keywords = connector.get_search_keywords(location_id)
    print(f"\n--- {len(keywords)} keyword(s) ---\n")
    for kw in keywords[:20]:
        print(json.dumps(kw, indent=2, default=str))
    if len(keywords) > 20:
        print(f"  ... and {len(keywords) - 20} more keywords")


def _run_reviews(connector: BusinessProfileConnector, args: argparse.Namespace) -> None:
    location_id = args.location_id
    if not location_id:
        print("ERROR: --location-id is required for the 'reviews' method.", file=sys.stderr)
        sys.exit(1)

    reviews = connector.get_reviews(location_id)
    print(f"\n--- {len(reviews)} review(s) ---\n")
    for rev in reviews[:10]:
        print(json.dumps(rev, indent=2, default=str))
    if len(reviews) > 10:
        print(f"  ... and {len(reviews) - 10} more reviews")


_METHODS = {
    "locations": _run_locations,
    "performance": _run_performance,
    "keywords": _run_keywords,
    "reviews": _run_reviews,
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test the BusinessProfileConnector interactively.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--method",
        required=True,
        choices=sorted(_METHODS),
        help="API method to test.",
    )
    parser.add_argument(
        "--account-id",
        default=None,
        help="GBP account ID (numeric or full resource name). Falls back to .env.",
    )
    parser.add_argument(
        "--location-id",
        default=None,
        help="GBP location ID (numeric or full resource name). Falls back to .env.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Log level (default: INFO).",
    )
    args = parser.parse_args()

    setup_logging(args.log_level)
    log = structlog.get_logger("test_business_profile")

    settings = Settings()

    # Fall back to settings for location-id if not provided on CLI
    if args.location_id is None and settings.GBP_LOCATION_ID:
        args.location_id = settings.GBP_LOCATION_ID
    if args.account_id is None and settings.GBP_ACCOUNT_ID:
        args.account_id = settings.GBP_ACCOUNT_ID

    log.info(
        "starting_test",
        method=args.method,
        account_id=args.account_id,
        location_id=args.location_id,
    )

    try:
        with BusinessProfileConnector(settings) as connector:
            _METHODS[args.method](connector, args)
    except Exception:
        log.exception("test_failed")
        sys.exit(1)

    log.info("test_complete", method=args.method)


if __name__ == "__main__":
    main()
