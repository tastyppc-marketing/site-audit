"""Tests for LocalSeoAnalyzer (P6)."""

from __future__ import annotations

import pytest

from audit_platform.analyzers.local_seo import LocalSeoAnalyzer


@pytest.fixture()
def analyzer():
    return LocalSeoAnalyzer()


@pytest.fixture()
def sample_reviews():
    return [
        {"comment": "Jamie was absolutely incredible to work with. She found us the perfect vacation home in Mammoth Lakes. Highly recommend!", "rating": 5, "createTime": "2026-01-15", "reply": {"comment": "Thank you!"}},
        {"comment": "Great experience buying our condo. Jamie knows the Mammoth Lakes market inside and out. Very professional.", "rating": 5, "createTime": "2026-02-01", "reply": None},
        {"comment": "Terrible communication. Took weeks to get responses. Would not recommend for anyone looking to buy.", "rating": 1, "createTime": "2025-12-10", "reply": {"comment": "We're sorry to hear that."}},
        {"comment": "Average service, nothing special. Got the job done.", "rating": 3, "createTime": "2025-11-05", "reply": None},
        {"comment": "", "rating": 5, "createTime": "2026-03-01", "reply": None},  # Empty review
        {"comment": "Good", "rating": 4, "createTime": "2026-03-10", "reply": None},  # Very short
    ]


@pytest.fixture()
def sample_profile():
    return {
        "title": "Mammoth Lakes Properties - Jamie Kelly",
        "address": "3325 Main Street, Suite 230, Mammoth Lakes, CA 93546",
        "phone": "(760) 914-0707",
        "website": "https://www.mammothlakesproperties.com",
        "primaryCategory": "Real estate agency",
        "additionalCategories": ["Real estate consultant"],
        "isVerified": True,
        "rating": 5.0,
        "reviewCount": 12,
        "latitude": 37.6485,
        "longitude": -118.9721,
    }


@pytest.fixture()
def sample_crawl_pages():
    return [
        {
            "url": "https://example.com/mammoth-lakes/",
            "title": "Mammoth Lakes Real Estate | Example Brand",
            "h1": ["Mammoth Lakes Homes for Sale"],
            "description": "Find homes for sale in Mammoth Lakes, CA. Browse listings and condos.",
            "wordCount": 1200,
            "schemaTypes": ["RealEstateAgent"],
            "contextualInternalLinks": 8,
            "totalInternalLinks": 15,
        },
        {
            "url": "https://example.com/about/",
            "title": "About Us",
            "h1": ["About Our Team"],
            "description": "Learn about our team.",
            "wordCount": 400,
            "schemaTypes": [],
            "contextualInternalLinks": 2,
        },
        {
            "url": "https://example.com/june-lake/",
            "title": "June Lake Real Estate",
            "h1": ["June Lake Homes"],
            "description": "Properties in June Lake area.",
            "wordCount": 150,
            "schemaTypes": [],
            "contextualInternalLinks": 1,
        },
    ]


# ---------------------------------------------------------------------------
# Tests — Competitor GBP Comparison
# ---------------------------------------------------------------------------


def test_gbp_comparison(analyzer, sample_profile):
    competitors = [
        {"title": "RE/MAX Mammoth", "rating": 4.5, "reviewCount": 85, "primaryCategory": "Real estate agency", "isVerified": True, "website": "https://remax-mammoth.com"},
        {"title": "Resort Realty", "rating": 4.8, "reviewCount": 45, "primaryCategory": "Real estate agency", "isVerified": True, "website": "https://resortrealty.com"},
    ]
    result = analyzer.compare_competitor_gbp(sample_profile, competitors)

    assert len(result) == 3  # client + 2 competitors
    assert result[0]["isClient"] is True
    assert result[0]["name"] == "Mammoth Lakes Properties - Jamie Kelly"
    assert result[1]["isClient"] is False


def test_gbp_comparison_empty(analyzer):
    result = analyzer.compare_competitor_gbp({}, [])
    assert result == []


# ---------------------------------------------------------------------------
# Tests — Local Landing Page Scoring
# ---------------------------------------------------------------------------


def test_landing_page_scoring(analyzer, sample_crawl_pages, sample_profile):
    result = analyzer.score_local_landing_pages(
        sample_crawl_pages, sample_profile, ["Mammoth Lakes", "June Lake"]
    )

    # /mammoth-lakes/ should score highest (has schema + location in title + h1 + desc)
    assert len(result) >= 1
    mammoth = next((p for p in result if "mammoth-lakes" in p["url"]), None)
    assert mammoth is not None
    assert mammoth["score"] >= 50


def test_landing_page_checks_count(analyzer, sample_crawl_pages, sample_profile):
    result = analyzer.score_local_landing_pages(
        sample_crawl_pages, sample_profile, ["Mammoth Lakes"]
    )
    if result:
        assert len(result[0]["checks"]) == 8


def test_landing_page_no_keywords(analyzer, sample_crawl_pages, sample_profile):
    result = analyzer.score_local_landing_pages(sample_crawl_pages, sample_profile, [])
    assert result == []


# ---------------------------------------------------------------------------
# Tests — Service Area GeoJSON
# ---------------------------------------------------------------------------


def test_service_area_geojson(analyzer, sample_profile):
    result = analyzer.generate_service_area_geojson(sample_profile)

    assert result["type"] == "FeatureCollection"
    assert len(result["features"]) == 2  # point + circle

    # Check business point
    biz = result["features"][0]
    assert biz["geometry"]["type"] == "Point"
    assert biz["properties"]["type"] == "client"

    # Check service area polygon
    area = result["features"][1]
    assert area["geometry"]["type"] == "Polygon"
    assert area["properties"]["radiusKm"] == 15.0


def test_service_area_with_competitors(analyzer, sample_profile):
    competitors = [
        {"title": "Competitor", "latitude": 37.65, "longitude": -118.97},
    ]
    result = analyzer.generate_service_area_geojson(sample_profile, competitor_locations=competitors)
    assert len(result["features"]) == 3  # client + area + competitor


def test_service_area_no_coordinates(analyzer):
    result = analyzer.generate_service_area_geojson({})
    assert result["features"] == []


# ---------------------------------------------------------------------------
# Tests — Grid Point Generation
# ---------------------------------------------------------------------------


def test_grid_points_count(analyzer):
    points = analyzer.generate_grid_points(37.6485, -118.9721, grid_size=5, spacing_km=1.0)
    assert len(points) == 25  # 5x5


def test_grid_points_3x3(analyzer):
    points = analyzer.generate_grid_points(37.6485, -118.9721, grid_size=3, spacing_km=1.0)
    assert len(points) == 9


def test_grid_points_center(analyzer):
    center_lat, center_lng = 37.6485, -118.9721
    points = analyzer.generate_grid_points(center_lat, center_lng, grid_size=3, spacing_km=1.0)
    # Center point should be at (or very near) the center coordinates
    center_point = points[4]  # Middle of 3x3
    assert abs(center_point[0] - center_lat) < 0.001
    assert abs(center_point[1] - center_lng) < 0.001


def test_grid_points_spacing(analyzer):
    points = analyzer.generate_grid_points(37.6485, -118.9721, grid_size=3, spacing_km=2.0)
    # Points should be spread wider with 2km spacing
    lats = [p[0] for p in points]
    assert max(lats) - min(lats) > 0.01  # Spread at least ~2km in lat


def test_grid_points_unique(analyzer):
    points = analyzer.generate_grid_points(37.6485, -118.9721, grid_size=5)
    assert len(set(points)) == 25  # All unique


# ---------------------------------------------------------------------------
# Tests — Full Pipeline
# ---------------------------------------------------------------------------


def test_full_analyze(analyzer, sample_reviews, sample_profile, sample_crawl_pages):
    result = analyzer.analyze(
        reviews=sample_reviews,
        business_profile=sample_profile,
        crawl_pages=sample_crawl_pages,
        location_keywords=["Mammoth Lakes", "June Lake"],
    )

    assert "competitorGbp" in result
    assert "landingPageScores" in result
    assert "serviceAreaMap" in result


def test_full_analyze_empty(analyzer):
    result = analyzer.analyze()
    assert result["competitorGbp"] == []
    assert result["landingPageScores"] == []
