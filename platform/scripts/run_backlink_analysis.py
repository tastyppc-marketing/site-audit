#!/usr/bin/env python3
"""Run backlink analysis for a domain and output to audit-data.json.

Usage:
    python scripts/run_backlink_analysis.py --domain example.com
    python scripts/run_backlink_analysis.py --domain example.com --competitors comp1.com,comp2.com
    python scripts/run_backlink_analysis.py --domain example.com --output ../clients/my-client/seo/audit-data.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Add platform src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from audit_platform.analyzers.backlinks import BacklinkAnalyzer
from audit_platform.config.settings import Settings
from audit_platform.connectors.dataforseo import DataForSEOConnector


def main() -> None:
    parser = argparse.ArgumentParser(description="Run backlink analysis via DataForSEO")
    parser.add_argument("--domain", required=True, help="Target domain (e.g., example.com)")
    parser.add_argument(
        "--competitors",
        default="",
        help="Comma-separated competitor domains (e.g., comp1.com,comp2.com)",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Path to audit-data.json to merge results into. If omitted, prints JSON to stdout.",
    )
    parser.add_argument("--backlink-limit", type=int, default=100, help="Max backlinks to fetch")
    parser.add_argument("--intersection", action="store_true", help="Also run backlink intersection analysis")
    parser.add_argument("--opportunities", action="store_true", default=True, help="Find link opportunities from competitor profiles (default: on)")
    parser.add_argument("--no-opportunities", dest="opportunities", action="store_false", help="Skip link opportunity analysis")
    parser.add_argument("--min-dr", type=float, default=15.0, help="Min domain rating for link opportunities (default: 15)")
    args = parser.parse_args()

    competitors = [c.strip() for c in args.competitors.split(",") if c.strip()]

    settings = Settings()
    if not settings.DATAFORSEO_LOGIN:
        print("Error: DATAFORSEO_LOGIN not set in .env", file=sys.stderr)
        sys.exit(1)

    print(f"Analyzing backlinks for: {args.domain}", file=sys.stderr)
    if competitors:
        print(f"Competitors: {', '.join(competitors)}", file=sys.stderr)

    with DataForSEOConnector(settings) as connector:
        analyzer = BacklinkAnalyzer(connector)
        result = analyzer.analyze(
            target=args.domain,
            competitor_domains=competitors,
            backlink_limit=args.backlink_limit,
        )

        if args.intersection and competitors:
            print("Running backlink intersection analysis...", file=sys.stderr)
            intersection = analyzer.analyze_intersection(args.domain, competitors)
            result["backlinkIntersection"] = intersection

        if args.opportunities and competitors:
            print("Finding link opportunities from competitor profiles...", file=sys.stderr)
            opportunities = analyzer.find_link_opportunities(
                args.domain, competitors, min_domain_rating=args.min_dr,
            )
            result["linkOpportunities"] = opportunities
            high = opportunities["summary"]["highPriority"]
            total = opportunities["summary"]["totalFound"]
            print(f"Found {total} opportunities ({high} high-priority)", file=sys.stderr)

    if args.output:
        output_path = Path(args.output)
        if output_path.exists():
            with open(output_path) as f:
                existing = json.load(f)
        else:
            existing = {}

        existing["backlinks"] = result["backlinks"]
        existing["domainMetrics"] = result["domainMetrics"]
        if "backlinkIntersection" in result:
            existing["backlinkIntersection"] = result["backlinkIntersection"]
        if "linkOpportunities" in result:
            existing["linkOpportunities"] = result["linkOpportunities"]

        with open(output_path, "w") as f:
            json.dump(existing, f, indent=2, default=str)

        print(f"Results merged into: {output_path}", file=sys.stderr)
    else:
        print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
