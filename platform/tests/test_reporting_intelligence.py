"""Tests for ReportingIntelligenceAnalyzer (P9)."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

import pytest

from audit_platform.analyzers.reporting_intelligence import ReportingIntelligenceAnalyzer


@pytest.fixture()
def analyzer(tmp_path):
    return ReportingIntelligenceAnalyzer(history_dir=tmp_path / "history")


@pytest.fixture()
def full_audit_data():
    """Simulate a complete audit with all analyzer outputs."""
    return {
        "client": {"website": "example.com", "name": "Example Corp"},
        "technicalSeo": {
            "metaTagSummary": {
                "pagesWithTitle": 95,
                "pagesWithoutTitle": 5,
                "duplicateTitles": 3,
                "pagesWithDescription": 90,
                "pagesWithoutDescription": 10,
                "duplicateDescriptions": 5,
                "pagesWithCanonical": 85,
                "pagesWithoutCanonical": 15,
            },
            "metaTagIssues": [
                {"url": "/page1", "issue": "MISSING_TITLE", "detail": "No title"},
                {"url": "/page2", "issue": "MISSING_TITLE", "detail": "No title"},
                {"url": "/page3", "issue": "DUPLICATE_TITLE", "detail": "Dupe"},
            ],
            "canonicalAudit": {
                "summary": {"totalIssues": 2},
                "issues": [
                    {"url": "/old", "issue": "CANONICAL_RELATIVE", "detail": "Relative canonical"},
                    {"url": "/x", "issue": "CANONICAL_TO_NOINDEX", "detail": "Points to noindex"},
                ],
            },
            "redirectChains": {"summary": {"totalIssues": 1}, "issues": [{"url": "/redir", "issue": "REDIRECT_CHAIN", "detail": "2 hops"}]},
            "securityHeaders": {"summary": {"totalIssues": 3}, "issues": [{"url": "/", "issue": "MISSING_HSTS", "detail": "No HSTS"}]},
            "indexability": {"summary": {"totalIssues": 0}, "issues": []},
            "mobileUsability": {"summary": {"totalIssues": 1}, "issues": [{"url": "/", "issue": "MISSING_VIEWPORT", "detail": "No viewport"}]},
            "structuredDataValidation": {"summary": {"totalIssues": 1}, "issues": [{"url": "/", "issue": "SCHEMA_MISSING_REQUIRED_FIELD", "detail": "Missing name"}]},
            "schemaSummary": {"pagesWithSchema": 10, "pagesWithoutSchema": 90},
            "urlStructure": {"summary": {"totalPages": 100}},
        },
        "coreWebVitals": {
            "mobile": {"score": 0.45, "lcp": 5200, "cls": 0.35, "inp": 300, "fcp": 2800, "ttfb": 200},
        },
        "contentQuality": {
            "summary": {"avgQualityScore": 55, "thinPageCount": 15, "duplicateGroupCount": 3},
        },
        "backlinks": {
            "domainMetrics": {"domainRating": 32, "referringDomains": 48, "totalBacklinks": 156},
        },
        "indexationCrawlability": {
            "crawlBudgetHealth": {"score": 65},
            "parameterAudit": {"issues": [{"issue": "FACETED_NAVIGATION", "detail": "Faceted nav"}]},
            "paginationAudit": {"issues": []},
            "soft404s": {"issues": [{"issue": "SOFT_404", "detail": "Soft 404"}]},
        },
        "localSeo": {
            "businessProfile": {"isVerified": True, "rating": 4.8, "reviewCount": 45},
        },
    }


# ---------------------------------------------------------------------------
# Tests — Category Score Extraction
# ---------------------------------------------------------------------------


def test_extract_category_scores(analyzer, full_audit_data):
    scores = analyzer._extract_category_scores(full_audit_data)
    assert "technical" in scores
    assert "performance" in scores
    assert "content" in scores
    assert "backlinks" in scores
    assert "indexability" in scores
    assert "local" in scores


def test_category_scores_performance_from_cwv(analyzer, full_audit_data):
    scores = analyzer._extract_category_scores(full_audit_data)
    assert scores["performance"] == 45  # 0.45 * 100


def test_category_scores_content(analyzer, full_audit_data):
    scores = analyzer._extract_category_scores(full_audit_data)
    assert scores["content"] == 55


def test_category_scores_indexability(analyzer, full_audit_data):
    scores = analyzer._extract_category_scores(full_audit_data)
    assert scores["indexability"] == 65


def test_category_scores_missing_data(analyzer):
    scores = analyzer._extract_category_scores({})
    assert all(v is None for v in scores.values())


# ---------------------------------------------------------------------------
# Tests — Health Grade Computation
# ---------------------------------------------------------------------------


def test_health_grade_computation(analyzer):
    scores = {"technical": 70, "performance": 50, "content": 60, "backlinks": 40, "indexability": 65, "local": 80}
    grade = analyzer._compute_health_grade(scores)
    assert 0 <= grade["compositeScore"] <= 100
    assert grade["letterGrade"] in ("A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F")


def test_health_grade_all_perfect(analyzer):
    scores = {"technical": 100, "performance": 100, "content": 100, "backlinks": 100, "indexability": 100, "local": 100}
    grade = analyzer._compute_health_grade(scores)
    assert grade["compositeScore"] == 100
    assert grade["letterGrade"] == "A"


def test_health_grade_all_zero(analyzer):
    scores = {"technical": 0, "performance": 0, "content": 0}
    grade = analyzer._compute_health_grade(scores)
    assert grade["letterGrade"] == "F"


def test_health_grade_floor_penalty(analyzer):
    # One category catastrophically bad should cap the composite
    scores = {"technical": 90, "performance": 15, "content": 85, "backlinks": 80}
    grade = analyzer._compute_health_grade(scores)
    assert grade["compositeScore"] <= 50
    assert grade["floorPenaltyApplied"] is True


def test_health_grade_moderate_floor_penalty(analyzer):
    scores = {"technical": 90, "performance": 35, "content": 85, "backlinks": 80}
    grade = analyzer._compute_health_grade(scores)
    assert grade["compositeScore"] <= 65
    assert grade["floorPenaltyApplied"] is True


def test_health_grade_no_floor_penalty(analyzer):
    scores = {"technical": 70, "performance": 60, "content": 55}
    grade = analyzer._compute_health_grade(scores)
    assert grade["floorPenaltyApplied"] is False


def test_health_grade_missing_categories(analyzer):
    # Only 2 categories available — should renormalize
    scores = {"technical": 80, "performance": 70, "content": None, "backlinks": None}
    grade = analyzer._compute_health_grade(scores)
    assert grade["compositeScore"] > 0
    assert grade["letterGrade"] != "F"


def test_health_grade_empty(analyzer):
    grade = analyzer._compute_health_grade({})
    assert grade["letterGrade"] == "F"


# Grade boundary tests
@pytest.mark.parametrize("score,expected_grade", [
    (95, "A"), (87, "A-"), (82, "B+"), (76, "B"), (71, "B-"),
    (67, "C+"), (62, "C"), (57, "C-"), (52, "D+"), (47, "D"), (42, "D-"), (35, "F"),
])
def test_grade_boundaries(analyzer, score, expected_grade):
    scores = {"technical": score}
    grade = analyzer._compute_health_grade(scores)
    assert grade["letterGrade"] == expected_grade


# ---------------------------------------------------------------------------
# Tests — Finding Prioritization
# ---------------------------------------------------------------------------


def test_prioritization_ordering(analyzer, full_audit_data):
    findings = analyzer._extract_all_findings(full_audit_data)
    prioritized = analyzer._prioritize_findings(findings, full_audit_data)

    # High-impact low-effort should rank above low-impact high-effort
    roi_scores = [f["roiScore"] for f in prioritized]
    assert roi_scores == sorted(roi_scores, reverse=True)


def test_prioritization_deduplication(analyzer, full_audit_data):
    findings = analyzer._extract_all_findings(full_audit_data)
    prioritized = analyzer._prioritize_findings(findings, full_audit_data)

    # MISSING_TITLE appears twice in issues — should be grouped into 1
    missing_title = [f for f in prioritized if f["issueCode"] == "MISSING_TITLE"]
    assert len(missing_title) == 1
    assert missing_title[0]["affectedCount"] == 2


def test_prioritization_effort_labels(analyzer, full_audit_data):
    findings = analyzer._extract_all_findings(full_audit_data)
    prioritized = analyzer._prioritize_findings(findings, full_audit_data)

    for f in prioritized:
        assert f["effort"] in ("Low", "Medium", "High")
        assert f["impact"] in ("Critical", "High", "Medium", "Low")


# ---------------------------------------------------------------------------
# Tests — Action Plan
# ---------------------------------------------------------------------------


def test_action_plan_has_buckets(analyzer, full_audit_data):
    findings = analyzer._extract_all_findings(full_audit_data)
    prioritized = analyzer._prioritize_findings(findings, full_audit_data)
    plan = analyzer._build_action_plan(prioritized)

    assert "quickWins" in plan
    assert "shortTerm" in plan
    assert "mediumTerm" in plan
    assert "longTerm" in plan


def test_action_plan_quick_wins_low_effort(analyzer, full_audit_data):
    findings = analyzer._extract_all_findings(full_audit_data)
    prioritized = analyzer._prioritize_findings(findings, full_audit_data)
    plan = analyzer._build_action_plan(prioritized)

    for item in plan["quickWins"]:
        assert item["effort"] == "Low"


def test_action_plan_capped_at_10(analyzer):
    # Create 50 low-effort findings
    findings = [{"issue": f"ISSUE_{i}", "detail": f"Issue {i}", "category": "technical"} for i in range(50)]
    prioritized = [{"issue": f"Issue {i}", "effort": "Low", "roiScore": 50 - i, "affectedCount": 1, "impact": "High", "detail": ""} for i in range(50)]
    plan = analyzer._build_action_plan(prioritized)
    assert len(plan["quickWins"]) <= 10


# ---------------------------------------------------------------------------
# Tests — Benchmarks
# ---------------------------------------------------------------------------


def test_benchmarks_comparison(analyzer, full_audit_data):
    benchmarks = analyzer._compare_benchmarks(full_audit_data)
    assert len(benchmarks) > 0

    # LCP of 5.2s should be "below" the 2.5s good threshold
    lcp = next((b for b in benchmarks if "LCP" in b["metric"]), None)
    if lcp:
        assert lcp["status"] == "below"


def test_benchmarks_schema_coverage(analyzer, full_audit_data):
    benchmarks = analyzer._compare_benchmarks(full_audit_data)
    schema = next((b for b in benchmarks if "Schema" in b["metric"]), None)
    if schema:
        assert schema["clientValue"] == 10.0  # 10 / 100 = 10%


def test_benchmarks_empty_data(analyzer):
    benchmarks = analyzer._compare_benchmarks({})
    assert benchmarks == []


# ---------------------------------------------------------------------------
# Tests — Executive Summary
# ---------------------------------------------------------------------------


def test_template_summary(analyzer, full_audit_data):
    scores = analyzer._extract_category_scores(full_audit_data)
    grade = analyzer._compute_health_grade(scores)
    findings = analyzer._extract_all_findings(full_audit_data)
    prioritized = analyzer._prioritize_findings(findings, full_audit_data)

    summary = analyzer._generate_executive_summary("example.com", grade, prioritized, scores)
    assert "example.com" in summary
    assert grade["letterGrade"] in summary
    assert len(summary) > 50


def test_template_summary_empty(analyzer):
    summary = analyzer._generate_executive_summary("", {"letterGrade": "F", "compositeScore": 0}, [], {})
    assert len(summary) > 0


# ---------------------------------------------------------------------------
# Tests — Trend Tracking
# ---------------------------------------------------------------------------


def test_trend_save_and_load(analyzer, tmp_path):
    analyzer.history_dir = tmp_path / "history"

    # Seed a previous snapshot at an earlier date
    domain_dir = analyzer.history_dir / "example_com"
    domain_dir.mkdir(parents=True, exist_ok=True)
    prev = {"date": "2026-02-01", "compositeScore": 45, "letterGrade": "D", "categoryScores": {"technical": 50}}
    (domain_dir / "2026-02-01.json").write_text(json.dumps(prev))

    # Now run current analysis — should pick up the previous snapshot and compute delta
    scores = {"technical": 60, "content": 55}
    grade = {"compositeScore": 58, "letterGrade": "C-"}
    trend = analyzer._load_and_save_trend("example.com", grade, scores)

    assert len(trend["auditDates"]) >= 2  # Previous + current
    assert trend["delta"] is not None
    assert trend["delta"]["composite"] > 0  # 58 - 45 = +13
    assert trend["delta"]["trend"] == "improving"


def test_trend_empty_domain(analyzer):
    trend = analyzer._load_and_save_trend("", {"compositeScore": 50}, {})
    assert trend["auditDates"] == []


# ---------------------------------------------------------------------------
# Tests — Full Pipeline
# ---------------------------------------------------------------------------


def test_full_analyze(analyzer, full_audit_data):
    result = analyzer.analyze(full_audit_data, domain="example.com")

    assert "siteHealthGrade" in result
    assert "prioritizedFindings" in result
    assert "actionPlan" in result
    assert "benchmarkComparisons" in result
    assert "executiveSummary" in result
    assert "trendData" in result
    assert "categoryScores" in result

    assert result["siteHealthGrade"]["letterGrade"] != "F"  # Has data, shouldn't be F
    assert len(result["prioritizedFindings"]) > 0
    assert len(result["executiveSummary"]) > 0


def test_full_analyze_empty_data(analyzer):
    result = analyzer.analyze({})
    assert result["siteHealthGrade"]["letterGrade"] == "F"
    assert result["prioritizedFindings"] == []
