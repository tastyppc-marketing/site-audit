from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class PageSpeedRecord(BaseModel):
    url: str
    strategy: str  # "mobile" or "desktop"
    performance_score: float = 0.0
    lcp: float = 0.0
    inp: Optional[float] = None
    cls: float = 0.0
    fcp: float = 0.0
    ttfb: Optional[float] = None
    speed_index: Optional[float] = None
    opportunities: list[dict] = Field(default_factory=list)
    diagnostics: list[dict] = Field(default_factory=list)


class CrUXRecord(BaseModel):
    url_or_origin: str
    lcp_p75: Optional[float] = None
    inp_p75: Optional[float] = None
    cls_p75: Optional[float] = None
    fcp_p75: Optional[float] = None
    ttfb_p75: Optional[float] = None
    form_factor: str = "ALL"


class CoreWebVitals(BaseModel):
    url: str
    mobile: Optional[CrUXRecord] = None
    desktop: Optional[CrUXRecord] = None
    lighthouse_mobile: Optional[PageSpeedRecord] = None
    lighthouse_desktop: Optional[PageSpeedRecord] = None
