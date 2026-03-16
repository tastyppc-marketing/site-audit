#!/usr/bin/env python3
"""Standalone test script for the DataForSEOConnector.

Usage examples
--------------
Single keyword SERP:
    python scripts/test_dataforseo.py --method serp --keyword "best seo tools"

Keyword volume lookup:
    python scripts/test_dataforseo.py --method keyword-data --keyword "seo audit,site audit,technical seo"

Keyword suggestions:
    python scripts/test_dataforseo.py --method keyword-suggestions --keyword "seo audit"

Backlinks summary:
    python scripts/test_dataforseo.py --method backlinks-summary --domain example.com

Full backlinks list:
    python scripts/test_dataforseo.py --method backlinks --domain example.com

Referring domains:
    python scripts/test_dataforseo.py --method referring-domains --domain example.com

Competitor analysis:
    python scripts/test_dataforseo.py --method competitors --domain example.com

Domain metrics (convenience):
    python scripts/test_dataforseo.py --method domain-metrics --domain example.com

Backlink intersection (compare two domains):
    python scripts/test_dataforseo.py --method intersection --domain "example.com,competitor.com"

Local pack results:
    python scripts/test_dataforseo.py --method local-pack --keyword "plumber near me"

Requires DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to be set in the
project .env file.
"""

from __future__ import annotations

import argparse
import json
import sys

import structlog

from audit_platform.config import Settings
from audit_platform.connectors.dataforseo import DataForSEOConnector, DataForSEOError
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

def _run_serp(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.keyword:
        print("ERROR: --keyword is required for 'serp'.", file=sys.stderr)
        sys.exit(1)
    items = connector.get_serp(args.keyword)
    _print_items(f"SERP for '{args.keyword}'", items)


def _run_serp_batch(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.keyword:
        print("ERROR: --keyword is required (comma-separated).", file=sys.stderr)
        sys.exit(1)
    keywords = [k.strip() for k in args.keyword.split(",") if k.strip()]
    results = connector.get_serp_batch(keywords)
    for kw, items in results.items():
        _print_items(f"SERP for '{kw}'", items, max_display=5)


def _run_local_pack(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.keyword:
        print("ERROR: --keyword is required for 'local-pack'.", file=sys.stderr)
        sys.exit(1)
    items = connector.get_local_pack(args.keyword)
    _print_items(f"Local pack for '{args.keyword}'", items)


def _run_keyword_data(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.keyword:
        print("ERROR: --keyword is required (comma-separated).", file=sys.stderr)
        sys.exit(1)
    keywords = [k.strip() for k in args.keyword.split(",") if k.strip()]
    records = connector.get_keyword_data(keywords)
    _print_items("Keyword data", records)


def _run_keyword_suggestions(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.keyword:
        print("ERROR: --keyword is required.", file=sys.stderr)
        sys.exit(1)
    records = connector.get_keyword_suggestions(args.keyword, limit=20)
    _print_items(f"Suggestions for '{args.keyword}'", records, max_display=20)


def _run_backlinks_summary(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.domain:
        print("ERROR: --domain is required.", file=sys.stderr)
        sys.exit(1)
    metrics = connector.get_backlinks_summary(args.domain)
    print(f"\n--- Backlinks summary for '{args.domain}' ---\n")
    print(_serialize(metrics))


def _run_backlinks(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.domain:
        print("ERROR: --domain is required.", file=sys.stderr)
        sys.exit(1)
    records = connector.get_backlinks(args.domain, limit=20)
    _print_items(f"Backlinks for '{args.domain}'", records)


def _run_referring_domains(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.domain:
        print("ERROR: --domain is required.", file=sys.stderr)
        sys.exit(1)
    domains = connector.get_referring_domains(args.domain, limit=20)
    _print_items(f"Referring domains for '{args.domain}'", domains)


def _run_competitors(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.domain:
        print("ERROR: --domain is required.", file=sys.stderr)
        sys.exit(1)
    competitors = connector.get_competitors(args.domain)
    _print_items(f"Competitors for '{args.domain}'", competitors)


def _run_domain_metrics(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.domain:
        print("ERROR: --domain is required.", file=sys.stderr)
        sys.exit(1)
    metrics = connector.get_domain_metrics(args.domain)
    print(f"\n--- Domain metrics for '{args.domain}' ---\n")
    print(_serialize(metrics))


def _run_intersection(connector: DataForSEOConnector, args: argparse.Namespace) -> None:
    if not args.domain:
        print("ERROR: --domain is required (comma-separated, at least 2).", file=sys.stderr)
        sys.exit(1)
    targets = [d.strip() for d in args.domain.split(",") if d.strip()]
    if len(targets) < 2:
        print("ERROR: backlink intersection requires at least 2 domains.", file=sys.stderr)
        sys.exit(1)
    items = connector.get_backlink_intersection(targets)
    _print_items(f"Backlink intersection for {targets}", items)


_METHODS = {
    "serp": _run_serp,
    "serp-batch": _run_serp_batch,
    "local-pack": _run_local_pack,
    "keyword-data": _run_keyword_data,
    "keyword-suggestions": _run_keyword_suggestions,
    "backlinks-summary": _run_backlinks_summary,
    "backlinks": _run_backlinks,
    "referring-domains": _run_referring_domains,
    "competitors": _run_competitors,
    "domain-metrics": _run_domain_metrics,
    "intersection": _run_intersection,
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test the DataForSEOConnector interactively.",
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
        "--keyword",
        default=None,
        help="Keyword(s) for SERP / keyword methods (comma-separated for batch).",
    )
    parser.add_argument(
        "--domain",
        default=None,
        help="Domain for backlink / domain methods (comma-separated for intersection).",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Log level (default: INFO).",
    )
    args = parser.parse_args()

    setup_logging(args.log_level)
    log = structlog.get_logger("test_dataforseo")

    settings = Settings()

    if not settings.DATAFORSEO_LOGIN or not settings.DATAFORSEO_PASSWORD:
        print(
            "ERROR: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set in .env.",
            file=sys.stderr,
        )
        sys.exit(1)

    log.info(
        "starting_test",
        method=args.method,
        keyword=args.keyword,
        domain=args.domain,
    )

    try:
        with DataForSEOConnector(settings) as connector:
            _METHODS[args.method](connector, args)
    except DataForSEOError as exc:
        log.error(
            "dataforseo_api_error",
            status_code=exc.status_code,
            message=exc.status_message,
        )
        sys.exit(1)
    except Exception:
        log.exception("test_failed")
        sys.exit(1)

    log.info("test_complete", method=args.method)


if __name__ == "__main__":
    main()
