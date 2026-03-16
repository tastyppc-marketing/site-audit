from __future__ import annotations

from pathlib import Path
from typing import Sequence

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

DEFAULT_SCOPES: list[str] = [
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/business.manage",
]


def get_oauth_credentials(
    client_id: str,
    client_secret: str,
    refresh_token: str,
    scopes: Sequence[str] | None = None,
) -> Credentials:
    return Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=list(scopes or DEFAULT_SCOPES),
    )


def run_oauth_consent_flow(
    client_secrets_file: str | Path,
    scopes: Sequence[str] | None = None,
    port: int = 8080,
) -> Credentials:
    flow = InstalledAppFlow.from_client_secrets_file(
        str(client_secrets_file),
        scopes=list(scopes or DEFAULT_SCOPES),
    )
    credentials = flow.run_local_server(port=port, open_browser=True)
    return credentials
