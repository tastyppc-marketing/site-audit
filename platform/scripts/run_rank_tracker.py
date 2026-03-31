#!/usr/bin/env python3
"""Run SERP rank tracking for a client domain + competitors.

Usage:
    # First baseline check
    python scripts/run_rank_tracker.py \
        --domain p3realtync.com \
        --competitors intracoastalrealty.com,riverwildrealestate.com \
        --keywords-file ../clients/p3realtync/seo/research/client-info.json \
        --history ../clients/p3realtync/seo/research/rank-history.json \
        --label "Audit Baseline"

    # Re-check after fixes
    python scripts/run_rank_tracker.py \
        --domain p3realtync.com \
        --competitors intracoastalrealty.com,riverwildrealestate.com \
        --keywords-file ../clients/p3realtync/seo/research/client-info.json \
        --history ../clients/p3realtync/seo/research/rank-history.json \
        --label "Post-Fix Check June 2026"

    # Compare two snapshots
    python scripts/run_rank_tracker.py \
        --domain p3realtync.com \
        --history ../clients/p3realtync/seo/research/rank-history.json \
        --compare 2026-03-24,2026-06-15

    # Inject into audit-data.json for report
    python scripts/run_rank_tracker.py \
        --domain p3realtync.com \
        --history ../clients/p3realtync/seo/research/rank-history.json \
        --inject ../clients/p3realtync/seo/audit-data.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from audit_platform.config.settings import Settings
from audit_platform.connectors.dataforseo import DataForSEOConnector
from audit_platform.analyzers.rank_tracker import RankTracker


def main() -> None:
    parser = argparse.ArgumentParser(description="SERP rank tracker with historical comparison")
    parser.add_argument("--domain", required=True, help="Client domain")
    parser.add_argument("--competitors", default="", help="Comma-separated competitor domains")
    parser.add_argument("--keywords-file", default=None, help="JSON file with targetKeywords array")
    parser.add_argument("--keywords", default="", help="Comma-separated keywords (alternative to file)")
    parser.add_argument("--history", required=True, help="Path to rank-history.json")
    parser.add_argument("--label", default=None, help="Milestone label (e.g., 'Audit Baseline')")
    parser.add_argument("--location", type=int, default=2840, help="DataForSEO location code (2840=US)")
    parser.add_argument("--device", default="desktop", help="desktop or mobile")
    parser.add_argument("--compare", default=None, help="Compare two dates: YYYY-MM-DD,YYYY-MM-DD")
    parser.add_argument("--inject", default=None, help="Inject rankHistory into this audit-data.json")
    args = parser.parse_args()

    competitors = [c.strip() for c in args.competitors.split(",") if c.strip()]

    # Load keywords
    keywords = []
    if args.keywords_file:
        with open(args.keywords_file) as f:
            data = json.load(f)
        keywords = data.get("targetKeywords", [])
    if args.keywords:
        keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]

    settings = Settings()

    if args.compare:
        # Compare mode — no API needed
        tracker = RankTracker.__new__(RankTracker)
        tracker.history_path = Path(args.history)
        tracker.client_domain = tracker._norm_domain(args.domain)
        tracker.log = __import__("structlog").get_logger("RankTracker")
        tracker.history = tracker._load_history()

        dates = args.compare.split(",")
        if len(dates) != 2:
            print("Error: --compare requires two dates separated by comma", file=sys.stderr)
            sys.exit(1)

        deltas = tracker.compare_snapshots(dates[0].strip(), dates[1].strip())
        print(f"\n{'='*60}")
        print(f"  Rank Comparison: {dates[0]} → {dates[1]}")
        print(f"  Domain: {args.domain}")
        print(f"{'='*60}\n")

        for d in deltas:
            pos_a = f"#{d['positionA']}" if d['positionA'] else "N/R"
            pos_b = f"#{d['positionB']}" if d['positionB'] else "N/R"
            direction = d.get("direction", "")
            icon = {"improved": "↑", "declined": "↓", "new": "★", "lost": "✗", "unchanged": "—"}.get(direction, "?")
            print(f"  {icon} {d['keyword']:45s} {pos_a:>6s} → {pos_b:>6s}  {d.get('label', '')}")

        print(f"\n{'='*60}\n")
        return

    if args.inject:
        # Inject mode — no API needed
        tracker = RankTracker.__new__(RankTracker)
        tracker.history_path = Path(args.history)
        tracker.client_domain = tracker._norm_domain(args.domain)
        tracker.log = __import__("structlog").get_logger("RankTracker")
        tracker.history = tracker._load_history()

        report_data = tracker.get_history_for_report()

        inject_path = Path(args.inject)
        if inject_path.exists():
            with open(inject_path) as f:
                audit_data = json.load(f)
        else:
            audit_data = {}

        audit_data["rankHistory"] = report_data
        with open(inject_path, "w") as f:
            json.dump(audit_data, f, indent=2, default=str)

        print(f"Injected rankHistory into {inject_path}")
        print(f"  Snapshots: {len(report_data.get('snapshots', []))}")
        print(f"  Keywords: {len(report_data.get('keywords', {}))}")
        return

    # Check mode — needs API
    if not settings.DATAFORSEO_LOGIN:
        print("Error: DATAFORSEO_LOGIN not set", file=sys.stderr)
        sys.exit(1)

    if not keywords:
        print("Error: No keywords provided (use --keywords-file or --keywords)", file=sys.stderr)
        sys.exit(1)

    print(f"Checking SERP positions for {args.domain}...", file=sys.stderr)
    print(f"  Keywords: {len(keywords)}", file=sys.stderr)
    print(f"  Competitors: {', '.join(competitors) or 'none'}", file=sys.stderr)
    print(f"  Label: {args.label or '(none)'}", file=sys.stderr)

    with DataForSEOConnector(settings) as connector:
        tracker = RankTracker(connector, args.history, args.domain)
        result = tracker.check_positions(
            keywords=keywords,
            competitor_domains=competitors,
            label=args.label,
            location_code=args.location,
            device=args.device,
        )

    # Print summary
    summary = result["summary"]
    print(f"\n{'='*60}")
    print(f"  Rank Check: {result['date']}" + (f" ({result['label']})" if result["label"] else ""))
    print(f"  Domain: {args.domain}")
    print(f"{'='*60}")
    print(f"  Ranking:      {summary['ranking']}/{summary['totalKeywords']}")
    print(f"  Not ranking:  {summary['notRanking']}")
    print(f"  Top 3:        {summary['top3']}")
    print(f"  Top 10:       {summary['top10']}")
    print(f"  Avg position: {summary['avgPosition'] or 'N/A'}")
    if summary["improved"]:
        print(f"  Improved:     {summary['improved']}")
    if summary["declined"]:
        print(f"  Declined:     {summary['declined']}")
    print(f"{'='*60}")

    print(f"\n  {'Keyword':45s} {'Position':>10s} {'Change':>15s}")
    print(f"  {'-'*45} {'-'*10} {'-'*15}")
    for r in result["results"]:
        pos = f"#{r['clientPosition']}" if r["clientPosition"] else "N/R"
        change = r["change"].get("label", "")
        print(f"  {r['keyword']:45s} {pos:>10s} {change:>15s}")

    print(f"\nHistory saved to: {args.history}")


if __name__ == "__main__":
    main()
