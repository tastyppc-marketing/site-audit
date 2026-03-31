"""Tests for IndexCrawlabilityAnalyzer (P8)."""

from __future__ import annotations

import pytest

from audit_platform.analyzers.indexation_crawlability import IndexCrawlabilityAnalyzer


@pytest.fixture()
def analyzer():
    return IndexCrawlabilityAnalyzer()


@pytest.fixture()
def sample_pages():
    return [
        {"url": "https://example.com/", "statusCode": 200, "title": "Example Homepage", "h1": ["Welcome"], "wordCount": 500, "robotsMeta": None, "canonical": "https://example.com/", "canonicalResolved": "https://example.com/", "redirectChainLength": 0, "contextualLinkTargets": ["https://example.com/about/", "https://example.com/homes/"]},
        {"url": "https://example.com/about/", "statusCode": 200, "title": "About Us", "h1": ["About Us"], "wordCount": 300, "robotsMeta": None, "redirectChainLength": 0, "contextualLinkTargets": ["https://example.com/"]},
        {"url": "https://example.com/homes/", "statusCode": 200, "title": "Homes for Sale", "h1": ["Homes for Sale"], "wordCount": 800, "robotsMeta": None, "redirectChainLength": 0, "contextualLinkTargets": ["https://example.com/"]},
        {"url": "https://example.com/homes/?color=red&size=large", "statusCode": 200, "title": "Filtered Homes", "h1": ["Homes"], "wordCount": 200, "robotsMeta": None, "canonical": "", "redirectChainLength": 0},
        {"url": "https://example.com/homes/?sort=price&page=2", "statusCode": 200, "title": "Homes Page 2", "h1": ["Homes"], "wordCount": 300, "robotsMeta": None, "paginationNext": "https://example.com/homes/?page=3", "paginationPrev": "https://example.com/homes/?page=1", "canonicalResolved": "https://example.com/homes/?sort=price&page=2", "redirectChainLength": 0},
        {"url": "https://example.com/homes/?sid=abc123", "statusCode": 200, "title": "Homes", "h1": ["Homes"], "wordCount": 400, "robotsMeta": None, "redirectChainLength": 0},
        {"url": "https://example.com/homes/?utm_source=email&utm_medium=newsletter", "statusCode": 200, "title": "Homes", "h1": ["Homes"], "wordCount": 400, "robotsMeta": None, "canonical": "", "redirectChainLength": 0},
        {"url": "https://example.com/old-page/", "statusCode": 200, "title": "Page Not Found", "h1": ["Oops! Page not found"], "wordCount": 30, "robotsMeta": None, "redirectChainLength": 0},
        {"url": "https://example.com/empty/", "statusCode": 200, "title": "Something", "h1": [""], "wordCount": 15, "robotsMeta": None, "redirectChainLength": 0},
        {"url": "https://example.com/deep/nested/path/page/extra/", "statusCode": 200, "title": "Deep Page", "h1": ["Deep"], "wordCount": 100, "robotsMeta": None, "redirectChainLength": 2},
        {"url": "https://example.com/noindex/", "statusCode": 200, "title": "Hidden", "h1": ["Hidden"], "wordCount": 200, "robotsMeta": "noindex", "paginationNext": "https://example.com/noindex/?page=2", "redirectChainLength": 0},
    ]


# ---------------------------------------------------------------------------
# Tests — URL Parameter Audit
# ---------------------------------------------------------------------------


def test_parameter_classification(analyzer):
    assert analyzer._classify_parameter("utm_source") == "tracking"
    assert analyzer._classify_parameter("color") == "filter"
    assert analyzer._classify_parameter("sort") == "sort"
    assert analyzer._classify_parameter("page") == "pagination"
    assert analyzer._classify_parameter("sid") == "session"
    assert analyzer._classify_parameter("q") == "search"
    assert analyzer._classify_parameter("randomthing") == "unknown"


def test_parameter_audit_finds_parameterized(analyzer, sample_pages):
    result = analyzer.audit_url_parameters(sample_pages)
    assert result["summary"]["totalParameterizedUrls"] >= 4


def test_parameter_audit_faceted_detection(analyzer, sample_pages):
    result = analyzer.audit_url_parameters(sample_pages)
    faceted = [i for i in result["issues"] if i["issue"] == "FACETED_NAVIGATION"]
    assert len(faceted) == 1  # color + size on same URL


def test_parameter_audit_session_id(analyzer, sample_pages):
    result = analyzer.audit_url_parameters(sample_pages)
    session = [i for i in result["issues"] if i["issue"] == "SESSION_ID_IN_URL"]
    assert len(session) == 1


def test_parameter_audit_tracking_no_canonical(analyzer, sample_pages):
    result = analyzer.audit_url_parameters(sample_pages)
    tracking = [i for i in result["issues"] if i["issue"] == "TRACKING_PARAMS_NO_CANONICAL"]
    assert len(tracking) >= 1


def test_parameter_explosion(analyzer):
    pages = [
        {"url": f"https://example.com/shop/?variant={i}", "statusCode": 200}
        for i in range(10)
    ]
    result = analyzer.audit_url_parameters(pages)
    explosion = [i for i in result["issues"] if i["issue"] == "PARAMETER_EXPLOSION"]
    assert len(explosion) == 1


# ---------------------------------------------------------------------------
# Tests — Pagination Audit
# ---------------------------------------------------------------------------


def test_pagination_detects_paginated_pages(analyzer, sample_pages):
    result = analyzer.audit_pagination(sample_pages)
    assert result["summary"]["totalPaginatedPages"] >= 1


def test_pagination_noindex(analyzer, sample_pages):
    result = analyzer.audit_pagination(sample_pages)
    noindex = [i for i in result["issues"] if i["issue"] == "PAGINATION_NOINDEX"]
    assert len(noindex) == 1  # /noindex/ page has noindex + pagination


def test_pagination_broken_next(analyzer):
    pages = [
        {"url": "https://example.com/list/", "paginationNext": "https://example.com/list/?page=2", "statusCode": 200, "robotsMeta": None},
        {"url": "https://example.com/list/?page=2", "statusCode": 404, "robotsMeta": None},
    ]
    result = analyzer.audit_pagination(pages)
    broken = [i for i in result["issues"] if i["issue"] == "PAGINATION_BROKEN_NEXT"]
    assert len(broken) == 1


# ---------------------------------------------------------------------------
# Tests — Soft 404 Detection
# ---------------------------------------------------------------------------


def test_soft_404_title_pattern(analyzer, sample_pages):
    result = analyzer.detect_soft_404s(sample_pages)
    soft = result["pages"]
    urls = [s["url"] for s in soft]
    assert "https://example.com/old-page/" in urls


def test_soft_404_near_empty(analyzer, sample_pages):
    result = analyzer.detect_soft_404s(sample_pages)
    soft = result["pages"]
    urls = [s["url"] for s in soft]
    assert "https://example.com/empty/" in urls


def test_soft_404_ignores_real_404s(analyzer):
    pages = [{"url": "https://example.com/gone/", "statusCode": 404, "title": "Not Found", "h1": [], "wordCount": 0}]
    result = analyzer.detect_soft_404s(pages)
    assert result["summary"]["totalSoft404s"] == 0  # Real 404 not flagged


def test_soft_404_h1_pattern(analyzer):
    pages = [{"url": "https://example.com/error/", "statusCode": 200, "title": "Example", "h1": ["Sorry, page does not exist"], "wordCount": 300}]
    result = analyzer.detect_soft_404s(pages)
    assert result["summary"]["totalSoft404s"] == 1


def test_soft_404_summary_reasons(analyzer, sample_pages):
    result = analyzer.detect_soft_404s(sample_pages)
    s = result["summary"]
    assert s["byReason"]["titlePattern"] >= 1
    assert s["byReason"]["nearEmpty"] >= 1


# ---------------------------------------------------------------------------
# Tests — Index Orphan Detection
# ---------------------------------------------------------------------------


def test_index_orphans_found(analyzer, sample_pages):
    sc_pages = [
        {"page": "https://example.com/", "clicks": 50, "impressions": 500},
        {"page": "https://example.com/orphan-page/", "clicks": 2, "impressions": 150},
    ]
    # Homepage has inbound links, orphan-page does not
    inbound = {"https://example.com/": {"https://example.com/about/"}}
    result = analyzer.detect_index_orphans(sample_pages, sc_pages, inbound)
    assert result["summary"]["totalOrphans"] == 1
    assert result["orphans"][0]["url"] == "https://example.com/orphan-page/"
    assert result["orphans"][0]["priority"] == "high"  # 150 impressions


def test_index_orphans_empty_sc(analyzer, sample_pages):
    result = analyzer.detect_index_orphans(sample_pages, [], {})
    assert result["summary"]["totalOrphans"] == 0


def test_index_orphans_excludes_404(analyzer):
    pages = [{"url": "https://example.com/gone/", "statusCode": 404}]
    sc_pages = [{"page": "https://example.com/gone/", "clicks": 0, "impressions": 10}]
    result = analyzer.detect_index_orphans(pages, sc_pages, {})
    assert result["summary"]["totalOrphans"] == 0


def test_index_orphans_url_normalization(analyzer, sample_pages):
    sc_pages = [
        {"page": "https://example.com/about/?utm_source=email", "clicks": 5, "impressions": 50},
    ]
    # /about/ has contextual inbound links from sample_pages[0]
    result = analyzer.detect_index_orphans(sample_pages, sc_pages, {})
    # Should NOT be orphan because /about/ has links (UTM stripped in normalization)
    assert result["summary"]["totalOrphans"] == 0


def test_index_orphans_priority_sorting(analyzer):
    pages = [{"url": "https://example.com/", "statusCode": 200, "contextualLinkTargets": []}]
    sc_pages = [
        {"page": "https://example.com/low/", "clicks": 0, "impressions": 5},
        {"page": "https://example.com/high/", "clicks": 10, "impressions": 500},
        {"page": "https://example.com/med/", "clicks": 1, "impressions": 50},
    ]
    result = analyzer.detect_index_orphans(pages, sc_pages, {})
    # Should be sorted by impressions desc
    urls = [o["url"] for o in result["orphans"]]
    assert urls[0] == "https://example.com/high/"


# ---------------------------------------------------------------------------
# Tests — Crawl Budget Health Score
# ---------------------------------------------------------------------------


def test_crawl_budget_score(analyzer, sample_pages):
    param_audit = {"summary": {"totalParameterizedUrls": 4}}
    soft_404s = {"summary": {"totalSoft404s": 2}}
    index_orphans = {"summary": {"totalOrphans": 1}}
    result = analyzer.compute_crawl_budget_health(sample_pages, param_audit, soft_404s, index_orphans)

    assert 0 <= result["score"] <= 100
    assert result["grade"] in ("good", "needs-improvement", "poor")
    assert "factors" in result


def test_crawl_budget_perfect_score(analyzer):
    pages = [{"url": "https://example.com/", "redirectChainLength": 0}]
    result = analyzer.compute_crawl_budget_health(
        pages,
        {"summary": {"totalParameterizedUrls": 0}},
        {"summary": {"totalSoft404s": 0}},
        {"summary": {"totalOrphans": 0}},
    )
    assert result["score"] == 100
    assert result["grade"] == "good"


def test_crawl_budget_terrible_score(analyzer):
    # All pages are parameterized, soft 404, deep, with redirects
    pages = [
        {"url": f"https://example.com/deep/nested/path/extra/?p={i}", "redirectChainLength": 3, "statusCode": 200}
        for i in range(10)
    ]
    result = analyzer.compute_crawl_budget_health(
        pages,
        {"summary": {"totalParameterizedUrls": 10}},
        {"summary": {"totalSoft404s": 10}},
        {"summary": {"totalOrphans": 10}},
    )
    assert result["score"] == 0
    assert result["grade"] == "poor"


# ---------------------------------------------------------------------------
# Tests — Full Pipeline
# ---------------------------------------------------------------------------


def test_full_analyze(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    assert "parameterAudit" in result
    assert "paginationAudit" in result
    assert "soft404s" in result
    assert "indexOrphans" in result
    assert "crawlBudgetHealth" in result


def test_full_analyze_empty_pages(analyzer):
    result = analyzer.analyze([])
    assert result["crawlBudgetHealth"]["score"] == 100


# ---------------------------------------------------------------------------
# Tests — URL Normalization
# ---------------------------------------------------------------------------


def test_sc_normalization_strips_tracking(analyzer):
    url = "https://example.com/page/?utm_source=email&utm_medium=newsletter&real_param=value"
    normalized = analyzer._norm_url_for_sc(url)
    assert "utm_source" not in normalized
    assert "real_param=value" in normalized


def test_sc_normalization_strips_trailing_slash(analyzer):
    assert analyzer._norm_url_for_sc("https://example.com/page/") == analyzer._norm_url_for_sc("https://example.com/page")


def test_sc_normalization_lowercase(analyzer):
    assert analyzer._norm_url_for_sc("HTTPS://EXAMPLE.COM/Page") == analyzer._norm_url_for_sc("https://example.com/Page")
