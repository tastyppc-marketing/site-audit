"""Client-scoped context wrapper around platform Settings.

Loads credentials from clients/<slug>/.env explicitly via dotenv_values()
WITHOUT mutating os.environ. Combined with client-config.json metadata
(domain, name, competitors, etc.), this becomes the single object every
analyzer/connector reads from when running a client audit.

The previous flow relied on `cd clients/<slug>` so that pydantic Settings
would happen to read the right .env via its env_file=".env" config — that
implicit, cwd-coupled behavior is the unsafe path being closed.

Usage:
    ctx = ClientContext.from_slug("matt-wallmow")
    print(ctx.DATAFORSEO_LOGIN)        # proxies to ctx.settings
    print(ctx.client_config["domain"]) # raw config metadata
    print(ctx.client_root)             # Path("clients/matt-wallmow")
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from dotenv import dotenv_values

from audit_platform.config.settings import Settings


class ClientContext:
    """Per-client runtime context.

    Holds a pydantic Settings instance built from a per-client .env plus
    the parsed client-config.json. Attribute access is proxied to settings,
    so call sites that previously read ``settings.DATAFORSEO_LOGIN`` can
    read ``ctx.DATAFORSEO_LOGIN`` unchanged.
    """

    def __init__(
        self,
        slug: str,
        client_root: Path,
        client_config: dict[str, Any],
        settings: Settings,
    ) -> None:
        self.slug = slug
        self.client_root = client_root
        self.client_config = client_config
        self.settings = settings

    @classmethod
    def from_slug(
        cls,
        slug: str,
        repo_root: Path | None = None,
    ) -> "ClientContext":
        """Build a ClientContext for ``slug``.

        Reads ``clients/<slug>/.env`` via ``dotenv_values`` (no os.environ
        mutation) and ``clients/<slug>/client-config.json``. Both files are
        optional — missing .env yields a Settings with default-empty fields,
        missing client-config.json yields an empty dict. Callers handle
        empty/None field values themselves.
        """
        root = repo_root if repo_root is not None else Path.cwd()
        client_root = root / "clients" / slug
        env_path = client_root / ".env"
        config_path = client_root / "client-config.json"

        env_values: dict[str, str] = {}
        if env_path.exists():
            env_values = {
                k: v for k, v in dotenv_values(env_path).items()
                if v is not None and v != ""
            }

        # Pass _env_file=None so pydantic-settings doesn't fall back to reading
        # whatever .env happens to be in cwd. Field values come strictly from
        # the client's .env via the kwargs above.
        settings = Settings(_env_file=None, **env_values)

        config: dict[str, Any] = {}
        if config_path.exists():
            try:
                config = json.loads(config_path.read_text())
            except (json.JSONDecodeError, OSError):
                config = {}

        return cls(
            slug=slug,
            client_root=client_root,
            client_config=config,
            settings=settings,
        )

    def __getattr__(self, name: str) -> Any:
        """Proxy attribute access to settings.

        Lets call sites read ``ctx.DATAFORSEO_LOGIN`` directly. Only invoked
        when the attribute isn't defined on ClientContext itself.
        """
        return getattr(self.settings, name)
