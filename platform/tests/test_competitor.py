"""Tests for CompetitorAnalyzer (P5)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from audit_platform.analyzers.competitor import CompetitorAnalyzer
from audit_platform.models.seo import DomainMetrics


@pytest.fixture()
def mock_connector():
    connector = MagicMock()

    connector.get_organic_competitors.return_value = [
        {"domain": "competitor1.com", "intersections": 45, "organicKeywords": 500},
        {"domain": "competitor2.com", "intersections": 30, "organicKeywords": 300},
        {"domain": "www.example.com", "intersections": 100, "organicKeywords": 89},  # self — should be filtered
    ]

    connector.get_competitors.return_value = [
        DomainMetrics(domain="competitor1.com", referring_domains=150, source="dataforseo"),
        DomainMetrics(domain="competitor3.com", referring_domains=80, source="dataforseo"),
    ]

    connector.get_organic_keywords.side_effect = lambda domain, **kwargs: {
        "example.com": [
            {"keyword": "homes for sale", "position": 5},
            {"keyword": "real estate agent", "position": 10},
            {"keyword": "luxury homes", "position": 15},
        ],
        "competitor1.com": [
            {"keyword": "homes for sale", "position": 3},
            {"keyword": "condos for sale", "position": 7},
            {"keyword": "luxury homes", "position": 8},
            {"keyword": "vacation rentals", "position": 12},
        ],
        "competitor2.com": [
            {"keyword": "homes for sale", "position": 1},
            {"keyword": "real estate agent", "position": 5},
            {"keyword": "market report", "position": 3},
        ],
    }.get(domain, [])

    connector.get_serp.return_value = [
        {"type": "organic", "rank_group": 1, "domain": "competitor2.com", "url": "https://competitor2.com/homes", "title": "Homes"},
        {"type": "featured_snippet", "rank_group": 0, "domain": "competitor1.com", "url": "https://competitor1.com/guide", "title": "Guide"},
        {"type": "people_also_ask", "rank_group": None, "domain": "", "url": "", "title": ""},
        {"type": "local_pack", "rank_group": None, "domain": "example.com", "url": "", "title": "Example"},
        {"type": "organic", "rank_group": 3, "domain": "example.com", "url": "https://example.com/homes", "title": "Our Homes"},
    ]

    return connector


@pytest.fixture()
def analyzer(mock_connector):
    return CompetitorAnalyzer(mock_connector)


# ---------------------------------------------------------------------------
# Tests — Competitor Discovery
# ---------------------------------------------------------------------------


def test_discover_competitors_merges_sources(analyzer):
    result = analyzer.discover_competitors("example.com")
    domains = [c["domain"] for c in result]

    assert "competitor1.com" in domains  # from both organic + backlink
    assert "competitor2.com" in domains  # from organic only
    assert "competitor3.com" in domains  # from backlink only
    assert "example.com" not in domains  # self filtered


def test_discover_competitors_includes_manual(analyzer):
    result = analyzer.discover_competitors("example.com", manual_competitors=["manual-comp.com"])
    domains = [c["domain"] for c in result]
    assert "manual-comp.com" in domains


def test_discover_competitors_deduplicates(analyzer):
    result = analyzer.discover_competitors("example.com")
    domains = [c["domain"] for c in result]
    # competitor1.com appears in both organic + backlink — should appear once
    assert domains.count("competitor1.com") == 1


def test_discover_competitors_scores(analyzer):
    result = analyzer.discover_competitors("example.com")
    # competitor1 should score highest (organic + backlink overlap)
    assert result[0]["domain"] == "competitor1.com"
    assert result[0]["score"] > 0


def test_discover_competitors_handles_api_failure(analyzer, mock_connector):
    mock_connector.get_organic_competitors.side_effect = Exception("API down")
    mock_connector.get_competitors.side_effect = Exception("API down")
    result = analyzer.discover_competitors("example.com", manual_competitors=["manual.com"])
    assert len(result) == 1
    assert result[0]["domain"] == "manual.com"


# ---------------------------------------------------------------------------
# Tests — Keyword Overlap
# ---------------------------------------------------------------------------


def test_keyword_overlap_matrix(analyzer):
    result = analyzer.analyze_keyword_overlap("example.com", ["competitor1.com", "competitor2.com"])

    assert "overlapMatrix" in result
    assert "keywordGaps" in result
    assert "summary" in result

    matrix = result["overlapMatrix"]
    assert len(matrix) == 3  # client + 2 competitors


def test_keyword_overlap_jaccard(analyzer):
    result = analyzer.analyze_keyword_overlap("example.com", ["competitor1.com"])
    matrix = result["overlapMatrix"]

    # client: {homes for sale, real estate agent, luxury homes}
    # comp1: {homes for sale, condos for sale, luxury homes, vacation rentals}
    # intersection: {homes for sale, luxury homes} = 2
    # union: 5
    # jaccard: 2/5 = 0.4
    client_row = next(r for r in matrix if r["domain"] == "example.com")
    assert client_row["competitor1.com"] == 0.4


def test_keyword_overlap_gaps(analyzer):
    result = analyzer.analyze_keyword_overlap("example.com", ["competitor1.com"])
    gaps = result["keywordGaps"]

    gap_keywords = [g["keyword"] for g in gaps]
    assert "condos for sale" in gap_keywords
    assert "vacation rentals" in gap_keywords
    # "homes for sale" and "luxury homes" are shared — not gaps
    assert "homes for sale" not in gap_keywords


def test_keyword_overlap_client_only(analyzer):
    result = analyzer.analyze_keyword_overlap("example.com", ["competitor1.com"])
    client_only = result["clientOnlyKeywords"]
    assert "real estate agent" in client_only


def test_keyword_overlap_summary(analyzer):
    result = analyzer.analyze_keyword_overlap("example.com", ["competitor1.com", "competitor2.com"])
    s = result["summary"]
    assert s["clientKeywords"] == 3
    assert s["gapKeywords"] > 0


# ---------------------------------------------------------------------------
# Tests — SERP Feature Analysis
# ---------------------------------------------------------------------------


def test_serp_feature_ownership(analyzer):
    result = analyzer.analyze_serp_features(
        "example.com",
        ["competitor1.com", "competitor2.com"],
        ["homes for sale"],
    )

    assert "perKeyword" in result
    assert "perDomain" in result

    # Check that we detected features
    domain_data = {d["domain"]: d for d in result["perDomain"]}
    assert domain_data.get("competitor1.com", {}).get("featuredSnippets", 0) == 1
    assert domain_data.get("example.com", {}).get("localPack", 0) == 1


def test_serp_features_caps_keywords(analyzer, mock_connector):
    # Should cap at 25 keywords
    many_keywords = [f"keyword-{i}" for i in range(50)]
    analyzer.analyze_serp_features("example.com", ["comp.com"], many_keywords)
    assert mock_connector.get_serp.call_count == 25


# ---------------------------------------------------------------------------
# Tests — Tech Stack Detection
# ---------------------------------------------------------------------------


def test_tech_stack_detection(analyzer):
    with patch("httpx.Client") as mock_client:
        mock_resp = MagicMock()
        mock_resp.headers = {
            "server": "nginx/1.21.6",
            "x-powered-by": "Express",
            "cf-ray": "abc123",
        }
        mock_resp.text = '<html><script src="/wp-content/themes/test.js"></script><script>gtag("config")</script></html>'
        mock_client.return_value.__enter__ = MagicMock(return_value=MagicMock(get=MagicMock(return_value=mock_resp)))
        mock_client.return_value.__exit__ = MagicMock(return_value=False)

        result = analyzer.detect_tech_stack(["example.com"])

    assert len(result) == 1
    tech_names = [t["name"] for t in result[0]["technologies"]]
    assert "nginx" in tech_names
    assert "Express" in tech_names
    assert "WordPress" in tech_names
    assert "Google Analytics" in tech_names
    assert "Cloudflare" in tech_names


def test_tech_stack_handles_failure(analyzer):
    with patch("httpx.Client", side_effect=Exception("Network error")):
        result = analyzer.detect_tech_stack(["broken.com"])
    assert len(result) == 1
    assert result[0]["technologies"] == []


# ---------------------------------------------------------------------------
# Tests — Strategy Report
# ---------------------------------------------------------------------------


def test_strategy_report_keyword_gaps(analyzer):
    keyword_overlap = {
        "summary": {"gapKeywords": 25, "clientKeywords": 10, "sharedKeywords": 5},
    }
    findings = analyzer.generate_strategy_report(
        "example.com", ["comp.com"], keyword_overlap=keyword_overlap
    )
    assert any(f["impact"] == "high" and "25 keywords" in f["finding"] for f in findings)


def test_strategy_report_serp_features(analyzer):
    serp_data = {
        "perDomain": [
            {"domain": "example.com", "featuredSnippets": 0, "totalFeatures": 0},
            {"domain": "competitor.com", "featuredSnippets": 5, "totalFeatures": 8},
        ],
    }
    findings = analyzer.generate_strategy_report(
        "example.com", ["competitor.com"], serp_features=serp_data
    )
    assert any("zero SERP features" in f["finding"] for f in findings)
    assert any("featured snippets" in f["finding"].lower() for f in findings)


def test_strategy_report_sorted_by_priority(analyzer):
    keyword_overlap = {"summary": {"gapKeywords": 50, "clientKeywords": 10, "sharedKeywords": 3}}
    serp_data = {
        "perDomain": [
            {"domain": "example.com", "featuredSnippets": 0, "totalFeatures": 0},
        ],
    }
    findings = analyzer.generate_strategy_report(
        "example.com", ["comp.com"], keyword_overlap=keyword_overlap, serp_features=serp_data
    )
    priorities = [f["priority"] for f in findings]
    assert priorities == sorted(priorities, reverse=True)


# ---------------------------------------------------------------------------
# Tests — Full Pipeline
# ---------------------------------------------------------------------------


def test_full_analyze_pipeline(analyzer):
    result = analyzer.analyze(
        "example.com",
        competitor_domains=["competitor1.com", "competitor2.com"],
        keywords=["homes for sale"],
    )

    assert "discoveredCompetitors" in result
    assert "keywordOverlap" in result
    assert "serpFeatures" in result
    assert "techStack" in result
    assert "strategy" in result


def test_full_analyze_auto_discovers(analyzer):
    result = analyzer.analyze("example.com")
    assert len(result["discoveredCompetitors"]) > 0


def test_full_analyze_no_competitors(analyzer, mock_connector):
    mock_connector.get_organic_competitors.return_value = []
    mock_connector.get_competitors.return_value = []
    result = analyzer.analyze("example.com")
    assert result["competitors"] == [] or result["keywordOverlap"] == {}


# ---------------------------------------------------------------------------
# Tests — Domain Normalization
# ---------------------------------------------------------------------------


def test_norm_domain_strips_www(analyzer):
    assert analyzer._norm_domain("www.example.com") == "example.com"


def test_norm_domain_handles_url(analyzer):
    assert analyzer._norm_domain("https://www.example.com/page") == "example.com"


def test_norm_domain_lowercase(analyzer):
    assert analyzer._norm_domain("EXAMPLE.COM") == "example.com"


def test_norm_domain_empty(analyzer):
    assert analyzer._norm_domain("") == ""
