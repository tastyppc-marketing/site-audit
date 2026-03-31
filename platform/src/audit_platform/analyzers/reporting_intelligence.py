"""Reporting Intelligence Analyzer (P9).

Aggregates all analyzer outputs into a unified site health grade,
prioritized findings with ROI scoring, auto-generated action plan,
industry benchmark comparisons, and executive summary.

This is the final analyzer in the pipeline — it consumes the output
of all other analyzers (P1–P8).

Outputs to ``reportingIntelligence`` key in audit-data.json.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import structlog


class ReportingIntelligenceAnalyzer:
    """Aggregate all audit findings into actionable intelligence."""

    # ------------------------------------------------------------------
    # Category weights for site health grade
    # (Lighthouse-inspired, sum = 1.0)
    # ------------------------------------------------------------------
    CATEGORY_WEIGHTS: dict[str, float] = {
        "technical": 0.25,
        "performance": 0.25,
        "content": 0.20,
        "backlinks": 0.15,
        "indexability": 0.10,
        "local": 0.05,
    }

    # ------------------------------------------------------------------
    # Issue impact weights (0-3 scale, based on ranking factor research)
    # ------------------------------------------------------------------
    ISSUE_IMPACT: dict[str, float] = {
        # Critical performance
        "LCP_POOR": 3.0, "CLS_POOR": 3.0, "INP_POOR": 2.5,
        "MISSING_VIEWPORT": 3.0,
        # Title/meta
        "MISSING_TITLE": 2.5, "TITLE_TOO_LONG": 1.5, "TITLE_TOO_SHORT": 1.5,
        "DUPLICATE_TITLE": 2.0, "MISSING_META_DESCRIPTION": 1.5,
        "DUPLICATE_DESCRIPTION": 1.5,
        # Heading structure
        "MISSING_H1": 2.0, "MULTIPLE_H1": 2.0,
        # Schema
        "SCHEMA_PARSE_ERROR": 2.0, "SCHEMA_MISSING_REQUIRED_FIELD": 2.0,
        "NO_SCHEMA": 1.5,
        # Crawl / indexation
        "REDIRECT_LOOP": 2.5, "REDIRECT_CHAIN_LONG": 2.0, "REDIRECT_CHAIN": 1.5,
        "REDIRECT_TO_ERROR": 2.5,
        "SOFT_404": 2.0, "NOINDEX_IN_SITEMAP": 2.0,
        "SESSION_ID_IN_URL": 2.5, "FACETED_NAVIGATION": 2.0,
        "PARAMETER_EXPLOSION": 2.0,
        # Canonical
        "CANONICAL_TO_ERROR": 2.5, "CANONICAL_LOOP": 2.5,
        "CANONICAL_TO_NOINDEX": 2.0, "CANONICAL_TO_REDIRECT": 2.0,
        "CANONICAL_RELATIVE": 1.5, "CANONICAL_HEADER_MISMATCH": 1.5,
        "MULTIPLE_CANONICALS": 2.0, "NO_CANONICAL": 1.0,
        # Content
        "THIN_CONTENT": 1.5,
        # Links
        "ORPHAN_PAGE": 1.0,
        # Images / accessibility
        "MISSING_ALT_TEXT": 1.5,
        # Social
        "NO_OG_TAGS": 0.5,
        # Security
        "MISSING_HSTS": 1.0, "SERVER_VERSION_EXPOSED": 0.5,
    }

    # Effort tiers: quick-win=1, medium=2, large-project=4
    ISSUE_EFFORT: dict[str, int] = {
        "MISSING_TITLE": 1, "TITLE_TOO_LONG": 1, "TITLE_TOO_SHORT": 1,
        "MISSING_META_DESCRIPTION": 1, "MISSING_H1": 1, "MULTIPLE_H1": 1,
        "NO_OG_TAGS": 1, "NO_CANONICAL": 1, "MISSING_VIEWPORT": 1,
        "MISSING_ALT_TEXT": 2, "MISSING_HSTS": 1, "SERVER_VERSION_EXPOSED": 1,
        "NO_SCHEMA": 2, "SCHEMA_PARSE_ERROR": 1, "SCHEMA_MISSING_REQUIRED_FIELD": 1,
        "DUPLICATE_TITLE": 2, "DUPLICATE_DESCRIPTION": 2,
        "CANONICAL_RELATIVE": 1, "CANONICAL_HEADER_MISMATCH": 1,
        "CANONICAL_TO_NOINDEX": 2, "CANONICAL_TO_REDIRECT": 2,
        "CANONICAL_TO_ERROR": 1, "CANONICAL_LOOP": 2, "MULTIPLE_CANONICALS": 1,
        "REDIRECT_CHAIN": 2, "REDIRECT_CHAIN_LONG": 2,
        "REDIRECT_LOOP": 2, "REDIRECT_TO_ERROR": 2,
        "THIN_CONTENT": 4, "ORPHAN_PAGE": 2,
        "SOFT_404": 2, "NOINDEX_IN_SITEMAP": 1,
        "SESSION_ID_IN_URL": 2, "FACETED_NAVIGATION": 2, "PARAMETER_EXPLOSION": 2,
        "LCP_POOR": 4, "CLS_POOR": 4, "INP_POOR": 4,
    }

    # ------------------------------------------------------------------
    # Industry benchmarks (sourced from Google, Ahrefs, Web Almanac 2025)
    # ------------------------------------------------------------------
    BENCHMARKS: dict[str, dict[str, Any]] = {
        "pagespeed_mobile": {"label": "Mobile PageSpeed Score", "good": 80, "avg": 55, "unit": "/100", "higher_better": True},
        "lcp_seconds": {"label": "Largest Contentful Paint", "good": 2.5, "avg": 4.0, "unit": "s", "higher_better": False},
        "cls": {"label": "Cumulative Layout Shift", "good": 0.1, "avg": 0.18, "unit": "", "higher_better": False},
        "inp_ms": {"label": "Interaction to Next Paint", "good": 200, "avg": 280, "unit": "ms", "higher_better": False},
        "referring_domains": {"label": "Referring Domains", "good": 50, "avg": 15, "unit": "", "higher_better": True},
        "content_word_count": {"label": "Avg Content Word Count", "good": 1000, "avg": 800, "unit": "words", "higher_better": True},
        "schema_coverage_pct": {"label": "Schema Markup Coverage", "good": 80, "avg": 44, "unit": "%", "higher_better": True},
        "cwv_pass_rate": {"label": "Core Web Vitals Pass Rate", "good": 75, "avg": 48, "unit": "%", "higher_better": True},
    }

    GRADE_THRESHOLDS = [
        (90, "A"), (85, "A-"), (80, "B+"), (75, "B"), (70, "B-"),
        (65, "C+"), (60, "C"), (55, "C-"), (50, "D+"), (45, "D"), (40, "D-"),
    ]

    def __init__(self, history_dir: str | Path | None = None) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)
        self.history_dir = Path(history_dir) if history_dir else Path.home() / ".site-audit" / "history"

    def analyze(
        self,
        audit_data: dict[str, Any],
        domain: str = "",
    ) -> dict[str, Any]:
        """Run full reporting intelligence analysis.

        Args:
            audit_data: Complete audit data dict containing all analyzer outputs.
            domain: Client domain for trend tracking.

        Returns:
            Dict for ``reportingIntelligence`` key in audit-data.json.
        """
        self.log.info("reporting_intelligence_start", domain=domain)

        # Step 1: Extract category scores from analyzer outputs
        category_scores = self._extract_category_scores(audit_data)

        # Step 2: Compute site health grade
        health_grade = self._compute_health_grade(category_scores)

        # Step 3: Extract and prioritize all findings
        all_findings = self._extract_all_findings(audit_data)
        prioritized = self._prioritize_findings(all_findings, audit_data)

        # Step 4: Build action plan from prioritized findings
        action_plan = self._build_action_plan(prioritized)

        # Step 5: Benchmark comparisons
        benchmarks = self._compare_benchmarks(audit_data)

        # Step 6: Executive summary (template-based; Claude API optional)
        summary = self._generate_executive_summary(
            domain, health_grade, prioritized, category_scores
        )

        # Step 7: Trend tracking
        trend_data = self._load_and_save_trend(domain, health_grade, category_scores)

        result = {
            "siteHealthGrade": health_grade,
            "prioritizedFindings": prioritized[:30],
            "actionPlan": action_plan,
            "benchmarkComparisons": benchmarks,
            "executiveSummary": summary,
            "trendData": trend_data,
            "categoryScores": category_scores,
        }

        self.log.info(
            "reporting_intelligence_complete",
            grade=health_grade["letterGrade"],
            score=health_grade["compositeScore"],
            findings=len(prioritized),
            quick_wins=len(action_plan.get("quickWins", [])),
        )

        return result

    # ------------------------------------------------------------------
    # Category Score Extraction
    # ------------------------------------------------------------------

    def _extract_category_scores(self, data: dict[str, Any]) -> dict[str, Optional[float]]:
        """Derive 0-100 scores for each category from analyzer outputs."""
        scores: dict[str, Optional[float]] = {}

        # Technical (from technicalSeo analyzer)
        tech = data.get("technicalSeo") or {}
        meta = tech.get("metaTagSummary") or {}
        canonical = tech.get("canonicalAudit") or {}
        redirect = tech.get("redirectChains") or {}
        headers = tech.get("securityHeaders") or {}
        mobile = tech.get("mobileUsability") or {}

        tech_issues = (
            (canonical.get("summary") or {}).get("totalIssues", 0) +
            (redirect.get("summary") or {}).get("totalIssues", 0) +
            (headers.get("summary") or {}).get("totalIssues", 0) +
            (mobile.get("summary") or {}).get("totalIssues", 0) +
            meta.get("pagesWithoutTitle", 0) +
            meta.get("duplicateTitles", 0)
        )
        total_pages = meta.get("pagesWithTitle", 0) + meta.get("pagesWithoutTitle", 0) or 1
        tech_ratio = min(tech_issues / (total_pages * 3), 1.0)  # Normalize
        scores["technical"] = max(0, round(100 - tech_ratio * 100)) if tech else None

        # Performance (from CWV / PageSpeed data)
        perf = data.get("coreWebVitals") or data.get("performance") or {}
        mobile_perf = perf.get("mobile") or {}
        perf_score = mobile_perf.get("score")
        if perf_score is not None:
            scores["performance"] = round(float(perf_score) * 100) if perf_score <= 1 else round(float(perf_score))
        else:
            scores["performance"] = None

        # Content (from contentQuality analyzer)
        cq = data.get("contentQuality") or {}
        cq_summary = cq.get("summary") or {}
        scores["content"] = cq_summary.get("avgQualityScore") if cq_summary else None

        # Backlinks
        bl = data.get("backlinks") or {}
        bl_metrics = bl.get("domainMetrics") or {}
        dr = bl_metrics.get("domainRating")
        if dr is not None:
            # Map DR (0-100) to a score. DR 50+ is strong, DR 20 is weak.
            scores["backlinks"] = min(round(float(dr) * 1.5), 100)
        else:
            scores["backlinks"] = None

        # Indexability (from indexation_crawlability analyzer)
        idx = data.get("indexationCrawlability") or {}
        crawl_health = idx.get("crawlBudgetHealth") or {}
        scores["indexability"] = crawl_health.get("score") if crawl_health else None

        # Local (from localSeo)
        local = data.get("localSeo") or {}
        gbp = local.get("businessProfile") or {}
        if gbp.get("isVerified") is not None:
            # Simple scoring: verified + rating + review count
            local_score = 50  # Base for having a profile
            if gbp.get("isVerified"):
                local_score += 20
            rating = gbp.get("rating") or 0
            if rating >= 4.5:
                local_score += 20
            elif rating >= 4.0:
                local_score += 10
            reviews = gbp.get("reviewCount") or 0
            if reviews >= 50:
                local_score += 10
            elif reviews >= 20:
                local_score += 5
            scores["local"] = min(local_score, 100)
        else:
            scores["local"] = None

        return scores

    # ------------------------------------------------------------------
    # Health Grade Computation
    # ------------------------------------------------------------------

    def _compute_health_grade(
        self, scores: dict[str, Optional[float]]
    ) -> dict[str, Any]:
        """Compute weighted composite score and letter grade.

        Uses Lighthouse-inspired weighted average with floor penalty:
        if any category is below 40, caps composite at C.
        """
        # Filter to non-None scores and renormalize weights
        active: dict[str, float] = {}
        for cat, score in scores.items():
            if score is not None:
                active[cat] = score

        if not active:
            return {"compositeScore": 0, "letterGrade": "F", "floorPenaltyApplied": False}

        # Renormalize weights for active categories
        total_weight = sum(self.CATEGORY_WEIGHTS.get(cat, 0) for cat in active)
        if total_weight == 0:
            return {"compositeScore": 0, "letterGrade": "F", "floorPenaltyApplied": False}

        composite = sum(
            score * (self.CATEGORY_WEIGHTS.get(cat, 0) / total_weight)
            for cat, score in active.items()
        )

        # Floor penalty
        min_score = min(active.values())
        floor_penalty = False
        if min_score < 20:
            composite = min(composite, 50)
            floor_penalty = True
        elif min_score < 40:
            composite = min(composite, 65)
            floor_penalty = True

        composite = round(composite)

        # Map to letter grade
        letter = "F"
        for threshold, grade in self.GRADE_THRESHOLDS:
            if composite >= threshold:
                letter = grade
                break

        return {
            "compositeScore": composite,
            "letterGrade": letter,
            "floorPenaltyApplied": floor_penalty,
        }

    # ------------------------------------------------------------------
    # Finding Extraction + Prioritization
    # ------------------------------------------------------------------

    def _extract_all_findings(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        """Collect all issues from all analyzer outputs into a flat list."""
        findings: list[dict[str, Any]] = []

        # Technical SEO issues
        tech = data.get("technicalSeo") or {}
        for issue_list_key in ["metaTagIssues", "crawlIssues"]:
            for issue in (tech.get(issue_list_key) or []):
                findings.append({**issue, "category": "technical"})

        for sub_key in ["canonicalAudit", "redirectChains", "securityHeaders", "indexability", "mobileUsability", "structuredDataValidation"]:
            sub = tech.get(sub_key) or {}
            for issue in (sub.get("issues") or []):
                findings.append({**issue, "category": "technical"})

        # Indexation issues
        idx = data.get("indexationCrawlability") or {}
        for sub_key in ["parameterAudit", "paginationAudit", "soft404s"]:
            sub = idx.get(sub_key) or {}
            for issue in (sub.get("issues") or []):
                findings.append({**issue, "category": "indexability"})

        # Content quality issues (thin, duplicate)
        cq = data.get("contentQuality") or {}
        thin_count = (cq.get("summary") or {}).get("thinPageCount", 0)
        if thin_count > 0:
            findings.append({
                "issue": "THIN_CONTENT",
                "detail": f"{thin_count} pages have thin content (below word count threshold)",
                "url": "",
                "category": "content",
                "affectedCount": thin_count,
            })

        dupe_count = (cq.get("summary") or {}).get("duplicateGroupCount", 0)
        if dupe_count > 0:
            findings.append({
                "issue": "DUPLICATE_CONTENT",
                "detail": f"{dupe_count} groups of duplicate/near-duplicate content detected",
                "url": "",
                "category": "content",
                "affectedCount": dupe_count,
            })

        return findings

    def _prioritize_findings(
        self, findings: list[dict[str, Any]], data: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """Score and sort findings by ROI (impact × reach / effort)."""
        total_pages = self._count_total_pages(data)

        # Dedupe by issue type, aggregate counts
        issue_groups: dict[str, dict[str, Any]] = {}
        for f in findings:
            code = f.get("issue", "UNKNOWN")
            if code not in issue_groups:
                issue_groups[code] = {
                    "issue": code,
                    "detail": f.get("detail", ""),
                    "category": f.get("category", ""),
                    "severity": f.get("severity", ""),
                    "count": 0,
                    "sampleUrls": [],
                }
            issue_groups[code]["count"] += 1
            url = f.get("url", "")
            if url and len(issue_groups[code]["sampleUrls"]) < 3:
                issue_groups[code]["sampleUrls"].append(url)

        prioritized: list[dict[str, Any]] = []
        for code, group in issue_groups.items():
            impact = self.ISSUE_IMPACT.get(code, 1.0)
            effort = self.ISSUE_EFFORT.get(code, 2)
            count_ratio = min(group["count"] / max(total_pages, 1), 1.0)

            roi_score = round((impact * count_ratio * 100) / effort)
            roi_score = min(roi_score, 100)

            # Map effort points to labels
            effort_label = "Low" if effort <= 1 else ("Medium" if effort <= 2 else "High")
            impact_label = "Critical" if impact >= 2.5 else ("High" if impact >= 2.0 else ("Medium" if impact >= 1.0 else "Low"))

            prioritized.append({
                "issue": group["detail"] or code,
                "issueCode": code,
                "detail": group["detail"],
                "impact": impact_label,
                "effort": effort_label,
                "roiScore": roi_score,
                "affectedCount": group["count"],
                "category": group["category"],
                "sampleUrls": group["sampleUrls"],
            })

        prioritized.sort(key=lambda f: f["roiScore"], reverse=True)
        return prioritized

    # ------------------------------------------------------------------
    # Action Plan Builder
    # ------------------------------------------------------------------

    def _build_action_plan(
        self, prioritized: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Bucket prioritized findings into timeline phases."""
        quick_wins: list[dict[str, Any]] = []
        short_term: list[dict[str, Any]] = []
        medium_term: list[dict[str, Any]] = []
        long_term: list[dict[str, Any]] = []

        for finding in prioritized:
            effort = finding.get("effort", "Medium")
            roi = finding.get("roiScore", 0)

            item = {
                "action": finding["issue"],
                "why": finding.get("detail", ""),
                "effort": effort,
                "impact": finding.get("impact", "Medium"),
                "roiScore": roi,
                "affectedCount": finding.get("affectedCount", 0),
            }

            if effort == "Low" and roi >= 20:
                quick_wins.append(item)
            elif roi >= 15:
                short_term.append(item)
            elif roi >= 5:
                medium_term.append(item)
            else:
                long_term.append(item)

        return {
            "quickWins": quick_wins[:10],
            "shortTerm": short_term[:10],
            "mediumTerm": medium_term[:10],
            "longTerm": long_term[:10],
        }

    # ------------------------------------------------------------------
    # Benchmark Comparisons
    # ------------------------------------------------------------------

    def _compare_benchmarks(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        """Compare client metrics against industry benchmarks."""
        comparisons: list[dict[str, Any]] = []

        # Extract client values
        perf = data.get("coreWebVitals") or data.get("performance") or {}
        mobile = perf.get("mobile") or {}
        bl = data.get("backlinks") or {}
        bl_metrics = bl.get("domainMetrics") or {}
        tech = data.get("technicalSeo") or {}
        schema_summary = tech.get("schemaSummary") or {}

        client_values: dict[str, Optional[float]] = {
            "pagespeed_mobile": (mobile.get("score") or 0) * 100 if mobile.get("score") and mobile["score"] <= 1 else mobile.get("score"),
            "lcp_seconds": (mobile.get("lcp") or 0) / 1000 if mobile.get("lcp") else None,
            "cls": mobile.get("cls"),
            "inp_ms": mobile.get("inp"),
            "referring_domains": bl_metrics.get("referringDomains"),
        }

        # Schema coverage
        with_schema = schema_summary.get("pagesWithSchema", 0)
        without_schema = schema_summary.get("pagesWithoutSchema", 0)
        total_schema = with_schema + without_schema
        if total_schema > 0:
            client_values["schema_coverage_pct"] = round(with_schema / total_schema * 100, 1)

        for key, benchmark in self.BENCHMARKS.items():
            client_val = client_values.get(key)
            if client_val is None:
                continue

            good = benchmark["good"]
            higher_better = benchmark["higher_better"]

            if higher_better:
                status = "above" if client_val >= good else ("at" if client_val >= benchmark["avg"] else "below")
            else:
                status = "above" if client_val <= good else ("at" if client_val <= benchmark["avg"] else "below")

            comparisons.append({
                "metric": benchmark["label"],
                "clientValue": client_val,
                "benchmark": good,
                "industryAvg": benchmark["avg"],
                "unit": benchmark["unit"],
                "status": status,
            })

        return comparisons

    # ------------------------------------------------------------------
    # Executive Summary
    # ------------------------------------------------------------------

    def _generate_executive_summary(
        self,
        domain: str,
        health_grade: dict[str, Any],
        findings: list[dict[str, Any]],
        category_scores: dict[str, Optional[float]],
    ) -> str:
        """Generate executive summary (template-based, Claude API optional)."""
        grade = health_grade.get("letterGrade", "?")
        score = health_grade.get("compositeScore", 0)

        # Try Claude API first
        summary = self._try_claude_summary(domain, grade, score, findings, category_scores)
        if summary:
            return summary

        # Template fallback
        top_issues = [f["issue"] for f in findings[:3]]
        quick_wins = [f["issue"] for f in findings if f.get("effort") == "Low"][:3]

        scores_text = ", ".join(
            f"{cat}: {s}/100" for cat, s in category_scores.items()
            if s is not None
        )

        summary = (
            f"{domain or 'The site'} scored an overall grade of {grade} ({score}/100). "
        )
        if top_issues:
            summary += f"The biggest opportunities are: {'; '.join(top_issues)}. "
        if quick_wins:
            summary += f"Quick wins include: {'; '.join(quick_wins)}. "
        if scores_text:
            summary += f"Category breakdown: {scores_text}."

        return summary

    def _try_claude_summary(
        self,
        domain: str,
        grade: str,
        score: int,
        findings: list[dict[str, Any]],
        category_scores: dict[str, Optional[float]],
    ) -> Optional[str]:
        """Attempt to generate summary via Claude API. Returns None if unavailable."""
        try:
            import anthropic
        except ImportError:
            return None

        import os
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return None

        try:
            client = anthropic.Anthropic(api_key=api_key)
            top_findings = findings[:10]

            prompt = (
                f"You are a senior SEO consultant writing a 2-paragraph executive summary "
                f"for a client presentation. The client is {domain}.\n\n"
                f"Site health grade: {grade} ({score}/100)\n"
                f"Category scores: {json.dumps(category_scores)}\n"
                f"Top findings (by ROI): {json.dumps(top_findings, default=str)}\n\n"
                f"Write a concise, professional 2-paragraph summary. First paragraph: "
                f"overall assessment and biggest opportunities. Second paragraph: "
                f"recommended immediate actions. No bullet points, just flowing prose. "
                f"Be specific about the numbers."
            )

            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        except Exception as exc:
            self.log.warning("claude_summary_failed", error=str(exc))
            return None

    # ------------------------------------------------------------------
    # Trend Tracking
    # ------------------------------------------------------------------

    def _load_and_save_trend(
        self,
        domain: str,
        health_grade: dict[str, Any],
        category_scores: dict[str, Optional[float]],
    ) -> dict[str, Any]:
        """Load historical data, save current snapshot, compute deltas."""
        if not domain:
            return {"auditDates": [], "compositeScores": [], "delta": None}

        domain_dir = self.history_dir / domain.replace(".", "_")
        today = datetime.now().strftime("%Y-%m-%d")

        # Load existing history
        audit_dates: list[str] = []
        composite_scores: list[float] = []
        category_trends: dict[str, list[float]] = {}

        try:
            if domain_dir.exists():
                for f in sorted(domain_dir.glob("*.json")):
                    try:
                        snapshot = json.loads(f.read_text())
                        audit_dates.append(snapshot.get("date", f.stem))
                        composite_scores.append(snapshot.get("compositeScore", 0))
                        for cat, val in snapshot.get("categoryScores", {}).items():
                            category_trends.setdefault(cat, []).append(val)
                    except Exception:
                        continue
        except Exception as exc:
            self.log.warning("trend_load_failed", error=str(exc))

        # Save current snapshot
        current_score = health_grade.get("compositeScore", 0)
        try:
            domain_dir.mkdir(parents=True, exist_ok=True)
            snapshot = {
                "date": today,
                "compositeScore": current_score,
                "letterGrade": health_grade.get("letterGrade", "?"),
                "categoryScores": {k: v for k, v in category_scores.items() if v is not None},
            }
            (domain_dir / f"{today}.json").write_text(json.dumps(snapshot, indent=2))
        except Exception as exc:
            self.log.warning("trend_save_failed", error=str(exc))

        # Add current to history
        audit_dates.append(today)
        composite_scores.append(current_score)

        # Compute delta
        delta = None
        if len(composite_scores) >= 2:
            change = composite_scores[-1] - composite_scores[-2]
            trend = "improving" if change > 2 else ("declining" if change < -2 else "stable")
            delta = {"composite": round(change), "trend": trend}

        return {
            "auditDates": audit_dates[-12:],  # Last 12 audits
            "compositeScores": composite_scores[-12:],
            "categoryTrends": {k: v[-12:] for k, v in category_trends.items()},
            "delta": delta,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _count_total_pages(data: dict[str, Any]) -> int:
        """Get total page count from any available source."""
        tech = data.get("technicalSeo") or {}
        meta = tech.get("metaTagSummary") or {}
        total = meta.get("pagesWithTitle", 0) + meta.get("pagesWithoutTitle", 0)
        if total > 0:
            return total

        url_struct = tech.get("urlStructure") or {}
        return (url_struct.get("summary") or {}).get("totalPages", 1)
