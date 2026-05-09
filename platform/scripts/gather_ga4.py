"""Gather GA4 traffic data and write canonical clients/<slug>/seo/research/ga4-data.json.

Mirrors the JS gather-*.js pattern but in Python so it can reuse the existing
audit_platform.connectors.ga4.GA4Connector (which already handles OAuth +
service-account creds via ClientContext).

Usage:
    python3 platform/scripts/gather_ga4.py --client-slug <slug> [--days 90]

Output shape (matches the renderer's expected canonical form):
    {
      "landingPages":       [{landingPage, sessions, ...}, ...],   # top 100 by sessions
      "acquisitionChannels": [{sessionDefaultChannelGroup, ...}, ...],
      "deviceBreakdown":     [{deviceCategory, sessions, ...}, ...],
      "pagePerformance":     [{pagePath, pageTitle, ...}, ...],   # top 100 by screenPageViews
      "totalLandingPages":   <int>,                                # before slicing
      "totalPagePerformance":<int>,
      "gatheredAt":          "<ISO-8601>",
      "dateRange":           {"start": "...", "end": "..."}
    }
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

# Allow running without `pip install -e platform/` by inserting the src path.
sys.path.insert(0, str(REPO_ROOT / "platform" / "src"))

from audit_platform.config.client_context import ClientContext
from audit_platform.connectors.ga4 import GA4Connector


def _sort_desc(rows: list[dict], key: str) -> list[dict]:
    return sorted(rows, key=lambda r: r.get(key, 0) or 0, reverse=True)


def gather(slug: str, days: int = 90) -> dict:
    ctx = ClientContext.from_slug(slug, repo_root=REPO_ROOT)
    connector = GA4Connector(ctx=ctx)

    end = date.today()
    start = end - timedelta(days=days)
    date_start_str = start.isoformat()
    date_end_str = end.isoformat()

    landing = connector.get_landing_page_report(
        date_range_start=date_start_str, date_range_end=date_end_str
    )
    acquisition = connector.get_acquisition_report(
        date_range_start=date_start_str, date_range_end=date_end_str
    )
    devices = connector.get_device_report(
        date_range_start=date_start_str, date_range_end=date_end_str
    )
    pages = connector.get_page_performance(
        date_range_start=date_start_str, date_range_end=date_end_str
    )

    landing_sorted = _sort_desc(landing, "sessions")
    pages_sorted = _sort_desc(pages, "screenPageViews")

    return {
        "landingPages": landing_sorted[:100],
        "acquisitionChannels": acquisition,
        "deviceBreakdown": devices,
        "pagePerformance": pages_sorted[:100],
        "totalLandingPages": len(landing_sorted),
        "totalPagePerformance": len(pages_sorted),
        "gatheredAt": _now_iso(),
        "dateRange": {"start": date_start_str, "end": date_end_str},
    }


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client-slug", required=True, help="Client directory slug")
    parser.add_argument("--days", type=int, default=90, help="Days to look back (default 90)")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output path (default: clients/<slug>/seo/research/ga4-data.json)",
    )
    args = parser.parse_args()

    output_path = args.output or (
        REPO_ROOT / "clients" / args.client_slug / "seo" / "research" / "ga4-data.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        data = gather(args.client_slug, days=args.days)
    except Exception as exc:
        print(f"[gather_ga4] FAILED for {args.client_slug}: {exc}", file=sys.stderr)
        return 1

    output_path.write_text(json.dumps(data, indent=2))
    print(
        f"[gather_ga4] wrote {output_path} "
        f"(landing={len(data['landingPages'])}, "
        f"channels={len(data['acquisitionChannels'])}, "
        f"devices={len(data['deviceBreakdown'])}, "
        f"pages={len(data['pagePerformance'])})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
