from __future__ import annotations

from typing import Any, Callable, TypeVar

import structlog
from tenacity import (
    RetryCallState,
    retry as tenacity_retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

logger = structlog.get_logger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


def _log_retry(retry_state: RetryCallState) -> None:
    logger.warning(
        "retrying_call",
        attempt=retry_state.attempt_number,
        fn=getattr(retry_state.fn, "__name__", str(retry_state.fn)),
    )


def retry(
    max_attempts: int = 3,
    min_wait: float = 1.0,
    max_wait: float = 30.0,
    retry_on: tuple[type[Exception], ...] = (Exception,),
) -> Callable[[F], F]:
    def decorator(func: F) -> F:
        wrapped = tenacity_retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(min=min_wait, max=max_wait),
            retry=retry_if_exception_type(retry_on),
            before_sleep=_log_retry,
            reraise=True,
        )(func)
        return wrapped  # type: ignore[return-value]

    return decorator
