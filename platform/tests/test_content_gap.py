"""Tests for ContentGapAnalyzer."""

from __future__ import annotations

import pytest

from audit_platform.analyzers.content_gap import ContentGapAnalyzer


@pytest.fixture()
def analyzer():
    return ContentGapAnalyzer()


@pytest.fixture()
def client_keywords():
    return [
        {"keyword": "mammoth lakes homes for sale", "position": 11, "volume": 1600},
        {"keyword": "mammoth lakes real estate", "position": 16, "volume": 720},
        {"keyword": "mammoth lakes properties", "position": 1, "volume": 720},
    ]


@pytest.fixture()
def competitor_keywords():
    return {
        "remax-mammoth.com": [
            {"keyword": "mammoth lakes homes for sale", "position": 9, "volume": 1600},
            {"keyword": "mammoth lakes condos for sale", "position": 7, "volume": 590},
            {"keyword": "june lake homes for sale", "position": 9, "volume": 590},
            {"keyword": "mammoth mountain real estate", "position": 7, "volume": 590},
        ],
        "resortrealty.com": [
            {"keyword": "mammoth lakes homes for sale", "position": 11, "volume": 1600},
            {"keyword": "mammoth lakes market report", "position": 11, "volume": 110},
            {"keyword": "ski in ski out mammoth", "position": 5, "volume": 320},
        ],
    }


# --- Content Gap Tests ---

def test_content_gaps_found(analyzer, client_keywords, competitor_keywords):
    result = analyzer.analyze_content_gaps(client_keywords, competitor_keywords)
    assert result["summary"]["totalGaps"] >= 3  # condos, june lake, mountain, market report, ski


def test_content_gaps_excludes_client_keywords(analyzer, client_keywords, competitor_keywords):
    result = analyzer.analyze_content_gaps(client_keywords, competitor_keywords)
    gap_keywords = [g["keyword"] for g in result["gaps"]]
    assert "mammoth lakes homes for sale" not in gap_keywords  # Client already ranks


def test_content_gaps_priority_scoring(analyzer, client_keywords, competitor_keywords):
    result = analyzer.analyze_content_gaps(client_keywords, competitor_keywords)
    priorities = [g["priority"] for g in result["gaps"]]
    assert priorities == sorted(priorities, reverse=True)


def test_content_gaps_min_volume_filter(analyzer, client_keywords, competitor_keywords):
    result = analyzer.analyze_content_gaps(client_keywords, competitor_keywords, min_volume=500)
    for gap in result["gaps"]:
        assert gap["volume"] >= 500


def test_content_gaps_intent_classification(analyzer, client_keywords, competitor_keywords):
    result = analyzer.analyze_content_gaps(client_keywords, competitor_keywords)
    assert "topInformational" in result
    assert "topCommercial" in result
    assert "topTransactional" in result


def test_content_gaps_empty_competitors(analyzer, client_keywords):
    result = analyzer.analyze_content_gaps(client_keywords, {})
    assert result["summary"]["totalGaps"] == 0


# --- Topical Authority Tests ---

def test_topical_authority_clusters(analyzer, client_keywords):
    all_kws = client_keywords + [
        {"keyword": "mammoth lakes vacation homes", "position": None, "volume": 1300},
        {"keyword": "mammoth lakes cabin for sale", "position": None, "volume": 140},
        {"keyword": "mammoth lakes land for sale", "position": None, "volume": 90},
    ]
    result = analyzer.analyze_topical_authority(all_kws)
    assert result["summary"]["totalTopics"] >= 1
    # "mammoth" or "lakes" should be a strong topic
    topic_names = [c["topic"] for c in result["clusters"]]
    assert any("mammoth" in t or "lakes" in t for t in topic_names)


def test_topical_authority_depth_scoring(analyzer):
    kws = [
        {"keyword": "real estate agent", "position": 5, "volume": 2000},
        {"keyword": "real estate market", "position": 8, "volume": 1500},
        {"keyword": "real estate investment", "position": 12, "volume": 800},
        {"keyword": "real estate tips", "position": 15, "volume": 500},
    ]
    result = analyzer.analyze_topical_authority(kws)
    clusters = result["clusters"]
    # "real" and "estate" should cluster together
    assert len(clusters) >= 1
    top = clusters[0]
    assert top["depthScore"] > 0
    assert top["keywordCount"] >= 2


def test_topical_authority_empty(analyzer):
    result = analyzer.analyze_topical_authority([])
    assert result["summary"]["totalTopics"] == 0


# --- Unlinked Mentions Tests ---

def test_unlinked_mentions(analyzer):
    mentions = [
        {"url": "https://localnews.com/article-about-us", "domain": "localnews.com", "title": "Great agent"},
        {"url": "https://partner.com/referral", "domain": "partner.com", "title": "Partner link"},
        {"url": "https://already-linking.com/page", "domain": "already-linking.com", "title": "Existing"},
    ]
    existing = {"already-linking.com", "zillow.com"}
    result = analyzer.find_unlinked_mentions(mentions, existing)

    domains = [o["domain"] for o in result]
    assert "localnews.com" in domains
    assert "partner.com" in domains
    assert "already-linking.com" not in domains


def test_unlinked_mentions_deduplication(analyzer):
    mentions = [
        {"url": "https://news.com/page1", "domain": "news.com"},
        {"url": "https://news.com/page2", "domain": "news.com"},
    ]
    result = analyzer.find_unlinked_mentions(mentions, set())
    assert len(result) == 1


def test_unlinked_mentions_empty(analyzer):
    result = analyzer.find_unlinked_mentions([], {"example.com"})
    assert result == []


# --- Intent Classification ---

def test_intent_transactional(analyzer):
    assert analyzer._classify_intent("buy mammoth lakes condo") == "transactional"
    assert analyzer._classify_intent("homes for sale near me") == "transactional"


def test_intent_commercial(analyzer):
    assert analyzer._classify_intent("best real estate agent mammoth") == "commercial"
    assert analyzer._classify_intent("mammoth vs big bear comparison") == "commercial"


def test_intent_informational(analyzer):
    assert analyzer._classify_intent("how to buy a vacation home") == "informational"
    assert analyzer._classify_intent("what is a condo association") == "informational"
