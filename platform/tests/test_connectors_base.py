"""Tests for audit_platform.connectors.base retry coverage."""

from __future__ import annotations

from unittest.mock import MagicMock

import httpx
import pytest

from audit_platform.connectors.base import BaseConnector


@pytest.fixture
def connector(monkeypatch) -> BaseConnector:
    """A BaseConnector with rate-limiting and tenacity sleeps neutralised.

    Patches `time.sleep` globally so tenacity's `wait_exponential` between
    retries doesn't slow the suite, and `_rate_limit_sync`'s own sleep call
    is a no-op via a high requests_per_second.
    """
    monkeypatch.setattr("time.sleep", lambda *_args, **_kwargs: None)
    return BaseConnector(requests_per_second=10_000.0)


def _make_response(status_code: int) -> httpx.Response:
    """Build a real httpx.Response so raise_for_status() behaves correctly."""
    return httpx.Response(
        status_code=status_code,
        request=httpx.Request("POST", "https://example.test/endpoint"),
    )


class TestRequestSyncRetry:
    def test_5xx_retries_three_times(self, connector: BaseConnector) -> None:
        """HTTP 503 triggers the predicate and exhausts all 3 attempts."""
        mock_client = MagicMock()
        mock_client.request.return_value = _make_response(503)
        mock_client.is_closed = False
        connector._sync_client = mock_client

        with pytest.raises(httpx.HTTPStatusError) as exc_info:
            connector._request_sync("POST", "https://example.test/endpoint")

        assert exc_info.value.response.status_code == 503
        assert mock_client.request.call_count == 3

    def test_4xx_not_retried(self, connector: BaseConnector) -> None:
        """HTTP 404 is a client error — no retries, raises on first attempt."""
        mock_client = MagicMock()
        mock_client.request.return_value = _make_response(404)
        mock_client.is_closed = False
        connector._sync_client = mock_client

        with pytest.raises(httpx.HTTPStatusError) as exc_info:
            connector._request_sync("POST", "https://example.test/endpoint")

        assert exc_info.value.response.status_code == 404
        assert mock_client.request.call_count == 1

    def test_timeout_retries_three_times(self, connector: BaseConnector) -> None:
        """TimeoutException triggers the predicate and exhausts all 3 attempts."""
        mock_client = MagicMock()
        mock_client.request.side_effect = httpx.TimeoutException("request timed out")
        mock_client.is_closed = False
        connector._sync_client = mock_client

        with pytest.raises(httpx.TimeoutException):
            connector._request_sync("POST", "https://example.test/endpoint")

        assert mock_client.request.call_count == 3

    def test_2xx_returns_successfully(self, connector: BaseConnector) -> None:
        """Happy path: 200 response returned without retries."""
        mock_client = MagicMock()
        mock_client.request.return_value = _make_response(200)
        mock_client.is_closed = False
        connector._sync_client = mock_client

        response = connector._request_sync("POST", "https://example.test/endpoint")

        assert response.status_code == 200
        assert mock_client.request.call_count == 1


class TestClientContextWiring:
    """Verify BaseConnector accepts ClientContext and prefers it over settings."""

    def test_legacy_settings_path_still_works(self) -> None:
        """Existing callers that pass settings= continue to work unchanged."""
        from audit_platform.config import Settings

        bc = BaseConnector(settings=Settings(_env_file=None, DATAFORSEO_LOGIN="legacy"))
        assert bc.settings.DATAFORSEO_LOGIN == "legacy"
        assert bc.ctx is None

    def test_ctx_path_populates_settings(self, tmp_path) -> None:
        """When ctx is passed, BaseConnector reads its settings from the ctx."""
        from audit_platform.config.client_context import ClientContext

        client_dir = tmp_path / "clients" / "demo"
        client_dir.mkdir(parents=True)
        (client_dir / ".env").write_text("DATAFORSEO_LOGIN=via-ctx\n")
        ctx = ClientContext.from_slug("demo", repo_root=tmp_path)

        bc = BaseConnector(ctx=ctx)
        assert bc.ctx is ctx
        assert bc.settings.DATAFORSEO_LOGIN == "via-ctx"

    def test_ctx_wins_over_explicit_settings(self, tmp_path) -> None:
        """When both ctx and settings are passed, ctx's settings are used."""
        from audit_platform.config import Settings
        from audit_platform.config.client_context import ClientContext

        client_dir = tmp_path / "clients" / "demo"
        client_dir.mkdir(parents=True)
        (client_dir / ".env").write_text("DATAFORSEO_LOGIN=ctx-wins\n")
        ctx = ClientContext.from_slug("demo", repo_root=tmp_path)

        loser = Settings(_env_file=None, DATAFORSEO_LOGIN="should-lose")
        bc = BaseConnector(settings=loser, ctx=ctx)
        assert bc.settings.DATAFORSEO_LOGIN == "ctx-wins"

    def test_no_args_defaults_to_settings(self) -> None:
        """Bare BaseConnector() falls back to a default Settings()."""
        bc = BaseConnector()
        assert bc.ctx is None
        assert bc.settings.DATAFORSEO_LOGIN == ""
