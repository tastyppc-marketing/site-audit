"""Shared pytest fixtures for the audit-platform test suite."""

from __future__ import annotations

from pathlib import Path
from typing import Generator
from unittest.mock import MagicMock, patch

import pytest

import audit_platform
from audit_platform.config import Settings


def pytest_configure(config: pytest.Config) -> None:
    """Fail fast if pytest is importing audit_platform from a different tree.

    The package is installed editably; if the editable install points at a
    different repo (e.g. a sibling production checkout), pytest silently
    runs against stale code and verification becomes meaningless. Catch
    that here with a clear remediation pointer.
    """
    expected = (Path(__file__).resolve().parents[1] / "src" / "audit_platform" / "__init__.py").resolve()
    actual = Path(audit_platform.__file__).resolve()
    if expected != actual:
        raise pytest.UsageError(
            f"audit_platform is being imported from {actual} but tests live alongside {expected}.\n"
            f"Reinstall the editable package from this repo:\n"
            f"  pip install -e platform/ --break-system-packages\n"
            f"This usually happens when a sibling production checkout was installed first."
        )


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

@pytest.fixture()
def settings() -> Settings:
    """Return a Settings instance populated with safe test defaults.

    No .env file is loaded (env_file is overridden to a non-existent path).
    Every value is either a harmless placeholder or the field default.
    """
    return Settings(
        _env_file=None,  # type: ignore[call-arg]
        GOOGLE_CLIENT_ID="test-client-id.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET="test-client-secret",
        GOOGLE_REFRESH_TOKEN="test-refresh-token",
        GOOGLE_ADS_DEVELOPER_TOKEN="test-dev-token",
        GOOGLE_ADS_LOGIN_CUSTOMER_ID="1234567890",
        GOOGLE_ADS_CUSTOMER_ID="9876543210",
        GA4_PROPERTY_ID="123456789",
        SEARCH_CONSOLE_SITE_URL="https://example.com/",
        PAGESPEED_API_KEY="test-pagespeed-key",
        CRUX_API_KEY="test-crux-key",
        GBP_ACCOUNT_ID="111111",
        GBP_LOCATION_ID="222222",
        DATAFORSEO_LOGIN="test@example.com",
        DATAFORSEO_PASSWORD="test-password",
        LOG_LEVEL="DEBUG",
        HTTP_TIMEOUT=5,
    )


# ---------------------------------------------------------------------------
# Mock credentials
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_oauth_credentials() -> MagicMock:
    """Return a MagicMock that stands in for google.oauth2.credentials.Credentials."""
    creds = MagicMock()
    creds.token = "fake-access-token"
    creds.refresh_token = "fake-refresh-token"
    creds.client_id = "test-client-id.apps.googleusercontent.com"
    creds.client_secret = "test-client-secret"
    creds.valid = True
    creds.expired = False
    return creds


@pytest.fixture()
def mock_service_account_credentials() -> MagicMock:
    """Return a MagicMock that stands in for google.oauth2.service_account.Credentials."""
    creds = MagicMock()
    creds.service_account_email = "test@project.iam.gserviceaccount.com"
    creds.token = "fake-sa-access-token"
    creds.valid = True
    creds.expired = False
    return creds


# ---------------------------------------------------------------------------
# HTTP mocking
# ---------------------------------------------------------------------------

@pytest.fixture()
def httpx_mock() -> Generator[MagicMock, None, None]:
    """Patch httpx.Client so no real HTTP requests are made.

    The fixture yields a MagicMock whose `.get`, `.post`, etc. methods can
    be configured per-test.  Example::

        def test_something(httpx_mock):
            httpx_mock.get.return_value = httpx.Response(200, json={"ok": True})
    """
    mock_client = MagicMock()

    # Provide a sensible default response for any un-configured call.
    default_response = MagicMock()
    default_response.status_code = 200
    default_response.json.return_value = {}
    default_response.text = ""
    default_response.raise_for_status = MagicMock()

    for method in ("get", "post", "put", "patch", "delete", "head", "options"):
        getattr(mock_client, method).return_value = default_response

    mock_client.is_closed = False

    with patch("httpx.Client", return_value=mock_client):
        yield mock_client
