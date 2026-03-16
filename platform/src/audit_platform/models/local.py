"""Pydantic models for local / Google Business Profile data records."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class BusinessProfileRecord(BaseModel):
    """Normalized Google Business Profile location record."""

    account_id: str = ""
    location_id: str = ""
    name: str = Field(default="", description="GBP resource name (accounts/*/locations/*)")
    title: str = ""
    address: str = ""
    address_lines: list[str] = Field(default_factory=list)
    city: str = ""
    state: str = ""
    postal_code: str = ""
    country: str = ""
    phone: str = ""
    website: str = ""
    primary_category: str = ""
    category: str = ""
    additional_categories: list[str] = Field(default_factory=list)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_verified: bool = False
    open_status: str = ""
    rating: Optional[float] = None
    review_count: Optional[int] = None
    place_id: Optional[str] = None
    attributes: dict[str, Any] = Field(default_factory=dict)
    fetched_at: datetime = Field(default_factory=datetime.utcnow)


class LocalPerformanceRecord(BaseModel):
    """Daily performance metrics from the Business Profile Performance API.

    Aggregated metrics:
        search_impressions = desktop_search + mobile_search
        maps_impressions   = desktop_maps   + mobile_maps
    """

    location_id: str = ""
    date: date
    # Aggregated convenience totals
    search_impressions: int = 0
    maps_impressions: int = 0
    # Granular breakdown by device x surface
    desktop_search_impressions: int = 0
    mobile_search_impressions: int = 0
    desktop_maps_impressions: int = 0
    mobile_maps_impressions: int = 0
    # Action metrics
    call_clicks: int = 0
    website_clicks: int = 0
    direction_requests: int = 0
    # Legacy aliases (kept for backward compatibility)
    business_queries_search: Optional[int] = None
    business_queries_maps: Optional[int] = None
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
