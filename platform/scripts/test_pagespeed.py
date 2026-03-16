#!/usr/bin/env python3
"""Standalone test script for the PageSpeed Insights connector.

Usage examples:
    python scripts/test_pagespeed.py --url https://www.example.com
    python scripts/test_pagespeed.py --url https://www.example.com --strategy desktop
    python scripts/test_pagespeed.py --url https://www.example.com --cwv
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime

from audit_platform.config import Settings
from audit_platform.connectors.pagespeed import PageSpeedConnector
from audit_platform.utils.logging import setup_logging


def _json_serialiser(obj: object) -> str:
    """Handle date/datetime serialisation for json.dumps."""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test the PageSpeed Insights connector.",
    )
    parser.add_argument(
        "--url",
        required=True,
        help="URL to analyse.",
    )
    parser.add_argument(
        "--strategy",
        choices=["mobile", "desktop"],
        default="mobile",
        help="Analysis strategy (default: mobile).",
    )
    parser.add_argument(
        "--cwv",
        action="store_true",
        help="Run full Core Web Vitals analysis (mobile + desktop).",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Log level (default: INFO).",
    )
    args = parser.parse_args()

    setup_logging(args.log_level)
    settings = Settings()

    connector = PageSpeedConnector(settings)

    try:
        if args.cwv:
            print(f"\n--- Core Web Vitals: {args.url} ---")
            cwv = connector.get_core_web_vitals(args.url)
            output = cwv.model_dump(exclude_none=True)
            print(json.dumps(output, indent=2, default=_json_serialiser))

            # Print a compact summary.
            print("\n--- Summary ---")
            if cwv.lighthouse_mobile:
                m = cwv.lighthouse_mobile
                print(f"  Mobile  : score={m.performance_score:.2f}  "
                      f"LCP={m.lcp:.0f}ms  CLS={m.cls:.4f}  FCP={m.fcp:.0f}ms")
            if cwv.lighthouse_desktop:
                d = cwv.lighthouse_desktop
                print(f"  Desktop : score={d.performance_score:.2f}  "
                      f"LCP={d.lcp:.0f}ms  CLS={d.cls:.4f}  FCP={d.fcp:.0f}ms")
        else:
            print(f"\n--- PageSpeed ({args.strategy}): {args.url} ---")
            record = connector.analyze(args.url, strategy=args.strategy)
            output = record.model_dump(exclude_none=True)
            print(json.dumps(output, indent=2, default=_json_serialiser))

            # Compact summary.
            print(f"\n--- Summary ---")
            print(f"  Score      : {record.performance_score:.2f}")
            print(f"  LCP        : {record.lcp:.0f} ms")
            print(f"  CLS        : {record.cls:.4f}")
            print(f"  FCP        : {record.fcp:.0f} ms")
            if record.speed_index is not None:
                print(f"  Speed Index: {record.speed_index:.0f} ms")
            if record.ttfb is not None:
                print(f"  TTFB       : {record.ttfb:.0f} ms")
            if record.opportunities:
                print(f"  Opportunities ({len(record.opportunities)}):")
                for opp in record.opportunities[:5]:
                    savings = opp.get("savings_ms", 0)
                    print(f"    - {opp['title']} (save ~{savings:.0f} ms)")

    except Exception as exc:
        print(f"\nError: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        connector.close()


if __name__ == "__main__":
    main()
