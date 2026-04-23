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
from audit_platform.utils.atomic_write import write_json_atomic


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

        client_config = getattr(self.args, "client_config", None)
        if client_config:
            with open(client_config) as f:
                client_config_data = json.load(f)

            google_access = client_config_data.get("googleAccess", {})
            search_console = google_access.get("searchConsole", {})
            analytics = google_access.get("analytics", {})
            business_profile = google_access.get("businessProfile", {})

            if search_console.get("hasAccess") and search_console.get("siteUrl"):
                self.settings.SEARCH_CONSOLE_SITE_URL = search_console["siteUrl"]
            if analytics.get("hasAccess") and analytics.get("propertyId"):
                self.settings.GA4_PROPERTY_ID = analytics["propertyId"]
            if business_profile.get("hasAccess") and business_profile.get("accountId"):
                self.settings.GBP_ACCOUNT_ID = business_profile["accountId"]
            if business_profile.get("hasAccess") and business_profile.get("locationId"):
                self.settings.GBP_LOCATION_ID = business_profile["locationId"]

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

        pages = self._merge_page_text_analysis(crawl_data.get("pages", []))
        if not hasattr(analyzer, "analyze_batch"):
            return {}

        records, duplicate_groups = analyzer.analyze_batch(pages)
        cannibalization = self._build_cannibalization(analyzer)
        result = self._build_content_quality_payload(pages, records, duplicate_groups, cannibalization)
        return {"contentQuality": result}

    def _run_internal_linking(self) -> dict[str, Any]:
        """Run internal link graph analysis."""
        link_graph = self._load_link_graph()
        crawl_data = self._load_crawl_data()
        if not link_graph and not crawl_data:
            return {}

        from audit_platform.analyzers.internal_linking import InternalLinkAnalyzer
        analyzer = InternalLinkAnalyzer()

        edges = (link_graph or {}).get("edges", {})
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

    def _merge_page_text_analysis(self, pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Merge page-text-analysis metrics into crawl pages by URL."""
        text_analysis = self._load_research_file("page-text-analysis.json")
        if not isinstance(text_analysis, dict):
            return pages

        text_pages = text_analysis.get("pages")
        if not isinstance(text_pages, list):
            return pages

        analysis_by_url: dict[str, dict[str, Any]] = {}
        for item in text_pages:
            if not isinstance(item, dict):
                continue
            url = item.get("url")
            if isinstance(url, str) and url:
                analysis_by_url[url] = item

        merged_pages: list[dict[str, Any]] = []
        for page in pages:
            if not isinstance(page, dict):
                continue

            merged_page = dict(page)
            text_page = analysis_by_url.get(merged_page.get("url", ""))
            if text_page:
                merged_page["wordCount"] = text_page.get("wordCount", merged_page.get("wordCount", 0))
                merged_page["fleschReadingEase"] = text_page.get("fleschReadingEase")
                merged_page["fleschKincaidGrade"] = text_page.get("fleschKincaidGrade")
                merged_page["avgSentenceLength"] = text_page.get("avgSentenceLength")
                merged_page["avgSyllablesPerWord"] = text_page.get("avgSyllablesPerWord")
            merged_pages.append(merged_page)

        return merged_pages

    def _build_cannibalization(self, analyzer: Any) -> list[dict[str, Any]]:
        """Build keyword cannibalization findings when supporting research exists."""
        query_page_data = self._load_research_file("search-console-query-pages.json")
        if not isinstance(query_page_data, list) or not query_page_data:
            return []

        if not hasattr(analyzer, "detect_cannibalization"):
            return []

        records = analyzer.detect_cannibalization(query_page_data)
        return [self._to_dict(record) for record in records]

    def _build_content_quality_payload(
        self,
        source_pages: list[dict[str, Any]],
        records: list[Any],
        duplicate_groups: list[Any],
        cannibalization: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Convert analyzer output into the renderer's camelCase contract."""
        source_pages_by_url = {
            page.get("url", ""): page
            for page in source_pages
            if isinstance(page, dict) and page.get("url")
        }
        record_dicts = [self._to_dict(record) for record in records]
        duplicate_group_dicts = [self._transform_duplicate_group(group) for group in duplicate_groups]
        page_records = [
            self._transform_content_quality_record(
                record,
                source_pages_by_url.get(record.get("url", ""), {}),
            )
            for record in record_dicts
        ]

        quality_scores = [
            page.get("qualityScore", 0)
            for page in page_records
            if isinstance(page.get("qualityScore"), (int, float))
        ]
        readability_scores = [
            page.get("readabilityScore", 0)
            for page in page_records
            if isinstance(page.get("readabilityScore"), (int, float))
        ]
        seo_scores = [
            record.get("seo_score", 0)
            for record in record_dicts
            if isinstance(record.get("seo_score"), (int, float))
        ]
        structure_scores = [
            record.get("structure_score", 0)
            for record in record_dicts
            if isinstance(record.get("structure_score"), (int, float))
        ]

        return {
            "summary": {
                "totalPagesAnalyzed": len(page_records),
                "avgQualityScore": round(sum(quality_scores) / max(len(quality_scores), 1), 1),
                "thinPageCount": sum(1 for page in page_records if page.get("isThin")),
                "avgReadabilityScore": round(sum(readability_scores) / max(len(readability_scores), 1), 1),
                "duplicateGroupCount": len(duplicate_group_dicts),
                "cannibalizationCount": len(cannibalization),
                "avgSeoScore": round(sum(seo_scores) / max(len(seo_scores), 1), 1),
                "avgStructureScore": round(sum(structure_scores) / max(len(structure_scores), 1), 1),
            },
            "pages": page_records,
            "duplicateGroups": duplicate_group_dicts,
            "cannibalization": cannibalization,
        }

    def _transform_content_quality_record(
        self,
        record: dict[str, Any],
        source_page: dict[str, Any],
    ) -> dict[str, Any]:
        """Map analyzer record fields to renderer-friendly camelCase output."""
        readability = record.get("readability") or {}
        structure = record.get("structure") or {}

        flesch_reading_ease = self._prefer_nonzero_number(
            readability.get("flesch_reading_ease"),
            source_page.get("fleschReadingEase"),
        )
        flesch_kincaid_grade = self._prefer_nonzero_number(
            readability.get("flesch_kincaid_grade"),
            source_page.get("fleschKincaidGrade"),
        )
        word_count = self._coalesce_int(
            readability.get("word_count"),
            source_page.get("wordCount"),
        )
        avg_sentence_length = self._prefer_nonzero_number(
            readability.get("avg_sentence_length"),
            source_page.get("avgSentenceLength"),
        )
        avg_syllables_per_word = self._prefer_nonzero_number(
            source_page.get("avgSyllablesPerWord"),
            readability.get("avg_syllables_per_word"),
        )
        if avg_syllables_per_word is None:
            avg_word_length = self._to_number(readability.get("avg_word_length"))
            if avg_word_length is not None:
                avg_syllables_per_word = round(avg_word_length / 3, 2)

        readability_score = self._prefer_nonzero_number(
            record.get("readability_score"),
            flesch_reading_ease,
        )

        score_explanation = (
            f"Flesch Reading Ease {flesch_reading_ease:.1f}; "
            f"Flesch-Kincaid Grade {flesch_kincaid_grade:.1f}; "
            f"word count {word_count}."
            if flesch_reading_ease is not None and flesch_kincaid_grade is not None and word_count is not None
            else ""
        )

        return {
            "url": record.get("url", ""),
            "title": record.get("title", ""),
            "readabilityScore": readability_score,
            "qualityScore": self._to_number(record.get("quality_score")),
            "isThin": bool(record.get("is_thin", False)),
            "readability": {
                "fleschReadingEase": flesch_reading_ease,
                "fleschKincaidGrade": flesch_kincaid_grade,
                "wordCount": word_count,
                "avgSentenceLength": avg_sentence_length,
                "avgSyllablesPerWord": avg_syllables_per_word,
                "scoreExplanation": score_explanation,
            },
            "structure": {
                "headingCount": self._to_int(structure.get("heading_count")),
                "h2Count": self._to_int(structure.get("h2_count")),
                "h3Count": self._to_int(structure.get("h3_count")),
                "headingHierarchyValid": bool(structure.get("heading_hierarchy_valid", False)),
                "imageCount": self._to_int(structure.get("image_count")),
                "imagesWithAlt": self._to_int(structure.get("images_with_alt")),
                "internalLinks": self._to_int(structure.get("internal_links")),
                "hasFaqSchema": bool(structure.get("has_faq_schema", False)),
            },
            "issues": record.get("issues") or [],
            "recommendations": record.get("recommendations") or [],
        }

    def _transform_duplicate_group(self, group: Any) -> dict[str, Any]:
        """Normalize duplicate groups for the content quality report."""
        group_dict = self._to_dict(group)
        word_count_range = group_dict.get("word_count_range")
        return {
            "fingerprint": group_dict.get("fingerprint", ""),
            "pages": group_dict.get("pages") or [],
            "similarity": self._to_number(group_dict.get("similarity")),
            "wordCountRange": list(word_count_range) if isinstance(word_count_range, (list, tuple)) else [],
            "recommendation": group_dict.get("recommendation", ""),
        }

    @staticmethod
    def _to_dict(model: Any) -> Any:
        if hasattr(model, "model_dump"):
            return model.model_dump(mode="json")
        if hasattr(model, "dict"):
            return model.dict()
        if hasattr(model, "__dict__"):
            return model.__dict__
        return model

    @staticmethod
    def _to_number(value: Any) -> float | None:
        if isinstance(value, bool) or value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        return None

    @staticmethod
    def _to_int(value: Any) -> int | None:
        if isinstance(value, bool) or value is None:
            return None
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            return int(round(value))
        return None

    @classmethod
    def _coalesce_number(cls, *values: Any) -> float | None:
        for value in values:
            num = cls._to_number(value)
            if num is not None:
                return num
        return None

    @classmethod
    def _coalesce_int(cls, *values: Any) -> int | None:
        for value in values:
            num = cls._to_int(value)
            if num is not None:
                return num
        return None

    @classmethod
    def _prefer_nonzero_number(cls, *values: Any) -> float | None:
        first_numeric: float | None = None
        for value in values:
            num = cls._to_number(value)
            if num is None:
                continue
            if first_numeric is None:
                first_numeric = num
            if num != 0:
                return num
        return first_numeric

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
    parser.add_argument("--client-config", default=None, help="Path to client-config.json")
    args = parser.parse_args()

    settings = Settings()
    orchestrator = AuditOrchestrator(settings, args)
    audit_data = orchestrator.run()

    # Normalize legacy contentQuality shape before merging/writing so downstream
    # consumers always receive the renderer-friendly camelCase payload.
    content_quality = audit_data.get("contentQuality")
    if isinstance(content_quality, dict) and "summary" not in content_quality:
        pages = content_quality.get("pages") or []
        duplicate_groups = content_quality.get("duplicateGroups") or []
        total_pages = content_quality.get("totalPagesAnalyzed", content_quality.get("totalPages", len(pages)))
        avg_readability = content_quality.get("avgReadabilityScore", content_quality.get("avgReadability", 0.0))
        thin_page_count = sum(
            1
            for page in pages
            if isinstance(page, dict) and (page.get("isThin") or page.get("is_thin"))
        )
        quality_scores = [
            page.get("qualityScore", page.get("quality_score", 0))
            for page in pages
            if isinstance(page, dict)
        ]

        audit_data["contentQuality"] = {
            "summary": {
                "totalPagesAnalyzed": total_pages,
                "avgQualityScore": round(sum(quality_scores) / max(len(quality_scores), 1), 1),
                "thinPageCount": thin_page_count,
                "avgReadabilityScore": avg_readability,
                "duplicateGroupCount": len(duplicate_groups),
                "cannibalizationCount": len(content_quality.get("cannibalization") or []),
            },
            "pages": pages,
            "duplicateGroups": duplicate_groups,
            "cannibalization": content_quality.get("cannibalization") or [],
        }

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

    write_json_atomic(output_path, audit_data, indent=2)

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
