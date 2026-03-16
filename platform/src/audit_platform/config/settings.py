from __future__ import annotations

from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REFRESH_TOKEN: str = ""

    # Google Ads
    GOOGLE_ADS_DEVELOPER_TOKEN: str = ""
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: str = ""
    GOOGLE_ADS_CUSTOMER_ID: str = ""

    # GA4
    GA4_PROPERTY_ID: str = ""

    # Search Console
    SEARCH_CONSOLE_SITE_URL: str = ""

    # PageSpeed Insights
    PAGESPEED_API_KEY: Optional[str] = None

    # CrUX (can share the same key as PageSpeed)
    CRUX_API_KEY: Optional[str] = None

    # Google Business Profile
    GBP_ACCOUNT_ID: Optional[str] = None
    GBP_LOCATION_ID: Optional[str] = None

    # DataForSEO
    DATAFORSEO_LOGIN: str = ""
    DATAFORSEO_PASSWORD: str = ""

    # Service account JSON file path (alternative to OAuth)
    GOOGLE_SERVICE_ACCOUNT_JSON: Optional[Path] = None

    # General
    LOG_LEVEL: str = Field(default="INFO")
    HTTP_TIMEOUT: int = Field(default=30)
