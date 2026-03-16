"""Tests for Pydantic models in audit_platform.models."""

from __future__ import annotations

from datetime import date, datetime

import pytest

from audit_platform.models.seo import (
    BacklinkRecord,
    DomainMetrics,
    KeywordRecord,
    OrganicKeywordRecord,
    PageAuditRecord,
)
from audit_platform.models.ppc import (
    AdGroupRecord,
    CampaignRecord,
    KeywordPPCRecord,
    SearchTermRecord,
)
from audit_platform.models.performance import (
    CoreWebVitals,
    CrUXRecord,
    PageSpeedRecord,
)
from audit_platform.models.local import (
    BusinessProfileRecord,
    LocalPerformanceRecord,
)


# -------------------------------------------------------------------------
# SEO models
# -------------------------------------------------------------------------

class TestKeywordRecord:

    def test_keyword_record_creation(self):
        """KeywordRecord can be created with minimal required fields."""
        rec = KeywordRecord(keyword="seo audit", source="dataforseo")
        assert rec.keyword == "seo audit"
        assert rec.source == "dataforseo"
        assert rec.volume is None
        assert rec.difficulty is None
        assert rec.cpc is None
        assert rec.position is None
        assert rec.url is None
        assert rec.serp_features == []
        assert isinstance(rec.fetched_at, datetime)

    def test_keyword_record_full(self):
        """KeywordRecord accepts all optional fields."""
        rec = KeywordRecord(
            keyword="best seo tools",
            volume=12000,
            difficulty=45,
            cpc=3.50,
            position=7,
            url="https://example.com/seo-tools",
            serp_features=["featured_snippet", "people_also_ask"],
            source="ahrefs",
        )
        assert rec.volume == 12000
        assert rec.cpc == 3.50
        assert len(rec.serp_features) == 2

    def test_keyword_record_serialize_roundtrip(self):
        """KeywordRecord can serialize to dict and reconstruct."""
        original = KeywordRecord(keyword="test kw", source="test", volume=500)
        data = original.model_dump()
        restored = KeywordRecord(**data)
        assert restored.keyword == original.keyword
        assert restored.volume == original.volume
        assert restored.fetched_at == original.fetched_at


class TestBacklinkRecord:

    def test_backlink_record_defaults(self):
        rec = BacklinkRecord(source_url="https://a.com", target_url="https://b.com")
        assert rec.anchor_text == ""
        assert rec.is_dofollow is True
        assert rec.domain_rating is None

    def test_backlink_record_serialize_roundtrip(self):
        original = BacklinkRecord(
            source_url="https://a.com/page",
            target_url="https://b.com/page",
            anchor_text="click here",
            domain_rating=72.5,
            is_dofollow=False,
        )
        restored = BacklinkRecord(**original.model_dump())
        assert restored == original


class TestOrganicKeywordRecord:

    def test_creation(self):
        rec = OrganicKeywordRecord(keyword="test", position=3, url="https://example.com")
        assert rec.traffic is None


class TestPageAuditRecord:

    def test_defaults(self):
        rec = PageAuditRecord(url="https://example.com/page")
        assert rec.title == ""
        assert rec.h1_tags == []
        assert rec.word_count == 0
        assert rec.has_schema is False
        assert rec.issues == []


class TestDomainMetrics:

    def test_serialize_roundtrip(self):
        original = DomainMetrics(
            domain="example.com",
            domain_rating=65.3,
            organic_traffic=15000,
            referring_domains=230,
        )
        restored = DomainMetrics(**original.model_dump())
        assert restored == original


# -------------------------------------------------------------------------
# PPC models
# -------------------------------------------------------------------------

class TestCampaignRecord:

    def test_campaign_record_cost_conversion(self):
        """CampaignRecord stores cost as a float (micros already converted)."""
        rec = CampaignRecord(
            campaign_id="123",
            name="Brand Campaign",
            status="ENABLED",
            budget_amount=50.00,
            impressions=10000,
            clicks=500,
            cost=125.75,
            conversions=12.0,
            cost_per_conversion=10.48,
        )
        assert rec.cost == 125.75
        assert rec.cost_per_conversion == 10.48
        assert rec.clicks == 500

    def test_campaign_record_defaults(self):
        rec = CampaignRecord(campaign_id="1", name="Test", status="PAUSED")
        assert rec.budget_amount == 0.0
        assert rec.impressions == 0
        assert rec.cost == 0.0
        assert rec.conversions == 0.0
        assert rec.cost_per_conversion is None

    def test_campaign_record_serialize_roundtrip(self):
        original = CampaignRecord(
            campaign_id="456",
            name="Search - NonBrand",
            status="ENABLED",
            cost=250.00,
            conversions=8.0,
        )
        restored = CampaignRecord(**original.model_dump())
        assert restored == original


class TestAdGroupRecord:

    def test_creation(self):
        rec = AdGroupRecord(
            ad_group_id="ag1",
            campaign_id="c1",
            name="Ad Group 1",
            status="ENABLED",
        )
        assert rec.ctr == 0.0
        assert rec.avg_cpc == 0.0


class TestSearchTermRecord:

    def test_creation(self):
        rec = SearchTermRecord(
            search_term="buy seo tools",
            campaign_id="c1",
            ad_group_id="ag1",
            impressions=200,
            clicks=15,
            cost=22.50,
        )
        assert rec.match_type == ""


class TestKeywordPPCRecord:

    def test_creation_and_roundtrip(self):
        original = KeywordPPCRecord(
            keyword_text="seo software",
            match_type="EXACT",
            ad_group_id="ag1",
            campaign_id="c1",
            quality_score=8,
            impressions=1000,
            clicks=100,
            cost=150.00,
        )
        restored = KeywordPPCRecord(**original.model_dump())
        assert restored == original


# -------------------------------------------------------------------------
# Performance models
# -------------------------------------------------------------------------

class TestPageSpeedRecord:

    def test_page_speed_record_validation(self):
        """PageSpeedRecord can be created with the required url field."""
        rec = PageSpeedRecord(url="https://example.com/", strategy="mobile")
        assert rec.url == "https://example.com/"
        assert rec.strategy == "mobile"
        assert rec.performance_score == 0.0

    def test_page_speed_record_serialize_roundtrip(self):
        original = PageSpeedRecord(
            url="https://example.com/",
            strategy="desktop",
            performance_score=92.0,
            lcp=1200.0,
            cls=0.05,
            fcp=800.0,
        )
        restored = PageSpeedRecord(**original.model_dump())
        assert restored == original


class TestCrUXRecord:

    def test_defaults(self):
        rec = CrUXRecord(url_or_origin="https://example.com")
        assert rec.form_factor == "ALL"
        assert rec.lcp_p75 is None

    def test_serialize_roundtrip(self):
        original = CrUXRecord(
            url_or_origin="https://example.com",
            lcp_p75=2500.0,
            cls_p75=0.1,
            form_factor="PHONE",
        )
        restored = CrUXRecord(**original.model_dump())
        assert restored == original


class TestCoreWebVitals:

    def test_defaults(self):
        cwv = CoreWebVitals(url="https://example.com")
        assert cwv.mobile is None
        assert cwv.desktop is None


# -------------------------------------------------------------------------
# Local / Business Profile models
# -------------------------------------------------------------------------

class TestBusinessProfileRecord:

    def test_business_profile_record(self):
        """BusinessProfileRecord stores location data with sensible defaults."""
        rec = BusinessProfileRecord(
            account_id="acc123",
            location_id="loc456",
            name="Test Business",
            address="123 Main St, Anytown, USA",
            phone="+15551234567",
            website="https://example.com",
            primary_category="Plumber",
            rating=4.7,
            review_count=128,
        )
        assert rec.name == "Test Business"
        assert rec.rating == 4.7
        assert rec.additional_categories == []
        assert rec.attributes == {}

    def test_business_profile_record_serialize_roundtrip(self):
        original = BusinessProfileRecord(
            account_id="a1",
            location_id="l1",
            name="Biz",
            primary_category="Dentist",
            additional_categories=["Cosmetic Dentist", "Orthodontist"],
            attributes={"has_parking": True},
        )
        restored = BusinessProfileRecord(**original.model_dump())
        assert restored == original


class TestLocalPerformanceRecord:

    def test_creation(self):
        rec = LocalPerformanceRecord(
            location_id="loc1",
            date=date(2025, 1, 15),
            search_impressions=350,
            maps_impressions=120,
            call_clicks=5,
            website_clicks=20,
            direction_requests=8,
        )
        assert rec.search_impressions == 350
        assert rec.desktop_search_impressions == 0
        assert rec.direction_requests == 8


# -------------------------------------------------------------------------
# Cross-cutting: all models can serialize to dict and back
# -------------------------------------------------------------------------

class TestAllModelsSerialization:
    """Every model should survive a model_dump -> reconstruct cycle."""

    @pytest.mark.parametrize("model_cls,kwargs", [
        (KeywordRecord, {"keyword": "test", "source": "test"}),
        (BacklinkRecord, {"source_url": "https://a.com", "target_url": "https://b.com"}),
        (OrganicKeywordRecord, {"keyword": "kw", "position": 1, "url": "https://x.com"}),
        (PageAuditRecord, {"url": "https://example.com"}),
        (DomainMetrics, {"domain": "example.com"}),
        (CampaignRecord, {"campaign_id": "1", "name": "C", "status": "ENABLED"}),
        (AdGroupRecord, {"ad_group_id": "1", "campaign_id": "1", "name": "AG", "status": "ENABLED"}),
        (SearchTermRecord, {"search_term": "q", "campaign_id": "1", "ad_group_id": "1"}),
        (KeywordPPCRecord, {"keyword_text": "kw", "match_type": "BROAD", "ad_group_id": "1", "campaign_id": "1"}),
        (PageSpeedRecord, {"url": "https://example.com", "strategy": "mobile"}),
        (CrUXRecord, {"url_or_origin": "https://example.com"}),
        (CoreWebVitals, {"url": "https://example.com"}),
        (BusinessProfileRecord, {"account_id": "a", "location_id": "l"}),
        (LocalPerformanceRecord, {"location_id": "l", "date": date(2025, 1, 1)}),
    ])
    def test_roundtrip(self, model_cls, kwargs):
        original = model_cls(**kwargs)
        data = original.model_dump()
        assert isinstance(data, dict)
        restored = model_cls(**data)
        assert restored == original
