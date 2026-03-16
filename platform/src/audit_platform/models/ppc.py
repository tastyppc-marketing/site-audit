from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class CampaignRecord(BaseModel):
    campaign_id: str
    name: str
    status: str
    budget_amount: float = 0.0
    budget_type: str = ""
    bidding_strategy: str = ""
    impressions: int = 0
    clicks: int = 0
    cost: float = 0.0
    conversions: float = 0.0
    cost_per_conversion: Optional[float] = None


class AdGroupRecord(BaseModel):
    ad_group_id: str
    campaign_id: str
    name: str
    status: str
    impressions: int = 0
    clicks: int = 0
    cost: float = 0.0
    conversions: float = 0.0
    ctr: float = 0.0
    avg_cpc: float = 0.0


class SearchTermRecord(BaseModel):
    search_term: str
    campaign_id: str
    ad_group_id: str
    impressions: int = 0
    clicks: int = 0
    cost: float = 0.0
    conversions: float = 0.0
    match_type: str = ""


class KeywordPPCRecord(BaseModel):
    keyword_text: str
    match_type: str
    ad_group_id: str
    campaign_id: str
    quality_score: Optional[int] = None
    impressions: int = 0
    clicks: int = 0
    cost: float = 0.0
    conversions: float = 0.0
    status: str = ""
