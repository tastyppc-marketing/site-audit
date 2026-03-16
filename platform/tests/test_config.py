"""Tests for audit_platform.config.settings."""

from __future__ import annotations

import os

import pytest

from audit_platform.config import Settings


class TestSettingsDefaults:
    """Verify that Settings can be instantiated with no .env and no env vars."""

    def test_settings_loads_defaults(self, monkeypatch):
        """All fields should fall back to their declared defaults when no env
        vars or .env file are present."""
        # Clear any env vars that would match Settings fields.
        for key in list(os.environ):
            if key.startswith(("GOOGLE_", "GA4_", "SEARCH_CONSOLE_", "PAGESPEED_",
                               "CRUX_", "GBP_", "DATAFORSEO_", "LOG_LEVEL", "HTTP_TIMEOUT")):
                monkeypatch.delenv(key, raising=False)

        settings = Settings(_env_file=None)  # type: ignore[call-arg]

        # Required string fields default to empty string.
        assert settings.GOOGLE_CLIENT_ID == ""
        assert settings.GOOGLE_CLIENT_SECRET == ""
        assert settings.GOOGLE_REFRESH_TOKEN == ""
        assert settings.GOOGLE_ADS_DEVELOPER_TOKEN == ""
        assert settings.GOOGLE_ADS_LOGIN_CUSTOMER_ID == ""
        assert settings.GOOGLE_ADS_CUSTOMER_ID == ""
        assert settings.GA4_PROPERTY_ID == ""
        assert settings.SEARCH_CONSOLE_SITE_URL == ""
        assert settings.DATAFORSEO_LOGIN == ""
        assert settings.DATAFORSEO_PASSWORD == ""

        # General defaults.
        assert settings.LOG_LEVEL == "INFO"
        assert settings.HTTP_TIMEOUT == 30

    def test_settings_optional_fields_default_none(self, monkeypatch):
        """Optional fields should default to None when not set."""
        for key in list(os.environ):
            if key.startswith(("GOOGLE_", "GA4_", "SEARCH_CONSOLE_", "PAGESPEED_",
                               "CRUX_", "GBP_", "DATAFORSEO_")):
                monkeypatch.delenv(key, raising=False)

        settings = Settings(_env_file=None)  # type: ignore[call-arg]

        assert settings.PAGESPEED_API_KEY is None
        assert settings.CRUX_API_KEY is None
        assert settings.GBP_ACCOUNT_ID is None
        assert settings.GBP_LOCATION_ID is None
        assert settings.GOOGLE_SERVICE_ACCOUNT_JSON is None


class TestSettingsFromEnv:
    """Verify that Settings reads values from environment variables."""

    def test_settings_loads_from_env(self, monkeypatch):
        """Settings should pick up values from environment variables."""
        monkeypatch.setenv("GOOGLE_CLIENT_ID", "env-client-id")
        monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "env-client-secret")
        monkeypatch.setenv("GOOGLE_REFRESH_TOKEN", "env-refresh-token")
        monkeypatch.setenv("GOOGLE_ADS_DEVELOPER_TOKEN", "env-dev-token")
        monkeypatch.setenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "1111111111")
        monkeypatch.setenv("GOOGLE_ADS_CUSTOMER_ID", "2222222222")
        monkeypatch.setenv("GA4_PROPERTY_ID", "999888777")
        monkeypatch.setenv("SEARCH_CONSOLE_SITE_URL", "https://env-example.com/")
        monkeypatch.setenv("PAGESPEED_API_KEY", "env-ps-key")
        monkeypatch.setenv("CRUX_API_KEY", "env-crux-key")
        monkeypatch.setenv("GBP_ACCOUNT_ID", "333333")
        monkeypatch.setenv("GBP_LOCATION_ID", "444444")
        monkeypatch.setenv("DATAFORSEO_LOGIN", "env-login")
        monkeypatch.setenv("DATAFORSEO_PASSWORD", "env-password")
        monkeypatch.setenv("LOG_LEVEL", "DEBUG")
        monkeypatch.setenv("HTTP_TIMEOUT", "60")

        settings = Settings(_env_file=None)  # type: ignore[call-arg]

        assert settings.GOOGLE_CLIENT_ID == "env-client-id"
        assert settings.GOOGLE_CLIENT_SECRET == "env-client-secret"
        assert settings.GOOGLE_REFRESH_TOKEN == "env-refresh-token"
        assert settings.GOOGLE_ADS_DEVELOPER_TOKEN == "env-dev-token"
        assert settings.GOOGLE_ADS_LOGIN_CUSTOMER_ID == "1111111111"
        assert settings.GOOGLE_ADS_CUSTOMER_ID == "2222222222"
        assert settings.GA4_PROPERTY_ID == "999888777"
        assert settings.SEARCH_CONSOLE_SITE_URL == "https://env-example.com/"
        assert settings.PAGESPEED_API_KEY == "env-ps-key"
        assert settings.CRUX_API_KEY == "env-crux-key"
        assert settings.GBP_ACCOUNT_ID == "333333"
        assert settings.GBP_LOCATION_ID == "444444"
        assert settings.DATAFORSEO_LOGIN == "env-login"
        assert settings.DATAFORSEO_PASSWORD == "env-password"
        assert settings.LOG_LEVEL == "DEBUG"
        assert settings.HTTP_TIMEOUT == 60

    def test_settings_ignores_extra_env_vars(self, monkeypatch):
        """Settings with extra='ignore' should not raise on unknown env vars."""
        monkeypatch.setenv("TOTALLY_UNKNOWN_VAR", "should-not-break")

        # Should not raise.
        settings = Settings(_env_file=None)  # type: ignore[call-arg]
        assert not hasattr(settings, "TOTALLY_UNKNOWN_VAR")
