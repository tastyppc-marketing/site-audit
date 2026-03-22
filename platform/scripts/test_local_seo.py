#!/usr/bin/env python3
"""Standalone test script for the LocalSEOConnector.

Usage examples
--------------
Check NAP consistency:
    python scripts/test_local_seo.py --method nap \\
        --business "Keller Williams Realty" \\
        --address "1234 Main St, Austin, TX 78701" \\
        --phone "(512) 555-1234" \\
        --domain kellerwilliams.com

Check local pack presence:
    python scripts/test_local_seo.py --method local-pack \\
        --business "Keller Williams Realty" \\
        --location "Austin, TX" \\
        --keywords "realtor near me,real estate agent Austin"

Analyze GBP completeness (uses sample data):
    python scripts/test_local_seo.py --method gbp

Find citation opportunities:
    python scripts/test_local_seo.py --method citations \\
        --location "Austin, TX" \\
        --industry "real_estate"

Run all checks:
    python scripts/test_local_seo.py --method all \\
        --business "Keller Williams Realty" \\
        --address "1234 Main St, Austin, TX 78701" \\
        --phone "(512) 555-1234" \\
        --domain kellerwilliams.com \\
        --location "Austin, TX" \\
        --industry "real_estate" \\
        --keywords "realtor near me,real estate agent Austin"

DataForSEO credentials (DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD) are
optional but recommended for local pack checking.
"""

from __future__ import annotations

import argparse
import json
import sys

import structlog

from audit_platform.config import Settings
from audit_platform.connectors.local_seo import LocalSEOConnector
from audit_platform.utils.logging import setup_logging


def _serialize(obj: object) -> str:
    """JSON-serialise a value, handling pydantic models and dates."""
    if hasattr(obj, "model_dump"):
        return json.dumps(obj.model_dump(mode="json"), indent=2, default=str)  # type: ignore[union-attr]
    return json.dumps(obj, indent=2, default=str)


def _print_items(label: str, items: list, max_display: int = 20) -> None:
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

def _run_nap(connector: LocalSEOConnector, args: argparse.Namespace) -> None:
    if not all([args.business, args.address, args.phone, args.domain]):
        print(
            "ERROR: --business, --address, --phone, and --domain are all required for 'nap'.",
            file=sys.stderr,
        )
        sys.exit(1)
    results = connector.check_nap_consistency(
        business_name=args.business,
        address=args.address,
        phone=args.phone,
        domain=args.domain,
    )
    _print_items(f"NAP consistency for '{args.business}'", results)


def _run_local_pack(connector: LocalSEOConnector, args: argparse.Namespace) -> None:
    if not args.keywords or not args.location:
        print(
            "ERROR: --keywords and --location are required for 'local-pack'.",
            file=sys.stderr,
        )
        sys.exit(1)
    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]
    results = connector.check_local_pack(keywords, args.location)
    _print_items(f"Local pack check for '{args.location}'", results)


def _run_gbp(connector: LocalSEOConnector, args: argparse.Namespace) -> None:
    # Use sample profile data for demonstration
    sample_profile = {
        "title": args.business or "Sample Business",
        "address": args.address or "123 Main St, Austin, TX 78701",
        "phone": args.phone or "(512) 555-1234",
        "website": f"https://{args.domain}" if args.domain else "https://example.com",
        "primary_category": "Real Estate Agent",
        "additional_categories": ["Real Estate Agency"],
        "is_verified": True,
        "has_description": True,
        "has_hours": True,
        "has_photos": False,
        "has_posts": False,
        "has_products": False,
        "has_services": True,
        "review_count": 5,
        "avg_rating": 4.2,
    }

    print(f"\n--- Analyzing GBP profile (sample data) ---\n")
    print(f"Profile: {_serialize(sample_profile)}\n")

    result = connector.analyze_gbp_completeness(sample_profile)
    print(f"\n--- GBP Completeness Score ---\n")
    print(_serialize(result))


def _run_citations(connector: LocalSEOConnector, args: argparse.Namespace) -> None:
    industry = args.industry or "general"
    location = args.location or ""
    results = connector.find_citation_opportunities(industry, location)
    _print_items(f"Citation opportunities ({industry}, {location})", results)


def _run_all(connector: LocalSEOConnector, args: argparse.Namespace) -> None:
    print("=" * 60)
    print(f"  Local SEO Audit: {args.business or 'N/A'}")
    print("=" * 60)

    # NAP Consistency
    if all([args.business, args.address, args.phone, args.domain]):
        print("\n[1/4] Checking NAP consistency...")
        results = connector.check_nap_consistency(
            business_name=args.business,
            address=args.address,
            phone=args.phone,
            domain=args.domain,
        )
        _print_items(f"NAP consistency for '{args.business}'", results)
    else:
        print("\n[1/4] Skipping NAP check (--business, --address, --phone, --domain all required)")

    # Local Pack
    if args.keywords and args.location:
        print("\n[2/4] Checking local pack presence...")
        keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]
        results = connector.check_local_pack(keywords, args.location)
        _print_items(f"Local pack results", results)
    else:
        print("\n[2/4] Skipping local pack check (--keywords and --location required)")

    # GBP Completeness
    print("\n[3/4] Analyzing GBP completeness (sample data)...")
    _run_gbp(connector, args)

    # Citations
    print("\n[4/4] Finding citation opportunities...")
    industry = args.industry or "general"
    location = args.location or ""
    results = connector.find_citation_opportunities(industry, location)
    _print_items(f"Citation opportunities", results)

    print("\n" + "=" * 60)
    print("  Audit complete.")
    print("=" * 60)


_METHODS = {
    "nap": _run_nap,
    "local-pack": _run_local_pack,
    "gbp": _run_gbp,
    "citations": _run_citations,
    "all": _run_all,
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test the LocalSEOConnector interactively.",
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
        "--business",
        default=None,
        help="Business name.",
    )
    parser.add_argument(
        "--address",
        default=None,
        help="Full business address.",
    )
    parser.add_argument(
        "--phone",
        default=None,
        help="Business phone number.",
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
        "--industry",
        default=None,
        help="Industry for citation sources (e.g. 'real_estate', 'restaurant').",
    )
    parser.add_argument(
        "--keywords",
        default=None,
        help="Comma-separated keywords for local pack check.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Log level (default: INFO).",
    )
    args = parser.parse_args()

    setup_logging(args.log_level)
    log = structlog.get_logger("test_local_seo")

    settings = Settings()

    log.info(
        "starting_test",
        method=args.method,
        business=args.business,
        location=args.location,
        industry=args.industry,
    )

    try:
        with LocalSEOConnector(settings) as connector:
            _METHODS[args.method](connector, args)
    except Exception:
        log.exception("test_failed")
        sys.exit(1)

    log.info("test_complete", method=args.method)


if __name__ == "__main__":
    main()
