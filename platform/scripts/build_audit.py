#!/usr/bin/env python3
"""Build a complete SEO or PPC audit — the orchestrator.

Runs all registered analyzers in sequence, merges outputs into a single
audit-data.json, and optionally generates the HTML report.

Usage:
    # Full SEO audit
    python scripts/build_audit.py --type seo --domain example.com --output ../clients/example/seo/audit-data.json

    # SEO audit with competitors
    python scripts/build_audit.py --type seo --domain example.com --competitors comp1.com,comp2.com --output audit.json

    # PPC audit (from Google Ads data)
    python scripts/build_audit.py --type ppc --output ../clients/example/ppc/ppc-audit-data.json

    # Generate HTML report after audit
    python scripts/build_audit.py --type seo --domain example.com --output audit.json --report ./report-output/
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import traceback
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# Add platform src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from audit_platform.config.settings import Settings


# ---------------------------------------------------------------------------
# Step registry — each step declares a name, analyzer, data keys, and deps
# ---------------------------------------------------------------------------

@dataclass
class StepResult:
    name: str
    status: str = "skip"  # ok, fail, skip
    message: str = ""
    duration_ms: int = 0
    output_keys: list[str] = field(default_factory=list)


@dataclass
class AuditStep:
    """A single step in the audit pipeline."""
    name: str
    description: str
    run_fn: str  # method name on the orchestrator
    output_keys: list[str]  # keys this step writes to audit_data
    requires_api: bool = False  # requires external API calls
    audit_type: str = "seo"  # seo, ppc, or both


# The SEO audit pipeline
SEO_STEPS: list[AuditStep] = [
    AuditStep("content_quality", "Content Quality Analysis (P1)", "_run_content_quality", ["contentQuality"], audit_type="seo"),
    AuditStep("internal_linking", "Internal Link Graph (P2)", "_run_internal_linking", ["internalLinking"], audit_type="seo"),
    AuditStep("technical_seo", "Technical SEO Audit (P3+P7)", "_run_technical_seo", ["technicalSeo"], audit_type="seo"),
    AuditStep("backlinks", "Backlink Analysis (P4)", "_run_backlinks", ["backlinks", "domainMetrics", "backlinkOpportunities"], requires_api=True, audit_type="seo"),
    AuditStep("competitor", "Competitor Analysis (P5)", "_run_competitor", ["competitorAnalysis"], requires_api=True, audit_type="seo"),
    AuditStep("local_seo", "Local SEO Deep Dive (P6)", "_run_local_seo", ["localSeo"], audit_type="seo"),
    AuditStep("indexation", "Indexation & Crawlability (P8)", "_run_indexation", ["indexationCrawlability"], audit_type="seo"),
    AuditStep("eeat", "E-E-A-T Signal Analysis", "_run_eeat", ["eeatSignals"], audit_type="seo"),
    AuditStep("content_gap", "Content Gap & Topical Authority", "_run_content_gap", ["contentGap", "topicalAuthority"], requires_api=True, audit_type="seo"),
    AuditStep("reporting", "Reporting Intelligence (P9)", "_run_reporting", ["reportingIntelligence"], audit_type="seo"),
]

PPC_STEPS: list[AuditStep] = [
    AuditStep("ppc_audit", "PPC Account Audit (P11)", "_run_ppc_audit", ["ppcAudit"], audit_type="ppc"),
]


class AuditOrchestrator:
    """Orchestrates the full audit pipeline."""

    def __init__(self, settings: Settings, args: argparse.Namespace) -> None:
        self.settings = settings
        self.args = args
        self.audit_data: dict[str, Any] = {}
        self.results: list[StepResult] = []

    def run(self) -> dict[str, Any]:
        """Execute the full audit pipeline."""
        audit_type = self.args.type
        domain = self.args.domain or ""

        print(f"\n{'='*60}")
        print(f"  Site Audit Orchestrator — {audit_type.upper()} Audit")
        print(f"  Domain: {domain or '(from data)'}")
        print(f"{'='*60}\n")

        # Initialize client metadata
        self.audit_data["client"] = {
            "website": domain,
            "websiteUrl": f"https://www.{domain}" if domain else "",
            "auditDate": time.strftime("%B %d, %Y"),
        }

        # Select steps based on audit type
        steps = SEO_STEPS if audit_type == "seo" else PPC_STEPS

        # Run each step
        for step in steps:
            if step.requires_api and self.args.skip_api:
                self._record_skip(step, "Skipped (--skip-api flag)")
                continue

            self._run_step(step)

        # Print summary
        self._print_summary()

        return self.audit_data

    def _run_step(self, step: AuditStep) -> None:
        """Execute a single audit step with error handling."""
        print(f"  [{step.name}] {step.description}...", end=" ", flush=True)
        start = time.time()

        try:
            method = getattr(self, step.run_fn, None)
            if not method:
                self._record_skip(step, f"Method {step.run_fn} not found")
                print("SKIP")
                return

            result = method()

            # Merge output into audit_data
            if isinstance(result, dict):
                for key in step.output_keys:
                    if key in result:
                        self.audit_data[key] = result[key]

            elapsed = int((time.time() - start) * 1000)
            self.results.append(StepResult(
                name=step.name, status="ok", message="Complete",
                duration_ms=elapsed, output_keys=step.output_keys,
            ))
            print(f"OK ({elapsed}ms)")

        except Exception as exc:
            elapsed = int((time.time() - start) * 1000)
            self.results.append(StepResult(
                name=step.name, status="fail",
                message=f"{type(exc).__name__}: {exc}",
                duration_ms=elapsed,
            ))
            print(f"FAIL ({type(exc).__name__})")
            if self.args.verbose:
                traceback.print_exc()

    def _record_skip(self, step: AuditStep, reason: str) -> None:
        self.results.append(StepResult(name=step.name, status="skip", message=reason))

    # ------------------------------------------------------------------
    # SEO Step Implementations
    # ------------------------------------------------------------------

    def _run_content_quality(self) -> dict[str, Any]:
        """Run content quality analysis on crawl data."""
        crawl_data = self._load_crawl_data()
        if not crawl_data:
            return {}

        from audit_platform.analyzers.content_quality import ContentQualityAnalyzer
        analyzer = ContentQualityAnalyzer()

        pages = crawl_data.get("pages", [])
        # ContentQualityAnalyzer expects HTML content per page — use crawl data fields
        result = analyzer.audit_site(pages) if hasattr(analyzer, 'audit_site') else {}
        return {"contentQuality": result}

    def _run_internal_linking(self) -> dict[str, Any]:
        """Run internal link graph analysis."""
        link_graph = self._load_link_graph()
        crawl_data = self._load_crawl_data()
        if not link_graph and not crawl_data:
            return {}

        from audit_platform.analyzers.internal_linking import InternalLinkAnalyzer
        analyzer = InternalLinkAnalyzer()

        edges = link_graph or {}
        sitemap_urls = [p.get("url", "") for p in (crawl_data or {}).get("pages", [])]
        homepage = f"https://www.{self.args.domain}" if self.args.domain else ""

        result = analyzer.analyze(edges, sitemap_urls, homepage)
        return {"internalLinking": result.model_dump(mode="json") if hasattr(result, 'model_dump') else {}}

    def _run_technical_seo(self) -> dict[str, Any]:
        """Run technical SEO analysis on crawl data."""
        crawl_data = self._load_crawl_data()
        if not crawl_data:
            return {}

        from audit_platform.analyzers.technical_seo import TechnicalSeoAnalyzer
        analyzer = TechnicalSeoAnalyzer()

        pages = crawl_data.get("pages", [])
        homepage = f"https://www.{self.args.domain}" if self.args.domain else ""
        result = analyzer.analyze(pages, homepage)
        return {"technicalSeo": result}

    def _run_backlinks(self) -> dict[str, Any]:
        """Run backlink analysis via DataForSEO."""
        if not self.settings.DATAFORSEO_LOGIN:
            return {}

        from audit_platform.analyzers.backlinks import BacklinkAnalyzer
        from audit_platform.connectors.dataforseo import DataForSEOConnector

        competitors = self._parse_competitors()

        with DataForSEOConnector(self.settings) as connector:
            analyzer = BacklinkAnalyzer(connector)
            result = analyzer.analyze(
                target=self.args.domain,
                competitor_domains=competitors,
            )

            # Also run link opportunity finder
            if competitors:
                opportunities = analyzer.find_link_opportunities(
                    self.args.domain, competitors
                )
                result["backlinkOpportunities"] = opportunities

        return result

    def _run_competitor(self) -> dict[str, Any]:
        """Run competitor analysis via DataForSEO."""
        if not self.settings.DATAFORSEO_LOGIN:
            return {}

        from audit_platform.analyzers.competitor import CompetitorAnalyzer
        from audit_platform.connectors.dataforseo import DataForSEOConnector

        competitors = self._parse_competitors()
        keywords = self._extract_tracked_keywords()

        with DataForSEOConnector(self.settings) as connector:
            analyzer = CompetitorAnalyzer(connector)
            result = analyzer.analyze(
                target=self.args.domain,
                competitor_domains=competitors or None,
                keywords=keywords,
            )

        return {"competitorAnalysis": result}

    def _run_local_seo(self) -> dict[str, Any]:
        """Run local SEO analysis."""
        from audit_platform.analyzers.local_seo import LocalSeoAnalyzer
        analyzer = LocalSeoAnalyzer()

        crawl_data = self._load_crawl_data()
        pages = (crawl_data or {}).get("pages", [])

        # Load any existing local SEO data from research directory
        local_data = self._load_research_file("local-seo.json") or {}
        reviews = self._load_research_file("reviews.json") or []
        business_profile = local_data.get("businessProfile") or {}

        location_keywords = []
        if self.args.domain:
            # Extract location from domain or client data
            location_keywords = self._extract_location_keywords()

        result = analyzer.analyze(
            reviews=reviews if isinstance(reviews, list) else [],
            business_profile=business_profile,
            crawl_pages=pages,
            location_keywords=location_keywords,
        )
        return {"localSeo": result}

    def _run_indexation(self) -> dict[str, Any]:
        """Run indexation and crawlability analysis."""
        crawl_data = self._load_crawl_data()
        if not crawl_data:
            return {}

        from audit_platform.analyzers.indexation_crawlability import IndexCrawlabilityAnalyzer
        analyzer = IndexCrawlabilityAnalyzer()

        pages = crawl_data.get("pages", [])
        sitemap_urls = [p.get("url", "") for p in pages]

        # Load Search Console data if available
        sc_data = self._load_research_file("search-console-pages.json") or []

        result = analyzer.analyze(
            pages=pages,
            sitemap_urls=sitemap_urls,
            sc_pages=sc_data,
        )
        return {"indexationCrawlability": result}

    def _run_eeat(self) -> dict[str, Any]:
        """Run E-E-A-T signal analysis."""
        crawl_data = self._load_crawl_data()
        if not crawl_data:
            return {}

        from audit_platform.analyzers.eeat_signals import EEATSignalAnalyzer
        analyzer = EEATSignalAnalyzer()

        pages = crawl_data.get("pages", [])
        result = analyzer.analyze(pages)
        return {"eeatSignals": result}

    def _run_content_gap(self) -> dict[str, Any]:
        """Run content gap analysis and topical authority mapping."""
        if not self.settings.DATAFORSEO_LOGIN:
            return {}

        from audit_platform.analyzers.content_gap import ContentGapAnalyzer
        from audit_platform.connectors.dataforseo import DataForSEOConnector

        competitors = self._parse_competitors()
        if not competitors:
            # Try to get competitors from earlier analysis
            comp_analysis = self.audit_data.get("competitorAnalysis") or {}
            discovered = comp_analysis.get("discoveredCompetitors") or []
            competitors = [c.get("domain", "") for c in discovered if c.get("domain")][:5]

        with DataForSEOConnector(self.settings) as connector:
            analyzer = ContentGapAnalyzer(connector)

            # Fetch client keywords
            try:
                client_kws = connector.get_organic_keywords(self.args.domain, limit=500)
            except Exception:
                client_kws = []

            # Fetch competitor keywords
            comp_kws: dict[str, list] = {}
            for comp in competitors[:5]:
                try:
                    comp_kws[comp] = connector.get_organic_keywords(comp, limit=500)
                except Exception:
                    continue

            # Content gap
            gap_result = analyzer.analyze_content_gaps(client_kws, comp_kws)

            # Topical authority
            authority_result = analyzer.analyze_topical_authority(client_kws)

            # Unlinked mentions
            mentions_data = self._load_research_file("brand-mentions.json") or []
            backlink_domains = set()
            bl_data = self.audit_data.get("backlinks", {}).get("referringDomains") or []
            for rd in bl_data:
                if isinstance(rd, dict):
                    backlink_domains.add(rd.get("domain", "").lower())

            unlinked = analyzer.find_unlinked_mentions(
                mentions_data if isinstance(mentions_data, list) else [],
                backlink_domains,
            )

        return {
            "contentGap": gap_result,
            "topicalAuthority": authority_result,
            "unlinkedMentions": unlinked,
        }

    def _run_reporting(self) -> dict[str, Any]:
        """Run reporting intelligence — MUST be last step."""
        from audit_platform.analyzers.reporting_intelligence import ReportingIntelligenceAnalyzer
        analyzer = ReportingIntelligenceAnalyzer()

        result = analyzer.analyze(self.audit_data, domain=self.args.domain)

        # Copy grade and summary to client metadata
        grade = result.get("siteHealthGrade", {})
        self.audit_data["client"]["overallGrade"] = grade.get("letterGrade", "?")
        self.audit_data["client"]["gradeSummary"] = result.get("executiveSummary", "")

        # Generate top issues from prioritized findings
        self.audit_data["topIssues"] = [
            {
                "issue": f["issue"],
                "detail": f["detail"],
                "impact": f["impact"],
                "effort": f["effort"],
            }
            for f in result.get("prioritizedFindings", [])[:8]
        ]

        # Generate action plan
        self.audit_data["actionPlan"] = result.get("actionPlan", {})
        self.audit_data["quickWins"] = [
            {"action": item["action"], "impact": item["impact"]}
            for item in result.get("actionPlan", {}).get("quickWins", [])
        ]

        return {"reportingIntelligence": result}

    # ------------------------------------------------------------------
    # PPC Step Implementations
    # ------------------------------------------------------------------

    def _run_ppc_audit(self) -> dict[str, Any]:
        """Run PPC audit on Google Ads data."""
        from audit_platform.analyzers.ppc_analyzer import PPCAnalyzer
        analyzer = PPCAnalyzer()

        # Load PPC data from research files or Google Ads connector
        campaigns = self._load_research_file("campaigns.json") or []
        ad_groups = self._load_research_file("ad-groups.json") or []
        keywords = self._load_research_file("keywords.json") or []
        search_terms = self._load_research_file("search-terms.json") or []

        # If no research files, try Google Ads connector
        if not campaigns and self.settings.GOOGLE_ADS_DEVELOPER_TOKEN:
            campaigns, ad_groups, keywords, search_terms = self._fetch_google_ads_data()

        result = analyzer.analyze(
            campaigns=campaigns,
            ad_groups=ad_groups,
            keywords=keywords,
            search_terms=search_terms,
            target_cpa=self.args.target_cpa,
        )

        return {"ppcAudit": result}

    def _fetch_google_ads_data(self) -> tuple:
        """Fetch data from Google Ads API."""
        try:
            from audit_platform.connectors.google_ads import GoogleAdsConnector
            with GoogleAdsConnector(self.settings) as connector:
                campaigns = [c.model_dump(mode="json") for c in connector.get_campaigns()]
                ad_groups = [ag.model_dump(mode="json") for ag in connector.get_ad_groups()]
                keywords = [kw.model_dump(mode="json") for kw in connector.get_keywords()]
                search_terms = [st.model_dump(mode="json") for st in connector.get_search_terms()]
                return campaigns, ad_groups, keywords, search_terms
        except Exception:
            return [], [], [], []

    # ------------------------------------------------------------------
    # Data Loading Helpers
    # ------------------------------------------------------------------

    def _load_crawl_data(self) -> dict[str, Any] | None:
        """Load crawl-data.json from research directory."""
        data = self._load_research_file("crawl-data.json")
        return data if isinstance(data, dict) else None

    def _load_link_graph(self) -> dict[str, Any] | None:
        """Load link-graph.json from research directory."""
        data = self._load_research_file("link-graph.json")
        return data if isinstance(data, dict) else None

    def _load_research_file(self, filename: str) -> Any:
        """Load a JSON file from the research directory."""
        if not self.args.research_dir:
            return None

        filepath = Path(self.args.research_dir) / filename
        if not filepath.exists():
            return None

        try:
            with open(filepath) as f:
                return json.load(f)
        except Exception:
            return None

    def _parse_competitors(self) -> list[str]:
        """Parse competitor domains from CLI args."""
        if not self.args.competitors:
            return []
        return [c.strip() for c in self.args.competitors.split(",") if c.strip()]

    def _extract_tracked_keywords(self) -> list[str]:
        """Extract keywords from existing audit data."""
        keywords = self.audit_data.get("keywords") or []
        return [kw.get("keyword", "") for kw in keywords if kw.get("keyword")][:25]

    def _extract_location_keywords(self) -> list[str]:
        """Extract location keywords from client data."""
        client = self.audit_data.get("client") or {}
        location = client.get("location") or ""
        if location:
            parts = [p.strip() for p in location.split(",")]
            return parts
        return []

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def _print_summary(self) -> None:
        """Print audit results summary."""
        print(f"\n{'='*60}")
        print("  Audit Summary")
        print(f"{'='*60}")

        for r in self.results:
            icon = {"ok": "[+]", "fail": "[-]", "skip": "[ ]"}.get(r.status, "[?]")
            time_str = f" ({r.duration_ms}ms)" if r.duration_ms else ""
            print(f"  {icon} {r.name:25s} {r.status.upper():5s}{time_str}")
            if r.status == "fail":
                print(f"      {r.message}")

        ok = sum(1 for r in self.results if r.status == "ok")
        fail = sum(1 for r in self.results if r.status == "fail")
        skip = sum(1 for r in self.results if r.status == "skip")
        print(f"\n  Total: {ok} OK, {fail} FAIL, {skip} SKIP")

        # Grade if available
        grade = self.audit_data.get("client", {}).get("overallGrade")
        if grade:
            print(f"  Overall Grade: {grade}")

        print(f"{'='*60}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a complete SEO or PPC audit")
    parser.add_argument("--type", choices=["seo", "ppc"], default="seo", help="Audit type")
    parser.add_argument("--domain", default="", help="Target domain (e.g., example.com)")
    parser.add_argument("--competitors", default="", help="Comma-separated competitor domains")
    parser.add_argument("--output", required=True, help="Path to write audit-data.json")
    parser.add_argument("--research-dir", default=None, help="Directory containing research JSON files (crawl-data.json, etc.)")
    parser.add_argument("--report", default=None, help="Generate HTML report to this directory")
    parser.add_argument("--skip-api", action="store_true", help="Skip steps requiring API calls")
    parser.add_argument("--target-cpa", type=float, default=None, help="Target CPA for PPC audit")
    parser.add_argument("--verbose", action="store_true", help="Show full error tracebacks")
    args = parser.parse_args()

    settings = Settings()
    orchestrator = AuditOrchestrator(settings, args)
    audit_data = orchestrator.run()

    # Write output
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Merge with existing data if file exists
    if output_path.exists():
        try:
            with open(output_path) as f:
                existing = json.load(f)
            existing.update(audit_data)
            audit_data = existing
        except Exception:
            pass

    with open(output_path, "w") as f:
        json.dump(audit_data, f, indent=2, default=str)

    print(f"Audit data written to: {output_path}")

    # Generate HTML report if requested
    if args.report:
        report_script = Path(__file__).resolve().parent.parent.parent / "template" / "reports" / "multipage" / "generate-multipage-report.js"
        if report_script.exists():
            print(f"Generating HTML report to: {args.report}")
            subprocess.run(
                ["node", str(report_script), "--data", str(output_path), "--output", args.report],
                check=True,
            )
            print(f"Report generated: {args.report}/index.html")
        else:
            print(f"Report generator not found at: {report_script}")


if __name__ == "__main__":
    main()
