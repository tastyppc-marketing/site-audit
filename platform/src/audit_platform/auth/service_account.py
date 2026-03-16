from __future__ import annotations

from pathlib import Path
from typing import Sequence

from google.oauth2 import service_account

DEFAULT_SCOPES: list[str] = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/business.manage",
]


def get_service_account_credentials(
    json_path: str | Path,
    scopes: Sequence[str] | None = None,
) -> service_account.Credentials:
    return service_account.Credentials.from_service_account_file(
        str(json_path),
        scopes=list(scopes or DEFAULT_SCOPES),
    )
