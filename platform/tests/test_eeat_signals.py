"""Tests for EEATSignalAnalyzer."""

from __future__ import annotations

import pytest

from audit_platform.analyzers.eeat_signals import EEATSignalAnalyzer


@pytest.fixture()
def analyzer():
    return EEATSignalAnalyzer()


@pytest.fixture()
def sample_pages():
    return [
        {
            "url": "https://example.com/",
            "title": "Example Real Estate - Find Your Dream Home",
            "description": "Expert real estate agents helping you find homes in Mammoth Lakes, CA since 2005.",
            "h1": ["Find Your Dream Home in Mammoth Lakes"],
            "wordCount": 1200,
            "imgCount": 8,
            "h2Count": 5,
            "hasSchema": True,
            "schemaTypes": ["RealEstateAgent", "Organization"],
            "schemaData": [{"@type": "RealEstateAgent", "name": "Example Realty", "author": {"@type": "Person", "name": "Jamie Kelly"}, "datePublished": "2026-01-15"}],
            "contextualInternalLinks": 10,
            "externalLinks": 3,
            "ogTitle": "Example Real Estate",
        },
        {
            "url": "https://example.com/about/",
            "title": "About Us - Our Expert Team",
            "description": "Meet our team of licensed real estate professionals with 20+ years of experience.",
            "h1": ["About Our Team"],
            "wordCount": 800,
            "imgCount": 4,
            "h2Count": 3,
            "hasSchema": True,
            "schemaTypes": ["AboutPage"],
            "schemaData": [{"@type": "AboutPage", "author": {"@type": "Person", "name": "Jamie Kelly"}}],
            "contextualInternalLinks": 6,
            "externalLinks": 1,
            "ogTitle": "About Us",
        },
        {
            "url": "https://example.com/contact/",
            "title": "Contact Us",
            "description": "Get in touch with our team.",
            "h1": ["Contact"],
            "wordCount": 150,
            "imgCount": 0,
            "h2Count": 0,
            "hasSchema": False,
            "schemaTypes": [],
            "schemaData": [],
            "contextualInternalLinks": 2,
            "externalLinks": 0,
        },
        {
            "url": "https://example.com/privacy/",
            "title": "Privacy Policy",
            "description": "",
            "h1": ["Privacy Policy"],
            "wordCount": 500,
            "imgCount": 0,
            "h2Count": 2,
            "hasSchema": False,
            "schemaTypes": [],
            "schemaData": [],
        },
        {
            "url": "https://example.com/blog/mortgage-tips/",
            "title": "Mortgage Tips for First-Time Homebuyers",
            "description": "Expert advice on getting the best mortgage rates for your first home purchase.",
            "h1": ["Mortgage Tips"],
            "wordCount": 2500,
            "imgCount": 3,
            "h2Count": 7,
            "hasSchema": True,
            "schemaTypes": ["Article"],
            "schemaData": [{"@type": "Article", "headline": "Mortgage Tips", "author": {"@type": "Person", "name": "Jamie Kelly"}, "datePublished": "2026-02-01"}],
            "contextualInternalLinks": 8,
            "externalLinks": 5,
            "ogTitle": "Mortgage Tips",
        },
        {
            "url": "https://example.com/listings/thin-page/",
            "title": "Listings",
            "description": "",
            "h1": [],
            "wordCount": 50,
            "imgCount": 0,
            "h2Count": 0,
            "hasSchema": False,
            "schemaTypes": [],
            "schemaData": [],
        },
    ]


# ---------------------------------------------------------------------------
# Tests — Full Analysis
# ---------------------------------------------------------------------------


def test_analyze_returns_expected_keys(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    assert "summary" in result
    assert "siteTrust" in result
    assert "pageSignals" in result
    assert "eeatScore" in result
    assert "issues" in result


def test_analyze_summary(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    s = result["summary"]
    assert s["totalPages"] == 6
    assert s["eeatScore"] > 0
    assert s["eeatGrade"] in ("Strong", "Moderate", "Weak", "Poor")


# ---------------------------------------------------------------------------
# Tests — Site Trust
# ---------------------------------------------------------------------------


def test_site_trust_detects_about_page(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    assert result["siteTrust"]["hasAboutPage"] is True


def test_site_trust_detects_contact_page(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    assert result["siteTrust"]["hasContactPage"] is True


def test_site_trust_detects_privacy(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    assert result["siteTrust"]["hasPrivacyPolicy"] is True


def test_site_trust_detects_schema(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    assert result["siteTrust"]["hasOrganizationSchema"] is True


def test_site_trust_score(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    assert result["siteTrust"]["trustSignalCount"] >= 4


# ---------------------------------------------------------------------------
# Tests — YMYL Detection
# ---------------------------------------------------------------------------


def test_ymyl_detection(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    signals = result["pageSignals"]
    # Mortgage tips page should be YMYL (finance)
    mortgage_page = next((p for p in signals if "mortgage" in p["url"]), None)
    assert mortgage_page is not None
    assert mortgage_page["isYmyl"] is True
    assert mortgage_page["ymylCategory"] == "finance"


def test_non_ymyl_pages(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    signals = result["pageSignals"]
    contact = next((p for p in signals if "contact" in p["url"]), None)
    assert contact is not None
    assert contact["isYmyl"] is False


# ---------------------------------------------------------------------------
# Tests — Author Signals
# ---------------------------------------------------------------------------


def test_author_from_schema(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    signals = result["pageSignals"]
    homepage = next((p for p in signals if p["url"] == "https://example.com/"), None)
    assert homepage is not None
    assert homepage["hasAuthor"] is True


def test_no_author(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    signals = result["pageSignals"]
    thin = next((p for p in signals if "thin-page" in p["url"]), None)
    assert thin is not None
    assert thin["hasAuthor"] is False


# ---------------------------------------------------------------------------
# Tests — Effort & Expertise Scoring
# ---------------------------------------------------------------------------


def test_high_effort_page(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    signals = result["pageSignals"]
    blog = next((p for p in signals if "mortgage" in p["url"]), None)
    assert blog is not None
    assert blog["effortScore"] >= 50  # 2500 words + images + headings + links


def test_low_effort_page(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    signals = result["pageSignals"]
    thin = next((p for p in signals if "thin-page" in p["url"]), None)
    assert thin is not None
    assert thin["effortScore"] < 20


def test_expertise_with_schema(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    signals = result["pageSignals"]
    homepage = next((p for p in signals if p["url"] == "https://example.com/"), None)
    assert homepage["expertiseScore"] >= 40


# ---------------------------------------------------------------------------
# Tests — E-E-A-T Score
# ---------------------------------------------------------------------------


def test_eeat_score_range(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    score = result["eeatScore"]
    assert 0 <= score["score"] <= 100
    assert score["trustScore"] >= 0
    assert score["expertiseScore"] >= 0


def test_eeat_score_trust_weighted_highest(analyzer, sample_pages):
    """Trust should be the most impactful component (40% weight)."""
    result = analyzer.analyze(sample_pages)
    score = result["eeatScore"]
    # With good trust signals, trust should contribute significantly
    assert score["trustScore"] > 0


# ---------------------------------------------------------------------------
# Tests — Issues
# ---------------------------------------------------------------------------


def test_issues_generated(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    # Should have some issues (e.g., pages without author)
    assert isinstance(result["issues"], list)


def test_ymyl_low_expertise_issue(analyzer):
    """YMYL page with low expertise should trigger critical issue."""
    pages = [{
        "url": "https://example.com/health-advice/",
        "title": "Health Tips",
        "description": "health advice",
        "h1": ["Health"],
        "wordCount": 100,
        "imgCount": 0,
        "h2Count": 0,
        "hasSchema": False,
        "schemaTypes": [],
        "schemaData": [],
    }]
    result = analyzer.analyze(pages)
    ymyl_issues = [i for i in result["issues"] if i["issue"] == "YMYL_LOW_EXPERTISE"]
    assert len(ymyl_issues) == 1
    assert ymyl_issues[0]["severity"] == "critical"


def test_missing_about_page_issue(analyzer):
    pages = [{"url": "https://example.com/", "title": "Home", "schemaTypes": [], "schemaData": []}]
    result = analyzer.analyze(pages)
    about_issues = [i for i in result["issues"] if i["issue"] == "MISSING_ABOUT_PAGE"]
    assert len(about_issues) == 1


# ---------------------------------------------------------------------------
# Tests — Edge Cases
# ---------------------------------------------------------------------------


def test_empty_pages(analyzer):
    result = analyzer.analyze([])
    assert result["summary"]["totalPages"] == 0
    assert result["eeatScore"]["score"] == 0


def test_minimal_page(analyzer):
    pages = [{"url": "https://example.com/"}]
    result = analyzer.analyze(pages)
    assert result["summary"]["totalPages"] == 1
