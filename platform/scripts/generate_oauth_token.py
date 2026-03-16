#!/usr/bin/env python3
"""Generate an OAuth2 refresh token for the audit platform.

This script runs the Google OAuth2 consent flow via a local web server. After
the user grants access in their browser, the resulting refresh token is printed
to stdout so it can be copied into the .env file.

Usage:
    python scripts/generate_oauth_token.py \
        --client-secrets-file path/to/client_secret.json

    # Override default scopes (comma-separated):
    python scripts/generate_oauth_token.py \
        --client-secrets-file client_secret.json \
        --scopes "https://www.googleapis.com/auth/adwords,https://www.googleapis.com/auth/analytics.readonly"

    # Use a custom local port for the redirect server:
    python scripts/generate_oauth_token.py \
        --client-secrets-file client_secret.json \
        --port 9090
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Default scopes required by the platform connectors.
DEFAULT_SCOPES = [
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/business.manage",
]


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the Google OAuth2 consent flow and print a refresh token.",
    )
    parser.add_argument(
        "--client-secrets-file",
        required=True,
        type=Path,
        help="Path to the client_secret.json file downloaded from Google Cloud Console.",
    )
    parser.add_argument(
        "--scopes",
        default=None,
        help=(
            "Comma-separated list of OAuth scopes. "
            "Defaults to all scopes needed by the platform."
        ),
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8080,
        help="Local port for the OAuth redirect server (default: 8080).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)

    # ------------------------------------------------------------------
    # Validate the secrets file before importing heavy libraries
    # ------------------------------------------------------------------
    secrets_path: Path = args.client_secrets_file
    if not secrets_path.exists():
        print(f"Error: client secrets file not found: {secrets_path}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Import here so the --help text is fast even without google libs
    # ------------------------------------------------------------------
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print(
            "Error: google-auth-oauthlib is not installed.\n"
            "Run:  pip install google-auth-oauthlib",
            file=sys.stderr,
        )
        sys.exit(1)

    scopes = args.scopes.split(",") if args.scopes else DEFAULT_SCOPES

    print("Starting OAuth consent flow...")
    print(f"  Secrets file : {secrets_path}")
    print(f"  Scopes       : {scopes}")
    print(f"  Redirect port: {args.port}")
    print()
    print("A browser window will open. Sign in with the Google account that has")
    print("access to the Ads, Analytics, Search Console, and Business Profile")
    print("properties you want to audit.")
    print()

    flow = InstalledAppFlow.from_client_secrets_file(
        str(secrets_path),
        scopes=scopes,
    )
    credentials = flow.run_local_server(port=args.port, open_browser=True)

    if not credentials.refresh_token:
        print(
            "Warning: No refresh token was returned. This can happen if the user "
            "has already granted consent for these scopes. Try revoking access at "
            "https://myaccount.google.com/permissions and running this script again.",
            file=sys.stderr,
        )
        sys.exit(1)

    print()
    print("=" * 60)
    print("  SUCCESS -- Copy the following into your .env file:")
    print("=" * 60)
    print()
    print(f"  GOOGLE_REFRESH_TOKEN={credentials.refresh_token}")
    print()
    print(f"  GOOGLE_CLIENT_ID={credentials.client_id}")
    print(f"  GOOGLE_CLIENT_SECRET={credentials.client_secret}")
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
