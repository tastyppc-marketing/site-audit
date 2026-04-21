from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx
import structlog
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from audit_platform.config import Settings

logger = structlog.get_logger(__name__)


def _retry_on_transient(exc: BaseException) -> bool:
    """Retry on transport-level errors, timeouts, and HTTP 5xx responses."""
    if isinstance(exc, (httpx.TransportError, httpx.TimeoutException)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return 500 <= exc.response.status_code < 600
    return False


class BaseConnector:
    """Abstract base for all API connectors.

    Provides shared settings, async/sync HTTP clients with retry logic,
    structured logging, and configurable rate limiting.
    """

    def __init__(
        self,
        settings: Settings | None = None,
        requests_per_second: float = 10.0,
    ) -> None:
        self.settings = settings or Settings()
        self.log = structlog.get_logger(self.__class__.__name__)
        self._async_client: httpx.AsyncClient | None = None
        self._sync_client: httpx.Client | None = None
        self._requests_per_second = requests_per_second
        self._min_interval = 1.0 / requests_per_second if requests_per_second > 0 else 0.0
        self._last_request_time: float = 0.0
        self._lock = asyncio.Lock()

    @property
    def async_client(self) -> httpx.AsyncClient:
        if self._async_client is None or self._async_client.is_closed:
            self._async_client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.settings.HTTP_TIMEOUT),
            )
        return self._async_client

    @property
    def sync_client(self) -> httpx.Client:
        if self._sync_client is None or self._sync_client.is_closed:
            self._sync_client = httpx.Client(
                timeout=httpx.Timeout(self.settings.HTTP_TIMEOUT),
            )
        return self._sync_client

    async def _rate_limit(self) -> None:
        if self._min_interval <= 0:
            return
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_request_time
            if elapsed < self._min_interval:
                await asyncio.sleep(self._min_interval - elapsed)
            self._last_request_time = time.monotonic()

    def _rate_limit_sync(self) -> None:
        if self._min_interval <= 0:
            return
        now = time.monotonic()
        elapsed = now - self._last_request_time
        if elapsed < self._min_interval:
            time.sleep(self._min_interval - elapsed)
        self._last_request_time = time.monotonic()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(min=1, max=30),
        retry=retry_if_exception(_retry_on_transient),
        reraise=True,
    )
    async def _request(
        self,
        method: str,
        url: str,
        **kwargs: Any,
    ) -> httpx.Response:
        await self._rate_limit()
        self.log.debug("http_request", method=method, url=url)
        response = await self.async_client.request(method, url, **kwargs)
        self.log.debug(
            "http_response",
            method=method,
            url=url,
            status=response.status_code,
        )
        response.raise_for_status()
        return response

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(min=1, max=30),
        retry=retry_if_exception(_retry_on_transient),
        reraise=True,
    )
    def _request_sync(
        self,
        method: str,
        url: str,
        **kwargs: Any,
    ) -> httpx.Response:
        self._rate_limit_sync()
        self.log.debug("http_request_sync", method=method, url=url)
        response = self.sync_client.request(method, url, **kwargs)
        self.log.debug(
            "http_response_sync",
            method=method,
            url=url,
            status=response.status_code,
        )
        response.raise_for_status()
        return response

    async def close(self) -> None:
        if self._async_client is not None and not self._async_client.is_closed:
            await self._async_client.aclose()
        if self._sync_client is not None and not self._sync_client.is_closed:
            self._sync_client.close()

    def close_sync(self) -> None:
        if self._sync_client is not None and not self._sync_client.is_closed:
            self._sync_client.close()

    async def __aenter__(self) -> BaseConnector:
        return self

    async def __aexit__(self, *exc: Any) -> None:
        await self.close()

    def __enter__(self) -> BaseConnector:
        return self

    def __exit__(self, *exc: Any) -> None:
        self.close_sync()
