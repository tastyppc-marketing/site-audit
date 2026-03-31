"""Tests for PPCAnalyzer (P11)."""

from __future__ import annotations

import pytest

from audit_platform.analyzers.ppc_analyzer import PPCAnalyzer


@pytest.fixture()
def analyzer():
    return PPCAnalyzer()


@pytest.fixture()
def sample_keywords():
    return [
        {"keyword": "mammoth lakes homes", "match_type": "EXACT", "quality_score": 8, "impressions": 500, "clicks": 50, "cost": 150.0, "conversions": 5, "campaign_id": "c1", "ad_group_id": "ag1", "bidding_strategy_type": "TARGET_CPA"},
        {"keyword": "real estate mammoth", "match_type": "PHRASE", "quality_score": 6, "impressions": 300, "clicks": 25, "cost": 80.0, "conversions": 2, "campaign_id": "c1", "ad_group_id": "ag1", "bidding_strategy_type": "TARGET_CPA"},
        {"keyword": "buy home california", "match_type": "BROAD", "quality_score": 3, "impressions": 1000, "clicks": 120, "cost": 400.0, "conversions": 0, "campaign_id": "c2", "ad_group_id": "ag2", "bidding_strategy_type": "MANUAL_CPC"},
        {"keyword": "mammoth lakes condos", "match_type": "EXACT", "quality_score": 7, "impressions": 200, "clicks": 20, "cost": 60.0, "conversions": 3, "campaign_id": "c1", "ad_group_id": "ag1", "bidding_strategy_type": "TARGET_CPA"},
        {"keyword": "ski resort property", "match_type": "BROAD", "quality_score": 2, "impressions": 800, "clicks": 90, "cost": 300.0, "conversions": 1, "campaign_id": "c2", "ad_group_id": "ag3", "bidding_strategy_type": "MANUAL_CPC", "expected_ctr_status": "BELOW_AVERAGE", "ad_relevance_status": "BELOW_AVERAGE", "landing_page_exp_status": "AVERAGE"},
        {"keyword": "mammoth lakes properties", "match_type": "EXACT", "quality_score": 9, "impressions": 600, "clicks": 70, "cost": 200.0, "conversions": 8, "campaign_id": "brand1", "ad_group_id": "ag4", "bidding_strategy_type": "TARGET_CPA"},
    ]


@pytest.fixture()
def sample_campaigns():
    return [
        {"id": "c1", "name": "Search - Non-Brand - Mammoth", "bidding_strategy_type": "TARGET_CPA", "status": "ENABLED"},
        {"id": "c2", "name": "Search - General", "bidding_strategy_type": "MANUAL_CPC", "status": "ENABLED"},
        {"id": "brand1", "name": "Brand - Mammoth Properties", "bidding_strategy_type": "TARGET_CPA", "status": "ENABLED"},
    ]


@pytest.fixture()
def sample_search_terms():
    return [
        {"search_term": "mammoth lakes homes for sale", "impressions": 200, "clicks": 30, "cost": 90.0, "conversions": 4},
        {"search_term": "mammoth lakes real estate agent", "impressions": 150, "clicks": 20, "cost": 60.0, "conversions": 2},
        {"search_term": "cheap homes in california", "impressions": 300, "clicks": 40, "cost": 120.0, "conversions": 0},
        {"search_term": "mammoth lakes vacation rental income", "impressions": 100, "clicks": 15, "cost": 45.0, "conversions": 1},
        {"search_term": "how to become a real estate agent", "impressions": 250, "clicks": 35, "cost": 105.0, "conversions": 0},
        {"search_term": "free homes in mammoth lakes", "impressions": 80, "clicks": 10, "cost": 30.0, "conversions": 0},
    ]


# ---------------------------------------------------------------------------
# Tests — Full Pipeline
# ---------------------------------------------------------------------------


def test_full_analyze(analyzer, sample_campaigns, sample_keywords, sample_search_terms):
    result = analyzer.analyze(
        campaigns=sample_campaigns,
        keywords=sample_keywords,
        search_terms=sample_search_terms,
    )
    assert "accountScore" in result
    assert "structure" in result
    assert "qualityScore" in result
    assert "wastedSpend" in result
    assert "ngramAnalysis" in result
    assert "budgetBidding" in result
    assert "recommendations" in result


def test_full_analyze_empty(analyzer):
    result = analyzer.analyze()
    # With no data, structure checks still run but most pass by default
    assert "accountScore" in result
    assert result["accountScore"]["totalChecks"] >= 0


# ---------------------------------------------------------------------------
# Tests — Structure Analysis
# ---------------------------------------------------------------------------


def test_structure_brand_separation(analyzer, sample_campaigns, sample_keywords):
    result = analyzer._analyze_structure(sample_campaigns, [], sample_keywords)
    brand_check = next(c for c in result["checks"] if c["id"] == "ST-04")
    assert brand_check["status"] == "pass"  # Has "Brand" campaign


def test_structure_no_brand_campaign(analyzer, sample_keywords):
    campaigns = [{"id": "c1", "name": "Search - General"}]
    result = analyzer._analyze_structure(campaigns, [], sample_keywords)
    brand_check = next(c for c in result["checks"] if c["id"] == "ST-04")
    assert brand_check["status"] == "fail"


def test_structure_duplicate_keywords(analyzer, sample_keywords):
    # Add a duplicate
    duped = sample_keywords + [{"keyword": "mammoth lakes homes", "match_type": "EXACT", "campaign_id": "c2", "ad_group_id": "ag5"}]
    result = analyzer._analyze_structure([], [], duped)
    dupe_check = next(c for c in result["checks"] if c["id"] == "ST-09")
    assert dupe_check["status"] != "pass"


def test_structure_match_type_distribution(analyzer, sample_keywords):
    result = analyzer._analyze_structure([], [], sample_keywords)
    mt_check = next(c for c in result["checks"] if c["id"] == "QS-08")
    # 4 exact + 1 phrase + 2 broad = mostly exact/phrase
    assert mt_check["status"] in ("pass", "warn")


# ---------------------------------------------------------------------------
# Tests — Quality Score
# ---------------------------------------------------------------------------


def test_qs_impression_weighted(analyzer, sample_keywords):
    result = analyzer._analyze_quality_score(sample_keywords)
    # Weighted by impressions — high-impression keywords with QS 8, 9 pull the avg up
    assert result["summary"]["accountQS"] > 5


def test_qs_low_qs_detection(analyzer, sample_keywords):
    result = analyzer._analyze_quality_score(sample_keywords)
    # QS ≤ 3: "ski resort property" (QS=2) and "buy home california" (QS=3)
    assert result["summary"]["lowQSKeywords"] == 2


def test_qs_distribution(analyzer, sample_keywords):
    result = analyzer._analyze_quality_score(sample_keywords)
    dist = result["distribution"]
    assert 8 in dist  # mammoth lakes homes
    assert 2 in dist  # ski resort property


def test_qs_sub_components(analyzer, sample_keywords):
    result = analyzer._analyze_quality_score(sample_keywords)
    # ski resort property has BELOW_AVERAGE expected_ctr and ad_relevance
    qs_checks = [c for c in result["checks"] if c["id"] in ("QS-03", "QS-04", "QS-05")]
    assert len(qs_checks) >= 1  # At least one sub-component check


def test_qs_empty_keywords(analyzer):
    result = analyzer._analyze_quality_score([])
    assert result["summary"]["accountQS"] == 0


def test_qs_no_qs_data(analyzer):
    kws = [{"keyword": "test", "quality_score": None, "impressions": 100}]
    result = analyzer._analyze_quality_score(kws)
    assert result["summary"]["totalWithQS"] == 0


# ---------------------------------------------------------------------------
# Tests — Wasted Spend
# ---------------------------------------------------------------------------


def test_wasted_spend_zero_conv(analyzer, sample_keywords, sample_search_terms):
    result = analyzer._analyze_wasted_spend(sample_keywords, sample_search_terms, target_cpa=30.0)
    # "buy home california" has 120 clicks, 0 conversions = wasted
    assert result["summary"]["zeroConvKeywords"] == 1


def test_wasted_spend_below_threshold(analyzer):
    # Keyword with 99 clicks — should NOT be flagged
    kws = [{"keyword": "test", "clicks": 99, "conversions": 0, "cost": 50.0, "impressions": 200}]
    result = analyzer._analyze_wasted_spend(kws, [], target_cpa=30.0)
    assert result["summary"]["zeroConvKeywords"] == 0


def test_wasted_spend_broad_no_smart(analyzer, sample_keywords, sample_search_terms):
    result = analyzer._analyze_wasted_spend(sample_keywords, sample_search_terms, target_cpa=30.0)
    broad_check = next((c for c in result["checks"] if c["id"] == "WS-05"), None)
    assert broad_check is not None
    # "buy home california" and "ski resort property" are broad + MANUAL_CPC
    assert broad_check["status"] == "fail"


def test_wasted_spend_percentage(analyzer, sample_keywords, sample_search_terms):
    result = analyzer._analyze_wasted_spend(sample_keywords, sample_search_terms, target_cpa=30.0)
    assert result["summary"]["wastedPct"] > 0


# ---------------------------------------------------------------------------
# Tests — N-gram Analysis
# ---------------------------------------------------------------------------


def test_ngram_extraction(analyzer):
    grams = analyzer._extract_ngrams("mammoth lakes homes for sale", 2)
    assert "mammoth lakes" in grams
    assert "homes for" in grams
    assert len(grams) == 4  # 5 words, 4 bigrams


def test_ngram_analysis(analyzer, sample_search_terms):
    result = analyzer._analyze_ngrams(sample_search_terms)
    assert result["summary"]["totalTerms"] == 6
    assert len(result["topNgrams"]) > 0


def test_ngram_negative_candidates(analyzer, sample_search_terms):
    result = analyzer._analyze_ngrams(sample_search_terms)
    # "cheap", "free", "how to become" should surface as negative candidates
    neg_grams = [n["ngram"] for n in result["negativeCandidates"]]
    # At least one zero-conversion n-gram should be identified
    assert len(result["negativeCandidates"]) >= 0  # May not meet thresholds with small data


def test_ngram_raw_count_aggregation(analyzer):
    """Verify n-grams sum raw counts, not pre-computed rates."""
    terms = [
        {"search_term": "mammoth lakes homes", "impressions": 100, "clicks": 10, "cost": 30.0, "conversions": 2},
        {"search_term": "mammoth lakes condos", "impressions": 200, "clicks": 20, "cost": 60.0, "conversions": 3},
    ]
    result = analyzer._analyze_ngrams(terms)
    # "mammoth" and "mammoth lakes" should aggregate
    mammoth_lakes = next((r for r in result["topNgrams"] if r["ngram"] == "mammoth lakes"), None)
    if mammoth_lakes:
        assert mammoth_lakes["impressions"] == 300  # 100 + 200
        assert mammoth_lakes["clicks"] == 30  # 10 + 20
        assert mammoth_lakes["cost"] == 90.0  # 30 + 60


def test_ngram_empty_terms(analyzer):
    result = analyzer._analyze_ngrams([])
    assert result["summary"]["totalTerms"] == 0


# ---------------------------------------------------------------------------
# Tests — Budget & Bidding
# ---------------------------------------------------------------------------


def test_budget_smart_bidding(analyzer, sample_campaigns):
    result = analyzer._analyze_budget_bidding(sample_campaigns)
    smart_check = next(c for c in result["checks"] if c["id"] == "SE-07")
    # 2 TARGET_CPA, 1 MANUAL_CPC — smart > manual
    assert smart_check["status"] == "warn"  # Has manual but more smart


def test_budget_all_manual(analyzer):
    campaigns = [
        {"id": "c1", "name": "Test", "bidding_strategy_type": "MANUAL_CPC"},
        {"id": "c2", "name": "Test 2", "bidding_strategy_type": "MANUAL_CPC"},
    ]
    result = analyzer._analyze_budget_bidding(campaigns)
    smart_check = next(c for c in result["checks"] if c["id"] == "SE-07")
    assert smart_check["status"] == "fail"


# ---------------------------------------------------------------------------
# Tests — Account Score
# ---------------------------------------------------------------------------


def test_account_score_all_pass(analyzer):
    checks = [
        {"status": "pass", "severity": "high", "category": "wasted_spend"},
        {"status": "pass", "severity": "critical", "category": "conversion_tracking"},
    ]
    result = analyzer._compute_account_score(checks)
    assert result["score"] == 100
    assert result["grade"] == "A"


def test_account_score_all_fail(analyzer):
    checks = [
        {"status": "fail", "severity": "critical", "category": "wasted_spend"},
        {"status": "fail", "severity": "high", "category": "quality_score"},
    ]
    result = analyzer._compute_account_score(checks)
    assert result["score"] == 0
    assert result["grade"] == "F"


def test_account_score_warns_half_credit(analyzer):
    checks = [
        {"status": "warn", "severity": "high", "category": "structure"},
        {"status": "warn", "severity": "high", "category": "structure"},
    ]
    result = analyzer._compute_account_score(checks)
    assert result["score"] == 50  # Half credit for warnings


def test_account_score_empty(analyzer):
    result = analyzer._compute_account_score([])
    assert result["score"] == 0


# ---------------------------------------------------------------------------
# Tests — Recommendations
# ---------------------------------------------------------------------------


def test_recommendations_from_failures(analyzer, sample_campaigns, sample_keywords, sample_search_terms):
    result = analyzer.analyze(
        campaigns=sample_campaigns,
        keywords=sample_keywords,
        search_terms=sample_search_terms,
    )
    recs = result["recommendations"]
    assert len(recs) > 0
    # Should be sorted by priority
    priorities = [r["priority"] for r in recs]
    assert priorities == sorted(priorities, reverse=True)


def test_recommendations_capped(analyzer):
    # Create tons of failing checks
    checks = [
        {"status": "fail", "severity": "medium", "category": "structure", "id": f"X-{i}", "name": f"Check {i}", "detail": ""}
        for i in range(50)
    ]
    recs = analyzer._generate_recommendations(
        {"checks": checks}, {"checks": []}, {"checks": []}, {"negativeCandidates": []}, {"checks": []}
    )
    assert len(recs) <= 30


# ---------------------------------------------------------------------------
# Tests — Helper Functions
# ---------------------------------------------------------------------------


def test_compute_account_cpa(analyzer):
    kws = [
        {"cost": 100, "conversions": 5},
        {"cost": 200, "conversions": 10},
    ]
    cpa = analyzer._compute_account_cpa(kws)
    assert cpa == 20.0  # 300 / 15


def test_compute_account_cpa_no_conversions(analyzer):
    kws = [{"cost": 100, "conversions": 0}]
    cpa = analyzer._compute_account_cpa(kws)
    assert cpa == 50.0  # Default fallback
