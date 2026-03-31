"""Tests for TechnicalSeoAnalyzer."""

from __future__ import annotations

import pytest

from audit_platform.analyzers.technical_seo import TechnicalSeoAnalyzer


@pytest.fixture()
def analyzer():
    return TechnicalSeoAnalyzer()


@pytest.fixture()
def sample_pages():
    return [
        {
            "url": "https://example.com/",
            "title": "Example Real Estate | Example Brand",
            "titleLength": 35,
            "description": "Find homes for sale in Example City. Browse listings, condos, and investment properties.",
            "descriptionLength": 87,
            "canonical": "https://example.com/",
            "hasSchema": True,
            "schemaTypes": ["Organization"],
            "imgCount": 12,
            "imgWithoutAlt": 3,
        },
        {
            "url": "https://example.com/homes-for-sale/",
            "title": "Homes for Sale | Example Brand",
            "titleLength": 30,
            "description": "Find homes for sale in Example City. Browse listings, condos, and investment properties.",
            "descriptionLength": 87,
            "canonical": "https://example.com/homes-for-sale/",
            "hasSchema": False,
            "schemaTypes": [],
            "imgCount": 20,
            "imgWithoutAlt": 18,
        },
        {
            "url": "https://example.com/homes-for-sale/2-bedroom/",
            "title": "2 Bedroom Homes for Sale | Example Brand",
            "titleLength": 41,
            "description": "",
            "descriptionLength": 0,
            "canonical": "",
            "hasSchema": False,
            "schemaTypes": [],
            "imgCount": 5,
            "imgWithoutAlt": 5,
        },
        {
            "url": "https://example.com/homes-for-sale/3-bedroom/",
            "title": "3 Bedroom Homes for Sale | Example Brand",
            "titleLength": 41,
            "description": "",
            "descriptionLength": 0,
            "canonical": "",
            "hasSchema": False,
            "schemaTypes": [],
            "imgCount": 8,
            "imgWithoutAlt": 8,
        },
        {
            "url": "https://example.com/homes-for-sale/4-bedroom/",
            "title": "4 Bedroom Homes for Sale | Example Brand",
            "titleLength": 41,
            "description": "",
            "descriptionLength": 0,
            "canonical": "",
            "hasSchema": False,
            "schemaTypes": [],
            "imgCount": 6,
            "imgWithoutAlt": 6,
        },
        {
            "url": "https://example.com/about/",
            "title": "",
            "titleLength": 0,
            "description": "Learn about our team of experienced real estate professionals.",
            "descriptionLength": 62,
            "canonical": "https://example.com/about/",
            "hasSchema": False,
            "schemaTypes": [],
            "imgCount": 1,
            "imgWithoutAlt": 0,
        },
        {
            "url": "https://EXAMPLE.com/Blog/My_Post/?ref=123",
            "title": "A Really Really Really Long Title That Goes Way Beyond Sixty Characters and Should Be Flagged",
            "titleLength": 93,
            "description": "Short.",
            "descriptionLength": 6,
            "canonical": "",
            "hasSchema": False,
            "schemaTypes": [],
            "imgCount": 0,
            "imgWithoutAlt": 0,
        },
    ]


# ---------------------------------------------------------------------------
# Tests — analyze()
# ---------------------------------------------------------------------------


def test_analyze_returns_expected_keys(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    assert "metaTagSummary" in result
    assert "metaTagIssues" in result
    assert "templateDetection" in result
    assert "imageAudit" in result
    assert "urlStructure" in result
    assert "crawlIssues" in result
    assert "schemaSummary" in result


# ---------------------------------------------------------------------------
# Tests — Meta Tag Audit
# ---------------------------------------------------------------------------


def test_meta_tag_summary_counts(analyzer, sample_pages):
    result = analyzer.audit_meta_tags(sample_pages)
    s = result["summary"]

    assert s["pagesWithTitle"] == 6  # All except about page
    assert s["pagesWithoutTitle"] == 1  # about page
    assert s["pagesWithDescription"] == 4
    assert s["pagesWithoutDescription"] == 3  # 2-bed, 3-bed, 4-bed


def test_meta_tag_title_too_long(analyzer, sample_pages):
    result = analyzer.audit_meta_tags(sample_pages)
    long_title_issues = [i for i in result["issues"] if i["issue"] == "TITLE_TOO_LONG"]
    assert len(long_title_issues) == 1
    assert "Blog" in long_title_issues[0]["url"]


def test_meta_tag_missing_title(analyzer, sample_pages):
    result = analyzer.audit_meta_tags(sample_pages)
    missing = [i for i in result["issues"] if i["issue"] == "MISSING_TITLE"]
    assert len(missing) == 1
    assert "about" in missing[0]["url"]


def test_meta_tag_duplicate_description(analyzer, sample_pages):
    result = analyzer.audit_meta_tags(sample_pages)
    dupes = [i for i in result["issues"] if i["issue"] == "DUPLICATE_DESCRIPTION"]
    # Homepage and homes-for-sale share the same description
    assert len(dupes) >= 1


def test_meta_tag_canonical_counts(analyzer, sample_pages):
    result = analyzer.audit_meta_tags(sample_pages)
    s = result["summary"]
    assert s["pagesWithCanonical"] == 3
    assert s["pagesWithoutCanonical"] == 4


# ---------------------------------------------------------------------------
# Tests — Template Detection
# ---------------------------------------------------------------------------


def test_template_detection_finds_patterns(analyzer, sample_pages):
    result = analyzer.detect_templates(sample_pages)
    assert len(result["templates"]) >= 1
    # "{N} Bedroom Homes for Sale | Example Brand" should be detected
    patterns = [t["pattern"] for t in result["templates"]]
    assert any("Bedroom" in p or "bedroom" in p.lower() for p in patterns)


def test_template_detection_counts(analyzer, sample_pages):
    result = analyzer.detect_templates(sample_pages)
    assert result["totalTemplatedTitles"] >= 2  # At least the bedroom pattern


# ---------------------------------------------------------------------------
# Tests — Image Audit
# ---------------------------------------------------------------------------


def test_image_audit_summary(analyzer, sample_pages):
    result = analyzer.audit_images(sample_pages)
    s = result["summary"]

    assert s["totalImages"] == 52  # 12+20+5+8+6+1
    assert s["totalMissingAlt"] == 40  # 3+18+5+8+6
    assert s["pagesWithImages"] == 6
    assert s["pagesMissingAlt"] == 5


def test_image_audit_worst_pages_sorted(analyzer, sample_pages):
    result = analyzer.audit_images(sample_pages)
    worst = result["worstPages"]

    # homes-for-sale has 18 missing — should be first
    assert worst[0]["url"] == "https://example.com/homes-for-sale/"
    assert worst[0]["missingAlt"] == 18


def test_image_audit_coverage_calculation(analyzer, sample_pages):
    result = analyzer.audit_images(sample_pages)
    worst = result["worstPages"]

    # Homepage: 12 images, 3 missing = 75% coverage
    homepage = next(p for p in worst if p["url"] == "https://example.com/")
    assert homepage["altCoverage"] == 75.0

    # 3-bedroom: 8 images, 8 missing = 0% coverage
    bedroom = next(p for p in worst if "3-bedroom" in p["url"])
    assert bedroom["altCoverage"] == 0.0


# ---------------------------------------------------------------------------
# Tests — URL Structure
# ---------------------------------------------------------------------------


def test_url_structure_detects_parameters(analyzer, sample_pages):
    result = analyzer.audit_url_structure(sample_pages)
    param_issues = [i for i in result["issues"] if i["issue"] == "HAS_PARAMETERS"]
    assert len(param_issues) == 1
    assert "ref=123" in param_issues[0]["detail"]


def test_url_structure_detects_uppercase(analyzer, sample_pages):
    result = analyzer.audit_url_structure(sample_pages)
    upper_issues = [i for i in result["issues"] if i["issue"] == "UPPERCASE_URL"]
    assert len(upper_issues) >= 1


def test_url_structure_detects_underscores(analyzer, sample_pages):
    result = analyzer.audit_url_structure(sample_pages)
    under_issues = [i for i in result["issues"] if i["issue"] == "UNDERSCORES_IN_URL"]
    assert len(under_issues) >= 1


def test_url_structure_depth_distribution(analyzer, sample_pages):
    result = analyzer.audit_url_structure(sample_pages)
    depths = result["depthDistribution"]

    assert 0 in depths  # homepage
    assert 1 in depths  # /homes-for-sale/, /about/
    assert 2 in depths  # /homes-for-sale/2-bedroom/


def test_url_structure_summary(analyzer, sample_pages):
    result = analyzer.audit_url_structure(sample_pages)
    s = result["summary"]

    assert s["totalPages"] == 7
    assert s["totalIssues"] > 0
    assert s["avgDepth"] > 0


# ---------------------------------------------------------------------------
# Tests — Schema Summary
# ---------------------------------------------------------------------------


def test_schema_summary(analyzer, sample_pages):
    result = analyzer.analyze(sample_pages)
    schema = result["schemaSummary"]

    assert schema["pagesWithSchema"] == 1  # Only homepage
    assert schema["pagesWithoutSchema"] == 6
    assert any(t["type"] == "Organization" for t in schema["schemaTypesFound"])
    assert "RealEstateAgent" in schema["recommendedSchemas"]


# ---------------------------------------------------------------------------
# Tests — Edge Cases
# ---------------------------------------------------------------------------


def test_empty_pages(analyzer):
    result = analyzer.analyze([])
    assert result["metaTagSummary"]["pagesWithTitle"] == 0
    assert result["imageAudit"]["summary"]["totalImages"] == 0
    assert result["urlStructure"]["summary"]["totalPages"] == 0


def test_pages_with_minimal_data(analyzer):
    pages = [{"url": "https://example.com/"}]
    result = analyzer.analyze(pages)
    assert result["metaTagSummary"]["pagesWithoutTitle"] == 1
    assert result["imageAudit"]["summary"]["totalImages"] == 0


# ---------------------------------------------------------------------------
# P7 Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def p7_pages():
    """Pages with P7 data fields (response headers, redirects, etc.)."""
    return [
        {
            "url": "https://example.com/",
            "title": "Example Homepage",
            "canonical": "https://example.com/",
            "canonicalResolved": "https://example.com/",
            "canonicalCount": 1,
            "httpCanonical": None,
            "robotsMeta": None,
            "googlebotMeta": None,
            "viewportMeta": "width=device-width, initial-scale=1",
            "statusCode": 200,
            "redirectChain": [],
            "redirectChainLength": 0,
            "hasSchema": True,
            "schemaTypes": ["Organization"],
            "schemaData": [{"@context": "https://schema.org", "@type": "Organization", "name": "Example Corp", "url": "https://example.com"}],
            "responseHeaders": {
                "strictTransportSecurity": "max-age=31536000; includeSubDomains",
                "contentSecurityPolicy": "default-src 'self'",
                "xContentTypeOptions": "nosniff",
                "xFrameOptions": "SAMEORIGIN",
                "referrerPolicy": "strict-origin",
                "permissionsPolicy": "camera=()",
                "server": "nginx",
                "statusCode": 200,
            },
        },
        {
            "url": "https://example.com/old-page/",
            "title": "Old Page",
            "canonical": "/new-page/",
            "canonicalResolved": "https://example.com/new-page/",
            "canonicalCount": 1,
            "httpCanonical": "https://example.com/different-page/",
            "robotsMeta": None,
            "viewportMeta": "width=device-width, initial-scale=1",
            "statusCode": 200,
            "redirectChain": [
                {"url": "http://example.com/old-page/", "status": 301, "location": "https://example.com/old-page/"},
            ],
            "redirectChainLength": 1,
            "hasSchema": False,
            "schemaData": [],
            "responseHeaders": {
                "strictTransportSecurity": None,
                "xContentTypeOptions": None,
                "server": "Apache/2.4.52",
                "statusCode": 200,
            },
        },
        {
            "url": "https://example.com/noindex-page/",
            "title": "Hidden Page",
            "canonical": "https://example.com/noindex-page/",
            "canonicalResolved": "https://example.com/noindex-page/",
            "canonicalCount": 1,
            "robotsMeta": "noindex, nofollow",
            "viewportMeta": "width=device-width, user-scalable=no",
            "statusCode": 200,
            "redirectChain": [],
            "hasSchema": True,
            "schemaTypes": ["Article"],
            "schemaData": [{"@context": "https://schema.org", "@type": "Article", "headline": "Test"}],
            "responseHeaders": {"statusCode": 200},
        },
        {
            "url": "https://example.com/redirect-chain/",
            "title": "Chain Page",
            "canonical": "https://example.com/redirect-chain/",
            "canonicalResolved": "https://example.com/redirect-chain/",
            "canonicalCount": 1,
            "robotsMeta": None,
            "viewportMeta": None,
            "statusCode": 200,
            "redirectChain": [
                {"url": "http://example.com/a/", "status": 301, "location": "http://example.com/b/"},
                {"url": "http://example.com/b/", "status": 302, "location": "https://example.com/c/"},
                {"url": "https://example.com/c/", "status": 301, "location": "https://example.com/redirect-chain/"},
            ],
            "redirectChainLength": 3,
            "hasSchema": False,
            "schemaData": [],
            "responseHeaders": {"statusCode": 200},
        },
        {
            "url": "https://example.com/bad-schema/",
            "title": "Bad Schema Page",
            "canonical": "https://example.com/bad-schema/",
            "canonicalResolved": "https://example.com/bad-schema/",
            "canonicalCount": 2,
            "robotsMeta": None,
            "viewportMeta": "width=device-width, initial-scale=1, maximum-scale=1",
            "statusCode": 200,
            "redirectChain": [],
            "hasSchema": True,
            "schemaTypes": ["LocalBusiness"],
            "schemaData": [
                {"@context": "https://schema.org", "@type": "LocalBusiness", "name": ""},
                {"_parseError": "Unexpected token", "_raw": "{bad json"},
            ],
            "responseHeaders": {"statusCode": 200},
        },
    ]


# ---------------------------------------------------------------------------
# P7 Tests — Canonical Audit
# ---------------------------------------------------------------------------


def test_canonical_audit_relative(analyzer, p7_pages):
    result = analyzer.audit_canonicals(p7_pages)
    issues = [i for i in result["issues"] if i["issue"] == "CANONICAL_RELATIVE"]
    assert len(issues) == 1
    assert "old-page" in issues[0]["url"]


def test_canonical_audit_header_mismatch(analyzer, p7_pages):
    result = analyzer.audit_canonicals(p7_pages)
    issues = [i for i in result["issues"] if i["issue"] == "CANONICAL_HEADER_MISMATCH"]
    assert len(issues) == 1


def test_canonical_audit_multiple(analyzer, p7_pages):
    result = analyzer.audit_canonicals(p7_pages)
    issues = [i for i in result["issues"] if i["issue"] == "MULTIPLE_CANONICALS"]
    assert len(issues) == 1
    assert "bad-schema" in issues[0]["url"]


def test_canonical_audit_summary(analyzer, p7_pages):
    result = analyzer.audit_canonicals(p7_pages)
    assert result["summary"]["totalPages"] == 5
    assert result["summary"]["pagesWithCanonical"] > 0


# ---------------------------------------------------------------------------
# P7 Tests — Redirect Chains
# ---------------------------------------------------------------------------


def test_redirect_chain_detection(analyzer, p7_pages):
    result = analyzer.audit_redirect_chains(p7_pages)
    assert result["summary"]["totalRedirects"] >= 1


def test_redirect_chain_long(analyzer, p7_pages):
    result = analyzer.audit_redirect_chains(p7_pages)
    chain_issues = [i for i in result["issues"] if i["issue"] == "REDIRECT_CHAIN"]
    # The 3-hop chain should be flagged
    assert len(chain_issues) >= 1


def test_redirect_loop_detection(analyzer):
    pages = [{
        "url": "https://example.com/loop/",
        "redirectChain": [
            {"url": "https://example.com/a/", "status": 301, "location": "https://example.com/b/"},
            {"url": "https://example.com/b/", "status": 301, "location": "https://example.com/a/"},
            {"url": "https://example.com/a/", "status": 301, "location": "https://example.com/b/"},
        ],
        "redirectChainLength": 3,
        "statusCode": 200,
    }]
    result = analyzer.audit_redirect_chains(pages)
    loop_issues = [i for i in result["issues"] if i["issue"] == "REDIRECT_LOOP"]
    assert len(loop_issues) == 1


# ---------------------------------------------------------------------------
# P7 Tests — Security Headers
# ---------------------------------------------------------------------------


def test_security_headers_clean_page(analyzer, p7_pages):
    # Homepage has all headers — should produce no issues for that page
    result = analyzer.audit_security_headers([p7_pages[0]])
    assert result["summary"]["totalIssues"] == 0


def test_security_headers_missing(analyzer, p7_pages):
    # old-page is missing most headers
    result = analyzer.audit_security_headers([p7_pages[1]])
    issues = result["issues"]
    issue_codes = {i["issue"] for i in issues}
    assert "MISSING_HSTS" in issue_codes
    assert "MISSING_X_CONTENT_TYPE_OPTIONS" in issue_codes


def test_security_headers_server_version(analyzer, p7_pages):
    result = analyzer.audit_security_headers([p7_pages[1]])
    version_issues = [i for i in result["issues"] if i["issue"] == "SERVER_VERSION_EXPOSED"]
    assert len(version_issues) == 1
    assert "Apache/2.4.52" in version_issues[0]["detail"]


# ---------------------------------------------------------------------------
# P7 Tests — Indexability
# ---------------------------------------------------------------------------


def test_indexability_noindex(analyzer, p7_pages):
    result = analyzer.audit_indexability(p7_pages)
    assert result["summary"]["noindexPages"] == 1
    assert "noindex-page" in result["noindexUrls"][0]


def test_indexability_nofollow(analyzer, p7_pages):
    result = analyzer.audit_indexability(p7_pages)
    assert result["summary"]["nofollowPages"] == 1


def test_indexability_schema_on_noindex(analyzer, p7_pages):
    result = analyzer.audit_indexability(p7_pages)
    schema_issues = [i for i in result["issues"] if i["issue"] == "SCHEMA_ON_NOINDEX_PAGE"]
    assert len(schema_issues) == 1


# ---------------------------------------------------------------------------
# P7 Tests — Mobile Usability
# ---------------------------------------------------------------------------


def test_mobile_missing_viewport(analyzer, p7_pages):
    result = analyzer.audit_mobile_usability(p7_pages)
    missing = [i for i in result["issues"] if i["issue"] == "MISSING_VIEWPORT"]
    assert len(missing) == 1  # redirect-chain page has no viewport


def test_mobile_blocks_zoom(analyzer, p7_pages):
    result = analyzer.audit_mobile_usability(p7_pages)
    zoom_issues = [i for i in result["issues"] if i["issue"] == "VIEWPORT_BLOCKS_ZOOM"]
    assert len(zoom_issues) == 1  # noindex-page has user-scalable=no


def test_mobile_limits_zoom(analyzer, p7_pages):
    result = analyzer.audit_mobile_usability(p7_pages)
    limit_issues = [i for i in result["issues"] if i["issue"] == "VIEWPORT_LIMITS_ZOOM"]
    assert len(limit_issues) == 1  # bad-schema page has maximum-scale=1


def test_mobile_summary(analyzer, p7_pages):
    result = analyzer.audit_mobile_usability(p7_pages)
    assert result["summary"]["pagesWithViewport"] == 4
    assert result["summary"]["pagesWithoutViewport"] == 1


# ---------------------------------------------------------------------------
# P7 Tests — Structured Data Validation
# ---------------------------------------------------------------------------


def test_schema_parse_error(analyzer, p7_pages):
    result = analyzer.validate_structured_data(p7_pages)
    parse_errors = [i for i in result["issues"] if i["issue"] == "SCHEMA_PARSE_ERROR"]
    assert len(parse_errors) == 1


def test_schema_missing_required_field(analyzer, p7_pages):
    result = analyzer.validate_structured_data(p7_pages)
    missing_field = [i for i in result["issues"] if i["issue"] == "SCHEMA_MISSING_REQUIRED_FIELD"]
    # LocalBusiness has empty "name" and missing "address"
    assert len(missing_field) >= 1


def test_schema_article_missing_fields(analyzer, p7_pages):
    result = analyzer.validate_structured_data(p7_pages)
    missing = [i for i in result["issues"] if i["issue"] == "SCHEMA_MISSING_REQUIRED_FIELD" and "Article" in i.get("value", "")]
    # Article on noindex-page is missing author and datePublished
    assert len(missing) >= 1


def test_schema_valid_organization(analyzer, p7_pages):
    # Homepage has valid Organization with name and url
    result = analyzer.validate_structured_data([p7_pages[0]])
    missing = [i for i in result["issues"] if i["issue"] == "SCHEMA_MISSING_REQUIRED_FIELD"]
    assert len(missing) == 0


def test_schema_summary(analyzer, p7_pages):
    result = analyzer.validate_structured_data(p7_pages)
    s = result["summary"]
    assert s["totalSchemas"] > 0
    assert s["invalidSchemas"] >= 1  # parse error


# ---------------------------------------------------------------------------
# P7 Tests — Sitemap Validation
# ---------------------------------------------------------------------------


def test_sitemap_noindex_in_sitemap(analyzer):
    sitemap_urls = ["https://example.com/", "https://example.com/hidden/"]
    pages = [
        {"url": "https://example.com/", "statusCode": 200, "robotsMeta": None},
        {"url": "https://example.com/hidden/", "statusCode": 200, "robotsMeta": "noindex"},
    ]
    result = analyzer.audit_sitemap(sitemap_urls, pages)
    issues = [i for i in result["issues"] if i["issue"] == "NOINDEX_IN_SITEMAP"]
    assert len(issues) == 1


def test_sitemap_error_url(analyzer):
    sitemap_urls = ["https://example.com/", "https://example.com/gone/"]
    pages = [
        {"url": "https://example.com/", "statusCode": 200},
        {"url": "https://example.com/gone/", "statusCode": 404},
    ]
    result = analyzer.audit_sitemap(sitemap_urls, pages)
    issues = [i for i in result["issues"] if i["issue"] == "SITEMAP_URL_ERROR"]
    assert len(issues) == 1


def test_sitemap_crawled_not_in_sitemap(analyzer):
    sitemap_urls = ["https://example.com/"]
    pages = [
        {"url": "https://example.com/"},
        {"url": "https://example.com/orphan/"},
    ]
    result = analyzer.audit_sitemap(sitemap_urls, pages)
    assert result["summary"]["crawledNotInSitemap"] == 1


def test_sitemap_url_limit(analyzer):
    sitemap_urls = [f"https://example.com/page{i}/" for i in range(50001)]
    result = analyzer.audit_sitemap(sitemap_urls, [])
    issues = [i for i in result["issues"] if i["issue"] == "SITEMAP_EXCEEDS_URL_LIMIT"]
    assert len(issues) == 1
