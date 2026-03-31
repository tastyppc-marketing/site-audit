"""Tests for BacklinkAnalyzer."""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

from audit_platform.analyzers.backlinks import BacklinkAnalyzer
from audit_platform.models.seo import BacklinkRecord, DomainMetrics


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def mock_connector():
    """Return a mocked DataForSEOConnector."""
    connector = MagicMock()

    connector.get_backlinks_summary.return_value = DomainMetrics(
        domain="example.com",
        domain_rating=32.0,
        organic_traffic=665,
        organic_keywords=89,
        referring_domains=48,
        backlinks=156,
        traffic_value=1250.00,
        source="dataforseo",
    )

    connector.get_backlinks.return_value = [
        BacklinkRecord(
            source_url="https://partner.com/page",
            target_url="https://example.com/",
            anchor_text="Example Brand",
            domain_rating=72.0,
            is_dofollow=True,
            first_seen=datetime(2024, 6, 15, tzinfo=timezone.utc),
            source="dataforseo",
        ),
        BacklinkRecord(
            source_url="https://blog.com/article",
            target_url="https://example.com/about",
            anchor_text="click here",
            domain_rating=35.0,
            is_dofollow=True,
            first_seen=datetime(2025, 1, 10, tzinfo=timezone.utc),
            source="dataforseo",
        ),
        BacklinkRecord(
            source_url="https://directory.com/listing",
            target_url="https://example.com/",
            anchor_text="https://example.com",
            domain_rating=15.0,
            is_dofollow=False,
            first_seen=None,
            source="dataforseo",
        ),
        BacklinkRecord(
            source_url="https://news.com/mention",
            target_url="https://example.com/",
            anchor_text="",
            domain_rating=58.0,
            is_dofollow=True,
            first_seen=datetime(2025, 3, 1, tzinfo=timezone.utc),
            source="dataforseo",
        ),
    ]

    connector.get_referring_domains.return_value = [
        {
            "domain": "partner.com",
            "rank": 72,
            "backlinks": 3,
            "dofollow": 2,
            "first_seen": "2024-06-15",
            "broken_backlinks": 0,
        },
        {
            "domain": "blog.com",
            "rank": 35,
            "backlinks": 1,
            "dofollow": 1,
            "first_seen": "2025-01-10",
            "broken_backlinks": 0,
        },
    ]

    connector.get_backlink_intersection.return_value = [
        {"domain": "shared-linker.com", "target1": True, "target2": True},
    ]

    return connector


@pytest.fixture()
def analyzer(mock_connector):
    return BacklinkAnalyzer(mock_connector)


# ---------------------------------------------------------------------------
# Tests — analyze()
# ---------------------------------------------------------------------------


def test_analyze_returns_expected_keys(analyzer):
    result = analyzer.analyze("example.com")
    assert "backlinks" in result
    assert "domainMetrics" in result


def test_analyze_backlinks_section_structure(analyzer):
    result = analyzer.analyze("example.com")
    bl = result["backlinks"]

    assert "domainMetrics" in bl
    assert "topBacklinks" in bl
    assert "referringDomains" in bl
    assert "anchorDistribution" in bl
    assert "qualitySummary" in bl
    assert "competitorDomainMetrics" in bl


def test_analyze_client_domain_metrics(analyzer):
    result = analyzer.analyze("example.com")
    metrics = result["backlinks"]["domainMetrics"]

    assert metrics["domain"] == "example.com"
    assert metrics["domainRating"] == 32.0
    assert metrics["organicTraffic"] == 665
    assert metrics["referringDomains"] == 48
    assert metrics["totalBacklinks"] == 156
    assert metrics["source"] == "dataforseo"


def test_analyze_top_backlinks(analyzer):
    result = analyzer.analyze("example.com")
    backlinks = result["backlinks"]["topBacklinks"]

    assert len(backlinks) == 4
    assert backlinks[0]["sourceUrl"] == "https://partner.com/page"
    assert backlinks[0]["anchorText"] == "Example Brand"
    assert backlinks[0]["domainRating"] == 72.0
    assert backlinks[0]["isDofollow"] is True
    assert backlinks[0]["firstSeen"] is not None


def test_analyze_referring_domains(analyzer):
    result = analyzer.analyze("example.com")
    domains = result["backlinks"]["referringDomains"]

    assert len(domains) == 2
    assert domains[0]["domain"] == "partner.com"
    assert domains[0]["domainRating"] == 72
    assert domains[0]["backlinks"] == 3


def test_analyze_anchor_distribution(analyzer):
    result = analyzer.analyze("example.com")
    dist = result["backlinks"]["anchorDistribution"]

    categories = {d["category"]: d["count"] for d in dist}
    # "Example Brand" → branded (brand_name defaults to "example"),
    # "click here" → generic, "https://example.com" → url, "" → empty
    assert categories.get("generic", 0) == 1
    assert categories.get("url", 0) == 1
    assert categories.get("empty", 0) == 1
    assert categories.get("branded", 0) == 1  # "Example Brand" matches brand "example"


def test_analyze_quality_summary(analyzer):
    result = analyzer.analyze("example.com")
    qs = result["backlinks"]["qualitySummary"]

    assert qs["total"] == 4
    assert qs["dofollow"] == 3
    assert qs["nofollow"] == 1
    assert qs["highQuality"] == 2  # DR >= 50: 72 and 58
    assert qs["mediumQuality"] == 1  # 20 <= DR < 50: 35
    assert qs["lowQuality"] == 1  # DR < 20: 15
    assert qs["avgDomainRating"] == 45.0  # (72+35+15+58)/4


def test_analyze_with_competitors(analyzer, mock_connector):
    mock_connector.get_backlinks_summary.side_effect = [
        DomainMetrics(domain="example.com", domain_rating=32.0, source="dataforseo"),
        DomainMetrics(domain="competitor1.com", domain_rating=52.0, source="dataforseo"),
        DomainMetrics(domain="competitor2.com", domain_rating=45.0, source="dataforseo"),
    ]

    result = analyzer.analyze(
        "example.com",
        competitor_domains=["competitor1.com", "competitor2.com"],
    )

    comp_metrics = result["backlinks"]["competitorDomainMetrics"]
    assert len(comp_metrics) == 2
    assert comp_metrics[0]["domain"] == "competitor1.com"
    assert comp_metrics[1]["domain"] == "competitor2.com"

    dm = result["domainMetrics"]
    assert dm["client"]["domain"] == "example.com"
    assert len(dm["competitors"]) == 2


def test_analyze_domain_metrics_section(analyzer):
    result = analyzer.analyze("example.com")
    dm = result["domainMetrics"]

    assert "client" in dm
    assert "competitors" in dm
    assert dm["client"]["domain"] == "example.com"
    assert isinstance(dm["competitors"], list)


# ---------------------------------------------------------------------------
# Tests — analyze_intersection()
# ---------------------------------------------------------------------------


def test_analyze_intersection(analyzer, mock_connector):
    result = analyzer.analyze_intersection(
        "example.com", ["competitor1.com"]
    )
    assert len(result) == 1
    mock_connector.get_backlink_intersection.assert_called_once_with(
        ["example.com", "competitor1.com"]
    )


def test_analyze_intersection_empty_competitors(analyzer):
    result = analyzer.analyze_intersection("example.com", [])
    assert result == []


def test_analyze_intersection_handles_error(analyzer, mock_connector):
    mock_connector.get_backlink_intersection.side_effect = Exception("API error")
    result = analyzer.analyze_intersection("example.com", ["competitor.com"])
    assert result == []


# ---------------------------------------------------------------------------
# Tests — error handling
# ---------------------------------------------------------------------------


def test_analyze_handles_metrics_failure(analyzer, mock_connector):
    mock_connector.get_backlinks_summary.side_effect = Exception("API down")
    result = analyzer.analyze("example.com")

    # Should still return structure with None values
    assert result["backlinks"]["domainMetrics"]["domain"] == "example.com"
    assert result["backlinks"]["domainMetrics"]["domainRating"] is None


def test_analyze_handles_backlinks_failure(analyzer, mock_connector):
    mock_connector.get_backlinks.side_effect = Exception("Timeout")
    result = analyzer.analyze("example.com")

    assert result["backlinks"]["topBacklinks"] == []
    assert result["backlinks"]["qualitySummary"]["total"] == 0


def test_analyze_handles_referring_domains_failure(analyzer, mock_connector):
    mock_connector.get_referring_domains.side_effect = Exception("Error")
    result = analyzer.analyze("example.com")

    assert result["backlinks"]["referringDomains"] == []


# ---------------------------------------------------------------------------
# Tests — find_link_opportunities()
# ---------------------------------------------------------------------------


def test_find_opportunities_returns_structure(analyzer, mock_connector):
    # Mock: client has links from partner.com; competitor has links from news.com
    mock_connector.get_backlinks.side_effect = [
        # Client's existing backlinks (first call)
        [BacklinkRecord(source_url="https://partner.com/page", target_url="https://example.com/", anchor_text="test", domain_rating=50.0, is_dofollow=True, source="dataforseo")],
        # Competitor backlinks (second call)
        [
            BacklinkRecord(source_url="https://localnews.com/article", target_url="https://competitor.com/", anchor_text="Competitor Brand", domain_rating=65.0, is_dofollow=True, source="dataforseo"),
            BacklinkRecord(source_url="https://partner.com/links", target_url="https://competitor.com/", anchor_text="link", domain_rating=50.0, is_dofollow=True, source="dataforseo"),
            BacklinkRecord(source_url="https://spamsite.blogspot.com/x", target_url="https://competitor.com/", anchor_text="seo", domain_rating=5.0, is_dofollow=False, source="dataforseo"),
        ],
    ]

    result = analyzer.find_link_opportunities("example.com", ["competitor.com"])

    assert "opportunities" in result
    assert "summary" in result

    # Should find localnews.com but NOT partner.com (client already has it)
    # and NOT blogspot (spam filter) or low DR
    opps = result["opportunities"]
    domains = [o["sourceDomain"] for o in opps]
    assert "localnews.com" in domains
    assert "partner.com" not in domains  # Already linking to client
    assert "spamsite.blogspot.com" not in domains  # Spam filtered


def test_find_opportunities_filters_low_dr(analyzer, mock_connector):
    mock_connector.get_backlinks.side_effect = [
        [],  # Client has no backlinks
        [BacklinkRecord(source_url="https://lowquality.com/page", target_url="https://comp.com/", anchor_text="link", domain_rating=5.0, is_dofollow=True, source="dataforseo")],
    ]

    result = analyzer.find_link_opportunities("example.com", ["comp.com"], min_domain_rating=15.0)
    assert len(result["opportunities"]) == 0


def test_find_opportunities_categorizes_correctly(analyzer, mock_connector):
    mock_connector.get_backlinks.side_effect = [
        [],  # Client has no backlinks
        [
            BacklinkRecord(source_url="https://yelp.com/biz/test", target_url="https://comp.com/", anchor_text="listing", domain_rating=90.0, is_dofollow=True, source="dataforseo"),
            BacklinkRecord(source_url="https://mammoth-chamber.org/members", target_url="https://comp.com/", anchor_text="member", domain_rating=40.0, is_dofollow=True, source="dataforseo"),
            BacklinkRecord(source_url="https://localnews.com/real-estate", target_url="https://comp.com/", anchor_text="story", domain_rating=55.0, is_dofollow=True, source="dataforseo"),
        ],
    ]

    result = analyzer.find_link_opportunities("example.com", ["comp.com"])
    opps = result["opportunities"]
    cats = {o["sourceDomain"]: o["category"] for o in opps}

    assert cats["yelp.com"] == "directory"
    assert cats["mammoth-chamber.org"] == "local-organization"
    assert cats["localnews.com"] == "press-media"


def test_find_opportunities_priority_scoring(analyzer, mock_connector):
    mock_connector.get_backlinks.side_effect = [
        [],
        [
            BacklinkRecord(source_url="https://highdr.edu/resource", target_url="https://comp.com/", anchor_text="link", domain_rating=80.0, is_dofollow=True, source="dataforseo"),
            BacklinkRecord(source_url="https://lowdr.com/page", target_url="https://comp.com/", anchor_text="link", domain_rating=20.0, is_dofollow=False, source="dataforseo"),
        ],
    ]

    result = analyzer.find_link_opportunities("example.com", ["comp.com"])
    opps = result["opportunities"]

    # High DR + dofollow + .edu should score higher
    assert opps[0]["sourceDomain"] == "highdr.edu"
    assert opps[0]["priority"] > opps[1]["priority"]


def test_find_opportunities_empty_competitors(analyzer):
    result = analyzer.find_link_opportunities("example.com", [])
    assert result["opportunities"] == []
    assert result["summary"]["totalFound"] == 0


def test_find_opportunities_summary_stats(analyzer, mock_connector):
    mock_connector.get_backlinks.side_effect = [
        [],
        [
            BacklinkRecord(source_url="https://a.com/1", target_url="https://comp.com/", anchor_text="a", domain_rating=70.0, is_dofollow=True, source="dataforseo"),
            BacklinkRecord(source_url="https://b.com/2", target_url="https://comp.com/", anchor_text="b", domain_rating=40.0, is_dofollow=True, source="dataforseo"),
            BacklinkRecord(source_url="https://c.com/3", target_url="https://comp.com/", anchor_text="c", domain_rating=20.0, is_dofollow=False, source="dataforseo"),
        ],
    ]

    result = analyzer.find_link_opportunities("example.com", ["comp.com"])
    summary = result["summary"]

    assert summary["totalFound"] == 3
    assert summary["avgDomainRating"] > 0
    assert isinstance(summary["byCategory"], list)


# ---------------------------------------------------------------------------
# Tests — edge cases
# ---------------------------------------------------------------------------


def test_empty_backlinks_quality_summary(analyzer, mock_connector):
    mock_connector.get_backlinks.return_value = []
    result = analyzer.analyze("example.com")

    qs = result["backlinks"]["qualitySummary"]
    assert qs["total"] == 0
    assert qs["avgDomainRating"] == 0


def test_backlink_with_no_domain_rating(analyzer, mock_connector):
    mock_connector.get_backlinks.return_value = [
        BacklinkRecord(
            source_url="https://norank.com/page",
            target_url="https://example.com/",
            anchor_text="test",
            domain_rating=None,
            is_dofollow=True,
            source="dataforseo",
        ),
    ]
    result = analyzer.analyze("example.com")
    qs = result["backlinks"]["qualitySummary"]
    assert qs["total"] == 1
    assert qs["avgDomainRating"] == 0  # No valid ratings
