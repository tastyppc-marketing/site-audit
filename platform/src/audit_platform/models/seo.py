from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class KeywordRecord(BaseModel):
    keyword: str
    volume: Optional[int] = None
    difficulty: Optional[int] = None
    cpc: Optional[float] = None
    position: Optional[int] = None
    url: Optional[str] = None
    serp_features: list[str] = Field(default_factory=list)
    source: str
    fetched_at: datetime = Field(default_factory=datetime.utcnow)


class BacklinkRecord(BaseModel):
    source_url: str
    target_url: str
    anchor_text: str = ""
    domain_rating: Optional[float] = None
    is_dofollow: bool = True
    first_seen: Optional[datetime] = None
    source: str = ""


class OrganicKeywordRecord(BaseModel):
    keyword: str
    position: int
    url: str
    traffic: Optional[int] = None
    volume: Optional[int] = None
    difficulty: Optional[int] = None


class PageAuditRecord(BaseModel):
    url: str
    title: str = ""
    meta_description: str = ""
    h1_tags: list[str] = Field(default_factory=list)
    h2_tags: list[str] = Field(default_factory=list)
    word_count: int = 0
    has_schema: bool = False
    schema_types: list[str] = Field(default_factory=list)
    canonical_url: str = ""
    og_tags: dict[str, Any] = Field(default_factory=dict)
    alt_text_coverage: float = 0.0
    internal_links: int = 0
    external_links: int = 0
    issues: list[str] = Field(default_factory=list)


class DomainMetrics(BaseModel):
    domain: str
    domain_rating: Optional[float] = None
    organic_traffic: Optional[int] = None
    organic_keywords: Optional[int] = None
    referring_domains: Optional[int] = None
    backlinks: Optional[int] = None
    traffic_value: Optional[float] = None
    source: str = ""
