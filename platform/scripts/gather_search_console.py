"""Gather Google Search Console data and write canonical search-console.json.

Mirrors the JS gather-*.js pattern but reuses
audit_platform.connectors.search_console.SearchConsoleConnector.

Usage:
    python3 platform/scripts/gather_search_console.py --client-slug <slug> [--days 90]

Output shape (matches renderer's expected canonical form, mirrors p3realtync):
    {
      "totalQueries": <int>,
      "totalPages":   <int>,
      "topQueries":   [{query, clicks, impressions, ctr, position}, ...],   # top 50
      "topPages":     [{page,  clicks, impressions, ctr, position}, ...],   # top 50
      "allQueries":   [...],
      "allPages":     [...],
      "gatheredAt":   "<ISO-8601>",
      "dateRange":    {"start": "...", "end": "..."}
    }
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "platform" / "src"))

from audit_platform.config.client_context import ClientContext
from audit_platform.connectors.search_console import SearchConsoleConnector

# Search Console publishes data with a ~3-day lag.
_LAG_DAYS = 3


def _sort_desc(rows: list[dict], key: str = "clicks") -> list[dict]:
    return sorted(rows, key=lambda r: r.get(key, 0) or 0, reverse=True)


def gather(slug: str, days: int = 90) -> dict:
    ctx = ClientContext.from_slug(slug, repo_root=REPO_ROOT)
    connector = SearchConsoleConnector(ctx=ctx)

    end = date.today() - timedelta(days=_LAG_DAYS)
    start = end - timedelta(days=days)

    queries = connector.get_query_data(
        start_date=start, end_date=end, row_limit=25000
    )
    pages = connector.get_page_data(
        start_date=start, end_date=end, row_limit=25000
    )

    queries_sorted = _sort_desc(queries)
    pages_sorted = _sort_desc(pages)

    return {
        "totalQueries": len(queries_sorted),
        "totalPages": len(pages_sorted),
        "topQueries": queries_sorted[:50],
        "topPages": pages_sorted[:50],
        "allQueries": queries_sorted,
        "allPages": pages_sorted,
        "gatheredAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "dateRange": {"start": start.isoformat(), "end": end.isoformat()},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client-slug", required=True)
    parser.add_argument("--days", type=int, default=90)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()

    output_path = args.output or (
        REPO_ROOT / "clients" / args.client_slug / "seo" / "research" / "search-console.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        data = gather(args.client_slug, days=args.days)
    except Exception as exc:
        print(f"[gather_search_console] FAILED for {args.client_slug}: {exc}", file=sys.stderr)
        return 1

    output_path.write_text(json.dumps(data, indent=2))
    print(
        f"[gather_search_console] wrote {output_path} "
        f"(queries={data['totalQueries']}, pages={data['totalPages']})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
