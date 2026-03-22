#!/usr/bin/env python3
"""Standalone test script for the BrandMentionsConnector.

Usage examples
--------------
Search Reddit for brand mentions:
    python scripts/test_brand_mentions.py --method reddit --brand "Keller Williams"

Search the web for brand mentions:
    python scripts/test_brand_mentions.py --method web --brand "Keller Williams" --domain kellerwilliams.com

Search YouTube for brand videos:
    python scripts/test_brand_mentions.py --method youtube --brand "Keller Williams"

Check directory listings:
    python scripts/test_brand_mentions.py --method directories --brand "Keller Williams" --location "Austin, TX"

Get a review summary:
    python scripts/test_brand_mentions.py --method reviews --brand "Keller Williams" --location "Austin, TX"

Run all checks:
    python scripts/test_brand_mentions.py --method all --brand "Keller Williams" --domain kellerwilliams.com --location "Austin, TX"

No API keys are required.  All searches use free public endpoints.
"""

from __future__ import annotations

import argparse
import json
import sys

import structlog

from audit_platform.config import Settings
from audit_platform.connectors.brand_mentions import BrandMentionsConnector
from audit_platform.utils.logging import setup_logging


def _serialize(obj: object) -> str:
    """JSON-serialise a value, handling pydantic models and dates."""
    if hasattr(obj, "model_dump"):
        return json.dumps(obj.model_dump(mode="json"), indent=2, default=str)  # type: ignore[union-attr]
    return json.dumps(obj, indent=2, default=str)


def _print_items(label: str, items: list, max_display: int = 10) -> None:
    """Print a list of items with a header and optional truncation."""
    print(f"\n--- {label}: {len(items)} result(s) ---\n")
    for item in items[:max_display]:
        print(_serialize(item))
        print()
    if len(items) > max_display:
        print(f"  ... and {len(items) - max_display} more results")


# ------------------------------------------------------------------
# Method handlers
# ------------------------------------------------------------------

def _run_reddit(connector: BrandMentionsConnector, args: argparse.Namespace) -> None:
    if not args.brand:
        print("ERROR: --brand is required for 'reddit'.", file=sys.stderr)
        sys.exit(1)
    results = connector.search_reddit(args.brand, limit=25)
    _print_items(f"Reddit mentions of '{args.brand}'", results)


def _run_web(connector: BrandMentionsConnector, args: argparse.Namespace) -> None:
    if not args.brand or not args.domain:
        print("ERROR: --brand and --domain are required for 'web'.", file=sys.stderr)
        sys.exit(1)
    results = connector.search_web_mentions(args.brand, args.domain)
    _print_items(f"Web mentions of '{args.brand}'", results)


def _run_youtube(connector: BrandMentionsConnector, args: argparse.Namespace) -> None:
    if not args.brand:
        print("ERROR: --brand is required for 'youtube'.", file=sys.stderr)
        sys.exit(1)
    results = connector.search_youtube(args.brand)
    _print_items(f"YouTube results for '{args.brand}'", results)


def _run_directories(connector: BrandMentionsConnector, args: argparse.Namespace) -> None:
    if not args.brand or not args.location:
        print("ERROR: --brand and --location are required for 'directories'.", file=sys.stderr)
        sys.exit(1)
    results = connector.check_directory_listings(args.brand, args.location)
    _print_items(f"Directory listings for '{args.brand}'", results, max_display=20)


def _run_reviews(connector: BrandMentionsConnector, args: argparse.Namespace) -> None:
    if not args.brand or not args.location:
        print("ERROR: --brand and --location are required for 'reviews'.", file=sys.stderr)
        sys.exit(1)
    summary = connector.get_review_summary(args.brand, args.location)
    print(f"\n--- Review summary for '{args.brand}' ---\n")
    print(_serialize(summary))


def _run_all(connector: BrandMentionsConnector, args: argparse.Namespace) -> None:
    if not args.brand:
        print("ERROR: --brand is required for 'all'.", file=sys.stderr)
        sys.exit(1)

    print("=" * 60)
    print(f"  Brand Mentions Audit: {args.brand}")
    print("=" * 60)

    # Reddit
    print("\n[1/5] Searching Reddit...")
    results = connector.search_reddit(args.brand, limit=10)
    _print_items(f"Reddit mentions of '{args.brand}'", results, max_display=5)

    # Web mentions
    if args.domain:
        print("\n[2/5] Searching web mentions...")
        results = connector.search_web_mentions(args.brand, args.domain)
        _print_items(f"Web mentions of '{args.brand}'", results, max_display=5)
    else:
        print("\n[2/5] Skipping web mentions (--domain not provided)")

    # YouTube
    print("\n[3/5] Searching YouTube...")
    results = connector.search_youtube(args.brand, max_results=5)
    _print_items(f"YouTube results for '{args.brand}'", results, max_display=5)

    # Directory listings
    if args.location:
        print("\n[4/5] Checking directory listings...")
        results = connector.check_directory_listings(args.brand, args.location)
        _print_items(f"Directory listings for '{args.brand}'", results, max_display=20)

        print("\n[5/5] Generating review summary...")
        summary = connector.get_review_summary(args.brand, args.location)
        print(f"\n--- Review summary ---\n")
        print(_serialize(summary))
    else:
        print("\n[4/5] Skipping directory listings (--location not provided)")
        print("\n[5/5] Skipping review summary (--location not provided)")

    print("\n" + "=" * 60)
    print("  Audit complete.")
    print("=" * 60)


_METHODS = {
    "reddit": _run_reddit,
    "web": _run_web,
    "youtube": _run_youtube,
    "directories": _run_directories,
    "reviews": _run_reviews,
    "all": _run_all,
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test the BrandMentionsConnector interactively.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--method",
        required=True,
        choices=sorted(_METHODS),
        help="Test method to run.",
    )
    parser.add_argument(
        "--brand",
        default=None,
        help="Brand or business name to search for.",
    )
    parser.add_argument(
        "--domain",
        default=None,
        help="Business website domain (e.g. example.com).",
    )
    parser.add_argument(
        "--location",
        default=None,
        help="Business location (e.g. 'Austin, TX').",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Log level (default: INFO).",
    )
    args = parser.parse_args()

    setup_logging(args.log_level)
    log = structlog.get_logger("test_brand_mentions")

    settings = Settings()

    log.info(
        "starting_test",
        method=args.method,
        brand=args.brand,
        domain=args.domain,
        location=args.location,
    )

    try:
        with BrandMentionsConnector(settings) as connector:
            _METHODS[args.method](connector, args)
    except Exception:
        log.exception("test_failed")
        sys.exit(1)

    log.info("test_complete", method=args.method)


if __name__ == "__main__":
    main()
