#!/usr/bin/env python3
"""Standalone test script for the CrUX connector.

Usage examples:
    python scripts/test_crux.py --url https://www.example.com/page
    python scripts/test_crux.py --origin https://www.example.com
    python scripts/test_crux.py --origin https://www.example.com --full
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime

from audit_platform.config import Settings
from audit_platform.connectors.crux import CrUXConnector
from audit_platform.utils.logging import setup_logging


def _json_serialiser(obj: object) -> str:
    """Handle date/datetime serialisation for json.dumps."""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _print_record(record: object | None, label: str) -> None:
    """Pretty-print a CrUXRecord or None."""
    if record is None:
        print(f"  {label}: No data available")
        return
    # record is a CrUXRecord pydantic model.
    data = record.model_dump(exclude_none=True)  # type: ignore[union-attr]
    print(f"  {label}:")
    print(f"    LCP p75  : {data.get('lcp_p75', 'n/a')}")
    print(f"    INP p75  : {data.get('inp_p75', 'n/a')}")
    print(f"    CLS p75  : {data.get('cls_p75', 'n/a')}")
    print(f"    FCP p75  : {data.get('fcp_p75', 'n/a')}")
    print(f"    TTFB p75 : {data.get('ttfb_p75', 'n/a')}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test the CrUX connector.",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--url",
        help="Specific page URL to query.",
    )
    group.add_argument(
        "--origin",
        help="Origin to query (e.g. https://www.example.com).",
    )
    parser.add_argument(
        "--form-factor",
        choices=["PHONE", "DESKTOP", "TABLET"],
        default=None,
        help="Limit to a specific form factor.",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Query all form-factor segments (phone, desktop, combined).",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Log level (default: INFO).",
    )
    args = parser.parse_args()

    setup_logging(args.log_level)
    settings = Settings()

    connector = CrUXConnector(settings)

    try:
        target = args.url or args.origin

        if args.full:
            print(f"\n--- Full CrUX Vitals: {target} ---")
            results = connector.get_full_vitals(target)

            for segment, record in results.items():
                _print_record(record, segment.upper())

            # Also dump full JSON.
            serialisable = {
                k: v.model_dump(exclude_none=True) if v else None
                for k, v in results.items()
            }
            print("\n--- Raw JSON ---")
            print(json.dumps(serialisable, indent=2, default=_json_serialiser))

        elif args.url:
            print(f"\n--- CrUX URL query: {args.url} ---")
            record = connector.query_url(args.url, form_factor=args.form_factor)
            if record is None:
                print("No CrUX data available for this URL.")
            else:
                _print_record(record, "Result")
                print("\n--- Raw JSON ---")
                print(json.dumps(
                    record.model_dump(exclude_none=True),
                    indent=2,
                    default=_json_serialiser,
                ))

        elif args.origin:
            print(f"\n--- CrUX Origin query: {args.origin} ---")
            record = connector.query_origin(args.origin, form_factor=args.form_factor)
            if record is None:
                print("No CrUX data available for this origin.")
            else:
                _print_record(record, "Result")
                print("\n--- Raw JSON ---")
                print(json.dumps(
                    record.model_dump(exclude_none=True),
                    indent=2,
                    default=_json_serialiser,
                ))

    except Exception as exc:
        print(f"\nError: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        connector.close()


if __name__ == "__main__":
    main()
